//block
//noreplace
/*
  *@Author: Michael Delgado.,
  *@Name: cmdGeneraCotizacion
  *@Email: michael.delgado@axxis-systems.com
  *@Date: 2026.01.29.
  *@Purpose: Genera reporte de cotización.
  *@input: { id }
*/

const policyId = toValidNumber(context?.id);
let ReportName = '';
let policy;
let vIdDoc=0;

const Reportes = [{ lob: 1, productCode: "0", reportName: "OfertaIncendio.docx" },
                  { lob: 6, productCode: "0", reportName: "Oferta Automovil.docx" }
                  /*{ lob: 81, productCode: "81FIAGCCOG", reportName: "Fianza Cumplimiento Gobierno.docx" },                  
                  { lob: 81, productCode: "81FIAGCCOP", reportName: "Fianza Cumplimiento Privado.docx" },                  
                  { lob: 81, productCode: "81PROPUESTA", reportName: "Fianza Propuesta Privado.docx" },
                  { lob: 81, productCode: "81ANTICIPO", reportName: "Fianza Anticipo Gobierno.docx" },
                  { lob: 81, productCode: "81PAGO", reportName: "Fianza Pago Gobierno.docx" },
                  { lob: 81, productCode: "0", reportName: "Fianza de Gobierno.docx" }*/];

const chains = [{lob:1, name: "getOfertaModeloSisIncendio", context: `{id: ${policyId}}`},
                {lob:6, name: "cmdDocumentoAutoDTO", context: `{policyId: ${policyId}}`}]

try {
  if (policyId <= 0) {
    return { ok: false, msg: 'Id de póliza inválido o no informado' };
  }
  
  const policyResult = setPolicyData(policyId);
  if(!policyResult.ok)
    return policyResult;
      
  const lob = toValidNumber(policy?.lob);
  const productCode = String(policy?.productCode ?? '').trim();

  let reporteConfig = Reportes.find(x => x.lob == lob && String(x.productCode ?? '').trim() == productCode);
  if(!reporteConfig){
    reporteConfig = Reportes.find(x => x.lob == lob && String(x.productCode ?? '').trim() == "0");
    if(!reporteConfig)
      return {ok:false, msg: `Ningún reporte configurado para el producto de la póliza`};
  
    ReportName = reporteConfig?.reportName ?? "";
  }
  else
    ReportName = reporteConfig?.reportName ?? "";
  
   if(ReportName === '')
      return {ok:false, msg: `Reporte no configurado para el producto de la póliza`};
  
  log(`Generando cotización ${policyId}`);
  
  const datachainEntity = getDTO(policy);
  if(!datachainEntity?.custom) {
    return { ok: false, msg: 'No fue posible generar la información base del reporte' };
  }
  
  const reporteResultado = generateDocument(ReportName, datachainEntity);
  
  if(!reporteResultado.ok)
    return reporteResultado;
  
  const ResultadoGenerateDoc = reporteResultado.ResultadoDoc;
  if(!ResultadoGenerateDoc || !ResultadoGenerateDoc.fileName)
    return {ok:false, msg: `Error generando reporte de cotización: ${reporteResultado?.msg ?? "No Detallado"}` , ResultadoDoc: null};
  
  //Asociamos el documento generado a la poliza
  const resultAsocia = setDocumentPolicy(ResultadoGenerateDoc, policyId);
  if(!resultAsocia.ok)
    return resultAsocia;
  
  vIdDoc = toValidNumber(resultAsocia?.ResultadoDoc?.id);
  if (vIdDoc <= 0) {
    return { ok: false, msg: 'No se pudo recuperar el id del documento recién creado', ResultadoDoc: null };
  }

  log(`Document id from ADD: ${vIdDoc}`);
  
  if(vIdDoc <= 0)
    return {ok:false, msg: `Error recuperando id del reporte` , ResultadoDoc: null};
  
  const resultUpdate = updateDocumentName(ResultadoGenerateDoc, ReportName, vIdDoc)
  if(!resultUpdate.ok)
    return resultUpdate;
  
  //return {id: vIdDoc, test: "test", respuesta: SetField}
  return {ok:true, msg: 'Cotización generada satisfactoriamente' , ResultadoDoc: reporteResultado, vIdDoc: vIdDoc};

} catch (error) {
  return {ok:false, msg: `Error generando reporte: ${error.toString()}`};
}

