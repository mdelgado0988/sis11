///////////////////////////////////////////////////////////
/// Variables y configuraciones globales
///////////////////////////////////////////////////////////

//Informacion de creacion y autoria del formulario
/*
  *Name: frmDistribucionReaseguro
  *Description: Gestiona la distribucion de reaseguro de una poliza de vida: porcentajes, sumas, primas, comisiones e impuestos por contrato (Cuota Parte, Facultativo, Coaseguro) y sus aceptantes.
  *Inputs: policyId (segmento 5 de la URL, validado como entero); entidades LifePolicy, Cession, CessionPart, LifeCoverage, Contact; tabla cfgCoberturaProductoRea.
  *Output: sin retorno; persiste Cession/CessionPart via comandos Repo* y actualiza la UI.
  *Side effects: elimina y reinserta las cesiones no sobrescritas de la poliza al guardar.
  *Author: Michael Delgado
  *Modificado: Jose Luis Romero
  *Fecha de creacion: 01/04/2026
*/

var me = this;
let cessions = [];
let coverages = [];
let contracts = [];
let config = [];
let policy = {};
let gridData = [];
let gridDataSelected = null;
let gridSelectedIndex = null;
let selectedCoverageCode = null;
let coCessions = [];
let contractId = 0;
let tipoContratoSelected = "";
let tipoPrimaSelected = "";
let lineasCoberturasExpandida = new Set();
let aceptantesTabEnabled = false;
let coaseguradoresTabEnabled = false;
let distributionDirty = false;
// Moneda de la poliza (tomada de las cesiones); define los decimales de los montos
let monedaPoliza = "";


// ===== Datos de prueba =====
let aceptantes = [
  { id: 1, nombre: "Reaseguradora A" }
];

let brokers = [];

let reaseguradoresData = [
  { name: "CONTEMPORA", contactId: 4939, lineId: "Cuota Parte", cessionId: 101, split: 30, sumInsured: 10000, premium: 500, commission: 50, tax: 25, brokerId: null, Broker: null }
];
let coaseguradoresData = [];
let coaseguradores = [];
const distribuciones = ["CUOTA PARTE", "FAC", "COASEGURO"];

// Filtro actual del grid de Reaseguradores: "ALL" | "PRINCIPAL" | <brokerId>
let filtroBrokerSeleccionado = "ALL";

const filasControles = [
  [
    { tipo: "label", nombre: "Contrato", id: "lblcontrato" },
    { tipo: "label", nombre: "Porcentaje (%)", id: "lblPorcentaje" },
    { tipo: "label", nombre: "Suma", id: "lblSuma" },
    { tipo: "label", nombre: "Prima", id: "lblPrima" },
    { tipo: "label", nombre: "% Comisión", id: "lblPorcentajeComision" },
    { tipo: "label", nombre: "Comisión", id: "lblComision" },
    { tipo: "label", nombre: "% Impuesto", id: "lblPorcentajeImpuesto" },
    { tipo: "label", nombre: "Impuesto", id: "lblImpuesto" },
    { tipo: "label", nombre: "Saldo Rea.", id: "lblSaldoRea" }
  ],
  [
    { tipo: "label", nombre: "Retención", id: "lblRetencion" },
    { tipo: "percent8", nombre: "", id: "pret", valor: 0 },
    { tipo: "number2", nombre: "", id: "msret", valor: 0 },
    { tipo: "number2", nombre: "", id: "mpret", valor: 0 },
    { tipo: "percent8", nombre: "", id: "pcret", valor: 0, readonly: true },
    { tipo: "number2", nombre: "", id: "mcret", valor: 0, readonly: true },
    { tipo: "percent8", nombre: "", id: "piret", valor: 0, readonly: true },
    { tipo: "number2", nombre: "", id: "miret", valor: 0, readonly: true },
    { tipo: "number2", nombre: "", id: "srret", valor: 0, readonly: true }
  ],
  [
    { tipo: "label", nombre: "Cuota Parte", id: "lblCuotaParte", tieneAceptante: true, contrato: "Cuota Parte" },
    { tipo: "percent8", nombre: "", id: "pcp", valor: 0 },
    { tipo: "number2", nombre: "", id: "mscp", valor: 0 },
    { tipo: "number2", nombre: "", id: "mpcp", valor: 0 },
    { tipo: "percent8", nombre: "", id: "pccp", valor: 0 },
    { tipo: "number2", nombre: "", id: "mccp", valor: 0 },
    { tipo: "percent8", nombre: "", id: "picp", valor: 0 },
    { tipo: "number2", nombre: "", id: "micp", valor: 0 },
    { tipo: "number2", nombre: "", id: "srcp", valor: 0, readonly: true }
  ],
  [
    { tipo: "label", nombre: "Facultativo", id: "lblFacultativo", tieneAceptante: true, contrato: "FAC" },
    { tipo: "percent8", nombre: "", id: "pfp", valor: 0 },
    { tipo: "number2", nombre: "", id: "msfp", valor: 0 },
    { tipo: "number2", nombre: "", id: "mpfp", valor: 0 },
    { tipo: "percent8", nombre: "", id: "pcfp", valor: 0 },
    { tipo: "number2", nombre: "", id: "mcfp", valor: 0 },
    { tipo: "percent8", nombre: "", id: "pifp", valor: 0 },
    { tipo: "number2", nombre: "", id: "mifp", valor: 0 },
    { tipo: "number2", nombre: "", id: "srfp", valor: 0, readonly: true }
  ],
  [
    { tipo: "label", nombre: "Coaseguro", id: "lblCoaseguro", contrato: "COASEGURO" },
    { tipo: "percent8", nombre: "", id: "pco", valor: 0, readonly: true },
    { tipo: "number2", nombre: "", id: "msco", valor: 0, readonly: true },
    { tipo: "number2", nombre: "", id: "mpco", valor: 0, readonly: true },
    { tipo: "percent8", nombre: "", id: "pcco", valor: 0, readonly: true },
    { tipo: "number2", nombre: "", id: "mcco", valor: 0, readonly: true },
    { tipo: "percent8", nombre: "", id: "pico", valor: 0, readonly: true },
    { tipo: "number2", nombre: "", id: "mico", valor: 0, readonly: true },
    { tipo: "number2", nombre: "", id: "srco", valor: 0, readonly: true }
  ],
  [
    { tipo: "label", nombre: "Totales", id: "lblTotal" },
    { tipo: "percent8", nombre: "", id: "tp", valor: 0, readonly: true, clase: "input-verde-negrita" },
    { tipo: "number2", nombre: "", id: "tms", valor: 0, readonly: true, clase: "input-verde-negrita" },
    { tipo: "number2", nombre: "", id: "tmp", valor: 0, readonly: true, clase: "input-verde-negrita" },
    { tipo: "percent8", nombre: "", id: "tpc", valor: 0, readonly: true, clase: "input-verde-negrita" },
    { tipo: "number2", nombre: "", id: "tmc", valor: 0, readonly: true, clase: "input-verde-negrita" },
    { tipo: "percent8", nombre: "", id: "tpi", valor: 0, readonly: true, clase: "input-verde-negrita" },
    { tipo: "number2", nombre: "", id: "tmi", valor: 0, readonly: true, clase: "input-verde-negrita" },
    { tipo: "number2", nombre: "", id: "tsr", valor: 0, readonly: true, clase: "input-verde-negrita" }
  ]
];

const relaciones = [
  { porcentajeId: "pret", montoId: "mpret", sumaId: "msret" },
  { porcentajeId: "pcp", montoId: "mpcp", sumaId: "mscp", comisionId: "mccp", pcomisionId: "pccp", montoCalculoId: "mpcp", pimpuestoId: "picp", montoImpuestoId: "micp", saldoRea: "srcp" },
  { porcentajeId: "pfp", montoId: "mpfp", sumaId: "msfp", comisionId: "mcfp", pcomisionId: "pcfp", montoCalculoId: "mpfp", pimpuestoId: "pifp", montoImpuestoId: "mifp", saldoRea: "srfp" },
  { porcentajeId: "pco", montoId: "mpco", sumaId: "msco", comisionId: "mcco", pcomisionId: "pcco", montoCalculoId: "mpco", pimpuestoId: "pico", montoImpuestoId: "mico", saldoRea: "srco" },
  { porcentajeId: "pccp", montoId: "mccp", sumaId: "", montoCalculoId: "mpcp", saldoRea: "srcp" },
  { porcentajeId: "picp", montoId: "micp", sumaId: "", montoCalculoId: "mpcp" },
  { porcentajeId: "pcfp", montoId: "mcfp", sumaId: "", montoCalculoId: "mpfp", saldoRea: "srfp" },
  { porcentajeId: "pifp", montoId: "mifp", sumaId: "", montoCalculoId: "mpfp" },
  { porcentajeId: "pcco", montoId: "mcco", sumaId: "", montoCalculoId: "mpco", saldoRea: "srco" },
  { porcentajeId: "pico", montoId: "mico", sumaId: "", montoCalculoId: "mpco" }
];

// Creamos un mapa para acceso rpido por id
const relacionesMap = {};

relaciones.forEach(r => {
    relacionesMap[r.porcentajeId] = {
       montoId: r.montoId, sumaId: r.sumaId, comisionId: r.comisionId,
       pcomisionId: r.pcomisionId, montoCalculoId: r.montoCalculoId,
       pimpuestoId: r.pimpuestoId, montoImpuestoId: r.montoImpuestoId , saldoRea: r.saldoRea
      };
});

// policyId se interpola en sentencias SQL: se valida como entero para
// evitar inyeccion desde la URL.
let policyId = parseInt(window.location.href.split('/')[5], 10) || 175970;
policyId = policyId == 150 ? 175970 : policyId;

const TIPO_MOVIMIENTO_ES = {
  ANNIVERSARY: "Renovación",
  CANCELLATION: "Cancelación",
  CHANGE: "Endoso",
  NEW: "Nuevo",
  REVERT: "Reversión"
};

///////////////////////////////////////////////////////////
/// Principales
///////////////////////////////////////////////////////////

async function saveChanges() {
  showLoading("Actualizando...");
  await new Promise(resolve => setTimeout(resolve, 0));
  try {
    return await saveChangesCore();
  } catch (error) {
    mostrarNotificacion(`Error guardando cambios: ${error?.msg || error}`, "error");
  } finally {
    hideLoading();
  }
}

async function saveChangesCore() {

  //Validar totales distribuidos
  const valida = validaTotales();
  if(!valida) return;

  const cessionOrder = new Map();
  cessions.forEach((item, index) => {
    const key = getCessionOrderKey(item);
    if (!cessionOrder.has(key)) cessionOrder.set(key, index);
  });

  const contractIdToUpdate = Number(contractId);
  if (!Number.isFinite(contractIdToUpdate)) {
    mostrarNotificacion("Debe seleccionar un contrato antes de actualizar la distribución.", "warning");
    return;
  }

  //Actualizar montos al contrato existente en caso que exista 
  let newCessions = distribuyeContrato();
  const cessionsToSave = newCessions.filter(item =>
    item.__source !== "COASEGURO" &&
    item.contractId == contractIdToUpdate && matchesSelectedCoverage(item)
  );

  let resultado = await cleanCessions(contractIdToUpdate);
  if(!resultado.ok){
    mostrarNotificacion(`Error en la creación del reaseguro, contacte a sistemas: ${resultado.msg}` , "warning");
    return;
  }    

  resultado = await addCessions(cessionsToSave);
  if(resultado.isOk){        
    const selectedRowKey = gridData[gridSelectedIndex]?._key;
    const selectedCoverageToRestore = selectedCoverageCode;
    mostrarNotificacion(`Distribución de reaseguro guardada satisfactoriamente` , "success");
    distributionDirty = false;
    syncAceptantesTabState();

    // El repositorio es la fuente de verdad despues de guardar. Esto evita
    // perder una fila si la respuesta de ADD no devuelve la cesion completa.
    await loadCessions();
    cessions = sortCessionsByOrder(cessions, cessionOrder);
    gridData = mapCessionsToGrid(cessions);
    preserveDistribution();
    gridSelectedIndex = gridData.findIndex(row => row._key === selectedRowKey);
    cargarDataGrid();
    if (gridSelectedIndex >= 0) {
      $(`#gridDistribucionBody tr[data-index="${gridSelectedIndex}"]`).trigger("click");

      if (selectedCoverageToRestore !== null && selectedCoverageToRestore !== undefined) {
        const $coverageRow = $(`#gridDistribucionBody tr.grid-coberturas-row[data-parent-key="${selectedRowKey}"] .grid-cobertura-name`).filter(function () {
          return String($(this).data("coverage-code")) === String(selectedCoverageToRestore);
        }).closest(".grid-cobertura-row-item");

        if ($coverageRow.length) $coverageRow.trigger("click");
      }
    }
  }
            
}

function getCessionOrderKey(cession) {
  return [
    cession?.contractId ?? "",
    cession?.changeId ?? 0,
    normalizeCondition(TIPO_MOVIMIENTO_ES[cession?.premiumType] || cession?.premiumType),
    normalizeCondition(cession?.lineId),
    String(cession?.coverageCode ?? "")
  ].join("|");
}

function sortCessionsByOrder(items, orderMap) {
  return (items || [])
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const orderA = orderMap.get(getCessionOrderKey(a.item));
      const orderB = orderMap.get(getCessionOrderKey(b.item));
      const positionA = orderA === undefined ? Number.MAX_SAFE_INTEGER : orderA;
      const positionB = orderB === undefined ? Number.MAX_SAFE_INTEGER : orderB;
      return positionA - positionB || a.index - b.index;
    })
    .map(entry => entry.item);
}

function sqlNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(8) : "0";
}

function sqlNullableNumber(value) {
  if (value === null || value === undefined || value === "") return "NULL";
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(8) : "NULL";
}

function sqlBit(value) {
  return value ? "1" : "0";
}

async function saveCoCessionsSql(updatedCessions, participants = null) {
  const sources = Array.isArray(coCessions) ? coCessions.filter(Boolean) : [];
  const participantRows = Array.isArray(participants) ? participants : null;
  if (!sources.length && (!participantRows || participantRows.length === 0)) return { ok: true };

  const coLines = (updatedCessions || []).filter(item =>
    normalizeCondition(item.lineId) === "COASEGURO"
  );

  const targetPercentage = redondear(
    numeroDe($("#pco").val()) || coLines.reduce((max, line) => Math.max(max, numeroDe(line.proportionRe) * 100), 0),
    5,
    true
  );
  const commissionPercentage = numeroDe($("#pcco").val());
  const taxPercentage = numeroDe($("#pico").val());
  const globalBase = getCoaseguroGlobalBase();
  const defaultSource = {
    sumInsured: globalBase.sumInsured,
    premium: globalBase.premium,
    currency: monedaPoliza || policy?.currency || "",
    liquidationId: null,
    paidOnCollection: false,
    brokerCommission: 0,
    changeId: null,
    overwritten: false,
    allocationId: null,
    brokerId: null
  };
  const sourcePercentageTotal = sources.reduce((total, source) => total + numeroDe(source.percentage), 0);
  const sourceBase = sourcePercentageTotal > 0 ? sourcePercentageTotal : sources.length;
  const rowsToInsert = participantRows || sources;
  const percentagesToInsert = rowsToInsert.map((row, index) => {
    if (participantRows) return redondear(numeroDe(row.split), 2, true);
    const source = row;
    const share = sourcePercentageTotal > 0
      ? numeroDe(source.percentage) / sourcePercentageTotal
      : 1 / sourceBase;
    return redondear(targetPercentage * share, 2, true);
  });
  if (!participantRows && percentagesToInsert.length > 0) {
    const totalRoundedPercentage = percentagesToInsert.reduce((total, value) => total + value, 0);
    const percentageDifference = redondear(targetPercentage - totalRoundedPercentage, 2, true);
    percentagesToInsert[percentagesToInsert.length - 1] = redondear(
      percentagesToInsert[percentagesToInsert.length - 1] + percentageDifference,
      2,
      true
    );
  }

  const inserts = (participantRows ? rowsToInsert.length > 0 : targetPercentage > 0)
    ? rowsToInsert.map((row, index) => {
        const source = participantRows
          ? (sources.find(item => Number(item.id) === Number(row.cessionId) || Number(item.contactId) === Number(row.contactId)) || defaultSource)
          : row;
        const percentage = percentagesToInsert[index];
        const sumInsuredCeded = participantRows
          ? redondearMonto(row.sumInsured)
          : redondearMonto(numeroDe(source.sumInsured) * percentage / 100);
        const premiumCeded = participantRows
          ? redondearMonto(row.premium)
          : redondearMonto(numeroDe(source.premium) * percentage / 100);
        const commission = participantRows
          ? redondearMonto(row.commission)
          : redondearMonto(premiumCeded * commissionPercentage / 100);
        const tax = participantRows
          ? redondearMonto(row.tax)
          : redondearMonto(premiumCeded * taxPercentage / 100);

        const leaderValue = participantRows
          ? (row.leader === true || Number(row.leader) === 1 || String(row.leader).toLowerCase() === "true")
          : (source.leader === true || Number(source.leader) === 1 || String(source.leader).toLowerCase() === "true");
        return `INSERT INTO CoCession (lifePolicyId, contactId, sumInsured, premium, sumInsuredCeded, premiumCeded, commission, percentage, created, leader, currency, liquidationId, paidOnCollection, parentCoCession, brokerCommission, tax, changeId, overwritten, allocationId, lifeCoverageId, brokerId) VALUES (${policyId}, ${parseInt(row.contactId ?? source.contactId, 10) || 0}, ${sqlNumber(source.sumInsured)}, ${sqlNumber(source.premium)}, ${sqlNumber(sumInsuredCeded)}, ${sqlNumber(premiumCeded)}, ${sqlNumber(commission)}, ${sqlNumber(percentage)}, GETDATE(), ${sqlBit(leaderValue)}, '${escapeSqlValue(source.currency)}', ${sqlNullableNumber(source.liquidationId)}, ${sqlBit(source.paidOnCollection)}, NULL, ${sqlNumber(participantRows ? row.brokerCommission : source.brokerCommission)}, ${sqlNumber(tax)}, ${sqlNullableNumber(source.changeId)}, ${sqlBit(participantRows ? row.overwritten : source.overwritten)}, ${sqlNullableNumber(source.allocationId)}, NULL, ${sqlNullableNumber(participantRows ? row.brokerId : source.brokerId)});`;
      }).join("\n")
    : "";

  const sql = `SET XACT_ABORT ON;
BEGIN TRY
  BEGIN TRANSACTION;
  DELETE FROM CoCession WHERE lifePolicyId = ${policyId};
  ${inserts}
  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;`;
  return await me.exe("DoQuery", { sql });
}

function distribuyeContrato() {

  try {   
    
    const valores = {
      pret, msret, mpret, pcret, mcret,
      piret, miret, pcp,
      mscp, mpcp, pccp, mccp, picp, micp,
      pfp, msfp, mpfp,
      pcfp, mcfp, pifp, mifp,
      pco, msco, mpco,
      pcco, mcco, pico, mico
    };

    const resultado = {
      pret, msret, mpret, pcret, mcret,
      piret, miret, pcp,
      mscp, mpcp, pccp, mccp, picp, micp,
      pfp, msfp, mpfp,
      pcfp, mcfp, pifp, mifp,
      pco, msco, mpco,
      pcco, mcco, pico, mico
    };
    
    // Recorrer y asignar valor al elemento con id igual al nombre de la variable
    Object.entries(valores).forEach(([name, value]) => {
        const $elem = $(`#${name}`);
        if ($elem.length) {
          if (name.startsWith("p")) {
            resultado[name] = redondear($elem.val(), 5, true);
          } else {
            resultado[name] = redondearMonto($elem.val());
          }
        }
    });
    
    const tieneRET = (resultado["pret"] + resultado["msret"] + resultado["mpret"]) > 0;
    const tieneCP = (resultado["pcp"] + resultado["mscp"] + resultado["mpcp"] + resultado["mccp"] + resultado["micp"]) > 0;
    const tieneFAC = (resultado["pfp"] + resultado["msfp"] + resultado["mpfp"] + resultado["mcfp"] + resultado["mifp"]) > 0;
    let newCessions = JSON.parse(JSON.stringify(cessions));
  
    //Se borran las lineas donde no se haya distribuido el contrato
    if(!tieneRET && !tieneCP)
      newCessions = newCessions.filter(item => filterConditionNotIn("CUOTA PARTE", item));
    else
      distribuyeSegunContrato(newCessions, resultado, {
        tipoContrato: "Cuota Parte",
        usaCedant: true,
        getPorContrato: (r) => (r["pret"] + r["pcp"]) / 100,
        keys: {
          porcentajeCed: "pret",
          porcentajeRe: "pcp",
          montoComision: "mccp",
          montoImpuesto: "micp",
          porcentajeComision: "pccp",
          totalSumaCed: "msret",
          totalSumaRe: "mscp",
          totalPrimaCed: "mpret",
          totalPrimaRe: "mpcp"
        }
      });

    if(!tieneFAC)
      newCessions = newCessions.filter(item => filterConditionNotIn("FAC", item));
    else
      distribuyeSegunContrato(newCessions, resultado, {
        tipoContrato: "FAC",
        usaCedant: false,
        getPorContrato: (r) => r["pfp"] / 100,
        keys: {
          porcentajeRe: "pfp",
          montoComision: "mcfp",
          montoImpuesto: "mifp",
          porcentajeComision: "pcfp",
          totalSumaRe: "msfp",
          totalPrimaRe: "mpfp"
        }
      });

    distribuyeAceptantes(newCessions.filter(item =>
      normalizeCondition(item.lineId) !== "COASEGURO" && item.contractId != contractId
    ));

    return newCessions ?? [];
    
  } catch (error) {
    mostrarNotificacion(error.toString() , "warning");
    return [];
  }
}

function distribuyeSegunContrato(newCessions, resultado, config) {

  const {
    tipoContrato,
    getPorContrato,
    keys,
    usaCedant
  } = config;

  const forzar = true;

  const tipoUpper = tipoContrato.toUpperCase();

  const tieneDistribucion = newCessions.filter(item => filterCondition(tipoUpper, item)).length;

  if (tieneDistribucion == 0) {
    const newLines = construyeNuevaDistribucion(tipoContrato);
    newCessions.push(...newLines);
  }

  const items = newCessions.filter(item => filterCondition(tipoUpper, item));

  items.forEach(ces => {

    const proporcionPrimaTotal = gridDataSelected.Prima == 0
      ? 0
      : redondear((ces.premium / gridDataSelected.Prima), 8, forzar);

    const primaCob = redondearMonto(ces.premium);

    ces.id = 0;

    // =========================
    // Cedant (solo si aplica)
    // =========================
    if (usaCedant) {
      ces.sumInsuredCedant = redondearMonto(resultado[keys.porcentajeCed] * ces.sumInsured / 100);
      ces.premiumCedant = redondearMonto(resultado[keys.porcentajeCed] * primaCob / 100);
      ces.proportionCed = redondear(resultado[keys.porcentajeCed] / 100, 5, true);
    } else {
      ces.sumInsuredCedant = 0;
      ces.premiumCedant = 0;
      ces.proportionCed = 0;
    }

    // =========================
    // Reaseguro
    // =========================
    ces.sumInsuredRe = redondearMonto(resultado[keys.porcentajeRe] * ces.sumInsured / 100);
    ces.premiumRe = redondearMonto(resultado[keys.porcentajeRe] * primaCob / 100);
    ces.proportionRe = redondear(resultado[keys.porcentajeRe] / 100, 5, true);

    ces.err = false;
    ces.msg = "";
    ces.np = false;

    // =========================
    // Comision e impuesto
    // =========================
    ces.participantCommission = redondearMonto(proporcionPrimaTotal * resultado[keys.montoComision]);
    ces.comissionCedant = ces.participantCommission;
    ces.tax = redondearMonto(proporcionPrimaTotal * resultado[keys.montoImpuesto]);
    ces.coCommission = resultado[keys.porcentajeComision];
    
    ces.np = false;    

    // =========================
    // Ajustes por cobertura
    // =========================
    let diff = ces.premium - (ces.premiumCedant + ces.premiumRe);

    if (ces.premiumCedant > 0 && diff < 0)
      ces.premiumCedant += diff;
    else if (ces.premiumRe > 0 && diff < 0)
      ces.premiumRe += diff;

    diff = ces.sumInsured - (ces.sumInsuredCedant + ces.sumInsuredRe);

    if (ces.sumInsuredCedant > 0 && diff < 0)
      ces.sumInsuredCedant += diff;
    else if (ces.sumInsuredRe > 0 && diff < 0)
      ces.sumInsuredRe += diff;

  });

  // =========================
  // Ajustes a nivel contrato
  // =========================
  const validaSiEsCobertura = true;

  const primerCobertura = items[0];

  if (usaCedant) {
    const totalSumaRET = dameTotal(newCessions, tipoUpper, "sumInsuredCedant", validaSiEsCobertura);
    const totalPrimaRET = dameTotal(newCessions, tipoUpper, "premiumCedant");

    primerCobertura.sumInsuredCedant += redondearMonto(resultado[keys.totalSumaCed] - totalSumaRET);
    primerCobertura.premiumCedant += redondearMonto(resultado[keys.totalPrimaCed] - totalPrimaRET);
  }

  const totalSumaCED = dameTotal(newCessions, tipoUpper, "sumInsuredRe", validaSiEsCobertura);
  const totalPrimaCED = dameTotal(newCessions, tipoUpper, "premiumRe");
  const totalComision = dameTotal(newCessions, tipoUpper, "comissionCedant");
  const totalImpuesto = dameTotal(newCessions, tipoUpper, "tax");

  primerCobertura.sumInsuredRe += redondearMonto(resultado[keys.totalSumaRe] - totalSumaCED);
  primerCobertura.premiumRe += redondearMonto(resultado[keys.totalPrimaRe] - totalPrimaCED);
  primerCobertura.comissionCedant += redondearMonto(resultado[keys.montoComision] - totalComision);
  primerCobertura.tax += redondearMonto(resultado[keys.montoImpuesto] - totalImpuesto);

  // =========================
  // Participantes
  // =========================
  distribuyeAceptantes(items);
  
}

function getCoaseguroLineKey(item) {
  return [
    item?.contractId ?? "",
    item?.changeId ?? 0,
    normalizeCondition(TIPO_MOVIMIENTO_ES[item?.premiumType] || item?.premiumType),
    String(item?.coverageCode ?? "")
  ].join("|");
}

