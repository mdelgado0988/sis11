/*--FIANZA
  EXEC spRea_Polizas_Vigentes 7,'83',1,false,0,500000,0
 */

/*--INCENDIO
 EXEC spRea_Polizas_Vigentes 4,'1',1,false,0,500000,0
 */

/*--RIESGOS GENERALES
 EXEC spRea_Polizas_Vigentes 6,'96',1,false,0,500000,0
 */

CREATE PROC [dbo].[spRea_Polizas_Vigentes]    
 @ctiporamo INT,    
 @cramo NVARCHAR(MAX),    
 @ctipo INT,    
 @p_export BIT,    
 @p_ini INT = 0,    
 @p_fin INT = 30,   
 @p_total INT OUT     
AS    
BEGIN    
    BEGIN TRY    
  BEGIN TRANSACTION Tran_PolVigentes;    
 --  commit  TRANSACTION Tran_PolVigentes
 /*    
 @p_ctiporamo: tipo de ramo seleccionado    
 @cramo: lista de ramos separada por comas    
 @p_ctipo: tipo de reporte    
   1 - Reporte sin coberturas    
   2 - Reporte con coberturas    
 */
     
 /*  
 SET @p_total = 0
SELECT  ISNULL(@ctiporamo,0) AS TIPORAMO,    
 ISNULL(@cramo,'') AS CRAMO,    
 ISNULL(@ctipo,0) AS CTIPO
 7 - 81 
 RETURN     
 */   
 DECLARE @p_sql NVARCHAR(MAX), @p_sqlC NVARCHAR(MAX), @p_ParmDefiX NVARCHAR(50);    
 DECLARE @WWWRamos TABLE (cramo INT);    
 CREATE TABLE #WWWPlanes (cramo INT, cplan CHAR(10));    
 DECLARE @Xml AS XML, @p_ctipo INT, @pi_export BIT, @p_ctiporamo INT     
DECLARE  @pfechaHasta varchar(10)