function getDTO(policy) {
    
  const chainCfg = chains.find(x => x.lob == policy.lob);
  if(!chainCfg)
    throw new Error("No existe comando para la generación del reporte de este ramo");
  
  const datachain = doCmd({
    cmd: "ExeChain",
    data: {
      chain: chainCfg.name,
      context: chainCfg.context
    }
  });

  if (!datachain.ok) {
    throw new Error(datachain.msg || 'No fue posible ejecutar la cadena base del reporte');
  }

  if (!datachain.outData) {
    throw new Error('La cadena base del reporte no devolvió información');
  }
  
  const datachainEntity = { custom: datachain.outData };
  return datachainEntity
}

function generateDocument(ReportName, datachainEntity) {
  if (!ReportName || !String(ReportName).trim()) {
    return { ok: false, msg: 'Nombre de reporte inválido', ResultadoDoc: null };
  }

  if (!datachainEntity || typeof datachainEntity !== 'object') {
    return { ok: false, msg: 'Datos del reporte inválidos', ResultadoDoc: null };
  }

  const reporteResultado = doCmd({
    cmd: "GenerateDoc",
    data:{
      async: false,
      template: ReportName,
      data: datachainEntity
    }  
  });
  
  if(!reporteResultado.ok)
    return {ok:false, msg: `Error generando reporte de cotización: ${reporteResultado?.msg ?? "No Detallado"}` , ResultadoDoc: null};
  
  const ResultadoGenerateDoc = reporteResultado.outData;
  if(!ResultadoGenerateDoc)
    return {ok:false, msg: `Error generando reporte de cotización: ${reporteResultado?.msg ?? "No Detallado"}` , ResultadoDoc: null};

  return { ok: true, msg: "Documento generado", ResultadoDoc: ResultadoGenerateDoc };
  
}

function setDocumentPolicy(ResultadoGenerateDoc, policyId) {
  if (!ResultadoGenerateDoc || !ResultadoGenerateDoc.fileName) {
    return { ok: false, msg: 'Documento generado inválido', ResultadoDoc: null };
  }

  const entityReporte = {fileName: ResultadoGenerateDoc.fileName, LifePolicyid: policyId};
  
  doCmd({
    cmd: "RepoDocument",
    data:{
      operation: "ADD",
      entity: entityReporte
    }  
  });
  
  if(!RepoDocument.ok)
    return {ok:false, msg: `Error asociado reporte a la cotización: ${RepoDocument?.msg ?? "No Detallado"}` , ResultadoDoc: null};

  const addedDocument = normalizeDocumentResult(RepoDocument.outData);
  if (!addedDocument || toValidNumber(addedDocument.id) <= 0) {
    return { ok: false, msg: 'No se pudo recuperar el id del documento creado', ResultadoDoc: null };
  }

  return { ok: true, msg: "Documento asociado", ResultadoDoc: addedDocument };
}

function updateDocumentName(ResultadoGenerateDoc, ReportName, documentId) {
  const docId = toValidNumber(documentId);
  if (!docId || docId <= 0) {
    return { ok: false, msg: 'Id de documento inválido', result: null };
  }

  doCmd({
    cmd: "SetField",
    data:{
      entity: "Document",
      fieldValue: `fileName='${ResultadoGenerateDoc.fileName}', name='${ReportName}', url='${ResultadoGenerateDoc.url}', created= GETDATE()`,
      entityId: docId
    }  
  });

  if(!SetField.ok)
    return {ok:false, msg: `Error actualizando nombre del documento: ${SetField?.msg ?? "No Detallado"}`, result: SetField};

  return { ok: true, msg: "Documento renombrado" };
  
}

function normalizeDocumentResult(value) {
  if (Array.isArray(value)) {
    return value.find(item => item && toValidNumber(item.id) > 0) || null;
  }

  if (value && typeof value === 'object') {
    return value;
  }

  return null;
}

function setPolicyData(policyId) {
  if (policyId <= 0) {
    return { ok: false, msg: 'Id de póliza inválido', ResultadoDoc: null };
  }

  doCmd({
    cmd: "LoadEntity",
    data:{
      entity: "LifePolicy",
      fields: "id, lob, productCode",
      filter: `id=${policyId}`
    }  
  });
  
  if(!LoadEntity.ok)
    return {ok:false, msg: `Error recuperando datos de la póliza: ${LoadEntity?.msg ?? "No Detallado"}` , ResultadoDoc: LoadEntity};

  policy = LoadEntity.outData ?? null;
  if (!policy || typeof policy !== 'object') {
    return { ok: false, msg: 'La póliza no contiene datos válidos', ResultadoDoc: null };
  }
  
  return {ok:true, msg: `Documento recuperado`};
}

function toValidNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}
