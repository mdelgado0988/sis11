//block
//noreplace
/**
 * @author Noel Obando
 * @description Consulta pólizas de incendio con filtros avanzados.
 * @version 1.0.0
 * @created 2025-12-23
 * @name cmdGetFirePolicies
 * @param {number} [page=1] Página de resultados.
 * @param {number} [size=20] Tamaño de página.
 * @param {number} [id] Identificador de la póliza.
 * @param {string} [code] Código de la póliza.
 * @Recomendations Se recomienda cargar descripción de catálogos con la data filtrada para evitar lentitud en consulta, con la data filtrada es más eficiente listar los catálogos
 */
const { page = 1, size=20 } = context;
const ObjectCode = ['DT_INCENDIO_V3', '1_9_DT_INCENDIO'],
      // Ubicación Geográfica
      PAIS = 'cmbPais',
      PROVINCIA ='cmbProvincia',
      DISTRITO = 'cmbMunicipio',
      CORREGIMIENTO = 'cmbSector',
      BARRIADA = 'cmbBarriadas',
      // Identificadores Registrales
      FINCA = 'txtFinca',
      EDIFICIO = 'cmbEdificios',
      ROLLO = 'txtRollo',
      DOC = 'txtDoc',
      // Información Financiera/Bancaria
      NO_GARANTIA = 'txtNoGarantia',
      NO_PRESTAMO = 'txtNoPrestamo',
      // Atributos Técnicos
      DIRECCION = 'direccionexacta',
      TIPO_OBJETO = 'cmbTipoObjeto',
      USO_OBJETO = 'cmbUsoBien',
      CALLE_AVENIDA = 'calleoavenida',
      ZONA_CRESTA = 'cmbZonaCresta',
      APTO = 'aptoocasa',
      MANZANA = 'manzana',
      DIRECCION_EXACTA = 'direccionexacta';

const filters = [];
// Filtros de poliza (generales)
if(!isNullOrEmpty(context.id)) filters.push(`pol.id=${ context.id }`)
if(!isNullOrEmpty(context.code)) filters.push(`pol.code='${ context.code }'`)
if(!isNullOrEmpty(context.lob)) filters.push(`pol.lob='${ context.lob }'`)
if(!isNullOrEmpty(context.isActive)) filters.push(`pol.active=${ context.isActive }`);

if(!isNullOrEmpty(context.start) && !isNullOrEmpty(context.end))
  filters.push(`(pol.[start] BETWEEN '${ context.start }' AND '${ context.end }' OR pol.[end] BETWEEN '${ context.start }' AND '${ context.end }')`)

// Filtros de contacto
if(!isNullOrEmpty(context.fullName)) 
  filters.push(`(CASE WHEN con.isperson = 1 THEN CONCAT_WS(' ', con.name, con.middlename, con.surname1, con.surname2) ELSE con.surname2 END) LIKE '${context.fullName}%'`)

if(!isNullOrEmpty(context.documentId)) filters.push(`'${ context.documentId }' IN(con.cnp, con.nif)`)
if(!isNullOrEmpty(context.clientNumber)) filters.push(`con.id=${ context.clientNumber }`)

// Filtros Ubicación Geográfica
if(!isNullOrEmpty(context.pais))          filters.push(`country.code='${ context.pais }'`)
if(!isNullOrEmpty(context.provincia))     filters.push(`cState.code='${ context.provincia }'`)
if(!isNullOrEmpty(context.distrito))      filters.push(`city.code='${ context.distrito }'`)
if(!isNullOrEmpty(context.corregimiento)) filters.push(`sector.code='${ context.corregimiento }'`)
if(!isNullOrEmpty(context.barriada))      filters.push(`barriadas.id='${ context.barriada }'`)
if(!isNullOrEmpty(context.edificio))      filters.push(`io.edificio='${ context.edificio }'`)
if(!isNullOrEmpty(context.calle))         filters.push(`io.calle_avenida LIKE '${ context.calle }%'`)
if(!isNullOrEmpty(context.zonaCresta))    filters.push(`io.zonaCresta='${ context.zonaCresta }'`)
if(!isNullOrEmpty(context.apartamento))   filters.push(`io.apartamento LIKE '${ context.apartamento }%'`)
if(!isNullOrEmpty(context.manzana))       filters.push(`io.manzana LIKE '${ context.manzana }%'`)
if(!isNullOrEmpty(context.direccionExacta))    filters.push(`io.direccionExacta LIKE '${ context.direccionExacta }%'`)

