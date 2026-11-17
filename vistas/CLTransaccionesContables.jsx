/**
 * @author aiden_mission_configurator
 * @created 2026-10-29
 * @name ClonTransaccionesContables
 * @version 1.1.0
 * @summary Clon de la vista nativa Contabilidad > Transacciones (#/accounting/tx): mismas pestanas,
 *          campos, acciones, reglas de habilitacion y comandos nativos que los componentes
 *          Transactions, TransactionsFilter y Transaction (con sus subcomponentes) del front 11.3.38.
 * @issue   MSN-000092 / AXX-6208 (global1)
 * @issue   GLOB-1362: comprobantes contabilizados o de periodos contables cerrados no admiten
 *          modificaciones (encabezado ni lineas); en contabilizados solo quedan Reverse y Clone.
 *
 * Alcance pedido: solo esta vista. No crea comandos, cadenas, triggers, tablas, campos, flujos ni
 * menus, y no modifica la vista nativa. Llama unicamente los comandos que llama la vista nativa.
 *
 * Notas de plataforma (no borrar):
 *  - Motor react-live 2.4.1 -> buble 0.19.6: sin arrow async, sin ?. ni ??, sin fragmentos <>, sin
 *    entidades HTML en JSX y sin spread de Set (buble lo traduce a concat): Array.from.
 *  - El scope no trae @ant-design/icons, @ant-design/compatible, react-number-format ni jexcel: los
 *    iconos son los mismos SVG de antd; Form.create se replica con un almacen de campos que registra
 *    al dibujar (como rc-form: un setFieldsValue sobre un campo todavia no dibujado se descarta);
 *    Money se replica sobre Input; la planilla del modo edicion es una grilla con las clases de jexcel.
 *  - Se abre en #/view/<id>; los parametros ?id=, ?date= y ?account= del hash se leen como en la nativa.
 */
