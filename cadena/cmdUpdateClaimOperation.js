//block
//noreplace

/*
  *Author: Michael Delgado
  *Creation date: 2026-04-15
  *Description: Este comando ejecuta operaciones post actualización de reclamo, por ejemplo, validación de decisiones del reclamo para actualizar estados y cierre de reservas.
  *Email: michael.delgado@axxis-systems.com
  *Version: 1.0
*/

//doCmd({cmd: "GetPing", data: {datos: JSON.stringify(context)}});
const { id: claimId, processId, approvalResponse, lifePolicyId } = context;

//En caso que no haya nada, no hacemos nada
if(!approvalResponse){
  return {ok: true, msg: "No hay nada que actualizar"}
}

//Actualizamos estado del wf
updateWorkflowState(claimId, processId, approvalResponse);

//Cierro reservas asociadas al reclamo
closeAssociatedReserves(lifePolicyId, claimId, approvalResponse);

return {ok: true, msg: "Operación de actualización de reclamo ejecutada correctamente"};

//función que actualiza estado del wf según decisión del reclamo
function updateWorkflowState(claim, processId, approvalResponse) {

    log(`Validando estado del WF`);

    //valido el estado del wf según el processId
    doCmd({cmd: "LoadEntity", data: {entity: "Proceso", fields: "entityState", filter: `id = ${processId}`, noTracking: true}});

    const procesoInfo = LoadEntity.outData;
    if(!procesoInfo)
        throw new Error(`No se encontró información para el proceso con Id ${processId}`);

    //Si el WF ya se encuentra cerrado no hago nada.
    if(procesoInfo.entityState === "CLOSURE" || procesoInfo.entityState === "CLOSED"){
        log(`WF actualmente cerrado, no hago nada`);
        return;
    }        

    log(`Moviendo etapa del WF como cerrado o rechazado`);

    let newState;

    log(`Estado del reclamo: ${approvalResponse}`);

    //Si el estado es de rechazo/anulación, actualizo el WF a CLOSURE
    if (approvalResponse.trim().toUpperCase() === "D" || approvalResponse.trim().toUpperCase() === "C") {
        newState = "CLOSURE";
        doCmd({cmd: "GotoStep", data: {procesoId: processId, estado: newState}});

        if(!GotoStep.ok)
            throw new Error(`Error al mover WF (${processId}) de etapa, reclamo ${claimId}: ${GotoStep.msg || "Error desconocido"}`);

        log(`WF actualizado correctamente`);
    }
}

//función que se encargará de buscar saldo de reservas por cobertura y cerrar las reservas asociadas al reclamo
function closeAssociatedReserves(lifePolicyId, claimId, approvalResponse) {

    //Si no aplica, no hacemos nada
    if (approvalResponse.trim().toUpperCase() !== "D" && approvalResponse.trim().toUpperCase() !== "C") 
      return;

    log(`Validando cierre de reservas`);
    //Lógica para buscar reservas asociadas al reclamo y cerrarlas
    doCmd({cmd: "LoadEntities", data: {entity: "LifeCoveragePayout", filter: `lifePolicyId=${lifePolicyId} AND status <> '2'`, noTracking: true}});
    const reserves = LoadEntities.outData || [];

    log(`Reservas encontradas: ${JSON.stringify(reserves)}`);

    //Agrupo reservas por cobertura (lifeCoverageId) y sumo lo reservado (reserved) para cada cobertura
    const reservesByCoverage = reserves.reduce((acc, reserve) => {
        const coverageId = reserve.lifeCoverageId;
        if (!acc[coverageId]) {
            acc[coverageId] = 0;
        }
        acc[coverageId] += reserve.reserved;
        return acc;
    }, {});

    log(`Reservas encontradas: ${JSON.stringify(reservesByCoverage)}`);

    //Recorro cada cobertura y cierro las reservas asociadas
    for (const coverageId in reservesByCoverage) {
        const totalReserved = reservesByCoverage[coverageId];

        log(`Validand cierre de reserva de la cobertura ${coverageId} con monto total reservado de ${totalReserved}`);

        //Busco la primera reserva según cobertura para obtener datos de ella
        const firstReserve = reserves.find(d => Number(d.lifeCoverageId) === Number(coverageId));
        if (!firstReserve) {
            log(`No se encontró información de reserva para la cobertura ${coverageId}`);
            continue; //Si no encuentro información de reserva, paso a la siguiente cobertura
        }
        
        if(totalReserved != 0){

            //fecha actual en formato ISO
            const currentDate = new Date().toISOString();
            const usuario = getCurrentUser();
            //obtengo descripción de la decisión según approvalResponse, D: Rechazado, C: Anulado, A:Aprobado
            const decisionDescription = approvalResponse.trim().toUpperCase() === "D" ? "Rechazado" :
             approvalResponse.trim().toUpperCase() === "C" ? "Anulado" : 
             approvalResponse.trim().toUpperCase() === "A" ? "Aprobado" : "Desconocido";

             log(`Construyendo entidad`);

            //construyo entidad
            const entity = {
                id: 0,
                lifePolicyId: lifePolicyId,
                claimId: claimId,
                lifeCoverageId: coverageId,
                date: currentDate,
                user: usuario,
                reserved: -totalReserved, //Monto negativo para indicar que se está liberando la reserva
                amount: -totalReserved,
                payed: 0,
                concept: `Cierre de reserva automática según ${decisionDescription}`,
                operation: "RESERVE",
                status: 1,
                requestedAmount: 0,
                deductible: 0,
                parentCode: null,
                reserveType: firstReserve.reserveType,
                expenseType: null,
                ClaimExpense: null,
                jAffectedObjects: null
            };

            log(`Entidad: ${JSON.stringify(entity)}`);

            //Lógica para cerrar reservas asociadas a la cobertura, por ejemplo, actualizando su estado a "Cerrada"
            doCmd({cmd: "RepoLifeCoveragePayout", data: {operation: "ADD", entity: entity}});
            if(!RepoLifeCoveragePayout.ok)
                throw new Error(`Error al cerrar reservas para la cobertura ${coverageId}: ${RepoLifeCoveragePayout.msg || "Error desconocido"}`);

            log(`Cobertura ${coverageId} con monto total reservado de ${totalReserved} cerrada correctamente`);
        }

   }

}

//función para obtener el usuario actual del sistema
function getCurrentUser() {
    //Lógica para obtener el usuario actual del sistema, por ejemplo, a través de una función de autenticación o contexto de usuario
    doCmd({cmd: "GetCurrentUser", data: {}});
    const currentUser = GetCurrentUser.outData?.email;
    return currentUser;
}