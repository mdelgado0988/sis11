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
var correos = [];

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

const montoFormato = formatearN2(amountResult.value);
const asegurado = getInsured(lifePolicyId);

var enviados = 0;

let test = [];

userGroup.Members.forEach(x => {
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

  test.push(PutMessage);
  enviados += 1;
});

return { ok: true, msg: `Correos enviados: ${enviados}`, test: test };

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
  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false, msg: "El campo amount es obligatorio y debe ser un numero valido mayor o igual a cero." };
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

  return {
    ok: true,
    claimCode: claim.code || "0",
    lifePolicyId: lifePolicyId,
    ...getPolicyData(lifePolicyId)
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
  return {
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
  return asegurado;
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
