()=>{
  const { useEffect, useMemo, useState } = React;
  const { Table, Button, Row, Col, Form, Select, Input, InputNumber, DatePicker, Skeleton, Empty, message, Space, Divider } = A;
  const { Column } = Table;

  const frequencyOptions = [
    { value: 'm', label: 'Mensual' },
    { value: 'b', label: 'Bimensual' },
    { value: 't', label: 'Trimestral' },
    { value: 's', label: 'Semestral' },
    { value: 'q', label: 'Semestral' },
    { value: 'y', label: 'Anual' },
    { value: 'c', label: 'Contado' }
  ];

  const frequencyLabelMap = frequencyOptions.reduce((acc, item) => {
    acc[String(item.value).toLowerCase()] = item.label;
    return acc;
  }, {});

  const BackIcon = () => (
    <span role="img" aria-label="arrow-left" className="anticon anticon-arrow-left">
      <svg viewBox="64 64 896 896" focusable="false" data-icon="arrow-left" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M868 474H312.3l171.6-171.6c3.1-3.1 3.1-8.2 0-11.3l-38-38c-3.1-3.1-8.2-3.1-11.3 0L186.3 489.4c-3.1 3.1-3.1 8.2 0 11.3l248.3 236.3c3.1 3.1 8.2 3.1 11.3 0l38-38c3.1-3.1 3.1-8.2 0-11.3L312.3 530H868c4.4 0 8-3.6 8-8v-40c0-4.4-3.6-8-8-8z"></path>
      </svg>
    </span>
  );

  const getPolicyId = () => {
    try {
      const href = String(window.location.href || '').replace('#/', '');
      const url = new URL(href);
      const value = url.searchParams.get('policyId');
      return Number(value || 0);
    } catch (error) {
      return 0;
    }
  };

  const toRows = (value) => Array.isArray(value) ? value : [];
  const toFirstRow = (value) => toRows(value)[0] || null;
  const safeString = (value) => String(value == null ? '' : value).trim();
  const safeNumber = (value) => Number(value == null ? 0 : value);
  const panamaOffsetMs = 5 * 60 * 60 * 1000;

  function parseUtcDate(value) {
    if (!value) {
      return null;
    }

    const raw = String(value).trim();
    if (!raw) {
      return null;
    }

    const utcValue = /z$/i.test(raw) || /[+-]\d{2}:?\d{2}$/i.test(raw) ? raw : `${raw}Z`;
    const date = new Date(utcValue);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  function toPanamaDate(value) {
    const date = parseUtcDate(value);
    if (!date) {
      return null;
    }

    return new Date(date.getTime() - panamaOffsetMs);
  }

  function toPanamaMoment(value) {
    if (typeof moment === 'undefined') {
      return null;
    }

    const date = toPanamaDate(value);
    return date ? moment(date) : null;
  }

  function formatMoney(value) {
    const number = Number(value == null ? 0 : value);
    if (Number.isNaN(number)) {
      return '0.00';
    }

    return number.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatDate(value) {
    const date = toPanamaDate(value);
    if (!date) {
      return '-';
    }

    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();

    return `${day}/${month}/${year}`;
  }

  function formatDateTime(value) {
    const date = toPanamaDate(value);
    if (!date) {
      return '-';
    }

    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  function formatDateOnly(value) {
    const date = toPanamaDate(value);
    if (!date) {
      return '-';
    }

    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();

    return `${day}/${month}/${year}`;
  }

  function getPaymentMethodCode(policy) {
    return safeString(policy && policy.paymentMethodCode != null ? policy.paymentMethodCode : (policy && policy.paymentMethod != null ? policy.paymentMethod : ''));
  }

  function getFrequencyLabel(value) {
    const key = safeString(value).toLowerCase();
    return frequencyLabelMap[key] || safeString(value) || '-';
  }

  function SummaryField({ label, value }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
        <span style={{ color: 'rgba(0,0,0,0.65)', fontSize: 12 }}>{label}</span>
        <Input value={value == null ? '-' : value} disabled style={{ backgroundColor: '#fafafa', color: '#262626' }} />
      </div>
    );
  }

  function App() {
    const policyId = useMemo(() => getPolicyId(), []);
    const [loading, setLoading] = useState(false);
    const [policy, setPolicy] = useState(null);
    const [payPlans, setPayPlans] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [form] = Form.useForm();

    useEffect(function() {
      const styleId = 'payplan-endorsement-styles';
      $('#' + styleId).remove();
      $('<style>', { id: styleId, type: 'text/css' }).html(`
        .payplan-table-wrap .ant-table-thead > tr > th,
        .payplan-table-wrap .ant-table-tbody > tr > td {
          padding-top: 8px !important;
          padding-bottom: 8px !important;
          padding-left: 10px !important;
          padding-right: 10px !important;
          line-height: 1.15 !important;
        }
        .payplan-table-wrap .ant-table-tbody > tr {
          height: 36px !important;
        }
        .payplan-locked-row td {
          background: #fff1f0 !important;
          color: #a8071a !important;
          border-color: #ffa39e !important;
        }
        .payplan-locked-row td:first-child {
          position: relative;
        }
        .payplan-locked-row td:first-child:before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: #f5222d;
        }
      `).appendTo('head');

      return function() {
        $('#' + styleId).remove();
      };
    }, []);

    useEffect(() => {
      if (!policyId || policyId <= 0) {
        message.error(t('The policy identifier was not found.'));
        return;
      }

      loadData();
    }, [policyId]);

    async function loadData() {
      try {
        setLoading(true);

        const [policyResponse, paymentMethodResponse] = await Promise.all([
          exe('RepoLifePolicy', {
            operation: 'GET',
            filter: `id = ${policyId}`,
            include: ['PayPlan']
          }),
          exe('RepoPaymentMethodCatalog', {
            operation: 'GET'
          })
        ]);

        if (!policyResponse || !policyResponse.ok) {
          throw new Error((policyResponse && policyResponse.msg) ? policyResponse.msg : t('Unable to load the policy.'));
        }

        const currentPolicy = toFirstRow(policyResponse.outData);
        if (!currentPolicy) {
          throw new Error(t('No information was found for the selected policy.'));
        }

        const currentPayPlans = toRows(currentPolicy.PayPlan).slice().sort((a, b) => {
          return safeNumber(a && a.numberInYear) - safeNumber(b && b.numberInYear);
        });

        const methodOptions = toRows(paymentMethodResponse && paymentMethodResponse.outData).map(item => ({
          value: safeString(item && item.code),
          label: safeString((item && item.name) || (item && item.code))
        }));

        setPolicy(currentPolicy);
        setPayPlans(currentPayPlans);
        setPaymentMethods(methodOptions);

        form.setFieldsValue({
          currentPaymentMethod: getPaymentMethodCode(currentPolicy),
          currentFrequency: safeString(currentPolicy && currentPolicy.periodicity ? currentPolicy.periodicity : ''),
          currentInstallments: currentPayPlans.length,
          newPaymentMethod: getPaymentMethodCode(currentPolicy),
          newFrequency: safeString(currentPolicy && currentPolicy.periodicity ? currentPolicy.periodicity : ''),
          newInstallments: currentPayPlans.length || safeNumber(currentPolicy && currentPolicy.installment ? currentPolicy.installment : 0),
          effectiveDate: toPanamaMoment(currentPolicy && currentPolicy.start),
          description: ''
        });
      } catch (error) {
        message.error((error && error.message) ? error.message : t('Unable to load the pay plan information.'));
      } finally {
        setLoading(false);
      }
    }

    const policySummary = useMemo(() => {
      if (!policy) {
        return {
          paymentMethod: '-',
          frequency: '-',
          installments: 0
        };
      }

      return {
        paymentMethod: getPaymentMethodCode(policy) ? getPolicyPaymentMethodLabel(paymentMethods, policy) : '-',
        frequency: getFrequencyLabel(policy && policy.periodicity),
        installments: payPlans.length
      };
    }, [policy, payPlans, paymentMethods]);

    function getPolicyPaymentMethodLabel(options, currentPolicy) {
      const code = getPaymentMethodCode(currentPolicy);
      const method = toRows(options).find(item => safeString(item && item.value) === code);
      return method ? method.label : (code || '-');
    }

    const policyHref = policy && policy.id ? `/#/lifePolicy/${policy.id}` : '#/home';

  function renderPlanValue(value) {
      return value == null || value === '' ? '-' : value;
    }

    function sumPlanAmount(source, fieldName) {
      return toRows(source).reduce(function(total, item) {
        return total + safeNumber(item && item[fieldName]);
      }, 0);
    }

    function renderPlanTotals(source) {
      const totalMinimum = sumPlanAmount(source, 'minimum');
      const totalPaid = sumPlanAmount(source, 'payed');

      return (
        <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 8, background: '#fafafa', border: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
          <div><strong>{t('Total minimum')}:</strong> {formatMoney(totalMinimum)}</div>
          <div><strong>{t('Total paid')}:</strong> {formatMoney(totalPaid)}</div>
        </div>
      );
    }

    function renderPayPlanTable(title, source, lockPaidRows) {
      const rows = toRows(source);
      const hasTotals = safeString(title) === safeString(t('Current pay plan'));
      return (
        <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 16, background: '#fff', minHeight: 680, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>{title}</h3>
          {rows.length === 0 ? (
            <Empty description={t('There are no installments to display')} />
          ) : (
            <div className="payplan-table-wrap" style={{ overflow: 'hidden' }}>
              <Table
                dataSource={source}
                rowKey="id"
                pagination={{ pageSize: 25 }}
                loading={loading}
                scroll={{ x: 1100, y: 260 }}
                rowClassName={function(record) {
                  if (!lockPaidRows) {
                    return '';
                  }

                  return safeNumber(record && record.payed) > 0 ? 'payplan-locked-row' : '';
                }}
              >
                <Column title={t('Installment no.')} dataIndex="numberInYear" key={`${title}-numberInYear`} render={renderPlanValue} />
                <Column title={t('Contract year')} dataIndex="contractYear" key={`${title}-contractYear`} render={renderPlanValue} />
                <Column title={t('Concept')} dataIndex="concept" key={`${title}-concept`} render={renderPlanValue} />
                <Column title={t('Minimum amount')} dataIndex="minimum" key={`${title}-minimum`} render={formatMoney} />
                <Column title={t('Due date')} dataIndex="dueDate" key={`${title}-dueDate`} render={formatDateOnly} />
                <Column title={t('Paid')} dataIndex="payed" key={`${title}-payed`} render={formatMoney} />
                <Column title={t('Payment date')} dataIndex="payedDate" key={`${title}-payedDate`} render={formatDateTime} />
              </Table>
            </div>
          )}
          {hasTotals ? renderPlanTotals(rows) : null}
        </div>
      );
    }

    return (
      <DefaultPage
        title={t('Payment Plan Change Endorsement')}
        icon="calendar"
        subTitle={t('Pay plan')}
        extra={(
          <Space>
            <Button type="default" href={policyHref}>
              <BackIcon /> {t('Back')}
            </Button>
            <Button type="primary" onClick={loadData} loading={loading}>{t('Refresh')}</Button>
          </Space>
        )}
      >
        {loading && !policy ? (
          <Skeleton active />
        ) : (
          <>
            <Row gutter={16}>
              <Col xs={24} lg={12}>
                <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 16, background: '#fff' }}>
                  <h3 style={{ marginTop: 0, marginBottom: 16 }}>{t('Before')}</h3>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <SummaryField label={t('Current frequency')} value={policySummary.frequency} />
                    </Col>
                    <Col xs={24} md={12}>
                      <SummaryField label={t('Current payment method')} value={policySummary.paymentMethod} />
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <SummaryField label={t('Current installment count')} value={policySummary.installments} />
                    </Col>
                    <Col xs={24} md={12}>
                      <SummaryField label={t('Policy')} value={(policy && policy.code) ? policy.code : ((policy && policy.id) ? policy.id : '-')} />
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col xs={24}>
                      <SummaryField label={t('Current term')} value={`${formatDate(policy && policy.start)} - ${formatDate(policy && policy.end)}`} />
                    </Col>
                  </Row>
                </div>
              </Col>

              <Col xs={24} lg={12}>
                <div style={{ border: '1px solid #d9f7be', borderRadius: 8, padding: 16, background: '#f6ffed' }}>
                  <h3 style={{ marginTop: 0, marginBottom: 16 }}>{t('After')}</h3>

                  <Form form={form} layout="vertical">
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item label={t('New frequency')} name="newFrequency">
                          <Select
                            options={frequencyOptions}
                            placeholder={t('Select the new frequency')}
                            showSearch
                            optionFilterProp="label"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item label={t('New payment method')} name="newPaymentMethod">
                          <Select
                            options={paymentMethods}
                            placeholder={t('Select the new payment method')}
                            showSearch
                            allowClear
                            optionFilterProp="label"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item label={t('New installment count')} name="newInstallments">
                          <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder={t('Installment count')} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item label={t('Effective date')} name="effectiveDate">
                          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col xs={24}>
                        <Form.Item label={t('Endorsement description')} name="description">
                          <Input.TextArea rows={4} placeholder={t('Enter a description for the endorsement')} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form>
                </div>
              </Col>
            </Row>

            <Divider />

            <Row gutter={16}>
              <Col xs={24} lg={12}>
                {renderPayPlanTable(t('Current pay plan'), payPlans, true)}
              </Col>
              <Col xs={24} lg={12}>
                {renderPayPlanTable(t('New pay plan'), payPlans)}
              </Col>
            </Row>
          </>
        )}
      </DefaultPage>
    );
  }

  return <App />;
}
