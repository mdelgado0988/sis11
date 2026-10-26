//block
//noreplace

/**
 * @name cmdUpdatePolicyRenewalPeriod
 * @author Michael Delgado
 * @email michael.delgado@axxis-systems.com
 * @created 2026/07/20
 * @version 1.0
 * @purpose Updates the policy and coverage validity period from the policy duration.
 */

try {
  const policyId = getPolicyId(context);
  const renewalPolicyId = getRenewalPolicyId(context);
  const policy = loadPolicy(policyId);
  const renewalPolicy = loadPolicy(renewalPolicyId);

  if (!policy) {
    throw new Error(`No se encontró la póliza ${policyId}`);
  }

  if (!renewalPolicy) {
    throw new Error(`No se encontró la póliza original ${renewalPolicyId}`);
  }

  // The renewal period starts from the end of the policy being renewed.
  const duration = getDuration(renewalPolicy);
  const currentEnd = parseUtcDate(renewalPolicy.end);
  if (!currentEnd) {
    throw new Error('La fecha final de vigencia de la póliza actual no es valida');
  }

  const start = addMinutes(currentEnd, 1);
  if (!start) {
    throw new Error('No fue posible calcular la fecha inicial de la nueva vigencia');
  }

  const end = addDuration(start, duration);
  if (!end || end.getTime() <= start.getTime()) {
    throw new Error('La duracion de la póliza no genera una vigencia valida');
  }

  const period = {
    start: formatUtcDate(start),
    end: formatUtcDate(end)
  };

  updatePolicy(policyId, period);

  const coverages = loadCoverages(policyId);
  coverages.forEach(coverage => {
    updateCoverage(coverage.id, period);
  });

  // Surety keeps tariff coverage dates in the insured object. Those dates can
  // have a different duration than LifeCoverage, so do not synchronize them
  // from the policy coverages.
  const suretyGrid = rebaseSuretyCoverageDates(policy, period.start);

  return {
    ok: true,
    msg: `Vigencia actualizada correctamente para la poliza y ${coverages.length} cobertura(s)`
      + (suretyGrid.updated > 0 ? `; ${suretyGrid.updated} vigencia(s) de fianza recalculada(s)` : '')
  };
} catch (error) {
  return {
    ok: false,
    msg: getErrorMessage(error)
  };
}

function getPolicyId(value) {
  const policyId = toPositiveInteger(value && value.policyId);
  if (policyId <= 0) {
    throw new Error('El parametro policyId es requerido y debe ser valido');
  }

  return policyId;
}

function getRenewalPolicyId(value) {
  const policyId = toPositiveInteger(value && value.renewalPolicyId);
  if (policyId <= 0) {
    throw new Error('El parametro renewalPolicyId es requerido y debe ser valido');
  }

  return policyId;
}

function loadPolicy(policyId) {
  doCmd({
    cmd: 'LoadEntities',
    data: {
      entity: 'LifePolicy',
      fields: 'id,lob,productCode,[start],[end],duration,durationMonths,durationDays',
      filter: `id = ${policyId}`,
      noTracking: true
    }
  });

  const response = typeof LoadEntities === 'undefined' ? null : LoadEntities;
  if (!response || response.ok === false) {
    throw new Error(response && response.msg ? response.msg : 'No fue posible cargar la poliza');
  }

  const rows = Array.isArray(response.outData) ? response.outData : [];
  return rows.length > 0 ? rows[0] : null;
}

function loadCoverages(policyId) {
  doCmd({
    cmd: 'LoadEntities',
    data: {
      entity: 'LifeCoverage',
      fields: 'id,lifePolicyId,[start],[end]',
      filter: `lifePolicyId = ${policyId}`,
      noTracking: true
    }
  });

  const response = typeof LoadEntities === 'undefined' ? null : LoadEntities;
  if (!response || response.ok === false) {
    throw new Error(response && response.msg ? response.msg : 'No fue posible cargar las coberturas de la poliza');
  }

  return Array.isArray(response.outData)
    ? response.outData.filter(coverage => toPositiveInteger(coverage && coverage.id) > 0)
    : [];
}

function getDuration(policy) {
  const years = getNonNegativeNumber(policy.duration);
  const months = getNonNegativeNumber(policy.durationMonths);
  const days = getNonNegativeNumber(policy.durationDays);

  if (years === 0 && months === 0 && days === 0) {
    throw new Error('La poliza no tiene una duracion valida configurada');
  }

  return {
    years: years,
    months: months,
    days: days
  };
}

