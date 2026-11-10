//block
//noreplace
/**
 * @author Noel Obando
 * @name cmdGetPremiumContext
 * @summary Obtiene el contexto para la plantilla contable de cobro de primas
 * @version 1.3
 * @created 2026-01-06
 * @changes 1.1 (MSN-000057) Resolves the accounts of every template line from the table
 *          CuentasCobroPrimasxLob: the column "<ramo>-<producto>" when it has a value for
 *          the line, otherwise the column of the ramo. Returned as cuenta<Linea> fields so the
 *          template CobroPrima only reads them.
 * @changes 1.2 (MSN-000150) Ramo 6 (Automovil) al 6 %: el impuesto del cobro es el que trae la
 *          propia cuota (su impuesto entre su prima), 6 % si la cuota no trae impuesto; asi las
 *          cuotas emitidas al 5 % antes del cambio se contabilizan al 5 % que paga el cliente.
 *          Los demas ramos siguen con ImpuestoSobrePrimas (5 %).
 * @changes 1.3 (MSN-000175) Las lineas de la asignacion se leen tambien directamente de
 *          AllocationInstallment para soportar cuotas negativas y aplicaciones sin transferencia
 *          PREMIUMPAY. El signo original se conserva para la contabilizacion.
 */
const { id } = context;
const round2 = n =>
  Number(Math.round((n || 0) + 'e2') + 'e-2');
const ImpuestoSobrePrimas = 5/100, ImpuestosPorDanios = 2/100;
const ImpuestoSobrePrimasxRamo = { '6': 6/100 };

const InstallmentPremiums = getInstallmentPremiums(id);

//GLOB-592: Michael Delgado. Leemos la prima bruta sin impuesto de la cuota para cálculos del pago (Debido a pagos parciales)
const primasDetalle = getInstallmentDetails(id);

if(!InstallmentPremiums || InstallmentPremiums.length === 0) throw '@Detalle de pago no encontrado'

const tablaCuentas = getTablaCuentas();
let impuestosDetalle = null;

return InstallmentPremiums.map( premium =>{
  const poliza = getPolicyInfo(premium);
  const tipoRiesgo = ['81', '82', '83', '84'].includes(String(poliza?.lob ?? '').trim())
    ? 'Fianza'
    : 'Poliza';
  const impuestosPorDanios = tipoRiesgo === 'Fianza' ? 0 : ImpuestosPorDanios;

  const primaDetalle = primasDetalle.find(x => x.payPlanId == premium.payPlanId);
  const tasaImpuesto = getTasaImpuesto(poliza, premium, primaDetalle);
  const montoCobrado = getMontoCobrado(premium);
  
  //Michael Delgado. GLOB-751. Saco la proporción de lo que realmente corresponde a la prima
  const premiumAmount = primaDetalle?.amount ?? 0;
  const installmentAmount = primaDetalle?.minimum ?? 0;
  const premiumProportion = installmentAmount == 0 ? 0 : premiumAmount / installmentAmount;
  const premiumPayed = round2(premiumProportion * montoCobrado) ?? 0;
  
  let montoPrima = round2(premiumPayed == 0 ? (montoCobrado / ( 1 + tasaImpuesto)) : premiumPayed);

  montoPrima = montoPrima ? montoPrima : montoCobrado;

  const taxAmount = round2(montoPrima * tasaImpuesto);
  const taxIncAmount = round2(montoPrima * impuestosPorDanios);
                             
  montoPrima = montoPrima + (montoCobrado - (montoPrima + taxAmount));
  
  return {
      id,
      prima: montoCobrado,
      moneda: premium.currency,
      impuesto: taxAmount,
      primaxpagar: taxIncAmount,
      reference: `TX-CobroPrimas#${ id } ${tipoRiesgo} #${ poliza.code }`,
      poliza,
      ...getCuentasContables(tablaCuentas, poliza),
    }
})

function getTransfer(id) {
  doCmd({cmd:'FilterTransfer',data:{ allocationId: id }});
  if(!FilterTransfer.ok) throw '@'+FilterTransfer.msg;
  const transfers = Array.isArray(FilterTransfer.outData) ? FilterTransfer.outData : [];
  const Payment = transfers.find(item => item.transactionCode === 'PREMIUMPAY')
    || transfers.find(item => Number(item && item.allocationId) === Number(id));
  return Payment;
}

