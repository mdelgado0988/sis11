//block
//noreplace

/**
 * @name cmdUpdateSuretyBondValidityByCoverages
 * @author Michael Delgado
 * @created 2026/09/03
 * @version 1.0
 * @purpose Updates a surety bond policy validity and duration from its coverages.
 * @context { policyId }
 */

try {
  const policyId = getPositiveInteger(context && context.policyId);

  if (policyId <= 0) {
    throw new Error('El parámetro policyId es requerido y debe ser válido');
  }

  const policy = loadPolicy(policyId);
  if (!policy) {
    throw new Error(`No se encontró la póliza ${policyId}`);
  }

  const lob = String(policy.lob ?? '').trim();
  if (!["81", "82", "83", "84"].includes(lob)) {
    return {
      ok: true,
      msg: 'Nada que actualizar'
    };
  }

  const coverages = loadCoverages(policyId);
  if (!coverages.length) {
    throw new Error(`La póliza ${policyId} no tiene coberturas`);
  }

  const validity = getCoverageValidity(coverages);
  const duration = getCalendarDuration(validity.start, validity.end);

  updatePolicy(policyId, validity, duration);

  return {
    ok: true,
    msg: 'Vigencia y duración de la póliza actualizadas correctamente',
    outData: {
      policyId,
      lob,
      start: formatDate(validity.start),
      end: formatDate(validity.end),
      duration: duration.years,
      durationMonths: duration.months,
      durationDays: duration.days
    }
  };
} catch (error) {
  return {
    ok: false,
    msg: getErrorMessage(error)
  };
}

function loadPolicy(policyId) {
  doCmd({
    cmd: 'LoadEntities',
    data: {
      entity: 'LifePolicy',
      fields: 'id,lob,[start],[end],duration,durationMonths,durationDays',
      filter: `id = ${policyId}`,
      noTracking: true
    }
  });

  const response = typeof LoadEntities === 'undefined' ? null : LoadEntities;
  if (!response || response.ok === false) {
    throw new Error(response && response.msg
      ? response.msg
      : 'No fue posible cargar la póliza');
  }

  const rows = Array.isArray(response.outData) ? response.outData : [];
  return rows[0] || null;
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
    throw new Error(response && response.msg
      ? response.msg
      : 'No fue posible cargar las coberturas de la póliza');
  }

  return (Array.isArray(response.outData) ? response.outData : [])
    .filter(coverage => coverage && parseDate(coverage.start || coverage.Start)
      && parseDate(coverage.end || coverage.End));
}

function getCoverageValidity(coverages) {
  const dates = coverages.map(coverage => ({
    start: parseDate(coverage.start || coverage.Start),
    end: parseDate(coverage.end || coverage.End)
  }));

  const start = new Date(Math.min(...dates.map(item => item.start.getTime())));
  const end = new Date(Math.max(...dates.map(item => item.end.getTime())));

  if (end.getTime() < start.getTime()) {
    throw new Error('Las fechas de vigencia de las coberturas no son válidas');
  }

  return { start, end };
}

function getCalendarDuration(start, end) {
  let years = end.getUTCFullYear() - start.getUTCFullYear();
  let cursor = addYears(start, years);

  if (cursor.getTime() > end.getTime()) {
    years -= 1;
    cursor = addYears(start, years);
  }

  let months = (end.getUTCFullYear() - cursor.getUTCFullYear()) * 12
    + end.getUTCMonth() - cursor.getUTCMonth();
  cursor = addMonths(cursor, months);

  if (cursor.getTime() > end.getTime()) {
    months -= 1;
    cursor = addMonths(cursor, months);
  }

  const days = Math.floor((end.getTime() - cursor.getTime()) / 86400000);

  return { years, months, days };
}

function addYears(date, years) {
  const result = new Date(date.getTime());
  const month = result.getUTCMonth();
  result.setUTCDate(1);
  result.setUTCFullYear(result.getUTCFullYear() + years);
  result.setUTCMonth(month);
  result.setUTCDate(Math.min(date.getUTCDate(), getDaysInMonth(result.getUTCFullYear(), month)));
  return result;
}

function addMonths(date, months) {
  const result = new Date(date.getTime());
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  result.setUTCDate(Math.min(day, getDaysInMonth(result.getUTCFullYear(), result.getUTCMonth())));
  return result;
}

function getDaysInMonth(year, month) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function updatePolicy(policyId, validity, duration) {
  doCmd({
    cmd: 'SetField',
    data: {
      entity: 'LifePolicy',
      entityId: policyId,
      fieldValue: [
        `start='${formatDate(validity.start)}'`,
        `[end]='${formatDate(validity.end)}'`,
        `duration=${duration.years}`,
        `durationMonths=${duration.months}`,
        `durationDays=${duration.days}`
      ].join(', '),
      raw: true
    }
  });

  if (typeof SetField === 'undefined' || !SetField || !SetField.ok) {
    throw new Error(SetField && SetField.msg
      ? SetField.msg
      : 'No fue posible actualizar la vigencia y duración de la póliza');
  }
}

function parseDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw)
    ? raw
    : `${raw}Z`;
  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
}

function escapeSql(value) {
  return String(value || '').replace(/'/g, "''");
}

function getPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function getErrorMessage(error) {
  return error && error.message ? error.message : String(error || 'Error desconocido');
}
