/**
 * @author Noel Obando
 * @created 2025-12-23
 * @summary Search and filter Fire Insurance Policies
 * @name viewBusquedaAvanzadaIncendios
 * @version 1.0.0
 * @origin jira GLOB-199
 */

//#region Imports
const { useEffect, useState } = React;
const { Skeleton, Collapse, Drawer, Form, Button, Select, Input, InputNumber, notification, Table, Avatar, Tag, DatePicker } = A;
const { Panel } = Collapse;
const { TextArea } = Input;
//const Icons = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css';
const Safety =()=><span role='img' aria-label='safety' type='safety' class='anticon anticon-safety'><svg viewBox='0 0 1024 1024' focusable='false' data-icon='safety' width='1em' height='1em' fill='currentColor' aria-hidden='true'><path d='M512 64L128 192v384c0 212.1 171.9 384 384 384s384-171.9 384-384V192L512 64zm312 512c0 172.3-139.7 312-312 312S200 748.3 200 576V246l312-110 312 110v330z'></path><path d='M378.4 475.1a35.91 35.91 0 00-50.9 0 35.91 35.91 0 000 50.9l129.4 129.4 2.1 2.1a33.98 33.98 0 0048.1 0L730.6 434a33.98 33.98 0 000-48.1l-2.8-2.8a33.98 33.98 0 00-48.1 0L483 579.7 378.4 475.1z'></path></svg></span>

const ResetIcon = ()=><span role='img' aria-label='undo' class='anticon anticon-undo'><svg viewBox='64 64 896 896' focusable='false' data-icon='undo' width='1em' height='1em' fill='currentColor' aria-hidden='true'><path d='M511.4 124C290.5 124.3 112 303 112 523.9c0 128 60.2 242 153.8 315.2l-37.5 48c-4.1 5.3-.3 13 6.3 12.9l167-.8c5.2 0 9-4.9 7.7-9.9L369.8 727a8 8 0 00-14.1-3L315 776.1c-10.2-8-20-16.7-29.3-26a318.64 318.64 0 01-68.6-101.7C200.4 609 192 567.1 192 523.9s8.4-85.1 25.1-124.5c16.1-38.1 39.2-72.3 68.6-101.7 29.4-29.4 63.6-52.5 101.7-68.6C426.9 212.4 468.8 204 512 204s85.1 8.4 124.5 25.1c38.1 16.1 72.3 39.2 101.7 68.6 29.4 29.4 52.5 63.6 68.6 101.7 16.7 39.4 25.1 81.3 25.1 124.5s-8.4 85.1-25.1 124.5a318.64 318.64 0 01-68.6 101.7c-7.5 7.5-15.3 14.5-23.4 21.2a7.93 7.93 0 00-1.2 11.1l39.4 50.5c2.8 3.5 7.9 4.1 11.4 1.3C854.5 760.8 912 649.1 912 523.9c0-221.1-179.4-400.2-400.6-399.9z'></path></svg></span>
const FilterIcon= ()=><span role='img' aria-label='filter' class='anticon anticon-filter'><svg viewBox='64 64 896 896' focusable='false' data-icon='filter' width='1em' height='1em' fill='currentColor' aria-hidden='true'><path d='M880.1 154H143.9c-24.5 0-39.8 26.7-27.5 48L349 597.4V838c0 17.7 14.2 32 31.8 32h262.4c17.6 0 31.8-14.3 31.8-32V597.4L907.7 202c12.2-21.3-3.1-48-27.6-48zM603.4 798H420.6V642h182.9v156zm9.6-236.6l-9.5 16.6h-183l-9.5-16.6L212.7 226h598.6L613 561.4z'></path></svg></span>
const SearchIcon= ()=><span role='img' aria-label='search' class='anticon anticon-search'><svg viewBox='64 64 896 896' focusable='false' data-icon='search' width='1em' height='1em' fill='currentColor' aria-hidden='true'><path d='M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z'></path></svg></span>

