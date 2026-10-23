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
    clientBalance.[entryDate],
    pol.[code] AS policyCode,
    LTRIM(RTRIM(CONCAT(ISNULL(con.[name],''),' ',ISNULL(con.[surname1],''),' ',ISNULL(con.[surname2],'')))) AS payerName,
    COALESCE(NULLIF(LTRIM(RTRIM(con.[nationalId])),''),NULLIF(LTRIM(RTRIM(con.[cnp])),''),NULLIF(LTRIM(RTRIM(con.[nif])),''),NULLIF(LTRIM(RTRIM(con.[passport])),''),'') AS payerId,
    COALESCE(NULLIF(LTRIM(RTRIM(a.[accNo])),''),NULLIF(LTRIM(RTRIM(a.[name])),''),'') AS accountLabel,
    COALESCE(NULLIF(LTRIM(RTRIM(a.[name])),''),NULLIF(LTRIM(RTRIM(a.[accNo])),''),'') AS accountName,
    a.[id] AS accountId,
    a.[currency],
    clientBalance.[movementBalance] AS entryAmount,
    CASE WHEN clientBalance.[movementBalance] - ISNULL(requests.[pendingRefundAmount], 0) < 0 THEN 0
         ELSE clientBalance.[movementBalance] - ISNULL(requests.[pendingRefundAmount], 0) END AS amount
