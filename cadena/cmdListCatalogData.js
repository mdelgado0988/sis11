//block
//noreplace
/**
 * @chain    cmdListCatalogData
 * @category VIEW
 * @version  1.0.0
 * @purpose  Catálogos de las cargas masivas de una vista (botón «Ver Catálogos» de las vistas 63 CargaMasivaDeReclamos y
 *           64 CargaMasivaDeEmision). Lee las cargas (ImportConfig) que hoy tiene la categoría de la vista y devuelve, por
 *           carga, las columnas de su plantilla que la cadena de la carga valida contra una lista de valores.
 *           Sólo lectura. El registro de abajo dice, por cadena de carga, qué columna se valida contra qué catálogo; es lo
 *           mismo que valida esa cadena. Una carga nueva con otra cadena aparece sin catálogos hasta que se registre aquí.
 * @context  { category: "ReclamosMasivos" | "EmisionMasiva", resolve?: { importId, field } }
 *           resolve es para cmdListCatalogDataDetail: agrega la fuente del catálogo de esa columna.
 * @returns  { ok, msg, category, imports: [{ id, name, chain, known, catalogs: [{ field, column, name, parent }] }], source? }
 * @mission  MSN-000119 (globaluat) — 2026-10-30.
 * @mission  MSN-000146 (globaluat) — 2026-11-05: la columna «Reclamante» de las cargas de Desgravamen y Fraude se valida contra
 *           «Tipos de reclamante» (Afectado, Asegurado, Tercera Persona), como la de la carga genérica.
 */

const lcdCatalogs = {
  sucursales: { name: "Sucursales", kind: "sql", sql: "SELECT code, name FROM Branch" },
  sucursalesActivas: { name: "Sucursales activas", kind: "sql", sql: "SELECT code, name FROM Branch WHERE active = 1" },
  formasPagoEmision: { name: "Formas de pago de emisión", kind: "sql", sql: "SELECT code, name FROM PaymentMethodCatalog WHERE ISNULL(module, '') IN ('', 'ISSUANCE')" },
  formasPago: { name: "Formas de pago", kind: "sql", sql: "SELECT code, name FROM PaymentMethodCatalog" },
  paises: { name: "Países", kind: "sql", sql: "SELECT code, name FROM CountryCatalog" },
  provincias: { name: "Provincias de Panamá", kind: "sql", sql: "SELECT code, name FROM StateCatalog WHERE countryCode = '591'" },
  ciudades: { name: "Ciudades de Panamá", kind: "sql", parent: "Provincia",
    sql: "SELECT c.code, c.name, c.stateCode parentCode, (SELECT TOP 1 s.name FROM StateCatalog s WHERE s.code = c.stateCode AND s.countryCode = '591') parentName FROM CityCatalog c WHERE c.stateCode IN (SELECT code FROM StateCatalog WHERE countryCode = '591')" },
  ramos: { name: "Ramos", kind: "sql", sql: "SELECT code, name FROM Lob" },
  estadosReclamo: { name: "Estados del reclamo", kind: "sql", sql: "SELECT code, name FROM ClaimStage WHERE ISNULL(disabled, 0) = 0" },
  ajustadores: { name: "Ajustadores", kind: "sql",
    sql: "SELECT CAST(c.id AS varchar(20)) code, CASE WHEN c.isPerson = 0 THEN c.surname2 ELSE LTRIM(RTRIM(CONCAT(c.name, ' ', c.surname1))) END name FROM Contact c WHERE EXISTS (SELECT 1 FROM ContactRole r WHERE r.contactId = c.id AND r.role = 'ADJ')" },
  eventos: { name: "Eventos asegurados (causa)", kind: "events" },
  tiposPrestamo: { name: "Tipos de préstamo", kind: "table", table: "tbTipoPrestamoColectivo", code: "valor", label: "texto" },
  causasFallecimiento: { name: "Causas de fallecimiento", kind: "table", table: "tbCausaFallecimiento", code: "valor", label: "texto" },
  tiposPrestamoObjeto: { name: "Tipos de préstamo", kind: "form", objectCode: "DT_ACCIDENTES_V1", field: "cmbTipoPrestamo", exclude: ["option-1"] },
  tiposTarjeta: { name: "Tipos de tarjeta", kind: "form", formName: "frmOATarjetaFraude", field: "colTipoTarjeta" },
  tarjetahabiente: { name: "Tarjetahabiente", kind: "form", formName: "frmOATarjetaFraude", field: "colTarjetaHabiente" },
  tiposTransaccion: { name: "Tipos de transacción", kind: "form", formName: "frmOATarjetaFraude", field: "colTipoTransaccion" },
  lugaresSiniestro: { name: "Lugar del siniestro", kind: "form", formName: "frmOATarjetaFraude", field: "colLugarSiniestro" },
  tiposReclamante: { name: "Tipos de reclamante", kind: "list", values: [["Afectado", "Afectado"], ["Asegurado", "Asegurado"], ["Tercera Persona", "Tercera Persona"]] },
  responsables: { name: "Responsable del siniestro", kind: "list", values: [["A", "Asegurador"], ["P", "Pagador"], ["O", "Otro"]] },
  frecuenciasUnica: { name: "Frecuencias de pago del producto", kind: "periodicity", style: "unica" },
  frecuenciasAuto: { name: "Frecuencias de pago del producto", kind: "periodicity", style: "auto" },
  marcas: { name: "Marcas de vehículo", kind: "table", table: "tbMarcas", code: "cmarca", label: "xmarca", lobColumn: "cramo" },
  modelos: { name: "Modelos de vehículo", kind: "table", table: "tbModelos", code: "cmodelo", label: "xmodelo", lobColumn: "cramo", parent: "Marca",
    parentOf: { column: "cmarca", table: "tbMarcas", code: "cmarca", label: "xmarca", lobColumn: "cramo" } },
  tiposVehiculo: { name: "Tipos de vehículo", kind: "table", table: "tblTipoPorRamo", code: "ctipo", label: "xtipo", lobColumn: "cramo" },
  usosVehiculo: { name: "Usos del vehículo", kind: "table", table: "tblUsoPorRamo", code: "cagrupa", label: "xdescripcion_l", lobColumn: "cramo" },
  transmisiones: { name: "Transmisión", kind: "form", objectCode: "DTAUT", field: "txtTransmision" },
  cilindros: { name: "Cilindros", kind: "form", objectCode: "DTAUT", field: "cmbCilindrosAuto" },
  combustibles: { name: "Combustible", kind: "form", objectCode: "DTAUT", field: "cmbCombustibleAuto" },
  limite12: { name: "Límites de la cobertura 12", kind: "tariff", coverage: "12", tariffField: "Limite" },
  limite13: { name: "Límites de la cobertura 13", kind: "tariff", coverage: "13", tariffField: "Limite" },
  limite14: { name: "Límites de la cobertura 14", kind: "tariff", coverage: "14", tariffField: "Limite" }
};

