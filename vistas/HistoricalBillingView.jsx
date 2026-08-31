/**
 * @author Michael Delgado
 * @email michael.delgado@axxis-systems.com
 * @created 2026/08/31
 * @name HistoricalBillingView
 * @version 1.0
 * @purpose: Display historical billing installments with policy and insured-object filters.
 */

() => {
  const {
    Button,
    Card,
    Col,
    DatePicker,
    Drawer,
    Form,
    Input,
    Row,
    Select,
    Space,
    Spin,
    Table,
    message
  } = A;
  const { Option } = Select;

  const [filterForm] = Form.useForm();
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [filterVisible, setFilterVisible] = React.useState(false);
  const [searched, setSearched] = React.useState(false);
  const [pagination, setPagination] = React.useState({ current: 1, pageSize: 25 });
  const [total, setTotal] = React.useState(0);
  const [executionTime, setExecutionTime] = React.useState('0.00 milisegundos');
  const [clientOptions, setClientOptions] = React.useState([]);
  const [clientLoading, setClientLoading] = React.useState(false);
  const clientSearchTimer = React.useRef(null);
  const [lineOptions, setLineOptions] = React.useState([]);
  const [productOptions, setProductOptions] = React.useState([]);
  const [productCatalog, setProductCatalog] = React.useState([]);
  const [selectedLine, setSelectedLine] = React.useState('');

  React.useEffect(() => {
    loadCatalogs();
  }, []);

  React.useEffect(() => {
    const styleId = 'historical-billing-view-style';
    const style = document.getElementById(styleId) || document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .historical-billing-view {
        width: 100%;
        height: 100%;
        min-height: calc(100dvh - 96px);
        overflow: hidden;
      }

      .historical-billing-view > .ant-card {
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .historical-billing-view > .ant-card > .ant-card-body {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        padding: 4px !important;
        overflow: hidden;
      }

      .historical-billing-view .historical-billing-toolbar {
        flex: none;
        background: #e6f7ff !important;
        border: 1px solid #91caff !important;
        border-radius: 0 !important;
        padding: 4px 0 !important;
        margin: -4px -4px 2px;
        box-shadow: 0 1px 3px rgba(22, 119, 255, 0.12);
      }

      .historical-billing-view .historical-billing-toolbar > :first-child {
        margin-left: 4px;
      }

      .historical-billing-view .historical-billing-toolbar .ant-btn {
        border-radius: 6px;
        font-size: 13px;
      }

      .historical-billing-view .historical-billing-table {
        height: 100%;
        border: 1px solid #cbd1d8;
      }

      .historical-billing-view .ant-spin-nested-loading,
      .historical-billing-view .ant-spin-container {
        flex: 1;
        min-height: 0;
        height: 100%;
      }

      .historical-billing-view .historical-billing-table .ant-table-container {
        min-height: 0;
      }

      .historical-billing-view .historical-billing-table .ant-table-body {
        overflow-x: scroll !important;
        overflow-y: scroll !important;
        scrollbar-gutter: stable;
      }

      .historical-billing-view .historical-billing-table .ant-table-content {
        overflow-x: scroll !important;
        scrollbar-gutter: stable;
      }

      .historical-billing-view .historical-billing-table .ant-table-thead > tr > th {
        background: #bfbfbf !important;
        border-right: 1px solid #cbd1d8 !important;
        border-bottom: 1px solid #cbd1d8 !important;
        padding: 5px 8px !important;
        font-size: 12px;
        line-height: 18px;
      }

      .historical-billing-view .historical-billing-table .ant-table-tbody > tr > td {
        border-right: 0 !important;
        border-bottom: 1px solid #cbd1d8 !important;
        padding: 5px 8px !important;
        font-size: 12px;
        line-height: 18px;
      }

      .historical-billing-view .historical-billing-table .ant-table-tbody > tr:hover > td {
        background: #b7d7ff !important;
      }

      .historical-billing-view .historical-billing-money-positive { color: #237804; }
      .historical-billing-view .historical-billing-money-negative { color: #cf1322; }
      .historical-billing-view .historical-billing-money-zero { color: #262626; }
    `;
    if (!style.parentNode) document.head.appendChild(style);

    return () => {
      const currentStyle = document.getElementById(styleId);
      if (currentStyle) currentStyle.remove();
    };
  }, []);

  function getRows(response) {
    const data = response && response.outData;
    if (Array.isArray(data)) return data;
    if (data) return [data];
    return [];
  }

  function text(value) {
    return String(value === undefined || value === null ? '' : value).trim();
  }

  function escapeSql(value) {
    return text(value).replace(/'/g, "''");
  }

  function number(value) {
    const result = Number(value);
    return Number.isFinite(result) ? result : 0;
  }

  function formatMoney(value) {
    const fixed = number(value).toFixed(2);
    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${parts[0]}.${parts[1]}`;
  }

  function renderMoney(value) {
    const amount = number(value);
    let className = 'historical-billing-money-zero';
    if (amount > 0) className = 'historical-billing-money-positive';
    if (amount < 0) className = 'historical-billing-money-negative';
    return <span className={className}>{formatMoney(amount)}</span>;
  }

  function formatDate(value) {
    const raw = text(value);
    if (!raw) return '-';
    const date = new Date(/z$/i.test(raw) || /[+-]\d{2}:?\d{2}$/.test(raw) ? raw : `${raw}Z`);
    if (Number.isNaN(date.getTime())) return raw;
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  }

  function formatPickerDate(value) {
    if (!value || typeof value.format !== 'function') return '';
    return value.format('YYYY-MM-DD');
  }

  function loadCatalogs() {
    Promise.all([
      exe('RepoLob', { operation: 'GET' }),
      exe('RepoProduct', { operation: 'GET' })
    ]).then(responses => {
      setLineOptions(getRows(responses[0]).map(item => ({
        value: text(item && item.code),
        label: text(item && (item.name || item.code))
      })).filter(item => item.value));
      setProductOptions([]);
      setProductCatalog(getRows(responses[1]).map(item => ({
        value: text(item && item.code),
        label: text(item && (item.name || item.code)),
        line: text(item && (item.lobCode || item.lob))
      })).filter(item => item.value));
    }).catch(error => {
      message.error(error && error.message ? error.message : t('Catalogs could not be loaded.'));
    });
  }

  function searchClients(value) {
    const query = text(value);
    const isNumericId = /^\d+$/.test(query);

    if (clientSearchTimer.current) {
      clearTimeout(clientSearchTimer.current);
      clientSearchTimer.current = null;
    }

    if (query.length < 3 && !isNumericId) {
      setClientOptions([]);
      setClientLoading(false);
      return;
    }

    clientSearchTimer.current = setTimeout(() => {
      const escaped = escapeSql(query);
      const numericId = isNumericId ? Number(query) : 0;
      const idFilter = numericId > 0 ? ` OR [id] = ${numericId}` : '';
      const filter = isNumericId && query.length < 3
        ? `(inactive=0) AND [id] = ${numericId}`
        : `(inactive=0) AND (([name] LIKE N'%${escaped}%') OR ([surname1] LIKE N'%${escaped}%') OR ([surname2] LIKE N'%${escaped}%') OR ([cnp] LIKE N'%${escaped}%') OR ([nif] LIKE N'%${escaped}%')${idFilter})`;

      setClientLoading(true);
      exe('GetContacts', { operation: 'GET', filter: filter, size: 15 })
        .then(response => {
          if (!response || response.ok === false) {
            throw new Error(response && response.msg ? response.msg : t('Clients could not be loaded.'));
          }

          const options = getRows(response).map(contact => {
            const name = text(contact && (contact.FullName || contact.fullName || [
              contact.name,
              contact.surname1,
              contact.surname2
            ].filter(Boolean).join(' ')));
            const identifier = text(contact && (contact.cnp || contact.nif || contact.passport));
            const id = contact && contact.id !== undefined && contact.id !== null ? String(contact.id) : '';

            return {
              value: contact && contact.id,
              label: `${name || t('Unnamed contact')} | ${identifier || t('No identification')} | #${id}`,
              id: contact && contact.id,
              name: name || t('Unnamed contact'),
              identifier: identifier || t('No identification'),
              contactId: id
            };
          }).filter(item => item.value !== undefined && item.value !== null);

          setClientOptions(options);
        })
        .catch(error => {
          setClientOptions([]);
          message.error(error && error.message ? error.message : String(error));
        })
        .finally(() => setClientLoading(false));
    }, 400);
  }

  function search(values, nextPagination) {
    const hasFilter = Boolean(
      Number(values && values.clientId) > 0 ||
      text(values && values.policyCode) ||
      Number(values && values.policyId) > 0 ||
      text(values && values.line) ||
      text(values && values.product) ||
      text(values && values.loanNumber) ||
      text(values && values.plate) ||
      values && values.issueFrom ||
      values && values.issueTo ||
      text(values && values.status)
    );

    if (!hasFilter) {
      message.warning(t('Select at least one filter before searching.'));
      return;
    }

    const issueFrom = values && values.issueFrom;
    const issueTo = values && values.issueTo;
    if (Boolean(issueFrom) !== Boolean(issueTo)) {
      message.warning(t('Select both the issuance start and end dates.'));
      return;
    }
    if (issueFrom && issueTo && issueFrom.valueOf() > issueTo.valueOf()) {
      message.warning(t('The issuance start date cannot be later than the end date.'));
      return;
    }

    setFilterVisible(false);
    setLoading(true);
    setSearched(true);
    const currentPagination = nextPagination || { current: 1, pageSize: pagination.pageSize };
    const startTime = performance.now();
    exe('ExeChain', {
      chain: 'cmdHistoricalBilling',
      context: JSON.stringify({
        page: currentPagination.current,
        size: currentPagination.pageSize,
        clientId: Number(values && values.clientId) || 0,
        policyCode: text(values && values.policyCode),
        policyId: Number(values && values.policyId) || 0,
        line: text(values && values.line),
        product: text(values && values.product),
        loanNumber: text(values && values.loanNumber),
        plate: text(values && values.plate),
        issueFrom: formatPickerDate(values && values.issueFrom),
        issueTo: formatPickerDate(values && values.issueTo),
        status: text(values && values.status)
      })
    }).then(response => {
      if (!response || response.ok === false) throw new Error(response && response.msg ? response.msg : t('Historical billing could not be loaded.'));
      const payload = response && response.outData && !Array.isArray(response.outData)
        ? response.outData
        : {};
      const billingRows = Array.isArray(payload.data) ? payload.data : [];
      setRows(billingRows);
      setTotal(Number(payload.total) >= 0 ? Number(payload.total) : 0);
      setPagination(currentPagination);
    }).catch(error => {
      setRows([]);
      setTotal(0);
      message.error(error && error.message ? error.message : String(error));
    }).finally(() => {
      setExecutionTime(`${(performance.now() - startTime).toFixed(2)} milisegundos`);
      setLoading(false);
    });
  }

  function handleSearch(values) {
    search(values, { current: 1, pageSize: pagination.pageSize });
  }

  function handleTableChange(nextPagination) {
    search(filterForm.getFieldsValue(), {
      current: nextPagination.current,
      pageSize: nextPagination.pageSize
    });
  }

  function handleLineChange(value) {
    const line = text(value);
    setSelectedLine(line);
    filterForm.setFieldsValue({ product: undefined });
    setProductOptions(line
      ? productCatalog.filter(item => item.line === line)
      : []);
  }

  function clearFilters() {
    filterForm.resetFields();
    setClientOptions([]);
    setSelectedLine('');
    setProductOptions([]);
    setRows([]);
    setTotal(0);
    setExecutionTime('0.00 milisegundos');
    setSearched(false);
    setPagination({ current: 1, pageSize: 25 });
  }

  const columns = [
    { title: t('Receipt'), dataIndex: 'receipt', key: 'receipt', width: 120 },
    { title: t('Policy'), dataIndex: 'policy', key: 'policy', width: 150 },
    { title: t('Year-Month'), dataIndex: 'yearMonth', key: 'yearMonth', width: 105, align: 'center' },
    { title: t('Status'), dataIndex: 'status', key: 'status', width: 110, render: value => t(value || '') },
    { title: t('Start'), dataIndex: 'start', key: 'start', width: 110, align: 'center', render: formatDate },
    { title: t('End date'), dataIndex: 'end', key: 'end', width: 110, align: 'center', render: formatDate },
    { title: t('Total'), dataIndex: 'total', key: 'total', width: 110, align: 'right', render: renderMoney },
    { title: t('Paid'), dataIndex: 'paid', key: 'paid', width: 110, align: 'right', render: renderMoney },
    { title: t('Pending'), dataIndex: 'pending', key: 'pending', width: 110, align: 'right', render: renderMoney }
  ];

  return (
    <div className="historical-billing-view">
      <Card size="small">
        <div className="historical-billing-toolbar">
          <Button type="primary" onClick={() => setFilterVisible(true)}>
            {t('Filter')}
          </Button>
        </div>
        <Drawer
          title={t('Historical billing filters')}
          className="historical-billing-drawer"
          placement="right"
          width={420}
          open={filterVisible}
          onClose={() => setFilterVisible(false)}
        >
          <Form form={filterForm} layout="vertical" onFinish={handleSearch}>
            <Row gutter={12}>
              <Col span={24}>
                <Form.Item label={t('Client')} name="clientId">
                  <Select
                    showSearch
                    allowClear
                    filterOption={false}
                    loading={clientLoading}
                    onSearch={searchClients}
                    options={clientOptions}
                    placeholder={t('Search client')}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label={t('Policy code')} name="policyCode">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={t('Policy ID')} name="policyId">
                  <Input type="number" min={1} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label={t('Line of business')} name="line">
                  <Select allowClear options={lineOptions} onChange={handleLineChange} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={t('Product')} name="product">
                  <Select
                    allowClear
                    disabled={!selectedLine}
                    showSearch
                    optionFilterProp="label"
                    options={productOptions}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label={t('Loan number')} name="loanNumber">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={t('Plate')} name="plate">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label={t('Issuance date from')} name="issueFrom">
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={t('Issuance date to')} name="issueTo">
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={24}>
                <Form.Item label={t('Policy status')} name="status">
                  <Select allowClear>
                    <Option value="ACTIVE">{t('Active')}</Option>
                    <Option value="INACTIVE">{t('Inactive')}</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Space>
              <Button type="primary" htmlType="submit">{t('Search')}</Button>
              <Button onClick={clearFilters}>{t('Clear')}</Button>
            </Space>
          </Form>
        </Drawer>
        <Spin spinning={loading}>
          {!searched ? (
            <div style={{ padding: 24, textAlign: 'center' }}>{t('Apply filters to search.')}</div>
          ) : (
            <Table
              className="historical-billing-table"
              rowKey="key"
              size="small"
              bordered
              columns={columns}
              dataSource={rows}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total,
                showSizeChanger: true,
                pageSizeOptions: ['15', '25'],
                showTotal: () => (
                  <span>
                    {t('Total records')}: {total} | {t('Time')}: {executionTime}
                  </span>
                )
              }}
              onChange={handleTableChange}
              scroll={{ x: 1000, y: 'calc(100dvh - 310px)' }}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
}
