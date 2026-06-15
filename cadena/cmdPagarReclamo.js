//block

/**
 * @name cmdPagarReclamo
 * @version 1
 * @Autor  Michael Delgado.
 * @Created 2025.01.07.
 * @purpose Comando para actualizar estado del workflow de reclamos, se valida el reclamo asociado una solicitud de pago y se envíe a su estado final de pagado.
 * @Input { solicitudId }
 * @Output { ok, msg }
*/

try {

  const solicitudId = context.solicitudId ?? 0;
  const claimId = loadClaimIdFromPayment(solicitudId);

  if (!claimId)
    return { ok: true, msg: 'Solicitud no es de reclamo' };

  log(claimId);

  if (claimId <= 0)
    return { ok: true, msg: 'Solicitud no es de reclamo' };

  const processId = loadClaimProcessId(claimId);
  const reservado = loadReservedAmount(claimId);
  const pagado = loadPaidAmount(claimId);

  if (!processId)
    return { ok: true, msg: 'Reclamo no tiene un workflow asociado' };

  closeClaimWorkflow(processId);

  log(`Reservado: ${reservado}, Pagado: ${pagado}`);

  return { ok: true, msg: 'Reclamo actualizado a estado final' };

} catch (error) {
  return { ok: false, msg: error };
}

function loadClaimIdFromPayment(solicitudId) {
  doCmd({
    cmd: "LoadEntity",
    data: {
      entity: "ClaimPayment",
      filter: `id=${solicitudId}`,
      fields: "claimId"
    }
  });

  return LoadEntity.outData?.claimId ?? 0;
}

function loadClaimProcessId(claimId) {
  doCmd({
    cmd: "LoadEntity",
    data: {
      entity: "Claim",
      filter: `id=${claimId}`,
      fields: "processId",
      noTracking: true
    }
  });

  return LoadEntity.outData?.processId ?? 0;
}

function loadReservedAmount(claimId) {
  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "LifeCoveragePayout",
      filter: `claimId=${claimId}`,
      fields: "reserved, payed",
      noTracking: true
    }
  });

  const reservas = Array.isArray(LoadEntities.outData) ? LoadEntities.outData : [];

  return reservas.reduce((acc, item) => {
    const reserved = Number(item?.reserved ?? 0);
    const payed = Number(item?.payed ?? 0);
    return acc + (reserved - payed);
  }, 0);
}

function loadPaidAmount(claimId) {
  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "ClaimPayment",
      filter: `claimId=${claimId}`,
      fields: "total",
      noTracking: true
    }
  });

  const pagos = Array.isArray(LoadEntities.outData) ? LoadEntities.outData : [];

  return pagos.reduce((acc, item) => acc + Number(item?.total ?? 0), 0);
}

function closeClaimWorkflow(processId) {
  doCmd({
    cmd: "GotoStep",
    data: {
      procesoId: processId,
      estado: "CLOSED",
      userValues: null,
      isNonInterruptingEvent: false,
      process: null
    }
  });

  if (!GotoStep.ok) {
    throw new Error(GotoStep.msg || `No se pudo cerrar el workflow ${processId}`);
  }
}
