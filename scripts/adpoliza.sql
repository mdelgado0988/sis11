USE [GlobalSIS_AG01]
GO

/****** Object:  Table [dbo].[adpoliza]    Script Date: 06/02/2026 02:10:13 p. m. ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[adpoliza](
	[cpoliza] [numeric](26, 0) NOT NULL,
	[fanopol] [smallint] NOT NULL,
	[fmespol] [tinyint] NOT NULL,
	[u_version] [char](2) NULL,
	[cramo] [smallint] NULL,
	[cnpoliza] [char](23) NULL,
	[cproces] [numeric](15, 0) NULL,
	[cplan] [char](10) NULL,
	[cagrupa] [numeric](11, 0) NULL,
	[itipoprod] [char](2) NULL,
	[itiponegocio] [char](2) NULL,
	[istatpol] [char](1) NULL,
	[cmonext] [bit] NULL,
	[itipopol] [char](1) NULL,
	[cnpoliza_mae] [char](23) NULL,
	[cpoliza_mae] [numeric](26, 0) NULL,
	[ccerti_mae] [numeric](26, 0) NULL,
	[iestado] [char](1) NULL,
	[itiporen] [char](1) NULL,
	[iperren] [smallint] NULL,
	[ccauren] [smallint] NULL,
	[bultima] [bit] NOT NULL,
	[iestadoren] [char](1) NULL,
	[csucur] [smallint] NULL,
	[criesgo] [smallint] NULL,
	[cpolnum] [numeric](26, 0) NULL,
	[cultcert] [numeric](11, 0) NULL,
	[casegurado] [numeric](13, 0) NULL,
	[ctenedor] [numeric](13, 0) NULL,
	[cbeneficiario] [numeric](13, 0) NULL,
	[cacreedor] [numeric](13, 0) NULL,
	[cfinanciera] [numeric](13, 0) NULL,
	[itipoingreso] [char](1) NULL,
	[cdisprod] [numeric](11, 0) NULL,
	[czonaprod] [smallint] NULL,
	[cregion] [smallint] NULL,
	[ccentserv] [smallint] NULL,
	[cmercado] [smallint] NULL,
	[cprofesion] [smallint] NULL,
	[cactividad] [numeric](8, 0) NULL,
	[cgrupoecono] [numeric](11, 0) NULL,
	[cempresa] [numeric](11, 0) NULL,
	[cpais] [smallint] NULL,
	[cestado] [char](10) NULL,
	[cciudad] [char](5) NULL,
	[czonpos] [char](10) NULL,
	[cejecta] [numeric](13, 0) NULL,
	[csubprod] [numeric](13, 0) NULL,
	[cmoneda] [char](4) NULL,
	[ptasamon] [numeric](11, 4) NULL,
	[forigen] [datetime] NULL,
	[fdesde] [datetime] NULL,
	[fhasta] [datetime] NULL,
	[xhdesde] [char](8) NULL,
	[pprorrata] [numeric](18, 8) NULL,
	[fanulacion] [datetime] NULL,
	[itipoanul] [char](1) NULL,
	[canula] [smallint] NULL,
	[fdevolucion] [datetime] NULL,
	[idevolucion] [char](1) NULL,
	[iformadevo] [char](1) NULL,
	[xobserva] [nvarchar](1800) NULL,
	[xasegurado] [nvarchar](800) NULL,
	[qnumdev] [smallint] NULL,
	[mmontodev] [numeric](17, 2) NULL,
	[mmontodevext] [numeric](17, 2) NULL,
	[cprirecibo] [numeric](26, 0) NULL,
	[cultrecibo] [numeric](26, 0) NULL,
	[msumabruta] [numeric](17, 2) NULL,
	[msumabrutaext] [numeric](17, 2) NULL,
	[mpridet] [numeric](17, 2) NULL,
	[mpridetext] [numeric](17, 2) NULL,
	[mprimabruta] [numeric](17, 2) NULL,
	[mprimabrutaext] [numeric](17, 2) NULL,
	[pcoa] [smallint] NULL,
	[msumacoa] [numeric](17, 2) NULL,
	[msumacoaext] [numeric](17, 2) NULL,
	[mprimacoa] [numeric](17, 2) NULL,
	[mprimacoaext] [numeric](17, 2) NULL,
	[pretcoa] [smallint] NULL,
	[msuma] [numeric](17, 2) NULL,
	[msumaext] [numeric](17, 2) NULL,
	[mprima] [numeric](17, 2) NULL,
	[mprimaext] [numeric](17, 2) NULL,
	[potrosdes] [numeric](11, 4) NULL,
	[motrosdes] [numeric](17, 2) NULL,
	[motrosdesext] [numeric](17, 2) NULL,
	[potrosrec] [numeric](11, 4) NULL,
	[motrosrec] [numeric](17, 2) NULL,
	[motrosrecext] [numeric](17, 2) NULL,
	[pgastos] [numeric](13, 6) NULL,
	[mgastos] [numeric](17, 2) NULL,
	[mgastosext] [numeric](17, 2) NULL,
	[potrosgas] [numeric](11, 4) NULL,
	[motrosgas] [numeric](17, 2) NULL,
	[motrosgasext] [numeric](17, 2) NULL,
	[mabono] [numeric](17, 2) NULL,
	[mabonoext] [numeric](17, 2) NULL,
	[pimpuesto] [numeric](13, 6) NULL,
	[mimpuesto] [numeric](17, 2) NULL,
	[mimpuestoext] [numeric](17, 2) NULL,
	[mmontopol] [numeric](17, 2) NULL,
	[mmontopolext] [numeric](17, 2) NULL,
	[mpret] [numeric](17, 2) NULL,
	[mpretext] [numeric](17, 2) NULL,
	[mpcedida] [numeric](17, 2) NULL,
	[mpcedidaext] [numeric](17, 2) NULL,
	[mpfp] [numeric](17, 2) NULL,
	[mpfpext] [numeric](17, 2) NULL,
	[mprimadev] [numeric](17, 2) NULL,
	[mprimadevext] [numeric](17, 2) NULL,
	[pcomision] [numeric](13, 6) NULL,
	[mcomision] [numeric](17, 2) NULL,
	[mcomisionext] [numeric](17, 2) NULL,
	[ccobrador] [numeric](13, 0) NULL,
	[pcobrador] [numeric](11, 4) NULL,
	[mcobrador] [numeric](17, 2) NULL,
	[mcobradorext] [numeric](17, 2) NULL,
	[csupervisor] [numeric](13, 0) NULL,
	[psupervisor] [numeric](11, 4) NULL,
	[msupervisor] [numeric](17, 2) NULL,
	[msupervisorext] [numeric](17, 2) NULL,
	[cgerente] [numeric](13, 0) NULL,
	[pgerente] [numeric](11, 4) NULL,
	[mgerente] [numeric](17, 2) NULL,
	[mgerenteext] [numeric](17, 2) NULL,
	[pinteres] [numeric](13, 6) NULL,
	[minteres] [numeric](17, 2) NULL,
	[minteresext] [numeric](17, 2) NULL,
	[xnprestamo] [nvarchar](25) NULL,
	[clider] [int] NULL,
	[ccesionlider] [numeric](11, 0) NULL,
	[crecibolider] [numeric](26, 0) NULL,
	[cpolizalider] [char](40) NULL,
	[nadendo] [numeric](26, 0) NULL,
	[cendoso] [int] NOT NULL,
	[itipoven] [char](1) NULL,
	[iperven] [smallint] NULL,
	[iestadoven] [char](1) NULL,
	[cplan_vida] [char](10) NULL,
	[fnacimien] [datetime] NULL,
	[qedadini] [tinyint] NULL,
	[ffact_desde] [datetime] NULL,
	[ffact_hasta] [datetime] NULL,
	[fpagado_hasta] [datetime] NULL,
	[cforcob] [smallint] NULL,
	[czona_cobro] [smallint] NULL,
	[cbanco] [numeric](11, 0) NULL,
	[cagenban] [numeric](11, 0) NULL,
	[xcuentabanc] [char](30) NULL,
	[itipocta] [char](1) NULL,
	[xtarjeta] [char](30) NULL,
	[itarjeta] [char](2) NULL,
	[fanomes] [numeric](7, 0) NULL,
	[qcuotas] [smallint] NULL,
	[ifrecuencia] [char](1) NULL,
	[ctiporamo] [char](1) NULL,
	[qunidades] [smallint] NULL,
	[pdesflota] [numeric](11, 4) NULL,
	[nsemana] [smallint] NULL,
	[nano] [smallint] NULL,
	[nauditoria] [numeric](17, 0) NULL,
	[creferido] [numeric](13, 0) NOT NULL,
	[csucurpromo] [numeric](13, 0) NOT NULL,
	[bcumulo] [bit] NULL,
	[SALDOPRESTAMO] [numeric](17, 2) NULL,
	[CNIT] [char](12) NULL,
	[IESTABAN] [char](2) NULL,
	[XCORREOEJE] [char](60) NULL,
	[BCANBAN] [bit] NULL,
	[ICAUSACANBAN] [char](2) NULL,
	[FCANBAN] [datetime] NULL,
	[BPAGAR] [bit] NULL,
	[BINFEJE] [bit] NULL,
	[XOBJASE] [varchar](5000) NULL,
	[catendido] [numeric](13, 0) NULL,
	[cprog] [char](20) NULL,
	[ifuente] [char](10) NULL,
	[bok] [char](1) NULL,
	[cerror] [char](20) NULL,
	[fingreso] [datetime] NULL,
	[cusuario] [numeric](11, 0) NULL,
	[cusuariomod] [numeric](11, 0) NULL,
	[cusuarioauto] [numeric](11, 0) NULL,
	[ccategoria] [smallint] NULL,
	[ccategoriamod] [smallint] NULL,
	[ccategoriaauto] [smallint] NULL,
	[fultmod] [datetime] NULL,
	[cforpagban] [char](2) NULL,
	[ctipocta] [char](2) NULL,
	[qcuotasbanc] [smallint] NULL,
	[iestatemi] [char](1) NULL,
	[idfuentefondo] [int] NULL,
	[ccorredorSeg] [int] NULL,
	[cventa] [int] NULL,
 CONSTRAINT [PK_adpoliza] PRIMARY KEY NONCLUSTERED 
(
	[cpoliza] ASC,
	[fanopol] ASC,
	[fmespol] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[adpoliza] ADD  CONSTRAINT [DF_adpoliza_bultima]  DEFAULT ((0)) FOR [bultima]
GO

ALTER TABLE [dbo].[adpoliza] ADD  CONSTRAINT [DF_adpoliza_csubprod]  DEFAULT ((0)) FOR [csubprod]
GO

ALTER TABLE [dbo].[adpoliza] ADD  CONSTRAINT [DF_adpoliza_xhdesde]  DEFAULT ('12:00 AM') FOR [xhdesde]
GO

ALTER TABLE [dbo].[adpoliza] ADD  CONSTRAINT [DF_adpoliza_pprorrata]  DEFAULT ((1)) FOR [pprorrata]
GO

ALTER TABLE [dbo].[adpoliza] ADD  CONSTRAINT [DF_adpoliza_xnprestamo]  DEFAULT ((0)) FOR [xnprestamo]
GO

ALTER TABLE [dbo].[adpoliza] ADD  CONSTRAINT [DF_adpoliza_nadendo]  DEFAULT ((0)) FOR [nadendo]
GO

ALTER TABLE [dbo].[adpoliza] ADD  CONSTRAINT [DF_adpoliza_cendoso]  DEFAULT ((0)) FOR [cendoso]
GO

ALTER TABLE [dbo].[adpoliza] ADD  CONSTRAINT [DF_adpoliza_creferido]  DEFAULT ((0)) FOR [creferido]
GO

ALTER TABLE [dbo].[adpoliza] ADD  CONSTRAINT [DF_adpoliza_csucurpromo]  DEFAULT ((0)) FOR [csucurpromo]
GO

ALTER TABLE [dbo].[adpoliza] ADD  CONSTRAINT [DF_adpoliza_bcumulo]  DEFAULT ((0)) FOR [bcumulo]
GO

ALTER TABLE [dbo].[adpoliza] ADD  CONSTRAINT [DF_adpoliza_SALDOPRESTAMO_1]  DEFAULT ((0)) FOR [SALDOPRESTAMO]
GO

ALTER TABLE [dbo].[adpoliza] ADD  CONSTRAINT [DF_adpoliza_IESTABAN_1]  DEFAULT ((0)) FOR [IESTABAN]
GO

ALTER TABLE [dbo].[adpoliza] ADD  CONSTRAINT [DF_adpoliza_BCANBAN_1]  DEFAULT ((0)) FOR [BCANBAN]
GO

ALTER TABLE [dbo].[adpoliza] ADD  CONSTRAINT [DF_adpoliza_ICAUSACANBAN_1]  DEFAULT ((0)) FOR [ICAUSACANBAN]
GO

ALTER TABLE [dbo].[adpoliza] ADD  CONSTRAINT [DF_adpoliza_BPAGAR_1]  DEFAULT ((0)) FOR [BPAGAR]
GO

ALTER TABLE [dbo].[adpoliza] ADD  CONSTRAINT [DF_adpoliza_BINFEJE_1]  DEFAULT ((0)) FOR [BINFEJE]
GO

ALTER TABLE [dbo].[adpoliza] ADD  CONSTRAINT [DF_adpoliza_catendido_1]  DEFAULT ((0)) FOR [catendido]
GO

ALTER TABLE [dbo].[adpoliza] ADD  CONSTRAINT [DF_adpoliza_cforpagban_1]  DEFAULT ((0)) FOR [cforpagban]
GO

ALTER TABLE [dbo].[adpoliza] ADD  CONSTRAINT [DF_adpoliza_ctipocta_1]  DEFAULT ((0)) FOR [ctipocta]
GO

ALTER TABLE [dbo].[adpoliza] ADD  CONSTRAINT [DF_adpoliza_iestatemi_1]  DEFAULT ((0)) FOR [iestatemi]
GO

ALTER TABLE [dbo].[adpoliza] ADD  CONSTRAINT [DF_adpoliza_idfuentefondo_1]  DEFAULT ((0)) FOR [idfuentefondo]
GO


