//block
//noreplace

/*
Name: cmdMassiveNotification
Description: Renders and sends one notification from a validated batch row.
*/

const TEST_RECIPIENT = "Linneth.zuleta@aseguradoraglobal.com.pa";
const row = context && context.row ? context.row : {};
const tipoPlantilla = String(row.tipoPlantilla || "").trim();
const usuario = String(row.usuario || "").trim();
const poliza = String(row.poliza || "").trim();
const clienteId = Number(row.clienteId || 0);
const cliente = String(row.cliente || "").trim();
const apellidos = String(row.apellidos || "").trim();
const marca = String(row.marca || "").trim();
const placa = String(row.placa || "").trim();
const descripcion_objeto = String((row && (row["descripcion_objeto"] || row["descripcion"])) || "").trim();
const estadoEnvio = String(row.estadoEnvio || "").trim();
const rawTestFlag = row.usarCorreoPrueba !== undefined
  ? row.usarCorreoPrueba
  : (context && context.usarCorreoPrueba);
const usarCorreoPrueba = rawTestFlag === undefined
  ? true
  : ![false, 0, "0", "false", "no", "off"].includes(
    typeof rawTestFlag === "string" ? rawTestFlag.trim().toLowerCase() : rawTestFlag
  );

try {
  if (!tipoPlantilla) return { ok: false, msg: "La fila no contiene una plantilla de notificación." };
  if (!poliza) return { ok: false, msg: "La fila no contiene una póliza." };
  if (clienteId <= 0) return { ok: false, msg: "La fila no contiene un cliente válido." };

  const policyId = loadLatestPolicyId(poliza, clienteId);
  if (policyId <= 0) {
    return { ok: false, msg: "No se encontró la póliza validada " + poliza + " para registrar el envío." };
  }

  doCmd({
    cmd: "GetContacts",
    data: {
      operation: "GET",
      filter: "id = " + clienteId,
      include: ["Emails"]
    }
  });

  const contacts = GetContacts && Array.isArray(GetContacts.outData) ? GetContacts.outData : [];
  const contact = contacts.length ? contacts[0] : null;
  if (!contact) return { ok: false, msg: "No se encontró el cliente asociado a la póliza " + poliza + "." };

  const allClientEmails = getValidContactEmails(contact);
  const individual = String(row.destinatarioIndividual || "").toUpperCase() === "SI";
  const rowEmail = String(row.correo || "").trim().toLowerCase();
  // Legacy batches have one policy row: keep their existing all-address dispatch.
  // New batches have one address per row: never resend every address for every row.
  const clientEmails = individual && rowEmail
    ? allClientEmails.filter(function (email) { return email === rowEmail; })
    : allClientEmails;

  // AXX-1085: una póliza sin correo relacionado no bloquea el lote.
  // La fila se procesa, no se envía correo y queda registrada como "Sin correo".
  if (!clientEmails.length) {
    const skipMessage = "Notificación masiva NO enviada: la póliza " + poliza + " "
      + (individual && rowEmail ? "ya no tiene registrado el correo de esta fila. Plantilla: " : "no tiene un correo relacionado válido. Plantilla: ") + tipoPlantilla
      + (usuario ? ". Usuario de carga: " + usuario : "") + ".";

    doCmd({
      cmd: "AddComment",
      data: {
        msg: skipMessage,
        policyId: policyId
      }
    });

    return { ok: true, enviado: false, estadoEnvio: "Sin correo", msg: skipMessage };
  }

  doCmd({
    cmd: "RepoHtmlTemplate",
    data: {
      operation: "GET",
      filter: "name = '" + escapeSql(tipoPlantilla) + "'"
    }
  });

  const templates = RepoHtmlTemplate && Array.isArray(RepoHtmlTemplate.outData)
    ? RepoHtmlTemplate.outData
    : [];
  const emailTemplate = templates.length ? templates[0] : null;
  if (!emailTemplate) {
    return { ok: false, msg: "No se encontró la plantilla " + tipoPlantilla + "." };
  }

  const templateBody = String(emailTemplate.template || "");
  const templateTitle = String(emailTemplate.description || "");
  if (!templateBody) return { ok: false, msg: "La plantilla seleccionada no contiene cuerpo de correo." };
  if (!templateTitle) return { ok: false, msg: "La plantilla seleccionada no contiene asunto de correo." };

  const templateContext = {
    tipoPlantilla: tipoPlantilla,
    usuario: usuario,
    poliza: poliza,
    cliente: cliente,
    apellidos: apellidos,
    marca: marca,
    placa: placa,
    descripcion_objeto: descripcion_objeto
  };

  doCmd({
    cmd: "RenderHtmlTemplate",
    data: {
      context: JSON.stringify(templateContext),
      template: templateBody
    }
  });
  if (!RenderHtmlTemplate || RenderHtmlTemplate.ok === false || !RenderHtmlTemplate.outData) {
    return { ok: false, msg: "No se pudo renderizar el cuerpo del correo para la póliza " + poliza + "." };
  }
  const emailBody = String(RenderHtmlTemplate.outData.result || "");

  doCmd({
    cmd: "RenderHtmlTemplate",
    data: {
      context: JSON.stringify(templateContext),
      template: templateTitle
    }
  });
  if (!RenderHtmlTemplate || RenderHtmlTemplate.ok === false || !RenderHtmlTemplate.outData) {
    return { ok: false, msg: "No se pudo renderizar el asunto del correo para la póliza " + poliza + "." };
  }
  const emailSubject = String(RenderHtmlTemplate.outData.result || "");

  const recipients = usarCorreoPrueba ? clientEmails.map(function () { return TEST_RECIPIENT; }) : clientEmails;
  for (let i = 0; i < recipients.length; i++) {
    doCmd({
      cmd: "SendEmail",
      data: {
        email: recipients[i],
        subject: emailSubject,
        text: emailBody,
        attachments: [],
        names: []
      }
    });

    if (!SendEmail || SendEmail.ok === false) {
      return {
        ok: false,
        enviados: i,
        msg: SendEmail && SendEmail.msg
          ? SendEmail.msg
          : "No se pudo enviar el correo para la póliza " + poliza + "."
      };
    }
  }

  const commentMessage = (usarCorreoPrueba ? "Prueba de notificación masiva" : "Notificación masiva")
    + " enviada correctamente a " + clientEmails.length + " correo(s). Plantilla: "
    + tipoPlantilla
    + ". Correo(s) de la fila: " + clientEmails.join(", ")
    + (usarCorreoPrueba ? ". Destinatario de prueba: " + TEST_RECIPIENT : "")
    + (usuario ? ". Usuario de carga: " + usuario : "")
    + ".";

  doCmd({
    cmd: "AddComment",
    data: {
      msg: commentMessage,
      policyId: policyId
    }
  });

  if (!AddComment || AddComment.ok === false) {
    return {
      ok: false,
      msg: "El correo fue enviado, pero no se pudo registrar el comentario en la póliza " + poliza + "."
    };
  }

  return {
    ok: true,
    enviado: true,
    estadoEnvio: estadoEnvio || "Con correo",
    msg: (usarCorreoPrueba ? "Correos de prueba enviados únicamente a " + TEST_RECIPIENT : "Correos enviados a los contactos")
      + " (" + clientEmails.length + ")"
      + " y comentario registrado en la póliza " + poliza + "."
  };
} catch (error) {
  return {
    ok: false,
    msg: "Error enviando la notificación de la póliza " + poliza + ": " + error.toString()
  };
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function getValidContactEmails(contact) {
  const candidates = [];
  if (contact) candidates.push(contact.email);
  const relatedEmails = contact && Array.isArray(contact.Emails) ? contact.Emails : [];
  relatedEmails.forEach(function (item) { candidates.push(item && (item.email || item.num)); });

  const unique = [];
  candidates.forEach(function (candidate) {
    const email = String(candidate || "").trim();
    const key = email.toLowerCase();
    if (isValidEmail(email) && unique.indexOf(key) === -1) unique.push(key);
  });
  return unique;
}

function escapeSql(value) {
  return String(value || "").replace(/'/g, "''");
}

function loadLatestPolicyId(policyCode, holderId) {
  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "LifePolicy",
      fields: "id,code,holderId,created",
      filter: "[code] = N'" + escapeSql(policyCode) + "' AND holderId = " + Number(holderId),
      noTracking: true
    }
  });

  const policies = LoadEntities && Array.isArray(LoadEntities.outData)
    ? LoadEntities.outData.slice()
    : [];

  policies.sort(function (left, right) {
    const rightDate = new Date(right.created || 0).getTime() || 0;
    const leftDate = new Date(left.created || 0).getTime() || 0;
    const dateDifference = rightDate - leftDate;
    if (dateDifference !== 0) return dateDifference;
    return Number(right.id || 0) - Number(left.id || 0);
  });

  return policies.length ? Number(policies[0].id || 0) : 0;
}
