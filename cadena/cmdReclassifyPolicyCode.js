//block
//noreplace
/**
 * cmdReclassifyPolicyCode v1.0.0 - MSN-000207 (2026-11-18, globaluat)
 * Keeps the number of an offer in line with its current plan (product) when the plan is changed after the offer
 * was numbered. The number is made once, with the numbering rule of the plan the offer had at that moment
 * (Main.proposalPrefix + Main.policyCode; Main.certificateCode for a certificate), by POLICY CODE GENERATION
 * (chain cmdGeneratePolicyCode) or by the quote. Nothing rebuilt it afterwards: an offer created as GLD and
 * changed to GLC was issued as AU-GLD-...
 * Rule, for an offer that is not issued and is not a version or a renewal of another policy:
 *  - the number follows the rule of the current plan: left as it is;
 *  - it follows the rule of another product that takes its number from the same counter (same GetCode call):
 *    the number is kept and only the plan part changes (OFER-AU-GLD-000227 -> OFER-AU-GLC-000227);
 *  - it follows the rule of a product with another counter: a new number is taken from the current plan's counter;
 *  - it follows no product's rule (typed by hand, older rule): left as it is.
 * A number another policy already holds is never given: a new one is taken from the counter instead (3 tries).
 * Called by the interceptors POLICY CODE RECLASSIFY ON SAVE, ON QUOTE and ON ISSUE.
 * Input  {policyId, productCode?, policyType?, code?, write?, dryRun?}
 *   productCode, policyType, code: the values about to be saved (screen); the missing ones are read from the policy.
 *   write: the new number is written on the policy (quote from the database, issue).
 *   dryRun: GetCode runs as a simulation (no number consumed) and nothing is written.
 * Output {ok, msg, outData: {policyId, code, previous, changed, reason, written, dryRun}}
 */
