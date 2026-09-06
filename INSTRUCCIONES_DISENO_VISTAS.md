# Instrucciones de diseño de vistas

## Bordes de pestañas y contenedores

- Usar bordes sutilmente más oscuros que el fondo para mejorar la separación visual.
- Aplicar el borde alrededor de cada pestaña y del contenedor principal de su contenido.
- Mantener el fondo, la tipografía, los iconos, los estados de los botones y la funcionalidad existentes.
- No modificar dimensiones, espaciados ni comportamiento de las grillas cuando el objetivo sea únicamente mejorar los bordes.
- Mantener el borde activo de la pestaña con el color principal de la vista para conservar la identificación de la pestaña seleccionada.
- Usar bordes discretos, evitando contrastes fuertes o estilos que hagan que la interfaz se vea pesada.
- Para pestañas tipo tarjeta de Ant Design, usar borde de `1px solid #cbd1d8`, esquinas superiores redondeadas de `6px 6px 0 0`, separación de `2px` y borde activo `#1677ff`; el borde inferior activo debe integrarse con el contenedor usando el fondo blanco.

## Grillas

- Aplicar un borde exterior sutil en el contenedor de la grilla.
- Usar un fondo ligeramente más oscuro en los encabezados para diferenciarlos del cuerpo.
- En las filas, eliminar los bordes verticales y conservar únicamente los bordes horizontales.
- Mantener siempre los bordes verticales de los encabezados para separar claramente las columnas.

## Referencia visual aprobada

- Usar bordes de `1px` y colores discretos para separar visualmente las secciones sin hacerlas pesadas.
- Las barras de botones deben usar fondo transparente, borde `1px solid #e6ebf2`, radio de `6px`, padding vertical de `10px` y horizontal de `12px`.
- Los botones secundarios o de reportes deben usar un borde ligeramente más oscuro, de referencia `#8f9aa7`.
- Los botones deshabilitados deben conservar un borde visible, de referencia `#6f7b88`, y no deben perder contraste por opacidad; usar `opacity: 1` cuando sea necesario.
- Las grillas deben usar un borde exterior de referencia `#cbd1d8` con grosor de `1px`.
- Los encabezados de las grillas deben usar un fondo sutilmente más oscuro, de referencia `#bfbfbf`, y conservar separadores verticales de `1px solid #cbd1d8`.
- Las filas deben conservar únicamente separadores horizontales de `1px solid #cbd1d8`, sin bordes verticales.
- Para grillas compactas, usar como referencia padding de `5px 8px`, fuente de `12px` y line-height de `18px`, salvo que el diseño requiera otra densidad.

## Barras de botones

- Aplicar el mismo tratamiento visual a las barras de botones de todas las pestañas de una vista.
- Las acciones principales de búsqueda o filtrado deben usar el estilo `primary` de Ant Design.
- Los botones de exportación deben usar un fondo verde suavizado, de referencia `#60b13d`, con borde `#4f9336` y texto blanco.
- Los botones de reportes deben usar un fondo rojo tipo Adobe PDF suavizado, de referencia `#dd603d`, con borde `#bd4d35` y texto blanco.
- Los botones secundarios, como actualizar o cancelar, deben conservar fondo neutro y un borde ligeramente más oscuro, de referencia `#8f9aa7`.
- Los botones deshabilitados deben mantener un borde visible, de referencia `#6f7b88`, y evitar una opacidad que los haga imperceptibles.
- Los botones de Filtrar o Buscar deben mostrar un icono de lupa de Ant Design.
- Los botones de Actualizar o Refrescar deben mostrar un icono de recarga de Ant Design.
- Mantener los iconos alineados con la etiqueta y conservar el estilo nativo de Ant Design.

## Status bar

- Usar como fondo estándar una gradiente horizontal: `linear-gradient(90deg, #e6f4ff 0%, #4096ff 100%)`.
- Usar texto blanco (`#fff`) para conservar el contraste sobre la gradiente.

## Estados de filas en grillas

- Aplicar los estados visuales de hover y selección a todas las grillas de la vista, incluidas las tablas anidadas o de detalle.
- Usar para el hover un azul suave basado en el color `primary` de Ant Design, con referencia `#b7d7ff`.
- Usar para la fila seleccionada un azul más intenso, con referencia `#86b4ff`.
- La selección debe prevalecer sobre el hover cuando el cursor esté sobre una fila seleccionada.
- Cubrir tanto la selección nativa de Ant Design mediante `.ant-table-row-selected` como la selección personalizada mediante clases propias, por ejemplo `.cashier-supervisor-selected-row`.
- Mantener el cursor tipo mano en las filas que puedan seleccionarse.
- Aplicar los colores con prioridad suficiente para evitar que los estilos predeterminados de Ant Design o de una tabla específica oculten el estado visual.

## Montos en grillas

- Aplicar un estilo visual general a todos los montos numéricos mostrados en celdas de grillas.
- Los montos positivos deben mostrarse en verde, usando como referencia `#237804`.
- Los montos negativos deben mostrarse en rojo, usando como referencia `#cf1322`.
- Los montos iguales a cero deben mostrarse en negro, usando como referencia `#262626`, con peso de fuente normal.
- El color debe aplicarse únicamente al contenido visual de la celda; no modificar los valores ni las reglas de cálculo.
- Mantener separado el formateo numérico existente, incluyendo separadores de miles y decimales, del estilo por signo.
- No aplicar este estilo automáticamente a campos editables, botones, totales especiales o textos que no representen montos de una grilla, salvo que el diseño lo solicite expresamente.

