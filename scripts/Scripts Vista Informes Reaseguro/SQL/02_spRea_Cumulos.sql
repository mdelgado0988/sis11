/****** Object:  StoredProcedure [dbo].[spRea_Cumulos]    Script Date: 01/30/2018 03:10:18 p.m. ******/
--SET ANSI_NULLS ON
--GO
--SET QUOTED_IDENTIFIER ON
--GO
CREATE PROCEDURE [dbo].[spRea_Cumulos]
	@cramo NVARCHAR(MAX),
	@ctipo INT,
	@bAgrupaRamo BIT=1,
	@p_export BIT,
	@p_ini INT = 0,
	@p_fin INT = 30,
	@p_total INT OUT 
AS
BEGIN

	-- Tabla base de llenado de los datos que se muestra en pantalla
	DECLARE @tb_WWWCumulos TABLE (
		[Id] INT,
		[Ramo] NVARCHAR(255),
		[Descripción] NVARCHAR(255),
		[Cantidad] INT,
		[Suma] NUMERIC(17,2),
		[Suma_Retenida] NUMERIC(17,2),
		[Suma_Cedida] NUMERIC(17,2),
		[Suma_Facultativa] NUMERIC(17,2),
		[Prima] NUMERIC(17,2),
		[Prima_Retenida] NUMERIC(17,2),
		[Prima_Cedida] NUMERIC(17,2),
		[Prima_Facultativa] NUMERIC(17,2),
		[cnpoliza] NVARCHAR(30),
		[casegurado] NUMERIC(18,0),
		[cserie_rea] INT,
		[Estado_FI] CHAR(2),
		[fdesde] DATETIME,
		[fhasta] DATETIME,
		[cbeneficiario] NUMERIC(18,0),
		[NombProy] NVARCHAR(3000),
		[NContrato] NVARCHAR(100),
		[fcoberprin] DATE,
		[ffincober] date,
		[GrupoEconomico] NVARCHAR(1000),
		[Referido] NVARCHAR(1000),
		[Prima_Cat] NUMERIC(17,2)
	);

	DECLARE @cpais INT = (SELECT TOP (1) CAST(cws14 AS INT) FROM dbo.mainsta_dat);
	DECLARE @xpais NVARCHAR(255) = ISNULL((SELECT RTRIM(xdescripcion_l) FROM dbo.mapaises WHERE cpais = @cpais),'');
	DECLARE @WWWRamos TABLE (cramo INT);
	DECLARE @WWWPlanes TABLE (cramo INT, cplan CHAR(10));
	DECLARE @Xml AS XML, @pi_export BIT;	  
	
	SET @Xml = CAST(('<A>'+replace(@cramo,',','</A><A>')+'</A>') AS XML);
	INSERT INTO @WWWRamos SELECT A.value('.', 'INT') as [cramo] FROM @Xml.nodes('A') AS FN(A);
	INSERT INTO @WWWPlanes SELECT pl.cramo, pl.cplan FROM maplanes pl INNER JOIN @WWWRamos w ON pl.cramo = w.cramo;
	
	SET @p_total = 0;	
	SET @pi_export = ISNULL(@p_export, 0);
	IF @p_ini <= 0 BEGIN SET @p_ini = 0; END;
	IF @p_fin <= 0 BEGIN SET @p_fin = 30; END;

	--Resumen por provincias
	IF @ctipo = 1 
	BEGIN
		INSERT INTO @tb_WWWCumulos
		(Id, Ramo, Descripción, Cantidad, Suma, Suma_Retenida, Suma_Cedida, Suma_Facultativa, Prima, Prima_Retenida, Prima_Cedida, Prima_Facultativa, cnpoliza,
		 casegurado, cserie_rea, Estado_FI, fdesde, fhasta, cbeneficiario, NombProy, NContrato, fcoberprin, ffincober, GrupoEconomico, Referido, Prima_Cat)		
		SELECT ROW_NUMBER() OVER (ORDER BY RTRIM(p.xramo), RTRIM(ISNULL(pa.xdescripcion_l,'')) + ' - ' + RTRIM(ISNULL(es.xdescripcion_l,''))) id, 
		RTRIM(p.xramo) AS [Ramo],
			--RTRIM(ISNULL(pa.xdescripcion_l,'')) AS [Pais],
			RTRIM(ISNULL(pa.xdescripcion_l,'')) + ' - ' + RTRIM(ISNULL(es.xdescripcion_l,'')) AS [Descripción],
			COUNT(p.cnpoliza) AS [Cantidad], SUM(p.msumabruta) AS [Suma], SUM(p.msumabrutaRet) AS [Suma_Retenida], SUM(p.msumabrutaCon) AS [Suma_Cedida],
			SUM(p.msumabrutaFac) AS [Suma_Facultativa], SUM(p.mprimabruta) AS [Prima], SUM(p.mprimabrutaRet) AS [Prima_Retenida],
			SUM(p.mprimabrutaCon) AS [Prima_Cedida], SUM(p.mprimabrutaFac) AS [Prima_Facultativa], NULL, 0, 0, NULL, NULL, NULL, 0, NULL NombProy, NULL NContrato
			, NULL fcoberprin, NULL ffincober, Null GrupoEconomico,Null Referido, SUM(p.mprimabrutaCat) [PrimaCat]
		FROM
			dbo.Esta_SumasPol p
			INNER JOIN @WWWPlanes w ON p.cramo = w.cramo AND p.cplan = w.cplan 
			INNER JOIN dbo.adpoliza pol ON p.cpoliza = pol.cpoliza AND p.fanopol = pol.fanopol AND p.fmespol = pol.fmespol
			INNER JOIN dbo.maplanes pl ON pol.cramo = pl.cramo AND pol.cplan = pl.cplan
			INNER JOIN dbo.maentes ten ON pol.ctenedor = ten.cci_rif
			LEFT JOIN dbo.mapaises pa ON p.cpais = pa.cpais
			LEFT JOIN dbo.maestados es ON p.cpais = es.cpais AND p.cestado = es.cestado
			LEFT JOIN dbo.maciudades ci ON p.cpais = ci.cpais AND p.cestado = ci.cestado AND p.cciudad = ci.cciudad
			LEFT JOIN dbo.macorregi co ON p.cpais = co.cpais AND p.cestado = co.cestado AND p.cciudad = co.cciudad AND p.ccorregi = co.ccorregi
			LEFT JOIN dbo.mabarriada ba ON p.cpais = ba.cpais AND p.cestado = ba.cestado AND p.cciudad = ba.cciudad AND p.ccorregi = ba.ccorregi AND p.cbarriada = ba.cbarriada
			LEFT JOIN dbo.malimites_perfil ran ON ran.ctipo = 1 
				AND CASE WHEN p.ctiporamo = 7 THEN p.FI_TipoFianza ELSE p.cramo END = CASE WHEN p.ctiporamo = 7 THEN ran.ctipofianza ELSE ran.cramo END 
				AND p.id_rango_suma = ran.id
		GROUP BY RTRIM(p.xramo), RTRIM(ISNULL(pa.xdescripcion_l,'')) + ' - ' + RTRIM(ISNULL(es.xdescripcion_l,''))
		ORDER BY RTRIM(p.xramo), RTRIM(ISNULL(pa.xdescripcion_l,'')) + ' - ' + RTRIM(ISNULL(es.xdescripcion_l,''));

		INSERT INTO @tb_WWWCumulos
		(Id, Ramo, Descripción, Cantidad, Suma, Suma_Retenida, Suma_Cedida, Suma_Facultativa, Prima, Prima_Retenida, Prima_Cedida, Prima_Facultativa, cnpoliza,
		 casegurado, cserie_rea, Estado_FI, fdesde, fhasta, cbeneficiario, NombProy, NContrato, fcoberprin, ffincober, GrupoEconomico, Referido, Prima_Cat)		
		SELECT 0 id, RTRIM(ram.xdescripcion_l), RTRIM(pa.xdescripcion_l) + ' - ' + RTRIM(es.xdescripcion_l), 0, 0, 0, 0, 0, 0, 0, 0, 0,  NULL, 0, 0, NULL, NULL, NULL, 0, 
		NULL NombProy, NULL NContrato, NULL fcoberprin, NULL ffincober,Null GrupoEconomico,Null Referido, 0
		FROM dbo.maramos ram, dbo.mapaises pa 
			LEFT JOIN maestados es ON pa.cpais = es.cpais
			LEFT JOIN @tb_WWWCumulos w ON RTRIM(pa.xdescripcion_l) + ' - ' + RTRIM(es.xdescripcion_l) COLLATE Modern_Spanish_CI_AS = w.[Descripción] COLLATE Modern_Spanish_CI_AS
		WHERE ram.cramo IN (SELECT cramo FROM @WWWRamos) AND es.cpais = @cpais AND w.[Descripción] IS NULL;

		SET @p_total = (SELECT COUNT(*) FROM @tb_WWWCumulos);
	END

	--Resumen por zona cresta
	IF @ctipo = 2 
	BEGIN
		INSERT INTO @tb_WWWCumulos 
		SELECT ROW_NUMBER() OVER (ORDER BY RTRIM(p.xramo), RTRIM(ISNULL(pa.xdescripcion_l,'')) + ' - ' + RTRIM(ISNULL(p.xriesgo,''))) id,
			RTRIM(p.xramo) AS [Ramo],
			--RTRIM(ISNULL(pa.xdescripcion_l,'')) AS [Pais],
			RTRIM(ISNULL(pa.xdescripcion_l,'')) + ' - ' + RTRIM(ISNULL(p.xriesgo,'')) AS [Descripción],
			COUNT(p.cnpoliza) AS [Cantidad],
			SUM(p.msumabruta) AS [Suma],
			SUM(p.msumabrutaRet) AS [Suma_Retenida],
			SUM(p.msumabrutaCon) AS [Suma_Cedida],
			SUM(p.msumabrutaFac) AS [Suma_Facultativa],
			SUM(p.mprimabruta) AS [Prima],
			SUM(p.mprimabrutaRet) AS [Prima_Retenida],
			SUM(p.mprimabrutaCon) AS [Prima_Cedida],
			SUM(p.mprimabrutaFac) AS [Prima_Facultativa],  NULL, 0, 0, NULL, NULL, NULL, 0, NULL NombProy, NULL NContrato, NULL fcoberprin, NULL ffincober,Null GrupoEconomico,Null Referido
			, SUM(p.mprimabrutaCat) [PrimaCat]
		FROM
			Esta_SumasPol p
			INNER JOIN @WWWPlanes w ON p.cramo = w.cramo AND p.cplan = w.cplan 
			INNER JOIN adpoliza pol ON p.cpoliza = pol.cpoliza AND p.fanopol = pol.fanopol AND p.fmespol = pol.fmespol
			INNER JOIN maplanes pl ON pol.cramo = pl.cramo AND pol.cplan = pl.cplan
			INNER JOIN maentes ten ON pol.ctenedor = ten.cci_rif
			LEFT JOIN mapaises pa ON p.cpais = pa.cpais
			LEFT JOIN maestados es ON p.cpais = es.cpais AND p.cestado = es.cestado
			LEFT JOIN maciudades ci ON p.cpais = ci.cpais AND p.cestado = ci.cestado AND p.cciudad = ci.cciudad
			LEFT JOIN macorregi co ON p.cpais = co.cpais AND p.cestado = co.cestado AND p.cciudad = co.cciudad AND p.ccorregi = co.ccorregi
			LEFT JOIN mabarriada ba ON p.cpais = ba.cpais AND p.cestado = ba.cestado AND p.cciudad = ba.cciudad AND p.ccorregi = ba.ccorregi AND p.cbarriada = ba.cbarriada
			LEFT JOIN malimites_perfil ran ON 
				ran.ctipo = 1 
				AND CASE WHEN p.ctiporamo = 7 THEN p.FI_TipoFianza ELSE p.cramo END = CASE WHEN p.ctiporamo = 7 THEN ran.ctipofianza ELSE ran.cramo END 
				AND p.id_rango_suma = ran.id
		GROUP BY RTRIM(p.xramo), RTRIM(ISNULL(pa.xdescripcion_l,'')) + ' - ' + RTRIM(ISNULL(p.xriesgo,''))
		ORDER BY RTRIM(p.xramo), RTRIM(ISNULL(pa.xdescripcion_l,'')) + ' - ' + RTRIM(ISNULL(p.xriesgo,''));

		INSERT INTO @tb_WWWCumulos
		SELECT 	0 id, RTRIM(ram.xdescripcion_l), @xpais + ' - ' + RTRIM(tr.xriesgo),	0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, NULL, NULL, NULL, 0, 
		NULL NombProy, NULL NContrato, NULL fcoberprin, NULL ffincober,Null GrupoEconomico,Null Referido, 0
		FROM maramos ram, matiprie tr
			LEFT JOIN @tb_WWWCumulos w ON @xpais + ' - ' + RTRIM(tr.xriesgo) COLLATE Modern_Spanish_CI_AS = w.[Descripción] COLLATE Modern_Spanish_CI_AS
		WHERE ram.cramo IN (SELECT cramo FROM @WWWRamos) AND w.[Descripción] IS NULL;

		SET @p_total = (SELECT COUNT(*) FROM @tb_WWWCumulos);
	END

	--Resumen por planes
	IF @ctipo = 3 
	BEGIN
		INSERT INTO @tb_WWWCumulos 
		SELECT * FROM (SELECT ROW_NUMBER() OVER (ORDER BY RTRIM(p.xramo), RTRIM(ISNULL(pl.xplan,''))) Id,
			RTRIM(p.xramo) AS [Ramo],
			RTRIM(ISNULL(pl.xplan,'')) AS [Descripción],
			COUNT(p.cnpoliza) AS [Cantidad],
			SUM(p.msumabruta) AS [Suma],
			SUM(p.msumabrutaRet) AS [Suma_Retenida],
			SUM(p.msumabrutaCon) AS [Suma_Cedida],
			SUM(p.msumabrutaFac) AS [Suma_Facultativa],
			SUM(p.mprimabruta) AS [Prima],
			SUM(p.mprimabrutaRet) AS [Prima_Retenida],
			SUM(p.mprimabrutaCon) AS [Prima_Cedida],
			SUM(p.mprimabrutaFac) AS [Prima_Facultativa],  NULL cnpoliza, 0 casegurado, 0 serierea, NULL estadoFI, NULL fdesde, NULL fhasta, 0 cbeneficiario
			, NULL NombProy, NULL NContrato, NULL fcoberprin, NULL ffincober, Null GrupoEconomico,Null Referido,SUM(p.mprimabrutaCat) [PrimaCat]
		FROM
			Esta_SumasPol p
			INNER JOIN @WWWPlanes w ON p.cramo = w.cramo AND p.cplan = w.cplan 
			INNER JOIN adpoliza pol ON p.cpoliza = pol.cpoliza AND p.fanopol = pol.fanopol AND p.fmespol = pol.fmespol
			INNER JOIN maplanes pl ON pol.cramo = pl.cramo AND pol.cplan = pl.cplan
			INNER JOIN maentes ten ON pol.ctenedor = ten.cci_rif
			LEFT JOIN mapaises pa ON p.cpais = pa.cpais
			LEFT JOIN maestados es ON p.cpais = es.cpais AND p.cestado = es.cestado
			LEFT JOIN maciudades ci ON p.cpais = ci.cpais AND p.cestado = ci.cestado AND p.cciudad = ci.cciudad
			LEFT JOIN macorregi co ON p.cpais = co.cpais AND p.cestado = co.cestado AND p.cciudad = co.cciudad AND p.ccorregi = co.ccorregi
			LEFT JOIN mabarriada ba ON p.cpais = ba.cpais AND p.cestado = ba.cestado AND p.cciudad = ba.cciudad AND p.ccorregi = ba.ccorregi AND p.cbarriada = ba.cbarriada
			LEFT JOIN malimites_perfil ran ON 
				ran.ctipo = 1 
				AND CASE WHEN p.ctiporamo = 7 THEN p.FI_TipoFianza ELSE p.cramo END = CASE WHEN p.ctiporamo = 7 THEN ran.ctipofianza ELSE ran.cramo END 
				AND p.id_rango_suma = ran.id
		GROUP BY RTRIM(p.xramo), RTRIM(ISNULL(pl.xplan,''))
		--ORDER BY RTRIM(p.xramo), RTRIM(ISNULL(pl.xplan,''))
		) xr WHERE 1=@pi_export OR (id > @p_ini AND id <= (@p_ini + @p_fin) );
	
		SET @p_total = (SELECT COUNT(*) FROM (SELECT COUNT(p.cnpoliza) AS [Cantidad],
			SUM(p.msumabruta) AS [Suma],
			SUM(p.msumabrutaRet) AS [Suma_Retenida],
			SUM(p.msumabrutaCon) AS [Suma_Cedida],
			SUM(p.msumabrutaFac) AS [Suma_Facultativa],
			SUM(p.mprimabruta) AS [Prima],
			SUM(p.mprimabrutaRet) AS [Prima_Retenida],
			SUM(p.mprimabrutaCon) AS [Prima_Cedida],
			SUM(p.mprimabrutaFac) AS [Prima_Facultativa],
			SUM(p.mprimabrutaCat) [PrimaCat]
		FROM
			Esta_SumasPol p
			INNER JOIN @WWWPlanes w ON p.cramo = w.cramo AND p.cplan = w.cplan 
			INNER JOIN adpoliza pol ON p.cpoliza = pol.cpoliza AND p.fanopol = pol.fanopol AND p.fmespol = pol.fmespol
			INNER JOIN maplanes pl ON pol.cramo = pl.cramo AND pol.cplan = pl.cplan
			INNER JOIN maentes ten ON pol.ctenedor = ten.cci_rif
			LEFT JOIN mapaises pa ON p.cpais = pa.cpais
			LEFT JOIN maestados es ON p.cpais = es.cpais AND p.cestado = es.cestado
			LEFT JOIN maciudades ci ON p.cpais = ci.cpais AND p.cestado = ci.cestado AND p.cciudad = ci.cciudad
			LEFT JOIN macorregi co ON p.cpais = co.cpais AND p.cestado = co.cestado AND p.cciudad = co.cciudad AND p.ccorregi = co.ccorregi
			LEFT JOIN mabarriada ba ON p.cpais = ba.cpais AND p.cestado = ba.cestado AND p.cciudad = ba.cciudad AND p.ccorregi = ba.ccorregi AND p.cbarriada = ba.cbarriada
			LEFT JOIN malimites_perfil ran ON 
				ran.ctipo = 1 
				AND CASE WHEN p.ctiporamo = 7 THEN p.FI_TipoFianza ELSE p.cramo END = CASE WHEN p.ctiporamo = 7 THEN ran.ctipofianza ELSE ran.cramo END 
				AND p.id_rango_suma = ran.id
		GROUP BY RTRIM(p.xramo), RTRIM(ISNULL(pl.xplan,''))	) xr);
	END

	--Resumen por barriadas
	IF @ctipo = 4 BEGIN
		INSERT INTO @tb_WWWCumulos 
		SELECT * FROM (SELECT ROW_NUMBER() OVER (ORDER BY RTRIM(p.xramo), RTRIM(ISNULL(ba.xdescripcion_l,''))) Id,
			RTRIM(p.xramo) AS [Ramo],
			RTRIM(ISNULL(ba.xdescripcion_l,'')) AS [Descripción],
			COUNT(p.cnpoliza) AS [Cantidad],
			SUM(p.msumabruta) AS [Suma],
			SUM(p.msumabrutaRet) AS [Suma_Retenida],
			SUM(p.msumabrutaCon) AS [Suma_Cedida],
			SUM(p.msumabrutaFac) AS [Suma_Facultativa],
			SUM(p.mprimabruta) AS [Prima],
			SUM(p.mprimabrutaRet) AS [Prima_Retenida],
			SUM(p.mprimabrutaCon) AS [Prima_Cedida],
			SUM(p.mprimabrutaFac) AS [Prima_Facultativa],  NULL cnpoliza, 0 casegurado, 0 serierea, NULL estadoFI, NULL fdesde, NULL fhasta, 0 cbeneficiario
			, NULL NombProy, NULL NContrato, NULL fcoberprin, NULL ffincober, Null GrupoEconomico,Null Referido, SUM(p.mprimabrutaCat) [PrimaCat]
		FROM
			Esta_SumasPol p
			INNER JOIN @WWWPlanes w ON p.cramo = w.cramo AND p.cplan = w.cplan 
			INNER JOIN adpoliza pol ON p.cpoliza = pol.cpoliza AND p.fanopol = pol.fanopol AND p.fmespol = pol.fmespol
			INNER JOIN maplanes pl ON pol.cramo = pl.cramo AND pol.cplan = pl.cplan
			INNER JOIN maentes ten ON pol.ctenedor = ten.cci_rif
			LEFT JOIN mapaises pa ON p.cpais = pa.cpais
			LEFT JOIN maestados es ON p.cpais = es.cpais AND p.cestado = es.cestado
			LEFT JOIN maciudades ci ON p.cpais = ci.cpais AND p.cestado = ci.cestado AND p.cciudad = ci.cciudad
			LEFT JOIN macorregi co ON p.cpais = co.cpais AND p.cestado = co.cestado AND p.cciudad = co.cciudad AND p.ccorregi = co.ccorregi
			LEFT JOIN mabarriada ba ON p.cpais = ba.cpais AND p.cestado = ba.cestado AND p.cciudad = ba.cciudad AND p.ccorregi = ba.ccorregi AND p.cbarriada = ba.cbarriada
			LEFT JOIN malimites_perfil ran ON 
				ran.ctipo = 1 
				AND CASE WHEN p.ctiporamo = 7 THEN p.FI_TipoFianza ELSE p.cramo END = CASE WHEN p.ctiporamo = 7 THEN ran.ctipofianza ELSE ran.cramo END 
				AND p.id_rango_suma = ran.id
		GROUP BY RTRIM(p.xramo), RTRIM(ISNULL(ba.xdescripcion_l,''))
		--ORDER BY RTRIM(p.xramo), RTRIM(ISNULL(ba.xdescripcion_l,''))
		) xr WHERE 1=@pi_export OR (id > @p_ini AND id <= (@p_ini + @p_fin) );
		
		SET @p_total = (SELECT COUNT(*) FROM (SELECT COUNT(p.cnpoliza) AS [Cantidad],
					SUM(p.msumabruta) AS [Suma],
					SUM(p.msumabrutaRet) AS [Suma_Retenida],
					SUM(p.msumabrutaCon) AS [Suma_Cedida],
					SUM(p.msumabrutaFac) AS [Suma_Facultativa],
					SUM(p.mprimabruta) AS [Prima],
					SUM(p.mprimabrutaRet) AS [Prima_Retenida],
					SUM(p.mprimabrutaCon) AS [Prima_Cedida],
					SUM(p.mprimabrutaFac) AS [Prima_Facultativa],
					SUM(p.mprimabrutaCat) [PrimaCat]
				FROM
					Esta_SumasPol p
					INNER JOIN @WWWPlanes w ON p.cramo = w.cramo AND p.cplan = w.cplan 
					INNER JOIN adpoliza pol ON p.cpoliza = pol.cpoliza AND p.fanopol = pol.fanopol AND p.fmespol = pol.fmespol
					INNER JOIN maplanes pl ON pol.cramo = pl.cramo AND pol.cplan = pl.cplan
					INNER JOIN maentes ten ON pol.ctenedor = ten.cci_rif
					LEFT JOIN mapaises pa ON p.cpais = pa.cpais
					LEFT JOIN maestados es ON p.cpais = es.cpais AND p.cestado = es.cestado
					LEFT JOIN maciudades ci ON p.cpais = ci.cpais AND p.cestado = ci.cestado AND p.cciudad = ci.cciudad
					LEFT JOIN macorregi co ON p.cpais = co.cpais AND p.cestado = co.cestado AND p.cciudad = co.cciudad AND p.ccorregi = co.ccorregi
					LEFT JOIN mabarriada ba ON p.cpais = ba.cpais AND p.cestado = ba.cestado AND p.cciudad = ba.cciudad AND p.ccorregi = ba.ccorregi AND p.cbarriada = ba.cbarriada
					LEFT JOIN malimites_perfil ran ON 
						ran.ctipo = 1 
						AND CASE WHEN p.ctiporamo = 7 THEN p.FI_TipoFianza ELSE p.cramo END = CASE WHEN p.ctiporamo = 7 THEN ran.ctipofianza ELSE ran.cramo END 
						AND p.id_rango_suma = ran.id
				GROUP BY RTRIM(p.xramo), RTRIM(ISNULL(ba.xdescripcion_l,''))		
				) xr);
	END

	--Resumen por edificio
	IF @ctipo = 5 BEGIN
		INSERT INTO @tb_WWWCumulos 
		SELECT * FROM (SELECT ROW_NUMBER() OVER (ORDER BY RTRIM(p.xramo), RTRIM(ISNULL(p.NB_edificio,''))) id,
			RTRIM(p.xramo) AS [Ramo],
			RTRIM(ISNULL(p.NB_edificio,'')) AS [Descripción],
			COUNT(p.cnpoliza) AS [Cantidad],
			SUM(p.msumabruta) AS [Suma],
			SUM(p.msumabrutaRet) AS [Suma_Retenida],
			SUM(p.msumabrutaCon) AS [Suma_Cedida],
			SUM(p.msumabrutaFac) AS [Suma_Facultativa],
			SUM(p.mprimabruta) AS [Prima],
			SUM(p.mprimabrutaRet) AS [Prima_Retenida],
			SUM(p.mprimabrutaCon) AS [Prima_Cedida],
			SUM(p.mprimabrutaFac) AS [Prima_Facultativa],  NULL cnpoliza, 0 casegurado, 0 serierea, NULL estadoFI, NULL fdesde, NULL fhasta, 0 cbeneficiario
			, NULL NombProy, NULL NContrato, NULL fcoberprin, NULL ffincober, Null GrupoEconomico,Null Referido, SUM(p.mprimabrutaCat) [PrimaCat]
		FROM
			Esta_SumasPol p
			INNER JOIN @WWWPlanes w ON p.cramo = w.cramo AND p.cplan = w.cplan 
			INNER JOIN adpoliza pol ON p.cpoliza = pol.cpoliza AND p.fanopol = pol.fanopol AND p.fmespol = pol.fmespol
			INNER JOIN maplanes pl ON pol.cramo = pl.cramo AND pol.cplan = pl.cplan
			INNER JOIN maentes ten ON pol.ctenedor = ten.cci_rif
			LEFT JOIN mapaises pa ON p.cpais = pa.cpais
			LEFT JOIN maestados es ON p.cpais = es.cpais AND p.cestado = es.cestado
			LEFT JOIN maciudades ci ON p.cpais = ci.cpais AND p.cestado = ci.cestado AND p.cciudad = ci.cciudad
			LEFT JOIN macorregi co ON p.cpais = co.cpais AND p.cestado = co.cestado AND p.cciudad = co.cciudad AND p.ccorregi = co.ccorregi
			LEFT JOIN mabarriada ba ON p.cpais = ba.cpais AND p.cestado = ba.cestado AND p.cciudad = ba.cciudad AND p.ccorregi = ba.ccorregi AND p.cbarriada = ba.cbarriada
			LEFT JOIN malimites_perfil ran ON 
				ran.ctipo = 1 
				AND CASE WHEN p.ctiporamo = 7 THEN p.FI_TipoFianza ELSE p.cramo END = CASE WHEN p.ctiporamo = 7 THEN ran.ctipofianza ELSE ran.cramo END 
				AND p.id_rango_suma = ran.id
		GROUP BY RTRIM(p.xramo), RTRIM(ISNULL(p.NB_edificio,''))
		--ORDER BY RTRIM(p.xramo), RTRIM(ISNULL(p.NB_edificio,''))
		) xr WHERE 1=@pi_export OR (id > @p_ini AND id <= (@p_ini + @p_fin) );

		SET @p_total = (SELECT COUNT(*) FROM (SELECT COUNT(p.cnpoliza) AS [Cantidad],
						SUM(p.msumabruta) AS [Suma],
						SUM(p.msumabrutaRet) AS [Suma_Retenida],
						SUM(p.msumabrutaCon) AS [Suma_Cedida],
						SUM(p.msumabrutaFac) AS [Suma_Facultativa],
						SUM(p.mprimabruta) AS [Prima],
						SUM(p.mprimabrutaRet) AS [Prima_Retenida],
						SUM(p.mprimabrutaCon) AS [Prima_Cedida],
						SUM(p.mprimabrutaFac) AS [Prima_Facultativa],
						SUM(p.mprimabrutaCat) [PrimaCat]
					FROM
						Esta_SumasPol p
						INNER JOIN @WWWPlanes w ON p.cramo = w.cramo AND p.cplan = w.cplan 
						INNER JOIN adpoliza pol ON p.cpoliza = pol.cpoliza AND p.fanopol = pol.fanopol AND p.fmespol = pol.fmespol
						INNER JOIN maplanes pl ON pol.cramo = pl.cramo AND pol.cplan = pl.cplan
						INNER JOIN maentes ten ON pol.ctenedor = ten.cci_rif
						LEFT JOIN mapaises pa ON p.cpais = pa.cpais
						LEFT JOIN maestados es ON p.cpais = es.cpais AND p.cestado = es.cestado
						LEFT JOIN maciudades ci ON p.cpais = ci.cpais AND p.cestado = ci.cestado AND p.cciudad = ci.cciudad
						LEFT JOIN macorregi co ON p.cpais = co.cpais AND p.cestado = co.cestado AND p.cciudad = co.cciudad AND p.ccorregi = co.ccorregi
						LEFT JOIN mabarriada ba ON p.cpais = ba.cpais AND p.cestado = ba.cestado AND p.cciudad = ba.cciudad AND p.ccorregi = ba.ccorregi AND p.cbarriada = ba.cbarriada
						LEFT JOIN malimites_perfil ran ON 
							ran.ctipo = 1 
							AND CASE WHEN p.ctiporamo = 7 THEN p.FI_TipoFianza ELSE p.cramo END = CASE WHEN p.ctiporamo = 7 THEN ran.ctipofianza ELSE ran.cramo END 
							AND p.id_rango_suma = ran.id
					GROUP BY RTRIM(p.xramo), RTRIM(ISNULL(p.NB_edificio,''))
					) xr);
	END

	--Resumen por tarifa
	IF @ctipo = 6 
	BEGIN
		INSERT INTO @tb_WWWCumulos 
		SELECT ROW_NUMBER() OVER (ORDER BY RTRIM(p.xramo), CASE WHEN (CASE WHEN p.msumabruta = 0 THEN 0 ELSE ROUND(p.mprimabruta/p.msumabruta*100,2) END) < 0.16 THEN 'residencial' ELSE 'comercial' END) Id
			,RTRIM(p.xramo) AS [Ramo],
			CASE WHEN (CASE WHEN p.msumabruta = 0 THEN 0 ELSE ROUND(p.mprimabruta/p.msumabruta*100,2) END) < 0.16 THEN 'residencial' ELSE 'comercial' END AS [Descripción],
			COUNT(p.cnpoliza) AS [Cantidad],
			SUM(p.msumabruta) AS [Suma],
			SUM(p.msumabrutaRet) AS [Suma_Retenida],
			SUM(p.msumabrutaCon) AS [Suma_Cedida],
			SUM(p.msumabrutaFac) AS [Suma_Facultativa],
			SUM(p.mprimabruta) AS [Prima],
			SUM(p.mprimabrutaRet) AS [Prima_Retenida],
			SUM(p.mprimabrutaCon) AS [Prima_Cedida],
			SUM(p.mprimabrutaFac) AS [Prima_Facultativa],  NULL, 0, 0, NULL, NULL, NULL, 0, NULL NombProy, NULL NContrato, NULL fcoberprin, NULL ffincober, Null GrupoEconomico,Null Referido
			, SUM(p.mprimabrutaCat) [PrimaCat]
		FROM
			Esta_SumasPol p
			INNER JOIN @WWWPlanes w ON p.cramo = w.cramo AND p.cplan = w.cplan 
			INNER JOIN adpoliza pol ON p.cpoliza = pol.cpoliza AND p.fanopol = pol.fanopol AND p.fmespol = pol.fmespol
			INNER JOIN maplanes pl ON pol.cramo = pl.cramo AND pol.cplan = pl.cplan
			INNER JOIN maentes ten ON pol.ctenedor = ten.cci_rif
			LEFT JOIN mapaises pa ON p.cpais = pa.cpais
			LEFT JOIN maestados es ON p.cpais = es.cpais AND p.cestado = es.cestado
			LEFT JOIN maciudades ci ON p.cpais = ci.cpais AND p.cestado = ci.cestado AND p.cciudad = ci.cciudad
			LEFT JOIN macorregi co ON p.cpais = co.cpais AND p.cestado = co.cestado AND p.cciudad = co.cciudad AND p.ccorregi = co.ccorregi
			LEFT JOIN mabarriada ba ON p.cpais = ba.cpais AND p.cestado = ba.cestado AND p.cciudad = ba.cciudad AND p.ccorregi = ba.ccorregi AND p.cbarriada = ba.cbarriada
			LEFT JOIN malimites_perfil ran ON 
				ran.ctipo = 1 
				AND CASE WHEN p.ctiporamo = 7 THEN p.FI_TipoFianza ELSE p.cramo END = CASE WHEN p.ctiporamo = 7 THEN ran.ctipofianza ELSE ran.cramo END 
				AND p.id_rango_suma = ran.id
		GROUP BY RTRIM(p.xramo), CASE WHEN (CASE WHEN p.msumabruta = 0 THEN 0 ELSE ROUND(p.mprimabruta/p.msumabruta*100,2) END) < 0.16 THEN 'residencial' ELSE 'comercial' END
		ORDER BY RTRIM(p.xramo), CASE WHEN (CASE WHEN p.msumabruta = 0 THEN 0 ELSE ROUND(p.mprimabruta/p.msumabruta*100,2) END) < 0.16 THEN 'residencial' ELSE 'comercial' END;

		SET @p_total = (SELECT COUNT(*) FROM @tb_WWWCumulos);
	END

	--Resumen por cliente
	IF @ctipo = 7 
	BEGIN
		INSERT INTO @tb_WWWCumulos 
		SELECT * FROM (
		SELECT ROW_NUMBER() OVER (ORDER BY RTRIM(p.xramo), RTRIM(ten.xcliente)) id,
			RTRIM(p.xramo) AS [Ramo],
			RTRIM(ten.xcliente) AS [Descripción],
			COUNT(p.cnpoliza) AS [Cantidad],
			SUM(p.msumabruta) AS [Suma],
			SUM(p.msumabrutaRet) AS [Suma_Retenida],
			SUM(p.msumabrutaCon) AS [Suma_Cedida],
			SUM(p.msumabrutaFac) AS [Suma_Facultativa],
			SUM(p.mprimabruta) AS [Prima],
			SUM(p.mprimabrutaRet) AS [Prima_Retenida],
			SUM(p.mprimabrutaCon) AS [Prima_Cedida],
			SUM(p.mprimabrutaFac) AS [Prima_Facultativa],  pol.cnpoliza, 0 casegurado, 0 serierea, NULL estadoFI, NULL fdesde, NULL fhasta, 0 cbeneficiario
			, NULL NombProy, NULL NContrato, NULL fcoberprin, NULL ffincober, Null GrupoEconomico,Null Referido,SUM(p.mprimabrutaCat) [PrimaCat]
		FROM
			Esta_SumasPol p
			INNER JOIN @WWWPlanes w ON p.cramo = w.cramo AND p.cplan = w.cplan 
			INNER JOIN adpoliza pol ON p.cpoliza = pol.cpoliza AND p.fanopol = pol.fanopol AND p.fmespol = pol.fmespol
			INNER JOIN maplanes pl ON pol.cramo = pl.cramo AND pol.cplan = pl.cplan
			INNER JOIN maentes ten ON pol.ctenedor = ten.cci_rif			
			LEFT JOIN mapaises pa ON p.cpais = pa.cpais
			LEFT JOIN maestados es ON p.cpais = es.cpais AND p.cestado = es.cestado
			LEFT JOIN maciudades ci ON p.cpais = ci.cpais AND p.cestado = ci.cestado AND p.cciudad = ci.cciudad
			LEFT JOIN macorregi co ON p.cpais = co.cpais AND p.cestado = co.cestado AND p.cciudad = co.cciudad AND p.ccorregi = co.ccorregi
			LEFT JOIN mabarriada ba ON p.cpais = ba.cpais AND p.cestado = ba.cestado AND p.cciudad = ba.cciudad AND p.ccorregi = ba.ccorregi AND p.cbarriada = ba.cbarriada
			LEFT JOIN malimites_perfil ran ON ran.ctipo = 1 
				AND CASE WHEN p.ctiporamo = 7 THEN p.FI_TipoFianza ELSE p.cramo END = CASE WHEN p.ctiporamo = 7 THEN ran.ctipofianza ELSE ran.cramo END 
				AND p.id_rango_suma = ran.id
		GROUP BY RTRIM(p.xramo), RTRIM(ten.xcliente),pol.cnpoliza	
		) xr WHERE 1=@pi_export OR (id > @p_ini AND id <= (@p_ini + @p_fin) ) 
		
		SET @p_total = (SELECT COUNT(*)  FROM (SELECT	COUNT(p.cnpoliza) AS [Cantidad],
								SUM(p.msumabruta) AS [Suma],
								SUM(p.msumabrutaRet) AS [Suma_Retenida],
								SUM(p.msumabrutaCon) AS [Suma_Cedida],
								SUM(p.msumabrutaFac) AS [Suma_Facultativa],
								SUM(p.mprimabruta) AS [Prima],
								SUM(p.mprimabrutaRet) AS [Prima_Retenida],
								SUM(p.mprimabrutaCon) AS [Prima_Cedida],
								SUM(p.mprimabrutaFac) AS [Prima_Facultativa],
								SUM(p.mprimabrutaCat) [PrimaCat]
						FROM
						Esta_SumasPol p
						INNER JOIN @WWWPlanes w ON p.cramo = w.cramo AND p.cplan = w.cplan 
						INNER JOIN adpoliza pol ON p.cpoliza = pol.cpoliza AND p.fanopol = pol.fanopol AND p.fmespol = pol.fmespol
						INNER JOIN maplanes pl ON pol.cramo = pl.cramo AND pol.cplan = pl.cplan
						INNER JOIN maentes ten ON pol.ctenedor = ten.cci_rif
						LEFT JOIN mapaises pa ON p.cpais = pa.cpais
						LEFT JOIN maestados es ON p.cpais = es.cpais AND p.cestado = es.cestado
						LEFT JOIN maciudades ci ON p.cpais = ci.cpais AND p.cestado = ci.cestado AND p.cciudad = ci.cciudad
						LEFT JOIN macorregi co ON p.cpais = co.cpais AND p.cestado = co.cestado AND p.cciudad = co.cciudad AND p.ccorregi = co.ccorregi
						LEFT JOIN mabarriada ba ON p.cpais = ba.cpais AND p.cestado = ba.cestado AND p.cciudad = ba.cciudad AND p.ccorregi = ba.ccorregi AND p.cbarriada = ba.cbarriada
						LEFT JOIN malimites_perfil ran ON 
							ran.ctipo = 1 
							AND CASE WHEN p.ctiporamo = 7 THEN p.FI_TipoFianza ELSE p.cramo END = CASE WHEN p.ctiporamo = 7 THEN ran.ctipofianza ELSE ran.cramo END 
							AND p.id_rango_suma = ran.id
					GROUP BY RTRIM(p.xramo), RTRIM(ten.xcliente)) xret);

	END

	--Resumen por grupo economico
	IF @ctipo = 8 
	BEGIN

		INSERT INTO @tb_WWWCumulos 
		SELECT ROW_NUMBER() OVER (ORDER BY RTRIM(p.xramo), RTRIM(ISNULL(grupoeco.xcliente,''))) id,
			RTRIM(p.xramo) AS [Ramo],
			RTRIM(ISNULL(grupoeco.xcliente,'')) AS [Descripción],
			COUNT(p.cnpoliza) AS [Cantidad],
			SUM(p.msumabruta) AS [Suma],
			SUM(p.msumabrutaRet) AS [Suma_Retenida],
			SUM(p.msumabrutaCon) AS [Suma_Cedida],
			SUM(p.msumabrutaFac) AS [Suma_Facultativa],
			SUM(p.mprimabruta) AS [Prima],
			SUM(p.mprimabrutaRet) AS [Prima_Retenida],
			SUM(p.mprimabrutaCon) AS [Prima_Cedida],
			SUM(p.mprimabrutaFac) AS [Prima_Facultativa],  NULL, 0, 0, NULL, NULL, NULL, 0, NULL NombProy, NULL NContrato, NULL fcoberprin, NULL ffincober, Null GrupoEconomico,Null Referido
			, SUM(p.mprimabrutaCat) [PrimaCat]
		FROM
			Esta_SumasPol p
			INNER JOIN @WWWPlanes w ON p.cramo = w.cramo AND p.cplan = w.cplan 
			INNER JOIN adpoliza pol ON p.cpoliza = pol.cpoliza AND p.fanopol = pol.fanopol AND p.fmespol = pol.fmespol
			INNER JOIN maplanes pl ON pol.cramo = pl.cramo AND pol.cplan = pl.cplan
			INNER JOIN maentes ten ON pol.ctenedor = ten.cci_rif
			LEFT JOIN mapaises pa ON p.cpais = pa.cpais
			LEFT JOIN maestados es ON p.cpais = es.cpais AND p.cestado = es.cestado
			LEFT JOIN maciudades ci ON p.cpais = ci.cpais AND p.cestado = ci.cestado AND p.cciudad = ci.cciudad
			LEFT JOIN macorregi co ON p.cpais = co.cpais AND p.cestado = co.cestado AND p.cciudad = co.cciudad AND p.ccorregi = co.ccorregi
			LEFT JOIN mabarriada ba ON p.cpais = ba.cpais AND p.cestado = ba.cestado AND p.cciudad = ba.cciudad AND p.ccorregi = ba.ccorregi AND p.cbarriada = ba.cbarriada
			LEFT JOIN malimites_perfil ran ON 
				ran.ctipo = 1 
				AND CASE WHEN p.ctiporamo = 7 THEN p.FI_TipoFianza ELSE p.cramo END = CASE WHEN p.ctiporamo = 7 THEN ran.ctipofianza ELSE ran.cramo END 
				AND p.id_rango_suma = ran.id
			LEFT JOIN maentes grupoeco ON ten.cgrupoecono = grupoeco.cci_rif
		GROUP BY RTRIM(p.xramo), RTRIM(ISNULL(grupoeco.xcliente,''))
		ORDER BY RTRIM(p.xramo), RTRIM(ISNULL(grupoeco.xcliente,''));

		SET @p_total = (SELECT COUNT(*) FROM @tb_WWWCumulos);
	END

	--Resumen por tipo de fianza
	IF @ctipo = 9 
	BEGIN
		INSERT INTO @tb_WWWCumulos 
		SELECT ROW_NUMBER() OVER (ORDER BY RTRIM(p.xramo), RTRIM(ISNULL(cod1.xdescripcion_l,''))) id, 
			RTRIM(p.xramo) AS [Ramo],
			RTRIM(ISNULL(cod1.xdescripcion_l,'')) AS [Descripción],
			COUNT(p.cnpoliza) AS [Cantidad],
			SUM(p.msumabruta) AS [Suma],
			SUM(p.msumabrutaRet) AS [Suma_Retenida],
			SUM(p.msumabrutaCon) AS [Suma_Cedida],
			SUM(p.msumabrutaFac) AS [Suma_Facultativa],
			SUM(p.mprimabruta) AS [Prima],
			SUM(p.mprimabrutaRet) AS [Prima_Retenida],
			SUM(p.mprimabrutaCon) AS [Prima_Cedida],
			SUM(p.mprimabrutaFac) AS [Prima_Facultativa],  NULL, 0, 0, NULL, NULL, NULL, 0, NULL NombProy, NULL NContrato, NULL fcoberprin, NULL ffincober, Null GrupoEconomico,Null Referido
			,SUM(p.mprimabrutaCat) [PrimaCat]
		FROM
			Esta_SumasPol p
			INNER JOIN @WWWPlanes w ON p.cramo = w.cramo AND p.cplan = w.cplan 
			INNER JOIN adpoliza pol ON p.cpoliza = pol.cpoliza AND p.fanopol = pol.fanopol AND p.fmespol = pol.fmespol
			INNER JOIN maplanes pl ON pol.cramo = pl.cramo AND pol.cplan = pl.cplan
			INNER JOIN maentes ten ON pol.ctenedor = ten.cci_rif
			LEFT JOIN mapaises pa ON p.cpais = pa.cpais
			LEFT JOIN maestados es ON p.cpais = es.cpais AND p.cestado = es.cestado
			LEFT JOIN maciudades ci ON p.cpais = ci.cpais AND p.cestado = ci.cestado AND p.cciudad = ci.cciudad
			LEFT JOIN macorregi co ON p.cpais = co.cpais AND p.cestado = co.cestado AND p.cciudad = co.cciudad AND p.ccorregi = co.ccorregi
			LEFT JOIN mabarriada ba ON p.cpais = ba.cpais AND p.cestado = ba.cestado AND p.cciudad = ba.cciudad AND p.ccorregi = ba.ccorregi AND p.cbarriada = ba.cbarriada
			LEFT JOIN malimites_perfil ran ON 
				ran.ctipo = 1 
				AND CASE WHEN p.ctiporamo = 7 THEN p.FI_TipoFianza ELSE p.cramo END = CASE WHEN p.ctiporamo = 7 THEN ran.ctipofianza ELSE ran.cramo END 
				AND p.id_rango_suma = ran.id
			LEFT JOIN maentes grupoeco ON ten.cgrupoecono = grupoeco.cci_rif
			LEFT JOIN macodigos cod1 ON cod1.xsinonimo='tipo_fianza' AND cod1.ccodigo = p.FI_TipoFianza
		GROUP BY RTRIM(p.xramo), RTRIM(ISNULL(cod1.xdescripcion_l,''))
		ORDER BY RTRIM(p.xramo), RTRIM(ISNULL(cod1.xdescripcion_l,''));

		SET @p_total = (SELECT COUNT(*) FROM @tb_WWWCumulos);
	END

	--Resumen por poliza
	IF @ctipo = 10 
	BEGIN
		INSERT INTO @tb_WWWCumulos 
		SELECT * FROM (SELECT ROW_NUMBER() OVER (ORDER BY RTRIM(p.xramo), RTRIM(ISNULL(pl.xplan,''))) id,
			RTRIM(p.xramo) AS [Ramo],
			RTRIM(ISNULL(pl.xplan,'')) AS [Descripción],			
			COUNT(p.cnpoliza) AS [Cantidad],
			SUM(p.msumabruta) AS [Suma],
			SUM(p.msumabrutaRet) AS [Suma_Retenida],
			SUM(p.msumabrutaCon) AS [Suma_Cedida],
			SUM(p.msumabrutaFac) AS [Suma_Facultativa],
			SUM(p.mprimabruta) AS [Prima],
			SUM(p.mprimabrutaRet) AS [Prima_Retenida],
			SUM(p.mprimabrutaCon) AS [Prima_Cedida],
			SUM(p.mprimabrutaFac) AS [Prima_Facultativa],
			MAX(p.cnpoliza) [cnpoliza],
			MAX(p.casegurado) [casegurado],			
			MAX(p.cserie_rea) [cserie_rea],
			MAX(p.Estado_FI) [Estado_FI],
			MAX(p.fdesde_pol) [fdesde_pol], 
			MAX(p.fhasta_pol) [fhasta_pol], 
			MAX(oa.cbeneficiario) [cbeneficiario], MAX(RTRIM(oa.NombProy)) NombProy, MAX(RTRIM(oa.NContrato)) NContrato,
			MAX(p.fdesde_pol) fcoberprin, dbo.fn_getCoberPrin(MAX(p.cnpoliza)) ffincober,
			MAX(grupoeco.xcliente) GrupoEconomico,max(pol.creferido) Referido, SUM(p.mprimabrutaCat) [PrimaCat]
		FROM
			Esta_SumasPol p
			INNER JOIN @WWWPlanes w ON p.cramo = w.cramo AND p.cplan = w.cplan 
			INNER JOIN adpoliza pol ON p.cpoliza = pol.cpoliza AND p.fanopol = pol.fanopol AND p.fmespol = pol.fmespol
			LEFT JOIN dbo.Proyectos oa ON oa.cpoliza=pol.cpoliza AND oa.fanopol=pol.fanopol AND oa.fmespol=pol.fmespol AND oa.cproces = pol.cproces
			INNER JOIN maplanes pl ON pol.cramo = pl.cramo AND pol.cplan = pl.cplan
			INNER JOIN maentes ten ON pol.ctenedor = ten.cci_rif
			LEFT JOIN mapaises pa ON p.cpais = pa.cpais
			LEFT JOIN maestados es ON p.cpais = es.cpais AND p.cestado = es.cestado
			LEFT JOIN maciudades ci ON p.cpais = ci.cpais AND p.cestado = ci.cestado AND p.cciudad = ci.cciudad
			LEFT JOIN macorregi co ON p.cpais = co.cpais AND p.cestado = co.cestado AND p.cciudad = co.cciudad AND p.ccorregi = co.ccorregi
			LEFT JOIN mabarriada ba ON p.cpais = ba.cpais AND p.cestado = ba.cestado AND p.cciudad = ba.cciudad AND p.ccorregi = ba.ccorregi AND p.cbarriada = ba.cbarriada
			LEFT JOIN malimites_perfil ran ON 
				ran.ctipo = 1 
				AND CASE WHEN p.ctiporamo = 7 THEN p.FI_TipoFianza ELSE p.cramo END = CASE WHEN p.ctiporamo = 7 THEN ran.ctipofianza ELSE ran.cramo END 
				AND p.id_rango_suma = ran.id
			LEFT JOIN maentes grupoeco ON ten.cgrupoecono = grupoeco.cci_rif
		GROUP BY RTRIM(p.xramo), RTRIM(ISNULL(pl.xplan,'')), RTRIM(p.cnpoliza)
		--ORDER BY RTRIM(p.xramo), RTRIM(ISNULL(pl.xplan,''));
		) xr WHERE 1=@pi_export OR (id > @p_ini AND id <= (@p_ini + @p_fin) ); 

		SET @p_total = (SELECT COUNT(*) FROM (SELECT COUNT(p.cnpoliza) AS [Cantidad],
						SUM(p.msumabruta) AS [Suma],
						SUM(p.msumabrutaRet) AS [Suma_Retenida],
						SUM(p.msumabrutaCon) AS [Suma_Cedida],
						SUM(p.msumabrutaFac) AS [Suma_Facultativa],
						SUM(p.mprimabruta) AS [Prima],
						SUM(p.mprimabrutaRet) AS [Prima_Retenida],
						SUM(p.mprimabrutaCon) AS [Prima_Cedida],
						SUM(p.mprimabrutaFac) AS [Prima_Facultativa],
						MAX(p.cnpoliza) [cnpoliza],
						MAX(p.casegurado) [casegurado],			
						MAX(p.cserie_rea) [cserie_rea],
						MAX(p.Estado_FI) [Estado_FI],
						MAX(p.fdesde_pol) [fdesde_pol], 
						MAX(p.fhasta_pol) [fhasta_pol], 
						MAX(oa.cbeneficiario) [cbeneficiario],
						SUM(p.mprimabrutaCat) [PrimaCat]
					FROM
						Esta_SumasPol p
						INNER JOIN @WWWPlanes w ON p.cramo = w.cramo AND p.cplan = w.cplan 
						INNER JOIN adpoliza pol ON p.cpoliza = pol.cpoliza AND p.fanopol = pol.fanopol AND p.fmespol = pol.fmespol
						LEFT JOIN dbo.Proyectos oa ON oa.cpoliza=pol.cpoliza AND oa.fanopol=pol.fanopol AND oa.fmespol=pol.fmespol AND oa.cproces = pol.cproces
						INNER JOIN maplanes pl ON pol.cramo = pl.cramo AND pol.cplan = pl.cplan
						INNER JOIN maentes ten ON pol.ctenedor = ten.cci_rif
						LEFT JOIN mapaises pa ON p.cpais = pa.cpais
						LEFT JOIN maestados es ON p.cpais = es.cpais AND p.cestado = es.cestado
						LEFT JOIN maciudades ci ON p.cpais = ci.cpais AND p.cestado = ci.cestado AND p.cciudad = ci.cciudad
						LEFT JOIN macorregi co ON p.cpais = co.cpais AND p.cestado = co.cestado AND p.cciudad = co.cciudad AND p.ccorregi = co.ccorregi
						LEFT JOIN mabarriada ba ON p.cpais = ba.cpais AND p.cestado = ba.cestado AND p.cciudad = ba.cciudad AND p.ccorregi = ba.ccorregi AND p.cbarriada = ba.cbarriada
						LEFT JOIN malimites_perfil ran ON 
							ran.ctipo = 1 
							AND CASE WHEN p.ctiporamo = 7 THEN p.FI_TipoFianza ELSE p.cramo END = CASE WHEN p.ctiporamo = 7 THEN ran.ctipofianza ELSE ran.cramo END 
							AND p.id_rango_suma = ran.id
					GROUP BY RTRIM(p.xramo), RTRIM(ISNULL(pl.xplan,'')), RTRIM(p.cnpoliza)		
					) xr);

	END;
	
	-- =========================
	--Ruben: Muestra los resultados dependiendo de la combinacion de los llenados
	IF @bAgrupaRamo = 1
		BEGIN
		  IF @ctipo = 10 
			BEGIN			 
					SELECT  w.[Ramo],w.[Descripción],w.[cnpoliza], 
					ISNULL((SELECT RTRIM(LTRIM(mae.xcliente)) xcliente FROM dbo.maentes mae WHERE mae.cci_rif= w.[casegurado]), '') [Asegurado], 
					w.[cserie_rea] cserie,	w.[Cantidad],w.[Suma] AS [Suma Asegurada 100%],w.[Suma_Retenida] AS [Suma Retenida],
					w.[Suma_Cedida] AS [Suma Cedida],w.[Suma_Facultativa] AS [Suma Facultativa],w.[Prima] AS [Prima Suscrita 100%],
					w.[Prima_Retenida] AS [Prima Retenida],w.[Prima_Cedida] AS [Prima Cedida],	w.[Prima_Facultativa] AS [Prima Facultativa],
					w.[Estado_FI],	CONVERT(CHAR(10),w.[fdesde],103) [Fdesde], CONVERT(CHAR(10),w.[fhasta],103) [Fhasta], 
					ISNULL((SELECT RTRIM(LTRIM(mae.xcliente)) xcliente FROM dbo.maentes mae WHERE mae.cci_rif= w.cbeneficiario), '') [Beneficiario], NombProy, NContrato, CONVERT(CHAR(10),fcoberprin,103) fcoberprin, CONVERT(CHAR(10),ffincober,103) ffincober , GrupoEconomico, 
					ISNULL((SELECT RTRIM(LTRIM(maes.xcliente)) xcliente FROM dbo.maentes maes WHERE maes.cci_rif= w.Referido), '') [Referido], w.[Prima_Cat] PrimaCat
					FROM @tb_WWWCumulos w 
					ORDER BY w.Ramo, w.Descripción;
			END;
		ELSE
            BEGIN
			  	SELECT w.[Ramo], w.[Descripción], w.[Cantidad],	w.[Suma] AS [Suma Asegurada 100%], w.[Suma_Retenida] AS [Suma Retenida], w.[Suma_Cedida] AS [Suma Cedida],
					w.[Suma_Facultativa] AS [Suma Facultativa], w.[Prima] AS [Prima Suscrita 100%],	w.[Prima_Retenida] AS [Prima Retenida],
					w.[Prima_Cedida] AS [Prima Cedida],	w.[Prima_Facultativa] AS [Prima Facultativa], w.[Prima_Cat]	PrimaCat		
					FROM @tb_WWWCumulos w 
					ORDER BY w.Ramo, w.Descripción;			 		
			END;
		END;        		
	ELSE
		BEGIN		
			SELECT '' AS Ramo, w.[Descripción], SUM(w.[Cantidad]) AS [Cantidad],SUM(w.[Suma]) AS [Suma Asegurada 100%],	SUM(w.[Suma_Retenida]) AS [Suma Retenida],
				SUM(w.[Suma_Cedida]) AS [Suma Cedida],	SUM(w.[Suma_Facultativa]) AS [Suma Facultativa],SUM(w.[Prima]) AS [Prima Suscrita 100%],
				SUM(w.[Prima_Retenida]) AS [Prima Retenida],SUM(w.[Prima_Cedida]) AS [Prima Cedida], SUM(w.[Prima_Facultativa]) AS [Prima Facultativa], SUM(w.[Prima_Cat]) PrimaCat
			FROM @tb_WWWCumulos w 
			GROUP BY w.[Descripción] 
			ORDER BY w.[Descripción];			   
		END;
END