function aplicarCoaseguroGlobal(currentCessions, resultado) {
  const sourceCessions = Array.isArray(currentCessions) ? currentCessions : [];
  const baseLines = sourceCessions.filter(item => normalizeCondition(item.lineId) !== "COASEGURO");
  const coaseguroPercentage = redondear(numeroDe(resultado.pco) / 100, 8, true);

  const groups = new Map();
  baseLines.forEach(line => {
    const key = [
      line?.contractId ?? "",
      line?.changeId ?? 0,
      normalizeCondition(TIPO_MOVIMIENTO_ES[line?.premiumType] || line?.premiumType),
      String(line?.coverageCode ?? "")
    ].join("|");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(line);
  });

  groups.forEach(lines => {
    if (lines.some(line => line.contractId == contractId)) return;

    const currentRet = lines
      .filter(line => normalizeCondition(line.lineId) === "CUOTA PARTE")
      .reduce((total, line) => total + numeroDe(line.proportionCed), 0);
    const currentQuota = lines
      .filter(line => normalizeCondition(line.lineId) === "CUOTA PARTE")
      .reduce((total, line) => total + numeroDe(line.proportionRe), 0);
    const currentFac = lines
      .filter(line => normalizeCondition(line.lineId) === "FAC")
      .reduce((total, line) => total + numeroDe(line.proportionRe), 0);
    const currentTotal = currentRet + currentQuota + currentFac;
    if (currentTotal <= 0) return;

    const remaining = 1 - coaseguroPercentage;
    const factor = remaining / currentTotal;

    lines.forEach(line => {
      const lineId = normalizeCondition(line.lineId);
      const originalCed = numeroDe(line.proportionCed);
      const originalRe = numeroDe(line.proportionRe);
      const oldPremiumRe = numeroDe(line.premiumRe);
      const commissionRate = oldPremiumRe > 0 ? numeroDe(line.comissionCedant) / oldPremiumRe : 0;
      const taxRate = oldPremiumRe > 0 ? numeroDe(line.tax) / oldPremiumRe : 0;

      if (lineId === "CUOTA PARTE") {
        line.proportionCed = redondear(originalCed * factor, 8, true);
        line.proportionRe = redondear(originalRe * factor, 8, true);
        line.sumInsuredCedant = redondearMonto(numeroDe(line.sumInsured) * line.proportionCed);
        line.premiumCedant = redondearMonto(numeroDe(line.premium) * line.proportionCed);
        line.sumInsuredRe = redondearMonto(numeroDe(line.sumInsured) * line.proportionRe);
        line.premiumRe = redondearMonto(numeroDe(line.premium) * line.proportionRe);
      } else if (lineId === "FAC") {
        line.proportionRe = redondear(originalRe * factor, 8, true);
        line.sumInsuredCedant = 0;
        line.premiumCedant = 0;
        line.sumInsuredRe = redondearMonto(numeroDe(line.sumInsured) * line.proportionRe);
        line.premiumRe = redondearMonto(numeroDe(line.premium) * line.proportionRe);
      } else {
        return;
      }

      line.comissionCedant = redondearMonto(line.premiumRe * commissionRate);
      line.participantCommission = line.comissionCedant;
      line.tax = redondearMonto(line.premiumRe * taxRate);
    });

    const adjustedTotal = lines.reduce((total, line) => {
      if (normalizeCondition(line.lineId) === "CUOTA PARTE") {
        return total + numeroDe(line.proportionCed) + numeroDe(line.proportionRe);
      }
      if (normalizeCondition(line.lineId) === "FAC") return total + numeroDe(line.proportionRe);
      return total;
    }, 0);
    const distributionDifference = redondear(remaining - adjustedTotal, 8, true);
    if (distributionDifference !== 0) {
      const retentionLine = lines.find(line => normalizeCondition(line.lineId) === "CUOTA PARTE") || lines[0];
      if (retentionLine) {
        retentionLine.proportionCed = redondear(numeroDe(retentionLine.proportionCed) + distributionDifference, 8, true);
        retentionLine.sumInsuredCedant = redondearMonto(numeroDe(retentionLine.sumInsured) * retentionLine.proportionCed);
        retentionLine.premiumCedant = redondearMonto(numeroDe(retentionLine.premium) * retentionLine.proportionCed);
      }
    }
  });

  if (coaseguroPercentage <= 0) return baseLines;

  const previousCoLines = sourceCessions.filter(item => normalizeCondition(item.lineId) === "COASEGURO");
  const previousByKey = new Map(previousCoLines.map(item => [getCoaseguroLineKey(item), item]));

  const globalCoLines = baseLines.map(baseLine => {
    const previous = previousByKey.get(getCoaseguroLineKey(baseLine)) || {};
    const premium = redondearMonto(baseLine.premium || 0);
    const sumInsured = redondearMonto(baseLine.sumInsured || 0);
    const premiumRe = redondearMonto(premium * coaseguroPercentage);
    const sumInsuredRe = redondearMonto(sumInsured * coaseguroPercentage);

    return {
      ...previous,
      ...baseLine,
      id: 0,
      lineId: "COASEGURO",
      sumInsured,
      premium,
      sumInsuredCedant: 0,
      premiumCedant: 0,
      sumInsuredRe,
      premiumRe,
      proportionCed: 0,
      proportionRe: coaseguroPercentage,
      comissionCedant: redondearMonto(premiumRe * numeroDe(resultado.pcco) / 100),
      tax: redondearMonto(premiumRe * numeroDe(resultado.pico) / 100),
      commission: redondearMonto(premiumRe * numeroDe(resultado.pcco) / 100),
      participantCommission: redondearMonto(premiumRe * numeroDe(resultado.pcco) / 100),
      __source: "COASEGURO"
    };
  });

  ajustarDiferenciaAlMayor(globalCoLines, "sumInsuredRe", globalCoLines.reduce((total, line) => total + numeroDe(line.sumInsuredRe), 0));
  ajustarDiferenciaAlMayor(globalCoLines, "premiumRe", globalCoLines.reduce((total, line) => total + numeroDe(line.premiumRe), 0));
  ajustarDiferenciaAlMayor(globalCoLines, "comissionCedant", globalCoLines.reduce((total, line) => total + numeroDe(line.comissionCedant), 0));
  ajustarDiferenciaAlMayor(globalCoLines, "tax", globalCoLines.reduce((total, line) => total + numeroDe(line.tax), 0));

  ajustarDiferenciasCoaseguroGlobal(baseLines, globalCoLines);

  return [...baseLines, ...globalCoLines];
}

function ajustarDiferenciasCoaseguroGlobal(baseLines, coLines) {
  const groups = new Map();
  [...baseLines, ...coLines].forEach(line => {
    if (line.contractId == contractId) return;
    const key = getCoaseguroLineKey(line);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(line);
  });

  groups.forEach(lines => {
    const baseLine = lines.find(line => normalizeCondition(line.lineId) !== "COASEGURO");
    if (!baseLine) return;

    [
      { cedant: "premiumCedant", ceded: "premiumRe", base: "premium" },
      { cedant: "sumInsuredCedant", ceded: "sumInsuredRe", base: "sumInsured" }
    ].forEach(({ cedant, ceded, base }) => {
      const distributed = lines.reduce((total, line) => total + numeroDe(line[cedant]) + numeroDe(line[ceded]), 0);
      const difference = redondearMonto(numeroDe(baseLine[base]) - distributed);
      if (difference === 0) return;

      const retentionLine = lines.find(line => normalizeCondition(line.lineId) === "CUOTA PARTE") || baseLine;
      retentionLine[cedant] = redondearMonto(numeroDe(retentionLine[cedant]) + difference);
    });
  });
}

function construyeNuevaDistribucion(contrato) {

  if(cessions.length == 0)
    throw new Error("No hay distribución de reaseguro");

  const source = isCoverageScopeActive()
    ? cessions.filter(matchesSelectedCoverage)
    : cessions;
  const base = source[0]?.lineId;
  const copia = source.filter(x => x.lineId.trim().toUpperCase() == base?.trim().toUpperCase());

  if(copia.length == 0)
    throw new Error("No hay distribución de reaseguro");

  let resultado = JSON.parse(JSON.stringify(copia));

  resultado.forEach(x => {
    x.lineId = contrato;
    if(contrato?.trim()?.toUpperCase() == "FAC"){
      x.Participants = [];
      x.err = true;
      x.msg = "Debe distribuir los reaseguradores";
    }      
  })
  
  return resultado;
  
}

async function cleanCessions(contractIdToUpdate) {

  const id = Number(contractIdToUpdate);
  if (!Number.isFinite(id)) {
    return { ok: false, msg: "Contrato invalido" };
  }

  // Se reemplaza solo el contrato actualizado. Los otros contratos de la
  // misma poliza deben permanecer intactos.
  const coverageFilter = isCoverageScopeActive()
    ? ` AND c.coverageCode = '${escapeSqlValue(selectedCoverageCode)}'`
    : "";
  const query = `DELETE p FROM CessionPart p WHERE cessionId in (SELECT c.id FROM Cession c WHERE c.lifePolicyId = ${policyId} AND c.contractId = ${id} AND c.overwritten = 0${coverageFilter});
  DELETE c FROM Cession c WHERE c.lifePolicyId = ${policyId} AND c.contractId = ${id} AND c.overwritten = 0${coverageFilter};`
  
  const resultado = await me.exe("DoQuery", {
    sql: query });  

  return resultado;

}

async function cleanAllCessions() {
  const query = `DELETE p FROM CessionPart p WHERE cessionId IN (SELECT id FROM Cession WHERE lifePolicyId = ${policyId} AND overwritten = 0);
DELETE FROM Cession WHERE lifePolicyId = ${policyId} AND overwritten = 0;`;
  return await me.exe("DoQuery", { sql: query });
}

function escapeSqlValue(value) {
  return String(value ?? "").replace(/'/g, "''");
}

// En operaciones ADD el backend genera los ids: enviar ids temporales
// (negativos, p.ej. -2147482647) o la entidad Broker/Contact embebida hace
// que EF intente insertarlas con id explicito y SQL Server falle con
// "Cannot insert explicit value for identity column in table 'Contact'".
// Por eso antes de enviar se fuerza id = 0 y se enva solo brokerId.
function sanitizarCessionPartParaGuardar(part) {
  const p = JSON.parse(JSON.stringify(part));
  p.id = 0;
  if (!p.cessionId || p.cessionId < 0) p.cessionId = 0;
  p.Broker = null;
  return p;
}

function sanitizarCessionParaGuardar(cession) {
  const c = JSON.parse(JSON.stringify(cession));
  c.id = 0;
  (c.Participants || []).forEach(p => {
    p.id = 0;
    p.cessionId = 0;
    p.Broker = null;
  });
  return c;
}

async function addCessions(newCessions){
  let isOk = true;

  const newSaveCessions = [];
  
  const ordenadas = [...newCessions].sort((a, b) => {

    const getPrioridad = (lineId) => {
      const val = (lineId || "").trim().toUpperCase();

      if (val === "FAC" || val === "COASEGURO") return 1; // ltimos
      return 0; // primero
    };

    return getPrioridad(a.lineId) - getPrioridad(b.lineId);
  });
  
  for (let cession of ordenadas) {

    const resultado = await me.exe("RepoCession", {
      operation: "ADD",
      entity: sanitizarCessionParaGuardar(cession)
    });
      
    if (!resultado.ok) {
      mostrarNotificacion(
        `No se pudo guardar la distribución de reaseguro: ${resultado.msg}`,
        "warning"
      );
      isOk = false;
      break; // corta completamente
    }
    newSaveCessions.push(resultado.outData[0]);
  } 
  
  return { isOk: isOk, newSaveCessions: newSaveCessions};
}  

function dameTotal(newCessions, contrato, field, validaCobertura = false) {
  const totalSuma = newCessions.reduce((acc, item) => {
    if (filterCondition(contrato, item)) {
      if(validaCobertura)
        return acc + (montoSiEsCobertura(item.coverageCode, Number(item[field]) || 0));
      else
        return acc + (Number(item[field]) || 0);
    }
    return acc;
  }, 0);
  return redondearMonto(totalSuma);
}

function validaTotales() {

  const totales = { tp, tms, tmp, tpc, tmc, tpi, tmi};
  const resultado = { tp, tms, tmp, tpc, tmc, tpi, tmi};

  Object.entries(totales).forEach(([name, value]) => {
      const $elem = $(`#${name}`);
      if ($elem.length) {
        resultado[name] = $elem.val();
      }
  });

  if(redondear(resultado["tp"], 5, true) != 100){
    mostrarNotificacion(`Existe diferencia en el total % distribuido, debe ser 100%.`, "warning");
    return false;
  }
    

  if(redondearMonto(resultado["tms"]) != redondearMonto(gridDataSelected.Suma)){
    mostrarNotificacion(`Existe diferencia en el total de suma distribuido, debe ser ${formatearMonto(gridDataSelected.Suma)}.`, "warning");
    return false;
  }

  if(redondearMonto(resultado["tmp"]) != redondearMonto(gridDataSelected.Prima)){
    mostrarNotificacion(`Existe diferencia en el total de prima distribuido, debe ser ${formatearMonto(gridDataSelected.Prima)}.`, "warning");
    return false;
  }
    
  return true;
}

function montoSiEsCobertura(coverageCode, amount) {
  // Si no hay coverageCode (p.ej. un Participant cargado desde el backend
  // que no incluye este campo) no podemos determinar si es cobertura, as
  // que devolvemos el monto sin filtrar para no perder informacion.
  if (coverageCode == null || coverageCode === "") return amount;

  const coverageConfig = config.find(c => c.coverageCode == coverageCode);

  // Si la cobertura no esta en el config del producto/lob (por ejemplo
  // viene de una version anterior o de un producto distinto), igualmente
  // dejamos pasar el monto en lugar de excluirlo silenciosamente.
  if (!coverageConfig || coverageConfig.isCoverage == null) return amount;

  const suma = String(coverageConfig.isCoverage).trim().toUpperCase() == "SI";
  return suma ? amount : 0;
}

const normalizeCondition = v => (v ?? "").toString().trim().toUpperCase();

function filterCondition(line, c) {
  return (
    c.contractId == contractId &&
    normalizeCondition(TIPO_MOVIMIENTO_ES[c.premiumType] || c.premiumType) === normalizeCondition(tipoPrimaSelected) &&
    normalizeCondition(c.lineId) === normalizeCondition(line) &&
    matchesSelectedCoverage(c)
  );
}

function filterConditionNotIn(line, c) {
  const sameDistribution = c.contractId == contractId &&
    normalizeCondition(TIPO_MOVIMIENTO_ES[c.premiumType] || c.premiumType) === normalizeCondition(tipoPrimaSelected);

  if (!sameDistribution || !matchesSelectedCoverage(c)) return true;
  return normalizeCondition(c.lineId) !== normalizeCondition(line);
}

function filterConditionTotal(c) {
  return (
    c.contractId == contractId &&
    normalizeCondition(TIPO_MOVIMIENTO_ES[c.premiumType] || c.premiumType) === normalizeCondition(tipoPrimaSelected)
    && matchesSelectedCoverage(c)
  );
}

function onRowSelected(row) {

  // A new master or coverage selection invalidates the participants view.
  showDistributionTab();
  updateAceptantesTabState(false);

  const coverageScope = isCoverageScopeActive();
  let pret = 0, msret = 0, mpret = 0, pcret = 0, mcret = 0,
  piret = 0, miret = 0, pcp = 0,
  mscp = 0, mpcp = 0, pccp = 0, mccp = 0, picp = 0, micp = 0,
  pfp = 0, msfp = 0, mpfp = 0,
  pcfp = 0, mcfp = 0, pifp = 0, mifp = 0,
  pco = 0, msco = 0, mpco = 0,
  pcco = 0, mcco = 0, pico = 0, mico = 0, premium = 0,
  srcp = 0, srfp = 0, srco = 0;

  //convierto distribuciones a un arreglo de objetos mapeando el valor
  const distribucionesCalculo = distribuciones.map(x => ({ name: x, porcentajesCalculados: null }));

  distribucionesCalculo.forEach(calc => {

    try {

      const dist = calc.name;

      const sourceCessions = Array.isArray(row?._scopeCessions)
        ? row._scopeCessions
        : cessions;
      const distReas = sourceCessions.filter(b => filterCondition(dist, b));

      if(distReas.length <= 0){
        return;
      }

      distReas.forEach(distribucion => {
        msret += montoSiEsCobertura(distribucion.coverageCode,distribucion.sumInsuredCedant);
        mpret += distribucion.premiumCedant;
        premium += distribucion.premium;

        switch(dist){
          case "CUOTA PARTE":
            mscp += montoSiEsCobertura(distribucion.coverageCode,distribucion.sumInsuredRe);
            mpcp += distribucion.premiumRe;
            mccp += distribucion.comissionCedant;
            micp += distribucion.tax;
            break;
          case "FAC":
            msfp += montoSiEsCobertura(distribucion.coverageCode,distribucion.sumInsuredRe);
            mpfp += distribucion.premiumRe;
            mcfp += distribucion.comissionCedant;
            mifp += distribucion.tax;
            break;
          case "COASEGURO":
            msco += montoSiEsCobertura(distribucion.coverageCode,distribucion.sumInsuredRe);
            mpco += distribucion.premiumRe;
            mcco += distribucion.comissionCedant;
            mico += distribucion.tax;
            break;
        }

      });

    } catch (error) {
      console.error(error);
    }

  });

  const totalBase = numeroDe(row?.Suma);
  const percentages = [
    { key: "pret", amount: msret },
    { key: "pcp", amount: mscp },
    { key: "pfp", amount: msfp },
    { key: "pco", amount: msco }
  ];

  percentages.forEach(item => {
    item.value = totalBase === 0 ? 0 : item.amount / totalBase;
  });

  // El porcentaje global de Coaseguro debe leerse desde la línea persistida,
  // no reconstruirse desde montos redondeados por cobertura.
  const coaseguroPersistido = (Array.isArray(row?._scopeCessions) ? row._scopeCessions : cessions)
    .find(item => filterCondition("COASEGURO", item) && item.proportionRe !== null && item.proportionRe !== undefined);
  if (coaseguroPersistido) {
    const coaseguroPercentage = numeroDe(coaseguroPersistido.proportionRe);
    const coaseguroValue = coaseguroPercentage > 1 ? coaseguroPercentage / 100 : coaseguroPercentage;
    const coaseguroCalculated = percentages.find(item => item.key === "pco");
    if (coaseguroCalculated) coaseguroCalculated.value = coaseguroValue;
  }

  const editablePercentages = percentages.filter(item => item.key !== "pco");
  const totalPercentage = editablePercentages.reduce((total, item) => total + item.value, 0);
  const firstWithAmount = editablePercentages.find(item => item.amount > 0);
  if (firstWithAmount) {
    firstWithAmount.value += 1 - totalPercentage;
  }

  pret = percentages.find(item => item.key === "pret").value;
  pcp = percentages.find(item => item.key === "pcp").value;
  pfp = percentages.find(item => item.key === "pfp").value;
  pco = percentages.find(item => item.key === "pco").value;

  //redondeamos para ser mas precisos (montos con los decimales de la moneda):
  //ret
  pret = redondear(pret * 100, 5, true);
  msret = redondearMonto(msret);
  mpret = redondearMonto(mpret);
  premium = redondearMonto(premium);

  //cp
  pcp = redondear(pcp * 100, 5, true);
  mscp = redondearMonto(mscp);
  mpcp = redondearMonto(mpcp);
  mccp = redondearMonto(mccp);
  srcp = redondearMonto(mpcp - mccp);
  micp = redondearMonto(micp);
  pccp = calcularPorcentaje(mpcp, mccp);
  picp = calcularPorcentaje(mpcp, micp);

  //fac
  pfp = redondear(pfp * 100, 5, true);
  msfp = redondearMonto(msfp);
  mpfp = redondearMonto(mpfp);
  mcfp = redondearMonto(mcfp);
  srfp = redondearMonto(mpfp - mcfp);
  mifp = redondearMonto(mifp);
  pcfp = calcularPorcentaje(mpfp, mcfp);
  pifp = calcularPorcentaje(mpfp, mifp);

  //coaseguro
  pco = redondear(pco * 100, 5, true);
  msco = redondearMonto(msco);
  mpco = redondearMonto(mpco);
  mcco = redondearMonto(mcco);
  srco = redondearMonto(mpco - mcco);
  mico = redondearMonto(mico);
  pcco = calcularPorcentaje(mpco, mcco);
  pico = calcularPorcentaje(mpco, mico);

  const totalMasterPercentage = pret + pcp + pfp + pco;
  const difference = redondear(100 - totalMasterPercentage, 5, true);
  if (difference !== 0) {
    if (msret > 0) pret = redondear(pret + difference, 5, true);
    else if (mscp > 0) pcp = redondear(pcp + difference, 5, true);
    else if (msfp > 0) pfp = redondear(pfp + difference, 5, true);
    else if (msco > 0) pco = redondear(pco + difference, 5, true);
  }



  // Creamos un arreglo con los nombres de todas las variables
  const valores = {
    pret, msret, mpret, pcret, mcret,
    piret, miret, pcp,
    mscp, mpcp, pccp, mccp, picp, micp,
    pfp, msfp, mpfp,
    pcfp, mcfp, pifp, mifp,
    pco, msco, mpco,
    pcco, mcco, pico, mico, srcp, srfp, srco
  };
  
  // Recorrer y asignar valor al elemento con id igual al nombre de la variable
  // (los porcentajes empiezan con "p"; el resto son montos con decimales de la moneda)
  Object.entries(valores).forEach(([name, value]) => {
      const $elem = $(`#${name}`);
      if ($elem.length) {
        $elem.val(name === "pco" ? formatearPorcentajeCoaseguro(value) : (name.startsWith("p") ? formatearNumero(value) : formatearMonto(value)));
      }
  });

  calculaTotales();
  setAceptanteButtonsEnabled(true);

}

async function loadCessions(){
  const RepoCession = await me.exe("RepoCession", { operation: "GET", filter: `lifePolicyId = ${policyId}` });  
  let baseCessions = RepoCession.outData ?? [];

  baseCessions = filterCurrentCessions(baseCessions, policyId);
  await loadCoCessions();
  cessions = appendCoCessionLines(baseCessions, coCessions);

  monedaPoliza = (cessions[0]?.currency || monedaPoliza || "").trim();

  if(cessions.length <= 0)
    mostrarNotificacion(`No existe reaseguro en la póliza, por favor asegúrese de cotizar primero la póliza`, "warning");

  gridData = mapCessionsToGrid(cessions);

}

async function loadCoCessions() {
  const result = await me.exe("RepoCoCession", {
    operation: "GET",
    filter: `lifePolicyId = ${policyId} AND parentCoCession IS NULL`,
    include: ["Coverage", "Broker", "Contact"],
    entity: null,
    bulkJson: null,
    size: 0,
    page: 0,
    showColumnsIfEmpty: false
  });

  coCessions = Array.isArray(result?.outData) ? result.outData : [];
}

function appendCoCessionLines(baseCessions, coCessionsList) {
  const syntheticLines = buildSyntheticCoCessionLines(baseCessions, coCessionsList);
  return [...baseCessions, ...syntheticLines];
}

function buildSyntheticCoCessionLines(baseCessions, coCessionsList) {
  const coCessionsArray = Array.isArray(coCessionsList) ? coCessionsList.filter(Boolean) : [];
  if (!coCessionsArray.length) return [];

  const baseLines = Array.isArray(baseCessions)
    ? baseCessions.filter(item => normalizeCondition(item?.lineId) !== "COASEGURO")
    : [];
  if (!baseLines.length) return [];

  const coCession = coCessionsArray[0];
  const totalCoPercentage = redondear(
    coCessionsArray.reduce((total, item) => total + numeroDe(item.percentage), 0),
    5,
    true
  );
  const totalCoSumInsured = redondearMonto(coCessionsArray.reduce((total, item) => total + numeroDe(item.sumInsured), 0));
  const totalCoCommission = redondearMonto(coCessionsArray.reduce((total, item) => total + numeroDe(item.commission), 0));
  const totalCoTax = redondearMonto(coCessionsArray.reduce((total, item) => total + numeroDe(item.tax), 0));
  const totalCoPremiumCeded = redondearMonto(coCessionsArray.reduce((total, item) => total + numeroDe(item.premiumCeded), 0));
  const coRate = redondear(totalCoPercentage / 100, 8, true);
  const commissionRate = totalCoPremiumCeded > 0 ? redondear(totalCoCommission / totalCoPremiumCeded, 8, true) : 0;
  const taxRate = totalCoPremiumCeded > 0 ? redondear(totalCoTax / totalCoPremiumCeded, 8, true) : 0;

  const syntheticLines = baseLines.map((item, index) => {
    const basePrima = redondearMonto(item.premium ?? 0);
    const baseSuma = redondearMonto(item.sumInsured ?? 0);
    const premiumRe = redondearMonto(basePrima * coRate);
    const sumInsuredRe = redondearMonto(baseSuma * coRate);
    const commission = redondearMonto(premiumRe * commissionRate);
    const tax = redondearMonto(premiumRe * taxRate);

    return {
      ...coCession,
      id: `COC-${coCession.id ?? 0}-${item.id ?? item.coverageId ?? index}`,
      lifeCoverageId: item.lifeCoverageId ?? item.coverageId ?? null,
      coverageId: item.coverageId ?? item.lifeCoverageId ?? null,
      coverageCode: item.coverageCode ?? null,
      coverageName: item.coverageName ?? null,
      contractId: item.contractId ?? coCession.contractId ?? null,
      contractCode: item.contractCode ?? coCession.contractCode ?? null,
      contractName: item.contractName ?? coCession.contractName ?? null,
      changeId: item.changeId ?? coCession.changeId ?? 0,
      premiumType: item.premiumType || TIPO_MOVIMIENTO_ES[item.premiumType] || "NEW",
      premiumTypeKey: limpiarTexto(item.premiumType || TIPO_MOVIMIENTO_ES[item.premiumType] || "NEW"),
      lineId: "COASEGURO",
      sumInsured: baseSuma,
      premium: basePrima,
      sumInsuredCedant: 0,
      premiumCedant: 0,
      sumInsuredRe,
      premiumRe,
      comissionCedant: commission,
      tax,
      proportionCed: 0,
      proportionRe: coRate,
      commission,
      participantCommission: commission,
      brokerCommission: coCession.brokerCommission ?? 0,
      parentCoCession: coCession.id ?? null,
      __source: "COASEGURO"
    };
  });

  const targetSumInsuredRe = syntheticLines.reduce((total, line) => total + numeroDe(line.sumInsuredRe), 0);
  const targetPremiumRe = syntheticLines.reduce((total, line) => total + numeroDe(line.premiumRe), 0);
  const targetCommission = syntheticLines.reduce((total, line) => total + numeroDe(line.comissionCedant), 0);
  const targetTax = syntheticLines.reduce((total, line) => total + numeroDe(line.tax), 0);

  ajustarDiferenciaAlMayor(syntheticLines, "sumInsuredRe", targetSumInsuredRe);
  ajustarDiferenciaAlMayor(syntheticLines, "premiumRe", targetPremiumRe);
  ajustarDiferenciaAlMayor(syntheticLines, "comissionCedant", targetCommission);
  ajustarDiferenciaAlMayor(syntheticLines, "tax", targetTax);

  syntheticLines.forEach(line => {
    line.commission = redondearMonto(line.comissionCedant ?? line.commission ?? 0);
    line.participantCommission = redondearMonto(line.comissionCedant ?? line.participantCommission ?? 0);
  });

  return syntheticLines;
}

async function loadContracts() {
  const contractIds = [...new Set(cessions.map(item => Number(item.contractId)).filter(Number.isInteger))];
  if (!contractIds.length) {
    contracts = [];
    return;
  }

  const results = await Promise.all(contractIds.map(id => me.exe("GetContracts", {
    operation: "GET",
    filter: `id = ${id}`
  })));

  contracts = results.flatMap(result => result?.outData || []);
}

function getContractById(id) {
  return contracts.find(contract => Number(contract.id) === Number(id)) || null;
}

function filterCurrentCessions(cessions, lifePolicyId) {
  const groups = {};

  for (const c of cessions) {

    const key = `${lifePolicyId}_${c.coverageId}`;
    if (!groups[key]) {
      groups[key] = {
        items: [],
        cancellationId: -Infinity
      };
    }

    groups[key].items.push(c);

    if (c.premiumType === 'CANCELLATION') {
      groups[key].cancellationId = Math.max(groups[key].cancellationId, c.id);
    }
  }

  const result = [];

  for (const key in groups) {
    const { items, cancellationId } = groups[key];

    let lastId = -Infinity;

    for (const c of items) {
      if (c.id < cancellationId && c.sumInsured >= 0) {
        lastId = Math.max(lastId, c.id);
      }
    }

    for (const c of items) {
      if (
        c.overwritten === false ||
        c.id === cancellationId ||
        c.id === lastId
      ) {
        result.push({
          cancellationId,
          lastId,
          ...c
        });
      }
    }
  }

  return result;
}

// Devuelve el nombre a mostrar de un contacto.
// Regla solicitada: para brokers (y en general contactos del catalogo) el
// campo `surname2` es el que guarda la denominacion visible (razon social
// para compaas; nombre comercial para brokers persona). Por eso se prefiere
// siempre surname2  y si viene vaco se cae al nombre completo (name +
// middleName + surname1) como red de seguridad para no mostrar la celda en
// blanco.
function dameNombreContacto(c) {
  if (!c) return "";
  const surname2 = (c.surname2 || "").trim();
  if (surname2) return surname2;
  const fallback = `${c.name || ""} ${c.middleName || ""} ${c.surname1 || ""}`.replace(/\s+/g, " ").trim();
  return fallback;
}

async function listarBrokers(){
  try {

    const filtroRol = " exists (select 1 from contactRole r where r.contactId = contact.id and r.role = 'CORRSEG')";

    const result = await me.exe("LoadEntities", {
        entity: "Contact",
        fields: "id, name, middleName, surname1, surname2, isPerson",
        filter: filtroRol
    });

    const data = result.outData ?? [];

    brokers = data
      .map(x => ({
        id: x.id,
        name: x.name,
        middleName: x.middleName,
        surname1: x.surname1,
        surname2: x.surname2,
        isPerson: x.isPerson,
        nombre: dameNombreContacto(x)
      }))
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));

  } catch (error) {
    console.error(error);
  }
}

// Carga contactos broker referenciados en participantes pero ausentes de `brokers`
async function ensureBrokersFromCessions() {
  try {
    const idsEnDatos = new Set();
    cessions.forEach(c => {
      (c.Participants || []).forEach(p => {
        if (p.brokerId != null) idsEnDatos.add(p.brokerId);
      });
    });

    const idsFaltantes = [...idsEnDatos].filter(id => !brokers.some(b => b.id === id));
    if (idsFaltantes.length === 0) return;

    const result = await me.exe("LoadEntities", {
      entity: "Contact",
      fields: "id, name, middleName, surname1, surname2, isPerson",
      filter: `id IN (${idsFaltantes.join(",")})`
    });

    (result.outData ?? []).forEach(x => {
      if (!brokers.some(b => b.id === x.id)) {
        brokers.push({
          id: x.id,
          name: x.name,
          middleName: x.middleName,
          surname1: x.surname1,
          surname2: x.surname2,
          isPerson: x.isPerson,
          nombre: dameNombreContacto(x)
        });
      }
    });

    brokers.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));

  } catch (error) {
    console.error(error);
  }
}

function getBrokerNombre(brokerId) {
  if (brokerId == null) return "";
  const b = brokers.find(x => x.id === brokerId);
  return b?.nombre || "";
}

async function listarAceptantes(){
  try {

    const filtroRol = " exists (select 1 from contactRole r where r.contactId = contact.id and r.role = 'REA')";

    const result = await me.exe("LoadEntities", {
        entity: "Contact",
        fields: "id, name, middleName, surname1, surname2, isPerson",
        filter: filtroRol
    });

    const data = result.outData ?? [];
    data.forEach(x => {
      x.nombreCompleto = dameNombreContacto(x);
    });

    aceptantes = data
      .sort((a, b) => (a.nombreCompleto || "").localeCompare(b.nombreCompleto || ""))
      .map(x => ({
        id: x.id,
        nombre: x.nombreCompleto
      }));

  } catch (error) {
    console.error(error);
  }
}

