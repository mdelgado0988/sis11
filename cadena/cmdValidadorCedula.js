//block

/*
    Michael Delgado
    2025.11.10.
    Validación de cédula según tipo de identificación seleccionado.
    Command: cmdValidadorCedula
*/
(r,v,cb)=>{
    //Validar cedula
    function isValid(str) {
       try{

          var typeId = getIdType();
          var regexCode = getRegexByCode(typeId);
          if (regexCode == null)
            return true;
        
          var regex = new RegExp(regexCode);
        
  		if (!regex.test(str)) {
  			console.log('PASO FALSE');
  			return false;
  		}
        
         return true;
           
       } catch(ex) { 
         console.warn(ex); 
         return false; 
       }
    }
    
    /*
      ------------------------------------------------------
      AXXIS: Michael Delgado. 
      2025.11.10. 
      Función para retornar tipo de documento seleccionado, se usará para validar la máscara del tipo de documento.
      ------------------------------------------------------
    */
    function getIdType() {
      var vForm = contactForm.getFieldsValue();
      console.log(vForm);
      return vForm.idType ?? "";
    }

    function getRegexByCode(code) {
      const regexMap = {
        "AV": /^(\d{2}-AV-\d{4}-\d{5})$/,
        "C": /^(\d{2}-\d{4}-\d{5})$/,
        "CI": /^(\d{9})$/,
        "CO": /^(\d{5})$/,
        "E": /^(E -\d{4}-\d{5})$/,
        "E1": /^(E -\d{4}-\d{6})$/,
        "N": /^(N -\d{4}-\d{5})$/,
        "P": /^([A-Za-z0-9]{0,13})$/,          // aaaaaaaaaaaaa (13 letras)
        "PE": /^(PE-\d{4}-\d{5})$/,
        "PI": /^(\d{2}-PI-\d{4}-\d{5})$/,
        "R": /^(\d{7}-\d{4}-\d{6})$/,
        "R2": /^(\d{9}-\d{1}-\d{4})$/,
        "R3": /^(\d{9}-\d{1}-\d{4})$/,
        "RN": /^(\d{7}-\d{7})$/,
        "RU": /^(\d{6}-\d{6}-\d{4})$/,
        "SC": /^(\d{11})$/,
        "SE": /^([A-Za-z0-9]{1,13})$/,
        "SP": /^(\d{11})$/,
        "NT": /^\d{2}-NT-\d{5}-\d{8}$/
      };
    
      return regexMap[code] || null;
    }

    const maskMap = new Map([
      ["AV", "##-AV-####-#####"],
      ["C", "##-####-#####"],
      ["CI", "#########"],
      ["CO", "#####"],
      ["E", "E -####-#####"],
      ["E1", "E -####-######"],
      ["N", "N -####-#####"],
      ["P", "*************"],
      ["PE", "PE-####-#####"],
      ["PI", "##-PI-####-#####"],
      ["R", "#######-####-######"],
      ["R2", "#########-#-####"],
      ["R3", "#########-#-####"],
      ["RN", "#######-#######"],
      ["RU", "######-######-####"],
      ["SC", "###########"],
      ["SE", "*************"],
      ["SP", "###########"],
      ["NT", "##-NT-#####-########"]
    ]);
  
    function getMaskByCode(code) {
      return maskMap.get(code) || "";
    }

    //------------------------------------------------------
    //------------------------------------------------------

    try {
      
    	console.log('Validación cédula: ' + v);
    
    	if ($("#errorCNP").length > 0)
    		$("#errorCNP").remove();
              
        const resultado=isValid(v);
        console.log('Resultado Validación, cédula : ' + resultado);

        var typeId = getIdType();
        var maskConfig = getMaskByCode(typeId);      
         
        return resultado?cb():cb("Formato de identificación inválido. Ejemplo: " + maskConfig);
            
    }
    catch (ex1) {
      console.warn(ex1); 
      return cb('Formato de identificación inválido');
    }
}