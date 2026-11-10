# Conexión API SISOS

## Endpoint

```text
https://sisos-api-iconx-latest.axxis-systems.net/int/cmd
```

## Entorno

Header requerido:

```http
X-Environment: globaluat
```

## Autenticación

Header requerido:

```http
Authorization: Bearer sisos_ak_AOKTKsrGtdbY1deeO12uRKQFEcFla9n04ZbDn1WU92UJRr9B2Jl83ZKu9ppFvELd
```

## Content-Type

```http
Content-Type: application/json
```

## Estructura general de la solicitud

```json
{
  "cmd": "NombreDelComando",
  "data": {
    "parametro": "valor"
  }
}
```

## Nota de seguridad

Este archivo contiene un token de acceso en texto plano. No debe publicarse, compartirse ni confirmarse en un repositorio. Si el proyecto utiliza control de versiones, agregar este archivo al `.gitignore` o reemplazar el token por una variable de entorno.
