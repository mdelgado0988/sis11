//block
//noreplace

/**
* @version  1.0.0
* @author Michael Delgado 
* @created 2026-04-21
* @chain cargaMasivaEmisionIncendioRapida
* @Purpose: Carga masiva de incendio pólizas individuales con datos básicos
* @copyright Axxis Systems S.A.
*/

const extraeValor = (text) => {
  if (text == null) return '';
  const str = String(text);
  return str.length <= 3 ? '' : str.slice(3);
};

const lob = "1";
try {
    
    /*doCmd({
      cmd: "GetPing",
      data: {
        mypl: JSON.stringify(context)
      }
    });
    throw new Error('Proceso en construcción');*/      
    const productJson = getProduct(context.row.productCode);
    const product = productJson.configJson ? JSON.parse(productJson.configJson) : {};

    const channelCode = extraeValor(product.Main?.channel);
    const segmentCode = extraeValor(product.Main?.segment);
    const branchCode = extraeValor(product.Main?.branch);

    // 2. Extracción de variables
    const datosPoliza = {
      productCode: context.row.productCode,
      lob: lob,
      segment: segmentCode,
      branch: branchCode,
      channel: channelCode,
      holderId: 0,
      insuredId: 0,
      payerId: 0,
      insuredSum: 0,
      currency: product?.currency ?? "USD",
      insuredSum: context.row.insuredSum,
      start: formatearFecha(context.row.start),
      end: formatearFecha(context.row.end),
      duration: 1,
      installmentSchemeId: 0,
      sellerId: 0,      
      description: `Lote ${context.batchId}`,
      periodicity: "m",
      age: 30, //esto es porque el sistema requiere para validar.
      frequency: 12,
      commercial: ""
    };

    const nombreSeparados = obtenerNombresYApellidos(context.row.nombreCompleto);

    const oa = {
      cmbTipoObjeto: context.row.tipoObjeto,
      txtSADisplay: formatN2(datosPoliza.insuredSum),
      txtSA: datosPoliza.insuredSum,
      txtFinca: "",
      txtRollo: "",
      txtDoc: "",
      txtNoPrestamo: "",
      txtNoGarantia: "",
      tipoOperacion: "",
      cmbCategoriaActividad: context.row.tipoActividad,
      cmbUsoBien: context.row.usoBien,
      cmbTipoMaterial: context.row.tipoMaterial,
      txtArea: "",
      txtCantidadPisos: "",
      Descripcion: context.row.descripcion,
      cmbPais: context.row.pais,
      cmbProvincia: context.row.provincia,
      cmbMunicipio: context.row.distrito,
      cmbSector: context.row.corregimiento,
      txtEdificios: dameDescripcionEdificio(context.row.pais, context.row.provincia, context.row.distrito, context.row.corregimiento, context.row.edificio),
      manzana: "",
      aptoocasa: "",
      calleoavenida: "",
      cmbZonaCresta: dameZonaRiesgo(context.row.pais, context.row.provincia),
      direccionexacta: "",
      cmbBarriadas: "0",
      cmbEdificios: context.row.edificio,
      cmbRenovacion: "Sin Accion",
      txtMotivoRenovacion: ""
    }

    const datosAsegurado = {
      cnp: context.row.cnp,
      nombres: nombreSeparados.nombres,
      apellidos: nombreSeparados.apellidos,
      nombreCompleto: context.row.nombreCompleto,
      apellidoCasada: "",
      fechaNacimiento: new Date(2000,1,1), //esto es porque es necesario para que nos deje emitir
      estadoCivil: '',
      celular: '',
      email: '',
      ocupacion: 0,
      genero: 2,
      estadoCivilId: 0,
      edad: 0
    };

    const otrosDatos = {
        localCurrency: 'BS',
        objectDefinitionCode: "DT_INCENDIO_V3"
    };
          
    let dto = {
      polCerti: null,
      asegurado: datosAsegurado,
      poliza: datosPoliza,
      otrosDatos: otrosDatos,
      producto: product,
      datoTecnico: oa
    };

    // 3. Configuramos información proveniente del producto, como coberturas y clausulas.
    configureProduct(dto);
    
    // 4. Validación de Inputs
    log("validando inputs");
    validarInputs(dto);

    // 5. Si no existe el contacto, se agrega. Validacion es por el cnp
    if (isNullOrEmpty(dto.asegurado.contact)) procesarContacto(dto.asegurado);
    
    // 6. Si no existe el certificado por el numero de prestamo, se agrega uno nuevo  
    log("Creando o actualizando póliza");
    if (isNullOrEmpty(dto.polCerti)) 
      addPolicy(dto);

    return { ok: true, msg: `Póliza creada correctamente, No. ${dto.polCerti.id}` };
}
catch (error) {
    const message = error instanceof Error ? `${error.stack.replace(/<anonymous>/g, 'Line')} - ${error.message}` : String(error ?? "Unknown error");
    throw new TypeError(`@${message}`);
}

