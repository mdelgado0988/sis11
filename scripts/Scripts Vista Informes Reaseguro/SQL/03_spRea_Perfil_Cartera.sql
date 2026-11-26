
CREATE PROC [dbo].[spRea_Perfil_Cartera]
	@ctiporamo INT,
	@cramo NVARCHAR(MAX),
	@ctiporango AS INT,
	@bAgrupaRamo BIT=1,
	@p_export BIT,
	@p_ini INT = 0,
	@p_fin INT = 30,
	@p_total INT OUT 
AS
BEGIN
	--Ubico rango de sumas aseguradas, por si cambian desde pantalla
	BEGIN
		DECLARE @WWWMinMax TABLE (cramo INT, ctipofianza INT, idMin INT, idMax INT, mlim_min DECIMAL(17,2), mlim_max DECIMAL(17,2));
		DECLARE @pi_ini INT, @pi_fin INT, @pi_export BIT

		SET @p_total = 0;	
		SET @pi_export = ISNULL(@p_export, 0);
		IF @pi_ini <= 0 BEGIN SET @p_ini = 0; END;
		IF @pi_fin <= 0 BEGIN SET @p_fin = 30; END;

		-- Se cargarn los limites de los perfiles
		INSERT INTO @WWWMinMax (cramo, ctipofianza, idMin, idMax, mlim_min, mlim_max)
		SELECT lim.cramo, lim.ctipofianza, MIN(lim.id) idMin, MAX(lim.id) idMax, MIN(lim.mlim_min) mlim_min,	MAX(lim.mlim_max) mlim_max
		FROM malimites_perfil lim
		GROUP BY lim.cramo, lim.ctipofianza;
		
		-- Marca rango suma a 0
		UPDATE Esta_SumasPol 
		SET id_rango_suma = 0 
		WHERE 1=1;
	
		--Ramos de que no son fianzas
		UPDATE Esta_SumasPol
		SET id_rango_suma = ISNULL ((SELECT TOP (1) p.id
									 FROM malimites_perfil p
									 WHERE p.ctipo = 1  AND p.ctipofianza = 0  AND Esta_SumasPol.msumabruta
										   BETWEEN p.mlim_min AND p.mlim_max
										   AND p.cramo = CASE WHEN @ctiporango = 1 THEN Esta_SumasPol.cramo ELSE 0 END
									 ORDER BY p.id),
									0)
		WHERE ctiporamo NOT IN ( 7 );
	
		--Ramos de fianzas
		UPDATE Esta_SumasPol
		SET id_rango_suma = ISNULL ((SELECT TOP (1)	 p.id
									 FROM malimites_perfil p
									 WHERE p.ctipo = 1 AND p.cramo = 0  AND Esta_SumasPol.msumabruta
										   BETWEEN p.mlim_min AND p.mlim_max
										   AND p.ctipofianza = CASE WHEN @ctiporango = 1 THEN Esta_SumasPol.FI_TipoFianza ELSE 0 END
									 ORDER BY p.id),
									0)
		WHERE ctiporamo IN ( 7 );
		
		--Si hay rangos que no se actualizaron, sumas menores al rango mínimo NO fianzas
		UPDATE Esta_SumasPol
		SET id_rango_suma = wl.idMin
		FROM Esta_SumasPol p
		INNER JOIN @WWWMinMax wl ON wl.ctipofianza = 0	AND p.cramo = CASE WHEN @ctiporango = 1 THEN wl.cramo ELSE 0 END
		WHERE p.id_rango_suma = 0
			  AND p.msumabruta < wl.mlim_min
			  AND p.ctiporamo NOT IN ( 7 );

		--Si hay rangos que no se actualizaron, sumas mayores al rango máximo NO fianzas
		UPDATE Esta_SumasPol
		SET id_rango_suma = wl.idMax
		FROM Esta_SumasPol p
		INNER JOIN @WWWMinMax wl ON wl.ctipofianza = 0 AND p.cramo = CASE WHEN @ctiporango = 1 THEN wl.cramo ELSE 0 END
		WHERE p.id_rango_suma = 0
			  AND p.msumabruta > wl.mlim_max
			  AND p.ctiporamo NOT IN ( 7 );

		--Si hay rangos que no se actualizaron, sumas menores al rango mínimo fianzas
		UPDATE Esta_SumasPol
		SET id_rango_suma = wl.idMin
		FROM Esta_SumasPol p
		INNER JOIN @WWWMinMax wl ON wl.cramo = 0 AND p.FI_TipoFianza = CASE WHEN @ctiporango = 1 THEN wl.ctipofianza ELSE 0 END
		WHERE p.id_rango_suma = 0
			  AND p.msumabruta < wl.mlim_min
			  AND p.ctiporamo IN ( 7 );

		--Si hay rangos que no se actualizaron, sumas mayores al rango máximo fianzas
		UPDATE Esta_SumasPol
		SET id_rango_suma = wl.idMax
		FROM Esta_SumasPol p
		INNER JOIN @WWWMinMax wl ON wl.cramo = 0
									AND p.FI_TipoFianza = CASE WHEN @ctiporango = 1 THEN wl.ctipofianza ELSE 0 END
		WHERE p.id_rango_suma = 0
			  AND p.msumabruta > wl.mlim_max
			  AND p.ctiporamo IN ( 7 );

	END

	--Genera el perfil
		
	DECLARE @WWWPerfiles TABLE (
		[Ramo] NVARCHAR(255),
		[id] INT,
		[Límite_Inferior] NVARCHAR(255),
		[Límite_Superior] NVARCHAR(255),
		[Cantidad] INT,
		[Suma] NUMERIC(17,2),
		[Suma_Retenida] NUMERIC(17,2),
		[Suma_Cedida] NUMERIC(17,2),
		[Suma_Facultativa] NUMERIC(17,2),
		[Prima] NUMERIC(17,2),
		[Prima_Retenida] NUMERIC(17,2),
		[Prima_Cedida] NUMERIC(17,2),
		[Prima_Facultativa] NUMERIC(17,2),
		[Suma_Promedio] NUMERIC(17,2),
		[Prima_Promedio] NUMERIC(17,2),
		[Tasa_Promedio] NUMERIC(17,2),
		[Prima_Cat] NUMERIC(17,2)
	);

	DECLARE @WWWRamos TABLE (cramo INT NULL);
	--DECLARE @WWWPlanes TABLE (cramo INT, cplan CHAR(10));
	DECLARE @Xml AS XML  
	
	SET @Xml = CAST(('<A>'+replace(@cramo,',','</A><A>')+'</A>') AS XML);
	INSERT INTO @WWWRamos SELECT A.value('.', 'INT') as [cramo] FROM @Xml.nodes('A') AS FN(A);
	
	IF @ctiporamo <> 7 
	BEGIN
		INSERT INTO @WWWPerfiles
		(Ramo, id, Límite_Inferior, Límite_Superior, Cantidad, Suma, Suma_Retenida, Suma_Cedida, Suma_Facultativa, Prima, Prima_Retenida, Prima_Cedida,
		 Prima_Facultativa, Suma_Promedio, Prima_Promedio, Tasa_Promedio, Prima_Cat)		
		SELECT 
			RTRIM(p.xramo) AS [Ramo],
			ran.id,
			RTRIM(ISNULL(ran.mlim_min_imp,'')) AS [Limite_Inferior],
			RTRIM(ISNULL(ran.mlim_max_imp,'')) AS [Limite_Superior],
			COUNT(p.cnpoliza) AS [Cantidad],
			SUM(p.msumabruta) AS [Suma],
			SUM(p.msumabrutaRet) AS [Suma_Retenida],
			SUM(p.msumabrutaCon) AS [Suma_Cedida],
			SUM(p.msumabrutaFac) AS [Suma_Facultativa],
			SUM(p.mprimabruta) AS [Prima],
			SUM(p.mprimabrutaRet) AS [Prima_Retenida],
			SUM(p.mprimabrutaCon) AS [Prima_Cedida],
			SUM(p.mprimabrutaFac) AS [Prima_Facultativa],
			ROUND(SUM(p.msumabruta)/COUNT(p.cnpoliza), 2) AS [Suma_Promedio],
			ROUND(SUM(p.mprimabruta)/COUNT(p.cnpoliza), 2) AS [Prima_Promedio],
			ROUND(SUM(p.mprimabruta)/SUM(p.msumabruta) * 100, 2) AS [Tasa_Promedio],
			SUM(p.mprimabrutaCat) AS [PrimaCat]
		FROM
			dbo.Esta_SumasPol p
			--INNER JOIN @WWWPlanes w ON p.cramo = w.cramo AND p.cplan = w.cplan 
			INNER JOIN @WWWRamos w ON p.cramo = w.cramo 
			INNER JOIN dbo.adpoliza pol ON p.cpoliza = pol.cpoliza AND p.fanopol = pol.fanopol AND p.fmespol = pol.fmespol
			INNER JOIN dbo.maplanes pl ON pol.cramo = pl.cramo AND pol.cplan = pl.cplan
			INNER JOIN dbo.maentes ten ON pol.ctenedor = ten.cci_rif
			LEFT JOIN dbo.mapaises pa ON p.cpais = pa.cpais
			LEFT JOIN dbo.maestados es ON p.cpais = es.cpais AND p.cestado = es.cestado
			LEFT JOIN dbo.maciudades ci ON p.cpais = ci.cpais AND p.cestado = ci.cestado AND p.cciudad = ci.cciudad
			LEFT JOIN dbo.macorregi co ON p.cpais = co.cpais AND p.cestado = co.cestado AND p.cciudad = co.cciudad AND p.ccorregi = co.ccorregi
			LEFT JOIN dbo.mabarriada ba ON p.cpais = ba.cpais AND p.cestado = ba.cestado AND p.cciudad = ba.cciudad AND p.ccorregi = ba.ccorregi AND p.cbarriada = ba.cbarriada
			INNER JOIN dbo.malimites_perfil ran ON ran.ctipo = 1 AND ran.ctipofianza = 0 AND ran.cramo = CASE WHEN @ctiporango = 1 THEN p.cramo ELSE 0 END AND p.id_rango_suma = ran.id
		GROUP BY RTRIM(p.xramo), ran.id, RTRIM(ISNULL(ran.mlim_min_imp,'')), RTRIM(ISNULL(ran.mlim_max_imp,''))
		ORDER BY RTRIM(p.xramo), ran.id;
		
		INSERT INTO @WWWPerfiles
		(Ramo, id, Límite_Inferior, Límite_Superior, Cantidad, Suma, Suma_Retenida, Suma_Cedida, Suma_Facultativa, Prima, Prima_Retenida, Prima_Cedida,
		 Prima_Facultativa, Suma_Promedio, Prima_Promedio, Tasa_Promedio, Prima_Cat)		
		SELECT RTRIM(ram.xdescripcion_l),
			ran.id,	RTRIM(ISNULL(ran.mlim_min_imp,'')),	RTRIM(ISNULL(ran.mlim_max_imp,'')),	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
		FROM dbo.maramos ram
			INNER JOIN dbo.malimites_perfil ran ON ran.ctipo = 1 AND ran.cramo = CASE WHEN @ctiporango = 1 THEN ram.cramo ELSE 0 END AND ran.ctipofianza = 0 
			LEFT JOIN @WWWPerfiles w ON 
				RTRIM(ram.xdescripcion_l) COLLATE Modern_Spanish_CI_AS = w.Ramo COLLATE Modern_Spanish_CI_AS AND ran.id = w.id
		WHERE ram.cramo IN (SELECT cramo FROM @WWWRamos) AND w.id IS NULL;		
	END;
	ELSE
	BEGIN
		INSERT INTO @WWWPerfiles
		(Ramo, id, Límite_Inferior, Límite_Superior, Cantidad, Suma, Suma_Retenida, Suma_Cedida, Suma_Facultativa, Prima, Prima_Retenida, Prima_Cedida,
		 Prima_Facultativa, Suma_Promedio, Prima_Promedio, Tasa_Promedio, Prima_Cat)		
		SELECT 
			RTRIM(cod1.xdescripcion_l) AS [Ramo],
			ran.id,
			RTRIM(ISNULL(ran.mlim_min_imp,'')) AS [Limite_Inferior],
			RTRIM(ISNULL(ran.mlim_max_imp,'')) AS [Limite_Superior],
			COUNT(p.cnpoliza) AS [Cantidad],
			SUM(p.msumabruta) AS [Suma],
			SUM(p.msumabrutaRet) AS [Suma_Retenida],
			SUM(p.msumabrutaCon) AS [Suma_Cedida],
			SUM(p.msumabrutaFac) AS [Suma_Facultativa],
			SUM(p.mprimabruta) AS [Prima],
			SUM(p.mprimabrutaRet) AS [Prima_Retenida],
			SUM(p.mprimabrutaCon) AS [Prima_Cedida],
			SUM(p.mprimabrutaFac) AS [Prima_Facultativa],
			ROUND(SUM(p.msumabruta)/COUNT(p.cnpoliza), 2) AS [Suma_Promedio],
			ROUND(SUM(p.mprimabruta)/COUNT(p.cnpoliza), 2) AS [Prima_Promedio],
			ROUND(SUM(p.mprimabruta)/SUM(p.msumabruta) * 100, 2) AS [Tasa_Promedio],
			SUM(p.mprimabrutaCat) AS [Prima_Cat]
		FROM
			dbo.Esta_SumasPol p
			--INNER JOIN @WWWPlanes w ON p.cramo = w.cramo AND p.cplan = w.cplan 
			INNER JOIN @WWWRamos w ON p.FI_TipoFianza = w.cramo 
			INNER JOIN dbo.adpoliza pol ON p.cpoliza = pol.cpoliza AND p.fanopol = pol.fanopol AND p.fmespol = pol.fmespol
			INNER JOIN dbo.maplanes pl ON pol.cramo = pl.cramo AND pol.cplan = pl.cplan
			INNER JOIN dbo.maentes ten ON pol.ctenedor = ten.cci_rif
			LEFT JOIN dbo.mapaises pa ON p.cpais = pa.cpais
			LEFT JOIN dbo.maestados es ON p.cpais = es.cpais AND p.cestado = es.cestado
			LEFT JOIN dbo.maciudades ci ON p.cpais = ci.cpais AND p.cestado = ci.cestado AND p.cciudad = ci.cciudad
			LEFT JOIN dbo.macorregi co ON p.cpais = co.cpais AND p.cestado = co.cestado AND p.cciudad = co.cciudad AND p.ccorregi = co.ccorregi
			LEFT JOIN dbo.mabarriada ba ON p.cpais = ba.cpais AND p.cestado = ba.cestado AND p.cciudad = ba.cciudad AND p.ccorregi = ba.ccorregi AND p.cbarriada = ba.cbarriada
			INNER JOIN dbo.malimites_perfil ran ON ran.ctipo = 1 AND ran.cramo = 0 AND ran.ctipofianza = CASE WHEN @ctiporango = 1 THEN p.FI_TipoFianza ELSE 0 END AND p.id_rango_suma = ran.id
			LEFT JOIN dbo.macodigos cod1 ON cod1.xsinonimo='tipo_fianza' AND cod1.ccodigo = p.FI_TipoFianza
		GROUP BY RTRIM(cod1.xdescripcion_l), ran.id, RTRIM(ISNULL(ran.mlim_min_imp,'')), RTRIM(ISNULL(ran.mlim_max_imp,''))
		ORDER BY RTRIM(cod1.xdescripcion_l), ran.id;
		
		INSERT INTO @WWWPerfiles
		(Ramo, id, Límite_Inferior, Límite_Superior, Cantidad, Suma, Suma_Retenida, Suma_Cedida, Suma_Facultativa, Prima, Prima_Retenida, Prima_Cedida,
		 Prima_Facultativa, Suma_Promedio, Prima_Promedio, Tasa_Promedio, Prima_Cat)		
		SELECT RTRIM(cod1.xdescripcion_l),	ran.id,	RTRIM(ISNULL(ran.mlim_min_imp,'')),	RTRIM(ISNULL(ran.mlim_max_imp,'')),	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
		FROM (SELECT ccodigo, xdescripcion_l FROM dbo.macodigos WHERE xsinonimo='tipo_fianza') cod1
			INNER JOIN dbo.malimites_perfil ran ON ran.ctipo = 1 AND ran.ctipofianza = CASE WHEN @ctiporango = 1 THEN cod1.ccodigo ELSE 0 END AND ran.cramo = 0 
			LEFT JOIN @WWWPerfiles w ON 
				RTRIM(cod1.xdescripcion_l) COLLATE Modern_Spanish_CI_AS = w.Ramo COLLATE Modern_Spanish_CI_AS 
				AND ran.id = w.id 
		WHERE cod1.ccodigo IN (SELECT cramo FROM @WWWRamos) AND w.id IS NULL;		
	END;

