USE SIS11
GO

DECLARE @CajaId VARCHAR(50) = '67'

SELECT MAX(CAST(GETDATE() AS DATE)) AS [FechaReporte], tw.Id AS [NumeroCaja], cast(tw.[date] AS DATE) AS [FechaCaja],
Max(u.Id) AS [CodigoCajero], MAX(u.Cajero) Cajero, b.[name] AS [Sucursal], 
ISNULL(e.efectivo,0) AS [Efectivo], ISNULL(ch.cheque,0) AS [Cheque], 
ISNULL(ta.tarjeta,0) AS [Tarjeta], ISNULL(ot.otros,0) AS [Otros],

ISNULL(e.efectivo,0) + ISNULL(ch.cheque,0) + ISNULL(ta.tarjeta,0) + ISNULL(ot.otros,0) AS [IngresadoTotal],
0.00 AS [GastosCobranza], 
ISNULL(dep.deposito,0) AS [Deposito],
0.00 AS [NetoCaja], 

ISNULL(e.efectivo,0) + ISNULL(ch.cheque,0) + ISNULL(ta.tarjeta,0) + ISNULL(ot.otros,0) + ISNULL(dep.deposito,0) AS [SaldoFinal]

FROM dbo.TransferWorkspace tw
CROSS APPLY (SELECT TOP 1 0 Id, cx.nombre Cajero FROM dbo.usr cx WHERE cx.email = tw.[user]) u

OUTER APPLY (SELECT 
SUM(sx.amount) efectivo 
FROM dbo.[SplitPayment] sx 
INNER JOIN dbo.[Transfer] tx ON tx.Id = sx.TransferId
WHERE tx.TransferWorkspaceId = tw.Id and sx.paymentMethod = '1'
AND tx.isExternal = 1 AND tx.executed = 1
and ISNULL(tx.transactionCode,'') <> 'CASHDEP') e

OUTER APPLY (SELECT 
SUM(sch.amount) cheque 
FROM dbo.[SplitPayment] sch
INNER JOIN dbo.[Transfer] tch ON tch.Id = sch.TransferId
WHERE tch.TransferWorkspaceId = tw.Id and sch.paymentMethod = 'ch'
AND tch.isExternal = 1 AND tch.executed = 1
and ISNULL(tch.transactionCode,'') <> 'CASHDEP') ch

OUTER APPLY (SELECT 
SUM(sta.amount) tarjeta 
FROM dbo.[SplitPayment] sta
INNER JOIN dbo.[Transfer] tta ON tta.Id = sta.TransferId
WHERE tta.TransferWorkspaceId = tw.Id and sta.paymentMethod = 'tcd'
AND tta.isExternal = 1 AND tta.executed = 1
and ISNULL(tta.transactionCode,'') <> 'CASHDEP') ta

OUTER APPLY (SELECT 
SUM(sot.amount) otros
FROM dbo.[SplitPayment] sot
INNER JOIN dbo.[Transfer] tot ON tot.Id = sot.TransferId
WHERE tot.TransferWorkspaceId = tw.Id and sot.paymentMethod NOT IN  ('1','ch','tcd')
AND tot.isExternal = 1 AND tot.executed = 1
and ISNULL(tot.transactionCode,'') <> 'CASHDEP') ot

OUTER APPLY (SELECT 
SUM(sdep.amount) deposito 
FROM dbo.[SplitPayment] sdep
INNER JOIN dbo.[Transfer] tdep ON tdep.Id = sdep.TransferId
WHERE tdep.TransferWorkspaceId = tw.Id and tdep.transactionCode = 'CASHDEP'
AND tdep.isExternal = 1 AND tdep.executed = 1) dep

INNER JOIN Branch b ON b.code = tw.branchCode
WHERE tw.Id = @CajaId
GROUP BY tw.Id, cast(tw.[date] AS DATE),
u.Id, b.[name], ISNULL(e.efectivo,0), ISNULL(ch.cheque,0), 
ISNULL(ta.tarjeta,0), ISNULL(ot.otros,0), ISNULL(dep.deposito,0)