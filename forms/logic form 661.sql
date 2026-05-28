var me = this;
let cessions = [];
let coverages = [];
let config = [];
let policy = {};
let gridData = [];
let gridDataSelected = null;
let gridSelectedIndex = null;
let contractId = 0;

const policyId = window.location.href.split('/')[5] || 815;

///////////////////////////////////////////////////////////
/// Principales
///////////////////////////////////////////////////////////

async function saveChanges() {

  //Validar totales distribuidos
  const valida = validaTotales();
  if(!valida) return;
  
  //Actualizar montos al contrato existente en caso que exista 
  const newCessions = distribuyeContrato();
  if(newCessions.length == 0)
    return;

  let resultado = await cleanCessions();  
  if(!resultado.ok){
    mostrarNotificacion(`Error en la creación del reaseguro, contacte a sistemas : ${resultado.msg}` , "warning");
    return;
  }    

  resultado = addCessions(newCessions);
  if(resultado){
    mostrarNotificacion(`Distribución de reaseguro guardada satisfactoriamente` , "success");
    cessions = newCessions;
    cargarDataGrid();
    $(`#gridDistribucionBody tr[data-index="${gridSelectedIndex}"]`).trigger("click");
  }
          
  //Faltan aceptantes
  
}

function distribuyeContrato() {

  try {   
    
    const valores = {
      pret, msret, mpret, pcret, mcret,
      piret, miret, pcp,
      mscp, mpcp, pccp, mccp, picp, micp,
      pfp, msfp, mpfp,
      pcfp, mcfp, pifp, mifp,
      pfo, msfo, mpfo,
      pcfo, mcfo, pifo, mifo, mpnot
    };
  
    const resultado = {
      pret, msret, mpret, pcret, mcret,
      piret, miret, pcp,
      mscp, mpcp, pccp, mccp, picp, micp,
      pfp, msfp, mpfp,
      pcfp, mcfp, pifp, mifp,
      pfo, msfo, mpfo,
      pcfo, mcfo, pifo, mifo, mpnot
    };
    
    // Recorrer y asignar valor al elemento con id igual al nombre de la variable
    Object.entries(valores).forEach(([name, value]) => {
        const $elem = $(`#${name}`);
        if ($elem.length) {
          if (name.startsWith("p")) {
            resultado[name] = redondear($elem.val() , 8);
          } else {
            resultado[name] = redondear($elem.val());
          }
        }
    });
    
    const tieneRET = (resultado["pret"] + resultado["msret"] + resultado["mpret"]) > 0;
    const tieneCP = (resultado["pcp"] + resultado["mscp"] + resultado["mpcp"] + resultado["mccp"] + resultado["micp"]) > 0;
    const tieneFAC = (resultado["pfp"] + resultado["msfp"] + resultado["mpfp"] + resultado["mcfp"] + resultado["mifp"]) > 0;
    const tieneFRO = (resultado["pfo"] + resultado["msfo"] + resultado["mpfo"] + resultado["mcfo"] + resultado["mifo"]) > 0;
  
    let newCessions = JSON.parse(JSON.stringify(cessions));
  
    //Se borran las líneas donde no se haya distribuido el contrato
    if(!tieneRET && !tieneCP)
      newCessions = newCessions.filter(item => item.contractId == contractId && item.lineId.trim().toUpperCase() !== "CUOTA PARTE");
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
      newCessions = newCessions.filter(item => item.contractId == contractId && item.lineId.trim().toUpperCase() !== "FAC");
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
  
    if(!tieneFRO)
      newCessions = newCessions.filter(item => item.contractId == contractId && item.lineId.trim().toUpperCase() !== "FRO");

    ajustaTotales(newCessions, resultado);
  
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

  const tipoUpper = tipoContrato.toUpperCase();

  const tieneDistribucion = newCessions.filter(item =>
    item.contractId == contractId &&
    item.lineId.trim().toUpperCase() == tipoUpper
  ).length;

  if (tieneDistribucion == 0) {
    const newLines = construyeNuevaDistribucion(tipoContrato);
    newCessions.push(...newLines);
  }

  const items = newCessions.filter(item =>
    item.contractId == contractId &&
    item.lineId.trim().toUpperCase() == tipoUpper
  );

  items.forEach(ces => {

    const proporcionPrimaTotal = gridDataSelected.Prima == 0
      ? 0
      : redondear((ces.premium / gridDataSelected.Prima), 8);

    const porContrato = getPorContrato(resultado);

    ces.nonTechnicalPremium = redondear(
      resultado["mpnot"] * porContrato * proporcionPrimaTotal
    );

    const primaCob = redondear(ces.premium - ces.nonTechnicalPremium);

    ces.id = 0;

    // =========================
    // Cedant (solo si aplica)
    // =========================
    if (usaCedant) {
      ces.sumInsuredCedant = redondear(resultado[keys.porcentajeCed] * ces.sumInsured / 100);
      ces.premiumCedant = redondear(resultado[keys.porcentajeCed] * primaCob / 100);
      ces.proportionCed = redondear(resultado[keys.porcentajeCed] / 100, 8);
    } else {
      ces.sumInsuredCedant = 0;
      ces.premiumCedant = 0;
      ces.proportionCed = 0;
    }

    // =========================
    // Reaseguro
    // =========================
    ces.sumInsuredRe = redondear(resultado[keys.porcentajeRe] * ces.sumInsured / 100);
    ces.premiumRe = redondear(resultado[keys.porcentajeRe] * primaCob / 100);
    ces.proportionRe = redondear(resultado[keys.porcentajeRe] / 100, 8);

    ces.err = false;
    ces.msg = "";
    ces.np = false;

    // =========================
    // Comisión e impuesto
    // =========================
    ces.participantCommission = redondear(proporcionPrimaTotal * resultado[keys.montoComision]);
    ces.comissionCedant = ces.participantCommission;
    ces.tax = redondear(proporcionPrimaTotal * resultado[keys.montoImpuesto]);
    ces.coCommission = resultado[keys.porcentajeComision];
    
    ces.np = false;    

    // =========================
    // Ajustes por cobertura
    // =========================
    let diff = ces.premium - (ces.nonTechnicalPremium + ces.premiumCedant + ces.premiumRe);

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

    primerCobertura.sumInsuredCedant += redondear(resultado[keys.totalSumaCed] - totalSumaRET);
    primerCobertura.premiumCedant += redondear(resultado[keys.totalPrimaCed] - totalPrimaRET);
  }

  const totalSumaCED = dameTotal(newCessions, tipoUpper, "sumInsuredRe", validaSiEsCobertura);
  const totalPrimaCED = dameTotal(newCessions, tipoUpper, "premiumRe");
  const totalComision = dameTotal(newCessions, tipoUpper, "comissionCedant");
  const totalImpuesto = dameTotal(newCessions, tipoUpper, "tax");

  primerCobertura.sumInsuredRe += redondear(resultado[keys.totalSumaRe] - totalSumaCED);
  primerCobertura.premiumRe += redondear(resultado[keys.totalPrimaRe] - totalPrimaCED);
  primerCobertura.comissionCedant += redondear(resultado[keys.montoComision] - totalComision);
  primerCobertura.tax += redondear(resultado[keys.montoImpuesto] - totalImpuesto);

  // =========================
  // Participantes
  // =========================
  distribuyeAceptantes(items);
  
}

function construyeNuevaDistribucion(contrato) {

  if(cessions.length == 0)
    throw new Error("No hay distribución de reaseguro");

  const base = cessions[0].lineId;  
  const copia = cessions.filter(x => x.lineId.trim().toUpperCase() == base.trim().toUpperCase());

  if(copia.length == 0)
    throw new Error("No hay distribución de reaseguro");

  let resultado = JSON.parse(JSON.stringify(copia));

  resultado.forEach(x => {
    x.lineId = contrato;
    if(contrato?.trim()?.toUpperCase() == "FAC"){
      x.Participants = [];
      x.err = true;
      x.msg = "Debe distribuir los aceptantes";
    }      
  })
  
  return resultado;
  
}

async function cleanCessions() {

  const query = `DELETE p FROM CessionPart p WHERE cessionId in (SELECT c.id FROM Cession c WHERE c.lifePolicyId = ${policyId} AND c.overwritten = 0);
  DELETE c FROM Cession c WHERE c.lifePolicyId = ${policyId} AND c.overwritten = 0;`
  
  const resultado = await me.exe("DoQuery", {
    sql: query });  

  return resultado;
  
}

async function addCessions(newCessions){
  let isOk = true;

  const ordenadas = [...newCessions].sort((a, b) => {

    const getPrioridad = (lineId) => {
      const val = (lineId || "").trim().toUpperCase();

      if (val === "FAC" || val === "FRO") return 1; // últimos
      return 0; // primero
    };

    return getPrioridad(a.lineId) - getPrioridad(b.lineId);
  });
  
  for (const cession of ordenadas) {

    const resultado = await me.exe("RepoCession", {
      operation: "ADD",
      entity: cession
    });
  
    if (!resultado.ok) {
      mostrarNotificacion(
        `Error guardando distribución de reaseguro, contacte a sistemas: ${resultado.msg}`,
        "warning"
      );
      isOk = false;
      break; // corta completamente
    }
  } 
  return isOk;
}  

function ajustaTotales(newCessions, resultado) {
  const noTecnicatotal = resultado["mpnot"];

  const totalSuma = newCessions.reduce((acc, item) => {
    if (item.contractId == contractId) {
      return acc + (Number(item.nonTechnicalPremium) || 0);
    }
    return acc;
  }, 0);

  const primerCobertura = newCessions.find(item => item.contractId == contractId);
  
  primerCobertura.nonTechnicalPremium += redondear(noTecnicatotal - totalSuma);
  
}

function dameTotal(newCessions, contrato, field, validaCobertura = false) {
  const totalSuma = newCessions.reduce((acc, item) => {
    if (item.contractId == contractId && item.lineId?.trim().toUpperCase() === contrato) {
      if(validaCobertura)
        return acc + (montoSiEsCobertura(item.coverageCode, Number(item[field]) || 0));
      else
        return acc + (Number(item[field]) || 0);
    }
    return acc;
  }, 0);
  return redondear(totalSuma);
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

  if(redondear(resultado["tp"],8) != 100){
    mostrarNotificacion(`Existe diferencia en el total % distribuido, debe ser 100%.`, "warning");
    return false;
  }
    

  if(redondear(resultado["tms"]) != gridDataSelected.Suma){
    mostrarNotificacion(`Existe diferencia en el total de suma distribuido, debe ser ${formatearNumero(gridDataSelected.Suma)}.`, "warning");
    return false;
  }   

  if(redondear(resultado["tmp"]) != gridDataSelected.Prima){
    mostrarNotificacion(`Existe diferencia en el total de prima distribuido, debe ser ${formatearNumero(gridDataSelected.Prima)}.`, "warning");
    return false;
  }
    
  return true;
}

function montoSiEsCobertura(coverageCode, amount) {
  const coverageConfig = config.find(c => c.coverageCode == coverageCode);
  const suma = coverageConfig.isCoverage.trim().toUpperCase() == "SI";
  return suma ? amount : 0;
}

function onRowSelected(row) {

  let pret = 0, msret = 0, mpret = 0, pcret = 0, mcret = 0, 
  piret = 0, miret = 0, pcp = 0,
  mscp = 0, mpcp = 0, pccp = 0, mccp = 0, picp = 0, micp = 0, 
  pfp = 0, msfp = 0, mpfp = 0, 
  pcfp = 0, mcfp = 0, pifp = 0, mifp = 0, 
  pfo = 0, msfo = 0, mpfo = 0, 
  pcfo = 0, mcfo = 0, pifo = 0, mifo = 0, premium = 0, mpnot = 0;
  
  const distribuciones = ["CUOTA PARTE", "FAC"];
  distribuciones.forEach(dist => {

    try {

      const distReas = cessions.filter(b => b.lineId.toUpperCase() === dist);
      if(distReas.length <= 0){          
        return;
      }

      distReas.forEach(distribucion => {

        //Todo lo que tenga retención irá como retención;
        pret += montoSiEsCobertura(distribucion.coverageCode, distribucion.proportionCed);
        msret += montoSiEsCobertura(distribucion.coverageCode,distribucion.sumInsuredCedant);
        mpret += distribucion.premiumCedant;
        premium += distribucion.premium;
        mpnot += distribucion.nonTechnicalPremium;
  
        switch(dist){
          case "CUOTA PARTE":
            pcp += montoSiEsCobertura(distribucion.coverageCode,distribucion.proportionRe);
            mscp += montoSiEsCobertura(distribucion.coverageCode,distribucion.sumInsuredRe);
            mpcp += distribucion.premiumRe;
            mccp += distribucion.comissionCedant;
            micp += distribucion.tax;
            break;
          case "FAC":
            pfp += montoSiEsCobertura(distribucion.coverageCode,distribucion.proportionRe);
            msfp += montoSiEsCobertura(distribucion.coverageCode,distribucion.sumInsuredRe);
            mpfp += distribucion.premiumRe;
            mcfp += distribucion.comissionCedant;
            mifp += distribucion.tax;
            break;
        }
        
      });
            
    } catch (error) {
      console.error(error);
    }
    
  });

  //redondeamos para ser mas precisos:
  //ret
  pret = redondear(pret * 100,8);
  msret = redondear(msret,2);
  mpret = redondear(mpret,2);
  premium = redondear(premium,2);
  mpnot = redondear(mpnot,2);  

  //cp
  pcp = redondear(pcp * 100,8);
  mscp = redondear(mscp,2);
  mpcp = redondear(mpcp,2);
  mccp = redondear(mccp,2);
  micp = redondear(micp,2);

  //fac
  pfp = redondear(pfp * 100,8);
  msfp = redondear(msfp,2);
  mpfp = redondear(mpfp,2);
  mcfp = redondear(mcfp,2);
  mifp = redondear(mifp,2);
 
  pcfp = calcularPorcentaje(premium, mcfp);
  pccp = calcularPorcentaje(premium, mccp);

  pifp = calcularPorcentaje(premium, mifp);
  picp = calcularPorcentaje(premium, micp);

  // Creamos un arreglo con los nombres de todas las variables
  const valores = {
    pret, msret, mpret, pcret, mcret,
    piret, miret, pcp,
    mscp, mpcp, pccp, mccp, picp, micp,
    pfp, msfp, mpfp,
    pcfp, mcfp, pifp, mifp,
    pfo, msfo, mpfo,
    pcfo, mcfo, pifo, mifo, mpnot
  };
  
  // Recorrer y asignar valor al elemento con id igual al nombre de la variable
  Object.entries(valores).forEach(([name, value]) => {
      const $elem = $(`#${name}`);
      if ($elem.length) {
        $elem.val(formatearNumero(value));
      }
  });

  calculaTotales();

}

async function loadCessions(){
  const RepoCession = await me.exe("RepoCession", { operation: "GET", filter: `lifePolicyId = ${policyId} AND overwritten = 0` });  
  cessions = RepoCession.outData ?? [];
}

async function loadDataEntities(){

  await loadCessions();

  const RepoCoverages = await me.exe("LoadEntities", { entity: "LifeCoverage", fields: "code, limit, basePremium", filter: `lifePolicyId = ${policyId}` });
  coverages = RepoCoverages.outData ?? [];

  const tableConfig = await me.exe("GetFullTable", { table: "cfgCoberturaProductoRea" });
  config = mapearTablaConfig(tableConfig.outData ?? []);

  const RepoPolicy = await me.exe("LoadEntity", { entity: "LifePolicy", fields: "productCode, id", filter: `id = ${policyId}` });
  policy = RepoPolicy.outData;

  if(cessions.length <= 0)
    mostrarNotificacion(`No existe reaseguro en la póliza, por favor asegúrese de cotizar primero la póliza`, "warning");

  if(coverages.length <= 0)
    mostrarNotificacion(`No existen coberturas en la póliza, por favor asegúrese de cotizar primero la póliza`, "warning");

  if(!RepoPolicy)
    mostrarNotificacion(`No se pudo recuperar datos de la póliza, contacte a sistemas.`, "warning");

  gridData = mapCessionsToGrid(cessions);

}

function calculaTotales() {
  try {  
  
    // Creamos un arreglo con los nombres de todas las variables
    const totales = { tp, tms, tmp, tpc, tmc, tpi, tmi};
  
    totales.tp = redondear($("#pret").val(),8) + redondear($("#pcp").val(),8) + redondear($("#pfp").val(),8) + redondear($("#pfo").val(),8) + redondear($("#pnot").val(),8);
    totales.tms = redondear($("#msret").val()) + redondear($("#mscp").val()) + redondear($("#msfp").val()) + redondear($("#msfo").val()) + redondear($("#msnot").val());
    totales.tmp = redondear($("#mpret").val()) + redondear($("#mpcp").val()) + redondear($("#mpfp").val()) + redondear($("#mpfo").val()) + redondear($("#mpnot").val());
    totales.tpc = redondear($("#pcret").val(),8) + redondear($("#pccp").val(),8) + redondear($("#pcfp").val(),8) + redondear($("#pcfo").val(),8) + redondear($("#pcnot").val(),8);
    totales.tmc = redondear($("#mcret").val()) + redondear($("#mccp").val()) + redondear($("#mcfp").val()) + redondear($("#mcfo").val()) + redondear($("#mcnot").val());
    totales.tpi = redondear($("#piret").val(),8) + redondear($("#picp").val(),8) + redondear($("#pifp").val(),8) + redondear($("#pifo").val(),8) + redondear($("#pinot").val(),8);
    totales.tmi = redondear($("#miret").val()) + redondear($("#micp").val()) + redondear($("#mifp").val()) + redondear($("#mifo").val()) + redondear($("#minot").val());
  
    totales.tp = redondear(totales.tp, 8);
    totales.tms = redondear(totales.tms);
    totales.tmp = redondear(totales.tmp);
    totales.tpc = redondear(totales.tpc, 8); 
    totales.tmc = redondear(totales.tmc);
    totales.tpi = redondear(totales.tpi, 8); 
    totales.tmi = redondear(totales.tmi);
      
    // Recorrer y asignar valor al elemento con id igual al nombre de la variable
    Object.entries(totales).forEach(([name, value]) => {
        const $elem = $(`#${name}`);
        if ($elem.length) {
          $elem.val(formatearNumero(value));
        }
    });
    
  } catch (error) {
    console.error("Error calculando totales");
  }
}

///////////////////////////////////////////////////////////
/// Distribución de aceptantes
///////////////////////////////////////////////////////////

function distribuyeAceptantes(newCessions) {

  // =========================
  // Participantes
  // =========================

  newCessions.forEach(ces => {
  
    ces.Participants.forEach(p => {
      p.id = 0;
      p.cessionId = 0;
      p.sumInsured = redondear(p.split / 100 * ces.sumInsuredRe);
      p.premium = redondear(p.split / 100 * ces.premiumRe);
      p.commission = redondear(p.split / 100 * ces.comissionCedant);
      p.tax = redondear(p.split / 100 * ces.tax);
    });
    
    if(ces.lineId.trim().toUpperCase() == "FAC" && ces.Participants.length == 0){
      ces.err = true;
      ces.msg = "Debe registrar los aceptantes de la distribución FAC";
    }
    else{
      const resumenParticipantes = resumirParticipants(ces.Participants);
      if(resumenParticipantes.split != 100){
        ces.err = true;
        ces.msg = "Porcentaje de distribución debe ser 100%";
      }
      
      if(resumenParticipantes.sumInsured != ces.sumInsuredRe){
        ces.err = true;
        ces.msg = "Total suma distribuido incorrecto";
      }
  
      if(resumenParticipantes.premium != ces.premiumRe){
        ces.err = true;
        ces.msg = "Total prima distribuido incorrecto";
      }
      
      if(resumenParticipantes.commission != ces.comissionCedant){
        ces.err = true;
        ces.msg = "Total comisión distribuido incorrecto";
      }
  
      if(resumenParticipantes.tax != ces.tax){
        ces.err = true;
        ces.msg = "Total impuesto distribuido incorrecto";
      }
    }
  });
  
}

function resumirParticipants(participants) {
  return participants.reduce((acc, p) => {
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

// ===== Datos de prueba =====
const aceptantes = [
    { id: 1, nombre: "Reaseguradora A" },
    { id: 2, nombre: "Reaseguradora B" },
    { id: 3, nombre: "Reaseguradora C" },
    { id: 4, nombre: "Reaseguradora D" }
  ];

  let reaseguradoresData = [
    { participanteId: 1, lineaId:101, porcentaje:30, suma:10000, prima:500, comision:50, impuesto:25 },
    { participanteId: 2, lineaId:102, porcentaje:70, suma:20000, prima:1000, comision:100, impuesto:50 }
  ];

function renderReaseguradores() {
  const $container = $("#tabReaseguradores");
  $container.empty();

  const html = `
    <div id="gridDistribucionContainer">
      <h4>Distribución de Reaseguradores</h4>
      <button id="btnAgregarReasegurador" class="ant-btn ant-btn-primary" style="margin-bottom:10px;">
        Agregar Aceptante
      </button>
      <table id="gridReaseguradores" class="ant-table">
        <thead>
          <tr>
            <th>Participante</th>
            <th>ID de línea</th>
            <th>Porcentaje de participación</th>
            <th>Suma Asegurada</th>
            <th>Prima</th>
            <th>% Comisión</th>
            <th>Impuesto</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  `;
  $container.append(html);
  
  function formatInput(value, type) {
    let dec = type === "number" ? 2 : 8;
    value = parseFloat(value) || 0;
    return value.toFixed(dec);
  }

  function renderGrid() {
    const $tbody = $("#gridReaseguradores tbody");
    $tbody.empty();

    reaseguradoresData.forEach((r, index) => {
      const participanteOptions = aceptantes.map(a => {
        const selected = a.id === r.participanteId ? "selected" : "";
        return `<option value="${a.id}" ${selected}>${a.nombre}</option>`;
      }).join("");

      const row = $(`
        <tr data-index="${index}">
          <td class="td-participante">
            <select>${participanteOptions}</select>
          </td>
          <td class="td-lineaId">${r.lineaId}</td>
          <td><input type="text" value="${formatInput(r.porcentaje,'percent')}" class="percent" /></td>
          <td><input type="text" value="${formatInput(r.suma,'number')}" class="number" /></td>
          <td><input type="text" value="${formatInput(r.prima,'number')}" class="number" /></td>
          <td><input type="text" value="${formatInput(r.comision,'percent')}" class="percent" /></td>
          <td><input type="text" value="${formatInput(r.impuesto,'percent')}" class="percent" /></td>
          <td>
            <button class="btn-eliminar" data-index="${index}">Eliminar</button>
          </td>
        </tr>
      `);

      $tbody.append(row);
    });
  }

  renderGrid();

  // ===== Agregar fila =====
  $("#btnAgregarReasegurador").off("click").on("click", function() {
    reaseguradoresData.push({
      participanteId: aceptantes[0].id,
      lineaId:0,
      porcentaje:0,
      suma:0,
      prima:0,
      comision:0,
      impuesto:0
    });
    renderGrid();
  });

  // ===== Cambios en select =====
  $("#gridReaseguradores").off("change").on("change", "select", function() {
    const $tr = $(this).closest("tr");
    const index = $tr.data("index");
    reaseguradoresData[index].participanteId = parseInt(this.value);
  });

  // ===== Cambios en inputs =====
  $("#gridReaseguradores").off("input").on("input", "input", function() {
    const input = this;
    const $tr = $(input).closest("tr");
    const index = $tr.data("index");
    const colIndex = $tr.find("input").index(input);
    const keys = ["porcentaje","suma","prima","comision","impuesto"];
    const key = keys[colIndex];
    let val = input.value.replace(/,/g,"");

    if(["suma","prima"].includes(key)) {
      val = parseFloat(val) || 0;
      input.value = val.toFixed(2);
    } else if(["porcentaje","comision","impuesto"].includes(key)) {
      val = parseFloat(val) || 0;
      input.value = val.toFixed(8);
    }

    reaseguradoresData[index][key] = parseFloat(val);
  });

  // ===== Eliminar fila =====
  $("#gridReaseguradores").off("click").on("click", ".btnEliminar", function() {
    const $tr = $(this).closest("tr");
    const index = $tr.data("index");
    reaseguradoresData.splice(index, 1);
    renderGrid();
  });
}

function abrirAceptantes(idControl) {
  // Oculta todas las pestañas
  $("#tabsDistribucion .tab-content").hide();

  // Muestra solo la pestaña de Reaseguradores
  $("#tabReaseguradores").show();

  // Actualiza botón activo
  $("#tabsDistribucion .tab-btn").removeClass("active");
  $('#tabsDistribucion .tab-btn[data-tab="tabReaseguradores"]').addClass("active");

}

function addParticipantsEvent() {
  $(document).on("click", ".btn-aceptante", function(e) {
    e.preventDefault();

    const idControl = $(this).data("id");

    console.log("Botón aceptante clickeado:", idControl);

    abrirAceptantes(idControl);
  });
}

///////////////////////////////////////////////////////////
/// Desglose de campos de distribución
///////////////////////////////////////////////////////////

const filasControles = [
  [
    { tipo: "label", nombre: "Contrato", id: "lblcontrato" },
    { tipo: "label", nombre: "Porcentaje (%)", id: "lblPorcentaje" },
    { tipo: "label", nombre: "Suma", id: "lblSuma" },
    { tipo: "label", nombre: "Prima", id: "lblPrima" },
    { tipo: "label", nombre: "% Comisión", id: "lblPorcentajeComision" },
    { tipo: "label", nombre: "Comisión", id: "lblComision" },
    { tipo: "label", nombre: "% Impuesto", id: "lblPorcentajeImpuesto" },
    { tipo: "label", nombre: "Impuesto", id: "lblImpuesto" }
  ],
  [
    { tipo: "label", nombre: "No Técnica", id: "lblNoTecnica" },
    { tipo: "percent8", nombre: "", id: "pnot", valor: 0, readonly: true },
    { tipo: "number2", nombre: "", id: "msnot", valor: 0, readonly: true },
    { tipo: "number2", nombre: "", id: "mpnot", valor: 0 },
    { tipo: "percent8", nombre: "", id: "pcnot", valor: 0, readonly: true },
    { tipo: "number2", nombre: "", id: "mcnot", valor: 0, readonly: true },    
    { tipo: "percent8", nombre: "", id: "pinot", valor: 0, readonly: true },
    { tipo: "number2", nombre: "", id: "minot", valor: 0, readonly: true }
  ],
  [
    { tipo: "label", nombre: "Retención", id: "lblRetencion" },
    { tipo: "percent8", nombre: "", id: "pret", valor: 0 },
    { tipo: "number2", nombre: "", id: "msret", valor: 0 },
    { tipo: "number2", nombre: "", id: "mpret", valor: 0 },
    { tipo: "percent8", nombre: "", id: "pcret", valor: 0, readonly: true },
    { tipo: "number2", nombre: "", id: "mcret", valor: 0, readonly: true },    
    { tipo: "percent8", nombre: "", id: "piret", valor: 0, readonly: true },
    { tipo: "number2", nombre: "", id: "miret", valor: 0, readonly: true }
  ],
  [
    { tipo: "label", nombre: "Cuota Parte", id: "lblCuotaParte", tieneAceptante: true },
    { tipo: "percent8", nombre: "", id: "pcp", valor: 0 },
    { tipo: "number2", nombre: "", id: "mscp", valor: 0 },
    { tipo: "number2", nombre: "", id: "mpcp", valor: 0 },
    { tipo: "percent8", nombre: "", id: "pccp", valor: 0 },
    { tipo: "number2", nombre: "", id: "mccp", valor: 0 },
    { tipo: "percent8", nombre: "", id: "picp", valor: 0 },
    { tipo: "number2", nombre: "", id: "micp", valor: 0 }
  ],
  [
    { tipo: "label", nombre: "Facultativo", id: "lblFacultativo", tieneAceptante: true },
    { tipo: "percent8", nombre: "", id: "pfp", valor: 0 },
    { tipo: "number2", nombre: "", id: "msfp", valor: 0 },
    { tipo: "number2", nombre: "", id: "mpfp", valor: 0 },
    { tipo: "percent8", nombre: "", id: "pcfp", valor: 0 },
    { tipo: "number2", nombre: "", id: "mcfp", valor: 0 },
    { tipo: "percent8", nombre: "", id: "pifp", valor: 0 },
    { tipo: "number2", nombre: "", id: "mifp", valor: 0 }
  ],
  [
    { tipo: "label", nombre: "Fronting", id: "lblFronting", tieneAceptante: true },
    { tipo: "percent8", nombre: "", id: "pfo", valor: 0 },
    { tipo: "number2", nombre: "", id: "msfo", valor: 0 },
    { tipo: "number2", nombre: "", id: "mpfo", valor: 0 },
    { tipo: "percent8", nombre: "", id: "pcfo", valor: 0 },
    { tipo: "number2", nombre: "", id: "mcfo", valor: 0 },
    { tipo: "percent8", nombre: "", id: "pifo", valor: 0 },
    { tipo: "number2", nombre: "", id: "mifo", valor: 0 }
  ],
  [
    { tipo: "label", nombre: "Totales", id: "lblTotal" },
    { tipo: "percent8", nombre: "", id: "tp", valor: 0, readonly: true, clase: "input-verde-negrita" },
    { tipo: "number2", nombre: "", id: "tms", valor: 0, readonly: true, clase: "input-verde-negrita" },
    { tipo: "number2", nombre: "", id: "tmp", valor: 0, readonly: true, clase: "input-verde-negrita" },
    { tipo: "percent8", nombre: "", id: "tpc", valor: 0, readonly: true, clase: "input-verde-negrita" },
    { tipo: "number2", nombre: "", id: "tmc", valor: 0, readonly: true, clase: "input-verde-negrita" },
    { tipo: "percent8", nombre: "", id: "tpi", valor: 0, readonly: true, clase: "input-verde-negrita" },
    { tipo: "number2", nombre: "", id: "tmi", valor: 0, readonly: true, clase: "input-verde-negrita" }
  ]
];

const relaciones = [
  { porcentajeId: "pret", montoId: "mpret", sumaId: "msret" }, 
  { porcentajeId: "pcp", montoId: "mpcp", sumaId: "mscp" },  
  { porcentajeId: "pfp", montoId: "mpfp", sumaId: "msfp" },
  { porcentajeId: "pfo", montoId: "mpfo", sumaId: "msfo" },  
  { porcentajeId: "pccp", montoId: "mccp", sumaId: "" },
  { porcentajeId: "picp", montoId: "micp", sumaId: "" },
  { porcentajeId: "pcfp", montoId: "mcfp", sumaId: "" },
  { porcentajeId: "pifp", montoId: "mifp", sumaId: "" },
  { porcentajeId: "pcfo", montoId: "mcfo", sumaId: "" },
  { porcentajeId: "pifo", montoId: "mifo", sumaId: "" }
];

// Creamos un mapa para acceso rápido por id
const relacionesMap = {};
relaciones.forEach(r => {
    relacionesMap[r.porcentajeId] = { montoId: r.montoId, sumaId: r.sumaId };
});

function renderControlesDistribucion(containerId = "#tabControles") {

  //const $container = $("#gridDistribucionContainer");
  const $container = $(containerId);

  if (!filasControles || !filasControles.length) return;

  $("#controlesDistribucion").remove();

  const $wrapper = $('<div id="controlesDistribucion" style="margin-top:10px;"></div>');

  filasControles.forEach(fila => {

    const $row = $(`
      <div style="
        display:flex;
        gap:12px;
        width:100%;
        margin-bottom:8px;
        flex-wrap:wrap;
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
              <button class="btn-aceptante" data-id="${c.id}" type="button" title="Ver aceptantes">
                <svg viewBox="64 64 896 896" width="16" height="16" fill="currentColor">
                  <path d="M880 298H472l-76-92a32 32 0 0 0-25-12H144c-17.7 0-32 14.3-32 32v568c0 
                  17.7 14.3 32 32 32h736c17.7 0 32-14.3 
                  32-32V330c0-17.7-14.3-32-32-32z"/>
                </svg>
              </button>
            ` : ""}
          </div>
        `;
        
      }

      // ===== NUMBER 2 DECIMALES =====
      if (c.tipo === "number2") {

        const val = formatearNumero(redondear(valor, 2));

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

      // ===== PORCENTAJE 8 DECIMALES =====
      if (c.tipo === "percent8") {

        const val = redondear(valor, 8);

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

  $("#controlesDistribucion input.number, #controlesDistribucion input.percent").on("input", function(e) {
    const input = this;
    let val = input.value;
    const isNumber = $(input).hasClass("number");
    const maxDecimals = isNumber ? 2 : 8;

    // Guardar la posición actual del cursor
    let cursorPos = input.selectionStart;

    // Contar comas antes de formatear
    const commasBefore = (val.slice(0, cursorPos).match(/,/g) || []).length;

    // Eliminar todo lo que no sea dígito o punto
    val = val.replace(/[^0-9.]/g, "");

    // Separar parte entera y decimal
    let [integerPart, decimalPart] = val.split(".");

    // Limitar decimales según tipo
    if (decimalPart) decimalPart = decimalPart.slice(0, maxDecimals);

    // Formatear miles solo en la parte entera
    if (integerPart) {
        integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Reconstruir el valor
    val = decimalPart !== undefined ? integerPart + "." + decimalPart : integerPart;

    // Asignar valor al input
    input.value = val;

    // Restaurar posición del cursor
    let commasAfter = (val.slice(0, cursorPos).match(/,/g) || []).length;
    cursorPos = cursorPos + (commasAfter - commasBefore);
    input.setSelectionRange(cursorPos, cursorPos);

    // Disparar cálculo automático si el input es un % registrado
    const id = input.id;
    if (relacionesMap[id]) {
      const { montoId, sumaId } = relacionesMap[id];
      const montoBase = (gridDataSelected?.Prima ?? 0) - (gridDataSelected?.PrimaNoTecnica ?? 0);
      const sumaBase = gridDataSelected?.Suma ?? 0;
      calcularRelacion(id, montoId, sumaId, montoBase, sumaBase);
    }
    calculaTotales();
    
  });

  function calcularRelacion(porcentajeId, montoId, sumaId, montoBase, sumaBase) {
    const $porc = $(`#${porcentajeId}`);
    const $monto = $(`#${montoId}`);
    const $suma = $(`#${sumaId}`);

    let porc = parseFloat($porc.val().replace(/,/g, "")) || 0;
    let monto = (montoBase * porc) / 100;
    let suma = (sumaBase * porc) / 100;

    // Formatear monto con 2 decimales y miles
    monto = redondear(monto);
    suma = redondear(suma);

    $monto.val(formatearNumero(monto));
    if($suma.length > 0)
      $suma.val(formatearNumero(suma));
  }
}

///////////////////////////////////////////////////////////
/// Información general 
///////////////////////////////////////////////////////////

function agruparCessionsPorLinea(cessions) {

  const grouped = new Map();

  cessions.forEach(item => {

    const lineId = limpiarTexto(item.premiumType);

    const key = `${lineId}-${item.changeId ?? 0}-${item.contractId}`;

    // si no existe el grupo, se crea
    if (!grouped.has(key)) {
      grouped.set(key, {
        lineId,
        changeId: item.changeId ?? 0,
        contractId: item.contractId,
        premiumType: item.premiumType,
        sumInsured: 0,
        sumInsuredCedant: 0,
        sumInsuredRe: 0,
        premium: 0,
        premiumCedant: 0,
        premiumRe: 0,
        proportionCed: 0,
        comissionCedant: 0,
        nonTechnicalPremium: 0,
        tax: 0,
        count: 0,

        // set para controlar qué coberturas ya fueron sumadas
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

    // estos campos sí se suman siempre (por cada línea)
    g.sumInsuredCedant += Number(montoSiEsCobertura(item.coverageCode, item.sumInsuredCedant || 0));
    g.sumInsuredRe += Number(montoSiEsCobertura(item.coverageCode, item.sumInsuredRe || 0));    
    g.premiumCedant += Number(item.premiumCedant || 0);
    g.premiumRe += Number(item.premiumRe || 0);
    g.proportionCed += Number(item.proportionCed || 0);
    g.comissionCedant += Number(item.comissionCedant || 0);
    g.nonTechnicalPremium += Number(item.nonTechnicalPremium || 0);
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

    return {
      IdPoliza: policyId,
      Contrato: g.contractId,
      Endoso: g.changeId,
      Tipo: g.premiumType,
      Suma: g.sumInsured,
      Prima: g.premium,
      PrimaRet: g.premiumCedant,
      SumaRet: redondear(g.sumInsuredCedant),
      PrimaCed: g.premiumRe,
      SumaCed: redondear(g.sumInsuredRe),
      Comision: g.comissionCedant,
      Impuesto: g.tax,
      PrimaNoTecnica: redondear(g.nonTechnicalPremium)
    };
  });

  return result;
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
      
      <div class="ant-card-head">
        <div class="ant-card-head-title">Distribución Reaseguro</div>        
      </div>
      <button id="btnSeleccionar" class="ant-btn ant-btn-primary">
        Guardar
      </button>
      <button id="btnRecalcular" class="ant-btn ant-btn-primary">
        Aplicar Contrato
      </button>
            
      <div class="ant-card-body">

        <table class="ant-table">
          <thead>
        
            <!-- Fila de grupos -->
            <tr>
              <th rowspan="2"></th>
              <th rowspan="2">IdPoliza</th>
              <th colspan="3">Movimiento</th>        
              <th colspan="2">Totales</th>
              <th colspan="2">Retención</th>
              <th colspan="2">Cedido</th>
              <th colspan="2">Otros</th>
            </tr>
        
            <!-- Fila de columnas -->
            <tr>
              <th>Id Contrato</th>
              <th>Endoso Id</th>
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
  `;

  $hidden.after(html);
  renderTabsDistribucion();

  cargarDataGrid();
}

function renderTabsDistribucion() {

  const $container = $("#gridDistribucionContainer");

  const html = `
  <div id="tabsDistribucion">

    <div class="tabs-header">
      <button class="tab-btn active" data-tab="tabControles">Distribución</button>
      <button class="tab-btn" data-tab="tabReaseguradores">Reaseguradores</button>
    </div>

    <div id="tabControles" class="tab-content"></div>
    <div id="tabReaseguradores" class="tab-content" style="display:none;"></div>

  </div>
  `;
  
  $container.append(html);

  // eventos tabs
  $(".tab-btn").off("click")
    .on("click", function () {
    const tab = $(this).data("tab");

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

    const tr = `
      <tr class="ant-row" data-index="${index}">
        <td><input type="radio" name="gridSelect"></td>
        <td>${row.IdPoliza}</td>
        <td>${row.Contrato}</td>
        <td>${row.Endoso}</td>
        <td>${row.Tipo}</td>
        <td class="num">${formatearNumero(row.Suma)}</td>
        <td class="num">${formatearNumero(row.Prima)}</td>
        <td class="num">${formatearNumero(row.PrimaRet)}</td>
        <td class="num">${formatearNumero(row.SumaRet)}</td>
        <td class="num">${formatearNumero(row.PrimaCed)}</td>
        <td class="num">${formatearNumero(row.SumaCed)}</td>
        <td class="num">${formatearNumero(row.Comision)}</td>
        <td class="num">${formatearNumero(row.Impuesto)}</td>
      </tr>
    `;

    $tbody.append(tr);
  });

  eventosGrid();
}

function eventosGrid() {

  // Selección de fila
  $(document).off("click", "#gridDistribucionBody tr")
    .on("click", "#gridDistribucionBody tr", function () {

    $("#gridDistribucionBody tr").removeClass("selected");
  
    $(this).addClass("selected");
  
    $(this).find("input[type='radio']").prop("checked", true);

    // obtener índice
    gridSelectedIndex = $(this).data("index");

    // obtener objeto
    const rowData = gridData[gridSelectedIndex];
    gridDataSelected = rowData;
    contractId = rowData.Contrato;

    // aquí puedes disparar tu lógica real
    onRowSelected(rowData);
    
  });

  $(document).off("click", "#btnSeleccionar")
    .on("click", "#btnSeleccionar", async () => {
    calculaTotales();
    await saveChanges();
  });

  $(document).off("click", "#btnRecalcular")
    .on("click", "#btnRecalcular", async () => {
      const resultado = await me.exe("ReComputeRe", { policyId: policyId });
      if(!resultado.ok)
        mostrarNotificacion(`Error aplicando contrato del reaseguro, contacte a sistemas : ${resultado.msg}` , "warning");
      else{
        mostrarNotificacion(`Contrato aplicado satisfactoriamente` , "success"); 
        await loadCessions();
        cargarDataGrid();
        $(`#gridDistribucionBody tr[data-index="${gridSelectedIndex}"]`).trigger("click");
      }        
  }); 
      
}

function calcularPorcentaje(prima, monto) {
    if (prima === 0) return 0; // evita división entre cero
    return (monto / prima) * 100;
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

function formatearNumero(valor) {

  if (valor === null || valor === undefined || isNaN(valor)) return "0.00";

  const numero = Number(valor);
  const partes = numero.toString().split(".");

  // Formatear miles
  partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // No tiene decimales
  if (partes.length === 1) {
    return partes[0] + ".00";
  }

  // Tiene 1 decimal → agregar 0
  if (partes[1].length === 1) {
    return partes[0] + "." + partes[1] + "0";
  }

  // Tiene 2 o más decimales → respetar
  return partes[0] + "." + partes[1];
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
      overflow-x: auto; /* permite scroll horizontal si no cabe */
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
    
    /* fila de agrupación */
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
    
    /* ===== BORDES ENTRE COLUMNAS ===== */
    #gridDistribucionContainer th,
    #gridDistribucionContainer td {
      border-right: 1px solid #f0f0f0;
    }
    
    #gridDistribucionContainer th:last-child,
    #gridDistribucionContainer td:last-child {
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
    
    /* ===== NUMÉRICOS ===== */
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
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(2px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /*Boton de edición de aceptantes*/

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
    #gridDistribucionContainer select {
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
    #gridDistribucionContainer select:hover {
      border-color: #4096ff;
    }
    
    /* Focus */
    #gridDistribucionContainer select:focus {
      border-color: #1677ff;
      box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2);
    }
    
    /* Opcional: estilo de opción */
    #gridDistribucionContainer select option {
      padding: 4px 8px;
      font-size: 13px;
    }

    /* ===== BOTÓN ELIMINAR ESTILO ANT-DESIGN ===== */
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
      background-color: #ff7875; /* rojo más claro al hover */
    }
    
    .btn-eliminar:active {
      background-color: #d9363e; /* rojo más intenso al click */
    }
    
    .btn-eliminar:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2);
    }

  `)
  .appendTo("head");

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
      renderReaseguradores();
      addParticipantsEvent();

      console.log("Grid creado correctamente");
      return;
    }

    await esperar(delay);
  }

  console.warn("No se encontró #hiddenDistribucionReaseguro");
}