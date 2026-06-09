 /*
  -------------------------------------------------------
  Michael Delgado.
  2025.11.10. GLOB-30
  Asignación dinámica del pattern al control de identificación
*/

(r, value, cb) => {

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
    "SE": /^([A-Za-z]{1,13})$/,
    "SP": /^(\d{11})$/,
    "NT": /^\d{2}-NT-\d{5}-\d{8}$/
  };

  // --- Función que asigna el pattern al input cnp ---
  function setPatternByIdType(selectedIdType) {
    try{
     
      //debugger;
      const pattern = regexMap[selectedIdType] || "";    
      console.log("Pattern asignado para", selectedIdType, ":", pattern);
  
      var ipersona = contactForm.getFieldValue('isPerson');
      if (ipersona){
  
        Inputmask({ regex: pattern.source, placeholder: "_" , "oncomplete": function(v){  
            //debugger;
            contactForm.setFieldsValue({ cnp: $("#cnp").val() })
           }}).mask("#cnp");
  
        // Texto a validar
        const texto = $("#cnp").val();
        
        // Validación
        if (pattern?.test && !pattern.test(texto)) {
            contactForm.setFieldsValue({ cnp: "" });
        }
              
        $("#nif").inputmask("remove");
        validaTipoDocumento();
        
      }    
      else {
  
        Inputmask({ regex: pattern.source, placeholder: "_" , "oncomplete": function(v){  
            //debugger;
            contactForm.setFieldsValue({ nif: $("#nif").val() })
           }}).mask("#nif");
  
        // Texto a validar
        const texto = $("#nif").val();
        
        // Validación
        if (pattern?.test && !pattern.test(texto)) {
            contactForm.setFieldsValue({ nif: "" });
        }
        
      }   

    }
    catch(error)
    {
      console.warn(error) 
    }
  }

  function validaTipoDocumento() {
    try {

      //debugger;
      const $cnp = $("#cnp");
      const { idType } = contactForm.getFieldsValue();
        
      //oculto NIF según sea el tipo de persona
      if(idType?.trim()){
        $cnp
          .css("pointer-events", "")
          .css("background-color", "");
      }
      else{        
        $cnp
          .css("pointer-events", "none")
          .css("background-color", "#f5f5f5");
      }
      
    } catch (error) {
      console.log("Error validando identificación");
    }
  }
  
  setPatternByIdType(value);
  
  return cb();
  
}