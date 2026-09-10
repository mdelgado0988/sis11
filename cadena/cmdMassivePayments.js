//block
//noreplace
/**
 * @author Mike Ortiz
 * @created 2026-01-01
 * @name cmdMassivePayments
 * @version 1.0
 * @summary This command makes a premium payment according to the policy indicated..
 */
const { row } = context;
const errors = [];
const batchId = validateBatchId(context && context.batchId);

hydrateBatchPayer(row, batchId);
ValidateDto(row,errors);

doCmd({
    cmd:'LoadEntity',
    data:{
        entity: 'TransferWorkspace',
        fields: '[id],[user]',
        filter: `[id]=${row.workspaceId} AND [closed]=0`
    }
});

const cashier = LoadEntity.outData;
if(IsNull(cashier))
    throw '@No existe caja con el id: ' + cashier.id;


const policyReference = findPolicyByFiscalNumber(row.numRecibo, row.policyCode);

doCmd({
    cmd:'RepoLifePolicy',
    data:{ 
        operation:'GET',
        filter:`[id]=${policyReference.lifePolicyId}`,
        include:['Accounts','Holder','ComContract'],
        noTracking: true 
}});

const Policy = RepoLifePolicy.outData?.pop();
if(IsNull(Policy))
    throw '@No se encontró el recibo o la póliza indicada';

//Michael Delgado. 2026.05.20. GLOB-748. Se permite aplicar a pólizas inactivas siempre y cuando tengan saldo.
/*if(Policy.entityState === 'INACTIVE' || !Policy.active || !!Policy.inactiveDate)
    throw '@La Poliza ' + Policy.code + ' no se encuentra activa';*/

if(Policy.holderId != row.holderId)
    throw '@El contratante propocionado no pertenece a la poliza';

const payer = resolvePayer(row, Policy);

setPaylan(Policy);

/*
const numRecibo = Number(row.numRecibo);
const pago = Policy.PayPlan.find(item => item.id === numRecibo);
if(IsNull(pago))
    throw '@No se encontró recibo '+ row.numRecibo + ' en la poliza: ' + Policy.code;
*/
const Installments = GetInstallments(Policy.PayPlan, policyReference.changeId, Policy.code);
//return Policy.PayPlan
//return Installments.installments;

let account =Policy.Accounts.pop();
if(IsNull(account)){
    const accountId = CreateHolderAccount(row.holderId, Policy.id)
    doCmd({
        cmd:'RepoAccount',
        data:{ 
            operation:'GET',
            filter:`id=${ accountId }`,
            //include:['Movements']
    }});

    const [Account] = RepoAccount.outData;
    account = Account;
}

// Validate payment amount
//if(account.currentAmountBalance < amount )
//    throw '@ La cuenta asociada no cuenta con suficiente fondos';


const Transfer = executeTransfer({
    amount: row.monto,
    workspaceId: row.workspaceId,
    batchId: batchId,
    payerId: payer.id,
    payerName: payer.name
});

const supplementaryPremium = [{
  compensationAmount: 0,
  currency: Installments.currency,
  destination: 'TRANSIT', 
  transaction: `Depósito REF: ${Transfer?.id ?? 0}`, 
  lifePolicyId: Policy.id,
  moneyInAmount: Installments.available,
  transitAmount: 0 
}];

const entity = {
    currency: Installments.currency,
    InstallmentPremiums: Installments.installments.map( item => (
        {
            lifePolicyId: Policy.id,
            payPlanId: item.id,
            dueAmount: item.dueAmount,
            moneyInAmount: item.dueAmount,
            currency: item.currency,
            compensationAmount: 0,
            transitAmount: 0
        }
    )),
    SupplementaryPremiums: Installments.available <= 0 ? null : supplementaryPremium,
    differenceAmount: 0,
    transactionDate: new Date().toISOString(),
    transferAmount: row.monto,
    fromTransitAmount: 0,
    compensationAmount: 0,
    premiumAmount: Number(row.monto) - Installments.available ,
    supplementaryAmount: Installments.available,
    premiumDifferenceAmount: 0,
    transferWorkspaceId: row.workspaceId,
    Transfers: [ 
        Transfer
    ],
    Premiums: Installments.installments.map( item => ({
        Installment: item,
        comContractId: Policy.comContractId,
        comContractName: Policy?.ComContract?.name || '',
        concept: 'Premium',
        contractYear: Policy.contractYear,
        coveredUntil: Policy.end,
        created: Policy.dateIncome,
        currency: Policy.currency,
        custom: false,
        ...item,
        payerId: payer.id,
        policyCode: Policy.code,
        policyHolderName: Policy.Holder.FullName,
        sellerName: '  ',
    }))
}

