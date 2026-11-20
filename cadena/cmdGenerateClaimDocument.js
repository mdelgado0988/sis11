//block
//noreplace

/*
 * Name: cmdGenerateClaimDocument
 * Description: Generates a claim document from a template, filling it with the DTO returned by the
 *              template's context command (e.g. cmdContexDocReciboPago for 'Solcitud de Pago.docx'),
 *              and registers it in the claim's documents so it can be viewed from the claim.
 * Mission: MSN-000041 (globaluat); MSN-000136: requests that belong to no claim; MSN-000224: order of payment
 * Creation Date: 06/10/2026
 * Input: {
 *   claimId,            // claim where the document is generated (required unless the context carries a paymentId)
 *   template,           // template file name, e.g. 'Solcitud de Pago.docx' (required)
 *   reportName,         // optional display name used when registering the document in the claim
 *   context,            // context sent to the DTO command, object or JSON string, e.g. { claimId: 265 } or { paymentId: 259 }
 *   contextChain,       // optional: DTO command; by default the one configured for the template in the product's Documents[]
 *   ifConfigured        // optional (MSN-000224): true = when the claim's product has no entry for the template, do nothing
 *                       // and answer { ok: true, skipped: true } instead of failing (used by the request triggers)
 * }
 *   The DTO command receives the context as sent. When the context has no 'row', it is also exposed as
 *   row (row.reclamo = claimId), which is the shape cmdContexDocReciboPago reads.
 *   Without claimId, the claim is taken from the request (context.paymentId / row.solicitud). When the request
 *   belongs to no claim (e.g. a merge of requests from several claims), contextChain is required: the DTO
 *   command receives row.solicitud = row.paymentId = the request, without row.reclamo, and the document is
 *   generated from the request alone and returned without being registered in any claim (claimDocumentId null).
 *   MSN-000224: when the template is the payment request ('Solcitud de Pago.docx') and the claim's product has a
 *   Documents[] entry for 'Solicitud Orden de Pago.docx', the order of payment of the same request is generated right
 *   after it, with the DTO of its own entry's command (the same DTO when it is the same command), and registered as
 *   'Solicitud orden de pago No. <request>'. Its failure does not undo the payment request document: it is returned in
 *   paymentOrder { ok, msg }. Called with the order's template itself and no reportName, the document gets that same
 *   name (the request from the context, else the one the DTO command chose).
 * Output: { ok, msg, claimDocumentId, fileName, url, template, contextChain, paymentId, paymentOrder, skipped }
 */

const input = context || {};
const template = String(input.template || '').trim();
const reportName = String(input.reportName || '').trim();
const callerContext = parseContext(input.context);
const paymentId = resolvePaymentId(input, callerContext);
const claimId = resolveClaimId(input, callerContext, paymentId);
const paymentRequestTemplate = 'Solcitud de Pago.docx';
const paymentOrderTemplate = 'Solicitud Orden de Pago.docx';
const productConfigs = {};

if (!template) {
    fail("No se recibió el nombre de la plantilla (template)");
}

if (!claimId) {
    return generateRequestDocument(paymentId);
}

const claim = getClaim(claimId);
const contextChain = String(input.contextChain || '').trim() || getTemplateContextChain(claim, template);

