USE SIS11
GO

declare @transferId INT = 7125

SELECT
    t.id AS TransferId,
    allocationTotal.totalAmount AS amount,
    CASE WHEN allocationTotal.totalAmount < 0 THEN 'MENOS ' ELSE '' END
  + CASE WHEN v.n = 0 THEN 'CERO'
         ELSE CASE WHEN g.a = 0 THEN ''
                   WHEN g.a = 1 THEN 'UN MILLON'
                   ELSE wa.w + ' MILLONES' END
            + CASE WHEN g.a > 0 AND g.b > 0 THEN ' ' ELSE '' END
            + CASE WHEN g.b = 0 THEN '' ELSE wb.w END
    END
  + ' CON ' + RIGHT('00' + CAST(CAST(ROUND((z.av - CAST(z.av AS BIGINT)) * 100, 0) AS INT) AS VARCHAR), 2) + '/100' AS amount_in_words
FROM Transfer AS t
OUTER APPLY (
    SELECT CASE
        WHEN EXISTS (
            SELECT 1
            FROM AllocationInstallment ai
            WHERE ai.allocationId = t.allocationId
        ) OR EXISTS (
            SELECT 1
            FROM AllocationSupplementary supplementary
            WHERE supplementary.allocationId = t.allocationId
        ) THEN
            COALESCE((
                SELECT SUM(COALESCE(ai.moneyInAmount, 0) + COALESCE(ai.transitAmount, 0))
                FROM AllocationInstallment ai
                WHERE ai.allocationId = t.allocationId
            ), 0)
            + COALESCE((
                SELECT SUM(supplementary.moneyInAmount)
                FROM AllocationSupplementary supplementary
                WHERE supplementary.allocationId = t.allocationId
            ), 0)
        ELSE t.amount
    END AS totalAmount
) AS allocationTotal
OUTER APPLY (SELECT ABS(allocationTotal.totalAmount) AS av) AS z
OUTER APPLY (SELECT CAST(z.av AS BIGINT) AS n) AS v
OUTER APPLY (SELECT v.n / 1000000 AS a, v.n % 1000000 AS b) AS g
OUTER APPLY (SELECT g.a / 1000 AS a1, g.a % 1000 AS a2, g.b / 1000 AS b1, g.b % 1000 AS b2) AS h
OUTER APPLY (SELECT
      CASE WHEN h.a1 / 100 = 0 THEN ''
           WHEN h.a1 / 100 = 1 AND h.a1 % 100 = 0 THEN 'CIEN'
           ELSE (SELECT txt FROM (VALUES (1,'CIENTO'),(2,'DOSCIENTOS'),(3,'TRESCIENTOS'),(4,'CUATROCIENTOS'),(5,'QUINIENTOS'),(6,'SEISCIENTOS'),(7,'SETECIENTOS'),(8,'OCHOCIENTOS'),(9,'NOVECIENTOS')) AS C(n,txt) WHERE n = h.a1 / 100) END
    + CASE WHEN h.a1 / 100 > 0 AND h.a1 % 100 > 0 THEN ' ' ELSE '' END
    + CASE WHEN h.a1 % 100 = 0 THEN ''
           WHEN h.a1 % 100 BETWEEN 1 AND 29 THEN (SELECT txt FROM (VALUES (1,'UN'),(2,'DOS'),(3,'TRES'),(4,'CUATRO'),(5,'CINCO'),(6,'SEIS'),(7,'SIETE'),(8,'OCHO'),(9,'NUEVE'),(10,'DIEZ'),(11,'ONCE'),(12,'DOCE'),(13,'TRECE'),(14,'CATORCE'),(15,'QUINCE'),(16,'DIECISEIS'),(17,'DIECISIETE'),(18,'DIECIOCHO'),(19,'DIECINUEVE'),(20,'VEINTE'),(21,'VEINTIUN'),(22,'VEINTIDOS'),(23,'VEINTITRES'),(24,'VEINTICUATRO'),(25,'VEINTICINCO'),(26,'VEINTISEIS'),(27,'VEINTISIETE'),(28,'VEINTIOCHO'),(29,'VEINTINUEVE')) AS U(n,txt) WHERE n = h.a1 % 100)
           ELSE (SELECT txt FROM (VALUES (3,'TREINTA'),(4,'CUARENTA'),(5,'CINCUENTA'),(6,'SESENTA'),(7,'SETENTA'),(8,'OCHENTA'),(9,'NOVENTA')) AS D(n,txt) WHERE n = (h.a1 % 100) / 10)
              + CASE WHEN h.a1 % 10 > 0 THEN ' Y ' + (SELECT txt FROM (VALUES (1,'UN'),(2,'DOS'),(3,'TRES'),(4,'CUATRO'),(5,'CINCO'),(6,'SEIS'),(7,'SIETE'),(8,'OCHO'),(9,'NUEVE')) AS N(n,txt) WHERE n = h.a1 % 10) ELSE '' END END AS w) AS wa1