async function listarCoaseguradores(){
  try {

    const filtroRol = " exists (select 1 from contactRole r where r.contactId = contact.id and r.role = 'COI')";

    const result = await me.exe("LoadEntities", {
        entity: "Contact",
        fields: "id, name, middleName, surname1, surname2, isPerson",
        filter: filtroRol
    });

    const data = result.outData ?? [];
    data.forEach(x => {
      x.nombreCompleto = dameNombreContacto(x);
    });

    coaseguradores = data
      .filter(x => Number(x.id) !== 4939 && !String(x.nombreCompleto || "").toUpperCase().includes("CONTEMPORA"))
      .sort((a, b) => (a.nombreCompleto || "").localeCompare(b.nombreCompleto || ""))
      .map(x => ({
        id: x.id,
        nombre: x.nombreCompleto
      }));

  } catch (error) {
    console.error(error);
  }
}

// Carga contactos de participantes referenciados en cesiones pero ausentes
// de `aceptantes`. Esto pasa tpicamente cuando el contacto no tiene rol
// 'RIN'/'REI' (p.ej. en Cuota Parte donde el participante ya esta asociado
// a un broker y se cargo como contacto sin rol de reasegurador clasico).
async function ensureAceptantesFromCessions() {
  try {
    const idsEnDatos = new Set();
    cessions.forEach(c => {
      (c.Participants || []).forEach(p => {
        if (p.contactId != null) idsEnDatos.add(p.contactId);
      });
    });

    const idsFaltantes = [...idsEnDatos].filter(id => !aceptantes.some(a => a.id === id));
    if (idsFaltantes.length === 0) return;

    const result = await me.exe("LoadEntities", {
      entity: "Contact",
      fields: "id, name, middleName, surname1, surname2, isPerson",
      filter: `id IN (${idsFaltantes.join(",")})`
    });

    (result.outData ?? []).forEach(x => {
      if (!aceptantes.some(a => a.id === x.id)) {
        aceptantes.push({
          id: x.id,
          nombre: dameNombreContacto(x)
        });
      }
    });

    aceptantes.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));

  } catch (error) {
    console.error(error);
  }
}

async function ensureCoaseguradoresFromCessions() {
  try {
    const idsEnDatos = new Set();
    cessions.forEach(c => {
      (c.Participants || []).forEach(p => {
        if (
          normalizeCondition(c.lineId) === "COASEGURO" &&
          p.contactId != null &&
          Number(p.contactId) !== 4939
        ) {
          idsEnDatos.add(p.contactId);
        }
      });
    });

    const idsFaltantes = [...idsEnDatos].filter(id => !coaseguradores.some(a => a.id === id));
    if (idsFaltantes.length === 0) return;

    const result = await me.exe("LoadEntities", {
      entity: "Contact",
      fields: "id, name, middleName, surname1, surname2, isPerson",
      filter: `id IN (${idsFaltantes.join(",")})`
    });

    (result.outData ?? []).forEach(x => {
      if (
        Number(x.id) !== 4939 &&
        !String(dameNombreContacto(x) || "").toUpperCase().includes("CONTEMPORA") &&
        !coaseguradores.some(a => a.id === x.id)
      ) {
        coaseguradores.push({
          id: x.id,
          nombre: dameNombreContacto(x)
        });
      }
    });

    coaseguradores.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));

  } catch (error) {
    console.error(error);
  }
}

async function loadConfigCoverages(){
  const tableConfig = await me.exe("GetFullTable", { table: "cfgCoberturaProductoRea" });
  config = mapearTablaConfig(tableConfig.outData ?? []);
  config = config.filter(x => x.lobCode == policy.lob && x.productCode == policy.productCode);
}

async function loadDataEntities(){

  const RepoPolicy = await me.exe("LoadEntity", { entity: "LifePolicy", fields: "lob, productCode, id, activeDate, coinsurance, insuredSum, anualPremium", filter: `id = ${policyId}` });
  policy = RepoPolicy.outData;

  if(!RepoPolicy)
  {
    mostrarNotificacion(`No se pudieron recuperar los datos de la póliza, contacte a sistemas.`, "warning");
    return;
  }

  updateCoaseguradoresTabState(true);

  await loadConfigCoverages();

  await loadCessions();
  await loadContracts();
  gridData = mapCessionsToGrid(cessions);

  const RepoCoverages = await me.exe("LoadEntities", { entity: "LifeCoverage", fields: "id, code, name, description, commercialName, limit, basePremium", filter: `lifePolicyId = ${policyId}` });
  coverages = RepoCoverages.outData ?? [];
    
  await listarAceptantes();
  await listarCoaseguradores();
  await listarBrokers();
  await ensureBrokersFromCessions();
  await ensureAceptantesFromCessions();
  await ensureCoaseguradoresFromCessions();

  // Refrescar el campo Broker en cada participante con el nombre canonico
  // (en caso de que el backend no lo haya enviado o lo haya enviado con
  // estructura distinta).
  cessions.forEach(c => {
    (c.Participants || []).forEach(p => {
      if (p.brokerId != null) {
        const b = brokers.find(x => x.id === p.brokerId);
        if (b) {
          p.Broker = { id: b.id, name: b.nombre };
        }
      }
    });
  });

  if(coverages.length <= 0)
    mostrarNotificacion(`No existen coberturas en la póliza, por favor asegúrese de cotizar primero la póliza`, "warning");
  
}

function calculaTotales() {
  try {  
  
    // Creamos un arreglo con los nombres de todas las variables
    const totales = { tp, tms, tmp, tpc, tmc, tpi, tmi, tsr};
  
    totales.tp = redondear($("#pret").val(), 5, true) + redondear($("#pcp").val(), 5, true) + redondear($("#pfp").val(), 5, true) + redondear($("#pco").val(), 5, true);
    totales.tms = redondearMonto($("#msret").val()) + redondearMonto($("#mscp").val()) + redondearMonto($("#msfp").val()) + redondearMonto($("#msco").val());
    totales.tmp = redondearMonto($("#mpret").val()) + redondearMonto($("#mpcp").val()) + redondearMonto($("#mpfp").val()) + redondearMonto($("#mpco").val());
    totales.tpc = redondear($("#pcret").val(), 5, true) + redondear($("#pccp").val(), 5, true) + redondear($("#pcfp").val(), 5, true) + redondear($("#pcco").val(), 5, true);
    totales.tmc = redondearMonto($("#mcret").val()) + redondearMonto($("#mccp").val()) + redondearMonto($("#mcfp").val()) + redondearMonto($("#mcco").val());
    totales.tpi = redondear($("#piret").val(), 5, true) + redondear($("#picp").val(), 5, true) + redondear($("#pifp").val(), 5, true) + redondear($("#pico").val(), 5, true);
    totales.tmi = redondearMonto($("#miret").val()) + redondearMonto($("#micp").val()) + redondearMonto($("#mifp").val()) + redondearMonto($("#mico").val());
    totales.tsr = redondearMonto($("#srcp").val()) + redondearMonto($("#srfp").val()) + redondearMonto($("#srco").val());

    totales.tp = redondear(totales.tp, 5, true);
    totales.tms = redondearMonto(totales.tms);
    totales.tmp = redondearMonto(totales.tmp);
    totales.tpc = redondear(totales.tpc, 5, true);
    totales.tmc = redondearMonto(totales.tmc);
    totales.tpi = redondear(totales.tpi, 5, true);
    totales.tmi = redondearMonto(totales.tmi);
    totales.tsr = redondearMonto(totales.tsr);

    // Recorrer y asignar valor al elemento con id igual al nombre de la variable
    const totalesPorcentaje = new Set(["tp", "tpc", "tpi"]);
    Object.entries(totales).forEach(([name, value]) => {
        const $elem = $(`#${name}`);
        if ($elem.length) {
          $elem.val(totalesPorcentaje.has(name) ? formatearNumero(value) : formatearMonto(value));
        }
    });
    
  } catch (error) {
    console.error("Error calculando totales");
  }
}

function preserveDistribution(){
  $("#hiddenDistribucionReaseguro").val(JSON.stringify(cessions));
}

function isCoverageScopeActive() {
  return selectedCoverageCode !== null && selectedCoverageCode !== undefined;
}

function matchesSelectedCoverage(cession) {
  if (!isCoverageScopeActive()) return true;
  return String(cession?.coverageCode ?? "").trim() === String(selectedCoverageCode).trim();
}

function createCoverageGridRow(row, coverageCode) {
  const source = cessions.filter(cession =>
    cession.contractId == row.Contrato &&
    (cession.changeId ?? 0) == (row.Endoso ?? 0) &&
    normalizeCondition(TIPO_MOVIMIENTO_ES[cession.premiumType] || cession.premiumType) === normalizeCondition(row.Tipo) &&
    String(cession.coverageCode ?? "").trim() === String(coverageCode).trim()
  );

  const coverageRow = mapCessionsToGrid(source)[0] || {
    ...row,
    _coverages: []
  };

  coverageRow._scopeCessions = source;
  return coverageRow;
}

///////////////////////////////////////////////////////////
/// Distribución de aceptantes
///////////////////////////////////////////////////////////

async function guardarAceptantes(){
  showLoading("Guardando participantes...");
  await new Promise(resolve => setTimeout(resolve, 0));
  try {
    return await guardarAceptantesCore();
  } finally {
    hideLoading();
  }
}

async function guardarAceptantesCore(){
    
  // La grilla de participantes corresponde al contrato y movimiento
  // seleccionados. No mezclar coberturas de otros contratos con la validacion.
  const cessionCobs = cessions.filter(x => filterCondition(tipoContratoSelected, x));

  let resultado = validarTotalesReaseguradores(cessionCobs);
  if(!resultado?.ok){
    mostrarNotificacion(resultado.msg ?? "Total distribuido tiene diferencias", "warning");
    return ;
  }    

  const aceptantes = redistribuirAceptantesPorCobertura(cessionCobs);

  if(aceptantes.find(x => !x.cessionId || x.cessionId <= 0))
  {
    mostrarNotificacion(`Existen reaseguradores que no tienen debidamente asignado su contrato; debe guardar primero la distribución`, "warning");
    return ;
  }    

  if(aceptantes.length == 0)
  {
    mostrarNotificacion(`Existen reaseguradores que no tienen debidamente asignado su contrato; debe guardar primero la distribución`, "warning");
    return ;
  }    

  //Actualizo en los datos de la cesion a los aceptantes que le corresponden para luego guardarlos
  cessions.forEach(ces => {
    if(filterCondition(tipoContratoSelected, ces)){
      ces.Participants = aceptantes.filter(a => a.cessionId == ces.id);
    }
  });

  resultado = await addAceptantes(cessionCobs, aceptantes);
  if(!resultado)
    mostrarNotificacion(`No se pudo registrar los reaseguradores`, "warning");
  else{
    preserveDistribution();
    mostrarNotificacion(`Reaseguradores registrados satisfactoriamente`, "success");
  }    

}

async function addAceptantes(cessions, aceptantes) {
  let isOk = true;

  for (let ces of cessions) {

    // SQL justification: no existe comando Repo* para borrar en bloque los
    // CessionPart de una cesion; se valida el id como entero positivo antes
    // de interpolarlo.
    const cesId = parseInt(ces.id, 10);
    if (!cesId || cesId <= 0) {
      isOk = false;
      break;
    }

    const query = `DELETE p FROM CessionPart p WHERE cessionId in (${cesId});`

    const resultado = await me.exe("DoQuery", { sql: query });
    if(!resultado.ok){
      isOk = false;
      break;
    }
  }
  
  if(!isOk) return isOk;

  //Si no hay nada que registrar continuamos
  if(aceptantes.length == 0)
    return true;

  //Registramos el detalle
  for (let part of aceptantes) {

    const resultado = await me.exe("RepoCessionPart", {
      operation: "ADD",
      entity: sanitizarCessionPartParaGuardar(part)
    });
      
    if (!resultado.ok) {
      mostrarNotificacion(
        `No se pudo guardar los reaseguradores: ${resultado.msg}`,
        "warning"
      );
      isOk = false;
      break; // corta completamente
    }
  } 

  return isOk;
 
}

function redistribuirAceptantesPorCobertura(cessionCobs) {

  const totalCob = cessionCobs.reduce((acc, c) => {
    acc.sumInsuredRe += c.sumInsuredRe || 0;
    acc.premiumRe += c.premiumRe || 0;    
    acc.comissionCedant += c.comissionCedant || 0;
    acc.tax += c.tax || 0;
    return acc;
  }, { sumInsuredRe: 0, premiumRe: 0, comissionCedant: 0, tax: 0 });

  const resultado = [];

  cessionCobs.forEach(ces => {

    const factorPr = totalCob.premiumRe === 0 ? 0 : ces.premiumRe / totalCob.premiumRe;

    reaseguradoresData.forEach(r => {
      
      resultado.push({
        id: 0,
        coverageCode: ces.coverageCode,
        lineId: ces.lineId,
        cessionId: ces.id,
        contactId: r.contactId,
        name: r.name,
        split: numeroDe(r.split), // mismo split
        sumInsured: redondearMonto(ces.sumInsuredRe * (numeroDe(r.split) / 100)),
        premium: redondearMonto(numeroDe(r.premium) * factorPr),
        commission: redondearMonto(numeroDe(r.commission) * factorPr),
        tax: redondearMonto(numeroDe(r.tax) * factorPr),
        currency: ces.currency,
        liquidationId: null,
        reserve: 0,
        brokerId: r.brokerId ?? null,
        // Solo se enva brokerId: incluir la entidad Broker embebida hace que
        // el backend intente insertarla como un Contact nuevo y falle.
        Broker: null,
        fee: 0,
        jAmounts: null
      });

    });

  });

  ajustarDiferenciasAceptantes(resultado, totalCob);

  return resultado;
}

function ajustarDiferenciasAceptantes(resultado, totalesAse) {

  if (resultado.length > 0) {
    ajustarDiferenciaAlMayor(resultado, "sumInsured", totalesAse.sumInsuredRe);
    ajustarDiferenciaAlMayor(resultado, "premium", totalesAse.premiumRe);
    ajustarDiferenciaAlMayor(resultado, "commission", totalesAse.comissionCedant);
    ajustarDiferenciaAlMayor(resultado, "tax", totalesAse.tax);
  }
}

function validarTotalesReaseguradores(cessions, participants = reaseguradoresData) {

  const totalCob = cessions.reduce((acc, c) => {
    acc.sumInsuredRe += montoSiEsCobertura(c.coverageCode, c.sumInsuredRe || 0);
    acc.premiumRe += c.premiumRe || 0;    
    acc.comissionCedant += c.comissionCedant || 0;
    acc.tax += c.tax || 0;
    return acc;
  }, { sumInsuredRe: 0, premiumRe: 0, comissionCedant: 0, tax: 0 });


  // numeroDe: los valores editados en el grid pueden venir formateados con miles
  const total = (participants || []).reduce((acc, r) => {
    acc.split += numeroDe(r.split);
    acc.slip += getParticipantSlip(r);
    acc.premium += numeroDe(r.premium);
    acc.sumInsured += numeroDe(r.sumInsured);
    acc.commission += numeroDe(r.commission);
    acc.tax += numeroDe(r.tax);
    return acc;
  }, { split: 0, slip: 0, premium: 0, sumInsured: 0, commission: 0, tax: 0 });

  const esCoaseguro = participants === coaseguradoresData || (participants || []).some(row => normalizeCondition(row?.lineId) === "COASEGURO");
  const targetSlip = esCoaseguro ? numeroDe($("#pco").val()) : getDistributionPercentage();
  if (Math.abs(total.split - 100) > 0.0001) {
    return { ok:false, msg: "El total porcentual distribuido no es 100%" };
  }

  if (Math.abs(total.slip - targetSlip) > 0.0001) {
    return { ok:false, msg: "El total Slip distribuido no coincide con la colocación" };
  }

  if (Math.abs(total.premium - totalCob.premiumRe) > 0.0001) {
    return { ok:false, msg: "El total de prima distribuido no es 100%" };
  }

  if (Math.abs(total.sumInsured - totalCob.sumInsuredRe) > 0.0001) {
    return { ok:false, msg: "El total de suma distribuido no es 100%" };
  }

  if (Math.abs(total.commission - totalCob.comissionCedant) > 0.0001) {
    return { ok:false, msg: "El total de comisión distribuido no es 100%" };
  }

  if (Math.abs(total.tax - totalCob.tax) > 0.0001) {
    return { ok:false, msg: "El total de impuesto distribuido no es 100%" };
  }

  return { ok: true, msg: "Todo bien" };
}

function distribuyeAceptantes(newCessions) {

  // =========================
  // Participantes
  // =========================

  newCessions.forEach(ces => {
  
    const participants = Array.isArray(ces.Participants) ? ces.Participants : [];

    participants.forEach(p => {
      p.id = 0;
      p.cessionId = 0;
      p.sumInsured = redondearMonto(p.split / 100 * ces.sumInsuredRe);
      p.premium = redondearMonto(p.split / 100 * ces.premiumRe);
      p.commission = redondearMonto(p.split / 100 * ces.comissionCedant);
      p.tax = redondearMonto(p.split / 100 * ces.tax);
    });

    // Ajustar diferencias de redondeo en el participante con mayor monto de
    // cada rubro, sin alterar los porcentajes configurados.
    if (participants.length > 0) {
      ajustarDiferenciaAlMayor(participants, "sumInsured", ces.sumInsuredRe);
      ajustarDiferenciaAlMayor(participants, "premium", ces.premiumRe);
      ajustarDiferenciaAlMayor(participants, "commission", ces.comissionCedant);
      ajustarDiferenciaAlMayor(participants, "tax", ces.tax);
    }
    
    if((ces.lineId || "").trim().toUpperCase() == "FAC" && participants.length == 0){
      ces.err = true;
      ces.msg = "Debe registrar los reaseguradores de la distribución FAC";
    }
    else{
      const resumenParticipantes = resumirParticipants(participants);
      if(resumenParticipantes.split != 100){
        ces.err = true;
        ces.msg = "El porcentaje de distribución debe ser 100%";
      }
      
      if(resumenParticipantes.sumInsured != ces.sumInsuredRe){
        ces.err = true;
        ces.msg = "El total de suma distribuido es incorrecto";
      }
  
      if(resumenParticipantes.premium != ces.premiumRe){
        ces.err = true;
        ces.msg = "El total de prima distribuido es incorrecto";
      }
      
      if(resumenParticipantes.commission != ces.comissionCedant){
        ces.err = true;
        ces.msg = "El total de comisión distribuido es incorrecto";
      }
  
      if(resumenParticipantes.tax != ces.tax){
        ces.err = true;
        ces.msg = "El total de impuesto distribuido es incorrecto";
      }
    }
  });
  
}

function ajustarDiferenciaAlMayor(participants, field, target) {
  const total = participants.reduce((acc, participant) => acc + numeroDe(participant[field]), 0);
  const diferencia = redondearMonto(numeroDe(target) - total);
  if (diferencia === 0) return;

  const participanteMayor = participants.reduce((mayor, participant) => {
    if (!mayor) return participant;
    return numeroDe(participant[field]) > numeroDe(mayor[field]) ? participant : mayor;
  }, null);

  if (!participanteMayor) return;
  participanteMayor[field] = redondearMonto(numeroDe(participanteMayor[field]) + diferencia);
}

function resumirParticipants(participants) {
  const lista = Array.isArray(participants) ? participants : [];
  return lista.reduce((acc, p) => {
    acc.sumInsured += p.sumInsured || 0;
    acc.premium += p.premium || 0;
    acc.commission += p.commission || 0;
    acc.tax += p.tax || 0;
    acc.split += p.split || 0;
    return acc;
  }, {
    sumInsured: 0,
    premium: 0,
    commission: 0,
    tax: 0,
    split: 0
  });
}
  
function renderReaseguradores() {

  const $container = $("#tabReaseguradores");
  $container.empty();

  const html = `
    <div id="gridDistribucionContainerReaseguradores" style="padding-bottom:20px;">

      <div class="reaseguradores-toolbar" style="display:flex; gap:12px; align-items:center; margin-bottom:10px; flex-wrap:wrap;">

        <label style="font-weight:bold;">Vista:</label>
        <select id="filtroBroker" class="select-filtro-broker" style="min-width:260px;"></select>

        <button id="btnAgregarReasegurador" class="ant-btn ant-btn-primary">
          Agregar Reasegurador
        </button>

        <button id="btnCargaMasiva" class="ant-btn ant-btn-primary">
          Carga Masiva
        </button>

        <button id="btnGuardarDistribucion" class="ant-btn ant-btn-primary ant-btn-success">
          Guardar Distribución
        </button>

      </div>

      <div id="contenedorGridReaseguradores"></div>

    </div>
  `;

  $container.append(html);

  renderFiltroBroker();

  // ===== FILTRO BROKER =====
  $(document).off("change", "#filtroBroker")
    .on("change", "#filtroBroker", function () {
      filtroBrokerSeleccionado = this.value;
      renderGrid();
    });

  // ===== GUARDAR =====
  $(document).off("click", "#btnGuardarDistribucion")
    .on("click", "#btnGuardarDistribucion", async () => {
    await guardarAceptantes();
  });

  // ===== AGREGAR =====
  $(document).off("click", "#btnAgregarReasegurador")
    .on("click", "#btnAgregarReasegurador", function () {

      const first = aceptantes[0] || { id: 0, nombre: "" };

      // Si el filtro es un broker especfico, asociarlo automticamente al nuevo aceptante
      let brokerIdAsignado = null;
      let BrokerAsignado = null;
      if (filtroBrokerSeleccionado !== "ALL" && filtroBrokerSeleccionado !== "PRINCIPAL") {
        const brokerId = parseInt(filtroBrokerSeleccionado);
        const brokerInfo = brokers.find(b => b.id === brokerId);
        if (brokerInfo) {
          brokerIdAsignado = brokerInfo.id;
          BrokerAsignado = { id: brokerInfo.id, name: brokerInfo.nombre };
        }
      }

      reaseguradoresData.push({
        name: first.nombre,
        contactId: first.id,
        cessionId: 0,
        lineId: tipoContratoSelected,
        split: 0,
        sumInsured: 0,
        premium: 0,
        commission: 0,
        saldoRea: 0,
        tax: 0,
        brokerId: brokerIdAsignado,
        Broker: BrokerAsignado
      });

      renderGrid();
    });

  // ===== CARGA MASIVA =====
  $(document).off("click", "#btnCargaMasiva")
    .on("click", "#btnCargaMasiva", function () {
      abrirModalCargaMasiva();
    });

  // ===== COMBOS BUSCABLES (BROKER / PARTICIPANTE) =====
  $(document)
    .off("focus", "#contenedorGridReaseguradores .combo-input")
    .on("focus", "#contenedorGridReaseguradores .combo-input", function () {
      const input = this;
      abrirCombo($(input).closest(".combo-buscable"));
      setTimeout(() => { input.select(); }, 0);
    })
    .off("input", "#contenedorGridReaseguradores .combo-input")
    .on("input", "#contenedorGridReaseguradores .combo-input", function () {
      const $combo = $(this).closest(".combo-buscable");
      $combo.addClass("open");
      renderOpcionesCombo($combo, dameOpcionesCombo($combo), this.value);
    })
    .off("keydown", "#contenedorGridReaseguradores .combo-input")
    .on("keydown", "#contenedorGridReaseguradores .combo-input", function (e) {
      const $combo = $(this).closest(".combo-buscable");
      if (e.key === "Escape") {
        cerrarCombo($combo);
        this.blur();
      } else if (e.key === "Enter") {
        e.preventDefault();
        const $primera = dameDropdownGlobal().find(".combo-option").first();
        if ($primera.length) seleccionarOpcionCombo($combo, String($primera.attr("data-value")));
      }
    })
    .off("blur", "#contenedorGridReaseguradores .combo-input")
    .on("blur", "#contenedorGridReaseguradores .combo-input", function () {
      const $combo = $(this).closest(".combo-buscable");
      // pequeno delay para permitir procesar la seleccion con mousedown
      setTimeout(() => { cerrarCombo($combo); }, 120);
    });

  // mousedown (y no click) para seleccionar antes de que el input pierda el foco
  $(document)
    .off("mousedown", "#comboDropdownGlobal .combo-option")
    .on("mousedown", "#comboDropdownGlobal .combo-option", function (e) {
      e.preventDefault();
      if ($comboActivo) seleccionarOpcionCombo($comboActivo, String($(this).attr("data-value")));
    });

  // ===== INPUTS =====
  $(document)
    .off("focus", "#contenedorGridReaseguradores input.percent")
    .on("focus", "#contenedorGridReaseguradores input.percent", function () {
      setTimeout(() => { this.select(); }, 0);
    })
    .off("mousedown", "#contenedorGridReaseguradores input.percent")
    .on("mousedown", "#contenedorGridReaseguradores input.percent", function (e) {
      if (this !== document.activeElement) {
        e.preventDefault();
        this.focus();
      }
    })
    .off("input", "#contenedorGridReaseguradores input.cell-input")
    .on("input", "#contenedorGridReaseguradores input.cell-input", function () {

      const input = this;
      const $tr = $(input).closest("tr");
      const index = parseInt($tr.data("index"));

      const key = $(input).data("key");

      const val = numeroDe(input.value);

      const row = reaseguradoresData[index];
      const oldValue = key === "slip" ? getParticipantSlip(row) : (row[key] || 0);

      if (key === "split") {
        const totalSplit = reaseguradoresData.reduce((acc, participant, i) => {
          return acc + (i === index ? val : numeroDe(participant.split));
        }, 0);

        if (val < 0 || totalSplit > 100) {
          input.value = formatearRedondeado(oldValue, 5);
          mostrarNotificacion(`La suma de porcentajes no puede exceder 100%`, "warning");
          return;
        }

        row.split = val;
        recalculateParticipantAmounts(row);
      } else if (key === "slip") {
        const targetSlip = getDistributionPercentage();
        const totalSlip = reaseguradoresData.reduce((acc, participant, i) => {
          return acc + (i === index ? val : getParticipantSlip(participant));
        }, 0);

        if (val < 0 || totalSlip > targetSlip) {
          input.value = formatearRedondeado(oldValue, 5);
          mostrarNotificacion(`La suma de porcentajes Slip no puede exceder ${formatearRedondeado(targetSlip, 5)}%`, "warning");
          return;
        }

        row.slip = val;
        row.split = targetSlip === 0 ? 0 : redondear(val * 100 / targetSlip, 5, true);
        recalculateParticipantAmounts(row);
      }

      if (key === "split" || key === "slip") {
        adjustParticipantRoundingDifferences();
        refreshParticipantGridValues();
      } else {
        row[key] = val;
      }

    })

    // ===== BLUR  FORMATEO FINAL =====
    .off("blur", "#contenedorGridReaseguradores input.cell-input")
    .on("blur", "#contenedorGridReaseguradores input.cell-input", function () {

      const input = this;
      const $tr = $(input).closest("tr");
      const index = parseInt($tr.data("index"));

      const key = $(input).data("key");

      let val = key === "slip"
        ? getParticipantSlip(reaseguradoresData[index])
        : (reaseguradoresData[index][key] || 0);

      if (["sumInsured","premium","commission","tax"].includes(key)) {
        input.value = formatearMonto(val);
      } else {
        input.value = formatearRedondeado(val, 5);
      }

      if (["premium","commission"].includes(key)) {
        const saldoRea = redondearMonto(reaseguradoresData[index]["premium"] || 0) - redondearMonto(reaseguradoresData[index]["commission"] || 0);
        $tr.find('input[data-key="saldoRea"]').val(formatearMonto(saldoRea));
      }

      // Refrescar la fila de totales del grupo del broker correspondiente sin
      // re-renderizar todo (para no perder el foco del usuario)
      refrescarTotalesBroker($tr.closest("table"));

    });

  // ===== ELIMINAR =====
  $(document)
    .off("click", "#contenedorGridReaseguradores .btn-eliminar")
    .on("click", "#contenedorGridReaseguradores .btn-eliminar", function () {

      const index = parseInt($(this).data("index"));

      reaseguradoresData.splice(index, 1);

      renderGrid();
    });

}

function getNameAceptanteById(id) {
  return aceptantes.find(a => a.id === id)?.nombre || "";
}

///////////////////////////////////////////////////////////
/// Combo buscable (brokers / reaseguradores)
///////////////////////////////////////////////////////////

