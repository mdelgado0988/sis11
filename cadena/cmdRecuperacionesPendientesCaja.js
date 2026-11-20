  //block
  //noreplace
  /**
   * Name: cmdRecuperacionesPendientesCaja
   * Purpose: Recuperaciones de siniestro pendientes de cobrar en caja para un tipo de ingreso: las del tipo de
   *   recuperación que la tabla cfgTipoIngresoCajaRecuperacion relaciona con ese tipo de ingreso y que no tienen un pago
   *   aplicado por un ingreso de caja ejecutado y no reversado. La usan el formulario frmAplicacionRecuperacionCaja y la
   *   cadena cmdAplicarRecuperacionCaja.
   * Author: AIDEN (MSN-000219, AXX-10616)
   */
  /*
   * Entrada (context): incomeType, código del tipo de ingreso de caja. Opcional: salvageId, para preguntar por una sola
   *   recuperación.
   * Salida: { ok, incomeType, tipoRecuperacion, nombreTipoRecuperacion, data }. Cada fila de data: id, claimId,
   *   claimCode, policyCode, occurrence, type, typeName, coverageId, coverageName, buyerId, buyerName, start, currency,
   *   income, expenses, netIncome. Un tipo de ingreso sin fila en la tabla devuelve tipoRecuperacion null y data vacía:
   *   la caja sigue como hoy.
   * Pendiente: neto mayor que cero, no anulada ni reversada (entityState) y sin movimiento de ingreso (IncomeExpense) en
   *   estado 1 cuyo ingreso de caja (Transfer) esté ejecutado (status 1) y sin fecha de reversa.
   * SQL justification: una sola lectura con joins a siniestro, póliza, tipo, cobertura y comprador y un NOT EXISTS sobre
   *   los movimientos de la recuperación y sus ingresos de caja, que los Repo GET no expresan. Sólo SELECT; los únicos
   *   valores que entran al texto son enteros validados.
   */
  const TABLA = 'cfgTipoIngresoCajaRecuperacion';
  
  const entrada = context || {};
  const tipoIngreso = texto(entrada.incomeType);
  const relacion = buscarRelacion(tipoIngreso);
  if (!relacion) {
    return { ok: true, incomeType: tipoIngreso, tipoRecuperacion: null, nombreTipoRecuperacion: '', data: [] };
  }
  
  const salvageId = entero(entrada.salvageId);
  const sql = [
    'SELECT s.id, s.claimId, c.code AS claimCode, p.code AS policyCode, c.occurrence, s.type, st.name AS typeName,',
    ' s.coverageId, cov.name AS coverageName, s.buyerId,',
    " LTRIM(RTRIM(CONCAT_WS(' ', b.name, b.middleName, b.surname1, b.surname2))) AS buyerName,",
    ' s.start, s.currency, s.income, s.expenses, s.netIncome',
    ' FROM Salvage s',
    ' JOIN Claim c ON c.id = s.claimId',
    ' LEFT JOIN LifePolicy p ON p.id = c.lifePolicyId',
    ' LEFT JOIN SalvageType st ON st.id = s.type',
    ' LEFT JOIN LifeCoverage cov ON cov.id = s.coverageId',
    ' LEFT JOIN Contact b ON b.id = s.buyerId',
    ' WHERE s.type = ' + relacion.tipo,
    ' AND s.netIncome > 0',
    " AND ISNULL(s.entityState, '') NOT IN ('CANCELLED', 'REVERTED')",
    salvageId > 0 ? ' AND s.id = ' + salvageId : '',
    ' AND NOT EXISTS (SELECT 1 FROM IncomeExpense ie JOIN Transfer t ON t.id = ie.transferId',
    ' WHERE ie.salvageId = s.id AND ie.status = 1 AND t.status = 1 AND t.reversalDate IS NULL)',
    ' ORDER BY c.code, s.id'
  ].join('');
  
  const respuesta = doCmd({ cmd: 'DoQuery', data: { sql: sql } });
  if (!respuesta || respuesta.ok === false) {
    throw new Error('@No se pudieron leer las recuperaciones pendientes: ' + mensaje(respuesta));
  }
  
  return {
    ok: true,
    incomeType: tipoIngreso,
    tipoRecuperacion: relacion.tipo,
    nombreTipoRecuperacion: relacion.nombre,
    data: lista(respuesta.outData)
  };
  
  // La fila de la tabla para el tipo de ingreso, o null si no tiene: { tipo, nombre }.
  function buscarRelacion(codigo) {
    if (!codigo) return null;
    const tabla = doCmd({ cmd: 'GetFullTable', data: { table: TABLA } });
    if (!tabla || tabla.ok === false) {
      throw new Error('@No se pudo leer la tabla ' + TABLA + ': ' + mensaje(tabla));
    }
    const filas = lista(tabla.outData);
    const encabezado = lista(filas[0]).map(texto);
    const colIngreso = encabezado.indexOf('tipoIngreso');
    const colTipo = encabezado.indexOf('tipoRecuperacion');
    const colNombre = encabezado.indexOf('nombreTipoRecuperacion');
    if (colIngreso < 0 || colTipo < 0) {
      throw new Error('@La tabla ' + TABLA + ' no tiene las columnas tipoIngreso y tipoRecuperacion.');
    }
    for (let i = 1; i < filas.length; i++) {
      const fila = lista(filas[i]);
      if (texto(fila[colIngreso]) !== codigo) continue;
      const tipo = entero(fila[colTipo]);
      if (tipo < 0) {
        throw new Error('@La tabla ' + TABLA + ' relaciona el tipo de ingreso ' + codigo + ' con un tipo de recuperación inválido.');
      }
      return { tipo: tipo, nombre: colNombre >= 0 ? texto(fila[colNombre]) : '' };
    }
    return null;
  }
  
  function texto(valor) {
    return valor === undefined || valor === null ? '' : String(valor).trim();
  }
  
  // outData llega como lista del motor (Array.isArray da false): se copia a un arreglo de JavaScript.
  function lista(valor) {
    if (valor === undefined || valor === null) return [];
    const copia = JSON.parse(JSON.stringify(valor));
    return Array.isArray(copia) ? copia : [];
  }
  
  // Entero no negativo escrito sólo con dígitos; -1 en cualquier otro caso.
  function entero(valor) {
    const t = texto(valor);
    return /^\d+$/.test(t) ? Number(t) : -1;
  }
  
  function mensaje(respuesta) {
    return respuesta && respuesta.msg ? String(respuesta.msg) : 'sin respuesta';
  }