OUTER APPLY (SELECT
      CASE WHEN h.a2 / 100 = 0 THEN ''
           WHEN h.a2 / 100 = 1 AND h.a2 % 100 = 0 THEN 'CIEN'
           ELSE (SELECT txt FROM (VALUES (1,'CIENTO'),(2,'DOSCIENTOS'),(3,'TRESCIENTOS'),(4,'CUATROCIENTOS'),(5,'QUINIENTOS'),(6,'SEISCIENTOS'),(7,'SETECIENTOS'),(8,'OCHOCIENTOS'),(9,'NOVECIENTOS')) AS C(n,txt) WHERE n = h.a2 / 100) END
    + CASE WHEN h.a2 / 100 > 0 AND h.a2 % 100 > 0 THEN ' ' ELSE '' END
    + CASE WHEN h.a2 % 100 = 0 THEN ''
           WHEN h.a2 % 100 BETWEEN 1 AND 29 THEN (SELECT txt FROM (VALUES (1,'UN'),(2,'DOS'),(3,'TRES'),(4,'CUATRO'),(5,'CINCO'),(6,'SEIS'),(7,'SIETE'),(8,'OCHO'),(9,'NUEVE'),(10,'DIEZ'),(11,'ONCE'),(12,'DOCE'),(13,'TRECE'),(14,'CATORCE'),(15,'QUINCE'),(16,'DIECISEIS'),(17,'DIECISIETE'),(18,'DIECIOCHO'),(19,'DIECINUEVE'),(20,'VEINTE'),(21,'VEINTIUN'),(22,'VEINTIDOS'),(23,'VEINTITRES'),(24,'VEINTICUATRO'),(25,'VEINTICINCO'),(26,'VEINTISEIS'),(27,'VEINTISIETE'),(28,'VEINTIOCHO'),(29,'VEINTINUEVE')) AS U(n,txt) WHERE n = h.a2 % 100)
           ELSE (SELECT txt FROM (VALUES (3,'TREINTA'),(4,'CUARENTA'),(5,'CINCUENTA'),(6,'SESENTA'),(7,'SETENTA'),(8,'OCHENTA'),(9,'NOVENTA')) AS D(n,txt) WHERE n = (h.a2 % 100) / 10)
              + CASE WHEN h.a2 % 10 > 0 THEN ' Y ' + (SELECT txt FROM (VALUES (1,'UN'),(2,'DOS'),(3,'TRES'),(4,'CUATRO'),(5,'CINCO'),(6,'SEIS'),(7,'SIETE'),(8,'OCHO'),(9,'NUEVE')) AS N(n,txt) WHERE n = h.a2 % 10) ELSE '' END END AS w) AS wa2
OUTER APPLY (SELECT
      CASE WHEN h.b1 / 100 = 0 THEN ''
           WHEN h.b1 / 100 = 1 AND h.b1 % 100 = 0 THEN 'CIEN'
           ELSE (SELECT txt FROM (VALUES (1,'CIENTO'),(2,'DOSCIENTOS'),(3,'TRESCIENTOS'),(4,'CUATROCIENTOS'),(5,'QUINIENTOS'),(6,'SEISCIENTOS'),(7,'SETECIENTOS'),(8,'OCHOCIENTOS'),(9,'NOVECIENTOS')) AS C(n,txt) WHERE n = h.b1 / 100) END
    + CASE WHEN h.b1 / 100 > 0 AND h.b1 % 100 > 0 THEN ' ' ELSE '' END
    + CASE WHEN h.b1 % 100 = 0 THEN ''
           WHEN h.b1 % 100 BETWEEN 1 AND 29 THEN (SELECT txt FROM (VALUES (1,'UN'),(2,'DOS'),(3,'TRES'),(4,'CUATRO'),(5,'CINCO'),(6,'SEIS'),(7,'SIETE'),(8,'OCHO'),(9,'NUEVE'),(10,'DIEZ'),(11,'ONCE'),(12,'DOCE'),(13,'TRECE'),(14,'CATORCE'),(15,'QUINCE'),(16,'DIECISEIS'),(17,'DIECISIETE'),(18,'DIECIOCHO'),(19,'DIECINUEVE'),(20,'VEINTE'),(21,'VEINTIUN'),(22,'VEINTIDOS'),(23,'VEINTITRES'),(24,'VEINTICUATRO'),(25,'VEINTICINCO'),(26,'VEINTISEIS'),(27,'VEINTISIETE'),(28,'VEINTIOCHO'),(29,'VEINTINUEVE')) AS U(n,txt) WHERE n = h.b1 % 100)
           ELSE (SELECT txt FROM (VALUES (3,'TREINTA'),(4,'CUARENTA'),(5,'CINCUENTA'),(6,'SESENTA'),(7,'SETENTA'),(8,'OCHENTA'),(9,'NOVENTA')) AS D(n,txt) WHERE n = (h.b1 % 100) / 10)
              + CASE WHEN h.b1 % 10 > 0 THEN ' Y ' + (SELECT txt FROM (VALUES (1,'UN'),(2,'DOS'),(3,'TRES'),(4,'CUATRO'),(5,'CINCO'),(6,'SEIS'),(7,'SIETE'),(8,'OCHO'),(9,'NUEVE')) AS N(n,txt) WHERE n = h.b1 % 10) ELSE '' END END AS w) AS wb1