const defaultPageSize = 10;
const { Column } = Table;
//#endregion
/**
 * @component FilterDrawer
 * @description
 * Drawer lateral que contiene los filtros avanzados para la búsqueda de
 * pólizas de Incendio. Gestiona catálogos dependientes (país → provincia →
 * distrito → corregimiento → barriada) y filtros técnicos y financieros.
 *
 * @props {Object} props
 * @props {FormInstance} props.form - Instancia de Ant Design Form compartida con el componente padre.
 * @props {boolean} props.isOpen - Controla la visibilidad del Drawer.
 * @props {Function} props.onClose - Callback para cerrar el Drawer.
 * @props {Function} props.onFilterClick - Ejecuta la búsqueda con los filtros actuales.
 *
 * @features
 * - Carga dinámica de catálogos jerárquicos.
 * - Reseteo automático de campos dependientes.
 * - Agrupación de filtros por secciones colapsables.
 * - Integración con catálogos maestros (Tipo de Objeto, Uso del Bien).
 *
 */
function FilterDrawer({ form, isOpen, onClose, onFilterClick }){
    const [ loadingCatalog, setLoadingCatalog ] = useState(false);
    const [ countries, setCountries ] = useState([]);
    const [ states, setStates ] = useState([]);
    const [ lobs, setLobs ] = useState([]);
    const [ cities, setCities ] = useState([]);
    const [ sectors, setSectors ] = useState([]);
    const [ neighborhoods, setNeighborhoods ] = useState([]);
    const [ buildings, setBuildings ] = useState([]);
    const [ zonas, setZonas ] = useState([]);
    const [ objectTypes, setObjectTypes ] = useState([]);
    const [ usages, setUsages ] = useState([]);

    async function fetchCountries(){
        try {
            setLoadingCatalog(true);
            const response = await exe('RepoCountryCatalog',{operation:'GET'});
            setCountries(response.outData.map( c => ({ label: c.name, value: c.code })));
        } catch (error) {
            showError(error);
        } finally {
            setLoadingCatalog(false);
        }
    }

    async function fetchLobs(){
        try {
            setLoadingCatalog(true);
            const response = await exe('RepoLob',{operation:'GET'});
            setLobs(response.outData.map( c => ({ label: c.name, value: c.code })));
        } catch (error) {
            showError(error);
        } finally {
            setLoadingCatalog(false);
        }
    }
  
    async function fetchStates(){
        try {
            const { pais } = form.getFieldsValue();
            form.resetFields(['provincia','distrito','corregimiento','barriada']);
            setStates([]);
            setCities([]);
            setSectors([]);
            setNeighborhoods([]);
            if(!pais) return;
            const response = await exe('RepoStateCatalog',{operation:'GET', filter:`countryCode='${ pais }'`});
            setStates(response.outData.map( s => ({ label: s.name, value: s.code })));
        } catch (error) {
            showError(error);
        } finally{
            setLoadingCatalog(false);
        }
    }
  
    async function fetchCities(){
        try {
            setLoadingCatalog(true);
            const { provincia } = form.getFieldsValue();
            form.resetFields(['distrito','corregimiento','barriada']);
            setCities([]);
            setSectors([]);
            setNeighborhoods([]);
            if(!provincia) return;
            const response = await exe('RepoCityCatalog',{operation:'GET', filter:`stateCode='${ provincia }'`});
            setCities(response.outData.map( c => ({ label: c.name, value: c.code })));
        } catch (error) {
            showError(error);
        } finally{
            setLoadingCatalog(false);
        }
    }
  
    async function fetchSectors(){
        try {
            const { distrito } = form.getFieldsValue();
            form.resetFields(['corregimiento','barriada']);
            setSectors([]);
            setNeighborhoods([]);
            if(!distrito) return;
            const response = await exe('RepoSectorCatalog',{operation:'GET', filter:`cityCode='${ distrito }'`});
            setSectors(response.outData.map( s => ({ label: s.name, value: s.code })));
        } catch (error) {
            showError(error);
        } finally{
            setLoadingCatalog(false);
        }
    }
  
    async function fetchNeighborhoods(){
        try {
            const { corregimiento } = form.getFieldsValue();
            setNeighborhoods([]);
            form.resetFields(['barriada']);
            if(!corregimiento) return;
            const response = await exe('GetTableRows',{ table:'Barriadas',column:'SectoreId',filterValue:corregimiento, getColumn1:'idStreet', getColumn2:'STREET'});
            setNeighborhoods(response.outData.map( row => ({ value: row.column1, label: row.column2 })));

            //Actualizo edificios al igual que barriada
            await fetchBuildings();
          
        } catch (error) {
            showError(error);
        } finally{
            setLoadingCatalog(false);
        }
    }

    async function fetchBuildings(){
        try {
          
            const { pais, provincia, distrito, corregimiento } = form.getFieldsValue();
            setBuildings([]);
            form.resetFields(['edificio']);
            if(!pais || !provincia || !distrito || !corregimiento ) return;

            const query = 
              `SELECT
                  JSON_VALUE(data.[value],'$[4]') codigo,
                  JSON_VALUE(data.[value],'$[5]') descripcion
              FROM [Table] t
              CROSS APPLY OPENJSON(t.data) data
              WHERE t.[name] = 'Edificios'
              AND JSON_VALUE(data.[value],'$[0]') = '${pais}'
              AND JSON_VALUE(data.[value],'$[1]') = '${provincia}'
              AND JSON_VALUE(data.[value],'$[2]') = '${distrito}'
              AND JSON_VALUE(data.[value],'$[3]') = '${corregimiento}'
              ORDER BY JSON_VALUE(data.[value],'$[5]')`;
            
            const response = await exe("DoQuery",{ sql: query });          
            const resultado = response.outData.map( row => ({ value: row.codigo, label: row.descripcion }));
          
            setBuildings(resultado);
          
        } catch (error) {
            showError(error);
        } finally{
            setLoadingCatalog(false);
        }
    }

    async function fetchZonas(){
        try {
            const response = await exe('GetFullTable',{ table:'ZonaCresta'});

            response.outData.splice(0,1);
            const zonas = response.outData.map( row => ({value: row[0], label: row[1]}));
            setZonas(zonas);
                                                    
        } catch (error) {
            showError(error);
        } finally{
            setLoadingCatalog(false);
        }
    }
  
    async function fetchObjectTypes(){
        exe('GetFullTable',{ table:'TablaTipoObjeto'})
        .then(response => {
            response.outData.splice(0,1);
            setObjectTypes( response.outData.map( row => ({value: row[0], label: row[1]})))
        })
    }
  
    async function fetchUsages(){
        exe('GetFullTable', { table:'TablaUsoBien'})
        .then( response => {
            response.outData.splice(0,1);
            setUsages( response.outData.map( row => ({value: row[0], label: row[1]})))
        })
    }
  
    function onResetFields(){
        form.resetFields();
    }
  
    useEffect(()=> {
        fetchCountries();
        fetchObjectTypes();
        fetchUsages();
        fetchLobs();
        fetchZonas();
    },[]);
    return <Drawer title={t('Filtros')} open={ isOpen } onClose={ onClose }>
        <Form form={form} layout='vertical'>
            <Collapse defaultActiveKey={['1']}>
                <Panel header={t('Información General')} key='1'>
                    <Form.Item label={t('Número de póliza')} name='code'>
                        <Input placeholder={t('Digite número de póliza')}/>
                    </Form.Item>
                    <Form.Item label={t('Número de certificado')} name='certificateNumber'>
                        <InputNumber placeholder={t('Digite número de póliza')}/>
                    </Form.Item>
                    <Form.Item label={t('Ramo')} name='lob'>
                        <Select options={lobs} style={{ width: '100%'}} showSearch allowClear optionFilterProp='label' onChange={fetchCities} loading={ loadingCatalog } placeholder={t('Seleccione un ramo')}/>
                    </Form.Item>
                    <Form.Item label={t('Vigencia inicial')} name='start' dependencies={['end']}
                      rules={[
                          ({ getFieldValue }) => ({
                          validator(_, value) {
                            const end = getFieldValue('end');
                    
                            if (!end) return Promise.resolve(); // si no hay fecha inicial, no obligar
                    
                            if (!value) return Promise.reject(new Error(t('Debe seleccionar la vigencia inicial')));
                    
                            if (value.isAfter(end, 'day'))
                              return Promise.reject(new Error(t('La vigencia inicial no puede ser mayor a la final')));
                    
                            return Promise.resolve();
                          }
                        })
                      ]}>
                      <DatePicker style={{ width: '100%' }} placeholder={t('Seleccione la fecha inicial de vigencia')} format="DD/MM/YYYY" />
                    </Form.Item>
                    <Form.Item label={t('Vigencia final')} name='end' dependencies={['start']}
                      rules={[
                          ({ getFieldValue }) => ({
                          validator(_, value) {
                            const start = getFieldValue('start');
                    
                            if (!start) return Promise.resolve(); // si no hay fecha inicial, no obligar
                    
                            if (!value) return Promise.reject(new Error(t('Debe seleccionar la vigencia final')));
                    
                            if (value.isBefore(start, 'day'))
                              return Promise.reject(new Error(t('La vigencia final no puede ser menor a la inicial')));
                    
                            return Promise.resolve();
                          }
                        })
                      ]}>
                        <DatePicker style={{ width: '100%' }} placeholder={t('Seleccione la fecha final de vigencia')} format="DD/MM/YYYY" />
                    </Form.Item>
                  <Form.Item label={t('Estado')} name="isActive" rules={[{ required: false, message: t('Seleccione el estado de la póliza') }]} >
                    <Select placeholder={t('Seleccione el estado')} options={[ { label: t('Vigente'), value: "1" }, { label: t('No Vigente'), value: "0" } ]} />
                  </Form.Item>
                </Panel>
                <Panel header={t('Datos del asegurado')} key='2'>
                  <Form.Item label={t('Nombre / Razón Social')} name="fullName" rules={[{ required: false, message: t('Ingrese el nombre o razón social') }]}>
                    <Input placeholder={t('Ingrese el nombre o razón social')} />
                  </Form.Item>                  
                  <Form.Item label={t('ID (Cédula / RUC)')} name="documentId" rules={[{ required: false, message: t('Ingrese la cédula o RUC') }]}>
                    <Input placeholder={t('Ingrese la cédula o RUC')} />
                  </Form.Item>                  
                  <Form.Item label={t('N° de Cliente')} name="clientNumber" rules={[{ required: false, message: t('Ingrese el número de cliente') }, { type: 'number', min: 0 }]}>
                    <InputNumber style={{ width: '100%' }} placeholder={t('Ingrese el número de cliente')} min={0} precision={0} />
                  </Form.Item>
                </Panel>
                <Panel header={t('Ubicación del riesgo')} key='3'>
                    <Form.Item label={t('País')} name='pais'>
                        <Select options={countries} style={{ width: '100%'}} showSearch allowClear optionFilterProp='label' onChange={fetchStates} loading={ loadingCatalog } placeholder={t('Seleccione un país')}/>
                    </Form.Item>
                    <Form.Item label={t('Provincia')} name='provincia'>
                        <Select options={states} style={{ width: '100%'}} showSearch allowClear optionFilterProp='label' onChange={fetchCities} loading={ loadingCatalog } placeholder={t('Seleccione una provincia')}/>
                    </Form.Item>
                    <Form.Item label={t('Distrito')} name='distrito'>
                        <Select options={cities} style={{ width: '100%'}} showSearch allowClear optionFilterProp='label' onChange={fetchSectors} loading={ loadingCatalog } placeholder={t('Seleccione un distrito')}/>
                    </Form.Item>
                    <Form.Item label={t('Corregimiento')} name='corregimiento'>
                        <Select options={sectors} style={{ width: '100%'}} showSearch allowClear optionFilterProp='label' onChange={fetchNeighborhoods} loading={ loadingCatalog } placeholder={t('Seleccione un corregimiento')}/>
                    </Form.Item>
                    <Form.Item label={t('Barriada')} name='barriada'>
                        <Select options={neighborhoods} style={{ width: '100%'}} showSearch allowClear optionFilterProp='label' loading={ loadingCatalog } placeholder={t('Seleccione una barriada')}/>
                    </Form.Item>
                    <Form.Item label={t('Edificio')} name='edificio'>
                        <Select options={buildings} style={{ width: '100%'}} showSearch allowClear optionFilterProp='label' loading={ loadingCatalog } placeholder={t('Seleccione un edificio')}/>
                    </Form.Item>
                    <Form.Item label={t('Calle')} name="calle" rules={[{ required: false, message: t('Digite una calle para búsqueda') }]}>
                      <Input placeholder={t('Digite una calle para búsqueda')} />
                    </Form.Item>
                    <Form.Item label={t('Zona Cresta')} name='zonaCresta'>
                        <Select options={zonas} style={{ width: '100%'}} showSearch allowClear optionFilterProp='label' loading={ loadingCatalog } placeholder={t('Seleccione una zona cresta')}/>
                    </Form.Item>
                    <Form.Item label={t('Apartamento')} name="apartamento" rules={[{ required: false, message: t('Digite un apartamento para búsqueda') }]}>
                      <Input placeholder={t('Digite un apartamento para búsqueda')} />
                    </Form.Item>
                    <Form.Item label={t('Manzana')} name="manzana" rules={[{ required: false, message: t('Digite una manzana para búsqueda') }]}>
                      <Input placeholder={t('Digite una manzana para búsqueda')} />
                    </Form.Item>
                    <Form.Item label={t('Dirección Exacta')} name="direccionExacta" rules={[{ required: false, message: t('Digite una dirección exacta para búsqueda') }]}>
                      <Input placeholder={t('Digite una dirección para búsqueda')} />
                    </Form.Item>
                </Panel>
                <Panel header={t('Datos del objeto asegurado')} key='4'>
                    <Form.Item label={t('Tipo de Objeto')} name='tipoObjeto'>
                        <Select options={objectTypes} style={{ width: '100%'}} showSearch allowClear optionFilterProp='label' placeholder={t('Seleccione un tipo de objeto')} />
                    </Form.Item>
                    <Form.Item label={t('Uso del Bien')} name='usoObjeto'>
                        <Select options={usages} style={{ width: '100%'}} showSearch allowClear optionFilterProp='label' placeholder={t('Seleccione un uso')}/>
                    </Form.Item>
                    <Form.Item label={t('Finca')} name='finca'>
                        <Input placeholder={t('Digite número de finca')}/>
                    </Form.Item>
                    <Form.Item label={t('Rollo')} name='rollo'>
                        <Input placeholder={t('Digite número de rollo')}/>
                    </Form.Item>
                    <Form.Item label={t('No. Documento')} name='noDoc'>
                        <Input placeholder={t('Digite número de documento')}/>
                    </Form.Item>
                    <Form.Item label={t('Número de Garantía')} name='noGarantia'>
                        <Input placeholder={t('Digite número de garantía')}/>
                    </Form.Item>
                    <Form.Item label={t('Número de Préstamo')} name='noPrestamo'>
                        <Input placeholder={t('Digite número de préstamo')}/>
                    </Form.Item>
                </Panel>
            </Collapse>
            <div style={{ display:'flex',flexDirection:'row', gap: 10, padding: 8 }}>
                <Button type='primary' htmlType='button' onClick={ onFilterClick }><FilterIcon/>Filtrar</Button>
                <Button type='default' htmlType='button' onClick={ onResetFields }><ResetIcon/>Limpiar</Button>
            </div>
        </Form>
    </Drawer>
}
/**
 * @component PoliciesTable
 * @description
 * Tabla de resultados que muestra las pólizas de Incendio obtenidas desde
 * el backend, con paginación y renderizadores personalizados.
 *
 * @props {Object} props
 * @props {Array<Object>} props.policies - Lista de pólizas a renderizar.
 * @props {boolean} props.loading - Indica si la tabla está en estado de carga.
 * @props {Object} props.pagination - Configuración de paginación Ant Design.
 *
 * @features
 * - Ícono visual de póliza.
 * - Enlaces directos a póliza y contactos.
 * - Renderizado de estados con colores.
 * - Manejo de direcciones incompletas.
 *
 * @ui
 * - Ant Design Table + Column
 */
