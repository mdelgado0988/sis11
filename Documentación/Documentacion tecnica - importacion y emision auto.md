# Guía técnica de comandos para emitir pólizas de auto

## 1. Objetivo

Esta guía describe los comandos de SISos que un sistema integrador puede consumir directamente para construir su propio flujo de cotización y emisión de una póliza de auto. El integrador debe enviar los comandos individuales en el orden que corresponda a su propio proceso.

Los códigos, coberturas, campos obligatorios y reglas comerciales deben obtenerse de la configuración vigente que el integrador utilice.

## 2. Acceso al servicio

```text
POST https://sisos-api-iconx-latest.axxis-systems.net/int/cmd
```

Headers:

```http
Authorization: Bearer <API_TOKEN>
X-Environment: globaluat
Content-Type: application/json
```

El token debe almacenarse como secreto o variable de entorno. No debe persistirse en código fuente, archivos de configuración, documentación ni logs.

La forma general de todos los llamados es:

```json
{
  "cmd": "<nombre_comando>",
  "data": { "<payload_del_comando>": "..." }
}
```

## 3. Secuencia recomendada para un flujo propio

El integrador puede implementar la siguiente secuencia:

```text
1. Leer producto y catálogos
2. Resolver asegurado, acreedor, sucursal y forma de pago
3. Construir la entidad LifePolicy
4. Crear la póliza en estado de oferta
5. Crear el objeto asegurado DTAUT
6. Avanzar el workflow para aplicar valores por defecto
7. Cotizar y guardar la cotización
8. Avanzar el workflow hasta Borrador de Póliza
9. Emitir la póliza
10. Consultar y verificar active=true
```

El integrador puede incluir sus propios identificadores de correlación en su sistema, sin incorporarlos al contrato de emisión salvo que exista un requerimiento específico.

## 4. Datos que debe preparar el integrador

### 4.1 Identificación y datos de póliza

| Campo lógico | Tipo | Formato o regla | Se envía en |
|---|---|---|---|
| `insuredId` | entero positivo | Id existente en `Contact` | `holderId`, `payerId`, `MainInsured.contactId`, `Insureds[0].contactId` |
| `creditorId` | entero positivo o nulo | Id existente en `Contact` | `cessionBeneficiary` |
| `branchCode` | string | Código de sucursal activa | `branchCode` |
| `currency` | string | Usualmente `USD`, según producto | `currency` |
| `start` | fecha/hora | ISO 8601 | `start` |
| `end` | fecha/hora | ISO 8601 | `end` |
| `duration` | entero | Años completos | `duration` |
| `durationMonths` | entero | Meses restantes | `durationMonths` |
| `durationDays` | entero | Días restantes | `durationDays` |
| `periodicity` | string | Código configurado en el producto | `periodicity` |
| `paymentMethod` | string | Código del catálogo de pago | `paymentMethod` |
| `installmentSchemeId` | entero o nulo | Id de `InstallmentScheme` | `installmentSchemeId` |
| `productCode` | string | Código del producto seleccionado | `productCode` |
| `lob` | string | Código del ramo informado por la configuración | `lob` |

Las fechas recibidas por un sistema externo pueden ser `DD/MM/YYYY`, pero antes de llamar a `RepoLifePolicy` deben convertirse a fecha/hora ISO. La hora técnica debe ser la definida por el ambiente y la zona horaria de negocio.

### 4.2 Datos del vehículo

El vehículo se registra dentro del formulario del objeto asegurado `DTAUT`, no como propiedades individuales de `LifePolicy`.

