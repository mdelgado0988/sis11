//block
//noreplace
/*
  *Name: cmdUpdateClaimStage
  *Descripción: Update claim stage in database and register log of the change
  *Autor: Michael Delgado
  *Email: michael.delgado@axxis-systems.com
  *Fecha de creación: 11/06/2026
*/

const { claimId, stageCode } = context;
const stageName = (stageCode == "R" ? "Rechazado/Declinado" : "Finalizado");
const descriptionName = (stageCode == "R" ? "Cierre del reclamo por rechazo/declinación" : "Cierre del reclamo");

doCmd({cmd: "GetCurrentUser", data: {}});
const user = GetCurrentUser.outData ?? {};
const userEmail = user?.email ?? "";

const ClaimEvent = { claimId: claimId, name: stageName, description: descriptionName, type: "FILE", user: userEmail, date: new Date() };

setStageCode();
setEventLog();

return { ok: true, msg: 'Reclamo actualizado' };

function setStageCode() {

  doCmd({cmd: "SetClaimStage", data: { claimId: claimId, stageCode: stageCode }});
  if(!SetClaimStage.ok){
    throw new Error("Error actualizando estado del reclamo");
  }
  
}

//Its build this way because does´nt existe a command to do this action and we need to register the event log of the change, so we need to do the insert manually
function setEventLog() {

  const formatValue = (value) => {
    if (value === null || value === undefined) return "NULL";
    if (value instanceof Date) return `'${value.toISOString().replace("T", " ").substring(0, 19)}'`;
    if (typeof value === "string") return `'${value.replace(/'/g, "''")}'`;
    return value;
  };

  const RepoName = "ClaimEvent";
  const fields = Object.keys(ClaimEvent);
  const values = Object.values(ClaimEvent).map(formatValue);

  const query = `
    INSERT INTO [${RepoName}] ([${fields.join("], [")}])
    VALUES (${values.join(", ")});
  `;

  doCmd({cmd: "DoQuery", data: { sql: query }});
  if(!DoQuery.ok)
    throw new Error(`Error registrando log del cambio de estado: ${DoQuery.msg} => ${query}`);
  
}