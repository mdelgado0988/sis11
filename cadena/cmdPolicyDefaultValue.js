//block
/*
Name: cmdPolicyDefaultValue
Autor: Michael Delgado
Fecha: 2026.01.21
Descripción: Actualiza valores por defecto para el ramo Incendio.
*/

try {
    const policyId = Number(_id);

    if (!Number.isInteger(policyId) || policyId <= 0) {
        throw new Error('El ID de la póliza no es válido');
    }

    doCmd({
        cmd: 'LoadEntity',
        data: {
            entity: 'LifePolicy',
            filter: `id=${policyId}`,
            fields: 'lob,id,paymentMethod,cessionBeneficiary'
        }
    });

    const data = LoadEntity?.outData || {};

    // Solo aplica para Incendio, ramo 1.
    if (Number(data.lob) !== 1) {
        return {
            ok: true,
            msg: 'La actualización no aplica para este ramo',
            paymentMethodUpdated: false,
            cessionBenificiaryUpdated: false
        };
    }

    const paymentMethodUpdated = updateDefaultPaymentMethod(data);
    const cessionBenificiaryUpdated = updateCessionBenificiary(data);

    return {
        ok: true,
        msg: 'Datos validados y actualizados',
        paymentMethodUpdated,
        cessionBenificiaryUpdated
    };

} catch (error) {
    return {
        ok: false,
        msg: error.message || String(error),
        paymentMethodUpdated: false,
        cessionBenificiaryUpdated: false
    };
}

function updateDefaultPaymentMethod(data) {
    try {
        if (data.paymentMethod) {
            return true;
        }

        const defaultPaymentMethod = 'PRO';

        doCmd({
            cmd: 'SetField',
            data: {
                entity: 'LifePolicy',
                entityId: data.id,
                fieldValue: `paymentMethod='${defaultPaymentMethod}'`
            }
        });

        if (!SetField.ok) {
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
}

function updateCessionBenificiary(data) {
    try {
        if (data.cessionBeneficiary) {
            return true;
        }

        doCmd({
            cmd: 'GetTable',
            data: {
                table: 'ConfiguracionCia',
                column: 'name',
                row: 'CodigoGlobal',
                getColumn: 'value'
            }
        });

        const defaultCessionBeneficiary = Number(GetTable?.outData || 0);

        if (defaultCessionBeneficiary <= 0) {
            return true;
        }

        doCmd({
            cmd: 'SetField',
            data: {
                entity: 'LifePolicy',
                entityId: data.id,
                fieldValue: `cessionBeneficiary='${defaultCessionBeneficiary}'`
            }
        });

        if (!SetField.ok) {
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
}