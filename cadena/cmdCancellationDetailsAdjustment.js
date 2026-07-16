//block
//noreplace

/*
 * @name cmdCancellationDetailsAdjustment
 * @author Michael Delgado
 * @email michael.delgado@axxis-systems.com
 * @created 2026-07-16
 * @description Adjust cancellation coverage details using the bill proportion.
 * @input { contexto }
 * @output { ok, msg, contexto }
 * @note Cancellation changes do not generate BillDiff, so the calculation must use Bill and jDetail only.
 */

try {
  const contexto = normalizeContext(context);

  //doCmd({cmd: "GetPing", data: { contexto: JSON.stringify(context) }});
  
  const detail = parseJson(contexto?.jDetail) ?? {};
  const billSummary = buildBillSummary(contexto, detail);
  const coverageRows = buildCoverageRows(detail);

  if (!coverageRows.length) {
    throw new Error("No fue posible recuperar el detalle de coberturas del endoso");
  }

  const adjustedDetail = adjustCancellationDetail(detail, billSummary, coverageRows);
  persistAdjustedDetail(contexto, adjustedDetail);
  const adjustedContexto = {
    ...contexto,
    jDetail: JSON.stringify(adjustedDetail)
  };

  return {
    ok: true,
    msg: "Detalles de coberturas ajustados correctamente",
    data: adjustedContexto
  };
} catch (error) {
  return {
    ok: false,
    msg: error?.message || error?.toString?.() || String(error)
  };
}

function persistAdjustedDetail(contexto, adjustedDetail) {
  const entityId = toPositiveInt(contexto?.id ?? 0);

  if (entityId <= 0) {
    return;
  }

  const serializedDetail = JSON.stringify(adjustedDetail ?? {});
  doCmd({
    cmd: "SetField",
    data: {
      entity: "Change",
      entityId,
      fieldValue: `jDetail='${escapeSqlString(serializedDetail)}'`,
      raw: true
    }
  });

  if (!SetField?.ok) {
    throw new Error(SetField?.msg || "No fue posible actualizar jDetail");
  }
}

function normalizeContext(source) {
  const contexto = asObject(source?.change ?? source);

  if (!contexto) {
    throw new Error("El contexto de cancelacion es requerido");
  }

  const bill = asObject(contexto?.Bill ?? contexto?.bill);
  if (!bill) {
    throw new Error("La informacion de Bill es requerida para ajustar la cancelacion");
  }

  if (!parseJson(contexto?.jDetail)) {
    throw new Error("La informacion de detalle jDetail es requerida");
  }

  return contexto;
}

function buildBillSummary(contexto, detail) {
  const bill = asObject(contexto?.Bill ?? contexto?.bill);

  const targetCoverage = firstNumber([
    bill?.coverages,
    bill?.anualPremium,
    bill?.annualPremium,
    detail?.newCoverages,
    detail?.newAnnualPremium
  ]);

  const targetTax = firstNumber([
    bill?.tax,
    detail?.newTax,
    detail?.tax
  ]);

  const targetTotal = firstNumber([
    bill?.anualTotal,
    bill?.annualTotal,
    detail?.newAnnualPremium,
    round2(targetCoverage + targetTax)
  ]);

  const originalCoverage = firstNumber([
    detail?.oldCoverages,
    detail?.oldAnnualPremium,
    bill?.originalCoverages
  ]);

  const originalTotal = firstNumber([
    detail?.oldAnnualPremium,
    round2(originalCoverage + firstNumber([detail?.oldTax, 0]))
  ]);

  const prorate = firstNumber([
    detail?.prorate,
    computeProrate(detail),
    1
  ]);

  return {
    originalCoverage: round2(originalCoverage),
    originalTotal: round2(originalTotal),
    targetCoverage: round2(targetCoverage),
    targetTax: round2(targetTax),
    targetTotal: round2(targetTotal),
    prorate: round6(prorate),
    bill: bill || null
  };
}

function buildCoverageRows(detail) {
  const rows = asArray(detail?.Coverages);

  return rows
    .map((item, index) => normalizeCoverageRow(item, index))
    .filter(Boolean);
}

