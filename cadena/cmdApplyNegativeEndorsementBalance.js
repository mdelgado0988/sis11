//block
//noreplace

/*
 * @name: cmdApplyNegativeEndorsementBalance
 * @author: Michael Delgado
 * @created: 2026.09.25
 * @version: 1.0
 * @description: Lee el saldo negativo de un endoso, registra directamente un movimiento en AccountMov y marca las cuotas negativas del endoso como pagadas.
 * @category: ENDOSOS / CUENTAS
 * @input: { changeId: number }
 * @output: { ok, msg, changeId, policyId, amount, accountMovId, payPlanIds }
 * @notes:
 *   - No requiere workspace, caja ni RepoTransfer.
 *   - Es idempotente para el mismo saldo y cuenta.
 */

try {
    const changeId = Number(context && context.changeId);

    if (!Number.isInteger(changeId) || changeId <= 0) {
        throw new Error('changeId es requerido');
    }

    doCmd({
        cmd: 'LoadEntity',
        data: {
            entity: 'Change',
            fields: 'id,lifePolicyId',
            filter: `id = ${changeId}`,
            noTracking: true
        }
    });

    const change = LoadEntity && LoadEntity.outData;

    if (!change) {
        throw new Error('No existe el endoso indicado');
    }

    const policyId = Number(change.lifePolicyId);

    doCmd({
        cmd: 'RepoLifePolicy',
        data: {
            operation: 'GET',
            filter: `[id] = ${policyId}`,
            include: ['Accounts', 'Holder'],
            noTracking: true
        }
    });

    const policy = Array.isArray(RepoLifePolicy && RepoLifePolicy.outData)
        ? RepoLifePolicy.outData[0]
        : null;

    if (!policy) {
        throw new Error('No existe la póliza del endoso');
    }

    doCmd({
        cmd: 'LoadEntities',
        data: {
            entity: 'PayPlan',
            fields: 'id,lifePolicyId,changeId,minimum,expected,payed,payedDate,transferId,currency,cancellationDate',
            filter: `changeId = ${changeId} AND cancellationDate IS NULL`,
            noTracking: true
        }
    });

    const payPlans = Array.isArray(LoadEntities && LoadEntities.outData)
        ? LoadEntities.outData
        : [];

    const positivePendingPayPlans = payPlans.filter(item => {
        const minimum = roundMoney(Number(item.minimum || 0));
        const payed = roundMoney(Number(item.payed || 0));
        return minimum > 0 && payed < minimum - 0.01;
    });

    if (positivePendingPayPlans.length) {
        return {
            ok: false,
            msg: 'El saldo negativo no puede aplicarse porque existen cuotas positivas pendientes',
            pendingPayPlanIds: positivePendingPayPlans.map(item => item.id),
            amount: 0
        };
    }

    const negativePayPlans = payPlans.filter(item => Number(item.minimum || 0) < 0);
    const pendingNegativePayPlans = negativePayPlans.filter(item =>
        roundMoney(Number(item.minimum || 0) - Number(item.payed || 0)) < -0.01
    );

    if (!negativePayPlans.length || !pendingNegativePayPlans.length) {
        return {
            ok: true,
            msg: negativePayPlans.length
                ? 'El saldo negativo del endoso ya fue aplicado'
                : 'El endoso no tiene un saldo negativo',
            amount: 0
        };
    }

    const saldo = roundMoney(
        pendingNegativePayPlans.reduce(
            (total, item) => total
                + Number(item.minimum || 0)
                - Number(item.payed || 0),
            0
        )
    );

    if (saldo >= 0) {
        return {
            ok: true,
            msg: 'El saldo del endoso no es negativo',
            amount: 0
        };
    }

    const amount = roundMoney(Math.abs(saldo));

    const policyAccount = getPolicyTransitAccount(policy);

    if (!policyAccount) {
        throw new Error('La póliza no tiene una cuenta en tránsito');
    }

    const currency = String(
        policy.currency
        || pendingNegativePayPlans[0].currency
        || 'USD'
    );

    doCmd({
        cmd: 'DoQuery',
        data: {
            sql: `
                SELECT TOP (1) id
                FROM AccountMov
                WHERE accountId = ${Number(policyAccount.id)}
                  AND [transaction] = 'Reduction'
                  AND transactionCode = 'TRANSIT'
                  AND amount = ${sqlMoney(saldo)}
                ORDER BY id DESC
            `
        }
    });

    const existingMovements = Array.isArray(DoQuery && DoQuery.outData)
        ? DoQuery.outData
        : [];

    let accountMovement = existingMovements[0] || null;

    if (!accountMovement) {
        doCmd({
            cmd: 'DoQuery',
            data: {
                sql: `
                    SET XACT_ABORT ON;
                    BEGIN TRANSACTION;

                    BEGIN TRY
                        DECLARE @TransferId INT;
                        DECLARE @AccountMovId INT;

                        INSERT INTO Transfer
                        (
                            amount,
                            currency,
                            concept,
                            sourceAccountId,
                            destinationAccountId,
                            executed,
                            status,
                            [date],
                            sourceExternal,
                            isExternal,
                            transactionCode,
                            operatingAccountId,
                            lifePolicyId,
                            incomeType,
                            transferWorkspaceId
                        )
                        VALUES
                        (
                            ${sqlMoney(saldo)},
                            '${escapeSql(currency)}',
                            'Saldo negativo endoso ${changeId}',
                            NULL,
                            ${Number(policyAccount.id)},
                            1,
                            1,
                            GETDATE(),
                            'SYSTEM',
                            0,
                            'TRANSIT',
                            0,
                            ${policyId},
                            NULL,
                            NULL
                        );

                        SET @TransferId = CAST(SCOPE_IDENTITY() AS INT);

                        INSERT INTO AccountMov
                        (
                            accountId,
                            [date],
                            bid,
                            ask,
                            [transaction],
                            amount,
                            amountToUnits,
                            units,
                            transferId,
                            transactionCode,
                            amount_af,
                            fundingFactor,
                            units_af,
                            amountBalance,
                            unitBalance
                        )
                        VALUES
                        (
                            ${Number(policyAccount.id)},
                            GETDATE(),
                            0,
                            0,
                            'Reduction',
                            ${sqlMoney(saldo)},
                            0,
                            0,
                            @TransferId,
                            'TRANSIT',
                            0,
                            0,
                            0,
                            0,
                            0
                        );

                        SET @AccountMovId = CAST(SCOPE_IDENTITY() AS INT);
                        COMMIT TRANSACTION;

                        SELECT @TransferId AS transferId, @AccountMovId AS accountMovId;
                    END TRY
                    BEGIN CATCH
                        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
                        THROW;
                    END CATCH;
                `
            }
        });

        if (!DoQuery || DoQuery.ok === false) {
            throw new Error(DoQuery && DoQuery.msg
                ? DoQuery.msg
                : 'No se pudo registrar el movimiento en AccountMov');
        }

        accountMovement = Array.isArray(DoQuery.outData)
            ? DoQuery.outData[0]
            : null;

        if (!accountMovement || !accountMovement.transferId) {
            throw new Error('No se obtuvo la referencia del movimiento en cuenta');
        }
    }

    // Marca las cuotas negativas del endoso como pagadas,
    // conservando el signo original del saldo.
    pendingNegativePayPlans.forEach(payPlan => {
        const minimum = roundMoney(Number(payPlan.minimum || 0));

        doCmd({
            cmd: 'DoQuery',
            data: {
                sql: `
                    UPDATE PayPlan
                    SET
                        payed = ${minimum},
                        payedDate = GETDATE()
                    WHERE id = ${Number(payPlan.id)}
                `
            }
        });

        if (!DoQuery || DoQuery.ok === false) {
            throw new Error(
                DoQuery && DoQuery.msg
                    ? DoQuery.msg
                    : 'No se pudo marcar la cuota como pagada'
            );
        }
    });

    return {
        ok: true,
        msg: 'Saldo negativo registrado en AccountMov y cuota marcada como pagada',
        changeId: changeId,
        policyId: policyId,
        amount: amount,
        transferId: accountMovement.transferId,
        accountMovId: accountMovement.accountMovId,
        payPlanIds: pendingNegativePayPlans.map(item => item.id)
    };

} catch (error) {
    throw '@' + (error.message || String(error));
}

function getPolicyTransitAccount(policy) {
    const accounts = Array.isArray(policy.Accounts)
        ? policy.Accounts
        : [];

    return accounts.find(account =>
        account
        && String(account.type || '').toUpperCase() === 'TRANSIT'
    );
}

function roundMoney(value) {
    const number = Number(value || 0);
    return Number.isFinite(number)
        ? Number(number.toFixed(2))
        : 0;
}

function escapeSql(value) {
    return String(value || '').replace(/'/g, "''");
}

function sqlMoney(value) {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number.toFixed(2) : '0.00';
}