// Por cadena de operación de la carga: columna de la plantilla (clave de jMappings) → catálogo contra el que la valida.
const lcdUnica = { sucursal: "sucursales", frecuenciaPago: "frecuenciasUnica", formaPago: "formasPagoEmision", tipoPrestamo: "tiposPrestamoObjeto" };
const lcdAuto = { sucursal: "sucursalesActivas", frecuenciaPago: "frecuenciasAuto", formaPago: "formasPago", marca: "marcas", modelo: "modelos",
  tipo: "tiposVehiculo", usoVehiculo: "usosVehiculo", transmision: "transmisiones", cilindros: "cilindros", combustible: "combustibles" };
const lcdLoads = {
  cmdImportUnicaClasica: { product: "UNICA_CLA", columns: lcdUnica },
  cmdImportUnicaPremium: { product: "UNICA_PLA", columns: lcdUnica },
  cmdImportClaimMassiveDesgravamen: { columns: { reclamante: "tiposReclamante", ajustador: "ajustadores", causa: "eventos", provincia: "provincias", ciudad: "ciudades",
    tipoPrestamo: "tiposPrestamo", clasificacionF: "causasFallecimiento" } },
  cmdImportMassiveClaimFraude: { columns: { reclamante: "tiposReclamante", ajustador: "ajustadores", causa: "eventos", provincia: "provincias", ciudad: "ciudades",
    tipoTrajeta: "tiposTarjeta", tarjetaHabitante: "tarjetahabiente", tipoTransaccion: "tiposTransaccion", lugarSiniestro: "lugaresSiniestro" } },
  cmdImportClaimMassiveGeneric: { columns: { statSin: "estadosReclamo", usuario: "tiposReclamante", responsable: "responsables", cdgocaus: "eventos",
    cdgosucu: "sucursales", cdgoramo: "ramos", ajustador: "ajustadores", cdgoPais: "paises", cdgoest1: "provincias", cdgociu1: "ciudades" } },
  cmdImportMassiveAutoIlocalizada: { product: "IL", columns: Object.assign({ cob12Ctarifa: "limite12", cob13Ctarifa: "limite13", cob14Ctarifa: "limite14" }, lcdAuto) },
  cmdImportMassiveAutoSOAT: { product: "SOAT", columns: lcdAuto }
};

