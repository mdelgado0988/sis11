//block
//noreplace
/**
 * @name cmdValidateRenewIssuePolicy
 * @version 1.0.0
 * @created 2026-10-26 MSN-000101 / AXX-5688 (globaluat)
 * Interceptor chain of the trigger VALIDATE RENEW ISSUE POLICY (IssuePolicy, every product).
 * A renewal policy is a LifePolicy whose originalPolicyId has a value (ClonePolicy copies are cleaned by trigger 58).
 * It may only be issued by the renewal batch processes, which send renewalIssuance:true in the IssuePolicy data:
 * chain 799 cmdRenewalPolicyIssuance (renewal view, import 71 RenewalPolicyIssuance) and chain 844
 * cmdImportRenovacionCobis (import 78). The native issuance view sends only {policyId}: a renewal issued there is rejected.
 * Context: interceptor form {data:<IssuePolicy data>, command:'IssuePolicy'}, or {policyId, renewalIssuance?} for a dry run.
 * Answers {ok:true, renewal} or {ok:false, msg}. Never throws: an exception inside an interceptor lets the command through.
 */
try {
    const ctx = context || {};
    const data = ctx.command ? (ctx.data || {}) : ctx;
    const policyId = Number(data.policyId || 0);
    if (!Number.isInteger(policyId) || policyId <= 0) {
        return {ok: false, msg: 'Debe indicar una póliza válida para validar si es una renovación.'};
    }

    doCmd({cmd: 'LoadEntities', data: {
        entity: 'LifePolicy p LEFT JOIN LifePolicy o ON o.id=p.originalPolicyId',
        fields: 'p.id,p.code,p.policyVersion,p.originalPolicyId,o.code AS originalCode',
        filter: `p.id=${policyId}`,
        noTracking: true
    }});
    if (!LoadEntities.ok || !Array.isArray(LoadEntities.outData)) {
        return {ok: false, msg: `No se pudo validar si la póliza ${policyId} es una renovación: ${LoadEntities.msg || 'no se pudo leer la póliza'}.`};
    }
    if (LoadEntities.outData.length !== 1) {
        return {ok: false, msg: `No se encontró la póliza ${policyId} para validar si es una renovación.`};
    }

    const policy = LoadEntities.outData[0];
    if (policy.originalPolicyId === null || policy.originalPolicyId === undefined) {
        return {ok: true, policyId: policyId, renewal: false};
    }
    if (data.renewalIssuance === true) {
        return {ok: true, policyId: policyId, renewal: true, originalPolicyId: policy.originalPolicyId};
    }

    const version = Number(policy.policyVersion || 0);
    const label = (policy.code || `id ${policyId}`) + (version > 0 ? ` (versión ${version})` : '');
    const original = policy.originalCode ? `${policy.originalCode} (id ${policy.originalPolicyId})` : `id ${policy.originalPolicyId}`;
    return {ok: false, policyId: policyId, renewal: true, originalPolicyId: policy.originalPolicyId,
        msg: `No se puede emitir la póliza ${label}: es una renovación de la póliza ${original}. ` +
            `Las pólizas de renovación se emiten sólo desde la vista de renovación (Renovación por Lote), no desde la emisión directa.`};
} catch (ex) {
    return {ok: false, msg: `No se pudo validar si la póliza es una renovación antes de emitirla: ${ex.message || ex}`};
}
