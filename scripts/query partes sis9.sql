use GlobalSIS_AG01

go

select p.Nlinea Codigo, p.Descripcion, tp.xdescripcion_l Categoria, 'MOTOR' category
from SisGlobal_AG01..mpartes p
inner join macodigos tp on tp.xsinonimo = 'TIPOLINEA' and tp.iestado = 'V'
AND tp.ccodigo = p.Tipolinea

select tp.xdescripcion_l Categoria, count(1)
from SisGlobal_AG01..mpartes p
inner join macodigos tp on tp.xsinonimo = 'TIPOLINEA' and tp.iestado = 'V'
AND tp.ccodigo = p.Tipolinea
group by tp.xdescripcion_l

use sis11
select parent, count(1)
from dbo.Cpt
group by parent

select top 10 jAffectedObjects, * from LifeCoveragePayout