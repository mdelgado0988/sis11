//block
//noreplace
/**
 * 
 * @Author: Michael Delgado
 * @Email: michael.delgado@axxis.com
 * @Created: 2025-10-10
 * @Purpose: Validar campos requeridos según rol seleccionado.
 * @Command: cmdValidateContactFilter
 * */
 
let filter = context.filtros?.filter;

const regexMap = {
    AV: /\d{2}-AV-\d{4}-\d{5}/,
    C: /\d{2}-\d{4}-\d{5}/,
    CI: /\d{9}/,
    CO: /\d{5}/,
    E: /E -\d{4}-\d{5}/,
    E1: /E -\d{4}-\d{6}/,
    N: /N -\d{4}-\d{5}/,
    PE: /PE-\d{4}-\d{5}/,
    PI: /\d{2}-PI-\d{4}-\d{5}/,
    R: /\d{7}-\d{4}-\d{6}/,
    R2: /\d{9}-\d-\d{4}/,
    R3: /\d{9}-\d-\d{4}/,
    RN: /\d{7}-\d{7}/,
    RU: /\d{6}-\d{6}-\d{4}/,
    SC: /\d{11}/,
    SP: /\d{11}/,
    NT: /\d{2}-NT-\d{5}-\d{8}/
};

try{
  
  //doCmd({cmd: "GetPing", data: { filter: filter }});
  if(!filter)
    return { ok: true, msg: "Nada que filtrar", filter: filter }
  
  const documento = extraerDocumento(filter);
  if(documento?.valor){
    const existeIdentificacion = obtenerBusquedaCnp(filter, regexMap);
    if(!existeIdentificacion){
      filter = agregarFiltroCnp(filter, documento.valor);
    }
  }
  
  return { ok: true, msg: "Filtro sobreescrito", filter: filter }

}catch(error){
  return { ok: false, msg: error.toString(), filter: filter }
}
  
function extraerDocumento(filtro) {
    for (const [tipo, regex] of Object.entries(regexMap)) {
        const match = filtro.match(regex);
        if (match) {
            return {
                tipo,
                valor: match[0]
            };
        }
    }
    return null;
}

function obtenerBusquedaCnp(filtro, regexMap = {}) {

    if (!filtro || typeof filtro !== "string") {
        return null;
    }

    // Normaliza espacios, tabs y saltos de línea
    const filtroNormalizado = filtro.replace(/\s+/g, " ");

    // Detecta:
    // cnp like N'%valor%'
    // [cnp] like N'%valor%'
    // tabla.cnp like N'%valor%'
    const match = filtroNormalizado.match(
        /(?:\[\s*cnp\s*\]|(?:\w+\.)?cnp)\s*like\s*N?\s*'%(.*?)%'/i
    );

    if (!match) {
        return null;
    }

    const valor = match[1].trim();

    // Si no se proporcionó regexMap, retorna el valor encontrado
    if (!regexMap || Object.keys(regexMap).length === 0) {
        return {
            campo: "cnp",
            valor
        };
    }

    // Determina el tipo de documento
    for (const [tipo, regex] of Object.entries(regexMap)) {
        if (regex.test(valor)) {
            return {
                campo: "cnp",
                tipo,
                valor
            };
        }
    }

    // Encontró búsqueda en cnp pero no coincide con ningún formato
    return {
        campo: "cnp",
        tipo: null,
        valor
    };
}

function agregarFiltroCnp(filtro, valorCnp) {

    if (!filtro || !valorCnp) {
        return filtro;
    }

    const filtroNormalizado = filtro.replace(/\s+/g, " ");

    // Detecta:
    // cnp like ...
    // cnp = ...
    // [cnp] like ...
    // tabla.cnp = ...
    const existeFiltroCnp =
        /(?:\[\s*cnp\s*\]|(?:\w+\.)?cnp)\s*(?:like|=)/i
            .test(filtroNormalizado);

    if (existeFiltroCnp) {
        return filtro;
    }

    return filtro
        ? `(${filtro}) OR (cnp = '${valorCnp}')`
        : `(cnp = '${valorCnp}')`;
}