| Campo de negocio | Campo del formulario | Tipo recomendado | Observación |
|---|---|---|---|
| Serie de chasis | `tbseriechasis` | string | Texto |
| Número de préstamo | `tbnumprestamo` | string | Texto; puede ser vacío |
| Marca | `cmbMarca` | string | Código de marca proporcionado por el integrador |
| Serie de motor | `tbseriemotor` | string | Texto |
| Tipo | `cmbtipo` | string | Código de tipo proporcionado por el integrador |
| Modelo | `cmbModelo` | string | Código de modelo proporcionado por el integrador |
| Placa | `tbplaca` | string | Texto |
| Uso del vehículo | `cmbUsoAuto` | string | Código de uso proporcionado por el integrador |
| Año | `txtAnioAuto` | string numérico | Año entero |
| VIN | `tbVIN` | string | Opcional según configuración |
| Tiene VIN | `cmbNoTieneVIN` | string | `No` si hay VIN; `Si` si no hay |
| Color | `txtColorAuto` | string | Texto |
| Transmisión | `txtTransmision` | string | Código/opción del formulario |
| Cilindros | `cmbCilindrosAuto` | string | Código/opción del formulario |
| Puertas | `txtPuertasAuto` | string numérico | Entero |
| Puestos | `txtPuestosAuto` | string numérico | Entero |
| Combustible | `cmbCombustibleAuto` | string | Código/opción del formulario |
| Valor del vehículo | `txtSA` | string decimal | Suma asegurada/valor del objeto |
| Descripción adicional | `tbextras` | string | Texto libre |
| Ubicación | `hiddenUbicacion` | string JSON | Ubicación serializada del asegurado |
| Datos de tarifa | `hiddenCobtar` | string JSON | Parámetros de tarifa por cobertura |

El formulario se obtiene dinámicamente mediante `RepoObjectDefinition`; por ello, el integrador debe usar el `objectDefinitionId` retornado y no asumir que el identificador numérico es permanente.

### 4.3 Coberturas

Las coberturas se envían en el arreglo `Coverages` de `RepoLifePolicy`. El integrador debe tomar la definición de cada cobertura desde `RepoProduct.configJson` y conservar al menos los atributos que el motor necesita:

```json
{
  "name": "<nombre>",
  "code": "12",
  "basic": false,
  "description": "<descripcion>",
  "mandatory": true,
  "limit": 0,
  "premium": 0,
  "deductible": 0,
  "insurability": "<valor_configurado>",
  "commercialName": "<nombre_comercial>",
  "internalBonus": false,
  "appliesTo": "<valor_configurado>",
  "number": 1,
  "restrictUserEdition": false,
  "minLimit": -1,
  "maxLimit": -1,
  "loading": 0,
  "extraPremium": 0,
  "internalPremium": 0,
  "periodicity": 0,
  "ofnCode": 0
}
```

Los valores `premium` y otros importes pueden iniciar en cero porque `QuotePolicy` los calcula y guarda. Las coberturas obligatorias del producto deben incluirse siempre.

Los parámetros de tarifa de las coberturas se almacenan en `hiddenCobtar`. La estructura puede variar según la configuración vigente:

```json
[
  { "coverageCode": "<coverageCode>", "<tariffField>": "<tariffValue>" },
  { "coverageCode": "<coverageCode>", "<tariffField>": "<tariffValue>" }
]
```

El nombre de cada propiedad de tarifa debe coincidir con el campo configurado para esa cobertura.

## 5. Comandos de consulta y preparación

Estos comandos permiten que el integrador obtenga los datos necesarios para construir el payload transaccional.

### 5.1 RepoProduct

Obtiene producto, ramo y configuración comercial/técnica.

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

Datos relevantes de la respuesta:

| Ruta | Tipo | Uso |
|---|---|---|
| `outData[0].id` | entero | Id del producto, si se requiere |
| `outData[0].lobCode` | string | Código del ramo configurado |
| `outData[0].configJson` | string JSON | `Main`, `Coverages`, `Premium`, periodicidades y configuración |

### Ejemplo de lectura del producto y construcción de la póliza

El integrador puede usar la respuesta del producto como fuente de configuración para construir `RepoLifePolicy`. El siguiente ejemplo es pseudocódigo JavaScript: los nombres entre `<...>` representan propiedades del sistema integrador.

