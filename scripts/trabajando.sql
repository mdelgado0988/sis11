use GlobalSIS_AG01

select t.cramo, t.cplan, t.ccober, 36 cendoso
	, REPLACE(tf.formula,'{XMONTH}','XMONTH') as formula
	, REPLACE(REPLACE(REPLACE(REPLACE(tf.mprima,'{XMONTH}','XMONTH'),'{PPRIMAPP}','6.53'),'{XPRIMA}','XPRIMA'),'{CCOBER}','CCOBER') AS mprima	
	, REPLACE(tf.mdeducible,'{XMONTH}','XMONTH') AS mdeducible
	, REPLACE(tf.msumaaseg,'{XMONTH}','XMONTH') AS msumaaseg
	, TRIM(REPLACE(tf.etiqueta,'{XMONTH}','XMONTH')) AS etiqueta
	, 'false' usaProrrata
	, sumarecibo, pprima, mdeduciblemin, mc.xdescripcion_l NombreCobertura
from tarifas t WITH (NOLOCK)
inner join tarifasfor tf WITH (NOLOCK) on tf.ctarifa = t.ctarifa
INNER JOIN macoberturas mc on mc.cramo = t.cramo and mc.ccobertura = t.ccober
where t.cramo = 20
--and t.cplan = '20_4' 
and t.cendoso = 36
--and t.ccober = 25
and tf.formula<> '{Qanos6}=1'
AND tf.etiqueta <> 'La emisión de esta póliza supera los 6 años.'
ORDER BY 1,2,3,4,5

select c.cramo, c.cplan, pl.xplan, mc.ccobertura, mc.xdescripcion_l cobertura, mc.xdescripcion_c, c.bobligatoria, c.SA, c.CGRUPO, c.CGRUPO1, c.CGRUPO2
		, c.ccontrea, c.cramorea, qordenimp
from macoberturas mc
inner join maplancob c  on c.ccobertura = mc.ccobertura and c.cramo = mc.cramo
inner join maplanes pl on pl.cramo = c.cramo and pl.cplan = c.cplan
where c.cramo = 20
--AND pl.istatplan = 'V'
--and c.cplan IN ('MGLOBAL')
--AND (ISNULL(c.SA,'-1') <> '-1' OR ISNULL(c.CGRUPO,'-1') <> '-1' OR ISNULL(c.CGRUPO1,'-1') <> '-1' OR ISNULL(c.CGRUPO2,'-1') <> '-1')
order by 1,2,4

select * from ccerti_preguntas where cramo = 1 and cplan = '1_17'

SELECT ccodigo, xdescripcion_l FROM macodigos where xsinonimo = 'LIMITE_MULTI'

SELECT CASE  WHEN {CCOBER} in(85,271,258) THEN msumaaseg * 0.10  
WHEN {CCOBER} = 251 THEN msumaaseg * 0.25  
WHEN {CCOBER} = 254 THEN msumaaseg * 0.15 
WHEN {CCOBER} = 272 THEN 0  
ELSE msumaaseg END AS msumaaseg  
FROM ofpolcob 
WHERE cproces={CPROCES} 
AND ccerti={CCERTI} AND CCOBER = 256;

return;

--SELECT TOP 10 * 
--FROM cobtar t
--inner join ofpolizas o ON o.cproces = t.cproces
--WHERE t.cendoso = 36
--AND o.cramo = 96 AND o.cplan = 'CAR'
--ORDER BY o.cproces DESC

--select * from tarifasvar where variable = 'SUMA_PIVOTE'


declare @ramo int = 6
select CONCAT(@ramo,'-' , REPLACE(rtrim(cplan),CONCAT(@ramo,'_'),'')) Contador, cplan, xplan, istatplan
		, (SELECT COUNT(1) FROM maplancob c where c.cramo = pl.cramo and c.cplan = pl.cplan) Coberturas
		, (SELECT COUNT(1) FROM tarifas t where t.cramo = pl.cramo and t.cplan = pl.cplan and t.cendoso = 36) Tarifas
		, CASE WHEN EXISTS(SELECT 1 FROM adpoliza t where t.cramo = pl.cramo and t.cplan = pl.cplan) THEN 'Si' ELSE 'No' end TienePolizas
		, (SELECT TOP (1) cnpoliza FROM adpoliza t where t.cramo = pl.cramo and t.cplan = pl.cplan) Ejemplo
from maplanes pl
where cramo = @ramo 
--AND pl.istatplan = 'V'
order by 7
--AND cplan NOT IN ('Basico Vid','TAR_PRO2')

select xabreviatura, xdescripcion_l, cramo from maramos where cramo = 52

return;



SELECT cactividad, xactividad, pactividad, ccategoria, Estatus, ISNULL(COD_COBIS,'') COD_COBIS from mactividad 

select * from cobtar where cproces = 	988333 and ccober = '20'
select ccober, pprima, mpridet, mdeduci, msumaaseg, xobserva from ofpolcob where cproces = 988333 --and ccober = '20'
order by ccober
select xsinonimo, rtrim(ccodigo) ccodigo, xdescripcion_l from Macodigos where xsinonimo='cclarie' Order by xdescripcion_l

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

--SELECT distinct substring(cnpoliza,1,7) FROM adpoliza WHERE cramo = 200
SELECT fdesde, fhasta, xasegurado, DATEDIFF(day,fdesde, fhasta) dias,mprimabruta, msumabruta, * 
FROM adpoliza
WHERE cramo = 20 and fanopol = 2025 and cendoso <> 36 and cplan = 'vid-desemp' 
order by cnpoliza, fmespol

select xsinonimo, rtrim(ccodigo) ccodigo, xdescripcion_l from Macodigos where xsinonimo='cclarie' Order by xdescripcion_l

select distinct ccobertura from maplancob c
where c.cramo = 31
and cplan not in ('EG1','EG2','EG3','EG4','EG5')

