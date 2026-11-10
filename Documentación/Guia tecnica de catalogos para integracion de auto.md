# Guía técnica de catálogos para integración de auto

## 1. Objetivo

Este documento reúne los comandos que un integrador puede utilizar para consultar información de referencia sin ejecutar `DoQuery`. Los valores obtenidos se pueden usar para validar entradas y construir los payloads de póliza y objeto asegurado.

Todos los llamados usan el endpoint:

```text
POST https://sisos-api-iconx-latest.axxis-systems.net/int/cmd
```

Headers:

```http
Authorization: Bearer <API_TOKEN>
X-Environment: <environment>
Content-Type: application/json
```

## 2. Forma general de consulta

```json
{
  "cmd": "<command>",
  "data": {
    "operation": "GET",
    "filter": "<filter>",
    "size": "<pageSize>",
    "noTracking": true
  }
}
```

No todos los comandos requieren todos los campos. Cuando no se necesita filtro, se puede omitir `filter`. El resultado esperado se encuentra normalmente en `outData`.

## 3. Producto y configuración

### RepoProduct

Permite obtener la configuración del producto, el ramo, periodicidades, convenio de pago y las coberturas configuradas.

```json
{
  "cmd": "RepoProduct",
  "data": {
    "operation": "GET",
    "filter": "code = '<productCode>'",
    "noTracking": true
  }
}
```

Información útil:

| Ruta | Uso |
|---|---|
| `outData[0].lobCode` | Código del ramo |
| `outData[0].configJson` | Configuración JSON del producto |
| `JSON.parse(configJson).Main` | Moneda, segmento, canal y configuración principal |
| `JSON.parse(configJson).Coverages` | Coberturas y sus atributos |
| `JSON.parse(configJson).Premium` | Periodicidad y convenio de cuotas |

## 4. Formulario del objeto asegurado

### RepoObjectDefinition

Obtiene la definición y el formulario completo del objeto asegurado.

```json
{
  "cmd": "RepoObjectDefinition",
  "data": {
    "operation": "GET",
    "filter": "code = 'DTAUT'",
    "include": ["Form"],
    "noTracking": true
  }
}
```

El integrador debe usar `outData[0].id` como `objectDefinitionId` y tomar `outData[0].Form.json` como plantilla del formulario. El arreglo debe conservarse completo al crear `RepoInsuredObject`.

## 5. Contactos y dirección

### GetContacts

Consulta el asegurado o el acreedor a partir de su identificador.

```json
{
  "cmd": "GetContacts",
  "data": {
    "filter": "id=<contactId>"
  }
}
```

### RepoContactAddress

Obtiene las direcciones asociadas a un contacto.

```json
{
  "cmd": "RepoContactAddress",
  "data": {
    "operation": "GET",
    "filter": "contactId=<contactId>",
    "noTracking": true
  }
}
```

El integrador puede usar la primera dirección retornada para construir el valor JSON de `hiddenUbicacion`, si el formulario lo requiere.

## 6. Catálogos geográficos

Los siguientes comandos consultan catálogos jerárquicos. Los filtros deben construirse con los códigos seleccionados en el nivel anterior.

### RepoCountryCatalog

```json
{
  "cmd": "RepoCountryCatalog",
  "data": {
    "operation": "GET",
    "filter": "code='<countryCode>'",
    "noTracking": true
  }
}
```

### RepoStateCatalog

```json
{
  "cmd": "RepoStateCatalog",
  "data": {
    "operation": "GET",
    "filter": "countryCode='<countryCode>'",
    "noTracking": true
  }
}
```

Para consultar un estado específico se puede agregar `AND code='<stateCode>'`.

### RepoCityCatalog

```json
{
  "cmd": "RepoCityCatalog",
  "data": {
    "operation": "GET",
    "filter": "stateCode='<stateCode>'",
    "noTracking": true
  }
}
```

Para consultar una ciudad específica se puede agregar `AND code='<cityCode>'`.

### RepoSectorCatalog

```json
{
  "cmd": "RepoSectorCatalog",
  "data": {
    "operation": "GET",
    "filter": "cityCode='<cityCode>'",
    "noTracking": true
  }
}
```

Para consultar un sector específico se puede agregar `AND code='<sectorCode>'`.

## 7. Forma de pago

### RepoPaymentMethodCatalog

