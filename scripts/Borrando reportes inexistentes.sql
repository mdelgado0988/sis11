use sis11
go

delete from [Report] where area is null;

delete from [Report] where area in ('Automóvil','Caja','Coaseguro','Cobros','COMMON','Contabilidad','Dashboard','Finanzas'
,'Fiscal','Listado de Pólizas a Renovar Cedida/Facultativo','Operativa','Operativo','Pagos','Polizas','Reaseguro'
,'Reclamos','Regulatorio','Renta Vitalicia','Reportes Operativos','Tesoreria');


select * from [Report] where area in ('Automóvil'
,'Caja'
,'Coaseguro'
,'Cobros'
,'COMMON'
,'Contabilidad'
,'Dashboard'
,'Finanzas'
,'Fiscal'
,'Listado de Pólizas a Renovar Cedida/Facultativo'
,'Operativa'
,'Operativo'
,'Pagos'
,'Polizas'
,'Reaseguro'
,'Reclamos'
,'Regulatorio'
,'Renta Vitalicia'
,'Reportes Operativos'
,'Tesoreria')


SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @Reports TABLE
    (
        area        NVARCHAR(MAX) NULL,
        name        NVARCHAR(MAX) NOT NULL,
        description NVARCHAR(MAX) NULL,
        fileName    NVARCHAR(MAX) NULL,
        restricted  BIT NOT NULL
    );

    INSERT INTO @Reports (area, name, description, fileName, restricted)
    VALUES
    (N'Cobranza', N'Arqueo detallado de caja',
        N'Muestra un detalle de arqueo de una caja',
        N'Arqueo de Caja Detallado', 0),

    (N'Suscripción', N'Bordereu de emisión',
        N'Muestra un detalle del bordereu de emisión',
        N'Bordereau', 0),

    (N'Suscripción', N'Cartera Vigente de pólizas listas a renovar',
        N'Genera un listado de pólizas listas a renovar a una mes de corte',
        N'Cartera Vigente Lista a Renovar', 0),

    (N'Cobranza', N'Depositos a cuentas bancarias en caja',
        N'Permite la generación de un detalle de los movimientos a cuentas bancarias de una caja',
        N'DepositoBancoCaja', 0),

    (N'Cobranza', N'Detalle de recibos de caja',
        N'Genera información detallada de primas cobradas en caja',
        N'DetalleRecibosCaja', 0),

    (N'Cobranza', N'Estado de cuenta de un cliente',
        N'Permite la generación del reporte de estado de cuenta de clienta a una fecha de corte',
        N'EstadoCuentaCliente', 0),

    (N'Suscripción', N'Facturación histórica por mes',
        N'Obtiene un detalle de las pólizas emitidas por mes',
        N'FacturacionHistorica', 0),

    (N'Cobranza', N'Listado de cobros por rango de fecha (Detallado)',
        N'Genera listado detallado de pagos de primas por rango de fechas',
        N'Listado de cobros por rango de fecha (detallado)', 0),

    (N'Cobranza', N'Listado de Cobros por rango de fecha Resumido',
        N'Genera resumen de pagos por ramo de primas por rango de fechas',
        N'Listado de cobros por rango de fecha (resumen)', 0),

    (N'Suscripción', N'Pólizas vigentes',
        N'Obtiene un listado de pólizas vigentes a una fecha',
        N'PolizasVigentes', 0),

    (N'Cobranza', N'ROC',
        N'Recibo oficial de caja',
        N'ReciboGlobal', 0),

    (N'Cobranza', N'ROC Original',
        NULL,
        N'ReciboGlobal_Original', 0),

    (N'Contacto', N'Reporte de Contactos',
        N'Genera un listado de todos los contactos del sistema',
        N'Reporte de Entes', 0),

    (N'Cobranza', N'Reporte de ingresos de caja',
        N'Muestra un detalle de los registros ingresados en caja',
        N'ReporteDeingresos', 0),

    (N'Cobranza', N'Reporte de ingreso detallado de caja',
        N'Reporte de ingreso detallado de caja',
        N'ReporteDeIngresosCaja', 0),

    (N'Cobranza', N'Reporte de Morosidad',
        N'Reporte posición de la cartera',
        N'reportemorosidad', 0),

    (N'Cobranza', N'Reporte Morosidad',
        N'Reporte para Cobros Masivos',
        N'reportemorosidadV2', 0),

    (N'Cobranza', N'Detalle contabilización por cuenta de caja',
        N'Reporte detallado de cuentas contables de movimientos de caja',
        N'ResumenMayorizacionCajaDetalle', 0),

    (N'Cobranza', N'Detalle agrupada de contabilización por cuenta de caja',
        N'Reporte resumido de cuentas contables de movimientos de caja',
        N'ResumenMayorizacionCajaResumen', 0),

    (N'Cobranzas', N'Reporte de Arqueo de Caja Detallado',
        N'El reporte muestra el desglose de ingresos y saldos en caja',
        N'rptArqueoDeCajaDetallado', 0),

    (N'Siniestros', N'Siniestros Pagados',
        N'Reporte de siniestros pagados en un rango de fecha ',
        N'SiniestrosPagados', 0);

    /* Actualiza todos los campos excepto el id.*/
    UPDATE target
       SET target.area = source.area,
           target.description = source.description,
           target.fileName = source.fileName,
           target.restricted = source.restricted
    FROM dbo.[Report] target
    INNER JOIN @Reports source
        ON source.name = target.name;

    /* Registra únicamente los reportes que aún no existen por nombre.*/
    INSERT INTO dbo.[Report]
    (
        area,
        name,
        description,
        fileName,
        restricted
    )
    SELECT
        source.area,
        source.name,
        source.description,
        source.fileName,
        source.restricted
    FROM @Reports source
    WHERE NOT EXISTS
    (
        SELECT 1
        FROM dbo.[Report] target
        WHERE target.name = source.name
    );

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    select 'error'
END CATCH;