function updatePolicy(policyId, period) {
  doCmd({
    cmd: 'SetField',
    data: {
      entity: 'LifePolicy',
      entityId: policyId,
      fieldValue: `start='${period.start}', [end]='${period.end}'`,
      raw: true
    }
  });

  if (typeof SetField === 'undefined' || !SetField.ok) {
    throw new Error(typeof SetField !== 'undefined' && SetField.msg
      ? SetField.msg
      : 'No fue posible actualizar la vigencia de la poliza');
  }
}

function updateCoverage(coverageId, period) {
  doCmd({
    cmd: 'SetField',
    data: {
      entity: 'LifeCoverage',
      entityId: coverageId,
      fieldValue: `start='${period.start}', [end]='${period.end}'`,
      raw: true
    }
  });

  if (typeof SetField === 'undefined' || !SetField.ok) {
    throw new Error(`No fue posible actualizar la vigencia de la cobertura ${coverageId}`);
  }
}

function rebaseSuretyCoverageDates(policy, renewalStart) {
  const suretyLobs = ['81', '82', '83', '84'];
  if (suretyLobs.indexOf(String(policy && policy.lob || '').trim()) < 0) {
    return { updated: 0 };
  }

  const policyStart = formatPanamaCalendarDate(renewalStart);
  if (!policyStart) {
    throw new Error('No fue posible obtener la nueva fecha inicial de la fianza');
  }

  const insuredObject = loadSuretyInsuredObject(policy.id);
  if (!insuredObject) {
    return { updated: 0 };
  }

  const fields = parseJson(insuredObject.jValues, null);
  if (!Array.isArray(fields)) {
    throw new Error(`El objeto asegurado ${insuredObject.id} no tiene jValues valido`);
  }

  const hiddenCobtar = fields.find(field => field && String(field.name || '').trim() === 'hiddenCobtar');
  if (!hiddenCobtar) {
    return { updated: 0 };
  }

  const wasArray = Array.isArray(hiddenCobtar.userData);
  const rawGrid = wasArray ? hiddenCobtar.userData[0] : hiddenCobtar.userData;
  if (rawGrid == null || String(rawGrid).trim() === '') {
    return { updated: 0 };
  }

  const grid = parseJson(rawGrid, null);
  if (!Array.isArray(grid)) {
    throw new Error(`hiddenCobtar del objeto asegurado ${insuredObject.id} no es una lista valida`);
  }

  const dependencies = loadSuretyDependencies(policy.productCode);
  const rows = {};
  grid.forEach(row => {
    const code = String(row && row.coverageCode || '').trim().toUpperCase();
    if (code) rows[code] = row;
  });

  const calculated = {};
  const resolving = {};
  const rootResolving = {};
  const getRoot = code => {
    const normalized = String(code || '').trim().toUpperCase();
    if (!normalized || rootResolving[normalized]) return normalized;
    const parent = String(dependencies[normalized] || '').trim().toUpperCase();
    if (!parent || parent === '0' || parent === 'NULL' || parent === normalized) return normalized;
    rootResolving[normalized] = true;
    const root = getRoot(parent);
    delete rootResolving[normalized];
    return root || normalized;
  };
  const calculate = code => {
    const normalized = String(code || '').trim().toUpperCase();
    if (!normalized || calculated[normalized]) return calculated[normalized];
    const row = rows[normalized];
    if (!row || resolving[normalized]) return null;

    const startKey = findGridKey(row, ['finicial', 'fechainicial']);
    const endKey = findGridKey(row, ['ffinal', 'fechafinal']);
    const daysKey = findGridKey(row, ['duraciondias', 'duraciondia', 'duracion']);
    if (!startKey || !endKey || !daysKey) return null;

    resolving[normalized] = true;
    let start = policyStart;
    const parent = String(dependencies[normalized] || '').trim().toUpperCase();
    if (parent && parent !== '0' && parent !== 'NULL') {
      const principal = calculate(getRoot(normalized));
      if (principal && principal.end) start = principal.end;
    }

    const days = toPositiveNumber(row[daysKey]);
    const end = days > 0 ? addCalendarDays(start, days) : String(row[endKey] || '').trim();
    row[startKey] = start;
    if (end) row[endKey] = end;
    const result = { start: start, end: end };
    calculated[normalized] = result;
    delete resolving[normalized];
    return result;
  };

  Object.keys(rows).forEach(calculate);
  const updated = Object.keys(calculated).length;
  if (!updated) return { updated: 0 };

  const serialized = JSON.stringify(grid);
  hiddenCobtar.userData = wasArray ? [serialized] : serialized;
  saveSuretyInsuredObject(insuredObject, JSON.stringify(fields));
  return { updated: updated };
}

