//block
//noreplace

/*
  *Command: cmdUpdatePolicyCancellation
  *Description: Formulario para gestionar la distribución de reaseguro de una póliza de vida, permitiendo asignar porcentajes, sumas aseguradas, primas, comisiones e impuestos a diferentes contratos de reaseguro (Cuota Parte, Facultativo, Fronting) y a los aceptantes dentro de cada contrato.
  *Author: Michael Delgado
  *Email: michael.delgado@axxis-sytems.com
  *Created: 17/04/2026
  *Version: 1.0
*/

const changeId = context.changeId;

try {

  doCmd({cmd: "LoadEntity", data: {entity: "Bill", filter: `changeId = ${changeId}`, noTracking: true}});
  const changeBilling = LoadEntity.outData;
  
  doCmd({cmd: "LoadEntity", data: {entity: "Change", fields: "id, lifePolicyId", filter: `id = ${changeId}`, noTracking: true}});
  const change = LoadEntity.outData;
  
  doCmd({cmd: "LoadEntity", data: {entity: "LifePolicy", fields: "anualPremium, surcharges, discounts, anualTotal, tax, fee", filter: `id = ${change.lifePolicyId}`, noTracking: true}});
  const policy = LoadEntity.outData;
  
  //Actualizamos la póliza según la cancelación
  const update = `anualPremium = ${redondear(changeBilling.anualPremium)}, 
    coverages = ${redondear(changeBilling.coverages)},
    surcharges = ${redondear(changeBilling.surcharges)},
    discounts = ${redondear(changeBilling.discounts)},
    tax = ${redondear(changeBilling.tax)},
    fee = ${redondear(changeBilling.fee)},
    anualTotal = ${redondear(changeBilling.anualTotal)}`
  doCmd({cmd: "SetField", data: {entity: "LifePolicy", fieldValue: update, entityId: change.lifePolicyId}});
  
  return {ok: SetField.ok, msg: SetField.msg}
  
} catch (error) {
  return {ok: false, msg: error.toString()}
}

function redondear(valor) {
  if (valor === null || valor === undefined) return 0;

  // Convertir a número
  let num = typeof valor === 'number' ? valor : parseFloat(valor);

  // Validar número
  if (isNaN(num) || !isFinite(num)) return 0;

  // Redondeo correcto evitando problemas de precisión
  return Math.round((num + Number.EPSILON) * 100) / 100;
}