OUTER APPLY (SELECT
      CASE WHEN h.b2 / 100 = 0 THEN ''
           WHEN h.b2 / 100 = 1 AND h.b2 % 100 = 0 THEN 'CIEN'
           ELSE (SELECT txt FROM (VALUES (1,'CIENTO'),(2,'DOSCIENTOS'),(3,'TRESCIENTOS'),(4,'CUATROCIENTOS'),(5,'QUINIENTOS'),(6,'SEISCIENTOS'),(7,'SETECIENTOS'),(8,'OCHOCIENTOS'),(9,'NOVECIENTOS')) AS C(n,txt) WHERE n = h.b2 / 100) END
    + CASE WHEN h.b2 / 100 > 0 AND h.b2 % 100 > 0 THEN ' ' ELSE '' END
    + CASE WHEN h.b2 % 100 = 0 THEN ''
           WHEN h.b2 % 100 BETWEEN 1 AND 29 THEN (SELECT txt FROM (VALUES (1,'UN'),(2,'DOS'),(3,'TRES'),(4,'CUATRO'),(5,'CINCO'),(6,'SEIS'),(7,'SIETE'),(8,'OCHO'),(9,'NUEVE'),(10,'DIEZ'),(11,'ONCE'),(12,'DOCE'),(13,'TRECE'),(14,'CATORCE'),(15,'QUINCE'),(16,'DIECISEIS'),(17,'DIECISIETE'),(18,'DIECIOCHO'),(19,'DIECINUEVE'),(20,'VEINTE'),(21,'VEINTIUN'),(22,'VEINTIDOS'),(23,'VEINTITRES'),(24,'VEINTICUATRO'),(25,'VEINTICINCO'),(26,'VEINTISEIS'),(27,'VEINTISIETE'),(28,'VEINTIOCHO'),(29,'VEINTINUEVE')) AS U(n,txt) WHERE n = h.b2 % 100)
           ELSE (SELECT txt FROM (VALUES (3,'TREINTA'),(4,'CUARENTA'),(5,'CINCUENTA'),(6,'SESENTA'),(7,'SETENTA'),(8,'OCHENTA'),(9,'NOVENTA')) AS D(n,txt) WHERE n = (h.b2 % 100) / 10)
              + CASE WHEN h.b2 % 10 > 0 THEN ' Y ' + (SELECT txt FROM (VALUES (1,'UN'),(2,'DOS'),(3,'TRES'),(4,'CUATRO'),(5,'CINCO'),(6,'SEIS'),(7,'SIETE'),(8,'OCHO'),(9,'NUEVE')) AS N(n,txt) WHERE n = h.b2 % 10) ELSE '' END END AS w) AS wb2
OUTER APPLY (SELECT CASE WHEN h.a1 = 0 THEN '' WHEN h.a1 = 1 THEN 'MIL' ELSE wa1.w + ' MIL' END
                  + CASE WHEN h.a1 > 0 AND h.a2 > 0 THEN ' ' ELSE '' END
                  + CASE WHEN h.a2 = 0 THEN '' ELSE wa2.w END AS w) AS wa
OUTER APPLY (SELECT CASE WHEN h.b1 = 0 THEN '' WHEN h.b1 = 1 THEN 'MIL' ELSE wb1.w + ' MIL' END
                  + CASE WHEN h.b1 > 0 AND h.b2 > 0 THEN ' ' ELSE '' END
                  + CASE WHEN h.b2 = 0 THEN '' ELSE wb2.w END AS w) AS wb
WHERE t.id = @transferId;
