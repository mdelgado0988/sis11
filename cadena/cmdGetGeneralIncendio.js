//block
//noreplace

/**
 * @name cmdGetGeneralIncendio
 * @version 1
 * @Autor : Ernesto Garcia
 * @description: Tarifica todos los planes de incendio 
 *///block
//noreplace

/*emision: QUOTE,
renovacion: ANNIVERSARY
action: 'ChangeCapital'
{ poliza: { id: 218 }, action: 'ChangePolicyCapital', esEndoso: null }

//ejemplo con cobs
{ poliza: { id: 393, coverages: [
  { "code": 1,   "name": "Incendio/Rayo/Explosión Básico" },
  { "code": 3,   "name": "Terremoto, Temblor y/o Erupción Volcánica" },
  { "code": 250, "name": "Rotura de Cristales" },
  { "code": 251, "name": "Gasto de Hoteleria" },
  { "code": 252, "name": "Incendio/Explosión" },
  { "code": 253, "name": "Terremoto/Daños por Agua/Vendaval" },
  { "code": 254, "name": "Robo con Forzamiento" },
  { "code": 255, "name": "Daño por humo" }
]
 }, action: 'ChangePolicyCapital', esEndoso: null }
*/

let errorPuntero = '';
try {
    
    let { poliza, action, extra, esEndoso } = context;

    /*const textContext = JSON.stringify({ poliza: poliza, action: action, extra: extra, esEndoso: esEndoso });
    doCmd({ 
      cmd: "GetPing",
      data: {
        contexto: poliza,
        action: action,
        extra: extra,
        esEndoso: esEndoso,
        contexto: textContext
      }
    });*/

     /*doCmd({
       cmd:'GetPing',
       data: {pol:poliza, action:action, ex: extra, esEndoso: esEndoso}
     })*/
    
    var endoso = esEndoso ?? false;

    if (action.includes('Change')) {
        endoso = true;
    }

    let policyGet = {};
    if (!endoso) policyGet = GetPolicyEndoso(poliza);
    if (endoso) policyGet = GetPolicyEndoso(poliza);

    let accionActual = (typeof action !== 'undefined') ? action : 'QUOTE';
    if (accionActual == 'PREQUOTE' || accionActual.includes('Change')) {
        accionActual = 'QUOTE'
    }

    log("Comando Calculation")
    let cramo = null;
    let cplan = 'null';
    cramo = policyGet.ramo;
    cplan = policyGet.plan;
    let Coverages = policyGet.coverages;
    const oa = policyGet.userData;
    let oaCambioObjeto = [];

    //Michael Delgado. 2026.04.08. GLOB-180. Esto permite que el endoso de cambio de objeto asegurado lea su información correctamente en caso de calcular tarifas.
    if(action == "ChangeInsuredObject"){
      oaCambioObjeto = getChangeInsuredObjectChangeUserData(extra);
      policyGet.userData = oaCambioObjeto;
    }

    // VARIABLES GLOBALES CONFIGURACION DE INCENDIO POR OBJETO ASEGURADO
    // DEL OBJETO ASEGURADO

    let userData = policyGet.userData;
    let usoBienCode = userData.cmbUsoBien;
    let sumInsured = Number(userData.txtSA || 0);
    let SA = Number(userData.txtSA || 0);
    let sa6 = Number(userData.txtSA || 0);
    let sumaasegurada256 = 0;
    let SA_INC = Number(userData.txtSA || 0);
    let Uso_inc = Number(userData.cmbUsoBien) || 0;
    let limitInput = 0;
    let basePremiumInput = 0;
    let dedutibleInput = 0;

    // FIN VARIABLES GLOBALES CONFIGURACION DE INCENDIO POR OBJETO ASEGURADO
    if (usoBienCode == '0' || usoBienCode == '') {
        throw `Debe Asignar el Tipo de Uso del Objeto Asegurado`;
    }

    let premiumReturn = 0;
    let deductibleReturn = 0;
    let limitReturn = 0;
    let descriptionReturn = '';

    let sentenciaprima = "";
    let sentenciadeducible = "";
    let sentencialimit = "";
    let sentenciacondicion = "";
    let sentenciadescription = "";


    let sacov = "0";
    let cgrupo = "-1";
    let cgrupo1 = "-1";
    let cgrupo2 = "-1";
    let stringAConvertir;


    const planes256 = ['1_17'];

    if (planes256.includes(cplan)) {
        sumaasegurada256 = sumInsured;
    }

    //Aquí validamos el cambio para cambio de suma o capital.
    var prorate = 1;
    let detail = {};
    if (endoso && extra?.data?.newCapital > 0) {
        const sumInsured = extra.data.newCapital;

        sumaasegurada256 =
            SA_INC =
            SA =
            sa6 =
            sumInsured;

        //Calculo la prorrata para cambio de capital.
        if (extra.data.jDetail) {
            detail = JSON.parse(extra.data.jDetail);
            if (detail?.prorate > 0)
                prorate = detail.prorate;
        }

    }

    let varG = "";

    const TarifasCatalog = getTarifasCatalog();
    log("Before coverage calculation: " + (Coverages == null ? "Sin cobs" : "Con Cobs"));
  
    /*doCmd({ 
      cmd: "GetPing",
      data: {
        linea: "Antes",
        ramo: cramo,
        plan: cplan,
        tarifas: TarifasCatalog,
        cobs: Coverages
      }
    });*/
    
    const result = Coverages.map(covItem => {
        premiumReturn = 0;
        deductibleReturn = 0;
        limitReturn = 0;
        let limitCob = 0;
        if (!userData) return { code: covItem.code, limit: 0, premium: 0 };

        log(`Iniciando cálculo de cobertura: ${covItem.code}`);
        errorPuntero = `cob-${covItem.code}-state-ini`;
      
        //varG = " sa=" + sa + ";";
        varG = " cgrupo=" + cgrupo + ";";
        varG = varG + " cgrupo1=" + cgrupo1 + ";";
        varG = varG + " cgrupo2=" + cgrupo2 + ";";
        varG = varG + " Uso_inc=" + Uso_inc + ";";
        varG = varG + " sumInsured=" + sumInsured + ";";
        varG = varG + " SA=" + SA + ";";
        varG = varG + " sa6=" + sa6 + ";";
        varG = varG + " SA_INC=" + SA_INC + ";";
        varG = varG + " sumaasegurada256=" + sumaasegurada256 + ";";
        varG = varG + " CalMPAnt=0;";
        varG = varG + " limitCob=" + limitCob + ";";

        errorPuntero = `cob-${covItem.code}-state-dedu`;
      
        // VARIABLES GLOBALES CONFIGURACION DE INCENDIO POR COBERTURA
        // EN FOR DE COBERTURAS
        cgrupo = -1;
        let Qanos6 = 1; // NO DEFINIDO 
        let CCOBER = covItem.code;
        basePremiumInput = covItem.basePremium || 0;
        dedutibleInput = covItem.deductible ?? covItem.dedutible ?? 0;
        limitInput = covItem.limit || 0;

        errorPuntero = `cob-${covItem.code}-state-prem`;

        varG = varG + " basePremiumInput=" + basePremiumInput + ";";
        varG = varG + " dedutibleInput=" + dedutibleInput + ";";
        varG = varG + " limitInput=" + limitInput + ";";

        errorPuntero = `cob-${covItem.code}-state-tasa`;

        varG = varG + " CCOBER=" + CCOBER + ";";

        let varPPrima = varG + "(CCOBER == 256) ? 0.12 : (CCOBER == 257) ? 0.08 : (CCOBER == 258) ? 0.22 : (CCOBER == 259) ? 0.25 : (['260', '261'].includes(CCOBER)) ? 0.50 : 0;";
        //return varPPrima
        let pprima = eval(varPPrima);

        varG = varG + " pprima=" + pprima + ";";
        varG = varG + " msumaaseg=" + limitInput + ";";

        errorPuntero = `cob-${covItem.code}-state-tarifa`;

        // FIN VARIABLES GLOBALES CONFIGURACION DE INCENDIO POR COBERTURA
        let rowtarifas = TarifasCatalog.filter(x => String(x.cramo).trim() === String(cramo).trim() && String(x.codigoplan).trim() === String(cplan).trim() && parseInt(x.ccobertura, 10) === parseInt(covItem.code, 10) && String(x.cendoso).trim().toUpperCase() === accionActual.toUpperCase());
        log(`Variables: ${varG}`);  
        log(`Tarifas: ${JSON.stringify(rowtarifas)}`);
        
        if (rowtarifas && rowtarifas.length > 0) {
            if (rowtarifas.length > 1) {
                rowtarifas = rowtarifas.find(item => {
                    try {
                      log(`Evaluando condición múltiples tarifas: ${item.condicion}`)
                      const resultadoEval = eval(item.condicion);
                      log(`Resultado: ${resultadoEval}`)
                      return resultadoEval;
                    } catch (e) {
                        return false;
                    }
                });
            } else {
                rowtarifas = rowtarifas.pop();
            }
        }

        log(`Tarifas V1: ${JSON.stringify(rowtarifas)}`);

        if (!rowtarifas && accionActual != 'QUOTE') {
            //throw `Entro  no deberia'${CCOBER}'`;        
            rowtarifas = TarifasCatalog.find(x => String(x.cramo).trim() === String(cramo).trim() && String(x.codigoplan).trim() === String(cplan).trim() && parseInt(x.ccobertura, 10) === parseInt(covItem.code, 10) && String(x.cendoso).trim().toUpperCase() === 'QUOTE');
        }

        log(`Tarifas V2: ${JSON.stringify(rowtarifas)}`);

        /*doCmd({ 
          cmd: "GetPing",
          data: {
            linea: "Despues",
            rowtarifas: rowtarifas,
            ramo: cramo,
            plan: cplan,
            cober: Number(covItem.code),
            tarifas: TarifasCatalog,
            prorate: prorate,
            detail: detail
          }
        });*/

        errorPuntero = `cob-${covItem.code}-state-sentence`;

        sentenciacondicion = varG;

        try {
          if (!isNullOrEmpty(rowtarifas?.condicion)) {
              sentenciacondicion = sentenciacondicion + " if(" + rowtarifas.condicion + ") ";
          }  
        } catch (error) {
          log(`Error calculando cob ${covItem.code}, columna condición: ${error}`);
          throw new Error(error);
        }

        try {
          if (!isNullOrEmpty(rowtarifas?.prima)) {
            sentenciaprima = sentenciacondicion + " " + rowtarifas.prima;
            log(`Prima => ${sentenciaprima}`);
          }
        } catch (error) {
          log(`Error calculando cob ${covItem.code}, columna prima: ${error}`);
          throw new Error(error);
        }

        try {
          if (!isNullOrEmpty(rowtarifas?.deducible)) {
            sentenciadeducible = sentenciacondicion + " " + rowtarifas.deducible;
          }
        } catch (error) {
          log(`Error calculando cob ${covItem.code}, columna deducible: ${error}`);
          throw new Error(error);
        }
        
        try {
          if (!isNullOrEmpty(rowtarifas?.sumaasegurada)) {
            sentencialimit = sentenciacondicion + " " + rowtarifas.sumaasegurada;
            log(`Suma => ${sentencialimit}`);
          }
        } catch (error) {
          log(`Error calculando cob ${covItem.code}, columna suma: ${error}`);
          throw new Error(error);
        }

        try {
          if (!isNullOrEmpty(rowtarifas?.etiqueta)) {
            sentenciadescription = sentenciacondicion + " " + rowtarifas.etiqueta;
          }
        } catch (error) {
          log(`Error calculando cob ${covItem.code}, columna etiqueta: ${error}`);
          throw new Error(error);
        }      

        errorPuntero = `cob-${covItem.code}-state-calc`;

        // TARIFICA DINAMICAMENTE 
        try {
          if (!isNullOrEmpty(sentenciaprima)) {
            premiumReturn = eval(sentenciaprima);
            //   throw sentenciaprima;
          }
        } catch (error) {
          log(`Error calculando cob ${covItem.code}, columna prima: ${error}`);
          throw new Error(error);
        }                

        try {
          if (!isNullOrEmpty(sentenciadeducible)) {
            deductibleReturn = eval(sentenciadeducible);
          }
        } catch (error) {
          log(`Error calculando cob ${covItem.code}, columna deducible: ${error}`);
          throw new Error(error);
        }
        
        try {
          if (!isNullOrEmpty(sentencialimit)) {
            limitReturn = eval(sentencialimit);
          }
        } catch (error) {
          log(`Error calculando cob ${covItem.code}, columna suma: ${error}`);
          throw new Error(error);
        }
        
        try {
          if (!isNullOrEmpty(rowtarifas?.etiqueta)) {
            descriptionReturn = eval(sentenciadescription);
          } else {
              descriptionReturn = deductibleReturn;
          }
        } catch (error) {
          log(`Error calculando cob ${covItem.code}, columna etiqueta: ${error}, ver detalles en siguiente log`);
          log(`Sentencia etiqueta error: ${sentenciadescription}`);
          throw new Error(error);
        }
        
        //Aquí aplicamos prorrata según configuración de la tabla.
        const primaSinProrrata = premiumReturn;
        if (premiumReturn > 0 && prorate > 0 && rowtarifas.usaProrrata === true) {
            premiumReturn = (premiumReturn * prorate);
            //redondeamos
            premiumReturn = Math.round((premiumReturn + Number.EPSILON) * 100) / 100;
        }

        /*doCmd({ 
            cmd: "GetPing",
            data: {
              rowtarifas: rowtarifas,
              ramo: cramo,
              plan: cplan,
              cober: Number(covItem.code),
              tarifas: TarifasCatalog,
              accionActual: accionActual,
              variables: varG,
              sentenciaprima: sentenciaprima,
              sentencialimit: sentencialimit,
              premiumReturn: primaSinProrrata,
              premiumReturnProrrateado: premiumReturn,
              limitReturn: limitReturn,
              prorate: prorate,
              detail: detail
            }
          });*/

        log(`Cobertura: ${covItem.code} calculada sin errores`);

        return {
            code: covItem.code,
            limit: limitReturn,
            premium: premiumReturn,
            dedutible: deductibleReturn,
            description: descriptionReturn,
        };
    }).reduce((acc, cov) => {
        acc[cov.code] = cov;
        return acc;
    }, {})

    return result;

} catch (error) {
    throw `@Error: ${error.toString()} ${errorPuntero}`;
}

