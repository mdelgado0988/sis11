//block
//noreplace
/*
 * @Author: Michael Delgado
 * @Name: cmdGenerateQuotationDoc
 * @Email: michael.delgado@axxis-systems.com
 * @Date: 2026.08.03
 * @Purpose: Ensures a policy quotation document is always regenerated with the latest rating data.
 * @Input: { id }
 * @Note: If the policy does not have a quotation report configured, the command returns ok=true and skips document generation.
 */

const policyId = toPositiveInteger(context && context.id);

const reportConfigList = [
  { lob: 1, productCode: "0", reportName: "OfertaIncendio.docx" },
  { lob: 6, productCode: "0", reportName: "Oferta Automovil.docx" }
];

try {
  const policy = getPolicy(policyId);
  const reportConfig = getQuotationReportConfig(policy);

  if (reportConfig.configured === false) {
    return {
      ok: true,
      msg: reportConfig.msg,
      skipped: true
    };
  }

  const deletedDocument = deleteQuotationDocuments(policyId, reportConfig.reportName);
  if (!deletedDocument.ok) {
    return deletedDocument;
  }

  return generateQuotationDocument(policyId);
} catch (error) {
  return {
    ok: false,
    msg: `Error generando documento de cotización: ${getErrorMessage(error)}`
  };
}

function getPolicy(id) {
  if (id <= 0) {
    throw new Error("Id de póliza inválido o no informado");
  }

  doCmd({
    cmd: "LoadEntity",
    data: {
      entity: "LifePolicy",
      fields: "id, lob, productCode",
      filter: `id=${id}`,
      noTracking: true
    }
  });

  if (!LoadEntity.ok) {
    throw new Error(LoadEntity.msg || "No fue posible recuperar la póliza");
  }

  const policy = LoadEntity.outData || null;
  if (!policy || typeof policy !== "object") {
    throw new Error("La póliza no contiene datos válidos");
  }

  return policy;
}

function getQuotationReportConfig(policy) {
  const lob = trimString(policy && policy.lob);
  const productCode = trimString(policy && policy.productCode);

  let reportConfig = reportConfigList.find(function (item) {
    return trimString(item.lob) == lob && trimString(item.productCode) == productCode;
  });

  if (!reportConfig) {
    // productCode "0" is the generic quotation report for every product under the same line of business.
    reportConfig = reportConfigList.find(function (item) {
      return trimString(item.lob) == lob && trimString(item.productCode) == "0";
    });
  }

  if (!reportConfig) {
    return {
      configured: false,
      reportName: "",
      msg: "No existe un reporte de cotización configurado para la póliza. Se omite la generación del documento."
    };
  }

  if (isNullOrEmpty(reportConfig.reportName)) {
    throw new Error("El reporte configurado no tiene un nombre válido");
  }

  return reportConfig;
}

function deleteQuotationDocuments(policyIdValue, reportName) {
  doCmd({
    cmd: "DoQuery",
    data: {
      sql: `DELETE FROM [Document] WHERE LifePolicyid = ${toPositiveInteger(policyIdValue)} AND name = '${escapeSqlString(reportName)}'`
    }
  });

  if (!DoQuery || !DoQuery.ok) {
    return {
      ok: false,
      msg: DoQuery?.msg || "No fue posible eliminar el documento de cotización existente"
    };
  }

  return {
    ok: true,
    msg: "Documentos de cotización anteriores eliminados"
  };
}

function generateQuotationDocument(policyIdValue) {
  doCmd({
    cmd: "ExeChain",
    data: {
      chain: "cmdGeneraCotizacion",
      context: "{id:" + policyIdValue + "}"
    }
  });

  const quotationResult = ExeChain.outData;
  if (!quotationResult || quotationResult.ok === false) {
    return {
      ok: false,
      msg: quotationResult && quotationResult.msg ? quotationResult.msg : "No fue posible generar el documento de cotización",
      ResultadoDoc: quotationResult || null
    };
  }

  return {
    ok: true,
    msg: quotationResult.msg || "Documento de cotización generado satisfactoriamente",
    ResultadoDoc: quotationResult.ResultadoDoc || quotationResult,
    vIdDoc: toPositiveInteger(quotationResult.vIdDoc)
  };
}

function firstItem(value) {
  return Array.isArray(value) && value.length > 0 ? value[0] : null;
}

function trimString(value) {
  return String(value === null || value === undefined ? "" : value).trim();
}

function isNullOrEmpty(value) {
  return trimString(value) === "";
}

function escapeSqlString(value) {
  return String(value === null || value === undefined ? "" : value).replace(/'/g, "''");
}

function toPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function getErrorMessage(error) {
  if (error && error.message) {
    return error.message;
  }

  return String(error || "Error desconocido");
}

