//block
//noreplace

/*
  *Name cmdRedistribuyeReaseguroEndoso
  *Author: Michael Delgado
  *Creation date: 2024-06-17
  *Description: Este comando se encarga de redistribuir el reaseguro de una póliza cuando se realiza un endoso. Se utiliza para mantener la distribución de reaseguro actualizada y consistente con los cambios realizados en la póliza.
  *Email: michael.delgado@axxis-systems.com
  *Version: 1.0
*/

const CESSION_COLUMNS = [
  "contractId",
  "lifePolicyId",
  "coverageId",
  "lineId",
  "cover",
  "LoB",
  "product",
  "policyCode",
  "start",
  "end",
  "msg",
  "sumInsured",
  "premium",
  "premiumType",
  "sumInsuredCedant",
  "premiumCedant",
  "comissionCedant",
  "sumInsuredRe",
  "premiumRe",
  "err",
  "holderName",
  "proportionCed",
  "proportionRe",
  "currency",
  "distributionMode",
  "contactId",
  "coverageCode",
  "coCommission",
  "coPercentage",
  "coPremium",
  "coSumInsured",
  "np",
  "overwritten",
  "changeId",
  "anniversaryId",
  "reserve",
  "oldContractId",
  "edited",
  "loading",
  "loadingCedant",
  "loadingRe",
  "sumInsuredComputed",
  "fee",
  "tax",
  "nonTechnicalPremium",
  "credit",
  "jAmounts",
  "comissionCedantExtra"
];

const CESSION_PART_COLUMNS = [
  "cessionId",
  "contactId",
  "lineId",
  "split",
  "sumInsured",
  "premium",
  "name",
  "liquidationId",
  "currency",
  "commission",
  "tax",
  "brokerId",
  "reserve",
  "fee"
];

//////////////////////////////////////////////////////////////////
// Cuerpo principal del comando
//////////////////////////////////////////////////////////////////

const changeId = context?.changeId ?? 0;
const policyId = getPolicyId(changeId);

if(policyId == 0)
  return endStatment(false, `Póliza no encontrada`);

//distribucion => Es la distribución guardada en el formulario del DT
const distribucion = getOARea();

if (!Array.isArray(distribucion)) 
  return distribucion;

if(distribucion.length == 0)
  return endStatment(true, `No existe distribución de reaseguro para la póliza`);

const policyRea = getPolicyRea();

if(policyRea.length == 0)
  throw new Error("La póliza no tiene reaseguro que redistribuir");

const deboRedistribuir = validateRedistribution(policyRea, distribucion);

if(!deboRedistribuir.debo)
  return;

const newDistribution = distribuyeContrato(policyRea, distribucion);

//return newDistribution;
syncCessions(policyId, newDistribution);

return endStatment(true, `Reaseguro distribuido correctamente`);

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////

