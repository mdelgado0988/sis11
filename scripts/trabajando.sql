use GlobalSIS_AG01

select t.cramo, RTRIM(t.cplan) cplan, RTRIM(t.ccober) ccober, 36 cendoso
	, REPLACE(tf.formula,'{XMONTH}','XMONTH') as formula
	, rtrim(REPLACE(REPLACE(REPLACE(REPLACE(tf.mprima,'{XMONTH}','XMONTH'),'{PPRIMAPP}','6.53'),'{XPRIMA}','XPRIMA'),'{CCOBER}','CCOBER')) AS mprima	
	, rtrim(REPLACE(tf.mdeducible,'{XMONTH}','XMONTH')) AS mdeducible
	, RTRIM(REPLACE(tf.msumaaseg,'{XMONTH}','XMONTH')) AS msumaaseg
	, TRIM(REPLACE(tf.etiqueta,'{XMONTH}','XMONTH')) AS etiqueta
	, 'false' usaProrrata
	, sumarecibo, pprima, mdeduciblemin, mc.xdescripcion_l NombreCobertura
from tarifas t WITH (NOLOCK)
inner join tarifasfor tf WITH (NOLOCK) on tf.ctarifa = t.ctarifa
INNER JOIN macoberturas mc on mc.cramo = t.cramo and mc.ccobertura = t.ccober
INNER JOIN maplancob pl ON pl.cramo = t.cramo and pl.cplan = t.cplan and pl.ccobertura = t.ccober
where t.cramo = 6
and t.cplan = 'TRANS-PES' 
and t.cendoso = 36
--and t.ccober = 25
--and tf.formula<> '{Qanos6}=1'
AND tf.etiqueta <> 'La emisión de esta póliza supera los 6 años.'
ORDER BY 1,2,3,4,5

DROP TABLE IF EXISTS #Coberturas;

select c.cramo, rtrim(c.cplan) cplan, rtrim(pl.xplan) xplan, rtrim(mc.ccobertura) ccobertura
		, rtrim(mc.xdescripcion_l) cobertura, rtrim(mc.xdescripcion_c) xdescripcion_c,
		c.bobligatoria
		, CASE WHEN ISNULL(pr.ctipo,'') = 'FOR' THEN '-1' ELSE c.SA END SA
		, c.CGRUPO
		, c.CGRUPO1, c.CGRUPO2
		, c.ccontrea, c.cramorea, qordenimp, c.SA SADefault
INTO #Coberturas
from macoberturas mc
inner join maplancob c  on c.ccobertura = mc.ccobertura and c.cramo = mc.cramo
inner join maplanes pl on pl.cramo = c.cramo and pl.cplan = c.cplan
LEFT JOIN ccerti_preguntas pr ON pr.cramo = mc.cramo and pr.cpregunta = c.SA
where c.cramo = 6
--AND pl.istatplan = 'V'
and C.cplan = 'TRANS-PES' 

SELECT * FROM #Coberturas
order by 1,2,4

