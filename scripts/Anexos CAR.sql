use GlobalSIS_AG01

go

--select * from rgcert_datos_endoso
drop table if exists #reportes;

select cramo lob, CASE WHEN cramo = 81 THEN CONCAT(cramo, cplan) ELSE cplan END [Producto], rtrim(xnombrep) xnombrep,
	(rtrim(xdescripcion)) xdescripcion, xformula1 CoverageCode, xdpto
into #reportes
from marepteccia
where cramo in (96)
--and xnombrep like '%endoso%'
--AND xdpto <> 'SINIESTROS'
--AND xformula1 <> '0'
--AND xformula1 is not null and xformula1 <> '0'
order by 1,2

--SELECT * FROM #reportes

SELECT  macoberturas.cramo, maplancob.cplan,
	macoberturas.ccobertura,
	rt.xnombrep IdAnexo,
    macoberturas.xdescripcion_l,    
	'EMISION' tipo,
    cde.campo,
    cde.ctipo
FROM macoberturas
INNER JOIN maplancob ON macoberturas.ccobertura = maplancob.ccobertura AND macoberturas.cramo = maplancob.cramo
LEFT JOIN #reportes rt ON rt.lob = maplancob.cramo and rt.CoverageCode = macoberturas.ccobertura
INNER JOIN conf_datos_endoso cde ON cde.cramo = maplancob.cramo AND cde.cplan = maplancob.cplan AND cde.ccober = maplancob.ccobertura
WHERE maplancob.iestado = 'V' AND maplancob.IndDatsoAdic = 1
ORDER BY 1,2,3,4,5