// Filtros Registro
if(!isNullOrEmpty(context.noGarantia))    filters.push(`io.noGarantia='${ context.noGarantia }'`)    
if(!isNullOrEmpty(context.noPrestamo))    filters.push(`io.noPrestamo='${ context.noPrestamo }'`)
if(!isNullOrEmpty(context.finca))         filters.push(`io.finca='${ context.finca }'`)    
if(!isNullOrEmpty(context.rollo))         filters.push(`io.rollo='${ context.rollo }'`)
if(!isNullOrEmpty(context.noDoc))         filters.push(`io.noDoc='${ context.noDoc }'`)
if(!isNullOrEmpty(context.tipoObjeto))    filters.push(`io.tipoObjeto='${ context.tipoObjeto }'`)
if(!isNullOrEmpty(context.usoObjeto))     filters.push(`io.usoObjeto='${ context.usoObjeto }'`)

//Michael Delgado. 2026.01.27. Se eliminan filtros según solicitud: GLOB-380
/*
// Filtros Bancarios

// Filtros Tecnicos

if(!isNullOrEmpty(context.direccion))     filters.push(`io.direccion='${ context.direccion }'`)
*/

//Michael Delgado. 2026.01.27. GLOB-380. Se agrega el filtro de edificios
const cteEdificio = `cteEdificios AS (
  SELECT
      JSON_VALUE(data.[value],'$[0]') pais,
      JSON_VALUE(data.[value],'$[1]') provincia,
      JSON_VALUE(data.[value],'$[2]') distrito,
      JSON_VALUE(data.[value],'$[3]') corregimiento,
      JSON_VALUE(data.[value],'$[4]') id,      
      JSON_VALUE(data.[value],'$[5]') nombre
  FROM [Table] t
  CROSS APPLY OPENJSON(t.data) data
  WHERE t.[name] = 'Edificios'
  AND ISJSON(t.data) = 1
  AND JSON_VALUE(data.[value],'$[0]') <> 'pais'
)`;

const cteOA = `cteInsuredObject as (
  SELECT
      io.lifePolicyId,
      MAX(CASE WHEN form.name = '${PAIS}'          THEN form.userData END) AS pais,
      MAX(CASE WHEN form.name = '${PROVINCIA}'     THEN form.userData END) AS provincia,
      MAX(CASE WHEN form.name = '${DISTRITO}'      THEN form.userData END) AS distrito,
      MAX(CASE WHEN form.name = '${CORREGIMIENTO}' THEN form.userData END) AS corregimiento,
      MAX(CASE WHEN form.name = '${BARRIADA}'      THEN form.userData END) AS barriada,
      MAX(CASE WHEN form.name = '${FINCA}'         THEN form.userData END) AS finca,
      MAX(CASE WHEN form.name = '${ROLLO}'         THEN form.userData END) AS rollo,
      MAX(CASE WHEN form.name = '${DOC}'         THEN form.userData END) AS noDoc,
      MAX(CASE WHEN form.name = '${EDIFICIO}'      THEN form.userData END) AS edificio,
      MAX(CASE WHEN form.name = '${NO_GARANTIA}'   THEN form.userData END) AS noGarantia,
      MAX(CASE WHEN form.name = '${NO_PRESTAMO}'   THEN form.userData END) AS noPrestamo,
      MAX(CASE WHEN form.name = '${DIRECCION}'     THEN form.userData END) AS direccion,
      MAX(CASE WHEN form.name = '${TIPO_OBJETO}'   THEN form.userData END) AS tipoObjeto,
      MAX(CASE WHEN form.name = '${USO_OBJETO}'    THEN form.userData END) AS usoObjeto,
      MAX(CASE WHEN form.name = '${CALLE_AVENIDA}' THEN form.userData END) AS calle_avenida,
      MAX(CASE WHEN form.name = '${ZONA_CRESTA}' THEN form.userData END) AS zonaCresta,
      MAX(CASE WHEN form.name = '${APTO}' THEN form.userData END) AS apartamento,
      MAX(CASE WHEN form.name = '${MANZANA}' THEN form.userData END) AS manzana,
      MAX(CASE WHEN form.name = '${DIRECCION_EXACTA}' THEN form.userData END) AS direccionExacta
  FROM LifePolicy pol
  INNER JOIN InsuredObject io ON pol.id = io.lifePolicyId
  INNER JOIN ObjectDefinition od ON od.id = io.objectDefinitionId
  CROSS APPLY OPENJSON(
        CASE 
            WHEN ISJSON(io.jValues) = 1 THEN io.jValues
            ELSE NULL
        END
    )
    WITH (
        name NVARCHAR(MAX) '$.name',
        userData NVARCHAR(MAX) '$.userData[0]'
    ) AS form
  WHERE pol.lob = '1' 
  AND od.code IN ('${ ObjectCode.join("','") }')
  AND form.name IN (
  'cmbPais','cmbProvincia','cmbMunicipio',
  'cmbSector','cmbBarriadas','${FINCA}',
  'cmbEdificios','${NO_GARANTIA}',
  '${NO_PRESTAMO}','direccionexacta',
  'cmbTipoObjeto','cmbUsoBien','calleoavenida','${ZONA_CRESTA}','${APTO}', '${MANZANA}', '${DIRECCION_EXACTA}','${ROLLO}','${DOC}')
  GROUP BY io.lifePolicyId
)`;

