//block
//noreplace

/*
 * Name: cmdGenerateClaimDocument
 * Description: Generates a claim document from a template, filling it with the DTO returned by the
 *              template's context command (e.g. cmdContexDocReciboPago for 'Solcitud de Pago.docx'),
 *              and registers it in the claim's documents so it can be viewed from the claim.
 * Mission: MSN-000041 (globaluat)
 * Creation Date: 06/10/2026
 * Input: {
 *   claimId,            // claim where the document is generated (required)
 *   template,           // template file name, e.g. 'Solcitud de Pago.docx' (required)
 *   reportName,         // optional display name used when registering the document in the claim
 *   context,            // context sent to the DTO command, object or JSON string, e.g. { claimId: 265 } or { paymentId: 259 }
 *   contextChain        // optional: DTO command; by default the one configured for the template in the product's Documents[]
 * }
 *   The DTO command receives the context as sent. When the context has no 'row', it is also exposed as
 *   row (row.reclamo = claimId), which is the shape cmdContexDocReciboPago reads.
 * Output: { ok, msg, claimDocumentId, fileName, url, template, contextChain }
 */

const input = context || {};
const template = String(input.template || '').trim();
const reportName = String(input.reportName || '').trim();
const callerContext = parseContext(input.context);
const claimId = resolveClaimId(input, callerContext);

if (!template) {
    fail("No se recibió el nombre de la plantilla (template)");
}

const claim = getClaim(claimId);
const contextChain = String(input.contextChain || '').trim() || getTemplateContextChain(claim, template);

if (!contextChain) {
    fail(`La plantilla ${template} no tiene un comando de contexto configurado en el producto ${claim.productCode}; envíe contextChain`);
}

const dto = getDto(contextChain, buildChainContext(callerContext, claimId));
const generated = generateDoc(template, Object.assign({}, claim.data, { custom: dto }));

doCmd({
    cmd: "RepoClaimDocument",
    data: {
        operation: "ADD",
        entity: {
            claimId: claim.id,
            LifePolicyid: claim.lifePolicyId,
            contactId: claim.claimerId,
            fileName: reportName || generated.fileName,
            name: template,
            url: generated.url,
            created: new Date().toISOString()
        }
    }
});

if (!RepoClaimDocument.ok) {
    fail(`El documento se generó pero no se pudo registrar en el reclamo ${claimId}: ${RepoClaimDocument.msg}`);
}

const saved = toPlain(RepoClaimDocument.outData);
const savedDoc = Array.isArray(saved) ? saved[0] : saved;

return {
    ok: true,
    msg: `Documento ${template} generado en el reclamo ${claimId}`,
    claimDocumentId: savedDoc && savedDoc.id,
    fileName: generated.fileName,
    url: generated.url,
    template,
    contextChain
};


function parseContext(raw) {
    if (raw === undefined || raw === null || raw === '') return {};
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw);
        } catch (error) {
            fail("El contexto (context) no es un JSON válido");
        }
    }
    return toPlain(raw);
}

function resolveClaimId(data, ctx) {
    const candidates = [data.claimId, ctx.claimId, ctx.row && ctx.row.reclamo]
        .map(Number)
        .filter(v => Number.isInteger(v) && v > 0);

    if (!candidates.length) {
        fail("No se recibió el claimId");
    }
    if (candidates.some(v => v !== candidates[0])) {
        fail(`El claimId ${candidates[0]} no coincide con el reclamo del contexto (${candidates.join(', ')})`);
    }
    return candidates[0];
}

function getClaim(id) {
    doCmd({
        cmd: "RepoClaim",
        data: {
            operation: "GET",
            filter: `id = ${id}`
        }
    });

    const row = RepoClaim.outData && RepoClaim.outData[0];
    if (!row) {
        fail(`No se encontró el reclamo ${id}`);
    }
    const data = toPlain(row);

    if (!data.lifePolicyId) {
        fail(`El reclamo ${id} no tiene póliza asociada`);
    }

    doCmd({
        cmd: "LoadEntity",
        data: {
            entity: "LifePolicy",
            fields: "id, code, productCode",
            filter: `id = ${data.lifePolicyId}`
        }
    });

    const policy = LoadEntity.outData;

    return {
        id: data.id,
        lifePolicyId: data.lifePolicyId,
        claimerId: data.claimerId,
        productCode: policy && policy.productCode,
        data
    };
}

function getTemplateContextChain(claimInfo, templateName) {
    if (!claimInfo.productCode) return '';

    doCmd({
        cmd: "RepoProduct",
        data: {
            operation: "GET",
            filter: `code = '${String(claimInfo.productCode).replace(/'/g, "''")}'`
        }
    });

    const product = RepoProduct.outData && RepoProduct.outData[0];
    if (!product || !product.configJson) return '';

    let config;
    try {
        config = JSON.parse(product.configJson);
    } catch (error) {
        fail(`Configuración JSON inválida para el producto ${claimInfo.productCode}`);
    }

    const wanted = templateName.toUpperCase();
    const doc = (config.Documents || []).find(d =>
        String(d && d.template || '').trim().toUpperCase() === wanted &&
        (!d.entity || String(d.entity).trim().toUpperCase() === 'CLAIM'));

    const match = doc && String(doc.customContext || '').match(/chain\s*:\s*['"]([^'"]+)['"]/);
    return match ? match[1] : '';
}

function buildChainContext(ctx, id) {
    if (ctx.row && typeof ctx.row === 'object') {
        const row = Object.assign({ reclamo: id }, ctx.row);
        return Object.assign({}, ctx, { row });
    }
    return Object.assign({}, ctx, { row: Object.assign({ reclamo: id }, ctx) });
}

function getDto(chain, chainContext) {
    doCmd({
        cmd: "ExeChain",
        data: {
            chain,
            context: JSON.stringify(chainContext)
        }
    });

    if (!ExeChain.ok) {
        fail(`Error en el comando de contexto ${chain}: ${ExeChain.msg}`);
    }

    const out = toPlain(ExeChain.outData);

    if (!out || typeof out !== 'object') {
        fail(`El comando de contexto ${chain} no devolvió datos`);
    }
    if (out.error) {
        fail(String(out.msg || `El comando de contexto ${chain} devolvió un error`).replace(/^@/, ''));
    }
    if (typeof out.msg === 'string' && out.msg.startsWith('@')) {
        fail(out.msg.slice(1));
    }
    return out;
}

function generateDoc(templateName, data) {
    let out;
    // A cold document converter can answer outData.ok=false once (504): retry.
    for (let attempt = 1; attempt <= 3; attempt++) {
        doCmd({
            cmd: "GenerateDoc",
            data: {
                template: templateName,
                data
            }
        });

        if (!GenerateDoc.ok) {
            fail(`Error contactando el servidor de documentos: ${GenerateDoc.msg}`);
        }
        out = GenerateDoc.outData;
        if (out && out.ok) return { fileName: out.fileName, url: out.url };
    }
    fail(`Error generando el documento ${templateName}: ${out && out.msg}`);
}

function toPlain(value) {
    if (value === undefined || value === null) return value;
    return JSON.parse(JSON.stringify(value));
}

// '@' makes the platform return the message as-is (no formula dump)
function fail(message) {
    throw '@' + message;
}
