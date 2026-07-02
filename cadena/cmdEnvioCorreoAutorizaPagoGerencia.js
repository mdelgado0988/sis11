//block
//noreplace
/*
  @Autor: Michael Delgado. 
  @Name: cmdEnvioCorreoAutorizaPagoGerencia
  @Email: michael.delgado@axxis-systems.com
  @Fecha: 2026.02.04
  @Description: Envía un correo para solicitar autorización a grupo de usuarios de Gerencia de reclamos
  @Version: 1.0
  @Parameters:
    row: {"request":43,"claimId":57,"lifePolicyId":553,"proceso":1324,"plantilla":"AutorizaPagoReclamoGerencia"}
*/

/*doCmd({
  cmd: "GetPing",
  data: {
    mypl: JSON.stringify(context)
  }
});*/

var correos = [];

const userGroup = getUserGroups();
if(!userGroup) return false;

const { claimId, lifePolicyId, request, proceso, plantilla } = context.row;

const claimCode = getClaimCode();

let policyCode = "0";
let currency = "";

getPolicyData(policyCode, currency);

const monto = getPayoutAmount();
const montoFormato = formatearN2(monto);
const asegurado = getInsured();

var enviados = 0;

//return userGroup;
let test = [];

userGroup.Members.forEach(x => {  

  const userName = obtenerUsuarioEmail(x.usrEmail);

  let contextHtmlTemplate = {
    "gerente": userName,
    "asegurado": asegurado,
    "reclamo": claimCode,
    "poliza": policyCode,
    "monto_indemnizar": `${currency} ${montoFormato}`
  }

  const emailContext = { usrEmail: x.usrEmail, contextHtmlTemplate: contextHtmlTemplate, plantilla: context.row.plantilla };

  doCmd({cmd: 'PutMessage', 
    data: { 
        batch: `Send Claim ${claimCode} Email`, 
        notify: false, 
        value: JSON.stringify({
            cmd: 'ExeChain', 
            data:{ 
                chain: "cmdSendCustomTemplateEmail",
                context: JSON.stringify(emailContext)
            }})
        }
  });

  test.push(PutMessage);  
  enviados +=1 ;
  
});

//return test

return { ok:true, msg: `Correos enviados: ${enviados}`, test: test };

/////////////////////////////////////////////////////////////////////////////
///Auxiliares
/////////////////////////////////////////////////////////////////////////////

function getUserGroups() {
  doCmd({
    cmd: "RepoUsrGroup",
    data: {
      operation: "GET",
      filter: `name='Gerencia de Siniestros'`,
      include:["Members"]
    }
  });
  
  const userGroup = RepoUsrGroup.outData && RepoUsrGroup.outData.length > 0 ? RepoUsrGroup.outData[0] : null;
  return userGroup;
}

function getClaimCode() {
  doCmd({
    cmd: "LoadEntity",
    data: {
      entity: "Claim",
      fields: "code",
      filter: `id=${claimId}`
    }
  })
  
  const claimCode = LoadEntity?.outData?.code || "0";
  return claimCode;
}

function getPolicyData(policyCode, currency) {
  
  doCmd({
    cmd: "LoadEntity",
    data: {
      entity: "LifePolicy",
      fields: "code,currency",
      filter: `id=${lifePolicyId}`
    }
  })
  
  policyCode = LoadEntity?.outData?.code || "0";
  currency = LoadEntity?.outData?.currency || "";
  
}

function getPayoutAmount() {
  doCmd({
    cmd: "LoadEntity",
    data: {
      entity: "PayoutRequest",
      fields: "amount",
      filter: `id=${request}`
    }
  })
  
  const monto = LoadEntity?.outData?.amount || 0;
  return monto;
}

function getInsured() {
  doCmd({
    cmd: "LoadEntity",
    data: {
      entity: "Insured",
      fields: "name",
      filter: `lifePolicyId=${lifePolicyId}`
    }
  })
  
  const asegurado = LoadEntity?.outData?.name || "";
  return asegurado
}

function formatearN2(valor) {
    if (valor === null || valor === undefined || valor === "") return "0.00";

    let numero = Number(valor);
    if (isNaN(numero)) return "0.00";

    const negativo = numero < 0;
    numero = Math.abs(numero);

    // Redondear a 2 decimales
    let partes = numero.toFixed(2).split(".");
    let entero = partes[0];
    let decimal = partes[1];

    // Agregar separador de miles
    entero = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return (negativo ? "-" : "") + entero + "." + decimal;
}

function obtenerUsuarioEmail(email) {
    if (typeof email !== "string") return "";

    email = email.trim();

    const posicionArroba = email.indexOf("@");

    if (posicionArroba <= 0) return ""; // No hay @ o está al inicio

    return email.substring(0, posicionArroba).toUpperCase();
}
