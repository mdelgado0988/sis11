//block
//noreplace

/*
 * Name: cmdGenerateClaimSettlement
 * Description: Generates the claim settlement document and initiates the corresponding settlement process.
 * Author: Michael Delgado
 * Email: michael.delgado@axxis-systems.com
 * Creation Date: 06/09/2026
 * Input: { claimId }
 * Output: { ok, msg }
 */

const claimId = context?.claimId;

if (!claimId) {
    throw new Error("No se recibió el claimId");
}

const claim = getClaim();
const policy = getPolicy(claim);
const reportCoverageName = getReportCoverageName(claimId);
const product = getProduct(policy);
const docs = getSettlementDocs(product, policy);
const docsToGenerate = docs.filter(doc => doc?.template);
const isAutoPolicy = String(policy.lob || '').trim() === '6';
const autoPayoutForms = isAutoPolicy
    ? getAutoPayoutForms(claimId)
    : new Set();
let sentDocs = 0;

if (!docs.length) {
    return {
        ok: false,
        msg: "No hay finiquitos configurados para este producto"
    };
}

if (!docsToGenerate.length) {
    return {
        ok: false,
        msg: "Los finiquitos configurados no tienen plantilla"
    };
}

// Start generating documents
for (const doc of docsToGenerate) {
    const autoSettlement = isAutoPolicy ? getAutoSettlementDefinition(doc) : null;

    // Auto settlements require a paid, active payout with the exact affected-object form.
    if (autoSettlement && !autoPayoutForms.has(autoSettlement.formName)) {
        continue;
    }

    doCmd({cmd: 'PutMessage', 
        data: { 
            batch: `Generación de finiquito, reclamo ${claimId}`, 
            notify: false, 
            value: JSON.stringify({
                cmd: 'GenerateClaimDoc', 
                data: {
                    claimId,
                    template: doc.template,
                    reportName: getReportName(doc, reportCoverageName),
                    context: autoSettlement
                        ? { claimId, tipo: autoSettlement.tipo }
                        : undefined
                }})
            }
    });

    sentDocs += 1;
  
}

return {
    ok: true,
    msg: `Se generaron ${sentDocs} finiquito(s)`
};


function getClaim() {

    doCmd({
        cmd: "LoadEntity",
        data: {
            entity: "Claim",
            fields: "id, lifePolicyId",
            filter: `id = ${claimId}`
        }
    });

    const claim = LoadEntity.outData;

    if (!claim?.id) {
        throw new Error(`No se encontró el reclamo ${claimId}`);
    }

    if (!claim?.lifePolicyId) {
        throw new Error(`El reclamo ${claimId} no tiene póliza asociada`);
    }

    return claim;
}

function getPolicy(claim) {

    doCmd({
        cmd: "LoadEntity",
        data: {
            entity: "LifePolicy",
            fields: "id, code, lob, productCode, cessionBeneficiary",
            filter: `id = ${claim.lifePolicyId}`
        }
    });

    const policy = LoadEntity.outData;

    if (!policy?.id) {
        throw new Error(`No se encontró la póliza ${claim.lifePolicyId}`);
    }

    if (!policy?.productCode) {
        throw new Error(`La póliza ${policy.code || policy.id} no tiene producto asociado`);
    }

    return policy;
}

function getReportCoverageName(claimId) {
    doCmd({
        cmd: "LoadEntities",
        data: {
            entity: "ClaimPayment",
            fields: "jDetail",
            filter: `claimId = ${claimId} AND entityState = 'EXECUTED'`
        }
    });

    const payments = LoadEntities.outData || [];
    const coverageIds = payments
        .flatMap(p => {
            const detail = safeJson(p?.jDetail, []);
            return Array.isArray(detail) ? detail : (detail?.detail || detail?.details || []);
        })
        .map(d => Number(d?.lifeCoverageId))
        .filter(id => id > 0);

    const coverageId = coverageIds.length ? Math.min(...coverageIds) : 0;

    if (!coverageId) {
        return "";
    }

    doCmd({
        cmd: "LoadEntity",
        data: {
            entity: "LifeCoverage",
            fields: "id, name",
            filter: `id = ${coverageId}`
        }
    });

    return LoadEntity.outData?.name || "";
}

