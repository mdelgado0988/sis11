//block
//noreplace

/*
  *Name: cmdValidateClaimPayoutCreation
  *Author: Noel Obando
  *Creation date: 2026-01-01
  *Description: Este comando aplica validaciones a la creación de reservas  
  *Version: 1.0
  *Modification: Michael Delgado. GLOB-639. 20256.04.15. Validamos el estado de la decisión del reclamo.
  *Version 1.1
*/

const input = context || {};
const lifePolicyId = Number(input.lifePolicyId || 0);
const reserved = Number(input.reserved || 0);
const claimId = Number(input.claimId || 0);
const reserveType = getReserveType(input);

//doCmd({cmd: "GetPing", data: {datos: JSON.stringify(context)}});

try {

  //Se valida estado de decisión del reclamo para evitar poder crear reservas o pagos para reclamos anulados o rechazados
  const claim = getClaim(claimId);
  const approvalResponse = String(claim && claim.approvalResponse || '').trim().toUpperCase();
  if(approvalResponse == "D" || approvalResponse == "C"){
    return {
      ok: false,
      msg: 'El reclamo se encuentra rechazada/anulado, no puede crear reservas ni pagos.',
      totalReservado: 0,
      montoMaximo: 0
    } 
  }
  
  // Cobertura basica
  doCmd({cmd:'LoadEntity',data:{ entity:'LifeCoverage', filter:`lifePolicyId=${ lifePolicyId } AND [basic]=1`}});
  const BasicCoverage = LoadEntity && LoadEntity.outData;
  if(!BasicCoverage){
    throw new Error('No se pudo recuperar la cobertura basica');
  }

  if(!reserveType){
    return {
      ok: false,
      msg: 'Debe indicar un tipo de reserva válido'
    };
  }

  // Validate the resulting balance only inside the requested reserve type.
  // The signed reserved amount already includes openings, increases and
  // closures. Payments must not be subtracted again from this balance.
  doCmd({cmd:'LoadEntities',data:{
    entity:'LifeCoveragePayout',
    fields:'reserveType,reserved',
    filter:`lifePolicyId=${ lifePolicyId }`,
    noTracking:true
  }});

  const payouts = LoadEntities && Array.isArray(LoadEntities.outData)
    ? LoadEntities.outData
    : [];
  const currentBalance = payouts.reduce((total, payout) => {
    if(getReserveType(payout) !== reserveType){
      return total;
    }

    return total + toNumber(payout && payout.reserved);
  }, 0);

  const resultingBalance = currentBalance + reserved;
  const coverageLimit = toNumber(BasicCoverage.limit);

  if(reserved > coverageLimit ) return {
    ok: false,
    msg: 'El monto de la cobertura no puede exceder la cobertura basica'
  };

  const validBalance = resultingBalance >= 0 && resultingBalance <= coverageLimit;
  
  return {
    ok: validBalance,
    msg: validBalance
      ? 'La validación de la reserva fue correcta'
      : (resultingBalance < 0
        ? `El saldo de la reserva no puede ser negativo para el tipo que está intentando crear. Disponible: ${formatAmount(currentBalance)}. Monto a reservar: ${formatAmount(reserved)}`
        : 'El monto de la cobertura no puede exceder la cobertura básica'),
    totalReservado: resultingBalance,
    montoMaximo: coverageLimit,
    reserveType: reserveType
  }
  
} catch (error) {
  return { ok: false, msg: `@${error.toString()}` }
}

function getClaim(claimId) {

  doCmd({cmd: "LoadEntity", data: { entity: "Claim", fields: "approvalResponse", filter: `id = ${claimId}` }});
  const response = LoadEntity.outData;
  if(!response)
    throw new Error("No se pudo recuperar reclamo");
  return response
}

function getReserveType(item) {
  const value = item && (item.reserveType || item.expenseType);
  return String(value || '').trim().toUpperCase();
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatAmount(value) {
  return toNumber(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
