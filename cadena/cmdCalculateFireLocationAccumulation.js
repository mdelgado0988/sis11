//block
//noreplace

/*
  *@name: cmdCalculateFireLocationAccumulation
  *@Purpose: Calculates fire location accumulation using the insured object and a direct query over the selected location.
  *@Author: Michael Delgado
  *@Created: 2026/07/07
  *@Input: { policyId }
  *@Output: { ok, msg, outData }
*/

let inicio = Date.now();

try {
  const policyId = validateInput(context);
  const policy = loadPolicyData(policyId);
  const fDesde = policy.start;
  const currency = policy.currency;
  const insuredSum = Number(policy.insuredSum ?? 0);
  const lob = Number(policy.lob ?? 0);

  const posicion = loadPolicyLocation(policyId);
  if (!posicion?.userData) {
    throw new Error("No se encontró un objeto asegurado válido para calcular el cúmulo");
  }

  const { cmbEdificios, cmbBarriadas } = posicion.userData;
  const cumulusField = hasValue(cmbEdificios) ? "cmbEdificios" : "cmbBarriadas";
  const fieldValue = hasValue(cmbEdificios) ? String(cmbEdificios) : String(cmbBarriadas);

  if (!hasValue(fieldValue)) {
    throw new Error("No se seleccionó edificio ni barriada");
  }

  const configuracionCumulo = loadConfiguracionCumulo(currency);
  if (!configuracionCumulo.length) {
    throw new Error("No se encontró configuración de cúmulo para la moneda y contrato indicados");
  }

  const limite = parseFloat(configuracionCumulo?.[0]?.capacity ?? 0);
  const currentYear = new Date(fDesde).getFullYear();
  const cumuloQuery = buildCumuloQuery(cumulusField, fieldValue, currentYear, currency, lob, posicion.objectDefinitionId);

  doCmd({
    cmd: "DoQuery",
    data: {
      sql: cumuloQuery
    }
  });

  if (!DoQuery?.ok) {
    throw new Error(DoQuery?.msg || "No fue posible ejecutar la consulta de cúmulo");
  }

  const rows = asArray(DoQuery?.outData);
  const cumuloTotal = rows.reduce((acc, row) => {
    const rowPolicyId = Number(row?.lifePolicyId ?? 0);
    if (rowPolicyId === policyId) {
      return acc;
    }

    return acc + Number(row?.insuredSum ?? 0);
  }, 0);

  const resto = cumuloTotal < limite ? limite - cumuloTotal : 0;
  const restoSum = insuredSum < resto ? insuredSum : resto;

  return {
    ok: true,
    msg: "Cúmulo calculado correctamente",
    limite: n2(limite),
    cumulo: n2(cumuloTotal),
    resto: n2(resto),
    restoSum: n2(restoSum),
    cumulusField,
    fieldValue,
  };
} catch (error) {
  return {
    ok: false,
    msg: error?.toString?.() || String(error),
    outData: {}
  };
}

function loadPolicyData(policyId) {
  doCmd({
    cmd: "LoadEntity",
    data: {
      entity: "LifePolicy",
      fields: "id, start, currency, insuredSum, lob",
      filter: `id = ${policyId}`,
      noTracking: true
    }
  });

  if (!LoadEntity?.ok) {
    throw new Error(LoadEntity?.msg || "No fue posible recuperar la poliza");
  }

  if (!LoadEntity?.outData) {
    throw new Error("No se encontro la poliza");
  }

  return LoadEntity.outData;
}

function loadPolicyLocation(policyId) {
  doCmd({
    cmd: "RepoInsuredObject",
    data: {
      operation: "GET",
      filter: `lifePolicyId = ${policyId}`,
      include: ["ObjectDefinition"]
    }
  });

  if (!RepoInsuredObject?.ok) {
    throw new Error(RepoInsuredObject?.msg || "No fue posible recuperar el objeto asegurado");
  }

  const definitions = ["DT_INCENDIO_V3", "1_9_DT_INCENDIO", "DTINCENDIO_SUMA"];
  const insuredObject = asArray(RepoInsuredObject?.outData).find(item =>
    definitions.includes(item?.ObjectDefinition?.code)
  );

  if (!insuredObject?.userData) {
    return null;
  }

  return {
    objectDefinitionId: insuredObject?.ObjectDefinition?.id ?? null,
    userData: insuredObject.userData
  };
}