FROM (
    SELECT
        am.[accountId],
        COALESCE(storedContact.[contactId], balanceAccount.[holderId]) AS [contactId],
        MIN(am.[date]) AS [entryDate],
        SUM(ISNULL(am.[amount], 0)) AS [movementBalance]
    FROM [AccountMov] am
    INNER JOIN [Account] balanceAccount ON balanceAccount.[id] = am.[accountId]
    LEFT JOIN [Transfer] movementTransfer ON movementTransfer.[id] = am.[transferId]
    OUTER APPLY (
        SELECT TOP (1) TRY_CONVERT(int, JSON_VALUE(j.[value], '$.userData[0]')) AS [contactId]
        FROM OPENJSON(CASE WHEN ISJSON(movementTransfer.[jIncomeTypeForm]) = 1 THEN movementTransfer.[jIncomeTypeForm] ELSE '[]' END) j
        WHERE JSON_VALUE(j.[value], '$.name') = 'hiddenCodigoCliente'
    ) storedContact
    WHERE ISNULL(am.[transactionCode], '') <> 'PREMIUMPAY'
    GROUP BY am.[accountId], COALESCE(storedContact.[contactId], balanceAccount.[holderId])
) clientBalance
INNER JOIN [Account] a ON a.[id] = clientBalance.[accountId]
OUTER APPLY (
    -- The report receives free text, while Cashier filters by the selected contact id.
    SELECT TOP (1) contact.[id]
    FROM [Contact] contact
    WHERE NULLIF(LTRIM(RTRIM(@nombre)), '') IS NOT NULL
      AND (
          ISNULL(contact.[name], '') LIKE N'%' + LTRIM(RTRIM(@nombre)) + N'%'
          OR ISNULL(contact.[surname1], '') LIKE N'%' + LTRIM(RTRIM(@nombre)) + N'%'
          OR ISNULL(contact.[surname2], '') LIKE N'%' + LTRIM(RTRIM(@nombre)) + N'%'
          OR LTRIM(RTRIM(CONCAT(ISNULL(contact.[name], ''), ' ', ISNULL(contact.[surname1], ''), ' ', ISNULL(contact.[surname2], '')))) LIKE N'%' + LTRIM(RTRIM(@nombre)) + N'%'
          OR ISNULL(contact.[cnp], '') LIKE N'%' + LTRIM(RTRIM(@nombre)) + N'%'
          OR ISNULL(contact.[nif], '') LIKE N'%' + LTRIM(RTRIM(@nombre)) + N'%'
          OR ISNULL(contact.[passport], '') LIKE N'%' + LTRIM(RTRIM(@nombre)) + N'%'
      )
    ORDER BY CASE WHEN LTRIM(RTRIM(CONCAT(ISNULL(contact.[name], ''), ' ', ISNULL(contact.[surname1], ''), ' ', ISNULL(contact.[surname2], '')))) = LTRIM(RTRIM(@nombre)) THEN 0 ELSE 1 END, contact.[id]
) selectedContact
LEFT JOIN [Contact] con ON con.[id] = clientBalance.[contactId]
LEFT JOIN [LifePolicy] pol ON pol.[id] = a.[lifePolicyId]
OUTER APPLY (
    SELECT SUM(ISNULL(am.[amount], 0)) AS [movementBalance]
    FROM [AccountMov] am
    WHERE am.[accountId] = a.[id]
      AND ISNULL(am.[transactionCode], '') <> 'PREMIUMPAY'
) accountBalance
OUTER APPLY (
    SELECT SUM(ISNULL(cp.[total], 0)) AS [pendingRefundAmount]
    FROM [ClaimPayment] cp
    WHERE cp.[sourceAccountId] = a.[id]
      AND cp.[claimId] IS NULL
      AND (cp.[producer] IS NULL OR (UPPER(ISNULL(cp.[producer], '')) = 'MANUAL' AND ISNULL(cp.[paymentType], '') = '15'))
      AND UPPER(ISNULL(cp.[currency], '')) = UPPER(ISNULL(a.[currency], ''))
      AND UPPER(ISNULL(cp.[entityState], '')) NOT IN ('EXECUTED', 'REJECTED')
) accountRequests
OUTER APPLY (
    SELECT SUM(ISNULL(cp.[total], 0)) AS [pendingRefundAmount]
    FROM [ClaimPayment] cp
    WHERE cp.[sourceAccountId] = a.[id]
      AND ISNULL(cp.[contactId], 0) = ISNULL(clientBalance.[contactId], 0)
      AND cp.[claimId] IS NULL
      AND (cp.[producer] IS NULL OR (UPPER(ISNULL(cp.[producer], '')) = 'MANUAL' AND ISNULL(cp.[paymentType], '') = '15'))
      AND UPPER(ISNULL(cp.[currency], '')) = UPPER(ISNULL(a.[currency], ''))
      AND UPPER(ISNULL(cp.[entityState], '')) NOT IN ('EXECUTED', 'REJECTED')
) requests
OUTER APPLY (
    SELECT
        MAX(CASE WHEN md.[date] >= CONVERT(date, @fechaDesde) THEN 1 ELSE 0 END) AS [hasFromDate],
        MAX(CASE WHEN md.[date] < DATEADD(day, 1, CONVERT(date, @fechaHasta)) THEN 1 ELSE 0 END) AS [hasToDate]
    FROM [AccountMov] md
    LEFT JOIN [Transfer] dateTransfer ON dateTransfer.[id] = md.[transferId]
    OUTER APPLY (
        SELECT TOP (1) TRY_CONVERT(int, JSON_VALUE(j.[value], '$.userData[0]')) AS [contactId]
        FROM OPENJSON(CASE WHEN ISJSON(dateTransfer.[jIncomeTypeForm]) = 1 THEN dateTransfer.[jIncomeTypeForm] ELSE '[]' END) j
        WHERE JSON_VALUE(j.[value], '$.name') = 'hiddenCodigoCliente'
    ) storedDateContact
    WHERE md.[accountId] = a.[id]
      AND ISNULL(md.[transactionCode], '') <> 'PREMIUMPAY'
      AND ISNULL(COALESCE(storedDateContact.[contactId], a.[holderId]), 0) = ISNULL(clientBalance.[contactId], 0)
) clientDates
WHERE a.[type] = 'TRANSIT'
  AND (NULLIF(LTRIM(RTRIM(@nombre)), '') IS NULL OR selectedContact.[id] IS NOT NULL)
  AND (selectedContact.[id] IS NULL OR clientBalance.[contactId] = selectedContact.[id])
  AND ROUND(CASE WHEN ISNULL(accountBalance.[movementBalance], 0) - ISNULL(accountRequests.[pendingRefundAmount], 0) < 0 THEN 0 ELSE ISNULL(accountBalance.[movementBalance], 0) - ISNULL(accountRequests.[pendingRefundAmount], 0) END, 2) <> 0
  AND ROUND(CASE WHEN clientBalance.[movementBalance] - ISNULL(requests.[pendingRefundAmount], 0) < 0 THEN 0 ELSE clientBalance.[movementBalance] - ISNULL(requests.[pendingRefundAmount], 0) END, 2) <> 0
  AND (ISNULL(@cedula, '') = '' OR ISNULL(con.[nationalId], '') LIKE N'%' + LTRIM(RTRIM(@cedula)) + N'%' OR ISNULL(con.[cnp], '') LIKE N'%' + LTRIM(RTRIM(@cedula)) + N'%' OR ISNULL(con.[nif], '') LIKE N'%' + LTRIM(RTRIM(@cedula)) + N'%' OR ISNULL(con.[passport], '') LIKE N'%' + LTRIM(RTRIM(@cedula)) + N'%')
  AND (ISNULL(@poliza, '') = '' OR pol.[code] LIKE N'%' + LTRIM(RTRIM(@poliza)) + N'%')
  AND (@fechaDesde IS NULL OR YEAR(@fechaDesde) < 1901 OR clientDates.[hasFromDate] = 1)
  AND (@fechaHasta IS NULL OR YEAR(@fechaHasta) < 1901 OR clientDates.[hasToDate] = 1)
  AND (ISNULL(@montoDesde, 0) <= 0 OR ROUND(CASE WHEN clientBalance.[movementBalance] - ISNULL(requests.[pendingRefundAmount], 0) < 0 THEN 0 ELSE clientBalance.[movementBalance] - ISNULL(requests.[pendingRefundAmount], 0) END, 2) >= @montoDesde)
  AND (ISNULL(@montoHasta, 0) <= 0 OR ROUND(CASE WHEN clientBalance.[movementBalance] - ISNULL(requests.[pendingRefundAmount], 0) < 0 THEN 0 ELSE clientBalance.[movementBalance] - ISNULL(requests.[pendingRefundAmount], 0) END, 2) <= @montoHasta)
ORDER BY payerName, policyCode, clientBalance.[entryDate]
