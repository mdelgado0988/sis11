//block
//noreplace
/*
simulador: {correo : mbatres@axxis-systems.com}
*/

try {
  let bok = true;
  //let code = "";
  let msg = "";

  function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
  
  /*Aquí empieza el llamado al Api de Abstract Api*/
  //return {ok: bok, msg: msg};  

  /*Valido la caché del token de la validación del correo de Global*/
  /*
  const cache_access_token_name = "GLOBALBANK_EMAILVALIDATION_TOKEN";
  let cache_access_token = doCmd('getCache', { key: cache_access_token_name });  
  return cache_access_token;  
  return  
  
  // 1. Intentar obtener el token de la caché de SISos
  let token = doCmd('getCache', { key: cacheKey });
  */
  
  const apiData = readJsonValue(getKey("GlobalBank_EmailValidation_Auth"));
  const MiCorreo = String(context?.correo ?? "").trim();

  if (!MiCorreo || MiCorreo.trim() === "") {
    return {ok: bok, msg: msg};  // Si el correo está vacío se toma como válido.
  } 
  
  let miUrl = apiData.url + "grant_type=" + apiData.grant_type + "&client_id=" + apiData.client_id + "&client_secret=" + apiData.client_secret + "&scope=" + apiData.scope;    
  doCmd({cmd: "DoRequest", data: {url: miUrl, verb: apiData.verb, headers:{"Cache-Control": apiData.CacheControl, "Host": apiData.Host, "Content-Length": apiData.ContentLength}}});  
  
  const authResponse = readJsonValue(DoRequest?.outData);
  const access_token = String(authResponse?.access_token ?? "").trim();
  const token_type = String(authResponse?.token_type ?? "").trim();

  if (!access_token || !token_type) {
    return { ok: false, msg: "No fue posible obtener el token de validación del correo" };
  }
  
  const apiData2 = readJsonValue(getKey("GlobalBank_EmailValidation"));

  let miUrl2 = apiData2.url + "email=" + MiCorreo
  
  const sisosRequestId =  generateUUID();  
  doCmd({cmd: "DoRequest", data: {url: miUrl2, verb: apiData2.verb,
                                 headers:{"Authorization": token_type + " " + access_token , "Accept-Language": apiData2.AcceptLanguage, "Application": apiData2.Application, 
                                          "ClientIpAddress": apiData2.ClientIpAddress, "Message-Id": sisosRequestId, "arcToken": apiData2.arcToken, "arcUser": apiData2.arcUser, 
                                          "Content-Type": apiData2.ContentType, "Accept": apiData2.Accept, "Cache-Control": apiData2.CacheControl, "Host": apiData2.Host,
                                         "Accept-Encoding": apiData2.AcceptEncoding, Connection: apiData2.Connection}
                                 }});  
  
  const respuesta = readJsonValue(DoRequest?.outData);  
  //return respuesta;
  if (respuesta.success == true){
    //code = respuesta.status === "valid" ? "" : "-1";
    bok = respuesta.status === "valid" ? true : false;
    msg = respuesta.status === "valid" ? "" : `El correo ${MiCorreo} no es válido`;
  }
  else
  {
    bok = false;
    msg = `Hubo un problema con la validación del correo ${MiCorreo}`;
  }
  
  return {ok: bok, msg: msg};  
  
} catch (error) {
    return {ok: false, msg: error};
}  

function readJsonValue(value) {
  if (value == null) {
    return {};
  }

  if (typeof value === "object") {
    return value;
  }

  const text = String(value).trim();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return {};
  }
}