//Distribuyo contrato de la póliza según el registrado en el OA.
function distribuyeContrato(policyRea, distribucion) {

  try {   

    const contractIds = [...new Set(distribucion.map(x => x.contractId))];
    let newCessions = [];

    for (let contract of contractIds) {

      const distribucionContract = distribucion.filter(x => x.contractId == contract);
      
      const tieneRET = distribucionContract.find(x => x.lineId.toUpperCase() == "RET") ? true : false;
      const tieneCP = distribucionContract.find(x => x.lineId.toUpperCase() == "CUOTA PARTE") ? true : false;
      const tieneFAC = distribucionContract.find(x => x.lineId.toUpperCase() == "FAC") ? true : false;
      const tieneFRO = distribucionContract.find(x => x.lineId.toUpperCase() == "FRO") ? true : false;

      newCessions = JSON.parse(JSON.stringify(policyRea.filter(x => x.contractId == contract)));

      //Primero busco los contratos que no existan y los creo
      log("Creando nuevas líneas");
      for (let ces of distribucionContract) {

        let polCes = newCessions.find(x => x.lineId == ces.lineId && x.coverageCode == ces.coverageCode);
        if(!polCes){
          polCes = construyeNuevaDistribucion(policyRea, ces.lineId, ces.coverageCode);
          newCessions.push(polCes);
        }   

      }
    
      //Se borran las líneas donde no se haya distribuido el contrato
      log("validando líneas no existentes");
      if(!tieneRET && !tieneCP)
        newCessions = newCessions.filter(item => item.lineId.trim().toUpperCase() !== "CUOTA PARTE");
     
      if(!tieneFAC)
        newCessions = newCessions.filter(item => item.lineId.trim().toUpperCase() !== "FAC");
      
      if(!tieneFRO)
        newCessions = newCessions.filter(item => item.lineId.trim().toUpperCase() !== "FRO");

      for (let ces of distribucionContract) {

        log(`Validando línea ${ces.lineId} > cob: ${ces.coverageCode}`);
        let polCes = newCessions.find(x => x.lineId == ces.lineId && x.coverageCode == ces.coverageCode);
        if(!polCes) continue;

        polCes.id = 0; //para registrarlo
        //policyCession.sumInsured
        //policyCession.premium

        //No tecnica
        const proporcionNoTecnica = redondear(ces.premium == 0 ? 0 : ces.nonTechnicalPremium / ces.premium,8);
        polCes.nonTechnicalPremium = redondear(proporcionNoTecnica * polCes.premium);

        //ret
        polCes.sumInsuredCedant = redondear(polCes.sumInsured * ces.proportionCed);
        polCes.premiumCedant = redondear((polCes.premium - polCes.nonTechnicalPremium) * ces.proportionCed);
        polCes.proportionCed = ces.proportionCed;

        //CED        
        polCes.sumInsuredRe = redondear(polCes.sumInsured * ces.proportionRe);
        polCes.premiumRe = redondear((polCes.premium - polCes.nonTechnicalPremium) * ces.proportionRe);
        polCes.proportionRe = ces.proportionRe;
        
        const proporcionComision = ces.premiumRe == 0 ? 0 : (ces.comissionCedant / ces.premiumRe);
        polCes.comissionCedant = redondear(proporcionComision * polCes.premiumRe);
        polCes.comissionCedantExtra = polCes.comissionCedant

        const proporcionImp = ces.premiumRe == 0 ? 0 : (ces.tax / ces.premiumRe);
        polCes.tax = redondear(proporcionImp * polCes.tax);                

         //Ajustamos suma
        const diffSuma = redondear(polCes.sumInsured - redondear(polCes.sumInsuredCedant + polCes.sumInsuredRe));
        if(diffSuma != 0)
          polCes.sumInsuredCedant += diffSuma;
  
        //Ajustamos prima
        const diffPrima = redondear((polCes.premium - polCes.nonTechnicalPremium) - redondear(polCes.premiumRe + polCes.premiumCedant));
        if(diffPrima != 0)
          polCes.premiumCedant += diffPrima;

        //Asigno Participantes para redistribuir luego
        polCes.Participants = JSON.parse(JSON.stringify(ces.Participants));        
        
      }    
   
    }

    distribuyeAceptantes(newCessions);
              
    return newCessions ?? [];
    
  } catch (error) {
    return error.toString();
  }
}

//Distribuyo aceptantes de la póliza según el registrado en el OA
function distribuyeAceptantes(newCessions) {

  // =========================
  // Participantes
  // =========================

  newCessions.forEach(ces => {

    let totalSumInsured = 0;
    let totalPremium = 0;
    let totalCommission = 0;
  
    // 1. Calcular valores
    ces.Participants.forEach(p => {
      p.id = 0;
      p.cessionId = 0;
  
      p.sumInsured = redondear((p.split / 100) * ces.sumInsuredRe);
      p.premium = redondear((p.split / 100) * ces.premiumRe);
      p.commission = redondear((p.split / 100) * ces.comissionCedant);
  
      totalSumInsured += p.sumInsured;
      totalPremium += p.premium;
      totalCommission += p.commission;
    });
  
    // 2. Diferencias
    const diffSI = redondear(ces.sumInsuredRe - totalSumInsured);
    const diffPr = redondear(ces.premiumRe - totalPremium);
    const diffCo = redondear(ces.comissionCedant - totalCommission);
  
    // 3. Ajuste en el primer registro
    if (ces.Participants.length > 0) {
      ces.Participants[0].sumInsured += diffSI;
      ces.Participants[0].premium += diffPr;
      ces.Participants[0].commission += diffCo;
    }
  
  });
  
}