/*doCmd({cmd :"DoQuery", data: { sql: `; WITH ${cteOA} select * from cteInsuredObject` }});
return DoQuery*/

const cteBarriadas = `;WITH barriadas as (
    SELECT
      JSON_VALUE(data.[value],'$[0]') id,
      JSON_VALUE(data.[value],'$[3]') barrio
    FROM [Table] t
    CROSS APPLY OPENJSON(t.data) data
    WHERE t.[name]='Barriadas' 
    AND ISJSON(t.data) = 1
    AND JSON_VALUE(data.[value],'$[0]') != 'idStreet'
)`

//MAD: No es necesario filtrar las descripciones de los catálogos porque no se renderizan en la vista. es mejor hacerlo luego de filtrado.
//const ctes = `${cteBarriadas}, ${cteEdificio}, ${cteOA}`;
const ctes = `;WITH ${cteOA}`;

const joinAndFilters =`
FROM LifePolicy pol
INNER JOIN Contact con           ON con.id   = pol.holderId
INNER JOIN Product pro           ON pro.code = pol.productCode
INNER JOIN Proceso prc           ON prc.id = pol.processId
INNER JOIN Insured insured       ON pol.id = insured.lifePolicyId AND insured.role = 0
INNER JOIN cteInsuredObject io   ON pol.id = io.lifePolicyId
/*MAD: Ojo, esto no se pinta en la grilla y ralentiza significativamente la búsqueda
LEFT JOIN CountryCatalog country ON country.code = io.pais
LEFT JOIN StateCatalog cState    ON cState.code = io.provincia
LEFT JOIN CityCatalog city       ON city.code = io.distrito
LEFT JOIN SectorCatalog sector   ON sector.code = io.corregimiento
LEFT JOIN barriadas              ON barriadas.id = io.barriada
LEFT JOIN cteEdificios edf       ON edf.pais = io.pais AND edf.provincia = io.provincia AND edf.distrito = io.distrito AND edf.corregimiento = io.corregimiento AND edf.id = io.edificio*/
WHERE pol.lob = '1'
${ filters && filters.length > 0 ? `AND ${ filters.join(' AND ')}` : '' }
`;

// Get dataset.
const sql =`
${ ctes }
SELECT
  COUNT(*) OVER() AS total,
  pol.id,
  pol.code,
  pol.policyType,
  pol.holderId,
  insured.contactId,
  IIF(con.isPerson=0, con.surname2, TRIM(CONCAT( ISNULL(con.[name],''), ' ',ISNULL(con.[surname1],''), ' ',ISNULL(con.[surname2],'')  ))) holderName,
  TRIM(insured.name) mainInsured,
  pol.activeDate,
  pol.[start],
  pol.[end],
  pro.name productName,
  prc.entityState,
  prc.estado  
  
  /*MAD: Ojo, esto no se pinta en la grilla y ralentiza significativamente la búsqueda
  ISNULL(country.name,'') pais,
  ISNULL(cState.name,'') provincia,
  ISNULL(city.name,'') distrito,
  ISNULL(sector.name,'') corregimiento,
  ISNULL(barriadas.barrio,'') barrio,
  edf.nombre edificio,*/
  
  
${ joinAndFilters }
ORDER BY pol.id DESC
OFFSET (${ page } - 1) * ${ size } ROWS
FETCH NEXT ${ size } ROWS ONLY;`;

doCmd({cmd:'DoQuery',data:{ sql }});
/*return DoQuery*/

return {
  ok: DoQuery.ok,
  msg: DoQuery.msg,
  total: DoQuery.ok && DoQuery.outData.length > 0 ? DoQuery.outData[0].total : 0,
  data: DoQuery.outData || []
}

function isNullOrEmpty(value){
  return typeof value === 'undefined' ||
         value === null || !value ||
         String(value).trim() === ''
}