function escapeHtml(txt) {
  return String(txt ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getCoverageDisplayName(item) {
  const code = String(item?.coverageCode ?? item?.coverageId ?? "").trim();
  const coverageId = String(item?.coverageId ?? "").trim();
  const coverageRow = coverages.find(c =>
    String(c.code ?? "").trim() === code ||
    (coverageId && String(c.id ?? "").trim() === coverageId)
  );

  return coverageRow?.name || `Cobertura ${code || ""}`.trim();
}

function dameFilaCombo($combo) {
  const index = parseInt($combo.closest("tr").data("index"));
  return { index, row: reaseguradoresData[index] };
}

function dameOpcionesCombo($combo) {
  const { row } = dameFilaCombo($combo);

  if ($combo.hasClass("combo-broker")) {
    const opts = [{ value: "PRINCIPAL", label: "(Sin Broker - Principal)" }];
    // Fallback: broker guardado en datos pero sin rol CORRSEG en el catalogo
    if (row && row.brokerId != null && !brokers.some(b => b.id === row.brokerId)) {
      opts.push({ value: String(row.brokerId), label: getBrokerNombre(row.brokerId) || row.Broker?.name || `Broker ${row.brokerId}` });
    }
    brokers.forEach(b => opts.push({ value: String(b.id), label: b.nombre || `Broker ${b.id}` }));
    return opts;
  }

  // participante / reasegurador
  const opts = [];
  // Fallback: contacto guardado en datos pero sin rol REA en el catalogo
  if (row && row.contactId != null && !aceptantes.some(a => a.id === row.contactId)) {
    opts.push({ value: String(row.contactId), label: row.name || `Contacto ${row.contactId}` });
  }
  aceptantes.forEach(a => opts.push({ value: String(a.id), label: a.nombre || `Contacto ${a.id}` }));
  return opts;
}

function valorSeleccionadoCombo($combo) {
  const { row } = dameFilaCombo($combo);
  if (!row) return "";
  if ($combo.hasClass("combo-broker"))
    return row.brokerId == null ? "PRINCIPAL" : String(row.brokerId);
  return row.contactId != null ? String(row.contactId) : "";
}

function textoSeleccionCombo($combo) {
  const { row } = dameFilaCombo($combo);
  if (!row) return "";
  if ($combo.hasClass("combo-broker")) {
    return row.brokerId == null
      ? "(Sin Broker - Principal)"
      : (getBrokerNombre(row.brokerId) || row.Broker?.name || `Broker ${row.brokerId}`);
  }
  return getNameAceptanteById(row.contactId) || row.name || "";
}

// El dropdown se renderiza como un nico nodo global en <body> con
// position:fixed: si viviera dentro de la celda, los contenedores con
// overflow de las tablas lo recortaran.
let $comboActivo = null;

function dameDropdownGlobal() {
  let $dd = $("#comboDropdownGlobal");
  if (!$dd.length) {
    $dd = $('<div id="comboDropdownGlobal"></div>').appendTo("body");

    // cerrar al hacer scroll fuera del dropdown o al redimensionar,
    // para que la lista no quede "flotando" lejos de su input
    window.addEventListener("scroll", (e) => {
      if ($comboActivo && !$dd[0].contains(e.target)) cerrarCombo($comboActivo);
    }, true);
    window.addEventListener("resize", () => {
      if ($comboActivo) cerrarCombo($comboActivo);
    });
  }
  return $dd;
}

function posicionarDropdownGlobal($combo) {
  const $dd = dameDropdownGlobal();
  const rect = $combo[0].getBoundingClientRect();

  const ancho = Math.min(Math.max(rect.width, 300), 480);
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - ancho - 8));

  // abrir hacia arriba cuando no hay espacio suficiente debajo del input
  const espacioAbajo = window.innerHeight - rect.bottom;
  const abrirArriba = espacioAbajo < 220 && rect.top > 240;

  $dd.css({
    left: `${left}px`,
    width: `${ancho}px`,
    top: abrirArriba ? "auto" : `${rect.bottom + 4}px`,
    bottom: abrirArriba ? `${window.innerHeight - rect.top + 4}px` : "auto"
  });
}

function renderOpcionesCombo($combo, opciones, filtro) {
  const filtroNorm = limpiarTexto(filtro);
  const seleccionado = valorSeleccionadoCombo($combo);

  const visibles = filtroNorm
    ? opciones.filter(o => limpiarTexto(o.label).includes(filtroNorm))
    : opciones;

  let html = "";
  if (visibles.length === 0) {
    html = `<div class="combo-empty">Sin resultados para "${escapeHtml(filtro)}"</div>`;
  } else {
    visibles.forEach(o => {
      const sel = String(o.value) === seleccionado ? " selected" : "";
      html += `<div class="combo-option${sel}" data-value="${escapeHtml(String(o.value))}" title="${escapeHtml(o.label)}">${escapeHtml(o.label)}</div>`;
    });
  }

  dameDropdownGlobal().html(html);
}

function abrirCombo($combo) {
  if ($comboActivo && $comboActivo[0] !== $combo[0]) cerrarCombo($comboActivo);
  $comboActivo = $combo;
  renderOpcionesCombo($combo, dameOpcionesCombo($combo), "");
  posicionarDropdownGlobal($combo);
  dameDropdownGlobal().show();
  $combo.addClass("open");
}

function cerrarCombo($combo) {
  if (!$combo || !$combo.length) return;
  $combo.removeClass("open");
  // restaurar el texto de la seleccion vigente (por si el usuario dejo un filtro escrito)
  $combo.find(".combo-input").val(textoSeleccionCombo($combo));
  if ($comboActivo && $comboActivo[0] === $combo[0]) {
    $comboActivo = null;
    dameDropdownGlobal().hide();
  }
}

function seleccionarOpcionCombo($combo, valor) {
  const { row } = dameFilaCombo($combo);
  if (!row) return;

  const $tr = $combo.closest("tr");

  if ($combo.hasClass("combo-broker")) {
    if (!valor || valor === "PRINCIPAL") {
      row.brokerId = null;
      row.Broker = null;
    } else {
      const brokerId = parseInt(valor);
      const brokerInfo = brokers.find(b => b.id === brokerId);
      row.brokerId = brokerId;
      row.Broker = brokerInfo ? { id: brokerInfo.id, name: brokerInfo.nombre } : (row.Broker ?? null);
    }
    // cerrar antes de re-renderizar: el dropdown global quedara flotando
    // sobre una fila que ya no existe
    cerrarCombo($combo);
    // Re-renderizar para reflejar el cambio en la agrupacion por broker
    renderGrid();
    return;
  }

  // participante / reasegurador
  const id = parseInt(valor);
  if (isNaN(id)) return;

  row.contactId = id;
  // Si el contacto esta en aceptantes usar su nombre, si no preservar el actual
  const nombreNuevo = getNameAceptanteById(id);
  if (nombreNuevo) row.name = nombreNuevo;

  $tr.find("td.col-contact-id").text(id);
  $tr.find("td.col-participante").attr("title", row.name || "");
  cerrarCombo($combo);
}

// Recalcula la fila de totales de un grupo de broker en sitio, leyendo los
// valores actuales de reaseguradoresData (no re-renderiza para preservar el
// foco del usuario en el input que esta editando).
function refrescarTotalesBroker($table) {
  if (!$table || !$table.length) return;

  const indicesEnGrupo = $table.find("tbody tr[data-index]").map(function () {
    return parseInt($(this).data("index"));
  }).get();

  const totales = indicesEnGrupo.reduce((acc, idx) => {
    const r = reaseguradoresData[idx];
    if (!r) return acc;
    const split      = numeroDe(r.split);
    const slip       = getParticipantSlip(r);
    const sumInsured = numeroDe(r.sumInsured);
    const premium    = numeroDe(r.premium);
    const commission = numeroDe(r.commission);
    const tax        = numeroDe(r.tax);
    acc.split      += split;
    acc.slip       += slip;
    acc.sumInsured += sumInsured;
    acc.premium    += premium;
    acc.commission += commission;
    acc.saldoRea   += (premium - commission);
    acc.tax        += tax;
    return acc;
  }, { split: 0, slip: 0, sumInsured: 0, premium: 0, commission: 0, saldoRea: 0, tax: 0 });

  const $totalRow = $table.find("tbody tr.row-total-broker");
  if (!$totalRow.length) return;

  const $tds = $totalRow.find("td.num");
  // Orden esperado: split %, suma, prima, comision, impuesto, saldoRea
    $tds.eq(0).text(`${formatearRedondeado(totales.split, 5)}%`);
  $tds.eq(1).text(`${formatearRedondeado(totales.slip, 5)}%`);
  $tds.eq(2).text(formatearMonto(totales.sumInsured));
  $tds.eq(3).text(formatearMonto(totales.premium));
  $tds.eq(4).text(formatearMonto(totales.commission));
  $tds.eq(5).text(formatearMonto(totales.tax));
  $tds.eq(6).text(formatearMonto(totales.saldoRea));
}

function renderFiltroBroker() {

  const $select = $("#filtroBroker");
  if (!$select.length) return;

  // Union de brokers cargados + brokers presentes en los datos guardados (por si vienen IDs no listados)
  const brokerOptions = [];
  brokers.forEach(b => {
    brokerOptions.push({ id: b.id, nombre: b.nombre });
  });
  reaseguradoresData.forEach(r => {
    if (r.brokerId != null && !brokerOptions.find(x => x.id === r.brokerId)) {
      brokerOptions.push({ id: r.brokerId, nombre: getBrokerNombre(r.brokerId) || r.Broker?.name || "" });
    }
  });

  brokerOptions.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));

  let html = `
    <option value="ALL">Todos los reaseguradores</option>
    <option value="PRINCIPAL">Reaseguradores Principales</option>
  `;

  brokerOptions.forEach(b => {
    html += `<option value="${b.id}">Reaseguradores del Broker: ${b.nombre}</option>`;
  });

  $select.html(html);
  $select.val(filtroBrokerSeleccionado);
}

function dameTotalBase() {

  let totalBase = {}
  
  switch(tipoContratoSelected.toUpperCase()){
    case "CUOTA PARTE":
      totalBase = {
        sumInsured: redondearMonto($("#mscp").val()) ?? 0,
        premium: redondearMonto($("#mpcp").val()) ?? 0,
        commission: redondearMonto($("#mccp").val()) ?? 0,
        tax: redondearMonto($("#micp").val()) ?? 0
      };
      break;
    case "FAC":
      totalBase = {
        sumInsured: redondearMonto($("#msfp").val()) ?? 0,
        premium: redondearMonto($("#mpfp").val()) ?? 0,
        commission: redondearMonto($("#mcfp").val()) ?? 0,
        tax: redondearMonto($("#mifp").val()) ?? 0
      };
      break;
    case "COASEGURO":
      totalBase = {
        sumInsured: redondearMonto($("#msco").val()) ?? 0,
        premium: redondearMonto($("#mpco").val()) ?? 0,
        commission: redondearMonto($("#mcco").val()) ?? 0,
        tax: redondearMonto($("#mico").val()) ?? 0
      };
      break;
  }

  return totalBase;  
  
}

function getDistributionPercentage() {
  const controlByLine = {
    "CUOTA PARTE": "pcp",
    "FAC": "pfp",
    "COASEGURO": "pco"
  };
  const controlId = controlByLine[normalizeCondition(tipoContratoSelected)];
  return controlId ? numeroDe($(`#${controlId}`).val()) : 0;
}

function getParticipantSlip(participant) {
  if (participant?.slip !== undefined && participant?.slip !== null) {
    return redondear(numeroDe(participant.slip), 5, true);
  }

  if (normalizeCondition(participant?.lineId) === "COASEGURO") {
    return redondear(numeroDe(participant?.split), 5, true);
  }

  return redondear(
    numeroDe(participant?.split) * getParticipantDistributionPercentage(participant) / 100,
    5,
    true
  );
}

function getParticipantDistributionPercentage(participant) {
  if (normalizeCondition(participant?.lineId) === "COASEGURO") {
    return numeroDe($("#pco").val());
  }
  return getDistributionPercentage();
}

function recalculateParticipantAmounts(participant) {
  const base = normalizeCondition(participant?.lineId) === "COASEGURO"
    ? getCoaseguroGlobalBase()
    : dameTotalBase();
  const factor = numeroDe(participant.split) / 100;
  const premium = redondearMonto(base.premium * factor);
  const commission = redondearMonto(base.commission * factor);

  participant.sumInsured = redondearMonto(base.sumInsured * factor);
  participant.premium = premium;
  participant.commission = commission;
  participant.tax = redondearMonto(base.tax * factor);
  participant.saldoRea = redondearMonto(premium - commission);
  participant.slip = normalizeCondition(participant?.lineId) === "COASEGURO"
    ? redondear(numeroDe(participant.split), 5, true)
    : redondear(numeroDe(participant.split) * getParticipantDistributionPercentage(participant) / 100, 5, true);
}

function adjustParticipantRoundingDifferences() {
  if (!reaseguradoresData.length) return;

  const totalSplit = reaseguradoresData.reduce((total, participant) => total + numeroDe(participant.split), 0);
  if (Math.abs(totalSplit - 100) > 0.00001) return;

  const totalBase = dameTotalBase();
  reaseguradoresData.forEach(recalculateParticipantAmounts);

  ajustarDiferenciaAlMayor(reaseguradoresData, "sumInsured", totalBase.sumInsured);
  ajustarDiferenciaAlMayor(reaseguradoresData, "premium", totalBase.premium);
  ajustarDiferenciaAlMayor(reaseguradoresData, "commission", totalBase.commission);
  ajustarDiferenciaAlMayor(reaseguradoresData, "tax", totalBase.tax);

  const targetSlip = getDistributionPercentage();
  const totalSlip = reaseguradoresData.reduce((total, participant) => total + getParticipantSlip(participant), 0);
  const slipDifference = redondear(targetSlip - totalSlip, 5, true);
  if (Math.abs(slipDifference) <= 0.00001) {
    const participantWithLargestAmount = reaseguradoresData.reduce((largest, participant) => {
      if (!largest) return participant;
      return numeroDe(participant.sumInsured) > numeroDe(largest.sumInsured) ? participant : largest;
    }, null);
    if (participantWithLargestAmount) {
      participantWithLargestAmount.slip = redondear(
        getParticipantSlip(participantWithLargestAmount) + slipDifference,
        5,
        true
      );
    }
  }
}

function refreshParticipantGridValues() {
  const activeElement = document.activeElement;

  $("#contenedorGridReaseguradores tr[data-index]").each(function () {
    const index = Number($(this).data("index"));
    const participant = reaseguradoresData[index];
    if (!participant) return;

    const setValue = (selector, value) => {
      const element = $(this).find(selector)[0];
      if (element && element !== activeElement) $(element).val(value);
    };

    setValue('input[data-key="split"]', formatInput(participant.split, "percent"));
    setValue('input[data-key="slip"]', formatInput(getParticipantSlip(participant), "percent"));
    setValue('input[data-key="sumInsured"]', formatearMonto(participant.sumInsured));
    setValue('input[data-key="premium"]', formatearMonto(participant.premium));
    setValue('input[data-key="commission"]', formatearMonto(participant.commission));
    setValue('input[data-key="tax"]', formatearMonto(participant.tax));
    setValue('input[data-key="saldoRea"]', formatearMonto(participant.saldoRea));
  });

  $("#contenedorGridReaseguradores table.grid-reaseguradores").each(function () {
    refrescarTotalesBroker($(this));
  });
}

function agruparParticipantsCuotaParte(cessions, contrato) {

  const resultado = {};
  const cessionsSeleccionadas = cessions.filter(c => filterCondition(contrato, c));

  cessionsSeleccionadas
    .flatMap(c => (c.Participants || []).map(p => ({ ...p, coverageCode: c.coverageCode })))
    .forEach(p => {

      // Agrupar por contactId + brokerId para mantener separadas las participaciones
      // de un mismo reasegurador a traves de distintos brokers (incluyendo "principal" cuando brokerId es null)
      const key = `${p.contactId}_${p.brokerId ?? "PRINCIPAL"}`;

      if (!resultado[key]) {
        resultado[key] = {
          id: p.id,
          cessionId: p.cessionId,
          name: p.name,
          contactId: p.contactId,
          lineId: p.lineId,
          currency: p.currency,
          liquidationId: p.liquidationId,
          reserve: p.reserve,
          brokerId: p.brokerId ?? null,
          Broker: p.Broker ?? null,
          fee: p.fee,
          jAmounts: p.jAmounts,

          // acumuladores
          split: 0,
          sumInsured: 0,
          premium: 0,
          commission: 0,
          tax: 0,

          // control interno
          _primerProcesado: false
        };
      }

      const acc = resultado[key];

      // El `split` (porcentaje de participacion) es constante por contacto/broker
      // a traves de las coberturas, asi que se toma una sola vez del primer
      // participante procesado del grupo.
      if (!acc._primerProcesado) {
        acc.split += p.split || 0;
        acc._primerProcesado = true;
      }

      // La suma asegurada, prima, comision e impuesto SI varian por cobertura
      // y deben sumarse a traves de todas las coberturas del grupo para que
      // el total mostrado coincida con la distribucion del contrato.
      // Para sumInsured se aplica `montoSiEsCobertura` para que solo se
      // computen las coberturas marcadas como `isCoverage = SI`, igual que
      // se hace en la grilla de distribucion (mscp/msfp/msco).
      acc.sumInsured += montoSiEsCobertura(p.coverageCode, p.sumInsured || 0);
      acc.premium += p.premium || 0;
      acc.commission += p.commission || 0;
      acc.tax += p.tax || 0;

      // ===== MXIMOS =====
      acc.reserve = Math.max(acc.reserve || 0, p.reserve || 0);
      acc.fee = Math.max(acc.fee || 0, p.fee || 0);

    });

  const resultados = Object.values(resultado);

  resultados.forEach(acc => {
    acc.split = redondear(acc.split || 0, 5, true);
    acc.slip = redondear(acc.split * getDistributionPercentage() / 100, 5, true);
    acc.sumInsured = redondearMonto(acc.sumInsured || 0);
    acc.premium = redondearMonto(acc.premium || 0);
    acc.commission = redondearMonto(acc.commission || 0);
    acc.tax = redondearMonto(acc.tax || 0);

    // limpiar propiedad interna
    delete acc._primerProcesado;
  });

  // Ajustar nuevamente despues de agrupar por participante, que es el nivel
  // que finalmente se muestra en la grilla.
  const totalesObjetivo = cessionsSeleccionadas.reduce((acc, c) => {
    acc.sumInsured += montoSiEsCobertura(c.coverageCode, c.sumInsuredRe || 0);
    acc.premium += numeroDe(c.premiumRe);
    acc.commission += numeroDe(c.comissionCedant);
    acc.tax += numeroDe(c.tax);
    return acc;
  }, { sumInsured: 0, premium: 0, commission: 0, tax: 0 });

  ajustarDiferenciaAlMayor(resultados, "sumInsured", totalesObjetivo.sumInsured);
  ajustarDiferenciaAlMayor(resultados, "premium", totalesObjetivo.premium);
  ajustarDiferenciaAlMayor(resultados, "commission", totalesObjetivo.commission);
  ajustarDiferenciaAlMayor(resultados, "tax", totalesObjetivo.tax);

  return resultados;
}

function abrirAceptantes(idControl, contrato) {
  if (normalizeCondition(contrato) === "COASEGURO") {
    mostrarNotificacion("El coaseguro no usa la grilla de reaseguradores.", "warning");
    return;
  }

  //Cargo mis aceptantes
  reaseguradoresData = agruparParticipantsCuotaParte(cessions, contrato);
  updateAceptantesTabState(true);
  renderGrid();
  
  // Oculta todas las pestanas
  $("#tabsDistribucion .tab-content").hide();

  // Muestra solo la pestana de Reaseguradores
  $("#tabReaseguradores").show();

  // Actualiza boton activo
  $("#tabsDistribucion .tab-btn").removeClass("active");
  $('#tabsDistribucion .tab-btn[data-tab="tabReaseguradores"]').addClass("active");

}

function refreshReaseguradoresTab() {
  if (!tipoContratoSelected) return;
  reaseguradoresData = agruparParticipantsCuotaParte(cessions, tipoContratoSelected);
  renderGrid();
}

function updateAceptantesTabState(enabled) {
  aceptantesTabEnabled = Boolean(enabled);
  syncAceptantesTabState();
}

function updateCoaseguradoresTabState(enabled) {
  coaseguradoresTabEnabled = Boolean(enabled);
  syncCoaseguradoresTabState();
}

function showDistributionTab() {
  const $tab = $('#tabsDistribucion .tab-btn[data-tab="tabControles"]');
  const $content = $("#tabControles");
  if (!$tab.length || !$content.length) return;

  $("#tabsDistribucion .tab-btn").removeClass("active");
  $tab.addClass("active");
  $("#tabsDistribucion .tab-content").hide();
  $content.show();
}

function showReaseguradoresTab() {
  const $tab = $('#tabsDistribucion .tab-btn[data-tab="tabReaseguradores"]');
  const $content = $("#tabReaseguradores");
  if (!$tab.length || !$content.length) return;

  $("#tabsDistribucion .tab-btn").removeClass("active");
  $tab.addClass("active");
  $("#tabsDistribucion .tab-content").hide();
  $content.show();
}

function showCoaseguradoresTab() {
  const $tab = $('#tabsDistribucion .tab-btn[data-tab="tabCoaseguradores"]');
  const $content = $("#tabCoaseguradores");
  if (!$tab.length || !$content.length) return;

  $("#tabsDistribucion .tab-btn").removeClass("active");
  $tab.addClass("active");
  $("#tabsDistribucion .tab-content").hide();
  $content.show();
}

function markDistributionDirty() {
  distributionDirty = true;
  syncAceptantesTabState();
  syncCoaseguradoresTabState();
}

function syncAceptantesTabState() {
  const $tab = $('#tabsDistribucion .tab-btn[data-tab="tabReaseguradores"]');
  if (!$tab.length) return;

  const enabled = Boolean(aceptantesTabEnabled);
  $tab.prop("disabled", !enabled);
  $tab.toggleClass("tab-disabled", !enabled);

  if (!enabled) {
    $tab.attr("title", "Primero use la opción de mostrar participantes");
  } else if (distributionDirty) {
    $tab.attr("title", "Debe guardar la distribución para reflejar los cambios en Participantes");
  } else {
    $tab.attr("title", "Ver Participantes");
  }
}

function setAceptanteButtonsEnabled(enabled) {
  const isEnabled = Boolean(enabled);

  $("#controlesDistribucion .btn-aceptante")
    .prop("disabled", !isEnabled)
    .toggleClass("tab-disabled", !isEnabled)
    .attr(
      "title",
      isEnabled
        ? "Ver reaseguradores"
        : "Seleccione una distribución para ver reaseguradores"
    );
}

function syncCoaseguradoresTabState() {
  const $tab = $('#tabsDistribucion .tab-btn[data-tab="tabCoaseguradores"]');
  if (!$tab.length) return;

  const enabled = Boolean(coaseguradoresTabEnabled);
  $tab.prop("disabled", !enabled);
  $tab.toggleClass("tab-disabled", !enabled);

  if (!enabled) {
    $tab.attr("title", "La póliza no tiene coaseguro configurado");
  } else if (distributionDirty) {
    $tab.attr("title", "Debe guardar la distribución para reflejar los cambios en Coaseguro");
  } else {
    $tab.attr("title", "Ver Coaseguro");
  }

  syncLeyendaCoaseguroGlobal();
}

function syncLeyendaCoaseguroGlobal() {
  const existeCoaseguro =
    (Array.isArray(coCessions) && coCessions.length > 0) ||
    cessions.some(item => normalizeCondition(item.lineId) === "COASEGURO") ||
    numeroDe($("#pco").val()) > 0;

  $("#tabsDistribucion .leyenda-coaseguro-global").toggle(existeCoaseguro);
}

function setCoaseguradorButtonsEnabled(enabled) {
  const isEnabled = Boolean(enabled);

  $("#controlesDistribucion .btn-coasegurador")
    .prop("disabled", !isEnabled)
    .toggleClass("tab-disabled", !isEnabled)
    .attr(
      "title",
      isEnabled
        ? "Ver coaseguradores"
        : "Seleccione una distribucion de coaseguro para ver coaseguradores"
    );
}

let excelLibraryPromise = null;

function normalizarEncabezadoCargaMasiva(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function cargarLectorExcel() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (excelLibraryPromise) return excelLibraryPromise;

  excelLibraryPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
    script.onload = () => window.XLSX ? resolve(window.XLSX) : reject(new Error("No se pudo inicializar el lector Excel"));
    script.onerror = () => reject(new Error("No se pudo cargar el lector Excel. Verifique la conexión o contacte a sistemas."));
    document.head.appendChild(script);
  });

  return excelLibraryPromise;
}

function resolverContactoCargaMasiva(value, lista, tipo, fila) {
  const texto = String(value ?? "").trim();
  if (!texto) return null;

  const idNumerico = /^\d+$/.test(texto) ? Number(texto) : null;
  const encontrado = idNumerico !== null
    ? lista.find(x => Number(x.id) === idNumerico)
    : lista.find(x => normalizarEncabezadoCargaMasiva(x.nombre) === normalizarEncabezadoCargaMasiva(texto));

  if (!encontrado) {
    throw new Error(`Fila ${fila}: ${tipo} "${texto}" no fue encontrado en el catálogo.`);
  }

  return encontrado;
}

function obtenerIndicesCargaMasiva(headers) {
  const aliases = {
    broker: ["broker", "idbroker", "brokerid", "codigobroker", "codbroker"],
    participante: ["participante", "idparticipante", "participanteid", "aceptante", "idaceptante", "reasegurador", "idreasegurador"],
    participacion: ["porcentaje", "participacion", "split", "porcentajeparticipacion", "porcentajedeparticipacion", "porcparticipacion"],
    slip: ["slip", "porcentajeslip", "porcentajedeslip", "porcentajedelacolocacion", "porcentajecolocacion"],
    comision: ["comision", "commission", "montocomision"],
    impuesto: ["impuesto", "tax", "montoimpuesto"]
  };

  const indices = {};
  const duplicados = [];

  headers.forEach((header, index) => {
    const normalizado = normalizarEncabezadoCargaMasiva(header);
    const campo = Object.keys(aliases).find(key => aliases[key].includes(normalizado));
    if (!campo) return;
    if (indices[campo] !== undefined) duplicados.push(campo);
    indices[campo] = index;
  });

  const camposObligatorios = ["broker", "participante", "comision", "impuesto"];
  const faltantes = camposObligatorios.filter(key => indices[key] === undefined);
  if (indices.participacion === undefined && indices.slip === undefined) {
    faltantes.push("participacion o slip");
  }
  if (duplicados.length || faltantes.length) {
    const detalle = [];
    if (faltantes.length) detalle.push(`faltan: ${faltantes.join(", ")}`);
    if (duplicados.length) detalle.push(`duplicados: ${[...new Set(duplicados)].join(", ")}`);
    throw new Error(`La estructura no es válida (${detalle.join("; ")}). Encabezados esperados: Broker, Participante, Porcentaje, Comisión, Impuesto.`);
  }

  return indices;
}

async function leerCargaMasivaExcel(file) {
  if (!file) throw new Error("Seleccione un archivo Excel.");
  if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
    throw new Error("El archivo debe tener formato .xlsx, .xls o .csv.");
  }
  if (!tipoContratoSelected) {
    throw new Error("Seleccione primero una línea de distribución antes de cargar el archivo.");
  }

  const XLSX = await cargarLectorExcel();
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const nombreHoja = workbook.SheetNames?.[0];
  if (!nombreHoja) throw new Error("El archivo no contiene hojas de cálculo.");

  const filas = XLSX.utils.sheet_to_json(workbook.Sheets[nombreHoja], {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false
  });

  const filaEncabezados = filas.findIndex(fila => fila.some(valor => String(valor ?? "").trim() !== ""));
  if (filaEncabezados < 0) throw new Error("El archivo está vacío.");

  const indices = obtenerIndicesCargaMasiva(filas[filaEncabezados]);
  const base = dameTotalBase();
  const targetSlip = getDistributionPercentage();
  const resultado = [];
  const errores = [];

  filas.slice(filaEncabezados + 1).forEach((fila, offset) => {
    const numeroFila = filaEncabezados + offset + 2;
    if (fila.every(valor => String(valor ?? "").trim() === "")) return;

    try {
      const brokerValor = fila[indices.broker];
      const participanteValor = fila[indices.participante];
      const participacionValor = indices.participacion === undefined ? "" : fila[indices.participacion];
      const slipValor = indices.slip === undefined ? "" : fila[indices.slip];
      const comisionValor = fila[indices.comision];
      const impuestoValor = fila[indices.impuesto];
      const tieneParticipacion = String(participacionValor ?? "").trim() !== "";
      const tieneSlip = String(slipValor ?? "").trim() !== "";
      const participacion = numeroDe(participacionValor);
      const slip = numeroDe(slipValor);
      const comision = numeroDe(comisionValor);
      const impuesto = numeroDe(impuestoValor);
      if (!String(participanteValor ?? "").trim()) throw new Error(`Fila ${numeroFila}: Participante es obligatorio.`);
      const broker = resolverContactoCargaMasiva(brokerValor, brokers, "Broker", numeroFila);
      const participante = resolverContactoCargaMasiva(participanteValor, aceptantes, "Participante", numeroFila);

      if (!tieneParticipacion && !tieneSlip) {
        throw new Error(`Fila ${numeroFila}: debe informar Participación o Slip.`);
      }
      if (tieneSlip && (!Number.isFinite(slip) || slip < 0 || slip > targetSlip)) {
        throw new Error(`Fila ${numeroFila}: Slip debe ser un número entre 0 y ${formatearRedondeado(targetSlip, 5)}%.`);
      }
      if (!tieneSlip && (!Number.isFinite(participacion) || participacion < 0 || participacion > 100)) {
        throw new Error(`Fila ${numeroFila}: Participación debe ser un número entre 0 y 100.`);
      }
      if (!String(comisionValor ?? "").trim() || !Number.isFinite(comision) || comision < 0) {
        throw new Error(`Fila ${numeroFila}: Comisión debe ser un monto mayor o igual a 0.`);
      }
      if (!String(impuestoValor ?? "").trim() || !Number.isFinite(impuesto) || impuesto < 0) {
        throw new Error(`Fila ${numeroFila}: Impuesto debe ser un monto mayor o igual a 0.`);
      }

      const porcentajeFinal = tieneSlip
        ? (targetSlip === 0 ? 0 : slip * 100 / targetSlip)
        : participacion;
      const slipFinal = targetSlip === 0 ? 0 : porcentajeFinal * targetSlip / 100;
      const factor = porcentajeFinal / 100;
      const premium = redondearMonto(base.premium * factor);
      const commission = redondearMonto(comision);
      resultado.push({
        name: participante.nombre,
        contactId: participante.id,
        cessionId: 0,
        lineId: tipoContratoSelected,
        split: redondear(porcentajeFinal, 5, true),
        slip: redondear(slipFinal, 5, true),
        sumInsured: formatearMonto(base.sumInsured * factor),
        premium: formatearMonto(premium),
        commission: formatearMonto(commission),
        saldoRea: formatearMonto(premium - commission),
        tax: formatearMonto(impuesto),
        brokerId: broker?.id ?? null,
        Broker: broker ? { id: broker.id, name: broker.nombre } : null
      });
    } catch (error) {
      errores.push(error.message || String(error));
    }
  });

  if (!resultado.length && !errores.length) throw new Error("El archivo no contiene filas de datos.");
  if (errores.length) {
    const detalle = errores.slice(0, 8).map(escapeHtml).join("<br>");
    const adicional = errores.length > 8 ? `<br>... y ${errores.length - 8} error(es) adicional(es).` : "";
    throw new Error(`${detalle}${adicional}`);
  }

  const totalPorcentaje = resultado.reduce((total, fila) => total + numeroDe(fila.split), 0);
  if (redondear(totalPorcentaje, 5, true) > 100) {
    throw new Error(`La suma de los porcentajes es ${formatearRedondeado(totalPorcentaje, 5)}% y no puede superar 100%.`);
  }

  const totalSlip = resultado.reduce((total, fila) => total + getParticipantSlip(fila), 0);
  if (redondear(totalSlip, 5, true) > redondear(targetSlip, 5, true)) {
    throw new Error(`La suma de los porcentajes Slip es ${formatearRedondeado(totalSlip, 5)}% y no puede superar ${formatearRedondeado(targetSlip, 5)}%.`);
  }

  return resultado;
}