//MAD: GLOB-770. 2026.05.29. Esta opción del draft genera duplicado en la cuenta de la póliza, se comenta debido a ello.
// Execute payment
/*doCmd({
    cmd: 'DoPaymentAllocation',
    data: {
        entity: entity,
        draft: true
    }
});

if(!DoPaymentAllocation.ok) throw '@'+DoPaymentAllocation.msg;
if(DoPaymentAllocation.outData.warning != '') throw '@'+DoPaymentAllocation.warning;*/
// Confirm the payment.
doCmd({cmd:'DoPaymentAllocation',data:{ entity }})

return { ok: DoPaymentAllocation.ok, msg: DoPaymentAllocation.msg };

function setPaylan(Policy) {
  doCmd({cmd:'LoadEntities',data:{ entity: "PayPlan", filter: `lifePolicyId = ${Policy.id} AND cancellationDate is null` }});
  const resultado = LoadEntities.outData ?? [];

  if(resultado.length == 0)
    throw `@Póliza ${Policy.code} no posee cuotas`;

  Policy.PayPlan = resultado;
  
}

// GLOB-588: Resuelve la póliza desde el número fiscal, ya sea de la póliza o de un endoso.
function findPolicyByFiscalNumber(fiscalNumber, policyCode) {
  const escapedFiscalNumber = String(fiscalNumber).replace(/'/g, "''");
  const escapedPolicyCode = String(policyCode).replace(/'/g, "''");
  const query = `SELECT TOP 1 receipt.lifePolicyId, receipt.changeId
  FROM (
    SELECT lp.id AS lifePolicyId, 0 AS changeId, 0 AS sourceOrder
    FROM LifePolicy lp
    WHERE lp.fiscalNumber = '${escapedFiscalNumber}'
      AND lp.code = '${escapedPolicyCode}'

    UNION ALL

    SELECT c.lifePolicyId, b.changeId, 1 AS sourceOrder
    FROM Bill b
    INNER JOIN Change c ON c.id = b.changeId
    INNER JOIN LifePolicy lp ON lp.id = c.lifePolicyId
    WHERE b.fiscalNumber = '${escapedFiscalNumber}'
      AND lp.code = '${escapedPolicyCode}'
  ) receipt
  ORDER BY receipt.sourceOrder`;

  doCmd({ cmd: 'DoQuery', data: { sql: query } });
  const result = DoQuery.outData?.[0];

  if(IsNull(result?.lifePolicyId))
    throw '@No se encontró el recibo o la póliza indicada';

  return {
    lifePolicyId: result.lifePolicyId,
    changeId: result.changeId ?? 0
  };
}

function CreateHolderAccount( intermediaryId, policyId ){
    doCmd({ 
        cmd:'RepoAccount',
        data: { 
            operation: 'ADD',
            entity: {
                currency: 'USD',
                holderId: intermediaryId,
                type: 'TRANSIT',
                accNo: `TRA${policyId}`,
                name: 'Cuenta Depósito',
                lifePolicyId: policyId
             }
        }
    });
    
    if(!RepoAccount.ok)
        throw '@' + RepoAccount.msg;

    doCmd({
        cmd:'LoadEntity',
        data:{
            entity:'[Account]',
            filter:`holderId=${ row.holderId } AND type='TRANSIT' AND accNo LIKE '%TRA%'`,
            fields:'id' 
        }
    });

    return LoadEntity.outData.id
}

function buildIncomeTypeForm(formId, payerId, payerName) {
    const validatedFormId = validatePositiveId(formId, 'El formulario del tipo de ingreso no es válido.');
    const validatedPayerId = validatePositiveId(payerId, 'El código del pagador no es válido.');
    if (typeof payerName !== 'string' || payerName.trim() === '') {
        throw new Error('No se encontró el nombre del pagador.');
    }

    doCmd({
        cmd: 'DoQuery',
        data: {
            sql: `SELECT [json] FROM [dbo].[Form] WHERE [id] = ${validatedFormId}`
        }
    });

    const formResult = typeof DoQuery !== 'undefined' ? DoQuery : null;
    if (!formResult || formResult.ok !== true) {
        throw new Error(formResult && formResult.msg
            ? formResult.msg
            : 'No fue posible consultar el formulario del tipo de ingreso.');
    }
    if (!Array.isArray(formResult.outData) || formResult.outData.length !== 1
        || !formResult.outData[0] || typeof formResult.outData[0].json !== 'string') {
        throw new Error('No se encontró la definición del formulario del tipo de ingreso.');
    }

    let fields;
    try {
        fields = JSON.parse(formResult.outData[0].json);
    } catch (error) {
        throw new Error('La definición del formulario del tipo de ingreso no contiene JSON válido.');
    }
    if (!Array.isArray(fields) || fields.some(field => !field
        || typeof field !== 'object' || Array.isArray(field))) {
        throw new Error('La definición del formulario del tipo de ingreso no es una lista de campos válida.');
    }

    const payerNameFields = fields.filter(field => field.name === 'clientePA');
    const payerIdFields = fields.filter(field => field.name === 'hiddenCodigoCliente');
    if (payerNameFields.length !== 1 || payerIdFields.length !== 1) {
        throw new Error('El formulario debe contener un campo clientePA y un campo hiddenCodigoCliente.');
    }

    payerNameFields[0].userData = [payerName.trim()];
    payerIdFields[0].userData = [String(validatedPayerId)];
    return JSON.stringify(fields);
}

function resolvePayer(paymentRow, Policy) {
    const hasPayerId = paymentRow.payerId !== null && paymentRow.payerId !== undefined
        && String(paymentRow.payerId).trim() !== '';
    const hasPayerName = typeof paymentRow.payerName === 'string'
        && paymentRow.payerName.trim() !== '';

    // Legacy batches did not persist payer metadata and used the policy holder as payer.
    if (!hasPayerId && !hasPayerName) {
        return {
            id: validatePositiveId(Policy.holderId, 'El código del pagador no es válido.'),
            name: String(Policy.Holder?.FullName || '').trim()
        };
    }
    if (!hasPayerId || !hasPayerName) {
        throw new Error('La remesa no contiene los datos completos del pagador.');
    }

    return {
        id: validatePositiveId(paymentRow.payerId, 'El código del pagador no es válido.'),
        name: paymentRow.payerName.trim()
    };
}

function hydrateBatchPayer(paymentRow, batchId) {
    doCmd({
        cmd: 'DoQuery',
        data: {
            sql: `SELECT [id], [name], [jData] FROM [dbo].[Batch] WHERE [id] = ${batchId}`
        }
    });

    const batchResult = typeof DoQuery !== 'undefined' ? DoQuery : null;
    if (!batchResult || batchResult.ok !== true) {
        throw new Error(batchResult && batchResult.msg
            ? batchResult.msg
            : 'No fue posible cargar la remesa para validar el pagador.');
    }
    const batchData = batchResult && batchResult.outData;
    const batches = Array.isArray(batchData)
        ? batchData
        : (batchData && Array.isArray(batchData.data)
            ? batchData.data
            : (batchData ? [batchData] : []));
    const batch = batches[0] || null;
    if (!batch || Number(batch.id) !== batchId) {
        throw new Error('No fue posible cargar la remesa para validar el pagador.');
    }

    let batchRows = [];
    try {
        batchRows = typeof batch.jData === 'string' ? JSON.parse(batch.jData) : batch.jData;
    } catch (error) {
        batchRows = [];
    }
    const metadata = Array.isArray(batchRows)
        ? batchRows.reduce((found, item) => found || (Array.isArray(item)
            ? item.find(value => value && typeof value === 'object' && !Array.isArray(value)
                && String(value.type || '').toUpperCase() === 'REMITTANCE_METADATA')
            : null), null)
        : null;
    const metadataHasPayer = metadata && (metadata.payerId !== undefined || metadata.payerName !== undefined);

    if (metadataHasPayer) {
        if (paymentRow.payerId !== undefined && String(paymentRow.payerId) !== String(metadata.payerId)) {
            throw new Error('El pagador de la fila no coincide con el pagador de la remesa.');
        }
        if (paymentRow.payerName !== undefined
            && String(paymentRow.payerName).trim() !== String(metadata.payerName || '').trim()) {
            throw new Error('El nombre del pagador de la fila no coincide con la remesa.');
        }
        paymentRow.payerId = metadata.payerId;
        paymentRow.payerName = metadata.payerName;
        return;
    }

    const isNewPayerBatch = String(batch.name || '').indexOf('Cobro Remesa - ') === 0;
    if (isNewPayerBatch && (paymentRow.payerId === undefined || paymentRow.payerName === undefined)) {
        throw new Error('La remesa nueva no contiene los datos obligatorios del pagador.');
    }
}

function validatePositiveId(value, message) {
    if ((typeof value !== 'number' && typeof value !== 'string')
        || !/^\d+$/.test(String(value).trim())
        || !Number.isSafeInteger(Number(value)) || Number(value) <= 0) {
        throw new Error(message);
    }
    return Number(value);
}

function executeTransfer({ amount, workspaceId, batchId, payerId, payerName }) {
    const transferAmount = Number(amount);
    const cashDeskId = Number(workspaceId);
    const validatedBatchId = validateBatchId(batchId);

    if (!Number.isFinite(transferAmount) || transferAmount <= 0) {
        throw new Error('El monto de la transferencia debe ser mayor que cero.');
    }

    if (!Number.isFinite(cashDeskId) || cashDeskId <= 0) {
        throw new Error('El workspaceId de la caja no es válido.');
    }

    doCmd({
        cmd: 'RepoIncomeTypeCatalog',
        data: {
            operation: 'GET',
            filter: "internalType = 'PREMIUM'"
        }
    });

    const incomeTypeResult = typeof RepoIncomeTypeCatalog !== 'undefined'
        ? RepoIncomeTypeCatalog
        : null;
    if (!incomeTypeResult || incomeTypeResult.ok === false) {
        throw new Error(incomeTypeResult && incomeTypeResult.msg
            ? incomeTypeResult.msg
            : 'No fue posible consultar los tipos de ingreso.');
    }

    const incomeTypes = Array.isArray(incomeTypeResult.outData)
        ? incomeTypeResult.outData
        : [];
    const premiumIncomeType = incomeTypes.find(item => item
        && String(item.internalType || '').trim().toUpperCase() === 'PREMIUM'
        && String(item.code || '').trim() !== '');
    if (!premiumIncomeType) {
        throw new Error('No existe un tipo de ingreso configurado para PREMIUM.');
    }

    const incomeTypeForm = buildIncomeTypeForm(premiumIncomeType.formId, payerId, payerName);

    doCmd({
        cmd: 'RepoTransfer',
        data: {
            operation: 'ADD',
            entity: {
                currency: 'USD',
                amount: transferAmount,
                SplitPayments: [
                    {
                        amount: transferAmount,
                        paymentMethod: 'ACH',
                        paymentMethodName: 'ACH'
                    }
                ],
                incomeType: String(premiumIncomeType.code).trim(),
                jIncomeTypeForm: incomeTypeForm,
                sourceExternal: 'CajaAhUSD',
                destinationAccountId: 208,
                isExternal: true,
                concept: 'IW',
                DestinationAccount: null,
                transferWorkspaceId: cashDeskId,
                processIdAux: validatedBatchId
            },
            otherReceivables: []
        }
    });

    const repoResult = typeof RepoTransfer !== 'undefined' ? RepoTransfer : null;
    if (!repoResult || repoResult.ok === false) {
        throw new Error(repoResult && repoResult.msg
            ? repoResult.msg
            : 'No fue posible crear la transferencia.');
    }

    const transfers = Array.isArray(repoResult.outData)
        ? repoResult.outData
        : (repoResult.outData ? [repoResult.outData] : []);
    const transfer = transfers.length ? transfers[transfers.length - 1] : null;
    if (!transfer || !transfer.id) {
        throw new Error('La transferencia fue creada, pero no se obtuvo su identificador.');
    }

    doCmd({
        cmd: 'DoTransfer',
        data: {
            transferId: transfer.id
        }
    });

    const executionResult = typeof DoTransfer !== 'undefined' ? DoTransfer : null;
    if (!executionResult || executionResult.ok === false) {
        throw new Error(executionResult && executionResult.msg
            ? executionResult.msg
            : 'La transferencia no pudo ejecutarse.');
    }

    const executedTransfers = Array.isArray(executionResult.outData)
        ? executionResult.outData
        : (executionResult.outData ? [executionResult.outData] : []);
    return executedTransfers.length
        ? executedTransfers[executedTransfers.length - 1]
        : executionResult;
}

function validateBatchId(value) {
    const batchId = Number(value);
    if (!Number.isInteger(batchId) || batchId <= 0) {
        throw '@El id de la remesa no es válido';
    }
    return batchId;
}

function GetInstallments(payPlan, changeId, policyCode){
    
    //let payments = payPlan.filter(item => IsNull(item.payed) || item.payed === 0 )?.sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate));
    let available = Number(row.monto), installments = [];
    const onlyPositive = available >= 0 ? true : false; // o false

    //MAD: Si el monto es positivo debemos buscar solo cuotas positivas y viceversa, no se pueden mezclar.
    let payments = payPlan
      .filter(item => IsNull(item.payed) || item.payed === 0 || ((item.minimum || 0) - (item.payed || 0) != 0))
      .filter(item => onlyPositive ? item.minimum > 0 : item.minimum < 0)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  
    //GLOB-588: Validamos número fiscal (recibo), si se filtra por un cambio, que se busquen solo las cuotas asociadas a dicho cambio.
    if(changeId > 0) {
      log(`cambio: ${changeId}`);
      payments = payments.filter(item => item.changeId == changeId)?.sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate));
    }
  
    if(!payments || payments.length === 0) throw `@No hay primas pendientes en la poliza: ${policyCode}, recibo: ${row.numRecibo}`;
    
     for(const inst of payments){

        const minimum = n2(inst.minimum);
        const alreadyPaid = n2(inst.payed || 0);

        // saldo real pendiente de la cuota
        const pending = n2(minimum - alreadyPaid);
        //log(`cuota: ${inst.numberInYear}, monto: ${minimum}, pagado: ${alreadyPaid}, pendiente: ${pending}`);

        if(pending <= 0) continue;

        // lo que se puede aplicar ahora
        let applyAmount = 0;

        // Caso 1: alcanza para cubrir todo el pendiente
        if(available >= pending){
            applyAmount = pending;
        }
        // Caso 2: pago parcial
        else if(available > 0){
            applyAmount = available;
        }

        if(applyAmount > 0){

            installments.push({
                ...inst,
                dueAmount: applyAmount,                 // monto aplicado en ESTA ejecución
                previousPayed: alreadyPaid,             // opcional (auditoría)
                newPayed: n2(alreadyPaid + applyAmount),// acumulado nuevo
                remaining: n2(minimum - (alreadyPaid + applyAmount)),
                isPartial: (alreadyPaid + applyAmount) < minimum
            });

            available = n2(available - applyAmount);
        }

        if(available === 0) break;
    }
  
    if(!installments || installments.length == 0) throw '@El monto proporcionado no es suficiente para el pago de las primas';
    return { installments, available, currency: installments[0].currency };
}

function ValidateDto(row,errors){    
    for (const [clave, valor] of Object.entries(row)) {
        if(IsNull(valor)){
            errors.push(`El campo ${clave} es obligatorio`);
        }
    }
    if(errors.length > 0)
        throw '@'+GetMsgErrors(errors,',');
}

function IsNull(valor){
    return (!valor || valor === null || typeof valor === 'undefined' || valor === '')
}

function GetMsgErrors(errors, separador){
    if (!Array.isArray(errors)) return "";
    return errors.join(separador);
}

function n2(value) {
  const num = Number(value);
  if (isNaN(num)) return 0;
  return Number(num.toFixed(2));
}

/*
test:
row:
  workspaceId: 52
  policyCode: 'IN-IL-003094'
  numRecibo: '000000097'
  monto: 0.82
  holderId: 3
*/
