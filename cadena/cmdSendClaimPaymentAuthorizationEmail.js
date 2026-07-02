//block
//noreplace
/*
  @Autor: Michael Delgado.
  @Name: cmdSendClaimPaymentAuthorizationEmail
  @Email: michael.delgado@axxis-systems.com
  @Fecha: 2026.02.04
  @Description: Send an email requesting authorization from the Claims Management user group.
  @Version: 1.0
  @Parameters:
    {"claimId":57,"amount":100.25}
*/

/*doCmd({
  cmd: "GetPing",
  data: {
    mypl: JSON.stringify(context)
  }
});*/

const plantilla = "AutorizaPagoReclamoGerencia";

const input = context ?? null;
if (!input || typeof input !== "object") {
  return { ok: false, msg: "El contexto no contiene los datos requeridos." };
}

const claimIdResult = getValidId(input.claimId, "claimId");
if (!claimIdResult.ok) return claimIdResult;

const amountResult = getAmount(input.amount);
if (!amountResult.ok) return amountResult;

const claimData = getClaimData(claimIdResult.value);
if (!claimData.ok) return claimData;

const { claimCode, lifePolicyId, policyCode, currency } = claimData;

const userGroup = getUserGroups();
if (!userGroup) {
  return { ok: false, msg: "No se encontro el grupo de usuarios de Gerencia de Siniestros." };
}

if (!Array.isArray(userGroup.Members) || userGroup.Members.length === 0) {
  return { ok: false, msg: "El grupo de usuarios no tiene miembros configurados." };
}

const montoFormato = formatearN2(amountResult.value);
const insuredResult = getInsured(lifePolicyId);
if (!insuredResult.ok) return insuredResult;
const asegurado = insuredResult.value;

var enviados = 0;
var omitidos = 0;

userGroup.Members.forEach(x => {
  if (!x || !isValidEmail(x.usrEmail)) {
    omitidos += 1;
    return;
  }

  const userName = obtenerUsuarioEmail(x.usrEmail);

  let contextHtmlTemplate = {
    gerente: userName,
    asegurado: asegurado,
    reclamo: claimCode,
    poliza: policyCode,
    monto_indemnizar: `${currency} ${montoFormato}`
  };

  const emailContext = {
    usrEmail: x.usrEmail,
    contextHtmlTemplate: contextHtmlTemplate,
    plantilla: plantilla
  };

  doCmd({
    cmd: "PutMessage",
    data: {
      batch: `Send Claim ${claimCode} Email`,
      notify: false,
      value: JSON.stringify({
        cmd: "ExeChain",
        data: {
          chain: "cmdSendCustomTemplateEmail",
          context: JSON.stringify(emailContext)
        }
      })
    }
  });
  enviados += 1;
});

return { ok: true, msg: `Correos enviados: ${enviados}. Omitidos: ${omitidos}` };

/////////////////////////////////////////////////////////////////////////////
///Auxiliares
/////////////////////////////////////////////////////////////////////////////

function getUserGroups() {
  doCmd({
    cmd: "RepoUsrGroup",
    data: {
      operation: "GET",
      filter: `name='Gerencia de Siniestros'`,
      include: ["Members"]
    }
  });

  const userGroup = RepoUsrGroup.outData && RepoUsrGroup.outData.length > 0 ? RepoUsrGroup.outData[0] : null;
  return userGroup;
}

function getValidId(value, fieldName) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, msg: `El campo ${fieldName} es obligatorio y debe ser un numero valido.` };
  }

  return { ok: true, value: id };
}

function getAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, msg: "El campo amount es obligatorio y debe ser un numero valido mayor a cero." };
  }

  return { ok: true, value: amount };
}

function getClaimData(claimId) {
  doCmd({
    cmd: "LoadEntity",
    data: {
      entity: "Claim",
      fields: "code,lifePolicyId",
      filter: `id=${claimId}`
    }
  });

  const claim = LoadEntity?.outData || null;
  if (!claim) {
    return { ok: false, msg: "No se encontro el reclamo informado." };
  }

  const lifePolicyId = Number(claim.lifePolicyId ?? 0);
  if (!Number.isInteger(lifePolicyId) || lifePolicyId <= 0) {
    return { ok: false, msg: "El reclamo no tiene poliza asociada." };
  }

  const policyData = getPolicyData(lifePolicyId);
  if (!policyData.ok) {
    return policyData;
  }

  return {
    ok: true,
    claimCode: claim.code || "0",
    lifePolicyId: lifePolicyId,
    ...policyData
  };
}

function getPolicyData(lifePolicyId) {
  doCmd({
    cmd: "LoadEntity",
    data: {
      entity: "LifePolicy",
      fields: "code,currency",
      filter: `id=${lifePolicyId}`
    }
  });

  const policy = LoadEntity?.outData || {};
  if (!policy || !policy.code) {
    return { ok: false, msg: "La poliza asociada al reclamo no existe o no pudo cargarse." };
  }

  return {
    ok: true,
    policyCode: policy.code || "0",
    currency: policy.currency || ""
  };
}

function getInsured(lifePolicyId) {
  doCmd({
    cmd: "LoadEntity",
    data: {
      entity: "Insured",
      fields: "name",
      filter: `lifePolicyId=${lifePolicyId}`
    }
  });

  const asegurado = LoadEntity?.outData?.name || "";
  if (!asegurado) {
    return { ok: false, msg: "La poliza no tiene asegurado configurado." };
  }

  return { ok: true, value: asegurado };
}

function formatearN2(valor) {
  if (valor === null || valor === undefined || valor === "") return "0.00";

  let numero = Number(valor);
  if (isNaN(numero)) return "0.00";

  const negativo = numero < 0;
  numero = Math.abs(numero);

  let partes = numero.toFixed(2).split(".");
  let entero = partes[0];
  let decimal = partes[1];

  entero = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return (negativo ? "-" : "") + entero + "." + decimal;
}

function obtenerUsuarioEmail(email) {
  if (typeof email !== "string") return "";

  email = email.trim();

  const posicionArroba = email.indexOf("@");

  if (posicionArroba <= 0) return "";

  return email.substring(0, posicionArroba).toUpperCase();
}

function isValidEmail(email) {
  if (typeof email !== "string") return false;

  const value = email.trim();
  if (value.length < 5) return false;

  const parts = value.split("@");
  if (parts.length !== 2) return false;

  const [localPart, domainPart] = parts;
  if (!localPart || !domainPart) return false;
  if (domainPart.trim().length < 3) return false;
  if (!domainPart.includes(".")) return false;

  return true;
}