function getProduct(productCode) {
  doCmd({
    cmd: "RepoProduct",
    data: {
      operation: "GET",
      filter: `code = '${productCode}'`
    }
  });

  const product = RepoProduct.outData[0];
  return product
}

function validarInputs(dto) {
  
  const errors = [];
  const { poliza, asegurado, producto } = dto;
  
  if(isNullOrEmpty(asegurado.cnp))
    errors.push(`La identificación no puede ser vacía.`);
    
  const fechaInicialValida = esFechaValida(poliza.start);
  const fechaFinalValida = esFechaValida(poliza.end);
  
  if (!fechaInicialValida)
    errors.push(`Fecha de inicio de vigencia (${poliza.start}) es inválida, formato válido DD/MM/YYYY.`);

  if (!fechaFinalValida)
    errors.push(`Fecha de fin de vigencia (${poliza.end}) es inválida, formato válido DD/MM/YYYY.`);
      
  if(fechaInicialValida && fechaFinalValida)    
  {
    const rangoValido = esRangoExactamenteUnAnio(poliza.start, poliza.end)
    if(!rangoValido)
      errors.push(`El rango entre la fecha inicial y final debe ser un año.`);
  }

  if(!isValidNumber(poliza.insuredSum)){
    errors.push(`Monto de la suma asegurada no es válido, debe ser numérico y no vacío.`);
  }
        
  ////////////////////////////////////////////////////////////////////////////
  // Asegurado - Validar SIEMPRE campos requeridos para creación potencial
  ////////////////////////////////////////////////////////////////////////////

  if(!isNullOrEmpty(asegurado.cnp)){
    doCmd({ cmd: "DoQuery", data: { sql: `SELECT con.id, con.isPerson, con.cnp FROM Contact con WHERE con.cnp=${formatSqlValue(asegurado.cnp)}` } });
    if (!DoQuery.ok) throw new Error(`Error al obtener contacto. Detalle: ${DoQuery.msg}`);
    if (DoQuery.total > 1) throw new Error(`Contacto duplicado (${DoQuery.total}). CNP: ${asegurado.cnp}`);

    asegurado.contact = DoQuery.total === 1 ? cargaAsegurado(DoQuery.outData.pop().id) : null;
    if(asegurado.contact)
      asegurado.fechaNacimiento = asegurado.contact.birth ?? asegurado.fechaNacimiento;
  }

  if (isNullOrEmpty(asegurado.contact)) {
    if(isNullOrEmpty(asegurado.nombreCompleto))
      errors.push(`Nombre del asegurado no puede ser vacío.`);    
  } 

  if (errors.length > 0) throw new Error(`Validation errors:\n- ${errors.join('\n- ')}`);
}

function procesarContacto(asegurado) {

    //puede que no venga una identificación valida, no creamos al contacto
    if(isNullOrEmpty(asegurado.cnp))
      return;

    const { jsonResult, bindingValues } = getJsonCustomFormsContact(asegurado);

    asegurado.jCutomForms = JSON.parse(jsonResult);
    asegurado.bindingValues = bindingValues;

    const entityPersonContact = {
        name: asegurado.nombres ?? '',
        surname1: asegurado.apellidos ?? '',
        created: new Date().toISOString(),
        cnp: asegurado.cnp,
        notificationChannel: "EMAIL",
        preferedCommunicationMethod: '["EMAIL"]',
        birth: asegurado.fechaNacimiento,
        gender: null,
        maritalStatus: 2,
        isPerson: true,
        phone: '',
        email: '',
        jCustomForms: jsonResult,
        idType: 'CI',
    };

    doCmd({ cmd: "AddOrUpdateContact", operation: "ADD", changeRequest: false, bypass: true, data: entityPersonContact });
    if (!AddOrUpdateContact.ok) throw AddOrUpdateContact.msg;

    asegurado.contact = cargaAsegurado(AddOrUpdateContact.outData.id);
    asegurado.contact.accion = "AGREGADO"
}

