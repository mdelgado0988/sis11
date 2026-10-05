/**
 * @name  ChangeInsuredSumEndorsement
 * @issue AXX-1978 / GLOBUAT-261
 * @purpose Endoso de cambio de suma asegurada POR COBERTURA para Fianzas. El usuario puede editar
 *          varias coberturas con suma y capturar su nueva suma (por diferencia o suma final). La prima se
 *          calcula con la configuracion de la cotizacion: prima vigente x (suma nueva / suma
 *          original), y a esa diferencia se le aplica la prorrata desde la fecha efectiva del
 *          endoso hasta el fin de la cobertura. Recargo/descuento, impuestos, gasto y total
 *          salen de la cotizacion nativa de ChangeCoverage. Se simula y confirma el reaseguro
 *          del movimiento como en ChangeCoverageSuretyEndorsement y se ejecuta con
 *          ChangeCoverage / GotoStep / ExeChangeCoverage; el endoso actualiza la suma y la
 *          prima de la cobertura, las cuotas y el reaseguro (cmdApplyReaChangeCoverage).
 * Se abre con ?policyId=<id>.
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
  const Tooltip = A.Tooltip;

  const EditableFormattedNumber = function (props) {
    const decimals = props.decimals === undefined ? 2 : props.decimals;
    const [draft, setDraft] = useState(props.value === null || props.value === undefined ? '' : String(props.value));
    const [focused, setFocused] = useState(false);
    const [valueOnFocus] = useState({ current: '' });

    useEffect(function () {
      if (!focused) setDraft(props.value === null || props.value === undefined ? '' : String(props.value));
    }, [props.value, focused]);

    const displayValue = focused || draft === '' ? draft : Number(draft).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    return <A.Input size="small" inputMode="decimal" disabled={props.disabled} readOnly={props.readOnly} value={displayValue} style={{ textAlign: 'right' }}
      onFocus={function () { valueOnFocus.current = draft; setFocused(true); }}
      onChange={function (event) { setDraft(event.target.value.replace(/[^0-9.,-]/g, '').replace(',', '.')); }}
      onBlur={function () {
        setFocused(false);
        const value = draft === '' || draft === '-' || draft === '.' ? 0 : Number(draft);
        const original = valueOnFocus.current === '' ? 0 : Number(valueOnFocus.current);
        if (Number.isFinite(value) && value !== original) props.onCommit(value);
        setDraft(Number.isFinite(value) ? value.toFixed(decimals) : (0).toFixed(decimals));
      }} />;
  };

  const [policyId, setPolicyId] = useState(0);

  // AXX-2420 / GLOBUAT-270: consulta de reaseguro (vigente, por movimiento, historial). Solo lectura.
  const [reaHist, setReaHist] = useState({ policyId: 0, loading: false, rows: [], changes: {}, error: '' });
  const [policy, setPolicy] = useState(null);
  const [eligible, setEligible] = useState([]);
  const [covCode, setCovCode] = useState(null);
  const [coverageInputs, setCoverageInputs] = useState({});
  const [effectiveDate, setEffectiveDate] = useState(null);
  const [payPlanPreview, setPayPlanPreview] = useState([]);
  const [surcharge, setSurcharge] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [calc, setCalc] = useState(null);
  const [sim, setSim] = useState(null);
  const [tab, setTab] = useState('calc');
  const [loading, setLoading] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [modal, setModal] = useState(false);
  const [note, setNote] = useState('');
  const [noteTouched, setNoteTouched] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [key, setKey] = useState(null);
  const [altoGrilla, setAltoGrilla] = useState(180);
  // 🔴 Cerrojo contra doble clic: `running` es estado y no cambia entre dos clics del MISMO
  // lote de React, asi que tres clics seguidos disparaban tres ejecuciones. El objeto que
  // devuelve useState conserva su identidad entre renders y se muta de forma sincrona.
  const [lock] = useState({ busy: false });
  // Las cotizaciones y simulaciones son asincronas. Esta version evita que una
  // respuesta anterior reemplace el resultado calculado con los ajustes actuales.
  const [requestVersion] = useState({ calculation: 0, simulation: 0 });
  const [buscarPoliza, setBuscarPoliza] = useState('');
  const [splits, setSplits] = useState([]);
  const [baseCessions, setBaseCessions] = useState([]);
  const [reinsuranceBrokers, setReinsuranceBrokers] = useState([]);
  const [reinsuranceContacts, setReinsuranceContacts] = useState([]);
  const [coinsuranceCessions, setCoinsuranceCessions] = useState([]);
  const [coinsuranceContacts, setCoinsuranceContacts] = useState([]);
  const [contactDirectory, setContactDirectory] = useState({});
  const [reaDetailTab, setReaDetailTab] = useState('distribution');
  const [selectedReinsuranceKey, setSelectedReinsuranceKey] = useState(null);
  const [reinsurersReady, setReinsurersReady] = useState(false);
  const [selectedReinsuranceLineKey, setSelectedReinsuranceLineKey] = useState(null);
  const [reinsuranceConfirmed, setReinsuranceConfirmed] = useState(false);

  const money = function (v) { return Number(Number(v || 0).toFixed(2)); };
  const txt = function (v) { return String(v === null || v === undefined ? '' : v).trim(); };
  const day10 = function (v) { return txt(v).slice(0, 10); };
  const fmt = function (v) {
    const n = Number(v || 0);
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
      commission: money(grossPremium * percentage / 100 * coinsuranceRate('commission')),
      tax: money(grossPremium * percentage / 100 * coinsuranceRate('tax'))
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
    return n > 0 ? 'axx-monto-pos' : (n < 0 ? 'axx-monto-neg' : 'axx-monto-cero');
  };
  const conSigno = function (v) {
    const n = Number(v || 0);
    return (n > 0 ? '+' : '') + fmt(n);
  };

  const numberFrom = function (row, names) {
    for (let i = 0; i < names.length; i++) {
      const value = row && row[names[i]];
      if (value !== undefined && value !== null && value !== '') return Number(value) || 0;
    }
    return 0;
  };

  const rowSumMovement = function (row) {
    return numberFrom(row, ['sumInsuredMovement', 'sumMovement', 'sumInsured', 'sa']);
  };

  function getBaseCoverageRows(group, row) {
    // Todas las lineas complementarias deben partir del mismo estado final de
    // la cobertura. Buscar por linea producia bases distintas entre CP y FAC.
    return (baseCessions || []).filter(function (cession) {
      return String(cession.contractId) === String(group.contractId)
        && String(cession.coverageCode || cession.coverageId || '') === String(row.coverageCode || row.code || '');
    });
  }

  function participantCoverageCode(group, participant) {
    const direct = participant && (participant.coverageCode || participant.coverageId || participant.coverage);
    if (direct !== undefined && direct !== null && direct !== '') return String(direct);
    const cession = (baseCessions || []).find(function (item) {
      return String(item.id) === String(participant && participant.cessionId);
    });
    return cession ? String(cession.coverageCode || cession.coverageId || '') : '';
  }

  function finalCoveragePremium(group, row) {
    if (row && row.finalPremium !== undefined && row.finalPremium !== null) {
      return money(row.finalPremium);
    }
    const base = getBaseCoverageRows(group, row);
    const persisted = base.reduce(function (sum, cession) { return sum + numberFrom(cession, ['premium']); }, 0);
    return money(persisted + numberFrom(row, ['premiumMovement']));
  }

  function finalCoverageSum(group, row) {
    if (row && row.finalSum !== undefined && row.finalSum !== null) {
      return money(row.finalSum);
    }
    const base = getBaseCoverageRows(group, row);
    const persisted = base.reduce(function (sum, cession) { return sum + numberFrom(cession, ['sumInsured']); }, 0);
    return money(persisted + rowSumMovement(row));
  }

  function recalculateReinsuranceTotals(group) {
    const rows = group.rows || [];
    const totals = Object.assign({}, group.totals || {});
    // `movement` y `sumMovement` representan la variacion devuelta por el
    // comando. No deben reconstruirse desde los montos de cobertura al guardar,
    // porque esos montos pueden representar el total de la cobertura.
    if (totals.movement === undefined) {
      totals.movement = money(rows.reduce(function (sum, row) { return sum + numberFrom(row, ['premiumMovement']); }, 0));
    }
    totals.cedant = money(rows.reduce(function (sum, row) { return sum + numberFrom(row, ['premiumCedant']); }, 0));
    totals.re = money(rows.reduce(function (sum, row) { return sum + numberFrom(row, ['premiumRe']); }, 0));
    totals.commission = money(rows.reduce(function (sum, row) { return sum + numberFrom(row, ['commission', 'comissionCedant']); }, 0));
    totals.tax = money(rows.reduce(function (sum, row) { return sum + numberFrom(row, ['tax']); }, 0));
    if (totals.sumMovement === undefined) {
      // Solo la cobertura endosada trae variacion de suma.
      totals.sumMovement = money(rows.reduce(function (sum, row) {
        return sum + numberFrom(row, ['sumInsuredMovement', 'sumMovement']);
      }, 0));
    }
    totals.sumCedant = money(rows.reduce(function (sum, row) { return sum + numberFrom(row, ['sumInsuredCedant']); }, 0));
    totals.sumRe = money(rows.reduce(function (sum, row) { return sum + numberFrom(row, ['sumInsuredRe']); }, 0));
    totals.participantPremium = money(getLineParticipants(group).reduce(function (sum, row) { return sum + numberFrom(row, ['premium']); }, 0));
    group.totals = totals;
    return group;
  }

  function ensureSimGroup(next, groupKey) {
    const existing = (next.contracts || []).find(function (item) {
      return String(item.contractId) + '-' + String(item.lineId) === groupKey;
    });
    if (existing) return existing;
    const separator = groupKey.indexOf('-');
    const contractId = separator >= 0 ? groupKey.slice(0, separator) : groupKey;
    const lineId = separator >= 0 ? groupKey.slice(separator + 1) : '';
    const group = {
      contractId: contractId,
      lineId: lineId,
      rows: (calc && calc.rows || []).map(function (row) {
        return {
          coverageCode: row.code,
          cover: row.name || row.cover || row.code,
          premiumMovement: numberFrom(row, ['variation', 'premiumMovement']),
          proratedMovement: numberFrom(row, ['prorated']),
          sumInsuredMovement: numberFrom(row, ['sumInsuredMovement', 'sumInsured', 'sa']),
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
        return String(item.contractId) + '-' + String(item.lineId) === groupKey;
      });
      if (!group) group = ensureSimGroup(next, groupKey);
      const rows = group.rows || [];
      const sourceField = field === 'premiumCedant' || field === 'premiumRe'
        ? 'premiumMovement'
        : (field === 'sumInsuredCedant' || field === 'sumInsuredRe' ? 'sumInsuredMovement' : field);
      const weights = rows.map(function (row) {
        return field === 'sumInsuredCedant' || field === 'sumInsuredRe'
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
    setReaDetailTab('distribution');
    const amount = money(value);
    setSim(function (current) {
      const next = JSON.parse(JSON.stringify(current));
      let group = (next.contracts || []).find(function (item) {
        return String(item.contractId) + '-' + String(item.lineId) === groupKey;
      });
      if (!group) group = ensureSimGroup(next, groupKey);
      group.totals = Object.assign({}, group.totals || {}, { ['manual' + field]: amount });
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
      return [t('La distribución de reaseguro todavía no está cargada.')];
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
        errors.push(t('Contrato') + ' ' + contract.contractId + ': ' + t('la distribución debe sumar 100%.'));
      }
      if (!closeEnough(totalSum, contract.sum)) {
        errors.push(t('Contrato') + ' ' + contract.contractId + ': ' + t('la suma distribuida no coincide con la suma del contrato.') + ' ' + fmt(totalSum) + ' / ' + fmt(contract.sum));
      }
      if (!closeEnough(totalPremium, contract.movement)) {
        errors.push(t('Contrato') + ' ' + contract.contractId + ': ' + t('la prima distribuida no coincide con la prima del contrato.') + ' ' + fmt(totalPremium) + ' / ' + fmt(contract.movement));
      }
      if (!closeEnough(retentionPremium + cededPremium, contract.movement)) {
        errors.push(t('Contrato') + ' ' + contract.contractId + ': ' + t('la prima retenida más la prima cedida no coincide con la prima total.'));
      }
    });
    const expectedPremium = money(Number(calc.billing && calc.billing.premium ? calc.billing.premium.after : 0)
      - Number(calc.billing && calc.billing.premium ? calc.billing.premium.before : 0));
    if (!closeEnough(numberFrom(sim, ['movement']), expectedPremium)) {
      errors.push(t('El movimiento distribuido no coincide con el movimiento del endoso.') + ' ' + fmt(numberFrom(sim, ['movement'])) + ' / ' + fmt(expectedPremium));
    }
    return errors;
  }

  function guardarDistribucionMemoria() {
    if (!sim) return;
    setReinsuranceConfirmed(false);
    const distributionErrors = validateDistributionBeforeSave();
    if (distributionErrors.length) {
      const validationMessage = distributionErrors.join(' ');
      setError(validationMessage);
      A.message.error(validationMessage);
      return;
    }
    setError(null);
    setReinsurersReady(false);
    setReaDetailTab('distribution');
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
        if (totals.manualRetentionSum !== undefined) allocate(group, rows, 'sumInsuredCedant', Number(totals.manualRetentionSum) || 0, finalCoverageSum);
        if (totals.manualRetentionPremium !== undefined) allocate(group, rows, 'premiumCedant', Number(totals.manualRetentionPremium) || 0, finalCoveragePremium);
        if (totals.manualCededSum !== undefined) allocate(group, rows, 'sumInsuredRe', Number(totals.manualCededSum) || 0, finalCoverageSum);
        if (totals.manualCededPremium !== undefined) allocate(group, rows, 'premiumRe', Number(totals.manualCededPremium) || 0, finalCoveragePremium);
        if (totals.commissionPercentage !== undefined) {
          const rate = (Number(totals.commissionPercentage) || 0) / 100;
          rows.forEach(function (row) { row.commission = money(numberFrom(row, ['premiumRe']) * rate); });
        }
        if (totals.taxPercentage !== undefined) {
          const rate = (Number(totals.taxPercentage) || 0) / 100;
          rows.forEach(function (row) { row.tax = money(numberFrom(row, ['premiumRe']) * rate); });
        }
        if (totals.manualCommission !== undefined) allocate(group, rows, 'commission', Number(totals.manualCommission) || 0, function (item, row) { return numberFrom(row, ['premiumRe']); });
        if (totals.manualTax !== undefined) allocate(group, rows, 'tax', Number(totals.manualTax) || 0, function (item, row) { return numberFrom(row, ['premiumRe']); });

        recalculateReinsuranceTotals(group);
        const participants = group.participants || [];
        participants.forEach(function (participant) {
          const row = rows.find(function (item) {
            return String(item.coverageCode) === participantCoverageCode(group, participant);
          });
          const split = (Number(participant.split) || 0) / 100;
          participant.sumInsured = money(numberFrom(row || group.totals, row ? ['sumInsuredRe'] : ['sumRe']) * split);
          participant.premium = money(numberFrom(row || group.totals, row ? ['premiumRe'] : ['re']) * split);
          participant.commission = money(numberFrom(row || group.totals, row ? ['commission'] : ['commission']) * split);
          participant.tax = money(numberFrom(row || group.totals, row ? ['tax'] : ['tax']) * split);
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
        let assignedPremium = 0;
        let assignedSum = 0;
        item.rows.forEach(function (pair) {
          const totals = pair.group.totals || {};
          const retentionPercentage = totals.distributionPercentageCed !== undefined
            ? Math.max(0, Math.min(100, Number(totals.distributionPercentageCed) || 0))
            : Math.max(0, numberFrom(pair.row, ['proportionCed']) * 100);
          const cededPercentage = totals.distributionPercentageRe !== undefined
            ? Math.max(0, Math.min(100, Number(totals.distributionPercentageRe) || 0))
            : Math.max(0, numberFrom(pair.row, ['proportionRe']) * 100);
          const previousCededPremium = numberFrom(pair.row, ['premiumRe']);
          const commissionRate = previousCededPremium
            ? numberFrom(pair.row, ['commission', 'comissionCedant']) / previousCededPremium
            : 0;
          const taxRate = previousCededPremium ? numberFrom(pair.row, ['tax']) / previousCededPremium : 0;

          pair.row.proportionCed = retentionPercentage / 100;
          pair.row.proportionRe = cededPercentage / 100;
          pair.row.premiumCedant = money(item.expectedPremium * retentionPercentage / 100);
          pair.row.premiumRe = money(item.expectedPremium * cededPercentage / 100);
          pair.row.sumInsuredCedant = money(item.expectedSum * retentionPercentage / 100);
          pair.row.sumInsuredRe = money(item.expectedSum * cededPercentage / 100);
          pair.row.commission = money(pair.row.premiumRe * commissionRate);
          pair.row.tax = money(pair.row.premiumRe * taxRate);
          assignedPremium = money(assignedPremium + pair.row.premiumCedant + pair.row.premiumRe);
          assignedSum = money(assignedSum + pair.row.sumInsuredCedant + pair.row.sumInsuredRe);
        });

        // El redondeo se aplica solo como diferencia residual sobre una linea
        // participante. Nunca se traslada el total del contrato a una cobertura.
        const last = item.rows.slice().reverse().find(function (pair) {
          return numberFrom(pair.row, ['proportionRe']) > 0 || numberFrom(pair.row, ['proportionCed']) > 0;
        });
        if (!last) return;
        const premiumField = numberFrom(last.row, ['proportionRe']) > 0 ? 'premiumRe' : 'premiumCedant';
        const sumFieldName = numberFrom(last.row, ['proportionRe']) > 0 ? 'sumInsuredRe' : 'sumInsuredCedant';
        last.row[premiumField] = money(Number(last.row[premiumField] || 0) + item.expectedPremium - assignedPremium);
        last.row[sumFieldName] = money(Number(last.row[sumFieldName] || 0) + item.expectedSum - assignedSum);
      });
      (next.contracts || []).forEach(function (group) {
        recalculateReinsuranceTotals(group);
        (group.participants || []).forEach(function (participant) {
          const row = (group.rows || []).find(function (item) {
            return String(item.coverageCode) === participantCoverageCode(group, participant);
          });
          const split = (Number(participant.split) || 0) / 100;
          participant.sumInsured = money(numberFrom(row || group.totals, row ? ['sumInsuredRe'] : ['sumRe']) * split);
          participant.premium = money(numberFrom(row || group.totals, row ? ['premiumRe'] : ['re']) * split);
          participant.commission = money(numberFrom(row || group.totals, row ? ['commission'] : ['commission']) * split);
          participant.tax = money(numberFrom(row || group.totals, row ? ['tax'] : ['tax']) * split);
        });
        redistributeParticipantRounding(group);
      });
      return next;
    });
    A.message.success(t('La distribución cuadra y fue aplicada correctamente.'));
  }

  function editContractPercentage(groupKey, field, value) {
    if (!sim) return;
    setReinsurersReady(false);
    setReaDetailTab('distribution');
    setSim(function (current) {
      const next = JSON.parse(JSON.stringify(current));
      let group = (next.contracts || []).find(function (item) {
        return String(item.contractId) + '-' + String(item.lineId) === groupKey;
      });
      if (!group) group = ensureSimGroup(next, groupKey);
      const distributionPercentageField = field === 'proportionCed'
        ? 'distributionPercentageCed'
        : 'distributionPercentageRe';
      const percentageValue = Math.max(0, Math.min(100, Number(value || 0)));
      const totalsBefore = group.totals || {};
      const baseCedSum = getGroupCurrentAmount(group, 'sumInsuredRe');
      const baseRetSum = getGroupCurrentAmount(group, 'sumInsuredCedant');
      const baseCedPremium = getGroupCurrentAmount(group, 'premiumRe');
      const baseRetPremium = getGroupCurrentAmount(group, 'premiumCedant');
      const currentCedSum = totalsBefore.manualCededSum !== undefined ? Number(totalsBefore.manualCededSum) : baseCedSum;
      const currentRetSum = totalsBefore.manualRetentionSum !== undefined ? Number(totalsBefore.manualRetentionSum) : baseRetSum;
      const currentCedPremium = totalsBefore.manualCededPremium !== undefined ? Number(totalsBefore.manualCededPremium) : baseCedPremium;
      const currentRetPremium = totalsBefore.manualRetentionPremium !== undefined ? Number(totalsBefore.manualRetentionPremium) : baseRetPremium;
      // El total de referencia siempre es el total original mas la variacion,
      // nunca la suma de valores manuales previamente editados.
      const totalSum = money(getContractTotal(group, 'sum', baseCedSum + baseRetSum + numberFrom(totalsBefore, ['sumMovement'])) * reinsuranceBaseFactor());
      const totalPremium = money(getContractTotal(group, 'movement', baseCedPremium + baseRetPremium + numberFrom(totalsBefore, ['movement'])) * reinsuranceBaseFactor());
      group.totals = Object.assign({}, group.totals || {}, { [distributionPercentageField]: percentageValue });
      if (field === 'proportionCed') {
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
      if (field === 'proportionRe') {
        const visibleCededPremium = group.totals.manualCededPremium !== undefined
          ? Number(group.totals.manualCededPremium)
          : currentCedPremium;
        const commissionPercentage = group.totals.commissionPercentage !== undefined
          ? Number(group.totals.commissionPercentage)
          : (currentCedPremium ? Number((getGroupCurrentAmount(group, ['commission', 'comissionCedant']) / currentCedPremium * 100).toFixed(4)) : 0);
        const taxPercentage = group.totals.taxPercentage !== undefined
          ? Number(group.totals.taxPercentage)
          : (currentCedPremium ? Number((getGroupCurrentAmount(group, 'tax') / currentCedPremium * 100).toFixed(4)) : 0);
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
    setReaDetailTab('distribution');
    setSim(function (current) {
      const next = JSON.parse(JSON.stringify(current));
      let group = (next.contracts || []).find(function (item) {
        return String(item.contractId) + '-' + String(item.lineId) === groupKey;
      });
      if (!group) group = ensureSimGroup(next, groupKey);
      const percentageField = field === 'commission' ? 'commissionPercentage' : 'taxPercentage';
      const percentageValue = Math.max(0, Math.min(100, Number(value || 0)));
      const cededPremium = group.totals.manualCededPremium !== undefined
        ? Number(group.totals.manualCededPremium)
        : getGroupCurrentAmount(group, 'premiumRe');
      group.totals = Object.assign({}, group.totals || {}, { [percentageField]: percentageValue });
      group.totals.manualCommission = field === 'commission'
        ? money(cededPremium * percentageValue / 100)
        : group.totals.manualCommission;
      group.totals.manualTax = field === 'tax'
        ? money(cededPremium * percentageValue / 100)
        : group.totals.manualTax;
      return next;
    });
  }

  function contractPercentage(group, field) {
    const rows = group.rows || [];
    const base = rows.reduce(function (sum, row) { return sum + Math.abs(numberFrom(row, ['premiumMovement'])); }, 0);
    if (!base) return 0;
    const amountField = field === 'proportionCed' ? 'premiumCedant' : 'premiumRe';
    return Number((rows.reduce(function (sum, row) { return sum + Math.abs(numberFrom(row, [amountField])); }, 0) / base * 100).toFixed(2));
  }

  function renderContractEditor(group, groupKey) {
    const totals = group.totals || {};
    const sumCedant = totals.sumCedant !== undefined
      ? totals.sumCedant
      : (group.rows || []).reduce(function (sum, row) { return sum + numberFrom(row, ['sumInsuredCedant']); }, 0);
    const sumRe = totals.sumRe !== undefined
      ? totals.sumRe
      : (group.rows || []).reduce(function (sum, row) { return sum + numberFrom(row, ['sumInsuredRe']); }, 0);
    return (
      <div className="axx-rea-editor">
        <span className="axx-rea-editor-label">{t('Editar contrato')}</span>
        <label>{t('Pct. Retencion')}<InputNumber size="small" min={0} max={100} value={contractPercentage(group, 'proportionCed')} onChange={function (v) { editContractPercentage(groupKey, 'proportionCed', v); }} /></label>
        <label>{t('Suma retencion')}<InputNumber size="small" value={sumCedant} onChange={function (v) { distributeContractValue(groupKey, 'sumInsuredCedant', v); }} /></label>
        <label>{t('Prima retencion')}<InputNumber size="small" value={totals.cedant || 0} onChange={function (v) { distributeContractValue(groupKey, 'premiumCedant', v); }} /></label>
        <label>{t('Pct. Cedido')}<InputNumber size="small" min={0} max={100} value={contractPercentage(group, 'proportionRe')} onChange={function (v) { editContractPercentage(groupKey, 'proportionRe', v); }} /></label>
        <label>{t('Suma cedida')}<InputNumber size="small" value={sumRe} onChange={function (v) { distributeContractValue(groupKey, 'sumInsuredRe', v); }} /></label>
        <label>{t('Prima cedida')}<InputNumber size="small" value={totals.re || 0} onChange={function (v) { distributeContractValue(groupKey, 'premiumRe', v); }} /></label>
        <label>{t('Comision')}<InputNumber size="small" value={totals.commission || 0} onChange={function (v) { distributeContractValue(groupKey, 'commission', v); }} /></label>
        <label>{t('Impuesto')}<InputNumber size="small" value={totals.tax || 0} onChange={function (v) { distributeContractValue(groupKey, 'tax', v); }} /></label>
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
    if (!calc || !sim || !Array.isArray(sim.contracts) || !sim.contracts.length) {
      errors.push(t('Cotice el endoso antes de confirmar el reaseguro.'));
      return { ok: false, errors: errors };
    }

    const expectedPremium = money(Number(calc.billing && calc.billing.premium ? calc.billing.premium.after : 0)
      - Number(calc.billing && calc.billing.premium ? calc.billing.premium.before : 0));
    const distributedPremium = numberFrom(sim, ['movement']);
    if (!closeEnough(expectedPremium, distributedPremium)) {
      errors.push(t('La prima distribuida no coincide con la prima del endoso.') + ' ' + fmt(distributedPremium) + ' / ' + fmt(expectedPremium));
    }

    const coverageDistribution = {};
    (sim.contracts || []).forEach(function (group) {
      const groupName = t('Contrato') + ' ' + group.contractId + ' ' + t('linea') + ' ' + group.lineId;
      const rows = group.rows || [];
      const placementRows = rows.filter(function (row) {
        return Math.abs(finalCoveragePremium(group, row)) > 0.01 || Math.abs(finalCoverageSum(group, row)) > 0.01;
      });

      placementRows.forEach(function (row) {
        const code = String(row.coverageCode);
        const negativeFields = [
          numberFrom(row, ['premiumCedant']),
          numberFrom(row, ['premiumRe']),
          numberFrom(row, ['sumInsuredCedant']),
          numberFrom(row, ['sumInsuredRe'])
        ];
        if (negativeFields.some(function (value) { return value < -0.01; })) {
          errors.push(groupName + ': ' + t('la cobertura') + ' ' + code + ' ' + t('tiene importes negativos en su distribución.'));
        }
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
          : numberFrom(row, ['proportionCed']);
        const ceded = totals.distributionPercentageRe !== undefined
          ? Number(totals.distributionPercentageRe) / 100
          : numberFrom(row, ['proportionRe']);
        coverageDistribution[code].placement += retention + ceded;
        coverageDistribution[code].premium += numberFrom(row, ['premiumCedant']) + numberFrom(row, ['premiumRe']);
        coverageDistribution[code].sum += numberFrom(row, ['sumInsuredCedant']) + numberFrom(row, ['sumInsuredRe']);
      });

      const contract = (contractRows || []).find(function (item) {
        return String(item.contractId) === String(group.contractId);
      });
      const lineTotal = contract ? getDistributionRows(contract).find(function (item) {
        return String(item.groupKey) === String(group.contractId) + '-' + String(group.lineId);
      }) : null;
      const cededPremium = lineTotal ? Number(lineTotal.premium || 0) : sumField(rows, ['premiumRe']);
      const cededSum = lineTotal ? Number(lineTotal.sum || 0) : sumField(rows, ['sumInsuredRe']);
      const participants = getLineParticipants(group, lineTotal);
      if (cededPremium > 0.01 || cededSum > 0.01) {
        if (!participants.length) {
          errors.push(groupName + ': ' + t('un contrato cedido debe tener aceptantes distribuidos al 100%.'));
        } else {
          const split = sumField(participants, ['split']);
          if (Math.abs(split - 100) > 0.01) {
            errors.push(groupName + ': ' + t('los aceptantes de la linea') + ' ' + t('deben sumar 100%.'));
          }

          if (!closeEnough(sumField(participants, ['sumInsured']), cededSum)) {
            errors.push(groupName + ': ' + t('la suma de aceptantes no coincide con la suma cedida.'));
          }
          if (!closeEnough(sumField(participants, ['premium']), cededPremium)) {
            errors.push(groupName + ': ' + t('la prima de aceptantes no coincide con la prima cedida.'));
          }
          if (!closeEnough(sumField(participants, ['commission']), lineTotal ? lineTotal.commission : sumField(rows, ['commission']))) {
            errors.push(groupName + ': ' + t('la comision de aceptantes no coincide con la linea.'));
          }
          if (!closeEnough(sumField(participants, ['tax']), lineTotal ? lineTotal.tax : sumField(rows, ['tax']))) {
            errors.push(groupName + ': ' + t('el impuesto de aceptantes no coincide con la linea.'));
          }
        }
      }
    });

    // RET, Cuota Parte, FAC y las demas lineas son partes complementarias.
    // La colocacion del 100% se valida acumulada por cobertura, no por linea.
    Object.keys(coverageDistribution).forEach(function (code) {
      const item = coverageDistribution[code];
      if (!percentageCloseTo100(item.placement * 100)) {
        errors.push(t('La colocacion de la cobertura') + ' ' + code + ' ' + t('debe sumar 100%.'));
      }
      if (!closeEnough(item.premium + item.coinsurancePremium, item.expectedPremium)) {
        errors.push(t('La prima distribuida más coaseguro de la cobertura') + ' ' + code + ' ' + t('no coincide con el total emitido.')
          + ' ' + fmt(item.premium + item.coinsurancePremium) + ' / ' + fmt(item.expectedPremium));
      }
      if (!closeEnough(item.sum + item.coinsuranceSum, item.expectedSum)) {
        errors.push(t('La suma distribuida más coaseguro de la cobertura') + ' ' + code + ' ' + t('no coincide con el total emitido.')
          + ' ' + fmt(item.sum + item.coinsuranceSum) + ' / ' + fmt(item.expectedSum));
      }
    });

    // Cierre por contrato: el reaseguro usa el remanente y la fila de
    // coaseguro completa la diferencia hasta el total emitido.
    (contractRows || []).forEach(function (contract) {
      const rows = getDistributionRows(contract);
      const distributedSum = rows.reduce(function (sum, row) { return sum + Number(row.sum || 0); }, 0);
      const distributedPremium = rows.reduce(function (sum, row) { return sum + Number(row.premium || 0); }, 0);
      const distributedPercentage = rows.filter(function (row) { return !row.isCoinsurance; }).reduce(function (sum, row) {
        return sum + Number(row.percentage || 0);
      }, 0);
      if (Math.abs(distributedPercentage - 100) > 0.01) {
        errors.push(t('Contrato') + ' ' + contract.contractId + ': ' + t('la distribución debe sumar 100%.'));
      }
      if (!closeEnough(distributedSum, contract.sum)) {
        errors.push(t('La suma de la distribución más coaseguro del contrato') + ' ' + contract.contractId
          + ' ' + t('no coincide con el total emitido.') + ' ' + fmt(distributedSum) + ' / ' + fmt(contract.sum));
      }
      if (!closeEnough(distributedPremium, contract.movement)) {
        errors.push(t('La prima de la distribución más coaseguro del contrato') + ' ' + contract.contractId
          + ' ' + t('no coincide con el total emitido.') + ' ' + fmt(distributedPremium) + ' / ' + fmt(contract.movement));
      }
    });

    return { ok: errors.length === 0, errors: errors };
  }

  function readPolicyId() {
    const href = String(window.location.href || '').replace('#/', '');
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
    exe('RepoLifePolicy', { operation: 'GET', filter: 'id=' + id, include: ['Coverages', 'Product'], size: 1 })
      .then(function (r) {
        if (!r || !r.ok || !r.outData || !r.outData.length) {
          setLoading(false); setError(t('No se encontro la poliza') + ' ' + id); return null;
        }
        const p = r.outData[0];
        const cfgTableByLob = {
          '96': 'cfgCoberturaProductoReaTecnicos',
          '20': 'cfgCoberturaProductoReaVidaColectivo',
          '31': 'cfgCoberturaProductoReaVida',
          '52': 'cfgCoberturaProductoReaRiesgosVarios',
          '1': 'cfgCoberturaProductoRea',
          '6': 'cfgCoberturaProductoReaAuto',
          '81': 'cfgCoberturaProductoReaFianza',
          '82': 'cfgCoberturaProductoReaFianza',
          '83': 'cfgCoberturaProductoReaFianza',
          '84': 'cfgCoberturaProductoReaFianza'
        };
        const cfgTable = cfgTableByLob[txt(p.lob)] || 'cfgCoberturaProductoRea';
        return Promise.all([
          exe('GetFullTable', { table: cfgTable }),
          exe('RepoCurrency', { operation: 'GET', filter: "code='" + txt(p.currency).replace(/'/g, "''") + "'", size: 1 }),
          exe('RepoCession', { operation: 'GET', filter: 'lifePolicyId=' + id + ' AND overwritten=0', size: 0 }),
          exe('RepoCoCession', { operation: 'GET', filter: 'lifePolicyId=' + id + ' AND parentCoCession IS NULL AND overwritten=0', include: ['Contact'], size: 0 })
            .catch(function () { return { outData: [] }; }),
          exe('LoadEntities', {
            entity: 'Contact',
            fields: 'id, name, middlename, surname1, surname2, isPerson',
            filter: "exists (select 1 from contactRole r where r.contactId = contact.id and r.role = 'REI')"
          }).catch(function () { return { outData: [] }; }),
          exe('LoadEntities', {
            entity: 'Contact',
            fields: 'id, name, middlename, surname1, surname2, isPerson',
            filter: "exists (select 1 from contactRole r where r.contactId = contact.id and r.role = 'RIN')"
          }).catch(function () { return { outData: [] }; }),
          exe('LoadEntities', {
            entity: 'Contact',
            fields: 'id, name, middlename, surname1, surname2, isPerson',
            filter: "exists (select 1 from contactRole r where r.contactId = contact.id and r.role = 'COI')"
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
              ? [item.name, item.middlename || item.middleName, item.surname1, item.surname2].filter(Boolean).join(' ').trim()
              : String(item.surname2 || item.name || '').trim();
            return { id: Number(item.id), name: name };
          }).filter(function (item) { return item.id > 0 && item.name; }));
          const reinsurerRows = (responses[5] && responses[5].outData) || [];
          setReinsuranceContacts(reinsurerRows.map(function (item) {
            const name = item.isPerson
              ? [item.name, item.middlename || item.middleName, item.surname1, item.surname2].filter(Boolean).join(' ').trim()
              : String(item.surname2 || item.name || '').trim();
            return { id: Number(item.id), name: name };
          }).filter(function (item) { return item.id > 0 && item.name; }));
          const coinsurerRows = (responses[6] && responses[6].outData) || [];
          setCoinsuranceContacts(coinsurerRows.map(function (item) {
            const name = item.isPerson
              ? [item.name, item.middlename || item.middleName, item.surname1, item.surname2].filter(Boolean).join(' ').trim()
              : String(item.surname2 || item.name || '').trim();
            return { id: Number(item.id), name: name };
          }).filter(function (item) { return item.id > 0 && item.name; }));
          setPolicy(Object.assign({}, p, { Currency: currency || p.Currency }));
          loadReaHist(p.id);
          setLoading(false);
          let rows = (tr && tr.outData) || [];
          if (typeof rows === 'string') rows = JSON.parse(rows);
          const cfg = {};
          const headers = Array.isArray(rows[0]) ? rows[0] : [];
          const changeableIndex = headers.findIndex(function (header) {
            return txt(header).toLowerCase() === 'changeable';
          });
          for (let i = 1; i < rows.length; i++) {
            if (txt(rows[i][1]) !== txt(p.productCode)) continue;
            const changeableValue = changeableIndex >= 0 ? rows[i][changeableIndex] : true;
            cfg[txt(rows[i][3])] = {
              principal: txt(rows[i][7]), parent: txt(rows[i][8]),
              sums: txt(rows[i][5]).toUpperCase() === 'SI',
              // Legacy tables without the column remain editable by default.
              changeable: String(changeableValue).trim().toLowerCase() !== 'false'
            };
          }
          // Todas las coberturas de la poliza son endosables; la principal se propone primero.
          const list = [];
          const covs = p.Coverages || [];
          for (let i = 0; i < covs.length; i++) {
            const c = txt(covs[i].code);
            const row = cfg[c];
            list.push({
              code: c, name: covs[i].name, end: covs[i].end, start: covs[i].start,
              premium: covs[i].premium, limit: covs[i].limit,
              principal: !!(row && row.principal === '-1'),
              sums: !!(row && row.sums),
              changeable: !row || row.changeable !== false
            });
          }
          list.sort(function (a, b) { return (b.principal ? 1 : 0) - (a.principal ? 1 : 0); });
          setEligible(list);
          const sumEligible = list.filter(function (item) { return money(item.limit) > 0 && item.changeable !== false; });
          setCovCode(sumEligible.length ? sumEligible[0].code : null);
          setCoverageInputs({});
          setEffectiveDate(moment());
          setPayPlanPreview([]);
          return null;
        });
      })
      .catch(function (e) { setLoading(false); setError(String(e)); });
  }

  async function loadPayPlanSnapshot(id) {
    const response = await exe('RepoPayPlan', {
      operation: 'GET',
      filter: 'lifePolicyId=' + Number(id) + ' AND cancellationDate IS NULL',
      include: ['PayPlanDetail'],
      size: 0
    });
    if (!response || !response.ok) {
      throw new Error((response && response.msg) || t('No se pudo consultar el plan de pagos actual'));
    }
    return Array.isArray(response.outData) ? response.outData : [];
  }

  function buildNativePayPlan(oldPayPlan, difference, effectiveDate, lifePolicyId) {
    const rows = Array.isArray(oldPayPlan)
      ? oldPayPlan.map(function (item) { return Object.assign({}, item); })
      : [];
    let remainingCents = Math.round(money(difference) * 100);
    if (!remainingCents) return rows;

    // Una cuota parcialmente pagada sigue participando. Su importe puede
    // crecer, pero nunca puede quedar por debajo de lo ya pagado.
    let candidates = rows.map(function (row, index) {
      const amount = Math.round(Number(row.minimum !== undefined ? row.minimum : row.expected || 0) * 100);
      const paid = Math.round(Number(row.payed !== undefined ? row.payed : row.paid || 0) * 100);
      return { row: row, index: index, amount: amount, paid: paid, weight: Math.max(amount, 1) };
    }).filter(function (item) {
      return !item.row.cancellationDate && item.amount > item.paid;
    });

    // Para un descuento, las cuotas que alcanzan su mínimo pagado se sacan
    // de la distribución y el remanente se reparte entre las demás.
    while (candidates.length && remainingCents) {
      const initialRemaining = remainingCents;
      const totalWeight = candidates.reduce(function (sum, item) { return sum + item.weight; }, 0);
      let applied = 0;
      const nextCandidates = [];

      candidates.forEach(function (item, index) {
        const portion = index === candidates.length - 1
          ? initialRemaining - applied
          : Math.round(initialRemaining * item.weight / totalWeight);
        const nextAmount = item.amount + portion;
        const limitedAmount = initialRemaining < 0 ? Math.max(item.paid, nextAmount) : nextAmount;
        const actualPortion = limitedAmount - item.amount;
        item.amount = limitedAmount;
        item.row.minimum = money(limitedAmount / 100);
        item.row.expected = money(limitedAmount / 100);
        applied += actualPortion;
        if (initialRemaining >= 0 || item.amount > item.paid) nextCandidates.push(item);
      });

      remainingCents -= applied;
      if (!applied) break;
      candidates = nextCandidates;
    }

    // Sin cuotas con saldo pendiente, o si un descuento ya agotó todos los
    // saldos disponibles, el remanente se registra como cuota de ajuste.
    if (!remainingCents) return rows;

    const last = rows[rows.length - 1] || {};
    const lastNumber = rows.reduce(function (max, item) {
      return Math.max(max, Number(item && item.numberInYear || 0));
    }, 0);
    const contractYear = rows.reduce(function (max, item) {
      return Math.max(max, Number(item && item.contractYear || 0));
    }, 0) || 1;

    rows.push(Object.assign({}, last, {
      id: 0,
      lifePolicyId: Number(lifePolicyId),
      concept: 'Prima',
      expected: money(remainingCents / 100),
      minimum: money(remainingCents / 100),
      payed: 0,
      payedDate: null,
      transferId: null,
      dueDate: effectiveDate,
      coveredUntil: effectiveDate,
      allocationDate: null,
      contractYear: contractYear,
      final: false,
      finalDate: null,
      numberInYear: lastNumber + 1,
      allocationId: null,
      cancellationDate: null,
      compensationDate: null,
      created: null,
      normalDueDate: effectiveDate,
      changeId: null,
      PayPlanDetail: null
    }));
    return rows;
  }

  // Abierta desde el menu no llega ?policyId=: se busca por numero o por codigo de poliza.
  function buscar() {
    const v = txt(buscarPoliza);
    if (!v) { setError(t('Indique el numero o el codigo de la poliza')); return; }
    invalidate(); setPolicy(null); setEligible([]); setCovCode(null); setCoverageInputs({}); setEffectiveDate(null);
    if (/^[0-9]+$/.test(v)) { setPolicyId(Number(v)); loadPolicy(Number(v)); return; }
    setLoading(true); setError(null);
    exe('RepoLifePolicy', { operation: 'GET', filter: "code='" + v.replace(/'/g, "''") + "'", size: 1 })
      .then(function (r) {
        setLoading(false);
        if (!r || !r.ok || !r.outData || !r.outData.length) { setError(t('No se encontro la poliza') + ' ' + v); return; }
        setPolicyId(r.outData[0].id);
        loadPolicy(r.outData[0].id);
      })
      .catch(function (e) { setLoading(false); setError(String(e)); });
  }

  function retornarAPoliza() {
    if (!policyId) return;
    window.location.hash = '#/lifepolicy/' + policyId;
  }

  useEffect(function () {
    const id = readPolicyId();
    setPolicyId(id);
    loadPolicy(id);
  }, []);

  // el alto de la grilla se mide en cada render: .ant-table-pagination no existe hasta que hay filas
  useEffect(function () {
    const root = document.querySelector('.axx299');
    if (!root) return;
    const body = root.querySelector('.ant-table-body');
    if (!body) return;
    const disponible = window.innerHeight - body.getBoundingClientRect().top - 90;
    if (disponible > 120 && Math.abs(disponible - altoGrilla) > 4) setAltoGrilla(Math.round(disponible));
  });

  const sumEditableRows = (eligible || []).filter(function (item) {
    return money(item.limit) > 0 && item.changeable !== false;
  });

  function updateCoverageInput(code, field, value, currentSum) {
    setCoverageInputs(function (current) {
      const next = Object.assign({}, current);
      const key = txt(code);
      if (value === null || value === undefined || value === '') {
        next[key] = { difference: null, final: null };
        return next;
      }
      const amount = Number(value);
      if (!Number.isFinite(amount)) return current;
      next[key] = field === 'difference'
        ? { difference: amount, final: money(Number(currentSum || 0) + amount) }
        : { difference: money(amount - Number(currentSum || 0)), final: amount };
      return next;
    });
    invalidate();
  }

  // la distribucion en memoria se invalida en cuanto cambia el calculo o la poliza
  function invalidate() {
    setCalc(null); setSim(null); setResult(null); setKey(null); setSplits([]); setPayPlanPreview([]);
    setReinsurersReady(false); setReinsuranceConfirmed(false); setSelectedReinsuranceLineKey(null); setReaDetailTab('distribution');
  }

  // Los aceptantes se editan sobre la simulacion actual, sin volver a cargar datos obsoletos.
  function editarSplit(cessionId, contactId, value, targetGroupKey) {
    if (!sim) return;
    setReinsuranceConfirmed(false);
    setSim(function (current) {
      const next = JSON.parse(JSON.stringify(current));
      (next.contracts || []).forEach(function (group) {
        const groupKey = String(group.contractId) + '-' + String(group.lineId);
        if (targetGroupKey && groupKey !== targetGroupKey) return;
        const participants = group.participants || [];
        const brokerId = participants.length ? participants[0].brokerId : null;
        const matches = participants.filter(function (item) {
          return String(item.contactId) === String(contactId)
            && String(item.brokerId || '') === String(brokerId || '');
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
            && String(item.brokerId || '') === String(brokerId || '');
        }).forEach(function (participant) {
          const row = (group.rows || []).find(function (item) {
            return String(item.coverageCode) === participantCoverageCode(group, participant);
          });
          const split = (Number(participant.split) || 0) / 100;
          participant.sumInsured = money((row ? numberFrom(row, ['sumInsuredRe']) : numberFrom(group.totals, ['sumRe'])) * split);
          participant.premium = money((row ? numberFrom(row, ['premiumRe']) : numberFrom(group.totals, ['re'])) * split);
          participant.commission = money((row ? numberFrom(row, ['commission']) : numberFrom(group.totals, ['commission'])) * split);
          participant.tax = money((row ? numberFrom(row, ['tax']) : numberFrom(group.totals, ['tax'])) * split);
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
        const groupKey = String(group.contractId) + '-' + String(group.lineId);
        if (row._groupKey && groupKey !== row._groupKey) return;
        const matches = (group.participants || []).filter(function (item) {
          return String(item.contactId) === String(row.contactId)
            && String(item.brokerId || '') === String(row.brokerId || '');
        });
        if (field === 'contactId' || field === 'brokerId') {
          matches.forEach(function (participant) {
            participant[field] = value;
            if (field === 'contactId') {
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
        const groupKey = String(group.contractId) + '-' + String(group.lineId);
        if (row._groupKey && groupKey !== row._groupKey) return;
        group.participants = (group.participants || []).filter(function (item) {
          return !(String(item.contactId) === String(row.contactId)
            && String(item.brokerId || '') === String(row.brokerId || ''));
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
        return String(item.contractId) + '-' + String(item.lineId)
          === String(group.contractId) + '-' + String(group.lineId);
      });
      if (!target) return next;
      target.participants = target.participants || [];
      (target.rows || []).forEach(function (row, index) {
        target.participants.push({
          id: 'new-' + Date.now() + '-' + index,
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
      const message = validation.errors.join(' ');
      setError(message);
      setTab('rea');
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
    A.message.success(t('La distribución de aceptantes cuadra y fue guardada correctamente.'));
  }

  function redistributeParticipantRounding(group) {
    const fields = [
      { participant: 'sumInsured', line: 'sumInsuredRe' },
      { participant: 'premium', line: 'premiumRe' },
      { participant: 'commission', line: 'commission' },
      { participant: 'tax', line: 'tax' }
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
    return contact && contact.name ? contact.name : (fallback || contactDirectory[String(id)] || '');
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

  function getLineParticipants(group, lineTotal) {
    const grouped = {};
    (group.participants || []).forEach(function (participant) {
      const participantKey = String(participant.contactId || '') + '|' + String(participant.brokerId || '');
      if (!grouped[participantKey]) {
        grouped[participantKey] = Object.assign({}, participant, {
          _groupKey: String(group.contractId) + '-' + String(group.lineId),
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
        return String(item.contactId || '') + '|' + String(item.brokerId || '') === participantKey;
      });
      participant.sumInsured = money(sourceParticipants.reduce(function (sum, item) {
        return sum + numberFrom(item, ['sumInsured']);
      }, 0));
      participant.premium = money(sourceParticipants.reduce(function (sum, item) {
        return sum + numberFrom(item, ['premium']);
      }, 0));
      participant.commission = money(sourceParticipants.reduce(function (sum, item) {
        return sum + numberFrom(item, ['commission']);
      }, 0));
      participant.tax = money(sourceParticipants.reduce(function (sum, item) {
        return sum + numberFrom(item, ['tax']);
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
    const result = Object.keys(grouped).map(function (participantKey) { return grouped[participantKey]; });
    if (!lineTotal || !result.length) return result;

    // Una línea puede contener cesiones espejo por cada cobertura. La pestaña
    // de aceptantes representa la línea completa, por lo que debe repartir el
    // importe mostrado una sola vez y no sumar cada cesión espejo.
    const splitTotal = result.reduce(function (sum, participant) {
      return sum + Math.max(0, Number(participant.split || 0));
    }, 0);
    if (!(splitTotal > 0)) return result;
    const fields = [
      { target: Number(lineTotal.sum || 0), name: 'sumInsured' },
      { target: Number(lineTotal.premium || 0), name: 'premium' },
      { target: Number(lineTotal.commission || 0), name: 'commission' },
      { target: Number(lineTotal.tax || 0), name: 'tax' }
    ];
    fields.forEach(function (field) {
      let assigned = 0;
      result.forEach(function (participant, index) {
        const value = index === result.length - 1
          ? money(field.target - assigned)
          : money(field.target * Math.max(0, Number(participant.split || 0)) / splitTotal);
        participant[field.name] = value;
        assigned = money(assigned + value);
      });
    });
    return result;
  }

  function getCoverageParticipants(group, coverageCode) {
    const grouped = {};
    (group.participants || []).filter(function (participant) {
      return participantCoverageCode(group, participant) === String(coverageCode || '');
    }).forEach(function (participant) {
      const participantKey = String(participant.contactId || '') + '|' + String(participant.brokerId || '');
      if (!grouped[participantKey]) {
        grouped[participantKey] = Object.assign({}, participant, {
          _groupKey: String(group.contractId) + '-' + String(group.lineId),
          split: Number(participant.split || 0),
          sumInsured: 0,
          premium: 0,
          commission: 0,
          tax: 0
        });
      }
      grouped[participantKey].sumInsured += numberFrom(participant, ['sumInsured']);
      grouped[participantKey].premium += numberFrom(participant, ['premium']);
      grouped[participantKey].commission += numberFrom(participant, ['commission']);
      grouped[participantKey].tax += numberFrom(participant, ['tax']);
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
    const retention = rows.reduce(function (sum, row) { return sum + numberFrom(row, ['premiumCedant']); }, 0);
    const ceded = rows.reduce(function (sum, row) { return sum + numberFrom(row, ['premiumRe']); }, 0);
    const total = retention + ceded;
    if (total > 0) {
      return {
        ced: Number((retention / total * 100).toFixed(4)),
        re: Number((ceded / total * 100).toFixed(4))
      };
    }
    return {
      ced: contractPercentage(group, 'proportionCed'),
      re: contractPercentage(group, 'proportionRe')
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
      return sum + numberFrom(cession, ['premiumRe']);
    }, 0);
    const baseCommission = baseRows.reduce(function (sum, cession) {
      return sum + numberFrom(cession, ['commission', 'comissionCedant']);
    }, 0);
    const baseTax = baseRows.reduce(function (sum, cession) {
      return sum + numberFrom(cession, ['tax']);
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
      participant.sumInsured = money(numberFrom(row || group.totals, row ? ['sumInsuredRe'] : ['sumRe']) * split);
      participant.premium = money(numberFrom(row || group.totals, row ? ['premiumRe'] : ['re']) * split);
      participant.commission = money(numberFrom(row || group.totals, row ? ['commission'] : ['commission']) * split);
      participant.tax = money(numberFrom(row || group.totals, row ? ['tax'] : ['tax']) * split);
    });
    return group;
  }

  // ------------------------------------------------------------- pestania 1
  function prepararNuevasCoberturas(result) {
    const adjustment = money(Number(surcharge || 0) - Number(discount || 0));
    const quote = result && result.quote;
    let coverages = [];
    try {
      coverages = JSON.parse(quote && quote.jNewCoverages ? quote.jNewCoverages : '[]');
    } catch (e) {
      throw new Error(t('El cálculo no devolvió coberturas nuevas válidas'));
    }
    if (!Array.isArray(coverages) || !coverages.length) {
      throw new Error(t('El cálculo no devolvió coberturas nuevas'));
    }

    const rowsByCode = {};
    (result.rows || []).forEach(function (row) { rowsByCode[txt(row.code)] = row; });
    const expectedPremium = Number(result.billing && result.billing.premium ? result.billing.premium.after : 0);
    const changedCodes = (result.coverageCodes || [result.coverageCode]).map(function (code) { return txt(code); });
    const adjustmentCode = txt(result.adjustmentCoverageCode || changedCodes[0]);
    // El recargo/descuento pertenece a la primera cobertura modificada, igual
    // que antes pertenecía a la única cobertura seleccionable.
    const adjustmentToAllocate = adjustment;
    let allocated = 0;

    coverages.forEach(function (coverage) {
      const code = txt(coverage.code);
      const selected = changedCodes.indexOf(code) >= 0;
      const share = code === adjustmentCode ? adjustmentToAllocate : 0;
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
      throw new Error(t('La distribución del recargo o descuento no coincide con la prima final calculada'));
    }

    quote.jNewCoverages = JSON.stringify(coverages);
    result.finalCoverages = coverages;
    result.coverageAdjustmentApplied = adjustmentToAllocate;
    return result;
  }

  // La cotizacion nativa deja una fila de impuesto deshabilitada y sin endoso por cada
  // simulacion. Se retira antes y despues de cotizar, igual que en el endoso de vigencia.
  async function limpiarResiduoCotizacion() {
    const response = await exe('LoadEntities', {
      entity: 'TaxGenerated',
      fields: 'id',
      filter: 'lifePolicyId=' + Number(policyId) + " AND action='ChangeCoverage' AND changeId IS NULL AND disabled=1",
      noTracking: true
    });
    const rows = response && Array.isArray(response.outData) ? response.outData : [];
    for (let i = 0; i < rows.length; i++) {
      await exe('RepoTaxGenerated', { operation: 'DELETE', entity: { id: Number(rows[i].id) } });
    }
  }


  // AXX-2420 / GLOBUAT-270 (3.2, 5.2): el reaseguro vigente y su historial se consultan durante todo el endoso.
  function reaHistNum(v) { const n = Number(v); return isFinite(n) ? n : 0; }
  function reaHistMoney(v) { return reaHistNum(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function reaHistDay(v) { return v ? String(v).slice(0, 10) : ''; }
  function reaHistChangeLabel(change) {
    if (!change) return 'Emisión';
    let additional = {};
    try { additional = JSON.parse(change.jAdditional || '{}') || {}; } catch (e) { additional = {}; }
    const type = String(additional.endorsementType || '').toUpperCase();
    const byType = {
      PROCEEDORDER: 'Orden de proceder',
      CHANGE_COVERAGE_SURETY: 'Cambio de cobertura de fianza (vigencia)',
      CHANGE_INSURED_SUM_SURETY: 'Cambio de suma asegurada'
    };
    const byDiscriminator = {
      LoadingChange: 'Recargo / Descuento',
      CapitalChange: 'Cambio de suma asegurada',
      InsuredObjectChange: 'Cambio de objeto asegurado',
      CoverageChange: 'Cambio de cobertura',
      BeneficiaryChange: 'Cambio de beneficiario',
      CessionBeneficiaryChange: 'Cambio de acreedor',
      TermChange: 'Cambio de vigencia'
    };
    const label = byType[type] || byDiscriminator[change.discriminator || change.Discriminator] || String(change.discriminator || change.Discriminator || 'Endoso');
    return 'Endoso ' + (change.code || change.id) + ' — ' + label;
  }
  function loadReaHist(pid) {
    const id = Number(pid || 0);
    if (!id) return;
    setReaHist(function (prev) { return Object.assign({}, prev, { policyId: id, loading: true, error: '' }); });
    Promise.all([
      exe('RepoCession', { operation: 'GET', filter: 'lifePolicyId=' + id, size: 0 }),
      exe('LoadEntities', { entity: 'Change', fields: 'id, code, discriminator, effectiveDate, status, jAdditional', filter: 'lifePolicyId=' + id, noTracking: true })
    ]).then(function (responses) {
      const cessions = (responses[0] && responses[0].outData) || [];
      const changes = {};
      ((responses[1] && responses[1].outData) || []).forEach(function (change) { changes[String(change.id)] = change; });
      if (responses[0] && responses[0].ok === false) throw new Error(responses[0].msg || 'RepoCession');
      setReaHist({ policyId: id, loading: false, rows: cessions, changes: changes, error: '' });
    }).catch(function (e) {
      setReaHist({ policyId: id, loading: false, rows: [], changes: {}, error: String(e && e.message ? e.message : e) });
    });
  }
  function renderReaHist() {
    const Table = A.Table;
    const Alert = A.Alert;
    const Spin = A.Spin;
    const Tag = A.Tag;
    const Button = A.Button;
    const rows = reaHist.rows || [];
    const moneyCol = function (title, field) {
      return { title: title, dataIndex: field, key: field, align: 'right', render: function (v) { return reaHistMoney(v); } };
    };
    const vigentes = rows.filter(function (r) { return !r.overwritten; });
    const vigentesTotal = vigentes.reduce(function (acc, r) {
      acc.premium += reaHistNum(r.premium); acc.premiumCedant += reaHistNum(r.premiumCedant); acc.premiumRe += reaHistNum(r.premiumRe);
      return acc;
    }, { premium: 0, premiumCedant: 0, premiumRe: 0 });
    const vigentesRows = vigentes.map(function (r) {
      return Object.assign({ key: 'v' + r.id, movement: reaHistChangeLabel(reaHist.changes[String(r.changeId)]) }, r);
    });
    vigentesRows.push({ key: 'vtotal', coverageCode: 'TOTAL', contractId: '', lineId: '', movement: '',
      sumInsured: null, sumInsuredCedant: null, sumInsuredRe: null,
      premium: vigentesTotal.premium, premiumCedant: vigentesTotal.premiumCedant, premiumRe: vigentesTotal.premiumRe });
    const groups = {};
    const order = [];
    rows.slice().sort(function (a, b) { return reaHistNum(a.id) - reaHistNum(b.id); }).forEach(function (r) {
      const k = r.changeId ? String(r.changeId) : 'E';
      if (!groups[k]) { groups[k] = { key: 'm' + k, changeId: r.changeId || null, rows: 0, sumInsured: 0, sumInsuredCedant: 0, sumInsuredRe: 0, premium: 0, premiumCedant: 0, premiumRe: 0, coverages: {} }; order.push(k); }
      const g = groups[k];
      g.rows += 1;
      g.sumInsured += reaHistNum(r.sumInsured); g.sumInsuredCedant += reaHistNum(r.sumInsuredCedant); g.sumInsuredRe += reaHistNum(r.sumInsuredRe);
      g.premium += reaHistNum(r.premium); g.premiumCedant += reaHistNum(r.premiumCedant); g.premiumRe += reaHistNum(r.premiumRe);
      g.coverages[String(r.coverageCode)] = true;
    });
    const movementRows = order.map(function (k) {
      const g = groups[k];
      const change = g.changeId ? reaHist.changes[String(g.changeId)] : null;
      return Object.assign({}, g, {
        movement: reaHistChangeLabel(change),
        effectiveDate: change ? reaHistDay(change.effectiveDate) : '',
        coverageList: Object.keys(g.coverages).join(', ')
      });
    });
    const historyRows = rows.slice().sort(function (a, b) { return reaHistNum(a.id) - reaHistNum(b.id); }).map(function (r) {
      return Object.assign({ key: 'h' + r.id, movement: reaHistChangeLabel(reaHist.changes[String(r.changeId)]) }, r);
    });
    const colsVigente = [
      { title: t('Cobertura'), dataIndex: 'coverageCode', key: 'coverageCode', width: 90 },
      { title: t('Contrato'), dataIndex: 'contractId', key: 'contractId', width: 80 },
      { title: t('Linea'), dataIndex: 'lineId', key: 'lineId', width: 80 },
      { title: t('Origen'), dataIndex: 'movement', key: 'movement' },
      { title: t('Suma asegurada'), dataIndex: 'sumInsured', key: 'sumInsured', align: 'right', render: function (v) { return v === null ? '' : reaHistMoney(v); } },
      { title: t('Suma retenida'), dataIndex: 'sumInsuredCedant', key: 'sumInsuredCedant', align: 'right', render: function (v) { return v === null ? '' : reaHistMoney(v); } },
      { title: t('Suma cedida'), dataIndex: 'sumInsuredRe', key: 'sumInsuredRe', align: 'right', render: function (v) { return v === null ? '' : reaHistMoney(v); } },
      moneyCol(t('Prima'), 'premium'), moneyCol(t('Prima retenida'), 'premiumCedant'), moneyCol(t('Prima cedida'), 'premiumRe')
    ];
    const colsMovimiento = [
      { title: t('Movimiento'), dataIndex: 'movement', key: 'movement' },
      { title: t('Fecha efectiva'), dataIndex: 'effectiveDate', key: 'effectiveDate', width: 110 },
      { title: t('Coberturas'), dataIndex: 'coverageList', key: 'coverageList', width: 120 },
      { title: t('Filas'), dataIndex: 'rows', key: 'rows', width: 60, align: 'right' },
      moneyCol(t('Suma neta'), 'sumInsured'), moneyCol(t('Retenida neta'), 'sumInsuredCedant'), moneyCol(t('Cedida neta'), 'sumInsuredRe'),
      moneyCol(t('Prima neta'), 'premium'), moneyCol(t('Prima retenida neta'), 'premiumCedant'), moneyCol(t('Prima cedida neta'), 'premiumRe')
    ];
    const colsHistorial = [
      { title: t('Id'), dataIndex: 'id', key: 'id', width: 80 },
      { title: t('Movimiento'), dataIndex: 'movement', key: 'movement' },
      { title: t('Cobertura'), dataIndex: 'coverageCode', key: 'coverageCode', width: 80 },
      { title: t('Contrato'), dataIndex: 'contractId', key: 'contractId', width: 70 },
      { title: t('Tipo'), dataIndex: 'premiumType', key: 'premiumType', width: 110 },
      { title: t('Estado'), dataIndex: 'overwritten', key: 'overwritten', width: 100, render: function (v) { return v ? <Tag>{t('Histórico')}</Tag> : <Tag color="blue">{t('Vigente')}</Tag>; } },
      moneyCol(t('Suma'), 'sumInsured'), moneyCol(t('Retenida'), 'sumInsuredCedant'), moneyCol(t('Cedida'), 'sumInsuredRe'),
      moneyCol(t('Prima'), 'premium'), moneyCol(t('Prima ret.'), 'premiumCedant'), moneyCol(t('Prima ced.'), 'premiumRe')
    ];
    return (
      <Spin spinning={!!reaHist.loading}>
        <div style={{ marginBottom: 8 }}>
          <Button size="small" onClick={function () { loadReaHist(reaHist.policyId); }} disabled={!reaHist.policyId}>{t('Actualizar consulta')}</Button>
        </div>
        {reaHist.error ? <Alert type="error" showIcon message={reaHist.error} /> : null}
        <Alert type="info" showIcon style={{ marginBottom: 8 }}
          message={t('Cada cobertura de la fianza tiene su propia cesión con su propia suma: la suma del reaseguro de un movimiento es la de la cobertura endosada, no la suma de todas las coberturas.')} />
        <h4 style={{ margin: '8px 0 4px' }}>{t('Reaseguro vigente por cobertura')}</h4>
        <Table size="small" pagination={false} rowKey="key" dataSource={vigentesRows} columns={colsVigente} scroll={{ x: true }} />
        <h4 style={{ margin: '12px 0 4px' }}>{t('Reaseguro por movimiento (neto de cada endoso)')}</h4>
        <Table size="small" pagination={false} rowKey="key" dataSource={movementRows} columns={colsMovimiento} scroll={{ x: true }} />
      </Spin>
    );
  }

  async function calcular() {
    setError(null); setResult(null);
    setReinsuranceConfirmed(false);
    const oldCoverages = Array.isArray(policy && policy.Coverages) ? policy.Coverages : [];
    let changes = [];
    for (let i = 0; i < sumEditableRows.length; i++) {
      const item = sumEditableRows[i];
      const input = coverageInputs[txt(item.code)] || {};
      const amount = Number(input.final);
      if (input.final === null || input.final === undefined || input.final === '') continue;
      if (!Number.isFinite(amount)) {
        setError(t('Indique un monto válido para la cobertura') + ' ' + item.code);
        return;
      }
      const oldSum = money(item.limit);
      const newSum = money(amount);
      if (!(oldSum > 0)) continue;
      if (!(newSum > 0)) {
        setError(t('La nueva suma asegurada de la cobertura debe ser mayor que cero') + ' (' + item.code + ')');
        return;
      }
      if (newSum === oldSum) continue;
      const policyCoverage = oldCoverages.find(function (coverage) { return txt(coverage.code) === txt(item.code); }) || item;
      changes.push({ code: txt(item.code), item: item, coverage: policyCoverage, oldSum: oldSum, newSum: newSum });
    }
    if (!changes.length) { setError(t('Indique al menos una nueva suma asegurada diferente de la actual')); return; }
    if (!effectiveDate) { setError(t('Indique la fecha efectiva del endoso')); return; }
    const effective = moment(effectiveDate).format('YYYY-MM-DD');
    const policyStart = day10(policy && policy.start);
    if (policyStart && effective < policyStart) { setError(t('La fecha efectiva no puede ser anterior al inicio de la póliza') + ' (' + policyStart + ')'); return; }
    for (let i = 0; i < changes.length; i++) {
      const coverageStart = day10(changes[i].coverage.start);
      const coverageEnd = day10(changes[i].coverage.end);
      if (effective > coverageEnd) {
        setError(t('La fecha efectiva no puede ser posterior al fin de la cobertura') + ' (' + changes[i].code + ': ' + coverageEnd + ')');
        return;
      }
      if (effective < coverageStart) {
        setError(t('La fecha efectiva no puede ser anterior al inicio de la cobertura') + ' (' + changes[i].code + ': ' + coverageStart + ')');
        return;
      }
    }

    const calculationVersion = ++requestVersion.calculation;
    // Invalida tambien cualquier simulacion iniciada con el calculo anterior.
    ++requestVersion.simulation;
    setLoading(true);
    setCalc(null);
    setSim(null);
    setSimLoading(false);
    setPayPlanPreview([]);
    try {
      const utc = function (value) { return Date.parse(value + 'T00:00:00Z'); };
      await limpiarResiduoCotizacion();
      const newCoverages = JSON.parse(JSON.stringify(oldCoverages));
      const adjustment = money(Number(surcharge || 0) - Number(discount || 0));

      // This endorsement uses surety tariffs only to resolve the final insured
      // sums. Premiums remain calculated below from the issued premium and
      // each coverage's own proration.
      const directChangesByCode = {};
      const coverageSumOverrides = {};
      changes.forEach(function (change) {
        directChangesByCode[change.code] = change;
        coverageSumOverrides[change.code] = change.newSum;
      });
      const tariffPolicy = JSON.parse(JSON.stringify(policy));
      tariffPolicy.action = 'ChangeCoverage';
      (tariffPolicy.Coverages || []).forEach(function (coverage) {
        const direct = directChangesByCode[txt(coverage.code)];
        if (direct) {
          coverage.limit = direct.newSum;
          coverage.startLimit = direct.newSum;
        }
      });
      const tariffResponse = await exe('ExeChain', {
        chain: 'cmdCalculatePremiumSuretyBond',
        context: JSON.stringify({
          poliza: tariffPolicy,
          action: 'ChangeCoverage',
          extra: { jAdditional: JSON.stringify({ endorsementType: 'CHANGE_INSURED_SUM_SURETY' }) },
          coverageSumOverrides: coverageSumOverrides
        })
      });
      if (!tariffResponse || tariffResponse.ok === false) {
        throw new Error(t('No se pudo cotizar las sumas de las coberturas de fianza') + ': ' + cleanMessage(tariffResponse));
      }
      let tariffRows = tariffResponse.outData;
      if (typeof tariffRows === 'string') {
        try { tariffRows = JSON.parse(tariffRows); } catch (e) { tariffRows = []; }
      }
      if (!Array.isArray(tariffRows) && tariffRows && Array.isArray(tariffRows.data)) tariffRows = tariffRows.data;
      if (Array.isArray(tariffRows) && tariffRows.length === 1 && Array.isArray(tariffRows[0])) tariffRows = tariffRows[0];
      if (!Array.isArray(tariffRows)) {
        throw new Error(t('La cotización de fianza no devolvió las coberturas calculadas'));
      }
      tariffRows.forEach(function (tariffRow) {
        if (!tariffRow || tariffRow.tariffApplied !== true) return;
        const code = txt(tariffRow.code);
        const coverage = oldCoverages.find(function (item) { return txt(item.code) === code; });
        const newSum = money(tariffRow.limit);
        if (!coverage || !(newSum > 0)) return;
        const oldSum = money(coverage.limit === undefined ? coverage.sumInsured : coverage.limit);
        if (!(oldSum > 0)) return;
        const tariffStart = day10(tariffRow.fini);
        const tariffEnd = day10(tariffRow.ffin);
        const coverageDates = tariffStart && tariffEnd && utc(tariffEnd) > utc(tariffStart)
          ? Object.assign({}, coverage, { start: tariffRow.fini, end: tariffRow.ffin })
          : coverage;
        if (directChangesByCode[code]) {
          directChangesByCode[code].newSum = newSum;
          directChangesByCode[code].coverage = coverageDates;
        } else if (newSum !== oldSum) {
          changes.push({ code: code, item: coverage, coverage: coverageDates, oldSum: oldSum, newSum: newSum, derivedByTariff: true });
        }
      });

      const provisionalRows = [];
      for (let i = 0; i < changes.length; i++) {
        const change = changes[i];
        const target = newCoverages.find(function (coverage) { return txt(coverage.code) === change.code; });
        if (!target) throw new Error(t('La cobertura seleccionada no está en la póliza') + ' (' + change.code + ')');
        const covStart = day10(change.coverage.start);
        const covEnd = day10(change.coverage.end);
        const durationDays = Math.round((utc(covEnd) - utc(covStart)) / 86400000);
        if (!(durationDays > 0)) throw new Error(t('La vigencia actual de la cobertura es inválida') + ' (' + change.code + ')');
        const fromDate = effective > covStart ? effective : covStart;
        const remainingDays = Math.max(0, Math.round((utc(covEnd) - utc(fromDate)) / 86400000));
        const prorate = Math.min(1, remainingDays / durationDays);
        const oldPremium = money(change.coverage.premium === null || change.coverage.premium === undefined
          ? Number(change.coverage.basePremium || 0) + Number(change.coverage.extraPremium || 0)
          : change.coverage.premium);
        const proportionalPremium = money(oldPremium * change.newSum / change.oldSum);
        const rawDelta = money((proportionalPremium - oldPremium) * prorate);
        const share = i === 0 ? adjustment : 0;
        const proratedPremium = money(oldPremium + rawDelta);
        const newPremium = money(proratedPremium + share);
        if (newPremium < 0) throw new Error(t('El ajuste dejaría la prima de la cobertura en negativo') + ' (' + change.code + ')');
        target.limit = change.newSum;
        target.startLimit = change.newSum;
        target.start = change.coverage.start;
        target.end = change.coverage.end;
        target.premium = newPremium;
        target.basePremium = money(Number(target.basePremium === null || target.basePremium === undefined ? oldPremium : target.basePremium) + rawDelta + share);
        provisionalRows.push({
          code: change.code, name: target.name, reason: 'SELECTED', oldSum: change.oldSum, newSum: change.newSum,
          sumInsuredMovement: money(change.newSum - change.oldSum), oldStart: change.coverage.start, newStart: change.coverage.start,
          oldEnd: change.coverage.end, newEnd: change.coverage.end, oldPremium: oldPremium,
          proportionalPremium: proportionalPremium, proratedPremium: proratedPremium, newPremium: newPremium,
          adjustedPremium: newPremium, variation: money(rawDelta + share), proratedVariation: rawDelta,
          remainingDays: remainingDays, durationDays: durationDays, prorate: prorate,
          surcharge: i === 0 ? Number(surcharge || 0) : 0, discount: i === 0 ? Number(discount || 0) : 0,
          adjustment: share
        });
      }
      const quoteInput = {
        policyId: policyId,
        jOldCoverages: JSON.stringify(oldCoverages),
        jNewCoverages: JSON.stringify(newCoverages),
        effectiveDate: effective + 'T12:00:00',
        // The policy calculation chain receives this through pol.jChangeDto.
        // It needs the edited sums to evaluate dependent surety tariffs.
        jAdditional: JSON.stringify({
          endorsementType: 'CHANGE_INSURED_SUM_SURETY',
          coverageSumOverrides: coverageSumOverrides
        })
      };
      const response = await exe('ChangeCoverage', quoteInput);
      if (calculationVersion !== requestVersion.calculation) return;
      if (!response || !response.ok || !response.outData) {
        throw new Error(t('El motor de cálculo nativo rechazó la cotización') + ': ' + String((response && response.msg) || '').replace(/formula ->[\s\S]*/, '').trim());
      }
      await limpiarResiduoCotizacion();
      const quoted = Array.isArray(response.outData) ? response.outData[0] : response.outData;
      const bill = quoted.Bill || {};
      const diff = quoted.BillDiff || {};
      let quotedCovs = JSON.parse(quoted.jNewCoverages || '[]');
      // Algunos motores devuelven únicamente las coberturas recalculadas.
      // Completamos la respuesta con las vigentes para que toda la vista
      // trabaje siempre sobre el estado final íntegro de la póliza.
      const quotedByCode = {};
      quotedCovs.forEach(function (coverage) { quotedByCode[txt(coverage.code)] = coverage; });
      quotedCovs = oldCoverages.map(function (coverage) {
        return Object.assign({}, coverage, quotedByCode[txt(coverage.code)] || {});
      });
      for (let i = 0; i < quotedCovs.length; i++) {
        const changed = changes.find(function (item) { return item.code === txt(quotedCovs[i].code); });
        if (changed) {
          quotedCovs[i].limit = changed.newSum;
          quotedCovs[i].startLimit = changed.newSum;
          quotedCovs[i].start = changed.coverage.start;
          quotedCovs[i].end = changed.coverage.end;
        }
      }
      quoted.jNewCoverages = JSON.stringify(quotedCovs);

      const prevPremium = money(policy.anualPremium === null || policy.anualPremium === undefined ? policy.annualPremium : policy.anualPremium);
      const prevTax = money(policy.tax);
      const prevFee = money(policy.fee);
      const prevTotal = money(policy.anualTotal === null || policy.anualTotal === undefined ? policy.annualTotal : policy.anualTotal);
      // El Bill nativo YA lleva los ajustes dentro, porque viajaron en la prima de la cobertura.
      const finalPremium = money(bill.anualPremium === null || bill.anualPremium === undefined ? bill.annualPremium : bill.anualPremium);
      const finalTax = money(bill.tax);
      const finalFee = money(bill.fee);
      const finalTotal = money(bill.annualTotal === null || bill.annualTotal === undefined ? bill.anualTotal : bill.annualTotal);
      const taxRate = finalPremium === 0 ? 0 : finalTax / finalPremium;
      const calcPremium = money(finalPremium - adjustment);
      const calcTax = money(calcPremium * taxRate);
      const detail = JSON.parse(quoted.jDetail || '{}');
      const detailCovs = Array.isArray(detail.Coverages) ? detail.Coverages : [];
      const proratedCosts = {};
      for (let k = 0; k < detailCovs.length; k++) {
        proratedCosts[txt(detailCovs[k].code)] = money(detailCovs[k].premiumCost);
      }
      const changedRows = provisionalRows.map(function (row) {
        const quotedCoverage = quotedCovs.find(function (coverage) { return txt(coverage.code) === row.code; });
        if (quotedCoverage) {
          row.newPremium = money(quotedCoverage.premium);
          row.adjustedPremium = row.newPremium;
          row.variation = money(row.newPremium - row.oldPremium);
        }
        row.prorated = proratedCosts[row.code] || 0;
        return row;
      });
      // El motor cotiza el conjunto completo de coberturas. Conservamos las
      // filas modificadas para ejecutar el endoso, pero mostramos y simulamos
      // el estado final de todas, incluso las que no tienen suma o prima.
      const changedByCode = {};
      changedRows.forEach(function (row) { changedByCode[txt(row.code)] = row; });
      const sumsByCode = {};
      (eligible || []).forEach(function (coverage) { sumsByCode[txt(coverage.code)] = coverage.sums === true; });
      const rows = quotedCovs.map(function (coverage) {
        const code = txt(coverage.code);
        const changed = changedByCode[code];
        if (changed) {
          changed.sums = sumsByCode[code] === true;
          return changed;
        }
        const previous = oldCoverages.find(function (item) { return txt(item.code) === code; }) || {};
        const oldSum = money(previous.limit === undefined ? previous.sumInsured : previous.limit);
        const oldPremium = money(previous.premium === null || previous.premium === undefined
          ? Number(previous.basePremium || 0) + Number(previous.extraPremium || 0)
          : previous.premium);
        const newSum = money(coverage.limit === undefined ? coverage.sumInsured : coverage.limit);
        const newPremium = money(coverage.premium === null || coverage.premium === undefined
          ? Number(coverage.basePremium || 0) + Number(coverage.extraPremium || 0)
          : coverage.premium);
        return {
          code: code, name: coverage.name || previous.name || code, reason: 'UNCHANGED', sums: sumsByCode[code] === true,
          oldSum: oldSum, newSum: newSum, sumInsuredMovement: 0,
          oldStart: previous.start, newStart: coverage.start || previous.start,
          oldEnd: previous.end, newEnd: coverage.end || previous.end,
          oldPremium: oldPremium, proportionalPremium: newPremium,
          proratedPremium: 0, prorated: 0, newPremium: newPremium,
          adjustedPremium: newPremium, variation: 0,
          remainingDays: 0, durationDays: 0, prorate: 0
        };
      });
      let result = {
        ok: true,
        persisted: false,
        policyId: policyId,
        policyCode: policy.code,
        currency: policy.currency,
        coverageCode: changes.map(function (item) { return item.code; }).join(', '),
        coverageCodes: changes.map(function (item) { return item.code; }),
        adjustmentCoverageCode: changes[0].code,
        sumMode: 'FINAL_OR_DIFFERENCE',
        direction: changes.reduce(function (sum, item) { return sum + item.newSum - item.oldSum; }, 0) >= 0 ? 'INCREASE' : 'DECREASE',
        effectiveDate: effective + 'T12:00:00',
        rows: rows,
        changedRows: changedRows,
        billing: {
          premium: { before: prevPremium, calculated: calcPremium, after: finalPremium },
          adjustments: { before: 0, calculated: 0, after: adjustment },
          fee: { before: prevFee, calculated: finalFee, after: finalFee },
          tax: { before: prevTax, calculated: calcTax, after: finalTax },
          total: { before: prevTotal, calculated: money(calcPremium + calcTax + finalFee), after: finalTotal },
          movement: {
            premium: money(diff.annualPremium === null || diff.annualPremium === undefined ? diff.coverages : diff.annualPremium),
            tax: money(diff.tax),
            fee: money(diff.fee),
            total: money(diff.annualTotal),
            prorated: money(detail.coveragesCost),
            sum: money(changes.reduce(function (sum, item) { return sum + item.newSum - item.oldSum; }, 0))
          },
          currency: policy.currency,
          adjustmentUnit: 'CURRENCY_AMOUNT'
        },
        quote: quoted,
        quoteInput: quoteInput
      };
      result = prepararNuevasCoberturas(result);

      // Vista previa de cuotas: el plan vigente mas la cuota del endoso, como se enviara al ejecutar.
      const oldPayPlan = await loadPayPlanSnapshot(policyId);
      if (calculationVersion !== requestVersion.calculation) return;
      const oldPayPlanTotal = oldPayPlan.reduce(function (total, item) {
        return total + Number(item && (item.minimum !== undefined ? item.minimum : item.expected) || 0);
      }, 0);
      const newPayPlan = buildNativePayPlan(oldPayPlan, finalTotal - oldPayPlanTotal, effective + 'T12:00:00', policyId);
      const oldAmountsById = {};
      oldPayPlan.forEach(function (item) {
        oldAmountsById[String(item.id)] = money(item.minimum !== undefined ? item.minimum : item.expected);
      });
      setPayPlanPreview(newPayPlan.map(function (item, index) {
        const amount = money(item.minimum !== undefined ? item.minimum : item.expected);
        const currentAmount = Number(item.id || 0) ? oldAmountsById[String(item.id)] : 0;
        return {
          key: String(item.id || 'new') + '-' + index,
          number: item.numberInYear || index + 1,
          currentAmount: currentAmount,
          amount: amount,
          difference: money(amount - Number(currentAmount || 0)),
          paid: item.payed !== undefined ? item.payed : item.paid,
          dueDate: item.dueDate || item.normalDueDate,
          isNew: !Number(item.id || 0)
        };
      }));
      setCalc(result);
      setKey('AXX1978-' + policyId + '-' + changes.map(function (item) { return item.code; }).join('-') + '-' + moment().format('YYYYMMDDHHmmss'));
      setLoading(false);
    } catch (e) {
      if (calculationVersion !== requestVersion.calculation) return;
      setLoading(false);
      setError(String(e && e.message ? e.message : e));
    }
  }

  // Recargo y descuento invalidan el calculo, pero conservan los aceptantes capturados.
  function onAjuste(kind, value) {
    const v = value === null || value === undefined ? 0 : Number(value);
    if (kind === 'surcharge') setSurcharge(v); else setDiscount(v);
    // El resultado vigente fue calculado con otro ajuste. Limpiarlo impide que
    // el efecto de reaseguro simule nuevamente con esa prima anterior.
    ++requestVersion.calculation;
    ++requestVersion.simulation;
    setCalc(null);
    setSim(null);
    setLoading(false);
    setSimLoading(false);
    setReinsurersReady(false);
    setSelectedReinsuranceLineKey(null);
    setReinsuranceConfirmed(false);
  }

  // ------------------------------------------------------------- pestania 2
  function simular() {
    if (!calc) { setError(t('Calcule el endoso antes de simular el reaseguro')); return; }
    const simulationVersion = ++requestVersion.simulation;
    const calculationSnapshot = calc;
    setReinsuranceConfirmed(false);
    setReinsurersReady(false);
    setSelectedReinsuranceLineKey(null);
    setReaDetailTab('distribution');
    setSimLoading(true); setError(null);
    const rows = [];
    for (let i = 0; i < calculationSnapshot.rows.length; i++) {
      // variation contiene la prima final del movimiento, incluyendo recargos
      // o descuentos. El prorrateado se conserva solo como referencia.
      rows.push({
        code: calculationSnapshot.rows[i].code,
        variation: calculationSnapshot.rows[i].variation,
        prorated: calculationSnapshot.rows[i].prorated,
        sumInsuredMovement: calculationSnapshot.rows[i].sumInsuredMovement || 0,
        finalPremium: calculationSnapshot.rows[i].adjustedPremium,
        finalSum: calculationSnapshot.rows[i].newSum
      });
    }
    exe('ExeChain', {
      chain: 'cmdSimReaChangeCoverage',
      context: JSON.stringify({ policyId: policyId, rows: rows, participants: splits, finalStateOnly: true })
    })
      .then(function (r) {
        if (simulationVersion !== requestVersion.simulation) return;
        setSimLoading(false);
        if (!r || !r.ok) { setError(String((r && r.msg) || '').replace(/formula ->[\s\S]*/, '').trim()); return; }
        let o = r.outData;
        if (typeof o === 'string') o = JSON.parse(o);
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
          ? exe('LoadEntities', {
            entity: 'Contact',
            fields: 'id, name, middlename, surname1, surname2, isPerson',
            filter: 'id in (' + uniqueContactIds.join(',') + ')'
          }).catch(function () { return { outData: [] }; })
          : Promise.resolve({ outData: [] });
        loadNames.then(function (contacts) {
          if (simulationVersion !== requestVersion.simulation) return;
          const directory = {};
          ((contacts && contacts.outData) || []).forEach(function (contact) {
            const name = contact.isPerson
              ? [contact.name, contact.middlename || contact.middleName, contact.surname1, contact.surname2].filter(Boolean).join(' ').trim()
              : String(contact.surname2 || contact.name || '').trim();
            if (name) directory[String(contact.id)] = name;
          });
          setContactDirectory(directory);
          setSim(o);
          setSelectedReinsuranceKey(o && o.contracts && o.contracts.length ? String(o.contracts[0].contractId) : null);
        });
      })
      .catch(function (e) {
        if (simulationVersion !== requestVersion.simulation) return;
        setSimLoading(false);
        setError(String(e));
      });
  }

  // Tambien cuando una edicion invalida la distribucion: sin `sim` en las dependencias, editar
  // o agregar un aceptante limpiaba la simulacion y nadie la volvia a pedir.
  useEffect(function () {
    if (calc && !sim && !simLoading) simular();
  }, [tab, calc, sim, splits]);

  // ------------------------------------------------------------- ejecucion
  function confirmarReaseguro() {
    if (simLoading) {
      A.message.info(t('La distribución de reaseguro todavía se está cargando.'));
      return;
    }
    if (!sim) {
      A.message.error(t('La distribución de reaseguro todavía no está cargada.'));
      return;
    }
    const validation = validateReinsuranceDistribution();
    if (!validation.ok) {
      const message = validation.errors.join(' ');
      setError(message);
      setTab('rea');
      A.message.error(message);
      setReinsuranceConfirmed(false);
      return;
    }
    setError(null);
    setReinsuranceConfirmed(true);
    A.message.success(t('El reaseguro está validado y todo está en orden.'));
  }

  async function ejecutar() {
    if (lock.busy || running) return;
    if (!txt(note)) { setNoteTouched(true); return; }
    const distributionValidation = validateReinsuranceDistribution();
    if (!distributionValidation.ok) {
      setError(distributionValidation.errors.join(' '));
      return;
    }

    lock.busy = true;
    setRunning(true); setError(null); setModal(false);
    const failures = [];
    let keepExecutionLocked = false;
    const cleanMessage = function (response) {
      return String((response && response.msg) || '').replace(/formula ->[\s\S]*/, '').trim();
    };
    const dateAtNoon = function (value) {
      const date = day10(value);
      return date ? date + 'T12:00:00' : '';
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
    const reinsuranceSnapshot = {
      distribution: [],
      participants: [],
      coinsurance: [],
      sourceCessionIds: (baseCessions || []).map(function (cession) {
        return Number(cession.id || 0);
      }).filter(function (id) { return id > 0; }),
      sourceCoinsuranceIds: (coinsuranceCessions || []).map(function (cession) {
        return Number(cession.id || 0);
      }).filter(function (id) { return id > 0; })
    };
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
      jOldPayPlan: null,
      jNewPayPlan: null,
      newStart: dateAtNoon((calc.changedRows || calc.rows)[0] && (calc.changedRows || calc.rows)[0].newStart),
      newEnd: dateAtNoon((calc.changedRows || calc.rows)[0] && (calc.changedRows || calc.rows)[0].newEnd),
      effectiveDate: dateAtNoon(calc.effectiveDate),
      note: txt(note),
      operation: 'ADD',
      code: null,
      jAdditional: JSON.stringify({
        endorsementType: 'CHANGE_INSURED_SUM_SURETY',
        endorsementSubtype: 'CHANGE_COVERAGE_SUM',
        coverageCode: calc.coverageCode,
        oldSum: (calc.changedRows || calc.rows).reduce(function (sum, row) { return sum + Number(row.oldSum || 0); }, 0),
        newSum: (calc.changedRows || calc.rows).reduce(function (sum, row) { return sum + Number(row.newSum || 0); }, 0),
        changes: (calc.changedRows || calc.rows).map(function (row) {
          return { code: row.code, oldSum: row.oldSum, newSum: row.newSum, variation: row.variation };
        }),
        sumMode: calc.sumMode,
        surcharge: Number(surcharge || 0),
        discount: Number(discount || 0),
        premium: calc.billing && calc.billing.premium ? calc.billing.premium.after : 0,
        tax: calc.billing && calc.billing.tax ? calc.billing.tax.after : 0,
        total: calc.billing && calc.billing.total ? calc.billing.total.after : 0,
        reinsuranceFinalStateOnly: true,
        reinsuranceSnapshot: reinsuranceSnapshot
      })
    };

    const generateEndorsementDocument = async function (endorsementChangeId) {
      const response = await exe('ExeChain', {
        chain: 'cmdGenertFormatoEmdoso',
        context: JSON.stringify({ changeId: Number(endorsementChangeId) })
      });
      const data = response && response.outData;
      if (!response || !response.ok || (data && data.ok === false)) {
        throw new Error((data && data.msg) || (response && response.msg) || t('No se pudo generar el documento del endoso'));
      }
    };

    const runReinsuranceMode = async function (endorsementChangeId, mode) {
      const response = await exe('ExeChain', {
        chain: 'cmdApplyReaChangeCoverage',
        context: JSON.stringify({ changeId: Number(endorsementChangeId), mode: mode })
      });
      let data = response && response.outData;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (parseError) { data = null; }
      }
      if (Array.isArray(data) && data.length === 1) data = data[0];
      if (!response || response.ok === false || (data && data.ok === false)) {
        throw new Error((data && data.msg) || (response && response.msg) || t('No se pudo procesar el reaseguro del endoso'));
      }
      return data || response;
    };

    let changeId = 0;
    let reinsurancePrepared = false;
    let reinsuranceExecuted = false;
    try {
      const oldPayPlan = await loadPayPlanSnapshot(policyId);
      payload.jOldPayPlan = JSON.stringify(oldPayPlan);
      const oldTotal = oldPayPlan.reduce(function (total, item) {
        return total + Number(item && (item.minimum !== undefined ? item.minimum : item.expected) || 0);
      }, 0);
      const newTotal = calc && calc.billing && calc.billing.total
        ? Number(calc.billing.total.after || 0)
        : oldTotal;
      payload.jNewPayPlan = JSON.stringify(buildNativePayPlan(
        oldPayPlan,
        newTotal - oldTotal,
        dateAtNoon(calc.effectiveDate),
        policyId
      ));
      const createdResponse = await exe('ChangeCoverage', payload);
      if (!createdResponse || !createdResponse.ok || !createdResponse.outData || !createdResponse.outData.id) {
        throw new Error(t('El endoso no pudo ser creado') + ': ' + cleanMessage(createdResponse));
      }
      const created = Array.isArray(createdResponse.outData) ? createdResponse.outData[0] : createdResponse.outData;
      changeId = Number(created.id || 0);
      setKey(String(changeId));
      let processId = Number(created.processId || 0);
      if (!processId) {
        const changeEntity = await exe('LoadEntity', { entity: 'Change', fields: 'id,processId', filter: 'id=' + changeId, noTracking: true });
        const loadedChange = changeEntity && changeEntity.outData ? changeEntity.outData : {};
        processId = Number(loadedChange.processId || 0);
      }
      if (!processId) throw new Error(t('No se pudo determinar el workflow del endoso'));
      const workflow = await exe('GotoStep', { procesoId: processId, estado: 'APROVED' });
      const workflowResponse = Array.isArray(workflow) ? (workflow[0] || {}) : workflow;
      if (!workflowResponse || !workflowResponse.ok) throw new Error(t('No se pudo aprobar el workflow del endoso') + ': ' + cleanMessage(workflowResponse));

      if (reinsuranceSnapshot.distribution.length) {
        reinsurancePrepared = true;
        await runReinsuranceMode(changeId, 'PREPARE_EXECUTION');
      }

      const executed = await exe('ExeChangeCoverage', { changeId: changeId, exeNow: true, operation: 'EXECUTE', noTracking: true });
      if (!executed || !executed.ok) {
        throw new Error(t('El endoso fue creado pero no pudo ejecutarse') + ': ' + cleanMessage(executed));
      }
      reinsuranceExecuted = true;

      // Once the endorsement is effective, refresh the policy insured sum
      // from the final coverages generated by the quotation.
      try {
        const insuredSumUpdate = await exe('ExeChain', {
          chain: 'cmdUpdateInsuredSumQuotation',
          context: JSON.stringify({ policyId: policyId })
        });
        let updateData = insuredSumUpdate && insuredSumUpdate.outData;
        if (typeof updateData === 'string') {
          try { updateData = JSON.parse(updateData); } catch (parseError) { updateData = null; }
        }
        if (Array.isArray(updateData) && updateData.length === 1) updateData = updateData[0];
        if (!insuredSumUpdate || insuredSumUpdate.ok === false || (updateData && updateData.ok === false)) {
          failures.push(t('actualización de la suma asegurada') + ': ' + String((updateData && updateData.msg) || (insuredSumUpdate && insuredSumUpdate.msg) || ''));
        }
      } catch (insuredSumError) {
        failures.push(t('actualización de la suma asegurada') + ': ' + String(insuredSumError && insuredSumError.message ? insuredSumError.message : insuredSumError));
      }

      // ExeChangeCoverage con exeNow no sincroniza las cuotas. Se actualizan
      // las existentes distribuidas y, solo si queda un remanente, se agrega
      // una cuota de ajuste.
      try {
        const plannedRows = JSON.parse(payload.jNewPayPlan || '[]');
        const oldRowsById = {};
        oldPayPlan.forEach(function (item) { oldRowsById[String(item.id)] = item; });
        for (let i = 0; i < plannedRows.length; i++) {
          const planned = plannedRows[i];
          const current = oldRowsById[String(planned && planned.id)];
          if (!current || !Number(current.id) || current.cancellationDate) continue;
          const before = money(current.minimum !== undefined ? current.minimum : current.expected);
          const after = money(planned.minimum !== undefined ? planned.minimum : planned.expected);
          const paid = money(current.payed !== undefined ? current.payed : current.paid);
          if (after < paid) {
            throw new Error(t('La distribución intentó reducir una cuota por debajo de lo ya pagado'));
          }
          if (before === after) continue;
          const update = await exe('SetField', {
            entity: 'PayPlan',
            entityId: Number(current.id),
            fieldValue: 'expected=' + after.toFixed(2) + ',minimum=' + after.toFixed(2),
            raw: true
          });
          if (!update || !update.ok) {
            throw new Error((update && update.msg) || t('No se pudo actualizar una cuota distribuida'));
          }
        }

        const endorsementInstallments = plannedRows.filter(function (item) {
          return !Number(item && item.id || 0);
        }).map(function (item) {
          // Un remanente no distribuible conserva el detalle de prima e impuesto.
          const installmentAmount = money(item.minimum !== undefined ? item.minimum : item.expected);
          const movementTax = calc && calc.billing && calc.billing.tax ? money(calc.billing.tax.after - calc.billing.tax.before) : 0;
          const detailTax = Math.abs(movementTax) <= Math.abs(installmentAmount) ? movementTax : 0;
          const detailConcept = 'Detalle de cuota #' + (item.numberInYear || '');
          return Object.assign({}, item, { changeId: changeId, PayPlanDetail: [
            { amount: money(installmentAmount - detailTax), concept: detailConcept, detail: 'Prima Cobertura', order: 1, paid: 0 },
            { amount: detailTax, concept: detailConcept, detail: 'Impuesto de Seguros', order: 2, paid: 0 }
          ] });
        });
        if (endorsementInstallments.length) {
          const payPlanResponse = await exe('MakePayPlan', {
            policyId: policyId,
            Change: {
              id: changeId,
              lifePolicyId: policyId,
              effectiveDate: payload.effectiveDate,
              jNewPayPlan: JSON.stringify(endorsementInstallments)
            },
            policy: {
              id: policyId,
              payerId: policy.payerId,
              holderId: policy.holderId,
              contractYear: policy.contractYear,
              currency: policy.currency
            }
          });
          if (!payPlanResponse || !payPlanResponse.ok) {
            failures.push(t('cuota del endoso') + ': ' + cleanMessage(payPlanResponse));
          }
        }
      } catch (payPlanError) {
        failures.push(t('cuota del endoso') + ': ' + String(payPlanError && payPlanError.message ? payPlanError.message : payPlanError));
      }

      // El cambio de suma no modifica la vigencia de la poliza.

      // AXX-2420 (4, 7): la grilla de tarifas del objeto asegurado (SA de la cobertura), la suma afianzada y la suma
      // asegurada de la poliza (cobertura principal) quedan iguales al limite que el endoso dejo en la cobertura.
      try {
        const synced = await exe('ExeChain', { chain: 'cmdUpdateInsuredObjectData', context: JSON.stringify({ policyId: policyId, syncSums: true }) });
        const syncData = synced && synced.outData;
        if (!synced || !synced.ok || !syncData || syncData.ok === false) {
          failures.push(t('sincronizacion del objeto asegurado') + ': ' + String((syncData && syncData.msg) || (synced && synced.msg) || ''));
        }
      } catch (syncError) {
        failures.push(t('sincronizacion del objeto asegurado') + ': ' + String(syncError && syncError.message ? syncError.message : syncError));
      }

      try {
        await generateEndorsementDocument(changeId);
      } catch (documentError) {
        failures.push(t('documento del endoso') + ': ' + String(documentError && documentError.message ? documentError.message : documentError));
      }

      const message = failures.length
        ? t('El endoso se ejecutó correctamente, pero hubo problemas en: ') + failures.join(' | ')
        : t('El endoso se ejecutó correctamente y la póliza fue actualizada.');
      setResult({ ok: true, changeId: changeId, msg: message });
      if (failures.length) A.message.warning(message); else A.message.success(message);
      setSim(null);
      keepExecutionLocked = true;
      await new Promise(function (resolve) { setTimeout(resolve, 700); });
      retornarAPoliza();
    } catch (e) {
      if (reinsurancePrepared && !reinsuranceExecuted && changeId) {
        try {
          await runReinsuranceMode(changeId, 'ROLLBACK');
        } catch (rollbackError) {
          failures.push(t('restauración del reaseguro anterior') + ': ' + String(rollbackError && rollbackError.message ? rollbackError.message : rollbackError));
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
    { title: t('Codigo'), dataIndex: 'code', width: 55 },
    { title: t('Nombre'), dataIndex: 'name', width: 170, ellipsis: true, render: function (value) {
      const name = txt(value);
      return <Tooltip title={name}><span className="axx-ellipsis-cell">{name}</span></Tooltip>;
    } },
    { title: t('Suma'), dataIndex: 'sums', align: 'center', width: 50, render: function (value) {
      return value ? <Tag color="green">{t('Sí')}</Tag> : <Tag>{t('No')}</Tag>;
    } },
    { title: t('Estado'), dataIndex: 'reason', width: 95, render: function (v) { return v === 'SELECTED' ? <Tag color="blue">{t('Modificada')}</Tag> : <Tag color="green">{t('Sin modificación')}</Tag>; } },
    { title: t('Suma anterior'), dataIndex: 'oldSum', align: 'right', width: 95, render: function (v) { return <span className="axx-antes">{fmt(v)}</span>; } },
    { title: t('Nueva suma'), dataIndex: 'newSum', align: 'right', width: 95, render: function (v) { return <span className="axx-nuevo">{fmt(v)}</span>; } },
    { title: t('Prima anterior'), dataIndex: 'oldPremium', align: 'right', width: 80, render: function (v) { return <span className="axx-antes">{fmt(v)}</span>; } },
    { title: t('Prima proporcional'), dataIndex: 'proportionalPremium', align: 'right', width: 95, render: function (v) { return fmt(v); } },
    { title: t('Prorrata'), dataIndex: 'prorate', align: 'right', width: 80, render: function (v, row) { return row.reason === 'UNCHANGED' ? '-' : row.remainingDays + ' / ' + row.durationDays + ' ' + t('dias'); } },
    { title: t('Nueva prima'), dataIndex: 'newPremium', align: 'right', width: 80, render: function (v) { return <span className="axx-nuevo">{fmt(v)}</span>; } },
    { title: t('Variacion'), dataIndex: 'variation', align: 'right', width: 70, render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } },
    { title: t('Vigencia inicial'), dataIndex: 'oldStart', width: 85, render: function (v) { return day10(v); } },
    { title: t('Vigencia final'), dataIndex: 'oldEnd', width: 85, render: function (v) { return day10(v); } }
  ];

  const colsCuotas = [
    { title: t('No. cuota'), dataIndex: 'number', width: 110, align: 'center' },
    { title: t('Importe actual'), dataIndex: 'currentAmount', width: 150, align: 'right', render: function (v) { return <span className="axx-antes">{fmt(v)}</span>; } },
    { title: t('Importe con endoso'), dataIndex: 'amount', width: 170, align: 'right', render: function (v, row) { return <span className={row.isNew ? 'axx-nuevo' : ''}>{fmt(v)}</span>; } },
    { title: t('Diferencia'), dataIndex: 'difference', width: 140, align: 'right', render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } },
    { title: t('Pagado'), dataIndex: 'paid', width: 130, align: 'right', render: function (v) { return fmt(v); } },
    { title: t('Fecha de vencimiento'), dataIndex: 'dueDate', width: 170, align: 'center', render: function (v, row) { return <span className={row.isNew ? 'axx-nuevo' : ''}>{day10(v)}</span>; } },
    { title: t('Movimiento'), dataIndex: 'isNew', width: 150, render: function (v) { return v ? <Tag color="blue">{t('Cuota del endoso')}</Tag> : <Tag>{t('Vigente')}</Tag>; } }
  ];

  const colsResumen = [
    { title: t('Concepto'), dataIndex: 'label' },
    { title: t('Anterior'), dataIndex: 'before', align: 'right', render: function (v) { return <span className="axx-antes">{fmt(v)}</span>; } },
    { title: t('Calculado'), dataIndex: 'calculated', align: 'right', render: function (v) { return fmt(v); } },
    { title: t('Nuevo'), dataIndex: 'after', align: 'right', render: function (v) { return <span className="axx-nuevo">{fmt(v)}</span>; } }
  ];

  const filasResumen = calc ? [
    // Calculado representa la porción del endoso. La prima base no incluye
    // el ajuste, que se muestra por separado en la fila Ajustes.
    { key: 'p', label: t('Prima'), before: calc.billing.premium.before, calculated: calc.billing.premium.calculated - calc.billing.premium.before, after: calc.billing.premium.calculated },
    { key: 'a', label: t('Ajustes'), before: calc.billing.adjustments.before, calculated: calc.billing.adjustments.after - calc.billing.adjustments.before, after: calc.billing.adjustments.after },
    { key: 'g', label: t('Gasto'), before: calc.billing.fee.before, calculated: calc.billing.fee.after - calc.billing.fee.before, after: calc.billing.fee.after },
    { key: 'i', label: t('Impuesto'), before: calc.billing.tax.before, calculated: calc.billing.tax.after - calc.billing.tax.before, after: calc.billing.tax.after },
    { key: 'T', label: t('Total'), before: calc.billing.total.before, calculated: calc.billing.total.after - calc.billing.total.before, after: calc.billing.total.after }
  ] : [];

  const colsAceptantes = [
    { title: t('Corredor de reaseguro'), dataIndex: 'brokerId', width: 170, render: function (v, row) {
      return <Select size="small" value={v || undefined} placeholder={t('Seleccione')} style={{ width: 150 }}
        onChange={function (x) { editarAceptanteCampo(row, 'brokerId', x); }}>
        {(row.brokerOptions || []).map(function (option) {
          return <Select.Option key={String(option.value)} value={option.value}>{option.label}</Select.Option>;
        })}
      </Select>;
    } },
    { title: t('Reasegurador'), dataIndex: 'contactId', width: 420, render: function (v, row) {
      return <Select size="small" value={v || undefined} style={{ width: 400 }} dropdownMatchSelectWidth={false}
        dropdownStyle={{ minWidth: 420 }}
        onChange={function (x) { editarAceptanteCampo(row, 'contactId', x); }}>
        {(row.reinsurerOptions || []).map(function (option) {
          return <Select.Option key={String(option.value)} value={option.value}>{option.label}</Select.Option>;
        })}
      </Select>;
    } },
    { title: t('Linea'), dataIndex: 'lineId', width: 130 },
    {
      title: t('Participacion %'), dataIndex: 'split', width: 150, render: function (v, row) {
        return <EditableFormattedNumber value={v} decimals={4} onCommit={function (x) {
          editarSplit(row.cessionId, row.contactId, x, row._groupKey);
        }} />;
      }
    },
    { title: t('Suma cedida'), dataIndex: 'sumInsured', align: 'right', width: 130, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={2} onCommit={function (x) { editarAceptanteCampo(row, 'sumInsured', x); }} />;
    } },
    { title: t('Prima cedida'), dataIndex: 'premium', align: 'right', width: 130, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={2} onCommit={function (x) { editarAceptanteCampo(row, 'premium', x); }} />;
    } },
    { title: t('Comision'), dataIndex: 'commission', align: 'right', width: 120, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={2} onCommit={function (x) { editarAceptanteCampo(row, 'commission', x); }} />;
    } },
    { title: t('Impuesto'), dataIndex: 'tax', align: 'right', width: 120, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={2} onCommit={function (x) { editarAceptanteCampo(row, 'tax', x); }} />;
    } },
    { title: t('Acciones'), width: 100, render: function (_, row) {
      return <Button type="link" danger size="small" onClick={function () { eliminarAceptante(row); }}>{t('Eliminar')}</Button>;
    } }
  ];

  const colsCoberturaAceptantes = [
    { title: t('Corredor de reaseguro'), dataIndex: 'brokerName', width: 170, render: function (v, row) {
      return contactDirectory[String(row.brokerId)] || v || row.Broker && row.Broker.name || row.brokerName || '-';
    } },
    { title: t('Reasegurador'), dataIndex: 'name', width: 170, render: function (v, row) {
      return contactDirectory[String(row.contactId)] || v || row.contactName || row.contactId || '-';
    } },
    { title: t('Participacion %'), dataIndex: 'split', align: 'right', width: 130, render: function (v) {
      return Number(v || 0).toFixed(4) + '%';
    } },
    { title: t('Suma cedida'), dataIndex: 'sumInsured', align: 'right', width: 130, render: function (v) { return fmt(v); } },
    { title: t('Prima cedida'), dataIndex: 'premium', align: 'right', width: 130, render: function (v) { return fmt(v); } },
    { title: t('Comision'), dataIndex: 'commission', align: 'right', width: 120, render: function (v) { return fmt(v); } },
    { title: t('Impuesto'), dataIndex: 'tax', align: 'right', width: 120, render: function (v) { return fmt(v); } }
  ];

  function renderCoinsuranceTab() {
    if (!calc) return <Empty description={t('Calcule el endoso para visualizar el coaseguro')} />;
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
        key: cession.id || String(cession.contactId) + '-' + index,
        name: (catalogContact && catalogContact.name)
          || (cession.Contact && (cession.Contact.name || cession.Contact.description)) || String(cession.contactId || '-'),
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
      key: 'company', name: t('Compañía'), leader: Number(policy && policy.coinsurance) === 1,
      percentage: companyPercentage, sum: money(base.sum * companyPercentage / 100),
      premium: money(base.premium * companyPercentage / 100), commission: 0, tax: 0
    };
    const displayRows = rows.concat([company]);
    const columns = [
      { title: t('Coasegurador'), dataIndex: 'name' },
      { title: t('Lider'), dataIndex: 'leader', align: 'center', render: function (v) { return v ? t('Si') : t('No'); } },
      { title: t('Participacion %'), dataIndex: 'percentage', align: 'right', render: function (v) { return Number(v || 0).toFixed(4) + '%'; } },
      { title: t('Suma'), dataIndex: 'sum', align: 'right', render: function (v) { return fmt(v); } },
      { title: t('Prima'), dataIndex: 'premium', align: 'right', render: function (v) { return fmt(v); } },
      { title: t('Comision'), dataIndex: 'commission', align: 'right', render: function (v) { return fmt(v); } },
      { title: t('Impuesto'), dataIndex: 'tax', align: 'right', render: function (v) { return fmt(v); } }
    ];
    return <div className="axx-coaseguro-view">
      <Alert type="info" showIcon message={t('Coaseguro informativo')} description={t('Los valores se calculan con el estado final del endoso y no son editables. La distribución de reaseguro utiliza únicamente la porción restante.')} />
      <Table size="small" pagination={false} rowKey="key" dataSource={displayRows} columns={columns}
        summary={function () { return <Table.Summary><Table.Summary.Row className="axx-rea-total-row">
          <Table.Summary.Cell index={0}><b>{t('Totales')}</b></Table.Summary.Cell>
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
    { title: t('Contrato'), dataIndex: 'contractId', width: 100 },
    { title: t('Linea'), dataIndex: 'lineId', width: 130 },
    { title: t('Cobertura'), dataIndex: 'coverageCode', width: 110 },
    { title: t('Movimiento'), dataIndex: 'premium', align: 'right', width: 130, render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } },
    { title: t('Retencion'), dataIndex: 'premiumCedant', align: 'right', width: 130, render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } },
    { title: t('Cedido'), dataIndex: 'premiumRe', align: 'right', width: 130, render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } }
  ];

  const colsRea = [
    { title: t('Cobertura'), dataIndex: 'coverageCode', width: 100 },
    { title: t('Descripcion'), dataIndex: 'cover' },
    { title: t('Suma para el contrato'), dataIndex: 'counts', width: 160, render: function (v) { return v ? <Tag color="blue">{t('Si')}</Tag> : <Tag>{t('No')}</Tag>; } },
    { title: t('Suma movimiento'), dataIndex: 'sumInsuredMovement', align: 'right', width: 130, render: function (v, row) { return fmt(rowSumMovement(row)); } },
    { title: t('Movimiento'), dataIndex: 'premiumMovement', align: 'right', width: 120, render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } },
    { title: t('Base prorrateada'), dataIndex: 'proratedMovement', align: 'right', width: 140, render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } },
    { title: t('Pct. Retencion'), dataIndex: 'proportionCed', align: 'right', width: 120, render: function (v) { return (Number(v || 0) * 100).toFixed(2) + '%'; } },
    { title: t('Suma retencion'), dataIndex: 'sumInsuredCedant', align: 'right', width: 130, render: function (v) { return fmt(v); } },
    { title: t('Prima retencion'), dataIndex: 'premiumCedant', align: 'right', width: 130, render: function (v) { return fmt(v); } },
    { title: t('Pct. Cedido'), dataIndex: 'proportionRe', align: 'right', width: 110, render: function (v) { return (Number(v || 0) * 100).toFixed(2) + '%'; } },
    { title: t('Suma cedida'), dataIndex: 'sumInsuredRe', align: 'right', width: 130, render: function (v) { return fmt(v); } },
    { title: t('Prima cedida'), dataIndex: 'premiumRe', align: 'right', width: 130, render: function (v) { return fmt(v); } },
    { title: t('Comision'), dataIndex: 'commission', align: 'right', width: 120, render: function (v) { return fmt(v); } },
    { title: t('Impuesto'), dataIndex: 'tax', align: 'right', width: 120, render: function (v) { return fmt(v); } }
  ];

  const contractRows = (function () {
    const grouped = {};
    ((sim && sim.contracts) || []).forEach(function (group) {
      const contractId = String(group.contractId);
      if (!grouped[contractId]) {
        grouped[contractId] = {
          key: contractId,
          contractId: group.contractId,
          policyId: policy ? policy.id : '',
          endorsement: calc && calc.changeId ? calc.changeId : 0,
          movementType: t('Cambio de suma'),
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
      row.movement += numberFrom(group.totals, ['movement']);
      row.sum += numberFrom(group.totals, ['sumMovement']);
      row.cedant += numberFrom(group.totals, ['cedant']);
      row.sumCedant += numberFrom(group.totals, ['sumCedant']);
      row.re += numberFrom(group.totals, ['re']);
      row.sumRe += numberFrom(group.totals, ['sumRe']);
      row.commission += numberFrom(group.totals, ['commission']);
      row.tax += numberFrom(group.totals, ['tax']);
      row.coverages += (group.rows || []).length;
    });
    return Object.keys(grouped).map(function (key) {
      const row = grouped[key];
      const currentRows = (baseCessions || []).filter(function (cession) {
        return String(cession.contractId) === String(row.contractId);
      });
      currentRows.forEach(function (cession) {
        row.sum += numberFrom(cession, ['sumInsured']);
        row.movement += numberFrom(cession, ['premium']);
        row.cedant += numberFrom(cession, ['premiumCedant']);
        row.sumCedant += numberFrom(cession, ['sumInsuredCedant']);
        row.re += numberFrom(cession, ['premiumRe']);
        row.sumRe += numberFrom(cession, ['sumInsuredRe']);
        row.commission += numberFrom(cession, ['comissionCedant', 'commission']);
        row.tax += numberFrom(cession, ['tax']);
      });
      // El encabezado debe representar el estado final completo. Se toma una
      // sola vez cada cobertura del contrato y se usa el resultado cotizado;
      // sumar cesiones duplicaría una cobertura presente en varias líneas.
      const finalByCoverage = {};
      (row.groups || []).forEach(function (group) {
        (group.rows || []).forEach(function (coverage) {
          const code = txt(coverage.coverageCode);
          if (!code || finalByCoverage[code]) return;
          finalByCoverage[code] = coverage;
        });
      });
      row.movement = Object.keys(finalByCoverage).reduce(function (sum, code) {
        return sum + finalCoveragePremium(row.groups[0] || {}, finalByCoverage[code]);
      }, 0);
      row.sum = Object.keys(finalByCoverage).reduce(function (sum, code) {
        const coverage = finalByCoverage[code];
        return sum + (coverage.counts ? finalCoverageSum(row.groups[0] || {}, coverage) : 0);
      }, 0);
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
    { title: t('Poliza'), dataIndex: 'policyId', width: 100 },
    { title: t('Contrato'), dataIndex: 'contractId', width: 105 },
    { title: t('Movimiento'), children: [
      { title: t('Endoso'), dataIndex: 'endorsement', width: 85 },
      { title: t('Tipo'), dataIndex: 'movementType', width: 100 }
    ] },
    { title: t('Totales'), children: [
      { title: t('Suma'), dataIndex: 'sum', align: 'right', width: 125, render: function (v) { return fmt(v); } },
      { title: t('Prima'), dataIndex: 'movement', align: 'right', width: 125, render: function (v) { return fmt(v); } }
    ] },
    { title: t('Retencion'), children: [
      { title: t('Prima Ret'), dataIndex: 'cedant', align: 'right', width: 125, render: function (v) { return fmt(v); } },
      { title: t('Suma Ret'), dataIndex: 'sumCedant', align: 'right', width: 125, render: function (v) { return fmt(v); } }
    ] },
    { title: t('Cedido'), children: [
      { title: t('Prima Ced'), dataIndex: 're', align: 'right', width: 125, render: function (v) { return fmt(v); } },
      { title: t('Suma Ced'), dataIndex: 'sumRe', align: 'right', width: 125, render: function (v) { return fmt(v); } }
    ] },
    { title: t('Otros'), children: [
      { title: t('Comision'), dataIndex: 'commission', align: 'right', width: 115, render: function (v) { return fmt(v); } },
      { title: t('Impuesto'), dataIndex: 'tax', align: 'right', width: 115, render: function (v) { return fmt(v); } }
    ] }
  ];

  const colsDistribution = [
    { title: t('Contrato'), dataIndex: 'contractLabel', width: 145, render: function (v, row) {
      return <span className="axx-rea-line-label">
        <span>{v}</span>
        {row.canViewReinsurers ? <Button type="text" size="small" className="axx-folder-btn"
          aria-label={t('Ver reaseguradores')} title={t('Ver reaseguradores')}
          onClick={function (event) {
            event.stopPropagation();
            setSelectedReinsuranceLineKey(row.groupKey);
            setReinsurersReady(true);
            setReaDetailTab('reinsurers');
          }}><FolderIcon /></Button> : null}
      </span>;
    } },
    { title: t('Porcentaje (%)'), dataIndex: 'percentage', align: 'right', width: 135, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={4} readOnly={row.isCoinsurance} onCommit={function (x) { editContractPercentage(row.groupKey, row.percentageField, x); }} />;
    } },
    { title: t('Suma'), dataIndex: 'sum', align: 'right', width: 135, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={2} readOnly={row.isCoinsurance} onCommit={function (x) { setManualContractAmount(row.groupKey, row.manualPrefix + 'Sum', x); }} />;
    } },
    { title: t('Prima'), dataIndex: 'premium', align: 'right', width: 135, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={2} readOnly={row.isCoinsurance} onCommit={function (x) { setManualContractAmount(row.groupKey, row.manualPrefix + 'Premium', x); }} />;
    } },
    { title: t('Pct. Comision'), dataIndex: 'commissionPercentage', align: 'right', width: 135, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={4} disabled={row.isRetention} readOnly={row.isCoinsurance} onCommit={function (x) { editContractRate(row.groupKey, 'commission', x); }} />;
    } },
    { title: t('Comision'), dataIndex: 'commission', align: 'right', width: 135, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={2} disabled={row.isRetention} readOnly={row.isCoinsurance} onCommit={function (x) { setManualContractAmount(row.groupKey, 'Commission', x); }} />;
    } },
    { title: t('Pct. Impuesto'), dataIndex: 'taxPercentage', align: 'right', width: 135, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={4} disabled={row.isRetention} readOnly={row.isCoinsurance} onCommit={function (x) { editContractRate(row.groupKey, 'tax', x); }} />;
    } },
    { title: t('Impuesto'), dataIndex: 'tax', align: 'right', width: 135, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={2} disabled={row.isRetention} readOnly={row.isCoinsurance} onCommit={function (x) { setManualContractAmount(row.groupKey, 'Tax', x); }} />;
    } },
    { title: t('Saldo Rea.'), dataIndex: 'reinsuranceBalance', align: 'right', width: 135, render: function (v) { return fmt(v); } }
  ];

  function getDistributionRows(contract) {
    const lineDefinitions = [
      { key: 'NO TECNICA', label: 'No Técnica' },
      { key: 'RETENCION', label: 'Retención' },
      { key: 'CUOTA PARTE', label: 'Cuota Parte' },
      { key: 'EXCEDENTE 1', label: 'Excedente 1' },
      { key: 'FAC', label: 'Facultativo' },
      { key: 'FRO', label: 'Fronting' },
      { key: 'COASEGURO', label: 'Coaseguro' }
    ];
    const normalizeLine = function (value) {
      const line = txt(value).toUpperCase();
      if (line === 'NT' || line.indexOf('NO TEC') >= 0) return 'NO TECNICA';
      if (line === 'RET' || line.indexOf('RETENC') >= 0) return 'RETENCION';
      if (line === 'CP' || line.indexOf('CUOTA') >= 0) return 'CUOTA PARTE';
      if (line === 'EX1' || line.indexOf('EXCEDENTE') >= 0) return 'EXCEDENTE 1';
      if (line === 'FAC' || line.indexOf('FACULT') >= 0) return 'FAC';
      if (line === 'FRO' || line.indexOf('FRONT') >= 0) return 'FRO';
      if (line === 'CO' || line.indexOf('COASEG') >= 0) return 'COASEGURO';
      return line;
    };
    const aggregate = function (rows) {
      return rows.reduce(function (total, row) {
        total.sum += numberFrom(row, ['sumInsured']);
        total.premium += numberFrom(row, ['premium']);
        total.sumRet += numberFrom(row, ['sumInsuredCedant']);
        total.premiumRet += numberFrom(row, ['premiumCedant']);
        total.sumCed += numberFrom(row, ['sumInsuredRe']);
        total.premiumCed += numberFrom(row, ['premiumRe']);
        total.commission += numberFrom(row, ['comissionCedant', 'commission']);
        total.tax += numberFrom(row, ['tax']);
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
      const isRetention = definition.key === 'RETENCION';
      // El formulario guarda la retencion dentro de la linea Cuota Parte cuando
      // no existe una cesion separada con lineId RET.
      const g = groupsByLine[definition.key] || (isRetention ? groupsByLine['CUOTA PARTE'] : null);
      const sourceBaseRows = baseByLine[definition.key] && baseByLine[definition.key].length
        ? baseByLine[definition.key]
        : (isRetention ? (baseByLine['CUOTA PARTE'] || []) : []);
      const base = aggregate(sourceBaseRows);
      const totals = g && g.totals ? g.totals : {};
      const premium = base.premium + numberFrom(totals, ['movement']);
      // hydrateFinalDistribution recalculates these values over the final
      // ceded premium. Do not add the historical base again.
      const commission = g ? numberFrom(totals, ['commission']) : base.commission;
      const tax = g ? numberFrom(totals, ['tax']) : base.tax;
      // La distribucion debe cerrar contra el total del movimiento del grupo.
      // Los campos cedente/cedido de la base pueden incluir ya la variacion,
      // por lo que no se vuelven a sumar para obtener el total.
      const fallbackGroupTotalPremium = base.premium + numberFrom(totals, ['movement']);
      const fallbackGroupTotalSum = base.sum + numberFrom(totals, ['sumMovement']);
      // Todas las lineas se distribuyen sobre el mismo total final del contrato.
      // Usar el total de cada grupo por separado dejaba primas diferentes cuando
      // se combinaban RET, Cuota Parte, FAC u otras lineas.
      const groupTotalPremium = Number(contract.movement || fallbackGroupTotalPremium);
      const groupTotalSum = Number(contract.sum || fallbackGroupTotalSum);
      const groupKey = g ? String(g.contractId) + '-' + String(g.lineId) : String(contract.contractId) + '-' + definition.key;
      // Retencion puede reutilizar el grupo de Cuota Parte; la fila visual
      // necesita una clave propia para que React no mezcle sus valores.
      const lineKey = groupKey + '-' + definition.key;
      const isCoinsurance = definition.key === 'COASEGURO';
      const coinsurance = isCoinsurance ? contractCoinsuranceTotals(contract) : null;
      const isCededLine = !isRetention && !isCoinsurance && definition.key !== 'NO TECNICA';
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
      const manualSumField = isRetention ? 'manualRetentionSum' : 'manualCededSum';
      const manualPremiumField = isRetention ? 'manualRetentionPremium' : 'manualCededPremium';
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
        manualPrefix: isRetention ? 'Retention' : 'Ceded',
        percentageField: isRetention ? 'proportionCed' : 'proportionRe',
        percentageConfigured: isCoinsurance || (g && totals[isRetention ? 'distributionPercentageCed' : 'distributionPercentageRe'] !== undefined),
        percentage: isCoinsurance ? 0 : (g && totals[isRetention ? 'distributionPercentageCed' : 'distributionPercentageRe'] !== undefined
          ? Number(totals[isRetention ? 'distributionPercentageCed' : 'distributionPercentageRe'])
          : (g ? contractPercentage(g, isRetention ? 'proportionCed' : 'proportionRe') : 0)),
        sum: displaySum,
        premium: displayPremium,
        amountField: isRetention ? 'sumInsuredCedant' : 'sumInsuredRe',
        premiumField: isRetention ? 'premiumCedant' : 'premiumRe',
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
    if (mode === 'distribution') {
      return <Table size="small" pagination={false} rowKey="key" scroll={{ x: 1250 }}
        dataSource={getDistributionRows(contract)} columns={colsDistribution}
        summary={function (pageData) {
          const total = function (field) { return money(pageData.reduce(function (sum, row) { return sum + Number(row[field] || 0); }, 0)); };
          return (
            <Table.Summary>
              <Table.Summary.Row className="axx-rea-total-row">
                <Table.Summary.Cell index={0}><b>{t('Totales')}</b></Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">{(total('percentage') - pageData.reduce(function (sum, row) { return sum + (row.isCoinsurance ? Number(row.percentage || 0) : 0); }, 0)).toFixed(2)}</Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">{fmt(total('sum'))}</Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">{fmt(total('premium'))}</Table.Summary.Cell>
                <Table.Summary.Cell index={4}></Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">{fmt(total('commission'))}</Table.Summary.Cell>
                <Table.Summary.Cell index={6}></Table.Summary.Cell>
                <Table.Summary.Cell index={7} align="right">{fmt(total('tax'))}</Table.Summary.Cell>
                <Table.Summary.Cell index={8} align="right">{fmt(total('reinsuranceBalance'))}</Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          );
        }} />;
    }
    const groupsToRender = mode === 'reinsurers' && selectedReinsuranceLineKey
      ? contract.groups.filter(function (item) {
        return String(item.contractId) + '-' + String(item.lineId) === selectedReinsuranceLineKey;
      })
      : contract.groups;
    return groupsToRender.map(function (g) {
      const groupKey = String(g.contractId) + '-' + String(g.lineId);
      const groupRows = (g.rows || []).map(function (row) {
        return Object.assign({}, row, { _groupKey: groupKey });
      });
      const lineTotal = getDistributionRows(contract).find(function (item) {
        return String(item.groupKey) === groupKey;
      });
      const lineParticipants = getLineParticipants(g, lineTotal);
      return (
        <div key={mode + groupKey} className="axx-rea-line-detail">
          <div className="axx-rea-toolbar">
            <div className="axx-rea-summary">
              <b>{t('Contrato')}:</b> {g.contractId} {' | '} <b>{t('Linea')}:</b> {g.lineId} {' | '}
              <b>{t('Movimiento')}:</b> {conSigno(g.totals.movement)} {' | '}
              <b>{t('Coberturas que suman')}:</b> {g.totals.coveragesCounted}/{groupRows.length}
            </div>
          </div>
          {mode === 'coverage' ? (
            <Table size="small" pagination={false} rowKey="coverageCode" scroll={{ x: 1700 }}
              dataSource={groupRows} columns={colsRea}
              expandable={{
                expandedRowRender: function (row) {
                  const participants = getCoverageParticipants(g, row.coverageCode);
                  return <div className="axx-coverage-participants">
                    <div className="axx-coverage-participants-title">{t('Aceptantes de la cobertura')}</div>
                    <Table size="small" pagination={false} rowKey={function (item) {
                      return String(item.contactId || '') + '-' + String(item.brokerId || '') + '-' + String(row.coverageCode);
                    }} dataSource={participants} columns={colsCoberturaAceptantes} />
                  </div>;
                },
                rowExpandable: function (row) {
                  return getCoverageParticipants(g, row.coverageCode).length > 0;
                }
              }} />
          ) : null}
          {mode === 'reinsurers' ? (
            <>
            <div className="axx-rea-actions">
              <Button type="primary" size="small" onClick={function () { agregarAceptante(g); }}>
                {t('Agregar aceptante')}
              </Button>
              <Button size="small" onClick={guardarAceptantesMemoria}>
                {t('Guardar distribución')}
              </Button>
              <span>{t('Distribución de aceptantes')}</span>
            </div>
            <Table className="axx-aceptantes" size="small" pagination={false}
              rowKey={function (r) { return r.id || (r.cessionId + '-' + r.contactId + '-' + (r.brokerId || '')); }}
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
.axx299 .axx-tabs .ant-tabs-tab-active::after { content:''; position:absolute; left:0; right:0; bottom:-1px;
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
.axx299 .axx-ellipsis-cell { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.axx299 .axx-sum-input-grid .ant-table-thead > tr > th,
.axx299 .axx-sum-input-grid .ant-table-tbody > tr > td { padding:3px 7px !important; }
.axx299 .axx-coverage-result-grid .ant-table-body {
  overflow-x:scroll !important;
  overflow-y:scroll !important;
  scrollbar-gutter:stable;
}
.axx299 .axx-coverage-result-grid .ant-table-thead > tr > th,
.axx299 .axx-coverage-result-grid .ant-table-tbody > tr > td,
.axx299 .axx-coverage-result-grid .ant-table-summary > tr > td { padding:3px 5px !important; font-size:11px; }
.axx299 .axx-coverage-result-grid .ant-table-summary .axx-coverage-total-row > td {
  background:#86b4ff !important;
  color:#0b1f3a;
  font-weight:700;
}
/* Misma jerarquía visual de campos que el formulario de Ramos Técnicos. */
.axx299 .ant-input,
.axx299 .ant-input-affix-wrapper,
.axx299 .ant-input-number,
.axx299 .ant-picker,
.axx299 .ant-select:not(.ant-select-customize-input) .ant-select-selector {
  border:1px solid #b8c4d1 !important;
  border-radius:6px !important;
  transition:border-color .2s, box-shadow .2s;
}
.axx299 .ant-input:hover,
.axx299 .ant-input-affix-wrapper:hover,
.axx299 .ant-input-number:hover,
.axx299 .ant-picker:hover,
.axx299 .ant-select:not(.ant-select-customize-input):hover .ant-select-selector { border-color:#8da9c2 !important; }
.axx299 .ant-input:focus,
.axx299 .ant-input-affix-wrapper-focused,
.axx299 .ant-input-number-focused,
.axx299 .ant-picker-focused,
.axx299 .ant-select-focused:not(.ant-select-customize-input) .ant-select-selector {
  border-color:#1677ff !important;
  box-shadow:0 0 0 2px rgba(22,119,255,.2) !important;
}
.axx299 .ant-input[disabled],
.axx299 .ant-input-number-disabled,
.axx299 .ant-picker-disabled,
.axx299 .ant-select-disabled:not(.ant-select-customize-input) .ant-select-selector {
  border-color:#d9d9d9 !important;
  background:#f5f5f5 !important;
}
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

  const puedeEjecutar = !!(calc && (calc.changedRows || calc.rows || []).length && !running && reinsuranceConfirmed);
  const reinsuranceValidation = calc && sim
    ? validateReinsuranceDistribution()
    : { ok: false, errors: [t('La distribución de reaseguro todavía no está cargada.')] };
  const finalSumOfConfiguredCoverages = calc
    ? (calc.rows || []).reduce(function (sum, row) {
      const configured = (eligible || []).find(function (coverage) {
        return txt(coverage.code) === txt(row.code);
      });
      return configured && configured.sums === true
        ? sum + Number(row.newSum || 0)
        : sum;
    }, 0)
    : 0;
  const openedWithPolicy = /[?&]policyId=\d+/.test(String(window.location.href || ''));

  return (
    <DefaultPage title={t('Endoso de cambio de suma asegurada por cobertura')} subTitle={policy ? policy.code : ''}>
      <div className="axx299">
        <style>{css}</style>

        {running ? (
          <div className="axx-execution-mask" role="alert" aria-busy="true">
            <div><Spin size="small" /> {t('Procesando endoso, espere por favor...')}</div>
          </div>
        ) : null}

        <div className="axx-status">
          <b>{t('Poliza')}:</b> {policy ? policy.code + ' — ' + ((policy.Product && (policy.Product.name || policy.Product.description)) || policy.productCode) + ' — ' + ((policy.Currency && (policy.Currency.name || policy.Currency.description)) || policy.currency) : t('sin cargar')}
          {policy ? <span>{' | '}<b>{t('Estado')}:</b> {policy.entityState === 'ACTIVE' ? t('Activo') : (policy.entityState === 'INACTIVE' ? t('Inactivo') : t(policy.entityState))}</span> : null}
          {calc ? <span>{' | '}<b>{t('Movimiento')}:</b> {calc.direction === 'INCREASE' ? t('Aumento') : t('Disminucion')}{' | '}<b>{t('Coberturas')}:</b> {calc.coverageCode}{' | '}<b>{t('Suma final')}:</b> {fmt(finalSumOfConfiguredCoverages)}</span> : null}
        </div>

        <div className="axx-topbar">
          {!openedWithPolicy ? (
            <>
            <span>{t('Poliza')}</span>
            <Input id="txtBuscarPoliza" style={{ width: 200 }} placeholder={t('Numero o codigo')}
              value={buscarPoliza} onChange={function (e) { setBuscarPoliza(e.target.value); }}
              onPressEnter={buscar} />
            <Button id="btnBuscarPoliza" onClick={buscar} loading={loading}>{t('Cargar poliza')}</Button>
            {!policy ? <span style={{ color: '#5a6572' }}>{t('Abra la vista desde la poliza o indique aqui su numero o codigo')}</span> : null}
            </>
          ) : null}
          <Button type="primary" onClick={confirmarReaseguro} disabled={!calc || running}>
            {t('Confirmar reaseguro')}
          </Button>
          <Button id="btnEjecutar" type="primary" disabled={!puedeEjecutar} loading={running}
            onClick={function () { setNote(''); setNoteTouched(false); setModal(true); }}>
            {t('Ejecutar endoso')}
          </Button>
          <Button className="axx-btn-sec axx-return-btn" icon={<ReturnIcon />} onClick={retornarAPoliza} disabled={!policyId || running}>
            {t('Retornar')}
          </Button>
        </div>

        {error ? <Alert className="axx-alerta" type="error" showIcon message={error} closable onClose={function () { setError(null); }} /> : null}

        {result ? (
          <Alert type={result.ok === false ? 'error' : 'success'} showIcon
            message={result.ok === false ? t('El endoso no se completo') : t('Endoso procesado')}
            description={result.msg} closable onClose={function () { setResult(null); }} />
        ) : null}

        {result && result.persistedDistribution && result.persistedDistribution.length ? (
          <div className="axx-panel">
            <Table className="axx-persistida" size="small" pagination={false} rowKey="id"
              dataSource={result.persistedDistribution} columns={colsPersistida}
              title={function () {
                return t('Cesion escrita por el endoso') + (result.rounding && result.rounding.length
                  ? ' — ' + t('con ajuste de redondeo de un centavo en') + ' ' + result.rounding.length + ' ' + t('importe(s)')
                  : '');
              }} />
          </div>
        ) : null}

        <Tabs className="axx-tabs" activeKey={tab} onChange={setTab} type="card"
          items={[
            {
              key: 'calc', label: t('Cálculo del endoso'), children: (
                <div className="axx-panel">
                  <Card bordered={false}>
                    <div className="axx-filtros">
                      <div className="axx-campo">
                        <label>{t('Fecha efectiva')}</label>
                        <DatePicker id="dtpFechaEfectiva" style={{ width: 150 }} value={effectiveDate}
                          onChange={function (v) { setEffectiveDate(v); invalidate(); }} />
                      </div>
                      <div className="axx-campo">
                        <label>{t('Recargo')}</label>
                        <InputNumber id="numRecargo" min={0} step={1} style={{ width: 120 }} value={surcharge}
                          onChange={function (v) { onAjuste('surcharge', v); }} />
                      </div>
                      <div className="axx-campo">
                        <label>{t('Descuento')}</label>
                        <InputNumber id="numDescuento" min={0} step={1} style={{ width: 120 }} value={discount}
                          onChange={function (v) { onAjuste('discount', v); }} />
                      </div>
                      <Button id="btnCalcular" type="primary" loading={loading}
                        disabled={!effectiveDate || !sumEditableRows.some(function (row) {
                          const value = coverageInputs[txt(row.code)];
                          return value && value.final !== null && value.final !== undefined && value.final !== '' && Number.isFinite(Number(value.final));
                        })} onClick={calcular}>{t('Calcular endoso')}</Button>
                    </div>

                    <Table className="axx-grilla axx-sum-input-grid" size="small" pagination={false} rowKey="code"
                      dataSource={sumEditableRows} scroll={{ x: true }} columns={[
                        { title: t('Código'), dataIndex: 'code', key: 'code', width: 70 },
                        { title: t('Cobertura'), dataIndex: 'name', key: 'name', width: 260 },
                        { title: t('Suma actual'), dataIndex: 'limit', key: 'limit', align: 'right', width: 120, render: function (value) { return fmt(value); } },
                        { title: t('Diferencia (+/-)'), key: 'difference', width: 160,
                          render: function (value, row) {
                            const input = coverageInputs[txt(row.code)] || {};
                            return <InputNumber id={'numDiferencia-' + row.code} step={1000} style={{ width: 140 }} value={input.difference}
                              formatter={function (v) { return v === undefined || v === null || v === '' ? '' : String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }}
                              parser={function (v) { return String(v || '').replace(/,/g, ''); }}
                              onChange={function (v) { updateCoverageInput(row.code, 'difference', v, row.limit); }} />;
                          } },
                        { title: t('Nueva suma final'), key: 'final', width: 160,
                          render: function (value, row) {
                            const input = coverageInputs[txt(row.code)] || {};
                            return <InputNumber id={'numSumaFinal-' + row.code} step={1000} style={{ width: 140 }} value={input.final}
                              formatter={function (v) { return v === undefined || v === null || v === '' ? '' : String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }}
                              parser={function (v) { return String(v || '').replace(/,/g, ''); }}
                              onChange={function (v) { updateCoverageInput(row.code, 'final', v, row.limit); }} />;
                          } },
                        { title: t('Suma resultante'), key: 'newSum', align: 'right', width: 130,
                          render: function (value, row) {
                            const input = coverageInputs[txt(row.code)] || {};
                            if (input.final === null || input.final === undefined || input.final === '' || !Number.isFinite(Number(input.final))) return '';
                            return fmt(input.final);
                          } }
                      ]} />

                    <Spin spinning={loading}>
                      {calc ? (
                        <div>
                          <Table className="axx-grilla axx-coverage-result-grid" size="small" pagination={false} rowKey="code"
                            dataSource={calc.rows} columns={colsGrid} scroll={{ x: 1200, y: altoGrilla }}
                            summary={function (pageData) {
                              const total = function (field) {
                                return money(pageData.reduce(function (sum, row) { return sum + Number(row[field] || 0); }, 0));
                              };
                              return <Table.Summary>
                                <Table.Summary.Row className="axx-coverage-total-row">
                                  <Table.Summary.Cell index={0} colSpan={4}><b>{t('Totales')}</b></Table.Summary.Cell>
                                  <Table.Summary.Cell index={4} align="right">{fmt(total('oldSum'))}</Table.Summary.Cell>
                                  <Table.Summary.Cell index={5} align="right">{fmt(total('newSum'))}</Table.Summary.Cell>
                                  <Table.Summary.Cell index={6} align="right">{fmt(total('oldPremium'))}</Table.Summary.Cell>
                                  <Table.Summary.Cell index={7} align="right">{fmt(total('proportionalPremium'))}</Table.Summary.Cell>
                                  <Table.Summary.Cell index={8}></Table.Summary.Cell>
                                  <Table.Summary.Cell index={9} align="right">{fmt(total('newPremium'))}</Table.Summary.Cell>
                                  <Table.Summary.Cell index={10} align="right"><span className={signo(total('variation'))}>{conSigno(total('variation'))}</span></Table.Summary.Cell>
                                  <Table.Summary.Cell index={11} colSpan={2}></Table.Summary.Cell>
                                </Table.Summary.Row>
                              </Table.Summary>;
                            }} />
                          <div style={{ height: 8 }} />
                          <Table className="axx-resumen" size="small" pagination={false} rowKey="key"
                            dataSource={filasResumen} columns={colsResumen}
                            title={function () { return t('Resumen de facturacion') + ' (' + calc.billing.currency + ')'; }} />
                          <div className="axx-pie">
                            {t('Movimiento')}: <span className={signo(calc.billing.movement.premium)}>{conSigno(calc.billing.movement.premium)}</span>
                            {' '}{t('prima')} {' | '}
                            <span className={signo(calc.billing.movement.tax)}>{conSigno(calc.billing.movement.tax)}</span> {t('impuesto')} {' | '}
                            <span className={signo(calc.billing.movement.total)}>{conSigno(calc.billing.movement.total)}</span> {t('total')}
                            {' | '}{t('Fecha efectiva')}: {day10(calc.effectiveDate)}
                          </div>
                        </div>
                      ) : <Empty description={t('Indique una nueva suma para una o más coberturas y pulse Calcular endoso')} />}
                    </Spin>
                  </Card>
                </div>
              )
            },
            {
              key: 'rea', label: t('Reaseguro del movimiento'), children: (
                <div className="axx-panel">
                  <Card bordered={false}>
                    <Alert type="info" showIcon
                      message={t('Distribución de reaseguro')} />
                    <Spin spinning={simLoading}>
                      {!calc ? <Empty description={t('Calcule el endoso en la primera pestania')} /> : null}
                      {calc && sim && sim.contracts && sim.contracts.length ? (
                        <div>
                          <Table className="axx-rea-contracts" size="small" pagination={false} rowKey="key"
                            dataSource={contractRows} columns={colsContracts}
                            rowSelection={{ type: 'radio', selectedRowKeys: selectedReinsuranceKey ? [selectedReinsuranceKey] : [], onChange: function (keys) {
                              setSelectedReinsuranceKey(keys[0] || null);
                              setSelectedReinsuranceLineKey(null);
                              setReinsurersReady(false);
                              setReaDetailTab('distribution');
                            } }}
                            onRow={function (row) { return { onClick: function () { setSelectedReinsuranceKey(row.key); } }; }} />
                          {contractRows.filter(function (row) { return row.key === selectedReinsuranceKey; }).map(function (contract) {
                            return (
                              <Tabs className="axx-rea-detail-tabs" type="card" activeKey={reaDetailTab} onChange={setReaDetailTab}>
                                <Tabs.TabPane tab={t('Distribucion')} key="distribution">
                                  <div className="axx-rea-actions">
                                    <Button type="primary" onClick={guardarDistribucionMemoria}>{t('Guardar')}</Button>
                                    <span>{t('Distribución de reaseguro')}</span>
                                  </div>
                                  {renderSelectedLines(contract, 'distribution')}
                                </Tabs.TabPane>
                                <Tabs.TabPane tab={t('Reaseguradores')} key="reinsurers" disabled={!reinsurersReady}>
                                  {reinsurersReady ? renderSelectedLines(contract, 'reinsurers') : <Empty description={t('Seleccione ver aceptantes en una línea cedida')} />}
                                </Tabs.TabPane>
                                <Tabs.TabPane tab={t('Coaseguro')} key="coinsurance">
                                  {renderCoinsuranceTab()}
                                </Tabs.TabPane>
                                <Tabs.TabPane tab={t('Cobertura')} key="coverage">
                                  {renderSelectedLines(contract, 'coverage')}
                                </Tabs.TabPane>
                              </Tabs>
                            );
                          })}
                          {sim.warnings && sim.warnings.length
                            ? <Alert type="warning" showIcon message={sim.warnings.join(' | ')} /> : null}
                          {!reinsuranceValidation.ok
                            ? <Alert type="error" showIcon message={t('La distribución no permite ejecutar el endoso')} description={reinsuranceValidation.errors.join(' ')} />
                            : <Alert type="success" showIcon message={t('La distribución de reaseguro es válida para ejecutar')} />}
                          <div className="axx-pie">
                            {t('Prima final del endoso')}: {fmt(calc.billing.premium.after)} {' | '}
                            {t('Prima final distribuida')}: {fmt(calc.billing.premium.after)} {' | '}
                            {t('Estado')}: {' '}
                            {reinsuranceValidation.ok ? <Tag color="blue">{t('Cuadrado')}</Tag> : <Tag color="red">{t('Descuadrado')}</Tag>}
                          </div>
                        </div>
                      ) : null}
                      {calc && sim && (!sim.contracts || !sim.contracts.length)
                        ? <Empty description={sim.msg || t('La poliza no tiene reaseguro vigente para este movimiento')} /> : null}
                    </Spin>
                  </Card>
                </div>
              )
            },
            {
              key: 'cuotas', label: t('Vista previa de cuotas'), children: (
                <div className="axx-panel">
                  <Card bordered={false}>
                    {!calc ? (
                      <Alert type="info" showIcon style={{ marginBottom: 8 }}
                        message={t('Calcule el endoso para ver la vista previa de las cuotas.')} />
                    ) : null}
                    <Table className="axx-grilla" size="small" bordered pagination={false} rowKey="key"
                      dataSource={calc ? payPlanPreview : []} columns={colsCuotas}
                      locale={{ emptyText: t('Calcule el endoso para ver la vista previa de las cuotas.') }} />
                  </Card>
                </div>
              )
            }
          ]} />

        <Modal wrapClassName="axx299-modal" title={t('Confirmar ejecucion del endoso')} open={modal}
          okText={t('Confirmar')} cancelText={t('Cancelar')} confirmLoading={running}
          okButtonProps={{ id: 'btnConfirmar', disabled: running }}
          onOk={ejecutar}
          onCancel={function () { if (!running) { setModal(false); } }}>
          <div>
            {calc ? (
              <div style={{ marginBottom: 8 }}>
                {t('Coberturas modificadas')}: <b>{calc.coverageCode}</b><br />
                {(calc.changedRows || []).map(function (row) {
                  const sumMovement = row.sumInsuredMovement === undefined
                    ? money(Number(row.newSum || 0) - Number(row.oldSum || 0))
                    : money(row.sumInsuredMovement);
                  const premiumMovement = row.variation === undefined
                    ? money(Number(row.adjustedPremium || 0) - Number(row.oldPremium || 0))
                    : money(row.variation);
                  return <span key={row.code}>{row.code}: {t('suma')} <b>{conSigno(sumMovement)}</b>, {t('prima')} <b>{conSigno(premiumMovement)}</b><br /></span>;
                })}
                {t('Prima del endoso')}: <b>{conSigno(calc.billing.movement && calc.billing.movement.premium)}</b><br />
                {t('Total del endoso')}: <b>{conSigno(calc.billing.movement && calc.billing.movement.total)}</b>
              </div>
            ) : null}
            <label>{t('Observacion')} *</label>
            <Input.TextArea id="txtObservacion" rows={3} value={note} maxLength={500}
              onChange={function (e) { setNote(e.target.value); setNoteTouched(true); }} />
            {noteTouched && !txt(note)
              ? <div style={{ color: '#cf1322' }}>{t('La observacion es obligatoria')}</div> : null}
          </div>
        </Modal>
      </div>
    </DefaultPage>
  );
}
