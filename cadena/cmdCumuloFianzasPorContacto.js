//block
//noreplace
/*
Name: cmdCumuloFianzasPorContacto
Author: aiden_sa_3 (AXX-251 / GLOB-1214)
Description: Consulta de Cumulo de Fianzas. Devuelve, para un contacto, sus fianzas vigentes
             con la participacion que le corresponde (directa 100%, desglose por integrante
             de consorcio del formulario 611, o participacion como integrante), mas el
             Total Cumulo por moneda. Desde 1.10 separa, por fila, la suma cedida al contrato
             (contractual) de la cedida en lineas facultativas, y devuelve el Total cumulo
             contractual. SOLO LECTURA.
Category: VIEW
Version: 1.10
CreateDate: 2026-09-04
Modified: 2026-11-06 aiden_mission_configurator (MSN-000167 / AXX-7868): sumaContractual,
          sumaFacultativa, conCesion por fila; totalCumuloContractual en total y por moneda.

@param {number} row.contactId  Numero SIS (Contact.id) del contacto consultado.

Reglas aplicadas:
 - Fianzas = lob 81, 82, 83, 84 (catalogo Lob de global1).
 - Vigentes = active = 1 AND activeDate IS NOT NULL (misma regla que usa la validacion
   de cumulo del ambiente, cmdAdvanceSearchPolicyFire / GLOB-328).
 - Integrantes del consorcio: formulario 611 FRMContacto_PA_Consorcio, campo hiddenValida
   de la pestana "Consorcios" del contacto ente padre.
 - El registro del ente padre va en 0 solo cuando hay integrantes registrados (CA10);
   sin integrantes aplica CA8 al 100%.
 - Total Cumulo = SUM(sumaasegurada) de las filas devueltas, a dos decimales. La prima NO suma.
 - MSN-000167. Suma contractual = parte cedida al reaseguro en las lineas NO facultativas
   (sumInsuredRe de las cesiones vigentes, ISNULL(overwritten,0) = 0); la retencion no cuenta.
   Suma facultativa = sumInsuredRe de las lineas facultativas (lineId FAC... o contrato
   facultive = 1). Solo cuentan las coberturas que forman la suma asegurada de la fianza
   (isCoverage = Si en cfgCoberturaProductoReaFianza para el producto, igual que el contrato
   CPF; producto sin configuracion = todas sus coberturas). Por fianza:
   proporcion = cedido / suma de los limites de esas coberturas, aplicada a la sumaasegurada
   de la fila (ya ponderada por la participacion). Fianza sin cesiones => 0 y conCesion false.
 - Total cumulo contractual = suma de sumaContractual de las filas, a dos decimales.
*/
const { row } = context;

const contactId = parseInt(row.contactId, 10);
if (!contactId || isNaN(contactId) || contactId <= 0) {
  return { ok: false, msg: 'contactId requerido', data: [], totalCumulo: 0, totalesPorMoneda: [] };
}

const VIGENCIA = 'p.active = 1 AND p.activeDate IS NOT NULL';
const RAMOS_FIANZA = "'81','82','83','84'";