function PoliciesTable({ policies, loading, pagination }){
    return <Table dataSource={ policies || [] } rowKey='id' loading={ loading } pagination={ pagination }>
        <Column title={''} dataIndex='id' key='icon' render={ ()=> <Avatar size='small' icon={<Safety/>} /> } width={10} />
        <Column title={t('Id')} dataIndex='id' key='id' width={10} render={ id => renderLink(id, `lifePolicy/${ id }`)} />
        <Column title={t('Code')} dataIndex='code' key='code' />
        <Column title={t('Policy Type')} dataIndex='policyType' key='policyType' />
        <Column title={t('State')} dataIndex='entityState' key='entityState' render={renderEntityState}/>
        <Column title={t('Product')} dataIndex='productName' key='productName' />
        <Column title={t('Holder')} dataIndex='holderName' key='holderName' render={ (name, {holderId}) => renderLink(name, `contact/${ holderId }`)} />
        <Column title={t('Insured')} dataIndex='mainInsured' key='mainInsured' render={ (name, {contactId}) => renderLink(name, `contact/${ contactId }`)} />
        <Column title={t('Issued')} dataIndex='activeDate' key='activeDate' render={ renderFullDate } />
        <Column title={t('Start')} dataIndex='start' key='start' render={renderDate}/>
        <Column title={t('End')} dataIndex='end' key='end' render={renderDate}/>
        <Column title={t('Dirección')} dataIndex='id' key='address' render={ (_, record) => record.barrio || record.edificio || 'Sin Dirección'} />
    </Table>
}
/**
 * @component Main
 * @description
 * Componente principal de la vista de búsqueda avanzada de pólizas
 * de Incendio. Orquesta filtros, resultados, paginación y carga de recursos
 * externos (iconos y moment.js).
 *
 * @responsibilities
 * - Inicialización del formulario de filtros.
 * - Ejecución de la cadena backend `cmdGetFirePolicies`.
 * - Manejo de estados de carga globales.
 * - Integración entre FilterDrawer y PoliciesTable.
 *
 * @state
 * @property {boolean} openFilter - Visibilidad del Drawer de filtros.
 * @property {boolean} loading - Estado de carga de datos.
 * @property {Array} policies - Datos de pólizas.
 * @property {Object} pagination - Estado de paginación.
 *
 * @sideEffects
 * - Carga dinámica de Bootstrap Icons.
 * - Carga de moment.js con locales.
 * - Ejecución inicial de búsqueda sin filtros.
 */

