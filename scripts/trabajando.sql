use GlobalSIS_AG01

select t.cramo, t.cplan, t.ccober, 36 cendoso
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
and t.cplan = '6_23' 
and t.cendoso = 36
--and t.ccober = 25
and tf.formula<> '{Qanos6}=1'
AND tf.etiqueta <> 'La emisión de esta póliza supera los 6 años.'
ORDER BY 1,2,3,4,5

select c.cramo, rtrim(c.cplan) cplan, rtrim(pl.xplan) xplan, rtrim(mc.ccobertura) ccobertura
		, rtrim(mc.xdescripcion_l) cobertura, rtrim(mc.xdescripcion_c) xdescripcion_c,
		c.bobligatoria, c.SA, c.CGRUPO, c.CGRUPO1, c.CGRUPO2
		, c.ccontrea, c.cramorea, qordenimp
from macoberturas mc
inner join maplancob c  on c.ccobertura = mc.ccobertura and c.cramo = mc.cramo
inner join maplanes pl on pl.cramo = c.cramo and pl.cplan = c.cplan
where c.cramo = 6
--AND pl.istatplan = 'V'
--and C.cplan = '6_22' 
--AND (ISNULL(c.SA,'-1') <> '-1' OR ISNULL(c.CGRUPO,'-1') <> '-1' OR ISNULL(c.CGRUPO1,'-1') <> '-1' OR ISNULL(c.CGRUPO2,'-1') <> '-1')
order by 1,2,4

select * from ccerti_preguntas where cramo = 6 --and cplan = '6_21'

--SELECT ccodigo, xdescripcion_l FROM macodigos where xsinonimo = 'Limite_Les06'
--select * from tarifasvar where variable = 'sa6'

return;

--SELECT TOP 10 * 
--FROM cobtar t
--inner join ofpolizas o ON o.cproces = t.cproces
--WHERE t.cendoso = 36
--AND o.cramo = 96 AND o.cplan = 'CAR'
--ORDER BY o.cproces DESC


declare @ramo int = 6
select CONCAT(@ramo,'-' , REPLACE(REPLACE(rtrim(cplan),CONCAT(@ramo,'_'),''),'$','')) Contador, cplan, xplan, istatplan
		, (SELECT COUNT(1) FROM maplancob c where c.cramo = pl.cramo and c.cplan = pl.cplan) Coberturas
		, (SELECT COUNT(1) FROM tarifas t where t.cramo = pl.cramo and t.cplan = pl.cplan and t.cendoso = 36) Tarifas
		, CASE WHEN EXISTS(SELECT 1 FROM adpoliza t where t.cramo = pl.cramo and t.cplan = pl.cplan) THEN 'Si' ELSE 'No' end TienePolizas
		, (SELECT TOP (1) cnpoliza FROM adpoliza t where t.cramo = pl.cramo and t.cplan = pl.cplan) Ejemplo
from maplanes pl
where cramo = @ramo 
--AND pl.istatplan = 'V'
order by 2
--AND cplan NOT IN ('Basico Vid','TAR_PRO2')

select xabreviatura, xdescripcion_l, cramo from maramos where cramo = 52

return;

--1060694
select distinct e.cramo, ra.xdescripcion_l ramo, e.cendoso, e.xdescripcion  endoso
from maendosos e
inner join maramos ra on ra.cramo = e.cramo
where /*e.cramo in (81,82,83) and*/ e.iestado = 'V'

SELECT cramo, RTRIM(xnombrep) reporte, MAX(cplan) cplan, CONCAT( MAX(RTRIM(xdescripcion)), ' (', rtrim(xnombrep), ')') reportedoc, MAX(xdescripcion_l) reporte_l, MAX(RTRIM(xdescripcion)) reporte
FROM marepteccia 
WHERE cramo = 20 AND xdpto = 'EMISION'
AND xnombrep not like 'endoso%'
AND xnombrep not like 'recibo%'
GROUP BY cramo, xnombrep

SELECT TOP 10 cpoliza, fanopol, fmespol, cproces, cnpoliza, mgastos FROM adrecibos WHERE cramo = 20 and cplan = 'Basico Vid' ORDER BY cproces DESC

--cobs que  suma, ejemplo
declare @cramo int = 20
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
where p.cramo = @cramo and p.cplan = @cplan 
--and p.cendoso = 36;

select * from rea_ces where crecibo = 792901

select xsinonimo, rtrim(ccodigo) ccodigo, xdescripcion_l from Macodigos where xsinonimo='cclarie' Order by xdescripcion_l

select distinct ccobertura from maplancob c
where c.cramo = 31
and cplan not in ('EG1','EG2','EG3','EG4','EG5')

