//block
//noreplace
/**
 * Name: cmdSetPolicyCommissionPct
 * Purpose: Records on a policy, right before it is issued, the commission % its scheme applies (Ad-Hoc Commission).
 * Author: AIDEN mission MSN-000227
 */
/*
 * v1.0 MSN-000227 (2026-11-20, globaluat). The commission is computed at issuance, per coverage, by the rules of the
 * policy's commission scheme. The rules of «Global General» call chain cmdGetCommission, whose % (the broker's row for
 * the product, else for the branch, in table CommissionSchemeTbl) was recorded nowhere: the policy's Ad-Hoc Commission
 * stayed empty and showed 0 next to a correct commission amount.
 * Called by the interceptor COMMISSION PCT ON ISSUE (IssuePolicy), right before the issue, so it reads the same broker,
 * product, branch and table the calculation reads a moment later (cmdGetCommission with pctOnly).
 * Writes only on a policy that is not issued yet, whose scheme applies at issuance (rules present, scheme active, policy
 * start within the scheme dates) and whose rules call cmdGetCommission. Any other policy is left as it is. A broker
 * without a row in the table, or a policy without a broker, records 0 (no commission).
 * Input  {policyId, write?}   write: true = the % is written; otherwise a dry run that only reports it.
 * Output {ok, msg, outData: {policyId, pct, previous, written, reason}}
 */
function hasText(s) {
  return s !== null && s !== undefined && String(s).trim() !== '';
}
function num(v) {
  return hasText(v) ? Number(v) : null;
}
function query(sql) {
  doCmd({cmd: 'DoQuery', data: {sql: sql}});
  if (!DoQuery.ok) throw 'cmdSetPolicyCommissionPct: ' + DoQuery.msg;
  var rows = DoQuery.outData;
  return rows && rows.length ? JSON.parse(JSON.stringify(rows)) : [];
}
function same(a, b) {
  return a !== null && b !== null && Math.abs(a - b) < 0.000005;
}
function result(policyId, pct, previous, written, reason) {
  var shown = previous === null ? '(empty)' : String(previous);
  var msg = 'Policy ' + policyId + ': commission % ';
  if (pct === null) msg += shown + ' left as it is';
  else if (written) msg += shown + ' -> ' + pct;
  else if (same(previous, pct)) msg += pct + ' already recorded';
  else msg += pct + ' (dry run, ' + shown + ' recorded)';
  return {ok: true, msg: msg + ' - ' + reason, outData: {policyId: policyId, pct: pct, previous: previous, written: written, reason: reason}};
}
function cmdSetPolicyCommissionPct(input) {
  var policyId = Number(input.policyId || 0);
  var write = input.write === true;
  if (!(policyId > 0)) return result(0, null, null, false, 'no policy id');
  var rows = query('SELECT p.id, p.active, p.activeDate, p.comContractId, p.comPercentage, c.name AS scheme,'
    + " CASE WHEN ISNULL(c.configJson, '') = '' THEN 0 ELSE 1 END AS hasRules,"
    + " CASE WHEN c.configJson LIKE '%cmdGetCommission%' THEN 1 ELSE 0 END AS usesTable,"
    + ' CASE WHEN c.active = 1 AND c.[start] <= p.[start] AND c.[end] >= p.[start] THEN 1 ELSE 0 END AS inForce'
    + ' FROM LifePolicy p LEFT JOIN ComContract c ON c.id = p.comContractId WHERE p.id = ' + policyId);
  if (!rows.length) return result(policyId, null, null, false, 'policy not found');
  var pol = rows[0];
  var previous = num(pol.comPercentage);
  if (pol.active === true || hasText(pol.activeDate)) return result(policyId, null, previous, false, 'policy already issued');
  if (!(Number(pol.comContractId || 0) > 0) || !hasText(pol.scheme)) return result(policyId, null, previous, false, 'no commission scheme');
  if (Number(pol.hasRules) !== 1) return result(policyId, null, previous, false, 'scheme ' + pol.scheme + ' has no rules');
  if (Number(pol.inForce) !== 1) return result(policyId, null, previous, false, 'scheme ' + pol.scheme + ' does not apply on the policy start date');
  if (Number(pol.usesTable) !== 1) return result(policyId, null, previous, false, 'the rules of scheme ' + pol.scheme + ' do not use cmdGetCommission');

  doCmd({cmd: 'ExeChain', data: {chain: 'cmdGetCommission', context: JSON.stringify({id: policyId, pctOnly: true})}});
  if (!ExeChain.ok) throw 'cmdSetPolicyCommissionPct: cmdGetCommission: ' + ExeChain.msg;
  var out = ExeChain.outData;
  var pct = num(out !== null && typeof out === 'object' && out.length !== undefined ? out[0] : out);
  if (pct === null || !isFinite(pct) || pct < 0) throw 'cmdSetPolicyCommissionPct: cmdGetCommission returned ' + JSON.stringify(out) + ' for policy ' + policyId;
  var reason = 'scheme ' + pol.scheme;
  if (same(previous, pct) || !write) return result(policyId, pct, previous, false, reason);

  doCmd({cmd: 'SetPolicyField', data: {policyId: policyId, fieldValue: 'comPercentage = ' + pct.toFixed(5)}});
  if (!SetPolicyField.ok) throw 'cmdSetPolicyCommissionPct: could not write the % on policy ' + policyId + ': ' + SetPolicyField.msg;
  var now = query('SELECT comPercentage FROM LifePolicy WHERE id = ' + policyId);
  var stored = now.length ? num(now[0].comPercentage) : null;
  if (!same(stored, pct)) throw 'cmdSetPolicyCommissionPct: policy ' + policyId + ' kept ' + stored + ' instead of ' + pct;
  return result(policyId, pct, previous, true, reason);
}
var input = typeof context === 'string' ? JSON.parse(context || '{}') : (context || {});
return cmdSetPolicyCommissionPct(input);
