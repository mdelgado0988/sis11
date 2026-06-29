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

const claimId = context.claimId;

if (!claimId) {
    throw new Error("No se recibió el claimId");
}

const claim = getClaim();
const policy = getPolicy(claim);
const reportCoverageName = getReportCoverageName(claimId);
const product = getProduct(policy);
const docs = getSettlementDocs(product, policy);
const docsToGenerate = docs.filter(doc => doc?.template);
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

    doCmd({cmd: 'PutMessage', 
        data: { 
            batch: `Generación de finiquito, reclamo ${claimId}`, 
            notify: false, 
            value: JSON.stringify({
                cmd: 'GenerateClaimDoc', 
                data: {
                    claimId,
                    template: doc.template,
                    reportName: getReportName(doc, reportCoverageName)
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
            fields: "id, code, productCode, cessionBeneficiary",
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
    const coverageId = Number((payments
        .flatMap(p => {
            const detail = safeJson(p?.jDetail, []);
            return Array.isArray(detail) ? detail : (detail?.detail || detail?.details || []);
        })
        .find(d => Number(d?.lifeCoverageId) > 0) || {}).lifeCoverageId || 0);

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
        !upperName.includes("ACREEDOR") &&
        reportCoverageName &&
        !upperName.includes(reportCoverageName.toUpperCase());

    return needsCoverageSuffix ? `${name} - ${reportCoverageName}` : name;
}

function safeJson(raw, fallback) {
    try {
        if (!raw || !String(raw).trim()) return fallback;
        return typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (error) {
        return fallback;
    }
}