```javascript
const productResponse = await executeCommand({
  cmd: "RepoProduct",
  data: {
    operation: "GET",
    filter: "code = '<productCode>'",
    noTracking: true
  }
});

const productRow = productResponse.outData[0];
const productConfig = JSON.parse(productRow.configJson || "{}");
const main = productConfig.Main || {};

const selectedCoverages = productConfig.Coverages
  .filter(coverage => selectedCoverageCodes.includes(String(coverage.code)))
  .map(coverage => ({
    name: coverage.name,
    code: String(coverage.code),
    basic: coverage.basic,
    description: coverage.description,
    mandatory: coverage.mandatory,
    limit: coverage.limit ?? 0,
    premium: 0,
    deductible: coverage.deductible ?? 0,
    insurability: coverage.insurability,
    commercialName: coverage.commercialName,
    internalBonus: coverage.internalBonus ?? false,
    appliesTo: coverage.appliesTo,
    number: coverage.number,
    restrictUserEdition: coverage.restrictUserEdition,
    minLimit: coverage.minLimit ?? -1,
    maxLimit: coverage.maxLimit ?? -1,
    loading: 0,
    extraPremium: 0,
    internalPremium: 0,
    periodicity: 0,
    ofnCode: 0
  }));

const policyEntity = {
  currency: main.currency || "<currency>",
  policyType: "I",
  lob: String(productRow.lobCode),
  segment: removeCompanyPrefix(main.segment),
  channel: removeCompanyPrefix(main.channel),
  branchCode: "<branchCode>",
  holderId: "<insuredId>",
  payerId: "<insuredId>",
  insuredSum: "<insuredSum>",
  start: "<startDateTimeIso>",
  end: "<endDateTimeIso>",
  duration: "<durationYears>",
  durationMonths: "<durationMonths>",
  durationDays: "<durationDays>",
  periodicity: "<periodicity>",
  paymentMethod: "<paymentMethod>",
  installmentSchemeId: "<installmentSchemeId>",
  cessionBeneficiary: "<creditorIdOrNull>",
  masterCode: main.masterCode || "<productCode>",
  productCode: "<productCode>",
  MainInsured: "<mainInsuredObject>",
  Insureds: ["<mainInsuredObject>"],
  Beneficiaries: [],
  Surcharges: [],
  Exclusions: [],
  Coinsureds: [],
  Clauses: [],
  Coverages: selectedCoverages
};

const createResponse = await executeCommand({
  cmd: "RepoLifePolicy",
  data: { operation: "ADD", entity: policyEntity }
});

const policyId = createResponse.outData[0].id;
const processId = createResponse.outData[0].processId;
```

La propiedad `configJson` debe tratarse como JSON serializado. Los valores de `Main` y de cada cobertura deben conservarse, salvo los campos que el motor espera completar durante la cotización.

### 5.2 RepoObjectDefinition

Obtiene la definición del objeto asegurado y su formulario.

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

Datos relevantes:

| Ruta | Tipo | Uso |
|---|---|---|
| `outData[0].id` | entero | `objectDefinitionId` de `RepoInsuredObject` |
| `outData[0].code` | string | Debe ser `DTAUT` |
| `outData[0].Form.json` | string JSON | Plantilla de campos del formulario |

### 5.3 GetContacts

Obtiene la información completa del asegurado que se incluirá en `MainInsured` e `Insureds`.

```json
{
  "cmd": "GetContacts",
  "data": {
    "filter": "id=<insuredId>"
  }
}
```

`filter` es string. El contacto debe existir antes de crear la póliza.

### 5.4 RepoContactAddress

Obtiene la dirección del asegurado para construir `hiddenUbicacion`.

```json
{
  "cmd": "RepoContactAddress",
  "data": {
    "operation": "GET",
    "filter": "contactId=<insuredId>",
    "noTracking": true
  }
}
```

Con la primera dirección se puede construir un JSON como:

```json
{
  "pais": { "codigo": "<codigo>", "descripcion": "<nombre>" },
  "provincia": { "codigo": "<codigo>", "descripcion": "<nombre>" },
  "ciudad": { "codigo": "<codigo>", "descripcion": "<nombre>" },
  "corregimiento": { "codigo": "<codigo>", "descripcion": "<nombre>" },
  "direccion": "<direccion>"
}
```

El integrador puede consultar los repositorios de ubicación para completar descripciones. Si no necesita ubicación, puede enviar `hiddenUbicacion` vacío, siempre que el formulario y la configuración lo permitan.

### 5.5 Resolución del convenio de cuotas

El código del convenio se obtiene de la configuración del producto. El integrador debe resolver el identificador mediante el repositorio de convenios habilitado en el ambiente y enviar ese identificador en `installmentSchemeId`. Este flujo no requiere SQL ni `DoQuery`.

