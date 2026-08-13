//block
//noreplace

/**
 * @name cmdGeneraLoteCotizacionAniversario
 * @author Michael Delgado
 * @email michael.delgado@axxis-systems.com
 * @created 2026/01/09
 * @version 1.1
 * @purpose Creates a quotation batch from selected anniversary policies.
 */

try {
  const input = validateInput(context);
  const selectedPolicyIds = parseSelectedPolicyIds(input.anniversaries);
  const userEmail = getCurrentUserEmail();

  if (!userEmail) {
    throw new Error('No fue posible recuperar el usuario que ejecutó la cotización');
  }

  if (selectedPolicyIds.length === 0) {
    return buildResult(false, 'Debe seleccionar al menos una póliza para cotizar', 0);
  }

  const pendingBatches = getPendingQuotationBatchCount(input.loteId);
  if (!pendingBatches.ok) {
    throw new Error(pendingBatches.msg);
  }

  if (pendingBatches.count > 0) {
    return buildResult(
      false,
      `Existen ${pendingBatches.count} lotes pendientes de cotización para este lote de renovación, procese primero estos lotes antes de poder crear otro`,
      0
    );
  }

  const pendingIssuanceBatches = getPendingIssuanceBatchCount(input.loteId);
  if (!pendingIssuanceBatches.ok) {
    throw new Error(pendingIssuanceBatches.msg);
  }

  if (pendingIssuanceBatches.count > 0) {
    return buildResult(
      false,
      `Existen ${pendingIssuanceBatches.count} lotes pendientes de emisión para este lote de renovación, espere a que finalice el proceso antes de cotizar nuevamente`,
      0
    );
  }

  const sourceBatch = getSourceBatch(input.loteId);
  if (!sourceBatch.ok) {
    throw new Error(sourceBatch.msg);
  }

  const policies = buildQuotationRows(sourceBatch.rows, selectedPolicyIds, input.loteId, userEmail);
  if (policies.length === 0) {
    return buildResult(false, 'No se encontraron pólizas válidas en el lote seleccionado', 0);
  }

  const config = getQuotationImportConfig();
  if (!config.ok) {
    throw new Error(config.msg);
  }

  markPoliciesAsRenewal(input.loteId, selectedPolicyIds);

  const quotationBatch = createQuotationBatch(
    input.loteId,
    config.id,
    policies
  );

  if (!quotationBatch.ok) {
    return buildResult(false, quotationBatch.msg, 0);
  }

  return buildResult(
    true,
    'Lote de cotización generado, espere que termine el proceso para verificar las primas y refresque para validar los cálculos',
    quotationBatch.id
  );
} catch (error) {
  return buildResult(false, getErrorMessage(error), 0);
}

function validateInput(value) {
  const source = value || {};
  const loteId = toPositiveInteger(source.loteId);

  if (loteId <= 0) {
    throw new Error('El identificador del lote de renovación es requerido y debe ser válido');
  }

  if (source.anniversaries === null || source.anniversaries === undefined) {
    throw new Error('Debe seleccionar al menos una póliza para cotizar');
  }

  return {
    loteId: loteId,
    anniversaries: source.anniversaries
  };
}

function parseSelectedPolicyIds(value) {
  let parsed = value;

  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch (error) {
      throw new Error('La selección de pólizas no tiene un formato válido');
    }
  }

  if (!Array.isArray(parsed)) {
    throw new Error('La selección de pólizas debe ser un arreglo válido');
  }

  return parsed
    .map(value => toPositiveInteger(value))
    .filter(value => value > 0)
    .filter((value, index, values) => values.indexOf(value) === index);
}

function getPendingQuotationBatchCount(loteId) {
  const sql = `
    SELECT COUNT(1) AS cantidad
    FROM [Batch] AS b
    JOIN [ImportConfig] AS ic ON b.importConfigId = ic.id
    WHERE ic.[category] = 'ANNIVERSARYLOTEVIEWQUOTE'
      AND ISNULL(b.[status], 'PENDING') = 'PENDING'
      AND PARSENAME(
        REPLACE(
          LEFT(b.name, NULLIF(
            CHARINDEX('-', b.name, CHARINDEX('-', b.name, CHARINDEX('-', b.name) + 1) + 1) - 1,
            -1
          )),
          '-',
          '.'
        ),
        1
      ) = '${loteId}';`;

  const response = executeDoQuery(sql);
  if (!response.ok) {
    return { ok: false, msg: response.msg, count: 0 };
  }

  const row = getFirstRow(response.outData);
  return {
    ok: true,
    msg: '',
    count: toNonNegativeInteger(row && row.cantidad)
  };
}

function getPendingIssuanceBatchCount(loteId) {
  const sql = `
    SELECT COUNT(1) AS cantidad
    FROM [Batch] AS b
    JOIN [ImportConfig] AS ic ON b.importConfigId = ic.id
    WHERE (ic.[name] = 'RenewalPolicyIssuance' OR ic.[category] = 'RenewalPolicyIssuance')
      AND ISNULL(b.[status], 'PENDING') = 'PENDING'
      AND b.[name] LIKE N'RENEWALISSUANCE-%-${loteId}';`;

  const response = executeDoQuery(sql);
  if (!response.ok) {
    return { ok: false, msg: response.msg, count: 0 };
  }

  const row = getFirstRow(response.outData);
  return {
    ok: true,
    msg: '',
    count: toNonNegativeInteger(row && row.cantidad)
  };
}

