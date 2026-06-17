//block
//noreplace

/*
  *@name: cmdGetCancellationPremium
  *@Purpose: Obtiene el monto de la prima a cancelar validando impuestos, devengo, pagos ,etc
  *@Autor: Michael Delgado
  *@Email: michael.delgado@axxis-systems.com
  *@Created: 21/05/2026
  *@Input: {_pol, _paid, totalDays}
  *@Output: { resultado }
*/

//doCmd({cmd: "GetPing", data: { contexto: JSON.stringify(context) }});

let { pol, paid, totalDays, pastDays } = context;

if(pastDays < 0)
    pastDays = 0;

const n2 = (value) => Number(value.toFixed(2));    
const totalDiaro = n2(totalDays == 0 ? 0 : (pol.annualTotal / totalDays));
const primaDevengada = n2(totalDiaro * pastDays);
const totalACancelar = n2(primaDevengada - paid);

//impuestos, calculamos para ajustar en la prima.
const porcImp = pol.annualTotal == 0 ? 0 : (pol.tax / pol.annualTotal);
const impPagado = n2(porcImp * paid);
const impDiario = totalDays == 0 ? 0 : (pol.tax / totalDays);
const impDevengado = n2(impDiario * pastDays);
const impuestoACancelar = n2(impDevengado - impPagado);

const resultado = n2(totalACancelar - impuestoACancelar);
//doCmd({cmd: "GetPing", data: { primaPagada: paid, primaDiaria: totalDiaro, primaDevengada: primaDevengada, resultado: resultado }});
return resultado