//block
//noreplace
// MSN-000111: normalize dates only for an unissued EG6 monthly plan.
// name: cmdEG6FechasCuotasVigencia
const input = context || {};
const original = input.origin || {};
let pol = original.cmd === 'QuotePolicy' ? (original.outData || [])[0] : null;
const policyId = Number(pol ? pol.id : (original.data || {}).policyId);
if (!policyId) return {ok:true, skipped:true};
doCmd({cmd:'RepoLifePolicy',data:{operation:'GET',filter:'id='+policyId,size:1}});
if (!RepoLifePolicy.ok || !RepoLifePolicy.outData || !RepoLifePolicy.outData.length) throw 'EG6: no se pudo leer la oferta';
const saved = RepoLifePolicy.outData[0];
pol = pol || saved;
if (pol.productCode !== 'EG6' || pol.activeDate || pol.active || pol.periodicity !== 'm') return {ok:true,skipped:true};
if (original.cmd === 'QuotePolicy' && !original.data.save) return {ok:true,skipped:true,msg:'La normalización persistida se ejecuta al guardar la cotización'};
doCmd({cmd:'ExeChain',data:{chain:'cmdFinVigencia30Junio',context:JSON.stringify({start:pol.start})}});
if (!ExeChain.ok || !ExeChain.outData || !ExeChain.outData.ok) throw 'EG6: no se pudo calcular el calendario de cuotas';
const calendar = ExeChain.outData;
doCmd({cmd:'LoadEntities',data:{entity:'PayPlan',fields:'*',filter:'lifePolicyId='+policyId+' AND cancellationDate IS NULL AND contractYear='+saved.contractYear}});
if(!LoadEntities.ok) throw 'EG6: no se pudo leer el plan';
const rows = (LoadEntities.outData || []).sort((a,b)=>a.numberInYear-b.numberInYear);
if (rows.length !== calendar.installments) throw 'EG6: cantidad de cuotas distinta del calendario esperado';
if (rows.some(x=>Number(x.payed)>0)) throw 'EG6: no se modifican cuotas con pagos';
let changed=0;
for (let i=0;i<rows.length;i++) {
  const row=rows[i];
  const due=calendar.dueDates[i];
  const until=i+1<rows.length?calendar.dueDates[i+1]:calendar.end;
  const same=(a,b)=>new Date(/(Z|[+-]\d\d:?\d\d)$/i.test(String(a))?a:String(a)+'Z').getTime()===new Date(b).getTime();
  if (!same(row.dueDate,due) || !same(row.coveredUntil,until)) {
    row.dueDate=due; row.normalDueDate=due; row.coveredUntil=until;
    delete row.LifePolicy;
    doCmd({cmd:'RepoPayPlan',data:{operation:'UPDATE',entity:row}});
    if(!RepoPayPlan.ok) throw 'EG6: no se pudo ajustar la cuota '+row.numberInYear+': '+RepoPayPlan.msg;
    changed++;
  }
}
const originalRows = original.cmd === 'QuotePolicy' ? (pol.PayPlan || []) : (original.outData || []);
for (let i=0;i<rows.length;i++) {
  const matching=originalRows.find(x=>x.id===rows[i].id);
  if(matching) rows[i].PayPlanDetail=matching.PayPlanDetail;
}
return {ok:true,policyId:policyId,changed:changed,plan:rows,msg:'EG6: '+rows.length+' cuotas dentro de la vigencia'};