//Creo nuevas líneas en caso de ser necesario, por si hay líneas registradas manualmente en la emisión.
function construyeNuevaDistribucion(policyRea, contrato, coverageCode) {

  if(policyRea.length == 0)
    throw new Error("No hay distribución de reaseguro");

  const base = policyRea[0];  
  log(`Nueva línea ${contrato} > cob: ${coverageCode}`)
  const copia = policyRea.find(x => x.coverageCode == coverageCode);

  if(!copia)
    throw new Error("No hay distribución de reaseguro");

  let resultado = JSON.parse(JSON.stringify(copia));

  resultado.lineId = contrato;     
  return resultado;
  
}

function syncCessions(policyId, newCessions) {
  const ordenadas = [...newCessions].sort((a, b) => {

    const getPrioridad = (lineId) => {
      const val = (lineId || "").trim().toUpperCase();

      if (val === "FAC" || val === "FRO") return 1; // últimos
      return 0; // primero
    };

    return getPrioridad(a.lineId) - getPrioridad(b.lineId);
  });

  const sql = buildCessionSyncSql(policyId, ordenadas);

  doCmd({ cmd: "DoQuery", data: { sql } });
  if (!DoQuery.ok) {
    throw new Error(DoQuery.msg);
  }
}

//Valida si debo redistribuir, en caso de no, no hago nada mas
function validateRedistribution(policyRea, distribucion) {
  let deboRedistribuir = { debo: false, causa: "" };

  for (let distOA of distribucion) {

    //busco si existe 
    const distPol = policyRea.find(x => x.contractId == distOA.contractId && x.lineId == distOA.lineId && x.coverageCode == distOA.coverageCode);
    if(!distPol){
      deboRedistribuir = { debo: true, causa: `No existe la línea ${distOA.lineId} y la cobertura: ${distOA.coverageCode}` };
      break;
    }      
    
    //Valido %
    if(distOA.proportionCed != distPol.proportionCed){
      deboRedistribuir = { debo: true, causa: `El % RET es diferente ${distOA.proportionCed}<>${distPol.proportionCed}` };
      break;
    }

    if(distOA.proportionRe != distPol.proportionRe){
      deboRedistribuir = { debo: true, causa: `El % CED es diferente ${distOA.proportionRe}<>${distPol.proportionRe}` };
      break;
    }
    
    //Valido aceptantes
    for (let partOA of distOA.Participants) {

      //valido existencia
      const partPol = distPol.Participants.find(x => x.contactId == partOA.contactId)
      if(!partPol){
        deboRedistribuir = { debo: true, causa: `No el participante ${partOA.contactId}` };
        break;
      }  

      //valido %
      if(partPol.split != partOA.spli){
        deboRedistribuir = { debo: true, causa: `El % del participante es diferente ${partOA.split}<>${partPol.split}` };
        break;
      } 
      
    }
    
  }
  return deboRedistribuir
}

//Obtiene el reaseguro registrado en el objeto asegurado (Manual)
function getOARea() {
  doCmd({cmd: "RepoObjectDefinition", data: { operation: "GET", filter:"code = 'DISTREA'"}});
  const objectDefinitionId = RepoObjectDefinition.outData?.[0]?.id ?? 0;
  
  if(objectDefinitionId == 0)
    return endStatment(false, `No existe definición de objeto para la distribución de reaseguro`);
  
  doCmd({cmd:"LoadEntity", data:{ entity: "InsuredObject", filter: `lifePolicyId = ${policyId} AND objectDefinitionId = ${objectDefinitionId}`, noTracking: true }});
  const distReaConfig = LoadEntity.outData?.jValues ? JSON.parse(LoadEntity.outData?.jValues) : [];
  
  if(distReaConfig.length == 0)
    return endStatment(true, `No existe distribución de reaseguro para la póliza`);
  
  const configRea = distReaConfig.find(x => x.name == "hiddenDistribucionReaseguro")?.userData?.[0];
  const distribucion = configRea ? JSON.parse(configRea) : [];
  return distribucion;
}

