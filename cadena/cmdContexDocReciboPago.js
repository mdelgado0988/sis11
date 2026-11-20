//block
//noreplace

/**
 * @author Jampier Solera
 * @email support@axxis-systems.com
 * @created 2026/01/07
 * @name cmdContexDocReciboPago
 * @version 1.4
 * @purpose Builds the payment receipt document context for a claim payment.
 * @context Receives the claim identifier through _row.reclamo and, optionally,
 *          the payment request identifier through _row.solicitud.
 *          MSN-000136: with _row.solicitud and no _row.reclamo (a request that belongs to
 *          no claim, e.g. a merge of requests from several claims), the context is built
 *          from the request alone.
 *          MSN-000212: retentions and deductions are formatted like the other amounts, and the request's
 *          deductions (taxType DED, e.g. «Cobro de deducible») are listed one by one in deductionLines.
 *          MSN-000224: the same context also fills «Solicitud Orden de Pago.docx» (the «ORDEN DE PAGO» form):
 *          new keys only (pagueseA, montoEnLetras, numeroReclamo, numeroPoliza, payment-method marks,
 *          lineasDeduccion, totals, preparadoPor), so «Solcitud de Pago.docx» prints as before.
 * @output Returns the payment data enriched with document and user information.
 */

const claimId = context.row.reclamo;
const requestedPaymentId = getRequestedPaymentId(context && context.row);
// Solicitud sin reclamo: el documento sale completo de la solicitud (MSN-000136).
const requestOnly = !claimId && requestedPaymentId !== null;

/*==================
  Obtener Pago PayClaim
=================*/

if (!requestOnly) {
  doCmd({
    cmd:"RepoClaim",
    data: {
      operation:"GET",
      filter:`id = '${claimId}'`,
      include:["Payments","Process"]
    }
  });
}

// return RepoClaim
if (!claimId && !requestOnly) {
  return { ok: true, msg: ''};
}

doCmd({
    "cmd": "RepoPaymentTypeCatalog",
    "data": {
        "operation": "GET"
    }
})

const catPayment = RepoPaymentTypeCatalog.outData;

if (!requestOnly && (!(RepoClaim.total > 0) || !RepoClaim.outData)) {
  return { ok: true, msg: '', cumulo: 0 };
}

const claim = requestOnly ? null : RepoClaim.outData[0]
const paymentClaim = requestedPaymentId ? { id: requestedPaymentId } : getLatestClaimPayment(claim);

if (!paymentClaim) {
  return { ok: true, msg: '@No se encontró un pago asociado al reclamo', cumulo: 0 };
}
const processId = claim?.Process?.id;

/* =========================
   Obtener pago
========================= */
doCmd({
  cmd: "RepoClaimPayment",
  data: {
    operation: "GET",
    custom: true,
    filter: `id = ${paymentClaim.id}`,
    include: [
      "Process",
      "Taxes",
      "CostCenters",
      "CostCenters.CostCenter",
    ]
  }
});


const payment = RepoClaimPayment.outData[0];

if (!payment) {
  return { ok: true, msg: '@No se encontró la solicitud de pago indicada', cumulo: 0 };
}
const mergedChildrenForClaim = !requestOnly && Number(payment.id) > 0
  ? loadPaymentsByParent(payment.id).filter(child => Number(child && child.claimId) === Number(claimId))
  : [];
const isMergedRequestForClaim = mergedChildrenForClaim.length > 0;
if (!requestOnly && Number(payment.claimId) !== Number(claimId) && !isMergedRequestForClaim) {
  return { ok: true, msg: '@La solicitud de pago no pertenece al reclamo indicado', cumulo: 0 };
}

doCmd({"cmd":"GetContacts","data":{"filter":`id = ${payment.contactId}`}})

const documentProcessId = requestOnly ? (payment.processId || (payment.Process && payment.Process.id)) : processId;
if (!documentProcessId) {
  return { ok: true, msg: '@Proceso no encontrado en el pago', cumulo: 0 };
}