function Main(){
    const [ form ] = Form.useForm();
    const [ loadingIcons, setLoadingIcons ] = useState(false);
    const [ openFilter, setOpenFilter ]     = useState(false);
    const [ loading, setLoading ]           = useState(false);
    const [ policies, setPolicies ]         = useState([]);
    const [ pagination, setPagination ] = React.useState({ defaultPageSize });
    const onPageChange=( page, pageSize )=> fetchData({ page, size: pageSize });
    
    const closeFilter = () => setOpenFilter(false);
    async function fetchData(params){
        try {
            setLoading(true);
            const { page, size } = params || { page: 1, size : defaultPageSize };
            const values = form.getFieldsValue();

            if(values.start && !values.end){                          
              showWarning("Ha marcado una fecha inicial, debe seleccionar la fecha final");
              form.validateFields(['end']);
              return;
            }

            if(!values.start && values.end){                          
              showWarning("Ha marcado una fecha final, debe seleccionar la fecha inicial");
              form.validateFields(['start']);
              return;
            }

            let filterContext = {...values, 
                                 start: values.start ? values.start.format('YYYY-MM-DD') : null,
                                 end: values.end ? values.end.format('YYYY-MM-DD') : null,
                                 page: page || 1, 
                                 size: size || defaultPageSize };
          
            const response = await exe('ExeChain',{ chain: 'cmdGetFirePolicies', context: JSON.stringify(filterContext)});
            const { outData:{ data, total }} = response;
            setPagination({ defaultCurrent: page, defaultPageSize: size, total, onChange: onPageChange });
            setPolicies(data);
            setOpenFilter(false);
        } catch (error) {
            showError(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(()=>{
        // setLoadingIcons(true);
        // const icons = document.getElementById('customIcons'),
        //       hasMoment = typeof moment != 'undefined';
        // if( icons && icons != null && hasMoment ){
        //     setLoadingIcons(false);
        //     return;
        // }
        // const link = document.createElement('link');
        // link.rel = 'stylesheet';
        // link.href = Icons;
        // link.id = 'customIcons';
        // document.head.append(link);
        //$.get('https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment-with-locales.min.js')
    },[]);

    useEffect(()=>fetchData(),[]);

    if( loadingIcons ) return <Skeleton active />
    return <DefaultPage 
            title={t('Policy Search')}
            subTitle={t('Incendio')}
            icon='file-search'
            extra={[<Button type='primary' onClick={ ()=> setOpenFilter(true) }><FilterIcon/> {t('Filter')}</Button>]}>
        <PoliciesTable 
            policies={ policies } 
            loading={ loading } 
            pagination={ pagination } />
        <FilterDrawer 
            form={ form }
            isOpen={ openFilter }
            onClose={ closeFilter }
            onFilterClick={ fetchData } />
    </DefaultPage>
}


render(<Main />)


/**
 * @function showError
 * @description
 * Muestra una notificación de error estandarizada usando Ant Design.
 *
 * @param {Error|Object} error - Objeto de error retornado por el backend o runtime.
 */
function showError(error){
    const msg = error.message ? error.message : t('Ha ocurrido un error inesperado');
    notification.error({ message: t('Error'), description: msg });
}

/**
 * @function showWarning
 * @description
 * Muestra una notificación de tipo advertencia usando Ant Design
 *
 * @param msg - Texto de la advertencia
 */
function showWarning(msg){
    notification.warn({ message: t('Advertencia'), description: msg });
}

/**
 * @function renderEntityState
 * @description
 * Renderiza el estado de una póliza usando un Tag con color semántico.
 *
 * @param {string} state - Estado de la entidad (DRAFT, ACTIVE, etc.).
 * @returns {JSX.Element}
 */
function renderEntityState(state){
    const colorMap = {
        DRAFT: 'blue',
        ACTIVE: 'green',
        SUSPENDED: 'orange',
        CANCELLED: 'red',
        CLOSED: 'gray'
    }
    return <Tag color={ colorMap[state] || 'default' }>{ t(state) }</Tag>
}
/**
 * @function renderFullDate
 * @description
 * Formatea una fecha completa con hora en formato legible.
 *
 * @param {string|Date} date - Fecha de emisión.
 * @returns {string}
 */
function renderFullDate(date){
    if(!date) return 'Sin Emitir';
    // return moment(date)
    //     .locale('es')
    //     .format('D [de] MMMM [de] YYYY, h:mm:ss a');
    return new Date(date).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}
/**
 * @function renderDate
 * @description
 * Formatea una fecha simple (YYYY-MM-DD).
 *
 * @param {string|Date} date
 * @returns {string}
 */
function renderDate(date){
    if(!date) return '-';
    //return moment(date).format('YYYY-MM-DD')
    return new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}
/**
 * @function renderLink
 * @description
 * Genera un enlace absoluto al host actual para navegación cruzada
 * (pólizas, contactos).
 *
 * @param {string} text - Texto visible del enlace.
 * @param {string} url - Ruta relativa interna.
 * @returns {JSX.Element}
 */
function renderLink(text, url ){
    const host = window.location.host;
    return <a href={`https://${ host }/#/${ url }`} target='_blank' rel='noreferrer'>{text}</a>
}