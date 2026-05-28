()=>{
  const { useState, useEffect, createContext, useContext } = React;
  const { Table, Select, Button, DatePicker, Skeleton, Space, Row, Col, Drawer, Form, Tabs, message, Input, InputNumber, Checkbox, Badge, Empty, Tooltip } = A;
  const { Column } = Table;
  const { RangePicker } = DatePicker;
  const SearchIcon   =()=><span role="img" aria-label="search" class="anticon anticon-search"><svg viewBox="64 64 896 896" focusable="false" data-icon="search" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"></path></svg></span>
  const DownloadIcon =()=><span role='img' aria-label='download' class='anticon anticon-download'><svg viewBox='64 64 896 896' focusable='false' data-icon='download' width='1em' height='1em' fill='currentColor' aria-hidden='true'><path d='M505.7 661a8 8 0 0012.6 0l112-141.7c4.1-5.2.4-12.9-6.3-12.9h-74.1V168c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v338.3H400c-6.7 0-10.4 7.7-6.3 12.9l112 141.8zM878 626h-60c-4.4 0-8 3.6-8 8v154H214V634c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v198c0 17.7 14.3 32 32 32h684c17.7 0 32-14.3 32-32V634c0-4.4-3.6-8-8-8z'></path></svg></span>;
  const ReloadIcon   =()=><span role='img' aria-label='reload' class='anticon anticon-reload'><svg viewBox='64 64 896 896' focusable='false' data-icon='reload' width='1em' height='1em' fill='currentColor' aria-hidden='true'><path d='M909.1 209.3l-56.4 44.1C775.8 155.1 656.2 92 521.9 92 290 92 102.3 279.5 102 511.5 101.7 743.7 289.8 932 521.9 932c181.3 0 335.8-115 394.6-276.1 1.5-4.2-.7-8.9-4.9-10.3l-56.7-19.5a8 8 0 00-10.1 4.8c-1.8 5-3.8 10-5.9 14.9-17.3 41-42.1 77.8-73.7 109.4A344.77 344.77 0 01655.9 829c-42.3 17.9-87.4 27-133.8 27-46.5 0-91.5-9.1-133.8-27A341.5 341.5 0 01279 755.2a342.16 342.16 0 01-73.7-109.4c-17.9-42.4-27-87.4-27-133.9s9.1-91.5 27-133.9c17.3-41 42.1-77.8 73.7-109.4 31.6-31.6 68.4-56.4 109.3-73.8 42.3-17.9 87.4-27 133.8-27 46.5 0 91.5 9.1 133.8 27a341.5 341.5 0 01109.3 73.8c9.9 9.9 19.2 20.4 27.8 31.4l-60.2 47a8 8 0 003 14.1l175.6 43c5 1.2 9.9-2.6 9.9-7.7l.8-180.9c-.1-6.6-7.8-10.3-13-6.2z'></path></svg></span>;
  const FilterIcon   =()=><span role='img' aria-label='filter' class='anticon anticon-filter'><svg viewBox='64 64 896 896' focusable='false' data-icon='filter' width='1em' height='1em' fill='currentColor' aria-hidden='true'><path d='M880.1 154H143.9c-24.5 0-39.8 26.7-27.5 48L349 597.4V838c0 17.7 14.2 32 31.8 32h262.4c17.6 0 31.8-14.3 31.8-32V597.4L907.7 202c12.2-21.3-3.1-48-27.6-48zM603.4 798H420.6V642h182.9v156zm9.6-236.6l-9.5 16.6h-183l-9.5-16.6L212.7 226h598.6L613 561.4z'></path></svg></span>;
  const AppContext = createContext({});
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
        let saveData = actionToPerform.save
        setcmdOption(cmdOption);
        saveData([]);
        let filter = [];
        if(contractId && contractId > 0)
          filter.push(`contractId=${ contractId }`);
        if(cmdOption === 'RepoCession') filter.push('overwritten=0')
        if(dateFilter){
          const [year, month ] = new Date(dateFilter).toISOString().slice(0,10).split('-');
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

    let timeOut, currentValue;
    async function fetchPol(value, callback){
      if (timeOut) {
        clearTimeout(timeOut);
        timeOut = null;
      }
      currentValue = value;
      async function fetch(){
        exe('RepoLifePolicy',{operation:'GET', filter:`[code] LIKE '${ value }%' AND active=1`, size: 15 }).then( response => {
          if(currentValue != value){
            return callback([]);
          }
          const mapped = response.outData.map(pol => ({value: pol.id, label: pol.code }));
          callback(mapped)          
        })
      }
      timeOut = setTimeout(fetch, 500)      
    }
    async function fetchContact(value, callback){
      if (timeOut) {
        clearTimeout(timeOut);
        timeOut = null;
      }
      currentValue = value;
      async function fetch(){
        let filterString = `(((RTRIM(ISNULL([name],''))+' '+RTRIM(ISNULL(surname1,''))+' '+RTRIM(ISNULL(surname2,''))) like N'%${ value }%')) and [inactive]=0`
        exe('GetContacts',{operation:'GET', filter:filterString, size: 10 }).then( response => {
          if(currentValue != value){
            return callback([]);
          }
          const mapped = response.outData.map(con => ({value: con.id, label: con.FullName }));
          callback(mapped)          
        })
      }
      timeOut = setTimeout(fetch, 500)      
    }
    async function fetchCession( quickFilter = null  ){
		setCessions([]);
        //debugger;
        const filter = quickFilter || await getCessionsFilter();

        if(!filter){
            message.error('Debe seleccionar al menos un filtro para la búsqueda');
            return;
        }

        const response = await exe('RepoCession',{ operation:'GET', filter });
        if(!response.ok) throw new Error(response.msg);
        
        // Group by policy
        const grouped = response.outData.reduce((group, cession) => {

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

            if (groupIndex >= 0) {

                const pol = group[groupIndex];

                pol.cessions = (pol.cessions || []);
                pol.cessions.push(cession);

                // Max values
                pol.premium = Math.max(pol.premium, cession.premium);
                pol.sumInsured = Math.max(pol.sumInsured, cession.sumInsured);
                pol.sumInsuredComputed = Math.max(pol.sumInsuredComputed, cession.sumInsuredComputed);

                // Totals
                pol.sumInsuredCedant += cession.sumInsuredCedant;
                pol.sumInsuredRe += cession.sumInsuredRe;
                pol.tax += cession.tax;
                pol.premiumCedant += cession.premiumCedant;
                pol.premiumRe += cession.premiumRe;
                pol.comissionCedant += cession.comissionCedant;
                pol.comissionCedantExtra += cession.comissionCedantExtra;

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

                    premium: cession.premium,
                    sumInsured: cession.sumInsured,
                    sumInsuredComputed: cession.sumInsuredComputed,

                    sumInsuredCedant: cession.sumInsuredCedant,
                    sumInsuredRe: cession.sumInsuredRe,

                    tax: cession.tax,

                    premiumCedant: cession.premiumCedant,
                    premiumRe: cession.premiumRe,

                    comissionCedant: cession.comissionCedant,
                    comissionCedantExtra: cession.comissionCedantExtra,

                    cessions: [cession]
                };

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
		const response = await exe('RepoLossCession',{ operation:'GET', filter, include:['Cessions','Payout'] });
		if(!response.ok) throw new Error(response.msg);		
		const grouped = response.outData.reduce((group, loss)=> {
			const policyId = loss.Cession.lifePolicyId,
			      LoB      = loss.Cession.LoB;
            const groupIndex = group.findIndex(pol => pol.lifePolicyId === policyId );
            if(groupIndex >= 0){
                const pol = group[groupIndex];
                pol.cessions = (pol.cessions || []);
                pol.cessions.push(loss);
                // Update totals
                pol.reserve += loss.reserve
                pol.loss += loss.loss;
                pol.retainedReserve += loss.retainedReserve;
                pol.retainedLoss += loss.retainedLoss;
                pol.cededReserve += loss.cededReserve;
                pol.cededLoss += loss.cededLoss;
                pol.reinstatementPremium += loss.reinstatementPremium;
                group[groupIndex] = pol;
            } else {
                const newPol = {
                    lifePolicyId: policyId,
                    contractId: loss.contractId,
                    lob: LoB,
                    policyCode: loss.Cession.policyCode,
                    insuredName: String(loss.insuredName || loss.holderName).trim(),
                    reserve: loss.reserve, 
                    loss: loss.loss,
                    retainedReserve: loss.retainedReserve,
                    retainedLoss: loss.retainedLoss,
                    cededReserve: loss.cededReserve,
                    cededLoss: loss.cededLoss,
                    reinstatementPremium: loss.reinstatementPremium,
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
        const response = await exe('RepoSalvageCession',{ operation:'GET', filter, include:['Cessions','Payout'] });
        if(!response.ok) throw new Error(response.msg);
        const grouped = response.outData.reduce((group, salvage)=>{
          const groupIndex = group.findIndex( pol => pol.policyCode === salvage.policyCode);
          if(groupIndex >= 0){
              const pol = group[groupIndex];
              pol.cessions = (pol.cessions || []);
              pol.cessions.push(loss);
              // summary
              pol.income += salvage.income;
              pol.retainedAmount += salvage.retainedAmount;
              pol.cededAmount += salvage.cededAmount;
              group[groupIndex] = pol;
            
          } else {
              let newPol = {
                  contractId: salvage.contractId,
                  LoB: salvage.LoB,
                  policyCode: salvage.policyCode,
                  insuredName: salvage.insuredName,
                  currency: salvage.currency,
                  income: salvage.income,
                  retainedAmount: salvage.retainedAmount,
                  cededAmount: salvage.cededAmount,
                  cessions: [ salvage ],
              }
              group.push(newPol);
          }
          return group;
        },[]);
        setSalvages(grouped)
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
    
    async function getCessionsFilter() {
        //debugger;
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
          const [year, month] = new Date(value)
            .toISOString()
            .slice(0, 10)
            .split('-');

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
          return `[start] BETWEEN '${ from.toISOString().slice(0,10)}' AND '${ to.toISOString().slice(0,10)}'`
        },
        creationRange: value => {
          if(!value) return null;
          let [ from, to ] = value;
          from = from.toISOString().slice(0,10);
          to = to.toISOString().slice(0,10);
          return `premiumType='NEW' AND lifepolicyId in (SELECT id FROM LifePolicy WHERE created between '${ from }' AND  '${ to }') OR
                  premiumType='ANNIVERSARY' AND anniversaryId in (SELECT id FROM Anniversary WHERE created between '${ from }' AND  '${ to }') OR
              premiumType='CHANGE' AND changeId in (SELECT id FROM Change WHERE creationDate between '${ from }' AND  '${ to }')`
        },
        policyId: value => {
          if(!value) return null;
          return `lifepolicyId in (${ value })`
        },
        policyStart: value => {
          if(!value) return null;
          let [ from, to ] = value;
          from = from.toISOString().slice(0,10);
          to = to.toISOString().slice(0,10);
          return `lifepolicyId in (SELECT id FROM LifePolicy WHERE [start] between '${ from }' AND '${ to }')`
        },
        policyEnd: value => {
          if(!value) return null;
          let [ from, to ] = value;
          from = from.toISOString().slice(0,10);
          to = to.toISOString().slice(0,10);
          return `lifepolicyId in (SELECT id FROM LifePolicy WHERE [end] between '${ from }' AND '${ to }')`
        },
        policyStatus: (value) => {
          if (value === -1) return null;
          return `lifepolicyId IN (SELECT id FROM LifePolicy WHERE active=${value})`;
        },

        productCode: (value) =>
          `lifepolicyId IN (SELECT id FROM LifePolicy WHERE productCode='${String(value).trim()}')`,

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
          if (!isNaN(value) && Number(value) > 0) {
            return `${key}=${value}`;
          }

          // Strings
          return `${key}='${String(value).trim()}'`;
        })
        .filter(Boolean);

      return filters.join(' AND ');
    }
    async function getLossFilter() {
      const values = await filterForm.validateFields();
      const isValid = (val) =>
        val !== null &&
        val !== undefined &&
        String(val).trim().length > 0;

      const handlers = {
        date: (value) => {
          const [year, month] = new Date(value)
            .toISOString()
            .slice(0, 10)
            .split('-');

          return `YEAR([claimOccurrence])=${Number(year)} AND MONTH([claimOccurrence])=${Number(month)}`;
        },
        range: value =>{
          if(!value) return null;
          const [ from , to ] = value;
          return `[claimOccurrence] BETWEEN '${ from.toISOString().slice(0,10)}' AND '${ to.toISOString().slice(0,10)}'`
        },
        creationRange: value => {
          if(!value) return null;
          let [ from, to ] = value;
          from = from.toISOString().slice(0,10);
          to = to.toISOString().slice(0,10);
          return `lifeCoveragePayoutId in (SELECT id FROM LifeCoveragePayout WHERE date between '${ from }' AND '${ to }')`
        },
        policyId: value => `cessionId in (SELECT id FROM cession WHERE lifepolicyId=${ value })`,
        holderId: value => `cessionId in (SELECT id FROM cession WHERE lifepolicyId in (SELECT id FROM LifePolicy WHERE holderId=${ value }))`,
        lob: value => `cessionId in (SELECT id FROM cession WHERE LoB='${ value }')`,
        coverageCode: value => `cessionId in (SELECT id FROM cession WHERE coverageCode='${ value }')`,
        policyId: value => `cessionId in (SELECT id FROM cession WHERE lifepolicyId=${ value})`,
        claimId: value => `lifeCoveragePayoutId in (SELECT id FROM LifeCoveragePayout WHERE claimId=${ value })`,
        lineId: value => `cessionId in (SELECT id FROM cession WHERE lineId='${ value }')`,
        sa: (value) => {
          const opt = compareOptions.find(item => item.value === value.compare);
          if (!opt) return null;

          if (opt.value !== '||') {
            return `cessionId in (SELECT id FROM cession WHERE sumInsured ${opt.value} ${value.value})`
          }
          return `cessionId in (SELECT id FROM cession WHERE sumInsured BETWEEN ${value.value} AND ${value.upperValue})`	
        },
        participantId: value => `id in (select cessionId from LossCessionPart where contactId=${ value })`,
        FAC: (value) => value ? `cessionId in (SELECT id in cession WHERE lineId='FAC')` : null,
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
          if (!isNaN(value) && Number(value) > 0) {
            return `${key}=${value}`;
          }

          // Strings
          return `${key}='${String(value).trim()}'`;
        })
        .filter(Boolean);

      return filters.join(' AND ');
    }
    async function getSalvageFilter() {
      const values = await filterForm.validateFields();
      const isValid = (val) =>
        val !== null &&
        val !== undefined &&
        String(val).trim().length > 0;

      const handlers = {
        date: (value) => {
          const [year, month] = new Date(value)
            .toISOString()
            .slice(0, 10)
            .split('-');

          return `YEAR([claimOccurrence])=${Number(year)} AND MONTH([claimOccurrence])=${Number(month)}`;
        },
        range: value =>{
          if(!value) return null;
          const [ from , to ] = value;
          return `[claimOccurrence] BETWEEN '${ from.toISOString().slice(0,10)}' AND '${ to.toISOString().slice(0,10)}'`
        },
        policyId: value => `cessionId in (SELECT id FROM cession WHERE lifepolicyId=${ value })`,
        holderId: value => `cessionId in (SELECT id FROM cession WHERE lifepolicyId in (SELECT id FROM LifePolicy WHERE holderId=${ value }))`,
        lob: value => `cessionId in (SELECT id FROM cession WHERE LoB='${ value }')`,
        coverageCode: value => `cessionId in (SELECT id FROM cession WHERE coverageCode='${ value }')`,
        policyId: value => `cessionId in (SELECT id FROM cession WHERE lifepolicyId=${ value})`,
        claimId: value => `lifeCoveragePayoutId in (SELECT id FROM LifeCoveragePayout WHERE claimId=${ value })`,
        lineId: value => `cessionId in (SELECT id FROM cession WHERE lineId='${ value }')`,
        participantId: value => `id in (select cessionId from LossCessionPart where contactId=${ value })`,
      };

      const filters = Object.entries(values)
        .map(([key, value]) => {
          if (!isValid(value)) return null;

          // Custom handler
          if (handlers[key]) {
            return handlers[key](value);
          }

          // Numbers
          if (!isNaN(value) && Number(value) > 0) {
            return `${key}=${value}`;
          }

          // Strings
          return `${key}='${String(value).trim()}'`;
        })
        .filter(Boolean);

      return filters.join(' AND ');
    }      

    async function dataToXLSX( data, docName ){
        if(typeof XLSX === 'undefined'){
            message.error('No es posible crear un archivo de excel en este momento');
            return;
        }
        if(!data || data.length === 0 ){
            message.info('No hay datos para exportar');
            return;
        }
        const fileName = `${ docName }-${ new Date().getTime() }.xlsx`;
        // Clean data.
        const groupedData = (data || []).map( row => ({...row, cessions: null }));
        const cessions = (data || []).reduce((summary, row) => [...summary, ...row.cessions],[]);
        /* create worksheet */
        const ws1 = XLSX.utils.json_to_sheet(groupedData);
        const ws2 = XLSX.utils.json_to_sheet(cessions);
        /* create workbook and export */
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws1, 'Grouped By Policy');
        XLSX.utils.book_append_sheet(wb, ws2, 'Cessions');
        XLSX.writeFile(wb, fileName);
    }
    function onDownloadClick(){
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
            dataToXLSX( dataMapping[cmdOption].data || [], `Reporte de ${ dataMapping[cmdOption].title }` );
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false);
        }
    }
    const value = {
      loading, loadingM, setLoading,
      CessionOpt, filterForm, contracts,
      showFilter, openFilter, closeFilter,
      fetchPol, onApplyFilter, fetchContact,
      cessions, products, lobs,currencies,
      compareOptions, quickFilterForm, onApplyQuickFilter,
	  losses, salvages, onDownloadClick
    }
    useEffect(()=>{
      if( typeof moment === 'undefined'){
        exe('ExeChain',{ chain:'cmdLoadLibrariesGroupedBordereau', context:'{}'}).then( response => {
          if(!response.ok) throw new Error(response.msg)
          const { outData:{ momentJs, XLSX }} = response;
          eval(momentJs);
          eval(XLSX);
          setLoadingM(false);
        })
      }else {
        setLoadingM(false);
      }
      // if(typeof moment === 'undefined'){
      //   $.get('https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.30.1/moment-with-locales.min.js').done(function(m){
      //     eval(m);
      //     moment.locale('es')
      //     setLoadingM(false);
      //   })
      // }else{
      //   moment.locale('es');
      //   setLoadingM(false);
      // }
      // if(typeof XLSX === 'undefined'){
      //   $.get('https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.mini.min.js')
      //    .done( response => eval(response))
      // }
      // Load Contract.
      exe('LoadEntities',{ entity:'Contract', fields:'id,code,name,endDate'})
      .then( response => setContracts(response.outData));
      exe('RepoLob',{ operation:'GET'}).then( response => {
        const opt = response.outData.map( lob => ({ value: lob.code, label: lob.name }));
        setLobs(opt);
      });
      exe('GetProducts',{ }).then( response => {
        const opt = response.outData.map( pro => ({ value: pro.code, label: pro.name, parent: pro.lobCode }));
        setProducts(opt);
      })
      exe('RepoCurrency',{ operation:'GET', filter:`enabled=1`}).then( response => setCurrencies(response.outData || []))
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
                    <Form.Item name='policyId' label={t('Policy Id')}>
                        <InputNumber />
                    </Form.Item>
                    <Form.Item name='contractId' label={t('Treaty Id')}>
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
			<Form.Item name='policyId' label={t('Policy Id')}>
				<InputNumber />
			</Form.Item>
			<Form.Item name='claimId' label={t('Claim Id')}>
				<InputNumber />
			</Form.Item>
			<Form.Item name='Treaty Id' label={t('Treaty Id')}>
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
        <Form.Item name='policyId' label={t('Policy Id')}>
          <InputNumber />
        </Form.Item>
        <Form.Item name='salvageId' label={t('Salvage Id')}>
          <InputNumber />
        </Form.Item>
        <Form.Item name='Treaty Id' label={t('Treaty Id')}>
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
            <Column title={t('Coverage')} 		dataIndex='Cession' key='coverageId' render={ (Cession) => <Tooltip title={ Cession.cover }><span>{ Cession.coverageId }</span> </Tooltip>}/>
			<Column title={t('Claim') } 		dataIndex='Payout' key='claim' render={ Payout => Payout.claimId } />
			<Column title={t('Occurrence') } 	dataIndex='claimOccurrence' key='claimOccurrence' render={ date => String(date).slice(0,10) } />
			<Column title={t('Notification') } 	dataIndex='claimNotification' key='claimNotification' render={ date => String(date).slice(0,10) }  />
			<Column title={t('Line') } 			dataIndex='Cession' key='lineId' render={ Payout => Payout.lineId } />
			<Column title={t('Event Reason') } 	dataIndex='eventReason' key='eventReason' />
			<Column title={t('Insured Event') } dataIndex='insuredEvent' key='insuredEvent' />

            <Column title={t('Reserved')} 			dataIndex='coverageDeductible' key='coverageDeductible' render={renderNumber}/>
            <Column title={t('Loss')}        		dataIndex='reserve' key='reserve' render={renderNumber} />
            <Column title={t('Retained Reserve')} 	dataIndex='loss' key='loss' render={renderNumber} />
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
    const { CessionOpt, openFilter, contracts, quickFilterForm, onApplyQuickFilter, onDownloadClick, loading } = useAppContext();
    const contractOpt = (contracts || []).map( con =>({ value: con.id, label: renderContractLabel(con) }));
	useEffect(()=>{
		onApplyQuickFilter();
	},[])
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
		RepoCession: 'Cession Search',
		RepoLossCession :'Claim Cession Search',
		RepoSalvageCession : 'Salvage Cession Search'
	}
    return <Drawer title={ titles[ cmdOption ] } open={showFilter} onClose={closeFilter} width={500}>
		<Button icon={<ReloadIcon />} onClick={ ()=> filterForm.resetFields() }>
			Reset
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