function validateInput(source) {
  const policyId = Number(source?.policyId ?? 0);

  if (!isValidNumber(policyId)) {
    throw new Error("El policyId es requerido y debe ser valido");
  }

  return policyId;
}

function loadConfiguracionCumulo(currency) {
  doCmd({
    cmd: "GetFullTable",
    data: { table: "tblCapacidadEdificios" }
  });

  if (!GetFullTable?.ok) {
    throw new Error(GetFullTable?.msg || "Error leyendo configuracion de cumulo");
  }

  return mapearTablaConfig(GetFullTable.outData ?? [])
    .filter(x => String(x.currency ?? "").trim() === String(currency).trim());
}

function buildCumuloQuery(campo, valor, currentYear, currency, lob, objectDefinitionId) {
  return `
SELECT io.lifePolicyId, pol.code, JSON_VALUE(j.value, '$.name') AS name, JSON_VALUE(j.value, '$.userData[0]') AS value,
       f.[start], f.[end], pol.insuredSum
FROM insuredObject io
INNER JOIN LifePolicy pol ON pol.id = io.lifePolicyId
OUTER APPLY (
    SELECT
        TOP 1
        ISNULL(an.[start], pol.[start]) AS [start],
        ISNULL(an.anniversary, pol.[end]) AS [end]
    FROM Anniversary an
    WHERE an.lifePolicyId = pol.id
      AND an.entityState = 'EXECUTED'
      AND CAST(ISNULL(an.anniversary, pol.[end]) AS DATE) >= DATEFROMPARTS(${Number(currentYear)}, 1, 1)
      AND CAST(ISNULL(an.[start], pol.[start]) AS DATE) <= DATEFROMPARTS(${Number(currentYear)}, 12, 31)
    ORDER BY ISNULL(an.anniversary, pol.[end]) DESC, ISNULL(an.[start], pol.[start]) DESC, an.id DESC
) f
CROSS APPLY OPENJSON(
    CASE
        WHEN ISJSON(io.jValues) = 1 THEN io.jValues
        ELSE '[]'
    END
) j
WHERE io.objectDefinitionId = '${escapeSqlString(objectDefinitionId)}'
  AND pol.activeDate IS NOT NULL
  AND pol.active = 1
  AND pol.currency = '${escapeSqlString(currency)}'
  AND pol.lob = ${Number(lob)}
  AND JSON_VALUE(j.value, '$.name') = '${escapeSqlString(campo)}'
  AND JSON_VALUE(j.value, '$.userData[0]') = '${escapeSqlString(valor)}'
  AND f.[start] IS NOT NULL
  AND f.[end] IS NOT NULL`;
}

function mapearTablaConfig(data) {
  if (!Array.isArray(data) || !data.length) {
    return [];
  }

  const headersOriginal = data[0];
  const headers = [];
  const contador = {};

  headersOriginal.forEach(h => {
    const key = String(h ?? "").trim();

    if (contador[key]) {
      contador[key]++;
      headers.push(`${key}_${contador[key]}`);
    } else {
      contador[key] = 1;
      headers.push(key);
    }
  });

  return data.slice(1).map(row => {
    const obj = {};

    headers.forEach((col, i) => {
      obj[col] = row[i];
    });

    return obj;
  });
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasValue(value) {
  const text = String(value ?? "").trim();
  return text !== "" && text !== "0";
}

function isValidNumber(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

function escapeSqlString(value) {
  return String(value ?? "").replace(/'/g, "''");
}

function n2(value) {
  return Number(Number(value || 0).toFixed(2));
}