const lcdArgs = typeof context === "string" ? JSON.parse(context || "{}") : (context || {});

try {
  const category = String(lcdArgs.category || "").trim();
  if (!/^[A-Za-z0-9]{1,60}$/.test(category)) return { ok: false, msg: "Indique la categoría de cargas de la vista." };

  doCmd({ cmd: "RepoImportConfig", data: { operation: "GET", filter: "category = '" + category + "'", size: 500 } });
  if (!RepoImportConfig.ok) return { ok: false, msg: "No se pudieron leer las cargas de la categoría " + category + ": " + RepoImportConfig.msg };
  const configs = lcdRows(RepoImportConfig.outData).filter(c => c && c.category === category);

  const operationIds = [];
  configs.forEach(c => { const id = Number(c.operation); if (id > 0 && operationIds.indexOf(id) < 0) operationIds.push(id); });
  const chainNames = {};
  if (operationIds.length) lcdQuery("SELECT id, name FROM Chain WHERE id IN (" + operationIds.join(",") + ")").forEach(c => { chainNames[Number(c.id)] = String(c.name || "").trim(); });

  const imports = configs.map(c => {
    const chain = chainNames[Number(c.operation)] || "";
    const load = lcdLoads[chain];
    const catalogs = [];
    if (load) {
      lcdMappings(c.jMappings).forEach(m => {
        const key = load.columns[m.field];
        const def = key ? lcdCatalogs[key] : null;
        if (def && !catalogs.some(x => x.field === m.field)) catalogs.push({ field: m.field, column: m.column, name: def.name, parent: def.parent || null, key: key });
      });
    }
    return { id: Number(c.id || c.Id), name: String(c.name || "").trim(), chain: chain, product: load && load.product || null, known: !!load, catalogs: catalogs };
  }).sort((a, b) => a.id - b.id);

  const out = { ok: true, msg: imports.length + " carga(s) en " + category + ".", category: category, imports: imports.map(i => ({
    id: i.id, name: i.name, chain: i.chain, known: i.known,
    catalogs: i.catalogs.map(x => ({ field: x.field, column: x.column, name: x.name, parent: x.parent }))
  })) };

  if (lcdArgs.resolve) {
    const importId = Number(lcdArgs.resolve.importId);
    const field = String(lcdArgs.resolve.field || "");
    const load = imports.find(i => i.id === importId);
    if (!load) return { ok: false, msg: "La carga " + lcdArgs.resolve.importId + " no está disponible en " + category + "." };
    const hit = load.catalogs.find(x => x.field === field);
    if (!hit) return { ok: false, msg: "La columna " + field + " de la carga «" + load.name + "» no tiene un catálogo registrado." };
    const source = JSON.parse(JSON.stringify(lcdCatalogs[hit.key]));
    source.key = hit.key;
    if (load.product) {
      source.product = load.product;
      const products = lcdQuery("SELECT TOP 1 lobCode FROM Product WHERE code = N'" + load.product.replace(/'/g, "''") + "'");
      source.lob = products.length ? String(products[0].lobCode || "").trim() : "";
    }
    out.source = source;
    out.catalog = { importId: load.id, importName: load.name, field: hit.field, column: hit.column, name: hit.name, parent: hit.parent };
  }
  return out;
} catch (e) {
  return { ok: false, msg: "No se pudieron listar los catálogos: " + String(e && e.message || e) };
}

function lcdRows(value) {
  const data = JSON.parse(JSON.stringify(value || []));
  return Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
}

function lcdQuery(sql) {
  doCmd({ cmd: "DoQuery", data: { sql: sql } });
  if (!DoQuery.ok) throw new Error(DoQuery.msg || "error de consulta");
  return JSON.parse(JSON.stringify(DoQuery.outData || []));
}

function lcdMappings(value) {
  let list = value;
  if (typeof list === "string") { try { list = JSON.parse(list); } catch (e) { list = []; } }
  return (Array.isArray(list) ? list : []).filter(m => Array.isArray(m) && m.length >= 3 && m[2])
    .map(m => ({ column: String(m[0] || m[2]).trim(), field: String(m[2]).trim() }));
}
