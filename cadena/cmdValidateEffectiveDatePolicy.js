//block
//noreplace

/**
 * Name: cmdValidateEffectiveDatePolicy
 * Description: Validates that an effective date is not before the policy start date.
 * Dates are compared as calendar dates in Panama local time, ignoring the time.
 */

const input = context || {};
const policyId = Number(input.policyId || 0);
const effectiveDate = input.effectiveDate;

function pad(value) {
  return String(value).padStart(2, '0');
}

function getPanamaDateKey(value) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return '';
  }

  const text = String(value).trim();
  const dateOnlyMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    return `${dateOnlyMatch[1]}-${dateOnlyMatch[2]}-${dateOnlyMatch[3]}`;
  }

  // An ISO timestamp without an offset is treated as a Panama local date.
  const localDateMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})[T ]/);
  if (localDateMatch && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(text)) {
    return `${localDateMatch[1]}-${localDateMatch[2]}-${localDateMatch[3]}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  // Panama is UTC-5 and does not use daylight saving time.
  const panamaDate = new Date(parsed.getTime() - (5 * 60 * 60 * 1000));
  return `${panamaDate.getUTCFullYear()}-${pad(panamaDate.getUTCMonth() + 1)}-${pad(panamaDate.getUTCDate())}`;
}

try {
  if (!Number.isFinite(policyId) || policyId <= 0) {
    return { ok: false, msg: 'Debe indicar una póliza válida.' };
  }

  if (effectiveDate === null || effectiveDate === undefined || String(effectiveDate).trim() === '') {
    return { ok: false, msg: 'Debe indicar una fecha efectiva.' };
  }

  doCmd({
    cmd: 'LoadEntity',
    data: {
      entity: 'LifePolicy',
      filter: `id=${policyId}`,
      fields: 'id,[start],[end]',
      noTracking: true
    }
  });

  const policy = LoadEntity && LoadEntity.outData;
  if (!policy) {
    return { ok: false, msg: 'No se encontró la póliza indicada.' };
  }

  const policyStart = getPanamaDateKey(policy.start);
  const policyEnd = getPanamaDateKey(policy.end);
  const effective = getPanamaDateKey(effectiveDate);

  if (!policyStart) {
    return { ok: false, msg: 'La póliza no tiene una fecha de inicio de vigencia válida.' };
  }

  if (!policyEnd) {
    return { ok: false, msg: 'La póliza no tiene una fecha final de vigencia válida.' };
  }

  if (!effective) {
    return { ok: false, msg: 'La fecha efectiva no es válida.' };
  }

  if (effective < policyStart) {
    return {
      ok: false,
      msg: 'La fecha efectiva no puede ser menor que la fecha de inicio de vigencia de la póliza.'
    };
  }

  if (effective > policyEnd) {
    return {
      ok: false,
      msg: 'La fecha efectiva no puede ser mayor que la fecha final de vigencia de la póliza.'
    };
  }

  return { ok: true, msg: 'La fecha efectiva es válida.' };
} catch (error) {
  const message = error && error.message ? error.message : String(error);
  throw new TypeError(`@${message}`);
}