Si el ambiente no expone un repositorio de convenios, debe solicitarse ese contrato antes de iniciar la implementación; no se debe incorporar SQL específico del ambiente como dependencia de la integración.

## 6. Comandos transaccionales para crear y emitir

### 6.1 RepoLifePolicy ADD

Crea la oferta/póliza y devuelve el `policyId` y `processId` que se usarán en los pasos siguientes.

```json
{
  "cmd": "RepoLifePolicy",
  "data": {
    "operation": "ADD",
    "entity": {
      "currency": "USD",
      "Beneficiaries": [],
      "Surcharges": [],
      "Exclusions": [],
      "Coinsureds": [],
      "Clauses": [],
      "policyType": "I",
      "indexation": "<indexation>",
      "lob": "<lob>",
      "segment": "<segmento>",
      "channel": "<canal>",
      "branchCode": "<branchCode>",
      "holderId": "<insuredId>",
      "payerId": "<insuredId>",
      "receiptTypeCode": "<receiptTypeCode>",
      "MainInsured": { "id": "<newInsuredId>", "contactId": "<insuredId>", "name": "<insuredName>", "relationship": "<relationship>", "Contact": "<contact>", "lifePolicyId": "<newPolicyId>", "role": "<role>" },
      "Insureds": [{ "id": "<newInsuredId>", "contactId": "<insuredId>", "name": "<insuredName>", "relationship": "<relationship>", "Contact": "<contact>", "lifePolicyId": "<newPolicyId>", "role": "<role>" }],
      "insuredSum": "<insuredSum>",
      "start": "<startDateTimeIso>",
      "end": "<endDateTimeIso>",
      "duration": "<durationYears>",
      "durationMonths": "<durationMonths>",
      "durationDays": "<durationDays>",
      "coinsurance": "<coinsurance>",
      "groupCoverageType": "DIFFERENT",
      "paymentDuration": "<paymentDuration>",
      "periodicity": "<periodicity>",
      "paymentMethod": "<paymentMethod>",
      "installmentSchemeId": "<installmentSchemeId>",
      "cessionBeneficiary": "<creditorIdOrNull>",
      "masterCode": "<masterCode>",
      "commercial": "<configuracion_comercial>",
      "version": "<version>",
      "option": "<option>",
      "indexationPeriod": "<indexationPeriod>",
      "indexationStart": "<indexationStart>",
      "indexationFrequency": "<indexationFrequency>",
      "productCode": "<productCode>",
      "Coverages": "<coverageArray>"
    }
  }
}
```

Tipos y reglas principales:

| Campo | Tipo JSON | Regla |
|---|---|---|
| `currency`, `lob`, `segment`, `channel`, `branchCode` | string | Valores de configuración/catálogo |
| `holderId`, `payerId`, `cessionBeneficiary` | entero o null | Ids de contacto |
| `insuredSum` | number decimal | Valor del vehículo/suma asegurada |
| `start`, `end` | string | ISO 8601 |
| `duration`, `durationMonths`, `durationDays` | entero | Componentes de la vigencia |
| `periodicity`, `paymentMethod` | string | Códigos de catálogos |
| `installmentSchemeId` | entero o null | Id del convenio de pago |
| `MainInsured`, `Insureds` | objeto/arreglo | Referencias al contacto asegurado |
| `Coverages` | arreglo | Definiciones de las coberturas |

El integrador debe conservar la respuesta. El identificador de la póliza es `outData[0].id` y debe guardarse como `policyId`. El identificador del workflow se recupera directamente de `outData[0].processId` y debe guardarse como `processId` o `procesoId` en el sistema integrador.

Si la respuesta de `RepoLifePolicy ADD` no incluye `processId`, debe consultarse inmediatamente con `LoadEntity` usando el id retornado:

```json
{
  "cmd": "LoadEntity",
  "data": {
    "entity": "LifePolicy",
    "filter": "id=<policyId>",
    "fields": "id, processId",
    "noTracking": true
  }
}
```

El valor de `outData.processId` de esta consulta es el `processId` que se envía en `GotoStep` y en las consultas de estado del workflow.

