//block
//noreplace
/*
 * cmdSimReaChangeCoverage (AXX-299 / GLOB-1201)
 * Simula el reaseguro DEL MOVIMIENTO de un endoso de cobertura o suma asegurada,
 * sin ejecutar el endoso ni escribir en Cession. Distribuye las diferencias de prima
 * y suma de cada cobertura sobre los contratos vigentes, agrupando por contrato y linea.
 * Incluye todas las coberturas activas de cada contrato y linea afectados para que los
 * porcentajes editados se apliquen a la distribucion completa, aunque una cobertura no
 * tenga movimiento de prima en el endoso, respetando si la cobertura suma o no para
 * el contrato (la tabla cfgCoberturaProductoRea correspondiente al ramo),
 * y proyectando los aceptantes de cada linea por su participacion.
 *
 * La prima de reaseguro se reparte sobre la variacion FINAL de la cobertura
 * (incluye recargos y descuentos). El importe prorateado se conserva como dato
 * informativo, pero no puede ser la base porque omite esos ajustes manuales.
 *
 * context: {policyId, rows:[{code, variation, prorated, sumInsuredMovement, finalPremium, finalSum}], participants:[{cessionId, contactId, split}], movementType?: 'LOADING', facultativeMovementOnly?: boolean}
 */
const money = function (v) { return Number(Number(v).toFixed(2)); };
const txt = function (v) { return String(v == null ? '' : v).trim(); };
const up = function (v) { return txt(v).toUpperCase(); };

const policyId = Number(context.policyId || 0);
if (!policyId) throw 'Falta la poliza';
const rows = context.rows || [];
if (!rows.length) throw 'No hay resultado de calculo que distribuir: ejecute primero Calcular endoso';
// Cambio de suma entrega el estado final completo. Los demás movimientos
// conservan sus cesiones vigentes, incluso sin movimiento de cobertura.
const finalStateOnly = context.finalStateOnly === true;
const isLoadingMovement = up(context.movementType) === 'LOADING';
// Cambio de suma: cuando una cobertura ya tiene facultativo, el limite de
// las lineas proporcionales esta agotado. La variacion se coloca solo en FAC.
const suretyLobs = { '81': true, '82': true, '83': true, '84': true };
const suretyContractCapacity = context.suretyContractCapacity === true;
const facultativeMovementOnly = context.facultativeMovementOnly === true;

const delta = {};
const prorated = {};
const sumDelta = {};
const finalPremium = {};
const finalSum = {};
let movement = 0;
let proratedMovement = 0;
let sumMovement = 0;
for (let i = 0; i < rows.length; i++) {
  const c = txt(rows[i].code);
  const v = money(rows[i].variation || 0);
  const pr = rows[i].prorated === undefined || rows[i].prorated === null ? v : money(rows[i].prorated);
  const sv = money(rows[i].sumInsuredMovement || 0);
  delta[c] = v;
  prorated[c] = pr;
  sumDelta[c] = sv;
  finalPremium[c] = rows[i].finalPremium === undefined || rows[i].finalPremium === null ? null : money(rows[i].finalPremium);
  finalSum[c] = rows[i].finalSum === undefined || rows[i].finalSum === null ? null : money(rows[i].finalSum);
  movement = money(movement + v);
  proratedMovement = money(proratedMovement + pr);
  sumMovement = money(sumMovement + sv);
}

doCmd({ cmd: 'RepoLifePolicy', data: { operation: 'GET', filter: 'id=' + policyId, include: ['Coverages'], size: 1 } });
const policy = (RepoLifePolicy.outData || [])[0];
if (!policy) throw 'Poliza ' + policyId + ' no encontrada';
const useSuretyContractCapacity = suretyContractCapacity && suretyLobs[txt(policy.lob)] === true;

// La marca isCoverage pertenece a una tabla distinta por ramo. Usar siempre
// la de Fianza deja sin marca las coberturas de Técnicos (por ejemplo CAR).
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
const cfgTable = cfgTableByLob[txt(policy.lob)] || 'cfgCoberturaProductoRea';
doCmd({ cmd: 'GetFullTable', data: { table: cfgTable } });
let table = GetFullTable.outData || [];
if (typeof table === 'string') table = JSON.parse(table);
const sums = {};
for (let i = 1; i < table.length; i++) {
  const r = table[i];
  if (txt(r[1]) !== txt(policy.productCode)) continue;
  sums[txt(r[3])] = up(r[5]) === 'SI';
}

// distribucion vigente de la poliza; proyeccion de solo lectura para no trackear filas
doCmd({ cmd: 'LoadEntities', data: { entity: 'Cession', filter: 'lifePolicyId = ' + policyId + ' AND overwritten = 0', noTracking: true } });
const live = LoadEntities.outData || [];
if (!live.length) return { ok: true, persisted: false, policyId: policyId, movement: movement, contracts: [], msg: 'La poliza no tiene reaseguro vigente: el movimiento no genera cesion' };

// una sola linea por contrato + linea + cobertura: la ultima vigente manda
const seen = {};
for (let i = 0; i < live.length; i++) {
  const c = live[i];
  const key = txt(c.contractId) + '|' + txt(c.lineId) + '|' + txt(c.coverageCode);
  if (seen[key] && Number(seen[key].id) > Number(c.id)) continue;
  seen[key] = c;
}
const base = [];
for (const k in seen) { if (seen.hasOwnProperty(k)) base.push(seen[k]); }

