/**
 * @author aiden_mission_configurator
 * @created 2026-10-31
 * @name CLPagos
 * @version 1.0.0
 * @summary Clon de la vista nativa Administracion > Salida de dinero > Pagos (#/payments): mismos campos,
 *          columnas, filtros, acciones, ventanas y comandos nativos que los componentes Payments,
 *          PaymentFilter, PaymentData, ManualPaymentRequest, MergePayments, PaymentDocuments y TaxField
 *          (con los componentes compartidos que usan) del front 11.3.41.
 * @issue   MSN-000096 / AXX-6720 (global1)
 *
 * Alcance pedido: solo esta vista. No crea comandos, cadenas, triggers, campos ni menus, y no modifica
 * la vista nativa. Llama unicamente los comandos que llama la vista nativa y lee la misma configuracion
 * (Payment.bulkActions, hiddenColumns, templates, defaultValues, customFormId, readOnlyBeneficiary,
 * editableTaxTypes, Claim.paymentMethods y las reglas de campos de ClaimPayment).
 *
 * Notas de plataforma (no borrar):
 *  - Motor react-live 2.4.1 -> buble 0.19.6: sin arrow async, sin ?. ni ??, sin fragmentos <>, sin
 *    entidades HTML en JSX, sin campos de clase y sin spread de Set (buble lo traduce a concat).
 *  - El scope no trae @ant-design/icons, @ant-design/compatible (Form.create / rc-form), react-number-format,
 *    react-csv ni antd-table-saveas-excel: los iconos son los mismos SVG de antd; Form.create se replica con
 *    la semantica de rc-form 2.4.12 (registro al decorar, normalize en cada setFields, validacion required
 *    de async-validator, limpieza de campos no decorados); Money replica NumericFormat sobre Input; la
 *    descarga CSV replica CSVLink y la de Excel escribe el mismo libro.
 *  - Se abre en #/view/<id>. El equivalente de la ruta nativa #/payments/<paymentId> es
 *    #/view/<id>?paymentId=<paymentId>; sin parametro, la lista se carga al abrir como en #/payments.
 */
