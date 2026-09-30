//block
//noreplace

/*
  *@name: cmdCalculatePremiumTecnicos
  *@Purpose: Comando que realiza cotización de productos de ramos técnicos 
  *@Autor: Michael Delgado
  *@Email: michael.delgado@axxis-systems.com
  *@Created: 07/05/2026
  *@Input: {poliza:_pol,action:_action,extra:_pol.jChangeDto}
  *@Output: [{ code, limit, premium, dedutible, description }]
*/

const { poliza, action, extra } = context;
const objectDefinitionCode = "DT_RAMO_TECNICO";
let tarifas;
let oaUserData;
let resultCoverages = [];
let deduciblesConfig = []
let tasasXMesConfig = []
const tablaTarifa = [{ lob: 96, name: "tarificacionSIS9RamoTecnico"  },
                    { lob: 71, name: "tarificacionSIS9VidaIndividual" },
                    { lob: 52, name: "tarificacionSIS9RiesgosVarios" }]

try {

  log("Calculando tarifas");
  setTarifas();

  log("Calculando objeto asegurado");
  setInsuredObject();

  log("Calculando configuración de deducibles");
  setDeduciblesConfig();

  log("Calculando configuración de tasas x mes");
  setTasasXMesConfig();

  log("Estableciendo coberturas");
  setResultCoverages();

  log("Iterando coberturas para cálculos");

  for (let cov of poliza.Coverages) {

    const resultCoverage = resultCoverages.find(x => x.code == cov.code);
    const obj = getQuotationObject(cov.code);
    const covDeduConfig = deduciblesConfig.filter(x => vEqual(x.Cobertura) == vEqual(cov.code));

    //return obj;
    //log(`obj: $${JSON.stringify(obj)}`);

    log(`Tarificando cobertura: ${cov.code}`);
    
    //find configs by coverageCode
    const configs = tarifas.filter(x => x.ccobertura == cov.code);    
    for (let tarifa of configs) {
      
      log(`Condición: ${tarifa.condicion}`);
      const condicion = evalConfig(obj, tarifa.condicion);      

      //log(`Condición res: ${condicion}`);

      //Si encuentro condición en verdadero recupero los valores y no continuo;
      if(condicion){

        log(`Evaluando suma: ${tarifa.sumaasegurada}`);
        resultCoverage.limit = evalConfig(obj, tarifa.sumaasegurada);    
        resultCoverage.limit = n(resultCoverage.limit);   // a dos decimales
        oaUserData[`SUMA${cov.code}`] = resultCoverage.limit;

        log(`Evaluando prima: ${tarifa.prima}`);
        //log(`objeto: ${JSON.stringify(obj)}`);
        resultCoverage.premium = evalConfig(obj, tarifa.prima);    
        resultCoverage.premium = n(resultCoverage.premium);   // a dos decimales
        oaUserData[`PRIMA${cov.code}`] = resultCoverage.premium;

        log(`Evaluando deducible}: ${tarifa.deducible}`);

        if(vEqual(tarifa.deducible) == "DEDUCIBLEMONTO") {

          log("Evaluando monto deducible")
          for(let dedu of covDeduConfig){
            
            //calculamos el que aplica.
            const condicion = evalConfig(obj, dedu.Condicion);      
            if(condicion){
              log(`Condición dedu encontrada: ${dedu.Monto}`);
              resultCoverage.dedutible = evalConfig(obj, dedu.Monto);    
              resultCoverage.dedutible = n(resultCoverage.dedutible);   // a dos decimales
              break;
            }
            
          }
          
        }
        else {
          resultCoverage.dedutible = evalConfig(obj, tarifa.deducible);    
          resultCoverage.dedutible = n(resultCoverage.dedutible);   // a dos decimales
        }
        
        oaUserData[`DEDU${cov.code}`] = resultCoverage.dedutible;

        log(`Evaluando etiqueta}: ${tarifa.etiqueta}`);

        if(vEqual(tarifa.etiqueta) == "DEDUCIBLEDESC") {
          //calculamos el que aplica.

          for(let dedu of covDeduConfig){
            const condicion = evalConfig(obj, dedu.Condicion);      
            if(condicion){
              log(`Condición dedudesc encontrada: ${dedu.Descripcion}`);
              resultCoverage.description = evalConfig(obj, dedu.Descripcion);    
              break;
            }
          }      
          
        }
        else {
          resultCoverage.description = evalConfig(obj, tarifa.etiqueta);    
        }
        
        oaUserData[`DES${cov.code}`] = resultCoverage.description;

        //Asigno los cobtar de las cobs para usarlas.
        (obj.params || []).forEach(p => {
          oaUserData[`${p}_${cov.code}`] = obj[p];
        });     

        break;
      }
      
    }

    // La vigencia se resuelve por cobertura. Si la cobertura no tiene una
    // fila propia en el formulario, utiliza la configuracion de la cobertura
    // 20 como respaldo, sin reutilizar sus valores tarifarios.
    const vigencia = getCoverageValidity(cov.code);
    resultCoverage.fini = parseFechaUTCMedioDia(vigencia?.FINICIAL);
    resultCoverage.ffin = parseFechaUTCMedioDia(vigencia?.FFINAL);
    
  }

  return resultCoverages
  
}
catch(error){
  throw `@${error.toString()}`;
}

