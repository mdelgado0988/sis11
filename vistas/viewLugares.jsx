/**
 * @author aiden_sa_3
 * @created 2026-09-08
 * @summary Vista Lugares: navegacion geografica Pais > Provincia > Ciudad > Corregimiento > {Barriadas, Edificios}
 * @name viewLugares
 * @version 1.2.0
 * @issue AXX-342
 * @scope Alcance reducido: menu, viewport, Tree con relaciones verificadas, limpieza de contexto y
 *        acciones de alta, edicion y exportacion para Edificios y Barriadas.
 * @changelog 1.2.0 (2026-09-08):
 *   - Se agregan consulta contextual, alta, edicion y exportacion para Barriadas y Edificios.
 *   - Se conserva la estructura JSON de las tablas dinamicas al registrar nuevos elementos.
 * @changelog 1.1.0 (2026-09-08, FAIL ronda 1 del tester):
 *   - Carga paginada completa: antes se pedia una sola pagina y se perdian registros en silencio
 *     (ITALY devolvia 1000 de 4645). Ahora se recorren todas las paginas hasta cubrir `total`.
 *   - La barra de acciones esta SIEMPRE visible con los botones deshabilitados, tambien sin seleccion
 *     (CA-08 / CA-15), y el texto ya no promete que seleccionar habilite nada.
 *   - Se quita el gutter de la fila: sus margenes negativos desbordaban 6px en horizontal.
 */