function configureProduct(dto) {
  try {

    const { producto, poliza } = dto;
    
    const mandatoryCoverages = producto.Coverages
      .filter(x => x.mandatory === true)
      .map(x => ({
        name: x.name,
        code: x.code,
        basic: x.basic,
        description: x.description,
        mandatory: x.mandatory,
        limit: 0,
        premium: 0,
        deductible: 0,
        insurability: x.insurability,
        commercialName: x.commercialName,
        internalBonus: x.internalBonus ?? false,
        appliesTo: x.appliesTo,
        number: x.number,
        restrictUserEdition: x.restrictUserEdition,
        beneficiaries: x.beneficiaries,
        minLimit: -1,
        maxLimit: -1,
        loading: 0,
        extraPremium: 0,
        internalPremium: 0,
        periodicity: 0,
        ofnCode: 0
      }));
    
    poliza.Coverages = mandatoryCoverages ?? [];

    const selectedClauses = (producto.Clauses || [])
      .filter(x => x.selected === true)
      .map(x => ({
        code: x.code,
        section: x.section,
        text: x.text,
        mandatory: x.mandatory,
        selected: x.selected
      }));

    poliza.Clauses = selectedClauses ?? [];
    
  } catch (error) {
    const message = error instanceof Error ? `${error.stack.replace(/<anonymous>/g, 'Line')} - ${error.message}` : String(error ?? "Unknown error");
    throw new TypeError(`@${message}`);
  }
}

function addPolicy(dto) {
  const { poliza, asegurado, producto } = dto;

  const dto1 = {
    currency: poliza.currency,
    Beneficiaries: [],
    Surcharges: [],
    Exclusions: [],
    Clauses: poliza.Clauses,
    Coinsureds: [],
    policyType: "I",
    indexation: 0,
    segment: poliza.segment,
    lob: poliza.lob,
    productSelect: {
        label: producto.commercial,
        value: poliza.productCode,
        key: poliza.productCode,
        disabled: 0
    },
    channel: poliza.channel,
    branchCode: poliza.branch,
    holderId: asegurado.contact.id,
    payerId: asegurado.contact.id,
    MainInsured: {
        id: 0,
        contactId: asegurado.contact.id,
        name: asegurado.nombreCompleto,
        relationship: 0,
        Contact: asegurado.contact,
        lifePolicyId: 0,
        role: 0
    },
    insuredSum: poliza.insuredSum,
    start: poliza.start,
    end: poliza.end,
    durationMonths: 0,
    durationDays: 0,
    coinsurance: 0,
    groupCoverageType: "DIFFERENT",
    paymentDuration: 0,
    periodicity: 'm',
    installmentSchemeId: null,
    receiptTypeCode: "1",
    masterCode: poliza.productCode,
    version: 1,
    commercial: producto.commercial,
    duration: 1,
    option: 1,
    indexationPeriod: 1,
    indexationStart: 1,
    indexationFrequency: 1,
    productCode:poliza.productCode,
    Coverages: poliza.Coverages ?? [],
    Insureds: [
        {
          id: 0,
          contactId: asegurado.contact.id,
          name: asegurado.nombreCompleto,
          relationship: 0,
          Contact: asegurado.contact,
          lifePolicyId: 0,
          role: 0
      }
    ]
  };

  const dataDTO = {    
      entity: dto1,
      bulkJson: null,
      filter: null,
      include: null,
      size: 0,
      page: 0,
      noUi: false,
      noTracking: false,
      operation: "ADD"
    }

  doCmd({ cmd: "RepoLifePolicy", data: dataDTO });

  if (!RepoLifePolicy.ok) throw new Error(`Error creando póliza. Detalles: ${RepoLifePolicy.msg}`);
  dto.polCerti = RepoLifePolicy.outData.pop();
    
  // Agrega el DT
  addDatoTecnico(dto);

  EstablecePasoSiguiente(dto, "DRAFT");

  QuotePolicy(dto);
  
  IssuePolicy(dto);
  EstablecePasoSiguiente(dto, "ACTIVE");

}

