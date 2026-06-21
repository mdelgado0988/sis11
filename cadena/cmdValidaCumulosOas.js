//block
//noreplace
/*
 * @author Axxis Systems
 * @created 2026/01/01
 * @name cmdValidaCumulosOas
 * @version 1.2
 * @summary Valida el cúmulo configurado para edificio o barriada según el contexto recibido.
 */

const input = normalizeContext(context);
const selection = resolveSelection(input);

if (!selection.ok) {
  return {
    ok: true,
    accion: "none",
    msg: "",
    bloquea: false
  };
}

const cumuloResult = loadCumuloConfig(input.lob, input.codeCumulo);
if (!cumuloResult.ok) {
  return {
    ok: false,
    accion: "none",
    msg: "No se pudo recuperar la configuración de cúmulo",
    bloquea: false
  };
}

const cumulo = cumuloResult.cumulo;
if (!cumulo) {
  return {
    ok: true,
    accion: "none",
    msg: "",
    bloquea: false
  };
}

const contrato = loadContract(cumulo);
if (!contrato) {
  return {
    ok: false,
    accion: cumulo.accion,
    msg: "No se pudo recuperar contrato de reaseguro",
    bloquea: cumulo.accion === "restriccion"
  };
}

const resultadoCumulo = loadCumuloByLocation({
  lob: input.lob,
  pais: input.pais,
  estado: input.estado,
  ciudad: input.ciudad,
  corregimiento: input.corregimiento,
  codigo: selection.codigo,
  campo: selection.campo,
  tipo: selection.tipo
});

if (!resultadoCumulo.ok) {
  return {
    ok: false,
    accion: cumulo.accion,
    msg: "No se pudo recuperar el cúmulo de la póliza",
    bloquea: cumulo.accion === "restriccion"
  };
}

const registro = resultadoCumulo.outData?.[0];
if (!registro) {
  return {
    ok: false,
    accion: cumulo.accion,
    msg: buildMessage({
      tipo: selection.tipo,
      descripcion: selection.descripcion,
      contrato,
      total: 0
    }),
    bloquea: cumulo.accion === "restriccion"
  };
}

const total = toNumber(registro.total);
return {
  ok: true,
  accion: cumulo.accion,
  msg: buildMessage({
    tipo: selection.tipo,
    descripcion: registro.descripcion || selection.descripcion,
    contrato,
    total
  }),
  bloquea: cumulo.accion === "restriccion" && cumulo.monto <= total
};

function normalizeContext(ctx) {
  return {
    lob: ctx?.lob ?? "",
    codeCumulo: ctx?.codeCumulo ?? "",
    pais: ctx?.pais ?? "",
    estado: ctx?.estado ?? "",
    ciudad: ctx?.ciudad ?? "",
    corregimiento: ctx?.corregimiento ?? "",
    codigoEdificio: cleanValue(ctx?.codigoEdificio),
    nombreEdificio: cleanValue(ctx?.nombreEdificio),
    codigoBarriada: cleanValue(ctx?.codigoBarriada),
    nombreBarriada: cleanValue(ctx?.nombreBarriada)
  };
}

function resolveSelection(inputData) {
  if (hasValue(inputData.codigoEdificio)) {
    return {
      ok: true,
      tipo: "edificio",
      campo: "cmbEdificios",
      codigo: inputData.codigoEdificio,
      descripcion: inputData.nombreEdificio || "No Tiene"
    };
  }

  if (hasValue(inputData.codigoBarriada)) {
    return {
      ok: true,
      tipo: "barriada",
      campo: "cmbBarriadas",
      codigo: inputData.codigoBarriada,
      descripcion: inputData.nombreBarriada || "No Tiene"
    };
  }

  return { ok: false };
}

function loadCumuloConfig(lob, codeCumulo) {
  doCmd({
    cmd: "GetFullTable",
    data: {
      table: "tblGestiondeCumulos"
    }
  });

  if (!GetFullTable.ok) {
    return {
      ok: false,
      cumulo: null
    };
  }

  const rows = Array.isArray(GetFullTable.outData) ? GetFullTable.outData : [];
  const cumulo = rows
    .slice(1)
    .map(item => ({
      lob: cleanValue(item?.[2]),
      contract: cleanValue(item?.[3]),
      code: cleanValue(item?.[4]),
      description: cleanValue(item?.[5]),
      monto: toNumber(item?.[6]),
      accion: String(item?.[7] || "").trim().toLowerCase(),
      estado: String(item?.[8] || "").trim().toLowerCase()
    }))
    .find(item =>
      item.estado === "v" &&
      item.lob === String(lob ?? "").trim() &&
      item.code === String(codeCumulo ?? "").trim()
    ) || null;

  return {
    ok: true,
    cumulo
  };
}

function loadContract(cumulo) {
  if (!cumulo?.contract) {
    return null;
  }

  doCmd({
    cmd: "GetContracts",
    data: {
      filter: `[code]='${escapeSql(cumulo.contract)}'`,
      size: 1
    }
  });

  return GetContracts.outData?.[0] || null;
}

