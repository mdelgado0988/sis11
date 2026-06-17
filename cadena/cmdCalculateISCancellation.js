//block
//noreplace
/**
 * @author Noel Obando
 * @name cmdCalculateISCancellation
 * @description Calcula el "Impuesto de Seguros" basandose en la formula del producto;
 */
const { policyId, effectiveDate, start, end, annualPremium, annualTotal, tax, rate } = context;
const n2 = (value) => Number(value.toFixed(2));

// Get Paid Premiums.
doCmd({cmd:'LoadEntity',data:{entity:'PayPlan',filter:`lifePolicyId=${policyId}`, fields:`SUM(payed) as paid`}});
const { outData:{ paid }} = LoadEntity;

const startDate = new Date(start),
      endDate = new Date(end),
      changeDate = new Date(effectiveDate);

startDate.setHours(0, 0, 0, 0);
endDate.setHours(0, 0, 0, 0);
changeDate.setHours(0, 0, 0, 0);

const totalDays = Math.floor(
  (endDate - startDate) / (1000 * 60 * 60 * 24)
);

let pastDays = Math.floor(
  (changeDate - startDate) / (1000 * 60 * 60 * 24)
);

if(pastDays < 0)
  pastDays = 0;

const prorate = totalDays == 0 ? 0 : (pastDays == 0 ? 1 : (pastDays / totalDays));

//Michael Delgado. 2026.05.22. GLOB-688. Se debe cancelar en la misma proporción que la prima.
const porc = annualTotal == 0 ? 0 : (tax / annualTotal);
const impPagado = n2(porc * paid);
const impDiario = n2(totalDays == 0 ? 0 : (tax / totalDays));
const impDevengado = n2(impDiario * pastDays);
const resultado = n2(impDevengado - impPagado);

const dataLog = { impPagado: impPagado, impDiario: impDiario, impDevengado: impDevengado, resultado: resultado, pastDays: pastDays };
//return dataLog
//doCmd({cmd: "GetPing", data: dataLog});

return resultado

//const result = totalDays !== 0 ? annualPremium * pastDays/ totalDays - paid : 0;
//return result * rate;