/** Las lineas del cobro se leen de la transferencia o directamente de la asignacion. */
function getInstallmentPremiums(id) {
  const Payment = getTransfer(id);
  if (Payment) return Payment?.Allocation?.InstallmentPremiums ?? [];

  doCmd({ cmd: 'DoQuery', data: { sql: `SELECT a.payPlanId, a.lifePolicyId, a.moneyInAmount, a.compensationAmount, a.compensationType, a.currency
  FROM AllocationInstallment a
  WHERE a.allocationId = ${ Number(id) }` } });
  const lineas = DoQuery?.outData ?? [];
  if (!Array.isArray(lineas) || lineas.length === 0) throw '@Pago no encontrado.';
  return lineas;
}

/** Conserva el signo de la linea; si existe compensacion, suma efectivo y compensacion. */
function getMontoCobrado(premium) {
  if (premium.compensationType !== 'SALDOFAVOR') return premium.moneyInAmount;
  return round2(Number(premium.moneyInAmount ?? 0) + Number(premium.compensationAmount ?? 0));
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

/**
 * MSN-000150: tasa del impuesto del cobro. Ramos sin tasa propia: ImpuestoSobrePrimas.
 * Ramos de ImpuestoSobrePrimasxRamo: impuesto entre prima del detalle de la cuota; la tasa
 * del ramo cuando la cuota no trae impuesto o su prima es cero.
 */
function getTasaImpuesto(poliza, premium, primaDetalle) {
  const tasaRamo = ImpuestoSobrePrimasxRamo[String(poliza?.lob ?? '').trim()];
  if (tasaRamo === undefined) return ImpuestoSobrePrimas;

  if (impuestosDetalle === null) impuestosDetalle = getInstallmentTaxDetails(id);
  const impuestoDetalle = impuestosDetalle.find(x => x.payPlanId == premium.payPlanId);
  const prima = Number(primaDetalle?.amount ?? 0);

  return impuestoDetalle && Math.abs(prima) > 0.005
    ? Number(impuestoDetalle.amount ?? 0) / prima
    : tasaRamo;
}

function getInstallmentTaxDetails(id) {
  const queryImpuesto = `SELECT pd.payPlanId, SUM(pd.amount) amount
  FROM allocationInstallment a
  INNER JOIN PayPlanDetail pd on pd.payPlanId = a.payPlanId
  WHERE a.allocationId = ${id}
  AND (pd.detail LIKE 'Impuesto%' OR pd.detail = 'Taxes')
  GROUP BY pd.payPlanId`;

  doCmd({ cmd: "DoQuery", data: { sql: queryImpuesto } });
  return DoQuery?.outData ?? [];
}

/**
 * Reads CuentasCobroPrimasxLob once per run. Rows are the template lines (column
 * "Cuenta"); columns are the ramo code ("52") or a product of that ramo ("52-FRAUDE").
 */
function getTablaCuentas() {
  doCmd({ cmd: 'GetFullTable', data: { table: 'CuentasCobroPrimasxLob' } });
  const res = typeof GetFullTable === 'undefined' ? null : GetFullTable;
  const rows = res && res.ok !== false && res.outData
    ? JSON.parse(JSON.stringify(res.outData))
    : [];
  if (!Array.isArray(rows) || rows.length < 2) throw '@No se encontró la tabla de cuentas CuentasCobroPrimasxLob';
  return rows;
}

/**
 * Account of each template line: the product cell when it has a value,
 * otherwise the ramo cell (empty when the ramo has no column either).
 */
function getCuentasContables(rows, poliza) {
  const lineas = {
    cuentaBanco: 'Banco',
    cuentaFondosFijos: 'FondosFijos',
    cuentaPrima: 'Prima',
    cuentaImpuestoPrimas: 'ImpuestoPrimas',
    cuentaImpuestoPrimasCredito: 'ImpuestoPrimasCredito',
    cuentaDaniosxPagar: 'DaniosxPagar',
    cuentaDaniosxPagarCredito: 'DaniosxPagarCredito'
  };
  const key = v => String(v == null ? '' : v).trim().toUpperCase();
  const header = rows[0].map(key);
  const lob = key(poliza && poliza.lob);
  const producto = key(poliza && poliza.productCode);
  const iLob = lob ? header.indexOf(lob) : -1;
  const iProducto = lob && producto ? header.indexOf(lob + '-' + producto) : -1;

  const cuentas = {};
  Object.keys(lineas).forEach(campo => {
    const fila = rows.find(r => Array.isArray(r) && key(r[0]) === key(lineas[campo]));
    const deProducto = fila && iProducto > 0 ? String(fila[iProducto] || '').trim() : '';
    const deRamo = fila && iLob > 0 ? String(fila[iLob] || '').trim() : '';
    cuentas[campo] = deProducto || deRamo;
  });
  return cuentas;
}