// GLOB-1201: una colocacion vigente 100% RET o 100% FAC es una decision
// explicita de la poliza. La configuracion de capacidad de fianzas no debe
// convertirla silenciosamente en una distribucion RET/CP/FAC distinta.
// Se identifica por cobertura porque una misma poliza puede mezclar reglas.
const protectedPlacementByCoverage = {};
const baseByCoverageForProtection = {};
base.forEach(function (cession) {
  const key = txt(cession.contractId) + '|' + txt(cession.coverageCode);
  if (!baseByCoverageForProtection[key]) baseByCoverageForProtection[key] = [];
  baseByCoverageForProtection[key].push(cession);
});
Object.keys(baseByCoverageForProtection).forEach(function (key) {
  const cessions = baseByCoverageForProtection[key];
  const active = cessions.filter(function (cession) {
    return Math.abs(Number(cession.proportionCed || 0)) > 0.000001
      || Math.abs(Number(cession.proportionRe || 0)) > 0.000001
      || Math.abs(Number(cession.sumInsuredCedant || 0)) > 0.01
      || Math.abs(Number(cession.sumInsuredRe || 0)) > 0.01
      || Math.abs(Number(cession.premiumCedant || 0)) > 0.01
      || Math.abs(Number(cession.premiumRe || 0)) > 0.01;
  });
  if (!active.length) return;
  const isFacultative = function (cession) {
    const line = up(cession.lineId);
    return line === 'FAC' || line.indexOf('FACULT') >= 0;
  };
  const isRetention = function (cession) {
    const line = up(cession.lineId);
    return line === 'RET' || line.indexOf('RETEN') >= 0
      || line === 'CP' || line.indexOf('CUOTA') >= 0 || line.indexOf('QUOTA') >= 0;
  };
  const allRetention = active.every(function (cession) {
    return !isFacultative(cession)
      && Number(cession.proportionCed || 0) >= 0.999999
      && Number(cession.proportionRe || 0) <= 0.000001;
  }) && active.some(isRetention);
  const allFacultative = active.some(function (cession) {
    return isFacultative(cession)
      && Number(cession.proportionRe || 0) >= 0.999999
      && Number(cession.proportionCed || 0) <= 0.000001;
  }) && active.every(function (cession) {
    return isFacultative(cession)
      || (Number(cession.proportionCed || 0) <= 0.000001
        && Number(cession.proportionRe || 0) <= 0.000001);
  });
  if (allRetention) protectedPlacementByCoverage[key] = 'RETENCION';
  else if (allFacultative) protectedPlacementByCoverage[key] = 'FAC';
});

// La regla se determina por contrato y cobertura. Asi un facultativo de otra
// cobertura no altera la colocacion proporcional de la cobertura endosada.
const facultativeLineByCoverage = {};
const retentionOwnerLineByCoverage = {};
if (facultativeMovementOnly) {
  for (let i = 0; i < base.length; i++) {
    const c = base[i];
    const line = up(c.lineId);
    const code = txt(c.coverageCode);
    const key = txt(c.contractId) + '|' + code;
    if (delta[code] !== undefined && !facultativeLineByCoverage[key]
      && (line === 'FAC' || line.indexOf('FACULT') >= 0)
      && (Math.abs(Number(c.sumInsuredRe || 0)) > 0.01 || Math.abs(Number(c.premiumRe || 0)) > 0.01)) {
      facultativeLineByCoverage[key] = txt(c.lineId);
    }
  }
  const cessionsByCoverage = {};
  base.forEach(function (cession) {
    const key = txt(cession.contractId) + '|' + txt(cession.coverageCode);
    if (!cessionsByCoverage[key]) cessionsByCoverage[key] = [];
    cessionsByCoverage[key].push(cession);
  });
  Object.keys(cessionsByCoverage).forEach(function (key) {
    const cessions = cessionsByCoverage[key];
    const retention = cessions.find(function (cession) {
      const line = up(cession.lineId);
      return line === 'RET' || line.indexOf('RETEN') >= 0;
    }) || cessions.find(function (cession) {
      const line = up(cession.lineId);
      return line === 'CP' || line.indexOf('CUOTA') >= 0 || line.indexOf('QUOTA') >= 0;
    }) || cessions.find(function (cession) {
      const line = up(cession.lineId);
      return line !== 'FAC' && line.indexOf('FACULT') < 0;
    });
    if (retention) retentionOwnerLineByCoverage[key] = txt(retention.lineId);
  });
}

