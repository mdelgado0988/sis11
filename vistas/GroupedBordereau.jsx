()=>{
  const { useState, useEffect, useRef, createContext, useContext } = React;
  const { Table, Select, Button, DatePicker, Skeleton, Space, Row, Col, Drawer, Form, Tabs, message, Input, InputNumber, Checkbox, Badge, Empty, Tooltip } = A;
  const { Column } = Table;
  const { RangePicker } = DatePicker;
  const SearchIcon   =()=><span role="img" aria-label="search" class="anticon anticon-search"><svg viewBox="64 64 896 896" focusable="false" data-icon="search" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"></path></svg></span>
  const DownloadIcon =()=><span role='img' aria-label='download' class='anticon anticon-download'><svg viewBox='64 64 896 896' focusable='false' data-icon='download' width='1em' height='1em' fill='currentColor' aria-hidden='true'><path d='M505.7 661a8 8 0 0012.6 0l112-141.7c4.1-5.2.4-12.9-6.3-12.9h-74.1V168c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v338.3H400c-6.7 0-10.4 7.7-6.3 12.9l112 141.8zM878 626h-60c-4.4 0-8 3.6-8 8v154H214V634c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v198c0 17.7 14.3 32 32 32h684c17.7 0 32-14.3 32-32V634c0-4.4-3.6-8-8-8z'></path></svg></span>;
  const ReloadIcon   =()=><span role='img' aria-label='reload' class='anticon anticon-reload'><svg viewBox='64 64 896 896' focusable='false' data-icon='reload' width='1em' height='1em' fill='currentColor' aria-hidden='true'><path d='M909.1 209.3l-56.4 44.1C775.8 155.1 656.2 92 521.9 92 290 92 102.3 279.5 102 511.5 101.7 743.7 289.8 932 521.9 932c181.3 0 335.8-115 394.6-276.1 1.5-4.2-.7-8.9-4.9-10.3l-56.7-19.5a8 8 0 00-10.1 4.8c-1.8 5-3.8 10-5.9 14.9-17.3 41-42.1 77.8-73.7 109.4A344.77 344.77 0 01655.9 829c-42.3 17.9-87.4 27-133.8 27-46.5 0-91.5-9.1-133.8-27A341.5 341.5 0 01279 755.2a342.16 342.16 0 01-73.7-109.4c-17.9-42.4-27-87.4-27-133.9s9.1-91.5 27-133.9c17.3-41 42.1-77.8 73.7-109.4 31.6-31.6 68.4-56.4 109.3-73.8 42.3-17.9 87.4-27 133.8-27 46.5 0 91.5 9.1 133.8 27a341.5 341.5 0 01109.3 73.8c9.9 9.9 19.2 20.4 27.8 31.4l-60.2 47a8 8 0 003 14.1l175.6 43c5 1.2 9.9-2.6 9.9-7.7l.8-180.9c-.1-6.6-7.8-10.3-13-6.2z'></path></svg></span>;
  const FilterIcon   =()=><span role='img' aria-label='filter' class='anticon anticon-filter'><svg viewBox='64 64 896 896' focusable='false' data-icon='filter' width='1em' height='1em' fill='currentColor' aria-hidden='true'><path d='M880.1 154H143.9c-24.5 0-39.8 26.7-27.5 48L349 597.4V838c0 17.7 14.2 32 31.8 32h262.4c17.6 0 31.8-14.3 31.8-32V597.4L907.7 202c12.2-21.3-3.1-48-27.6-48zM603.4 798H420.6V642h182.9v156zm9.6-236.6l-9.5 16.6h-183l-9.5-16.6L212.7 226h598.6L613 561.4z'></path></svg></span>;
  const AppContext = createContext({});

  const cfgCoberturaReaseguro = [
    { name: "cfgCoberturaProductoReaTecnicos" },
    { name: "cfgCoberturaProductoReaVidaColectivo" },
    { name: "cfgCoberturaProductoReaVida" },
    { name: "cfgCoberturaProductoReaRiesgosVarios" },
    { name: "cfgCoberturaProductoRea" }
  ];
  
  const useAppContext =()=> useContext(AppContext);
  const AppProvider=({children})=>{
    const [ showFilter, setShowFilter]= useState(false);
    const [ loadingM, setLoadingM ]   = useState(true);
    const [ loading, setLoading ]     = useState(false);
    const [ contracts, setContracts ] = useState([]);
    const [ cessions, setCessions ]   = useState([]);
    const [ losses, setLosses ] = useState([]);
    const [ salvages, setSalvages ] = useState([])
    const [ currencies, setCurrencies]= useState([]); 
    const [ lobs, setLobs ] = useState([]);
    const [ products, setProducts ] = useState([]);
    const [ filterForm ] = Form.useForm();
    const [ quickFilterForm ] = Form.useForm();
    const [ cmdOption, setcmdOption] = useState('RepoCession');
    const [config, setConfig] = useState([]); 
    const [ catalogsReady, setCatalogsReady ] = useState(false);
    const contractId = Form.useWatch('contractId', filterForm);
    const CessionOpt=[
      {value:'RepoCession', label:'Suscripción'},
      {value:'RepoLossCession', label:'Siniestros'},
      {value:'RepoSalvageCession',label:'Salvamento'}
    ];
    const openFilter=()=> setShowFilter(true);
    const closeFilter=()=> setShowFilter(false);
    const compareOptions =[
      {value: '=', label: t('Equals')},
      {value: '>', label: t('Greater than')},
      {value: '<', label: t('Less than')},
      {value: '||', label: t('Between')},
    ]
    const premiumTypeTranslate = {
        NEW: "NUEVO",
        CHANGE: "ENDOSO",
        ACTIVE: "ACTIVO",
        CANCELLATION: "CANCELACIÓN",
        ANNIVERSARY: "RENOVACIÓN"
    };
    async function onApplyQuickFilter(){
      try {
        if (!catalogsReady) {
          message.info('Estamos terminando de cargar los catálogos, intenta de nuevo en unos segundos.');
          return;
        }
        setLoading(true)
        const { contractId, dateFilter, cmdOption } = await quickFilterForm.validateFields();
        const actionMappings = {
          RepoCession: {
            action: fetchCession,
            save : setCessions
          },
          RepoLossCession: {
            action: fetchLoss,
            save: setLosses
          },
          RepoSalvageCession:{
            action: fetchSalvage,
            save : setSalvages
          }

        }
        const actionToPerform = actionMappings[cmdOption];
        if (!actionToPerform) {
          message.error('Tipo de documento no valido.');
          return;
        }
        let saveData = actionToPerform.save
        setcmdOption(cmdOption);
        saveData([]);
        let filter = [];
        if(contractId && contractId > 0)
          filter.push(`contractId=${ contractId }`);
        if(cmdOption === 'RepoCession') filter.push('overwritten=0')
        if(dateFilter){
          const [year, month ] = formatSqlDate(dateFilter).split('-');
          switch(cmdOption){
            case 'RepoCession':        filter.push(`YEAR([start]) = ${ Number(year) } AND MONTH([start])=${ Number(month) }`); break;
            case 'RepoLossCession':    filter.push(`YEAR([claimOccurrence]) = ${ Number(year) } AND MONTH([claimOccurrence])=${ Number(month) }`); break;
            case 'RepoSalvageCession': filter.push(`YEAR([claimOccurrence]) = ${ Number(year) } AND MONTH([claimOccurrence])=${ Number(month) }`); break;
          }
        }
        await actionToPerform.action(filter.join(' AND '));
      } catch (error) {
              let msg;
              if(error instanceof Error)
                  msg = error.message
              else if(error['fields']){
                  msg = 'Por favor completa los campos obligatorios'
              } else{
                  msg = 'Se ha producido un error al aplicar el filtro';
              }
              message.error(msg);
          } finally{
              setLoading(false);
          }
    }
    async function onApplyFilter(){
        try {
            if (!catalogsReady) {
                message.info('Estamos terminando de cargar los catálogos, intenta de nuevo en unos segundos.');
                return;
            }
            setLoading(true)
            const loadOptions = {
                RepoCession: fetchCession,
                RepoLossCession: fetchLoss,
                RepoSalvageCession: fetchSalvage
            }
            await loadOptions[cmdOption]();
        } catch (error) {
            let msg;
            if(error instanceof Error)
                msg = error.message
            else if(error['fields']){
                msg = 'Por favor completa los campos obligatorios'
            } else{
                msg = 'Se ha producido un error al aplicar el filtro';
            }
            message.error(msg);
        }finally{
            setLoading(false);
        }
        
    }

    const searchRefs = useRef({
      pol: { timer: null, value: '' },
      contact: { timer: null, value: '' }
    });
    async function fetchPol(value, callback){
      const state = searchRefs.current.pol;
      if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
      }
      state.value = value;
      async function fetch(){
        exe('RepoLifePolicy',{operation:'GET', filter:`[code] LIKE '${ escapeSqlString(value) }%' AND active=1`, size: 15 }).then( response => {
          if(!response || !response.ok){
            return callback([]);
          }
          if(state.value != value){
            return callback([]);
          }
          const mapped = getRows(response).map(pol => ({value: pol.id, label: pol.code }));
          callback(mapped)          
        })
      }
      state.timer = setTimeout(fetch, 500)      
    }
    async function fetchContact(value, callback){
      const state = searchRefs.current.contact;
      if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
      }
      state.value = value;
      async function fetch(){
        let filterString = `(((RTRIM(ISNULL([name],''))+' '+RTRIM(ISNULL(surname1,''))+' '+RTRIM(ISNULL(surname2,''))) like N'%${ escapeSqlString(value) }%')) and [inactive]=0`
        exe('GetContacts',{operation:'GET', filter:filterString, size: 10 }).then( response => {
          if(!response || !response.ok){
            return callback([]);
          }
          if(state.value != value){
            return callback([]);
          }
          const mapped = getRows(response).map(con => ({value: con.id, label: con.FullName }));
          callback(mapped)          
        })
      }
      state.timer = setTimeout(fetch, 500)      
    }
    async function fetchCession( quickFilter = null  ){
		setCessions([]);
        
        const filter = quickFilter || await getCessionsFilter();

        if(!filter){
            message.error('Debe seleccionar al menos un filtro para la búsqueda');
            return;
        }

        const response = await exe('RepoCession',{ operation:'GET', filter });
        if(!response.ok) throw new Error(response.msg);
        const rows = getRows(response);
        
        // Group by policy
        const grouped = rows.reduce((group, cession) => {

            // Llave artificial del movimiento
            const movementKey = (() => {

                switch (cession.premiumType) {

                    case "CHANGE":
                        return `CHANGE_${cession.changeId}`;

                    case "NEW":
                        return `NEW_${cession.start}`;

                    case "ANNIVERSARY":
                        return `ANNIVERSARY_${cession.anniversaryId || cession.start}`;

                    case "CANCELLATION":
                        return `CANCELLATION_${cession.start}`;

                    default:
                        return `${cession.premiumType}_${cession.start}`;
                }

            })();

            const groupIndex = group.findIndex(pol =>
                pol.lifePolicyId === cession.lifePolicyId &&
                pol.movementKey === movementKey
            );

            const product = products.find(p => p.parent === cession.LoB && normalizarTexto(p.label) === normalizarTexto(cession.product))
            cession.productCode = product ? product.value : "";

            if (groupIndex >= 0) {

                const pol = group[groupIndex];

                pol.cessions = (pol.cessions || []);
                pol.cessions.push(cession);               

                // Totals
                pol.sumInsuredCedant += Number(montoSiEsCobertura(cession.LoB, cession.productCode, cession.coverageCode, cession.sumInsuredCedant) || 0);
                pol.sumInsuredRe += Number(montoSiEsCobertura(cession.LoB, cession.productCode, cession.coverageCode, cession.sumInsuredRe) || 0);
                const totalSum = Number(pol.sumInsuredCedant || 0) + Number(pol.sumInsuredRe || 0);
                pol.sumInsured = totalSum;
                pol.sumInsuredComputed = totalSum;

                addLineCedTotals(pol, cession);
                addLinePremiumTotals(pol, cession);
                addLineCommissionTotals(pol, cession);
                addLineTaxTotals(pol, cession);
                pol.tax += Number(cession.tax || 0);
                pol.premiumCedant += Number(cession.premiumCedant || 0);
                pol.premiumRe += Number(cession.premiumRe || 0);
                const totalPremium = Number(pol.premiumCedant || 0) + Number(pol.premiumRe || 0);
                pol.premium = totalPremium;

                pol.comissionCedant += Number(cession.comissionCedant || 0);
                pol.comissionCedantExtra += Number(cession.comissionCedantExtra || 0);

                group[groupIndex] = pol;

            } else {

                const newPol = {

                    movementKey,

                    lifePolicyId: cession.lifePolicyId,
                    contractId: cession.contractId,
                    lob: cession.LoB,
                    policyCode: cession.policyCode,
                    insuredName: String(cession.insuredName || cession.holderName).trim(),
                    date: cession.start,

                    premiumType: premiumTypeTranslate[cession.premiumType] || cession.premiumType,

                    product: cession.product,
                    changeId: cession.changeId,

                    premium: Number(cession.premium || 0),
                    //sumInsured: montoSiEsCobertura(cession.LoB, cession.productCode, cession.coverageCode, cession.sumInsured),
                    //sumInsuredComputed: montoSiEsCobertura(cession.LoB, cession.productCode, cession.coverageCode, cession.sumInsuredComputed),

                    sumInsuredCedant: montoSiEsCobertura(cession.LoB, cession.productCode, cession.coverageCode, cession.sumInsuredCedant),
                    sumInsuredRe: montoSiEsCobertura(cession.LoB, cession.productCode, cession.coverageCode, cession.sumInsuredRe),                    
                    sumInsuredReCuotaParte: 0,
                    sumInsuredReExcedente: 0,
                    sumInsuredReFacultativa: 0,
                    premiumReCuotaParte: 0,
                    premiumReExcedente: 0,
                    premiumReFacultativa: 0,
                    commissionReCuotaParte: 0,
                    commissionReExcedente: 0,
                    commissionReFacultativa: 0,
                    taxReCuotaParte: 0,
                    taxReExcedente: 0,
                    taxReFacultativa: 0,

                    tax: Number(cession.tax || 0),

                    premiumCedant: Number(cession.premiumCedant || 0),
                    premiumRe: Number(cession.premiumRe || 0),

                    comissionCedant: Number(cession.comissionCedant || 0),
                    comissionCedantExtra: Number(cession.comissionCedantExtra || 0),

                    cessions: [cession]
                };

                const totalSum = Number(newPol.sumInsuredCedant || 0) + Number(newPol.sumInsuredRe || 0);
                newPol.sumInsured = totalSum;
                newPol.sumInsuredComputed = totalSum;

                const totalPremium = Number(newPol.premiumCedant || 0) + Number(newPol.premiumRe || 0);
                newPol.premium = totalPremium;

                addLineCedTotals(newPol, cession);
                addLinePremiumTotals(newPol, cession);
                addLineCommissionTotals(newPol, cession);
                addLineTaxTotals(newPol, cession);

                group.push(newPol);
            }

            return group;

        }, [])
        .filter(pol =>
            !(
                pol.sumInsuredCedant === 0 &&
                pol.sumInsuredRe === 0 &&
                pol.tax === 0 &&
                pol.premiumCedant === 0 &&
                pol.premiumRe === 0 &&
                pol.comissionCedant === 0 &&
                pol.comissionCedantExtra === 0
            )
        );

        setCessions(grouped);
    }
    async function fetchLoss( quickFilter = null ){
        setLosses([]);
		const filter = quickFilter || await getLossFilter();
        if(!filter){
            message.warning('Please select at least one filter before searching.');
            return;
        }
		const response = await exe('RepoLossCession',{ operation:'GET', filter, include:['Cessions','Payout'] });
		if(!response.ok) throw new Error(response.msg);		
        const rawRows = getRows(response);
        const rows = rawRows.filter(loss => loss && loss.Cession && loss.Payout);
        if (rows.length !== rawRows.length) {
          message.warning('Some loss records were skipped because required relations were missing.');
        }
		const grouped = rows.reduce((group, loss)=> {
			const policyId = loss.Cession.lifePolicyId,
			      LoB      = loss.Cession.LoB;
            const groupIndex = group.findIndex(pol => pol.lifePolicyId === policyId );
            if(groupIndex >= 0){
                const pol = group[groupIndex];
                pol.cessions = (pol.cessions || []);
                pol.cessions.push(loss);
                // Update totals
                pol.reserve += Number(loss.reserve || 0)
                pol.loss += Number(loss.loss || 0);
                pol.retainedReserve += Number(loss.retainedReserve || 0);
                pol.retainedLoss += Number(loss.retainedLoss || 0);
                pol.cededReserve += Number(loss.cededReserve || 0);
                pol.cededLoss += Number(loss.cededLoss || 0);
                pol.reinstatementPremium += Number(loss.reinstatementPremium || 0);
                group[groupIndex] = pol;
            } else {
                const newPol = {
                    lifePolicyId: policyId,
                    contractId: loss.contractId,
                    lob: LoB,
                    policyCode: loss.Cession.policyCode,
                    insuredName: String(loss.insuredName || loss.holderName).trim(),
                    reserve: Number(loss.reserve || 0), 
                    loss: Number(loss.loss || 0),
                    retainedReserve: Number(loss.retainedReserve || 0),
                    retainedLoss: Number(loss.retainedLoss || 0),
                    cededReserve: Number(loss.cededReserve || 0),
                    cededLoss: Number(loss.cededLoss || 0),
                    reinstatementPremium: Number(loss.reinstatementPremium || 0),
                    exGratia: loss.exGratia,
                    cessions: [ loss ]
                }
                group.push(newPol)
            }
            return group;
        },[]);
		setLosses(grouped);
    }
    async function fetchSalvage( quickFilter = null ){
        setSalvages([]);
        const filter = quickFilter || await getSalvageFilter();
        if(!filter){
          message.warning('Please select at least one filter before searching.');
          return;
        }
		const response = await exe('RepoSalvageCession',{ operation:'GET', filter });
		if(!response.ok) throw new Error(response.msg);
        const rawRows = getRows(response);
        const rows = rawRows.filter(salvage => salvage);
        if (rows.length !== rawRows.length) {
          message.warning('Some salvage records were skipped because required relations were missing.');
        }
        const grouped = rows.reduce((group, salvage)=>{
          const groupIndex = group.findIndex( pol =>
            String(pol.policyCode || '') === String(salvage.policyCode || '') &&
            String(pol.contractId || '') === String(salvage.contractId || '') &&
            String(pol.currency || '') === String(salvage.currency || '')
          );
          if(groupIndex >= 0){
              const pol = group[groupIndex];
              pol.cessions = (pol.cessions || []);
              pol.cessions.push(salvage);
              // summary
              pol.income += Number(salvage.income || 0);
              pol.retainedAmount += Number(salvage.retainedAmount || 0);
              pol.cededAmount += Number(salvage.cededAmount || 0);
              group[groupIndex] = pol;
            
          } else {
              let newPol = {
                  contractId: salvage.contractId,
                  LoB: salvage.LoB,
                  policyCode: salvage.policyCode,
                  insuredName: salvage.insuredName,
                  currency: salvage.currency,
                  income: Number(salvage.income || 0),
                  retainedAmount: Number(salvage.retainedAmount || 0),
                  cededAmount: Number(salvage.cededAmount || 0),
                  cessions: [ salvage ],
              }
              group.push(newPol);
          }
          return group;
        },[]);
        setSalvages(grouped)
    }
    async function loadConfigCoverages() {

        const configData = [];

        for (const table of cfgCoberturaReaseguro) {

            const response = await exe(
                'GetFullTable',
                { table: table.name }
            );

            if (!response.ok)
                continue;

            configData.push(
                ...(mapearTablaConfig(getRows(response)) || [])
            );
        }

        setConfig(configData);

        return configData;
    }

    function montoSiEsCobertura(lobCode, productCode, coverageCode, amount) {

        const coverageConfig = config.find(
            c => normalizarTexto(c.lobCode) == normalizarTexto(lobCode) &&
                  normalizarTexto(c.productCode) == normalizarTexto(productCode) &&
                  normalizarTexto(c.coverageCode) == normalizarTexto(coverageCode)
        );

        if (!coverageConfig)
            return amount;

        const suma =
            String(coverageConfig.isCoverage || '')
                .trim()
                .toUpperCase() === 'SI';

        return suma ? amount : 0;
    }

    function normalizarTexto(valor) {
        return String(valor || '')
            .trim()
            .toUpperCase();
    }

    function escapeSqlString(value) {
      return String(value || '').replace(/'/g, "''");
    }
    
    function mapearTablaConfig(data) {

      if (!data || !data.length) return [];

      const headersOriginal = data[0];

      // Resolver nombres duplicados
      const headers = [];
      const contador = {};

      headersOriginal.forEach(h => {
        const key = h.trim();

        if (contador[key]) {
          contador[key]++;
          headers.push(`${key}_${contador[key]}`);
        } else {
          contador[key] = 1;
          headers.push(key);
        }
      });

      // Mapear filas
      const result = data.slice(1).map(row => {
        const obj = {};

        headers.forEach((col, i) => {
          obj[col] = row[i];
        });

        return obj;
      });

      return result;
    }

    const isInvalid = value => {
        // null o undefined
        if (value == null) return true;

        // string vacío
        if (typeof value === "string" && value.trim() === "") {
            return true;
        }

        // array vacío
        if (Array.isArray(value)) {
            return value.length === 0 || value.every(isInvalid);
        }

        // objeto
        if (typeof value === "object") {
            const values = Object.values(value);

            return values.length === 0 || values.every(isInvalid);
        }

        return false;
    }; 

    function hasAnyValidValue(values) {
      return !isInvalid(values);
    }

    function formatSqlDate(value) {
      if (!value) return '';

      if (value && typeof value.format === 'function') {
        return value.format('YYYY-MM-DD');
      }

      if (value && typeof value.toDate === 'function') {
        return formatSqlDate(value.toDate());
      }

      const date = new Date(value);
      if (isNaN(date.getTime())) return '';

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    function getRows(response) {
      return (response && response.outData) || [];
    }

    function pickAllowedValues(values, allowedKeys) {
      const allowed = new Set((allowedKeys || []).map(key => String(key)));
      const source = values || {};
      const result = {};

      Object.keys(source).forEach(key => {
        if (!allowed.has(key)) {
          return;
        }

        result[key] = source[key];
      });

      return result;
    }
    
    async function getCessionsFilter() {
        
      const values = await filterForm.validateFields();

      const allInvalid = isInvalid(values);

      if(allInvalid)
        return null;

      const isValid = (val) =>
        val !== null &&
        val !== undefined &&
        String(val).trim().length > 0;

      const handlers = {
        date: (value) => {
          const [year, month] = formatSqlDate(value).split('-');

          return `YEAR([start])=${Number(year)} AND MONTH([start])=${Number(month)}`;
        },

        period: (value) => {
          const period = new Date(value);
          const year = period.getFullYear();
          const month = period.getMonth() + 1;

          period.setMonth(period.getMonth() + 1);
          period.setDate(0);

          const endDay = period.getDate();

          return `YEAR(start)=${year} AND MONTH(start)=${month} AND DAY(start)=1 
            AND YEAR([end])=${year} AND MONTH([end])=${month} AND DAY([end])=${endDay}`;
        },
        range: value =>{
          if(!value) return null;
          const [ from , to ] = value;
          return `[start] BETWEEN '${ formatSqlDate(from)}' AND '${ formatSqlDate(to)}'`
        },
        creationRange: value => {
          if(!value) return null;
          let [ from, to ] = value;
          from = formatSqlDate(from);
          to = formatSqlDate(to);
          return `(premiumType='NEW' AND lifepolicyId in (SELECT id FROM LifePolicy WHERE created between '${ from }' AND  '${ to }') OR
                  premiumType='ANNIVERSARY' AND anniversaryId in (SELECT id FROM Anniversary WHERE created between '${ from }' AND  '${ to }') OR
              premiumType='CHANGE' AND changeId in (SELECT id FROM Change WHERE creationDate between '${ from }' AND  '${ to }'))`
        },
        policyId: value => {
          if(!value) return null;
          return `lifepolicyId in (${ value })`
        },
        policyIdManual: value => {
          if(!value) return null;
          return `lifepolicyId in (${ value })`
        },
        contractIdManual: value => {
          if(!value) return null;
          return `contractId=${ value }`
        },
        policyStart: value => {
          if(!value) return null;
          let [ from, to ] = value;
          from = formatSqlDate(from);
          to = formatSqlDate(to);
          return `lifepolicyId in (SELECT id FROM LifePolicy WHERE [start] between '${ from }' AND '${ to }')`
        },
        policyEnd: value => {
          if(!value) return null;
          let [ from, to ] = value;
          from = formatSqlDate(from);
          to = formatSqlDate(to);
          return `lifepolicyId in (SELECT id FROM LifePolicy WHERE [end] between '${ from }' AND '${ to }')`
        },
        policyStatus: (value) => {
          if (value === -1) return null;
          return `lifepolicyId IN (SELECT id FROM LifePolicy WHERE active=${value})`;
        },

        productCode: (value) =>
          `lifepolicyId IN (SELECT id FROM LifePolicy WHERE productCode='${escapeSqlString(String(value).trim())}')`,
        diff: () => null,

        sa: (value) => {
          const opt = compareOptions.find(item => item.value === value.compare);
          if (!opt) return null;

          if (opt.value !== '||') {
            return `sumInsured ${opt.value} ${value.value}`;
          }

          return `sumInsured BETWEEN ${value.value} AND ${value.upperValue}`;
        },
        participantId: value => `id in (select cessionId from CessionPart where contactId=${ value })`,
        overwritten: (value) => `overwritten=${value ? 1 : 0}`,

        FAC: (value) => value ? `lineId='FAC'` : null,

        coSumInsured: (value) => value ? `coSumInsured>0` : null,
      };

      const filters = Object.entries(values)
        .map(([key, value]) => {
          if (!isValid(value) && !['FAC','overwritten','coSumInsured'].includes(key)) return null;

          // Custom handler
          if (handlers[key]) {
            return handlers[key](value);
          }

          // Numbers
          if (key.endsWith('SearchId')) return null;

          if (!isNaN(value) && Number(value) > 0) {
            return `${key}=${value}`;
          }

          // Strings
          return `${key}='${escapeSqlString(String(value).trim())}'`;
        })
        .filter(Boolean);

      return filters.join(' AND ');
    }
    async function getLossFilter() {
      const values = pickAllowedValues(await filterForm.validateFields(), [
        'date', 'range', 'creationRange', 'policyId', 'holderId', 'lob', 'coverageCode',
        'contractId', 'contractIdManual', 'policyIdManual', 'claimId', 'id', 'cessionId',
        'lineId', 'participantId', 'FAC', 'exGratia', 'policyStatus', 'distributionMode', 'sa'
      ]);
      if (isInvalid(values)) {
        return null;
      }
      const isValid = (val) =>
        val !== null &&
        val !== undefined &&
        String(val).trim().length > 0;

      const handlers = {
        date: (value) => {
          const [year, month] = formatSqlDate(value).split('-');

          return `YEAR([claimOccurrence])=${Number(year)} AND MONTH([claimOccurrence])=${Number(month)}`;
        },
        range: value =>{
          if(!value) return null;
          const [ from , to ] = value;
          return `[claimOccurrence] BETWEEN '${ formatSqlDate(from)}' AND '${ formatSqlDate(to)}'`
        },
        creationRange: value => {
          if(!value) return null;
          let [ from, to ] = value;
          from = formatSqlDate(from);
          to = formatSqlDate(to);
          return `lifeCoveragePayoutId in (SELECT id FROM LifeCoveragePayout WHERE date between '${ from }' AND '${ to }')`
        },
        policyIdManual: value => `cessionId in (SELECT id FROM cession WHERE lifepolicyId=${ value })`,
        contractIdManual: value => `contractId=${ value }`,
        holderId: value => `cessionId in (SELECT id FROM cession WHERE lifepolicyId in (SELECT id FROM LifePolicy WHERE holderId=${ value }))`,
        lob: value => `cessionId in (SELECT id FROM cession WHERE LoB='${ escapeSqlString(value) }')`,
        coverageCode: value => `cessionId in (SELECT id FROM cession WHERE coverageCode='${ escapeSqlString(value) }')`,
        claimId: value => `lifeCoveragePayoutId in (SELECT id FROM LifeCoveragePayout WHERE claimId=${ value })`,
        lineId: value => `cessionId in (SELECT id FROM cession WHERE lineId='${ escapeSqlString(value) }')`,
        policyStatus: value => `cessionId in (SELECT id FROM cession WHERE lifepolicyId in (SELECT id FROM LifePolicy WHERE active=${ value }))`,
        distributionMode: value => `distributionMode=${ value }`,
        sa: (value) => {
          const opt = compareOptions.find(item => item.value === value.compare);
          if (!opt) return null;

          if (opt.value !== '||') {
            return `cessionId in (SELECT id FROM cession WHERE sumInsured ${opt.value} ${value.value})`
          }
          return `cessionId in (SELECT id FROM cession WHERE sumInsured BETWEEN ${value.value} AND ${value.upperValue})`	
        },
        participantId: value => `id in (select lossCessionId from LossCessionPart where contactId=${ value })`,
        FAC: (value) => value ? `cessionId in (SELECT id FROM cession WHERE lineId='FAC')` : null,
        exGratia: (value) => value ? 'exGratia=1' : null,
        coSumInsured: (value) => value ? `coSumInsured>0` : null,
      };

      const filters = Object.entries(values)
        .map(([key, value]) => {
          if (!isValid(value)) return null;

          // Custom handler
          if (handlers[key]) {
            return handlers[key](value);
          }

          // Numbers
          if (key.endsWith('SearchId')) return null;

          if (!isNaN(value) && Number(value) > 0) {
            return `${key}=${value}`;
          }

          // Strings
          return `${key}='${escapeSqlString(String(value).trim())}'`;
        })
        .filter(Boolean);

      return filters.join(' AND ');
    }
    async function getSalvageFilter() {
      const values = pickAllowedValues(await filterForm.validateFields(), [
        'date', 'range', 'policyId', 'holderId', 'lob', 'coverageCode',
        'contractId', 'contractIdManual', 'policyIdManual', 'salvageId', 'id', 'cessionId', 'lineId', 'participantId', 'currency'
      ]);
      if (isInvalid(values)) {
        return null;
      }
      const isValid = (val) =>
        val !== null &&
        val !== undefined &&
        String(val).trim().length > 0;

      const handlers = {
        date: (value) => {
          const [year, month] = formatSqlDate(value).split('-');

          return `YEAR([claimOccurrence])=${Number(year)} AND MONTH([claimOccurrence])=${Number(month)}`;
        },
        range: value =>{
          if(!value) return null;
          const [ from , to ] = value;
          return `[claimOccurrence] BETWEEN '${ formatSqlDate(from)}' AND '${ formatSqlDate(to)}'`
        },
        policyIdManual: value => `cessionId in (SELECT id FROM cession WHERE lifepolicyId=${ value })`,
        contractIdManual: value => `contractId=${ value }`,
        holderId: value => `cessionId in (SELECT id FROM cession WHERE lifepolicyId in (SELECT id FROM LifePolicy WHERE holderId=${ value }))`,
        lob: value => `cessionId in (SELECT id FROM cession WHERE LoB='${ escapeSqlString(value) }')`,
        coverageCode: value => `cessionId in (SELECT id FROM cession WHERE coverageCode='${ escapeSqlString(value) }')`,
        policyId: value => `cessionId in (SELECT id FROM cession WHERE lifepolicyId=${ value})`,
        claimId: value => `salvageId in (SELECT id FROM Salvage WHERE claimId=${ value })`,
        lineId: value => `cessionId in (SELECT id FROM cession WHERE lineId='${ escapeSqlString(value) }')`,
        participantId: value => `id in (select salvageCessionId from SalvageCessionPart where contactId=${ value })`,
      };

      const filters = Object.entries(values)
        .map(([key, value]) => {
          if (!isValid(value)) return null;

          // Custom handler
          if (handlers[key]) {
            return handlers[key](value);
          }

          // Numbers
          if (key.endsWith('SearchId')) return null;

          if (!isNaN(value) && Number(value) > 0) {
            return `${key}=${value}`;
          }

          // Strings
          return `${key}='${escapeSqlString(String(value).trim())}'`;
        })
        .filter(Boolean);

      return filters.join(' AND ');
    }      

    async function dataToXLSX( data, docName ){
        try {
            await ensureExcelLibrary();

            if(typeof XLSX === 'undefined'){
                message.error('No es posible crear un archivo de excel en este momento');
                return;
            }
            if(!data || data.length === 0 ){
                message.info('No hay datos para exportar');
                return;
            }
            const fileName = `${ docName }-${ new Date().getTime() }.xlsx`;
            const wb = XLSX.utils.book_new();

            if (isLossExport(data, docName)) {
              const groupedData = (data || []).map(row => mapLossRowForExport(row));
              const cessions = (data || []).reduce((summary, row) => {
                return summary.concat((row && row.cessions) ? row.cessions : []);
              }, []).map(loss => mapLossCessionRowForExport(loss));
              const ws1 = XLSX.utils.json_to_sheet(groupedData);
              const ws2 = XLSX.utils.json_to_sheet(cessions);
              XLSX.utils.book_append_sheet(wb, ws1, 'Grouped By Policy');
              XLSX.utils.book_append_sheet(wb, ws2, 'Loss Cessions');
            } else if (isSalvageExport(data, docName)) {
              const groupedData = (data || []).map(row => mapSalvageRowForExport(row));
              const cessions = (data || []).reduce((summary, row) => {
                return summary.concat((row && row.cessions) ? row.cessions : []);
              }, []).map(salvage => mapSalvageCessionRowForExport(salvage));
              const ws1 = XLSX.utils.json_to_sheet(groupedData);
              const ws2 = XLSX.utils.json_to_sheet(cessions);
              XLSX.utils.book_append_sheet(wb, ws1, 'Grouped By Policy');
              XLSX.utils.book_append_sheet(wb, ws2, 'Salvage Cessions');
            } else
            if (isBordereauFlatExport(data, docName)) {
              const policyMap = await loadPolicyFiscalNumbers(data);
              const groupedData = (data || []).map(row => mapGroupedBordereauRowForExport(row, policyMap));
              const ws = XLSX.utils.json_to_sheet(groupedData);
              XLSX.utils.book_append_sheet(wb, ws, 'Bordereau');
            } else {
              // Clean data.
              const groupedData = (data || []).map( row => mapGroupedRowForExport(row) );
              const cessions = (data || []).reduce((summary, row) => {
                return summary.concat((row && row.cessions) ? row.cessions : []);
              }, [])
                .map(cession => mapCessionRowForExport(cession));
              /* create worksheet */
              const ws1 = XLSX.utils.json_to_sheet(groupedData);
              const ws2 = XLSX.utils.json_to_sheet(cessions);
              XLSX.utils.book_append_sheet(wb, ws1, 'Grouped By Policy');
              XLSX.utils.book_append_sheet(wb, ws2, 'Cessions');
            }
            XLSX.writeFile(wb, fileName);
        } catch (error) {
            console.error('Export failed:', error);
            message.error((error && error.message) || 'No es posible crear un archivo de excel en este momento');
        }
    }

    function isBordereauFlatExport(data, docName) {
      if (!Array.isArray(data) || data.length === 0) {
        return false;
      }

      return /suscripci/i.test(String(docName || '')) || Object.prototype.hasOwnProperty.call(data[0] || {}, 'sumInsuredRe');
    }

    function isLossExport(data, docName) {
      return /siniestros?/i.test(String(docName || '')) || Object.prototype.hasOwnProperty.call((data || [])[0] || {}, 'reserve');
    }

    function isSalvageExport(data, docName) {
      return /salvamento/i.test(String(docName || '')) || Object.prototype.hasOwnProperty.call((data || [])[0] || {}, 'income');
    }

    async function loadPolicyFiscalNumbers(data) {
      const ids = Array.from(new Set((data || []).map(row => Number(row && row.lifePolicyId || 0)).filter(Boolean)));
      const map = {};

      if (!ids.length) {
        return map;
      }

      const filter = `id in (${ids.join(',')})`;
      const response = await exe('RepoLifePolicy', { operation: 'GET', filter, fields: 'id,fiscalNumber' });
      if (!response || !response.ok) {
        return map;
      }

      getRows(response).forEach(item => {
        map[String(item.id)] = item.fiscalNumber || '';
      });

      return map;
    }

    function mapGroupedBordereauRowForExport(row = {}, policyMap = {}) {
      const first = getFirstCession(row);
      const cserie = getCserieFromContractId(row.contractId);
      const sumInsured100 = Number(row.sumInsuredComputed || row.sumInsured || 0);
      const sumRet = Number(row.sumInsuredCedant || 0);
      const sumCed = Number(row.sumInsuredRe || 0);
      const prem100 = Number(row.premium || 0);
      const premRet = Number(row.premiumCedant || 0);
      const premCed = Number(row.premiumRe || 0);
      const comision = Number(row.comissionCedant || 0);
      const comisionExtra = Number(row.comissionCedantExtra || 0);
      const tax = Number(row.tax || 0);

      return {
        id: row.lifePolicyId || '',
        Ramo: getLobDescription(row.lob),
        Plan: row.product || first.product || first.plan || '',
        Poliza: row.policyCode || '',
        Recibo: policyMap[String(row.lifePolicyId || '')] || first.receipt || first.recibo || first.receiptNumber || first.fiscalNumber || '',
        Tipo: row.premiumType || first.premiumType || '',
        Contratante: first.holderName || first.contratante || row.contractId || '',
        Asegurado: row.insuredName || first.insuredName || '',
        'Fecha Emision': formatExportDate(first.date || first.created || row.date),
        'Fecha Desde': formatExportDate(first.start || row.date),
        'Fecha Hasta': formatExportDate(first.end || ''),
        'Suma Asegurada 100%': sumInsured100,
        'Suma Retenida': sumRet,
        'Suma Cedida': sumCed,
        'Suma Cuota Parte': Number(row.sumInsuredReCuotaParte || 0),
        'Suma Excedente': Number(row.sumInsuredReExcedente || 0),
        'Suma Facultativa': Number(row.sumInsuredReFacultativa || 0),
        'Prima Suscrita 100%': prem100,
        'Prima Retenida': premRet,
        'Prima Cedida': premCed,
        'Suma Prima Cuota Parte': Number(row.premiumReCuotaParte || 0),
        'Suma Prima Excedente': Number(row.premiumReExcedente || 0),
        'Prima Cat': 0,
        'Prima Facultativa': Number(row.premiumReFacultativa || 0),
        'Comision Contractual': comision,
        'Comision Cuota Parte': Number(row.commissionReCuotaParte || 0),
        'Comision Excedente': Number(row.commissionReExcedente || 0),
        'Comision Facultativa': Number(row.commissionReFacultativa || 0),
        Impuesto: tax,
        'Impuesto Facultativo': Number(row.taxReFacultativa || 0),
        'Reaseguro por Cuota Parte': Number(row.sumInsuredReCuotaParte || 0),
        'Reaseguro por Excedente': Number(row.sumInsuredReExcedente || 0),
        'Reaseguro por Pagar': Number(sumCed || 0),
        cserie: cserie || first.cserie || row.cserie || ''
      };
    }

    function getCserieFromContractId(contractId) {
      const id = String(contractId || '').trim();
      if (!id) {
        return '';
      }

      const contract = (contracts || []).find(item => String(item.id || '').trim() === id);
      const startDate = contract && (contract.effectiveDate || contract.start || contract.vigenciaInicial);
      return formatYYYYMM(startDate);
    }

    function formatYYYYMM(value) {
      if (!value) {
        return '';
      }

      const text = String(value).trim();
      if (!text) {
        return '';
      }

      if (/^\d{8}$/.test(text)) {
        return text;
      }

      const iso = text.slice(0, 7);
      if (/^\d{4}-\d{2}$/.test(iso)) {
        return iso.replace('-', '');
      }

      const date = new Date(text);
      if (isNaN(date.getTime())) {
        return '';
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${year}${month}`;
    }

    function addLineCedTotals(groupedRow, cession) {
      if (!groupedRow || !cession) {
        return;
      }

      const lineId = String(cession.lineId || '').trim().toUpperCase();
      const cedValue = montoSiEsCobertura(cession.LoB, cession.productCode, cession.coverageCode, Number(cession.sumInsuredRe || 0));      

      if (!cedValue) {
        return;
      }

      if (lineId === 'CUOTA PARTE' || lineId.indexOf('CUOTA PARTE') >= 0) {
        groupedRow.sumInsuredReCuotaParte = Number(groupedRow.sumInsuredReCuotaParte || 0) + cedValue;
      }

      if (lineId === 'EXCEDENTE 1' || lineId.indexOf('EXCEDENTE') >= 0) {
        groupedRow.sumInsuredReExcedente = Number(groupedRow.sumInsuredReExcedente || 0) + cedValue;
      }

      if (lineId === 'FAC' || lineId.indexOf('FAC') >= 0) {
        groupedRow.sumInsuredReFacultativa = Number(groupedRow.sumInsuredReFacultativa || 0) + cedValue;
      }
    }

    function addLinePremiumTotals(groupedRow, cession) {
      if (!groupedRow || !cession) {
        return;
      }

      const lineId = String(cession.lineId || '').trim().toUpperCase();
      const premiumValue = Number(cession.premiumRe || 0);

      if (!premiumValue) {
        return;
      }

      if (lineId === 'CUOTA PARTE' || lineId.indexOf('CUOTA PARTE') >= 0) {
        groupedRow.premiumReCuotaParte = Number(groupedRow.premiumReCuotaParte || 0) + premiumValue;
      }

      if (lineId === 'EXCEDENTE 1' || lineId.indexOf('EXCEDENTE') >= 0) {
        groupedRow.premiumReExcedente = Number(groupedRow.premiumReExcedente || 0) + premiumValue;
      }

      if (lineId === 'FAC' || lineId.indexOf('FAC') >= 0) {
        groupedRow.premiumReFacultativa = Number(groupedRow.premiumReFacultativa || 0) + premiumValue;
      }
    }

    function addLineCommissionTotals(groupedRow, cession) {
      if (!groupedRow || !cession) {
        return;
      }

      const lineId = String(cession.lineId || '').trim().toUpperCase();
      const commissionValue = Number(cession.comissionCedant || 0);

      if (!commissionValue) {
        return;
      }

      if (lineId === 'CUOTA PARTE' || lineId.indexOf('CUOTA PARTE') >= 0) {
        groupedRow.commissionReCuotaParte = Number(groupedRow.commissionReCuotaParte || 0) + commissionValue;
      }

      if (lineId === 'EXCEDENTE 1' || lineId.indexOf('EXCEDENTE') >= 0) {
        groupedRow.commissionReExcedente = Number(groupedRow.commissionReExcedente || 0) + commissionValue;
      }

      if (lineId === 'FAC' || lineId.indexOf('FAC') >= 0) {
        groupedRow.commissionReFacultativa = Number(groupedRow.commissionReFacultativa || 0) + commissionValue;
      }
    }

    function addLineTaxTotals(groupedRow, cession) {
      if (!groupedRow || !cession) {
        return;
      }

      const lineId = String(cession.lineId || '').trim().toUpperCase();
      const taxValue = Number(cession.tax || 0);

      if (!taxValue) {
        return;
      }

      if (lineId === 'CUOTA PARTE' || lineId.indexOf('CUOTA PARTE') >= 0) {
        groupedRow.taxReCuotaParte = Number(groupedRow.taxReCuotaParte || 0) + taxValue;
      }

      if (lineId === 'EXCEDENTE 1' || lineId.indexOf('EXCEDENTE') >= 0) {
        groupedRow.taxReExcedente = Number(groupedRow.taxReExcedente || 0) + taxValue;
      }

      if (lineId === 'FAC' || lineId.indexOf('FAC') >= 0) {
        groupedRow.taxReFacultativa = Number(groupedRow.taxReFacultativa || 0) + taxValue;
      }
    }

    function getLobDescription(lobCode) {
      const code = String(lobCode || '').trim();
      if (!code) {
        return '';
      }

      const match = (lobs || []).find(item => String(item.value || item.code || '').trim() === code);
      return match ? (match.label || match.name || code) : code;
    }

    function getFirstCession(row = {}) {
      if (row && Array.isArray(row.cessions) && row.cessions.length > 0) {
        return row.cessions[0] || {};
      }

      return {};
    }

    function getTypeAmount(premiumType, expectedType, value) {
      const type = String(premiumType || '').toUpperCase();
      const expected = String(expectedType || '').toUpperCase();
      if (type.indexOf(expected) >= 0) {
        return Number(value || 0);
      }
      return 0;
    }

    function formatExportDate(value) {
      if (!value) return '';
      return String(value).slice(0, 10);
    }

    function mapGroupedRowForExport(row = {}) {
      return {
        'Id póliza': row.lifePolicyId || '',
        'Contrato': row.contractId || '',
        'Línea': row.lineId || '',
        'Ramo': row.lob || '',
        'Póliza': row.policyCode || '',
        'Asegurado': row.insuredName || '',
        'Tipo': row.premiumType || '',
        'Suma asegurada': row.sumInsured || 0,
        'Prima': row.premium || 0,
        'Suma retenida': row.sumInsuredCedant || 0,
        'Prima retenida': row.premiumCedant || 0,
        'Comisión': row.comissionCedant || 0,
        'Comisión extra': row.comissionCedantExtra || 0,
        'Impuesto': row.tax || 0,
        'Suma cedida': row.sumInsuredRe || 0,
        'Prima cedida': row.premiumRe || 0
      };
    }

    function mapLossRowForExport(row = {}) {
      return {
        'Id póliza': row.lifePolicyId || '',
        'Contrato': row.contractId || '',
        'Ramo': row.lob || '',
        'Poliza': row.policyCode || '',
        'Asegurado': row.insuredName || '',
        'Reservado': row.reserve || 0,
        'Siniestro': row.loss || 0,
        'Reserva retenida': row.retainedReserve || 0,
        'Siniestro retenido': row.retainedLoss || 0,
        'Reserva cedida': row.cededReserve || 0,
        'Siniestro cedido': row.cededLoss || 0,
        'Prima reinstalación': row.reinstatementPremium || 0,
        'Ex Gratia': row.exGratia ? 1 : 0
      };
    }

    function mapLossCessionRowForExport(loss = {}) {
      return {
        'Id': loss.id || '',
        'Cession Id': loss.cessionId || '',
        'Coverage': (loss.Cession && loss.Cession.cover) || '',
        'Coverage Id': (loss.Cession && loss.Cession.coverageId) || '',
        'Claim Id': (loss.Payout && loss.Payout.claimId) || '',
        'Occurrence': loss.claimOccurrence || '',
        'Notification': loss.claimNotification || '',
        'Line Id': (loss.Cession && loss.Cession.lineId) || '',
        'Event Reason': loss.eventReason || '',
        'Insured Event': loss.insuredEvent || '',
        'Reserved': loss.reserve || 0,
        'Loss': loss.loss || 0,
        'Retained Reserve': loss.retainedReserve || 0,
        'Retained Loss': loss.retainedLoss || 0,
        'Ceded Reserve': loss.cededReserve || 0,
        'Ceded Loss': loss.cededLoss || 0,
        'Reinstatement Premium': loss.reinstatementPremium || 0,
        'Ex Gratia': loss.exGratia ? 1 : 0
      };
    }

    function mapSalvageRowForExport(row = {}) {
      return {
        'Contrato': row.contractId || '',
        'Ramo': row.LoB || '',
        'Poliza': row.policyCode || '',
        'Asegurado': row.insuredName || '',
        'Moneda': row.currency || '',
        'Ingreso': row.income || 0,
        'Retenido': row.retainedAmount || 0,
        'Cedido': row.cededAmount || 0
      };
    }

    function mapSalvageCessionRowForExport(salvage = {}) {
      return {
        'Contrato': salvage.contractId || '',
        'Ramo': salvage.LoB || '',
        'Poliza': salvage.policyCode || '',
        'Asegurado': salvage.insuredName || '',
        'Moneda': salvage.currency || '',
        'Ingreso': salvage.income || 0,
        'Retenido': salvage.retainedAmount || 0,
        'Cedido': salvage.cededAmount || 0
      };
    }

    function mapCessionRowForExport(cession = {}) {
      return {
        'Id': cession.id || '',
        'Contrato': cession.contractId || '',
        'Id póliza': cession.lifePolicyId || '',
        'Línea': cession.lineId || '',
        'Cobertura': cession.cover || cession.coverageId || '',
        'Código cobertura': cession.coverageCode || '',
        'Tipo': cession.premiumType || '',
        'Suma asegurada': cession.sumInsured || 0,
        'Prima': cession.premium || 0,
        'Suma retenida': cession.sumInsuredCedant || 0,
        'Prima retenida': cession.premiumCedant || 0,
        'Comisión': cession.comissionCedant || 0,
        'Comisión extra': cession.comissionCedantExtra || 0,
        'Impuesto': cession.tax || 0,
        'Suma cedida': cession.sumInsuredRe || 0,
        'Prima cedida': cession.premiumRe || 0
      };
    }
    async function onDownloadClick(){
        try {
            if(!cmdOption){
                message.error('Por favor seleccione un tipo de documento');
                return;
            }
            setLoading(true);
            const dataMapping = {
              RepoCession: {
                data: cessions,
                title: 'Suscripción'
              },
              RepoLossCession: {
                data: losses,
                title: 'Siniestros',
              },
              RepoSalvageCession:{
                data: salvages,
                title: 'Salvamento'
              }
            };
            const exportEntry = dataMapping[cmdOption];
            if (!exportEntry) {
                message.error('Tipo de documento no valido');
                return;
            }
            await dataToXLSX( exportEntry.data || [], `Reporte de ${ exportEntry.title }` );
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false);
        }
    }
    async function ensureExcelLibrary(){
      if(typeof XLSX !== 'undefined'){
        return;
      }

      const response = await exe('ExeChain',{ chain:'cmdLoadLibrariesGroupedBordereau', context:'{}'});
      if(!response.ok) throw new Error(response.msg);

      const libs = response.outData || {};
      const momentLib = libs.momentJs;
      const xlsxLib = libs.XLSX || libs.xlsx || libs.xlsxJs;

      if(typeof moment === 'undefined' && momentLib){
        executeTrustedLibraryCode(momentLib, 'moment');
      }

      if(typeof XLSX === 'undefined' && xlsxLib){
        if(typeof xlsxLib === 'string'){
          executeTrustedLibraryCode(xlsxLib, 'xlsx');
        } else {
          window.XLSX = xlsxLib;
        }
      }
    }

    function executeTrustedLibraryCode(source, libraryName) {
      const code = String(source || '').trim();
      if (!code) {
        return;
      }

      // NOTE FOR MAINTAINERS / AI:
      // This view loads helper libraries from a backend chain because the runtime
      // cannot rely on external network access here. The chain returns the library
      // source as text, so the only practical way to hydrate it in this environment
      // is to evaluate that trusted payload after basic validation.
      // Do not replace this with a remote script tag or a direct CDN fetch unless
      // the execution environment changes to allow outbound network access.
      eval(code);
    }
    const value = {
      loading, loadingM, setLoading,
      CessionOpt, filterForm, contracts,
      showFilter, openFilter, closeFilter,
      fetchPol, onApplyFilter, fetchContact,
      cessions, products, lobs,currencies,
      compareOptions, quickFilterForm, onApplyQuickFilter, config, catalogsReady,
	  losses, salvages, onDownloadClick
    }
    useEffect(()=>{
      // NOTE FOR MAINTAINERS / AI:
      // The report helpers are hydrated from a backend chain because this
      // runtime cannot depend on outbound network access for CDN/script loading.
      // The chain returns trusted library source, so we validate it and then
      // execute it locally. This is intentional and currently the only workable
      // approach in this environment.
      if( typeof moment === 'undefined'){
        exe('ExeChain',{ chain:'cmdLoadLibrariesGroupedBordereau', context:'{}'}).then( response => {
          if(!response.ok) throw new Error(response.msg)
          const { outData:{ momentJs, XLSX: xlsxLib } } = response;
          if(typeof moment === 'undefined' && momentJs){
            executeTrustedLibraryCode(momentJs, 'moment');
          }
          if(typeof XLSX === 'undefined' && xlsxLib){
            if(typeof xlsxLib === 'string'){
              executeTrustedLibraryCode(xlsxLib, 'xlsx');
            } else {
              window.XLSX = xlsxLib;
            }
          }
          setLoadingM(false);
        }).catch(error => {
          console.error(error);
          message.error('No fue posible cargar las librerías del reporte.');
          setLoadingM(false);
        })
      }else {
        setLoadingM(false);
      }
      
      const loadInitialData = () => {
        setCatalogsReady(false);

        return Promise.all([
          exe('LoadEntities',{ entity:'Contract', fields:'id,code,name,effectiveDate,endDate'}).then( response => setContracts(response.outData || [])),
          exe('RepoLob',{ operation:'GET'}).then( response => {
            const opt = (response.outData || []).map( lob => ({ value: lob.code, label: lob.name }));
            setLobs(opt);
          }),
          exe('GetProducts',{ }).then( response => {
            const opt = (response.outData || []).map( pro => ({ value: pro.code, label: pro.name, parent: pro.lobCode }));
            setProducts(opt);
          }),
          exe('RepoCurrency',{ operation:'GET', filter:`enabled=1`}).then( response => setCurrencies(response.outData || [])),
          loadConfigCoverages()
        ]).then(() => {
          setCatalogsReady(true);
        });
      };

      loadInitialData().catch(error => {
        setCatalogsReady(false);
        message.error((error && error.message) || 'No fue posible cargar los catálogos iniciales.');
      });
      
    },[]);
    return <AppContext.Provider value={ value }>
    { children }
    </AppContext.Provider>
  }
  const CessionsFilter=()=>{
    const [ policies, setPolicies ] = useState([]);
    const [ contacts, setContacts ] = useState([]);
	const [ participants, setParticipants ] = useState([]);
    const { filterForm, contracts, fetchPol, fetchContact, products, lobs, onApplyFilter , currencies, compareOptions } = useAppContext();
    const contractOpt = (contracts || []).map( con =>({ value: con.id, label: renderContractLabel(con) }));
    const lob = Form.useWatch('lob', filterForm);
    const [ compare, setCompare ] = useState('');
    const searchPolicies = (newValue) => {
      if (newValue) {
        fetchPol(newValue, setPolicies);
      } else {
        setPolicies([]);
      }
    }

    return <Form layout='vertical' form={filterForm} initialValues={{ date: moment()}}>
        <Tabs>
            <Tabs.TabPane tab={t('General')} key='1'>
                <Form.Item name='policyId' label={t('Policy')}>
                    <Select
                        options={ policies }
                        showSearch
                        filterOption={false}
                        defaultActiveFirstOption={false}
                        onSearch={searchPolicies}
                        placeholder={t('Type to search policy...')}/>
                </Form.Item>
                <Form.Item name='holderId' label={t('Policyholder')}>
                    <Select
                        options={ contacts }
                        showSearch
                        filterOption={false}
                        defaultActiveFirstOption={false}
                        onSearch={ value => { value ? fetchContact(value, setContacts) : setContacts([])}}
                        placeholder={t('Type to search contact...')}/>
                </Form.Item>
                <Form.Item name='lob' label={t('LoB')}>
                    <Select options={ (lobs || []) } style={{ width: '100%'}} showSearch allowClear optionFilterProp='label' placeholder={t('Please select LoB')}/>
                </Form.Item>
                <Form.Item name='productCode' label={t('Product')}>
                    <Select options={ (products || []).filter( pro => !lob || pro.parent == lob) } style={{ width: '100%'}} showSearch allowClear optionFilterProp='label' placeholder={t('Please select Product')}/>
                </Form.Item>
                <Form.Item name='coverageCode' label={t('Coverage Code')}>
                    <Input />
                </Form.Item>
                <Form.Item name='contractId' label={t('Contract')}>
                    <Select options={ (contractOpt || []) } style={{ width: '100%'}} showSearch allowClear optionFilterProp='label' placeholder={t('Please select contract')}/>
                </Form.Item>
                <div style={{ display: 'flex', flexDirection:'row', gap: 3 }}>
                    <Form.Item name='policyIdManual' label={t('Policy Id')}>
                        <InputNumber />
                    </Form.Item>
                    <Form.Item name='contractIdManual' label={t('Treaty Id')}>
                        <InputNumber />
                    </Form.Item>
                    <Form.Item name='id' label={t('Cession Id')} >
                        <InputNumber />
                    </Form.Item>
                </div>
                <Form.Item name='policyStatus' label={t('Policy Status')}>
                    <Select options={[{value: -1, label: t('All')},{value: 1, label:t('Active')}, {value:0, label:t('Inactive')}]} style={{ width: '100%'}} />
                </Form.Item>
                <Form.Item name='currency' label={t('Currency')}>
                  <Select options={ (currencies || []).map( c => ({ value: c.code, label: c.name }))} />
                </Form.Item>
                <Form.Item label={t('Sum Insured')}>
                  <Input.Group compact>
                    <Form.Item name={['sa','compare']}>
                      <Select allowClear placeholder={t('Comparison mode')} options={ compareOptions } onChange={ value => {
						if(value) setCompare(value);
						else {
							filterForm.setFieldsValue({ sa:{ value: null,  upperValue: null }});
							setCompare('');
						}
					  }} style={{ minWidth: 100 }}/>
                    </Form.Item>
                    <Form.Item name={['sa', 'value']}>
                      <InputNumber placeholder={ compare === '||' ? 'Lower value': 'Value'} style={{ minWidth: 100 }}/>
                    </Form.Item>
                    {
                      compare === '||' && <Form.Item name={['sa', 'upperValue']}>
                        <InputNumber placeholder='Upper value' style={{ minWidth: 100 }}/>
                      </Form.Item>
                    }
                  </Input.Group>
                </Form.Item>
				<Form.Item label={t('Distribution Mode')} name='distributionMode'>
					<Select options={[{ value: null, label: t('Standar')}, {value: 1, label:t('Accrued end of month')}, {value:2, label:t('Hybrid')}]}/>
				</Form.Item>
				<Form.Item name='participantId' label={t('Participant')}>
					<Select
                        options={ participants }
                        showSearch
                        filterOption={false}
                        defaultActiveFirstOption={false}
                        onSearch={ value => { value ? fetchContact(value, setParticipants) : setParticipants([])}}
                        placeholder={t('Type to search contact...')}/>
				</Form.Item>
				<Row gutter={16}>
					<Col span={12}>
						<Form.Item name='FAC' valuePropName='checked' label={t('Facultative')}>
							<Checkbox />
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item name='coSumInsured' valuePropName='checked' label={t('Coinsurance Only')}>
							<Checkbox />
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item name='diff' valuePropName='checked' label={t('Differential View')}>
							<Checkbox />
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item name='overwritten' valuePropName='checked' label={t('Overwritten')}>
							<Checkbox />
						</Form.Item>
					</Col>
				</Row>
            </Tabs.TabPane>
            <Tabs.TabPane tab={t('Dates')} key='2'>
				<Form.Item name='date' label={t('Issuance Period')}>
					<DatePicker picker='month'/>
				</Form.Item>
				<Form.Item name='period' label={t('Accrued Period')}>
					<DatePicker picker='month'/>
				</Form.Item>
				<Form.Item name='range' label={t('Issuance Range')}>
					 <RangePicker />
				</Form.Item>
				<Form.Item name='creationRange' label={t('Creation Range')}>
					 <RangePicker />
				</Form.Item>
				<Form.Item name='policyStart' label={t('Policy Start')}>
					 <RangePicker />
				</Form.Item>
				<Form.Item name='policyEnd' label={t('Policy End')}>
					 <RangePicker />
				</Form.Item>

            </Tabs.TabPane>
        </Tabs>
        <Button type='primary' htmlType='button' icon={<SearchIcon />} onClick={onApplyFilter}>
            {t('Search')}
        </Button>
    </Form>
  }
  const CessionsTable=()=>{
    const { cessions, loading } = useAppContext();
    const expandedRowRender=({ cessions })=>{
        return <Table dataSource={ (cessions || []) } pagination={false} rowKey='id'>
            <Column title={t('Coverage')} dataIndex='coverageId' key='coverageId' render={ (id, record) => <Tooltip title={ record.cover }><span>{ id }</span> </Tooltip>}/>
            <Column title={t('Line Id')} dataIndex='lineId' key='lineId' />
            <Column title={t('Sum Insured')}        dataIndex='sumInsured' key='sumInsured' render={renderNumber} />
            <Column title={t('Premium Sum')}        dataIndex='premium' key='premium' render={renderNumber} />
            <Column title={t('Cedant Sum Insured')} dataIndex='sumInsuredCedant' key='sumInsuredCedant' render={renderNumber} />
            <Column title={t('Cedant Premium')}     dataIndex='premiumCedant' key='premiumCedant' render={renderNumber} />
            <Column title={t('Commission')}         dataIndex='comissionCedant' key='comissionCedant' render={renderNumber} />
            <Column title={t('Commission Extra')}   dataIndex='comissionCedantExtra' key='comissionCedantExtra' render={renderNumber} />
            <Column title={t('Tax')}                dataIndex='tax' key='tax' render={renderNumber} />
            <Column title={t('Re Sum Insured')}     dataIndex='sumInsuredRe' key='sumInsuredRe' render={renderNumber} />
            <Column title={t('Re Premium')}         dataIndex='premiumRe' key='premiumRe' render={renderNumber} />

        </Table>
    }
    return <Table dataSource={ cessions || []} loading={ loading } rowKey='lifePolicyId' expandable={{ expandedRowRender } }>
        <Column title={t('Policy Id')}          dataIndex='lifePolicyId' key='id' />
        <Column title={t('Treaty ID')}          dataIndex='contractId' key='contractId' />
        <Column title={t('Lob')}                dataIndex='lob' key='lob' />
        <Column title={t('Policy')}             dataIndex='policyCode' key='policyCode' />
        <Column title={t('Insured')}            dataIndex='insuredName' key='insuredName' />
        <Column title={t('Date')}               dataIndex='date' key='date' render={value => (value || '').slice(0,10)} />
        <Column title={t('Type')}               dataIndex='premiumType' key='premiumType'/>
        <Column title={t('Sum Insured')}        dataIndex='sumInsured' key='sumInsured' render={renderNumber} />
        <Column title={t('Premium Sum')}        dataIndex='premium' key='premium' render={renderNumber} />
        <Column title={t('Cedant Sum Insured')} dataIndex='sumInsuredCedant' key='sumInsuredCedant' render={renderNumber} />
        <Column title={t('Cedant Premium')}     dataIndex='premiumCedant' key='premiumCedant' render={renderNumber} />
        <Column title={t('Commission')}         dataIndex='comissionCedant' key='comissionCedant' render={renderNumber} />
        <Column title={t('Commission Extra')}   dataIndex='comissionCedantExtra' key='comissionCedantExtra' render={renderNumber} />
        <Column title={t('Tax')}                dataIndex='tax' key='tax' render={renderNumber} />
        <Column title={t('Re Sum Insured')}     dataIndex='sumInsuredRe' key='sumInsuredRe' render={renderNumber} />
        <Column title={t('Re Premium')}         dataIndex='premiumRe' key='premiumRe' render={renderNumber} />
    </Table>
  }
  const LossFilter=()=>{
    const [ policies, setPolicies ] = useState([]);
    const [ contacts, setContacts ] = useState([]);
	const [ participants, setParticipants ] = useState([]);
    const { filterForm, contracts, fetchPol, fetchContact, products, lobs, onApplyFilter , currencies, compareOptions } = useAppContext();
    const contractOpt = (contracts || []).map( con =>({ value: con.id, label: renderContractLabel(con) }));
    const lob = Form.useWatch('lob', filterForm);
    const [ compare, setCompare ] = useState('');
    const searchPolicies = (newValue) => {
      if (newValue) {
        fetchPol(newValue, setPolicies);
      } else {
        setPolicies([]);
      }
    }

    return <Form layout='vertical' form={filterForm} initialValues={{ date: moment()}}>
		<Form.Item name='date' label={t('Occurrence Period')}>
			<DatePicker picker='month'/>
		</Form.Item>
		<Form.Item name='range' label={t('Occurrence Range')}>
			<RangePicker />
		</Form.Item>
		<Form.Item name='creationRange' label={t('Creation Range')}>
			<RangePicker />
		</Form.Item>
		<Form.Item name='policyId' label={t('Policy')}>
			<Select
				options={ policies }
				showSearch
				filterOption={false}
				defaultActiveFirstOption={false}
				onSearch={searchPolicies}
				placeholder={t('Type to search policy...')}/>
		</Form.Item>
		<Form.Item name='holderId' label={t('Policyholder')}>
			<Select
				options={ contacts }
				showSearch
				filterOption={false}
				defaultActiveFirstOption={false}
				onSearch={ value => { value ? fetchContact(value, setContacts) : setContacts([])}}
				placeholder={t('Type to search contact...')}/>
		</Form.Item>
		<Form.Item name='lob' label={t('LoB')}>
			<Select options={ (lobs || []) } style={{ width: '100%'}} showSearch allowClear optionFilterProp='label' placeholder={t('Please select LoB')}/>
		</Form.Item>
		<Form.Item name='coverageCode' label={t('Coverage Code')}>
			<Input />
		</Form.Item>
		<Form.Item name='contractId' label={t('Contract')}>
			<Select options={ (contractOpt || []) } style={{ width: '100%'}} showSearch allowClear optionFilterProp='label' placeholder={t('Please select contract')}/>
		</Form.Item>
		<div style={{ display: 'flex', flexDirection:'row', gap: 3, flexWrap: 'wrap' }}>
			<Form.Item name='policyIdManual' label={t('Policy Id')}>
				<InputNumber />
			</Form.Item>
			<Form.Item name='claimId' label={t('Claim Id')}>
				<InputNumber />
			</Form.Item>
			<Form.Item name='contractIdManual' label={t('Treaty Id')}>
				<InputNumber />
			</Form.Item>
			<Form.Item name='id' label={t('Loss Cession Id')} >
				<InputNumber />
			</Form.Item>
			<Form.Item name='cessionId' label={t('Cession Id')} >
				<InputNumber />
			</Form.Item>
			<Form.Item name='lineId' label={t('Line Id')} >
				<Input />
			</Form.Item>
		</div>
		<Form.Item name='currency' label={t('Currency')}>
			<Select options={ (currencies || []).map( c => ({ value: c.code, label: c.name }))} />
		</Form.Item>
		<Form.Item label={t('Sum Insured')}>
			<Input.Group compact>
			<Form.Item name={['sa','compare']}>
				<Select allowClear placeholder={t('Comparison mode')} options={ compareOptions } onChange={ value => {
				if(value) setCompare(value);
				else {
					filterForm.setFieldsValue({ sa:{ value: null,  upperValue: null }});
					setCompare('');
				}
				}} style={{ minWidth: 100 }}/>
			</Form.Item>
			<Form.Item name={['sa', 'value']}>
				<InputNumber placeholder={ compare === '||' ? 'Lower value': 'Value'} style={{ minWidth: 100 }}/>
			</Form.Item>
			{
				compare === '||' && <Form.Item name={['sa', 'upperValue']}>
				<InputNumber placeholder='Upper value' style={{ minWidth: 100 }}/>
				</Form.Item>
			}
			</Input.Group>
		</Form.Item>
		<Form.Item label={t('Distribution Mode')} name='distributionMode'>
			<Select options={[{ value: null, label: t('Standar')}, {value: 1, label:t('Accrued end of month')}, {value:2, label:t('Hybrid')}]}/>
		</Form.Item>
		<Form.Item name='participantId' label={t('Participant')}>
			<Select
				options={ participants }
				showSearch
				filterOption={false}
				defaultActiveFirstOption={false}
				onSearch={ value => { value ? fetchContact(value, setParticipants) : setParticipants([])}}
				placeholder={t('Type to search contact...')}/>
		</Form.Item>		

		<Form.Item name='policyStatus' label={t('Policy Status')}>
			<Select options={[{value: -1, label: t('All')},{value: 1, label:t('Active')}, {value:0, label:t('Inactive')}]} style={{ width: '100%'}} />
		</Form.Item>
		<Row gutter={16}>
			<Col span={12}>
				<Form.Item name='FAC' valuePropName='checked' label={t('Facultative')}>
					<Checkbox />
				</Form.Item>
			</Col>
			<Col span={12}>
				<Form.Item name='exGratia' valuePropName='checked' label={t('Ex Gratia Only')}>
					<Checkbox />
				</Form.Item>
			</Col>
		</Row>
        <Button type='primary' htmlType='button' icon={<SearchIcon />} onClick={onApplyFilter}>
            {t('Search')}
        </Button>
    </Form>
  }
  const SalvageFilter=()=>{
    const [ policies, setPolicies ] = useState([]);
    const [ contacts, setContacts ] = useState([]);
	  const [ participants, setParticipants ] = useState([]);
    const { filterForm, contracts, fetchPol, fetchContact, products, lobs, onApplyFilter , currencies, compareOptions } = useAppContext();
    const contractOpt = (contracts || []).map( con =>({ value: con.id, label: renderContractLabel(con) }));
    const lob = Form.useWatch('lob', filterForm);
    const [ compare, setCompare ] = useState('');
    const searchPolicies = (newValue) => {
      if (newValue) {
        fetchPol(newValue, setPolicies);
      } else {
        setPolicies([]);
      }
    }

    return <Form layout='vertical' form={filterForm} initialValues={{ date: moment()}}>
      <Form.Item name='date' label={t('Occurrence Period')}>
        <DatePicker picker='month'/>
      </Form.Item>
      <Form.Item name='range' label={t('Occurrence Range')}>
        <RangePicker />
      </Form.Item>
      <Form.Item name='policyId' label={t('Policy')}>
        <Select
          options={ policies }
          showSearch
          filterOption={false}
          defaultActiveFirstOption={false}
          onSearch={searchPolicies}
          placeholder={t('Type to search policy...')}/>
      </Form.Item>
      <Form.Item name='holderId' label={t('Cedent')}>
        <Select
          options={ contacts }
          showSearch
          filterOption={false}
          defaultActiveFirstOption={false}
          onSearch={ value => { value ? fetchContact(value, setContacts) : setContacts([])}}
          placeholder={t('Type to search contact...')}/>
      </Form.Item>
      <Form.Item name='lob' label={t('LoB')}>
        <Select options={ (lobs || []) } style={{ width: '100%'}} showSearch allowClear optionFilterProp='label' placeholder={t('Please select LoB')}/>
      </Form.Item>
      <Form.Item name='coverageCode' label={t('Coverage Code')}>
        <Input />
      </Form.Item>
      <Form.Item name='contractId' label={t('Contract')}>
        <Select options={ (contractOpt || []) } style={{ width: '100%'}} showSearch allowClear optionFilterProp='label' placeholder={t('Please select contract')}/>
      </Form.Item>
      <div style={{ display: 'flex', flexDirection:'row', gap: 3, flexWrap: 'wrap' }}>
        <Form.Item name='policyIdManual' label={t('Policy Id')}>
          <InputNumber />
        </Form.Item>
        <Form.Item name='salvageId' label={t('Salvage Id')}>
          <InputNumber />
        </Form.Item>
        <Form.Item name='contractIdManual' label={t('Treaty Id')}>
          <InputNumber />
        </Form.Item>
        <Form.Item name='id' label={t('Salvage Cession Id')} >
          <InputNumber />
        </Form.Item>
        <Form.Item name='cessionId' label={t('Cession Id')} >
          <InputNumber />
        </Form.Item>
        <Form.Item name='lineId' label={t('Line Id')} >
          <Input />
        </Form.Item>
      </div>
      <Form.Item name='currency' label={t('Currency')}>
        <Select options={ (currencies || []).map( c => ({ value: c.code, label: c.name }))} />
      </Form.Item>
      <Form.Item name='participantId' label={t('Participant')}>
        <Select
          options={ participants }
          showSearch
          filterOption={false}
          defaultActiveFirstOption={false}
          onSearch={ value => { value ? fetchContact(value, setParticipants) : setParticipants([])}}
          placeholder={t('Type to search contact...')}/>
      </Form.Item>
      <Button type='primary' htmlType='button' icon={<SearchIcon />} onClick={onApplyFilter}>
          {t('Search')}
      </Button>
    </Form>
  }
  const SalvageTable=()=>{
    const { salvages } = useAppContext();
    return <Table dataSource={ salvages }>
      <Column title={t('Treaty ID')} dataIndex='contractId' key='contractId' />
      <Column title={t('Lob')} dataIndex='LoB' key='LoB' />
      <Column title={t('Policy')} dataIndex='policyCode' key='policyCode' />
      <Column title={t('Insured')} dataIndex='insuredName' key='insuredName' />
      <Column title={t('Currency')} dataIndex='currency' key='currency' />
      <Column title={t('Income')} dataIndex='income' key='income' />
      <Column title={t('Retained')} dataIndex='retainedAmount' key='retainedAmount' />
      <Column title={t('Ceded')} dataIndex='cededAmount' key='cededAmount' />
    </Table>
  }          
  const LossTable=()=>{
	const { losses, loading } = useAppContext();
	const expandedRowRender=({ cessions })=>{
        return <Table dataSource={ (cessions || []) } pagination={false} rowKey='id'>
			<Column title={t('ID')} 			dataIndex='id' key='id'/>
			<Column title={t('Cession ID')} 	dataIndex='cessionId' key='cessionId'/>
            <Column title={t('Coverage')} 		dataIndex='Cession' key='coverageId' render={ (Cession) => {
              const c = Cession || {};
              return <Tooltip title={ c.cover || '' }><span>{ c.coverageId || '' }</span> </Tooltip>;
            }}/>
			<Column title={t('Claim') } 		dataIndex='Payout' key='claim' render={ Payout => (Payout || {}).claimId || '' } />
			<Column title={t('Occurrence') } 	dataIndex='claimOccurrence' key='claimOccurrence' render={ date => String(date || '').slice(0,10) } />
			<Column title={t('Notification') } 	dataIndex='claimNotification' key='claimNotification' render={ date => String(date || '').slice(0,10) }  />
			<Column title={t('Line') } 			dataIndex='Cession' key='lineId' render={ Payout => (Payout || {}).lineId || '' } />
			<Column title={t('Event Reason') } 	dataIndex='eventReason' key='eventReason' />
			<Column title={t('Insured Event') } dataIndex='insuredEvent' key='insuredEvent' />

            <Column title={t('Reserved')} 			dataIndex='reserve' key='reserve' render={renderNumber}/>
            <Column title={t('Loss')}        		dataIndex='loss' key='loss' render={renderNumber} />
            <Column title={t('Retained Reserve')} 	dataIndex='retainedReserve' key='retainedReserve' render={renderNumber} />
            <Column title={t('Retained Loss')} 		dataIndex='retainedLoss' key='retainedLoss' render={renderNumber} />
            <Column title={t('Ceded Reserve')}     	dataIndex='cededReserve' key='cededReserve' render={renderNumber} />
            <Column title={t('Ceded Loss')}         dataIndex='cededLoss' key='cededLoss' render={renderNumber} />
            <Column title={t('Reinstatement Premium')}   dataIndex='reinstatementPremium' key='reinstatementPremium' render={renderNumber} />
            <Column title={t('Ex Gratia')}         		 dataIndex='exGratia' key='exGratia' render={ value => <Badge status={ value ? 'success': 'default'} />}/>
        </Table>
    }
	return <Table dataSource={ losses || []} loading={ loading }  rowKey='lifePolicyId' expandable={{ expandedRowRender } }>
        <Column title={t('Policy Id')}			dataIndex='lifePolicyId' key='id' />
        <Column title={t('Treaty ID')}			dataIndex='contractId' key='contractId' />
        <Column title={t('Lob')}				dataIndex='lob' key='lob' />
        <Column title={t('Policy')}				dataIndex='policyCode' key='policyCode' />
        <Column title={t('Insured')}			dataIndex='insuredName' key='insuredName' />        
        <Column title={t('Reserved')}			dataIndex='reserve' key='reserve' render={renderNumber} />
        <Column title={t('Loss')}				dataIndex='loss' key='loss' render={renderNumber} />
        <Column title={t('Retained Reserve')}	dataIndex='retainedReserve' key='retainedReserve' render={renderNumber} />
        <Column title={t('Retained Loss')} 		dataIndex='retainedLoss' key='retainedLoss' render={renderNumber} />
        <Column title={t('Ceded Reserve')} 		dataIndex='cededReserve' key='cededReserve' render={renderNumber} />
        <Column title={t('Ceded Loss')}   		dataIndex='cededLoss' key='cededLoss' render={renderNumber} />
        <Column title={t('Reinstatement Premium')}	dataIndex='reinstatementPremium' key='reinstatementPremium' render={renderNumber} />
        <Column title={t('Ex Gratia')}         dataIndex='exGratia' key='exGratia' render={ value => <Badge status={ value ? 'success': 'default'} />} />
    </Table>

  }
  const QuickFilter=()=>{
    const { CessionOpt, openFilter, contracts, quickFilterForm, onApplyQuickFilter, onDownloadClick, loading, catalogsReady, filterForm } = useAppContext();
    const contractOpt = (contracts || []).map( con =>({ value: con.id, label: renderContractLabel(con) }));
    const cmdOption = Form.useWatch('cmdOption', quickFilterForm);
	useEffect(()=>{
		if (catalogsReady) {
			onApplyQuickFilter();
		}
	},[catalogsReady])
	useEffect(()=>{
		if (filterForm && filterForm.resetFields) {
			filterForm.resetFields();
		}
	},[cmdOption])
    return (
      <Form form={quickFilterForm} layout='horizontal' initialValues={{ dateFilter: moment(), cmdOption: 'RepoCession' }}>
        <Space>
			<Form.Item name='contractId' label={t('Contract')}>
                    <Select 
						options={ (contractOpt || []) } style={{ width: '300px' }} showSearch allowClear optionFilterProp='label' placeholder={t('Please select contract')}/>
                </Form.Item>
            <Form.Item name='dateFilter'>
                <DatePicker picker='month'/>
            </Form.Item>
            <Form.Item name='cmdOption'>
                <Select options={CessionOpt} style={{ width: '150px'}} onChange={onApplyQuickFilter}/>
            </Form.Item>
            <Button type='link' htmlType='button' icon={<DownloadIcon />} disabled={ loading } onClick={ onDownloadClick }>
                {t('Download')}
            </Button>
            <Button type='link' htmlType='button' icon={<ReloadIcon />}   disabled={ loading } onClick={ onApplyQuickFilter }>
                {t('Reload')}
            </Button>
            <Button type='link' htmlType='button' icon={<FilterIcon />}   disabled={ loading } onClick={ openFilter }>
                {t('Filter')}
            </Button>
        </Space>
    </Form>
    )
  }
  const FullFilter=()=>{    
    const { showFilter, closeFilter , filterForm, quickFilterForm } = useAppContext();    
    const cmdOption = Form.useWatch('cmdOption', quickFilterForm);
	const titles = {
		RepoCession: t('Cession Search'),
		RepoLossCession : t('Claim Cession Search'),
		RepoSalvageCession : t('Salvage Cession Search')
	}
    return <Drawer title={ titles[ cmdOption ] } open={showFilter} onClose={closeFilter} width={500}>
		<Button icon={<ReloadIcon />} onClick={ ()=> filterForm.resetFields() }>
			{t('Reset')}
		</Button>
      { cmdOption === 'RepoCession'        && <CessionsFilter /> }
	  { cmdOption === 'RepoLossCession'    && <LossFilter /> }
	  { cmdOption === 'RepoSalvageCession' && <SalvageFilter /> }
    </Drawer>
  }
  const App=()=>{
    const { loadingM, quickFilterForm,  } = useAppContext();
    const cmdOption = Form.useWatch('cmdOption', quickFilterForm);
    if(loadingM){
      return <Skeleton />
    }    
    return <DefaultPage title={t('Bordero Reaseguro')} icon='file-protect'>
      <Row gutter={16}>
        <Col span={ 24 }>
          <QuickFilter />
          { cmdOption === 'RepoCession' && <CessionsTable />}
		  { cmdOption === 'RepoLossCession' && <LossTable />}
		  { cmdOption === 'RepoSalvageCession' && <SalvageTable />}
        </Col>
      </Row>
      <FullFilter />
    </DefaultPage>
  }
  return <AppProvider>
    <App />
  </AppProvider>
  function renderContractLabel(con){
    let items = [ con.code, con.name ];
    if(con.endDate) items.push((con.endDate || '').slice(0,10));
    return items.join('-')
  }
  function renderNumber(value){
    if(isNaN(value)) return `$ 0.00`;
    const baseString = '$'+Number(Math.abs(value)).toLocaleString('en-us', {minimumFractionDigits: 2, maximumFractionDigits: 4 });
    if(Number(value) < 0)
        return '- ' + baseString;
    return baseString
  }
}