//Obtiene reaseguro actual de la póliza, según el endoso
function getPolicyRea() {
  doCmd({ cmd: "LoadEntities", data: { entity: "Cession", filter: `lifePolicyId = ${policyId} AND overwritten = 0`, noTracking: true } });
  const policyRea = LoadEntities.outData ?? [];
  const cessionIds = [...new Set(policyRea.map(x => x?.id).filter(isValidNumber))];

  if (!cessionIds.length) {
    return policyRea;
  }

  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "CessionPart",
      filter: `cessionId IN (${cessionIds.join(",")})`,
      noTracking: true
    }
  });

  const participants = LoadEntities.outData ?? [];
  const participantsByCessionId = participants.reduce((acc, item) => {
    const cessionId = Number(item?.cessionId);
    if (!Number.isFinite(cessionId)) {
      return acc;
    }

    if (!acc[cessionId]) {
      acc[cessionId] = [];
    }

    acc[cessionId].push(item);
    return acc;
  }, {});

  return policyRea.map(cession => ({
    ...cession,
    Participants: participantsByCessionId[cession.id] ?? []
  }));
}

//Obtengo el id de la póliza
function getPolicyId(changeId) {
  doCmd({cmd: "LoadEntity", data: { entity: "Change", fields: "lifePolicyId", filter: `id = ${changeId}`, noTracking: true }});
  return LoadEntity.outData?.lifePolicyId ?? 0;
}

function endStatment(ok, msg) {
  return { ok: ok, msg: msg };
}

function redondear(valor, decimales = 2) {
    if (valor === null || valor === undefined) return 0;

    // Convertir a string y eliminar comas (formato de miles)
    let strValor = String(valor).replace(/,/g, '');

    // Convertir a número
    let num = parseFloat(strValor);

    // Si no es un número válido, devolver 0
    if (isNaN(num)) return 0;

    // Redondeo a los decimales indicados
    const factor = Math.pow(10, decimales);
    return Math.round((num + Number.EPSILON) * factor) / factor;
}

function isValidNumber(value) {
  return value !== null && value !== undefined && value !== "" && !Number.isNaN(Number(value));
}

function buildInsertSql(tableName, entity, excludeKeys = []) {
  const excluded = new Set([...(Array.isArray(excludeKeys) ? excludeKeys : []), "Participants"]);
  const formatValue = (value) => {
    if (value === null || value === undefined) return "NULL";
    if (value instanceof Date) return `'${value.toISOString().replace("T", " ").substring(0, 19)}'`;
    if (Array.isArray(value)) return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    if (typeof value === "boolean") return value ? 1 : 0;
    if (typeof value === "string") return `'${value.replace(/'/g, "''")}'`;
    if (typeof value === "number") return Number.isFinite(value) ? value : "NULL";
    if (typeof value === "object") return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    return `'${String(value).replace(/'/g, "''")}'`;
  };

  const entries = Object.entries(entity || {})
    .filter(([key, value]) => !excluded.has(key) && value !== undefined && typeof value !== "function")

  const fields = entries.map(([key]) => `[${key}]`);
  const values = entries.map(([_, value]) => formatValue(value));

  return `
    INSERT INTO [${tableName}] (${fields.join(", ")})
    VALUES (${values.join(", ")});
  `;
}

function sqlLiteral(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "string" && value.startsWith("@")) return value;
  if (value instanceof Date) return `'${value.toISOString().replace("T", " ").substring(0, 19)}'`;
  if (Array.isArray(value)) return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : "NULL";
  if (typeof value === "object") return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  return `'${String(value).replace(/'/g, "''")}'`;
}