--SET  @pfechaHasta = CONVERT(VARCHAR,GETDATE()) 
     
 SET @Xml = CAST(('<A>'+replace(@cramo,',','</A><A>')+'</A>') AS XML);    
 SET @p_ctipo = ISNULL(@ctipo, -1);    
 SET @p_total = 0;    
 SET @pi_export = ISNULL(@p_export, 0);    
 IF @p_ini <= 0 BEGIN SET @p_ini = 0; END;    
 IF @p_fin <= 0 BEGIN SET @p_fin = 30; END;    
 SET @p_ctiporamo = ISNULL(@ctiporamo, 0);    
 
   
    
 IF @p_ctipo NOT IN ( 1, 2 )    
        BEGIN    
            RAISERROR ('No existe codigo relacionado', 11, 1);    
        END;    
    
 IF @p_ctiporamo NOT IN (4, 6, 7)    
 BEGIN    
  RAISERROR ('No existe Configuracion para el codigo de ramo', 11, 1);    
 END    
    
     
 INSERT INTO @WWWRamos     
 SELECT A.value('.', 'INT') as [cramo] FROM @Xml.nodes('A') AS FN(A);    
 INSERT INTO #WWWPlanes     
 SELECT pl.cramo, pl.cplan FROM maplanes pl INNER JOIN @WWWRamos w ON pl.cramo = w.cramo;    
     
 DECLARE @ListaCob_Sumas VARCHAR(4000);    
 SELECT @ListaCob_Sumas = (COALESCE(@ListaCob_Sumas + '],[Suma_', '[Suma_') + ccober)    
  FROM (SELECT RTRIM(ram.xabreviatura)+'_'+RTRIM(ccobertura) AS ccober FROM macoberturas cob INNER JOIN @WWWRamos w ON cob.cramo = w.cramo INNER JOIN maramos ram ON cob.cramo = ram.cramo) AS cob    
 SET @ListaCob_Sumas = @ListaCob_Sumas + ']';    
      
 CREATE TABLE #p_WWWPolVig (    
  Id int,    
  [Ramo] NVARCHAR(255),    
  [Plan] NVARCHAR(255),    
  [Poliza] NVARCHAR(255),    
  [Fecha_Inicial] DATETIME,    
  [Fecha_Final] DATETIME,    
  [FCobPrin] DATE NULL,    
  [Fecha_Ingreso] DATETIME,    
  [Dias] INT,    
  [Cliente] NVARCHAR(255),    
  [Codigo_SIS] NUMERIC(26,0),    
  [Codigo_COBIS] NUMERIC(26,0),    
  [Identificacion] NVARCHAR(255),    
  [Tipo_Riesgo] NVARCHAR(255),    
    [Suma] NUMERIC(17,2),    
  [RANGO] NVARCHAR(255),    
  [Suma_Retenida] NUMERIC(17,2),    
  [Suma_Cedida] NUMERIC(17,2),    
  [Suma_Facultativa] NUMERIC(17,2),    
  [Prima] NUMERIC(17,2),    
  [Prima_Retenida] NUMERIC(17,2),    
  [Prima_Cedida] NUMERIC(17,2),    
  [Prima_Facultativa] NUMERIC(17,2),
  [Prima_Cat] NUMERIC(17,2),
  [Pais] NVARCHAR(255),    
  [Provincia] NVARCHAR(255),    
  [Distrito] NVARCHAR(255),    
  [Corregimiento] NVARCHAR(255),    
  [Barriada] NVARCHAR(255),    
  [NB_Tasa] NVARCHAR(255),    
  [NB_Tasa_II] NVARCHAR(255),    
  [NB_Tarifa] NVARCHAR(255),    
  [NB_MontoEDS] NVARCHAR(255),    
  [NB_Direccion] NVARCHAR(255),    
  [NB_NoPrestamo] NVARCHAR(255),    
  [NB_Verificacion] NVARCHAR(255),    
  [NB_Edificio] NVARCHAR(255),    
  [NB_Cambios_en_sistema] NVARCHAR(255),    
  [NB_Apto_CasaNo] NVARCHAR(255),    
  [NB_No_Garantia] NVARCHAR(255),      
  [RG_Proyecto] NVARCHAR(4000),    
  [FI_TipoFianza] NVARCHAR(255),    
  [FI_NombProy] NVARCHAR(3000),    
  [FI_Beneficiario] NVARCHAR(255),    
  [FI_EstadoFianza] NVARCHAR(255),    
  [Zona_Cresta] NVARCHAR(255),    
  [Grupo_Economico] NVARCHAR(255),    
  [Tasa] NUMERIC(17,2),    
  [cpoliza] INT, [fanopol] INT, [fmespol] INT ,
  [cproces] NUMERIC(15),
  [Secuestrante_secuestrado]  VARCHAR(MAX),
  [Descripcion_Garantia]  VARCHAR(MAX),
  [Valor_Garantia] VARCHAR(MAX)
      
 );
 
 
   
	  
 
 INSERT INTO #p_WWWPolVig    
 SELECT * FROM (    
 SELECT ROW_NUMBER() OVER (ORDER BY pol.fingreso DESC) id, RTRIM(p.xramo)  AS [Ramo], RTRIM(pl.xplan)  AS [Plan], p.cnpoliza AS [Poliza], pol.fdesde [Fecha_Inicial],    
  pol.fhasta AS [Fecha_Final], NULL [FCobPrin], pol.fingreso AS [Fecha_Ingreso], DATEDIFF(DAY, pol.fdesde, pol.fhasta) AS [Dias],    
  RTRIM(ten.xcliente) AS [Cliente], ten.cci_rif AS [Codigo_SIS], ten.ccirif_fox AS [Codigo_COBIS], ten.cid AS [Identificacion],    
  ISNULL((SELECT TOP 1 RTRIM(xdescripcion_l) FROM dbo.macodigos WHERE xsinonimo='TipoRiesgo' AND ccodigo=ten_ext.itiporiesgo),'') AS [Tipo_Riesgo],    
  p.msumabruta AS [Suma], ran.mlim_max_imp AS [RANGO], p.msumabrutaRet AS [Suma_Retenida], p.msumabrutaCon AS [Suma_Cedida], p.msumabrutaFac AS [Suma_Facultativa],    
  p.mprimabruta AS [Prima], p.mprimabrutaRet AS [Prima_Retenida], p.mprimabrutaCon AS [Prima_Cedida], p.mprimabrutaFac AS [Prima_Facultativa], p.mprimabrutaCat [Prima_Cat],    
  RTRIM(ISNULL(pa.xdescripcion_l,'')) AS [NB_Pais], RTRIM(ISNULL(es.xdescripcion_l,'')) AS [NB_Provincia], RTRIM(ISNULL(ci.xdescripcion_l,'')) AS [NB_Distrito],    
  RTRIM(ISNULL(co.xdescripcion_l,'')) AS [NB_Corregimiento], RTRIM(ISNULL(ba.xdescripcion_l,'')) AS [NB_Barriada],    
  CASE WHEN p.msumabruta = 0 THEN 0 ELSE ROUND(p.mprimabruta/p.msumabruta*100,4) END AS [NB_Tasa],    
  CASE WHEN p.msumabruta = 0 THEN 0 ELSE ROUND(p.mprimabruta/p.msumabruta*100,4) END AS [NB_Tasa_II],    
  CASE WHEN (CASE WHEN p.msumabruta = 0 THEN 0 ELSE ROUND(p.mprimabruta/p.msumabruta*100,2) END) < 0.16 THEN 'residencial' ELSE 'comercial' END AS [NB_Tarifa],    
  0 AS [NB_MontoEDS], RTRIM(ten.xdirecobro) AS [NB_Direccion], p.NB_xnprestamo AS [NB_NoPrestamo], '' AS [NB_Verificacion],    
  RTRIM(ISNULL(p.NB_edificio,'')) AS [NB_Edificio], '' AS [NB_Cambios_en_sistema], RTRIM(ISNULL(p.NB_edificio_no,'')) AS [NB_Apto_CasaNo],    
  RTRIM(ISNULL(p.NB_xngarantia,'')) AS [NB_No_Garantia], RTRIM(ISNULL(p.RG_proyecto,'')) AS [RG_Proyecto],    
  RTRIM(ISNULL(cod1.xdescripcion_l,'')) AS [FI_TipoFianza], RTRIM(ISNULL(proy.NombProy,'')) AS [FI_NombProy], RTRIM(ISNULL(proyBen.xcliente,'')) AS [FI_Beneficiario],    
  CASE WHEN ISNULL(proy.IVigenciaf,'') = 'A' THEN 'Activa' WHEN ISNULL(proy.IVigenciaf,'') = 'I' THEN 'Inactiva' ELSE 'Pendiente' END AS [FI_EstadoFianza],    
  p.xriesgo AS [Zona_Cresta], RTRIM(ISNULL(GrupoEco.xcliente,'')) AS [Grupo_Economico],    
  CASE WHEN p.msumabruta <> 0 THEN ROUND(p.mprimabruta / p.msumabruta * 100, 2) ELSE 0 END AS [Tasa],    
  p.cpoliza, p.fanopol, p.fmespol ,pol.cproces,  isnull(proy.xnprestamo,'') as [Secuestrante_secuestrado],isnull(proy.xgarantia,'') [Descripcion_Garantia],isnull(proy.valor_garantia,0) as [Valor_Garantia]    
 FROM    
  dbo.Esta_SumasPol p    
  INNER JOIN #WWWPlanes w ON p.cramo = w.cramo   AND p.cplan= w.cplan COLLATE Modern_Spanish_CI_AI     
  INNER JOIN dbo.adpoliza pol ON p.cpoliza = pol.cpoliza AND p.fanopol = pol.fanopol AND p.fmespol = pol.fmespol    
  INNER JOIN dbo.maplanes pl ON pol.cramo = pl.cramo AND pol.cplan = pl.cplan    
  INNER JOIN dbo.maentes ten ON pol.ctenedor = ten.cci_rif    
  LEFT JOIN dbo.maentes_ext ten_ext ON pol.ctenedor = ten_ext.cci_rif    
  LEFT JOIN dbo.mapaises pa ON p.cpais = pa.cpais    
  LEFT JOIN dbo.maestados es ON p.cpais = es.cpais AND p.cestado = es.cestado    
  LEFT JOIN dbo.maciudades ci ON p.cpais = ci.cpais AND p.cestado = ci.cestado AND p.cciudad = ci.cciudad    
  LEFT JOIN dbo.macorregi co ON p.cpais = co.cpais AND p.cestado = co.cestado AND p.cciudad = co.cciudad AND p.ccorregi = co.ccorregi    
  LEFT JOIN dbo.mabarriada ba ON p.cpais = ba.cpais AND p.cestado = ba.cestado AND p.cciudad = ba.cciudad AND p.ccorregi = ba.ccorregi AND p.cbarriada = ba.cbarriada    
  LEFT JOIN dbo.macodigos cod1 ON cod1.xsinonimo='tipo_fianza' AND cod1.ccodigo = p.FI_TipoFianza     
  LEFT JOIN dbo.proyectos proy ON proy.cpoliza = p.cpoliza AND proy.fanopol = p.fanopol AND proy.fmespol = p.fmespol     
  LEFT JOIN dbo.maentes proyBen ON proyBen.cci_rif = proy.cbeneficiario     
  INNER JOIN dbo.malimites_perfil ran 
  ON ran.ctipo = 1 AND
  CASE WHEN p.ctiporamo = 7
   THEN p.FI_TipoFianza
   ELSE p.cramo END = CASE
    WHEN p.ctiporamo = 7 
	THEN ran.ctipofianza
	 ELSE ran.cramo END 
	 AND p.id_rango_suma = ran.id 
	 AND
	 RAN.CRAMO =ISNULL((select TOP 1 ISNULL(CRAMO,0) from 
	 dbo.malimites_perfil  where CRAMO =p.CRAMO AND p.id_rango_suma = ran.id ),0)
  LEFT JOIN dbo.maentes GrupoEco ON GrupoEco.cci_rif = pol.cgrupoecono    
  where  CONVERT(datetime,convert(CHAR(10),pol.fhasta,112)) >= CONVERT(datetime,convert(CHAR(10),GETDATE(),112))  
 --and (CONVERT(datetime,convert(CHAR(10),pol.fdesde,112)) <= CONVERT(datetime,convert(CHAR(10),GETDATE(),112)))  
 and (CONVERT(datetime,convert(CHAR(10),pol.fdesde,112)) <= CONVERT(datetime,convert(CHAR(10),GETDATE(),112))) 
 AND pol.istatpol <> 'C'    
    ) xresult WHERE 1=@pi_export OR (id > @p_ini AND id <= (@p_ini + @p_fin) )  
	

	

  SET @p_sqlC = N'SET @pi_OUT=(SELECT COUNT(*) FROM dbo.Esta_SumasPol p' + CHAR(13)    
  SET @p_sqlC += N'INNER JOIN #WWWPlanes w ON p.cramo = w.cramo AND p.cplan = w.cplan COLLATE Modern_Spanish_CI_AI ' + CHAR(13)     
  SET @p_sqlC += N'INNER JOIN dbo.adpoliza pol ON p.cpoliza = pol.cpoliza AND p.fanopol = pol.fanopol AND p.fmespol = pol.fmespol' + CHAR(13)    
  SET @p_sqlC += N'INNER JOIN dbo.maplanes pl ON pol.cramo = pl.cramo AND pol.cplan = pl.cplan' + CHAR(13)    
  SET @p_sqlC += N'INNER JOIN dbo.maentes ten ON pol.ctenedor = ten.cci_rif' + CHAR(13)    
  SET @p_sqlC += N'LEFT JOIN dbo.maentes_ext ten_ext ON pol.ctenedor = ten_ext.cci_rif' + CHAR(13)    
  SET @p_sqlC += N'LEFT JOIN dbo.mapaises pa ON p.cpais = pa.cpais' + CHAR(13)    
  SET @p_sqlC += N'LEFT JOIN dbo.maestados es ON p.cpais = es.cpais AND p.cestado = es.cestado' + CHAR(13)    
  SET @p_sqlC += N'LEFT JOIN dbo.maciudades ci ON p.cpais = ci.cpais AND p.cestado = ci.cestado AND p.cciudad = ci.cciudad' + CHAR(13)    
  SET @p_sqlC += N'LEFT JOIN dbo.macorregi co ON p.cpais = co.cpais AND p.cestado = co.cestado AND p.cciudad = co.cciudad AND p.ccorregi = co.ccorregi' + CHAR(13)    
  SET @p_sqlC += N'LEFT JOIN dbo.mabarriada ba ON p.cpais = ba.cpais AND p.cestado = ba.cestado AND p.cciudad = ba.cciudad AND p.ccorregi = ba.ccorregi AND p.cbarriada = ba.cbarriada' + CHAR(13)    
  SET @p_sqlC += N'LEFT JOIN dbo.macodigos cod1 ON cod1.xsinonimo=''tipo_fianza'' AND cod1.ccodigo = p.FI_TipoFianza ' + CHAR(13)    
  SET @p_sqlC += N'LEFT JOIN dbo.proyectos proy ON proy.cpoliza = p.cpoliza AND proy.fanopol = p.fanopol AND proy.fmespol = p.fmespol' + CHAR(13)    
  SET @p_sqlC += N'LEFT JOIN dbo.maentes proyBen ON proyBen.cci_rif = proy.cbeneficiario' + CHAR(13)     
  SET @p_sqlC += N'INNER JOIN dbo.malimites_perfil ran ON ran.ctipo = 1 AND CASE WHEN p.ctiporamo=7 THEN p.FI_TipoFianza ELSE p.cramo END = CASE WHEN p.ctiporamo=7 THEN ran.ctipofianza ELSE ran.cramo END AND p.id_rango_suma = ran.id' + CHAR(13)    
  SET @p_sqlC += N'LEFT JOIN dbo.maentes GrupoEco ON GrupoEco.cci_rif = pol.cgrupoecono)' + CHAR(13)     
      
 --GOTO xsalir    
    
	
  
 --Sin coberturas    
 IF @p_ctipo = 1     
 BEGIN    
  IF @p_ctiporamo = 4     
  BEGIN --Incendio    
   SET @p_sql = N'SELECT a.id, a.[Ramo], a.[Plan], a.[Poliza], CONVERT(CHAR(10),A.[Fecha_Inicial],103) [Fecha Inicial], CONVERT(CHAR(10),dbo.fn_getCoberPrinUpgrade(a.[poliza],a.[cproces]),103) [Fecha_CobeP], CONVERT(CHAR(10),a.[Fecha_Final],103) [Fecha Final], CONVERT(CHAR(10),a.[Fecha_Ingreso],103) [Fecha Ingreso], a.[Cliente], a.[Codigo_SIS] [Codigo SIS], a.[Codigo_COBIS] [Codigo COBIS], a.[Identificacion], a.[Tipo_Riesgo] [Tipo Riesgo],' + CHAR(13)    
   SET @p_sql += N'a.[Suma] AS [Suma Asegurada 100%], a.[RANGO], a.[Suma_Retenida] AS [Suma Retenida], a.[Suma_Cedida] AS [Suma Cedida], a.[Suma_Facultativa] AS [Suma Facultativa], a.[Prima] AS [Prima Suscrita 100%], a.[Prima_Retenida] AS [Prima Retenida], a.[Prima_Cedida] AS [Prima Cedida], a.[Prima_Facultativa] [Prima Facultativa], a.[Prima_Cat] [Prima Cat],' + CHAR(13)    
   SET @p_sql += N'a.[NB_Tasa] [Tasa], a.[NB_Tasa_II] [Tasa_II], a.[NB_Tarifa] [Tarifa], a.[NB_MontoEDS] [MontoEDS], a.[NB_Direccion] AS [Direccion Ente],(select top 1 xdirecob from nbcerti where nbcerti.cpoliza = a.cpoliza and nbcerti.fanopol = a.fanopol and nbcerti.fmespol = a.fmespol ) AS [Direccion Inmueble], a.[NB_NoPrestamo] AS [NoPrestamo],' + CHAR(13)    
   SET @p_sql += N'a.[Pais], a.[Provincia], a.[Distrito], a.[Corregimiento], a.[Barriada], a.[NB_Verificacion] AS [Verificacion], a.[NB_Edificio] [Edificio], a.[NB_Cambios_en_sistema] AS [Cambios_en_sistema], a.[NB_Apto_CasaNo] AS [Apto_CasaNo], a.[NB_No_Garantia] AS [No_Garantia], a.[Zona_Cresta] AS [Zona Cresta]' + CHAR(13)    
   SET @p_sql += N'FROM #p_WWWPolVig a' 
 --  SET @p_sql += N' where CONVERT(datetime,convert(CHAR(10),a.Fecha_Final,112)) >= CONVERT(datetime,convert(CHAR(10),getdate(),112))'  
 --  SET @p_sql += N' and (CONVERT(datetime,convert(CHAR(10),a.Fecha_Inicial,112)) <= CONVERT(datetime,convert(CHAR(10),''13-08-2020'',112)))'  
               --   and ((datepart(dayofyear,a.fhasta) <= datepart(dayofyear,@FechaFinal))Or @FechaFinal IS NULL)  
     SET @p_sql += N' ORDER BY a.id'--WHERE 1=@px_export OR (a.id>@p_ini AND a.id<=(@p_ini + @p_fin))'      
  END    
    
  IF @p_ctiporamo = 6     
  BEGIN --Riesgos generales       
    SET @p_sql = N'SELECT a.id, a.[Ramo], a.[Plan], a.[Poliza], CONVERT(CHAR(10),A.[Fecha_Inicial],103) [Fecha Inicial], CONVERT(CHAR(10),a.[Fecha_Final],103) [Fecha Final], CONVERT(CHAR(10),[dbo].fn_getCoberPrinUpgrade(a.[Poliza],a.[cproces]),103) [F.Cob.Principal], CONVERT(CHAR(10),a.[Fecha_Ingreso],103) [Fecha Ingreso], a.[Cliente], a.[Codigo_SIS] AS [Codigo SIS], a.[Codigo_COBIS] AS [Codigo COBIS], a.[Identificacion], a.[Tipo_Riesgo] AS [Tipo Riesgo],' + CHAR(13)    
      SET @p_sql += N'a.[Suma] AS [Suma Asegurada 100%], a.[RANGO], a.[Suma_Retenida] AS [Suma Retenida], a.[Suma_Cedida] AS [Suma Cedida], a.[Suma_Facultativa] AS [Suma Facultativa], a.[Prima] AS [Prima Suscrita 100%], a.[Prima_Retenida] AS [Prima Retenida], a.[Prima_Cedida] AS [Prima Cedida], a.[Prima_Facultativa] AS [Prima Facultativa],' + CHAR(13)    
    SET @p_sql += N'a.[Pais], a.[Provincia], a.[RG_Proyecto] AS [Proyecto], a.[Zona_Cresta] AS [Zona Cresta]' + CHAR(13)     
    SET @p_sql += N'FROM #p_WWWPolVig a ORDER BY a.id'--WHERE 1=@px_export OR (a.id>@p_ini AND a.id<=(@p_ini + @p_fin))'         
  END    
    
  IF @p_ctiporamo = 7     
  BEGIN --Fianzas    
   SET @p_sql = N'SELECT a.id, CONVERT(CHAR(10),a.[Fecha_Ingreso],103) AS [Fecha Emisi¾n], a.[Ramo], a.[Plan], a.[FI_TipoFianza] AS [Tipo Fianza], a.[Poliza] AS [No Fianza], CONVERT(CHAR(10),A.[Fecha_Inicial],103) [Fecha Inicial], CONVERT(CHAR(10),a.[Fecha_Final],103) [Fecha Final], CONVERT(CHAR(10),dbo.fn_getCoberPrinUpgrade(a.poliza,a.[cproces]),103)
 [Fecha_CobeP], a.[Dias] AS [Vigencia DÝas], a.[FI_NombProy] AS [Garantizado A], a.[Cliente],' + CHAR(13)     
   SET @p_sql += N'a.[Suma] AS [Suma Asegurada 100%], a.[RANGO], a.[Suma_Retenida] AS [Suma Retenida], a.[Suma_Cedida] AS [Suma Cedida], a.[Suma_Facultativa] AS [Suma Facultativa], a.[Prima] AS [Prima Suscrita 100%], a.[Prima_Retenida] AS [Prima Retenida]
  , a.[Prima_Cedida] AS [Prima Cedida], a.[Prima_Facultativa] AS [Prima Facultativa],' + CHAR(13)    
   SET @p_sql += N'a.[FI_Beneficiario] AS [Beneficiario], a.[Tasa] AS [Tasa], a.[FI_EstadoFianza] AS [Estado Fianza|c], a.[Grupo_Economico] AS [Grupo Econ¾mico],' + CHAR(13)    
   SET @p_sql += N'a.[Secuestrante_secuestrado] AS [Secuestrante/secuestrado], a.[Descripcion_Garantia] AS [Descripcion Garantia], a.[Valor_Garantia] AS [Valor_Garantia]' + CHAR(13)    
   SET @p_sql += N'FROM #p_WWWPolVig a ORDER BY a.id'--WHERE 1=@px_export OR (a.id>@p_ini AND a.id<=(@p_ini + @p_fin))'        
  END    
    
 END    
     
 --Con coberturas siempre exporta    
 IF @p_ctipo = 2 BEGIN    
  IF @p_ctiporamo = 4     
  BEGIN --Incendio    
   SET @p_sql = 'SELECT a.[Ramo], a.[Plan], a.[Poliza], CONVERT(CHAR(10),A.[Fecha_Inicial],103) [Fecha Inicial], CONVERT(CHAR(10),a.[Fecha_Final],103) [Fecha Final], CONVERT(CHAR(10),a.[Fecha_Ingreso],103) [Fecha Ingreso], a.[Cliente], a.[Codigo_SIS] [Codigo SIS], a.[Codigo_COBIS] [Codigo COBIS], a.[Identificacion], a.[Tipo_Riesgo] [Tipo Riesgo],' + CHAR(13)    
   SET @p_sql += N'a.[Suma] AS [Suma Asegurada 100%], a.[RANGO], a.[Suma_Retenida] AS [Suma Retenida], a.[Suma_Cedida] AS [Suma Cedida], a.[Suma_Facultativa] AS [Suma Facultativa], a.[Prima] [Prima Suscrita 100%], a.[Prima_Retenida] [Prima Retenida], a.[Prima_Cedida]  [Prima Cedida], a.[Prima_Facultativa] [Prima Facultativa], a.[Prima_Cat] [Prima Cat],' + CHAR(13)    
   SET @p_sql += N'a.[NB_Tasa] AS [Tasa], a.[NB_Tasa_II] AS [Tasa_II], a.[NB_Tarifa] AS [Tarifa], a.[NB_MontoEDS] AS [MontoEDS], a.[NB_Direccion] AS [Direccion], a.[NB_NoPrestamo] AS [NoPrestamo],' + CHAR(13)     
   SET @p_sql += N'a.[Pais], a.[Provincia], a.[Distrito], a.[Corregimiento], a.[Barriada] AS [Barriada],' + CHAR(13)    
   SET @p_sql += N'a.[NB_Verificacion] AS [Verificacion], a.[NB_Edificio] AS [Edificio], a.[NB_Cambios_en_sistema] AS [Cambios_en_sistema], a.[NB_Apto_CasaNo] AS [Apto_CasaNo], a.[NB_No_Garantia] AS [No_Garantia],' + CHAR(13)    
   SET @p_sql += N'a.[Zona_Cresta] AS [Zona Cresta], Sumas.* ' + CHAR(13)    
   SET @p_sql += N'FROM #p_WWWPolVig a LEFT JOIN ( SELECT * FROM (SELECT a.cpoliza, a.fanopol, a.fmespol, ''Suma_''+rtrim(ram.xabreviatura)+''_''+rtrim(a.ccober) ccober, a.msumabruta FROM Esta_SumasCob a INNER JOIN maramos ram ON a.cramo = ram.cramo) TablaOrigen' + CHAR(13)    
   SET @p_sql += N'PIVOT (SUM(msumabruta) FOR ccober IN (' + @ListaCob_Sumas + ')) as Pivote1) as Sumas ON a.cpoliza = Sumas.cpoliza AND a.fanopol = Sumas.fanopol AND a.fmespol = Sumas.fmespol'       
  END    
    
  IF @p_ctiporamo = 6     
  BEGIN --Riesgos generales       
   SET @p_sql = N'SELECT a.[Ramo], a.[Plan], a.[Poliza], CONVERT(CHAR(10),A.[Fecha_Inicial],103) [Fecha Inicial], CONVERT(CHAR(10),a.[Fecha_Final],103) [Fecha Final], CONVERT(CHAR(10),a.[Fecha_Ingreso],103) [Fecha Ingreso], a.[Cliente], a.[Codigo_SIS] AS [Codigo SIS], a.[Codigo_COBIS] AS [Codigo COBIS], a.[Identificacion], a.[Tipo_Riesgo] AS [Tipo Riesgo],' + CHAR(13)    
   SET @p_sql += N'a.[Suma] AS [Suma Asegurada 100%], a.[RANGO], a.[Suma_Retenida] AS [Suma Retenida], a.[Suma_Cedida] AS [Suma Cedida], a.[Suma_Facultativa] AS [Suma Facultativa], a.[Prima] AS [Prima Suscrita 100%], a.[Prima_Retenida] AS [Prima Retenida]
	, a.[Prima_Cedida] AS [Prima Cedida], a.[Prima_Facultativa] AS [Prima Facultativa],' + CHAR(13)    
   SET @p_sql += N'a.[Pais], a.[Provincia], a.[RG_Proyecto] AS [Proyecto], a.[Zona_Cresta] AS [Zona Cresta], Sumas.* ' + CHAR(13)    
   SET @p_sql += N'FROM #p_WWWPolVig a ' + CHAR(13)    
   SET @p_sql += N'LEFT JOIN (SELECT * FROM (SELECT a.cpoliza, a.fanopol, a.fmespol, ''Suma_''+rtrim(ram.xabreviatura)+''_''+rtrim(a.ccober) ccober, a.msumabruta FROM Esta_SumasCob a INNER JOIN maramos ram ON a.cramo = ram.cramo) TablaOrigen' + CHAR(13)  
  
   SET @p_sql += N'PIVOT (SUM(msumabruta) FOR ccober IN ('+@ListaCob_Sumas+')) as Pivote1) as Sumas ON a.cpoliza = Sumas.cpoliza AND a.fanopol = Sumas.fanopol AND a.fmespol = Sumas.fmespol'        
  END    


    
  IF @p_ctiporamo = 7     
  BEGIN --Fianzas    
   SET @p_sql = N'SELECT CONVERT(CHAR(10),a.[Fecha_Ingreso],103) [Fecha Emisi¾n], a.[Ramo], a.[Plan], a.[FI_TipoFianza] AS [Tipo Fianza], a.[Poliza] AS [No Fianza], CONVERT(CHAR(10),A.[Fecha_Inicial],103) [Fecha Inicial], CONVERT(CHAR(10),a.[Fecha_Final],103) [Fecha Final], a.[Dias] AS [Vigencia DÝas], a.[FI_NombProy] AS [Garantizado A], a.[Cliente],' + CHAR(13)     
   SET @p_sql += N'a.[Suma] AS [Suma Asegurada 100%], a.[RANGO], a.[Suma_Retenida] AS [Suma Retenida], a.[Suma_Cedida] AS [Suma Cedida], a.[Suma_Facultativa] AS [Suma Facultativa], a.[Prima] AS [Prima Suscrita 100%], a.[Prima_Retenida] AS [Prima Retenida]
  
