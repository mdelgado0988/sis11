//block
//noreplace
/**
 * Name: cmdResultRenewQuoteBatchList
 * Author: Michael Delgado
 * Email: michael.delgado@axxis-systems.com
 * CreatedDate: 2026-06-12
 * Purpose: Return a formatted list of unattended batch errors for renewal quote processing.
 * Inputs: context.batchId must include the batch process identifier.
 * Output: { ok, msg, outData? }
 */

let { loteId, currentPage, pageSize } = context;

if (!loteId) {
  return {
    ok: false,
    msg: 'Id del lote es requerido.'
  };
}

const batchRelatedId = getBatchRelated(loteId);

if (!batchRelatedId) {
  return {
    ok: false,
    msg: `No se identificó lote de cotización para el lote ${loteId}.`
  };
}

const batchErrorsResult = getBatchErrors(batchRelatedId, currentPage, pageSize);

return batchErrorsResult;

function getBatchRelated(batchId) {

    doCmd({
        cmd: 'RepoBatch',
        data: {
            operation: 'GET',
            filter: `name like '%QUOTELOTE-%-${batchId}%'`
        }
    });

    if (!RepoBatch.ok) {
        return null;
    }

    const resultado = RepoBatch.outData ?? [];

    //Obtengo el max id del arreglo resultado
    const maxId = resultado.reduce((max, item) => item.id > max ? item.id : max, 0);

    return maxId;
  
}

function getBatchErrors(batchId, currentPage, pageSize) {
    doCmd({
        cmd: 'GetBatchErrors',
        data: {
        batchId: batchId,
        groupName: null
        }
    });

    if (!GetBatchErrors.ok) {
        return {
        ok: false,
        msg: GetBatchErrors.msg
        };
    }

    // Normalizar valores de paginación
    currentPage = currentPage || 1;
    pageSize = pageSize || 10;

    var startIndex = (currentPage - 1) * pageSize;
    var endIndex = startIndex + pageSize;

    const errorRows = GetBatchErrors.outData?.errors?.jData ? parseJsonData(GetBatchErrors.outData.errors.jData) : [];
    const errorList = buildBatchErrorList(loteId, errorRows);
    var paginatedErrors = errorList.slice(startIndex, endIndex);

    return {
        ok: true,
        msg: 'GetBatchErrors executed successfully.',
        data: paginatedErrors
    };
}

function parseJsonData(jsonData) {
    if (!jsonData) {
        return [];
    }

    try {
        return JSON.parse(jsonData);
    } catch (e) {
        return [];
    }
}

function buildBatchErrorList(batchId, errorRows) {
  return errorRows.map(function(errorRow) {
    return {
      IdProceso: batchId,
      Poliza: errorRow[1],
      Mensaje: errorRow[5]
    };
  });
}