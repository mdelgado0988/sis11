SELECT ISNULL(pd.name, lp.productCode) AS [plan],
 CASE c.gender WHEN 'M' THEN 'MASCULINO' WHEN 'F' THEN 'FEMENINO' ELSE '' END AS [sexodelasegurado],
 COALESCE(NULLIF(cl.code, ''), CAST(cl.id AS varchar(20))) AS [NroSiniestro],
 ISNULL(lb.name, lp.lob) AS [Ramo],
 CONVERT(VARCHAR(10), CAST(cl.occurrence AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) AS [FechaSiniestro],
 lp.code AS [NroPoliza],
 CASE WHEN cs.code IS NOT NULL THEN UPPER(cs.name) WHEN cl.closed = 1 THEN 'CERRADO' ELSE 'SIN ESTADO' END AS [Estado],
 lc.name AS [DesCobertura],
 LTRIM(RTRIM(CONCAT(ISNULL(c.name, ''), ' ' + NULLIF(c.surname1, ''), ' ' + NULLIF(c.surname2, '')))) AS [Asegurado],
 lc.code AS [codcobertura],
 CAST(s.resPago AS decimal(18,2)) AS [SaldoReservaPago],
 CAST(s.resGasto AS decimal(18,2)) AS [SaldoReservaGastos],
 ISNULL(uso.nombre, v.usoCod) AS [uso],
 lp.code AS [cnpoliza],
 YEAR(CAST(lp.start AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time') AS [fanopol],
 MONTH(CAST(lp.start AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time') AS [fmespol],
 lp.id AS [cpoliza],
 ISNULL(mar.nombre, v.marcaCod) AS [marca],
 ISNULL(mdl.nombre, v.modeloCod) AS [modelo],
 CONVERT(VARCHAR(10), CAST(cl.notification AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) AS [fechanotificacion],
 cl.id AS [ClaimId]
FROM (SELECT p.claimId, p.lifeCoverageId,
   SUM(CASE WHEN p.reserveType = 'EX' THEN 0 ELSE ISNULL(p.reserved, 0) END) AS resPago,
   SUM(CASE WHEN p.reserveType = 'EX' THEN ISNULL(p.reserved, 0) ELSE 0 END) AS resGasto
  FROM LifeCoveragePayout p
  WHERE p.claimId IS NOT NULL
    AND CAST((p.date AT TIME ZONE 'UTC') AT TIME ZONE 'SA Pacific Standard Time' AS date) <= CAST(ISNULL(@fechaCorte, CAST(SYSUTCDATETIME() AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time' AS date)) AS date)
  GROUP BY p.claimId, p.lifeCoverageId) s
INNER JOIN Claim cl ON cl.id = s.claimId
INNER JOIN LifePolicy lp ON lp.id = cl.lifePolicyId
LEFT JOIN LifeCoverage lc ON lc.id = s.lifeCoverageId
LEFT JOIN Lob lb ON lb.code = lp.lob
LEFT JOIN Contact c ON c.id = cl.contactId
LEFT JOIN ClaimStage cs ON cs.code = cl.stageCode
LEFT JOIN Product pd ON pd.code = lp.productCode
OUTER APPLY (SELECT TOP 1
   (SELECT TOP 1 JSON_VALUE(f.value, '$.userData[0]') FROM OPENJSON(io.jValues) f WHERE JSON_VALUE(f.value, '$.name') = 'cmbMarca') AS marcaCod,
   (SELECT TOP 1 JSON_VALUE(f.value, '$.userData[0]') FROM OPENJSON(io.jValues) f WHERE JSON_VALUE(f.value, '$.name') = 'cmbModelo') AS modeloCod,
   (SELECT TOP 1 JSON_VALUE(f.value, '$.userData[0]') FROM OPENJSON(io.jValues) f WHERE JSON_VALUE(f.value, '$.name') = 'cmbUsoAuto') AS usoCod
  FROM InsuredObject io WHERE io.lifePolicyId = lp.id AND ISJSON(io.jValues) = 1 AND io.jValues LIKE '%"cmbMarca"%' ORDER BY io.id) v
OUTER APPLY (SELECT TOP 1 JSON_VALUE(t.value, '$[2]') AS nombre FROM [Table] tb CROSS APPLY OPENJSON(tb.data) t
  WHERE tb.name = 'tbMarcas' AND JSON_VALUE(t.value, '$[1]') = v.marcaCod ORDER BY CASE WHEN JSON_VALUE(t.value, '$[0]') = lp.lob THEN 0 ELSE 1 END) mar
OUTER APPLY (SELECT TOP 1 JSON_VALUE(t.value, '$[3]') AS nombre FROM [Table] tb CROSS APPLY OPENJSON(tb.data) t
  WHERE tb.name = 'tbModelos' AND JSON_VALUE(t.value, '$[1]') = v.marcaCod AND JSON_VALUE(t.value, '$[2]') = v.modeloCod ORDER BY CASE WHEN JSON_VALUE(t.value, '$[0]') = lp.lob THEN 0 ELSE 1 END) mdl
OUTER APPLY (SELECT TOP 1 JSON_VALUE(t.value, '$[2]') AS nombre FROM [Table] tb CROSS APPLY OPENJSON(tb.data) t
  WHERE tb.name = 'tblUsoPorRamo' AND JSON_VALUE(t.value, '$[1]') = v.usoCod ORDER BY CASE WHEN JSON_VALUE(t.value, '$[0]') = lp.lob THEN 0 ELSE 1 END) uso
WHERE ((ISNULL(@reclamo, '') = '' AND (s.resPago <> 0 OR s.resGasto <> 0))
   OR (ISNULL(@reclamo, '') <> '' AND (cl.code = LTRIM(RTRIM(@reclamo)) OR CAST(cl.id AS varchar(20)) = LTRIM(RTRIM(@reclamo)))))
  AND (ISNULL(@ramo, '') = '' OR lp.lob = @ramo)
ORDER BY [Ramo], cl.id, lc.code