## Espaciado de grillas

- Cuando una pestaña use un `Card` como contenedor de la grilla, usar `padding: 4px` en el cuerpo del card para reducir el espacio entre la grilla y el contenedor.
- Mantener intactos los bordes del card, de la grilla y de sus encabezados al ajustar este espaciado.
- Aplicar el mismo espaciado a todas las pestañas equivalentes de la vista para conservar un comportamiento visual uniforme.
- Al aplicar el padding, no asumir que el `Card` es hijo directo del contenedor de la pestaña; contemplar envoltorios funcionales como `Spin` para que todas las pestañas reciban el mismo espaciado.

## Tipografía

- Usar `13px` como tamaño base para el contenido general de la vista, salvo títulos o controles con una jerarquía visual propia.
- Usar `12px` en encabezados y filas de grillas compactas.
- Usar `line-height: 18px` en encabezados y filas de grillas compactas para mantener una densidad uniforme.
- Mantener los tamaños especiales existentes de títulos, botones, iconos y formularios cuando formen parte de su jerarquía visual.

## Topbar de acciones

- Usar un panel de acciones con bordes cuadrados, sin padding lateral propio; mantener una separación visual de `4px` a la izquierda del grupo inicial y de `4px` a la derecha de los controles alineados al extremo derecho.
- Usar `padding: 4px 0` para que el panel sea apenas más grueso que los botones y estos queden centrados verticalmente.
- Compensar el padding del `Card` contenedor cuando sea necesario para eliminar el espacio superior y lateral alrededor del topbar.
- Mantener una separación izquierda de `4px` para el grupo de botones.
- Mantener una separación derecha de `4px` para los controles alineados al extremo derecho del topbar, equivalente a la separación izquierda del grupo inicial.
- Mantener una separación inferior de `2px` entre el topbar y la grilla.
- Aplicar estas reglas de espaciado de forma uniforme en todas las pestañas de la vista.

## Layout y uso del viewport

- Las vistas tabulares deben ocupar el ancho y alto disponible de la ventana del navegador.
- Evitar el scroll vertical de la página principal. El scroll vertical debe existir únicamente dentro del cuerpo de la grilla cuando los registros superen el espacio disponible.
- Construir el layout principal con un contenedor flexible (`display: flex`, normalmente en dirección de columna) y aplicar `min-height: 0` a los contenedores flexibles que incluyan grillas.
- La grilla debe crecer dinámicamente para ocupar todo el espacio restante después del encabezado, la barra de contexto, las pestañas, el topbar, los filtros y la paginación.
- No utilizar alturas fijas pequeñas para limitar la grilla. Si se requiere un cálculo explícito, usar la altura disponible del viewport, por ejemplo `100dvh` o `calc(100dvh - [espacio ocupado por la interfaz])`, sin exceder el límite inferior visible.
- Mantener la paginación, los totales y los indicadores de registros visibles dentro del área de la vista, sin quedar ocultos por el crecimiento de la grilla.
- El contenedor exterior de la vista debe usar `overflow: hidden` cuando corresponda para impedir que el contenido genere scroll en toda la ventana.
- El contenedor del contenido de la pestaña y el cuerpo de la grilla deben poder crecer y reducirse con `flex: 1 1 auto` y `min-height: 0`.
- Al cambiar de pestaña, cargar datos, aplicar filtros o cambiar el tamaño de la ventana, conservar el cálculo dinámico del alto disponible y evitar espacios vacíos innecesarios.
- Si se requiere recalcular dimensiones por cambios del navegador o del contenedor, usar un mecanismo reactivo como `ResizeObserver` o un listener de resize correctamente registrado y limpiado.
- El scroll horizontal debe habilitarse únicamente cuando el ancho total de las columnas lo requiera. No reducir la grilla ni crear scroll vertical de la página para resolver un desbordamiento horizontal.
- El comportamiento del scroll debe ser estable: no debe aparecer y desaparecer al cargar datos, cambiar de pestaña o mover el cursor. Mantener el área de scroll de la grilla definida desde el inicio cuando el diseño lo requiera.
- Una grilla vacía debe conservar su estructura visual, borde, encabezados y altura disponible, aunque todavía no tenga registros cargados.
- Las máscaras de carga y los mensajes de error deben renderizarse dentro del área de contenido correspondiente, sin expandir el documento ni bloquear innecesariamente toda la ventana.
- Estos ajustes son exclusivamente de presentación y layout; no deben modificar consultas, comandos, filtros, paginación ni reglas de negocio salvo solicitud expresa.

## Aplicación en vistas con pestañas

- Todas las pestañas de una misma vista deben compartir el mismo contenedor, espaciado, tipografía, tratamiento de bordes y estrategia de expansión vertical.
- Las pestañas que dependan de una selección pueden permanecer deshabilitadas hasta contar con la selección requerida, pero su estructura no debe provocar scroll adicional en la ventana.
- Los paneles laterales de filtros deben ocupar únicamente el espacio necesario y no reducir permanentemente el área vertical disponible para la grilla principal.
- En vistas como `Cashier`, `CashierSupervisor` y `HistoricalBilling`, la grilla debe expandirse hasta el límite inferior disponible y el scroll de registros debe quedar confinado a la grilla.
- Al volver a una pestaña previamente visitada, reutilizar los datos ya cargados cuando corresponda y conservar el tamaño dinámico de la grilla; recargar únicamente cuando cambie la selección, la búsqueda o se solicite una actualización.
