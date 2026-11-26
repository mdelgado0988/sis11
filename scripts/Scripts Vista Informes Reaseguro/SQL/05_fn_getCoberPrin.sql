CREATE FUNCTION [dbo].[fn_getCoberPrin] (
	@p_cnpoliza VARCHAR(30)
    )
RETURNS DATETIME
AS
BEGIN
    DECLARE @fini DATETIME, @pi_cnpoliza NVARCHAR(30), @pi_cramo INT, @pi_cplan NVARCHAR(20),
	 @pi_fmespol INT, @pi_fanopol INT, @pi_cpoliza INT, @pi_fhasta DATE, @pi_cproces DECIMAL(26,0);
	 
	SET @pi_cnpoliza = ISNULL(@p_cnpoliza, '-1');


	SELECT @pi_cproces=pol.cproces, @pi_cramo=pol.cramo, @pi_cplan= pol.cplan, @pi_cpoliza=pol.cpoliza, @pi_fanopol=pol.fanopol, @pi_fmespol=pol.fmespol
	, @pi_fhasta= pol.fhasta
	FROM adpoliza pol 
	WHERE pol.istatpol='V' AND pol.cnpoliza = @pi_cnpoliza;

	IF ISNULL(@pi_cproces, 0) = 0 AND ISNULL(@pi_cplan, 0) = 0
	BEGIN		
		SELECT @pi_cproces=pol.cproces, @pi_cramo=pol.cramo, @pi_cplan= pol.cplan, @pi_cpoliza=pol.cpoliza, @pi_fanopol=pol.fanopol, @pi_fmespol=pol.fmespol
		, @pi_fhasta= pol.fhasta
		FROM adpoliza pol 
		WHERE pol.istatpol='C' AND pol.cnpoliza = @pi_cnpoliza;
	END;


	SET @fini = ISNULL((SELECT max(cob.fhasta) fhasta FROM adpoliza pol
	  INNER JOIN dbo.adpolcob cob ON cob.cpoliza=pol.cpoliza AND cob.fmespol=pol.fmespol AND cob.fanopol=pol.fanopol
	  WHERE pol.cramo = @pi_cramo And pol.cplan =@pi_cplan AND pol.cpoliza=@pi_cpoliza AND pol.fmespol=@pi_fmespol AND pol.fanopol=@pi_fanopol AND cob.istattar ='V' 
	  And (cob.bobligatoria='O' AND cob.bprincipal=1 AND cob.fdesplaza <> 2
	  OR cob.bobligatoria='O' AND cob.fdesplaza <> 2
	  OR cob.bobligatoria='T' AND cob.bprincipal=1 AND cob.fdesplaza <> 2
	  OR cob.fdesplaza <> 2)), @pi_fhasta);


    RETURN @fini;
END;