// Movimiento detallado por cesion para el caso de reduccion. FAC absorbe la
// baja primero; el remanente se descuenta proporcionalmente de las demas
// porciones vigentes, sin permitir saldos negativos.
const facultativeMovementByCession = {};
const ensureFacultativeMovement = function (cession) {
  const id = Number(cession.id);
  if (!facultativeMovementByCession[id]) {
    facultativeMovementByCession[id] = {
      premiumCedant: 0, premiumRe: 0,
      sumInsuredCedant: 0, sumInsuredRe: 0
    };
  }
  return facultativeMovementByCession[id];
};
const allocateReduction = function (tokens, amount) {
  const target = Math.max(0, Number(amount || 0));
  const usable = tokens.filter(function (token) { return Number(token.available || 0) > 0; });
  const total = usable.reduce(function (sum, token) { return sum + Number(token.available || 0); }, 0);
  if (!total || !target) return target;
  const allocated = Math.min(target, total);
  let assigned = 0;
  usable.forEach(function (token, index) {
    const part = index === usable.length - 1
      ? money(allocated - assigned)
      : money(allocated * Number(token.available || 0) / total);
    ensureFacultativeMovement(token.cession)[token.field] = money(ensureFacultativeMovement(token.cession)[token.field] - part);
    assigned = money(assigned + part);
  });
  return money(target - allocated);
};
if (facultativeMovementOnly) {
  const baseByCoverage = {};
  base.forEach(function (cession) {
    const key = txt(cession.contractId) + '|' + txt(cession.coverageCode);
    if (!baseByCoverage[key]) baseByCoverage[key] = [];
    baseByCoverage[key].push(cession);
  });
  Object.keys(baseByCoverage).forEach(function (key) {
    const cessions = baseByCoverage[key];
    const code = txt(cessions[0] && cessions[0].coverageCode);
    const facultativeLine = facultativeLineByCoverage[key];
    if (!facultativeLine || delta[code] === undefined) return;
    const fac = cessions.filter(function (cession) { return txt(cession.lineId) === facultativeLine; });
    const other = cessions.filter(function (cession) { return txt(cession.lineId) !== facultativeLine; });
    const asProportion = function (value) {
      const numeric = Number(value || 0);
      return Math.abs(numeric) <= 1 ? numeric : numeric / 100;
    };
    // La capacidad de la reduccion debe usar la misma base que se presenta
    // en la distribucion final. Los importes de Cession se pueden repetir
    // entre lineas complementarias y permitirian reducir FAC bajo cero.
    const initialPremium = finalPremium[code] === null
      ? null
      : money(Number(finalPremium[code] || 0) - Number(delta[code] || 0));
    const initialSum = finalSum[code] === null
      ? null
      : money(Number(finalSum[code] || 0) - Number(sumDelta[code] || 0));
    const availableComponent = function (cession, field) {
      const isPremium = field === 'premiumCedant' || field === 'premiumRe';
      const baseValue = isPremium ? initialPremium : initialSum;
      if (baseValue === null) return Math.max(0, Number(cession[field] || 0));
      const proportion = field === 'premiumCedant' || field === 'sumInsuredCedant'
        ? asProportion(cession.proportionCed)
        : asProportion(cession.proportionRe);
      return Math.max(0, money(baseValue * proportion));
    };
    const addToFirstFacultative = function (field, value) {
      if (fac.length && value) ensureFacultativeMovement(fac[0])[field] = money(ensureFacultativeMovement(fac[0])[field] + value);
    };
    const distributeReduction = function (field, value) {
      let remaining = Math.abs(Number(value || 0));
      remaining = allocateReduction(fac.map(function (cession) {
        return { cession: cession, field: field, available: availableComponent(cession, field) };
      }), remaining);
      if (remaining > 0) {
        const tokens = [];
        other.forEach(function (cession) {
          const cedantField = field === 'premiumRe' ? 'premiumCedant' : 'sumInsuredCedant';
          const reField = field === 'premiumRe' ? 'premiumRe' : 'sumInsuredRe';
          if (txt(cession.lineId) === retentionOwnerLineByCoverage[key]) {
            tokens.push({ cession: cession, field: cedantField, available: availableComponent(cession, cedantField) });
          }
          tokens.push({ cession: cession, field: reField, available: availableComponent(cession, reField) });
        });
        allocateReduction(tokens, remaining);
      }
    };
    if (Number(delta[code]) >= 0) addToFirstFacultative('premiumRe', Number(delta[code] || 0));
    else distributeReduction('premiumRe', delta[code]);
    if (Number(sumDelta[code]) >= 0) addToFirstFacultative('sumInsuredRe', Number(sumDelta[code] || 0));
    else distributeReduction('sumInsuredRe', sumDelta[code]);
  });
}

// CPEXCV maneja porcentajes independientes para suma y prima. La cesion
// vigente conserva proportionCed/proportionRe como proporciones de suma, por
// lo que el reparto de prima debe derivarse de sus importes monetarios.
const contractCodeById = {};
const contractIdsForCode = [];
for (let i = 0; i < base.length; i++) {
  const id = Number(base[i].contractId || 0);
  if (id && contractIdsForCode.indexOf(id) < 0) contractIdsForCode.push(id);
}
if (contractIdsForCode.length) {
  doCmd({ cmd: 'DoQuery', data: {
    sql: 'SELECT id, code FROM Contract WHERE id IN (' + contractIdsForCode.join(',') + ')'
  } });
  const contractRows = DoQuery.outData || [];
  for (let i = 0; i < contractRows.length; i++) {
    contractCodeById[Number(contractRows[i].id)] = txt(contractRows[i].code);
  }
}