function GetPolicy(poliza) {


    doCmd({
        cmd: "RepoInsuredObject",
        data: {
            operation: 'GET',
            filter: `lifePolicyId = ${poliza.id} and objectDefinitionId in (45,46,47)`,
            noTracking: true
        }
    });

    if (!(RepoInsuredObject.total > 0) || !RepoInsuredObject.outData) {
        throw ' Debe Guardar el Objeto Asegurado'
    }

    const objValueobject = RepoInsuredObject.outData[0].userData;

    return {
        ramo: poliza.lob,
        plan: poliza.productCode,
        poliza: poliza,
        coverages: poliza.Coverages,
        userData: objValueobject
    };
}

function GetPolicyEndoso(poliza) {

    doCmd({
        cmd: "RepoLifePolicy",
        data: {
            operation: 'GET',
            filter: `id=${poliza.id}`,
            noTracking: true,
            include: ['Coverages', 'InsuredObjects']
        }
    });

    const definitions = [45, 46, 47];
    const localPoliza = RepoLifePolicy.outData[0];
    const insuredObject = localPoliza.InsuredObjects.find(x => definitions.includes(x.objectDefinitionId));
    const userData = insuredObject.userData;

    return {
        ramo: localPoliza.lob,
        plan: localPoliza.productCode,
        poliza: localPoliza,
        coverages: localPoliza.Coverages,
        userData: userData
    };
}

