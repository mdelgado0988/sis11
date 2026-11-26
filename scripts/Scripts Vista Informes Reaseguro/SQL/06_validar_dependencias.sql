USE [GlobalSIS_AG01];
GO

SELECT o.name AS objeto,
       o.type_desc AS tipo,
       CASE WHEN o.object_id IS NULL THEN 'NO EXISTE' ELSE 'EXISTE' END AS estado
FROM (VALUES
    ('adpoliza'), ('Esta_SumasPol'), ('Esta_SumasCob'), ('maplanes'),
    ('maentes'), ('maentes_ext'), ('mapaises'), ('maestados'), ('maciudades'),
    ('macorregi'), ('mabarriada'), ('macodigos'), ('malimites_perfil'),
    ('maramos'), ('mainsta_dat'), ('matiprie'), ('Proyectos'),
    ('spRea_Polizas_Vigentes'), ('spRea_Cumulos'), ('spRea_Perfil_Cartera'),
    ('fn_getCoberPrinUpgrade'), ('fn_getCoberPrin')
) AS x(nombre)
LEFT JOIN sys.objects o ON o.name = x.nombre
ORDER BY x.nombre;
GO