// Fianza: el limite contractual define la fotografia final de RET, CP y FAC.
// Se calcula por contrato y cobertura con el mismo comando usado al emitir,
// y luego el movimiento se obtiene contra la cesion vigente.
const capacityByCoverage = {};
// Se mantiene vacio para ramos no sujetos a capacidad de fianzas. Debe vivir
// fuera del bloque de capacidad porque se consulta al proyectar cada fila.
const retentionPlacementLineByCoverage = {};
if (useSuretyContractCapacity) {
  const coverageIdByCode = {};
  for (let i = 0; i < base.length; i++) {
    if (!coverageIdByCode[txt(base[i].coverageCode)]) coverageIdByCode[txt(base[i].coverageCode)] = Number(base[i].coverageId || 0);
  }
  const contractCoverage = {};
  for (let i = 0; i < base.length; i++) {
    const c = base[i];
    const code = txt(c.coverageCode);
    if (delta[code] === undefined) continue;
    contractCoverage[Number(c.contractId) + '|' + code] = { contractId: Number(c.contractId), code: code, coverageId: Number(c.coverageId || coverageIdByCode[code] || 0) };
  }
  Object.keys(contractCoverage).forEach(function (key) {
    const item = contractCoverage[key];
    const allCoverages = rows.map(function (row) {
      const code = txt(row.code);
      return {
        id: Number(coverageIdByCode[code] || (code === item.code ? item.coverageId : 0)),
        codigo: code,
        limite: Number(finalSum[code] || 0),
        prima: Number(finalPremium[code] || 0),
        contrato: base.some(function (cession) {
          return Number(cession.contractId) === item.contractId && txt(cession.coverageCode) === code;
        })
      };
    }).filter(function (coverage) { return coverage.id > 0; });
    if (!allCoverages.length || !item.coverageId) return;
    const rea = doCmd({ cmd: 'ExeChain', data: { chain: 'cmdConfiguracionReaseguroPorSuma', context: JSON.stringify({
      CodigoContrato: contractCodeById[item.contractId],
      PolizaId: policyId,
      CoberturaId: item.coverageId,
      ProductoCodigo: policy.productCode,
      Suma: Number(finalSum[item.code] || 0),
      Prima: Number(finalPremium[item.code] || 0),
      Coberturas: allCoverages
    }) } });
    let result = rea && rea.outData;
    if (typeof result === 'string') result = JSON.parse(result);
    if (Array.isArray(result)) result = result[0];
    if (!rea || rea.ok === false || !result || result.msret === undefined) {
      throw 'No fue posible calcular la capacidad contractual para el contrato ' + contractCodeById[item.contractId]
        + ', cobertura ' + item.code + ': ' + (rea && rea.msg ? rea.msg : 'sin respuesta valida');
    }
    capacityByCoverage[key] = result;
  });

  // El facultativo puede no existir aun en Cession. Cuando el limite lo exige,
  // agregamos una fila de simulacion neutra para que el guardado cree la linea.
  // La retencion no debe salir de Cuota Parte/Excedente solo porque la
  // configuracion la devuelva como `msret`: mientras exista una de esas lineas,
  // esa misma linea conserva el cedente. RET solo es valido como fallback si
  // no existe ninguna linea proporcional donde alojar la retencion.
  const capacityCessionsByCoverage = {};
  base.forEach(function (cession) {
    const key = Number(cession.contractId) + '|' + txt(cession.coverageCode);
    if (!capacityCessionsByCoverage[key]) capacityCessionsByCoverage[key] = [];
    capacityCessionsByCoverage[key].push(cession);
  });
  Object.keys(capacityCessionsByCoverage).forEach(function (key) {
    const cessions = capacityCessionsByCoverage[key];
    const proportional = cessions.find(function (cession) {
      const line = up(cession.lineId);
      return line === 'CP' || line.indexOf('CUOTA') >= 0
        || line.indexOf('QUOTA') >= 0 || line === 'EX1'
        || line.indexOf('EXCEDENTE') >= 0;
    });
    if (proportional) {
      // Si existe una linea proporcional, la retencion pertenece a ella.
      // Esto tambien corrige una linea RET residual creada por una simulacion
      // anterior: no debe competir ni duplicar la retencion de Cuota Parte.
      retentionPlacementLineByCoverage[key] = txt(proportional.lineId);
      return;
    }
    const explicitRetention = cessions.find(function (cession) {
      const line = up(cession.lineId);
      return line === 'RET' || line.indexOf('RETEN') >= 0;
    });
    if (explicitRetention) retentionPlacementLineByCoverage[key] = txt(explicitRetention.lineId);
  });
  const synthetic = [];
  Object.keys(capacityByCoverage).forEach(function (key) {
    // Si la colocacion vigente esta protegida, no crear lineas sinteticas de
    // capacidad: hacerlo volveria a introducir RET/CP/FAC contra la regla
    // explicita 100% RET o 100% FAC de la poliza.
    if (protectedPlacementByCoverage[key]) return;
    const capacity = capacityByCoverage[key];
    const tokens = key.split('|');
    const contractId = Number(tokens[0]);
    const code = tokens[1];
    const hasLine = function (kind) { return base.some(function (cession) {
      const line = up(cession.lineId);
      const matches = kind === 'RET'
        ? (line === 'RET' || line.indexOf('RETEN') >= 0)
        : (line === 'FAC' || line.indexOf('FACULT') >= 0);
      return Number(cession.contractId) === contractId && txt(cession.coverageCode) === code && matches;
    }); };
    const template = base.find(function (cession) {
      return Number(cession.contractId) === contractId && txt(cession.coverageCode) === code;
    });
    if (!template) return;
    const addLine = function (lineId) {
      const next = JSON.parse(JSON.stringify(template));
      next.id = 0;
      next.lineId = lineId;
      // Una linea RET sintetica representa el saldo final de retencion cuando
      // la poliza no tiene una linea proporcional donde conservarla. Debe partir
      // del saldo vigente para que no se convierta en movimiento completo.
      // Caso funcional: si un aumento rebasa el limite proporcional, el
      // incremento debe ir a FAC. El saldo RET existente no es movimiento;
      // inicializarlo en cero haria que msret se contabilizara nuevamente.
      const retentionOwner = lineId === 'RET'
        ? (base.find(function (cession) {
          const line = up(cession.lineId);
          return Number(cession.contractId) === contractId
            && txt(cession.coverageCode) === code
            && (line === 'RET' || line.indexOf('RETEN') >= 0);
        }) || base.find(function (cession) {
          const line = up(cession.lineId);
          return Number(cession.contractId) === contractId
            && txt(cession.coverageCode) === code
            && (line === 'CP' || line.indexOf('CUOTA') >= 0 || line.indexOf('QUOTA') >= 0);
        }))
        : null;
      if (retentionOwner) {
        next.sumInsuredCedant = Number(retentionOwner.sumInsuredCedant || 0);
        next.premiumCedant = Number(retentionOwner.premiumCedant || 0);
        next.proportionCed = Number(retentionOwner.proportionCed || 0);
      } else {
        next.sumInsuredCedant = 0;
        next.premiumCedant = 0;
        next.proportionCed = 0;
      }
      next.sumInsuredRe = 0; next.premiumRe = 0;
      next.proportionRe = 0;
      synthetic.push(next);
    };
    const retentionOwnerLine = retentionPlacementLineByCoverage[key];
    const hasProportionalRetentionOwner = retentionOwnerLine
      && (up(retentionOwnerLine) === 'CP' || up(retentionOwnerLine).indexOf('CUOTA') >= 0
        || up(retentionOwnerLine).indexOf('QUOTA') >= 0 || up(retentionOwnerLine) === 'EX1'
        || up(retentionOwnerLine).indexOf('EXCEDENTE') >= 0);
    if (!hasLine('RET') && !hasProportionalRetentionOwner
      && (Math.abs(Number(capacity.msret || 0)) >= 0.01 || Math.abs(Number(capacity.mpret || 0)) >= 0.01)) addLine('RET');
    if (!hasLine('FAC') && (Math.abs(Number(capacity.msfp || 0)) >= 0.01 || Math.abs(Number(capacity.mpfp || 0)) >= 0.01)) addLine('FAC');
  });
  synthetic.forEach(function (cession) { base.push(cession); });
}