function getQuotationObject(coverageCode) {

  log(`Calculando objeto cov: ${coverageCode}`);
  
  // clonar objeto base    
  const obj = JSON.parse(JSON.stringify(oaUserData));

  const isNullOrEmpty = (value) => {
    if (value === null || value === undefined) return true;  
    if (typeof value === "string")
      return value.trim().length === 0;
    
    return false; // números, booleanos, objetos, etc. NO son vacíos
  };

  // Buscar en cobtar y asignar valores. La configuracion de la cobertura 20
  // se reserva para el calculo de vigencia, no para las formulas de tarifa.
  const configuredItem = getCoverageConfig(coverageCode);
  let item = configuredItem;

  //Cuando sea null validamos por cualquier eventualidad
  if (!item){
    item = {}
    //si existen campos en cobtar los voy a llenar vacíos para evitar fallos
    if((oaUserData.cobtar || []).length > 0){      
      Object.entries(oaUserData.cobtar[0]).forEach(([key, value]) => {
        if(key != "COVERAGECODE" && key != "coverageName")
        item[key] = "0";
      });
    }
    
  }
    
  Object.entries(item).forEach(([key, value]) => {
    obj[key] = isNullOrEmpty(value) ? "0" : value;
    if(!obj.params) obj.params = [];
    if(key != 'COVERAGECODE') obj.params.push(key);
  });

  //Parametros por defecto/manuales
  //Convertimos a números valores sencibles:
  obj.msumaaseg = n(obj.txtSA);
  obj.SUMA_CAR = n(obj.txtSA);
  obj.txtSA = n(obj.txtSA);
  obj.XMONTH = getMonthsBetween(poliza.start, poliza.end);
  obj.DEDUCIBLE = obj.DEDUCIBLE ?? "0";

  const configTasa =  tasasXMesConfig.find(x => obj.XMONTH >= n(x.Desde) && obj.XMONTH <= n(x.Hasta) && x.Uso == obj.cmbActividadEconomica);  
  obj.TASAXMES = n(configTasa?.Tasa);

  //Calculo de factor de vigencia, ojo
  //* calculamos la duración de la cobertura
  const validityItem = getCoverageValidity(coverageCode);
  const qDuration = getCoverageDuration(validityItem);
  
  obj["VIGENCIA_FACTOR"] = (qDuration >= 365) ? Number((qDuration / 365).toFixed(4)) : 1;  

  //Normalizamos nombres de los campos del DT para evitar problemas con caracteres especiales.
  const keys = Object.keys(obj);
  const safeKeys = keys.map(sanitizeKey);
  
  const safeObj = {};
  keys.forEach((k, i) => {
    safeObj[safeKeys[i]] = obj[k];
  });

  return safeObj;
}

function getCoverageConfig(coverageCode) {
  return (oaUserData.cobtar || []).find(x => vEqual(x.COVERAGECODE) == vEqual(coverageCode));
}

function getCoverageValidity(coverageCode) {
  const configuredItem = getCoverageConfig(coverageCode);
  const fallbackItem = getCoverageConfig(20);

  if (!configuredItem) return fallbackItem;
  if (!fallbackItem || vEqual(coverageCode) == "20") return configuredItem;

  const validityItem = { ...configuredItem };
  const validityFields = [
    "FINICIAL",
    "FFINAL",
    "DURACIONDIAS",
    "DURACION_DIAS",
    "DURACIONDIA",
    "DURACION"
  ];

  for (const field of validityFields) {
    const value = validityItem[field];
    if (value === undefined || value === null || String(value).trim() === "") {
      validityItem[field] = fallbackItem[field];
    }
  }

  return validityItem;
}

function setTarifas() {

  const tableName = tablaTarifa.find(t => t.lob == poliza.lob)?.name;

  doCmd({cmd :"GetFullTable", data: {table: tableName}});

   if(!GetFullTable.ok)
      throw new Error("Error leyendo configuración de tarifas");

  tarifas = mapearTablaConfig(GetFullTable.outData ?? []);
  tarifas = tarifas.filter(x => vEqual(x.cramo) == vEqual(poliza.lob) && vEqual(x.codigoplan) == vEqual(poliza.productCode));
  
}