doCmd({ "cmd": "GetCurrentUser"});
const dataContex = RepoClaimPayment.outData[0];
dataContex.usuario = GetCurrentUser.outData.nombre;
// MSN-000224: the payee as the request has it, before an additional beneficiary replaces it below.
const payeeName = String(dataContex.beneficiaryName ?? '').trim();
const additionalBeneficiary = getAdditionalBeneficiary(dataContex, payment);
if (additionalBeneficiary) {
  dataContex.beneficiaryName = additionalBeneficiary;
}
// dataContex.transaccion = catPayment.filter(x=>x.code == dataContex.paymentType)[0].name;
const isMerged = isMergedPayment(dataContex) || isMergedPayment(payment);
dataContex.transaccion = payment.payoutId || (isMerged || requestOnly ? dataContex.processId || documentProcessId : null);
const today = new Date(dataContex.date);
dataContex.cedula = GetContacts.outData[0].cnp || GetContacts.outData[0].nif


const fechaFormateada =
  today.getDate().toString().padStart(2,'0') + '/' +
  (today.getMonth()+1).toString().padStart(2,'0') + '/' +
  today.getFullYear();

dataContex.fechaFormateada = fechaFormateada;

if (dataContex.concept == null){
  dataContex.concept = dataContex.reference;
}

let mergedChild = paymentClaim && paymentClaim.mergedChild;
if (isMerged) {
  const loadedChildren = loadFullPaymentsByParent(dataContex.id).sort(comparePayments);
  mergedChild = loadedChildren[0] || mergedChild;
}
const mergedChildConcept = getMeaningfulPaymentText(mergedChild);
if (isMerged) {
  dataContex.reference = '';
}
const parentConcept = getMeaningfulConcept(payment);
if (mergedChildConcept && !parentConcept && (isMerged || mergedChild)) {
  dataContex.concept = mergedChildConcept;
}
if (!isMerged && mergedChildConcept) {
  dataContex.concept = mergedChildConcept;
  dataContex.reference = mergedChildConcept;
}

addPaymentOrderFields(dataContex, claim, payeeName, additionalBeneficiary, GetContacts.outData[0]);
formatOutputAmounts(dataContex);
const deductionLines = getDeductionLines(dataContex.Taxes);
if (deductionLines.length > 0) {
  dataContex.deductionLines = deductionLines;
}

// La referencia no debe repetirse en el recibo cuando describe el mismo concepto.
const normalizedReference = String(dataContex.reference ?? '').trim().toLocaleLowerCase();
const normalizedConcept = String(dataContex.concept ?? '').trim().toLocaleLowerCase();
if (normalizedReference && normalizedConcept && normalizedReference === normalizedConcept) {
  dataContex.reference = '';
}

return dataContex

/* =========================
   Resultado final
========================= */

function getAdditionalBeneficiary(...payments) {
  for (const payment of payments) {
    const directValue = String(payment?.additionalBeneficiary ?? '').trim();
    if (directValue) return directValue;

    const detail = payment?.jDetail;
    if (!detail) continue;

    try {
      const rows = Array.isArray(detail) ? detail : JSON.parse(detail);
      const items = Array.isArray(rows) ? rows : [rows];
      const value = items
        .map(item => String(item?.additionalBeneficiary ?? '').trim())
        .find(Boolean);
      if (value) return value;
    } catch (error) {
      // Un jDetail inválido no debe impedir la generación del recibo.
    }
  }

  return '';
}

function getRequestedPaymentId(row) {
  const value = row && (row.solicitud ?? row.idSolicitud ?? row.claimPaymentId ?? row.paymentId);
  const paymentId = Number(value);
  return Number.isInteger(paymentId) && paymentId > 0 ? paymentId : null;
}

// MSN-000212: one { name, amount } per deduction of the request, in the order they were added.
function getDeductionLines(taxes) {
  return (Array.isArray(taxes) ? taxes : [])
    .filter(tax => String(tax && tax.taxType || '').trim().toUpperCase() === 'DED' && Number(tax.amount) !== 0)
    .sort((left, right) => Number(left.id || 0) - Number(right.id || 0))
    .map(tax => ({
      name: String(tax.taxName || tax.valueAddedCode || '').trim(),
      amount: formatAmount(Math.abs(Number(tax.amount)))
    }));
}

function formatOutputAmounts(output) {
  const amountFields = [
    'grossAmount',
    'total',
    'amount',
    'netAmount',
    'tax',
    'taxes',
    'retentions',
    'deductions',
    'fee',
    'fees',
    'expenses',
    'interest',
    'surcharge',
    'surcharges',
    'discount',
    'discounts',
    'deductible',
    'cost',
    'costs'
  ];

  amountFields.forEach(field => {
    if (output[field] !== undefined && output[field] !== null) {
      output[field] = formatAmount(output[field]);
    }
  });
}