function loadCumuloByLocation({ lob, pais, estado, ciudad, corregimiento, codigo, campo, tipo }) {
  const tableName = tipo === "barriada" ? "Barriadas" : "Edificios";
  const codeColumn = tipo === "barriada" ? "id" : "buildingCode";
  const descColumn = tipo === "barriada" ? "barrio" : "descBuilding";
  const fieldName = campo;

  const locationFilter = tipo === "barriada"
    ? `AND codeValue = '${escapeSql(codigo)}'`
    : `AND buildingCode = '${escapeSql(codigo)}'`;

  const sql = tipo === "barriada"
    ? `
WITH TargetLocation AS
(
    SELECT
        codeValue,
        descValue
    FROM [Table] t
    CROSS APPLY OPENJSON(t.data)
        WITH (
            codeValue varchar(50) '$[0]',
            descValue varchar(200) '$[3]'
        ) AS data
    WHERE t.[name] = '${tableName}'
      ${locationFilter}
)
SELECT
    tl.codeValue AS code,
    tl.descValue AS descripcion,
    SUM(pol.insuredSum) AS total,
    FORMAT(SUM(pol.insuredSum), '#,##0.00', 'en-US') AS cumulo
FROM LifePolicy pol
JOIN InsuredObject obj
    ON obj.lifePolicyId = pol.id
   AND obj.objectDefinitionId IN (19,45,46,47)
CROSS APPLY OPENJSON(obj.jValues)
    WITH (
        name varchar(50) '$.name',
        userData varchar(50) '$.userData[0]'
    ) field
JOIN TargetLocation tl
    ON field.userData = tl.codeValue
WHERE pol.lob = '${escapeSql(lob)}'
  AND pol.active = 1
  AND pol.activeDate IS NOT NULL
  AND field.name = '${fieldName}'
GROUP BY
    tl.codeValue,
    tl.descValue;`
    : `
WITH TargetLocation AS
(
    SELECT
        pais,
        estado,
        ciudad,
        corregimiento,
        buildingCode,
        descBuilding
    FROM [Table] t
    CROSS APPLY OPENJSON(t.data)
        WITH (
            pais varchar(50) '$[0]',
            estado varchar(50) '$[1]',
            ciudad varchar(50) '$[2]',
            corregimiento varchar(50) '$[3]',
            buildingCode varchar(50) '$[4]',
            descBuilding varchar(200) '$[5]'
        ) AS data
    WHERE t.[name] = '${tableName}'
      AND pais = '${escapeSql(pais)}'
      AND estado = '${escapeSql(estado)}'
      AND ciudad = '${escapeSql(ciudad)}'
      AND corregimiento = '${escapeSql(corregimiento)}'
      AND buildingCode = '${escapeSql(codigo)}'
)
SELECT
    tl.pais,
    tl.estado,
    tl.ciudad,
    tl.corregimiento,
    tl.buildingCode,
    tl.descBuilding AS descripcion,
    SUM(pol.insuredSum) AS total,
    FORMAT(SUM(pol.insuredSum), '#,##0.00', 'en-US') AS cumulo
FROM LifePolicy pol
JOIN InsuredObject obj
    ON obj.lifePolicyId = pol.id
   AND obj.objectDefinitionId IN (19,45,46,47)
CROSS APPLY OPENJSON(obj.jValues)
    WITH (
        name varchar(50) '$.name',
        userData varchar(50) '$.userData[0]'
    ) field
JOIN TargetLocation tl
    ON field.userData = tl.buildingCode
WHERE pol.lob = '${escapeSql(lob)}'
  AND pol.active = 1
  AND pol.activeDate IS NOT NULL
  AND field.name = '${fieldName}'
GROUP BY
    tl.pais,
    tl.estado,
    tl.ciudad,
    tl.corregimiento,
    tl.buildingCode,
    tl.descBuilding;`;

  doCmd({
    cmd: "DoQuery",
    data: { sql }
  });

  return {
    ok: !!DoQuery.ok,
    outData: Array.isArray(DoQuery.outData) ? DoQuery.outData : []
  };
}

function buildMessage({ tipo, descripcion, contrato, total }) {
  const label = tipo === "barriada" ? "barriada" : "edificio";
  return `Suma asegurada acumulada para ${label} ${descripcion || "No Tiene"} bajo contrato ${contrato.name} es de ${contrato.currency} ${formatMoney(total)}`;
}

function formatMoney(value) {
  return toNumber(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function cleanValue(value) {
  const text = String(value ?? "").trim();
  return text;
}

function hasValue(value) {
  const text = String(value ?? "").trim();
  return text !== "" && text !== "0";
}

function escapeSql(value) {
  return String(value ?? "").replace(/'/g, "''");
}

function toNumber(value) {
  const normalized = Number(String(value ?? 0).replace(/,/g, "").trim());
  return Number.isFinite(normalized) ? normalized : 0;
}
