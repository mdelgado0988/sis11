use sis11
go

declare @cedula varchar(50)=''
declare @nombre varchar(50)='Linneth'
declare @poliza varchar(50)=''
declare @fechaDesde DATE= null
declare @fechaHasta DATE= null
declare @montoDesde decimal(18,2)= 0
declare @montoHasta decimal(18,2)= 0

SELECT
    a.[id] AS movementId,
    allMovements.[entryDate],
    pol.[code] AS policyCode,
    LTRIM(RTRIM(CONCAT(ISNULL(con.[name],''),' ',ISNULL(con.[surname1],''),' ',ISNULL(con.[surname2],'')))) AS payerName,
    COALESCE(NULLIF(LTRIM(RTRIM(con.[nationalId])),''),NULLIF(LTRIM(RTRIM(con.[cnp])),''),NULLIF(LTRIM(RTRIM(con.[nif])),''),NULLIF(LTRIM(RTRIM(con.[passport])),''),'') AS payerId,
    COALESCE(NULLIF(LTRIM(RTRIM(a.[accNo])),''),NULLIF(LTRIM(RTRIM(a.[name])),''),'') AS accountLabel,
    COALESCE(NULLIF(LTRIM(RTRIM(a.[name])),''),NULLIF(LTRIM(RTRIM(a.[accNo])),''),'') AS accountName,
    a.[id] AS accountId,
    a.[currency],
    allMovements.[movementBalance] AS entryAmount,
    CASE
        WHEN allMovements.[movementBalance]-ISNULL(requests.[pendingRefundAmount],0)<0 THEN 0
        ELSE allMovements.[movementBalance]-ISNULL(requests.[pendingRefundAmount],0)
    END AS amount
