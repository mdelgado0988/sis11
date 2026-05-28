
() => {
  
    // Desestructuración de componentes de A
    const { Table, Tag, Drawer: Panel, Form, Row, Col, Input, Select, Button, Space, notification, Radio } = A;
    const { Column } = Table;
    const { Option } = Select;
  // --- Iconos extraídos para limpiar el componente principal ---
    const ResetIcon = ()=><span role='img' aria-label='undo' class='anticon anticon-undo'><svg viewBox='64 64 896 896' focusable='false' data-icon='undo' width='1em' height='1em' fill='currentColor' aria-hidden='true'><path d='M511.4 124C290.5 124.3 112 303 112 523.9c0 128 60.2 242 153.8 315.2l-37.5 48c-4.1 5.3-.3 13 6.3 12.9l167-.8c5.2 0 9-4.9 7.7-9.9L369.8 727a8 8 0 00-14.1-3L315 776.1c-10.2-8-20-16.7-29.3-26a318.64 318.64 0 01-68.6-101.7C200.4 609 192 567.1 192 523.9s8.4-85.1 25.1-124.5c16.1-38.1 39.2-72.3 68.6-101.7 29.4-29.4 63.6-52.5 101.7-68.6C426.9 212.4 468.8 204 512 204s85.1 8.4 124.5 25.1c38.1 16.1 72.3 39.2 101.7 68.6 29.4 29.4 52.5 63.6 68.6 101.7 16.7 39.4 25.1 81.3 25.1 124.5s-8.4 85.1-25.1 124.5a318.64 318.64 0 01-68.6 101.7c-7.5 7.5-15.3 14.5-23.4 21.2a7.93 7.93 0 00-1.2 11.1l39.4 50.5c2.8 3.5 7.9 4.1 11.4 1.3C854.5 760.8 912 649.1 912 523.9c0-221.1-179.4-400.2-400.6-399.9z'></path></svg></span>
    const FilterIcon= ()=><span role='img' aria-label='filter' class='anticon anticon-filter'><svg viewBox='64 64 896 896' focusable='false' data-icon='filter' width='1em' height='1em' fill='currentColor' aria-hidden='true'><path d='M880.1 154H143.9c-24.5 0-39.8 26.7-27.5 48L349 597.4V838c0 17.7 14.2 32 31.8 32h262.4c17.6 0 31.8-14.3 31.8-32V597.4L907.7 202c12.2-21.3-3.1-48-27.6-48zM603.4 798H420.6V642h182.9v156zm9.6-236.6l-9.5 16.6h-183l-9.5-16.6L212.7 226h598.6L613 561.4z'></path></svg></span>
    const SearchIcon= ()=><span role='img' aria-label='search' class='anticon anticon-search'><svg viewBox='64 64 896 896' focusable='false' data-icon='search' width='1em' height='1em' fill='currentColor' aria-hidden='true'><path d='M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z'></path></svg></span>


    // --- ESTADOS ---
    const [data, setData] = useState([]);
    const [searchTotal, setSearchTotal] = useState(0);
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    // Listas (Catálogos)
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [municipioList, setMunicipioList] = useState([]); // Renombrado para diferenciar de valores
    const [sectorList, setSectorList] = useState([]);       // Renombrado para diferenciar de valores

    // Valores del Formulario
    const [countryValue, setCountryValue] = useState();
    const [stateValue, setStateValue] = useState();
    const [municipioValue, setMunicipioValue] = useState();
    const [sectorValue, setSectorValue] = useState();
    const [buildingName, setBuildingName] = useState();
    const [radioValue, setRadioValue] = useState(1);

    // --- EFECTOS ---
    useEffect(() => {
        const params = {
            pagination: pagination,
            loading: true,
            total: 0,
            data: data,
        };
        //load(params);
        loadCatalogs();
    }, []);

    useEffect(() => {
        // Limpieza automática: Si cambia país, limpia estado. Si cambia estado, limpia municipio.
        if (!countryValue) { setStateValue(undefined); setStates([]); }
        if (!stateValue) { setMunicipioValue(undefined); setMunicipioList([]); }
        if (!municipioValue) { setSectorValue(undefined); setSectorList([]); }
    }, [countryValue, stateValue, municipioValue]);


    // --- FUNCIONES DE CARGA ---
    const loadCatalogs = () => {
        exe("RepoCountryCatalog", { operation: "GET" })
            .then(({ outData: result }) => {
                const list = result.map(item => ({ label: item.name, value: item.code }));
                setCountries(list);
            });
    };

    function Link(props){
    	const path = props.path;
      	const id = props.id;
      	const text = props.text;
      	const href=path+id;
      	return <a href={href}>{text}</a>;
    }

    const load = (params = {}) => {
        setLoading(params.loading);

        // Construcción limpia de parámetros
        const form = params.formulario || {};
        let extraParametros = "";
        
        if (form.country) extraParametros += `, country:'${form.country}'`;
        if (form.provincia) extraParametros += `, provincia:'${form.provincia}'`;
        if (form.municipio) extraParametros += `, municipio:'${form.municipio}'`;
        if (form.sector) extraParametros += `, sector:'${form.sector}'`;
        if (form.buildingType === 1) extraParametros += `, edificio:'${form.buildingType}'`;
        if (form.buildingType === 2) extraParametros += `, barriada:'${form.buildingType}'`;
        if (form.buildingName) extraParametros += `, buildingName:'${form.buildingName}'`;

        const contextString = `{row:{currentPage:${params.pagination.current}, pageSize:${params.pagination.pageSize}${extraParametros}}}`;

        exe("ExeChain", { 
            chain: 'cmdAdvanceSearchPolicyFire', 
            context: contextString 
        }).then(r => {
            if (r.ok) {
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
                            listaPoliza.push({ id: ("Loading data... " + index) });
                        }
                    }
                }
                setData(listaPoliza);
                setLoading(false);
                setPagination({ ...params.pagination, total: r.total });
            } else {
                setLoading(false);
                notification.error({ message: 'Error', description: r.msg, duration: 10 });
            }
        });
    };

    // --- HANDLERS (Manejadores de eventos) ---

    // Función auxiliar para obtener datos actuales del form
    const getFormData = () => ({
        country: countryValue,
        provincia: stateValue,
        municipio: municipioValue,
        sector: sectorValue,
        buildingType: radioValue,
        buildingName: buildingName,
    });

    const handleTableChange = (newPagination) => {
        const params = {
            pagination: newPagination,
            loading: true,
            data: data,
            formulario: getFormData(),
        };
        load(params);
    };

    const searchPolicies = () => {
        const newPagination = { ...pagination, current: 1 };
        setPagination(newPagination);
        const params = {
            pagination: newPagination,
            loading: true,
            total: 0,
            data: data,
            formulario: getFormData(),
        };
        load(params);
    };

    const onReset = () => {
        setCountryValue(undefined);
        setStateValue(undefined);
        setMunicipioValue(undefined);
        setSectorValue(undefined);
        setBuildingName('');
        setRadioValue(1);
    };

    // --- Lógica de Combos en Cascada ---

    const handleCountryChange = (value) => {
        setCountryValue(value);
        setStateValue(undefined); // Reset hijo
        if (value) {
            exe("RepoStateCatalog", { operation: "GET", filter: `countryCode='${value}'` })
                .then(({ outData: result }) => {
                    setStates(result.map(item => ({ label: item.name, value: item.code })));
                });
        } else {
            setStates([]);
        }
    };

    const handleStateChange = (value) => {
        setStateValue(value);
        setMunicipioValue(undefined); // Reset hijo
        if (value) {
            exe("RepoCityCatalog", { operation: "GET", filter: `stateCode='${value}'` })
                .then(({ outData: result }) => {
                    // CORRECCIÓN IMPORTANTE: Actualizamos la LISTA, no el valor seleccionado
                    setMunicipioList(result.map(item => ({ label: item.name, value: item.code })));
                });
        } else {
            setMunicipioList([]);
        }
    };

    const handleMunicipioChange = (value) => {
        setMunicipioValue(value);
        setSectorValue(undefined); // Reset hijo
        if (value) {
            exe("RepoSectorCatalog", { operation: "GET", filter: `cityCode='${value}'` })
                .then(({ outData: result }) => {
                    // CORRECCIÓN IMPORTANTE: Actualizamos la LISTA
                    setSectorList(result.map(item => ({ label: item.name, value: item.code })));
                });
        } else {
            setSectorList([]);
        }
    };

    // --- Helpers de Renderizado ---
    const TagBox = ({ stateName }) => {
        let color = "blue";
        if (stateName === "ACTIVE") color = "green";
        if (stateName === "INACTIVE") color = "red";
        return <Tag color={color}>{stateName}</Tag>;
    };

    const DateFormat = ({ fecha, formato = "yyyy-mm-dd", textoDefault = "" }) => {
        const fechaHoy = new Date();
        const d = fecha ? new Date(fecha) : fechaHoy;
        
        // Validación básica
        if (textoDefault && !fecha) return textoDefault;

        const map = {
            dd: String(d.getDate()).padStart(2, '0'),
            mm: String(d.getMonth() + 1).padStart(2, '0'),
            yyyy: d.getFullYear().toString()
        };
        return formato.replace(/dd|mm|yyyy/gi, matched => map[matched]);
    };

    function renderDate(value){
        if(!value) return ' - ';
        return new Date(value).toLocaleString();
    }

    function renderNumber(value){
      if(isNaN(value)) return `${Number(0).toLocaleString()}`;
      
        return `${Number(value).toLocaleString()}`;
    }

    const LinkCustom = ({ path, id, text }) => <a href={`${path}${id}`}>{text}</a>;

    function details(record, index){
            return <Table dataSource={ record.polizas } pagination={ false } rowKey='id'>
                <Column title='PolizaId' dataIndex='id' key='id' />
                <Column title='Poliza' dataIndex='codigoPoliza' key='codigoPoliza' />
                <Column title='Fecha Inicio' dataIndex='fInicio' key='fInicio' render={renderDate} />
                <Column title='Fecha Fin' dataIndex='fFin' key='fFin' render={renderDate} /> 
                <Column title='Suma Asegurada' dataIndex='insuredSum' key='insuredSum' render={(value)=> renderNumber(value)} />              
                <Column title='Plan' dataIndex='producto' key='producto'/>
                <Column title='Asegurado' dataIndex='asegurado' key='asegurado' />
                <Column title="Action" key="action" render={(text, record) => (<><Link path="/#/lifePolicy/" id={record.id} text="Open" /></>)} />  
            </Table>
    }

    // --- RENDER ---
    return <DefaultPage
            title="Policy Search Fire"
            icon="file-search"
            extra={<Button type="primary" onClick={() => setVisible(true)}><FilterIcon /> Filter</Button>}
        >




            <Table dataSource={data} loading={loading} onChange={handleTableChange} expandable={{ expandedRowRender: details }} rowKey='buildingCode'>
                <Table.Column title="Codigo Edificio" dataIndex="buildingCode" />
                <Table.Column title="Nombre Edificio" dataIndex="buildingName" />
                <Table.Column title="Cantidad Poliza" dataIndex="cantidad" render={(value)=> renderNumber(value)}/>
                <Table.Column title="Sumatoria Valor" dataIndex="sumatoria" render={(value)=> renderNumber(value)}/>
                <Table.Column title="Promedio por Poliza" dataIndex="promedio" render={(value)=> renderNumber(value)} />
            </Table>

            <Panel title="Policy Filter Search" width={520} placement="right" onClose={() => setVisible(false)} visible={visible}>
                <Form id="formFilter" name="advanced_search" layout="vertical" initialValue={{buildingType:1}}>
                    <Row gutter={16}>
                        <Col span={24} className="gutter-row">
                            <Button size="small" onClick={onReset} style={{ marginBottom: 10 }}><ResetIcon /> Reset</Button>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12} className="gutter-row">
                            <Form.Item label="País" name="country" style={{ width: '100%' }}>
                                <Select
                                    value={countryValue}
                                    placeholder="Select an option..."
                                    onChange={handleCountryChange}
                                    optionFilterProp='label'
                                    showSearch
                                    allowClear
                                    options={countries}
                                  />
                            </Form.Item>
                        </Col>
                        <Col span={12} className="gutter-row">
                            <Form.Item label="Provincia" name="provincia" style={{ width: '100%' }}>
                                <Select
                                    showSearch
                                    optionFilterProp='label'
                                    value={stateValue}
                                    onChange={handleStateChange}
                                    placeholder="Select an option..."
                                    allowClear
                                    disabled={!countryValue}
                                    options={states}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12} className="gutter-row">
                            <Form.Item label="Distrito" name="municipio" style={{ width: '100%' }}>
                                <Select
                                    value={municipioValue}
                                    placeholder="Select an option..."
                                    onChange={handleMunicipioChange}
                                    allowClear
                                    disabled={!stateValue}
                                    showSearch
                                    optionFilterProp='label'                                    
                                    options={municipioList}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12} className="gutter-row">
                            <Form.Item label="Corregimiento" name="sector" style={{ width: '100%' }}>
                                <Select
                                    value={sectorValue}
                                    placeholder="Select an option..."
                                    onChange={setSectorValue}
                                    allowClear
                                    disabled={!municipioValue}
                                    showSearch
                                    optionFilterProp='label'                                    
                                    options={sectorList}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12} className="gutter-row">
                            <Form.Item label="Nombre Edificio" name="buildingName" style={{ width: '100%' }}>
                                <Input
                                    value={buildingName}
                                    onChange={(e) => setBuildingName(e.target.value)}
                                    allowClear />
                            </Form.Item>
                        </Col>
                        <Col span={12} className="gutter-row">
                            <Form.Item label="Tipo de Propiedad" name="buildingType" style={{ width: '100%' }}>
                                <Radio.Group onChange={(e) => setRadioValue(e.target.value)} value={radioValue} defaultValue={1}>
                                    <Radio value={1}>Edificio</Radio>
                                    <Radio value={2}>Barriada</Radio>
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Space direction='vertical' style={{ display: 'flex' }}>
                        <Button type="primary" onClick={searchPolicies} block><SearchIcon /> Search</Button>
                        <div style={{ textAlign: 'center' }}><Tag>{searchTotal}</Tag> Results</div>
                    </Space>
                </Form>
            </Panel>
        </DefaultPage>
}