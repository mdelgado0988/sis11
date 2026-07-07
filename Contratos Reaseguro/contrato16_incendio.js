//block
//doCmd({cmd: "GetPing", data: {contexto: JSON.stringify(context)}});
const n2 = value => Number(Number(value || 0).toFixed(2));

const resultado = doCmd({cmd:'ExeChain',data:{chain:'cmdCalCumuloEdificios',context:JSON.stringify({policyId:_pol.id,fDesde:_pol.start,currency:_pol.currency,lob:_pol.lob,contractId:16})}}).outData;

resultado.primaTecnica = Math.round((context.cov.premium * 0.9) * 100) / 100;
const resto = resultado.resto;
resultado.suma = context.cov.limit;      
resultado.prima = context.cov.premium;
resultado.sumaDistribuye = Math.min(resultado.suma, resto);
resultado.proporcionDistribuye = (resultado.sumaDistribuye / resultado.suma);
resultado.primaDistribuye = n2(resultado.proporcionDistribuye * resultado.primaTecnica);
resultado.re = n2(resultado.sumaDistribuye * 0.65);
//n2(resultado.sumaDistribuye * 0.35);
resultado.ced = n2(resultado.sumaDistribuye - resultado.re);      

//calculso finales
resultado.cedantPremium = n2(resultado.primaDistribuye * 0.35);
resultado.reinsurerPremium = n2(resultado.primaDistribuye - (resultado.cedantPremium));

resultado.sumaFac = n2(resultado.suma - resultado.sumaDistribuye);
resultado.primaFac = n2(resultado.primaTecnica - (resultado.cedantPremium + resultado.reinsurerPremium));

//doCmd({cmd: "GetPing", data: {resultado: resultado}});

return resultado