## 6. Valores por defecto utilizados por el flujo

Estos valores no se obtienen de un catálogo externo en el momento de construir el payload:

| Campo | Valor por defecto | Cuándo aplica |
|---|---|---|
| `receiptTypeCode` | `"1"` | Cuando el contacto no tiene `receiptTypeCode` informado |
| `periodicity` | `"m12"` | Cuando el producto no tiene periodicidad ni periodicidad por defecto configurada |
| `cessionBeneficiary` | `null` | Cuando no existe acreedor/cesionario |
| `Beneficiaries` | `[]` | Cuando no se envían beneficiarios |
| `Surcharges` | `[]` | Cuando no se envían recargos |
| `Exclusions` | `[]` | Cuando no se envían exclusiones |
| `Coinsureds` | `[]` | Cuando no se envían coasegurados |
| `Clauses` | `[]` | Cuando no se envían cláusulas |

El valor `"m12"` se interpreta como periodicidad anual. Si el producto define una periodicidad válida, esa configuración tiene prioridad. No existe un valor por defecto equivalente para sucursal, forma de pago, asegurado, suma asegurada, coberturas ni parámetros de tarifa; esos datos deben ser proporcionados por el integrador.

### 6.2 RepoInsuredObject ADD para DTAUT

Guarda el vehículo y sus datos de tarifa.

```json
{
  "cmd": "RepoInsuredObject",
  "data": {
    "operation": "ADD",
    "entity": {
      "lifePolicyId": "<policyId>",
      "objectDefinitionId": "<dtautObjectDefinitionId>",
      "jValues": "<serializedDtautForm>"
    }
  }
}
```

`lifePolicyId` y `objectDefinitionId` son enteros. `jValues` es un string que contiene el arreglo JSON completo retornado por `RepoObjectDefinition.outData[0].Form.json`, con los campos rellenados en `userData`.

El cuerpo completo de `jValues` debe conservar todos los campos del formulario `DTAUT`. La siguiente estructura muestra todos los campos utilizados por el formulario de auto; los valores deben ser reemplazados por las propiedades del sistema integrador:

```json
[
  { "name": "tbseriechasis", "userData": ["<chassisSerial>"] },
  { "name": "tbnumprestamo", "userData": ["<loanNumber>"] },
  { "name": "cmbMarca", "userData": ["<brandCode>"] },
  { "name": "tbseriemotor", "userData": ["<engineSerial>"] },
  { "name": "cmbtipo", "userData": ["<vehicleTypeCode>"] },
  { "name": "cmbModelo", "userData": ["<modelCode>"] },
  { "name": "tbplaca", "userData": ["<licensePlate>"] },
  { "name": "cmbUsoAuto", "userData": ["<vehicleUseCode>"] },
  { "name": "txtAnioAuto", "userData": ["<vehicleYear>"] },
  { "name": "tbVIN", "userData": ["<vin>"] },
  { "name": "cmbNoTieneVIN", "userData": ["<hasNoVin>"] },
  { "name": "txtColorAuto", "userData": ["<color>"] },
  { "name": "txtTransmision", "userData": ["<transmissionCode>"] },
  { "name": "cmbCilindrosAuto", "userData": ["<cylinderCode>"] },
  { "name": "txtPuertasAuto", "userData": ["<doorCount>"] },
  { "name": "txtPuestosAuto", "userData": ["<seatCount>"] },
  { "name": "cmbCombustibleAuto", "userData": ["<fuelCode>"] },
  { "name": "txtSA", "userData": ["<insuredSum>"] },
  { "name": "tbextras", "userData": ["<additionalDescription>"] },
  { "name": "hiddenCobtar", "userData": ["<serializedCoverageTariffData>"] },
  { "name": "hiddenUbicacion", "userData": ["<serializedInsuredLocation>"] }
]
```

`jValues` debe ser un string JSON válido. No se debe enviar solo un subconjunto ni cambiar los nombres de los campos. La forma más segura de construirlo es tomar el arreglo completo de `RepoObjectDefinition.outData[0].Form.json`, conservar su metadata y actualizar únicamente `userData`.

### Ejemplo de construcción de hiddenCobtar