function setDeduciblesConfig() {

  const tableName = "cfgRamoTecnicoDeducible";

  doCmd({cmd :"GetFullTable", data: {table: tableName}});

   if(!GetFullTable.ok)
      throw new Error("Error leyendo configuración de deducibles");

  deduciblesConfig = mapearTablaConfig(GetFullTable.outData ?? []);
  
}

function setTasasXMesConfig() {

  const tableName = "cfgRamoTecnicoTasaPorUsoYMes";

  doCmd({cmd :"GetFullTable", data: {table: tableName}});

   if(!GetFullTable.ok)
      throw new Error("Error leyendo configuración de tasas x mes");

  tasasXMesConfig = mapearTablaConfig(GetFullTable.outData ?? []);
  
}

function setInsuredObject() {
  
  doCmd({cmd: "RepoObjectDefinition", data:{ operation: "GET", filter: `code = '${objectDefinitionCode}'`, noTracking: true}});
  const objectDefinitionId = RepoObjectDefinition.outData?.[0]?.id ?? 0;
  if(objectDefinitionId == 0)
    throw new Error("No se encontró configuración del objeto asegurado ")
  
  doCmd({
      cmd: "LoadEntity",
      data: {
          entity: 'InsuredObject',
          filter: `lifePolicyId = ${poliza.id} and objectDefinitionId in (${objectDefinitionId})`,
          noTracking: true
      }
  });

  if (!LoadEntity.outData) {
      throw ' Debe guardar el objeto asegurado'
  }

  oaUserData = LoadEntity.outData?.jValues ? JSON.parse(LoadEntity.outData?.jValues) : [];
  oaUserData = mapearCamposOA(oaUserData);

  if(!oaUserData)
    throw ' No se pudo recuperar el objeto asegurado, verifique que se haya registrado correctamente.';

  const persistedCobtar = oaUserData.hiddenCobtar
    ? parseObject(oaUserData.hiddenCobtar)
    : [];
  const endorsementCobtar = getEndorsementCobtar();

  // En un endoso los valores digitados en la grilla todavía no existen en
  // hiddenCobtar. Se usan para la cotización y reemplazan la fila equivalente.
  oaUserData.cobtar = mergeCobtar(persistedCobtar, endorsementCobtar);

}

function getEndorsementCobtar() {
  const parsedExtra = parseObject(extra);
  const parsedExtraData = parseObject(parsedExtra.data);
  const parsedDto = parseObject(poliza && poliza.jChangeDto);
  const parsedDtoData = parseObject(parsedDto.data);
  const candidates = [
    parsedExtraData.jAdditional,
    parsedExtra.jAdditional,
    parsedDtoData.jAdditional,
    parsedDto.jAdditional,
    poliza && poliza.jAdditional
  ];

  for (const candidate of candidates) {
    const additional = parseObject(candidate);
    const cobtar = additional.cobtar;
    if (typeof cobtar === "string") {
      const parsedCobtar = parseObject(cobtar);
      if (Array.isArray(parsedCobtar)) return normalizeArray(parsedCobtar);
    }
    if (Array.isArray(cobtar)) return normalizeArray(cobtar);
  }

  return [];
}

function mergeCobtar(persistedCobtar, endorsementCobtar) {
  const persisted = normalizeArray(Array.isArray(persistedCobtar) ? persistedCobtar : []);
  const endorsement = normalizeArray(Array.isArray(endorsementCobtar) ? endorsementCobtar : []);

  if (!endorsement.length) return persisted;

  const endorsementCodes = endorsement.map(row => vEqual(row.COVERAGECODE));
  return persisted
    .filter(row => !endorsementCodes.includes(vEqual(row.COVERAGECODE)))
    .concat(endorsement);
}

function parseObject(value) {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string" || !value.trim()) return {};

  try {
    return JSON.parse(value);
  } catch (error) {
    return {};
  }
}

function setResultCoverages() {
  for (let cov of poliza.Coverages) {
    resultCoverages.push({ code: cov.code.toString(), limit: 0, premium: 0, dedutible: 0, description: "" });    
  }  
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

function evalConfig(obj, formula) {
  const keys = Object.keys(obj);
  const values = Object.values(obj);
  const fn = new Function(...keys, "n", `return ${formula}`);
  return fn(...values, n);
}

function vEqual(value) {
  return String(value || '').trim().toUpperCase()
}

function getMonthsBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    let months = (end.getFullYear() - start.getFullYear()) * 12;
    months += end.getMonth() - start.getMonth();

    // Ajusta si el día final aún no completa el mes
    if (end.getDate() < start.getDate()) {
        months--;
    }

    return months;
}