FROM [Account] a
OUTER APPLY (
    -- The report receives free text, while Cashier filters by the selected contact id.
    SELECT TOP (1) contact.[id]
    FROM [Contact] contact
    WHERE NULLIF(LTRIM(RTRIM(@nombre)),'') IS NOT NULL
      AND (
          ISNULL(contact.[name],'') LIKE N'%'+LTRIM(RTRIM(@nombre))+N'%'
          OR ISNULL(contact.[surname1],'') LIKE N'%'+LTRIM(RTRIM(@nombre))+N'%'
          OR ISNULL(contact.[surname2],'') LIKE N'%'+LTRIM(RTRIM(@nombre))+N'%'
          OR LTRIM(RTRIM(CONCAT(ISNULL(contact.[name],''),' ',ISNULL(contact.[surname1],''),' ',ISNULL(contact.[surname2],'')))) LIKE N'%'+LTRIM(RTRIM(@nombre))+N'%'
          OR ISNULL(contact.[cnp],'') LIKE N'%'+LTRIM(RTRIM(@nombre))+N'%'
          OR ISNULL(contact.[nif],'') LIKE N'%'+LTRIM(RTRIM(@nombre))+N'%'
          OR ISNULL(contact.[passport],'') LIKE N'%'+LTRIM(RTRIM(@nombre))+N'%'
      )
    ORDER BY CASE WHEN LTRIM(RTRIM(CONCAT(ISNULL(contact.[name],''),' ',ISNULL(contact.[surname1],''),' ',ISNULL(contact.[surname2],''))))=LTRIM(RTRIM(@nombre)) THEN 0 ELSE 1 END, contact.[id]
) selectedContact
LEFT JOIN [Contact] con ON con.[id]=COALESCE(selectedContact.[id],a.[holderId])
LEFT JOIN [LifePolicy] pol ON pol.[id]=a.[lifePolicyId]
OUTER APPLY (
    SELECT
        MIN(am.[date]) AS entryDate,
        ISNULL(SUM(ISNULL(am.[amount],0)),0) AS movementBalance
    FROM [AccountMov] am
    WHERE am.[accountId]=a.[id]
      AND ISNULL(am.[transactionCode],'')<>'PREMIUMPAY'
) allMovements
OUTER APPLY (
    SELECT COUNT(*) AS matchingMovements
    FROM [AccountMov] am
    WHERE am.[accountId]=a.[id]
      AND ISNULL(am.[transactionCode],'')<>'PREMIUMPAY'
      AND (
          selectedContact.[id] IS NULL OR EXISTS (
              SELECT 1
              FROM [Transfer] contactTransfer
              OUTER APPLY (
                  SELECT TOP (1) TRY_CONVERT(int,JSON_VALUE(j.[value],'$.userData[0]')) AS contactId
                  FROM OPENJSON(CASE WHEN ISJSON(contactTransfer.[jIncomeTypeForm])=1 THEN contactTransfer.[jIncomeTypeForm] ELSE '[]' END) j
                  WHERE JSON_VALUE(j.[value],'$.name')='hiddenCodigoCliente'
              ) storedContact
              WHERE contactTransfer.[id]=am.[transferId]
                AND COALESCE(storedContact.[contactId],a.[holderId])=selectedContact.[id]
          )
      )
) contactMovements
OUTER APPLY (
    SELECT SUM(ISNULL(cp.[total],0)) AS pendingRefundAmount
    FROM [ClaimPayment] cp
    WHERE cp.[sourceAccountId]=a.[id]
      AND cp.[claimId] IS NULL
      AND (selectedContact.[id] IS NULL OR cp.[contactId]=selectedContact.[id])
      AND (cp.[producer] IS NULL OR (UPPER(ISNULL(cp.[producer],''))='MANUAL' AND ISNULL(cp.[paymentType],'')='15'))
      AND UPPER(ISNULL(cp.[currency],''))=UPPER(ISNULL(a.[currency],''))
      AND UPPER(ISNULL(cp.[entityState],'')) NOT IN ('EXECUTED','REJECTED')
) requests
WHERE a.[type]='TRANSIT'
  AND (NULLIF(LTRIM(RTRIM(@nombre)),'') IS NULL OR selectedContact.[id] IS NOT NULL)
  AND (selectedContact.[id] IS NULL OR contactMovements.[matchingMovements]>0)
  AND ROUND(CASE WHEN allMovements.[movementBalance]-ISNULL(requests.[pendingRefundAmount],0)<0 THEN 0 ELSE allMovements.[movementBalance]-ISNULL(requests.[pendingRefundAmount],0) END,2)<>0
  AND (ISNULL(@cedula,'')='' OR ISNULL(con.[nationalId],'') LIKE N'%'+LTRIM(RTRIM(@cedula))+N'%' OR ISNULL(con.[cnp],'') LIKE N'%'+LTRIM(RTRIM(@cedula))+N'%' OR ISNULL(con.[nif],'') LIKE N'%'+LTRIM(RTRIM(@cedula))+N'%' OR ISNULL(con.[passport],'') LIKE N'%'+LTRIM(RTRIM(@cedula))+N'%')
  AND (ISNULL(@poliza,'')='' OR pol.[code] LIKE N'%'+LTRIM(RTRIM(@poliza))+N'%')
  AND (@fechaDesde IS NULL OR YEAR(@fechaDesde)<1901 OR EXISTS (
      SELECT 1 FROM [AccountMov] md
      WHERE md.[accountId]=a.[id]
        AND ISNULL(md.[transactionCode],'')<>'PREMIUMPAY'
        AND md.[date]>=CONVERT(date,@fechaDesde)))
  AND (@fechaHasta IS NULL OR YEAR(@fechaHasta)<1901 OR EXISTS (
      SELECT 1 FROM [AccountMov] md
      WHERE md.[accountId]=a.[id]
        AND ISNULL(md.[transactionCode],'')<>'PREMIUMPAY'
        AND md.[date]<DATEADD(day,1,CONVERT(date,@fechaHasta))))
  AND (ISNULL(@montoDesde,0)<=0 OR ROUND(CASE WHEN allMovements.[movementBalance]-ISNULL(requests.[pendingRefundAmount],0)<0 THEN 0 ELSE allMovements.[movementBalance]-ISNULL(requests.[pendingRefundAmount],0) END,2)>=@montoDesde)
  AND (ISNULL(@montoHasta,0)<=0 OR ROUND(CASE WHEN allMovements.[movementBalance]-ISNULL(requests.[pendingRefundAmount],0)<0 THEN 0 ELSE allMovements.[movementBalance]-ISNULL(requests.[pendingRefundAmount],0) END,2)<=@montoHasta)
ORDER BY a.[id]