`hiddenCobtar` es un string que contiene un arreglo JSON. Cada entrada representa una cobertura que tiene parámetros de tarifa. El nombre de cada propiedad adicional debe coincidir con el campo configurado para esa cobertura.

```javascript
const tariffRows = selectedCoverages
  .filter(coverage => tariffConfiguration[coverage.code])
  .map(coverage => {
    const fields = tariffConfiguration[coverage.code];
    const row = {
      coverageCode: String(coverage.code),
      coverageName: coverage.name
    };

    fields.forEach(field => {
      const value = tariffValues[coverage.code]?.[field.name];
      row[field.name] = value ?? null;
    });

    return row;
  });

const hiddenCobtar = JSON.stringify(tariffRows);
```

El contenido lógico antes de serializar tendría esta forma:

```json
[
  {
    "coverageCode": "<coverageCode>",
    "coverageName": "<coverageName>",
    "<tariffFieldName>": "<tariffFieldValue>"
  }
]
```

Después se asigna al campo del formulario:

```javascript
formFieldByName("hiddenCobtar").userData = [hiddenCobtar];
const serializedDtautForm = JSON.stringify(dtautForm);
```

Si una cobertura no tiene campos de tarifa, no se agrega una fila artificial. Si un campo configurado no tiene valor, se conserva como `null` solo cuando el contrato de ese campo lo permita; de lo contrario debe rechazarse antes de crear la póliza.

### 6.3 GotoStep

Avanza el workflow asociado a la póliza.

```json
{
  "cmd": "GotoStep",
  "data": {
    "procesoId": "<processId>",
    "estado": "_next"
  }
}
```

Tipos: `procesoId` entero y `estado` string. El primer avance aplica los valores por defecto. Después de cotizar, el integrador debe repetir el llamado hasta llegar al estado configurado para emisión, que en el flujo de referencia es `Borrador de Póliza`.

### 6.4 QuotePolicy

Ejecuta la tarificación y guarda los resultados.

```json
{
  "cmd": "QuotePolicy",
  "data": {
    "policyId": "<policyId>",
    "dbMode": true,
    "save": true,
    "action": "QUOTE"
  }
}
```

Tipos: `policyId` entero, `dbMode` boolean, `save` boolean y `action` string.

Después de este comando, el integrador puede consultar la póliza con `RepoLifePolicy GET` incluyendo `Coverages` para leer las primas calculadas:

```json
{
  "cmd": "RepoLifePolicy",
  "data": {
    "operation": "GET",
    "filter": "id=<policyId>",
    "include": ["Coverages"],
    "noTracking": true
  }
}
```

La respuesta debe revisarse para confirmar que la prima total sea positiva y que las coberturas tarifables tengan prima válida. El motor puede dejar en cero una cobertura configurada con prima cero por diseño.

### 6.5 IssuePolicy

Emite la póliza después de que la cotización y el workflow estén completos.

```json
{
  "cmd": "IssuePolicy",
  "data": {
    "policyId": "<policyId>"
  }
}
```

`policyId` es entero. La respuesta `ok=true` no sustituye la verificación final del estado de la póliza.

### 6.6 LoadEntity para verificar emisión

Consulta el estado final de la póliza:

```json
{
  "cmd": "LoadEntity",
  "data": {
    "entity": "LifePolicy",
    "filter": "id=<policyId>",
    "fields": "id, code, active, entityState",
    "noTracking": true
  }
}
```

La emisión se considera completada cuando la respuesta contiene el número de póliza (`code`) y `active=true`.

Para consultar el estado del workflow:

```json
{
  "cmd": "LoadEntity",
  "data": {
    "entity": "Proceso",
    "filter": "id=<processId>",
    "fields": "id, estado",
    "noTracking": true
  }
}
```

### 6.7 Ejemplo completo de emisión en ambiente de pruebas

El siguiente ejemplo muestra una ejecución completa con datos de prueba. Los identificadores de póliza y proceso corresponden a la respuesta del sistema; en una integración real deben tratarse como variables y nunca quedar fijos en el código.

#### 6.7.1 Configuración común

```http
POST https://sisos-api-iconx-latest.axxis-systems.net/int/cmd
Authorization: Bearer ${API_TOKEN}
X-Environment: ${ENVIRONMENT}
Content-Type: application/json
```

