//block
//noreplace

/*
  *Name cmdChangeLoadingReinsuranceAdjustment
  *Author: Michael Delgado
  *Creation date: 2026-07-14
  *Description: Updates LoadingChange reinsurance values without deleting or creating records.
  *Email: michael.delgado@axxis-systems.com
  *Version: 1.0
*/

//////////////////////////////////////////////////////////////////
// Main flow
//////////////////////////////////////////////////////////////////

const changeId = toValidNumber(context?.changeId);
if (!changeId) {
  return endStatement(false, "changeId es requerido");
}

const changeInfo = getChange(changeId);
if (normalizeText(changeInfo?.Discriminator) !== "LoadingChange") {
  return endStatement(true, "El cambio no requiere ajuste especial de reaseguro");
}

const policyRea = getPolicyRea(changeId);
if (!Array.isArray(policyRea) || policyRea.length === 0) {
  return endStatement(true, "El endoso no tiene reaseguro que ajustar");
}

const policyId = toValidNumber(policyRea?.[0]?.lifePolicyId);
if (!policyId) {
  return endStatement(false, "No fue posible identificar la póliza del endoso");
}

const emissionBase = getEmissionBaseCessions(policyId);
const adjustedBase = adjustLoadingCessions(policyRea, emissionBase);
if (!Array.isArray(adjustedBase)) {
  return endStatement(false, normalizeText(adjustedBase?.msg ?? adjustedBase) || "No fue posible ajustar el reaseguro del endoso");
}

syncCessions(adjustedBase);
return endStatement(true, "Reaseguro ajustado correctamente");

//////////////////////////////////////////////////////////////////
// Adjustment flow
//////////////////////////////////////////////////////////////////

function adjustLoadingCessions(policyRea, emissionBase) {
  try {
    const sourcePolicyRea = Array.isArray(policyRea) ? policyRea : [];
    const sourceEmissionBase = Array.isArray(emissionBase) ? emissionBase : [];
    const adjusted = sourcePolicyRea.map(cession => {
      const target = cloneJson(cession);
      applyLoadingChangeAdjustments(cloneJson(cession), target, sourceEmissionBase);
      return target;
    });

    distributeParticipants(adjusted);
    return adjusted;
  } catch (error) {
    return error.toString();
  }
}

function applyLoadingChangeAdjustments(sourceCession, targetCession, emissionBase) {
  const sourcePremium = toNumber(sourceCession?.premium);
  const sourceProportionCed = toNumber(sourceCession?.proportionCed);
  const sourceProportionRe = toNumber(sourceCession?.proportionRe);
  const premiumSign = sourcePremium < 0 ? -1 : 1;
  const baseRatio = getBaseNonTechnicalRatio(sourceCession, emissionBase);
  const baseCommissionRatio = getBaseRatio(sourceCession, emissionBase, "comissionCedant", "premiumRe");
  const baseTaxRatio = getBaseRatio(sourceCession, emissionBase, "tax", "premiumRe");
  const recalculatedNonTechnical = redondear(Math.abs(sourcePremium) * baseRatio * premiumSign);

  targetCession.loading = 0;
  targetCession.loadingCedant = 0;
  targetCession.loadingRe = 0;
  targetCession.nonTechnicalPremium = recalculatedNonTechnical;
  const netPremium = redondear(toNumber(targetCession?.premium) - toNumber(targetCession?.nonTechnicalPremium));
  targetCession.premiumCedant = redondear(netPremium * sourceProportionCed);
  targetCession.premiumRe = redondear(netPremium * sourceProportionRe);
  targetCession.proportionCed = sourceProportionCed;
  targetCession.proportionRe = sourceProportionRe;
  targetCession.comissionCedant = redondear(Math.abs(toNumber(targetCession?.premiumRe)) * baseCommissionRatio * premiumSign);
  targetCession.comissionCedantExtra = targetCession.comissionCedant;
  targetCession.tax = redondear(Math.abs(toNumber(targetCession?.premiumRe)) * baseTaxRatio * premiumSign);

  const premiumBase = toNumber(targetCession?.premium);
  const distributed = redondear(
    toNumber(targetCession.nonTechnicalPremium) +
    toNumber(targetCession.premiumCedant) +
    toNumber(targetCession.premiumRe)
  );
  const diffPremium = redondear(premiumBase - distributed);
  if (diffPremium !== 0) {
    targetCession.premiumCedant = redondear(toNumber(targetCession.premiumCedant) + diffPremium);
  }
}