, a.[Prima_Cedida] AS [Prima Cedida], a.[Prima_Facultativa] AS [Prima Facultativa],' + CHAR(13)     
   SET @p_sql += N'a.[FI_Beneficiario] AS [Acreedor], a.[Tasa] AS [Tasa],  a.[FI_EstadoFianza] AS [Estado Fianza], a.[Grupo_Economico] AS [Grupo Econ¾mico], Sumas.*' + CHAR(13)    
   SET @p_sql += N'FROM #p_WWWPolVig a ' + CHAR(13)     
   SET @p_sql += N'LEFT JOIN ( SELECT * FROM (SELECT a.cpoliza, a.fanopol, a.fmespol, ''Suma_''+rtrim(ram.xabreviatura)+''_''+rtrim(a.ccober) ccober, a.msumabruta FROM Esta_SumasCob a INNER JOIN maramos ram ON a.cramo = ram.cramo) TablaOrigen' + CHAR(13) 
  
   
   SET @p_sql += N'PIVOT (SUM(msumabruta) FOR ccober IN (' + @ListaCob_Sumas + ')) Pivote1 ) Sumas ON a.cpoliza = Sumas.cpoliza AND a.fanopol = Sumas.fanopol AND a.fmespol = Sumas.fmespol'          
  END    
    
 END    
     
 --PRINT @p_sql    
    
 SET @p_ParmDefiX = N'@pi_OUT INT OUTPUT';    
 EXECUTE sp_executesql @p_sqlC, @p_ParmDefiX, @pi_OUT=@p_total OUTPUT;    
/*
Select * 
into A_REASEGURO
from #p_WWWPolVig 
*/
 SET @p_ParmDefiX = N'@px_export BIT, @p_ini INT, @p_fin INT ';    
 EXECUTE sp_executesql @p_sql, @p_ParmDefiX, @px_export=@pi_export, @p_ini=@p_ini, @p_fin=@p_fin;    
xsalir:    
    
 COMMIT TRANSACTION Tran_PolVigentes;    
    END TRY    
    BEGIN CATCH    
        DECLARE @msgerr NVARCHAR(2048), @errpoc NVARCHAR(126), @errNumb INT;    
    
        SELECT @msgerr = (RTRIM (ERROR_NUMBER ()) + ': ' + ERROR_MESSAGE ()), @errpoc = ERROR_PROCEDURE ();    
        RAISERROR (@msgerr, 11, 1, @errpoc);    
    
  ROLLBACK TRANSACTION Tran_PolVigentes;    
    END CATCH;    
END;