function EstablecePasoSiguiente(dto, step) {
  doCmd({
    cmd: "GotoStep",
    data: {
      procesoId: dto.polCerti.processId,
      estado: step
    }
  });

  if (!GotoStep.ok) throw new Error(`Póliza creada no: ${dto.polCerti.id}, error en flujo, detalles: ${GotoStep.msg}`);
}

function addDatoTecnico(dto) {
    const { asegurado, polCerti, otrosDatos, datoTecnico } = dto;
    doCmd({ cmd: 'RepoObjectDefinition', data: { operation: 'GET', filter: `code='${otrosDatos.objectDefinitionCode}'`, include: ['Form'] } });  
    const [ObjectDefinition] = RepoObjectDefinition.outData, { Form } = ObjectDefinition;
    const customForm = JSON.parse(Form.json)
    
    Object.keys(datoTecnico).forEach(key => {
        let index = customForm.findIndex(input => input.name == key);
        if (index >= 0) customForm[index].userData = [datoTecnico[key]];
    });

    const sqlCmd = `INSERT INTO InsuredObject (objectDefinitionId, lifePolicyId, jValues) VALUES (${ObjectDefinition.id}, ${polCerti.id}, '${JSON.stringify(customForm)}')`;
    doCmd({ cmd: 'DoQuery', data: { sql: sqlCmd } });
    if (!DoQuery.ok) throw new Error(`Error al agregar el objeto asegurado. Details: ${DoQuery.msg}`);
}

function QuotePolicy(dto) {
  //Tarificamos la oferta
  doCmd({
    cmd: "QuotePolicy",
    data: {
      policyId: dto.polCerti.id,
      dbMode: true,
      save: true,
    }
  });

  if (!QuotePolicy.ok) throw new Error(`Póliza creada no: ${dto.polCerti.id}, pero error en tarificación, detalles: ${QuotePolicy.msg}`);
}

function IssuePolicy(dto) {
   doCmd({
     cmd: 'IssuePolicy',
     data: {
       policyId: dto.polCerti.id,
       state: 'ACTIVE' 
     }
   });
  
  if (!IssuePolicy.ok) throw new Error(`No se confirmo la póliza.: ${pol.id}, Detalle: ${IssuePolicy.msg}`);
}

function cargaAsegurado(contactId) {
    doCmd({ cmd: "GetContacts", data: { filter: `id=${contactId}` } });
    return GetContacts.total === 0 ? null : GetContacts.outData[0];
}

function getJsonCustomFormsContact(asegurado) {
  
    let customContactFormList = [
        { id: 606, name: 'Información adicional' },
        { id: 609, name: 'Información de Compañías' },
        { id: 576, name: 'Información PEP' },
        { id: 608, name: 'Lista Gris' },
        { id: 611, name: 'Consorcios' },        
        { id: 622, name: 'Grupo Económico' },
        { id: 644, name: 'Datos Bancarios Institucionales' }
    ];

    let ids = customContactFormList.map(item => item.id).join(',');

    doCmd({ cmd: 'GetForms', data: { filter: `id in (${ids})` } });
    if (!GetForms.ok) throw GetForms.msg;

    const bindingValues = getDtoBindCustomFormContact(asegurado);
    const resultQueryForm = GetForms.outData;
    let jsonCustomFormat = {};

    for (const element of customContactFormList) {
        const currentForm = resultQueryForm.find(item => item.id === element.id);
        if (!currentForm) continue;

        const customForm = JSON.parse(currentForm.json);

        Object.keys(bindingValues).forEach(key => {
            let index = customForm.findIndex(input => input.name === key);
            if (index >= 0 && !!bindingValues[key]) {
                customForm[index].userData = [bindingValues[key]];
            }
        });

        jsonCustomFormat[element.name] = JSON.stringify(customForm);
    }
    const jsonResult = JSON.stringify(jsonCustomFormat);
    return { jsonResult, bindingValues };
}

