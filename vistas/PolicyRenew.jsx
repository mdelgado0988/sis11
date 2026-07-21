() => {
    const { Form, Select, DatePicker, Input, Row, Col, Card, Collapse, Button, Space, Table, Tabs,  Layout , InputNumber, Radio, Divider,Empty,Tag, Tooltip, 
           notification, Popover, Modal, Spin, Skeleton, Progress, Badge, Dropdown, Menu } = A;
    const { Panel} = Collapse;
    const { Option } = Select;
    const { TabPane } = Tabs;
    const { Content } = Layout;
    const SearchOutlined = ()=><span role='img' aria-label='undo' class='anticon anticon-undo'><svg viewBox='64 64 896 896' focusable='false' data-icon='undo' width='1em' height='1em' fill='currentColor' aria-hidden='true'><path d='M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z'></path></svg></span>
    const FileAddOutlined = ()=><span role='img' aria-label='undo' class='anticon anticon-undo'><svg viewBox='64 64 896 896' focusable='false' data-icon='undo' width='1em' height='1em' fill='currentColor' aria-hidden='true'><path d='M400 317.7h73.9V656c0 4.4 3.6 8 8 8h60c4.4 0 8-3.6 8-8V317.7H624c6.7 0 10.4-7.7 6.3-12.9L518.3 163a8 8 0 00-12.6 0l-112 141.7c-4.1 5.3-.4 13 6.3 13zM878 626h-60c-4.4 0-8 3.6-8 8v154H214V634c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v198c0 17.7 14.3 32 32 32h684c17.7 0 32-14.3 32-32V634c0-4.4-3.6-8-8-8z'></path></svg></span>
    const ClearOutlined = ()=><span role='img' aria-label='undo' class='anticon anticon-undo'><svg viewBox='64 64 896 896' focusable='false' data-icon='undo' width='1em' height='1em' fill='currentColor' aria-hidden='true'><path d='M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z'></path></svg></span>
    const SafetyCertificateOutlined = ()=><span role='img' aria-label='undo' class='anticon anticon-undo'><svg viewBox='64 64 896 896' focusable='false' data-icon='undo' width='1em' height='1em' fill='currentColor' aria-hidden='true'><path d='M400 317.7h73.9V656c0 4.4 3.6 8 8 8h60c4.4 0 8-3.6 8-8V317.7H624c6.7 0 10.4-7.7 6.3-12.9L518.3 163a8 8 0 00-12.6 0l-112 141.7c-4.1 5.3-.4 13 6.3 13zM878 626h-60c-4.4 0-8 3.6-8 8v154H214V634c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v198c0 17.7 14.3 32 32 32h684c17.7 0 32-14.3 32-32V634c0-4.4-3.6-8-8-8z'></path></svg></span>
    const ArrowLeftOutlined = ()=><span role='img' aria-label='undo' class='anticon anticon-undo'><svg viewBox='64 64 896 896' focusable='false' data-icon='undo' width='1em' height='1em' fill='currentColor' aria-hidden='true'><path d='M400 317.7h73.9V656c0 4.4 3.6 8 8 8h60c4.4 0 8-3.6 8-8V317.7H624c6.7 0 10.4-7.7 6.3-12.9L518.3 163a8 8 0 00-12.6 0l-112 141.7c-4.1 5.3-.4 13 6.3 13zM878 626h-60c-4.4 0-8 3.6-8 8v154H214V634c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v198c0 17.7 14.3 32 32 32h684c17.7 0 32-14.3 32-32V634c0-4.4-3.6-8-8-8z'></path></svg></span>
    const FileProtectOutlined = ()=><span role='img' aria-label='undo' class='anticon anticon-undo'><svg viewBox='64 64 896 896' focusable='false' data-icon='undo' width='1em' height='1em' fill='currentColor' aria-hidden='true'><path d='M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z'></path></svg></span>
    const SolutionOutlined = ()=><span role='img' aria-label='undo' class='anticon anticon-undo'><svg viewBox='64 64 896 896' focusable='false' data-icon='undo' width='1em' height='1em' fill='currentColor' aria-hidden='true'><path d='M400 317.7h73.9V656c0 4.4 3.6 8 8 8h60c4.4 0 8-3.6 8-8V317.7H624c6.7 0 10.4-7.7 6.3-12.9L518.3 163a8 8 0 00-12.6 0l-112 141.7c-4.1 5.3-.4 13 6.3 13zM878 626h-60c-4.4 0-8 3.6-8 8v154H214V634c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v198c0 17.7 14.3 32 32 32h684c17.7 0 32-14.3 32-32V634c0-4.4-3.6-8-8-8z'></path></svg></span>
    const FileSearchOutlined = ()=><span role='img' aria-label='undo' class='anticon anticon-undo'><svg viewBox='64 64 896 896' focusable='false' data-icon='undo' width='1em' height='1em' fill='currentColor' aria-hidden='true'><path d='M400 317.7h73.9V656c0 4.4 3.6 8 8 8h60c4.4 0 8-3.6 8-8V317.7H624c6.7 0 10.4-7.7 6.3-12.9L518.3 163a8 8 0 00-12.6 0l-112 141.7c-4.1 5.3-.4 13 6.3 13zM878 626h-60c-4.4 0-8 3.6-8 8v154H214V634c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v198c0 17.7 14.3 32 32 32h684c17.7 0 32-14.3 32-32V634c0-4.4-3.6-8-8-8z'></path></svg></span>
    const ReloadOutlined = ()=><span role='img' aria-label='undo' class='anticon anticon-undo'><svg viewBox='64 64 896 896' focusable='false' data-icon='undo' width='1em' height='1em' fill='currentColor' aria-hidden='true'><path d='M909.1 209.3l-56.4 44.1C775.8 155.1 656.2 92 521.9 92 290 92 102.3 279.5 102 511.5 101.7 743.7 289.8 932 521.9 932c181.3 0 335.8-115 394.6-276.1 1.5-4.2-.7-8.9-4.9-10.3l-56.7-19.5a8 8 0 00-10.1 4.8c-1.8 5-3.8 10-5.9 14.9-17.3 41-42.1 77.8-73.7 109.4A344.77 344.77 0 01655.9 829c-42.3 17.9-87.4 27-133.8 27-46.5 0-91.5-9.1-133.8-27A341.5 341.5 0 01279 755.2a342.16 342.16 0 01-73.7-109.4c-17.9-42.4-27-87.4-27-133.9s9.1-91.5 27-133.9c17.3-41 42.1-77.8 73.7-109.4 31.6-31.6 68.4-56.4 109.3-73.8 42.3-17.9 87.4-27 133.8-27 46.5 0 91.5 9.1 133.8 27a341.5 341.5 0 01109.3 73.8c9.9 9.9 19.2 20.4 27.8 31.4l-60.2 47a8 8 0 003 14.1l175.6 43c5 1.2 9.9-2.6 9.9-7.7l.8-180.9c-.1-6.6-7.8-10.3-13-6.2z'></path></svg></span>
    const CaretRightOutlined = ()=><span role='img' aria-label='undo' class='anticon anticon-undo'><svg viewBox='0 0 1024 1024' focusable='false' data-icon='caret-right' width='1em' height='1em' fill='currentColor' aria-hidden='true'><path d='M715.8 493.5L335 165.1c-14.2-12.2-35-1.2-35 18.5v656.8c0 19.7 20.8 30.7 35 18.5l380.8-328.4c10.9-9.4 10.9-27.6 0-37z'></path></svg></span>
    const EyeOutlined = () => <span role="img" aria-label="eye" className="anticon anticon-eye"><svg viewBox="64 64 896 896" focusable="false" data-icon="eye" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M942.2 486.2C847.4 286.5 704.1 186 512 186S176.6 286.5 81.8 486.2a60.7 60.7 0 000 51.6C176.6 737.5 319.9 838 512 838s335.4-100.5 430.2-300.2a60.7 60.7 0 000-51.6zM512 726c-119.4 0-227.2-65.6-305.3-177C284.8 437.6 392.6 372 512 372s227.2 65.6 305.3 177C739.2 660.4 631.4 726 512 726z"></path><path d="M512 422c-69 0-125 56-125 125s56 125 125 125 125-56 125-125-56-125-125-125z"></path></svg></span>;
    const DeleteOutlined = () => <span role="img" aria-label="delete" className="anticon anticon-delete"><svg viewBox="64 64 896 896" focusable="false" data-icon="delete" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M360 184h304v64H360z"></path><path d="M880 184H144c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h72l32 640c0 35.3 28.7 64 64 64h320c35.3 0 64-28.7 64-64l32-640h72c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM400 816h-64V384h64v432zm144 0h-64V384h64v432zm144 0h-64V384h64v432z"></path></svg></span>;
    const PlusOutlined = () => <span role="img" aria-label="plus" className="anticon anticon-plus"><svg viewBox="64 64 896 896" focusable="false" data-icon="plus" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M482 152h60c4.4 0 8 3.6 8 8v312h312c4.4 0 8 3.6 8 8v60c0 4.4-3.6 8-8 8H550v312c0 4.4-3.6 8-8 8h-60c-4.4 0-8-3.6-8-8V550H160c-4.4 0-8-3.6-8-8v-60c0-4.4 3.6-8 8-8h312V160c0-4.4 3.6-8 8-8z"></path></svg></span>;
    const CalculatorOutlined = () => (
      <span role="img" aria-label="calculator" className="anticon anticon-calculator">
        <svg viewBox="64 64 896 896" focusable="false" data-icon="calculator" width="1em" height="1em" fill="currentColor" aria-hidden="true">
          <path d="M744 64H280c-35.3 0-64 28.7-64 64v768c0 35.3 28.7 64 64 64h464c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64zm0 832H280V128h464v768z"></path>
          <path d="M328 176h368v128H328zM336 368h80v80h-80zm136 0h80v80h-80zm136 0h80v80h-80zM336 504h80v80h-80zm136 0h80v80h-80zm136 0h80v80h-80zM336 640h80v80h-80zm136 0h80v80h-80zm136 0h80v216h-80zM336 776h216v80H336z"></path>
        </svg>
      </span>
    );

    const MoreOutlined = () => (
      <span role="img" aria-label="more" className="anticon anticon-more">
        <svg viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill="currentColor">
          <path d="M456 512a56 56 0 10112 0 56 56 0 10-112 0zm0-224a56 56 0 10112 0 56 56 0 10-112 0zm0 448a56 56 0 10112 0 56 56 0 10-112 0z"></path>
        </svg>
      </span>
    );
    const BackIcon = () => (
      <span role="img" aria-label="arrow-left" className="anticon anticon-arrow-left">
        <svg viewBox="64 64 896 896" focusable="false" data-icon="arrow-left" width="1em" height="1em" fill="currentColor" aria-hidden="true">
          <path d="M869 491H291.3l219.5-219.5c3.1-3.1 3.1-8.2 0-11.3l-45.3-45.3a8 8 0 00-11.3 0L156.7 507.4a8 8 0 000 11.3l297.5 297.5a8 8 0 0011.3 0l45.3-45.3c3.1-3.1 3.1-8.2 0-11.3L291.3 533H869c4.4 0 8-3.6 8-8v-26c0-4.4-3.6-8-8-8z"></path>
        </svg>
      </span>
    );

    const NextIcon = () => (
      <span role="img" aria-label="arrow-right" className="anticon anticon-arrow-right">
        <svg viewBox="64 64 896 896" focusable="false" data-icon="arrow-right" width="1em" height="1em" fill="currentColor" aria-hidden="true">
          <path d="M869 506.7L571.5 209.2a8 8 0 00-11.3 0l-45.3 45.3a8 8 0 000 11.3L734.4 485H156c-4.4 0-8 3.6-8 8v26c0 4.4 3.6 8 8 8h578.4L514.9 747.2a8 8 0 000 11.3l45.3 45.3a8 8 0 0011.3 0L869 506.7a8 8 0 000-11.3z"></path>
        </svg>
      </span>
    );

    const ArrowDown = () => (
      <span role="img" aria-label="down" className="anticon anticon-down">
        <svg viewBox="64 64 896 896" focusable="false" data-icon="down" width="1em" height="1em" fill="currentColor" aria-hidden="true">
          <path d="M884 256h-75c-5.1 0-9.9 2.5-12.9 6.7L512 652 228.9 262.7a16 16 0 00-12.9-6.7H140c-6.5 0-10.3 7.4-6.5 12.7l364 496.9a16 16 0 0025.8 0l364-496.9c3.8-5.3 0-12.7-6.5-12.7z"></path>
        </svg>
      </span>
    );

    const WarningIcon = () => (
      <span role="img" aria-label="exclamation-circle" className="anticon anticon-exclamation-circle">
        <svg viewBox="64 64 896 896" focusable="false" data-icon="exclamation-circle" width="1em" height="1em" fill="currentColor" aria-hidden="true">
          <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372S306.6 140 512 140s372 166.6 372 372-166.6 372-372 372zm-32-232h64v64h-64zm0-384h64v256h-64z"></path>
        </svg>
      </span>
    );

    const renderDate = (value) => {
        if(!value) return ' - ';
        return new Date(value).toLocaleDateString('es-ES');
    }

    //uso de scroll estático
    useEffect(() => {
      const style = document.createElement("style");
      style.innerHTML = `
        /* Fuerza que el scrollbar horizontal siempre esté reservado */
        .renovacion-view .ant-table-body {
          overflow-x: scroll !important;
          overflow-y: scroll !important;
          scrollbar-color: #b7b7b7 #f5f5f5;
        }

        .renovacion-view .ant-table-body::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }

        .renovacion-view .ant-table-body::-webkit-scrollbar-thumb {
          background: #b7b7b7;
          border-radius: 6px;
        }

        .renovacion-view .ant-table-body::-webkit-scrollbar-track {
          background: #f5f5f5;
        }

        .renovacion-warning-button {
          background-color: #fa8c16 !important;
          border-color: #fa8c16 !important;
        }

        .renovacion-warning-button:hover,
        .renovacion-warning-button:focus {
          background-color: #ffa940 !important;
          border-color: #ffa940 !important;
        }

        .renovacion-warning-button:active {
          background-color: #d46b08 !important;
          border-color: #d46b08 !important;
        }

        .policy-renew-action-group {
          display: inline-flex;
          vertical-align: middle;
          margin-right: 12px;
          border: 1px solid #d9d9d9;
          border-radius: 2px;
          box-shadow: none;
          overflow: hidden;
        }

        .policy-renew-action-group > .ant-btn,
        .policy-renew-action-group .ant-dropdown-button > .ant-btn {
          height: 36px;
          border: 0;
          border-right: 1px solid #d9d9d9;
          border-radius: 0;
          background: #fff;
          color: #262626;
          box-shadow: none;
        }

        .policy-renew-action-group > .ant-btn:last-child,
        .policy-renew-action-group .ant-dropdown-button > .ant-btn:last-child {
          border-right: 0;
        }

        .policy-renew-action-group > .ant-btn:hover,
        .policy-renew-action-group .ant-dropdown-button > .ant-btn:hover {
          color: #1677ff;
          background: #f5faff;
          box-shadow: inset 0 0 0 1px #1677ff;
          position: relative;
          z-index: 1;
        }

        .policy-renew-action-group .policy-renew-quote-button,
        .policy-renew-action-group .policy-renew-quote-button:hover,
        .policy-renew-action-group .policy-renew-quote-button:focus {
          border-right-color: #389e0d;
          background: #389e0d;
          color: #fff;
        }

        .policy-renew-action-group .policy-renew-quote-button:hover,
        .policy-renew-action-group .policy-renew-quote-button:focus {
          background: #237804;
          box-shadow: inset 0 0 0 1px #135200;
        }

        .policy-renew-action-group .policy-renew-button,
        .policy-renew-action-group .policy-renew-button:hover,
        .policy-renew-action-group .policy-renew-button:focus {
          background: #1677ff;
          border-right-color: #0958d9;
          color: #fff;
        }
        
        .fila-no-renovar td {
          color: red;
          text-decoration: line-through;
        }

        .fila-en-proceso-renovacion td {
          background-color: #fff7e6 !important;
          color: #ad4e00;
        }
        
      `;
      document.head.appendChild(style);
      return () => document.head.removeChild(style);
    }, []);
    
    const FilterSection = ({ form}) => {
        //const [form] = Form.useForm();
        const ramo = Form.useWatch('ramo', form);
        const [ramos,setRamos] = useState([]);
        const [productos,setProductos] = useState([]);
        const [productosList,setProductosList] = useState([]);
        const [sucursales, setSucursales] = useState([]);
        const [loadingPolicy, setLoadingPolicy ] = useState(false);
        const [polizas, setPolizas] = useState([]);
        const [ filterType, setFilterType ] = useState(0);
        let timeout;

        const gridConfig = {
            xs: 24, // 1 columna en móviles
            sm: 12, // 2 columnas en tablets pequeñas
            md: 8,  // 3 columnas en tablets/laptops
            lg: 8,  // 4 columnas en desktops
            xl: 8,
        };

        useEffect(() => {
            loadCatalogs();
        }, []);

        useEffect(() => {
            if (!ramo) { 
                form.setFieldsValue({plan: undefined}); 
                setProductos((productosList || []).map(item => ({value: item.value, label: item.label})));
            }
        }, [ramo]);


        const loadCatalogs = () => {
            exe("RepoLob",{ operation: "GET"})
                .then(({ outData: result}) => {
                    const listRamos = result.map(item => ({value: item.code, label: item.name}));
                    setRamos(listRamos);
                })            
            exe("DoQuery",{ sql: 'SELECT [code],[name],[lobCode] FROM Product'})
                .then(GetProducts => {
                    const result = GetProducts.outData || [];
                    const resProduct = result.map(item => ({value: item.code, label: item.name, lob: item.lobCode}))
                    setProductosList(resProduct);
                    setProductos(resProduct.map(item => ({value: item.value, label: item.label})));
                })
            exe("RepoBranch",{ operation: "GET"})
                .then(({ outData: result}) => {
                    const sucursales = result.map(item => ({value: item.code, label: item.name}));
                    setSucursales(sucursales);
            })    
        }

        const handleLobChange = (value) =>{
            form.setFieldsValue({ramo:value, plan: undefined});
            if(value){
                setProductos((productosList || [])
                    .filter(item => item.lob === value)
                    .map(item => ({value: item.value, label: item.label})))
            }
        }

        const FetchPolicyValues =( newValue, callback )=>{
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            currentValue = newValue;
            const filterPolizas =()=>{
                const searchValue = String(newValue || '').trim();
                const numericValue = Number(searchValue);
                const filter = filterType == 0
                    ? `pol.[code] like N'%${escapeSqlString(searchValue)}%'`
                    : (Number.isInteger(numericValue) && numericValue > 0
                        ? `pol.[id] = ${numericValue}`
                        : '1 = 0');
                const orderBy = filterType == 0 ? 'code' : 'id';
                setLoadingPolicy(true);
                exe('DoQuery', {
                sql: `SELECT TOP 25 pol.[id],pol.[code]
                        FROM LifePolicy pol
                        WHERE pol.activeDate is not null AND ${ filter }
                        ORDER BY pol.[${orderBy}];`})
                .then( GetPolicy => {
                    const policyOptions = GetPolicy.outData.map( item => ({ value: item.id, label: item.code }));
                    setPolizas(policyOptions);
                }).catch( error => message.error(error))
                .finally(()=> {
                    setLoadingPolicy(false)
                    if(typeof callback ==='function')
                        callback();
                })
            }
            timeout = setTimeout(filterPolizas, 400);
          }

        const escapeSqlString = (value) => String(value || '').replace(/'/g, "''");
         


        return (
            <Collapse defaultActiveKey={['1']} ghost>
            <Panel header="Filtros" key="1" style={{ fontWeight: 600 }}>
                <Card size="small" bordered={false} bodyStyle={{ padding: '10px 0' }}>
                <Form
                    form={form}
                    name="advanced_search"
                    className="ant-advanced-search-form"
                    //onFinish={handleFinish}
                    layout="vertical" // Layout vertical funciona mejor en responsivo
                >
                    <Row gutter={[16, 0]}> {/* Gutter horizontal 16px, vertical 0 */}
                    <Col {...gridConfig}>
                        <Form.Item name="ramo" label="Ramo">
                            <Select
                                    //value={ramoValue}
                                    placeholder="Seleccione"
                                    onChange={handleLobChange}
                                    optionFilterProp='label'
                                    showSearch
                                    allowClear
                                    options={ramos}
                            />
                        </Form.Item>
                    </Col>
                    <Col {...gridConfig}>
                        <Form.Item name="plan" label="Producto">
                            <Select
                                    //value={productoValue}
                                    placeholder="Seleccione"
                                    optionFilterProp='label'
                                    showSearch
                                    allowClear
                                    options={productos}
                            />
                        </Form.Item>
                    </Col>
                    <Col {...gridConfig}>
                        <Form.Item name="sucursal" label="Sucursal">
                            <Select
                                    //value={sucur}
                                    placeholder="Seleccione"
                                    optionFilterProp='label'
                                    showSearch
                                    allowClear
                                    options={sucursales}
                            />
                        </Form.Item>
                    </Col>

                    <Col {...gridConfig}>
                        <Form.Item name="venceDesde" label="Vence Desde">
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                        </Form.Item>
                    </Col>
                    <Col {...gridConfig}>
                        <Form.Item name="venceHasta" label="Vence Hasta">
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                        </Form.Item>
                    </Col>
                    <Col {...gridConfig}>
                        <Form.Item name="venceEn" label="Vence en">
                            <InputNumber
                                min={0}
                                precision={0}  
                                controls={false}
                                placeholder="0"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>

                    <Col {...gridConfig}>
                        <Form.Item name="tipoPoliza" label="Tipo de Póliza">
                            <Select placeholder="Seleccione" allowClear >
                                <Option value="I">Póliza individual</Option>
                                <Option value="G">Poliza de grupo</Option>
                                <Option value="C">Certificado</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col {...gridConfig}>
                        <Form.Item name="noPoliza" label="No. de Póliza">
                            <Select
                                allowClear
                                showSearch
                                placeHolder={ t('Type policy to search')}
                                style={{ width: '100%' }}
                                //value={ form.doc }
                                //onChange={ handleSelect }
                                notFoundContent={ <Empty />}
                                loading={ loadingPolicy }
                                defaultActiveFirstOption={ false }
                                onSearch={ FetchPolicyValues }
                                options={ polizas }
                                filterOption={ false }
                                dropdownRender={ menu =>(<>
                                    { menu }
                                    <Divider />
                                    <Radio.Group onChange={ e => setFilterType(e.target.value)} value={ filterType } style={{ paddingLeft: 10 }}>
                                        <Radio value={ 0 }> Codigo </Radio>
                                        <Radio value={ 1 }> Id</Radio>                  
                                    </Radio.Group>
                                </>
                                )}
                            />
                        </Form.Item>
                    </Col>
                    {/*<Col {...gridConfig}>
                        <Form.Item name="estadoRenovacion" label="Estado de Renovación">
                        <Select placeholder="No-Especificado" allowClear>
                            <Option value="PEND">Pendiente</Option>
                        </Select>
                        </Form.Item>
                    </Col>*/}
                    </Row>
                </Form>
                </Card>
            </Panel>
            </Collapse>
        );
    }

    const ActionToolbar = ({ loading, onSearch, onGenerate, onClear, searchTotal = 0, tiempoEjecucion = '0 milisegundos' }) => {
        return (
            <Row style={{ marginBottom: 16, background: '#f0f2f5', padding: '8px', borderRadius: '4px' }} align="middle">
                <Col flex="auto">
                    <Space wrap> {/* 'wrap' permite que los botones bajen de línea en pantallas muy pequeñas */}
                        <Button type="primary" icon={<SearchOutlined />} loading={loading} onClick={onSearch}>
                        Buscar
                        </Button>
                        <Button icon={<FileAddOutlined />} onClick={onGenerate}>
                        Generar Lote
                        </Button>
                        <Button icon={<ClearOutlined />} onClick={onClear}>
                        Limpiar Selección
                        </Button>
                        {/*<Button icon={<SafetyCertificateOutlined />}>
                        Supervisor de Procesos
                        </Button>
                        <Button icon={<ArrowLeftOutlined />}>
                        Regresar
                        </Button>*/}
                    </Space>
                </Col>
                {/* Espacio para totales si se requiere alineado a la derecha */}
                <Col flex="none" style={{ paddingLeft: '10px', fontSize: '12px', color: '#666' }}>
                    Total Registros: {searchTotal} | Tiempo: {tiempoEjecucion}
                </Col>
            </Row>
        );
    };

    const getColorByStatus = (status) => {
        switch (status) {
        case 'Borrador':
            return 'green'; 
        case 'Pendiente':
            return 'orange';
        case 'Finalizado':
            return 'blue';
        case 'Rechazado':
            return 'red';
        default:
            return 'green';
        }
    };

    const PolicyTable = ({ data, loading, searchTotal, pagination, handleTableChange, rowSelection }) => {

        const columns = [
            { title: 'Id', dataIndex: 'codigo', width: 80, align: 'center' },
            { title: 'Póliza', dataIndex: 'poliza', width: 150, ellipsis: true },
            { title: 'Año', dataIndex: 'anio', width: 60, align: 'center' },
            { title: 'Mes', dataIndex: 'mes', width: 50, align: 'center' },
            { title: 'Ramo', dataIndex: 'ramo', width: 100, ellipsis: true },
            { title: 'Producto', dataIndex: 'plan', width: 150, ellipsis: true },
            { title: 'Estado', dataIndex: 'estado', width: 100 },
            { title: 'Tipo Póliza', dataIndex: 'tipoPoliza', width: 110 },
            { title: 'Inicia', dataIndex: 'inicia', width: 80, render: renderDate, align: 'center' },
            { title: 'Vence', dataIndex: 'vence', width: 80, render: renderDate, align: 'center' },
            { title: 'Asegurado', dataIndex: 'asegurado', width: 200, ellipsis: true },
            { title: 'Días V.', dataIndex: 'diasV', width: 80, align: 'center' },
            //{ title: 'Oferta', dataIndex: 'oferta', width: 90 },
            { title: 'Pendiente', dataIndex: 'pendiente', width: 90, align: 'right', render: (text) => Number(text).toFixed(2) },
            { title: 'Fecha Creación', dataIndex: 'fechaCreacion', width: 80, render: renderDate, align: 'center' },
            { title: 'Lote', dataIndex: 'batchId', width: 80, align: 'center'}
        ];

        return (
            <Table
            className="renovacion-view"
            rowSelection={rowSelection}
            rowClassName={(record) => {
                if (Number(record && record.batchId || 0) > 0) {
                    return 'fila-en-proceso-renovacion';
                }

                return !record.bRenovar ? 'fila-no-renovar' : '';
            }}
            columns={columns}
            dataSource={data}
            loading={loading}
            onChange={handleTableChange}
            size="small" // Para que se parezca más a la densidad de la imagen
            pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: searchTotal,
                showSizeChanger: true,
                showQuickJumper: true,
                //showTotal: (total, range) => `Mostrando ${range[0]}-${range[1]} de ${searchTotal}`,
                pageSizeOptions: ['10','25','50', '100' , '200'],
                defaultPageSize: 50
            }}
            // CLAVE PARA RESPONSIVE: Permite scroll horizontal en pantallas pequeñas
            scroll={{ x: 'max-content', y: 500 }}
            bordered
            rowKey='lifePolicyId'
            />
        );
    };
    
    const BatchTable = ({ data, loading,searchTotal,handleTableChange, handleViewDetail, reloadData, onOpenModal }) => {

        const columns = [
            { title: 'Id', dataIndex: 'id', width: 60 },
            { title: 'Nombre', dataIndex: 'name', width: 150, ellipsis: true },
            { title: 'Creacion', dataIndex: 'created', width: 80,render: renderDate },
            {
              title: 'Resultado',
              width: 130,
              align: 'left',
              render: (_, record) => {
                const correctos = Math.max(
                  Number(record.success || 0) - Number(record.skipped || 0),
                  0
                );

                return (
                  <div style={{ lineHeight: '18px', fontSize: 12 }}>
                    <div>
                      <strong>Total:</strong> {record.records}
                    </div>
                    <div>
                      <strong>Procesados:</strong> {record.processed}
                    </div>
                    <div>
                      <Tooltip title="Registros Correctos">
                        <span style={{ color: '#52c41a', cursor: 'help' }}>
                          ✅ {correctos}
                        </span>
                      </Tooltip>

                      {' | '}

                      <Tooltip title="Registros con Error">
                        <span style={{ color: '#ff4d4f', cursor: 'help' }}>
                          ❌ {record.error}
                        </span>
                      </Tooltip>

                      {' | '}

                      <Tooltip title="No Renovados">
                        <span style={{ color: '#faad14', cursor: 'help' }}>
                          🚫 {record.skipped}
                        </span>
                      </Tooltip>
                    </div>
                  </div>
                );
              }
            },
            { title: 'Progreso', dataIndex: 'processed', width: 80, ellipsis: true, align: 'center', 
             render: (_, record) => (
                <Progress
                  percent={ Math.round(((record.processed + record.skipped) / record.records) * 100) > 100 ? 100 : Math.round((record.processed + record.skipped / record.records) * 100)}
                  size="small"
                  status={record.processed + record.skipped >= record.records ? 'success' : 'active'}
                />
              )
            },
            { title: 'Usuario', dataIndex: 'user', width: 200 },
            {
              title: t('Action'),
              width: 130,
              fixed: 'right',
              align: 'center',
              render: (_, record) => {

                const { Process = {}, wfId, id } = record || {};
                const {
                  formId = 0,
                  iniciando,
                  entityState,
                  estado,
                  userActions
                } = Process;

                const actions = JSON.parse(userActions || '[]');

                const nextDisabled = record.estadoWf === 'Ejecutado';

                const workflowColor = nextDisabled
                  ? '#ff4d4f'   // rojo
                  : '#52c41a';  // verde

                const gotoStep = (direction) => {

                  if (wfId <= 0) return;

                  if (record.estadoWf === 'Ejecutado') {
                    notification.warn({
                      message: t('Closed Batch'),
                      description: t('Executed batch cannot be modified'),
                      duration: 3
                    });
                    return;
                  }

                  exe("GotoStep", {
                    procesoId: wfId,
                    estado: direction,
                    userValues: "{}",
                    isNonInterruptingEvent: false,
                    process: null
                  }).then(() => {
                    reloadData();
                  });
                };

                return (
                  <Space size={4}>

                    {/* WORKFLOW */}
                    <Popover
                      trigger="click"
                      placement="bottom"
                      content={
                        <div style={{ minWidth: 220 }}>

                          <Space
                            direction="vertical"
                            style={{ width: '100%' }}
                          >

                            <Tag
                              color={
                                entityState === 'DRAFT'
                                  ? 'blue'
                                  : entityState === 'ACTIVE'
                                  ? 'green'
                                  : 'red'
                              }
                            >
                              {estado}
                            </Tag>

                            <Button
                              block
                              size="small"
                              disabled={iniciando}
                              onClick={() => gotoStep('_previous')}
                            >
                              <BackIcon /> {t('Previous')}
                            </Button>

                            {!nextDisabled && formId <= 0 && (
                              <Button
                                block
                                type="primary"
                                size="small"
                                onClick={() => gotoStep('_next')}
                              >
                                {t('Next')} <NextIcon />
                              </Button>
                            )}

                            {formId > 0 && (
                              <Button
                                block
                                size="small"
                                onClick={() => onOpenModal(record)}
                              >
                                <WarningIcon /> {t('Required Form')}
                              </Button>
                            )}

                          </Space>

                        </div>
                      }
                    >
                      <Tooltip
                        title={`${t('Workflow')} - ${estado || t('Unknown')}`}
                      >
                        <Button
                          shape="circle"
                          size="small"
                          icon={<CaretRightOutlined />}
                          style={{
                            color: workflowColor,
                            borderColor: workflowColor
                          }}
                        />
                      </Tooltip>
                    </Popover>

                    {/* DETALLE */}
                    <Tooltip title={t('View batch detail')}>
                      <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetail(id, wfId)}
                      />
                    </Tooltip>

                    {/* MÁS OPCIONES */}
                    <Popover
                      trigger="click"
                      placement="left"
                      content={
                        <Space direction="vertical">

                          <a href={`#/activity/${wfId}`}>
                            <Button
                              block
                              size="small"
                            >
                              {t('Open workflow')}
                            </Button>
                          </a>

                          {actions.length > 0 && (
                            <div>
                              {actions.map((a, i) => (
                                <Tag key={i}>
                                  {a}
                                </Tag>
                              ))}
                            </div>
                          )}

                        </Space>
                      }
                    >
                      <Tooltip title={t('More options')}>
                        <Button
                          size="small"
                          icon={<MoreOutlined />}
                        />
                      </Tooltip>
                    </Popover>

                  </Space>
                );
              }
            }
            
        ];
              
        return (
          <div className="renovacion-view">
            <Table
            //rowSelection={rowSelection}
            columns={columns}
            dataSource={data}
            loading={loading}
            onChange={handleTableChange}
            size="small" // Para que se parezca más a la densidad de la imagen
            pagination={{
                total: searchTotal,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `Mostrando ${range[0]}-${range[1]} de ${searchTotal}`,
                pageSizeOptions: ['10','25','50'],
                defaultPageSize: 25
            }}
            // CLAVE PARA RESPONSIVE: Permite scroll horizontal en pantallas pequeñas
            scroll={{ x: 'max-content', y: 800 }}
            bordered
            rowKey='id'
            />
          </div>
        );
    };

    const TabContent1 = ({handleSearchBatch, setActiveTab}) => {
        const [loading, setLoading] = useState(false);
        // Aquí podrías manejar el estado de los datos filtrados
        const [searchTotal, setSearchTotal] = useState(0);
        const [tableData, setTableData] = useState([]);
        const [tiempoEjecucion, setTiempo] = useState('0 milisegundos');
        const [form] = Form.useForm();
        const [pagination, setPagination] = useState({ current: 1, pageSize: 50, total: 0 });        
        const [selectedRowKeys, setSelectedRowKeys] = useState([]);
        const [batchGenerationVisible, setBatchGenerationVisible] = useState(false);
        const [batchGenerationProgress, setBatchGenerationProgress] = useState(0);
        const [batchGenerationText, setBatchGenerationText] = useState('');

        const onSelectChange = (newSelectedRowKeys) => {
            console.log('selectedRowKeys changed: ', newSelectedRowKeys);
            setSelectedRowKeys(newSelectedRowKeys);
        };

        const rowSelection = {
            selectedRowKeys,
            onChange: onSelectChange,
            getCheckboxProps: (record) => ({
                disabled: record.batchId > 0 || record.bRenovar == false, 
                name: record.poliza, 
            }),
        };

        const formatDateYMD = (date) => {
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, "0");
            const dd = String(date.getDate()).padStart(2, "0");

            return `${yyyy}${mm}${dd}`;
        }

        const handleSearch = () => {
            const newPagination = { ...pagination, current: 1 };
            setPagination(newPagination);
            const params = {
                pagination: newPagination,
                loading: true,
                total: 0,
                data: tableData,
                formulario: form.getFieldsValue(),
            };
            loadDataPolizas(params);
        };

        const handleTableChange = (newPagination) => {
            setPagination(newPagination);
            const params = {
                pagination: newPagination,
                loading: true,
                data: tableData,
                formulario: form.getFieldsValue(),
            };
            loadDataPolizas(params);
        }

        const loadDataPolizas =(params = {}) => {
            setLoading(params.loading);
            const form = params.formulario || {};
            let extraParametros = "";
            const inicio = performance.now();

            if(form.noPoliza) extraParametros += `, policyId:${form.noPoliza}`;
            if(form.ramo) extraParametros += `, ramo:'${form.ramo}'`;
            if(form.plan) extraParametros += `, producto:'${form.plan}'`;
            if(form.sucursal) extraParametros += `, sucursal:'${form.sucursal}'`;
            if(form.tipoPoliza) extraParametros += `, tipoPoliza:'${form.tipoPoliza}'`;
            if(form.venceDesde) extraParametros += `, venceDesde:'${form.venceDesde.format('YYYYMMDD')}'`;
            if(form.venceHasta) extraParametros += `, venceHasta:'${form.venceHasta.format('YYYYMMDD')}'`;
            if(form.venceEn) extraParametros += `, venceEn:${form.venceEn}`;

            setSearchTotal(0);

            const context = `{row:{currentPage:${params.pagination.current}, pageSize:${params.pagination.pageSize}${extraParametros}}}`;

            exe("ExeChain",{
                chain: "cmdPolicyFilterLoteRenew",
                context: context
            })
            .then(r => {
                if( r.ok){
                    const polizaPaginada = r.outData.data;
                    const listaPoliza = [];
                    let indiceResultado = 0;

                    if (r.outData.total > 0) {
                        setSearchTotal(r.outData.total);
                        for (let index = 0; index < r.outData.total; index++) {
                            const factor = ((index + 1) / params.pagination.pageSize);
                            if (factor > (params.pagination.current - 1) && factor <= params.pagination.current && (indiceResultado < polizaPaginada.length)) {
                                listaPoliza.push(polizaPaginada[indiceResultado]);
                                indiceResultado += 1;
                            } else {
                                //listaPoliza.push({ id: ("Loading data... " + index) });
                            }
                        }
                    }

                    const fin = performance.now();
                    const duracionMs = (fin - inicio).toFixed(2);
                    setTiempo(`${duracionMs} milisegundos`);
                  
                    setTableData(listaPoliza);
                    setPagination({ ...params.pagination, total: r.total });
                } else{
                    notification.error({ message: 'Error', description: r.msg, duration: 10 });
                }
                setLoading(false);
            })

        }

        const formatDate = (date) => {
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, "0"); // Mes (0–11)
            const dd = String(date.getDate()).padStart(2, "0");

            return `${yyyy}/${mm}/${dd}`;
        }

        const appContext = {
            getTableData: function () { return tableData || []; },
            getSelectedRowKeys: function () { return selectedRowKeys || []; },
            setLoading: setLoading,
            setSelectedRowKeys: setSelectedRowKeys,
            setActiveTab: setActiveTab,
            setBatchGenerationVisible: setBatchGenerationVisible,
            setBatchGenerationProgress: setBatchGenerationProgress,
            setBatchGenerationText: setBatchGenerationText,
            handleSearch: handleSearch,
            handleSearchBatch: handleSearchBatch
        };

        const getSelectedPolicies = () => {
            return appContext.getTableData().filter(item => appContext.getSelectedRowKeys().includes(item.lifePolicyId));
        }

        const getNextPolicyVersion = (policyId) => {
            return exe('RepoLifePolicy', {
                operation: 'GET',
                filter: `id = ${policyId}`,
                fields: 'id,policyVersion'
            }).then(response => {
                if (!response || !response.ok) {
                    throw new Error(response && response.msg ? response.msg : 'No fue posible recuperar la versión actual de la póliza');
                }

                const policy = Array.isArray(response.outData) && response.outData.length > 0 ? response.outData[0] : null;
                if (!policy) {
                    throw new Error(`No se encontró la póliza ${policyId}`);
                }

                const currentVersion = Number(policy.policyVersion || 0);
                return currentVersion > 0 ? currentVersion + 1 : 1;
            });
        }

        const createPolicyOfferVersion = (policy) => {
            const policyId = Number(policy.codigo || 0);
            if (!policyId) {
                return Promise.reject(new Error(`La póliza ${policy.poliza || ''} no tiene un id válido`));
            }

            return getNextPolicyVersion(policyId)
                .then(nextVersion => exe('AddPolicyVersion', {
                    policyVersion: nextVersion,
                    code: `${policy.poliza}-${nextVersion}`,
                    policyId: policyId
                }))
                .then(response => {
                    if (!response || !response.ok) {
                        throw new Error(response && response.msg ? response.msg : `No fue posible generar la oferta de la póliza ${policy.poliza}`);
                    }

                    const newPolicyVersion = response.outData && response.outData.newPolicyVersion ? response.outData.newPolicyVersion : null;
                    const newPolicyId = newPolicyVersion ? Number(newPolicyVersion.id || 0) : 0;

                    if (!newPolicyId) {
                        throw new Error(`No se recibió el id de la oferta generada para la póliza ${policy.poliza}`);
                    }

                    setBatchGenerationText(`Actualizando vigencia de la oferta ${policy.poliza}`);

                    return exe("ExeChain", {
                        chain: "cmdUpdatePolicyRenewalPeriod",
                        context: `{ policyId: ${newPolicyId} }`
                    }).then(periodResponse => {
                        if (!periodResponse || periodResponse.ok === false) {
                            throw new Error(
                                periodResponse && periodResponse.msg
                                    ? periodResponse.msg
                                    : `No fue posible actualizar la vigencia de la oferta ${policy.poliza}`
                            );
                        }

                        return newPolicyId;
                    });
                });
        }

        async function buildBatchRowsWithOffers(policies) {
            const rows = [];
            const total = policies.length;

            for (let index = 0; index < total; index++) {
                const policy = policies[index];
                const step = index + 1;

                setBatchGenerationText(`Generando oferta ${step} de ${total}: ${policy.poliza}`);
                setBatchGenerationProgress(Math.round(((step - 1) / total) * 100));

                const offerPolicyId = await createPolicyOfferVersion(policy);
                rows.push([policy.codigo, policy.poliza, policy.codigo, "No", offerPolicyId]);

                setBatchGenerationProgress(Math.round((step / total) * 100));
            }

            return rows;
        }

        const createRenewBatch = (batchRows, records) => {
            const jData = JSON.stringify(batchRows);
            const nombreLote = `LOTE-${formatDate(new Date())}`;

            return exe('RepoBatch',{
                entity:{
                    importConfigId:64,
                    jData: jData,
                    name: nombreLote,
                    processingType:0,
                    records: records
                },
                operation:'ADD'
            });
        }

        const renameGeneratedBatch = (batch) => {
            if (!batch) {
                return Promise.resolve();
            }

            return exe('SetField',{
                entity:'Batch',
                entityId: batch.id,
                fieldValue:`[name]='${batch.name}-${batch.id}'`
            });
        }

        const markGeneratedBatchFinished = (batch) => {
            if (!batch || Number(batch.id || 0) <= 0) {
                return Promise.reject(new Error('No se recibió un lote válido para actualizar su estado'));
            }

            // The automatic renewal flow completes the batch intentionally to prevent manual execution.
            return exe('SetField', {
                entity: 'Batch',
                entityId: batch.id,
                fieldValue: "[status]='FINISHED'"
            }).then(response => {
                if (!response || response.ok === false) {
                    throw new Error(
                        response && response.msg
                            ? response.msg
                            : `No fue posible finalizar el lote ${batch.id}`
                    );
                }
            });
        }

        async function handleGenerate() {
            console.log('Generando ofertas...');            
            const selectedKeys = appContext.getSelectedRowKeys();
            if(!selectedKeys || selectedKeys.length === 0) {
                notification.warning({ message: 'Generar lote', description: 'Debe seleccionar al menos una póliza', duration: 5 });
                return;
            }

            const selectedPolicies = getSelectedPolicies();
            if (!selectedPolicies.length) {
                notification.warning({ message: 'Generar lote', description: 'No se encontraron pólizas válidas para generar el lote', duration: 5 });
                return;
            }

            setLoading(true);
            setBatchGenerationVisible(true);
            setBatchGenerationProgress(0);
            setBatchGenerationText('Preparando generación de ofertas...');

            try {
                const batchRows = await buildBatchRowsWithOffers(selectedPolicies);
                setBatchGenerationText('Creando lote de renovación...');

                const RepoBatch = await createRenewBatch(batchRows, selectedPolicies.length);
                if(!RepoBatch || !RepoBatch.ok) {
                    throw new Error(RepoBatch && RepoBatch.msg ? RepoBatch.msg : 'No fue posible crear el lote');
                }

                const batch = Array.isArray(RepoBatch.outData) && RepoBatch.outData.length > 0 ? RepoBatch.outData[0] : null;
                if (!batch) {
                    throw new Error('No se recibió la información del lote generado');
                }

                await renameGeneratedBatch(batch);
                await markGeneratedBatchFinished(batch);
                setBatchGenerationProgress(100);
                setBatchGenerationText(`Lote ${batch.id} generado correctamente`);

                setSelectedRowKeys([]);
                setActiveTab("2");
                notification.info({ message: 'Lote generado', description: `Se ha creado el lote ${batch.id}`, duration: 10 });
                handleSearchBatch();
                handleSearch();
            } catch (error) {
                notification.error({ message: 'Error', description: error && error.message ? error.message : String(error), duration: 10 });
            } finally {
                setLoading(false);
                setTimeout(() => {
                    setBatchGenerationVisible(false);
                    setBatchGenerationProgress(0);
                    setBatchGenerationText('');
                }, 700);
            }
        };

        const handleClearSelection = () => {
            console.log('Limpiando selección...');
            // Lógica para limpiar la selección de la tabla
          setSelectedRowKeys([]);
        };

        return (
            <div style={{ padding: '20px', backgroundColor: '#fff' }}>
            {/* 1. Sección de Filtros Reutilizable */}
            <FilterSection form={form}/>

            <div style={{ marginTop: '20px' }}>
                {/* 2. Barra de Herramientas Reutilizable */}
                <ActionToolbar
                    loading={loading}
                    onSearch={handleSearch}
                    onGenerate={handleGenerate}
                    onClear={handleClearSelection}
                    searchTotal={searchTotal}
                    tiempoEjecucion={tiempoEjecucion}
                />

                {/* 3. Tabla de Datos Reutilizable */}
                <PolicyTable 
                    data={tableData} 
                    loading={loading} 
                    searchTotal={searchTotal} 
                    pagination={pagination}
                    handleTableChange={handleTableChange}
                    tiempoEjecucion={tiempoEjecucion}
                    rowSelection={rowSelection}
                />
            </div>
            <Modal
                title="Generando lote de renovación"
                open={batchGenerationVisible}
                footer={null}
                closable={false}
                maskClosable={false}
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <div>{batchGenerationText}</div>
                    <Progress percent={batchGenerationProgress} status={batchGenerationProgress >= 100 ? 'success' : 'active'} />
                </Space>
            </Modal>
            </div>
        );
    };

    const TabContent2 = ({ tableDataBatch,loadingBatch,searchTotalBatch,handleTableChangeBatch,handleSearchBatch, handleViewDetail, onOpenModal }) => {      

        return (
            <div style={{ padding: '20px', backgroundColor: '#fff' }}>
            {/* 1. Sección de Filtros Reutilizable */}
            <div style={{ marginTop: '20px' }}>
                {/* 2. Barra de Herramientas Reutilizable */}
                <div style={{ marginBottom: 16 }}>
                    <Space size="large">
                        <Button type="text" onClick={handleSearchBatch} icon={<ReloadOutlined />} style={{ color: '#1890ff' }}>
                            Actualizar
                        </Button>
                    </Space>
                </div>
                {/* 3. Tabla de Datos Reutilizable */}
                <BatchTable 
                    data={tableDataBatch} 
                    loading={loadingBatch} 
                    searchTotal={searchTotalBatch} 
                    handleTableChange={handleTableChangeBatch}
                    handleViewDetail={handleViewDetail}
                    reloadData={handleSearchBatch}
                    onOpenModal={onOpenModal}
                />
            </div>
            </div>
        );
    }

    /********************************************/
    //Tab 3 de detalle del lote
    /********************************************/

    const ActionToolbarDetail = ({ loading, processActive, processType, onCalculate, onRenew, onRefresh, onExclude, onViewResults, percent, loteId}) => {
        const quoteMenu = (
          <Menu onClick={(item) => onCalculate(item.key)}>
            <Menu.Item key="selection">Cotizar selección</Menu.Item>
            <Menu.Item key="all">Cotizar todos</Menu.Item>
          </Menu>
        );
        const renewMenu = (
          <Menu onClick={(item) => onRenew(item.key)}>
            <Menu.Item key="selection">Renovar seleccionadas</Menu.Item>
            <Menu.Item key="all">Renovar todas (pendientes)</Menu.Item>
          </Menu>
        );

        return (
          <Row
            style={{ marginBottom: 16, background: '#f0f2f5', padding: '8px', borderRadius: '4px' }}
            align="middle"
            gutter={[16, 16]}
          >
            {/* BOTONES */}
            <Col flex="auto">
              <Button.Group className="policy-renew-action-group">
                <Dropdown overlay={quoteMenu} trigger={['click']}>
                  <Button className="policy-renew-quote-button" icon={<CalculatorOutlined />} loading={loading} disabled={processActive}>
                    Cotizar <ArrowDown />
                  </Button>
                </Dropdown>
                <Dropdown overlay={renewMenu} trigger={['click']}>
                    <Button type="primary" className="policy-renew-button" icon={<PlusOutlined />} loading={loading} disabled={processActive}>
                    Renovar <ArrowDown />
                  </Button>
                </Dropdown>
                <Button icon={<DeleteOutlined />} loading={loading} onClick={onExclude}>
                  Excluir
                </Button>
                {/* Re-execution is no longer available from this toolbar.
                <Button
                  icon={<PlusOutlined />}
                  loading={loading}
                  onClick={() => {
                    Modal.confirm({
                      title: 'Generar nuevo lote',
                      content: `Se generará un nuevo lote con las pólizas marcadas como "No renovar". ¿Desea continuar?`,
                      okText: 'Sí',
                      cancelText: 'No',
                      okType: 'primary',
                      onOk() {
                        onGenerateExcluded();
                      }
                    });
                  }}
                >
                  Re-Ejecutar
                </Button> */}
                <Button
                  onClick={() => onViewResults()}
                  icon={<EyeOutlined />}
                >
                  Ver Errores
                </Button>
              </Button.Group>
        
              <Space size="middle" align="center">
                <Button
                  type="text"
                  onClick={() => onRefresh()}
                  icon={<ReloadOutlined />}
                  style={{ color: '#1890ff' }}
                >
                  Actualizar
                </Button>

                {loteId > 0 && (
                  <Badge
                    color="blue"
                    text={<strong>Lote #{loteId}</strong>}
                  />
                )}
              </Space>
            </Col>

            {/* PROGRESS BAR */}
            <Col flex="300px" style={{ marginRight: 25, paddingRight: 25 }}>
              <Progress 
                className="policy-renew-progress"
                percent={percent}
                format={(p) => `${p}% - ${p == 0 ? 'En Espera' : (p == 100 ? "Finalizado": (processType === 'issuance' ? "Emitiendo..." : "Cotizando..."))}`}
                size="small"
                status={percent === 100 ? 'success' : 'active'}  />
            </Col>

          </Row>
        );
    };

    const ResultRenewQuoteBatchTable = ({ data, loading, total, pagination, handleTableChange }) => {

        const columns = [
          { title: 'Id Proceso', dataIndex: 'idProceso', width: 120, align: 'center', render: (_, record) => record.idProceso || record.IdProceso || record.processId || record.ProcessId },
          { title: 'Poliza', dataIndex: 'poliza', width: 160, ellipsis: true, render: (_, record) => record.poliza || record.Poliza || record.policy || record.Policy },
          { title: 'Mensaje', dataIndex: 'mensaje', ellipsis: true, render: (_, record) => record.mensaje || record.Mensaje || record.message || record.Message }
        ];

        return (
          <Table
            columns={columns}
            dataSource={data}
            loading={loading}
            onChange={handleTableChange}
            size="small"
            pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `Mostrando ${range[0]}-${range[1]} de ${total}`,
                pageSizeOptions: ['10','25','50', '100' , '200']
            }}
            scroll={{ x: 'max-content', y: 500 }}
            bordered
            rowKey={(record, index) => `${record.idProceso || record.IdProceso || record.processId || 'proceso'}-${record.poliza || record.Poliza || record.policy || 'poliza'}-${index}`}
          />
        );
    };

    const ResultRenewQuoteBatchModal = ({ visible, data, loading, total, pagination, handleTableChange, onCancel }) => {
        return (
          <Modal
            title="Resultados"
            className="renovacion-view"
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={900}
            destroyOnClose
          >
            <ResultRenewQuoteBatchTable
              data={data}
              loading={loading}
              total={total}
              pagination={pagination}
              handleTableChange={handleTableChange}
            />
          </Modal>
        );
    };

    const LoteDetalleTable = ({ tableData, loading, searchTotal, handleTableChange, rowSelection, total, onViewPolicy }) => {

        const columns = [
          {
            title: 'Id Póliza',
            dataIndex: 'newLifePolicyId',
            width: 100,
            align: 'center',
            render: (value, record) => value || record.lifePolicyId || '-'
          },
          { title: 'Póliza', dataIndex: 'poliza', width: 100, ellipsis: true },
          { title: 'Producto', dataIndex: 'producto', width: 150, ellipsis: true },
          { title: 'Inicia', dataIndex: 'inicio', width: 80,  align: 'center' },
          { title: 'Vence', dataIndex: 'vence', width: 80, align: 'center' },
          { title: 'Prima Pura', dataIndex: 'prima', width: 90, align: 'right', render: (text) => Number(text).toFixed(2) },
          { title: 'Recargo', dataIndex: 'recargo', width: 90, align: 'right', render: (text) => Number(text).toFixed(2) },
          { title: 'Descuento', dataIndex: 'descuento', width: 90, align: 'right', render: (text) => Number(text).toFixed(2) },
          { title: 'Prima Bruta', dataIndex: 'primaNeta', width: 90, align: 'right', render: (text) => Number(text).toFixed(2) },
          { title: 'Impuesto', dataIndex: 'impuesto', width: 90, align: 'right', render: (text) => Number(text).toFixed(2) },
          { title: 'Gastos', dataIndex: 'gasto', width: 90, align: 'right', render: (text) => Number(text).toFixed(2) },
          { title: 'Facturado', dataIndex: 'facturado', width: 90, align: 'right', render: (text) => Number(text).toFixed(2) },
          { title: 'Pagado', dataIndex: 'pagado', width: 90, align: 'right', render: (text) => Number(text).toFixed(2) },
          { title: 'Pendiente', dataIndex: 'pendiente', width: 90, align: 'right', render: (text) => Number(text).toFixed(2) },
          { title: 'Prima Renovación', dataIndex: 'primaCotizada', width: 100, align: 'right', 
           render: (text) => (
              <Tag color='green'>
                {Number(text).toFixed(2)}
              </Tag>
            )
          },
          { title: '% Pagado', dataIndex: 'porcentajepagado', width: 90, align: 'right', render: (text) => Number(text).toFixed(2) },
          { title: '% Pendiente', dataIndex: 'porcentajependiente', width: 90, align: 'right', render: (text) => Number(text).toFixed(2) },
          { title: 'Siniestros', dataIndex: 'siniestros', width: 90, align: 'center' },
          {
            title: 'Visualizar',
            width: 90,
            align: 'center',
            render: (_, record) => (
              <Button
                type="link"
                size="small"
                icon={<NextIcon />}
                disabled={!(Number(record.newLifePolicyId || record.lifePolicyId) > 0)}
                onClick={() => onViewPolicy(record)}
              />
            )
          },
          { title: '¿Renovada?', dataIndex: 'renovar', width: 100, align: 'center',
           render: (text) => {
               if (text === "Si")
                return (
                  <Tag color="green">
                    {text}
                  </Tag>
                );              
              else
                return (
                  <Tag color="red">
                    {text}
                  </Tag>
                );
            
              return text;           
              }
          }
        ];

        return (
          <div className="renovacion-view">
            <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={tableData}
            loading={loading}
            onChange={handleTableChange}
            size="small" // Para que se parezca más a la densidad de la imagen
            pagination={{
                total: total,
                showSizeChanger: true,
                showQuickJumper: true,
                pageSizeOptions: ['10','25','50', '100' , '200'],
                defaultPageSize: 15
            }}
            // CLAVE PARA RESPONSIVE: Permite scroll horizontal en pantallas pequeñas
            scroll={{ x: 'max-content', y: 800 }}
            bordered
            rowKey='lifePolicyId'              
            />
          </div>
        );
    };

    const TabContent3 = ({loteId, wfId,tableData, loadDataLoteDetalle, searchTotal, handleTableChange, 
                          loading, processActive, processType, handleRefresh, percent, handleCalculate, handleRenew, handleExclude, selectedRowDetailKeys, onSelectChange,
                          handleViewResults, onViewPolicy}) => {

         const onRowSelection = {
          selectedRowDetailKeys,
          onChange: onSelectChange,
          getCheckboxProps: (record) => ({
              //disabled: record.renovar == "No", 
              name: record.lifePolicyId, 
          }),
        };    
      
        return (
            <div style={{ padding: '20px', backgroundColor: '#fff' }}>                      
              {/* 2. Barra de Herramientas Reutilizable */}
                <ActionToolbarDetail
                  loading={loading}
                  processActive={processActive}
                  processType={processType}
                  onCalculate={handleCalculate}
                  onRenew={handleRenew}
                  onRefresh={handleRefresh}
                  onExclude={handleExclude}
                  onViewResults={handleViewResults}
                  percent={percent}
                  loteId={loteId}
                />
              <div style={{ marginTop: '20px' }}>
               
                  {/* 3. Tabla de Datos Reutilizable */}
                  <LoteDetalleTable 
                      tableData ={tableData} 
                      searchTotal={searchTotal} 
                      handleTableChange={handleTableChange}
                      rowSelection={onRowSelection}
                      total={searchTotal}
                      loading={loading}
                      onViewPolicy={onViewPolicy}
                  />
              </div>
            </div>
        );
    };

    /********************************************/
    //Modal Form
    /********************************************/

    function evalInContext (js, context){
        return function () {
            return eval(js)
        }.call(context);
    };

    function showError(error){
        const description = error.message || error || 'Unknown error';
        notification.error({message:'Error', description })
    }

    function ModalForm({ modalFormId, modalFormVisible, processId, onCancel, onReload }) {
          
          const [ form, setForm ] = useState(null);
          const [ loading, setLoading ] = useState(false);
          const [ processing, setProcessing ] = useState(false);
        
          async function onSubmitForm(){
              try {
                  const modalForm = document.getElementById('fb-render-view9');
                  modalForm.checkValidity();
                  if(!modalForm.reportValidity()){
                      showError('Please fill in all required fields.');
                      return;
                  }
                  const formData = Object.fromEntries(new FormData(modalForm));
                  const jValues = JSON.parse(form.json);
                  Object.keys(formData).forEach( key =>{
                      let index = jValues.findIndex(item => item.name == key);
                      if(index >= 0)
                          jValues[index].userData = [ formData[key]];
                  });
                  setProcessing(true)
                  const GotoStep = await exe('GotoStep',{ estado:'_next', procesoId: processId, userValues: JSON.stringify(jValues) });
                  if(!GotoStep.ok) throw GotoStep.msg;
                  showSuccess(GotoStep.msg);
                  setData(prev => ({...prev, modalFormVisible: false, modalFormId: null }));
                  onReload();
              } catch (error) {
                  showError(error)
              } finally{
                  setProcessing(false)
              }
          }
      
          useEffect(()=>{
              if(!modalFormId) return;
              $('#fb-render-view9').empty();
              setLoading(true)
              exe('GetForms', { filter: `id=${ modalFormId }` }).then( GetForms => {
                  if(!GetForms.ok) return Promise.reject(GetForms.msg);
                  setForm(GetForms.outData.pop());
                  return Promise.resolve();
              }).catch(error => showError(error))
              .finally(()=> setLoading(false));
          },[modalFormId]);
      
          useEffect(()=>{
            const renderedForm = document.getElementById('fb-render-view9');
            if(renderedForm) renderedForm.innerHTML = '';
            if(!form) return;
            $(renderedForm).formRender({ formData: form.json });
            evalInContext(form.logic);
          },[ form ])
  
          return <Modal title={t('Workflow Form')} open={ modalFormVisible } onCancel={ onCancel } onOk={ onSubmitForm }>
              { loading && <Skeleton active/> }
              <Spin spinning={ processing }>
                  <form id='fb-render-view9'></form>
              </Spin>
          </Modal>
      }

    //Sección final

    const RenovacionMainView = () => {
      const [wfId, setWfId] = useState(0);
      const [tableDataBatch, setTableDataBatch] = useState([]);
      const [tableDataDetail, setTableDataDetail] = useState([]);
      const [loadingBatch, setLoadingBatch] = useState(false);
      const [paginationBatch, setPaginationBatch] = useState({ current: 1, pageSize: 25, total: 0 }); 
      const [paginationDetail, setPaginationDetail] = useState({ current: 1, pageSize: 15, total: 0 }); 
      const [paginationResults, setPaginationResults] = useState({ current: 1, pageSize: 25, total: 0 });
      const [searchTotalBatch, setSearchTotalBatch] = useState(0);
      const [searchTotalDetail, setSearchTotalDetail] = useState(0);
      const [searchTotalResults, setSearchTotalResults] = useState(0);
      const [activeTab, setActiveTab] = useState("1");      
      const [loteId, setLoteId] = useState(0);
      const [percent, setPercent] = useState(0);
      const [intervalId, setIntervalId] = useState(null);
      const [processActive, setProcessActive] = useState(false);
      const [processBatchId, setProcessBatchId] = useState(0);
      const [processType, setProcessType] = useState('');
      const intervaloTiempo= 2;
      const [selectedRowDetailKeys, setSelectedRowDetailKeys] = useState([]);
      const [tableDataResults, setTableDataResults] = useState([]);
      const [loadingResults, setLoadingResults] = useState(false);
      const [resultsModalVisible, setResultsModalVisible] = useState(false);
          
      const [modalState, setModalState] = useState({
        modalFormVisible: false,
        modalFormId: null,
        processId: null
      });

      useEffect(() => {
        const params = {
            pagination: paginationBatch,
            loading: true,
            total: 0,
            data: tableDataBatch,
        };
        //load(params);
        loadDataBatch(params);
      }, []);

      const handleSearchBatch = () => {
        
          const newPagination = { ...paginationBatch, current: 1 };
          setPaginationBatch(newPagination);
          const params = {
              pagination: newPagination,
              loading: true,
              total: 0,
              data: tableDataBatch,
          };
          loadDataBatch(params);
      };

      const handleTableChangeBatch = (newPagination) => {          
          const params = {
              pagination: newPagination,
              loading: true,
              data: tableData,
              formulario: form.getFieldsValue(),
          };
          loadDataBatch(params);
      }

      /* ************************ */
      // Detalle del lote - Inicio
      /* ************************ */

      const handleViewDetail = (loteId, wfIdParam) => {
        try {
          if (intervalId) {
            clearInterval(intervalId);
          }
          setIntervalId(null);
          setProcessActive(false);
          setProcessBatchId(0);
          setProcessType('');
          setPercent(0);
          setSelectedRowDetailKeys([]);
                   
          setPaginationDetail({ current: 1, pageSize: 25, total: 0 });
          setLoteId(loteId);
          setWfId(wfIdParam);
        
          const params = {
              pagination: paginationDetail,
              loading: true,
              data: tableDataDetail,
              loteId: loteId,
          };
          loadDataLoteDetalle(params);
          setActiveTab("3");

        } catch (error) {
          console.log(error);
        }
      }

      const handleTableChangeDetail = (newPagination) => {

          setPaginationDetail(newPagination);
        
          const params = {
              pagination: newPagination,
              loading: true,
              data: tableDataDetail,
              loteId: loteId,
          };
          loadDataLoteDetalle(params);
      }

      const handleRefreshDetail = () => {

          const paginacion = paginationDetail;
          const params = {
              pagination: paginacion,
              loading: true,
              data: tableDataDetail,
              loteId: loteId,
          };
          loadDataLoteDetalle(params);
      }

      const handleViewPolicy = (record) => {
          const policyId = Number(record && (record.newLifePolicyId || record.lifePolicyId) || 0);

          if (!policyId) {
              notification.warning({
                  message: 'Visualizar póliza',
                  description: 'No se encontró un id válido para la póliza.',
                  duration: 5
              });
              return;
          }

          window.location.hash = `#/lifePolicy/${policyId}`;
      }

      const handleViewResults = () => {

          if (!loteId) {
            notification.warning({
              message: 'Advertencia',
              description: 'Debe seleccionar un lote primero.',
              duration: 5
            });
            return;
          }

          const newPagination = { current: 1, pageSize: paginationResults.pageSize || 25, total: 0 };
          setPaginationResults(newPagination);
          setResultsModalVisible(true);
          loadResultRenewQuoteBatchList({
              pagination: newPagination,
              loading: true,
              loteId: loteId,
              processBatchId: processBatchId,
              processType: processType
          });
      }

      const handleCloseResults = () => {
          setResultsModalVisible(false);
      }

      const handleTableChangeResults = (newPagination) => {

          setPaginationResults(newPagination);

          loadResultRenewQuoteBatchList({
              pagination: newPagination,
              loading: true,
              loteId: loteId,
              processBatchId: processBatchId,
              processType: processType
          });
      }

      const loadResultRenewQuoteBatchList = (params = {}) => {

        if (!params.loteId) {
          return;
        }

        setLoadingResults(params.loading);

        const processContext = Number(params.processBatchId || 0) > 0
          ? `, processBatchId:${Number(params.processBatchId)}${params.processType ? `, processType:'${params.processType}'` : ''}`
          : '';
        const context = `{ loteId: ${params.loteId}${processContext}, currentPage:${params.pagination.current}, pageSize:${params.pagination.pageSize}}`;

        exe("ExeChain",{
            chain: "cmdResultRenewQuoteBatchList",
            context: context
        })
        .then(r => {
          const response = Array.isArray(r) ? (r[0] || {}) : r;

          if (response.ok) {

              const outData = response.outData || {};
              const resultData = Array.isArray(outData.data)
                ? outData.data
                : (Array.isArray(outData) ? outData : []);
              const resultTotal = Number(outData.total || response.total || resultData.length || 0);

              setSearchTotalResults(resultTotal);
              setTableDataResults(resultData);
              setPaginationResults({ ...params.pagination, total: resultTotal });

          } else {
              notification.error({ message: 'Error', description: response.msg, duration: 10 });
          }
        })
        .catch(error => {
          notification.error({ message: 'Error', description: error.toString(), duration: 10 });
        })
        .finally(() => {
          setLoadingResults(false);
        });

      }

      //Default data to review only first element
      const showErrors = (params = {}) => {
        const processContext = Number(params.processBatchId || 0) > 0
          ? `, processBatchId:${Number(params.processBatchId)}${params.processType ? `, processType:'${params.processType}'` : ''}`
          : '';
        const context = `{ loteId: ${params.loteId}${processContext}, currentPage:1, pageSize:1}`;

        exe("ExeChain",{
            chain: "cmdResultRenewQuoteBatchList",
            context: context
        })
        .then(r => {
          const response = Array.isArray(r) ? (r[0] || {}) : r;

          const outData = response.outData || {};
          const resultData = Array.isArray(outData.data)
            ? outData.data
            : (Array.isArray(outData) ? outData : []);
          const resultTotal = Number(outData.total || response.total || resultData.length || 0);

          if (response.ok && resultTotal > 0) {
            const processName = params.processType === 'issuance' ? 'emisión' : 'cotización';
            notification.warning({ message: `Errores en el proceso de ${processName}`, description: `Se registraron errores relacionados al proceso de ${processName}; haga clic en Ver Errores para verificar más detalles.`, duration: 7 });
            const errorPagination = { current: 1, pageSize: paginationResults.pageSize || 25, total: resultTotal };
            setPaginationResults(errorPagination);
            setResultsModalVisible(true);
            loadResultRenewQuoteBatchList({
              pagination: errorPagination,
              loading: true,
              loteId: params.loteId,
              processBatchId: params.processBatchId,
              processType: params.processType
            });
          }

        })
        .catch(error => {
          notification.error({ message: 'Error', description: error.toString(), duration: 10 });
        })
        .finally(() => {
          setLoadingResults(false);
        });
      }      

      const loadDataLoteDetalle =(params = {}) => {

        setLoadingBatch(params.loading);
        
        if(!params.loteId){
          return;
        }

        const context = `{ loteId: ${params.loteId}, currentPage:${params.pagination.current}, pageSize:${params.pagination.pageSize}}`;

        exe("ExeChain",{
            chain: "cmdPaginationBatchDetail",
            context: context
        })
        .then(r => {
          if( r.ok){

              const polizaPaginada = r.outData.data;
              const listaPoliza = [];
              let indiceResultado = 0;

              if (r.outData.total > 0) {
                  setSearchTotalDetail(r.outData.total);
                  for (let index = 0; index < r.outData.total; index++) {
                      const factor = ((index + 1) / params.pagination.pageSize);
                      if (factor > (params.pagination.current - 1) && factor <= params.pagination.current && (indiceResultado < polizaPaginada.length)) {
                          listaPoliza.push(polizaPaginada[indiceResultado]);
                          indiceResultado += 1;
                      } else {
                          //listaPoliza.push({ id: ("Loading data... " + index) });
                      }
                  }
              }

              setTableDataDetail(listaPoliza);
              setPaginationDetail({ ...params.pagination, total: searchTotalDetail });
            
          } else{
              notification.error({ message: 'Error', description: r.msg, duration: 10 });
          }
          setLoadingBatch(false);
        })

      }

      // Aquí podrías manejar el estado de los datos filtrados
      const onSelectChange = (newSelectedRowKeys) => {
        console.log('selectedRowKeys changed: ', newSelectedRowKeys);
        setSelectedRowDetailKeys(newSelectedRowKeys);
      };  

      const getAnniversariesForQuote = (mode) => {
        return exe('LoadEntity', {
          entity: 'Batch',
          fields: 'jData',
          filter: `id = ${loteId}`
        }).then(result => {
          if (!result || !result.ok || !result.outData) {
            throw new Error(result && result.msg ? result.msg : 'No fue posible cargar el detalle completo del lote.');
          }

          let rows = [];
          try {
            rows = JSON.parse(result.outData.jData || '[]');
          } catch (error) {
            throw new Error('El detalle del lote no contiene un JSON válido.');
          }

          if (!Array.isArray(rows)) {
            throw new Error('El detalle del lote no tiene una estructura válida.');
          }

          const selectedIds = (selectedRowDetailKeys || []).map(value => String(value));
          const candidates = rows
            .filter(item => Array.isArray(item) && Number(item[2]) > 0)
            .map(item => {
              const sourcePolicyId = Number(item[2]);
              const offerColumn = typeof item[4] === 'boolean' ? 0 : Number(item[4] || 0);
              const firstColumn = Number(item[0] || 0);
              const offerPolicyId = offerColumn > 0
                ? offerColumn
                : (firstColumn > 0 && firstColumn !== sourcePolicyId ? firstColumn : sourcePolicyId);

              return {
                sourcePolicyId: sourcePolicyId,
                offerPolicyId: offerPolicyId
              };
            })
            .filter(item => mode === 'all'
              || selectedIds.indexOf(String(item.sourcePolicyId)) >= 0
              || selectedIds.indexOf(String(item.offerPolicyId)) >= 0);

          const offerIds = candidates
            .map(item => item.offerPolicyId)
            .filter((value, index, values) => value > 0 && values.indexOf(value) === index);

          if (!offerIds.length) {
            return [];
          }

          return exe('LoadEntities', {
            entity: 'LifePolicy',
            fields: 'id,activeDate',
            filter: 'id in (' + offerIds.join(',') + ')',
            noTracking: true
          }).then(policyResponse => {
            if (!policyResponse || policyResponse.ok === false) {
              throw new Error(policyResponse && policyResponse.msg
                ? policyResponse.msg
                : 'No fue posible validar el estado de las ofertas.');
            }

            const activeOfferIds = (Array.isArray(policyResponse.outData) ? policyResponse.outData : [])
              .filter(policy => policy && policy.activeDate !== null && policy.activeDate !== undefined && String(policy.activeDate).trim() !== '')
              .map(policy => Number(policy.id));

            return candidates
              .filter(item => activeOfferIds.indexOf(item.offerPolicyId) < 0)
              .map(item => String(item.sourcePolicyId))
              .filter((value, index, values) => values.indexOf(value) === index);
          });
        });
      };

      const handleRenew = (mode) => {
        if (processActive) {
          return;
        }

        Modal.confirm({
          title: 'Renovar pólizas',
          content: mode === 'all'
            ? 'Se renovarán todas las pólizas pendientes del lote.'
            : 'Se renovarán las pólizas seleccionadas.',
          okText: 'Aceptar',
          cancelText: 'Cancelar',
          onOk: () => executeRenewalBatch(mode)
        });
      };

      async function executeRenewalBatch(mode) {
        setProcessActive(true);
        try {
          const policyIds = await getRenewalPolicyIds(mode);
          if (!policyIds.length) {
            setProcessActive(false);
            notification.warning({ message: 'Renovar', description: 'No existen pólizas pendientes válidas para renovar.', duration: 5 });
            return;
          }

          const userEmail = await getCurrentUserEmail();
          if (!userEmail) {
            throw new Error('No fue posible recuperar el correo del usuario actual.');
          }

          const importConfigId = await getRenewalIssuanceImportConfig();
          const rows = policyIds.map(policyId => [policyId, loteId, userEmail]);
          const batch = await createRenewalIssuanceBatch(rows, importConfigId);
          const batchId = Number(batch && batch.id || 0);

          if (batchId <= 0) {
            throw new Error('No se recibió un identificador válido para el lote de emisión.');
          }

          const execution = await exe('DoBatch', { batchId: batchId });
          if (!execution || execution.ok === false) {
            throw new Error(execution && execution.msg ? execution.msg : `No fue posible ejecutar el lote ${batchId}.`);
          }

          beginBatchProgress(batchId, 'issuance');
          notification.info({
            message: 'Lote de emisión',
            description: `Se inició la emisión de ${policyIds.length} póliza(s).`,
            duration: 5
          });
        } catch (error) {
          setProcessActive(false);
          notification.error({ message: 'Error', description: error && error.message ? error.message : String(error), duration: 10 });
        }
      }

      const getRenewalPolicyIds = (mode) => {
        return exe('LoadEntity', {
          entity: 'Batch',
          fields: 'jData',
          filter: `id = ${loteId}`
        }).then(result => {
          if (!result || !result.ok || !result.outData) {
            throw new Error(result && result.msg ? result.msg : 'No fue posible cargar el lote de renovación.');
          }

          let rows;
          try {
            rows = JSON.parse(result.outData.jData || '[]');
          } catch (error) {
            throw new Error('El lote de renovación contiene un JSON inválido.');
          }

          if (!Array.isArray(rows)) {
            throw new Error('El detalle del lote de renovación no tiene un formato válido.');
          }

          const selectedIds = (selectedRowDetailKeys || []).map(value => String(value));
          const candidates = rows
            .filter(row => Array.isArray(row) && Number(row[2]) > 0)
            .map(row => {
              const sourcePolicyId = Number(row[2]);
              const offerColumn = typeof row[4] === 'boolean' ? 0 : Number(row[4] || 0);
              const firstColumn = Number(row[0] || 0);
              const offerPolicyId = offerColumn > 0
                ? offerColumn
                : (firstColumn > 0 && firstColumn !== sourcePolicyId ? firstColumn : sourcePolicyId);

              return {
                sourcePolicyId: sourcePolicyId,
                offerPolicyId: offerPolicyId
              };
            })
            .filter(item => mode === 'all'
              || selectedIds.indexOf(String(item.sourcePolicyId)) >= 0
              || selectedIds.indexOf(String(item.offerPolicyId)) >= 0);

          const policyIds = candidates
            .map(item => item.offerPolicyId)
            .filter((value, index, values) => value > 0 && values.indexOf(value) === index);

          if (!policyIds.length) {
            return [];
          }

          return exe('LoadEntities', {
            entity: 'LifePolicy',
            fields: 'id,activeDate',
            filter: 'id in (' + policyIds.join(',') + ')',
            noTracking: true
          }).then(policyResponse => {
            if (!policyResponse || policyResponse.ok === false) {
              throw new Error(policyResponse && policyResponse.msg
                ? policyResponse.msg
                : 'No fue posible validar el estado de las pólizas de renovación.');
            }

            const policies = Array.isArray(policyResponse.outData) ? policyResponse.outData : [];
            return policies
              .filter(policy => policy && (policy.activeDate === null || policy.activeDate === undefined || String(policy.activeDate).trim() === ''))
              .map(policy => Number(policy.id))
              .filter((value, index, values) => value > 0 && values.indexOf(value) === index);
          });
        });
      };

      const getCurrentUserEmail = () => {
        return exe('GetCurrentUser').then(result => {
          const source = result && result.outData;
          const user = Array.isArray(source) ? source[0] : source;
          return String(user && (user.email || user.Email || user.userEmail) || '').trim();
        });
      };

      const getRenewalIssuanceImportConfig = () => {
        return exe('RepoImportConfig', {
          operation: 'GET',
          filter: "name = 'RenewalPolicyIssuance'"
        }).then(result => {
          if (!result || result.ok === false) {
            throw new Error(result && result.msg ? result.msg : 'No fue posible recuperar la configuración de emisión.');
          }

          const records = Array.isArray(result.outData) ? result.outData : [];
          const config = records[0] || null;
          const configId = Number(config && (config.id || config.Id) || 0);
          if (configId <= 0) {
            throw new Error('No existe la configuración de importación RenewalPolicyIssuance.');
          }

          return configId;
        });
      };

      const createRenewalIssuanceBatch = (rows, importConfigId) => {
        return exe('RepoBatch', {
          operation: 'ADD',
          entity: {
            importConfigId: importConfigId,
            jData: JSON.stringify(rows),
            name: `RENEWALISSUANCE-${formatDate(new Date())}-${loteId}`,
            processingType: 0,
            records: rows.length
          }
        }).then(result => {
          if (!result || result.ok === false) {
            throw new Error(result && result.msg ? result.msg : 'No fue posible crear el lote de emisión.');
          }

          const record = Array.isArray(result.outData) ? result.outData[0] : result.outData;
          return record || null;
        });
      };

      const handleCalculate = (mode) => {
        try {

            if (!wfId) {
              notification.error({ message: 'Error', description: 'No se encontró proceso del lote.', duration: 5 });
              return;
            }

            if (mode !== 'all' && (!selectedRowDetailKeys || selectedRowDetailKeys.length === 0)) {
              notification.warning({ message: 'Cotizar', description: 'Debe seleccionar al menos una póliza.', duration: 5 });
              return;
            }

            getAnniversariesForQuote(mode).then(anniversaries => {
              if (!anniversaries || anniversaries.length === 0) {
                notification.warning({ message: 'Cotizar', description: 'No existen pólizas válidas para cotizar.', duration: 5 });
                return;
              }

              setProcessActive(true);

              // Quoting remains available after the batch is renewed.
              // The renewal status validation is kept for exclusion only.
              //exe("GotoStep",{procesoId: wfId,estado: "_next",userValues: "{}",isNonInterruptingEvent: false,process: null}); // avanza el estado del wf
          
                exe("ExeChain",{
                    chain: "cmdGeneraLoteCotizacionAniversario",
                    context: `{ loteId: ${loteId}, anniversaries: '${JSON.stringify(anniversaries)}' }`
                }).then(x => {
                  const resultado = x && x.outData ? x.outData : x;
                  if (!resultado || !resultado.ok) {
                    throw new Error(resultado && resultado.msg ? resultado.msg : 'No fue posible generar el lote de cotización.');
                  }

                  const idLoteQuote = Number(resultado.idLoteQuote || 0);
                  if (idLoteQuote <= 0) {
                    throw new Error('No se recibió un lote válido de cotización.');
                  }

                  return exe("DoBatch", { batchId: idLoteQuote })
                    .then(execution => {
                      if (!execution || execution.ok === false) {
                        throw new Error(execution && execution.msg
                          ? execution.msg
                          : `No fue posible programar el lote de cotización ${idLoteQuote}.`);
                      }

                      beginBatchProgress(idLoteQuote, 'quotation');
                      notification.info({ message: "Lote de tarificación", description: resultado.msg, duration: 3 });
                    });
                })
                .catch(error => {
                  setProcessActive(false);
                  throw error;
                });
              /*
              }
              else
                notification.error({ message: 'Lote renovado', description: 'El lote ya ha sido renovado, no puede cotizar pólizas', duration: 5 });
              });
              */
            }).catch(error => {
              setProcessActive(false);
              notification.error({ message: 'Error', description: error.toString(), duration: 10 });
            });
          
        } catch (error) {
          notification.error({ message: 'Error', description: error.toString(), duration: 10 });
        }        
      };

      const handleExclude = () => {
       try {

         if(!selectedRowDetailKeys || selectedRowDetailKeys.length === 0) {
           notification.error({ message: 'Advertencia', description: 'Debe seleccionar una póliza primero', duration: 5 });
           return;
         }

         dameEstadoLote().then(status => {
            if(status != "FINISHED"){
              ExcluyePolizas();
            }
            else
              notification.error({ message: 'Lote renovado', description: 'El lote ya ha sido renovado, no puede excluir pólizas', duration: 5 });
         });

        } catch (error) {
          notification.error({ message: 'Error', description: error.toString(), duration: 10 });
        }  
      }
      
      function ExcluyePolizas() {
        const idAExcluir = selectedRowDetailKeys.map(x => `'${x}'`).join(',');

        const sql = `UPDATE b
                      SET jData = (
                          SELECT
                              JSON_QUERY(
                                  '[' + STRING_AGG(
                                      CASE
                                          WHEN JSON_VALUE(j.[value], '$[2]') IN (${idAExcluir})
                                              THEN JSON_MODIFY(j.[value], '$[3]', 'No')
                                          ELSE j.[value]
                                      END,
                                      ','
                                  ) + ']'
                              )
                          FROM OPENJSON(b.jData) j
                      )
                      FROM Batch b
                      WHERE b.id = ${loteId};`

        exe("DoQuery",{ sql: sql}).then(x => {
          notification.info({ message: "Exclusión de pólizas", description: "Pólizas excluídas satisfactoriamente.", duration: 5 });
          handleRefreshDetail();
        });
        
      }

      /*
      const handleGenerateExcludedBatch = () => {
        try {

          setLoadingBatch(true);

          if (!loteId) {
            notification.warning({
              message: 'Advertencia',
              description: 'No se encontró lote, asegúrese de seleccionar uno primero.',
              duration: 5
            });
            return;
          }

          // obtener lote actual
          exe("LoadEntity", {
            entity: "Batch",
            fields: "id,jData,name",
            filter: `id=${loteId}`
          }).then(batchResult => {

            if (!batchResult.ok || !batchResult.outData) {
              notification.error({
                message: 'Error',
                description: 'No se pudo recuperar el lote, contacte a sistemas.',
                duration: 5
              });
              return;
            }

            const batch = batchResult.outData;

            let jData = [];

            try {
              jData = JSON.parse(batch.jData || "[]");
            } catch(ex1) {
              jData = [];
            }

            // registros renovar = No
            const excludedRecords = jData.filter(x => x[3] === "No");

            if (excludedRecords.length === 0) {
              notification.warning({
                message: 'Sin registros',
                description: 'No existen registros excluidos en el lote actual.',
                duration: 5
              });
              return;
            }

            const nombreLote = `LOTE-EXCLUIDOS-${loteId}-${formatDate(new Date())}`;

            // crear nuevo lote
            exe('RepoBatch', {
              entity: {
                importConfigId: 64,
                jData: JSON.stringify(excludedRecords),
                name: nombreLote,
                processingType: 0,
                records: excludedRecords.length
              },
              operation: 'ADD'
            }).then(newBatch => {

              if (!newBatch.ok) {
                notification.error({
                  message: 'Error',
                  description: 'No se pudo crear el lote, contacte a sistemas.',
                  duration: 5
                });
                return;
              }

              const { id, name } = newBatch.outData[0];

              // renombrar lote
              exe('SetField', {
                entity: 'Batch',
                entityId: id,
                fieldValue: `[name]='${name}-${id}'`
              }).then(r => {

                notification.success({
                  message: 'Lote generado',
                  description: `Se creó el lote ${id}:${name} con ${excludedRecords.length} registros.`,
                  duration: 8
                });

                excluyeRegistrosNoRenovados(loteId).then(res => {
                  if(!res.ok){
                    notification.error({
                      message: 'Error',
                      description: 'Error moviendo los registros no renovados del lote anterior.',
                      duration: 5
                    });
                  }
                  refrescarLoteDeExcluidos(id, loteId);
                });                

              });
              
            });
            
          });                    

        } catch (error) {

          notification.error({
            message: 'Error',
            description: error.toString(),
            duration: 10
          });

        }
        finally {
          setLoadingBatch(false);
        }
      };

      function excluyeRegistrosNoRenovados(loteId){

        const query = `
        UPDATE B
        SET
            jData = X.NewJson,
            records = X.Total
        FROM Batch B
        CROSS APPLY (
            SELECT
                COALESCE(
                    '[' + STRING_AGG(J.[value], ',') + ']',
                    '[]'
                ) AS NewJson,
                COUNT(*) AS Total
            FROM OPENJSON(B.jData) J
            WHERE JSON_VALUE(J.[value], '$[3]') <> 'No'
        ) X
        WHERE B.id = ${loteId};
        `;

        return exe("DoQuery", { sql: query });

      }

      function refrescarLoteDeExcluidos(id, loteId){
          handleSearchBatch();

          setLoteId(id);

          const nuevaPaginacion = {
            current: 1,
            pageSize: paginationDetail.pageSize || 15,
            total: 0
          };

          setPaginationDetail(nuevaPaginacion);

          const params = {
            pagination: nuevaPaginacion,
            loading: true,
            data: [],
            loteId: id,
          };

          loadDataLoteDetalle(params);
      }      

      */
      function dameEstadoLote() {
        return exe("LoadEntity", {
          entity: "Batch",
          fields: "status",
          filter: `id=${loteId}`
        }).then(x => {
          if (x && x.ok) {
            return x.outData.status;
          }
          return null;
        });
      }
  
      const formatDate = (date) => {
          const yyyy = date.getFullYear();
          const mm = String(date.getMonth() + 1).padStart(2, "0"); // Mes (0–11)
          const dd = String(date.getDate()).padStart(2, "0");

          return `${yyyy}/${mm}/${dd}`;
      }
      
      /* ************************ */
      // Detalle del lote - fin
      /* ************************ */

      const getProcessData = (WFids) => 
        exe("GetProcesses", {
          filter: `id IN (${WFids})`
        });
      
      const loadDataBatch = (params = {}) => {
          setLoadingBatch(params.loading);
          const context = `{row:{currentPage:${params.pagination.current}, pageSize:${params.pagination.pageSize}, batchCode:'ANNIVERSARYLOTEVIEW'}}`;

          exe("ExeChain",{
              chain: "cmdPaginationBatch",
              context: context
          })
          .then(r => {
              if(r.ok){
                  const polizaPaginada = r.outData.data;
                  const listaPoliza = [];
                  let indiceResultado = 0;

                  if (r.outData.total > 0) {
                      setSearchTotalBatch(r.outData.total);

                      //recupero todos los wfs cargados
                      var WFids = Array.from(
                        new Set(
                          (polizaPaginada || [])
                            .map(function (x) { return Number(x && x.wfId); })
                            .filter(function (x) { return x > 0; })
                        )
                      ).join(',');

                      getProcessData(WFids).then(x => {

                        //Recuperando datos del WF
                        if(x.ok){

                          try {
                           
                            for (let index = 0; index < r.outData.total; index++) {

                              if(!polizaPaginada[indiceResultado]) continue;
                              
                              const process = x.outData.find(b => b.id == polizaPaginada[indiceResultado].wfId);
                              if(process)
                                polizaPaginada[indiceResultado].Process = process;
                              else
                                polizaPaginada[indiceResultado].Process = {};
  
                              const factor = ((index + 1) / params.pagination.pageSize);
                              if (factor > (params.pagination.current - 1) && factor <= params.pagination.current && (indiceResultado < polizaPaginada.length)) {
                                  listaPoliza.push(polizaPaginada[indiceResultado]);
                                  indiceResultado += 1;
                              } else {
                                  listaPoliza.push({ id: ("Loading data... " + index) });
                              }                              
                              
                            }
                            
                          } catch (error) {
                            console.error(error) ;
                          }
                        }
                        
                        setTableDataBatch(listaPoliza);//console.log(listaPoliza)
                        setPaginationBatch({ ...params.pagination, total: r.total });
                        
                      });
                    
                     
                  }
                  
              } else{
                  notification.error({ message: 'Error', description: r.msg, duration: 10 });
              }
              setLoadingBatch(false);
          })
      }

      const onOpenModal = (record) => {
        setModalState({
          modalFormVisible: true,
          modalFormId: record.Process.formId,
          processId: record.Process.id
        });
      }

      const onClose = (record) => {
        setModalState({
          modalFormVisible: false,
          modalFormId: null,
          processId: null
        });
      }

      function beginBatchProgress(batchId, processType) {
        const validBatchId = Number(batchId || 0);
        if (validBatchId <= 0) {
          throw new Error('No se recibió un lote válido para monitorear.');
        }

        if (intervalId) {
          clearInterval(intervalId);
        }

        setProcessBatchId(validBatchId);
        setProcessType(processType);
        setProcessActive(true);
        setPercent(0);

        let isRunning = false;
        const id = setInterval(() => {
          if (isRunning) return;
          isRunning = true;

          getBatchProcessed(validBatchId)
            .then(current => {
              setPercent(current);

              if (current >= 100) {
                clearInterval(id);
                setIntervalId(null);
                setProcessActive(false);
                notification.info({
                  message: processType === 'issuance' ? 'Lote de emisión' : 'Lote de tarificación',
                  description: processType === 'issuance'
                    ? 'Proceso de emisión finalizado, verifique los resultados.'
                    : 'Proceso de cotización finalizado, verifique los resultados.',
                  duration: 3
                });
                handleRefreshDetail();
                showErrors({ loteId: loteId, processBatchId: validBatchId, processType: processType });
              }
            })
            .catch(error => {
              clearInterval(id);
              setIntervalId(null);
              setProcessActive(false);
              notification.error({ message: 'Error', description: error && error.message ? error.message : String(error), duration: 10 });
            })
            .finally(() => {
              isRunning = false;
            });
        }, intervaloTiempo * 1000);

        setIntervalId(id);
      }

      function getBatchProcessed(batchId) {
        return exe('SetBatchResults', { batchId: batchId })
          .then(result => {
            if (result && result.ok === false) {
              throw new Error(result.msg || 'No fue posible actualizar el progreso del lote.');
            }

            return exe('RepoBatch', {
              operation: 'GET',
              filter: `id = ${batchId}`
            });
          })
          .then(result => {
            if (!result || result.ok === false) {
              throw new Error(result && result.msg ? result.msg : 'No fue posible consultar el progreso del lote.');
            }

            const data = Array.isArray(result.outData) ? result.outData[0] : result.outData;
            if (!data) return 0;

            const records = Number(data.records || 0);
            const processed = Number(data.processed || 0);
            const success = Number(data.success || 0);
            const errors = Number(data.error || 0);
            const completed = processed || success + errors;

            if (records <= 0) {
              return String(data.status || '').toUpperCase() === 'FINISHED' ? 100 : 0;
            }

            return Math.min(100, Math.round((completed / records) * 100));
          });
      }

      async function reload(){
        //reload
      }
      useEffect(()=>{
          reload();
      },[]);

      return (
          <Layout className="layout" style={{ minHeight: '100vh' }}>
              <Content>
                  <Card bordered={false} bodyStyle={{ padding: 0 }}>
                      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card" tabBarStyle={{ marginBottom: 0, paddingLeft: '10px', paddingTop: '10px' }}>
                          <TabPane
                              tab={<span><FileSearchOutlined />Pólizas</span>}
                              key="1">
                              {/* Renderizamos el contenido de la pestaña 1 */}
                              <TabContent1 handleSearchBatch={handleSearchBatch} 
                                setLoadingBatch={setLoadingBatch}
                                setActiveTab={setActiveTab}/>
                          </TabPane>
                          <TabPane tab={<span><FileProtectOutlined />Lotes de Renovación</span>} key="2">
                              <TabContent2 
                                  tableDataBatch={tableDataBatch}
                                  loadingBatch={loadingBatch}
                                  searchTotalBatch={searchTotalBatch}
                                  handleTableChangeBatch={handleTableChangeBatch}
                                  handleSearchBatch={handleSearchBatch}
                                  handleViewDetail={handleViewDetail}
                                  onOpenModal={onOpenModal}
                              />
                          </TabPane>
                          <TabPane tab={<span><EyeOutlined />Detalle de Lote</span>} key="3" >
                              <TabContent3
                                loteId={loteId}
                                wfId={wfId}
                                tableData={tableDataDetail}
                                loadDataPolizas={loadDataLoteDetalle}
                                searchTotal={searchTotalDetail}
                                handleTableChange={handleTableChangeDetail}
                                paginacion={paginationDetail}
                                loading={loadingBatch}
                                processActive={processActive}
                                processType={processType}
                                percent={percent}
                                handleRefresh={handleRefreshDetail}
                                handleCalculate={handleCalculate}
                                handleRenew={handleRenew}
                                handleExclude={handleExclude}
                                selectedRowDetailKeys={selectedRowDetailKeys}
                                onSelectChange={onSelectChange}
                                handleViewResults={handleViewResults}
                                onViewPolicy={handleViewPolicy}
                              />
                          </TabPane>
                      </Tabs>
                  </Card>
                  <ModalForm  
                    modalFormId={modalState.modalFormId}
                    processId={modalState.processId}
                    modalFormVisible={modalState.modalFormVisible}
                    onReload={reload}
                    onCancel={onClose}
                    />
                  <ResultRenewQuoteBatchModal
                    visible={resultsModalVisible}
                    data={tableDataResults}
                    loading={loadingResults}
                    total={searchTotalResults}
                    pagination={paginationResults}
                    handleTableChange={handleTableChangeResults}
                    onCancel={handleCloseResults}
                    />
              </Content>
          </Layout>
      );
    };

    return <RenovacionMainView  />
}
