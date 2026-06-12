//block
//noreplace
/**
 * Name: cmdRefineAnniversaryComputed
 * Author: Michael Delgado
 * Email: michael.delgado@axxis-systems.com
 * CreatedDate: 2026-06-11
 * Purpose: Update the LifePolicy insured sum using the computed anniversary insured sum.
 * Inputs: context.anniversary must include insuredSum and lifePolicyId.
 * Output: { ok, msg, outData? }
 */

const contexto = context.anniversary;
const anniversary = contexto?.anniversary || {};
const newAnniversary = contexto?.newAnniversary || {};

//return anniversary

if (!anniversary) {
  return {
    ok: false,
    msg: 'Missing anniversary in context.'
  };
}

if (!anniversary.lifePolicyId) {
  return {
    ok: false,
    msg: 'Missing lifePolicyId in anniversary.'
  };
}

let result = updateLifePolicyInsuredSum(anniversary.lifePolicyId, anniversary.insuredSum);
if (!result.ok) {
  return result;
}

result = updateAnniversaryInsuredSum(newAnniversary.id, anniversary.insuredSum);
if (!result.ok) {
  return result;
}

return {
  ok: true,
  msg: 'LifePolicy insuredSum updated successfully.',
  outData: {
    lifePolicyId: anniversary.lifePolicyId,
    insuredSum: anniversary.insuredSum
  }
};

function updateLifePolicyInsuredSum(lifePolicyId, insuredSum) {
  doCmd({
    cmd: 'SetPolicyField',
    data: {
      policyId: lifePolicyId,
      fieldValue: `[insuredSum]=${insuredSum}`
    }
  });

  if (!SetPolicyField.ok) {
    return {
      ok: false,
      msg: SetPolicyField.msg
    };
  }

  return {
    ok: true,
    msg: 'SetPolicyField executed successfully.'
  };
}

function updateAnniversaryInsuredSum(anniversaryId, insuredSum) {
  doCmd({
    cmd: 'SetField',
    data: {
      entity: "Anniversary",
      entityId: anniversaryId,
      fieldValue: `[insuredSum]=${insuredSum}`
    }
  });

  if (!SetField.ok) {
    return {
      ok: false,
      msg: SetPolicyField.msg
    };
  }

  return {
    ok: true,
    msg: 'SetField executed successfully.'
  };
}