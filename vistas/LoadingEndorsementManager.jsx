/**
 * @component LoadingEndorsementManager
 * @version 1.0.0
 * @author Noel Obando
 * 
 * @description
 * Manages the creation and modification of loadings (extra premiums or discounts)
 * for an issued life insurance policy through an endorsement process.
 */
()=>{
    const PlusIcon  =()=><span role='img' aria-label='plus'   class='anticon anticon-plus'><svg viewBox='64 64 896 896' focusable='false' data-icon='plus' width='1em' height='1em' fill='currentColor' aria-hidden='true'><path d='M482 152h60q8 0 8 8v704q0 8-8 8h-60q-8 0-8-8V160q0-8 8-8z'></path><path d='M192 474h672q8 0 8 8v60q0 8-8 8H160q-8 0-8-8v-60q0-8 8-8z'></path></svg></span>
    const PencilIcon=()=><span role='img' aria-label='edit'   class='anticon anticon-edit'><svg viewBox='64 64 896 896' focusable='false' data-icon='edit' width='1em' height='1em' fill='currentColor' aria-hidden='true'><path d='M257.7 752c2 0 4-.2 6-.5L431.9 722c2-.4 3.9-1.3 5.3-2.8l423.9-423.9a9.96 9.96 0 000-14.1L694.9 114.9c-1.9-1.9-4.4-2.9-7.1-2.9s-5.2 1-7.1 2.9L256.8 538.8c-1.5 1.5-2.4 3.3-2.8 5.3l-29.5 168.2a33.5 33.5 0 009.4 29.8c6.6 6.4 14.9 9.9 23.8 9.9zm67.4-174.4L687.8 215l73.3 73.3-362.7 362.6-88.9 15.7 15.6-89zM880 836H144c-17.7 0-32 14.3-32 32v36c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-36c0-17.7-14.3-32-32-32z'></path></svg></span>
    const BackIcon  =()=><span role='img' aria-label='left'   class='anticon anticon-left'><svg viewBox='64 64 896 896' focusable='false' data-icon='left' width='1em' height='1em' fill='currentColor' aria-hidden='true'><path d='M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 000 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z'></path></svg></span>
    const SaveIcon  =()=><span role='img' aria-label='save'   class='anticon anticon-save'><svg viewBox='64 64 896 896' focusable='false' data-icon='save' width='1em' height='1em' fill='currentColor' aria-hidden='true'><path d='M893.3 293.3L730.7 130.7c-7.5-7.5-16.7-13-26.7-16V112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V338.5c0-17-6.7-33.2-18.7-45.2zM384 184h256v104H384V184zm456 656H184V184h136v136c0 17.7 14.3 32 32 32h320c17.7 0 32-14.3 32-32V205.8l136 136V840zM512 442c-79.5 0-144 64.5-144 144s64.5 144 144 144 144-64.5 144-144-64.5-144-144-144zm0 224c-44.2 0-80-35.8-80-80s35.8-80 80-80 80 35.8 80 80-35.8 80-80 80z'></path></svg></span>
    const DeleteIcon=()=><span role='img' aria-label='delete'class='anticon anticon-delete'><svg viewBox='64 64 896 896' focusable='false' data-icon='delete' width='1em' height='1em' fill='currentColor' aria-hidden='true'><path d='M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z'></path></svg></span>
    const FolderIcon=()=><svg viewBox='0 0 24 24' width='14' height='14' aria-hidden='true' focusable='false'><path fill='currentColor' d='M3 5.5A1.5 1.5 0 0 1 4.5 4h5l2 2h8A1.5 1.5 0 0 1 21 7.5v11A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5v-13Zm2 2v10.5h14V8.5h-8.33l-2-2H5Z'/></svg>
    const { Table, Button, Modal, Empty, Form, Select, Switch, Input, InputNumber, Row, Col, Space, message, notification, Checkbox, Tooltip, Typography, DatePicker, Tabs, Alert, Tag } = A;
    const { Text } = Typography;
    const { Column } = Table;
    const { confirm } = Modal;
    const { useState, useEffect, useContext, createContext, useRef } = React;
    const AppContext = createContext({});
    const useAppContext = ()=> useContext(AppContext);
    let effectiveDate = new Date().toISOString().slice(0,10);
    const reinsuranceConfigTableByLob = {
        '96':'cfgCoberturaProductoReaTecnicos',
        '20':'cfgCoberturaProductoReaVidaColectivo',
        '31':'cfgCoberturaProductoReaVida',
        '52':'cfgCoberturaProductoReaRiesgosVarios',
        '1':'cfgCoberturaProductoRea',
        '6':'cfgCoberturaProductoReaAuto',
        '81':'cfgCoberturaProductoReaFianza',
        '82':'cfgCoberturaProductoReaFianza',
        '83':'cfgCoberturaProductoReaFianza',
        '84':'cfgCoberturaProductoReaFianza'
    };
    const reinsuranceConfigTable = lob => reinsuranceConfigTableByLob[String(lob || '')] || 'cfgCoberturaProductoRea';
    /**
     * @function AppProvider
     * @version 1.0.0
     * @author Noel Obando
     * @description Context provider that manages the state and business logic for policy coverages and loadings (extra premiums).
     * Handles data retrieval, modal state, form interactions, and loading operations.
     * 
     * @param {Object} props
     * @param {React.ReactNode} props.children - Child components
     * 
     * @returns {JSX.Element} Context provider wrapping the application
     * 
     * @throws {Error} When API calls fail or form validation errors occur
     * 
     * @example
     * <AppProvider>
     *   <App />
     * </AppProvider>
     */
    const AppProvider=({ children })=>{
        const policyId = getPolicyId();
        const [ isPolicyActive, setisActive ] = useState(false);
        const [ policyStart, setPolicyStart ] = useState(null);
        const [ riskTypes, setRiskTypes ] = useState([]);
        const [ Coverages, setCover ] = useState([]);
        const [ coverages, setCoverages ] = useState([]);
        const [ loadingCov, setLoadingCov ] = useState(false);
        const [ isModalOpen, setIsModalOpen ] = useState(false);
        const [ selectedCov, setSelectCov ] = useState(null);
        const [ menuAction, setMenuAction ] = useState(0);
        const [ selected, setSelected ] = useState(null);
        const [ hasPendingLoadingChanges, setHasPendingLoadingChanges ] = useState(false);
        const [ form ] = Form.useForm()
        const [endorsementReason, setEndorsementReason] = useState('');
        const initializedRef = useRef(false);
        // The distribution editor uses the same source data as the surety
        // endorsement so that its confirmed snapshot can be persisted exactly.
        const [policySnapshot, setPolicySnapshot] = useState(null);
        const [baseCessions, setBaseCessions] = useState([]);
        const [coinsuranceCessions, setCoinsuranceCessions] = useState([]);
        const [coverageReinsuranceConfig, setCoverageReinsuranceConfig] = useState({});
        const [reinsuranceBrokers, setReinsuranceBrokers] = useState([]);
        const [reinsuranceContacts, setReinsuranceContacts] = useState([]);
        const [coinsuranceContacts, setCoinsuranceContacts] = useState([]);
        const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('loadings');
        const [selectedReinsuranceKey, setSelectedReinsuranceKey] = useState(null);
        const [reinsuranceDetailTab, setReinsuranceDetailTab] = useState('movement');
        const [reinsuranceSimulation, setReinsuranceSimulation] = useState(null);
        const [reinsuranceDraft, setReinsuranceDraft] = useState(null);
        const [reinsuranceCalculating, setReinsuranceCalculating] = useState(false);
        const [reinsuranceConfirmed, setReinsuranceConfirmed] = useState(false);
        const [reinsurersReady, setReinsurersReady] = useState(false);
        const [selectedReinsurerLine, setSelectedReinsurerLine] = useState(null);

        const closeModal=()=> {
            setIsModalOpen(false);
            setSelectCov(null);
            setMenuAction(0);
            setSelected(null);
            setHasPendingLoadingChanges(false);
        }
        const onModalSubmit=()=>{
            if(menuAction === 1 && hasPendingLoadingChanges){
                message.warning('Tiene cambios pendientes de guardar. Use Guardar el recargo/descuento antes de cerrar la ventana.');
                return;
            }
            closeModal()
        }
        const requestCloseModal=()=>{
            if(menuAction === 1 && hasPendingLoadingChanges){
                message.warning('Tiene cambios pendientes de guardar. Use Guardar el recargo/descuento antes de cerrar la ventana.');
                return;
            }
            closeModal();
        }
        const openModal=( cov )=>{
            setSelectCov(cov);
            setIsModalOpen(true);
            setHasPendingLoadingChanges(false);
        }
        const showLoadingForm=( loading )=>{
            setSelected(loading);
            setMenuAction(1);
            setHasPendingLoadingChanges(false);
        }
        const hideLoadingForm=()=>{
            setMenuAction(0);
            setSelected(null);
            setHasPendingLoadingChanges(false);
        }
        const requestHideLoadingForm=()=>{
            if(hasPendingLoadingChanges){
                message.warning('Tiene cambios pendientes de guardar. Use Guardar el recargo/descuento antes de retornar.');
                return;
            }
            hideLoadingForm();
        }
        /**
         * @function onAddLoading
         * @version 1.0.0
         * @author Noel Obando
         * @description Adds a new loading to the selected coverage or all coverages based on user input.
         * Performs form validation and updates state immutably.
         * 
         * @async
         * @returns {Promise<void>}
         * 
         * @throws {Error} When form validation fails
         */
        async function onAddLoading(){

            try {

                if(!selectedCov || selectedCov == null)
                    return;

                const {
                    riskType,
                    surcharge,
                    discount,
                    surchargeAmount,
                    discountAmount,
                    byAmount,
                    applyAll
                } = await form.validateFields();

                const covloadingId =
                    selected && selected.id
                        ? selected.id
                        : crypto.randomUUID();

                const risk =
                    riskTypes.find(function(item){
                        return item.value === riskType;
                    });

                const RiskType = {
                    code: riskType,
                    name: risk ? risk.label : riskType
                };

                const surchargeValue = Number(
                    (byAmount ? surchargeAmount : surcharge) || 0
                );
                const discountValue = Number(
                    (byAmount ? discountAmount : discount) || 0
                );
                if (!Number.isFinite(surchargeValue) || !Number.isFinite(discountValue)
                    || surchargeValue < 0 || discountValue < 0) {
                    throw 'Recargo y descuento deben ser valores positivos.';
                }
                if (surchargeValue > 0 && discountValue > 0) {
                    throw 'Indique un recargo o un descuento, no ambos a la vez.';
                }
                if (surchargeValue <= 0 && discountValue <= 0) {
                    throw byAmount
                        ? 'Indique un monto de recargo o descuento.'
                        : 'Indique un porcentaje de recargo o descuento.';
                }

                const direction = surchargeValue > 0 ? 1 : -1;
                const enteredValue = surchargeValue > 0 ? surchargeValue : discountValue;
                let loadingPercent = direction * enteredValue;
                let signedFixedAmount = 0;

                if(byAmount){

                    signedFixedAmount = direction * enteredValue;
                    const basePremium = Number(selectedCov.basePremium || 0);

                    if(basePremium <= 0){
                        throw 'La cobertura no tiene prima base.';
                    }

                    loadingPercent =
                        (signedFixedAmount / basePremium) * 100;
                }

                const newLoading = selected
                    ? {
                        ...selected,
                        loading: loadingPercent,
                        riskType,
                        RiskType,
                        byAmount: !!byAmount,
                        fixedAmount: signedFixedAmount,
                        toUpdate: true
                    }
                    : {
                        id: covloadingId,
                        lifeCoverageId: selectedCov.id,
                        riskType,
                        loading: loadingPercent,
                        byAmount: !!byAmount,
                        fixedAmount: signedFixedAmount,
                        start: selectedCov.start,
                        end: selectedCov.end,
                        duration: 1,
                        manual: true,
                        insuredSumBased: false,
                        perMille: false,
                        RiskType
                    };

                const tempCoverages =
                    JSON.parse(JSON.stringify(coverages));

                const index =
                    tempCoverages.findIndex(function(cov){
                        return cov.id === selectedCov.id;
                    });

                if(applyAll){

                    tempCoverages.forEach(function(cov){

                        const id =
                            cov.id === selectedCov.id
                                ? newLoading.id
                                : crypto.randomUUID();

                        const covloadings =
                            cov.Loadings.filter(function(item){
                                return item.id != id;
                            });

                        let loadingToApply =
                            JSON.parse(JSON.stringify(newLoading));

                        if(byAmount){

                            const basePremium =
                                Number(cov.basePremium || 0);

                            loadingToApply.loading =
                                basePremium > 0
                                    ? (loadingToApply.fixedAmount / basePremium) * 100
                                    : 0;

                        }

                        validateCoverageDiscount(
                            cov,
                            loadingToApply.loading,
                            id
                        );

                        cov.Loadings = [
                            ...covloadings,
                            {
                                ...loadingToApply,
                                lifeCoverageId: cov.id,
                                id
                            }
                        ];

                    });

                } else {

                    validateCoverageDiscount(
                        selectedCov,
                        loadingPercent,
                        covloadingId
                    );

                    let currentLoadings =
                        tempCoverages[index].Loadings.filter(function(item){
                            return item.id != covloadingId;
                        });

                    tempCoverages[index].Loadings = [
                        ...currentLoadings,
                        newLoading
                    ];
                }

                setCoverages(tempCoverages);

                const updatedCov =
                    tempCoverages.find(function(cov){
                        return cov.id === selectedCov.id;
                    });

                setSelectCov(updatedCov);

                setHasPendingLoadingChanges(false);
                hideLoadingForm();

            } catch (error) {
                showError(error);
            }
        }
        /**
         * @function removeLoading
         * @version 1.0.0
         * @author Noel Obando
         * @description Removes a selected loading from the current coverage.
         * Updates both global coverages state and selected coverage.
         * 
         * @returns {void}
         */
        const removeLoading=(loading = selected)=>{
            if(!loading){
                return;
            }

            let loadings = [...selectedCov.Loadings];
            const tempCoverages = JSON.parse(JSON.stringify( coverages ));
            if(!isNaN(loading.id)){
                const index = loadings.findIndex(item => item.id === loading.id);
                loadings[index].toRemove = true;                
            } else {
                loadings = selectedCov.Loadings.filter( load => load.id != loading.id );
            }
            const index = tempCoverages.findIndex( cov => cov.id === selectedCov.id );
            tempCoverages[index].Loadings = loadings;
            setCoverages(tempCoverages);
            const updatedCov = tempCoverages.find(cov => cov.id === selectedCov.id);
            setSelectCov(updatedCov);
            setHasPendingLoadingChanges(false);
            hideLoadingForm();
        }
        async function fetchData(){
            try {
                if(!policyId) return;
                setLoadingCov(true)
                const response = await exe('RepoLifePolicy',{ operation:'GET', filter:`id=${ policyId }`, include:['Coverages.Loadings.RiskType','Product']})
                const policy = response.outData && response.outData[0];
                if(!policy) throw 'No fue posible cargar la póliza.';
                const { Coverages, active, start } = policy;
                setCover(Coverages);
                setCoverages(Coverages.filter( cov => cov.basePremium > 0))
                setisActive(active);
                setPolicyStart(start || null);
                setPolicySnapshot(policy);
                const responses = await Promise.all([
                    exe('GetFullTable', { table: reinsuranceConfigTable(policy.lob) }).catch(function(){ return { outData: [] }; }),
                    exe('RepoCession', { operation:'GET', filter:'lifePolicyId=' + policyId + ' AND overwritten=0', size:0 }).catch(function(){ return { outData: [] }; }),
                    exe('RepoCoCession', { operation:'GET', filter:'lifePolicyId=' + policyId + ' AND parentCoCession IS NULL AND overwritten=0', include:['Contact'], size:0 }).catch(function(){ return { outData: [] }; }),
                    exe('LoadEntities', { entity:'Contact', fields:'id,name,middlename,surname1,surname2,isPerson', filter:"exists (select 1 from contactRole r where r.contactId = contact.id and r.role = 'REI')" }).catch(function(){ return { outData: [] }; }),
                    exe('LoadEntities', { entity:'Contact', fields:'id,name,middlename,surname1,surname2,isPerson' }).catch(function(){ return { outData: [] }; }),
                    exe('LoadEntities', { entity:'Contact', fields:'id,name,middlename,surname1,surname2,isPerson', filter:"exists (select 1 from contactRole r where r.contactId = contact.id and r.role = 'COI')" }).catch(function(){ return { outData: [] }; })
                ]);
                const formatContact = function(contact){
                    const name = contact && contact.isPerson
                        ? [contact.name, contact.middlename || contact.middleName, contact.surname1, contact.surname2].filter(Boolean).join(' ').trim()
                        : String((contact && (contact.surname2 || contact.name)) || '').trim();
                    return { id:Number(contact && contact.id), name:name };
                };
                setBaseCessions((responses[1] && responses[1].outData) || []);
                setCoinsuranceCessions((responses[2] && responses[2].outData) || []);
                setReinsuranceBrokers(((responses[3] && responses[3].outData) || []).map(formatContact).filter(function(item){ return item.id && item.name; }));
                setReinsuranceContacts(((responses[4] && responses[4].outData) || []).map(formatContact).filter(function(item){ return item.id && item.name; }));
                setCoinsuranceContacts(((responses[5] && responses[5].outData) || []).map(formatContact).filter(function(item){ return item.id && item.name; }));
                let configRows = (responses[0] && responses[0].outData) || [];
                if(typeof configRows === 'string') configRows = JSON.parse(configRows);
                const config = {};
                for(let i = 1; i < configRows.length; i++){
                    if(String(configRows[i][1] || '') !== String(policy.productCode || '')) continue;
                    config[String(configRows[i][3] || '')] = {
                        principal:String(configRows[i][7] || ''),
                        parent:String(configRows[i][8] || ''),
                        isCoverage:String(configRows[i][5] || '').toUpperCase() === 'SI'
                    };
                }
                setCoverageReinsuranceConfig(config);
            } catch (error) {
                showError(error);
            } finally{
                setLoadingCov(false)
            }
        }
        const configuredCoverageCode = function(item){
            const direct = String(item && (item.coverageCode || item.code || item.coverageId) || '');
            if(coverageReinsuranceConfig[direct]) return direct;
            if(!direct && item && item.cessionId){
                const cession = (baseCessions || []).find(function(row){ return String(row.id) === String(item.cessionId); });
                if(cession) return String(cession.coverageCode || cession.coverageId || '');
            }
            const name = String(item && (item.cover || item.name || item.description) || '').trim().toUpperCase();
            const coverage = (Coverages || []).find(function(row){
                return String(row.code || '') === direct || String(row.name || row.description || '').trim().toUpperCase() === name;
            });
            return String(coverage && coverage.code || direct);
        };
        const isReinsuranceCoverage = function(item){
            const configuration = coverageReinsuranceConfig[configuredCoverageCode(item)];
            return !!(configuration && configuration.isCoverage);
        };
        const configuredReinsuranceCessions = function(){
            // Todas las cesiones vigentes del contrato deben permanecer visibles.
            // isCoverage determina los importes que cuentan, no qué cobertura se oculta.
            return baseCessions || [];
        };
        const reinsuranceContracts = function(){
            const groups = {};
            configuredReinsuranceCessions().forEach(function(cession){
                const key = String(cession.contractId || '');
                if(!groups[key]) groups[key] = {
                    key:key + '|', policyCode:cession.policyCode || (policySnapshot && policySnapshot.code) || '',
                    contractId:cession.contractId, lineId:'',
                    premium:0, sumInsured:0, premiumCedant:0, sumInsuredCedant:0,
                    premiumRe:0, sumInsuredRe:0, commission:0, tax:0,
                    _sumCoverageKeys:{}
                };
                const group = groups[key];
                const coverageKey = String(configuredCoverageCode(cession) || cession.coverageCode || cession.coverageId || cession.cover || cession.id || '');
                const firstCoverageRow = !group._sumCoverageKeys[coverageKey];
                if(firstCoverageRow){
                    group.premium += Number(cession.premium || 0);
                    group._sumCoverageKeys[coverageKey] = true;
                }
                // Match frmDistribucionReaseguro: only isCoverage=SI rows
                // contribute to insured sums; repeated coverage rows are counted once.
                if(isReinsuranceCoverage(cession)){
                    if(firstCoverageRow){
                        group.sumInsured += Number(cession.sumInsured || 0);
                    }
                    group.sumInsuredCedant += Number(cession.sumInsuredCedant || 0);
                    group.sumInsuredRe += Number(cession.sumInsuredRe || 0);
                }
                group.premiumCedant += Number(cession.premiumCedant || 0);
                group.premiumRe += Number(cession.premiumRe || 0);
                group.commission += Number(cession.comissionCedant || 0);
                group.tax += Number(cession.tax || 0);
            });
            const directCoinsurancePercentage = (coinsuranceCessions || []).reduce(function(total, row){
                return total + Number(row.percentage || 0);
            }, 0);
            const grossPremium = configuredReinsuranceCessions().reduce(function(total, row){ return total + Math.abs(Number(row.premium || 0)); }, 0);
            const coinsurancePremium = configuredReinsuranceCessions().reduce(function(total, row){ return total + Math.abs(Number(row.coPremium || row.coCovPremium || 0)); }, 0);
            const coinsurancePercentage = Math.max(0, Math.min(100, directCoinsurancePercentage || (grossPremium ? coinsurancePremium / grossPremium * 100 : 0)));
            const reinsuranceFactor = (100 - coinsurancePercentage) / 100;
            return Object.keys(groups).map(function(key){
                const group = groups[key];
                ['premium','sumInsured','premiumCedant','sumInsuredCedant','premiumRe','sumInsuredRe','commission','tax'].forEach(function(field){
                    group[field] = Number((group[field] * reinsuranceFactor).toFixed(2));
                });
                delete group._sumCoverageKeys;
                return group;
            });
        };
        const mergeReinsuranceContracts = function(simulation){
            const groups = {};
            const distributionLineKey = function(value){
                const line = String(value || '').trim().toUpperCase();
                if(line.indexOf('RETEN') >= 0 || line === 'RET') return 'retention';
                if(line.indexOf('EXCEDENTE') >= 0 || line.indexOf('EXCESS') >= 0 || line === 'EX1') return 'excess';
                if(line.indexOf('FAC') >= 0) return 'facultative';
                if(line.indexOf('FRONT') >= 0 || line === 'FRO') return 'fronting';
                return 'quota';
            };
            (simulation && simulation.contracts || []).forEach(function(source){
                const key = String(source.contractId || '');
                if(!groups[key]) groups[key] = Object.assign({}, source, {
                    key:key + '|', lineId:'', rows:[], participants:[], manualDistribution:null
                });
                const target = groups[key];
                target.rows = target.rows.concat((source.rows || []).map(function(row){
                    return Object.assign({}, row, { lineId: row.lineId || source.lineId || '' });
                }));
                target.participants = target.participants.concat((source.participants || []).map(function(participant){
                    const lineId = participant.lineId || source.lineId || '';
                    return Object.assign({}, participant, {
                        lineId: lineId,
                        distributionLineKey: participant.distributionLineKey || distributionLineKey(lineId)
                    });
                }));
                if(!target.manualDistribution && source.manualDistribution) target.manualDistribution = source.manualDistribution;
            });
            return Object.assign({}, simulation, { contracts:Object.keys(groups).map(function(key){ return groups[key]; }) });
        };
        const reinsuranceMovementRows = function(){
            return (coverages || []).map(function(coverage){
                const original = (Coverages || []).find(function(item){ return Number(item.id) === Number(coverage.id); }) || coverage;
                const activeLoadings = (coverage.Loadings || []).filter(function(item){ return !item.toRemove; });
                const premium = Number(coverage.basePremium || 0) * (1 + getTotalLoading(activeLoadings) / 100);
                return { code:String(coverage.code || ''), variation:Number((premium - Number(original.premium || 0)).toFixed(2)), prorated:Number((premium - Number(original.premium || 0)).toFixed(2)) };
            }).filter(function(row){ return row.code && Math.abs(row.variation) > 0.0001; });
        };
        async function calculateReinsurance(){
            if(!baseCessions.length){
                setReinsuranceSimulation({ contracts:[] });
                setReinsuranceConfirmed(true);
                return;
            }
            const rows = reinsuranceMovementRows();
            if(!rows.length){
                message.warning('No hay variaciones de prima para calcular el reaseguro.');
                return;
            }
            setReinsuranceCalculating(true);
            setReinsuranceConfirmed(false);
            setReinsurersReady(false);
            setSelectedReinsurerLine(null);
            try {
                const response = await exe('ExeChain', { chain:'cmdSimReaChangeCoverage', context:JSON.stringify({ policyId:Number(policyId), rows:rows, participants:[] }) });
                if(!response || !response.ok) throw (response && response.msg) || 'No fue posible calcular el reaseguro.';
                let simulation = response.outData;
                if(typeof simulation === 'string') simulation = JSON.parse(simulation);
                if(Array.isArray(simulation)) simulation = simulation[0] || {};
                simulation = mergeReinsuranceContracts(simulation);
                setReinsuranceSimulation(simulation);
                setReinsuranceDraft(JSON.parse(JSON.stringify(simulation)));
                setActiveWorkspaceTab('loadings');
                message.success('Cálculo de reaseguro generado.');
            } catch(error) {
                setReinsuranceSimulation(null);
                showError(error);
            } finally {
                setReinsuranceCalculating(false);
            }
        }
        function confirmReinsurance(){
            if(!reinsuranceSimulation){
                message.error('Debe calcular el reaseguro antes de confirmarlo.');
                return;
            }
            const contracts = (reinsuranceDraft || reinsuranceSimulation).contracts || [];
            const invalid = contracts.some(function(group){
                const manualDistribution = group.manualDistribution || [];
                if(manualDistribution.length){
                    const participants = group.participants || [];
                    const participantLineKey = function(participant){
                        if(participant.distributionLineKey) return String(participant.distributionLineKey);
                        const line = String(participant.lineId || '').trim().toUpperCase();
                        if(line.indexOf('FAC') >= 0) return 'facultative';
                        if(line.indexOf('EXCEDENTE') >= 0 || line.indexOf('EXCESS') >= 0 || line === 'EX1') return 'excess';
                        if(line.indexOf('FRONT') >= 0 || line === 'FRO') return 'fronting';
                        return 'quota';
                    };
                    // Participants are displayed and edited grouped by line,
                    // so confirmation must validate the same aggregate instead
                    // of requiring one participant set per coverage.
                    return manualDistribution.some(function(line){
                        if(['retention', 'nonTechnical', 'coinsurance'].indexOf(line.key) >= 0) return false;
                        const expectedPremium = Number(line.premium || 0);
                        const expectedSum = Number(line.sum || 0);
                        const expectedCommission = Number(line.commission || 0);
                        const expectedTax = Number(line.tax || 0);
                        if(Math.abs(expectedPremium) <= 0.01 && Math.abs(expectedSum) <= 0.01) return false;
                        const rawLineParticipants = participants.filter(function(participant){
                            return participantLineKey(participant) === String(line.key);
                        });
                        const groupedParticipants = {};
                        rawLineParticipants.forEach(function(participant){
                            const key = String(participant._participantKey || (String(participant.contactId || '') + '|' + String(participant.brokerId || '')));
                            if(!groupedParticipants[key]){
                                groupedParticipants[key] = Object.assign({}, participant, {
                                    split: Number(participant.split || 0), sumInsured:0, premium:0, commission:0, tax:0
                                });
                            }
                            groupedParticipants[key].sumInsured += Number(participant.sumInsured || 0);
                            groupedParticipants[key].premium += Number(participant.premium || 0);
                            groupedParticipants[key].commission += Number(participant.commission || 0);
                            groupedParticipants[key].tax += Number(participant.tax || 0);
                        });
                        const lineParticipants = Object.keys(groupedParticipants).map(function(key){ return groupedParticipants[key]; });
                        const split = lineParticipants.reduce(function(total, participant){ return total + Number(participant.split || 0); }, 0);
                        const sum = lineParticipants.reduce(function(total, participant){ return total + Number(participant.sumInsured || 0); }, 0);
                        const premium = lineParticipants.reduce(function(total, participant){ return total + Number(participant.premium || 0); }, 0);
                        const commission = lineParticipants.reduce(function(total, participant){ return total + Number(participant.commission || 0); }, 0);
                        const tax = lineParticipants.reduce(function(total, participant){ return total + Number(participant.tax || 0); }, 0);
                        return !lineParticipants.length || lineParticipants.some(function(participant){ return !participant.contactId; })
                            || Math.abs(split - 100) > 0.01
                            || Math.abs(sum - expectedSum) > 0.01
                            || Math.abs(premium - expectedPremium) > 0.01
                            || Math.abs(commission - expectedCommission) > 0.01
                            || Math.abs(tax - expectedTax) > 0.01;
                    });
                }
                const lines = group.rows || [];
                const participants = group.participants || [];
                const linesInvalid = lines.some(function(row){
                    return Math.abs((Number(row.premiumCedant || 0) + Number(row.premiumRe || 0) + Number(row.nonTechnicalPremium || 0)) - Number(row.premiumMovement || 0)) > 0.01;
                });
                const participantsInvalid = lines.some(function(row){
                    if(Math.abs(Number(row.premiumRe || 0)) <= 0.01) return false;
                    const rowParticipants = participants.filter(function(participant){
                        const sameLine = !participant.lineId || !row.lineId
                            || String(participant.lineId).trim().toUpperCase() === String(row.lineId).trim().toUpperCase();
                        return Number(participant.cessionId || 0) === Number(row.basedOnCessionId || 0)
                            || (sameLine && String(participant.coverageCode || '') === String(row.coverageCode || ''));
                    });
                    const participantSplit = rowParticipants.reduce(function(total, participant){ return total + Number(participant.split || 0); }, 0);
                    const participantPremium = rowParticipants.reduce(function(total, participant){ return total + Number(participant.premium || 0); }, 0);
                    return !rowParticipants.length || rowParticipants.some(function(participant){ return !participant.contactId; })
                        || Math.abs(participantSplit - 100) > 0.01
                        || Math.abs(participantPremium - Number(row.premiumRe || 0)) > 0.01;
                });
                return linesInvalid || participantsInvalid;
            });
            if(invalid){
                message.error('La distribución debe cuadrar y los aceptantes cedidos deben sumar 100% antes de confirmar.');
                return;
            }
            setReinsuranceConfirmed(true);
            message.success('El reaseguro está confirmado y listo para ejecutar.');
        }
        useEffect(function(){
            const first = reinsuranceContracts()[0];
            if(first && !selectedReinsuranceKey) setSelectedReinsuranceKey(first.key);
        }, [baseCessions, coverageReinsuranceConfig]);
        useEffect(function(){
            setReinsuranceSimulation(null);
            setReinsuranceDraft(null);
            setReinsuranceConfirmed(false);
            setReinsurersReady(false);
            setSelectedReinsurerLine(null);
            setActiveWorkspaceTab('loadings');
        }, [coverages]);
        function updateReinsuranceLine(groupKey, lineKey, field, rawValue){
            const parsed = Number(String(rawValue == null ? '' : rawValue).replace(/,/g, ''));
            if(!Number.isFinite(parsed)) return;
            setReinsuranceConfirmed(false);
            setReinsuranceDraft(function(current){
                if(!current) return current;
                const next = JSON.parse(JSON.stringify(current));
                (next.contracts || []).forEach(function(group){
                    const key = String(group.contractId || '') + '|' + String(group.lineId || '');
                    if(key !== groupKey) return;
                    (group.rows || []).forEach(function(row, index){
                        const rowKey = String(row.coverageCode || row.code || '') + '|' + index;
                        if(rowKey !== lineKey) return;
                        if(field === 'proportionRe'){
                            row.proportionRe = Number((parsed / 100).toFixed(6));
                            row.proportionCed = Number((1 - row.proportionRe).toFixed(6));
                            row.premiumRe = Number((Number(row.premiumMovement || 0) * parsed / 100).toFixed(2));
                            row.premiumCedant = Number((Number(row.premiumMovement || 0) - row.premiumRe).toFixed(2));
                            row.sumInsuredRe = Number((Number(row.sumInsuredMovement || 0) * parsed / 100).toFixed(2));
                            row.sumInsuredCedant = Number((Number(row.sumInsuredMovement || 0) - row.sumInsuredRe).toFixed(2));
                        } else row[field] = parsed;
                        if(field === 'commissionPct') row.commission = Number((Number(row.premiumRe || 0) * parsed / 100).toFixed(2));
                        if(field === 'taxPct') row.tax = Number((Number(row.premiumRe || 0) * parsed / 100).toFixed(2));
                    });
                });
                return next;
            });
        }
        function saveReinsuranceDistribution(groupKey, rows){
            const distribution = (rows || []).map(function(row){ return Object.assign({}, row); });
            const percentage = distribution.reduce(function(total, row){
                return total + Number(row.percentage || 0);
            }, 0);
            const hasInvalidAmount = distribution.some(function(row){
                return ['percentage', 'sum', 'premium', 'commissionPct', 'commission', 'taxPct', 'tax'].some(function(field){
                    return !Number.isFinite(Number(row[field] || 0)) || Number(row[field] || 0) < 0;
                });
            });
            if(hasInvalidAmount || Math.abs(percentage - 100) > 0.01){
                message.error('La distribución debe contener valores válidos y sumar 100% antes de guardarla.');
                return false;
            }
            setReinsuranceConfirmed(false);
            setReinsurersReady(false);
            setSelectedReinsurerLine(null);
            setReinsuranceDetailTab('distribution');
            setReinsuranceDraft(function(current){
                if(!current) return current;
                const next = JSON.parse(JSON.stringify(current));
                const group = (next.contracts || []).find(function(item){
                    return String(item.contractId || '') + '|' + String(item.lineId || '') === groupKey;
                });
                if(group) group.manualDistribution = distribution;
                if(group){
                    const lineKeyForRow = function(row){
                        const line = String(row.lineId || '').trim().toUpperCase();
                        if(line.indexOf('FAC') >= 0) return 'facultative';
                        if(line.indexOf('EXCEDENTE') >= 0 || line.indexOf('EXCESS') >= 0 || line === 'EX1') return 'excess';
                        if(line.indexOf('FRONT') >= 0 || line === 'FRO') return 'fronting';
                        return 'quota';
                    };
                    const rowsByLine = {};
                    (group.rows || []).forEach(function(row){
                        const key = lineKeyForRow(row);
                        if(!rowsByLine[key]) rowsByLine[key] = [];
                        rowsByLine[key].push(row);
                    });
                    Object.keys(rowsByLine).forEach(function(lineKey){
                        const line = distribution.find(function(item){ return item.key === lineKey; });
                        const lineRows = rowsByLine[lineKey];
                        if(!line) return;
                        const premiumWeights = lineRows.map(function(row){ return Math.abs(Number(row.premiumRe || 0)); });
                        const sumWeights = lineRows.map(function(row){ return Math.abs(Number(row.sumInsuredRe || 0)); });
                        const premiumWeightTotal = premiumWeights.reduce(function(total, value){ return total + value; }, 0);
                        const sumWeightTotal = sumWeights.reduce(function(total, value){ return total + value; }, 0);
                        let premiumAssigned = 0;
                        let sumAssigned = 0;
                        lineRows.forEach(function(row, index){
                            const premiumShare = premiumWeightTotal > 0 ? premiumWeights[index] / premiumWeightTotal : (lineRows.length ? 1 / lineRows.length : 0);
                            const sumShare = sumWeightTotal > 0 ? sumWeights[index] / sumWeightTotal : (lineRows.length ? 1 / lineRows.length : 0);
                            const premiumRe = index === lineRows.length - 1 ? Number(line.premium || 0) - premiumAssigned : Number((Number(line.premium || 0) * premiumShare).toFixed(2));
                            const sumRe = index === lineRows.length - 1 ? Number(line.sum || 0) - sumAssigned : Number((Number(line.sum || 0) * sumShare).toFixed(2));
                            const premiumMovement = Number(row.premiumMovement || 0);
                            const sumMovement = Number(row.sumInsuredMovement || 0);
                            row.premiumRe = Number(premiumRe.toFixed(2));
                            row.premiumCedant = Number((premiumMovement - row.premiumRe).toFixed(2));
                            row.sumInsuredRe = Number(sumRe.toFixed(2));
                            row.sumInsuredCedant = Number((sumMovement - row.sumInsuredRe).toFixed(2));
                            row.proportionRe = premiumMovement ? Number((row.premiumRe / premiumMovement).toFixed(6)) : Number(row.proportionRe || 0);
                            row.proportionCed = premiumMovement ? Number((row.premiumCedant / premiumMovement).toFixed(6)) : Number(row.proportionCed || 0);
                            const linePremium = Number(line.premium || 0);
                            const lineShare = linePremium ? Math.abs(row.premiumRe) / Math.abs(linePremium) : 0;
                            row.commission = Number((Number(line.commission || 0) * lineShare).toFixed(2));
                            row.tax = Number((Number(line.tax || 0) * lineShare).toFixed(2));
                            premiumAssigned += row.premiumRe;
                            sumAssigned += row.sumInsuredRe;
                            (group.participants || []).filter(function(participant){
                                const sameLine = !participant.lineId || !row.lineId
                                    || String(participant.lineId).trim().toUpperCase() === String(row.lineId).trim().toUpperCase();
                                return Number(participant.cessionId || 0) === Number(row.basedOnCessionId || 0)
                                    || (sameLine && String(participant.coverageCode || '') === String(row.coverageCode || ''));
                            }).forEach(function(participant){
                                participant.distributionLineKey = lineKey;
                                const split = Number(participant.split || 0) / 100;
                                participant.sumInsured = Number((row.sumInsuredRe * split).toFixed(2));
                                participant.premium = Number((row.premiumRe * split).toFixed(2));
                                participant.commission = Number((row.commission * split).toFixed(2));
                                participant.tax = Number((row.tax * split).toFixed(2));
                            });
                        });
                    });
                }
                return next;
            });
            message.success('La distribución de reaseguro fue guardada correctamente.');
            return true;
        }
        function openReinsurers(line){
            if(!line || !line.canViewReinsurers) return;
            setSelectedReinsurerLine(line);
            setReinsurersReady(true);
            setReinsuranceDetailTab('reinsurers');
            setReinsuranceDraft(function(current){
                if(!current) return current;
                const next = JSON.parse(JSON.stringify(current));
                const group = (next.contracts || []).find(function(item){
                    return String(item.contractId || '') + '|' + String(item.lineId || '') === line.groupKey;
                });
                if(!group) return next;
                const grouped = {};
                (group.participants || []).filter(function(item){
                    return (item.distributionLineKey || 'quota') === line.key && isReinsuranceCoverage(item);
                }).forEach(function(item){
                    const key = participantKey(item);
                    if(!grouped[key]) grouped[key] = [];
                    grouped[key].push(item);
                });
                Object.keys(grouped).forEach(function(key){
                    const items = grouped[key];
                    const split = Number(items[0].split || 0) / 100;
                    [['sumInsured', line.sum, 'movementSumInsured'], ['premium', line.premium, 'movementPremium'], ['commission', line.commission, 'movementCommission'], ['tax', line.tax, 'movementTax']].forEach(function(definition){
                        const weights = items.map(function(item){ return Math.abs(Number(item[definition[0]] || 0)); });
                        const weightTotal = weights.reduce(function(total, amount){ return total + amount; }, 0);
                        let assigned = 0;
                        items.forEach(function(item, index){
                            const target = Number(definition[1] || 0) * split;
                            const amount = index === items.length - 1 ? Number((target - assigned).toFixed(2)) : Number((weightTotal ? target * weights[index] / weightTotal : target / items.length).toFixed(2));
                            // Preserve the simulation values used by the read-only movement view.
                            if(item[definition[2]] === undefined) item[definition[2]] = Number(item[definition[0]] || 0);
                            item[definition[0]] = amount;
                            assigned = Number((assigned + amount).toFixed(2));
                        });
                    });
                });
                return next;
            });
        }
        const participantKey = function(item){
            return String(item._participantKey || (String(item.contactId || '') + '|' + String(item.brokerId || '')));
        };
        const groupedLineParticipants = function(group, line){
            const grouped = {};
            (group && group.participants || []).filter(function(item){
                return (item.distributionLineKey || 'quota') === line.key && isReinsuranceCoverage(item);
            }).forEach(function(item){
                const key = participantKey(item);
                if(!grouped[key]) grouped[key] = Object.assign({}, item, {
                    _participantKey:key, split:Number(item.split || 0), sumInsured:0, premium:0, commission:0, tax:0
                });
                grouped[key].sumInsured += Number(item.sumInsured || 0);
                grouped[key].premium += Number(item.premium || 0);
                grouped[key].commission += Number(item.commission || 0);
                grouped[key].tax += Number(item.tax || 0);
            });
            return Object.keys(grouped).map(function(key){
                const participant = grouped[key];
                participant.sumInsured = Number(participant.sumInsured.toFixed(2));
                participant.premium = Number(participant.premium.toFixed(2));
                participant.commission = Number(participant.commission.toFixed(2));
                participant.tax = Number(participant.tax.toFixed(2));
                return participant;
            });
        };
        function updateReinsuranceParticipant(groupKey, participantId, field, value, line){
            setReinsuranceConfirmed(false);
            setReinsuranceDraft(function(current){
                if(!current) return current;
                const next = JSON.parse(JSON.stringify(current));
                const group = (next.contracts || []).find(function(item){
                    return String(item.contractId || '') + '|' + String(item.lineId || '') === groupKey;
                });
                if(!group) return next;
                const matches = (group.participants || []).filter(function(item){
                    return (item.distributionLineKey || 'quota') === line.key && participantKey(item) === String(participantId);
                });
                if(!matches.length) return next;
                if(field === 'contactId' || field === 'brokerId'){
                    matches.forEach(function(participant){ participant[field] = value; });
                }
                if(field === 'contactId'){
                    const contact = (reinsuranceContacts || []).find(function(item){ return String(item.id) === String(value); });
                    matches.forEach(function(participant){ participant.contactName = contact ? contact.name : participant.contactName; participant.name = participant.contactName || participant.name; });
                }
                if(field === 'brokerId'){
                    const broker = (reinsuranceBrokers || []).find(function(item){ return String(item.id) === String(value); });
                    matches.forEach(function(participant){ participant.brokerName = broker ? broker.name : participant.brokerName; });
                }
                if(field === 'split' && line){
                    const factor = Number(value || 0) / 100;
                    matches.forEach(function(participant){ participant.split = Number(value || 0); });
                    [['sumInsured', line.sum], ['premium', line.premium], ['commission', line.commission], ['tax', line.tax]].forEach(function(definition){
                        const weights = matches.map(function(item){ return Math.abs(Number(item[definition[0]] || 0)); });
                        const weightTotal = weights.reduce(function(total, amount){ return total + amount; }, 0);
                        let assigned = 0;
                        matches.forEach(function(participant, index){
                            const amount = index === matches.length - 1 ? Number((Number(definition[1] || 0) * factor - assigned).toFixed(2)) : Number(((weightTotal ? Number(definition[1] || 0) * factor * weights[index] / weightTotal : Number(definition[1] || 0) * factor / matches.length)).toFixed(2));
                            participant[definition[0]] = amount;
                            assigned = Number((assigned + amount).toFixed(2));
                        });
                    });
                } else if(field !== 'contactId' && field !== 'brokerId'){
                    const target = Number(value || 0);
                    const weights = matches.map(function(item){ return Math.abs(Number(item[field] || 0)); });
                    const weightTotal = weights.reduce(function(total, amount){ return total + amount; }, 0);
                    let assigned = 0;
                    matches.forEach(function(participant, index){
                        const amount = index === matches.length - 1 ? Number((target - assigned).toFixed(2)) : Number((weightTotal ? target * weights[index] / weightTotal : target / matches.length).toFixed(2));
                        participant[field] = amount;
                        assigned = Number((assigned + amount).toFixed(2));
                    });
                }
                return next;
            });
        }
        function addReinsuranceParticipant(groupKey, line){
            setReinsuranceConfirmed(false);
            setReinsuranceDraft(function(current){
                if(!current) return current;
                const next = JSON.parse(JSON.stringify(current));
                const group = (next.contracts || []).find(function(item){
                    return String(item.contractId || '') + '|' + String(item.lineId || '') === groupKey;
                });
                if(!group) return next;
                group.participants = group.participants || [];
                const coverageRow = (group.rows || []).find(isReinsuranceCoverage) || (group.rows || [])[0] || {};
                const participantId = 'new-' + Date.now();
                group.participants.push({
                    id:participantId, _participantKey:participantId, distributionLineKey:line.key,
                    cessionId:coverageRow.basedOnCessionId || 0,
                    coverageCode:coverageRow.coverageCode || coverageRow.coverageId || null,
                    lineId:group.lineId, contactId:null, brokerId:null, split:0,
                    sumInsured:0, premium:0, commission:0, tax:0
                });
                return next;
            });
        }
        function removeReinsuranceParticipant(groupKey, participantId, line){
            setReinsuranceConfirmed(false);
            setReinsuranceDraft(function(current){
                if(!current) return current;
                const next = JSON.parse(JSON.stringify(current));
                const group = (next.contracts || []).find(function(item){
                    return String(item.contractId || '') + '|' + String(item.lineId || '') === groupKey;
                });
                if(group) group.participants = (group.participants || []).filter(function(item){
                    return !((item.distributionLineKey || 'quota') === line.key && participantKey(item) === String(participantId));
                });
                return next;
            });
        }
        function saveReinsuranceParticipants(groupKey, line){
            const group = (reinsuranceDraft && reinsuranceDraft.contracts || []).find(function(item){
                return String(item.contractId || '') + '|' + String(item.lineId || '') === groupKey;
            });
            const participants = groupedLineParticipants(group, line);
            const closeEnough = function(first, second){ return Math.abs(Number(first || 0) - Number(second || 0)) <= 0.01; };
            const split = participants.reduce(function(total, item){ return total + Number(item.split || 0); }, 0);
            const sum = participants.reduce(function(total, item){ return total + Number(item.sumInsured || 0); }, 0);
            const premium = participants.reduce(function(total, item){ return total + Number(item.premium || 0); }, 0);
            const commission = participants.reduce(function(total, item){ return total + Number(item.commission || 0); }, 0);
            const tax = participants.reduce(function(total, item){ return total + Number(item.tax || 0); }, 0);
            const hasCededAmount = Math.abs(Number(line.sum || 0)) > 0.01 || Math.abs(Number(line.premium || 0)) > 0.01;
            if(hasCededAmount && (!participants.length || participants.some(function(item){ return !item.contactId; }) || !closeEnough(split, 100)
                || !closeEnough(sum, line.sum) || !closeEnough(premium, line.premium) || !closeEnough(commission, line.commission) || !closeEnough(tax, line.tax))){
                message.error('Los aceptantes deben estar definidos y distribuir al 100% la suma, prima, comisión e impuesto de la línea.');
                return false;
            }
            setReinsuranceConfirmed(false);
            message.success('La distribución de aceptantes fue guardada correctamente.');
            return true;
        }
        function buildReinsuranceSnapshot(){
            const round = function(value){ return Number(Number(value || 0).toFixed(2)); };
            const source = reinsuranceDraft || reinsuranceSimulation || {};
            const snapshot = {
                state: 'FINAL',
                distribution: [], participants: [], coinsurance: [],
                sourceCessionIds: (baseCessions || []).map(function(cession){ return Number(cession.id || 0); }).filter(function(id){ return id > 0; }),
                sourceCoinsuranceIds: (coinsuranceCessions || []).map(function(cession){ return Number(cession.id || 0); }).filter(function(id){ return id > 0; })
            };
            (source.contracts || []).forEach(function(group){
                const rows = group.rows || [];
                const manual = group.manualDistribution || [];
                const quota = manual.find(function(line){ return line.key === 'quota'; });
                const retention = manual.find(function(line){ return line.key === 'retention'; });
                const sourceRows = (baseCessions || []).filter(function(cession){
                    return String(cession.contractId || '') === String(group.contractId || '')
                        && (!group.lineId || String(cession.lineId || '') === String(group.lineId || ''));
                });
                const sourceForRow = function(row){
                    return sourceRows.find(function(cession){
                        const sameLine = !row.lineId || !cession.lineId
                            || String(row.lineId).trim().toUpperCase() === String(cession.lineId).trim().toUpperCase();
                        const sameCoverage = String(cession.coverageCode || cession.coverageId || '') === String(row.coverageCode || '')
                            || String(cession.cover || '').trim().toUpperCase() === String(row.cover || '').trim().toUpperCase();
                        return sameLine && sameCoverage;
                    }) || {};
                };
                const finalContractPremium = rows.reduce(function(total, row){
                    const sourceRow = sourceForRow(row);
                    const value = row.finalPremium !== undefined && row.finalPremium !== null
                        ? row.finalPremium : Number(sourceRow.premium || 0) + Number(row.premiumMovement || 0);
                    return total + Number(value || 0);
                }, 0);
                const finalContractSum = rows.reduce(function(total, row){
                    const sourceRow = sourceForRow(row);
                    const value = row.finalSum !== undefined && row.finalSum !== null
                        ? row.finalSum : Number(sourceRow.sumInsured || 0) + Number(row.sumInsuredMovement || 0);
                    return total + Number(value || 0);
                }, 0);
                const movementPremium = rows.reduce(function(total, row){ return total + Number(row.premiumMovement || 0); }, 0);
                const movementSum = rows.reduce(function(total, row){ return total + Number(row.sumInsuredMovement || 0); }, 0);
                const quotaPercentage = quota ? Number(quota.percentage || 0) : 0;
                const cededPremium = quota
                    ? (Math.abs(Number(quota.premium || 0)) > 0.01
                        ? Number(quota.premium)
                        : Number((finalContractPremium * quotaPercentage / 100).toFixed(2)))
                    : rows.reduce(function(total, row){ return total + Number(row.premiumRe || 0); }, 0);
                const cededSum = quota
                    ? (Math.abs(Number(quota.sum || 0)) > 0.01
                        ? Number(quota.sum)
                        : Number((finalContractSum * quotaPercentage / 100).toFixed(2)))
                    : rows.reduce(function(total, row){ return total + Number(row.sumInsuredRe || 0); }, 0);
                const retentionPremium = retention ? Number(retention.premium || 0) : rows.reduce(function(total, row){ return total + Number(row.premiumCedant || 0); }, 0);
                const retentionSum = retention ? Number(retention.sum || 0) : rows.reduce(function(total, row){ return total + Number(row.sumInsuredCedant || 0); }, 0);
                const commission = quota ? Number(quota.commission || 0) : rows.reduce(function(total, row){ return total + Number(row.commission || 0); }, 0);
                const tax = quota ? Number(quota.tax || 0) : rows.reduce(function(total, row){ return total + Number(row.tax || 0); }, 0);
                rows.forEach(function(row){
                    const hasManual = !!quota;
                    const sourceRow = sourceForRow(row);
                    const sourcePremium = Number(sourceRow.premium || 0);
                    const sourceSum = Number(sourceRow.sumInsured || 0);
                    const sourcePremiumRe = Number(sourceRow.premiumRe || 0);
                    const sourceSumRe = Number(sourceRow.sumInsuredRe || 0);
                    const finalPremium = Number(row.finalPremium !== undefined && row.finalPremium !== null
                        ? row.finalPremium : sourcePremium + Number(row.premiumMovement || 0));
                    const finalSum = Number(row.finalSum !== undefined && row.finalSum !== null
                        ? row.finalSum : sourceSum + Number(row.sumInsuredMovement || 0));
                    const finalPremiumWeight = Math.abs(finalPremium);
                    const finalSumWeight = Math.abs(finalSum);
                    const totalFinalPremium = rows.reduce(function(total, item){
                        const itemSource = sourceForRow(item);
                        const itemFinal = item.finalPremium !== undefined && item.finalPremium !== null
                            ? item.finalPremium : Number(itemSource.premium || 0) + Number(item.premiumMovement || 0);
                        return total + Math.abs(Number(itemFinal || 0));
                    }, 0);
                    const totalFinalSum = rows.reduce(function(total, item){
                        const itemSource = sourceForRow(item);
                        const itemFinal = item.finalSum !== undefined && item.finalSum !== null
                            ? item.finalSum : Number(itemSource.sumInsured || 0) + Number(item.sumInsuredMovement || 0);
                        return total + Math.abs(Number(itemFinal || 0));
                    }, 0);
                    const premiumShare = totalFinalPremium > 0.01 ? finalPremiumWeight / totalFinalPremium : 0;
                    const sumShare = totalFinalSum > 0.01 ? finalSumWeight / totalFinalSum : 0;
                    const targetPremiumRe = hasManual ? round(cededPremium * premiumShare) : null;
                    const targetSumRe = hasManual ? round(cededSum * sumShare) : null;
                    const finalPremiumRe = hasManual ? round(targetPremiumRe) : round(sourcePremiumRe + Number(row.premiumRe || 0));
                    const finalPremiumCedant = hasManual ? round(finalPremium - targetPremiumRe) : round(Number(sourceRow.premiumCedant || 0) + Number(row.premiumCedant || 0));
                    const finalSumRe = hasManual ? round(targetSumRe) : round(sourceSumRe + Number(row.sumInsuredRe || 0));
                    const finalSumCedant = hasManual ? round(finalSum - targetSumRe) : round(Number(sourceRow.sumInsuredCedant || 0) + Number(row.sumInsuredCedant || 0));
                    const finalCommission = hasManual ? round(commission * (Math.abs(cededPremium) > 0.01 ? Math.abs(targetPremiumRe) / Math.abs(cededPremium) : 0)) : round(Number(sourceRow.comissionCedant || 0) + Number(row.commission || 0));
                    const finalTax = hasManual ? round(tax * (Math.abs(cededPremium) > 0.01 ? Math.abs(targetPremiumRe) / Math.abs(cededPremium) : 0)) : round(Number(sourceRow.tax || 0) + Number(row.tax || 0));
                    const premiumRe = round(finalPremiumRe - sourcePremiumRe);
                    const premiumCedant = round(finalPremiumCedant - Number(sourceRow.premiumCedant || 0));
                    const sumRe = round(finalSumRe - sourceSumRe);
                    const sumCedant = round(finalSumCedant - Number(sourceRow.sumInsuredCedant || 0));
                    const rowCommission = round(finalCommission - Number(sourceRow.comissionCedant || 0));
                    const rowTax = round(finalTax - Number(sourceRow.tax || 0));
                    const premiumBase = Number(row.premiumMovement || 0);
                    const sumBase = Number(row.sumInsuredMovement || 0);
                    snapshot.distribution.push({
                        contractId: group.contractId, lineId: row.lineId || group.lineId, coverageCode: row.coverageCode,
                        premiumMovement: round(premiumBase), sumInsuredMovement: round(sumBase),
                        finalPremium: round(finalPremium), finalSum: round(finalSum),
                        premiumCedant: finalPremiumCedant, sumInsuredCedant: finalSumCedant,
                        premiumRe: finalPremiumRe, sumInsuredRe: finalSumRe,
                        commission: finalCommission, tax: finalTax,
                        proportionCed: finalPremium
                            ? round(finalPremiumCedant / finalPremium)
                            : (premiumBase ? round(premiumCedant / premiumBase) : Number(row.proportionCed || 0)),
                        proportionRe: finalPremium
                            ? round(finalPremiumRe / finalPremium)
                            : (premiumBase ? round(premiumRe / premiumBase) : Number(row.proportionRe || 0))
                    });
                    (group.participants || []).filter(function(participant){
                        const sameLine = !participant.lineId || !row.lineId
                            || String(participant.lineId).trim().toUpperCase() === String(row.lineId).trim().toUpperCase();
                        return Number(participant.cessionId || 0) === Number(row.basedOnCessionId || 0)
                            || (sameLine && String(participant.coverageCode || '') === String(row.coverageCode || ''));
                    }).forEach(function(participant){
                        const split = Number(participant.split || 0) / 100;
                        snapshot.participants.push({
                            contractId: group.contractId, lineId: row.lineId || group.lineId, coverageCode: row.coverageCode,
                            cessionId: participant.cessionId, contactId: participant.contactId, brokerId: participant.brokerId,
                            split: Number(participant.split || 0),
                            sumInsured: round(finalSumRe * split), premium: round(finalPremiumRe * split),
                            commission: round(finalCommission * split), tax: round(finalTax * split),
                            sumInsuredMovement: round(sumRe * split), premiumMovement: round(premiumRe * split),
                            commissionMovement: round(rowCommission * split), taxMovement: round(rowTax * split)
                        });
                    });
                });
            });
            const finalCoinsuranceBase = (coverages || []).reduce(function(total, coverage){
                const loading = (coverage.Loadings || []).filter(function(item){ return !item.toRemove; });
                total.sum += Number(coverage.limit || coverage.sumInsured || 0);
                total.premium += Number(coverage.basePremium || 0) * (1 + getTotalLoading(loading) / 100);
                return total;
            }, { sum:0, premium:0 });
            (coinsuranceCessions || []).forEach(function(cession){
                const percentage = Number(cession.percentage || 0);
                const sourcePremium = Number(cession.premiumCeded || cession.premium || 0);
                const premiumCeded = finalCoinsuranceBase.premium * percentage / 100;
                const commissionRate = sourcePremium ? Number(cession.commission || 0) / sourcePremium : 0;
                const taxRate = sourcePremium ? Number(cession.tax || 0) / sourcePremium : 0;
                snapshot.coinsurance.push({
                    id: Number(cession.id || 0), contactId: Number(cession.contactId || 0),
                    percentage: percentage, sumInsured: round(finalCoinsuranceBase.sum),
                    premium: round(finalCoinsuranceBase.premium),
                    sumInsuredCeded: round(finalCoinsuranceBase.sum * percentage / 100),
                    premiumCeded: round(premiumCeded),
                    commission: round(premiumCeded * commissionRate),
                    tax: round(premiumCeded * taxRate)
                });
            });
            return snapshot;
        }
        async function ensureMoment(){
            if(typeof moment !== 'undefined'){
                return;
            }

            const response = await exe('ExeChain',{
                chain:'cmdLoadLibrariesGroupedBordereau',
                context:'{}'
            });

            if(!response.ok){
                throw new Error(response.msg);
            }

            const {
                outData:{ momentJs }
            } = response;

            eval(momentJs);

            if(typeof moment === 'undefined'){
                throw new Error('No fue posible cargar Moment.js');
            }
        }
        async function onSaveLoading(){
            try {

                await ensureMoment();

                if(isPolicyActive){
                    let reason = '';
                    const defaultEffectiveDate = formatLocalDate(policyStart) || formatLocalDate(new Date());
                    effectiveDate = defaultEffectiveDate;

                    Modal.confirm({
                        title: 'Crear Endoso',
                        width: 600,
                        content: React.createElement(
                            'div',
                            { style: { marginTop: 15 } },

                            React.createElement(
                                'div',
                                { style: { marginBottom: 8 } },
                                'Fecha efectiva:'
                            ),

                            React.createElement(DatePicker, {
                                style: {
                                    width: '100%',
                                    marginBottom: 15
                                },
                                defaultValue: moment(defaultEffectiveDate, 'YYYY-MM-DD'),
                                format: 'YYYY-MM-DD',
                                onChange: function(date, dateString){
                                    effectiveDate = dateString;
                                }
                            }),

                            React.createElement(
                                'div',
                                { style: { marginBottom: 8 } },
                                'Ingrese la justificación del endoso:'
                            ),

                            React.createElement(Input.TextArea, {
                                rows: 4,
                                placeholder: 'Escriba el motivo...',
                                onChange: function(e){
                                    reason = e.target.value;
                                }
                            })
                        ),
                        okText: 'Continuar',
                        cancelText: 'Cerrar',
                        onOk: async function () {
                            if (!reason || !reason.trim()) {
                                message.error('Debe ingresar una justificación');
                                return Promise.reject();
                            }

                            if (!effectiveDate) {
                                message.error('Debe seleccionar una fecha efectiva');
                                return Promise.reject();
                            }

                            setLoadingCov(true);

                            try {
                                await createEndorsement(reason, effectiveDate);
                            } finally {
                                setLoadingCov(false);
                            }
                        }
                    });

                    return;
                }

                setLoadingCov(true);

                await updatePolicy();
                showSuccess('Poliza Actualizada');
                window.location.replace('#/lifePolicy/' + policyId);

            } catch (error) {
                showError(error);
            } finally {
                if(!isPolicyActive)
                    setLoadingCov(false);
            }
        }
        async function updatePolicy(){
            const newLoadings = coverages.map( item => item.Loadings.filter( load => isNaN(load.id))).reduce(( total, loads) => [...total, ...loads],[]),
                  updLoadings = coverages.map( item => item.Loadings.filter( load => load.toUpdate)).reduce(( total, loads) => [...total, ...loads],[]),
                  delLoadings = coverages.map( item => item.Loadings.filter( load => load.toRemove)).reduce(( total, loads) => [...total, ...loads],[]);
            
            await Promise.all([createLoadings(newLoadings), updateLoadings(updLoadings), deleteLoadings(delLoadings)]);
            // Summarize per coverage.
            const updateQuery = `
            WITH totals AS ( 
                SELECT 
                    cov.id, 
                    COALESCE(SUM(load.loading), 0) loading 
                FROM LifeCoverage cov 
                LEFT JOIN LifeCoverageLoading load ON cov.id = load.lifeCoverageId
                WHERE cov.lifePolicyId = ${ policyId }
                GROUP BY cov.id 
            ) 
            UPDATE cov
            SET cov.loading = totals.loading
            FROM LifeCoverage cov
            INNER JOIN totals ON cov.id = totals.id
            `          
            const response = await exe('DoQuery',{ sql: updateQuery });
            if(!response.ok) throw response.msg;                
        }
        async function createLoadings(loadings){
            if(loadings.length === 0) return;
            const values = loadings.map( 
                load => `(${ load.lifeCoverageId }, ${ load.loading }, '${load.riskType}', '${ load.start.slice(0,10) }', '${ load.end.slice(0,10)}', 1, 0, 0, 1)`
            );
            const insertQuery = `
                BEGIN TRY
                    BEGIN TRANSACTION
                        INSERT INTO LifeCoverageLoading (lifeCoverageId, loading, riskType, [start],[end],[manual], [insuredSumBased], perMille, duration)
                        VALUES ${ values.join(',') }
                    COMMIT TRANSACTION;
                END TRY
                BEGIN CATCH
                    IF @@TRANCOUNT > 0
                        ROLLBACK TRANSACTION;
                END CATCH;
            `;
            await exe('DoQuery',{ sql: insertQuery});
        }
        async function updateLoadings(loadings){
            if(loadings.length === 0) return;
            for(const load of loadings){
                await exe('SetField',{ entity:'LifeCoverageLoading', entityId: load.id, fieldValue:`loading=${ load.loading }, riskType='${ load.riskType }'`})
            }
        }
        async function deleteLoadings(loadings){
            if(loadings.length === 0) return;
            const id = loadings.map( item => item.id).filter( id => !isNaN(id) && id > 0).filter((id, index, self) => self.indexOf(id) === index);
            await exe('DoQuery',{ sql:`DELETE FROM LifeCoverageLoading WHERE id IN (${ id.join(',') })`});
        }
        async function approveEndorsementWorkflow(processId){
            const procesoId = Number(processId || 0);

            if(!procesoId){
                throw 'No se pudo determinar el proceso del endoso para aprobar el flujo.';
            }

            const result = await exe('GotoStep', {
                procesoId,
                estado: 'APROVED'
            });
            const response = Array.isArray(result) ? (result[0] || {}) : result;

            if(!response.ok) throw response.msg;

            return response;
        }
        async function persistMaximumCoveragePolicyEnd(changeId, jNewCoverages){
            let coverages = [];
            try {
                coverages = typeof jNewCoverages === 'string' ? JSON.parse(jNewCoverages || '[]') : (jNewCoverages || []);
            } catch (error) {
                throw 'No se pudieron leer las coberturas del endoso para guardar la vigencia final.';
            }
            const policyEnd = coverages.reduce(function(maximum, coverage){
                const match = String((coverage && coverage.end) || '').match(/^\d{4}-\d{2}-\d{2}/);
                const end = match ? match[0] : '';
                return end && (!maximum || end > maximum) ? end : maximum;
            }, '');
            if(!policyEnd) throw 'El endoso no contiene una fecha final de cobertura válida.';

            const changeResponse = await exe('LoadEntity', {
                entity: 'Change', fields: 'id,jDetail', filter: 'id=' + Number(changeId), noTracking: true
            });
            const data = changeResponse && changeResponse.outData;
            const change = Array.isArray(data) ? (data[0] || {}) : (data || {});
            if(!changeResponse || !changeResponse.ok || !change.id){
                throw 'No se pudo cargar el detalle del endoso para guardar la vigencia final.';
            }
            let detail = {};
            try { detail = JSON.parse(change.jDetail || '{}'); } catch (error) { detail = {}; }
            detail.policyEnd = policyEnd;
            const saved = await exe('SetField', {
                entity: 'Change', entityId: Number(changeId),
                fieldValue: "jDetail='" + JSON.stringify(detail).replace(/'/g, "''") + "'", raw: true
            });
            if(!saved || !saved.ok) throw 'No se pudo guardar la vigencia final del endoso.';
            return policyEnd;
        }
        async function createEndorsement(reason, effectiveDate){
            let changeId = 0;
            let reinsurancePrepared = false;
            let reinsuranceExecuted = false;
            try {
                if(isPolicyActive && baseCessions.length && !reinsuranceConfirmed){
                    message.error('Debe calcular y confirmar el reaseguro antes de ejecutar el endoso.');
                    return;
                }
                const covId = coverages.map( item => item.id);
                const tempNewCoverages = JSON.parse(JSON.stringify(coverages));
                tempNewCoverages.forEach( cov => {
                    cov.Loadings = (cov.Loadings || []);
                    cov.Loadings = cov.Loadings.filter( item => !item.toRemove);
                    cov.Loadings.forEach( load => {
                        if(isNaN(load.id) || typeof load.id === 'string')
                            load.id = 0;
                    })
                });

                let newCoverages = [...Coverages.filter( item => !covId.includes(item.id)), ...tempNewCoverages];

                const effectiveDateTime = buildEffectiveDateTime(policyStart, effectiveDate);

                const jOldCoverages = JSON.stringify(Coverages),
                    jNewCoverages = JSON.stringify(newCoverages);
                const reinsuranceSnapshot = buildReinsuranceSnapshot();
                const dto = {
                    jOldCoverages,
                    jNewCoverages,
                    policyId,
                    lifePolicyId: policyId,
                    effectiveDate: effectiveDateTime,
                    note: reason,
                    jAdditional: JSON.stringify({
                        endorsementType: 'LOADING',
                        reinsuranceSnapshot: reinsuranceSnapshot
                    })
                }
                
                return confirm({
                    title: 'Validaciones OK',
                    content: '¿Desea confirmar la ejecución del endoso?',
                    okText: 'Aplicar Endoso',
                    cancelText: 'No',
                    okType: 'danger',
                    onOk(){
                        return new Promise(async function(resolve, reject){
                            try {
                                const change = await exe('ChangeLoading', {...dto, operation: 'ADD' });
                                if(!change.ok) throw change.msg;
                                changeId = Number(change.outData.id || 0);
                                await persistMaximumCoveragePolicyEnd(changeId, jNewCoverages);
                                // El trigger del endoso avanza el workflow automáticamente;
                                // no ejecutar GotoStep(APROVED) desde esta vista para evitar
                                // una segunda generación del documento.
                                // await approveEndorsementWorkflow(change.outData.processId);
                                if(reinsuranceSnapshot.distribution.length){
                                    const reinsuranceResponse = await exe('ExeChain', {
                                        chain:'cmdApplyReaChangeCoverage',
                                        context:JSON.stringify({ changeId:changeId, mode:'PREPARE_EXECUTION' })
                                    });
                                    let reinsuranceData = reinsuranceResponse && reinsuranceResponse.outData;
                                    if(typeof reinsuranceData === 'string'){
                                        try { reinsuranceData = JSON.parse(reinsuranceData); } catch(error) { reinsuranceData = null; }
                                    }
                                    if(Array.isArray(reinsuranceData) && reinsuranceData.length === 1) reinsuranceData = reinsuranceData[0];
                                    if(!reinsuranceResponse || reinsuranceResponse.ok === false || (reinsuranceData && reinsuranceData.ok === false)){
                                        throw (reinsuranceData && reinsuranceData.msg) || (reinsuranceResponse && reinsuranceResponse.msg) || 'No se pudo preparar el reaseguro del endoso.';
                                    }
                                    reinsurancePrepared = true;
                                }
                                // El documento del endoso lo genera el trigger de ExeChangeLoading;
                                // esta vista no debe invocar cmdGenertFormatoEmdoso nuevamente.
                                const executeResult = await exe('ExeChangeLoading', {changeId: changeId, operation: "EXECUTE", exeNow: true });
                                if(!executeResult.ok) throw executeResult.msg;                                
                                reinsuranceExecuted = true;
                                showSuccess('Endoso aplicado');
                                resolve(true);
                                window.location.replace('#/lifePolicy/' + policyId);
                            } catch (error) {
                                showError(error)
                                reject(error)
                            }
                        })
                    }
                })
            } catch (error) {
                if(reinsurancePrepared && !reinsuranceExecuted && changeId){
                    try {
                        await exe('ExeChain', {
                            chain:'cmdApplyReaChangeCoverage',
                            context:JSON.stringify({ changeId:changeId, mode:'ROLLBACK' })
                        });
                    } catch (rollbackError) {
                        showError(String(error) + ' No fue posible restaurar el reaseguro anterior: ' + String(rollbackError));
                        return;
                    }
                }
                showError(error)
            }

        }
        useEffect(()=>{
            if(initializedRef.current) return;
            initializedRef.current = true;
            fetchData();
            exe('RepoRiskTypeCatalog',{ operation:'GET' })
            .then( response => setRiskTypes( response.outData.map(({ code, name}) => ({value: code, label: name.trim() }))  ))
        },[policyId]);

        const value = {
            policyId, coverages, loadingCov,
            isModalOpen, onModalSubmit, requestCloseModal,
            selectedCov, openModal, form, riskTypes,
            onAddLoading, menuAction, selected,
            showLoadingForm, hideLoadingForm, requestHideLoadingForm, removeLoading,
            hasPendingLoadingChanges, setHasPendingLoadingChanges,
            fetchData, onSaveLoading, isPolicyActive,
            activeWorkspaceTab, setActiveWorkspaceTab, reinsuranceDetailTab, setReinsuranceDetailTab,
            selectedReinsuranceKey, setSelectedReinsuranceKey, reinsuranceContracts,
            configuredReinsuranceCessions, isReinsuranceCoverage, baseCessions, reinsuranceSimulation, reinsuranceBrokers, reinsuranceContacts,
            coinsuranceCessions, coinsuranceContacts, policySnapshot,
            reinsuranceDraft, updateReinsuranceLine, saveReinsuranceDistribution, openReinsurers,
            reinsurersReady, selectedReinsurerLine, updateReinsuranceParticipant, addReinsuranceParticipant,
            removeReinsuranceParticipant, saveReinsuranceParticipants, reinsuranceCalculating, reinsuranceConfirmed, calculateReinsurance, confirmReinsurance
        }

        return <AppContext.Provider value={ value }>
            { children }
        </AppContext.Provider>
    }
    /**
     * @function App
     * @version 1.0.0
     * @author Noel Obando
     * @description Main container component that renders the coverage table and modal.
     * 
     * @returns {JSX.Element}
     */
    const App=()=>{
        const { policyId, coverages, loadingCov, onSaveLoading, isPolicyActive, activeWorkspaceTab, setActiveWorkspaceTab,
            baseCessions, reinsuranceSimulation, reinsuranceCalculating, reinsuranceConfirmed,
            coinsuranceCessions, coinsuranceContacts, policySnapshot,
            calculateReinsurance, confirmReinsurance } = useAppContext();
        const hasChanges = (coverages || [] ).some( cov => cov.Loadings.some( load => isNaN(load.id) || load.toRemove || load.toUpdate  ));
        const designStyles = `
.loading-endorsement-manager { font-size:13px; min-height:0; }
body:has(.loading-endorsement-manager) .ant-page-header,
body:has(.loading-endorsement-manager) .page-header { background:#eef2f6 !important; border:1px solid #b6c1cd !important; border-radius:6px !important; box-shadow:inset 0 1px 0 rgba(255,255,255,.9), 0 1px 3px rgba(31,45,61,.12); }
body:has(.loading-endorsement-manager) .ant-page-header-heading { padding-bottom:8px; border-bottom:1px solid #c7d0da; }
.loading-endorsement-manager .lem-grid-panel { border:1px solid #cbd1d8; border-radius:6px; overflow:hidden; background:#fff; }
.loading-endorsement-manager .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab { border-color:#8f9aa7 !important; border-width:1px 1px 0 !important; background:#f5f7fa !important; }
.loading-endorsement-manager .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active { border-color:#1677ff !important; border-bottom-color:#fff !important; background:#fff !important; }
.loading-endorsement-manager .ant-tabs-card > .ant-tabs-nav::before { border-bottom:1px solid #8f9aa7 !important; }
.loading-endorsement-manager .lem-rea-financial-input { min-width:92px; text-align:right; border-color:#b8c4d1 !important; border-radius:4px !important; }
.loading-endorsement-manager .lem-rea-distribution .ant-table-cell { vertical-align:middle; }
.loading-endorsement-manager .lem-rea-line-label { display:inline-flex; align-items:center; gap:4px; }
.loading-endorsement-manager .lem-rea-folder-btn,
.loading-endorsement-manager .lem-rea-folder-btn:hover,
.loading-endorsement-manager .lem-rea-folder-btn:focus { min-width:16px; width:16px; height:18px; padding:0; color:#1677ff; background:transparent !important; border:0 !important; box-shadow:none !important; }
.loading-endorsement-manager .lem-rea-actionbar { display:flex; align-items:center; gap:10px; margin-bottom:5px; padding:6px 8px; background:#e6f4ff; border:1px solid #91caff; border-radius:4px; }
.loading-endorsement-manager .lem-rea-coverage-summary { margin-bottom:6px; padding:7px 8px; background:#e6f4ff; border:1px solid #91caff; border-radius:4px; color:#16324f; }
.loading-endorsement-manager .lem-rea-coverage-participants { margin:4px 0 2px; padding:4px; }
.loading-endorsement-manager .lem-rea-totals > td { background:#86b4ff !important; color:#0b1f33; font-weight:700; border-top:1px solid #5a91dc !important; }
.loading-endorsement-manager .lem-rea-movement-participants { margin-top:8px; }
.loading-endorsement-manager .lem-rea-participants-title { padding:0 4px 5px; font-weight:600; }
.lem-modal .lem-grid { border:1px solid #cbd1d8; border-radius:6px; overflow:hidden; }
.loading-endorsement-manager .lem-grid .ant-table-container, .lem-modal .lem-grid .ant-table-container { border:0 !important; }
.loading-endorsement-manager .lem-grid .ant-table-thead > tr > th { background:#bfbfbf !important; border-inline-end:1px solid #cbd1d8 !important; border-bottom:1px solid #cbd1d8 !important; color:#1f1f1f; font-size:12px; line-height:18px; padding:5px 8px; }
.loading-endorsement-manager .lem-grid .ant-table-tbody > tr > td { border-inline-end:0 !important; border-bottom:1px solid #cbd1d8 !important; font-size:12px; line-height:18px; padding:5px 8px; }
.lem-modal .lem-grid .ant-table-thead > tr > th { background:#bfbfbf !important; border-inline-end:1px solid #cbd1d8 !important; border-bottom:1px solid #cbd1d8 !important; color:#1f1f1f; font-size:12px; line-height:18px; padding:4px; }
.lem-modal .lem-grid .ant-table-tbody > tr > td { border-inline-end:0 !important; border-bottom:1px solid #cbd1d8 !important; font-size:12px; line-height:18px; padding:4px; }
.loading-endorsement-manager .lem-grid .ant-table-tbody > tr:hover > td, .lem-modal .lem-grid .ant-table-tbody > tr:hover > td { background:#b7d7ff !important; }
.loading-endorsement-manager .lem-grid .ant-table-tbody > tr.ant-table-row-selected > td, .lem-modal .lem-grid .ant-table-tbody > tr.ant-table-row-selected > td { background:#86b4ff !important; }
.loading-endorsement-manager .lem-actionbar { display:flex; align-items:center; gap:8px; margin-bottom:2px; padding:10px 12px; background:transparent; border:1px solid #e6ebf2; border-radius:6px; }
.lem-modal .lem-actionbar { display:flex; align-items:center; gap:8px; margin-bottom:2px; padding:4px; background:transparent; border:1px solid #e6ebf2; border-radius:6px; }
.loading-endorsement-manager .ant-btn:not(.ant-btn-primary), .lem-modal .ant-btn:not(.ant-btn-primary) { border-color:#8f9aa7; }
.loading-endorsement-manager .ant-btn[disabled], .lem-modal .ant-btn[disabled] { border-color:#6f7b88 !important; opacity:1; }
.loading-endorsement-manager .ant-input, .loading-endorsement-manager .ant-input-number, .loading-endorsement-manager .ant-input-number-input, .loading-endorsement-manager .ant-select-selector,
.lem-modal .ant-input, .lem-modal .ant-input-number, .lem-modal .ant-input-number-input, .lem-modal .ant-select-selector { border-color:#b8c4d1 !important; border-radius:6px !important; }
.loading-endorsement-manager .ant-input:hover, .loading-endorsement-manager .ant-input-number:hover, .loading-endorsement-manager .ant-select:hover .ant-select-selector,
.lem-modal .ant-input:hover, .lem-modal .ant-input-number:hover, .lem-modal .ant-select:hover .ant-select-selector { border-color:#8da9c2 !important; }
.loading-endorsement-manager .ant-input:focus, .loading-endorsement-manager .ant-input-number-focused, .loading-endorsement-manager .ant-select-focused .ant-select-selector,
.lem-modal .ant-input:focus, .lem-modal .ant-input-number-focused, .lem-modal .ant-select-focused .ant-select-selector { border-color:#1677ff !important; box-shadow:0 0 0 2px rgba(22,119,255,.2) !important; }
.loading-endorsement-manager .ant-input[disabled], .loading-endorsement-manager .ant-input-number-disabled, .loading-endorsement-manager .ant-select-disabled .ant-select-selector,
.lem-modal .ant-input[disabled], .lem-modal .ant-input-number-disabled, .lem-modal .ant-select-disabled .ant-select-selector { background:#f5f5f5 !important; border-color:#b8c4d1 !important; cursor:not-allowed; }
.lem-modal .ant-checkbox-inner { border:2px solid #8f9aa7 !important; border-radius:4px; }
.lem-modal .ant-checkbox:hover .ant-checkbox-inner { border-color:#8da9c2 !important; }
.lem-modal .ant-checkbox-checked .ant-checkbox-inner { background:#1677ff !important; border-color:#1677ff !important; }
.lem-modal .ant-modal-content { border:1px solid #cbd1d8; border-radius:6px; }
.lem-modal .ant-modal-header { border-bottom:1px solid #cbd1d8; }
.lem-modal .ant-modal-body { padding:6px; }
.lem-positive { color:#237804; } .lem-negative { color:#cf1322; } .lem-zero { color:#262626; }
`;

        return <DefaultPage 
            title={t('Recargos y descuentos')} 
            icon='calculator'
            subTitle={t('Endoso')}
            extra={<Space>
                {isPolicyActive && baseCessions.length ? <Button type='primary' htmlType='button' loading={reinsuranceCalculating} onClick={calculateReinsurance}>Calcular Endoso</Button> : null}
                {isPolicyActive && baseCessions.length ? <Button type='primary' htmlType='button' disabled={!reinsuranceSimulation || reinsuranceCalculating || reinsuranceConfirmed} onClick={confirmReinsurance}>Confirmar reaseguro</Button> : null}
                <Button className='lem-primary-action' icon={<SaveIcon />} onClick={onSaveLoading}
                    disabled={!hasChanges || (isPolicyActive && baseCessions.length && !reinsuranceConfirmed)}
                    type='primary' htmlType='button' loading={loadingCov}>{ !isPolicyActive ? 'Actualizar Recargos': 'Ejecutar Endoso' }</Button>
                <Button htmlType='button' disabled={!policyId || loadingCov} onClick={function(){ window.location.replace('#/lifePolicy/' + policyId); }}>Retornar a la póliza</Button>
            </Space>}>
            <style>{designStyles}</style>
            <div className='loading-endorsement-manager'>
                <Tabs activeKey={activeWorkspaceTab} onChange={setActiveWorkspaceTab} type='card'>
                    <Tabs.TabPane tab='Cálculo de cobertura' key='loadings'>
                        <div className='lem-grid-panel'><CoveragesTable /></div>
                    </Tabs.TabPane>
                    {reinsuranceSimulation ? <Tabs.TabPane tab='Reaseguro' key='reinsurance'>
            <ReinsuranceWorkspace coverages={coverages} coinsuranceCessions={coinsuranceCessions} coinsuranceContacts={coinsuranceContacts} policy={policySnapshot} />
                    </Tabs.TabPane> : null}
                </Tabs>
                <ModalLoading />
            </div>
        </DefaultPage>
    }
    function ReinsuranceWorkspace({ coverages, coinsuranceCessions, coinsuranceContacts, policy }){
        const { reinsuranceContracts, selectedReinsuranceKey, setSelectedReinsuranceKey,
            reinsuranceDetailTab, setReinsuranceDetailTab, configuredReinsuranceCessions,
            baseCessions, reinsuranceDraft, saveReinsuranceDistribution, openReinsurers,
            reinsurersReady, selectedReinsurerLine, reinsuranceBrokers, reinsuranceContacts,
            updateReinsuranceParticipant, addReinsuranceParticipant, removeReinsuranceParticipant,
            saveReinsuranceParticipants, isReinsuranceCoverage } = useAppContext();
        const policyContracts = (baseCessions || []).reduce(function(result, cession){
            const key = String(cession.contractId || '') + '|';
            if(!result[key]) result[key] = { sumInsured:0, sumInsuredCedant:0, sumInsuredRe:0, premium:0, premiumCedant:0, premiumRe:0, commission:0, tax:0, _sumCoverageKeys:{} };
            const totals = result[key];
            const coverageKey = String(cession.coverageCode || cession.coverageId || cession.cover || cession.id || '');
            const firstCoverageRow = !totals._sumCoverageKeys[coverageKey];
            if(firstCoverageRow){
                totals.premium += Number(cession.premium || 0);
                totals._sumCoverageKeys[coverageKey] = true;
            }
            if(isReinsuranceCoverage(cession)){
                if(firstCoverageRow){
                    totals.sumInsured += Number(cession.sumInsured || 0);
                }
                totals.sumInsuredCedant += Number(cession.sumInsuredCedant || 0);
                totals.sumInsuredRe += Number(cession.sumInsuredRe || 0);
            }
            totals.premiumCedant += Number(cession.premiumCedant || 0);
            totals.premiumRe += Number(cession.premiumRe || 0);
            totals.commission += Number(cession.commission || cession.comissionCedant || 0);
            totals.tax += Number(cession.tax || 0);
            return result;
        }, {});
        const contracts = reinsuranceDraft && Array.isArray(reinsuranceDraft.contracts)
            ? reinsuranceDraft.contracts.map(function(group){
                const rows = group.rows || [];
                 const key = String(group.contractId || '') + '|';
                const policyTotals = policyContracts[key] || { sumInsured:0, sumInsuredCedant:0, sumInsuredRe:0, premium:0, premiumCedant:0, premiumRe:0, commission:0, tax:0 };
                const directCoinsurancePercentage = (coinsuranceCessions || []).reduce(function(total, row){ return total + Number(row.percentage || 0); }, 0);
                const grossPremiumForContract = (baseCessions || []).filter(function(row){ return String(row.contractId || '') === String(group.contractId || ''); }).reduce(function(total, row){ return total + Math.abs(Number(row.premium || 0)); }, 0);
                const coinsurancePremiumForContract = (baseCessions || []).filter(function(row){ return String(row.contractId || '') === String(group.contractId || ''); }).reduce(function(total, row){ return total + Math.abs(Number(row.coPremium || row.coCovPremium || 0)); }, 0);
                const coinsurancePercentage = Math.max(0, Math.min(100, directCoinsurancePercentage || (grossPremiumForContract ? coinsurancePremiumForContract / grossPremiumForContract * 100 : 0)));
                const reinsuranceFactor = (100 - coinsurancePercentage) / 100;
                return { key:String(group.contractId || '') + '|', policyCode:group.policyCode || '', contractId:group.contractId, lineId:'',
                    premium:Number(((policyTotals.premium + rows.reduce(function(total,row){ return total + Number(row.premiumMovement || 0); },0)) * reinsuranceFactor).toFixed(2)),
                    sumInsured:Number(((policyTotals.sumInsured + rows.reduce(function(total,row){ return total + Number(row.sumInsuredMovement || 0); },0)) * reinsuranceFactor).toFixed(2)),
                    premiumCedant:Number((policyTotals.premiumCedant * reinsuranceFactor).toFixed(2)),
                    premiumRe:Number((policyTotals.premiumRe * reinsuranceFactor).toFixed(2)),
                    commission:Number((policyTotals.commission * reinsuranceFactor).toFixed(2)),
                    tax:Number((policyTotals.tax * reinsuranceFactor).toFixed(2)) };
            }) : reinsuranceContracts();
        const selected = contracts.find(function(item){ return item.key === selectedReinsuranceKey; }) || contracts[0];
        const selectedGroup = reinsuranceDraft && selected ? (reinsuranceDraft.contracts || []).find(function(group){ return String(group.contractId || '') + '|' === selected.key; }) : null;
        const reinsurerLineReady = reinsurersReady && selectedGroup && selectedReinsurerLine && selectedReinsurerLine.groupKey === selected.key;
        const selectedLines = selectedGroup ? (selectedGroup.rows || []) : (selected ? configuredReinsuranceCessions().filter(function(cession){
            return String(cession.contractId || '') + '|' === selected.key;
        }) : []);
        return <div className='lem-grid-panel' style={{ padding:8 }}>
            <Alert type='info' showIcon message='Distribución de reaseguro' style={{ marginBottom:8 }} />
            {!contracts.length ? <Empty description='La póliza no tiene contratos de reaseguro configurados.' /> : <>
                <Table className='lem-grid' size='small' pagination={false} rowKey='key' dataSource={contracts}
                    rowSelection={{ type:'radio', selectedRowKeys:selected ? [selected.key] : [], onChange:function(keys){ setSelectedReinsuranceKey(keys[0] || null); setReinsuranceDetailTab('movement'); } }}
                    onRow={function(record){ return { onClick:function(){ setSelectedReinsuranceKey(record.key); setReinsuranceDetailTab('movement'); } }; }}>
                    <Column title='Póliza' dataIndex='policyCode' />
                    <Column title='Contrato' dataIndex='contractId' align='center' />
                    <Column title='Línea' dataIndex='lineId' align='center' />
                    <Column title='Suma' dataIndex='sumInsured' align='right' render={renderNumber} />
                    <Column title='Prima' dataIndex='premium' align='right' render={renderNumber} />
                    <Column title='Prima Ret.' dataIndex='premiumCedant' align='right' render={renderNumber} />
                    <Column title='Prima Ced.' dataIndex='premiumRe' align='right' render={renderNumber} />
                    <Column title='Comisión' dataIndex='commission' align='right' render={renderNumber} />
                    <Column title='Impuesto' dataIndex='tax' align='right' render={renderNumber} />
                </Table>
                {selected ? <Tabs activeKey={reinsuranceDetailTab} onChange={setReinsuranceDetailTab} type='card' style={{ marginTop:8 }}>
                    <Tabs.TabPane tab='Distribución del movimiento' key='movement'>
                        <ReinsuranceMovementDistribution data={selectedLines} savedLines={selectedGroup && selectedGroup.manualDistribution}
                            policyRows={configuredReinsuranceCessions().filter(function(cession){ return String(cession.contractId || '') + '|' === selected.key; })}
                            participants={selectedGroup ? selectedGroup.participants || [] : []} reinsurerContacts={reinsuranceContacts} coinsuranceCessions={coinsuranceCessions} isReinsuranceCoverage={isReinsuranceCoverage} />
                    </Tabs.TabPane>
                    <Tabs.TabPane tab='Distribución' key='distribution'>
                        <ReinsuranceDistributionEditor data={selectedLines} savedLines={selectedGroup && selectedGroup.manualDistribution} policyRows={configuredReinsuranceCessions().filter(function(cession){ return String(cession.contractId || '') + '|' === selected.key; })} coinsuranceCessions={coinsuranceCessions} groupKey={selected.key} onSave={saveReinsuranceDistribution} onOpenReinsurers={openReinsurers} />
                    </Tabs.TabPane>
                    <Tabs.TabPane tab='Reaseguradores' key='reinsurers' disabled={!reinsurerLineReady}>
                        {reinsurerLineReady
                            ? <ReinsuranceParticipants groupKey={selected.key} line={selectedReinsurerLine} data={selectedGroup.participants || []}
                                brokers={reinsuranceBrokers} reinsurers={reinsuranceContacts} onAdd={addReinsuranceParticipant}
                                isReinsuranceCoverage={isReinsuranceCoverage} onUpdate={updateReinsuranceParticipant} onRemove={removeReinsuranceParticipant} onSave={saveReinsuranceParticipants} />
                            : <Empty description='Seleccione la carpeta de una línea cedida para ver sus aceptantes.' />}
                    </Tabs.TabPane>
                    <Tabs.TabPane tab='Coaseguro' key='coinsurance'>
                        <ReinsuranceCoinsuranceView coverages={coverages} cessions={coinsuranceCessions} contacts={coinsuranceContacts} policy={policy} isReinsuranceCoverage={isReinsuranceCoverage} />
                    </Tabs.TabPane>
                    <Tabs.TabPane tab='Cobertura' key='coverage'><ReinsuranceLines data={selectedLines}
                        coverages={coverages} participants={selectedGroup ? selectedGroup.participants || [] : []}
                        policyRows={configuredReinsuranceCessions().filter(function(cession){ return String(cession.contractId || '') + '|' === selected.key; })}
                        contract={selected} isReinsuranceCoverage={isReinsuranceCoverage} /></Tabs.TabPane>
                </Tabs> : null}
            </>}
        </div>;
    }
    function ReinsuranceCoinsuranceView({ coverages, cessions, contacts, policy, isReinsuranceCoverage }){
        const number = function(value){
            const parsed = Number(value || 0);
            return Number.isFinite(parsed) ? parsed : 0;
        };
        const base = (coverages || []).reduce(function(total, coverage){
            const loading = (coverage.Loadings || []).filter(function(item){ return !item.toRemove; });
            const premium = Number(coverage.basePremium || 0) * (1 + getTotalLoading(loading) / 100);
            total.sum += isReinsuranceCoverage(coverage) ? number(coverage.limit || coverage.sumInsured) : 0;
            total.premium += premium;
            return total;
        }, { sum:0, premium:0 });
        const rows = (cessions || []).map(function(cession, index){
            const percentage = number(cession.percentage);
            const premium = Number((base.premium * percentage / 100).toFixed(2));
            const sourcePremium = number(cession.premiumCeded || cession.premium);
            const commissionRate = sourcePremium ? number(cession.commission) / sourcePremium : 0;
            const taxRate = sourcePremium ? number(cession.tax) / sourcePremium : 0;
            const contact = (contacts || []).find(function(item){ return String(item.id) === String(cession.contactId); });
            return {
                key:cession.id || String(cession.contactId || '') + '-' + index,
                name:(contact && contact.name) || (cession.Contact && (cession.Contact.name || cession.Contact.description)) || String(cession.contactId || '-'),
                leader:Number(cession.leader) === 1 || cession.leader === true,
                percentage:percentage,
                sum:Number((base.sum * percentage / 100).toFixed(2)),
                premium:premium,
                commission:Number((premium * commissionRate).toFixed(2)),
                tax:Number((premium * taxRate).toFixed(2))
            };
        });
        const placedPercentage = rows.reduce(function(total, row){ return total + row.percentage; }, 0);
        const companyPercentage = Math.max(0, 100 - placedPercentage);
        const company = {
            key:'company', name:'Compañía', leader:Number(policy && policy.coinsurance) === 1,
            percentage:companyPercentage,
            sum:Number((base.sum * companyPercentage / 100).toFixed(2)),
            premium:Number((base.premium * companyPercentage / 100).toFixed(2)),
            commission:0, tax:0
        };
        const displayRows = rows.concat([company]);
        const total = function(field){ return displayRows.reduce(function(sum, row){ return sum + number(row[field]); }, 0); };
        return <>
            <Alert type='info' showIcon message='Coaseguro informativo'
                description='Los valores se calculan con el estado final del endoso y no son editables. La distribución de reaseguro utiliza únicamente la porción restante.' style={{ marginBottom:8 }} />
            <Table className='lem-grid' size='small' pagination={false} rowKey='key' dataSource={displayRows}
                summary={function(){ return <Table.Summary.Row className='lem-rea-totals'>
                    <Table.Summary.Cell index={0}>Totales</Table.Summary.Cell>
                    <Table.Summary.Cell index={1}></Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align='right'>{renderNumber(total('percentage'))}</Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align='right'>{renderNumber(total('sum'))}</Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align='right'>{renderNumber(total('premium'))}</Table.Summary.Cell>
                    <Table.Summary.Cell index={5} align='right'>{renderNumber(total('commission'))}</Table.Summary.Cell>
                    <Table.Summary.Cell index={6} align='right'>{renderNumber(total('tax'))}</Table.Summary.Cell>
                </Table.Summary.Row>; }}>
                <Column title='Coasegurador' dataIndex='name' />
                <Column title='Líder' dataIndex='leader' align='center' render={function(value){ return value ? 'Sí' : 'No'; }} />
                <Column title='Participación %' dataIndex='percentage' align='right' render={renderNumber} />
                <Column title='Suma' dataIndex='sum' align='right' render={renderNumber} />
                <Column title='Prima' dataIndex='premium' align='right' render={renderNumber} />
                <Column title='Comisión' dataIndex='commission' align='right' render={renderNumber} />
                <Column title='Impuesto' dataIndex='tax' align='right' render={renderNumber} />
            </Table>
        </>;
    }
    function ReinsuranceMovementDistribution({ data, savedLines, policyRows, participants, reinsurerContacts, isReinsuranceCoverage, coinsuranceCessions }){
        const [selectedLine, setSelectedLine] = useState(null);
        const lineKind = function(value){
            const line = String(value || '').trim().toUpperCase();
            if(line.indexOf('RETEN') >= 0 || line === 'RET') return 'retention';
            if(line.indexOf('EXCEDENTE') >= 0 || line.indexOf('EXCESS') >= 0 || line === 'EX1') return 'excess';
            if(line.indexOf('FAC') >= 0) return 'facultative';
            if(line.indexOf('FRONT') >= 0 || line === 'FRO') return 'fronting';
            return 'quota';
        };
        const movementLines = {
            retention:{ sum:0, premium:0, commission:0, tax:0 },
            quota:{ sum:0, premium:0, commission:0, tax:0 },
            excess:{ sum:0, premium:0, commission:0, tax:0 },
            facultative:{ sum:0, premium:0, commission:0, tax:0 },
            fronting:{ sum:0, premium:0, commission:0, tax:0 }
        };
        (data || []).forEach(function(row){
            const kind = lineKind(row.lineId || row.lineName || row.contractName);
            const line = movementLines[kind] || movementLines.quota;
            movementLines.retention.sum += Number(row.sumInsuredCedant || 0);
            movementLines.retention.premium += Number(row.premiumCedant || 0);
            if(kind !== 'retention'){
                line.sum += Number(row.sumInsuredRe || 0);
                line.premium += Number(row.premiumRe || 0);
                line.commission += Number(row.commission || row.comissionCedant || 0);
                line.tax += Number(row.tax || 0);
            }
        });
        const movementBase = Object.keys(movementLines).reduce(function(total, key){
            total.sum += movementLines[key].sum;
            total.premium += movementLines[key].premium;
            return total;
        }, { sum:0, premium:0 });
        const coinsurancePercentage = Math.max(0, Math.min(100, (coinsuranceCessions || []).reduce(function(total, row){ return total + Number(row.percentage || 0); }, 0)));
        const reinsuranceFactor = (100 - coinsurancePercentage) / 100;
        const coinsuranceRate = function(field){
            const totals = (coinsuranceCessions || []).reduce(function(result, row){
                const premium = Number(row.premiumCeded || row.premium || 0);
                result.premium += premium;
                result.value += Number(row[field] || 0);
                return result;
            }, { premium:0, value:0 });
            return totals.premium ? totals.value / totals.premium : 0;
        };
        const lineDefinition = function(key, label, canViewReinsurers){
            const line = movementLines[key];
            const percentage = movementBase.premium ? line.premium / movementBase.premium * 100 : 0;
            return { key:key, contractLabel:label, percentage:percentage,
                commissionPct:line.premium ? line.commission / line.premium * 100 : 0,
                taxPct:line.premium ? line.tax / line.premium * 100 : 0,
                canViewReinsurers:canViewReinsurers };
        };
        const definitions = [
            { key:'nonTechnical', contractLabel:'No Técnica', percentage:0, canViewReinsurers:false },
            lineDefinition('retention', 'Retención', false),
            lineDefinition('quota', 'Cuota Parte', true),
            lineDefinition('excess', 'Excedente 1', true),
            lineDefinition('facultative', 'Facultativo', true),
            lineDefinition('fronting', 'Fronting', true),
            { key:'coinsurance', contractLabel:'Coaseguro', percentage:0, isCoinsurance:true, canViewReinsurers:false,
                commissionPct:coinsuranceRate('commission') * 100, taxPct:coinsuranceRate('tax') * 100 }
        ];
        const savedByKey = (savedLines || []).reduce(function(result, row){ result[row.key] = row; return result; }, {});
        const rows = definitions.map(function(definition){
            const saved = savedByKey[definition.key] || {};
            const row = Object.assign({}, definition, saved);
            const factor = row.isCoinsurance ? 1 : reinsuranceFactor;
            row.sum = row.isCoinsurance
                ? Number((movementBase.sum * coinsurancePercentage / 100).toFixed(2))
                : Number((movementBase.sum * Number(row.percentage || 0) / 100 * factor).toFixed(2));
            row.premium = row.isCoinsurance
                ? Number((movementBase.premium * coinsurancePercentage / 100).toFixed(2))
                : Number((movementBase.premium * Number(row.percentage || 0) / 100 * factor).toFixed(2));
            if(row.key === 'retention' || row.key === 'nonTechnical' || row.key === 'coinsurance'){
                row.commission = row.isCoinsurance ? Number((row.premium * Number(row.commissionPct || 0) / 100).toFixed(2)) : 0;
                row.tax = row.isCoinsurance ? Number((row.premium * Number(row.taxPct || 0) / 100).toFixed(2)) : 0;
                row.balance = 0;
            } else {
                row.commission = Number((row.premium * Number(row.commissionPct || 0) / 100).toFixed(2));
                row.tax = Number((row.premium * Number(row.taxPct || 0) / 100).toFixed(2));
                row.balance = Number((row.premium - row.commission - row.tax).toFixed(2));
            }
            return row;
        });
        const totals = rows.reduce(function(total, row){
            total.percentage += Number(row.percentage || 0);
            total.sum += Number(row.sum || 0);
            total.premium += Number(row.premium || 0);
            total.commission += Number(row.commission || 0);
            total.tax += Number(row.tax || 0);
            total.balance += Number(row.balance || 0);
            return total;
        }, { percentage:0, sum:0, premium:0, commission:0, tax:0, balance:0 });
        const movementParticipants = function(){
            if(!selectedLine) return [];
            const grouped = {};
            (participants || []).filter(function(item){
                return lineKind(item.lineId || item.lineName) === selectedLine.key;
            }).forEach(function(item){
                const key = String(item._participantKey || (String(item.contactId || '') + '|' + String(item.brokerId || '')));
                const contact = (reinsurerContacts || []).find(function(option){ return String(option.id) === String(item.contactId); });
                if(!grouped[key]) grouped[key] = Object.assign({}, item, {
                    contactName:item.contactName || item.name || (contact && contact.name) || '',
                    split:Number(item.split || 0), sumInsured:0, premium:0, commission:0, tax:0
                });
                grouped[key].sumInsured += Number(item.movementSumInsured !== undefined ? item.movementSumInsured : item.sumInsured || 0);
                grouped[key].premium += Number(item.movementPremium !== undefined ? item.movementPremium : item.premium || 0);
                grouped[key].commission += Number(item.movementCommission !== undefined ? item.movementCommission : item.commission || 0);
                grouped[key].tax += Number(item.movementTax !== undefined ? item.movementTax : item.tax || 0);
            });
            return Object.keys(grouped).map(function(key){ return grouped[key]; });
        };
        const selectedParticipants = movementParticipants();
        return <>
            <Alert type='info' showIcon message='Distribución del movimiento' description='Valores informativos calculados únicamente sobre la porción cambiada por el endoso.' style={{ marginBottom:8 }} />
            <Table className='lem-grid lem-rea-distribution' size='small' pagination={false} rowKey='key' dataSource={rows}
                summary={function(){ return <Table.Summary.Row className='lem-rea-totals'>
                    <Table.Summary.Cell index={0}>Totales</Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align='right'>{renderNumber(totals.percentage)}</Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align='right'>{renderNumber(totals.sum)}</Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align='right'>{renderNumber(totals.premium)}</Table.Summary.Cell>
                    <Table.Summary.Cell index={4}></Table.Summary.Cell>
                    <Table.Summary.Cell index={5} align='right'>{renderNumber(totals.commission)}</Table.Summary.Cell>
                    <Table.Summary.Cell index={6}></Table.Summary.Cell>
                    <Table.Summary.Cell index={7} align='right'>{renderNumber(totals.tax)}</Table.Summary.Cell>
                    <Table.Summary.Cell index={8} align='right'>{renderNumber(totals.balance)}</Table.Summary.Cell>
                </Table.Summary.Row>; }}>
                <Column title='Contrato' dataIndex='contractLabel' render={function(value, row){ return <span className='lem-rea-line-label'><span>{value}</span>
                    {row.canViewReinsurers ? <Button type='text' size='small' className='lem-rea-folder-btn' title='Ver reaseguradores' aria-label='Ver reaseguradores' onClick={function(){ setSelectedLine(row); }}><FolderIcon /></Button> : null}
                </span>; }} />
                <Column title='Porcentaje (%)' dataIndex='percentage' align='right' render={renderNumber} />
                <Column title='Suma' dataIndex='sum' align='right' render={renderNumber} />
                <Column title='Prima' dataIndex='premium' align='right' render={renderNumber} />
                <Column title='Pct. Comisión' dataIndex='commissionPct' align='right' render={renderNumber} />
                <Column title='Comisión' dataIndex='commission' align='right' render={renderNumber} />
                <Column title='Pct. Impuesto' dataIndex='taxPct' align='right' render={renderNumber} />
                <Column title='Impuesto' dataIndex='tax' align='right' render={renderNumber} />
                <Column title='Saldo Rea.' dataIndex='balance' align='right' render={renderNumber} />
            </Table>
            {selectedLine ? <div className='lem-rea-movement-participants'>
                <div className='lem-rea-participants-title'>Aceptantes de la línea: {selectedLine.contractLabel}</div>
                <Table className='lem-grid' size='small' pagination={false} rowKey={function(row,index){ return String(row.contactId || '') + '|' + String(row.brokerId || '') + '|' + index; }} dataSource={selectedParticipants}
                    locale={{ emptyText:'La línea seleccionada no tiene aceptantes cedidos.' }}>
                    <Column title='Corredor de reaseguro' dataIndex='brokerName' render={function(value, row){ return value || row.brokerId || '—'; }} />
                    <Column title='Reasegurador' dataIndex='contactName' render={function(value, row){ return value || row.name || row.contactId || '—'; }} />
                    <Column title='Participación %' dataIndex='split' align='right' render={function(value){ return renderNumber(value); }} />
                    <Column title='Suma cedida' dataIndex='sumInsured' align='right' render={renderNumber} />
                    <Column title='Prima cedida' dataIndex='premium' align='right' render={renderNumber} />
                    <Column title='Comisión' dataIndex='commission' align='right' render={renderNumber} />
                    <Column title='Impuesto' dataIndex='tax' align='right' render={renderNumber} />
                </Table>
            </div> : null}
        </>;
    }
    function ReinsuranceDistributionEditor({ data, savedLines, policyRows, coinsuranceCessions, groupKey, onSave, onOpenReinsurers }){
        const coinsurancePercentage = Math.max(0, Math.min(100, (coinsuranceCessions || []).reduce(function(total, row){ return total + Number(row.percentage || 0); }, 0)));
        const coinsuranceRate = function(field){
            const totals = (coinsuranceCessions || []).reduce(function(result, row){
                const premium = Number(row.premiumCeded || row.premium || 0);
                result.premium += premium;
                result.value += Number(row[field] || 0);
                return result;
            }, { premium:0, value:0 });
            return totals.premium ? totals.value / totals.premium : 0;
        };
        const reinsuranceFactor = (100 - coinsurancePercentage) / 100;
        const finalPolicyBalance = function(source, policySource){
            const policy = (policySource && policySource.length ? policySource : source || []).reduce(function(total, row){
                total.sum += Number(row.sumInsured || 0);
                total.premium += Number(row.premium || 0);
                return total;
            }, { sum:0, premium:0 });
            const endorsement = (source || []).reduce(function(total, row){
                total.sum += Number(row.sumInsuredMovement || 0);
                total.premium += Number(row.premiumMovement || 0);
                return total;
            }, { sum:0, premium:0 });
            return { sum:policy.sum + endorsement.sum, premium:policy.premium + endorsement.premium };
        };
        const buildLines = function(source, policySource, storedLines){
            // The policy cessions are the base of the distribution. The simulation
            // only contains the endorsement variation and must not replace this balance.
            const policyRows = policySource && policySource.length ? policySource : source || [];
            const totals = policyRows.reduce(function(total, row){
                total.sum += Number(row.sumInsured || 0);
                total.premium += Number(row.premium || 0);
                total.retentionSum += Number(row.sumInsuredCedant || 0);
                total.retentionPremium += Number(row.premiumCedant || 0);
                total.cededSum += Number(row.sumInsuredRe || 0);
                total.cededPremium += Number(row.premiumRe || 0);
                total.commission += Number(row.commission || row.comissionCedant || 0);
                total.tax += Number(row.tax || 0);
                return total;
            }, { sum:0, premium:0, retentionSum:0, retentionPremium:0, cededSum:0, cededPremium:0, commission:0, tax:0 });
            const lineKind = function(value){
                const line = String(value || '').trim().toUpperCase();
                if(line.indexOf('RETEN') >= 0 || line === 'RET') return 'retention';
                if(line.indexOf('EXCEDENTE') >= 0 || line.indexOf('EXCESS') >= 0 || line === 'EX1') return 'excess';
                if(line.indexOf('FAC') >= 0) return 'facultative';
                if(line.indexOf('FRONT') >= 0 || line === 'FRO') return 'fronting';
                return 'quota';
            };
            // Only lines present in the selected contract may carry a saved
            // distribution. This prevents stale values from activating lines
            // such as Facultativo when the contract only has Cuota Parte.
            const configuredLineKinds = {};
            (policyRows && policyRows.length ? policyRows : source || []).forEach(function(row){
                configuredLineKinds[lineKind(row.lineId || row.lineName || row.contractName)] = true;
            });
            const lineTotals = {
                retention:{ sum:0, premium:0, commission:0, tax:0 },
                quota:{ sum:0, premium:0, commission:0, tax:0 },
                excess:{ sum:0, premium:0, commission:0, tax:0 },
                facultative:{ sum:0, premium:0, commission:0, tax:0 },
                fronting:{ sum:0, premium:0, commission:0, tax:0 }
            };
            const addLineValue = function(target, row, isMovement){
                const kind = lineKind(row.lineId || row.lineName || row.contractName);
                if(kind !== 'retention' && !configuredLineKinds[kind]) return;
                const line = lineTotals[kind] || lineTotals.quota;
                // Retention is stored inside each cession, usually on the
                // Cuota Parte row, not necessarily as a separate lineId.
                lineTotals.retention.sum += Number(row.sumInsuredCedant || 0);
                lineTotals.retention.premium += Number(row.premiumCedant || 0);
                if(kind !== 'retention'){
                    line.sum += Number(row.sumInsuredRe || 0);
                    line.premium += Number(row.premiumRe || 0);
                    line.commission += Number(row.commission || row.comissionCedant || 0);
                    line.tax += Number(row.tax || 0);
                }
            };
            (policyRows || []).forEach(function(row){ addLineValue(lineTotals, row, false); });
            (source || []).forEach(function(row){ addLineValue(lineTotals, row, true); });
            const distributedPremium = Object.keys(lineTotals).reduce(function(total, key){ return total + lineTotals[key].premium; }, 0);
            const distributedSum = Object.keys(lineTotals).reduce(function(total, key){ return total + lineTotals[key].sum; }, 0);
            const hasLineDistribution = distributedPremium !== 0 || distributedSum !== 0;
            const grossBalance = hasLineDistribution
                ? { sum:distributedSum, premium:distributedPremium }
                : finalPolicyBalance(source, policySource);
            const finalBalance = { sum:grossBalance.sum * reinsuranceFactor, premium:grossBalance.premium * reinsuranceFactor };
            const lineName = source && source[0] && (source[0].contractName || source[0].lineName || source[0].lineId) || 'Cuota Parte';
            const lineDefinition = function(key, label, canViewReinsurers){
                const line = lineTotals[key];
                if(key !== 'retention' && !configuredLineKinds[key]){
                    return { key:key, contractLabel:label, percentage:0, sum:0, premium:0,
                        commissionPct:0, commission:0, taxPct:0, tax:0, balance:0,
                        canViewReinsurers:false, readOnly:true, inactive:true };
                }
                const percentage = distributedPremium ? line.premium / distributedPremium * 100 : 0;
                return {
                    key:key, contractLabel:label, percentage:percentage,
                    sum:Number((line.sum * reinsuranceFactor).toFixed(2)),
                    premium:Number((line.premium * reinsuranceFactor).toFixed(2)),
                    commissionPct:line.premium ? line.commission / line.premium * 100 : 0,
                    commission:Number((line.commission * reinsuranceFactor).toFixed(2)),
                    taxPct:line.premium ? line.tax / line.premium * 100 : 0,
                    tax:Number((line.tax * reinsuranceFactor).toFixed(2)), balance:0,
                    canViewReinsurers:canViewReinsurers
                };
            };
            const distribution = [
                { key:'nonTechnical', contractLabel:'No Técnica', percentage:0, sum:0, premium:0, commissionPct:0, commission:0, taxPct:0, tax:0, balance:0, readOnly:true, canViewReinsurers:false },
                Object.assign(lineDefinition('retention', 'Retención', false), { readOnly:true }),
                Object.assign(lineDefinition('quota', lineName === 'Cuota Parte' ? lineName : 'Cuota Parte', true), {}),
                lineDefinition('excess', 'Excedente 1', true),
                lineDefinition('facultative', 'Facultativo', true),
                lineDefinition('fronting', 'Fronting', true),
                { key:'coinsurance', contractLabel:'Coaseguro', percentage:0, isCoinsurance:true,
                    sum:Number((grossBalance.sum * coinsurancePercentage / 100).toFixed(2)),
                    premium:Number((grossBalance.premium * coinsurancePercentage / 100).toFixed(2)),
                    commissionPct:coinsuranceRate('commission') * 100,
                    commission:0, taxPct:coinsuranceRate('tax') * 100, tax:0, balance:0, readOnly:true, canViewReinsurers:false }
            ];
            const recalculate = function(row){
                const next = Object.assign({}, row);
                if(next.isCoinsurance){
                    next.sum = Number((grossBalance.sum * coinsurancePercentage / 100).toFixed(2));
                    next.premium = Number((grossBalance.premium * coinsurancePercentage / 100).toFixed(2));
                } else {
                    next.sum = Number((finalBalance.sum * Number(next.percentage || 0) / 100).toFixed(2));
                    next.premium = Number((finalBalance.premium * Number(next.percentage || 0) / 100).toFixed(2));
                }
                if(next.key === 'retention' || next.key === 'coinsurance'){
                    next.commission = next.isCoinsurance ? Number((next.premium * Number(next.commissionPct || 0) / 100).toFixed(2)) : 0;
                    next.tax = next.isCoinsurance ? Number((next.premium * Number(next.taxPct || 0) / 100).toFixed(2)) : 0;
                    next.balance = 0;
                } else {
                    next.commission = Number((next.premium * Number(next.commissionPct || 0) / 100).toFixed(2));
                    next.tax = Number((next.premium * Number(next.taxPct || 0) / 100).toFixed(2));
                    next.balance = Number((next.premium - next.commission - next.tax).toFixed(2));
                }
                return next;
            };
            return storedLines && storedLines.length ? storedLines.map(function(row){
                const definition = distribution.find(function(item){ return item.key === row.key; }) || {};
                // Ignore previously saved values for lines no longer present
                // in the selected contract configuration.
                return definition.inactive ? definition : recalculate(Object.assign({}, definition, row));
            }) : distribution.map(recalculate);
        };
        const [lines, setLines] = useState(function(){ return buildLines(data, policyRows, savedLines); });
        useEffect(function(){ setLines(buildLines(data, policyRows, savedLines)); }, [data, policyRows, savedLines]);
        const grossMovement = finalPolicyBalance(data, policyRows);
        const movement = { sum:grossMovement.sum * reinsuranceFactor, premium:grossMovement.premium * reinsuranceFactor };
        const editLine = function(key, field, raw){
            const value = Number(String(raw == null ? '' : raw).replace(/,/g, ''));
            if(!Number.isFinite(value)) return;
            setLines(function(current){
                const updated = current.map(function(line){
                if(line.key !== key) return line;
                const next = Object.assign({}, line, { [field]:value });
                if(field === 'percentage'){
                    next.sum = Number((movement.sum * value / 100).toFixed(2));
                    next.premium = Number((movement.premium * value / 100).toFixed(2));
                    next.commission = Number((next.premium * Number(next.commissionPct || 0) / 100).toFixed(2));
                    next.tax = Number((next.premium * Number(next.taxPct || 0) / 100).toFixed(2));
                }
                if(field === 'commissionPct') next.commission = Number((next.premium * value / 100).toFixed(2));
                if(field === 'taxPct') next.tax = Number((next.premium * value / 100).toFixed(2));
                next.balance = next.key === 'retention' || next.key === 'coinsurance'
                    ? 0
                    : Number((next.premium - next.commission - next.tax).toFixed(2));
                return next;
                });
                return updated;
            });
        };
        const rows = lines;
        const totals = rows.reduce(function(total, row){
            total.percentage += Number(row.percentage || 0);
            total.sumInsured += Number(row.sum || 0);
            total.premium += Number(row.premium || 0);
            total.commission += Number(row.commission || 0);
            total.tax += Number(row.tax || 0);
            return total;
        }, { percentage:0, sumInsured:0, premium:0, commission:0, tax:0 });
        const formatDistributionInput = function(value, name){
            const number = Number(value);
            if(!Number.isFinite(number)) return '';
            const isPercentage = name === 'percentage' || name === 'commissionPct' || name === 'taxPct';
            return number.toLocaleString('en-US', {
                useGrouping:true,
                minimumFractionDigits:isPercentage ? 0 : 2,
                maximumFractionDigits:isPercentage ? 4 : 2
            });
        };
        const field = function(record, name){
            const isCededLine = !!record.canViewReinsurers;
            const isCommissionOrTax = name === 'commissionPct' || name === 'commission' || name === 'taxPct' || name === 'tax';
            const disabled = isCommissionOrTax ? !isCededLine : (record.key === 'nonTechnical' || record.key === 'coinsurance');
            return <Input className='lem-rea-financial-input' disabled={disabled} inputMode='decimal'
                value={record[name] == null ? '' : formatDistributionInput(record[name], name)}
                onChange={function(event){ editLine(record.key, name, event.target.value); }} />;
        };
        return <>
            <div className='lem-rea-actionbar'><Button type='primary' htmlType='button' onClick={function(){ onSave(groupKey, lines); }}>Guardar</Button><span>Distribución de reaseguro</span></div>
            <Table className='lem-grid lem-rea-distribution' size='small' pagination={false} rowKey={function(row,index){ return String(row.coverageCode || row.code || '') + '|' + index; }} dataSource={rows}
                summary={function(){ return <Table.Summary.Row className='lem-rea-totals'>
                    <Table.Summary.Cell index={0}>Totales</Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align='right'>{renderNumber(totals.percentage)}</Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align='right'>{renderNumber(totals.sumInsured)}</Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align='right'>{renderNumber(totals.premium)}</Table.Summary.Cell>
                    <Table.Summary.Cell index={4}></Table.Summary.Cell>
                    <Table.Summary.Cell index={5} align='right'>{renderNumber(totals.commission)}</Table.Summary.Cell>
                    <Table.Summary.Cell index={6}></Table.Summary.Cell>
                    <Table.Summary.Cell index={7} align='right'>{renderNumber(totals.tax)}</Table.Summary.Cell>
                    <Table.Summary.Cell index={8} align='right'>{renderNumber(rows.reduce(function(total, row){ return total + Number(row.balance || 0); }, 0))}</Table.Summary.Cell>
                </Table.Summary.Row>; }}>
            <Column title='Contrato' dataIndex='contractLabel' render={function(value, row){ return <span className='lem-rea-line-label'>
                <span>{value}</span>{row.canViewReinsurers ? <Button type='text' size='small' className='lem-rea-folder-btn'
                    title='Ver reaseguradores' aria-label='Ver reaseguradores' onClick={function(event){ event.stopPropagation(); onOpenReinsurers(Object.assign({}, row, { groupKey:groupKey })); }}><FolderIcon /></Button> : null}
            </span>; }} />
            <Column title='Porcentaje (%)' render={function(_, row){ return field(row,'percentage'); }} />
            <Column title='Suma' render={function(_, row){ return field(row,'sum'); }} />
            <Column title='Prima' render={function(_, row){ return field(row,'premium'); }} />
            <Column title='Pct. Comisión' render={function(_, row){ return field(row,'commissionPct'); }} />
            <Column title='Comisión' render={function(_, row){ return field(row,'commission'); }} />
            <Column title='Pct. Impuesto' render={function(_, row){ return field(row,'taxPct'); }} />
            <Column title='Impuesto' render={function(_, row){ return field(row,'tax'); }} />
            <Column title='Saldo Rea.' dataIndex='balance' align='right' render={renderNumber} />
            </Table>
            <Alert type={Math.abs(totals.percentage - 100) <= 0.01 ? 'success' : 'warning'} showIcon
                message={Math.abs(totals.percentage - 100) <= 0.01 ? 'La distribución de reaseguro es válida para ejecutar.' : 'La distribución debe sumar 100% para poder confirmar.'}
                style={{ marginTop:2 }} />
        </>;
    }
    function ReinsuranceParticipants({ groupKey, line, data, brokers, reinsurers, isReinsuranceCoverage, onAdd, onUpdate, onRemove, onSave }){
        const grouped = {};
        (data || []).filter(function(item){ return (item.distributionLineKey || 'quota') === line.key && isReinsuranceCoverage(item); }).forEach(function(item){
            const key = String(item._participantKey || (String(item.contactId || '') + '|' + String(item.brokerId || '')));
            if(!grouped[key]) grouped[key] = Object.assign({}, item, { _participantKey:key, split:Number(item.split || 0), sumInsured:0, premium:0, commission:0, tax:0 });
            grouped[key].sumInsured += Number(item.sumInsured || 0);
            grouped[key].premium += Number(item.premium || 0);
            grouped[key].commission += Number(item.commission || 0);
            grouped[key].tax += Number(item.tax || 0);
        });
        const participants = Object.keys(grouped).map(function(key){
            const participant = grouped[key];
            participant.sumInsured = Number(participant.sumInsured.toFixed(2));
            participant.premium = Number(participant.premium.toFixed(2));
            participant.commission = Number(participant.commission.toFixed(2));
            participant.tax = Number(participant.tax.toFixed(2));
            return participant;
        });
        const brokerOptions = (brokers || []).map(function(item){ return { id:item.id, name:item.name }; });
        const reinsurerOptions = (reinsurers || []).map(function(item){ return { id:item.id, name:item.name }; });
        participants.forEach(function(item){
            if(item.brokerId && !brokerOptions.some(function(option){ return String(option.id) === String(item.brokerId); })){
                brokerOptions.push({ id:item.brokerId, name:item.brokerName || String(item.brokerId) });
            }
            if(item.contactId && !reinsurerOptions.some(function(option){ return String(option.id) === String(item.contactId); })){
                reinsurerOptions.push({ id:item.contactId, name:item.contactName || item.name || String(item.contactId) });
            }
        });
        const numericField = function(field){
            return function(value, row){ return <Input className='lem-rea-financial-input' value={value == null ? '' : String(value)}
                onChange={function(event){ onUpdate(groupKey, row._participantKey, field, event.target.value, line); }} />; };
        };
        return <>
            <div className='lem-rea-actionbar'>
                <Button type='primary' size='small' htmlType='button' onClick={function(){ onAdd(groupKey, line); }}>Agregar aceptante</Button>
                <Button size='small' htmlType='button' onClick={function(){ onSave(groupKey, line); }}>Guardar distribución</Button>
                <span>Distribución de aceptantes: {line.contractLabel}</span>
            </div>
            <Table className='lem-grid' size='small' pagination={false} rowKey='_participantKey' dataSource={participants}
                locale={{ emptyText:'No hay aceptantes para esta línea cedida.' }}>
                <Column title='Corredor de reaseguro' dataIndex='brokerId' render={function(value, row){ return <Select size='small' value={value || undefined} placeholder='Seleccione' style={{ width:170 }}
                    onChange={function(next){ onUpdate(groupKey, row._participantKey, 'brokerId', next, line); }}>
                    {brokerOptions.map(function(option){ return <Select.Option key={String(option.id)} value={option.id}>{option.name}</Select.Option>; })}
                </Select>; }} />
                <Column title='Reasegurador' dataIndex='contactId' render={function(value, row){ return <Select size='small' value={value || undefined} placeholder='Seleccione' style={{ width:300 }}
                    onChange={function(next){ onUpdate(groupKey, row._participantKey, 'contactId', next, line); }}>
                    {reinsurerOptions.map(function(option){ return <Select.Option key={String(option.id)} value={option.id}>{option.name}</Select.Option>; })}
                </Select>; }} />
                <Column title='Línea' dataIndex='lineId' />
                <Column title='Participación (%)' dataIndex='split' render={numericField('split')} />
                <Column title='Suma cedida' dataIndex='sumInsured' render={numericField('sumInsured')} />
                <Column title='Prima cedida' dataIndex='premium' render={numericField('premium')} />
                <Column title='Comisión' dataIndex='commission' render={numericField('commission')} />
                <Column title='Impuesto' dataIndex='tax' render={numericField('tax')} />
                <Column title='Acciones' render={function(_, row){ return <Button type='link' danger size='small' onClick={function(){ onRemove(groupKey, row._participantKey, line); }}>Eliminar</Button>; }} />
            </Table>
        </>;
    }
    function ReinsuranceLines({ data, coverages, participants, policyRows, contract, isReinsuranceCoverage }){
        const rows = (data || []).map(function(row, index){
            const code = String(row.coverageCode || row.coverageId || row.code || '');
            const coverage = (coverages || []).find(function(item){ return String(item.code || '') === code; });
            const baseCession = (policyRows || []).find(function(item){ return String(item.coverageCode || item.coverageId || '') === code; });
            const enriched = Object.assign({}, row, {
                coverageCode: code,
                cover: row.cover || row.coverageName || row.description || (coverage && (coverage.name || coverage.description)) || code,
                counts: typeof row.counts === 'boolean' ? row.counts : !!isReinsuranceCoverage(row),
                _rowKey: code + '|' + index,
                _baseCessionId: row.basedOnCessionId || row.cessionId || (baseCession && baseCession.id)
            });
            return enriched;
        });
        const participantsFor = function(row){
            return (participants || []).filter(function(item){
                const itemCode = String(item.coverageCode || item.coverageId || '');
                return itemCode === String(row.coverageCode) || (!itemCode && String(item.cessionId || '') === String(row._baseCessionId || ''));
            }).map(function(item, index){
                return Object.assign({}, item, {
                    _participantKey: String(item.contactId || '') + '|' + String(item.brokerId || '') + '|' + String(row.coverageCode) + '|' + index,
                    brokerDescription: item.brokerName || item.brokerDescription || item.broker || '-',
                    contactDescription: item.contactName || item.name || item.contactDescription || String(item.contactId || '-')
                });
            });
        };
        const participantColumns = [
            { title:'Corredor de reaseguro', dataIndex:'brokerDescription' },
            { title:'Reasegurador', dataIndex:'contactDescription' },
            { title:'Participación %', dataIndex:'split', align:'right', render:function(value){ return Number(value || 0).toFixed(4) + '%'; } },
            { title:'Suma cedida', dataIndex:'sumInsured', align:'right', render:renderNumber },
            { title:'Prima cedida', dataIndex:'premium', align:'right', render:renderNumber },
            { title:'Comisión', dataIndex:'commission', align:'right', render:renderNumber },
            { title:'Impuesto', dataIndex:'tax', align:'right', render:renderNumber }
        ];
        const counted = rows.filter(function(row){ return row.counts; }).length;
        const movement = rows.reduce(function(total, row){ return total + Number(row.premiumMovement || 0); }, 0);
        const signedNumber = function(value){
            const amount = Number(value || 0);
            const prefix = amount > 0 ? '+' : '';
            return <span className={amount > 0 ? 'lem-positive' : (amount < 0 ? 'lem-negative' : 'lem-zero')}>{prefix}{amount.toLocaleString('en-us',{ minimumFractionDigits:2, maximumFractionDigits:4 })}</span>;
        };
        const coverageColumns = [
            { title:'Cobertura', dataIndex:'coverageCode', width:100 },
            { title:'Descripción', dataIndex:'cover', width:190 },
            { title:'Suma para el contrato', dataIndex:'counts', width:150, render:function(value){ return value ? <Tag color='blue'>Sí</Tag> : <Tag>No</Tag>; } },
            { title:'Suma movimiento', dataIndex:'sumInsuredMovement', align:'right', width:130, render:function(value, row){ return renderNumber(value || row.sumMovement || 0); } },
            { title:'Movimiento', dataIndex:'premiumMovement', align:'right', width:120, render:function(value){ return signedNumber(value); } },
            { title:'Base prorrateada', dataIndex:'proratedMovement', align:'right', width:140, render:function(value){ return signedNumber(value); } },
            { title:'Pct. Retención', dataIndex:'proportionCed', align:'right', width:120, render:function(value){ return (Number(value || 0) * 100).toFixed(2) + '%'; } },
            { title:'Suma retención', dataIndex:'sumInsuredCedant', align:'right', width:130, render:renderNumber },
            { title:'Prima retención', dataIndex:'premiumCedant', align:'right', width:130, render:renderNumber },
            { title:'Pct. Cedido', dataIndex:'proportionRe', align:'right', width:110, render:function(value){ return (Number(value || 0) * 100).toFixed(2) + '%'; } },
            { title:'Suma cedida', dataIndex:'sumInsuredRe', align:'right', width:130, render:renderNumber },
            { title:'Prima cedida', dataIndex:'premiumRe', align:'right', width:130, render:renderNumber },
            { title:'Comisión', dataIndex:'commission', align:'right', width:120, render:renderNumber },
            { title:'Impuesto', dataIndex:'tax', align:'right', width:120, render:renderNumber }
        ];
        return <div className='lem-rea-coverage-view'>
            <div className='lem-rea-coverage-summary'>
                <b>Contrato:</b> {contract && contract.contractId} {' | '} <b>Línea:</b> {contract && contract.lineId} {' | '}
                <b>Movimiento:</b> <span className={Number(movement) >= 0 ? 'lem-positive' : 'lem-negative'}>{Number(movement) > 0 ? '+' : ''}{Number(movement || 0).toLocaleString('en-us',{ minimumFractionDigits:2, maximumFractionDigits:4 })}</span> {' | '}
                <b>Coberturas que suman:</b> {counted}/{rows.length}
            </div>
            <Table className='lem-grid lem-rea-coverage' size='small' pagination={false} rowKey='_rowKey' dataSource={rows}
                scroll={{ x: 1750 }} columns={coverageColumns}
                expandable={{
                    expandedRowRender:function(row){
                        const coverageParticipants = participantsFor(row);
                        return <div className='lem-rea-coverage-participants'>
                            <div className='lem-rea-participants-title'>Aceptantes de la cobertura</div>
                            <Table className='lem-grid' size='small' pagination={false} rowKey='_participantKey'
                                dataSource={coverageParticipants} columns={participantColumns}
                                locale={{ emptyText:'No hay aceptantes para esta cobertura.' }} />
                        </div>;
                    },
                    rowExpandable:function(row){ return participantsFor(row).length > 0; }
                }} />
        </div>;
    }
    return <AppProvider>
        <App />
    </AppProvider>
    /**
     * @function getPolicyId
     * @version 1.0.0
     * @author Noel Obando
     * @description Extracts policyId from URL query parameters.
     * 
     * @returns {number|string} Policy ID or 0 if not found
     */
    function getPolicyId(){
        return new URL(window.location.href.replace('#/')).searchParams.get('policyId') || 0;
    }

    function buildEffectiveDateTime(policyStart, selectedValue) {
        const selectedDate = parseSelectedDate(selectedValue);
        if (!selectedDate) return '';

        const now = new Date();
        const startDate = parseUtcDate(policyStart);
        const selectedTime = Date.UTC(
            selectedDate.getUTCFullYear(),
            selectedDate.getUTCMonth(),
            selectedDate.getUTCDate(),
            now.getUTCHours(),
            now.getUTCMinutes(),
            now.getUTCSeconds(),
            now.getUTCMilliseconds()
        );

        if (startDate && selectedTime < startDate.getTime()) {
            return formatUtcDateTime7(new Date(Date.UTC(
                selectedDate.getUTCFullYear(),
                selectedDate.getUTCMonth(),
                selectedDate.getUTCDate(),
                startDate.getUTCHours(),
                startDate.getUTCMinutes(),
                startDate.getUTCSeconds(),
                startDate.getUTCMilliseconds()
            )));
        }

        return formatUtcDateTime7(new Date(selectedTime));
    }

    function formatLocalDate(value) {
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        const year = String(date.getFullYear()).padStart(4, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
    }

    function parseSelectedDate(value) {
        if (!value) return null;

        if (typeof value.toDate === 'function') {
            const asDate = value.toDate();
            return asDate instanceof Date && !Number.isNaN(asDate.getTime()) ? asDate : null;
        }

        const raw = String(value).trim();
        if (!raw) return null;

        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
            const parts = raw.split('-');
            const date = new Date(Date.UTC(
                Number(parts[0]),
                Number(parts[1]) - 1,
                Number(parts[2]),
                0,
                0,
                0,
                0
            ));
            return Number.isNaN(date.getTime()) ? null : date;
        }

        const parsed = new Date(raw);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    function parseUtcDate(value) {
        if (!value) return null;

        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    function formatUtcDateTime7(date) {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
            return '';
        }

        const year = String(date.getUTCFullYear()).padStart(4, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');
        const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}0000`;
    }
    /**
     * @function CoveragesTable
     * @version 1.0.0
     * @author Noel Obando
     * @description Displays a list of coverages with calculated financial values such as loading, extra premium, and total premium.
     * 
     * @returns {JSX.Element}
     */
    function CoveragesTable(){
        const { coverages, loadingCov, openModal } = useAppContext();
        const totals = (coverages || []).reduce(function(total, coverage){
            const loadingRate = Number(getTotalLoading(coverage.Loadings || []) || 0) / 100;
            const basePremium = Number(coverage.basePremium || 0);
            total.limit += Number(coverage.limit || 0);
            total.basePremium += basePremium;
            total.extraPremium += basePremium * loadingRate;
            total.premium += basePremium * (1 + loadingRate);
            return total;
        }, { limit:0, basePremium:0, extraPremium:0, premium:0 });
        return <Table className='lem-grid' size='small' rowKey='id' dataSource={ coverages || []} loading={loadingCov}
            summary={function(){ return <Table.Summary.Row className='lem-rea-totals'>
                <Table.Summary.Cell index={0} colSpan={2}>Totales</Table.Summary.Cell>
                <Table.Summary.Cell index={2} align='right'>{renderNumber(totals.limit)}</Table.Summary.Cell>
                <Table.Summary.Cell index={3} align='right'>{renderNumber(totals.basePremium)}</Table.Summary.Cell>
                <Table.Summary.Cell index={4}></Table.Summary.Cell>
                <Table.Summary.Cell index={5} align='right'>{renderNumber(totals.extraPremium)}</Table.Summary.Cell>
                <Table.Summary.Cell index={6} align='right'>{renderNumber(totals.premium)}</Table.Summary.Cell>
                <Table.Summary.Cell index={7}></Table.Summary.Cell>
            </Table.Summary.Row>; }}>
            <Column title={t('Code')}           dataIndex='code' key='coverageCode' />
            <Column title={t('Name')}           dataIndex='name' key='name' render={ value => <b>{value}</b>}/>
            <Column title={t('Sum Assured')}    dataIndex='limit' key='sa' align='right' render={renderNumber}/>
            <Column title={t('Base Premium')}   dataIndex='basePremium' key='basePremium' align='right' render={renderNumber}/>
            <Column title={t('Loading')}        dataIndex='Loadings' key='loading' align='right' render={getTotalLoading}/>
            <Column title={t('Extra Premium')}  dataIndex='Loadings' key='extraPremium' align='right' render={calcExtraPremium} />
            <Column title={t('Premium')}        dataIndex='Loadings' key='premium' align='right' render={calcPremium} />
            <Column title={t('Acción')}         dataIndex='id' key='action' render={(_, cov)=> renderAction(cov, openModal)} />
        </Table>
    }
    /**
     * @function ModalLoading
     * @version 1.0.0
     * @author Noel Obando
     * @description Modal container that toggles between loading list view and loading form.
     * 
     * @returns {JSX.Element}
     */
    function ModalLoading(){
        const { isModalOpen, onModalSubmit, requestCloseModal, menuAction, hasPendingLoadingChanges } = useAppContext();
        const hasPendingChanges = menuAction === 1 && hasPendingLoadingChanges;
        const pendingMessage = 'Tiene cambios pendientes de guardar. Guarde el recargo/descuento antes de cerrar la ventana.';
        const footer = <Space>
            <Button htmlType='button' onClick={requestCloseModal}>Cancelar</Button>
            <Tooltip title={hasPendingChanges ? pendingMessage : null}>
                <span>
                    <Button type='primary' htmlType='button' disabled={hasPendingChanges} onClick={onModalSubmit}>
                        Aceptar
                    </Button>
                </span>
            </Tooltip>
        </Space>;

        return <Modal wrapClassName='lem-modal' title={t('Coverage Detail')} width={650} open={ isModalOpen } footer={footer} onCancel={requestCloseModal}>
            { menuAction === 0 && <LoadingTable />}
            { menuAction === 1 && <LoadingForm /> }
        </Modal>
    }
    /**
     * @function LoadingTable
     * @version 1.0.0
     * @author Noel Obando
     * @description Displays the list of loadings (extra premiums) associated with a selected coverage.
     * Allows editing existing loadings.
     * 
     * @returns {JSX.Element}
     */
    function LoadingTable(){
        const { selectedCov, showLoadingForm, removeLoading } = useAppContext();
        if(!selectedCov)
            return <Empty />
        return <div>
            <div className='lem-actionbar'>
            <Button type='primary' htmlType='button' onClick={ ()=> showLoadingForm(null) }>
                <PlusIcon /> {t('New')}
            </Button>
            </div>
        <Table className='lem-grid' size='small' dataSource={ selectedCov.Loadings || []} rowKey='id'>
            <Column title={t('Type')}       dataIndex='riskType' key='riskType' render={renderText}/>
            <Column title={t('Risk Type')}  dataIndex='RiskType' key='riskType' render={(value, r) => renderText(value ? value.name : '', r) } />
            <Column
                title={t('Loading')}
                key='loading'
                render={function(_, record){

                    if(record.byAmount){
                        return renderText(
                            Number(record.fixedAmount || 0)
                                .toLocaleString('en-us',{
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }),
                            record
                        );
                    }

                    return renderText(
                        Number(record.loading || 0)
                            .toLocaleString('en-us',{
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 4
                            }) + '%',
                        record
                    );
                }}
            />
            <Column title={t('Loading')}    dataIndex='loading' key='loadingValue' render={ (value, r) => renderNumber( value * selectedCov.basePremium / 100, r) } />
            <Column
                title={t('Action')}
                dataIndex='id'
                key='id'
                render={function(_, record){
                    const isPersisted = !isNaN(record.id);
                    return <Space size={4}>
                        <Button
                            disabled={isPersisted}
                            type='link'
                            htmlType='button'
                            onClick={function(){ showLoadingForm(record); }}
                        >
                            <PencilIcon />
                        </Button>
                        <Button
                            disabled={isPersisted}
                            type='link'
                            danger
                            htmlType='button'
                            onClick={function(){ removeLoading(record); }}
                        >
                            <DeleteIcon />
                        </Button>
                    </Space>;
                }}
            />
        </Table>
        </div>
    }
    /**
     * @function LoadingForm
     * @version 1.0.0
     * @author Noel Obando
     * @description Form component used to create or edit a loading entry.
     * Includes validation and supports applying the loading to all coverages.
     * 
     * @returns {JSX.Element}
     */
    function LoadingForm(){
        const { form, riskTypes, onAddLoading, requestHideLoadingForm, selected, removeLoading, setHasPendingLoadingChanges } = useAppContext();
        useEffect(()=>{
            if(!selected){
                form.resetFields();
                form.setFieldsValue({
                    riskType: 'COMMERCIAL',
                    byAmount: false,
                    surcharge: null,
                    discount: null,
                    surchargeAmount: null,
                    discountAmount: null,
                    applyAll: false
                });
                return;
            }

            const byAmount = !!selected.byAmount;
            const storedValue = Number(
                byAmount ? selected.fixedAmount : selected.loading
            ) || 0;

            form.resetFields();
            form.setFieldsValue({
                ...selected,
                byAmount,
                surcharge: !byAmount && storedValue > 0 ? storedValue : null,
                discount: !byAmount && storedValue < 0 ? Math.abs(storedValue) : null,
                surchargeAmount: byAmount && storedValue > 0 ? storedValue : null,
                discountAmount: byAmount && storedValue < 0 ? Math.abs(storedValue) : null
            });
        },[ selected ])

        return <Form
            form={ form }
            layout='vertical'
            initialValues={{riskType:'COMMERCIAL'}}
            onFieldsChange={function(){ setHasPendingLoadingChanges(true); }}
        >
        <Row gutter={ 16 }>
            <Col span={24}>
                <Space className='lem-actionbar'>
                    <Button type='link' htmlType='button' onClick={requestHideLoadingForm}>
                        <BackIcon /> {t('Back')}
                    </Button>
                    <Button type='link' htmlType='button' onClick={onAddLoading}>
                        <SaveIcon /> {t('Save Loading')}
                    </Button>
                    <Button type='link' htmlType='button' onClick={removeLoading} disabled={!selected}>
                        <DeleteIcon /> {t('Remove Loading')}
                    </Button>
                </Space>
            </Col>
            <Col span={24}>
            <Row gutter={16}>

                <Col span={24}>
                    <Form.Item
                        name='riskType'
                        label={t('Risk')}
                        rules={[{
                            required: true,
                            message:'Tipo de riesgo es obligatorio'
                        }]}
                    >
                        <Select
                            options={riskTypes}
                            showSearch
                            placeholder={t('Risk Type')}
                        />
                    </Form.Item>
                </Col>

                <Form.Item
                    noStyle
                    shouldUpdate={function(prev, curr){
                        return prev.byAmount !== curr.byAmount;
                    }}
                >
                    {function({ getFieldValue }){
                        const byAmount = !!getFieldValue('byAmount');
                        const labelSuffix = byAmount ? ' (monto)' : ' (%)';
                        const precision = byAmount ? 2 : 4;
                        const step = byAmount ? 0.01 : 0.0001;

                        return <>
                <Col span={9}>
                    <Form.Item
                        name={byAmount ? 'surchargeAmount' : 'surcharge'}
                        label={<strong>Recargo{labelSuffix}</strong>}
                    >
                        <InputNumber
                            min={0}
                            style={{ width:'100%' }}
                            precision={precision}
                            step={step}
                        />
                    </Form.Item>
                </Col>

                <Col span={9}>
                    <Form.Item
                        name={byAmount ? 'discountAmount' : 'discount'}
                        label={<strong>Descuento{labelSuffix}</strong>}
                    >
                        <InputNumber
                            min={0}
                            style={{ width:'100%' }}
                            precision={precision}
                            step={step}
                        />
                    </Form.Item>
                </Col>

                <Col span={6}>
                    <Form.Item
                        label={<strong>Por Monto</strong>}
                        name='byAmount'
                        valuePropName='checked'
                    >
                        <Switch />
                    </Form.Item>
                </Col>
                        </>;
                    }}
                </Form.Item>

                <Col span={24}>
                    <Form.Item
                        name='applyAll'
                        valuePropName='checked'
                    >
                        <Checkbox>
                            ¿Todas las coberturas?
                        </Checkbox>
                    </Form.Item>
                </Col>

            </Row>
            </Col>

        </Row>
    </Form>
    }
    /**
     * @function getTotalLoading
     * @version 1.0.0
     * @author Noel Obando
     * @description Calculates the total loading percentage from a list of loadings.
     * 
     * @param {Array<Object>} Loadings - List of loading objects
     * @param {number} Loadings[].loading - Loading percentage
     * 
     * @returns {number} Total loading percentage
     */
    function getTotalLoading(Loadings){
        return (Loadings || []).map(load => load.loading).reduce((a,b) => a + (Number(b) || 0), 0)
    }

    function validateDiscountPercentage(value) {
        const percentage = Number(value);
        if (Number.isFinite(percentage) && percentage <= -100) {
            throw new Error('El descuento total no puede ser mayor o igual al 100%.');
        }
    }

    function validateCoverageDiscount(coverage, proposedLoading, loadingId) {
        const currentLoading = (coverage.Loadings || [])
            .filter(function(item){
                return item.id != loadingId && !item.toRemove;
            })
            .reduce(function(total, item){
                return total + (Number(item.loading) || 0);
            }, 0);

        validateDiscountPercentage(
            currentLoading + (Number(proposedLoading) || 0)
        );
    }
    /**
     * @function renderNumber
     * @version 1.0.0
     * @author Noel Obando
     * @description Formats numeric values into a localized string with decimals.
     * 
     * @param {number} value
     * 
     * @returns {string}
     */
    function renderNumber(value, record){
        const amount = Number(value || 0);
        const safeAmount = Number.isFinite(amount) ? amount : 0;
        const text = safeAmount.toLocaleString('en-us',{ minimumFractionDigits: 2, maximumFractionDigits: 4 });
        const state = safeAmount > 0 ? 'lem-positive' : (safeAmount < 0 ? 'lem-negative' : 'lem-zero');
        return renderText(<span className={state}>{text}</span>, record)
    }
    /**
     * @function calcExtraPremium
     * @version 1.0.0
     * @author Noel Obando
     * @description Calculates the extra premium amount based on total loading percentage.
     * 
     * @param {Array<Object>} value - Loadings array
     * @param {Object} record - Coverage record
     * @param {number} record.basePremium - Base premium value
     * 
     * @returns {string} Formatted extra premium value
     */
    function calcExtraPremium(value, record){
        return renderNumber( getTotalLoading(value) * record.basePremium / 100 )
    }
    /**
     * @function calcPremium
     * @version 1.0.0
     * @author Noel Obando
     * @description Calculates the final premium including loadings.
     * 
     * @param {Array<Object>} value - Loadings array
     * @param {Object} record - Coverage record
     * @param {number} record.basePremium - Base premium value
     * 
     * @returns {string} Formatted premium value
     */
    function calcPremium(value, record){
        const totalLoading = getTotalLoading(value) / 100;
        return renderNumber( record.basePremium * (1 + totalLoading)  )
    }
    function renderAction(coverage, action){
        return <Button type='link' htmlType='button' onClick={ ()=> action(coverage) }>
            <PencilIcon /> Editar
        </Button>
    }
    function renderText(value, record){
        let remove = record && typeof record.toRemove === 'boolean';
        if(!remove) return value;
        return <Text delete>{ value }</Text>
    }
    function showSuccess(msg){
        notification.success({description: msg, placement: 'top', duration: 2 })
    }
    function showError(error){
        const validationMessage = error && Array.isArray(error.errorFields)
            ? error.errorFields
                .flatMap(function(field){
                    return Array.isArray(field.errors) ? field.errors : [];
                })
                .map(function(item){ return String(item || '').trim(); })
                .find(function(item){ return item; })
            : '';
        const responseData = error && error.outData && typeof error.outData === 'object'
            ? error.outData
            : error && error.response && error.response.data
                ? error.response.data
                : null;
        const msg = validationMessage || (error instanceof Error
            ? String(error.message || '').trim()
            : typeof error === 'string'
                ? error.trim()
                : error && typeof error === 'object'
                    ? String(error.msg || error.message || error.description || error.error
                        || (responseData && (responseData.msg || responseData.message || responseData.description)) || '').trim()
                    : '');

        notification.error({
            message: 'Error',
            description: msg || 'Ocurrió un error inesperado.',
            placement: 'top',
            duration: 2
        })
    }

}