function cerrarModalCargaMasiva() {
  $("#modalCargaMasiva").remove();
}

async function descargarPlantillaCargaMasiva() {
  try {
    const XLSX = await cargarLectorExcel();
    const hoja = XLSX.utils.aoa_to_sheet([
      ["Broker", "Participante", "Slip", "Comision", "Impuesto"]
    ]);

    hoja["!cols"] = [
      { wch: 18 },
      { wch: 24 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 }
    ];

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Reaseguradores");
    XLSX.writeFile(libro, "Plantilla_Carga_Masiva_Reaseguradores.xlsx");
  } catch (error) {
    mostrarNotificacion(`No se pudo descargar la plantilla: ${error?.message || error}`, "warning");
  }
}

function abrirModalCargaMasiva() {
  $("#modalCargaMasiva").remove();
  const html = `
    <div id="modalCargaMasiva" class="carga-masiva-overlay">
      <div class="carga-masiva-modal" role="dialog" aria-modal="true" aria-labelledby="tituloCargaMasiva">
        <div class="carga-masiva-header">
          <h3 id="tituloCargaMasiva">Carga Masiva de Reaseguradores</h3>
          <button type="button" class="carga-masiva-close" aria-label="Cerrar">&times;</button>
        </div>
        <div class="carga-masiva-body">
          <p>Seleccione un archivo Excel con una hoja que contenga estos encabezados:</p>
          <div class="carga-masiva-estructura">
            <strong>Broker</strong><span>id o nombre</span>
            <strong>Participante</strong><span>id o nombre</span>
            <strong>Participación o Slip</strong><span>al menos uno; si vienen ambos, prevalece Slip</span>
            <strong>Comisión</strong><span>monto</span>
            <strong>Impuesto</strong><span>monto</span>
          </div>
          <p class="carga-masiva-ayuda">Los encabezados pueden estar en otro orden y cambiar mayúsculas, acentos o separadores. Broker vacío significa Principal. Participación se interpreta sobre el 100% y Slip sobre el porcentaje de la colocación actual. Si vienen ambos, prevalece Slip. Suma y Prima se calcularán automáticamente. Comisión e Impuesto se tomarán desde el archivo.</p>
          <p class="carga-masiva-ayuda">Participación se interpreta sobre el 100% y Slip sobre el porcentaje de la colocación actual. Si vienen ambos, prevalece Slip. Suma y Prima se calculan automáticamente.</p>
          <input id="archivoCargaMasiva" type="file" accept=".xlsx,.xls,.csv" />
          <div id="cargaMasivaEstado" class="carga-masiva-estado" aria-live="polite"></div>
        </div>
        <div class="carga-masiva-footer">
          <button type="button" class="ant-btn carga-masiva-plantilla">Descargar Plantilla</button>
          <button type="button" class="ant-btn carga-masiva-cancelar">Cancelar</button>
          <button type="button" class="ant-btn ant-btn-primary carga-masiva-procesar" disabled>Procesar Archivo</button>
        </div>
      </div>
    </div>`;

  $("body").append(html);
  let filasImportadas = null;
  const estado = (mensaje, clase = "") => $("#cargaMasivaEstado").attr("class", `carga-masiva-estado ${clase}`).html(mensaje);

  $(".carga-masiva-plantilla").on("click", descargarPlantillaCargaMasiva);

  $("#archivoCargaMasiva").on("change", async function () {
    filasImportadas = null;
    $(".carga-masiva-procesar").prop("disabled", true);
    const file = this.files?.[0];
    if (!file) return;
    estado("Validando archivo...", "cargando");
    try {
      filasImportadas = await leerCargaMasivaExcel(file);
      estado(`Archivo válido: ${filasImportadas.length} fila(s) listas para reemplazar la grilla.`, "exito");
      $(".carga-masiva-procesar").prop("disabled", false);
    } catch (error) {
      estado(error.message || String(error), "error");
    }
  });

  $(".carga-masiva-procesar").on("click", function () {
    if (!filasImportadas?.length) return;
    reaseguradoresData = filasImportadas;
    filtroBrokerSeleccionado = "ALL";
    renderGrid();
    cerrarModalCargaMasiva();
    mostrarNotificacion(`Carga masiva aplicada: ${filasImportadas.length} fila(s).`, "success");
  });

  $(".carga-masiva-close, .carga-masiva-cancelar").on("click", cerrarModalCargaMasiva);
  $("#modalCargaMasiva").on("click", function (event) {
    if (event.target === this) cerrarModalCargaMasiva();
  });
}


function renderGrid() {

  // Refrescar el filtro: brokers en datos pueden haber cambiado
  renderFiltroBroker();

  const $contenedor = $("#contenedorGridReaseguradores");
  $contenedor.empty();

  // Indexar reaseguradoresData manteniendo el ndice original
  const filasIndexadas = reaseguradoresData.map((r, index) => ({ row: r, index }));

  // Aplicar filtro
  let filasFiltradas;
  if (filtroBrokerSeleccionado === "ALL") {
    filasFiltradas = filasIndexadas;
  } else if (filtroBrokerSeleccionado === "PRINCIPAL") {
    filasFiltradas = filasIndexadas.filter(x => x.row.brokerId == null);
  } else {
    const brokerIdNum = parseInt(filtroBrokerSeleccionado);
    filasFiltradas = filasIndexadas.filter(x => x.row.brokerId === brokerIdNum);
  }

  // Agrupar por broker
  const grupos = new Map();
  filasFiltradas.forEach(x => {
    const key = x.row.brokerId == null ? "PRINCIPAL" : String(x.row.brokerId);
    if (!grupos.has(key)) {
      const titulo = x.row.brokerId == null
        ? "Reaseguradores Principales"
        : `Reaseguradores del Broker: ${getBrokerNombre(x.row.brokerId) || x.row.Broker?.name || ""}`;
      grupos.set(key, { titulo, filas: [] });
    }
    grupos.get(key).filas.push(x);
  });

  // Si no hay nada que mostrar
  if (grupos.size === 0) {
    $contenedor.append(`
      <div class="reaseguradores-empty">
        No hay reaseguradores para la vista seleccionada.
      </div>
    `);
    return;
  }

  // Renderizar una tabla por grupo
  grupos.forEach(grupo => {

    const $bloque = $(`
      <div class="reaseguradores-grupo">
        <h4 class="reaseguradores-grupo-titulo">${grupo.titulo}</h4>
        <table class="ant-table grid-reaseguradores">
          <thead>
            <tr>
              <th>Broker/MGA</th>
              <th>Participante</th>
              <th>ID Participante</th>
              <th>ID de línea</th>
              <th>% Participación</th>
              <th>% Slip</th>
              <th>Suma Asegurada</th>
              <th>Prima</th>
              <th>Comisión</th>
              <th>Impuesto</th>
              <th>Saldo Rea.</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    `);

    const $tbody = $bloque.find("tbody");

    grupo.filas.forEach(({ row: r, index }) => {

      // Nombre actual del broker para tooltip de la celda
      const brokerNombreActual = r.brokerId == null
        ? "(Sin Broker - Principal)"
        : (getBrokerNombre(r.brokerId) || r.Broker?.name || `Broker ${r.brokerId}`);

      // Fallback: si el contactId del participante no esta en `aceptantes`
      // (p.ej. cuando el contacto no tiene rol REA pero si esta asociado a
      // un broker en CP), usar `r.name` para no mostrar la celda vaca.
      const participanteNombreActual = getNameAceptanteById(r.contactId)
        || r.name
        || (r.contactId != null ? `Contacto ${r.contactId}` : "");

      const $row = $(`
        <tr data-index="${index}">

          <td class="col-broker" title="${escapeHtml(brokerNombreActual)}">
            <div class="combo-buscable combo-broker">
              <input type="text" class="combo-input" value="${escapeHtml(brokerNombreActual)}"
                placeholder="Buscar broker..." autocomplete="off" spellcheck="false" />
              <span class="combo-caret"></span>
            </div>
          </td>

          <td class="col-participante" title="${escapeHtml(participanteNombreActual)}">
            <div class="combo-buscable combo-participante">
              <input type="text" class="combo-input" value="${escapeHtml(participanteNombreActual)}"
                placeholder="Buscar reasegurador..." autocomplete="off" spellcheck="false" />
              <span class="combo-caret"></span>
            </div>
          </td>

          <td class="num col-contact-id">${r.contactId}</td>

          <td class="num">${r.cessionId}</td>

          <td>
            <input type="text" value="${formatInput(r.split,'percent')}" class="percent cell-input" data-key="split" />
          </td>

          <td>
            <input type="text" value="${formatInput(getParticipantSlip(r),'percent')}" class="percent cell-input" data-key="slip" />
          </td>

          <td>
            <input type="text" value="${formatInput(r.sumInsured,'number')}" class="number cell-input" data-key="sumInsured" />
          </td>

          <td>
            <input type="text" value="${formatInput(r.premium,'number')}" class="number cell-input" data-key="premium" />
          </td>

          <td>
            <input type="text" value="${formatInput(r.commission,'number')}" class="number cell-input" data-key="commission" />
          </td>

          <td>
            <input type="text" value="${formatInput(r.tax,'number')}" class="number cell-input" data-key="tax" />
          </td>

          <td>
            <input type="text" value="${formatInput(numeroDe(r.premium) - numeroDe(r.commission),'number')}" class="number cell-input" data-key="saldoRea" readonly />
          </td>

          <td>
            <button class="btn-eliminar" data-index="${index}" ${!isOferta() ? 'disabled' : ''}>Eliminar</button>
          </td>

        </tr>
      `);

      $tbody.append($row);
    });

    // ===== Totales por broker =====
    const totales = grupo.filas.reduce((acc, { row }) => {
    const split      = numeroDe(row.split);
    const slip        = getParticipantSlip(row);
    const sumInsured = numeroDe(row.sumInsured);
    const premium    = numeroDe(row.premium);
    const commission = numeroDe(row.commission);
    const tax        = numeroDe(row.tax);
      acc.split      += split;
      acc.slip       += slip;
      acc.sumInsured += sumInsured;
      acc.premium    += premium;
      acc.commission += commission;
      acc.saldoRea   += (premium - commission);
      acc.tax        += tax;
      return acc;
    }, { split: 0, slip: 0, sumInsured: 0, premium: 0, commission: 0, saldoRea: 0, tax: 0 });

    const $totalRow = $(`
      <tr class="row-total-broker">
        <td colspan="4" class="total-label" title="Total Reaseguradores">Total Reaseguradores</td>
        <td class="num">${formatearRedondeado(totales.split, 5)}%</td>
        <td class="num">${formatearRedondeado(totales.slip, 5)}%</td>
        <td class="num">${formatearMonto(totales.sumInsured)}</td>
        <td class="num">${formatearMonto(totales.premium)}</td>
        <td class="num">${formatearMonto(totales.commission)}</td>
        <td class="num">${formatearMonto(totales.tax)}</td>
        <td class="num">${formatearMonto(totales.saldoRea)}</td>
        <td></td>
      </tr>
    `);
    $tbody.append($totalRow);

    $contenedor.append($bloque);

  });
}

///////////////////////////////////////////////////////////
/// Desglose de campos de distribucion
///////////////////////////////////////////////////////////

function renderControlesDistribucion(containerId = "#tabControles") {

  //const $container = $("#gridDistribucionContainer");
  const $container = $(containerId);

  if (!filasControles || !filasControles.length) return;

  $("#controlesDistribucion").remove();

  //const $wrapper = $('<div id="controlesDistribucion" style="margin-top:10px;"></div>');
  const $wrapper = $(`
    <div id="controlesDistribucion" style="
      margin-top:10px;
      overflow-x:auto;
    ">
    </div>
  `);

  const widths = [];

  filasControles.forEach(fila => {

    const $row = $(`
      <div style="
        display:flex;
        gap:12px;
        margin-bottom:8px;
        min-width:1200px;
      "></div>
    `);

    fila.forEach(c => {

      const valor = c.valor ?? "";

      let html = "";

      const baseStyle = `
        flex:1;
        min-width:100px;
        display:flex;
        flex-direction:column;
      `;

      // ===== LABEL =====
      if (c.tipo === "label") {

        html = `
          <div style="
            flex:1;
            min-width:120px;
            display:flex;
            align-items:center;
            justify-content:space-between;
            font-weight:bold;
          ">
            <span>${c.nombre}</span>
      
            ${c.tieneAceptante ? `
              <button class="btn-aceptante tab-disabled ${normalizeCondition(c.contrato) === "COASEGURO" ? "coaseguro-disabled" : ""}" data-id="${c.id}" type="button" disabled title="${normalizeCondition(c.contrato) === "COASEGURO" ? "El coaseguro no usa reaseguradores" : "Seleccione una distribución para ver reaseguradores"}">
                <svg viewBox="64 64 896 896" width="16" height="16" fill="currentColor">
                  <path d="M880 298H472l-76-92a32 32 0 0 0-25-12H144c-17.7 0-32 14.3-32 32v568c0 
                  17.7 14.3 32 32 32h736c17.7 0 32-14.3 
                  32-32V330c0-17.7-14.3-32-32-32z"/>
                </svg>
                ${normalizeCondition(c.contrato) === "COASEGURO" ? '<span class="btn-aceptante-watermark">X</span>' : ""}
              </button>
            ` : ""}
          </div>
        `;
        
      }

      // ===== NUMBER (decimales segun moneda) =====
      if (c.tipo === "number2") {

        const val = formatearMonto(valor);

        html = `
          <div style="${baseStyle}">
            <label>${c.nombre}</label>
            <input 
              type="text"
              id="${c.id}"
              value="${val}" class="number ${c.clase || ''}"
              ${c.readonly ? "readonly" : ""}
            />
          </div>
        `;
      }

      // ===== PORCENTAJE 5 DECIMALES =====
      if (c.tipo === "percent8") {

        const decimales = c.id === "pco" ? 2 : 5;
        const val = c.id === "pco"
          ? formatearPorcentajeCoaseguro(valor)
          : formatearNumero(redondear(valor, decimales, true));

        html = `
          <div style="${baseStyle}">
            <label>${c.nombre}</label>
            <input 
              type="text"
              id="${c.id}"
              value="${val}" class="percent ${c.clase || ''}"
              ${c.readonly ? "readonly" : ""}
            />
          </div>
        `;
      }

      $row.append(html);
    });

    $wrapper.append($row);
  });

  $container.append($wrapper);
  setAceptanteButtonsEnabled(false);

  $("#controlesDistribucion input.number, #controlesDistribucion input.percent").on("input", function(e) {
    const input = this;
    let val = String(input.value ?? "").replace(/\s+/g, "");
    const cursorPos = input.selectionStart ?? val.length;
    const separatorsBefore = (val.slice(0, cursorPos).match(/[.,]/g) || []).length;
    const hasComma = val.includes(",");
    const hasDot = val.includes(".");
    let decimalSep = null;

    if (hasComma && hasDot) {
      decimalSep = val.lastIndexOf(",") > val.lastIndexOf(".") ? "," : ".";
    } else if (hasComma) {
      decimalSep = ",";
    } else if (hasDot) {
      const parts = val.split(".");
      if (!(parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3) && parts.length <= 2) {
        decimalSep = ".";
      }
    }

    let integerPart = val;
    let decimalPart = "";

    if (decimalSep) {
      const idx = val.lastIndexOf(decimalSep);
      integerPart = val.slice(0, idx);
      decimalPart = val.slice(idx + 1);
    }

    integerPart = integerPart.replace(/[^0-9]/g, "");
    const id = input.id;
    const maxDecimals = id === "pco" ? 2 : 5;
    decimalPart = decimalPart.replace(/[^0-9]/g, "").slice(0, maxDecimals);

    if (!integerPart) integerPart = "0";
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    val = decimalSep !== null ? `${integerPart},${decimalPart}` : integerPart;
    input.value = val;

    const separatorsAfter = (val.slice(0, cursorPos).match(/[.,]/g) || []).length;
    const nextCursorPos = Math.max(0, Math.min(val.length, cursorPos + (separatorsAfter - separatorsBefore)));
    input.setSelectionRange(nextCursorPos, nextCursorPos);

    // Disparar calculo automatico si el input pertenece a una relacion registrada
    if (id === "pfp" && numeroDe(val) > 100) {
      val = formatearNumero(100);
      input.value = val;
    }

    if (relacionesMap[id]) {
      const { montoId, sumaId, comisionId, pcomisionId, montoCalculoId, pimpuestoId, montoImpuestoId, saldoRea } = relacionesMap[id];
      const montoBase = (gridDataSelected?.Prima ?? 0);
      const sumaBase = gridDataSelected?.Suma ?? 0;
      calcularRelacion(id, montoId, sumaId, montoBase, sumaBase, comisionId, pcomisionId,
         montoCalculoId, pimpuestoId, montoImpuestoId, saldoRea);
    }

    // Si el % de Cuota Parte queda en 0, limpiar tambien su % de comision
    // (y recalcular el monto de comision y el saldo de reaseguro del CP)
    if (id === "pcp" && numeroDe(val) === 0) {
      $("#pccp").val(0);
      $("#mccp").val(formatearMonto(0));
      calculaSaldoReaseguro("srcp", redondearMonto($("#mpcp").val()), 0);
    }

    if (id === "pfp") {
      redistribuirPorcentajeFacultativo();
    }

    calculaTotales();
    markDistributionDirty();
    
  });

  function redistribuirPorcentajeFacultativo() {
    const porcentajeFacultativo = numeroDe($("#pfp").val());
    const distribucionesBase = ["pret", "pcp"]
      .map(id => ({ id, porcentaje: numeroDe($(`#${id}`).val()) }))
      .filter(item => item.porcentaje > 0);

    const totalBase = distribucionesBase.reduce((total, item) => total + item.porcentaje, 0);
    if (totalBase <= 0) return;

    const porcentajeRestante = 100 - porcentajeFacultativo;
    const nuevosPorcentajes = distribucionesBase.map(item => ({
      id: item.id,
      porcentaje: redondear(porcentajeRestante * item.porcentaje / totalBase, 5, true)
    }));

    // La diferencia por redondeo se concentra en la primera distribucion.
    const totalNuevo = nuevosPorcentajes.reduce((total, item) => total + item.porcentaje, 0);
    nuevosPorcentajes[0].porcentaje = redondear(
      nuevosPorcentajes[0].porcentaje + (porcentajeRestante - totalNuevo),
      5,
      true
    );

    nuevosPorcentajes.forEach(item => {
      $(`#${item.id}`).val(formatearNumero(item.porcentaje));

      const relacion = relacionesMap[item.id];
      if (!relacion) return;

      const montoBase = gridDataSelected?.Prima ?? 0;
      const sumaBase = gridDataSelected?.Suma ?? 0;
      calcularRelacion(
        item.id,
        relacion.montoId,
        relacion.sumaId,
        montoBase,
        sumaBase,
        relacion.comisionId,
        relacion.pcomisionId,
        relacion.montoCalculoId,
        relacion.pimpuestoId,
        relacion.montoImpuestoId,
        relacion.saldoRea
      );
    });
  }

  function redistribuirPorcentajeCoaseguro() {
    const porcentajeCoaseguro = numeroDe($("#pco").val());
    const distribucionesBase = ["pret", "pcp"]
      .map(id => ({ id, porcentaje: numeroDe($(`#${id}`).val()) }))
      .filter(item => item.porcentaje > 0);

    const totalBase = distribucionesBase.reduce((total, item) => total + item.porcentaje, 0);
    if (totalBase <= 0) return;

    const porcentajeRestante = 100 - porcentajeCoaseguro;
    const nuevosPorcentajes = distribucionesBase.map(item => ({
      id: item.id,
      porcentaje: redondear(porcentajeRestante * item.porcentaje / totalBase, 5, true)
    }));

    const totalNuevo = nuevosPorcentajes.reduce((total, item) => total + item.porcentaje, 0);
    nuevosPorcentajes[0].porcentaje = redondear(
      nuevosPorcentajes[0].porcentaje + (porcentajeRestante - totalNuevo),
      5,
      true
    );

    nuevosPorcentajes.forEach(item => {
      $(`#${item.id}`).val(formatearNumero(item.porcentaje));

      const relacion = relacionesMap[item.id];
      if (!relacion) return;

      const montoBase = gridDataSelected?.Prima ?? 0;
      const sumaBase = gridDataSelected?.Suma ?? 0;
      calcularRelacion(
        item.id,
        relacion.montoId,
        relacion.sumaId,
        montoBase,
        sumaBase,
        relacion.comisionId,
        relacion.pcomisionId,
        relacion.montoCalculoId,
        relacion.pimpuestoId,
        relacion.montoImpuestoId,
        relacion.saldoRea
      );
    });
  }

  function calcularRelacion(porcentajeId, montoId, sumaId, montoBase, sumaBase, comisionId, pcomisionId, 
    montoCalculoId, pimpuestoId, montoImpuestoId, saldoRea) {

    const $porc = $(`#${porcentajeId}`);
    const $monto = $(`#${montoId}`);
    const $montoCalculoId = $(`#${montoCalculoId}`);
    const $suma = $(`#${sumaId}`);

    const existeCalculoComision = (comisionId && pcomisionId) ? true : false;
    const existeCalculoImpuesto = (montoImpuestoId && pimpuestoId) ? true : false;

    let porc = numeroDe($porc.val());
    const montoCalculo = $montoCalculoId.length > 0 && !existeCalculoComision ? redondearMonto($montoCalculoId.val()) : montoBase;
    let monto = (montoCalculo * porc) / 100;
    let suma = (sumaBase * porc) / 100;

    // Formatear monto con los decimales de la moneda y separador de miles
    monto = redondearMonto(monto);
    suma = redondearMonto(suma);
    $monto.val(formatearMonto(monto));

    //Calculamos saldo de reaseguro
    calculaSaldoReaseguro(saldoRea, montoCalculo, monto);

    //Calculo comision si corresponde
    if(existeCalculoComision){
      const $comision = $(`#${comisionId}`);
      const $pcomision = $(`#${pcomisionId}`);
      const porcentajeComision = redondear($pcomision.val(), 5, true);
      const montoCalculoComision = $montoCalculoId.length > 0 ? redondearMonto($montoCalculoId.val()) : montoBase;
      const montoComision = redondearMonto((montoCalculoComision * porcentajeComision) / 100);
      let montoComisionFormateado = formatearMonto(montoComision);
      $comision.val(montoComisionFormateado);
      calculaSaldoReaseguro(saldoRea, montoCalculoComision, montoComision);
    }

    //Calculo impuesto si corresponde
    if(existeCalculoImpuesto){
      const $impuesto = $(`#${montoImpuestoId}`);
      const $pimpuesto = $(`#${pimpuestoId}`);
      const porcentajeImpuesto = redondear($pimpuesto.val(), 5, true);
      const montoCalculoImpuesto = $montoCalculoId.length > 0 ? redondearMonto($montoCalculoId.val()) : montoBase;
      let montoImpuesto = formatearMonto((montoCalculoImpuesto * porcentajeImpuesto) / 100);
      $impuesto.val(montoImpuesto);
    }

    if($suma.length > 0)
      $suma.val(formatearMonto(suma));
  }
}

function calculaSaldoReaseguro(saldoReaId, prima, comision){
  if(!saldoReaId)
    return;

  $(`#${saldoReaId}`).val(formatearMonto(prima-comision));

}

///////////////////////////////////////////////////////////
/// Informacion general 
///////////////////////////////////////////////////////////

function agruparCessionsPorLinea(cessions) {

  const grouped = new Map();

  cessions.forEach(item => {
    
    const type = limpiarTexto(item.premiumType);

    const key = `${type}-${item.changeId ?? 0}-${item.contractId}`;

    // si no existe el grupo, se crea
    if (!grouped.has(key)) {
      grouped.set(key, {
        changeId: item.changeId ?? 0,
        contractId: item.contractId,
        contractCode: item.contractCode ?? item.contract?.code ?? String(item.contractId),
        contractName: item.contractName ?? item.contract?.name ?? "",
        premiumTypeKey: type,
        premiumType: TIPO_MOVIMIENTO_ES[item.premiumType] || item.premiumType,
        sumInsured: 0,
        sumInsuredCedant: 0,
        sumInsuredRe: 0,
        premium: 0,
        premiumCedant: 0,
        premiumRe: 0,
        proportionCed: item.proportionCed || 0,
        proportionRe: item.proportionRe || 0,
        comissionCedant: 0,
        tax: 0,
        count: 0,

        // set para controlar que coberturas ya fueron sumadas
        _coveragesProcesadas: new Set()
      });

    }

    const g = grouped.get(key);

    const coverageKey = item.coverageCode;

    // sumar sumInsured solo una vez por cobertura
    if (!g._coveragesProcesadas.has(coverageKey)) {
      g.sumInsured += Number(montoSiEsCobertura(item.coverageCode, item.sumInsured || 0));
      g.premium += Number(item.premium || 0);
      g._coveragesProcesadas.add(coverageKey);
    }

    // estos campos si se suman siempre (por cada linea)
    g.sumInsuredCedant += Number(montoSiEsCobertura(item.coverageCode, item.sumInsuredCedant || 0));
    g.sumInsuredRe += Number(montoSiEsCobertura(item.coverageCode, item.sumInsuredRe || 0));    
    g.premiumCedant += Number(item.premiumCedant || 0);
    g.premiumRe += Number(item.premiumRe || 0);    
    g.comissionCedant += Number(item.comissionCedant || 0);    
    g.tax += Number(item.tax || 0);
    g.count++;
  });

  // eliminar propiedad interna antes de devolver
  return Array.from(grouped.values()).map(g => {
    delete g._coveragesProcesadas;
    return g;
  });
}

function mapCessionsToGrid(cessions) {

  const grouped = agruparCessionsPorLinea(cessions);

  // Mapear al formato final
  const result = Object.values(grouped).map((g, index) => {

    const rowKey = `${g.premiumTypeKey}-${g.changeId ?? 0}-${g.contractId}`;
    const contract = getContractById(g.contractId);

    return {
      _key: rowKey,
      IdPoliza: policyId,
      Contrato: g.contractId,
      ContratoCodigo: contract?.code ?? g.contractCode ?? String(g.contractId),
      ContratoNombre: contract?.name ?? g.contractName ?? "",
      Endoso: g.changeId,
      Tipo: g.premiumType,
      Suma: g.sumInsured,
      Prima: g.premium,
      PrimaRet: g.premiumCedant,
      SumaRet: redondearMonto(g.sumInsuredCedant),
      PrimaCed: redondearMonto(g.premiumRe),
      SumaCed: redondearMonto(g.sumInsuredRe),
      Comision: redondearMonto(g.comissionCedant),
      Impuesto: redondearMonto(g.tax),
      _coverages: resumirCoberturasPorFila(cessions, g)
    };
  });

  return result;
}

