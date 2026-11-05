//block
//noreplace

/*
  *@name: cmdGetReinsuranceDataVC
  *@Purpose: Calculate and return the excess insured amount and premium for collective life insurance policies
  *@Autor: Michael Delgado
  *@Email: michael.delgado@axxis-systems.com
  *@Created: 02/06/2026
  *@Input: {policyId, coverages, contrato?, IdContrato?, productCode?}
  *@Output: [{ mscp, mpcp, msex1, mpex1 }]
*/

const policyId = context.policyId;
const coverages = context.coverages || [];
const contrato = String(context.contrato || "CPEXCV").trim().toUpperCase();
const productCode = String(context.productCode || "").trim();
let resultado = {};
let insuredObject;

try{

  //doCmd({cmd:"GetPing", data: {contexto: JSON.stringify(context)}});
    
  setInsuredObject();

  const msex1 = toNumber(insuredObject?.userData?.txtSumaExcedente ?? 0);
  const totalInsuredSum = n2(coverages.reduce(
    (sum, coverage) => sum + (Number(String(coverage.limit).replace(/,/g, "")) || 0),
      0
  ));

  const totalPremium = n2(coverages.reduce((sum, coverage) => sum + toNumber(coverage.premium), 0));
  const mpex1Total = Math.min(n2(msex1 * getTasaRiesgo() / 1000.00), totalPremium);

  const pex1 = msex1 / totalInsuredSum;
  const pcp = (1 - pex1);
  const ppex1 = totalPremium ? mpex1Total / totalPremium : 0;
  let mayor;

  for (const cov of coverages) {
  
      resultado[cov.code] = {
          mscp: n2(cov.limit * pcp),
          msex1: n2(cov.limit * pex1),
          mpex1: n2(cov.premium * ppex1)
      };
      resultado[cov.code].mpcp = n2(cov.premium - resultado[cov.code].mpex1);
  
      resultado[cov.code].mscp += n2(
          cov.limit -
          n2(resultado[cov.code].mscp + resultado[cov.code].msex1)
      );

      if (!mayor || toNumber(cov.premium) > toNumber(mayor.premium)) mayor = cov;
  }

  if (mayor) {
      const dif = n2(mpex1Total - n2(Object.values(resultado).reduce((s, r) => s + r.mpex1, 0)));
      resultado[mayor.code].mpex1 = n2(resultado[mayor.code].mpex1 + dif);
      resultado[mayor.code].mpcp = n2(mayor.premium - resultado[mayor.code].mpex1);
  }

  return resultado;
  
}catch (ex){
  return { ok: false, msg: ex.toString() }
}

function setInsuredObject() {

  doCmd({cmd: "RepoObjectDefinition", data: { operation: "GET", filter: `code = 'DT_ACCIDENTES_V1'` }});
  const objectDefinitionId = RepoObjectDefinition.outData?.[0]?.id ?? 0;
  if(objectDefinitionId == 0)
    throw new Error(`Error recuperando el objeto asegurado, asegúrese de configurar uno para el producto`);
  
  doCmd({cmd: "RepoInsuredObject", data: { operation: "GET", filter: `lifepolicyId = ${policyId} AND objectDefinitionId = ${objectDefinitionId}` }});
  const oa = RepoInsuredObject.outData?.[0];
  if(!oa)
    throw new Error(`Error recuperando el objeto asegurado, asegúrese de seleccionar un objeto asegurado`);

  return insuredObject = oa;
  
}

function getTasaRiesgo() {

  doCmd({cmd: "GetFullTable", data: { table: "cfgLimiteContratoColectivo", filter: "1=1" }});
  const rows = GetFullTable?.outData ?? [];
  const head = (rows[0] ?? []).map(h => String(h ?? "").trim().toUpperCase());
  const iId = head.indexOf("IDCONTRATO"), iProduct = head.indexOf("PRODUCTCODE"), iTasa = head.indexOf("TASARIESGO");
  if (iId < 0 || iProduct < 0 || iTasa < 0)
    throw new Error("cfgLimiteContratoColectivo debe incluir IdContrato, productCode y TasaRiesgo");
  const idContrato = resolveContractId(context.IdContrato ?? context.idContrato);
  const candidatas = rows.slice(1).filter(r => toNumber(r[iId]) === idContrato);
  const fila = candidatas.find(r => String(r[iProduct] ?? "").trim().toUpperCase() === productCode.toUpperCase())
    || candidatas.find(r => String(r[iProduct] ?? "").trim() === "*");
  if (!fila)
    throw new Error(`No existe TasaRiesgo para IdContrato ${idContrato} y producto ${productCode || "(vacío)"} en cfgLimiteContratoColectivo`);

  return toNumber(fila[iTasa]);
}

function resolveContractId(explicitId) {
  const id = toNumber(explicitId);
  if (id > 0) return id;
  const safeCode = contrato.replace(/'/g, "''");
  doCmd({cmd: "GetContracts", data: { filter: `[code]='${safeCode}'`, size: 1 }});
  const contract = GetContracts?.outData?.[0];
  if (!contract?.id) throw new Error(`No se encontró el contrato ${contrato} para resolver IdContrato`);
  return toNumber(contract.id);
}

function toNumber(value) {
    if (value === null || value === undefined || value === "") {
        return 0;
    }

    return Number(
        String(value)
            .replace(/,/g, "")
            .trim()
    ) || 0;
}

function n2(value) {
    return Number(Number(value || 0).toFixed(2));
}
