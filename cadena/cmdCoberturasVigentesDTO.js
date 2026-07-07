//block
//noreplace

/*
 * @author Michael Delgado
 * @email michael.delgado@axxis.com
 * @created 2026/01/26
 * @name cmdCoberturasVigentesDTO
 * @version 1.0
 * @Purpose Build DTO for SIS11 integration with current active coverages.
 * @Input { i_poliza }
 * @Output { ok, msg, outData }
 */

try {
  const policyCode = getTrimmedString(context?.i_poliza);

  if (!policyCode) {
    return fail("La poliza es requerida");
  }

  const coverages = loadActivePolicyCoverages(policyCode);

  if (!coverages.length) {
    return fail("Ninguna cobertura recuperada para la poliza seleccionada");
  }

  return {
    ok: true,
    msg: "DTO generado correctamente",
    outData: coverages
  };
} catch (error) {
  return fail(error?.toString?.() || String(error));
}

function loadActivePolicyCoverages(policyCode) {
  const queryAnniversaryVigente = `
    AND EXISTS (
      SELECT 1
      FROM Anniversary a
      WHERE a.LifePolicyId = LifePolicy.id
        AND a.anniversary >= CAST(GETDATE() AS DATE)
        AND a.[start] <= CAST(GETDATE() AS DATE)
    )
  `;

  doCmd({
    cmd: "RepoLifePolicy",
    data: {
      operation: "GET",
      include: ["Coverages"],
      filter: `code = '${escapeSqlString(policyCode)}' AND active = 1 ${queryAnniversaryVigente}`
    }
  });

  if (!RepoLifePolicy?.ok) {
    throw new Error(RepoLifePolicy?.msg || "Error recuperando datos de las coberturas");
  }

  const policies = asArray(RepoLifePolicy?.outData);
  return policies.flatMap(policy => {
    const coverages = asArray(policy?.Coverages);
    return coverages.map(coverage => ({
      nombreCobertura: getCoverageName(coverage),
      deducible: round2(coverage?.deductible ?? 0),
      sumaAsegurada: round2(coverage?.limit ?? 0)
    }));
  });
}

function getCoverageName(coverage) {
  return String(coverage?.name ?? coverage?.description ?? "").trim();
}

function getTrimmedString(value) {
  return String(value ?? "").trim();
}

function escapeSqlString(value) {
  return String(value ?? "").replace(/'/g, "''");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function round2(value) {
  return Number(Number(value || 0).toFixed(2));
}

function fail(message) {
  return {
    ok: false,
    msg: message,
    outData: []
  };
}