function getDtoBindCustomFormContact(asegurado) {
    return {
        NombreApellidoCompleto: `${asegurado.nombre} ${asegurado.apellido}`,
        NombreCorto: `${asegurado.nombre}`,
        NombresPropietario: asegurado.nombre,
        ApellidoPaterno: asegurado.apellido,
        DocumentoIdentificacionUnipersonal: asegurado.cnp,
        TipoDocumentoUnipersonal: 'CI',
        ExtensionCIProveedorPN: asegurado.extencionCi,
        CIComplementoProveedorPN: asegurado.complementoCi,
        ApellidoCasada: asegurado.apellidoCasada ?? ""        
    };
}

function loadDataTable(tableName, positionA, postionB) {
    doCmd({ cmd: 'GetFullTable', data: { table: tableName } });
    if (!GetFullTable.ok) throw GetFullTable.msg;

    const reference = GetFullTable.outData.slice(1).map(function (item) {
        return {
            code: item[positionA],
            value: item[postionB]
        }
    });
    return reference;
}

///////////////////////////////////////////////////////////////////////////
// Auxiliares para procesar información
///////////////////////////////////////////////////////////////////////////  

function obtenerNombresYApellidos(texto) {
  if (!texto || typeof texto !== "string") {
    return {
      nombres: "",
      apellidos: ""
    };
  }

  const partes = texto
    .trim()
    .replace(/\s+/g, " ")
    .split(" ");

  const n = partes.length;

  let nombre1 = "";
  let nombre2 = "";
  let apellido1 = "";
  let apellido2 = "";

  if (n === 1) {
    apellido1 = partes[0];
  } else if (n === 2) {
    nombre1 = partes[0];
    apellido1 = partes[1];
  } else if (n === 3) {
    nombre1 = partes[0];
    apellido1 = partes[1];
    apellido2 = partes[2];
  } else {
    nombre1 = partes[0];
    nombre2 = partes.slice(1, n - 2).join(" ");
    apellido1 = partes[n - 2];
    apellido2 = partes[n - 1];
  }

  return {
    nombres: [nombre1, nombre2].filter(Boolean).join(" "),
    apellidos: [apellido1, apellido2].filter(Boolean).join(" ")
  };
}

function unirApellidos(ap1, ap2) {
  return [ap1, ap2]
    .map(v => (v ?? "").toString().trim())
    .filter(v => v.length > 0)
    .join(" ");
}

function unirTextos(ap1, ap2) {
  return [ap1, ap2]
    .map(v => (v ?? "").toString().trim())
    .filter(v => v.length > 0)
    .join(" ");
}

function convertirDias(total, tipoPlazoCredito) {
    const diasPorAnio = 365;
    const diasPorMes = 30;

    let anios = 0;
    let meses = 0;
    let dias = 0;

    if (tipoPlazoCredito === "Dias") {
        // total = días reales
        anios = Math.floor(total / diasPorAnio);
        const restoDias = total % diasPorAnio;
        meses = Math.floor(restoDias / diasPorMes);
        dias = restoDias % diasPorMes;
    }

    if (tipoPlazoCredito === "Meses") {
        // total = cantidad de meses
        anios = Math.floor(total / 12);
        meses = total % 12;
        dias = 0;
    }

    return { anios, meses, dias };
}

