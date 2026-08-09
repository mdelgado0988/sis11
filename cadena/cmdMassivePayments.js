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


doCmd({
    cmd:'RepoLifePolicy',
    data:{ 
        operation:'GET',
        filter:`[code]='${row.policyCode}'`,
        include:['Accounts','Holder','ComContract'],
        noTracking: true 
}});

const Policy = RepoLifePolicy.outData.pop();
if(Policy == null)
    throw '@Policy Not found';

//Michael Delgado. 2026.05.20. GLOB-748. Se permite aplicar a pólizas inactivas siempre y cuando tengan saldo.
/*if(Policy.entityState === 'INACTIVE' || !Policy.active || !!Policy.inactiveDate)
    throw '@La Poliza ' + Policy.code + ' no se encuentra activa';*/

if(Policy.holderId != row.holderId)
    throw '@El contratante propocionado no pertenece a la poliza';

setPaylan(Policy);

/*
const numRecibo = Number(row.numRecibo);
const pago = Policy.PayPlan.find(item => item.id === numRecibo);
if(IsNull(pago))
    throw '@No se encontró recibo '+ row.numRecibo + ' en la poliza: ' + Policy.code;
*/
//GLOB-588: Validamos número fiscal (recibo) según campo correcto
let changeId = validateFiscalNumber(Policy, row);
const Installments = GetInstallments(Policy.PayPlan, changeId);
//return Policy.PayPlan
//return Installments.installments;

let account =Policy.Accounts.pop();
if(IsNull(account)){
    const accountId = CreateHolderAccount(row.holderId, row.policyId)
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


const Transfer = DoTransfer({amount:row.monto,workspaceId:row.workspaceId});

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
        payerId: Policy.holderId,
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

//GLOB-588: Validamos número fiscal (recibo) según campo correcto
function validateFiscalNumber(Policy, row) {

  let changeId = 0;
  const fiscalNumber = row.numRecibo

  //if it doesn´t existe, look for changes
  if(Policy.fiscalNumber != fiscalNumber){

    log(`Buscando recibo como endoso`);

    //MAD: 2026.04.28. es necesario hacer el JOIN para buscar el recibo en la póliza, podría repetirse.
    const query = `SELECT b.changeId
    FROM Change c 
    INNER JOIN Bill b ON b.changeId = c.id
    WHERE c.lifePolicyId = ${Policy.id} AND b.fiscalNumber = '${fiscalNumber}'`

    doCmd({ cmd: "DoQuery", data: { sql: query } });
    const resultado = DoQuery.outData?.[0];
    if(!resultado)
      throw '@No se encontró recibo '+ row.numRecibo + ' en la poliza: ' + Policy.code;
    else {
      changeId = resultado.changeId ?? 0;
      log(`id encontrado: ${changeId}`);
    }

  }

  return changeId;
  
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
                accNo: `TRA${row.policyId}`,
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

function DoTransfer({amount,workspaceId}){
    
    doCmd({
        cmd: 'RepoTransfer',
        data: {
            operation: 'ADD',
            entity: {
                currency: 'USD',
                amount: amount,
                SplitPayments: [
                    {
                        amount: amount,
                        paymentMethod: 'ACH',
                        paymentMethodName: 'ACH',
                    }
                ],
                incomeType: 'IT7',
                sourceExternal: 'CajaAhUSD',
                destinationAccountId: 208,
                isExternal: true,
                concept: 'IW',
                DestinationAccount: null,
                transferWorkspaceId: workspaceId
            },
            otherReceivables: []
        }
    });

    const Transfer = RepoTransfer.outData.pop();

// Move wf to Approval
//!Dejo en comentario porque aun no hay WF, cuando exista este paso sera necesario
//doCmd({cmd:'GotoStep', data:{ procesoId: Transfer.processId, estado: 'APROVED' }}); 

    doCmd({
        cmd:'DoTransfer',
        data:{ 
            transferId: Transfer.id 
        }
    });
    return DoTransfer.outData.pop();
}

function GetInstallments(payPlan, changeId){
    
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
  
    if(!payments || payments.length === 0) throw `@No hay primas pendientes en la poliza: ${row.policyCode}, recibo: ${row.numRecibo}`;
    
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