-- Muestra el detalle una vez realizado las condiciones
	IF @bAgrupaRamo = 1
		SELECT w.[Ramo], w.[Límite_Inferior] AS [Límite Inferior],	w.[Límite_Superior] AS [Límite Superior],
			w.[Cantidad], 
			w.[Suma] AS [Suma Asegurada 100%],
			w.[Suma_Retenida] AS [Suma Retenida],
			w.[Suma_Cedida] AS [Suma Cedida],
			w.[Suma_Facultativa] AS [Suma Facultativa],
			w.[Prima] AS [Prima Suscrita 100%],
			w.[Prima_Retenida] AS [Prima Retenida],
			w.[Prima_Cedida] AS [Prima Cedida],
			w.[Prima_Facultativa] AS [Prima Facultativa],
			w.[Suma_Promedio] AS [Suma Asegurada Promedio],
			w.[Prima_Promedio] AS [Prima Promedio],
			w.[Tasa_Promedio] AS [Tasa Promedio],
			w.[Prima_Cat] AS [PrimaCat]
		FROM @WWWPerfiles w ORDER BY w.Ramo, w.id;
	ELSE

		SELECT '' AS Ramo, w.[Límite_Inferior] AS [Límite Inferior], w.[Límite_Superior] AS [Límite Superior],
			SUM(w.[Cantidad]) AS [Cantidad],
			SUM(w.[Suma]) AS [Suma Asegurada 100%],
			SUM(w.[Suma_Retenida]) AS [Suma Retenida],
			SUM(w.[Suma_Cedida]) AS [Suma Cedida],
			SUM(w.[Suma_Facultativa]) AS [Suma Facultativa],
			SUM(w.[Prima]) AS [Prima Suscrita 100%],
			SUM(w.[Prima_Retenida]) AS [Prima Retenida],
			SUM(w.[Prima_Cedida]) AS [Prima Cedida],
			SUM(w.[Prima_Facultativa]) AS [Prima Facultativa],
			SUM(w.[Suma_Promedio]) AS [Suma Asegurada Promedio],
			SUM(w.[Prima_Promedio]) AS [Prima Promedio],
			SUM(w.[Tasa_Promedio]) AS [Tasa Promedio],
			SUM(w.[Prima_Cat]) AS [PrimaCat]
		FROM @WWWPerfiles w 
		GROUP BY w.id, w.[Límite_Inferior], w.[Límite_Superior]
		ORDER BY w.id;
END



