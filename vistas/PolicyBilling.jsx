()=>{
  const { useEffect, useState } = React;
  const {
    Table,
    Button,
    Modal,
    Tabs,
    Row,
    Col,
    Descriptions,
    Empty,
    Spin,
    message
  } = A;
  const { TabPane } = Tabs;

  const BackIcon = () => (
    <span role="img" aria-label="arrow-left" className="anticon anticon-arrow-left">
      <svg viewBox="64 64 896 896" focusable="false" data-icon="arrow-left" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M869 491H291.3l219.5-219.5c3.1-3.1 3.1-8.2 0-11.3l-45.3-45.3a8.2 8.2 0 0 0-11.3 0L156.7 507.4a8.2 8.2 0 0 0 0 11.3l297.5 297.5a8.2 8.2 0 0 0 11.3 0l45.3-45.3a8.2 8.2 0 0 0 0-11.3L291.3 533H869c4.4 0 8-3.6 8-8v-26c0-4.4-3.6-8-8-8z"></path>
      </svg>
    </span>
  );

  const SummaryIcon = () => <i className="bi bi-file-text" aria-hidden="true" />;
  const InstallmentIcon = () => <i className="bi bi-calendar3" aria-hidden="true" />;

  const [policyId, setPolicyId] = useState(0);
  const [policy, setPolicy] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const policyHref = policy && policy.id ? `/#/lifePolicy/${policy.id}` : '#/home';

  useEffect(() => {
    const id = getPolicyId();
    setPolicyId(id);
    if (id > 0) {
      loadPolicy(id);
    } else {
      message.error(t('A valid policy identifier was not provided.'));
    }
  }, []);

  useEffect(() => {
    const styleId = 'policy-billing-compact-style';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .policy-billing-table .ant-table-thead > tr > th,
      .policy-billing-table .ant-table-tbody > tr > td,
      .policy-billing-table .ant-table-summary > tr > td {
        padding: 4px 8px !important;
        font-size: 12px;
        line-height: 18px;
      }

      .policy-billing-table .policy-billing-total-row > td,
      .policy-billing-table .policy-billing-total-row > td * {
        font-weight: 700 !important;
      }

      .policy-billing-installments .ant-table-thead > tr > th,
      .policy-billing-installments .ant-table-tbody > tr > td,
      .policy-billing-installments .ant-table-summary > tr > td {
        padding: 3px 8px !important;
        font-size: 12px;
        line-height: 16px;
      }

      .policy-billing-installments .policy-billing-installment-total-row > td,
      .policy-billing-installments .policy-billing-installment-total-row > td * {
        font-weight: 700 !important;
      }

      .policy-billing-table .policy-billing-row-new > td {
        background: #e6f4ff !important;
      }

      .policy-billing-table .policy-billing-row-cancellation > td {
        background: #fff1f0 !important;
      }

      .policy-billing-table .policy-billing-row-endorsement > td {
        background: #f6ffed !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const currentStyle = document.getElementById(styleId);
      if (currentStyle) currentStyle.remove();
    };
  }, []);

  function getPolicyId() {
    const contextId = typeof context !== 'undefined' && context
      ? Number(context.policyId || context.id || 0)
      : 0;

    if (contextId > 0) {
      return contextId;
    }

    try {
      const href = String(window.location.href || '').replace('#/', '');
      const url = new URL(href);
      return Number(url.searchParams.get('policyId') || 0);
    } catch (error) {
      return 0;
    }
  }

  function loadPolicy(id) {
    setLoading(true);

    exe('RepoLifePolicy', {
      operation: 'GET',
      filter: `id=${id}`,
      include: ['PayPlan', 'Changes.Bill', 'Changes.BillDiff', 'Anniversaries'],
      noTracking: true
    })
      .then(response => {
        if (!response || response.ok === false) {
          throw new Error(response && response.msg
            ? response.msg
            : t('The policy could not be loaded.'));
        }

        const responseData = response && response.outData;
        const rows = Array.isArray(responseData)
          ? responseData
          : responseData
            ? [responseData]
            : [];
        const loadedPolicy = rows.length > 0 ? rows[0] : null;
        if (!loadedPolicy) {
          throw new Error(`${t('Policy not found')}: ${id}.`);
        }

        setPolicy(loadedPolicy);
        setReceipts(buildReceiptRows(loadedPolicy));
      })
      .catch(error => {
        setPolicy(null);
        setReceipts([]);
        message.error(error && error.message ? error.message : t('An unexpected error occurred.'));
      })
      .finally(() => setLoading(false));
  }

  function buildReceiptRows(loadedPolicy) {
    const payPlans = Array.isArray(loadedPolicy && loadedPolicy.PayPlan)
      ? loadedPolicy.PayPlan
      : [];
    const changes = Array.isArray(loadedPolicy && loadedPolicy.Changes)
      ? loadedPolicy.Changes.filter(change => Number(change && change.status) === 1)
      : [];

    const paymentGroups = {};
    payPlans.forEach(payPlan => {
      const groupId = payPlan && payPlan.changeId ? String(payPlan.changeId) : 'policy';
      const group = paymentGroups[groupId] || {
        receiptAmount: 0,
        paid: 0,
        start: null,
        end: null,
        source: []
      };
      const amount = Number(payPlan && (payPlan.expected || payPlan.minimum || 0)) || 0;
      const dueDate = payPlan && payPlan.dueDate;
      group.receiptAmount += amount;
      group.paid += Number(payPlan && payPlan.payed) || 0;
      group.start = group.start || dueDate;
      group.end = dueDate || group.end;
      group.source.push(payPlan);
      paymentGroups[groupId] = group;
    });

    function getBillValues(bill, fallback) {
      const currentBill = bill || {};
      const backup = fallback || {};
      return {
        receiptNumber: currentBill.fiscalNumber || backup.fiscalNumber || '-',
        receiptAmount: Number(currentBill.anualTotal || currentBill.annualTotal || 0) || 0,
        premium: Number(currentBill.coverages || 0) || 0,
        discounts: Number(currentBill.discounts || 0) || 0,
        surcharges: Number(currentBill.surcharges || 0) || 0,
        grossPremium: Number(currentBill.anualPremium || currentBill.annualPremium || 0) || 0,
        tax: Number(currentBill.tax || 0) || 0,
        expenses: Number(currentBill.fee || 0) || 0
      };
    }

    function parseJsonObject(value) {
      if (value && typeof value === 'object') {
        return value;
      }

      if (typeof value !== 'string' || !value.trim()) {
        return {};
      }

      try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object' ? parsed : {};
      } catch (error) {
        return {};
      }
    }

    function parseJsonArray(value) {
      if (Array.isArray(value)) {
        return value;
      }

      if (typeof value !== 'string' || !value.trim()) {
        return [];
      }

      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }

    function distributeReceiptAmount(installments, receiptAmount) {
      const sourceRows = Array.isArray(installments) ? installments : [];
      const rows = sourceRows.filter(installment => {
        const minimum = Number(installment && installment.minimum);
        const expected = Number(installment && installment.expected);
        const baseAmount = Number.isFinite(minimum) && minimum !== 0
          ? minimum
          : (Number.isFinite(expected) ? expected : 0);
        const paid = Number(installment && installment.payed) || 0;

        return !(baseAmount > 0 && paid >= baseAmount);
      });

      if (rows.length === 0) {
        return [];
      }

      const sourceAmounts = rows.map(installment => {
        const minimum = Number(installment && installment.minimum);
        const expected = Number(installment && installment.expected);
        const baseAmount = Number.isFinite(minimum) && minimum !== 0
          ? minimum
          : (Number.isFinite(expected) ? expected : 0);
        const paid = Number(installment && installment.payed) || 0;
        return Math.max(baseAmount - paid, 0);
      });
      const sourceTotal = sourceAmounts.reduce((total, amount) => total + amount, 0);
      const paidTotal = sourceRows.reduce((total, installment) => {
        return total + (Number(installment && installment.payed) || 0);
      }, 0);
      const receiptValue = Number(receiptAmount) || 0;
      const targetTotal = receiptValue < 0
        ? receiptValue
        : Math.max(receiptValue - paidTotal, 0);

      if (sourceTotal === 0) {
        let distributedWithoutProportion = 0;
        return rows.map((installment, index) => {
          const isLast = index === rows.length - 1;
          const amount = isLast
            ? Number((targetTotal - distributedWithoutProportion).toFixed(2))
            : Number((targetTotal / rows.length).toFixed(2));
          distributedWithoutProportion += amount;
          const paid = Number(installment && installment.payed) || 0;
          const displayedAmount = paid + amount;
          return {
            ...installment,
            minimum: installment && installment.cancellationDate
              ? displayedAmount * -1
              : displayedAmount
          };
        });
      }

      let distributed = 0;
      return rows.map((installment, index) => {
        const isLast = index === rows.length - 1;
        const amount = isLast
          ? Number((targetTotal - distributed).toFixed(2))
          : Number((targetTotal * sourceAmounts[index] / sourceTotal).toFixed(2));

        distributed += amount;
        const paid = Number(installment && installment.payed) || 0;
        const displayedAmount = paid + amount;
        return {
          ...installment,
          minimum: installment && installment.cancellationDate
            ? displayedAmount * -1
            : displayedAmount
        };
      });
    }

    function keepInstallmentAmounts(installments) {
      const rows = Array.isArray(installments) ? installments : [];

      return rows.map(installment => {
        const minimum = Number(installment && installment.minimum);
        const expected = Number(installment && installment.expected);
        const amount = Number.isFinite(minimum) && minimum !== 0
          ? minimum
          : (Number.isFinite(expected) ? expected : 0);

        return {
          ...installment,
          minimum: installment && installment.cancellationDate ? amount * -1 : amount
        };
      });
    }

    function buildInvoiceRow(config) {
      const billValues = getBillValues(config.bill, config.fallback);
      const paymentGroup = config.paymentGroup || {};
      const receiptAmount = billValues.receiptAmount || paymentGroup.receiptAmount || 0;
      const paid = paymentGroup.paid || 0;
      const installments = config.keepInstallmentAmounts
        ? keepInstallmentAmounts(config.installments)
        : distributeReceiptAmount(config.installments, receiptAmount);

      return {
        key: config.key,
        recordType: config.recordType,
        receiptNumber: billValues.receiptNumber,
        receiptAmount,
        paid,
        pending: receiptAmount - paid,
        startDate: config.startDate || paymentGroup.start,
        endDate: config.endDate || paymentGroup.end,
        movementType: config.movementType,
        premium: billValues.premium,
        discounts: billValues.discounts,
        surcharges: billValues.surcharges,
        grossPremium: billValues.grossPremium,
        tax: billValues.tax,
        expenses: billValues.expenses,
        incomeDate: config.incomeDate,
        id: config.id,
        changeId: config.changeId,
        status: config.status,
        source: config.source,
        installments
      };
    }

    function isCancellationChange(change) {
      const discriminator = String(change && change.Discriminator || '').toUpperCase();
      return discriminator.indexOf('CANCELLATION') >= 0;
    }

    function buildCancellationBill(changeDetail) {
      const annualPremiumDif = Number(changeDetail && changeDetail.annualPremiumDif) || 0;
      const coveragesDif = Number(changeDetail && changeDetail.coveragesDif) || 0;

      return {
        anualPremium: annualPremiumDif,
        annualPremium: annualPremiumDif,
        anualTotal: annualPremiumDif,
        annualTotal: annualPremiumDif,
        coverages: coveragesDif,
        tax: annualPremiumDif - coveragesDif,
        discounts: 0,
        surcharges: 0,
        fee: 0
      };
    }

    const basePaymentGroup = paymentGroups.policy || {};
    const anniversaries = Array.isArray(loadedPolicy && loadedPolicy.Anniversaries)
      ? loadedPolicy.Anniversaries
      : [];
    const firstAnniversary = anniversaries.length > 0 ? anniversaries[0] : null;
    const anniversarySnapshot = parseJsonObject(firstAnniversary && firstAnniversary.jSnapshot);
    const snapshotBill = anniversarySnapshot && anniversarySnapshot.Bill
      ? anniversarySnapshot.Bill
      : anniversarySnapshot;
    const baseBill = snapshotBill && Object.keys(snapshotBill).length > 0
      ? snapshotBill
      : loadedPolicy && loadedPolicy.Bill;
    const policyVersion = Number(loadedPolicy && loadedPolicy.policyVersion) || 0;
    const baseRow = buildInvoiceRow({
      key: `policy-${loadedPolicy && loadedPolicy.id ? loadedPolicy.id : 'base'}`,
      recordType: 'Receipt',
      bill: baseBill,
      fallback: loadedPolicy,
      paymentGroup: basePaymentGroup,
      startDate: loadedPolicy && loadedPolicy.start,
      endDate: loadedPolicy && loadedPolicy.end,
      movementType: t(policyVersion > 0 ? 'Anniversary' : 'New Policy'),
      incomeDate: loadedPolicy && (loadedPolicy.activeDate || loadedPolicy.start),
      id: loadedPolicy && loadedPolicy.id,
      installments: anniversarySnapshot && anniversarySnapshot.PayPlan,
      source: loadedPolicy
    });

    const changeRows = changes.map((change, index) => {
      const changeId = change && change.id ? String(change.id) : '';
      const changeDetail = parseJsonObject(change && change.jDetail);
      const cancellationChange = isCancellationChange(change);
      return buildInvoiceRow({
        key: `change-${changeId || index}`,
        recordType: 'Endorsement',
        bill: cancellationChange
          ? buildCancellationBill(changeDetail)
          : change && change.BillDiff,
        fallback: change && change.Bill,
        paymentGroup: paymentGroups[changeId],
        startDate: change && (change.effectiveDate || change.executionDate),
        endDate: changeDetail.policyEnd || (paymentGroups[changeId] && paymentGroups[changeId].end),
        movementType: change && (change.Discriminator || t('Endorsement')),
        incomeDate: change && change.executionDate,
        id: change && change.id,
        changeId: change && change.id,
        status: change && change.status,
        installments: parseJsonArray(change && change.jNewPayPlan),
        keepInstallmentAmounts: cancellationChange,
        source: change
      });
    });

    return [baseRow].concat(changeRows).sort((left, right) => {
      const leftDate = new Date(left.incomeDate || left.startDate || 0).getTime();
      const rightDate = new Date(right.incomeDate || right.startDate || 0).getTime();
      return leftDate - rightDate;
    });
  }

  function formatDate(value, includeTime) {
    const raw = String(value || '').trim();
    if (!raw) {
      return '-';
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const parts = raw.split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    const utcValue = /z$/i.test(raw) || /[+-]\d{2}:?\d{2}$/i.test(raw)
      ? raw
      : `${raw}Z`;
    const date = new Date(utcValue);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    const panamaDate = new Date(date.getTime() - (5 * 60 * 60 * 1000));
    const day = String(panamaDate.getUTCDate()).padStart(2, '0');
    const month = String(panamaDate.getUTCMonth() + 1).padStart(2, '0');
    const year = panamaDate.getUTCFullYear();
    if (!includeTime) {
      return `${day}/${month}/${year}`;
    }

    const hours = String(panamaDate.getUTCHours()).padStart(2, '0');
    const minutes = String(panamaDate.getUTCMinutes()).padStart(2, '0');
    const seconds = String(panamaDate.getUTCSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  function formatMoney(value) {
    const amount = Number(value || 0);
    if (!Number.isFinite(amount)) {
      return '0.00';
    }

    const parts = amount.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${parts[0]}.${parts[1]}`;
  }

  function renderColoredMoney(value) {
    const amount = Number(value || 0);
    const color = amount > 0
      ? '#389e0d'
      : amount < 0
        ? '#cf1322'
        : 'inherit';

    return <span style={{ color }}>{formatMoney(value)}</span>;
  }

  function renderTotals(rows) {
    const totals = (rows || []).reduce((result, row) => {
      result.receiptAmount += Number(row && row.receiptAmount) || 0;
      result.paid += Number(row && row.paid) || 0;
      result.pending += Number(row && row.pending) || 0;
      result.premium += Number(row && row.premium) || 0;
      result.discounts += Number(row && row.discounts) || 0;
      result.surcharges += Number(row && row.surcharges) || 0;
      result.grossPremium += Number(row && row.grossPremium) || 0;
      result.tax += Number(row && row.tax) || 0;
      result.expenses += Number(row && row.expenses) || 0;
      return result;
    }, {
      receiptAmount: 0,
      paid: 0,
      pending: 0,
      premium: 0,
      discounts: 0,
      surcharges: 0,
      grossPremium: 0,
      tax: 0,
      expenses: 0
    });

    return (
      <Table.Summary>
        <Table.Summary.Row className="policy-billing-total-row">
          <Table.Summary.Cell index={0} colSpan={4}>
            <strong>{t('Total')}</strong>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={4} align="right">{renderColoredMoney(totals.receiptAmount)}</Table.Summary.Cell>
          <Table.Summary.Cell index={5} />
          <Table.Summary.Cell index={6} />
          <Table.Summary.Cell index={7} />
          <Table.Summary.Cell index={8} align="right">{renderColoredMoney(totals.premium)}</Table.Summary.Cell>
          <Table.Summary.Cell index={9} align="right">{renderColoredMoney(totals.discounts)}</Table.Summary.Cell>
          <Table.Summary.Cell index={10} align="right">{renderColoredMoney(totals.surcharges)}</Table.Summary.Cell>
          <Table.Summary.Cell index={11} align="right">{renderColoredMoney(totals.grossPremium)}</Table.Summary.Cell>
          <Table.Summary.Cell index={12} align="right">{renderColoredMoney(totals.tax)}</Table.Summary.Cell>
          <Table.Summary.Cell index={13} align="right">{renderColoredMoney(totals.expenses)}</Table.Summary.Cell>
          <Table.Summary.Cell index={14} />
        </Table.Summary.Row>
      </Table.Summary>
    );
  }

  function getSortedInstallments(receipt) {
    const installments = receipt && Array.isArray(receipt.installments)
      ? receipt.installments
      : [];

    return installments.slice().sort((left, right) => {
      const leftNumber = Number(left && left.numberInYear) || 0;
      const rightNumber = Number(right && right.numberInYear) || 0;
      return leftNumber - rightNumber;
    });
  }

  function getBillingRowClass(record) {
    if (record && record.recordType === 'Receipt') {
      return 'policy-billing-row-new';
    }

    const movementType = String(record && record.movementType || '').toUpperCase();
    if (movementType.indexOf('CANCELLATION') >= 0) {
      return 'policy-billing-row-cancellation';
    }

    return 'policy-billing-row-endorsement';
  }

  function renderInstallmentTotals(rows) {
    const totalMinimum = (rows || []).reduce((total, row) => {
      return total + (Number(row && row.minimum) || 0);
    }, 0);

    return (
      <Table.Summary>
        <Table.Summary.Row className="policy-billing-installment-total-row">
          <Table.Summary.Cell index={0} colSpan={3}>
            <strong>{t('Total')}</strong>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={3} align="right">
            {renderColoredMoney(totalMinimum)}
          </Table.Summary.Cell>
        </Table.Summary.Row>
      </Table.Summary>
    );
  }

  function openDetail(receipt) {
    setSelectedReceipt(receipt);
    setDetailVisible(true);
  }

  function closeDetail() {
    setDetailVisible(false);
    setSelectedReceipt(null);
  }

  const columns = [
    {
      title: t('Details'),
      key: 'detail',
      width: 90,
      fixed: 'left',
      render: (_, record) => (
        <Button type="link" onClick={() => openDetail(record)}>
          {t('View')}
        </Button>
      )
    },
    { title: t('Type'), dataIndex: 'recordType', key: 'recordType', width: 100, render: value => t(value) },
    { title: t('Id'), dataIndex: 'id', key: 'id', width: 80 },
    { title: t('Receipt number'), dataIndex: 'receiptNumber', key: 'receiptNumber', width: 140 },
    {
      title: t('Receipt amount'),
      dataIndex: 'receiptAmount',
      key: 'receiptAmount',
      width: 130,
      align: 'right',
      render: value => renderColoredMoney(value)
    },
    {
      title: t('Start date'),
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      render: value => formatDate(value)
    },
    {
      title: t('End date'),
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
      render: value => formatDate(value)
    },
    {
      title: t('Type'),
      dataIndex: 'movementType',
      key: 'movementType',
      width: 160,
      render: value => value ? t(String(value)) : '-'
    },
    { title: t('Premium'), dataIndex: 'premium', key: 'premium', width: 110, align: 'right', render: value => renderColoredMoney(value) },
    { title: t('Discounts'), dataIndex: 'discounts', key: 'discounts', width: 110, align: 'right', render: value => renderColoredMoney(value) },
    { title: t('Surcharges'), dataIndex: 'surcharges', key: 'surcharges', width: 110, align: 'right', render: value => renderColoredMoney(value) },
    { title: t('Gross premium'), dataIndex: 'grossPremium', key: 'grossPremium', width: 120, align: 'right', render: value => renderColoredMoney(value) },
    { title: t('Tax'), dataIndex: 'tax', key: 'tax', width: 100, align: 'right', render: value => renderColoredMoney(value) },
    { title: t('Expenses'), dataIndex: 'expenses', key: 'expenses', width: 100, align: 'right', render: value => renderColoredMoney(value) },
    { title: t('Income date'), dataIndex: 'incomeDate', key: 'incomeDate', width: 160, render: value => formatDate(value, true) }
  ];

  const installmentColumns = [
    { title: t('Id'), dataIndex: 'id', key: 'id', width: 90 },
    { title: t('Installment number'), dataIndex: 'numberInYear', key: 'numberInYear', width: 150, align: 'center' },
    { title: t('Due date'), dataIndex: 'dueDate', key: 'dueDate', width: 150, render: value => formatDate(value) },
    { title: t('Minimum'), dataIndex: 'minimum', key: 'minimum', width: 130, align: 'right', render: value => renderColoredMoney(value) }
  ];

  return (
    <DefaultPage
      title={policy ? `${t('Policy billing')}: ${policy.code || policyId}` : t('Policy billing')}
      subTitle={policy ? `${t('Currency')}: ${policy.currency || '-'}` : t('Receipts and movements')}
      icon="file-text"
      extra={(
        <Button type="default" href={policyHref}>
          <BackIcon /> {t('Back')}
        </Button>
      )}
    >
      <Row gutter={[16, 16]}>
        <Col span={24}>
          {loading ? (
            <Spin />
          ) : receipts.length === 0 ? (
            <Empty description={t('No receipts or endorsements to display.')} />
          ) : (
            <Table
              rowKey="key"
              columns={columns}
              dataSource={receipts}
              loading={loading}
              size="small"
              className="policy-billing-table"
              rowClassName={getBillingRowClass}
              pagination={{ pageSize: 25, showSizeChanger: false }}
              scroll={{ x: 1200 }}
              summary={() => renderTotals(receipts)}
            />
          )}
        </Col>
      </Row>

      <Modal
        title={selectedReceipt ? `${t('Details')}: ${t(selectedReceipt.recordType)}` : t('Receipt details')}
        open={detailVisible}
        onCancel={closeDetail}
        footer={null}
        width={850}
      >
        {selectedReceipt ? (
          <Tabs defaultActiveKey="summary">
            <TabPane
              key="summary"
              tab={<span><SummaryIcon /> {t('Summary')}</span>}
            >
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label={t('Receipt number')}>{selectedReceipt.receiptNumber || '-'}</Descriptions.Item>
                <Descriptions.Item label={t('Endorsement')}>{selectedReceipt.changeId || '-'}</Descriptions.Item>
                <Descriptions.Item label={t('Movement type')}>
                  {selectedReceipt.movementType ? t(String(selectedReceipt.movementType)) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('Receipt amount')}>{formatMoney(selectedReceipt.receiptAmount)}</Descriptions.Item>
                <Descriptions.Item label={t('Start date')}>{formatDate(selectedReceipt.startDate)}</Descriptions.Item>
                <Descriptions.Item label={t('End date')}>{formatDate(selectedReceipt.endDate)}</Descriptions.Item>
                <Descriptions.Item label={t('Premium')}>{formatMoney(selectedReceipt.premium)}</Descriptions.Item>
                <Descriptions.Item label={t('Discounts')}>{formatMoney(selectedReceipt.discounts)}</Descriptions.Item>
                <Descriptions.Item label={t('Surcharges')}>{formatMoney(selectedReceipt.surcharges)}</Descriptions.Item>
                <Descriptions.Item label={t('Gross premium')}>{formatMoney(selectedReceipt.grossPremium)}</Descriptions.Item>
                <Descriptions.Item label={t('Tax')}>{formatMoney(selectedReceipt.tax)}</Descriptions.Item>
                <Descriptions.Item label={t('Expenses')}>{formatMoney(selectedReceipt.expenses)}</Descriptions.Item>
                <Descriptions.Item label={t('Income date')}>{formatDate(selectedReceipt.incomeDate, true)}</Descriptions.Item>
              </Descriptions>
            </TabPane>
            <TabPane
              key="installments"
              tab={<span><InstallmentIcon /> {t('Installment image')}</span>}
            >
              <Table
                rowKey={(installment, index) => String(installment && installment.id ? installment.id : index)}
                columns={installmentColumns}
                dataSource={getSortedInstallments(selectedReceipt)}
                pagination={false}
                size="small"
                className="policy-billing-installments"
                summary={rows => renderInstallmentTotals(rows)}
              />
            </TabPane>
          </Tabs>
        ) : null}
      </Modal>
    </DefaultPage>
  );
}