function getChangeInsuredObjectChangeUserData(extra) {

  const objectDefinitionId = [46,47]; //Esto es el DT requerido.
  const newInsuredObjects = JSON.parse(extra.jNewInsuredObjects ? extra.jNewInsuredObjects : extra?.data?.jNewInsuredObjects);
  const jValuesStr = newInsuredObjects.find(x => objectDefinitionId.includes(x.objectDefinitionId))?.jValues;
  
  if (!jValuesStr) return {};

  let controls;

  try {
    controls = JSON.parse(jValuesStr);
  } catch (err) {
    console.error("JSON inválido", err);
    return {};
  }

  const result = {};

  for (const ctrl of controls) {
    if (!ctrl.name) continue;

    let value = null;

    if (Array.isArray(ctrl.userData) && ctrl.userData.length > 0) {
      value = ctrl.userData[0];
    }

    result[ctrl.name] = value;
  }

  return result;
  
}

function getTarifasCatalog() {
    doCmd({ cmd: "GetFullTable", data: { table: "tarificacionsis9" } });
    let rows = GetFullTable.outData.splice(1);

    return rows.map(row => ({
        cramo: row[0],
        codigoplan: row[1],
        ccobertura: row[2],
        cendoso: row[3],
        condicion: row[4],
        prima: row[5],
        deducible: row[6],
        sumaasegurada: row[7],
        etiqueta: row[8],
        usaProrrata: String(row[9]).toLowerCase() === 'true'
    }));
}

function isNullOrEmpty(value) {
  if (value === null || value === undefined) return true;

  // string
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }

  // array
  if (Array.isArray(value)) {
    return value.length === 0;
  }

  // objeto
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }

  // cualquier otro tipo (number, boolean, etc.)
  return false;
};