function buildCessionSyncSql(policyId, cessions) {
  const statements = [];

  statements.push(`
    DELETE p
    FROM CessionPart p
    WHERE p.cessionId IN (
      SELECT c.id
      FROM Cession c
      WHERE c.lifePolicyId = ${policyId}
        AND c.overwritten = 0
    );

    DELETE c
    FROM Cession c
    WHERE c.lifePolicyId = ${policyId}
      AND c.overwritten = 0;
  `);

  cessions.forEach((cession, index) => {
    const participants = Array.isArray(cession.Participants) ? cession.Participants : [];
    const cessionEntity = buildCessionEntity(cession);
    const cessionValues = CESSION_COLUMNS.map(col => sqlLiteral(cessionEntity[col]));
    const cessionVar = `@CessionId_${index + 1}`;

    statements.push(`
      DECLARE ${cessionVar} INT;
      INSERT INTO Cession (${CESSION_COLUMNS.map(col => `[${col}]`).join(", ")})
      VALUES (${cessionValues.join(", ")});
      SET ${cessionVar} = SCOPE_IDENTITY();`);

    for (const participant of participants) {
      const participantEntity = buildCessionPartEntity(participant, cessionVar);
      const participantValues = CESSION_PART_COLUMNS.map(col => sqlLiteral(participantEntity[col]));

      statements.push(`
      INSERT INTO CessionPart (${CESSION_PART_COLUMNS.map(col => `[${col}]`).join(", ")})
      VALUES (${participantValues.join(", ")});`);
    }
  });

  return statements.join("\n");
}

function buildCessionEntity(cession) {
  return {
    contractId: cession?.contractId ?? null,
    lifePolicyId: cession?.lifePolicyId ?? null,
    coverageId: cession?.coverageId ?? null,
    lineId: cession?.lineId ?? null,
    cover: cession?.cover ?? null,
    LoB: cession?.LoB ?? cession?.lob ?? null,
    product: cession?.product ?? null,
    policyCode: cession?.policyCode ?? null,
    start: cession?.start ?? null,
    end: cession?.end ?? null,
    msg: cession?.msg ?? null,
    sumInsured: cession?.sumInsured ?? null,
    premium: cession?.premium ?? null,
    premiumType: cession?.premiumType ?? null,
    sumInsuredCedant: cession?.sumInsuredCedant ?? null,
    premiumCedant: cession?.premiumCedant ?? null,
    comissionCedant: cession?.comissionCedant ?? null,
    sumInsuredRe: cession?.sumInsuredRe ?? null,
    premiumRe: cession?.premiumRe ?? null,
    err: cession?.err ?? null,
    holderName: cession?.holderName ?? null,
    proportionCed: cession?.proportionCed ?? null,
    proportionRe: cession?.proportionRe ?? null,
    currency: cession?.currency ?? null,
    distributionMode: cession?.distributionMode ?? null,
    contactId: cession?.contactId ?? null,
    coverageCode: cession?.coverageCode ?? null,
    coCommission: cession?.coCommission ?? null,
    coPercentage: cession?.coPercentage ?? null,
    coPremium: cession?.coPremium ?? null,
    coSumInsured: cession?.coSumInsured ?? null,
    np: cession?.np ?? null,
    overwritten: cession?.overwritten ?? null,
    changeId: cession?.changeId ?? null,
    anniversaryId: cession?.anniversaryId ?? null,
    reserve: cession?.reserve ?? null,
    oldContractId: cession?.oldContractId ?? null,
    edited: cession?.edited ?? null,
    loading: cession?.loading ?? null,
    loadingCedant: cession?.loadingCedant ?? null,
    loadingRe: cession?.loadingRe ?? null,
    sumInsuredComputed: cession?.sumInsuredComputed ?? null,
    fee: cession?.fee ?? null,
    tax: cession?.tax ?? null,
    nonTechnicalPremium: cession?.nonTechnicalPremium ?? null,
    credit: cession?.credit ?? null,
    jAmounts: cession?.jAmounts ?? null,
    comissionCedantExtra: cession?.comissionCedantExtra ?? null
  };
}

function buildCessionPartEntity(participant, cessionId) {
  return {
    cessionId: cessionId,
    contactId: participant?.contactId ?? null,
    lineId: participant?.lineId ?? null,
    split: participant?.split ?? null,
    sumInsured: participant?.sumInsured ?? null,
    premium: participant?.premium ?? null,
    name: participant?.name ?? null,
    liquidationId: participant?.liquidationId ?? null,
    currency: participant?.currency ?? null,
    commission: participant?.commission ?? null,
    tax: participant?.tax ?? null,
    brokerId: participant?.brokerId ?? participant?.Broker?.id ?? null,
    reserve: participant?.reserve ?? null,
    fee: participant?.fee ?? null
  };
}