function distributeParticipants(newCessions) {
  newCessions.forEach(cession => {
    const participants = Array.isArray(cession?.Participants) ? cession.Participants : [];
    let totalSumInsured = 0;
    let totalPremium = 0;
    let totalCommission = 0;

    const cededPremium = toNumber(cession?.premiumRe);
    const cededCommission = toNumber(cession?.comissionCedant);

    participants.forEach(participant => {
      participant.sumInsured = redondear((toNumber(participant?.split) / 100) * toNumber(cession?.sumInsuredRe));
      participant.premium = redondear((toNumber(participant?.split) / 100) * cededPremium);
      participant.commission = redondear((toNumber(participant?.split) / 100) * cededCommission);

      totalSumInsured += toNumber(participant?.sumInsured);
      totalPremium += toNumber(participant?.premium);
      totalCommission += toNumber(participant?.commission);
    });

    const diffSI = redondear(toNumber(cession?.sumInsuredRe) - totalSumInsured);
    const diffPr = redondear(cededPremium - totalPremium);
    const diffCo = redondear(cededCommission - totalCommission);

    if (participants.length > 0) {
      participants[0].sumInsured = redondear(toNumber(participants[0].sumInsured) + diffSI);
      participants[0].premium = redondear(toNumber(participants[0].premium) + diffPr);
      participants[0].commission = redondear(toNumber(participants[0].commission) + diffCo);
    }
  });
}

//////////////////////////////////////////////////////////////////
// Persistence
//////////////////////////////////////////////////////////////////

function syncCessions(newCessions) {
  const sql = buildCessionUpdateSql(newCessions);
  doCmd({ cmd: "DoQuery", data: { sql } });
  if (!DoQuery?.ok) {
    throw new Error(DoQuery?.msg || "No fue posible actualizar las cesiones");
  }
}

function buildCessionUpdateSql(cessions) {
  const statements = [];

  (Array.isArray(cessions) ? cessions : []).forEach(cession => {
    const cessionId = toValidNumber(cession?.id);
    if (!cessionId) {
      return;
    }

    statements.push(`
      UPDATE Cession
      SET
        loading = ${sqlLiteral(cession?.loading)},
        loadingCedant = ${sqlLiteral(cession?.loadingCedant)},
        loadingRe = ${sqlLiteral(cession?.loadingRe)},
        nonTechnicalPremium = ${sqlLiteral(cession?.nonTechnicalPremium)},
        premiumCedant = ${sqlLiteral(cession?.premiumCedant)},
        premiumRe = ${sqlLiteral(cession?.premiumRe)},
        comissionCedant = ${sqlLiteral(cession?.comissionCedant)},
        comissionCedantExtra = ${sqlLiteral(cession?.comissionCedantExtra)},
        tax = ${sqlLiteral(cession?.tax)},
        proportionCed = ${sqlLiteral(cession?.proportionCed)},
        proportionRe = ${sqlLiteral(cession?.proportionRe)}
      WHERE id = ${cessionId};
    `);

    (Array.isArray(cession?.Participants) ? cession.Participants : []).forEach(participant => {
      const participantId = toValidNumber(participant?.id);
      if (!participantId) {
        return;
      }

      statements.push(`
      UPDATE CessionPart
      SET
        split = ${sqlLiteral(participant?.split)},
        sumInsured = ${sqlLiteral(participant?.sumInsured)},
        premium = ${sqlLiteral(participant?.premium)},
        commission = ${sqlLiteral(participant?.commission)}
      WHERE id = ${participantId};
      `);
    });
  });

  return statements.join("\n");
}

function getPolicyRea(changeIdValue) {
  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "Cession",
      fields: "id,contractId,lifePolicyId,coverageId,lineId,cover,LoB,product,policyCode,[start],[end],msg,sumInsured,premium,premiumType,sumInsuredCedant,premiumCedant,comissionCedant,sumInsuredRe,premiumRe,err,holderName,proportionCed,proportionRe,currency,distributionMode,contactId,coverageCode,coCommission,coPercentage,coPremium,coSumInsured,np,overwritten,changeId,anniversaryId,reserve,oldContractId,edited,loading,loadingCedant,loadingRe,sumInsuredComputed,fee,tax,nonTechnicalPremium,credit,jAmounts,comissionCedantExtra",
      filter: `changeId = ${changeIdValue} AND overwritten = 0`,
      noTracking: true
    }
  });

  if (!LoadEntities?.ok) {
    return [];
  }

  const cessions = Array.isArray(LoadEntities?.outData) ? LoadEntities.outData : [];
  return attachParticipantsToCessions(changeIdValue, cessions);
}