function formatearFecha(valor) {
  if (!valor) return null;

  let y, m, d;

  // Date
  if (valor instanceof Date && !isNaN(valor)) {
    y = valor.getUTCFullYear();
    m = valor.getUTCMonth() + 1;
    d = valor.getUTCDate();
  }

  // Timestamp (milisegundos)
  else if (!isNaN(valor) && String(valor).length >= 8) {
    const f = new Date(Number(valor));
    if (isNaN(f)) return null;
    y = f.getUTCFullYear();
    m = f.getUTCMonth() + 1;
    d = f.getUTCDate();
  }

  // String
  else if (typeof valor === "string") {
    const v = valor.trim();

    // yyyy-MM-dd o yyyy/MM/dd
    let match = v.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
    if (match) {
      y = Number(match[1]);
      m = Number(match[2]);
      d = Number(match[3]);
    }

    // dd/MM/yyyy o dd-MM-yyyy
    if (!match) {
      match = v.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
      if (match) {
        d = Number(match[1]);
        m = Number(match[2]);
        y = Number(match[3]);
      }
    }

    if (!y || !m || !d) return null;
  }

  else return null;

  // Validación real de calendario en UTC
  const fechaUTC = new Date(Date.UTC(y, m - 1, d));

  if (
    fechaUTC.getUTCFullYear() !== y ||
    fechaUTC.getUTCMonth() + 1 !== m ||
    fechaUTC.getUTCDate() !== d
  ) return null;

  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");

  // ISO 8601 (solo fecha)
  return `${y}-${mm}-${dd}`;
}