function getProduct(policy) {

    doCmd({
        cmd: "RepoProduct",
        data: {
            operation: "GET",
            filter: `code = '${policy.productCode}'`
        }
    });

    const product = RepoProduct.outData?.[0];

    if (!product) {
        throw new Error(`No se encontró el producto ${policy.productCode}`);
    }

    try {
        product.eConfig = product.configJson
            ? JSON.parse(product.configJson)
            : {};
    } catch (error) {
        throw new Error(`Configuración JSON inválida para el producto ${policy.productCode}`);
    }

    return product;
}

function getSettlementDocs(product, policy) {

    const documents = product?.eConfig?.Documents || [];
    const hasCessionBeneficiary = Boolean(policy?.cessionBeneficiary);

    return documents.filter(x => {
        const entity = (x?.entity || "").trim().toUpperCase();
        const name = (x?.name || "").trim().toUpperCase();

        if (entity !== "CLAIM" || !name.includes("FINIQUITO")) {
            return false;
        }

        if (name.includes("(ACREEDOR)")) {
            return hasCessionBeneficiary;
        }

        if (name.includes("(SIN ACREEDOR)")) {
            return !hasCessionBeneficiary;
        }

        return true;
    });
}

function getReportName(doc, reportCoverageName) {
    const name = String(doc?.name || "").trim();
    const upperName = name.toUpperCase();
    const needsCoverageSuffix =
        upperName.includes("FINIQUITO") &&
        !upperName.includes("(ACREEDOR)") &&
        reportCoverageName &&
        !upperName.includes(reportCoverageName.toUpperCase());

    return needsCoverageSuffix ? `${name} - ${reportCoverageName}` : name;
}

function getAutoPayoutForms(claimId) {
    doCmd({
        cmd: 'RepoLifeCoveragePayout',
        data: {
            operation: 'GET',
            filter: `claimId = ${claimId} AND payed <> 0 AND status <> 2`,
            size: 0,
            page: 0
        }
    });

    const forms = new Set();
    const payouts = Array.isArray(RepoLifeCoveragePayout?.outData)
        ? RepoLifeCoveragePayout.outData
        : [];
    payouts.forEach(payout => collectAffectedForms(safeJson(payout?.jAffectedObjects, null), forms));
    return forms;
}

function collectAffectedForms(value, forms) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
        value.forEach(item => collectAffectedForms(item, forms));
        return;
    }

    const formName = String(value.formName || '').trim();
    if (formName) forms.add(formName);
    Object.keys(value).forEach(key => collectAffectedForms(value[key], forms));
}

function getAutoSettlementDefinition(doc) {
    const customContext = String(doc?.customContext || '');
    if (!/cmdFiniquitoAU/i.test(customContext)) return null;

    const configuredType = customContext.match(/\b(?:tipo|type)\s*[:=]\s*['"]?([0-3])\b/i);
    const source = `${doc?.name || ''} ${doc?.template || ''}`.toUpperCase();
    const tipo = configuredType ? Number(configuredType[1]) : getAutoSettlementTypeFromName(source);
    const formByType = {
        0: 'frmOAAutomovilAsegurado',
        1: 'frmOAAutomovil',
        2: 'frmOAPersonaAfectada',
        3: 'frmOAPersonaAseguradaAU'
    };

    if (!Object.prototype.hasOwnProperty.call(formByType, tipo)) {
        throw new Error(`No se pudo determinar el tipo de cmdFiniquitoAU para la plantilla ${doc?.template || doc?.name || '(sin nombre)'}.`);
    }

    return { tipo, formName: formByType[tipo] };
}

function getAutoSettlementTypeFromName(source) {
    const normalized = String(source || '').replace(/[^A-Z0-9]/g, '');
    if (normalized.includes('PAGOAFECTADO')) return 2;
    if (normalized.includes('PAGOASEGURADO')) return 3;
    if (normalized.includes('AUTOAFECTADO')) return 1;
    if (normalized.includes('AUTOASEGURADO')) return 0;
    return NaN;
}

function safeJson(raw, fallback) {
    try {
        if (!raw || !String(raw).trim()) return fallback;
        return typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (error) {
        return fallback;
    }
}
