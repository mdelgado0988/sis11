# Estandares del proyecto Global

## Ubicacion y edicion

- Trabajar siempre sobre el proyecto local y respetar la carpeta solicitada por el usuario.
- Usar `apply_patch` para ediciones manuales.
- No revertir cambios existentes del usuario ni usar comandos destructivos como `git reset --hard` o `git checkout --`.
- Revisar primero el archivo y su contexto antes de modificarlo.
- Ejecutar una validacion posterior al cambio, como `git diff --check` y la prueba disponible del proyecto.

## Vistas JSX

- No usar el operador `??` en vistas ni en archivos `.jsx`.
- Usar validaciones explicitas contra `undefined` y `null` y valores por defecto compatibles con la sintaxis soportada.
- Mantener React funcional con Hooks y usar Ant Design segun los patrones existentes.
- Usar iconos de Ant Design en botones y pestanas; no reemplazarlos por iconos improvisados si existe un icono equivalente.
- Mantener el layout con Flexbox cuando se requiera un comportamiento tipo BorderLayout; evitar `position: absolute` para estructurar la vista.
- Mantener las vistas responsive, con el scroll en la region correspondiente y sin generar scroll innecesario en toda la pagina.
- Mantener paginacion remota cuando la consulta lo soporte; si el detalle se carga dentro de un maestro, paginarlo o limitarlo para evitar filas descontroladas.
- Para nuevas vistas, mantener titulos y etiquetas en ingles y traducir mediante `t()`.
- Mantener los mensajes visibles al usuario en ingles cuando pertenezcan a la vista y usar `t()`; los mensajes de negocio en comandos deben conservar acentos normales y nunca presentar texto corrupto.
- No modificar el diseno ni la logica de formularios dinamicos originales. Renderizar respetando `json`, `className`, `row-*`, `col-md-*`, campos requeridos y su `logic`.
- Los formularios dinamicos deben permanecer separados por pestana o instancia, conservar sus valores y validar todos los campos requeridos, incluso los de una pestana no visible; activar esa pestana al detectar el error.

## Comandos y cadenas

- Ubicar los comandos en la carpeta de cadenas configurada para el proyecto.
- Agregar encabezado estandar en ingles con autor, correo, fecha, version y proposito.
- Mantener los comentarios internos de codigo en ingles.
- Validar fuertemente entradas, objetos, arreglos, identificadores numericos y respuestas de repositorios antes de usarlos.
- Proteger los comandos contra valores `null`, `undefined`, cadenas vacias, tipos invalidos y divisiones entre cero.
- Usar `noTracking: true` en `LoadEntity` y `LoadEntities`, salvo que exista una razon explicita para no hacerlo.
- Cuando se use `ExeChain`, leer y validar el resultado retornado por `ExeChain.outData`; no asumir que la salida esta disponible en una variable asignada directamente.
- Preferir operaciones `GET` para leer y `SET`/`ADD` solo cuando corresponda. Asignar el resultado de cada lectura a una variable con nombre claro.
- No dejar funciones, variables, consultas, `log()` o `debugger` sin uso. Comentar los `log()` solo cuando se solicite conservar evidencia temporal.
- No borrar ni crear entidades cuando el requerimiento indique que solo se deben actualizar.
- Antes de persistir en loops, validar toda la operacion cuando sea posible y considerar transacciones o mecanismos atomicos del framework.
- Mantener los `return` de comandos consistentes con `ok` y `msg`, agregando `merge` u otros datos solo cuando sean necesarios para el flujo.

## SQL y repositorios

- Escapar cualquier texto antes de interpolarlo en filtros SQL y validar los identificadores numericos como numeros positivos.
- Agrupar condiciones compuestas con parentesis para preservar la precedencia entre `AND` y `OR`.
- No usar nombres reservados de SQL sin delimitarlos; por ejemplo, usar `[end]` cuando corresponda.
- Respetar los nombres reales de columnas y propiedades, incluyendo diferencias como `anualPremium`/`anualTotal`.
- Cuando se consulte `GetTable`, tomar los encabezados de la primera fila y mapear el resto de las filas a objetos.
- Cuando un repositorio retorne un arreglo, validar siempre que sea un arreglo antes de usar `map`, `filter` o `reduce`.
- Para consultas paginadas, mantener alineados el filtro principal, el conteo total, la pagina y el tamano de pagina.

## Fechas y montos

- Las fechas UTC deben convertirse explicitamente a la hora local de Panama antes de extraer una fecha de negocio.
- Las fechas persistidas se deben evaluar y comparar siempre en UTC. Cuando un usuario seleccione una fecha de calendario en Panama, convertir el inicio de ese dia a `05:00:00Z` y usar como limite superior exclusivo las `05:00:00Z` del dia siguiente; no depender de la zona horaria del navegador, servidor o entorno de ejecucion.
- La presentacion al usuario debe respetar la zona horaria local del navegador y nunca debe alterar el valor UTC persistido.
- No reinterpretar fechas simples `yyyy-MM-dd` como UTC si el negocio espera conservar ese mismo dia local.
- Respetar las horas originales cuando el calculo requiera fecha y hora.
- Formatear fechas visuales segun el requerimiento de la vista o reporte y no alterar el valor persistido solo por presentacion.
- Redondear montos a dos decimales solo en los puntos definidos por la regla de negocio; evitar redondeos intermedios que alteren los totales.
- Validar signos de importes y no usar `abs` para ocultar un signo que tenga significado contable.
- Evitar divisiones entre cero y ajustar diferencias residuales en la ultima linea cuando la regla de negocio lo indique.

## Formularios y controles

- Los controles requeridos deben actualizar tambien su estilo visual cuando la regla de requerido cambie dinamicamente.
- Para campos con catalogos, cargar primero las opciones y luego asignar el valor seleccionado; no asumir que el valor se conserva automaticamente.
- Para autocompletes, filtrar con el criterio solicitado, normalmente prefijo `texto%`, y mostrar plantillas con el nombre, identificacion e id cuando corresponda.
- No seleccionar automaticamente una opcion salvo que exista una sola opcion y el requerimiento lo permita.
- Los botones de acciones destructivas o financieras deben confirmar la operacion y validar el estado antes de ejecutarse.
- Deshabilitar acciones dependientes de una seleccion cuando no exista una caja, poliza o registro seleccionado.

## Traduccion y codificacion

- Corregir acentos y mensajes en espanol usando codificacion normal; nunca introducir cadenas corruptas.
- En vistas, mantener las etiquetas fuente en ingles y traducir con `t()` de acuerdo con el estandar de las vistas existentes.
- Documentar reglas especiales de negocio en comentarios claros y breves.
