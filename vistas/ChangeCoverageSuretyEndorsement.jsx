/**
 * @name  ChangeCoverageSuretyEndorsement
 * @issue AXX-299 / GLOB-1201
 * @purpose Endoso de extension o reduccion de vigencia para Fianzas: calcula el impacto en
 *          prima y facturacion, simula el reaseguro del movimiento y ejecuta el endoso
 *          conservando exactamente los valores mostrados.
 * Se abre con ?policyId=<id>. Todo el calculo vive en cadenas de configuracion:
 *   cmdCalcChangeCoverageSurety   pestania 1 (prorrata, dependientes, impuestos y total)
 *   cmdSweepQuoteResidueSuretyAxx299    retira el residuo fiscal que deja la cotizacion nativa
 *   cmdSimReaChangeCoverageSuretyAxx299 pestania 2 (reaseguro del movimiento, en memoria)
 *   cmdExeChangeCoverageSuretyAxx299    registro del endoso + guard de doble ejecucion
 *   cmdFinishChangeCoverageSuretyAxx299 aprobacion, ejecucion y verificacion de la cesion
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
    return <A.Input size="small" inputMode="decimal" disabled={props.disabled} value={displayValue} style={{ textAlign: 'right' }}
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
  const [policy, setPolicy] = useState(null);
  const [eligible, setEligible] = useState([]);
  const [covCode, setCovCode] = useState(null);
  const [newEnd, setNewEnd] = useState(null);
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
  const [buscarPoliza, setBuscarPoliza] = useState('');
  const [splits, setSplits] = useState([]);
  const [baseCessions, setBaseCessions] = useState([]);
  const [reaDetailTab, setReaDetailTab] = useState('distribution');
  const [selectedReinsuranceKey, setSelectedReinsuranceKey] = useState(null);

  const money = function (v) { return Number(Number(v || 0).toFixed(2)); };
  const txt = function (v) { return String(v === null || v === undefined ? '' : v).trim(); };
  const day10 = function (v) { return txt(v).slice(0, 10); };
  const fmt = function (v) {
    const n = Number(v || 0);
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const FolderIcon = function () {
    return <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M3 5.5A1.5 1.5 0 0 1 4.5 4h5l2 2h8A1.5 1.5 0 0 1 21 7.5v11A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5v-13Zm2 2v10.5h14V8.5h-8.33l-2-2H5Z" />
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
    return (baseCessions || []).filter(function (cession) {
      return String(cession.contractId) === String(group.contractId)
        && String(cession.lineId) === String(group.lineId)
        && String(cession.coverageCode || cession.coverageId || '') === String(row.coverageCode || row.code || '');
    });
  }

  function finalCoveragePremium(group, row) {
    const base = getBaseCoverageRows(group, row);
    const persisted = base.reduce(function (sum, cession) { return sum + numberFrom(cession, ['premium']); }, 0);
    return money(persisted + numberFrom(row, ['premiumMovement']));
  }

  function finalCoverageSum(group, row) {
    const base = getBaseCoverageRows(group, row);
    const persisted = base.reduce(function (sum, cession) { return sum + numberFrom(cession, ['sumInsured']); }, 0);
    return money(persisted || rowSumMovement(row));
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
      // Este endoso modifica vigencia, no suma asegurada.
      totals.sumMovement = 0;
    }
    totals.sumCedant = money(rows.reduce(function (sum, row) { return sum + numberFrom(row, ['sumInsuredCedant']); }, 0));
    totals.sumRe = money(rows.reduce(function (sum, row) { return sum + numberFrom(row, ['sumInsuredRe']); }, 0));
    totals.participantPremium = money((group.participants || []).reduce(function (sum, row) { return sum + numberFrom(row, ['premium']); }, 0));
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
      const totalPercentage = rows.reduce(function (sum, row) { return sum + Number(row.percentage || 0); }, 0);
      const totalSum = rows.reduce(function (sum, row) { return sum + Number(row.sum || 0); }, 0);
      const totalPremium = rows.reduce(function (sum, row) { return sum + Number(row.premium || 0); }, 0);
      const retentionPremium = rows.reduce(function (sum, row) {
        return sum + (row.isRetention ? Number(row.premium || 0) : 0);
      }, 0);
      const cededPremium = rows.reduce(function (sum, row) {
        return sum + (row.canViewReinsurers ? Number(row.premium || 0) : 0);
      }, 0);
      if (Math.abs(totalPercentage - 100) > 0.0001) {
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
    const expectedPremium = numberFrom(calc.billing && calc.billing.movement, ['premium']);
    if (!closeEnough(numberFrom(sim, ['movement']), expectedPremium)) {
      errors.push(t('El movimiento distribuido no coincide con el movimiento del endoso.') + ' ' + fmt(numberFrom(sim, ['movement'])) + ' / ' + fmt(expectedPremium));
    }
    return errors;
  }

  function guardarDistribucionMemoria() {
    if (!sim) return;
    const distributionErrors = validateDistributionBeforeSave();
    if (distributionErrors.length) {
      const validationMessage = distributionErrors.join(' ');
      setError(validationMessage);
      A.message.error(validationMessage);
      return;
    }
    setError(null);
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
            row.premiumCedant = money(finalCoveragePremium(group, row) * percentageCed);
            row.sumInsuredCedant = money(finalCoverageSum(group, row) * percentageCed);
          });
        }
        if (totals.distributionPercentageRe !== undefined) {
          const percentageRe = Math.max(0, Math.min(100, Number(totals.distributionPercentageRe) || 0)) / 100;
          rows.forEach(function (row) {
            row.proportionRe = percentageRe;
            row.premiumRe = money(finalCoveragePremium(group, row) * percentageRe);
            row.sumInsuredRe = money(finalCoverageSum(group, row) * percentageRe);
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
          const split = (Number(participant.split) || 0) / 100;
          participant.sumInsured = money(numberFrom(group.totals, ['sumRe']) * split);
          participant.premium = money(numberFrom(group.totals, ['re']) * split);
          participant.commission = money(numberFrom(group.totals, ['commission']) * split);
          participant.tax = money(numberFrom(group.totals, ['tax']) * split);
        });
        delete totals.manualRetentionSum;
        delete totals.manualRetentionPremium;
        delete totals.manualCededSum;
        delete totals.manualCededPremium;
        delete totals.manualCommission;
        delete totals.manualTax;
      });
      return next;
    });
    A.message.success(t('La distribución cuadra y fue aplicada correctamente en memoria.'));
  }

  function editContractPercentage(groupKey, field, value) {
    if (!sim) return;
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
      const totalSum = getContractTotal(group, 'sum', baseCedSum + baseRetSum + numberFrom(totalsBefore, ['sumMovement']));
      const totalPremium = getContractTotal(group, 'movement', baseCedPremium + baseRetPremium + numberFrom(totalsBefore, ['movement']));
      group.totals = Object.assign({}, group.totals || {}, { [distributionPercentageField]: percentageValue });
      if (field === 'proportionCed') {
        // Solo se reemplaza el lado editado; el porcentaje del otro lado debe conservarse.
        group.totals.manualRetentionSum = money(totalSum * percentageValue / 100);
        group.totals.manualRetentionPremium = money(totalPremium * percentageValue / 100);
      } else {
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
        <label>{t('% Retencion')}<InputNumber size="small" min={0} max={100} value={contractPercentage(group, 'proportionCed')} onChange={function (v) { editContractPercentage(groupKey, 'proportionCed', v); }} /></label>
        <label>{t('Suma retencion')}<InputNumber size="small" value={sumCedant} onChange={function (v) { distributeContractValue(groupKey, 'sumInsuredCedant', v); }} /></label>
        <label>{t('Prima retencion')}<InputNumber size="small" value={totals.cedant || 0} onChange={function (v) { distributeContractValue(groupKey, 'premiumCedant', v); }} /></label>
        <label>{t('% Cedido')}<InputNumber size="small" min={0} max={100} value={contractPercentage(group, 'proportionRe')} onChange={function (v) { editContractPercentage(groupKey, 'proportionRe', v); }} /></label>
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

  function sumField(rows, names) {
    return money((rows || []).reduce(function (total, row) {
      return total + numberFrom(row, names);
    }, 0));
  }

  function validateReinsuranceDistribution() {
    const errors = [];
    if (!calc || !sim || !Array.isArray(sim.contracts)) {
      errors.push(t('La distribución de reaseguro todavía no está cargada.'));
      return { ok: false, errors: errors };
    }

    const expectedPremium = numberFrom(calc.billing && calc.billing.movement, ['premium']);
    const distributedPremium = numberFrom(sim, ['movement']);
    if (!closeEnough(expectedPremium, distributedPremium)) {
      errors.push(t('La prima distribuida no coincide con la prima del endoso.') + ' ' + fmt(distributedPremium) + ' / ' + fmt(expectedPremium));
    }

    (sim.contracts || []).forEach(function (group) {
      const groupName = t('Contrato') + ' ' + group.contractId + ' ' + t('linea') + ' ' + group.lineId;
      const rows = group.rows || [];
      const placementRows = rows.filter(function (row) {
        return Math.abs(finalCoveragePremium(group, row)) > 0.01 || Math.abs(finalCoverageSum(group, row)) > 0.01;
      });

      placementRows.forEach(function (row) {
        const placement = numberFrom(row, ['proportionCed']) + numberFrom(row, ['proportionRe']);
        if (Math.abs(placement - 1) > 0.0001) {
          errors.push(groupName + ': ' + t('la colocacion de la cobertura') + ' ' + row.coverageCode + ' ' + t('debe sumar 100%.'));
        }
        if (!closeEnough(numberFrom(row, ['premiumCedant']) + numberFrom(row, ['premiumRe']), finalCoveragePremium(group, row))) {
          errors.push(groupName + ': ' + t('la prima distribuida de la cobertura') + ' ' + row.coverageCode + ' ' + t('no coincide con su estado final.'));
        }
        if (!closeEnough(numberFrom(row, ['sumInsuredCedant']) + numberFrom(row, ['sumInsuredRe']), finalCoverageSum(group, row))) {
          errors.push(groupName + ': ' + t('la suma distribuida de la cobertura') + ' ' + row.coverageCode + ' ' + t('no coincide con su estado final.'));
        }
      });

      const cededPremium = sumField(rows, ['premiumRe']);
      const cededSum = sumField(rows, ['sumInsuredRe']);
      const participants = group.participants || [];
      if (cededPremium > 0.01 || cededSum > 0.01) {
        if (!participants.length) {
          errors.push(groupName + ': ' + t('un contrato cedido debe tener aceptantes distribuidos al 100%.'));
        } else {
          const byCession = {};
          participants.forEach(function (participant) {
            const key = String(participant.cessionId || group.contractId);
            if (!byCession[key]) byCession[key] = [];
            byCession[key].push(participant);
          });
          Object.keys(byCession).forEach(function (cessionKey) {
            const split = sumField(byCession[cessionKey], ['split']);
            if (Math.abs(split - 100) > 0.01) {
              errors.push(groupName + ': ' + t('los aceptantes de la cesion') + ' ' + cessionKey + ' ' + t('deben sumar 100%.'));
            }
          });

          if (!closeEnough(sumField(participants, ['sumInsured']), cededSum)) {
            errors.push(groupName + ': ' + t('la suma de aceptantes no coincide con la suma cedida.'));
          }
          if (!closeEnough(sumField(participants, ['premium']), cededPremium)) {
            errors.push(groupName + ': ' + t('la prima de aceptantes no coincide con la prima cedida.'));
          }
          if (!closeEnough(sumField(participants, ['commission']), sumField(rows, ['commission']))) {
            errors.push(groupName + ': ' + t('la comision de aceptantes no coincide con la linea.'));
          }
          if (!closeEnough(sumField(participants, ['tax']), sumField(rows, ['tax']))) {
            errors.push(groupName + ': ' + t('el impuesto de aceptantes no coincide con la linea.'));
          }
        }
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
        return Promise.all([
          exe('GetFullTable', { table: 'cfgCoberturaProductoReaFianza' }),
          exe('RepoCurrency', { operation: 'GET', filter: "code='" + txt(p.currency).replace(/'/g, "''") + "'", size: 1 }),
          exe('RepoCession', { operation: 'GET', filter: 'lifePolicyId=' + id + ' AND overwritten=0' })
        ]).then(function (responses) {
          const tr = responses[0];
          const currencyResponse = responses[1];
          const currency = currencyResponse && currencyResponse.outData && currencyResponse.outData[0];
          setBaseCessions((responses[2] && responses[2].outData) || []);
          setPolicy(Object.assign({}, p, { Currency: currency || p.Currency }));
          setLoading(false);
          let rows = (tr && tr.outData) || [];
          if (typeof rows === 'string') rows = JSON.parse(rows);
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
            if (c === '313' || (row && row.principal === '-1')) {
              list.push({ code: c, name: covs[i].name, end: covs[i].end, start: covs[i].start, premium: covs[i].premium });
            }
          }
          setEligible(list);
          if (list.length) {
            setCovCode(list[0].code);
            if (list[0].end) {
              setNewEnd(moment(day10(list[0].end), 'YYYY-MM-DD', true));
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
    if (!v) { setError(t('Indique el numero o el codigo de la poliza')); return; }
    invalidate(); setPolicy(null); setEligible([]); setCovCode(null); setNewEnd(null);
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

  const selected = (function () {
    for (let i = 0; i < eligible.length; i++) { if (eligible[i].code === covCode) return eligible[i]; }
    return null;
  })();

  // la distribucion en memoria se invalida en cuanto cambia el calculo o la poliza
  function invalidate() { setCalc(null); setSim(null); setResult(null); setKey(null); setSplits([]); }

  // edicion de aceptantes: se guarda la participacion cambiada y se vuelve a simular
  function editarSplit(cessionId, contactId, value) {
    const next = [];
    for (let i = 0; i < splits.length; i++) {
      const x = splits[i];
      if (x.cessionId === cessionId && x.contactId === contactId) continue;
      next.push(x);
    }
    next.push({ cessionId: cessionId, contactId: contactId, split: Number(value || 0) });
    setSplits(next);
    setSim(null);
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
    const cededPremium = getGroupCurrentAmount(group, 'premiumRe');
    const commissionRate = cededPremium
      ? getGroupCurrentAmount(group, ['commission', 'comissionCedant']) / cededPremium
      : 0;
    const taxRate = cededPremium ? getGroupCurrentAmount(group, 'tax') / cededPremium : 0;
    (group.rows || []).forEach(function (row) {
      const finalPremium = finalCoveragePremium(group, row);
      const finalSum = finalCoverageSum(group, row);
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
      const split = (Number(participant.split) || 0) / 100;
      participant.sumInsured = money(numberFrom(group.totals, ['sumRe']) * split);
      participant.premium = money(numberFrom(group.totals, ['re']) * split);
      participant.commission = money(numberFrom(group.totals, ['commission']) * split);
      participant.tax = money(numberFrom(group.totals, ['tax']) * split);
    });
    return group;
  }

  // ------------------------------------------------------------- pestania 1
  function calcular() {
    setError(null); setResult(null);
    if (!covCode) { setError(t('Seleccione la cobertura a endosar')); return; }
    if (!newEnd) { setError(t('Indique la nueva fecha final')); return; }
    setLoading(true);
    setSim(null);
    const ctx = {
      policyId: policyId, coverageCode: covCode,
      newEnd: moment(newEnd).format('YYYY-MM-DD'),
      surcharge: Number(surcharge || 0), discount: Number(discount || 0)
    };
    exe('ExeChain', { chain: 'cmdCalcChangeCoverageSurety', context: JSON.stringify(ctx) })
      .then(function (r) {
        if (!r || !r.ok) {
          setLoading(false);
          setError(String((r && r.msg) || t('Error de calculo')).replace(/formula ->[\s\S]*/, '').trim());
          return null;
        }
        let o = r.outData;
        if (typeof o === 'string') o = JSON.parse(o);
        if (o && o.length !== undefined && o.length >= 0 && !o.rows) o = o[0];
        setCalc(o);
        setKey('AXX299-' + policyId + '-' + covCode + '-' + moment().format('YYYYMMDDHHmmss'));
        // la cotizacion nativa no es de solo lectura: deja una fila de impuesto deshabilitada
        return exe('ExeChain', {
          chain: 'cmdSweepQuoteResidueSuretyAxx299',
          context: JSON.stringify({ policyId: policyId })
        }).then(function () { setLoading(false); return null; });
      })
      .catch(function (e) { setLoading(false); setError(String(e)); });
  }

  // recargo y descuento recalculan sin borrar lo capturado
  function onAjuste(kind, value) {
    const v = value === null || value === undefined ? 0 : Number(value);
    if (kind === 'surcharge') setSurcharge(v); else setDiscount(v);
    setSim(null);
  }

  // ------------------------------------------------------------- pestania 2
  function simular() {
    if (!calc) { setError(t('Calcule el endoso antes de simular el reaseguro')); return; }
    setSimLoading(true); setError(null);
    const rows = [];
    for (let i = 0; i < calc.rows.length; i++) {
      // el prorrateado es la base sobre la que el endoso reparte la cesion; sin el, la
      // simulacion anuncia un reparto que no es el que se escribe
      rows.push({ code: calc.rows[i].code, variation: calc.rows[i].variation, prorated: calc.rows[i].prorated });
    }
    exe('ExeChain', {
      chain: 'cmdSimReaChangeCoverageSuretyAxx299',
      context: JSON.stringify({ policyId: policyId, rows: rows, participants: splits })
    })
      .then(function (r) {
        setSimLoading(false);
        if (!r || !r.ok) { setError(String((r && r.msg) || '').replace(/formula ->[\s\S]*/, '').trim()); return; }
        let o = r.outData;
        if (typeof o === 'string') o = JSON.parse(o);
        if (o && o.length !== undefined && !o.contracts) o = o[0];
        (o.contracts || []).forEach(function (group) { hydrateFinalDistribution(group); });
        setSim(o);
        setSelectedReinsuranceKey(o && o.contracts && o.contracts.length ? String(o.contracts[0].contractId) : null);
      })
      .catch(function (e) { setSimLoading(false); setError(String(e)); });
  }

  // Tambien cuando una edicion invalida la distribucion: sin `sim` en las dependencias, editar
  // o agregar un aceptante limpiaba la simulacion y nadie la volvia a pedir.
  useEffect(function () {
    if (tab === 'rea' && calc && !sim && !simLoading) simular();
  }, [tab, calc, sim, splits]);

  // ------------------------------------------------------------- ejecucion
  function ejecutar() {
    if (lock.busy || running) return;          // proteccion contra doble clic y doble envio
    if (!txt(note)) { setNoteTouched(true); return; }
    const distributionValidation = validateReinsuranceDistribution();
    if (!distributionValidation.ok) {
      setError(distributionValidation.errors.join(' '));
      return;
    }
    lock.busy = true;
    setRunning(true); setError(null);
    const expected = {
      coveragePremium: calc.rows[0].adjustedPremium,
      variation: calc.rows[0].variation,
      premiumAfter: calc.billing.premium.after,
      taxAfter: calc.billing.tax.after,
      totalAfter: calc.billing.total.after,
      newEnd: calc.rows[0].newEnd
    };
    const base = {
      policyId: policyId, coverageCode: covCode,
      newEnd: moment(newEnd).format('YYYY-MM-DD'),
      surcharge: Number(surcharge || 0), discount: Number(discount || 0),
      note: txt(note), key: key
    };
    const regCtx = JSON.parse(JSON.stringify(base));
    regCtx.expected = expected;

    exe('ExeChain', { chain: 'cmdExeChangeCoverageSuretyAxx299', context: JSON.stringify(regCtx) })
      .then(function (r) {
        if (!r || !r.ok) { throw new Error(String((r && r.msg) || '').replace(/formula ->[\s\S]*/, '').trim()); }
        let reg = r.outData;
        if (typeof reg === 'string') reg = JSON.parse(reg);
        if (reg && reg.length !== undefined && !reg.changeId) reg = reg[0];
        // Ya procesado y aplicado: no se vuelve a ejecutar.
        if (reg.duplicate && !reg.resumable) { return { done: true, reg: reg }; }
        // Registrado y sin aplicar: la cadena devuelve la entidad lista y aqui se continua.
        const filas = reg.resumable && reg.rows ? reg.rows : calc.rows;
        // el ADD deja la entidad trackeada: el UPDATE que fija las vigencias va en OTRO request
        return exe('ChangeCoverage', { Entity: reg.patchEntity, operation: 'UPDATE' })
          .then(function (u) {
            if (!u || !u.ok) { throw new Error(t('No se pudieron fijar las vigencias calculadas') + ': ' + ((u && u.msg) || '')); }
            const rows = [];
            for (let i = 0; i < filas.length; i++) {
              rows.push({ code: filas[i].code, newStart: filas[i].newStart, newEnd: filas[i].newEnd });
            }
            // la distribucion que el usuario vio viaja al cierre para cotejarla con la escrita
            const dist = [];
            const parts = [];
            if (sim && sim.contracts) {
              for (let g = 0; g < sim.contracts.length; g++) {
                const grp = sim.contracts[g];
                for (let k = 0; k < grp.rows.length; k++) {
                  const rr = grp.rows[k];
                  dist.push({ contractId: grp.contractId, lineId: grp.lineId, coverageCode: rr.coverageCode, premiumMovement: rr.premiumMovement, premiumCedant: rr.premiumCedant, premiumRe: rr.premiumRe, commission: rr.commission });
                }
                for (let k = 0; k < (grp.participants || []).length; k++) {
                  const pp = grp.participants[k];
                  parts.push({ coverageCode: pp.coverageCode, contactId: pp.contactId, split: pp.split, premium: pp.premium, commission: pp.commission, lineId: pp.lineId });
                }
              }
            }
            return exe('ExeChain', {
              chain: 'cmdFinishChangeCoverageSuretyAxx299',
              context: JSON.stringify({ changeId: reg.changeId, key: key, rows: rows, distribution: dist })
            }).then(function (f) {
              if (!f || !f.ok) { throw new Error(String((f && f.msg) || '').replace(/formula ->[\s\S]*/, '').trim()); }
              let fin = f.outData;
              if (typeof fin === 'string') fin = JSON.parse(fin);
              if (fin && fin.length !== undefined && !fin.stage) fin = fin[0];
              if (!fin.ok || !fin.executed || !dist.length) return { done: true, reg: reg, fin: fin };
              // El reparto que escribe el motor puede diferir en el ultimo centavo, y las
              // participaciones editadas no las escribe el endoso: aqui se persiste lo CONFIRMADO,
              // acotado al movimiento, y se comprueba la igualdad exacta.
              return exe('ExeChain', {
                chain: 'cmdApplyReaChangeCoverageSuretyAxx299',
                context: JSON.stringify({ changeId: reg.changeId, distribution: dist, participants: parts })
              }).then(function (ap) {
                if (!ap || !ap.ok) { throw new Error(String((ap && ap.msg) || '').replace(/formula ->[\s\S]*/, '').trim()); }
                let app = ap.outData;
                if (typeof app === 'string') app = JSON.parse(app);
                if (app && app.length !== undefined && !app.stage) app = app[0];
                return { done: true, reg: reg, fin: fin, app: app };
              });
            });
          });
      })
      .then(function (o) {
        lock.busy = false;
        setRunning(false); setModal(false);
        const shownResult = o.app ? JSON.parse(JSON.stringify(o.app)) : (o.fin || o.reg);
        if (o.app && o.fin) { shownResult.msg = o.fin.msg + ' ' + o.app.msg; }
        setResult(shownResult);
        if (!o.fin || o.fin.ok) { setSim(null); loadPolicy(policyId); }   // distribucion invalidada tras exito
      })
      .catch(function (e) {
        lock.busy = false; setRunning(false); setModal(false);
        setError(String(e && e.message ? e.message : e));
        // la cotizacion del registro deja una fila de impuesto: no se abandona tras un fallo
        exe('ExeChain', { chain: 'cmdSweepQuoteResidueSuretyAxx299', context: JSON.stringify({ policyId: policyId }) });
      });
  }

  // ------------------------------------------------------------- columnas
  const colsGrid = [
    { title: t('Codigo'), dataIndex: 'code', width: 80 },
    { title: t('Nombre'), dataIndex: 'name' },
    { title: t('Tipo'), dataIndex: 'reason', width: 110, render: function (v) { return v === 'SELECTED' ? <Tag color="blue">{t('Seleccionada')}</Tag> : <Tag>{t('Recalculada')}</Tag>; } },
    { title: t('Prima anterior'), dataIndex: 'oldPremium', align: 'right', width: 120, render: function (v) { return <span className="axx-antes">{fmt(v)}</span>; } },
    { title: t('Vigencia inicial anterior'), dataIndex: 'oldStart', width: 140, render: function (v) { return <span className="axx-antes">{day10(v)}</span>; } },
    { title: t('Vigencia final anterior'), dataIndex: 'oldEnd', width: 140, render: function (v) { return <span className="axx-antes">{day10(v)}</span>; } },
    { title: t('Nueva prima'), dataIndex: 'newPremium', align: 'right', width: 120, render: function (v) { return <span className="axx-nuevo">{fmt(v)}</span>; } },
    { title: t('Variacion'), dataIndex: 'variation', align: 'right', width: 110, render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } },
    { title: t('Nueva vigencia inicial'), dataIndex: 'newStart', width: 140, render: function (v, row) { return <span className={row.oldStart === row.newStart ? '' : 'axx-nuevo'}>{day10(v)}</span>; } },
    { title: t('Nueva vigencia final'), dataIndex: 'newEnd', width: 140, render: function (v) { return <span className="axx-nuevo">{day10(v)}</span>; } }
  ];

  const colsResumen = [
    { title: t('Concepto'), dataIndex: 'label' },
    { title: t('Anterior'), dataIndex: 'before', align: 'right', render: function (v) { return <span className="axx-antes">{fmt(v)}</span>; } },
    { title: t('Calculado'), dataIndex: 'calculated', align: 'right', render: function (v) { return fmt(v); } },
    { title: t('Nuevo'), dataIndex: 'after', align: 'right', render: function (v) { return <span className="axx-nuevo">{fmt(v)}</span>; } }
  ];

  const filasResumen = calc ? [
    { key: 'p', label: t('Prima'), before: calc.billing.premium.before, calculated: calc.billing.premium.calculated, after: calc.billing.premium.after },
    { key: 'a', label: t('Ajustes'), before: calc.billing.adjustments.before, calculated: calc.billing.adjustments.calculated, after: calc.billing.adjustments.after },
    { key: 'g', label: t('Gasto'), before: calc.billing.fee.before, calculated: calc.billing.fee.calculated, after: calc.billing.fee.after },
    { key: 'i', label: t('Impuesto'), before: calc.billing.tax.before, calculated: calc.billing.tax.calculated, after: calc.billing.tax.after },
    { key: 'T', label: t('Total'), before: calc.billing.total.before, calculated: calc.billing.total.calculated, after: calc.billing.total.after }
  ] : [];

  const colsAceptantes = [
    { title: t('Cobertura'), dataIndex: 'coverageCode', width: 100 },
    { title: t('Aceptante'), dataIndex: 'contactId', width: 120 },
    { title: t('Linea'), dataIndex: 'lineId', width: 130 },
    {
      title: t('Participacion %'), dataIndex: 'split', width: 150, render: function (v, row) {
        return <InputNumber size="small" min={0} max={100} step={1} value={v} style={{ width: 110 }}
          onChange={function (x) { editarSplit(row.cessionId, row.contactId, x); }} />;
      }
    },
    { title: t('Prima cedida'), dataIndex: 'premium', align: 'right', width: 130, render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } },
    { title: t('Comision'), dataIndex: 'commission', align: 'right', width: 120, render: function (v) { return fmt(v); } }
  ];

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
    { title: t('% Retencion'), dataIndex: 'proportionCed', align: 'right', width: 120, render: function (v) { return (Number(v || 0) * 100).toFixed(2) + '%'; } },
    { title: t('Suma retencion'), dataIndex: 'sumInsuredCedant', align: 'right', width: 130, render: function (v) { return fmt(v); } },
    { title: t('Prima retencion'), dataIndex: 'premiumCedant', align: 'right', width: 130, render: function (v) { return fmt(v); } },
    { title: t('% Cedido'), dataIndex: 'proportionRe', align: 'right', width: 110, render: function (v) { return (Number(v || 0) * 100).toFixed(2) + '%'; } },
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
          movementType: calc && calc.direction === 'EXTENSION' ? t('Extension') : t('Endoso'),
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
          onClick={function (event) { event.stopPropagation(); setReaDetailTab('reinsurers'); }}><FolderIcon /></Button> : null}
      </span>;
    } },
    { title: t('Porcentaje (%)'), dataIndex: 'percentage', align: 'right', width: 135, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={4} onCommit={function (x) { editContractPercentage(row.groupKey, row.percentageField, x); }} />;
    } },
    { title: t('Suma'), dataIndex: 'sum', align: 'right', width: 135, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={2} onCommit={function (x) { setManualContractAmount(row.groupKey, row.manualPrefix + 'Sum', x); }} />;
    } },
    { title: t('Prima'), dataIndex: 'premium', align: 'right', width: 135, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={2} onCommit={function (x) { setManualContractAmount(row.groupKey, row.manualPrefix + 'Premium', x); }} />;
    } },
    { title: t('% Comision'), dataIndex: 'commissionPercentage', align: 'right', width: 135, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={4} disabled={row.isRetention} onCommit={function (x) { editContractRate(row.groupKey, 'commission', x); }} />;
    } },
    { title: t('Comision'), dataIndex: 'commission', align: 'right', width: 135, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={2} disabled={row.isRetention} onCommit={function (x) { setManualContractAmount(row.groupKey, 'Commission', x); }} />;
    } },
    { title: t('% Impuesto'), dataIndex: 'taxPercentage', align: 'right', width: 135, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={4} disabled={row.isRetention} onCommit={function (x) { editContractRate(row.groupKey, 'tax', x); }} />;
    } },
    { title: t('Impuesto'), dataIndex: 'tax', align: 'right', width: 135, render: function (v, row) {
      return <EditableFormattedNumber value={v} decimals={2} disabled={row.isRetention} onCommit={function (x) { setManualContractAmount(row.groupKey, 'Tax', x); }} />;
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
      const commission = base.commission + numberFrom(totals, ['commission']);
      const tax = base.tax + numberFrom(totals, ['tax']);
      // La distribucion debe cerrar contra el total del movimiento del grupo.
      // Los campos cedente/cedido de la base pueden incluir ya la variacion,
      // por lo que no se vuelven a sumar para obtener el total.
      const fallbackGroupTotalPremium = base.premium + numberFrom(totals, ['movement']);
      const fallbackGroupTotalSum = base.sum + numberFrom(totals, ['sumMovement']);
      const groupTotalPremium = contract.groups.length === 1
        ? getContractTotal(g || { contractId: contract.contractId }, 'movement', fallbackGroupTotalPremium)
        : fallbackGroupTotalPremium;
      const groupTotalSum = contract.groups.length === 1
        ? getContractTotal(g || { contractId: contract.contractId }, 'sum', fallbackGroupTotalSum)
        : fallbackGroupTotalSum;
      const groupKey = g ? String(g.contractId) + '-' + String(g.lineId) : String(contract.contractId) + '-' + definition.key;
      // Retencion puede reutilizar el grupo de Cuota Parte; la fila visual
      // necesita una clave propia para que React no mezcle sus valores.
      const lineKey = groupKey + '-' + definition.key;
      const isCededLine = !isRetention && definition.key !== 'NO TECNICA';
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
      const finalPremiumRet = isRetention ? groupTotalPremium * retentionPercentage / 100 : 0;
      const finalSumRet = isRetention ? groupTotalSum * retentionPercentage / 100 : 0;
      const finalPremiumCed = isCededLine ? groupTotalPremium * cededPercentage / 100 : 0;
      const finalSumCed = isCededLine ? groupTotalSum * cededPercentage / 100 : 0;
      const manualSumField = isRetention ? 'manualRetentionSum' : 'manualCededSum';
      const manualPremiumField = isRetention ? 'manualRetentionPremium' : 'manualCededPremium';
      const displaySum = totals[manualSumField] !== undefined ? Number(totals[manualSumField]) : (isRetention ? finalSumRet : finalSumCed);
      const displayPremium = totals[manualPremiumField] !== undefined ? Number(totals[manualPremiumField]) : (isRetention ? finalPremiumRet : finalPremiumCed);
      const displayCommission = isRetention ? 0 : (totals.manualCommission !== undefined ? Number(totals.manualCommission) : commission);
      const displayTax = isRetention ? 0 : (totals.manualTax !== undefined ? Number(totals.manualTax) : tax);
      return {
        key: lineKey,
        groupKey: groupKey,
        contractLabel: definition.label,
        isRetention: isRetention,
        canViewReinsurers: isCededLine,
        manualPrefix: isRetention ? 'Retention' : 'Ceded',
        percentageField: isRetention ? 'proportionCed' : 'proportionRe',
        percentageConfigured: g && totals[isRetention ? 'distributionPercentageCed' : 'distributionPercentageRe'] !== undefined,
        percentage: g && totals[isRetention ? 'distributionPercentageCed' : 'distributionPercentageRe'] !== undefined
          ? Number(totals[isRetention ? 'distributionPercentageCed' : 'distributionPercentageRe'])
          : (g ? contractPercentage(g, isRetention ? 'proportionCed' : 'proportionRe') : 0),
        sum: displaySum,
        premium: displayPremium,
        amountField: isRetention ? 'sumInsuredCedant' : 'sumInsuredRe',
        premiumField: isRetention ? 'premiumCedant' : 'premiumRe',
        premiumRet: finalPremiumRet,
        sumRet: finalSumRet,
        premiumCed: finalPremiumCed,
        sumCed: finalSumCed,
        commissionPercentage: isRetention ? 0 : (g && totals.commissionPercentage !== undefined
          ? Number(totals.commissionPercentage)
          : ((finalPremiumCed || finalPremiumRet) ? Number((displayCommission / (finalPremiumCed || finalPremiumRet) * 100).toFixed(2)) : 0)),
        commission: displayCommission,
        taxPercentage: isRetention ? 0 : (g && totals.taxPercentage !== undefined
          ? Number(totals.taxPercentage)
          : ((finalPremiumCed || finalPremiumRet) ? Number((displayTax / (finalPremiumCed || finalPremiumRet) * 100).toFixed(2)) : 0)),
        tax: displayTax,
        reinsuranceBalance: money(finalPremiumCed - displayCommission),
        movementPremium: premium
      };
    });
    const totalSum = rows.reduce(function (sum, row) { return sum + Number(row.sum || 0); }, 0);
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
                <Table.Summary.Cell index={1} align="right">{total('percentage').toFixed(2)}</Table.Summary.Cell>
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
    return contract.groups.map(function (g) {
      const groupKey = String(g.contractId) + '-' + String(g.lineId);
      const groupRows = (g.rows || []).map(function (row) {
        return Object.assign({}, row, { _groupKey: groupKey });
      });
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
              dataSource={groupRows} columns={colsRea} />
          ) : null}
          {mode === 'reinsurers' && g.participants && g.participants.length ? (
            <>
            <div className="axx-aceptantes-barra">
              <span>{t('Agregar aceptante del contrato')}:</span>
              {(function () {
                const faltan = (g.contractParticipants || []).filter(function (cp) {
                  return !(g.participants || []).some(function (p) { return p.contactId === cp.contactId; });
                });
                if (!faltan.length) return <span>{t('todos los aceptantes del contrato ya participan')}</span>;
                const cesionPrincipal = g.rows && g.rows.length ? g.rows[0].basedOnCessionId : 0;
                return faltan.map(function (cp) {
                  return <Button key={'add' + cp.contactId} size="small"
                    onClick={function () { editarSplit(cesionPrincipal, cp.contactId, cp.contractSplit); }}>
                    {t('Aceptante') + ' ' + cp.contactId + ' (' + cp.lineId + ' ' + cp.contractSplit + '%)'}
                  </Button>;
                });
              })()}
            </div>
            <Table className="axx-aceptantes" size="small" pagination={false}
              rowKey={function (r) { return r.cessionId + '-' + r.contactId; }}
              dataSource={g.participants} columns={colsAceptantes}
              title={function () { return t('Aceptantes de la linea') + ' — ' + t('cedido distribuido') + ' ' + fmt(g.totals.participantPremium); }} />
            </>
          ) : null}
          {mode === 'reinsurers' && (!g.participants || !g.participants.length)
            ? <Empty description={t('No hay reaseguradores para esta linea')} /> : null}
        </div>
      );
    });
  }

  const css = `
.axx299 { display:flex; flex-direction:column; min-width:0; overflow:hidden; font-size:13px; }
.axx299 .axx-topbar { display:flex; align-items:center; gap:8px; padding:4px 0; margin:0 4px 2px 4px;
          background:transparent; border:1px solid #e6ebf2; border-radius:6px; }
.axx299 .axx-topbar > * { margin-left:4px; }
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
.axx299 .axx-rea-actions { display:flex; align-items:center; gap:8px; padding:6px 8px; margin-bottom:6px; background:#e6f4ff; border:1px solid #91caff; border-radius:4px; color:#334155; font-size:12px; }
`;

  const puedeEjecutar = !!(calc && calc.rows && calc.rows.length && !running);
  const reinsuranceValidation = calc && sim
    ? validateReinsuranceDistribution()
    : { ok: false, errors: [t('La distribución de reaseguro todavía no está cargada.')] };
  const openedWithPolicy = /[?&]policyId=\d+/.test(String(window.location.href || ''));

  return (
    <DefaultPage title={t('Endoso de vigencia de Fianzas')} subTitle={policy ? policy.code : ''}>
      <div className="axx299">
        <style>{css}</style>

        <div className="axx-status">
          <b>{t('Poliza')}:</b> {policy ? policy.code + ' — ' + ((policy.Product && (policy.Product.name || policy.Product.description)) || policy.productCode) + ' — ' + ((policy.Currency && (policy.Currency.name || policy.Currency.description)) || policy.currency) : t('sin cargar')}
          {policy ? <span>{' | '}<b>{t('Estado')}:</b> {policy.entityState === 'ACTIVE' ? t('Activo') : (policy.entityState === 'INACTIVE' ? t('Inactivo') : t(policy.entityState))}</span> : null}
          {calc ? <span>{' | '}<b>{t('Movimiento')}:</b> {calc.direction === 'EXTENSION' ? t('Extension') : t('Reduccion')} ({calc.deltaDays} {t('dias')})</span> : null}
        </div>

        <div className="axx-topbar">
          <Button className="axx-btn-sec" onClick={retornarAPoliza} disabled={!policyId}>
            {t('Retornar')}
          </Button>
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
              key: 'calc', label: t('Calculo de cobertura'), children: (
                <div className="axx-panel">
                  <Card bordered={false}>
                    <div className="axx-filtros">
                      <div className="axx-campo" style={{ minWidth: 260 }}>
                        <label>{t('Cobertura a endosar')}</label>
                        <Select id="cbxCobertura" value={covCode} style={{ width: 260 }}
                          onChange={function (v) {
                            setCovCode(v);
                            const selectedCoverage = eligible.find(function (item) { return item.code === v; });
                            setNewEnd(selectedCoverage && selectedCoverage.end
                              ? moment(day10(selectedCoverage.end), 'YYYY-MM-DD', true)
                              : null);
                            invalidate();
                          }}
                          options={eligible.map(function (c) { return { value: c.code, label: c.code + ' — ' + c.name }; })} />
                      </div>
                      <div className="axx-campo">
                        <label>{t('Fecha final actual')}</label>
                        <Input id="txtFinActual" readOnly style={{ width: 140 }} value={selected ? day10(selected.end) : ''} />
                      </div>
                      <div className="axx-campo">
                        <label>{t('Nueva fecha final')}</label>
                        <DatePicker id="dtpNuevoFin" style={{ width: 150 }} value={newEnd}
                          onChange={function (v) { setNewEnd(v); invalidate(); }} />
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
                        disabled={!covCode || !newEnd} onClick={calcular}>{t('Calcular endoso')}</Button>
                    </div>

                    <Spin spinning={loading}>
                      {calc ? (
                        <div>
                          <Table className="axx-grilla" size="small" pagination={false} rowKey="code"
                            dataSource={calc.rows} columns={colsGrid} scroll={{ y: altoGrilla }} />
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
                      ) : <Empty description={t('Indique la nueva fecha final y pulse Calcular endoso')} />}
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
                      message={t('Simulacion en memoria: no se escribe en Cession hasta ejecutar el endoso')} />
                    <Spin spinning={simLoading}>
                      {!calc ? <Empty description={t('Calcule el endoso en la primera pestania')} /> : null}
                      {calc && sim && sim.contracts && sim.contracts.length ? (
                        <div>
                          <Table className="axx-rea-contracts" size="small" pagination={false} rowKey="key"
                            dataSource={contractRows} columns={colsContracts}
                            rowSelection={{ type: 'radio', selectedRowKeys: selectedReinsuranceKey ? [selectedReinsuranceKey] : [], onChange: function (keys) { setSelectedReinsuranceKey(keys[0] || null); } }}
                            onRow={function (row) { return { onClick: function () { setSelectedReinsuranceKey(row.key); } }; }} />
                          {contractRows.filter(function (row) { return row.key === selectedReinsuranceKey; }).map(function (contract) {
                            return (
                              <Tabs className="axx-rea-detail-tabs" type="card" activeKey={reaDetailTab} onChange={setReaDetailTab}>
                                <Tabs.TabPane tab={t('Distribucion')} key="distribution">
                                  <div className="axx-rea-actions">
                                    <Button type="primary" onClick={guardarDistribucionMemoria}>{t('Guardar')}</Button>
                                    <span>{t('Los cambios se mantienen en memoria hasta ejecutar el endoso.')}</span>
                                  </div>
                                  {renderSelectedLines(contract, 'distribution')}
                                </Tabs.TabPane>
                                <Tabs.TabPane tab={t('Reaseguradores')} key="reinsurers">
                                  {renderSelectedLines(contract, 'reinsurers')}
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
                          <Alert
                            type={money(sim.movement) === money(calc.billing.movement.premium) ? 'success' : 'warning'}
                            showIcon
                            message={t('Validacion de distribucion')}
                            description={
                              t('Prima del endoso') + ': ' + fmt(calc.billing.movement.premium) +
                              ' | ' + t('Prima distribuida') + ': ' + fmt(sim.movement) +
                              ' | ' + t('Diferencia') + ': ' + fmt(money(sim.movement - calc.billing.movement.premium))
                            }
                          />
                          <div className="axx-pie">
                            {t('Base de reparto')}: {t('importe prorrateado del movimiento')} ({conSigno(sim.proratedMovement)}) {' | '}
                            {t('Movimiento total')}: {conSigno(sim.movement)} {' | '}
                            {t('Distribuido')}: {conSigno(sim.distributed)} {' | '}
                            {sim.balanced ? <Tag color="blue">{t('Cuadrado')}</Tag> : <Tag color="red">{t('Descuadrado')}</Tag>}
                          </div>
                        </div>
                      ) : null}
                      {calc && sim && (!sim.contracts || !sim.contracts.length)
                        ? <Empty description={sim.msg || t('La poliza no tiene reaseguro vigente para este movimiento')} /> : null}
                    </Spin>
                  </Card>
                </div>
              )
            }
          ]} />

        <div className="axx-pie">
          <Button id="btnEjecutar" type="primary" disabled={!puedeEjecutar || !sim || !reinsuranceValidation.ok} loading={running}
            onClick={function () { setNote(''); setNoteTouched(false); setModal(true); }}>{t('Ejecutar endoso')}</Button>
        </div>

        <Modal wrapClassName="axx299-modal" title={t('Confirmar ejecucion del endoso')} open={modal}
          okText={t('Confirmar')} cancelText={t('Cancelar')} confirmLoading={running}
          okButtonProps={{ id: 'btnConfirmar', disabled: running }}
          onOk={ejecutar}
          onCancel={function () { if (!running) { setModal(false); } }}>
          <div>
            {calc ? (
              <div style={{ marginBottom: 8 }}>
                {t('Cobertura')} <b>{calc.rows[0].code}</b>: {day10(calc.rows[0].oldEnd)} → <b>{day10(calc.rows[0].newEnd)}</b><br />
                {t('Prima')} {fmt(calc.rows[0].oldPremium)} → <b>{fmt(calc.rows[0].adjustedPremium)}</b> {calc.billing.currency}
                {' '}({conSigno(calc.rows[0].variation)})<br />
                {t('Total de la poliza')} {fmt(calc.billing.total.before)} → <b>{fmt(calc.billing.total.after)}</b>
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
