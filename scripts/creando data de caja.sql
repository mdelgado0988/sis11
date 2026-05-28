USE SIS11
go

truncate table TransferWorkspace

INSERT INTO TransferWorkspace ([user], [date], branchCode, closed)
VALUES
('mayerling.monsalve@axxis-systems.com', '2025-12-16T01:20:46.005', 1, 0),
('mayerling.monsalve@axxis-systems.com', '2025-12-16T14:11:07.803', 1, 0),
('mayerling.monsalve@axxis-systems.com', '2025-12-17T13:51:29.748', 1, 0),
('mayerling.monsalve@axxis-systems.com', '2025-12-18T15:42:32.081', 1, 0),
('mayerling.monsalve@axxis-systems.com', '2025-12-19T02:26:58.814', 1, 0),
('mayerling.monsalve@axxis-systems.com', '2025-12-19T15:00:20.385', 1, 0),
('mayerling.monsalve@axxis-systems.com', '2025-12-23T15:34:24.871', 1, 0),
('Michael.Delgado@axxis-systems.com',    '2025-12-23T17:13:35.887', 1, 0),
('Michael.Delgado@axxis-systems.com',    '2025-12-23T17:20:22.891', 1, 0),
('Michael.Delgado@axxis-systems.com',    '2025-12-23T20:04:50.615', 1, 0),
('mayerling.monsalve@axxis-systems.com', '2025-12-26T18:16:06.670', 1, 0),
('mbatres@axxis-systems.com',            '2025-12-26T21:21:31.283', 8, 0),
('mbatres@axxis-systems.com',            '2025-12-26T21:21:59.042', 8, 0),
('mayerling.monsalve@axxis-systems.com', '2025-12-28T00:36:50.590', 1, 0),
('mayerling.monsalve@axxis-systems.com', '2025-12-29T15:54:30.820', 1, 0),
('Michael.Delgado@axxis-systems.com',    '2025-12-29T19:03:33.305', 1, 0),
('mayerling.monsalve@axxis-systems.com', '2025-12-29T20:02:45.891', 1, 0),
('Michael.Delgado@axxis-systems.com',    '2025-12-29T21:12:59.482', 1, 0),
('ramon.garcia@axxis-systems.com',       '2025-12-29T23:03:03.800', 2, 0),
('ramon.garcia@axxis-systems.com',       '2025-12-30T13:47:43.878', 1, 0),
('mayerling.monsalve@axxis-systems.com', '2025-12-30T18:04:19.004', 1, 0),
('mayerling.monsalve@axxis-systems.com', '2026-01-04T21:27:45.636', 1, 0),
('noel.obando@axxis-systems.com',        '2026-01-06T16:36:09.361', 1, 0),
('ramon.garcia@axxis-systems.com',       '2026-01-07T14:33:43.343', 1, 0),
('mayerling.monsalve@axxis-systems.com', '2026-01-12T17:59:09.009', 1, 0),
('mayerling.monsalve@axxis-systems.com', '2026-01-12T17:59:13.863', 1, 0),
('mayerling.monsalve@axxis-systems.com', '2026-01-13T13:47:18.617', 1, 0),
('mayerling.monsalve@axxis-systems.com', '2026-01-14T13:23:28.410', 1, 0),
('mayerling.monsalve@axxis-systems.com', '2026-01-21T13:45:04.678', 1, 0),
('mbatres@axxis-systems.com',            '2026-01-23T14:48:58.510', 1, 0),
('mayerling.monsalve@axxis-systems.com', '2026-01-27T15:58:36.218', 1, 0),
('mbatres@axxis-systems.com',            '2026-01-30T20:59:09.036', 2, 0),
('Michael.Delgado@axxis-systems.com',    '2026-02-03T14:59:27.223', 1, 0),
('Michael.Delgado@axxis-systems.com',    '2026-02-03T15:06:23.611', 1, 0);

GO

truncate table Transfer

SET IDENTITY_INSERT [Transfer] ON;

