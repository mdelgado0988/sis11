//block
/**
 * 
 * @Author: Axxis
 * @Email: axxis@axxis.com
 * @Created: 2025-10-10
 * @Purpose: Validación del campo de fecha de nacimiento de contactos, permitiendo que los contactos que no son personas físicas puedan tener cualquier fecha.
 * @Command: cmdValidationBirth
 * @returns: cb() si es válido, cb('mensaje') si no es válido
 */

(r, v, cb) => {
  	//debugger;

    const { isPerson, Roles: rolesList = [] } = contactForm.getFieldsValue();
    const tieneRol = (rol) => rolesList.some(x => x.role === rol);        
    const esGEC = tieneRol("GEC");

    const esGrupoEconomico = esGEC && !isPerson;
  
    if(esGrupoEconomico)
      return cb();
  
    const resultado = new Date() > new Date(v);
    return resultado ? cb() : cb("Fecha inválida")
}