```javascript
const policyId = responseCreate.outData[0].id;
const processId = responseCreate.outData[0].processId;
const environment = "globaluat";
```

La póliza de prueba se creó para el producto `GLA`, ramo `6`, moneda `USD`, periodicidad `m`, medio de pago `ACH` y esquema de cuotas identificado por `installmentSchemeId: 7`. El cuerpo real debe construirse con los datos del integrador y con las coberturas que correspondan al riesgo.

#### 6.7.2 Crear la póliza

La solicitud usa `RepoLifePolicy` con `operation: ADD`. Los datos de contacto, fechas, suma asegurada, convenio de cuotas y coberturas se envían dentro de `entity`.

```json
{
  "cmd": "RepoLifePolicy",
  "data": {
    "operation": "ADD",
    "entity": {
      "currency": "USD",
      "policyType": "I",
      "lob": "6",
      "segment": "TRA",
      "channel": "CAN10",
      "branchCode": "0",
      "holderId": ${holderId},
      "payerId": ${payerId},
      "cessionBeneficiary": ${cessionBeneficiary},
      "paymentMethod": "ACH",
      "receiptTypeCode": "1",
      "insuredSum": ${insuredSum},
      "start": "${startIso}",
      "end": "${endIso}",
      "duration": 1,
      "durationMonths": 0,
      "durationDays": 0,
      "coinsurance": 0,
      "groupCoverageType": "DIFFERENT",
      "paymentDuration": 0,
      "periodicity": "m",
      "installmentSchemeId": 7,
      "masterCode": "GLA",
      "commercial": "AUTO GLA",
      "version": 1,
      "option": 1,
      "productCode": "GLA",
      "MainInsured": ${mainInsured},
      "Insureds": [${mainInsured}],
      "Coverages": ${coverages}
    }
  }
}
```

La respuesta de creación devolvió una póliza en estado `DRAFT`. En la ejecución de prueba, el sistema generó el `policyId` `5141`, el código `AU-GLA-000209` y el `processId` `9318`. Estos valores son ilustrativos de la respuesta y deben guardarse en variables.

```json
{
  "ok": true,
  "msg": "Record added",
  "outData": [
    {
      "id": ${policyId},
      "code": "${policyCode}",
      "entityState": "DRAFT",
      "active": false,
      "processId": ${processId}
    }
  ]
}
```

#### 6.7.3 Recuperar el processId cuando no viene en ADD

Si `RepoLifePolicy ADD` no devuelve `processId`, se consulta la póliza recién creada y se toma `outData[0].processId`.

```json
{
  "cmd": "LoadEntity",
  "data": {
    "entity": "LifePolicy",
    "filter": "id=${policyId}",
    "fields": "id, processId, code, entityState",
    "noTracking": true
  }
}
```

```javascript
const policy = response.outData;
const processId = policy.processId;
```

El mismo valor se utiliza en `GotoStep` y en las consultas de estado del workflow. No debe calcularse ni tomarse del id de la póliza.

#### 6.7.4 Agregar los objetos asegurados

Para el vehículo se envía `RepoInsuredObject` con el formulario completo en `jValues`. En la ejecución de prueba se agregaron dos objetos: el objeto técnico del automóvil con `objectDefinitionId: 41` y un objeto auxiliar con `objectDefinitionId: 49`. El `lifePolicyId` debe ser el id devuelto por `RepoLifePolicy ADD`.

```json
{
  "cmd": "RepoInsuredObject",
  "data": {
    "operation": "ADD",
    "entity": {
      "lifePolicyId": ${policyId},
      "objectDefinitionId": 41,
      "jValues": "${dtautFormJsonString}"
    }
  }
}
```

En `dtautFormJsonString` se conserva el arreglo completo de campos del formulario. Como mínimo, el objeto de prueba incluyó los campos técnicos del vehículo, los valores del vehículo, `hiddenCobtar` y `hiddenUbicacion`.

#### 6.7.5 Avanzar a cotización

Con la póliza y sus objetos creados, se avanza el proceso al siguiente estado:

```json
{
  "cmd": "GotoStep",
  "data": {
    "procesoId": ${processId},
    "estado": "_next"
  }
}
```