if (!contextChain) {
    if (input.ifConfigured === true) {
        return { ok: true, skipped: true, msg: `La plantilla ${template} no está configurada en el producto ${claim.productCode}`, template };
    }
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
            fileName: reportName || defaultDocumentName(dto) || generated.fileName,
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

const paymentOrder = generatePaymentOrder(claim, dto, contextChain);

return {
    ok: true,
    msg: `Documento ${template} generado en el reclamo ${claimId}` + (paymentOrder && !paymentOrder.ok
        ? `; no se generó ${paymentOrderTemplate}: ${paymentOrder.msg}` : ''),
    claimDocumentId: savedDoc && savedDoc.id,
    fileName: generated.fileName,
    url: generated.url,
    template,
    contextChain,
    paymentOrder
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

function resolveClaimId(data, ctx, requestId) {
    const candidates = [data.claimId, ctx.claimId, ctx.row && ctx.row.reclamo]
        .map(Number)
        .filter(v => Number.isInteger(v) && v > 0);

    if (!candidates.length) {
        if (!requestId) {
            fail("No se recibió el claimId ni la solicitud (paymentId)");
        }
        // 0 = the request belongs to no claim
        return getPaymentClaimId(requestId);
    }
    if (candidates.some(v => v !== candidates[0])) {
        fail(`El claimId ${candidates[0]} no coincide con el reclamo del contexto (${candidates.join(', ')})`);
    }
    return candidates[0];
}

function resolvePaymentId(data, ctx) {
    const row = ctx.row && typeof ctx.row === 'object' ? ctx.row : {};
    const candidates = [data.paymentId, ctx.paymentId, ctx.solicitud, row.solicitud, row.paymentId]
        .map(Number)
        .filter(v => Number.isInteger(v) && v > 0);
    return candidates.length ? candidates[0] : 0;
}

function getPaymentClaimId(id) {
    doCmd({
        cmd: "LoadEntity",
        data: {
            entity: "ClaimPayment",
            fields: "id, claimId",
            filter: `id = ${id}`
        }
    });

    const payment = LoadEntity.outData;
    if (!payment || !payment.id) {
        fail(`No se encontró la solicitud ${id}`);
    }
    const value = Number(payment.claimId);
    return Number.isInteger(value) && value > 0 ? value : 0;
}

// The request belongs to no claim: the document comes from the request alone and is not registered in any claim.
function generateRequestDocument(id) {
    const chain = String(input.contextChain || '').trim();
    if (!chain) {
        fail(`La solicitud ${id} no pertenece a un reclamo: envíe contextChain con el comando de contexto de la plantilla ${template}`);
    }

    const row = Object.assign({}, callerContext.row && typeof callerContext.row === 'object' ? callerContext.row : {}, { solicitud: id, paymentId: id });
    delete row.reclamo;

    const dto = getDto(chain, Object.assign({}, callerContext, { row }));
    if (!Object.keys(dto).some(key => key !== 'ok' && key !== 'msg')) {
        fail(`El comando de contexto ${chain} no devolvió datos para la solicitud ${id}`);
    }
    const generated = generateDoc(template, { custom: dto });

    return {
        ok: true,
        msg: `Documento ${template} generado para la solicitud ${id}, que no pertenece a un reclamo (no se registra en ningún reclamo)`,
        claimDocumentId: null,
        fileName: generated.fileName,
        url: generated.url,
        template,
        contextChain: chain,
        paymentId: id
    };
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
    const config = getProductConfig(claimInfo.productCode);
    const wanted = templateName.toUpperCase();
    const doc = (config.Documents || []).find(d =>
        String(d && d.template || '').trim().toUpperCase() === wanted &&
        (!d.entity || String(d.entity).trim().toUpperCase() === 'CLAIM'));

    const match = doc && String(doc.customContext || '').match(/chain\s*:\s*['"]([^'"]+)['"]/);
    return match ? match[1] : '';
}

// One read of the product per run: the payment request and its order of payment look up the same product.
function getProductConfig(productCode) {
    const code = String(productCode || '');
    if (!code) return {};
    if (productConfigs[code]) return productConfigs[code];

    doCmd({
        cmd: "RepoProduct",
        data: {
            operation: "GET",
            filter: `code = '${code.replace(/'/g, "''")}'`
        }
    });

    const product = RepoProduct.outData && RepoProduct.outData[0];
    let config = {};
    if (product && product.configJson) {
        try {
            config = JSON.parse(product.configJson);
        } catch (error) {
            fail(`Configuración JSON inválida para el producto ${code}`);
        }
    }
    productConfigs[code] = config;
    return config;
}

// MSN-000224: «Solicitud orden de pago No. <request>»: the request from the context, else the one the DTO is about; '' if none.
function paymentOrderName(dto) {
    const requestNumber = Number(paymentId || (dto && dto.id));
    return Number.isInteger(requestNumber) && requestNumber > 0 ? `Solicitud orden de pago No. ${requestNumber}` : '';
}

// Name of a document generated without reportName: the order of payment keeps its own name, any other template the file's.
function defaultDocumentName(dto) {
    return template.toUpperCase() === paymentOrderTemplate.toUpperCase() ? paymentOrderName(dto) : '';
}

// MSN-000224: the order of payment of the request whose payment request document was just registered, for products with
// a Documents[] entry for it. null when it does not apply.
function generatePaymentOrder(claimInfo, requestDto, requestChain) {
    if (template.toUpperCase() !== paymentRequestTemplate.toUpperCase()) return null;
    const orderChain = getTemplateContextChain(claimInfo, paymentOrderTemplate);
    if (!orderChain) return null;

    const orderName = paymentOrderName(requestDto);
    if (!orderName) {
        return { ok: false, template: paymentOrderTemplate, msg: 'no se identificó el número de la solicitud' };
    }

    try {
        const orderDto = orderChain === requestChain ? requestDto : getDto(orderChain, buildChainContext(callerContext, claimInfo.id));
        const orderDoc = generateDoc(paymentOrderTemplate, Object.assign({}, claimInfo.data, { custom: orderDto }));

        doCmd({
            cmd: "RepoClaimDocument",
            data: {
                operation: "ADD",
                entity: {
                    claimId: claimInfo.id,
                    LifePolicyid: claimInfo.lifePolicyId,
                    contactId: claimInfo.claimerId,
                    fileName: orderName,
                    name: paymentOrderTemplate,
                    url: orderDoc.url,
                    created: new Date().toISOString()
                }
            }
        });
        if (!RepoClaimDocument.ok) {
            return { ok: false, template: paymentOrderTemplate, reportName: orderName, url: orderDoc.url,
                msg: `se generó pero no se pudo registrar en el reclamo ${claimInfo.id}: ${RepoClaimDocument.msg}` };
        }

        const savedOrder = toPlain(RepoClaimDocument.outData);
        const savedOrderDoc = Array.isArray(savedOrder) ? savedOrder[0] : savedOrder;
        return {
            ok: true,
            template: paymentOrderTemplate,
            reportName: orderName,
            claimDocumentId: savedOrderDoc && savedOrderDoc.id,
            fileName: orderDoc.fileName,
            url: orderDoc.url,
            contextChain: orderChain
        };
    } catch (error) {
        return { ok: false, template: paymentOrderTemplate, reportName: orderName, msg: String(error).replace(/^@/, '') };
    }
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
