//block
/*
Name: cmdImportPreloadMassiveNotification
Author: Cesar Aguilar 
Description: Enriches and prevalidates policy rows for massive notifications.
Category: PREPROCESSOR
Version: 1
*/

// AXX-1085: una poliza sin correo relacionado ya NO es una inconsistencia.
// Entra al lote como fila valida, queda marcada en el detalle y no se le envia nada.
const sendStatusWithEmail = "Con correo";
const sendStatusNoEmail = "Sin correo";

const input = context && typeof context === "object" ? context : {};
const sourceRows = Array.isArray(input.rows) ? input.rows : [];
const templateId = Number(input.templateId || 0);
const currentUser = String(input.usuario || "").trim();

if (!sourceRows.length) {
  return { outData: [], outDataAux: [], msg: "No se recibieron filas para prevalidar.", ok: false };
}

if (templateId <= 0) {
  return { outData: [], outDataAux: [], msg: "Debe seleccionar un tipo de carga.", ok: false };
}

if (!currentUser) {
  return { outData: [], outDataAux: [], msg: "No se pudo identificar el usuario de la sesión.", ok: false };
}

doCmd({
  cmd: "RepoHtmlTemplate",
  data: {
    operation: "GET",
    filter: "id = " + templateId
  }
});

const templates = RepoHtmlTemplate && Array.isArray(RepoHtmlTemplate.outData)
  ? RepoHtmlTemplate.outData
  : [];
const selectedTemplate = templates.length ? templates[0] : null;

if (!selectedTemplate) {
  return { outData: [], outDataAux: [], msg: "No se encontró la plantilla seleccionada.", ok: false };
}

const templateName = String(selectedTemplate.name || "").trim();
const templateBody = String(selectedTemplate.template || "");
const loadType = normalizeText(selectedTemplate.description || "");
const supportedLoadTypes = [
  "CARGA DE RECHAZOS ACH/ATH",
  "RECHAZOS ACH/ATH",
  "RECHAZOS ACH",
  "RENOVACION DE POLIZA",
  "POLIZAS SOLICITADAS POR EL BANCO",
  "SUSPENSION DE COBERTURA",
  "CANCELACION POR FALTA DE PAGO",
  "PAGO RECIBIDO",
  "CANCELACION DE TARJETA PROTEGIDA",
  "PRESTAMO CANCELADO POLIZA NIVELADA",
  "CARGO GL/CARGO IL",
  "PRESTAMO CANCELADO HIPOTECA",
  "AVISO DE CANCELACION RUBRO"
];

if (!templateName || supportedLoadTypes.indexOf(loadType) < 0) {
  return {
    outData: [],
    outDataAux: [],
    msg: "El tipo de carga seleccionado no está configurado para la prevalidación.",
    ok: false
  };
}

const validityRequiredTypes = [
  "CARGA DE RECHAZOS ACH/ATH",
  "RECHAZOS ACH/ATH",
  "RECHAZOS ACH",
  "RENOVACION DE POLIZA",
  "POLIZAS SOLICITADAS POR EL BANCO",
  "SUSPENSION DE COBERTURA",
  "CANCELACION POR FALTA DE PAGO",
  "PAGO RECIBIDO"
];
const requiresPolicyValidity = validityRequiredTypes.indexOf(loadType) >= 0;
const policyRows = extractPolicyRows(sourceRows);

if (!policyRows.length) {
  return { outData: [], outDataAux: [], msg: "El archivo no contiene pólizas para prevalidar.", ok: false };
}

let vehicleObjectDefinitionId = 0;
doCmd({
  cmd: "LoadEntity",
  data: {
    entity: "ObjectDefinition",
    fields: "id,code",
    filter: "[code] = N'DTAUT'",
    noTracking: true
  }
});

if (LoadEntity && LoadEntity.outData) {
  vehicleObjectDefinitionId = Number(LoadEntity.outData.id || 0);
}

let brandRows = [];
doCmd({ cmd: "GetFullTable", data: { table: "TablaMarcas" } });
if (GetFullTable && GetFullTable.ok && Array.isArray(GetFullTable.outData)) {
  brandRows = GetFullTable.outData;
}