function resumirCoberturasPorFila(cessions, row) {
  const grouped = new Map();
  const source = cessions.filter(c =>
    c.contractId == row.contractId &&
    (c.changeId ?? 0) == (row.changeId ?? 0) &&
    limpiarTexto(c.premiumType) === limpiarTexto(row.premiumTypeKey)
  );

  source.forEach(c => {
    const key = `${c.coverageCode ?? ""}-${c.coverageName ?? ""}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        coverageCode: c.coverageCode,
        coverageName: getCoverageDisplayName(c),
        sumInsured: 0,
        premium: 0,
        premiumCedant: 0,
        sumInsuredCedant: 0,
        premiumRe: 0,
        sumInsuredRe: 0,
        comissionCedant: 0,
        tax: 0,
        _baseProcessed: false
      });
    }

    const item = grouped.get(key);
    if (!item._baseProcessed) {
      item.sumInsured += Number(c.sumInsured || 0);
      item.premium += Number(c.premium || 0);
      item._baseProcessed = true;
    }
    item.premiumCedant += Number(c.premiumCedant || 0);
    item.sumInsuredCedant += Number(c.sumInsuredCedant || 0);
    item.premiumRe += Number(c.premiumRe || 0);
    item.sumInsuredRe += Number(c.sumInsuredRe || 0);
    item.comissionCedant += Number(c.comissionCedant || 0);
    item.tax += Number(c.tax || 0);
  });

  return Array.from(grouped.values()).map(item => {
    delete item._baseProcessed;
    return item;
  });
}

function mapearTablaConfig(data) {

  if (!data || !data.length) return [];

  const headersOriginal = data[0];

  // Resolver nombres duplicados
  const headers = [];
  const contador = {};

  headersOriginal.forEach(h => {
    const key = h.trim();

    if (contador[key]) {
      contador[key]++;
      headers.push(`${key}_${contador[key]}`);
    } else {
      contador[key] = 1;
      headers.push(key);
    }
  });

  // Mapear filas
  const result = data.slice(1).map(row => {
    const obj = {};

    headers.forEach((col, i) => {
      obj[col] = row[i];
    });

    return obj;
  });

  return result;
}

///////////////////////////////////////////////////////////
/// Carga de la grilla
///////////////////////////////////////////////////////////

function crearGridDistribucion() {

  // eliminar si ya existe
  $("#gridDistribucionContainer").remove();

  const $hidden = $("#hiddenDistribucionReaseguro");
  if (!$hidden.length) return;

  const html = `
    <div id="gridDistribucionContainer" class="ant-card">
  
      <button id="btnSeleccionar" class="ant-btn ant-btn-primary">
        Actualizar distribución
      </button>
      <button id="btnRecalcular" class="ant-btn ant-btn-primary">
        Aplicar Contrato
      </button>
            
      <div class="ant-card-body">

        <div class="table-scroll">
          <table class="ant-table">
            <colgroup>
              <col style="width:2.55%;">
              <col span="11" style="width:8.859%;">
            </colgroup>
            <thead>
              <tr>
                <th rowspan="2"></th>
                <th colspan="3">Movimiento</th>        
                <th colspan="2">Totales</th>
                <th colspan="2">Retención</th>
                <th colspan="2">Cedido</th>
                <th colspan="2">Otros</th>
              </tr>
              <tr>
                <th>Contrato</th>
                <th>Endoso</th>
                <th>Tipo</th>
                <th>Suma</th>
                <th>Prima</th>
                <th>Prima Ret</th>
                <th>Suma Ret</th>
                <th>Prima Ced</th>
                <th>Suma Ced</th>
                <th>Comisión</th>
                <th>Impuesto</th>
              </tr>
            </thead>
            <tbody id="gridDistribucionBody"></tbody>
          </table>
        </div>

      </div>
    </div>
  `;

  $hidden.after(html);
  renderTabsDistribucion();
  crearPestanaSuperiorCoaseguro();

  cargarDataGrid();
}

function crearPestanaSuperiorCoaseguro() {
  const $grid = $("#gridDistribucionContainer");
  if (!$grid.length || $("#tabCoaseguradores").length) return;

  const $tabSuperior = $("button, a, [role='tab']").filter(function () {
    const texto = limpiarTexto($(this).text());
    return texto === "DISTRIBUCION REASEGURO" || texto === "DISTRIBUCION DE REASEGURO";
  }).first();
  const $panelContrato = $grid.closest(".tab-pane, [role='tabpanel'], .tab-content").first();
  if (!$tabSuperior.length || !$panelContrato.length) return;

  const $panelCoaseguro = $(
    '<div id="tabCoaseguradores" class="tab-pane tab-content" style="display:none;"></div>'
  );
  $panelContrato.after($panelCoaseguro);

  const $tabSuperiorItem = $tabSuperior.closest("li, .nav-item").first();
  const $tabSuperiorHost = $tabSuperiorItem.length ? $tabSuperiorItem : $tabSuperior;
  const $tabCoaseguroHost = $tabSuperiorHost.clone(false)
    .removeClass("active")
    .removeAttr("aria-selected");
  const $tabCoaseguro = $tabSuperiorItem.length
    ? $tabCoaseguroHost.find("button, a, [role='tab']").first()
    : $tabCoaseguroHost;

  $tabCoaseguro
    .removeClass("active")
    .removeAttr("aria-selected")
    .text("Coaseguro")
    .attr("data-coaseguro-tab", "true")
    .addClass("codex-coaseguro-tab");
  $tabSuperior.text("Contrato")
    .addClass("active codex-contrato-tab")
    .attr("aria-selected", "true");
  $tabCoaseguroHost.addClass("codex-coaseguro-tab-item");
  $tabSuperiorHost.after($tabCoaseguroHost);

  $tabCoaseguro.on("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    $tabSuperiorHost.removeClass("active");
    $tabCoaseguroHost.addClass("active");
    $tabSuperior.removeClass("active").attr("aria-selected", "false");
    $tabCoaseguro.addClass("active").attr("aria-selected", "true");
    $panelContrato.hide();
    $panelCoaseguro.show();
    coaseguradoresData = agruparParticipantsCoaseguro(cessions, "COASEGURO");
    renderCoaseguradores();
  });

  $tabSuperior.on("click.coaseguroContrato", function () {
    $tabCoaseguroHost.removeClass("active");
    $tabSuperiorHost.addClass("active");
    $tabCoaseguro.removeClass("active").attr("aria-selected", "false");
    $tabSuperior.addClass("active").attr("aria-selected", "true");
    $panelCoaseguro.hide();
    $panelContrato.show();
  });
}

function renderTabsDistribucion() {

  const $container = $("#gridDistribucionContainer");

  const html = `
  <div id="tabsDistribucion">

    <div class="tabs-header">
      <button class="tab-btn active" data-tab="tabControles">Distribuci\u00f3n</button>
      <button class="tab-btn" data-tab="tabReaseguradores" disabled title="Primero use la opci\u00f3n de mostrar participantes">Reaseguradores</button>
    </div>

    <div id="tabControles" class="tab-content"></div>
    <div id="tabReaseguradores" class="tab-content" style="display:none;"></div>

  </div>
  `;
  
  $container.append(html);
  updateAceptantesTabState(false);

  // eventos tabs
  $(".tab-btn").off("click")
    .on("click", function () {
    if (this.disabled) return;

    const tab = $(this).data("tab");

    if (tab === "tabReaseguradores" && distributionDirty) {
      mostrarNotificacion(`Debe guardar la distribución para reflejar los cambios en Participantes.`, "warning");
      return;
    }

    if (tab === "tabReaseguradores") {
      refreshReaseguradoresTab();
    }

    $(".tab-btn").removeClass("active");
    $(this).addClass("active");

    $(".tab-content").hide();
    $("#" + tab).show();
  });
  
}

function cargarDataGrid() {
   
  const $tbody = $("#gridDistribucionBody");
  $tbody.empty();

    $.each(gridData, function (index, row) {

    const expanded = lineasCoberturasExpandida.has(row._key);
    const coverageRows = Array.isArray(row._coverages) ? row._coverages : [];

    const tr = `
      <tr class="ant-row grid-maestra-row" data-index="${index}">
        <td class="grid-row-actions">
          <input type="radio" name="gridSelect">
          <button type="button" class="grid-cobertura-toggle" data-key="${escapeHtml(row._key)}" aria-expanded="${expanded ? "true" : "false"}" title="${expanded ? "Ocultar coberturas" : "Ver coberturas"}">
            ${expanded ? "-" : "+"}
          </button>
        </td>
        <td class="grid-contrato-name-cell"><span class="grid-contrato-name" data-full-name="${escapeHtml(String(row.ContratoNombre ?? ""))}">${escapeHtml(String(row.ContratoCodigo ?? row.Contrato))}${row.ContratoNombre ? ` - ${escapeHtml(String(row.ContratoNombre))}` : ""}</span></td>
        <td style="text-align: center;">${row.Endoso}</td>
        <td style="text-align: center;">${row.Tipo}</td>
        <td class="num">${formatearMonto(row.Suma)}</td>
        <td class="num">${formatearMonto(row.Prima)}</td>
        <td class="num retention-amount">${formatearMonto(row.PrimaRet)}</td>
        <td class="num retention-amount">${formatearMonto(row.SumaRet)}</td>
        <td class="num ceded-amount">${formatearMonto(row.PrimaCed)}</td>
        <td class="num ceded-amount">${formatearMonto(row.SumaCed)}</td>
        <td class="num">${formatearMonto(row.Comision)}</td>
        <td class="num">${formatearMonto(row.Impuesto)}</td>
      </tr>
      <tr class="grid-coberturas-row ${expanded ? "" : "is-hidden"}" data-parent-key="${escapeHtml(row._key)}">
        <td colspan="12">
          <div class="grid-coberturas-wrapper">
            <table class="grid-coberturas">
              <colgroup>
                <col span="11" style="width:9.090909%;">
              </colgroup>
              <tbody>
                ${coverageRows.length > 0 ? coverageRows.map(c => `
                  <tr class="ant-row grid-cobertura-row-item">
                    <td colspan="3" class="grid-cobertura-name-cell"><input type="radio" name="gridCoverageSelect" class="grid-cobertura-radio" ${isCoverageScopeActive() && String(selectedCoverageCode) === String(c.coverageCode) && String(gridData[gridSelectedIndex]?._key) === String(row._key) ? "checked" : ""}> <b>Cobertura:</b> ${escapeHtml(String(c.coverageCode ?? "").trim())} - <span class="grid-cobertura-name" data-coverage-code="${escapeHtml(String(c.coverageCode ?? "").trim())}" data-full-name="${escapeHtml(String(getCoverageDisplayName(c) ?? "").trim())}">${escapeHtml(String(getCoverageDisplayName(c) ?? "").trim())}</span></td>
                    <td class="num">${formatearMonto(c.sumInsured)}</td>
                    <td class="num">${formatearMonto(c.premium)}</td>
                    <td class="num retention-amount">${formatearMonto(c.premiumCedant)}</td>
                    <td class="num retention-amount">${formatearMonto(c.sumInsuredCedant)}</td>
                    <td class="num ceded-amount">${formatearMonto(c.premiumRe)}</td>
                    <td class="num ceded-amount">${formatearMonto(c.sumInsuredRe)}</td>
                    <td class="num">${formatearMonto(c.comissionCedant)}</td>
                    <td class="num">${formatearMonto(c.tax)}</td>
                  </tr>
                `).join("") : `<tr><td colspan="10">Sin coberturas para esta línea</td></tr>`}
              </tbody>
            </table>
          </div>
        </td>
      </tr>
    `;

    $tbody.append(tr);
  });

  if (gridSelectedIndex !== null && gridData[gridSelectedIndex]) {
    const $selectedRow = $tbody.find(`tr.ant-row[data-index="${gridSelectedIndex}"]`);
    $tbody.find("input[type='radio']").prop("checked", false);

    if (isCoverageScopeActive()) {
      $tbody.find(".grid-cobertura-name").filter(function () {
        return String($(this).data("coverage-code")) === String(selectedCoverageCode)
          && String($(this).closest(".grid-coberturas-row").data("parent-key")) === String(gridData[gridSelectedIndex]._key);
      }).closest(".grid-cobertura-row-item").addClass("selected")
        .find(".grid-cobertura-radio").prop("checked", true);
    } else {
      $selectedRow.addClass("selected");
      $selectedRow.find("input[type='radio']").prop("checked", true);
    }
  }

  eventosGrid();
}

function eventosGrid() {

  // Remove previous handlers so old broad selectors cannot handle coverage rows.
  $(document).off("click", "#gridDistribucionBody tr.ant-row");
  $(document).off("click", "#gridDistribucionBody .grid-maestra-row");
  $(document).off("click", "#gridDistribucionBody .grid-cobertura-row-item");

  // Main distribution row selection.
  $(document).on("click", "#gridDistribucionBody .grid-maestra-row", function (event) {

    if ($(event.target).closest(".grid-contrato-name").length) return;

    const rowIndex = Number($(this).attr("data-index"));
    const rowData = gridData[rowIndex];
    if (!Number.isInteger(rowIndex) || !rowData) return;

    $("#gridDistribucionBody tr").removeClass("selected");
    $("#gridDistribucionBody input[type='radio']").prop("checked", false);
  
    $(this).addClass("selected");
  
    $(this).find("input[type='radio']").prop("checked", true);

    // obtener ndice
    gridSelectedIndex = rowIndex;
    selectedCoverageCode = null;

    // obtener objeto    
    gridDataSelected = rowData;
    contractId = rowData.Contrato;
    tipoPrimaSelected = rowData.Tipo;

    // Re-render limpio para evitar clases/estilos residuales cuando hay coberturas expandidas.
    cargarDataGrid();
    renderControlesDistribucion();
    ajustarBotonesParticipantes();
    onRowSelected(rowData);
    
  });

  $(document).off("click", "#gridDistribucionBody .grid-cobertura-row-item")
    .on("click", "#gridDistribucionBody .grid-cobertura-row-item", function (event) {
      event.stopPropagation();

      if ($(event.target).closest(".grid-cobertura-name").length) return;

      const $detailRow = $(this).closest(".grid-coberturas-row");
      const parentKey = String($detailRow.data("parent-key") ?? "");
      const parentIndex = gridData.findIndex(row => String(row._key) === parentKey);
      const coverageCode = $(this).find(".grid-cobertura-name").data("coverage-code");
      const parentRow = gridData[parentIndex];

      if (parentIndex < 0 || !parentRow || coverageCode === undefined) return;

      selectedCoverageCode = String(coverageCode).trim();
      gridSelectedIndex = parentIndex;
      gridDataSelected = createCoverageGridRow(parentRow, selectedCoverageCode);
      contractId = parentRow.Contrato;
      tipoPrimaSelected = parentRow.Tipo;

      $("#gridDistribucionBody tr.ant-row[data-index]").removeClass("selected");
      $("#gridDistribucionBody tr.grid-cobertura-row-item").removeClass("selected");
      $(this).addClass("selected");
      $("#gridDistribucionBody input[type='radio']").prop("checked", false);
      $(this).find(".grid-cobertura-radio").prop("checked", true);

    renderControlesDistribucion();
    ajustarBotonesParticipantes();
      onRowSelected(gridDataSelected);
    });

  $(document).off("click", "#gridDistribucionBody .grid-cobertura-toggle")
    .on("click", "#gridDistribucionBody .grid-cobertura-toggle", function (event) {
      event.stopPropagation();
      const key = $(this).data("key");
      if (lineasCoberturasExpandida.has(key)) {
        lineasCoberturasExpandida.delete(key);
      } else {
        lineasCoberturasExpandida.add(key);
      }
      cargarDataGrid();
    });

  $(document).off("click", "#gridDistribucionBody .grid-cobertura-name")
    .on("click", "#gridDistribucionBody .grid-cobertura-name", function (event) {
      event.stopPropagation();

      const $currentTooltip = $(".grid-cobertura-tooltip");
      if ($currentTooltip.length) {
        $currentTooltip.remove();
        if ($currentTooltip[0].tooltipSource === this) return;
      }

      const $tooltip = $("<div>", {
        class: "grid-cobertura-tooltip",
        text: $(this).data("full-name") || ""
      });

      $tooltip.appendTo("body");
      $tooltip[0].tooltipSource = this;
      const offset = $(this).offset();
      $tooltip.css({
        left: offset.left,
        top: offset.top + $(this).outerHeight() + 6
      });
    });

  $(document).off("click", "#gridDistribucionBody .grid-contrato-name")
    .on("click", "#gridDistribucionBody .grid-contrato-name", function (event) {
      event.stopPropagation();

      const $currentTooltip = $(".grid-cobertura-tooltip");
      if ($currentTooltip.length) {
        $currentTooltip.remove();
        if ($currentTooltip[0].tooltipSource === this) return;
      }

      const $tooltip = $("<div>", {
        class: "grid-cobertura-tooltip",
        text: $(this).data("full-name") || ""
      });

      $tooltip.appendTo("body");
      $tooltip[0].tooltipSource = this;
      const offset = $(this).offset();
      $tooltip.css({
        left: offset.left,
        top: offset.top + $(this).outerHeight() + 6
      });
    });

  $(document).off("click.gridCoberturaTooltip")
    .on("click.gridCoberturaTooltip", function (event) {
      if (!$(event.target).closest(".grid-cobertura-name, .grid-cobertura-tooltip").length) {
        $(".grid-cobertura-tooltip").remove();
      }
    });

  $(document).off("click", "#btnSeleccionar")
    .on("click", "#btnSeleccionar", async () => {
    calculaTotales();
    await saveChanges();
  });

  $(document).off("click", "#btnRecalcular")
    .on("click", "#btnRecalcular", async () => {
      showLoading("Aplicando contrato...");
      await new Promise(resolve => setTimeout(resolve, 0));
      try {
        const resultado = await me.exe("ReComputeRe", { policyId: policyId });
        if(!resultado.ok)
          mostrarNotificacion(`Error aplicando contrato del reaseguro, contacte a sistemas : ${resultado.msg}` , "warning");
        else{
          mostrarNotificacion(`Contrato aplicado satisfactoriamente` , "success"); 
          await loadCessions();
          await loadContracts();
          gridData = mapCessionsToGrid(cessions);
          cargarDataGrid();
          preserveDistribution();
          $(`#gridDistribucionBody tr[data-index="${gridSelectedIndex}"]`).trigger("click");
        }
      } catch (error) {
        mostrarNotificacion(`Error aplicando contrato del reaseguro, contacte a sistemas : ${error?.msg || error}` , "warning");
      } finally {
        hideLoading();
      }
  }); 
      
}

function isOferta(){
  const isOferta = !policy.activeDate;
  return isOferta;
}

//Validaremos el estado de la poliza con el activeDate, si es null entonces es oferta y habilitamos los botones, en caso contrario deshabilitamos los botones para evitar que se realicen cambios en polizas activas. Esta validacion se realizar cada vez que se cargue la informacion de la poliza, para asegurar que el estado esta siempre actualizado.
function validateState(){
  
  const enabled = isOferta();
  $("#btnSeleccionar").prop("disabled", !enabled);
  $("#btnRecalcular").prop("disabled", !enabled);
  $("#btnAgregarReasegurador").prop("disabled", !enabled);
  $("#btnGuardarDistribucion").prop("disabled", !enabled);

}

///////////////////////////////////////////////////////////
// Resumen
///////////////////////////////////////////////////////////

function calcularPorcentaje(prima, monto) {
    if (prima === 0) return 0; // evita division entre cero
    const porcentaje = (monto / prima) * 100;
    return redondear(porcentaje, 5, true);
}

// Decimales para montos: el formulario trabaja con 5 decimales en todos los
// importes; los porcentajesi se mantienen separados de esta regla.
function decimalesMoneda(moneda) {
  return 5;
}

function redondearMonto(valor, moneda) {
  return redondear(valor, decimalesMoneda(moneda), true);
}

function formatearMonto(valor, moneda) {
  const dec = decimalesMoneda(moneda);
  const num = redondearMonto(valor, moneda);
  const partes = num.toFixed(dec).split(".");
  partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return partes.join(",");
}

// Convierte a numero valores que pueden venir formateados con separador de miles
// en estilo chileno o estilo US, ademas de entradas parcialmente editadas.
function numeroDe(valor) {
  if (valor === null || valor === undefined || valor === "") return 0;
  if (typeof valor === "number") return isNaN(valor) ? 0 : valor;

  let str = String(valor).trim().replace(/\s+/g, "");
  if (!str) return 0;

  const hasComma = str.includes(",");
  const hasDot = str.includes(".");

  if (hasComma && hasDot) {
    const decimalSep = str.lastIndexOf(",") > str.lastIndexOf(".") ? "," : ".";
    const thousandsSep = decimalSep === "," ? "." : ",";
    str = str.split(thousandsSep).join("");
    str = str.replace(decimalSep, ".");
  } else if (hasComma) {
    const lastComma = str.lastIndexOf(",");
    const integerPart = str.slice(0, lastComma).replace(/[.,]/g, "");
    const decimalPart = str.slice(lastComma + 1).replace(/[^0-9]/g, "");
    str = `${integerPart}.${decimalPart}`;
  } else if (hasDot) {
    const parts = str.split(".");
    if (parts.length > 2) {
      str = parts.join("");
    } else if (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3) {
      str = parts.join("");
    }
  }

  str = str.replace(/[^0-9.-]/g, "");
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function redondear(valor, decimales = 2, forzar = false) {
    if (valor === null || valor === undefined) return 0;

    //decimales a dos segun requerimiento GLOB-633
    if(!forzar)
      decimales = 2;

    // Convertir a numero aceptando formatos chileno y US
    const num = numeroDe(valor);

    // Si no es un numero vlido, devolver 0
    if (isNaN(num)) return 0;

    // Redondeo a los decimales indicados
    const factor = Math.pow(10, decimales);
    return Math.round((num + Number.EPSILON) * factor) / factor;
}

function formatInput(value, type) {
  try {
    value = numeroDe(value);
    if (type === "number") return formatearMonto(value);
    return formatearNumero(redondear(value, 5, true));
  } catch (error) {
    return value;
  }
}

function formatearNumero(valor) {

  if (valor === null || valor === undefined || isNaN(valor)) return "0,00000";

  const numero = Number(valor);
  const partes = numero.toString().split(".");

  // Formatear miles
  partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  // No tiene decimales
  if (partes.length === 1) {
    return partes[0] + ",00000";
  }

  // Normalizar a 5 decimales
  const decimales = (partes[1] || "").padEnd(5, "0").slice(0, 5);
  return partes[0] + "," + decimales;
}

function formatearRedondeado(valor, decimales = 5) {
  return formatearNumero(redondear(valor, decimales, true));
}

function formatearPorcentajeCoaseguro(valor) {
  const partes = formatearNumero(redondear(valor, 2, true)).split(",");
  return `${partes[0]},${(partes[1] || "").slice(0, 2).padEnd(2, "0")}`;
}

function mostrarNotificacion(msg, tipo) {

  const $div = $(`<div class="ant-notification ${tipo}">${msg}</div>`);

  $("body").append($div);

  setTimeout(() => {
    $div.fadeOut(300, function () {
      $(this).remove();
    });
  }, 2500);
}

function limpiarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u00A0]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

