//block
//noreplace

/*
  *Name cmdLoteAnniversary
  *Author: Mike Ortiz
  *Creation date: 2026-01-01
  *Description: Runs anniversary processing for a batch item when the policy is eligible.
  *Email: michael.delgado@axxis-systems.com
  *Version: 1.0
*/


const { row } = context;

docmd({
  cmd:'GetPing',
  data:{
    contexto: JSON.stringify({context: context})
  }
})

//Michael Delgado. 2026.01.15. GLOB-297, si está marcado para que no se procese, no lo proceso.
if ((row.bProcesar || "").trim().toLowerCase() === "no") {
  return {
    ok:false,
    msg: 'Póliza marcada para no procesarse en este lote.'
  }
}

doCmd({
  cmd:'StartAnniversary',
  data:{
    anniversaryId:row.anniversaryId
  }
})

if(!StartAnniversary.ok){
  throw `@${StartAnniversary.msg}`;
}

doCmd({
  cmd:'ExeAnniversary',
  data:{
    anniversaryId:row.anniversaryId
  }
});

if(!ExeAnniversary.ok){
  throw `@${ExeAnniversary.msg}`;
}

return {
  ok:true,
  msg: 'Anniversario creado sin problemas'
}