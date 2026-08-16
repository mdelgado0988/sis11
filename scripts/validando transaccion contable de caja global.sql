use SisGlobal_AG01
GO

SELECT m.NASIPRE, m.Descripcion, m.can1, m.can2, m.can3, m.can4, m.can5, m.can8, m.can9, m.can10, m.can17, d.*
FROM MAUTOCAJA_NET m
inner join DAUTOCAJA_NET d on d.NASIPRE = m.NASIPRE
WHERE m.bcaja = 1 AND m.stat = 'V'
AND m.NASIPRE not in (0,32)
--AND m.nasipre = 23
ORDER BY 1

select * from vartran where nombre = '@pago_vario'

select cbmovcaj_e.*, CASE (select isnull(sum(dsoli_dedu.mnto_ded),0) 
from SisGlobal_AG01.dbo.dsoli_dedu as dsoli_dedu 
where cbmovcaj_e.ccategoriaauto=dsoli_dedu.numesoli and dsoli_dedu.cdgotrandedu=32) 
when 0 then '110.01.01.01.01.00.00.00.000' else '280.01.01.02.02.00.00.00.000' end as cuentad, 
CASE (select isnull(sum(dsoli_dedu.mnto_ded),0)
from SisGlobal_AG01.dbo.dsoli_dedu as dsoli_dedu
where cbmovcaj_e.ccategoriaauto=dsoli_dedu.numesoli and dsoli_dedu.cdgotrandedu=32)
when 0 then '640.01.01.02.00.10.01.00.000' else '280.01.01.02.02.00.00.00.000' end as cuentah 
from cbmovcaj_e where cbmovcaj_e.cpago={0}