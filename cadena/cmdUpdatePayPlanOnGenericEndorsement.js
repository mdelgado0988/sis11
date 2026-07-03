//block
//noreplace
/*************************************************************************\
|* cmdUpdatePayPlanOnGenericEndorsement                                           *|
|* @author: Daniel Berríos                                               *| 
|* @descripcion: Actualiza plan de pago, agregando el detalle siempre y  *|
|*               cuando el convenio sea INC0001                          *|
|* @version: 1                                                           *|
|* @Parametros:                                                          *|
|*              changeId (int) > Id del endoso                           *|
\*************************************************************************/

let entity = getDataEntity(context.changeId);
let productConfig = JSON.parse(entity.configJson);
let annualTax = Number(entity.tax || 0);
let policyId = entity.lifePolicyId;

// Validamos convenio
if (productConfig.Premium.installmentScheme != "INC0001")
    return;

let ppItems = getPayPlan(policyId);

if (!ppItems.length)
    return;

let quota = ppItems.length;

// distribución impuesto
let taxBase = n2(annualTax / quota);

let taxAccum = 0;

const queryUpdate = `
UPDATE PayPlanDetail
SET amount={0}
WHERE id={1};
`;

let queryResult = "";

const resultado = distributeTax(ppItems, annualTax, queryUpdate, n2);
ppItems = resultado.ppItems
queryResult  = resultado.queryResult;

//return {ppItems,queryResult }

if (queryResult.trim().length > 0) {

    doCmd({
        cmd: "DoQuery",
        data: {
            sql: queryResult
        }
    });
}

return {
    ppItems,
    queryResult
};

function distributeTax(ppItems, annualTax, queryUpdate, n2) {

    let queryResult = "";

    const pendingItems = ppItems.filter(x =>
        n2(x.payed || 0) < n2(x.minimum || x.dueAmount || 0)
    );

    let taxAccum = 0;
    const quota = pendingItems.length;
    const taxBase = quota ? n2(annualTax / quota) : 0;

    for (let i = 0; i < quota; i++) {

        const quotaItem = pendingItems[i];

        // última cuota absorbe diferencia
        const tax = i === quota - 1
            ? n2(annualTax - taxAccum)
            : (taxAccum += taxBase, taxBase);

        const totalQuota = n2(
            quotaItem.minimum ||
            quotaItem.dueAmount ||
            0
        );

        const premium = Math.max(
            0,
            n2(totalQuota - tax)
        );

        for (const detail of quotaItem.PayPlanDetail) {

            if (detail.detail === "Prima Cobertura") {

                queryResult += queryUpdate
                    .replace("{0}", premium)
                    .replace("{1}", detail.id);

                detail.amount = premium;
            }

            if (
                detail.detail === "Taxes" ||
                detail.detail === "Impuesto de Seguros"
            ) {

                queryResult += queryUpdate
                    .replace("{0}", tax)
                    .replace("{1}", detail.id);

                detail.amount = tax;
            }
        }

        quotaItem.minimum = totalQuota;
        quotaItem.dueAmount = totalQuota;
    }

    return { ppItems, queryResult };
}

function getDataEntity(changeId) {
  doCmd({
    cmd: "DoQuery",
    data: {
      sql: `
  SELECT 
      pol.periodicity,
      pol.anualPremium,
      pol.anualTotal,
      pol.tax,
      pol.id lifePolicyId,
      pro.configJson,
      ch.* 
  FROM Change ch 
  INNER JOIN LifePolicy pol ON pol.id = ch.lifePolicyId  
  INNER JOIN Product pro ON pol.productCode = pro.code
  WHERE ch.id=${changeId}
  `
    }
  });
  
  const entity = DoQuery.outData[0];
  return entity;
}

function getPayPlan(policyId) {
  doCmd({
      cmd: "RepoPayPlan",
      data: {
          operation: "GET",
          filter: `lifePolicyId=${policyId}`,
          include: ["PayPlanDetail"]
      }
  });
  
  const ppItems = RepoPayPlan.outData || [];
  return ppItems;
}

function n2(value) {
    return Math.round(Number(value || 0) * 100) / 100;
}