Luego se ejecuta la cotización:

```json
{
  "cmd": "QuotePolicy",
  "data": {
    "policyId": ${policyId},
    "dbMode": true,
    "save": true,
    "action": "QUOTE"
  }
}
```

La cotización calcula y guarda las primas de las coberturas. El integrador debe consultar nuevamente la póliza si necesita mostrar el detalle de primas, deducibles, impuestos o total.

#### 6.7.6 Avanzar hasta el estado que permite emitir

Después de cotizar, se consulta el proceso y se avanza con `_next` hasta llegar a `Borrador de Póliza`.

```javascript
let process = await getProcess(processId);
let attempts = 0;
while (process.estado !== "Borrador de Póliza" && attempts < 4) {
  await cmd("GotoStep", { procesoId: processId, estado: "_next" });
  process = await getProcess(processId);
  attempts += 1;
}
if (process.estado !== "Borrador de Póliza") {
  throw new Error(`Workflow detenido en ${process.estado}`);
}
```

Debe existir un límite de iteraciones y validación de errores. Nunca se debe avanzar indefinidamente si el proceso no cambia de estado.

#### 6.7.7 Emitir y verificar

Cuando el estado sea `Borrador de Póliza`, se envía:

```json
{
  "cmd": "IssuePolicy",
  "data": {
    "policyId": ${policyId}
  }
}
```

Finalmente, se verifica la póliza:

```json
{
  "cmd": "RepoLifePolicy",
  "data": {
    "operation": "GET",
    "filter": "id=${policyId}",
    "include": ["Coverages", "Insureds"],
    "noTracking": true
  }
}
```

La ejecución de prueba terminó con la siguiente información relevante:

```json
{
  "id": ${policyId},
  "code": "${policyCode}",
  "active": true,
  "entityState": "ACTIVE",
  "processId": ${processId},
  "processState": "Activa",
  "annualPremium": 481.51,
  "annualTotal": 510.40
}
```

La emisión se considera exitosa únicamente cuando `active` sea `true`, el estado de la póliza sea `ACTIVE` y el proceso se encuentre en `Activa`. El integrador debe registrar, como mínimo, `policyId`, `code`, `processId`, estado, prima y total devueltos por el sistema.

## 7. Estados y manejo de errores

Cada respuesta debe evaluarse por su indicador `ok` y por `msg` cuando exista.

Errores que el integrador debe manejar:

- producto, contacto, sucursal o catálogo inexistente;
- cobertura obligatoria ausente;
- formulario `DTAUT` inexistente o incompleto;
- VIN ya asegurado o duplicado, si el integrador implementa esa validación;
- fechas o duración fuera de la configuración del producto;
- suma asegurada inválida;
- parámetros de tarifa con tipo incorrecto;
- cotización con prima total cero;
- workflow detenido en un estado inesperado;
- emisión rechazada;
- póliza creada pero no activa.

Si `RepoLifePolicy ADD` fue exitoso y falla un paso posterior, existe una oferta/póliza preliminar. El integrador debe conservar el `policyId` para mostrar el error, reintentar de forma controlada o ejecutar el procedimiento de anulación correspondiente.

## 8. Ejemplo conceptual de implementación

```text
producto = RepoProduct GET usando productCode
definicion = RepoObjectDefinition GET DTAUT Form
asegurado = GetContacts GET
datos = códigos y valores preparados por el sistema integrador

entity = construir LifePolicy con producto, asegurado, pago, vigencia y Coverages
poliza = RepoLifePolicy ADD entity

formulario = rellenar DTAUT con datos del vehículo y hiddenCobtar
RepoInsuredObject ADD formulario

GotoStep _next
QuotePolicy QUOTE
RepoLifePolicy GET Coverages

GotoStep _next hasta Borrador de Póliza
IssuePolicy
LoadEntity LifePolicy
verificar active=true y guardar code
```

El sistema consumidor puede agregar sus propias validaciones, persistencia, reintentos y control transaccional.

## 9. Nota de implementación

Los nombres de los campos y comandos de esta guía corresponden al contrato técnico expuesto por SISos. La aplicación integradora debe mantener sus propios modelos, validaciones, persistencia y control de reintentos.