function getSourceBatch(loteId) {
  const sql = `
    SELECT jData
    FROM [Batch]
    WHERE id = ${loteId};`;

  const response = executeDoQuery(sql);
  if (!response.ok) {
    return { ok: false, msg: response.msg, rows: [] };
  }

  const row = getFirstRow(response.outData);
  if (!row || !row.jData) {
    return { ok: false, msg: 'No se encontró información del lote de renovación', rows: [] };
  }

  let rows;
  try {
    rows = JSON.parse(row.jData);
  } catch (error) {
    return { ok: false, msg: 'El lote de renovación contiene un jData inválido', rows: [] };
  }

  if (!Array.isArray(rows)) {
    return { ok: false, msg: 'El jData del lote de renovación debe ser un arreglo', rows: [] };
  }

  return { ok: true, msg: '', rows: rows };
}

function buildQuotationRows(rows, selectedPolicyIds, loteId, userEmail) {
  const selected = selectedPolicyIds.map(value => String(value));

  return rows
    .filter(row => Array.isArray(row) && selected.indexOf(String(row[4])) >= 0)
    .map(row => [
      row[4],
      row[1],
      row[4],
      loteId,
      userEmail
    ]);
}

function getCurrentUserEmail() {
  doCmd({ cmd: 'GetCurrentUser', data: {} });

  if (typeof GetCurrentUser === 'undefined' || !GetCurrentUser || GetCurrentUser.ok === false) {
    return '';
  }

  const source = GetCurrentUser.outData;
  const user = Array.isArray(source) ? source[0] : source;
  return String(user && (user.email || user.Email || user.userEmail) || '').trim();
}

function getQuotationImportConfig() {
  const response = executeDoQuery(
    "SELECT TOP (1) id FROM importConfig WHERE name = 'Cotiza Aniversario Poliza';"
  );

  if (!response.ok) {
    return { ok: false, msg: response.msg, id: 0 };
  }

  const row = getFirstRow(response.outData);
  const id = toPositiveInteger(row && (row.id || row.Id));
  if (id <= 0) {
    return { ok: false, msg: 'No existe lote de cotización para aniversario masivo', id: 0 };
  }

  return { ok: true, msg: '', id: id };
}

function markPoliciesAsRenewal(loteId, selectedPolicyIds) {
  if (!Array.isArray(selectedPolicyIds) || selectedPolicyIds.length === 0) {
    throw new Error('No existen pólizas válidas para actualizar el lote');
  }

  const policyIds = selectedPolicyIds.join(',');
  const sql = `
    UPDATE b
    SET jData = (
      SELECT JSON_QUERY(
        '[' + STRING_AGG(
          CASE
            WHEN JSON_VALUE(j.[value], '$[4]') IN (${policyIds})
              THEN JSON_MODIFY(j.[value], '$[3]', 'Si')
            ELSE j.[value]
          END,
          ','
        ) + ']'
      )
      FROM OPENJSON(b.jData) j
    )
    FROM Batch b
    WHERE b.id = ${loteId};`;

  const response = executeDoQuery(sql);
  if (!response.ok) {
    throw new Error(response.msg);
  }
}

function createQuotationBatch(loteId, configId, policies) {
  const entity = {
    importConfigId: configId,
    jData: JSON.stringify(policies),
    name: `QUOTELOTE-${formatDate(new Date())}-${loteId}`,
    processingType: 0,
    records: policies.length
  };

  doCmd({
    cmd: 'RepoBatch',
    data: {
      entity: entity,
      operation: 'ADD'
    }
  });

  const response = typeof RepoBatch === 'undefined' ? null : RepoBatch;
  if (!response || response.ok === false) {
    return {
      ok: false,
      msg: response && response.msg ? response.msg : 'No fue posible crear el lote de cotización',
      id: 0
    };
  }

  const row = getFirstRow(response.outData);
  const id = toPositiveInteger(row && row.id);
  if (id <= 0) {
    return { ok: false, msg: 'El lote de cotización no devolvió un identificador válido', id: 0 };
  }

  return { ok: true, msg: '', id: id };
}

function executeDoQuery(sql) {
  doCmd({
    cmd: 'DoQuery',
    data: { sql: sql }
  });

  const response = typeof DoQuery === 'undefined' ? null : DoQuery;
  if (!response || response.ok === false) {
    return {
      ok: false,
      msg: response && response.msg ? response.msg : 'No fue posible ejecutar la consulta',
      outData: []
    };
  }

  return {
    ok: true,
    msg: '',
    outData: Array.isArray(response.outData) ? response.outData : []
  };
}

function getFirstRow(value) {
  return Array.isArray(value) && value.length > 0 ? value[0] : null;
}

function toPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function toNonNegativeInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : 0;
}

function formatDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
}

function buildResult(ok, msg, idLoteQuote) {
  return {
    ok: ok,
    msg: msg,
    idLoteQuote: idLoteQuote
  };
}

function getErrorMessage(error) {
  if (error && error.message) {
    return error.message;
  }

  return String(error || 'Error desconocido');
}
