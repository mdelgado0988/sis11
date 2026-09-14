SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;
    SET IDENTITY_INSERT dbo.LiveView ON;

    INSERT INTO dbo.LiveView (id, name, code, category, operation, multiComponent) VALUES (41, N'viewGruposEconomicos', N'/**
 * @author aiden_sa_3
 * @created 2026-09-03
 * @summary Mantenimiento del catálogo de grupos económicos (cfgGrupoEconomico)
 * @name viewGruposEconomicos
 * @version 1.1.0
 * @issue AXX-233
 */
() => {
  const { useState, useEffect } = React;
  const { Table, Button, Modal, Input, Select, Card, Space, Alert, Tag, Popconfirm, message } = A;

  const TABLE_NAME = ''cfgGrupoEconomico'';
  const HEADER = [''Id'', ''Nombre'', ''Vigente''];
  const MAX_NOMBRE = 200;
  // Marca que el formulario 609 escribe en el contacto. Permite localizar
  // los contactos de un grupo sin depender del orden de serialización.
  const tagOf = (id) => ''GEC#'' + id + ''#'';

  const [rows, setRows] = useState([]);
  const [tableId, setTableId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [nombre, setNombre] = useState('''');
  const [vigente, setVigente] = useState(''1'');
  const [formError, setFormError] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // ---------- lectura ----------
  const parseRows = (outData) => {
    const arr = Array.isArray(outData) ? outData : [];
    return arr
      .slice(1)
      .filter((r) => Array.isArray(r) && r.some((c) => c !== null && String(c).trim() !== ''''))
      .map((r) => ({
        Id: String(r[0] === null || r[0] === undefined ? '''' : r[0]).trim(),
        Nombre: String(r[1] === null || r[1] === undefined ? '''' : r[1]).trim(),
        Vigente: String(r[2] === null || r[2] === undefined ? '''' : r[2]).trim() === ''1'' ? ''1'' : ''0'',
      }));
  };

  const readFresh = () =>
    exe(''GetFullTable'', { table: TABLE_NAME }).then((r) => {
      if (!r.ok) throw new Error(r.msg || ''No se pudo leer el catálogo'');
      return parseRows(r.outData);
    });

  const load = () => {
    setLoading(true);
    setLoadError(null);
    return exe(''GetTableNames'', {})
      .then((r) => {
        const t = (r.outData || []).filter((x) => x.name === TABLE_NAME)[0];
        if (!t) throw new Error(''No existe la tabla '' + TABLE_NAME + '' en este ambiente'');
        setTableId(t.id);
        return readFresh();
      })
      .then(setRows)
      .catch((e) => setLoadError(String(e.message || e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // ---------- escritura ----------
  // AddOrUpdateTable reemplaza la tabla entera: se relee siempre justo antes
  // de escribir para no pisar lo que otro usuario haya guardado.
  const persist = (list) => {
    const data = [HEADER].concat(
      list.map((x) => [String(x.Id), String(x.Nombre), String(x.Vigente)])
    );
    return exe(''AddOrUpdateTable'', {
      id: tableId,
      name: TABLE_NAME,
      data: JSON.stringify(data),
    }).then((r) => {
      if (!r.ok) throw new Error(r.msg || ''No se pudo guardar'');
      return r;
    });
  };

  const nextId = (list) => {
    const nums = list.map((x) => parseInt(x.Id, 10)).filter((n) => !isNaN(n));
    return nums.length === 0 ? 1 : Math.max.apply(null, nums) + 1;
  };

  // ---------- alta / edición ----------
  const openNew = () => {
    setEditing(null); setNombre(''''); setVigente(''1''); setFormError(null); setOpen(true);
  };
  const openEdit = (row) => {
    setEditing(row); setNombre(row.Nombre); setVigente(row.Vigente); setFormError(null); setOpen(true);
  };

  const validate = (value) => {
    const v = String(value === null || value === undefined ? '''' : value).trim();
    if (!v) return ''El nombre es obligatorio.'';
    if (v.length > MAX_NOMBRE) {
      return ''El nombre no puede superar '' + MAX_NOMBRE + '' caracteres: tiene '' + v.length +
        ''. Recórtelo antes de guardar — no se guarda cortado.'';
    }
    return null;
  };

  const largo = String(nombre || '''').trim().length;
  const excedido = largo > MAX_NOMBRE;

  const persistSave = () => {
    const err = validate(nombre);
    if (err) { setFormError(err); return; }   // conserva lo capturado: no cierra el modal
    setBusy(true);
    setFormError(null);
    readFresh()
      .then((fresh) => {
        let list;
        if (editing) {
          if (!fresh.some((x) => x.Id === editing.Id)) {
            throw new Error(''El grupo '' + editing.Id + '' ya no existe: fue eliminado por otro usuario.'');
          }
          list = fresh.map((x) =>
            x.Id === editing.Id
              ? { Id: x.Id, Nombre: String(nombre).trim(), Vigente: vigente }
              : x
          );
        } else {
          const id = nextId(fresh);
          if (fresh.some((x) => String(x.Id) === String(id))) {
            throw new Error(''El Id '' + id + '' ya está en uso. Reintente.'');
          }
          list = fresh.concat([{ Id: String(id), Nombre: String(nombre).trim(), Vigente: vigente }]);
        }
        return persist(list).then(() => list);
      })
      .then((list) => {
        setRows(list);
        setOpen(false);
        message.success(editing ? ''Grupo actualizado.'' : ''Grupo creado.'');
      })
      .catch((e) => setFormError(String(e.message || e)))
      .finally(() => setBusy(false));
  };

  const save = () => {
    if (vigente !== ''0'' && vigente !== ''1'') { setFormError(t(''Seleccione una vigencia válida'')); return; }
    if (editing && editing.Vigente !== vigente) {
      Modal.confirm({ title: t(''Confirmar cambio de vigencia''), content: t(vigente === ''0'' ? ''El grupo quedará no vigente. Se conservarán sus relaciones e histórico.'' : ''El grupo volverá a estar vigente.''), okText: t(''Confirmar''), cancelText: t(''Cancelar''), onOk: persistSave });
    } else persistSave();
  };
  // ---------- render ----------
  const columns = [
    {
      title: ''Id'', dataIndex: ''Id'', key: ''Id'', width: 90,
      sorter: (a, b) => (parseInt(a.Id, 10) || 0) - (parseInt(b.Id, 10) || 0),
      defaultSortOrder: ''ascend'',
    },
    // Un nombre largo no debe empujar las demás columnas fuera de la pantalla.
    {
      title: ''Nombre'', dataIndex: ''Nombre'', key: ''Nombre'', ellipsis: true,
      render: (v) => <span title={v}>{v}</span>,
    },
    {
      title: ''Vigente'', dataIndex: ''Vigente'', key: ''Vigente'', width: 110,
      render: (v) => (v === ''1'' ? <Tag color="green">{t(''Vigente'')}</Tag> : <Tag>{t(''No vigente'')}</Tag>),
    },
    {
      title: ''Acciones'', key: ''acciones'', width: 190,
      render: (text, row) => (
        <Space>
          <Button size="small" onClick={() => openEdit(row)}>Editar</Button>
        </Space>
      ),
    },
  ];

  return (
    <DefaultPage title="Grupos económicos" icon="apartment">
      <Card
        bordered
        title={t(''Administración de grupos económicos'')}
        extra={
          <Space>
            <Button onClick={load} disabled={loading || busy}>Refrescar</Button>
            <Button type="primary" onClick={openNew} disabled={loading || busy || !tableId}>
              Nuevo grupo
            </Button>
          </Space>
        }>
        {loadError ? <Alert type="error" message={loadError} style={{ marginBottom: 10 }} /> : null}
        <Table
          rowKey="Id"
          size="small"
          tableLayout="fixed"
          loading={loading || busy}
          dataSource={rows}
          columns={columns}
          locale={{ emptyText: ''El catálogo está vacío. Use «Nuevo grupo» para crear el primero.'' }}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
        />
      </Card>

      <Modal
        visible={open}
        title={editing ? ''Editar grupo económico '' + editing.Id : ''Nuevo grupo económico''}
        okText="Guardar"
        cancelText="Cancelar"
        confirmLoading={busy}
        onOk={save}
        onCancel={() => setOpen(false)}
        maskClosable={false}>
        {formError ? <Alert type="error" message={formError} style={{ marginBottom: 10 }} /> : null}
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: ''block'', fontWeight: 500 }}>
            Nombre <span style={{ color: ''#f5222d'' }}>*</span>
          </label>
          {/* Sin maxLength a propósito: recortar en silencio guardaría un nombre
              distinto del que el usuario escribió. Se conserva lo capturado y se
              rechaza al guardar, diciendo por qué. */}
          <Input
            value={nombre}
            placeholder="Nombre del grupo económico"
            onChange={(e) => { setNombre(e.target.value); if (formError) setFormError(null); }}
          />
          <div style={{ textAlign: ''right'', fontSize: 12, color: excedido ? ''#f5222d'' : ''#999'' }}>
            {largo} / {MAX_NOMBRE}{excedido ? '' — excede el máximo'' : ''''}
          </div>
        </div>
        <div>
          <label style={{ display: ''block'', fontWeight: 500 }}>Vigente</label>
          <Select value={vigente} style={{ width: 160 }} onChange={setVigente}>
            <Select.Option value="1">Sí</Select.Option>
            <Select.Option value="0">No</Select.Option>
          </Select>
        </div>
        {editing ? (
          <div style={{ marginTop: 10, fontSize: 12, color: ''#999'' }}>
            El Id ({editing.Id}) no cambia al editar.
          </div>
        ) : null}
      </Modal>
    </DefaultPage>
  );
}
', NULL, NULL, 0);

    INSERT INTO dbo.LiveView (id, name, code, category, operation, multiComponent) VALUES (42, N'ProceedOrderEndorsement', N'/**
 * @author Michael Delgado
 * @email michael.delgado@axxis-systems.com
 * @created 2026/09/07
 * @name ProceedOrderEndorsement
 * @version 1.0
 * @purpose: Manage proceed-order endorsements by calculating coverage validity changes,
 * executing the ChangeCoverage endorsement, and synchronizing insured-object data.
 */
() => {
  const { Card, Row, Col, Form, DatePicker, Input, Button, Table, Descriptions, Alert, Tag, Skeleton, Space, Divider, Popconfirm, message } = A;

  // ---------------------------------------------------------------- utilities
  // Date rule (§2.3): every date is handled as a CALENDAR date in the browser
  // local zone, normalised to local midnight. Date-only values stay unchanged;
  // timestamp values with an explicit zone are converted to the browser locale.
  const toLocalDate = (value) => {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }
    if (value && typeof value.toDate === ''function'') {
      const m = value.toDate();
      return new Date(m.getFullYear(), m.getMonth(), m.getDate());
    }
    const rawValue = String(value);
    // ISO timestamps with an explicit zone must be converted to the browser''s
    // local calendar date before comparison. Date-only values are already
    // calendar dates and must not be shifted by the browser timezone.
    if (rawValue.includes(''T'') && /(?:Z|[+-]\d{2}:?\d{2})$/.test(rawValue)) {
      const instant = new Date(rawValue);
      if (!Number.isNaN(instant.getTime())) {
        return new Date(instant.getFullYear(), instant.getMonth(), instant.getDate());
      }
    }
    const raw = rawValue.slice(0, 10);
    const parts = raw.split(''-'');
    if (parts.length !== 3) return null;
    const y = Number(parts[0]), mo = Number(parts[1]), d = Number(parts[2]);
    if (!y || !mo || !d) return null;
    return new Date(y, mo - 1, d);
  };
  const fmt = (date) => {
    if (!date) return '''';
    const p = (n) => (n < 10 ? ''0'' + n : String(n));
    return date.getFullYear() + ''-'' + p(date.getMonth() + 1) + ''-'' + p(date.getDate());
  };
  const fmtAtNoon = (value) => {
    const raw = String(value == null ? '''' : value).trim();
    const datePart = raw.match(/^\d{4}-\d{2}-\d{2}/);
    if (datePart) return datePart[0] + ''T12:00:00'';
    const calendarDate = toLocalDate(value);
    const calendar = fmt(calendarDate);
    return calendar ? calendar + ''T12:00:00'' : '''';
  };
  const toPolicyLocalDate = (value) => {
    if (!value) return null;
    if (value instanceof Date || (value && typeof value.toDate === ''function'')) return toLocalDate(value);
    const raw = String(value).trim();
    if (!raw) return null;
    // LifePolicy dates are persisted at midnight by the API. Apply the same
    // UTC-to-browser-local conversion used by the policy screens, including
    // responses that omit the explicit Z suffix.
    const source = /(?:Z|[+-]\d{2}:?\d{2})$/.test(raw)
      ? raw
      : (raw.includes(''T'') ? raw + ''Z'' : raw + ''T00:00:00Z'');
    const instant = new Date(source);
    if (Number.isNaN(instant.getTime())) return toLocalDate(raw);
    return new Date(instant.getFullYear(), instant.getMonth(), instant.getDate());
  };
  const DAY = 86400000;
  const daysBetween = (a, b) => (!a || !b ? null : Math.round((b.getTime() - a.getTime()) / DAY));
  const addDays = (date, n) => (!date || n == null ? null : new Date(date.getFullYear(), date.getMonth(), date.getDate() + n));
  const txt = (v) => String(v == null ? '''' : v).trim();
  const translatedMessage = (value, fallback) => value ? t(String(value)) : t(fallback);
  const billingFields = [
    { label: ''Coverages'', keys: [''coverages''] },
    { label: ''Surcharges'', keys: [''surcharges''] },
    { label: ''Discounts'', keys: [''discounts''] },
    { label: ''Annual premium'', keys: [''anualPremium'', ''annualPremium''] },
    { label: ''Tax'', keys: [''tax''] },
    { label: ''Annual total'', keys: [''anualTotal'', ''annualTotal''] },
    { label: ''Installment'', keys: [''installment''] },
    { label: ''Fee'', keys: [''fee''] },
  ];
  const getBillAmount = (bill, keys) => {
    const source = bill || {};
    const key = keys.find((item) => source[item] !== undefined && source[item] !== null);
    const value = key === undefined ? 0 : Number(source[key]);
    return Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
  };
  const validateBilling = (quoteData, currentBill) => {
    const quoteBill = quoteData && quoteData.Bill;
    const billDiff = quoteData && quoteData.BillDiff;
    if (!quoteBill || !billDiff || !currentBill) {
      return {
        ok: false,
        msg: t(''The calculation did not return Bill, BillDiff, or the current policy billing data.'')
      };
    }

    const diffErrors = billingFields
      .map((field) => ({
        label: t(field.label),
        value: getBillAmount(billDiff, field.keys)
      }))
      .filter((item) => item.value !== 0);

    const billErrors = billingFields
      .map((field) => ({
        label: t(field.label),
        current: getBillAmount(currentBill, field.keys),
        calculated: getBillAmount(quoteBill, field.keys)
      }))
      .filter((item) => item.current !== item.calculated);

    const details = [];
    if (diffErrors.length) {
      details.push(t(''BillDiff contains non-zero amounts: '') + diffErrors
        .map((item) => item.label + '' ('' + item.value.toFixed(2) + '')'')
        .join('', ''));
    }
    if (billErrors.length) {
      details.push(t(''Bill differs from the current policy billing: '') + billErrors
        .map((item) => item.label + '' ('' + item.current.toFixed(2) + '' → '' + item.calculated.toFixed(2) + '')'')
        .join('', ''));
    }

    return {
      ok: details.length === 0,
      msg: details.join('' '')
    };
  };
  const getCurrentPolicyBill = (currentPolicy) => {
    if (!currentPolicy) return null;
    if (currentPolicy.Bill) return currentPolicy.Bill;
    return {
      coverages: currentPolicy.coverages !== undefined
        ? currentPolicy.coverages
        : currentPolicy.anualPremium,
      surcharges: currentPolicy.surcharges,
      discounts: currentPolicy.discounts,
      anualPremium: currentPolicy.anualPremium,
      tax: currentPolicy.tax,
      anualTotal: currentPolicy.anualTotal,
      annualTotal: currentPolicy.annualTotal,
      installment: currentPolicy.installment,
      fee: currentPolicy.fee
    };
  };

  // ---------------------------------------------------------------- state
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('''');
  const [policy, setPolicy] = useState(null);
  const [coverages, setCoverages] = useState([]);
  const [cfgRows, setCfgRows] = useState([]);
  const [effectiveDate, setEffectiveDate] = useState(null);
  const [observation, setObservation] = useState('''');
  const [touched, setTouched] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [steps, setSteps] = useState([]);
  const [result, setResult] = useState(null);
  const [changeId, setChangeId] = useState(null);
  const [calculation, setCalculation] = useState(null);
  const [premiumValidationError, setPremiumValidationError] = useState('''');

  // The current system date, generated in the BROWSER local time zone (§2.1).
  const [systemDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

  const getPolicyId = () => {
    try {
      const href = String(window.location.href || '''').replace(''#/'', '''');
      const url = new URL(href);
      return Number(url.searchParams.get(''policyId'') || 0);
    } catch (e) {
      return 0;
    }
  };
  const policyId = getPolicyId();

  // ---------------------------------------------------------------- data load
  useEffect(() => {
    let cancelled = false;
    const load = async function () {
      setLoading(true);
      setLoadError('''');
      try {
        if (!policyId) {
          throw new Error(t(''No policy was supplied. Open this view with ?policyId=<id>.''));
        }
        const polRes = await exe(''RepoLifePolicy'', { operation: ''GET'', filter: ''id = '' + policyId, include: [''Product'', ''Coverages''] });
        if (!polRes || !polRes.ok) {
          throw new Error(translatedMessage(polRes && polRes.msg, ''The policy could not be loaded.''));
        }
        const pol = (polRes.outData || [])[0];
        if (!pol) throw new Error(t(''Policy not found: '') + policyId);

        const cfgRes = await exe(''GetFullTable'', { table: ''cfgCoberturaProductoReaFianza'' });
        if (!cfgRes || !cfgRes.ok) {
          throw new Error(translatedMessage(cfgRes && cfgRes.msg, ''The coverage configuration table could not be loaded.''));
        }
        const table = Array.isArray(cfgRes.outData) ? cfgRes.outData : [];
        if (table.length < 2) throw new Error(t(''cfgCoberturaProductoReaFianza returned no configuration rows.''));

        const header = table[0].map((h) => txt(h));
        const idx = {};
        header.forEach((h, i) => { if (idx[h] === undefined) idx[h] = i; });
        const iLob = idx.lobCode, iProd = idx.productCode, iCov = idx.coverageCode;
        const iDep = header.indexOf(''coverageCodeDep'');
        if (iLob === undefined || iProd === undefined || iCov === undefined || iDep < 0) {
          throw new Error(t(''cfgCoberturaProductoReaFianza does not have the expected columns.''));
        }
        const rows = table.slice(1)
          .filter((r) => txt(r[iLob]) === txt(pol.lob) && txt(r[iProd]) === txt(pol.productCode))
          .map((r) => ({ lobCode: txt(r[iLob]), productCode: txt(r[iProd]), coverageCode: txt(r[iCov]), coverageCodeDep: txt(r[iDep]) }));

        if (!cancelled) {
          setPolicy(pol);
          setCoverages(Array.isArray(pol.Coverages) ? pol.Coverages : []);
          setCfgRows(rows);
        }
      } catch (err) {
        if (!cancelled) setLoadError(translatedMessage(err && err.message ? err.message : String(err), ''The view could not be loaded.''));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [policyId]);

  useEffect(() => {
    const styleId = ''proceed-order-endorsement-grid-style'';
    if (document.getElementById(styleId)) return undefined;

    const style = document.createElement(''style'');
    style.id = styleId;
    style.textContent = `
      .proceed-order-endorsement-view .proceed-order-coverage-table {
        border: 1px solid #cbd1d8;
      }

      .proceed-order-endorsement-view .proceed-order-coverage-table .ant-table-thead > tr > th {
        background: #bfbfbf !important;
        border: 1px solid #cbd1d8 !important;
        color: #262626;
        font-size: 12px;
        line-height: 18px;
        padding: 5px 8px !important;
      }

      .proceed-order-endorsement-view .proceed-order-coverage-table .ant-table-tbody > tr > td {
        border-top: 1px solid #cbd1d8 !important;
        border-left: 0 !important;
        border-right: 0 !important;
        font-size: 12px;
        line-height: 18px;
        padding: 5px 8px !important;
      }

      .proceed-order-endorsement-view .proceed-order-coverage-table .ant-table-tbody > tr:hover > td {
        background: #b7d7ff !important;
      }

      .proceed-order-endorsement-view .proceed-order-summary-table .ant-descriptions-view {
        border: 1px solid #cbd1d8 !important;
      }

      .proceed-order-endorsement-view .proceed-order-summary-table .ant-descriptions-row > th,
      .proceed-order-endorsement-view .proceed-order-summary-table .ant-descriptions-row > td {
        border-color: #cbd1d8 !important;
        padding: 5px 8px !important;
        font-size: 12px;
        line-height: 18px;
      }

      .proceed-order-endorsement-view .proceed-order-summary-table .ant-descriptions-item-label {
        background: #bfbfbf !important;
        color: #262626;
        font-weight: 600;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const currentStyle = document.getElementById(styleId);
      if (currentStyle) currentStyle.remove();
    };
  }, []);

  // ------------------------------------------------- coverage date calculation
  // §2.3 + assumption 14: the main coverage is the configured row whose
  // coverageCodeDep equals its own coverageCode. An EMPTY coverageCodeDep means
  // "does not take part in the relationship" — it is NOT a main coverage.
  const model = (() => {
    if (!policy || !coverages.length || !cfgRows.length) return null;

    const cfgByCov = {};
    cfgRows.forEach((r) => { cfgByCov[r.coverageCode] = r; });

    const mainCfg = cfgRows.filter((r) => r.coverageCodeDep !== '''' && r.coverageCodeDep === r.coverageCode);
    if (mainCfg.length !== 1) {
      return { error: mainCfg.length === 0
        ? t(''No main coverage is configured for this product in cfgCoberturaProductoReaFianza.'')
        : t(''More than one main coverage is configured for this product: '') + mainCfg.map((r) => r.coverageCode).join('', '') };
    }
    const mainCode = mainCfg[0].coverageCode;

    const mainCov = coverages.find((c) => txt(c.code) === mainCode);
    if (!mainCov) return { error: t(''The configured main coverage ('') + mainCode + t('') is not present on this policy.'') };

    const curMainStart = toPolicyLocalDate(mainCov.start);
    const curMainEnd = toPolicyLocalDate(mainCov.end);
    if (!curMainStart || !curMainEnd) return { error: t(''The main coverage has no usable start/end dates.'') };

    const mainDuration = daysBetween(curMainStart, curMainEnd);
    const newMainStart = toLocalDate(effectiveDate);
    const newMainEnd = newMainStart ? addDays(newMainStart, mainDuration) : null;

    const rows = coverages.map((c) => {
      const code = txt(c.code);
      const cfg = cfgByCov[code];
      const curStart = toPolicyLocalDate(c.start);
      const curEnd = toPolicyLocalDate(c.end);
      const duration = daysBetween(curStart, curEnd);
      const isMain = code === mainCode;
      // Configured as taking part in the relationship, and not the main one.
      const isDependent = !!cfg && cfg.coverageCodeDep !== '''' && !isMain;

      let newStart = null, newEnd = null, note = '''';
      if (!newMainStart) {
        note = t(''awaiting effective date'');
      } else if (isMain) {
        newStart = newMainStart;
        newEnd = newMainEnd;
      } else if (isDependent) {
        // Assumption 13: keep the CURRENT offset of this dependent relative to the
        // CURRENT main end, read from the policy. No contiguity rule is invented.
        const offset = daysBetween(curMainEnd, curStart);
        newStart = addDays(newMainEnd, offset);
        newEnd = duration == null ? null : addDays(newStart, duration);
      } else {
        newStart = curStart;
        newEnd = curEnd;
        note = cfg ? t(''not part of the relationship'') : t(''not configured'');
      }

      return {
        key: String(c.id),
        coverageId: c.id,
        code: code,
        name: c.name,
        premium: c.basePremium,
        curStart: curStart, curEnd: curEnd, duration: duration,
        newStart: newStart, newEnd: newEnd,
        newDuration: daysBetween(newStart, newEnd),
        isMain: isMain, isDependent: isDependent, note: note,
      };
    });

    return {
      mainCode: mainCode,
      mainRow: rows.find((r) => r.isMain),
      rows: rows,
      curBondStart: rows.reduce((a, r) => (r.curStart && (!a || r.curStart < a) ? r.curStart : a), null),
      curBondEnd: rows.reduce((a, r) => (r.curEnd && (!a || r.curEnd > a) ? r.curEnd : a), null),
      newBondStart: rows.reduce((a, r) => (r.newStart && (!a || r.newStart < a) ? r.newStart : a), null),
      newBondEnd: rows.reduce((a, r) => (r.newEnd && (!a || r.newEnd > a) ? r.newEnd : a), null),
    };
  })();

  // ---------------------------------------------------------------- validation
  const missing = [];
  if (!effectiveDate) missing.push(t(''Change date''));
  const policyStartDate = policy ? toPolicyLocalDate(policy.start) : null;
  const effectiveDateValue = toLocalDate(effectiveDate);
  const policyStartKey = fmt(policyStartDate);
  const effectiveDateKey = fmt(effectiveDateValue);
  const effectiveDateError = policyStartKey && effectiveDateKey
    && effectiveDateKey <= policyStartKey
    ? t(''The date cannot be equal to or earlier than the policy issue/start date.'')
    : '''';
  if (effectiveDateError) missing.push(effectiveDateError);
  if (!txt(observation)) missing.push(t(''Endorsement observation''));
  const isValid = missing.length === 0 && !!model && !model.error;
  const calculationKey = fmt(effectiveDateValue) + ''|'' + txt(observation);
  const calculationIsCurrent = !!calculation
    && calculation.key === calculationKey
    && !!calculation.quote;

  // ------------------------------------------------------ execution (stage 2)
  // §4 flow. Every step reports its own failure; nothing downstream runs after a
  // failed step, and success is announced only once BOTH the endorsement and the
  // insured-object sync have completed (§3.4).
  const pushStep = (name, ok, msg) => setSteps((prev) => prev.concat([{ name: name, ok: ok, msg: msg || '''' }]));

  const reloadPolicy = async function () {
    const res = await exe(''RepoLifePolicy'', { operation: ''GET'', filter: ''id = '' + policyId, include: [''Product'', ''Coverages''] });
    if (res && res.ok) {
      const fresh = (res.outData || [])[0];
      if (fresh) { setPolicy(fresh); setCoverages(Array.isArray(fresh.Coverages) ? fresh.Coverages : []); }
    }
  };

  const getCoverageChangePayload = function (effectiveDateValue) {
    const oldCoverages = coverages.map((coverage) => ({ ...coverage }));
    const newCoverages = coverages.map((coverage) => {
      const row = model.rows.filter((item) => item.code === txt(coverage.code))[0];
      const changedCoverage = { ...coverage };
      if (row && row.newStart && row.newEnd) {
        changedCoverage.start = fmtAtNoon(row.newStart);
        changedCoverage.end = fmtAtNoon(row.newEnd);
      }
      return changedCoverage;
    });

    return {
      policyId: policyId,
      jOldCoverages: JSON.stringify(oldCoverages),
      jNewCoverages: JSON.stringify(newCoverages),
      newStart: model.mainRow && model.mainRow.newStart ? fmtAtNoon(model.mainRow.newStart) : '''',
      newEnd: model.mainRow && model.mainRow.newEnd ? fmtAtNoon(model.mainRow.newEnd) : '''',
      effectiveDate: fmtAtNoon(effectiveDateValue),
      jAdditional: JSON.stringify({ endorsementType: ''PROCEEDORDER'' })
    };
  };

  const approveEndorsementWorkflow = async function (processId) {
    const procesoId = Number(processId || 0);
    if (!procesoId) {
      throw new Error(t(''The endorsement workflow process could not be determined.''));
    }

    const result = await exe(''GotoStep'', {
      procesoId: procesoId,
      estado: ''APROVED''
    });
    const response = Array.isArray(result) ? (result[0] || {}) : result;
    if (!response || !response.ok) {
      throw new Error(translatedMessage(response && response.msg, ''The endorsement workflow could not be approved.''));
    }
    return response;
  };

  const onCalculate = async function () {
    setTouched(true);
    if (!isValid) {
      message.error(t(''Required: '') + missing.join('', ''));
      return;
    }

    setExecuting(true);
    setSteps([]);
    setResult(null);
    setChangeId(null);
    setCalculation(null);
    setPremiumValidationError('''');

    try {
      const eff = fmt(toLocalDate(effectiveDate));
      const quote = await exe(''ChangeCoverage'', getCoverageChangePayload(eff));

      if (!quote || !quote.ok || !quote.outData) {
        pushStep(t(''Calculate the coverage change''), false, translatedMessage(quote && quote.msg, ''no response''));
        const quoteError = t(''The endorsement could not be calculated. '') + translatedMessage(quote && quote.msg, '''');
        setResult({ kind: ''error'', msg: quoteError });
        message.error(quoteError);
        return;
      }

      const billingValidation = validateBilling(quote.outData, getCurrentPolicyBill(policy));
      if (!billingValidation.ok) {
        setPremiumValidationError(billingValidation.msg);
        pushStep(t(''Billing invariant''), false, billingValidation.msg);
        setResult({
          kind: ''error'',
          msg: t(''The endorsement was blocked because the calculation changes the policy billing. '') + billingValidation.msg
        });
        message.warning(billingValidation.msg);
        return;
      }

      // CA6 / assumption 16: premium, tax and reinsurance must not move.
      let oldCovs = [], newCovs = [];
      try { oldCovs = JSON.parse(quote.outData.jOldCoverages || ''[]''); } catch (e) { oldCovs = []; }
      try { newCovs = JSON.parse(quote.outData.jNewCoverages || ''[]''); } catch (e) { newCovs = []; }
      const moved = [];
      newCovs.forEach((nc) => {
        const oc = oldCovs.filter((x) => txt(x.code) === txt(nc.code))[0];
        if (oc && Number(oc.premium) !== Number(nc.premium)) moved.push(txt(nc.code) + '': '' + oc.premium + '' → '' + nc.premium);
      });

      if (moved.length) {
        pushStep(t(''Premium invariant (CA6)''), false, moved.join('' · ''));
        const premiumError = t(''Stopped: the term change would alter the premium, which CA6 forbids. Nothing was calculated. '') + moved.join('' · '');
        setResult({ kind: ''error'', msg: premiumError });
        message.error(premiumError);
        return;
      }

      setCalculation({ key: calculationKey, quote: quote.outData });
      pushStep(t(''Calculate the coverage change''), true, '''');
      pushStep(t(''Billing invariant''), true, t(''Bill matches the current policy and BillDiff is zero.''));
      pushStep(t(''Premium invariant (CA6)''), true, t(''premium, sum insured and reinsurance unchanged''));
      setResult({ kind: ''calculated'', msg: t(''Calculation completed. Review the coverage changes before executing the endorsement.'') });
      message.success(t(''Calculation completed successfully.''));
    } catch (err) {
      const errorMessage = err && err.message ? err.message : String(err);
      pushStep(t(''Calculate the term change''), false, translatedMessage(errorMessage, ''Unexpected error''));
      const calculationError = translatedMessage(errorMessage, ''The endorsement could not be calculated.'');
      setResult({ kind: ''error'', msg: calculationError });
      message.error(calculationError);
    } finally {
      setExecuting(false);
    }
  };

  const onExecute = async function () {
    setTouched(true);
    if (!isValid) { message.error(t(''Required: '') + missing.join('', '')); return; }
    if (!calculationIsCurrent) {
      message.warning(t(''The endorsement data changed or has not been calculated. Calculate again before executing.''));
      return;
    }
    setExecuting(true);
    setSteps([]);
    setResult(null);
    setChangeId(null);
    try {
      const eff = fmt(toLocalDate(effectiveDate));

      // --- generate the endorsement
      const addPayload = getCoverageChangePayload(eff);
      Object.keys(calculation.quote).forEach((k) => { if (addPayload[k] === undefined) addPayload[k] = calculation.quote[k]; });
      addPayload.operation = ''ADD'';
      addPayload.note = txt(observation);
      addPayload.code = null;
      const created = await exe(''ChangeCoverage'', addPayload);
      if (!created || !created.ok || !created.outData || !created.outData.id) {
        pushStep(t(''Generate the endorsement''), false, translatedMessage(created && created.msg, ''no endorsement was returned''));
        const createError = t(''The endorsement was not generated. '') + translatedMessage(created && created.msg, '''');
        setResult({ kind: ''error'', msg: createError });
        message.error(createError);
        return;
      }
      const cid = created.outData.id;
      setChangeId(cid);
      pushStep(t(''Generate the endorsement''), true, t(''endorsement '') + cid);

      await approveEndorsementWorkflow(created.outData.processId);
      pushStep(t(''Approve endorsement workflow''), true, '''');

      // --- execute
      const executed = await exe(''ExeChangeCoverage'', { changeId: cid, exeNow: true, operation: ''EXECUTE'', noTracking: true });
      if (!executed || !executed.ok) {
        pushStep(t(''Execute the endorsement''), false, translatedMessage(executed && executed.msg, ''no response''));
        const executeError = t(''The endorsement was generated but NOT executed. '') + translatedMessage(executed && executed.msg, '''');
        setResult({ kind: ''error'', msg: executeError });
        message.error(executeError);
        return;
      }
      // A future effective date makes the engine SCHEDULE the endorsement (status 2) instead
      // of applying it. That is not a failure, but it is not success either: the coverage
      // dates have not moved, so saying "applied" would be false.
      const execStatus = Number(executed.outData && executed.outData.status);
      if (execStatus === 2) {
        pushStep(t(''Execute the endorsement''), true, t(''scheduled for '') + eff + t('' — not applied yet''));
        await reloadPolicy();
        setResult({ kind: ''partial'', msg: t(''Endorsement '') + cid + t('' was generated and SCHEDULED for '') + eff + t(''. The coverage dates have not changed yet, so the insured-object data was not synchronised.'') });
        message.warning(t(''The endorsement was scheduled, not applied.''));
        return;
      }
      pushStep(t(''Execute the endorsement''), true, translatedMessage(executed.msg, ''''));

      // ChangeCoverage updates the coverages but does not necessarily update the
      // LifePolicy validity. Persist the dates represented by the endorsement.
      const executedData = executed.outData && Array.isArray(executed.outData)
        ? executed.outData[0]
        : (executed.outData || {});
      const endorsementCoverages = executedData.jNewCoverages
        || created.outData.jNewCoverages
        || addPayload.jNewCoverages;
      let maxCoverageEnd = '''';
      try {
        const coverageList = typeof endorsementCoverages === ''string''
          ? JSON.parse(endorsementCoverages)
          : endorsementCoverages;
        (Array.isArray(coverageList) ? coverageList : []).forEach((coverage) => {
          const end = toLocalDate(coverage.end);
          if (end && (!maxCoverageEnd || end > toLocalDate(maxCoverageEnd))) maxCoverageEnd = fmt(end);
        });
      } catch (errorCoverageDates) {
        maxCoverageEnd = '''';
      }

      // Read the coverages after execution as the source of truth. The
      // endorsement response can contain a pre-execution JSON snapshot whose
      // date differs from the value finally persisted by ChangeCoverage.
      const persistedPolicyResponse = await exe(''RepoLifePolicy'', {
        operation: ''GET'',
        filter: ''id = '' + policyId,
        include: [''Coverages'']
      });
      const persistedPolicy = persistedPolicyResponse && persistedPolicyResponse.ok
        ? (Array.isArray(persistedPolicyResponse.outData)
          ? persistedPolicyResponse.outData[0]
          : persistedPolicyResponse.outData)
        : null;
      const persistedCoverages = persistedPolicy
        && (persistedPolicy.Coverages || persistedPolicy.coveragesList);
      if (Array.isArray(persistedCoverages)) {
        persistedCoverages.forEach((coverage) => {
          const end = toLocalDate(coverage.end);
          if (end && (!maxCoverageEnd || end > toLocalDate(maxCoverageEnd))) maxCoverageEnd = fmt(end);
        });
      }
      const policyStart = eff;
      const policyEnd = maxCoverageEnd || executedData.newEnd || created.outData.newEnd || addPayload.newEnd;
      if (!policyStart || !policyEnd) {
        const validityError = t(''The endorsement was applied, but its new policy validity dates were not returned.'');
        pushStep(t(''Update policy validity''), false, validityError);
        setResult({ kind: ''partial'', msg: validityError });
        message.error(validityError);
        return;
      }

      const policyUpdate = await exe(''SetField'', {
        entity: ''LifePolicy'',
        entityId: policyId,
        fieldValue: "[start]=''" + fmtAtNoon(policyStart) + "'', [end]=''" + fmtAtNoon(policyEnd) + "''",
        raw: true
      });
      if (!policyUpdate || !policyUpdate.ok) {
        const validityError = t(''The endorsement was applied, but the policy validity could not be updated. '') + translatedMessage(policyUpdate && policyUpdate.msg, ''no response'');
        pushStep(t(''Update policy validity''), false, validityError);
        setResult({ kind: ''partial'', msg: validityError });
        message.error(validityError);
        return;
      }
      pushStep(t(''Update policy validity''), true, policyStart + '' -> '' + policyEnd);

      // --- synchronise the insured object (§3.3)
      const synced = await exe(''ExeChain'', { chain: ''cmdUpdateInsuredObjectData'', context: JSON.stringify({ policyId: policyId }) });
      const syncData = synced && synced.outData;
      const syncOk = !!(synced && synced.ok && syncData && syncData.ok);
      const syncMsg = translatedMessage((syncData && syncData.msg) || (synced && synced.msg), ''no response'');
      pushStep(t(''Synchronise the insured object''), syncOk, syncMsg);

      await reloadPolicy();

      if (syncOk) {
        setResult({ kind: ''success'', msg: t(''Endorsement '') + cid + t('' applied and insured-object data synchronised.'') });
        message.success(t(''The endorsement was applied successfully.''));
        setTimeout(() => { window.location.href = policyHref; }, 500);
      } else {
        // §3.4: never hide a partial failure behind a generic success message.
        setResult({ kind: ''partial'', msg: t(''PARTIAL: endorsement '') + cid + t('' WAS applied to the policy, but the insured-object synchronisation failed — '') + syncMsg });
        message.warning(t(''Partial failure: the endorsement was applied but the insured-object data was not synchronised.''));
      }
    } catch (err) {
      const errorMessage = err && err.message ? err.message : String(err);
      pushStep(t(''Unexpected error''), false, translatedMessage(errorMessage, ''Unexpected error''));
      const executionError = translatedMessage(errorMessage, ''Unexpected error'');
      setResult({ kind: ''error'', msg: executionError });
      message.error(executionError);
    } finally {
      setExecuting(false);
    }
  };

  // ---------------------------------------------------------------- rendering
  const dateCell = (d, days) => (
    <span>{d ? fmt(d) : <span style={{ color: ''#bfbfbf'' }}>—</span>}{days != null && d ? <span style={{ color: ''#8c8c8c'' }}> ({days}d)</span> : null}</span>
  );

  const columns = [
    { title: t(''Coverage ID''), dataIndex: ''coverageId'', key: ''coverageId'',
      render: (v, r) => <span>{v} {r.isMain ? <Tag color="blue">{t(''Main'')}</Tag> : (r.isDependent ? <Tag>{t(''Dependent'')}</Tag> : null)}</span> },
    { title: t(''Code''), dataIndex: ''code'', key: ''code'' },
    { title: t(''Coverage name''), dataIndex: ''name'', key: ''name'' },
    { title: t(''Premium''), dataIndex: ''premium'', key: ''premium'' },
    { title: t(''Start date (before)''), key: ''cs'', render: (v, r) => dateCell(r.curStart) },
    { title: t(''End date (before)''), key: ''ce'', render: (v, r) => dateCell(r.curEnd, r.duration) },
    { title: t(''Start date (after)''), key: ''ns'', render: (v, r) => dateCell(r.newStart) },
    { title: t(''End date (after)''), key: ''ne'', render: (v, r) => dateCell(r.newEnd, r.newDuration) },
    { title: t(''Note''), dataIndex: ''note'', key: ''note'' },
  ];
  const policyHref = policyId > 0 ? ''/#/lifePolicy/'' + policyId : ''/#/home'';

  if (loading) return <Card title={t(''Proceed Order endorsement'')}><Skeleton active /></Card>;

  if (loadError) {
    return <Card title={t(''Proceed Order endorsement'')}>
      <Alert type="error" showIcon message={t(''The view could not be loaded'')} description={loadError} />
    </Card>;
  }

  return (
    <Card className="proceed-order-endorsement-view" title={<span>{t(''Proceed Order endorsement'')} {policy ? <Tag color="blue">{policy.code || (''#'' + policy.id)}</Tag> : null}</span>}>
      <Alert type="info" showIcon style={{ marginBottom: 12 }}
        message={t(''Proceed Order endorsement'')}
        description={t(''Preview the resulting dates, then execute. Execution generates a ChangeCoverage endorsement, executes it and synchronises the insured-object data. Nothing is written until you press Execute.'')} />

      {premiumValidationError ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message={t(''Endorsement blocked: billing would change'')}
          description={premiumValidationError}
        />
      ) : null}

      <div style={{
        display: ''flex'',
        alignItems: ''center'',
        gap: 8,
        padding: ''8px 10px'',
        marginBottom: 12,
        background: ''#e6f4ff'',
        border: ''1px solid #91caff'',
        borderRadius: 6
      }}>
        <Button
          type="primary"
          id="btnCalculate"
          loading={executing}
          disabled={!isValid || executing}
          onClick={onCalculate}
        >
          {t(''Calculate'')}
        </Button>
        <Popconfirm
          title={t(''Execute endorsement?'')}
          description={t(''This action will create and execute the endorsement using the current calculation.'')}
          okText={t(''Yes'')}
          cancelText={t(''Cancel'')}
          onConfirm={onExecute}
          disabled={!isValid || !calculationIsCurrent || executing}
        >
          <Button
            type="primary"
            id="btnExecute"
            loading={executing}
            disabled={!isValid || !calculationIsCurrent || executing}
          >
            {t(''Execute endorsement'')}
          </Button>
        </Popconfirm>
        {!isValid ? (
          <span style={{ color: ''#cf1322'' }}>{t(''Required: '') + missing.join('', '')}</span>
        ) : (!calculationIsCurrent ? (
          <span style={{ color: ''#d48806'' }}>
            {calculation
              ? t(''The endorsement data changed. Calculate again before executing.'')
              : t(''Calculate before executing the endorsement.'')}
          </span>
        ) : null)}
        <span style={{ flex: 1 }} />
        <Button type="default" href={policyHref}>
          {t(''Back to policy'')}
        </Button>
      </div>

      <Card
        size="small"
        type="inner"
        title={t(''Endorsement data'')}
        headStyle={{
          background: ''#bfbfbf'',
          borderBottom: ''1px solid #cbd1d8'',
          color: ''#262626'',
          fontWeight: 600
        }}
        bodyStyle={{ padding: 12 }}
        style={{
          marginBottom: 12,
          border: ''1px solid #cbd1d8'',
          borderRadius: 2
        }}
      >
        <Descriptions size="small" column={3} bordered style={{ marginBottom: 12 }}>
          <Descriptions.Item label={t(''Current system date'')}><span id="sysDate">{fmt(systemDate)}</span></Descriptions.Item>
          <Descriptions.Item label={t(''Policy'')}>{policy ? (policy.code || policy.id) : ''''}</Descriptions.Item>
          <Descriptions.Item label={t(''Product'')}>
            {policy
              ? ((policy.Product && policy.Product.name)
                || (policy.product && policy.product.name)
                || policy.productName
                || policy.productCode
                || '''')
              : ''''}
          </Descriptions.Item>
        </Descriptions>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label={t(''Change date'')} required
              validateStatus={touched && (!effectiveDate || effectiveDateError) ? ''error'' : ''''}
              help={touched && !effectiveDate
                ? t(''This field is required.'')
                : (touched && effectiveDateError ? effectiveDateError : '''')}>
              <DatePicker style={{ width: ''100%'' }} id="effectiveDate" format="YYYY-MM-DD"
                value={effectiveDate} onChange={(v) => { setEffectiveDate(v); setTouched(true); }} />
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item label={t(''Endorsement observation'')} required
              validateStatus={touched && !txt(observation) ? ''error'' : ''''}
              help={touched && !txt(observation) ? t(''This field is required.'') : ''''}>
              <Input id="observation" value={observation} maxLength={500}
                onChange={(e) => { setObservation(e.target.value); setTouched(true); }} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {model && model.error
        ? <Alert type="error" showIcon message={t(''The coverage relationship could not be resolved'')} description={model.error} />
        : null}

      {model && !model.error ? (
        <div>
          <Divider orientation="left">{t(''Coverage comparison'')}</Divider>
          <Table className="proceed-order-coverage-table" size="small" pagination={false} rowKey="key" dataSource={model.rows} columns={columns} />

          <Divider orientation="left">{t(''Bond validity summary'')}</Divider>
          <Descriptions className="proceed-order-summary-table" size="small" column={2} bordered>
            <Descriptions.Item label={t(''Start before endorsement'')}>{fmt(model.curBondStart)}</Descriptions.Item>
            <Descriptions.Item label={t(''End before endorsement'')}>{fmt(model.curBondEnd)}</Descriptions.Item>
            <Descriptions.Item label={t(''Start after endorsement'')}>{model.newBondStart ? fmt(model.newBondStart) : ''—''}</Descriptions.Item>
            <Descriptions.Item label={t(''End after endorsement'')}>{model.newBondEnd ? fmt(model.newBondEnd) : ''—''}</Descriptions.Item>
            <Descriptions.Item label={t(''Main coverage (from configuration)'')}>{model.mainCode}</Descriptions.Item>
            <Descriptions.Item label={t(''Main coverage duration (days)'')}>
              {model.mainRow ? model.mainRow.duration + '' → '' + (model.mainRow.newDuration == null ? ''—'' : model.mainRow.newDuration) : ''''}
            </Descriptions.Item>
          </Descriptions>
        </div>
      ) : null}
    </Card>
  );
}
', N'ENDORSEMENT', N'Endoso de orden de proceder', 0);

    INSERT INTO dbo.LiveView (id, name, code, category, operation, multiComponent) VALUES (43, N'viewCumuloFianzas', N'/**
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
 *    Va `{'' ''}`.
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
  const IcoBuscar = () => svg(''M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z'');
  const IcoActualizar = () => svg(''M909.1 209.3l-56.4 44.1C775.8 155.1 656.2 92 521.9 92 290 92 102.3 279.5 102 511.5 101.7 743.7 289.8 932 521.9 932c181.3 0 335.8-115 394.6-276.1 1.5-4.2-.7-8.9-4.9-10.3l-56.7-19.5a8 8 0 00-10.1 4.8c-1.8 5-3.8 10-5.9 14.9-17.3 41-42.1 77.8-73.7 109.4A344.77 344.77 0 01655.9 829c-42.3 17.9-87.4 27-133.8 27-46.5 0-91.5-9.1-133.8-27A341.5 341.5 0 01279 755.2a342.16 342.16 0 01-73.7-109.4c-17.9-42.4-27-87.4-27-133.9s9.1-91.5 27-133.9c17.3-41 42.1-77.8 73.7-109.4 31.6-31.6 68.4-56.4 109.3-73.8 42.3-17.9 87.4-27 133.8-27 46.5 0 91.5 9.1 133.8 27a341.5 341.5 0 01109.3 73.8c9.9 9.9 19.2 20.4 27.8 31.4l-60.2 47a8 8 0 003 14.1l175.6 43c5 1.2 9.9-2.6 9.9-7.7l.8-180.9c-.1-6.6-7.8-10.3-13-6.2z'');

  const CRITERIOS_VACIOS = {
    noCobis: '''', noSis: '''', grupoEconomico: '''', cnp: '''', nif: '''',
    nombrePersona: '''', surname2: ''''
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
  const [pestana, setPestana] = useState(''busqueda'');
  const [altoGrilla, setAltoGrilla] = useState(260);

  const refBusq = React.useRef(null);
  const refCum = React.useRef(null);

  // Ancho total de cada grilla: con el se habilita el desplazamiento horizontal DENTRO
  // de la grilla en vez de que el panel crezca y se salga del area visible.
  const ANCHO_CONTACTOS = 910;
  const ANCHO_CUMULO = 1810;

  useEffect(function () {
    exe(''GetFullTable'', { table: ''cfgGrupoEconomico'' }).then(function (r) {
      if (r && r.ok && r.outData && r.outData.length > 1) {
        const fs = r.outData.slice(1);
        setGrupos(fs.filter(function (f) { return f[2] === ''1'' || f[2] === 1; })
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
      if (ov === ''auto'' || ov === ''scroll'') return n;
      n = n.parentElement;
    }
    return null;
  }

  // Alto disponible: TODO se mide, nada se estima.
  // El "fuera del cuerpo" (encabezado fijo, paginacion, pie del total, bordes y margenes)
  // se obtiene restando el cuerpo desplazable al contenedor, asi que no depende de que
  // pestana este activa ni de cuantas lineas ocupen los titulos tras un redimensionado.
  function medirAlto() {
    const ref = pestana === ''cumulo'' ? refCum.current : refBusq.current;
    if (!ref) return;
    // Se mide desde el PANEL, no desde el div interno: asi el relleno del card y los
    // bordes que quedan por debajo de la grilla entran en el descuento y no hace falta
    // compensarlos con un margen inventado.
    const el = ref.closest ? (ref.closest(''.axx-panel'') || ref) : ref;
    const rect = el.getBoundingClientRect();
    if (rect.height <= 0) return;               // panel oculto o todavia sin layout
    const cuerpo = el.querySelector(''.ant-table-body'');
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
    window.addEventListener(''resize'', medirAlto);
    return function () {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener(''resize'', medirAlto);
    };
  });

  function num2(v) {
    const n = Number(v);
    if (v === null || v === undefined || isNaN(n)) return '''';
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  // Estilo por signo: SOLO color, sin tocar el formateo ni el valor.
  function monto(v) {
    const n = Number(v);
    const txt = num2(v);
    if (txt === '''') return '''';
    const cls = n > 0 ? ''axx-monto-pos'' : (n < 0 ? ''axx-monto-neg'' : ''axx-monto-cero'');
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
    setCampo(''noSis'', String(valor === null || valor === undefined ? '''' : valor).replace(/[^0-9]/g, ''''));
  }

  function hayCriterio() {
    const k = Object.keys(criterios);
    for (let i = 0; i < k.length; i++) {
      if (String(criterios[k[i]] || '''').trim() !== '''') return true;
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
    setPestana(''busqueda'');
  }

  // CA-02: sin ningun filtro no se consulta.
  function buscar() {
    if (!hayCriterio()) {
      setErrorFiltros(t(''Indique al menos un criterio de búsqueda''));
      return;
    }
    setErrorFiltros(null);
    setError(null);
    setCargandoBusqueda(true);
    setContactoSel(null);
    setFilas([]);
    setTotalCumulo(null);
    setTotalesMoneda([]);
    setPestana(''busqueda'');
    const row = Object.assign({}, criterios, { currentPage: 1, pageSize: 50 });
    exe(''ExeChain'', { chain: ''cmdBuscarContactoFianzas'', context: JSON.stringify({ row: row }) })
      .then(function (r) {
        setCargandoBusqueda(false);
        setBuscado(true);
        setDrawerAbierto(false);
        if (!r || !r.ok) { setError((r && r.msg) || t(''Error de consulta'')); setContactos([]); return; }
        const o = r.outData || {};
        if (!o.ok) { setError(o.msg || t(''Error de consulta'')); setContactos([]); return; }
        setContactos(o.data || []);
      })
      .catch(function (e) {
        setCargandoBusqueda(false); setBuscado(true);
        setContactos([]); setError(String(e));
      });
  }

  // CA-08 / S17: al elegir contacto se habilita la segunda pestana y el foco pasa a ella.
  function cargarCumulo(contacto) {
    setContactoSel(contacto);
    setPestana(''cumulo'');
    setCargandoCumulo(true);
    setError(null);
    setFilas([]);
    setTotalCumulo(null);
    setTotalesMoneda([]);
    exe(''ExeChain'', {
      chain: ''cmdCumuloFianzasPorContacto'',
      context: JSON.stringify({ row: { contactId: contacto.noSis } })
    })
      .then(function (r) {
        setCargandoCumulo(false);
        if (!r || !r.ok) { setError((r && r.msg) || t(''Error de consulta'')); return; }
        const o = r.outData || {};
        if (!o.ok) { setError(o.msg || t(''Error de consulta'')); return; }
        setFilas(o.data || []);
        setTotalCumulo(o.totalCumulo);
        setTotalesMoneda(o.totalesPorMoneda || []);
      })
      .catch(function (e) { setCargandoCumulo(false); setError(String(e)); });
  }

  const etiquetaRelacion = {
    DIRECTO: t(''Ente asegurado directo''),
    PADRE_CONSORCIO: t(''Ente padre (consorcio)''),
    INTEGRANTE: t(''Integrante del consorcio''),
    MIEMBRO_DE_CONSORCIO: t(''Participación como integrante'')
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
.axx251 .axx-tabs .ant-tabs-tab-active::after { content:''''; position:absolute; left:0; right:0; bottom:-1px;
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
          ? <Empty description={t(''No se encontraron contactos'')} />
          : <Table dataSource={contactos} rowKey="noSis" size="small"
              pagination={{ pageSize: 10, size: ''small'' }}
              scroll={{ x: ANCHO_CONTACTOS, y: altoGrilla }}
              onRow={function (record) {
                return { onClick: function () { cargarCumulo(record); } };
              }}
              rowClassName={function (record) {
                return contactoSel && contactoSel.noSis === record.noSis ? ''axx-fila-seleccionada'' : '''';
              }}>
              <Column title={t(''Número SIS'')} dataIndex="noSis" key="noSis" width={95} />
              <Column title={t(''Número COBIS'')} dataIndex="noCobis" key="noCobis" width={115} />
              <Column title={t(''Nombre'')} dataIndex="nombreCompleto" key="nombreCompleto" width={280} />
              <Column title={t(''cnp'')} dataIndex="cnp" key="cnp" width={150} />
              <Column title={t(''nif'')} dataIndex="nif" key="nif" width={160} />
              <Column title={t(''Consorcio'')} dataIndex="esEntePadreConsorcio" key="esEntePadreConsorcio" width={110}
                render={function (v) { return v ? <Tag color="blue">{t(''Ente padre'')}</Tag> : null; }} />
            </Table>}
      </div>
    </Card>
  );

  const gridCumulo = (
    <Card size="small" bordered={false}>
      <div ref={refCum}>
        {!cargandoCumulo && filas.length === 0
          ? <Empty description={t(''El contacto no tiene fianzas vigentes'')} />
          : <div>
              <Table dataSource={filas} size="small" pagination={false}
                scroll={{ x: ANCHO_CUMULO, y: altoGrilla }}
                rowKey={function (r) { return r.polizaId + ''|'' + r.relacion + ''|'' + (r.clienteMiembroRelacionado || ''''); }}>
                <Column title={t(''Número de póliza'')} dataIndex="numeroPoliza" key="numeroPoliza" width={130}
                  render={function (v, r) { return v || ''('' + r.polizaId + '')''; }} />
                <Column title={t(''Ramo'')} dataIndex="ramo" key="ramo" width={165} />
                <Column title={t(''Ente asegurado principal'')} dataIndex="enteAseguradoPrincipal" key="ente" width={185} />
                <Column title={t(''Cliente / miembro relacionado'')} dataIndex="clienteMiembroRelacionado" key="miembro" width={185} />
                <Column title={t(''Relación'')} dataIndex="relacion" key="relacion" width={165}
                  render={function (v) { return etiquetaRelacion[v] || v; }} />
                <Column title={t(''Vigencia desde'')} dataIndex="vigenciaDesde" key="vDesde" width={105} />
                <Column title={t(''Vigencia hasta'')} dataIndex="vigenciaHasta" key="vHasta" width={105} />
                <Column title={t(''Moneda'')} dataIndex="moneda" key="moneda" width={80} />
                <Column title={t(''Suma asegurada de la póliza'')} dataIndex="sumaAseguradaPoliza" key="saPoliza"
                  align="right" width={150} render={monto} />
                <Column title={t(''Prima de la póliza'')} dataIndex="primaPoliza" key="primaPoliza"
                  align="right" width={125} render={monto} />
                <Column title={t(''% de participación'')} dataIndex="porcentajeParticipacion" key="pct"
                  align="right" width={95} render={monto} />
                <Column title={t(''Suma asegurada usada para el cálculo'')} dataIndex="sumaasegurada" key="saCalc"
                  align="right" width={175} render={monto} />
                <Column title={t(''Prima de la participación'')} dataIndex="primaParticipacion" key="primaPart"
                  align="right" width={145} render={monto} />
              </Table>
              <div className="axx-pie">
                {totalesMoneda.length > 1
                  ? totalesMoneda.map(function (m) {
                      return <div key={m.moneda}>
                        <Text strong>{t(''Total Cúmulo'')} ({m.moneda}): </Text>
                        <Text strong style={{ fontSize: 16 }}>{num2(m.totalCumulo)}</Text>
                      </div>;
                    })
                  : <div>
                      <Text strong>{t(''Total Cúmulo'')}{totalesMoneda.length === 1 ? '' ('' + totalesMoneda[0].moneda + '')'' : ''''}: </Text>
                      <Text strong style={{ fontSize: 16 }}>{num2(totalCumulo)}</Text>
                    </div>}
              </div>
            </div>}
      </div>
    </Card>
  );

  return (
    <DefaultPage title={t(''Consulta de Cúmulo de Fianzas'')} icon="audit">
      <style>{css}</style>
      <div className="axx251">

        <div className="axx-topbar">
          <Button type="primary" icon={<IcoBuscar />} onClick={function () { setDrawerAbierto(true); }}>
            {t(''Filtrar'')}
          </Button>
          <Button className="axx-btn-sec" icon={<IcoActualizar />} disabled={!hayCriterio()}
            loading={cargandoBusqueda} onClick={buscar}>
            {t(''Actualizar'')}
          </Button>
        </div>

        <div className="axx-status">
          {contactoSel
            ? <span><b>{t(''Contacto'')}:</b> {contactoSel.nombreCompleto}{'' ''}·{'' ''}
                <b>{t(''Número SIS'')}:</b> {contactoSel.noSis}</span>
            : <span>{t(''Seleccione un contacto de la pestaña Búsqueda para ver su cúmulo'')}</span>}
        </div>

        {error ? <Alert type="error" showIcon message={error} style={{ margin: ''0 4px 4px 4px'' }} /> : null}

        <Tabs type="card" className="axx-tabs" activeKey={pestana} onChange={setPestana}>
          <TabPane tab={t(''Búsqueda'')} key="busqueda">
            <div className="axx-panel">
              <Spin spinning={cargandoBusqueda}>{gridContactos}</Spin>
            </div>
          </TabPane>
          <TabPane tab={t(''Cúmulo'')} key="cumulo" disabled={!contactoSel}>
            <div className="axx-panel">
              <Spin spinning={cargandoCumulo}>{gridCumulo}</Spin>
            </div>
          </TabPane>
        </Tabs>

        <Drawer className="axx-drawer-cumulo" title={t(''Filtros'')} width={420} placement="right"
          visible={drawerAbierto} onClose={function () { setDrawerAbierto(false); }}
          footer={
            <Space>
              <Button type="primary" icon={<IcoBuscar />} loading={cargandoBusqueda} onClick={buscar}>
                {t(''Buscar'')}
              </Button>
              <Button className="axx-btn-sec" onClick={limpiarFiltros}>{t(''Limpiar filtros'')}</Button>
            </Space>
          }>
          {errorFiltros ? <Alert type="warning" showIcon message={errorFiltros} style={{ marginBottom: 10 }} /> : null}
          <Form layout="vertical">
            <Form.Item label={t(''Número COBIS'')}>
              <Input value={criterios.noCobis} onChange={function (e) { setCampo(''noCobis'', e.target.value); }} />
            </Form.Item>
            <Form.Item label={t(''Número SIS'')}>
              <Input value={criterios.noSis} inputMode="numeric"
                onChange={function (e) { setNumeroSis(e.target.value); }} />
            </Form.Item>
            <Form.Item label={t(''Grupo Económico'')}>
              <Select allowClear style={{ width: ''100%'' }} value={criterios.grupoEconomico || undefined}
                onChange={function (v) { setCampo(''grupoEconomico'', v || ''''); }}>
                {grupos.map(function (g) { return <Option key={g.id} value={g.id}>{g.nombre}</Option>; })}
              </Select>
            </Form.Item>
            <Form.Item label={t(''cnp'')}>
              <Input value={criterios.cnp} onChange={function (e) { setCampo(''cnp'', e.target.value); }} />
            </Form.Item>
            <Form.Item label={t(''nif'')}>
              <Input value={criterios.nif} onChange={function (e) { setCampo(''nif'', e.target.value); }} />
            </Form.Item>
            <Form.Item label={t(''Nombre Persona'')}>
              <Input value={criterios.nombrePersona}
                onChange={function (e) { setCampo(''nombrePersona'', e.target.value); }} />
            </Form.Item>
            <Form.Item label={t(''Nombre Compañía'')}>
              <Input value={criterios.surname2} onChange={function (e) { setCampo(''surname2'', e.target.value); }} />
            </Form.Item>
          </Form>
        </Drawer>

      </div>
    </DefaultPage>
  );
}
', NULL, NULL, 0);

    INSERT INTO dbo.LiveView (id, name, code, category, operation, multiComponent) VALUES (44, N'UncollectiblePremiumEndorsement', N'/**
 * @name UncollectiblePremiumEndorsement
 * @description Manages the uncollectible premium endorsement process for a policy.
 * @type VIEW
 * @author Michael Delgado
 * @created 2026/09/07
 * @version 1.0
 * @purpose Calculate, review, save, and execute an endorsement for uncollectible premium balances.
 */

() => {
  const { Card, Row, Col, Form, DatePicker, Input, Select, Button, Descriptions, Alert, Tag, Skeleton, Space, Popconfirm, Table, Tabs, message } = A;

  // AXX-253 / GLOB-1209 - Endoso de Prima Incobrable.
  // Accion de poliza (Configuracion avanzada > Policy > customActions). Cotiza con
  // ChangeCancellation y ejecuta con ExeChangeCancellation. El importe es el saldo de prima
  // pendiente: sin fechas, vigencias ni prorratas.
  //
  // AXX-272 / GLOB-1209:
  //  - CA-05: se retira la restriccion por ramo. La vista abre para CUALQUIER ramo. La
  //    elegibilidad por estado de poliza (solo canceladas, CA-09 de AXX-253) SIGUE VIGENTE.
  //  - CA-07/08/09: la vista sobrescribe el jDetail de ESTE endoso dejando cada rubro nuevo en
  //    cero y conservando el anterior. Change.jDetail no lo lee la ejecucion, asi que el ajuste
  //    es representacion y auditoria de este endoso y no altera ningun otro (CA-10).
  //  - CA-11/12: validacion de saldo cero sobre jDetail y sobre Bill. Cualquier diferencia
  //    residual se informa con su rubro y su importe y BLOQUEA Ejecutar. Nunca se redondea una
  //    diferencia a cero para ocultarla.
  //  - CA-13/14/15: Guardar persiste el endoso sin ejecutarlo; Ejecutar revalida contra el
  //    estado actual antes de aplicar y rechaza un calculo obsoleto.
  //
  // Ojo: en una LiveView el motor es buble, asi que todo await va dentro de "async function",
  // nunca de una arrow async. Y ninguna clave de t() puede llevar dos puntos: i18next los trata
  // como separador de namespace y se come la frase.

  const ENDORSEMENT_TYPE = ''UNCOLLECTIBLEPREMIUM'';
  const REASON_CATALOG = ''CancellationChange'';
  const DEFAULT_REASON_CODE = ''CANCELACION POR FALTA DE PAGO'';
  const MONEY_DECIMALS = 2; // precision monetaria oficial del ambiente (Bill y recibo)
  const ZERO_EPS = 0.005;   // medio centavo: por debajo, dos importes son iguales A ESA precision

  // AXX-272 ronda 2, CA-19: la grilla de detalle salio con bordes verticales tambien en las FILAS.
  // El estandar pide lo contrario: en las filas solo separadores horizontales, y los verticales se
  // conservan SIEMPRE en los encabezados. Se acota a esta grilla con la clase axx272-detail para no
  // tocar ninguna otra tabla de la vista ni del sistema.
  const DETAIL_GRID_CSS = [
    ''.axx272-detail .ant-table { font-size: 12px; }'',
    ''.axx272-detail .ant-table-container { border: 1px solid #cbd1d8; }'',
    // encabezados: fondo sutilmente mas oscuro y separadores verticales de 1px, siempre
    ''.axx272-detail .ant-table-thead > tr > th {'',
    ''  background: #bfbfbf; font-size: 12px; line-height: 18px; padding: 5px 8px;'',
    ''  border-right: 1px solid #cbd1d8 !important; border-bottom: 1px solid #cbd1d8 !important; }'',
    ''.axx272-detail .ant-table-thead > tr > th:last-child { border-right: 0 !important; }'',
    // filas: unicamente separadores horizontales, sin bordes verticales
    ''.axx272-detail .ant-table-tbody > tr > td {'',
    ''  font-size: 12px; line-height: 18px; padding: 5px 8px;'',
    ''  border-right: 0 !important; border-left: 0 !important;'',
    ''  border-bottom: 1px solid #cbd1d8 !important; }'',
    ''.axx272-detail .ant-table-tbody > tr:last-child > td { border-bottom: 0 !important; }'',
  ].join(''\n'');

  const VIEW_CSS = [
    ''.uncollectible-view { height: 100%; min-height: 100dvh; overflow: hidden; font-size: 13px; }'',
    ''.uncollectible-view.ant-card { display: flex; flex-direction: column; }'',
    ''.uncollectible-view .ant-card-head { min-height: 46px; border-bottom: 1px solid #cbd1d8; }'',
    ''.uncollectible-view .ant-card-head-title { font-size: 16px; font-weight: 600; }'',
    ''.uncollectible-view > .ant-card-body { flex: 1 1 auto; min-height: 0; }'',
    ''.uncollectible-summary { border: 1px solid #cbd1d8; }'',
    ''.uncollectible-summary .ant-descriptions-item-label { background: #f2f4f7; font-size: 12px; }'',
    ''.uncollectible-summary .ant-descriptions-item-content { font-size: 13px; }'',
    ''.uncollectible-toolbar { display: flex; align-items: center; min-height: 42px; margin: 0 -4px 2px; padding: 4px 4px 4px 8px; border: 1px solid #e6ebf2; background: transparent; }'',
    ''.uncollectible-toolbar .ant-btn { border-radius: 6px; }'',
    ''.uncollectible-toolbar .ant-btn-default { border-color: #8f9aa7; }'',
    ''.uncollectible-toolbar .ant-btn-dangerous { border-color: #bd4d35; }'',
    ''.uncollectible-toolbar .ant-btn[disabled] { border-color: #6f7b88; opacity: 1; }'',
    ''.axx272-detail-tabs { min-height: 0; flex: 1 1 auto; display: flex; flex-direction: column; }'',
    ''.uncollectible-tabs { min-height: 0; flex: 1 1 auto; display: flex; flex-direction: column; }'',
    ''.uncollectible-tabs > .ant-tabs-nav { margin-bottom: 2px; }'',
    ''.uncollectible-tabs.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab { margin-right: 2px; border: 1px solid #cbd1d8; border-bottom: 0; border-radius: 6px 6px 0 0; }'',
    ''.uncollectible-tabs.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active { border-color: #1677ff; }'',
    ''.uncollectible-tabs .ant-tabs-content-holder { min-height: 0; overflow: auto; border: 1px solid #cbd1d8; padding: 8px; }'',
    ''.uncollectible-tabs .ant-tabs-content { height: 100%; }'',
    ''.uncollectible-tabs .ant-tabs-tabpane { min-height: 0; }'',
    ''.uncollectible-view .ant-alert { font-size: 13px; }''
  ].join(''\n'');

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('''');
  const [policy, setPolicy] = useState(null);
  const [lobName, setLobName] = useState('''');
  const [productName, setProductName] = useState('''');
  const [pending, setPending] = useState(null);
  const [pendingBreakdown, setPendingBreakdown] = useState(null);
  const [reasons, setReasons] = useState([]);

  const [causa, setCausa] = useState(undefined);
  const [effectiveDate, setEffectiveDate] = useState(null);
  const [observation, setObservation] = useState(''CANCELACIÓN POR SALDO INCOBRABLE'');
  const [touched, setTouched] = useState(false);

  const [quoting, setQuoting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [quote, setQuote] = useState(null);
  const [detail, setDetail] = useState(null);       // jDetail de este endoso, ya en cero
  const [residuals, setResiduals] = useState([]);   // rubros que NO quedaron en cero
  const [quotedBalance, setQuotedBalance] = useState(null);
  const [savedChange, setSavedChange] = useState(null);
  const [actionError, setActionError] = useState('''');
  const [done, setDone] = useState(null);

  const txt = (v) => String(v === null || v === undefined ? '''' : v).trim();
  const responseMessage = (response, fallback) => {
    const direct = txt(response && response.msg);
    if (direct) return direct;

    const hook = response && Array.isArray(response.hooks)
      ? response.hooks.find((h) => h && h.result && txt(h.result.msg))
      : null;
    const hookMessage = hook && hook.result ? txt(hook.result.msg) : '''';
    return hookMessage || fallback;
  };

  const round2 = (v) => {
    const n = Number(v || 0);
    if (!isFinite(n)) return 0;
    return Number((Math.round((n + Number.EPSILON) * 100) / 100).toFixed(MONEY_DECIMALS));
  };
  const money = (v) => {
    const n = Number(v || 0);
    const cur = policy && policy.currency ? policy.currency : '''';
    // Formato estandar N2: miles con coma y decimales con punto.
    return n.toLocaleString(''en-US'', { minimumFractionDigits: MONEY_DECIMALS, maximumFractionDigits: MONEY_DECIMALS }) + (cur ? '' '' + cur : '''');
  };
  const normalizePendingBreakdown = (value) => {
    const data = value || {};
    const premium = round2(data.pendingPremium || data.premium || 0);
    const tax = round2(data.pendingTax || data.tax || 0);
    const total = round2(data.pendingTotal || data.total || data.pending || (premium + tax));
    return { pendingPremium: premium, pendingTax: tax, pendingTotal: total };
  };
  const firstMoney = function () {
    for (let i = 0; i < arguments.length; i += 1) {
      const n = Number(arguments[i] || 0);
      if (isFinite(n) && Math.abs(n) >= ZERO_EPS) return Math.abs(n);
    }
    return 0;
  };
  const firstMoneyOrNull = function () {
    for (let i = 0; i < arguments.length; i += 1) {
      const n = Number(arguments[i] || 0);
      if (isFinite(n) && Math.abs(n) >= ZERO_EPS) return Math.abs(n);
    }
    return null;
  };

  const getPolicyId = () => {
    try {
      const href = String(window.location.href || '''').replace(''#/'', '''');
      const url = new URL(href);
      return Number(url.searchParams.get(''policyId'') || 0);
    } catch (e) {
      return 0;
    }
  };
  const policyId = getPolicyId();

  const loadAll = async function () {
    setLoading(true);
    setLoadError('''');
    try {
      if (!policyId) throw new Error(t(''No policy was supplied. Open this view from the policy actions menu.''));

      const polRes = await exe(''RepoLifePolicy'', { operation: ''GET'', filter: ''id = '' + policyId });
      if (!polRes || !polRes.ok) throw new Error((polRes && polRes.msg) || t(''The policy could not be read.''));
      const rows = polRes.outData || [];
      if (!rows.length) throw new Error(t(''Policy not found'') + '' - '' + policyId);
      const pol = rows[0];
      setPolicy(pol);

      const catalogs = await Promise.all([
        exe(''RepoLob'', {
          operation: ''GET'',
          filter: "code = ''" + String(pol.lob || '''').replace(/''/g, "''''") + "''"
        }).catch(() => null),
        exe(''RepoProduct'', {
          operation: ''GET'',
          filter: "code = ''" + String(pol.productCode || '''').replace(/''/g, "''''") + "''"
        }).catch(() => null),
        exe(''GetPendingPremiums'', { policyId: policyId }).catch(() => null),
        exe(''ExeChain'', {
          chain: ''cmdGetUncollectiblePremium'',
          context: JSON.stringify({ policyId: policyId })
        }).catch(() => null),
        exe(''RepoReasonsCatalog'', { operation: ''GET'', filter: "catalog=''" + REASON_CATALOG + "''" }).catch(() => null)
      ]);
      const lobRows = catalogs[0] && catalogs[0].ok ? (catalogs[0].outData || []) : [];
      const productRows = catalogs[1] && catalogs[1].ok ? (catalogs[1].outData || []) : [];
      const lob = lobRows.find((item) => String(item.code) === String(pol.lob));
      const product = productRows.find((item) => String(item.code) === String(pol.productCode));
      setLobName((lob && (lob.name || lob.code)) || pol.lob || '''');
      setProductName((product && (product.name || product.code)) || pol.productCode || '''');

      const balRes = catalogs[2];
      if (!balRes || !balRes.ok) throw new Error((balRes && balRes.msg) || t(''The pending premium balance could not be read.''));
      setPending(balRes.outData || { pending: 0 });

      const uncollectibleRes = catalogs[3];
      if (uncollectibleRes && uncollectibleRes.ok) {
        setPendingBreakdown(normalizePendingBreakdown(uncollectibleRes.outData));
      }

      const catRes = catalogs[4];
      if (catRes && catRes.ok) setReasons(catRes.outData || []);

      // La fecha inicial usa el calendario local del navegador: hoy si la poliza ya inicio,
      // o el inicio de vigencia cuando la poliza comienza en una fecha futura.
      if (typeof moment !== ''undefined'') {
        const today = moment();
        const policyStart = pol.start ? moment(pol.start) : null;
        setEffectiveDate(policyStart && policyStart.isAfter(today, ''day'') ? policyStart : today);
      }

    } catch (e) {
      setLoadError(String((e && e.message) || e));
    }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  // Selecciona una causa inicial del catalogo, manteniendo el campo editable.
  useEffect(() => {
    if (causa || !reasons.length) return;
    const defaultReason = reasons.find((reason) =>
      String(reason.code || '''').trim().toUpperCase() === DEFAULT_REASON_CODE
    );
    if (defaultReason) setCausa(defaultReason.code);
  }, [reasons, causa]);

  // ---------------------------------------------------------------- eligibility
  // AXX-272 CA-05: NO hay restriccion por ramo. La vista abre para cualquier ramo y aplican
  // unicamente los permisos y las reglas generales del sistema. Lo que sigue vigente de
  // AXX-253 es la elegibilidad por estado: solo polizas canceladas, y con saldo positivo.
  const isCancelled = policy
    ? (policy.active === false && (!!policy.inactiveDate || txt(policy.inactiveReason) !== ''''))
    : false;
  const pendingAmount = pending ? Number(pending.pending || 0) : 0;
  const hasBalance = pendingAmount > 0;

  let ineligible = '''';
  if (policy && !isCancelled) {
    ineligible = t(''This action is only available for cancelled policies. This policy is not cancelled.'');
  } else if (policy && !hasBalance) {
    ineligible = t(''This policy has no positive pending premium balance, so there is nothing to write off.'') + '' '' + t(''Current balance'') + '' - '' + money(pendingAmount) + ''.'';
  }
  const eligible = !!policy && !ineligible;

  // ---------------------------------------------------------------- validation
  const missing = [];
  if (!txt(causa)) missing.push(t(''Cause''));
  if (!effectiveDate) missing.push(t(''Effective date''));
  if (!txt(observation)) missing.push(t(''Observation''));
  const formValid = missing.length === 0;

  const fmtDate = (d) => (d && d.format ? d.format(''YYYY-MM-DD'') : '''');

  const buildAdditional = () => JSON.stringify({
    endorsementType: ENDORSEMENT_TYPE,
    causa: txt(causa),
    observacion: txt(observation),
    effectiveDate: fmtDate(effectiveDate),
  });

  const buildData = (operation) => {
    const data = {
      policyId: policyId,
      reason: txt(causa),
      byHolder: false,
      effectiveDate: fmtDate(effectiveDate),
      cancellationProrateMode: 2,
      jAdditional: buildAdditional(),
      note: txt(observation),
    };
    if (operation) data.operation = operation;
    return data;
  };

  // ----------------------------------------------- CA-07/08/09: jDetail en cero
  // Reescribe SOLO el detalle de este endoso: cada rubro nuevo queda en cero, el anterior se
  // conserva y la diferencia se reexpresa como nuevo - anterior. Este endoso cancela el saldo
  // completo, sin prorrata, asi que el costo del rubro es la totalidad de lo dado de baja.
  const zeroDetail = (jDetailText, balanceDetail) => {
    let d = {};
    try { d = JSON.parse(jDetailText || ''{}''); } catch (e) { d = {}; }
    const balance = balanceDetail || {};
    const pendingTotal = firstMoney(balance.pendingTotal, pendingAmount, d.pendingTotal);
    const pendingTax = firstMoneyOrNull(balance.pendingTax, d.pendingTax);
    const pendingPremium = firstMoneyOrNull(balance.pendingPremium, d.pendingPremium);
    const premiumBalance = pendingPremium !== null ? pendingPremium : round2(Math.max(pendingTotal - (pendingTax || 0), 0));
    const taxBalance = pendingTax !== null ? pendingTax : 0;

    d.pendingPremium = premiumBalance;
    d.pendingTax = taxBalance;
    d.pendingTotal = pendingTotal;

    const pair = (oldKey, newKey, difKey, costKey, forcedOld) => {
      const oldVal = round2(forcedOld);
      d[oldKey] = oldVal;
      d[newKey] = 0;
      d[difKey] = round2(0 - oldVal);
      if (costKey) d[costKey] = round2(0 - oldVal);
    };
    pair(''oldAnnualPremium'', ''newAnnualPremium'', ''annualPremiumDif'', ''changeCost'', pendingTotal);
    pair(''oldCoverages'', ''newCoverages'', ''coveragesDif'', ''coveragesCost'', premiumBalance);
    pair(''oldTax'', ''newTax'', ''taxDif'', ''taxCost'', taxBalance);
    if (Array.isArray(d.Coverages)) {
      const weights = d.Coverages.map((c) => firstMoney(c.pendingPremium, c.newPremium, c.oldPremium));
      const weightTotal = weights.reduce((sum, value) => sum + Number(value || 0), 0);
      let allocated = 0;
      d.Coverages = d.Coverages.map((c, index) => {
        const weight = weights[index] || 0;
        const isLast = index === d.Coverages.length - 1;
        const proportional = weightTotal > 0 ? round2(premiumBalance * weight / weightTotal) : 0;
        const o = isLast ? round2(premiumBalance - allocated) : proportional;
        allocated = round2(allocated + o);
        const n = Object.assign({}, c);
        n.oldPremium = o;
        n.newPremium = 0;
        n.premiumDif = round2(0 - o);
        n.premiumCost = round2(0 - o);
        return n;
      });
    }
    return d;
  };

  // ------------------------------------------------- CA-11/12: regla de bloqueo
  // Devuelve los rubros que NO quedaron compensados, con su diferencia. Para este endoso Bill
  // representa el estado final de facturacion, asi que sus rubros deben quedar en cero. El saldo
  // previo se muestra solo en el comparativo visual usando el saldo pendiente y los auxiliares del
  // calculo, no como saldo final de Bill.
  // Nunca redondea a cero una diferencia distinta de cero para ocultarla: compara contra 0.00
  // en la precision monetaria del ambiente y reporta el importe tal cual.
  const computeResiduals = (d, bill, balance) => {
    const out = [];
    const check = (label, value) => {
      const v = round2(value);
      if (Math.abs(v) >= ZERO_EPS) out.push({ rubro: label, value: v });
    };
    check(t(''Annual premium''), d.newAnnualPremium);
    check(t(''Coverages''), d.newCoverages);
    check(t(''Tax''), d.newTax);
    (d.Coverages || []).forEach((c) => {
      check(t(''Coverage premium'') + '' '' + (c.code || c.id || ''''), c.newPremium);
    });
    if (bill) {
      const billingTotal = bill.anualTotal !== null && bill.anualTotal !== undefined
        ? Number(bill.anualTotal || 0)
        : Number(bill.annualTotal || 0);
      const billingBreakdown = Number(bill.anualPremium || 0)
        + Number(bill.tax || 0)
        + Number(bill.surcharges || 0)
        + Number(bill.discounts || 0)
        + Number(bill.fee || 0);

      check(t(''Billing breakdown''), billingBreakdown - billingTotal);
      check(t(''Billing total''), billingTotal);
      check(t(''Billing installment''), Number(bill.installment || 0));
    }
    return out;
  };

  // ---------------------------------------------------------------- actions
  const onQuote = async function () {
    setTouched(true);
    setActionError('''');
    setDone(null);
    if (!formValid) return;
    setQuoting(true);
    try {
      const r = await exe(''ChangeCancellation'', buildData(null));
      if (!r || !r.ok) {
        const errorMessage = responseMessage(
          r,
          t(''The endorsement could not be calculated. The endorsement was NOT applied and the policy was not changed.'')
        );
        setQuote(null); setDetail(null); setResiduals([]); setSavedChange(null);
        setActionError(errorMessage);
        message.error(errorMessage);
      } else {
        const pendingDetailRes = await exe(''ExeChain'', {
          chain: ''cmdGetUncollectiblePremium'',
          context: JSON.stringify({ policyId: policyId })
        }).catch(() => null);
        const quoteBreakdown = pendingDetailRes && pendingDetailRes.ok
          ? normalizePendingBreakdown(pendingDetailRes.outData)
          : normalizePendingBreakdown(pendingBreakdown || pending || { pending: pendingAmount });
        if (pendingDetailRes && pendingDetailRes.ok) {
          setPendingBreakdown(quoteBreakdown);
        }
        const d = zeroDetail(r.outData.jDetail, quoteBreakdown);
        const res = computeResiduals(d, r.outData.Bill, pendingAmount);
        setQuote(r.outData);
        setDetail(d);
        setResiduals(res);
        setQuotedBalance(pendingAmount);
        setSavedChange(null);
        if (res.length) message.warning(t(''The calculation does not reach a zero balance. Execution is blocked.''));
      }
    } catch (e) {
      setQuote(null); setDetail(null); setResiduals([]); setSavedChange(null);
      setActionError(responseMessage(
        e,
        t(''The endorsement could not be calculated. The endorsement was NOT applied and the policy was not changed.'')
      ));
    }
    setQuoting(false);
  };

  // Persiste el endoso con su detalle en cero, SIN ejecutarlo (CA-13).
  const saveEndorsement = async function () {
    const saved = await exe(''ChangeCancellation'', buildData(''ADD''));
    if (!saved || !saved.ok || !saved.outData || !saved.outData.id) {
      throw new Error(t(''The endorsement could not be saved. The endorsement was NOT applied and the policy was not changed.''));
    }
    const changeId = saved.outData.id;

    // Sobrescribe el detalle de ESTE endoso. El interceptor de este ambiente sobre
    // ChangeCancellation lee policyId y effectiveDate en TODA llamada, UPDATE incluida:
    // tienen que viajar junto a Entity o la actualizacion se rechaza.
    const loaded = await exe(''LoadEntity'', { entity: ''Change'', filter: ''id='' + changeId, noTracking: true });
    if (loaded && loaded.ok && loaded.outData) {
      const ent = Object.assign({}, loaded.outData, { jDetail: JSON.stringify(detail) });
      const upd = await exe(''ChangeCancellation'', {
        policyId: policyId, effectiveDate: fmtDate(effectiveDate), Entity: ent, operation: ''UPDATE'',
      });
      if (!upd || !upd.ok) {
        throw new Error(t(''The endorsement was saved as number '') + changeId + t('' but its detail could NOT be written, so it was not executed. Review it from the policy change list.''));
      }
    }

    // CA-17 de AXX-272 / CA-16 de AXX-253: este endoso no genera reaseguro. La rutina de
    // reaseguro sale antes de escribir cuando el cambio esta marcado como informativo. Es una
    // marca por cambio, puesta solo aqui, asi que la cancelacion nativa sigue distribuyendo igual.
    const inf = await exe(''SetField'', { entity: ''Change'', entityId: changeId, fieldValue: ''informative=1'' });
    if (!inf || !inf.ok) {
      throw new Error(t(''The endorsement was saved as number '') + changeId + t('' but it could NOT be prepared for execution, so it was not applied. Review it from the policy change list.''));
    }
    return { changeId: changeId, processId: Number(saved.outData.processId || 0) };
  };

  const onSave = async function () {
    setTouched(true);
    setActionError('''');
    if (!formValid || !quote || !detail) return;
    setSaving(true);
    try {
      const s = await saveEndorsement();
      setSavedChange(s);
      message.success(t(''Endorsement saved without executing.'') + '' '' + t(''Change number'') + '' - '' + s.changeId);
    } catch (e) {
      setActionError(String((e && e.message) || e));
      message.error(t(''The endorsement could not be saved.''));
    }
    setSaving(false);
  };

  const onExecute = async function () {
    setActionError('''');
    if (!formValid || !quote || !detail || !savedChange) return;
    if (residuals.length) {
      setActionError(t(''Execution is blocked while a rubro is different from zero.''));
      return;
    }
    setExecuting(true);
    try {
      // CA-15: revalidar contra el estado ACTUAL antes de aplicar. Si el saldo cambio desde el
      // calculo, se rechaza y se pide recalcular en vez de ejecutar con datos obsoletos.
      const fresh = await exe(''GetPendingPremiums'', { policyId: policyId });
      if (!fresh || !fresh.ok) throw new Error(t(''The pending premium balance could not be re-checked, so the endorsement was not executed.''));
      const freshBalance = Number((fresh.outData || {}).pending || 0);
      if (Math.abs(freshBalance - Number(quotedBalance || 0)) >= ZERO_EPS) {
        setQuote(null); setDetail(null); setResiduals([]); setSavedChange(null);
        setPending(fresh.outData);
        throw new Error(t(''The pending premium balance changed since the calculation, so the endorsement was not executed. Please calculate again.'') +
          '' '' + t(''Calculated balance'') + '' - '' + money(quotedBalance) + ''. '' + t(''Current balance'') + '' - '' + money(freshBalance) + ''.'');
      }

      // La ejecucion solo puede utilizar el endoso previamente guardado.
      // No se vuelve a crear ni modificar el endoso desde este flujo.
      const target = savedChange;

      // La cancelacion pasa por su propio flujo de aprobacion: ExeChangeCancellation rechaza un
      // cambio cuyo proceso no fue aprobado.
      let processId = Number(target.processId || 0);
      if (!processId) {
        const ent = await exe(''LoadEntity'', { entity: ''Change'', fields: ''id,processId'', filter: ''id='' + target.changeId, noTracking: true });
        if (ent && ent.ok && ent.outData) processId = Number(ent.outData.processId || 0);
      }
      if (processId) {
        const appr = await exe(''GotoStep'', { procesoId: processId, estado: ''APROVED'' });
        const apprRes = Array.isArray(appr) ? (appr[0] || {}) : appr;
        if (!apprRes || !apprRes.ok) {
          throw new Error(t(''The endorsement was saved as number '') + target.changeId + t('' but its approval workflow could NOT be advanced, so it was not applied. Review it from the policy change list.''));
        }
      }

      const exeRes = await exe(''ExeChangeCancellation'', { changeId: target.changeId });
      if (!exeRes || !exeRes.ok) {
        throw new Error(t(''The endorsement was saved as number '') + target.changeId + t('' but it could NOT be executed, so it was not applied. Review it from the policy change list.''));
      }
      const after = await exe(''GetPendingPremiums'', { policyId: policyId });
      setDone({ changeId: target.changeId, balance: after && after.ok ? Number((after.outData || {}).pending || 0) : null });
      message.success(t(''Uncollectible premium endorsement applied.'') + '' '' + t(''Change number'') + '' - '' + target.changeId);
      window.location.href = ''/#/lifePolicy/'' + policyId;
    } catch (e) {
      setActionError(String((e && e.message) || e));
      message.error(t(''The endorsement could not be executed.''));
    }
    setExecuting(false);
  };

  // ---------------------------------------------------------------- render
  if (loading) return <Card className="uncollectible-view" title={t(''Uncollectible Premium Endorsement'')} bodyStyle={{ padding: 12 }}><Skeleton active /></Card>;

  if (loadError) {
    return (
      <Card className="uncollectible-view" title={t(''Uncollectible Premium Endorsement'')} bodyStyle={{ padding: 12 }}>
        <Alert type="error" showIcon message={t(''The endorsement cannot be opened'')} description={loadError} />
      </Card>
    );
  }

  const bill = quote && quote.Bill ? quote.Bill : null;
  const reasonOptions = reasons.map((r) => <Select.Option key={r.code} value={r.code}>{t(r.name)}</Select.Option>);
  const zeroOk = !!detail && residuals.length === 0;

  // Montos en grilla: positivo verde, negativo rojo, cero negro y peso normal (CA-19).
  const amountStyle = (v) => {
    const n = Number(v || 0);
    if (Math.abs(n) < ZERO_EPS) return { color: ''#262626'', fontWeight: ''normal'' };
    return { color: n > 0 ? ''#237804'' : ''#cf1322'' };
  };
  const amountCell = (v) => <span style={amountStyle(v)}>{money(v)}</span>;

  const parseJDetail = (value) => {
    try {
      if (!value) return {};
      return typeof value === ''string'' ? JSON.parse(value) : value;
    } catch (e) {
      return {};
    }
  };

  // Bill ahora representa el estado final de facturacion y puede venir en cero. El "antes" del
  // comparativo debe salir del saldo pendiente real o de los auxiliares del calculo, no de Bill.
  const calculatedDetail = parseJDetail(quote && quote.jDetail);
  const pendingTotal = firstMoney(
    bill && bill.pendingTotal,
    pendingBreakdown && pendingBreakdown.pendingTotal,
    pendingAmount,
    calculatedDetail.pendingTotal
  );
  const pendingTax = firstMoneyOrNull(
    bill && bill.pendingTax,
    pendingBreakdown && pendingBreakdown.pendingTax,
    pending && pending.pendingTax,
    pending && pending.tax,
    calculatedDetail.pendingTax
  );
  const pendingPremium = firstMoneyOrNull(
    bill && bill.pendingPremium,
    pendingBreakdown && pendingBreakdown.pendingPremium,
    pending && pending.pendingPremium,
    pending && pending.premium,
    calculatedDetail.pendingPremium
  );
  const currentAnnual = pendingTotal;
  const currentTax = pendingTax !== null ? pendingTax : 0;
  const currentCoverages = pendingPremium !== null ? pendingPremium : round2(Math.max(pendingTotal - currentTax, 0));
  const calculatedCoverages = Array.isArray(calculatedDetail.Coverages)
    ? calculatedDetail.Coverages
    : (detail && Array.isArray(detail.Coverages) ? detail.Coverages : []);
  const coverageWeights = calculatedCoverages.map((c) => firstMoney(c.pendingPremium, c.newPremium, c.oldPremium));
  const coverageWeightTotal = coverageWeights.reduce((sum, value) => sum + Number(value || 0), 0);
  let allocatedCoverageTotal = 0;

  const detailRows = detail ? [
    { key: ''annual'', rubro: t(''Annual premium''), old: currentAnnual, neu: detail.newAnnualPremium },
    { key: ''coverages'', rubro: t(''Coverages''), old: currentCoverages, neu: detail.newCoverages },
    { key: ''tax'', rubro: t(''Tax''), old: currentTax, neu: detail.newTax },
  ].concat(calculatedCoverages.map((c, i) => {
    const weight = coverageWeights[i] || 0;
    const isLast = i === calculatedCoverages.length - 1;
    const proportionalAmount = coverageWeightTotal > 0
      ? round2(currentCoverages * weight / coverageWeightTotal)
      : 0;
    const coverageAmount = isLast
      ? round2(currentCoverages - allocatedCoverageTotal)
      : proportionalAmount;
    allocatedCoverageTotal = round2(allocatedCoverageTotal + coverageAmount);
    return {
      key: ''cov'' + i,
      rubro: t(''Coverage premium'') + '' '' + (c.code || c.id || ''''),
      old: coverageAmount,
      neu: 0,
    };
  })) : [];

  const detailColumns = [
    { title: t(''Item''), dataIndex: ''rubro'', key: ''rubro'' },
    { title: t(''Current balance''), dataIndex: ''old'', key: ''old'', align: ''right'', render: (v) => amountCell(v) },
    { title: t(''New value''), dataIndex: ''neu'', key: ''neu'', align: ''right'', render: (v) => amountCell(v) },
  ];

  return (
    <Card
      className="uncollectible-view"
      title={t(''Uncollectible Premium Endorsement'')}
      bodyStyle={{ padding: 12, display: ''flex'', flexDirection: ''column'', minHeight: 0, overflow: ''hidden'' }}>
      <style>{VIEW_CSS}</style>
      <Descriptions className="uncollectible-summary" size="small" column={3} bordered style={{ marginBottom: 12 }}>
        <Descriptions.Item label={t(''Policy'')}>{policy.code}</Descriptions.Item>
        <Descriptions.Item label={t(''Line of business'')}>{lobName || policy.lob}</Descriptions.Item>
        <Descriptions.Item label={t(''Product'')}>{productName || policy.productCode}</Descriptions.Item>
        <Descriptions.Item label={t(''Pending premium balance'')} span={2}>
          <b>{money(pendingAmount)}</b>
        </Descriptions.Item>
        <Descriptions.Item label={t(''Status'')}>
          {isCancelled
            ? <Tag color="red">{t(''Cancelled'')}</Tag>
            : <Tag color="green">{t(''Not cancelled'')}</Tag>}
        </Descriptions.Item>
      </Descriptions>

      {!eligible ? (
        <Alert type="warning" showIcon message={t(''This endorsement is not available for this policy'')} description={ineligible} />
      ) : null}

      {done ? (
        <Alert
          type="success"
          showIcon
          style={{ marginBottom: 12 }}
          message={t(''Uncollectible premium endorsement applied.'') + '' '' + t(''Change number'') + '' - '' + done.changeId}
          description={t(''Pending premium balance after the endorsement'') + '' - '' + money(done.balance) + ''. '' + t(''The policy accepts no further endorsements; any later change requires a new policy.'')}
        />
      ) : null}

      {actionError ? (
        <Alert type="error" showIcon style={{ marginBottom: 12 }} message={t(''The endorsement was not applied'')} description={actionError} />
      ) : null}

      {eligible && !done ? (
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label={t(''Cause'')} required
                validateStatus={touched && !txt(causa) ? ''error'' : ''''}
                help={touched && !txt(causa) ? t(''This field is required.'') : ''''}>
                <Select id="causa" value={causa} disabled={!!savedChange} onChange={(v) => { setCausa(v); setTouched(true); setQuote(null); setDetail(null); setResiduals([]); setSavedChange(null); }} placeholder={t(''Please select cause'')}>
                  {reasonOptions}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={t(''Endorsement effective date'')} required
                validateStatus={touched && !effectiveDate ? ''error'' : ''''}
                help={touched && !effectiveDate ? t(''This field is required.'') : ''''}>
                <DatePicker id="effectiveDate" disabled={!!savedChange} style={{ width: ''100%'' }} format="YYYY-MM-DD"
                  value={effectiveDate} onChange={(d) => { setEffectiveDate(d); setTouched(true); setQuote(null); setDetail(null); setResiduals([]); setSavedChange(null); }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={t(''Endorsement observation'')} required
                validateStatus={touched && !txt(observation) ? ''error'' : ''''}
                help={touched && !txt(observation) ? t(''This field is required.'') : ''''}>
                <Input.TextArea id="observation" disabled={!!savedChange} rows={2} maxLength={500} value={observation}
                  onChange={(e) => { setObservation(e.target.value); setTouched(true); setQuote(null); setDetail(null); setResiduals([]); setSavedChange(null); }} />
              </Form.Item>
            </Col>
          </Row>

          <div className="uncollectible-toolbar">
            <Space size={8}>
            <Button id="btnQuote" type="primary" disabled={!!savedChange} loading={quoting} onClick={onQuote}>{t(''Calculate'')}</Button>
            <Button id="btnSave" type="primary" loading={saving} disabled={!quote || !!savedChange} onClick={onSave}>{t(''Save endorsement'')}</Button>
            <Popconfirm
              title={t(''The pending premium balance will be written off and the policy will accept no further endorsements. Continue?'')}
              okText={t(''Yes'')} cancelText={t(''No'')} disabled={!savedChange || !zeroOk} onConfirm={onExecute}>
              <Button id="btnExecute" type="primary" disabled={!savedChange || !zeroOk} loading={executing}>{t(''Execute endorsement'')}</Button>
            </Popconfirm>
            {!formValid && touched ? <span style={{ color: ''#cf1322'' }}>{t(''Required'') + '' - '' + missing.join('', '')}</span> : null}
            </Space>
          </div>

          {savedChange ? (
            <Alert type="info" showIcon style={{ marginTop: 12 }}
              message={t(''Endorsement saved without executing.'') + '' '' + t(''Change number'') + '' - '' + savedChange.changeId}
              description={t(''The endorsement is persisted with its detail. It has not been executed yet.'')} />
          ) : null}
        </Form>
      ) : null}

      {/* CA-12: rubro y diferencia, y Ejecutar bloqueado */}
      {detail && residuals.length ? (
        <Alert type="error" showIcon style={{ marginTop: 12 }}
          message={t(''Execution is blocked while a rubro is different from zero.'')}
          description={
            <div>
              <div style={{ marginBottom: 6 }}>{t(''The following items did not reach a zero balance. The difference is reported at the official monetary precision and is never rounded to zero.'')}</div>
              {residuals.map((r, i) => (
                <div key={i}>• {r.rubro} — {t(''residual difference'')} <b style={amountStyle(r.value)}>{money(r.value)}</b></div>
              ))}
            </div>
          } />
      ) : null}

      {detail && !residuals.length ? (
        <Alert type="success" showIcon style={{ marginTop: 12 }}
          message={t(''The calculation reaches a zero balance in every required item.'')}
          description={t(''Annual premium, coverages, coverage premiums, tax and billing amounts are all 0.00.'')} />
      ) : null}

      {detail || bill ? (
        <div className="axx272-detail-tabs" style={{ marginTop: 16 }}>
          <Tabs className="uncollectible-tabs" defaultActiveKey={detail ? ''endorsement'' : ''cancellation''} type="card">
            {detail ? (
              <Tabs.TabPane tab={t(''Endorsement detail'')} key="endorsement">
                <style>{DETAIL_GRID_CSS}</style>
                <div className="axx272-detail">
                  <Table
                    size="small"
                    bordered
                    pagination={false}
                    rowKey="key"
                    dataSource={detailRows}
                    columns={detailColumns}
                  />
                </div>
              </Tabs.TabPane>
            ) : null}

            {bill ? (
              <Tabs.TabPane tab={t(''Cancellation detail'')} key="cancellation">
                <Descriptions size="small" column={2} bordered>
                  <Descriptions.Item label={t(''Coverage Premiums'')}>{money(bill.coverages)}</Descriptions.Item>
                  <Descriptions.Item label={t(''Surcharges'')}>{money(bill.surcharges)}</Descriptions.Item>
                  <Descriptions.Item label={t(''Discounts'')}>{money(bill.discounts)}</Descriptions.Item>
                  <Descriptions.Item label={t(''Annual Premium'')}>{money(bill.anualPremium)}</Descriptions.Item>
                  <Descriptions.Item label={t(''Tax'')}>{money(bill.tax)}</Descriptions.Item>
                  <Descriptions.Item label={t(''Fee'')}>{money(bill.fee)}</Descriptions.Item>
                  <Descriptions.Item label={t(''Total'')}><b>{money(bill.anualTotal)}</b></Descriptions.Item>
                  <Descriptions.Item label={t(''Modal Premium'')}>{money(bill.installment)}</Descriptions.Item>
                </Descriptions>
                <Alert type="info" showIcon style={{ marginTop: 8 }}
                  message={t(''Bill represents the final billing state returned by the calculation. For this endorsement every billing amount must remain at 0.00; the previous balance is shown in the endorsement detail only for comparison.'')} />
              </Tabs.TabPane>
            ) : null}
          </Tabs>
        </div>
      ) : null}
    </Card>
  );
}
', N'ENDORSEMENT', N'Endoso de Prima Incobrable: cancela el saldo de prima pendiente de una poliza de fianzas cancelada (AXX-253).', 0);

    INSERT INTO dbo.LiveView (id, name, code, category, operation, multiComponent) VALUES (45, N'BorderoMovimientos', N'()=>{
  /*
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
   *      ni traducción ni catálogo, ''Movimiento sin descripción'' — sin maquillar la
   *      clave (corrección de la ronda 1 de pruebas de AXX-300).
   *
   * Ronda 1 de corrección (AXX-271): los rótulos de acción salían en inglés en pantalla
   * porque t() resuelve contra el idioma de la sesión, no contra el idioma configurado
   * del ambiente. Ahora todo el texto visible es literal en español.
   */
  const { useState, useEffect } = React;
  const { Table, Select, Button, DatePicker, Skeleton, Space, Row, Col, Form, Drawer,
          Tag, Tooltip, Empty, Pagination, message } = A;

  const VERDE = ''#60b13d'', VERDE_B = ''#4f9336'', BORDE = ''#cbd1d8'', BARRA_B = ''#e6ebf2'';

  const IconoLupa = () =>
    <span role=''img'' aria-label=''search'' className=''anticon anticon-search''>
      <svg viewBox=''64 64 896 896'' focusable=''false'' width=''1em'' height=''1em'' fill=''currentColor'' aria-hidden=''true''>
        <path d=''M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z'' />
      </svg>
    </span>;

  const IconoDescarga = () =>
    <span role=''img'' aria-label=''download'' className=''anticon anticon-download''>
      <svg viewBox=''64 64 896 896'' focusable=''false'' width=''1em'' height=''1em'' fill=''currentColor'' aria-hidden=''true''>
        <path d=''M505.7 661a8 8 0 0012.6 0l112-141.7c4.1-5.2.4-12.9-6.3-12.9h-74.1V168c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v338.3H400c-6.7 0-10.4 7.7-6.3 12.9l112 141.8zM878 626h-60c-4.4 0-8 3.6-8 8v154H214V634c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v198c0 17.7 14.3 32 32 32h684c17.7 0 32-14.3 32-32V634c0-4.4-3.6-8-8-8z'' />
      </svg>
    </span>;

  /* Presentación: 2 decimales, medio hacia arriba. El cálculo y las restas de delta
     viajan en precisión completa desde el servidor y así se exportan. */
  function money(v){
    if(v === null || v === undefined || isNaN(Number(v))) return '''';
    const n = Number(v);
    const r = Math.round(Math.abs(n) * 100 + 1e-9) / 100;
    const s = r.toLocaleString(''en-US'', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (n < 0 ? ''-'' : '''') + s;
  }
  function fecha(v){ return v ? String(v).substring(0,10) : ''''; }
  function num(v){ return (v === null || v === undefined || isNaN(Number(v))) ? 0 : Number(v); }
  /* CA-05 — el tipo solo no identifica el movimiento: una poliza puede traer dos
     reemisiones el mismo dia con los mismos importes (824 EMI:2/EMI:3, 829 EMI:3/EMI:6
     en global1) y sin la clave quedan como dos filas identicas. La clave del movimiento
     es el "id de movimiento" que el diseno de AXX-252 pide conservar; va dentro de la
     columna Tipo para no alterar la lista exacta de 34 encabezados. */
  /* AXX-300 alcance 3 — nombre del movimiento en español en la columna Tipo.
     Se resuelve por t() PRIMERO, como pide el requerimiento, pero el resultado se
     VALIDA: t() devuelve la propia clave cuando no hay traducción (i18next resuelve
     contra el idioma de la SESIÓN, que en este ambiente corre en ''en'' — medido en
     AXX-271), y el diccionario ES cubre 4 de las 24 clases de movimiento, una de ellas
     mapeada a sí misma. Sin la validación el usuario leería ''InsuredObjectChange''.
     Orden: t() válido -> catálogo en español -> ''Movimiento sin descripción''.
     Nunca una clave cruda, nunca vacío, nunca undefined.
     Montos, códigos e ids NO se traducen: la clave del movimiento va tal cual. */
  const TIPO_MOV_ES = {
    ''EMISION'': ''Emisión'',
    ''ANIVERSARIO'': ''Aniversario'',
    ''CANCELACION'': ''Cancelación'',
    ''RETIRO DE CESION'': ''Retiro de cesión'',
    ''ENDOSO'': ''Endoso'',
    ''AddCoverageChange'': ''Alta de cobertura'',
    ''BeneficiaryChange'': ''Cambio de beneficiarios'',
    ''BenefitChange'': ''Cambio de beneficio'',
    ''CancellationChange'': ''Cancelación'',
    ''CapitalChange'': ''Cambio de capital'',
    ''CessionBeneficiaryChange'': ''Cambio de beneficiario de cesión'',
    ''ClauseChange'': ''Cambio de cláusulas'',
    ''ContingentBeneficiaryChange'': ''Cambio de beneficiario contingente'',
    ''CoverageChange'': ''Cambio de coberturas'',
    ''CoverageChangeTechData'': ''Cambio de datos técnicos de cobertura'',
    ''ExclusionChange'': ''Cambio de exclusiones'',
    ''FrequencyChange'': ''Cambio de frecuencia'',
    ''InformativeChange'': ''Cambio informativo'',
    ''InsuredObjectChange'': ''Cambio de objeto asegurado'',
    ''IntermediaryChange'': ''Cambio de intermediario'',
    ''LoadingChange'': ''Recargo / Descuento'',
    ''PaymentMethodChange'': ''Cambio de medio de pago'',
    ''PayPlanChange'': ''Cambio de plan de pagos'',
    ''PolicyholderChange'': ''Cambio de tomador'',
    ''PolicySurchargeChange'': ''Cambio de recargos de póliza'',
    ''ReinstatementChange'': ''Rehabilitación'',
    ''RemoveCoverageChange'': ''Baja de cobertura'',
    ''TemporalStatusChange'': ''Cambio de estado temporal'',
    ''TermChange'': ''Cambio de vigencia''
  };

  /* AXX-300, ronda 1 de corrección — el respaldo NO embellece la clave.
     Había un paso intermedio que separaba el CamelCase; para una clave sin descripción
     producía ''X'', ''Zzz 001'', ''Undefined''. Eso sigue siendo la clave técnica, apenas
     maquillada, y es exactamente lo que el supuesto 5 del dictamen prohíbe. Sin
     traducción y sin catálogo, el texto es el aprobado y no hay tercer intento. */
  const SIN_DESCRIPCION = ''Movimiento sin descripción'';

  function traducirTipo(v){
    const k = (v === null || v === undefined) ? '''' : String(v).trim();
    const kb = k.toLowerCase();
    /* ''undefined'' y ''null'' COMO TEXTO son ausencia de dato, no un tipo de movimiento. */
    if (!k || kb === ''undefined'' || kb === ''null'') return SIN_DESCRIPCION;
    /* 1 - t(), aceptado solo si devolvio una traduccion real y no la clave. */
    let r1 = '''';
    try {
      if (typeof t === ''function'') {
        const r = t(k);
        const rs = (r === null || r === undefined) ? '''' : String(r).trim();
        if (rs && rs !== k) r1 = rs;
      }
    } catch (e) { r1 = ''''; }
    /* 2 - catalogo en espanol de las clases de movimiento del ambiente. */
    if (!r1 && TIPO_MOV_ES[k]) r1 = TIPO_MOV_ES[k];
    /* 3 - no hay tercer intento: si no hay descripcion, el respaldo aprobado. */
    return r1 || SIN_DESCRIPCION;
  }

  function etiquetaMovimiento(r){
    const tp = traducirTipo(r ? r.tipo : '''');
    return r && r.movKey ? (tp + '' · '' + r.movKey) : tp;
  }
  function claveMovimiento(r){
    return [r.poliza, r.id, r.movKey, fecha(r.fechaEmision), r.cserie].join(''|'');
  }

  /* UNA sola definición de columnas: de acá salen la grilla Y el archivo exportado.
     Por eso CA-09 ("el archivo respeta las mismas columnas, encabezados y orden")
     no puede desincronizarse: no hay dos listas que mantener.
     🔴 TODO texto visible de esta vista va LITERAL en español, incluidos los rótulos de
     acción. `t()` resuelve contra el idioma de la SESIÓN, y la sesión de este ambiente
     corre en `en` aunque el único idioma configurado sea ES y el diccionario tenga las
     claves: `t(''Filter'')` llega al usuario como "Filter". Medido en pantalla real
     (AXX-271, ronda 1 del tester). Además el diccionario traduce mal ''End Date'' y
     ''Start Date''. El requerimiento nombra Filtrar / Exportar / Buscar / Limpiar filtros:
     eso es lo que se dibuja, sin intermediario. */
  const COLUMNAS = [
    { t: ''id'',                        c: ''id'',                  w: 75,  tipo: ''txt'', fixed: ''left'' },
    { t: ''Ramo'',                      c: ''lob'',                 w: 155, tipo: ''ramo'' },
    { t: ''Plan'',                      c: ''plan'',                w: 100, tipo: ''txt'' },
    { t: ''Poliza'',                    c: ''poliza'',              w: 155, tipo: ''poliza'' },
    { t: ''Recibo'',                    c: ''recibo'',              w: 100, tipo: ''txt'' },
    { t: ''Tipo'',                      c: ''tipo'',                w: 170, tipo: ''mov'' },
    { t: ''Contratante'',               c: ''contratante'',         w: 175, tipo: ''txt'' },
    { t: ''Asegurado'',                 c: ''asegurado'',           w: 175, tipo: ''txt'' },
    { t: ''Fecha Emision'',             c: ''fechaEmision'',        w: 115, tipo: ''fecha'' },
    { t: ''Fecha Desde'',               c: ''fDesde'',              w: 105, tipo: ''fecha'' },
    { t: ''Fecha Hasta'',               c: ''fHasta'',              w: 105, tipo: ''fecha'' },
    { t: ''Suma Asegurada 100%'',       c: ''sumaAsegurada100'',    w: 150, tipo: ''num'' },
    { t: ''Suma Retenida'',             c: ''sumaRetenida'',        w: 125, tipo: ''num'' },
    { t: ''Suma Cedida'',               c: ''sumaCedida'',          w: 125, tipo: ''num'' },
    { t: ''Suma Cuota Parte'',          c: ''sumaCuotaParte'',      w: 135, tipo: ''num'' },
    { t: ''Suma Excedente'',            c: ''sumaExcedente'',       w: 135, tipo: ''num'' },
    { t: ''Suma Facultativa'',          c: ''sumaFacultativa'',     w: 135, tipo: ''num'' },
    { t: ''Prima Suscrita 100%'',       c: ''primaSuscrita100'',    w: 145, tipo: ''num'' },
    { t: ''Prima Retenida'',            c: ''primaRetenida'',       w: 125, tipo: ''num'' },
    { t: ''Prima Cedida'',              c: ''primaCedida'',         w: 125, tipo: ''num'' },
    { t: ''Suma Prima Cuota Parte'',    c: ''primaCuotaParte'',     w: 165, tipo: ''num'' },
    { t: ''Suma Prima Excedente'',      c: ''primaExcedente'',      w: 160, tipo: ''num'' },
    { t: ''Prima Cat'',                 c: ''primaCat'',            w: 105, tipo: ''num'' },
    { t: ''Prima Facultativa'',         c: ''primaFacultativa'',    w: 135, tipo: ''num'' },
    { t: ''Comision Contractual'',      c: ''comisionContractual'', w: 155, tipo: ''num'' },
    { t: ''Comision Cuota Parte'',      c: ''comisionCuotaParte'',  w: 160, tipo: ''num'' },
    { t: ''Comision Excedente'',        c: ''comisionExcedente'',   w: 155, tipo: ''num'' },
    { t: ''Comision Facultativa'',      c: ''comisionFacultativa'', w: 160, tipo: ''num'' },
    { t: ''Impuesto'',                  c: ''impuesto'',            w: 105, tipo: ''num'' },
    { t: ''Impuesto Facultativo'',      c: ''impuestoFacultativo'', w: 155, tipo: ''num'' },
    { t: ''Reaseguro por Cuota Parte'', c: ''reaseguroCuotaParte'', w: 175, tipo: ''num'' },
    { t: ''Reaseguro por Excedente'',   c: ''reaseguroExcedente'',  w: 175, tipo: ''num'' },
    { t: ''Reaseguro por Pagar'',       c: ''reaseguroPorPagar'',   w: 160, tipo: ''num'' },
    { t: ''cserie'',                    c: ''cserie'',              w: 85,  tipo: ''txt'' }
  ];

  /* AXX-300 alcance 1 - el ancho total de la grilla es la SUMA de los anchos de columna,
     y se le entrega a la tabla como scroll.x. Con x:''max-content'' (AXX-271) antd ignoraba
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
    ''.bm-view{display:flex;flex-direction:column;min-height:0;overflow:hidden;height:calc(100dvh - 190px);font-size:13px}'',
    ''.bm-view{max-width:100%}'',
    ''.bm-topbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;background:transparent;border:1px solid '' + BARRA_B + '';'',
    ''  border-radius:6px;padding:10px 12px;margin:0 0 2px 4px}'',
    ''.bm-topbar .ant-btn{border-color:#8f9aa7}'',
    ''.bm-topbar .ant-btn-primary{border-color:#1677ff}'',
    ''.bm-topbar .ant-btn[disabled]{border-color:#6f7b88;opacity:1}'',
    ''.bm-export{background:'' + VERDE + '';border-color:'' + VERDE_B + '';color:#fff}'',
    ''.bm-export:hover,.bm-export:focus{background:'' + VERDE + '';border-color:'' + VERDE_B + '';color:#fff;opacity:.92}'',
    ''.bm-export[disabled],.bm-export[disabled]:hover{background:'' + VERDE + '';border-color:#6f7b88;color:#fff;opacity:1}'',
    ''.bm-grid{flex:1 1 auto;min-height:0;display:flex;flex-direction:column}'',
    ''.bm-grid .ant-table-wrapper,.bm-grid .ant-spin-nested-loading,.bm-grid .ant-spin-container,'',
    ''.bm-grid .ant-table,.bm-grid .ant-table-container{height:100%;display:flex;flex-direction:column;min-height:0}'',
    ''.bm-grid .ant-table-body{flex:1 1 auto;min-height:0}'',
    /* AXX-300 alcance 1 - el scroll horizontal vive en el cuerpo de la grilla y en
       ningun ancestro: la vista no puede desbordar el contenedor ni la ventana. */
    ''.bm-grid,.bm-grid .ant-table-wrapper,.bm-grid .ant-table,.bm-grid .ant-table-container{max-width:100%;overflow-x:hidden}'',
    ''.bm-grid .ant-table-body{overflow-x:auto !important;overflow-y:auto !important}'',
    ''.bm-grid .ant-table-header{overflow:hidden !important}'',
    ''.bm-grid .ant-table{border:1px solid '' + BORDE + '';border-radius:0}'',
    ''.bm-grid .ant-table-thead>tr>th{background:#bfbfbf;font-size:12px;line-height:18px;padding:5px 6px;'',
    ''  white-space:normal;word-break:normal;overflow-wrap:anywhere;'',
    ''  border-right:1px solid '' + BORDE + '';border-bottom:1px solid '' + BORDE + ''}'',
    ''.bm-grid .ant-table-tbody>tr>td{font-size:12px;line-height:18px;padding:5px 6px;'',
    ''  border-right:0;border-bottom:1px solid '' + BORDE + ''}'',
    ''.bm-grid .ant-table-tbody>tr{cursor:pointer}'',
    ''.bm-grid .ant-table-tbody>tr:hover>td,.bm-grid .ant-table-tbody>tr.ant-table-row-hover>td,'',
    ''.bm-grid .ant-table-tbody>tr.ant-table-row:hover>td{background:#b7d7ff !important}'',
    ''.bm-grid .ant-table-tbody>tr.bm-row-selected>td,'',
    ''.bm-grid .ant-table-tbody>tr.ant-table-row-selected>td,'',
    ''.bm-grid .ant-table-tbody>tr.bm-row-selected:hover>td,'',
    ''.bm-grid .ant-table-tbody>tr.ant-table-row-selected:hover>td{background:#86b4ff !important}'',
    ''.bm-pager{padding:6px 4px 2px 0;text-align:right}'',
    ''.bm-drawer .ant-form-item{margin-bottom:12px}''
  ].join(''\n'');

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
        DateField_fdesde_bor: moment().startOf(''month''),
        DateField_fhasta_bor: moment(),
        ComboBox_cramo_bor: []
      };
    }

    async function cargarRamos(){
      setCargandoCat(true);
      const res = await exe(''RepoLob'', { operation: ''GET'' });
      if (res && res.ok) {
        setRamos((res.outData || []).map(function(l){
          return { value: String(l.code), label: (l.name ? l.name : String(l.code)) };
        }));
      } else {
        message.error(''No se pudo cargar el catálogo de ramos.'');
      }
      setCargandoCat(false);
    }

    function nombreRamo(code){
      const f = ramos.filter(function(x){ return x.value === String(code); });
      return f.length > 0 ? f[0].label : String(code === null || code === undefined ? '''' : code);
    }

    /* Valida y devuelve el criterio, o null. Devolver null es lo que mantiene el
       Drawer abierto en CA-02: la validación falló y el usuario tiene que verla. */
    function criterioDelFormulario(){
      const v = form.getFieldsValue();
      const d1 = v.DateField_fdesde_bor, d2 = v.DateField_fhasta_bor, rs = v.ComboBox_cramo_bor;
      if (!d1 || !d2) { message.error(''Fecha Inicial y Fecha Final son obligatorias.''); return null; }
      if (!rs || rs.length < 1) { message.error(''Debe seleccionar al menos un Ramo.''); return null; }
      if (d1.format(''YYYY-MM-DD'') > d2.format(''YYYY-MM-DD'')) {
        message.error(''La Fecha Inicial debe ser menor o igual a la Fecha Final.''); return null;
      }
      return {
        fdesde: d1.format(''YYYY-MM-DD''),
        fhasta: d2.format(''YYYY-MM-DD''),
        ramos: rs.map(function(x){ return String(x); })
      };
    }

    function mensajeDeError(res){
      const raw = res && res.msg ? String(res.msg) : '''';
      const limpio = raw.split(''fórmula ->'')[0].split(''formula ->'')[0]
                        .replace(''Error calculando fórmula. err ->'','''').trim();
      return limpio || ''No se pudo obtener el borderó.'';
    }

    async function consultar(pg, sz, base){
      const crit = base || criterio || criterioDelFormulario();
      if (!crit) return false;
      const ctxObj = { fdesde: crit.fdesde, fhasta: crit.fhasta, ramos: crit.ramos, page: pg, size: sz };
      setCargando(true);
      const res = await exe(''ExeChain'', { chain: ''cmdBorderoMovimientos'', context: JSON.stringify(ctxObj) });
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
      const codigo = String(fuente || '''').trim();
      if (!codigo) return;
      /* Mismo mecanismo que ya usa la exportación de borderó de este ambiente: la
         cadena devuelve el fuente de la librería porque el runtime no sale a Internet. */
      eval(codigo);
    }

    async function asegurarExcel(){
      if (typeof window !== ''undefined'' && window.XLSX) return;
      const res = await exe(''ExeChain'', { chain: ''cmdLoadLibrariesGroupedBordereau'', context: ''{}'' });
      if (!res || !res.ok) throw new Error(mensajeDeError(res));
      const libs = res.outData || {};
      const lib = libs.XLSX || libs.xlsx || libs.xlsxJs;
      if (!lib) throw new Error(''No es posible crear un archivo de Excel en este momento.'');
      if (typeof lib === ''string'') ejecutarLibreria(lib); else window.XLSX = lib;
    }

    function filaExportable(r){
      const o = {};
      COLUMNAS.forEach(function(col){
        const v = r[col.c];
        if (col.tipo === ''num'') o[col.t] = num(v);
        else if (col.tipo === ''mov'') o[col.t] = etiquetaMovimiento(r);
        else if (col.tipo === ''fecha'') o[col.t] = fecha(v);
        else if (col.tipo === ''ramo'') o[col.t] = nombreRamo(v);
        else o[col.t] = (v === null || v === undefined) ? '''' : v;
      });
      return o;
    }

    /* CA-08 / CA-09 / alcance 6-7 — el archivo NO sale de lo cargado en el navegador:
       se pide de nuevo al servidor con los MISMOS filtros y `exportar:true`, y la cadena
       responde el conjunto completo de la búsqueda en el mismo orden, sin paginar. */
    async function onExportar(){
      if (enVuelo.current) return;             /* supuesto 7 — doble clic */
      const crit = criterio;
      if (!crit) { message.info(''Primero realice una búsqueda.''); return; }
      enVuelo.current = true;
      setExportando(true);
      try {
        const ctxObj = { fdesde: crit.fdesde, fhasta: crit.fhasta, ramos: crit.ramos, exportar: true };
        const res = await exe(''ExeChain'', { chain: ''cmdBorderoMovimientos'', context: JSON.stringify(ctxObj) });
        if (!res || !res.ok) { message.error(mensajeDeError(res)); return; }
        const filas = (res.outData && res.outData.filas) ? res.outData.filas : [];
        /* CA-10 — sin datos no se genera un archivo vacío engañoso. */
        if (filas.length === 0) { message.info(''La búsqueda no devolvió movimientos para exportar.''); return; }
        await asegurarExcel();
        const X = (typeof window !== ''undefined'') ? window.XLSX : null;
        if (!X) { message.error(''No es posible crear un archivo de Excel en este momento.''); return; }
        const hoja = X.utils.json_to_sheet(filas.map(filaExportable),
                                           { header: COLUMNAS.map(function(c){ return c.t; }) });
        const libro = X.utils.book_new();
        X.utils.book_append_sheet(libro, hoja, ''Bordero'');
        X.writeFile(libro, ''Bordero-Movimientos-'' + crit.fdesde + ''_'' + crit.fhasta
                            + ''-'' + new Date().getTime() + ''.xlsx'');
        message.success(''Exportados '' + filas.length + '' movimientos.'');
      } catch (e) {
        message.error((e && e.message) ? String(e.message) : ''No se pudo exportar el borderó.'');
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
      if (typeof ResizeObserver !== ''undefined'' && cajaRef.current) {
        ro = new ResizeObserver(medir);
        ro.observe(cajaRef.current);
      }
      window.addEventListener(''resize'', medir);
      return function(){
        window.removeEventListener(''resize'', medir);
        if (ro) ro.disconnect();
      };
    }, [cargandoCat]);

    const columnas = COLUMNAS.map(function(col){
      const c = { title: col.t, dataIndex: col.c, width: col.w };
      if (col.fixed) c.fixed = col.fixed;
      if (col.tipo === ''num'') { c.align = ''right''; c.render = money; }
      else if (col.tipo === ''fecha'') c.render = fecha;
      else if (col.tipo === ''ramo'') c.render = function(v){ return nombreRamo(v); };
      else if (col.tipo === ''mov'') c.render = function(v, r){ return etiquetaMovimiento(r); };
      else if (col.tipo === ''poliza'') c.render = function(v, r){
        /* Un null de identidad no se coerciona: la fila se lista y queda marcada. */
        if (r && r.filaIncompleta === 1) {
          return <span>{ v || <i>(sin código)</i> } <Tooltip title=''Faltan datos de identidad de la póliza (código o recibo). El movimiento se lista igual, marcado como incompleto.''><Tag color=''orange''>incompleta</Tag></Tooltip></span>;
        }
        return v;
      };
      return c;
    });

    if (cargandoCat) return <DefaultPage title=''Borderó (Nuevo)'' icon=''file-protect''><Skeleton active /></DefaultPage>;

    const filas = (data && data.filas) ? data.filas : [];

    return <DefaultPage title=''Borderó (Nuevo)'' icon=''file-protect''>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className=''bm-view''>

        { /* Alcance 1 — UNA sola barra de botones, con Filtrar y Exportar. */ }
        <div className=''bm-topbar''>
          <Space size={ 8 }>
            <Button type=''primary'' icon={ <IconoLupa /> } onClick={ function(){ setAbierto(true); } }>
              { ''Filtrar'' }
            </Button>
            <Button className=''bm-export'' icon={ <IconoDescarga /> }
                    loading={ exportando } disabled={ exportando || cargando || !criterio }
                    onClick={ onExportar }>
              { ''Exportar'' }
            </Button>
          </Space>
          <span style={{ marginLeft: ''auto'', marginRight: 4, color: ''#5a6673'' }}>
            { data ? (num(data.total) + '' movimientos · '' + num(data.polizas) + '' pólizas'') : '''' }
          </span>
        </div>

        <div className=''bm-grid'' ref={ cajaRef }>
          { cargando
            ? <Skeleton active />
            : (!data
                ? <Empty description=''Presione Filtrar, defina el período y el ramo, y presione Buscar.'' />
                : (filas.length === 0
                    ? <Empty description=''Sin movimientos de reaseguro en el período y ramo seleccionados.'' />
                    : <Table size=''small'' rowKey={ claveMovimiento } dataSource={ filas }
                        columns={ columnas } pagination={ false }
                        scroll={{ x: ANCHO_TOTAL, y: alto }}
                        rowClassName={ function(r){ return claveMovimiento(r) === seleccion ? ''bm-row-selected'' : ''''; } }
                        onRow={ function(r){ return { onClick: function(){ setSeleccion(claveMovimiento(r)); } }; } } />
                  )
              )
          }
        </div>

        { /* CA-06 / CA-07 — 50 por página por defecto, resueltos en servidor. El paginador
             va aparte a propósito: si se le entrega a la grilla, antd vuelve a recortar en
             memoria las 50 filas de la página y la página 2 sale vacía. */ }
        { data && filas.length > 0
          ? <div className=''bm-pager''>
              <Pagination current={ page } pageSize={ size } total={ num(data.total) }
                showSizeChanger pageSizeOptions={ [''20'',''50'',''100'',''200''] } disabled={ cargando }
                showTotal={ function(tot){ return tot + '' movimientos · '' + num(data.polizas) + '' pólizas''; } }
                onChange={ function(p, s){ consultar(s !== size ? 1 : p, s, criterio); } } />
            </div>
          : null }

        { /* Alcance 2 / CA-01 — los filtros existentes, tal cual, dentro del Drawer. */ }
        <Drawer className=''bm-drawer'' title=''Filtros'' open={ abierto } width={ 420 }
                onClose={ function(){ setAbierto(false); } }
                footer={
                  <Space>
                    <Button type=''primary'' icon={ <IconoLupa /> } loading={ cargando } onClick={ onBuscar }>
                      { ''Buscar'' }
                    </Button>
                    <Button onClick={ onLimpiar } disabled={ cargando }>{ ''Limpiar filtros'' }</Button>
                  </Space>
                }>
          <Form form={ form } layout=''vertical''>
            <Form.Item label=''Fecha Inicial'' name=''DateField_fdesde_bor''
                       rules={[{ required: true, message: ''Fecha Inicial es obligatoria'' }]}>
              <DatePicker style={{ width: ''100%'' }} format=''YYYY-MM-DD'' allowClear={ false } />
            </Form.Item>
            <Form.Item label=''Fecha Final'' name=''DateField_fhasta_bor''
                       rules={[{ required: true, message: ''Fecha Final es obligatoria'' }]}>
              <DatePicker style={{ width: ''100%'' }} format=''YYYY-MM-DD'' allowClear={ false } />
            </Form.Item>
            <Form.Item label=''Ramo'' name=''ComboBox_cramo_bor''
                       rules={[{ required: true, message: ''Debe seleccionar al menos un Ramo'' }]}>
              <Select mode=''multiple'' allowClear placeholder=''Seleccione uno o más ramos''
                      options={ ramos } optionFilterProp=''label'' style={{ width: ''100%'' }} />
            </Form.Item>
          </Form>
        </Drawer>
      </div>
    </DefaultPage>;
  };

  return <App />;
}
', N'REINSURANCE', N'Permite visualizar un detalle de reaseguro de emisiones de pólizas y endosos', 0);

    INSERT INTO dbo.LiveView (id, name, code, category, operation, multiComponent) VALUES (46, N'viewContactMap', N'function ContactMap() {
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
      .replace(/''/g, "''''")
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
      parts.push("((isPerson=1 AND (RTRIM(ISNULL(name,'''')) + '' '' + RTRIM(ISNULL(surname1,''''))) LIKE N''" + nombre + "%'')" +
        " OR (isPerson=0 AND surname2 LIKE N''" + nombre + "%''))");
    }
    if (ident) parts.push("(cnp = N''" + ident + "'' OR nif = N''" + ident + "'')");
    if (code) parts.push("CAST(id AS NVARCHAR(50)) = N''" + code + "''");
    if (cobis) parts.push("CAST(nationalId AS NVARCHAR(50)) = N''" + cobis + "''");
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
', N'CONTACT', N'Permite visualizar un estado general de las relaciones de un contacto como, pólizas, reclamos, etc.', 0);

    INSERT INTO dbo.LiveView (id, name, code, category, operation, multiComponent) VALUES (47, N'BusquedaDeReclamos', N'() => {
  const Form = A.Form;
  const Drawer = A.Drawer;
  const Table = A.Table;
  const Input = A.Input;
  const Select = A.Select;
  const DatePicker = A.DatePicker;
  const Button = A.Button;
  const Space = A.Space;
  const Row = A.Row;
  const Col = A.Col;
  const Alert = A.Alert;
  const Tooltip = A.Tooltip;
  const message = A.message;
  const RangePicker = DatePicker.RangePicker;

  const SearchOutlinedIcon = () => (
    <span role="img" aria-label="search" className="anticon anticon-search">
      <svg viewBox="0 0 1024 1024" focusable="false" aria-hidden="true">
        <path d="M909.6 854.5 649.9 594.8a278.5 278.5 0 0 0 64.5-177.2c0-152.3-123.5-275.8-275.8-275.8S162.8 265.3 162.8 417.6s123.5 275.8 275.8 275.8c67.5 0 129.3-24.2 177.2-64.5l259.7 259.7a8 8 0 0 0 11.3 0l22.8-22.8a8 8 0 0 0 0-11.3zM438.6 637.4c-121.4 0-219.8-98.4-219.8-219.8s98.4-219.8 219.8-219.8 219.8 98.4 219.8 219.8-98.4 219.8-219.8 219.8z" />
      </svg>
    </span>
  );

  const ReloadOutlinedIcon = () => (
    <span role="img" aria-label="reload" className="anticon anticon-reload">
      <svg viewBox="0 0 1024 1024" focusable="false" aria-hidden="true">
        <path d="M909.1 209.3 862.6 364a8 8 0 0 1-10.7 5.1l-147.4-60.8a8 8 0 0 1-1.6-13.8l50.5-32.3A318.8 318.8 0 0 0 512 148c-176.7 0-320 143.3-320 320s143.3 320 320 320c149.4 0 274.8-102.4 310-240.9a8 8 0 0 1 7.8-6.1h49.8a8 8 0 0 1 7.8 9.8C849.5 717.9 696 844 512 844c-207.7 0-376-168.3-376-376S304.3 92 512 92c116.6 0 220.8 53.1 289.8 136.4l35.9-23a8 8 0 0 1 11.2 3.9z" />
      </svg>
    </span>
  );

  const PAGE_SIZE = 10;
  const EXPORT_PAGE_SIZE = 50;
  const EMPTY_VALUE = '''';
  const MAX_FILTER_LENGTH = 200;
  const CLAIM_INCLUDES = [''Contact'', ''Process'', ''Claimer'', ''Policy'', ''Stage''];

  const [form] = Form.useForm();
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [error, setError] = React.useState('''');
  const [filterDrawerOpen, setFilterDrawerOpen] = React.useState(false);
  const [filters, setFilters] = React.useState({});
  const [ordering, setOrdering] = React.useState({ orderBy: ''id'', orderDir: ''DESC'' });
  const [pagination, setPagination] = React.useState({
    current: 1,
    pageSize: PAGE_SIZE,
    total: 0
  });
  const [catalogsLoading, setCatalogsLoading] = React.useState(false);
  const [productsLoading, setProductsLoading] = React.useState(false);
  const [contactSearchLoading, setContactSearchLoading] = React.useState({ claimant: false, insured: false });
  const [policySearchLoading, setPolicySearchLoading] = React.useState(false);
  const [claimantOptions, setClaimantOptions] = React.useState([]);
  const [insuredOptions, setInsuredOptions] = React.useState([]);
  const [policyOptions, setPolicyOptions] = React.useState([]);
  const [lobOptions, setLobOptions] = React.useState([]);
  const [productCatalog, setProductCatalog] = React.useState([]);
  const [stageOptions, setStageOptions] = React.useState([]);

  const listRequestRef = React.useRef(0);
  const mountedRef = React.useRef(true);
  const shellRef = React.useRef(null);
  const catalogRequestRef = React.useRef(0);
  const contactRequestRef = React.useRef({ claimant: 0, insured: 0 });
  const policyRequestRef = React.useRef(0);
  const productRequestRef = React.useRef(0);
  const searchTimersRef = React.useRef({ claimant: null, insured: null, policy: null });
  const xlsxLibraryPromiseRef = React.useRef(null);

  const firstValue = (value) => Array.isArray(value) ? value[0] : value;

  const cleanString = (value) => String(firstValue(value) || '''')
    .replace(/[\u0000-\u001f\u007f]/g, '' '')
    .replace(/\s+/g, '' '')
    .trim()
    .slice(0, MAX_FILTER_LENGTH);

  const escapeFilterString = (value) => cleanString(value).replace(/''/g, "''''");

  const positiveInteger = (value, label) => {
    const normalized = cleanString(value);
    if (!normalized) return null;
    const number = Number(normalized);
    if (!/^\d+$/.test(normalized) || !Number.isSafeInteger(number) || number <= 0) {
      throw new Error(label + '' debe ser un número entero válido mayor que cero.'');
    }
    return number;
  };

  const formatFilterDate = (value) => {
    if (!value) return '''';
    if (typeof value.format === ''function'') return value.format(''YYYY-MM-DD'');
    const date = new Date(value);
    if (isNaN(date.getTime())) throw new Error(''Se recibió una fecha inválida.'');
    const pad = (part) => String(part).padStart(2, ''0'');
    return date.getFullYear() + ''-'' + pad(date.getMonth() + 1) + ''-'' + pad(date.getDate());
  };

  const validateRange = (range, label) => {
    if (!range || !range.length) return null;
    const from = formatFilterDate(range[0]);
    const to = formatFilterDate(range[1]);
    if (!from || !to) throw new Error(''Complete el rango de '' + label + ''.'');
    if (from > to) throw new Error(''La fecha inicial de '' + label + '' no puede ser posterior a la fecha final.'');
    return { from: from, to: to };
  };

  /*
   * Único punto de adaptación del contrato de filtros de RepoClaim.
   * Los nombres corresponden a los campos observados en la vista actual de SISos.
   */
  const buildRepoClaimFilter = (formValues) => {
    const values = formValues || {};
    const conditions = [];
    const id = positiveInteger(values.id, ''ID'');
    const masterClaimId = positiveInteger(values.masterClaimId, ''ID de reclamo maestro'');
    const occurrence = validateRange(values.occurrence, ''ocurrencia'');
    const notification = validateRange(values.notification, ''notificación'');
    const created = formatFilterDate(values.date);

    const addText = (field, value) => {
      const normalized = escapeFilterString(value);
      if (normalized) conditions.push(field + " = ''" + normalized + "''");
    };

    if (id !== null) conditions.push(''id = '' + id);
    if (masterClaimId !== null) conditions.push(''masterClaimId = '' + masterClaimId);
    const quickFilter = cleanString(values.quickFilter);
    if (quickFilter) {
      if (/^\d+$/.test(quickFilter) && Number.isSafeInteger(Number(quickFilter))) {
        conditions.push(''id = '' + Number(quickFilter));
      } else {
        addText(''code'', quickFilter);
      }
    }
    addText(''code'', values.code);
    addText(''stageCode'', values.stageCode);
    if (created) {
      conditions.push("created >= ''" + created + "''");
      conditions.push("created <= ''" + created + " 23:59:59''");
    }
    const claimerId = positiveInteger(values.claimantId, ''Reclamante'');
    const contactId = positiveInteger(values.insuredId, ''Asegurado'');
    const lifePolicyId = positiveInteger(values.lifePolicyId, ''Póliza'');
    if (claimerId !== null) conditions.push(''claimerId = '' + claimerId);
    if (contactId !== null) conditions.push(''contactId = '' + contactId);
    if (lifePolicyId !== null) conditions.push(''lifePolicyId = '' + lifePolicyId);
    addText(''Process.entityState'', values.status);
    addText(''Policy.lob'', values.lob);
    addText(''Policy.productCode'', values.product);
    addText(''claimType'', values.claimType);
    addText(''auditStatus'', values.auditStatus);
    addText(''migrationCode'', values.migrationCode);
    addText(''externalId'', values.externalId);

    if (occurrence) {
      conditions.push("occurrence >= ''" + occurrence.from + "''");
      conditions.push("occurrence <= ''" + occurrence.to + " 23:59:59''");
    }
    if (notification) {
      conditions.push("notification >= ''" + notification.from + "''");
      conditions.push("notification <= ''" + notification.to + " 23:59:59''");
    }

    return conditions.join('' and '');
  };

  const normalizeClaimResponse = (result) => {
    const source = result && result.outData !== undefined ? result.outData : result;
    let data = [];

    if (Array.isArray(source)) data = source;
    else if (source && Array.isArray(source.data)) data = source.data;
    else if (source && Array.isArray(source.items)) data = source.items;
    else if (source && Array.isArray(source.rows)) data = source.rows;
    else if (source && Array.isArray(source.list)) data = source.list;
    else if (source && Array.isArray(source.results)) data = source.results;

    const totalCandidates = [
      source && !Array.isArray(source) ? source.total : undefined,
      source && !Array.isArray(source) ? source.totalCount : undefined,
      source && !Array.isArray(source) ? source.count : undefined,
      source && !Array.isArray(source) ? source.recordsTotal : undefined,
      source && source.pagination ? source.pagination.total : undefined,
      source && source.meta ? source.meta.total : undefined,
      result && result.total,
      result && result.totalCount,
      result && result.count,
      result && result.recordsTotal,
      result && result.outDataCount
    ];
    const totalValue = totalCandidates.find((value) => value !== null
      && value !== undefined && value !== '''' && isFinite(Number(value)));

    return {
      data: data,
      total: totalValue === undefined ? data.length : Math.max(0, Number(totalValue))
    };
  };

  const repoClaimRequest = (page, size, activeFilters, activeOrdering) => {
    const requestOrdering = activeOrdering || ordering;
    return exe(''RepoClaim'', {
      operation: ''GET'',
      include: CLAIM_INCLUDES,
      filter: buildRepoClaimFilter(activeFilters),
      orderBy: requestOrdering.orderBy,
      orderDir: requestOrdering.orderDir,
      page: Math.max(0, Number(page || 0)),
      size: Number(size || PAGE_SIZE)
    });
  };

  const responseRows = (result) => {
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (Array.isArray(result.outData)) return result.outData;
    if (result.outData && Array.isArray(result.outData.data)) return result.outData.data;
    if (Array.isArray(result.data)) return result.data;
    return [];
  };

  const contactLabel = (contact) => {
    const fullName = cleanString(contact && (contact.FullName || contact.fullName || [
      contact.name,
      contact.middlename,
      contact.surname1,
      contact.surname2
    ].filter(Boolean).join('' '')));
    const identifier = cleanString(contact && (contact.cnp || contact.nif || contact.passport || contact.nationalId));
    const id = Number(contact && (contact.id || contact.Id));
    return (fullName || ''Contacto'') + (identifier ? '' | '' + identifier : '''') + (id > 0 ? '' | #'' + id : '''');
  };

  const mapContactOptions = (result) => responseRows(result).map((contact) => {
    const id = Number(contact && (contact.id || contact.Id));
    return { value: id, label: contactLabel(contact) };
  }).filter((option) => Number.isSafeInteger(option.value) && option.value > 0);

  const searchContacts = (kind, searchValue) => {
    const search = cleanString(searchValue);
    const timer = searchTimersRef.current[kind];
    if (timer) window.clearTimeout(timer);
    contactRequestRef.current[kind] += 1;
    const requestId = contactRequestRef.current[kind];
    if (search.length < 2 && !/^\d+$/.test(search)) {
      if (kind === ''claimant'') setClaimantOptions([]);
      else setInsuredOptions([]);
      setContactSearchLoading((current) => ({ ...current, [kind]: false }));
      return;
    }

    searchTimersRef.current[kind] = window.setTimeout(() => {
      const escaped = escapeFilterString(search);
      const numericId = /^\d+$/.test(search) && Number.isSafeInteger(Number(search)) ? Number(search) : 0;
      const nameFilter = "TRIM(CONCAT_WS('' '', [name], [middlename], [surname1], [surname2])) LIKE N''%" + escaped + "%''";
      const identityFilter = "[cnp] LIKE N''%" + escaped + "%'' OR [nif] LIKE N''%" + escaped
        + "%'' OR [passport] LIKE N''%" + escaped + "%''";
      const filter = ''([inactive] = 0) AND ('' + nameFilter + '' OR '' + identityFilter
        + (numericId > 0 ? '' OR [id] = '' + numericId : '''') + '')'';
      setContactSearchLoading((current) => ({ ...current, [kind]: true }));
      exe(''GetContacts'', { operation: ''GET'', filter: filter, page: 0, size: 15 })
        .then((result) => {
          if (!mountedRef.current || requestId !== contactRequestRef.current[kind]) return;
          if (!result || result.ok === false) throw new Error(result && result.msg ? result.msg : ''No se pudieron buscar los contactos.'');
          const options = mapContactOptions(result);
          if (kind === ''claimant'') setClaimantOptions(options);
          else setInsuredOptions(options);
        })
        .catch((searchError) => {
          if (!mountedRef.current || requestId !== contactRequestRef.current[kind]) return;
          if (kind === ''claimant'') setClaimantOptions([]);
          else setInsuredOptions([]);
          message.error(searchError && searchError.message ? searchError.message : ''No se pudieron buscar los contactos.'');
        })
        .then(() => {
          if (mountedRef.current && requestId === contactRequestRef.current[kind]) {
            setContactSearchLoading((current) => ({ ...current, [kind]: false }));
          }
        });
    }, 400);
  };

  const searchPolicies = (searchValue) => {
    const search = cleanString(searchValue);
    if (searchTimersRef.current.policy) window.clearTimeout(searchTimersRef.current.policy);
    policyRequestRef.current += 1;
    const requestId = policyRequestRef.current;
    if (search.length < 2 && !/^\d+$/.test(search)) {
      setPolicyOptions([]);
      setPolicySearchLoading(false);
      return;
    }
    searchTimersRef.current.policy = window.setTimeout(() => {
      const escaped = escapeFilterString(search);
      const numericId = /^\d+$/.test(search) && Number.isSafeInteger(Number(search)) ? Number(search) : 0;
      const filter = "([code] LIKE N''%" + escaped + "%'')" + (numericId > 0 ? '' OR [id] = '' + numericId : '''');
      setPolicySearchLoading(true);
      exe(''RepoLifePolicy'', { operation: ''GET'', filter: ''('' + filter + '')'', page: 0, size: 15 })
        .then((result) => {
          if (!mountedRef.current || requestId !== policyRequestRef.current) return;
          if (!result || result.ok === false) throw new Error(result && result.msg ? result.msg : ''No se pudieron buscar las pólizas.'');
          setPolicyOptions(responseRows(result).map((policy) => {
            const id = Number(policy && (policy.id || policy.Id));
            return { value: id, label: cleanString(policy && (policy.code || policy.Code)) || (''#'' + id) };
          }).filter((option) => Number.isSafeInteger(option.value) && option.value > 0));
        })
        .catch((searchError) => {
          if (!mountedRef.current || requestId !== policyRequestRef.current) return;
          setPolicyOptions([]);
          message.error(searchError && searchError.message ? searchError.message : ''No se pudieron buscar las pólizas.'');
        })
        .then(() => {
          if (mountedRef.current && requestId === policyRequestRef.current) setPolicySearchLoading(false);
        });
    }, 400);
  };

  const loadProducts = (lobCode) => {
    const requestId = productRequestRef.current + 1;
    productRequestRef.current = requestId;
    const normalizedLob = cleanString(lobCode);
    setProductCatalog([]);
    form.setFieldsValue({ product: undefined });
    if (!normalizedLob) {
      setProductsLoading(false);
      return Promise.resolve();
    }
    setProductsLoading(true);
    return exe(''RepoProduct'', {
      operation: ''GET'',
      filter: "lobCode = ''" + escapeFilterString(normalizedLob) + "''"
    }).then((result) => {
      if (!mountedRef.current || requestId !== productRequestRef.current) return;
      if (!result || result.ok === false) throw new Error(result && result.msg ? result.msg : ''No se pudieron cargar los productos.'');
      setProductCatalog(responseRows(result).map((product) => ({
        value: cleanString(product && product.code),
        label: cleanString(product && (product.name || product.code))
      })).filter((option) => option.value));
    }).catch((catalogError) => {
      if (mountedRef.current && requestId === productRequestRef.current) {
        message.error(catalogError && catalogError.message ? catalogError.message : ''No se pudieron cargar los productos.'');
      }
    }).then(() => {
      if (mountedRef.current && requestId === productRequestRef.current) setProductsLoading(false);
    });
  };

  const loadFilterCatalogs = () => {
    const requestId = catalogRequestRef.current + 1;
    catalogRequestRef.current = requestId;
    setCatalogsLoading(true);
    return Promise.all([
      exe(''RepoLob'', { operation: ''GET'' }),
      exe(''RepoClaimStage'', { operation: ''GET'' })
    ]).then((results) => {
      if (!mountedRef.current || requestId !== catalogRequestRef.current) return;
      results.forEach((result) => {
        if (!result || result.ok === false) throw new Error(result && result.msg ? result.msg : ''No se pudieron cargar los catálogos.'');
      });
      setLobOptions(responseRows(results[0]).map((lob) => ({
        value: cleanString(lob && lob.code),
        label: cleanString(lob && (lob.name || lob.code))
      })).filter((option) => option.value));
      setStageOptions(responseRows(results[1]).map((stage) => ({
        value: cleanString(stage && (stage.code || stage.stageCode)),
        label: cleanString(stage && (stage.name || stage.description || stage.code))
      })).filter((option) => option.value));
    }).catch((catalogError) => {
      if (mountedRef.current && requestId === catalogRequestRef.current) {
        message.error(catalogError && catalogError.message ? catalogError.message : ''No se pudieron cargar los catálogos.'');
      }
    }).then(() => {
      if (mountedRef.current && requestId === catalogRequestRef.current) setCatalogsLoading(false);
    });
  };

  const getValue = (record, paths) => {
    for (let index = 0; index < paths.length; index += 1) {
      const path = paths[index].split(''.'');
      let value = record;
      for (let part = 0; part < path.length && value !== null && value !== undefined; part += 1) {
        value = value[path[part]];
      }
      if (value !== null && value !== undefined && String(value).trim() !== '''') return value;
    }
    return null;
  };

  const displayValue = (value) => value === null || value === undefined
    || String(value).trim() === '''' ? EMPTY_VALUE : String(value);

  const personName = (record, relationName, fallbacks) => {
    const relation = record && record[relationName];
    if (relation && typeof relation === ''object'') {
      const fullName = [relation.name, relation.surname1, relation.surname2]
        .map(cleanString)
        .filter(Boolean)
        .join('' '');
      if (fullName) return fullName;
    }
    return getValue(record, fallbacks || []);
  };

  const claimPaths = {
    notified: [''notification'', ''notificationDate'', ''notified'', ''notifiedAt'', ''created''],
    policy: [''Policy.code'', ''Policy.policyCode'', ''Policy.number'', ''Policy.policyNumber'', ''policyCode'', ''policy''],
    type: [''claimType'', ''ClaimType.code'', ''type.code'', ''typeCode'', ''type''],
    cie: [''cie'', ''cieCode'', ''CIE'', ''diagnosisCode'', ''principalDiagnosis.code''],
    insuredAmount: [''Policy.insuredSum'', ''insuredAmount'', ''sumInsured'', ''amountInsured'', ''Policy.insuredAmount'', ''Policy.sumInsured'', ''Policy.amountInsured''],
    branch: [''Policy.lob'', ''Policy.lobCode'', ''Policy.branchCode'', ''Policy.Branch.code'', ''Policy.branch.code'', ''branch.code'', ''Branch.code'', ''lob'', ''branchCode'', ''branch''],
    product: [''Policy.productCode'', ''Policy.Product.code'', ''Policy.product.code'', ''product.code'', ''Product.code'', ''productCode'', ''product''],
    status: [''Process.entityState'', ''Process.statusName'', ''Process.status.name'', ''Process.stateName'', ''Process.state.name'', ''status.name'', ''Status.name'', ''statusName'', ''status''],
    stage: [''Stage.name'', ''Stage.description'', ''Stage.code'', ''stageCode'', ''stage.name'', ''stageName'', ''stage'']
  };

  const validRelatedId = (value) => {
    if ((typeof value !== ''string'' && typeof value !== ''number'') || !/^\d+$/.test(String(value))) return null;
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  };

  const renderText = (value) => {
    const text = displayValue(value);
    return (
      <Tooltip title={text === EMPTY_VALUE ? '''' : text}>
        <span className="busqueda-reclamos-cell">
          {text}
        </span>
      </Tooltip>
    );
  };

  const renderNavigationLink = (value, idValue, route) => {
    const text = displayValue(value);
    const id = validRelatedId(idValue);
    if (text === EMPTY_VALUE || id === null) return renderText(text);
    return (
      <Tooltip title={text}>
        <a className="busqueda-reclamos-cell busqueda-reclamos-link" href={route === ''claim-summary'' ? ''/#/view/48?claimId='' + id : ''/#/'' + route + ''/'' + id}>
          {text}
        </a>
      </Tooltip>
    );
  };

  const renderStatus = (value) => {
    const text = displayValue(value);
    if (text === EMPTY_VALUE) return renderText(text);
    return (
      <Tooltip title={text}>
        <span className="busqueda-reclamos-status">{text}</span>
      </Tooltip>
    );
  };

  const formatDateTime = (value) => {
    if (!value) return EMPTY_VALUE;
    const normalized = typeof value === ''string''
      && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(value)
      ? value + ''Z''
      : value;
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return displayValue(value);
    const parts = new Intl.DateTimeFormat(''en-US'', {
      year: ''numeric'',
      month: ''numeric'',
      day: ''numeric'',
      hour: ''numeric'',
      minute: ''2-digit'',
      second: ''2-digit'',
      hour12: true,
      timeZone: ''America/Managua''
    }).formatToParts(date).reduce((result, part) => {
      if (part.type !== ''literal'') result[part.type] = part.value;
      return result;
    }, {});
    const months = [''enero'', ''febrero'', ''marzo'', ''abril'', ''mayo'', ''junio'',
      ''julio'', ''agosto'', ''septiembre'', ''octubre'', ''noviembre'', ''diciembre''];
    return months[Number(parts.month) - 1] + '' '' + parts.day + ''° '' + parts.year
      + '', '' + parts.hour + '':'' + parts.minute + '':'' + parts.second
      + '' '' + String(parts.dayPeriod || '''').toLowerCase();
  };

  const formatMoney = (value) => {
    if (value === null || value === undefined || value === '''') return EMPTY_VALUE;
    const amount = Number(value);
    if (!isFinite(amount)) return displayValue(value);
    return amount.toLocaleString(''en-US'', {
      style: ''currency'',
      currency: ''USD'',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const renderMoney = (value) => {
    const formatted = formatMoney(value);
    if (formatted === EMPTY_VALUE) return formatted;
    const amount = Number(value);
    const tone = !isFinite(amount) || amount === 0
      ? ''zero''
      : (amount > 0 ? ''positive'' : ''negative'');
    return (
      <Tooltip title={formatted}>
        <span className={''busqueda-reclamos-cell busqueda-reclamos-amount busqueda-reclamos-amount-'' + tone}>{formatted}</span>
      </Tooltip>
    );
  };

  const serverSortProps = (orderBy) => ({
    sorter: true,
    serverOrderBy: orderBy,
    sortOrder: ordering.orderBy === orderBy
      ? (ordering.orderDir === ''ASC'' ? ''ascend'' : ''descend'')
      : null
  });

  const exportCell = (value) => {
    if (value === null || value === undefined) return '''';
    if (typeof value === ''number'' && isFinite(value)) return value;
    let text = String(value).replace(/[\r\n]+/g, '' '').trim();
    if (/^[=+\-@\t]/.test(text)) text = "''" + text;
    return text;
  };

  const exportColumns = [
    { title: ''ID'', width: 10, value: (record) => getValue(record, [''id'', ''Id'']) },
    { title: ''Código'', width: 18, value: (record) => getValue(record, [''code'', ''Code'']) },
    { title: ''Notificado'', width: 24, value: (record) => formatDateTime(getValue(record, claimPaths.notified)) },
    { title: ''Reclamante'', width: 28, value: (record) => personName(record, ''Claimer'', [''claimantName'', ''claimant'']) },
    { title: ''Asegurado'', width: 28, value: (record) => personName(record, ''Contact'', [''insuredName'', ''insured'']) },
    { title: ''Póliza'', width: 18, value: (record) => getValue(record, claimPaths.policy) },
    { title: ''Tipo'', width: 16, value: (record) => getValue(record, claimPaths.type) },
    { title: ''CIE'', width: 14, value: (record) => getValue(record, claimPaths.cie) },
    { title: ''Suma asegurada'', width: 18, value: (record) => {
      const value = getValue(record, claimPaths.insuredAmount);
      return value !== null && value !== '''' && isFinite(Number(value)) ? Number(value) : value;
    } },
    { title: ''Ramo'', width: 16, value: (record) => getValue(record, claimPaths.branch) },
    { title: ''Producto'', width: 20, value: (record) => getValue(record, claimPaths.product) },
    { title: ''Estado'', width: 20, value: (record) => getValue(record, claimPaths.status) },
    { title: ''Stage'', width: 20, value: (record) => getValue(record, claimPaths.stage) }
  ];

  const isUsableXlsxExportLibrary = (xlsxLibrary) => Boolean(xlsxLibrary
    && typeof xlsxLibrary.writeFile === ''function''
    && xlsxLibrary.utils
    && typeof xlsxLibrary.utils.aoa_to_sheet === ''function''
    && typeof xlsxLibrary.utils.book_new === ''function''
    && typeof xlsxLibrary.utils.book_append_sheet === ''function'');

  const availableXlsxLibrary = () => {
    const runtimeLibraries = typeof libs !== ''undefined'' && libs ? libs : {};
    const globalLibrary = typeof XLSX !== ''undefined''
      ? XLSX
      : (typeof window !== ''undefined'' ? window.XLSX : null);
    return [runtimeLibraries.XLSX, runtimeLibraries.xlsx, runtimeLibraries.xlsxJs, globalLibrary]
      .find(isUsableXlsxExportLibrary) || null;
  };

  const ensureXlsxLibrary = () => {
    const availableLibrary = availableXlsxLibrary();
    if (availableLibrary) return Promise.resolve(availableLibrary);
    if (xlsxLibraryPromiseRef.current) return xlsxLibraryPromiseRef.current;

    xlsxLibraryPromiseRef.current = exe(''ExeChain'', {
      chain: ''cmdLoadLibrariesGroupedBordereau'',
      context: ''{}''
    }).then((response) => {
      if (!response || response.ok === false) {
        throw new Error(response && response.msg ? response.msg : ''No se pudo cargar el componente de Excel de SIS11.'');
      }
      const loadedLibraries = response.outData || {};
      const loadedXlsx = loadedLibraries.XLSX || loadedLibraries.xlsx || loadedLibraries.xlsxJs;
      let evaluatedXlsx = null;
      if (typeof loadedXlsx === ''string'') {
        const evaluatedResult = eval(loadedXlsx);
        const evaluatedGlobal = typeof XLSX !== ''undefined'' ? XLSX : null;
        evaluatedXlsx = isUsableXlsxExportLibrary(evaluatedGlobal) ? evaluatedGlobal : evaluatedResult;
      } else if (loadedXlsx && typeof window !== ''undefined'') {
        window.XLSX = loadedXlsx;
      }
      const hydratedLibrary = availableXlsxLibrary()
        || (loadedXlsx && typeof loadedXlsx !== ''string'' ? loadedXlsx : null)
        || evaluatedXlsx;
      if (!isUsableXlsxExportLibrary(hydratedLibrary)) {
        throw new Error(''El componente de Excel de SIS11 no quedó disponible.'');
      }
      if (typeof window !== ''undefined'' && !window.XLSX) window.XLSX = hydratedLibrary;
      return hydratedLibrary;
    }).then((xlsxLibrary) => {
      xlsxLibraryPromiseRef.current = null;
      return xlsxLibrary;
    }).catch((xlsxError) => {
      xlsxLibraryPromiseRef.current = null;
      throw xlsxError;
    });
    return xlsxLibraryPromiseRef.current;
  };

  const assertCompleteExportRows = (exportRows, total) => {
    if (exportRows.length !== total) {
      throw new Error(''La consulta de exportación quedó incompleta. No se generó ningún archivo.'');
    }
    const seenIds = {};
    exportRows.forEach((record) => {
      const id = validRelatedId(getValue(record, [''id'', ''Id'']));
      if (id === null) return;
      if (seenIds[id]) throw new Error(''La consulta de exportación devolvió registros duplicados. No se generó ningún archivo.'');
      seenIds[id] = true;
    });
  };

  const downloadFilteredClaims = () => {
    if (loading || exporting) return;
    const appliedFilters = filters;
    const appliedOrdering = ordering;
    setExporting(true);

    repoClaimRequest(0, EXPORT_PAGE_SIZE, appliedFilters, appliedOrdering)
      .then((firstResult) => {
        if (!firstResult || firstResult.ok === false) {
          throw new Error(firstResult && firstResult.msg ? firstResult.msg : ''No se pudieron consultar los reclamos para exportar.'');
        }
        const firstPage = normalizeClaimResponse(firstResult);
        if (firstPage.total === 0 || firstPage.data.length === 0) {
          message.warning(''No hay información disponible para exportar.'');
          return null;
        }
        const pageCount = Math.ceil(firstPage.total / EXPORT_PAGE_SIZE);
        const remainingRequests = [];
        for (let page = 1; page < pageCount; page += 1) {
          remainingRequests.push(repoClaimRequest(page, EXPORT_PAGE_SIZE, appliedFilters, appliedOrdering));
        }
        return Promise.all(remainingRequests).then((remainingResults) => {
          const allRows = firstPage.data.slice();
          remainingResults.forEach((result) => {
            if (!result || result.ok === false) {
              throw new Error(result && result.msg ? result.msg : ''No se pudieron consultar todos los reclamos para exportar.'');
            }
            allRows.push.apply(allRows, normalizeClaimResponse(result).data);
          });
          assertCompleteExportRows(allRows, firstPage.total);
          return ensureXlsxLibrary().then((xlsxLibrary) => ({ rows: allRows, xlsxLibrary: xlsxLibrary }));
        });
      })
      .then((exportData) => {
        if (!exportData) return;
        const headers = exportColumns.map((column) => column.title);
        const exportRows = exportData.rows.map((record) => exportColumns.map((column) => exportCell(column.value(record))));
        const worksheet = exportData.xlsxLibrary.utils.aoa_to_sheet([headers].concat(exportRows));
        exportRows.forEach((row, index) => {
          const amountCell = worksheet[''I'' + (index + 2)];
          if (amountCell && typeof row[8] === ''number'') amountCell.z = ''#,##0.00'';
        });
        worksheet[''!cols''] = exportColumns.map((column) => ({ wch: column.width }));
        worksheet[''!autofilter''] = { ref: worksheet[''!ref''] || ''A1:M1'' };
        const workbook = exportData.xlsxLibrary.utils.book_new();
        exportData.xlsxLibrary.utils.book_append_sheet(workbook, worksheet, ''Reclamos'');
        exportData.xlsxLibrary.writeFile(workbook, ''reclamos-'' + formatFilterDate(new Date()) + ''.xlsx'', {
          bookType: ''xlsx'',
          compression: true
        });
        message.success(''Los reclamos fueron exportados correctamente.'');
      })
      .catch((exportError) => {
        message.error(exportError && exportError.message ? exportError.message : ''No se pudieron exportar los reclamos.'');
      })
      .then(() => {
        if (mountedRef.current) setExporting(false);
      });
  };

  const columns = [
    {
      title: ''ID'',
      key: ''id'',
      width: ''4%'',
      ...serverSortProps(''id''),
      render: (_, record) => renderNavigationLink(
        getValue(record, [''id'', ''Id'']),
        getValue(record, [''id'', ''Id'']),
        ''healthclaim''
      )
    },
    {
      title: ''Código'',
      key: ''code'',
      width: ''8%'',
      ...serverSortProps(''code''),
      render: (_, record) => renderText(getValue(record, [''code'', ''Code'']))
    },
    {
      title: ''Notificado'',
      key: ''notified'',
      width: ''10%'',
      ...serverSortProps(''notification''),
      render: (_, record) => renderText(formatDateTime(getValue(record, claimPaths.notified)))
    },
    {
      title: ''Reclamante'',
      key: ''claimant'',
      width: ''10%'',
      ...serverSortProps(''Claimer.name''),
      render: (_, record) => renderNavigationLink(
        personName(record, ''Claimer'', [''claimantName'', ''claimant'']),
        getValue(record, [''Claimer.id'', ''claimerId'']),
        ''contact''
      )
    },
    {
      title: ''Asegurado'',
      key: ''insured'',
      width: ''10%'',
      ...serverSortProps(''Contact.name''),
      render: (_, record) => renderNavigationLink(
        personName(record, ''Contact'', [''insuredName'', ''insured'']),
        getValue(record, [''Contact.id'', ''contactId'']),
        ''contact''
      )
    },
    {
      title: ''Póliza'',
      key: ''policy'',
      width: ''8%'',
      ...serverSortProps(''Policy.code''),
      render: (_, record) => renderNavigationLink(
        getValue(record, claimPaths.policy),
        getValue(record, [''Policy.id'', ''lifePolicyId'']),
        ''lifePolicy''
      )
    },
    {
      title: ''Tipo'',
      key: ''type'',
      width: ''4%'',
      ...serverSortProps(''claimType''),
      render: (_, record) => renderText(getValue(record, claimPaths.type))
    },
    {
      title: ''CIE'',
      key: ''cie'',
      width: ''4%'',
      ...serverSortProps(''principalDiagnosis''),
      render: (_, record) => renderText(getValue(record, claimPaths.cie))
    },
    {
      title: ''Suma asegurada'',
      key: ''insuredAmount'',
      width: ''9%'',
      align: ''right'',
      ...serverSortProps(''Policy.insuredSum''),
      render: (_, record) => renderMoney(getValue(record, claimPaths.insuredAmount))
    },
    {
      title: ''Ramo'',
      key: ''branch'',
      width: ''5%'',
      ...serverSortProps(''Policy.lob''),
      render: (_, record) => renderText(getValue(record, claimPaths.branch))
    },
    {
      title: ''Producto'',
      key: ''product'',
      width: ''7%'',
      ...serverSortProps(''Policy.productCode''),
      render: (_, record) => renderText(getValue(record, claimPaths.product))
    },
    {
      title: ''Estado'',
      key: ''status'',
      width: ''8%'',
      ...serverSortProps(''Process.entityState''),
      render: (_, record) => renderStatus(getValue(record, claimPaths.status))
    },
    {
      title: ''Stage'',
      key: ''stage'',
      width: ''7%'',
      ...serverSortProps(''Stage.name''),
      render: (_, record) => renderStatus(getValue(record, claimPaths.stage))
    },
    {
      title: ''Resumen'',
      key: ''summary'',
      width: ''6%'',
      render: (_, record) => renderNavigationLink(
        ''Ver'',
        getValue(record, [''id'', ''Id'']),
        ''claim-summary''
      )
    }
  ];

  const loadClaims = (current, pageSize, activeFilters, activeOrdering) => {
    const requestId = listRequestRef.current + 1;
    listRequestRef.current = requestId;
    setLoading(true);
    setError('''');

    try {
      buildRepoClaimFilter(activeFilters);
    } catch (validationError) {
      if (requestId === listRequestRef.current) {
        const validationMessage = validationError && validationError.message
          ? validationError.message : ''Revise los criterios de búsqueda.'';
        setError(validationMessage);
        setLoading(false);
        message.warning(validationMessage);
      }
      return Promise.resolve();
    }

    const requestOrdering = activeOrdering || ordering;

    return repoClaimRequest(
      Math.max(0, Number(current || 1) - 1),
      Number(pageSize || PAGE_SIZE),
      activeFilters,
      requestOrdering
    )
      .then((result) => {
        if (!mountedRef.current || requestId !== listRequestRef.current) return;
        if (!result || result.ok === false) {
          throw new Error(result && result.msg ? result.msg : ''No se pudieron consultar los reclamos.'');
        }

        const normalized = normalizeClaimResponse(result);
        setRows(normalized.data);
        setPagination({
          current: Number(current || 1),
          pageSize: Number(pageSize || PAGE_SIZE),
          total: normalized.total
        });
      })
      .catch((requestError) => {
        if (!mountedRef.current || requestId !== listRequestRef.current) return;
        const requestMessage = requestError && requestError.message
          ? requestError.message : ''No se pudieron consultar los reclamos.'';
        setRows([]);
        setPagination({ current: Number(current || 1), pageSize: Number(pageSize || PAGE_SIZE), total: 0 });
        setError(requestMessage);
        message.error(requestMessage);
      })
      .then(() => {
        if (mountedRef.current && requestId === listRequestRef.current) setLoading(false);
      });
  };

  const handleSearch = () => {
    if (exporting) return;
    const values = form.getFieldsValue();
    try {
      buildRepoClaimFilter(values);
    } catch (validationError) {
      const validationMessage = validationError && validationError.message
        ? validationError.message : ''Revise los criterios de búsqueda.'';
      setError(validationMessage);
      message.warning(validationMessage);
      return;
    }
    setFilters(values);
    setFilterDrawerOpen(false);
    loadClaims(1, pagination.pageSize || PAGE_SIZE, values);
  };

  const handleReset = () => {
    if (exporting) return;
    form.resetFields();
    setFilters({});
    setError('''');
    loadClaims(1, PAGE_SIZE, {});
  };

  const handleTableChange = (nextPagination, tableFilters, sorter, extra) => {
    if (exporting) return;
    if (extra && extra.action === ''sort'') {
      const nextOrdering = sorter && sorter.order
        ? {
          orderBy: sorter.column && sorter.column.serverOrderBy
            ? sorter.column.serverOrderBy
            : ''id'',
          orderDir: sorter.order === ''descend'' ? ''DESC'' : ''ASC''
        }
        : { orderBy: ''id'', orderDir: ''DESC'' };
      setOrdering(nextOrdering);
      loadClaims(1, nextPagination.pageSize || PAGE_SIZE, filters, nextOrdering);
      return;
    }
    loadClaims(nextPagination.current || 1, nextPagination.pageSize || PAGE_SIZE, filters);
  };

  React.useEffect(() => {
    mountedRef.current = true;
    const style = document.createElement(''style'');
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    let resizeFrame = null;

    const fitShellToViewport = () => {
      const shell = shellRef.current;
      if (!shell) return;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      const shellTop = Math.max(0, shell.getBoundingClientRect().top);
      const availableHeight = Math.max(0, Math.floor(viewportHeight - shellTop - 8));
      shell.style.height = availableHeight + ''px'';
      shell.style.maxHeight = availableHeight + ''px'';
    };

    const scheduleViewportFit = () => {
      if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(fitShellToViewport);
    };

    document.documentElement.style.overflow = ''hidden'';
    document.body.style.overflow = ''hidden'';
    style.setAttribute(''data-busqueda-reclamos-style'', ''true'');
    style.innerHTML = `
      .busqueda-reclamos-shell {
        width: 100%;
        height: 100%;
        max-height: 100%;
        min-height: 0;
        padding: 10px 16px 8px;
        overflow: hidden;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        color: #262626;
        font-size: 13px;
      }

      .busqueda-reclamos-page-header,
      .busqueda-reclamos-error {
        flex: 0 0 auto;
      }

      .busqueda-reclamos-page-header {
        min-height: 108px;
        padding: 14px 24px 17px;
        border: 1px solid #e3e6ea;
        border-radius: 3px;
        background: #fff;
        box-shadow: 0 1px 2px rgba(0, 0, 0, .03);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .busqueda-reclamos-breadcrumb {
        display: flex;
        align-items: center;
        gap: 9px;
        color: #999;
        font-size: 14px;
        line-height: 20px;
      }

      .busqueda-reclamos-breadcrumb-separator {
        color: #b7b7b7;
      }

      .busqueda-reclamos-breadcrumb strong {
        color: #555;
        font-weight: 500;
      }

      .busqueda-reclamos-heading-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 0;
      }

      .busqueda-reclamos-heading {
        display: flex;
        align-items: center;
        min-width: 0;
        gap: 12px;
      }

      .busqueda-reclamos-folder {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: #d9d9d9;
        position: relative;
        flex: 0 0 38px;
      }

      .busqueda-reclamos-folder::before {
        content: '''';
        position: absolute;
        left: 9px;
        top: 12px;
        width: 20px;
        height: 14px;
        border: 2px solid #fff;
        border-radius: 2px;
        box-sizing: border-box;
      }

      .busqueda-reclamos-folder::after {
        content: '''';
        position: absolute;
        left: 11px;
        top: 9px;
        width: 9px;
        height: 6px;
        border: 2px solid #fff;
        border-bottom: 0;
        border-radius: 2px 2px 0 0;
        box-sizing: border-box;
      }

      .busqueda-reclamos-title {
        margin: 0;
        color: #4a4a4a;
        font-size: 18px;
        font-weight: 600;
        line-height: 1.3;
      }

      .busqueda-reclamos-toolbar {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding: 4px 0;
        border: 1px solid #e6ebf2;
        border-radius: 0;
        background: transparent;
      }

      .busqueda-reclamos-toolbar > .ant-space {
        margin-left: 4px;
        margin-right: 4px;
      }

      .busqueda-reclamos-toolbar .ant-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .busqueda-reclamos-download.ant-btn {
        border-color: #4f9336 !important;
        background: #60b13d !important;
        color: #fff !important;
        text-shadow: none;
      }

      .busqueda-reclamos-toolbar .ant-btn[disabled],
      .busqueda-reclamos-toolbar .ant-btn-disabled {
        border-color: #6f7b88 !important;
        opacity: 1 !important;
      }

      .busqueda-reclamos-download-icon {
        display: inline-block;
        width: 12px;
        height: 14px;
        margin-right: 7px;
        position: relative;
        vertical-align: -2px;
      }

      .busqueda-reclamos-download-icon::before {
        content: '''';
        position: absolute;
        left: 5px;
        top: 1px;
        width: 2px;
        height: 7px;
        background: currentColor;
      }

      .busqueda-reclamos-download-icon::after {
        content: '''';
        position: absolute;
        left: 2px;
        bottom: 1px;
        width: 8px;
        height: 5px;
        border: solid currentColor;
        border-width: 0 1px 1px;
        box-sizing: border-box;
      }

      .busqueda-reclamos-download-chevron {
        display: inline-block;
        width: 6px;
        height: 6px;
        margin-left: 7px;
        border: solid currentColor;
        border-width: 0 1px 1px 0;
        transform: translateY(-2px) rotate(45deg);
      }

      .busqueda-reclamos-shell .anticon > svg {
        display: inline-block;
        width: 1em;
        height: 1em;
        fill: currentColor;
      }

      .busqueda-reclamos-error {
        margin-top: 8px;
      }

      .busqueda-reclamos-grid {
        flex: 1 1 auto;
        min-height: 0;
        margin-top: 2px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: #fff;
        border: 1px solid #cbd1d8;
        box-sizing: border-box;
      }

      .busqueda-reclamos-grid .ant-table-wrapper,
      .busqueda-reclamos-grid .ant-spin-nested-loading,
      .busqueda-reclamos-grid .ant-spin-container,
      .busqueda-reclamos-grid .ant-table,
      .busqueda-reclamos-grid .ant-table-container {
        flex: 1 1 auto;
        height: 100%;
        min-height: 0;
      }

      .busqueda-reclamos-grid .ant-table-wrapper,
      .busqueda-reclamos-grid .ant-spin-container,
      .busqueda-reclamos-grid .ant-table,
      .busqueda-reclamos-grid .ant-table-container {
        display: flex;
        flex-direction: column;
      }

      .busqueda-reclamos-grid .ant-table-body {
        flex: 1 1 auto;
        min-height: 0;
        max-height: none !important;
        position: relative;
        z-index: 1;
        overflow-x: hidden !important;
        overflow-y: auto !important;
        scrollbar-gutter: stable;
      }

      .busqueda-reclamos-grid .ant-table-header {
        flex: 0 0 auto;
        position: relative;
        z-index: 3;
        overflow: hidden !important;
        background: #bfbfbf !important;
      }

      .busqueda-reclamos-grid .ant-table-thead > tr > th {
        height: auto;
        padding: 5px 8px !important;
        border-right: 1px solid #cbd1d8 !important;
        border-bottom: 1px solid #cbd1d8 !important;
        background: #bfbfbf !important;
        color: #404040;
        font-size: 12px;
        font-weight: 600;
        line-height: 18px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .busqueda-reclamos-grid .ant-table-thead > tr > th:last-child {
        border-right: 0 !important;
      }

      .busqueda-reclamos-grid .ant-table-tbody > tr > td {
        padding: 5px 8px !important;
        border-right: 0 !important;
        border-bottom: 1px solid #cbd1d8 !important;
        color: #333;
        font-size: 12px;
        line-height: 18px;
        vertical-align: middle;
      }

      .busqueda-reclamos-grid .ant-table-tbody > tr:hover > td {
        background: #b7d7ff !important;
      }

      .busqueda-reclamos-grid .ant-table-tbody > tr.ant-table-row-selected > td,
      .busqueda-reclamos-grid .ant-table-tbody > tr.ant-table-row-selected:hover > td {
        background: #86b4ff !important;
      }

      .busqueda-reclamos-grid .ant-table-cell-fix-right {
        background: #fff;
      }

      .busqueda-reclamos-grid .ant-table-pagination {
        flex: 0 0 auto;
        margin: 8px 0 0 !important;
      }

      .busqueda-reclamos-cell {
        display: block;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .busqueda-reclamos-link {
        color: #1890ff;
      }

      .busqueda-reclamos-status {
        display: inline-block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        padding: 1px 7px;
        border: 1px solid #d9d9d9;
        border-radius: 3px;
        background: #fff;
        color: #555;
        font-size: 12px;
        line-height: 20px;
        white-space: nowrap;
      }

      .busqueda-reclamos-amount {
        white-space: nowrap;
      }

      .busqueda-reclamos-amount-positive {
        color: #237804;
      }

      .busqueda-reclamos-amount-negative {
        color: #cf1322;
      }

      .busqueda-reclamos-amount-zero {
        color: #262626;
        font-weight: 400;
      }

      .busqueda-reclamos-filter-form .ant-form-item {
        margin-bottom: 10px !important;
      }

      .busqueda-reclamos-filter-actions {
        display: flex;
        justify-content: flex-end;
        padding-top: 4px;
      }

      .busqueda-reclamos-reset.ant-btn {
        border-color: #8f9aa7 !important;
      }

      @media (max-width: 768px) {
        .busqueda-reclamos-shell { padding: 0; }
        .busqueda-reclamos-page-header { border-radius: 0; padding: 10px 12px; }
      }
    `;

    document.head.appendChild(style);
    window.addEventListener(''resize'', scheduleViewportFit);
    scheduleViewportFit();
    loadFilterCatalogs();
    loadClaims(1, PAGE_SIZE, {}, { orderBy: ''id'', orderDir: ''DESC'' });

    return () => {
      mountedRef.current = false;
      listRequestRef.current += 1;
      catalogRequestRef.current += 1;
      contactRequestRef.current.claimant += 1;
      contactRequestRef.current.insured += 1;
      policyRequestRef.current += 1;
      productRequestRef.current += 1;
      Object.keys(searchTimersRef.current).forEach((key) => {
        if (searchTimersRef.current[key]) window.clearTimeout(searchTimersRef.current[key]);
      });
      window.removeEventListener(''resize'', scheduleViewportFit);
      if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
      if (style.parentNode) style.parentNode.removeChild(style);
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  return (
    <div ref={shellRef} className="busqueda-reclamos-shell">
      <div className="busqueda-reclamos-page-header">
        <div className="busqueda-reclamos-breadcrumb">
          <span>Inicio</span>
          <span className="busqueda-reclamos-breadcrumb-separator">/</span>
          <strong>Lista de siniestros</strong>
        </div>
        <div className="busqueda-reclamos-heading-row">
          <div className="busqueda-reclamos-heading">
            <span className="busqueda-reclamos-folder" aria-hidden="true" />
            <h2 className="busqueda-reclamos-title">Lista de siniestros</h2>
          </div>
          <div className="busqueda-reclamos-toolbar">
          <Space>
              <Button
                className="busqueda-reclamos-download"
                loading={exporting}
                disabled={loading || exporting}
                onClick={downloadFilteredClaims}
              >
                <span className="busqueda-reclamos-download-icon" aria-hidden="true" />
                <span>Exportar a Excel</span>
              </Button>
              <Button
                type="primary"
                icon={<SearchOutlinedIcon />}
                disabled={loading || exporting}
                onClick={() => setFilterDrawerOpen(true)}
              >
                <span>Filtrar</span>
              </Button>
          </Space>
          </div>
        </div>
      </div>

      {error ? <Alert className="busqueda-reclamos-error" type="error" showIcon message={error} /> : null}

      <div className="busqueda-reclamos-grid">
          <Table
            size="small"
            rowKey={(record, index) => String(getValue(record, [''id'', ''Id'', ''code'', ''Code'']) || (''claim-'' + index))}
            loading={loading}
            columns={columns}
            dataSource={rows}
            tableLayout="fixed"
            scroll={{ y: ''100%'' }}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              disabled: exporting,
              showSizeChanger: true,
              pageSizeOptions: [''10'', ''20'', ''50''],
              showTotal: (total) => ''Total '' + total + '' items''
            }}
            onChange={handleTableChange}
            locale={{ emptyText: loading ? ''Consultando...'' : (error ? ''No fue posible cargar los reclamos'' : ''No se encontraron reclamos'') }}
          />
      </div>

      <Drawer
          title="Filtros de búsqueda de siniestros"
          placement="right"
          width={510}
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          destroyOnClose={false}
        >
          <Form form={form} className="busqueda-reclamos-filter-form" layout="vertical" size="small">
            <Row gutter={8}>
              <Col span={24}>
                <Form.Item label="Quick Filter" name="quickFilter">
                  <Input maxLength={MAX_FILTER_LENGTH} placeholder="ID o código del reclamo" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ID" name="id">
                  <Input inputMode="numeric" maxLength={16} placeholder="ID del reclamo" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ID de reclamo maestro" name="masterClaimId">
                  <Input inputMode="numeric" maxLength={16} placeholder="ID maestro" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Código" name="code">
                  <Input maxLength={MAX_FILTER_LENGTH} placeholder="Código del reclamo" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Stage" name="stageCode">
                  <Select
                    allowClear
                    showSearch
                    loading={catalogsLoading}
                    options={stageOptions}
                    optionFilterProp="label"
                    placeholder="Seleccione el stage"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Fecha" name="date">
                  <DatePicker format="DD/MM/YYYY" style={{ width: ''100%'' }} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Reclamante" name="claimantId">
                  <Select
                    allowClear
                    showSearch
                    filterOption={false}
                    loading={contactSearchLoading.claimant}
                    options={claimantOptions}
                    onSearch={(value) => searchContacts(''claimant'', value)}
                    placeholder="Escriba nombre, identificación o ID"
                    notFoundContent={contactSearchLoading.claimant ? ''Buscando...'' : ''Escriba al menos 2 caracteres''}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Asegurado" name="insuredId">
                  <Select
                    allowClear
                    showSearch
                    filterOption={false}
                    loading={contactSearchLoading.insured}
                    options={insuredOptions}
                    onSearch={(value) => searchContacts(''insured'', value)}
                    placeholder="Escriba nombre, identificación o ID"
                    notFoundContent={contactSearchLoading.insured ? ''Buscando...'' : ''Escriba al menos 2 caracteres''}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Póliza" name="lifePolicyId">
                  <Select
                    allowClear
                    showSearch
                    filterOption={false}
                    loading={policySearchLoading}
                    options={policyOptions}
                    onSearch={searchPolicies}
                    placeholder="Escriba código o ID de póliza"
                    notFoundContent={policySearchLoading ? ''Buscando...'' : ''Escriba al menos 2 caracteres''}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Estado" name="status">
                  <Input allowClear placeholder="Escriba el estado" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Ramo" name="lob">
                  <Select
                    allowClear
                    showSearch
                    loading={catalogsLoading}
                    options={lobOptions}
                    optionFilterProp="label"
                    onChange={loadProducts}
                    placeholder="Seleccione el ramo"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Producto" name="product">
                  <Select
                    allowClear
                    showSearch
                    disabled={!form.getFieldValue(''lob'')}
                    loading={productsLoading}
                    options={productCatalog}
                    optionFilterProp="label"
                    placeholder="Seleccione el producto"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Tipo de siniestro" name="claimType">
                  <Input maxLength={MAX_FILTER_LENGTH} placeholder="Código del tipo de siniestro" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Estado de la auditoría" name="auditStatus">
                  <Input maxLength={MAX_FILTER_LENGTH} placeholder="Código del estado de auditoría" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Ocurrencia" name="occurrence">
                  <RangePicker format="DD/MM/YYYY" style={{ width: ''100%'' }} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Notificación" name="notification">
                  <RangePicker format="DD/MM/YYYY" style={{ width: ''100%'' }} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Código de migración" name="migrationCode">
                  <Input maxLength={MAX_FILTER_LENGTH} placeholder="Código de migración" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="External ID" name="externalId">
                  <Input maxLength={MAX_FILTER_LENGTH} placeholder="External ID" />
                </Form.Item>
              </Col>
            </Row>

            <div className="busqueda-reclamos-filter-actions">
              <Space>
                <Button
                  className="busqueda-reclamos-reset"
                  icon={<ReloadOutlinedIcon />}
                  disabled={loading || exporting}
                  onClick={handleReset}
                >
                  Reestablecer
                </Button>
                <Button
                  type="primary"
                  icon={<SearchOutlinedIcon />}
                  loading={loading}
                  disabled={exporting}
                  onClick={handleSearch}
                >
                  Búsqueda
                </Button>
              </Space>
            </div>
          </Form>
      </Drawer>
    </div>
  );
}
', NULL, NULL, 0);

    INSERT INTO dbo.LiveView (id, name, code, category, operation, multiComponent) VALUES (48, N'InformaciónResumenDelReclamo', N'() => {
  const Card = A.Card;
  const Row = A.Row;
  const Col = A.Col;
  const Button = A.Button;
  const Input = A.Input;
  const Select = A.Select;
  const Checkbox = A.Checkbox;
  const DatePicker = A.DatePicker;
  const Alert = A.Alert;
  const Spin = A.Spin;
  const Modal = A.Modal;
  const Popconfirm = A.Popconfirm;
  const TextArea = Input.TextArea;
  const EMPTY_VALUE = ''—'';
  const EMPTY_SUMMARY = {
    policy: {
      policyNumber: null, lineOfBusiness: null, year: null, certificateNumber: null,
      insured: null, payer: null, branch: null, policyType: null, startDate: null,
      endDate: null, creator: null, status: null, modified: null
    },
    valuation: { reserves: null, payments: null, recoveries: null, expenses: null, balance: null }
  };
  const EMPTY_DETAILS = {
    claimNumber: null, state: null, claimant: null, occurrence: null, notification: null
  };
  const CLAIM_STAGE_OPTIONS = [
    { value: ''F'', label: ''Finalizado'' },
    { value: ''R'', label: ''Rechazado'' }
  ];
  const ADJUSTER_CATALOG_FIELDS = "id, CASE WHEN isPerson = 0 THEN surname2 ELSE name + '' '' + surname1 END name";
  const ADJUSTER_CATALOG_FILTER = "exists (select 1 from contactRole r where r.contactId = contact.id and r.role = ''ADJ'')";
  const REPOSITORY_CATALOG_GET = {
    operation: ''GET'', showColumnsIfEmpty: true, entity: null, bulkJson: null,
    filter: null, include: null, size: 0, page: 0
  };

  const [claimSummary, setClaimSummary] = React.useState(EMPTY_SUMMARY);
  const [claimDetails, setClaimDetails] = React.useState(EMPTY_DETAILS);
  const [activeTab, setActiveTab] = React.useState(''general'');
  const routeClaimId = () => {
    const hash = window.location.hash || '''';
    const path = hash.replace(/^#/, '''').split(''?'')[0];
    let raw = null;
    if (/^\/view\/48\/?$/.test(path)) {
      const params = new URLSearchParams(hash.includes(''?'') ? hash.slice(hash.indexOf(''?'') + 1) : '''');
      const values = params.getAll(''claimId'');
      if (values.length !== 1) return null;
      raw = values[0];
    } else {
      const match = (hash || window.location.pathname || '''').match(/(?:^|\/)healthclaim\/(\d+)\/?$/i);
      raw = match ? match[1] : null;
    }
    if (!raw || !/^\d+$/.test(raw)) return null;
    const parsed = Number(raw);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
  };
  const [claimId, setClaimId] = React.useState(routeClaimId);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('''');
  const [valuationWarning, setValuationWarning] = React.useState('''');
  const shellRef = React.useRef(null);
  const mountedRef = React.useRef(true);
  const requestRef = React.useRef(0);
  const currentClaimRef = React.useRef(null);
  const draftRef = React.useRef(null);
  const dirtyRef = React.useRef(false);
  const savingRef = React.useRef(false);
  const touchedRef = React.useRef({});
  const routeRef = React.useRef(window.location.href);
  const [draft, setDraft] = React.useState(null);
  const [editable, setEditable] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const stageSelectionRef = React.useRef(null);
  const stageSavingRef = React.useRef(false);
  const stageOperationRef = React.useRef(0);
  const pendingStageConfirmationRef = React.useRef(null);
  const [stageSelection, setStageSelection] = React.useState(null);
  const [stageSaving, setStageSaving] = React.useState(false);
  const adjusterLoadingRef = React.useRef(false);
  const [adjusterLoading, setAdjusterLoading] = React.useState(false);
  const adjusterOptionsRef = React.useRef([]);
  const [adjusterOptions, setAdjusterOptions] = React.useState([]);
  const claimantOptionsRef = React.useRef([]);
  const [claimantOptions, setClaimantOptions] = React.useState([]);
  const claimantSearchOperationRef = React.useRef(0);
  const claimantSearchTimerRef = React.useRef(null);
  const [claimantSearching, setClaimantSearching] = React.useState(false);
  const [claimantHasMore, setClaimantHasMore] = React.useState(false);
  const [claimantSearchError, setClaimantSearchError] = React.useState('''');
  const eventCatalogRef = React.useRef(null);
  const reasonOptionsRef = React.useRef([]);
  const eventOptionsRef = React.useRef([]);
  const [reasonOptions, setReasonOptions] = React.useState([]);
  const [eventOptions, setEventOptions] = React.useState([]);
  const catalogOperationRef = React.useRef(0);
  const catalogLoadingRef = React.useRef(false);
  const [catalogLoading, setCatalogLoading] = React.useState(false);
  const [catalogError, setCatalogError] = React.useState('''');
  const customFormsRef = React.useRef([]);
  const customFormsOperationRef = React.useRef(0);
  const customFormsStatusRef = React.useRef(''idle'');
  const customFormInstancesRef = React.useRef({});
  const customFormCleanupRef = React.useRef(null);
  const [customForms, setCustomForms] = React.useState([]);
  const [customFormsLoading, setCustomFormsLoading] = React.useState(false);
  const [customFormsError, setCustomFormsError] = React.useState('''');
  const [activeCustomForm, setActiveCustomForm] = React.useState('''');
  const coverageRowsRef = React.useRef([]);
  const [coverageRows, setCoverageRows] = React.useState([]);
  const [selectedCoverageId, setSelectedCoverageId] = React.useState(null);
  const reserveSavingRef = React.useRef(false);
  const reserveOperationRef = React.useRef(0);
  const [reserveSaving, setReserveSaving] = React.useState(false);
  const [reserveError, setReserveError] = React.useState('''');
  const [reserveDirection, setReserveDirection] = React.useState(''INCREASE'');
  const [reserveType, setReserveType] = React.useState(''IN'');
  const [reserveAmount, setReserveAmount] = React.useState('''');
  const [reserveConcept, setReserveConcept] = React.useState('''');
  const [reserveModalOpen, setReserveModalOpen] = React.useState(false);
  const cancelClaimantSearch = () => {
    claimantSearchOperationRef.current += 1;
    if (claimantSearchTimerRef.current !== null) {
      window.clearTimeout(claimantSearchTimerRef.current);
      claimantSearchTimerRef.current = null;
    }
    if (mountedRef.current) setClaimantSearching(false);
  };
  const cancelCatalogLoad = () => {
    catalogOperationRef.current += 1;
    catalogLoadingRef.current = false;
    if (mountedRef.current) setCatalogLoading(false);
  };
  const clearEventCatalog = () => {
    eventCatalogRef.current = null;
    reasonOptionsRef.current = [];
    eventOptionsRef.current = [];
    if (mountedRef.current) {
      setReasonOptions([]);
      setEventOptions([]);
    }
  };
  const setClaimStageSelection = (value) => {
    stageSelectionRef.current = value;
    setStageSelection(value);
  };
  const changeClaimContext = (nextClaimId) => {
    const currentClaimId = currentClaimRef.current ? Number(currentClaimRef.current.id) : null;
    if (currentClaimId === nextClaimId) return;
    setClaimSummary(EMPTY_SUMMARY);
    setClaimDetails(EMPTY_DETAILS);
    setError('''');
    setValuationWarning('''');
    coverageRowsRef.current = [];
    setCoverageRows([]);
    setSelectedCoverageId(null);
    setReserveError('''');
    setReserveModalOpen(false);
    reserveOperationRef.current += 1;
    reserveSavingRef.current = false;
    setReserveSaving(false);
    clearLoadedClaim();
    stageOperationRef.current += 1;
    if (stageSavingRef.current) {
      stageSavingRef.current = false;
      if (mountedRef.current) setStageSaving(false);
    }
    if (pendingStageConfirmationRef.current
      && pendingStageConfirmationRef.current.claimId !== nextClaimId) {
      pendingStageConfirmationRef.current = null;
    }
    if (adjusterLoadingRef.current) {
      adjusterLoadingRef.current = false;
      if (mountedRef.current) setAdjusterLoading(false);
    }
    adjusterOptionsRef.current = [];
    if (mountedRef.current) setAdjusterOptions([]);
    cancelClaimantSearch();
    claimantOptionsRef.current = [];
    clearEventCatalog();
    cancelCatalogLoad();
    if (mountedRef.current) {
      setClaimantOptions([]);
      setClaimantSearching(false);
      setClaimantHasMore(false);
      setClaimantSearchError('''');
      setReasonOptions([]);
      setEventOptions([]);
      setCatalogLoading(false);
      setCatalogError('''');
    }
  };

  const displayValue = (value) => value === null || value === undefined || String(value).trim() === ''''
    ? EMPTY_VALUE : String(value);
  const formatAmount = (value) => {
    if (value === null || value === undefined || value === '''' || typeof value === ''boolean'') return EMPTY_VALUE;
    const amount = Number(value);
    return isFinite(amount) ? (claimSummary.valuation.currency ? claimSummary.valuation.currency + '' '' : '''') + amount.toLocaleString(''en-US'', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    }) : EMPTY_VALUE;
  };

  const dateText = (value) => {
    const raw = value && typeof value === ''object'' ? value._i : value;
    if (typeof raw !== ''string'') return null;
    // The API''s year-one sentinel represents an unset date, not a real occurrence.
    return /^\d{4}-\d{2}-\d{2}/.test(raw) && !raw.startsWith(''0001-'') ? raw : null;
  };
  const formatDate = (value) => {
    const text = dateText(value);
    if (!text) return null;
    const parts = text.slice(0, 10).split(''-'');
    return parts[2] + ''/'' + parts[1] + ''/'' + parts[0];
  };
  const occurrenceTime = (value) => {
    const text = dateText(value);
    const match = text && text.match(/T(\d{2}):(\d{2})/);
    if (!match) return {};
    const hour = Number(match[1]);
    return { hour: String(hour % 12 || 12).padStart(2, ''0''), minute: match[2], period: hour < 12 ? ''am'' : ''pm'' };
  };

  const firstValue = (...values) => values.find((value) => value !== null
    && value !== undefined && String(value).trim() !== '''');

  const personName = (person) => {
    if (!person) return null;
    if (typeof person !== ''object'') return String(person);
    return firstValue(person.FullName, person.fullName, [
      person.name, person.middlename, person.surname1, person.surname2
    ].filter(Boolean).join('' ''));
  };

  const responseRows = (result, label) => {
    if (result && result.ok === false) {
      throw new Error(result.msg || (''No fue posible consultar '' + label + ''.''));
    }
    const source = result && result.outData !== undefined ? result.outData : result;
    if (Array.isArray(source)) return source;
    if (source && Array.isArray(source.rows)) return source.rows;
    if (source && Array.isArray(source.data)) return source.data;
    if (source && Array.isArray(source.items)) return source.items;
    return source && typeof source === ''object'' ? [source] : [];
  };

  const numericValue = (value) => {
    if (value === null || value === undefined || String(value).trim() === '''' || typeof value === ''boolean'') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };
  const repositoryRequest = (name, payload) => Promise.resolve().then(() => exe(name, payload));
  const notifyRecordUpdated = () => {
    if (A.message && typeof A.message.success === ''function'') {
      A.message.success(''Registro actualizado'');
    }
  };

  const roundMoney = (value) => Number(Number(value || 0).toFixed(2));
  const activeReserveMovements = (claim, coverageId) => {
    const requestedClaimId = claim && Number(claim.id);
    return Array.isArray(claim && claim.Payouts) ? claim.Payouts.filter((item) => {
      const bucket = String(item && item.reserveType || '''').trim().toUpperCase();
      return item && Number(item.claimId) === requestedClaimId
        && Number(item.lifeCoverageId) === Number(coverageId)
        && Number(item.status) !== 2 && (bucket === ''IN'' || bucket === ''EX'');
    }) : [];
  };
  const normalizeCoverageRows = (claim) => {
    const policy = claim && claim.Policy ? claim.Policy : {};
    const coverages = Array.isArray(policy.Coverages) ? policy.Coverages : [];
    return coverages.map((coverage) => {
      const id = coverage && Number(coverage.id);
      if (!Number.isSafeInteger(id) || id <= 0) return null;
      const movements = activeReserveMovements(claim, id);
      const bucketTotal = (bucket, field) => roundMoney(movements.reduce((total, item) => {
        if (String(item.reserveType || '''').trim().toUpperCase() !== bucket) return total;
        const amount = numericValue(item[field]);
        return total + (amount === null ? 0 : amount);
      }, 0));
      const paymentReserve = bucketTotal(''IN'', ''reserved'');
      const expenseReserve = bucketTotal(''EX'', ''reserved'');
      const payments = bucketTotal(''IN'', ''payed'');
      const expenses = bucketTotal(''EX'', ''payed'');
      const limit = numericValue(coverage.limit);
      const deductible = numericValue(coverage.deductible);
      return {
        id: id,
        name: String(firstValue(coverage.name, coverage.description, coverage.code, ''Cobertura '' + id)),
        start: formatDate(firstValue(coverage.start, policy.start)),
        end: formatDate(firstValue(coverage.end, policy.end)),
        limit: limit,
        deductible: deductible,
        available: limit === null ? null : roundMoney(limit - paymentReserve - payments),
        paymentReserve: paymentReserve,
        expenseReserve: expenseReserve,
        totalReserve: roundMoney(paymentReserve + expenseReserve),
        payments: payments,
        expenses: expenses,
        movements: movements
      };
    }).filter(Boolean);
  };

  const buildReserveEntity = (claim, coverageId, direction, bucket, amount, concept) => {
    if (!claim || !canEdit(claim)) throw new Error(''El reclamo no permite registrar reservas.'');
    const policyId = Number(claim.lifePolicyId || (claim.Policy && claim.Policy.id));
    const requestedClaimId = Number(claim.id);
    const requestedCoverageId = Number(coverageId);
    const coverages = claim.Policy && Array.isArray(claim.Policy.Coverages) ? claim.Policy.Coverages : [];
    if (!Number.isSafeInteger(policyId) || policyId <= 0 || !Number.isSafeInteger(requestedClaimId)
      || requestedClaimId <= 0 || !coverages.some((item) => item && Number(item.id) === requestedCoverageId)) {
      throw new Error(''La cobertura seleccionada no pertenece al reclamo.'');
    }
    if (direction !== ''INCREASE'' && direction !== ''DECREASE'') {
      throw new Error(''El movimiento de reserva no es válido.'');
    }
    if (bucket !== ''IN'' && bucket !== ''EX'') throw new Error(''El tipo de reserva no es válido.'');
    const numericAmount = numericValue(amount);
    if (numericAmount === null || numericAmount <= 0) throw new Error(''El monto debe ser mayor que cero.'');
    const cleanConcept = String(concept || '''').trim();
    if (!cleanConcept) throw new Error(''El concepto es obligatorio.'');
    if (direction === ''DECREASE'') {
      const balance = roundMoney(activeReserveMovements(claim, requestedCoverageId).reduce((total, item) => {
        if (String(item.reserveType || '''').trim().toUpperCase() !== bucket) return total;
        const reserved = numericValue(item.reserved);
        return total + (reserved === null ? 0 : reserved);
      }, 0));
      if (numericAmount > balance) throw new Error(''La disminución no puede superar el saldo reservado.'');
    }
    const signedAmount = roundMoney(direction === ''DECREASE'' ? -numericAmount : numericAmount);
    return {
      amount: signedAmount,
      operation: ''RESERVE'',
      reserveType: bucket,
      concept: cleanConcept,
      lifePolicyId: policyId,
      claimId: requestedClaimId,
      lifeCoverageId: requestedCoverageId,
      reserved: signedAmount,
      payed: 0
    };
  };

  const reserveResultPayload = (result) => result && result.outData
    && !Array.isArray(result.outData) ? result.outData : result;
  const runReserveOperation = (commandName, payload, successMessage) => {
    if (reserveSavingRef.current) {
      setReserveError(''Ya hay una operación de reserva en curso.'');
      return Promise.resolve(false);
    }
    const operationClaimId = currentClaimRef.current ? Number(currentClaimRef.current.id) : null;
    if (!operationClaimId || routeClaimId() !== operationClaimId) {
      setReserveError(''El reclamo cambió. Recargue la información antes de continuar.'');
      return Promise.resolve(false);
    }
    const operationId = reserveOperationRef.current + 1;
    reserveOperationRef.current = operationId;
    reserveSavingRef.current = true;
    setReserveSaving(true);
    setReserveError('''');
    return repositoryRequest(commandName, payload).then((result) => {
      const body = reserveResultPayload(result);
      if (!result || result.ok === false || (body && body.ok === false)) {
        throw new Error(body && body.msg ? body.msg
          : result && result.msg ? result.msg : ''No fue posible ejecutar la operación de reserva.'');
      }
      if (!mountedRef.current || reserveOperationRef.current !== operationId
        || routeClaimId() !== operationClaimId) return false;
      return loadClaim(operationClaimId).then(() => {
        if (!mountedRef.current || reserveOperationRef.current !== operationId
          || routeClaimId() !== operationClaimId) return false;
        setReserveAmount('''');
        setReserveConcept('''');
        if (A.message && typeof A.message.success === ''function'') A.message.success(successMessage);
        return true;
      });
    }).catch((caughtError) => {
      if (mountedRef.current && reserveOperationRef.current === operationId
        && routeClaimId() === operationClaimId) {
        setReserveError(caughtError && caughtError.message
          ? caughtError.message : ''No fue posible ejecutar la operación de reserva.'');
      }
      return false;
    }).then((outcome) => {
      if (reserveOperationRef.current === operationId) {
        reserveSavingRef.current = false;
        if (mountedRef.current) setReserveSaving(false);
      }
      return outcome;
    });
  };

  const createReserveMovement = (direction, bucket, amount, concept) => {
    const claim = currentClaimRef.current;
    const rows = normalizeCoverageRows(claim);
    const coverageId = rows.some((row) => row.id === Number(selectedCoverageId))
      ? Number(selectedCoverageId) : rows.length === 1 ? rows[0].id : null;
    let entity;
    try {
      entity = buildReserveEntity(claim, coverageId, direction, bucket, amount, concept);
    } catch (caughtError) {
      setReserveError(caughtError && caughtError.message ? caughtError.message : ''La reserva no es válida.'');
      return Promise.resolve(false);
    }
    return runReserveOperation(''RepoLifeCoveragePayout'', { operation: ''ADD'', entity: entity }, ''Reserva registrada'');
  };

  const submitReserveMovement = () => createReserveMovement(
    reserveDirection, reserveType, reserveAmount, reserveConcept
  ).then((outcome) => {
    if (outcome && mountedRef.current) setReserveModalOpen(false);
    return outcome;
  });

  const closeClaimReserves = (confirmed) => {
    const claim = currentClaimRef.current;
    const hasBalance = normalizeCoverageRows(claim).some((row) => row.paymentReserve !== 0 || row.expenseReserve !== 0);
    if (!claim || !canEdit(claim) || !hasBalance) {
      setReserveError(''No hay saldos de reservas disponibles para cerrar.'');
      return Promise.resolve(false);
    }
    if (confirmed !== true) return Promise.resolve(false);
    return runReserveOperation(''ExeChain'', {
      chain: ''cmdClaimReserveClosing'',
      context: JSON.stringify({ claimId: Number(claim.id) })
    }, ''Reservas cerradas'');
  };

  const claimReadPayload = (requestedClaimId) => ({
    operation: ''GET'',
    include: [
      ''Contact'', ''Claimer'', ''Process'', ''Process.Pasos'', ''Policy'', ''Policy.Coverages'',
      ''Policy.Coverages.Benefits'', ''Policy.Coverages.Claims'', ''Policy.Exclusions'',
      ''Policy.Beneficiaries'', ''Policy.Holder'', ''Policy.Product'', ''Policy.Accounts'',
      ''Policy.Accounts.Movements'', ''Payouts'', ''Payments'', ''InsuredEvent'', ''Events'',
      ''FraudAnalysis'', ''Requirements''
    ],
    filter: ''id='' + requestedClaimId,
    page: 0,
    size: 1
  });

  const canEdit = (claim) => !!claim && !claim.closed;
  const isValidStageCode = (value) => value === ''F'' || value === ''R'';
  const claimStageCode = (claim) => {
    const state = claim && claim.Process ? claim.Process.entityState : null;
    const normalized = state === null || state === undefined ? '''' : String(state).trim().toUpperCase();
    if (normalized === ''F'' || normalized === ''FINALIZADO'') return ''F'';
    if (normalized === ''R'' || normalized === ''RECHAZADO'') return ''R'';
    return null;
  };

  const positiveIdText = (value) => {
    if (typeof value !== ''number'' && typeof value !== ''string'') return null;
    const numeric = Number(value);
    return Number.isSafeInteger(numeric) && numeric > 0 ? String(numeric) : null;
  };

  const sqlLiteral = (value) => String(value).replace(/''/g, "''''");
  const sqlLikeLiteral = (value) => sqlLiteral(value)
    .replace(/\[/g, ''[[]'').replace(/%/g, ''[%]'').replace(/_/g, ''[_]'');
  const claimantFilter = (query) => {
    const exact = sqlLiteral(query);
    const like = sqlLikeLiteral(query);
    return "((RTRIM(ISNULL([name],''''))+'' ''+RTRIM(ISNULL(surname1,''''))+'' ''+RTRIM(ISNULL(surname2,''''))) like N''%"
      + like + "%'' OR (cnp = ''" + exact + "'' OR nif = ''" + exact + "''))";
  };

  const strictOutData = (result, label) => {
    if (!result || result.ok === false || !Array.isArray(result.outData)) {
      throw new Error(result && result.msg ? result.msg : (''Respuesta de '' + label + '' incompatible.''));
    }
    return result.outData;
  };

  const claimantOption = (contact, preserve) => {
    if (!contact || typeof contact !== ''object'' || Array.isArray(contact)) return null;
    const value = positiveIdText(contact.id);
    const labelValue = personName(contact);
    const label = typeof labelValue === ''string'' ? labelValue.trim() : '''';
    if (!value || !label) return null;
    const unavailable = contact.inactive === true || contact.restricted === true
      || contact.restrictedForUser === true;
    if (unavailable && !preserve) return null;
    return { value: value, label: label, disabled: unavailable };
  };

  const catalogGetPayload = () => Object.assign({}, REPOSITORY_CATALOG_GET);

  const parseEventMatrix = (matrix, lob) => {
    if (!Array.isArray(matrix) || matrix.length === 0 || !Array.isArray(matrix[0])) {
      throw new Error(''La tabla de eventos asegurados no es compatible.'');
    }
    const indexes = {};
    matrix[0].forEach((header, index) => {
      const name = typeof header === ''string'' ? header.trim() : '''';
      if (!name || Object.prototype.hasOwnProperty.call(indexes, name)) {
        throw new Error(''La tabla de eventos asegurados no es compatible.'');
      }
      indexes[name] = index;
    });
    [''Lob'', ''LobName'', ''EventReason'', ''InsuredEvents''].forEach((name) => {
      if (!Object.prototype.hasOwnProperty.call(indexes, name)) {
        throw new Error(''La tabla de eventos asegurados no contiene '' + name + ''.'');
      }
    });
    const mappings = {};
    matrix.slice(1).forEach((row) => {
      if (!Array.isArray(row)) throw new Error(''La tabla de eventos asegurados no es compatible.'');
      const rowLob = row[indexes.Lob];
      const reason = row[indexes.EventReason];
      const csv = row[indexes.InsuredEvents];
      if (rowLob === null || rowLob === undefined || typeof reason !== ''string''
        || typeof csv !== ''string'' || reason.trim() === '''') {
        throw new Error(''La tabla de eventos asegurados no es compatible.'');
      }
      if (String(rowLob).trim() !== lob) return;
      const reasonCode = reason.trim();
      const eventCodes = csv.split('','').map((code) => code.trim()).filter(Boolean);
      if (eventCodes.length === 0) throw new Error(''La tabla de eventos asegurados no es compatible.'');
      if (!mappings[reasonCode]) mappings[reasonCode] = [];
      eventCodes.forEach((code) => {
        if (mappings[reasonCode].indexOf(code) === -1) mappings[reasonCode].push(code);
      });
    });
    return mappings;
  };

  const parseReasonCatalog = (rows) => {
    const byCode = {};
    rows.forEach((row) => {
      const code = row && typeof row.code === ''string'' ? row.code.trim() : '''';
      const name = row && typeof row.name === ''string'' ? row.name.trim() : '''';
      if (!row || typeof row !== ''object'' || Array.isArray(row) || !code || !name
        || typeof row.disabled !== ''boolean'' || byCode[code]) {
        throw new Error(''El catálogo de razones de evento no es compatible.'');
      }
      byCode[code] = { code: code, name: name, disabled: row.disabled };
    });
    return byCode;
  };

  const parseInsuredEventCatalog = (rows) => {
    const byCode = {};
    rows.forEach((row) => {
      const code = row && typeof row.code === ''string'' ? row.code.trim() : '''';
      const name = row && typeof row.name === ''string'' ? row.name.trim() : '''';
      const mode = row && typeof row.mode === ''string'' ? row.mode.trim() : '''';
      if (!row || typeof row !== ''object'' || Array.isArray(row) || !code || !name || !mode
        || typeof row.disabled !== ''boolean'' || typeof row.hasHealthProcedures !== ''boolean''
        || byCode[code]) {
        throw new Error(''El catálogo de eventos asegurados no es compatible.'');
      }
      byCode[code] = {
        code: code, name: name, mode: mode, disabled: row.disabled,
        hasHealthProcedures: row.hasHealthProcedures
      };
    });
    return byCode;
  };

  const claimTypeCode = (claim) => claim && typeof claim.claimType === ''string''
    ? claim.claimType.trim() : '''';

  const insuredEventForUpdate = (event, claimType) => {
    const expectedMode = typeof claimType === ''string'' ? claimType.trim() : '''';
    const eventMode = event && typeof event.mode === ''string'' ? event.mode.trim() : '''';
    if (!event || typeof event !== ''object'' || Array.isArray(event)
      || typeof event.code !== ''string'' || !event.code.trim()
      || typeof event.name !== ''string'' || !event.name.trim()
      || !expectedMode || eventMode !== expectedMode || event.disabled !== false
      || typeof event.hasHealthProcedures !== ''boolean'') {
      throw new Error(''El evento asegurado seleccionado no es válido.'');
    }
    return {
      code: event.code.trim(), name: event.name.trim(), mode: eventMode,
      disabled: false, hasHealthProcedures: event.hasHealthProcedures
    };
  };

  const validDateParts = (value, label) => {
    const match = String(value || '''').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) throw new Error(label + '' debe usar el formato DD/MM/AAAA.'');
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1
      || date.getUTCDate() !== day) {
      throw new Error(label + '' no es válida.'');
    }
    return { year: year, month: month, day: day };
  };

  const toUtcDate = (value, label) => {
    const parts = validDateParts(value, label);
    const pad = (part) => String(part).padStart(2, ''0'');
    return parts.year + ''-'' + pad(parts.month) + ''-'' + pad(parts.day);
  };

  const CLAIM_CUSTOM_SECTION = ''Detalle del Siniestro'';
  const CLAIM_CUSTOM_FIELD_TYPES = {
    ajustadorName: ''text'',
    ajustadorEmail: ''text'',
    hiddenAjustador: ''hidden'',
    descripcion: ''textarea''
  };

  const evaluateCustomFormCondition = (condition, claim) => {
    if (condition === null || condition === undefined || String(condition).trim() === '''') return true;
    if (typeof condition !== ''string'') return false;
    try {
      return !!Function(''pol'', ''cla'', ''"use strict";return !!('' + condition + '');'')(
        claim && claim.Policy, claim
      );
    } catch (failure) {
      return false;
    }
  };

  const parseCustomFormConfig = (profile, claim) => {
    const configured = profile && profile.Claim ? profile.Claim.customForms : [];
    if (!Array.isArray(configured)) {
      throw new Error(''La configuración de formularios personalizados no es compatible.'');
    }
    const names = {};
    return configured.filter((entry) => {
      if (!entry || typeof entry !== ''object'' || Array.isArray(entry)
        || typeof entry.name !== ''string'' || entry.name.trim() === ''''
        || !Number.isSafeInteger(Number(entry.formId)) || Number(entry.formId) <= 0
        || typeof entry.formId === ''boolean'') {
        throw new Error(''La configuración de formularios personalizados no es compatible.'');
      }
      const name = entry.name.trim();
      if (names[name]) throw new Error(''La configuración contiene formularios personalizados duplicados.'');
      names[name] = true;
      return evaluateCustomFormCondition(entry.condition, claim);
    }).map((entry) => Object.assign({}, entry, {
      name: entry.name.trim(), formId: Number(entry.formId)
    }));
  };

  const customFormOuter = (raw) => {
    if (raw === null || raw === undefined || String(raw).trim() === '''') return {};
    let outer;
    try { outer = typeof raw === ''string'' ? JSON.parse(raw) : raw; }
    catch (failure) { throw new Error(''La información de formularios personalizados no es compatible.''); }
    if (!outer || typeof outer !== ''object'' || Array.isArray(outer)) {
      throw new Error(''La información de formularios personalizados no es compatible.'');
    }
    return outer;
  };

  const hydrateCustomFormFields = (definitionFields, storedSection) => {
    if (!Array.isArray(definitionFields)) throw new Error(''La definición del formulario no es compatible.'');
    let stored = [];
    if (storedSection !== null && storedSection !== undefined && storedSection !== '''') {
      try { stored = typeof storedSection === ''string'' ? JSON.parse(storedSection) : storedSection; }
      catch (failure) { throw new Error(''Los valores del formulario personalizado no son compatibles.''); }
      if (!Array.isArray(stored)) throw new Error(''Los valores del formulario personalizado no son compatibles.'');
    }
    const values = {};
    stored.forEach((field) => {
      if (field && typeof field.name === ''string'' && !values[field.name]
        && Array.isArray(field.userData)) values[field.name] = field.userData.slice();
    });
    return definitionFields.map((field) => {
      if (!field || typeof field !== ''object'' || Array.isArray(field)
        || typeof field.type !== ''string'' || typeof field.name !== ''string'' || field.name.trim() === '''') {
        throw new Error(''La definición del formulario no es compatible.'');
      }
      const hydrated = Object.assign({}, field);
      if (values[field.name]) hydrated.userData = values[field.name];
      return hydrated;
    });
  };

  const parseCustomFormDefinition = (row, metadata, rawValues) => {
    if (!row || typeof row !== ''object'' || Number(row.id) !== Number(metadata.formId)
      || typeof row.name !== ''string'' || typeof row.json !== ''string'') {
      throw new Error(''La respuesta del formulario personalizado no es compatible.'');
    }
    let definition;
    try { definition = JSON.parse(row.json); }
    catch (failure) { throw new Error(''La definición del formulario personalizado no es compatible.''); }
    const outer = customFormOuter(rawValues);
    return {
      key: ''resumenCustomForm_'' + Number(metadata.instanceIndex || 0) + ''_''
        + metadata.name.replace(/[^A-Za-z0-9_-]/g, ''_'') + ''_'' + Number(metadata.formId),
      label: metadata.name,
      icon: metadata.icon || ''form'',
      formId: Number(metadata.formId),
      nativeName: row.name,
      logic: typeof row.logic === ''string'' ? row.logic : '''',
      fields: hydrateCustomFormFields(definition, outer[metadata.name])
    };
  };

  const serializeCustomForms = (raw, forms) => {
    const outer = customFormOuter(raw);
    (forms || []).forEach((form) => {
      if (!form || typeof form.label !== ''string'' || !Array.isArray(form.fields)) {
        throw new Error(''El formulario personalizado no es compatible.'');
      }
      outer[form.label] = JSON.stringify(form.fields);
    });
    return JSON.stringify(outer);
  };

  const validateCustomForms = (forms) => {
    (forms || []).forEach((form) => {
      if (!form || !Array.isArray(form.fields)) throw new Error(''El formulario personalizado no es compatible.'');
      form.fields.forEach((field) => {
        const value = field && Array.isArray(field.userData) ? field.userData[0] : undefined;
        if (field && field.required && (value === null || value === undefined || String(value).trim() === '''')) {
          throw new Error((field.label || field.name || ''Un campo requerido'') + '' es obligatorio.'');
        }
      });
    });
    return true;
  };

  const waitForConfigProfile = (operationId, attempts) => new Promise((resolve, reject) => {
    if (!mountedRef.current || operationId !== customFormsOperationRef.current) return resolve(null);
    if (window.global && window.global.configProfile) return resolve(window.global.configProfile);
    if (attempts <= 0) return reject(new Error(''No fue posible cargar la configuración de formularios personalizados.''));
    window.setTimeout(() => {
      waitForConfigProfile(operationId, attempts - 1).then(resolve, reject);
    }, 100);
  });

  const loadCustomForms = (claim) => {
    const operationId = customFormsOperationRef.current + 1;
    customFormsOperationRef.current = operationId;
    customFormsStatusRef.current = ''loading'';
    customFormsRef.current = [];
    if (mountedRef.current) {
      setCustomForms([]);
      setCustomFormsLoading(true);
      setCustomFormsError('''');
      setActiveCustomForm('''');
    }
    return waitForConfigProfile(operationId, 30).then((profile) => {
      if (!profile || operationId !== customFormsOperationRef.current
        || !mountedRef.current || currentClaimRef.current !== claim) return null;
      const metadata = parseCustomFormConfig(profile, claim);
      return Promise.all(metadata.map((entry, index) => repositoryRequest(''GetForms'', {
        filter: ''id='' + entry.formId
      }).then((result) => {
        const rows = strictOutData(result, ''GetForms'');
        if (rows.length !== 1) throw new Error(''No se encontró una definición única para '' + entry.name + ''.'');
        return parseCustomFormDefinition(rows[0], Object.assign({ instanceIndex: index }, entry), claim.jCustomForms);
      })));
    }).then((forms) => {
      if (!forms || operationId !== customFormsOperationRef.current
        || !mountedRef.current || currentClaimRef.current !== claim) return;
      customFormsRef.current = forms;
      customFormsStatusRef.current = forms.length ? ''rendering'' : ''ready'';
      setCustomForms(forms);
      setActiveCustomForm(forms.length ? forms[0].key : '''');
    }).catch((caughtError) => {
      if (operationId === customFormsOperationRef.current && mountedRef.current
        && currentClaimRef.current === claim) {
        customFormsRef.current = [];
        customFormsStatusRef.current = ''error'';
        setCustomForms([]);
        setCustomFormsError(caughtError && caughtError.message
          ? caughtError.message : ''No fue posible cargar los formularios personalizados.'');
      }
    }).then(() => {
      if (operationId === customFormsOperationRef.current && mountedRef.current) {
        setCustomFormsLoading(false);
      }
    });
  };

  const createScopedFormRuntime = (root, operationId, hostWindow, hostDocument, hostJQuery) => {
    const nativeWindow = hostWindow || window;
    const nativeDocument = hostDocument || document;
    const native$ = hostJQuery || nativeWindow.jQuery || nativeWindow.$;
    const namespace = ''.resumenCustomForm'' + operationId + String(Math.random()).slice(2);
    const listeners = [];
    const observers = [];
    const timers = [];
    const createdNodes = [];
    let alive = true;
    const active = () => alive && mountedRef.current
      && customFormsOperationRef.current === operationId;
    const listen = (target, name, listener, options) => {
      target.addEventListener(name, listener, options);
      listeners.push([target, name, listener, options]);
    };
    const scopedDocument = {
      querySelector: (selector) => root.querySelector(selector),
      querySelectorAll: (selector) => root.querySelectorAll(selector),
      getElementById: (id) => root.querySelector(''#'' + String(id).replace(/([ #;?%&,.+*~\'':"!^$[\]()=>|/@])/g, ''\\$1'')),
      createElement: (name) => {
        const node = nativeDocument.createElement(name);
        createdNodes.push(node);
        return node;
      },
      addEventListener: (name, listener, options) => listen(nativeDocument, name, listener, options),
      removeEventListener: (name, listener, options) => nativeDocument.removeEventListener(name, listener, options)
    };
    const scopedWindow = {
      document: scopedDocument,
      location: nativeWindow.location,
      addEventListener: (name, listener, options) => listen(nativeWindow, name, listener, options),
      removeEventListener: (name, listener, options) => nativeWindow.removeEventListener(name, listener, options)
    };
    const scopedSetTimeout = (callback, delay) => {
      const id = nativeWindow.setTimeout(() => { if (active()) callback(); }, delay);
      timers.push(id);
      return id;
    };
    const scopedClearTimeout = (id) => nativeWindow.clearTimeout(id);
    scopedWindow.setTimeout = scopedSetTimeout;
    scopedWindow.clearTimeout = scopedClearTimeout;
    const ScopedMutationObserver = function (callback) {
      if (typeof nativeWindow.MutationObserver !== ''function'') {
        throw new Error(''MutationObserver no está disponible para el formulario personalizado.'');
      }
      const observer = new nativeWindow.MutationObserver((records, observerInstance) => {
        if (active()) callback(records, observerInstance);
      });
      observers.push(observer);
      return observer;
    };
    const scoped$ = (selector, attributes) => {
      if (!native$) throw new Error(''El renderizador de formularios personalizados no está disponible.'');
      if (selector === nativeDocument || selector === scopedDocument
        || selector === nativeWindow || selector === scopedWindow) {
        const target = selector === nativeWindow || selector === scopedWindow ? nativeWindow : nativeDocument;
        const collection = native$(target);
        const wrapper = Object.create(collection);
        wrapper.on = function (events) {
          const args = Array.prototype.slice.call(arguments, 1);
          const namespaced = String(events).split(/\s+/).map((eventName) => eventName + namespace).join('' '');
          collection.on.apply(collection, [namespaced].concat(args));
          return wrapper;
        };
        wrapper.off = function () { collection.off(namespace); return wrapper; };
        return wrapper;
      }
      if (typeof selector === ''string'') {
        if (/^\s*</.test(selector)) {
          const created = native$(selector, attributes);
          if (typeof created.toArray === ''function'') {
            created.toArray().forEach((node) => createdNodes.push(node));
          }
          if (typeof created.appendTo === ''function'') {
            const appendTo = created.appendTo;
            created.appendTo = function (target) {
              return appendTo.call(created, target === ''head'' || target === ''body'' || target === ''html''
                ? native$(root) : target);
            };
          }
          return created;
        }
        if (selector === ''head'' || selector === ''body'' || selector === ''html'') return native$(root);
        return native$(root).find(selector);
      }
      if (selector && (selector === root || (typeof root.contains === ''function'' && root.contains(selector)))) {
        return native$(selector);
      }
      return native$([]);
    };
    if (native$) scoped$.fn = native$.fn;
    const scopedExe = (name, payload) => {
      if (!active()) {
        return Promise.reject(new Error(''La operación del formulario personalizado fue cancelada.''));
      }
      return repositoryRequest(name, payload).then((result) => {
        if (!active()) throw new Error(''La operación del formulario personalizado fue cancelada.'');
        return result;
      });
    };
    const cleanup = () => {
      if (!alive) return;
      alive = false;
      timers.forEach((id) => nativeWindow.clearTimeout(id));
      listeners.forEach((entry) => entry[0].removeEventListener(entry[1], entry[2], entry[3]));
      observers.forEach((observer) => observer.disconnect());
      if (native$) {
        native$(nativeDocument).off(namespace);
        native$(nativeWindow).off(namespace);
      }
      createdNodes.forEach((node) => {
        if (node.parentNode && !(typeof root.contains === ''function'' && root.contains(node))) {
          node.parentNode.removeChild(node);
        }
      });
    };
    return {
      exe: scopedExe, $: scoped$, jQuery: scoped$, document: scopedDocument,
      window: scopedWindow, MutationObserver: ScopedMutationObserver,
      setTimeout: scopedSetTimeout, clearTimeout: scopedClearTimeout,
      cleanup: cleanup, isActive: active
    };
  };

  const executeCustomFormLogic = (logicSource, runtime) => {
    if (!logicSource) return undefined;
    if (typeof logicSource !== ''string'' || !runtime || typeof runtime.exe !== ''function'') {
      throw new Error(''La lógica del formulario personalizado no es compatible.'');
    }
    const logic = Function(''exe'', ''$'', ''jQuery'', ''document'', ''window'',
      ''MutationObserver'', ''setTimeout'', ''clearTimeout'',
      ''return function(){\n'' + logicSource + ''\n};'')(
        runtime.exe, runtime.$, runtime.jQuery, runtime.document, runtime.window,
        runtime.MutationObserver, runtime.setTimeout, runtime.clearTimeout
      );
    return logic.call({ exe: runtime.exe });
  };

  const readCustomClaimForm = (raw) => {
    if (raw === null || raw === undefined || String(raw).trim() === '''') {
      return { outer: {}, fields: [], serialized: true };
    }
    let outer;
    try {
      outer = typeof raw === ''string'' ? JSON.parse(raw) : raw;
    } catch (failure) {
      throw new Error(''El formulario personalizado del reclamo no es compatible.'');
    }
    if (!outer || typeof outer !== ''object'' || Array.isArray(outer)) {
      throw new Error(''El formulario personalizado del reclamo no es compatible.'');
    }
    const section = outer[CLAIM_CUSTOM_SECTION];
    if (section === null || section === undefined || section === '''') {
      return { outer: outer, fields: [], serialized: true };
    }
    let fields;
    try {
      fields = typeof section === ''string'' ? JSON.parse(section) : section;
    } catch (failure) {
      throw new Error(''El formulario personalizado del reclamo no es compatible.'');
    }
    if (!Array.isArray(fields)) {
      throw new Error(''El formulario personalizado del reclamo no es compatible.'');
    }
    const seen = {};
    fields.forEach((field) => {
      if (!field || !Object.prototype.hasOwnProperty.call(CLAIM_CUSTOM_FIELD_TYPES, field.name)) return;
      if (seen[field.name]) throw new Error(''El formulario tiene campos personalizados duplicados.'');
      seen[field.name] = true;
      if (field.type !== CLAIM_CUSTOM_FIELD_TYPES[field.name]) {
        throw new Error(''El campo personalizado '' + field.name + '' no es compatible.'');
      }
      if (field.name === ''descripcion'' && (!Array.isArray(field.userData)
        || field.userData.length !== 1 || typeof field.userData[0] !== ''string'')) {
        throw new Error(''El campo personalizado descripcion no tiene un valor editable compatible.'');
      }
    });
    return { outer: outer, fields: fields, serialized: typeof section === ''string'' };
  };

  const customClaimFieldValue = (form, name) => {
    const field = form.fields.find((item) => item && item.name === name);
    return field && Array.isArray(field.userData) && field.userData.length
      ? String(field.userData[0]) : '''';
  };

  const updateCustomClaimFields = (raw, changes) => {
    const form = readCustomClaimForm(raw);
    const names = Object.keys(changes || {});
    const adjusterNames = [''ajustadorName'', ''ajustadorEmail'', ''hiddenAjustador''];
    const adjusterChangeCount = adjusterNames.filter((name) => names.indexOf(name) !== -1).length;
    if (adjusterChangeCount !== 0 && adjusterChangeCount !== 3) {
      throw new Error(''El ajustador requiere actualización atómica.'');
    }
    const updates = [];
    names.forEach((name) => {
      if (name !== ''descripcion'' && adjusterNames.indexOf(name) === -1) {
        throw new Error(''El campo personalizado '' + name + '' no admite escritura.'');
      }
      const field = form.fields.find((item) => item && item.name === name);
      if (!field) throw new Error(''Campo personalizado no compatible: '' + name + ''.'');
      const value = changes[name];
      if (typeof value !== ''string'') {
        throw new Error(''El campo personalizado '' + name + '' requiere texto.'');
      }
      if (name !== ''descripcion'' && value.trim() === '''') throw new Error(''El ajustador está vacío.'');
      if (name !== ''descripcion'' && (!Array.isArray(field.userData)
        || field.userData.length !== 1 || typeof field.userData[0] !== ''string'')) {
        throw new Error(''El campo '' + name + '' no es editable.'');
      }
      updates.push([field, value]);
    });
    updates.forEach((update) => { update[0].userData = [update[1]]; });
    form.outer[CLAIM_CUSTOM_SECTION] = form.serialized ? JSON.stringify(form.fields) : form.fields;
    return JSON.stringify(form.outer);
  };

  const createDraft = (claim) => {
    const time = occurrenceTime(claim && claim.occurrence);
    const customForm = readCustomClaimForm(claim && claim.jCustomForms);
    const insuredEvent = claim && claim.InsuredEvent && typeof claim.InsuredEvent === ''object''
      ? claim.InsuredEvent : null;
    return {
      claimNumber: claim && firstValue(claim.code, claim.id),
      description: claim ? claim.description : null,
      claimantId: claim && positiveIdText(claim.claimerId) || '''',
      claimantLabel: claim ? (personName(claim.Claimer) || '''') : '''',
      eventReasonCode: claim && typeof claim.eventReason === ''string'' ? claim.eventReason : '''',
      insuredEventCode: claim ? String(firstValue(claim.insuredEvent,
        insuredEvent && insuredEvent.code) || '''') : '''',
      insuredEvent: insuredEvent,
      assignedToName: customClaimFieldValue(customForm, ''ajustadorName''),
      assignedToEmail: customClaimFieldValue(customForm, ''ajustadorEmail''),
      assignedToCode: customClaimFieldValue(customForm, ''hiddenAjustador''),
      additionalObservations: customClaimFieldValue(customForm, ''descripcion''),
      occurrenceDate: formatDate(claim && claim.occurrence) || '''',
      occurrenceHour: time.hour || '''',
      occurrenceMinute: time.minute || '''',
      occurrencePeriod: time.period || ''am'',
      notificationDate: formatDate(claim && claim.notification) || ''''
    };
  };

  const occurrenceIso = (draftValue) => {
    const date = toUtcDate(draftValue.occurrenceDate, ''Fecha del Siniestro'');
    const hour = Number(draftValue.occurrenceHour);
    const minute = Number(draftValue.occurrenceMinute);
    if (!/^\d{1,2}$/.test(String(draftValue.occurrenceHour || ''''))
      || hour < 1 || hour > 12) {
      throw new Error(''Hora del Siniestro no es válida.'');
    }
    if (!/^\d{1,2}$/.test(String(draftValue.occurrenceMinute || ''''))
      || minute < 0 || minute > 59) {
      throw new Error(''Minuto del Siniestro no es válido.'');
    }
    if (draftValue.occurrencePeriod !== ''am'' && draftValue.occurrencePeriod !== ''pm'') {
      throw new Error(''Período del Siniestro no es válido.'');
    }
    const hour24 = draftValue.occurrencePeriod === ''pm''
      ? (hour % 12) + 12 : hour % 12;
    return date + ''T'' + String(hour24).padStart(2, ''0'') + '':''
      + String(minute).padStart(2, ''0'') + '':00Z'';
  };

  const serializeEntity = (claim) => {
    const entity = {};
    Object.keys(claim || {}).forEach((key) => {
      entity[key] = claim[key];
    });
    [''Policy'', ''Contact'', ''Claimer'', ''Process'', ''Payouts'', ''Payments'',
      ''EventReason'', ''Stage'', ''MasterClaim'', ''Organization'', ''ReEvent'',
      ''Procedures'', ''Documents'', ''SalvageProcedures''].forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(entity, key)) entity[key] = null;
    });
    delete entity.stageCode;
    return entity;
  };

  const buildUpdate = (claim, draftValue, touchedFields, formsSnapshot) => {
    if (!canEdit(claim)) throw new Error(''El reclamo está cerrado.'');
    if (!draftValue) throw new Error(''No hay cambios disponibles para guardar.'');
    const entity = serializeEntity(claim);
    const originalDraft = createDraft(claim);
    const occurrenceFields = [''occurrenceDate'', ''occurrenceHour'', ''occurrenceMinute'', ''occurrencePeriod''];
    const occurrenceTouched = touchedFields
      ? occurrenceFields.some((field) => touchedFields[field])
      : occurrenceFields.some((field) => draftValue[field] !== originalDraft[field]);
    const notificationTouched = touchedFields
      ? !!touchedFields.notificationDate
      : draftValue.notificationDate !== originalDraft.notificationDate;
    const descriptionTouched = touchedFields
      ? !!touchedFields.description
      : draftValue.description !== originalDraft.description;
    const observationsTouched = touchedFields
      ? !!touchedFields.additionalObservations
      : draftValue.additionalObservations !== originalDraft.additionalObservations;
    const adjusterTouched = touchedFields
      ? !!touchedFields.assignedTo
      : [''Name'', ''Email'', ''Code''].some((suffix) =>
        draftValue[''assignedTo'' + suffix] !== originalDraft[''assignedTo'' + suffix]);
    const claimantTouched = touchedFields ? !!touchedFields.claimant
      : draftValue.claimantId !== originalDraft.claimantId;
    const eventReasonTouched = touchedFields ? !!touchedFields.eventReason
      : draftValue.eventReasonCode !== originalDraft.eventReasonCode;
    const insuredEventTouched = touchedFields ? !!touchedFields.insuredEvent
      : draftValue.insuredEventCode !== originalDraft.insuredEventCode;
    entity.description = descriptionTouched ? draftValue.description : claim.description;
    entity.occurrence = occurrenceTouched ? occurrenceIso(draftValue) : claim.occurrence;
    entity.notification = notificationTouched
      ? toUtcDate(draftValue.notificationDate, ''Fecha de Notificación'') + ''T00:00:00Z''
      : claim.notification;
    if (claimantTouched) {
      const claimantId = positiveIdText(draftValue.claimantId);
      if (!claimantId) throw new Error(''El reclamante seleccionado no es válido.'');
      entity.claimerId = Number(claimantId);
    }
    if (eventReasonTouched) {
      const reasonCode = typeof draftValue.eventReasonCode === ''string''
        ? draftValue.eventReasonCode.trim() : '''';
      if (!reasonCode) throw new Error(''La razón de evento seleccionada no es válida.'');
      entity.eventReason = reasonCode;
    }
    if (insuredEventTouched) {
      const selectedEvent = insuredEventForUpdate(draftValue.insuredEvent, claim.claimType);
      if (selectedEvent.code !== draftValue.insuredEventCode) {
        throw new Error(''El evento asegurado seleccionado no es consistente.'');
      }
      entity.InsuredEvent = selectedEvent;
      entity.insuredEvent = selectedEvent.code;
    }
    if (observationsTouched || adjusterTouched) {
      const customChanges = {};
      if (observationsTouched) customChanges.descripcion = draftValue.additionalObservations;
      if (adjusterTouched) {
        customChanges.ajustadorName = draftValue.assignedToName;
        customChanges.ajustadorEmail = draftValue.assignedToEmail;
        customChanges.hiddenAjustador = String(draftValue.assignedToCode);
      }
      entity.jCustomForms = updateCustomClaimFields(claim.jCustomForms, customChanges);
    }
    if (touchedFields && touchedFields.customForms) {
      entity.jCustomForms = serializeCustomForms(entity.jCustomForms, formsSnapshot || customFormsRef.current);
    }
    return entity;
  };

  const buildCreate = (values) => {
    const requiredIds = [''lifePolicyId'', ''claimerId'', ''contactId''];
    requiredIds.forEach((key) => {
      if (!Number.isSafeInteger(Number(values && values[key])) || Number(values[key]) <= 0) {
        throw new Error(key + '' es obligatorio.'');
      }
    });
    if (!values.eventReason || !values.insuredEvent || !values.insuredEvent.code
      || !values.claimType || !values.occurrence || !values.notification) {
      throw new Error(''Faltan datos verificados para crear el reclamo.'');
    }
    return {
      lifePolicyId: Number(values.lifePolicyId),
      claimerId: Number(values.claimerId),
      nameOfPatient: String(Number(values.claimerId)),
      eventReason: values.eventReason,
      InsuredEvent: values.insuredEvent,
      elegibleCoverages: values.elegibleCoverages,
      claimType: values.claimType,
      occurrence: values.occurrence,
      notification: values.notification,
      created: values.notification,
      id: ''0'',
      description: values.description,
      jCustomForms: values.jCustomForms,
      contactId: Number(values.contactId)
    };
  };

  const changeDraft = (field, value) => {
    if (!draftRef.current || !canEdit(currentClaimRef.current)
      || savingRef.current || stageSavingRef.current || adjusterLoadingRef.current) return;
    const next = Object.assign({}, draftRef.current);
    next[field] = value;
    draftRef.current = next;
    touchedRef.current[field] = true;
    dirtyRef.current = true;
    setDraft(next);
    if (field === ''additionalObservations'') {
      const detail = customFormsRef.current.find((form) => form.label === CLAIM_CUSTOM_SECTION);
      const description = detail && detail.fields.find((item) => item && item.name === ''descripcion'');
      if (description) description.userData = [String(value)];
      const instance = detail && customFormInstancesRef.current[detail.key];
      if (instance && instance.container) {
        const input = instance.container.querySelector(''[name="descripcion"]'');
        if (input && input.value !== String(value)) input.value = String(value);
      }
    }
  };

  const changeCustomFormValue = (label, name, value) => {
    if (!draftRef.current || !canEdit(currentClaimRef.current)
      || savingRef.current || stageSavingRef.current) return;
    const form = customFormsRef.current.find((item) => item.label === label);
    const field = form && form.fields.find((item) => item && item.name === name);
    if (!field) return;
    field.userData = [String(value === null || value === undefined ? '''' : value)];
    touchedRef.current.customForms = true;
    dirtyRef.current = true;
    const mappedDraftFields = {
      descripcion: ''additionalObservations'', ajustadorName: ''assignedToName'',
      ajustadorEmail: ''assignedToEmail'', hiddenAjustador: ''assignedToCode''
    };
    const mappedField = label === CLAIM_CUSTOM_SECTION ? mappedDraftFields[name] : null;
    if (mappedField) {
      const change = {};
      change[mappedField] = field.userData[0];
      const next = Object.assign({}, draftRef.current, change);
      draftRef.current = next;
      if (name === ''descripcion'') touchedRef.current.additionalObservations = true;
      else touchedRef.current.assignedTo = true;
      setDraft(next);
    } else {
      setDraft(Object.assign({}, draftRef.current));
    }
  };

  const collectRenderedCustomForms = () => {
    const nextDraft = Object.assign({}, draftRef.current);
    const mappedFields = {
      descripcion: ''additionalObservations'', ajustadorName: ''assignedToName'',
      ajustadorEmail: ''assignedToEmail'', hiddenAjustador: ''assignedToCode''
    };
    customFormsRef.current.forEach((form) => {
      const instance = customFormInstancesRef.current[form.key];
      if (instance && instance.renderer && Array.isArray(instance.renderer.userData)) {
        const fields = JSON.parse(JSON.stringify(instance.renderer.userData));
        if (JSON.stringify(fields) !== JSON.stringify(form.fields)) {
          touchedRef.current.customForms = true;
          dirtyRef.current = true;
        }
        form.fields = fields;
        if (form.label === CLAIM_CUSTOM_SECTION) {
          fields.forEach((field) => {
            const mapped = mappedFields[field.name];
            if (!mapped) return;
            const value = customClaimFieldValue(form, field.name);
            if (nextDraft[mapped] !== value) {
              nextDraft[mapped] = value;
              touchedRef.current[field.name === ''descripcion'' ? ''additionalObservations'' : ''assignedTo''] = true;
            }
          });
        }
      }
      if (instance && instance.container && typeof instance.container.checkValidity === ''function''
        && !instance.container.checkValidity()) {
        throw new Error(''Complete los campos requeridos del formulario '' + form.label + ''.'');
      }
    });
    validateCustomForms(customFormsRef.current);
    draftRef.current = nextDraft;
    setDraft(nextDraft);
  };

  const touchedClaimValue = (claim, field) => {
    if (field === ''occurrenceDate'' || field === ''occurrenceHour''
      || field === ''occurrenceMinute'' || field === ''occurrencePeriod'') return claim.occurrence;
    if (field === ''notificationDate'') return claim.notification;
    if (field === ''additionalObservations'') {
      return customClaimFieldValue(readCustomClaimForm(claim.jCustomForms), ''descripcion'');
    }
    if (field === ''customForms'') return claim.jCustomForms;
    if (field === ''assignedTo'') {
      const form = readCustomClaimForm(claim.jCustomForms);
      return {
        name: customClaimFieldValue(form, ''ajustadorName''),
        email: customClaimFieldValue(form, ''ajustadorEmail''),
        id: customClaimFieldValue(form, ''hiddenAjustador'')
      };
    }
    if (field === ''claimant'') return claim.claimerId;
    if (field === ''eventReason'') return claim.eventReason;
    if (field === ''insuredEvent'') {
      return {
        code: firstValue(claim.insuredEvent, claim.InsuredEvent && claim.InsuredEvent.code),
        event: claim.InsuredEvent
      };
    }
    return claim[field];
  };

  const currentClaimantOption = (claim) => {
    if (!claim) return null;
    const contact = Object.assign({}, claim.Claimer || {}, { id: claim.claimerId });
    return claimantOption(contact, true);
  };

  const setClaimantOptionList = (options) => {
    claimantOptionsRef.current = options;
    setClaimantOptions(options);
  };

  const claimantOptionsWithCurrent = (options, claim) => {
    const current = currentClaimantOption(claim);
    if (!current || options.some((option) => option.value === current.value)) return options;
    return [current].concat(options);
  };

  const claimantOptionsWithSelection = (options, claim) => {
    const withCurrent = claimantOptionsWithCurrent(options, claim);
    const selectedId = draftRef.current && positiveIdText(draftRef.current.claimantId);
    const selectedLabel = draftRef.current && typeof draftRef.current.claimantLabel === ''string''
      ? draftRef.current.claimantLabel.trim() : '''';
    if (!selectedId || !selectedLabel
      || withCurrent.some((option) => option.value === selectedId)) return withCurrent;
    return [{ value: selectedId, label: selectedLabel, disabled: false }].concat(withCurrent);
  };

  const searchClaimants = (queryValue) => {
    const query = typeof queryValue === ''string'' ? queryValue.trim() : '''';
    const claim = currentClaimRef.current;
    const claimIdValue = claim ? Number(claim.id) : null;
    if (!query) {
      cancelClaimantSearch();
      setClaimantOptionList(claimantOptionsWithSelection([], claim));
      setClaimantHasMore(false);
      setClaimantSearchError('''');
      return Promise.resolve();
    }
    if (!mountedRef.current || !canEdit(claim) || routeClaimId() !== claimIdValue) {
      return Promise.resolve();
    }
    cancelClaimantSearch();
    const operationId = claimantSearchOperationRef.current + 1;
    const requestId = requestRef.current;
    claimantSearchOperationRef.current = operationId;
    setClaimantSearching(true);
    setClaimantSearchError('''');
    const isCurrent = () => mountedRef.current
      && claimantSearchOperationRef.current === operationId
      && requestRef.current === requestId && routeClaimId() === claimIdValue;
    return repositoryRequest(''GetContacts'', {
      filter: claimantFilter(query), size: 10, page: 0, total: 0,
      tagFilterAll: null, tagFilterAny: null, include: null, getRelatedData: false
    }).then((result) => {
      if (!isCurrent()) return;
      const rows = strictOutData(result, ''búsqueda de reclamantes'');
      const seen = {};
      const options = [];
      rows.forEach((row) => {
        const id = row && positiveIdText(row.id);
        if (!id || seen[id]) throw new Error(''Respuesta de búsqueda de reclamantes incompatible.'');
        seen[id] = true;
        const option = claimantOption(row, false);
        if (option) options.push(option);
        else if (!(row && (row.inactive === true || row.restricted === true
          || row.restrictedForUser === true))) {
          throw new Error(''Respuesta de búsqueda de reclamantes incompatible.'');
        }
      });
      setClaimantOptionList(claimantOptionsWithSelection(options, claim));
      const total = Number(result.total);
      setClaimantHasMore((Number.isFinite(total) && total > rows.length) || rows.length === 10);
    }).catch((caughtError) => {
      if (isCurrent()) {
        setClaimantSearchError(caughtError && caughtError.message
          ? caughtError.message : ''No se pudo buscar reclamantes.'');
      }
    }).then(() => {
      if (!isCurrent()) return;
      setClaimantSearching(false);
    });
  };

  const scheduleClaimantSearch = (query) => {
    cancelClaimantSearch();
    claimantSearchTimerRef.current = window.setTimeout(() => {
      claimantSearchTimerRef.current = null;
      searchClaimants(query);
    }, 300);
  };

  const changeClaimant = (contactId, contactName) => {
    const value = positiveIdText(contactId);
    const name = typeof contactName === ''string'' ? contactName.trim() : '''';
    const matches = claimantOptionsRef.current.filter((option) => option
      && option.value === value && option.label === name && !option.disabled);
    if (!value || matches.length !== 1 || !draftRef.current
      || !mountedRef.current || !canEdit(currentClaimRef.current)
      || savingRef.current || stageSavingRef.current || adjusterLoadingRef.current
      || routeClaimId() !== Number(currentClaimRef.current.id)) {
      if (mountedRef.current && value && matches.length !== 1) {
        setError(''El reclamante seleccionado no es válido.'');
      }
      return;
    }
    cancelClaimantSearch();
    setClaimantOptionList([matches[0]].concat(claimantOptionsRef.current.filter((option) =>
      option && option.value !== value)));
    const next = Object.assign({}, draftRef.current, {
      claimantId: value, claimantLabel: matches[0].label
    });
    draftRef.current = next;
    touchedRef.current.claimant = true;
    dirtyRef.current = true;
    setDraft(next);
    setError('''');
  };

  const preservedOption = (options, value, label) => {
    if (!value || options.some((option) => option.value === value)) return options;
    return options.concat([{ value: value, label: label || value, disabled: true }]);
  };

  const eventOptionsForReason = (catalog, reasonCode, selectedCode, selectedEvent, claimType) => {
    const expectedMode = typeof claimType === ''string'' ? claimType.trim() : '''';
    const codes = catalog && catalog.mappings[reasonCode] || [];
    const options = codes.map((code) => catalog.eventByCode[code]).filter((event) =>
      event && event.disabled === false && expectedMode && event.mode === expectedMode)
      .map((event) => ({ value: event.code, label: event.name }));
    const selectedName = selectedEvent && typeof selectedEvent.name === ''string''
      ? selectedEvent.name.trim() : selectedCode;
    return preservedOption(options, selectedCode, selectedName);
  };

  const setEventOptionList = (options) => {
    eventOptionsRef.current = options;
    setEventOptions(options);
  };

  const applyEventCatalogToDraft = (catalog, draftValue, claim) => {
    const selectedReason = draftValue && draftValue.eventReasonCode || '''';
    const selectedReasonName = claim && claim.EventReason && personName(claim.EventReason)
      || selectedReason;
    const visibleReasons = preservedOption(catalog.reasonOptions,
      selectedReason, selectedReasonName);
    reasonOptionsRef.current = visibleReasons;
    setReasonOptions(visibleReasons);
    setEventOptionList(eventOptionsForReason(catalog, selectedReason,
      draftValue && draftValue.insuredEventCode || '''',
      draftValue && draftValue.insuredEvent, claimTypeCode(claim)));
  };

  const loadClaimCatalogs = (requestedClaimId) => {
    const claim = currentClaimRef.current;
    const claimIdValue = Number(requestedClaimId);
    const lobValue = claim && claim.Policy ? claim.Policy.lob : null;
    const lob = lobValue === null || lobValue === undefined ? '''' : String(lobValue).trim();
    if (!mountedRef.current || !claim || Number(claim.id) !== claimIdValue
      || routeClaimId() !== claimIdValue) return Promise.resolve();
    if (!lob) {
      clearEventCatalog();
      setCatalogError(''El reclamo no contiene un ramo válido para cargar eventos.'');
      return Promise.resolve();
    }
    const operationId = catalogOperationRef.current + 1;
    const requestId = requestRef.current;
    catalogOperationRef.current = operationId;
    catalogLoadingRef.current = true;
    setCatalogLoading(true);
    setCatalogError('''');
    const isCurrent = () => mountedRef.current && catalogOperationRef.current === operationId
      && requestRef.current === requestId && routeClaimId() === claimIdValue;
    return Promise.all([
      repositoryRequest(''GetFullTable'', { table: ''CustomInsuredEventsPerLob'', filter: ''1=1'' }),
      repositoryRequest(''RepoEventReasonCatalog'', catalogGetPayload()),
      repositoryRequest(''RepoInsuredEventCatalog'', catalogGetPayload())
    ]).then((results) => {
      if (!isCurrent()) return;
      const mappings = parseEventMatrix(strictOutData(results[0], ''tabla de eventos''), lob);
      if (Object.keys(mappings).length === 0) {
        clearEventCatalog();
        throw new Error(''No hay eventos configurados para el ramo del reclamo.'');
      }
      const reasonByCode = parseReasonCatalog(strictOutData(results[1], ''catálogo de razones''));
      const eventByCode = parseInsuredEventCatalog(strictOutData(results[2], ''catálogo de eventos''));
      const options = Object.keys(mappings).map((code) => {
        const reason = reasonByCode[code];
        if (!reason) throw new Error(''La tabla contiene una razón de evento desconocida.'');
        mappings[code].forEach((eventCode) => {
          const event = eventByCode[eventCode];
          if (!event) {
            throw new Error(''La tabla contiene un evento asegurado incompatible.'');
          }
        });
        return reason.disabled ? null : { value: reason.code, label: reason.name };
      }).filter(Boolean);
      if (options.length === 0) throw new Error(''No hay razones de evento activas para este ramo.'');
      const catalog = {
        lob: lob, mappings: mappings, reasonByCode: reasonByCode,
        eventByCode: eventByCode, reasonOptions: options
      };
      eventCatalogRef.current = catalog;
      applyEventCatalogToDraft(catalog, draftRef.current, claim);
    }).catch((caughtError) => {
      if (isCurrent()) {
        setCatalogError(caughtError && caughtError.message
          ? caughtError.message : ''No se pudieron cargar los catálogos de eventos.'');
      }
    }).then(() => {
      if (!isCurrent()) return;
      catalogLoadingRef.current = false;
      setCatalogLoading(false);
    });
  };

  const changeEventReason = (reasonCode) => {
    const code = typeof reasonCode === ''string'' ? reasonCode.trim() : '''';
    const selected = reasonOptionsRef.current.filter((option) => option
      && option.value === code && !option.disabled);
    const catalog = eventCatalogRef.current;
    if (selected.length !== 1 || !catalog || !draftRef.current
      || !canEdit(currentClaimRef.current) || savingRef.current || stageSavingRef.current
      || adjusterLoadingRef.current || routeClaimId() !== Number(currentClaimRef.current.id)) {
      setError(''La razón de evento seleccionada no es válida.'');
      return;
    }
    const next = Object.assign({}, draftRef.current, { eventReasonCode: code });
    const options = eventOptionsForReason(catalog, code,
      next.insuredEventCode, next.insuredEvent, claimTypeCode(currentClaimRef.current));
    const currentIsValid = options.some((option) => option.value === next.insuredEventCode
      && !option.disabled);
    if (!currentIsValid) {
      next.insuredEventCode = '''';
      next.insuredEvent = null;
      touchedRef.current.insuredEvent = true;
    }
    draftRef.current = next;
    touchedRef.current.eventReason = true;
    dirtyRef.current = true;
    setDraft(next);
    setEventOptionList(eventOptionsForReason(catalog, code,
      next.insuredEventCode, next.insuredEvent, claimTypeCode(currentClaimRef.current)));
    setError('''');
  };

  const changeInsuredEvent = (eventCode) => {
    const code = typeof eventCode === ''string'' ? eventCode.trim() : '''';
    const catalog = eventCatalogRef.current;
    const selected = eventOptionsRef.current.filter((option) => option
      && option.value === code && !option.disabled);
    const event = catalog && catalog.eventByCode[code];
    if (selected.length !== 1 || !event || event.disabled
      || event.mode !== claimTypeCode(currentClaimRef.current)
      || !draftRef.current || !canEdit(currentClaimRef.current)
      || savingRef.current || stageSavingRef.current || adjusterLoadingRef.current
      || routeClaimId() !== Number(currentClaimRef.current.id)) {
      setError(''El evento asegurado seleccionado no es válido.'');
      return;
    }
    const next = Object.assign({}, draftRef.current, {
      insuredEventCode: code,
      insuredEvent: {
        code: event.code, name: event.name, mode: event.mode,
        disabled: event.disabled, hasHealthProcedures: event.hasHealthProcedures
      }
    });
    draftRef.current = next;
    touchedRef.current.insuredEvent = true;
    dirtyRef.current = true;
    setDraft(next);
    setError('''');
  };

  const loadAdjusters = (requestedClaimId) => {
    const claim = currentClaimRef.current;
    const claimIdValue = Number(requestedClaimId);
    if (adjusterLoadingRef.current || savingRef.current || stageSavingRef.current
      || !mountedRef.current || !Number.isSafeInteger(claimIdValue) || claimIdValue <= 0
      || !claim || Number(claim.id) !== claimIdValue || routeClaimId() !== claimIdValue) {
      return Promise.resolve();
    }
    const requestId = requestRef.current;
    const isCurrent = () => mountedRef.current && requestRef.current === requestId
      && routeClaimId() === claimIdValue;
    adjusterLoadingRef.current = true;
    setAdjusterLoading(true); setError('''');
    return repositoryRequest(''LoadEntities'', {
      fields: ADJUSTER_CATALOG_FIELDS,
      entity: ''Contact'',
      filter: ADJUSTER_CATALOG_FILTER
    }).then((result) => {
      if (!isCurrent()) return;
      if (!result || result.ok === false || !Array.isArray(result.outData)) {
        throw new Error(result && result.msg ? result.msg : ''Respuesta de catálogo de ajustadores incompatible.'');
      }
      const seen = {};
      const options = result.outData.map((row) => {
        const idIsScalar = row && (typeof row.id === ''number'' || typeof row.id === ''string'');
        const numericId = idIsScalar ? Number(row.id) : NaN;
        const value = String(numericId);
        const label = row && typeof row.name === ''string'' ? row.name.trim() : '''';
        if (!row || typeof row !== ''object'' || Array.isArray(row)
          || !Number.isSafeInteger(numericId) || numericId <= 0 || label === '''' || seen[value]) {
          throw new Error(''Respuesta de catálogo de ajustadores incompatible.'');
        }
        seen[value] = true;
        return { value: value, label: label };
      });
      adjusterOptionsRef.current = options;
      setAdjusterOptions(options);
    }).catch((caughtError) => {
      if (isCurrent()) {
        setError(caughtError && caughtError.message || ''No se pudo cargar el catálogo de ajustadores.'');
      }
    }).then(() => {
      if (requestRef.current !== requestId) return;
      adjusterLoadingRef.current = false;
      if (mountedRef.current) setAdjusterLoading(false);
    });
  };

  const changeAdjuster = (contactId, contactName) => {
    const claim = currentClaimRef.current;
    const claimIdValue = claim ? Number(claim.id) : null;
    const numericId = Number(contactId);
    const idText = String(numericId);
    const requestedName = typeof contactName === ''string'' ? contactName.trim() : '''';
    const matches = adjusterOptionsRef.current.filter((option) => option && option.value === idText);
    const nameText = matches.length === 1 && matches[0].label === requestedName ? matches[0].label : '''';
    if (adjusterLoadingRef.current || savingRef.current || stageSavingRef.current
      || !mountedRef.current || !canEdit(claim) || routeClaimId() !== claimIdValue) return Promise.resolve();
    if (!Number.isSafeInteger(numericId) || numericId <= 0 || nameText === '''') {
      setError(''El ajustador no es válido.'');
      return Promise.resolve();
    }
    const requestId = requestRef.current;
    const isCurrent = () => mountedRef.current && requestRef.current === requestId
      && routeClaimId() === claimIdValue;
    adjusterLoadingRef.current = true;
    setAdjusterLoading(true); setError('''');
    return repositoryRequest(''LoadEntity'', {
      entity: ''Contact'', fields: ''email'', filter: ''id='' + idText
    }).then((result) => {
      if (!isCurrent()) return;
      const contacts = responseRows(result, ''el contacto'');
      const contact = contacts.length === 1 && contacts[0] && typeof contacts[0] === ''object''
        && !Array.isArray(contacts[0]) ? contacts[0] : null;
      const email = contact && typeof contact.email === ''string'' ? contact.email.trim() : '''';
      if (!contact || email === '''' || (contact.id !== undefined && String(contact.id) !== idText)) {
        throw new Error(''Respuesta de ajustador incompatible.'');
      }
      const next = Object.assign({}, draftRef.current, {
        assignedToName: nameText, assignedToEmail: email, assignedToCode: idText
      });
      draftRef.current = next;
      touchedRef.current.assignedTo = true;
      dirtyRef.current = true;
      setDraft(next);
      const detail = customFormsRef.current.find((form) => form.label === CLAIM_CUSTOM_SECTION);
      if (detail) {
        const values = { ajustadorName: nameText, ajustadorEmail: email, hiddenAjustador: idText };
        detail.fields.forEach((field) => {
          if (!field || !Object.prototype.hasOwnProperty.call(values, field.name)) return;
          field.userData = [values[field.name]];
          const instance = customFormInstancesRef.current[detail.key];
          const input = instance && instance.container.querySelector(''[name="'' + field.name + ''"]'');
          if (input) input.value = values[field.name];
        });
      }
    }).catch((caughtError) => {
      if (isCurrent()) {
        setError(caughtError && caughtError.message || ''No se pudo cargar el ajustador.'');
      }
    }).then(() => {
      if (requestRef.current !== requestId) return;
      adjusterLoadingRef.current = false;
      if (mountedRef.current) setAdjusterLoading(false);
    });
  };

  const refreshClaim = () => {
    if (savingRef.current || stageSavingRef.current || adjusterLoadingRef.current) return Promise.resolve();
    if (dirtyRef.current && !window.confirm(''Hay cambios sin guardar. ¿Desea descartarlos?'')) {
      return Promise.resolve();
    }
    const recoverCanceledCatalog = catalogLoadingRef.current && !eventCatalogRef.current;
    dirtyRef.current = false;
    touchedRef.current = {};
    return loadClaim(claimId).then(() => {
      if (recoverCanceledCatalog && !eventCatalogRef.current) return loadClaimCatalogs(claimId);
    });
  };

  const clearLoadedClaim = () => {
    customFormsOperationRef.current += 1;
    customFormsStatusRef.current = ''idle'';
    if (customFormCleanupRef.current) customFormCleanupRef.current();
    customFormCleanupRef.current = null;
    customFormInstancesRef.current = {};
    customFormsRef.current = [];
    setCustomForms([]);
    setCustomFormsLoading(false);
    setCustomFormsError('''');
    setActiveCustomForm('''');
    currentClaimRef.current = null;
    draftRef.current = null;
    dirtyRef.current = false;
    touchedRef.current = {};
    setClaimStageSelection(null);
    setDraft(null);
    setEditable(false);
  };

  const changeClaimStage = (stageCode) => {
    if (!isValidStageCode(stageCode)) {
      if (mountedRef.current) setError(''El estado seleccionado no es válido.'');
      return;
    }
    if (!mountedRef.current || savingRef.current || stageSavingRef.current || adjusterLoadingRef.current
      || !canEdit(currentClaimRef.current)) return;
    setClaimStageSelection(stageCode);
    setError('''');
  };

  const updateClaimStage = () => {
    const claim = currentClaimRef.current;
    const stageCode = stageSelectionRef.current;
    const savingClaimId = claim ? Number(claim.id) : null;
    if (stageSavingRef.current || savingRef.current || adjusterLoadingRef.current || !mountedRef.current
      || !canEdit(claim) || !Number.isSafeInteger(savingClaimId) || savingClaimId <= 0
      || routeClaimId() !== savingClaimId) return Promise.resolve();
    if (!isValidStageCode(stageCode)) {
      setError(''El estado seleccionado no es válido.'');
      return Promise.resolve();
    }
    if (claimStageCode(claim) === stageCode) {
      setError(''El reclamo ya tiene el estado seleccionado.'');
      return Promise.resolve();
    }
    if (dirtyRef.current) {
      setError(''Guarde o descarte los cambios antes de actualizar el estado.'');
      return Promise.resolve();
    }
    if (pendingStageConfirmationRef.current
      && pendingStageConfirmationRef.current.claimId === savingClaimId) {
      setError(''La actualización anterior está pendiente de confirmación del servidor. Refresque para verificarla.'');
      return Promise.resolve();
    }

    const operationId = stageOperationRef.current + 1;
    stageOperationRef.current = operationId;
    stageSavingRef.current = true;
    setStageSaving(true);
    setError('''');
    const requestId = requestRef.current;
    return repositoryRequest(''SetClaimStage'', { claimId: savingClaimId, stageCode: stageCode })
      .then((result) => {
        if (!mountedRef.current || routeClaimId() !== savingClaimId
          || requestRef.current !== requestId) return;
        if (!result || result.ok !== true || result.msg !== ''Stage updated''
          || result.outData !== null) {
          throw new Error(result && result.msg ? result.msg : ''No fue posible actualizar el estado.'');
        }
        pendingStageConfirmationRef.current = { claimId: savingClaimId, stageCode: stageCode };
        notifyRecordUpdated();
        return loadClaim(savingClaimId);
      })
      .catch((caughtError) => {
        if (mountedRef.current && routeClaimId() === savingClaimId
          && requestRef.current === requestId) {
          setError(caughtError && caughtError.message
            ? caughtError.message : ''No fue posible actualizar el estado.'');
        }
      })
      .then(() => {
        if (stageOperationRef.current !== operationId) return;
        stageSavingRef.current = false;
        if (mountedRef.current) setStageSaving(false);
      });
  };

  const saveClaim = () => {
    if (savingRef.current || stageSavingRef.current || adjusterLoadingRef.current
      || !mountedRef.current || !dirtyRef.current
      || !canEdit(currentClaimRef.current) || routeClaimId() !== Number(currentClaimRef.current.id)) {
      return Promise.resolve();
    }
    if (customFormsStatusRef.current !== ''ready'') {
      setActiveTab(''custom'');
      setError(customFormsStatusRef.current === ''loading'' || customFormsStatusRef.current === ''rendering''
        ? ''Espere a que terminen de cargar los formularios personalizados antes de guardar.''
        : ''Los formularios personalizados deben cargarse correctamente antes de guardar. Use Reintentar.'');
      return Promise.resolve();
    }
    try {
      collectRenderedCustomForms();
    } catch (validationError) {
      setError(validationError && validationError.message
        ? validationError.message : ''Revise los formularios personalizados.'');
      return Promise.resolve();
    }
    const recoverCanceledCatalog = catalogLoadingRef.current && !eventCatalogRef.current;
    cancelClaimantSearch();
    cancelCatalogLoad();
    savingRef.current = true;
    setSaving(true);
    setError('''');
    const savingClaimId = Number(currentClaimRef.current.id);
    const original = currentClaimRef.current;
    const savingDraft = Object.assign({}, draftRef.current);
    const touched = Object.assign({}, touchedRef.current);
    const savingForms = JSON.parse(JSON.stringify(customFormsRef.current));
    return repositoryRequest(''RepoClaim'', claimReadPayload(savingClaimId))
      .then((result) => {
        if (!mountedRef.current || routeClaimId() !== savingClaimId) {
          throw new Error(''La ruta cambió antes de guardar.'');
        }
        const fresh = responseRows(result, ''el reclamo'').find((row) =>
          row && Number(row.id) === savingClaimId);
        if (!fresh) throw new Error(''No se encontró el reclamo antes de guardar.'');
        const conflict = Object.keys(touched).some((field) =>
          JSON.stringify(touchedClaimValue(original, field))
            !== JSON.stringify(touchedClaimValue(fresh, field)));
        if (conflict) throw new Error(''El reclamo fue modificado por otra sesión. Recargue antes de guardar.'');
        return repositoryRequest(''RepoClaim'', {
          operation: ''UPDATE'',
          entity: buildUpdate(fresh, savingDraft, touched, savingForms)
        });
      })
      .then((result) => {
        if (!mountedRef.current || routeClaimId() !== savingClaimId) return;
        if (!result || result.ok !== true) {
          throw new Error(result && result.msg ? result.msg : ''No fue posible guardar el reclamo.'');
        }
        dirtyRef.current = false;
        touchedRef.current = {};
        notifyRecordUpdated();
        return loadClaim(savingClaimId);
      })
      .catch((caughtError) => {
        if (mountedRef.current && routeClaimId() === savingClaimId) {
          setError(caughtError && caughtError.message
            ? caughtError.message : ''No fue posible guardar el reclamo.'');
        }
      })
      .then(() => {
        savingRef.current = false;
        if (mountedRef.current) setSaving(false);
        if (recoverCanceledCatalog && mountedRef.current && routeClaimId() === savingClaimId
          && !eventCatalogRef.current) return loadClaimCatalogs(savingClaimId);
      });
  };

  const loadClaim = (requestedClaimId) => {
    const preserveVisibleSnapshot = currentClaimRef.current
      && Number(currentClaimRef.current.id) === requestedClaimId;
    changeClaimContext(requestedClaimId);
    cancelClaimantSearch();
    cancelCatalogLoad();
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    if (!Number.isSafeInteger(requestedClaimId) || requestedClaimId <= 0) {
      if (mountedRef.current) {
        setClaimSummary(EMPTY_SUMMARY);
        setClaimDetails(EMPTY_DETAILS);
        setLoading(false);
        setValuationWarning('''');
        clearLoadedClaim();
        setError(''Abra el reclamo desde «Ver» en Búsqueda de Reclamos. La dirección debe incluir un claimId válido.'');
      }
      return Promise.resolve();
    }

    setLoading(true);
    setError('''');
    setValuationWarning('''');

    const claimRequest = repositoryRequest(''RepoClaim'', claimReadPayload(requestedClaimId));

    return claimRequest.then((result) => {
        if (!mountedRef.current || requestId !== requestRef.current || routeClaimId() !== requestedClaimId) return;
        const claims = responseRows(result, ''el reclamo'');
        const claim = claims.find((row) => row && Number(row.id) === requestedClaimId);
        if (!claim) throw new Error(''No se encontró el reclamo solicitado.'');
        const nextDraft = createDraft(claim);
        currentClaimRef.current = claim;
        draftRef.current = nextDraft;
        dirtyRef.current = false;
        touchedRef.current = {};
        setClaimantOptionList(claimantOptionsWithCurrent(claimantOptionsRef.current, claim));
        if (eventCatalogRef.current) {
          const loadedLob = claim.Policy && claim.Policy.lob !== null
            && claim.Policy.lob !== undefined ? String(claim.Policy.lob).trim() : '''';
          if (eventCatalogRef.current.lob === loadedLob) {
            applyEventCatalogToDraft(eventCatalogRef.current, nextDraft, claim);
          } else {
            clearEventCatalog();
            setCatalogError(''Los catálogos deben recargarse para el ramo del reclamo.'');
          }
        }
        const nextStage = claimStageCode(claim);
        const pendingStage = pendingStageConfirmationRef.current;
        if (pendingStage && pendingStage.claimId === requestedClaimId) {
          if (nextStage === pendingStage.stageCode) {
            pendingStageConfirmationRef.current = null;
            setClaimStageSelection(nextStage);
          } else {
            setClaimStageSelection(pendingStage.stageCode);
            setError(''La actualización fue aceptada, pero el estado aún está pendiente de confirmación del servidor.'');
          }
        } else {
          setClaimStageSelection(nextStage);
        }
        setDraft(nextDraft);
        setEditable(canEdit(claim));
        const policy = claim.Policy || {};
        if (policy.id != null && claim.lifePolicyId != null && Number(policy.id) !== Number(claim.lifePolicyId)) {
          throw new Error(''La póliza recibida no corresponde al reclamo solicitado.'');
        }
        const nextCoverageRows = normalizeCoverageRows(claim);
        coverageRowsRef.current = nextCoverageRows;
        setCoverageRows(nextCoverageRows);
        setSelectedCoverageId((currentId) => nextCoverageRows.some((row) => row.id === Number(currentId))
          ? Number(currentId) : nextCoverageRows.length ? nextCoverageRows[0].id : null);
        const process = claim.Process || {};
        const stage = claim.Stage || {};
        const currency = typeof policy.currency === ''string'' ? policy.currency.trim().toUpperCase() : '''';
        let reserves = null;
        let payments = null;
        let warning = '''';
        if (Array.isArray(claim.Payouts) && currency) {
          const rows = claim.Payouts.filter((row) => row && Number(row.claimId) === requestedClaimId);
          const usable = rows.every((row) =>
            String(row.currency || '''').trim().toUpperCase() === currency
            && String(row.reserveType || '''').toUpperCase() === ''IN''
            && numericValue(row.reserved) !== null && numericValue(row.payed) !== null);
          if (usable) {
            // Signed movements, including reversals, reconcile the native header.
            reserves = rows.reduce((total, row) => total + numericValue(row.reserved), 0);
            payments = rows.reduce((total, row) => total + numericValue(row.payed), 0);
          } else {
            warning = ''Reservas y pagos no disponibles: hay movimientos con moneda, tipo o importe no validado. '' + warning;
          }
        } else {
          warning = ''No se recibió la valoración completa o su moneda. '' + warning;
        }

        setClaimSummary({
          policy: {
            policyNumber: policy.code,
            lineOfBusiness: policy.lob,
            year: null,
            certificateNumber: policy.certificate,
            insured: personName(claim.Contact),
            payer: personName(policy.Payer),
            branch: policy.branchCode,
            policyType: policy.policyType,
            startDate: formatDate(policy.start),
            endDate: formatDate(policy.end),
            creator: null,
            status: policy.entityState,
            modified: formatDate(policy.lastUpdate)
          },
          valuation: {
            currency: currency,
            reserves: reserves,
            payments: payments,
            recoveries: null,
            expenses: null,
            balance: null
          }
        });
        const time = occurrenceTime(claim.occurrence);
        setClaimDetails({
          claimNumber: firstValue(claim.code, claim.id),
          state: firstValue(process.entityState, stage.name, stage.code),
          claimant: personName(claim.Claimer),
          cause: firstValue(claim.EventReason && claim.EventReason.name, claim.eventReason),
          occurrence: formatDate(claim.occurrence),
          notification: formatDate(claim.notification),
          hour: time.hour, minute: time.minute, period: time.period,
          description: claim.description
        });
        setValuationWarning(warning);
        return loadCustomForms(claim);
      })
      .catch((caughtError) => {
        if (!mountedRef.current || requestId !== requestRef.current || routeClaimId() !== requestedClaimId) return;
        if (!preserveVisibleSnapshot) {
          setClaimSummary(EMPTY_SUMMARY);
          setClaimDetails(EMPTY_DETAILS);
        }
        clearLoadedClaim();
        setError(caughtError && caughtError.message
          ? caughtError.message : ''No fue posible cargar la información del reclamo.'');
      })
      .then(() => {
        if (mountedRef.current && requestId === requestRef.current) setLoading(false);
      });
  };

  const policyFieldColumns = [
    [[''Póliza'', ''policyNumber''], [''Ramo'', ''lineOfBusiness''], [''Año'', ''year''], [''Sucursal'', ''branch''], [''Nº Cert'', ''certificateNumber'']],
    [[''Asegurado'', ''insured''], [''Pagador'', ''payer''], [''Creador'', ''creator''], [''Modificado'', ''modified'']],
    [[''Fecha inicio'', ''startDate''], [''Fecha final'', ''endDate''], [''Estado'', ''status''], [''Tipo de póliza'', ''policyType'']]
  ];
  const valuationFields = [
    [''Reservas'', ''reserves''], [''Pagos'', ''payments''], [''Recuperaciones'', ''recoveries''],
    [''Gastos'', ''expenses''], [''Saldo'', ''balance'']
  ];
  const ReloadOutlinedIcon = () => (
    <span role="img" aria-label="reload" className="anticon anticon-reload">
      <svg viewBox="0 0 1024 1024" focusable="false" aria-hidden="true">
        <path d="M909.1 209.3 862.6 364a8 8 0 0 1-10.7 5.1l-147.4-60.8a8 8 0 0 1-1.6-13.8l50.5-32.3A318.8 318.8 0 0 0 512 148c-176.7 0-320 143.3-320 320s143.3 320 320 320c149.4 0 274.8-102.4 310-240.9a8 8 0 0 1 7.8-6.1h49.8a8 8 0 0 1 7.8 9.8C849.5 717.9 696 844 512 844c-207.7 0-376-168.3-376-376S304.3 92 512 92c116.6 0 220.8 53.1 289.8 136.4l35.9-23a8 8 0 0 1 11.2 3.9z" />
      </svg>
    </span>
  );

  const tabItems = [
    [''general'', ''Datos Generales''], [''custom'', ''Personalizada''], [''affected'', ''Objeto Afectado''], [''coverage'', ''Cobertura / Reservas''],
    [''payments'', ''Pagos''], [''expenses'', ''Gastos''], [''recoveries'', ''Recuperaciones''],
    [''documents'', ''Agregar Documentos''], [''comments'', ''Comentarios''], [''prints'', ''Impresiones''],
    [''deductions'', ''Deducciones'']
  ];

  const SectionTitle = ({ children, className }) => (
    <h3 className={''resumen-section-title '' + (className || '''')}>
      <span className="resumen-section-marker" aria-hidden="true" />{children}
    </h3>
  );
  const Field = ({ label, children }) => (
    <div className="resumen-form-field">
      <label className="resumen-form-label">{label}:</label>
      <div className="resumen-form-control">{children}</div>
    </div>
  );
  const disabledInput = (placeholder, value) => (
    <Input size="small" disabled value={value === null || value === undefined ? undefined : String(value)} placeholder={placeholder || ''Sin datos''} />
  );
  const disabledSelect = (placeholder, value) => (
    <Select
      size="small"
      disabled
      value={value === null || value === undefined ? undefined : String(value)}
      placeholder={placeholder || ''Seleccione''}
      options={value === null || value === undefined ? [] : [{ value: String(value), label: String(value) }]}
    />
  );
  const selectedCoverage = coverageRows.find((row) => row.id === Number(selectedCoverageId)) || null;
  const closeReservesDisabled = !editable || reserveSaving
    || !coverageRows.some((row) => row.paymentReserve !== 0 || row.expenseReserve !== 0);
  const selectedReserveHistory = currentClaimRef.current && Array.isArray(currentClaimRef.current.Payouts)
    ? currentClaimRef.current.Payouts.filter((item) => item
      && Number(item.claimId) === Number(currentClaimRef.current.id)
      && Number(item.lifeCoverageId) === Number(selectedCoverageId)
      && numericValue(item.reserved) !== null && numericValue(item.reserved) !== 0
      && [''IN'', ''EX''].indexOf(String(item.reserveType || '''').trim().toUpperCase()) !== -1)
    : [];

  React.useEffect(() => {
    mountedRef.current = true;
    const syncClaimIdFromRoute = () => {
      if (dirtyRef.current && !window.confirm(''Hay cambios sin guardar. ¿Desea descartarlos?'')) {
        window.history.replaceState(null, '''', routeRef.current);
        return;
      }
      dirtyRef.current = false;
      touchedRef.current = {};
      routeRef.current = window.location.href;
      const nextClaimId = routeClaimId();
      changeClaimContext(nextClaimId);
      setClaimId(nextClaimId);
    };
    const warnUnsaved = (event) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = '''';
    };
    window.addEventListener(''hashchange'', syncClaimIdFromRoute);
    window.addEventListener(''popstate'', syncClaimIdFromRoute);
    window.addEventListener(''beforeunload'', warnUnsaved);
    return () => {
      mountedRef.current = false;
      requestRef.current += 1;
      claimantSearchOperationRef.current += 1;
      catalogOperationRef.current += 1;
      customFormsOperationRef.current += 1;
      reserveOperationRef.current += 1;
      reserveSavingRef.current = false;
      if (customFormCleanupRef.current) customFormCleanupRef.current();
      if (claimantSearchTimerRef.current !== null) {
        window.clearTimeout(claimantSearchTimerRef.current);
        claimantSearchTimerRef.current = null;
      }
      window.removeEventListener(''hashchange'', syncClaimIdFromRoute);
      window.removeEventListener(''popstate'', syncClaimIdFromRoute);
      window.removeEventListener(''beforeunload'', warnUnsaved);
    };
  }, []);

  React.useEffect(() => {
    loadClaim(claimId).then(() => Promise.all([
      loadAdjusters(claimId), loadClaimCatalogs(claimId)
    ]));
  }, [claimId]);

  React.useEffect(() => {
    if (customFormCleanupRef.current) customFormCleanupRef.current();
    customFormCleanupRef.current = null;
    customFormInstancesRef.current = {};
    // Loading omits the form containers; initialize only after their commit.
    if (customFormsLoading || activeTab !== ''custom'' || customForms.length === 0) return undefined;
    const $ = window.jQuery || window.$;
    if (!$ || !$.fn || typeof $.fn.formRender !== ''function'') {
      setCustomFormsError(''El renderizador de formularios personalizados no está disponible.'');
      customFormsStatusRef.current = ''error'';
      return undefined;
    }
    const operationId = customFormsOperationRef.current;
    const cleanups = [];
    try {
      customForms.forEach((form) => {
        const container = document.getElementById(form.key);
        if (!container) throw new Error(''No se encontró el contenedor de '' + form.label + ''.'');
        const runtime = createScopedFormRuntime(container, operationId, window, document, $);
        const renderer = $(container).formRender({ formData: form.fields });
        customFormInstancesRef.current[form.key] = { renderer: renderer, container: container, runtime: runtime };
        let syncTimer = null;
        Array.prototype.forEach.call(container.querySelectorAll(''input,select,textarea,button''), (control) => {
          if (!editable) control.disabled = true;
        });
        const onValueChange = (event) => {
          const target = event.target;
          if (!target || !target.name) return;
          const value = target.type === ''checkbox'' ? (target.checked ? target.value || ''true'' : '''') : target.value;
          changeCustomFormValue(form.label, target.name, value);
        };
        const syncProgrammaticValues = () => {
          syncTimer = null;
          Array.prototype.forEach.call(container.querySelectorAll(''input[name],select[name],textarea[name]''), (control) => {
            const value = control.type === ''checkbox'' ? (control.checked ? control.value || ''true'' : '''') : control.value;
            const field = form.fields.find((item) => item && item.name === control.name);
            const previous = field && Array.isArray(field.userData) ? String(field.userData[0] || '''') : '''';
            if (field && previous !== String(value || '''')) changeCustomFormValue(form.label, control.name, value);
          });
        };
        const onClick = () => {
          if (syncTimer !== null) runtime.clearTimeout(syncTimer);
          syncTimer = runtime.setTimeout(syncProgrammaticValues, 0);
        };
        container.addEventListener(''input'', onValueChange);
        container.addEventListener(''change'', onValueChange);
        container.addEventListener(''click'', onClick);
        const cleanup = () => {
          if (syncTimer !== null) runtime.clearTimeout(syncTimer);
          container.removeEventListener(''input'', onValueChange);
          container.removeEventListener(''change'', onValueChange);
          container.removeEventListener(''click'', onClick);
          runtime.cleanup();
          delete customFormInstancesRef.current[form.key];
          container.innerHTML = '''';
        };
        cleanups.push(cleanup);
        executeCustomFormLogic(form.logic, runtime);
      });
      const cleanupAll = () => cleanups.splice(0).forEach((cleanup) => cleanup());
      customFormCleanupRef.current = cleanupAll;
      customFormsStatusRef.current = ''ready'';
      setCustomFormsError('''');
      return cleanupAll;
    } catch (caughtError) {
      cleanups.splice(0).forEach((cleanup) => cleanup());
      customFormsStatusRef.current = ''error'';
      setCustomFormsError(caughtError && caughtError.message
        ? caughtError.message : ''No fue posible renderizar el formulario personalizado.'');
      return undefined;
    }
  }, [activeTab, customForms, customFormsLoading, editable]);

  React.useEffect(() => {
    const style = document.createElement(''style'');
    const htmlOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    let frame = null;
    const fit = () => {
      const shell = shellRef.current;
      if (!shell) return;
      const viewport = window.innerHeight || document.documentElement.clientHeight || 0;
      const available = Math.max(0, Math.floor(viewport - Math.max(0, shell.getBoundingClientRect().top) - 8));
      shell.style.height = available + ''px'';
      shell.style.maxHeight = available + ''px'';
    };
    const scheduleFit = () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(fit);
    };

    document.documentElement.style.overflow = ''hidden'';
    document.body.style.overflow = ''hidden'';
    style.setAttribute(''data-informacion-resumen-reclamo-style'', ''true'');
    style.innerHTML = `
      .resumen-shell{--rz-ink:#1e293b;--rz-muted:#64748b;--rz-line:#e2e8f0;--rz-line-strong:#cbd5e1;--rz-page:#f4f6fa;--rz-brand:#1e4b8f;--rz-brand-dark:#15356b;--rz-brand-soft:#eaf1fb;--rz-accent:#2f6fce;--rz-good:#137a4c;--rz-warn:#9a5b12;--rz-warn-bg:#fdf3e3;--rz-warn-line:#f1d9ab;width:100%;min-height:0;padding:12px 18px 10px;box-sizing:border-box;color:var(--rz-ink);font:13px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;display:flex;flex-direction:column;overflow:hidden;background:var(--rz-page)}
      .resumen-shell *{box-sizing:border-box}
      .resumen-shell .resumen-header{display:flex;align-items:center;gap:12px;min-height:50px;flex:0 0 auto;margin-bottom:12px;padding:2px 2px 10px;border-bottom:2px solid var(--rz-brand);background:transparent}
      .resumen-shell .resumen-header-icon{width:6px;height:30px;flex:0 0 6px;border-radius:3px;background:var(--rz-brand)}
      .resumen-shell .resumen-header-icon:before,.resumen-shell .resumen-header-icon:after{content:none}
      .resumen-shell .resumen-title{margin:0;color:var(--rz-brand-dark);font-size:17px;font-weight:700;letter-spacing:-.01em;line-height:1.3}
      .resumen-shell .resumen-status{flex:0 0 auto;margin-bottom:10px}
      .resumen-shell .resumen-loading{display:flex;align-items:center;gap:8px;padding:6px 12px;color:var(--rz-brand-dark);background:var(--rz-brand-soft);border:1px solid #c7d9f2;border-radius:6px}
      .resumen-shell .resumen-recovery-warning{margin-top:6px;padding:7px 11px;color:var(--rz-warn);background:var(--rz-warn-bg);border:1px solid var(--rz-warn-line);border-radius:6px;font-size:12px}
      .resumen-shell .resumen-summary-card{flex:0 0 auto;border:1px solid var(--rz-line);border-radius:8px;box-shadow:0 1px 2px rgba(15,23,42,.04)}
      .resumen-shell .resumen-summary-card>.ant-card-body{padding:14px 16px}
      .resumen-shell .resumen-section-title{display:flex;align-items:center;gap:8px;margin:0 0 10px;color:var(--rz-brand-dark);font-size:12.5px;font-weight:700;letter-spacing:.01em;line-height:1.4}
      .resumen-shell .resumen-section-marker{width:8px;height:8px;flex:0 0 8px;border-radius:2px;background:var(--rz-accent)}
      .resumen-shell .resumen-policy{padding-right:20px}
      .resumen-shell .resumen-valuation{height:100%;padding-left:20px;border-left:1px solid var(--rz-line)}
      .resumen-shell .resumen-summary-field,.resumen-shell .resumen-valuation-row{display:flex;min-width:0;line-height:21px}
      .resumen-shell .resumen-summary-field{gap:6px;padding:2px 12px 2px 0}
      .resumen-shell .resumen-policy .resumen-summary-field{padding:1px 10px 1px 0;font-size:12.5px;line-height:19px}
      .resumen-shell .resumen-valuation .resumen-valuation-row{padding:1px 10px 1px 0;font-size:12.5px;line-height:19px}
      .resumen-shell .resumen-summary-label{flex:0 0 auto;color:var(--rz-muted);font-weight:500;white-space:nowrap}
      .resumen-shell .resumen-summary-value{min-width:0;color:var(--rz-accent);font-weight:600;overflow-wrap:anywhere}
      .resumen-shell .resumen-amount{min-width:0;color:var(--rz-ink);font-weight:600;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
      .resumen-shell .resumen-valuation-row{justify-content:space-between;gap:18px;padding:3px 0}
      .resumen-shell .resumen-amount{text-align:right;white-space:nowrap}
      .resumen-shell .resumen-balance{color:var(--rz-good);font-weight:700}
      .resumen-shell .resumen-action-icon{margin-right:5px;color:var(--rz-accent);font-weight:700}
      .resumen-shell .resumen-tabs{flex:0 0 auto;display:flex;flex-wrap:wrap;gap:2px;min-height:36px;padding:0;overflow:visible;background:transparent;border-bottom:1px solid var(--rz-line-strong)}
      .resumen-shell .resumen-tab{flex:0 0 auto;display:flex;align-items:center;justify-content:center;height:36px;padding:0 13px;white-space:nowrap;border:0;border-bottom:2px solid transparent;margin-bottom:-1px;background:transparent;color:var(--rz-muted);font-size:12.5px;font-weight:500;cursor:pointer;transition:color .15s ease,border-color .15s ease}
      .resumen-shell .resumen-tab:hover{color:var(--rz-brand-dark)}
      .resumen-shell .resumen-tab-active,.resumen-shell .resumen-tab-active:hover{color:var(--rz-brand);border-bottom-color:var(--rz-brand);font-weight:700}
      .resumen-shell .resumen-secondary{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:38px;margin-top:10px;padding:6px 12px;color:#fff;background:var(--rz-brand-dark);border-radius:8px}
      .resumen-shell .resumen-secondary-actions{display:flex;align-items:center;gap:8px;min-width:0;overflow-x:auto}
      .resumen-shell .resumen-secondary-title{padding:2px 4px;color:#fff;font-weight:700;letter-spacing:.01em}
      .resumen-shell .resumen-secondary .ant-btn{height:26px;padding:0 12px;border-radius:6px;box-shadow:none;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.3);color:#fff}
      .resumen-shell .resumen-secondary .ant-btn[disabled]{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.55)}
      .resumen-shell .resumen-secondary .anticon{display:inline-flex;align-items:center;vertical-align:-.125em}
      .resumen-shell .resumen-secondary .anticon svg{width:1em;height:1em;fill:currentColor}
      .resumen-shell .resumen-detail-card{flex:1 1 auto;min-height:0;margin-top:10px;overflow:hidden;border:1px solid var(--rz-line);border-radius:8px;box-shadow:0 1px 2px rgba(15,23,42,.04)}
      .resumen-shell .resumen-detail-card>.ant-card-body{height:100%;min-height:0;padding:16px 18px;box-sizing:border-box;display:flex;flex-direction:column;overflow:auto}
      .resumen-shell .resumen-detail-heading{flex:0 0 auto;margin-bottom:10px}
      .resumen-shell .resumen-detail-grid{flex:0 0 auto}
      .resumen-shell .resumen-detail-column:first-child{padding-right:20px;border-right:1px solid var(--rz-line)}
      .resumen-shell .resumen-detail-column:last-child{padding-left:20px}
      .resumen-shell .resumen-form-field{display:grid;grid-template-columns:150px minmax(0,1fr);align-items:center;min-width:0;min-height:32px;margin-bottom:5px}
      .resumen-shell .resumen-form-label{padding-right:10px;text-align:left;color:var(--rz-muted);font-size:12px;font-weight:500;white-space:nowrap}
      .resumen-shell .resumen-form-control{min-width:0}
      .resumen-shell .resumen-form-control>.ant-input,.resumen-shell .resumen-form-control>.ant-select,.resumen-shell .resumen-form-control>.ant-picker{width:100%}
      .resumen-shell .resumen-claimant-control>.ant-select{width:100%}
      .resumen-claimant-dropdown .ant-select-item-option-content,.resumen-claimant-dropdown .ant-select-dropdown-menu-item{white-space:normal;overflow-wrap:anywhere;line-height:1.35}
      .resumen-shell .ant-input,.resumen-shell .ant-select .ant-select-selector,.resumen-shell .ant-picker{border-radius:5px}
      .resumen-shell .ant-input:not([disabled]),.resumen-shell .ant-select:not(.ant-select-disabled) .ant-select-selector,.resumen-shell .ant-picker:not(.ant-picker-disabled){color:var(--rz-ink);background:#fff;border-color:var(--rz-line-strong)}
      .resumen-shell .ant-select:not(.ant-select-disabled) .ant-select-selection-item,.resumen-shell .ant-picker:not(.ant-picker-disabled) .ant-picker-input>input{color:var(--rz-ink)}
      .resumen-shell .ant-select:not(.ant-select-disabled) .ant-select-arrow{color:var(--rz-muted)}
      .resumen-shell .ant-input[disabled],.resumen-shell .ant-select-disabled .ant-select-selector,.resumen-shell .ant-picker-disabled{color:#7b8794!important;background:#f6f8fa!important;border-color:var(--rz-line)!important;opacity:1}
      .resumen-shell .ant-select-disabled .ant-select-selection-item,.resumen-shell .ant-picker-disabled .ant-picker-input>input{color:#7b8794!important;opacity:1}
      .resumen-shell .ant-select-disabled .ant-select-selection-placeholder,.resumen-shell .ant-select-disabled .ant-select-arrow,.resumen-shell .ant-picker-disabled .ant-picker-suffix{color:#b6bfc9!important;opacity:1}
      .resumen-shell .ant-input[disabled],.resumen-shell .ant-picker-disabled .ant-picker-input>input{-webkit-text-fill-color:#7b8794}
      .resumen-shell .ant-input[disabled]::placeholder,.resumen-shell .ant-picker-disabled .ant-picker-input>input::placeholder{color:#b6bfc9;-webkit-text-fill-color:#b6bfc9;opacity:1}
      .resumen-shell .resumen-checks{display:flex;align-items:center;gap:16px;min-height:24px}
      .resumen-shell .resumen-checks .ant-checkbox-wrapper{color:var(--rz-muted);font-size:12px}
      .resumen-shell .ant-checkbox-wrapper-disabled,.resumen-shell .ant-checkbox-disabled+span{color:#b6bfc9!important;opacity:1}
      .resumen-shell .resumen-inline{display:flex;gap:6px;min-width:0}
      .resumen-shell .resumen-inline>*{flex:1 1 0;min-width:0}
      .resumen-shell .resumen-stage-control{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;min-width:0}
      .resumen-shell .resumen-stage-control>.ant-select{width:100%}
      .resumen-shell .resumen-driver{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px}
      .resumen-shell .resumen-bottom{flex:0 0 auto;min-height:0;margin-top:14px;padding-top:14px;border-top:1px solid var(--rz-line);display:grid;grid-template-rows:auto auto;gap:10px}
      .resumen-shell .resumen-bottom-field{display:grid;grid-template-columns:190px minmax(0,1fr);min-height:0}
      .resumen-shell .resumen-bottom-field .resumen-form-label{padding-top:6px}
      .resumen-shell .resumen-bottom-field .ant-input{width:100%;max-width:720px;min-height:68px;max-height:180px;resize:vertical;overflow:auto;border-radius:5px}
      .resumen-shell .resumen-field-note{margin-top:3px;color:var(--rz-muted);font-size:11px}
      .resumen-shell .resumen-catalog-error{display:flex;align-items:center;gap:8px;margin:4px 0 8px;color:var(--rz-warn);font-size:11px}
      .resumen-shell .resumen-coverage{display:flex;flex:1 1 auto;min-height:0;flex-direction:column;gap:12px}
      .resumen-shell .resumen-coverage-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
      .resumen-shell .resumen-coverage-toolbar .ant-btn{height:28px;border-radius:6px}
      .resumen-shell .resumen-table-wrap{flex:0 0 auto;max-width:100%;overflow:auto;border:1px solid var(--rz-line);border-radius:7px;background:#fff}
      .resumen-shell .resumen-data-table{width:100%;min-width:1040px;border-collapse:collapse;font-size:12px}
      .resumen-shell .resumen-data-table th{position:sticky;top:0;z-index:1;padding:7px 9px;text-align:left;white-space:nowrap;color:var(--rz-brand-dark);background:#eef3f9;border-bottom:1px solid var(--rz-line-strong);font-weight:700}
      .resumen-shell .resumen-data-table td{padding:7px 9px;white-space:nowrap;border-bottom:1px solid var(--rz-line);font-variant-numeric:tabular-nums}
      .resumen-shell .resumen-data-table tbody tr:last-child td{border-bottom:0}
      .resumen-shell .resumen-data-table tbody tr{cursor:pointer;transition:background .15s ease}
      .resumen-shell .resumen-data-table tbody tr:hover{background:#f7faff}
      .resumen-shell .resumen-data-table .resumen-row-selected{background:var(--rz-brand-soft)}
      .resumen-shell .resumen-data-table .resumen-cell-number{text-align:right}
      .resumen-shell .resumen-empty-row{text-align:center!important;color:var(--rz-muted);padding:18px!important}
      .resumen-shell .resumen-reserve-panel{flex:0 0 auto;display:flex;justify-content:flex-end}
      .resumen-shell .resumen-reserve-actions{display:flex;gap:7px;white-space:nowrap}
      .resumen-shell .resumen-reserve-error{padding:7px 10px;color:#9f2d2d;background:#fff1f0;border:1px solid #ffccc7;border-radius:5px;font-size:12px}
      .resumen-reserve-modal .resumen-reserve-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 16px}
      .resumen-reserve-modal .resumen-reserve-input label{display:block;margin-bottom:5px;color:#60708a;font-size:12px;font-weight:600}
      .resumen-reserve-modal .resumen-reserve-input>.ant-input,.resumen-reserve-modal .resumen-reserve-input>.ant-select{width:100%}
      .resumen-reserve-modal .resumen-reserve-error{grid-column:1/-1;padding:7px 10px;color:#9f2d2d;background:#fff1f0;border:1px solid #ffccc7;border-radius:5px;font-size:12px}
      .resumen-reserve-modal .resumen-reserve-actions{grid-column:1/-1;display:flex;justify-content:flex-end;gap:8px;padding-top:4px}
      .resumen-shell .resumen-history{display:flex;flex:1 1 auto;min-height:0;flex-direction:column;gap:7px}
      .resumen-shell .resumen-history .resumen-table-wrap{flex:1 1 auto;min-height:90px}
      .resumen-shell .resumen-history .resumen-data-table{min-width:820px}
      .resumen-shell .resumen-custom{display:flex;flex:1 1 auto;min-height:180px;flex-direction:column}
      .resumen-shell .resumen-custom-tabs{display:flex;flex-wrap:wrap;gap:2px;margin-bottom:16px;border-bottom:1px solid var(--rz-line)}
      .resumen-shell .resumen-custom-form{min-height:120px;padding:2px 4px}
      .resumen-shell .resumen-custom-form .form-group{margin-bottom:12px}
      .resumen-shell .resumen-custom-form label{display:block;margin-bottom:4px;color:var(--rz-muted);font-size:12px;font-weight:500}
      .resumen-shell .resumen-custom-form input:not([type=checkbox]):not([type=radio]),.resumen-shell .resumen-custom-form select,.resumen-shell .resumen-custom-form textarea{width:100%;padding:5px 9px;color:var(--rz-ink);background:#fff;border:1px solid var(--rz-line-strong);border-radius:5px}
      .resumen-shell .resumen-custom-state{display:flex;flex:1 1 auto;align-items:center;justify-content:center;gap:8px;min-height:160px;color:var(--rz-muted)}
      .resumen-shell .resumen-inactive{flex:1 1 auto;display:flex;align-items:center;justify-content:center;min-height:180px;color:var(--rz-muted)}
      @media(max-width:1199px){.resumen-shell .resumen-form-field{grid-template-columns:125px minmax(0,1fr)}.resumen-shell .resumen-bottom-field{grid-template-columns:190px minmax(0,1fr)}}
      @media(max-width:991px){.resumen-shell{overflow:auto}.resumen-shell .resumen-policy{padding-right:0}.resumen-shell .resumen-valuation{margin-top:12px;padding:12px 0 0;border-top:1px solid var(--rz-line);border-left:0}.resumen-shell .resumen-valuation-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:24px}.resumen-shell .resumen-detail-card{flex:0 0 auto;overflow:visible}.resumen-shell .resumen-detail-card>.ant-card-body{height:auto;overflow:visible}.resumen-shell .resumen-detail-column:first-child{padding-right:0;border-right:0}.resumen-shell .resumen-detail-column:last-child{margin-top:10px;padding:12px 0 0;border-top:1px solid var(--rz-line)}.resumen-shell .resumen-bottom{min-height:190px}}
      @media(max-width:575px){.resumen-shell{padding:10px}.resumen-shell .resumen-title{font-size:16px}.resumen-shell .resumen-summary-card>.ant-card-body{padding:12px}.resumen-shell .resumen-valuation-grid{grid-template-columns:1fr}.resumen-shell .resumen-form-field,.resumen-shell .resumen-bottom-field{grid-template-columns:1fr}.resumen-shell .resumen-form-label{padding:0 0 3px;text-align:left}.resumen-shell .resumen-driver{grid-template-columns:1fr}.resumen-shell .resumen-checks{flex-wrap:wrap;gap:8px 14px}.resumen-shell .resumen-reserve-actions{flex-wrap:wrap}.resumen-reserve-modal .resumen-reserve-form{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
    scheduleFit();
    window.addEventListener(''resize'', scheduleFit);
    return () => {
      window.removeEventListener(''resize'', scheduleFit);
      if (frame !== null) window.cancelAnimationFrame(frame);
      if (style.parentNode) style.parentNode.removeChild(style);
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
    };
  }, []);

  return (
    <div ref={shellRef} className="resumen-shell">
      <header className="resumen-header">
        <span className="resumen-header-icon" aria-hidden="true" />
        <h2 className="resumen-title">Información Resumen del Reclamo</h2>
      </header>

      {(loading || error || valuationWarning) ? (
        <div className="resumen-status">
          {loading ? <div className="resumen-loading"><Spin size="small" /> Cargando información del reclamo...</div> : null}
          {error ? <Alert type="error" showIcon message={error} /> : null}
          {!loading && !error && valuationWarning
            ? <div className="resumen-recovery-warning">{valuationWarning}</div>
            : null}
        </div>
      ) : null}

      <Card className="resumen-summary-card" size="small" bordered>
        <Row gutter={0}>
          <Col xs={24} lg={19}>
            <section className="resumen-policy">
              <SectionTitle>Datos Generales de la Póliza Relacionada</SectionTitle>
              <Row gutter={[18, 4]}>{policyFieldColumns.map((fields, columnIndex) => (
                <Col xs={24} sm={12} lg={8} key={''policy-column-'' + columnIndex}>
                  {fields.map((field) => (
                    <div className="resumen-summary-field" key={field[1]}>
                      <span className="resumen-summary-label">{field[0]}:</span>
                      <span className="resumen-summary-value">{displayValue(claimSummary.policy[field[1]])}</span>
                    </div>
                  ))}
                </Col>
              ))}</Row>
            </section>
          </Col>
          <Col xs={24} lg={5}>
            <section className="resumen-valuation">
              <SectionTitle>Datos de Valoración</SectionTitle>
              <div className="resumen-valuation-grid">{valuationFields.map((field) => (
                <div className="resumen-valuation-row" key={field[1]}>
                  <span className="resumen-summary-label">{field[0]}:</span>
                  <span className={field[1] === ''balance'' ? ''resumen-amount resumen-balance'' : ''resumen-amount''}>
                    {formatAmount(claimSummary.valuation[field[1]])}
                  </span>
                </div>
              ))}</div>
            </section>
          </Col>
        </Row>
      </Card>

      <nav className="resumen-tabs" aria-label="Secciones del reclamo">
        {tabItems.map((tab) => (
          <button type="button" key={tab[0]}
            className={activeTab === tab[0] ? ''resumen-tab resumen-tab-active'' : ''resumen-tab''}
            onClick={() => setActiveTab(tab[0])}>{tab[1]}</button>
        ))}
      </nav>

      {activeTab === ''general'' || activeTab === ''custom'' ? (
        <div className="resumen-secondary">
          <div className="resumen-secondary-actions">
            <Button size="small" disabled={!editable || !dirtyRef.current || saving}
              loading={saving} onClick={saveClaim}>▣ Guardar</Button>
            <Button size="small" disabled={loading} loading={loading}
              icon={<ReloadOutlinedIcon />} onClick={refreshClaim}>Refrescar</Button>
            <Button size="small" disabled>
              <span className="resumen-action-icon" aria-hidden="true">+</span>Nuevo Reclamo
            </Button>
          </div>
          <span className="resumen-secondary-title">Siniestro No. {displayValue(claimId)}</span>
        </div>
      ) : null}

      <Card className="resumen-detail-card" size="small" bordered>
        {activeTab === ''general'' ? (
          <React.Fragment>
            <SectionTitle className="resumen-detail-heading">Datos Generales del Siniestro</SectionTitle>
            <Row className="resumen-detail-grid" gutter={0}>
              <Col xs={24} lg={12} className="resumen-detail-column">
                <Field label="Nº Siniestro">{disabledInput(''Número del siniestro'', draft ? draft.claimNumber : claimDetails.claimNumber)}</Field>
                <Field label="Asignado a"><Select size="small"
                  disabled={!editable || saving || stageSaving || adjusterLoading || !draft
                    || adjusterOptions.length === 0}
                  loading={adjusterLoading} value={draft && draft.assignedToCode ? String(draft.assignedToCode) : undefined}
                  placeholder="Seleccione un ajustador"
                  options={adjusterOptions}
                  onSelect={(value, option) => changeAdjuster(value, option && option.label)} /></Field>
                <Field label="Estado"><div className="resumen-stage-control">
                  <Select size="small" disabled={!editable || saving || stageSaving}
                    value={stageSelection || undefined} placeholder={claimDetails.state || ''Seleccione''}
                    options={CLAIM_STAGE_OPTIONS} onChange={changeClaimStage} />
                  <Button size="small" disabled={!editable || saving || stageSaving || dirtyRef.current
                    || !isValidStageCode(stageSelection)
                    || claimStageCode(currentClaimRef.current) === stageSelection}
                    loading={stageSaving} onClick={updateClaimStage}>Aplicar estado</Button>
                </div></Field>
                <div className="resumen-form-field resumen-claimant-field"><label className="resumen-form-label">Reclamante:</label>
                  <div className="resumen-form-control resumen-claimant-control"><Select size="small" showSearch filterOption={false}
                  disabled={!editable || saving || stageSaving || adjusterLoading || !draft}
                  loading={claimantSearching}
                  value={draft && draft.claimantId ? String(draft.claimantId) : undefined}
                  placeholder="Escriba para buscar reclamantes"
                  dropdownClassName="resumen-claimant-dropdown"
                  options={claimantOptions}
                  notFoundContent={claimantSearching ? ''Buscando...'' : claimantSearchError || ''Escriba para buscar''}
                  onSearch={scheduleClaimantSearch}
                  onSelect={(value, option) => changeClaimant(value, option && option.label)} />
                  {claimantHasMore ? <div className="resumen-field-note">Mostrando 10 resultados. Refine la búsqueda.</div> : null}
                </div></div>
                <Field label="Razón de evento"><Select size="small"
                  disabled={!editable || saving || stageSaving || catalogLoading || reasonOptions.length === 0}
                  loading={catalogLoading}
                  value={draft && draft.eventReasonCode || undefined}
                  placeholder="Seleccione una razón de evento"
                  options={reasonOptions} onChange={changeEventReason} /></Field>
                <Field label="Evento asegurado"><Select size="small"
                  disabled={!editable || saving || stageSaving || catalogLoading || eventOptions.length === 0}
                  loading={catalogLoading}
                  value={draft && draft.insuredEventCode || undefined}
                  placeholder="Seleccione un evento asegurado"
                  options={eventOptions} onChange={changeInsuredEvent} /></Field>
                {catalogError ? <div className="resumen-catalog-error"><span>{catalogError}</span>
                  <Button size="small" onClick={() => loadClaimCatalogs(claimId)}>Reintentar catálogos</Button></div> : null}
                <Field label="Culpable"><div className="resumen-checks"><Checkbox disabled>Culpable (no disponible)</Checkbox><Checkbox disabled>Posible Recupero (no disponible)</Checkbox></div></Field>
                <Field label="Pérdida Total"><Checkbox disabled>No disponible</Checkbox></Field>
                <Field label="Formato Tránsito">{disabledInput(''No disponible: contrato SISOS no verificado'')}</Field>
                <Field label="Conductor"><div className="resumen-driver">
                  <Input size="small" disabled placeholder="No disponible: contrato SISOS no verificado" />
                  <div className="resumen-checks"><Checkbox disabled>Asegurador (no disponible)</Checkbox><Checkbox disabled>Pagador (no disponible)</Checkbox><Checkbox disabled>Otro (no disponible)</Checkbox></div>
                </div></Field>
                <Field label="Edad del Conductor">{disabledInput(''No disponible: contrato SISOS no verificado'')}</Field>
              </Col>
              <Col xs={24} lg={12} className="resumen-detail-column">
                <Field label="Fecha del Siniestro"><Input size="small" disabled={!editable}
                  value={draft ? draft.occurrenceDate : ''''} placeholder="DD/MM/AAAA"
                  onChange={(event) => changeDraft(''occurrenceDate'', event.target.value)} /></Field>
                <Field label="Hora"><div className="resumen-inline">
                  <Select size="small" disabled={!editable} value={draft ? draft.occurrenceHour : undefined}
                    placeholder="Hora" options={Array.from({ length: 12 }, (_, index) => {
                      const value = String(index + 1).padStart(2, ''0'');
                      return { value: value, label: value };
                    })} onChange={(value) => changeDraft(''occurrenceHour'', value)} />
                  <Select size="small" disabled={!editable} value={draft ? draft.occurrenceMinute : undefined}
                    placeholder="Minuto" options={Array.from({ length: 60 }, (_, index) => {
                      const value = String(index).padStart(2, ''0'');
                      return { value: value, label: value };
                    })} onChange={(value) => changeDraft(''occurrenceMinute'', value)} />
                  <Select size="small" disabled={!editable} value={draft ? draft.occurrencePeriod : undefined}
                    placeholder="am/pm" options={[{ value: ''am'', label: ''am'' }, { value: ''pm'', label: ''pm'' }]}
                    onChange={(value) => changeDraft(''occurrencePeriod'', value)} />
                </div></Field>
                <Field label="Provincia">{disabledSelect(''Sin provincia'')}</Field>
                <Field label="Ciudad">{disabledSelect(''Sin ciudad'')}</Field>
                <Field label="Lugar">{disabledInput()}</Field>
                <Field label="Fecha de audiencia"><DatePicker size="small" disabled placeholder="DD/MM/AAAA" /></Field>
                <Field label="Lugar de audiencia">{disabledInput()}</Field>
                <Field label="Fecha de Notificación"><Input size="small" disabled={!editable}
                  value={draft ? draft.notificationDate : ''''} placeholder="DD/MM/AAAA"
                  onChange={(event) => changeDraft(''notificationDate'', event.target.value)} /></Field>
                <Field label="Fecha Vencimiento Lic."><DatePicker size="small" disabled placeholder="DD/MM/AAAA" /></Field>
                <Field label="Número de Licencia">{disabledInput()}</Field>
              </Col>
            </Row>
            <div className="resumen-bottom">
              <div className="resumen-bottom-field"><label className="resumen-form-label">Descripción del Siniestro:</label><TextArea
                rows={3}
                disabled={!editable} value={draft && draft.description != null ? String(draft.description) : ''''}
                onChange={(event) => changeDraft(''description'', event.target.value)}
                placeholder="Sin descripción" /></div>
              <div className="resumen-bottom-field"><label className="resumen-form-label">Observaciones Adicionales:</label><TextArea
                rows={3}
                disabled={!editable || !draft} value={draft ? draft.additionalObservations : ''''}
                onChange={(event) => changeDraft(''additionalObservations'', event.target.value)}
                placeholder="Sin observaciones adicionales" /></div>
            </div>
          </React.Fragment>
        ) : activeTab === ''coverage'' ? (
          <section className="resumen-coverage" aria-label="Coberturas y reservas">
            <div className="resumen-coverage-toolbar">
              <SectionTitle>Coberturas vigentes de la póliza</SectionTitle>
              <Button size="small" loading={loading} disabled={loading || reserveSaving}
                onClick={refreshClaim}><ReloadOutlinedIcon /> Refrescar</Button>
            </div>
            <div className="resumen-table-wrap">
              <table className="resumen-data-table">
                <thead><tr>
                  <th>ID</th><th>Cobertura</th><th>Desde</th><th>Hasta</th>
                  <th className="resumen-cell-number">Monto</th>
                  <th className="resumen-cell-number">Disponible</th>
                  <th className="resumen-cell-number">R. de pago</th>
                  <th className="resumen-cell-number">R. de gasto</th>
                  <th className="resumen-cell-number">Total reserva</th>
                  <th className="resumen-cell-number">Pagos</th>
                  <th className="resumen-cell-number">Gastos</th>
                </tr></thead>
                <tbody>{coverageRows.length ? coverageRows.map((row) => (
                  <tr key={row.id} tabIndex="0"
                    className={row.id === Number(selectedCoverageId) ? ''resumen-row-selected'' : ''''}
                    onClick={() => setSelectedCoverageId(row.id)}
                    onKeyDown={(event) => {
                      if (event.key === ''Enter'' || event.key === '' '') setSelectedCoverageId(row.id);
                    }}>
                    <td>{row.id}</td><td>{row.name}</td><td>{displayValue(row.start)}</td><td>{displayValue(row.end)}</td>
                    <td className="resumen-cell-number">{formatAmount(row.limit)}</td>
                    <td className="resumen-cell-number">{formatAmount(row.available)}</td>
                    <td className="resumen-cell-number">{formatAmount(row.paymentReserve)}</td>
                    <td className="resumen-cell-number">{formatAmount(row.expenseReserve)}</td>
                    <td className="resumen-cell-number">{formatAmount(row.totalReserve)}</td>
                    <td className="resumen-cell-number">{formatAmount(row.payments)}</td>
                    <td className="resumen-cell-number">{formatAmount(row.expenses)}</td>
                  </tr>
                )) : <tr><td className="resumen-empty-row" colSpan="11">No hay coberturas disponibles para este reclamo.</td></tr>}</tbody>
              </table>
            </div>

            <div className="resumen-reserve-panel">
              <div className="resumen-reserve-actions">
                <Button size="small" type="primary"
                  disabled={!editable || reserveSaving || !selectedCoverage}
                  onClick={() => {
                    setReserveError('''');
                    setReserveModalOpen(true);
                  }}>Registrar reserva</Button>
                <Popconfirm
                  title="¿Está seguro que desea cerrar todas las reservas del reclamo?"
                  okText="Aceptar" cancelText="Cancelar"
                  placement="topRight"
                  disabled={closeReservesDisabled}
                  onConfirm={() => closeClaimReserves(true)}>
                  <Button size="small" danger loading={reserveSaving}
                    disabled={closeReservesDisabled}>
                    Cerrar reservas
                  </Button>
                </Popconfirm>
              </div>
            </div>
            {!reserveModalOpen && reserveError ? <div className="resumen-reserve-error">{reserveError}</div> : null}

            <Modal title="Registrar reserva"
              visible={reserveModalOpen}
              footer={null}
              destroyOnClose
              maskClosable={!reserveSaving}
              closable={!reserveSaving}
              wrapClassName="resumen-reserve-modal"
              onCancel={() => {
                if (!reserveSaving) setReserveModalOpen(false);
              }}>
              <div className="resumen-reserve-form">
                <div className="resumen-reserve-input"><label>Movimiento</label><Select size="small"
                  disabled={!editable || reserveSaving || !selectedCoverage}
                  value={reserveDirection} options={[
                    { value: ''INCREASE'', label: ''Aumentar reserva'' },
                    { value: ''DECREASE'', label: ''Disminuir reserva'' }
                  ]} onChange={setReserveDirection} /></div>
                <div className="resumen-reserve-input"><label>Tipo de reserva</label><Select size="small"
                  disabled={!editable || reserveSaving || !selectedCoverage}
                  value={reserveType} options={[
                    { value: ''IN'', label: ''Reserva para pago'' }, { value: ''EX'', label: ''Reserva para gasto'' }
                  ]} onChange={setReserveType} /></div>
                <div className="resumen-reserve-input"><label>Monto</label><Input size="small" type="number"
                  min="0.01" step="0.01" disabled={!editable || reserveSaving || !selectedCoverage}
                  value={reserveAmount} onChange={(event) => setReserveAmount(event.target.value)} /></div>
                <div className="resumen-reserve-input"><label>Concepto</label><Input size="small"
                  maxLength={250} disabled={!editable || reserveSaving || !selectedCoverage}
                  value={reserveConcept} onChange={(event) => setReserveConcept(event.target.value)} /></div>
                {reserveError ? <div className="resumen-reserve-error">{reserveError}</div> : null}
                <div className="resumen-reserve-actions">
                  <Button size="small" disabled={reserveSaving}
                    onClick={() => setReserveModalOpen(false)}>Cancelar</Button>
                  <Button size="small" type="primary" loading={reserveSaving}
                    disabled={!editable || reserveSaving || !selectedCoverage}
                    onClick={submitReserveMovement}>Registrar</Button>
                </div>
              </div>
            </Modal>

            <div className="resumen-history">
              <SectionTitle>Detalle de reservas{selectedCoverage ? '' — '' + selectedCoverage.name : ''''}</SectionTitle>
              <div className="resumen-table-wrap"><table className="resumen-data-table">
                <thead><tr><th>No. reserva</th><th>Fecha</th><th>Movimiento</th><th>Tipo</th>
                  <th className="resumen-cell-number">Monto</th><th>Concepto</th><th>Creador</th><th>Estado</th></tr></thead>
                <tbody>{selectedReserveHistory.length ? selectedReserveHistory.map((item, index) => {
                  const signed = numericValue(item.reserved) || 0;
                  return <tr key={item.id || ''reserve-'' + index}>
                    <td>{displayValue(item.id)}</td><td>{displayValue(formatDate(item.date))}</td>
                    <td>{signed < 0 ? ''Disminución'' : ''Aumento''}</td>
                    <td>{String(item.reserveType || '''').toUpperCase() === ''EX'' ? ''Gasto'' : ''Pago''}</td>
                    <td className="resumen-cell-number">{formatAmount(signed)}</td>
                    <td>{displayValue(item.concept)}</td><td>{displayValue(item.user)}</td>
                    <td>{Number(item.status) === 2 ? ''Cerrada'' : ''Activa''}</td>
                  </tr>;
                }) : <tr><td className="resumen-empty-row" colSpan="8">
                  {selectedCoverage ? ''La cobertura seleccionada no tiene reservas.'' : ''Seleccione una cobertura.''}
                </td></tr>}</tbody>
              </table></div>
            </div>
          </section>
        ) : activeTab === ''custom'' ? (
          <section className="resumen-custom" aria-label="Formularios personalizados">
            {customFormsLoading ? <div className="resumen-custom-state"><Spin size="small" /> Cargando formularios personalizados...</div> : null}
            {!customFormsLoading && customFormsError ? <div className="resumen-custom-state"><Alert type="error" showIcon
              message={customFormsError} action={<Button size="small" onClick={() => loadCustomForms(currentClaimRef.current)}>Reintentar</Button>} /></div> : null}
            {!customFormsLoading && !customFormsError && customForms.length === 0
              ? <div className="resumen-custom-state">No hay formularios personalizados configurados para este reclamo.</div> : null}
            {!customFormsLoading && !customFormsError && customForms.length ? <React.Fragment>
              <nav className="resumen-custom-tabs" aria-label="Formularios configurados">
                {customForms.map((form) => <button type="button" key={form.key}
                  className={activeCustomForm === form.key ? ''resumen-tab resumen-tab-active'' : ''resumen-tab''}
                  onClick={() => setActiveCustomForm(form.key)}>{form.label}</button>)}
              </nav>
              {customForms.map((form) => <form key={form.key} id={form.key}
                style={{ display: activeCustomForm === form.key ? ''block'' : ''none'' }}
                className="resumen-custom-form" noValidate={false} />)}
            </React.Fragment> : null}
          </section>
        ) : <div className="resumen-inactive">El contenido de esta sección se integrará en una etapa posterior.</div>}
      </Card>
    </div>
  );
}
', NULL, NULL, 0);

    INSERT INTO dbo.LiveView (id, name, code, category, operation, multiComponent) VALUES (49, N'viewAXX341MarcasModelos', N'/**
 * @author Global Development Team
 * @created 2026/09/08
 * @name viewAXX341MarcasModelos
 * @version 1.0
 * @purpose: Manage the consultation, filtering, creation, editing, and export of vehicle brands and models.
 */
() => {
 const {useState,useEffect,useRef}=React;
 const {Tabs,Table,Button,Drawer,Modal,Input,Select,Checkbox,Space,Alert,Typography,message}=A;
 const ActionIcon=({label,children})=><span role="img" aria-label={label} className="anticon axx341-action-icon"><svg viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill="currentColor" aria-hidden="true">{children}</svg></span>;
 const SearchIcon=()=> <ActionIcon label="search"><path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-166.8-135.2-302-302-302S108 245.2 108 412s135.2 302 302 302c67 0 130.6-21.8 182.8-62l259.7 259.7a8 8 0 0 0 11.3 0l45.8-45.7a8 8 0 0 0 0-11.5zM410 634c-122.6 0-222-99.4-222-222s99.4-222 222-222 222 99.4 222 222-99.4 222-222 222z"/></ActionIcon>;
 const PlusIcon=()=> <ActionIcon label="new"><path d="M480 160h64v320h320v64H544v320h-64V544H160v-64h320V160z"/></ActionIcon>;
 const ExportIcon=()=> <ActionIcon label="export"><path d="M472 128h80v384h128L512 704 344 512h128V128zM160 800h704v80H160z"/></ActionIcon>;
 const [tab,setTab]=useState(''brands''),[brand,setBrand]=useState(null);
 const [rows,setRows]=useState([]),[lobs,setLobs]=useState([]),[loading,setLoading]=useState(false),[error,setError]=useState('''');
 const empty={text:'''',lob:'''',active:false};
 const [filters,setFilters]=useState({brands:{...empty},models:{...empty}}),[draft,setDraft]=useState({...empty}),[drawer,setDrawer]=useState(false);
 const [edit,setEdit]=useState(null),[values,setValues]=useState([]),[modal,setModal]=useState(false),[saving,setSaving]=useState(false),[saveError,setSaveError]=useState('''');
 const [height,setHeight]=useState(500),[bodyHeight,setBodyHeight]=useState(280);
 const root=useRef(null),sequence=useRef(0),xlsxLibraryPromiseRef=useRef(null);
 const key=(r,k=tab)=>JSON.stringify(r.slice(0,k===''brands''?2:3).map(String));
 const api=(request)=>exe(''ExeChain'',{chain:''cmdAXX341MarcasModelos'',context:JSON.stringify({request})}).then(r=>{if(!r.ok)throw new Error(r.msg||t(''No se pudo completar la operación''));if(!r.outData||!r.outData.ok)throw new Error(r.outData&&r.outData.msg||t(''No se pudo completar la operación''));return r.outData;});
 const load=(which=tab,filter=filters[which],selected=brand)=>{
  const ticket=++sequence.current;
  setRows([]);setError('''');
  if(which===''models''&&!selected){setLoading(false);return Promise.resolve();}
  setLoading(true);
  return api({action:''list'',kind:which,filter,brand:selected?selected.slice(0,2):null}).then(data=>{
   if(ticket!==sequence.current)return;
   setRows(data.rows);setLobs(data.lobs);
   if(which===''brands''&&selected){const retained=data.rows.find(r=>key(r,''brands'')===key(selected,''brands''));setBrand(retained||null);}
  }).catch(e=>{if(ticket===sequence.current)setError(String(e.message||e));}).finally(()=>{if(ticket===sequence.current)setLoading(false);});
 };
 useEffect(()=>{load();return () => {sequence.current++;};},[]);
 useEffect(()=>{
  const measure=()=>{
   if(!root.current)return;
   const element=root.current;let parent=element.parentElement;
   while(parent&&parent!==document.body&&!/auto|scroll/.test(getComputedStyle(parent).overflowY))parent=parent.parentElement;
   const rect=element.getBoundingClientRect();
   const bound=parent&&parent!==document.body?parent.getBoundingClientRect():{top:0,bottom:window.innerHeight};
   const offset=rect.top-bound.top+(parent&&parent!==document.body?parent.scrollTop:0);
   const h=Math.max(180,Math.min(window.innerHeight,bound.bottom)-bound.top-offset-16);
   setHeight(h);
   const pane=element.querySelector(''.ant-tabs-tabpane-active'');
   const body=pane&&pane.querySelector(''.ant-table-body'');
   const pagination=pane&&pane.querySelector(''.ant-pagination'');
   if(body)setBodyHeight(Math.max(80,h-(body.getBoundingClientRect().top-rect.top)-(pagination?pagination.getBoundingClientRect().height:32)-32));
  };
  const timeout=setTimeout(measure,50),later=setTimeout(measure,250);
  window.addEventListener(''resize'',measure);
  const observer=typeof ResizeObserver!==''undefined''?new ResizeObserver(measure):null;
  if(observer&&root.current&&root.current.parentElement)observer.observe(root.current.parentElement);
  return () => {clearTimeout(timeout);clearTimeout(later);window.removeEventListener(''resize'',measure);if(observer)observer.disconnect();};
 },[tab,rows.length,error]);
 const switchTab=(k)=>{if(k===''models''&&!brand)return;setTab(k);setDrawer(false);setModal(false);load(k,filters[k],brand);};
 const choose=(r)=>{if(!brand||key(r,''brands'')!==key(brand,''brands''))setFilters(f=>({...f,models:{...empty}}));setBrand(r);};
 const openModal=(row)=>{setEdit(row||null);setValues(row?row.map(String):tab===''brands''?['''','''','''',''1'',''0'']:[String(brand[0]),String(brand[1]),'''','''',''1'',''0'']);setSaveError('''');setModal(true);};
 const save=()=>{
  const row=values.slice();
  if(tab===''brands''&&String(row[0]==null?'''':row[0]).trim()===''''){
   setSaveError(t(''Seleccione un ramo antes de guardar la marca''));return;
  }
  if(String(row[1]==null?'''':row[1]).trim()===''''){
   setSaveError(t(''Ingrese el código antes de guardar el registro''));return;
  }
  if(tab===''brands''&&String(row[4]==null?'''':row[4]).trim()==='''')row[4]=0;
  const integerIndexes=tab===''brands''?[0,1,4]:[0,1,2,5];
  const invalidInteger=integerIndexes.some(index=>{
   const value=String(row[index]==null?'''':row[index]).trim();
   if(value==='''')return false;
   if(!/^\d+$/.test(value))return true;
   row[index]=Number(value);
   return false;
  });
  if(invalidInteger){setSaveError(t(''Los códigos y el ranking deben ser enteros no negativos''));return;}
  setSaving(true);setSaveError('''');
  api({action:''save'',kind:tab,brand:brand?brand.slice(0,2):null,row,original:edit}).then(()=>{setModal(false);message.success(t(''Registro guardado''));return load();}).catch(e=>setSaveError(String(e.message||e))).finally(()=>setSaving(false));
 };
 const labels=tab===''brands''?[''Ramo'',''Código de marca'',''Marca'',''Vigente'',''Ranking'']:[''Ramo'',''Marca'',''Código de modelo'',''Modelo'',''Vigente'',''Categoría (código)''];
 const display=(row,i)=>{
  if(i===0){const l=lobs.find(x=>String(x.code)===String(row[0]));return l&&l.name?l.name+'' (''+row[0]+'')'':String(row[0]);}
  if(tab===''models''&&i===1)return String(brand&&brand[2]||'''')+'' (''+row[1]+'')'';
  if(i===(tab===''brands''?3:4))return t(String(row[i])===''1''?''Si'':''No'');
  return String(row[i]==null?'''':row[i]);
 };
 const isUsableXlsxLibrary=(xlsxLibrary)=>Boolean(xlsxLibrary
  && typeof xlsxLibrary.writeFile===''function''
  && xlsxLibrary.utils
  && typeof xlsxLibrary.utils.aoa_to_sheet===''function''
  && typeof xlsxLibrary.utils.book_new===''function''
  && typeof xlsxLibrary.utils.book_append_sheet===''function'');
 const availableXlsxLibrary=()=>{
  const runtimeLibraries=typeof libs!==''undefined''&&libs?libs:{};
  const globalLibrary=typeof XLSX!==''undefined''?XLSX:(typeof window!==''undefined''?window.XLSX:null);
  return [runtimeLibraries.XLSX,runtimeLibraries.xlsx,runtimeLibraries.xlsxJs,globalLibrary].find(isUsableXlsxLibrary)||null;
 };
 const ensureXlsxLibrary=()=>{
  const availableLibrary=availableXlsxLibrary();
  if(availableLibrary)return Promise.resolve(availableLibrary);
  if(xlsxLibraryPromiseRef.current)return xlsxLibraryPromiseRef.current;
  xlsxLibraryPromiseRef.current=exe(''ExeChain'',{chain:''cmdLoadLibrariesGroupedBordereau'',context:''{}''}).then(response=>{
   if(!response||response.ok===false)throw new Error(response&&response.msg?response.msg:t(''No se pudo cargar el componente de Excel.''));
   const loadedLibraries=response.outData||{};
   const loadedXlsx=loadedLibraries.XLSX||loadedLibraries.xlsx||loadedLibraries.xlsxJs;
   let evaluatedXlsx=null;
   if(typeof loadedXlsx===''string''){
    const evaluatedResult=eval(loadedXlsx);
    const evaluatedGlobal=typeof XLSX!==''undefined''?XLSX:null;
    evaluatedXlsx=isUsableXlsxLibrary(evaluatedGlobal)?evaluatedGlobal:evaluatedResult;
   }else if(loadedXlsx&&typeof window!==''undefined'')window.XLSX=loadedXlsx;
   const hydratedLibrary=availableXlsxLibrary()||(loadedXlsx&&typeof loadedXlsx!==''string''?loadedXlsx:null)||evaluatedXlsx;
   if(!isUsableXlsxLibrary(hydratedLibrary))throw new Error(t(''El componente de Excel no está disponible.''));
   if(typeof window!==''undefined''&&!window.XLSX)window.XLSX=hydratedLibrary;
   return hydratedLibrary;
  }).then(xlsxLibrary=>{xlsxLibraryPromiseRef.current=null;return xlsxLibrary;}).catch(error=>{xlsxLibraryPromiseRef.current=null;throw error;});
  return xlsxLibraryPromiseRef.current;
 };
 const exportAll=()=>{
  setLoading(true);
  Promise.all([api({action:''list'',kind:tab,filter:filters[tab],brand:brand?brand.slice(0,2):null}),ensureXlsxLibrary()]).then(([data,xlsxLibrary])=>{
   const rows=[labels.map(label=>t(label))].concat(data.rows.map(r=>labels.map((_,i)=>display(r,i))));
   const worksheet=xlsxLibrary.utils.aoa_to_sheet(rows);
   const workbook=xlsxLibrary.utils.book_new();
   xlsxLibrary.utils.book_append_sheet(workbook,worksheet,tab===''brands''?t(''Marcas''):t(''Modelos''));
   xlsxLibrary.writeFile(workbook,(tab===''brands''?''Marcas'':''Modelos'')+''.xlsx'',{bookType:''xlsx'',compression:true});
  }).catch(e=>setError(String(e.message||e))).finally(()=>setLoading(false));
 };
 if (/No tiene permisos|Unauthorized/i.test(error)) return <Alert type="error" message={t(error)} showIcon/>;
 const cols=labels.map((label,i)=>({title:t(label),key:String(i),width:i===(tab===''brands''?2:3)?240:160,render:(_,r)=>display(r,i)})).concat([{title:t(''Acciones''),key:''actions'',width:100,render:(_,r)=><Button type="link" onClick={()=>openModal(r)}>{t(''Editar'')}</Button>}]);
 const content=<div className="axx341-marcas-modelos-tab-content">
  <div className="axx341-marcas-modelos-toolbar">
   <Space wrap>
    <Button type="primary" onClick={()=>{setDraft({...filters[tab]});setDrawer(true);}} icon={<SearchIcon/>}>{t(''Filtrar'')}</Button>
    <Button type="primary" disabled={tab===''models''&&!brand} onClick={()=>openModal(null)} icon={<PlusIcon/>}>{t(tab===''brands''?''Nueva Marca'':''Nuevo Modelo'')}</Button>
    <Button className="axx341-export-button" disabled={!rows.length||loading} onClick={exportAll} icon={<ExportIcon/>}>{t(''Exportar'')}</Button>
    {tab===''models''&&brand&&<Typography.Text className="axx341-selected-brand">{t(''Marca'')+'': ''+brand[2]}</Typography.Text>}
   </Space>
  </div>
  {error&&<Alert type="error" message={t(error)} showIcon className="axx341-error"/>}
  <div className="axx341-marcas-modelos-grid">
   <Table className="axx341-marcas-modelos-table" size="small" loading={loading} columns={cols} dataSource={rows} rowKey={r=>key(r)} scroll={{x:labels.length*160+180,y:bodyHeight}} pagination={{pageSize:25,showSizeChanger:false}} locale={{emptyText:t(''Sin resultados'')}} rowSelection={tab===''brands''?{type:''radio'',selectedRowKeys:brand?[key(brand,''brands'')]:[],onSelect:choose}:undefined} onRow={r=>({onClick:()=>{if(tab===''brands'')choose(r);}})}/>
  </div>
 </div>;
 return <div ref={root} className="axx341-marcas-modelos-view" style={{height}}>
  <style>{`
   .axx341-marcas-modelos-view{display:flex;flex-direction:column;min-height:0;box-sizing:border-box;overflow:hidden;padding:12px;background:#fff;color:#1f1f1f;font-size:13px;}
   .axx341-marcas-modelos-header{display:flex!important;align-items:center;justify-content:space-between;gap:16px;flex:0 0 auto;min-height:58px;margin-bottom:10px;padding:10px 14px;border:1px solid #cbd1d8;background:#fff;box-sizing:border-box;}
   .axx341-marcas-modelos-header-content{display:block;min-width:0;}
   .axx341-marcas-modelos-title{display:flex;align-items:center;gap:8px;color:#1f1f1f!important;font-size:16px;line-height:24px;font-weight:600;}
   .axx341-marcas-modelos-title-mark{width:8px;height:22px;border-radius:2px;background:#1677ff;flex:0 0 auto;}
   .axx341-marcas-modelos-kicker{margin-bottom:1px;color:#1677ff!important;font-size:12px;line-height:18px;font-weight:600;text-transform:uppercase;letter-spacing:.25px;}
   .axx341-marcas-modelos-purpose{margin:2px 0 0 16px;color:#595959!important;font-size:12px;line-height:18px;}
   .axx341-marcas-modelos-context{flex:0 0 auto;padding:4px 8px;border:1px solid #91caff;background:#e6f4ff;color:#174f7c;font-size:12px;line-height:18px;}
   .axx341-marcas-modelos-tabs{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;}
   .axx341-marcas-modelos-tabs>.ant-tabs-nav{flex:0 0 auto;margin:0;background:#e6f4ff;border-bottom:1px solid #91caff;}
   .axx341-marcas-modelos-tabs.ant-tabs-card>.ant-tabs-nav .ant-tabs-tab{height:30px;margin:0 2px 0 0!important;padding:0 11px;background:#f0f5ff;border:1px solid #91caff!important;border-radius:4px 4px 0 0!important;color:#245b9e;font-size:12px;font-weight:400;}
   .axx341-marcas-modelos-tabs.ant-tabs-card>.ant-tabs-nav .ant-tabs-tab:hover{background:#e6f4ff;color:#0b3f7d;}
   .axx341-marcas-modelos-tabs.ant-tabs-card>.ant-tabs-nav .ant-tabs-tab-active{background:#fff;border-bottom-color:#fff!important;}
   .axx341-marcas-modelos-tabs.ant-tabs-card>.ant-tabs-nav .ant-tabs-tab-active .ant-tabs-tab-btn{color:#0b3f7d;font-weight:600;}
   .axx341-marcas-modelos-tabs>.ant-tabs-content-holder{flex:1 1 auto;min-height:0;display:flex;}
   .axx341-marcas-modelos-tabs .ant-tabs-content,.axx341-marcas-modelos-tabs .ant-tabs-tabpane{min-height:0;display:flex;flex:1 1 auto;flex-direction:column;}
   .axx341-marcas-modelos-tab-content{min-height:0;display:flex;flex:1 1 auto;flex-direction:column;gap:8px;}
   .axx341-marcas-modelos-toolbar{display:flex;align-items:center;flex:0 0 auto;min-height:42px;margin:0;padding:4px 0;background:transparent;border:1px solid #e6ebf2;border-radius:6px;}
   .axx341-marcas-modelos-toolbar>.ant-space{margin-left:4px;margin-right:4px;}
   .axx341-marcas-modelos-toolbar .ant-btn{border-color:#8f9aa7;}
   .axx341-marcas-modelos-toolbar .ant-btn:disabled{border-color:#6f7b88;opacity:1;}
   .axx341-marcas-modelos-toolbar .axx341-export-button{background:#60b13d;border-color:#4f9336;color:#fff;}
   .axx341-marcas-modelos-toolbar .axx341-export-button:hover,.axx341-marcas-modelos-toolbar .axx341-export-button:focus{background:#4f9336;border-color:#3f7d2c;color:#fff;}
   .axx341-action-icon{font-size:14px;vertical-align:-.12em;}
   .axx341-selected-brand{padding-left:4px;color:#174f7c;}
   .axx341-error{flex:0 0 auto;margin:0;}
   .axx341-marcas-modelos-grid{display:flex;flex:1 1 auto;min-height:0;flex-direction:column;overflow:hidden;}
   .axx341-marcas-modelos-grid .ant-table-wrapper,.axx341-marcas-modelos-grid .ant-spin-nested-loading,.axx341-marcas-modelos-grid .ant-spin-container,.axx341-marcas-modelos-grid .ant-table,.axx341-marcas-modelos-grid .ant-table-container{display:flex;flex:1 1 auto;min-height:0;height:100%;flex-direction:column;overflow:hidden;}
   .axx341-marcas-modelos-grid .ant-table-header{flex:0 0 auto;position:relative;z-index:2;height:auto!important;min-height:30px;overflow:hidden!important;background:#fafafa!important;}
   .axx341-marcas-modelos-table .ant-table-thead>tr{height:30px;}
   .axx341-marcas-modelos-grid .ant-table-body{flex:1 1 auto;min-height:0;max-height:none!important;overflow:auto!important;scrollbar-gutter:stable;}
   .axx341-marcas-modelos-table .ant-table-container{border:1px solid #cbd1d8;}
   .axx341-marcas-modelos-table .ant-table-thead>tr>th{height:30px;box-sizing:border-box;vertical-align:middle;background:#bfbfbf!important;border-right:1px solid #cbd1d8!important;border-bottom:1px solid #cbd1d8!important;padding:5px 8px!important;font-size:12px;line-height:18px;}
   .axx341-marcas-modelos-table .ant-table-tbody>tr>td{border-right:0!important;border-bottom:1px solid #cbd1d8!important;padding:5px 8px!important;font-size:12px;line-height:18px;}
   .axx341-marcas-modelos-table .ant-table-tbody>tr{height:29px;}
   .axx341-marcas-modelos-table .ant-table-tbody>tr>td{height:29px;box-sizing:border-box;vertical-align:middle;}
   .axx341-marcas-modelos-table .ant-table-tbody .ant-btn-link{height:20px;min-height:20px;padding:0 4px;line-height:18px;}
   .axx341-marcas-modelos-table .ant-table-tbody .ant-radio-wrapper{line-height:18px;}
   .axx341-marcas-modelos-table .ant-table-tbody>tr:hover>td{background:#b7d7ff!important;}
   .axx341-marcas-modelos-table .ant-table-tbody>tr.ant-table-row-selected>td{background:#86b4ff!important;}
   .axx341-marcas-modelos-table .ant-pagination{flex:0 0 auto;margin:8px 0 0!important;}
   .axx341-marcas-modelos-table .ant-table-row{cursor:pointer;}
   .axx341-marcas-modelos-view .ant-drawer-content,.axx341-marcas-modelos-view .ant-modal-content{border:1px solid #cbd1d8;}
   .axx341-marcas-modelos-view .ant-drawer-header,.axx341-marcas-modelos-view .ant-modal-header{background:#bfbfbf;border-bottom:1px solid #cbd1d8;}
   .axx341-marcas-modelos-view .ant-drawer-body,.axx341-marcas-modelos-view .ant-modal-body{font-size:13px;}
  `}</style>
  <div className="axx341-marcas-modelos-header">
   <div className="axx341-marcas-modelos-header-content"><div className="axx341-marcas-modelos-kicker">{t(''Catálogos'')}</div><div className="axx341-marcas-modelos-title"><span className="axx341-marcas-modelos-title-mark" aria-hidden="true" />{t(''Marcas y modelos'')}</div><div className="axx341-marcas-modelos-purpose">{t(''Consulta, filtrado y administración del catálogo de marcas y modelos de vehículos.'')}</div></div>
   <div className="axx341-marcas-modelos-context">{t(tab===''brands''?''Catálogo de marcas'':''Catálogo de modelos'')}</div>
  </div>
  <Tabs className="axx341-marcas-modelos-tabs" type="card" activeKey={tab} onChange={switchTab} destroyInactiveTabPane>
   <Tabs.TabPane tab={t(''Marcas'')} key="brands">{tab===''brands''&&content}</Tabs.TabPane>
   <Tabs.TabPane tab={t(''Modelos'')} key="models" disabled={!brand}>{tab===''models''&&content}</Tabs.TabPane>
  </Tabs>
  <Drawer className="axx341-marcas-modelos-drawer" title={t(''Filtrar'')} visible={drawer} onClose={()=>setDrawer(false)} width={Math.min(380,window.innerWidth)}>
   {tab===''brands''&&<div style={{marginBottom:16}}><label>{t(''Ramo'')}</label><Select allowClear showSearch optionFilterProp="children" style={{width:''100%''}} value={draft.lob||undefined} onChange={v=>setDraft({...draft,lob:v||''''})}>{lobs.map(l=><Select.Option key={l.code} value={String(l.code)}>{l.name||l.code}</Select.Option>)}</Select></div>}
   <label>{t(tab===''brands''?''Marca'':''Modelo'')}</label><Input value={draft.text} onChange={e=>setDraft({...draft,text:e.target.value})}/>
   <Checkbox style={{margin:''16px 0''}} checked={draft.active} onChange={e=>setDraft({...draft,active:e.target.checked})}>{t(tab===''brands''?''Vigentes'':''Vigente'')}</Checkbox>
   <Space wrap><Button type="primary" onClick={()=>{setFilters({...filters,[tab]:{...draft}});setDrawer(false);load(tab,draft,brand);}}>{t(''Buscar'')}</Button><Button onClick={()=>{setDraft({...empty});setFilters({...filters,[tab]:{...empty}});setDrawer(false);load(tab,empty,brand);}}>{t(''Limpiar filtros'')}</Button></Space>
  </Drawer>
  <Modal className="axx341-marcas-modelos-modal" title={t(edit?''Editar'':tab===''brands''?''Nueva Marca'':''Nuevo Modelo'')} visible={modal} onCancel={()=>{if(!saving)setModal(false);}} onOk={save} confirmLoading={saving} okText={t(''Guardar'')} cancelText={t(''Cancelar'')} destroyOnClose>
   {saveError&&<Alert type="error" message={t(saveError)} showIcon style={{marginBottom:12}}/>}
   {labels.map((label,i)=>{
    const fixed=!!edit&&i<(tab===''brands''?2:3)||tab===''models''&&i<2;
    const change=v=>setValues(old=>old.map((x,j)=>j===i?v:x));
    return <div key={i} style={{marginBottom:14}}><label>{t(label)}</label>{i===(tab===''brands''?3:4)?<Select style={{width:''100%''}} value={values[i]} onChange={change}><Select.Option value="1">{t(''Si'')}</Select.Option><Select.Option value="0">{t(''No'')}</Select.Option></Select>:i===0?<Select style={{width:''100%''}} disabled={fixed} value={values[i]||undefined} onChange={change}>{lobs.map(l=><Select.Option key={l.code} value={String(l.code)}>{l.name||l.code}</Select.Option>)}</Select>:<Input disabled={fixed} value={tab===''models''&&i===1?String(brand&&brand[2]||'''')+'' (''+values[i]+'')'':values[i]||''''} onChange={e=>change(e.target.value)}/>}</div>;
   })}
  </Modal>
 </div>;
}
', N'CATALOGOS', N'Maestro de marcas y modelos', 0);

    INSERT INTO dbo.LiveView (id, name, code, category, operation, multiComponent) VALUES (50, N'RiskClassCatalog', N'/**
 * @author aiden_sa_3
 * @created 2026-09-08
 * @summary Mantenimiento de clases de riesgo (Fianzas). Catalogo nativo RiskClassCatalog:
 *          id (identity) = cclaries del requerimiento, name = xdescripcion_l.
 * @name RiskClassCatalog
 * @version 1.1.0
 * @issue AXX-338 / GLOB-1237 · estandar de diseno aplicado en MSN-000002 (AXX-378)
 *
 * Solo presentacion: el bloque `css`, el marcado del topbar/panel y la medicion de
 * alto. La logica, los comandos, los filtros, la validacion y la paginacion quedan
 * exactamente como estaban.
 *
 * Notas de plataforma (no borrar):
 *  - El motor es react-live 2.4.1 -> buble 0.19.6: nada de arrow async, ni ?., ni ??,
 *    ni entidades HTML dentro del JSX.
 *  - RepoRiskClassCatalog GET pagina con `page` BASE 0 y ordena por id ASCENDENTE.
 *  - El id lo genera la base (columna identity): la vista NUNCA calcula max(id)+1,
 *    y por eso dos altas simultaneas no pueden colisionar.
 */
() => {
  const A_ = A;
  const Table = A_.Table;
  const Button = A_.Button;
  const Modal = A_.Modal;
  const Drawer = A_.Drawer;
  const Input = A_.Input;
  const InputNumber = A_.InputNumber;
  const Space = A_.Space;
  const Alert = A_.Alert;
  const Empty = A_.Empty;
  const Tag = A_.Tag;
  const message = A_.message;

  // antd 4 no exporta Icon: el ambiente dibuja los iconos como SVG en linea.
  const svg = (d) => (
    <span role="img" className="anticon">
      <svg viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d={d} /></svg>
    </span>
  );
  const IcoBuscar = () => svg(''M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z'');
  const IcoActualizar = () => svg(''M909.1 209.3l-56.4 44.1C775.8 155.1 656.2 92 521.9 92 290 92 102.3 279.5 102 511.5 101.7 743.7 289.8 932 521.9 932c181.3 0 335.8-115 394.6-276.1 1.5-4.2-.7-8.9-4.9-10.3l-56.7-19.5a8 8 0 00-10.1 4.8c-1.8 5-3.8 10-5.9 14.9-17.3 41-42.1 77.8-73.7 109.4A344.77 344.77 0 01655.9 829c-42.3 17.9-87.4 27-133.8 27-46.5 0-91.5-9.1-133.8-27A341.5 341.5 0 01279 755.2a342.16 342.16 0 01-73.7-109.4c-17.9-42.4-27-87.4-27-133.9s9.1-91.5 27-133.9c17.3-41 42.1-77.8 73.7-109.4 31.6-31.6 68.4-56.4 109.3-73.8 42.3-17.9 87.4-27 133.8-27 46.5 0 91.5 9.1 133.8 27a341.5 341.5 0 01109.3 73.8c9.9 9.9 19.2 20.4 27.8 31.4l-60.2 47a8 8 0 003 14.1l175.6 43c5 1.2 9.9-2.6 9.9-7.7l.8-180.9c-.1-6.6-7.8-10.3-13-6.2z'');

  const CMD = ''RepoRiskClassCatalog'';
  const MAX_LEN = 200;

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draftId, setDraftId] = useState(null);
  const [draftName, setDraftName] = useState('''');
  const [applied, setApplied] = useState({ id: null, name: '''' });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [desc, setDesc] = useState('''');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [dupWarn, setDupWarn] = useState(null);

  const [perm, setPerm] = useState({ canAdd: true, canEdit: true, resolved: false });
  const [tableY, setTableY] = useState(360);
  const [viewH, setViewH] = useState(450);

  // ---------------------------------------------------------------- filtros
  // Los filtros activos se combinan con AND (dictamen, supuesto 2). El nombre
  // se busca por subcadena con la comparacion propia del catalogo: no se fuerza
  // COLLATE ni LOWER(), asi la sensibilidad a mayusculas y acentos es la misma
  // que ya aplica el resto del sistema sobre esta tabla.
  const sqlSafe = (s) => String(s).split("''").join("''''");

  const buildFilter = (f) => {
    const parts = [];
    if (f.id !== null && f.id !== undefined && String(f.id) !== '''') parts.push(''id='' + Number(f.id));
    if (f.name && f.name.trim() !== '''') parts.push("name LIKE ''%" + sqlSafe(f.name.trim()) + "%''");
    return parts.join('' AND '');
  };

  const hasFilter = (f) => buildFilter(f) !== '''';

  // ---------------------------------------------------------------- lectura
  const fetchPage = (wantedPage, size, f) => {
    const data = { operation: ''GET'', size: size, page: wantedPage - 1 };
    const flt = buildFilter(f);
    if (flt !== '''') data.filter = flt;
    return exe(CMD, data);
  };

  // Relee y, si la pagina pedida quedo fuera de rango (por ejemplo tras filtrar
  // o tras una edicion que saca la fila del filtro), retrocede a la ultima
  // pagina valida en lugar de dejar la grilla vacia (dictamen, supuesto 3).
  const load = (wantedPage, size, f) => {
    setLoading(true);
    setLoadError(null);
    return fetchPage(wantedPage, size, f)
      .then((r) => {
        if (!r.ok) throw new Error(r.msg || ''No se pudo consultar el catalogo'');
        const count = r.total || 0;
        const lastPage = count === 0 ? 1 : Math.ceil(count / size);
        const list = r.outData || [];
        if (list.length === 0 && count > 0 && wantedPage > lastPage) {
          return fetchPage(lastPage, size, f).then((r2) => {
            if (!r2.ok) throw new Error(r2.msg || ''No se pudo consultar el catalogo'');
            setPage(lastPage);
            setRows(r2.outData || []);
            setTotal(r2.total || 0);
          });
        }
        setPage(wantedPage);
        setRows(list);
        setTotal(count);
      })
      .catch((e) => {
        setLoadError(String(e.message || e));
        setRows([]);
        setTotal(0);
      })
      .then(() => setLoading(false));
  };

  // ------------------------------------------------------------- permisos
  // jActions de un grupo es una lista de DENEGACION: el codigo presente PROHIBE.
  // Sin filas de catalogo para este comando nadie esta denegado, que es como se
  // comporta hoy el gate nativo.
  const resolvePerms = () => {
    exe(''RepoActionCatalog'', { operation: ''GET'', filter: "cmd=''" + CMD + "''" })
      .then((r) => {
        const acts = (r && r.ok && r.outData) || [];
        if (acts.length === 0) {
          setPerm({ canAdd: true, canEdit: true, resolved: true });
          return null;
        }
        return exe(''GetCurrentUser'', {}).then((u) => {
          const groups = (u && u.ok && u.outData && u.outData.Groups) || [];
          const ids = [];
          for (let i = 0; i < groups.length; i++) {
            if (groups[i].usrGroupId && ids.indexOf(groups[i].usrGroupId) === -1) ids.push(groups[i].usrGroupId);
          }
          if (ids.length === 0) {
            setPerm({ canAdd: true, canEdit: true, resolved: true });
            return null;
          }
          return exe(''RepoUsrGroup'', { operation: ''GET'', filter: ''id IN ('' + ids.join('','') + '')'' }).then((g) => {
            const denied = [];
            const gr = (g && g.ok && g.outData) || [];
            for (let i = 0; i < gr.length; i++) {
              let list = [];
              try { list = JSON.parse(gr[i].jActions || ''[]''); } catch (e) { list = []; }
              for (let j = 0; j < list.length; j++) {
                const code = typeof list[j] === ''string'' ? list[j] : list[j].code;
                if (code && denied.indexOf(code) === -1) denied.push(code);
              }
            }
            let canAdd = true;
            let canEdit = true;
            for (let i = 0; i < acts.length; i++) {
              if (denied.indexOf(acts[i].code) === -1) continue;
              const d = acts[i].data || '''';
              const isAdd = d.indexOf(''ADD'') !== -1;
              const isUpd = d.indexOf(''UPDATE'') !== -1;
              if (isAdd) canAdd = false;
              if (isUpd) canEdit = false;
              if (!isAdd && !isUpd) { canAdd = false; canEdit = false; }
            }
            setPerm({ canAdd: canAdd, canEdit: canEdit, resolved: true });
            return null;
          });
        });
      })
      .catch(() => setPerm({ canAdd: true, canEdit: true, resolved: true }));
  };

  useEffect(() => {
    load(1, pageSize, { id: null, name: '''' });
    resolvePerms();
  }, []);

  // -------------------------------------------------------------- alto util
  // El alto se MIDE contra el ancestro que scrollea; no se fija con una constante ni
  // con calc(100dvh - n), que ya fallo en otra vista. Dentro del panel se mide lo que
  // NO es cuerpo de grilla -encabezado arriba, paginacion con sus margenes abajo- para
  // que la paginacion nunca quede fuera de la vista. La paginacion recien existe
  // cuando hay filas, asi que el efecto corre en CADA render, no solo al montar.
  const measure = () => {
    const root = document.querySelector(''.axx338'');
    if (!root) return;
    const rect = root.getBoundingClientRect();
    if (!rect || rect.height === 0) return;
    let cont = root.parentElement;
    while (cont && cont !== document.body && !/(auto|scroll)/.test(window.getComputedStyle(cont).overflowY)) cont = cont.parentElement;
    const limit = cont && cont !== document.body ? cont.getBoundingClientRect().bottom : window.innerHeight;
    const h = Math.max(200, Math.floor(limit - rect.top - 12));
    setViewH((prev) => (Math.abs(h - prev) > 4 ? h : prev));
    const panel = root.querySelector(''.axx338-panel'');
    if (!panel) return;
    const body = panel.querySelector(''.ant-table-body'');
    if (!body) return;
    const pRect = panel.getBoundingClientRect();
    const bRect = body.getBoundingClientRect();
    const bt = parseFloat(window.getComputedStyle(panel).borderTopWidth || 0);
    const above = bRect.top - (pRect.top + bt);
    let below = 0;
    const pager = panel.querySelector(''.ant-table-pagination'');
    if (pager) {
      const ps = window.getComputedStyle(pager);
      below = pager.getBoundingClientRect().bottom + parseFloat(ps.marginBottom || 0) - bRect.bottom;
    }
    const y = Math.max(90, Math.floor(panel.clientHeight - above - below - 1));
    setTableY((prev) => (Math.abs(y - prev) > 4 ? y : prev));
  };

  useEffect(() => {
    measure();
    const t1 = setTimeout(measure, 0);
    const t2 = setTimeout(measure, 200);
    window.addEventListener(''resize'', measure);
    const root = document.querySelector(''.axx338'');
    const observer = typeof ResizeObserver !== ''undefined'' ? new ResizeObserver(measure) : null;
    if (observer && root) observer.observe(root);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener(''resize'', measure);
      if (observer) observer.disconnect();
    };
  });

  // ------------------------------------------------------------- validacion
  const validate = (value) => {
    const v = String(value === null || value === undefined ? '''' : value);
    if (v.trim() === '''') return t(''La descripcion es obligatoria y no puede contener solo espacios'');
    if (v.trim().length > MAX_LEN) return t(''La descripcion no puede superar los 200 caracteres'');
    return null;
  };

  // El modelo vigente no tiene indice unico sobre la descripcion, asi que la
  // duplicidad se ADVIERTE y no bloquea: es la unica restriccion que impone el
  // modelo, tal como pide el requerimiento.
  const checkDuplicate = (value, selfId) => {
    const v = String(value || '''').trim();
    if (v === '''') return Promise.resolve(null);
    return exe(CMD, { operation: ''GET'', filter: "name LIKE ''%" + sqlSafe(v) + "%''", size: 50 }).then((r) => {
      const list = (r && r.ok && r.outData) || [];
      for (let i = 0; i < list.length; i++) {
        const same = String(list[i].name || '''').trim().toLowerCase() === v.toLowerCase();
        if (same && list[i].id !== selfId) return list[i].id;
      }
      return null;
    });
  };

  // --------------------------------------------------------------- escritura
  const openNew = () => {
    setEditing(null);
    setDesc('''');
    setFormError(null);
    setDupWarn(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setDesc(row.name === null || row.name === undefined ? '''' : String(row.name));
    setFormError(null);
    setDupWarn(null);
    setModalOpen(true);
  };

  // Cancelar no toca el registro: solo cierra y limpia el borrador.
  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setDesc('''');
    setFormError(null);
    setDupWarn(null);
  };

  const save = () => {
    if (saving) return; // evita el doble envio mientras la operacion esta en curso
    const err = validate(desc);
    if (err) {
      setFormError(err);
      return;
    }
    const value = String(desc).trim();
    const isEdit = editing !== null && editing !== undefined;
    setSaving(true);
    setFormError(null);
    checkDuplicate(value, isEdit ? editing.id : null)
      .then((dupId) => {
        if (dupId !== null) setDupWarn(t(''Ya existe una clase con esa descripcion'') + '' (id '' + dupId + '')'');
        else setDupWarn(null);
        // ADD sin id: lo asigna la base. UPDATE manda solo id + name, de modo que
        // ningun otro campo del registro se toca.
        const data = isEdit
          ? { operation: ''UPDATE'', entity: { id: editing.id, name: value } }
          : { operation: ''ADD'', entity: { name: value } };
        return exe(CMD, data);
      })
      .then((r) => {
        if (!r || !r.ok) throw new Error((r && r.msg) || t(''No se pudo guardar''));
        message.success(isEdit ? t(''Clase de riesgo actualizada'') : t(''Clase de riesgo creada''));
        setModalOpen(false);
        setEditing(null);
        setDesc('''');
        setDupWarn(null);
        // Refresco conservando filtros y pagina; load() reencuadra si hace falta.
        return load(page, pageSize, applied);
      })
      .catch((e) => {
        // El modal queda abierto con lo capturado: nada se da por guardado.
        setFormError(String((e && e.message) || e));
      })
      .then(() => setSaving(false));
  };

  // ----------------------------------------------------------------- filtros
  const applyFilter = () => {
    const f = { id: draftId, name: draftName };
    setApplied(f);
    setDrawerOpen(false);
    load(1, pageSize, f);
  };

  const clearFilter = () => {
    const f = { id: null, name: '''' };
    setDraftId(null);
    setDraftName('''');
    setApplied(f);
    setDrawerOpen(false);
    load(1, pageSize, f);
  };

  const openDrawer = () => {
    setDraftId(applied.id);
    setDraftName(applied.name);
    setDrawerOpen(true);
  };

  // ------------------------------------------------------------------ render
  const columns = [
    { title: t(''Id''), dataIndex: ''id'', key: ''id'', width: 110, sorter: (a, b) => a.id - b.id },
    {
      title: t(''Nombre''),
      dataIndex: ''name'',
      key: ''name'',
      ellipsis: true,
      render: (v) => (v === null || v === undefined || String(v).trim() === '''' ? <Tag>{t(''Sin descripcion'')}</Tag> : String(v)),
    },
    {
      title: t(''Acciones''),
      key: ''acciones'',
      width: 140,
      render: (v, row) => (
        <Button type="link" size="small" disabled={!perm.canEdit} onClick={() => openEdit(row)}>
          {t(''Editar'')}
        </Button>
      ),
    },
  ];

  const filtrosActivos = hasFilter(applied);

  // Estandar visual del ambiente, acotado a la clase raiz de esta vista para no
  // alterar antd en el resto de la SPA. Las reglas que pisan estilos propios de
  // antd necesitan !important. El modal y el drawer viven en portales fuera del
  // arbol de la vista: se alcanzan por su propia clase.
  const css =
    ''.axx338{display:flex;flex-direction:column;min-width:0;overflow:hidden;font-size:13px;}'' +
    ''.axx338 .axx338-bar{display:flex;align-items:center;flex-wrap:wrap;gap:8px;background:transparent;border:1px solid #e6ebf2;border-radius:6px;padding:4px 0;margin:0 0 2px 0;flex-shrink:0;}'' +
    ''.axx338 .axx338-bar>*{margin-left:4px;}'' +
    ''.axx338 .axx338-bar>*:last-child{margin-right:4px;}'' +
    ''.axx338 .axx338-spacer{flex:1 1 auto;min-width:0;}'' +
    ''.axx338 .axx338-alerta{margin:0 0 2px 0;flex-shrink:0;}'' +
    ''.axx338 .axx338-panel{display:flex;flex-direction:column;flex:1 1 auto;min-height:0;min-width:0;overflow:hidden;background:#fff;border:1px solid #cbd1d8;}'' +
    ''.axx338 .axx338-panel .ant-table-wrapper{flex:1 1 auto;min-height:0;min-width:0;}'' +
    ''.axx338 .ant-table-body{min-height:'' + tableY + ''px;}'' +
    ''.axx338 .ant-table-thead>tr>th{background:#bfbfbf !important;color:#262626;font-weight:600;border-right:1px solid #cbd1d8 !important;border-bottom:1px solid #cbd1d8 !important;font-size:12px;line-height:18px;padding:5px 8px !important;}'' +
    ''.axx338 .ant-table-thead>tr>th:last-child{border-right:none !important;}'' +
    ''.axx338 .ant-table-thead>tr>th::before{display:none !important;}'' +
    ''.axx338 .ant-table-tbody>tr>td{border-right:none !important;border-bottom:1px solid #cbd1d8 !important;font-size:12px;line-height:18px;padding:5px 8px !important;}'' +
    ''.axx338 .ant-table-tbody>tr.ant-table-row:hover>td{background:#b7d7ff !important;}'' +
    ''.axx338 .ant-table-tbody>tr.ant-table-row-selected>td,.axx338 .ant-table-tbody>tr.axx338-selected>td{background:#86b4ff !important;}'' +
    ''.axx338 .ant-table-tbody>tr.ant-table-row-selected:hover>td,.axx338 .ant-table-tbody>tr.axx338-selected:hover>td{background:#86b4ff !important;}'' +
    ''.axx338 .ant-table-tbody>tr.ant-table-placeholder:hover>td{background:#fff !important;}'' +
    ''.axx338 .ant-table-pagination.ant-pagination{margin:8px;flex-shrink:0;}'' +
    ''.axx338 .axx338-btn-sec{border-color:#8f9aa7 !important;}'' +
    ''.axx338 .ant-btn[disabled],.axx338-modal .ant-btn[disabled],.axx338-drawer .ant-btn[disabled]{border-color:#6f7b88 !important;opacity:1 !important;}'' +
    ''.axx338-modal .ant-modal-body,.axx338-drawer .ant-drawer-body{font-size:13px;}'' +
    ''.axx338-modal .ant-modal-footer .ant-btn-default,.axx338-drawer .axx338-btn-sec{border-color:#8f9aa7 !important;}'';

  return (
    <DefaultPage title={t(''Clases de Riesgo (Fianzas)'')} icon="safety-certificate">
      <div className="axx338" style={{ height: viewH }}>
        <style>{css}</style>

        <div className="axx338-bar">
          <Button type="primary" disabled={!perm.canAdd} onClick={openNew}>
            {t(''Nuevo'')}
          </Button>
          <Button type="primary" icon={<IcoBuscar />} onClick={openDrawer}>
            {t(''Filtrar'')}
          </Button>
          {filtrosActivos ? (
            <Button className="axx338-btn-sec" onClick={clearFilter}>
              {t(''Limpiar filtros'')}
            </Button>
          ) : null}
          {filtrosActivos ? (
            <Tag color="blue">
              {t(''Filtros activos'')}
              {applied.id !== null && applied.id !== undefined && String(applied.id) !== '''' ? '' - '' + t(''Id'') + '': '' + applied.id : ''''}
              {applied.name && applied.name.trim() !== '''' ? '' - '' + t(''Nombre'') + '': '' + applied.name : ''''}
            </Tag>
          ) : null}
          <span className="axx338-spacer" />
          <Button className="axx338-btn-sec" icon={<IcoActualizar />} disabled={loading} onClick={() => load(page, pageSize, applied)}>
            {t(''Actualizar'')}
          </Button>
        </div>

        {loadError ? <Alert className="axx338-alerta" type="error" showIcon message={loadError} /> : null}

        <section className="axx338-panel">
        <Table
          rowKey="id"
          size="small"
          loading={loading}
          columns={columns}
          dataSource={rows}
          scroll={{ x: 620, y: tableY }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={filtrosActivos ? t(''No hay clases de riesgo que coincidan con los filtros aplicados'') : t(''El catalogo de clases de riesgo esta vacio'')}
              />
            ),
          }}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            size: ''small'',
            showTotal: (n) => t(''Total'') + '': '' + n,
            onChange: (p, s) => {
              setPageSize(s);
              load(p, s, applied);
            },
          }}
        />
        </section>

        <Drawer
          title={t(''Filtrar clases de riesgo'')}
          className="axx338-drawer"
          placement="right"
          width={340}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 4 }}>{t(''Id'')}</div>
            <InputNumber
              style={{ width: ''100%'' }}
              value={draftId}
              min={1}
              precision={0}
              placeholder={t(''Busqueda exacta por id'')}
              onChange={(v) => setDraftId(v)}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 4 }}>{t(''Nombre'')}</div>
            <Input
              value={draftName}
              placeholder={t(''Busqueda por coincidencia'')}
              onChange={(e) => setDraftName(e.target.value)}
              onPressEnter={applyFilter}
            />
          </div>
          <Space>
            <Button type="primary" icon={<IcoBuscar />} onClick={applyFilter}>
              {t(''Aplicar'')}
            </Button>
            <Button className="axx338-btn-sec" onClick={clearFilter}>
              {t(''Limpiar'')}
            </Button>
          </Space>
        </Drawer>

        <Modal
          title={editing ? t(''Editar clase de riesgo'') : t(''Nueva clase de riesgo'')}
          wrapClassName="axx338-modal"
          open={modalOpen}
          onOk={save}
          onCancel={closeModal}
          okText={t(''Guardar'')}
          cancelText={t(''Cancelar'')}
          confirmLoading={saving}
          maskClosable={false}
          destroyOnClose={false}
        >
          <div style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 4 }}>{t(''Id'')}</div>
            <Input value={editing ? String(editing.id) : t(''Se asigna automaticamente'')} disabled readOnly />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 4 }}>
              {t(''Nombre'')} <span style={{ color: ''#ff4d4f'' }}>*</span>
            </div>
            <Input
              value={desc}
              maxLength={null}
              autoFocus
              placeholder={t(''Descripcion de la clase de riesgo'')}
              onChange={(e) => {
                setDesc(e.target.value);
                if (formError) setFormError(null);
              }}
            />
          </div>
          {dupWarn ? <Alert type="warning" showIcon message={dupWarn} style={{ marginBottom: 8 }} /> : null}
          {formError ? <Alert type="error" showIcon message={formError} /> : null}
        </Modal>
      </div>
    </DefaultPage>
  );
}
', N'CATALOGOS', N'Mantenimiento de clases de riesgo', 0);

    INSERT INTO dbo.LiveView (id, name, code, category, operation, multiComponent) VALUES (51, N'viewAXX337ZonasCresta', N'/**
 * @author Axxis Systems
 * @created 2026/09/08
 * @name viewAXX337ZonasCresta
 * @version 1.0
 * @purpose: Manage CRESTA zones and consult the provinces associated with each risk zone.
 */
() => {
 const {useState,useEffect,useRef}=React;
 const {Table,Button,Modal,Input,Alert,Typography}=A;
 const [rows,setRows]=useState([]),[selected,setSelected]=useState(null),[provinces,setProvinces]=useState([]);
 const [loading,setLoading]=useState(false),[provinceLoading,setProvinceLoading]=useState(false),[error,setError]=useState(''''),[provinceError,setProvinceError]=useState('''');
 const [modal,setModal]=useState(false),[original,setOriginal]=useState(null),[description,setDescription]=useState(''''),[saving,setSaving]=useState(false),[saveError,setSaveError]=useState('''');
 const [height,setHeight]=useState(450),[scrollY,setScrollY]=useState(280);
 const root=useRef(null),body=useRef(null),sequence=useRef(0),mounted=useRef(true);
 // antd 4 no exporta Icon: el ambiente dibuja los iconos como SVG en linea.
 const svg=d=><span role="img" className="anticon"><svg viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d={d}/></svg></span>;
 const IcoActualizar=()=>svg(''M909.1 209.3l-56.4 44.1C775.8 155.1 656.2 92 521.9 92 290 92 102.3 279.5 102 511.5 101.7 743.7 289.8 932 521.9 932c181.3 0 335.8-115 394.6-276.1 1.5-4.2-.7-8.9-4.9-10.3l-56.7-19.5a8 8 0 00-10.1 4.8c-1.8 5-3.8 10-5.9 14.9-17.3 41-42.1 77.8-73.7 109.4A344.77 344.77 0 01655.9 829c-42.3 17.9-87.4 27-133.8 27-46.5 0-91.5-9.1-133.8-27A341.5 341.5 0 01279 755.2a342.16 342.16 0 01-73.7-109.4c-17.9-42.4-27-87.4-27-133.9s9.1-91.5 27-133.9c17.3-41 42.1-77.8 73.7-109.4 31.6-31.6 68.4-56.4 109.3-73.8 42.3-17.9 87.4-27 133.8-27 46.5 0 91.5 9.1 133.8 27a341.5 341.5 0 01109.3 73.8c9.9 9.9 19.2 20.4 27.8 31.4l-60.2 47a8 8 0 003 14.1l175.6 43c5 1.2 9.9-2.6 9.9-7.7l.8-180.9c-.1-6.6-7.8-10.3-13-6.2z'');
 const service=request=>exe(''ExeChain'',{chain:''cmdAXX337ZonasCresta'',context:JSON.stringify({request})}).then(r=>{
  if(!r.ok)throw new Error(r.msg||''No se pudo completar la operación'');
  if(!r.outData||!r.outData.ok)throw new Error(r.outData&&r.outData.msg||''No se pudo completar la operación'');
  return r.outData;
 });
 const load=()=>{
  setLoading(true);setError('''');
  return service({action:''list''}).then(r=>{if(mounted.current)setRows(r.rows);return r.rows;}).catch(e=>{if(mounted.current)setError(String(e.message||e));throw e;}).finally(()=>{if(mounted.current)setLoading(false);});
 };
 const select=row=>{
  const ticket=++sequence.current;setSelected(row);setProvinces([]);setProvinceError('''');setProvinceLoading(false);
  if(!row)return;
  const code=String(row[0]);
  if(!/^[1-9][0-9]*$/.test(code)||!Number.isSafeInteger(Number(code))){setProvinceError(''Código CRESTA inválido'');return;}
  setProvinceLoading(true);
  exe(''RepoStateCatalog'',{operation:''GET'',filter:"[countryCode]=''591'' AND [riskZone]=''"+code+"''",size:0}).then(r=>{
   if(!mounted.current||ticket!==sequence.current)return;
   if(!r.ok)throw new Error(r.msg||''No se pudieron consultar las provincias'');
   setProvinces(r.outData||[]);
  }).catch(e=>{if(mounted.current&&ticket===sequence.current){setProvinces([]);setProvinceError(String(e.message||e));}}).finally(()=>{if(mounted.current&&ticket===sequence.current)setProvinceLoading(false);});
 };
 useEffect(()=>{
  mounted.current=true;load().catch(()=>{});
  return ()=>{mounted.current=false;sequence.current++;};
 },[]);
 useEffect(()=>{
  // El alto se MIDE contra el ancestro que desplaza; lo que no es cuerpo de la grilla
  // (titulo del panel, encabezado de la tabla, bordes) tambien se mide, no se estima.
  const measure=()=>{
   if(!root.current)return;
   let container=root.current.parentElement;
   while(container&&container!==document.body&&!/(auto|scroll)/.test(getComputedStyle(container).overflowY))container=container.parentElement;
   const rect=root.current.getBoundingClientRect();
   const limit=container&&container!==document.body?container.getBoundingClientRect().bottom:window.innerHeight;
   setHeight(Math.max(200,Math.floor(limit-rect.top-12)));
   if(body.current){
    const panel=body.current.querySelector(''.axx337-panel'');
    if(panel){
     const panelTitle=panel.querySelector(''.axx337-panel-title'');
     const tableHeader=panel.querySelector(''.ant-table-thead'');
     const available=panel.clientHeight-(panelTitle?panelTitle.getBoundingClientRect().height:0)-(tableHeader?tableHeader.getBoundingClientRect().height:0)-2;
     setScrollY(Math.max(90,Math.floor(available)));
    }
   }
  };
  measure();const timer=setTimeout(measure,120);
  window.addEventListener(''resize'',measure);
  const observer=typeof ResizeObserver!==''undefined''?new ResizeObserver(measure):null;
  if(observer){observer.observe(root.current);if(body.current)observer.observe(body.current);}
  return () => {clearTimeout(timer);window.removeEventListener(''resize'',measure);if(observer)observer.disconnect();};
 },[]);
 const open=row=>{setOriginal(row?row.slice():null);setDescription(row?row[1]:'''');setSaveError('''');setModal(true);};
 const save=()=>{
  if(saving)return;
  if(!description.trim()){setSaveError(''El nombre de la zona es obligatorio'');return;}
  if(description.trim().length>200){setSaveError(''El nombre admite hasta 200 caracteres'');return;}
  setSaving(true);setSaveError('''');
  const attempt=number=>service({action:''save'',description:description,original:original}).catch(e=>{
   if(/otro guardado en curso/.test(e.message||'''')&&number<11)return new Promise(resolve=>setTimeout(resolve,150+number*40)).then(()=>attempt(number+1));
   throw e;
  });
  attempt(0).then(result=>{
   setModal(false);select(result.row);
   return load().catch(()=>setError(''La zona se guardó. No se pudo actualizar la lista; pulse Reintentar.''));
  }).catch(e=>setSaveError(String(e.message||e))).finally(()=>setSaving(false));
 };
 const zoneColumns=[
  {title:t(''Código''),dataIndex:0,key:''cod'',width:85},
  {title:t(''Nombre de la zona''),dataIndex:1,key:''description'',width:280},
  {title:t(''Acciones''),key:''actions'',width:90,render:(value,row)=><Button type="link" size="small" onClick={event=>{event.stopPropagation();open(row);}}>{t(''Editar'')}</Button>}
 ];
 const provinceColumns=[
  {title:t(''Código''),dataIndex:''code'',key:''code'',width:100},
  {title:t(''Provincia''),dataIndex:''name'',key:''name'',width:300}
 ];
 // Estandar visual del ambiente, acotado a la clase raiz de esta vista para no alterar
 // antd en el resto de la SPA. Las reglas que pisan estilos de antd necesitan !important.
 const css=''\
.axx337-view{display:flex;flex-direction:column;min-width:0;overflow:hidden;font-size:13px;}\
.axx337-view .axx337-topbar{display:flex;align-items:center;gap:8px;background:transparent;border:1px solid #e6ebf2;border-radius:6px;padding:4px 0;margin:0 4px 2px 4px;flex-shrink:0;}\
.axx337-view .axx337-topbar>*{margin-left:4px;}\
.axx337-view .axx337-topbar>*:last-child{margin-right:4px;}\
.axx337-view .axx337-alerta{margin:0 4px 2px 4px;}\
.axx337-view .axx337-body{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;flex:1 1 auto;min-height:0;min-width:0;overflow:hidden;margin:0 4px;}\
.axx337-view .axx337-panel{display:flex;flex-direction:column;min-width:0;min-height:0;overflow:hidden;background:#fff;border:1px solid #cbd1d8;}\
.axx337-view .axx337-panel-title{margin:0;padding:5px 8px;background:#f2f5f8;font-size:13px;line-height:18px;font-weight:600;border-bottom:1px solid #cbd1d8;flex-shrink:0;}\
.axx337-view .axx337-panel .ant-table-wrapper{flex:1 1 auto;min-height:0;min-width:0;}\
.axx337-view .ant-table-body{min-height:''+scrollY+''px;}\
.axx337-view .ant-table-thead>tr>th{background:#bfbfbf !important;color:#262626;border-right:1px solid #cbd1d8 !important;border-bottom:1px solid #cbd1d8 !important;font-size:12px;line-height:18px;padding:5px 8px !important;}\
.axx337-view .ant-table-thead>tr>th:last-child{border-right:none !important;}\
.axx337-view .ant-table-thead>tr>th::before{display:none !important;}\
.axx337-view .ant-table-tbody>tr>td{border-right:none !important;border-bottom:1px solid #cbd1d8 !important;font-size:12px;line-height:18px;padding:5px 8px !important;}\
.axx337-view .axx337-panel-zonas .ant-table-tbody>tr.ant-table-row{cursor:pointer;}\
.axx337-view .ant-table-tbody>tr.ant-table-row:hover>td{background:#b7d7ff !important;}\
.axx337-view .ant-table-tbody>tr.ant-table-row-selected>td,.axx337-view .ant-table-tbody>tr.axx337-selected>td{background:#86b4ff !important;}\
.axx337-view .ant-table-tbody>tr.ant-table-row-selected:hover>td,.axx337-view .ant-table-tbody>tr.axx337-selected:hover>td{background:#86b4ff !important;}\
.axx337-view .ant-table-tbody>tr.ant-table-placeholder:hover>td{background:#fff !important;}\
.axx337-view .axx337-btn-sec{border-color:#8f9aa7 !important;}\
.axx337-view .ant-btn[disabled],.axx337-modal .ant-btn[disabled]{border-color:#6f7b88 !important;opacity:1 !important;}\
.axx337-modal .ant-modal-body{font-size:13px;}\
.axx337-modal .ant-modal-footer .ant-btn-default{border-color:#8f9aa7 !important;}'';
 return <div ref={root} className="axx337-view" style={{height:height}}>
  <style>{css}</style>
  <div className="axx337-topbar">
   <Typography.Title level={4} style={{marginTop:0,marginBottom:0,flex:1}}>{t(''Zonas crestas'')}</Typography.Title>
   <Button type="primary" onClick={()=>open(null)} disabled={loading}>{t(''Nuevo'')}</Button>
  </div>
  {error&&<Alert className="axx337-alerta" type="error" showIcon message={t(error)} action={<Button className="axx337-btn-sec" icon={<IcoActualizar/>} onClick={()=>load().catch(()=>{})}>{t(''Reintentar'')}</Button>}/>}
  <div ref={body} className="axx337-body">
   <section className="axx337-panel axx337-panel-zonas" aria-label={t(''Zonas CRESTA'')}>
    <div className="axx337-panel-title">{t(''Zonas CRESTA'')}</div>
    <Table size="small" columns={zoneColumns} dataSource={rows} loading={loading} pagination={false} rowKey={row=>String(row[0])} scroll={{x:455,y:scrollY}} rowClassName={row=>selected&&String(selected[0])===String(row[0])?''axx337-selected'':''''} onRow={row=>({onClick:()=>select(row)})} locale={{emptyText:t(''No hay zonas registradas'')}}/>
   </section>
   <section className="axx337-panel axx337-panel-provincias" aria-label={t(''Provincias asociadas'')}>
    <div className="axx337-panel-title">{t(''Provincias asociadas'')}{selected?'' — ''+selected[1]:''''}</div>
    {provinceError?<Alert className="axx337-alerta" type="error" showIcon message={t(provinceError)} action={<Button className="axx337-btn-sec" size="small" icon={<IcoActualizar/>} onClick={()=>select(selected)}>{t(''Reintentar'')}</Button>}/>:<Table size="small" columns={provinceColumns} dataSource={provinces} loading={provinceLoading} pagination={false} rowKey={row=>String(row.id)} scroll={{x:400,y:scrollY}} locale={{emptyText:t(selected?''No hay provincias asociadas a esta zona'':''Seleccione una zona CRESTA'')}}/>}
   </section>
  </div>
  <Modal wrapClassName="axx337-modal" title={t(original?''Editar zona CRESTA'':''Nueva zona CRESTA'')} visible={modal} onCancel={()=>{if(!saving)setModal(false);}} onOk={save} confirmLoading={saving} okText={t(''Guardar'')} cancelText={t(''Cancelar'')} destroyOnClose>
   {saveError&&<Alert type="error" showIcon message={t(saveError)} style={{marginBottom:12}}/>}
   <label htmlFor="axx337-code">{t(''Código'')}</label>
   <Input id="axx337-code" disabled value={original?original[0]:''''} placeholder={t(''Automático'')} style={{marginBottom:14}}/>
   <label htmlFor="axx337-description">{t(''Nombre de la zona'')} *</label>
   <Input id="axx337-description" value={description} onChange={event=>setDescription(event.target.value)} onPressEnter={save} disabled={saving} autoFocus aria-required="true"/>
  </Modal>
 </div>;
}
', N'CATALOGOS', N'Mantenimiento de zonas crestas', 0);

    INSERT INTO dbo.LiveView (id, name, code, category, operation, multiComponent) VALUES (52, N'viewLugares', N'/**
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

  const PANEL_H = ''calc(100vh - 200px)'';
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
  const [catalogName, setCatalogName] = useState('''');
  const [catalogSaving, setCatalogSaving] = useState(false);
  const [ambiguous, setAmbiguous] = useState(null);
  const [truncated, setTruncated] = useState(null);

  const txt = (v) => (v === null || v === undefined ? '''' : String(v));

  // Recorre TODAS las paginas de un Repo* GET. El API responde `total` con el conteo real
  // aunque `size` recorte, asi que se pagina hasta cubrirlo. Sin esto la rama se carga
  // incompleta y en silencio.
  const loadAll = (cmd, filter, done) => {
    const acc = [];
    const step = (page) => {
      const data = { operation: ''GET'', size: PAGE_SIZE, page: page };
      if (filter) data.filter = filter;
      exe(cmd, data)
        .then((r) => {
          const rows = (r.ok && r.outData) || [];
          for (let i = 0; i < rows.length; i++) acc.push(rows[i]);
          const total = typeof r.total === ''number'' && r.total > 0 ? r.total : acc.length;
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
    loadAll(''RepoCountryCatalog'', null, (rows, total) => {
      if (!rows.length) {
        setRootError(t(''No se pudo leer el catalogo de paises''));
        setLoadingRoot(false);
        return;
      }
      const list = rows.slice();
      // PANAMA primero, el resto alfabetico. Se reconoce por su registro nativo.
      list.sort((a, b) => {
        const an = txt(a.name).toUpperCase();
        const bn = txt(b.name).toUpperCase();
        const ap = an.indexOf(''PANAM'') === 0;
        const bp = bn.indexOf(''PANAM'') === 0;
        if (ap && !bp) return -1;
        if (bp && !ap) return 1;
        return an < bn ? -1 : an > bn ? 1 : 0;
      });
      setTreeData(
        list.map((c) => ({
          key: ''country|'' + txt(c.code),
          title: txt(c.name),
          kind: ''country'',
          realId: txt(c.code),
          code: txt(c.code),
          label: txt(c.name),
          isLeaf: false,
        }))
      );
      noteIfShort(t(''Paises''), rows.length, total);
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

      if (kind === ''country'') {
        loadAll(''RepoStateCatalog'', "countryCode=''" + node.code + "''", (rows, total) => {
          const kids = rows.map((s) => ({
            key: ''state|'' + txt(s.id),
            title: txt(s.name),
            kind: ''state'',
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

      if (kind === ''state'') {
        loadAll(''RepoCityCatalog'', "stateCode=''" + node.code + "''", (rows, total) => {
          const kids = rows.map((c) => ({
            key: ''city|'' + txt(c.id),
            title: txt(c.name),
            kind: ''city'',
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

      if (kind === ''city'') {
        // Los corregimientos se vinculan con la ciudad por CODIGO, y el codigo de ciudad no es
        // unico en este ambiente. Si esta repetido, la rama es ambigua: se detiene la expansion
        // en lugar de mezclar ubicaciones distintas.
        exe(''RepoCityCatalog'', { operation: ''GET'', filter: "code=''" + node.code + "''", size: 50 })
          .then((r) => {
            const owners = (r.ok && r.outData) || [];
            if (owners.length > 1) {
              setTreeData((prev) => mark(prev, node.key, { isLeaf: true, ambiguousCount: owners.length }));
              setAmbiguous({ name: node.label, code: node.code, count: owners.length });
              setSelected(null);
              resolve();
              return;
            }
            loadAll(''RepoSectorCatalog'', "cityCode=''" + node.code + "''", (rows, total) => {
              const kids = rows.map((s) => ({
                key: ''sector|'' + txt(s.id),
                title: txt(s.name),
                kind: ''sector'',
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

      if (kind === ''sector'') {
        const kids = [
          {
            key: ''barriadas|'' + node.realId,
            title: t(''Barriadas''),
            kind: ''barriadas'',
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
            key: ''edificios|'' + node.realId,
            title: t(''Edificios''),
            kind: ''edificios'',
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
    if (n.kind === ''barriadas'' || n.kind === ''edificios'') {
      const baseContext = { kind: n.kind, sectorId: n.realId, sectorCode: n.code, sectorName: n.label,
        countryCode: n.countryCode, countryName: n.countryName || n.countryCode, stateCode: n.stateCode,
        stateName: n.stateName || n.stateCode, cityCode: n.cityCode, cityName: n.cityName || n.cityCode };
      setSelected(baseContext);
      Promise.all([
        exe(''RepoStateCatalog'', { operation: ''GET'', filter: "code=''" + n.stateCode + "'' AND countryCode=''" + n.countryCode + "''", size: 1 }),
        exe(''RepoCityCatalog'', { operation: ''GET'', filter: "code=''" + n.cityCode + "'' AND stateCode=''" + n.stateCode + "''", size: 1 }),
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

  const catalogTable = (context) => context && context.kind === ''barriadas'' ? ''Barriadas'' : ''Edificios'';
  const catalogRow = (row, context) => context.kind === ''barriadas''
    ? { id: row[0], sectorId: row[1], sectorName: row[2], name: row[3], raw: row }
    : { countryCode: row[0], stateCode: row[1], cityCode: row[2], sectorCode: row[3], id: row[4], name: row[5], raw: row,
        stateName: context.stateName || context.stateCode, cityName: context.cityName || context.cityCode,
        sectorName: context.sectorName || context.sectorCode };

  const loadCatalog = (context) => {
    if (!context) return;
    setCatalogLoading(true);
    setCatalogError(null);
    exe(''GetFullTable'', { table: catalogTable(context) })
      .then((r) => {
        if (!r || r.ok === false) throw new Error((r && r.msg) || t(''No se pudo cargar el catalogo''));
        const source = Array.isArray(r.outData) ? r.outData : [];
        const rows = source.filter((row) => Array.isArray(row) && row.length >= 4 &&
          (context.kind === ''barriadas''
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
    setCatalogName(row ? txt(row.name) : '''');
    setCatalogModal(true);
  };

  const saveCatalog = () => {
    const name = String(catalogName || '''').trim();
    if (!name) { message.error(t(''El nombre es obligatorio'')); return; }
    if (!selected || catalogSaving) return;
    setCatalogSaving(true);
    const table = catalogTable(selected);
    exe(''DoQuery'', { sql: "SELECT data FROM [Table] WHERE [name]=''" + table + "''" })
      .then((response) => {
        if (!response || response.ok === false) throw new Error((response && response.msg) || t(''No se pudo leer el catalogo''));
        const item = response.outData && response.outData[0];
        const tableData = item && (item.data !== undefined ? item.data : (item.Data !== undefined ? item.Data : item.DATA));
        const raw = typeof tableData === ''string'' ? JSON.parse(tableData) : tableData || [];
        if (!Array.isArray(raw)) throw new Error(t(''La estructura del catalogo no es valida''));
        const dataRows = raw.filter((row) => Array.isArray(row));
        const isBarriada = selected.kind === ''barriadas'';
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
          const target = String(editingCatalog.id);
          const current = dataRows.find((row) => Array.isArray(row) &&
            String(row[idIndex]) === target &&
            String(row[0]) === String(selected.countryCode) &&
            String(row[2]) === String(selected.cityCode) &&
            String(row[3]) === String(selected.sectorCode));
          if (!current) throw new Error(t(''No se encontró el registro a actualizar''));
          current[isBarriada ? 3 : 5] = name;
        } else {
          const newRow = new Array(header.length || (isBarriada ? 4 : 6)).fill('''');
          const setValue = (field, index, value) => {
            const target = header.length ? headerIndex(field) : index;
            if (target >= 0) newRow[target] = value;
          };
          if (isBarriada) {
            setValue(''idStreet'', 0, nextId);
            setValue(''SectoreId'', 1, selected.sectorId);
            setValue(''SectorName'', 2, selected.sectorName);
            setValue(''STREET'', 3, name);
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
            newRow[headerIndexAny([''pais'', ''countryCode''], 0)] = countryCode;
            newRow[headerIndexAny([''provincia'', ''estado'', ''stateCode''], 1)] = stateCode;
            newRow[headerIndexAny([''ciudad'', ''distrito'', ''cityCode''], 2)] = cityCode;
            newRow[headerIndexAny([''corregimiento'', ''corregi'', ''sectorCode''], 3)] = sectorCode;
            newRow[headerIndexAny([''edificio'', ''id''], 4)] = nextId;
            newRow[headerIndexAny([''nombre'', ''descripcion'', ''name''], 5)] = name;
          }
          const statusIndex = headerIndex(''estadoVigencia'');
          if (statusIndex >= 0) newRow[statusIndex] = ''S'';
          raw.push(newRow);
        }
        const json = JSON.stringify(raw).replace(/''/g, "''''");
        return exe(''DoQuery'', { sql: "UPDATE [Table] SET data=''" + json + "'' WHERE [name]=''" + table + "''" })
          .then((updateResponse) => {
            if (!updateResponse || updateResponse.ok === false) {
              throw new Error((updateResponse && updateResponse.msg) || t(''No se pudo guardar el registro''));
            }
            return exe(''GetFullTable'', { table: table });
          });
      })
      .then((response) => {
        if (!response || response.ok === false) throw new Error((response && response.msg) || t(''No se pudo verificar el registro guardado''));
        const updatedRows = Array.isArray(response.outData) ? response.outData : [];
        const expectedId = editingCatalog ? String(editingCatalog.id) : '''';
        if (editingCatalog && !updatedRows.some((row) => Array.isArray(row) &&
          String(row[selected.kind === ''barriadas'' ? 0 : 4]) === expectedId &&
          (selected.kind === ''barriadas'' ||
            (String(row[0]) === String(selected.countryCode) &&
             String(row[2]) === String(selected.cityCode) &&
             String(row[3]) === String(selected.sectorCode))) &&
          String(row[selected.kind === ''barriadas'' ? 3 : 5]) === String(catalogName).trim())) {
          throw new Error(t(''El registro no pudo verificarse después de guardar''));
        }
        setCatalogModal(false);
        message.success(editingCatalog ? t(''Registro actualizado'') : t(''Registro creado''));
        loadCatalog(selected);
      })
      .catch((e) => setCatalogError(String(e.message || e)))
      .then(() => setCatalogSaving(false));
  };

  // ---------- area central ----------
  const actionsEnabled = Boolean(selected);
  const entityName = selected && selected.kind === ''edificios'' ? t(''Edificios'') : t(''Barriadas'');
  const exportCatalog = () => {
    if (!selected || !catalogRows.length) return;
    const headers = selected.kind === ''barriadas''
      ? [t(''Id''), t(''Corregimiento''), t(''Barriada'')]
      : [t(''Provincia''), t(''Ciudad''), t(''Corregimiento''), t(''Id''), t(''Edificio'')];
    const values = catalogRows.map((row) => selected.kind === ''barriadas''
      ? [row.id, row.sectorName, row.name]
      : [row.stateName || row.stateCode, row.cityName || row.cityCode, row.sectorName || row.sectorCode, row.id, row.name]);
    const quote = (value) => ''"'' + String(value == null ? '''' : value).replace(/"/g, ''""'') + ''"'';
    const csv = [headers].concat(values).map((line) => line.map(quote).join('','')).join(''\r\n'');
    const link = document.createElement(''a'');
    link.href = URL.createObjectURL(new Blob([''\ufeff'' + csv], { type: ''text/csv;charset=utf-8'' }));
    link.download = entityName + ''.csv'';
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  // La barra va SIEMPRE visible: el usuario tiene que ver que las acciones existen y que
  // estan deshabilitadas, no que desaparecen.
  const renderBar = () => (
    <div style={{ marginBottom: 12 }}>
      <Space wrap>
        <Button type="primary" disabled={!actionsEnabled} onClick={() => openCatalogModal(null)}>
          {t(''Nuevo'')}
        </Button>
        <Button disabled={!actionsEnabled || !catalogRows.length} onClick={exportCatalog}>{t(''Exportar'')}</Button>
        {selected ? (
          <Typography.Text type="secondary">
            {t(''Corregimiento'') + '': '' + selected.sectorName + '' (id '' + selected.sectorId + '') — '' + entityName}
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary">{t(''Sin contexto seleccionado'')}</Typography.Text>
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
          message={t(''Rama no expandible: relacion geografica ambigua'')}
          description={
            t(''La ciudad'') + '' "'' + ambiguous.name + ''" '' +
            t(''comparte su codigo'') + '' "'' + ambiguous.code + ''" '' +
            t(''con otras del catalogo'') + '' ('' + ambiguous.count + ''). '' +
            t(''Los corregimientos se vinculan por codigo, de modo que expandir esta rama mezclaria ubicaciones distintas. Se detiene la expansion y la dependencia queda registrada para el SA.'')
          }
        />
      );
    }

    if (!selected) {
      return (
        <Empty
          description={t(''Seleccione pais, provincia, ciudad y corregimiento, y luego el nodo Barriadas o Edificios para fijar el contexto.'')}
        />
      );
    }

    const columns = selected.kind === ''barriadas''
      ? [
          { title: t(''Id''), dataIndex: ''id'', key: ''id'', width: 100 },
          { title: t(''Corregimiento''), dataIndex: ''sectorName'', key: ''sectorName'' },
          { title: t(''Barriada''), dataIndex: ''name'', key: ''name'' },
        ]
      : [
          { title: t(''Provincia''), dataIndex: ''stateName'', key: ''stateName'', width: 150 },
          { title: t(''Ciudad''), dataIndex: ''cityName'', key: ''cityName'', width: 150 },
          { title: t(''Corregimiento''), dataIndex: ''sectorName'', key: ''sectorName'', width: 170 },
          { title: t(''Id''), dataIndex: ''id'', key: ''id'', width: 100 },
          { title: t(''Edificio''), dataIndex: ''name'', key: ''name'' },
        ];
    columns.push({ title: t(''Acciones''), key: ''actions'', width: 100,
      render: (_, row) => <Button type="link" size="small" onClick={() => openCatalogModal(row)}>{t(''Editar'')}</Button> });
    return <Spin spinning={catalogLoading}><Table size="small" rowKey={(row) => String(row.id)} columns={columns}
      dataSource={catalogRows} locale={{ emptyText: t(''No hay registros para el corregimiento seleccionado'') }}
      pagination={{ pageSize: 20, showSizeChanger: false }} /></Spin>;
  };

  const titleRender = (node) =>
    node.ambiguousCount ? (
      <span>
        {node.title} <Tag color="orange">{t(''rama ambigua'')}</Tag>
      </span>
    ) : (
      <span>{node.title}</span>
    );

  return (
    <DefaultPage title={t(''Lugares'')}>
      <Row>
        <Col span={8} style={{ paddingRight: 6 }}>
          <Card size="small" title={t(''Ubicacion geografica'')} bodyStyle={{ height: PANEL_H, overflow: ''auto'' }}>
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
          <Card size="small" title={t(''Detalle'')} bodyStyle={{ height: PANEL_H, overflow: ''auto'' }}>
            {renderBar()}
            {catalogError ? <Alert type="error" showIcon style={{ marginBottom: 12 }} message={catalogError} /> : null}
            {truncated ? (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 12 }}
                message={t(''Rama cargada de forma incompleta'')}
                description={
                  t(''Se cargaron'') + '' '' + truncated.got + '' '' + t(''de'') + '' '' + truncated.total + '' '' +
                  t(''registros de'') + '' '' + truncated.label + ''.''
                }
              />
            ) : null}
            {renderBody()}
          </Card>
        </Col>
      </Row>
      <Modal
        title={editingCatalog ? t(''Editar'') + '' '' + entityName : t(''Nuevo'') + '' '' + entityName}
        visible={catalogModal}
        onOk={saveCatalog}
        onCancel={() => { if (!catalogSaving) setCatalogModal(false); }}
        okText={t(''Guardar'')}
        cancelText={t(''Cancelar'')}
        confirmLoading={catalogSaving}
        destroyOnClose
      >
        <div style={{ marginBottom: 14 }}>
          <Typography.Text type="secondary">{t(''Corregimiento'')}</Typography.Text>
          <Input value={selected ? selected.sectorName : ''''} disabled style={{ marginTop: 4 }} />
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
', N'CATALOGOS', N'Mantenimiento de edificios y barriadas', 0);

    INSERT INTO dbo.LiveView (id, name, code, category, operation, multiComponent) VALUES (53, N'SuretyActivityCatalog', N'/**
 * @author Global Development Team
 * @email development@axxis-systems.com
 * @created 2026/09/08
 * @name SuretyActivityCatalog
 * @version 1.0
 * @purpose: Manage the surety activity catalog, including consultation, filtering, creation, and editing.
 */
function SuretyActivityCatalog() {
  const TABLE_ID = 1419;
  const TABLE_NAME = ''tbMaActivi'';
  const VIEW_PATH = String(window.location.hash || window.location.pathname).replace(/^#/,'''').split(''?'')[0];
  const HEADER = [''cmercado'',''cactividad'',''u_version'',''xactividad'',''pactividad'',''usuario'',''fRegistro'',''usuarioModifica'',''fModifica''];
  const h = React.createElement;
  const box = React.useRef(null);
  const busy = React.useRef(false);
  const generation = React.useRef(0);
  const [rows,setRows] = useState([]);
  const [user,setUser] = useState(null);
  const [rights,setRights] = useState({read:false,write:false,ready:false});
  const [loading,setLoading] = useState(true);
  const [loadError,setLoadError] = useState('''');
  const [page,setPage] = useState(1);
  const [pageSize,setPageSize] = useState(20);
  const [filters,setFilters] = useState({id:'''',name:''''});
  const [draftFilters,setDraftFilters] = useState({id:'''',name:''''});
  const [drawer,setDrawer] = useState(false);
  const [filterError,setFilterError] = useState('''');
  const [modal,setModal] = useState(false);
  const [editing,setEditing] = useState(null);
  const [form,setForm] = useState({name:'''',percent:''0'',version:''''});
  const [formError,setFormError] = useState('''');
  const [saving,setSaving] = useState(false);
  const [wide,setWide] = useState(window.innerWidth>=1100);
  const [tableHeight,setTableHeight] = useState(360);
  const icon = (name, content) => h(''span'',{className:''anticon anticon-''+name,role:''img'',''aria-hidden'':''true''},h(''svg'',{viewBox:''0 0 24 24'',width:''1em'',height:''1em'',fill:''none'',stroke:''currentColor'',strokeWidth:''2'',strokeLinecap:''round'',strokeLinejoin:''round''},content));
  const SearchOutlined = () => icon(''search'',[h(''circle'',{key:''circle'',cx:''10'',cy:''10'',r:''6''}),h(''path'',{key:''path'',d:''M15 15l6 6''})]);
  const ReloadOutlined = () => icon(''reload'',[h(''path'',{key:''path'',d:''M20 11a8 8 0 1 0 2 5''}),h(''path'',{key:''arrow'',d:''M20 5v6h-6''})]);
  const PlusOutlined = () => icon(''plus'',[h(''path'',{key:''vertical'',d:''M12 5v14''}),h(''path'',{key:''horizontal'',d:''M5 12h14''})]);
  function parseArray(value) {
    if(value===null || value===undefined || value==='''') return [];
    const out=typeof value===''string''?JSON.parse(value):value;
    if(!Array.isArray(out)) throw new Error(t(''No se pudieron interpretar los permisos.''));
    return out;
  }
  function permissions(current,actions) {
    const paths=parseArray(current.jPermissions);
    const deniedPath=paths.some(function(p){return typeof p===''string'' && p && (p.indexOf(VIEW_PATH)>=0 || VIEW_PATH.indexOf(p)===0);});
    let denied=[];
    (current.Groups||[]).forEach(function(m){if(!m.Group)throw new Error(t(''No se pudieron comprobar los permisos del grupo.''));denied=denied.concat(parseArray(m.Group.jActions));});
    function deniedCommand(cmd) {
      return actions.some(function(a){
        if(denied.indexOf(a.code)<0 || (a.cmd!==cmd && a.cmd!==''*''))return false;
        if(!a.data)return true;
        const expression=String(a.data).trim();
        const wrapped=expression.match(/^\$\.\.\[\?\((.*)\)\]$/);
        const match=(wrapped?wrapped[1]:expression).match(/^\s*@\.?operation\s*==\s*[''"](GET|ADD|UPDATE|DELETE)[''"]\s*$/i);
        if(match)return match[1].toUpperCase()===(cmd===''AddOrUpdateTable''?''UPDATE'':''GET'');
        return true;
      });
    }
    const read=!!current.email && !current.blocked && !deniedPath && !deniedCommand(''GetTables'');
    return {read:read,write:read && !deniedCommand(''AddOrUpdateTable'') && !deniedCommand(''DoQuery''),ready:true};
  }
  function checked(result,fallback) {
    if(!result || result.ok!==true)throw new Error((result && result.msg)||t(fallback));
    return result.outData;
  }
  function decode(entity) {
    if(!entity || Number(entity.id)!==TABLE_ID || entity.name!==TABLE_NAME)throw new Error(t(''No se pudo verificar el origen del catálogo.''));
    const data=JSON.parse(entity.data);
    if(!Array.isArray(data) || JSON.stringify(data[0])!==JSON.stringify(HEADER))throw new Error(t(''El catálogo no tiene el formato esperado.''));
    return data;
  }
  function mapRows(data) {
    return data.slice(1).map(function(row,index){return {key:String(row[1])+''-''+index,id:String(row[1]),version:row[2]==null?'''':String(row[2]),name:String(row[3]||'''').trim(),percent:row[4],createdBy:row[5],createdAt:row[6],modifiedBy:row[7],modifiedAt:row[8],raw:row.slice()};});
  }
  function fetchCatalog() {
    return exe(''GetTables'',{filter:''id=''+TABLE_ID,size:1}).then(function(r){const data=checked(r,''No se pudo consultar el catálogo.'');return decode(data && data[0]);});
  }
  function loadAccess() {
    return Promise.all([exe(''GetCurrentUser'',{}),exe(''RepoActionCatalog'',{operation:''GET'',size:1000})]).then(function(res){
      const current=checked(res[0],''No se pudo identificar al usuario.'');
      const actions=checked(res[1],''No se pudieron comprobar los permisos.'');
      if(!current || !Array.isArray(actions))throw new Error(t(''No se pudieron comprobar los permisos.''));
      const access=permissions(current,actions);setUser(current);setRights(access);
      if(!access.read)setRows([]);
      return {current:current,access:access};
    }).catch(function(e){setRights({read:false,write:false,ready:true});setRows([]);throw e;});
  }
  function refresh() {
    const run=++generation.current;
    setLoading(true);setLoadError('''');
    return loadAccess().then(function(auth){
      if(!auth.access.read)throw new Error(t(''No tiene permiso para consultar este catálogo.''));
      return fetchCatalog();
    }).then(function(data){if(run===generation.current)setRows(mapRows(data));}).catch(function(e){if(run===generation.current)setLoadError(e.message||t(''No se pudo consultar el catálogo.''));}).then(function(){if(run===generation.current)setLoading(false);});
  }
  useEffect(function(){refresh();return function(){generation.current++;};},[]);
  useEffect(function(){
    let frame;
    function measure(){
      if(!box.current)return;
      const body=box.current.querySelector(''.ant-table-body'');
      const footer=box.current.querySelector(''.ant-pagination'');
      const bottom=Math.min(box.current.getBoundingClientRect().bottom,window.innerHeight-12);
      const top=body?body.getBoundingClientRect().top:box.current.getBoundingClientRect().top+100;
      setTableHeight(Math.max(120,bottom-top-(footer?footer.getBoundingClientRect().height:32)-40));
    }
    function resize(){setWide(window.innerWidth>=1100);window.cancelAnimationFrame(frame);frame=window.requestAnimationFrame(measure);}
    resize();window.addEventListener(''resize'',resize);
    const observer=typeof ResizeObserver!==''undefined''?new ResizeObserver(resize):null;
    if(observer && box.current)observer.observe(box.current);
    return function(){window.removeEventListener(''resize'',resize);window.cancelAnimationFrame(frame);if(observer)observer.disconnect();};
  },[wide,filters,loadError,rights.ready,rights.write]);
  function normalize(s){return String(s||'''').toLocaleLowerCase();}
  const visible=rows.filter(function(r){return (filters.id==='''' || Number(r.id)===Number(filters.id)) && (!filters.name.trim() || normalize(r.name).indexOf(normalize(filters.name.trim()))>=0);});
  const currentPage=Math.min(page,Math.max(1,Math.ceil(visible.length/pageSize)));
  function openNew(){if(!rights.write || busy.current)return;setEditing(null);setForm({name:'''',percent:''0'',version:''''});setFormError('''');setModal(true);}
  function openEdit(row){if(!rights.write || busy.current)return;setEditing(row);setForm({name:row.name,percent:String(row.percent),version:row.version});setFormError('''');setModal(true);}
  function patchForm(key,value){setForm(function(prev){const next=Object.assign({},prev);next[key]=value;return next;});}
  function date(value){if(!value)return ''—'';const utc=moment.utc(String(value).replace('' '',''T''));if(!utc.isValid())return String(value);return user && user.timezone && momentTimezone.tz.zone(user.timezone)?utc.tz(user.timezone).format(''DD/MM/YYYY HH:mm:ss''):utc.local().format(''DD/MM/YYYY HH:mm:ss'');}
  function money(value){const n=Number(value);return Number.isFinite(n)?n.toFixed(2):String(value||'''');}
  function save(){
    if(busy.current || !rights.write)return;
    const name=form.name.trim();
    if(!name){setFormError(t(''El nombre de la actividad es obligatorio.''));return;}
    const raw=String(form.percent).trim().replace('','',''.'');
    if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw) || !Number.isFinite(Number(raw)) || Math.abs(Number(raw))*100>Number.MAX_SAFE_INTEGER){setFormError(t(''Introduzca un porcentaje numérico válido dentro del rango admitido.''));return;}
    const percent=(Math.round((Number(raw)+Number.EPSILON)*100)/100).toFixed(2);
    busy.current=true;setSaving(true);setFormError('''');
    let nextData;
    loadAccess().then(function(auth){
      if(!auth.access.write)throw new Error(t(''No tiene permiso para guardar este catálogo.''));
      return Promise.all([fetchCatalog(),Promise.resolve(auth.current),exe(''DoQuery'',{sql:''SELECT SYSUTCDATETIME() AS utcNow''})]);
    }).then(function(results){
      const current=results[1];
      const clock=checked(results[2],''No se pudo obtener la fecha de auditoría.'');
      if(!clock || !clock[0] || !clock[0].utcNow)throw new Error(t(''No se pudo obtener la fecha de auditoría.''));
      const timestamp=String(clock[0].utcNow).replace(/Z$/,'''')+''Z'';
      nextData=results[0].map(function(r){return r.slice();});
      let row;
      if(editing){
        const matches=[];for(let i=1;i<nextData.length;i++)if(String(nextData[i][1])===editing.id)matches.push(i);
        if(matches.length!==1)throw new Error(t(''La actividad no existe o su identificador está duplicado. Actualice el listado.''));
        const index=matches[0];
        if(JSON.stringify(nextData[index])!==JSON.stringify(editing.raw))throw new Error(t(''La actividad cambió desde que se abrió. Cancele y vuelva a editarla.''));
        row=nextData[index].slice();row[0]=row[1];row[2]=form.version;row[3]=name;row[4]=percent;row[7]=current.email;row[8]=timestamp;nextData[index]=row;
      }else{
        let max=0;const used={};for(let i=1;i<nextData.length;i++){const id=Number(nextData[i][1]);if(!Number.isSafeInteger(id) || id<0 || used[String(id)])throw new Error(t(''El catálogo tiene identificadores inválidos o duplicados.''));used[String(id)]=true;max=Math.max(max,id);}
        if(!Number.isSafeInteger(max+1))throw new Error(t(''No se pudo generar el identificador.''));
        row=[String(max+1),String(max+1),form.version,name,percent,current.email,timestamp,'''',''''];nextData.push(row);
      }
      return exe(''AddOrUpdateTable'',{id:TABLE_ID,name:TABLE_NAME,data:JSON.stringify(nextData)});
    }).then(function(r){
      checked(r,''No se pudo guardar la actividad.'');
      setRows(mapRows(nextData));setModal(false);setEditing(null);
      A.message.success(t(''Actividad guardada correctamente.''));
      return refresh();
    }).catch(function(e){setFormError(e.message||t(''No se pudo guardar. Compruebe la conexión y vuelva a intentarlo.''));}).then(function(){busy.current=false;setSaving(false);});
  }
  function applyFilters(){
    const id=draftFilters.id.trim();
    if(id && (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)))){setFilterError(t(''El Id debe ser un entero no negativo.''));return;}
    setFilters({id:id,name:draftFilters.name});setPage(1);setDrawer(false);setFilterError('''');
  }
  function clearFilters(){setFilters({id:'''',name:''''});setDraftFilters({id:'''',name:''''});setPage(1);setFilterError('''');setDrawer(false);}
  const columns=[
    {title:t(''Id''),dataIndex:''id'',width:wide?65:45},
    {title:t(''Nombre''),dataIndex:''name'',ellipsis:false,render:function(value){return h(''span'',{style:{overflowWrap:''anywhere''}},value);}},
    {title:t(''Porcentaje''),dataIndex:''percent'',width:wide?100:85,align:''right'',render:money}
  ];
  if(wide)columns.push({title:t(''Versión''),dataIndex:''version'',width:70},{title:t(''Creado por''),dataIndex:''createdBy'',width:145,ellipsis:true},{title:t(''Fecha de creación''),dataIndex:''createdAt'',width:150,render:date},{title:t(''Modificado por''),dataIndex:''modifiedBy'',width:145,ellipsis:true},{title:t(''Fecha de modificación''),dataIndex:''modifiedAt'',width:150,render:date});
  if(rights.write)columns.push({title:wide?t(''Acciones''):t(''Editar''),key:''actions'',width:wide?90:64,render:function(_,row){return h(A.Button,{type:''link'',size:''small'',disabled:saving,onClick:function(){openEdit(row);},''aria-label'':t(''Editar'')+'' ''+row.id},t(''Editar''));}});
  const details=function(row){return h(A.Descriptions,{size:''small'',column:1},h(A.Descriptions.Item,{label:t(''Versión'')},row.version||''—''),h(A.Descriptions.Item,{label:t(''Creado por'')},row.createdBy||''—''),h(A.Descriptions.Item,{label:t(''Fecha de creación'')},date(row.createdAt)),h(A.Descriptions.Item,{label:t(''Modificado por'')},row.modifiedBy||''—''),h(A.Descriptions.Item,{label:t(''Fecha de modificación'')},date(row.modifiedAt)));};
  const activeFilters = filters.id!=='''' || filters.name.trim()
    ? h(''div'',{style:{marginBottom:8}},
        h(A.Tag,null,t(''Id'')+'': ''+(filters.id||''—'')),
        h(A.Tag,null,t(''Nombre'')+'': ''+(filters.name||''—'')),
        h(A.Button,{type:''link'',size:''small'',onClick:clearFilters},t(''Limpiar filtros''))
      )
    : null;
  const activityTable = h(''div'',{style:{flex:1,minHeight:0,minWidth:0}},
    h(A.Table,{columns:columns,dataSource:rights.read?visible:[],rowKey:''key'',loading:loading,size:''small'',tableLayout:''fixed'',scroll:{y:tableHeight},
      pagination:{current:currentPage,pageSize:pageSize,total:rights.read?visible.length:0,showSizeChanger:true,pageSizeOptions:[''10'',''20'',''50''],
        showTotal:function(total){return total+'' ''+t(''actividades'');},onChange:function(p,s){setPage(p);setPageSize(s);}},
      locale:{emptyText:t(''No se encontraron actividades.'')},expandable:wide?undefined:{expandedRowRender:details,columnWidth:28}})
  );
  const filterDrawer = h(A.Drawer,{title:t(''Filtrar actividades''),visible:drawer,onClose:function(){setDrawer(false);},width:''min(400px, 100vw)'',destroyOnClose:true,
      footer:h(A.Space,null,h(A.Button,{onClick:clearFilters},t(''Limpiar'')),h(A.Button,{type:''primary'',onClick:applyFilters},t(''Aplicar'')))},
    filterError?h(A.Alert,{type:''error'',message:filterError,style:{marginBottom:12}}):null,
    h(''label'',{htmlFor:''axx339-filter-id''},t(''Id'')),
    h(A.Input,{id:''axx339-filter-id'',value:draftFilters.id,inputMode:''numeric'',onChange:function(e){setDraftFilters(Object.assign({},draftFilters,{id:e.target.value}));},style:{marginBottom:16}}),
    h(''label'',{htmlFor:''axx339-filter-name''},t(''Nombre'')),
    h(A.Input,{id:''axx339-filter-name'',value:draftFilters.name,onChange:function(e){setDraftFilters(Object.assign({},draftFilters,{name:e.target.value}));},onPressEnter:applyFilters})
  );
  const activityModal = h(A.Modal,{title:editing?t(''Editar actividad'')+'' ''+editing.id:t(''Nueva actividad''),visible:modal,width:560,destroyOnClose:true,
      maskClosable:!saving,closable:!saving,keyboard:!saving,onCancel:function(){if(!busy.current)setModal(false);},
      footer:h(A.Space,null,h(A.Button,{disabled:saving,onClick:function(){setModal(false);}},t(''Cancelar'')),h(A.Button,{type:''primary'',loading:saving,disabled:!rights.write,onClick:save},t(''Guardar'')))},
    formError?h(A.Alert,{type:''error'',showIcon:true,message:formError,style:{marginBottom:16}}):null,
    editing?h(''div'',{style:{marginBottom:12}},h(''label'',{htmlFor:''axx339-id''},t(''Id'')),h(A.Input,{id:''axx339-id'',value:editing.id,disabled:true})):null,
    h(''div'',{style:{marginBottom:16}},h(''label'',{htmlFor:''axx339-name''},t(''Nombre'')+'' *''),h(A.Input,{id:''axx339-name'',value:form.name,disabled:saving,autoFocus:true,onChange:function(e){patchForm(''name'',e.target.value);}})),
    h(''div'',{style:{marginBottom:16}},h(''label'',{htmlFor:''axx339-percent''},t(''Porcentaje'')),h(A.Input,{id:''axx339-percent'',inputMode:''decimal'',value:form.percent,disabled:saving,onChange:function(e){patchForm(''percent'',e.target.value);}})),
    h(''div'',null,h(''label'',{htmlFor:''axx339-version''},t(''Versión'')),h(A.Input,{id:''axx339-version'',value:form.version,disabled:saving,onChange:function(e){patchForm(''version'',e.target.value);}}))
  );
  const viewStyle=''.surety-activity-catalog{overflow:hidden}.surety-activity-catalog .surety-activity-topbar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:2px;padding:4px;border:1px solid #e6ebf2;border-radius:6px}.surety-activity-catalog .surety-activity-grid{flex:1 1 auto;min-height:0;border:1px solid #cbd1d8}.surety-activity-catalog .ant-table-thead>tr>th{background:#bfbfbf;border-right:1px solid #cbd1d8;border-bottom:1px solid #cbd1d8;font-size:12px;line-height:18px;padding:5px 8px}.surety-activity-catalog .ant-table-tbody>tr>td{border-right:0;border-bottom:1px solid #cbd1d8;font-size:12px;line-height:18px;padding:5px 8px}.surety-activity-catalog .ant-table-tbody>tr:hover>td{background:#b7d7ff}.surety-activity-catalog .ant-btn:disabled{opacity:1;border-color:#6f7b88}'';
  return h(''section'',{ref:box,className:''surety-activity-catalog'',''data-testid'':''surety-activities'',style:{height:''calc(100dvh - 140px)'',minHeight:360,display:''flex'',flexDirection:''column'',minWidth:0,background:''#fff'',padding:12,borderRadius:6,overflow:''hidden''}},
    h(''style'',null,viewStyle),
    h(''div'',{className:''surety-activity-topbar''},
      h(''h2'',{style:{margin:0,fontSize:20}},t(''Actividades (Fianzas)'')),
      h(A.Space,{wrap:true},
        h(A.Button,{type:''primary'',icon:h(SearchOutlined),disabled:!rights.read || saving,onClick:function(){setDraftFilters(filters);setFilterError('''');setDrawer(true);}},t(''Filtrar'')),
        h(A.Button,{icon:h(ReloadOutlined),disabled:!rights.read || loading || saving,onClick:refresh},t(''Actualizar'')),
        rights.write?h(A.Button,{type:''primary'',icon:h(PlusOutlined),disabled:loading || saving,onClick:openNew},t(''Nuevo'')):null
      )
    ),
    loadError?h(A.Alert,{type:''error'',showIcon:true,message:loadError,style:{marginBottom:12}}):null,
    rights.ready && rights.read && !rights.write?h(A.Alert,{type:''info'',message:t(''Consulta: no dispone de permiso para guardar cambios.''),style:{marginBottom:12}}):null,
    rights.read?activeFilters:null,
    h(''div'',{className:''surety-activity-grid'',style:{flex:1,minHeight:0,minWidth:0}},activityTable),
    filterDrawer,
    activityModal
  );
}
', N'Mantenimiento', N'Actividades (Fianzas)', 0);

    INSERT INTO dbo.LiveView (id, name, code, category, operation, multiComponent) VALUES (54, N'ChangeCoverageSuretyEndorsement', N'/**
 * @name  ChangeCoverageSuretyEndorsement
 * @issue AXX-299 / GLOB-1201
 * @purpose Endoso de extension o reduccion de vigencia para Fianzas: calcula el impacto en
 *          prima y facturacion, simula el reaseguro del movimiento y ejecuta el endoso
 *          conservando exactamente los valores mostrados.
 * Se abre con ?policyId=<id>. Todo el calculo vive en cadenas de configuracion:
 *   cmdCalcChangeCoverageSurety   pestania 1 (prorrata, dependientes, impuestos y total)
 *   cmdSimReaChangeCoverageSuretyAxx299 pestania 2 (reaseguro del movimiento, en memoria)
 *   ChangeCoverage / GotoStep / ExeChangeCoverage  ejecucion del endoso y workflow
 *   cmdApplyReaChangeCoverage                           Cession y CessionPart por changeId
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

  const EditableFormattedNumber = function (props) {
    const decimals = props.decimals === undefined ? 2 : props.decimals;
    const [draft, setDraft] = useState(props.value === null || props.value === undefined ? '''' : String(props.value));
    const [focused, setFocused] = useState(false);
    const [valueOnFocus] = useState({ current: '''' });

    useEffect(function () {
      if (!focused) setDraft(props.value === null || props.value === undefined ? '''' : String(props.value));
    }, [props.value, focused]);

    const displayValue = focused || draft === '''' ? draft : Number(draft).toLocaleString(''en-US'', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    return <A.Input size="small" inputMode="decimal" disabled={props.disabled} readOnly={props.readOnly} value={displayValue} style={{ textAlign: ''right'' }}
      onFocus={function () { valueOnFocus.current = draft; setFocused(true); }}
      onChange={function (event) { setDraft(event.target.value.replace(/[^0-9.,-]/g, '''').replace('','', ''.'')); }}
      onBlur={function () {
        setFocused(false);
        const value = draft === '''' || draft === ''-'' || draft === ''.'' ? 0 : Number(draft);
        const original = valueOnFocus.current === '''' ? 0 : Number(valueOnFocus.current);
        if (Number.isFinite(value) && value !== original) props.onCommit(value);
        setDraft(Number.isFinite(value) ? value.toFixed(decimals) : (0).toFixed(decimals));
      }} />;
  };

  const [policyId, setPolicyId] = useState(0);
  const [policy, setPolicy] = useState(null);
  const [eligible, setEligible] = useState([]);
  const [covCode, setCovCode] = useState(null);
  const [newEnd, setNewEnd] = useState(null);
  const [surcharge, setSurcharge] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [calc, setCalc] = useState(null);
  const [sim, setSim] = useState(null);
  const [tab, setTab] = useState(''calc'');
  const [loading, setLoading] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [modal, setModal] = useState(false);
  const [note, setNote] = useState('''');
  const [noteTouched, setNoteTouched] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [key, setKey] = useState(null);
  const [altoGrilla, setAltoGrilla] = useState(180);
  // 🔴 Cerrojo contra doble clic: `running` es estado y no cambia entre dos clics del MISMO
  // lote de React, asi que tres clics seguidos disparaban tres ejecuciones. El objeto que
  // devuelve useState conserva su identidad entre renders y se muta de forma sincrona.
  const [lock] = useState({ busy: false });
  const [buscarPoliza, setBuscarPoliza] = useState('''');
  const [splits, setSplits] = useState([]);
  const [baseCessions, setBaseCessions] = useState([]);
  const [reinsuranceBrokers, setReinsuranceBrokers] = useState([]);
  const [reinsuranceContacts, setReinsuranceContacts] = useState([]);
  const [coinsuranceCessions, setCoinsuranceCessions] = useState([]);
  const [coinsuranceContacts, setCoinsuranceContacts] = useState([]);
  const [contactDirectory, setContactDirectory] = useState({});
  const [reaDetailTab, setReaDetailTab] = useState(''distribution'');
  const [selectedReinsuranceKey, setSelectedReinsuranceKey] = useState(null);
  const [reinsurersReady, setReinsurersReady] = useState(false);
  const [selectedReinsuranceLineKey, setSelectedReinsuranceLineKey] = useState(null);
  const [reinsuranceConfirmed, setReinsuranceConfirmed] = useState(false);

  const money = function (v) { return Number(Number(v || 0).toFixed(2)); };
  const txt = function (v) { return String(v === null || v === undefined ? '''' : v).trim(); };
  const day10 = function (v) { return txt(v).slice(0, 10); };
  const fmt = function (v) {
    const n = Number(v || 0);
    return n.toLocaleString(''en-US'', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  function coinsuranceNumber(value) {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number : 0;
  }

  function coinsurancePercentage() {
    return Math.max(0, Math.min(100, (coinsuranceCessions || []).reduce(function (sum, row) {
      return sum + coinsuranceNumber(row.percentage);
    }, 0)));
  }

  function reinsuranceBaseFactor() {
    return (100 - coinsurancePercentage()) / 100;
  }

  function finalCoinsuranceBase() {
    return (Array.isArray(calc && calc.finalCoverages) ? calc.finalCoverages : [])
      .reduce(function (total, coverage) {
        total.sum += coinsuranceNumber(coverage.limit || coverage.sumInsured);
        total.premium += coinsuranceNumber(coverage.premium || coverage.newPremium);
        return total;
      }, { sum: 0, premium: 0 });
  }

  function coinsuranceRate(field) {
    const base = (coinsuranceCessions || []).reduce(function (total, cession) {
      total.premium += coinsuranceNumber(cession.premiumCeded || cession.premium);
      total.value += coinsuranceNumber(cession[field]);
      return total;
    }, { premium: 0, value: 0 });
    return base.premium ? base.value / base.premium : 0;
  }

  function contractCoinsuranceTotals(contract) {
    const percentage = coinsurancePercentage();
    const grossSum = Number(contract.sum || 0);
    const grossPremium = Number(contract.movement || 0);
    return {
      percentage: percentage,
      sum: money(grossSum * percentage / 100),
      premium: money(grossPremium * percentage / 100),
      commission: money(grossPremium * percentage / 100 * coinsuranceRate(''commission'')),
      tax: money(grossPremium * percentage / 100 * coinsuranceRate(''tax''))
    };
  }

  function finalCoverageDistributionPremium(group, row) {
    return money(finalCoveragePremium(group, row) * reinsuranceBaseFactor());
  }

  function finalCoverageDistributionSum(group, row) {
    return money(finalCoverageSum(group, row) * reinsuranceBaseFactor());
  }
  const FolderIcon = function () {
    return <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M3 5.5A1.5 1.5 0 0 1 4.5 4h5l2 2h8A1.5 1.5 0 0 1 21 7.5v11A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5v-13Zm2 2v10.5h14V8.5h-8.33l-2-2H5Z" />
    </svg>;
  };
  const ReturnIcon = function () {
    return <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M10.7 5.3 4 12l6.7 6.7 1.4-1.4L7.8 13H20v-2H7.8l4.3-4.3-1.4-1.4Z" />
    </svg>;
  };
  const signo = function (v) {
    const n = Number(v || 0);
    return n > 0 ? ''axx-monto-pos'' : (n < 0 ? ''axx-monto-neg'' : ''axx-monto-cero'');
  };
  const conSigno = function (v) {
    const n = Number(v || 0);
    return (n > 0 ? ''+'' : '''') + fmt(n);
  };

  const numberFrom = function (row, names) {
    for (let i = 0; i < names.length; i++) {
      const value = row && row[names[i]];
      if (value !== undefined && value !== null && value !== '''') return Number(value) || 0;
    }
    return 0;
  };

  const rowSumMovement = function (row) {
    return numberFrom(row, [''sumInsuredMovement'', ''sumMovement'', ''sumInsured'', ''sa'']);
  };

  function getBaseCoverageRows(group, row) {
    // Todas las lineas complementarias deben partir del mismo estado final de
    // la cobertura. Buscar por linea producia bases distintas entre CP y FAC.
    return (baseCessions || []).filter(function (cession) {
      return String(cession.contractId) === String(group.contractId)
        && String(cession.coverageCode || cession.coverageId || '''') === String(row.coverageCode || row.code || '''');
    });
  }

  function participantCoverageCode(group, participant) {
    const direct = participant && (participant.coverageCode || participant.coverageId || participant.coverage);
    if (direct !== undefined && direct !== null && direct !== '''') return String(direct);
    const cession = (baseCessions || []).find(function (item) {
      return String(item.id) === String(participant && participant.cessionId);
    });
    return cession ? String(cession.coverageCode || cession.coverageId || '''') : '''';
  }

  function finalCoveragePremium(group, row) {
    const base = getBaseCoverageRows(group, row);
    const persisted = base.reduce(function (sum, cession) { return sum + numberFrom(cession, [''premium'']); }, 0);
    return money(persisted + numberFrom(row, [''premiumMovement'']));
  }

  function finalCoverageSum(group, row) {
    const base = getBaseCoverageRows(group, row);
    const persisted = base.reduce(function (sum, cession) { return sum + numberFrom(cession, [''sumInsured'']); }, 0);
    return money(persisted || rowSumMovement(row));
  }

  function recalculateReinsuranceTotals(group) {
    const rows = group.rows || [];
    const totals = Object.assign({}, group.totals || {});
    // `movement` y `sumMovement` representan la variacion devuelta por el
    // comando. No deben reconstruirse desde los montos de cobertura al guardar,
    // porque esos montos pueden representar el total de la cobertura.
    if (totals.movement === undefined) {
      totals.movement = money(rows.reduce(function (sum, row) { return sum + numberFrom(row, [''premiumMovement'']); }, 0));
    }
    totals.cedant = money(rows.reduce(function (sum, row) { return sum + numberFrom(row, [''premiumCedant'']); }, 0));
    totals.re = money(rows.reduce(function (sum, row) { return sum + numberFrom(row, [''premiumRe'']); }, 0));
    totals.commission = money(rows.reduce(function (sum, row) { return sum + numberFrom(row, [''commission'', ''comissionCedant'']); }, 0));
    totals.tax = money(rows.reduce(function (sum, row) { return sum + numberFrom(row, [''tax'']); }, 0));
    if (totals.sumMovement === undefined) {
      // Este endoso modifica vigencia, no suma asegurada.
      totals.sumMovement = 0;
    }
    totals.sumCedant = money(rows.reduce(function (sum, row) { return sum + numberFrom(row, [''sumInsuredCedant'']); }, 0));
    totals.sumRe = money(rows.reduce(function (sum, row) { return sum + numberFrom(row, [''sumInsuredRe'']); }, 0));
    totals.participantPremium = money(getLineParticipants(group).reduce(function (sum, row) { return sum + numberFrom(row, [''premium'']); }, 0));
    group.totals = totals;
    return group;
  }

  function ensureSimGroup(next, groupKey) {
    const existing = (next.contracts || []).find(function (item) {
      return String(item.contractId) + ''-'' + String(item.lineId) === groupKey;
    });
    if (existing) return existing;
    const separator = groupKey.indexOf(''-'');
    const contractId = separator >= 0 ? groupKey.slice(0, separator) : groupKey;
    const lineId = separator >= 0 ? groupKey.slice(separator + 1) : '''';
    const group = {
      contractId: contractId,
      lineId: lineId,
      rows: (calc && calc.rows || []).map(function (row) {
        return {
          coverageCode: row.code,
          cover: row.name || row.cover || row.code,
          premiumMovement: numberFrom(row, [''variation'', ''premiumMovement'']),
          proratedMovement: numberFrom(row, [''prorated'']),
          sumInsuredMovement: numberFrom(row, [''sumInsuredMovement'', ''sumInsured'', ''sa'']),
          premiumCedant: 0,
          premiumRe: 0,
          sumInsuredCedant: 0,
          sumInsuredRe: 0,
          commission: 0,
          tax: 0,
          proportionCed: 0,
          proportionRe: 0
        };
      }),
      participants: [],
      contractParticipants: [],
      totals: { distributionPercentageCed: 0, distributionPercentageRe: 0 }
    };
    recalculateReinsuranceTotals(group);
    next.contracts = next.contracts || [];
    next.contracts.push(group);
    return group;
  }

  function distributeContractValue(groupKey, field, value) {
    if (!sim) return;
    const target = Number(value || 0);
    setSim(function (current) {
      const next = JSON.parse(JSON.stringify(current));
      let group = (next.contracts || []).find(function (item) {
        return String(item.contractId) + ''-'' + String(item.lineId) === groupKey;
      });
      if (!group) group = ensureSimGroup(next, groupKey);
      const rows = group.rows || [];
      const sourceField = field === ''premiumCedant'' || field === ''premiumRe''
        ? ''premiumMovement''
        : (field === ''sumInsuredCedant'' || field === ''sumInsuredRe'' ? ''sumInsuredMovement'' : field);
      const weights = rows.map(function (row) {
        return field === ''sumInsuredCedant'' || field === ''sumInsuredRe''
          ? Math.abs(rowSumMovement(row))
          : Math.abs(numberFrom(row, [sourceField]));
      });
      const weightTotal = weights.reduce(function (sum, item) { return sum + item; }, 0);
      let assigned = 0;
      rows.forEach(function (row, index) {
        const amount = index === rows.length - 1
          ? money(target - assigned)
          : money(weightTotal ? target * weights[index] / weightTotal : 0);
        row[field] = amount;
        assigned = money(assigned + amount);
      });
      recalculateReinsuranceTotals(group);
      return next;
    });
  }

  function setManualContractAmount(groupKey, field, value) {
    if (!sim) return;
    setReinsurersReady(false);
    setReaDetailTab(''distribution'');
    const amount = money(value);
    setSim(function (current) {
      const next = JSON.parse(JSON.stringify(current));
      let group = (next.contracts || []).find(function (item) {
        return String(item.contractId) + ''-'' + String(item.lineId) === groupKey;
      });
      if (!group) group = ensureSimGroup(next, groupKey);
      group.totals = Object.assign({}, group.totals || {}, { [''manual'' + field]: amount });
      return next;
    });
  }

  function getGroupCurrentAmount(group, field) {
    const names = Array.isArray(field) ? field : [field];
    const current = (group.rows || []).reduce(function (sum, row) { return sum + numberFrom(row, names); }, 0);
    const persisted = (baseCessions || []).filter(function (row) {
      return String(row.contractId) === String(group.contractId) && String(row.lineId) === String(group.lineId);
    }).reduce(function (sum, row) { return sum + numberFrom(row, names); }, 0);
    return money(current + persisted);
  }

  function getContractTotal(group, field, fallback) {
    const summary = (contractRows || []).find(function (row) {
      return String(row.contractId) === String(group.contractId);
    });
    if (!summary) return fallback;
    return Number(summary[field] || 0);
  }

  function validateDistributionBeforeSave() {
    const errors = [];
    if (!calc || !sim || !Array.isArray(sim.contracts)) {
      return [t(''La distribución de reaseguro todavía no está cargada.'')];
    }
    (contractRows || []).forEach(function (contract) {
      const rows = getDistributionRows(contract);
      const totalPercentage = rows.reduce(function (sum, row) {
        return sum + (row.isCoinsurance ? 0 : Number(row.percentage || 0));
      }, 0);
      const totalSum = rows.reduce(function (sum, row) { return sum + Number(row.sum || 0); }, 0);
      const totalPremium = rows.reduce(function (sum, row) { return sum + Number(row.premium || 0); }, 0);
      const retentionPremium = rows.reduce(function (sum, row) {
        return sum + (row.isRetention ? Number(row.premium || 0) : 0);
      }, 0);
      const cededPremium = rows.reduce(function (sum, row) {
        return sum + (row.canViewReinsurers || row.isCoinsurance ? Number(row.premium || 0) : 0);
      }, 0);
      if (!percentageCloseTo100(totalPercentage)) {
        errors.push(t(''Contrato'') + '' '' + contract.contractId + '': '' + t(''la distribución debe sumar 100%.''));
      }
      if (!closeEnough(totalSum, contract.sum)) {
        errors.push(t(''Contrato'') + '' '' + contract.contractId + '': '' + t(''la suma distribuida no coincide con la suma del contrato.'') + '' '' + fmt(totalSum) + '' / '' + fmt(contract.sum));
      }
      if (!closeEnough(totalPremium, contract.movement)) {
        errors.push(t(''Contrato'') + '' '' + contract.contractId + '': '' + t(''la prima distribuida no coincide con la prima del contrato.'') + '' '' + fmt(totalPremium) + '' / '' + fmt(contract.movement));
      }
      if (!closeEnough(retentionPremium + cededPremium, contract.movement)) {
        errors.push(t(''Contrato'') + '' '' + contract.contractId + '': '' + t(''la prima retenida más la prima cedida no coincide con la prima total.''));
      }
    });
    const expectedPremium = money(Number(calc.billing && calc.billing.premium ? calc.billing.premium.after : 0)
      - Number(calc.billing && calc.billing.premium ? calc.billing.premium.before : 0));
    if (!closeEnough(numberFrom(sim, [''movement'']), expectedPremium)) {
      errors.push(t(''El movimiento distribuido no coincide con el movimiento del endoso.'') + '' '' + fmt(numberFrom(sim, [''movement''])) + '' / '' + fmt(expectedPremium));
    }
    return errors;
  }

  function guardarDistribucionMemoria() {
    if (!sim) return;
    setReinsuranceConfirmed(false);
    const distributionErrors = validateDistributionBeforeSave();
    if (distributionErrors.length) {
      const validationMessage = distributionErrors.join('' '');
      setError(validationMessage);
      A.message.error(validationMessage);
      return;
    }
    setError(null);
    setReinsurersReady(false);
    setReaDetailTab(''distribution'');
    setSim(function (current) {
      const next = JSON.parse(JSON.stringify(current));
      const allocate = function (group, rows, field, target, weight) {
        const weights = rows.map(function (row) { return Math.abs(weight(group, row)); });
        const totalWeight = weights.reduce(function (sum, value) { return sum + value; }, 0);
        let assigned = 0;
        rows.forEach(function (row, index) {
          const amount = index === rows.length - 1
            ? money(target - assigned)
            : money(totalWeight ? target * weights[index] / totalWeight : 0);
          row[field] = amount;
          assigned = money(assigned + amount);
        });
      };
      (next.contracts || []).forEach(function (group) {
        const rows = group.rows || [];
        const totals = group.totals || {};
        if (totals.distributionPercentageCed !== undefined) {
          const percentageCed = Math.max(0, Math.min(100, Number(totals.distributionPercentageCed) || 0)) / 100;
          rows.forEach(function (row) {
            row.proportionCed = percentageCed;
            const finalPremium = finalCoverageDistributionPremium(group, row);
            const finalSum = finalCoverageDistributionSum(group, row);
            row.premiumCedant = money(finalPremium * percentageCed);
            row.sumInsuredCedant = money(finalSum * percentageCed);
          });
        }
        if (totals.distributionPercentageRe !== undefined) {
          const percentageRe = Math.max(0, Math.min(100, Number(totals.distributionPercentageRe) || 0)) / 100;
          rows.forEach(function (row) {
            row.proportionRe = percentageRe;
            const finalPremium = finalCoverageDistributionPremium(group, row);
            const finalSum = finalCoverageDistributionSum(group, row);
            row.premiumRe = money(finalPremium * percentageRe);
            row.sumInsuredRe = money(finalSum * percentageRe);
          });
        }
        if (totals.manualRetentionSum !== undefined) allocate(group, rows, ''sumInsuredCedant'', Number(totals.manualRetentionSum) || 0, finalCoverageSum);
        if (totals.manualRetentionPremium !== undefined) allocate(group, rows, ''premiumCedant'', Number(totals.manualRetentionPremium) || 0, finalCoveragePremium);
        if (totals.manualCededSum !== undefined) allocate(group, rows, ''sumInsuredRe'', Number(totals.manualCededSum) || 0, finalCoverageSum);
        if (totals.manualCededPremium !== undefined) allocate(group, rows, ''premiumRe'', Number(totals.manualCededPremium) || 0, finalCoveragePremium);
        if (totals.commissionPercentage !== undefined) {
          const rate = (Number(totals.commissionPercentage) || 0) / 100;
          rows.forEach(function (row) { row.commission = money(numberFrom(row, [''premiumRe'']) * rate); });
        }
        if (totals.taxPercentage !== undefined) {
          const rate = (Number(totals.taxPercentage) || 0) / 100;
          rows.forEach(function (row) { row.tax = money(numberFrom(row, [''premiumRe'']) * rate); });
        }
        if (totals.manualCommission !== undefined) allocate(group, rows, ''commission'', Number(totals.manualCommission) || 0, function (item, row) { return numberFrom(row, [''premiumRe'']); });
        if (totals.manualTax !== undefined) allocate(group, rows, ''tax'', Number(totals.manualTax) || 0, function (item, row) { return numberFrom(row, [''premiumRe'']); });

        recalculateReinsuranceTotals(group);
        const participants = group.participants || [];
        participants.forEach(function (participant) {
          const row = rows.find(function (item) {
            return String(item.coverageCode) === participantCoverageCode(group, participant);
          });
          const split = (Number(participant.split) || 0) / 100;
          participant.sumInsured = money(numberFrom(row || group.totals, row ? [''sumInsuredRe''] : [''sumRe'']) * split);
          participant.premium = money(numberFrom(row || group.totals, row ? [''premiumRe''] : [''re'']) * split);
          participant.commission = money(numberFrom(row || group.totals, row ? [''commission''] : [''commission'']) * split);
          participant.tax = money(numberFrom(row || group.totals, row ? [''tax''] : [''tax'']) * split);
        });
        // Ajusta automaticamente el ultimo centavo por cobertura para que la
        // suma de aceptantes coincida exactamente con la linea cedida.
        redistributeParticipantRounding(group);
        delete totals.manualRetentionSum;
        delete totals.manualRetentionPremium;
        delete totals.manualCededSum;
        delete totals.manualCededPremium;
        delete totals.manualCommission;
        delete totals.manualTax;
      });
      const byCoverage = {};
      (next.contracts || []).forEach(function (group) {
        (group.rows || []).forEach(function (row) {
          const code = String(row.coverageCode);
          if (!byCoverage[code]) byCoverage[code] = { rows: [], expectedPremium: finalCoverageDistributionPremium(group, row), expectedSum: finalCoverageDistributionSum(group, row) };
          byCoverage[code].rows.push({ group: group, row: row });
        });
      });
      Object.keys(byCoverage).forEach(function (code) {
        const item = byCoverage[code];
        const premium = item.rows.reduce(function (total, pair) {
          return total + Number(pair.row.premiumCedant || 0) + Number(pair.row.premiumRe || 0);
        }, 0);
        const sum = item.rows.reduce(function (total, pair) {
          return total + Number(pair.row.sumInsuredCedant || 0) + Number(pair.row.sumInsuredRe || 0);
        }, 0);
        const last = item.rows.slice().reverse().find(function (pair) {
          return Math.abs(Number(pair.row.premiumCedant || 0)) > 0.01
            || Math.abs(Number(pair.row.premiumRe || 0)) > 0.01
            || Math.abs(Number(pair.row.sumInsuredCedant || 0)) > 0.01
            || Math.abs(Number(pair.row.sumInsuredRe || 0)) > 0.01;
        });
        if (!last) return;
        const premiumField = Number(last.row.premiumRe || 0) > 0.01 ? ''premiumRe'' : ''premiumCedant'';
        const sumFieldName = Number(last.row.sumInsuredRe || 0) > 0.01 ? ''sumInsuredRe'' : ''sumInsuredCedant'';
        last.row[premiumField] = money(Number(last.row[premiumField] || 0) + item.expectedPremium - premium);
        last.row[sumFieldName] = money(Number(last.row[sumFieldName] || 0) + item.expectedSum - sum);
      });
      (next.contracts || []).forEach(function (group) {
        recalculateReinsuranceTotals(group);
        (group.participants || []).forEach(function (participant) {
          const row = (group.rows || []).find(function (item) {
            return String(item.coverageCode) === participantCoverageCode(group, participant);
          });
          const split = (Number(participant.split) || 0) / 100;
          participant.sumInsured = money(numberFrom(row || group.totals, row ? [''sumInsuredRe''] : [''sumRe'']) * split);
          participant.premium = money(numberFrom(row || group.totals, row ? [''premiumRe''] : [''re'']) * split);
          participant.commission = money(numberFrom(row || group.totals, row ? [''commission''] : [''commission'']) * split);
          participant.tax = money(numberFrom(row || group.totals, row ? [''tax''] : [''tax'']) * split);
        });
        redistributeParticipantRounding(group);
      });
      return next;
    });
    A.message.success(t(''La distribución cuadra y fue aplicada correctamente.''));
  }

  function editContractPercentage(groupKey, field, value) {
    if (!sim) return;
    setReinsurersReady(false);
    setReaDetailTab(''distribution'');
    setSim(function (current) {
      const next = JSON.parse(JSON.stringify(current));
      let group = (next.contracts || []).find(function (item) {
        return String(item.contractId) + ''-'' + String(item.lineId) === groupKey;
      });
      if (!group) group = ensureSimGroup(next, groupKey);
      const distributionPercentageField = field === ''proportionCed''
        ? ''distributionPercentageCed''
        : ''distributionPercentageRe'';
      const percentageValue = Math.max(0, Math.min(100, Number(value || 0)));
      const totalsBefore = group.totals || {};
      const baseCedSum = getGroupCurrentAmount(group, ''sumInsuredRe'');
      const baseRetSum = getGroupCurrentAmount(group, ''sumInsuredCedant'');
      const baseCedPremium = getGroupCurrentAmount(group, ''premiumRe'');
      const baseRetPremium = getGroupCurrentAmount(group, ''premiumCedant'');
      const currentCedSum = totalsBefore.manualCededSum !== undefined ? Number(totalsBefore.manualCededSum) : baseCedSum;
      const currentRetSum = totalsBefore.manualRetentionSum !== undefined ? Number(totalsBefore.manualRetentionSum) : baseRetSum;
      const currentCedPremium = totalsBefore.manualCededPremium !== undefined ? Number(totalsBefore.manualCededPremium) : baseCedPremium;
      const currentRetPremium = totalsBefore.manualRetentionPremium !== undefined ? Number(totalsBefore.manualRetentionPremium) : baseRetPremium;
      // El total de referencia siempre es el total original mas la variacion,
      // nunca la suma de valores manuales previamente editados.
      const totalSum = money(getContractTotal(group, ''sum'', baseCedSum + baseRetSum + numberFrom(totalsBefore, [''sumMovement''])) * reinsuranceBaseFactor());
      const totalPremium = money(getContractTotal(group, ''movement'', baseCedPremium + baseRetPremium + numberFrom(totalsBefore, [''movement''])) * reinsuranceBaseFactor());
      group.totals = Object.assign({}, group.totals || {}, { [distributionPercentageField]: percentageValue });
      if (field === ''proportionCed'') {
        // Al cambiar el porcentaje, el monto vuelve a ser calculado a partir
        // del total final. No conservar un monto manual de una edicion previa.
        delete group.totals.manualRetentionSum;
        delete group.totals.manualRetentionPremium;
        // Solo se reemplaza el lado editado; el porcentaje del otro lado debe conservarse.
        group.totals.manualRetentionSum = money(totalSum * percentageValue / 100);
        group.totals.manualRetentionPremium = money(totalPremium * percentageValue / 100);
      } else {
        delete group.totals.manualCededSum;
        delete group.totals.manualCededPremium;
        group.totals.manualCededSum = money(totalSum * percentageValue / 100);
        group.totals.manualCededPremium = money(totalPremium * percentageValue / 100);
      }
      // La retencion no maneja comision ni impuesto. Esos valores solo se
      // recalculan cuando se modifica el porcentaje cedido.
      if (field === ''proportionRe'') {
        const visibleCededPremium = group.totals.manualCededPremium !== undefined
          ? Number(group.totals.manualCededPremium)
          : currentCedPremium;
        const commissionPercentage = group.totals.commissionPercentage !== undefined
          ? Number(group.totals.commissionPercentage)
          : (currentCedPremium ? Number((getGroupCurrentAmount(group, [''commission'', ''comissionCedant'']) / currentCedPremium * 100).toFixed(4)) : 0);
        const taxPercentage = group.totals.taxPercentage !== undefined
          ? Number(group.totals.taxPercentage)
          : (currentCedPremium ? Number((getGroupCurrentAmount(group, ''tax'') / currentCedPremium * 100).toFixed(4)) : 0);
        group.totals.commissionPercentage = commissionPercentage;
        group.totals.taxPercentage = taxPercentage;
        group.totals.manualCommission = money(visibleCededPremium * commissionPercentage / 100);
        group.totals.manualTax = money(visibleCededPremium * taxPercentage / 100);
      }
      return next;
    });
  }

  function editContractRate(groupKey, field, value) {
    if (!sim) return;
    setReinsurersReady(false);
    setReaDetailTab(''distribution'');
    setSim(function (current) {
      const next = JSON.parse(JSON.stringify(current));
      let group = (next.contracts || []).find(function (item) {
        return String(item.contractId) + ''-'' + String(item.lineId) === groupKey;
      });
      if (!group) group = ensureSimGroup(next, groupKey);
      const percentageField = field === ''commission'' ? ''commissionPercentage'' : ''taxPercentage'';
      const percentageValue = Math.max(0, Math.min(100, Number(value || 0)));
      const cededPremium = group.totals.manualCededPremium !== undefined
        ? Number(group.totals.manualCededPremium)
        : getGroupCurrentAmount(group, ''premiumRe'');
      group.totals = Object.assign({}, group.totals || {}, { [percentageField]: percentageValue });
      group.totals.manualCommission = field === ''commission''
        ? money(cededPremium * percentageValue / 100)
        : group.totals.manualCommission;
      group.totals.manualTax = field === ''tax''
        ? money(cededPremium * percentageValue / 100)
        : group.totals.manualTax;
      return next;
    });
  }

  function contractPercentage(group, field) {
    const rows = group.rows || [];
    const base = rows.reduce(function (sum, row) { return sum + Math.abs(numberFrom(row, [''premiumMovement''])); }, 0);
    if (!base) return 0;
    const amountField = field === ''proportionCed'' ? ''premiumCedant'' : ''premiumRe'';
    return Number((rows.reduce(function (sum, row) { return sum + Math.abs(numberFrom(row, [amountField])); }, 0) / base * 100).toFixed(2));
  }

  function renderContractEditor(group, groupKey) {
    const totals = group.totals || {};
    const sumCedant = totals.sumCedant !== undefined
      ? totals.sumCedant
      : (group.rows || []).reduce(function (sum, row) { return sum + numberFrom(row, [''sumInsuredCedant'']); }, 0);
    const sumRe = totals.sumRe !== undefined
      ? totals.sumRe
      : (group.rows || []).reduce(function (sum, row) { return sum + numberFrom(row, [''sumInsuredRe'']); }, 0);
    return (
      <div className="axx-rea-editor">
        <span className="axx-rea-editor-label">{t(''Editar contrato'')}</span>
        <label>{t(''% Retencion'')}<InputNumber size="small" min={0} max={100} value={contractPercentage(group, ''proportionCed'')} onChange={function (v) { editContractPercentage(groupKey, ''proportionCed'', v); }} /></label>
        <label>{t(''Suma retencion'')}<InputNumber size="small" value={sumCedant} onChange={function (v) { distributeContractValue(groupKey, ''sumInsuredCedant'', v); }} /></label>
        <label>{t(''Prima retencion'')}<InputNumber size="small" value={totals.cedant || 0} onChange={function (v) { distributeContractValue(groupKey, ''premiumCedant'', v); }} /></label>
        <label>{t(''% Cedido'')}<InputNumber size="small" min={0} max={100} value={contractPercentage(group, ''proportionRe'')} onChange={function (v) { editContractPercentage(groupKey, ''proportionRe'', v); }} /></label>
        <label>{t(''Suma cedida'')}<InputNumber size="small" value={sumRe} onChange={function (v) { distributeContractValue(groupKey, ''sumInsuredRe'', v); }} /></label>
        <label>{t(''Prima cedida'')}<InputNumber size="small" value={totals.re || 0} onChange={function (v) { distributeContractValue(groupKey, ''premiumRe'', v); }} /></label>
        <label>{t(''Comision'')}<InputNumber size="small" value={totals.commission || 0} onChange={function (v) { distributeContractValue(groupKey, ''commission'', v); }} /></label>
        <label>{t(''Impuesto'')}<InputNumber size="small" value={totals.tax || 0} onChange={function (v) { distributeContractValue(groupKey, ''tax'', v); }} /></label>
      </div>
    );
  }

  function closeEnough(left, right) {
    return Math.abs(money(left) - money(right)) <= 0.01;
  }

  function percentageCloseTo100(value) {
    // Evita rechazar combinaciones validas por la precision binaria de JavaScript.
    return Math.abs(Number(value || 0) - 100) <= 0.000100001;
  }

  function sumField(rows, names) {
    return money((rows || []).reduce(function (total, row) {
      return total + numberFrom(row, names);
    }, 0));
  }

  function validateReinsuranceDistribution() {
    const errors = [];
    if (!calc || !sim || !Array.isArray(sim.contracts)) {
      errors.push(t(''La distribución de reaseguro todavía no está cargada.''));
      return { ok: false, errors: errors };
    }

    const expectedPremium = money(Number(calc.billing && calc.billing.premium ? calc.billing.premium.after : 0)
      - Number(calc.billing && calc.billing.premium ? calc.billing.premium.before : 0));
    const distributedPremium = numberFrom(sim, [''movement'']);
    if (!closeEnough(expectedPremium, distributedPremium)) {
      errors.push(t(''La prima distribuida no coincide con la prima del endoso.'') + '' '' + fmt(distributedPremium) + '' / '' + fmt(expectedPremium));
    }

    const coverageDistribution = {};
    (sim.contracts || []).forEach(function (group) {
      const groupName = t(''Contrato'') + '' '' + group.contractId + '' '' + t(''linea'') + '' '' + group.lineId;
      const rows = group.rows || [];
      const placementRows = rows.filter(function (row) {
        return Math.abs(finalCoveragePremium(group, row)) > 0.01 || Math.abs(finalCoverageSum(group, row)) > 0.01;
      });

      placementRows.forEach(function (row) {
        const code = String(row.coverageCode);
        if (!coverageDistribution[code]) {
          coverageDistribution[code] = {
            premium: 0,
            sum: 0,
            placement: 0,
            expectedPremium: finalCoveragePremium(group, row),
            expectedSum: finalCoverageSum(group, row),
            coinsurancePremium: money(finalCoveragePremium(group, row) * coinsurancePercentage() / 100),
            coinsuranceSum: money(finalCoverageSum(group, row) * coinsurancePercentage() / 100)
          };
        }
        const totals = group.totals || {};
        const retention = totals.distributionPercentageCed !== undefined
          ? Number(totals.distributionPercentageCed) / 100
          : numberFrom(row, [''proportionCed'']);
        const ceded = totals.distributionPercentageRe !== undefined
          ? Number(totals.distributionPercentageRe) / 100
          : numberFrom(row, [''proportionRe'']);
        coverageDistribution[code].placement += retention + ceded;
        coverageDistribution[code].premium += numberFrom(row, [''premiumCedant'']) + numberFrom(row, [''premiumRe'']);
        coverageDistribution[code].sum += numberFrom(row, [''sumInsuredCedant'']) + numberFrom(row, [''sumInsuredRe'']);
      });

      const cededPremium = sumField(rows, [''premiumRe'']);
      const cededSum = sumField(rows, [''sumInsuredRe'']);
      const participants = getLineParticipants(group);
      if (cededPremium > 0.01 || cededSum > 0.01) {
        if (!participants.length) {
          errors.push(groupName + '': '' + t(''un contrato cedido debe tener aceptantes distribuidos al 100%.''));
        } else {
          const split = sumField(participants, [''split'']);
          if (Math.abs(split - 100) > 0.01) {
            errors.push(groupName + '': '' + t(''los aceptantes de la linea'') + '' '' + t(''deben sumar 100%.''));
          }

          if (!closeEnough(sumField(participants, [''sumInsured'']), cededSum)) {
            errors.push(groupName + '': '' + t(''la suma de aceptantes no coincide con la suma cedida.''));
          }
          if (!closeEnough(sumField(participants, [''premium'']), cededPremium)) {
            errors.push(groupName + '': '' + t(''la prima de aceptantes no coincide con la prima cedida.''));
          }
          if (!closeEnough(sumField(participants, [''commission'']), sumField(rows, [''commission'']))) {
            errors.push(groupName + '': '' + t(''la comision de aceptantes no coincide con la linea.''));
          }
          if (!closeEnough(sumField(participants, [''tax'']), sumField(rows, [''tax'']))) {
            errors.push(groupName + '': '' + t(''el impuesto de aceptantes no coincide con la linea.''));
          }
        }
      }
    });

    // RET, Cuota Parte, FAC y las demas lineas son partes complementarias.
    // La colocacion del 100% se valida acumulada por cobertura, no por linea.
    Object.keys(coverageDistribution).forEach(function (code) {
      const item = coverageDistribution[code];
      if (!percentageCloseTo100(item.placement * 100)) {
        errors.push(t(''La colocacion de la cobertura'') + '' '' + code + '' '' + t(''debe sumar 100%.''));
      }
      if (!closeEnough(item.premium + item.coinsurancePremium, item.expectedPremium)) {
        errors.push(t(''La prima distribuida más coaseguro de la cobertura'') + '' '' + code + '' '' + t(''no coincide con el total emitido.'')
          + '' '' + fmt(item.premium + item.coinsurancePremium) + '' / '' + fmt(item.expectedPremium));
      }
      if (!closeEnough(item.sum + item.coinsuranceSum, item.expectedSum)) {
        errors.push(t(''La suma distribuida más coaseguro de la cobertura'') + '' '' + code + '' '' + t(''no coincide con el total emitido.'')
          + '' '' + fmt(item.sum + item.coinsuranceSum) + '' / '' + fmt(item.expectedSum));
      }
    });

    // Cierre por contrato: el reaseguro usa el remanente y la fila de
    // coaseguro completa la diferencia hasta el total emitido.
    (contractRows || []).forEach(function (contract) {
      const rows = getDistributionRows(contract);
      const distributedSum = rows.reduce(function (sum, row) { return sum + Number(row.sum || 0); }, 0);
      const distributedPremium = rows.reduce(function (sum, row) { return sum + Number(row.premium || 0); }, 0);
      if (!closeEnough(distributedSum, contract.sum)) {
        errors.push(t(''La suma de la distribución más coaseguro del contrato'') + '' '' + contract.contractId
          + '' '' + t(''no coincide con el total emitido.'') + '' '' + fmt(distributedSum) + '' / '' + fmt(contract.sum));
      }
      if (!closeEnough(distributedPremium, contract.movement)) {
        errors.push(t(''La prima de la distribución más coaseguro del contrato'') + '' '' + contract.contractId
          + '' '' + t(''no coincide con el total emitido.'') + '' '' + fmt(distributedPremium) + '' / '' + fmt(contract.movement));
      }
    });

    return { ok: errors.length === 0, errors: errors };
  }

  function readPolicyId() {
    const href = String(window.location.href || '''').replace(''#/'', '''');
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
    exe(''RepoLifePolicy'', { operation: ''GET'', filter: ''id='' + id, include: [''Coverages'', ''Product''], size: 1 })
      .then(function (r) {
        if (!r || !r.ok || !r.outData || !r.outData.length) {
          setLoading(false); setError(t(''No se encontro la poliza'') + '' '' + id); return null;
        }
        const p = r.outData[0];
        return Promise.all([
          exe(''GetFullTable'', { table: ''cfgCoberturaProductoReaFianza'' }),
          exe(''RepoCurrency'', { operation: ''GET'', filter: "code=''" + txt(p.currency).replace(/''/g, "''''") + "''", size: 1 }),
          exe(''RepoCession'', { operation: ''GET'', filter: ''lifePolicyId='' + id + '' AND overwritten=0'' }),
          exe(''RepoCoCession'', { operation: ''GET'', filter: ''lifePolicyId='' + id + '' AND parentCoCession IS NULL AND overwritten=0'', include: [''Contact''], size: 0 })
            .catch(function () { return { outData: [] }; }),
          exe(''LoadEntities'', {
            entity: ''Contact'',
            fields: ''id, name, middlename, surname1, surname2, isPerson'',
            filter: "exists (select 1 from contactRole r where r.contactId = contact.id and r.role = ''REI'')"
          }).catch(function () { return { outData: [] }; }),
          exe(''LoadEntities'', {
            entity: ''Contact'',
            fields: ''id, name, middlename, surname1, surname2, isPerson'',
            filter: "exists (select 1 from contactRole r where r.contactId = contact.id and r.role = ''RIN'')"
          }).catch(function () { return { outData: [] }; }),
          exe(''LoadEntities'', {
            entity: ''Contact'',
            fields: ''id, name, middlename, surname1, surname2, isPerson'',
            filter: "exists (select 1 from contactRole r where r.contactId = contact.id and r.role = ''COI'')"
          }).catch(function () { return { outData: [] }; })
        ]).then(function (responses) {
          const tr = responses[0];
          const currencyResponse = responses[1];
          const currency = currencyResponse && currencyResponse.outData && currencyResponse.outData[0];
          setBaseCessions((responses[2] && responses[2].outData) || []);
          setCoinsuranceCessions((responses[3] && responses[3].outData) || []);
          const brokerRows = (responses[4] && responses[4].outData) || [];
          setReinsuranceBrokers(brokerRows.map(function (item) {
            const name = item.isPerson
              ? [item.name, item.middlename || item.middleName, item.surname1, item.surname2].filter(Boolean).join('' '').trim()
              : String(item.surname2 || item.name || '''').trim();
            return { id: Number(item.id), name: name };
          }).filter(function (item) { return item.id > 0 && item.name; }));
          const reinsurerRows = (responses[5] && responses[5].outData) || [];
          setReinsuranceContacts(reinsurerRows.map(function (item) {
            const name = item.isPerson
              ? [item.name, item.middlename || item.middleName, item.surname1, item.surname2].filter(Boolean).join('' '').trim()
              : String(item.surname2 || item.name || '''').trim();
            return { id: Number(item.id), name: name };
          }).filter(function (item) { return item.id > 0 && item.name; }));
          const coinsurerRows = (responses[6] && responses[6].outData) || [];
          setCoinsuranceContacts(coinsurerRows.map(function (item) {
            const name = item.isPerson
              ? [item.name, item.middlename || item.middleName, item.surname1, item.surname2].filter(Boolean).join('' '').trim()
              : String(item.surname2 || item.name || '''').trim();
            return { id: Number(item.id), name: name };
          }).filter(function (item) { return item.id > 0 && item.name; }));
          setPolicy(Object.assign({}, p, { Currency: currency || p.Currency }));
          setLoading(false);
          let rows = (tr && tr.outData) || [];
          if (typeof rows === ''string'') rows = JSON.parse(rows);
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
            if (c === ''313'' || (row && row.principal === ''-1'')) {
              list.push({ code: c, name: covs[i].name, end: covs[i].end, start: covs[i].start, premium: covs[i].premium });
            }
          }
          setEligible(list);
          if (list.length) {
            setCovCode(list[0].code);
            if (list[0].end) {
              setNewEnd(moment(day10(list[0].end), ''YYYY-MM-DD'', true));
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
    if (!v) { setError(t(''Indique el numero o el codigo de la poliza'')); return; }
    invalidate(); setPolicy(null); setEligible([]); setCovCode(null); setNewEnd(null);
    if (/^[0-9]+$/.test(v)) { setPolicyId(Number(v)); loadPolicy(Number(v)); return; }
    setLoading(true); setError(null);
    exe(''RepoLifePolicy'', { operation: ''GET'', filter: "code=''" + v.replace(/''/g, "''''") + "''", size: 1 })
      .then(function (r) {
        setLoading(false);
        if (!r || !r.ok || !r.outData || !r.outData.length) { setError(t(''No se encontro la poliza'') + '' '' + v); return; }
        setPolicyId(r.outData[0].id);
        loadPolicy(r.outData[0].id);
      })
      .catch(function (e) { setLoading(false); setError(String(e)); });
  }

  function retornarAPoliza() {
    if (!policyId) return;
    window.location.hash = ''#/lifepolicy/'' + policyId;
  }

  useEffect(function () {
    const id = readPolicyId();
    setPolicyId(id);
    loadPolicy(id);
  }, []);

  // el alto de la grilla se mide en cada render: .ant-table-pagination no existe hasta que hay filas
  useEffect(function () {
    const root = document.querySelector(''.axx299'');
    if (!root) return;
    const body = root.querySelector(''.ant-table-body'');
    if (!body) return;
    const disponible = window.innerHeight - body.getBoundingClientRect().top - 90;
    if (disponible > 120 && Math.abs(disponible - altoGrilla) > 4) setAltoGrilla(Math.round(disponible));
  });

  const selected = (function () {
    for (let i = 0; i < eligible.length; i++) { if (eligible[i].code === covCode) return eligible[i]; }
    return null;
  })();
  const selectedPolicyCoverage = (policy && Array.isArray(policy.Coverages)
    ? policy.Coverages.find(function (coverage) { return txt(coverage.code) === txt(covCode); })
    : null) || selected;

  // la distribucion en memoria se invalida en cuanto cambia el calculo o la poliza
  function invalidate() {
    setCalc(null); setSim(null); setResult(null); setKey(null); setSplits([]);
    setReinsurersReady(false); setReinsuranceConfirmed(false); setSelectedReinsuranceLineKey(null); setReaDetailTab(''distribution'');
  }

  // Los aceptantes se editan sobre la simulacion actual, sin volver a cargar datos obsoletos.
  function editarSplit(cessionId, contactId, value, targetGroupKey) {
    if (!sim) return;
    setReinsuranceConfirmed(false);
    setSim(function (current) {
      const next = JSON.parse(JSON.stringify(current));
      (next.contracts || []).forEach(function (group) {
        const groupKey = String(group.contractId) + ''-'' + String(group.lineId);
        if (targetGroupKey && groupKey !== targetGroupKey) return;
        const participants = group.participants || [];
        const brokerId = participants.length ? participants[0].brokerId : null;
        const matches = participants.filter(function (item) {
          return String(item.contactId) === String(contactId)
            && String(item.brokerId || '''') === String(brokerId || '''');
        });
        if (!matches.length) {
          const source = (group.contractParticipants || []).find(function (item) {
            return String(item.contactId) === String(contactId);
          });
          if (!source) return;
          (group.rows || []).forEach(function (row) {
            group.participants = group.participants || [];
            group.participants.push(Object.assign({}, source, {
              cessionId: row.basedOnCessionId || cessionId,
              coverageCode: row.coverageCode,
              lineId: group.lineId,
              split: Number(value || 0)
            }));
          });
        } else {
          matches.forEach(function (participant) { participant.split = Number(value || 0); });
        }
        (group.participants || []).filter(function (item) {
          return String(item.contactId) === String(contactId)
            && String(item.brokerId || '''') === String(brokerId || '''');
        }).forEach(function (participant) {
          const row = (group.rows || []).find(function (item) {
            return String(item.coverageCode) === participantCoverageCode(group, participant);
          });
          const split = (Number(participant.split) || 0) / 100;
          participant.sumInsured = money((row ? numberFrom(row, [''sumInsuredRe'']) : numberFrom(group.totals, [''sumRe''])) * split);
          participant.premium = money((row ? numberFrom(row, [''premiumRe'']) : numberFrom(group.totals, [''re''])) * split);
          participant.commission = money((row ? numberFrom(row, [''commission'']) : numberFrom(group.totals, [''commission''])) * split);
          participant.tax = money((row ? numberFrom(row, [''tax'']) : numberFrom(group.totals, [''tax''])) * split);
        });
      });
      return next;
    });
  }

  function editarAceptanteCampo(row, field, value) {
    if (!sim) return;
    setReinsuranceConfirmed(false);
    setSim(function (current) {
      const next = JSON.parse(JSON.stringify(current));
      (next.contracts || []).forEach(function (group) {
        const groupKey = String(group.contractId) + ''-'' + String(group.lineId);
        if (row._groupKey && groupKey !== row._groupKey) return;
        const matches = (group.participants || []).filter(function (item) {
          return String(item.contactId) === String(row.contactId)
            && String(item.brokerId || '''') === String(row.brokerId || '''');
        });
        if (field === ''contactId'' || field === ''brokerId'') {
          matches.forEach(function (participant) {
            participant[field] = value;
            if (field === ''contactId'') {
              participant.contactName = contactNameById(value, reinsuranceContacts, participant.contactName);
              participant.name = participant.contactName || participant.name;
            } else {
              participant.brokerName = contactNameById(value, reinsuranceBrokers, participant.brokerName);
            }
          });
          return;
        }
        const target = Number(value || 0);
        const weights = matches.map(function (participant) { return Math.abs(numberFrom(participant, [field])); });
        const totalWeight = weights.reduce(function (sum, item) { return sum + item; }, 0);
        let assigned = 0;
        matches.forEach(function (participant, index) {
          const amount = index === matches.length - 1
            ? money(target - assigned)
            : money(totalWeight ? target * weights[index] / totalWeight : target / (matches.length || 1));
          participant[field] = amount;
          assigned = money(assigned + amount);
        });
      });
      return next;
    });
  }

  function eliminarAceptante(row) {
    if (!sim) return;
    setReinsuranceConfirmed(false);
    setSim(function (current) {
      const next = JSON.parse(JSON.stringify(current));
      (next.contracts || []).forEach(function (group) {
        const groupKey = String(group.contractId) + ''-'' + String(group.lineId);
        if (row._groupKey && groupKey !== row._groupKey) return;
        group.participants = (group.participants || []).filter(function (item) {
          return !(String(item.contactId) === String(row.contactId)
            && String(item.brokerId || '''') === String(row.brokerId || ''''));
        });
      });
      return next;
    });
  }

  function agregarAceptante(group) {
    if (!sim) return;
    setReinsuranceConfirmed(false);
    setSim(function (current) {
      const next = JSON.parse(JSON.stringify(current));
      const target = (next.contracts || []).find(function (item) {
        return String(item.contractId) + ''-'' + String(item.lineId)
          === String(group.contractId) + ''-'' + String(group.lineId);
      });
      if (!target) return next;
      target.participants = target.participants || [];
      (target.rows || []).forEach(function (row, index) {
        target.participants.push({
          id: ''new-'' + Date.now() + ''-'' + index,
          cessionId: row.basedOnCessionId || 0,
          coverageCode: row.coverageCode || null,
          lineId: target.lineId,
          contactId: null,
          brokerId: null,
          split: 0,
          sumInsured: 0,
          premium: 0,
          commission: 0,
          tax: 0
        });
      });
      return next;
    });
  }

  function guardarAceptantesMemoria() {
    setReinsuranceConfirmed(false);
    const validation = validateReinsuranceDistribution();
    if (!validation.ok) {
      const message = validation.errors.join('' '');
      setError(message);
      A.message.error(message);
      return;
    }
    setSim(function (current) {
      const next = JSON.parse(JSON.stringify(current));
      (next.contracts || []).forEach(function (group) {
        syncParticipantContactNames(group);
        redistributeParticipantRounding(group);
      });
      return next;
    });
    setError(null);
    A.message.success(t(''La distribución de aceptantes cuadra y fue guardada correctamente.''));
  }

  function redistributeParticipantRounding(group) {
    const fields = [
      { participant: ''sumInsured'', line: ''sumInsuredRe'' },
      { participant: ''premium'', line: ''premiumRe'' },
      { participant: ''commission'', line: ''commission'' },
      { participant: ''tax'', line: ''tax'' }
    ];
    (group.rows || []).forEach(function (line) {
      const participants = (group.participants || []).filter(function (item) {
        return participantCoverageCode(group, item) === String(line.coverageCode);
      });
      if (!participants.length) return;
      const totalSplit = participants.reduce(function (sum, item) { return sum + Number(item.split || 0); }, 0);
      if (Math.abs(totalSplit - 100) > 0.01) return;
      fields.forEach(function (field) {
        const target = numberFrom(line, [field.line]);
        let assigned = 0;
        participants.forEach(function (participant, index) {
          const amount = index === participants.length - 1
            ? money(target - assigned)
            : money(target * (Number(participant.split || 0) / totalSplit));
          participant[field.participant] = amount;
          assigned = money(assigned + amount);
        });
      });
    });
  }

  function contactNameById(id, catalog, fallback) {
    const contact = (catalog || []).find(function (item) {
      return String(item.id) === String(id);
    });
    return contact && contact.name ? contact.name : (fallback || contactDirectory[String(id)] || '''');
  }

  function syncParticipantContactNames(group) {
    (group.participants || []).forEach(function (participant) {
      if (participant.brokerId) {
        participant.brokerName = contactNameById(participant.brokerId, reinsuranceBrokers, participant.brokerName);
      }
      if (participant.contactId) {
        participant.contactName = contactNameById(participant.contactId, reinsuranceContacts, participant.contactName || participant.name);
        participant.name = participant.contactName || participant.name;
      }
    });
  }

  function getLineParticipants(group) {
    const grouped = {};
    (group.participants || []).forEach(function (participant) {
      const participantKey = String(participant.contactId || '''') + ''|'' + String(participant.brokerId || '''');
      if (!grouped[participantKey]) {
        grouped[participantKey] = Object.assign({}, participant, {
          _groupKey: String(group.contractId) + ''-'' + String(group.lineId),
          split: Number(participant.split || 0),
          sumInsured: 0,
          premium: 0,
          commission: 0,
          tax: 0
        });
      }
    });
    Object.keys(grouped).forEach(function (participantKey) {
      const participant = grouped[participantKey];
      // La fila agrupada debe representar el movimiento real de sus
      // aceptantes. No usar los totales generales de la linea, porque pueden
      // corresponder al estado final y mezclarlo con una variacion negativa.
      const sourceParticipants = (group.participants || []).filter(function (item) {
        return String(item.contactId || '''') + ''|'' + String(item.brokerId || '''') === participantKey;
      });
      participant.sumInsured = money(sourceParticipants.reduce(function (sum, item) {
        return sum + numberFrom(item, [''sumInsured'']);
      }, 0));
      participant.premium = money(sourceParticipants.reduce(function (sum, item) {
        return sum + numberFrom(item, [''premium'']);
      }, 0));
      participant.commission = money(sourceParticipants.reduce(function (sum, item) {
        return sum + numberFrom(item, [''commission'']);
      }, 0));
      participant.tax = money(sourceParticipants.reduce(function (sum, item) {
        return sum + numberFrom(item, [''tax'']);
      }, 0));
      const brokerCatalog = group.brokers && group.brokers.length
        ? group.brokers
        : (group.reinsuranceBrokers && group.reinsuranceBrokers.length ? group.reinsuranceBrokers : reinsuranceBrokers);
      participant.brokerOptions = (brokerCatalog || []).map(function (item) {
        return { value: item.id || item.value, label: contactDirectory[String(item.id || item.value)] || item.nombre || item.name || item.label || String(item.id || item.value) };
      });
      participant.reinsurerOptions = (reinsuranceContacts || []).map(function (item) {
        return { value: item.id, label: item.name };
      });
      (group.participants || []).forEach(function (item) {
        if (item.contactId && !participant.reinsurerOptions.some(function (option) { return String(option.value) === String(item.contactId); })) {
          participant.reinsurerOptions.push({
            value: item.contactId,
            label: contactDirectory[String(item.contactId)] || item.name || item.contactName || String(item.contactId)
          });
        }
        if (item.brokerId && !participant.brokerOptions.some(function (option) { return String(option.value) === String(item.brokerId); })) {
          participant.brokerOptions.push({
            value: item.brokerId,
            label: contactDirectory[String(item.brokerId)] || item.brokerName || String(item.brokerId)
          });
        }
      });
      if (participant.brokerId && !participant.brokerOptions.some(function (item) { return String(item.value) === String(participant.brokerId); })) {
        participant.brokerOptions.push({ value: participant.brokerId, label: String(contactDirectory[String(participant.brokerId)] || participant.brokerName || participant.brokerId) });
      }
      if (participant.contactId && !participant.reinsurerOptions.some(function (item) { return String(item.value) === String(participant.contactId); })) {
        participant.reinsurerOptions.push({ value: participant.contactId, label: String(contactDirectory[String(participant.contactId)] || participant.name || participant.contactName || participant.contactId) });
      }
      participant.displayName = contactDirectory[String(participant.contactId)] || participant.name || participant.contactName || participant.contactId;
      participant.brokerDisplayName = contactDirectory[String(participant.brokerId)] || participant.brokerName || participant.brokerId;
    });
    return Object.keys(grouped).map(function (participantKey) { return grouped[participantKey]; });
  }

  function getCoverageParticipants(group, coverageCode) {
    const grouped = {};
    (group.participants || []).filter(function (participant) {
      return participantCoverageCode(group, participant) === String(coverageCode || '''');
    }).forEach(function (participant) {
      const participantKey = String(participant.contactId || '''') + ''|'' + String(participant.brokerId || '''');
      if (!grouped[participantKey]) {
        grouped[participantKey] = Object.assign({}, participant, {
          _groupKey: String(group.contractId) + ''-'' + String(group.lineId),
          split: Number(participant.split || 0),
          sumInsured: 0,
          premium: 0,
          commission: 0,
          tax: 0
        });
      }
      grouped[participantKey].sumInsured += numberFrom(participant, [''sumInsured'']);
      grouped[participantKey].premium += numberFrom(participant, [''premium'']);
      grouped[participantKey].commission += numberFrom(participant, [''commission'']);
      grouped[participantKey].tax += numberFrom(participant, [''tax'']);
    });
    return Object.keys(grouped).map(function (participantKey) {
      const participant = grouped[participantKey];
      participant.sumInsured = money(participant.sumInsured);
      participant.premium = money(participant.premium);
      participant.commission = money(participant.commission);
      participant.tax = money(participant.tax);
      return participant;
    });
  }

  function initialContractPercentages(group) {
    const rows = (baseCessions || []).filter(function (row) {
      return String(row.contractId) === String(group.contractId)
        && String(row.lineId) === String(group.lineId);
    });
    const toPercentage = function (value) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return null;
      return Math.round((Math.abs(numeric) <= 1 ? numeric * 100 : numeric) * 10000) / 10000;
    };
    const sourceCed = rows.map(function (row) { return toPercentage(row.proportionCed); })
      .find(function (value) { return value !== null; });
    const sourceRe = rows.map(function (row) { return toPercentage(row.proportionRe); })
      .find(function (value) { return value !== null; });
    const hasSourceCed = sourceCed !== null && sourceCed !== undefined;
    const hasSourceRe = sourceRe !== null && sourceRe !== undefined;
    if (hasSourceCed || hasSourceRe) {
      const ced = !hasSourceCed ? Math.max(0, 100 - sourceRe) : Math.round(sourceCed);
      const re = !hasSourceRe ? Math.max(0, 100 - ced) : Math.round(sourceRe);
      return { ced: ced, re: re };
    }
    const retention = rows.reduce(function (sum, row) { return sum + numberFrom(row, [''premiumCedant'']); }, 0);
    const ceded = rows.reduce(function (sum, row) { return sum + numberFrom(row, [''premiumRe'']); }, 0);
    const total = retention + ceded;
    if (total > 0) {
      return {
        ced: Number((retention / total * 100).toFixed(4)),
        re: Number((ceded / total * 100).toFixed(4))
      };
    }
    return {
      ced: contractPercentage(group, ''proportionCed''),
      re: contractPercentage(group, ''proportionRe'')
    };
  }

  function hydrateFinalDistribution(group) {
    const percentages = initialContractPercentages(group);
    const totals = group.totals || {};
    totals.distributionPercentageCed = percentages.ced;
    totals.distributionPercentageRe = percentages.re;
    // La grilla muestra el estado final de la cesion. La variacion que la
    // compone ya incluye el recargo/descuento del endoso.
    const baseRows = (baseCessions || []).filter(function (cession) {
      return String(cession.contractId) === String(group.contractId)
        && String(cession.lineId) === String(group.lineId);
    });
    const baseCededPremium = baseRows.reduce(function (sum, cession) {
      return sum + numberFrom(cession, [''premiumRe'']);
    }, 0);
    const baseCommission = baseRows.reduce(function (sum, cession) {
      return sum + numberFrom(cession, [''commission'', ''comissionCedant'']);
    }, 0);
    const baseTax = baseRows.reduce(function (sum, cession) {
      return sum + numberFrom(cession, [''tax'']);
    }, 0);
    const commissionRate = baseCededPremium
      ? baseCommission / baseCededPremium
      : 0;
    const taxRate = baseCededPremium ? baseTax / baseCededPremium : 0;
    (group.rows || []).forEach(function (row) {
      const finalPremium = finalCoverageDistributionPremium(group, row);
      const finalSum = finalCoverageDistributionSum(group, row);
      row.proportionCed = percentages.ced / 100;
      row.proportionRe = percentages.re / 100;
      row.premiumCedant = money(finalPremium * percentages.ced / 100);
      row.premiumRe = money(finalPremium * percentages.re / 100);
      row.sumInsuredCedant = money(finalSum * percentages.ced / 100);
      row.sumInsuredRe = money(finalSum * percentages.re / 100);
      row.commission = money(row.premiumRe * commissionRate);
      row.tax = money(row.premiumRe * taxRate);
    });
    group.totals = totals;
    recalculateReinsuranceTotals(group);
    (group.participants || []).forEach(function (participant) {
      const row = (group.rows || []).find(function (item) {
        return String(item.coverageCode) === participantCoverageCode(group, participant);
      });
      const split = (Number(participant.split) || 0) / 100;
      participant.sumInsured = money(numberFrom(row || group.totals, row ? [''sumInsuredRe''] : [''sumRe'']) * split);
      participant.premium = money(numberFrom(row || group.totals, row ? [''premiumRe''] : [''re'']) * split);
      participant.commission = money(numberFrom(row || group.totals, row ? [''commission''] : [''commission'']) * split);
      participant.tax = money(numberFrom(row || group.totals, row ? [''tax''] : [''tax'']) * split);
    });
    return group;
  }

  // ------------------------------------------------------------- pestania 1
  function prepararNuevasCoberturas(result) {
    const adjustment = money(Number(surcharge || 0) - Number(discount || 0));
    const quote = result && result.quote;
    let coverages = [];
    try {
      coverages = JSON.parse(quote && quote.jNewCoverages ? quote.jNewCoverages : ''[]'');
    } catch (e) {
      throw new Error(t(''El cálculo no devolvió coberturas nuevas válidas''));
    }
    if (!Array.isArray(coverages) || !coverages.length) {
      throw new Error(t(''El cálculo no devolvió coberturas nuevas''));
    }

    const rowsByCode = {};
    (result.rows || []).forEach(function (row) { rowsByCode[txt(row.code)] = row; });
    const expectedPremium = Number(result.billing && result.billing.premium ? result.billing.premium.after : 0);
    // El recargo/descuento pertenece únicamente a la cobertura seleccionada.
    // Las demás coberturas solo cambian su vigencia.
    const adjustmentToAllocate = adjustment;
    let allocated = 0;

    coverages.forEach(function (coverage) {
      const code = txt(coverage.code);
      const selected = code === txt(covCode);
      const share = selected ? adjustmentToAllocate : 0;
      if (selected) {
        // ChangeCoverage calcula la facturacion usando basePremium. No se
        // debe retirar el ajuste de ese campo, porque el motor ignoraria
        // extraPremium y registraria una prima sin recargo/descuento.
        coverage.basePremium = money(coverage.basePremium);
        coverage.extraPremium = money(Number(coverage.extraPremium || 0) + share);
        coverage.premium = money(coverage.premium);
      }
      allocated = money(allocated + share);

      const row = rowsByCode[code];
      if (row) {
        row.newPremium = coverage.premium;
        row.adjustedPremium = coverage.premium;
        row.variation = money(coverage.premium - Number(row.oldPremium || 0));
      }
    });

    const finalPremium = money(coverages.reduce(function (sum, coverage) { return sum + Number(coverage.premium || 0); }, 0));
    if (!closeEnough(allocated, adjustmentToAllocate) || !closeEnough(finalPremium, expectedPremium)) {
      throw new Error(t(''La distribución del recargo o descuento no coincide con la prima final calculada''));
    }

    quote.jNewCoverages = JSON.stringify(coverages);
    result.finalCoverages = coverages;
    result.coverageAdjustmentApplied = adjustmentToAllocate;
    return result;
  }

  function calcular() {
    setError(null); setResult(null);
    setReinsuranceConfirmed(false);
    if (!covCode) { setError(t(''Seleccione la cobertura a endosar'')); return; }
    if (!newEnd) { setError(t(''Indique la nueva fecha final'')); return; }
    setLoading(true);
    setSim(null);
    const ctx = {
      policyId: policyId, coverageCode: covCode,
      newEnd: moment(newEnd).format(''YYYY-MM-DD''),
      surcharge: Number(surcharge || 0), discount: Number(discount || 0)
    };
    exe(''ExeChain'', { chain: ''cmdCalcChangeCoverageSurety'', context: JSON.stringify(ctx) })
      .then(function (r) {
        if (!r || !r.ok) {
          setLoading(false);
          setError(String((r && r.msg) || t(''Error de calculo'')).replace(/formula ->[\s\S]*/, '''').trim());
          return null;
        }
        let o = r.outData;
        if (typeof o === ''string'') o = JSON.parse(o);
        if (o && o.length !== undefined && o.length >= 0 && !o.rows) o = o[0];
        o = prepararNuevasCoberturas(o);
        setCalc(o);
        setKey(''AXX299-'' + policyId + ''-'' + covCode + ''-'' + moment().format(''YYYYMMDDHHmmss''));
        setLoading(false);
        return null;
      })
      .catch(function (e) { setLoading(false); setError(String(e)); });
  }

  // recargo y descuento recalculan sin borrar lo capturado
  function onAjuste(kind, value) {
    const v = value === null || value === undefined ? 0 : Number(value);
    if (kind === ''surcharge'') setSurcharge(v); else setDiscount(v);
    setSim(null);
  }

  // ------------------------------------------------------------- pestania 2
  function simular() {
    if (!calc) { setError(t(''Calcule el endoso antes de simular el reaseguro'')); return; }
    setReinsuranceConfirmed(false);
    setReinsurersReady(false);
    setSelectedReinsuranceLineKey(null);
    setReaDetailTab(''distribution'');
    setSimLoading(true); setError(null);
    const rows = [];
    for (let i = 0; i < calc.rows.length; i++) {
      // variation contiene la prima final del movimiento, incluyendo recargos
      // o descuentos. El prorrateado se conserva solo como referencia.
      rows.push({ code: calc.rows[i].code, variation: calc.rows[i].variation, prorated: calc.rows[i].prorated });
    }
    exe(''ExeChain'', {
      chain: ''cmdSimReaChangeCoverage'',
      context: JSON.stringify({ policyId: policyId, rows: rows, participants: splits })
    })
      .then(function (r) {
        setSimLoading(false);
        if (!r || !r.ok) { setError(String((r && r.msg) || '''').replace(/formula ->[\s\S]*/, '''').trim()); return; }
        let o = r.outData;
        if (typeof o === ''string'') o = JSON.parse(o);
        if (o && o.length !== undefined && !o.contracts) o = o[0];
        (o.contracts || []).forEach(function (group) { hydrateFinalDistribution(group); });
        const contactIds = [];
        (o.contracts || []).forEach(function (group) {
          (group.participants || []).forEach(function (participant) {
            if (participant.contactId) contactIds.push(participant.contactId);
            if (participant.brokerId) contactIds.push(participant.brokerId);
          });
        });
        const uniqueContactIds = contactIds.filter(function (id, index) {
          return contactIds.findIndex(function (item) { return String(item) === String(id); }) === index;
        });
        const loadNames = uniqueContactIds.length
          ? exe(''LoadEntities'', {
            entity: ''Contact'',
            fields: ''id, name, middlename, surname1, surname2, isPerson'',
            filter: ''id in ('' + uniqueContactIds.join('','') + '')''
          }).catch(function () { return { outData: [] }; })
          : Promise.resolve({ outData: [] });
        loadNames.then(function (contacts) {
          const directory = {};
          ((contacts && contacts.outData) || []).forEach(function (contact) {
            const name = contact.isPerson
              ? [contact.name, contact.middlename || contact.middleName, contact.surname1, contact.surname2].filter(Boolean).join('' '').trim()
              : String(contact.surname2 || contact.name || '''').trim();
            if (name) directory[String(contact.id)] = name;
          });
          setContactDirectory(directory);
          setSim(o);
          setSelectedReinsuranceKey(o && o.contracts && o.contracts.length ? String(o.contracts[0].contractId) : null);
        });
      })
      .catch(function (e) { setSimLoading(false); setError(String(e)); });
  }

  // Tambien cuando una edicion invalida la distribucion: sin `sim` en las dependencias, editar
  // o agregar un aceptante limpiaba la simulacion y nadie la volvia a pedir.
  useEffect(function () {
    if (calc && !sim && !simLoading) simular();
  }, [tab, calc, sim, splits]);

  // ------------------------------------------------------------- ejecucion
  function confirmarReaseguro() {
    if (simLoading) {
      A.message.info(t(''La distribución de reaseguro todavía se está cargando.''));
      return;
    }
    if (!sim) {
      A.message.error(t(''La distribución de reaseguro todavía no está cargada.''));
      return;
    }
    const validation = validateReinsuranceDistribution();
    if (!validation.ok) {
      const message = validation.errors.join('' '');
      setError(message);
      A.message.error(message);
      setReinsuranceConfirmed(false);
      return;
    }
    setError(null);
    setReinsuranceConfirmed(true);
    A.message.success(t(''El reaseguro está validado y todo está en orden.''));
  }

  async function ejecutar() {
    if (lock.busy || running) return;
    if (!txt(note)) { setNoteTouched(true); return; }
    const distributionValidation = validateReinsuranceDistribution();
    if (!distributionValidation.ok) {
      setError(distributionValidation.errors.join('' ''));
      return;
    }

    lock.busy = true;
    setRunning(true); setError(null); setModal(false);
    const failures = [];
    let keepExecutionLocked = false;
    const cleanMessage = function (response) {
      return String((response && response.msg) || '''').replace(/formula ->[\s\S]*/, '''').trim();
    };
    const dateAtNoon = function (value) {
      const date = day10(value);
      return date ? date + ''T12:00:00'' : '''';
    };
    const oldCoverages = policy && Array.isArray(policy.Coverages) ? policy.Coverages : [];
    const finalCoverages = calc && Array.isArray(calc.finalCoverages) ? calc.finalCoverages : [];
    const newCoverages = oldCoverages.map(function (coverage) {
      const calculated = finalCoverages.find(function (item) { return txt(item.code) === txt(coverage.code); });
      const next = Object.assign({}, coverage, calculated || {});
      if (next.start) next.start = dateAtNoon(next.start);
      if (next.end) next.end = dateAtNoon(next.end);
      return next;
    });
    const reinsuranceSnapshot = { distribution: [], participants: [], coinsurance: [] };
    const coinsuranceBase = finalCoinsuranceBase();
    (coinsuranceCessions || []).forEach(function (cession) {
      const percentage = coinsuranceNumber(cession.percentage);
      const sourcePremium = coinsuranceNumber(cession.premiumCeded || cession.premium);
      const premiumCeded = money(coinsuranceBase.premium * percentage / 100);
      reinsuranceSnapshot.coinsurance.push({
        id: Number(cession.id || 0),
        contactId: Number(cession.contactId || 0),
        percentage: percentage,
        sumInsured: money(coinsuranceBase.sum),
        premium: money(coinsuranceBase.premium),
        sumInsuredCeded: money(coinsuranceBase.sum * percentage / 100),
        premiumCeded: premiumCeded,
        commission: sourcePremium ? money(premiumCeded * coinsuranceNumber(cession.commission) / sourcePremium) : 0,
        tax: sourcePremium ? money(premiumCeded * coinsuranceNumber(cession.tax) / sourcePremium) : 0
      });
    });
    (sim && sim.contracts || []).forEach(function (group) {
      (group.rows || []).forEach(function (row) {
        reinsuranceSnapshot.distribution.push({
          contractId: group.contractId, lineId: group.lineId, coverageCode: row.coverageCode,
          premiumMovement: row.premiumMovement, sumInsuredMovement: row.sumInsuredMovement,
          premiumCedant: row.premiumCedant, sumInsuredCedant: row.sumInsuredCedant,
          premiumRe: row.premiumRe, sumInsuredRe: row.sumInsuredRe,
          commission: row.commission, tax: row.tax,
          proportionCed: row.proportionCed, proportionRe: row.proportionRe
        });
      });
      (group.participants || []).forEach(function (participant) {
        reinsuranceSnapshot.participants.push({
          contractId: group.contractId, lineId: group.lineId,
          coverageCode: participantCoverageCode(group, participant),
          cessionId: participant.cessionId,
          contactId: participant.contactId, brokerId: participant.brokerId, split: participant.split,
          sumInsured: participant.sumInsured, premium: participant.premium,
          commission: participant.commission, tax: participant.tax
        });
      });
    });
    const payload = {
      policyId: policyId,
      jOldCoverages: JSON.stringify(oldCoverages),
      jNewCoverages: JSON.stringify(newCoverages),
      newStart: dateAtNoon(calc.rows[0] && calc.rows[0].newStart),
      newEnd: dateAtNoon(calc.rows[0] && calc.rows[0].newEnd),
      effectiveDate: dateAtNoon(calc.rows[0] && calc.rows[0].newEnd),
      note: txt(note),
      operation: ''ADD'',
      code: null,
      jAdditional: JSON.stringify({
        endorsementType: ''CHANGE_COVERAGE_SURETY'',
        surcharge: Number(surcharge || 0),
        discount: Number(discount || 0),
        premium: calc.billing && calc.billing.premium ? calc.billing.premium.after : 0,
        tax: calc.billing && calc.billing.tax ? calc.billing.tax.after : 0,
        total: calc.billing && calc.billing.total ? calc.billing.total.after : 0,
        reinsuranceSnapshot: reinsuranceSnapshot
      })
    };

    let changeId = 0;
    let reinsurancePrepared = false;
    let reinsuranceExecuted = false;
    try {
      const createdResponse = await exe(''ChangeCoverage'', payload);
      if (!createdResponse || !createdResponse.ok || !createdResponse.outData || !createdResponse.outData.id) {
        throw new Error(t(''El endoso no pudo ser creado'') + '': '' + cleanMessage(createdResponse));
      }
      const created = Array.isArray(createdResponse.outData) ? createdResponse.outData[0] : createdResponse.outData;
      changeId = Number(created.id || 0);
      setKey(String(changeId));
      let processId = Number(created.processId || 0);
      if (!processId) {
        const changeEntity = await exe(''LoadEntity'', { entity: ''Change'', fields: ''id,processId'', filter: ''id='' + changeId, noTracking: true });
        const loadedChange = changeEntity && changeEntity.outData ? changeEntity.outData : {};
        processId = Number(loadedChange.processId || 0);
      }
      if (!processId) throw new Error(t(''No se pudo determinar el workflow del endoso''));
      const workflow = await exe(''GotoStep'', { procesoId: processId, estado: ''APROVED'' });
      const workflowResponse = Array.isArray(workflow) ? (workflow[0] || {}) : workflow;
      if (!workflowResponse || !workflowResponse.ok) throw new Error(t(''No se pudo aprobar el workflow del endoso'') + '': '' + cleanMessage(workflowResponse));

      if (reinsuranceSnapshot.distribution.length) {
        reinsurancePrepared = true;
        const prepared = await exe(''ExeChain'', {
          chain: ''cmdApplyReaChangeCoverage'',
          context: JSON.stringify({ changeId: changeId, mode: ''PREPARE'' })
        });
        if (!prepared || !prepared.ok) {
          throw new Error(t(''No se pudo preparar el reaseguro del endoso'') + '': '' + cleanMessage(prepared));
        }
      }

      const executed = await exe(''ExeChangeCoverage'', { changeId: changeId, exeNow: true, operation: ''EXECUTE'', noTracking: true });
      if (!executed || !executed.ok) {
        throw new Error(t(''El endoso fue creado pero no pudo ejecutarse'') + '': '' + cleanMessage(executed));
      }
      reinsuranceExecuted = true;

      // ChangeCoverage actualiza las coberturas, pero la duracion de la
      // poliza debe quedar sincronizada con la vigencia final resultante.
      try {
        const parseAtNoon = function (value) {
          const raw = String(value || '''').trim();
          if (!raw) return null;
          const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw) ? raw : raw + ''Z'';
          const date = new Date(normalized);
          return Number.isNaN(date.getTime()) ? null : date;
        };
        const addYears = function (date, years) {
          const result = new Date(date.getTime());
          const month = result.getUTCMonth();
          result.setUTCDate(1);
          result.setUTCFullYear(result.getUTCFullYear() + years);
          result.setUTCMonth(month);
          result.setUTCDate(Math.min(date.getUTCDate(), new Date(Date.UTC(result.getUTCFullYear(), month + 1, 0)).getUTCDate()));
          return result;
        };
        const addMonths = function (date, months) {
          const result = new Date(date.getTime());
          const day = result.getUTCDate();
          result.setUTCDate(1);
          result.setUTCMonth(result.getUTCMonth() + months);
          result.setUTCDate(Math.min(day, new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate()));
          return result;
        };
        const dates = newCoverages.map(function (coverage) {
          return { start: parseAtNoon(coverage.start), end: parseAtNoon(coverage.end) };
        }).filter(function (item) { return item.start && item.end; });
        if (!dates.length) throw new Error(t(''No se pudo determinar la vigencia final de la póliza''));
        const startDate = new Date(Math.min.apply(null, dates.map(function (item) { return item.start.getTime(); })));
        const endDate = new Date(Math.max.apply(null, dates.map(function (item) { return item.end.getTime(); })));
        let years = endDate.getUTCFullYear() - startDate.getUTCFullYear();
        let cursor = addYears(startDate, years);
        if (cursor.getTime() > endDate.getTime()) { years -= 1; cursor = addYears(startDate, years); }
        let months = (endDate.getUTCFullYear() - cursor.getUTCFullYear()) * 12 + endDate.getUTCMonth() - cursor.getUTCMonth();
        cursor = addMonths(cursor, months);
        if (cursor.getTime() > endDate.getTime()) { months -= 1; cursor = addMonths(startDate, years * 12 + months); }
        const days = Math.floor((endDate.getTime() - cursor.getTime()) / 86400000);
        const validityResponse = await exe(''SetField'', {
          entity: ''LifePolicy'',
          entityId: policyId,
          fieldValue: [
            "start=''" + dateAtNoon(startDate.toISOString()) + "''",
            "[end]=''" + dateAtNoon(endDate.toISOString()) + "''",
            ''duration='' + years,
            ''durationMonths='' + months,
            ''durationDays='' + days
          ].join('', ''),
          raw: true
        });
        if (!validityResponse || !validityResponse.ok) {
          failures.push(t(''actualización de vigencia y duración'') + '': '' + cleanMessage(validityResponse));
        }
      } catch (validityError) {
        failures.push(t(''actualización de vigencia y duración'') + '': '' + String(validityError && validityError.message ? validityError.message : validityError));
      }

      if (reinsuranceSnapshot.distribution.length) {
        try {
          const reinsurance = await exe(''ExeChain'', {
            chain: ''cmdApplyReaChangeCoverage'',
            context: JSON.stringify({ changeId: changeId, mode: ''FINALIZE'' })
          });
          if (!reinsurance || !reinsurance.ok) failures.push(t(''actualización del reaseguro'') + '': '' + cleanMessage(reinsurance));
        } catch (reinsuranceError) {
          failures.push(t(''actualización del reaseguro'') + '': '' + String(reinsuranceError && reinsuranceError.message ? reinsuranceError.message : reinsuranceError));
        }
      }

      const message = failures.length
        ? t(''El endoso se ejecutó correctamente, pero hubo problemas en: '') + failures.join('' | '')
        : t(''El endoso se ejecutó correctamente y la póliza fue actualizada.'');
      setResult({ ok: true, changeId: changeId, msg: message });
      if (failures.length) A.message.warning(message); else A.message.success(message);
      setSim(null);
      keepExecutionLocked = true;
      await new Promise(function (resolve) { setTimeout(resolve, 700); });
      retornarAPoliza();
    } catch (e) {
      if (reinsurancePrepared && !reinsuranceExecuted && changeId) {
        try {
          await exe(''ExeChain'', {
            chain: ''cmdApplyReaChangeCoverage'',
            context: JSON.stringify({ changeId: changeId, mode: ''ROLLBACK'' })
          });
        } catch (rollbackError) {
          failures.push(t(''limpieza del reaseguro temporal'') + '': '' + String(rollbackError && rollbackError.message ? rollbackError.message : rollbackError));
        }
      }
      const message = String(e && e.message ? e.message : e);
      setError(message);
      A.message.error(message);
    } finally {
      if (!keepExecutionLocked) {
        lock.busy = false;
        setRunning(false);
      }
    }
  }

  // ------------------------------------------------------------- columnas
  const colsGrid = [
    { title: t(''Codigo''), dataIndex: ''code'', width: 80 },
    { title: t(''Nombre''), dataIndex: ''name'' },
    { title: t(''Tipo''), dataIndex: ''reason'', width: 110, render: function (v) { return v === ''SELECTED'' ? <Tag color="blue">{t(''Seleccionada'')}</Tag> : <Tag>{t(''Recalculada'')}</Tag>; } },
    { title: t(''Prima anterior''), dataIndex: ''oldPremium'', align: ''right'', width: 120, render: function (v) { return <span className="axx-antes">{fmt(v)}</span>; } },
    { title: t(''Vigencia inicial anterior''), dataIndex: ''oldStart'', width: 140, render: function (v) { return <span className="axx-antes">{day10(v)}</span>; } },
    { title: t(''Vigencia final anterior''), dataIndex: ''oldEnd'', width: 140, render: function (v) { return <span className="axx-antes">{day10(v)}</span>; } },
    { title: t(''Nueva prima''), dataIndex: ''newPremium'', align: ''right'', width: 120, render: function (v) { return <span className="axx-nuevo">{fmt(v)}</span>; } },
    { title: t(''Variacion''), dataIndex: ''variation'', align: ''right'', width: 110, render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } },
    { title: t(''Nueva vigencia inicial''), dataIndex: ''newStart'', width: 140, render: function (v, row) { return <span className={row.oldStart === row.newStart ? '''' : ''axx-nuevo''}>{day10(v)}</span>; } },
    { title: t(''Nueva vigencia final''), dataIndex: ''newEnd'', width: 140, render: function (v) { return <span className="axx-nuevo">{day10(v)}</span>; } }
  ];

  const colsResumen = [
    { title: t(''Concepto''), dataIndex: ''label'' },
    { title: t(''Anterior''), dataIndex: ''before'', align: ''right'', render: function (v) { return <span className="axx-antes">{fmt(v)}</span>; } },
    { title: t(''Calculado''), dataIndex: ''calculated'', align: ''right'', render: function (v) { return fmt(v); } },
    { title: t(''Nuevo''), dataIndex: ''after'', align: ''right'', render: function (v) { return <span className="axx-nuevo">{fmt(v)}</span>; } }
  ];

  const filasResumen = calc ? [
    // Calculado representa la porción del endoso. La prima base no incluye
    // el ajuste, que se muestra por separado en la fila Ajustes.
    { key: ''p'', label: t(''Prima''), before: calc.billing.premium.before, calculated: calc.billing.premium.calculated - calc.billing.premium.before, after: calc.billing.premium.calculated },
    { key: ''a'', label: t(''Ajustes''), before: calc.billing.adjustments.before, calculated: calc.billing.adjustments.after - calc.billing.adjustments.before, after: calc.billing.adjustments.after },
    { key: ''g'', label: t(''Gasto''), before: calc.billing.fee.before, calculated: calc.billing.fee.after - calc.billing.fee.before, after: calc.billing.fee.after },
    { key: ''i'', label: t(''Impuesto''), before: calc.billing.tax.before, calculated: calc.billing.tax.after - calc.billing.tax.before, after: calc.billing.tax.after },
    { key: ''T'', label: t(''Total''), before: calc.billing.total.before, calculated: calc.billing.total.after - calc.billing.total.before, after: calc.billing.total.after }
  ] : [];

  const colsAceptantes = [
    { title: t(''Corredor de reaseguro''), dataIndex: ''brokerId'', width: 170, render: function (v, row) {
      return <Select size="small" value={v || undefined} placeholder={t(''Seleccione'')} style={{ width: 150 }}
        onChange={function (x) { editarAceptanteCampo(row, ''brokerId'', x); }}>
        {(row.brokerOptions || []).map(function (option) {
          return <Select.Option key={String(option.value)} value={option.value}>{option.label}</Select.Option>;
        })}
      </Select>;
    } },
    { title: t(''Reasegurador''), dataIndex: ''contactId'', width: 420, render: function (v, row) {
      return <Select size="small" value={v || undefined} style={{ width: 400 }} dropdownMatchSelectWidth={false}
        dropdownStyle={{ minWidth: 420 }}
        onChange={function (x) { editarAceptanteCampo(row, ''contactId'', x); }}>
        {(row.reinsurerOptions || []).map(function (option) {
          return <Select.Option key={String(option.value)} value={option.value}>{option.label}</Select.Option>;
        })}
      </Select>;
    } },
    { title: t(''Linea''), dataIndex: ''lineId'', width: 130 },
    {
      title: t(''Participacion %''), dataIndex: ''split'', width: 150, render: function (v, row) {
        return <EditableFormattedNumber value={v} decimals={4} onCommit={function (x) {
          editarSplit(row.cessionId, row.contactId, x, row._groupKey);
        }} />;
      }
    },
    { title: t(''Suma cedida''), dataIndex: ''sumInsured'', align: ''right'', width: 130, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={2} onCommit={function (x) { editarAceptanteCampo(row, ''sumInsured'', x); }} />;
    } },
    { title: t(''Prima cedida''), dataIndex: ''premium'', align: ''right'', width: 130, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={2} onCommit={function (x) { editarAceptanteCampo(row, ''premium'', x); }} />;
    } },
    { title: t(''Comision''), dataIndex: ''commission'', align: ''right'', width: 120, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={2} onCommit={function (x) { editarAceptanteCampo(row, ''commission'', x); }} />;
    } },
    { title: t(''Impuesto''), dataIndex: ''tax'', align: ''right'', width: 120, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={2} onCommit={function (x) { editarAceptanteCampo(row, ''tax'', x); }} />;
    } },
    { title: t(''Acciones''), width: 100, render: function (_, row) {
      return <Button type="link" danger size="small" onClick={function () { eliminarAceptante(row); }}>{t(''Eliminar'')}</Button>;
    } }
  ];

  const colsCoberturaAceptantes = [
    { title: t(''Corredor de reaseguro''), dataIndex: ''brokerName'', width: 170, render: function (v, row) {
      return contactDirectory[String(row.brokerId)] || v || row.Broker && row.Broker.name || row.brokerName || ''-'';
    } },
    { title: t(''Reasegurador''), dataIndex: ''name'', width: 170, render: function (v, row) {
      return contactDirectory[String(row.contactId)] || v || row.contactName || row.contactId || ''-'';
    } },
    { title: t(''Participacion %''), dataIndex: ''split'', align: ''right'', width: 130, render: function (v) {
      return Number(v || 0).toFixed(4) + ''%'';
    } },
    { title: t(''Suma cedida''), dataIndex: ''sumInsured'', align: ''right'', width: 130, render: function (v) { return fmt(v); } },
    { title: t(''Prima cedida''), dataIndex: ''premium'', align: ''right'', width: 130, render: function (v) { return fmt(v); } },
    { title: t(''Comision''), dataIndex: ''commission'', align: ''right'', width: 120, render: function (v) { return fmt(v); } },
    { title: t(''Impuesto''), dataIndex: ''tax'', align: ''right'', width: 120, render: function (v) { return fmt(v); } }
  ];

  function renderCoinsuranceTab() {
    if (!calc) return <Empty description={t(''Calcule el endoso para visualizar el coaseguro'')} />;
    const finalCoverages = Array.isArray(calc.finalCoverages) ? calc.finalCoverages : [];
    const base = finalCoverages.reduce(function (total, coverage) {
      total.sum += coinsuranceNumber(coverage.limit || coverage.sumInsured);
      total.premium += coinsuranceNumber(coverage.premium || coverage.newPremium);
      return total;
    }, { sum: 0, premium: 0 });
    const rows = (coinsuranceCessions || []).map(function (cession, index) {
      const percentage = coinsuranceNumber(cession.percentage);
      const premium = money(base.premium * percentage / 100);
      const sourcePremium = coinsuranceNumber(cession.premiumCeded || cession.premium);
      const commissionRate = sourcePremium ? coinsuranceNumber(cession.commission) / sourcePremium : 0;
      const taxRate = sourcePremium ? coinsuranceNumber(cession.tax) / sourcePremium : 0;
      const catalogContact = (coinsuranceContacts || []).find(function (item) {
        return String(item.id) === String(cession.contactId);
      });
      return {
        key: cession.id || String(cession.contactId) + ''-'' + index,
        name: (catalogContact && catalogContact.name)
          || (cession.Contact && (cession.Contact.name || cession.Contact.description)) || String(cession.contactId || ''-''),
        leader: Number(cession.leader) === 1 || cession.leader === true,
        percentage: percentage,
        sum: money(base.sum * percentage / 100),
        premium: premium,
        commission: money(premium * commissionRate),
        tax: money(premium * taxRate)
      };
    });
    const placedPercentage = rows.reduce(function (sum, row) { return sum + row.percentage; }, 0);
    const companyPercentage = Math.max(0, 100 - placedPercentage);
    const company = {
      key: ''company'', name: t(''Compañía''), leader: Number(policy && policy.coinsurance) === 1,
      percentage: companyPercentage, sum: money(base.sum * companyPercentage / 100),
      premium: money(base.premium * companyPercentage / 100), commission: 0, tax: 0
    };
    const displayRows = rows.concat([company]);
    const columns = [
      { title: t(''Coasegurador''), dataIndex: ''name'' },
      { title: t(''Lider''), dataIndex: ''leader'', align: ''center'', render: function (v) { return v ? t(''Si'') : t(''No''); } },
      { title: t(''Participacion %''), dataIndex: ''percentage'', align: ''right'', render: function (v) { return Number(v || 0).toFixed(4) + ''%''; } },
      { title: t(''Suma''), dataIndex: ''sum'', align: ''right'', render: function (v) { return fmt(v); } },
      { title: t(''Prima''), dataIndex: ''premium'', align: ''right'', render: function (v) { return fmt(v); } },
      { title: t(''Comision''), dataIndex: ''commission'', align: ''right'', render: function (v) { return fmt(v); } },
      { title: t(''Impuesto''), dataIndex: ''tax'', align: ''right'', render: function (v) { return fmt(v); } }
    ];
    return <div className="axx-coaseguro-view">
      <Alert type="info" showIcon message={t(''Coaseguro informativo'')} description={t(''Los valores se calculan con el estado final del endoso y no son editables. La distribución de reaseguro utiliza únicamente la porción restante.'')} />
      <Table size="small" pagination={false} rowKey="key" dataSource={displayRows} columns={columns}
        summary={function () { return <Table.Summary><Table.Summary.Row className="axx-rea-total-row">
          <Table.Summary.Cell index={0}><b>{t(''Totales'')}</b></Table.Summary.Cell>
          <Table.Summary.Cell index={1}></Table.Summary.Cell>
          <Table.Summary.Cell index={2} align="right">{Number(displayRows.reduce(function (sum, row) { return sum + row.percentage; }, 0)).toFixed(4)}%</Table.Summary.Cell>
          <Table.Summary.Cell index={3} align="right">{fmt(displayRows.reduce(function (sum, row) { return sum + row.sum; }, 0))}</Table.Summary.Cell>
          <Table.Summary.Cell index={4} align="right">{fmt(displayRows.reduce(function (sum, row) { return sum + row.premium; }, 0))}</Table.Summary.Cell>
          <Table.Summary.Cell index={5} align="right">{fmt(displayRows.reduce(function (sum, row) { return sum + row.commission; }, 0))}</Table.Summary.Cell>
          <Table.Summary.Cell index={6} align="right">{fmt(displayRows.reduce(function (sum, row) { return sum + row.tax; }, 0))}</Table.Summary.Cell>
        </Table.Summary.Row></Table.Summary>; }} />
    </div>;
  }

  const colsPersistida = [
    { title: t(''Contrato''), dataIndex: ''contractId'', width: 100 },
    { title: t(''Linea''), dataIndex: ''lineId'', width: 130 },
    { title: t(''Cobertura''), dataIndex: ''coverageCode'', width: 110 },
    { title: t(''Movimiento''), dataIndex: ''premium'', align: ''right'', width: 130, render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } },
    { title: t(''Retencion''), dataIndex: ''premiumCedant'', align: ''right'', width: 130, render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } },
    { title: t(''Cedido''), dataIndex: ''premiumRe'', align: ''right'', width: 130, render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } }
  ];

  const colsRea = [
    { title: t(''Cobertura''), dataIndex: ''coverageCode'', width: 100 },
    { title: t(''Descripcion''), dataIndex: ''cover'' },
    { title: t(''Suma para el contrato''), dataIndex: ''counts'', width: 160, render: function (v) { return v ? <Tag color="blue">{t(''Si'')}</Tag> : <Tag>{t(''No'')}</Tag>; } },
    { title: t(''Suma movimiento''), dataIndex: ''sumInsuredMovement'', align: ''right'', width: 130, render: function (v, row) { return fmt(rowSumMovement(row)); } },
    { title: t(''Movimiento''), dataIndex: ''premiumMovement'', align: ''right'', width: 120, render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } },
    { title: t(''Base prorrateada''), dataIndex: ''proratedMovement'', align: ''right'', width: 140, render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } },
    { title: t(''% Retencion''), dataIndex: ''proportionCed'', align: ''right'', width: 120, render: function (v) { return (Number(v || 0) * 100).toFixed(2) + ''%''; } },
    { title: t(''Suma retencion''), dataIndex: ''sumInsuredCedant'', align: ''right'', width: 130, render: function (v) { return fmt(v); } },
    { title: t(''Prima retencion''), dataIndex: ''premiumCedant'', align: ''right'', width: 130, render: function (v) { return fmt(v); } },
    { title: t(''% Cedido''), dataIndex: ''proportionRe'', align: ''right'', width: 110, render: function (v) { return (Number(v || 0) * 100).toFixed(2) + ''%''; } },
    { title: t(''Suma cedida''), dataIndex: ''sumInsuredRe'', align: ''right'', width: 130, render: function (v) { return fmt(v); } },
    { title: t(''Prima cedida''), dataIndex: ''premiumRe'', align: ''right'', width: 130, render: function (v) { return fmt(v); } },
    { title: t(''Comision''), dataIndex: ''commission'', align: ''right'', width: 120, render: function (v) { return fmt(v); } },
    { title: t(''Impuesto''), dataIndex: ''tax'', align: ''right'', width: 120, render: function (v) { return fmt(v); } }
  ];

  const contractRows = (function () {
    const grouped = {};
    ((sim && sim.contracts) || []).forEach(function (group) {
      const contractId = String(group.contractId);
      if (!grouped[contractId]) {
        grouped[contractId] = {
          key: contractId,
          contractId: group.contractId,
          policyId: policy ? policy.id : '''',
          endorsement: calc && calc.changeId ? calc.changeId : 0,
          movementType: calc && calc.direction === ''EXTENSION'' ? t(''Extension'') : t(''Endoso''),
          groups: [],
          lines: 0,
          movement: 0,
          sum: 0,
          cedant: 0,
          sumCedant: 0,
          re: 0,
          sumRe: 0,
          commission: 0,
          tax: 0,
          coverages: 0
        };
      }
      const row = grouped[contractId];
      row.groups.push(group);
      row.lines += 1;
      row.movement += numberFrom(group.totals, [''movement'']);
      row.sum += numberFrom(group.totals, [''sumMovement'']);
      row.cedant += numberFrom(group.totals, [''cedant'']);
      row.sumCedant += numberFrom(group.totals, [''sumCedant'']);
      row.re += numberFrom(group.totals, [''re'']);
      row.sumRe += numberFrom(group.totals, [''sumRe'']);
      row.commission += numberFrom(group.totals, [''commission'']);
      row.tax += numberFrom(group.totals, [''tax'']);
      row.coverages += (group.rows || []).length;
    });
    return Object.keys(grouped).map(function (key) {
      const row = grouped[key];
      const currentRows = (baseCessions || []).filter(function (cession) {
        return String(cession.contractId) === String(row.contractId);
      });
      currentRows.forEach(function (cession) {
        row.sum += numberFrom(cession, [''sumInsured'']);
        row.movement += numberFrom(cession, [''premium'']);
        row.cedant += numberFrom(cession, [''premiumCedant'']);
        row.sumCedant += numberFrom(cession, [''sumInsuredCedant'']);
        row.re += numberFrom(cession, [''premiumRe'']);
        row.sumRe += numberFrom(cession, [''sumInsuredRe'']);
        row.commission += numberFrom(cession, [''comissionCedant'', ''commission'']);
        row.tax += numberFrom(cession, [''tax'']);
      });
      // Las lineas nuevas de distribucion se crean en memoria y pueden traer
      // nuevamente el movimiento del endoso. El movimiento final del contrato
      // debe sumar la cartera vigente mas la variacion una sola vez.
      const basePremium = currentRows.reduce(function (sum, cession) {
        return sum + numberFrom(cession, [''premium'']);
      }, 0);
      const baseSum = currentRows.reduce(function (sum, cession) {
        return sum + numberFrom(cession, [''sumInsured'']);
      }, 0);
      const endorsementMovement = numberFrom(calc && calc.billing && calc.billing.movement, [''premium'']);
      const endorsementSumMovement = numberFrom(calc && calc.billing && calc.billing.movement, [''sum'']);
      row.movement = basePremium + endorsementMovement;
      row.sum = baseSum + endorsementSumMovement;
      // El encabezado debe reflejar la misma distribucion que se muestra
      // debajo, incluyendo las lineas creadas en memoria.
      const distributionRows = getDistributionRows(row);
      row.cedant = distributionRows.reduce(function (sum, item) {
        return sum + (item.isRetention ? Number(item.premium || 0) : 0);
      }, 0);
      row.sumCedant = distributionRows.reduce(function (sum, item) {
        return sum + (item.isRetention ? Number(item.sum || 0) : 0);
      }, 0);
      row.re = distributionRows.reduce(function (sum, item) {
        return sum + (item.canViewReinsurers ? Number(item.premium || 0) : 0);
      }, 0);
      row.sumRe = distributionRows.reduce(function (sum, item) {
        return sum + (item.canViewReinsurers ? Number(item.sum || 0) : 0);
      }, 0);
      row.commission = distributionRows.reduce(function (sum, item) { return sum + Number(item.commission || 0); }, 0);
      row.tax = distributionRows.reduce(function (sum, item) { return sum + Number(item.tax || 0); }, 0);
      row.movement = money(row.movement);
      row.sum = money(row.sum);
      row.cedant = money(row.cedant);
      row.sumCedant = money(row.sumCedant);
      row.re = money(row.re);
      row.sumRe = money(row.sumRe);
      row.commission = money(row.commission);
      row.tax = money(row.tax);
      return row;
    });
  })();

  const colsContracts = [
    { title: t(''Poliza''), dataIndex: ''policyId'', width: 100 },
    { title: t(''Contrato''), dataIndex: ''contractId'', width: 105 },
    { title: t(''Movimiento''), children: [
      { title: t(''Endoso''), dataIndex: ''endorsement'', width: 85 },
      { title: t(''Tipo''), dataIndex: ''movementType'', width: 100 }
    ] },
    { title: t(''Totales''), children: [
      { title: t(''Suma''), dataIndex: ''sum'', align: ''right'', width: 125, render: function (v) { return fmt(v); } },
      { title: t(''Prima''), dataIndex: ''movement'', align: ''right'', width: 125, render: function (v) { return fmt(v); } }
    ] },
    { title: t(''Retencion''), children: [
      { title: t(''Prima Ret''), dataIndex: ''cedant'', align: ''right'', width: 125, render: function (v) { return fmt(v); } },
      { title: t(''Suma Ret''), dataIndex: ''sumCedant'', align: ''right'', width: 125, render: function (v) { return fmt(v); } }
    ] },
    { title: t(''Cedido''), children: [
      { title: t(''Prima Ced''), dataIndex: ''re'', align: ''right'', width: 125, render: function (v) { return fmt(v); } },
      { title: t(''Suma Ced''), dataIndex: ''sumRe'', align: ''right'', width: 125, render: function (v) { return fmt(v); } }
    ] },
    { title: t(''Otros''), children: [
      { title: t(''Comision''), dataIndex: ''commission'', align: ''right'', width: 115, render: function (v) { return fmt(v); } },
      { title: t(''Impuesto''), dataIndex: ''tax'', align: ''right'', width: 115, render: function (v) { return fmt(v); } }
    ] }
  ];

  const colsDistribution = [
    { title: t(''Contrato''), dataIndex: ''contractLabel'', width: 145, render: function (v, row) {
      return <span className="axx-rea-line-label">
        <span>{v}</span>
        {row.canViewReinsurers ? <Button type="text" size="small" className="axx-folder-btn"
          aria-label={t(''Ver reaseguradores'')} title={t(''Ver reaseguradores'')}
          onClick={function (event) {
            event.stopPropagation();
            setSelectedReinsuranceLineKey(row.groupKey);
            setReinsurersReady(true);
            setReaDetailTab(''reinsurers'');
          }}><FolderIcon /></Button> : null}
      </span>;
    } },
    { title: t(''Porcentaje (%)''), dataIndex: ''percentage'', align: ''right'', width: 135, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={4} readOnly={row.isCoinsurance} onCommit={function (x) { editContractPercentage(row.groupKey, row.percentageField, x); }} />;
    } },
    { title: t(''Suma''), dataIndex: ''sum'', align: ''right'', width: 135, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={2} readOnly={row.isCoinsurance} onCommit={function (x) { setManualContractAmount(row.groupKey, row.manualPrefix + ''Sum'', x); }} />;
    } },
    { title: t(''Prima''), dataIndex: ''premium'', align: ''right'', width: 135, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={2} readOnly={row.isCoinsurance} onCommit={function (x) { setManualContractAmount(row.groupKey, row.manualPrefix + ''Premium'', x); }} />;
    } },
    { title: t(''% Comision''), dataIndex: ''commissionPercentage'', align: ''right'', width: 135, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={4} disabled={row.isRetention} readOnly={row.isCoinsurance} onCommit={function (x) { editContractRate(row.groupKey, ''commission'', x); }} />;
    } },
    { title: t(''Comision''), dataIndex: ''commission'', align: ''right'', width: 135, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={2} disabled={row.isRetention} readOnly={row.isCoinsurance} onCommit={function (x) { setManualContractAmount(row.groupKey, ''Commission'', x); }} />;
    } },
    { title: t(''% Impuesto''), dataIndex: ''taxPercentage'', align: ''right'', width: 135, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={4} disabled={row.isRetention} readOnly={row.isCoinsurance} onCommit={function (x) { editContractRate(row.groupKey, ''tax'', x); }} />;
    } },
    { title: t(''Impuesto''), dataIndex: ''tax'', align: ''right'', width: 135, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={2} disabled={row.isRetention} readOnly={row.isCoinsurance} onCommit={function (x) { setManualContractAmount(row.groupKey, ''Tax'', x); }} />;
    } },
    { title: t(''Saldo Rea.''), dataIndex: ''reinsuranceBalance'', align: ''right'', width: 135, render: function (v) { return fmt(v); } }
  ];

  function getDistributionRows(contract) {
    const lineDefinitions = [
      { key: ''NO TECNICA'', label: ''No Técnica'' },
      { key: ''RETENCION'', label: ''Retención'' },
      { key: ''CUOTA PARTE'', label: ''Cuota Parte'' },
      { key: ''EXCEDENTE 1'', label: ''Excedente 1'' },
      { key: ''FAC'', label: ''Facultativo'' },
      { key: ''FRO'', label: ''Fronting'' },
      { key: ''COASEGURO'', label: ''Coaseguro'' }
    ];
    const normalizeLine = function (value) {
      const line = txt(value).toUpperCase();
      if (line === ''NT'' || line.indexOf(''NO TEC'') >= 0) return ''NO TECNICA'';
      if (line === ''RET'' || line.indexOf(''RETENC'') >= 0) return ''RETENCION'';
      if (line === ''CP'' || line.indexOf(''CUOTA'') >= 0) return ''CUOTA PARTE'';
      if (line === ''EX1'' || line.indexOf(''EXCEDENTE'') >= 0) return ''EXCEDENTE 1'';
      if (line === ''FAC'' || line.indexOf(''FACULT'') >= 0) return ''FAC'';
      if (line === ''FRO'' || line.indexOf(''FRONT'') >= 0) return ''FRO'';
      if (line === ''CO'' || line.indexOf(''COASEG'') >= 0) return ''COASEGURO'';
      return line;
    };
    const aggregate = function (rows) {
      return rows.reduce(function (total, row) {
        total.sum += numberFrom(row, [''sumInsured'']);
        total.premium += numberFrom(row, [''premium'']);
        total.sumRet += numberFrom(row, [''sumInsuredCedant'']);
        total.premiumRet += numberFrom(row, [''premiumCedant'']);
        total.sumCed += numberFrom(row, [''sumInsuredRe'']);
        total.premiumCed += numberFrom(row, [''premiumRe'']);
        total.commission += numberFrom(row, [''comissionCedant'', ''commission'']);
        total.tax += numberFrom(row, [''tax'']);
        return total;
      }, { sum: 0, premium: 0, sumRet: 0, premiumRet: 0, sumCed: 0, premiumCed: 0, commission: 0, tax: 0 });
    };
    const groupsByLine = {};
    (contract.groups || []).forEach(function (group) { groupsByLine[normalizeLine(group.lineId)] = group; });
    const baseByLine = {};
    (baseCessions || []).filter(function (row) { return String(row.contractId) === String(contract.contractId); }).forEach(function (row) {
      const key = normalizeLine(row.lineId);
      if (!baseByLine[key]) baseByLine[key] = [];
      baseByLine[key].push(row);
    });
    const rows = lineDefinitions.map(function (definition) {
      const isRetention = definition.key === ''RETENCION'';
      // El formulario guarda la retencion dentro de la linea Cuota Parte cuando
      // no existe una cesion separada con lineId RET.
      const g = groupsByLine[definition.key] || (isRetention ? groupsByLine[''CUOTA PARTE''] : null);
      const sourceBaseRows = baseByLine[definition.key] && baseByLine[definition.key].length
        ? baseByLine[definition.key]
        : (isRetention ? (baseByLine[''CUOTA PARTE''] || []) : []);
      const base = aggregate(sourceBaseRows);
      const totals = g && g.totals ? g.totals : {};
      const premium = base.premium + numberFrom(totals, [''movement'']);
      const commission = base.commission + numberFrom(totals, [''commission'']);
      const tax = base.tax + numberFrom(totals, [''tax'']);
      // La distribucion debe cerrar contra el total del movimiento del grupo.
      // Los campos cedente/cedido de la base pueden incluir ya la variacion,
      // por lo que no se vuelven a sumar para obtener el total.
      const fallbackGroupTotalPremium = base.premium + numberFrom(totals, [''movement'']);
      const fallbackGroupTotalSum = base.sum + numberFrom(totals, [''sumMovement'']);
      // Todas las lineas se distribuyen sobre el mismo total final del contrato.
      // Usar el total de cada grupo por separado dejaba primas diferentes cuando
      // se combinaban RET, Cuota Parte, FAC u otras lineas.
      const groupTotalPremium = Number(contract.movement || fallbackGroupTotalPremium);
      const groupTotalSum = Number(contract.sum || fallbackGroupTotalSum);
      const groupKey = g ? String(g.contractId) + ''-'' + String(g.lineId) : String(contract.contractId) + ''-'' + definition.key;
      // Retencion puede reutilizar el grupo de Cuota Parte; la fila visual
      // necesita una clave propia para que React no mezcle sus valores.
      const lineKey = groupKey + ''-'' + definition.key;
      const isCoinsurance = definition.key === ''COASEGURO'';
      const coinsurance = isCoinsurance ? contractCoinsuranceTotals(contract) : null;
      const isCededLine = !isRetention && !isCoinsurance && definition.key !== ''NO TECNICA'';
      const configuredRet = g && totals.distributionPercentageCed !== undefined
        ? Number(totals.distributionPercentageCed)
        : null;
      const configuredCed = g && totals.distributionPercentageRe !== undefined
        ? Number(totals.distributionPercentageRe)
        : null;
      const inferredRet = groupTotalPremium ? base.premiumRet / groupTotalPremium * 100 : 0;
      const inferredCed = groupTotalPremium ? base.premiumCed / groupTotalPremium * 100 : 0;
      const retentionPercentage = configuredRet === null ? inferredRet : configuredRet;
      const cededPercentage = configuredCed === null ? inferredCed : configuredCed;
      const finalPremiumRet = isRetention ? groupTotalPremium * reinsuranceBaseFactor() * retentionPercentage / 100 : 0;
      const finalSumRet = isRetention ? groupTotalSum * reinsuranceBaseFactor() * retentionPercentage / 100 : 0;
      const finalPremiumCed = isCededLine ? groupTotalPremium * reinsuranceBaseFactor() * cededPercentage / 100 : 0;
      const finalSumCed = isCededLine ? groupTotalSum * reinsuranceBaseFactor() * cededPercentage / 100 : 0;
      const manualSumField = isRetention ? ''manualRetentionSum'' : ''manualCededSum'';
      const manualPremiumField = isRetention ? ''manualRetentionPremium'' : ''manualCededPremium'';
      const displaySum = isCoinsurance ? coinsurance.sum : (totals[manualSumField] !== undefined ? Number(totals[manualSumField]) : (isRetention ? finalSumRet : finalSumCed));
      const displayPremium = isCoinsurance ? coinsurance.premium : (totals[manualPremiumField] !== undefined ? Number(totals[manualPremiumField]) : (isRetention ? finalPremiumRet : finalPremiumCed));
      const displayCommission = isCoinsurance ? coinsurance.commission : (isRetention ? 0 : (totals.manualCommission !== undefined ? Number(totals.manualCommission) : commission));
      const displayTax = isCoinsurance ? coinsurance.tax : (isRetention ? 0 : (totals.manualTax !== undefined ? Number(totals.manualTax) : tax));
      return {
        key: lineKey,
        groupKey: groupKey,
        contractLabel: definition.label,
        isRetention: isRetention,
        isCoinsurance: isCoinsurance,
        canViewReinsurers: isCededLine,
        manualPrefix: isRetention ? ''Retention'' : ''Ceded'',
        percentageField: isRetention ? ''proportionCed'' : ''proportionRe'',
        percentageConfigured: isCoinsurance || (g && totals[isRetention ? ''distributionPercentageCed'' : ''distributionPercentageRe''] !== undefined),
        percentage: isCoinsurance ? 0 : (g && totals[isRetention ? ''distributionPercentageCed'' : ''distributionPercentageRe''] !== undefined
          ? Number(totals[isRetention ? ''distributionPercentageCed'' : ''distributionPercentageRe''])
          : (g ? contractPercentage(g, isRetention ? ''proportionCed'' : ''proportionRe'') : 0)),
        sum: displaySum,
        premium: displayPremium,
        amountField: isRetention ? ''sumInsuredCedant'' : ''sumInsuredRe'',
        premiumField: isRetention ? ''premiumCedant'' : ''premiumRe'',
        premiumRet: finalPremiumRet,
        sumRet: finalSumRet,
        premiumCed: finalPremiumCed,
        sumCed: finalSumCed,
        commissionPercentage: isCoinsurance ? (coinsurance.premium ? coinsurance.commission / coinsurance.premium * 100 : 0) : (isRetention ? 0 : (g && totals.commissionPercentage !== undefined
          ? Number(totals.commissionPercentage)
          : ((finalPremiumCed || finalPremiumRet) ? Number((displayCommission / (finalPremiumCed || finalPremiumRet) * 100).toFixed(2)) : 0))),
        commission: displayCommission,
        taxPercentage: isCoinsurance ? (coinsurance.premium ? coinsurance.tax / coinsurance.premium * 100 : 0) : (isRetention ? 0 : (g && totals.taxPercentage !== undefined
          ? Number(totals.taxPercentage)
          : ((finalPremiumCed || finalPremiumRet) ? Number((displayTax / (finalPremiumCed || finalPremiumRet) * 100).toFixed(2)) : 0))),
        tax: displayTax,
        reinsuranceBalance: isCoinsurance ? 0 : money(finalPremiumCed - displayCommission),
        movementPremium: premium
      };
    });
    const totalSum = rows.reduce(function (sum, row) { return sum + Number(row.sum || 0); }, 0);
    const totalPremium = rows.reduce(function (sum, row) { return sum + Number(row.premium || 0); }, 0);
    const lastParticipating = rows.slice().reverse().find(function (row) {
      return Number(row.percentage || 0) > 0;
    });
    if (lastParticipating) {
      lastParticipating.sum = money(Number(lastParticipating.sum || 0) + Number(contract.sum || 0) - totalSum);
      lastParticipating.premium = money(Number(lastParticipating.premium || 0) + Number(contract.movement || 0) - totalPremium);
    }
    rows.forEach(function (row) {
      if (!row.percentageConfigured) {
        row.percentage = totalSum ? Number((Number(row.sum || 0) / totalSum * 100).toFixed(2)) : 0;
      }
    });
    return rows;
  }

  function renderSelectedLines(contract, mode) {
    if (mode === ''distribution'') {
      return <Table size="small" pagination={false} rowKey="key" scroll={{ x: 1250 }}
        dataSource={getDistributionRows(contract)} columns={colsDistribution}
        summary={function (pageData) {
          const total = function (field) { return money(pageData.reduce(function (sum, row) { return sum + Number(row[field] || 0); }, 0)); };
          return (
            <Table.Summary>
              <Table.Summary.Row className="axx-rea-total-row">
                <Table.Summary.Cell index={0}><b>{t(''Totales'')}</b></Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">{(total(''percentage'') - pageData.reduce(function (sum, row) { return sum + (row.isCoinsurance ? Number(row.percentage || 0) : 0); }, 0)).toFixed(2)}</Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">{fmt(total(''sum''))}</Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">{fmt(total(''premium''))}</Table.Summary.Cell>
                <Table.Summary.Cell index={4}></Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">{fmt(total(''commission''))}</Table.Summary.Cell>
                <Table.Summary.Cell index={6}></Table.Summary.Cell>
                <Table.Summary.Cell index={7} align="right">{fmt(total(''tax''))}</Table.Summary.Cell>
                <Table.Summary.Cell index={8} align="right">{fmt(total(''reinsuranceBalance''))}</Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          );
        }} />;
    }
    const groupsToRender = mode === ''reinsurers'' && selectedReinsuranceLineKey
      ? contract.groups.filter(function (item) {
        return String(item.contractId) + ''-'' + String(item.lineId) === selectedReinsuranceLineKey;
      })
      : contract.groups;
    return groupsToRender.map(function (g) {
      const groupKey = String(g.contractId) + ''-'' + String(g.lineId);
      const groupRows = (g.rows || []).map(function (row) {
        return Object.assign({}, row, { _groupKey: groupKey });
      });
      const lineParticipants = getLineParticipants(g);
      return (
        <div key={mode + groupKey} className="axx-rea-line-detail">
          <div className="axx-rea-toolbar">
            <div className="axx-rea-summary">
              <b>{t(''Contrato'')}:</b> {g.contractId} {'' | ''} <b>{t(''Linea'')}:</b> {g.lineId} {'' | ''}
              <b>{t(''Movimiento'')}:</b> {conSigno(g.totals.movement)} {'' | ''}
              <b>{t(''Coberturas que suman'')}:</b> {g.totals.coveragesCounted}/{groupRows.length}
            </div>
          </div>
          {mode === ''coverage'' ? (
            <Table size="small" pagination={false} rowKey="coverageCode" scroll={{ x: 1700 }}
              dataSource={groupRows} columns={colsRea}
              expandable={{
                expandedRowRender: function (row) {
                  const participants = getCoverageParticipants(g, row.coverageCode);
                  return <div className="axx-coverage-participants">
                    <div className="axx-coverage-participants-title">{t(''Aceptantes de la cobertura'')}</div>
                    <Table size="small" pagination={false} rowKey={function (item) {
                      return String(item.contactId || '''') + ''-'' + String(item.brokerId || '''') + ''-'' + String(row.coverageCode);
                    }} dataSource={participants} columns={colsCoberturaAceptantes} />
                  </div>;
                },
                rowExpandable: function (row) {
                  return getCoverageParticipants(g, row.coverageCode).length > 0;
                }
              }} />
          ) : null}
          {mode === ''reinsurers'' ? (
            <>
            <div className="axx-rea-actions">
              <Button type="primary" size="small" onClick={function () { agregarAceptante(g); }}>
                {t(''Agregar aceptante'')}
              </Button>
              <Button size="small" onClick={guardarAceptantesMemoria}>
                {t(''Guardar distribución'')}
              </Button>
              <span>{t(''Distribución de aceptantes'')}</span>
            </div>
            <Table className="axx-aceptantes" size="small" pagination={false}
              rowKey={function (r) { return r.id || (r.cessionId + ''-'' + r.contactId + ''-'' + (r.brokerId || '''')); }}
              dataSource={lineParticipants} columns={colsAceptantes}
              />
            </>
          ) : null}
        </div>
      );
    });
  }

  const css = `
.axx299 { display:flex; flex-direction:column; min-width:0; overflow:hidden; font-size:13px; }
.axx299 .axx-topbar { display:flex; align-items:center; gap:8px; padding:4px 0; margin:0 4px 2px 4px;
          background:transparent; border:1px solid #e6ebf2; border-radius:6px; }
.axx299 .axx-topbar > * { margin-left:4px; }
.axx299 .axx-topbar .axx-return-btn { margin-left:auto; }
.axx299 .axx-status { background:#1677ff; color:#fff;
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
.axx299 .axx-tabs .ant-tabs-tab-active::after { content:''''; position:absolute; left:0; right:0; bottom:-1px;
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
.axx299 .axx-rea-toolbar { display:flex; align-items:center; flex-wrap:wrap; gap:8px; padding:6px 8px; margin-bottom:4px; background:#e6f4ff; border:1px solid #91caff; border-radius:4px; color:#1f1f1f; }
.axx299 .axx-rea-toolbar .axx-rea-summary { display:flex; align-items:center; flex-wrap:wrap; gap:4px; font-size:12px; }
.axx299 .axx-rea-toolbar .axx-rea-summary b { color:#1677ff; }
.axx299 .axx-rea-editor { display:flex; flex-wrap:wrap; align-items:flex-end; gap:8px; padding:6px; margin-bottom:4px; background:#f7f9fb; border:1px solid #d9e2ec; }
.axx299 .axx-rea-editor-label { font-weight:600; color:#334155; margin-right:4px; }
.axx299 .axx-rea-editor label { display:flex; flex-direction:column; gap:2px; color:#5a6572; font-size:11px; }
.axx299 .axx-rea-editor .ant-input-number { width:105px; }
.axx299 .axx-rea-line-detail { margin-top:8px; padding:4px; border:1px solid #d9e2ec; background:#fff; }
.axx299 .axx-rea-detail-tabs .ant-table-summary .axx-rea-total-row > td { background:#86b4ff !important; color:#0b1f3a; font-weight:700; }
.axx299 .axx-rea-line-label { display:flex; align-items:center; justify-content:space-between; gap:6px; }
.axx299 .axx-folder-btn { color:#1677ff; min-width:24px; height:24px; padding:2px 4px; }
.axx299 .axx-folder-btn:hover { color:#0958d9; background:#e6f4ff; }
.axx299 .axx-rea-detail-tabs .ant-input-number-input { text-align:right !important; }
.axx299 .axx-coverage-participants { margin:0 8px 4px 24px; padding:6px; background:#f7f9fb; border:1px solid #d9e2ec; }
.axx299 .axx-coverage-participants-title { margin-bottom:4px; color:#334155; font-weight:600; font-size:12px; }
.axx299 .axx-coverage-participants .ant-table-wrapper { border:1px solid #d9e2ec; }
.axx299 .axx-rea-actions { display:flex; align-items:center; gap:8px; padding:6px 8px; margin-bottom:6px; background:#e6f4ff; border:1px solid #91caff; border-radius:4px; color:#334155; font-size:12px; }
.axx299 .axx-execution-mask { position:fixed; inset:0; z-index:1000000; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,.58); cursor:wait; }
.axx299 .axx-execution-mask > div { display:flex; align-items:center; gap:10px; padding:14px 18px; background:#fff; border:1px solid #91caff; border-radius:6px; box-shadow:0 4px 16px rgba(0,0,0,.16); color:#1677ff; font-weight:600; }
`;

  const puedeEjecutar = !!(calc && calc.rows && calc.rows.length && !running && reinsuranceConfirmed);
  const reinsuranceValidation = calc && sim
    ? validateReinsuranceDistribution()
    : { ok: false, errors: [t(''La distribución de reaseguro todavía no está cargada.'')] };
  const openedWithPolicy = /[?&]policyId=\d+/.test(String(window.location.href || ''''));

  return (
    <DefaultPage title={t(''Endoso de vigencia de Fianzas'')} subTitle={policy ? policy.code : ''''}>
      <div className="axx299">
        <style>{css}</style>

        {running ? (
          <div className="axx-execution-mask" role="alert" aria-busy="true">
            <div><Spin size="small" /> {t(''Procesando endoso, espere por favor...'')}</div>
          </div>
        ) : null}

        <div className="axx-status">
          <b>{t(''Poliza'')}:</b> {policy ? policy.code + '' — '' + ((policy.Product && (policy.Product.name || policy.Product.description)) || policy.productCode) + '' — '' + ((policy.Currency && (policy.Currency.name || policy.Currency.description)) || policy.currency) : t(''sin cargar'')}
          {policy ? <span>{'' | ''}<b>{t(''Estado'')}:</b> {policy.entityState === ''ACTIVE'' ? t(''Activo'') : (policy.entityState === ''INACTIVE'' ? t(''Inactivo'') : t(policy.entityState))}</span> : null}
          {calc ? <span>{'' | ''}<b>{t(''Movimiento'')}:</b> {calc.direction === ''EXTENSION'' ? t(''Extension'') : t(''Reduccion'')} ({calc.deltaDays} {t(''dias'')})</span> : null}
        </div>

        <div className="axx-topbar">
          {!openedWithPolicy ? (
            <>
            <span>{t(''Poliza'')}</span>
            <Input id="txtBuscarPoliza" style={{ width: 200 }} placeholder={t(''Numero o codigo'')}
              value={buscarPoliza} onChange={function (e) { setBuscarPoliza(e.target.value); }}
              onPressEnter={buscar} />
            <Button id="btnBuscarPoliza" onClick={buscar} loading={loading}>{t(''Cargar poliza'')}</Button>
            {!policy ? <span style={{ color: ''#5a6572'' }}>{t(''Abra la vista desde la poliza o indique aqui su numero o codigo'')}</span> : null}
            </>
          ) : null}
          <Button type="primary" onClick={confirmarReaseguro} disabled={!calc || running}>
            {t(''Confirmar reaseguro'')}
          </Button>
          <Button id="btnEjecutar" type="primary" disabled={!puedeEjecutar} loading={running}
            onClick={function () { setNote(''''); setNoteTouched(false); setModal(true); }}>
            {t(''Ejecutar endoso'')}
          </Button>
          <Button className="axx-btn-sec axx-return-btn" icon={<ReturnIcon />} onClick={retornarAPoliza} disabled={!policyId || running}>
            {t(''Retornar'')}
          </Button>
        </div>

        {error ? <Alert className="axx-alerta" type="error" showIcon message={error} closable onClose={function () { setError(null); }} /> : null}

        {result ? (
          <Alert type={result.ok === false ? ''error'' : ''success''} showIcon
            message={result.ok === false ? t(''El endoso no se completo'') : t(''Endoso procesado'')}
            description={result.msg} closable onClose={function () { setResult(null); }} />
        ) : null}

        {result && result.persistedDistribution && result.persistedDistribution.length ? (
          <div className="axx-panel">
            <Table className="axx-persistida" size="small" pagination={false} rowKey="id"
              dataSource={result.persistedDistribution} columns={colsPersistida}
              title={function () {
                return t(''Cesion escrita por el endoso'') + (result.rounding && result.rounding.length
                  ? '' — '' + t(''con ajuste de redondeo de un centavo en'') + '' '' + result.rounding.length + '' '' + t(''importe(s)'')
                  : '''');
              }} />
          </div>
        ) : null}

        <Tabs className="axx-tabs" activeKey={tab} onChange={setTab} type="card"
          items={[
            {
              key: ''calc'', label: t(''Calculo de cobertura''), children: (
                <div className="axx-panel">
                  <Card bordered={false}>
                    <div className="axx-filtros">
                      <div className="axx-campo" style={{ minWidth: 260 }}>
                        <label>{t(''Cobertura a endosar'')}</label>
                        <Select id="cbxCobertura" value={covCode} style={{ width: 260 }}
                          onChange={function (v) {
                            setCovCode(v);
                            const selectedCoverage = (policy && Array.isArray(policy.Coverages)
                              ? policy.Coverages.find(function (item) { return txt(item.code) === txt(v); })
                              : null) || eligible.find(function (item) { return item.code === v; });
                            setNewEnd(selectedCoverage && selectedCoverage.end
                              ? moment(day10(selectedCoverage.end), ''YYYY-MM-DD'', true)
                              : null);
                            invalidate();
                          }}
                          options={eligible.map(function (c) { return { value: c.code, label: c.code + '' — '' + c.name }; })} />
                      </div>
                      <div className="axx-campo">
                        <label>{t(''Fecha final actual'')}</label>
                        <Input id="txtFinActual" readOnly style={{ width: 140 }} value={selectedPolicyCoverage ? day10(selectedPolicyCoverage.end) : ''''} />
                      </div>
                      <div className="axx-campo">
                        <label>{t(''Nueva fecha final'')}</label>
                        <DatePicker id="dtpNuevoFin" style={{ width: 150 }} value={newEnd}
                          onChange={function (v) { setNewEnd(v); invalidate(); }} />
                      </div>
                      <div className="axx-campo">
                        <label>{t(''Recargo'')}</label>
                        <InputNumber id="numRecargo" min={0} step={1} style={{ width: 120 }} value={surcharge}
                          onChange={function (v) { onAjuste(''surcharge'', v); }} />
                      </div>
                      <div className="axx-campo">
                        <label>{t(''Descuento'')}</label>
                        <InputNumber id="numDescuento" min={0} step={1} style={{ width: 120 }} value={discount}
                          onChange={function (v) { onAjuste(''discount'', v); }} />
                      </div>
                      <Button id="btnCalcular" type="primary" loading={loading}
                        disabled={!covCode || !newEnd} onClick={calcular}>{t(''Calcular endoso'')}</Button>
                    </div>

                    <Spin spinning={loading}>
                      {calc ? (
                        <div>
                          <Table className="axx-grilla" size="small" pagination={false} rowKey="code"
                            dataSource={calc.rows} columns={colsGrid} scroll={{ y: altoGrilla }} />
                          <div style={{ height: 8 }} />
                          <Table className="axx-resumen" size="small" pagination={false} rowKey="key"
                            dataSource={filasResumen} columns={colsResumen}
                            title={function () { return t(''Resumen de facturacion'') + '' ('' + calc.billing.currency + '')''; }} />
                          <div className="axx-pie">
                            {t(''Movimiento'')}: <span className={signo(calc.billing.movement.premium)}>{conSigno(calc.billing.movement.premium)}</span>
                            {'' ''}{t(''prima'')} {'' | ''}
                            <span className={signo(calc.billing.movement.tax)}>{conSigno(calc.billing.movement.tax)}</span> {t(''impuesto'')} {'' | ''}
                            <span className={signo(calc.billing.movement.total)}>{conSigno(calc.billing.movement.total)}</span> {t(''total'')}
                            {'' | ''}{t(''Fecha efectiva'')}: {day10(calc.effectiveDate)}
                          </div>
                        </div>
                      ) : <Empty description={t(''Indique la nueva fecha final y pulse Calcular endoso'')} />}
                    </Spin>
                  </Card>
                </div>
              )
            },
            {
              key: ''rea'', label: t(''Reaseguro del movimiento''), children: (
                <div className="axx-panel">
                  <Card bordered={false}>
                    <Alert type="info" showIcon
                      message={t(''Distribución de reaseguro'')} />
                    <Spin spinning={simLoading}>
                      {!calc ? <Empty description={t(''Calcule el endoso en la primera pestania'')} /> : null}
                      {calc && sim && sim.contracts && sim.contracts.length ? (
                        <div>
                          <Table className="axx-rea-contracts" size="small" pagination={false} rowKey="key"
                            dataSource={contractRows} columns={colsContracts}
                            rowSelection={{ type: ''radio'', selectedRowKeys: selectedReinsuranceKey ? [selectedReinsuranceKey] : [], onChange: function (keys) {
                              setSelectedReinsuranceKey(keys[0] || null);
                              setSelectedReinsuranceLineKey(null);
                              setReinsurersReady(false);
                              setReaDetailTab(''distribution'');
                            } }}
                            onRow={function (row) { return { onClick: function () { setSelectedReinsuranceKey(row.key); } }; }} />
                          {contractRows.filter(function (row) { return row.key === selectedReinsuranceKey; }).map(function (contract) {
                            return (
                              <Tabs className="axx-rea-detail-tabs" type="card" activeKey={reaDetailTab} onChange={setReaDetailTab}>
                                <Tabs.TabPane tab={t(''Distribucion'')} key="distribution">
                                  <div className="axx-rea-actions">
                                    <Button type="primary" onClick={guardarDistribucionMemoria}>{t(''Guardar'')}</Button>
                                    <span>{t(''Distribución de reaseguro'')}</span>
                                  </div>
                                  {renderSelectedLines(contract, ''distribution'')}
                                </Tabs.TabPane>
                                <Tabs.TabPane tab={t(''Reaseguradores'')} key="reinsurers" disabled={!reinsurersReady}>
                                  {reinsurersReady ? renderSelectedLines(contract, ''reinsurers'') : <Empty description={t(''Seleccione ver aceptantes en una línea cedida'')} />}
                                </Tabs.TabPane>
                                <Tabs.TabPane tab={t(''Coaseguro'')} key="coinsurance">
                                  {renderCoinsuranceTab()}
                                </Tabs.TabPane>
                                <Tabs.TabPane tab={t(''Cobertura'')} key="coverage">
                                  {renderSelectedLines(contract, ''coverage'')}
                                </Tabs.TabPane>
                              </Tabs>
                            );
                          })}
                          {sim.warnings && sim.warnings.length
                            ? <Alert type="warning" showIcon message={sim.warnings.join('' | '')} /> : null}
                          {!reinsuranceValidation.ok
                            ? <Alert type="error" showIcon message={t(''La distribución no permite ejecutar el endoso'')} description={reinsuranceValidation.errors.join('' '')} />
                            : <Alert type="success" showIcon message={t(''La distribución de reaseguro es válida para ejecutar'')} />}
                          <div className="axx-pie">
                            {t(''Prima final del endoso'')}: {fmt(calc.billing.premium.after)} {'' | ''}
                            {t(''Prima final distribuida'')}: {fmt(calc.billing.premium.after)} {'' | ''}
                            {t(''Estado'')}: {'' ''}
                            {reinsuranceValidation.ok ? <Tag color="blue">{t(''Cuadrado'')}</Tag> : <Tag color="red">{t(''Descuadrado'')}</Tag>}
                          </div>
                        </div>
                      ) : null}
                      {calc && sim && (!sim.contracts || !sim.contracts.length)
                        ? <Empty description={sim.msg || t(''La poliza no tiene reaseguro vigente para este movimiento'')} /> : null}
                    </Spin>
                  </Card>
                </div>
              )
            }
          ]} />

        <Modal wrapClassName="axx299-modal" title={t(''Confirmar ejecucion del endoso'')} open={modal}
          okText={t(''Confirmar'')} cancelText={t(''Cancelar'')} confirmLoading={running}
          okButtonProps={{ id: ''btnConfirmar'', disabled: running }}
          onOk={ejecutar}
          onCancel={function () { if (!running) { setModal(false); } }}>
          <div>
            {calc ? (
              <div style={{ marginBottom: 8 }}>
                {t(''Cobertura'')} <b>{calc.rows[0].code}</b>: {day10(calc.rows[0].oldEnd)} → <b>{day10(calc.rows[0].newEnd)}</b><br />
                {t(''Prima'')} {fmt(calc.rows[0].oldPremium)} → <b>{fmt(calc.rows[0].adjustedPremium)}</b> {calc.billing.currency}
                {'' ''}({conSigno(calc.rows[0].variation)})<br />
                {t(''Total de la poliza'')} {fmt(calc.billing.total.before)} → <b>{fmt(calc.billing.total.after)}</b>
              </div>
            ) : null}
            <label>{t(''Observacion'')} *</label>
            <Input.TextArea id="txtObservacion" rows={3} value={note} maxLength={500}
              onChange={function (e) { setNote(e.target.value); setNoteTouched(true); }} />
            {noteTouched && !txt(note)
              ? <div style={{ color: ''#cf1322'' }}>{t(''La observacion es obligatoria'')}</div> : null}
          </div>
        </Modal>
      </div>
    </DefaultPage>
  );
}
', N'ENDORSEMENT', N'Permite aplicar un endoso de extensión o reducción de vigencia por cobertura', 0);

    INSERT INTO dbo.LiveView (id, name, code, category, operation, multiComponent) VALUES (55, N'viewOcupacionesAXX343', N'() => {
  const {useState, useEffect, useRef} = React;
  const {Table, Button, Drawer, Modal, Input, Select, Alert, Form, Space} = A;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('''');
  const [drawer, setDrawer] = useState(false);
  const empty = {id:'''', name:'''', cobis:''''};
  const [draft, setDraft] = useState(empty);
  const [filters, setFilters] = useState(empty);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({name:'''', percentage:'''', category:'''', status:undefined, cobis:''''});
  const [height, setHeight] = useState(300);
  const request = useRef(0);
  const load = () => {
    const current = ++request.current;
    setLoading(true); setError('''');
    exe(''GetFullTable'', {table:''actividad''}).then(r => {
      if (request.current !== current) return;
      if (!r.ok) throw new Error(r.msg || t(''No se pudo consultar el catálogo.''));
      const data = r.outData;
      const expected = [''cactividad'',''xactividad'',''pactividad'',''ccategoria'',''Estatus'',''COD_COBIS''];
      if (!Array.isArray(data) || !Array.isArray(data[0]) || expected.some((key,i) => data[0][i] !== key)) throw new Error(t(''El formato del catálogo cambió. No se actualizaron los resultados.''));
      setRows(data.slice(1).filter(row => Array.isArray(row) && row.some(x => x !== null && x !== '''')).map((row,i) => ({key:String(i),id:row[0],name:row[1],percentage:row[2],category:row[3],status:row[4],cobis:row[5],raw:row.slice()})));
    }).catch(e => {if (request.current === current) setError(t(String(e.message || e)));})
      .finally(() => {if (request.current === current) setLoading(false);});
  };
  useEffect(() => {load(); return () => {request.current++;};}, []);
  useEffect(() => {
    const measure = () => {
      const root = document.querySelector(''.axx343'');
      const body = root && root.querySelector(''.ant-table-body'');
      const pager = root && root.querySelector(''.ant-pagination'');
      if (!body) return;
      if (!pager) return;
      const bodyRect = body.getBoundingClientRect();
      const pagerRect = pager.getBoundingClientRect();
      const belowBody = pagerRect.bottom - bodyRect.bottom;
      const next = Math.max(100, window.innerHeight - bodyRect.top - belowBody - 14);
      if (Math.abs(next-height)>2) setHeight(next);
    };
    const timer = setTimeout(measure, 50);
    window.addEventListener(''resize'', measure);
    return () => {clearTimeout(timer); window.removeEventListener(''resize'', measure);};
  });
  const text = x => x === null || x === undefined ? '''' : String(x);
  const norm = x => text(x).normalize(''NFD'').replace(/[\u0300-\u036f]/g,'''').toLocaleLowerCase();
  const visible = rows.filter(r => (!filters.id || text(r.id)===filters.id.trim()) && (!filters.name || norm(r.name).includes(norm(filters.name.trim()))) && (!filters.cobis || text(r.cobis)===filters.cobis.trim()));
  const clear = () => {setDraft(empty); setFilters(empty); setPage(1);};
  const edit = row => {setEditing(row); setValues(row ? {name:text(row.name),percentage:text(row.percentage),category:text(row.category),status:text(row.status),cobis:text(row.cobis)} : {name:'''',percentage:'''',category:'''',status:''1'',cobis:''''}); setOpen(true);};
  const update = (key,value) => setValues(previous => Object.assign({},previous,{[key]:value}));
  const numericError = (value,integer) => {
    if (value === '''') return '''';
    if (!/^-?\d+(\.\d+)?$/.test(value) || !Number.isFinite(Number(value))) return t(''Ingrese un número válido.'');
    if (integer && !Number.isInteger(Number(value))) return t(''Ingrese un número entero.'');
    if (!integer && Math.abs(Number(value)*100-Math.round(Number(value)*100))>0.000001) return t(''Use como máximo dos decimales.'');
    return '''';
  };
  const percentageError = numericError(values.percentage,false);
  const categoryError = numericError(values.category,true);
  const save = () => {
    if (loading || !values.name.trim()) return;
    if (percentageError || categoryError || (values.status !== ''0'' && values.status !== ''1'')) {
      setError(t(''Revise los datos obligatorios y los formatos ingresados.''));
      return;
    }
    setLoading(true); setError('''');
    let nextData;
    const name = values.name.trim();
    const percentage = values.percentage === '''' ? '''' : Number(values.percentage.replace('','', ''.'')).toFixed(2);
    const category = values.category === '''' ? '''' : String(Number(values.category));
    exe(''GetFullTable'', {table:''actividad''})
      .then(response => {
        if (!response || response.ok === false) throw new Error((response && response.msg) || t(''No se pudo consultar el catálogo.''));
        const data = response.outData;
        const expected = [''cactividad'',''xactividad'',''pactividad'',''ccategoria'',''Estatus'',''COD_COBIS''];
        if (!Array.isArray(data) || !Array.isArray(data[0]) || expected.some((key,i) => data[0][i] !== key)) throw new Error(t(''El formato del catálogo cambió. No se actualizaron los resultados.''));
        nextData = data.map(row => Array.isArray(row) ? row.slice() : row);
        let index = -1;
        if (editing) {
          for (let i = 1; i < nextData.length; i++) {
            if (String(nextData[i][0]) === String(editing.id)) { index = i; break; }
          }
          if (index < 0) throw new Error(t(''La ocupación no existe. Actualice el listado.''));
          if (editing.raw && JSON.stringify(nextData[index]) !== JSON.stringify(editing.raw)) throw new Error(t(''La ocupación cambió desde que se abrió. Cancele y vuelva a editarla.''));
          nextData[index][1] = name;
          nextData[index][2] = percentage;
          nextData[index][3] = category;
          nextData[index][4] = values.status;
          nextData[index][5] = values.cobis.trim();
        } else {
          let nextId = 1;
          nextData.slice(1).forEach(row => { const id = Number(row && row[0]); if (Number.isSafeInteger(id) && id >= nextId) nextId = id + 1; });
          nextData.push([nextId, name, percentage, category, values.status, values.cobis.trim()]);
        }
        const json = JSON.stringify(nextData).replace(/''/g, "''''");
        return exe(''DoQuery'', {sql:"UPDATE [Table] SET data=''" + json + "'' WHERE [name]=''actividad''"});
      })
      .then(saved => {
        if (!saved || saved.ok === false) throw new Error((saved && saved.msg) || t(''No se pudo guardar la ocupación.''));
        return exe(''GetFullTable'', {table:''actividad''});
      })
      .then(verification => {
        if (!verification || verification.ok === false || !Array.isArray(verification.outData)) throw new Error(t(''No se pudo verificar el registro guardado.''));
        const persisted = verification.outData.slice(1).some(row => Array.isArray(row) && String(row[1]) === name && String(row[4]) === String(values.status));
        if (!persisted) throw new Error(t(''El registro no pudo verificarse después de guardar.''));
        const cleanRows = verification.outData.slice(1).filter(row => Array.isArray(row) && row.some(x => x !== null && x !== '''')).map((row,i) => ({key:String(i),id:row[0],name:row[1],percentage:row[2],category:row[3],status:row[4],cobis:row[5],raw:row.slice()}));
        setRows(cleanRows); setOpen(false); setEditing(null); A.message.success(t(''Ocupación guardada correctamente.''));
      })
      .catch(e => setError(String(e.message || e)))
      .then(() => setLoading(false));
  };
  const columns = [
    {title:t(''Id''),dataIndex:''id'',width:80},
    {title:t(''Nombre''),dataIndex:''name'',width:340,ellipsis:true},
    {title:t(''Porcentaje''),dataIndex:''percentage'',width:120,align:''right'',render:v => text(v)==='''' ? '''' : Number.isFinite(Number(v)) ? Number(v).toFixed(2) : text(v)},
    {title:t(''Categoría''),dataIndex:''category'',width:100},
    {title:t(''Estatus''),dataIndex:''status'',width:90,render:v => text(v)===''1'' ? t(''Si'') : text(v)===''0'' ? t(''No'') : t(''Sin estatus'')},
    {title:t(''COD_COBIS''),dataIndex:''cobis'',width:130,render:text},
    {title:t(''Acciones''),key:''actions'',width:110,render:(_,row) => <Button size="small" onClick={() => edit(row)}>{t(''Editar'')}</Button>}
  ];
  return <DefaultPage title={t(''Ocupaciones'')} icon="unordered-list">
    <div className="axx343">
      <style>{`
        .axx343{font-size:13px;min-width:0;max-width:100%}
        .axx343 .axx343-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:4px;border:1px solid #e6ebf2;border-radius:6px;margin:0 4px 8px;background:#fff}
        .axx343 .axx343-count{margin-left:auto;padding:0 8px}
        .axx343 .ant-alert{margin:0 4px 8px;font-size:13px}
        .axx343 .axx343-grid{border:1px solid #cbd1d8;border-radius:6px;padding:4px;background:white;min-width:0}
        .axx343 .ant-table-thead>tr>th{background:#bfbfbf!important;border-right:1px solid #cbd1d8!important;border-bottom:1px solid #cbd1d8!important;font-size:12px;padding:5px 8px!important;line-height:18px}
        .axx343 .ant-table-thead>tr>th:before{display:none!important}
        .axx343 .ant-table-tbody>tr>td{border-right:0!important;border-bottom:1px solid #cbd1d8!important;padding:5px 8px!important;font-size:12px;line-height:18px}
        .axx343 .ant-table-tbody>tr:hover>td{background:#b7d7ff!important}
        .axx343 .ant-table-body{min-height:${height}px}
        .axx343 .ant-table-pagination{margin:8px 0!important}
        .axx343-dialog .ant-modal-header,.axx343-drawer .ant-drawer-header{background:linear-gradient(90deg,#e6f4ff 0%,#4096ff 100%)}
        .axx343-dialog .ant-form-item{margin-bottom:14px}
        .axx343-dialog .ant-modal-body{max-height:65vh;overflow:auto}
        .axx343-dialog .ant-btn[disabled]{border:1px solid #d9d9d9!important;color:#777!important}
      `}</style>
      <div className="axx343-bar">
        <Button onClick={() => {setDraft(filters);setDrawer(true);}}>{t(''Filtrar'')}</Button>
        <Button type="primary" disabled={loading || !!error} onClick={() => edit(null)}>{t(''Nuevo'')}</Button>
        <Button loading={loading} onClick={load}>{t(''Actualizar'')}</Button>
        <span className="axx343-count" role="status">{visible.length} {t(''de'')} {rows.length} {t(''registros'')}</span>
      </div>
      {error ? <Alert type="error" showIcon message={error} description={t(''Se conservan los filtros y los últimos resultados disponibles. Pulse Actualizar para reintentar.'')}/> : null}
      <div className="axx343-grid"><Table rowKey="key" size="small" tableLayout="fixed" loading={loading} columns={columns} dataSource={visible} scroll={{x:1070,y:height}} locale={{emptyText:t(''No se encontraron ocupaciones.'')}} pagination={{current:page,pageSize:pageSize,showSizeChanger:true,pageSizeOptions:[''20'',''50'',''100''],locale:{items_per_page:t(''por página''),prev_page:t(''Página anterior''),next_page:t(''Página siguiente''),prev_5:t(''Cinco páginas anteriores''),next_5:t(''Cinco páginas siguientes'')},onChange:(p,s) => {setPage(p);setPageSize(s);}}}/></div>
      <Drawer className="axx343-drawer" title={t(''Filtrar ocupaciones'')} width="min(380px, 100vw)" visible={drawer} onClose={() => setDrawer(false)} footer={<Space><Button onClick={clear}>{t(''Limpiar filtros'')}</Button><Button type="primary" onClick={() => {setFilters(draft);setPage(1);setDrawer(false);}}>{t(''Buscar'')}</Button></Space>}>
        <Form layout="vertical" onFinish={() => {setFilters(draft);setPage(1);setDrawer(false);}}>
          <Form.Item label={t(''Id'')}><Input id="axx343-filter-id" value={draft.id} onChange={e => setDraft(Object.assign({},draft,{id:e.target.value}))}/></Form.Item>
          <Form.Item label={t(''Nombre'')}><Input id="axx343-filter-name" value={draft.name} onChange={e => setDraft(Object.assign({},draft,{name:e.target.value}))}/></Form.Item>
          <Form.Item label={t(''COD_COBIS'')}><Input id="axx343-filter-cobis" value={draft.cobis} onChange={e => setDraft(Object.assign({},draft,{cobis:e.target.value}))}/></Form.Item>
        </Form>
      </Drawer>
      <Modal wrapClassName="axx343-dialog" title={editing ? t(''Editar ocupación'') : t(''Nueva ocupación'')} visible={open} width={560} maskClosable={false} onCancel={() => {if(!loading)setOpen(false);}} footer={<Space><Button disabled={loading} onClick={() => setOpen(false)}>{t(''Cancelar'')}</Button><Button type="primary" loading={loading} onClick={save}>{t(''Guardar'')}</Button></Space>}>
        <Form layout="vertical" onFinish={save}>
          {editing ? <Form.Item label={t(''Id'')}><Input id="axx343-id" value={text(editing.id)} readOnly/></Form.Item> : null}
          <Form.Item label={t(''Nombre'')} required validateStatus={!values.name.trim()?''error'':''''} help={!values.name.trim()?t(''El nombre es obligatorio.''):null}><Input id="axx343-name" value={values.name} onChange={e => update(''name'',e.target.value)}/></Form.Item>
          <Form.Item label={t(''Estatus'')} required validateStatus={values.status!==''0''&&values.status!==''1''?''error'':''''} help={values.status!==''0''&&values.status!==''1''?t(''Seleccione un estatus.''):null}><Select id="axx343-status" value={values.status} style={{width:''100%''}} onChange={v => update(''status'',v)}><Select.Option value="1">{t(''Si'')}</Select.Option><Select.Option value="0">{t(''No'')}</Select.Option></Select></Form.Item>
          <Form.Item label={t(''Porcentaje'')} validateStatus={percentageError?''error'':''''} help={percentageError||null}><Input id="axx343-percentage" inputMode="decimal" value={values.percentage} onChange={e => update(''percentage'',e.target.value)}/></Form.Item>
          <Form.Item label={t(''Categoría'')} validateStatus={categoryError?''error'':''''} help={categoryError||null}><Input id="axx343-category" inputMode="numeric" value={values.category} onChange={e => update(''category'',e.target.value)}/></Form.Item>
          <Form.Item label={t(''COD_COBIS'')}><Input id="axx343-cobis" value={values.cobis} onChange={e => update(''cobis'',e.target.value)}/></Form.Item>
        </Form>
      </Modal>
    </div>
  </DefaultPage>;
}
', N'CATALOGOS', N'Mantenimiento de ocupaciones', 0);

    SET IDENTITY_INSERT dbo.LiveView OFF;
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    BEGIN TRY SET IDENTITY_INSERT dbo.LiveView OFF; END TRY BEGIN CATCH END CATCH;
    THROW;
END CATCH;