function getLatestClaimPayment(claim) {
  const directPayments = Array.isArray(claim && claim.Payments) ? claim.Payments : [];
  let claimPayments = directPayments;

  // RepoClaim puede incluir pagos sin los campos necesarios para identificar una fusión.
  // Se consulta ClaimPayment explícitamente antes de resolver los hijos por parentId.
  const claimId = Number(claim && claim.id);
  if (Number.isInteger(claimId) && claimId > 0) {
    doCmd({
      cmd: 'LoadEntities',
      data: {
        entity: 'ClaimPayment',
        fields: 'id,date,claimId,parentId,producer,entityState,reference,concept',
        filter: `claimId = ${claimId}`,
        noTracking: true
      }
    });
    const loadedPayments = typeof LoadEntities !== 'undefined' && LoadEntities && Array.isArray(LoadEntities.outData)
      ? LoadEntities.outData
      : [];
    claimPayments = directPayments.concat(loadedPayments);
  }

  claimPayments = claimPayments.filter((payment, index, payments) => {
    const paymentId = Number(payment && payment.id);
    return paymentId > 0 && payments.findIndex(item => Number(item && item.id) === paymentId) === index;
  });

  const mergedPaymentIds = claimPayments
    .filter(payment => {
      const producer = String(payment && payment.producer || '').trim().toUpperCase();
      const entityState = String(payment && payment.entityState || '').trim().toUpperCase();
      return producer === 'MERGED' || entityState === 'MERGED';
    })
    .reduce((ids, payment) => {
      const paymentId = Number(payment && payment.id);
      const parentId = Number(payment && payment.parentId);
      if (Number.isInteger(paymentId) && paymentId > 0) ids.push(paymentId);
      if (Number.isInteger(parentId) && parentId > 0) ids.push(parentId);
      return ids;
    }, [])
    .filter(id => Number.isInteger(id) && id > 0);

  let relatedPayments = [];
  if (mergedPaymentIds.length > 0) {
    const uniqueMergedPaymentIds = Array.from(new Set(mergedPaymentIds));
    doCmd({
      cmd: 'LoadEntities',
      data: {
        entity: 'ClaimPayment',
        fields: 'id,date,claimId,parentId,producer,entityState,reference,concept',
        filter: `id IN (${uniqueMergedPaymentIds.join(',')}) OR parentId IN (${uniqueMergedPaymentIds.join(',')})`,
        noTracking: true
      }
    });
    relatedPayments = typeof LoadEntities !== 'undefined' && LoadEntities && Array.isArray(LoadEntities.outData)
      ? LoadEntities.outData
      : [];
  }

  const candidates = claimPayments.concat(relatedPayments).filter((payment, index, payments) => {
    const paymentId = Number(payment && payment.id);
    return paymentId > 0 && payments.findIndex(item => Number(item && item.id) === paymentId) === index;
  });

  // En una fusión, el parentId identifica la solicitud padre que contiene
  // la información consolidada y debe ser la fuente del documento.
  const parentIds = Array.from(new Set(claimPayments
    .map(payment => Number(payment && payment.parentId))
    .filter(id => Number.isInteger(id) && id > 0)));
  const explicitlyLoadedChildren = parentIds.reduce((all, parentId) => {
    return all.concat(loadPaymentsByParent(parentId));
  }, []);
  const allCandidates = candidates.concat(explicitlyLoadedChildren).filter((payment, index, payments) => {
    const paymentId = Number(payment && payment.id);
    return paymentId > 0 && payments.findIndex(item => Number(item && item.id) === paymentId) === index;
  });
  const parentPayment = allCandidates.find(payment => parentIds.includes(Number(payment && payment.id)));
  if (parentPayment) {
    const childPayments = allCandidates
      .filter(payment => Number(payment && payment.parentId) === Number(parentPayment.id))
      .sort(comparePayments);
    return {
      ...parentPayment,
      mergedChild: childPayments[0] || null
    };
  }
  if (parentIds.length > 0) return { id: parentIds[0], mergedChild: null };

  return candidates.sort(comparePayments)[0] || null;
}

function isMergedPayment(payment) {
  const producer = String(payment && payment.producer || '').trim().toUpperCase();
  const entityState = String(payment && payment.entityState || '').trim().toUpperCase();
  return producer === 'MERGED' || entityState === 'MERGED';
}

