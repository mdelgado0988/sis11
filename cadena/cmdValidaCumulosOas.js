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

const registros = Array.isArray(resultadoCumulo.outData)
  ? resultadoCumulo.outData
  : [];
if (!registros.length) {
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

const total = registros.reduce((sum, item) => sum + toNumber(item.policyTotal || item.total), 0);
return {
  ok: true,
  accion: cumulo.accion,
  msg: buildMessage({
    tipo: selection.tipo,
    descripcion: registros[0].descripcion || selection.descripcion,
    contrato,
    total
  }),
  total,
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

  const policyLocationFilter = tipo === "barriada"
    ? `EXISTS (
        SELECT 1
        FROM InsuredObject objLocation
        CROSS APPLY OPENJSON(objLocation.jValues)
            WITH (
                name varchar(50) '$.name',
                userData varchar(50) '$.userData[0]'
            ) AS locationField
        WHERE objLocation.lifePolicyId = pol.id
          AND objLocation.objectDefinitionId IN (19,45,46,47)
          AND locationField.name = '${fieldName}'
          AND EXISTS (
              SELECT 1
              FROM [Table] locationTable
              CROSS APPLY OPENJSON(locationTable.data)
                  WITH (codeValue varchar(50) '$[0]') AS locationData
              WHERE locationTable.[name] = '${tableName}'
                AND locationData.codeValue = locationField.userData
                AND locationData.codeValue = '${escapeSql(codigo)}'
          )
    )`
    : `EXISTS (
        SELECT 1
        FROM InsuredObject objLocation
        CROSS APPLY OPENJSON(objLocation.jValues)
            WITH (
                name varchar(50) '$.name',
                userData varchar(50) '$.userData[0]'
            ) AS locationField
        WHERE objLocation.lifePolicyId = pol.id
          AND objLocation.objectDefinitionId IN (19,45,46,47)
          AND locationField.name = '${fieldName}'
          AND EXISTS (
              SELECT 1
              FROM [Table] locationTable
              CROSS APPLY OPENJSON(locationTable.data)
                  WITH (
                      pais varchar(50) '$[0]',
                      estado varchar(50) '$[1]',
                      ciudad varchar(50) '$[2]',
                      corregimiento varchar(50) '$[3]',
                      buildingCode varchar(50) '$[4]'
                  ) AS locationData
              WHERE locationTable.[name] = '${tableName}'
                AND locationData.pais = '${escapeSql(pais)}'
                AND locationData.estado = '${escapeSql(estado)}'
                AND locationData.ciudad = '${escapeSql(ciudad)}'
                AND locationData.corregimiento = '${escapeSql(corregimiento)}'
                AND locationData.buildingCode = locationField.userData
                AND locationData.buildingCode = '${escapeSql(codigo)}'
          )
    )`;

  const sql = tipo === "barriada"
    ? `
WITH CoverageConfig AS
(
    SELECT DISTINCT
        cfgRow.lobCode,
        cfgRow.productCode,
        cfgRow.coverageCode
    FROM [Table] cfg
    CROSS APPLY OPENJSON(cfg.data)
        WITH (
            lobCode varchar(50) '$[0]',
            productCode varchar(100) '$[1]',
            coverageCode varchar(50) '$[3]',
            isCoverage varchar(20) '$[5]'
        ) AS cfgRow
    WHERE cfg.[name] = 'cfgCoberturaProductoRea'
      AND UPPER(LTRIM(RTRIM(cfgRow.isCoverage))) = 'SI'
),
CoverageTotals AS
(
    SELECT
        pol.id AS lifePolicyId,
        SUM(ISNULL(cov.limit, 0)) AS insuredSum
    FROM LifePolicy pol
    JOIN LifeCoverage cov
        ON cov.lifePolicyId = pol.id
    JOIN CoverageConfig cfg
        ON cfg.lobCode = CONVERT(varchar(50), pol.lob)
       AND cfg.productCode = pol.productCode
       AND cfg.coverageCode = CONVERT(varchar(50), cov.code)
    WHERE pol.lob = '${escapeSql(lob)}'
      AND pol.active = 1
      AND pol.activeDate IS NOT NULL
      AND ${policyLocationFilter}
    GROUP BY pol.id
),
TargetLocation AS
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
    pol.id AS policyId,
    pol.code AS policyCode,
    coverageTotal.insuredSum AS policyTotal,
    SUM(coverageTotal.insuredSum) OVER () AS total,
    FORMAT(SUM(coverageTotal.insuredSum) OVER (), '#,##0.00', 'en-US') AS cumulo
FROM LifePolicy pol
JOIN CoverageTotals coverageTotal
    ON coverageTotal.lifePolicyId = pol.id
CROSS JOIN TargetLocation tl
WHERE pol.lob = '${escapeSql(lob)}'
  AND pol.active = 1
  AND pol.activeDate IS NOT NULL
GROUP BY
    tl.codeValue,
    tl.descValue,
    pol.id,
    pol.code,
    coverageTotal.insuredSum;`
    : `
WITH CoverageConfig AS
(
    SELECT DISTINCT
        cfgRow.lobCode,
        cfgRow.productCode,
        cfgRow.coverageCode
    FROM [Table] cfg
    CROSS APPLY OPENJSON(cfg.data)
        WITH (
            lobCode varchar(50) '$[0]',
            productCode varchar(100) '$[1]',
            coverageCode varchar(50) '$[3]',
            isCoverage varchar(20) '$[5]'
        ) AS cfgRow
    WHERE cfg.[name] = 'cfgCoberturaProductoRea'
      AND UPPER(LTRIM(RTRIM(cfgRow.isCoverage))) = 'SI'
),
CoverageTotals AS
(
    SELECT
        pol.id AS lifePolicyId,
        SUM(ISNULL(cov.limit, 0)) AS insuredSum
    FROM LifePolicy pol
    JOIN LifeCoverage cov
        ON cov.lifePolicyId = pol.id
    JOIN CoverageConfig cfg
        ON cfg.lobCode = CONVERT(varchar(50), pol.lob)
       AND cfg.productCode = pol.productCode
       AND cfg.coverageCode = CONVERT(varchar(50), cov.code)
    WHERE pol.lob = '${escapeSql(lob)}'
      AND pol.active = 1
      AND pol.activeDate IS NOT NULL
      AND ${policyLocationFilter}
    GROUP BY pol.id
),
TargetLocation AS
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
    pol.id AS policyId,
    pol.code AS policyCode,
    coverageTotal.insuredSum AS policyTotal,
    SUM(coverageTotal.insuredSum) OVER () AS total,
    FORMAT(SUM(coverageTotal.insuredSum) OVER (), '#,##0.00', 'en-US') AS cumulo
FROM LifePolicy pol
JOIN CoverageTotals coverageTotal
    ON coverageTotal.lifePolicyId = pol.id
CROSS JOIN TargetLocation tl
WHERE pol.lob = '${escapeSql(lob)}'
  AND pol.active = 1
  AND pol.activeDate IS NOT NULL
GROUP BY
    tl.pais,
    tl.estado,
    tl.ciudad,
    tl.corregimiento,
    tl.buildingCode,
    tl.descBuilding,
    pol.id,
    pol.code,
    coverageTotal.insuredSum;`;

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