const cte = `
WITH Fianza AS (
    SELECT p.id, p.[code], p.lob, p.holderId, p.insuredSum, p.anualPremium,
           p.currency, p.[start] AS fIni, p.[end] AS fFin, p.productCode
    FROM LifePolicy p
    WHERE p.lob IN (${RAMOS_FIANZA})
      AND ${VIGENCIA}
),
MiembroRaw AS (
    SELECT c.id AS parentId,
           m.NombreConsorciados, m.NombreEmpresa, m.Porcentaje,
           m.CodigoSis, m.CodigoCobis,
           ROW_NUMBER() OVER (PARTITION BY c.id, m.CodigoSis ORDER BY m.Porcentaje DESC) AS rn
    FROM Contact c
    CROSS APPLY OPENJSON(c.jCustomForms) tabs
    CROSS APPLY OPENJSON(tabs.[value])
        WITH (fname varchar(100) '$.name', userData nvarchar(max) '$.userData[0]') fld
    CROSS APPLY OPENJSON(fld.userData)
        WITH (NombreConsorciados nvarchar(400) '$.NombreConsorciados',
              NombreEmpresa      nvarchar(400) '$.NombreEmpresa',
              Porcentaje         decimal(18,6) '$.Porcentaje',
              CodigoSis          int           '$.CodigoSis',
              CodigoCobis        nvarchar(50)  '$.CodigoCobis') m
    WHERE tabs.[key] = 'Consorcios'
      AND fld.fname  = 'hiddenValida'
      AND ISJSON(fld.userData) = 1
      AND m.CodigoSis IS NOT NULL
      AND m.Porcentaje IS NOT NULL
),
Miembro AS (SELECT * FROM MiembroRaw WHERE rn = 1),
Filas AS (
    SELECT 'PADRE_CONSORCIO' AS relacion, f.id AS polizaId, f.[code] AS numeroPoliza,
           f.lob, f.productCode, f.currency, f.fIni, f.fFin,
           f.holderId AS enteAseguradoId, f.insuredSum AS sumaAseguradaPoliza,
           f.anualPremium AS primaPoliza,
           f.holderId AS contactoFilaId, CAST(NULL AS nvarchar(400)) AS nombreMiembro,
           CAST(0 AS decimal(18,6)) AS porcentaje,
           CAST(0 AS decimal(18,6)) AS sumaAsegurada,
           CAST(0 AS decimal(18,6)) AS primaParticipacion
    FROM Fianza f
    WHERE f.holderId = ${contactId}
      AND EXISTS (SELECT 1 FROM Miembro mm WHERE mm.parentId = f.holderId)

    UNION ALL

    SELECT 'INTEGRANTE', f.id, f.[code], f.lob, f.productCode, f.currency, f.fIni, f.fFin,
           f.holderId, f.insuredSum, f.anualPremium,
           m.CodigoSis, m.NombreEmpresa, m.Porcentaje,
           f.insuredSum   * m.Porcentaje / 100.0,
           f.anualPremium * m.Porcentaje / 100.0
    FROM Fianza f
    JOIN Miembro m ON m.parentId = f.holderId
    WHERE f.holderId = ${contactId}

    UNION ALL

    SELECT 'DIRECTO', f.id, f.[code], f.lob, f.productCode, f.currency, f.fIni, f.fFin,
           f.holderId, f.insuredSum, f.anualPremium,
           f.holderId, NULL, 100.0, f.insuredSum, f.anualPremium
    FROM Fianza f
    WHERE f.holderId = ${contactId}
      AND NOT EXISTS (SELECT 1 FROM Miembro mm WHERE mm.parentId = f.holderId)

    UNION ALL

    SELECT 'MIEMBRO_DE_CONSORCIO', f.id, f.[code], f.lob, f.productCode, f.currency, f.fIni, f.fFin,
           f.holderId, f.insuredSum, f.anualPremium,
           m.CodigoSis, m.NombreEmpresa, m.Porcentaje,
           f.insuredSum   * m.Porcentaje / 100.0,
           f.anualPremium * m.Porcentaje / 100.0
    FROM Fianza f
    JOIN Miembro m ON m.parentId = f.holderId AND m.CodigoSis = ${contactId}
    WHERE f.holderId <> ${contactId}
)`;

const sqlFilas = `${cte}
SELECT fl.relacion, fl.polizaId, fl.numeroPoliza,
       lb.name AS ramo, pr.name AS producto, fl.currency AS moneda,
       CONVERT(varchar(10), fl.fIni, 120) AS vigenciaDesde,
       CONVERT(varchar(10), fl.fFin, 120) AS vigenciaHasta,
       CASE WHEN he.isPerson = 1
            THEN LTRIM(RTRIM(CONCAT(he.name,' ',he.surname1,' ',he.surname2)))
            ELSE he.surname2 END AS enteAseguradoPrincipal,
       COALESCE(fl.nombreMiembro,
                CASE WHEN hc.isPerson = 1
                     THEN LTRIM(RTRIM(CONCAT(hc.name,' ',hc.surname1,' ',hc.surname2)))
                     ELSE hc.surname2 END) AS clienteMiembroRelacionado,
       CAST(fl.sumaAseguradaPoliza AS decimal(18,2)) AS sumaAseguradaPoliza,
       CAST(fl.primaPoliza         AS decimal(18,2)) AS primaPoliza,
       CAST(fl.porcentaje          AS decimal(18,2)) AS porcentajeParticipacion,
       CAST(fl.sumaAsegurada       AS decimal(18,2)) AS sumaasegurada,
       CAST(fl.primaParticipacion  AS decimal(18,2)) AS primaParticipacion
FROM Filas fl
JOIN Contact he ON he.id = fl.enteAseguradoId
LEFT JOIN Contact hc ON hc.id = fl.contactoFilaId
LEFT JOIN Lob lb ON lb.[code] = fl.lob
LEFT JOIN Product pr ON pr.[code] = fl.productCode
ORDER BY fl.polizaId, fl.relacion, fl.contactoFilaId`;

const sqlTotales = `${cte}
SELECT fl.currency AS moneda,
       CAST(SUM(fl.sumaAsegurada) AS decimal(18,2)) AS totalCumulo,
       COUNT(*) AS filas
FROM Filas fl
GROUP BY fl.currency`;

doCmd({ cmd: 'DoQuery', data: { sql: sqlFilas } });
const filas = DoQuery.outData || [];

doCmd({ cmd: 'DoQuery', data: { sql: sqlTotales } });
const totales = DoQuery.outData || [];

