import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const filePath = 'C:/Proyectos/Global/outputs/certificacion_pruebas/Matriz_Certificacion_Vistas_Operativas.xlsx';
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(filePath));
const sheet = workbook.worksheets.getItem('Cajero');

const existing = sheet.getUsedRange();
const rows = existing.values;
const replacements = new Map([
  ['New', 'Nuevo'],
  ['Filter', 'Filtrar'],
  ['Reports', 'Reportes'],
  ['Accounting movements', 'Movimientos contables'],
  ['Bank deposits', 'Depósitos bancarios'],
]);
const translate = value => {
  if (typeof value !== 'string') return value;
  return replacements.get(value) ?? value;
};
existing.values = rows.map(row => row.map(translate));

const additions = [
  ['CA-016', 'Reversión de pagos', 'Cajero', 'Revertir un pago registrado', 'Caja abierta y pago existente que pueda revertirse.', 'ID de transferencia o pago válido; motivo de reversión.', '1. Abrir la pestaña Primas. 2. Seleccionar el pago. 3. Pulsar Revertir pago. 4. Confirmar y registrar el motivo.', 'El sistema valida el pago, ejecuta la reversión, actualiza el estado y muestra el movimiento compensatorio sin duplicar el pago original.', null, 'No ejecutado', null, null, null],
  ['CA-017', 'Edición de pagos sin ejecutar', 'Cajero', 'Editar un pago que todavía no ha sido ejecutado', 'Existe un pago en estado pendiente o sin ejecutar y el usuario tiene permisos.', 'Pago pendiente; nuevo monto o referencia válida.', '1. Abrir Primas. 2. Seleccionar un pago sin ejecutar. 3. Pulsar Editar. 4. Modificar los datos permitidos. 5. Guardar.', 'El sistema permite editar solo el pago no ejecutado, conserva la trazabilidad y no permite modificar pagos ya ejecutados.', null, 'No ejecutado', null, null, null],
  ['CA-018', 'Filtro de movimientos', 'Cajero', 'Filtrar movimientos de la caja', 'Caja seleccionada con movimientos de distintos tipos y fechas.', 'ID de transferencia, fecha, estado, tipo de ingreso o rango de monto.', '1. Abrir Movimientos. 2. Completar uno o varios filtros. 3. Pulsar Filtrar. 4. Limpiar los filtros.', 'La grilla muestra solo los movimientos coincidentes; al limpiar se recupera la consulta general sin cerrar el panel de filtros.', null, 'No ejecutado', null, null, null],
  ['CA-019', 'Reversión de primas', 'Cajero', 'Revertir una prima cobrada', 'Existe una prima cobrada y asociada a una póliza o cuota.', 'Póliza, recibo o transferencia válida; motivo de reversión.', '1. Abrir Primas. 2. Seleccionar el pago de prima. 3. Pulsar Reversar. 4. Confirmar la operación.', 'La prima queda revertida, se actualizan los saldos de la póliza y la caja, y se muestra la referencia de la reversión.', null, 'No ejecutado', null, null, null],
  ['CA-020', 'Reportes de caja', 'Cajero', 'Generar reportes desde la pestaña Cajas', 'Existe una caja seleccionada y el usuario tiene acceso a reportes.', 'Caja con movimientos y rango de fechas válido.', '1. Abrir el menú Reportes. 2. Seleccionar un reporte. 3. Completar parámetros. 4. Generar y abrir el archivo.', 'El reporte se genera con los parámetros seleccionados, descarga correctamente y presenta los datos de la caja sin errores.', null, 'No ejecutado', null, null, null],
  ['CA-021', 'Filtrado de montos en tránsito', 'Cajero', 'Filtrar los montos disponibles en tránsito', 'Existe una caja con cuentas en tránsito y movimientos asociados.', 'ID de transferencia, cuenta, moneda, rango de fechas o monto.', '1. Abrir Montos en tránsito. 2. Completar los filtros. 3. Pulsar Filtrar. 4. Verificar los resultados.', 'La grilla muestra solo los montos que cumplen los filtros y mantiene la paginación de 25 registros.', null, 'No ejecutado', null, null, null],
  ['CA-022', 'Devolución de monto en tránsito', 'Cajero', 'Devolver un monto a su origen', 'Existe un monto en tránsito disponible y no pagado.', 'Registro de tránsito válido; cuenta origen; motivo.', '1. Seleccionar un monto. 2. Pulsar Devolver monto. 3. Confirmar los datos. 4. Ejecutar.', 'El monto se devuelve a la cuenta de origen, cambia de estado y queda registrada la operación con su referencia.', null, 'No ejecutado', null, null, null],
  ['CA-023', 'Pago de prima desde tránsito', 'Cajero', 'Pagar una prima usando una cuenta en tránsito', 'Existe saldo disponible en tránsito y una póliza con cuota pendiente.', 'Póliza, cuota, monto a pagar y cuenta en tránsito válidos.', '1. Seleccionar la cuenta en tránsito. 2. Pulsar Pagar prima. 3. Seleccionar póliza y cuota. 4. Confirmar el monto. 5. Ejecutar.', 'El sistema aplica el pago a la cuota, descuenta el monto de tránsito y actualiza los saldos de la póliza y de la caja.', null, 'No ejecutado', null, null, null],
  ['CA-024', 'Transferencia entre cuentas en tránsito', 'Cajero', 'Transferir un monto entre cuentas', 'Existen cuenta origen con saldo y cuenta destino válida.', 'Cuenta origen, cuenta destino, moneda y monto menor o igual al saldo disponible.', '1. Seleccionar el registro. 2. Pulsar Transferir monto. 3. Elegir la cuenta destino. 4. Indicar el monto. 5. Confirmar.', 'El monto se descuenta de la cuenta origen, se acredita en la cuenta destino y se registra la transferencia sin alterar el total global.', null, 'No ejecutado', null, null, null],
  ['CA-025', 'Balances de caja', 'Cajero', 'Consultar los balances de una caja', 'Caja seleccionada con movimientos registrados.', 'Caja abierta o cerrada con movimientos en distintas monedas y métodos.', '1. Abrir Balances. 2. Revisar el resumen. 3. Comparar los importes con los movimientos de la caja.', 'El sistema muestra los balances de la caja con montos consistentes y diferencia identificable cuando corresponda.', null, 'No ejecutado', null, null, null],
  ['CA-026', 'Generación de depósito a banco', 'Cajero', 'Generar un depósito bancario desde el balance', 'Caja seleccionada con saldo depositable y banco configurado.', 'Moneda, método de pago, banco, monto y fecha de depósito.', '1. Abrir Balances o Depósitos bancarios. 2. Seleccionar Generar depósito. 3. Completar los datos. 4. Confirmar.', 'El depósito se genera con número de referencia, cambia el saldo disponible y queda asociado a la caja y al banco.', null, 'No ejecutado', null, null, null],
  ['CA-027', 'Balance global', 'Cajero', 'Consultar el balance global de la caja', 'Caja con movimientos en más de un método de pago.', 'Caja seleccionada con efectivo, cheque, tarjeta o transferencia.', '1. Abrir Balances. 2. Seleccionar la vista global. 3. Revisar el total y su desglose.', 'El balance global presenta la suma total de los métodos de pago y coincide con el detalle de movimientos.', null, 'No ejecutado', null, null, null],
  ['CA-028', 'Balance por método de pago', 'Cajero', 'Consultar el balance separado por método de pago', 'Caja con pagos registrados mediante distintos métodos.', 'Método de pago: efectivo, cheque, tarjeta o ACH.', '1. Abrir Balances. 2. Seleccionar un método de pago. 3. Comparar el subtotal con sus movimientos.', 'El sistema muestra el subtotal del método seleccionado, sin mezclarlo con otros métodos, y permite regresar al balance global.', null, 'No ejecutado', null, null, null],
];

const startRow = existing.rowIndex + existing.rowCount;
const target = sheet.getRangeByIndexes(startRow, 0, additions.length, 13);
const template = sheet.getRangeByIndexes(startRow - 1, 0, 1, 13);
target.copyFrom(template, 'all');
target.values = additions;

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(filePath);
console.log(JSON.stringify({ sheet: sheet.name, added: additions.length, range: target.address }));
