//block
//noreplace
/*
 * @name: cmdCalculateGeneralTax
 * @description: Punto unico de calculo del impuesto del esquema tax_inc.
 *   Devuelve siempre { iva, icoa, iauto } para cualquier evento del esquema, de modo
 *   que cualquier ajuste futuro se hace aqui y no en cada regla.
 *
 *   Regla especial (MSN-000006): si la poliza pertenece a un ramo de Fianzas (81..84)
 *   y tiene al menos un coasegurador con rol de banco (BNK), se generan dos impuestos:
 *     IVA  = 5% sobre (prima total - prima cedida a coaseguradores banco)
 *     ICOA = 7% sobre la prima cedida a coaseguradores banco
 *   Si no aplica, IVA = tasa del ramo sobre la prima total e ICOA = 0, exactamente como antes.
 *
 *   Tasa del IVA por ramo (MSN-000150): CFG.rateIvaByLob da la tasa de los ramos que no
 *   usan la general; hoy ninguno. Todos los ramos, fianzas incluidas, usan CFG.rateIva (5 %).
 *   Aplica a todo evento que se calcula sobre la prima (emision, renovacion, endosos);
 *   cancelacion y orden de proceder reparten el impuesto ya calculado de la poliza.
 *
 *   Impuesto de Auto (MSN-000203): CFG.rateAutoByLob da la tasa del renglon "Impuesto de
 *   Auto" por ramo; hoy solo el ramo 6 (Automovil) con 1 %, aparte del IVA del 5 %. En los
 *   eventos sobre la prima iauto = tasa * prima anual. En cancelacion y orden de proceder el
 *   renglon de Auto solo existe si la poliza ya lo tiene (appliesAuto) y se lleva la parte
 *   del total que el Auto tiene en los impuestos vigentes de la poliza (renglones
 *   habilitados): una poliza emitida con un solo impuesto lo sigue teniendo entero en el IVA.
 *
 *   Casos especiales absorbidos desde las reglas del esquema:
 *     ChangeCancellation                -> total devuelto por cmdCalculateISCancellation
 *     ChangeCancellation + prima incobrable (UNCOLLECTIBLEPREMIUM) -> 0
 *     ChangeTerm / ChangeCoverage + orden de proceder (PROCEEDORDER) -> impuesto vigente
 *   En los tres casos el total se reparte entre IVA e ICOA en la misma proporcion que
 *   tendrian las bases del calculo normal (despues de separar el Auto), y la suma de los
 *   renglones es exacta.
 *
 * @input:  { action, mode, policyId, lob, anualPremium, policyTax, endorsementType,
 *            changeAdditional, effectiveDate,
 *            coinsurance: [{contactId, premiumCeded, overwritten, parentCoCession}] }
 *   mode "CHECK" devuelve solo el diagnostico (applies / appliesAuto / bases) sin calcular los
 *   totales caros: lo usan las condiciones de las reglas ICOA y Auto para no emitir el renglon
 *   cuando no aplica.
 * @output: { iva, icoa, iauto, total, applies, appliesAuto, bankPremium, netPremium, ivaBase,
 *            icoaBase, autoBase, rateIva, rateAuto }
 */

var CFG = {
  rateIva: 0.05,
  rateIvaByLob: {},
  rateAutoByLob: { "6": 0.01 },
  autoTaxName: "Impuesto de Auto",
  rateIcoa: 0.07,
  bankRole: "BNK",
  lobs: ["81", "82", "83", "84"]
};

var action = text(context.action);
var policyId = num(context.policyId);
var lob = text(context.lob);
var anualPremium = num(context.anualPremium);
var policyTax = num(context.policyTax);
var endorsementType = readEndorsementType();
var mode = text(context.mode).toUpperCase();
var effectiveDate = text(context.effectiveDate);
var rateIva = ivaRate(lob);
var rateAuto = autoRate(lob);

var cessions = coinsuranceRows();
var bankPremium = bankCededPremium(cessions);
var applies = bankPremium > 0;
var netPremium = round2(anualPremium - bankPremium);

var ivaBase = applies ? round2(rateIva * netPremium) : round2(rateIva * anualPremium);
var icoaBase = applies ? round2(CFG.rateIcoa * bankPremium) : 0;
var autoBase = round2(rateAuto * anualPremium);

var redistributes = action === "ChangeCancellation" ||
  ((action === "ChangeTerm" || action === "ChangeCoverage") && endorsementType === "PROCEEDORDER");
var currentTaxes = rateAuto > 0 && redistributes ? loadCurrentTaxes() : null;
var appliesAuto = rateAuto > 0 && (!redistributes || currentTaxes.hasAuto);

if (mode === "CHECK") {
  return {
    iva: 0,
    icoa: 0,
    iauto: 0,
    total: 0,
    applies: applies,
    appliesAuto: appliesAuto,
    bankPremium: round2(bankPremium),
    netPremium: netPremium,
    ivaBase: ivaBase,
    icoaBase: icoaBase,
    autoBase: autoBase,
    rateIva: rateIva,
    rateAuto: rateAuto,
    action: action,
    endorsementType: endorsementType
  };
}

var pair;

if (action === "ChangeCancellation") {
  pair = split(cancellationTax());
} else if (redistributes) {
  pair = split(round2(policyTax));
} else {
  pair = { iva: ivaBase, icoa: icoaBase, iauto: appliesAuto ? autoBase : 0 };
}