function loadPaymentsByParent(parentId) {
  doCmd({
    cmd: 'LoadEntities',
    data: {
      entity: 'ClaimPayment',
      fields: 'id,date,claimId,parentId,producer,entityState,reference,concept',
      filter: `parentId = ${Number(parentId)}`,
      noTracking: true
    }
  });
  return typeof LoadEntities !== 'undefined' && LoadEntities && Array.isArray(LoadEntities.outData)
    ? LoadEntities.outData
    : [];
}

function loadFullPaymentsByParent(parentId) {
  doCmd({
    cmd: 'RepoClaimPayment',
    data: {
      operation: 'GET',
      custom: true,
      filter: `parentId = ${Number(parentId)}`,
      include: [
        'Process',
        'Taxes',
        'CostCenters',
        'CostCenters.CostCenter'
      ]
    }
  });
  return typeof RepoClaimPayment !== 'undefined' && RepoClaimPayment && Array.isArray(RepoClaimPayment.outData)
    ? RepoClaimPayment.outData
    : [];
}

function getMeaningfulPaymentText(payment) {
  if (!payment) return '';
  const values = [payment.reference, payment.concept]
    .map(value => String(value === undefined || value === null ? '' : value).trim())
    .filter(value => value && value.toUpperCase() !== 'MERGED');
  return values[0] || '';
}

function getMeaningfulConcept(payment) {
  const value = String(payment?.concept ?? '').trim();
  return value && value.toUpperCase() !== 'MERGED' ? value : '';
}

function comparePayments(left, right) {
  const leftDate = new Date(left && (left.date || left.created) || 0).getTime();
  const rightDate = new Date(right && (right.date || right.created) || 0).getTime();
  if (leftDate !== rightDate) return rightDate - leftDate;
  return Number(right && right.id || 0) - Number(left && left.id || 0);
}

function formatAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;

  const fixed = amount.toFixed(2);
  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${parts[0]}.${parts[1]}`;
}

/* =========================
   MSN-000224: «Solicitud Orden de Pago.docx» («ORDEN DE PAGO»)
========================= */

// New keys only: the fields «Solcitud de Pago.docx» reads keep their values. Runs before formatOutputAmounts,
// while the amounts are still numbers.
function addPaymentOrderFields(output, claimRow, payeeName, additional, payeeContact) {
  const taxes = roundMoney(output.taxes);
  const deducted = roundMoney(Math.abs(Number(output.deductions) || 0) + Math.abs(Number(output.retentions) || 0));
  const net = roundMoney(output.total);
  const hasGross = output.grossAmount !== undefined && output.grossAmount !== null && output.grossAmount !== '';
  const gross = hasGross ? roundMoney(output.grossAmount) : roundMoney(net + deducted - taxes);
  const symbol = getCurrencySymbol(output.currency);
  const method = String(output.paymentMethodCode || '').trim().toUpperCase();
  const toAccount = ['TF', 'ACH', 'DEP'].includes(method);

  output.pagueseA = getPaymentOrderPayee(payeeName, additional);
  output.simboloMoneda = symbol;
  output.montoEnLetras = amountInSpanishWords(net, getCurrencyName(output.currency));
  output.numeroReclamo = String(claimRow && claimRow.code || '').trim();
  output.numeroPoliza = getPolicyCode(Number(claimRow && claimRow.lifePolicyId || output.lifePolicyId));
  output.marcaAcreditarCuenta = toAccount ? 'x' : ' ';
  output.marcaChequeRegular = method === 'CH' ? 'x' : ' ';
  // No payment method of the catalog is a manager's check.
  output.marcaChequeGerencia = ' ';
  output.cuentaAcreditar = toAccount ? String(payeeContact && payeeContact.bankAccount || '').trim() : '';
  output.numeroCheque = method === 'CH' && output.checkNum ? String(output.checkNum) : '';
  // Deductions and retentions, the amounts taken off the gross, in the order they were added.
  output.lineasDeduccion = (Array.isArray(output.Taxes) ? output.Taxes : [])
    .filter(tax => ['DED', 'RET'].includes(String(tax && tax.taxType || '').trim().toUpperCase()) && Number(tax.amount) !== 0)
    .sort((left, right) => Number(left.id || 0) - Number(right.id || 0))
    .map((tax, index) => ({
      linea: index + 1,
      codigo: String(tax.valueAddedCode || '').trim(),
      descripcion: String(tax.taxName || tax.valueAddedCode || '').trim(),
      monto: `${symbol} ${formatAmount(Math.abs(Number(tax.amount)))}`
    }));
  output.montoBruto = formatAmount(gross);
  output.totalDeduccion = formatAmount(deducted);
  output.tieneImpuesto = taxes !== 0;
  output.totalImpuesto = formatAmount(taxes);
  output.montoNeto = formatAmount(net);
  output.preparadoPor = (getUserName(output.user) || String(output.usuario || '')).trim().toUpperCase();
}

function roundMoney(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Number(amount.toFixed(2)) : 0;
}

// The request's payee. An additional beneficiary written as «Y …» (e.g. «Y GLOBAL BANK CORP», the creditor) is added
// to it; any other additional beneficiary replaces it, as in «Solcitud de Pago.docx».
function getPaymentOrderPayee(name, additional) {
  const payee = String(name || '').replace(/\s+/g, ' ').trim();
  const extra = String(additional || '').replace(/\s+/g, ' ').trim();
  if (!extra) return payee;
  if (/^(y|e|&)\s/i.test(extra)) return payee ? `${payee} ${extra}` : extra.replace(/^(y|e|&)\s+/i, '');
  return extra;
}

// The form is printed in Balboas (B/.), at par with the US dollar; any other currency prints its code.
function getCurrencyName(code) {
  const value = String(code || '').trim().toUpperCase();
  return !value || value === 'USD' || value === 'PAB' ? 'Balboas' : value;
}

function getCurrencySymbol(code) {
  const value = String(code || '').trim().toUpperCase();
  return !value || value === 'USD' || value === 'PAB' ? 'B/.' : value;
}

function getPolicyCode(policyId) {
  if (!Number.isInteger(policyId) || policyId <= 0) return '';
  doCmd({ cmd: 'LoadEntity', data: { entity: 'LifePolicy', fields: 'id, code', filter: `id = ${policyId}` } });
  const policy = typeof LoadEntity !== 'undefined' && LoadEntity && LoadEntity.outData;
  return String(policy && policy.code || '').trim();
}

// Name of the user who created the request («PREPARADO»).
function getUserName(email) {
  const login = String(email || '').trim();
  if (!login) return '';
  doCmd({ cmd: 'LoadEntity', data: { entity: 'Usr', fields: 'email, nombre', filter: `email = '${login.replace(/'/g, "''")}'` } });
  const user = typeof LoadEntity !== 'undefined' && LoadEntity && LoadEntity.outData;
  return String(user && user.nombre || '').trim();
}

// «tres mil trescientos veintitrés y 95 / 100 Balboas»
function amountInSpanishWords(value, currencyName) {
  const cents = Math.round(Math.abs(Number(value) || 0) * 100);
  const fraction = String(cents % 100).padStart(2, '0');
  return `${numberToSpanishWords(Math.floor(cents / 100))} y ${fraction} / 100 ${currencyName}`;
}

function numberToSpanishWords(value) {
  if (value === 0) return 'cero';
  const millions = Math.floor(value / 1000000);
  const thousands = Math.floor((value % 1000000) / 1000);
  const rest = value % 1000;
  const parts = [];
  if (millions) parts.push(millions === 1 ? 'un millón' : `${shortenOne(numberToSpanishWords(millions))} millones`);
  if (thousands) parts.push(thousands === 1 ? 'mil' : `${shortenOne(hundredsToSpanishWords(thousands))} mil`);
  if (rest) parts.push(hundredsToSpanishWords(rest));
  return parts.join(' ');
}

// 1 to 999.
function hundredsToSpanishWords(value) {
  const units = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece',
    'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés',
    'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
  const tens = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos',
    'ochocientos', 'novecientos'];
  if (value === 100) return 'cien';
  const rest = value % 100;
  const words = [];
  if (value >= 100) words.push(hundreds[Math.floor(value / 100)]);
  if (rest) words.push(rest < 30 ? units[rest] : tens[Math.floor(rest / 10)] + (rest % 10 ? ` y ${units[rest % 10]}` : ''));
  return words.join(' ');
}

// Before «mil» and «millones»: «veintiún mil», «treinta y un mil».
function shortenOne(words) {
  return words.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un');
}