const outputRows = [[
  "tipoPlantilla",
  "usuario",
  "poliza",
  "clienteId",
  "cliente",
  "apellidos",
  "marca",
  "placa",
  "correo",
  "estadoEnvio",
  "tipoTelefono",
  "mensaje"
]];
const invalidRows = [];

policyRows.forEach(function (sourceRow) {
  const errors = [];
  const policyCode = String(sourceRow.poliza || "").trim();
  let policy = null;
  let contact = null;
  let vehicle = { brand: "", plate: "" };

  if (!policyCode) {
    errors.push("La póliza está vacía.");
  } else {
    policy = loadLatestPolicy(policyCode);
    if (!policy) errors.push("La póliza no existe.");
  }

  if (policy) {
    const holderId = Number(policy.holderId || 0);
    if (holderId <= 0) {
      errors.push("La póliza no tiene un cliente asociado.");
    } else {
      contact = loadContact(holderId);
      if (!contact) errors.push("No se encontró el cliente asociado a la póliza.");
    }

    if (requiresPolicyValidity && policy.active !== true && Number(policy.policyVersion || 0) <= 0) {
      errors.push("La póliza no está vigente ni corresponde a una renovación.");
    }

    if (vehicleObjectDefinitionId > 0) {
      vehicle = loadVehicle(policy.id, vehicleObjectDefinitionId, brandRows);
    }
  }

  let contactEmail = "";
  let sendStatus = sendStatusNoEmail;

  if (contact) {
    const email = String(contact.email || "").trim();
    const surname1 = normalizeText(contact.surname1 || "");
    const surname2 = normalizeText(contact.surname2 || "");

    // AXX-1085: la falta de correo, o un correo mal formado, no invalida la fila.
    if (email && isValidEmail(email)) {
      contactEmail = email;
      sendStatus = sendStatusWithEmail;
    }

    if (surname1 === "NO DISPONIBLE" || surname2 === "NO DISPONIBLE") {
      errors.push("El apellido del cliente figura como NO DISPONIBLE.");
    }
  }

  if (errors.length) {
    invalidRows.push({ fila: sourceRow.fila, poliza: policyCode, errores: errors });
    return;
  }

  outputRows.push([
    templateName,
    currentUser,
    policyCode,
    Number(contact.id || policy.holderId || 0),
    getContactGivenNames(contact),
    getContactSurnames(contact),
    vehicle.brand,
    vehicle.plate,
    contactEmail,
    sendStatus,
    contactEmail ? "email1" : "",
    renderMessage(templateBody, {
      tipoPlantilla: templateName,
      usuario: currentUser,
      poliza: policyCode,
      cliente: getContactGivenNames(contact),
      apellidos: getContactSurnames(contact),
      marca: vehicle.brand,
      placa: vehicle.plate
    })
  ]);
});

const validCount = outputRows.length - 1;
const invalidCount = invalidRows.length;
const noEmailCount = outputRows.slice(1).filter(function (row) {
  return row[9] === sendStatusNoEmail;
}).length;

return {
  outData: outputRows,
  outDataAux: invalidRows,
  validCount: validCount,
  invalidCount: invalidCount,
  noEmailCount: noEmailCount,
  msg: "Prevalidación finalizada: " + validCount + " válidas ("
    + noEmailCount + " sin correo) y " + invalidCount + " no válidas.",
  ok: validCount > 0
};

function extractPolicyRows(rows) {
  if (!rows.length) return [];

  if (!Array.isArray(rows[0])) {
    return rows.map(function (row, index) {
      return { fila: index + 2, poliza: row && row.poliza };
    });
  }

  const header = rows[0].map(function (value) {
    return normalizeText(value).toLowerCase();
  });
  const policyIndex = header.indexOf("poliza");
  if (policyIndex < 0) return [];

  return rows.slice(1).map(function (row, index) {
    return {
      fila: index + 2,
      poliza: Array.isArray(row) ? row[policyIndex] : ""
    };
  }).filter(function (row) {
    return String(row.poliza || "").trim() !== "";
  });
}

