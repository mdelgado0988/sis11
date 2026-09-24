//block
/*********************************************************************************************************************************************************\
|* Name: cmdGetModalPremiumCoverageInstallment                                                                                                           *|
|* Author: Felix Ramirez                                                                                                                                 *|
|* Description: This command calculates the modal premium of the coverage for the installments of the payment agreement.                                 *|
|* Categpry: Installment                                                                                                                                 *|
|* Version: 1.3                                                                                                                                          *|
|* Created Date: 21-04-2023                                                                                                                              *|
|* param                                                                                                                                                 *|
|*   policyId                                                                                                                                            *|
|* Modified by: @Felix Ramirez (30-08-2023): Manually added the premium from parameter if the parameter is not given use the premium from the query.     *|
|*              @Daniel Berríos (11-02-2026): Se agrega parametro frecuencia, puesto que en un endoso no viene la info actual.                           *|
|*              @Daniel Berríos (18-02-2026): Se realiza ajustes de la frecuencia, se agrega metodo para saber cantidad de cuotas segun frecuencia.      *|
|* Migrated:                                                                                                                                             *|
|*              @Daniel Berríos (17-02-2026): DEV -> UAT  Version 1.2                                                                                    *|
|*              @Daniel Berríos (20-02-2026): DEV -> UAT  Version 1.3                                                                                    *|
\*********************************************************************************************************************************************************/
//Funciones auxiliares
const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;
const getModalPremium = (frequency, annualPremium) => {
    if (!frequency || !annualPremium) return 0;
  
    const period = frequency;
    let newModalPremium;
  
    if (period == "m") {
      const months = frequency.length == 1 ? 1 : frequency.substring(1);
      newModalPremium = round2(annualPremium / (12 / months));
    }
    if (period == "q") {
      const months = frequency.length == 1 ? 3 : frequency.substring(1);
      newModalPremium = round2(annualPremium / (12 / months));
    }
    if (period == "s") {
      const months = frequency.length == 1 ? 6 : frequency.substring(1);
      newModalPremium = round2(annualPremium / (12 / months));
    }
    if (period == "m2") {
      const months = frequency.length == 1 ? 2 : frequency.substring(1);
      newModalPremium = round2(annualPremium / (12 / months));
    }
    if (period == "y" || period == "m12") {
      let years = frequency.length == 1 ? 1 : frequency.substring(1);
      if(period == "m12") 
        years = 1;
      newModalPremium = round2(annualPremium / (1 / years));
    }
    return newModalPremium;
};

const getCountQuota = (frequency) => {
    if (!frequency) return 0;
  
    const period = frequency;
    let newModalPremium;
  
    if (period == "m") {
      return 12;
    }
    if (period == "q") {
      return 4;
    }
    if (period == "s") {
      return 2;
    }
    if (period == "m2") {
      return 6;
    }
    if (period == "y" || period == "m12") {
      return 1;
    }
};

doCmd({
    cmd: "RepoLifePolicy",
    data: {
        noTracking: true,
        operation: "GET",
        filter: `id = ${_policyId}`,
        include: ['Holder','Insureds','Coverages']
    }
})
const policy = RepoLifePolicy.outData && RepoLifePolicy.outData.length > 0 ? RepoLifePolicy.outData[0] : {};

let premium = 0;
policy.Coverages.forEach(element => {
    premium += element.premium;
});
//annualTotal
let modalPremium =  getModalPremium(_frequency, _anualPremium ? _anualPremium : premium);
if (_isPremiumFactor!= null && _isPremiumFactor){
  let anualPremiumF =  modalPremium * getCountQuota(_frequency);  
  let factor = (_anualPremium ? _anualPremium : premium) - anualPremiumF;
  modalPremium = modalPremium + factor;
}
return modalPremium;