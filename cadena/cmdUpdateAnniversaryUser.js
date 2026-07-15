//block
//noreplace
/**
 * Name: cmdUpdateAnniversaryUser
 * Author: Michael Delgado
 * Email: michael.delgado@axxis-systems.com
 * Created: 2026-07-14
 * Version: 1.0
 * Purpose: Recovers the process linked to an anniversary and updates Proceso.Usuario with the batch user.
 * Input: { anniversaryId }
 * Output: { ok, msg }
 */

try {
  const anniversaryId = toValidNumber(context?.anniversaryId);

  if (anniversaryId <= 0) {
    return {
      ok: false,
      msg: "El identificador de aniversario es requerido."
    };
  }

  const anniversary = getAnniversary(anniversaryId);
  if (!anniversary) {
    return {
      ok: false,
      msg: `No se encontró el aniversario ${anniversaryId}.`
    };
  }

  const processId = toValidNumber(anniversary.processId);
  if (processId <= 0) {
    return {
      ok: false,
      msg: `El aniversario ${anniversaryId} no tiene proceso asociado.`
    };
  }

  const batchRow = getBatchByAnniversary(anniversaryId);
  if (!batchRow) {
    return {
      ok: false,
      msg: `No se encontró un lote asociado al aniversario ${anniversaryId}.`
    };
  }

  const batchUser = getBatchUser(batchRow);
  if (!batchUser) {
    return {
      ok: false,
      msg: `No se pudo recuperar el usuario del lote asociado al aniversario ${anniversaryId}.`
    };
  }

  const updateResult = updateProcessUser(processId, batchUser);
  if (!updateResult?.ok) {
    return {
      ok: false,
      msg: updateResult?.msg || `No fue posible actualizar el usuario del proceso ${processId}.`
    };
  }

  return {
    ok: true,
    msg: "Usuario del proceso actualizado correctamente."
  };
} catch (error) {
  return {
    ok: false,
    msg: error?.message || error?.toString?.() || String(error)
  };
}

function getAnniversary(anniversaryId) {
  doCmd({
    cmd: "LoadEntity",
    data: {
      entity: "Anniversary",
      fields: "id,processId",
      filter: `id = ${anniversaryId}`,
      noTracking: true
    }
  });

  if (!LoadEntity?.ok) {
    return null;
  }

  return LoadEntity?.outData ?? null;
}

function getBatchByAnniversary(anniversaryId) {
  doCmd({
    cmd: "DoQuery",
    data: {
      sql: buildBatchSearchSql(anniversaryId)
    }
  });

  if (!DoQuery?.ok) {
    return null;
  }

  return Array.isArray(DoQuery?.outData) ? DoQuery.outData[0] : null;
}

function buildBatchSearchSql(anniversaryId) {
  return `
SELECT TOP 1 b.id, b.user
FROM [Batch] b
CROSS APPLY OPENJSON(
  CASE
    WHEN ISJSON(b.jData) = 1 THEN b.jData
    ELSE '[]'
  END
) j
WHERE TRY_CAST(JSON_VALUE(j.value, '$[0]') AS INT) = ${anniversaryId}
ORDER BY b.id DESC;
`;
}

function updateProcessUser(processId, userEmail) {
  doCmd({
    cmd: "SetField",
    data: {
      entity: "Proceso",
      entityId: processId,
      fieldValue: `[Usuario]='${escapeSqlString(userEmail)}'`
    }
  });

  if (!SetField?.ok) {
    return {
      ok: false,
      msg: SetField?.msg || `No fue posible actualizar el usuario del proceso ${processId}.`
    };
  }

  return {
    ok: true,
    msg: SetField?.msg || "Proceso actualizado correctamente."
  };
}

function getBatchUser(batchRow) {
  return getTrimmedString(batchRow?.user);
}

function toValidNumber(value) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getTrimmedString(value) {
  return String(value ?? "").trim();
}

function escapeSqlString(value) {
  return String(value ?? "").replace(/'/g, "''");
}

/*
  @test
  { anniversaryId: 12345 }
*/