(function () {
    var Button = A.Button;
    var Checkbox = A.Checkbox;
    var message = A.message;
    var notification = A.notification;
    var Table = A.Table;
    var Dropdown = A.Dropdown;
    var Menu = A.Menu;
    var Drawer = A.Drawer;
    var Input = A.Input;
    var Select = A.Select;
    var DatePicker = A.DatePicker;
    var Tag = A.Tag;
    var InputNumber = A.InputNumber;
    var Tooltip = A.Tooltip;
    var Modal = A.Modal;
    var Empty = A.Empty;
    var Spin = A.Spin;
    var Popover = A.Popover;
    var Descriptions = A.Descriptions;
    var Progress = A.Progress;
    var Row = A.Row;
    var Col = A.Col;
    var Alert = A.Alert;
    var Space = A.Space;
    var AutoComplete = A.AutoComplete;
    var Text = A.Typography.Text;
    var useRef = React.useRef;
    var useMemo = React.useMemo;
    var useContext = React.useContext;
    var useLayoutEffect = React.useLayoutEffect;
    /* ---------- iconos: los mismos glifos outlined de @ant-design/icons ---------- */
    var ICON_PATHS = {"block":{"vb":"64 64 896 896","p":["M856 376H648V168c0-8.8-7.2-16-16-16H168c-8.8 0-16 7.2-16 16v464c0 8.8 7.2 16 16 16h208v208c0 8.8 7.2 16 16 16h464c8.8 0 16-7.2 16-16V392c0-8.8-7.2-16-16-16zm-480 16v188H220V220h360v156H392c-8.8 0-16 7.2-16 16zm204 52v136H444V444h136zm224 360H444V648h188c8.8 0 16-7.2 16-16V444h156v360z"]},"branches":{"vb":"64 64 896 896","p":["M740 161c-61.8 0-112 50.2-112 112 0 50.1 33.1 92.6 78.5 106.9v95.9L320 602.4V318.1c44.2-15 76-56.9 76-106.1 0-61.8-50.2-112-112-112s-112 50.2-112 112c0 49.2 31.8 91 76 106.1V706c-44.2 15-76 56.9-76 106.1 0 61.8 50.2 112 112 112s112-50.2 112-112c0-49.2-31.8-91-76-106.1v-27.8l423.5-138.7a50.52 50.52 0 0034.9-48.2V378.2c42.9-15.8 73.6-57 73.6-105.2 0-61.8-50.2-112-112-112zm-504 51a48.01 48.01 0 0196 0 48.01 48.01 0 01-96 0zm96 600a48.01 48.01 0 01-96 0 48.01 48.01 0 0196 0zm408-491a48.01 48.01 0 010-96 48.01 48.01 0 010 96z"]},"bulb":{"vb":"64 64 896 896","p":["M632 888H392c-4.4 0-8 3.6-8 8v32c0 17.7 14.3 32 32 32h192c17.7 0 32-14.3 32-32v-32c0-4.4-3.6-8-8-8zM512 64c-181.1 0-328 146.9-328 328 0 121.4 66 227.4 164 284.1V792c0 17.7 14.3 32 32 32h264c17.7 0 32-14.3 32-32V676.1c98-56.7 164-162.7 164-284.1 0-181.1-146.9-328-328-328zm127.9 549.8L604 634.6V752H420V634.6l-35.9-20.8C305.4 568.3 256 484.5 256 392c0-141.4 114.6-256 256-256s256 114.6 256 256c0 92.5-49.4 176.3-128.1 221.8z"]},"calculator":{"vb":"64 64 896 896","p":["M251.2 387H320v68.8c0 1.8 1.8 3.2 4 3.2h48c2.2 0 4-1.4 4-3.3V387h68.8c1.8 0 3.2-1.8 3.2-4v-48c0-2.2-1.4-4-3.3-4H376v-68.8c0-1.8-1.8-3.2-4-3.2h-48c-2.2 0-4 1.4-4 3.2V331h-68.8c-1.8 0-3.2 1.8-3.2 4v48c0 2.2 1.4 4 3.2 4zm328 0h193.6c1.8 0 3.2-1.8 3.2-4v-48c0-2.2-1.4-4-3.3-4H579.2c-1.8 0-3.2 1.8-3.2 4v48c0 2.2 1.4 4 3.2 4zm0 265h193.6c1.8 0 3.2-1.8 3.2-4v-48c0-2.2-1.4-4-3.3-4H579.2c-1.8 0-3.2 1.8-3.2 4v48c0 2.2 1.4 4 3.2 4zm0 104h193.6c1.8 0 3.2-1.8 3.2-4v-48c0-2.2-1.4-4-3.3-4H579.2c-1.8 0-3.2 1.8-3.2 4v48c0 2.2 1.4 4 3.2 4zm-195.7-81l61.2-74.9c4.3-5.2.7-13.1-5.9-13.1H388c-2.3 0-4.5 1-5.9 2.9l-34 41.6-34-41.6a7.85 7.85 0 00-5.9-2.9h-50.9c-6.6 0-10.2 7.9-5.9 13.1l61.2 74.9-62.7 76.8c-4.4 5.2-.8 13.1 5.8 13.1h50.8c2.3 0 4.5-1 5.9-2.9l35.5-43.5 35.5 43.5c1.5 1.8 3.7 2.9 5.9 2.9h50.8c6.6 0 10.2-7.9 5.9-13.1L383.5 675zM880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zm-36 732H180V180h664v664z"]},"carry-out":{"vb":"64 64 896 896","p":["M880 184H712v-64c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v64H384v-64c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v64H144c-17.7 0-32 14.3-32 32v664c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V216c0-17.7-14.3-32-32-32zm-40 656H184V256h128v48c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-48h256v48c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-48h128v584zM688 420h-55.2c-5.1 0-10 2.5-13 6.6L468.9 634.4l-64.7-89c-3-4.1-7.8-6.6-13-6.6H336c-6.5 0-10.3 7.4-6.5 12.7l126.4 174a16.1 16.1 0 0026 0l212.6-292.7c3.8-5.4 0-12.8-6.5-12.8z"]},"check":{"vb":"64 64 896 896","p":["M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474a32 32 0 00-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1.4-12.8-6.3-12.8z"]},"credit-card":{"vb":"64 64 896 896","p":["M928 160H96c-17.7 0-32 14.3-32 32v640c0 17.7 14.3 32 32 32h832c17.7 0 32-14.3 32-32V192c0-17.7-14.3-32-32-32zm-792 72h752v120H136V232zm752 560H136V440h752v352zm-237-64h165c4.4 0 8-3.6 8-8v-72c0-4.4-3.6-8-8-8H651c-4.4 0-8 3.6-8 8v72c0 4.4 3.6 8 8 8z"]},"delete":{"vb":"64 64 896 896","p":["M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z"]},"deployment-unit":{"vb":"64 64 896 896","p":["M888.3 693.2c-42.5-24.6-94.3-18-129.2 12.8l-53-30.7V523.6c0-15.7-8.4-30.3-22-38.1l-136-78.3v-67.1c44.2-15 76-56.8 76-106.1 0-61.9-50.1-112-112-112s-112 50.1-112 112c0 49.3 31.8 91.1 76 106.1v67.1l-136 78.3c-13.6 7.8-22 22.4-22 38.1v151.6l-53 30.7c-34.9-30.8-86.8-37.4-129.2-12.8-53.5 31-71.7 99.4-41 152.9 30.8 53.5 98.9 71.9 152.2 41 42.5-24.6 62.7-73 53.6-118.8l48.7-28.3 140.6 81c6.8 3.9 14.4 5.9 22 5.9s15.2-2 22-5.9L674.5 740l48.7 28.3c-9.1 45.7 11.2 94.2 53.6 118.8 53.3 30.9 121.5 12.6 152.2-41 30.8-53.6 12.6-122-40.7-152.9zm-673 138.4a47.6 47.6 0 01-65.2-17.6c-13.2-22.9-5.4-52.3 17.5-65.5a47.6 47.6 0 0165.2 17.6c13.2 22.9 5.4 52.3-17.5 65.5zM522 463.8zM464 234a48.01 48.01 0 0196 0 48.01 48.01 0 01-96 0zm170 446.2l-122 70.3-122-70.3V539.8l122-70.3 122 70.3v140.4zm239.9 133.9c-13.2 22.9-42.4 30.8-65.2 17.6-22.8-13.2-30.7-42.6-17.5-65.5s42.4-30.8 65.2-17.6c22.9 13.2 30.7 42.5 17.5 65.5z"]},"dollar":{"vb":"64 64 896 896","p":["M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372zm47.7-395.2l-25.4-5.9V348.6c38 5.2 61.5 29 65.5 58.2.5 4 3.9 6.9 7.9 6.9h44.9c4.7 0 8.4-4.1 8-8.8-6.1-62.3-57.4-102.3-125.9-109.2V263c0-4.4-3.6-8-8-8h-28.1c-4.4 0-8 3.6-8 8v33c-70.8 6.9-126.2 46-126.2 119 0 67.6 49.8 100.2 102.1 112.7l24.7 6.3v142.7c-44.2-5.9-69-29.5-74.1-61.3-.6-3.8-4-6.6-7.9-6.6H363c-4.7 0-8.4 4-8 8.7 4.5 55 46.2 105.6 135.2 112.1V761c0 4.4 3.6 8 8 8h28.4c4.4 0 8-3.6 8-8.1l-.2-31.7c78.3-6.9 134.3-48.8 134.3-124-.1-69.4-44.2-100.4-109-116.4zm-68.6-16.2c-5.6-1.6-10.3-3.1-15-5-33.8-12.2-49.5-31.9-49.5-57.3 0-36.3 27.5-57 64.5-61.7v124zM534.3 677V543.3c3.1.9 5.9 1.6 8.8 2.2 47.3 14.4 63.2 34.4 63.2 65.1 0 39.1-29.4 62.6-72 66.4z"]},"down":{"vb":"64 64 896 896","p":["M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.4-12.7z"]},"download":{"vb":"64 64 896 896","p":["M505.7 661a8 8 0 0012.6 0l112-141.7c4.1-5.2.4-12.9-6.3-12.9h-74.1V168c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v338.3H400c-6.7 0-10.4 7.7-6.3 12.9l112 141.8zM878 626h-60c-4.4 0-8 3.6-8 8v154H214V634c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v198c0 17.7 14.3 32 32 32h684c17.7 0 32-14.3 32-32V634c0-4.4-3.6-8-8-8z"]},"edit":{"vb":"64 64 896 896","p":["M257.7 752c2 0 4-.2 6-.5L431.9 722c2-.4 3.9-1.3 5.3-2.8l423.9-423.9a9.96 9.96 0 000-14.1L694.9 114.9c-1.9-1.9-4.4-2.9-7.1-2.9s-5.2 1-7.1 2.9L256.8 538.8c-1.5 1.5-2.4 3.3-2.8 5.3l-29.5 168.2a33.5 33.5 0 009.4 29.8c6.6 6.4 14.9 9.9 23.8 9.9zm67.4-174.4L687.8 215l73.3 73.3-362.7 362.6-88.9 15.7 15.6-89zM880 836H144c-17.7 0-32 14.3-32 32v36c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-36c0-17.7-14.3-32-32-32z"]},"file-excel":{"vb":"64 64 896 896","p":["M854.6 288.6L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM790.2 326H602V137.8L790.2 326zm1.8 562H232V136h302v216a42 42 0 0042 42h216v494zM514.1 580.1l-61.8-102.4c-2.2-3.6-6.1-5.8-10.3-5.8h-38.4c-2.3 0-4.5.6-6.4 1.9-5.6 3.5-7.3 10.9-3.7 16.6l82.3 130.4-83.4 132.8a12.04 12.04 0 0010.2 18.4h34.5c4.2 0 8-2.2 10.2-5.7L510 664.8l62.3 101.4c2.2 3.6 6.1 5.7 10.2 5.7H620c2.3 0 4.5-.7 6.5-1.9 5.6-3.6 7.2-11 3.6-16.6l-84-130.4 85.3-132.5a12.04 12.04 0 00-10.1-18.5h-35.7c-4.2 0-8.1 2.2-10.3 5.8l-61.2 102.3z"]},"file-pdf":{"vb":"64 64 896 896","p":["M531.3 574.4l.3-1.4c5.8-23.9 13.1-53.7 7.4-80.7-3.8-21.3-19.5-29.6-32.9-30.2-15.8-.7-29.9 8.3-33.4 21.4-6.6 24-.7 56.8 10.1 98.6-13.6 32.4-35.3 79.5-51.2 107.5-29.6 15.3-69.3 38.9-75.2 68.7-1.2 5.5.2 12.5 3.5 18.8 3.7 7 9.6 12.4 16.5 15 3 1.1 6.6 2 10.8 2 17.6 0 46.1-14.2 84.1-79.4 5.8-1.9 11.8-3.9 17.6-5.9 27.2-9.2 55.4-18.8 80.9-23.1 28.2 15.1 60.3 24.8 82.1 24.8 21.6 0 30.1-12.8 33.3-20.5 5.6-13.5 2.9-30.5-6.2-39.6-13.2-13-45.3-16.4-95.3-10.2-24.6-15-40.7-35.4-52.4-65.8zM421.6 726.3c-13.9 20.2-24.4 30.3-30.1 34.7 6.7-12.3 19.8-25.3 30.1-34.7zm87.6-235.5c5.2 8.9 4.5 35.8.5 49.4-4.9-19.9-5.6-48.1-2.7-51.4.8.1 1.5.7 2.2 2zm-1.6 120.5c10.7 18.5 24.2 34.4 39.1 46.2-21.6 4.9-41.3 13-58.9 20.2-4.2 1.7-8.3 3.4-12.3 5 13.3-24.1 24.4-51.4 32.1-71.4zm155.6 65.5c.1.2.2.5-.4.9h-.2l-.2.3c-.8.5-9 5.3-44.3-8.6 40.6-1.9 45 7.3 45.1 7.4zm191.4-388.2L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM790.2 326H602V137.8L790.2 326zm1.8 562H232V136h302v216a42 42 0 0042 42h216v494z"]},"file-sync":{"vb":"64 64 896 896","p":["M296 256c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8h384c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H296zm192 200v-48c0-4.4-3.6-8-8-8H296c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8h184c4.4 0 8-3.6 8-8zm-48 396H208V148h560v344c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V108c0-17.7-14.3-32-32-32H168c-17.7 0-32 14.3-32 32v784c0 17.7 14.3 32 32 32h272c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zm104.1-115.6c1.8-34.5 16.2-66.8 40.8-91.4 26.2-26.2 62-41 99.1-41 37.4 0 72.6 14.6 99.1 41 3.2 3.2 6.3 6.6 9.2 10.1L769.2 673a8 8 0 003 14.1l93.3 22.5c5 1.2 9.8-2.6 9.9-7.7l.6-95.4a8 8 0 00-12.9-6.4l-20.3 15.8C805.4 569.6 748.1 540 684 540c-109.9 0-199.6 86.9-204 195.7-.2 4.5 3.5 8.3 8 8.3h48.1c4.3 0 7.8-3.3 8-7.6zM880 744h-48.1c-4.3 0-7.8 3.3-8 7.6-1.8 34.5-16.2 66.8-40.8 91.4-26.2 26.2-62 41-99.1 41-37.4 0-72.6-14.6-99.1-41-3.2-3.2-6.3-6.6-9.2-10.1l23.1-17.9a8 8 0 00-3-14.1l-93.3-22.5c-5-1.2-9.8 2.6-9.9 7.7l-.6 95.4a8 8 0 0012.9 6.4l20.3-15.8C562.6 918.4 619.9 948 684 948c109.9 0 199.6-86.9 204-195.7.2-4.5-3.5-8.3-8-8.3z"]},"filter":{"vb":"64 64 896 896","p":["M880.1 154H143.9c-24.5 0-39.8 26.7-27.5 48L349 597.4V838c0 17.7 14.2 32 31.8 32h262.4c17.6 0 31.8-14.3 31.8-32V597.4L907.7 202c12.2-21.3-3.1-48-27.6-48zM603.4 798H420.6V642h182.9v156zm9.6-236.6l-9.5 16.6h-183l-9.5-16.6L212.7 226h598.6L613 561.4z"]},"folder-open":{"vb":"64 64 896 896","p":["M928 444H820V330.4c0-17.7-14.3-32-32-32H473L355.7 186.2a8.15 8.15 0 00-5.5-2.2H96c-17.7 0-32 14.3-32 32v592c0 17.7 14.3 32 32 32h698c13 0 24.8-7.9 29.7-20l134-332c1.5-3.8 2.3-7.9 2.3-12 0-17.7-14.3-32-32-32zM136 256h188.5l119.6 114.4H748V444H238c-13 0-24.8 7.9-29.7 20L136 643.2V256zm635.3 512H159l103.3-256h612.4L771.3 768z"]},"fund":{"vb":"64 64 896 896","p":["M926 164H94c-17.7 0-32 14.3-32 32v640c0 17.7 14.3 32 32 32h832c17.7 0 32-14.3 32-32V196c0-17.7-14.3-32-32-32zm-40 632H134V236h752v560zm-658.9-82.3c3.1 3.1 8.2 3.1 11.3 0l172.5-172.5 114.4 114.5c3.1 3.1 8.2 3.1 11.3 0l297-297.2c3.1-3.1 3.1-8.2 0-11.3l-36.8-36.8a8.03 8.03 0 00-11.3 0L531 565 416.6 450.5a8.03 8.03 0 00-11.3 0l-214.9 215a8.03 8.03 0 000 11.3l36.7 36.9z"]},"info-circle":{"vb":"64 64 896 896","p":["M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z","M464 336a48 48 0 1096 0 48 48 0 10-96 0zm72 112h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V456c0-4.4-3.6-8-8-8z"]},"left":{"vb":"64 64 896 896","p":["M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 000 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z"]},"pie-chart":{"vb":"64 64 896 896","p":["M864 518H506V160c0-4.4-3.6-8-8-8h-26a398.46 398.46 0 00-282.8 117.1 398.19 398.19 0 00-85.7 127.1A397.61 397.61 0 0072 552a398.46 398.46 0 00117.1 282.8c36.7 36.7 79.5 65.6 127.1 85.7A397.61 397.61 0 00472 952a398.46 398.46 0 00282.8-117.1c36.7-36.7 65.6-79.5 85.7-127.1A397.61 397.61 0 00872 552v-26c0-4.4-3.6-8-8-8zM705.7 787.8A331.59 331.59 0 01470.4 884c-88.1-.4-170.9-34.9-233.2-97.2C174.5 724.1 140 640.7 140 552c0-88.7 34.5-172.1 97.2-234.8 54.6-54.6 124.9-87.9 200.8-95.5V586h364.3c-7.7 76.3-41.3 147-96.6 201.8zM952 462.4l-2.6-28.2c-8.5-92.1-49.4-179-115.2-244.6A399.4 399.4 0 00589 74.6L560.7 72c-4.7-.4-8.7 3.2-8.7 7.9V464c0 4.4 3.6 8 8 8l384-1c4.7 0 8.4-4 8-8.6zm-332.2-58.2V147.6a332.24 332.24 0 01166.4 89.8c45.7 45.6 77 103.6 90 166.1l-256.4.7z"]},"plus":{"vb":"64 64 896 896","p":["M482 152h60q8 0 8 8v704q0 8-8 8h-60q-8 0-8-8V160q0-8 8-8z","M192 474h672q8 0 8 8v60q0 8-8 8H160q-8 0-8-8v-60q0-8 8-8z"]},"plus-circle":{"vb":"64 64 896 896","p":["M696 480H544V328c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v152H328c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8h152v152c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V544h152c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8z","M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"]},"pull-request":{"vb":"64 64 896 896","p":["M788 705.9V192c0-8.8-7.2-16-16-16H602v-68.8c0-6-7-9.4-11.7-5.7L462.7 202.3a7.14 7.14 0 000 11.3l127.5 100.8c4.7 3.7 11.7.4 11.7-5.7V240h114v465.9c-44.2 15-76 56.9-76 106.1 0 61.8 50.2 112 112 112s112-50.2 112-112c.1-49.2-31.7-91-75.9-106.1zM752 860a48.01 48.01 0 010-96 48.01 48.01 0 010 96zM384 212c0-61.8-50.2-112-112-112s-112 50.2-112 112c0 49.2 31.8 91 76 106.1V706c-44.2 15-76 56.9-76 106.1 0 61.8 50.2 112 112 112s112-50.2 112-112c0-49.2-31.8-91-76-106.1V318.1c44.2-15.1 76-56.9 76-106.1zm-160 0a48.01 48.01 0 0196 0 48.01 48.01 0 01-96 0zm96 600a48.01 48.01 0 01-96 0 48.01 48.01 0 0196 0z"]},"reload":{"vb":"64 64 896 896","p":["M909.1 209.3l-56.4 44.1C775.8 155.1 656.2 92 521.9 92 290 92 102.3 279.5 102 511.5 101.7 743.7 289.8 932 521.9 932c181.3 0 335.8-115 394.6-276.1 1.5-4.2-.7-8.9-4.9-10.3l-56.7-19.5a8 8 0 00-10.1 4.8c-1.8 5-3.8 10-5.9 14.9-17.3 41-42.1 77.8-73.7 109.4A344.77 344.77 0 01655.9 829c-42.3 17.9-87.4 27-133.8 27-46.5 0-91.5-9.1-133.8-27A341.5 341.5 0 01279 755.2a342.16 342.16 0 01-73.7-109.4c-17.9-42.4-27-87.4-27-133.9s9.1-91.5 27-133.9c17.3-41 42.1-77.8 73.7-109.4 31.6-31.6 68.4-56.4 109.3-73.8 42.3-17.9 87.4-27 133.8-27 46.5 0 91.5 9.1 133.8 27a341.5 341.5 0 01109.3 73.8c9.9 9.9 19.2 20.4 27.8 31.4l-60.2 47a8 8 0 003 14.1l175.6 43c5 1.2 9.9-2.6 9.9-7.7l.8-180.9c-.1-6.6-7.8-10.3-13-6.2z"]},"retweet":{"vb":"0 0 1024 1024","p":["M136 552h63.6c4.4 0 8-3.6 8-8V288.7h528.6v72.6c0 1.9.6 3.7 1.8 5.2a8.3 8.3 0 0011.7 1.4L893 255.4c4.3-5 3.6-10.3 0-13.2L749.7 129.8a8.22 8.22 0 00-5.2-1.8c-4.6 0-8.4 3.8-8.4 8.4V209H199.7c-39.5 0-71.7 32.2-71.7 71.8V544c0 4.4 3.6 8 8 8zm752-80h-63.6c-4.4 0-8 3.6-8 8v255.3H287.8v-72.6c0-1.9-.6-3.7-1.8-5.2a8.3 8.3 0 00-11.7-1.4L131 768.6c-4.3 5-3.6 10.3 0 13.2l143.3 112.4c1.5 1.2 3.3 1.8 5.2 1.8 4.6 0 8.4-3.8 8.4-8.4V815h536.6c39.5 0 71.7-32.2 71.7-71.8V480c-.2-4.4-3.8-8-8.2-8z"]},"right":{"vb":"64 64 896 896","p":["M765.7 486.8L314.9 134.7A7.97 7.97 0 00302 141v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1a31.96 31.96 0 000-50.4z"]},"safety":{"vb":"0 0 1024 1024","p":["M512 64L128 192v384c0 212.1 171.9 384 384 384s384-171.9 384-384V192L512 64zm312 512c0 172.3-139.7 312-312 312S200 748.3 200 576V246l312-110 312 110v330z","M378.4 475.1a35.91 35.91 0 00-50.9 0 35.91 35.91 0 000 50.9l129.4 129.4 2.1 2.1a33.98 33.98 0 0048.1 0L730.6 434a33.98 33.98 0 000-48.1l-2.8-2.8a33.98 33.98 0 00-48.1 0L483 579.7 378.4 475.1z"]},"save":{"vb":"64 64 896 896","p":["M893.3 293.3L730.7 130.7c-7.5-7.5-16.7-13-26.7-16V112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V338.5c0-17-6.7-33.2-18.7-45.2zM384 184h256v104H384V184zm456 656H184V184h136v136c0 17.7 14.3 32 32 32h320c17.7 0 32-14.3 32-32V205.8l136 136V840zM512 442c-79.5 0-144 64.5-144 144s64.5 144 144 144 144-64.5 144-144-64.5-144-144-144zm0 224c-44.2 0-80-35.8-80-80s35.8-80 80-80 80 35.8 80 80-35.8 80-80 80z"]},"search":{"vb":"64 64 896 896","p":["M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"]},"share-alt":{"vb":"64 64 896 896","p":["M752 664c-28.5 0-54.8 10-75.4 26.7L469.4 540.8a160.68 160.68 0 000-57.6l207.2-149.9C697.2 350 723.5 360 752 360c66.2 0 120-53.8 120-120s-53.8-120-120-120-120 53.8-120 120c0 11.6 1.6 22.7 4.7 33.3L439.9 415.8C410.7 377.1 364.3 352 312 352c-88.4 0-160 71.6-160 160s71.6 160 160 160c52.3 0 98.7-25.1 127.9-63.8l196.8 142.5c-3.1 10.6-4.7 21.8-4.7 33.3 0 66.2 53.8 120 120 120s120-53.8 120-120-53.8-120-120-120zm0-476c28.7 0 52 23.3 52 52s-23.3 52-52 52-52-23.3-52-52 23.3-52 52-52zM312 600c-48.5 0-88-39.5-88-88s39.5-88 88-88 88 39.5 88 88-39.5 88-88 88zm440 236c-28.7 0-52-23.3-52-52s23.3-52 52-52 52 23.3 52 52-23.3 52-52 52z"]},"shop":{"vb":"64 64 896 896","p":["M882 272.1V144c0-17.7-14.3-32-32-32H174c-17.7 0-32 14.3-32 32v128.1c-16.7 1-30 14.9-30 31.9v131.7a177 177 0 0014.4 70.4c4.3 10.2 9.6 19.8 15.6 28.9v345c0 17.6 14.3 32 32 32h676c17.7 0 32-14.3 32-32V535a175 175 0 0015.6-28.9c9.5-22.3 14.4-46 14.4-70.4V304c0-17-13.3-30.9-30-31.9zM214 184h596v88H214v-88zm362 656.1H448V736h128v104.1zm234 0H640V704c0-17.7-14.3-32-32-32H416c-17.7 0-32 14.3-32 32v136.1H214V597.9c2.9 1.4 5.9 2.8 9 4 22.3 9.4 46 14.1 70.4 14.1s48-4.7 70.4-14.1c13.8-5.8 26.8-13.2 38.7-22.1.2-.1.4-.1.6 0a180.4 180.4 0 0038.7 22.1c22.3 9.4 46 14.1 70.4 14.1 24.4 0 48-4.7 70.4-14.1 13.8-5.8 26.8-13.2 38.7-22.1.2-.1.4-.1.6 0a180.4 180.4 0 0038.7 22.1c22.3 9.4 46 14.1 70.4 14.1 24.4 0 48-4.7 70.4-14.1 3-1.3 6-2.6 9-4v242.2zm30-404.4c0 59.8-49 108.3-109.3 108.3-40.8 0-76.4-22.1-95.2-54.9-2.9-5-8.1-8.1-13.9-8.1h-.6c-5.7 0-11 3.1-13.9 8.1A109.24 109.24 0 01512 544c-40.7 0-76.2-22-95-54.7-3-5.1-8.4-8.3-14.3-8.3s-11.4 3.2-14.3 8.3a109.63 109.63 0 01-95.1 54.7C233 544 184 495.5 184 435.7v-91.2c0-.3.2-.5.5-.5h655c.3 0 .5.2.5.5v91.2z"]},"shopping":{"vb":"64 64 896 896","p":["M832 312H696v-16c0-101.6-82.4-184-184-184s-184 82.4-184 184v16H192c-17.7 0-32 14.3-32 32v536c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V344c0-17.7-14.3-32-32-32zm-432-16c0-61.9 50.1-112 112-112s112 50.1 112 112v16H400v-16zm392 544H232V384h96v88c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-88h224v88c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-88h96v456z"]},"transaction":{"vb":"64 64 896 896","p":["M668.6 320c0-4.4-3.6-8-8-8h-54.5c-3 0-5.8 1.7-7.1 4.4l-84.7 168.8H511l-84.7-168.8a8 8 0 00-7.1-4.4h-55.7c-1.3 0-2.6.3-3.8 1-3.9 2.1-5.3 7-3.2 10.8l103.9 191.6h-57c-4.4 0-8 3.6-8 8v27.1c0 4.4 3.6 8 8 8h76v39h-76c-4.4 0-8 3.6-8 8v27.1c0 4.4 3.6 8 8 8h76V704c0 4.4 3.6 8 8 8h49.9c4.4 0 8-3.6 8-8v-63.5h76.3c4.4 0 8-3.6 8-8v-27.1c0-4.4-3.6-8-8-8h-76.3v-39h76.3c4.4 0 8-3.6 8-8v-27.1c0-4.4-3.6-8-8-8H564l103.7-191.6c.5-1.1.9-2.4.9-3.7zM157.9 504.2a352.7 352.7 0 01103.5-242.4c32.5-32.5 70.3-58.1 112.4-75.9 43.6-18.4 89.9-27.8 137.6-27.8 47.8 0 94.1 9.3 137.6 27.8 42.1 17.8 79.9 43.4 112.4 75.9 10 10 19.3 20.5 27.9 31.4l-50 39.1a8 8 0 003 14.1l156.8 38.3c5 1.2 9.9-2.6 9.9-7.7l.8-161.5c0-6.7-7.7-10.5-12.9-6.3l-47.8 37.4C770.7 146.3 648.6 82 511.5 82 277 82 86.3 270.1 82 503.8a8 8 0 008 8.2h60c4.3 0 7.8-3.5 7.9-7.8zM934 512h-60c-4.3 0-7.9 3.5-8 7.8a352.7 352.7 0 01-103.5 242.4 352.57 352.57 0 01-112.4 75.9c-43.6 18.4-89.9 27.8-137.6 27.8s-94.1-9.3-137.6-27.8a352.57 352.57 0 01-112.4-75.9c-10-10-19.3-20.5-27.9-31.4l49.9-39.1a8 8 0 00-3-14.1l-156.8-38.3c-5-1.2-9.9 2.6-9.9 7.7l-.8 161.7c0 6.7 7.7 10.5 12.9 6.3l47.8-37.4C253.3 877.7 375.4 942 512.5 942 747 942 937.7 753.9 942 520.2a8 8 0 00-8-8.2z"]},"undo":{"vb":"64 64 896 896","p":["M511.4 124C290.5 124.3 112 303 112 523.9c0 128 60.2 242 153.8 315.2l-37.5 48c-4.1 5.3-.3 13 6.3 12.9l167-.8c5.2 0 9-4.9 7.7-9.9L369.8 727a8 8 0 00-14.1-3L315 776.1c-10.2-8-20-16.7-29.3-26a318.64 318.64 0 01-68.6-101.7C200.4 609 192 567.1 192 523.9s8.4-85.1 25.1-124.5c16.1-38.1 39.2-72.3 68.6-101.7 29.4-29.4 63.6-52.5 101.7-68.6C426.9 212.4 468.8 204 512 204s85.1 8.4 124.5 25.1c38.1 16.1 72.3 39.2 101.7 68.6 29.4 29.4 52.5 63.6 68.6 101.7 16.7 39.4 25.1 81.3 25.1 124.5s-8.4 85.1-25.1 124.5a318.64 318.64 0 01-68.6 101.7c-7.5 7.5-15.3 14.5-23.4 21.2a7.93 7.93 0 00-1.2 11.1l39.4 50.5c2.8 3.5 7.9 4.1 11.4 1.3C854.5 760.8 912 649.1 912 523.9c0-221.1-179.4-400.2-400.6-399.9z"]},"user":{"vb":"64 64 896 896","p":["M858.5 763.6a374 374 0 00-80.6-119.5 375.63 375.63 0 00-119.5-80.6c-.4-.2-.8-.3-1.2-.5C719.5 518 760 444.7 760 362c0-137-111-248-248-248S264 225 264 362c0 82.7 40.5 156 102.8 201.1-.4.2-.8.3-1.2.5-44.8 18.9-85 46-119.5 80.6a375.63 375.63 0 00-80.6 119.5A371.7 371.7 0 00136 901.8a8 8 0 008 8.2h60c4.4 0 7.9-3.5 8-7.8 2-77.2 33-149.5 87.8-204.3 56.7-56.7 132-87.9 212.2-87.9s155.5 31.2 212.2 87.9C779 752.7 810 825 812 902.2c.1 4.4 3.6 7.8 8 7.8h60a8 8 0 008-8.2c-1-47.8-10.9-94.3-29.5-138.2zM512 534c-45.9 0-89.1-17.9-121.6-50.4S340 407.9 340 362c0-45.9 17.9-89.1 50.4-121.6S466.1 190 512 190s89.1 17.9 121.6 50.4S684 316.1 684 362c0 45.9-17.9 89.1-50.4 121.6S557.9 534 512 534z"]},"warning":{"vb":"64 64 896 896","p":["M464 720a48 48 0 1096 0 48 48 0 10-96 0zm16-304v184c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V416c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8zm475.7 440l-416-720c-6.2-10.7-16.9-16-27.7-16s-21.6 5.3-27.7 16l-416 720C56 877.4 71.4 904 96 904h832c24.6 0 40-26.6 27.7-48zm-783.5-27.9L512 239.9l339.8 588.2H172.2z"]}};
    //AntdIcon 4.x: role/aria-label, rest props (event handlers that Tooltip/Popover inject, style) on the span, ref
    //forwarded, tabIndex -1 with onClick. props.legacy = Icon of @ant-design/compatible (adds the type attribute)
    var ICON_OWN = ["type", "legacy", "className", "spin", "rotate", "tabIndex", "onClick", "twoToneColor"];
    var Ico = React.forwardRef(function (props, ref) {
      var def = ICON_PATHS[props.type] || { vb: "64 64 896 896", p: [] };
      var paths = def.p;
      var rest = {};
      Object.keys(props).forEach(function (k) { if (ICON_OWN.indexOf(k) < 0) rest[k] = props[k]; });
      if (props.legacy) rest.type = props.type;
      var iconTabIndex = props.tabIndex;
      if (iconTabIndex === undefined && props.onClick) iconTabIndex = -1;
      var cls = "anticon anticon-" + props.type + (props.spin ? " anticon-spin" : "") + (props.className ? " " + props.className : "");
      return (
        <span role="img" aria-label={props.type} {...rest} ref={ref} tabIndex={iconTabIndex} onClick={props.onClick} className={cls}>
          <svg viewBox={def.vb} focusable="false" data-icon={props.type} width="1em" height="1em" fill="currentColor" aria-hidden="true">
            {paths.map(function (d, i) { return <path key={i} d={d} />; })}
          </svg>
        </span>
      );
    });

    /* ---------- Standard view styles (same visual language as CLTransaccionesContables) ---------- */
    var PG_CSS = [
      ".pg-shell { --view-ink:#1e293b; --view-muted:#64748b; --view-line:#e2e8f0; --view-line-strong:#cbd5e1; --view-page:#f4f6fa; --view-brand:#1e4b8f; --view-brand-dark:#15356b; --view-good:#137a4c; --view-bad:#cf1322; }",
      ".pg-shell { width:100%; max-width:100%; min-width:0; height:calc(100dvh - 72px); padding:4px; box-sizing:border-box; display:flex; flex-direction:column; overflow:hidden; background:var(--view-page); color:var(--view-ink); font:13px/1.45 -apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif; }",
      ".pg-shell *, .pg-shell *::before, .pg-shell *::after { box-sizing:border-box; }",
      ".pg-card { flex:1 1 auto; display:flex; flex-direction:column; width:100%; min-width:0; min-height:0; background:#fff; border:1px solid #aebdcd; border-radius:8px; box-shadow:0 1px 2px rgba(15,23,42,.04); overflow:hidden; }",
      ".pg-head { flex:0 0 auto; display:flex; align-items:center; justify-content:space-between; gap:8px; min-height:50px; padding:6px 8px; background:var(--view-page); border-bottom:2px solid var(--view-brand); }",
      ".pg-title { display:flex; align-items:center; gap:12px; color:var(--view-brand-dark); font-size:17px; font-weight:700; letter-spacing:-.01em; line-height:1.3; }",
      ".pg-title-mark { width:6px; height:30px; flex:0 0 6px; border-radius:3px; background:var(--view-brand); }",
      ".pg-body { flex:1 1 auto; width:100%; min-width:0; min-height:0; padding:4px; display:flex; flex-direction:column; }",
      ".pg-toolbar { display:flex; flex-wrap:wrap; align-items:center; gap:8px; min-height:32px; margin:0 0 2px; padding:4px; background:#eaf1fb; border:1px solid #c7d9f2; border-radius:8px; }",
      ".pg-toolbar .ant-dropdown-button, .pg-toolbar .ant-btn-group { display:inline-flex !important; width:auto !important; flex:0 0 auto; }",
      ".pg-action.ant-btn { height:32px; padding:0 15px; border-radius:4px; font-size:14px; font-weight:500; box-shadow:none; background:#fff; border-color:#d9d9d9; color:#262626; }",
      ".pg-action.ant-btn:not([disabled]):hover, .pg-action.ant-btn:not([disabled]):focus { border-color:#1890ff; color:#1890ff; }",
      ".pg-action.ant-btn-primary { background:#1890ff; border-color:#1890ff; color:#fff; }",
      ".pg-action.pg-reload.ant-btn { background:#36a9e1; border-color:#36a9e1; color:#fff; }",
      ".pg-action.pg-reload.ant-btn:not([disabled]):hover, .pg-action.pg-reload.ant-btn:not([disabled]):focus { background:#218fc7; border-color:#218fc7; color:#fff; }",
      ".pg-action.pg-excel.ant-btn { background:#4b9f45; border-color:#4b9f45; color:#fff; }",
      ".pg-action.pg-excel.ant-btn:not([disabled]):hover, .pg-action.pg-excel.ant-btn:not([disabled]):focus { background:#398238; border-color:#398238; color:#fff; }",
      ".pg-action.ant-btn-primary:not([disabled]):hover, .pg-action.ant-btn-primary:not([disabled]):focus { background:#147bd1; border-color:#147bd1; color:#fff; }",
      ".pg-action.ant-btn[disabled], .pg-action.ant-btn[disabled]:hover { background:#f1f5f9; border-color:#aebdcd; color:#526174; opacity:1; }",
      ".pg-action .anticon + span, .pg-action span + .anticon { margin-left:8px; }",
      ".pg-list { flex:1 1 auto; width:100%; min-width:0; min-height:0; display:flex; flex-direction:column; }",
      ".pg-grid { flex:1 1 auto; width:100%; max-width:100%; min-width:0; min-height:0; border:1px solid #9aacc1; border-radius:8px; overflow:hidden; background:#fff; }",
      /* GLOB-1364: standard visible checkbox borders; pg-std covers the drawer and modals rendered outside the shell */
      ".pg-shell .ant-checkbox-inner, .pg-std .ant-checkbox-inner { border:1px solid #8c9db5; }",
      ".pg-shell .ant-checkbox-wrapper:hover .ant-checkbox-inner, .pg-shell .ant-checkbox:hover .ant-checkbox-inner, .pg-std .ant-checkbox-wrapper:hover .ant-checkbox-inner, .pg-std .ant-checkbox:hover .ant-checkbox-inner { border-color:var(--view-brand, #1e4b8f); }",
      ".pg-shell .ant-checkbox-checked .ant-checkbox-inner, .pg-std .ant-checkbox-checked .ant-checkbox-inner { border-color:#1890ff; }",
      /* GLOB-1364: long texts are cut with an ellipsis (full text in a tooltip) so they do not widen the column */
      ".pg-ellipsis { display:inline-block; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; vertical-align:middle; }",
      ".pg-concept { width:100%; }",
      ".pg-account { width:100%; }",
      ".pg-shell .ant-table { width:100%; max-width:100%; color:#183153; font-size:12px; table-layout:fixed; }",
      ".pg-shell .ant-table-thead > tr > th { padding:5px 8px; background:#bfbfbf; color:#262626; border-bottom:1px solid #9aacc1; font-weight:700; white-space:nowrap; }",
      ".pg-shell .ant-table-tbody > tr > td { height:36px; padding:4px 8px; border-bottom:1px solid #c4d0de; vertical-align:middle; }",
      ".pg-shell .ant-table-tbody > tr:hover > td { background:#b7d7ff; }",
      ".pg-shell .ant-table-tbody > tr.ant-table-row-selected > td, .pg-shell .ant-table-tbody > tr.ant-table-row-selected:hover > td { background:#86b4ff; }",
      ".pg-grid .ant-table-body { overflow-y:scroll !important; overflow-x:hidden !important; }",
      ".pg-shell .ant-table-pagination { margin:6px 8px; padding-top:5px; border-top:1px solid #9aacc1; }",
      ".pg-amount { font-weight:600; font-variant-numeric:tabular-nums; white-space:nowrap; }",
      ".pg-amount-pos { color:var(--view-good); }",
      ".pg-amount-neg { color:var(--view-bad); }",
      ".pg-amount-zero { color:var(--view-ink); font-weight:400; }",
      ".pg-acc-modal .pg-acc-entry { margin:0 0 12px; padding:6px 8px 8px; border:1px solid #aebdcd; border-radius:8px; background:#fff; }",
      ".pg-acc-modal .pg-acc-entry-head { display:flex; flex-wrap:wrap; align-items:center; gap:12px; padding:0 0 4px; color:#15356b; font-size:12.5px; border-bottom:1px solid #e2e8f0; }",
      ".pg-acc-modal .pg-acc-entry-id { font-weight:700; }",
      ".pg-acc-modal .pg-acc-entry-ref { margin:4px 0 6px; color:#64748b; font-size:12px; }",
      ".pg-acc-modal .ant-table { font-size:12px; color:#183153; }",
      ".pg-acc-modal .ant-table-thead > tr > th { padding:5px 8px; background:#bfbfbf; color:#262626; font-weight:700; white-space:nowrap; }",
      ".pg-acc-modal .ant-table-tbody > tr > td { padding:5px 8px; border-bottom:1px solid #e2e8f0; }",
      ".pg-acc-modal .ant-table-tbody > tr:hover > td { background:#b7d7ff; }",
      ".pg-acc-modal .pg-acc-account { white-space:nowrap; font-variant-numeric:tabular-nums; }",
      ".pg-acc-modal .pg-acc-num { font-variant-numeric:tabular-nums; white-space:nowrap; }",
      ".pg-acc-modal .pg-acc-totals { display:flex; justify-content:flex-end; align-items:center; gap:24px; padding:6px 8px 0; font-weight:700; color:#1e293b; }"
    ].join("\n");

    /* ---------- config.js, Lib/Dal, Lib/Helpers, Lib/Cache ---------- */
    //config.ssApiUrl del bundle publicado: localStorage.sis11api || REACT_APP_APIURL
    var SS_API_URL = localStorage.sis11api || "//sisos-api-latest.axxis-systems.net";
    var safeGet = function (path, object, nullValue) {
      return path.reduce(function (xs, x) { return xs && xs[x] ? xs[x] : nullValue; }, object);
    };
    var safeGetRaw = function (path, object, nullValue) {
      return path.reduce(function (xs, x) { return xs && xs[x] !== undefined && xs[x] !== null ? xs[x] : nullValue; }, object);
    };
    var fetchProxy = function (route, method, body) {
      console.log("Proxy request-->", route, method, body);
      return fetch(SS_API_URL + "/proxy" + route, {
        method: method,
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.token },
        body: body ? JSON.stringify(body) : null
      })
        .then(function (r) { return r.json(); })
        .then(function (r) {
          var output = { proxy: true, ok: true, outData: r };
          console.log(output);
          return output;
        })
        .catch(function (err) {
          console.log(err, "catch during proxy fetch");
          return { ok: false, msg: t("Command not found or connection problem"), error: err };
        });
    };
    var getConfigProfile = function () {
      return new Promise(function (resolve) {
        var checkExists = function () {
          console.log("Checking variable");
          if (window.global.configProfile) return resolve(window.global.configProfile);
          setTimeout(checkExists, 500);
        };
        checkExists();
      });
    };
    var useUpdateEffect = function (effect, dependencies) {
      var isInitialMount = useRef(true);
      useEffect(function () {
        if (isInitialMount.current) isInitialMount.current = false;
        else effect();
      }, dependencies || []);
    };
    var currentUser = function () { return window.GLOBAL ? window.GLOBAL.currentUser : undefined; };
    var mainCfg = function () { var g = window.global; return g && g.configProfile && g.configProfile.Main; };
    var cfgList = function (f) {
      if (typeof f === "string") f = f.split(/[,\s]+/).filter(Boolean);
      return Array.isArray(f) ? f : [];
    };
    var bdFields = function () { try { var m = mainCfg(); return cfgList(m && m.businessDateFields); } catch (e) { return []; } };
    var bdOn = function () { return bdFields().length > 0; };
    var branchTimeZoneOn = function () { try { var m = mainCfg(); return !!(m && m.branchTimeZone); } catch (e) { return false; } };
    var brFields = function () {
      if (!branchTimeZoneOn()) return [];
      try {
        var m = mainCfg();
        var f = m && m.branchDateFields;
        if (typeof f === "string") f = f.split(/[,\s]+/).filter(Boolean);
        if (!Array.isArray(f)) return [];
        var bd = bdFields();
        return f.filter(function (k) { return bd.indexOf(k) < 0; });
      } catch (e) { return []; }
    };
    var brOn = function () { return brFields().length > 0; };
    var bdIsNaive = function (d) {
      return typeof d === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(d) && !/[zZ]$/.test(d) && !/[+-]\d{2}:?\d{2}$/.test(d);
    };
    var getTimeZone = function () {
      var cu = currentUser();
      if (cu) {
        try { if (sessionStorage.getItem("pendingTz")) sessionStorage.removeItem("pendingTz"); } catch (e) {}
        return cu.timezone;
      }
      try { return sessionStorage.getItem("pendingTz") || undefined; } catch (e) { return undefined; }
    };
    var branchMoment = function (d) {
      if (typeof d === "string" && /[+-]\d{2}:\d{2}$/.test(d)) return moment.parseZone(d);
      if ((bdOn() || brOn()) && bdIsNaive(d)) return moment.utc(d);
      var tz = getTimeZone();
      return tz ? momentTimezone.utc(d).tz(tz) : moment.utc(d).local();
    };
    //GLOB-1364: the view shows every date as dd/MM/yyyy
    var DATE_FORMAT = "DD/MM/YYYY";
    var formatDate = function (s) { return branchMoment(s).format(DATE_FORMAT); };
    var formatDateShort = function (s) { return branchMoment(s).format(DATE_FORMAT); };
    var setDate = function (s) { return branchMoment(s); };
    var pickerRangeUtc = function (m, unit) {
      unit = unit || "day";
      var fmt = unit === "month" ? "YYYY-MM" : unit === "year" ? "YYYY" : "YYYY-MM-DD";
      var tz = getTimeZone();
      var local = tz ? momentTimezone.tz(m.format(fmt), fmt, tz) : m.clone();
      return [local.clone().startOf(unit).utc().format("YYYY-MM-DD HH:mm:ss"), local.clone().endOf(unit).utc().format("YYYY-MM-DD HH:mm:ss")];
    };
    var getColor = function (entityState) {
      switch (entityState) {
        case "DRAFT":
        case "OPEN":
          return "blue";
        case "ACTIVE":
        case "APROVED":
          return "green";
        case "INACTIVE":
        case "REJECTED":
          return "red";
        default:
          return undefined;
      }
    };
    var CONTACT_NAME_FIELDS = ["name", "middleName", "surname1", "surname2"];
    var LEGACY_CONTACT_NAME_EXPR = "(RTRIM(ISNULL([name],''))+' '+RTRIM(ISNULL(surname1,''))+' '+RTRIM(ISNULL(surname2,'')))";
    var contactNameSqlExpr = function () {
      try {
        var configured = window.global && window.global.configProfile && window.global.configProfile.Contacts ? window.global.configProfile.Contacts.fullNameFields : undefined;
        if (!Array.isArray(configured)) return LEGACY_CONTACT_NAME_EXPR;
        var fields = configured.filter(function (p) { return CONTACT_NAME_FIELDS.indexOf(p) >= 0; });
        if (!fields.length) return LEGACY_CONTACT_NAME_EXPR;
        return "(" + fields.map(function (p) { return "RTRIM(ISNULL([" + p + "],''))"; }).join("+' '+") + ")";
      } catch (e) {
        return LEGACY_CONTACT_NAME_EXPR;
      }
    };
    var SYMBOL_FONT_CLASS = { "\u00EA": { className: "dirham-currency-input" }, "[AED]": { className: "dirham-currency-input", char: "\u00EA" } };
    var isoCurrencyDecimals = function (currency) {
      try {
        var formatter = new Intl.NumberFormat(localStorage.isoCode || "en-US", { style: "currency", currency: currency, minimumFractionDigits: 0 });
        var parts = formatter.formatToParts(0.123);
        var decimalPart = parts.find(function (p) { return p.type === "decimal"; });
        var fractionDigits = parts.find(function (p) { return p.type === "fraction"; });
        return decimalPart ? fractionDigits.value.length : 0;
      } catch (error) {
        return 2;
      }
    };
    var catalogRecord = function (currency) {
      var currencies = window.Cache && window.Cache.RepoCurrency;
      if (!Array.isArray(currencies)) return null;
      var code = String(currency);
      return currencies.find(function (p) { return p.code === code; }) || currencies.find(function (p) { return p.code === code.split("-")[0].substring(0, 3); }) || null;
    };
    var symbolOf = function (record) {
      var symbol = record && record.symbol;
      if (!symbol || SYMBOL_FONT_CLASS[symbol]) return null;
      return symbol;
    };
    var catalogSymbol = function (currency) { return symbolOf(catalogRecord(currency)); };
    var fractionDigitsOf = function (record) {
      var digits = record && record.fractionDigits;
      if (!Number.isInteger(digits) || digits < 0 || digits > 6) return null;
      return digits;
    };
    var getCurrencyDecimals = function (currency) {
      var configured = fractionDigitsOf(catalogRecord(currency));
      return configured !== null ? configured : isoCurrencyDecimals(currency);
    };
    var withCatalogSymbol = function (formatter, symbol) {
      return {
        format: function (v) { return formatter.formatToParts(v).map(function (p) { return p.type === "currency" ? symbol : p.value; }).join(""); },
        formatToParts: function (v) { return formatter.formatToParts(v).map(function (p) { return p.type === "currency" ? Object.assign({}, p, { value: symbol }) : p; }); }
      };
    };
    var currencyFormatter = function (currency) {
      if (!currency) currency = "USD";
      var record = catalogRecord(currency);
      var configuredDecimals = fractionDigitsOf(record);
      var currencyDecimals = configuredDecimals !== null ? configuredDecimals : isoCurrencyDecimals(currency);
      var symbol = symbolOf(record);
      var options = configuredDecimals !== null
        ? { minimumFractionDigits: currencyDecimals, maximumFractionDigits: currencyDecimals }
        : { minimumFractionDigits: currencyDecimals };
      var formatter;
      try {
        formatter = new Intl.NumberFormat(localStorage.isoCode || "en-US", Object.assign({ style: "currency", currency: currency }, options));
      } catch (error) {
        formatter = new Intl.NumberFormat("en-US", Object.assign({ style: "currency", currency: "USD" }, options));
      }
      return symbol ? withCatalogSymbol(formatter, symbol) : formatter;
    };
    var formatMoney = function (v, currency) {
      currency = String(currency || "USD").substring(0, 3);
      return currencyFormatter(currency).format(v);
    };
    var roundMoney = function (num, currency) {
      var decimals = getCurrencyDecimals((currency || "USD").substring(0, 3));
      var factor = Math.pow(10, decimals);
      return Math.round((num + Number.EPSILON) * factor) / factor;
    };
    var getCache = function (item, data, key) {
      if (!window.Cache) window.Cache = {};
      return new Promise(function (resolve) {
        var cache = window.Cache;
        var cacheKey = key || item;
        if (cache[cacheKey]) {
          resolve({ ok: true, outData: cache[cacheKey], cache: true });
        } else if (!cache["fetching_" + cacheKey]) {
          cache["fetching_" + cacheKey] = true;
          exe(item, data ? data : { operation: "GET" })
            .then(function (r) {
              if (r.ok) cache[cacheKey] = r.outData;
              cache["fetching_" + cacheKey] = false;
              resolve(r.ok ? { ok: true, outData: r.outData } : { ok: false, msg: r.msg });
            })
            .catch(function (err) {
              cache["fetching_" + cacheKey] = false;
              resolve({ ok: false, msg: "Error fetching data: " + err.message });
            });
        } else {
          var retries = 0;
          var wait = function () {
            if (cache["fetching_" + cacheKey] && retries < 20) {
              retries++;
              setTimeout(wait, 500);
              return;
            }
            if (retries >= 20) resolve({ ok: false, msg: "Timeout waiting for cache to populate" });
            else resolve({ ok: true, outData: cache[cacheKey], cache: true });
          };
          wait();
        }
      });
    };
    var evalInContext = function (js, context) {
      return function () {
        return eval(js);
      }.call(context);
    };
  
  
    /* ---------- @ant-design/compatible Form.create = rc-form 2.4.12 (createBaseForm + createFieldsStore) ----------
       Port of the parts these screens use. Field names are flat (no "a.b"), so the nested-name helpers collapse to
       plain keys. Validation = async-validator for the rule shapes used here ({required, message}). */
    var FIELD_META_PROP = "data-__meta";
    var FIELD_DATA_PROP = "data-__field";
    //rc-form utils.supportRef: plain function components get no ref (FieldElemWrapper tracks them); forwardRef/class do
    var supportRef = function (node) {
      var type = node.type;
      if (type && typeof Symbol === "function" && type.$$typeof === Symbol.for("react.memo")) type = type.type;
      if (typeof type === "function" && !(type.prototype && type.prototype.render)) return false;
      return true;
    };
    var hasRules = function (validate) {
      if (validate) return validate.some(function (item) { return item.rules && item.rules.length; });
      return false;
    };
    var normalizeValidateRules = function (validate, rules, validateTrigger) {
      var validateRules = validate.map(function (item) {
        var newItem = Object.assign({}, item, { trigger: item.trigger || [] });
        if (typeof newItem.trigger === "string") newItem.trigger = [newItem.trigger];
        return newItem;
      });
      if (rules) validateRules.push({ trigger: validateTrigger ? [].concat(validateTrigger) : [], rules: rules });
      return validateRules;
    };
    var getValidateTriggers = function (validateRules) {
      var out = [];
      validateRules.filter(function (item) { return !!item.rules && item.rules.length; }).forEach(function (item) {
        item.trigger.forEach(function (tr) { if (out.indexOf(tr) < 0) out.push(tr); });
      });
      return out;
    };
    var getValueFromEvent = function (e) {
      if (!e || !e.target) return e;
      var target = e.target;
      return target.type === "checkbox" ? target.checked : target.value;
    };
    //async-validator 1.x: a rule whose only key (besides message) is "required" uses the required validator, which
    //types the value itself; empty = undefined/null, [] for arrays, "" for strings
    var asyncIsEmpty = function (value, type) {
      if (value === undefined || value === null) return true;
      if (type === "array" && Array.isArray(value) && !value.length) return true;
      if (type === "string" && typeof value === "string" && !value) return true;
      return false;
    };
    var runRules = function (name, rules, value) {
      var errors = [];
      (rules || []).forEach(function (rule) {
        if (typeof rule.validator === "function") {
          rule.validator(rule, value, function (msg) { if (msg) errors.push({ message: msg.message || msg, field: name }); }, {}, {});
          return;
        }
        var keys = Object.keys(rule).filter(function (k) { return k !== "message"; });
        var type = keys.length === 1 && keys[0] === "required" ? (Array.isArray(value) ? "array" : typeof value) : (rule.type || "string");
        if (rule.required && asyncIsEmpty(value, type)) errors.push({ message: rule.message || name + " is required", field: name });
      });
      return errors.length ? errors : undefined;
    };
    var FieldsStore = function () {
      this.fields = {};
      this.fieldsMeta = {};
    };
    FieldsStore.prototype.getFieldMeta = function (name) {
      this.fieldsMeta[name] = this.fieldsMeta[name] || {};
      return this.fieldsMeta[name];
    };
    FieldsStore.prototype.getValueFromFields = function (name, fields) {
      var field = fields[name];
      if (field && "value" in field) return field.value;
      var fieldMeta = this.getFieldMeta(name);
      return fieldMeta && fieldMeta.initialValue;
    };
    FieldsStore.prototype.getAllFieldsName = function () { return Object.keys(this.fieldsMeta); };
    FieldsStore.prototype.getValidFieldsName = function () {
      var me = this;
      return Object.keys(this.fieldsMeta).filter(function (name) { return !me.getFieldMeta(name).hidden; });
    };
    FieldsStore.prototype.flattenRegisteredFields = function (fields) {
      var valid = this.getAllFieldsName();
      var out = {};
      if (!fields) return out;
      Object.keys(fields).forEach(function (k) { if (valid.indexOf(k) >= 0) out[k] = fields[k]; });
      return out;
    };
    FieldsStore.prototype.setFields = function (fields) {
      var me = this;
      var nowFields = Object.assign({}, this.fields, fields);
      var nowValues = {};
      Object.keys(this.fieldsMeta).forEach(function (f) { nowValues[f] = me.getValueFromFields(f, nowFields); });
      Object.keys(nowValues).forEach(function (f) {
        var value = nowValues[f];
        var fieldMeta = me.getFieldMeta(f);
        if (fieldMeta && fieldMeta.normalize) {
          var nowValue = fieldMeta.normalize(value, me.getValueFromFields(f, me.fields), nowValues);
          if (nowValue !== value) nowFields[f] = Object.assign({}, nowFields[f], { value: nowValue });
        }
      });
      this.fields = nowFields;
    };
    FieldsStore.prototype.resetFields = function () {
      var fields = this.fields;
      return this.getAllFieldsName().reduce(function (acc, name) {
        var field = fields[name];
        if (field && "value" in field) acc[name] = {};
        return acc;
      }, {});
    };
    FieldsStore.prototype.setFieldsAsDirty = function () {
      var me = this;
      Object.keys(this.fields).forEach(function (name) {
        var field = me.fields[name];
        var fieldMeta = me.fieldsMeta[name];
        if (field && fieldMeta && hasRules(fieldMeta.validate)) me.fields[name] = Object.assign({}, field, { dirty: true });
      });
    };
    FieldsStore.prototype.getField = function (name) { return Object.assign({}, this.fields[name], { name: name }); };
    FieldsStore.prototype.getFieldValuePropValue = function (fieldMeta) {
      var field = this.getField(fieldMeta.name);
      var fieldValue = "value" in field ? field.value : fieldMeta.initialValue;
      if (fieldMeta.getValueProps) return fieldMeta.getValueProps(fieldValue);
      var o = {};
      o[fieldMeta.valuePropName] = fieldValue;
      return o;
    };
    FieldsStore.prototype.getFieldValue = function (name) { return this.getValueFromFields(name, this.fields); };
    FieldsStore.prototype.getFieldsValue = function (names) {
      var me = this;
      return (names || this.getValidFieldsName()).reduce(function (acc, f) {
        acc[f] = me.getFieldValue(f);
        return acc;
      }, {});
    };
    FieldsStore.prototype.getFieldError = function (name) {
      var errors = this.getField(name).errors;
      return errors ? errors.map(function (e) { return e && e.message ? e.message : e; }) : errors;
    };
    FieldsStore.prototype.clearField = function (name) {
      delete this.fields[name];
      delete this.fieldsMeta[name];
    };
  
    //rc-form FieldElemWrapper: a decorated element mounted/unmounted marks the field as in the DOM / clears it
    var FieldElemWrapper = class extends React.Component {
      componentDidMount() {
        var form = this.props.form;
        form.domFields[this.props.name] = true;
        form.recoverClearedField(this.props.name);
      }
      componentWillUnmount() {
        var form = this.props.form;
        var name = this.props.name;
        var fieldMeta = form.fieldsStore.getFieldMeta(name);
        if (!fieldMeta.preserve) {
          form.clearedFieldMetaCache[name] = { field: form.fieldsStore.getField(name), meta: fieldMeta };
          form.clearField(name);
        }
        delete form.domFields[name];
      }
      render() {
        return this.props.children;
      }
    };
  
    var createForm = function (WrappedComponent) {
      return class extends React.Component {
        constructor(props) {
          super(props);
          var me = this;
          this.fieldsStore = new FieldsStore();
          this.cachedBind = {};
          this.clearedFieldMetaCache = {};
          this.renderFields = {};
          this.domFields = {};
          this.instances = {};
          ["getFieldDecorator", "getFieldProps", "setFields", "setFieldsValue", "resetFields", "validateFields", "clearField", "recoverClearedField", "onCollect", "onCollectValidate", "saveRef"].forEach(function (k) {
            me[k] = me[k].bind(me);
          });
        }
        componentDidMount() { this.cleanUpUselessFields(); }
        componentDidUpdate() { this.cleanUpUselessFields(); }
        cleanUpUselessFields() {
          var me = this;
          var removed = this.fieldsStore.getAllFieldsName().filter(function (field) {
            var fieldMeta = me.fieldsStore.getFieldMeta(field);
            return !me.renderFields[field] && !me.domFields[field] && !fieldMeta.preserve;
          });
          removed.forEach(function (n) { me.clearField(n); });
          this.renderFields = {};
        }
        clearField(name) {
          this.fieldsStore.clearField(name);
          delete this.instances[name];
          delete this.cachedBind[name];
        }
        //rc-form saveRef: antd Input/InputNumber/Checkbox/AutoComplete/pickers set their ref with useImperativeHandle without
        //deps, so on every re-render the ref is called with null (field cleared and cached) and again with the handle (field
        //recovered through fieldsStore.setFields, which runs every normalize, and its meta moved to the end)
        saveRef(name, _, component) {
          if (!component) {
            var fm = this.fieldsStore.getFieldMeta(name);
            if (!fm.preserve) {
              this.clearedFieldMetaCache[name] = { field: this.fieldsStore.getField(name), meta: fm };
              this.clearField(name);
            }
            delete this.domFields[name];
            return;
          }
          this.domFields[name] = true;
          this.recoverClearedField(name);
          var fieldMeta = this.fieldsStore.getFieldMeta(name);
          if (fieldMeta) {
            var ref = fieldMeta.ref;
            if (ref) {
              if (typeof ref === "function") ref(component);
              else if (Object.prototype.hasOwnProperty.call(ref, "current")) ref.current = component;
            }
          }
          this.instances[name] = component;
        }
        recoverClearedField(name) {
          if (this.clearedFieldMetaCache[name]) {
            var f = {};
            f[name] = this.clearedFieldMetaCache[name].field;
            this.fieldsStore.setFields(f);
            this.fieldsStore.fieldsMeta[name] = this.clearedFieldMetaCache[name].meta;
            delete this.clearedFieldMetaCache[name];
          }
        }
        onCollectCommon(name, action, args) {
          var fieldMeta = this.fieldsStore.getFieldMeta(name);
          if (fieldMeta[action]) fieldMeta[action].apply(fieldMeta, args);
          else if (fieldMeta.originalProps && fieldMeta.originalProps[action]) fieldMeta.originalProps[action].apply(fieldMeta.originalProps, args);
          var value = fieldMeta.getValueFromEvent ? fieldMeta.getValueFromEvent.apply(fieldMeta, args) : getValueFromEvent.apply(undefined, args);
          var field = this.fieldsStore.getField(name);
          return { name: name, field: Object.assign({}, field, { value: value, touched: true }), fieldMeta: fieldMeta };
        }
        onCollect(name_, action) {
          var args = Array.prototype.slice.call(arguments, 2);
          var c = this.onCollectCommon(name_, action, args);
          this.fieldsStore.setFieldsAsDirty();
          var nf = {};
          nf[c.name] = Object.assign({}, c.field, { dirty: hasRules(c.fieldMeta.validate) });
          this.setFields(nf);
        }
        onCollectValidate(name_, action) {
          var args = Array.prototype.slice.call(arguments, 2);
          var c = this.onCollectCommon(name_, action, args);
          var newField = Object.assign({}, c.field, { dirty: true });
          this.fieldsStore.setFieldsAsDirty();
          this.validateFieldsInternal([newField], { action: action, options: {} });
        }
        getCacheBind(name, action, fn) {
          if (!this.cachedBind[name]) this.cachedBind[name] = {};
          var cache = this.cachedBind[name];
          if (!cache[action] || cache[action].oriFn !== fn) cache[action] = { fn: fn.bind(this, name, action), oriFn: fn };
          return cache[action].fn;
        }
        getFieldDecorator(name, fieldOption) {
          var me = this;
          var props = this.getFieldProps(name, fieldOption);
          return function (fieldElem) {
            me.renderFields[name] = true;
            var fieldMeta = me.fieldsStore.getFieldMeta(name);
            var originalProps = fieldElem.props;
            fieldMeta.originalProps = originalProps;
            fieldMeta.ref = fieldElem.ref;
            var decorated = React.cloneElement(fieldElem, Object.assign({}, props, me.fieldsStore.getFieldValuePropValue(fieldMeta)));
            return supportRef(fieldElem) ? decorated : <FieldElemWrapper name={name} form={me}>{decorated}</FieldElemWrapper>;
          };
        }
        getFieldProps(name, usersFieldOption) {
          var me = this;
          usersFieldOption = usersFieldOption || {};
          delete this.clearedFieldMetaCache[name];
          var fieldOption = Object.assign({ name: name, trigger: "onChange", valuePropName: "value", validate: [] }, usersFieldOption);
          var rules = fieldOption.rules;
          var trigger = fieldOption.trigger;
          var validateTrigger = fieldOption.validateTrigger === undefined ? trigger : fieldOption.validateTrigger;
          var validate = fieldOption.validate;
          var fieldMeta = this.fieldsStore.getFieldMeta(name);
          if ("initialValue" in fieldOption) fieldMeta.initialValue = fieldOption.initialValue;
          var inputProps = Object.assign({}, this.fieldsStore.getFieldValuePropValue(fieldOption), { ref: this.getCacheBind(name, name + "__ref", this.saveRef) });
          inputProps.id = name;
          var validateRules = normalizeValidateRules(validate, rules, validateTrigger);
          var validateTriggers = getValidateTriggers(validateRules);
          validateTriggers.forEach(function (action) {
            if (inputProps[action]) return;
            inputProps[action] = me.getCacheBind(name, action, me.onCollectValidate);
          });
          if (trigger && validateTriggers.indexOf(trigger) === -1) inputProps[trigger] = this.getCacheBind(name, trigger, this.onCollect);
          var meta = Object.assign({}, fieldMeta, fieldOption, { validate: validateRules });
          this.fieldsStore.fieldsMeta[name] = meta;
          inputProps[FIELD_META_PROP] = meta;
          inputProps[FIELD_DATA_PROP] = this.fieldsStore.getField(name);
          this.renderFields[name] = true;
          return inputProps;
        }
        getRules(fieldMeta, action) {
          var out = [];
          fieldMeta.validate.filter(function (item) { return !action || item.trigger.indexOf(action) >= 0; }).forEach(function (item) { out = out.concat(item.rules); });
          return out;
        }
        setFields(fields, callback) {
          this.fieldsStore.setFields(this.fieldsStore.flattenRegisteredFields(fields));
          this.forceUpdate(callback);
        }
        setFieldsValue(changedValues, callback) {
          var fieldsMeta = this.fieldsStore.fieldsMeta;
          var values = this.fieldsStore.flattenRegisteredFields(changedValues);
          var newFields = Object.keys(values).reduce(function (acc, name) {
            if (fieldsMeta[name]) acc[name] = { value: values[name] };
            return acc;
          }, {});
          this.setFields(newFields, callback);
        }
        resetFields() {
          var newFields = this.fieldsStore.resetFields();
          if (Object.keys(newFields).length > 0) this.setFields(newFields);
          this.clearedFieldMetaCache = {};
        }
        validateFieldsInternal(fields, opts, callback) {
          var me = this;
          var allRules = {};
          var allValues = {};
          var allFields = {};
          var alreadyErrors = {};
          fields.forEach(function (field) {
            var name = field.name;
            if (field.dirty === false) {
              if (field.errors) alreadyErrors[name] = { errors: field.errors };
              return;
            }
            var fieldMeta = me.fieldsStore.getFieldMeta(name);
            var newField = Object.assign({}, field);
            newField.errors = undefined;
            newField.validating = true;
            newField.dirty = true;
            allRules[name] = me.getRules(fieldMeta, opts.action);
            allValues[name] = newField.value;
            allFields[name] = newField;
          });
          this.setFields(allFields);
          Object.keys(allValues).forEach(function (f) { allValues[f] = me.fieldsStore.getFieldValue(f); });
          if (callback && Object.keys(allFields).length === 0) {
            callback(Object.keys(alreadyErrors).length === 0 ? null : alreadyErrors, this.fieldsStore.getFieldsValue(opts.fieldNames));
            return;
          }
          var errorsGroup = Object.assign({}, alreadyErrors);
          Object.keys(allRules).forEach(function (name) {
            var errs = runRules(name, allRules[name], allValues[name]);
            if (errs) errorsGroup[name] = { errors: errs };
          });
          var nowAllFields = {};
          Object.keys(allRules).forEach(function (name) {
            var fieldErrors = errorsGroup[name];
            var nowField = me.fieldsStore.getField(name);
            nowField.errors = fieldErrors && fieldErrors.errors;
            nowField.value = allValues[name];
            nowField.validating = false;
            nowField.dirty = false;
            nowAllFields[name] = nowField;
          });
          this.setFields(nowAllFields);
          if (callback) callback(Object.keys(errorsGroup).length === 0 ? null : errorsGroup, this.fieldsStore.getFieldsValue(opts.fieldNames));
        }
        validateFields(ns, opt, cb) {
          var me = this;
          var callback = typeof ns === "function" ? ns : typeof opt === "function" ? opt : cb;
          var fieldNames = this.fieldsStore.getValidFieldsName();
          var fields = fieldNames.filter(function (name) {
            return hasRules(me.fieldsStore.getFieldMeta(name).validate);
          }).map(function (name) {
            var field = me.fieldsStore.getField(name);
            field.value = me.fieldsStore.getFieldValue(name);
            return field;
          });
          if (!fields.length) {
            if (callback) callback(null, this.fieldsStore.getFieldsValue(fieldNames));
            return;
          }
          this.validateFieldsInternal(fields, { fieldNames: fieldNames, options: {} }, callback);
        }
        getForm() {
          var s = this.fieldsStore;
          return {
            getFieldsValue: s.getFieldsValue.bind(s),
            getFieldValue: s.getFieldValue.bind(s),
            getFieldError: s.getFieldError.bind(s),
            setFieldsValue: this.setFieldsValue,
            setFields: this.setFields,
            getFieldDecorator: this.getFieldDecorator,
            getFieldProps: this.getFieldProps,
            validateFields: this.validateFields,
            resetFields: this.resetFields
          };
        }
        render() {
          return <WrappedComponent {...this.props} form={this.getForm()} />;
        }
      };
    };
  
    //@ant-design/compatible Form / Form.Item (DOM of ant-legacy-form)
    var LegacyFormContext = React.createContext({ labelAlign: "right", vertical: false });
    var LegacyForm = function (props) {
      var layout = props.layout || "horizontal";
      var cls = ["ant-legacy-form"];
      if (layout === "horizontal") cls.push("ant-legacy-form-horizontal");
      if (layout === "vertical") cls.push("ant-legacy-form-vertical");
      if (layout === "inline") cls.push("ant-legacy-form-inline");
      if (props.hideRequiredMark) cls.push("ant-legacy-form-hide-required-mark");
      if (props.className) cls.push(props.className);
      var colon = props.colon === undefined ? true : props.colon;
      return (
        <LegacyFormContext.Provider value={{ wrapperCol: props.wrapperCol, labelAlign: props.labelAlign, labelCol: props.labelCol, vertical: layout === "vertical", colon: colon }}>
          <form style={props.style} onSubmit={props.onSubmit || function (e) { e.preventDefault(); }} className={cls.join(" ")}>
            {props.children}
          </form>
        </LegacyFormContext.Provider>
      );
    };
    var getControls = function (children, recursively) {
      var controls = [];
      var arr = React.Children.toArray(children);
      for (var i = 0; i < arr.length; i += 1) {
        if (!recursively && controls.length > 0) break;
        var child = arr[i];
        if (child.type && (child.type === LegacyFormItem || child.type.displayName === "FormItem")) continue;
        if (!child.props) continue;
        if (FIELD_META_PROP in child.props) controls.push(child);
        else if (child.props.children) controls = controls.concat(getControls(child.props.children, recursively));
      }
      return controls;
    };
    var LegacyFormItem = function (props) {
      var ctx = useContext(LegacyFormContext);
      var rootRef = useRef(null);
      var onlyControl = getControls(props.children, false)[0] || null;
      var childProp = function (p) { return onlyControl && onlyControl.props && onlyControl.props[p]; };
      var field = childProp(FIELD_DATA_PROP);
      var meta = childProp(FIELD_META_PROP);
      var help = props.help;
      if (help === undefined && onlyControl) {
        help = "";
        if (field.errors) {
          help = field.errors.map(function (e) { return e.message; }).reduce(function (cur, item) { return cur.concat([" ", item]); }, []).slice(1);
        }
      }
      var validateStatus = props.validateStatus;
      if (validateStatus === undefined && onlyControl) {
        validateStatus = "";
        if (field.validating) validateStatus = "validating";
        else if (field.errors) validateStatus = "error";
        else {
          var fv = "value" in field ? field.value : meta.initialValue;
          if (fv !== undefined && fv !== null && fv !== "") validateStatus = "success";
        }
      }
      var required = props.required;
      if (required === undefined) {
        required = false;
        if (onlyControl) {
          var validate = (meta || {}).validate || [];
          required = validate.filter(function (item) { return !!item.rules; }).some(function (item) { return item.rules.some(function (rule) { return rule.required; }); });
        }
      }
      var id = props.id || childProp("id");
      var helpShow = !!(help && (Array.isArray(help) ? help.length : true));
      var itemCls = "ant-legacy-form-item" + (helpShow ? " ant-legacy-form-item-with-help" : "") + (props.className ? " " + props.className : "");
      var labelCol = ("labelCol" in props ? props.labelCol : ctx.labelCol) || {};
      var labelAlign = "labelAlign" in props ? props.labelAlign : ctx.labelAlign;
      var computedColon = props.colon === true || (ctx.colon !== false && props.colon !== false);
      var haveColon = computedColon && !ctx.vertical;
      var labelChildren = props.label;
      if (haveColon && typeof props.label === "string" && props.label.trim() !== "") labelChildren = props.label.replace(/[\uFF1A:]\s*$/, "");
      var labelClassName = [required ? "ant-legacy-form-item-required" : "", !computedColon ? "ant-legacy-form-item-no-colon" : ""].filter(Boolean).join(" ");
      var labelColCls = ["ant-legacy-form-item-label", labelAlign === "left" ? "ant-legacy-form-item-label-left" : "", labelCol.className || ""].filter(Boolean).join(" ");
      var wrapperCol = ("wrapperCol" in props ? props.wrapperCol : ctx.wrapperCol) || {};
      var wrapperCls = ["ant-legacy-form-item-control-wrapper", wrapperCol.className || ""].filter(Boolean).join(" ");
      var ctrlCls = "ant-legacy-form-item-control";
      if (validateStatus) {
        ctrlCls = ["ant-legacy-form-item-control", props.hasFeedback || validateStatus === "validating" ? "has-feedback" : "", validateStatus === "success" ? "has-success" : "", validateStatus === "warning" ? "has-warning" : "", validateStatus === "error" ? "has-error" : "", validateStatus === "validating" ? "is-validating" : ""].filter(Boolean).join(" ");
      }
      var onLabelClick = function () {
        if (!id || !rootRef.current) return;
        var control = rootRef.current.querySelector('[id="' + id + '"]');
        if (control && control.focus) control.focus();
      };
      var rest = {};
      var omitKeys = ["prefixCls", "style", "className", "children", "id", "htmlFor", "label", "labelAlign", "labelCol", "wrapperCol", "help", "extra", "validateStatus", "hasFeedback", "required", "colon"];
      Object.keys(props).forEach(function (k) { if (omitKeys.indexOf(k) < 0) rest[k] = props[k]; });
      var labelColProps = Object.assign({}, labelCol, { className: labelColCls });
      var wrapperColProps = Object.assign({}, wrapperCol, { className: wrapperCls });
      return (
        <Row className={itemCls} style={props.style} {...rest} ref={rootRef}>
          {props.label ? (
            <Col {...labelColProps}>
              <label htmlFor={props.htmlFor || id} className={labelClassName} title={typeof props.label === "string" ? props.label : ""} onClick={onLabelClick}>
                {labelChildren}
              </label>
            </Col>
          ) : null}
          <LegacyFormContext.Provider value={{ vertical: ctx.vertical }}>
            <Col {...wrapperColProps}>
              <div className={ctrlCls}>
                <span className="ant-legacy-form-item-children">{props.children}</span>
                {helpShow ? <div className="ant-legacy-form-explain">{help}</div> : null}
                {props.extra ? <div className="ant-legacy-form-extra">{props.extra}</div> : null}
              </div>
            </Col>
          </LegacyFormContext.Provider>
        </Row>
      );
    };
    LegacyForm.Item = LegacyFormItem;
    LegacyForm.create = function () { return createForm; };
  
  
    var DatePickerW = function (props) {
      var s = useState(undefined);
      var value = s[0];
      var setValue = s[1];
      useEffect(function () {
        setValue(typeof props.value === "string" ? setDate(props.value) : props.value);
      }, [props.value]);
      var onChange = function (v) {
        setValue(v);
        if (props.onChange) props.onChange(v);
      };
      return <DatePicker format={DATE_FORMAT} {...props} value={value} onChange={function (v) { onChange(v); }} />;
    };
    var DEFAULT_CURRENCY_RECORD = { code: "USD", symbol: "$", thousandSeparator: ",", decimalSeparator: ".", currencyDecimals: 2 };
    var toNumericString = function (num) {
      num += "";
      var sign = num[0] === "-" ? "-" : "";
      if (sign) num = num.substring(1);
      var sp = num.split(/[eE]/g);
      var coefficient = sp[0];
      var exponent = Number(sp[1]);
      if (!exponent) return sign + coefficient;
      coefficient = coefficient.replace(".", "");
      var decimalIndex = 1 + exponent;
      var coffiecientLn = coefficient.length;
      if (decimalIndex < 0) coefficient = "0." + new Array(decimalIndex * -1 + 1).join("0") + coefficient;
      else if (decimalIndex >= coffiecientLn) coefficient = coefficient + new Array(decimalIndex - coffiecientLn + 1).join("0");
      else coefficient = (coefficient.substring(0, decimalIndex) || "0") + "." + coefficient.substring(decimalIndex);
      return sign + coefficient;
    };
    var splitDecimal = function (numStr) {
      var hasNegation = numStr[0] === "-";
      numStr = numStr.replace("-", "");
      var parts = numStr.split(".");
      return { beforeDecimal: parts[0], afterDecimal: parts[1] || "", hasNegation: hasNegation, addNegation: hasNegation };
    };
    var limitToScale = function (numStr, scale) {
      var str = "";
      for (var i = 0; i <= scale - 1; i++) str += numStr[i] || "";
      return str;
    };
    var roundToPrecision = function (numStr, scale) {
      if (["", "-"].indexOf(numStr) !== -1) return numStr;
      var shouldHaveDecimalSeparator = numStr.indexOf(".") !== -1 && scale;
      var sd = splitDecimal(numStr);
      var floatValue = parseFloat("0." + (sd.afterDecimal || "0"));
      var floatValueStr = sd.afterDecimal.length <= scale ? "0." + sd.afterDecimal : floatValue.toFixed(scale);
      var roundedDecimalParts = floatValueStr.split(".");
      var intPart = sd.beforeDecimal.split("").reverse().reduce(function (roundedStr, current, idx) {
        if (roundedStr.length > idx) return (Number(roundedStr[0]) + Number(current)).toString() + roundedStr.substring(1, roundedStr.length);
        return current + roundedStr;
      }, roundedDecimalParts[0]);
      var decimalPart = limitToScale(roundedDecimalParts[1] || "", scale);
      return (sd.hasNegation ? "-" : "") + intPart + (shouldHaveDecimalSeparator ? "." : "") + decimalPart;
    };
    var applyThousandSeparator = function (str, sep) {
      var index = str.search(/[1-9]/);
      index = index === -1 ? str.length : index;
      return str.substring(0, index) + str.substring(index, str.length).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1" + sep);
    };
    var Money = function (props) {
      var s1 = useState(DEFAULT_CURRENCY_RECORD);
      var currencyRecord = s1[0];
      var setCurrencyRecord = s1[1];
      var s2 = useState(null);
      var typed = s2[0];
      var setTyped = s2[1];
      var lastShown = useRef(undefined);
      var lastValue = useRef(undefined);
      useEffect(function () {
        if (props.currency) {
          getCache("RepoCurrency").then(function (r) {
            var record = DEFAULT_CURRENCY_RECORD;
            if (r.ok) {
              var r1 = r.outData.find(function (p) { return p.code === props.currency; });
              if (r1) record = r1;
            }
            var currency = props.currency.split("-")[0];
            var currencyDecimals = getCurrencyDecimals(currency);
            var parts = currencyFormatter(currency).formatToParts(10000);
            var decimalSeparator = parts.find(function (p) { return p.type === "decimal"; });
            var thousandSeparator = parts.find(function (p) { return p.type === "group"; });
            var symbol = parts.find(function (p) { return p.type === "currency"; });
            var font = SYMBOL_FONT_CLASS[record.symbol];
            setCurrencyRecord({
              code: props.currency,
              symbol: ((font && font.char) || record.symbol) || (symbol ? symbol.value : DEFAULT_CURRENCY_RECORD.symbol),
              decimalSeparator: currencyDecimals == 0 ? "%" : (decimalSeparator ? decimalSeparator.value : DEFAULT_CURRENCY_RECORD.decimalSeparator),
              thousandSeparator: thousandSeparator ? thousandSeparator.value : DEFAULT_CURRENCY_RECORD.thousandSeparator,
              currencyDecimals: currencyDecimals
            });
            if (props.forceRefresh && props.onChange) props.onChange(props.value);
          });
        }
      }, [props.currency]);
      var thou = currencyRecord.thousandSeparator || DEFAULT_CURRENCY_RECORD.thousandSeparator;
      var dec = currencyRecord.decimalSeparator || DEFAULT_CURRENCY_RECORD.decimalSeparator;
      var scale = currencyRecord.currencyDecimals;
      var prefix = (currencyRecord.symbol || DEFAULT_CURRENCY_RECORD.symbol) + " ";
      var formatNumStr = function (numStr) {
        if (numStr === "" || numStr === "-") return numStr;
        var sd = splitDecimal(numStr);
        var before = sd.beforeDecimal;
        var after = sd.afterDecimal;
        var hasDecimalSeparator = scale !== 0 && numStr.indexOf(".") !== -1;
        if (scale !== undefined) after = limitToScale(after, scale);
        if (thou) before = applyThousandSeparator(before, thou);
        before = prefix + before;
        if (sd.addNegation) before = "-" + before;
        return before + ((hasDecimalSeparator && dec) || "") + after;
      };
      var hasValue = props.value !== null && props.value !== undefined && !(typeof props.value === "number" && isNaN(props.value));
      var incoming = hasValue ? roundToPrecision(toNumericString(props.value), scale) : "";
      var fromProps = hasValue ? formatNumStr(incoming) : "";
      var typedFloat = typed === null ? undefined : parseFloat(typed);
      var shown = typed !== null && (typedFloat === props.value || (isNaN(typedFloat) && !hasValue)) ? formatNumStr(typed) : fromProps;
      useEffect(function () {
        //react-number-format reports a value whose formatting changed (currency loaded) while the value itself did not
        if (lastShown.current !== undefined && typed === null && fromProps !== lastShown.current && lastValue.current === props.value) {
          var fv = parseFloat(incoming);
          if (props.onChange) props.onChange(isNaN(fv) ? undefined : fv);
        }
        lastShown.current = fromProps;
        lastValue.current = props.value;
      });
      if (props.disabled) {
        return <Input disabled value={props.value !== null && props.value !== undefined ? formatMoney(props.value, props.currency) : ""} style={Object.assign({}, props.style, { width: "100%" })} />;
      }
      var removeFormatting = function (raw) {
        var s = raw;
        if (s.indexOf(prefix) >= 0) s = s.split(prefix).join("");
        else s = s.split(prefix.trim()).join("");
        var neg = s.indexOf("-") >= 0;
        var allowed = scale > 0;
        var idx = allowed ? s.indexOf(dec) : -1;
        if (allowed && idx < 0 && dec !== "." && thou !== ".") idx = s.indexOf(".");
        var intPart = (idx >= 0 ? s.substring(0, idx) : s).replace(/[^0-9]/g, "");
        var decPart = idx >= 0 ? s.substring(idx + 1).replace(/[^0-9]/g, "") : "";
        if (idx >= 0) decPart = limitToScale(decPart, scale);
        return (neg ? "-" : "") + intPart + (idx >= 0 ? "." + decPart : "");
      };
      var onChange = function (e) {
        var numStr = removeFormatting(e.target.value);
        setTyped(numStr);
        var fv = parseFloat(numStr);
        if (props.onChange) props.onChange(isNaN(fv) ? undefined : fv);
      };
      var font = SYMBOL_FONT_CLASS[currencyRecord.symbol];
      return (
        <Input
          className={font ? font.className : undefined}
          value={shown}
          inputMode="numeric"
          onChange={onChange}
          onBlur={function () { setTyped(null); }}
          style={Object.assign({}, props.style, { width: "100%" })}
          disabled={props.disabled}
        />
      );
    };
  
  
    /* ---------- Shared/Currency (+ Currency.Flag) ---------- */
    var CURRENCIES = [
      { code: "EUR", name: "EUR" }, { code: "USD", name: "USD" }, { code: "GBP", name: "GBP" }, { code: "JPY", name: "JPY" },
      { code: "CNY", name: "CNY" }, { code: "KRW", name: "KRW" }, { code: "RON", name: "RON" }, { code: "LOC", name: "LOC" }
    ];
    var Currency = function (props) {
      var s1 = useState(false);
      var loading = s1[0];
      var setLoading = s1[1];
      var s2 = useState(CURRENCIES);
      var allData = s2[0];
      var setAllData = s2[1];
      var configContext = useContext(A.ConfigProvider.ConfigContext);
      var direction = configContext.direction;
      useEffect(function () {
        setLoading(true);
        getCache("RepoCurrency").then(function (r) {
          setLoading(false);
          setAllData(r.outData.filter(function (d) { return d.enabled; }));
        });
      }, []);
      var data = props.filter ? allData.filter(function (p) { return props.filter.split(",").indexOf(p.code) >= 0; }) : allData;
      return (
        <Select disabled={props.disabled} style={props.style} value={props.value} onChange={props.onChange} allowClear loading={loading} placeholder={t("Currency")}>
          {data.map(function (p) {
            return (
              <Select.Option value={p.code} key={p.code} disabled={props.excluded && props.excluded.indexOf(p.code) >= 0}>
                <div style={Object.assign({ marginTop: 3 }, direction == "rtl" ? { marginLeft: 5 } : { marginRight: 5 })} className={"currency-flag currency-flag-sm currency-flag-" + p.code.toLowerCase()} />
                {p.name}
              </Select.Option>
            );
          })}
        </Select>
      );
    };
    Currency.Flag = function (props) {
      if (!props.currency) return null;
      var flag = <div style={{ marginLeft: 5, marginRight: 5, marginTop: 3 }} className={"currency-flag currency-flag-sm currency-flag-" + props.currency.toLowerCase()} />;
      var display = props.display;
      if (display === undefined || display === null) return flag;
      var parts = [];
      if (display.showCode === true) parts.push(props.currency);
      if (display.showSymbol === true) {
        var symbol = catalogSymbol(props.currency);
        if (symbol) parts.push(symbol);
      }
      if (parts.length === 0) return flag;
      return (
        <div style={{ display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
          {display.showFlag !== false && flag}
          <span>{parts.join(" - ")}</span>
        </div>
      );
    };
  
    /* ---------- Shared selects of the filter and the request ---------- */
    //query-string parse of the hash, only for Main.filterLobBySection (section=)
    var hashQuery = function (hash) {
      var out = {};
      var s = String(hash || "");
      var q = s.indexOf("?");
      s = q >= 0 ? s.slice(q + 1) : s.replace(/^[?#&]/, "");
      s.split("&").forEach(function (pair) {
        if (!pair) return;
        var i = pair.indexOf("=");
        var k = decodeURIComponent((i >= 0 ? pair.slice(0, i) : pair).replace(/\+/g, " "));
        var v = i >= 0 ? decodeURIComponent(pair.slice(i + 1).replace(/\+/g, " ")) : null;
        out[k] = v;
      });
      return out;
    };
    var LobSelect = function (props) {
      var s1 = useState([]);
      var data = s1[0];
      var setData = s1[1];
      var s2 = useState();
      var filter = s2[0];
      var setFilter = s2[1];
      var s3 = useState([]);
      var hiddenLobs = s3[0];
      var setHiddenLobs = s3[1];
      useEffect(function () {
        if (data.length == 0) load();
      }, []);
      useEffect(function () {
        if (props.filterLobBySection) {
          getConfigProfile().then(function (profile) {
            var filterLobBySection = safeGetRaw(["Main", "filterLobBySection"], profile, false);
            if (filterLobBySection) {
              var qs = hashQuery(window.location.hash);
              if (qs.section) setFilter(qs.section.toUpperCase());
              else setFilter();
            } else setFilter();
            var lobVisibility = safeGetRaw(["Main", "lobVisibility"], profile, undefined);
            if (lobVisibility && Array.isArray(lobVisibility)) {
              var hidden = [];
              var cu = window.GLOBAL && window.GLOBAL.currentUser;
              var userGroups = (cu && cu.Groups ? cu.Groups.map(function (g) { return g.name; }) : null) || [];
              lobVisibility.forEach(function (lob) {
                if (!lob.groups.some(function (g) { return userGroups.indexOf(g) >= 0; })) hidden.push(lob.lob);
              });
              setHiddenLobs(hidden);
            }
          });
        } else setFilter();
      }, [window.location.hash]);
      useEffect(function () {
        if (props.filterLobBySection && props.excludedLobs) {
          if (filter) props.excludedLobs(data.filter(function (f) { return f.productType.toUpperCase() !== filter; }).map(function (m) { return m.code; }).concat(hiddenLobs));
          else props.excludedLobs(hiddenLobs);
        }
      }, [data.length, filter, hiddenLobs]);
      var load = function () {
        getCache("RepoLob").then(function (r) {
          setData(r.outData || []);
        });
      };
      return (
        <div style={{ position: "relative" }}>
          <Select style={{ width: "100%" }} onChange={props.onChange} value={props.value} disabled={props.disabled} showSearch allowClear showArrow={true} placeholder={props.placeholder || t("Please select LoB")}>
            {data.filter(function (f) { return filter ? f.productType.toUpperCase() === filter : true; }).filter(function (f) { return hiddenLobs.indexOf(f.code) < 0; }).map(function (d) {
              return <Select.Option key={d.code} value={d.code}>{t(d.name)}</Select.Option>;
            })}
          </Select>
        </div>
      );
    };
    var Compare = function (props) {
      var s1 = useState(false);
      var isBetween = s1[0];
      var setIsBetween = s1[1];
      useEffect(function () {
        if (!props.value) setIsBetween(false);
      }, [props.value]);
      var getSymbol = function () {
        if (isBetween) return props.value ? " BETWEEN " : "";
        return props.value ? props.value.charAt(0) : "";
      };
      var getNumber = function () {
        if (isBetween) return "";
        return props.value ? props.value.slice(1) : "";
      };
      var getLowerNumber = function () {
        return props.value ? (props.value.split(" BETWEEN ")[1].split(" AND ")[0] || "") : "";
      };
      var getUpperNumber = function () {
        return props.value ? (props.value.split(" AND ")[1] || "") : "";
      };
      var onChange = function (s, n) {
        if (s !== undefined) {
          setIsBetween(s === " BETWEEN ");
          props.onChange(s + getNumber());
        }
        if (n !== undefined) props.onChange(getSymbol() + n);
      };
      var onChangeBetween = function (lower, upper) {
        if (lower !== undefined) props.onChange(" BETWEEN " + lower + " AND " + getUpperNumber());
        if (upper !== undefined) props.onChange(" BETWEEN " + getLowerNumber() + " AND " + upper);
      };
      var onClear = function () {
        props.onChange(undefined);
        setIsBetween(false);
      };
      return (
        <div style={{ display: "flex" }}>
          <Select allowClear onClear={onClear} value={getSymbol() || undefined} onChange={function (v) { onChange(v, undefined); }} style={{ marginRight: 5, width: isBetween ? 200 : "100%" }} placeholder={t("Comparison mode")}>
            <Select.Option value="=">{t("Equal")}</Select.Option>
            <Select.Option value=">">{t("Greater than")}</Select.Option>
            <Select.Option value="<">{t("Less than")}</Select.Option>
            <Select.Option value=" BETWEEN ">{t("Between")}</Select.Option>
          </Select>
          {!isBetween && <InputNumber style={{ width: "100%" }} value={isBetween ? getUpperNumber() : getNumber()} onChange={function (v) { onChange(undefined, v); }} placeholder={t("Value")} />}
          {isBetween && (
            <Space>
              <InputNumber style={{ width: "100%" }} value={getLowerNumber()} onChange={function (v) { onChangeBetween(v, undefined); }} placeholder={t("Lower Value")} />
              <InputNumber style={{ width: "100%" }} value={getUpperNumber()} onChange={function (v) { onChangeBetween(undefined, v); }} placeholder={t("Upper value")} />
            </Space>
          )}
        </div>
      );
    };
    var ClaimSelect = function (props) {
      useEffect(function () {
        if (props.value) {
          exe("RepoClaim", { operation: "GET", filter: "id=" + props.value }).then(function (r) {
            setData(r.outData || []);
            if (r.count > 0) {
              var claim = r.outData[0];
              if (props.onSelect) props.onSelect(claim.id, { props: { record: claim } });
            }
          });
        }
      }, [props.value]);
      var s1 = useState([]);
      var data = s1[0];
      var setData = s1[1];
      var handleSearch = function (v) {
        if (!v) return;
        exe("RepoClaim", { operation: "GET", filter: "id LIKE N'%" + v + "%'" }).then(function (r) {
          setData(r.outData || []);
        });
      };
      return (
        <div style={{ position: "relative" }}>
          <Select style={{ width: "100%" }} onSearch={handleSearch} onChange={props.onChange} value={props.value} showSearch filterOption={false} allowClear showArrow={false} placeholder={t("Type to search claim...")}>
            {data.map(function (d) {
              return <Select.Option key={d.id} value={d.id}>{d.id}-{formatDateShort(d.created)}</Select.Option>;
            })}
          </Select>
          <a href={"#/healthclaim/" + props.value}>
            <Tooltip title={t("Open Claim")}>
              <Ico type="folder-open" style={{ position: "absolute", right: "30px", top: "9px", cursor: "pointer", color: "rgba(0, 0, 0, 0.25)", fontSize: 12 }} />
            </Tooltip>
          </a>
        </div>
      );
    };
    var SimpleContactSelect = function (props) {
      var s1 = useState([]);
      var data = s1[0];
      var setData = s1[1];
      var s2 = useState(false);
      var fetching = s2[0];
      var setFetching = s2[1];
      var s3 = useState(undefined);
      var keyLabel = s3[0];
      var setKeyLabel = s3[1];
      useEffect(function () {
        if (props.value) findContact(props.value);
        else setKeyLabel(undefined);
      }, [props.value]);
      var onSearchContact = function (value) {
        if (!value) return;
        var searchNif = props.searchNif ? " OR nif LIKE N'%" + value + "%'" : "";
        setFetching(true);
        var query;
        if (isNaN(value)) query = contactNameSqlExpr() + " like N'%" + value + "%'";
        else query = "cnp LIKE N'%" + value + "%'" + searchNif;
        exe("GetContacts", { filter: (props.filter || "") + "(" + query + ")", size: 10 }).then(function (r) {
          setFetching(false);
          var contacts = (r.outData || []).map(function (contact) {
            return {
              text: isNaN(value)
                ? contact.FullName + (props.searchNif && contact.nif ? " [" + contact.nif + "]" : "")
                : contact.FullName + " (" + contact.cnp + ")" + (props.searchNif && contact.nif ? " [" + contact.nif + "]" : ""),
              value: +contact.id,
              contact: contact
            };
          });
          setData(contacts);
        });
      };
      var findContact = function (id) {
        if (!id) return;
        var cache = data.find(function (p) { return p.value == id; });
        if (cache) {
          setKeyLabel({ key: id, label: cache.text });
          return;
        }
        setFetching(true);
        exe("GetContacts", { filter: "ID=" + id }).then(function (r) {
          setFetching(false);
          var contact = r.outData[0];
          setKeyLabel({ key: id, label: "" + contact.FullName });
          if (props.forceSelect) props.onSelectContact(contact);
        });
      };
      var onSelectContact = function (v, opt) {
        if (props.onSelectContact) props.onSelectContact(opt.props.contact);
      };
      return (
        <div style={Object.assign({ width: "100%", position: props.showLink ? "relative" : "static" }, props.style)}>
          <Select
            value={keyLabel}
            showSearch
            labelInValue
            allowClear
            disabled={props.disabled}
            showArrow={false}
            placeholder={t("Type to search contact...")}
            notFoundContent={fetching ? <Spin size="small" /> : <Empty />}
            filterOption={false}
            onSearch={onSearchContact}
            onChange={function (v) { if (props.onChange) { if (v) props.onChange(v.key); else props.onChange(undefined); } }}
            onSelect={function (v, opt) { onSelectContact(v, opt); }}
            style={{ width: "100%" }}>
            {data.map(function (d) {
              return (
                <Select.Option key={d.value} contact={d.contact}>
                  <Tooltip title={d.text}> {d.text}</Tooltip>
                </Select.Option>
              );
            })}
          </Select>
          {props.showLink && (
            <Tooltip title={t("Open contact")}>
              <Ico type="user" style={{ position: "absolute", right: "30px", top: "8px", cursor: "pointer", color: "rgba(0, 0, 0, 0.25)", fontSize: 16 }} onClick={function () { window.location.hash = "#/contact/" + keyLabel.key; }} />
            </Tooltip>
          )}
        </div>
      );
    };
    var AccountSelect = function (props) {
      var s1 = useState([]);
      var data = s1[0];
      var setData = s1[1];
      var s2 = useState(false);
      var loading = s2[0];
      var setLoading = s2[1];
      useEffect(function () {
        if (props.holderId) loadHolderAccounts(props.holderId);
      }, [props.holderId]);
      useEffect(function () {
        if (props.value && !data.find(function (p) { return p.id == props.value; })) loadValue(props.value);
      }, [props.value]);
      useEffect(function () {
        if (props.accNo) loadAccNo(props.accNo);
      }, [props.accNo]);
      useEffect(function () {
        if (props.type) loadByType(props.type);
      }, [props.type]);
      var loadByType = function (type) {
        setLoading(true);
        exe("RepoAccount", { operation: "GET", filter: "type='" + type + "'" }).then(function (r) {
          setLoading(false);
          if (r.ok) setData(r.outData);
        });
      };
      var loadAccNo = function (accNo) {
        setLoading(true);
        exe("RepoAccount", { operation: "GET", filter: "accNo='" + accNo + "'" }).then(function (r) {
          setLoading(false);
          if (r.ok) {
            setData(r.outData);
            if (r.outData.length > 0) props.onChange(r.outData[0].id);
          }
        });
      };
      var loadHolderAccounts = function (holderId) {
        setLoading(true);
        exe("RepoAccount", { operation: "GET", filter: "holderId=" + holderId }).then(function (r) {
          setLoading(false);
          if (r.ok) setData(r.outData);
        });
      };
      var loadValue = function (value) {
        if (!value) return;
        exe("RepoAccount", { operation: "GET", filter: "id=" + value }).then(function (r) {
          if (r.ok) setData(r.outData);
        });
      };
      var handleSearch = function (v) {
        if (!v) return;
        exe("RepoAccount", { operation: "GET", filter: "accNo LIKE N'%" + v + "%'", size: 10 }).then(function (r) {
          if (r.ok) setData(r.outData);
        });
      };
      var Options = data.map(function (d) {
        return (
          <Select.Option value={d.id} key={d.id} currency={d.currency} record={d}>
            {d.accNo}
            {<Currency.Flag currency={d.currency} />}
          </Select.Option>
        );
      });
      return (
        <Select
          showSearch
          loading={loading}
          value={props.value}
          placeholder={isNaN(props.holderId) ? t("Type to search account") : t("Select account")}
          style={props.style}
          defaultActiveFirstOption={false}
          showArrow={!isNaN(props.holderId)}
          filterOption={false}
          onSearch={isNaN(props.holderId) ? handleSearch : undefined}
          onChange={props.onChange}
          onSelect={props.onSelect && props.onSelect}
          notFoundContent={null}>
          {Options}
        </Select>
      );
    };
    var PaymentMethods = function (props) {
      var s1 = useState([]);
      var data = s1[0];
      var setData = s1[1];
      var s2 = useState([]);
      var paymentMethodsConfig = s2[0];
      var setPaymentMethodsConfig = s2[1];
      var s3 = useState();
      var showInfo = s3[0];
      var setShowInfo = s3[1];
      var s4 = useState(false);
      var loading = s4[0];
      var setLoading = s4[1];
      useEffect(function () {
        load();
        getConfigProfile().then(function (profile) {
          setPaymentMethodsConfig(safeGet(["Claim", "paymentMethods"], profile, []));
        });
      }, []);
      useEffect(function () {
        checkExtraInfo();
      }, [props.value, paymentMethodsConfig, data, props.context]);
      var checkExtraInfo = function () {
        if (props.showInfo && props.value && paymentMethodsConfig.length > 0 && data.length > 0) {
          var pmConfig = paymentMethodsConfig.find(function (p) { return p.code === props.value; });
          if (pmConfig && pmConfig.showInfo) computeShowInfo(pmConfig.showInfo);
          else setShowInfo();
        } else setShowInfo();
      };
      var load = function () {
        getCache("RepoPaymentMethodCatalog").then(function (r) {
          if (r.ok) {
            setData(r.outData.filter(function (p) { return (!p.module || p.module === props.module) && (!props.codes || props.codes.indexOf(p.code) >= 0); }));
          } else {
            message.error(r.msg);
          }
        });
      };
      var computeShowInfo = function (showInfoConfig) {
        if (!props.context) return;
        var context = JSON.stringify(props.context);
        setLoading(true);
        exe("ExeFormula", { formula: showInfoConfig, context: context }).then(function (r) {
          setLoading(false);
          if (r.ok) setShowInfo(r.outData);
          else {
            console.error("Error computing showInfo", r.msg);
            setShowInfo(t("Could not fetch extra info"));
          }
        });
      };
      var getExtraContent = function () {
        if (props.showInfo) {
          return (
            <div style={{ marginTop: 5, marginLeft: 3 }}>
              {showInfo}
              {showInfo && <Button type="link" icon={<Ico type="reload" />} loading={loading} onClick={function () { computeShowInfo(paymentMethodsConfig.find(function (p) { return p.code === props.value; }).showInfo); }} />}
            </div>
          );
        }
        return null;
      };
      return (
        <div>
          <div style={{ whiteSpace: "nowrap" }}>
            <Select allowClear placeholder={t("Payment Method")} onChange={function (v, opt) { if (props.onChange) props.onChange(v, opt && opt.props.record); }} value={props.value || undefined} disabled={props.disabled} style={props.style}>
              {data.map(function (p) {
                return <Select.Option value={p.code} key={p.code} record={p}>{t(p.name)}</Select.Option>;
              })}
            </Select>
            {props.small && showInfo && (
              <Popover content={getExtraContent()}>
                <Ico type="info-circle" style={{ marginLeft: 5, marginRight: 5 }} />
              </Popover>
            )}
          </div>
          {!props.small && getExtraContent()}
        </div>
      );
    };
    var YesNoSelect = function (props) {
      return (
        <Select allowClear value={props.value} onChange={props.onChange} placeholder={t("All values")}>
          <Select.Option value={true} key="yesOption">{t("Yes")}</Select.Option>
          <Select.Option value={false} key="noOption">{t("No")}</Select.Option>
        </Select>
      );
    };
    var ClaimsFundSelect = function (props) {
      var s1 = useState(false);
      var loading = s1[0];
      var setLoading = s1[1];
      var s2 = useState([]);
      var data = s2[0];
      var setData = s2[1];
      useEffect(function () {
        if (props.claimsFundId) load(props.claimsFundId);
        else if (props.all) loadAll();
      }, [props.claimsFundId, props.value]);
      var load = function (claimsFundId) {
        setLoading(true);
        exe("RepoClaimsFund", { operation: "GET", filter: "id=" + claimsFundId, include: ["Account", "Account.Movements"] }).then(function (r) {
          setLoading(false);
          if (r.ok) {
            setData(r.outData);
            if (!props.value && r.outData.length > 0) props.onChange(r.outData[0].id);
          } else message.error(r.msg);
        });
      };
      var loadAll = function () {
        setLoading(true);
        exe("RepoClaimsFund", { operation: "GET", include: ["Account", "Account.Movements"] }).then(function (r) {
          setLoading(false);
          if (r.ok) setData(r.outData);
          else message.error(r.msg);
        });
      };
      return (
        <div>
          <Select value={props.value} onChange={props.onChange} disabled={props.disabled} loading={loading}>
            {data.map(function (p) { return <Select.Option value={p.id} key={p.id}>{p.name} {formatMoney(p.balance, p.currency)}</Select.Option>; })}
          </Select>
        </div>
      );
    };
    var ReceiptTypeSelect = function (props) {
      var s1 = useState(false);
      var loading = s1[0];
      var setLoading = s1[1];
      var s2 = useState([]);
      var data = s2[0];
      var setData = s2[1];
      useEffect(function () { load(); }, []);
      var load = function () {
        setLoading(true);
        exe("RepoReceiptTypeCatalog", { operation: "GET" }).then(function (r) {
          setLoading(false);
          if (r.ok) setData(r.outData);
          else message.error(r.msg);
        });
      };
      var enabledItems = (props.enabledItems && props.enabledItems.receiptTypes) || [];
      return (
        <div>
          <Select style={{ width: "100%" }} showArrow value={props.value} onChange={props.onChange} onSelect={props.onSelect && props.onSelect} disabled={props.disabled} loading={loading} allowClear showSearch optionFilterProp="children">
            {data.map(function (p) {
              return <Select.Option value={p.code} key={p.code} record={p} disabled={enabledItems.length > 0 && enabledItems.indexOf(p.code) < 0}>{t(p.name)}</Select.Option>;
            })}
          </Select>
        </div>
      );
    };
    var BranchSelect = function (props) {
      var s1 = useState([]);
      var data = s1[0];
      var setData = s1[1];
      var s2 = useState(false);
      var loading = s2[0];
      var setLoading = s2[1];
      useEffect(function () { load(); }, []);
      var load = function () {
        setLoading(true);
        getCache("RepoBranch", { operation: "GET" }).then(function (r) {
          setLoading(false);
          if (r.ok) setData(r.outData);
          else message.error(r.msg);
        });
      };
      var onSelect = function (v, opt) {
        if (props.onSelect) props.onSelect(opt.props.record);
      };
      return (
        <Select
          value={props.value ? props.value : undefined}
          onChange={function (v) { props.onChange(v ? v : null); }}
          onClear={props.onClear}
          onSelect={onSelect}
          loading={loading}
          style={Object.assign({ width: "100%" }, props.style)}
          placeholder={props.placeholder ? props.placeholder : t("Please select branch")}
          disabled={props.disabled}
          mode={props.multiple ? "multiple" : undefined}
          bordered={props.bordered}
          allowClear>
          {data.filter(function (p) { return !Array.isArray(props.filter) || props.filter.indexOf(p.code) >= 0; }).map(function (p) {
            return <Select.Option value={p.code} key={p.code} record={p} disabled={!p.active}>{p.name}</Select.Option>;
          })}
        </Select>
      );
    };
    var TemplateSelect = function (props) {
      var s1 = useState([]);
      var data = s1[0];
      var setData = s1[1];
      useEffect(function () { getTemplates(); }, []);
      var getTemplates = function () {
        fetchProxy("/templates", "GET").then(function (r) {
          if ((props.userSelectableTemplates || []).length == 0) setData(r.outData || []);
          else setData((r.outData || []).filter(function (p) { return (props.userSelectableTemplates || []).indexOf(p.name) >= 0; }));
        });
      };
      return (
        <div>
          <Select
            style={{ width: "100%" }}
            allowClear
            placeholder={t("Select Template")}
            onChange={function (v) { props.onChange(v); }}
            showSearch
            filterOption={function (input, option) { return option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0; }}
            value={props.value || undefined}
            loading={props.loading}
            disabled={props.disabled}>
            {data.map(function (p) { return <Select.Option value={p.name} key={p.name}>{p.name}</Select.Option>; })}
          </Select>
        </div>
      );
    };
  
    /* ---------- Accounting: CostCenterSelect, CostCenterValueSelect; Shared/CostCenterManagement ---------- */
    var CostCenterSelect = function (props) {
      var s1 = useState(false);
      var loading = s1[0];
      var setLoading = s1[1];
      var s2 = useState([]);
      var data = s2[0];
      var setData = s2[1];
      useEffect(function () { load(); }, []);
      var load = function () {
        setLoading(true);
        exe("RepoCostCenterCatalog", { operation: "GET" }).then(function (r) {
          setLoading(false);
          if (r.ok) setData(r.outData);
          else message.error(r.msg);
        });
      };
      return (
        <div>
          <Select style={{ width: "100%" }} showArrow placeholder={t("Please select cost center")} value={props.value} onChange={props.onChange} onSelect={props.onSelect && props.onSelect} loading={loading} allowClear showSearch optionFilterProp="children">
            {data.map(function (p) { return <Select.Option value={p.code} key={p.code} record={p}>{p.name}</Select.Option>; })}
          </Select>
        </div>
      );
    };
    var CostCenterValueSelect = function (props) {
      var s1 = useState(false);
      var loading = s1[0];
      var setLoading = s1[1];
      var s2 = useState([]);
      var data = s2[0];
      var setData = s2[1];
      useEffect(function () {
        if (props.costCenterCode) load(props.costCenterCode);
      }, [props.costCenterCode]);
      var load = function (code) {
        setLoading(true);
        exe("GetCostCenterValues", { costCenterCode: code }).then(function (r) {
          setLoading(false);
          if (r.ok) setData(r.outData);
          else message.error(r.msg);
        });
      };
      var onSelect = function (v, opt) {
        if (props.onSelect) props.onSelect(v, opt);
      };
      return (
        <div>
          <Select style={{ width: "100%" }} showArrow placeholder={t("Please select cost value")} value={props.value} onChange={props.onChange} onSelect={onSelect} loading={loading} allowClear showSearch optionFilterProp="children">
            {data.map(function (p) { return <Select.Option value={p.code} key={p.code} record={p}>{p.name}</Select.Option>; })}
          </Select>
        </div>
      );
    };
    var CostCenterManagement = function (props) {
      var form = props.form;
      var s1 = useState(false);
      var costCentersVisible = s1[0];
      var setCostCentersVisible = s1[1];
      var s2 = useState();
      var selected = s2[0];
      var setSelected = s2[1];
      var values = form.getFieldsValue();
      var onSave = function (vals) {
        form.setFieldsValue({ CostCenters: data.concat([vals]) });
        setSelected();
      };
      var onOk = function () {
        form.setFieldsValue({ CostCenters: data });
        setCostCentersVisible(false);
      };
      var onDelete = function (r) {
        var filteredData = data.filter(function (p) { return !(p.costCenterCode === r.costCenterCode && p.valueCode === r.valueCode); });
        console.log("DELETE", r, data, filteredData);
        form.setFieldsValue({ CostCenters: filteredData });
      };
      var data = values.CostCenters || [];
      //native: Form.create() inside the render, so the inner form is a new component (and remounts) on every render
      var CostCenterForm = LegacyForm.create()(function (fprops) {
        var fOnSave = function () {
          fprops.form.validateFields(function (err, vals) {
            if (err) return;
            fprops.onSave(vals);
          });
        };
        var onCostCenterSelect = function (v, opt) {
          fprops.form.setFieldsValue({ CostCenter: opt.props.record });
        };
        var onValueSelect = function (v, opt) {
          fprops.form.setFieldsValue({ value: opt.props.record.name });
        };
        var ffield = fprops.form.getFieldDecorator;
        var fvalues = fprops.form.getFieldsValue();
        return (
          <div>
            <Button type={"link"} icon={<Ico type="left" legacy />} onClick={function () { setSelected(); }}>{t("Back")}</Button>
            <Button type={"link"} icon={<Ico type="save" legacy />} onClick={function () { fOnSave(); }}>{t("Save")}</Button>
            {ffield("id")}
            {ffield("claimPaymentId")}
            {ffield("value")}
            {ffield("CostCenter")}
            <LegacyForm.Item label={t("Cost Center")}>{ffield("costCenterCode", { rules: [{ required: true }] })(<CostCenterSelect onSelect={onCostCenterSelect} />)}</LegacyForm.Item>
            <LegacyForm.Item label={t("Cost Center Value")}>{ffield("valueCode", { rules: [{ required: true }] })(<CostCenterValueSelect onSelect={onValueSelect} costCenterCode={fvalues.costCenterCode} />)}</LegacyForm.Item>
          </div>
        );
      });
      return (
        <div style={Object.assign({}, props.style, { display: props.visible ? "block" : "none" })}>
          <Button type={"link"} icon={<Ico type="deployment-unit" legacy />} onClick={function () { setCostCentersVisible(true); }} style={{ paddingLeft: 0 }}>{t("Cost Centers")}</Button>
          <Modal title={t("Cost Centers")} visible={costCentersVisible} onCancel={function () { setCostCentersVisible(false); }} onOk={onOk}>
            {!selected && (
              <div>
                <Button type={"link"} icon={<Ico type="plus" legacy />} onClick={function () { setSelected({ id: 0 }); }}>{t("New")}</Button>
                <Table dataSource={data}>
                  <Table.Column dataIndex={"CostCenter.name"} title={"Cost Center"} />
                  <Table.Column dataIndex={"value"} title={"Value"} />
                  <Table.Column key={"actions"} title={"Actions"} render={function (v, r) { return <div><Button type={"link"} icon={<Ico type="delete" legacy />} onClick={function () { onDelete(r); }} /> </div>; }} />
                </Table>
              </div>
            )}
            <div style={{ display: selected ? "block" : "none" }}>
              <CostCenterForm onSave={onSave} />
            </div>
          </Modal>
        </div>
      );
    };
  
    /* ---------- Shared/CustomForm (jQuery formRender, registered by the host app) ---------- */
    //safeFormRender without the SISos fileUpload/liveView templates (not reachable from a LiveView)
    var safeFormRender = function ($container, options) {
      try {
        return $container.formRender(Object.assign({}, options));
      } catch (error) {
        console.error("formRender failed - invalid form definition", error, options && options.formData);
        message.error("Invalid form definition. Please review this form in the form builder.");
        return null;
      }
    };
    var downloadFile = function (route) {
      return fetch(SS_API_URL + "/proxy" + route, { method: "GET", headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.token } })
        .then(function (response) { return response.blob(); })
        .then(function (data) { window.open(URL.createObjectURL(data)); })
        .catch(function (err) { console.log(err); });
    };
    var CustomForm = function (props) {
      var s1 = useState();
      var loadedFormId = s1[0];
      var setLoadedFormId = s1[1];
      var s2 = useState();
      var customLogic = s2[0];
      var setCustomLogic = s2[1];
      var $ = window.$;
      useEffect(function () {
        if (props.formId) { console.log("--formId", props.formId, props.value); loadForm(props.formId); }
        if (props.value) { console.log("--value", props.value, props.formId); loadValue(props.value); }
      }, [props.formId, props.value, props.update]);
      useEffect(function () {
        if (window[props.variable] && window[props.variable].instanceContainers && props.newRecord) window[props.variable].clear();
      }, [props.newRecord]);
      useLayoutEffect(function () {
        return function () { window[props.variable] = null; };
      }, []);
      var loadForm = function (formId) {
        return new Promise(function (resolve, reject) {
          if (loadedFormId == formId) {
            exeCustomLogic(customLogic);
            return resolve();
          }
          setLoadedFormId(formId);
          exe("GetForms", { filter: "id=" + formId }).then(function (r) {
            if (r.ok) {
              var fbRender = document.getElementById("fb-render" + (props.variable ? props.variable : ""));
              var formInstance = safeFormRender($(fbRender), {
                container: fbRender,
                formData: r.outData[0].json,
                onRender: function () {
                  if (props.onFormChange) {
                    $(fbRender).on("change", function () {
                      props.onFormChange(window[props.variable].userData);
                    });
                  }
                }
              });
              if (!formInstance) return reject("Invalid form definition");
              setCustomLogic(r.outData[0].logic);
              exeCustomLogic(r.outData[0].logic);
              window[props.variable] = formInstance;
              window[props.variable].load = loadForm;
              resolve();
            } else {
              message.error(r.msg);
              reject(r.msg);
            }
          });
        });
      };
      var loadValue = function (value) {
        if (!value) return;
        var checkExists = function () {
          if (window[props.variable] && window[props.variable].instanceContainers) {
            safeFormRender($(window[props.variable].instanceContainers[0]), {
              formData: value,
              onRender: function () {
                if (props.onFormChange) {
                  $(window[props.variable].instanceContainers[0]).on("change", function () {
                    props.onFormChange(window[props.variable].userData);
                  });
                }
              }
            });
            console.log("setting value...");
          } else {
            console.log("Form instance not yet available");
            setTimeout(checkExists, 500);
          }
        };
        checkExists();
      };
      var loadCatalog = function (catalog, element, filter, valueField, displayField) {
        valueField = valueField || "id";
        displayField = displayField || "name";
        exe(catalog, { operation: "GET", filter: filter }).then(function (r) {
          r.outData.map(function (x) {
            $(element).append($("<option></option>").attr("value", x[valueField]).text(x[displayField]));
          });
        });
      };
      var exeCustomLogic = function (logic) {
        if (!logic) return;
        try {
          console.log("Executing custom logic:", logic);
          evalInContext(logic, Object.assign({ exe: exe, loadCatalog: loadCatalog, notification: notification, message: message, downloadFile: downloadFile }, props.context || {}));
          console.log("Success");
        } catch (error) {
          console.warn(error);
        }
      };
      return (
        <div className={props.disabled ? "disabled" : ""}>
          <form id={"fb-render" + (props.variable ? props.variable : "")}></form>
          {!props.formId && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("No custom form configured")} />}
        </div>
      );
    };
  
    /* ---------- FormRenderModal (form of a workflow step) and Shared/Status ---------- */
    var WorkflowFormRender = function (props) {
      var formRef = useRef(null);
      var instance = useRef(null);
      var lastNext = useRef(props.next);
      var uid = useRef(new Date().getTime());
      var loadCatalog = function (catalog, element, filter, valueField, displayField) {
        valueField = valueField || "id";
        displayField = displayField || "name";
        exe(catalog, { operation: "GET", filter: filter }).then(function (r) {
          r.outData.map(function (x) {
            window.$(element).append(window.$("<option></option>").attr("value", x[valueField]).text(x[displayField]));
          });
        });
      };
      var exeCustomLogic = function (logic) {
        try {
          console.log("Executing custom logic:", logic);
          evalInContext(logic, { exe: exe, loadCatalog: loadCatalog, processId: props.processId, downloadFile: downloadFile, message: message });
          console.log("Success");
        } catch (error) {
          console.warn(error);
        }
      };
      //the form engine (jQuery formRender) is attached to window.$ by the host app; right after a page load it can still be
      //missing, so the render waits for it (up to 5 s) instead of leaving an empty form
      var renderWhenReady = function (render) {
        var tries = 0;
        var attempt = function () {
          var jq = window.$;
          if (jq && jq.fn && jq.fn.formRender && formRef.current) return render(jq);
          if (tries++ < 20) setTimeout(attempt, 250);
        };
        attempt();
      };
      useEffect(function () {
        var formId = props.formId;
        if (formId) {
          exe("GetForms", { filter: isNaN(formId) ? "name='" + formId + "'" : "id=" + formId }).then(function (v) {
            if (v.outData.length == 0) {
              message.error("Form " + formId + " not found");
              return false;
            }
            renderWhenReady(function (jq) {
              instance.current = safeFormRender(jq(formRef.current), { container: formRef.current, formData: v.outData[0].json });
              if (instance.current && v.outData[0].logic) exeCustomLogic(v.outData[0].logic);
            });
          });
        } else {
          renderWhenReady(function (jq) {
            instance.current = jq(formRef.current).formRender({ container: formRef.current, formData: '[{"type":"header","subtype":"h3","label":"' + t("No form configured for this step. Click next to advance.") + '"}]' });
          });
        }
      }, []);
      useEffect(function () {
        if (props.next > lastNext.current) {
          if (props.formId) {
            if (formRef.current && formRef.current.reportValidity()) props.onFormOk(instance.current.userData);
          } else props.onFormOk({});
        }
        lastNext.current = props.next;
      }, [props.next]);
      return <form id={"fb-render-" + uid.current} ref={formRef}></form>;
    };
    var WF_COLORS = { green: "#87d068", blue: "blue", red: "#f50" };
    var Status = function (props) {
      var s1 = useState(false);
      var formVisible = s1[0];
      var setFormVisible = s1[1];
      var s2 = useState(null);
      var reasonText = s2[0];
      var setReasonText = s2[1];
      var s3 = useState(0);
      var next = s3[0];
      var setNext = s3[1];
      var s4 = useState(false);
      var loading = s4[0];
      var setLoading = s4[1];
      var mounted = useRef(false);
      var prevProcess = useRef(undefined);
      useEffect(function () {
        var prev = prevProcess.current;
        prevProcess.current = props.process;
        if (!mounted.current) {
          mounted.current = true;
          return;
        }
        if (!props.process) return;
        if (!prev || props.process.entryLogic !== prev.entryLogic) {
          if (props.process.entryLogic) {
            evalInContext(props.process.entryLogic, { message: message, notification: notification, exe: exe, process: props.process, setDisabledTabs: props.setDisabledTabs || function () {} });
          }
        }
      });
      var checkBlocked = function () {
        if (props.blocked) {
          notification.error({ message: t("Unmet requirements"), description: props.blockedMsg });
          return true;
        }
      };
      var onNext = function () {
        if (checkBlocked()) return;
        setLoading(true);
        exe("GotoStep", { procesoId: props.process.id, estado: "_next" }, undefined, true).then(function () {
          setLoading(false);
          props.reload();
        });
      };
      var onPrevious = function () {
        setLoading(true);
        exe("GotoStep", { procesoId: props.process.id, estado: "_previous" }, undefined, true).then(function () {
          setLoading(false);
          props.reload();
        });
      };
      var onFormOk = function (f) {
        setLoading(true);
        exe("GotoStep", { procesoId: props.process.id, estado: "_next", userValues: JSON.stringify(f) }).then(function (r) {
          setLoading(false);
          if (!r.ok) {
            message.error(r.msg);
            return;
          }
          setFormVisible(false);
          props.reload();
        });
      };
      var loadEntityStateReason = function (reasonCode) {
        exe("RepoEntityStateReason", { operation: "GET", filter: "code='" + reasonCode + "'" }).then(function (r) {
          if (r.ok) {
            if (r.outData.length == 0) setReasonText(reasonCode);
            else setReasonText(r.outData[0].entityStateReason);
          } else {
            message.error(r.msg);
            setReasonText(reasonCode);
          }
        });
      };
      var onPopoverVisible = function (visible) {
        if (visible && props.process.entityStateReason && !reasonText) loadEntityStateReason(props.process.entityStateReason);
      };
      if (!props.process) return <Tag>{t("No Workflow")}</Tag>;
      var ViewForm = "";
      if (props.process.formId) {
        ViewForm = (
          <Tooltip title={t("Form required by workflow state")}>
            <Button loading={loading} style={{ width: "100px" }} disabled={props.ended} onClick={function () { if (!checkBlocked()) setFormVisible(true); }}>
              <Ico type="warning" />
              {t("Next")}
              <Ico type="right" />
            </Button>
          </Tooltip>
        );
      }
      var userActions = props.process && props.process.userActions ? JSON.parse(props.process.userActions) : [];
      if (userActions.length > 0) {
        ViewForm = (
          <Tooltip title={t("Next step must be triggered by a user action")}>
            <Ico type="branches" />
            {userActions.map(function (action) { return <Tag key={"ac" + action}>{action}</Tag>; })}
          </Tooltip>
        );
      }
      var hasForm = ViewForm != "";
      var ended = safeGet(["process", "finalizado"], props, false);
      var blockedBy = safeGet(["process", "blockedBy"], props, false);
      return (
        <div style={{ whiteSpace: "nowrap" }}>
          <Popover
            title={t("Workflow Status")}
            content={
              <div style={{ whiteSpace: "nowrap" }}>
                {props.process && props.process.progress && (
                  <div>
                    <Progress percent={props.process.progress} size="small" strokeColor="#1890ff" />
                  </div>
                )}
                <Button type="link" size="small" icon={<Ico type="share-alt" />} onClick={function () { window.location.href = "#/activity/" + props.process.id; }}>
                  {t("Open Workflow")}
                </Button>
                <br />
                {hasForm && userActions.length == 0 && (
                  <Button type="link" size="small" icon={<Ico type="warning" />} onClick={function () { setFormVisible(true); }}>
                    {t("Required form")}
                  </Button>
                )}
                {blockedBy && (
                  <Text type="warning" style={{ paddingLeft: 7 }}>
                    <Ico type="warning" style={{ marginRight: 7 }} />
                    {t("Blocked by process")}
                  </Text>
                )}
                <div display="flex">
                  <Button size="small" style={{ margin: 5, width: 100 }} onClick={function () { onPrevious(); }} loading={loading} disabled={props.ended}>
                    <Ico type="left" />
                    {t("Previous")}
                  </Button>
                  <Button disabled={hasForm || props.ended} type="primary" size="small" style={{ margin: 3, width: 100 }} loading={loading} onClick={function () { onNext(); }}>
                    {t("Next")}
                    <Ico type="right" />
                  </Button>
                </div>
              </div>
            }>
            <Button type="link">
              {t("Workflow")}
              <Ico type="down" />
            </Button>
          </Popover>
          <Popover
            onVisibleChange={function (v) { onPopoverVisible(v); }}
            content={
              <Descriptions size="small" bordered layout="vertical">
                <Descriptions.Item label={t("Workflow State")}>{props.process.estado}</Descriptions.Item>
                <Descriptions.Item label={t("Entity State")}>{props.process.entityState}</Descriptions.Item>
                <Descriptions.Item label={t("Entity State Reason")}>{t(reasonText)}</Descriptions.Item>
              </Descriptions>
            }>
            <Tag color={props.color ? WF_COLORS[props.color] : props.process.finalizado ? WF_COLORS.green : WF_COLORS.blue}>{props.process.estado}</Tag>
          </Popover>
          {!hasForm && (
            <Button type="link" style={{ width: "70px" }} onClick={function () { if (hasForm) setFormVisible(true); else onNext(); }} disabled={ended || props.ended} loading={loading}>
              {!props.small && t("Next")}
              <Ico type="right" />
            </Button>
          )}
          {ViewForm}
          <Modal
            title={t("Workflow Form")}
            destroyOnClose={true}
            visible={formVisible}
            onCancel={function () { setFormVisible(false); }}
            okButtonProps={{ loading: loading }}
            onOk={function () { setNext(next + 1); }}>
            <WorkflowFormRender modal formId={props.process.formId} next={next} onFormOk={onFormOk} processId={props.process.id} />
          </Modal>
        </div>
      );
    };
  
  
  // ---- Excel export: plain-code port of the native DownloadOptions "Excel" button ----
  // Native: antd-table-saveas-excel 2.1.4 -> better-xlsx 0.7.6 (+ jszip 3.7.1) -> file-saver 2.0.5.
  // The XML below reproduces better-xlsx byte for byte (same attributes, same style table order and
  // de-duplication quirks) so the file Excel shows is identical; the zip is written uncompressed.
  
  // better-xlsx templates.js XL_THEME_THEME (verbatim, non-ASCII escaped).
  var XLSX_THEME = [
    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
    "<a:theme xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" name=\"Office-Design\">",
    "  <a:themeElements>",
    "    <a:clrScheme name=\"Office\">",
    "      <a:dk1>",
    "        <a:sysClr val=\"windowText\" lastClr=\"000000\"/>",
    "      </a:dk1>",
    "      <a:lt1>",
    "        <a:sysClr val=\"window\" lastClr=\"FFFFFF\"/>",
    "      </a:lt1>",
    "      <a:dk2>",
    "        <a:srgbClr val=\"1F497D\"/>",
    "      </a:dk2>",
    "      <a:lt2>",
    "        <a:srgbClr val=\"EEECE1\"/>",
    "      </a:lt2>",
    "      <a:accent1>",
    "        <a:srgbClr val=\"4F81BD\"/>",
    "      </a:accent1>",
    "      <a:accent2>",
    "        <a:srgbClr val=\"C0504D\"/>",
    "      </a:accent2>",
    "      <a:accent3>",
    "        <a:srgbClr val=\"9BBB59\"/>",
    "      </a:accent3>",
    "      <a:accent4>",
    "        <a:srgbClr val=\"8064A2\"/>",
    "      </a:accent4>",
    "      <a:accent5>",
    "        <a:srgbClr val=\"4BACC6\"/>",
    "      </a:accent5>",
    "      <a:accent6>",
    "        <a:srgbClr val=\"F79646\"/>",
    "      </a:accent6>",
    "      <a:hlink>",
    "        <a:srgbClr val=\"0000FF\"/>",
    "      </a:hlink>",
    "      <a:folHlink>",
    "        <a:srgbClr val=\"800080\"/>",
    "      </a:folHlink>",
    "    </a:clrScheme>",
    "    <a:fontScheme name=\"Office\">",
    "      <a:majorFont>",
    "        <a:latin typeface=\"Cambria\"/>",
    "        <a:ea typeface=\"\"/>",
    "        <a:cs typeface=\"\"/>",
    "        <a:font script=\"Jpan\" typeface=\"\uff2d\uff33 \uff30\u30b4\u30b7\u30c3\u30af\"/>",
    "        <a:font script=\"Hang\" typeface=\"\ub9d1\uc740 \uace0\ub515\"/>",
    "        <a:font script=\"Hans\" typeface=\"\u5b8b\u4f53\"/>",
    "        <a:font script=\"Hant\" typeface=\"\u65b0\u7d30\u660e\u9ad4\"/>",
    "        <a:font script=\"Arab\" typeface=\"Times New Roman\"/>",
    "        <a:font script=\"Hebr\" typeface=\"Times New Roman\"/>",
    "        <a:font script=\"Thai\" typeface=\"Tahoma\"/>",
    "        <a:font script=\"Ethi\" typeface=\"Nyala\"/>",
    "        <a:font script=\"Beng\" typeface=\"Vrinda\"/>",
    "        <a:font script=\"Gujr\" typeface=\"Shruti\"/>",
    "        <a:font script=\"Khmr\" typeface=\"MoolBoran\"/>",
    "        <a:font script=\"Knda\" typeface=\"Tunga\"/>",
    "        <a:font script=\"Guru\" typeface=\"Raavi\"/>",
    "        <a:font script=\"Cans\" typeface=\"Euphemia\"/>",
    "        <a:font script=\"Cher\" typeface=\"Plantagenet Cherokee\"/>",
    "        <a:font script=\"Yiii\" typeface=\"Microsoft Yi Baiti\"/>",
    "        <a:font script=\"Tibt\" typeface=\"Microsoft Himalaya\"/>",
    "        <a:font script=\"Thaa\" typeface=\"MV Boli\"/>",
    "        <a:font script=\"Deva\" typeface=\"Mangal\"/>",
    "        <a:font script=\"Telu\" typeface=\"Gautami\"/>",
    "        <a:font script=\"Taml\" typeface=\"Latha\"/>",
    "        <a:font script=\"Syrc\" typeface=\"Estrangelo Edessa\"/>",
    "        <a:font script=\"Orya\" typeface=\"Kalinga\"/>",
    "        <a:font script=\"Mlym\" typeface=\"Kartika\"/>",
    "        <a:font script=\"Laoo\" typeface=\"DokChampa\"/>",
    "        <a:font script=\"Sinh\" typeface=\"Iskoola Pota\"/>",
    "        <a:font script=\"Mong\" typeface=\"Mongolian Baiti\"/>",
    "        <a:font script=\"Viet\" typeface=\"Times New Roman\"/>",
    "        <a:font script=\"Uigh\" typeface=\"Microsoft Uighur\"/>",
    "        <a:font script=\"Geor\" typeface=\"Sylfaen\"/>",
    "      </a:majorFont>",
    "      <a:minorFont>",
    "        <a:latin typeface=\"Calibri\"/>",
    "        <a:ea typeface=\"\"/>",
    "        <a:cs typeface=\"\"/>",
    "        <a:font script=\"Jpan\" typeface=\"\uff2d\uff33 \uff30\u30b4\u30b7\u30c3\u30af\"/>",
    "        <a:font script=\"Hang\" typeface=\"\ub9d1\uc740 \uace0\ub515\"/>",
    "        <a:font script=\"Hans\" typeface=\"\u5b8b\u4f53\"/>",
    "        <a:font script=\"Hant\" typeface=\"\u65b0\u7d30\u660e\u9ad4\"/>",
    "        <a:font script=\"Arab\" typeface=\"Arial\"/>",
    "        <a:font script=\"Hebr\" typeface=\"Arial\"/>",
    "        <a:font script=\"Thai\" typeface=\"Tahoma\"/>",
    "        <a:font script=\"Ethi\" typeface=\"Nyala\"/>",
    "        <a:font script=\"Beng\" typeface=\"Vrinda\"/>",
    "        <a:font script=\"Gujr\" typeface=\"Shruti\"/>",
    "        <a:font script=\"Khmr\" typeface=\"DaunPenh\"/>",
    "        <a:font script=\"Knda\" typeface=\"Tunga\"/>",
    "        <a:font script=\"Guru\" typeface=\"Raavi\"/>",
    "        <a:font script=\"Cans\" typeface=\"Euphemia\"/>",
    "        <a:font script=\"Cher\" typeface=\"Plantagenet Cherokee\"/>",
    "        <a:font script=\"Yiii\" typeface=\"Microsoft Yi Baiti\"/>",
    "        <a:font script=\"Tibt\" typeface=\"Microsoft Himalaya\"/>",
    "        <a:font script=\"Thaa\" typeface=\"MV Boli\"/>",
    "        <a:font script=\"Deva\" typeface=\"Mangal\"/>",
    "        <a:font script=\"Telu\" typeface=\"Gautami\"/>",
    "        <a:font script=\"Taml\" typeface=\"Latha\"/>",
    "        <a:font script=\"Syrc\" typeface=\"Estrangelo Edessa\"/>",
    "        <a:font script=\"Orya\" typeface=\"Kalinga\"/>",
    "        <a:font script=\"Mlym\" typeface=\"Kartika\"/>",
    "        <a:font script=\"Laoo\" typeface=\"DokChampa\"/>",
    "        <a:font script=\"Sinh\" typeface=\"Iskoola Pota\"/>",
    "        <a:font script=\"Mong\" typeface=\"Mongolian Baiti\"/>",
    "        <a:font script=\"Viet\" typeface=\"Arial\"/>",
    "        <a:font script=\"Uigh\" typeface=\"Microsoft Uighur\"/>",
    "        <a:font script=\"Geor\" typeface=\"Sylfaen\"/>",
    "      </a:minorFont>",
    "    </a:fontScheme>",
    "    <a:fmtScheme name=\"Office\">",
    "      <a:fillStyleLst>",
    "        <a:solidFill>",
    "          <a:schemeClr val=\"phClr\"/>",
    "        </a:solidFill>",
    "        <a:gradFill rotWithShape=\"1\">",
    "          <a:gsLst>",
    "            <a:gs pos=\"0\">",
    "              <a:schemeClr val=\"phClr\">",
    "                <a:tint val=\"50000\"/>",
    "                <a:satMod val=\"300000\"/>",
    "              </a:schemeClr>",
    "            </a:gs>",
    "            <a:gs pos=\"35000\">",
    "              <a:schemeClr val=\"phClr\">",
    "                <a:tint val=\"37000\"/>",
    "                <a:satMod val=\"300000\"/>",
    "              </a:schemeClr>",
    "            </a:gs>",
    "            <a:gs pos=\"100000\">",
    "              <a:schemeClr val=\"phClr\">",
    "                <a:tint val=\"15000\"/>",
    "                <a:satMod val=\"350000\"/>",
    "              </a:schemeClr>",
    "            </a:gs>",
    "          </a:gsLst>",
    "          <a:lin ang=\"16200000\" scaled=\"1\"/>",
    "        </a:gradFill>",
    "        <a:gradFill rotWithShape=\"1\">",
    "          <a:gsLst>",
    "            <a:gs pos=\"0\">",
    "              <a:schemeClr val=\"phClr\">",
    "                <a:tint val=\"100000\"/>",
    "                <a:shade val=\"100000\"/>",
    "                <a:satMod val=\"130000\"/>",
    "              </a:schemeClr>",
    "            </a:gs>",
    "            <a:gs pos=\"100000\">",
    "              <a:schemeClr val=\"phClr\">",
    "                <a:tint val=\"50000\"/>",
    "                <a:shade val=\"100000\"/>",
    "                <a:satMod val=\"350000\"/>",
    "              </a:schemeClr>",
    "            </a:gs>",
    "          </a:gsLst>",
    "          <a:lin ang=\"16200000\" scaled=\"0\"/>",
    "        </a:gradFill>",
    "      </a:fillStyleLst>",
    "      <a:lnStyleLst>",
    "        <a:ln w=\"9525\" cap=\"flat\" cmpd=\"sng\" algn=\"ctr\">",
    "          <a:solidFill>",
    "            <a:schemeClr val=\"phClr\">",
    "              <a:shade val=\"95000\"/>",
    "              <a:satMod val=\"105000\"/>",
    "            </a:schemeClr>",
    "          </a:solidFill>",
    "          <a:prstDash val=\"solid\"/>",
    "        </a:ln>",
    "        <a:ln w=\"25400\" cap=\"flat\" cmpd=\"sng\" algn=\"ctr\">",
    "          <a:solidFill>",
    "            <a:schemeClr val=\"phClr\"/>",
    "          </a:solidFill>",
    "          <a:prstDash val=\"solid\"/>",
    "        </a:ln>",
    "        <a:ln w=\"38100\" cap=\"flat\" cmpd=\"sng\" algn=\"ctr\">",
    "          <a:solidFill>",
    "            <a:schemeClr val=\"phClr\"/>",
    "          </a:solidFill>",
    "          <a:prstDash val=\"solid\"/>",
    "        </a:ln>",
    "      </a:lnStyleLst>",
    "      <a:effectStyleLst>",
    "        <a:effectStyle>",
    "          <a:effectLst>",
    "            <a:outerShdw blurRad=\"40000\" dist=\"20000\" dir=\"5400000\" rotWithShape=\"0\">",
    "              <a:srgbClr val=\"000000\">",
    "                <a:alpha val=\"38000\"/>",
    "              </a:srgbClr>",
    "            </a:outerShdw>",
    "          </a:effectLst>",
    "        </a:effectStyle>",
    "        <a:effectStyle>",
    "          <a:effectLst>",
    "            <a:outerShdw blurRad=\"40000\" dist=\"23000\" dir=\"5400000\" rotWithShape=\"0\">",
    "              <a:srgbClr val=\"000000\">",
    "                <a:alpha val=\"35000\"/>",
    "              </a:srgbClr>",
    "            </a:outerShdw>",
    "          </a:effectLst>",
    "        </a:effectStyle>",
    "        <a:effectStyle>",
    "          <a:effectLst>",
    "            <a:outerShdw blurRad=\"40000\" dist=\"23000\" dir=\"5400000\" rotWithShape=\"0\">",
    "              <a:srgbClr val=\"000000\">",
    "                <a:alpha val=\"35000\"/>",
    "              </a:srgbClr>",
    "            </a:outerShdw>",
    "          </a:effectLst>",
    "          <a:scene3d>",
    "            <a:camera prst=\"orthographicFront\">",
    "              <a:rot lat=\"0\" lon=\"0\" rev=\"0\"/>",
    "            </a:camera>",
    "            <a:lightRig rig=\"threePt\" dir=\"t\">",
    "              <a:rot lat=\"0\" lon=\"0\" rev=\"1200000\"/>",
    "            </a:lightRig>",
    "          </a:scene3d>",
    "          <a:sp3d>",
    "            <a:bevelT w=\"63500\" h=\"25400\"/>",
    "          </a:sp3d>",
    "        </a:effectStyle>",
    "      </a:effectStyleLst>",
    "      <a:bgFillStyleLst>",
    "        <a:solidFill>",
    "          <a:schemeClr val=\"phClr\"/>",
    "        </a:solidFill>",
    "        <a:gradFill rotWithShape=\"1\">",
    "          <a:gsLst>",
    "            <a:gs pos=\"0\">",
    "              <a:schemeClr val=\"phClr\">",
    "                <a:tint val=\"40000\"/>",
    "                <a:satMod val=\"350000\"/>",
    "              </a:schemeClr>",
    "            </a:gs>",
    "            <a:gs pos=\"40000\">",
    "              <a:schemeClr val=\"phClr\">",
    "                <a:tint val=\"45000\"/>",
    "                <a:shade val=\"99000\"/>",
    "                <a:satMod val=\"350000\"/>",
    "              </a:schemeClr>",
    "            </a:gs>",
    "            <a:gs pos=\"100000\">",
    "              <a:schemeClr val=\"phClr\">",
    "                <a:shade val=\"20000\"/>",
    "                <a:satMod val=\"255000\"/>",
    "              </a:schemeClr>",
    "            </a:gs>",
    "          </a:gsLst>",
    "          <a:path path=\"circle\">",
    "            <a:fillToRect l=\"50000\" t=\"-80000\" r=\"50000\" b=\"180000\"/>",
    "          </a:path>",
    "        </a:gradFill>",
    "        <a:gradFill rotWithShape=\"1\">",
    "          <a:gsLst>",
    "            <a:gs pos=\"0\">",
    "              <a:schemeClr val=\"phClr\">",
    "                <a:tint val=\"80000\"/>",
    "                <a:satMod val=\"300000\"/>",
    "              </a:schemeClr>",
    "            </a:gs>",
    "            <a:gs pos=\"100000\">",
    "              <a:schemeClr val=\"phClr\">",
    "                <a:shade val=\"30000\"/>",
    "                <a:satMod val=\"200000\"/>",
    "              </a:schemeClr>",
    "            </a:gs>",
    "          </a:gsLst>",
    "          <a:path path=\"circle\">",
    "            <a:fillToRect l=\"50000\" t=\"50000\" r=\"50000\" b=\"50000\"/>",
    "          </a:path>",
    "        </a:gradFill>",
    "      </a:bgFillStyleLst>",
    "    </a:fmtScheme>",
    "  </a:themeElements>",
    "  <a:objectDefaults>",
    "    <a:spDef>",
    "      <a:spPr/>",
    "      <a:bodyPr/>",
    "      <a:lstStyle/>",
    "      <a:style>",
    "        <a:lnRef idx=\"1\">",
    "          <a:schemeClr val=\"accent1\"/>",
    "        </a:lnRef>",
    "        <a:fillRef idx=\"3\">",
    "          <a:schemeClr val=\"accent1\"/>",
    "        </a:fillRef>",
    "        <a:effectRef idx=\"2\">",
    "          <a:schemeClr val=\"accent1\"/>",
    "        </a:effectRef>",
    "        <a:fontRef idx=\"minor\">",
    "          <a:schemeClr val=\"lt1\"/>",
    "        </a:fontRef>",
    "      </a:style>",
    "    </a:spDef>",
    "    <a:lnDef>",
    "      <a:spPr/>",
    "      <a:bodyPr/>",
    "      <a:lstStyle/>",
    "      <a:style>",
    "        <a:lnRef idx=\"2\">",
    "          <a:schemeClr val=\"accent1\"/>",
    "        </a:lnRef>",
    "        <a:fillRef idx=\"0\">",
    "          <a:schemeClr val=\"accent1\"/>",
    "        </a:fillRef>",
    "        <a:effectRef idx=\"1\">",
    "          <a:schemeClr val=\"accent1\"/>",
    "        </a:effectRef>",
    "        <a:fontRef idx=\"minor\">",
    "          <a:schemeClr val=\"tx1\"/>",
    "        </a:fontRef>",
    "      </a:style>",
    "    </a:lnDef>",
    "  </a:objectDefaults>",
    "  <a:extraClrSchemeLst/>",
    "</a:theme>"
  ].join("\n");
  
  var XLSX_XML = '<?xml version="1.0" encoding="UTF-8"?>';
  var XLSX_SS_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  var XLSX_DOC_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  var XLSX_PKG_REL = 'http://schemas.openxmlformats.org/package/2006/relationships';
  var XLSX_CT = 'application/vnd.openxmlformats-';
  
  // Parts that do not depend on the data (better-xlsx file.js makeParts, one sheet named "Sheet1").
  var XLSX_STATIC = {
    workbook: XLSX_XML + '<workbook xmlns="' + XLSX_SS_NS + '" xmlns:r="' + XLSX_DOC_REL + '"><fileVersion appName="JS XLSX"/><workbookPr showObjects="all"/><bookViews><workbookView showHorizontalScroll="1" showSheetTabs="1" showVerticalScroll="1" tabRatio="204" windowHeight="8192" windowWidth="16384" xWindow="0" yWindow="0"/></bookViews><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1" state="visible"/></sheets><calcPr iterateCount="100" iterate="0" iterateDelta="0.001" refMode="A1"/></workbook>',
    rels: XLSX_XML + '\n<Relationships xmlns="' + XLSX_PKG_REL + '">\n' +
      '  <Relationship Id="rId1" Type="' + XLSX_DOC_REL + '/officeDocument" Target="xl/workbook.xml"/>\n' +
      '  <Relationship Id="rId2" Type="' + XLSX_PKG_REL + '/metadata/core-properties" Target="docProps/core.xml"/>\n' +
      '  <Relationship Id="rId3" Type="' + XLSX_DOC_REL + '/extended-properties" Target="docProps/app.xml"/>\n' +
      '</Relationships>',
    app: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">\n  <TotalTime>0</TotalTime>\n  <Application>JS XLSX</Application>\n</Properties>',
    core: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"></cp:coreProperties>',
    wbRels: XLSX_XML + '<Relationships xmlns="' + XLSX_PKG_REL + '">' +
      '<Relationship Id="rId1" Target="worksheets/sheet1.xml" Type="' + XLSX_DOC_REL + '/worksheet"/>' +
      '<Relationship Id="rId2" Target="sharedStrings.xml" Type="' + XLSX_DOC_REL + '/sharedStrings"/>' +
      '<Relationship Id="rId3" Target="theme/theme1.xml" Type="' + XLSX_DOC_REL + '/theme"/>' +
      '<Relationship Id="rId4" Target="styles.xml" Type="' + XLSX_DOC_REL + '/styles"/></Relationships>',
    types: XLSX_XML + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="' + XLSX_CT + 'package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/_rels/.rels" ContentType="' + XLSX_CT + 'package.relationships+xml"/>' +
      '<Override PartName="/docProps/app.xml" ContentType="' + XLSX_CT + 'officedocument.extended-properties+xml"/>' +
      '<Override PartName="/docProps/core.xml" ContentType="' + XLSX_CT + 'package.core-properties+xml"/>' +
      '<Override PartName="/xl/_rels/workbook.xml.rels" ContentType="' + XLSX_CT + 'package.relationships+xml"/>' +
      '<Override PartName="/xl/sharedStrings.xml" ContentType="' + XLSX_CT + 'officedocument.spreadsheetml.sharedStrings+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="' + XLSX_CT + 'officedocument.spreadsheetml.styles+xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="' + XLSX_CT + 'officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/theme/theme1.xml" ContentType="' + XLSX_CT + 'officedocument.theme+xml"/>' +
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="' + XLSX_CT + 'officedocument.spreadsheetml.worksheet+xml"/></Types>'
  };
  
  // better-xlsx node.js escape() for text nodes (only & < > and CR).
  var xlsxEsc = function (s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r/g, '&#xD;');
  };
  
  // better-xlsx lib.js num2col: 0 -> A, 26 -> AA.
  var xlsxColName = function (c) {
    var s = '';
    for (++c; c; c = Math.floor((c - 1) / 26)) s = String.fromCharCode(((c - 1) % 26) + 65) + s;
    return s;
  };
  
  // jszip utf8.js string2buf (what jszip uses in the browser; differs from TextEncoder on lone surrogates).
  var xlsxUtf8 = function (str) {
    var out = [], i, c, c2;
    for (i = 0; i < str.length; i++) {
      c = str.charCodeAt(i);
      if ((c & 0xfc00) === 0xd800 && i + 1 < str.length) {
        c2 = str.charCodeAt(i + 1);
        if ((c2 & 0xfc00) === 0xdc00) { c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00); i++; }
      }
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >>> 6), 0x80 | (c & 0x3f));
      else if (c < 0x10000) out.push(0xe0 | (c >>> 12), 0x80 | ((c >>> 6) & 0x3f), 0x80 | (c & 0x3f));
      else out.push(0xf0 | (c >>> 18), 0x80 | ((c >>> 12) & 0x3f), 0x80 | ((c >>> 6) & 0x3f), 0x80 | (c & 0x3f));
    }
    return new Uint8Array(out);
  };
  
  var xlsxCrcTable = null;
  var xlsxCrc32 = function (bytes) {
    var c, n, k, crc = -1;
    if (!xlsxCrcTable) {
      xlsxCrcTable = [];
      for (n = 0; n < 256; n++) {
        c = n;
        for (k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        xlsxCrcTable.push(c >>> 0);
      }
    }
    for (n = 0; n < bytes.length; n++) crc = (crc >>> 8) ^ xlsxCrcTable[(crc ^ bytes[n]) & 0xff];
    return (crc ^ -1) >>> 0;
  };
  
  // Minimal zip writer (STORE). parts: [[path, xmlString], ...] in jszip insertion order.
  var xlsxZip = function (parts) {
    var now = new Date();
    // jszip stamps entries with the UTC DOS date/time.
    var dosTime = (now.getUTCHours() << 11) | (now.getUTCMinutes() << 5) | (now.getUTCSeconds() / 2);
    var dosDate = ((now.getUTCFullYear() - 1980) << 9) | ((now.getUTCMonth() + 1) << 5) | now.getUTCDate();
    var entries = [], size = 22, cdSize = 0, i;
    for (i = 0; i < parts.length; i++) {
      var name = xlsxUtf8(parts[i][0]), body = xlsxUtf8(parts[i][1]);
      entries.push({ name: name, body: body, crc: xlsxCrc32(body) });
      size += 30 + name.length + body.length + 46 + name.length;
      cdSize += 46 + name.length;
    }
    var buf = new Uint8Array(size), dv = new DataView(buf.buffer), p = 0;
    var head = function (sig, e, central) {
      dv.setUint32(p, sig, true); p += 4;
      if (central) { dv.setUint16(p, 20, true); p += 2; }
      dv.setUint16(p, 20, true); dv.setUint16(p + 2, 0, true); dv.setUint16(p + 4, 0, true);
      dv.setUint16(p + 6, dosTime, true); dv.setUint16(p + 8, dosDate, true);
      dv.setUint32(p + 10, e.crc, true); dv.setUint32(p + 14, e.body.length, true); dv.setUint32(p + 18, e.body.length, true);
      dv.setUint16(p + 22, e.name.length, true); dv.setUint16(p + 24, 0, true); p += 26;
      if (central) {
        dv.setUint16(p, 0, true); dv.setUint16(p + 2, 0, true); dv.setUint16(p + 4, 0, true);
        dv.setUint32(p + 6, 0, true); dv.setUint32(p + 10, e.offset, true); p += 14;
      }
      buf.set(e.name, p); p += e.name.length;
    };
    for (i = 0; i < entries.length; i++) {
      entries[i].offset = p;
      head(0x04034b50, entries[i], false);
      buf.set(entries[i].body, p); p += entries[i].body.length;
    }
    var cdStart = p;
    for (i = 0; i < entries.length; i++) head(0x02014b50, entries[i], true);
    dv.setUint32(p, 0x06054b50, true); dv.setUint16(p + 4, 0, true); dv.setUint16(p + 6, 0, true);
    dv.setUint16(p + 8, entries.length, true); dv.setUint16(p + 10, entries.length, true);
    dv.setUint32(p + 12, cdSize, true); dv.setUint32(p + 16, cdStart, true); dv.setUint16(p + 20, 0, true);
    return buf;
  };
  
  // file-saver 2.0.5 "download attribute" branch (Chromium): same anchor, MIME and timers.
  var xlsxSaveBlob = function (blob, name) {
    var U = window.URL || window.webkitURL;
    var a = document.createElement('a');
    name = name || blob.name || 'download';
    a.download = name;
    a.rel = 'noopener';
    a.href = U.createObjectURL(blob);
    setTimeout(function () { U.revokeObjectURL(a.href); }, 4E4);
    setTimeout(function () {
      try {
        a.dispatchEvent(new MouseEvent('click'));
      } catch (e) {
        var evt = document.createEvent('MouseEvents');
        evt.initMouseEvent('click', true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null);
        a.dispatchEvent(evt);
      }
    }, 0);
  };
  
  // saveXlsx(data, "payments") == native exportXlsx() with filename "payments" -> "payments.xlsx".
  var saveXlsx = function (data, filename) {
    var exportData = data;
    // Same as native: only the first row's keys become columns; empty data throws a TypeError here.
    var fields = Object.keys(exportData[0]);
    // antd-table-saveas-excel style.ts default font.
    var fontName = /macintosh|mac os x/i.test(navigator.userAgent.toLowerCase()) ? 'PingFang SC' : 'Microsoft YaHei';
  
    // Style tables, filled in the order better-xlsx registers them (cols first, then cells row by row).
    var fontBase = '<sz val="12"/><name val="' + fontName + '"/>';
    var FONT_BODY = '<font>' + fontBase + '</font>';
    var FONT_HEAD = '<font>' + fontBase + '<color rgb="FF333333"/><b/></font>';
    var FILL_NONE = '<fill><patternFill patternType="none"><fgColor rgb="FFFFFFFF"/><bgColor rgb="00000000"/></patternFill></fill>';
    var FILL_GRAY = '<fill><patternFill patternType="lightGray"></patternFill></fill>';
    var FILL_HEAD = '<fill><patternFill patternType="solid"><fgColor rgb="FF88c849"/><bgColor rgb="ffffffff"/></patternFill></fill>';
    var side = function (color) {
      var s = '';
      ['left', 'right', 'top', 'bottom'].forEach(function (k) {
        s += '<' + k + ' style="' + (color ? 'thin' : 'none') + '">' + (color ? '<color rgb="' + color + '"/>' : '') + '</' + k + '>';
      });
      return '<border>' + s + '</border>';
    };
    var BORDER_NONE = side(null), BORDER_HEAD = side('FF000000');
    var fonts = [], fills = [], borders = [BORDER_NONE];
    var idx = function (list, item) {
      var i = list.indexOf(item);
      if (i < 0) { i = list.length; list.push(item); }
      return i;
    };
    // numFmtId keeps its JS type: better-xlsx compares ids with ===, so 0 (strings) and '0' (numbers)
    // become two identical-looking xfs; the "#type" suffix keeps that split.
    var xfXml = function (fo, fi, bo, h, v, wrap, fmt) {
      return '<xf applyAlignment="0" applyBorder="0" applyFont="0" applyFill="0" applyNumberFormat="' + (fmt > 0 ? 1 : 0) +
        '" applyProtection="0" borderId="' + bo + '" fillId="' + fi + '" fontId="' + fo + '" numFmtId="' + fmt +
        '"><alignment horizontal="' + h + '" indent="0" shrinkToFit="0" textRotation="0" vertical="' + v +
        '" wrapText="' + (wrap ? 1 : 0) + '"/></xf>#' + typeof fmt;
    };
    var xfs = [xfXml(0, 0, 0, 'general', 'bottom', false, 0)]; // cellXfs[0] = default Xxf
    var xf = function (font, fill, border, h, v, wrap, fmt) {
      var fo = idx(fonts, font), fi = idx(fills, fill);
      idx(fills, FILL_GRAY); // better-xlsx style.js "HACK" grey fill after every style
      return idx(xfs, xfXml(fo, fi, idx(borders, border), h, v, wrap, fmt));
    };
  
    // Shared strings (reftable.js keeps a plain object, quirks included).
    var strings = [], known = {};
    var addString = function (s) {
      if (known[s] === undefined) { known[s] = strings.length; strings.push(s); }
      return known[s];
    };
  
    var ROW_HT = 1 * 28.3464567; // setHeightCM(1): header and every data row
    var rows = [];
    var maxCell = 0;
    var cell = function (r, c, value, styleId) {
      var ref = xlsxColName(c) + (r + 1), kind, tag, out;
      if (c > maxCell) maxCell = c;
      // better-xlsx cell.js value setter, with kind-of 6 type detection.
      if (value === undefined || value === null) { value = ''; kind = 'string'; }
      else {
        kind = typeof value;
        if (kind === 'object' && !Array.isArray(value) &&
          (value instanceof Date || (typeof value.toDateString === 'function' && typeof value.getDate === 'function' && typeof value.setDate === 'function'))) kind = 'date';
        else if (kind !== 'string' && kind !== 'number' && kind !== 'boolean') {
          tag = Object.prototype.toString.call(value);
          kind = tag === '[object Number]' ? 'number' : tag === '[object String]' ? 'string' : tag === '[object Boolean]' ? 'boolean' : 'other';
        }
        if (kind === 'other') { value = value.toString(); kind = 'string'; }
      }
      if (kind === 'string') {
        out = '<c r="' + ref + '" t="s" s="' + styleId(0) + '"';
        return value ? out + '><v>' + String(addString(value)) + '</v></c>' : out + '/>';
      }
      if (kind === 'boolean') return '<c r="' + ref + '" t="b" s="' + styleId(0) + '"><v>' + (value ? 1 : 0) + '</v></c>';
      if (kind === 'number') return '<c r="' + ref + '" s="' + styleId('0') + '"><v>' + String(value) + '</v></c>';
      return '<c r="' + ref + '" s="' + styleId('22') + '"><v>' + String(value.getTime() / 1000 / 86400.0 + 25569.0) + '</v></c>';
    };
  
    // Columns: width px2cm(150) = 20, left aligned.
    var colsXml = '';
    fields.forEach(function (f, i) {
      var s = xf(FONT_BODY, FILL_NONE, BORDER_NONE, 'left', 'bottom', false, 0);
      colsXml += '<col min="' + (i + 1) + '" max="' + (i + 1) + '" hidden="0" width="20" customWidth="1" collapsed="0" outlineLevel="0" style="' + s + '"/>';
    });
    var headStyle = function () { return xf(FONT_HEAD, FILL_HEAD, BORDER_HEAD, 'left', 'center', true, 0); };
    var bodyStyle = function (fmt) { return xf(FONT_BODY, FILL_NONE, BORDER_NONE, 'general', 'bottom', true, fmt); };
    // No header row when the first row has no keys (getColumnsMaxDepth([]) is -Infinity).
    if (fields.length) rows.push(fields.map(function (f, c) { return cell(0, c, f, headStyle); }).join(''));
    exportData.forEach(function (item) {
      var r = rows.length;
      rows.push(fields.map(function (f, c) { return cell(r, c, item[f], bodyStyle); }).join(''));
    });
  
    var sheetData = rows.map(function (cells, r) {
      var open = '<row r="' + (r + 1) + '" customHeight="1" ht="' + ROW_HT + '" outlineLevel="0"';
      return cells ? open + '>' + cells + '</row>' : open + '/>';
    }).join('');
    var dim = 'A1:' + xlsxColName(maxCell) + (rows.length ? rows.length : 1);
    if (dim === 'A1:A1') dim = 'A1';
    var sheet = XLSX_XML + '<worksheet xmlns="' + XLSX_SS_NS + '" xmlns:r="' + XLSX_DOC_REL + '">' +
      '<sheetPr filterMode="0"><pageSetUpPr fitToPage="0"/></sheetPr><dimension ref="' + dim + '"/>' +
      '<sheetViews><sheetView colorId="64" defaultGridColor="1" rightToLeft="0" showFormulas="0" showGridLines="1" showOutlineSymbols="1" showRowColHeaders="1" showZeros="1" tabSelected="1" topLeftCell="A1" view="normal" windowProtection="0" workbookViewId="0" zoomScale="100" zoomScaleNormal="100" zoomScalePageLayoutView="100"><selection activeCell="A1" activeCellId="0" pane="topLeft" sqref="A1"/></sheetView></sheetViews>' +
      '<sheetFormatPr defaultRowHeight="12.85"/>' +
      (colsXml ? '<cols>' + colsXml + '</cols>' : '<cols/>') +
      (sheetData ? '<sheetData>' + sheetData + '</sheetData>' : '<sheetData/>') +
      '<printOptions gridLines="0" gridLinesSet="1" headings="0" horizontalCentered="0" verticalCentered="0"/>' +
      '<pageMargins left="0.7875" right="0.7875" top="1.05277777777778" bottom="1.05277777777778" header="0.7875" footer="0.7875"/>' +
      '<pageSetup blackAndWhite="0" cellComments="none" copies="1" draft="0" firstPageNumber="1" fitToHeight="1" fitToWidth="1" horizontalDpi="300" orientation="portrait" pageOrder="downThenOver" paperSize="9" scale="100" useFirstPageNumber="1" usePrinterDefaults="0" verticalDpi="300"/>' +
      '<headerFooter><oddHeader>&amp;C&amp;"Times New Roman,Regular"&amp;12&amp;A</oddHeader><oddFooter>&amp;C&amp;"Times New Roman,Regular"&amp;12Page &amp;P</oddFooter></headerFooter></worksheet>';
  
    var sst = XLSX_XML + '<sst xmlns="' + XLSX_SS_NS + '"' + (strings.length ? '>' + strings.map(function (s) {
      return '<si><t>' + (typeof s === 'string' ? xlsxEsc(s) : s.toString()) + '</t></si>';
    }).join('') + '</sst>' : '/>');
  
    var list = function (tag, items) { return items.length ? '<' + tag + ' count="' + items.length + '">' + items.join('') + '</' + tag + '>' : ''; };
    var styles = XLSX_XML + '<styleSheet xmlns="' + XLSX_SS_NS + '">' + list('fonts', fonts) + list('fills', fills) +
      list('borders', borders) + list('cellXfs', xfs.map(function (x) { return x.split('#')[0]; })) + '</styleSheet>';
  
    var zip = xlsxZip([
      ['xl/worksheets/sheet1.xml', sheet],
      ['xl/workbook.xml', XLSX_STATIC.workbook],
      ['_rels/.rels', XLSX_STATIC.rels],
      ['docProps/app.xml', XLSX_STATIC.app],
      ['docProps/core.xml', XLSX_STATIC.core],
      ['xl/theme/theme1.xml', XLSX_THEME],
      ['xl/sharedStrings.xml', sst],
      ['xl/_rels/workbook.xml.rels', XLSX_STATIC.wbRels],
      ['[Content_Types].xml', XLSX_STATIC.types],
      ['xl/styles.xml', styles]
    ]);
    // jszip generateAsync({type: 'blob'}) default mimeType.
    xlsxSaveBlob(new Blob([zip], { type: 'application/zip' }), filename + '.xlsx');
  };
  
  
    /* ---------- react-csv 2.0.3 CSVLink and Shared/DownloadOptions ---------- */
    var csvIsSafari = function () { return /^((?!chrome|android).)*safari/i.test(navigator.userAgent); };
    var csvIsJsons = function (array) {
      return Array.isArray(array) && array.every(function (row) { return typeof row === "object" && !(row instanceof Array); });
    };
    var csvIsArrays = function (array) {
      return Array.isArray(array) && array.every(function (row) { return Array.isArray(row); });
    };
    //union of the keys of every row, in first-seen order (react-csv builds it with a Set)
    var csvJsonsHeaders = function (array) {
      var out = [];
      array.forEach(function (json) { Object.keys(json).forEach(function (k) { if (out.indexOf(k) < 0) out.push(k); }); });
      return out;
    };
    var csvGetHeaderValue = function (property, obj) {
      var foundValue = property
        .replace(/\[([^\]]+)]/g, ".$1")
        .split(".")
        .reduce(function (o, p, i, arr) {
          if (o[p] === undefined) arr.splice(1);
          else return o[p];
        }, obj);
      return foundValue === undefined ? (property in obj ? obj[property] : "") : foundValue;
    };
    var csvJsons2arrays = function (jsons, headers) {
      headers = headers || csvJsonsHeaders(jsons);
      var headerLabels = headers;
      var headerKeys = headers;
      if (csvIsJsons(headers)) {
        headerLabels = headers.map(function (header) { return header.label; });
        headerKeys = headers.map(function (header) { return header.key; });
      }
      var data = jsons.map(function (object) { return headerKeys.map(function (header) { return csvGetHeaderValue(header, object); }); });
      return [headerLabels].concat(data);
    };
    var csvElementOrEmpty = function (element) { return element || element === 0 ? element : ""; };
    var csvJoiner = function (data, separator, enclosingCharacter) {
      if (separator === undefined) separator = ",";
      if (enclosingCharacter === undefined) enclosingCharacter = '"';
      return data
        .filter(function (e) { return e; })
        .map(function (row) {
          return row
            .map(function (element) { return csvElementOrEmpty(element); })
            .map(function (column) { return enclosingCharacter + String(column) + enclosingCharacter; })
            .join(separator);
        })
        .join("\n");
    };
    var csvToCSV = function (data, headers, separator, enclosingCharacter) {
      if (csvIsJsons(data)) return csvJoiner(csvJsons2arrays(data, headers), separator, enclosingCharacter);
      if (csvIsArrays(data)) return csvJoiner(headers ? [headers].concat(data) : data, separator, enclosingCharacter);
      if (typeof data === "string") return headers ? headers.join(separator) + "\n" + data : data;
      throw new TypeError('Data should be a "String", "Array of arrays" OR "Array of objects" ');
    };
    var csvBuildURI = function (data, uFEFF, headers, separator, enclosingCharacter) {
      var csv = csvToCSV(data, headers, separator, enclosingCharacter);
      var type = csvIsSafari() ? "application/csv" : "text/csv";
      var blob = new Blob([uFEFF ? "\uFEFF" : "", csv], { type: type });
      var dataURI = "data:" + type + ";charset=utf-8," + (uFEFF ? "\uFEFF" : "") + csv;
      var URLx = window.URL || window.webkitURL;
      return typeof URLx.createObjectURL === "undefined" ? dataURI : URLx.createObjectURL(blob);
    };
    var CSV_OWN = ["data", "headers", "separator", "filename", "uFEFF", "children", "onClick", "asyncOnClick", "enclosingCharacter"];
    var CSVLink = class extends React.Component {
      constructor(props) {
        super(props);
        this.state = { href: "" };
      }
      componentDidMount() {
        var p = this.props;
        this.setState({ href: csvBuildURI(p.data, p.uFEFF, p.headers, p.separator, p.enclosingCharacter) });
      }
      componentDidUpdate(prevProps) {
        if (this.props !== prevProps) {
          var p = this.props;
          this.setState({ href: csvBuildURI(p.data, p.uFEFF, p.headers, p.separator) });
        }
      }
      handleLegacy(event) {
        if (window.navigator.msSaveOrOpenBlob) {
          event.preventDefault();
          var p = this.props;
          var blob = new Blob([p.uFEFF ? "\uFEFF" : "", csvToCSV(p.data, p.headers, p.separator, p.enclosingCharacter)]);
          window.navigator.msSaveBlob(blob, p.filename);
          return false;
        }
      }
      handleClick() {
        var me = this;
        return function (event) {
          if (typeof me.props.onClick === "function") {
            if (me.props.asyncOnClick) {
              me.props.onClick(event, function (proceed) {
                if (proceed === false) {
                  event.preventDefault();
                  return;
                }
                me.handleLegacy(event);
              });
              return;
            }
            if (me.props.onClick(event) === false) {
              event.preventDefault();
              return;
            }
            me.handleLegacy(event);
            return;
          }
          me.handleLegacy(event);
        };
      }
      render() {
        var me = this;
        var rest = {};
        Object.keys(this.props).forEach(function (k) { if (CSV_OWN.indexOf(k) < 0) rest[k] = me.props[k]; });
        return (
          <a download={this.props.filename} {...rest} ref={function (link) { me.link = link; }} target="_self" href={this.state.href} onClick={this.handleClick()}>
            {this.props.children}
          </a>
        );
      }
    };
    CSVLink.defaultProps = { separator: ",", filename: "generatedBy_react-csv.csv", uFEFF: true, asyncOnClick: false };
    var DownloadOptions = function (props) {
      var data = props.data;
      var filename = props.filename;
      var exportXlsx = function () {
        if (props.onExport) return props.onExport();
        saveXlsx(data, filename);
      };
      return (
        <Button className={(props.buttonClassName || "") + " pg-excel"} icon={<Ico type="file-excel" />} onClick={exportXlsx} disabled={data.length === 0}>
          {t("Excel")}
        </Button>
      );
    };
  
  
  
    /* ---------- Payments/OriginSelect, PaymentTypeSelect, ValueAddedSelect ---------- */
    var OriginSelect = function (props) {
      var s1 = useState(false);
      var loading = s1[0];
      var data = [
        { code: "CLA", name: t("Claim") },
        { code: "POL", name: t("Policy") },
        { code: "COM", name: t("Commission liquidation") },
        { code: "TAX", name: t("Tax liquidation") },
        { code: "RE", name: t("Reinsurance liquidation") },
        { code: "REPROFIT", name: t("Reinsurance profit commission liquidation") },
        { code: "COI", name: t("Coinsurance liquidation") },
        { code: "ANNUITIES", name: t("Annuity") },
        { code: "MERGED", name: t("Merged Payments") },
        { code: "MANUAL", name: t("Manual Request") },
        { code: "REINST", name: t("Reinsurance Reinstatements") },
        { code: "EXNI", name: t("Non Insurance Expense") },
        { code: "CLAIMSFUND", name: t("Claims Fund Funding") },
        { code: "SERVICELIQ", name: t("Service Order Liquidation") },
        { code: "CREDIT", name: t("Credit Payable") }
      ];
      return (
        <Select value={props.value} onChange={props.onChange} loading={loading} allowClear showSearch optionFilterProp="children">
          {data.map(function (p) { return <Select.Option value={p.code} key={p.code}>{p.name}</Select.Option>; })}
        </Select>
      );
    };
    var PaymentTypeSelect = function (props) {
      var s1 = useState([]);
      var data = s1[0];
      var setData = s1[1];
      var s2 = useState(false);
      var loading = s2[0];
      var setLoading = s2[1];
      useEffect(function () { load(); }, []);
      useEffect(function () {
        //triggers onSelect in the parent when the value was set by form.setFieldsValue (no onChange nor onSelect then)
        var selected = data.find(function (p) { return p.code == props.value; });
        if (props.onSelect) props.onSelect(selected);
      }, [props.triggerSelect, data]);
      var load = function () {
        setLoading(true);
        exe("RepoPaymentTypeCatalog", { operation: "GET" }).then(function (r) {
          setLoading(false);
          if (r.ok) setData(r.outData);
          else message.error(r.msg);
        });
      };
      var onSelect = function (v, opt) {
        if (props.onSelect) props.onSelect(opt.props.record);
      };
      return (
        <Select value={props.value} onChange={function (v) { props.onChange(v); }} onSelect={onSelect} loading={loading} style={Object.assign({ width: "100%" }, props.style)} placeholder={t("Please select...")} disabled={props.disabled} allowClear>
          {data.map(function (p) { return <Select.Option value={p.code} key={p.code} record={p}>{t(p.name)}</Select.Option>; })}
        </Select>
      );
    };
    var ValueAddedSelect = function (props) {
      var s1 = useState([]);
      var data = s1[0];
      var setData = s1[1];
      var s2 = useState(false);
      var loading = s2[0];
      var setLoading = s2[1];
      useEffect(function () { load(); }, []);
      var load = function () {
        setLoading(true);
        var filter = props.taxType ? "taxType='" + props.taxType + "'" : "";
        exe("RepoValueAddedCatalog", { operation: "GET", filter: filter }).then(function (r) {
          setLoading(false);
          if (r.ok) setData(r.outData);
          else message.error(r.msg);
        });
      };
      var onSelect = function (v, opt) {
        if (props.onSelect) props.onSelect(opt.props.record);
      };
      return (
        <Select value={props.value} onChange={function (v) { if (props.onChange) props.onChange(v); }} onSelect={onSelect} loading={loading} style={Object.assign({ width: "100%" }, props.style)} placeholder={t("Please select...")} disabled={props.disabled} allowClear>
          {data.map(function (p) { return <Select.Option value={p.code} key={p.code} record={p}>{t(p.name)}</Select.Option>; })}
        </Select>
      );
    };
  
    /* ---------- Payments/TaxField ---------- */
    var TaxField = function (props) {
      var s1 = useState(false);
      var detailVisible = s1[0];
      var setDetailVisible = s1[1];
      var s2 = useState(undefined);
      var selectedTax = s2[0];
      var setSelectedTax = s2[1];
      var s3 = useState(["DED", "RETSALV", "ADDSALV"]);
      var editableTaxTypes = s3[0];
      var setEditableTaxTypes = s3[1];
      var detail = props.detail || [];
      var taxes = detail.filter(function (p) { return p.taxType === props.taxType; }) || [];
      var otherTaxes = detail.filter(function (p) { return p.taxType !== props.taxType; }) || [];
      var grossAmount = props.grossAmount || 0;
      useEffect(function () {
        getConfigProfile().then(function (profile) {
          setEditableTaxTypes(safeGet(["Payment", "editableTaxTypes"], profile, ["DED", "RETSALV", "ADDSALV"]));
        });
      }, []);
      useEffect(function () {
        if (props.grossAmount && taxes.length > 0 && taxes.some(function (p) { return p.grossAmount !== props.grossAmount; })) {
          var newTaxes = taxes.map(function (p) { return Object.assign({}, p, { grossAmount: props.grossAmount, amount: roundMoney(p.rate * props.grossAmount, props.currency) }); });
          var newTotal = newTaxes.reduce(function (p, c) { return p + c.amount; }, 0);
          props.onChange(newTotal);
          props.onDetailChange(otherTaxes.concat(newTaxes));
        }
      }, [props.grossAmount]);
      var onAddTax = function (record) {
        setSelectedTax(record.code);
        if (taxes.find(function (p) { return p.valueAddedCode === record.code; })) {
          message.error(t("Tax already included"));
          setSelectedTax(undefined);
          return;
        }
        record.amount = roundMoney(record.rate * grossAmount, props.currency);
        record.grossAmount = grossAmount;
        record.valueAddedCode = record.code;
        record.taxType = record.taxType;
        record.taxName = record.name;
        var newTaxes = taxes.concat([record]);
        var newTotal = newTaxes.reduce(function (p, c) { return p + c.amount; }, 0);
        props.onChange(newTotal);
        props.onDetailChange(otherTaxes.concat(newTaxes));
      };
      var onRemoveTax = function (code) {
        var newTaxes = taxes.filter(function (p) { return p.valueAddedCode !== code; });
        var newTotal = newTaxes.reduce(function (p, c) { return p + c.amount; }, 0);
        props.onChange(newTotal);
        props.onDetailChange(otherTaxes.concat(newTaxes));
      };
      var onSubmit = function () {
        setDetailVisible(false);
        setSelectedTax(undefined);
      };
      var onChangeAmount = function (record, newValue) {
        record.amount = newValue;
        var newTaxes = taxes.slice();
        var newTotal = newTaxes.reduce(function (p, c) { return p + c.amount; }, 0);
        props.onChange(newTotal);
        props.onDetailChange(otherTaxes.concat(newTaxes));
      };
      return (
        <div style={{ display: "flex" }}>
          <Money value={props.value} currency={props.currency} disabled />
          <Button type="link" icon={<Ico type="plus-circle" />} onClick={function () { setDetailVisible(true); }} disabled={!grossAmount} />
          <Modal title={t("Detail")} visible={detailVisible} onCancel={function () { setDetailVisible(false); }} onOk={onSubmit}>
            <ValueAddedSelect onSelect={onAddTax} taxType={props.taxType} visible={detailVisible} value={selectedTax} onChange={setSelectedTax} />
            <Table style={{ marginTop: 5 }} dataSource={taxes} pagination={false} size={"small"} rowKey={"valueAddedCode"}>
              <Table.Column title={t("Code")} dataIndex="valueAddedCode" />
              <Table.Column title={t("Name")} dataIndex="taxName" />
              <Table.Column title={t("Rate")} dataIndex="rate" />
              <Table.Column title={t("Amount")} dataIndex="amount" render={function (v, r) { return editableTaxTypes.indexOf(r.taxType) >= 0 ? <InputNumber value={v} onChange={function (value) { onChangeAmount(r, value); }} /> : v; }} />
              <Table.Column title={t("Actions")} key="actions" render={function (v, r) {
                return (
                  <div>
                    <Button type="link" icon={<Ico type="delete" />} onClick={function () { onRemoveTax(r.valueAddedCode); }} />
                  </div>
                );
              }} />
            </Table>
          </Modal>
        </div>
      );
    };
  
    /* ---------- Payments/PaymentDocuments ---------- */
    var paymentTemplates = function (profile) {
      var templates = profile && profile.Payment ? profile.Payment.templates : undefined;
      return Array.isArray(templates) ? templates : [];
    };
    var PaymentDocuments = function (props) {
      var paymentId = props.paymentId;
      var s1 = useState([]);
      var data = s1[0];
      var setData = s1[1];
      var s2 = useState(false);
      var loading = s2[0];
      var setLoading = s2[1];
      var s3 = useState(0);
      var generated = s3[0];
      var setGenerated = s3[1];
      useEffect(function () {
        if (paymentId) load(paymentId);
      }, [paymentId]);
      var load = function (id) {
        setLoading(true);
        exe("RepoPaymentDocument", { operation: "GET", filter: "paymentId=" + id }).then(function (r) {
          setLoading(false);
          if (r.ok) setData(r.outData);
          else message.error(r.msg);
        });
      };
      var generatePaymentDoc = function (name) {
        if (!name) return;
        setLoading(true);
        exe("GeneratePaymentDoc", { paymentId: paymentId, template: name }).then(function (r) {
          setLoading(false);
          if (r.ok) {
            message.success(r.msg);
            setGenerated(function (g) { return g + 1; });
            load(paymentId);
          } else {
            message.error(r.msg);
          }
        });
      };
      var openFile = function (v) {
        try {
          fetch(SS_API_URL + "/proxy" + v, { method: "GET", headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.token } })
            .then(function (response) { return response.blob(); })
            .then(function (blob) { window.open(URL.createObjectURL(blob)); })
            .catch(function (err) { console.log(err); });
        } catch (error) {
          console.log(error);
        }
      };
      return (
        <Modal title={t("Payment Documents")} className="pg-std" visible={props.visible} onCancel={props.onCancel} width={900} footer={null}>
          <Popover
            content={
              <div>
                <TemplateSelect key={generated} onChange={generatePaymentDoc} disabled={loading} loading={loading} userSelectableTemplates={(props.templates || []).map(function (p) { return p.name; })} />
              </div>
            }
            title={t("On demand document generation")}
            trigger="click">
            <Button type="link" icon={<Ico type="file-sync" />}>
              {t("Generate")}
            </Button>
          </Popover>
          <Button type="link" icon={<Ico type="reload" />} onClick={function () { load(paymentId); }}>
            {t("Reload")}
          </Button>
          <Table dataSource={data} loading={loading} scroll={{ x: true }} rowKey="id" style={{ marginTop: 16 }}>
            <Table.Column title={t("ID")} dataIndex="id" />
            <Table.Column title={t("Type")} dataIndex="name" />
            <Table.Column title={t("File")} dataIndex="url" render={function (v, r) {
              return (
                <Button type="link" onClick={function () { openFile(r.url); }}>
                  {t("Open")}
                </Button>
              );
            }} />
            <Table.Column title={t("File Name")} dataIndex="fileName" />
            <Table.Column title={t("Created")} dataIndex="created" render={function (v) { return v ? formatDate(v) : null; }} />
          </Table>
        </Modal>
      );
    };
  
    /* ---------- Payments/MergePayments ---------- */
    /* ---------- Accounting view of a payment (custom, not in the native view) ---------- */
    //A payment's entries are the Transactions with entity='ClaimPayment' and entityId = payment id; one payment can have several.
    var fmtAmount = function (v) {
      return Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    var entryStatus = function (status) {
      if (status === 1) return <Tag color="green">{t("Posted")}</Tag>;
      if (status === -1) return <Tag color="red">{t("Rejected")}</Tag>;
      return <Tag color="orange">{t("Draft")}</Tag>;
    };
    var PaymentAccounting = function (props) {
      var payment = props.payment;
      var s1 = useState([]);
      var entries = s1[0];
      var setEntries = s1[1];
      var s2 = useState(false);
      var loading = s2[0];
      var setLoading = s2[1];
      useEffect(function () {
        if (!payment) return;
        setLoading(true);
        setEntries([]);
        exe("RepoTransaction", { operation: "GET", filter: "entity='ClaimPayment' AND entityId=" + Number(payment.id), include: ["Lines", "Lines.Account"] }).then(function (r) {
          setLoading(false);
          if (r.ok) setEntries((r.outData || []).slice().sort(function (a, b) { return a.id - b.id; }));
          else message.error(r.msg);
        });
      }, [payment && payment.id]);
      return (
        <Modal
          visible={!!payment}
          title={t("Accounting Entries") + " - " + t("Payment") + " " + (payment ? payment.id : "")}
          width={1000}
          className="pg-acc-modal"
          onCancel={props.onCancel}
          footer={<Button onClick={props.onCancel}>{t("Close")}</Button>}>
          <Spin spinning={loading}>
            {!loading && entries.length === 0 ? <Empty description={t("This payment has no accounting entries yet")} /> : null}
            {entries.map(function (tx) {
              var lines = (tx.Lines || []).slice().sort(function (a, b) { return a.order - b.order; });
              var totalDebit = lines.reduce(function (s, l) { return s + Number(l.debit || 0); }, 0);
              var totalCredit = lines.reduce(function (s, l) { return s + Number(l.credit || 0); }, 0);
              return (
                <div key={tx.id} className="pg-acc-entry">
                  <div className="pg-acc-entry-head">
                    <span className="pg-acc-entry-id">{t("Entry") + " #" + tx.id}</span>
                    <span>{tx.code}</span>
                    <span>{formatDate(tx.date)}</span>
                    {entryStatus(tx.status)}
                    {tx.reversalOfId ? <Tag color="red">{t("Reversal of") + " #" + tx.reversalOfId}</Tag> : null}
                  </div>
                  <div className="pg-acc-entry-ref">{tx.reference}{tx.description && tx.description !== tx.reference ? " - " + tx.description : ""}</div>
                  <Table dataSource={lines} rowKey="id" size="small" pagination={false}>
                    <Table.Column title={t("Line")} dataIndex="order" width={60} />
                    <Table.Column title={t("Account")} dataIndex="account" render={function (v) { return <span className="pg-acc-account">{v}</span>; }} />
                    <Table.Column title={t("Name")} key="accountName" render={function (v, l) { return l.Account ? l.Account.name : null; }} />
                    <Table.Column title={t("Comments")} dataIndex="comments" />
                    <Table.Column title={t("Debit")} dataIndex="debit" align="right" render={function (v) { return <span className="pg-acc-num">{fmtAmount(v)}</span>; }} />
                    <Table.Column title={t("Credit")} dataIndex="credit" align="right" render={function (v) { return <span className="pg-acc-num">{fmtAmount(v)}</span>; }} />
                  </Table>
                  <div className="pg-acc-totals">
                    <span>{t("Total")}</span>
                    <span className="pg-acc-num">{fmtAmount(totalDebit)}</span>
                    <span className="pg-acc-num">{fmtAmount(totalCredit)}</span>
                    {Math.abs(totalDebit - totalCredit) > 0.005 ? <Tag color="red">{t("Unbalanced")}</Tag> : null}
                  </div>
                </div>
              );
            })}
          </Spin>
        </Modal>
      );
    };

    var MergePayments = LegacyForm.create()(function (props) {
      var form = props.form;
      var visible = props.visible;
      var items = props.items;
      var s1 = useState(false);
      var loading = s1[0];
      var setLoading = s1[1];
      var s2 = useState();
      var error = s2[0];
      var setError = s2[1];
      useEffect(function () {
        console.log(items);
        var errors = validate(items);
        if (errors) {
          setError(errors);
          form.setFieldsValue({ amount: 0, items: items.length });
        } else {
          var amount = items.reduce(function (sum, x) { return sum + x.total; }, 0);
          form.setFieldsValue({ amount: amount, items: items.length, beneficiary: items[0].contactId, currency: items[0].currency });
          setError();
        }
      }, [visible]);
      var validate = function (list) {
        var myErrors = "";
        if (list.length > 1) {
          if (!list.every(function (p) { return p.currency === list[0].currency; })) myErrors = t("All selected items must have the same currency");
          if (!list.every(function (p) { return p.contactId === list[0].contactId; })) myErrors = t("All selected items must have the same beneficiary");
          if (!list.every(function (p) { return p.entityState !== "MERGED"; })) myErrors = t("Some items have already been merged. Please check selection");
          if (!list.every(function (p) { return p.entityState !== "EXECUTED"; })) myErrors = t("Some items have already been executed. Please check selection");
          if (!list.every(function (p) { return p.entityState !== "CANCELLED"; })) myErrors = t("Some items are cancelled. Please check selection");
          if (!list.every(function (p) { return p.entityState !== "REVERTED"; })) myErrors = t("Some items are reverted. Please check selection");
          if (!list.every(function (p) { return p.producer !== "MERGED"; })) myErrors = t("Parent items cannot be merged. Please check selection");
        } else myErrors = t("At least 2 items must be selected");
        return myErrors;
      };
      var doMerge = function () {
        var paymentIds = items.map(function (p) { return p.id; });
        setLoading(true);
        exe("MergePayments", { paymentIds: paymentIds }).then(function (r) {
          setLoading(false);
          if (r.ok) {
            message.success(r.msg);
            props.onOk();
          } else message.error(r.msg);
        });
      };
      var field = form.getFieldDecorator;
      return (
        <div>
          {field("currency")}
          <Modal title={t("Merge payments")} visible={visible} onOk={doMerge} onCancel={props.onCancel} okText={t("Confirm")} okButtonProps={{ loading: loading, disabled: error }}>
            {error && <Alert message={t("Error")} description={error} type="error" showIcon />}
            <LegacyForm.Item label={t("Beneficiary")}>
              {field("beneficiary")(<SimpleContactSelect disabled />)}
            </LegacyForm.Item>
            <LegacyForm.Item label={t("Amount")}>
              {field("amount")(<Money currency={form.getFieldValue("currency")} disabled />)}
            </LegacyForm.Item>
            <LegacyForm.Item label={t("Items Selected")}>
              {field("items")(<InputNumber disabled />)}
            </LegacyForm.Item>
          </Modal>
        </div>
      );
    });
  
    /* ---------- Payments/ManualPaymentRequest ---------- */
    //numbers the custom form variable of every opening of either modal of the page (AXX-3465)
    var customFormSeq = 0;
    var LOCKED_FIELDS = ["contactId", "currency", "grossAmount", "total", "sourceAccountId", "accountId", "reference", "receiptTypeCode"];
    var CONFIGURABLE_FIELDS = ["concept", "branch", "paymentMethodCode", "paymentType", "requiresFiscalNumber", "fiscalNumber", "taxes", "retentions", "deductions"];
    var configurableRule = function (fieldName, fieldRules) {
      return CONFIGURABLE_FIELDS.indexOf(fieldName) >= 0 ? fieldRules.find(function (p) { return p.field === fieldName; }) : undefined;
    };
    var isPaymentFieldHidden = function (fieldName, fieldRules) {
      var rule = configurableRule(fieldName, fieldRules);
      return !!(rule && rule.hidden);
    };
    var paymentFieldRules = function (fieldName, baseRules, fieldRules) {
      var rule = configurableRule(fieldName, fieldRules);
      if (!rule) return baseRules;
      var rules = baseRules || [];
      var required = (rule.required || "").toLowerCase();
      if (rule.hidden) return rules.filter(function (p) { return !p.required; });
      if (fieldName === "paymentType") return rules.filter(function (p) { return !p.required; }).concat([{ required: true, message: t("Payment Type") + " " + t("is required") }]);
      if (required === "true") return rules.filter(function (p) { return !p.required; }).concat([{ required: true, message: t(fieldName) + " " + t("is required") }]);
      if (required === "false" && fieldName !== "fiscalNumber") return rules.filter(function (p) { return p.required !== true; });
      return baseRules;
    };
    //display:none instead of not rendering: the decorator stays registered (the hidden value is saved back)
    var PaymentFormItem = function (props) {
      var fieldRules = props.fieldRules;
      var rest = {};
      Object.keys(props).forEach(function (k) { if (k !== "fieldRules") rest[k] = props[k]; });
      var control = (rest.children && rest.children.props) || {};
      var hidden = isPaymentFieldHidden(control.id || control.name, fieldRules);
      return <LegacyForm.Item {...rest} style={hidden ? Object.assign({}, rest.style, { display: "none" }) : rest.style} />;
    };
    var DEFAULT_VALUE_FIELDS = ["contactId", "concept", "currency", "grossAmount", "paymentMethodCode", "branch", "reference", "paymentType", "sourceAccountId", "accountId"];
    var pickDefaultValues = function (outData) {
      var values = outData;
      if (typeof values === "string") {
        try {
          values = JSON.parse(values);
        } catch (e) {
          return {};
        }
      }
      if (!values || typeof values !== "object" || Array.isArray(values)) return {};
      return DEFAULT_VALUE_FIELDS.reduce(function (picked, f) {
        if (values[f] !== undefined && values[f] !== null) picked[f] = values[f];
        return picked;
      }, {});
    };
    //GLOB-1364: a new request only offers Cheque (CH) and account-to-account transfer (TF); editing keeps every method
    var NEW_REQUEST_METHODS = ["CH", "TF"];
    var ManualPaymentRequest = LegacyForm.create()(function (props) {
      var s1 = useState(false);
      var loading = s1[0];
      var setLoading = s1[1];
      var s2 = useState();
      var selectedContact = s2[0];
      var setSelectedContact = s2[1];
      var s3 = useState([]);
      var conceptData = s3[0];
      var setConceptData = s3[1];
      var s4 = useState([]);
      var allConceptData = s4[0];
      var setAllConceptData = s4[1];
      var s5 = useState(false);
      var costCentersVisible = s5[0];
      var setCostCentersVisible = s5[1];
      var s6 = useState(0);
      var triggerSelect = s6[0];
      var doTriggerSelect = s6[1];
      var s7 = useState(false);
      var readOnlyBeneficiary = s7[0];
      var setReadOnlyBeneficiary = s7[1];
      var s8 = useState([]);
      var fieldRules = s8[0];
      var setFieldRules = s8[1];
      var s9 = useState();
      var customFormId = s9[0];
      var setCustomFormId = s9[1];
      var exposedForm = useRef();
      var customFormVar = useRef();
      var openCount = useRef(0);
  
      useEffect(function () {
        var open = ++openCount.current;
        //exposes the open payment form so the custom form logic can read its values (AXX-3465)
        if (props.visible) window.paymentForm = exposedForm.current = props.form;
        if (props.record) {
          props.form.setFieldsValue(props.record);
          console.log("Loading Record", props.record);
          doTriggerSelect(function (c) { return c + 1; });
        } else {
          props.form.resetFields();
          if (props.visible) loadDefaultValues(open);
        }
        loadConcepts();
      }, [props.visible]);
      useEffect(function () {
        getConfigProfile().then(function (profile) {
          setReadOnlyBeneficiary(safeGet(["Payment", "readOnlyBeneficiary"], profile, false));
          setCustomFormId(safeGet(["Payment", "customFormId"], profile, undefined));
        });
        exe("RepoFieldRule", { operation: "GET", effective: true, filter: "entity='ClaimPayment'" }).then(function (r) {
          if (!r.ok) return;
          r.outData.filter(function (p) { return LOCKED_FIELDS.indexOf(p.field) >= 0; }).forEach(function (p) { console.warn("LOCKED payment field, Fields rule ignored:", p.field); });
          setFieldRules(r.outData);
        });
      }, []);
      useEffect(function () {
        return function () { if (window.paymentForm && window.paymentForm === exposedForm.current) delete window.paymentForm; };
      }, []);
  
      var doRequest = function () {
        props.form.validateFields(function (err, vals) {
          if (err) return;
          var customForm = window[customFormVar.current];
          if (customFormId && customForm && customForm.instanceContainers && customForm.instanceContainers[0]) {
            if (customForm.instanceContainers[0].reportValidity()) {
              vals.jCustomForm = JSON.stringify(customForm.userData);
            } else {
              message.error(t("Please check custom form validation errors"));
              return;
            }
          }
          if (props.record) {
            props.onOk(vals);
          } else {
            setLoading(true);
            exe("DoManualPaymentRequest", vals).then(function (r) {
              setLoading(false);
              if (r.ok) {
                message.success(r.msg);
                if (props.onOk) props.onOk();
              } else message.error(r.msg);
            });
          }
        });
      };
      var onReceiptTypeSelect = function (v) {
        if (v) {
          setLoading(true);
          exe("GetFiscalNumber", { receiptTypeCode: v, simulation: true }).then(function (r) {
            setLoading(false);
            if (r.ok) {
              props.form.setFieldsValue({ fiscalNumber: r.outData });
            } else {
              message.error(r.msg);
              props.form.setFieldsValue({ fiscalNumber: undefined });
            }
          });
        } else props.form.setFieldsValue({ fiscalNumber: undefined });
      };
      var onRequiresFiscalNumberChange = function (e) {
        if (e.target.checked) {
          if (!values.contactId) {
            message.error(t("Please select beneficiary"));
            props.form.setFieldsValue({ requiresFiscalNumber: false });
            return false;
          }
          if (selectedContact) {
            if (selectedContact.receiptTypeCode) {
              props.form.setFieldsValue({ requiresFiscalNumber: true, receiptTypeCode: selectedContact.receiptTypeCode });
              onReceiptTypeSelect(selectedContact.receiptTypeCode);
            }
          } else {
            exe("GetContacts", { filter: "id=" + values.contactId }).then(function (r) {
              if (r.ok && r.total > 0) {
                setSelectedContact(r.outData[0]);
                var contact = r.outData[0];
                props.form.setFieldsValue({ requiresFiscalNumber: true, receiptTypeCode: contact.receiptTypeCode });
                onReceiptTypeSelect(contact.receiptTypeCode);
              }
            });
          }
        } else {
          props.form.setFieldsValue({ fiscalNumber: undefined, receiptTypeCode: undefined });
        }
      };
      var onSelectContact = function (contact) {
        setSelectedContact(contact);
      };
      var loadConcepts = function () {
        setLoading(true);
        exe("RepoPaymentConceptCatalog", { operation: "GET" }).then(function (r) {
          setLoading(false);
          if (r.ok) {
            setConceptData(r.outData.map(function (p) { return p.concept; }));
            setAllConceptData(r.outData.map(function (p) { return p.concept; }));
          } else message.error(r.msg);
        });
      };
      var onSearchConcept = function (v) {
        if (v) setConceptData(allConceptData.filter(function (p) { return p.toLowerCase().indexOf(v.toLowerCase()) >= 0; }));
        else setConceptData(allConceptData);
      };
      var onSelectPaymentType = function (record) {
        setCostCentersVisible(record ? record.showCostCenters : false);
      };
      //a new request starts with the values of the chain named in Payment.defaultValues, in the fields still empty (AXX-3700)
      var loadDefaultValues = function (open) {
        getConfigProfile().then(function (profile) {
          var chain = safeGet(["Payment", "defaultValues"], profile, null);
          if (typeof chain !== "string" || !chain) return;
          return exe("ExeChain", { chain: chain, context: JSON.stringify({}) }).then(function (r) {
            if (open !== openCount.current) return;
            if (!r.ok) {
              console.error("Error computing default values (Payment.defaultValues): ", r.msg);
              return;
            }
            var defaults = pickDefaultValues(r.outData);
            var empty = {};
            Object.keys(defaults).forEach(function (f) {
              var current = props.form.getFieldValue(f);
              if (current === undefined || current === null || current === "") empty[f] = defaults[f];
            });
            if (Object.keys(empty).length === 0) return;
            props.form.setFieldsValue(empty);
            if (empty.paymentType !== undefined) doTriggerSelect(function (c) { return c + 1; });
          });
        }).catch(function (error) { console.error("Error computing default values (Payment.defaultValues): ", error); });
      };
  
      var field = function (fieldName, options) {
        options = options || {};
        return props.form.getFieldDecorator(fieldName, Object.assign({}, options, { rules: paymentFieldRules(fieldName, options.rules, fieldRules) }));
      };
      var values = props.form.getFieldsValue();
      if (!props.visible) customFormVar.current = undefined;
      else if (!customFormVar.current) customFormVar.current = "customMoneyOutForm" + (++customFormSeq);
      return (
        <div>
          {field("id")}
          {field("claimId")}
          {field("lifePolicyId")}
          {field("liquidationId")}
          {field("producer")}
          {field("coverageId")}
          {field("date")}
          {field("user")}
          {field("jDetail")}
          {field("processId")}
          {field("entityState")}
          {field("payoutId")}
          {field("providerCode")}
          {field("beneficiaryType")}
          {field("CostCenters")}
          {field("claimsFundId")}
          {field("jCustomForm")}
  
          <Modal
            style={{ top: 20 }}
            visible={props.visible}
            title={t("Payment Request")}
            className="pg-std"
            onOk={doRequest}
            onCancel={props.onCancel}
            okButtonProps={{ loading: loading, disabled: props.readOnly }}
            forceRender={!!customFormId}
            okText={props.record ? t("Save") : t("Request")}>
            <CostCenterManagement form={props.form} visible={costCentersVisible} />
            <Row gutter={16}>
              <Col span={12}>
                <PaymentFormItem fieldRules={fieldRules} label={t("Beneficiary")}>{field("contactId", { rules: [{ required: true }] })(<SimpleContactSelect disabled={readOnlyBeneficiary && values.id} onSelectContact={onSelectContact} />)}</PaymentFormItem>
                <PaymentFormItem fieldRules={fieldRules} label={t("Concept")}>{field("concept", { rules: [{ required: false }] })(<AutoComplete dataSource={conceptData} onSearch={onSearchConcept} style={{ width: "100%" }} placeholder={t("Type to search")} />)}</PaymentFormItem>
                <PaymentFormItem fieldRules={fieldRules} label={t("Requires Fiscal Number")}>
                  {field("requiresFiscalNumber", { valuePropName: "checked" })(<Checkbox onChange={onRequiresFiscalNumberChange} />)}
                </PaymentFormItem>
                <PaymentFormItem fieldRules={fieldRules} label={t("Currency")}>{field("currency", { rules: [{ required: true }] })(<Currency style={{ width: "100%" }} />)}</PaymentFormItem>
                <PaymentFormItem fieldRules={fieldRules} label={t("Gross Amount")}>{field("grossAmount", { normalize: function (v, p, all) { return !v && all.total ? all.total : v; }, rules: [{ required: true }] })(<Money currency={values.currency} disabled={!values.currency} />)}</PaymentFormItem>
              </Col>
              <Col span={12}>
                <PaymentFormItem fieldRules={fieldRules} label={t("Method of Payment")}>
                  {field("paymentMethodCode", { rules: [{ required: true }] })(<PaymentMethods key={props.record ? "edit" : "new"} module="PAYMENT" codes={props.record ? undefined : NEW_REQUEST_METHODS} style={{ width: "100%" }} showInfo small context={{ payment: values }} />)}
                </PaymentFormItem>
                <PaymentFormItem fieldRules={fieldRules} label={t("Branch")}>{field("branch", { rules: [{ required: false }] })(<BranchSelect />)}</PaymentFormItem>
  
                <div style={{ display: values.requiresFiscalNumber ? "block" : "none" }}>
                  <PaymentFormItem fieldRules={fieldRules} label={t("Fiscal Document Type")}>
                    {field("receiptTypeCode", { rules: [{ required: values.requiresFiscalNumber }] })(<ReceiptTypeSelect onSelect={onReceiptTypeSelect} />)}
                  </PaymentFormItem>
                </div>
                <PaymentFormItem fieldRules={fieldRules} label={values.requiresFiscalNumber ? t("Fiscal Document Number") : t("Existing Fiscal Number")}>
                  {field("fiscalNumber", { rules: [{ required: values.requiresFiscalNumber }] })(<Input disabled={values.requiresFiscalNumber} />)}
                </PaymentFormItem>
                <PaymentFormItem fieldRules={fieldRules} label={t("Reference")}>{field("reference", { rules: [{ required: true }] })(<Input />)}</PaymentFormItem>
                <PaymentFormItem fieldRules={fieldRules} label={t("Payment Type")}>{field("paymentType", { rules: [{ required: true, message: t("Payment Type") + " " + t("is required") }] })(<PaymentTypeSelect triggerSelect={triggerSelect} onSelect={onSelectPaymentType} />)}</PaymentFormItem>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={24}>
                {field("Taxes")}
                <PaymentFormItem fieldRules={fieldRules} label={t("Taxes")}>{field("taxes", { initialValue: 0 })(<TaxField taxType={"TAX"} currency={values.currency} grossAmount={values.grossAmount} detail={values.Taxes} onDetailChange={function (v) { props.form.setFieldsValue({ Taxes: v }); }} />)}</PaymentFormItem>
                <PaymentFormItem fieldRules={fieldRules} label={t("Retentions")}>{field("retentions", { initialValue: 0 })(<TaxField taxType={"RET"} currency={values.currency} grossAmount={values.grossAmount} detail={values.Taxes} onDetailChange={function (v) { props.form.setFieldsValue({ Taxes: v }); }} />)}</PaymentFormItem>
                <PaymentFormItem fieldRules={fieldRules} label={t("Deductions")}>{field("deductions", { initialValue: 0 })(<TaxField taxType={"DED"} currency={values.currency} grossAmount={values.grossAmount} detail={values.Taxes} onDetailChange={function (v) { props.form.setFieldsValue({ Taxes: v }); }} />)}</PaymentFormItem>
                <PaymentFormItem fieldRules={fieldRules} label={t("Total Amount")}>
                  {field("total", { normalize: function (v, p, all) { return !p && v ? v : roundMoney((all.grossAmount || 0) + all.taxes - all.retentions - all.deductions, values.currency); }, rules: [{ required: true }] })(<Money currency={values.currency} disabled />)}
                </PaymentFormItem>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                {field("lifePolicyId", { initialValue: props.policyId })}
                <PaymentFormItem fieldRules={fieldRules} label={t("Source Account")}>
                  {field("sourceAccountId", { rules: [{ required: true }] })(<AccountSelect style={{ width: "100%" }} />)}
                </PaymentFormItem>
              </Col>
              <Col span={12}>
  
                <PaymentFormItem fieldRules={fieldRules} label={t("Destination Account")}>
                  {field("accountId", { rules: [{ required: true }] })(<AccountSelect holderId={values.contactId} style={{ width: "100%" }} />)}
                </PaymentFormItem>
              </Col>
            </Row>
            {props.visible && customFormId && (
              <Row gutter={16}>
                <Col span={24}>
                  <div onSubmit={function (e) { e.preventDefault(); }}>
                    <CustomForm key={customFormVar.current} formId={customFormId} variable={customFormVar.current} value={props.record ? props.record.jCustomForm : undefined} disabled={props.readOnly} />
                  </div>
                </Col>
              </Row>
            )}
          </Modal>
        </div>
      );
    });
  
    /* ---------- Payments/PaymentFilter ---------- */
    //GLOB-1364: the list only shows requests whose workflow is still in Draft (step Inicio). When the workflow moves to
    //Firma A the request leaves the list. A search by id shows that request.
    //The step is matched by name because the Inicio step currently sets entityState to its BPMN id (StartEvent_1), not DRAFT.
    var LIST_WORKFLOW_STEP = "Inicio";
    var LIST_WORKFLOW_STATE = "DRAFT";
    var draftOnlyQuery = function (manualOnly) {
      var workflowQuery = "id IN (SELECT entityId FROM Proceso WHERE entity='ClaimPayment' AND (estado='" + LIST_WORKFLOW_STEP + "' OR entityState='" + LIST_WORKFLOW_STATE + "'))";
      return manualOnly ? "producer='MANUAL' AND " + workflowQuery : workflowQuery;
    };
    var PaymentFilter = LegacyForm.create()(function (props) {
      var s1 = useState(null);
      var matches = s1[0];
      var setMatches = s1[1];
      var s2 = useState(false);
      var loading = s2[0];
      var setLoading = s2[1];
      var s3 = useState([]);
      var conceptData = s3[0];
      var setConceptData = s3[1];
      var s4 = useState([]);
      var allConceptData = s4[0];
      var setAllConceptData = s4[1];
      //AXX-3972: the concept last chosen from the list. Search compares it with = while the field still holds it; typed text uses LIKE
      var selectedConcept = useRef();
  
      useEffect(function () {
        exe("RepoPaymentConceptCatalog", { operation: "GET" }).then(function (r) {
          if (r.ok) {
            setConceptData(r.outData.map(function (p) { return p.concept; }));
            setAllConceptData(r.outData.map(function (p) { return p.concept; }));
          }
        });
      }, []);
      useEffect(function () {
        if (props.filter) {
          props.form.setFieldsValue(props.filter);
          submit();
        } else {
          //native: if (window.location.hash == "#/payments") submit(); -- the list route without a payment id
          if (props.listRoute) submit();
        }
      }, [props.filter]);
      useEffect(function () {
        if (props.reload && props.reload > 0) submit();
      }, [props.reload]);
      useUpdateEffect(function () {
        if (!isNaN(props.currentPage)) submit(true);
      }, [props.currentPage, props.pageSize]);
  
      var getFieldDecorator = props.form.getFieldDecorator;
      //antd calls onSearch for every keystroke, not when an option is chosen: anything typed after a choice is searched with LIKE
      var onSearchConcept = function (v) {
        selectedConcept.current = undefined;
        if (v) setConceptData(allConceptData.filter(function (p) { return p.toLowerCase().indexOf(v.toLowerCase()) >= 0; }));
        else setConceptData(allConceptData);
      };
      var submit = function () {
        props.form.validateFields(function (err, values) {
          if (err) return;
          var queries = [];
          if (values.date) { var d = pickerRangeUtc(values.date); queries.push("date BETWEEN '" + d[0] + "' AND '" + d[1] + "'"); }
          if (values.total !== undefined) queries.push("total" + values.total);
          if (values.currency !== undefined) queries.push("currency='" + values.currency + "'");
          if (values.id !== undefined && values.id > 0) queries.push("id=" + values.id);
          if (values.batchId) queries.push("batchId=" + values.batchId);
  
          if (values.sourceAccountId) queries.push("sourceAccountId=" + values.sourceAccountId);
          if (values.destinationAccountId) queries.push("accountId=" + values.destinationAccountId);
          if (values.reference) queries.push("reference LIKE N'%" + values.reference + "%'");
          if (values.concept) {
            var c = values.concept.replace(/'/g, "''");
            queries.push(values.concept === selectedConcept.current ? "concept=N'" + c + "'" : "concept LIKE N'%" + c + "%'");
          }
          if (values.branch) queries.push("branch='" + values.concept + "'");
          if (values.contactId) queries.push("contactId=" + values.contactId);
          if (values.paymentMethodCode) queries.push("paymentMethodCode='" + values.paymentMethodCode + "'");
          if (values.origin) {
            switch (values.origin) {
              case "CLA":
                queries.push("claimId is not null");
                break;
              case "POL":
                queries.push("lifePolicyId is not null and producer is null and claimId is null");
                break;
              case "MANUAL":
                queries.push("producer='MANUAL'");
                break;
              default:
                queries.push("producer='" + values.origin + "'");
            }
          }
          if (values.lob) {
            if (values.origin === "CLA") queries.push("claimId in (SELECT id FROM Claim WHERE lifePolicyId in (SELECT id from LifePolicy where lob='" + values.lob + "'))");
            else if (values.origin === "POL") queries.push("lifePolicyId in (SELECT id from LifePolicy where lob='" + values.lob + "')");
          }
          if (!(values.id !== undefined && values.id > 0)) queries.push(draftOnlyQuery(!values.origin));
  
          var filterQuery = queries.join(" AND ");
          if (props.onQueryChange) props.onQueryChange(filterQuery);
          setLoading(true);
          var pageSize = props.pageSize || 15;
          exe("RepoClaimPayment", {
            operation: "GET",
            custom: true,
            filter: filterQuery,
            include: ["Process", "Taxes", "CostCenters", "CostCenters.CostCenter"],
            size: pageSize,
            page: props.currentPage ? props.currentPage - 1 : 0
          }).then(function (r) {
            setLoading(false);
            //an empty or failed result must still end the grid spinner (total 0, not undefined)
            if (!r || !r.ok) message.error((r && r.msg) || t("Could not load payments"));
            var rows = r && r.ok && Array.isArray(r.outData) ? r.outData : [];
            var count = r && r.ok && Number(r.total) >= 0 ? Number(r.total) : 0;
            props.onResults(rows);
            setMatches(count);
            if (props.onTotal) props.onTotal(count);
          });
        });
      };
      var values = props.form.getFieldsValue();
      return (
        <div>
          <Drawer title={t("Payments Filter")} className="pg-std" placement="right" width={512} onClose={props.onClose} visible={props.visible}>
            <div style={{ marginBottom: "15px", marginTop: "-15px" }}>
              <Button icon={<Ico type="undo" />} size="small" onClick={function () { props.form.resetFields(); selectedConcept.current = undefined; setConceptData(allConceptData); }}>
                {t("Reset")}
              </Button>
            </div>
  
            <LegacyForm layout="vertical">
              <div style={{ display: "flex" }}>
                <LegacyForm.Item label={t("Id")} style={{ width: "100%" }}>{getFieldDecorator("id")(<InputNumber style={{ width: "100%" }} />)}</LegacyForm.Item>
                <LegacyForm.Item label={t("Batch Id")} style={{ marginLeft: 5, width: "100%" }}>{getFieldDecorator("batchId")(<InputNumber style={{ width: "100%" }} />)}</LegacyForm.Item>
              </div>
              <div style={{ display: "flex" }}>
                <LegacyForm.Item label={t("Created on Day")} style={{ width: "100%" }}>{getFieldDecorator("date")(<DatePickerW style={{ width: "100%" }} />)}</LegacyForm.Item>
              </div>
              <div style={{ display: "flex" }}>
                <LegacyForm.Item label={t("Source Account")} style={{ width: "100%" }}>
                  {getFieldDecorator("sourceAccountId")(<AccountSelect />)}
                </LegacyForm.Item>
                <LegacyForm.Item label={t("Destination Account")} style={{ marginLeft: 5, width: "100%" }}>
                  {getFieldDecorator("destinationAccountId")(<AccountSelect />)}
                </LegacyForm.Item>
              </div>
              <LegacyForm.Item label={t("Amount")}>{getFieldDecorator("total")(<Compare />)}</LegacyForm.Item>
              <div style={{ display: "flex" }}>
                <LegacyForm.Item label={t("Currency")} style={{ width: "100%" }}>
                  {getFieldDecorator("currency")(<Currency />)}
                </LegacyForm.Item>
                <LegacyForm.Item label={t("Origin")} style={{ marginLeft: 5, width: "100%" }}>
                  {getFieldDecorator("origin")(<OriginSelect />)}
                </LegacyForm.Item>
              </div>
              <div style={{ display: values.origin === "POL" || values.origin === "CLA" ? "block" : "none" }}>
                <LegacyForm.Item label={t("LoB")}>{getFieldDecorator("lob")(<LobSelect />)}</LegacyForm.Item>
              </div>
              <div style={{ display: "flex" }}>
                <LegacyForm.Item label={t("Reference")} style={{ width: "100%" }}>{getFieldDecorator("reference")(<Input />)}</LegacyForm.Item>
                <LegacyForm.Item label={t("Concept")} style={{ marginLeft: 5, width: "100%" }}>{getFieldDecorator("concept")(<AutoComplete
                  dataSource={conceptData}
                  onSearch={onSearchConcept}
                  onSelect={function (v) { selectedConcept.current = v; }}
                  style={{ width: "100%" }}
                  placeholder={t("Type to search")}
                />)}</LegacyForm.Item>
              </div>
              <div style={{ display: "flex" }}>
                <LegacyForm.Item label={t("Branch")} style={{ width: "100%" }}>{getFieldDecorator("branch")(<Input />)}</LegacyForm.Item>
                <LegacyForm.Item label={t("Method of Payment")} style={{ marginLeft: 5, width: "100%" }}>{getFieldDecorator("paymentMethodCode")(<PaymentMethods module="PAYMENT" style={{ width: "100%" }} />)}</LegacyForm.Item>
              </div>
              <LegacyForm.Item label={t("Beneficiary")}>{getFieldDecorator("contactId")(<SimpleContactSelect />)}</LegacyForm.Item>
            </LegacyForm>
            <Button type="primary" icon={<Ico type="search" />} onClick={function () { submit(); }} loading={loading}>
              {t("Search")}
            </Button>
            {matches !== null && (
              <div style={{ marginTop: 15 }}>
                <Tag>{matches}</Tag> {t("Results")}
              </div>
            )}
          </Drawer>
        </div>
      );
    });
  
  
  
    /* ---------- Payments/PaymentData ---------- */
    //AXX-3961: the column ids Payment.hiddenColumns accepts (Actions and Action are left out on purpose)
    var HIDEABLE_COLUMNS = ["id", "beneficiary", "date", "origin", "ref", "method", "concept", "branch", "checkNum", "sourceAcc",
      "destinationAcc", "dueDate", "releaseDate", "batch", "exchange", "workflow", "status", "amount"];
    var getHiddenColumns = function (value) {
      if (value === undefined || value === null || value === "") return [];
      if (!Array.isArray(value)) {
        console.warn("Payment.hiddenColumns must be an array of column ids, ignored:", value);
        return [];
      }
      var unknown = value.filter(function (p) { return HIDEABLE_COLUMNS.indexOf(p) < 0; });
      if (unknown.length) console.warn("Payment.hiddenColumns, unknown column ids ignored:", unknown.join(", "));
      return value.filter(function (p) { return HIDEABLE_COLUMNS.indexOf(p) >= 0; });
    };
    //GLOB-1364: columns this view never shows (Fecha limite de pago, Release Date, Lote, Intercambio, Sucursal)
    //"action" is the column titled "Resumen" in Spanish (ticket item 9)
    var FORCED_HIDDEN_COLUMNS = ["dueDate", "releaseDate", "batch", "exchange", "branch", "action", "checkNum", "workflow", "status"];
    //GLOB-1364: initials of a payment method name ("Transferencia cuenta a cuenta" -> "TCC"); one word -> first two letters
    var METHOD_NAME_CONNECTORS = ["a", "al", "de", "del", "el", "la", "las", "los", "y", "e", "en", "por", "para", "to", "of", "and"];
    var methodInitials = function (name) {
      var words = String(name || "").trim().split(/\s+/).filter(function (w) { return w && METHOD_NAME_CONNECTORS.indexOf(w.toLowerCase()) < 0; });
      if (!words.length) return "";
      if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
      return words.map(function (w) { return w.charAt(0); }).join("").toUpperCase();
    };
    //GLOB-1364: text cut with an ellipsis inside a fixed width, full text in a tooltip
    var EllipsisText = function (props) {
      if (props.text === undefined || props.text === null || props.text === "") return null;
      return (
        <Tooltip title={props.title || props.text}>
          <span className={"pg-ellipsis " + (props.className || "")}>{props.children || props.text}</span>
        </Tooltip>
      );
    };
    //GLOB-1364: grid body height = space left in the card, so the scroll lives inside the table (same as CLMovimientosDeCuenta)
    /* ---------- Payment request document (same mechanism as view 66, Fusion de Solicitudes) ---------- */
    var REQUEST_DOC_TEMPLATE = "Solcitud de Pago.docx";
    var REQUEST_DOC_CHAIN = "cmdGenerateClaimDocument";
    var REQUEST_DOC_CONTEXT_CHAIN = "cmdContexDocReciboPago";
    var requestDocName = function (paymentId) { return "Solicitud No. " + paymentId; };
    //only relative server paths, no traversal
    var safeDocPath = function (value) {
      if (typeof value !== "string" || !/^\/(?!\/)/.test(value) || /[\\\x00-\x1f?#]/.test(value)) return null;
      if (value.split("/").some(function (part) { return part === "." || part === ".."; })) return null;
      return value;
    };
    var docDownloadUrl = function (path) {
      return path.indexOf("/proxy/") === 0 ? SS_API_URL + path : SS_API_URL + "/proxy" + path;
    };
    var chainResultOk = function (r) {
      var out = r && r.outData && typeof r.outData === "object" ? r.outData : r;
      return { ok: !!(r && r.ok && out && out.ok !== false), out: out, msg: (out && out.msg) || (r && r.msg) };
    };
    //Generates (or reuses) the payment request PDF and opens it in the tab opened by the click
    var openRequestDocument = function (row, docWindow) {
      var paymentId = Number(row && row.id);
      var claimValue = row && row.claimId;
      var hasClaim = !(claimValue === null || claimValue === undefined || String(claimValue).trim() === "");
      var claimId = hasClaim ? Number(claimValue) : 0;
      var reportName = requestDocName(paymentId);
      if (!(paymentId > 0) || (hasClaim && !(claimId > 0))) return Promise.reject(new Error(t("Invalid payment request")));
      var isExact = function (d) {
        return d && Number(d.claimId) === claimId && String(d.fileName || "").trim() === reportName && String(d.name || "").trim() === REQUEST_DOC_TEMPLATE;
      };
      var loadClaimDocs = function () {
        return exe("RepoClaimDocument", { operation: "GET", filter: "claimId=" + claimId }).then(function (r) {
          if (!r || !r.ok || !Array.isArray(r.outData)) throw new Error((r && r.msg) || t("Could not load claim documents"));
          return r.outData;
        });
      };
      var generate = function () {
        var ctx = hasClaim
          ? { claimId: claimId, context: { paymentId: paymentId }, template: REQUEST_DOC_TEMPLATE, reportName: reportName }
          : { context: { paymentId: paymentId }, contextChain: REQUEST_DOC_CONTEXT_CHAIN, template: REQUEST_DOC_TEMPLATE, reportName: reportName };
        return exe("ExeChain", { chain: REQUEST_DOC_CHAIN, context: JSON.stringify(ctx) }).then(function (r) {
          var res = chainResultOk(r);
          if (!res.ok) throw new Error(res.msg || t("Document generation was not confirmed"));
          return res.out;
        });
      };
      var openDoc = function (doc) {
        var path = safeDocPath(doc && doc.url);
        if (!path) throw new Error(t("The document has no valid URL"));
        return fetch(docDownloadUrl(path), { method: "GET", headers: { Authorization: "Bearer " + localStorage.token }, cache: "no-store" })
          .then(function (response) {
            if (!response.ok) throw new Error(t("Could not download the file") + " (HTTP " + response.status + ")");
            return response.blob();
          })
          .then(function (blob) {
            if (!blob || !blob.size) throw new Error(t("The received file is empty"));
            var objectUrl = URL.createObjectURL(blob);
            docWindow.location.href = objectUrl;
            setTimeout(function () { URL.revokeObjectURL(objectUrl); }, 60000);
            return reportName;
          });
      };
      //without a claim there is nowhere to register the document: generate it and open it
      if (!hasClaim) return generate().then(openDoc);
      return loadClaimDocs().then(function (docs) {
        var existing = docs.filter(isExact).find(function (d) { return safeDocPath(d.url); });
        if (existing) return openDoc(existing);
        return generate().then(loadClaimDocs).then(function (after) {
          var created = after.filter(isExact).find(function (d) { return safeDocPath(d.url); });
          if (!created) throw new Error(t("The document was generated but could not be found"));
          return openDoc(created);
        });
      });
    };

    var FillGrid = function (props) {
      var ref = useRef(null);
      var s1 = useState(300);
      var bodyHeight = s1[0];
      var setBodyHeight = s1[1];
      var measure = function () {
        var el = ref.current;
        if (!el) return;
        var head = el.querySelector(".ant-table-thead");
        var reserved = (head ? head.offsetHeight : 34) + (props.paginated ? 48 : 0) + 2;
        var next = Math.max(120, el.clientHeight - reserved);
        setBodyHeight(function (prev) { return Math.abs(prev - next) > 1 ? next : prev; });
      };
      useEffect(function () {
        measure();
        if (typeof ResizeObserver === "undefined") {
          window.addEventListener("resize", measure);
          return function () { window.removeEventListener("resize", measure); };
        }
        var observer = new ResizeObserver(function () { measure(); });
        observer.observe(ref.current);
        return function () { observer.disconnect(); };
      }, []);
      useEffect(function () { measure(); }, [props.watch]);
      return <div className="pg-grid" ref={ref}>{props.render(bodyHeight)}</div>;
    };
    var PaymentData = function (props) {
      var s1 = useState([]);
      var data = s1[0];
      var setData = s1[1];
      var s2 = useState(false);
      var loading = s2[0];
      var setLoading = s2[1];
      var s3 = useState([]);
      var selectedRowKeys = s3[0];
      var setSelectedRowKeys = s3[1];
      var s4 = useState();
      var editRecord = s4[0];
      var setEditRecord = s4[1];
      var s5 = useState();
      var documentsRecord = s5[0];
      var setDocumentsRecord = s5[1];
      var sDoc = useState(undefined);
      var docOpeningId = sDoc[0];
      var setDocOpeningId = sDoc[1];
      var s6 = useState([]);
      var templates = s6[0];
      var setTemplates = s6[1];
      var s7 = useState({ pageSize: 15, pageSizeOptions: [10, 15, 20, 50, 100, 150], total: -1, showTotal: function (total) { return "Total " + total + " items"; } });
      var pagination = s7[0];
      var setPagination = s7[1];
      var s8 = useState([]);
      var paymentMethods = s8[0];
      var setPaymentMethods = s8[1];
      //memoized so a wrong value warns once per configuration read, not on every render of the grid
      var hidden = useMemo(function () { return getHiddenColumns(props.hiddenColumns).concat(FORCED_HIDDEN_COLUMNS); }, [props.hiddenColumns]);
      //GLOB-1364: names of the source and destination accounts of the rows shown, by account id
      var sAccNames = useState({});
      var accounts = sAccNames[0];
      var setAccounts = sAccNames[1];
  
      useEffect(function () {
        exe("RepoPaymentMethodCatalog", { operation: "GET" }).then(function (r) {
          if (r.ok) setPaymentMethods(r.outData);
        });
      }, []);
      useEffect(function () {
        getConfigProfile().then(function (profile) { setTemplates(paymentTemplates(profile)); });
      }, []);
      useEffect(function () {
        if (props.data) {
          setData(props.data);
          setLoading(false);
        }
      }, [props.data]);
      useEffect(function () {
        var ids = [];
        (props.data || []).forEach(function (r) {
          [r.sourceAccountId, r.accountId].forEach(function (id) {
            var n = Number(id);
            if (n > 0 && ids.indexOf(n) < 0 && !accounts[n]) ids.push(n);
          });
        });
        if (!ids.length) return;
        exe("RepoAccount", { operation: "GET", filter: "id IN (" + ids.join(",") + ")", size: 0 }).then(function (r) {
          if (!r.ok) {
            console.error("Could not load account names", r.msg);
            return;
          }
          setAccounts(function (prev) {
            var next = Object.assign({}, prev);
            (r.outData || []).forEach(function (a) { next[a.id] = a; });
            return next;
          });
        });
      }, [props.data]);
      useEffect(function () {
        props.onPageChange(pagination.current);
      }, [pagination.current]);
      useEffect(function () {
        if (props.onPageSizeChange) props.onPageSizeChange(pagination.pageSize);
      }, [pagination.pageSize]);
      useEffect(function () {
        if (typeof props.total === "number" && props.total >= 0) setPagination(Object.assign({}, pagination, { total: props.total }));
      }, [props.total]);
  
      var onSelectChange = function (keys, rows) {
        // The main grid uses single selection, matching the transaction views.
        var selectedKey = keys && keys.length ? keys[keys.length - 1] : undefined;
        var selectedRow = rows && rows.length ? rows[rows.length - 1] : undefined;
        setSelectedRowKeys(selectedKey === undefined ? [] : [selectedKey]);
        if (props.onSelectChange) props.onSelectChange(selectedRow ? [selectedRow] : []);
      };
      var rowSelection = {
        type: "radio",
        selectedRowKeys: selectedRowKeys,
        onChange: onSelectChange,
        preserveSelectedRowKeys: true
      };
      var reload = function () {
        setLoading(true);
        props.reload();
        setSelectedRowKeys([]);
      };
      var exportAll = function () {
        setLoading(true);
        exe("RepoClaimPayment", {
          operation: "GET",
          custom: true,
          filter: props.filterQuery || draftOnlyQuery(true),
          include: ["Process", "Taxes", "CostCenters", "CostCenters.CostCenter"],
          size: 0,
          page: 0
        }).then(function (r) {
          if (!r || !r.ok) {
            message.error((r && r.msg) || t("Could not load payments"));
            return;
          }
          saveXlsx(Array.isArray(r.outData) ? r.outData : [], "payments");
        }).catch(function () {
          message.error(t("Could not load payments"));
        }).then(function () { setLoading(false); });
      };
      var execute = function (id) {
        setLoading(true);
        exe("ExeClaimPayment", { claimPaymentId: id }).then(function (r) {
          setLoading(false);
          if (r.ok) {
            reload();
            message.success(r.msg);
          } else {
            message.error(r.msg);
          }
        });
      };
      var undoMerge = function (id) {
        setLoading(true);
        exe("UndoMerge", { paymentId: id }).then(function (r) {
          setLoading(false);
          if (r.ok) {
            reload();
            message.success(r.msg);
          } else {
            message.error(r.msg);
          }
        });
      };
      var getStatus = function (r) {
        switch (r.entityState) {
          case "CANCELLED":
            return <Tag color="red">{t("Cancelled")}</Tag>;
          case "REVERTED":
            return <Tag color="red">{t("Reverted")}</Tag>;
          case "MERGED":
            return <Tag color="orange">{t("Merged to ") + r.parentId}</Tag>;
          case "EXECUTED":
            return <Tag color="green">{t("Executed")}</Tag>;
          default:
            return <Tag>{r.entityState}</Tag>;
        }
      };
      var getAction = function (r) {
        if (r.entityState === "MERGED") {
          return (
            <Button icon={<Ico type="undo" />} onClick={function () { undoMerge(r.id); }}>
              {t("Undo Merge")}
            </Button>
          );
        }
        if (r.entityState === "CANCELLED") return null;
        if (!r.Process && ["APROVED", "APPROVED", "OK"].indexOf(r.entityState) >= 0) {
          //no workflow defined
          return (
            <Button icon={<Ico type="check" />} onClick={function () { execute(r.id); }}>
              {t("Execute")}
            </Button>
          );
        }
        switch (r.Process && r.Process.entityState) {
          case "APROVED":
          case "APPROVED":
          case "OK":
            return (
              <Button icon={<Ico type="check" />} onClick={function () { execute(r.id); }}>
                {t("Execute")}
              </Button>
            );
          case "REJECTED":
            return <Tag color="red">{t("Rejected")}</Tag>;
          case "EXECUTED":
            return <Tag color="green">{t("Executed")}</Tag>;
          default:
            return null;
        }
      };
      var getOrigin = function (r) {
        var url = "";
        var origin = "";
        var originId = 0;
        var icon = "";
        var refInfo;
        if (r.claimId) {
          origin = t("Claim");
          originId = r.claimId;
          icon = "warning";
          url = "#/healthclaim/" + originId;
        } else if (r.lifePolicyId) {
          origin = t("Policy");
          originId = r.lifePolicyId;
          icon = "safety";
          url = "#/lifepolicy/" + originId;
        } else if (r.liquidationId && r.producer == "COM") {
          origin = t("Commission liquidation");
          originId = r.liquidationId;
          icon = "shopping";
          url = "#/liquidations?id=" + originId;
        } else if (r.liquidationId && r.producer == "TAX") {
          origin = t("Tax liquidation");
          originId = r.liquidationId;
          icon = "transaction";
          url = "#/taxscheme/1?id=" + originId;
        } else if (r.liquidationId && r.producer == "RE") {
          origin = t("Reinsurance liquidation");
          originId = r.liquidationId;
          icon = "calculator";
          refInfo = r.reference.split("-");
          url = refInfo.length > 0 ? "#/contract/" + refInfo[1] : "#/contractlist";
        } else if (r.liquidationId && r.producer == "REPROFIT") {
          origin = t("Reinsurance profit commission liquidation");
          originId = r.liquidationId;
          icon = "carry-out";
          refInfo = r.reference.split("-");
          url = refInfo.length > 0 ? "#/profitCommission/" + refInfo[1] : "#/profitCommission";
        } else if (r.liquidationId && r.producer == "COI") {
          origin = t("Coinsurance liquidation");
          originId = r.liquidationId;
          icon = "pie-chart";
          url = "#/coLiquidations";
        } else if (r.liquidationId && r.producer == "SERVICELIQ") {
          origin = t("Service Order Liquidation");
          originId = r.liquidationId;
          icon = "shop";
          url = "#/serviceliquidations?id=" + originId;
        } else if (r.producer === "MERGED") {
          origin = t("Merged Payments");
          icon = "block";
          originId = "";
          url = "#";
        } else if (r.producer === "ANNUITIES") {
          origin = t("Annuity");
          icon = "pull-request";
          originId = r.reference.split("-")[1];
          url = "#/annuity/" + originId;
        } else if (r.producer === "REINST") {
          origin = t("Reinstatement");
          icon = "retweet";
          originId = r.reference.split("-")[2];
          url = "#/contract/" + originId;
        } else if (r.producer === "CREDIT") {
          origin = t("Credit Payable");
          icon = "credit-card";
          originId = r.reference.split("-")[2];
          url = "#/credit/" + originId;
        } else if (r.producer === "EXNI") {
          origin = t("Not Insurance Expense");
          icon = "bulb";
          originId = r.reference.split("-")[2];
          url = "#/othermovs/" + originId;
        } else if (r.producer === "CLAIMSFUND") {
          origin = t("Claims Fund");
          icon = "fund";
          originId = r.reference.split("--")[1];
          url = "#/provider/" + originId;
        } else {
          //manual
          origin = t("Manual Request");
          icon = "user";
          originId = "";
          url = "#";
        }
        return (
          <Tooltip title={origin}>
            <Ico type={icon} legacy style={{ marginRight: 3 }} />
            <a href={url}>{originId}</a>
          </Tooltip>
        );
      };
      var onEditRecord = function (record) {
        setEditRecord(record);
      };
      var saveRecordChanges = function (record) {
        setLoading(true);
        exe("RepoClaimPayment", { operation: "UPDATE", entity: record }).then(function () {
          setLoading(false);
          setEditRecord(undefined);
          reload();
        });
      };
      var renderPaymentMethod = function (code) {
        var pm = paymentMethods.find(function (p) { return p.code === code; });
        if (!pm) return null;
        var name = t(pm.name);
        return (
          <Tooltip title={name}>
            <Tag>{methodInitials(name) || pm.code}</Tag>
          </Tooltip>
        );
      };
      var renderAccount = function (id) {
        if (!id) return null;
        var acc = accounts[id];
        var name = acc ? acc.name || acc.accNo || String(id) : String(id);
        var full = acc && acc.name && acc.accNo ? acc.name + " (" + acc.accNo + ")" : name;
        return (
          <EllipsisText className="pg-account" text={name} title={full}>
            <a href={"#/account/" + id}>{name}</a>
          </EllipsisText>
        );
      };
      var onRequestDocument = function (r) {
        if (docOpeningId) return;
        //the tab is opened inside the click so the browser does not block it
        var docWindow = null;
        try { docWindow = window.open("about:blank", "_blank"); } catch (e) { docWindow = null; }
        if (!docWindow) {
          message.error(t("The browser blocked the new tab. Allow pop-ups to open the document."));
          return;
        }
        try { docWindow.opener = null; } catch (e) {}
        setDocOpeningId(r.id);
        openRequestDocument(r, docWindow)
          .then(function (name) { message.success(name + " " + t("opened")); })
          .catch(function (err) {
            try { docWindow.close(); } catch (e) {}
            message.error((err && err.message) || t("Could not open the document"));
          })
          .then(function () { setDocOpeningId(undefined); });
      };
      var endStates = ["MERGED", "CANCELLED", "REVERTED", "EXECUTED"];
      var col = function (id) { return hidden.indexOf(id) < 0; };
      //visual only: green positive, red negative, plain zero (the value and its format do not change)
      var amountClass = function (v) {
        var n = Number(v);
        if (!n) return "pg-amount-zero";
        return n > 0 ? "pg-amount-pos" : "pg-amount-neg";
      };
      return (
        <div className="pg-list">
          <div className="pg-toolbar">
            {props.toolbarExtra}
            <Button className="pg-action pg-reload" icon={<Ico type="reload" />} onClick={reload} loading={loading}>
              {t("Reload")}
            </Button>
            <DownloadOptions data={data} filename={"payments"} buttonClassName="pg-action" onExport={exportAll} />
          </div>
          <FillGrid paginated watch={data.length} render={function (bodyHeight) { return (
          <Table
            dataSource={data}
            loading={loading || pagination.total === -1}
            scroll={{ y: bodyHeight }}
            size="small"
            rowSelection={props.selectable ? rowSelection : {}}
            pagination={props.selectable && !props.pagination ? false : pagination}
            onChange={function (pag) { setPagination(pag); setLoading(true); }}
            onRow={function (record) { return { onClick: function () { onSelectChange([record.id], [record]); } }; }}
            rowKey="id">
            <Table.Column title={t("Actions")} width={86} key="actions" render={function (v, r) {
              return (
                <span style={{ whiteSpace: "nowrap" }}>
                  <Button icon={<Ico type="edit" />} type="link" onClick={function () { onEditRecord(r); }} />
                  <Tooltip title={t("Payment Request Document")}>
                    <Button type="link" icon={<Ico type="file-pdf" />} loading={docOpeningId === r.id} disabled={!!docOpeningId && docOpeningId !== r.id} onClick={function () { onRequestDocument(r); }} />
                  </Tooltip>
                  {templates.length > 0 && (
                    <Tooltip title={t("Documents")}>
                      <Button type="link" icon={<Ico type="folder-open" />} onClick={function () { setDocumentsRecord(r); }} />
                    </Tooltip>
                  )}
                </span>
              );
            }} />
            {col("id") && <Table.Column title={t("Id")} width={58} align="center" dataIndex="id" />}
            {col("beneficiary") && <Table.Column title={t("Beneficiary")} width={150} dataIndex="contactId" render={function (v, r) { return <EllipsisText text={r.beneficiaryName}><a href={"#/contact/" + v}>{r.beneficiaryName}</a></EllipsisText>; }} />}
            {col("date") && <Table.Column title={t("Date")} width={100} align="center" dataIndex="date" render={function (v) { return formatDate(v); }} />}
            {col("origin") && <Table.Column title={t("Origin")} width={82} align="center" key="origin" render={function (v, r) { return getOrigin(r); }} />}
            {col("ref") && <Table.Column title={t("Ref")} width={125} dataIndex="reference" render={function (v) { return <EllipsisText text={v} />; }} />}
            {col("method") && <Table.Column title={t("Method")} width={100} align="center" dataIndex="paymentMethodCode" render={function (v) { return renderPaymentMethod(v); }} />}
            {col("concept") && <Table.Column title={t("Concept")} width={220} dataIndex="concept" render={function (v) { return <EllipsisText className="pg-concept" text={v} />; }} />}
            {col("branch") && <Table.Column title={t("Branch")} width={80} align="center" dataIndex="branch" />}
            {col("checkNum") && <Table.Column title={t("Check Num")} width={90} dataIndex="checkNum" />}
            {col("sourceAcc") && <Table.Column title={t("Source Acc")} width={150} dataIndex="sourceAccountId" render={function (v) { return renderAccount(v); }} />}
            {col("destinationAcc") && <Table.Column title={t("Destination Acc")} width={150} dataIndex="accountId" render={function (v) { return renderAccount(v); }} />}
            {col("dueDate") && (
              <Table.Column
                title={t("Due Date")} width={100}
                key="paymentDue"
                render={function (v, r) {
                  return r.Process && r.Process.dueDate ? <span style={{ color: r.late ? "red" : "rgba(0, 0, 0, 0.65)" }}>{formatDate(r.Process.dueDate)}</span> : null;
                }}
              />
            )}
            {col("releaseDate") && <Table.Column title={t("Release Date")} width={100} dataIndex="releaseDate" render={function (v) { return v ? formatDate(v) : null; }} />}
            {col("batch") && <Table.Column title={t("Batch")} width={70} dataIndex="batchId" />}
            {col("exchange") && (
              <Table.Column
                title={t("Exchange")} width={75}
                key="exchange"
                render={function (v, r) {
                  return r.entityState == "EXECUTED" ? (
                    <a href={"#/account/" + r.accountId + "?&tab=operations"}>
                      <Ico type="dollar" />
                    </a>
                  ) : null;
                }}
              />
            )}
            {col("action") && <Table.Column title={t("Action")} width={100} key="action" render={function (v, r) { return getAction(r); }} />}
            {col("workflow") && (
              <Table.Column
                dataIndex="Process"
                title={t("Workflow")} width={200}
                render={function (v, r) { return <Status process={v} color={getColor(v && v.entityState)} reload={function () { reload(); }} ended={endStates.indexOf(r.entityState) >= 0} />; }}
              />
            )}
            {col("status") && <Table.Column title={t("Status")} width={110} align="center" dataIndex="entityState" render={function (v, r) { return getStatus(r); }} />}
            {col("amount") && <Table.Column title={t("Amount")} width={110} align="right" dataIndex="total" render={function (v, r) { return <span className={"pg-amount " + amountClass(v)}>{formatMoney(v, r.currency)}</span>; }} />}
          </Table>
          ); }} />
          <ManualPaymentRequest
            visible={editRecord}
            onCancel={function () { setEditRecord(undefined); }}
            onOk={function (r) { saveRecordChanges(r); }}
            record={editRecord}
            readOnly={editRecord && editRecord.entityState == "EXECUTED"}
          />
          {documentsRecord && (
            <PaymentDocuments visible onCancel={function () { setDocumentsRecord(undefined); }} paymentId={documentsRecord.id} templates={templates} />
          )}
        </div>
      );
    };
  
    /* ---------- Payments (the page) ---------- */
    //#/payments/:paymentId of the native route = #/view/<id>?paymentId=<n> here
    var hashPaymentId = function () {
      var hash = String(window.location.hash || "");
      var q = hash.indexOf("?");
      if (q < 0) return undefined;
      var m = /(?:^|&)paymentId=([^&]*)/.exec(hash.slice(q + 1));
      return m && m[1] !== "" ? decodeURIComponent(m[1]) : undefined;
    };
    var Payments = function () {
      var viewRoute = useRef(String(window.location.hash || "").split("?")[0]);
      var s0 = useState(hashPaymentId());
      var paymentIdParam = s0[0];
      var setPaymentIdParam = s0[1];
      var s1 = useState(false);
      var filterVisible = s1[0];
      var setFilterVisible = s1[1];
      var s2 = useState(0);
      var reload = s2[0];
      var doReload = s2[1];
      var s3 = useState([]);
      var data = s3[0];
      var setData = s3[1];
      var s4 = useState(null);
      var filter = s4[0];
      var setFilter = s4[1];
      var sFilterQuery = useState(draftOnlyQuery(true));
      var filterQuery = sFilterQuery[0];
      var setFilterQuery = sFilterQuery[1];
      var s5 = useState(false);
      var manualPaymentVisible = s5[0];
      var setManualPaymentVisible = s5[1];
      var s6 = useState(0);
      var currentPage = s6[0];
      var setCurrentPage = s6[1];
      var s7 = useState(-1);
      var total = s7[0];
      var setTotal = s7[1];
      var s9 = useState([]);
      var selected = s9[0];
      var setSelected = s9[1];
      var s10 = useState(false);
      var sendingApproval = s10[0];
      var setSendingApproval = s10[1];
      var s12 = useState(15);
      var pageSize = s12[0];
      var setPageSize = s12[1];
      var s13 = useState([]);
      var hiddenColumns = s13[0];
      var setHiddenColumns = s13[1];
  
      //the host freezes a LiveView (no re-render on route change): follow the hash like the router follows :paymentId
      useEffect(function () {
        var onHash = function () {
          if (String(window.location.hash || "").split("?")[0] === viewRoute.current) setPaymentIdParam(hashPaymentId());
        };
        window.addEventListener("hashchange", onHash);
        return function () { window.removeEventListener("hashchange", onHash); };
      }, []);
      useEffect(function () {
        if (paymentIdParam) setFilter({ id: paymentIdParam });
      }, [paymentIdParam]);
      useEffect(function () {
        getConfigProfile().then(function (profile) {
          setHiddenColumns(safeGetRaw(["Payment", "hiddenColumns"], profile, []));
        });
      }, []);
      var onManualPaymentRequest = function () {
        setManualPaymentVisible(false);
        doReload(function (q) { return q + 1; });
      };
      var runWorkflowEntryLogic = function (process) {
        if (!process || !process.entryLogic) return;
        try {
          evalInContext(process.entryLogic, {
            message: message,
            notification: notification,
            exe: exe,
            process: process,
            setDisabledTabs: function () {}
          });
        } catch (e) {
          console.error("Could not execute workflow notification script", e);
        }
      };
      var sendToApproval = function () {
        var payment = selected && selected.length ? selected[0] : null;
        if (!payment) {
          message.warning(t("Select a payment first"));
          return;
        }
        var processId = payment.processId || (payment.Process && (payment.Process.id || payment.Process.processId));
        if (!processId) {
          message.error(t("The payment workflow could not be found"));
          return;
        }
        var currentWorkflowState = payment.Process && payment.Process.estado;
        var advanceWorkflow = function () {
          return exe("GotoStep", { procesoId: processId, estado: "_next" }, undefined, true);
        };
        setSendingApproval(true);
        advanceWorkflow().then(function (r) {
          if (!r || !r.ok) {
            message.error((r && r.msg) || t("The payment could not be sent for approval"));
            return r;
          }
          // Solicitud Incompleta returns to Inicio first. Retry the real next step
          // in the same click so the user does not have to submit twice.
          var nextState = r.outData && r.outData.estado;
          if (currentWorkflowState === "Solicitud Incompleta" && nextState === "Inicio") return advanceWorkflow();
          return r;
        }).then(function (r) {
          if (!r || !r.ok) return;
          var workflowResult = r.outData || r;
          if (workflowResult.entryLogic) runWorkflowEntryLogic(workflowResult);
          else message.success(t("Payment sent for approval"));
          setSelected([]);
          doReload(function (q) { return q + 1; });
        }).catch(function () {
          message.error(t("The payment could not be sent for approval"));
        }).then(function () { setSendingApproval(false); });
      };
      return (
        <div className="pg-shell">
          <style>{PG_CSS}</style>
          <div className="pg-card">
            <div className="pg-head">
              <div className="pg-title"><span className="pg-title-mark" aria-hidden="true" />{t("Payments")}</div>
              <Button type="primary" className="pg-action" icon={<Ico type="filter" />} onClick={function () { setFilterVisible(true); }}>
                {t("Filter")}
              </Button>
            </div>
            <div className="pg-body">
            <PaymentData
              toolbarExtra={[
                <Button key="request" type="primary" className="pg-action" icon={<Ico type="plus-circle" />} onClick={function () { setManualPaymentVisible(true); }}>
                  {t("Payment Request")}
                </Button>,
                <Button key="approval" className="pg-action" icon={<Ico type="check" />} disabled={!selected.length} loading={sendingApproval} onClick={sendToApproval}>
                  {t("Send for approval")}
                </Button>
              ]}
              data={data}
              reload={function () { doReload(reload + 1); }}
              onPageSizeChange={function (v) { setPageSize(v); }}
              onPageChange={function (v) { setCurrentPage(v); }}
              total={total}
              filterQuery={filterQuery}
              onSelectChange={function (items) { setSelected(items); }}
              hiddenColumns={hiddenColumns}
              selectable
              pagination
            />
            <PaymentFilter
              filter={filter}
              listRoute={!paymentIdParam}
              visible={filterVisible}
              onClose={function () { setFilterVisible(false); }}
              onResults={function (r) { setData(r); }}
              onQueryChange={function (q) { setFilterQuery(q); }}
              reload={reload}
              currentPage={currentPage}
              onTotal={function (v) { setTotal(v); }}
              pageSize={pageSize}
            />
            <ManualPaymentRequest visible={manualPaymentVisible} onCancel={function () { setManualPaymentVisible(false); }} onOk={onManualPaymentRequest} />
            </div>
          </div>
        </div>
      );
    };
  
    return Payments;
  })()
  