$("<style>")
  .prop("type", "text/css")
  .html(`
    /* ===== CONTENEDOR ===== */
    #gridDistribucionContainer {
      font-family: Arial, sans-serif;
      width: 100%;
      min-width: 0;
      max-width: 100%;
      box-sizing: border-box;
      overflow: hidden;
    }

    #gridDistribucionContainer .ant-card-body,
    #gridDistribucionContainer #tabsDistribucion,
    #gridDistribucionContainer #tabControles {
      width: 100%;
      min-width: 0;
      max-width: 100%;
      box-sizing: border-box;
    }
    
    /* ===== TABLA ===== */
    #gridDistribucionContainer .ant-table {
      width: 100%;
      border-collapse: separate;   /* importante para estilo AntD */
      border-spacing: 0;
      table-layout: fixed;
      border: 1px solid #f0f0f0;
      border-radius: 6px;
      overflow: hidden;
      background: #fff;
    }
    
    /* ===== RESTAURAR COMPORTAMIENTO DE TABLA ===== */
    #gridDistribucionContainer table {
      display: table !important;
    }
    
    #gridDistribucionContainer thead {
      display: table-header-group !important;
    }
    
    #gridDistribucionContainer tbody {
      display: table-row-group !important;
    }
    
    #gridDistribucionContainer tr {
      display: table-row !important;
    }
    
    #gridDistribucionContainer th,
    #gridDistribucionContainer td {
      display: table-cell !important;
      white-space: nowrap;
    }
    
    /* ===== ENCABEZADOS ===== */
    #gridDistribucionContainer thead th {
      padding: 10px 12px;
      border-bottom: 1px solid #f0f0f0;
      font-weight: 600;
      font-size: 13px;
      text-align: center;
    }
    
    /* fila de agrupacion */
    #gridDistribucionContainer thead tr:first-child th {
      background-color: #fafafa;
      border-bottom: 1px solid #e8e8e8;
    }
    
    /* fila de detalle */
    #gridDistribucionContainer thead tr:last-child th {
      background-color: #ffffff;
    }
    
    /* fix para rowspan */
    #gridDistribucionContainer th[rowspan] {
      vertical-align: bottom;
      text-align: left;
    }
    
    /* ===== CUERPO ===== */
    #gridDistribucionContainer tbody td {
      padding: 8px 12px;
      border-bottom: 1px solid #f0f0f0;
      font-size: 13px;
    }
    
    /* hover */
    #gridDistribucionContainer .ant-table tbody tr:hover {
      background-color: #fafafa;
    }
    
    /* fila seleccionada */
    #gridDistribucionContainer .ant-table tbody tr.selected {
      background-color: #bae0ff;
    }

    #gridDistribucionContainer .grid-maestra-row,
    #gridDistribucionContainer .grid-cobertura-row-item {
      cursor: pointer;
    }

    #gridDistribucionContainer .grid-contrato-name-cell {
      overflow: hidden;
      text-align: left;
      padding-left: 20px !important;
    }

    #gridDistribucionContainer .grid-contrato-name {
      display: inline-block;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      vertical-align: bottom;
      white-space: nowrap;
      cursor: pointer;
      color: #0958d9;
    }

    #gridDistribucionContainer .retention-amount {
      color: #1677ff;
    }

    #gridDistribucionContainer .ceded-amount {
      color: #389e0d;
    }

    #gridDistribucionContainer .grid-row-actions {
      text-align: center;
      width: 76px;
      vertical-align: middle;
    }

    #gridDistribucionContainer .grid-row-actions input[type="radio"] {
      margin: 0;
      vertical-align: middle;
    }

    #gridDistribucionContainer .grid-cobertura-toggle {
      width: 24px;
      height: 24px;
      margin-left: 5px;
      padding: 0;
      border: 1px solid #1677ff;
      border-radius: 4px;
      background: #e6f4ff;
      color: #0958d9;
      font-size: 18px;
      line-height: 20px;
      font-weight: 700;
      cursor: pointer;
      vertical-align: middle;
    }

    #gridDistribucionContainer .grid-cobertura-toggle:hover {
      background: #bae0ff;
    }

    #gridDistribucionContainer .grid-coberturas-row.is-hidden {
      display: none !important;
    }

    #gridDistribucionContainer .grid-coberturas-row > td {
      padding: 0 !important;
      background: #f7fbff;
    }

    #gridDistribucionContainer .grid-coberturas-wrapper {
      overflow: visible;
      padding: 10px 0 12px 2.55%;
    }

    #gridDistribucionContainer .grid-coberturas {
      width: 100%;
      min-width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      background: #fff;
      border: 1px solid #d6e4ff;
    }

    #gridDistribucionContainer .grid-coberturas th,
    #gridDistribucionContainer .grid-coberturas td {
      padding: 8px 12px;
      border-left: none !important;
      border-right: none !important;
      border-bottom: 1px solid #f0f0f0;
      font-size: 13px;
      line-height: normal;
      white-space: nowrap;
    }

    #gridDistribucionContainer .grid-coberturas th {
      background: #eef6ff;
      text-align: center;
    }

    #gridDistribucionContainer .grid-coberturas tbody tr {
      background: #fff;
    }

    #gridDistribucionContainer .grid-coberturas tbody tr:hover {
      background: #fafafa;
    }

    #gridDistribucionContainer .grid-coberturas tbody tr:last-child td {
      border-bottom: none;
    }

    #gridDistribucionContainer .grid-cobertura-name-cell {
      max-width: 0;
      overflow: visible;
      position: relative;
    }

    #gridDistribucionContainer .grid-cobertura-radio {
      position: absolute;
      left: -32px;
      top: 50%;
      margin: 0;
      transform: translateY(-50%);
    }

    #gridDistribucionContainer .grid-cobertura-name {
      display: inline-block;
      max-width: calc(100% - 82px);
      overflow: hidden;
      text-overflow: ellipsis;
      vertical-align: bottom;
      white-space: nowrap;
      cursor: pointer;
      color: #0958d9;
    }

    .grid-cobertura-tooltip {
      position: absolute;
      z-index: 999999;
      max-width: 420px;
      padding: 8px 10px;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      background: #fff;
      box-shadow: 0 4px 14px rgba(0, 0, 0, .18);
      color: rgba(0, 0, 0, .88);
      font-size: 13px;
      line-height: 1.4;
      white-space: normal;
      overflow-wrap: anywhere;
    }
    
    /* ===== BORDES ENTRE COLUMNAS ===== */
    #gridDistribucionContainer th,
    #gridDistribucionContainer td {
      border-right: none;
    }
    
    /* ===== ELIMINAR PSEUDO RESPONSIVE ===== */
    #gridDistribucionContainer td::before {
      content: none !important;
    }
    
    /* ===== NOTIFICACIONES ===== */
    .ant-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 16px;
      border-radius: 4px;
      color: #fff;
      z-index: 9999;
      font-family: Arial, sans-serif;
    }
    
    .ant-notification.success {
      background-color: #52c41a;
    }
    
    .ant-notification.warning {
      background-color: #faad14;
    }

    /* ===== INPUT BASE ANT STYLE ===== */
    #gridDistribucionContainer input[type="text"] {
      width: 100%;
      height: 28px;
      padding: 4px 8px;
      font-size: 13px;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      outline: none;
      transition: all 0.2s ease;
      background-color: #fff;
      box-sizing: border-box;
    }
    
    /* hover */
    #gridDistribucionContainer input[type="text"]:hover {
      border-color: #4096ff;
    }
    
    /* focus */
    #gridDistribucionContainer input[type="text"]:focus {
      border-color: #1677ff;
      box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2);
    }
    
    /* readonly */
    #gridDistribucionContainer input[readonly] {
      background-color: #f5f5f5;
      color: rgba(0, 0, 0, 0.65);
      cursor: not-allowed;
    }

    #gridDistribucionContainer input[readonly].input-verde-negrita {
      font-weight: 700;       /* negrita */
      color: #1890ff;         /* verde estilo Ant Design */
    }
    
    /* ===== NUMRICOS ===== */
    #gridDistribucionContainer input.number {
      text-align: right;
    }
    
    /* porcentaje */
    #gridDistribucionContainer input.percent {
      text-align: right;
    }

    #gridDistribucionContainer td.num,
    #gridDistribucionContainer th.num {
      text-align: right;
    }

    /* ===== CONTENEDOR ===== */
    #tabsDistribucion {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial;
    }

    .codex-coaseguro-tab {
      margin-left: 14px !important;
      padding-left: 24px !important;
      border-left: 1px solid #d9d9d9 !important;
    }

    .codex-coaseguro-tab:not(.active) {
      color: rgba(0, 0, 0, 0.65) !important;
      border-bottom-color: transparent !important;
    }

    .codex-coaseguro-tab.active {
      color: #1890ff !important;
    }

    .codex-contrato-tab-item::before,
    .codex-contrato-tab-item::after,
    .codex-coaseguro-tab-item::before,
    .codex-coaseguro-tab-item::after,
    .codex-contrato-tab::before,
    .codex-contrato-tab::after,
    .codex-coaseguro-tab::before,
    .codex-coaseguro-tab::after {
      display: none !important;
      content: none !important;
    }

    .codex-contrato-tab,
    .codex-coaseguro-tab {
      border-bottom: 2px solid transparent !important;
    }

    .codex-contrato-tab:not(.active) {
      color: rgba(0, 0, 0, 0.65) !important;
      border-bottom-color: transparent !important;
    }

    .codex-coaseguro-tab-item:not(.active) {
      border-bottom: 0 !important;
      box-shadow: none !important;
    }

    .codex-contrato-tab.active,
    .codex-coaseguro-tab.active {
      border-bottom-color: #1890ff !important;
    }

    .codex-contrato-tab {
      padding-right: 18px !important;
    }

    /* ===== HEADER ===== */
    #tabsDistribucion .tabs-header {
      display: flex;
      gap: 24px;
      border-bottom: 1px solid #f0f0f0;
      position: relative;
    }
    
    /* ===== BOTONES ===== */
    #tabsDistribucion .tab-btn {
      position: relative;
      padding: 10px 0;
      cursor: pointer;
      color: rgba(0, 0, 0, 0.65);
      background: none;
      border: none;
      outline: none;
      font-size: 14px;
      transition: all 0.2s;
    }
    
    /* Hover */
    #tabsDistribucion .tab-btn:hover {
      color: #1890ff;
    }

    #tabsDistribucion .tab-btn:disabled,
    #tabsDistribucion .tab-btn.tab-disabled {
      color: #bfbfbf;
      cursor: not-allowed;
    }
    
    /* Activo */
    #tabsDistribucion .tab-btn.active {
      color: #1890ff;
      font-weight: 500;
    }
    
    /* ===== LINEA INFERIOR (INK BAR) ===== */
    #tabsDistribucion .tab-btn.active::after {
      content: "";
      position: absolute;
      left: 0;
      bottom: -1px;
      width: 100%;
      height: 2px;
      background: #1890ff;
      border-radius: 2px;
    }
    
    /* ===== CONTENIDO ===== */
    #tabsDistribucion .tab-content {
      padding-top: 12px;
    }

    #tabsDistribucion .tab-content {
      animation: fadeIn 0.2s ease;
    }

    #tabsDistribucion .leyenda-coaseguro-global {
      margin-top: 14px;
      padding: 10px 0;
      color: #d9363e;
      font-weight: 700;
      font-size: 13px;
      display: none;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(2px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /*Boton de edicion de aceptantes*/

    .btn-aceptante {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    
      width: 28px;
      height: 28px;
    
      border: none;
      background: transparent;
    
      color: rgba(0, 0, 0, 0.45);
      font-size: 16px;
    
      cursor: pointer;
      border-radius: 6px;
    
      transition: all 0.2s ease;
    }

    .btn-aceptante.tab-disabled,
    .btn-aceptante:disabled {
      color: rgba(0, 0, 0, 0.25);
      background: rgba(0, 0, 0, 0.03);
      border: 1px solid rgba(0, 0, 0, 0.08);
      opacity: 0.8;
      cursor: not-allowed;
      box-shadow: none;
      filter: grayscale(0.35);
    }

    .btn-aceptante.tab-disabled:hover,
    .btn-aceptante:disabled:hover {
      color: rgba(0, 0, 0, 0.25);
      background: rgba(0, 0, 0, 0.03);
      border: 1px solid rgba(0, 0, 0, 0.08);
      box-shadow: none;
    }

    .btn-aceptante.coaseguro-disabled {
      position: relative;
      overflow: hidden;
    }

    .btn-aceptante.coaseguro-disabled .btn-aceptante-watermark {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255, 77, 79, 0.35);
      font-size: 18px;
      font-weight: 700;
      line-height: 1;
      pointer-events: none;
      transform: rotate(-12deg);
      text-shadow: 0 0 2px rgba(255, 255, 255, 0.75);
    }
    
    /* Hover (azul Ant) */
    .btn-aceptante:hover {
      color: #1890ff;
      background: rgba(24, 144, 255, 0.1);
    }
    
    /* Active */
    .btn-aceptante:active {
      background: rgba(24, 144, 255, 0.2);
    }
    
    /* Focus accesible */
    .btn-aceptante:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }

    /* ===== SELECT ESTILO ANT-DESIGN ===== */
    #gridDistribucionContainerReaseguradoresi select {
      width: 100%;
      height: 28px;
      padding: 4px 8px;
      font-size: 13px;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      background-color: #fff;
      outline: none;
      transition: all 0.2s ease;
      appearance: none; /* Quitar flecha nativa */
      cursor: pointer;
      box-sizing: border-box;
    }
    
    /* Hover */
    #gridDistribucionContainerReaseguradoresi select:hover {
      border-color: #4096ff;
    }
    
    /* Focus */
    #gridDistribucionContainerReaseguradoresi select:focus {
      border-color: #1677ff;
      box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2);
    }
    
    /* Opcional: estilo de opcion */
    #gridDistribucionContainerReaseguradoresi select option {
      padding: 4px 8px;
      font-size: 13px;
    }

    /* ===== COMBO BUSCABLE (broker / reasegurador) ===== */
    .combo-buscable {
      position: relative;
      width: 100%;
    }

    .combo-buscable .combo-input {
      padding-right: 24px !important;
      cursor: pointer;
    }

    .combo-buscable.open .combo-input {
      cursor: text;
      border-color: #1677ff;
      box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2);
    }

    .combo-buscable .combo-caret {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 10px;
      color: rgba(0, 0, 0, 0.35);
      pointer-events: none;
      transition: transform 0.2s ease;
    }

    .combo-buscable.open .combo-caret {
      transform: translateY(-50%) rotate(180deg);
      color: #1677ff;
    }

    /* dropdown global renderizado en <body> (evita el recorte por overflow de las tablas) */
    #comboDropdownGlobal {
      display: none;
      position: fixed;
      z-index: 10500;
      max-height: 240px;
      overflow-y: auto;
      background: #fff;
      border: 1px solid #f0f0f0;
      border-radius: 6px;
      box-shadow: 0 3px 6px -4px rgba(0,0,0,.12),
                  0 6px 16px 0 rgba(0,0,0,.08),
                  0 9px 28px 8px rgba(0,0,0,.05);
      animation: fadeIn 0.15s ease;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial;
    }

    .combo-option {
      padding: 6px 10px;
      font-size: 13px;
      cursor: pointer;
      white-space: normal;
      word-break: break-word;
      line-height: 1.35;
      transition: background 0.15s ease;
    }

    .combo-option:hover {
      background: #f5f5f5;
    }

    .combo-option.selected {
      background: #e6f7ff;
      color: #1890ff;
      font-weight: 600;
    }

    .combo-empty {
      padding: 12px 10px;
      color: rgba(0, 0, 0, 0.45);
      text-align: center;
      font-size: 13px;
    }

    /* ===== BOTN ELIMINAR ESTILO ANT-DESIGN ===== */
    .btn-eliminar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      
      padding: 0 8px;
      height: 28px;
      font-size: 13px;
      
      color: #fff;
      background-color: #ff4d4f; /* rojo AntD */
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .btn-eliminar:hover {
      background-color: #ff7875; /* rojo ms claro al hover */
    }
    
    .btn-eliminar:active {
      background-color: #d9363e; /* rojo ms intenso al click */
    }
    
    .btn-eliminar:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2);
    }

    .btn-eliminar:disabled {
      background-color: #d9d9d9;
      color: #999;
      cursor: not-allowed;
      opacity: 0.7;
      pointer-events: none;
    }

    /* MUY IMPORTANTE: desactivar hover cuando est disabled */
    .btn-eliminar:disabled:hover {
      background-color: #d9d9d9;
    }

    .ant-btn.ant-btn-success {
      background-color: #52c41a;
      border-color: #52c41a;
    }

    /* ===== SCROLLING TABLA PRINCIPAL ===== */

    #gridDistribucionContainer .table-scroll {
      width: 100%;
      min-width: 0;
      max-width: 100%;
      box-sizing: border-box;
      max-height: 400px;
      overflow-y: auto;
      overflow-x: auto;
    }

    #gridDistribucionContainer .ant-table {
      width: 100%;
      min-width: 100%;
    }

    /* ===== TOOLBAR / FILTRO BROKER ===== */

    .reaseguradores-toolbar {
      padding: 8px 0;
    }

    /* el selector por id vence a la regla "select { width:100% }" del contenedor,
       para que el filtro no ocupe todo el ancho de la toolbar */
    #gridDistribucionContainerReaseguradoresi select.select-filtro-broker {
      width: auto;
      min-width: 300px;
      max-width: 520px;
      height: 32px;
      padding: 4px 8px;
      font-size: 13px;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      background: #fff;
      cursor: pointer;
      box-sizing: border-box;
    }

    .select-filtro-broker:hover {
      border-color: #4096ff;
    }

    .select-filtro-broker:focus {
      border-color: #1677ff;
      box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2);
      outline: none;
    }

    /* ===== GRUPO REASEGURADORES POR BROKER ===== */

    .reaseguradores-grupo {
      margin-bottom: 18px;
      border: 1px solid #f0f0f0;
      border-radius: 6px;
      background: #fff;
      padding: 10px 12px;
      overflow-x: auto; /* la tabla ancha se desplaza dentro del grupo */
    }

    .reaseguradores-grupo-titulo {
      margin: 0 0 10px 0;
      padding-bottom: 6px;
      border-bottom: 1px solid #f0f0f0;
      color: #1890ff;
      font-size: 14px;
      font-weight: 600;
      line-height: 1.4;
      word-break: break-word;
      overflow-wrap: anywhere;
      white-space: normal;
    }

    .reaseguradores-empty {
      padding: 16px;
      color: rgba(0,0,0,0.45);
      text-align: center;
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      background: #fafafa;
    }

    /* ===== TABLA REASEGURADORES (SUB-GRID) ===== */

    .grid-reaseguradores {
      width: 100%;
      min-width: 1150px; /* asegura espacio legible para brokers y participantes */
      border-collapse: collapse;
      font-size: 13px;
    }

    .grid-reaseguradores th,
    .grid-reaseguradores td {
      padding: 6px 8px;
      border: 1px solid #f0f0f0;
      vertical-align: middle;
    }

    .grid-reaseguradores th {
      background: #fafafa;
      font-weight: 600;
      text-align: center;
    }

    .grid-reaseguradoresi select,
    .grid-reaseguradores input[type="text"] {
      width: 100%;
      box-sizing: border-box;
      height: 28px;
      padding: 4px 6px;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      font-size: 13px;
    }

    .grid-reaseguradores input[readonly] {
      background-color: #f5f5f5;
      color: rgba(0, 0, 0, 0.65);
      cursor: not-allowed;
    }

    /* ===== FILA TOTAL POR BROKER ===== */
    .grid-reaseguradores tr.row-total-broker td {
      background: #e6f7ff;
      font-weight: 700;
      color: #1890ff;
      border-top: 2px solid #91d5ff;
    }

    .grid-reaseguradores tr.row-total-broker td.total-label {
      text-align: right;
      padding-right: 12px;
      white-space: normal;
      word-break: break-word;
      overflow-wrap: anywhere;
      line-height: 1.4;
    }

    .grid-reaseguradores tr.row-total-broker td.num {
      text-align: right;
      white-space: nowrap;
    }

    /* permitir que las celdas con dropdowns o nombres largos respiren */
    .grid-reaseguradoresi select {
      max-width: 100%;
      text-overflow: ellipsis;
    }

    .grid-reaseguradores .col-broker,
    .grid-reaseguradores .col-participante {
      min-width: 230px;
      width: 230px;
    }

    .grid-coaseguradores .acciones-coasegurador {
      width: 86px;
      min-width: 86px;
      text-align: center;
      white-space: nowrap;
    }

    .grid-coaseguradores .acciones-coasegurador .ant-btn {
      width: 28px;
      height: 28px;
      padding: 0;
      margin: 0 2px;
      font-size: 16px;
      line-height: 26px;
    }

    .grid-coaseguradores .acciones-coasegurador .btn-editar-coasegurador {
      color: #1677ff;
      border: 1px solid #91caff;
      background: #e6f4ff;
      border-radius: 4px;
    }

    .grid-coaseguradores .acciones-coasegurador .btn-editar-coasegurador:hover {
      color: #0958d9;
      border-color: #4096ff;
      background: #bae0ff;
    }

    .grid-coaseguradores .acciones-coasegurador .btn-eliminar {
      color: #ff4d4f;
      border: 1px solid #ffccc7;
      background: #fff2f0;
    }

    .grid-coaseguradores .acciones-coasegurador .btn-eliminar:hover {
      color: #d9363e;
      border-color: #ff7875;
      background: #fff1f0;
    }

    .coasegurador-popconfirm {
      position: fixed;
      z-index: 1000003;
      width: 230px;
      padding: 12px;
      color: rgba(0, 0, 0, 0.85);
      font-size: 13px;
      background: #fff;
      border: 1px solid #f0f0f0;
      border-radius: 6px;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
    }

    .coasegurador-popconfirm .popconfirm-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 10px;
    }

    .grid-coaseguradores .col-participante {
      max-width: 230px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .grid-coaseguradores th:nth-child(3),
    .grid-coaseguradores td:nth-child(3) {
      text-align: center;
    }

    .grid-coaseguradores td:nth-child(4),
    .grid-coaseguradores td:nth-child(5),
    .grid-coaseguradores td:nth-child(6),
    .grid-coaseguradores td:nth-child(7),
    .grid-coaseguradores td:nth-child(9),
    .grid-coaseguradores td:nth-child(4) input,
    .grid-coaseguradores td:nth-child(5) input,
    .grid-coaseguradores td:nth-child(6) input,
    .grid-coaseguradores td:nth-child(7) input {
      text-align: right;
    }

    .grid-coaseguradores tr.coasegurador-sintetico,
    .grid-coaseguradores tr.coasegurador-sintetico td,
    .grid-coaseguradores tr.coasegurador-sintetico input {
      color: #1677ff;
    }

    .grid-coaseguradores tr.coasegurador-sintetico input {
      color: #1677ff;
      font-weight: 600;
    }

    .coaseguro-compania-resumen {
      display: block;
      width: 100%;
      padding: 12px 16px;
      box-sizing: border-box;
      color: rgba(0, 0, 0, 0.75);
      background: #f5faff;
      border: 1px solid #d6e4ff;
      border-top: 0;
      font-size: 13px;
    }

    .coaseguro-compania-resumen > div {
      display: grid;
      grid-template-columns: minmax(260px, 1.4fr) 1fr 1fr;
      align-items: center;
      min-height: 30px;
      padding: 4px 12px;
      border-top: 1px solid #e6f4ff;
    }

    .coaseguro-compania-resumen > div:not(.resumen-coaseguro-header) span {
      text-align: right;
      white-space: nowrap;
    }

    .coaseguro-compania-resumen .resumen-coaseguro-header {
      min-height: 24px;
      padding-top: 0;
      border-top: 0;
      color: #1677ff;
    }

    .coaseguro-compania-resumen .resumen-coaseguro-header strong {
      text-align: right;
    }

    .coaseguro-compania-resumen > div:not(.resumen-coaseguro-header) strong {
      color: #1677ff;
    }

    #tabCoaseguradores .reaseguradores-toolbar {
      align-items: center !important;
      min-height: 32px;
    }

    #tabCoaseguradores .reaseguradores-toolbar > label {
      align-items: center;
      margin: 0;
      line-height: 32px;
    }

    #tabCoaseguradores .reaseguradores-toolbar .ant-btn,
    #tabCoaseguradores .reaseguradores-toolbar select {
      height: 32px;
      margin: 0;
      box-sizing: border-box;
    }

    .carga-masiva-overlay {
      position: fixed;
      inset: 0;
      z-index: 999998;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(0, 0, 0, 0.35);
    }

    .carga-masiva-modal {
      width: min(560px, 100%);
      max-height: calc(100vh - 40px);
      overflow: auto;
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
    }

    .carga-masiva-header,
    .carga-masiva-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 18px;
      border-bottom: 1px solid #f0f0f0;
    }

    .carga-masiva-header h3 {
      margin: 0;
      color: rgba(0, 0, 0, 0.85);
      font-size: 17px;
    }

    .carga-masiva-close {
      border: 0;
      background: transparent;
      color: rgba(0, 0, 0, 0.45);
      cursor: pointer;
      font-size: 24px;
      line-height: 1;
    }

    .carga-masiva-body {
      padding: 18px;
      color: rgba(0, 0, 0, 0.75);
    }

    .carga-masiva-body p {
      margin: 0 0 12px;
    }

    .carga-masiva-estructura {
      display: grid;
      grid-template-columns: 1fr 1.5fr;
      gap: 6px 12px;
      margin-bottom: 14px;
      padding: 12px;
      border: 1px solid #d9d9d9;
      border-radius: 6px;
      background: #fafafa;
    }

    .carga-masiva-estructura span,
    .carga-masiva-ayuda {
      color: rgba(0, 0, 0, 0.55);
      font-size: 12px;
    }

    #archivoCargaMasiva {
      width: 100%;
      box-sizing: border-box;
      padding: 8px;
      border: 1px dashed #91d5ff;
      border-radius: 6px;
      background: #f0faff;
    }

    .carga-masiva-estado {
      min-height: 20px;
      margin-top: 12px;
      font-size: 13px;
      line-height: 1.45;
    }

    .carga-masiva-estado.cargando { color: #1677ff; }
    .carga-masiva-estado.exito { color: #389e0d; }
    .carga-masiva-estado.error { color: #cf1322; }

    .carga-masiva-footer {
      justify-content: flex-end;
      border-top: 1px solid #f0f0f0;
      border-bottom: 0;
    }



    #global-loading-mask {
      position: fixed;
      inset: 0;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.5);
    }

    .global-loading-dialog {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 230px;
      padding: 18px 24px;
      border: 1px solid #d9d9d9;
      border-radius: 8px;
      background: #f0f2f5;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      color: rgba(0, 0, 0, 0.85);
      font-size: 14px;
      font-weight: 500;
    }

    .global-loading-spinner {
      width: 18px;
      height: 18px;
      border: 3px solid #d9d9d9;
      border-top-color: #1890ff;
      border-radius: 50%;
      animation: globalLoadingSpin 0.8s linear infinite;
    }

    @keyframes globalLoadingSpin {
      to { transform: rotate(360deg); }
    }

  `)
  .appendTo("head");

function showLoading(texto = "Procesando...") {
  if (document.getElementById("global-loading-mask")) return;

  const mask = document.createElement("div");
  mask.id = "global-loading-mask";
  mask.innerHTML = `
    <div class="global-loading-dialog">
      <div class="global-loading-spinner" aria-hidden="true"></div>
      <div>${escapeHtml(texto)}</div>
    </div>
  `;
  document.body.appendChild(mask);
}

function hideLoading() {
  document.getElementById("global-loading-mask")?.remove();
}

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

$(function () {
  initGridDistribucion();
});

async function initGridDistribucion() {

  const maxIntentos = 10;
  const delay = 500;

  for (let intento = 0; intento < maxIntentos; intento++) {

    const $hidden = $("#hiddenDistribucionReaseguro");

    if ($("#gridDistribucionContainer").length) return;

    if ($hidden.length) {

      try {
        await loadDataEntities();
      } catch (e) {
        console.error(e);
      }

      crearGridDistribucion();
      renderControlesDistribucion();
      ajustarBotonesParticipantes();
      renderReaseguradores();
      addParticipantsEvent();
      validateState();

      console.log("Grid creado correctamente");
      return;
    }

    await esperar(delay);
  }

  console.warn("No se encontro #hiddenDistribucionReaseguro");
}

function ajustarBotonesParticipantes() {
  $("#controlesDistribucion .btn-aceptante").each(function () {
    const idControl = String($(this).data("id") || "");
    const config = filasControles.flat().find(x => String(x.id || "").toUpperCase() === idControl.toUpperCase());
    const esCoaseguro = normalizeCondition(config?.contrato) === "COASEGURO";

    if (!esCoaseguro) return;

    $(this)
      .addClass("btn-coasegurador")
      .prop("disabled", false)
      .removeClass("tab-disabled")
      .attr("title", "Ver coaseguradores")
      .find(".btn-aceptante-watermark")
      .remove();
  });
}

function agruparParticipantsCoaseguro(cessions, contrato) {
  const fuentes = Array.isArray(coCessions)
    ? coCessions.filter(item => item && Number(item.contactId) !== 4939)
    : [];
  if (!fuentes.length) return [];

  const totalBase = getCoaseguroGlobalBase();

  const resultados = fuentes.map(source => {
    const sourcePercentage = numeroDe(source.percentage);
    const participantShare = sourcePercentage;

    return {
      id: source.id,
      cessionId: source.id,
      name: source.coinsurerName || source.Contact?.name || "",
      contactId: source.contactId ?? null,
      leader: source.leader === true || Number(source.leader) === 1 || String(source.leader).toLowerCase() === "true",
      lineId: "COASEGURO",
      currency: source.currency,
      liquidationId: source.liquidationId,
      reserve: 0,
      brokerId: null,
      Broker: null,
      fee: 0,
      jAmounts: null,
      split: redondear(sourcePercentage, 5, true),
      slip: redondear(sourcePercentage, 5, true),
      sumInsured: redondearMonto(totalBase.sumInsured * participantShare / 100),
      premium: redondearMonto(totalBase.premium * participantShare / 100),
      commission: redondearMonto(totalBase.commission * participantShare / 100),
      tax: redondearMonto(totalBase.tax * participantShare / 100),
      globalPercentage: sourcePercentage,
      sourceSumInsured: numeroDe(source.sumInsuredCeded),
      sourcePremium: numeroDe(source.premiumCeded)
    };
  });

  const totalPercentage = resultados.reduce((total, row) => total + numeroDe(row.split), 0);
  const factor = totalPercentage / 100;
  ajustarDiferenciaAlMayor(resultados, "sumInsured", redondearMonto(totalBase.sumInsured * factor));
  ajustarDiferenciaAlMayor(resultados, "premium", redondearMonto(totalBase.premium * factor));
  ajustarDiferenciaAlMayor(resultados, "commission", redondearMonto(totalBase.commission * factor));
  ajustarDiferenciaAlMayor(resultados, "tax", redondearMonto(totalBase.tax * factor));

  return resultados;
}

function getCoaseguradorNombreById(id) {
  return coaseguradores.find(a => a.id === id)?.nombre || "";
}

function getCoaseguroGlobalBase() {
  const sourceBase = (Array.isArray(coCessions) ? coCessions : []).reduce((total, source) => {
    total.sumInsured += numeroDe(source.sumInsuredCeded);
    total.premium += numeroDe(source.premiumCeded);
    total.commission += numeroDe(source.commission);
    total.tax += numeroDe(source.tax);
    return total;
  }, { sumInsured: 0, premium: 0, commission: 0, tax: 0 });

  const policySumInsured = numeroDe(policy?.insuredSum);
  const policyPremium = numeroDe(policy?.anualPremium);
  return {
    sumInsured: policySumInsured > 0 ? policySumInsured : sourceBase.sumInsured,
    premium: policyPremium > 0 ? policyPremium : sourceBase.premium,
    commission: sourceBase.commission,
    tax: sourceBase.tax
  };
}

async function actualizarCoinsuranceLifePolicy(valor) {
  const coinsurance = Number(valor) === 1 ? 1 : 2;
  return await me.exe("DoQuery", {
    sql: `UPDATE LifePolicy SET coinsurance = ${coinsurance} WHERE id = ${parseInt(policyId, 10)}`
  });
}

function renderCoaseguradores() {
  const $container = $("#tabCoaseguradores");
  if (!$container.length) return;

  $container.empty();

  const html = `
    <div id="gridDistribucionContainerCoaseguradores" style="padding-bottom:20px;">
      <div class="reaseguradores-toolbar" style="display:flex; gap:12px; align-items:center; margin-bottom:10px; flex-wrap:wrap;">
        <button id="btnAgregarCoasegurador" class="ant-btn ant-btn-primary">+ Agregar coasegurador</button>
        <button id="btnActualizarCoaseguradores" class="ant-btn">&#8635; Refrescar</button>
        <label for="coaseguradoraCompaniaLider" style="display:flex; align-items:center; gap:8px; margin-left:4px;">
          ¿Compañía es Líder?
          <select id="coaseguradoraCompaniaLider" class="ant-input" style="width:76px;">
            <option value="no" ${Number(policy?.coinsurance) === 1 ? "" : "selected"}>No</option>
            <option value="si" ${Number(policy?.coinsurance) === 1 ? "selected" : ""}>Si</option>
          </select>
        </label>
      </div>
      <div id="contenedorGridCoaseguradores"></div>
    </div>
  `;

  $container.append(html);

  $(document).off("click", "#btnAgregarCoasegurador")
    .on("click", "#btnAgregarCoasegurador", function () {
      abrirModalAgregarCoasegurador();
    });

  $(document).off("click", "#btnActualizarCoaseguradores")
    .on("click", "#btnActualizarCoaseguradores", async function () {
      const $button = $(this);
      $button.prop("disabled", true);
      showLoading("Actualizando coaseguradores...");
      await new Promise(resolve => setTimeout(resolve, 0));
      try {
        await loadCoCessions();
        cessions = appendCoCessionLines(cessions.filter(item => item.__source !== "COASEGURO"), coCessions);
        coaseguradoresData = agruparParticipantsCoaseguro(cessions, "COASEGURO");
        renderCoaseguradores();
      } finally {
        hideLoading();
        $button.prop("disabled", false);
      }
    });

  $(document).off("change", "#coaseguradoraCompaniaLider")
    .on("change", "#coaseguradoraCompaniaLider", async function () {
      const $select = $(this);
      const companiaEsLider = $select.val() === "si";
      $select.prop("disabled", true);
      showLoading("Actualizando liderazgo de la compañía...");
      try {
        const resultado = await actualizarCoinsuranceLifePolicy(companiaEsLider ? 1 : 2);
        if (!resultado?.ok) {
          mostrarNotificacion(`No se pudo actualizar el liderazgo de la compañía: ${resultado?.msg || "Error"}`, "warning");
          $select.val(companiaEsLider ? "no" : "si");
          return;
        }

        if (companiaEsLider) {
          coaseguradoresData.forEach(row => { row.leader = false; });
          renderCoaseguradoresGrid();
          preserveDistribution();
          await guardarCoaseguradores(false);
        }
        policy.coinsurance = companiaEsLider ? 1 : 2;
      } finally {
        hideLoading();
        $select.prop("disabled", false);
      }
    });

  renderCoaseguradoresGrid();
  eventosCoaseguradores();
  ajustarBotonesParticipantes();
}

