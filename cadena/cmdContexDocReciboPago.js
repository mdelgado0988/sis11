//block
//noreplace

/**
 * @author Jampier Solera
 * @email support@axxis-systems.com
 * @created 2026/01/07
 * @name cmdContexDocReciboPago
 * @version 1.1
 * @purpose Builds the payment receipt document context for a claim payment.
 * @context Receives the claim identifier through _row.reclamo.
 * @output Returns the payment data enriched with document and user information.
 */

const claimId = context.row.reclamo;

/*==================
  Obtener Pago PayClaim
=================*/

doCmd({
  cmd:"RepoClaim",
  data: {
    operation:"GET",
    filter:`id = '${claimId}'`,
    include:["Payments","Process"]
  }
});

// return RepoClaim
if (!claimId) {
  return { ok: true, msg: ''};
}

doCmd({
    "cmd": "RepoPaymentTypeCatalog",
    "data": {
        "operation": "GET"
    }
})

const catPayment = RepoPaymentTypeCatalog.outData;

if (!(RepoClaim.total > 0) || !RepoClaim.outData) {
  return { ok: true, msg: '', cumulo: 0 };
}

const claim = RepoClaim.outData[0]
const paymentClaim = getLatestClaimPayment(claim);

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

doCmd({"cmd":"GetContacts","data":{"filter":`id = ${payment.contactId}`}})

if (!processId) {
  return { ok: true, msg: '@Proceso no encontrado en el pago', cumulo: 0 };
}

doCmd({ "cmd": "GetCurrentUser"});
const dataContex = RepoClaimPayment.outData[0];
dataContex.usuario = GetCurrentUser.outData.nombre;
// dataContex.transaccion = catPayment.filter(x=>x.code == dataContex.paymentType)[0].name;
const isMerged = isMergedPayment(dataContex) || isMergedPayment(payment);
dataContex.transaccion = payment.payoutId || (isMerged ? dataContex.processId || processId : null);
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
if (mergedChildConcept && (isMerged || mergedChild)) {
  dataContex.concept = mergedChildConcept;
  if (!isMerged) {
    dataContex.reference = mergedChildConcept;
  }
}

formatOutputAmounts(dataContex);

return dataContex

/* =========================
   Resultado final
========================= */

function formatOutputAmounts(output) {
  const amountFields = [
    'grossAmount',
    'total',
    'amount',
    'netAmount',
    'tax',
    'taxes',
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
        fields: 'id,date,created,claimId,parentId,producer,entityState,reference,concept',
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
        fields: 'id,date,created,claimId,parentId,producer,entityState,reference,concept',
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
      fields: 'id,date,created,claimId,parentId,producer,entityState,reference,concept',
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
