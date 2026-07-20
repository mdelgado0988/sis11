()=>{
  const { useEffect, useMemo, useState } = React;
  const { Table, Button, Row, Col, Form, Select, Input, InputNumber, DatePicker, Skeleton, Empty, message, Space, Divider, Modal } = A;
  const { Column } = Table;

  const fallbackFrequencyOptions = [
    { value: 'm', label: 'Mensual', months: 1 },
    { value: 'b', label: 'Bimensual', months: 2 },
    { value: 't', label: 'Trimestral', months: 3 },
    { value: 's', label: 'Semestral', months: 6 },
    { value: 'q', label: 'Trimestral', months: 3 },
    { value: 'y', label: 'Anual', months: 12 },
    { value: 'c', label: 'Contado', months: 12 }
  ];

  const fallbackFrequencyLabelMap = fallbackFrequencyOptions.reduce((acc, item) => {
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
  const roundMoney = (value) => Number((Number(value == null ? 0 : value) || 0).toFixed(2));
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

  function getFrequencyLabel(value, labelMap) {
    const key = safeString(value).toLowerCase();
    const map = labelMap && typeof labelMap === 'object' ? labelMap : fallbackFrequencyLabelMap;
    return map[key] || safeString(value) || '-';
  }

  function buildFrequencyOption(item) {
    const raw = safeString(item);
    if (!raw) {
      return null;
    }

    const lower = raw.toLowerCase();
    const labels = {
      m: { label: 'Mensual', months: 1 },
      b: { label: 'Bimensual', months: 2 },
      t: { label: 'Trimestral', months: 3 },
      s: { label: 'Semestral', months: 6 },
      q: { label: 'Trimestral', months: 3 },
      y: { label: 'Anual', months: 12 },
      c: { label: 'Contado', months: 12 }
    };
    const mapped = labels[lower];

    return {
      value: lower,
      label: mapped ? mapped.label : raw,
      months: mapped ? mapped.months : 1
    };
  }

  function buildProductFrequencyOptions(product) {
    const options = [];
    const seen = {};
    let config = {};

    try {
      config = product && product.configJson ? JSON.parse(product.configJson) : {};
    } catch (error) {
      config = {};
    }

    const premiumConfig = config && config.Premium ? config.Premium : {};
    let periodicity = [];

    if (Array.isArray(premiumConfig.periodicity)) {
      periodicity = premiumConfig.periodicity;
    } else if (Array.isArray(config.periodicity)) {
      periodicity = config.periodicity;
    }

    periodicity.forEach(function(item) {
      if (typeof item === 'string') {
        const option = buildFrequencyOption(item);
        if (option && !seen[option.value]) {
          seen[option.value] = true;
          options.push(option);
        }
        return;
      }

      if (item && Array.isArray(item.custom)) {
        item.custom.forEach(function(customItem) {
          const value = safeString(customItem && customItem.expression);
          const label = safeString(customItem && customItem.name);

          if (!value || !label || seen[value.toLowerCase()]) {
            return;
          }

          seen[value.toLowerCase()] = true;
          options.push({
            value: value.toLowerCase(),
            label: label,
            months: parseFrequencyMonths(value)
          });
        });
      } else if (item && item.expression && item.name) {
        const expressionValue = safeString(item.expression).toLowerCase();
        if (expressionValue && !seen[expressionValue]) {
          seen[expressionValue] = true;
          options.push({
            value: expressionValue,
            label: safeString(item.name),
            months: parseFrequencyMonths(expressionValue)
          });
        }
      }
    });

    return options.length ? options : fallbackFrequencyOptions.slice();
  }

  function parseFrequencyMonths(value) {
    const key = safeString(value).toLowerCase();
    if (!key) {
      return 1;
    }

    if (key.indexOf('m') === 0 && key.length > 1) {
      const numeric = Number(key.substring(1));
      return numeric > 0 ? numeric : 1;
    }

    if (key === 'm') return 1;
    if (key === 'b') return 2;
    if (key === 't') return 3;
    if (key === 's' || key === 'q') return 6;
    if (key === 'y' || key === 'c') return 12;

    const numericValue = Number(key);
    return numericValue > 0 ? numericValue : 1;
  }

  function getFrequencyMonths(value, options) {
    const key = safeString(value).toLowerCase();
    const option = toRows(options).find(function(item) {
      return safeString(item && item.value).toLowerCase() === key;
    });

    if (option && safeNumber(option.months) > 0) {
      return safeNumber(option.months);
    }

    return parseFrequencyMonths(key);
  }

  function toUtcIsoFromPanamaDate(dateLike) {
    if (!dateLike) {
      return null;
    }

    const date = typeof dateLike.clone === 'function'
      ? dateLike.clone()
      : moment(dateLike);

    if (!date || typeof date.format !== 'function') {
      return null;
    }

    if (!date.isValid()) {
      return null;
    }

    const utcDate = new Date(date.toDate().getTime() + panamaOffsetMs);
    return utcDate.toISOString();
  }

  function SummaryField({ label, value }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
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
    const [newPayPlans, setNewPayPlans] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [frequencyOptions, setFrequencyOptions] = useState(fallbackFrequencyOptions.slice());
    const [form] = Form.useForm();
    const [endorsementForm] = Form.useForm();
    const [endorsementModalOpen, setEndorsementModalOpen] = useState(false);
    const [previewNeedsRefresh, setPreviewNeedsRefresh] = useState(false);
    const frequencyLabelMap = useMemo(function() {
      return frequencyOptions.reduce(function(acc, item) {
        acc[String(item.value).toLowerCase()] = item.label;
        return acc;
      }, {});
    }, [frequencyOptions]);

    useEffect(function() {
      const styleId = 'payplan-endorsement-styles';
      $('#' + styleId).remove();
      $('<style>', { id: styleId, type: 'text/css' }).html(`
        .payplan-table-wrap .ant-table-thead > tr > th,
        .payplan-table-wrap .ant-table-tbody > tr > td {
          padding-top: 4px !important;
          padding-bottom: 4px !important;
          padding-left: 8px !important;
          padding-right: 8px !important;
          line-height: 1 !important;
        }
        .payplan-table-wrap .ant-table-tbody > tr {
          height: 28px !important;
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

        let currentFrequencyOptions = fallbackFrequencyOptions.slice();
        if (safeString(currentPolicy && currentPolicy.productCode)) {
          try {
            const productResponse = await exe('RepoProduct', {
              operation: 'GET',
              filter: `code = '${safeString(currentPolicy.productCode).replace(/'/g, "''")}'`
            });
            currentFrequencyOptions = buildProductFrequencyOptions(toFirstRow(productResponse && productResponse.outData));
          } catch (error) {
            currentFrequencyOptions = fallbackFrequencyOptions.slice();
          }
        }

        const methodOptions = toRows(paymentMethodResponse && paymentMethodResponse.outData).map(item => ({
          value: safeString(item && item.code),
          label: safeString((item && item.name) || (item && item.code))
        }));

        setPolicy(currentPolicy);
        setPayPlans(currentPayPlans);
        setNewPayPlans(currentPayPlans);
        setPaymentMethods(methodOptions);
        setFrequencyOptions(currentFrequencyOptions);
        setPreviewNeedsRefresh(false);

        form.setFieldsValue({
          currentPaymentMethod: getPaymentMethodCode(currentPolicy),
          currentFrequency: safeString(currentPolicy && currentPolicy.periodicity ? currentPolicy.periodicity : '').toLowerCase(),
          currentInstallments: currentPayPlans.length,
          newPaymentMethod: getPaymentMethodCode(currentPolicy),
          newFrequency: safeString(currentPolicy && currentPolicy.periodicity ? currentPolicy.periodicity : '').toLowerCase(),
          newInstallments: currentPayPlans.length || safeNumber(currentPolicy && currentPolicy.installment ? currentPolicy.installment : 0),
          effectiveDate: toPanamaMoment(currentPolicy && currentPolicy.start),
          startDate: toPanamaMoment(currentPolicy && currentPolicy.start),
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
          frequency: getFrequencyLabel(policy && policy.periodicity, frequencyLabelMap),
          installments: payPlans.length
        };
    }, [policy, payPlans, paymentMethods, frequencyLabelMap]);

    function getPolicyPaymentMethodLabel(options, currentPolicy) {
      const code = getPaymentMethodCode(currentPolicy);
      const method = toRows(options).find(item => safeString(item && item.value) === code);
      return method ? method.label : (code || '-');
    }

    const policyHref = policy && policy.id ? `/#/lifePolicy/${policy.id}` : '#/home';

    function openEndorsementModal() {
      const formValues = form.getFieldsValue();
      if (previewNeedsRefresh) {
        message.error(t('Please calculate installments again before executing the endorsement.'));
        return;
      }

      if (!hasEndorsementChanges(formValues)) {
        message.error(t('No changes were detected in the endorsement.'));
        return;
      }

      const currentValues = form.getFieldsValue();
      endorsementForm.setFieldsValue({
        effectiveDate: currentValues.effectiveDate || toPanamaMoment(policy && policy.start),
        description: currentValues.description || ''
      });
      setEndorsementModalOpen(true);
    }

    function previewEndorsement() {
      form.validateFields(['newFrequency', 'newInstallments', 'startDate']).then(function(values) {
        try {
          const currentRows = toRows(payPlans).slice().sort(function(a, b) {
            return safeNumber(a && a.numberInYear) - safeNumber(b && b.numberInYear);
          });
          const desiredInstallments = safeNumber(values.newInstallments);
          const paidRows = currentRows.filter(function(row) {
            return safeNumber(row && row.payed) > 0;
          });
          const paidCount = paidRows.length;
          const startDate = values.startDate || toPanamaMoment(policy && policy.start);
          const policyStart = toPanamaMoment(policy && policy.start);
          const policyEnd = toPanamaMoment(policy && policy.end);
          const frequencyMonths = getFrequencyMonths(values.newFrequency, frequencyOptions);

          if (!policy || !policy.id) {
            throw new Error(t('The policy information is not available.'));
          }

          if (!startDate || typeof startDate.isValid !== 'function' || !startDate.isValid()) {
            throw new Error(t('The start date is required.'));
          }

          if (!policyStart || !policyEnd) {
            throw new Error(t('The policy validity is not available.'));
          }

          if (startDate.isBefore(policyStart, 'day') || startDate.isAfter(policyEnd, 'day')) {
            throw new Error(t('The start date must be within the policy validity.'));
          }

          if (!(desiredInstallments > 0)) {
            throw new Error(t('The installment count is required.'));
          }

          if (desiredInstallments <= paidCount) {
            throw new Error(t('The number of installments must be greater than the paid installments.'));
          }

          if (!(frequencyMonths > 0)) {
            throw new Error(t('The selected frequency is invalid.'));
          }

          const totalMinimum = roundMoney(sumPlanAmount(currentRows, 'minimum'));
          const totalPaid = roundMoney(sumPlanAmount(currentRows, 'payed'));
          const pendingAmount = roundMoney(totalMinimum - totalPaid);
          const remainingSlots = desiredInstallments - paidCount;

          if (!(remainingSlots > 0)) {
            throw new Error(t('The number of installments must be greater than the paid installments.'));
          }

          const baseCents = Math.round(roundMoney(pendingAmount) * 100);
          const centsPerRow = remainingSlots > 0 ? Math.floor(baseCents / remainingSlots) : 0;
          const remainder = remainingSlots > 0 ? baseCents - (centsPerRow * remainingSlots) : 0;

          const lockedPreviewRows = paidRows.map(function(row) {
            const paidAmount = roundMoney(row && row.payed);
            const currentMinimum = roundMoney(row && row.minimum);
            const lockedMinimum = paidAmount > 0 && paidAmount < currentMinimum ? paidAmount : currentMinimum;

            return {
              ...row,
              minimum: lockedMinimum,
              expected: lockedMinimum,
              dueAmount: 0,
              pendingAmount: 0,
              payed: paidAmount,
              payedDate: row && row.payedDate ? row.payedDate : null,
              pending: false,
              edited: false
            };
          });

          const unpaidSources = currentRows.filter(function(row) {
            return safeNumber(row && row.payed) <= 0;
          });

          const recalculatedRows = [];
          for (let index = 0; index < remainingSlots; index += 1) {
            const sourceRow = unpaidSources[index] || unpaidSources[unpaidSources.length - 1] || currentRows[currentRows.length - 1] || {};
            const dueMoment = startDate.clone().add(frequencyMonths * index, 'months');
            const coveredUntilMoment = dueMoment.clone().add(frequencyMonths, 'months');
            const amountCents = centsPerRow + (index === remainingSlots - 1 ? remainder : 0);
            const amount = roundMoney(amountCents / 100);
            const dueDate = toUtcIsoFromPanamaDate(dueMoment);
            const coveredUntil = toUtcIsoFromPanamaDate(coveredUntilMoment);
            const originalRow = unpaidSources[index] || null;

            recalculatedRows.push({
              ...sourceRow,
              id: originalRow && originalRow.id != null ? originalRow.id : 0,
              tempKey: originalRow && originalRow.id != null ? `plan-${originalRow.id}` : `preview-${index + 1}`,
              numberInYear: paidCount + index + 1,
              minimum: amount,
              expected: amount,
              dueAmount: amount,
              pendingAmount: amount,
              payed: 0,
              payedDate: null,
              dueDate: dueDate,
              normalDueDate: dueDate,
              coveredUntil: coveredUntil,
              pending: true,
              final: index === remainingSlots - 1 ? true : false,
              edited: hasRowChanged(originalRow, {
                ...sourceRow,
                minimum: amount,
                expected: amount,
                dueAmount: amount,
                pendingAmount: amount,
                payed: 0,
                payedDate: null,
                dueDate: dueDate,
                normalDueDate: dueDate,
                coveredUntil: coveredUntil,
                pending: true,
                final: index === remainingSlots - 1 ? true : false
              })
            });
          }

          const previewRows = lockedPreviewRows.concat(recalculatedRows);
          setNewPayPlans(previewRows);
          setPreviewNeedsRefresh(false);
          message.success(t('Preview updated successfully'));
        } catch (error) {
          message.error((error && error.message) ? error.message : t('Unable to build the preview.'));
        }
      }).catch(function() {
        // Field-level validation feedback is handled by Ant Design.
      });
    }

    function normalizeComparableDueDate(value) {
      const date = toPanamaMoment(value);
      return date && typeof date.format === 'function' ? date.format('YYYY-MM-DD') : safeString(value);
    }

    function normalizeComparableMoney(value) {
      return roundMoney(value).toFixed(2);
    }

    function normalizeComparableString(value) {
      return safeString(value).toLowerCase();
    }

    function getComparablePlanRows(source) {
      return toRows(source).slice().sort(function(a, b) {
        return safeNumber(a && a.numberInYear) - safeNumber(b && b.numberInYear);
      }).map(function(item) {
        return {
          numberInYear: safeNumber(item && item.numberInYear),
          dueDate: normalizeComparableDueDate(item && (item.dueDate || item.normalDueDate || item.coveredUntil)),
          minimum: normalizeComparableMoney(item && item.minimum),
          payed: normalizeComparableMoney(item && item.payed)
        };
      });
    }

    function hasEndorsementChanges(values) {
      const currentRows = getComparablePlanRows(payPlans);
      const newRows = getComparablePlanRows(newPayPlans.length ? newPayPlans : payPlans);
      if (currentRows.length !== newRows.length) {
        return true;
      }
      
      if (normalizeComparableString(getPaymentMethodCode(policy)) !== normalizeComparableString(values && values.newPaymentMethod)) {
        return true;
      }

      if (normalizeComparableString(policy && policy.periodicity) !== normalizeComparableString(values && values.newFrequency)) {
        return true;
      }

      if (safeNumber(payPlans.length) !== safeNumber(values && values.newInstallments)) {
        return true;
      }

      for (let index = 0; index < currentRows.length; index += 1) {
        const currentRow = currentRows[index] || {};
        const newRow = newRows[index] || {};

        if (String(currentRow.dueDate) !== String(newRow.dueDate)) {
          return true;
        }

        if (String(currentRow.minimum) !== String(newRow.minimum)) {
          return true;
        }
      }

      return false;
    }

    function closeEndorsementModal() {
      setEndorsementModalOpen(false);
    }

    function buildEditedPayPlanPayload() {
      const sourceRows = newPayPlans.length ? newPayPlans : payPlans;
      return toRows(sourceRows).map(function(row) {
        const clonedRow = {
          ...row,
          PayPlanDetail: toRows(row && row.PayPlanDetail).map(function(detail) {
            return { ...detail };
          })
        };

        delete clonedRow.tempKey;

        return clonedRow;
      });
    }

    function getChangeIdFromResponse(response) {
      if (!response) {
        return 0;
      }

      if (safeNumber(response.changeId) > 0) {
        return safeNumber(response.changeId);
      }

      if (safeNumber(response.id) > 0) {
        return safeNumber(response.id);
      }

      if (response.outData) {
        if (Array.isArray(response.outData) && response.outData.length > 0) {
          const firstRow = response.outData[0];
          if (safeNumber(firstRow && firstRow.id) > 0) {
            return safeNumber(firstRow.id);
          }
          if (safeNumber(firstRow && firstRow.changeId) > 0) {
            return safeNumber(firstRow.changeId);
          }
        }

        if (safeNumber(response.outData.id) > 0) {
          return safeNumber(response.outData.id);
        }

        if (safeNumber(response.outData.changeId) > 0) {
          return safeNumber(response.outData.changeId);
        }
      }

      return 0;
    }

    function getProcessIdFromResponse(response) {
      if (!response) {
        return 0;
      }

      if (safeNumber(response.processId) > 0) {
        return safeNumber(response.processId);
      }

      if (response.outData) {
        if (Array.isArray(response.outData) && response.outData.length > 0) {
          const firstRow = response.outData[0];
          if (safeNumber(firstRow && firstRow.processId) > 0) {
            return safeNumber(firstRow.processId);
          }
        }

        if (safeNumber(response.outData.processId) > 0) {
          return safeNumber(response.outData.processId);
        }
      }

      return 0;
    }

    async function getChangeProcessId(changeId, response) {
      const responseProcessId = getProcessIdFromResponse(response);
      if (responseProcessId > 0) {
        return responseProcessId;
      }

      if (!(safeNumber(changeId) > 0)) {
        return 0;
      }

      const changeResponse = await exe('LoadEntity', {
        entity: 'Change',
        fields: 'id,processId',
        noTracking: true,
        filter: `id=${safeNumber(changeId)}`
      });

      const change = changeResponse && changeResponse.outData ? changeResponse.outData : null;
      return safeNumber(change && change.processId);
    }

    async function approveEndorsementWorkflow(processId) {
      const procesoId = safeNumber(processId);

      if (!(procesoId > 0)) {
        throw new Error(t('The endorsement workflow process could not be determined.'));
      }

      const result = await exe('GotoStep', {
        procesoId: procesoId,
        estado: 'APROVED'
      });
      const response = Array.isArray(result) ? (result[0] || {}) : result;

      if (!response || !response.ok) {
        throw new Error((response && response.msg) ? response.msg : t('The endorsement workflow could not be approved.'));
      }

      return response;
    }

    async function clearChangePaymentPlanFields(changeId, values) {
      if (!(safeNumber(changeId) > 0)) {
        return;
      }

      const currentFrequencyValue = safeString(values && values.currentFrequency) || safeString(policy && policy.periodicity);
      const currentPaymentMethodValue = safeString(values && values.currentPaymentMethod) || safeString(getPaymentMethodCode(policy));
      const payload = [
        `newPaymentMethod='${safeString(values && values.newPaymentMethod).replace(/'/g, "''")}'`,
        `oldPaymentMethod='${currentPaymentMethodValue.replace(/'/g, "''")}'`,
        `newFrequency='${safeString(values && values.newFrequency).replace(/'/g, "''")}'`,
        `oldFrequency='${currentFrequencyValue.replace(/'/g, "''")}'`
      ].join(',');

      const resultado = await exe('SetField',
        {
          entity: 'Change',
          entityId: safeNumber(changeId),
          fieldValue: payload
        }
      );

      if (!resultado.ok) {
        throw new Error((resultado && resultado.msg) ? resultado.msg : t('The endorsement was executed, but the change fields could not be updated.'));
      }
    }

    function buildEffectiveDateTime(policyStart, value) {
      const selectedDate = parseSelectedDate(value);
      if (!selectedDate) {
        return null;
      }

      const now = new Date();
      const startDate = parseUtcDate(policyStart);
      const selectedTime = Date.UTC(
        selectedDate.getUTCFullYear(),
        selectedDate.getUTCMonth(),
        selectedDate.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds(),
        now.getUTCMilliseconds()
      );

      if (startDate && selectedTime < startDate.getTime()) {
        const adjustedTime = Date.UTC(
          selectedDate.getUTCFullYear(),
          selectedDate.getUTCMonth(),
          selectedDate.getUTCDate(),
          startDate.getUTCHours(),
          startDate.getUTCMinutes(),
          startDate.getUTCSeconds(),
          startDate.getUTCMilliseconds()
        );

        return formatUtcDateTime7(new Date(adjustedTime));
      }

      return formatUtcDateTime7(new Date(selectedTime));
    }

    function parseSelectedDate(value) {
      if (!value) {
        return null;
      }

      if (typeof value.toDate === 'function') {
        const asDate = value.toDate();
        return asDate instanceof Date && !Number.isNaN(asDate.getTime()) ? asDate : null;
      }

      if (typeof value.format === 'function') {
        return parseSelectedDate(value.format('YYYY-MM-DD'));
      }

      const raw = safeString(value);
      if (!raw) {
        return null;
      }

      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        const parts = raw.split('-');
        const year = Number(parts[0]);
        const month = Number(parts[1]) - 1;
        const day = Number(parts[2]);
        const date = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
        return Number.isNaN(date.getTime()) ? null : date;
      }

      const parsed = new Date(raw);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    function parseUtcDate(value) {
      if (!value) {
        return null;
      }

      const raw = safeString(value);
      if (!raw) {
        return null;
      }

      const utcValue = /z$/i.test(raw) || /[+-]\d{2}:?\d{2}$/i.test(raw) ? raw : raw + 'Z';
      const date = new Date(utcValue);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    function formatUtcDateTime7(date) {
      if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        return null;
      }

      const year = String(date.getUTCFullYear()).padStart(4, '0');
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      const seconds = String(date.getUTCSeconds()).padStart(2, '0');
      const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0');

      return year + '-' + month + '-' + day + 'T' + hours + ':' + minutes + ':' + seconds + '.' + milliseconds + '0000';
    }

    function hasRowChanged(originalRow, previewRow) {
      if (!originalRow || !previewRow) {
        return false;
      }

      return normalizeComparableDueDate(originalRow.dueDate || originalRow.normalDueDate || originalRow.coveredUntil) !==
        normalizeComparableDueDate(previewRow.dueDate || previewRow.normalDueDate || previewRow.coveredUntil) ||
        normalizeComparableMoney(originalRow.minimum) !== normalizeComparableMoney(previewRow.minimum) ||
        normalizeComparableMoney(originalRow.expected) !== normalizeComparableMoney(previewRow.expected) ||
        normalizeComparableMoney(originalRow.payed) !== normalizeComparableMoney(previewRow.payed) ||
        normalizeComparableDueDate(originalRow.payedDate) !== normalizeComparableDueDate(previewRow.payedDate) ||
        normalizeComparableDueDate(originalRow.coveredUntil) !== normalizeComparableDueDate(previewRow.coveredUntil);
    }

    async function confirmEndorsementModal() {
      try {
        const values = await endorsementForm.validateFields();

        if (!policy || !policy.id) {
          throw new Error(t('The policy information is not available.'));
        }

        if (previewNeedsRefresh) {
          throw new Error(t('Please calculate installments again before executing the endorsement.'));
        }

        const effectiveDate = buildEffectiveDateTime(policy && policy.start, values.effectiveDate);
        if (!effectiveDate) {
          throw new Error(t('The effective date is invalid.'));
        }

        const editedPayPlan = buildEditedPayPlanPayload();
        if (!editedPayPlan.length) {
          throw new Error(t('The edited pay plan is not available.'));
        }

        const currentValues = form.getFieldsValue(true);
        setLoading(true);
        const response = await exe('ChangePayPlan', {
            policyId: policy.id,
            effectiveDate: effectiveDate,
            operation: 'ADD',
            code: null,
            note: safeString(values.description),
            changeIdToBeAmended: null,
            jEditedPayPlan: JSON.stringify(editedPayPlan),
            Surcharges: []
        });

        if (!response || !response.ok) {
          throw new Error((response && response.msg) ? response.msg : t('The endorsement could not be executed.'));
        }

        const changeId = getChangeIdFromResponse(response);
        if (!(changeId > 0)) {
          throw new Error(t('The endorsement change could not be determined.'));
        }

        await clearChangePaymentPlanFields(changeId, currentValues);
        const processId = await getChangeProcessId(changeId, response);
        await approveEndorsementWorkflow(processId);

        const executeResult = await exe('ExeChangePayPlan', {
          changeId: changeId,
          operation: 'EXECUTE',
          exeNow: true
        });

        if (!executeResult || !executeResult.ok) {
          throw new Error((executeResult && executeResult.msg) ? executeResult.msg : t('The endorsement could not be executed.'));
        }

        setEndorsementModalOpen(false);
        message.success(executeResult.msg || response.msg || t('Endorsement executed successfully'));
        window.location.href = policyHref;
      } catch (error) {
        if (error && error.errorFields) {
          return;
        }

        message.error((error && error.message) ? error.message : String(error || t('The endorsement could not be executed.')));
      } finally {
        setLoading(false);
      }
    }

    function getPlanDueDateMoment(row) {
      if (!row) {
        return null;
      }

      return toPanamaMoment(row.dueDate || row.normalDueDate || row.coveredUntil);
    }

    function updatePreviewDueDate(rowIndex, selectedDate) {
      setNewPayPlans(function(previousRows) {
        const rows = toRows(previousRows).slice();
        const currentRow = rows[rowIndex];

        if (!currentRow) {
          return previousRows;
        }

        if (!selectedDate || typeof selectedDate.isValid !== 'function' || !selectedDate.isValid()) {
          message.error(t('The due date is required.'));
          return previousRows;
        }

        const nextRow = rows[rowIndex + 1] || null;
        const nextDueDate = getPlanDueDateMoment(nextRow);
        if (nextDueDate && selectedDate.isAfter(nextDueDate, 'day')) {
          message.error(t('The due date cannot be greater than the next installment date.'));
          return previousRows;
        }

        const previousRow = rowIndex > 0 ? rows[rowIndex - 1] : null;
        const previousDueDate = getPlanDueDateMoment(previousRow);
        if (previousDueDate && selectedDate.isBefore(previousDueDate, 'day')) {
          message.error(t('The due date cannot be earlier than the previous installment date.'));
          return previousRows;
        }

        const updatedDate = toUtcIsoFromPanamaDate(selectedDate);
        const originalRow = toRows(payPlans).find(function(item) {
          return safeNumber(item && item.numberInYear) === safeNumber(currentRow && currentRow.numberInYear);
        }) || null;

        rows[rowIndex] = {
          ...currentRow,
          dueDate: updatedDate,
          normalDueDate: updatedDate,
          edited: hasRowChanged(originalRow, {
            ...currentRow,
            dueDate: updatedDate,
            normalDueDate: updatedDate
          })
        };

        return rows;
      });
    }

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
      const isNewPayPlan = safeString(title) === safeString(t('New pay plan'));
      return (
        <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 16, background: '#fff', minHeight: 988, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>{title}</h3>
          {rows.length === 0 ? (
            <Empty description={t('There are no installments to display')} />
          ) : (
            <div className="payplan-table-wrap" style={{ overflow: 'hidden' }}>
              <Table
                dataSource={source}
                rowKey={function(record, index) {
                  if (record && safeNumber(record.id) > 0) {
                    return String(record.id);
                  }

                  if (record && record.tempKey) {
                    return String(record.tempKey);
                  }

                  return `plan-row-${index}`;
                }}
                pagination={{ pageSize: 25 }}
                loading={loading}
                scroll={{ x: 1100, y: 567 }}
                rowClassName={function(record) {
                  return safeNumber(record && record.payed) > 0 ? 'payplan-locked-row' : '';
                }}
              >
                <Column title={t('Installment no.')} dataIndex="numberInYear" key={`${title}-numberInYear`} render={renderPlanValue} align="center" />
                <Column title={t('Concept')} dataIndex="concept" key={`${title}-concept`} render={renderPlanValue} />
                <Column title={t('Minimum amount')} dataIndex="minimum" key={`${title}-minimum`} render={formatMoney} align="right" />
                <Column
                  title={t('Due date')}
                  dataIndex="dueDate"
                  key={`${title}-dueDate`}
                  align="center"
                  render={function(value, record, index) {
                    const isLocked = safeNumber(record && record.payed) > 0;
                    const currentValue = getPlanDueDateMoment(record);
                    if (!isNewPayPlan || isLocked) {
                      return (
                        <DatePicker
                          value={currentValue}
                          allowClear={false}
                          disabled
                          style={{ width: '100%' }}
                          format="DD/MM/YYYY"
                        />
                      );
                    }

                    const nextRow = rows[index + 1] || null;
                    const nextDueDate = getPlanDueDateMoment(nextRow);

                    return (
                      <DatePicker
                        value={currentValue}
                        allowClear={false}
                        style={{ width: '100%' }}
                        format="DD/MM/YYYY"
                        disabledDate={function(currentDate) {
                          if (!nextDueDate || !currentDate) {
                            return false;
                          }

                          return currentDate.isAfter(nextDueDate, 'day');
                        }}
                        onChange={function(selectedDate) {
                          updatePreviewDueDate(index, selectedDate);
                        }}
                      />
                    );
                  }}
                />
                <Column title={t('Paid')} dataIndex="payed" key={`${title}-payed`} render={formatMoney} align="right" />
                <Column title={t('Payment date')} dataIndex="payedDate" key={`${title}-payedDate`} render={formatDateTime} align="center" />
              </Table>
            </div>
          )}
          {renderPlanTotals(rows)}
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
            <Button type="primary" onClick={openEndorsementModal} loading={loading}>{t('Execute Endorsement')}</Button>
          </Space>
        )}
      >
        {loading && !policy ? (
          <Skeleton active />
        ) : (
          <>
            <Row gutter={16}>
              <Col xs={24} lg={12}>
                <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 12, background: '#fff' }}>
                  <h3 style={{ marginTop: 0, marginBottom: 12 }}>{t('Current')}</h3>
                  <Row gutter={8}>
                    <Col xs={24} md={12}>
                      <SummaryField label={t('Current frequency')} value={policySummary.frequency} />
                    </Col>
                    <Col xs={24} md={12}>
                      <SummaryField label={t('Current payment method')} value={policySummary.paymentMethod} />
                    </Col>
                  </Row>
                  <Row gutter={8}>
                    <Col xs={24} md={12}>
                      <SummaryField label={t('Current installment count')} value={policySummary.installments} />
                    </Col>
                    <Col xs={24} md={12}>
                      <SummaryField label={t('Policy')} value={(policy && policy.code) ? policy.code : ((policy && policy.id) ? policy.id : '-')} />
                    </Col>
                  </Row>
                  <Row gutter={8}>
                    <Col xs={24}>
                      <SummaryField label={t('Current term')} value={`${formatDate(policy && policy.start)} - ${formatDate(policy && policy.end)}`} />
                    </Col>
                  </Row>
                </div>
              </Col>

              <Col xs={24} lg={12}>
                <div style={{ border: '1px solid #d9f7be', borderRadius: 8, padding: 12, background: '#f6ffed' }}>
                  <h3 style={{ marginTop: 0, marginBottom: 12 }}>{t('After')}</h3>

                  <Form form={form} layout="vertical">
                    <Row gutter={8}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label={t('New frequency')}
                          name="newFrequency"
                          rules={[{ required: true, message: t('Please select the new frequency') }]}
                        >
                          <Select
                            options={frequencyOptions}
                            placeholder={t('Select the new frequency')}
                            showSearch
                            optionFilterProp="label"
                            onChange={function() {
                              setPreviewNeedsRefresh(true);
                            }}
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

                    <Row gutter={8}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label={t('New installment count')}
                          name="newInstallments"
                          rules={[{ required: true, message: t('Please enter the installment count') }]}
                        >
                          <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder={t('Installment count')} onChange={function() {
                            setPreviewNeedsRefresh(true);
                          }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label={t('Start date')}
                          name="startDate"
                          rules={[{ required: true, message: t('Please select the start date') }]}
                        >
                          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" onChange={function() {
                            setPreviewNeedsRefresh(true);
                          }} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={8}>
                      <Col xs={24}>
                        <Button htmlType="button" type="primary" style={{ backgroundColor: '#389e0d', borderColor: '#389e0d' }} onClick={previewEndorsement}>
                          {t('Calculate installments')}
                        </Button>
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
                {renderPayPlanTable(t('New pay plan'), newPayPlans.length ? newPayPlans : payPlans)}
              </Col>
            </Row>

            <Modal
              title={t('Execute Endorsement')}
              open={endorsementModalOpen}
              onOk={confirmEndorsementModal}
              onCancel={closeEndorsementModal}
              okText={t('Execute Endorsement')}
              cancelText={t('Cancel')}
              destroyOnClose
            >
              <Form form={endorsementForm} layout="vertical">
                <Form.Item
                  label={t('Effective date')}
                  name="effectiveDate"
                  rules={[{ required: true, message: t('Please select the effective date') }]}
                >
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                </Form.Item>
                <Form.Item
                  label={t('Endorsement description')}
                  name="description"
                  rules={[{ required: true, message: t('Please enter an endorsement description') }]}
                >
                  <Input.TextArea rows={4} placeholder={t('Enter a description for the endorsement')} />
                </Form.Item>
              </Form>
            </Modal>
          </>
        )}
      </DefaultPage>
    );
  }

  return <App />;
}