var SENTINEL = '909090909';
var GETCODE = /exe\(\s*GetCode\b[^)]*\)/g;
var MAXCANDIDATES = 40;
function hasText(s) {
  return s !== null && s !== undefined && String(s).trim() !== '';
}
function sqlText(s) {
  return "N'" + String(s).split("'").join("''") + "'";
}
function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
}
function query(sql) {
  doCmd({cmd: 'DoQuery', data: {sql: sql}});
  if (!DoQuery.ok) throw 'cmdReclassifyPolicyCode: ' + DoQuery.msg;
  var rows = DoQuery.outData;
  return rows && rows.length ? JSON.parse(JSON.stringify(rows)) : [];
}
function evaluate(formula, pol) {
  doCmd({cmd: 'ExeFormula', data: {formula: formula, context: JSON.stringify({pol: pol})}});
  if (!ExeFormula.ok) return null;
  var out = ExeFormula.outData;
  var v = out && out.length !== undefined ? (out.length ? out[0] : null) : out;
  if (!hasText(v) || String(v) === 'undefined' || String(v) === 'null') return null;
  return String(v);
}
function counterOf(formula) {
  var found = String(formula).match(GETCODE) || [];
  return found.length === 1 ? found[0].replace(/\s+/g, '').split('"').join("'") : '';
}
function withNumber(formula, n) {
  return String(formula).replace(GETCODE, '(' + n + ')');
}
function simulated(formula) {
  return String(formula).replace(/exe\(\s*GetCode\s*(,|\))/g, function (m, c) {
    return c === ',' ? 'exe(GetCode,simulation:true,' : 'exe(GetCode,simulation:true)';
  });
}
function leadingText(formula) {
  var m = String(formula).match(/^\s*'([^'\\]*)'/) || String(formula).match(/^\s*"([^"\\]*)"/);
  return m ? m[1] : '';
}
function stripPrefix(code, prefix) {
  return hasText(prefix) && code.indexOf(prefix) === 0 ? code.substring(prefix.length) : code;
}
function polFor(pol, productCode) {
  var copy = JSON.parse(JSON.stringify(pol));
  copy.productCode = productCode;
  return copy;
}
function patternOf(formula, pol) {
  var text = evaluate(withNumber(formula, SENTINEL), pol);
  if (text === null) return null;
  var parts = text.split(SENTINEL);
  if (parts.length !== 2) return null;
  return new RegExp('^' + escapeRe(parts[0]) + '(\\d+)' + escapeRe(parts[1]) + '$');
}
function takenBy(code, prefix, policyId) {
  var issued = stripPrefix(code, prefix);
  var rows = query('SELECT TOP 1 id FROM LifePolicy WHERE id <> ' + policyId + ' AND code IN (' + sqlText(code) + ', ' + sqlText(issued) + ')');
  return rows.length ? rows[0].id : 0;
}
function freshNumber(formula, prefix, pol, policyId, dryRun) {
  var tries = dryRun ? 1 : 3;
  for (var i = 1; i <= tries; i++) {
    var n = evaluate(dryRun ? simulated(formula) : formula, pol);
    if (n === null) throw 'cmdReclassifyPolicyCode: numbering rule of product ' + pol.productCode + ' returned no value';
    var candidate = prefix + n;
    var other = takenBy(candidate, prefix, policyId);
    if (!other || dryRun) return candidate;
    if (i === tries) throw 'cmdReclassifyPolicyCode: number ' + candidate + ' is already used by policy ' + other;
  }
  return '';
}
function result(policyId, code, previous, changed, reason, written, dryRun) {
  var msg = changed
    ? 'Policy ' + policyId + ': number ' + previous + ' -> ' + code + (dryRun ? ' (dry run)' : '') + ' - ' + reason
    : 'Policy ' + policyId + ': number ' + (previous || '(none)') + ' kept - ' + reason;
  return {ok: true, msg: msg, outData: {policyId: policyId, code: code, previous: previous, changed: changed, reason: reason, written: written, dryRun: dryRun}};
}
function productRules(where) {
  return "SELECT q.code, q.policyFormula, q.certificateFormula, q.proposalPrefix FROM (SELECT pr.code,"
    + " CASE WHEN ISJSON(pr.configJson) = 1 THEN JSON_VALUE(pr.configJson, '$.Main.policyCode') END AS policyFormula,"
    + " CASE WHEN ISJSON(pr.configJson) = 1 THEN JSON_VALUE(pr.configJson, '$.Main.certificateCode') END AS certificateFormula,"
    + " CASE WHEN ISJSON(pr.configJson) = 1 THEN JSON_VALUE(pr.configJson, '$.Main.proposalPrefix') END AS proposalPrefix"
    + " FROM Product pr) q WHERE " + where;
}
function cmdReclassifyPolicyCode(input) {
  var policyId = Number(input.policyId || 0);
  var dryRun = input.dryRun === true;
  var write = input.write === true && !dryRun;
  if (!(policyId > 0)) return result(0, '', '', false, 'no policy id', false, dryRun);
  var rows = query('SELECT * FROM LifePolicy WHERE id = ' + policyId);
  if (!rows.length) return result(policyId, '', '', false, 'policy not found', false, dryRun);
  var pol = rows[0];
  var code = hasText(input.code) ? String(input.code).trim() : (hasText(pol.code) ? String(pol.code).trim() : '');
  if (pol.active === true || hasText(pol.activeDate)) return result(policyId, code, code, false, 'policy already issued', false, dryRun);
  if (Number(pol.originalPolicyId || 0) > 0 || Number(pol.policyVersion || 0) > 0) return result(policyId, code, code, false, 'version or renewal of another policy', false, dryRun);
  if (code === '') return result(policyId, '', '', false, 'no number yet', false, dryRun);
  var productCode = hasText(input.productCode) ? String(input.productCode).trim() : String(pol.productCode || '').trim();
  var policyType = (hasText(input.policyType) ? String(input.policyType) : String(pol.policyType || '')).trim().toUpperCase();
  var field = policyType === 'C' ? 'certificateFormula' : 'policyFormula';
  pol = polFor(pol, productCode);
  if (policyType !== '') pol.policyType = policyType;

  var own = query(productRules('q.code = ' + sqlText(productCode)));
  if (!own.length) return result(policyId, code, code, false, 'product ' + productCode + ' not found', false, dryRun);
  var formula = own[0][field];
  if (!hasText(formula)) return result(policyId, code, code, false, 'product ' + productCode + ' has no numbering rule', false, dryRun);
  var counter = counterOf(formula);
  if (counter === '') return result(policyId, code, code, false, 'numbering rule of ' + productCode + ' does not take one number from a counter', false, dryRun);
  var prefix = hasText(own[0].proposalPrefix) ? String(own[0].proposalPrefix) : '';
  var ownPattern = patternOf(formula, pol);
  if (ownPattern === null) return result(policyId, code, code, false, 'numbering rule of ' + productCode + ' could not be evaluated', false, dryRun);
  if (ownPattern.test(stripPrefix(code, prefix))) return result(policyId, code, code, false, 'number follows the rule of ' + productCode, false, dryRun);

  var others = query(productRules('q.code <> ' + sqlText(productCode) + ' AND q.' + field + ' IS NOT NULL'));
  var candidates = [];
  for (var i = 0; i < others.length; i++) {
    var f = others[i][field];
    var k = counterOf(f);
    if (k === '') continue;
    var pp = hasText(others[i].proposalPrefix) ? String(others[i].proposalPrefix) : '';
    var bare = stripPrefix(code, pp);
    var lead = leadingText(f);
    if (lead !== '' && bare.indexOf(lead) !== 0) continue;
    candidates.push({product: others[i].code, formula: f, bare: bare, hadPrefix: bare !== code, sameCounter: k === counter});
  }
  candidates.sort(function (a, b) { return (b.sameCounter ? 1 : 0) - (a.sameCounter ? 1 : 0); });
  var found = null;
  for (var j = 0; j < candidates.length && j < MAXCANDIDATES; j++) {
    var c = candidates[j];
    var cpol = polFor(pol, c.product);
    var re = patternOf(c.formula, cpol);
    if (re === null) continue;
    var m = re.exec(c.bare);
    if (!m) continue;
    var n = Number(m[1]);
    if (!(n >= 0) || evaluate(withNumber(c.formula, n), cpol) !== c.bare) continue;
    found = {product: c.product, number: n, hadPrefix: c.hadPrefix, sameCounter: c.sameCounter};
    break;
  }
  if (found === null) return result(policyId, code, code, false, 'number follows no product rule (typed by hand or older rule)', false, dryRun);

  var next = '';
  var reason = '';
  if (found.sameCounter) {
    var rebuilt = evaluate(withNumber(formula, found.number), pol);
    if (rebuilt === null) return result(policyId, code, code, false, 'numbering rule of ' + productCode + ' could not be evaluated', false, dryRun);
    next = (found.hadPrefix ? prefix : '') + rebuilt;
    reason = 'plan ' + found.product + ' -> ' + productCode + ', same counter: number kept';
    var holder = takenBy(next, prefix, policyId);
    if (holder) {
      reason = 'plan ' + found.product + ' -> ' + productCode + ': ' + next + ' already used by policy ' + holder + ', new number from the counter';
      next = '';
    }
  } else {
    reason = 'plan ' + found.product + ' -> ' + productCode + ', another counter: new number from the counter of ' + productCode;
  }
  if (next === '') next = freshNumber(formula, prefix, pol, policyId, dryRun);
  if (next === code) return result(policyId, code, code, false, 'number follows the rule of ' + productCode, false, dryRun);

  var written = false;
  if (write) {
    doCmd({cmd: 'SetPolicyField', data: {policyId: policyId, fieldValue: 'code = CASE WHEN code = ' + sqlText(code) + ' THEN ' + sqlText(next) + ' ELSE code END'}});
    if (!SetPolicyField.ok) throw 'cmdReclassifyPolicyCode: could not write number ' + next + ' on policy ' + policyId + ': ' + SetPolicyField.msg;
    var now = query('SELECT code FROM LifePolicy WHERE id = ' + policyId);
    var stored = now.length && hasText(now[0].code) ? String(now[0].code).trim() : '';
    if (stored !== next) return result(policyId, stored, code, false, 'number changed by another process to ' + stored + ', ' + next + ' not used', false, dryRun);
    written = true;
  }
  return result(policyId, next, code, true, reason, written, dryRun);
}
var input = typeof context === 'string' ? JSON.parse(context || '{}') : (context || {});
return cmdReclassifyPolicyCode(input);
