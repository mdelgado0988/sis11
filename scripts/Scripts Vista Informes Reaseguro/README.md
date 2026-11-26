# Vista de Informes de Reaseguro

## Formulario

- `reaInformesEXT.aspx`
- `reaInformesEXT.aspx.vb`

## Clases y bibliotecas

- `Class1.vb`: contiene la clase `VG`, utilizada por el formulario para sesión y usuario.
- `Notificacion.vb`: mensajes y notificaciones del formulario.
- `sis3.emision.dll`: contiene `sis3.Emision.Reaseguro.Informes`.
- `sis3.dll`: dependencia de la biblioteca de emisión.
- `sis3.emision.xml`: documentación de la biblioteca compilada.

## Alcance

Se incluyen las dependencias de Pólizas Vigentes, Cúmulos y Perfil de Cartera. Borderó de Reaseguro queda fuera del alcance.

## Procedimientos principales

- `dbo.spRea_Polizas_Vigentes`
- `dbo.spRea_Cumulos`
- `dbo.spRea_Perfil_Cartera`

## Funciones SQL

- `dbo.fn_getCoberPrinUpgrade`
- `dbo.fn_getCoberPrin`

## Tablas y objetos de datos usados por los procedimientos

- `adpoliza`
- `Esta_SumasPol`
- `Esta_SumasCob` (usada por la salida con coberturas, fuera del alcance actual)
- `maplanes`
- `maentes`
- `maentes_ext`
- `mapaises`
- `maestados`
- `maciudades`
- `macorregi`
- `mabarriada`
- `macodigos`
- `malimites_perfil`
- `maramos`
- `mainsta_dat`
- `matiprie`
- `Proyectos`

Los scripts de procedimientos y funciones se encuentran en la carpeta `SQL`. Las tablas anteriores son dependencias de datos existentes en `GlobalSIS_AG01`; no se incluyen scripts destructivos de creación o modificación de tablas.
