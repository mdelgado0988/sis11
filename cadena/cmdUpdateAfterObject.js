//block
//noreplace
/*
Name: cmdUpdateAfterObject
Autor: Axxis Systems
Fecha: 2026.01.01
Descripción: Actualiza suma luego de un cambio de objeto, solo aplica para ramo Incendio.
*/


try {
    const { policyId, userData, lob } = context;

    if (Number(lob) !== 1) {
        return {
            ok: true,
            msg: 'Actualización no aplica para este ramo'
        };
    }

    if (!policyId || !userData || userData.txtSA === undefined || userData.txtSA === null) {
        throw new Error('No se pudo recuperar la suma asegurada de la póliza');
    }

    const insuredSum = parseFloat(userData.txtSA);

    if (!Number.isFinite(insuredSum)) {
        throw new Error('La suma asegurada no es válida');
    }

    doCmd({
        cmd: 'SetPolicyField',
        data: {
            policyId: policyId,
            fieldValue: `[insuredSum]=${insuredSum}`
        }
    });

    if (!SetPolicyField.ok) {
        throw new Error(SetPolicyField.msg);
    }

    return {
        ok: true,
        msg: 'Suma actualizada'
    };
} catch (error) {
    throw '@' + (error.message || error);
}