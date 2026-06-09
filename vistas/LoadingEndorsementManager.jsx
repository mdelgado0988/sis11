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
    const { Table, Button, Modal, Empty, Form, Select, Switch, Input, InputNumber, Row, Col, Space, message, notification, Checkbox, Typography, DatePicker } = A;
    const { Text } = Typography;
    const { Column } = Table;
    const { confirm } = Modal;
    const { useState, useEffect, useContext, createContext } = React;
    const AppContext = createContext({});
    const useAppContext = ()=> useContext(AppContext);
    let effectiveDate = new Date().toISOString().slice(0,10);
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
        const [ riskTypes, setRiskTypes ] = useState([]);
        const [ Coverages, setCover ] = useState([]);
        const [ coverages, setCoverages ] = useState([]);
        const [ loadingCov, setLoadingCov ] = useState(false);
        const [ isModalOpen, setIsModalOpen ] = useState(false);
        const [ selectedCov, setSelectCov ] = useState(null);
        const [ menuAction, setMenuAction ] = useState(0);
        const [ selected, setSelected ] = useState(null);
        const [ form ] = Form.useForm()
        const [endorsementReason, setEndorsementReason] = useState('');

        const closeModal=()=> {
            setIsModalOpen(false);
            setSelectCov(null);
        }
        const onModalSubmit=()=>{
            closeModal()
        }
        const openModal=( cov )=>{
            setSelectCov(cov);
            setIsModalOpen(true);
        }
        const showLoadingForm=( loading )=>{
            setSelected(loading);
            setMenuAction(1);
        }
        const hideLoadingForm=()=>{
            setMenuAction(0);
            setSelected(null)
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
                    loading,
                    fixedAmount,
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

                let loadingPercent = Number(loading || 0);

                if(byAmount){

                    const amount = Number(fixedAmount || 0);
                    const basePremium = Number(selectedCov.basePremium || 0);

                    if(basePremium <= 0){
                        throw 'La cobertura no tiene prima base.';
                    }

                    loadingPercent =
                        (amount / basePremium) * 100;
                }

                const newLoading = selected
                    ? {
                        ...selected,
                        loading: loadingPercent,
                        riskType,
                        RiskType,
                        byAmount: !!byAmount,
                        fixedAmount: Number(fixedAmount || 0),
                        toUpdate: true
                    }
                    : {
                        id: covloadingId,
                        lifeCoverageId: selectedCov.id,
                        riskType,
                        loading: loadingPercent,
                        byAmount: !!byAmount,
                        fixedAmount: Number(fixedAmount || 0),
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
        const removeLoading=()=>{
            let loadings = [...selectedCov.Loadings];
            const tempCoverages = JSON.parse(JSON.stringify( coverages ));
            if(selected.id > 0){
                const index = loadings.findIndex(item => item.id === selected.id);
                loadings[index].toRemove = true;                
            } else {
                loadings = selectedCov.Loadings.filter( load => load.id != selected.id );
            }
            const index = tempCoverages.findIndex( cov => cov.id === selectedCov.id );
            tempCoverages[index].Loadings = loadings;
            setCoverages(tempCoverages);
            const updatedCov = tempCoverages.find(cov => cov.id === selectedCov.id);
            setSelectCov(updatedCov);
            hideLoadingForm();
        }
        async function fetchData(){
            try {
                if(!policyId) return;
                setLoadingCov(true)
                const response = await exe('RepoLifePolicy',{ operation:'GET', filter:`id=${ policyId }`, include:['Coverages.Loadings.RiskType']})
                const [{ Coverages, active }] = response.outData;
                setCover(Coverages);
                setCoverages(Coverages.filter( cov => cov.basePremium > 0))
                setisActive(active);
                showSuccess('Poliza Cargada');
            } catch (error) {
                showError(error);
            } finally{
                setLoadingCov(false)
            }
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
                                defaultValue: moment(),
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
            debugger
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
        async function createEndorsement(reason, effectiveDate){
            try {
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

                const effectiveDateTime = `${effectiveDate}T12:00:00`;

                const jOldCoverges = JSON.stringify(Coverages),
                    jNewCoverages = JSON.stringify(newCoverages);
                const dto = {
                    jOldCoverges,
                    jNewCoverages,
                    policyId,
                    lifePolicyId: policyId,
                    effectiveDate: effectiveDate + ' 12:00:00',
                    note: reason
                }
                const validation = await exe('ChangeLoading', dto);
                if(!validation.ok) throw validation.msg;
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
                                debugger
                                const executeResult = await exe('ExeChangeLoading', {changeId: change.outData.id, exeNow: true });
                                if(!executeResult.ok) throw executeResult.msg;
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
                showError(error)
            }

        }
        useEffect(()=>{
            fetchData();
            exe('RepoRiskTypeCatalog',{ operation:'GET' })
            .then( response => setRiskTypes( response.outData.map(({ code, name}) => ({value: code, label: name.trim() }))  ))
        },[policyId]);

        const value = {
            policyId, coverages, loadingCov,
            isModalOpen, onModalSubmit, closeModal,
            selectedCov, openModal, form, riskTypes,
            onAddLoading, menuAction, selected,
            showLoadingForm, hideLoadingForm, removeLoading,
            fetchData, onSaveLoading, isPolicyActive
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
        const { coverages, loadingCov, onSaveLoading, isPolicyActive } = useAppContext();
        const hasChanges = (coverages || [] ).some( cov => cov.Loadings.some( load => isNaN(load.id) || load.toRemove || load.toUpdate  ));

        return <DefaultPage 
            title={t('Recargos y descuentos')} 
            icon='calculator'
            subTitle={t('Endoso')}
            extra={<Button icon={<SaveIcon />}onClick={onSaveLoading} disabled={!hasChanges} type='primary' htmlType='button' loading={loadingCov}>{ !isPolicyActive ? 'Actualizar Recargos': 'Crear Endoso' }</Button>}>
            <CoveragesTable />
            <ModalLoading />
        </DefaultPage>
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
        return <Table dataSource={ coverages || []} loading={loadingCov}>
            <Column title={t('Code')}           dataIndex='code' key='coverageCode' />
            <Column title={t('Name')}           dataIndex='name' key='name' render={ value => <b>{value}</b>}/>
            <Column title={t('Sum Assured')}    dataIndex='limit' key='sa' render={renderNumber}/>
            <Column title={t('Base Premium')}   dataIndex='basePremium' key='basePremium' render={renderNumber}/>
            <Column title={t('Loading')}        dataIndex='Loadings' key='loading' render={getTotalLoading}/>
            <Column title={t('Extra Premium')}  dataIndex='Loadings' key='extraPremium' render={calcExtraPremium} />
            <Column title={t('Premium')}        dataIndex='Loadings' key='premium' render={calcPremium} />
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
        const { isModalOpen, onModalSubmit, closeModal, menuAction } = useAppContext();
        return <Modal title={t('Coverage Detail')} width={650} open={ isModalOpen } onOk={ onModalSubmit } onCancel={ closeModal }>
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
        const { selectedCov, showLoadingForm, isPolicyActive } = useAppContext();
        if(!selectedCov)
            return <Empty />
        return <div>
            <Button type='link' htmlType='button' onClick={ ()=> showLoadingForm(null) }>
                <PlusIcon /> {t('New')}
            </Button>
        <Table dataSource={ selectedCov.Loadings || []} rowKey='id'>
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
            <Column title={t('Action')}     dataIndex='id' key='id' render={(_, record )=> <Button disabled={isPolicyActive} type='link' htmlType='button' onClick={()=>showLoadingForm(record)}><PencilIcon /></Button>} />
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
        const { form, riskTypes, onAddLoading, hideLoadingForm, selected, removeLoading } = useAppContext();
        useEffect(()=>{
            if(!selected){
                form.resetFields();
                return;
            }
            form.setFieldsValue( selected );
        },[ selected ])

        return <Form form={ form } layout='vertical' initialValues={{riskType:'COMMERCIAL'}}>
        <Row gutter={ 16 }>
            <Col span={24}>
                <Space>
                    <Button type='link' htmlType='button' onClick={hideLoadingForm}>
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

                <Col span={18}>
                    <Form.Item
                        noStyle
                        shouldUpdate={function(prev, curr){
                            return prev.byAmount !== curr.byAmount;
                        }}
                    >
                        {function({ getFieldValue }){

                            const byAmount = getFieldValue('byAmount');

                            return (
                                <Form.Item
                                    name={byAmount ? 'fixedAmount' : 'loading'}
                                    label={
                                        <strong>
                                            {byAmount ? 'Monto' : 'Porcentaje (%)'}
                                        </strong>
                                    }
                                    rules={[{
                                        required:true,
                                        message: byAmount
                                            ? 'Monto obligatorio'
                                            : 'Porcentaje obligatorio'
                                    }]}
                                >
                                    <InputNumber
                                        style={{ width:'100%' }}
                                    />
                                </Form.Item>
                            );
                        }}
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
        const text = !value ? '0.00' : Number(value).toLocaleString('en-us',{ minimumFractionDigits: 2, maximumFractionDigits: 4 });
        return renderText(text, record)
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
        notification.success({message:'Ok', description: msg, placement: 'top', duration: 2 })
    }
    function showError(error){
        const msg = error instanceof Error ? error.message : String(error);
        notification.error({message:'Ok', description: msg, placement: 'top', duration: 2 })
    }

}