Consulta las formas de pago disponibles sin usar SQL.

```json
{
  "cmd": "RepoPaymentMethodCatalog",
  "data": {
    "operation": "GET",
    "size": "<pageSize>",
    "noTracking": true
  }
}
```

El código que debe enviarse en `LifePolicy.paymentMethod` se toma de la propiedad `code` del registro seleccionado. La descripción normalmente se encuentra en `name`.

## 8. Sucursal

### RepoBranch

Consulta las sucursales disponibles.

```json
{
  "cmd": "RepoBranch",
  "data": {
    "operation": "GET",
    "filter": "<optionalBranchFilter>",
    "size": "<pageSize>",
    "noTracking": true
  }
}
```

El código seleccionado se envía en `LifePolicy.branchCode`. Si el repositorio no está habilitado en el ambiente, el integrador debe recibir el código de sucursal desde su propia configuración; no debe reemplazar la consulta con `DoQuery` dentro de este flujo.

## 9. Convenio de cuotas

No se requiere consultar SQL para obtener el convenio si el código del convenio está en la configuración del producto. El integrador debe:

1. Leer `JSON.parse(product.configJson).Premium.installmentScheme`.
2. Usar el mecanismo de repositorio configurado para convenios de cuotas en el ambiente.
3. Enviar el identificador obtenido en `LifePolicy.installmentSchemeId`.

Si el ambiente no expone un repositorio específico para `InstallmentScheme`, este punto requiere una definición adicional del contrato de catálogo. No se recomienda resolverlo con SQL embebido en el integrador.

## 10. Tablas de valores del formulario

Cuando el ambiente permita consultar tablas de configuración directamente, se puede usar `GetFullTable`. Este comando no ejecuta SQL; recibe el nombre de la tabla y devuelve una matriz cuyo primer registro contiene encabezados.

```json
{
  "cmd": "GetFullTable",
  "data": {
    "table": "<tableName>"
  }
}
```

Tablas que pueden ser necesarias para preparar `DTAUT` y la tarifa:

| Tabla | Uso |
|---|---|
| `tbMarcas` | Códigos y nombres de marcas |
| `tbModelos` | Códigos y nombres de modelos, relacionados con marca y ramo |
| `tblTipoPorRamo` | Tipos de vehículo por ramo |
| `tblUsoPorRamo` | Usos de vehículo por ramo |
| `cfgCobtarAuto` | Campos y tipos de parámetros de tarifa por cobertura |
| `tarificacionSIS9Auto` | Información de tarifa usada para validar coberturas con prima cero por diseño |

Los valores de marca, modelo, tipo, uso, transmisión, cilindros y combustible también pueden ser proporcionados por el integrador o por un servicio de catálogo acordado. Esta guía no obliga a un origen único.

El integrador debe enviar únicamente los códigos/valores válidos para el producto, ramo y formulario seleccionados:

| Campo DTAUT | Valor esperado |
|---|---|
| `cmbMarca` | Código de marca |
| `cmbModelo` | Código de modelo |
| `cmbtipo` | Código de tipo |
| `cmbUsoAuto` | Código de uso |
| `txtTransmision` | Código o valor de transmisión |
| `cmbCilindrosAuto` | Código o valor de cilindros |
| `cmbCombustibleAuto` | Código o valor de combustible |
| `hiddenCobtar` | JSON serializado de parámetros de tarifa |

## 11. Reglas para no usar DoQuery

- Usar `RepoProduct` para producto y configuración.
- Usar `RepoObjectDefinition` para el formulario.
- Usar `GetContacts` para contactos.
- Usar `RepoContactAddress` para direcciones.
- Usar repositorios `Repo*Catalog` para catálogos geográficos.
- Usar `RepoPaymentMethodCatalog` para formas de pago.
- Usar `RepoBranch` para sucursales cuando esté habilitado.
- Usar `GetFullTable` para tablas de vehículo y tarifa cuando el ambiente permita exponerlas.

## 12. Respuesta y errores

Una consulta exitosa normalmente contiene `ok=true` y un arreglo `outData`. El integrador debe validar `ok`, controlar `msg` y tratar un `outData` vacío como ausencia de resultados.

No se deben guardar tokens ni datos sensibles en logs. Los filtros deben construirse con escape de caracteres y sin concatenar valores no confiables sin validación.

