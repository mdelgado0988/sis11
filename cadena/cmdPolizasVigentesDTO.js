//block
//noreplace

/*
 * @author Michael Delgado
 * @email michael.delgado@axxis.com
 * @created 2026/01/26
 * @name cmdPolizasVigentesDTO
 * @version 1.0
 * @Purpose Build DTO for SIS11 integration using the current contact and their active policies.
 * @Input { cedula, operacion }
 * @Output { ok, msg, outData }
 */

try {
  const cedula = getTrimmedString(context?.cedula);
  const operacion = getTrimmedString(context?.operacion).toUpperCase();
  const isBaseOperation = operacion === "BASE";

  if (!cedula) {
    return fail("La cedula es requerida");
  }

  if (!operacion) {
    return fail("La operacion es requerida");
  }

  if (!["BASE", "FULL"].includes(operacion)) {
    return fail("La operación no es correcta. Valores permitidos: BASE o FULL");
  }

  const contact = loadOneEntity(
    "Contact",
    "id",
    `cnp = '${escapeSqlString(cedula)}'`
  );

  if (!contact?.id) {
    return fail("Contacto no encontrado en la base de datos");
  }

  const policies = loadActivePolicies(Number(contact.id));

  if (!policies.length) {
    return fail("Ninguna poliza recuperada para el contacto solicitado");
  }

  const dto = isBaseOperation
    ? buildBaseDto(policies)
    : buildFullDto(policies);

  return {
    ok: true,
    msg: "DTO generado correctamente",
    outData: dto
  };
} catch (error) {
  return fail(error?.toString?.() || String(error));
}

function loadActivePolicies(contactId) {
  const queryAnniversaryVigente = `
    AND EXISTS (
      SELECT 1
      FROM Anniversary a
      WHERE a.lifePolicyId = LifePolicy.id
        AND a.anniversary >= CAST(GETDATE() AS DATE)
        AND a.[start] <= CAST(GETDATE() AS DATE)
    )
  `;

  doCmd({
    cmd: "RepoLifePolicy",
    data: {
      operation: "GET",
      include: ["Lob", "Anniversaries", "PayPlan"],
      filter: `holderId = ${contactId} AND active = 1 ${queryAnniversaryVigente}`
    }
  });

  if (!RepoLifePolicy?.ok) {
    throw new Error(RepoLifePolicy?.msg || "Error recuperando datos de las polizas");
  }

  return asArray(RepoLifePolicy?.outData);
}

function buildBaseDto(policies) {
  return policies.map(policy => ({
    Familia: "SEGUROS",
    Producto: "200",
    SubProducto: getPolicyLobCode(policy),
    Cuenta: policy?.code || "",
    Moneda: 0,
    Titularidad: "",
    rol: ""
  }));
}

function buildFullDto(policies) {
  const rows = policies.flatMap(policy => {
    const anniversaries = asArray(policy?.Anniversaries);
    const payPlans = asArray(policy?.PayPlan);

    return anniversaries.map(ann => {
      const contractYear = Number(ann?.contractYear ?? 0);
      const payPlansForAnn = payPlans.filter(pp => Number(pp?.contractYear ?? 0) === contractYear);

      const montoPagado = round2(
        payPlansForAnn.reduce((sum, pp) => sum + Number(pp?.payed ?? 0), 0)
      );

      const montoPrima = round2(
        payPlansForAnn.reduce((sum, pp) => sum + Number(pp?.minimum ?? 0), 0)
      );

      return {
        Familia: "SEGUROS",
        Producto: "200",
        SubProducto: getPolicyLobCode(policy),
        Cuenta: policy?.code || "",
        Moneda: 0,
        Titularidad: "",
        rol: "",
        FechaInicio: ann?.start ? toSqlDateTime(ann.start) : null,
        FechaFin: ann?.anniversary ? toSqlDateTime(ann.anniversary) : null,
        PrimaAnual: montoPrima,
        SaldoPrima: round2(montoPrima - montoPagado),
        MontoPagado: montoPagado,
        flagDisponibilidad: "S"
      };
    });
  });

  if (rows.length) {
    return rows;
  }

  return [{
    Familia: "SEGUROS",
    Producto: "200",
    SubProducto: "",
    Cuenta: "",
    Moneda: 0,
    Titularidad: "",
    rol: "",
    FechaInicio: "01/02/1900",
    FechaFin: "01/02/1900",
    PrimaAnual: 0,
    SaldoPrima: 0,
    MontoPagado: 0,
    flagDisponibilidad: "S"
  }];
}

function loadOneEntity(entity, fields, filter) {
  doCmd({
    cmd: "LoadEntity",
    data: {
      entity,
      fields,
      filter,
      noTracking: true
    }
  });

  if (!LoadEntity?.ok) {
    throw new Error(LoadEntity?.msg || `Error recuperando ${entity}`);
  }

  return LoadEntity?.outData ?? null;
}

function fail(message) {
  return {
    ok: false,
    msg: message,
    outData: []
  };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function getTrimmedString(value) {
  return String(value ?? "").trim();
}

function round2(value) {
  return Number(Number(value || 0).toFixed(2));
}

function escapeSqlString(value) {
  return String(value ?? "").replace(/'/g, "''");
}

function getPolicyLobCode(policy) {
  return String(policy?.Lob?.code ?? policy?.lob ?? "").trim();
}

function toSqlDateTime(fecha) {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(d.getTime())) {
    return null;
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  const milliseconds = String(d.getMilliseconds()).padStart(3, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

/*
test:
cedula: 77-7777-77777
operacion: "FULL"
 */
