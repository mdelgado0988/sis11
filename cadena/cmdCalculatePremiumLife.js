//block
//noreplace

/*
  *@name: cmdCalculatePremiumLife
  *@Purpose: Comando que realiza cotización de productos de fianzas 
  *@Autor: Michael Delgado
  *@Email: michael.delgado@axxis-systems.com
  *@Created: 07/05/2026
  *@Input: {poliza:_pol,action:_action,extra:_pol.jChangeDto}
  *@Output: [{ code, limit, premium, dedutible, description }]
*/

const { poliza, action, extra } = context;
const objectDefinitionCode = "DT_ACCIDENTES_V1";
let tarifas;
let oaUserData;
let resultCoverages = [];
const tarifaVida = [{ lob: 31, name: "tarificacionSIS9Vida"  }, { lob: 71, name: "tarificacionSIS9VidaIndividual"  }]

try {

  log("Calculando tarifas");
  setTarifas();

  log("Calculando objeto asegurado");
  setInsuredObject();

  log("Estableciendo coberturas");
  setResultCoverages();

  log("Iterando coberturas para cálculos");

  for (let cov of poliza.Coverages) {

    const resultCoverage = resultCoverages.find(x => x.code == cov.code);
    const obj = getQuotationObject(cov.code);

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
        resultCoverage.dedutible = evalConfig(obj, tarifa.deducible);    
        resultCoverage.dedutible = n(resultCoverage.dedutible);   // a dos decimales
        oaUserData[`DEDU${cov.code}`] = resultCoverage.dedutible;

        log(`Evaluando etiqueta}: ${tarifa.etiqueta}`);
        resultCoverage.description = evalConfig(obj, tarifa.etiqueta);    
        oaUserData[`DES${cov.code}`] = resultCoverage.description;

        //Asigno los cobtar de las cobs para usarlas.
        (obj.params || []).forEach(p => {
          oaUserData[`${p}_${cov.code}`] = obj[p];
        });     

        //Calculamos la fecha inicial
        const cobtar = oaUserData.cobtar.find(x => x.COVERAGECODE == tarifa.ccobertura);
        resultCoverage.fini = parseFechaUTCMedioDia(cobtar?.["FINICIAL"]);
        resultCoverage.ffin = parseFechaUTCMedioDia(cobtar?.["FFINAL"]);
        
        break;
      }
      
    }
    
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

  // buscar en cobtar y asignar valores
  let item = (oaUserData.cobtar || []).find(x => x.COVERAGECODE == coverageCode);

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

  //Convertimos a números valores sencibles:
  obj.msumaaseg = n(obj.txtSumaAsegurada);
  obj.txtSumaAsegurada = n(obj.txtSumaAsegurada);
  obj.txtSalario = n(obj.txtSalario);
  obj.XMONTH = getMonthsBetween(poliza.start, poliza.end);
  obj.edadReal = calcularEdad();

  //Calculo de factor de vigencia, ojo
  //* calculamos la duración de la cobertura
  const coveragePolicy = poliza.Coverages.find(x => x.code == coverageCode);
  const qDuration = item?.DURACIONDIAS ?? 0;
  
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

function setTarifas() {

  const tableName = tarifaVida.find(t => t.lob == poliza.lob)?.name;

  doCmd({cmd :"GetFullTable", data: {table: tableName}});

   if(!GetFullTable.ok)
      console.error("Error leyendo configuración de tarifas");

  tarifas = mapearTablaConfig(GetFullTable.outData ?? []);
  tarifas = tarifas.filter(x => vEqual(x.cramo) == vEqual(poliza.lob) && vEqual(x.codigoplan) == vEqual(poliza.productCode));
  
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

  oaUserData.cobtar = oaUserData.hiddenCobtar ? JSON.parse(oaUserData.hiddenCobtar) : [];  
  oaUserData.cobtar = normalizeArray(oaUserData.cobtar);

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
  id: 3184
  lob: 31
  productCode: APAM1
  start: '2026-05-01'
  end: '2027-05-01'
  Coverages: 
    - code: 163
      name: ""
    - code: 165
      name: ""
    - code: 166
      name: ""
    - code: 167
      name: ""
  MainInsured:
    contactId: 3
        
*/