function getBirthDay() {
  doCmd({cmd: "LoadEntity", data: { entity: "Contact", fields: "birth", filter: `id = ${poliza.MainInsured?.contactId ?? 0}` }})
  return LoadEntity.outData?.birth;
}

function calcularEdad(fechaCalculo = new Date()) {

    const fechaNacimiento = getBirthDay();

    const nac = new Date(fechaNacimiento);
    const cuando = new Date(fechaCalculo);

    let edad = cuando.getFullYear() - nac.getFullYear();

    // Equivalente a:
    // set @nac = dateadd(yy, @ed, @nac)
    const fechaCumple = new Date(nac);
    fechaCumple.setFullYear(nac.getFullYear() + edad);

    // if @nac>@cuando set @ed=@ed-1
    if (fechaCumple > cuando) {
        edad--;
    }

    return edad;
}

//////////////////////////////////////////////////////////////////////
// AUXILIARES
//////////////////////////////////////////////////////////////////////

function replaceAccents(str) {
  const map = {
    á: "a", à: "a", ä: "a", â: "a",
    é: "e", è: "e", ë: "e", ê: "e",
    í: "i", ì: "i", ï: "i", î: "i",
    ó: "o", ò: "o", ö: "o", ô: "o",
    ú: "u", ù: "u", ü: "u", û: "u",
    ñ: "n",
    Á: "A", À: "A", Ä: "A", Â: "A",
    É: "E", È: "E", Ë: "E", Ê: "E",
    Í: "I", Ì: "I", Ï: "I", Î: "I",
    Ó: "O", Ò: "O", Ö: "O", Ô: "O",
    Ú: "U", Ù: "U", Ü: "U", Û: "U",
    Ñ: "N"
  };

  return str.replace(/[^\u0000-\u007E]/g, char => map[char] || char);
}

function normalizeKey(key) {
  return replaceAccents(key)
    .replace(/\s+/g, "")          // quita espacios
    .replace(/[^a-zA-Z0-9_]/g, "") // limpia símbolos opcional
    .toUpperCase().trim();
}

function normalizeObjectKeys(obj) {
  if (!obj || typeof obj !== "object") return {};

  return Object.keys(obj).reduce((acc, key) => {
    const newKey = normalizeKey(key);
    acc[newKey] = obj[key];
    return acc;
  }, {});
}

function normalizeArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(normalizeObjectKeys);
}

function mapearCamposOA(arr) {
  if (!Array.isArray(arr)) return {};

  return Object.fromEntries(
    arr
      .filter(x => x && x.name) // evita null/undefined
      .map(x => [
        x.name,
        Array.isArray(x.userData) ? x.userData[0] : x.userData
      ])
  );
}

function n(v) {
  if (v == null) return 0;

  if (typeof v === "number") {
    return isFinite(v) ? round2(v) : 0;
  }

  let s = String(v).trim();
  if (!s) return 0;

  s = s.replace(/\s+/g, "");

  const esEU = /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s);

  if (esEU) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(/,/g, "");
  }

  const num = Number(s);
  return isFinite(num) ? round2(num) : 0;
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function sanitizeKey(key) {
  return key.replace(/[^a-zA-Z0-9_]/g, "_");
}

function diffDays(date1, date2) {
  const d1 = toDateOnly(date1);
  const d2 = toDateOnly(date2);

  if (!d1 || !d2) return 0;

  const msPerDay = 24 * 60 * 60 * 1000;

  return Math.floor((d2 - d1) / msPerDay);
}

function getCoverageDuration(item) {
  if (!item || typeof item !== "object") return 0;

  const keys = ["DURACIONDIAS", "DURACION_DIAS", "DURACIONDIA", "DURACION"];
  const key = keys.find(name => item[name] !== undefined
    && item[name] !== null
    && String(item[name]).trim() !== "");

  if (!key) return 0;

  const value = Number(String(item[key]).replace(",", "."));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function toDateOnly(value) {
  if (!value) return null;

  const d = (value instanceof Date) ? value : new Date(value);

  if (isNaN(d.getTime())) return null;

  // Normaliza eliminando hora (IMPORTANTE)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseFechaUTCMedioDia(fechaStr) {
  if (!fechaStr) return null;

  const [year, month, day] = fechaStr.split("-").map(Number);

  // UTC a las 12:00:00 para evitar shift de zona horaria
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////

/*
*@test:
poliza:
  id: 3384
  lob: 52
  productCode: 52_3
  start: '2026-05-01'
  end: '2027-05-01'
  Coverages: 
    - code: 117
      name: ""
    - code: 112
      name: ""
    - code: 113
      name: ""
    - code: 23
      name: ""
    - code: 24
      name: ""
    - code: 25
      name: ""
    - code: 26
      name: ""
    - code: 27
      name: ""        
*/
