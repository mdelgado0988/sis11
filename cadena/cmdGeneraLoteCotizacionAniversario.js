//block
//noreplace
/*
Michael Delgado. 
2026.01.09
Permite crear de manera masiva un lote de cálculo de tarificación según otro lote de aniversario.
test { loteId: 196, anniversaries":"[\"106\",\"107\"]" }
*/

try {

  //doCmd({cmd: "GetPing", data: { data: JSON.stringify(context) }});
    
  const formatDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0"); // Mes (0–11)
    const dd = String(date.getDate()).padStart(2, "0");
  
    return `${yyyy}/${mm}/${dd}`;
  }
  
  const { loteId, anniversaries } = context;
  if (!anniversaries)
    return { ok: false, msg: `Debe seleccionar al menos una póliza para cotizar`, idLoteQuote: 0 };
    
  const polizasLote = JSON.parse(anniversaries) ?? [];
  if (polizasLote.length <= 0)
    return { ok: false, msg: `Debe seleccionar al menos una póliza para cotizar`, idLoteQuote: 0 };

  const sqlQuery = `
  SELECT COUNT(1) cantidad
  FROM [Batch] AS b
  JOIN [ImportConfig] ic ON b.importConfigId = ic.id
  WHERE ic.[category] = 'ANNIVERSARYLOTEVIEWQUOTE'
    AND ISNULL(b.[status], 'PENDING') = 'PENDING'
    AND PARSENAME(REPLACE(LEFT(b.name,NULLIF(CHARINDEX('-',b.name,CHARINDEX('-',b.name,CHARINDEX('-',b.name)+1)+1)-1,-1)),'-','.'),1) = '${loteId}';
  `;
  
  doCmd( { 
    cmd: "DoQuery", 
    data: {
      sql: sqlQuery
    }
  });

  const lotesVigentes = DoQuery?.outData?.[0].cantidad || 0;
  if (lotesVigentes>0)
    return { ok: false, msg: `Existen ${lotesVigentes} lotes pendientes de cotización para este lote de renovación, procese primero estos lotes antes de poder crear otro`, idLoteQuote: 0 }
  
  let sqlCommand = `DECLARE @loteId INT = ${loteId};
  
  SELECT jData
  FROM [Batch] b
  WHERE b.id = @loteId;`;
  
  doCmd({
      cmd:'DoQuery',
      data: {
          sql: sqlCommand
      }
  });
  
  const { jData } = DoQuery.outData.pop();
  const listado = JSON.parse(jData);

  const polizas = listado
    .filter(x => polizasLote.includes(String(x[0])))
    .map(x => [
      x[0],
      x[1],
      x[2],
      loteId
    ]);
    
  //return polizas
  
  log("Recuperando lote en caso de existir")
  
  sqlCommand = `SELECT Id FROM importConfig WHERE name = 'Cotiza Aniversario Poliza';`;
  
  doCmd({
      cmd:'DoQuery',
      data: {
          sql: sqlCommand
      }
  });
  
  const configId = DoQuery.outData?.[0]?.Id || 0;
  if (configId<=0)
    return { ok:false , msg: 'No existe lote de cotización para aniversario masivo', idLoteQuote: 0 };
  
  markAsRenovation();
  
  log("Generando lote de cotización");
  const idLoteQuote = createLote();

  if (RepoBatch.ok)
    //GLOB-821: Solicitud para no mostrar otro lote al usuario.
    //return { ok: true, msg: `Lote ${RepoBatch.outData[0].id} generado, espere que termine el proceso para verificar las primas, puede refrescar para validar los cálculos`, idLoteQuote: idLoteQuote }
return { ok: true, msg: `Lote de cotización generado, espere que termine el proceso para verificar las primas, puede refrescar para validar los cálculos`, idLoteQuote: idLoteQuote }
  else 
    return { ok: true, msg: RepoBatch.msg, idLoteQuote: 0 }

function createLote() {
  const newJdata = JSON.stringify(polizas);
  
  const nombreLote = `QUOTELOTE-${formatDate(new Date())}-${loteId}`;
  
  doCmd({ cmd: "RepoBatch", 
         data: {
           entity: {
             importConfigId:configId,
             jData: newJdata,
             name: nombreLote,
             processingType:0,
             records:polizas.length
           },
           operation:'ADD'
         } 
        });

  return RepoBatch.outData[0].id;
}

function markAsRenovation() {

    const polizasConcatenadas = polizasLote
      .map(v => Number(v))
      .filter(n => !Number.isNaN(n))
      .join(',');
  
    const query = `UPDATE b
                      SET jData = (
                          SELECT
                              JSON_QUERY(
                                  '[' + STRING_AGG(
                                      CASE
                                          WHEN JSON_VALUE(j.[value], '$[0]') IN (${polizasConcatenadas})
                                              THEN JSON_MODIFY(j.[value], '$[3]', 'Si')
                                          ELSE j.[value]
                                      END,
                                      ','
                                  ) + ']'
                              )
                          FROM OPENJSON(b.jData) j
                      )
                      FROM Batch b
                      WHERE b.id = ${loteId};`

    doCmd({
        cmd:'DoQuery',
        data: {
            sql: query
        }
    });

    if(!DoQuery.ok)
      throw new Error(DoQuery.msg);
  
}

} catch (error) {
  log(error);
  return { ok: false, msg: error.toString(), idLoteQuote: 0 }
}