function loadSuretyInsuredObject(policyId) {
  doCmd({
    cmd: 'DoQuery',
    data: {
      sql: 'SELECT TOP 1 io.id, io.objectDefinitionId, io.lifePolicyId, io.jValues, io.jMap, io.jFileUpload, io.alias, io.jDetailList '
        + 'FROM InsuredObject io JOIN ObjectDefinition od ON od.id = io.objectDefinitionId '
        + `WHERE io.lifePolicyId = ${toPositiveInteger(policyId)} AND od.formId = 574`,
      timeout: 60
    }
  });

  const response = typeof DoQuery === 'undefined' ? null : DoQuery;
  if (!response || response.ok === false) {
    throw new Error(response && response.msg ? response.msg : 'No fue posible leer el objeto asegurado de fianza');
  }
  const rows = Array.isArray(response.outData) ? response.outData : [];
  return rows.length ? rows[0] : null;
}

function loadSuretyDependencies(productCode) {
  doCmd({ cmd: 'GetFullTable', data: { table: 'cfgCoberturaProductoReaFianza' } });
  const response = typeof GetFullTable === 'undefined' ? null : GetFullTable;
  if (!response || response.ok === false) {
    throw new Error(response && response.msg ? response.msg : 'No fue posible leer la configuracion de coberturas de fianza');
  }

  const table = Array.isArray(response.outData) ? response.outData : [];
  if (!table.length || !Array.isArray(table[0])) return {};
  const headers = table[0].map(normalizeGridKey);
  const productIndex = findHeaderIndex(headers, ['productcode', 'codigoproducto', 'producto']);
  const coverageIndex = findHeaderIndex(headers, ['coveragecode', 'codigocobertura', 'cobertura']);
  const parentIndex = findHeaderIndex(headers, ['coveragecodedep', 'coberturaprincipal']);
  if (coverageIndex < 0 || parentIndex < 0) return {};

  const dependencies = {};
  table.slice(1).forEach(row => {
    if (!Array.isArray(row)) return;
    if (productIndex >= 0 && String(row[productIndex] || '').trim() !== String(productCode || '').trim()) return;
    const coverage = String(row[coverageIndex] || '').trim().toUpperCase();
    if (coverage) dependencies[coverage] = String(row[parentIndex] || '').trim();
  });
  return dependencies;
}

function saveSuretyInsuredObject(object, jValues) {
  doCmd({
    cmd: 'RepoInsuredObject',
    data: {
      operation: 'UPDATE',
      entity: {
        id: object.id,
        objectDefinitionId: object.objectDefinitionId,
        lifePolicyId: object.lifePolicyId,
        jValues: jValues,
        jMap: object.jMap,
        jFileUpload: object.jFileUpload,
        alias: object.alias,
        jDetailList: object.jDetailList
      }
    }
  });

  if (typeof RepoInsuredObject === 'undefined' || !RepoInsuredObject.ok) {
    throw new Error(typeof RepoInsuredObject !== 'undefined' && RepoInsuredObject.msg
      ? RepoInsuredObject.msg
      : `No fue posible guardar el objeto asegurado ${object.id}`);
  }
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(String(value));
  } catch (_) {
    return fallback;
  }
}

function normalizeGridKey(value) {
  return String(value == null ? '' : value)
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function findGridKey(row, names) {
  const expected = names.map(normalizeGridKey);
  return Object.keys(row || {}).find(key => expected.indexOf(normalizeGridKey(key)) >= 0) || null;
}

function findHeaderIndex(headers, names) {
  const expected = names.map(normalizeGridKey);
  return headers.findIndex(header => expected.indexOf(header) >= 0);
}

function toPositiveNumber(value) {
  const number = Number(String(value == null ? '' : value).replace(/,/g, ''));
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function addCalendarDays(dateText, days) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateText || '').trim());
  if (!match) return '';
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  date.setUTCDate(date.getUTCDate() + days);
  return formatCalendarDate(date);
}

function formatPanamaCalendarDate(value) {
  const date = parseUtcDate(value);
  if (!date) return '';
  return formatCalendarDate(new Date(date.getTime() - (5 * 60 * 60 * 1000)));
}

function formatCalendarDate(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function parseUtcDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw)
    ? raw
    : `${raw}Z`;
  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date;
}

function addDuration(date, duration) {
  const totalMonths = duration.years * 12 + duration.months;
  const sourceDay = date.getUTCDate();
  const result = new Date(date.getTime());

  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + totalMonths);
  result.setUTCDate(Math.min(sourceDay, getDaysInMonth(result.getUTCFullYear(), result.getUTCMonth())));
  result.setUTCDate(result.getUTCDate() + duration.days);

  return result;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function getDaysInMonth(year, month) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function formatUtcDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
}

function getNonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function toPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function getErrorMessage(error) {
  if (error && error.message) {
    return error.message;
  }

  return String(error || 'Error desconocido');
}
