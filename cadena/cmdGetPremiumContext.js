//block
//noreplace
/**
 * @author Noel Obando
 * @name cmdGetPremiumContext
 * @summary Obtiene el contexto para la plantilla contable de cobro de primas
 * @version 1.6
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
 * @changes 1.4 (MSN-000203) Impuesto de Auto (1 %) separado del IVA: el impuesto cobrado de la
 *          cuota se reparte entre IVA (impuesto) e Impuesto de Auto (impuestoAuto) en la proporcion
 *          de los impuestos vigentes de la poliza (sus renglones TaxGenerated habilitados). Una
 *          poliza sin renglon "Impuesto de Auto" da impuestoAuto 0 y el asiento de siempre.
 * @changes 1.5 (MSN-000248) Una referencia por cuota: con dos o mas cuotas de la misma poliza en
 *          un cobro, todas llevaban la misma referencia y la plantilla CobroPrima solo grababa la
 *          primera (las demas salian como repetidas). Ahora cada cuota de esa poliza lleva
 *          " Cuota <n> REF <payPlanId>"; la que ya tenia asiento con la referencia anterior (cobros
 *          previos a este cambio) la conserva, asi que reejecutar la plantilla sobre un cobro viejo
 *          crea solo los asientos que faltan. Las lineas se recorren por id de la asignacion.
 * @changes 1.6 (MSN-000253) Comision del cobro: por cada cuota aplicada (parcial o total) devuelve
 *          comision = prima neta cobrada (sin impuesto) x comision emitida / prima neta emitida de
 *          la poliza. Comision emitida: LifePolicy.commissions mas la de sus endosos (Commission
 *          con changeId, sin error), la misma que la emision y los endosos llevan a la reserva.
 *          Prima neta emitida: la prima de las cuotas vigentes (no anuladas) de la poliza; la cuota
 *          sin detalle de prima cuenta su monto sin impuesto. Sin comision emitida: 0 y la plantilla
 *          CobroPrima no agrega lineas. Cuentas: renglones ComisionReserva y ComisionxPagar.
 */
const { id } = context;
const round2 = n =>
  Number(Math.round((n || 0) + 'e2') + 'e-2');
const ImpuestoSobrePrimas = 5/100, ImpuestosPorDanios = 2/100;
const ImpuestoSobrePrimasxRamo = { '6': 6/100 };

const InstallmentPremiums = JSON.parse(JSON.stringify(getInstallmentPremiums(id) || []))
  .sort((a, b) => Number(a.id || 0) - Number(b.id || 0));

//GLOB-592: Michael Delgado. Leemos la prima bruta sin impuesto de la cuota para cálculos del pago (Debido a pagos parciales)
const primasDetalle = getInstallmentDetails(id);

if(!InstallmentPremiums || InstallmentPremiums.length === 0) throw '@Detalle de pago no encontrado'

const tablaCuentas = getTablaCuentas();
let impuestosDetalle = null;
const participacionAuto = {};
const referenciasPrevias = getReferenciasPrevias(id);
const numerosCuota = getNumerosCuota(id);
const proporcionComision = {};
const basePosteada = {};

const filas = InstallmentPremiums.map(premium => {
  const poliza = getPolicyInfo(premium);
  const tipoRiesgo = ['81', '82', '83', '84'].includes(String(poliza?.lob ?? '').trim())
    ? 'Fianza'
    : 'Poliza';
  return { premium, poliza, tipoRiesgo, base: `TX-CobroPrimas#${ id } ${tipoRiesgo} #${ poliza.code }` };
});
const cuotasPorBase = {};
filas.forEach(f => { cuotasPorBase[f.base] = (cuotasPorBase[f.base] || 0) + 1; });

return filas.map(({ premium, poliza, tipoRiesgo, base }) => {
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
  const comision = getComision(poliza, montoPrima);

  const taxAmount = round2(montoPrima * tasaImpuesto);
  const taxIncAmount = round2(montoPrima * impuestosPorDanios);
  const impuestoAuto = round2(taxAmount * getParticipacionAuto(poliza));
                             
  montoPrima = montoPrima + (montoCobrado - (montoPrima + taxAmount));
  
  return {
      id,
      prima: montoCobrado,
      moneda: premium.currency,
      impuesto: round2(taxAmount - impuestoAuto),
      impuestoAuto,
      primaxpagar: taxIncAmount,
      comision,
      reference: getReferencia(base, premium),
      poliza,
      ...getCuentasContables(tablaCuentas, poliza),
    }
})

/**
 * MSN-000248: referencia del asiento de una cuota. Unica cuota de la poliza en el cobro: la de
 * siempre. Varias: cada una con su numero de cuota y su payPlanId, salvo la que ya se contabilizo
 * con la referencia anterior (la conserva y la plantilla la salta).
 */
function getReferencia(base, premium) {
  if (cuotasPorBase[base] < 2) return base;
  if (referenciasPrevias.includes(base) && !basePosteada[base]) {
    basePosteada[base] = true;
    return base;
  }
  const numero = numerosCuota[premium.payPlanId];
  return `${ base }${ numero != null ? ' Cuota ' + numero : '' } REF ${ premium.payPlanId }`;
}