const cpapRiskPremiumFactor = function (cession) {
  // CPAP no reparte toda la prima: la cesión vigente conserva la proporción
  // real de prima de riesgo (retenida + cedida) frente a la prima original.
  const originalPremium = Math.abs(Number(cession.premium || 0));
  if (!originalPremium) return 1;
  const distributedPremium = Math.abs(Number(cession.premiumCedant || 0))
    + Math.abs(Number(cession.premiumRe || 0));
  return Math.max(0, Math.min(1, distributedPremium / originalPremium));
};

const severeIllnessProductCodes = { EG1: true, EG2: true, EG3: true, EG4: true, EG5: true };
const normalizedProductCode = up(policy.productCode).replace(/[^A-Z0-9]/g, '');
const isSevereIllnessProduct = severeIllnessProductCodes[normalizedProductCode] === true;

// aceptantes de esas lineas
const baseIds = [];
for (let i = 0; i < base.length; i++) baseIds.push(Number(base[i].id));
const partsByCession = {};
if (baseIds.length) {
  doCmd({ cmd: 'DoQuery', data: { sql: 'SELECT id, cessionId, contactId, lineId, split, premium, commission FROM CessionPart WHERE cessionId IN (' + baseIds.join(',') + ')' } });
  const parts = DoQuery.outData || [];
  for (let i = 0; i < parts.length; i++) {
    const cid = Number(parts[i].cessionId);
    if (!partsByCession[cid]) partsByCession[cid] = [];
    partsByCession[cid].push(parts[i]);
  }
}
// participaciones editadas en la pantalla, si las hay
const overrides = {};
const addedByCession = {};
const edited = context.participants || [];
for (let i = 0; i < edited.length; i++) {
  const e = edited[i];
  const cid = Number(e.cessionId);
  overrides[cid + '|' + Number(e.contactId)] = Number(e.split);
  if (!addedByCession[cid]) addedByCession[cid] = [];
  addedByCession[cid].push(Number(e.contactId));
}

const byContract = {};
const order = [];
const warnings = [];

// El calculo del endoso puede traer solo la cobertura seleccionada. Identificamos sus
// contratos y lineas para proyectar tambien las demas coberturas activas relacionadas.
const affectedContractLines = {};
for (let i = 0; i < base.length; i++) {
  const c = base[i];
  if (delta[txt(c.coverageCode)] === undefined) continue;
  affectedContractLines[txt(c.contractId) + '|' + txt(c.lineId)] = true;
}