function getEmissionBaseCessions(policyIdValue) {
  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "Cession",
      fields: "id,contractId,lineId,coverageCode,premium, premiumRe,premiumType,nonTechnicalPremium, comissionCedant, tax",
      filter: `lifePolicyId = ${policyIdValue} AND premiumType IN ('NEW','ANNIVERSARY')`,
      noTracking: true
    }
  });

  if (!LoadEntities?.ok) {
    return [];
  }

  return Array.isArray(LoadEntities?.outData) ? LoadEntities.outData : [];
}

function attachParticipantsToCessions(changeIdValue, cessions) {
  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "CessionPart",
      fields: "id,cessionId,contactId,lineId,split,sumInsured,premium,name,liquidationId,currency,commission,tax,brokerId,reserve,fee",
      filter: `cessionId IN (SELECT id FROM Cession WHERE changeId = ${changeIdValue} AND overwritten = 0)`,
      noTracking: true
    }
  });

  if (!LoadEntities?.ok) {
    return Array.isArray(cessions) ? cessions : [];
  }

  const participants = Array.isArray(LoadEntities?.outData) ? LoadEntities.outData : [];
  return (Array.isArray(cessions) ? cessions : []).map(cession => {
    const cessionId = toValidNumber(cession?.id);
    const cessionParticipants = participants
      .filter(participant => toValidNumber(participant?.cessionId) === cessionId)
      .map(participant => cloneJson(participant));

    return {
      ...cession,
      Participants: cessionParticipants
    };
  });
}

function getChange(changeIdValue) {
  doCmd({
    cmd: "LoadEntity",
    data: {
      entity: "Change",
      fields: "id,Discriminator",
      filter: `id = ${changeIdValue}`,
      noTracking: true
    }
  });

  if (!LoadEntity?.ok) {
    return {};
  }

  return LoadEntity?.outData ?? {};
}

function getBaseNonTechnicalRatio(sourceCession, emissionBase) {
  return getBaseRatio(sourceCession, emissionBase, "nonTechnicalPremium");
}

function getBaseRatio(sourceCession, emissionBase, fieldName, denominatorField = "premium") {
  const source = Array.isArray(emissionBase) ? emissionBase : [];
  const match = source
    .filter(item =>
      normalizeText(item?.contractId) === normalizeText(sourceCession?.contractId) &&
      normalizeText(item?.lineId) === normalizeText(sourceCession?.lineId) &&
      normalizeText(item?.coverageCode) === normalizeText(sourceCession?.coverageCode)
    )
    .sort((a, b) => toNumber(b?.id) - toNumber(a?.id))[0];

  const basePremium = toNumber(match?.[denominatorField]);
  const baseValue = toNumber(match?.[fieldName]);

  if (basePremium > 0) {
    return baseValue / basePremium;
  }

  const sourcePremium = toNumber(sourceCession?.[denominatorField]);
  const sourceValue = toNumber(sourceCession?.[fieldName]);
  if (sourcePremium > 0) {
    return sourceValue / sourcePremium;
  }

  return 0;
}

//////////////////////////////////////////////////////////////////
// Helpers
//////////////////////////////////////////////////////////////////

function endStatement(ok, msg) {
  return { ok: !!ok, msg: normalizeText(msg) };
}

function redondear(valor, decimales = 2) {
  const num = toNumber(valor);
  const factor = Math.pow(10, decimales);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

function cloneJson(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    return [];
  }
}

function normalizeText(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function toValidNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

function sqlLiteral(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "string" && value.startsWith("@")) return value;
  if (value instanceof Date) return `'${value.toISOString().replace("T", " ").substring(0, 19)}'`;
  if (Array.isArray(value)) return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : "NULL";
  if (typeof value === "object") return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  return `'${String(value).replace(/'/g, "''")}'`;
}