function getReferenciasPrevias(id) {
  doCmd({ cmd: 'DoQuery', data: { sql: `SELECT t.reference
  FROM [Transaction] t
  WHERE t.templateCode = 'CobroPrima' AND t.entity = 'ALLOCATION' AND t.entityId = ${ Number(id) }` } });
  return (DoQuery?.outData ?? []).map(x => String(x.reference));
}

function getNumerosCuota(id) {
  doCmd({ cmd: 'DoQuery', data: { sql: `SELECT a.payPlanId, pp.numberInYear
  FROM AllocationInstallment a
  INNER JOIN PayPlan pp ON pp.id = a.payPlanId
  WHERE a.allocationId = ${ Number(id) }` } });
  const numeros = {};
  (DoQuery?.outData ?? []).forEach(x => { numeros[x.payPlanId] = x.numberInYear; });
  return numeros;
}

/**
 * MSN-000253: comision de la cuota aplicada = prima neta cobrada x (comision emitida / prima neta
 * emitida). La proporcion se calcula una vez por poliza. Conserva el signo de la cuota.
 */
function getComision(poliza, primaCobrada) {
  const lifePolicyId = Number(poliza?.id ?? 0);
  if (!(lifePolicyId > 0)) return 0;
  if (proporcionComision[lifePolicyId] === undefined) {
    const emitida = getComisionEmitida(poliza);
    const primaEmitida = Math.abs(emitida) > 0.005 ? getPrimaNetaEmitida(poliza) : 0;
    proporcionComision[lifePolicyId] = Math.abs(primaEmitida) > 0.005 ? emitida / primaEmitida : 0;
  }
  return round2(Number(primaCobrada || 0) * proporcionComision[lifePolicyId]);
}

/** Comision de la emision mas la de los endosos (Commission con changeId, sin error). */
function getComisionEmitida(poliza) {
  doCmd({ cmd: 'DoQuery', data: { sql: `SELECT SUM(c.credit) total
  FROM Commission c
  WHERE c.lifePolicyId = ${ Number(poliza.id) } AND c.err = 0 AND c.changeId IS NOT NULL` } });
  if (!DoQuery || DoQuery.ok === false) throw '@No fue posible leer las comisiones de la poliza ' + poliza.code;
  const endosos = Number(((DoQuery.outData ?? [])[0] || {}).total ?? 0);
  return round2(Number(poliza.commissions ?? 0) + endosos);
}

/**
 * Prima neta de las cuotas vigentes (sin fecha de anulacion) de la poliza: su detalle de prima,
 * o su monto sin impuesto cuando no lo tiene.
 */
function getPrimaNetaEmitida(poliza) {
  doCmd({ cmd: 'DoQuery', data: { sql: `SELECT pp.id, pp.minimum, d.prima
  FROM PayPlan pp
  LEFT JOIN (SELECT payPlanId, SUM(amount) prima FROM PayPlanDetail WHERE detail LIKE 'Prima%' GROUP BY payPlanId) d ON d.payPlanId = pp.id
  WHERE pp.lifePolicyId = ${ Number(poliza.id) } AND pp.cancellationDate IS NULL` } });
  if (!DoQuery || DoQuery.ok === false) throw '@No fue posible leer las cuotas de la poliza ' + poliza.code;
  const tasaRamo = ImpuestoSobrePrimasxRamo[String(poliza?.lob ?? '').trim()];
  const tasa = tasaRamo === undefined ? ImpuestoSobrePrimas : tasaRamo;
  return (DoQuery.outData ?? []).reduce((total, cuota) => {
    const prima = Number(cuota.prima ?? 0);
    return total + (Math.abs(prima) > 0.005 ? prima : Number(cuota.minimum ?? 0) / (1 + tasa));
  }, 0);
}

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

  doCmd({ cmd: 'DoQuery', data: { sql: `SELECT a.id, a.payPlanId, a.lifePolicyId, a.moneyInAmount, a.compensationAmount, a.compensationType, a.currency
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
 * MSN-000203: parte del impuesto de la poliza que es Impuesto de Auto, segun sus impuestos
 * vigentes (renglones TaxGenerated habilitados). 0 si la poliza no tiene ese renglon.
 */
function getParticipacionAuto(poliza) {
  const lifePolicyId = Number(poliza?.id ?? 0);
  if (!(lifePolicyId > 0)) return 0;
  if (participacionAuto[lifePolicyId] === undefined) {
    doCmd({ cmd: 'DoQuery', data: { sql: `SELECT SUM(t.amount) total,
    SUM(CASE WHEN t.taxName = 'Impuesto de Auto' THEN t.amount ELSE 0 END) auto
    FROM TaxGenerated t
    WHERE t.lifePolicyId = ${ lifePolicyId }
    AND (t.disabled = 0 OR t.disabled IS NULL)` } });
    const fila = (DoQuery?.outData ?? [])[0] || {};
    const total = Number(fila.total ?? 0);
    const auto = Number(fila.auto ?? 0);
    participacionAuto[lifePolicyId] = Math.abs(total) > 0.005 && Math.abs(auto) > 0.005 ? auto / total : 0;
  }
  return participacionAuto[lifePolicyId];
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
    cuentaDaniosxPagarCredito: 'DaniosxPagarCredito',
    cuentaImpuestoAuto: 'ImpuestoAuto',
    cuentaImpuestoAutoCredito: 'ImpuestoAutoCredito',
    cuentaComisionReserva: 'ComisionReserva',
    cuentaComisionxPagar: 'ComisionxPagar'
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