for (let i = 0; i < base.length; i++) {
  const c = base[i];
  const code = txt(c.coverageCode);
  const line = txt(c.lineId);
  const lineUp = up(line);
  const key = txt(c.contractId) + '|' + line;
  if (!affectedContractLines[key]) continue;
  // Una cesión puede sobrevivir a una cobertura retirada en la póliza. Solo
  // proyectamos las coberturas que llegaron en el estado final cotizado.
  if (finalStateOnly && delta[code] === undefined) continue;
  if (!byContract[key]) {
    byContract[key] = {
      contractId: Number(c.contractId), lineId: line,
      facultative: lineUp === 'FAC' || lineUp === 'FRO',
      currency: txt(c.currency) || txt(policy.currency),
      rows: [], participants: [],
      totals: { movement: 0, prorated: 0, sumMovement: 0, cedant: 0, re: 0, commission: 0, nonTechnical: 0, sumInsuredCounted: 0, coveragesCounted: 0, participantSplit: 0 }
    };
    order.push(key);
  }
  const grp = byContract[key];
  const dv = delta[code] === undefined ? 0 : money(delta[code]);
  const pv = prorated[code] === undefined ? 0 : money(prorated[code]);
  const sv = sumDelta[code] === undefined ? 0 : money(sumDelta[code]);
  let pCed = Number(c.proportionCed || 0);
  let pRe = Number(c.proportionRe || 0);
  const capacity = capacityByCoverage[Number(c.contractId) + '|' + code];
  const capacityLine = up(line);
  const proportionalLine = capacityLine === 'CP' || capacityLine.indexOf('CUOTA') >= 0
    || capacityLine.indexOf('QUOTA') >= 0 || capacityLine === 'EX1'
    || capacityLine.indexOf('EXCEDENTE') >= 0;
  const retentionOwnerLine = retentionPlacementLineByCoverage[Number(c.contractId) + '|' + code];
  const isRetentionOwner = proportionalLine && txt(retentionOwnerLine) === line;
  const protectedPlacement = protectedPlacementByCoverage[Number(c.contractId) + '|' + code];
  const capacityAllocation = !protectedPlacement && !!capacity && (capacityLine === 'RET' || capacityLine.indexOf('RETEN') >= 0
    || proportionalLine
    || capacityLine === 'FAC' || capacityLine.indexOf('FACULT') >= 0);
  const isCpexCcv = up(contractCodeById[Number(c.contractId)]) === 'CPEXCV';
  const premiumBase = Number(c.premium || 0);
  const premiumPCed = isCpexCcv && premiumBase !== 0
    ? Number(c.premiumCedant || 0) / premiumBase : pCed;
  const premiumPRe = isCpexCcv && premiumBase !== 0
    ? Number(c.premiumRe || 0) / premiumBase : pRe;
  const commissionBase = Number(c.comissionCedant == null ? c.participantCommission : c.comissionCedant) || 0;
  // La comision de reaseguro se calcula sobre la prima cedida, no sobre la
  // prima total de la cobertura. `premium` es la prima bruta y `premiumRe`
  // es su porcion cedida; dividir contra `premium` y luego multiplicar por
  // `premiumRe` aplicaria la participacion cedida dos veces y subestimaria la
  // comision del movimiento. Esta base debe mantenerse alineada con
  // cmdChangeLoadingReinsuranceAdjustment y cmdRedistribuyeReaseguroEndoso.
  const commissionBasePremium = Number(c.premiumRe || 0);
  const commissionRate = commissionBasePremium === 0 ? 0 : commissionBase / commissionBasePremium;
  const counts = sums[code] === true;
  const facultativeLine = facultativeLineByCoverage[txt(c.contractId) + '|' + code];
  const routesMovementToFacultative = !!facultativeLine;
  const facultativeMovement = routesMovementToFacultative
    ? (facultativeMovementByCession[Number(c.id)] || { premiumCedant: 0, premiumRe: 0, sumInsuredCedant: 0, sumInsuredRe: 0 })
    : null;
  const receivesFacultativeMovement = routesMovementToFacultative && line === facultativeLine
    && (Number(facultativeMovement.premiumRe || 0) !== 0 || Number(facultativeMovement.sumInsuredRe || 0) !== 0);
  let lineDv = routesMovementToFacultative
    ? money(Number(facultativeMovement.premiumCedant || 0) + Number(facultativeMovement.premiumRe || 0))
    : dv;
  let linePv = routesMovementToFacultative ? lineDv : pv;
  let lineSv = routesMovementToFacultative
    ? money(Number(facultativeMovement.sumInsuredCedant || 0) + Number(facultativeMovement.sumInsuredRe || 0))
    : sv;
  const isCPAP = up(contractCodeById[Number(c.contractId)]) === 'CPAP';
  // Los recargos/descuentos de EG para CPAP se retienen por completo. Esta
  // excepcion solo afecta la diferencia del endoso, nunca la cesion vigente.
  const retentionOnlyLoadingPremium = isLoadingMovement && isCPAP && isSevereIllnessProduct;
  const riskPremiumFactor = isCPAP ? cpapRiskPremiumFactor(c) : 1;
  let distributedPremium = retentionOnlyLoadingPremium || routesMovementToFacultative
    ? lineDv : money(lineDv * riskPremiumFactor);
  // La variacion final incluye el recargo/descuento aplicado a la cobertura.
  let cedant = retentionOnlyLoadingPremium ? lineDv : (routesMovementToFacultative ? Number(facultativeMovement.premiumCedant || 0) : money(distributedPremium * premiumPCed));
  let re = retentionOnlyLoadingPremium ? 0 : (routesMovementToFacultative ? Number(facultativeMovement.premiumRe || 0) : money(distributedPremium * premiumPRe));
  // Sin prima cedida en el movimiento tampoco se mueve comision de aceptantes.
  let commission = retentionOnlyLoadingPremium ? 0 : money(re * commissionRate);
  let nonTechnical = retentionOnlyLoadingPremium ? 0 : money(lineDv - cedant - re);
  let sourcePremiumMovement = routesMovementToFacultative ? dv : lineDv;
  let sourceSumInsuredMovement = routesMovementToFacultative ? sv : lineSv;
  let finalCedant = cedant;
  let finalRe = re;
  let finalSumCedant = money(sv * pCed);
  let finalSumRe = money(sv * pRe);
  let finalCommission = commission;
  let obsoleteRetentionLine = false;
  if (capacityAllocation) {
    const isRetention = capacityLine === 'RET' || capacityLine.indexOf('RETEN') >= 0;
    const isFacultative = capacityLine === 'FAC' || capacityLine.indexOf('FACULT') >= 0;
    obsoleteRetentionLine = isRetention && !!retentionOwnerLine && !isRetentionOwner;
    const ownsRetention = isRetentionOwner || (isRetention && !obsoleteRetentionLine);
    const targetSumCedant = ownsRetention ? Number(capacity.msret || 0) : 0;
    const targetPremiumCedant = ownsRetention ? Number(capacity.mpret || 0) : 0;
    const targetSumRe = isRetention ? 0 : (isFacultative ? Number(capacity.msfp || 0) : Number(capacity.mscp || 0));
    const targetPremiumRe = isRetention ? 0 : (isFacultative ? Number(capacity.mpfp || 0) : Number(capacity.mpcp || 0));
    const targetCommission = isFacultative ? Number(capacity.mcfp || 0) : (isRetention ? 0 : Number(capacity.mccp || 0));
    const currentCedant = Number(c.premiumCedant || 0);
    const currentRe = Number(c.premiumRe || 0);
    const currentSumCedant = Number(c.sumInsuredCedant || 0);
    const currentSumRe = Number(c.sumInsuredRe || 0);
    const currentCommission = Number(c.comissionCedant == null ? c.participantCommission : c.comissionCedant) || 0;
    finalCedant = money(targetPremiumCedant);
    finalRe = money(targetPremiumRe);
    finalSumCedant = counts ? money(targetSumCedant) : 0;
    finalSumRe = counts ? money(targetSumRe) : 0;
    if (obsoleteRetentionLine) {
      // La fila RET residual se anula en el snapshot; la ejecución la retira
      // y conserva la retención dentro de la línea proporcional propietaria.
      finalCedant = 0;
      finalRe = 0;
      finalSumCedant = 0;
      finalSumRe = 0;
    }
    // Si la variacion completa va a FAC, el saldo final se construye sobre la
    // cesion vigente mas el movimiento que ya fue asignado por la simulacion.
    // No se debe volver a usar la prima objetivo de capacidad: esa cifra puede
    // redistribuir un recargo/descuento entre CP/RET aunque la grilla sintetica
    // indique que todo el movimiento corresponde a FAC.
    if (routesMovementToFacultative && !obsoleteRetentionLine) {
      finalCedant = money(currentCedant + Number(facultativeMovement.premiumCedant || 0));
      finalRe = money(currentRe + Number(facultativeMovement.premiumRe || 0));
      finalSumCedant = money(currentSumCedant + Number(facultativeMovement.sumInsuredCedant || 0));
      finalSumRe = money(currentSumRe + Number(facultativeMovement.sumInsuredRe || 0));
      finalCommission = money(currentCommission + Number(facultativeMovement.premiumRe || 0) * commissionRate);
    } else {
      finalCommission = money(targetCommission);
    }
    cedant = money(finalCedant - currentCedant);
    re = money(finalRe - currentRe);
    commission = money(finalCommission - currentCommission);
    lineDv = money(cedant + re);
    linePv = lineDv;
    lineSv = money(finalSumCedant + finalSumRe - currentSumCedant - currentSumRe);
    sourcePremiumMovement = money(Number(finalPremium[code] || 0) - Number(c.premium || 0));
    sourceSumInsuredMovement = money(Number(finalSum[code] || 0) - Number(c.sumInsured || 0));
    // Las coberturas que no participan de la suma del contrato conservan una
    // suma tecnica, pero su colocacion se valida exclusivamente por prima.
    const placementUsesSum = counts === true && Number(finalSum[code] || 0) !== 0;
    const placementBase = placementUsesSum ? Number(finalSum[code] || 0) : Number(finalPremium[code] || 0);
    pCed = placementBase ? (placementUsesSum ? finalSumCedant / placementBase : finalCedant / placementBase) : 0;
    pRe = placementBase ? (placementUsesSum ? finalSumRe / placementBase : finalRe / placementBase) : 0;
    nonTechnical = 0;
  }
  grp.rows.push({
    coverageCode: code, cover: txt(c.cover), counts: counts,
    premiumMovement: lineDv, proratedMovement: linePv, sumInsuredMovement: lineSv,
    // Cession conserva la suma y prima brutas de la cobertura por linea. Los
    // importes anteriores son solo la porcion distribuida del movimiento.
    sourcePremiumMovement: sourcePremiumMovement,
    sourceSumInsuredMovement: sourceSumInsuredMovement,
    finalGrossPremium: capacityAllocation && Number(c.id || 0) === 0 ? Number(finalPremium[code] || 0) : undefined,
    finalGrossSum: capacityAllocation && Number(c.id || 0) === 0 ? Number(finalSum[code] || 0) : undefined,
    // El estado final viene de la cotización de la póliza, no de sumar
    // cesiones, porque una misma cobertura puede estar en varias líneas.
    finalPremium: finalPremium[code], finalSum: finalSum[code],
    proportionCed: retentionOnlyLoadingPremium ? 1 : pCed,
    proportionRe: retentionOnlyLoadingPremium ? 0 : pRe,
    riskPremiumFactor: retentionOnlyLoadingPremium ? 1 : riskPremiumFactor,
    retentionOnlyLoadingPremium: retentionOnlyLoadingPremium,
    protectedPlacement: protectedPlacement || null,
    facultativeMovementOnly: routesMovementToFacultative,
    contractCapacityAllocation: capacityAllocation,
    remove: obsoleteRetentionLine,
    receivesFacultativeMovement: receivesFacultativeMovement,
    premiumCedantMovement: routesMovementToFacultative ? Number(facultativeMovement.premiumCedant || 0) : cedant,
    premiumReMovement: routesMovementToFacultative ? Number(facultativeMovement.premiumRe || 0) : re,
    sumInsuredCedantMovement: capacityAllocation ? money(finalSumCedant - Number(c.sumInsuredCedant || 0)) : (routesMovementToFacultative ? Number(facultativeMovement.sumInsuredCedant || 0) : money(sv * pCed)),
    sumInsuredReMovement: capacityAllocation ? money(finalSumRe - Number(c.sumInsuredRe || 0)) : (routesMovementToFacultative ? Number(facultativeMovement.sumInsuredRe || 0) : money(sv * pRe)),
    premiumCedant: capacityAllocation ? finalCedant : cedant, premiumRe: capacityAllocation ? finalRe : re, nonTechnicalPremium: nonTechnical,
    sumInsuredCedant: capacityAllocation ? finalSumCedant : undefined,
    sumInsuredRe: capacityAllocation ? finalSumRe : undefined,
    commission: capacityAllocation ? finalCommission : commission,
    sumInsured: Number(c.sumInsured || 0), sumInsuredCounted: counts ? Number(c.sumInsured || 0) : 0,
    currency: txt(c.currency) || txt(policy.currency),
    basedOnCessionId: Number(c.id)
  });
  grp.totals.movement = money(grp.totals.movement + lineDv);
  grp.totals.prorated = money(grp.totals.prorated + linePv);
  grp.totals.sumMovement = money(grp.totals.sumMovement + lineSv);
  grp.totals.cedant = money(grp.totals.cedant + cedant);
  grp.totals.re = money(grp.totals.re + re);
  grp.totals.commission = money(grp.totals.commission + commission);
  grp.totals.nonTechnical = money(grp.totals.nonTechnical + nonTechnical);
  if (counts) {
    grp.totals.sumInsuredCounted = grp.totals.sumInsuredCounted + Number(c.sumInsured || 0);
    grp.totals.coveragesCounted = grp.totals.coveragesCounted + 1;
  }

  // aceptantes de esta linea: el cedido se reparte por su participacion
  const parts = (partsByCession[Number(c.id)] || []).slice();
  // una edicion puede nombrar a un aceptante que todavia no participa del movimiento: se agrega
  const namedHere = addedByCession[Number(c.id)] || [];
  for (let k = 0; k < namedHere.length; k++) {
    let yaEsta = false;
    for (let j = 0; j < parts.length; j++) { if (Number(parts[j].contactId) === namedHere[k]) yaEsta = true; }
    if (!yaEsta) parts.push({ id: 0, cessionId: Number(c.id), contactId: namedHere[k], lineId: txt(c.lineId), split: 0, premium: 0, commission: 0, isNew: true });
  }
  let splitSum = 0;
  for (let k = 0; k < parts.length; k++) {
    const pt = parts[k];
    const ov = overrides[Number(c.id) + '|' + Number(pt.contactId)];
    const split = ov === undefined || !isFinite(ov) ? Number(pt.split || 0) : ov;
    splitSum = splitSum + split;
    grp.participants.push({
      cessionId: Number(c.id), coverageCode: code, contactId: Number(pt.contactId),
      lineId: txt(pt.lineId), split: split, edited: ov !== undefined, added: pt.isNew === true,
      premium: money(re * split / 100), commission: money(commission * split / 100)
    });
  }
  if (parts.length && Math.abs(splitSum - 100) > 0.01) {
    warnings.push('Contrato ' + c.contractId + ' linea ' + line + ' cobertura ' + code + ': las participaciones suman ' + money(splitSum) + '% en vez de 100%');
  }
}

