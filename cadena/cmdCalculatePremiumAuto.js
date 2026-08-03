//block
//noreplace

/*
  *@name: cmdCalculatePremiumAuto
  *@Purpose: Command that performs quotation of automobile insurance products.
  *@Autor: Michael Delgado
  *@Email: michael.delgado@axxis-systems.com
  *@Created: 05/07/2026
  *@Input: {poliza:_pol,action:_action,extra:_pol.jChangeDto}
  *@Output: [{ code, limit, premium, dedutible, description }]
*/

const { poliza, action, extra } = context;
const objectDefinitionCode = "DTAUT";
let tarifas;
let tbTarConfig = [];
let vwGetConfigTar = [];
let tbModelos = [];
let oaUserData;
let resultCoverages = [];
const tarifaAuto = [
  { lob: 6, name: "tarificacionSIS9Auto"  }
]

try {
  validateInput();

  // log("Calculando tarifas");
  tarifas = getTarifas();

  // log("Cargando tb_tarConfig");
  tbTarConfig = getTarConfigTable();

  // log("Cargando vw_getConfigTar");
  vwGetConfigTar = getVwGetConfigTarTable();

  // log("Calculando objeto asegurado");
  oaUserData = getInsuredObject();

  // Load models once and reuse the filtered list for each coverage quotation object.
  tbModelos = getModelos();

  // log("Estableciendo coberturas");
  resultCoverages = getResultCoverages();

  // log("Iterando coberturas para cálculos");

  for (let cov of poliza.Coverages) {

    const resultCoverage = resultCoverages.find(x => x.code == cov.code);
    const obj = getQuotationObject(cov.code);
    const pprima = getPPrima(tbTarConfig, cov.code, obj);
    const porcentaje = getPorcentaje(vwGetConfigTar, cov.code);
    const porcentajeGrupo = getPorcentajePorGrupo(vwGetConfigTar, poliza.productCode, obj?.OPCION ?? 0);
    const porcentajeDedu = getPorcentajeDeduPorGrupo(vwGetConfigTar, poliza.productCode, obj?.OPCION ?? 0);
    obj.pprima = pprima ?? 0;
    obj.porcentaje = porcentaje ?? 0;
    obj.porcentajeGrupo = porcentajeGrupo ?? 0;
    obj.porcentajeDedu = porcentajeDedu ?? 0;

    //log(`obj: $${JSON.stringify(obj)}`);

    // log(`Tarificando cobertura: ${cov.code}`);
    
    //find configs by coverageCode
    const configs = tarifas.filter(x => x.ccobertura == cov.code);    
    for (let tarifa of configs) {
      
      // log(`Condición: ${tarifa.condicion}`);
      const condicion = evalConfig(obj, tarifa.condicion);      

      //log(`Condición res: ${condicion}`);

      //Si encuentro condición en verdadero recupero los valores y no continuo;
      if(condicion){

        // log(`Evaluando suma: ${tarifa.sumaasegurada}`);
        resultCoverage.limit = evalConfig(obj, tarifa.sumaasegurada);    
        resultCoverage.limit = n(resultCoverage.limit);   // a dos decimales
        oaUserData[`SUMA${cov.code}`] = resultCoverage.limit;

        // log(`Evaluando prima: ${tarifa.prima}`);
        //log(`objeto: ${JSON.stringify(obj)}`);
        resultCoverage.premium = evalConfig(obj, tarifa.prima);    
        resultCoverage.premium = n(resultCoverage.premium);   // a dos decimales
        oaUserData[`PRIMA${cov.code}`] = resultCoverage.premium;

        // log(`Evaluando deducible}: ${tarifa.deducible}`);
        resultCoverage.dedutible = evalConfig(obj, tarifa.deducible);    
        resultCoverage.dedutible = n(resultCoverage.dedutible);   // a dos decimales
        oaUserData[`DEDU${cov.code}`] = resultCoverage.dedutible;

        // log(`Evaluando etiqueta}: ${tarifa.etiqueta}`);
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

function validateInput() {
  if (!poliza || typeof poliza !== "object") {
    throw new Error("La póliza no fue enviada o no tiene un formato válido.");
  }

  if (!poliza.id || isNaN(Number(poliza.id))) {
    throw new Error("La póliza no contiene un id válido.");
  }

  if (poliza.lob == null || String(poliza.lob).trim() === "") {
    throw new Error("La póliza no contiene un ramo válido.");
  }

  if (poliza.productCode == null || String(poliza.productCode).trim() === "") {
    throw new Error("La póliza no contiene un código de producto válido.");
  }

  if (!poliza.start || !isValidDate(poliza.start)) {
    throw new Error("La póliza no contiene una fecha de inicio válida.");
  }

  if (!poliza.end || !isValidDate(poliza.end)) {
    throw new Error("La póliza no contiene una fecha de fin válida.");
  }

  if (!Array.isArray(poliza.Coverages) || poliza.Coverages.length === 0) {
    throw new Error("La póliza no contiene coberturas para calcular.");
  }

  const invalidCoverages = poliza.Coverages.filter(function (cov) {
    return !cov || cov.code == null || String(cov.code).trim() === "";
  });

  if (invalidCoverages.length > 0) {
    throw new Error("Existe al menos una cobertura sin código válido en la póliza.");
  }
}

function isValidDate(value) {
  const date = new Date(value);
  return !isNaN(date.getTime());
}

function getQuotationObject(coverageCode) {

  // log(`Calculando objeto cov: ${coverageCode}`);
  
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
  obj.msumaaseg = n(obj.txtSA);
  obj.txtSumaAsegurada = n(obj.txtSA);
  obj.XMONTH = getMonthsBetween(poliza.start, poliza.end);

  //Calculo de factor de vigencia, ojo
  //* calculamos la duración de la cobertura
  const coveragePolicy = poliza.Coverages.find(x => x.code == coverageCode);
  const qDuration = item?.DURACIONDIAS ?? 0;
  
  obj["VIGENCIA_FACTOR"] = (qDuration >= 365) ? Number((qDuration / 365).toFixed(4)) : 1;  

  //Calculamos para nueva
  const aniosAuto = validaAniosPolizas({
    cendoso: 36,
    canoHof: Number(obj.txtAnioAuto ?? 0),
    currentYear: new Date().getFullYear()
  });

  /*const anos37 = validaAniosPolizas({
    cendoso: 37,
    canoCerti: 2020,
    fdesdeYear: 2021,
    fhastaYear: 2026
  });*/

  obj.ANIOAUTO = aniosAuto ?? 0;
  obj.productCode = poliza?.productCode ?? '';

  // Keep only models matching the policy line and the insured object's brand.
  obj.modelorec = tbModelos
    .filter(item => normalizeComparable(item?.cmarca) === normalizeComparable(obj?.cmbMarca))
    .map(item => item?.cmodelo)
    .filter(value => value !== null && value !== undefined && String(value).trim() !== '');

  //Normalizamos nombres de los campos del DT para evitar problemas con caracteres especiales.
  const keys = Object.keys(obj);
  const safeKeys = keys.map(sanitizeKey);
  
  const safeObj = {};
  keys.forEach((k, i) => {
    safeObj[safeKeys[i]] = obj[k];
  });

  return safeObj;
}

function getTarifas() {

  const tableName = tarifaAuto.find(t => t.lob == poliza.lob)?.name;

  if (!tableName) {
    throw new Error(`No existe una tabla de tarifas configurada para el ramo ${poliza.lob}.`);
  }

  doCmd({cmd :"GetFullTable", data: {table: tableName}});

   if(!GetFullTable || !GetFullTable.ok || !Array.isArray(GetFullTable.outData)) {
      throw new Error("No fue posible leer la configuración de tarifas.");
   }

  tarifas = mapearTablaConfig(GetFullTable.outData ?? []);
  tarifas = tarifas.filter(x => vEqual(x.cramo) == vEqual(poliza.lob) && vEqual(x.codigoplan) == vEqual(poliza.productCode));

  if (!Array.isArray(tarifas) || tarifas.length === 0) {
    throw new Error("No existen tarifas configuradas para la póliza.");
  }

  return tarifas;
}

function getTarConfigTable() {
  doCmd({ cmd: "GetFullTable", data: { table: "tb_tarConfig" } });

  if (!GetFullTable || !GetFullTable.ok || !Array.isArray(GetFullTable.outData)) {
    throw new Error("No fue posible leer la tabla tb_tarConfig.");
  }

  return mapTableByHeaders(GetFullTable.outData);
}

function getVwGetConfigTarTable() {
  doCmd({ cmd: "GetFullTable", data: { table: "vw_getConfigTar" } });

  if (!GetFullTable || !GetFullTable.ok || !Array.isArray(GetFullTable.outData)) {
    throw new Error("No fue posible leer la tabla vw_getConfigTar.");
  }

  return mapTableByHeaders(GetFullTable.outData);
}

function getModelos() {
  doCmd({ cmd: "GetFullTable", data: { table: "tbModelos" } });

  if (!GetFullTable || !GetFullTable.ok || !Array.isArray(GetFullTable.outData)) {
    throw new Error("No fue posible leer la tabla tbModelos.");
  }

  const rows = mapTableByHeaders(GetFullTable.outData);
  const policyLob = normalizeComparable(poliza?.lob);

  return rows.filter(item =>
    normalizeComparable(item?.cramo) === policyLob &&
    normalizeComparable(item?.ccategoria) === '1'
  );
}

function getPPrima(table, cober, obj) {
  const rows = Array.isArray(table) ? table : [];
  const coberValue = normalizeComparable(cober);
  const qanos6 = normalizeComparable(obj?.ANIOAUTO ?? 0);
  const cgrupo1 = normalizeComparable(obj?.LIMITE ?? 0);

  const isFirstBranch = rows.some(row =>
    normalizeComparable(row?.cramo) === "6" &&
    normalizeComparable(row?.ccategoria) === "1" &&
    normalizeComparable(row?.Topcion) === coberValue &&
    normalizeComparable(row?.norden) === qanos6 &&
    ["39", "15"].includes(normalizeComparable(row?.Topcion))
  );

  if (isFirstBranch) {
    const row = rows.find(item =>
      normalizeComparable(item?.cramo) === "6" &&
      normalizeComparable(item?.ccategoria) === "1" &&
      normalizeComparable(item?.Topcion) === coberValue &&
      normalizeComparable(item?.norden) === qanos6
    );

    return n(row?.Porcentaje ?? 0);
  }

  const isSecondBranch = rows.some(row =>
    normalizeComparable(row?.cramo) === "6" &&
    normalizeComparable(row?.ccategoria) === "1" &&
    normalizeComparable(row?.Topcion) === coberValue &&
    normalizeComparable(row?.norden) === cgrupo1 &&
    ["12", "13", "14"].includes(normalizeComparable(row?.Topcion))
  );

  if (isSecondBranch) {
    const row = rows.find(item =>
      normalizeComparable(item?.cramo) === "6" &&
      normalizeComparable(item?.ccategoria) === "1" &&
      normalizeComparable(item?.Topcion) === coberValue &&
      normalizeComparable(item?.norden) === cgrupo1
    );

    return n(row?.Porcentaje ?? 0);
  }

  return 0;
}

function getPorcentaje(table, cober, norden = -1) {
  const rows = Array.isArray(table) ? table : [];
  const coberValue = normalizeComparable(cober);
  const nordenValue = normalizeComparable(norden);

  const row = rows.find(item =>
    normalizeComparable(item?.cramo) === "6" &&
    normalizeComparable(item?.Topcion) === coberValue &&
    normalizeComparable(item?.norden) === nordenValue
  );

  return n(row?.Porcentaje ?? 0);
}

function getPorcentajePorGrupo(table, xplan, cgrupo) {
  const rows = Array.isArray(table) ? table : [];
  const planValue = normalizeComparable(xplan);
  const grupoValue = normalizeComparable(cgrupo);

  const row = rows.find(item =>
    normalizeComparable(item?.ccategoria) === "0" &&
    normalizeComparable(item?.cramo) === "6" &&
    normalizeComparable(item?.cplan) === planValue
  ) || null;

  if (!row) {
    return 0;
  }

  const selectedValue = grupoValue === "1"
    ? row?.opt1
    : grupoValue === "2"
      ? row?.opt2
      : grupoValue === "3"
        ? row?.opt3
        : 0;

  return n(100 - Number(selectedValue ?? 0));
}

function getPorcentajeDeduPorGrupo(table, xplan, cgrupo) {
  const rows = Array.isArray(table) ? table : [];
  const planValue = normalizeComparable(xplan);
  const grupoValue = normalizeComparable(cgrupo);

  const row = rows.find(item =>
    normalizeComparable(item?.ccategoria) === "0" &&
    normalizeComparable(item?.cramo) === "6" &&
    normalizeComparable(item?.cplan) === planValue
  ) || null;

  if (!row) {
    return 0;
  }

  const selectedValue = grupoValue === "1"
    ? row?.dedu1
    : grupoValue === "2"
      ? row?.dedu2
      : grupoValue === "3"
        ? row?.dedu3
        : 0;

  return n(Number(selectedValue ?? 0));
}

function getInsuredObject() {
  doCmd({
    cmd: "RepoObjectDefinition",
    data: {
      operation: "GET",
      filter: `code = '${objectDefinitionCode}'`,
      noTracking: true
    }
  });

  if (!RepoObjectDefinition || !RepoObjectDefinition.ok || !Array.isArray(RepoObjectDefinition.outData) || RepoObjectDefinition.outData.length === 0) {
    throw new Error("No se encontró configuración del objeto asegurado.");
  }

  const objectDefinitionId = RepoObjectDefinition.outData?.[0]?.id ?? 0;
  if (objectDefinitionId == 0) {
    throw new Error("No se encontró configuración del objeto asegurado.");
  }

  doCmd({
    cmd: "LoadEntity",
    data: {
      entity: "InsuredObject",
      filter: `lifePolicyId = ${poliza.id} and objectDefinitionId in (${objectDefinitionId})`,
      noTracking: true
    }
  });

  if (!LoadEntity || !LoadEntity.ok || !LoadEntity.outData) {
    throw new Error("Debe guardar el objeto asegurado.");
  }

  oaUserData = safeJsonParse(LoadEntity.outData?.jValues, [], "los valores del objeto asegurado");
  oaUserData = mapearCamposOA(oaUserData);

  if (!oaUserData || typeof oaUserData !== "object") {
    throw new Error("No se pudo recuperar el objeto asegurado, verifique que se haya registrado correctamente.");
  }

  oaUserData.cobtar = safeJsonParse(oaUserData.hiddenCobtar, [], "hiddenCobtar");
  oaUserData.cobtar = normalizeArray(oaUserData.cobtar);

  if (!Array.isArray(oaUserData.cobtar)) {
    throw new Error("El detalle de coberturas del objeto asegurado no es válido.");
  }

  return oaUserData;
}

function getResultCoverages() {
  const coverages = [];

  if (!Array.isArray(poliza?.Coverages)) {
    return coverages;
  }

  for (let cov of poliza.Coverages) {
    if (!cov || cov.code == null) {
      continue;
    }

    coverages.push({
      code: cov.code.toString(),
      limit: 0,
      premium: 0,
      dedutible: 0,
      description: ""
    });
  }

  return coverages;
}

function mapearTablaConfig(data) {

  if (!data || !data.length) return [];

  const headersOriginal = data[0];

  // Resolver nombres duplicados
  const headers = [];
  const contador = {};

  headersOriginal.forEach(h => {
    const key = String(h ?? '').trim();

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

function mapTableByHeaders(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  const headersOriginal = Array.isArray(data[0]) ? data[0] : Object.values(data[0] || {});
  if (!Array.isArray(headersOriginal) || headersOriginal.length === 0) {
    return [];
  }

  const headers = [];
  const contador = {};

  headersOriginal.forEach(h => {
    const key = normalizeHeaderName(h);

    if (contador[key]) {
      contador[key]++;
      headers.push(`${key}_${contador[key]}`);
    } else {
      contador[key] = 1;
      headers.push(key);
    }
  });

  return data.slice(1).map(row => {
    const values = Array.isArray(row) ? row : Object.values(row || {});
    const obj = {};

    headers.forEach((col, i) => {
      obj[col] = values[i];
    });

    return obj;
  });
}

function normalizeHeaderName(value) {
  return String(value ?? "").trim();
}

function normalizeComparable(value) {
  return String(value ?? "").trim().toUpperCase();
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

function validaAniosPolizas({
  cendoso,
  currentYear = new Date().getFullYear(),
  canoHof = null,
  canoCerti = null,
  fdesdeYear = null,
  fhastaYear = null
}) {
  let anoT = 0;
  let anoA = 0;
  let anoP = 0;

  cendoso = Number(cendoso || 0);

  if (cendoso === 36) {
    anoA = Number(canoHof || 0);
    anoT = currentYear - anoA;

    if (anoT <= 0) {
      anoT = 0;
    }
  }

  if (cendoso === 37) {
    anoA = Number(canoCerti || 0);
    fdesdeYear = Number(fdesdeYear || 0);
    fhastaYear = Number(fhastaYear || 0);

    anoA = fhastaYear - anoA;
    anoP = fdesdeYear - anoA;

    if (anoA === 0) {
      anoT = anoA + 1;
    } else {
      if (anoA === anoP) {
        anoT = anoA + 1;
      } else {
        anoT = anoA;
      }
    }
  }

  return anoT;
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

function safeJsonParse(value, fallback, label) {
  if (value == null || String(value).trim() === "") {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`El contenido de ${label} no tiene un formato JSON válido.`);
  }
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
  id: 3435
  lob: 6
  productCode: "6_22"
  start: '2026-05-01'
  end: '2027-05-01'
  Coverages: 
    - code: 12
      name: ""
    - code: 13
      name: ""
    - code: 14
      name: ""
    - code: 15
      name: ""
    - code: 35
      name: ""
    - code: 39
      name: ""
    - code: 90
      name: ""
        
*/
