//block
//noreplace
/**
 * @author Noel Obando
 * @name cmdGetPremiumContext
 * @summary Obtiene el contexto para la plantilla contable de cobro de primas
 * @version 1.0
 * @created 2026-01-06
 */
const { id } = context;
const round2 = n =>
  Number(Math.round((n || 0) + 'e2') + 'e-2');
const ImpuestoSobrePrimas = 5/100, ImpuestosPorDanios = 2/100;

const Payment = getTransfer(id);
if(!Payment) throw '@Pago no encontrado.';

//GLOB-592: Michael Delgado. Leemos la prima bruta sin impuesto de la cuota para cálculos del pago (Debido a pagos parciales)
const primasDetalle = getInstallmentDetails(id);

const InstallmentPremiums = Payment?.Allocation?.InstallmentPremiums ?? [];
if(!InstallmentPremiums || InstallmentPremiums.length === 0) throw '@Detalle de pago no encontrado'

return InstallmentPremiums.map( premium =>{
  const poliza = getPolicyInfo(premium);
  const tipoRiesgo = ['81', '82', '83', '84'].includes(String(poliza?.lob ?? '').trim())
    ? 'Fianza'
    : 'Poliza';
  const impuestosPorDanios = tipoRiesgo === 'Fianza' ? 0 : ImpuestosPorDanios;

  const primaDetalle = primasDetalle.find(x => x.payPlanId == premium.payPlanId);
  
  //Michael Delgado. GLOB-751. Saco la proporción de lo que realmente corresponde a la prima
  const premiumAmount = primaDetalle?.amount ?? 0;
  const installmentAmount = primaDetalle?.minimum ?? 0;
  const premiumProportion = installmentAmount == 0 ? 0 : premiumAmount / installmentAmount;
  const premiumPayed = round2(premiumProportion * premium.moneyInAmount) ?? 0;
  
  let montoPrima = round2(premiumPayed == 0 ? (premium.moneyInAmount / ( 1 + ImpuestoSobrePrimas)) : premiumPayed);

  montoPrima = montoPrima ? montoPrima : premium.moneyInAmount;

  const taxAmount = round2(montoPrima * ImpuestoSobrePrimas);
  const taxIncAmount = round2(montoPrima * impuestosPorDanios);
                             
  montoPrima = montoPrima + (premium.moneyInAmount - (montoPrima + taxAmount));
  
  return {
      id,
      prima: premium.moneyInAmount,
      moneda: premium.currency,
      impuesto: taxAmount,
      primaxpagar: taxIncAmount,
      reference: `TX-CobroPrimas#${ id } ${tipoRiesgo} #${ poliza.code }`,
      poliza,
    }
})

function getTransfer(id) {
  doCmd({cmd:'FilterTransfer',data:{ allocationId: id }});
  if(!FilterTransfer.ok) throw '@'+FilterTransfer.msg;
  const Payment = FilterTransfer.outData.find(item => item.transactionCode === 'PREMIUMPAY');
  return Payment;
}

function getPolicyInfo({lifePolicyId}){
  doCmd({cmd:'LoadEntity',data:{entity:'LifePolicy', filter:`id=${lifePolicyId }`}});
  return LoadEntity.outData;
}

function getInstallmentDetails(id) {
  const queryPrima = `SELECT pd.payPlanId, pd.detail, pd.amount, pd.paid, pa.minimum
  FROM allocationInstallment a 
  INNER JOIN PayPlan pa ON pa.id = a.payPlanId
  INNER JOIN PayPlanDetail pd on pd.payPlanId = pa.id
  WHERE a.allocationId = ${id}
  AND pd.detail LIKE 'Prima%'`;
  
  doCmd({ cmd: "DoQuery", data: { sql: queryPrima } });
  const primasDetalle = DoQuery?.outData ?? [];
  return primasDetalle;
}