function loadLatestPolicy(policyCode) {
  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "LifePolicy",
      fields: "id,code,holderId,active,created,policyVersion,originalPolicyId",
      filter: "[code] = N'" + escapeSql(policyCode) + "'",
      noTracking: true
    }
  });

  const policies = LoadEntities && Array.isArray(LoadEntities.outData)
    ? LoadEntities.outData.slice()
    : [];

  policies.sort(function (left, right) {
    const dateDifference = dateValue(right.created) - dateValue(left.created);
    if (dateDifference !== 0) return dateDifference;
    return Number(right.id || 0) - Number(left.id || 0);
  });

  return policies.length ? policies[0] : null;
}

function loadContact(contactId) {
  doCmd({
    cmd: "LoadEntity",
    data: {
      entity: "Contact",
      fields: "id,name,middlename,surname1,surname2,isPerson,email",
      filter: "id = " + Number(contactId),
      noTracking: true
    }
  });

  return LoadEntity && LoadEntity.outData ? LoadEntity.outData : null;
}

function loadVehicle(policyId, objectDefinitionId, catalogRows) {
  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "InsuredObject",
      fields: "id,lifePolicyId,objectDefinitionId,jValues",
      filter: "lifePolicyId = " + Number(policyId)
        + " AND objectDefinitionId = " + Number(objectDefinitionId),
      noTracking: true
    }
  });

  const objects = LoadEntities && Array.isArray(LoadEntities.outData)
    ? LoadEntities.outData.slice()
    : [];
  objects.sort(function (left, right) {
    return Number(right.id || 0) - Number(left.id || 0);
  });

  if (!objects.length) return { brand: "", plate: "" };

  const formValues = getFormValues(objects[0].jValues);
  const brandCode = formValues.cmbMarca || "";
  return {
    brand: getBrandName(brandCode, catalogRows),
    plate: String(formValues.tbplaca || "").trim()
  };
}

function getFormValues(rawValues) {
  let values = rawValues;

  try {
    if (typeof values === "string") values = JSON.parse(values);
  } catch (error) {
    return {};
  }

  if (!Array.isArray(values)) {
    return values && typeof values === "object" ? values : {};
  }

  const result = {};
  values.forEach(function (field) {
    if (!field || !field.name) return;
    if (Array.isArray(field.userData)) {
      result[field.name] = field.userData.length ? field.userData[0] : "";
    } else {
      result[field.name] = field.userData || "";
    }
  });
  return result;
}

function getBrandName(brandCode, rows) {
  const targetCode = String(brandCode || "").trim();
  if (!targetCode) return "";

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (Array.isArray(row)) {
      if (String(row[0] || "").trim() === targetCode) return String(row[1] || "").trim();
    } else if (row) {
      const code = row.NUMEROMARCA || row.numeromarca || row.code;
      const name = row.MARCA || row.marca || row.name;
      if (String(code || "").trim() === targetCode) return String(name || "").trim();
    }
  }

  return targetCode;
}

function getContactGivenNames(contact) {
  if (!contact) return "";
  if (contact.isPerson === false) return String(contact.name || contact.surname2 || "").trim();
  return [contact.name || "", contact.middlename || ""].join(" ").trim();
}

function getContactSurnames(contact) {
  if (!contact || contact.isPerson === false) return "";
  return [contact.surname1 || "", contact.surname2 || ""].join(" ").trim();
}

function normalizeText(value) {
  let text = String(value || "").trim().toUpperCase();
  if (typeof text.normalize === "function") {
    text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  return text.replace(/\s+/g, " ");
}

function dateValue(value) {
  const parsed = new Date(value || 0).getTime();
  return isNaN(parsed) ? 0 : parsed;
}

function renderMessage(body, renderContext) {
  if (!body) return "";

  doCmd({
    cmd: "RenderHtmlTemplate",
    data: {
      context: JSON.stringify(renderContext),
      template: body
    }
  });

  if (!RenderHtmlTemplate || RenderHtmlTemplate.ok === false || !RenderHtmlTemplate.outData) return "";
  return String(RenderHtmlTemplate.outData.result || "");
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function escapeSql(value) {
  return String(value || "").replace(/'/g, "''");
}