// participantes configurados en cada contrato: son los aceptantes elegibles de la linea
const contractIds = [];
for (let i = 0; i < order.length; i++) {
  const cid = byContract[order[i]].contractId;
  if (contractIds.indexOf(cid) < 0) contractIds.push(cid);
}
const eligible = {};
if (contractIds.length) {
  doCmd({ cmd: 'DoQuery', data: { sql: 'SELECT id, contractId, contactId, lineId, split FROM Participant WHERE contractId IN (' + contractIds.join(',') + ')' } });
  const partRows = DoQuery.outData || [];
  for (let i = 0; i < partRows.length; i++) {
    const r = partRows[i];
    const k = Number(r.contractId);
    if (!eligible[k]) eligible[k] = [];
    eligible[k].push({ contactId: Number(r.contactId), lineId: txt(r.lineId), contractSplit: Number(r.split) });
  }
}

// Si la capacidad abre FAC por primera vez, no existen CessionPart historicos.
// Se proyectan los aceptantes definidos en Participant para que la nueva linea
// pueda confirmarse con la misma configuracion contractual.
if (useSuretyContractCapacity) {
  for (let i = 0; i < order.length; i++) {
    const group = byContract[order[i]];
    const line = up(group.lineId);
    const isFac = line === 'FAC' || line.indexOf('FACULT') >= 0;
    if (!isFac || group.participants.length) continue;
    const configured = (eligible[group.contractId] || []).filter(function (participant) {
      const participantLine = up(participant.lineId);
      return participantLine === line || participantLine === 'FAC' || participantLine.indexOf('FACULT') >= 0;
    });
    if (!configured.length) continue;
    (group.rows || []).forEach(function (row) {
      if (!row.contractCapacityAllocation || Number(row.premiumRe || 0) === 0) return;
      configured.forEach(function (participant) {
        const split = Number(participant.contractSplit || 0);
        group.participants.push({
          cessionId: 0,
          coverageCode: row.coverageCode,
          contactId: Number(participant.contactId),
          lineId: group.lineId,
          split: split,
          premium: money(Number(row.premiumRe || 0) * split / 100),
          commission: money(Number(row.commission || 0) * split / 100)
        });
      });
    });
  }
}