select cramo, cplan, cpregunta, xpregunta, ctipo, rtrim(xsinonimo) xsinonimo 
from ccerti_preguntas 
where cramo = 6 
AND (cpregunta IN (select SA FROM #Coberturas)
	OR cpregunta IN (select CGRUPO FROM #Coberturas)
	OR cpregunta IN (select CGRUPO1 FROM #Coberturas)
	OR cpregunta IN (select CGRUPO2 FROM #Coberturas)
	)
order by cpregunta

--select cramo, cplan, cpregunta, xpregunta, ctipo, rtrim(xsinonimo) xsinonimo from ccerti_preguntas where cramo = 6 order by cpregunta

--SELECT ccodigo, xdescripcion_l FROM macodigos where xsinonimo = 'Limite_Les06'
--select * from tarifasvar where variable = 'modelorec'

return;

declare @ramo int = 6
SELECT * 
FROM (
select ROW_NUMBER() OVER(ORDER BY cramo, cplan) ID, cramo,
		CONCAT(cramo,'-' , REPLACE(REPLACE(rtrim(cplan),CONCAT(cramo,'_'),''),'$','')) Contador
		,CONCAT('R-', cramo,'-' , REPLACE(REPLACE(rtrim(cplan),CONCAT(cramo,'_'),''),'$','')) ContadorReclamo
		, RTRIM(cplan) cplan, xplan, istatplan
		, (SELECT COUNT(1) FROM maplancob c where c.cramo = pl.cramo and c.cplan = pl.cplan) Coberturas
		, (SELECT COUNT(1) FROM tarifas t where t.cramo = pl.cramo and t.cplan = pl.cplan and t.cendoso = 36) Tarifas
		, CASE WHEN EXISTS(SELECT 1 FROM adpoliza t where t.cramo = pl.cramo and t.cplan = pl.cplan) THEN 'Si' ELSE 'No' end TienePolizas
		, (SELECT TOP (1) cnpoliza FROM adpoliza t where t.cramo = pl.cramo and t.cplan = pl.cplan) Ejemplo
from maplanes pl
where cramo = @ramo 
--AND pl.istatplan = 'V'
)  t
WHERE t.id >= 49
order by 2

--select CONCAT(cramo,'-' , REPLACE(REPLACE(rtrim(cplan),CONCAT(cramo,'_'),''),'$','')) Contador, RTRIM(cplan) cplan, xplan, istatplan
--		, (SELECT COUNT(1) FROM maplancob c where c.cramo = pl.cramo and c.cplan = pl.cplan) Coberturas
--		, (SELECT COUNT(1) FROM tarifas t where t.cramo = pl.cramo and t.cplan = pl.cplan and t.cendoso = 36) Tarifas
--		, CASE WHEN EXISTS(SELECT 1 FROM adpoliza t where t.cramo = pl.cramo and t.cplan = pl.cplan) THEN 'Si' ELSE 'No' end TienePolizas
--		, (SELECT TOP (1) cnpoliza FROM adpoliza t where t.cramo = pl.cramo and t.cplan = pl.cplan) Ejemplo
--from maplanes pl
--where cramo in (81,82,83,84)
----AND pl.istatplan = 'V'
--order by 2

select xabreviatura, xdescripcion_l, cramo from maramos where cramo = 52

return;

--1060694
select distinct e.cramo, ra.xdescripcion_l ramo, e.cendoso, e.xdescripcion  endoso
from maendosos e
inner join maramos ra on ra.cramo = e.cramo
where e.cramo in (0,1) and e.iestado = 'V'
AND e.cendoso in (select cendoso from adendoso)

SELECT cramo, RTRIM(xnombrep) reporte, MAX(cplan) cplan, CONCAT( MAX(RTRIM(xdescripcion)), ' (', rtrim(xnombrep), ')') reportedoc, MAX(xdescripcion_l) reporte_l, MAX(RTRIM(xdescripcion)) reporte
FROM marepteccia 
WHERE cramo = 6 AND xdpto = 'EMISION'
AND xnombrep not like 'endoso%'
AND xnombrep not like 'recibo%'
GROUP BY cramo, xnombrep

SELECT TOP 10 cpoliza, fanopol, fmespol, cproces, cnpoliza, mgastos FROM adrecibos WHERE cramo = 6 ORDER BY cproces DESC

--cobs que  suma, ejemplo
declare @cramo int = 1
declare @cplan varchar(15) = 'vid-desemp';
; WITH polizas AS (select top (1) cpoliza, fanopol, fmespol
		from adpoliza p
		cross apply (select count(1)  cobs
						from adpolcob c
					where p.cpoliza = c.cpoliza and p.fanopol = c.fanopol and p.fmespol = c.fmespol) c
		where p.cramo = @cramo and p.cplan = @cplan 
		--and p.cendoso = 36
		AND p.fanopol >= 2025 AND p.istatpol <> 'C'
		order by c.cobs desc, cpoliza desc) 
select c.crecibo, c.ccober, c.isuma, c.msumaaseg, c.mprimabruta, p.cproces, p.cnpoliza, p.cpoliza, p.fanopol, p.fmespol, p.fdesde, p.fhasta
	, p.xasegurado, DATEDIFF(day,p.fdesde, p.fhasta) dias,p.mprimabruta, p.msumabruta , p.cendoso
from polizas
inner join adpoliza p on p.cpoliza = polizas.cpoliza AND p.fanopol = polizas.fanopol and p.fmespol = polizas.fmespol
inner join adpolcob c on p.cpoliza = c.cpoliza and p.fanopol = c.fanopol and p.fmespol = c.fmespol
where p.cramo = @cramo 
--and p.cplan = @cplan 
--and p.cendoso = 36;

select * from rea_ces where crecibo = 792901

select xsinonimo, rtrim(ccodigo) ccodigo, xdescripcion_l from Macodigos where xsinonimo='cclarie' Order by xdescripcion_l

select distinct ccobertura from maplancob c
where c.cramo = 31
and cplan not in ('EG1','EG2','EG3','EG4','EG5')