function sumarUnMes(fechaStr) {

  if (!esFechaValida(fechaStr)) return null;

  const [anio, mes, dia] = fechaStr.split("-").map(Number);

  // Fecha base en UTC
  const fechaBase = new Date(Date.UTC(anio, mes - 1, dia));

  // Calcular nuevo mes/año
  let nuevoAnio = anio;
  let nuevoMes = mes;

  if (mes === 12) {
    nuevoMes = 1;
    nuevoAnio += 1;
  } else {
    nuevoMes += 1;
  }

  // Obtener último día del nuevo mes
  const ultimoDiaNuevoMes = new Date(Date.UTC(nuevoAnio, nuevoMes, 0)).getUTCDate();

  // Ajustar día si el original no existe en el nuevo mes
  const nuevoDia = Math.min(dia, ultimoDiaNuevoMes);

  const nuevaFecha = new Date(Date.UTC(nuevoAnio, nuevoMes - 1, nuevoDia));

  const y = nuevaFecha.getUTCFullYear();
  const m = String(nuevaFecha.getUTCMonth() + 1).padStart(2, "0");
  const d = String(nuevaFecha.getUTCDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function formatSISDate(fechaStr) {

  if (!esFechaValida(fechaStr)) return null;

  const [anio, mes, dia] = fechaStr.split("-").map(Number);

  // Crear fecha en UTC a las 12:00:00
  const fechaUTC = new Date(Date.UTC(anio, mes - 1, dia, 12, 0, 0));

  return fechaUTC.toISOString().replace(".000", "");
}

function formatN2(value) {
    if (value === null || value === undefined) return "0.00";

    // Normalizar a número
    let num;
    if (typeof value === "number") {
        num = value;
    } else if (typeof value === "string") {
        const cleaned = value.trim().replace(/,/g, "");
        num = Number(cleaned);
    }

    if (!Number.isFinite(num)) return "0.00";

    // Redondear a 2 decimales
    const fixed = Math.round(num * 100) / 100;

    // Separar entero y decimal
    let [integerPart, decimalPart] = fixed.toFixed(2).split(".");

    // Agregar separador de miles
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return `${integerPart}.${decimalPart}`;
}

///////////////////////////////////////////////////////////////////////////
// Auxiliares para catálogos
///////////////////////////////////////////////////////////////////////////  

function dameZonaRiesgo(paisId, provinciaId) {
  doCmd({"cmd":"LoadEntity","data":{ "entity":"StateCatalog", fields: "riskZone", "filter": `countryCode = '${paisId}' and code = '${provinciaId}'`}});
  return LoadEntity.outData?.riskZone ?? "0";
}

function dameDescripcionEdificio(pais, provincia, distrito, corregimiento, edificio) {
  const query = ` SELECT
    	JSON_VALUE(data.[value],'$[4]') codigo,
    	JSON_VALUE(data.[value],'$[5]') descripcion
    FROM [Table] t
    CROSS APPLY OPENJSON(t.data) data
    WHERE t.[name] = 'Edificios'
    AND JSON_VALUE(data.[value],'$[0]') = '${pais}'
    AND JSON_VALUE(data.[value],'$[1]') = '${provincia}'
    AND JSON_VALUE(data.[value],'$[2]') = '${distrito}'
    AND JSON_VALUE(data.[value],'$[3]') = '${corregimiento}'
    AND JSON_VALUE(data.[value],'$[4]') = '${edificio}'
  `

  doCmd({cmd: "DoQuery", data: { sql: query }});
  const nombreEdificio = DoQuery.outData?.[0]?.descripcion ?? edificio;
  return nombreEdificio;
  
}

///////////////////////////////////////////////////////////////////////////
// Auxiliares para validaciones
///////////////////////////////////////////////////////////////////////////  

function esRangoExactamenteUnAnio(fechaInicioStr, fechaFinStr) {

  // Validar formato ISO yyyy-MM-dd
  if (!esFechaValida(fechaInicioStr) || !esFechaValida(fechaFinStr)) {
    return false;
  }

  const [y1, m1, d1] = fechaInicioStr.split("-").map(Number);
  const [y2, m2, d2] = fechaFinStr.split("-").map(Number);

  // Crear fechas en UTC (consistencia total)
  const fechaInicioUTC = new Date(Date.UTC(y1, m1 - 1, d1));
  const fechaFinUTC = new Date(Date.UTC(y2, m2 - 1, d2));

  // Fecha esperada: exactamente 1 año después
  const fechaEsperadaFinUTC = new Date(Date.UTC(y1 + 1, m1 - 1, d1));

  return (
    fechaFinUTC.getUTCFullYear() === fechaEsperadaFinUTC.getUTCFullYear() &&
    fechaFinUTC.getUTCMonth() === fechaEsperadaFinUTC.getUTCMonth() &&
    fechaFinUTC.getUTCDate() === fechaEsperadaFinUTC.getUTCDate()
  );
}
 
function isNullOrEmpty(value) {
  return (
      value == null ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0) ||
      (value?.constructor === Object && Object.keys(value).length === 0)
  );
}

function isValidNumber (value) {
    if (value === null || value === undefined) return false;

    // Si ya es número
    if (typeof value === 'number') {
        return Number.isFinite(value);
    }

    // Si es string
    if (typeof value === 'string') {
        const str = value.trim();

        if (str === '') return false;

        // Elimina separadores de miles (comas)
        const normalized = str.replace(/,/g, '');

        const num = Number(normalized);

        return Number.isFinite(num);
    }

    return false;
}

function esFechaValida(fechaTexto) {

  if (typeof fechaTexto !== "string") return false;

  // Formato exacto yyyy-MM-dd
  const regex = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
  const match = fechaTexto.match(regex);
  if (!match) return false;

  const anio = Number(match[1]);
  const mes  = Number(match[2]);
  const dia  = Number(match[3]);

  // Crear fecha en UTC (consistente con tu función anterior)
  const fechaUTC = new Date(Date.UTC(anio, mes - 1, dia));

  // Validación real de calendario
  return (
    fechaUTC.getUTCFullYear() === anio &&
    fechaUTC.getUTCMonth() + 1 === mes &&
    fechaUTC.getUTCDate() === dia
  );
}

function formatSqlValue(value) {
    if (value === null || value === undefined) return "NULL";

    if (typeof value === 'string') {
        if (value.indexOf("*$") === 0) return value.substring(2);
        if (value.indexOf("*N") === 0) return value.substring(1);
        if (value.charAt(0) === '*') return value.substring(1);
        return "'" + value.replace(/'/g, "''") + "'";
    }

    if (typeof value === 'boolean') return value ? '1' : '0';
    if (typeof value === 'number') return value.toString();

    return `'${String(value).replace(/'/g, "''")}'`;
}

/*
test:
row:
  productCode: "1_10"
  start: "01/04/2026"
  end: "01/04/2027"
  insuredSum: 10000
  nombreCompleto: "MICHAEL ANTONIO DELGADO CASTRO"
  cnp: "123456778"
  tipoObjeto: "EDIFICIO"  
  tipoActividad: "0-VIVIENDAS"
  usoBien: "1"
  tipoMaterial: "CONCRETO_REF"
  descripcion: "test"
  pais: "591"
  provincia: "8"
  distrito: "808"
  corregimiento: "80809"
  barriada: "0"
  edificio: "8080816"
batchId: 100 
  
*/