// La advertencia se emite despues de incorporar Participant; antes de eso una
// linea FAC nueva aun no tiene CessionPart historicos aunque si aceptantes.
for (let i = 0; i < order.length; i++) {
  const group = byContract[order[i]];
  const line = up(group.lineId);
  if ((line === 'FAC' || line.indexOf('FACULT') >= 0) && !group.participants.length) {
    warnings.push('Contrato ' + group.contractId + ' linea ' + group.lineId + ': facultativo sin aceptantes, hay que distribuirlos antes de ejecutar');
  }
}

const contracts = [];
let distributed = 0;
for (let i = 0; i < order.length; i++) {
  const g = byContract[order[i]];
  distributed = money(distributed + g.totals.movement);
  let ps = 0;
  for (let k = 0; k < g.participants.length; k++) ps = money(ps + g.participants[k].premium);
  g.totals.participantPremium = ps;
  g.contractParticipants = eligible[g.contractId] || [];
  contracts.push(g);
}

return {
  ok: true,
  persisted: false,
  scope: 'AFFECTED_CONTRACT_LINES',
  basis: 'FINAL_COVERAGE_MOVEMENT',
  policyId: policyId,
  policyCode: policy.code,
  currency: policy.currency,
  movement: movement,
  proratedMovement: proratedMovement,
  sumMovement: sumMovement,
  distributed: distributed,
  balanced: money(movement - distributed) === 0,
  warnings: warnings,
  contracts: contracts
};