function normalizeCoverageRow(item, index) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const code = normalizeText(item.code ?? item.Code ?? item.coverageCode ?? "");
  const oldPremium = firstNumber([
    item.oldPremium,
    item.premium,
    item.startPremium,
    item.basePremium,
    item.amount
  ]);
  const newPremium = firstNumber([
    item.newPremium,
    item.premium,
    item.startPremium,
    item.basePremium,
    item.amount
  ]);

  return {
    id: toPositiveInt(item.id ?? 0) || index + 1,
    code,
    name: normalizeText(item.name ?? item.description ?? item.commercialName ?? ""),
    oldPremium: round2(oldPremium),
    newPremium: round2(newPremium),
    premiumDif: round2(firstNumber([item.premiumDif, 0])),
    premiumCost: round2(firstNumber([item.premiumCost, 0]))
  };
}

function adjustCancellationDetail(detail, billSummary, rows) {
  const originalCoverage = round6(
    rows.reduce((sum, row) => sum + Number(row.oldPremium ?? 0), 0)
  );

  const targetCoverage = round6(Number(billSummary?.targetCoverage ?? 0));
  const prorate = round6(Number(billSummary?.prorate ?? 1));
  const count = rows.length;

  let accumulatedTarget = 0;

  const adjustedRows = rows.map((row, index) => {
    const oldPremium = round2(row.oldPremium);
    const isLast = index === count - 1;

    let newPremium = 0;

    if (count === 1) {
      newPremium = round2(targetCoverage);
    } else if (isLast) {
      newPremium = round2(targetCoverage - accumulatedTarget);
    } else if (originalCoverage > 0) {
      newPremium = round2((oldPremium / originalCoverage) * targetCoverage);
      accumulatedTarget = round6(accumulatedTarget + newPremium);
    } else {
      newPremium = round2(count === 0 ? 0 : targetCoverage / count);
      accumulatedTarget = round6(accumulatedTarget + newPremium);
    }

    const premiumDif = round2(newPremium - oldPremium);
    const premiumCost = round2(premiumDif * prorate);

    return {
      ...row,
      oldPremium,
      newPremium,
      premiumDif,
      premiumCost
    };
  });

  const oldCoverages = round2(sumBy(adjustedRows, "oldPremium"));
  const newCoverages = round2(sumBy(adjustedRows, "newPremium"));
  const coveragesDif = round2(newCoverages - oldCoverages);
  const coveragesCost = round2(coveragesDif * prorate);

  const oldTax = firstNumber([
    detail?.oldTax,
    round2(firstNumber([detail?.oldAnnualPremium, 0]) - oldCoverages)
  ]);
  const newTax = round2(Number(billSummary?.targetTax ?? 0));
  const taxDif = round2(newTax - oldTax);
  const taxCost = round2(taxDif * prorate);

  const oldAnnualPremium = firstNumber([
    detail?.oldAnnualPremium,
    round2(oldCoverages + oldTax)
  ]);
  const newAnnualPremium = round2(Number(billSummary?.targetTotal ?? 0));
  const annualPremiumDif = round2(newAnnualPremium - oldAnnualPremium);
  const changeCost = round2(annualPremiumDif * prorate);

  return {
    ...detail,
    oldCoverages,
    newCoverages,
    coveragesDif,
    coveragesCost,
    oldTax,
    newTax,
    taxDif,
    taxCost,
    oldAnnualPremium,
    newAnnualPremium,
    annualPremiumDif,
    changeCost,
    Coverages: adjustedRows
  };
}

function computeProrate(detail) {
  const policyDuration = firstNumber([
    detail?.policyDuration,
    detail?.totalDays
  ]);
  const remainingDays = firstNumber([
    detail?.remainingDays,
    detail?.daysNotDevengados,
    detail?.daysNotEarned
  ]);

  if (policyDuration > 0 && remainingDays >= 0) {
    return remainingDays / policyDuration;
  }

  return 1;
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function parseJson(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

function asObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  return null;
}

function asArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === null || value === undefined || value === "") {
    return [];
  }

  return [value];
}

function firstNumber(values) {
  for (const value of asArray(values)) {
    if (isFiniteNumber(value)) {
      return Number(value);
    }
  }

  return 0;
}

function isFiniteNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric);
}

function toPositiveInt(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.trunc(numeric) : 0;
}

function round2(value) {
  return Number(Number(value ?? 0).toFixed(2));
}

function round6(value) {
  return Number(Number(value ?? 0).toFixed(6));
}

function sumBy(rows, field) {
  return asArray(rows).reduce((sum, row) => sum + Number(row?.[field] ?? 0), 0);
}

function escapeSqlString(value) {
  return String(value ?? "").replace(/'/g, "''");
}
