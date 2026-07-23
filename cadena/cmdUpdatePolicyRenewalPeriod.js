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
    throw new Error(`No se encontrÃ³ la pÃ³liza original ${renewalPolicyId}`);
  }

  // The renewal period starts from the end of the policy being renewed.
  const duration = getDuration(renewalPolicy);
  const currentEnd = parseUtcDate(renewalPolicy.end);
  if (!currentEnd) {
    throw new Error('La fecha final de vigencia de la póliza actual no es válida');
  }

  const start = addMinutes(currentEnd, 1);
  if (!start) {
    throw new Error('No fue posible calcular la fecha inicial de la nueva vigencia');
  }

  const end = addDuration(start, duration);
  if (!end || end.getTime() <= start.getTime()) {
    throw new Error('La duración de la póliza no genera una vigencia válida');
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

  return {
    ok: true,
    msg: `Vigencia actualizada correctamente para la póliza y ${coverages.length} cobertura(s)`
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
    throw new Error('El parámetro policyId es requerido y debe ser válido');
  }

  return policyId;
}

function getRenewalPolicyId(value) {
  const policyId = toPositiveInteger(value && value.renewalPolicyId);
  if (policyId <= 0) {
    throw new Error('El parÃ¡metro renewalPolicyId es requerido y debe ser vÃ¡lido');
  }

  return policyId;
}

function loadPolicy(policyId) {
  doCmd({
    cmd: 'LoadEntities',
    data: {
      entity: 'LifePolicy',
      fields: 'id,[start],[end],duration,durationMonths,durationDays',
      filter: `id = ${policyId}`,
      noTracking: true
    }
  });

  const response = typeof LoadEntities === 'undefined' ? null : LoadEntities;
  if (!response || response.ok === false) {
    throw new Error(response && response.msg ? response.msg : 'No fue posible cargar la póliza');
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
    throw new Error(response && response.msg ? response.msg : 'No fue posible cargar las coberturas de la póliza');
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
    throw new Error('La póliza no tiene una duración válida configurada');
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
      : 'No fue posible actualizar la vigencia de la póliza');
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
