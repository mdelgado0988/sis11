use sis11
go

declare @cedula varchar(50)='' 
declare @nombre varchar(50)='' 
declare @poliza varchar(50)='' 
declare @fechaDesde DATE= null
declare @fechaHasta DATE= null
declare @montoDesde decimal(18,2)= 0
declare @montoHasta decimal(18,2)= 0

SELECT x.movementId,x.entryDate,x.policyCode,x.payerName,x.payerId,x.accountLabel,x.accountName,x.accountId,x.currency,x.entryAmount,x.amount
FROM (
SELECT e.movementId,e.date AS entryDate,e.accountId,e.currency,e.accountName,
 COALESCE(NULLIF(LTRIM(RTRIM(pa.[code])),''),NULLIF(LTRIM(RTRIM(pt.[code])),''),'') AS policyCode,
 CASE WHEN ce.[id] IS NOT NULL THEN LTRIM(RTRIM(CONCAT(ISNULL(ce.[name],''),' ',ISNULL(ce.[surname1],''),' ',ISNULL(ce.[surname2],''))))
      WHEN e.freeName IS NOT NULL THEN e.freeName
      ELSE ISNULL(LTRIM(RTRIM(CONCAT(ISNULL(ch.[name],''),' ',ISNULL(ch.[surname1],''),' ',ISNULL(ch.[surname2],'')))),'') END AS payerName,
 CASE WHEN ce.[id] IS NOT NULL THEN ISNULL(ce.[nationalId],'') WHEN e.freeName IS NOT NULL THEN '' ELSE ISNULL(ch.[nationalId],'') END AS payerId,
 CASE WHEN e.lifePolicyId IS NOT NULL AND e.[transaction] LIKE 'Cancellation%' THEN N'CRÉDITO POR CANCELACIÓN'
      WHEN e.lifePolicyId IS NOT NULL THEN N'PAGO APLICADO DE MÁS EN PÓLIZA'
      WHEN e.accountName LIKE N'%emisi%' THEN N'EMISIÓN'
      WHEN e.accountName LIKE N'%devol%' THEN N'DEVOLUCIÓN'
      WHEN e.accountName LIKE N'%revers%' THEN N'REVERSIÓN'
      WHEN e.accountName LIKE N'%pendiente%aplicar%' THEN N'PRIMAS PENDIENTES POR APLICAR'
      WHEN e.accountName LIKE N'%otra%prima%' OR e.accountName LIKE N'%otros%' THEN N'PRIMAS OTROS'
      ELSE UPPER(ISNULL(e.accountName,'')) END AS accountLabel,
 e.amount AS entryAmount,
 CASE WHEN e.cumIn-e.outTotal<=0 THEN 0 WHEN e.cumIn-e.outTotal>=e.amount THEN e.amount ELSE e.cumIn-e.outTotal END AS amount
FROM (
 SELECT b.*,
  SUM(CASE WHEN b.amount>0 THEN b.amount ELSE 0 END) OVER (PARTITION BY b.accountId ORDER BY b.date,b.movementId ROWS UNBOUNDED PRECEDING) AS cumIn,
  -SUM(CASE WHEN b.amount<0 THEN b.amount ELSE 0 END) OVER (PARTITION BY b.accountId) + MAX(ISNULL(b.pendingRefundAmount,0)) OVER (PARTITION BY b.accountId) AS outTotal
 FROM (
  SELECT m.[id] AS movementId,m.[accountId],m.[date],m.[amount],m.[transaction],
   COALESCE(NULLIF(LTRIM(RTRIM(a.[name])),''),a.[accNo]) AS accountName,a.[currency],a.[lifePolicyId],a.[holderId],t.[lifePolicyId] AS transferPolicyId,
   f.ente,f.freeName,COALESCE(f.ente,NULLIF(a.[holderId],0),0) AS enteKey,
   ISNULL(requests.pendingRefundAmount,0) AS pendingRefundAmount
  FROM [AccountMov] m
  JOIN [Account] a ON a.[id]=m.[accountId] AND a.[type]='TRANSIT'
  LEFT JOIN [Transfer] t ON t.[id]=m.[transferId]
  OUTER APPLY (SELECT
     MAX(CASE WHEN JSON_VALUE(j.[value],'$.name')='hiddenCodigoCliente' THEN NULLIF(TRY_CONVERT(int,JSON_VALUE(j.[value],'$.userData[0]')),0) END) AS ente,
     MAX(CASE WHEN JSON_VALUE(j.[value],'$.name') IN ('clientePA','txtNombreCliente') THEN NULLIF(LTRIM(RTRIM(JSON_VALUE(j.[value],'$.userData[0]'))),'') END) AS freeName
    FROM OPENJSON(CASE WHEN ISJSON(t.[jIncomeTypeForm])=1 THEN t.[jIncomeTypeForm] ELSE '[]' END) j) f
  OUTER APPLY (SELECT SUM(ISNULL(cp.[total],0)) AS pendingRefundAmount
    FROM [ClaimPayment] cp
    WHERE cp.[sourceAccountId]=a.[id]
      AND cp.[claimId] IS NULL
      AND (cp.[producer] IS NULL OR (UPPER(ISNULL(cp.[producer],''))='MANUAL' AND ISNULL(cp.[paymentType],'')='15'))
      AND UPPER(ISNULL(cp.[currency],''))=UPPER(ISNULL(a.[currency],''))
      AND UPPER(ISNULL(cp.[entityState],'')) NOT IN ('EXECUTED','REJECTED')
  ) requests
  WHERE UPPER(LTRIM(RTRIM(ISNULL(m.[transactionCode],''))))<>'PREMIUMPAY' AND ISNULL(m.[amount],0)<>0
 ) b
) e
LEFT JOIN [Contact] ce ON ce.[id]=e.ente
LEFT JOIN [Contact] ch ON ch.[id]=NULLIF(e.[holderId],0)
LEFT JOIN [LifePolicy] pa ON pa.[id]=e.[lifePolicyId]
LEFT JOIN [LifePolicy] pt ON pt.[id]=e.transferPolicyId
WHERE e.amount>0
) x
WHERE ROUND(x.amount,2)>0
 AND (ISNULL(@cedula,'')='' OR x.payerId LIKE N'%'+LTRIM(RTRIM(@cedula))+N'%')
 AND (ISNULL(@nombre,'')='' OR x.payerName LIKE N'%'+LTRIM(RTRIM(@nombre))+N'%')
 AND (ISNULL(@poliza,'')='' OR x.policyCode LIKE N'%'+LTRIM(RTRIM(@poliza))+N'%')
 AND (@fechaDesde IS NULL OR YEAR(@fechaDesde)<1901 OR x.entryDate>=CONVERT(date,@fechaDesde))
 AND (@fechaHasta IS NULL OR YEAR(@fechaHasta)<1901 OR x.entryDate<DATEADD(day,1,CONVERT(date,@fechaHasta)))
 AND (ISNULL(@montoDesde,0)<=0 OR ROUND(x.amount,2)>=@montoDesde)
 AND (ISNULL(@montoHasta,0)<=0 OR ROUND(x.amount,2)<=@montoHasta)
ORDER BY x.accountId,x.entryDate,x.movementId