function renderCoaseguradoresGrid() {
  const $contenedor = $("#contenedorGridCoaseguradores");
  if (!$contenedor.length) return;
  $contenedor.empty();

  const base = getCoaseguroGlobalBase();
  const porcentajeDistribuido = coaseguradoresData.reduce(
    (total, row) => total + numeroDe(row.split),
    0
  );
  const porcentajeCompania = Math.max(0, redondear(100 - porcentajeDistribuido, 5, true));
  const sumaColocada = redondearMonto(coaseguradoresData.reduce((total, row) => total + numeroDe(row.sumInsured), 0));
  const primaColocada = redondearMonto(coaseguradoresData.reduce((total, row) => total + numeroDe(row.premium), 0));
  const comisionCorredorTotal = redondearMonto((Array.isArray(coCessions) ? coCessions : [])
    .reduce((total, row) => total + numeroDe(row.brokerCommission), 0));
  const comisionCorredorColocada = redondearMonto(coaseguradoresData
    .reduce((total, row) => total + numeroDe(row.brokerCommission), 0));
  const sumaCompania = redondearMonto(base.sumInsured - sumaColocada);
  const primaCompania = redondearMonto(base.premium - primaColocada);
  const comisionCorredorCompania = redondearMonto(comisionCorredorTotal - comisionCorredorColocada);

  const $bloque = $(`<table class="ant-table grid-reaseguradores grid-coaseguradores">
    <thead>
      <tr>
        <th>Acciones</th>
        <th>Coasegurador</th>
        <th>Líder</th>
        <th>Suma asegurada</th>
        <th>Prima</th>
        <th>Commission</th>
        <th>%</th>
        <th>Intermediario</th>
        <th>Comisión del corredor</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>`);

  const $tbody = $bloque.find("tbody");
  coaseguradoresData.forEach((r, index) => {
    const nombreActual = getCoaseguradorNombreById(r.contactId) || r.name || (r.contactId != null ? `Contacto ${r.contactId}` : "");
    const $row = $(`<tr data-index="${index}">
      <td class="acciones-coasegurador">
        <button type="button" class="ant-btn ant-btn-link btn-editar-coasegurador" data-index="${index}" title="Editar coasegurador" aria-label="Editar coasegurador">&#9998;</button>
        <button type="button" class="ant-btn ant-btn-link btn-eliminar" data-index="${index}" title="Eliminar coasegurador" aria-label="Eliminar coasegurador">&#128465;</button>
      </td>
      <td class="col-participante" title="${escapeHtml(nombreActual)}">&#128100; ${escapeHtml(nombreActual)}</td>
      <td>${r.leader === true || Number(r.leader) === 1 || String(r.leader).toLowerCase() === "true" ? "Si" : "No"}</td>
      <td><input type="text" value="${formatInput(r.sumInsured,'number')}" class="number cell-input" data-key="sumInsured" readonly /></td>
      <td><input type="text" value="${formatInput(r.premium,'number')}" class="number cell-input" data-key="premium" readonly /></td>
      <td><input type="text" value="${formatInput(r.commission,'number')}" class="number cell-input" data-key="commission" readonly /></td>
      <td><input type="text" value="${formatInput(r.split, 'percent')}" class="percent cell-input" data-key="split" readonly /></td>
      <td>${escapeHtml(r.intermediaryName || "")}</td>
      <td>${formatearMonto(r.brokerCommission || 0)}</td>
    </tr>`);
    $tbody.append($row);
  });

  // This row is presentation-only and must never enter the persistence array.
  const $rowCompania = $(`<tr class="coasegurador-sintetico">
    <td class="acciones-coasegurador"></td>
    <td class="col-participante" title="Relacionado a la compañía">&#128100; CONTEMPORA</td>
    <td>${Number(policy?.coinsurance) === 1 ? "Si" : "No"}</td>
    <td><input type="text" value="${formatearMonto(sumaCompania)}" class="number cell-input" readonly /></td>
    <td><input type="text" value="${formatearMonto(primaCompania)}" class="number cell-input" readonly /></td>
    <td><input type="text" value="${formatearMonto(0)}" class="number cell-input" readonly /></td>
    <td><input type="text" value="${formatearRedondeado(porcentajeCompania, 5)}" class="percent cell-input" readonly /></td>
    <td></td>
    <td>${formatearMonto(comisionCorredorCompania)}</td>
  </tr>`);
  $tbody.append($rowCompania);

  $contenedor.append($bloque);
  $contenedor.append(`<div class="coaseguro-compania-resumen">
    <div class="resumen-coaseguro-header"><span></span><strong>Suma</strong><strong>Prima</strong></div>
    <div><strong>Suma Total / Prima Total</strong><span>${formatearMonto(base.sumInsured)}</span><span>${formatearMonto(base.premium)}</span></div>
    <div><strong>Colocado en Coaseguro</strong><span>${formatearMonto(sumaColocada)}</span><span>${formatearMonto(primaColocada)}</span></div>
    <div><strong>Neto relacionado a la compañía</strong><span>${formatearMonto(sumaCompania)}</span><span>${formatearMonto(primaCompania)}</span></div>
  </div>`);
}

function mostrarConfirmacionAplicarContrato() {
  return new Promise(resolve => {
    $("#modalConfirmarAplicarContrato").remove();
    const html = `
      <div id="modalConfirmarAplicarContrato" class="carga-masiva-overlay" style="z-index:1000002;">
        <div class="carga-masiva-modal" role="dialog" aria-modal="true" aria-labelledby="tituloConfirmarAplicarContrato" style="width:min(440px,100%);">
          <div class="carga-masiva-header">
            <h3 id="tituloConfirmarAplicarContrato">Aplicar contrato</h3>
            <button type="button" class="carga-masiva-close" data-confirmar-aplicar="no">&times;</button>
          </div>
          <div class="carga-masiva-body">
            <p style="margin:0;">Es necesario aplicar el contrato porque se ha modificado el coaseguro.</p>
            <p style="margin:12px 0 0;">¿Desea hacerlo en este momento?</p>
          </div>
          <div class="carga-masiva-footer" style="justify-content:flex-end;">
            <button type="button" class="ant-btn" data-confirmar-aplicar="no">No</button>
            <button type="button" class="ant-btn ant-btn-primary" data-confirmar-aplicar="si">Sí</button>
          </div>
        </div>
      </div>`;

    $("body").append(html);
    $(document).off("click.confirmarAplicarContrato", "[data-confirmar-aplicar]")
      .on("click.confirmarAplicarContrato", "[data-confirmar-aplicar]", function () {
        const aplicar = $(this).data("confirmar-aplicar") === "si";
        $("#modalConfirmarAplicarContrato").remove();
        $(document).off("click.confirmarAplicarContrato", "[data-confirmar-aplicar]");
        resolve(aplicar);
      });
  });
}

function abrirModalAgregarCoasegurador(index = null) {
  $("#modalAgregarCoasegurador").remove();

  const rowEdit = index === null ? null : coaseguradoresData[index];
  if (index !== null && !rowEdit) return;

  const idsRegistrados = new Set(coaseguradoresData
    .filter((row, rowIndex) => rowIndex !== index)
    .map(row => String(row.contactId)));
  const disponibles = coaseguradores.filter(item => !idsRegistrados.has(String(item.id)));
  if (!disponibles.length) {
    mostrarNotificacion("Todos los coaseguradores disponibles ya fueron agregados.", "warning");
    return;
  }

  const base = getCoaseguroGlobalBase();
  const porcentajeComision = rowEdit?.commissionRate ?? (base.premium > 0 ? (base.commission / base.premium) * 100 : 0);
  const opciones = disponibles
    .map(item => `<option value="${item.id}" ${rowEdit && String(rowEdit.contactId) === String(item.id) ? "selected" : ""}>${escapeHtml(item.nombre || `Contacto ${item.id}`)}</option>`)
    .join("");

  const html = `
    <div id="modalAgregarCoasegurador" class="carga-masiva-overlay">
      <div class="carga-masiva-modal" role="dialog" aria-modal="true" aria-labelledby="tituloAgregarCoasegurador">
        <div class="carga-masiva-header">
          <h3 id="tituloAgregarCoasegurador">${rowEdit ? "Editar Coasegurador" : "Selección de Coasegurador"}</h3>
          <button type="button" class="carga-masiva-close" id="cerrarModalAgregarCoasegurador">&times;</button>
        </div>
        <div class="carga-masiva-body">
          <label for="modalCoasegurador">Coasegurador:</label>
          <select id="modalCoasegurador" class="ant-input" style="width:100%; margin:8px 0 14px;">
            <option value="">Seleccione...</option>
            ${opciones}
          </select>

          <label style="display:flex; align-items:center; gap:8px; margin-bottom:14px;">
            <input id="modalCoaseguradorLider" type="checkbox" ${rowEdit?.leader ? "checked" : ""} />
            Líder
          </label>

          <label for="modalCoaseguradorPorcentaje">% Ced:</label>
          <input id="modalCoaseguradorPorcentaje" class="ant-input percent" type="text" value="${formatearRedondeado(rowEdit?.split ?? 0, 5)}" style="width:100%; margin:8px 0 14px;" />

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div>
              <label>Suma asegurada:</label>
              <input id="modalCoaseguradorSumaBase" class="ant-input" type="text" value="${formatearMonto(base.sumInsured)}" readonly />
            </div>
            <div>
              <label>Prima:</label>
              <input id="modalCoaseguradorPrimaBase" class="ant-input" type="text" value="${formatearMonto(base.premium)}" readonly />
            </div>
            <div>
              <label>Suma asegurada cedida:</label>
              <input id="modalCoaseguradorSuma" class="ant-input number" type="text" value="0,00000" />
            </div>
            <div>
              <label>Prima cedida:</label>
              <input id="modalCoaseguradorPrima" class="ant-input number" type="text" value="0,00000" />
            </div>
            <div>
              <label>Commission:</label>
              <input id="modalCoaseguradorComision" class="ant-input number" type="text" value="0,00000" />
            </div>
            <div>
              <label>% Commission:</label>
              <input id="modalCoaseguradorPorcentajeComision" class="ant-input percent" type="text" value="${formatearRedondeado(porcentajeComision, 5)}" />
            </div>
          </div>
          <div style="margin-top:14px; position:relative;">
            <label for="modalCoaseguradorIntermediario">Intermediario:</label>
            <input id="modalCoaseguradorIntermediario" class="ant-input" type="text" autocomplete="off" placeholder="Escribir para buscar contacto..." value="${escapeHtml(rowEdit?.intermediaryName || "")}" style="width:100%; margin-top:8px;" />
            <input id="modalCoaseguradorIntermediarioId" type="hidden" value="${rowEdit?.intermediaryId ?? rowEdit?.brokerId ?? ""}" />
            <div id="modalCoaseguradorIntermediarioOpciones" style="display:none; position:fixed; z-index:1000001; max-height:180px; overflow:auto; background:#fff; border:1px solid #d9d9d9; box-shadow:0 4px 12px rgba(0,0,0,.15);"></div>
          </div>
        </div>
        <div class="carga-masiva-footer">
          <button type="button" class="ant-btn" id="cancelarModalAgregarCoasegurador">Cancelar</button>
          <button type="button" class="ant-btn ant-btn-primary" id="aceptarModalAgregarCoasegurador">Aceptar</button>
        </div>
      </div>
    </div>`;

  $("body").append(html);

  const actualizarMontos = () => {
    const porcentaje = numeroDe($("#modalCoaseguradorPorcentaje").val());
    const porcentajeCom = numeroDe($("#modalCoaseguradorPorcentajeComision").val());
    const suma = redondearMonto(base.sumInsured * porcentaje / 100);
    const prima = redondearMonto(base.premium * porcentaje / 100);
    const comision = redondearMonto(prima * porcentajeCom / 100);
    $("#modalCoaseguradorSuma").val(formatearMonto(suma));
    $("#modalCoaseguradorPrima").val(formatearMonto(prima));
    $("#modalCoaseguradorComision").val(formatearMonto(comision));
  };

  const posicionarOpcionesIntermediario = () => {
    const input = $("#modalCoaseguradorIntermediario")[0];
    const $opciones = $("#modalCoaseguradorIntermediarioOpciones");
    if (!input || !$opciones.length) return;
    const rect = input.getBoundingClientRect();
    const altura = Math.min(180, Math.max(80, window.innerHeight - rect.bottom - 12));
    const abrirArriba = window.innerHeight - rect.bottom < 190 && rect.top > 190;
    $opciones.css({
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      top: abrirArriba ? "auto" : `${rect.bottom + 4}px`,
      bottom: abrirArriba ? `${window.innerHeight - rect.top + 4}px` : "auto",
      maxHeight: `${altura}px`
    });
  };

  $("#modalCoaseguradorPorcentaje, #modalCoaseguradorPorcentajeComision")
    .on("input", actualizarMontos);
  actualizarMontos();

  let intermediarioTimer = null;
  const buscarIntermediarios = async (texto) => {
    const termino = String(texto || "").trim().replace(/'/g, "''");
    const $opciones = $("#modalCoaseguradorIntermediarioOpciones");
    if (termino.length < 2) {
      $opciones.hide().empty();
      return;
    }

    const result = await me.exe("GetContacts", {
      filter: `((RTRIM(ISNULL([name],''))+' '+RTRIM(ISNULL(surname1,''))+' '+RTRIM(ISNULL(surname2,''))) like N'%${termino}%')`,
      size: 10,
      page: 0,
      total: 0,
      tagFilterAll: null,
      tagFilterAny: null,
      include: null,
      getRelatedData: false
    });
    const contactos = Array.isArray(result?.outData) ? result.outData : [];
    if (!contactos.length) {
      $opciones.html('<div style="padding:8px; color:#999;">Sin resultados</div>').show();
      return;
    }

    $opciones.html(contactos.map(contacto => {
      const nombre = contacto.FullName || [contacto.name, contacto.surname1, contacto.surname2].filter(Boolean).join(" ");
      return `<div class="modal-contacto-opcion" data-id="${contacto.id}" data-nombre="${escapeHtml(nombre)}" style="padding:8px 10px; cursor:pointer;">${escapeHtml(nombre)}</div>`;
    }).join("")).show();
    posicionarOpcionesIntermediario();
  };

  $("#modalCoaseguradorIntermediario").on("input", function () {
    $("#modalCoaseguradorIntermediarioId").val("");
    clearTimeout(intermediarioTimer);
    const texto = this.value;
    intermediarioTimer = setTimeout(() => buscarIntermediarios(texto), 250);
  });

  $(window).off("resize.modalCoasegurador scroll.modalCoasegurador")
    .on("resize.modalCoasegurador scroll.modalCoasegurador", posicionarOpcionesIntermediario);

  $(document).off("mouseenter", "#modalCoaseguradorIntermediarioOpciones .modal-contacto-opcion")
    .on("mouseenter", "#modalCoaseguradorIntermediarioOpciones .modal-contacto-opcion", function () {
      $(this).css("background", "#f5f5f5");
    })
    .off("mouseleave", "#modalCoaseguradorIntermediarioOpciones .modal-contacto-opcion")
    .on("mouseleave", "#modalCoaseguradorIntermediarioOpciones .modal-contacto-opcion", function () {
      $(this).css("background", "#fff");
    })
    .off("click", "#modalCoaseguradorIntermediarioOpciones .modal-contacto-opcion")
    .on("click", "#modalCoaseguradorIntermediarioOpciones .modal-contacto-opcion", function () {
      $("#modalCoaseguradorIntermediario").val($(this).data("nombre"));
      $("#modalCoaseguradorIntermediarioId").val($(this).data("id"));
      $("#modalCoaseguradorIntermediarioOpciones").hide().empty();
    });

  const cerrarModalCoasegurador = () => {
    $("#modalAgregarCoasegurador").remove();
    $(document).off("keydown.modalAgregarCoasegurador");
  };

  $(document).off("click", "#cerrarModalAgregarCoasegurador, #cancelarModalAgregarCoasegurador")
    .on("click", "#cerrarModalAgregarCoasegurador, #cancelarModalAgregarCoasegurador", cerrarModalCoasegurador);

  $(document).off("keydown.modalAgregarCoasegurador")
    .on("keydown.modalAgregarCoasegurador", function (event) {
      if (event.key === "Escape") cerrarModalCoasegurador();
    });

  $(document).off("click", "#aceptarModalAgregarCoasegurador")
    .on("click", "#aceptarModalAgregarCoasegurador", async function () {
      const contactId = Number($("#modalCoasegurador").val());
      const participante = disponibles.find(item => item.id === contactId);
      const split = numeroDe($("#modalCoaseguradorPorcentaje").val());
      const commissionRate = numeroDe($("#modalCoaseguradorPorcentajeComision").val());
      const intermediaryId = Number($("#modalCoaseguradorIntermediarioId").val()) || null;
      const intermediaryName = String($("#modalCoaseguradorIntermediario").val() || "").trim();
      const lider = $("#modalCoaseguradorLider").is(":checked");
      const totalSplit = coaseguradoresData.reduce((total, row, rowIndex) => total + (rowIndex === index ? 0 : numeroDe(row.split)), 0) + split;

      if (!participante) {
        mostrarNotificacion("Seleccione un coasegurador.", "warning");
        return;
      }
      if (!Number.isFinite(split) || split <= 0) {
        mostrarNotificacion("Ingrese un porcentaje de participación mayor que cero.", "warning");
        $("#modalCoaseguradorPorcentaje").trigger("focus");
        return;
      }
      if (coaseguradoresData.some((row, rowIndex) => rowIndex !== index && String(row.contactId) === String(contactId))) {
        mostrarNotificacion("El coasegurador seleccionado ya fue agregado.", "warning");
        return;
      }
      if (split < 0 || totalSplit > 100) {
        mostrarNotificacion("La suma de porcentajes no puede exceder 100%.", "warning");
        return;
      }

      if (!Number.isFinite(Number(policy?.coinsurance)) || Number(policy.coinsurance) <= 0) {
        const companiaEsLider = $("#coaseguradoraCompaniaLider").val() === "si";
        const resultadoCoinsurance = await actualizarCoinsuranceLifePolicy(companiaEsLider ? 1 : 2);
        if (!resultadoCoinsurance?.ok) {
          mostrarNotificacion(`No se pudo activar el coaseguro de la póliza: ${resultadoCoinsurance?.msg || "Error"}`, "warning");
          return;
        }
        policy.coinsurance = companiaEsLider ? 1 : 2;
      }

      const row = {
        name: participante.nombre,
        contactId,
        cessionId: rowEdit?.cessionId ?? 0,
        lineId: "COASEGURO",
        split,
        slip: split,
        sumInsured: numeroDe($("#modalCoaseguradorSuma").val()),
        premium: numeroDe($("#modalCoaseguradorPrima").val()),
        commission: numeroDe($("#modalCoaseguradorComision").val()),
        commissionRate,
        saldoRea: 0,
        tax: redondearMonto(base.tax * split / 100),
        brokerCommission: 0,
        intermediaryId,
        intermediaryName,
        leader: lider,
        overwritten: rowEdit?.overwritten ?? false,
        brokerId: intermediaryId,
        Broker: null
      };

      if (index === null) coaseguradoresData.push(row);
      else coaseguradoresData[index] = { ...row, id: rowEdit.id };
      if (lider) {
        coaseguradoresData.forEach(item => {
          item.leader = String(item.contactId) === String(contactId);
        });
        $("#coaseguradoraCompaniaLider").val("no");
        await actualizarCoinsuranceLifePolicy(2);
        policy.coinsurance = 2;
      }
      $("#modalAgregarCoasegurador").remove();
      renderCoaseguradores();
      preserveDistribution();
      await guardarCoaseguradores(false);

      const aplicarAhora = await mostrarConfirmacionAplicarContrato();
      if (aplicarAhora) {
        $("#btnRecalcular").trigger("click");
      }
    });
}

function eventosCoaseguradores() {
  $(document).off("click", "#contenedorGridCoaseguradores .btn-editar-coasegurador")
    .on("click", "#contenedorGridCoaseguradores .btn-editar-coasegurador", function () {
      abrirModalAgregarCoasegurador(Number($(this).data("index")));
    });

  $(document).off("change", "#contenedorGridCoaseguradores .coasegurador-select")
    .on("change", "#contenedorGridCoaseguradores .coasegurador-select", function () {
      const index = parseInt($(this).data("index"), 10);
      const row = coaseguradoresData[index];
      if (!row) return;
      const id = parseInt($(this).val(), 10);
      row.contactId = Number.isFinite(id) ? id : null;
      row.name = getCoaseguradorNombreById(row.contactId) || row.name || "";
    });

  $(document).off("focus", "#contenedorGridCoaseguradores input.percent")
    .on("focus", "#contenedorGridCoaseguradores input.percent", function () { setTimeout(() => { this.select(); }, 0); })
    .off("mousedown", "#contenedorGridCoaseguradores input.percent")
    .on("mousedown", "#contenedorGridCoaseguradores input.percent", function (e) {
      if (this !== document.activeElement) { e.preventDefault(); this.focus(); }
    })
    .off("input", "#contenedorGridCoaseguradores input.cell-input")
    .on("input", "#contenedorGridCoaseguradores input.cell-input", function () {
      const index = parseInt($(this).closest("tr").data("index"), 10);
      const row = coaseguradoresData[index];
      if (!row) return;
      const key = $(this).data("key");
      const val = numeroDe(this.value);
      const oldValue = key === "slip" ? getParticipantSlip(row) : (row[key] || 0);

      if (key === "split") {
        const totalSplit = coaseguradoresData.reduce((acc, participant, i) => acc + (i === index ? val : numeroDe(participant.split)), 0);
        if (val < 0 || totalSplit > 100) {
          this.value = formatearRedondeado(oldValue, 5);
          mostrarNotificacion(`La suma de porcentajes no puede exceder 100%`, "warning");
          return;
        }
        row.split = val;
        recalculateParticipantAmounts(row);
      } else if (key === "slip") {
        const totalSlip = coaseguradoresData.reduce((acc, participant, i) => acc + (i === index ? val : getParticipantSlip(participant)), 0);
        if (val < 0 || totalSlip > 100) {
          this.value = formatearRedondeado(oldValue, 5);
          mostrarNotificacion(`La suma de porcentajes Slip no puede exceder 100%`, "warning");
          return;
        }
        row.slip = val;
        const targetSlip = getDistributionPercentage();
        row.split = targetSlip === 0 ? 0 : redondear(val * 100 / targetSlip, 5, true);
        recalculateParticipantAmounts(row);
      }

      if (key === "split" || key === "slip") {
        adjustCoaseguradorRoundingDifferences();
        refreshCoaseguradorGridValues();
      } else {
        row[key] = val;
      }
    })
    .off("blur", "#contenedorGridCoaseguradores input.cell-input")
    .on("blur", "#contenedorGridCoaseguradores input.cell-input", function () {
      const index = parseInt($(this).closest("tr").data("index"), 10);
      const row = coaseguradoresData[index];
      if (!row) return;
      const key = $(this).data("key");
      const val = key === "slip" ? getParticipantSlip(row) : (row[key] || 0);
      if (["sumInsured","premium","commission","tax"].includes(key)) {
        this.value = formatearMonto(val);
      } else {
        this.value = formatearRedondeado(val, 5);
      }
    });

  $("#contenedorGridCoaseguradores")
    .off("click.eliminarCoasegurador", ".btn-eliminar")
    .on("click.eliminarCoasegurador", ".btn-eliminar", async function (event) {
      event.preventDefault();
      event.stopPropagation();
      const index = parseInt($(this).data("index"), 10);
      if (!Number.isInteger(index) || !coaseguradoresData[index]) return;

      coaseguradoresData.splice(index, 1);
      renderCoaseguradores();
      preserveDistribution();
      await guardarCoaseguradores(false);

      const aplicarAhora = await mostrarConfirmacionAplicarContrato();
      if (aplicarAhora) {
        $("#btnRecalcular").trigger("click");
      }
    });
}

function refreshCoaseguradorGridValues() {
  const activeElement = document.activeElement;

  $("#contenedorGridCoaseguradores tr[data-index]").each(function () {
    const index = Number($(this).data("index"));
    const row = coaseguradoresData[index];
    if (!row) return;
    const setValue = (selector, value) => {
      const input = $(this).find(selector)[0];
      if (input && input !== activeElement) input.value = value;
    };

    setValue('input[data-key="split"]', formatInput(row.split, "percent"));
    setValue('input[data-key="slip"]', formatInput(getParticipantSlip(row), "percent"));
    setValue('input[data-key="sumInsured"]', formatearMonto(row.sumInsured));
    setValue('input[data-key="premium"]', formatearMonto(row.premium));
    setValue('input[data-key="commission"]', formatearMonto(row.commission));
    setValue('input[data-key="tax"]', formatearMonto(row.tax));
    setValue('input[data-key="saldoRea"]', formatearMonto(numeroDe(row.premium) - numeroDe(row.commission)));
  });
}

function adjustCoaseguradorRoundingDifferences() {
  if (!coaseguradoresData.length) return;
  const totalSplit = coaseguradoresData.reduce((total, participant) => total + numeroDe(participant.split), 0);
  if (Math.abs(totalSplit - 100) > 0.00001) return;
  const totalBase = getCoaseguroGlobalBase();
  coaseguradoresData.forEach(recalculateParticipantAmounts);
  ajustarDiferenciaAlMayor(coaseguradoresData, "sumInsured", totalBase.sumInsured);
  ajustarDiferenciaAlMayor(coaseguradoresData, "premium", totalBase.premium);
  ajustarDiferenciaAlMayor(coaseguradoresData, "commission", totalBase.commission);
  ajustarDiferenciaAlMayor(coaseguradoresData, "tax", totalBase.tax);
}

async function guardarCoaseguradores(validarDistribucionCompleta = true) {
  showLoading("Guardando coaseguradores...");
  await new Promise(resolve => setTimeout(resolve, 0));

  try {
    if (validarDistribucionCompleta) {
      const targetPercentage = numeroDe($("#pco").val());
      const totalPercentage = coaseguradoresData.reduce((total, row) => total + numeroDe(row.split), 0);
      const totalSlip = coaseguradoresData.reduce((total, row) => total + getParticipantSlip(row), 0);
      if (Math.abs(totalPercentage - targetPercentage) > 0.0001 || Math.abs(totalSlip - targetPercentage) > 0.0001) {
        mostrarNotificacion("El total porcentual de coaseguradores no coincide con el coaseguro configurado.", "warning");
        return;
      }
    }

    const sqlResult = await saveCoCessionsSql(cessions, coaseguradoresData);
    if (!sqlResult?.ok) {
      mostrarNotificacion(`No se pudo registrar coaseguradores`, "warning");
      return;
    }

    await loadCoCessions();
    cessions = appendCoCessionLines(cessions.filter(item => item.__source !== "COASEGURO"), coCessions);
    preserveDistribution();
    mostrarNotificacion(`Coaseguradores registrados satisfactoriamente`, "success");
  } finally {
    hideLoading();
  }
}

async function guardarParticipantesDesdeData(data, contrato, etiqueta) {
  showLoading("Guardando participantes...");
  await new Promise(resolve => setTimeout(resolve, 0));
  try {
    const cessionCobs = cessions.filter(x => filterCondition(contrato, x));
    const resultado = validarTotalesReaseguradores(cessionCobs, data);
    if (!resultado?.ok) {
      mostrarNotificacion(resultado.msg ?? "Total distribuido tiene diferencias", "warning");
      return;
    }

    const participantes = redistribuirCoaseguradoresPorCobertura(cessionCobs);
    if (participantes.find(x => !x.cessionId || x.cessionId <= 0) || participantes.length === 0) {
      mostrarNotificacion(`Debe guardar primero la distribución antes de registrar ${etiqueta.toLowerCase()}.`, "warning");
      return;
    }

    cessions.forEach(ces => {
      if (filterCondition(contrato, ces)) {
        ces.Participants = participantes.filter(a => a.cessionId == ces.id);
      }
    });

    const ok = await addAceptantes(cessionCobs, participantes);
    if (!ok) {
      mostrarNotificacion(`No se pudo registrar ${etiqueta.toLowerCase()}`, "warning");
    } else {
      preserveDistribution();
      mostrarNotificacion(`${etiqueta} registrados satisfactoriamente`, "success");
    }
  } finally {
    hideLoading();
  }
}

function redistribuirCoaseguradoresPorCobertura(cessionCobs) {
  const totalCob = cessionCobs.reduce((acc, c) => {
    acc.sumInsuredRe += c.sumInsuredRe || 0;
    acc.premiumRe += c.premiumRe || 0;
    acc.comissionCedant += c.comissionCedant || 0;
    acc.tax += c.tax || 0;
    return acc;
  }, { sumInsuredRe: 0, premiumRe: 0, comissionCedant: 0, tax: 0 });

  const resultado = [];

  cessionCobs.forEach(ces => {
    const factorPr = totalCob.premiumRe === 0 ? 0 : ces.premiumRe / totalCob.premiumRe;
    coaseguradoresData.forEach(r => {
      resultado.push({
        id: 0,
        coverageCode: ces.coverageCode,
        lineId: ces.lineId,
        cessionId: ces.id,
        contactId: r.contactId,
        name: r.name,
        split: numeroDe(r.split),
        sumInsured: redondearMonto(ces.sumInsuredRe * (numeroDe(r.split) / 100)),
        premium: redondearMonto(numeroDe(r.premium) * factorPr),
        commission: redondearMonto(numeroDe(r.commission) * factorPr),
        tax: redondearMonto(numeroDe(r.tax) * factorPr),
        currency: ces.currency,
        liquidationId: null,
        reserve: 0,
        brokerId: null,
        Broker: null,
        fee: 0,
        jAmounts: null
      });
    });
  });

  ajustarDiferenciasAceptantes(resultado, totalCob);
  return resultado;
}

function addParticipantsEvent() {
  $(document)
    .off("click", ".btn-aceptante")
    .on("click", ".btn-aceptante", function (e) {
      e.preventDefault();

      if (this.disabled) return;
      if (distributionDirty) {
        mostrarNotificacion(`Debe guardar la distribución para reflejar los cambios en Coaseguradores.`, "warning");
        return;
      }

      const idControl = $(this).data("id");
      const configAcep = filasControles.flat().find(x => x.id.toUpperCase() === idControl.toUpperCase());
      if (!configAcep || !configAcep.contrato) return;

      debugger;
      tipoContratoSelected = configAcep.contrato;
      abrirAceptantes(idControl, configAcep.contrato);
    });
}

function renderTabsDistribucion() {
  const $container = $("#gridDistribucionContainer");
  if (!$container.length) return;

  $container.find("#tabsDistribucion").remove();

  const html = `
  <div id="tabsDistribucion">
    <div class="tabs-header">
      <button class="tab-btn active" data-tab="tabControles">Distribución</button>
      <button class="tab-btn" data-tab="tabReaseguradores" disabled title="Primero use la opciÃ³n de mostrar participantes">Reaseguradores</button>
    </div>
    <div id="tabControles" class="tab-content"></div>
    <div id="tabReaseguradores" class="tab-content" style="display:none;"></div>
  </div>`;

  $container.append(html);
  updateAceptantesTabState(false);
  updateCoaseguradoresTabState(true);

  $(".tab-btn").off("click")
    .on("click", function () {
      if (this.disabled) return;
      const tab = $(this).data("tab");

      if (tab === "tabReaseguradores" && distributionDirty) {
        mostrarNotificacion(`Debe guardar la distribución para reflejar los cambios en Participantes.`, "warning");
        return;
      }
      if (tab === "tabReaseguradores") refreshReaseguradoresTab();

      $(".tab-btn").removeClass("active");
      $(this).addClass("active");
      $(".tab-content").hide();
      $("#" + tab).show();
    });
}