return {
  iva: round2(pair.iva),
  icoa: round2(pair.icoa),
  iauto: round2(pair.iauto),
  total: round2(round2(pair.iva) + round2(pair.icoa) + round2(pair.iauto)),
  applies: applies,
  appliesAuto: appliesAuto,
  bankPremium: round2(bankPremium),
  netPremium: netPremium,
  ivaBase: ivaBase,
  icoaBase: icoaBase,
  autoBase: autoBase,
  rateIva: rateIva,
  rateAuto: rateAuto,
  action: action,
  endorsementType: endorsementType
};

function readEndorsementType() {
  var direct = text(context.endorsementType);
  if (direct) return direct.toUpperCase();

  var raw = text(context.changeAdditional);
  if (!raw) return "";

  try {
    var parsed = JSON.parse(raw);
    return text(parsed && parsed.endorsementType).toUpperCase();
  } catch (error) {
    return "";
  }
}

function cancellationTax() {
  if (endorsementType === "UNCOLLECTIBLEPREMIUM") return 0;
  if (policyId <= 0) throw new Error("La poliza es requerida para calcular el impuesto de cancelacion");
  if (!effectiveDate) throw new Error("La fecha efectiva es requerida para calcular el impuesto de cancelacion");

  doCmd({
    cmd: "ExeChain",
    data: {
      chain: "cmdCalculateISCancellation",
      context: JSON.stringify({ policyId: policyId, effectiveDate: effectiveDate })
    }
  });

  if (!ExeChain || !ExeChain.ok) {
    throw new Error((ExeChain && ExeChain.msg) || "No fue posible calcular el impuesto de cancelacion");
  }

  return round2(num(ExeChain.outData));
}

function split(total) {
  var amount = round2(total);
  var iauto = 0;
  if (appliesAuto && currentTaxes && Math.abs(currentTaxes.total) > 0.005) {
    iauto = round2(amount * (currentTaxes.auto / currentTaxes.total));
  }
  var rest = round2(amount - iauto);
  var sum = round2(ivaBase + icoaBase);

  if (!applies || sum <= 0) return { iva: rest, icoa: 0, iauto: iauto };

  var icoa = round2(rest * (icoaBase / sum));
  return { iva: round2(rest - icoa), icoa: icoa, iauto: iauto };
}

function loadCurrentTaxes() {
  var result = { total: 0, auto: 0, hasAuto: false };
  if (policyId <= 0) return result;

  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "TaxGenerated",
      fields: "id, taxName, amount, disabled",
      filter: "lifePolicyId = " + policyId + " AND (disabled = 0 OR disabled IS NULL)",
      noTracking: true
    }
  });

  if (!LoadEntities || !LoadEntities.ok) {
    throw new Error("No fue posible leer los impuestos vigentes de la poliza");
  }

  var rows = asArray(LoadEntities.outData);
  for (var i = 0; i < rows.length; i++) {
    var amount = num(rows[i].amount);
    result.total += amount;
    if (text(rows[i].taxName) === CFG.autoTaxName) {
      result.auto += amount;
      result.hasAuto = true;
    }
  }
  return result;
}

function coinsuranceRows() {
  if (CFG.lobs.indexOf(lob) < 0) return [];

  var rows = asArray(context.coinsurance);
  if (rows.length === 0 && policyId > 0) rows = loadCessions();

  var valid = [];
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    if (!row) continue;
    if (truthy(row.overwritten)) continue;
    if (num(row.parentCoCession) > 0) continue;
    if (num(row.contactId) <= 0) continue;
    valid.push(row);
  }
  return valid;
}

function loadCessions() {
  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "CoCession",
      fields: "id, lifePolicyId, contactId, premiumCeded, percentage, overwritten, parentCoCession",
      filter: "lifePolicyId = " + policyId,
      noTracking: true
    }
  });

  if (!LoadEntities || !LoadEntities.ok) return [];
  return asArray(LoadEntities.outData);
}

function bankCededPremium(rows) {
  if (rows.length === 0) return 0;

  var ids = [];
  for (var i = 0; i < rows.length; i++) {
    var id = num(rows[i].contactId);
    if (id > 0 && ids.indexOf(id) < 0) ids.push(id);
  }
  if (ids.length === 0) return 0;

  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "ContactRole",
      fields: "id, contactId, role",
      filter: "role = '" + CFG.bankRole + "' AND contactId IN (" + ids.join(",") + ")",
      noTracking: true
    }
  });

  if (!LoadEntities || !LoadEntities.ok) {
    throw new Error("No fue posible leer los roles de los coaseguradores");
  }

  var bankIds = [];
  var roleRows = asArray(LoadEntities.outData);
  for (var j = 0; j < roleRows.length; j++) {
    var contactId = num(roleRows[j].contactId);
    if (contactId > 0 && bankIds.indexOf(contactId) < 0) bankIds.push(contactId);
  }

  var total = 0;
  for (var k = 0; k < rows.length; k++) {
    if (bankIds.indexOf(num(rows[k].contactId)) >= 0) total += num(rows[k].premiumCeded);
  }
  return round2(total);
}

function text(value) {
  return String(value === null || value === undefined ? "" : value).trim();
}

function ivaRate(lobCode) {
  var byLob = CFG.rateIvaByLob[lobCode];
  return byLob === undefined ? CFG.rateIva : byLob;
}

function autoRate(lobCode) {
  var byLob = CFG.rateAutoByLob[lobCode];
  return byLob === undefined ? 0 : byLob;
}

function num(value) {
  var parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round2(value) {
  return Number(Number(num(value)).toFixed(2));
}

function asArray(value) {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function truthy(value) {
  return value === true || value === 1 || String(value).toLowerCase() === "true";
}

/*
test:
action: QUOTE
policyId: 3947
lob: "81"
anualPremium: 1875
policyTax: 93.75
coinsurance:
  - contactId: 107
    premiumCeded: 656.25
    overwritten: false
*/