INSERT INTO [dbo].[Transfer] (
    [id],
    [amount],
    [currency],
    [concept],
    [sourceAccountId],
    [sourceName],
    [destinationAccountId],
    [destinationName],
    [executed],
    [status],
    [date],
    [allocationId],
    [sourceExternal],
    [isExternal],
    [transactionCode],
    [operatingAccountId],
    [lifePolicyId],
    [producer],
    [reversalDate],
    [incomeType],
    [transferWorkspaceId],
    [jForm],
    [formId],
    [processId],
    [claimId],
    [jIncomeTypeForm],
    [reversalCause],
    [reversalSubcause],
    [jReversalFormValues],
    [claimPaymentId],
    [coverageId],
    [user],
    [processIdAux],
    [approvalId]
)
VALUES
(328,40,'USD','IW',NULL,NULL,561,NULL,1,1,'2026-01-27T16:08:22.3967898',70,'CajaDOP',1,NULL,0,NULL,NULL,NULL,'IT7',31,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'mayerling.monsalve@axxis-systems.com',NULL,NULL),
(332,30,'USD','IW',NULL,NULL,561,NULL,1,1,'2026-01-27T16:25:35.4856032',71,'CajaDOP',1,NULL,0,NULL,NULL,NULL,'IT7',31,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'mayerling.monsalve@axxis-systems.com',NULL,NULL),
(336,50,'USD','IW',NULL,NULL,561,NULL,1,1,'2026-01-27T16:39:24.7745286',72,'CajaDOP',1,NULL,0,NULL,NULL,NULL,'IT7',31,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'mayerling.monsalve@axxis-systems.com',NULL,NULL),
(338,20,'USD','IW',NULL,NULL,561,NULL,1,1,'2026-01-27T16:43:07.2746389',73,'CajaDOP',1,NULL,0,NULL,NULL,NULL,'IT7',31,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'mayerling.monsalve@axxis-systems.com',NULL,NULL),
(341,20,'USD','IW',NULL,NULL,561,NULL,1,1,'2026-01-27T16:45:48.9668548',74,'CajaDOP',1,NULL,0,NULL,NULL,NULL,'IT7',31,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'mayerling.monsalve@axxis-systems.com',NULL,NULL),
(344,10,'USD','IW',NULL,NULL,561,NULL,1,1,'2026-01-27T16:51:16.5227666',75,'CajaDOP',1,NULL,0,NULL,NULL,NULL,'IT7',31,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'mayerling.monsalve@axxis-systems.com',NULL,NULL),
(347,8,'USD','IW',NULL,NULL,561,NULL,1,1,'2026-01-27T16:53:10.6074925',76,'CajaDOP',1,NULL,0,NULL,NULL,NULL,'IT7',31,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'mayerling.monsalve@axxis-systems.com',NULL,NULL),
(350,6.69,'USD','IW',NULL,NULL,561,NULL,1,1,'2026-01-27T16:57:27.069931',77,'CajaDOP',1,NULL,0,NULL,NULL,NULL,'IT7',31,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'mayerling.monsalve@axxis-systems.com',NULL,NULL),
(352,16,'USD','IW',NULL,NULL,561,NULL,1,2,'2026-01-27T16:58:26.1708067',78,'CajaDOP',1,NULL,0,NULL,NULL,'2026-01-27T17:01:01.9701641','IT7',31,NULL,NULL,NULL,NULL,NULL,'EDI','25',NULL,NULL,NULL,'mayerling.monsalve@axxis-systems.com',NULL,NULL),
(356,-16,'USD','IW (Reversal of 352)',NULL,NULL,561,NULL,1,1,'2026-01-27T17:01:01.9731674',78,'CajaDOP',1,NULL,0,NULL,NULL,NULL,'IT7',31,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'mayerling.monsalve@axxis-systems.com',NULL,NULL),
(360,16,'USD','IW',NULL,NULL,561,NULL,1,1,'2026-01-27T17:02:09.507864',79,'CajaDOP',1,NULL,0,NULL,NULL,NULL,'IT7',31,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'mayerling.monsalve@axxis-systems.com',NULL,NULL),
(364,57.56,'USD','IW',NULL,NULL,561,NULL,1,1,'2026-01-27T17:04:19.5314411',80,'CajaDOP',1,NULL,  0,NULL,NULL,NULL,'IT7',31,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'mayerling.monsalve@axxis-systems.com',NULL,NULL),
(374,1000,'USD','IW',NULL,NULL,561,NULL,
1,1,'2026-01-30T20:37:47.4643849',NULL,'CajaDOP',1,NULL,0,NULL,NULL,NULL,'3',
31,                     -- transferWorkspaceId
NULL,                   -- jForm
NULL,                   -- formId
NULL,                   -- processId
NULL,                   -- claimId
'[{"type":"text","required":false,"label":"Pagador","className":"ant-input row-1 col-md-8","name":"pagador","access":false,"subtype":"text","userData":["ERNESTO RAMON"]},{"type":"text","required":false,"label":"Identificación","className":"ant-input row-1 col-md-4","name":"identificacionPagador","access":false,"subtype":"text","userData":["58-4793-98435"]}]', -- jIncomeTypeForm
NULL,                   -- reversalCause
NULL,                   -- reversalSubcause
NULL,                   -- jReversalFormValues
NULL,                   -- claimPaymentId
NULL,                   -- coverageId
'mayerling.monsalve@axxis-systems.com',
NULL,
NULL),
(375,100,'USD','Test Dep1',NULL,NULL,208,NULL,1,1,'2026-01-30T20:39:05.8521554',NULL,'USD DEP',1,'CASHDEP',0,NULL,'CASHIER',NULL,NULL,31,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'mayerling.monsalve@axxis-systems.com',NULL,NULL),
(378,100,'USD','Test1122',NULL,NULL,208,NULL,1,1,'2026-02-03T14:15:18.6324436',NULL,'USD DEP',1,'CASHDEP',0,NULL,'CASHIER',NULL,NULL,31,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Michael.Delgado@axxis-systems.com',NULL,NULL);

SET IDENTITY_INSERT [Transfer] OFF;

go

truncate table [SplitPayment]

SET IDENTITY_INSERT [SplitPayment] ON;

INSERT INTO [SplitPayment]
 (
    id,
    transferId,
    paymentMethod,
    amount,
    conversion,
    currency,
    exchangeRate,
    amountEx,
    formId,
    jValues,
    paymentMethodName,
    depositId,
    disputeEnd,
    disputeStart
)
VALUES
(144,328,'1',40,0,'USD',0,0,0,NULL,'EFECTIVO',375,NULL,NULL),
(145,332,'1',30,0,'USD',0,0,0,NULL,'EFECTIVO',375,NULL,NULL),
(146,336,'1',50,0,'USD',0,0,0,NULL,'EFECTIVO',375,NULL,NULL),
(147,338,'1',20,0,'USD',0,0,0,NULL,'EFECTIVO',375,NULL,NULL),
(148,341,'1',20,0,'USD',0,0,0,NULL,'EFECTIVO',375,NULL,NULL),
(149,344,'1',10,0,'USD',0,0,0,NULL,'EFECTIVO',375,NULL,NULL),
(150,347,'1',8,0,'USD',0,0,0,NULL,'EFECTIVO',375,NULL,NULL),
(151,350,'1',6.69,0,'USD',0,0,0,NULL,'EFECTIVO',375,NULL,NULL),
(152,352,'1',16,0,'USD',0,0,0,NULL,'EFECTIVO',375,NULL,NULL),
(153,356,'1',-16,0,'USD',0,0,0,NULL,'EFECTIVO',375,NULL,NULL),
(154,360,'1',16,0,'USD',0,0,0,NULL,'EFECTIVO',375,NULL,NULL),
(155,364,'1',57.56,0,'USD',0,0,0,NULL,'EFECTIVO',375,NULL,NULL),
(156,374,'CH',1000,0,'USD',0,0,632,
 '[{"type":"text","required":true,"label":"Número de cheque","placeholder":"Digite el número del cheque","className":"ant-input col-md-6 row-1","name":"numeroCheque","access":false,"subtype":"text","userData":["2222"]},{"type":"date","required":true,"label":"Fecha del cheque","className":"ant-input col-md-6 row-1","name":"fechaCheque","access":false,"userData":["2026-01-30"]},{"type":"select","required":true,"label":"Banco","placeholder":"Seleccione el banco emisor","className":"ant-input col-md-6 row-2","name":"bancoCheque","access":false,"multiple":false,"values":[{"label":"Option 1","value":"0","selected":true},{"label":"Option 2","value":"1","selected":false}],"userData":["80"]}]',
 'CHEQUE',378,NULL,NULL),
(157,375,'1',-100,0,'USD',0,0,NULL,NULL,NULL,375,NULL,NULL),
(159,378,'CH',-100,0,'USD',0,0,NULL,NULL,NULL,378,NULL,NULL);

SET IDENTITY_INSERT [SplitPayment] OFF;

go

delete [Usr]

INSERT INTO [dbo].[Usr] (
    [email],
    [nombre],
    [esAdmin],
    [clave],
    [token],
    [otp],
    [blocked],
    [retries],
    [lastLogin],
    [lastPasswordChange],
    [branchCode],
    [external],
    [contactId],
    [forcePasswordChange]
)
VALUES
(
    'mayerling.monsalve@axxis-systems.com',
    'Mayerling Monsalve',
    0,              -- esAdmin
    NULL,           -- clave
    NULL,           -- token
    NULL,           -- otp
    0,              -- blocked
    0,              -- retries
    NULL,           -- lastLogin
    NULL,           -- lastPasswordChange
    NULL,           -- branchCode
    0,              -- external
    NULL,           -- contactId
    0               -- forcePasswordChange
),
(
    'Michael.Delgado@axxis-systems.com',
    'Michael Delgado',
    1,              -- esAdmin (lo dejo admin por tu rol técnico, cambia si no aplica)
    NULL,
    NULL,
    NULL,
    0,
    0,
    NULL,
    NULL,
    NULL,
    0,
    NULL,
    0
);


INSERT INTO [dbo].[Usr] (
    [email],
    [nombre],
    [esAdmin],
    [clave],
    [token],
    [otp],
    [blocked],
    [retries],
    [lastLogin],
    [lastPasswordChange],
    [branchCode],
    [external],
    [contactId],
    [forcePasswordChange]
)
VALUES (
    'max.batres@axxis-systems.com',
    'Max Batres',
    0,      -- esAdmin
    NULL,   -- clave
    NULL,   -- token
    NULL,   -- otp
    0,      -- blocked
    0,      -- retries
    NULL,   -- lastLogin
    NULL,   -- lastPasswordChange
    NULL,   -- branchCode
    0,      -- external
    NULL,   -- contactId
    0       -- forcePasswordChange
);

GO

TRUNCATE TABLE [branch]

INSERT INTO [dbo].[branch] (
    [code],
    [name],
    [active],
    [organizationId],
    [groupId]
)
VALUES
('1', 'Casa Matriz', 1, NULL, NULL),
('2', 'Sucursal 1', 1, NULL, NULL),
('3', 'Sucursal 2', 1, NULL, NULL),
('4', 'Sucursal 3', 1, NULL, NULL),
('5', 'Sucursal 4', 1, NULL, NULL),
('6', 'Sucursal 6', 1, NULL, NULL),
('7', 'Sucursal 7', 1, NULL, NULL),
('8', 'Sucursal 8', 1, NULL, NULL),
('9', 'Sucursal 9', 1, NULL, NULL);

go

truncate table AmlRiskCatalog 

SET IDENTITY_INSERT AmlRiskCatalog on;

INSERT INTO AmlRiskCatalog (id, name)
VALUES 
(1, 'Riesgo Alto'),
(2, 'Riesgo Bajo'),
(3, 'Riesgo Medio'),
(4, 'No Hay Riesgo');

SET IDENTITY_INSERT AmlRiskCatalog OFF;