(function () {
  var Button = A.Button;
  var Badge = A.Badge;
  var Checkbox = A.Checkbox;
  var message = A.message;
  var notification = A.notification;
  var Table = A.Table;
  var Tabs = A.Tabs;
  var Dropdown = A.Dropdown;
  var Menu = A.Menu;
  var Drawer = A.Drawer;
  var Input = A.Input;
  var Select = A.Select;
  var DatePicker = A.DatePicker;
  var Tag = A.Tag;
  var InputNumber = A.InputNumber;
  var Pagination = A.Pagination;
  var Popconfirm = A.Popconfirm;
  var Spin = A.Spin;
  var Switch = A.Switch;
  var Tooltip = A.Tooltip;
  var Modal = A.Modal;
  var Empty = A.Empty;
  var Divider = A.Divider;
  var Radio = A.Radio;
  var Popover = A.Popover;
  var Descriptions = A.Descriptions;
  var Progress = A.Progress;
  var Row = A.Row;
  var Col = A.Col;
  var Upload = A.Upload;
  var Text = A.Typography.Text;
  var useRef = React.useRef;
  var useContext = React.useContext;
  var Fragment = React.Fragment;

  /* ---------- iconos: los mismos glifos outlined de @ant-design/icons ---------- */
  var ICON_PATHS = {"file-pdf":["M531.3 574.4l.3-1.4c5.8-23.9 13.1-53.7 7.4-80.7-3.8-21.3-19.5-29.6-32.9-30.2-15.8-.7-29.9 8.3-33.4 21.4-6.6 24-.7 56.8 10.1 98.6-13.6 32.4-35.3 79.5-51.2 107.5-29.6 15.3-69.3 38.9-75.2 68.7-1.2 5.5.2 12.5 3.5 18.8 3.7 7 9.6 12.4 16.5 15 3 1.1 6.6 2 10.8 2 17.6 0 46.1-14.2 84.1-79.4 5.8-1.9 11.8-3.9 17.6-5.9 27.2-9.2 55.4-18.8 80.9-23.1 28.2 15.1 60.3 24.8 82.1 24.8 21.6 0 30.1-12.8 33.3-20.5 5.6-13.5 2.9-30.5-6.2-39.6-13.2-13-45.3-16.4-95.3-10.2-24.6-15-40.7-35.4-52.4-65.8zM421.6 726.3c-13.9 20.2-24.4 30.3-30.1 34.7 6.7-12.3 19.8-25.3 30.1-34.7zm87.6-235.5c5.2 8.9 4.5 35.8.5 49.4-4.9-19.9-5.6-48.1-2.7-51.4.8.1 1.5.7 2.2 2zm-1.6 120.5c10.7 18.5 24.2 34.4 39.1 46.2-21.6 4.9-41.3 13-58.9 20.2-4.2 1.7-8.3 3.4-12.3 5 13.3-24.1 24.4-51.4 32.1-71.4zm155.6 65.5c.1.2.2.5-.4.9h-.2l-.2.3c-.8.5-9 5.3-44.3-8.6 40.6-1.9 45 7.3 45.1 7.4zm191.4-388.2L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM790.2 326H602V137.8L790.2 326zm1.8 562H232V136h302v216a42 42 0 0042 42h216v494z"],"filter":["M880.1 154H143.9c-24.5 0-39.8 26.7-27.5 48L349 597.4V838c0 17.7 14.2 32 31.8 32h262.4c17.6 0 31.8-14.3 31.8-32V597.4L907.7 202c12.2-21.3-3.1-48-27.6-48zM603.4 798H420.6V642h182.9v156zm9.6-236.6l-9.5 16.6h-183l-9.5-16.6L212.7 226h598.6L613 561.4z"],"file":["M854.6 288.6L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM790.2 326H602V137.8L790.2 326zm1.8 562H232V136h302v216a42 42 0 0042 42h216v494z"],"folder-open":["M928 444H820V330.4c0-17.7-14.3-32-32-32H473L355.7 186.2a8.15 8.15 0 00-5.5-2.2H96c-17.7 0-32 14.3-32 32v592c0 17.7 14.3 32 32 32h698c13 0 24.8-7.9 29.7-20l134-332c1.5-3.8 2.3-7.9 2.3-12 0-17.7-14.3-32-32-32zM136 256h188.5l119.6 114.4H748V444H238c-13 0-24.8 7.9-29.7 20L136 643.2V256zm635.3 512H159l103.3-256h612.4L771.3 768z"],"reload":["M909.1 209.3l-56.4 44.1C775.8 155.1 656.2 92 521.9 92 290 92 102.3 279.5 102 511.5 101.7 743.7 289.8 932 521.9 932c181.3 0 335.8-115 394.6-276.1 1.5-4.2-.7-8.9-4.9-10.3l-56.7-19.5a8 8 0 00-10.1 4.8c-1.8 5-3.8 10-5.9 14.9-17.3 41-42.1 77.8-73.7 109.4A344.77 344.77 0 01655.9 829c-42.3 17.9-87.4 27-133.8 27-46.5 0-91.5-9.1-133.8-27A341.5 341.5 0 01279 755.2a342.16 342.16 0 01-73.7-109.4c-17.9-42.4-27-87.4-27-133.9s9.1-91.5 27-133.9c17.3-41 42.1-77.8 73.7-109.4 31.6-31.6 68.4-56.4 109.3-73.8 42.3-17.9 87.4-27 133.8-27 46.5 0 91.5 9.1 133.8 27a341.5 341.5 0 01109.3 73.8c9.9 9.9 19.2 20.4 27.8 31.4l-60.2 47a8 8 0 003 14.1l175.6 43c5 1.2 9.9-2.6 9.9-7.7l.8-180.9c-.1-6.6-7.8-10.3-13-6.2z"],"tool":["M876.6 239.5c-.5-.9-1.2-1.8-2-2.5-5-5-13.1-5-18.1 0L684.2 409.3l-67.9-67.9L788.7 169c.8-.8 1.4-1.6 2-2.5 3.6-6.1 1.6-13.9-4.5-17.5-98.2-58-226.8-44.7-311.3 39.7-67 67-89.2 162-66.5 247.4l-293 293c-3 3-2.8 7.9.3 11l169.7 169.7c3.1 3.1 8.1 3.3 11 .3l292.9-292.9c85.5 22.8 180.5.7 247.6-66.4 84.4-84.5 97.7-213.1 39.7-311.3zM786 499.8c-58.1 58.1-145.3 69.3-214.6 33.6l-8.8 8.8-.1-.1-274 274.1-79.2-79.2 230.1-230.1s0 .1.1.1l52.8-52.8c-35.7-69.3-24.5-156.5 33.6-214.6a184.2 184.2 0 01144-53.5L537 318.9a32.05 32.05 0 000 45.3l124.5 124.5a32.05 32.05 0 0045.3 0l132.8-132.8c3.7 51.8-14.4 104.8-53.6 143.9z"],"search":["M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"],"undo":["M511.4 124C290.5 124.3 112 303 112 523.9c0 128 60.2 242 153.8 315.2l-37.5 48c-4.1 5.3-.3 13 6.3 12.9l167-.8c5.2 0 9-4.9 7.7-9.9L369.8 727a8 8 0 00-14.1-3L315 776.1c-10.2-8-20-16.7-29.3-26a318.64 318.64 0 01-68.6-101.7C200.4 609 192 567.1 192 523.9s8.4-85.1 25.1-124.5c16.1-38.1 39.2-72.3 68.6-101.7 29.4-29.4 63.6-52.5 101.7-68.6C426.9 212.4 468.8 204 512 204s85.1 8.4 124.5 25.1c38.1 16.1 72.3 39.2 101.7 68.6 29.4 29.4 52.5 63.6 68.6 101.7 16.7 39.4 25.1 81.3 25.1 124.5s-8.4 85.1-25.1 124.5a318.64 318.64 0 01-68.6 101.7c-7.5 7.5-15.3 14.5-23.4 21.2a7.93 7.93 0 00-1.2 11.1l39.4 50.5c2.8 3.5 7.9 4.1 11.4 1.3C854.5 760.8 912 649.1 912 523.9c0-221.1-179.4-400.2-400.6-399.9z"],"copy":["M832 64H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h496v688c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V96c0-17.7-14.3-32-32-32zM704 192H192c-17.7 0-32 14.3-32 32v530.7c0 8.5 3.4 16.6 9.4 22.6l173.3 173.3c2.2 2.2 4.7 4 7.4 5.5v1.9h4.2c3.5 1.3 7.2 2 11 2H704c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32zM350 856.2L263.9 770H350v86.2zM664 888H414V746c0-22.1-17.9-40-40-40H232V264h432v624z"],"delete":["M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z"],"deployment-unit":["M888.3 693.2c-42.5-24.6-94.3-18-129.2 12.8l-53-30.7V523.6c0-15.7-8.4-30.3-22-38.1l-136-78.3v-67.1c44.2-15 76-56.8 76-106.1 0-61.9-50.1-112-112-112s-112 50.1-112 112c0 49.3 31.8 91.1 76 106.1v67.1l-136 78.3c-13.6 7.8-22 22.4-22 38.1v151.6l-53 30.7c-34.9-30.8-86.8-37.4-129.2-12.8-53.5 31-71.7 99.4-41 152.9 30.8 53.5 98.9 71.9 152.2 41 42.5-24.6 62.7-73 53.6-118.8l48.7-28.3 140.6 81c6.8 3.9 14.4 5.9 22 5.9s15.2-2 22-5.9L674.5 740l48.7 28.3c-9.1 45.7 11.2 94.2 53.6 118.8 53.3 30.9 121.5 12.6 152.2-41 30.8-53.6 12.6-122-40.7-152.9zm-673 138.4a47.6 47.6 0 01-65.2-17.6c-13.2-22.9-5.4-52.3 17.5-65.5a47.6 47.6 0 0165.2 17.6c13.2 22.9 5.4 52.3-17.5 65.5zM522 463.8zM464 234a48.01 48.01 0 0196 0 48.01 48.01 0 01-96 0zm170 446.2l-122 70.3-122-70.3V539.8l122-70.3 122 70.3v140.4zm239.9 133.9c-13.2 22.9-42.4 30.8-65.2 17.6-22.8-13.2-30.7-42.6-17.5-65.5s42.4-30.8 65.2-17.6c22.9 13.2 30.7 42.5 17.5 65.5z"],"edit":["M257.7 752c2 0 4-.2 6-.5L431.9 722c2-.4 3.9-1.3 5.3-2.8l423.9-423.9a9.96 9.96 0 000-14.1L694.9 114.9c-1.9-1.9-4.4-2.9-7.1-2.9s-5.2 1-7.1 2.9L256.8 538.8c-1.5 1.5-2.4 3.3-2.8 5.3l-29.5 168.2a33.5 33.5 0 009.4 29.8c6.6 6.4 14.9 9.9 23.8 9.9zm67.4-174.4L687.8 215l73.3 73.3-362.7 362.6-88.9 15.7 15.6-89zM880 836H144c-17.7 0-32 14.3-32 32v36c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-36c0-17.7-14.3-32-32-32z"],"enter":["M864 170h-60c-4.4 0-8 3.6-8 8v518H310v-73c0-6.7-7.8-10.5-13-6.3l-141.9 112a8 8 0 000 12.6l141.9 112c5.3 4.2 13 .4 13-6.3v-75h498c35.3 0 64-28.7 64-64V178c0-4.4-3.6-8-8-8z"],"left":["M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 000 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z"],"minus-circle":["M696 480H328c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8h368c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8z","M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"],"plus-circle":["M696 480H544V328c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v152H328c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8h152v152c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V544h152c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8z","M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"],"rollback":["M793 242H366v-74c0-6.7-7.7-10.4-12.9-6.3l-142 112a8 8 0 000 12.6l142 112c5.2 4.1 12.9.4 12.9-6.3v-74h415v470H175c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h618c35.3 0 64-28.7 64-64V306c0-35.3-28.7-64-64-64z"],"save":["M893.3 293.3L730.7 130.7c-7.5-7.5-16.7-13-26.7-16V112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V338.5c0-17-6.7-33.2-18.7-45.2zM384 184h256v104H384V184zm456 656H184V184h136v136c0 17.7 14.3 32 32 32h320c17.7 0 32-14.3 32-32V205.8l136 136V840zM512 442c-79.5 0-144 64.5-144 144s64.5 144 144 144 144-64.5 144-144-64.5-144-144-144zm0 224c-44.2 0-80-35.8-80-80s35.8-80 80-80 80 35.8 80 80-35.8 80-80 80z"],"transaction":["M668.6 320c0-4.4-3.6-8-8-8h-54.5c-3 0-5.8 1.7-7.1 4.4l-84.7 168.8H511l-84.7-168.8a8 8 0 00-7.1-4.4h-55.7c-1.3 0-2.6.3-3.8 1-3.9 2.1-5.3 7-3.2 10.8l103.9 191.6h-57c-4.4 0-8 3.6-8 8v27.1c0 4.4 3.6 8 8 8h76v39h-76c-4.4 0-8 3.6-8 8v27.1c0 4.4 3.6 8 8 8h76V704c0 4.4 3.6 8 8 8h49.9c4.4 0 8-3.6 8-8v-63.5h76.3c4.4 0 8-3.6 8-8v-27.1c0-4.4-3.6-8-8-8h-76.3v-39h76.3c4.4 0 8-3.6 8-8v-27.1c0-4.4-3.6-8-8-8H564l103.7-191.6c.5-1.1.9-2.4.9-3.7zM157.9 504.2a352.7 352.7 0 01103.5-242.4c32.5-32.5 70.3-58.1 112.4-75.9 43.6-18.4 89.9-27.8 137.6-27.8 47.8 0 94.1 9.3 137.6 27.8 42.1 17.8 79.9 43.4 112.4 75.9 10 10 19.3 20.5 27.9 31.4l-50 39.1a8 8 0 003 14.1l156.8 38.3c5 1.2 9.9-2.6 9.9-7.7l.8-161.5c0-6.7-7.7-10.5-12.9-6.3l-47.8 37.4C770.7 146.3 648.6 82 511.5 82 277 82 86.3 270.1 82 503.8a8 8 0 008 8.2h60c4.3 0 7.8-3.5 7.9-7.8zM934 512h-60c-4.3 0-7.9 3.5-8 7.8a352.7 352.7 0 01-103.5 242.4 352.57 352.57 0 01-112.4 75.9c-43.6 18.4-89.9 27.8-137.6 27.8s-94.1-9.3-137.6-27.8a352.57 352.57 0 01-112.4-75.9c-10-10-19.3-20.5-27.9-31.4l49.9-39.1a8 8 0 00-3-14.1l-156.8-38.3c-5-1.2-9.9 2.6-9.9 7.7l-.8 161.7c0 6.7 7.7 10.5 12.9 6.3l47.8-37.4C253.3 877.7 375.4 942 512.5 942 747 942 937.7 753.9 942 520.2a8 8 0 00-8-8.2z"],"dollar":["M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372zm47.7-395.2l-25.4-5.9V348.6c38 5.2 61.5 29 65.5 58.2.5 4 3.9 6.9 7.9 6.9h44.9c4.7 0 8.4-4.1 8-8.8-6.1-62.3-57.4-102.3-125.9-109.2V263c0-4.4-3.6-8-8-8h-28.1c-4.4 0-8 3.6-8 8v33c-70.8 6.9-126.2 46-126.2 119 0 67.6 49.8 100.2 102.1 112.7l24.7 6.3v142.7c-44.2-5.9-69-29.5-74.1-61.3-.6-3.8-4-6.6-7.9-6.6H363c-4.7 0-8.4 4-8 8.7 4.5 55 46.2 105.6 135.2 112.1V761c0 4.4 3.6 8 8 8h28.4c4.4 0 8-3.6 8-8.1l-.2-31.7c78.3-6.9 134.3-48.8 134.3-124-.1-69.4-44.2-100.4-109-116.4zm-68.6-16.2c-5.6-1.6-10.3-3.1-15-5-33.8-12.2-49.5-31.9-49.5-57.3 0-36.3 27.5-57 64.5-61.7v124zM534.3 677V543.3c3.1.9 5.9 1.6 8.8 2.2 47.3 14.4 63.2 34.4 63.2 65.1 0 39.1-29.4 62.6-72 66.4z"],"tags":["M483.2 790.3L861.4 412c1.7-1.7 2.5-4 2.3-6.3l-25.5-301.4c-.7-7.8-6.8-13.9-14.6-14.6L522.2 64.3c-2.3-.2-4.7.6-6.3 2.3L137.7 444.8a8.03 8.03 0 000 11.3l334.2 334.2c3.1 3.2 8.2 3.2 11.3 0zm62.6-651.7l224.6 19 19 224.6L477.5 694 233.9 450.5l311.9-311.9zm60.16 186.23a48 48 0 1067.88-67.89 48 48 0 10-67.88 67.89zM889.7 539.8l-39.6-39.5a8.03 8.03 0 00-11.3 0l-362 361.3-237.6-237a8.03 8.03 0 00-11.3 0l-39.6 39.5a8.03 8.03 0 000 11.3l243.2 242.8 39.6 39.5c3.1 3.1 8.2 3.1 11.3 0l407.3-406.6c3.1-3.1 3.1-8.2 0-11.3z"],"wallet":["M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zm-40 464H528V448h312v128zm0 264H184V184h656v200H496c-17.7 0-32 14.3-32 32v192c0 17.7 14.3 32 32 32h344v200zM580 512a40 40 0 1080 0 40 40 0 10-80 0z"],"aim":["M952 474H829.8C812.5 327.6 696.4 211.5 550 194.2V72c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v122.2C327.6 211.5 211.5 327.6 194.2 474H72c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h122.2C211.5 696.4 327.6 812.5 474 829.8V952c0 4.4 3.6 8 8 8h60c4.4 0 8-3.6 8-8V829.8C696.4 812.5 812.5 696.4 829.8 550H952c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8zM512 756c-134.8 0-244-109.2-244-244s109.2-244 244-244 244 109.2 244 244-109.2 244-244 244z","M512 392c-32.1 0-62.1 12.4-84.8 35.2-22.7 22.7-35.2 52.7-35.2 84.8s12.5 62.1 35.2 84.8C449.9 619.4 480 632 512 632s62.1-12.5 84.8-35.2C619.4 574.1 632 544 632 512s-12.5-62.1-35.2-84.8A118.57 118.57 0 00512 392z"],"plus":["M482 152h60q8 0 8 8v704q0 8-8 8h-60q-8 0-8-8V160q0-8 8-8z","M192 474h672q8 0 8 8v60q0 8-8 8H160q-8 0-8-8v-60q0-8 8-8z"],"close-circle":["M512 64c247.4 0 448 200.6 448 448S759.4 960 512 960 64 759.4 64 512 264.6 64 512 64zm0 76c-205.4 0-372 166.6-372 372s166.6 372 372 372 372-166.6 372-372-166.6-372-372-372zm128.01 198.83c.03 0 .05.01.09.06l45.02 45.01a.2.2 0 01.05.09.12.12 0 010 .07c0 .02-.01.04-.05.08L557.25 512l127.87 127.86a.27.27 0 01.05.06v.02a.12.12 0 010 .07c0 .03-.01.05-.05.09l-45.02 45.02a.2.2 0 01-.09.05.12.12 0 01-.07 0c-.02 0-.04-.01-.08-.05L512 557.25 384.14 685.12c-.04.04-.06.05-.08.05a.12.12 0 01-.07 0c-.03 0-.05-.01-.09-.05l-45.02-45.02a.2.2 0 01-.05-.09.12.12 0 010-.07c0-.02.01-.04.06-.08L466.75 512 338.88 384.14a.27.27 0 01-.05-.06l-.01-.02a.12.12 0 010-.07c0-.03.01-.05.05-.09l45.02-45.02a.2.2 0 01.09-.05.12.12 0 01.07 0c.02 0 .04.01.08.06L512 466.75l127.86-127.86c.04-.05.06-.06.08-.06a.12.12 0 01.07 0z"],"branches":["M740 161c-61.8 0-112 50.2-112 112 0 50.1 33.1 92.6 78.5 106.9v95.9L320 602.4V318.1c44.2-15 76-56.9 76-106.1 0-61.8-50.2-112-112-112s-112 50.2-112 112c0 49.2 31.8 91 76 106.1V706c-44.2 15-76 56.9-76 106.1 0 61.8 50.2 112 112 112s112-50.2 112-112c0-49.2-31.8-91-76-106.1v-27.8l423.5-138.7a50.52 50.52 0 0034.9-48.2V378.2c42.9-15.8 73.6-57 73.6-105.2 0-61.8-50.2-112-112-112zm-504 51a48.01 48.01 0 0196 0 48.01 48.01 0 01-96 0zm96 600a48.01 48.01 0 01-96 0 48.01 48.01 0 0196 0zm408-491a48.01 48.01 0 010-96 48.01 48.01 0 010 96z"],"down":["M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.4-12.7z"],"right":["M765.7 486.8L314.9 134.7A7.97 7.97 0 00302 141v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1a31.96 31.96 0 000-50.4z"],"share-alt":["M752 664c-28.5 0-54.8 10-75.4 26.7L469.4 540.8a160.68 160.68 0 000-57.6l207.2-149.9C697.2 350 723.5 360 752 360c66.2 0 120-53.8 120-120s-53.8-120-120-120-120 53.8-120 120c0 11.6 1.6 22.7 4.7 33.3L439.9 415.8C410.7 377.1 364.3 352 312 352c-88.4 0-160 71.6-160 160s71.6 160 160 160c52.3 0 98.7-25.1 127.9-63.8l196.8 142.5c-3.1 10.6-4.7 21.8-4.7 33.3 0 66.2 53.8 120 120 120s120-53.8 120-120-53.8-120-120-120zm0-476c28.7 0 52 23.3 52 52s-23.3 52-52 52-52-23.3-52-52 23.3-52 52-52zM312 600c-48.5 0-88-39.5-88-88s39.5-88 88-88 88 39.5 88 88-39.5 88-88 88zm440 236c-28.7 0-52-23.3-52-52s23.3-52 52-52 52 23.3 52 52-23.3 52-52 52z"],"warning":["M464 720a48 48 0 1096 0 48 48 0 10-96 0zm16-304v184c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V416c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8zm475.7 440l-416-720c-6.2-10.7-16.9-16-27.7-16s-21.6 5.3-27.7 16l-416 720C56 877.4 71.4 904 96 904h832c24.6 0 40-26.6 27.7-48zm-783.5-27.9L512 239.9l339.8 588.2H172.2z"],"upload":["M400 317.7h73.9V656c0 4.4 3.6 8 8 8h60c4.4 0 8-3.6 8-8V317.7H624c6.7 0 10.4-7.7 6.3-12.9L518.3 163a8 8 0 00-12.6 0l-112 141.7c-4.1 5.3-.4 13 6.3 13zM878 626h-60c-4.4 0-8 3.6-8 8v154H214V634c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v198c0 17.7 14.3 32 32 32h684c17.7 0 32-14.3 32-32V634c0-4.4-3.6-8-8-8z"]};
  var Ico = function (props) {
    var paths = ICON_PATHS[props.type] || [];
    var extra = props.onClick ? { tabIndex: -1 } : {};
    if (props.legacy) extra.type = props.type;
    return (
      <span role="img" aria-label={props.type} className={"anticon anticon-" + props.type} style={props.style} onClick={props.onClick} {...extra}>
        <svg viewBox="64 64 896 896" focusable="false" data-icon={props.type} width="1em" height="1em" fill="currentColor" aria-hidden="true">
          {paths.map(function (d, i) { return <path key={i} d={d} />; })}
        </svg>
      </span>
    );
  };

  /* ---------- Standard view styles (same visual language as Carga masiva de reclamos) ---------- */
  var TX_CSS = [
    ".tx-shell { --view-ink:#1e293b; --view-muted:#64748b; --view-line:#e2e8f0; --view-line-strong:#cbd5e1; --view-page:#f4f6fa; --view-brand:#1e4b8f; --view-brand-dark:#15356b; --view-good:#137a4c; --view-bad:#cf1322; }",
    ".tx-shell { width:100%; height:calc(100dvh - 72px); min-height:0; padding:4px; box-sizing:border-box; display:flex; flex-direction:column; background:var(--view-page); color:var(--view-ink); font:13px/1.45 -apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif; }",
    ".tx-shell *, .tx-shell *::before, .tx-shell *::after { box-sizing:border-box; }",
    ".tx-card { flex:1 1 auto; display:flex; flex-direction:column; min-width:0; min-height:0; background:#fff; border:1px solid #aebdcd; border-radius:8px; box-shadow:0 1px 2px rgba(15,23,42,.04); overflow:hidden; }",
    ".tx-head { flex:0 0 auto; display:flex; align-items:center; justify-content:space-between; gap:8px; min-height:50px; padding:6px 8px; background:var(--view-page); border-bottom:2px solid var(--view-brand); }",
    ".tx-title { display:flex; align-items:center; gap:12px; color:var(--view-brand-dark); font-size:17px; font-weight:700; letter-spacing:-.01em; line-height:1.3; }",
    ".tx-title-mark { width:6px; height:30px; flex:0 0 6px; border-radius:3px; background:var(--view-brand); }",
    ".tx-body { flex:1 1 auto; min-width:0; min-height:0; padding:4px; display:flex; flex-direction:column; }",
    ".tx-tabs { flex:1 1 auto; min-height:0; display:flex; flex-direction:column; }",
    ".tx-tabs > .ant-tabs-content-holder { flex:1 1 auto; min-height:0; overflow:hidden; }",
    ".tx-tabs > .ant-tabs-content-holder > .ant-tabs-content { height:100%; }",
    ".tx-tabs > .ant-tabs-content-holder > .ant-tabs-content > .ant-tabs-tabpane-active { height:100%; }",
    ".tx-pane-list { height:100%; min-height:0; display:flex; flex-direction:column; }",
    ".tx-pane-list > .tx-toolbar { flex:0 0 auto; }",
    ".tx-pane-scroll { height:100%; min-height:0; overflow:auto; }",
    ".tx-tabs > .ant-tabs-nav, .tx-tabs > .ant-tabs-bar { margin:0 0 4px; border-bottom:1px solid var(--view-line-strong); }",
    ".tx-tabs > .ant-tabs-nav .ant-tabs-nav-list { gap:2px; flex-wrap:wrap; }",
    ".tx-tabs .ant-tabs-tab { height:36px; margin:0 !important; padding:0 13px !important; background:transparent; border:0; border-bottom:2px solid transparent; color:var(--view-muted); font-size:12.5px; font-weight:500; display:inline-flex; align-items:center; }",
    ".tx-tabs .ant-tabs-tab:hover { color:var(--view-brand-dark); }",
    ".tx-tabs .ant-tabs-tab-active { border-bottom-color:var(--view-brand); }",
    ".tx-tabs .ant-tabs-tab-active, .tx-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color:var(--view-brand); font-weight:700; }",
    ".tx-tabs .ant-tabs-ink-bar { display:none; }",
    ".tx-toolbar { display:flex; flex-wrap:wrap; align-items:center; gap:8px; min-height:32px; margin:4px 0; padding:4px; background:#eaf1fb; border:1px solid #c7d9f2; border-radius:8px; }",
    ".tx-toolbar .ant-dropdown-button, .tx-toolbar .ant-btn-group { display:inline-flex !important; width:auto !important; flex:0 0 auto; }",
    ".tx-toolbar-light { display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin:4px 0; }",
    ".tx-action.ant-btn, .tx-action .ant-btn { height:32px; padding:0 15px; border-radius:4px; font-size:14px; font-weight:500; box-shadow:none; background:#fff; border-color:#8c9db3; color:#262626; }",
    ".tx-action.ant-btn:not([disabled]):hover, .tx-action.ant-btn:not([disabled]):focus, .tx-action .ant-btn:not([disabled]):hover { border-color:#1890ff; color:#1890ff; }",
    ".tx-action.ant-btn-primary { background:#1890ff; border-color:#1890ff; color:#fff; }",
    ".tx-action.ant-btn-primary:not([disabled]):hover, .tx-action.ant-btn-primary:not([disabled]):focus { background:#147bd1; border-color:#147bd1; color:#fff; }",
    ".tx-action.tx-report { background:#dd603d; border-color:#bd4d35; color:#fff; }",
    ".tx-action.tx-report:not([disabled]):hover, .tx-action.tx-report:not([disabled]):focus { background:#bd4d35; border-color:#a3402c; color:#fff; }",
    ".tx-action.tx-warning { background:#faad14; border-color:#d48806; color:#fff; }",
    ".tx-action.tx-warning:not([disabled]):hover, .tx-action.tx-warning:not([disabled]):focus { background:#d48806; border-color:#ad6800; color:#fff; }",
    ".tx-action.tx-danger { background:#ff4d4f; border-color:#cf1322; color:#fff; }",
    ".tx-action.tx-danger:not([disabled]):hover, .tx-action.tx-danger:not([disabled]):focus { background:#cf1322; border-color:#a8071a; color:#fff; }",
    ".tx-action.tx-success { background:#60b13d; border-color:#4f9336; color:#fff; }",
    ".tx-action.tx-success:not([disabled]):hover, .tx-action.tx-success:not([disabled]):focus { background:#4f9336; border-color:#3f7a2b; color:#fff; }",
    ".tx-action.ant-btn[disabled], .tx-action.ant-btn[disabled]:hover, .tx-action .ant-btn[disabled] { background:#f1f5f9; border-color:#aebdcd; color:#526174; opacity:1; }",
    ".tx-section { margin:4px 0; padding:4px 8px 8px; border:1px solid #aebdcd; border-radius:8px; background:#fff; }",
    ".tx-section-title { margin:0 0 4px; padding:0; color:var(--view-brand-dark); font-size:12.5px; font-weight:700; letter-spacing:.01em; line-height:1.6; border-bottom:1px solid var(--view-line); }",
    ".tx-section-main { margin:2px 0; padding:2px 6px 4px; }",
    ".tx-section-main .tx-section-title { margin-bottom:2px; line-height:1.3; }",
    ".tx-section-main .ant-legacy-form-item { margin-bottom:4px; }",
    ".tx-section-main .ant-legacy-form-item-label { padding:0 0 2px; line-height:16px; }",
    ".tx-shell .ant-legacy-form-item-label label { color:var(--view-muted); font-size:12px; font-weight:500; }",
    ".tx-link-bar { display:flex; flex-wrap:wrap; gap:16px; align-items:center; margin:4px 0; padding:4px 8px; border:1px solid var(--view-line-strong); border-radius:6px; background:#f8fbff; }",
    ".tx-link-bar a { cursor:pointer; color:var(--view-brand); font-weight:600; }",
    ".tx-lines-head { padding:5px 0; margin-bottom:4px; background:#bfbfbf; color:#262626; font-size:12px; border-radius:4px 4px 0 0; }",
    ".tx-grid { flex:1 1 auto; min-width:0; min-height:0; display:flex; flex-direction:column; border:1px solid #aebdcd; border-radius:8px; overflow:hidden; background:#fff; }",
    ".tx-grid::-webkit-scrollbar { display:none; width:0; height:0; }",
    ".tx-grid .ant-table-wrapper, .tx-grid .ant-spin-nested-loading, .tx-grid .ant-spin-container { flex:1 1 auto; min-width:0; min-height:0; height:100%; display:flex; flex-direction:column; }",
    ".tx-grid .ant-table { flex:1 1 auto; min-height:0; display:flex; flex-direction:column; }",
    ".tx-grid .ant-table-container { flex:1 1 auto; min-height:0; overflow:hidden; display:flex; flex-direction:column; }",
    ".tx-grid .ant-table-content { flex:1 1 auto; min-height:0; overflow:auto; }",
    ".tx-grid .ant-table-thead > tr > th { position:sticky; top:0; z-index:2; }",
    ".tx-grid .ant-table-pagination.ant-pagination { flex:0 0 auto; position:static; z-index:2; margin:0; padding:6px 8px; background:#f8fbff; border:1px solid #9fb1c5; border-radius:0 0 7px 7px; }",
    /* Input standard: search filters (drawer) and transaction detail */
    ".tx-shell .ant-input, .tx-shell .ant-input-number, .tx-shell .ant-picker, .tx-shell .ant-input-affix-wrapper, .tx-shell .ant-select:not(.ant-select-customize-input) .ant-select-selector, .tx-drawer .ant-input, .tx-drawer .ant-input-number, .tx-drawer .ant-picker, .tx-drawer .ant-input-affix-wrapper, .tx-drawer .ant-select:not(.ant-select-customize-input) .ant-select-selector { border-color:#8c9db3; border-radius:4px; }",
    ".tx-shell .ant-input:hover, .tx-shell .ant-input:focus, .tx-shell .ant-input-number:hover, .tx-shell .ant-input-number-focused, .tx-shell .ant-picker:hover, .tx-shell .ant-picker-focused, .tx-shell .ant-select:not(.ant-select-disabled):hover .ant-select-selector, .tx-shell .ant-select-focused .ant-select-selector, .tx-drawer .ant-input:hover, .tx-drawer .ant-input:focus, .tx-drawer .ant-input-number:hover, .tx-drawer .ant-input-number-focused, .tx-drawer .ant-picker:hover, .tx-drawer .ant-picker-focused, .tx-drawer .ant-select:not(.ant-select-disabled):hover .ant-select-selector, .tx-drawer .ant-select-focused .ant-select-selector { border-color:#1890ff; }",
    ".tx-shell .ant-input[disabled], .tx-shell .ant-input-number-disabled, .tx-shell .ant-picker-disabled, .tx-shell .ant-select-disabled .ant-select-selector, .tx-drawer .ant-input[disabled], .tx-drawer .ant-input-number-disabled, .tx-drawer .ant-picker-disabled, .tx-drawer .ant-select-disabled .ant-select-selector { background:#f8fafc; border-color:#aebdcd; color:#183153; cursor:not-allowed; }",
    ".tx-shell .ant-input[readonly], .tx-shell .ant-input-number-input[readonly] { background:#f8fafc; border-color:#aebdcd; color:#183153; cursor:not-allowed; }",
    ".tx-shell .ant-input-number-disabled .ant-input-number-input, .tx-shell .ant-picker-disabled input, .tx-shell .ant-select-disabled .ant-select-selection-item, .tx-shell .ant-select-disabled .ant-select-selection-placeholder { color:#183153; cursor:not-allowed; }",
    ".tx-shell .ant-input-number-disabled .ant-input-number-input, .tx-shell .ant-picker-disabled input, .tx-drawer .ant-input-number-disabled .ant-input-number-input, .tx-drawer .ant-picker-disabled input { color:#183153; cursor:not-allowed; }",
    /* Checkbox standard: visible border in every checkbox of the view */
    ".tx-shell .ant-checkbox-inner, .tx-drawer .ant-checkbox-inner { border:1px solid #6b7c93; border-radius:3px; }",
    ".tx-shell .ant-checkbox-wrapper:hover .ant-checkbox-inner, .tx-shell .ant-checkbox:hover .ant-checkbox-inner, .tx-drawer .ant-checkbox-wrapper:hover .ant-checkbox-inner { border-color:#1890ff; }",
    ".tx-shell .ant-checkbox-checked .ant-checkbox-inner, .tx-drawer .ant-checkbox-checked .ant-checkbox-inner { background-color:#1890ff; border-color:#1890ff; }",
    ".tx-shell .ant-table { color:#183153; font-size:12px; }",
    ".tx-shell .ant-table-thead > tr > th { padding:4px 6px; line-height:18px; background:#bfbfbf; color:#262626; border-bottom:1px solid #cbd1d8; font-weight:700; white-space:nowrap; }",
    ".tx-shell .ant-table-tbody > tr { cursor:pointer; }",
    ".tx-shell .ant-table-tbody > tr > td { padding:1px 6px; line-height:16px; border-bottom:1px solid #b8c4d1; }",
    ".tx-shell .ant-table-tbody > tr > td { white-space:nowrap; }",
    ".tx-grid .ant-table-tbody .ant-btn-link { height:20px; padding:0 4px; line-height:18px; }",
    ".tx-grid .tx-description-cell { display:block; width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }",
    ".tx-shell .ant-table-tbody > tr:hover > td { background:#b7d7ff; }",
    ".tx-shell .ant-table-tbody > tr.tx-row-selected > td, .tx-shell .ant-table-tbody > tr.ant-table-row-selected > td { background:#86b4ff !important; }",
    ".tx-shell .ant-table-tbody > tr.tx-row-selected:hover > td, .tx-shell .ant-table-tbody > tr.ant-table-row-selected:hover > td { background:#86b4ff !important; }",
    ".tx-shell .ant-table-pagination { margin:8px; }"
  ].join("\n");

  /* ---------- Lib/Dal, Lib/Helpers, Lib/businessDates, Lib/Cache ---------- */
  var safeGet = function (path, object, nullValue) {
    return path.reduce(function (xs, x) { return xs && xs[x] ? xs[x] : nullValue; }, object);
  };
  var safeGetRaw = function (path, object, nullValue) {
    return path.reduce(function (xs, x) { return xs && xs[x] !== undefined && xs[x] !== null ? xs[x] : nullValue; }, object);
  };
  var getConfigProfile = function () {
    return new Promise(function (resolve) {
      var checkExists = function () {
        if (window.global && window.global.configProfile) return resolve(window.global.configProfile);
        setTimeout(checkExists, 500);
      };
      checkExists();
    });
  };
  var currentUser = function () { return window.GLOBAL ? window.GLOBAL.currentUser : undefined; };
  var userOrg = function () { var u = currentUser(); return u ? u.Organization : undefined; };
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
  var orgDateFields = function () { try { var m = mainCfg(); return cfgList(m && m.organizationDateFields); } catch (e) { return []; } };
  var orgDateOn = function (entity, field) { return orgDateFields().indexOf(entity + "." + field) >= 0; };
  var bdIsNaive = function (d) {
    return typeof d === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(d) && !/[zZ]$/.test(d) && !/[+-]\d{2}:?\d{2}$/.test(d);
  };
  var getTimeZone = function () {
    return "America/Panama";
  };
  var branchMoment = function (d) {
    if (typeof d === "string" && /[+-]\d{2}:\d{2}$/.test(d)) return moment.parseZone(d).tz("America/Panama");
    if ((bdOn() || brOn()) && bdIsNaive(d)) return momentTimezone.utc(d).tz("America/Panama");
    var tz = getTimeZone();
    return tz ? momentTimezone.utc(d).tz(tz) : moment.utc(d).local();
  };
  var formatDate = function (s) { return branchMoment(s).format("MMMM Do YYYY, h:mm:ss a"); };
  var formatDateUtc = function (s) { return momentTimezone.utc(s).tz("America/Panama").format("MMMM Do YYYY, h:mm:ss a"); };
  var formatPanamaDateTime = function (s) {
    if (!s) return "";
    var parsed = typeof s === "string" && /[+-]\d{2}:?\d{2}$/.test(s) ? moment.parseZone(s).tz("America/Panama") : momentTimezone.utc(s).tz("America/Panama");
    return parsed.tz("America/Panama").format("DD/MM/YYYY HH:mm:ss");
  };
  var formatThousands = function (v) {
    if (v === null || v === undefined || v === "") return "";
    var n = Number(v);
    if (isNaN(n)) return String(v);
    var parts = String(n).split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  };
  var renderAmount = function (v) {
    var n = Number(v);
    var color = !isNaN(n) && n > 0 ? "#237804" : !isNaN(n) && n < 0 ? "#cf1322" : "#262626";
    return <span style={{ color: color }}>{formatThousands(v)}</span>;
  };
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

  /* ---------- @ant-design/compatible Form.create (rc-form) ---------- */
  var LegacyCtx = React.createContext({ vertical: false });
  var requiredOf = function (meta) {
    return !!(meta && meta.rules && meta.rules.some(function (r) { return r.required; }));
  };
  var isEmptyValue = function (v) { return v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0); };
  var useLegacyForm = function () {
    var forced = useState(0);
    var force = forced[1];
    var ref = useRef(null);
    if (!ref.current) {
      var f = { meta: {}, fields: {}, names: [] };
      f.rerender = function () { force(function (c) { return c + 1; }); };
      f.getValue = function (name) {
        var fl = f.fields[name];
        if (fl && Object.prototype.hasOwnProperty.call(fl, "value")) return fl.value;
        return f.meta[name] ? f.meta[name].initialValue : undefined;
      };
      f.errorsOf = function (name) { var fl = f.fields[name]; return fl && fl.errors ? fl.errors : null; };
      f.check = function (name) {
        if (requiredOf(f.meta[name]) && isEmptyValue(f.getValue(name))) return [name + " is required"];
        return null;
      };
      f.field = function (name, opts) {
        opts = opts || {};
        if (!f.meta[name]) {
          f.meta[name] = {};
          f.names.push(name);
        }
        var m = f.meta[name];
        if (Object.prototype.hasOwnProperty.call(opts, "initialValue")) m.initialValue = opts.initialValue;
        m.rules = opts.rules;
        m.valuePropName = opts.valuePropName || "value";
        m.getValueProps = opts.getValueProps;
        return function (el) {
          var v = f.getValue(name);
          var vp;
          if (m.getValueProps) vp = m.getValueProps(v);
          else {
            vp = {};
            vp[m.valuePropName] = v;
          }
          var orig = el.props;
          return React.cloneElement(el, Object.assign({ id: name }, vp, {
            onChange: function () {
              var args = Array.prototype.slice.call(arguments);
              if (orig.onChange) orig.onChange.apply(null, args);
              var e = args[0];
              var nv = e && e.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e;
              f.fields[name] = { value: nv };
              if (m.rules) {
                var errs = f.check(name);
                if (errs) f.fields[name].errors = errs;
              }
              f.rerender();
            }
          }));
        };
      };
      f.getFieldsValue = function () {
        var o = {};
        f.names.forEach(function (n) { o[n] = f.getValue(n); });
        return o;
      };
      f.setFieldsValue = function (obj) {
        if (!obj) return;
        Object.keys(obj).forEach(function (k) { if (f.meta[k]) f.fields[k] = { value: obj[k] }; });
        f.rerender();
      };
      f.resetFields = function () {
        f.fields = {};
        f.rerender();
      };
      f.validateFields = function (cb) {
        var errors = null;
        f.names.forEach(function (n) {
          var errs = f.check(n);
          var cur = f.fields[n];
          if (errs) {
            errors = errors || {};
            errors[n] = { errors: errs.map(function (msg) { return { message: msg, field: n }; }) };
            f.fields[n] = Object.assign({}, cur, { errors: errs });
          } else if (cur && cur.errors) {
            var c = Object.assign({}, cur);
            delete c.errors;
            f.fields[n] = c;
          }
        });
        if (errors) f.rerender();
        cb(errors, f.getFieldsValue());
      };
      ref.current = f;
    }
    return ref.current;
  };
  var LegacyForm = function (props) {
    var layout = props.layout || "horizontal";
    return (
      <LegacyCtx.Provider value={{ vertical: layout === "vertical" }}>
        <form className={"ant-legacy-form ant-legacy-form-" + layout} style={props.style} onSubmit={function (e) { e.preventDefault(); }}>
          {props.children}
        </form>
      </LegacyCtx.Provider>
    );
  };
  var LegacyItem = function (props) {
    var ctx = useContext(LegacyCtx);
    var form = props.form;
    var name = props.name;
    var meta = form && name ? form.meta[name] : null;
    var errors = meta ? form.errorsOf(name) : null;
    var status = "";
    if (meta) {
      var v = form.getValue(name);
      if (errors) status = "error";
      else if (v !== undefined && v !== null && v !== "") status = "success";
    }
    var label = props.label;
    var labelText = label;
    if (!ctx.vertical && typeof label === "string" && label.trim() !== "") labelText = label.replace(/[\uFF1A:]\s*$/, "");
    var help = errors ? errors.join(" ") : null;
    return (
      <Row className={"ant-legacy-form-item" + (help ? " ant-legacy-form-item-with-help" : "") + (props.className ? " " + props.className : "")} style={props.style}>
        {label ? (
          <Col className="ant-legacy-form-item-label">
            <label htmlFor={name} className={requiredOf(meta) ? "ant-legacy-form-item-required" : ""} title={typeof label === "string" ? label : ""}>{labelText}</label>
          </Col>
        ) : null}
        <Col className="ant-legacy-form-item-control-wrapper">
          <div className={"ant-legacy-form-item-control" + (status ? " has-" + status : "")}>
            <span className="ant-legacy-form-item-children">{props.children}</span>
            {help ? <div className="ant-legacy-form-explain">{help}</div> : null}
          </div>
        </Col>
      </Row>
    );
  };

  /* ---------- Shared: Section, DatePickerW, Money, Currency ---------- */
  var Section = function (props) {
    return (
      <div className={props.className ? "tx-section " + props.className : "tx-section"} style={{ display: props.hidden ? "none" : "block" }}>
        <h3 className="tx-section-title">{props.text}</h3>
        <div>{props.children}</div>
      </div>
    );
  };
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
    return <DatePicker {...props} value={value} onChange={function (v) { onChange(v); }} />;
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
      return <Input readOnly value={props.value !== null && props.value !== undefined ? formatMoney(props.value, props.currency) : ""} style={Object.assign({}, props.style, { width: "100%", textAlign: "right" })} />;
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
        style={Object.assign({}, props.style, { width: "100%", textAlign: "right" })}
        disabled={props.disabled}
      />
    );
  };
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
    var direction = configContext ? configContext.direction : undefined;
    useEffect(function () {
      setLoading(true);
      getCache("RepoCurrency").then(function (r) {
        setLoading(false);
        setAllData(r.outData.filter(function (d) { return d.enabled; }));
      });
    }, []);
    var data = props.filter ? allData.filter(function (p) { return props.filter.split(",").indexOf(p.code) >= 0; }) : allData;
    return (
      <Select id={props.id} disabled={props.disabled} style={props.style} value={props.value} onChange={props.onChange} allowClear loading={loading} placeholder={t("Currency")}>
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

  /* ---------- Settings/OrganizationSelect, Bpm/UserSelect ---------- */
  var OrganizationSelect = function (props) {
    var s1 = useState(false);
    var loading = s1[0];
    var setLoading = s1[1];
    var s2 = useState([]);
    var data = s2[0];
    var setData = s2[1];
    useEffect(function () { load(); }, []);
    var load = function () {
      setLoading(true);
      exe("RepoOrganization", { operation: "GET" }).then(function (r) {
        setLoading(false);
        if (r.ok) setData(r.outData);
        else message.error(r.msg);
      });
    };
    var memberOf = props.memberOf && props.memberOf.length > 0 ? props.memberOf.map(function (p) { return p.id; }) : null;
    return (
      <div>
        <Select id={props.id} value={props.value} onChange={props.onChange} disabled={props.disabled} loading={loading} allowClear>
          {data.map(function (p) {
            return <Select.Option value={props.valuePropName ? p[props.valuePropName] : p.id} disabled={memberOf && memberOf.indexOf(p.id) < 0} key={p.id}>{p.name}</Select.Option>;
          })}
        </Select>
      </div>
    );
  };
  var UserSelect = function (props) {
    var s1 = useState([]);
    var data = s1[0];
    var setData = s1[1];
    var s2 = useState([]);
    var groups = s2[0];
    var setGroups = s2[1];
    var s3 = useState([]);
    var selectedGroups = s3[0];
    var setSelectedGroups = s3[1];
    var s4 = useState(false);
    var filterByGroupVisible = s4[0];
    var setFilterByGroupVisible = s4[1];
    useEffect(function () { load(); }, []);
    var load = function () {
      var includes = props.filterByGroups ? ["Groups"] : null;
      exe("GetUsers", { include: includes }).then(function (r) {
        if (r.ok) {
          var users = r.outData;
          if (props.originating) users.unshift({ email: "@Originating", nombre: "@Originating User" });
          setData(users);
          if (props.filterByGroups) {
            var gs = [];
            users.forEach(function (u) {
              if (u.Groups) u.Groups.forEach(function (g) { if (!gs.find(function (x) { return x.usrGroupId == g.usrGroupId; })) gs.push(g); });
            });
            setGroups(gs);
          }
        } else {
          message.error(r.msg);
        }
      });
    };
    return (
      <div>
        <div style={{ display: "flex", width: "100%" }}>
          <Select
            id={props.id}
            showSearch
            onChange={function (v) { if (props.onChange) props.onChange(v); }}
            value={props.value && props.value}
            style={{ width: "100%", flexGrow: 1 }}
            placeholder={t("Select User")}
            allowClear
            key={"email"}
            filterOption={function (input, option) {
              var childText = option.props.children.toString().toLowerCase();
              return childText.indexOf(input.toLowerCase()) >= 0;
            }}>
            {data.filter(function (u) {
              return selectedGroups.length ? selectedGroups.some(function (gid) { return u.Groups.some(function (ug) { return ug.usrGroupId == gid; }); }) : true;
            }).map(function (p) {
              return (
                <Select.Option value={p.email}>
                  {p.nombre} <span style={{ color: "#999", fontSize: "11px" }}>{p.email !== "@Originating" ? "(" + p.email + ")" : ""}</span>
                </Select.Option>
              );
            })}
          </Select>
          <Button style={{ flexShrink: 0, display: props.filterByGroups ? "inline" : "none" }} type="link" icon={<Ico type="filter" />} onClick={function () { setFilterByGroupVisible(true); }} />
        </div>
        <Modal title={t("Filter by Group")} visible={filterByGroupVisible} onOk={function () { setFilterByGroupVisible(false); }} onCancel={function () { setFilterByGroupVisible(false); }}>
          <Select
            showSearch
            mode="multiple"
            style={{ width: "100%" }}
            placeholder={t("Select Groups")}
            allowClear
            value={selectedGroups}
            onChange={function (v) { setSelectedGroups(v); }}
            filterOption={function (input, option) { return option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0; }}>
            {groups.map(function (p) { return <Select.Option value={p.usrGroupId}>{p.name}</Select.Option>; })}
          </Select>
        </Modal>
      </div>
    );
  };

  /* ---------- Accounting selects ---------- */
  var TransactionStatusSelect = function (props) {
    return (
      <Select id={props.id} style={Object.assign({}, props.style, { width: "100%" })} allowClear value={props.value} onChange={props.onChange} disabled={props.disabled}>
        <Select.Option value={0}>
          <Badge status="warning" />
          {t("Draft")}
        </Select.Option>
        <Select.Option value={1}>
          <Badge status="success" />
          {t("Posted")}
        </Select.Option>
        <Select.Option value={-1}>
          <Badge status="error" />
          {t("Rejected")}
        </Select.Option>
      </Select>
    );
  };
  var TransactionTemplateSelect = function (props) {
    var s1 = useState([]);
    var data = s1[0];
    var setData = s1[1];
    var s2 = useState(false);
    var loading = s2[0];
    var setLoading = s2[1];
    useEffect(function () { load(); }, []);
    var load = function () {
      setLoading(true);
      exe("DoQuery", { sql: "SELECT code,name FROM TransactionTemplate" }).then(function (r) {
        setLoading(false);
        if (r.ok) setData(r.outData);
        else message.error(r.msg);
      });
    };
    var onSelect = function (v, opt) { if (props.onSelect) props.onSelect(opt.props.record); };
    return (
      <Select
        id={props.id}
        value={props.value}
        onChange={function (v) { props.onChange(v); }}
        onSelect={onSelect}
        loading={loading}
        style={Object.assign({ width: "100%" }, props.style)}
        placeholder={t("Please select...")}
        disabled={props.disabled}
        allowClear>
        {data.map(function (p) {
          return <Select.Option value={p.code} key={p.code} record={p}>{p.name}</Select.Option>;
        })}
      </Select>
    );
  };
  var AccountSelectDetail = function (props) {
    var s1 = useState([]);
    var data = s1[0];
    var setData = s1[1];
    var s2 = useState(false);
    var loading = s2[0];
    var s3 = useState(false);
    var fetching = s3[0];
    var setFetching = s3[1];
    var s4 = useState(true);
    var showParentLevelsInCode = s4[0];
    var setShowParentLevelsInCode = s4[1];
    var s5 = useState("code");
    var searchBy = s5[0];
    var setSearchBy = s5[1];
    useEffect(function () {
      getConfigProfile().then(function (profile) {
        setShowParentLevelsInCode(safeGetRaw(["Accounting", "showParentLevelsInCode"], profile, true));
      });
    }, []);
    useEffect(function () {
      if (props.value && props.accountRecord) setData([props.accountRecord]);
      else if (!props.value) setData([]);
    }, [props.value, props.accountRecord]);
    var onSearch = function (value) {
      if (!value) return;
      setFetching(true);
      var filter;
      if (searchBy === "code") filter = "code LIKE '" + value + "%'";
      else if (searchBy === "name") filter = "name LIKE N'%" + value + "%'";
      // Entry lines only accept detail accounts, so master accounts are not offered.
      if (props.detailSearch) filter = "(" + filter + ") AND isDetail = 1";
      exe("RepoCatalogAccount", { operation: "GET", filter: filter, size: 20 }).then(function (r) {
        setFetching(false);
        if (r.ok) setData(r.outData);
        else setData([]);
      });
    };
    var onChange = function (v) {
      if (!v) {
        setData([]);
        if (props.onSelect) props.onSelect({ code: null, isDetail: true });
      }
      if (props.onChange) props.onChange(v);
    };
    var onSelect = function (v, opt) {
      if (props.detailOnly) {
        if (!opt.props.record.isDetail) {
          if (props.onChange) props.onChange(undefined);
          message.error(t("Not a detail account"));
          return;
        }
      }
      if (props.onSelect) props.onSelect(opt.props.record);
    };
    var renderCode = function (code) {
      if (showParentLevelsInCode) return code;
      var separator = code.match(/\D/);
      if (separator) return code.substr(code.lastIndexOf(separator) + 1);
      return code;
    };
    var onChangeSearchBy = function (e) {
      setData([]);
      setSearchBy(e.target.value);
    };
    var onSelectRadioItem = function (e, item) {
      e.preventDefault();
      setData([]);
      setSearchBy(item);
    };
    var getPlaceholder = function () {
      return searchBy === "code" ? t("Please type account code to search...") : t("Please type account name to search...");
    };
    return (
      <Select
        id={props.id}
        value={props.value}
        onChange={onChange}
        onSearch={onSearch}
        onSelect={onSelect}
        onDropdownVisibleChange={props.onDropdownVisibleChange}
        loading={loading}
        showSearch
        filterOption={false}
        notFoundContent={fetching ? <Spin size="small" /> : <Empty description={getPlaceholder()} />}
        style={Object.assign({ width: "100%" }, props.style)}
        placeholder={getPlaceholder()}
        disabled={props.disabled}
        allowClear
        dropdownRender={function (menu) {
          return (
            <div>
              {menu}
              <Divider style={{ margin: "4px 0" }} />
              <div onMouseDown={function (e) { e.preventDefault(); }} style={{ margin: "4px 4px 4px 4px", padding: "4px 4px 8px 4px" }}>
                <Radio.Group onChange={onChangeSearchBy} value={searchBy}>
                  <Radio value={"code"}>
                    <span onClick={function (e) { onSelectRadioItem(e, "code"); }}>{t("Account Code")}</span>
                  </Radio>
                  <Radio value={"name"}>
                    <span onClick={function (e) { onSelectRadioItem(e, "name"); }}>{t("Account Name")}</span>
                  </Radio>
                </Radio.Group>
                {props.value && (
                  <Button type="link" size="small" icon={<Ico type="aim" />} style={{ paddingLeft: 0, paddingRight: 0 }} onClick={function () { window.open("/#/accounting/coa?locate=" + props.value, "_blank"); }}>
                    {t("Locate in tree")}
                  </Button>
                )}
              </div>
            </div>
          );
        }}>
        {data.map(function (p) {
          return (
            <Select.Option value={p.code} key={p.code} record={p}>
              <Tooltip title={p.code + " " + p.name}><Tag>{renderCode(p.code)}</Tag> {p.name}</Tooltip>
            </Select.Option>
          );
        })}
      </Select>
    );
  };

  /* ---------- Shared/Status (estado del flujo de trabajo) y FormRenderModal ---------- */
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
        evalInContext(logic, { exe: exe, loadCatalog: loadCatalog, processId: props.processId, message: message });
      } catch (error) {
        console.warn(error);
      }
    };
    var renderForm = function (formData) {
      var jq = window.$;
      if (!jq || !jq.fn || !jq.fn.formRender || !formRef.current) return null;
      try {
        return jq(formRef.current).formRender({ container: formRef.current, formData: formData });
      } catch (error) {
        console.error(error);
        return null;
      }
    };
    //the form engine (jQuery formRender) is attached to window.$ by the host app; right after a page load it can still be
    //missing, so the render waits for it (up to 5 s) instead of leaving an empty form
    var renderWhenReady = function (formData, done) {
      var tries = 0;
      var attempt = function () {
        var jq = window.$;
        if (jq && jq.fn && jq.fn.formRender && formRef.current) return done(renderForm(formData));
        if (tries++ < 20) setTimeout(attempt, 250);
        else done(null);
      };
      attempt();
    };
    useEffect(function () {
      var formId = props.formId;
      if (formId) {
        exe("GetForms", { filter: isNaN(formId) ? "name='" + formId + "'" : "id=" + formId }).then(function (v) {
          if (v.outData.length == 0) {
            message.error(t("Form") + " " + formId + " " + t("not found"));
            return;
          }
          renderWhenReady(v.outData[0].json, function (inst) {
            instance.current = inst;
            if (inst && v.outData[0].logic) exeCustomLogic(v.outData[0].logic);
          });
        });
      } else {
        renderWhenReady('[{"type":"header","subtype":"h3","label":"' + t("No form configured for this step. Click next to advance.") + '"}]', function (inst) { instance.current = inst; });
      }
    }, []);
    useEffect(function () {
      if (props.next > lastNext.current) {
        if (props.formId) {
          if (formRef.current && formRef.current.reportValidity()) props.onFormOk(instance.current ? instance.current.userData : undefined);
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

  /* ---------- Shared/Spreadsheet (jexcel): grilla del modo edicion ---------- */
  var JX = {
    columnName: "Column name",
    insertANewColumnBefore: "Insert a new column before",
    insertANewColumnAfter: "Insert a new column after",
    deleteSelectedColumns: "Delete selected columns",
    renameThisColumn: "Rename this column",
    orderAscending: "Order ascending",
    orderDescending: "Order descending",
    insertANewRowBefore: "Insert a new row before",
    insertANewRowAfter: "Insert a new row after",
    deleteSelectedRows: "Delete selected rows",
    saveAs: "Save as..."
  };
  var CSV_TYPES = ["text/plain", "text/x-csv", "application/vnd.ms-excel", "application/csv", "application/x-csv", "text/csv", "text/comma-separated-values", "text/x-comma-separated-values", "text/tab-separated-values"];
  var gridCol = function (i) {
    var s = "";
    var n = i + 1;
    while (n > 0) {
      var m = (n - 1) % 26;
      s = String.fromCharCode(65 + m) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  };
  var gridCell = function (v) { return v === undefined || v === null ? "" : v; };
  var gridPad = function (rows, cols, minRows) {
    var out = (rows || []).map(function (r) {
      var a = (r || []).slice();
      while (a.length < cols) a.push("");
      return a.map(gridCell);
    });
    while (out.length < minRows) {
      var e = [];
      for (var i = 0; i < cols; i++) e.push("");
      out.push(e);
    }
    return out;
  };
  var cssToStyle = function (css) {
    var o = {};
    String(css || "").split(";").forEach(function (decl) {
      var i = decl.indexOf(":");
      if (i < 0) return;
      var k = decl.slice(0, i).trim().replace(/-([a-z])/g, function (m, c) { return c.toUpperCase(); });
      if (k) o[k] = decl.slice(i + 1).trim();
    });
    return o;
  };
  var parseDelimited = function (text) {
    var first = text.split(/\r?\n/)[0] || "";
    var delim = ",";
    var best = -1;
    [",", "\t", "|", ";"].forEach(function (d) {
      var n = first.split(d).length - 1;
      if (n > best) {
        best = n;
        delim = d;
      }
    });
    var rows = [];
    var row = [];
    var cell = "";
    var quoted = false;
    for (var i = 0; i < text.length; i++) {
      var c = text.charAt(i);
      if (quoted) {
        if (c === '"') {
          if (text.charAt(i + 1) === '"') {
            cell += '"';
            i++;
          } else quoted = false;
        } else cell += c;
      } else if (c === '"' && cell === "") quoted = true;
      else if (c === delim) {
        row.push(cell);
        cell = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text.charAt(i + 1) === "\n") i++;
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else cell += c;
    }
    if (cell !== "" || row.length) {
      row.push(cell);
      rows.push(row);
    }
    return rows.filter(function (r) { return !(r.length === 1 && r[0] === ""); });
  };
  var csvCell = function (v) {
    var s = v === undefined || v === null ? "" : String(v);
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  var EditGrid = function (props) {
    var s1 = useState(function () { return props.columns.map(function (c) { return { title: c.title, width: c.width }; }); });
    var columns = s1[0];
    var setColumns = s1[1];
    var s2 = useState(function () { return gridPad(props.data, props.columns.length, 5); });
    var data = s2[0];
    var setData = s2[1];
    var s3 = useState(null);
    var sel = s3[0];
    var setSel = s3[1];
    var s4 = useState(null);
    var edit = s4[0];
    var setEdit = s4[1];
    var s5 = useState(null);
    var menu = s5[0];
    var setMenu = s5[1];
    var s6 = useState({});
    var cellStyles = s6[0];
    var setCellStyles = s6[1];
    var dataRef = useRef(data);
    dataRef.current = data;
    var colsRef = useRef(columns);
    colsRef.current = columns;
    var boxRef = useRef(null);
    var lastData = useRef(JSON.stringify(props.data || []));
    var api = useRef(null);
    if (!api.current) {
      api.current = {
        getData: function () { return dataRef.current.map(function (r) { return r.slice(); }); },
        getHeaders: function () { return colsRef.current.map(function (c) { return c.title; }).join(","); },
        setStyle: function (o) {
          setCellStyles(function (prev) {
            var n = Object.assign({}, prev);
            Object.keys(o).forEach(function (k) { n[k] = cssToStyle(o[k]); });
            return n;
          });
        }
      };
    }
    useEffect(function () { if (props.instance) props.instance(api.current); }, []);
    useEffect(function () {
      var s = JSON.stringify(props.data || []);
      if (s !== lastData.current) {
        lastData.current = s;
        setData(gridPad(props.data, colsRef.current.length, 5));
      }
    });
    useEffect(function () {
      if (!menu) return undefined;
      var close = function () { setMenu(null); };
      document.addEventListener("mousedown", close);
      return function () { document.removeEventListener("mousedown", close); };
    }, [menu]);
    var emptyRow = function () { return colsRef.current.map(function () { return ""; }); };
    var update = function (fn) {
      setData(function (prev) {
        var next = prev.map(function (r) { return r.slice(); });
        fn(next);
        return next;
      });
    };
    var setCell = function (x, y, v) {
      update(function (d) {
        while (d.length <= y) d.push(emptyRow());
        d[y][x] = v;
      });
    };
    var focusBox = function () { setTimeout(function () { if (boxRef.current) boxRef.current.focus(); }, 0); };
    var moveSel = function (dir, from) {
      var cur = from || sel;
      if (!cur) return;
      var x = cur.x;
      var y = cur.y;
      if (dir === "up") y = Math.max(0, y - 1);
      if (dir === "left") x = Math.max(0, x - 1);
      if (dir === "right") x = Math.min(colsRef.current.length - 1, x + 1);
      if (dir === "down") {
        if (y >= dataRef.current.length - 1) update(function (d) { d.push(emptyRow()); });
        y = y + 1;
      }
      setSel({ x: x, y: y });
    };
    var startEdit = function (x, y, v) {
      setSel({ x: x, y: y });
      setEdit({ x: x, y: y, value: v });
    };
    var commit = function (move) {
      if (!edit) return;
      var e = edit;
      setCell(e.x, e.y, e.value);
      setEdit(null);
      if (move) moveSel(move, e);
      focusBox();
    };
    var download = function () {
      var csv = dataRef.current.map(function (r) { return r.map(csvCell).join(","); }).join("\r\n");
      var blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.setAttribute("download", "jexcel.csv");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    var insertRow = function (y, before) { update(function (d) { d.splice(before ? y : y + 1, 0, emptyRow()); }); };
    var deleteRow = function (y) {
      update(function (d) { d.splice(y, 1); });
      setSel(null);
    };
    var insertColumn = function (x, before) {
      var at = before ? x : x + 1;
      var cols = colsRef.current.slice();
      cols.splice(at, 0, { title: "", width: 50 });
      colsRef.current = cols;
      setColumns(cols);
      update(function (d) { d.forEach(function (r) { r.splice(at, 0, ""); }); });
    };
    var deleteColumn = function (x) {
      var cols = colsRef.current.slice();
      cols.splice(x, 1);
      colsRef.current = cols;
      setColumns(cols);
      update(function (d) { d.forEach(function (r) { r.splice(x, 1); }); });
      setSel(null);
    };
    var renameColumn = function (x) {
      var old = colsRef.current[x] ? colsRef.current[x].title : "";
      var v = window.prompt(JX.columnName, old);
      if (v) {
        var cols = colsRef.current.slice();
        cols[x] = Object.assign({}, cols[x], { title: v });
        colsRef.current = cols;
        setColumns(cols);
      }
    };
    var orderBy = function (x, direction) {
      update(function (d) {
        var temp = d.map(function (r, j) { return [j, String(gridCell(r[x])).toLowerCase()]; });
        temp.sort(function (a, b) {
          var va = a[1];
          var vb = b[1];
          if (!direction) return (va === "" && vb !== "") ? 1 : (va !== "" && vb === "") ? -1 : (va > vb) ? 1 : (va < vb) ? -1 : 0;
          return (va === "" && vb !== "") ? 1 : (va !== "" && vb === "") ? -1 : (va > vb) ? -1 : (va < vb) ? 1 : 0;
        });
        var copy = d.slice();
        temp.forEach(function (p, j) { d[j] = copy[p[0]]; });
      });
    };
    var copyToAll = function (x, y) {
      update(function (d) {
        var v = y === null || y === undefined || !d[y] ? "" : d[y][x];
        d.forEach(function (r) { r[x] = v; });
      });
    };
    var menuItems = function (x, y) {
      var items = [];
      if (y === null) {
        items.push({ title: JX.insertANewColumnBefore, onclick: function () { insertColumn(x, true); } });
        items.push({ title: JX.insertANewColumnAfter, onclick: function () { insertColumn(x, false); } });
        items.push({ title: JX.deleteSelectedColumns, onclick: function () { deleteColumn(x); } });
        items.push({ title: JX.renameThisColumn, onclick: function () { renameColumn(x); } });
        items.push({ type: "line" });
        items.push({ title: JX.orderAscending, onclick: function () { orderBy(x, 0); } });
        items.push({ title: JX.orderDescending, onclick: function () { orderBy(x, 1); } });
      } else {
        items.push({ title: JX.insertANewRowBefore, onclick: function () { insertRow(y, true); } });
        items.push({ title: JX.insertANewRowAfter, onclick: function () { insertRow(y, false); } });
        items.push({ title: JX.deleteSelectedRows, onclick: function () { deleteRow(y); } });
      }
      items.push({ type: "line" });
      items.push({ title: JX.saveAs, shortcut: "Ctrl + S", onclick: function () { download(); } });
      items.push({ type: "line" });
      items.push({ title: "Copy to all", onclick: function () { copyToAll(x, y); } });
      return items;
    };
    var openMenu = function (e, x, y) {
      e.preventDefault();
      if (edit) commit(null);
      if (y !== null) setSel({ x: x, y: y });
      setMenu({ x: x, y: y, left: e.clientX, top: e.clientY });
    };
    var cellValue = function (x, y) { var r = dataRef.current[y]; return r ? gridCell(r[x]) : ""; };
    var onKeyDown = function (e) {
      if (edit || !sel) return;
      var k = e.key;
      if (k === "ArrowUp") { moveSel("up"); e.preventDefault(); }
      else if (k === "ArrowDown") { moveSel(sel.y >= dataRef.current.length - 1 ? null : "down"); e.preventDefault(); }
      else if (k === "ArrowLeft") { moveSel("left"); e.preventDefault(); }
      else if (k === "ArrowRight" || k === "Tab") { moveSel("right"); e.preventDefault(); }
      else if (k === "Enter") { moveSel("down"); e.preventDefault(); }
      else if (k === "F2") { startEdit(sel.x, sel.y, String(cellValue(sel.x, sel.y))); e.preventDefault(); }
      else if (k === "Delete" || k === "Backspace") { setCell(sel.x, sel.y, ""); e.preventDefault(); }
      else if ((e.ctrlKey || e.metaKey) && (k === "c" || k === "C")) {
        if (navigator.clipboard) navigator.clipboard.writeText(String(cellValue(sel.x, sel.y)));
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && (k === "s" || k === "S")) { download(); e.preventDefault(); }
      else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { startEdit(sel.x, sel.y, k); e.preventDefault(); }
    };
    var onPaste = function (e) {
      if (edit || !sel) return;
      var text = (e.clipboardData || window.clipboardData).getData("text");
      if (!text) return;
      e.preventDefault();
      var lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
      if (lines.length > 1 && lines[lines.length - 1] === "") lines.pop();
      var block = lines.map(function (r) { return r.split("\t"); });
      var at = sel;
      update(function (d) {
        block.forEach(function (r, i) {
          var y = at.y + i;
          while (d.length <= y) d.push(emptyRow());
          r.forEach(function (v, j) {
            var x = at.x + j;
            if (x < colsRef.current.length) d[y][x] = v;
          });
        });
      });
    };
    var readFile = function (file) {
      if (CSV_TYPES.indexOf(file.type) < 0) {
        message.error(t("Only CSV files supported. Please convert the file to CSV"));
        return false;
      }
      var reader = new FileReader();
      reader.onload = function (ev) {
        var rows = parseDelimited(String(ev.target.result || ""));
        if (!rows.length) return;
        var cols = rows[0].map(function (p) { return { title: p, width: 100 }; });
        colsRef.current = cols;
        setColumns(cols);
        setData(gridPad(rows.slice(1, 10000), cols.length, 0));
        setSel(null);
        setEdit(null);
        if (props.instance) props.instance(api.current);
      };
      reader.readAsText(file);
      return false;
    };
    return (
      <div>
        {props.showFileImport && (
          <Upload beforeUpload={function (file) { return readFile(file); }} showUploadList={false}>
            <Button type="link" icon={<Ico type="upload" />}>{t("Upload File")}</Button>
          </Upload>
        )}
        <div style={{ display: "block" }} className="jexcel_container" tabIndex={-1} ref={boxRef} onKeyDown={onKeyDown} onPaste={onPaste}>
          <div className="jexcel_toolbar"></div>
            <div className="jexcel_content" style={{ overflowY: "auto", maxHeight: "600px" }}>
              <table className="jexcel jexcel_overflow" cellPadding="0" cellSpacing="0">
                <colgroup>
                  <col width="50" />
                  {columns.map(function (c, x) { return <col key={x} width={c.width || 50} />; })}
                </colgroup>
                <thead className="resizable">
                  <tr>
                    <td className="jexcel_selectall"></td>
                    {columns.map(function (c, x) {
                      return (
                        <td key={x} data-x={x} title={c.title} className={sel && sel.x === x ? "selected" : ""} style={{ textAlign: "center" }} onContextMenu={function (e) { openMenu(e, x, null); }}>
                          {c.title ? c.title : gridCol(x)}
                        </td>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="draggable">
                  {data.map(function (r, y) {
                    return (
                      <tr key={y} data-y={y} className={sel && sel.y === y ? "selected" : ""}>
                        <td data-y={y} className="jexcel_row">{y + 1}</td>
                        {columns.map(function (c, x) {
                          var isSel = !!(sel && sel.x === x && sel.y === y);
                          var isEdit = !!(edit && edit.x === x && edit.y === y);
                          var st = Object.assign({ textAlign: "center" }, cellStyles[gridCol(x) + (y + 1)] || {});
                          return (
                            <td
                              key={x}
                              data-x={x}
                              data-y={y}
                              style={st}
                              className={(isEdit ? "editor " : "") + (isSel ? "highlight highlight-left highlight-right highlight-top highlight-bottom highlight-selected" : "")}
                              onMouseDown={function (e) {
                                if (e.button !== 0 || isEdit) return;
                                if (edit) commit(null);
                                setSel({ x: x, y: y });
                                focusBox();
                              }}
                              onDoubleClick={function () { startEdit(x, y, String(gridCell(r[x]))); }}
                              onContextMenu={function (e) { openMenu(e, x, y); }}>
                              {isEdit ? (
                                <input
                                  ref={function (inp) {
                                    if (inp && !inp.getAttribute("data-open")) {
                                      inp.setAttribute("data-open", "1");
                                      inp.focus();
                                      var n = inp.value.length;
                                      try { inp.setSelectionRange(n, n); } catch (err) {}
                                    }
                                  }}
                                  value={edit.value}
                                  onChange={function (e) {
                                    var v = e.target.value;
                                    setEdit(function (p) { return p ? Object.assign({}, p, { value: v }) : p; });
                                  }}
                                  onKeyDown={function (e) {
                                    if (e.key === "Enter") { commit("down"); e.preventDefault(); }
                                    else if (e.key === "Tab") { commit("right"); e.preventDefault(); }
                                    else if (e.key === "Escape") { setEdit(null); focusBox(); e.preventDefault(); }
                                  }}
                                  onBlur={function () { commit(null); }}
                                  style={{ width: "100%", height: "100%", border: 0, padding: 0, margin: 0, outline: "none", background: "transparent", textAlign: st.textAlign, fontWeight: st.fontWeight }}
                                />
                              ) : gridCell(r[x])}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="jexcel_corner" style={{ top: "-2000px", left: "-2000px" }}></div>
              <textarea className="jexcel_textarea" tabIndex={-1} readOnly value=""></textarea>
            </div>
          <div className="jexcel_pagination" style={{ display: "none" }}><div></div><div></div></div>
          <div className={"jcontextmenu jexcel_contextmenu" + (menu ? " jcontextmenu-focus" : "")} tabIndex={900} style={menu ? { top: menu.top, left: menu.left } : undefined} onMouseDown={function (e) { e.stopPropagation(); }}>
            {menu ? menuItems(menu.x, menu.y).map(function (it, i) {
              if (it.type === "line") return <hr key={i} />;
              return (
                <div key={i} onMouseUp={function () { setMenu(null); it.onclick(); }}>
                  <a>{it.title}</a>
                  {it.shortcut ? <span>{it.shortcut}</span> : null}
                </div>
              );
            }) : null}
          </div>
          <div className="jexcel_about"></div>
        </div>
      </div>
    );
  };

  /* ---------- Accounting: auxiliares de linea ---------- */
  var CatalogAuxTypeSelect = function (props) {
    var s1 = useState([]);
    var data = s1[0];
    var setData = s1[1];
    var s2 = useState(false);
    var loading = s2[0];
    var setLoading = s2[1];
    var parseValue = function (val) {
      if (Array.isArray(val)) return val;
      if (typeof val === "string") {
        if (!val) return [];
        try {
          var arr = JSON.parse(val);
          if (Array.isArray(arr)) return arr;
          return [val];
        } catch (e) {
          return [val];
        }
      }
      if (val === undefined || val === null) return [];
      return [val];
    };
    var serializeValue = function (arr) {
      if (!arr || arr.length === 0) return "";
      if (arr.length === 1) return arr[0];
      return JSON.stringify(arr);
    };
    var parsedPropValue = parseValue(props.value);
    var isMultiple = parsedPropValue.length > 1;
    var s3 = useState(parsedPropValue);
    var values = s3[0];
    var setValues = s3[1];
    useEffect(function () { load(); }, []);
    useEffect(function () { setValues(parseValue(props.value)); }, [props.value]);
    var load = function () {
      setLoading(true);
      exe("RepoCatalogAuxType", { operation: "GET" }).then(function (r) {
        setLoading(false);
        if (r.ok) setData(r.outData);
        else message.error(r.msg);
      });
    };
    var onSelect = function (v, opt) { if (props.onSelect) props.onSelect(opt.props.record); };
    var handleAdd = function () {
      var newArr = values.concat([undefined]);
      setValues(newArr);
      if (props.onChange) props.onChange(serializeValue(newArr));
    };
    var handleChange = function (v, idx) {
      if (values.indexOf(v) >= 0) return;
      var newValues = values.slice();
      newValues[idx] = v;
      setValues(newValues);
      if (props.onChange) props.onChange(serializeValue(newValues));
    };
    var handleRemove = function (idx) {
      var newValues = values.filter(function (x, i) { return i !== idx; });
      if (newValues.length === 1) {
        setValues([]);
        if (props.onChange) props.onChange(serializeValue([newValues[0]]));
      } else {
        setValues(newValues);
        if (props.onChange) props.onChange(serializeValue(newValues));
      }
    };
    return (
      <div style={{ display: "flex", flexDirection: isMultiple ? "column" : "row", gap: 2 }}>
        {isMultiple ? (
          <Fragment>
            {values.map(function (val, idx) {
              return (
                <div key={idx} style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
                  <Select value={val} onChange={function (v) { handleChange(v, idx); }} loading={loading} style={Object.assign({ width: "100%" }, props.style)} placeholder={t("Please select...")} disabled={props.disabled} allowClear>
                    {data.map(function (p) {
                      return <Select.Option value={p.code} key={p.code} record={p} disabled={values.indexOf(p.code) >= 0 && val !== p.code}>{t(p.name)}</Select.Option>;
                    })}
                  </Select>
                  <Button type="link" danger onClick={function () { handleRemove(idx); }}>
                    <Ico type="close-circle" />
                  </Button>
                </div>
              );
            })}
            <Button type="link" icon={<Ico type="plus-circle" />} onClick={handleAdd} style={{ alignSelf: "flex-start" }} />
          </Fragment>
        ) : (
          <Fragment>
            <Select id={props.id} value={props.value} onChange={function (v) { props.onChange(v); }} onSelect={onSelect} loading={loading} style={Object.assign({ width: "100%" }, props.style)} placeholder={t("Please select...")} disabled={props.disabled} allowClear>
              {data.map(function (p) {
                return <Select.Option value={p.code} key={p.code} record={p}>{t(p.name)}</Select.Option>;
              })}
            </Select>
            <Button
              type="link"
              icon={<Ico type="plus-circle" />}
              onClick={function () {
                var arr = parsedPropValue.length > 0 ? parsedPropValue.concat([undefined]) : [undefined];
                setValues(arr);
                if (props.onChange) props.onChange(serializeValue(arr));
              }}
            />
          </Fragment>
        )}
      </div>
    );
  };
  var AuxValueSelect = function (props) {
    var s1 = useState([]);
    var data = s1[0];
    var setData = s1[1];
    var s2 = useState(false);
    var loading = s2[0];
    var setLoading = s2[1];
    var s3 = useState(false);
    var hasPredefinedValues = s3[0];
    var setHasPredefinedValues = s3[1];
    useEffect(function () {
      if (props.auxTypeCode) loadValues();
      else {
        setData([]);
        setHasPredefinedValues(false);
      }
    }, [props.auxTypeCode]);
    var loadValues = function () {
      setLoading(true);
      exe("GetAuxValues", { auxCode: props.auxTypeCode }).then(function (r) {
        setLoading(false);
        if (r.ok) {
          var values = (r.outData && r.outData.values) || [];
          setData(values);
          setHasPredefinedValues(values.length > 0);
        } else {
          message.error(r.msg);
          setData([]);
          setHasPredefinedValues(false);
        }
      });
    };
    if (!props.auxTypeCode) return <Input {...props} disabled placeholder={t("Please select an aux type first")} />;
    if (loading) return <Input {...props} disabled suffix={<Spin size="small" />} placeholder={t("Loading values...")} />;
    if (hasPredefinedValues) {
      return (
        <Select
          id={props.id}
          value={props.value != null ? String(props.value) : undefined}
          onChange={props.onChange}
          style={Object.assign({ width: "100%" }, props.style)}
          placeholder={t("Please select...")}
          disabled={props.disabled}
          allowClear
          showSearch
          optionFilterProp="children"
          filterOption={function (input, option) {
            return option.children && option.children.toLowerCase ? option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0 : false;
          }}>
          {data.map(function (item, index) {
            var itemKeys = Object.keys(item);
            var value = String(item[itemKeys[0]]);
            var label = itemKeys.length > 1 ? item[itemKeys[1]] : value;
            return <Select.Option value={value} key={index}>{label}</Select.Option>;
          })}
        </Select>
      );
    }
    return <Input {...props} placeholder={t("Enter value")} />;
  };
  var TransactionLineAuxEdit = function (props) {
    var form = useLegacyForm();
    var field = form.field;
    var values = form.getFieldsValue();
    useEffect(function () { form.setFieldsValue(props.selected); }, [props.visible]);
    var onSave = function () {
      form.validateFields(function (err, vals) {
        if (err) return;
        if (props.onOk) props.onOk(vals);
      });
    };
    field("id");
    return (
      <div>
        <Button type={"link"} icon={<Ico type="left" legacy />} onClick={function () { props.onBack(); }}>{t("Back")}</Button>
        <Button type="link" icon={<Ico type="save" />} onClick={onSave}>{t("Save")}</Button>
        <Popconfirm title={t("Are you sure you want to delete this record?")} onConfirm={function () { props.onDelete(props.selected); }}>
          <Button type="link" icon={<Ico type="delete" />}>{t("Delete")}</Button>
        </Popconfirm>
        <LegacyItem form={form} name="transactionLineId" label={t("Line Id")}>{field("transactionLineId", { initialValue: props.line.id, rules: [{ required: true }] })(<InputNumber min={1} disabled={true} />)}</LegacyItem>
        <LegacyItem label={t("Line")}><InputNumber min={1} disabled={true} value={props.line.order} /></LegacyItem>
        <LegacyItem form={form} name="auxTypeCode" label={t("Aux Type")}>{field("auxTypeCode", { rules: [{ required: true }] })(<CatalogAuxTypeSelect />)}</LegacyItem>
        <LegacyItem form={form} name="auxId" label={t("Aux Value")}>{field("auxId", { rules: [{ required: true }] })(<AuxValueSelect auxTypeCode={values.auxTypeCode} />)}</LegacyItem>
      </div>
    );
  };
  var TransactionLineAux = function (props) {
    var s1 = useState();
    var selected = s1[0];
    var setSelected = s1[1];
    var s2 = useState(false);
    var loading = s2[0];
    var setLoading = s2[1];
    var s3 = useState([]);
    var data = s3[0];
    var setData = s3[1];
    var s4 = useState({});
    var auxNameMap = s4[0];
    var setAuxNameMap = s4[1];
    useEffect(function () {
      if (props.line && props.line.Auxiliaries) {
        setData(props.line.Auxiliaries);
        loadAuxNames(props.line.Auxiliaries);
      } else if (props.visible) {
        load();
      }
    }, [props.visible]);
    var loadAuxNames = function (records) {
      var types = Array.from(new Set(records.map(function (r) { return r.auxTypeCode; }).filter(Boolean)));
      Promise.all(types.map(function (code) {
        return exe("GetAuxValues", { auxCode: code }).then(function (r) {
          var map = {};
          (r.ok ? (r.outData && r.outData.values) || [] : []).forEach(function (item) {
            var k = Object.keys(item);
            map[code + "-" + item[k[0]]] = k.length > 1 ? item[k[1]] : item[k[0]];
          });
          return map;
        });
      })).then(function (maps) { setAuxNameMap(Object.assign.apply(Object, [{}].concat(maps))); });
    };
    var load = function () {
      if (!(props.line && props.line.id)) {
        message.error(t("Line id not found"));
        return;
      }
      setLoading(true);
      exe("RepoTransactionLineAux", { operation: "GET", filter: "transactionLineId=" + props.line.id }).then(function (r) {
        setLoading(false);
        if (r.ok) {
          setData(r.outData);
          loadAuxNames(r.outData);
        } else message.error(r.msg);
      });
    };
    var onSave = function (values) {
      setSelected(null);
      setLoading(true);
      exe("RepoTransactionLineAux", { operation: values.id ? "UPDATE" : "ADD", entity: values }).then(function (r) {
        setLoading(false);
        if (r.ok) {
          message.success(values.id ? t("Updated successfully") : t("Added successfully"));
          load();
        } else message.error(r.msg);
      });
    };
    var onDelete = function (record) {
      setSelected(null);
      setLoading(true);
      exe("RepoTransactionLineAux", { operation: "DELETE", entity: record }).then(function (r) {
        setLoading(false);
        if (r.ok) {
          message.success(t("Deleted successfully"));
          load();
        } else message.error(r.msg);
      });
    };
    return (
      <Modal visible={props.visible} title={t("Auxiliaries")} onCancel={props.onCancel} onOk={function () { if (props.onOk) props.onOk(data); }}>
        {!selected && (
          <div>
            <Button type={"link"} icon={<Ico type="plus" legacy />} onClick={function () { setSelected({ id: 0 }); }} disabled={props.readOnly}>{t("Add")} </Button>
            <Button type={"link"} icon={<Ico type="reload" legacy />} onClick={load}>{t("Reload")} </Button>
            <Table dataSource={data} rowKey={"id"} style={{ marginTop: 5 }} pagination={false} loading={loading}>
              <Table.Column title={t("Aux Value")} dataIndex={"auxId"} />
              <Table.Column title={t("Aux Value Name")} dataIndex={"auxId"} key={"auxName"} render={function (val, r) { return auxNameMap[r.auxTypeCode + "-" + String(val)]; }} />
              <Table.Column title={t("Aux Type")} dataIndex={"auxTypeCode"} />
              <Table.Column title={t("Actions")} key={"actions"} render={function (v, r) { return <div><Button type={"link"} icon={<Ico type="edit" legacy />} onClick={function () { setSelected(r); }} disabled={props.readOnly} /> </div>; }} />
            </Table>
          </div>
        )}
        {selected && (
          <div>
            <TransactionLineAuxEdit selected={selected} onBack={function () { setSelected(null); }} onOk={function (r) { onSave(r); }} onDelete={onDelete} line={props.line} />
          </div>
        )}
      </Modal>
    );
  };

  /* ---------- Accounting: importes por linea ---------- */
  var TransactionLineAmountEdit = function (props) {
    var AForm = A.Form;
    var fm = AForm.useForm();
    var form = fm[0];
    useEffect(function () {
      if (props.selected) {
        form.setFieldsValue(Object.assign({}, props.selected, { rateDate: props.selected.rateDate ? setDate(props.selected.rateDate) : null }));
      }
    }, [props.selected]);
    var onFinish = function (values) {
      var entity = Object.assign({}, values, { id: props.selected.id || 0, transactionLineId: props.line.id, rateDate: values.rateDate ? values.rateDate.toISOString() : null });
      if (props.onOk) props.onOk(entity);
    };
    var onDelete = function () { if (props.onDelete) props.onDelete(props.selected); };
    return (
      <div>
        <AForm form={form} onFinish={onFinish} layout={"vertical"}>
          <AForm.Item label={t("Currency")} name={"currency"} rules={[{ required: true }]}>
            <Input maxLength={3} placeholder="USD, EUR, etc." />
          </AForm.Item>
          <AForm.Item label={t("Debit")} name={"debit"} rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} min={0} precision={2} />
          </AForm.Item>
          <AForm.Item label={t("Credit")} name={"credit"} rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} min={0} precision={2} />
          </AForm.Item>
          <AForm.Item label={t("Rate to Transaction")} name={"rateToTxn"}>
            <InputNumber style={{ width: "100%" }} min={0} precision={6} />
          </AForm.Item>
          <AForm.Item label={t("Rate Date")} name={"rateDate"}>
            <DatePicker style={{ width: "100%" }} />
          </AForm.Item>
          <AForm.Item label={t("Valuation Type")} name={"valuationType"}>
            <Input placeholder="Spot, Close, Average, Revaluation" />
          </AForm.Item>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button onClick={props.onBack}>{t("Back")}</Button>
            <div>
              {props.selected && props.selected.id > 0 && (
                <Popconfirm title={t("Are you sure?")} onConfirm={onDelete}>
                  <Button danger>{t("Delete")}</Button>
                </Popconfirm>
              )}
              <Button type={"primary"} htmlType={"submit"} style={{ marginLeft: 10 }}>{t("Save")}</Button>
            </div>
          </div>
        </AForm>
      </div>
    );
  };
  var fixed = function (n) { return function (v) { return v === null || v === undefined ? v : v.toFixed(n); }; };
  var TransactionLineAmount = function (props) {
    var s1 = useState();
    var selected = s1[0];
    var setSelected = s1[1];
    var s2 = useState(false);
    var loading = s2[0];
    var setLoading = s2[1];
    var s3 = useState([]);
    var data = s3[0];
    var setData = s3[1];
    useEffect(function () {
      if (props.line && props.line.Amounts) setData(props.line.Amounts);
      else if (props.visible) load();
    }, [props.visible]);
    var load = function () {
      if (!(props.line && props.line.id)) {
        message.error(t("Line id not found"));
        return;
      }
      setLoading(true);
      exe("RepoTransactionLineAmount", { operation: "GET", filter: "transactionLineId=" + props.line.id }).then(function (r) {
        setLoading(false);
        if (r.ok) setData(r.outData);
        else message.error(r.msg);
      });
    };
    var onSave = function (values) {
      setSelected(null);
      setLoading(true);
      exe("RepoTransactionLineAmount", { operation: values.id ? "UPDATE" : "ADD", entity: values }).then(function (r) {
        setLoading(false);
        if (r.ok) {
          message.success(values.id ? t("Updated successfully") : t("Added successfully"));
          load();
        } else message.error(r.msg);
      });
    };
    var onDelete = function (record) {
      setSelected(null);
      setLoading(true);
      exe("RepoTransactionLineAmount", { operation: "DELETE", entity: record }).then(function (r) {
        setLoading(false);
        if (r.ok) {
          message.success(t("Deleted successfully"));
          load();
        } else message.error(r.msg);
      });
    };
    return (
      <Modal visible={props.visible} title={t("Line Amounts")} onCancel={props.onCancel} onOk={function () { if (props.onOk) props.onOk(data); }} width={800}>
        {!selected && (
          <div>
            <Button type={"link"} icon={<Ico type="plus" legacy />} onClick={function () { setSelected({ id: 0 }); }} disabled={props.readOnly}>{t("Add")} </Button>
            <Button type={"link"} icon={<Ico type="reload" legacy />} onClick={load}>{t("Reload")} </Button>
            <Table dataSource={data} rowKey={"id"} style={{ marginTop: 5 }} pagination={false} loading={loading}>
              <Table.Column title={t("Currency")} dataIndex={"currency"} />
              <Table.Column title={t("Debit")} dataIndex={"debit"} render={fixed(2)} />
              <Table.Column title={t("Credit")} dataIndex={"credit"} render={fixed(2)} />
              <Table.Column title={t("Rate to Txn")} dataIndex={"rateToTxn"} render={fixed(6)} />
              <Table.Column title={t("Rate Date")} dataIndex={"rateDate"} render={formatPanamaDateTime} />
              <Table.Column title={t("Valuation Type")} dataIndex={"valuationType"} />
              <Table.Column title={t("Actions")} key={"actions"} render={function (v, r) { return <div><Button type={"link"} icon={<Ico type="edit" legacy />} onClick={function () { setSelected(r); }} disabled={props.readOnly} /> </div>; }} />
            </Table>
          </div>
        )}
        {selected && (
          <div>
            <TransactionLineAmountEdit selected={selected} onBack={function () { setSelected(null); }} onOk={function (r) { onSave(r); }} onDelete={onDelete} line={props.line} />
          </div>
        )}
      </Modal>
    );
  };

  /* ---------- Accounting: centros de costo ---------- */
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
        <Select id={props.id} style={{ width: "100%" }} showArrow placeholder={t("Please select cost center")} value={props.value} onChange={props.onChange} onSelect={props.onSelect && props.onSelect} loading={loading} allowClear showSearch optionFilterProp="children">
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
    useEffect(function () { if (props.costCenterCode) load(props.costCenterCode); }, [props.costCenterCode]);
    var load = function (code) {
      setLoading(true);
      exe("GetCostCenterValues", { costCenterCode: code }).then(function (r) {
        setLoading(false);
        if (r.ok) setData(r.outData);
        else message.error(r.msg);
      });
    };
    var onSelect = function (v, opt) { if (props.onSelect) props.onSelect(v, opt); };
    return (
      <div>
        <Select id={props.id} style={{ width: "100%" }} showArrow placeholder={t("Please select cost value")} value={props.value} onChange={props.onChange} onSelect={onSelect} loading={loading} allowClear showSearch optionFilterProp="children">
          {data.map(function (p) { return <Select.Option value={p.code} key={p.code} record={p}>{p.name}</Select.Option>; })}
        </Select>
      </div>
    );
  };
  var CostCenterEdit = function (props) {
    var form = useLegacyForm();
    var field = form.field;
    var values = form.getFieldsValue();
    useEffect(function () { form.setFieldsValue(props.selected); }, [props.visible]);
    var onSave = function () {
      form.validateFields(function (err, vals) {
        if (err) return;
        if (props.onOk) props.onOk(vals);
      });
    };
    field("id");
    field("transactionLineId");
    field("value");
    return (
      <div>
        <Button type={"link"} icon={<Ico type="left" legacy />} onClick={function () { props.onBack(); }}>{t("Back")}</Button>
        <Button type="link" icon={<Ico type="save" />} onClick={onSave}>{t("Save")}</Button>
        <Popconfirm title={t("Are you sure you want to delete this record?")} onConfirm={function () { props.onDelete(props.selected); }}>
          <Button type="link" icon={<Ico type="delete" />}>{t("Delete")}</Button>
        </Popconfirm>
        <LegacyItem form={form} name="line" label={t("Line")}>{field("line", { rules: [{ required: true }] })(<InputNumber min={1} />)}</LegacyItem>
        <LegacyItem form={form} name="costCenterCode" label={t("Cost Center")}>{field("costCenterCode", { rules: [{ required: true }] })(<CostCenterSelect />)}</LegacyItem>
        <LegacyItem form={form} name="valueCode" label={t("Cost Center Value")}>{field("valueCode", { rules: [{ required: true }] })(<CostCenterValueSelect costCenterCode={values.costCenterCode} />)}</LegacyItem>
      </div>
    );
  };
  var CostCenters = function (props) {
    var s1 = useState();
    var selected = s1[0];
    var setSelected = s1[1];
    var s2 = useState(false);
    var loading = s2[0];
    var setLoading = s2[1];
    var onSave = function (values) {
      setSelected(null);
      if (values.id) {
        setLoading(true);
        exe("RepoTransactionLineCostCenter", { operation: "UPDATE", entity: values }).then(function (r) {
          setLoading(false);
          if (r.ok) props.reload();
          else message.error(r.msg);
        });
      } else {
        var affectedLine = props.transaction.Lines.find(function (p) { return p.order === values.line; });
        if (!affectedLine) {
          message.error(t("Line not found in transaction --> " + values.line));
          return;
        }
        values.transactionLineId = affectedLine.id;
        setLoading(true);
        exe("RepoTransactionLineCostCenter", { operation: "ADD", entity: values }).then(function (r) {
          setLoading(false);
          if (r.ok) props.reload();
          else message.error(r.msg);
        });
      }
    };
    var onDelete = function (record) {
      setSelected(null);
      setLoading(true);
      exe("RepoTransactionLineCostCenter", { operation: "DELETE", entity: record }).then(function (r) {
        setLoading(false);
        if (r.ok) props.reload();
        else message.error(r.msg);
      });
    };
    var data = (props.transaction && props.transaction.Lines.flatMap(function (l) {
      return (l.CostCenters || []).map(function (p) { return Object.assign({ line: l.order, transactionLineId: l.id }, p); });
    })) || [];
    return (
      <Modal visible={props.visible} title={t("Cost Centers")} onCancel={props.onCancel} onOk={props.onOk}>
        {!selected && (
          <div>
            <Button type={"link"} icon={<Ico type="plus" legacy />} onClick={function () { setSelected({ id: 0 }); }} disabled={props.readOnly}>{t("Add")} </Button>
            <Table dataSource={data} rowKey={"id"} style={{ marginTop: 5 }} pagination={false} loading={loading}>
              <Table.Column title={t("Line")} dataIndex={"line"} />
              <Table.Column title={t("Cost Center")} dataIndex={"CostCenter.name"} />
              <Table.Column title={t("Value")} dataIndex={"value"} />
              <Table.Column title={t("Code")} dataIndex={"valueCode"} />
              <Table.Column title={t("Actions")} key={"actions"} render={function (v, r) { return <div><Button type={"link"} icon={<Ico type="edit" legacy />} onClick={function () { setSelected(r); }} disabled={props.readOnly} /> </div>; }} />
            </Table>
          </div>
        )}
        {selected && (
          <div>
            <CostCenterEdit selected={selected} onBack={function () { setSelected(null); }} onOk={function (r) { onSave(r); }} onDelete={onDelete} />
          </div>
        )}
      </Modal>
    );
  };

  /* ---------- Accounting/TransactionLine ---------- */
  // Line Amounts, Auxiliaries and Cost Centers options are hidden in the Transaction tab. Set to true to show them again.
  var SHOW_LINE_EXTRAS = false;
  var SHOW_FOREIGN_AMOUNT_COLUMNS = false;
  var MSG_POSTED = "The transaction is posted and cannot be modified. It can only be reversed or cloned.";
  var MSG_PERIOD_CLOSED = "The transaction belongs to a closed accounting period and cannot be modified.";
  var TransactionLine = function (props) {
    var s1 = useState(undefined);
    var account = s1[0];
    var setAccount = s1[1];
    var s2 = useState(undefined);
    var debit = s2[0];
    var setDebit = s2[1];
    var s3 = useState(undefined);
    var credit = s3[0];
    var setCredit = s3[1];
    var s4 = useState("USD");
    var defaultCurrency = s4[0];
    var setDefaultCurrency = s4[1];
    var s5 = useState();
    var order = s5[0];
    var setOrder = s5[1];
    var s6 = useState(undefined);
    var xDebit = s6[0];
    var setXdebit = s6[1];
    var s7 = useState(undefined);
    var xCredit = s7[0];
    var setXcredit = s7[1];
    var s8 = useState();
    var xChangeRate = s8[0];
    var setXchangeRate = s8[1];
    var s9 = useState();
    var xCurrency = s9[0];
    var setXcurrency = s9[1];
    var s10 = useState(false);
    var loading = s10[0];
    var setLoading = s10[1];
    var s11 = useState();
    var auxId = s11[0];
    var setAuxId = s11[1];
    var s12 = useState();
    var auxType = s12[0];
    var setAuxType = s12[1];
    var s13 = useState();
    var comments = s13[0];
    var setComments = s13[1];
    var s14 = useState(false);
    var auxVisible = s14[0];
    var setAuxVisible = s14[1];
    var s15 = useState(false);
    var amountVisible = s15[0];
    var setAmountVisible = s15[1];
    var s16 = useState(false);
    var accountDropdownOpen = s16[0];
    var setAccountDropdownOpen = s16[1];
    var s17 = useState(0);
    var accountSelectKey = s17[0];
    var setAccountSelectKey = s17[1];
    useEffect(function () {
      if (props.defaultCurrency) setDefaultCurrency(props.defaultCurrency);
    }, [props.defaultCurrency]);
    useEffect(function () {
      if (props.value) {
        setAccount(props.value.account);
        setDebit(props.value.debit);
        setCredit(props.value.credit);
        setOrder(props.value.order);
        setXdebit(props.value.xDebit);
        setXcredit(props.value.xCredit);
        setXchangeRate(props.value.xChangeRate);
        setXcurrency(props.value.xCurrency);
        setAuxId(props.value.auxId);
        setComments(props.value.comments);
      }
    }, [props.value]);
    useEffect(function () {
      if (props.autoCalc && (xDebit || xCredit) && !xChangeRate && props.postingDate) getExchangeRate();
    }, [xDebit, xCredit]);
    var onChangeOrder = function (v) {
      setOrder(v);
      if (props.onChange) props.onChange(Object.assign({}, props.value, { order: v }));
    };
    var onSelectAccountRecord = function (record) {
      if (!record.isDetail) {
        message.error(t("Not a detail account"));
        // Remount the account select so the rejected account is not left on screen.
        setAccountSelectKey(function (k) { return k + 1; });
        return;
      }
      setAccount(record.code);
      setXcurrency(record.currency);
      setAuxType(record.auxType);
      if (props.onChange) props.onChange(Object.assign({}, props.value, { account: record.code, xCurrency: record.currency }));
    };
    var onChangeDebit = function (v) {
      setDebit(v);
      if (props.value.debit !== v) props.onChange(Object.assign({}, props.value, { debit: v }));
    };
    var onChangeCredit = function (v) {
      setCredit(v);
      if (props.value.credit !== v) props.onChange(Object.assign({}, props.value, { credit: v }));
    };
    var onChangeXdebit = function (v) {
      setXdebit(v);
      if (props.autoCalc && xChangeRate) {
        var newDebit = isNaN(v) ? 0 : roundMoney(xChangeRate * v, defaultCurrency);
        setDebit(newDebit);
        if (props.onChange) props.onChange(Object.assign({}, props.value, { xDebit: v, debit: newDebit }));
      } else if (props.value.xDebit !== v) props.onChange(Object.assign({}, props.value, { xDebit: v }));
    };
    var onChangeXcredit = function (v) {
      setXcredit(v);
      if (props.autoCalc && xChangeRate) {
        var newCredit = isNaN(v) ? 0 : roundMoney(xChangeRate * v, defaultCurrency);
        setCredit(newCredit);
        if (props.onChange) props.onChange(Object.assign({}, props.value, { xCredit: v, credit: newCredit }));
      } else if (props.value.xCredit !== v) props.onChange(Object.assign({}, props.value, { xCredit: v }));
    };
    var onChangeXChangeRate = function (v, newDebit, newCredit) {
      if (newDebit === undefined) newDebit = null;
      if (newCredit === undefined) newCredit = null;
      setXchangeRate(v);
      if (props.onChange) props.onChange(Object.assign({}, props.value, { debit: newDebit == null ? debit : newDebit, credit: newCredit == null ? credit : newCredit, xChangeRate: v }));
    };
    var getExchangeRate = function () {
      if (!props.postingDate) {
        message.error(t("Please define a posting date"));
        return;
      }
      var financialProduct = xCurrency || "USD";
      var financialProductColumn = "bid";
      var org = userOrg();
      var orgDefaultCurrency = org ? org.defaultCurrency : undefined;
      if (defaultCurrency !== orgDefaultCurrency && xCurrency !== orgDefaultCurrency) {
        financialProduct = xCurrency + "-" + defaultCurrency;
      } else if (xCurrency === defaultCurrency) {
        financialProduct = defaultCurrency;
        financialProductColumn = "ask";
      }
      setLoading(true);
      exe("GetExchangeRate", { currency: financialProduct, date: props.postingDate, column: financialProductColumn }).then(function (r) {
        setLoading(false);
        if (r.ok) {
          var newXchangeRate = r.outData;
          var newDebit = isNaN(xDebit) ? 0 : roundMoney(r.outData * xDebit, defaultCurrency);
          var newCredit = isNaN(xCredit) ? 0 : roundMoney(r.outData * xCredit, defaultCurrency);
          setXchangeRate(newXchangeRate);
          setDebit(newDebit);
          setCredit(newCredit);
          onChangeXChangeRate(newXchangeRate, newDebit, newCredit);
        } else message.error(r.msg);
      });
    };
    var onChangeAuxId = function (v) {
      setAuxId(v);
      if (props.onChange) props.onChange(Object.assign({}, props.value, { auxId: v }));
    };
    var onChangeComments = function (v) {
      setComments(v);
      if (props.onChange) props.onChange(Object.assign({}, props.value, { comments: v }));
    };
    var onAuxOk = function (v) {
      setAuxVisible(false);
      if (props.onChange) props.onChange(Object.assign({}, props.value, { Auxiliaries: v }));
    };
    var onAmountOk = function (v) {
      setAmountVisible(false);
      if (props.onChange) props.onChange(Object.assign({}, props.value, { Amounts: v }));
    };
    var hasAux = props.value && props.value.Auxiliaries && props.value.Auxiliaries.length > 0;
    var hasAmounts = props.value && props.value.Amounts && props.value.Amounts.length > 0;
    return (
      <div style={{ display: "flex", marginTop: 5, flex: 1 }}>
        <InputNumber style={{ width: "100%", minWidth: 55, maxWidth: 55, marginRight: 5 }} value={order} onChange={function (v) { onChangeOrder(v); }} min={1} disabled={props.locked} />
        <AccountSelectDetail
          key={"account-" + accountSelectKey}
          detailSearch
          style={{ flex: 1, maxWidth: accountDropdownOpen ? 800 : 400, minWidth: accountDropdownOpen ? 500 : 200, marginRight: 5, transition: "all 0.3s ease" }}
          value={account}
          onChange={function (v) { return v; }}
          onSelect={onSelectAccountRecord}
          accountRecord={props.value && props.value.Account}
          onDropdownVisibleChange={setAccountDropdownOpen}
          disabled={props.locked}
        />
        {!accountDropdownOpen && <Input style={{ flex: 1, minWidth: 200, marginRight: 5 }} value={comments} onChange={function (e) { onChangeComments(e.target.value); }} disabled={props.locked} />}
        {!accountDropdownOpen && <Money style={{ maxWidth: 200, marginRight: 5 }} currency={defaultCurrency} value={debit} onChange={function (v) { onChangeDebit(v); }} disabled={props.locked} />}
        {!accountDropdownOpen && <Money style={{ maxWidth: 200, marginRight: 5 }} currency={defaultCurrency} value={credit} onChange={function (v) { onChangeCredit(v); }} disabled={props.locked} />}
        {SHOW_FOREIGN_AMOUNT_COLUMNS && !accountDropdownOpen && <Money style={{ maxWidth: 200, marginRight: 5 }} currency={xCurrency} value={xDebit} onChange={function (v) { onChangeXdebit(v); }} disabled={props.locked} />}
        {SHOW_FOREIGN_AMOUNT_COLUMNS && !accountDropdownOpen && <Money style={{ maxWidth: 200, marginRight: 5 }} currency={xCurrency} value={xCredit} onChange={function (v) { onChangeXcredit(v); }} disabled={props.locked} />}
        {!accountDropdownOpen && <InputNumber style={{ width: "100%", maxWidth: 100, marginRight: 5 }} value={xChangeRate} onChange={function (v) { onChangeXChangeRate(v); }} min={0} disabled={props.locked || (!xDebit && !xCredit)} />}
        {!accountDropdownOpen && <Button type="link" onClick={getExchangeRate} icon={<Ico type="dollar" />} disabled={props.locked || (!xDebit && !xCredit)} loading={loading} />}
        {!accountDropdownOpen && <Input style={{ maxWidth: 200, marginLeft: 5, marginRight: 5 }} value={auxId} onChange={function (e) { onChangeAuxId(e.target.value); }} disabled={props.locked || !auxType} />}
        {/* Line Amounts and Auxiliaries options are hidden in this view (line data is kept untouched). */}
        {SHOW_LINE_EXTRAS && !accountDropdownOpen && (
          <Tooltip title={t("Auxiliaries")}>
            <Button type="link" style={hasAux ? { color: "green" } : {}} onClick={function () { setAuxVisible(true); }} icon={<Ico type="tags" />} loading={loading} />
          </Tooltip>
        )}
        {SHOW_LINE_EXTRAS && !accountDropdownOpen && (
          <Tooltip title={t("Line Amounts")}>
            <Button type="link" style={hasAmounts ? { color: "blue" } : {}} onClick={function () { setAmountVisible(true); }} icon={<Ico type="wallet" />} loading={loading} />
          </Tooltip>
        )}
        {SHOW_LINE_EXTRAS && <TransactionLineAux visible={auxVisible} onOk={props.readOnly ? function () { setAuxVisible(false); } : onAuxOk} onCancel={function () { setAuxVisible(false); }} transaction={props.transaction} line={props.value} readOnly={props.readOnly} />}
        {SHOW_LINE_EXTRAS && <TransactionLineAmount visible={amountVisible} onOk={props.readOnly ? function () { setAmountVisible(false); } : onAmountOk} onCancel={function () { setAmountVisible(false); }} transaction={props.transaction} line={props.value} readOnly={props.readOnly} />}
      </div>
    );
  };

  /* ---------- Accounting/Transaction (pestana Transaccion) ---------- */
  var LINES_PAGE_SIZE = 20;
  var PAGE_INCLUDE = ["Process", "Lines.Account", "Lines.CostCenters", "Lines.CostCenters.CostCenter", "Lines.Auxiliaries"];
  var FULL_INCLUDE = ["Lines", "Process", "Lines.CostCenters", "Lines.CostCenters.CostCenter", "Lines.Account", "Lines.Auxiliaries"];
  var byOrder = function (a, b) { return a.order - b.order || a.id - b.id; };
  // Word template used by GenerateDoc to print manual accounting entries.
  var DOCUMENT_TEMPLATE = "AsientoContable.docx";
  // API host that serves generated files: sisos-<env>.axxis-systems.net -> sisos-api-<env>.axxis-systems.net
  var DEFAULT_API_BASE = "https://sisos-api-latest.axxis-systems.net";
  var apiBaseUrl = function () {
    var host = window.location.hostname;
    if (/^sisos-(?!api-)/.test(host)) return window.location.protocol + "//" + host.replace(/^sisos-/, "sisos-api-");
    return DEFAULT_API_BASE;
  };
  var authToken = function () {
    var token = "";
    try { token = window.localStorage.getItem("token") || ""; } catch (e) { token = ""; }
    token = token.trim();
    if (token.charAt(0) === "\"") {
      try { token = JSON.parse(token); } catch (e) {}
    }
    return String(token).trim().replace(/^Bearer\s*/i, "");
  };
  var Transaction = function (props) {
    var form = useLegacyForm();
    var s1 = useState(false);
    var loading = s1[0];
    var setLoading = s1[1];
    var s2 = useState([{ order: 1 }]);
    var lines = s2[0];
    var setLines = s2[1];
    var s3 = useState(false);
    var spreadsheetMode = s3[0];
    var setSpreadsheetMode = s3[1];
    var s4 = useState();
    var spreadsheet = s4[0];
    var setSpreadsheet = s4[1];
    var s5 = useState(false);
    var posting = s5[0];
    var setPosting = s5[1];
    var s6 = useState(false);
    var costCentersVisible = s6[0];
    var setCostCentersVisible = s6[1];
    var s7 = useState();
    var updatedTransaction = s7[0];
    var setUpdatedTransaction = s7[1];
    var s8 = useState(false);
    var auditAdjustment = s8[0];
    var setAuditAdjustment = s8[1];
    var s9 = useState(true);
    var autoCalc = s9[0];
    var setAutoCalc = s9[1];
    var s10 = useState(false);
    var reversing = s10[0];
    var setReversing = s10[1];
    var s11 = useState(null);
    var reversedBy = s11[0];
    var setReversedBy = s11[1];
    var s12 = useState(1);
    var linePage = s12[0];
    var setLinePage = s12[1];
    var s13 = useState(true);
    var allLoaded = s13[0];
    var setAllLoaded = s13[1];
    var s14 = useState(0);
    var lineCount = s14[0];
    var setLineCount = s14[1];
    var s15 = useState(null);
    var serverTotals = s15[0];
    var setServerTotals = s15[1];
    var s16 = useState(false);
    var linesLoading = s16[0];
    var setLinesLoading = s16[1];
    var allLoadedRef = useRef(true);
    var requestSeq = useRef(0);
    var entryGen = useRef(0);
    var pendingEdits = useRef(new Map());
    var fullLoad = useRef(null);
    var s17 = useState(false);
    var entryProtection = s17[0];
    var setEntryProtection = s17[1];
    var s18 = useState(false);
    var generating = s18[0];
    var setGenerating = s18[1];
    var s19 = useState(false);
    var periodClosed = s19[0];
    var setPeriodClosed = s19[1];
    var entryId = form.getFieldsValue().id;

    useEffect(function () {
      setLinePage(1);
      if (props.selected) {
        form.setFieldsValue(props.selected);
        if (props.selected.id) {
          resetEntry(false, []);
          setSpreadsheetMode(false);
          setLineCount(0);
          setServerTotals(null);
          loadLinePage(1, props.selected.id);
        } else resetEntry(true, props.selected.Lines || []);
      } else {
        onNew();
        if (props.auditAdjustment) {
          setAuditAdjustment(true);
          var lastDayOfPreviousYear = setDate().subtract(1, "years").endOf("year");
          lastDayOfPreviousYear.set({ hour: 12, minute: 0, second: 0, millisecond: 0 });
          form.setFieldsValue({ code: "AUDIT-ADJUSTMENT", effectiveDate: lastDayOfPreviousYear });
        }
      }
    }, [props.selected]);
    useEffect(function () {
      if (props.selected && props.selected.id) {
        exe("RepoTransaction", { operation: "GET", filter: "reversalOfId=" + props.selected.id }).then(function (r) {
          setReversedBy(r.ok && r.outData.length ? r.outData[0].id : null);
        });
      } else {
        setReversedBy(null);
      }
    }, [props.selected]);
    useEffect(function () {
      getConfigProfile().then(function (p) { setEntryProtection(safeGetRaw(["Accounting", "entryProtection"], p, false) === true); });
    }, []);
    // GLOB-1362: a saved entry whose posting date falls in a closed accounting month (Closure.status <> 0,
    // for all organizations or for the entry's one) cannot be modified. Checked against the stored date.
    useEffect(function () {
      var current = form.getFieldsValue();
      var d = !current.id || !current.effectiveDate ? null : setDate(current.effectiveDate);
      if (!d || !d.isValid()) {
        setPeriodClosed(false);
        return;
      }
      var id = current.id;
      exe("DoQuery", { sql: "SELECT organizationId FROM Closure WHERE status<>0 AND year=" + d.year() + " AND month=" + (d.month() + 1) }).then(function (r) {
        if (form.getFieldsValue().id !== id) return;
        var closures = r.ok && r.outData ? r.outData : [];
        setPeriodClosed(closures.some(function (c) { return c.organizationId == null || c.organizationId === current.organizationId; }));
      });
    }, [entryId, updatedTransaction]);
    var denyIfLocked = function () {
      if (locked) message.error(lockReason);
      return locked;
    };
    // The form can be stale (entry posted from another session): ask the server before writing.
    var assertNotPosted = function (id) {
      if (!id) return Promise.resolve(true);
      return exe("DoQuery", { sql: "SELECT status FROM [Transaction] WHERE id=" + Number(id) }).then(function (r) {
        if (r.ok && r.outData && r.outData.length && r.outData[0].status === 1) {
          message.error(t(MSG_POSTED));
          return false;
        }
        return true;
      });
    };

    var resetEntry = function (full, entryLines) {
      requestSeq.current++;
      entryGen.current++;
      pendingEdits.current = new Map();
      fullLoad.current = null;
      allLoadedRef.current = full;
      setAllLoaded(full);
      setLinesLoading(false);
      setLines(entryLines);
    };
    var loadLinePage = function (p, id, refreshHeader) {
      var seq = ++requestSeq.current;
      setLinesLoading(true);
      return exe("RepoTransaction", { operation: "GET", filter: "id=" + id, include: PAGE_INCLUDE, linesSize: LINES_PAGE_SIZE, linesPage: p - 1, lineTotals: true }).then(function (r) {
        if (seq !== requestSeq.current) return;
        setLinesLoading(false);
        if (!r.ok || !r.outData || !r.outData.length) {
          message.error(r.ok ? t("Transaction not found") : r.msg);
          return;
        }
        var record = r.outData[0];
        var entryTotals = r.outDataAux && r.outDataAux.lineTotals && r.outDataAux.lineTotals[0];
        if (refreshHeader) {
          form.setFieldsValue(record);
          setUpdatedTransaction(record);
        }
        if (!entryTotals) {
          allLoadedRef.current = true;
          setAllLoaded(true);
          setLines((record.Lines || []).sort(byOrder));
          setLinePage(p);
          return;
        }
        var lastPage = Math.max(1, Math.ceil(entryTotals.count / LINES_PAGE_SIZE));
        if (!record.Lines.length && p > lastPage) return loadLinePage(lastPage, id, refreshHeader);
        setLineCount(entryTotals.count);
        setServerTotals(entryTotals);
        setLines(record.Lines);
        setLinePage(p);
      });
    };
    var onLinePageChange = function (p) {
      if (allLoadedRef.current) setLinePage(p);
      else if (fullLoad.current) fullLoad.current.then(function (entryLines) { if (entryLines) setLinePage(p); });
      else loadLinePage(p, values.id);
    };
    var ensureAllLines = function () {
      if (allLoadedRef.current) return Promise.resolve(lines);
      if (!fullLoad.current) {
        var seq = ++requestSeq.current;
        setLinesLoading(true);
        fullLoad.current = exe("RepoTransaction", { operation: "GET", filter: "id=" + values.id, include: FULL_INCLUDE }).then(function (r) {
          if (seq !== requestSeq.current) return null;
          fullLoad.current = null;
          setLinesLoading(false);
          if (!r.ok || !r.outData || !r.outData.length) {
            message.error(r.ok ? t("Transaction not found") : r.msg);
            return null;
          }
          var entryLines = r.outData[0].Lines.map(function (p) { return pendingEdits.current.get(p.id) || p; });
          pendingEdits.current = new Map();
          allLoadedRef.current = true;
          setAllLoaded(true);
          setLines(entryLines);
          return entryLines;
        });
      }
      return fullLoad.current;
    };
    var addLine = function () {
      if (denyIfLocked()) return;
      ensureAllLines().then(function (entryLines) {
        if (!entryLines) return;
        setLines(entryLines.concat([{ order: entryLines.length + 1 }]));
        setLinePage(Math.ceil((entryLines.length + 1) / LINES_PAGE_SIZE));
      });
    };
    var removeLine = function (l, index, gen) {
      if (denyIfLocked()) return;
      ensureAllLines().then(function (entryLines) {
        if (!entryLines || gen !== entryGen.current) return;
        setLines(function (prev) { return prev.filter(function (p, i) { return l.id ? p.id !== l.id : i !== index; }); });
      });
    };
    var onChangeLine = function (changed, l, index, gen) {
      if (locked || gen !== entryGen.current) return;
      if (!allLoadedRef.current) {
        var edited = Object.assign({}, changed, { order: l.order });
        pendingEdits.current.set(l.id, edited);
        setLines(function (prev) { return prev.map(function (p) { return p.id === l.id ? edited : p; }); });
        ensureAllLines();
        return;
      }
      setLines(function (prev) {
        return prev.map(function (p, i) { return (l.id ? p.id === l.id : i === index) ? Object.assign({}, changed, { order: p.order }) : p; });
      });
    };
    var getTotals = function () {
      var totals = { debit: 0, credit: 0, xDebit: 0, xCredit: 0, xCurrency: "USD" };
      totals.debit = lines.filter(function (p) { return p.debit; }).reduce(function (p, c) { return p + c.debit; }, 0);
      totals.credit = lines.filter(function (p) { return p.credit; }).reduce(function (p, c) { return p + c.credit; }, 0);
      totals.xDebit = lines.filter(function (p) { return p.xDebit; }).reduce(function (p, c) { return p + c.xDebit; }, 0);
      totals.xCredit = lines.filter(function (p) { return p.xCredit; }).reduce(function (p, c) { return p + c.xCredit; }, 0);
      var withCurrency = lines.find(function (p) { return p.xCurrency !== undefined; });
      totals.xCurrency = withCurrency ? withCurrency.xCurrency : "USD";
      return totals;
    };
    var onNew = function () {
      form.resetFields();
      resetEntry(true, []);
      if (props.defaultValues) form.setFieldsValue(props.defaultValues);
    };
    var save = function () {
      if (denyIfLocked()) return;
      form.validateFields(function (err, vals) {
        if (err) return;
        ensureAllLines().then(function (entryLines) {
          if (!entryLines) return;
          if (entryLines.length == 0) {
            message.error(t("No lines inserted"));
            return;
          }
          vals.Lines = entryLines;
          vals.Lines.forEach(function (p) {
            if (p.debit == undefined) p.debit = 0;
            if (p.credit == undefined) p.credit = 0;
          });
          if (vals.Lines.some(function (p) { return !p.account; })) {
            message.error(t("All lines must have an account"));
            return;
          }
          setLoading(true);
          assertNotPosted(vals.id).then(function (editable) {
            if (!editable) {
              setLoading(false);
              return;
            }
            exe("RepoTransaction", { operation: vals.id ? "UPDATE" : "ADD", entity: vals }).then(function (r) {
              setLoading(false);
              if (r.ok) {
                message.success(r.msg);
                form.setFieldsValue(r.outData[0]);
                if (props.onAdd) props.onAdd(r.outData[0]);
                setUpdatedTransaction(r.outData[0]);
              } else {
                message.error(r.msg);
              }
            });
          });
        });
      });
    };
    var post = function (id) {
      if (denyIfLocked()) return;
      setPosting(true);
      exe("PostTransaction", { transactionId: id, auditAdjustment: auditAdjustment }).then(function (r) {
        setPosting(false);
        if (r.ok) {
          message.success(r.msg);
          form.setFieldsValue(r.outData);
        } else message.error(r.msg);
      });
    };
    var reverse = function (id) {
      setReversing(true);
      exe("ReverseTransaction", { transactionId: id, notes: values.notes }).then(function (r) {
        setReversing(false);
        if (r.ok) {
          message.success(r.msg);
          setReversedBy(r.outData && r.outData.id);
          if (props.onAdd) props.onAdd(r.outData);
        } else message.error(r.msg);
      });
    };
    var reload = function () {
      if (!values.id) return;
      if (!allLoadedRef.current) {
        pendingEdits.current = new Map();
        fullLoad.current = null;
        setLoading(true);
        loadLinePage(linePage, values.id, true).then(function () { setLoading(false); });
        return;
      }
      var seq = ++requestSeq.current;
      setLoading(true);
      exe("RepoTransaction", { operation: "GET", filter: "id=" + values.id, include: ["Lines", "Process", "Lines.CostCenters", "Lines.CostCenters.CostCenter", "Lines.Account"] }).then(function (r) {
        setLoading(false);
        if (seq !== requestSeq.current) return;
        if (r.ok) {
          form.setFieldsValue(r.outData[0]);
          setLines(r.outData[0].Lines);
          setUpdatedTransaction(r.outData[0]);
        } else message.error(r.msg);
      });
    };
    var submitEditMode = function () {
      if (denyIfLocked()) return;
      var parsedData = spreadsheet
        .getData()
        .filter(function (p) { return p[0] !== "" && p[1] !== ""; })
        .map(function (p) {
          return {
            order: +p[0],
            account: p[1],
            comments: p[2],
            debit: p[3] ? parseFloat(p[3]) : 0,
            credit: p[4] ? parseFloat(p[4]) : 0,
            xDebit: SHOW_FOREIGN_AMOUNT_COLUMNS && p[5] ? parseFloat(p[5]) : undefined,
            xCredit: SHOW_FOREIGN_AMOUNT_COLUMNS && p[6] ? parseFloat(p[6]) : undefined,
            // Same column order as the EditGrid data/columns below.
            xChangeRate: p[SHOW_FOREIGN_AMOUNT_COLUMNS ? 7 : 5] ? parseFloat(p[SHOW_FOREIGN_AMOUNT_COLUMNS ? 7 : 5]) : undefined,
            xCurrency: p[SHOW_FOREIGN_AMOUNT_COLUMNS ? 8 : 6],
            auxId: p[SHOW_FOREIGN_AMOUNT_COLUMNS ? 9 : 7],
            id: p[SHOW_FOREIGN_AMOUNT_COLUMNS ? 10 : 8]
          };
        });
      if (parsedData.length === 0) {
        message.error(t("No data detected"));
      } else {
        setLines(parsedData);
        setSpreadsheetMode(false);
      }
    };
    var setTableStyle = function (records, instance) {
      var styleObj = {};
      for (var i = 0; i < records; i++) {
        styleObj["B" + (i + 1)] = "font-weight:bold;text-align:left";
        styleObj["C" + (i + 1)] = "text-align:left";
      }
      instance.setStyle(styleObj);
    };
    var clone = function () {
      ensureAllLines().then(function (entryLines) {
        if (!entryLines) return;
        // A copy (e.g. recurring depreciation) starts as a new manual draft dated today.
        var copy = Object.assign({}, values, {
          id: 0,
          status: 0,
          manual: true,
          uniqueKey: undefined,
          user: undefined,
          date: setDate(),
          effectiveDate: setDate()
        });
        // Detach children so saving the copy never touches the original's records.
        var detach = function (items) {
          return (items || []).map(function (c) { return Object.assign({}, c, { id: 0, transactionLineId: undefined }); });
        };
        copy.Lines = entryLines.map(function (p) {
          return Object.assign({}, p, { id: 0, transactionId: undefined, CostCenters: detach(p.CostCenters), Auxiliaries: detach(p.Auxiliaries) });
        });
        form.setFieldsValue(copy);
        setLines(copy.Lines);
        message.success(t("Record cloned"));
      });
    };
    var generateDocument = function () {
      // Open the tab during the click so the browser does not block it as a popup.
      var docWindow = null;
      try { docWindow = window.open("about:blank", "_blank"); } catch (e) { docWindow = null; }
      if (!docWindow) {
        message.error(t("The browser blocked the new tab. Allow pop-ups to open the document."));
        return;
      }
      var fail = function (msg) {
        setGenerating(false);
        try { docWindow.close(); } catch (e) {}
        message.error(msg || t("Document could not be generated"));
      };
      setGenerating(true);
      ensureAllLines().then(function (entryLines) {
        if (!entryLines) return fail();
        var codes = entryLines.map(function (l) { return l.account; }).filter(Boolean);
        var accountFilter = codes.length ? "code IN (" + codes.map(function (c) { return "'" + String(c).replace(/'/g, "''") + "'"; }).join(",") + ")" : "1=0";
        return exe("RepoCatalogAccount", { operation: "GET", filter: accountFilter, size: codes.length || 1 }).then(function (ra) {
          var accountNames = {};
          if (ra && ra.ok && Array.isArray(ra.outData)) ra.outData.forEach(function (a) { accountNames[a.code] = a.name; });
          return buildAndPrint(entryLines, accountNames);
        });
      }).catch(function () { fail(); });

      var buildAndPrint = function (entryLines, accountNames) {
        var currency = values.baseCurrency || props.defaultCurrency;
        // Plain amounts (no symbol), same as the legacy printed format: 1,234.56
        var amount = function (v) { return Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
        // Dates follow the user's time zone (browser's when none is set), like the rest of the view.
        var entryDate = values.effectiveDate || values.date;
        var entryMoment = entryDate ? setDate(entryDate) : null;
        var now = branchMoment(moment.utc().format());
        var statusText = values.status === 1 ? t("Posted") : values.status === -1 ? t("Rejected") : t("Draft");
        var docLines = entryLines.slice().sort(byOrder).map(function (l) {
          return {
            Codigo: l.account || "",
            Cuenta: accountNames[l.account] || (l.Account && l.Account.name) || "",
            Concepto: l.comments || "",
            Debe: amount(l.debit),
            Haber: amount(l.credit)
          };
        });
        var totalDebit = entryLines.reduce(function (s, l) { return s + (l.debit || 0); }, 0);
        var totalCredit = entryLines.reduce(function (s, l) { return s + (l.credit || 0); }, 0);
        var data = {
          Id: values.id,
          AnioMes: entryMoment ? entryMoment.format("YYYYMM") : "",
          FechaImpresion: now.format("DD/MM/YYYY"),
          HoraImpresion: now.format("HH:mm:ss"),
          Fecha: entryMoment ? entryMoment.format("DD/MM/YYYY") : "",
          Moneda: currency || "",
          TipoOperacion: values.operationCode || "",
          Auditoria: values.code === "AUDIT-ADJUSTMENT" ? "S" : "N",
          Estado: statusText,
          Codigo: values.code || "",
          Concepto: values.description || "",
          Lineas: docLines,
          TotalDebe: amount(totalDebit),
          TotalHaber: amount(totalCredit)
        };
        return exe("GenerateDoc", { template: DOCUMENT_TEMPLATE, data: data, async: false }).then(function (r) {
          var route = r && r.outData && r.outData.url;
          if (!r || !r.ok || !route) return fail(r && r.msg);
          // GenerateDoc returns a path on the API file proxy; it needs the user's token.
          return window.fetch(apiBaseUrl() + "/proxy" + route, { headers: { Authorization: "Bearer " + authToken() } }).then(function (res) {
            if (!res.ok) throw new Error("download");
            return res.blob();
          }).then(function (blob) {
            setGenerating(false);
            docWindow.location.href = URL.createObjectURL(blob);
          });
        });
      };
    };
    var revert = function () {
      if (denyIfLocked()) return;
      ensureAllLines().then(function (entryLines) {
        if (!entryLines) return;
        var copy = Object.assign({}, values, { id: 0 });
        copy.Lines = entryLines.map(function (p) { return Object.assign({}, p, { id: 0, debit: p.credit, credit: p.debit, xDebit: p.xCredit, xCredit: p.xDebit }); });
        form.setFieldsValue(copy);
        setLines(copy.Lines);
        message.success(t("Record reverted"));
      });
    };

    var field = form.field;
    var values = form.getFieldsValue();
    var gen = entryGen.current;
    // GLOB-1362: posted entries and entries of a closed accounting month are read-only, manual or not.
    // Unsaved copies (id 0, e.g. after Clone) stay editable.
    var posted = !!values.id && values.status === 1;
    var locked = posted || (!!values.id && periodClosed);
    var lockReason = t(posted ? MSG_POSTED : MSG_PERIOD_CLOSED);
    var analyticsLocked = locked || (entryProtection && !!values.id && values.status === 1);
    var shownLines = lines || [];
    var lineTotal = allLoaded ? shownLines.length : lineCount;
    var pageCount = Math.max(1, Math.ceil(lineTotal / LINES_PAGE_SIZE));
    var currentLinePage = Math.min(linePage, pageCount);
    var pageOffset = allLoaded ? (currentLinePage - 1) * LINES_PAGE_SIZE : 0;
    var pageLines = allLoaded ? shownLines.slice(pageOffset, pageOffset + LINES_PAGE_SIZE) : shownLines;
    var totals = allLoaded || !serverTotals ? getTotals() : Object.assign({}, serverTotals, { xDebit: serverTotals.xDebit || 0, xCredit: serverTotals.xCredit || 0 });
    var baseCurrency = values.baseCurrency || props.defaultCurrency;
    var hidden = function (name) {
      field(name);
      return null;
    };
    var cu = currentUser();
    var org = userOrg();
    return (
      <div>
        <div className="tx-toolbar">
          <Button className="tx-action" icon={<Ico type="reload" />} onClick={function () { reload(); }}>{t("Reload")}</Button>
          <Button className="tx-action" icon={<Ico type="file" />} onClick={function () { onNew(); }}>{t("New")}</Button>
          <Button type="primary" className="tx-action" icon={<Ico type="save" />} onClick={function () { save(); }} loading={loading} disabled={!values.manual || locked}>{t("Save")}</Button>
          <Button type="primary" className="tx-action" icon={<Ico type="enter" />} onClick={function () { post(values.id); }} loading={posting} disabled={!values.id || locked}>{t("Post")}</Button>
          <Popconfirm title={t("This will create and post an offsetting entry dated today. Continue?")} onConfirm={function () { reverse(values.id); }} disabled={!values.id || values.status !== 1 || !!reversedBy}>
            <Button className="tx-action tx-danger" icon={<Ico type="rollback" />} loading={reversing} disabled={!values.id || values.status !== 1 || !!reversedBy}>{t("Reverse")}</Button>
          </Popconfirm>
          <Button className="tx-action tx-success" icon={<Ico type="transaction" />} onClick={function () { revert(); }} disabled={!values.id || locked}>{t("Revert to draft")}</Button>
          <Button type="primary" className="tx-action" icon={<Ico type="copy" />} onClick={function () { clone(); }} disabled={!values.id}>{t("Clone")}</Button>
          <Button className="tx-action tx-report" icon={<Ico type="file-pdf" />} onClick={function () { generateDocument(); }} loading={generating} disabled={!values.id || !values.manual}>{t("Generate document")}</Button>
        </div>
        {locked && (
          <div className="tx-link-bar">
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Ico type="warning" />{lockReason}</span>
          </div>
        )}
        {(values.reversalOfId || reversedBy) && (
          <div className="tx-link-bar">
            {values.reversalOfId && (
              <span style={{ display: "flex", alignItems: "center" }}>
                {t("Reverses")}{":\u00a0"}<a style={{ cursor: "pointer" }} onClick={function () { if (props.onOpenById) props.onOpenById(values.reversalOfId); }}>#{values.reversalOfId}</a>
              </span>
            )}
            {reversedBy && (
              <span style={{ display: "flex", alignItems: "center" }}>
                {t("Reversed by")}{":\u00a0"}<a style={{ cursor: "pointer" }} onClick={function () { if (props.onOpenById) props.onOpenById(reversedBy); }}>#{reversedBy}</a>
              </span>
            )}
          </div>
        )}
        <Section text={t("Main")} className="tx-section-main">
          <LegacyForm style={{ marginBottom: 4 }}>
            {/* Rows follow the requested order: Transaccion before Codigo, Codigo with Unique Key, Estado with Operacion. */}
            <div style={{ display: "flex" }}>
              <LegacyItem form={form} name="date" label={t("Creation Date")} style={{ flex: "0 0 171px" }}>
                {field("date", { initialValue: setDate(), getValueProps: function (v) { return { value: typeof v === "string" ? setDate(v) : v }; } })(<DatePickerW disabled style={{ width: "100%" }} />)}
              </LegacyItem>
              <LegacyItem form={form} name="templateCode" label={t("Transaction")} style={{ marginLeft: 5, flex: "0 1 300px", minWidth: 0 }}>
                {field("templateCode")(<Input readOnly />)}
              </LegacyItem>
              <LegacyItem form={form} name="code" label={t("Code")} style={{ marginLeft: 5, flex: "0 1 300px", minWidth: 0 }}>
                {field("code")(<Input readOnly={auditAdjustment || locked} />)}
              </LegacyItem>
              <LegacyItem form={form} name="uniqueKey" label={t("Unique Key")} style={{ marginLeft: 5, flex: "0 1 300px", minWidth: 0 }}>
                {field("uniqueKey")(<Input readOnly />)}
              </LegacyItem>
              <LegacyItem form={form} name="description" label={t("Description")} style={{ flex: "1 1 220px", minWidth: 160, marginLeft: 5 }}>
                {field("description")(<Input readOnly={locked} />)}
              </LegacyItem>
              <div style={{ display: "flex", flex: "0 1 300px", minWidth: 0 }}>
                <LegacyItem form={form} name="manual" label={t("Manual")} style={{ marginLeft: 5 }}>
                  {field("manual", { valuePropName: "checked", initialValue: true })(<Switch disabled />)}
                </LegacyItem>
                <LegacyItem form={form} name="id" label={t("ID")} style={{ marginLeft: 5 }}>
                  {field("id")(<InputNumber readOnly />)}
                </LegacyItem>
              </div>
            </div>
            <div style={{ display: "flex" }}>
              <LegacyItem form={form} name="effectiveDate" label={t("Posting Date")} style={{ flex: "0 0 171px" }}>
                {field("effectiveDate")(<DatePickerW disabled={auditAdjustment || locked} style={{ width: "100%" }} />)}
              </LegacyItem>
              <LegacyItem form={form} name="status" label={t("Status")} style={{ marginLeft: 5, flex: "0 1 300px", minWidth: 0 }}>
                {field("status", { initialValue: 0, rules: [{ required: true }] })(<TransactionStatusSelect disabled />)}
              </LegacyItem>
              <LegacyItem form={form} name="operationCode" label={t("Operation")} style={{ marginLeft: 5, flex: "0 1 300px", minWidth: 0 }}>
                {field("operationCode")(<Input readOnly />)}
              </LegacyItem>
              <LegacyItem form={form} name="reference" label={t("Reference")} style={{ marginLeft: 5, flex: "0 1 300px", minWidth: 0 }}>
                {field("reference")(<Input readOnly={locked} />)}
              </LegacyItem>
              <LegacyItem form={form} name="notes" label={t("Notes")} style={{ marginLeft: 5, flex: "1 1 220px", minWidth: 160 }}>
                {field("notes")(<Input readOnly={locked} />)}
              </LegacyItem>
              <div style={{ display: "flex", flex: "0 1 300px", minWidth: 0 }}>
                <LegacyItem form={form} name="entity" label={t("Entity")} style={{ marginLeft: 5, flex: 1 }}>
                  {field("entity")(<Input readOnly />)}
                </LegacyItem>
                <LegacyItem form={form} name="entityId" label={t("Entity ID")} style={{ marginLeft: 5 }}>
                  {field("entityId")(<InputNumber readOnly />)}
                </LegacyItem>
              </div>
            </div>
            <div style={{ display: "flex" }}>
              <LegacyItem form={form} name="user" label={t("User")} style={{ flex: "0 0 171px" }}>
                {field("user")(<Input readOnly />)}
              </LegacyItem>
              <LegacyItem form={form} name="organizationId" label={t("Organization")} style={{ marginLeft: 5, flex: "0 1 293px", minWidth: 0 }}>
                {field("organizationId", { initialValue: org ? org.id : undefined })(<OrganizationSelect style={{ width: "100%" }} memberOf={cu ? cu.Organizations : undefined} disabled={locked} />)}
              </LegacyItem>
              <LegacyItem form={form} name="baseCurrency" label={t("Base Currency")} style={{ marginLeft: 5, flex: "0 1 293px", minWidth: 0 }}>
                {field("baseCurrency", { initialValue: org ? org.defaultCurrency : undefined })(<Currency style={{ width: "100%" }} disabled={locked} />)}
              </LegacyItem>
              {hidden("processId")}
              {hidden("Process")}
              <LegacyItem label={t("Workflow")} style={{ marginLeft: 5, flex: "0 1 300px", minWidth: 0 }}>
                <Status process={values.Process} color={getColor(values.Process && values.Process.entityState)} reload={function () { reload(); }} />
              </LegacyItem>
            </div>
          </LegacyForm>
        </Section>
        <Section text={t("Accounting Entries")}>
          {spreadsheetMode && (
            <div>
              <div className="tx-toolbar-light">
                <Button className="tx-action" icon={<Ico type="left" />} onClick={function () { setSpreadsheetMode(false); }}>{t("Back")}</Button>
                <Button type="primary" className="tx-action" icon={<Ico type="enter" />} onClick={function () { submitEditMode(); }}>{t("Submit")}</Button>
              </div>
              <EditGrid
                instance={function (inst) {
                  setSpreadsheet(inst);
                  setTableStyle(lines.length, inst);
                }}
                data={lines.map(function (p) {
                  return [p.order, p.account, p.comments, p.debit, p.credit]
                    .concat(SHOW_FOREIGN_AMOUNT_COLUMNS ? [p.xDebit, p.xCredit] : [])
                    .concat([p.xChangeRate, p.xCurrency, p.auxId, p.id]);
                })}
                columns={[
                  { title: t("Line"), width: 50 },
                  { title: t("Account"), width: 260 },
                  { title: t("Concept"), width: 260 },
                  { title: t("Debit"), width: 100 },
                  { title: t("Credit"), width: 100 },
                  SHOW_FOREIGN_AMOUNT_COLUMNS && { title: t("X Debit"), width: 100 },
                  SHOW_FOREIGN_AMOUNT_COLUMNS && { title: t("X Credit"), width: 100 },
                  { title: t("Exchange Rate"), width: 100 },
                  { title: t("Currency"), width: 100 },
                  { title: t("Aux"), width: 100 },
                  { title: t("Line Id"), width: 100 }
                ].filter(Boolean)}
                showFileImport
              />
            </div>
          )}
          {!spreadsheetMode && (
            <div>
              <div className="tx-toolbar-light">
                {SHOW_LINE_EXTRAS && (
                  <Button className="tx-action" icon={<Ico type="deployment-unit" />} onClick={function () { ensureAllLines().then(function (entryLines) { if (entryLines) setCostCentersVisible(true); }); }}>
                    {t("Cost Centers")}
                  </Button>
                )}
                <Button className="tx-action" icon={<Ico type="plus-circle" />} onClick={function () { addLine(); }} disabled={locked}>{t("Add Line")}</Button>
                {SHOW_FOREIGN_AMOUNT_COLUMNS && <Tooltip title={t("Automatically fetch exchange rate and calculate debit/credit from foreign amounts")}>
                  <Checkbox checked={autoCalc} disabled={locked} onChange={function (e) { setAutoCalc(e.target.checked); }}>{t("Auto FX")}</Checkbox>
                </Tooltip>}
              </div>
              {lineTotal > 0 && (
                <div className="tx-lines-head" style={{ display: "flex" }}>
                  <div style={{ flex: "0 0 55px", fontWeight: 600, minWidth: 55, marginRight: 5 }}>{t("Line")}</div>
                  <div style={{ flex: "0 0 347px", fontWeight: 600, maxWidth: 347, minWidth: 200, marginRight: 5 }}>{t("Account")}</div>
                  <div style={{ flex: "0 0 370px", maxWidth: 370, minWidth: 200, fontWeight: 600, marginRight: 25 }}>{t("Concept")}</div>
                  <div style={{ flex: "0 0 200px", fontWeight: 600, maxWidth: 200, minWidth: 0, marginRight: 5, textAlign: "right" }}>{t("Debit")}</div>
                  <div style={{ flex: "0 0 200px", fontWeight: 600, maxWidth: 200, minWidth: 0, marginRight: 5, textAlign: "right" }}>{t("Credit")}</div>
                  {SHOW_FOREIGN_AMOUNT_COLUMNS && <div style={{ flex: 1, fontWeight: 600, maxWidth: 200, marginRight: 5, whiteSpace: "nowrap" }}>{t("X Debit")}</div>}
                  {SHOW_FOREIGN_AMOUNT_COLUMNS && <div style={{ flex: 1, fontWeight: 600, maxWidth: 200, marginRight: 5, whiteSpace: "nowrap" }}>{t("X Credit")}</div>}
                  <div style={{ flex: "0 1 100px", fontWeight: 600, maxWidth: 100, minWidth: 0, marginRight: 5, whiteSpace: "nowrap" }}>{t("Exchange Rate")}</div>
                  <div style={{ width: 32 }}></div>
                  <div style={{ flex: "0 1 200px", fontWeight: 600, maxWidth: 200, minWidth: 0, marginRight: 5, whiteSpace: "nowrap" }}>{t("Aux")}</div>
                  <div style={{ width: 24 }}></div>
                </div>
              )}
              <Spin spinning={linesLoading}>
                {pageLines.map(function (l, i) {
                  var index = pageOffset + i;
                  return (
                    <span style={{ display: "flex" }} key={l.id ? "id-" + l.id : "new-" + index}>
                      <TransactionLine
                        value={l}
                        onChange={function (changedLine) { onChangeLine(changedLine, l, index, gen); }}
                        defaultCurrency={baseCurrency}
                        postingDate={values.effectiveDate}
                        autoCalc={autoCalc && !(values.id && values.status === 1)}
                        readOnly={analyticsLocked}
                        locked={locked}
                      />
                      {!locked && <Ico type="minus-circle" style={{ marginLeft: 5, cursor: "pointer", fontSize: 24, color: "#999", alignSelf: "center" }} onClick={function () { removeLine(l, index, gen); }} />}
                      {locked && <span style={{ width: 29 }} />}
                    </span>
                  );
                })}
              </Spin>
              {lineTotal > 0 && (
                <div style={{ display: "flex", marginTop: 10 }}>
                  <div style={{ flex: 1, fontWeight: 600, maxWidth: 55, minWidth: 55, marginRight: 5 }} />
                  <div style={{ flex: 1, fontWeight: 600, maxWidth: 400, minWidth: 200, marginRight: 5 }} />
                  <div style={{ flex: "1 1 280px", minWidth: 200, fontWeight: 600, marginRight: 7 }}></div>
                  <div style={{ flex: 1, color: "darkgrey", maxWidth: 200, marginRight: 5 }}><Money style={{ backgroundColor: "white", border: "none" }} disabled value={totals.debit} currency={baseCurrency} /></div>
                  <div style={{ flex: 1, color: "darkgrey", maxWidth: 200, marginRight: 5 }}><Money style={{ backgroundColor: "white", border: "none" }} disabled value={totals.credit} currency={baseCurrency} /></div>
                  {SHOW_FOREIGN_AMOUNT_COLUMNS && <div style={{ flex: 1, color: "darkgrey", maxWidth: 200, marginRight: 5 }}><Money style={{ backgroundColor: "white", border: "none" }} disabled value={totals.xDebit} currency={totals.xCurrency} /></div>}
                  {SHOW_FOREIGN_AMOUNT_COLUMNS && <div style={{ flex: 1, color: "darkgrey", maxWidth: 200, marginRight: 5 }}><Money style={{ backgroundColor: "white", border: "none" }} disabled value={totals.xCredit} currency={totals.xCurrency} /></div>}
                  <div style={{ flex: 1, fontWeight: 600, maxWidth: 100, marginRight: 5 }} />
                  <div style={{ width: 32 }}></div>
                  <div style={{ flex: 1, fontWeight: 600, maxWidth: 200, marginRight: 5, whiteSpace: "nowrap" }}></div>
                  <div style={{ width: 24 }}></div>
                </div>
              )}
              {lineTotal > 0 && (
                <Pagination size="small" style={{ marginTop: 10 }} current={currentLinePage} pageSize={LINES_PAGE_SIZE} total={lineTotal} onChange={onLinePageChange} showSizeChanger={false} showTotal={function (total) { return "Total " + total + " items"; }} />
              )}
            </div>
          )}
        </Section>
        {SHOW_LINE_EXTRAS && <CostCenters
          visible={costCentersVisible}
          transaction={allLoaded ? Object.assign({}, updatedTransaction || props.selected || {}, { Lines: lines }) : null}
          onCancel={function () { setCostCentersVisible(false); }}
          onOk={function () { setCostCentersVisible(false); }}
          reload={function () { reload(); }}
          readOnly={analyticsLocked}
        />}
      </div>
    );
  };

  /* ---------- Accounting/TransactionsFilter (cajon de filtros) ---------- */
  var dateRange = function (m, unit) {
    unit = unit || "day";
    return orgDateOn("Transaction", "date")
      ? [m.clone().startOf(unit).format("YYYY-MM-DD HH:mm:ss"), m.clone().endOf(unit).format("YYYY-MM-DD HH:mm:ss")]
      : pickerRangeUtc(m, unit);
  };
  var TransactionsFilter = function (props) {
    var form = useLegacyForm();
    var s1 = useState(null);
    var matches = s1[0];
    var setMatches = s1[1];
    useEffect(function () {
      if (props.filter) form.setFieldsValue(props.filter);
      var hash = window.location.hash;
      if (hash.indexOf("?date=") >= 0) {
        form.setFieldsValue({ date: moment(hash.split("?date=")[1]) });
        submit();
      }
      if (hash.indexOf("?id=") >= 0) {
        form.setFieldsValue({ id: hash.split("?id=")[1] });
        submit();
      }
      if (hash.indexOf("?account=") >= 0) {
        form.setFieldsValue({ account: hash.split("?account=")[1] });
        submit();
      }
    }, []);
    // pageSize is a dependency so "N / page" reloads the grid with the new size.
    useEffect(function () { submit(); }, [props.pagination.current, props.pagination.pageSize, props.reload]);
    var field = form.field;
    var submit = function () {
      form.validateFields(function (err, values) {
        if (err) return;
        var queries = [];
        var r1;
        if (values.date) {
          r1 = dateRange(values.date);
          queries.push("date BETWEEN '" + r1[0] + "' AND '" + r1[1] + "'");
        }
        if (values.month) {
          r1 = dateRange(values.month, "month");
          queries.push("date BETWEEN '" + r1[0] + "' AND '" + r1[1] + "'");
        }
        if (values.code) queries.push("code='" + values.code + "'");
        if (values.reference) queries.push("reference LIKE '%" + values.reference + "%'");
        if (values.uniqueKey) queries.push("uniqueKey LIKE '%" + values.uniqueKey + "%'");
        if (values.operationCode) queries.push("operationCode=" + values.operationCode);
        if (values.status !== undefined) queries.push("status=" + values.status);
        if (values.id !== undefined) queries.push("id=" + values.id);
        if (values.user !== undefined) queries.push("[user]='" + values.user + "'");
        if (values.template !== undefined) queries.push("[templateCode]='" + values.template + "'");
        if (values.account !== undefined) queries.push("id in (SELECT transactionId FROM TransactionLine WHERE account='" + values.account + "')");
        if (values.range) queries.push("date between '" + dateRange(values.range[0])[0] + "' and  '" + dateRange(values.range[1])[1] + "'");
        var filterQuery = queries.join(" AND ");
        exe("RepoTransaction", { operation: "GET", filter: filterQuery, include: ["Process"], lineTotals: true, size: props.pagination.pageSize, page: props.pagination.current - 1 }).then(function (r) {
          var lineTotals = (r.outDataAux && r.outDataAux.lineTotals) || [];
          if (r.ok && r.outData) {
            r.outData.forEach(function (p) {
              var entryTotals = lineTotals.find(function (q) { return q.transactionId === p.id; });
              if (entryTotals) p.amount = entryTotals.debit;
            });
          }
          props.onResults(r);
          setMatches(r.total);
        });
      });
    };
    return (
      <div>
        <Drawer className="tx-drawer" title={t("Transaction Filter")} placement="right" width={512} onClose={props.onClose} visible={props.visible}>
          <div style={{ marginBottom: "15px", marginTop: "-15px" }}>
            <Button icon={<Ico type="undo" />} size="small" onClick={function () { form.resetFields(); }}>{t("Reset")}</Button>
          </div>
          <LegacyForm layout="vertical">
            <LegacyItem form={form} name="id" label={t("Transaction ID")}>{field("id")(<InputNumber />)}</LegacyItem>
            <div style={{ display: "flex" }}>
              <LegacyItem form={form} name="date" label={t("Specific Day")} className="flexGrow">{field("date")(<DatePickerW style={{ width: "100%" }} />)}</LegacyItem>
              <LegacyItem form={form} name="month" label={t("Month")} className="flexGrow" style={{ marginLeft: 5 }}>
                {field("month")(<DatePicker.MonthPicker style={{ width: "100%" }} />)}
              </LegacyItem>
            </div>
            <LegacyItem form={form} name="range" label={t("Date Range")}>{field("range")(<DatePicker.RangePicker />)}</LegacyItem>
            <LegacyItem form={form} name="template" label={t("Transaction")} style={{ width: "100%" }}>{field("template")(<TransactionTemplateSelect />)}</LegacyItem>
            <div style={{ display: "flex" }}>
              <LegacyItem form={form} name="code" label={t("Code")} className="flexGrow" style={{ flex: 1, minWidth: 0 }}>{field("code")(<Input placeholder={t("Transaction code")} />)}</LegacyItem>
              <LegacyItem form={form} name="uniqueKey" label={t("Unique Key")} className="flexGrow" style={{ flex: 1, minWidth: 0, marginLeft: 5 }}>{field("uniqueKey")(<Input placeholder={t("Unique key")} />)}</LegacyItem>
            </div>
            <LegacyItem form={form} name="reference" label={t("Reference")}>{field("reference")(<Input placeholder={t("Transaction reference")} />)}</LegacyItem>
            <div style={{ display: "flex" }}>
            <LegacyItem form={form} name="status" label={t("Status")} className="flexGrow" style={{ flex: 1, minWidth: 0 }}>
              {field("status")(
                <Select style={{ width: "100%" }} allowClear>
                  <Select.Option value={0}>
                    <Badge status="error" />
                    {t("Draft")}
                  </Select.Option>
                  <Select.Option value={1}>
                    <Badge status="success" />
                    {t("Posted")}
                  </Select.Option>
                </Select>
              )}
            </LegacyItem>
            <LegacyItem form={form} name="operationCode" label={t("Operation Code")} className="flexGrow" style={{ flex: 1, minWidth: 0, marginLeft: 5 }}>{field("operationCode")(<InputNumber style={{ width: "100%" }} />)}</LegacyItem>
            </div>
            <LegacyItem form={form} name="account" label={t("Affected Account")} style={{ width: "100%" }}>{field("account")(<AccountSelectDetail style={{ width: "100%" }} />)}</LegacyItem>
            <LegacyItem form={form} name="user" label={t("User")} style={{ width: "100%" }}>{field("user")(<UserSelect />)}</LegacyItem>
          </LegacyForm>
          <Button type="primary" icon={<Ico type="search" />} onClick={function () { submit(); }}>{t("Search")}</Button>
          {matches !== null && (
            <div style={{ marginTop: 15 }}>
              <Tag>{matches}</Tag> {t("Results")}
            </div>
          )}
        </Drawer>
      </div>
    );
  };

  /* ---------- Accounting/Transactions (pantalla) ---------- */
  var Transactions = function () {
    var defaultCurrency = safeGet(["Main", "defaultCurrency"], window.global && window.global.configProfile, "USD");
    var s1 = useState([]);
    var data = s1[0];
    var setData = s1[1];
    var s2 = useState();
    var selected = s2[0];
    var setSelected = s2[1];
    var s3 = useState("list");
    var activeTab = s3[0];
    var setActiveTab = s3[1];
    var s4 = useState(false);
    var filterVisible = s4[0];
    var setFilterVisible = s4[1];
    var s5 = useState([]);
    var setCurrencies = s5[1];
    var s6 = useState({ pageSize: 20, current: 1, total: 0, showTotal: function (total) { return "Total " + total + " items"; } });
    var pagination = s6[0];
    var setPagination = s6[1];
    var s7 = useState(0);
    var reload = s7[0];
    var doReload = s7[1];
    var s8 = useState(false);
    var auditAdjustment = s8[0];
    var setAuditAdjustment = s8[1];
    var s9 = useState();
    var defaultValues = s9[0];
    var setDefaultValues = s9[1];
    var s10 = useState(false);
    var loading = s10[0];
    var setLoading = s10[1];
    var s11 = useState([]);
    var selectedRowKeys = s11[0];
    var setSelectedRowKeys = s11[1];
    useEffect(function () {
      loadCurrencies();
      loadDefaultValues();
    }, []);
    var loadDefaultValues = function () {
      getConfigProfile().then(function (profile) {
        var dv = safeGetRaw(["Accounting", "defaultTransactionValues"], profile, undefined);
        if (dv) setDefaultValues(dv);
      });
    };
    var loadCurrencies = function () {
      getCache("RepoCurrency").then(function (r) { if (r.ok) setCurrencies(r.outData); });
    };
    var load = function () {
      setLoading(true);
      doReload(function (c) { return c + 1; });
    };
    var onTransactionAdded = function () { load(); };
    var onOpenTransaction = function (rec) {
      setSelected(rec);
      setActiveTab("transaction");
    };
    var onOpenById = function (id) {
      exe("RepoTransaction", { operation: "GET", filter: "id=" + id, include: ["Process"] }).then(function (r) {
        if (r.ok && r.outData.length) {
          setSelected(r.outData[0]);
          setActiveTab("transaction");
        } else message.error(t("Transaction not found"));
      });
    };
    var onNewTransaction = function () {
      setAuditAdjustment(false);
      setSelected(null);
      setActiveTab("transaction");
    };
    var onDelete = function (record) {
      setData(data.filter(function (p) { return p.id !== record.id; }));
      setActiveTab("list");
    };
    var onFilterResults = function (r) {
      setData(r.outData);
      setPagination(Object.assign({}, pagination, { total: r.total, current: pagination.total !== r.total ? 1 : pagination.current }));
      setLoading(false);
    };
    var getStatusColumn = function (status) {
      switch (status) {
        case 0:
          return <span><Badge status="warning" />{t("Draft")}</span>;
        case 1:
          return <span><Badge status="success" />{t("Posted")}</span>;
        case -1:
          return <span><Badge status="error" />{t("Rejected")}</span>;
      }
    };
    var handleMenuClick = function (e) {
      if (e.key === "audit") {
        setAuditAdjustment(true);
        setSelected(null);
        setActiveTab("transaction");
      }
    };
    var toggleRowSelection = function (record) {
      setSelectedRowKeys(function (keys) {
        var key = record.id;
        return keys.indexOf(key) >= 0 ? [] : [key];
      });
    };
    return (
      <div className="tx-shell">
        <style>{TX_CSS}</style>
        <div className="tx-card">
          <div className="tx-head">
            <div className="tx-title"><span className="tx-title-mark" aria-hidden="true" />{t("Transactions")}</div>
            <Button type="primary" className="tx-action" icon={<Ico type="filter" />} onClick={function () { setFilterVisible(true); }}>
              {t("Filter")}
            </Button>
          </div>
          <div className="tx-body">
          <Tabs className="tx-tabs" activeKey={activeTab} onChange={function (k) { setActiveTab(k); }}>
            <Tabs.TabPane tab={t("Transaction List")} key="list">
              <div className="tx-pane-list">
              <div className="tx-toolbar">
                <Dropdown.Button
                  className="tx-action"
                  icon={<Ico type="down" />}
                  onClick={onNewTransaction}
                  overlay={
                    <Menu onClick={handleMenuClick}>
                      <Menu.Item key="audit">
                        <Ico type="tool" />
                        {t("Audit Adjustment")}
                      </Menu.Item>
                    </Menu>
                  }>
                  <Ico type="file" />
                  {t("New Transaction")}
                </Dropdown.Button>
                <Button className="tx-action" icon={<Ico type="reload" />} onClick={function () { load(); }}>
                  {t("Reload")}
                </Button>
              </div>
              <div className="tx-grid">
              <Table
                dataSource={data}
                rowKey="id"
                loading={loading}
                size="small"
                tableLayout="fixed"
                pagination={pagination}
                onChange={function (pag) { setPagination(pag); }}
                rowClassName={function (record) { return selectedRowKeys.indexOf(record.id) >= 0 ? "tx-row-selected" : ""; }}
                onRow={function (record) {
                  return { onClick: function () { toggleRowSelection(record); } };
                }}>
                <Table.Column title={t("ID")} dataIndex="id" align="center" />
                <Table.Column title={t("Created")} dataIndex="date" width={150} render={formatPanamaDateTime} />
                <Table.Column title={t("Code")} dataIndex="code" align="center" />
                <Table.Column title={t("Ref")} dataIndex="reference" />
                <Table.Column title={t("Unique Key")} dataIndex="uniqueKey" />
                <Table.Column title={t("Operation")} dataIndex="operationCode" align="center" />
                <Table.Column title={t("Description")} dataIndex="description" width={420} render={function (v) {
                  var textValue = v === null || v === undefined ? "" : String(v);
                  return <Tooltip title={textValue}><span className="tx-description-cell">{textValue}</span></Tooltip>;
                }} />
                <Table.Column title={t("Amount")} dataIndex="amount" align="right" render={renderAmount} />
                <Table.Column title={t("Status")} dataIndex="status" align="center" render={function (v) { return getStatusColumn(v); }} />
                <Table.Column title={t("Manual")} dataIndex="manual" align="center" render={function (v) { return <Checkbox checked={v} />; }} />
                <Table.Column
                  title={t("Actions")}
                  key="actions"
                  render={function (v, r) {
                    return (
                      <div>
                        <Button
                          type="link"
                          icon={<Ico type="folder-open" />}
                          onClick={function (e) {
                            if (e && e.stopPropagation) e.stopPropagation();
                            setLoading(true);
                            setTimeout(function () {
                              onOpenById(r.id);
                              setLoading(false);
                            }, 50);
                          }}>
                          {t("Open")}
                        </Button>
                      </div>
                    );
                  }}
                />
              </Table>
              </div>
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab={t("Transaction")} key="transaction">
              <div className="tx-pane-scroll">
                <Transaction onAdd={onTransactionAdded} selected={selected} defaultCurrency={defaultCurrency} onDelete={onDelete} auditAdjustment={auditAdjustment} defaultValues={defaultValues} onOpenById={onOpenById} />
              </div>
            </Tabs.TabPane>
          </Tabs>
          </div>
        </div>
        <TransactionsFilter visible={filterVisible} onClose={function () { setFilterVisible(false); }} onResults={function (r) { onFilterResults(r); }} pagination={pagination} reload={reload} />
      </div>
    );
  };

  return Transactions;
})()