// MSN-000167: reparto contractual / facultativo de la suma cedida de cada fianza.
const reparto = getRepartoCesion(filas);
const r2 = n => Math.round((Number(n) || 0) * 100) / 100;
filas.forEach(f => {
  const r = reparto[f.polizaId];
  const conCesion = !!(r && r.cesiones > 0 && r.base > 0);
  const suma = Number(f.sumaasegurada) || 0;
  f.conCesion = conCesion;
  f.sumaContractual = conCesion ? r2(suma * r.contrato / r.base) : 0;
  f.sumaFacultativa = conCesion ? r2(suma * r.facultativo / r.base) : 0;
});
totales.forEach(t => {
  t.totalCumuloContractual = r2(filas
    .filter(f => String(f.moneda) === String(t.moneda))
    .reduce((a, f) => a + f.sumaContractual, 0));
});

// Total Cumulo unico solo cuando hay una sola moneda (S7: no se convierte moneda).
const totalCumulo = totales.length === 1 ? totales[0].totalCumulo : null;
const totalCumuloContractual = totales.length === 1 ? totales[0].totalCumuloContractual : null;

return {
  ok: true,
  total: filas.length,
  data: filas,
  totalCumulo: totalCumulo,
  totalCumuloContractual: totalCumuloContractual,
  totalesPorMoneda: totales
};

// Por poliza: base = suma de los limites de las coberturas que suman; contrato / facultativo =
// sumInsuredRe de sus cesiones vigentes en lineas no facultativas / facultativas.
function getRepartoCesion(filas) {
  const ids = [...new Set(filas.map(f => parseInt(f.polizaId, 10)).filter(n => n > 0))];
  const reparto = {};
  if (!ids.length) return reparto;

  const suman = getCoberturasQueSuman();
  const FAC = "(UPPER(ISNULL(c.lineId,'')) LIKE 'FAC%' OR ISNULL(k.facultive,0) = 1)";
  doCmd({ cmd: 'DoQuery', data: { sql: `
SELECT lc.lifePolicyId AS polizaId, p.productCode, lc.[code] AS coberturaCodigo,
       MAX(ISNULL(lc.limit,0)) AS limite,
       SUM(CASE WHEN c.id IS NOT NULL AND NOT ${FAC} THEN ISNULL(c.sumInsuredRe,0) ELSE 0 END) AS cedidoContrato,
       SUM(CASE WHEN c.id IS NOT NULL AND ${FAC} THEN ISNULL(c.sumInsuredRe,0) ELSE 0 END) AS cedidoFacultativo,
       COUNT(c.id) AS cesiones
FROM LifeCoverage lc
JOIN LifePolicy p ON p.id = lc.lifePolicyId
LEFT JOIN Cession c ON c.lifePolicyId = lc.lifePolicyId AND c.coverageId = lc.id
                   AND ISNULL(c.overwritten,0) = 0
LEFT JOIN [Contract] k ON k.id = c.contractId
WHERE lc.lifePolicyId IN (${ids.join(',')})
GROUP BY lc.id, lc.lifePolicyId, p.productCode, lc.[code]` } });
  if (!DoQuery.ok)
    throw 'cmdCumuloFianzasPorContacto: no se pudieron leer las cesiones: ' + DoQuery.msg;

  (DoQuery.outData || []).forEach(c => {
    const lista = suman[String(c.productCode || '').trim()];
    if (lista && !lista.includes(String(c.coberturaCodigo || '').trim())) return;
    const r = reparto[c.polizaId] || (reparto[c.polizaId] = { base: 0, contrato: 0, facultativo: 0, cesiones: 0 });
    r.base += Number(c.limite) || 0;
    r.contrato += Number(c.cedidoContrato) || 0;
    r.facultativo += Number(c.cedidoFacultativo) || 0;
    r.cesiones += Number(c.cesiones) || 0;
  });
  return reparto;
}

// productCode -> codigos de cobertura con isCoverage = Si (la misma tabla que usa el contrato CPF).
function getCoberturasQueSuman() {
  doCmd({ cmd: 'GetFullTable', data: { table: 'cfgCoberturaProductoReaFianza' } });
  if (!GetFullTable.ok)
    throw 'cmdCumuloFianzasPorContacto: no se pudo leer cfgCoberturaProductoReaFianza: ' + GetFullTable.msg;
  const data = GetFullTable.outData || [];
  const cab = (data[0] || []).map(h => String(h || '').trim());
  const iProd = cab.indexOf('productCode'), iCob = cab.indexOf('coverageCode'), iSuma = cab.indexOf('isCoverage');
  const suman = {};
  data.slice(1).forEach(x => {
    if (String(x[iSuma] || '').trim().toUpperCase() !== 'SI') return;
    const prod = String(x[iProd] || '').trim();
    (suman[prod] = suman[prod] || []).push(String(x[iCob] || '').trim());
  });
  return suman;
}
