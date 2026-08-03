USE GlobalSIS_AG01

GO

TRUNCATE TABLE Entes;
--DROP TABLE IF EXISTS Entes

DECLARE @TiposIds AS TABLE(
	id int identity(1,1),
	identificacion varchar(2)
);

insert into @TiposIds  (identificacion)
SELECT DISTINCT xtipodoc from maentes

DECLARE @n int = (select max(id) from @TiposIds);
declare @i int = 1
DECLARE @tipodoc VARCHAR(2);

WHILE @i <= @n begin
	
	set @tipodoc = (SELECT identificacion from @TiposIds where id = @i);

	INSERT INTO Entes
	SELECT top 5
			ROW_NUMBER() OVER
			(
				PARTITION BY LTRIM(RTRIM(e.xtipodoc))
				ORDER BY e.cci_rif DESC
			) AS RegistroPorTipo,

			/* IDENTIFICACIÓN */
			e.cci_rif AS [ID SIS],
			e.ccirif_fox AS [Nº Cobis],
			LTRIM(RTRIM(e.xtipodoc)) AS [Código tipo de identificación],

			COALESCE(
				tipo_identificacion.xdescripcion_l,
				LTRIM(RTRIM(e.xtipodoc))
			) AS [Tipo de identificación],

			CASE
				WHEN e.ipersona IN ('P', 'N') THEN LTRIM(RTRIM(e.cid))
				ELSE LTRIM(RTRIM(e.nruc))
			END AS [Cédula/RUC],

			CASE e.ipersona
				WHEN 'P' THEN 'Natural'
				WHEN 'N' THEN 'Natural'
				WHEN 'C' THEN 'Jurídica'
				WHEN 'J' THEN 'Jurídica'
				ELSE LTRIM(RTRIM(e.ipersona))
			END AS [Tipo Persona],

			LTRIM(RTRIM(e.xcliente)) AS [Cliente],

			/* DATOS PERSONALES */
			LTRIM(RTRIM(e.xnombre)) AS [Nombre],
			LTRIM(RTRIM(e.xapellido)) AS [Apellido],
			tratamiento.xdescripcion_l AS [Tratamiento],
			sexo.xdescripcion_l AS [Sexo],
			estado_civil.xdescripcion_l AS [Estado Civil],
			e.fnacimien AS [F.Nacimiento],
			e.qedad AS [Edad],
			e.cnacionalidad AS [Nacionalidad],

			/* DATOS JURÍDICOS */
			LTRIM(RTRIM(me.razon_social)) AS [Razón Social],
			LTRIM(RTRIM(me.razon_comercial)) AS [Razón Comercial],
			LTRIM(RTRIM(e.xreplegal)) AS [Representante Legal],
			LTRIM(RTRIM(e.cidreplegal)) AS [Cédula Representante Legal],
			LTRIM(RTRIM(me.lexpdoc)) AS [Acta consorcial],
			actividad_economica.xdescripcion_l AS [Actividad Económica],
			tipo_persona_juridica.xdescripcion_l AS [Tipo Persona Jurídica],
			LTRIM(RTRIM(e.cprofesion)) AS [Código Profesión],

			/* UBICACIÓN */
			p.xdescripcion_l AS [País],
			pr.xdescripcion_l AS [Provincia],
			c.xdescripcion_l AS [Ciudad],
			co.xdescripcion_l AS [Corregimiento],
			b.xdescripcion_l AS [Barriada],
			s.xdescripcion_l AS [Sucursal],
			LTRIM(RTRIM(e.xavecalle)) AS [Ubicación],
			LTRIM(RTRIM(e.xdirecobro)) AS [Dir. de Cobro],

			/* CONTACTO */
			LTRIM(RTRIM(e.xtelef1)) AS [Oficina 1],
			LTRIM(RTRIM(e.xtelef2)) AS [Oficina 2],
			LTRIM(RTRIM(e.xtelefhab)) AS [Casa],
			LTRIM(RTRIM(e.xtelefcel)) AS [Celular],
			LTRIM(RTRIM(e.xfax)) AS [Fax],
			LTRIM(RTRIM(e.xemail)) AS [Email 1],
			LTRIM(RTRIM(e.xemailhab)) AS [Email 2],

			CASE WHEN e.bcorre_mail = 1 THEN 'Sí' ELSE 'No' END AS [Email],
			CASE WHEN e.bcorre_fax = 1 THEN 'Sí' ELSE 'No' END AS [Fax habilitado],
			CASE WHEN e.bcorre_int = 1 THEN 'Sí' ELSE 'No' END AS [Email Interno],
			CASE WHEN e.bcorrespon = 1 THEN 'Sí' ELSE 'No' END AS [Apartado Postal],

			/* SITUACIÓN */
			estado_ente.xdescripcion_l AS [Vigente],
			administrativa.xdescripcion_l AS [Administrativa],
			siniestros.xdescripcion_l AS [Siniestros],
			tesoreria.xdescripcion_l AS [Tesorería],
			exoneracion.xdescripcion_l AS [Exoneración],

			/* CLASIFICACIÓN */
			e.cgrupoecono AS [Código Grupo Económico],
			LTRIM(RTRIM(e.cactividad)) AS [Código Actividad Económica],

			/* ROLES */
			CASE WHEN e.bcliente = 1 THEN 'Sí' ELSE 'No' END AS [Es Cliente],
			CASE WHEN e.bproductor = 1 THEN 'Sí' ELSE 'No' END AS [Productor],
			CASE WHEN e.bacreedor = 1 THEN 'Sí' ELSE 'No' END AS [Acreedor],
			CASE WHEN e.bcobrador = 1 THEN 'Sí' ELSE 'No' END AS [Cobrador],
			CASE WHEN e.bgrupoeco = 1 THEN 'Sí' ELSE 'No' END AS [Grupo Económico],
			CASE WHEN e.bempresa = 1 THEN 'Sí' ELSE 'No' END AS [Empresa],
			CASE WHEN e.bbanco = 1 THEN 'Sí' ELSE 'No' END AS [Banco],
			CASE WHEN e.breasegurador = 1 THEN 'Sí' ELSE 'No' END AS [Reasegurador],
			CASE WHEN e.bcoasegurador = 1 THEN 'Sí' ELSE 'No' END AS [Coasegurador],
			CASE WHEN e.bcorredor_rea = 1 THEN 'Sí' ELSE 'No' END AS [Corredor Reaseguro],
			CASE WHEN e.bajustador = 1 THEN 'Sí' ELSE 'No' END AS [Ajustador],
			CASE WHEN e.bprov_adm = 1 THEN 'Sí' ELSE 'No' END AS [Proveedor],
			CASE WHEN e.bagenban = 1 THEN 'Sí' ELSE 'No' END AS [P.Bancario],
			CASE WHEN e.btaller = 1 THEN 'Sí' ELSE 'No' END AS [Taller],
			CASE WHEN e.bempleado = 1 THEN 'Sí' ELSE 'No' END AS [Empleado],
			CASE WHEN e.bsupervisor = 1 THEN 'Sí' ELSE 'No' END AS [Supervisor],
			CASE WHEN e.bnotaria = 1 THEN 'Sí' ELSE 'No' END AS [Notaria],
			CASE WHEN e.bbeneficiario = 1 THEN 'Sí' ELSE 'No' END AS [Beneficiario],
			CASE WHEN e.bfinanciera = 1 THEN 'Sí' ELSE 'No' END AS [Reserva],
			CASE WHEN e.bcajero = 1 THEN 'Sí' ELSE 'No' END AS [Cajero],
			CASE WHEN e.binvestiga = 1 THEN 'Sí' ELSE 'No' END AS [Investigador],
			CASE WHEN e.bnotifica = 1 THEN 'Sí' ELSE 'No' END AS [Notificador Siniestros],
			CASE WHEN e.brepuesto = 1 THEN 'Sí' ELSE 'No' END AS [Repuestos],
			CASE WHEN e.bgerente = 1 THEN 'Sí' ELSE 'No' END AS [Gerente],
			CASE WHEN e.bcventa = 1 THEN 'Sí' ELSE 'No' END AS [Canal de Venta],

			/* OBSERVACIONES Y AUDITORÍA */
			LTRIM(RTRIM(e.xobserva)) AS [Observaciones],
			e.fingreso AS [Fecha Ingreso],
			e.fultmod AS [Fecha Última Modificación]

		FROM maentes e

		LEFT JOIN maentes_ext me
			ON me.cci_rif = e.cci_rif

		LEFT JOIN mapaises p
			ON p.cpais = e.cpais

		LEFT JOIN maestados pr
			ON pr.cpais = e.cpais
			AND pr.cestado = e.cestado

		LEFT JOIN maciudades c
			ON c.cpais = e.cpais
			AND c.cestado = e.cestado
			AND c.cciudad = e.cciudad

		LEFT JOIN macorregi co
			ON co.cpais = e.cpais
			AND co.cestado = e.cestado
			AND co.cciudad = e.cciudad
			AND co.ccorregi = e.ccorregi

		LEFT JOIN mabarriada b
			ON b.cpais = e.cpais
			AND b.cestado = e.cestado
			AND b.cciudad = e.cciudad
			AND b.ccorregi = e.ccorregi
			AND b.cbarriada = e.cbarriada

		LEFT JOIN masucur s
			ON s.csucur = e.csucur

		OUTER APPLY
		(
			SELECT TOP (1)
				LTRIM(RTRIM(mc.xdescripcion_l)) AS xdescripcion_l
			FROM macodigos mc
			WHERE LTRIM(RTRIM(mc.ccodigo)) = LTRIM(RTRIM(e.xtipodoc))
				AND
				(
					UPPER(LTRIM(RTRIM(mc.xsinonimo))) LIKE '%DOC%'
					OR UPPER(LTRIM(RTRIM(mc.xsinonimo))) LIKE '%IDENT%'
					OR UPPER(LTRIM(RTRIM(mc.xsinonimo))) LIKE '%CED%'
				)
				AND (mc.iestado = 'V' OR mc.iestado IS NULL)
			ORDER BY mc.norden, mc.xdescripcion_l
		) tipo_identificacion

		OUTER APPLY
		(
			SELECT TOP (1)
				LTRIM(RTRIM(xdescripcion_l)) AS xdescripcion_l
			FROM macodigos
			WHERE LTRIM(RTRIM(xsinonimo)) = 'xprefijo'
				AND LTRIM(RTRIM(ccodigo)) = LTRIM(RTRIM(e.xprefijo))
		) tratamiento

		OUTER APPLY
		(
			SELECT TOP (1)
				LTRIM(RTRIM(xdescripcion_l)) AS xdescripcion_l
			FROM macodigos
			WHERE LTRIM(RTRIM(xsinonimo)) = 'isexo'
				AND LTRIM(RTRIM(ccodigo)) = LTRIM(RTRIM(e.isexo))
		) sexo

		OUTER APPLY
		(
			SELECT TOP (1)
				LTRIM(RTRIM(xdescripcion_l)) AS xdescripcion_l
			FROM macodigos
			WHERE LTRIM(RTRIM(xsinonimo)) = 'iedocivil'
				AND LTRIM(RTRIM(ccodigo)) = LTRIM(RTRIM(e.iedocivil))
		) estado_civil

		OUTER APPLY
		(
			SELECT TOP (1)
				LTRIM(RTRIM(xdescripcion_l)) AS xdescripcion_l
			FROM macodigos
			WHERE LTRIM(RTRIM(xsinonimo)) = 'istatcli'
				AND LTRIM(RTRIM(ccodigo)) = LTRIM(RTRIM(e.istatcli))
		) estado_ente

		OUTER APPLY
		(
			SELECT TOP (1)
				LTRIM(RTRIM(xdescripcion_l)) AS xdescripcion_l
			FROM macodigos
			WHERE UPPER(LTRIM(RTRIM(xsinonimo))) = 'TIPOACTIECONOMICA'
				AND LTRIM(RTRIM(ccodigo)) =
					LTRIM(RTRIM(me.actividadempresa))
		) actividad_economica

		OUTER APPLY
		(
			SELECT TOP (1)
				LTRIM(RTRIM(xdescripcion_l)) AS xdescripcion_l
			FROM macodigos
			WHERE UPPER(LTRIM(RTRIM(xsinonimo))) = 'TIPOPERSONAJURIDICA'
				AND LTRIM(RTRIM(ccodigo)) =
					LTRIM(RTRIM(me.nacionalidad_juridica))
		) tipo_persona_juridica

		OUTER APPLY
		(
			SELECT TOP (1)
				LTRIM(RTRIM(xdescripcion_l)) AS xdescripcion_l
			FROM macodigos
			WHERE LTRIM(RTRIM(xsinonimo)) = 'iadministra'
				AND LTRIM(RTRIM(ccodigo)) = LTRIM(RTRIM(e.iadministra))
		) administrativa

		OUTER APPLY
		(
			SELECT TOP (1)
				LTRIM(RTRIM(xdescripcion_l)) AS xdescripcion_l
			FROM macodigos
			WHERE LTRIM(RTRIM(xsinonimo)) = 'isiniestro'
				AND LTRIM(RTRIM(ccodigo)) = LTRIM(RTRIM(e.isiniestro))
		) siniestros

		OUTER APPLY
		(
			SELECT TOP (1)
				LTRIM(RTRIM(xdescripcion_l)) AS xdescripcion_l
			FROM macodigos
			WHERE LTRIM(RTRIM(xsinonimo)) = 'itesoreria'
				AND LTRIM(RTRIM(ccodigo)) = LTRIM(RTRIM(e.itesoreria))
		) tesoreria

		OUTER APPLY
		(
			SELECT TOP (1)
				LTRIM(RTRIM(xdescripcion_l)) AS xdescripcion_l
			FROM macodigos
			WHERE LTRIM(RTRIM(xsinonimo)) = 'iexon_imp'
				AND LTRIM(RTRIM(ccodigo)) = LTRIM(RTRIM(e.iexon_imp))
		) exoneracion 
	WHERE e.xtipodoc = @tipodoc;
	
	SET @i += 1;

end

SELECT *
FROM Entes
WHERE RegistroPorTipo <= 3
ORDER BY
    [Tipo de identificación],
    [ID SIS] DESC;

