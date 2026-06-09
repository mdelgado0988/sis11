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

let claim;
let policy;
let product;
let docs = [];

const claimId = context.claimId;

if (!claimId) {
    throw new Error("No se recibió el claimId");
}

setClaim();
setPolicy();
setProduct();
setSettlementDocs();

// Start generating documents
for (const doc of docs) {

    if (!doc?.template) {
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
                  template: doc.template
              }})
          }
    });
  
}

return {
    ok: true,
    msg: `Se generaron ${docs.length} finiquito(s)`
};


function setClaim() {

    doCmd({
        cmd: "LoadEntity",
        data: {
            entity: "Claim",
            fields: "id, lifePolicyId",
            filter: `id = ${claimId}`
        }
    });

    claim = LoadEntity.outData;

    if (!claim?.id) {
        throw new Error(`No se encontró el reclamo ${claimId}`);
    }

    if (!claim?.lifePolicyId) {
        throw new Error(`El reclamo ${claimId} no tiene póliza asociada`);
    }
}

function setPolicy() {

    doCmd({
        cmd: "LoadEntity",
        data: {
            entity: "LifePolicy",
            fields: "id, code, productCode",
            filter: `id = ${claim.lifePolicyId}`
        }
    });

    policy = LoadEntity.outData;

    if (!policy?.id) {
        throw new Error(`No se encontró la póliza ${claim.lifePolicyId}`);
    }

    if (!policy?.productCode) {
        throw new Error(`La póliza ${policy.code || policy.id} no tiene producto asociado`);
    }
}

function setProduct() {

    doCmd({
        cmd: "RepoProduct",
        data: {
            operation: "GET",
            filter: `code = '${policy.productCode}'`
        }
    });

    product = RepoProduct.outData?.[0];

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
}

function setSettlementDocs() {

    const documents = product?.eConfig?.Documents || [];

    docs = documents.filter(x =>
        (x?.entity || "").trim().toUpperCase() === "CLAIM" &&
        (x?.name || "").trim().toUpperCase().includes("FINIQUITO")
    );
}