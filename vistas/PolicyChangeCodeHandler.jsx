/**
 * @author Michael Delgado
 * @created 2026/09/15
 * @name PolicyChangeCodeHandler
 * @version 1.0
 * @purpose: List executed policy changes, update the policy code, and regenerate endorsement documents.
 */
() => {
  const { useEffect, useState } = React;
  const { Card, Table, Button, Input, Row, Col, Descriptions, Tag, Empty, Spin, message, Modal } = A;
  const [policy, setPolicy] = useState(null);
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingChangeId, setSavingChangeId] = useState(null);
  const [editingChangeId, setEditingChangeId] = useState(null);
  const [changeCodeDraft, setChangeCodeDraft] = useState('');
  const [loadError, setLoadError] = useState('');
  const [documentLoading, setDocumentLoading] = useState(null);
  const [selectedChange, setSelectedChange] = useState(null);

  function getPolicyId() {
    const contextId = typeof context !== 'undefined' && context ? Number(context.policyId || context.id || 0) : 0;
    if (contextId > 0) return contextId;
    try {
      const url = new URL(String(window.location.href || '').replace('#/', ''));
      return Number(url.searchParams.get('policyId') || 0);
    } catch (e) { return 0; }
  }
  function asRows(outData) {
    if (Array.isArray(outData)) return outData;
    if (outData && Array.isArray(outData.data)) return outData.data;
    if (outData && Array.isArray(outData.rows)) return outData.rows;
    if (outData && Array.isArray(outData.changes)) return outData.changes;
    if (outData && Array.isArray(outData.Changes)) return outData.Changes;
    return outData ? [outData] : [];
  }
  function isExecutedChange(change) {
    if (!change || change.status === undefined || change.status === null || change.status === '') return true;
    const status = String(change.status).trim().toUpperCase();
    return Number(change.status) === 1 || status === 'EXECUTED' || status === 'APPLIED';
  }
  function formatDate(value) {
    if (!value) return '-';
    const raw = String(value).trim();
    const utcValue = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw) ? raw : raw + 'Z';
    const date = new Date(utcValue);
    if (Number.isNaN(date.getTime())) return String(value);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return day + '/' + month + '/' + date.getFullYear();
  }
  function money(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '-';
    const fixed = number.toFixed(2).split('.');
    const integer = fixed[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return integer + '.' + fixed[1];
  }
  function firstValue(row, names) {
    const source = row && row.BillDiff ? row.BillDiff : row;
    for (let i = 0; i < names.length; i += 1) {
      if (source && source[names[i]] !== undefined && source[names[i]] !== null) return source[names[i]];
    }
    return 0;
  }
  function changeName(row) {
    return row && (row.name || row.description || row.type || row.Discriminator || (row.Process && (row.Process.nombre || row.Process.name))) || '-';
  }
  function loadData(policyId) {
    setLoading(true); setLoadError('');
    return Promise.all([
      exe('RepoLifePolicy', { operation: 'GET', filter: 'id=' + policyId, size: 1, noTracking: true }),
      exe('GetPolicyChanges', { policyId: policyId })
    ]).then(function (responses) {
      if (!responses[0] || !responses[0].ok) throw new Error((responses[0] && responses[0].msg) || t('The policy could not be loaded.'));
      if (!responses[1] || !responses[1].ok) throw new Error((responses[1] && responses[1].msg) || t('The policy changes could not be loaded.'));
      const loadedPolicy = asRows(responses[0].outData)[0];
      if (!loadedPolicy) throw new Error(t('Policy not found'));
      const loadedChanges = asRows(responses[1].outData).filter(isExecutedChange).sort(function (a, b) {
        return new Date(b.executionDate || b.date || 0).getTime() - new Date(a.executionDate || a.date || 0).getTime();
      });
      setPolicy(loadedPolicy); setChanges(loadedChanges);
    }).catch(function (error) {
      setPolicy(null); setChanges([]); setLoadError(error && error.message ? error.message : String(error));
    }).then(function () { setLoading(false); });
  }
  useEffect(function () {
    const policyId = getPolicyId();
    if (policyId > 0) loadData(policyId);
    else { setLoadError(t('A valid policy identifier was not provided.')); setLoading(false); }
  }, []);
  useEffect(function () {
    const styleId = 'policy-change-code-handler-style';
    if (document.getElementById(styleId)) return undefined;
    const style = document.createElement('style'); style.id = styleId;
    style.textContent = '.policy-change-code-view{height:calc(100dvh - 140px);min-height:360px;display:flex;flex-direction:column;background:#fff;border:1px solid #cbd1d8;border-radius:6px;overflow:hidden}.policy-change-code-view>.ant-card-head{flex:0 0 auto}.policy-change-code-view>.ant-card-body{display:flex;flex-direction:column;flex:1 1 auto;min-height:0;padding:4px!important}.policy-change-code-table{flex:1 1 auto;min-height:0;border:1px solid #cbd1d8}.policy-change-code-table .ant-table-thead > tr > th{background:#bfbfbf!important;color:#262626;font-weight:600;border-right:1px solid #cbd1d8!important;border-bottom:1px solid #cbd1d8!important;padding:5px 8px!important;font-size:12px;line-height:18px}.policy-change-code-table .ant-table-tbody > tr > td{border-right:0;border-bottom:1px solid #cbd1d8;padding:5px 8px!important;font-size:12px;line-height:18px}.policy-change-code-table .ant-table-tbody > tr:hover > td{background:#b7d7ff!important}.policy-change-code-table .ant-table-tbody > tr.ant-table-row-selected > td{background:#86b4ff!important}.policy-change-code-summary{flex:0 0 auto;margin-bottom:4px;border-color:#cbd1d8}.policy-change-code-summary>.ant-card-body{padding:8px!important}.policy-change-code-summary .ant-card-head{padding:0 12px;background:#bfbfbf;border-bottom-color:#cbd1d8}.policy-change-code-summary .ant-card-head-title{color:#262626;font-weight:600;padding:8px 0}.policy-change-code-actions{display:flex;gap:8px;align-items:center}.policy-change-code-actions .ant-btn-default{border-color:#8f9aa7}.policy-change-code-actions .ant-btn:disabled{opacity:1;border-color:#6f7b88}';
    document.head.appendChild(style);
    return function () { const current = document.getElementById(styleId); if (current) current.remove(); };
  }, []);
  function startChangeCodeEdit(change) {
    setEditingChangeId(Number(change.id));
    setChangeCodeDraft(String(change.code || ''));
  }
  function saveChangeCode(change) {
    const changeId = Number(change && change.id);
    const nextCode = String(changeCodeDraft || '').trim();
    if (!(changeId > 0) || !nextCode) { message.error(t('Change code is required.')); return; }
    setSavingChangeId(changeId);
    exe('SetField', { entity: 'Change', entityId: changeId, fieldValue: "code='" + nextCode.replace(/'/g, "''") + "'", raw: true })
      .then(function (response) {
        if (!response || !response.ok) throw new Error((response && response.msg) || t('The change code could not be updated.'));
        setChanges(function (rows) { return rows.map(function (row) { return Number(row.id) === changeId ? Object.assign({}, row, { code: nextCode }) : row; }); });
        setEditingChangeId(null); setChangeCodeDraft(''); message.success(t('Change code updated successfully.'));
      }).catch(function (error) { message.error(error && error.message ? error.message : String(error)); })
      .then(function () { setSavingChangeId(null); });
  }
  function goToPolicy() {
    if (policy && policy.id) window.location.hash = '#/lifePolicy/' + policy.id;
  }
  function regenerateDocument(change) {
    const changeId = Number(change && change.id);
    if (!(changeId > 0) || documentLoading) return;
    Modal.confirm({
      title: t('Generate endorsement document'),
      content: t('The endorsement document will be generated again using the current change data.'),
      okText: t('Generate'), cancelText: t('Cancel'),
      onOk: function () {
        setDocumentLoading(changeId);
        return exe('ExeChain', { chain: 'cmdGenertFormatoEmdoso', context: JSON.stringify({ changeId: changeId }) })
          .then(function (response) {
            const data = response && response.outData;
            if (!response || !response.ok || (data && data.ok === false)) throw new Error((data && data.msg) || (response && response.msg) || t('The endorsement document could not be generated.'));
          Modal.confirm({ title: t('Document generated.'), content: t('Go to the policy to view the document.'), okText: t('Go to policy'), cancelText: t('Stay here'), onOk: goToPolicy, onCancel: function () {} });
          }).catch(function (error) { message.error(error && error.message ? error.message : String(error)); })
          .then(function () { setDocumentLoading(null); });
      }
    });
  }
  const columns = [
    { title: t('ID'), dataIndex: 'id', key: 'id', width: 80 },
    { title: t('Name'), dataIndex: 'name', key: 'name', render: function (_, row) { return t(changeName(row)); } },
    { title: t('Code'), dataIndex: 'code', key: 'code', width: 220, render: function (value, row) { return editingChangeId === Number(row.id) ? <div className="policy-change-code-actions"><Input size="small" value={changeCodeDraft} onChange={function (event) { setChangeCodeDraft(event.target.value); }} onPressEnter={function () { saveChangeCode(row); }} /><Button size="small" type="primary" loading={savingChangeId === Number(row.id)} onClick={function () { saveChangeCode(row); }}>{t('Save')}</Button></div> : <div className="policy-change-code-actions"><span>{value || '-'}</span><Button size="small" onClick={function () { startChangeCodeEdit(row); }}>{t('Edit')}</Button></div>; } },
    { title: t('Effective date'), dataIndex: 'effectiveDate', key: 'effectiveDate', width: 125, render: formatDate },
    { title: t('Execution date'), dataIndex: 'executionDate', key: 'executionDate', width: 125, render: formatDate },
    { title: t('Premium'), key: 'premium', width: 110, align: 'right', render: function (_, row) { return money(firstValue(row, ['premium', 'totalPremium', 'anualPremium', 'annualPremium'])); } },
    { title: t('Tax'), key: 'tax', width: 100, align: 'right', render: function (_, row) { return money(firstValue(row, ['tax', 'taxes'])); } },
    { title: t('Total'), key: 'total', width: 110, align: 'right', render: function (_, row) { return money(firstValue(row, ['total', 'totalAmount', 'anualTotal', 'annualTotal'])); } },
    { title: t('Actions'), key: 'actions', width: 230, render: function (_, row) { return <div className="policy-change-code-actions"><Button size="small" type="default" onClick={function () { setSelectedChange(row); }}>{t('View summary')}</Button><Button size="small" type="primary" loading={documentLoading === Number(row.id)} onClick={function () { regenerateDocument(row); }}>{t('Generate endorsement document')}</Button></div>; } }
  ];
  if (loading) return <Card title={t('Policy change code handler')}><Spin /> {t('Loading...')}</Card>;
  if (loadError) return <Card title={t('Policy change code handler')}><Empty description={loadError} /></Card>;
  return <Card className="policy-change-code-view" title={t('Policy change code handler')}>
    <Card size="small" className="policy-change-code-summary" title={t('Policy information')}>
      <Row gutter={16}><Col xs={24} md={6}><strong>{t('Policy ID')}</strong><div>{policy.id}</div></Col><Col xs={24} md={8}><strong>{t('Policy code')}</strong><div>{policy.code || '-'}</div></Col><Col xs={24} md={6}><strong>{t('Executed changes')}</strong><div>{changes.length}</div></Col><Col xs={24} md={4}><Button type="primary" onClick={goToPolicy}>{t('Back to policy')}</Button></Col></Row>
    </Card>
    <Table className="policy-change-code-table" rowKey="id" columns={columns} dataSource={changes} locale={{ emptyText: t('No executed changes found.') }} pagination={{ pageSize: 20, showSizeChanger: true }} />
    <Modal title={t('Endorsement summary')} visible={!!selectedChange} footer={null} onCancel={function () { setSelectedChange(null); }} destroyOnClose>{selectedChange && <Descriptions bordered size="small" column={1}><Descriptions.Item label={t('Name')}>{t(changeName(selectedChange))}</Descriptions.Item><Descriptions.Item label={t('ID')}>{selectedChange.id}</Descriptions.Item><Descriptions.Item label={t('Code')}>{selectedChange.code || '-'}</Descriptions.Item><Descriptions.Item label={t('Status')}><Tag color="green">{t('Executed')}</Tag></Descriptions.Item><Descriptions.Item label={t('Effective date')}>{formatDate(selectedChange.effectiveDate)}</Descriptions.Item><Descriptions.Item label={t('Execution date')}>{formatDate(selectedChange.executionDate)}</Descriptions.Item><Descriptions.Item label={t('Premium')}>{money(firstValue(selectedChange, ['premium', 'totalPremium', 'anualPremium', 'annualPremium']))}</Descriptions.Item><Descriptions.Item label={t('Tax')}>{money(firstValue(selectedChange, ['tax', 'taxes']))}</Descriptions.Item><Descriptions.Item label={t('Total')}>{money(firstValue(selectedChange, ['total', 'totalAmount', 'anualTotal', 'annualTotal']))}</Descriptions.Item></Descriptions>}</Modal>
  </Card>;
}
