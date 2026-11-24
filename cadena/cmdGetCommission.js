//block
//noreplace
/**
 * @author Ernesto Garcia
 * @summary Commission/credit value of one coverage of a policy, for the rules of the commission scheme. The % comes from
 *          the configuration table CommissionSchemeTbl: one row per broker, branch and (optionally) product.
 * @param { Number } id Life Policy Id
 * @param { String } covCode coverage code
 * @param { Boolean } vsPayPlan the premium is split among the installments of the policy
 * @param { Number } oldPremium premium before an endorsement (reverse line); 0 = the coverage's current premium
 * @param { Number } premium v2.1: the premium to commission, as is (it may be 0 or negative). When it comes, oldPremium,
 *          the stored coverage premium and the surcharge share are not used: the scheme's endorsement rules send the
 *          coverage premium before (_oldCov) and after (_cov) the endorsement, and the cancellation rule the premium
 *          the cancellation refunds, so the commission follows the premium the endorsement books.
 * @param { Number } rate not used since v2.0: the scheme's rules still send it, the % comes from the table
 * @name cmdGetCommission
 * @env fatumuat, globaluat
 * @version 2.0 MSN-000223 (2026-11-20, globaluat). CommissionSchemeTbl columns: Code | Seller Id (broker contact id) |
 *          Seller Name (informative) | Lob Code (branch code) | Product Code (blank = the whole branch) | Commission %
 *          (1 = 1%). The row of the policy's product wins over the row of its branch; the first matching row counts.
 *          A broker without a row, or a policy without a broker, gets 0. Base: the coverage premium plus its share of
 *          the policy surcharges (as in v1). Result rounded to 2 decimals.
 * @version 2.1 MSN-000247 (2026-11-24, globaluat). New parameter premium (see above). Before it, the endorsement rule
 *          read the coverage premium from the database, which still holds the premium before the endorsement while it
 *          executes: the reverse and the new line cancelled out and the endorsement commission was always 0. Rounding
 *          is symmetric for negative amounts.
 */
const { id, covCode, vsPayPlan = false, oldPremium = 0, premium } = context;
const hasPremium = premium !== undefined && premium !== null && String(premium).trim() !== '';

if (!id) throw `@The quoted policy id cannot be empty.`;

doCmd({ cmd:'RepoLifePolicy', data:{ operation:'GET', filter:`id=${ id }`, include:['PayPlan', 'Changes', 'Coverages', 'Surcharges'], noTracking: true }});
const [ pol ] = RepoLifePolicy.outData;

// Surcharges/discounts of the policy, shared among the coverages that have premium
const surchargeAmount = pol.Surcharges.reduce((acc, cur) => acc + Number(cur.value || 0), 0);

// Coverage premium: the one the caller sends, else the one before the endorsement, else the stored one
let coveragePremium;
if (hasPremium) {
    coveragePremium = Number(premium);
    if (!isFinite(coveragePremium)) throw `@cmdGetCommission: invalid premium "${ premium }" for coverage ${ covCode } of policy ${ id }.`;
} else {
    const coverage = pol.Coverages.find(item => item.code == covCode);
    coveragePremium = oldPremium > 0 ? oldPremium : coverage.premium || coverage.basePremium;
}
if (coveragePremium == 0) return 0;

const coveragesWithPremium = pol.Coverages.filter(item => (item.premium || item.basePremium) > 0).length;
if (!hasPremium && surchargeAmount != 0 && coveragesWithPremium > 0) {
    coveragePremium += surchargeAmount / coveragesWithPremium;
}
const base = vsPayPlan ? (coveragePremium / pol.PayPlan.length) : coveragePremium;

// Broker of the policy: the last intermediary change wins
let sellerId = pol.sellerId;
if (pol.Changes.some(item => item.Discriminator == 'IntermediaryChange')) {
    const change = pol.Changes.filter(item => item.Discriminator == 'IntermediaryChange').pop();
    sellerId = change.newSellerId;

    // Same intermediary kept on the change: no commission
    if (change.oldSellerId === sellerId) return 0;
}
if (!sellerId) return 0;

doCmd({ cmd:'GetFullTable', data:{ table:'CommissionSchemeTbl', filter:'1=1' }});
const pct = getCommissionPct(GetFullTable.outData, sellerId, pol.lob, pol.productCode);
if (pct == null) return 0;

const com = base * pct / 100;
return Math.sign(com) * Math.round(Math.abs(com) * 100) / 100;

// % of the broker for the policy's product, else for its branch; null when the broker has no row for them
function getCommissionPct(table, sellerId, lob, productCode) {
    if (!table || table.length < 2) return null;
    const txt = v => String(v == null ? '' : v).trim();
    const head = table[0].map(txt);
    const cSeller = head.indexOf('Seller Id'), cLob = head.indexOf('Lob Code'),
          cProduct = head.indexOf('Product Code'), cPct = head.indexOf('Commission %');
    if (cSeller < 0 || cLob < 0 || cProduct < 0 || cPct < 0)
        throw `@CommissionSchemeTbl needs the columns Seller Id, Lob Code, Product Code and Commission %.`;

    const branch = txt(lob), product = txt(productCode).toUpperCase();
    const rows = table.slice(1).filter(r => r && txt(r[cSeller]) !== '' && Number(txt(r[cSeller])) === Number(sellerId));
    const row = rows.find(r => txt(r[cProduct]) !== '' && txt(r[cProduct]).toUpperCase() === product && (txt(r[cLob]) === '' || txt(r[cLob]) === branch))
        || rows.find(r => txt(r[cProduct]) === '' && txt(r[cLob]) === branch);
    if (!row) return null;

    const raw = txt(row[cPct]);
    const pct = Number(raw.replace('%', '').replace(',', '.'));
    if (raw === '' || !isFinite(pct) || pct < 0)
        throw `@CommissionSchemeTbl: invalid Commission % "${ raw }" for broker ${ sellerId }, branch ${ branch }, product ${ product }.`;
    return pct;
}
