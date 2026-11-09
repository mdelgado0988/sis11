# Guía para replicar los ajustes de recargos y descuentos

## Alcance

Esta guía documenta el comportamiento implementado en `InclusionCobertura.jsx` para que pueda replicarse en otras vistas de endosos que incluyan coberturas nuevas, recargos, descuentos y distribución de reaseguro.

Vistas de referencia:

- `vistas/InclusionCobertura.jsx`
- `vistas/ExclusionCobertura.jsx`

## Regla funcional

El recargo o descuento ingresado por el usuario es un ajuste manual del endoso y no debe confundirse con la prorrata de la prima de las coberturas.

La vista debe manejar dos valores distintos:

1. Prima bruta de las coberturas incluidas, calculada por el motor y prorrateada según la vigencia.
2. Ajuste manual, que se aplica completo y se muestra en una fila independiente.

El resumen debe representar:

```text
Prima neta = Prima bruta + Ajuste
Impuesto = impuesto calculado sobre la prima neta
Total = Prima neta + Impuesto
```

Para un descuento del 100% de las coberturas incluidas:

```text
Prima bruta del movimiento = 662.50
Descuento = -662.50
Prima neta = 0.00
Impuesto del movimiento = 0.00
Total a facturar = 0.00
```

El impuesto anterior de la póliza se conserva en el valor anual; únicamente el movimiento del endoso queda sin impuesto.

## Exclusión de coberturas

En `ExclusionCobertura.jsx` la prima de las coberturas eliminadas se expresa como un movimiento negativo. Por eso, cuando el usuario ingresa un recargo para compensar la exclusión, el cálculo debe conservar los signos:

```text
Prima bruta del movimiento = prima eliminada + movimientos de dependientes
Ajuste = recargo - descuento
Prima neta = Prima bruta del movimiento + Ajuste
```

El recargo o descuento se reparte proporcionalmente entre las coberturas que permanecen y tienen prima positiva. La cotización nativa recibe una enmienda por cada cobertura ajustada; la última cobertura absorbe el remanente de redondeo.

En reaseguro, las filas de las coberturas remanentes utilizan la prima nueva calculada por la enmienda, que ya contiene su parte del ajuste. Así, el saldo final y el movimiento sintético reflejan la misma prima neta que la facturación. Si el recargo compensa completamente la prima negativa de la exclusión, el impuesto del movimiento debe resultar `0.00` cuando la prima neta sea cero.

## Distribución del ajuste por cobertura

El ajuste no debe cargarse completo a la primera cobertura seleccionada. Debe repartirse entre las coberturas seleccionadas y las coberturas dependientes recalculadas que aporten prima al movimiento.

```text
pesoCobertura = primaBaseCobertura / sumaPrimasBase
ajusteCobertura = ajusteTotal * pesoCobertura
```

Para una cobertura dependiente, el peso corresponde a su movimiento de prima (`newPremium - oldPremium`), no a toda su prima anual nueva. Para una cobertura incluida directamente, el peso corresponde a la prima generada por la inclusión.

La última cobertura debe recibir el remanente para que la suma de los ajustes coincida exactamente con el ajuste ingresado, incluyendo los centavos.

Coberturas con prima cero:

- No participan en el reparto proporcional.
- Si todas tienen prima cero, se conserva la cobertura seleccionada como respaldo y la validación debe impedir una prima negativa.

La prorrata se calcula con la vigencia propia de cada cobertura: días restantes desde la fecha efectiva hasta su fecha final, divididos entre los días totales de esa cobertura. No debe reutilizarse una prorrata global de la póliza.

La validación se realiza sobre:

```text
primaBaseCobertura + ajusteCobertura + extraPremium >= 0
```

## Reaseguro

El descuento debe propagarse al cálculo de reaseguro. No basta con modificar el resumen de facturación.

Para cada cobertura incluida se conservan dos valores:

- `premium`: prima bruta para mostrar la cotización.
- `reinsurancePremium`: prima neta para el estado final del reaseguro.
- `prorated`: prima bruta prorrateada para la vista de cotización.
- `reinsuranceProrated`: prima prorrateada neta para el movimiento de reaseguro.

La pestaña de distribución del movimiento utiliza `reinsuranceProrated` por cobertura y por participación de la línea. El saldo final del contrato continúa utilizando `reinsurancePremium`.

La construcción del estado final debe usar `reinsurancePremium` cuando exista:

```js
premium: coverage.reinsurancePremium !== undefined
  ? num(coverage.reinsurancePremium)
  : num(coverage.premium)
```

Esto evita que el saldo final del contrato y el movimiento sintético vuelvan a mostrar como cobrable una prima que fue descontada.

Con un descuento del 100%:

- La cobertura incluida queda con prima neta `0.00` en reaseguro.
- No genera prima en el movimiento sintético.
- No aumenta el saldo final del contrato.

## Error por prima negativa

Si una cobertura queda negativa después de distribuir el ajuste:

- El endoso continúa bloqueado.
- Se muestra el error indicando la cobertura afectada.
- Se conserva la cotización preliminar.
- El resumen de facturación permanece visible para identificar la diferencia entre prima, ajuste, impuesto y total.

No se debe ocultar el resumen por el hecho de que la validación falle.

## Impuestos

El motor puede devolver el impuesto calculado sobre la prima bruta o sobre un ajuste prorrateado. La vista debe recalcular el impuesto del movimiento sobre la prima neta:

```text
primaNetaMovimiento = primaBrutaMovimiento + ajuste
impuestoMovimiento = impuestoBruto * primaNetaMovimiento / primaBrutaMovimiento
```

Si la prima neta es cero, el impuesto del movimiento debe ser cero.

## Puntos de implementación

Al replicar el comportamiento en otra vista, revisar estos puntos:

1. Cotización inicial sin ajuste.
2. Cálculo de la prima base por cobertura.
3. Reparto proporcional del recargo/descuento.
4. Validación de primas negativas.
5. Cotización nativa sin mutar parcialmente las primas; el ajuste se conserva separado por cobertura para facturación y reaseguro.
6. Resumen con prima bruta, ajuste, impuesto neto y total.
7. Campos separados para prima de facturación y prima usada por reaseguro.
8. Movimiento sintético y saldo final usando la prima neta.
9. Bloqueo del endoso si hay prima negativa.
10. Conservación del resumen aun cuando la cotización sea inválida.
11. La vista previa de cuotas debe distribuir el total neto del endoso, incluyendo ajuste e impuesto.

## Casos mínimos de prueba

### Sin ajuste

- Recargo `0`.
- Descuento `0`.
- La prima y el impuesto deben coincidir con el cálculo nativo.

### Descuento parcial

- El descuento se reparte proporcionalmente.
- La prima neta y el impuesto disminuyen.
- El reaseguro usa la prima neta.

### Descuento del 100%

- La prima neta del movimiento es `0.00`.
- El impuesto del movimiento es `0.00`.
- El total a facturar es `0.00`.
- El reaseguro no genera prima por las coberturas descontadas.

### Descuento superior a la prima

- La vista muestra el resumen de facturación.
- Se muestra la cobertura que queda negativa.
- No permite confirmar ni ejecutar el endoso.

### Vigencia parcial

- La prima base conserva la prorrata de vigencia.
- El descuento manual conserva el importe completo definido por el usuario.
- El impuesto se calcula sobre la prima neta resultante.

## Validación técnica

Después de modificar otra vista:

```text
git diff --check -- <archivo>
```

También debe validarse en consola que el movimiento sintético y el estado final del reaseguro no incluyan nuevamente la prima bruta descontada.