() => {
  const { useState, useEffect } = React;
  const { Tree, Card, Button, Space, Alert, Empty, Typography, Tag, Row, Col, Spin, Table, Modal, Input, Select, message } = A;

  const PANEL_H = 'calc(100vh - 200px)';
  const PAGE_SIZE = 1000;
  const MAX_PAGES = 60; // tope de seguridad: 60k filas por rama

  const [treeData, setTreeData] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [loadingRoot, setLoadingRoot] = useState(true);
  const [rootError, setRootError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [catalogRows, setCatalogRows] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState(null);
  const [catalogModal, setCatalogModal] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState(null);
  const [catalogName, setCatalogName] = useState('');
  const [catalogSaving, setCatalogSaving] = useState(false);
  const [ambiguous, setAmbiguous] = useState(null);
  const [truncated, setTruncated] = useState(null);

  const txt = (v) => (v === null || v === undefined ? '' : String(v));

  // Recorre TODAS las paginas de un Repo* GET. El API responde `total` con el conteo real
  // aunque `size` recorte, asi que se pagina hasta cubrirlo. Sin esto la rama se carga
  // incompleta y en silencio.
  const loadAll = (cmd, filter, done) => {
    const acc = [];
    const step = (page) => {
      const data = { operation: 'GET', size: PAGE_SIZE, page: page };
      if (filter) data.filter = filter;
      exe(cmd, data)
        .then((r) => {
          const rows = (r.ok && r.outData) || [];
          for (let i = 0; i < rows.length; i++) acc.push(rows[i]);
          const total = typeof r.total === 'number' && r.total > 0 ? r.total : acc.length;
          if (rows.length === PAGE_SIZE && acc.length < total && page + 1 < MAX_PAGES) {
            step(page + 1);
          } else {
            done(acc, total);
          }
        })
        .catch(() => done(acc, acc.length));
    };
    step(0);
  };

  // Reemplaza los hijos del nodo con la clave dada, sin mutar el arreglo original.
  const withChildren = (list, key, children, extra) =>
    (list || []).map((n) => {
      if (n.key === key) {
        const copy = Object.assign({}, n, { children: children });
        if (extra) Object.assign(copy, extra);
        return copy;
      }
      if (n.children && n.children.length) {
        return Object.assign({}, n, { children: withChildren(n.children, key, children, extra) });
      }
      return n;
    });

  const mark = (list, key, extra) =>
    (list || []).map((n) => {
      if (n.key === key) return Object.assign({}, n, extra);
      if (n.children && n.children.length) {
        return Object.assign({}, n, { children: mark(n.children, key, extra) });
      }
      return n;
    });

  // Avisa si una rama quedo incompleta pese a la paginacion (tope de seguridad).
  const noteIfShort = (label, got, total) => {
    if (total > got) setTruncated({ label: label, got: got, total: total });
  };

  // ---------- carga de paises ----------
  const loadCountries = () => {
    setLoadingRoot(true);
    setRootError(null);
    loadAll('RepoCountryCatalog', null, (rows, total) => {
      if (!rows.length) {
        setRootError(t('No se pudo leer el catalogo de paises'));
        setLoadingRoot(false);
        return;
      }
      const list = rows.slice();
      // PANAMA primero, el resto alfabetico. Se reconoce por su registro nativo.
      list.sort((a, b) => {
        const an = txt(a.name).toUpperCase();
        const bn = txt(b.name).toUpperCase();
        const ap = an.indexOf('PANAM') === 0;
        const bp = bn.indexOf('PANAM') === 0;
        if (ap && !bp) return -1;
        if (bp && !ap) return 1;
        return an < bn ? -1 : an > bn ? 1 : 0;
      });
      setTreeData(
        list.map((c) => ({
          key: 'country|' + txt(c.code),
          title: txt(c.name),
          kind: 'country',
          realId: txt(c.code),
          code: txt(c.code),
          label: txt(c.name),
          isLeaf: false,
        }))
      );
      noteIfShort(t('Paises'), rows.length, total);
      setLoadingRoot(false);
    });
  };

  useEffect(() => {
    loadCountries();
  }, []);

  // ---------- carga bajo demanda ----------
  const onLoadData = (node) =>
    new Promise((resolve) => {
      const kind = node.kind;

      if (kind === 'country') {
        loadAll('RepoStateCatalog', "countryCode='" + node.code + "'", (rows, total) => {
          const kids = rows.map((s) => ({
            key: 'state|' + txt(s.id),
            title: txt(s.name),
            kind: 'state',
            realId: txt(s.id),
            code: txt(s.code),
            countryCode: node.code,
            countryName: node.label,
            stateName: txt(s.name),
            label: txt(s.name),
            isLeaf: false,
          }));
          setTreeData((prev) => withChildren(prev, node.key, kids));
          noteIfShort(node.label, rows.length, total);
          resolve();
        });
        return;
      }

      if (kind === 'state') {
        loadAll('RepoCityCatalog', "stateCode='" + node.code + "'", (rows, total) => {
          const kids = rows.map((c) => ({
            key: 'city|' + txt(c.id),
            title: txt(c.name),
            kind: 'city',
            realId: txt(c.id),
            code: txt(c.code),
            countryCode: node.countryCode,
            countryName: node.countryName,
            stateCode: node.code,
            stateName: node.label,
            cityName: txt(c.name),
            label: txt(c.name),
            isLeaf: false,
          }));
          setTreeData((prev) => withChildren(prev, node.key, kids));
          noteIfShort(node.label, rows.length, total);
          resolve();
        });
        return;
      }

      if (kind === 'city') {
        // Los corregimientos se vinculan con la ciudad por CODIGO, y el codigo de ciudad no es
        // unico en este ambiente. Si esta repetido, la rama es ambigua: se detiene la expansion
        // en lugar de mezclar ubicaciones distintas.
        exe('RepoCityCatalog', { operation: 'GET', filter: "code='" + node.code + "'", size: 50 })
          .then((r) => {
            const owners = (r.ok && r.outData) || [];
            if (owners.length > 1) {
              setTreeData((prev) => mark(prev, node.key, { isLeaf: true, ambiguousCount: owners.length }));
              setAmbiguous({ name: node.label, code: node.code, count: owners.length });
              setSelected(null);
              resolve();
              return;
            }
            loadAll('RepoSectorCatalog', "cityCode='" + node.code + "'", (rows, total) => {
              const kids = rows.map((s) => ({
                key: 'sector|' + txt(s.id),
                title: txt(s.name),
                kind: 'sector',
                realId: txt(s.id),
                code: txt(s.code),
                countryCode: node.countryCode,
                countryName: node.countryName,
                stateCode: node.stateCode,
                stateName: node.stateName,
                cityCode: node.code,
                cityName: node.label,
                label: txt(s.name),
                isLeaf: false,
              }));
              setTreeData((prev) => withChildren(prev, node.key, kids));
              noteIfShort(node.label, rows.length, total);
              resolve();
            });
          })
          .catch(() => resolve());
        return;
      }

      if (kind === 'sector') {
        const kids = [
          {
            key: 'barriadas|' + node.realId,
            title: t('Barriadas'),
            kind: 'barriadas',
            realId: node.realId,
            code: node.code,
            countryCode: node.countryCode,
            countryName: node.countryName,
            stateCode: node.stateCode,
            stateName: node.stateName,
            cityCode: node.cityCode,
            cityName: node.cityName,
            label: node.label,
            isLeaf: true,
          },
          {
            key: 'edificios|' + node.realId,
            title: t('Edificios'),
            kind: 'edificios',
            realId: node.realId,
            code: node.code,
            countryCode: node.countryCode,
            countryName: node.countryName,
            stateCode: node.stateCode,
            stateName: node.stateName,
            cityCode: node.cityCode,
            cityName: node.cityName,
            label: node.label,
            isLeaf: true,
          },
        ];
        setTreeData((prev) => withChildren(prev, node.key, kids));
        resolve();
        return;
      }

      resolve();
    });

  // ---------- seleccion: limpia siempre el contexto anterior ----------
  const onSelect = (keys, info) => {
    setAmbiguous(null);
    if (!keys.length) {
      setSelected(null);
      return;
    }
    const n = info.node;
    if (n.isLeaf !== true && expandedKeys.indexOf(n.key) === -1) {
      setExpandedKeys((prev) => prev.indexOf(n.key) === -1 ? prev.concat(n.key) : prev);
      if (!n.children || !n.children.length) onLoadData(n);
    }
    if (n.kind === 'barriadas' || n.kind === 'edificios') {
      const baseContext = { kind: n.kind, sectorId: n.realId, sectorCode: n.code, sectorName: n.label,
        countryCode: n.countryCode, countryName: n.countryName || n.countryCode, stateCode: n.stateCode,
        stateName: n.stateName || n.stateCode, cityCode: n.cityCode, cityName: n.cityName || n.cityCode };
      setSelected(baseContext);
      Promise.all([
        exe('RepoStateCatalog', { operation: 'GET', filter: "code='" + n.stateCode + "' AND countryCode='" + n.countryCode + "'", size: 1 }),
        exe('RepoCityCatalog', { operation: 'GET', filter: "code='" + n.cityCode + "' AND stateCode='" + n.stateCode + "'", size: 1 }),
      ]).then((responses) => {
        const state = responses[0] && responses[0].outData && responses[0].outData[0];
        const city = responses[1] && responses[1].outData && responses[1].outData[0];
        const context = Object.assign({}, baseContext, {
          stateName: state && state.name ? state.name : baseContext.stateName,
          cityName: city && city.name ? city.name : baseContext.cityName,
        });
        setSelected(context);
        loadCatalog(context);
      }).catch(() => loadCatalog(baseContext));
    } else {
      // Un ancestro no fija contexto de trabajo: se limpia el detalle.
      setSelected(null);
    }
  };

  const catalogTable = (context) => context && context.kind === 'barriadas' ? 'Barriadas' : 'Edificios';
  const catalogRow = (row, context) => context.kind === 'barriadas'
    ? { id: row[0], sectorId: row[1], sectorName: row[2], name: row[3], raw: row }
    : { countryCode: row[0], stateCode: row[1], cityCode: row[2], sectorCode: row[3], id: row[4], name: row[5], raw: row,
        stateName: context.stateName || context.stateCode, cityName: context.cityName || context.cityCode,
        sectorName: context.sectorName || context.sectorCode };

  const loadCatalog = (context) => {
    if (!context) return;
    setCatalogLoading(true);
    setCatalogError(null);
    exe('GetFullTable', { table: catalogTable(context) })
      .then((r) => {
        if (!r || r.ok === false) throw new Error((r && r.msg) || t('No se pudo cargar el catalogo'));
        const source = Array.isArray(r.outData) ? r.outData : [];
        const rows = source.filter((row) => Array.isArray(row) && row.length >= 4 &&
          (context.kind === 'barriadas'
            ? String(row[1]) === String(context.sectorId)
            : String(row[0]) === String(context.countryCode)
              && String(row[1]) === String(context.stateCode)
              && String(row[2]) === String(context.cityCode)
              && String(row[3]) === String(context.sectorCode)));
        setCatalogRows(rows.map((row) => catalogRow(row, context)));
      })
      .catch((e) => { setCatalogRows([]); setCatalogError(String(e.message || e)); })
      .then(() => setCatalogLoading(false));
  };

  useEffect(() => {
    setCatalogRows([]);
    setCatalogError(null);
    if (selected) loadCatalog(selected);
  }, [selected && selected.kind, selected && selected.sectorId]);

  const openCatalogModal = (row) => {
    setEditingCatalog(row || null);
    setCatalogName(row ? txt(row.name) : '');
    setCatalogModal(true);
  };

  const saveCatalog = () => {
    const name = String(catalogName || '').trim();
    if (!name) { message.error(t('El nombre es obligatorio')); return; }
    if (!selected || catalogSaving) return;
    setCatalogSaving(true);
    const table = catalogTable(selected);
    exe('DoQuery', { sql: "SELECT data FROM [Table] WHERE [name]='" + table + "'" })
      .then((response) => {
        if (!response || response.ok === false) throw new Error((response && response.msg) || t('No se pudo leer el catalogo'));
        const item = response.outData && response.outData[0];
        const tableData = item && (item.data !== undefined ? item.data : (item.Data !== undefined ? item.Data : item.DATA));
        const raw = typeof tableData === 'string' ? JSON.parse(tableData) : tableData || [];
        if (!Array.isArray(raw)) throw new Error(t('La estructura del catalogo no es valida'));
        const dataRows = raw.filter((row) => Array.isArray(row));
        const isBarriada = selected.kind === 'barriadas';
        const idIndex = isBarriada ? 0 : 4;
        const header = Array.isArray(raw[0]) ? raw[0] : [];
        const headerIndex = (name) => {
          const wanted = String(name).toLowerCase();
          for (let i = 0; i < header.length; i++) if (String(header[i]).toLowerCase() === wanted) return i;
          return -1;
        };
        const headerIndexAny = (names, fallback) => {
          for (let i = 0; i < names.length; i++) {
            const index = headerIndex(names[i]);
            if (index >= 0) return index;
          }
          return fallback;
        };
        let nextId = 1;
        dataRows.forEach((row) => { const id = Number(row[idIndex]); if (Number.isFinite(id) && id >= nextId) nextId = id + 1; });
        if (editingCatalog) {
          const original = Array.isArray(editingCatalog.raw) ? editingCatalog.raw : [];
          const current = dataRows.find((row) => Array.isArray(row) &&
            JSON.stringify(row) === JSON.stringify(original));
          if (!current) throw new Error(t('No se encontró el registro a actualizar'));
          current[isBarriada ? 3 : 5] = name;
        } else {
          const newRow = new Array(header.length || (isBarriada ? 4 : 6)).fill('');
          const setValue = (field, index, value) => {
            const target = header.length ? headerIndex(field) : index;
            if (target >= 0) newRow[target] = value;
          };
          if (isBarriada) {
            setValue('idStreet', 0, nextId);
            setValue('SectoreId', 1, selected.sectorId);
            setValue('SectorName', 2, selected.sectorName);
            setValue('STREET', 3, name);
          } else {
            // Se toma la ubicacion de un registro existente del mismo corregimiento
            // para conservar los codigos reales de Edificios aunque los catalogos
            // geograficos manejen identificadores distintos a los de esta tabla.
            const locationRow = dataRows.find((row) => Array.isArray(row) &&
              String(row[0]) === String(selected.countryCode) &&
              String(row[2]) === String(selected.cityCode) &&
              String(row[3]) === String(selected.sectorCode));
            const countryCode = locationRow ? locationRow[0] : selected.countryCode;
            const stateCode = locationRow ? locationRow[1] : selected.stateCode;
            const cityCode = locationRow ? locationRow[2] : selected.cityCode;
            const sectorCode = locationRow ? locationRow[3] : selected.sectorCode;
            newRow[headerIndexAny(['pais', 'countryCode'], 0)] = countryCode;
            newRow[headerIndexAny(['provincia', 'estado', 'stateCode'], 1)] = stateCode;
            newRow[headerIndexAny(['ciudad', 'distrito', 'cityCode'], 2)] = cityCode;
            newRow[headerIndexAny(['corregimiento', 'corregi', 'sectorCode'], 3)] = sectorCode;
            newRow[headerIndexAny(['edificio', 'id'], 4)] = nextId;
            newRow[headerIndexAny(['nombre', 'descripcion', 'name'], 5)] = name;
          }
          const statusIndex = headerIndex('estadoVigencia');
          if (statusIndex >= 0) newRow[statusIndex] = 'S';
          raw.push(newRow);
        }
        const json = JSON.stringify(raw).replace(/'/g, "''");
        return exe('DoQuery', { sql: "UPDATE [Table] SET data='" + json + "' WHERE [name]='" + table + "'" })
          .then((updateResponse) => {
            if (!updateResponse || updateResponse.ok === false) {
              throw new Error((updateResponse && updateResponse.msg) || t('No se pudo guardar el registro'));
            }
            return exe('GetFullTable', { table: table });
          });
      })
      .then((response) => {
        if (!response || response.ok === false) throw new Error((response && response.msg) || t('No se pudo verificar el registro guardado'));
        const updatedRows = Array.isArray(response.outData) ? response.outData : [];
        const original = editingCatalog && Array.isArray(editingCatalog.raw) ? editingCatalog.raw : [];
        if (editingCatalog && !updatedRows.some((row) => Array.isArray(row) &&
          row[0] === original[0] && row[2] === original[2] && row[3] === original[3] &&
          row[4] === original[4] && row[selected.kind === 'barriadas' ? 3 : 5] === String(catalogName).trim())) {
          throw new Error(t('El registro no pudo verificarse después de guardar'));
        }
        setCatalogModal(false);
        message.success(editingCatalog ? t('Registro actualizado') : t('Registro creado'));
        loadCatalog(selected);
      })
      .catch((e) => setCatalogError(String(e.message || e)))
      .then(() => setCatalogSaving(false));
  };

  // ---------- area central ----------
  const actionsEnabled = Boolean(selected);
  const entityName = selected && selected.kind === 'edificios' ? t('Edificios') : t('Barriadas');
  const exportCatalog = () => {
    if (!selected || !catalogRows.length) return;
    const headers = selected.kind === 'barriadas'
      ? [t('Id'), t('Corregimiento'), t('Barriada')]
      : [t('Provincia'), t('Ciudad'), t('Corregimiento'), t('Id'), t('Edificio')];
    const values = catalogRows.map((row) => selected.kind === 'barriadas'
      ? [row.id, row.sectorName, row.name]
      : [row.stateName || row.stateCode, row.cityName || row.cityCode, row.sectorName || row.sectorCode, row.id, row.name]);
    const quote = (value) => '"' + String(value == null ? '' : value).replace(/"/g, '""') + '"';
    const csv = [headers].concat(values).map((line) => line.map(quote).join(',')).join('\r\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    link.download = entityName + '.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  // La barra va SIEMPRE visible: el usuario tiene que ver que las acciones existen y que
  // estan deshabilitadas, no que desaparecen.
  const renderBar = () => (
    <div style={{ marginBottom: 12 }}>
      <Space wrap>
        <Button type="primary" disabled={!actionsEnabled} onClick={() => openCatalogModal(null)}>
          {t('Nuevo')}
        </Button>
        <Button disabled={!actionsEnabled || !catalogRows.length} onClick={exportCatalog}>{t('Exportar')}</Button>
        {selected ? (
          <Typography.Text type="secondary">
            {t('Corregimiento') + ': ' + selected.sectorName + ' (id ' + selected.sectorId + ') — ' + entityName}
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary">{t('Sin contexto seleccionado')}</Typography.Text>
        )}
      </Space>
    </div>
  );

  const renderBody = () => {
    if (ambiguous) {
      return (
        <Alert
          type="warning"
          showIcon
          message={t('Rama no expandible: relacion geografica ambigua')}
          description={
            t('La ciudad') + ' "' + ambiguous.name + '" ' +
            t('comparte su codigo') + ' "' + ambiguous.code + '" ' +
            t('con otras del catalogo') + ' (' + ambiguous.count + '). ' +
            t('Los corregimientos se vinculan por codigo, de modo que expandir esta rama mezclaria ubicaciones distintas. Se detiene la expansion y la dependencia queda registrada para el SA.')
          }
        />
      );
    }

    if (!selected) {
      return (
        <Empty
          description={t('Seleccione pais, provincia, ciudad y corregimiento, y luego el nodo Barriadas o Edificios para fijar el contexto.')}
        />
      );
    }

    const columns = selected.kind === 'barriadas'
      ? [
          { title: t('Id'), dataIndex: 'id', key: 'id', width: 100 },
          { title: t('Corregimiento'), dataIndex: 'sectorName', key: 'sectorName' },
          { title: t('Barriada'), dataIndex: 'name', key: 'name' },
        ]
      : [
          { title: t('Provincia'), dataIndex: 'stateName', key: 'stateName', width: 150 },
          { title: t('Ciudad'), dataIndex: 'cityName', key: 'cityName', width: 150 },
          { title: t('Corregimiento'), dataIndex: 'sectorName', key: 'sectorName', width: 170 },
          { title: t('Id'), dataIndex: 'id', key: 'id', width: 100 },
          { title: t('Edificio'), dataIndex: 'name', key: 'name' },
        ];
    columns.push({ title: t('Acciones'), key: 'actions', width: 100,
      render: (_, row) => <Button type="link" size="small" onClick={() => openCatalogModal(row)}>{t('Editar')}</Button> });
    return <Spin spinning={catalogLoading}><Table size="small" rowKey={(row) => String(row.id)} columns={columns}
      dataSource={catalogRows} locale={{ emptyText: t('No hay registros para el corregimiento seleccionado') }}
      pagination={{ pageSize: 20, showSizeChanger: false }} /></Spin>;
  };

  const titleRender = (node) =>
    node.ambiguousCount ? (
      <span>
        {node.title} <Tag color="orange">{t('rama ambigua')}</Tag>
      </span>
    ) : (
      <span>{node.title}</span>
    );

  return (
    <DefaultPage title={t('Lugares')}>
      <Row>
        <Col span={8} style={{ paddingRight: 6 }}>
          <Card size="small" title={t('Ubicacion geografica')} bodyStyle={{ height: PANEL_H, overflow: 'auto' }}>
            {loadingRoot ? <Spin /> : null}
            {rootError ? <Alert type="error" showIcon message={rootError} /> : null}
            {!loadingRoot && !rootError ? (
              <Tree
                treeData={treeData}
                expandedKeys={expandedKeys}
                onExpand={(keys) => setExpandedKeys(keys)}
                loadData={onLoadData}
                onSelect={onSelect}
                titleRender={titleRender}
                blockNode
              />
            ) : null}
          </Card>
        </Col>
        <Col span={16} style={{ paddingLeft: 6 }}>
          <Card size="small" title={t('Detalle')} bodyStyle={{ height: PANEL_H, overflow: 'auto' }}>
            {renderBar()}
            {catalogError ? <Alert type="error" showIcon style={{ marginBottom: 12 }} message={catalogError} /> : null}
            {truncated ? (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 12 }}
                message={t('Rama cargada de forma incompleta')}
                description={
                  t('Se cargaron') + ' ' + truncated.got + ' ' + t('de') + ' ' + truncated.total + ' ' +
                  t('registros de') + ' ' + truncated.label + '.'
                }
              />
            ) : null}
            {renderBody()}
          </Card>
        </Col>
      </Row>
      <Modal
        title={editingCatalog ? t('Editar') + ' ' + entityName : t('Nuevo') + ' ' + entityName}
        visible={catalogModal}
        onOk={saveCatalog}
        onCancel={() => { if (!catalogSaving) setCatalogModal(false); }}
        okText={t('Guardar')}
        cancelText={t('Cancelar')}
        confirmLoading={catalogSaving}
        destroyOnClose
      >
        <div style={{ marginBottom: 14 }}>
          <Typography.Text type="secondary">{t('Corregimiento')}</Typography.Text>
          <Input value={selected ? selected.sectorName : ''} disabled style={{ marginTop: 4 }} />
        </div>
        <div>
          <Typography.Text>{entityName}</Typography.Text>
          <Input value={catalogName} maxLength={200} onChange={(e) => setCatalogName(e.target.value)} style={{ marginTop: 4 }} autoFocus />
        </div>
        {catalogError ? <Alert type="error" showIcon message={catalogError} style={{ marginTop: 14 }} /> : null}
      </Modal>
    </DefaultPage>
  );
};
