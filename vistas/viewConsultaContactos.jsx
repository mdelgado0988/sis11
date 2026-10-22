/**
 * @author Jampier Solera
 * @created 2026-02-09
 * @summary Centralized search and filter for Contacts
 * @name viewConsultaContactos
 * @version 1.0.0
 */

//#region Imports
const Icons = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css';
const { useEffect, useState } = React;
const { Drawer, Form, Button, Input, notification, Table, DatePicker, Radio, Space, Select, Switch, Tooltip } = A;
const defaultPageSize = 15;
const { Column } = Table;
//#endregion

function FilterDrawer({ form, isOpen, onClose, onFilterClick }) {
  function onResetFields() {
    form.resetFields();
  }
  const partialSearchRule = { min: 2, message: t('Ingrese al menos 2 caracteres para buscar') };
  const MultiSelect = ({ value, entity, propEntity, onChange }) => {
      const [ loading, setLoading ] = useState(false);
      const [ items, setItems ] = useState([]);        

      const loadSelectionItems = () => {
          //code, name | RoleCatalog
          const sqlQuery = `SELECT ${propEntity} FROM ${entity}`;
          const propLabel = propEntity.split(",")[1];
          const propValue = propEntity.split(",")[0];
          setLoading(true);
          exe('DoQuery', { sql: sqlQuery })
          .then(response => {
            setItems((response.outData || []).map(item => ({ label: item[propLabel], value: item[propValue] })));
            setLoading(false);
          })
          .catch(error => {
            setItems([]);
            setLoading(false);
            notification.error({ message: t('Error'), description: t('No fue posible cargar los roles') });
          });
      };

      React.useEffect(() => { loadSelectionItems(); }, []);
    
      const onSelectChange = newValue => {
          if (typeof onChange === 'function') onChange(newValue);
      };
    
      return <Select              
            mode="multiple" 
            allowClear 
            loading={ loading }
            defaultActiveFirstOption={ false }
            value={value || []} 
            style={{ width: '100%' }} 
            placeholder={t('Seleccione roles')}
            options = {items}
            onChange={onSelectChange}
          />
  };
  return (
    <Drawer className='contact-filter-drawer' title={t('Contact Filter Search')} open={isOpen} width='512px' onClose={onClose}>
      <Form form={form} layout='vertical' onFinish={() => onFilterClick()} style={{ 
                                            position: "relative",
                                            top: "-15px"
                                          }}>
        <Space >
          <Button type='default' htmlType='button' size='small' onClick={onResetFields}>
            <IconWithTitle iconName='arrow-counterclockwise' title='Reset' />
          </Button>
        </Space>
        <br />
        <div className='contact-filter-row'>
          <Form.Item className='contact-filter-half contact-filter-person-type' label={t('Tipo de Persona')} name='isPerson'>
            <Radio.Group onChange={e => {form.setFieldsValue({ isPerson: e.target.value });}}>
              <Radio.Button value="1">{t('Persona')}</Radio.Button>
              <Radio.Button value="0">{t('Empresa')}</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item className='contact-filter-half contact-filter-gender' label={t('Sexo')} name='gender'>
            <Radio.Group onChange={e => {form.setFieldsValue({ gender: e.target.value });}}>
              <Radio.Button value="F">{t('Femenino')}</Radio.Button>
              <Radio.Button value="M">{t('Masculino')}</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </div>
        <div className='contact-filter-row'>
          <Form.Item className='contact-filter-half' label={t('Id')} name='id'>
            <Input allowClear />
          </Form.Item>
          <Form.Item className='contact-filter-half' label={t('Número COBIS')} name='nationalId'>
            <Input allowClear />
          </Form.Item>  
        </div>
        <div className='contact-filter-row'>
          <Form.Item className='contact-filter-half' label={t('Nombres')} name='name' rules={[partialSearchRule]}>
            <Input allowClear />
          </Form.Item>
          <Form.Item className='contact-filter-half' label={t('Apellidos')} name='surname1' rules={[partialSearchRule]}>
            <Input allowClear />
          </Form.Item>
        </div>
        <Form.Item label={t('Nombre Empresa')} name='companyName' rules={[partialSearchRule]}>
          <Input allowClear />
        </Form.Item>
        <Form.Item label={t('Passport')} name='passport'>
          <Input allowClear />
        </Form.Item>
        <div className='contact-filter-row'>
          <Form.Item className='contact-filter-half' label={t('Número de documento')} name='cnp'>
            <Input allowClear />
          </Form.Item>
          <Form.Item className='contact-filter-half' label={t('Documento jurídico')} name='nif'>
            <Input allowClear />
          </Form.Item>
        </div>
        <div className='contact-filter-row'>
          <Form.Item className='contact-filter-half' label={t('Estado')} name='status'>
            <Select allowClear onChange={ newValue => form.setFieldsValue({ status: newValue }) }>
                <Option key="" value="" >{t("All")}</Option>
                <Option key="1" value="1" >{t("Active")}</Option>
                <Option key="0" value="0" >{t("Inactive")}</Option>
            </Select>
          </Form.Item>
          <Form.Item className='contact-filter-half' label={t('Fecha de nacimiento')} name='birth'>
            <DatePicker allowClear style={{ width: '100%' }} format='DD/MM/YYYY' />
          </Form.Item>
        </div>
        <div className='contact-filter-row'>
          <Form.Item className='contact-filter-half' label={t('Role')} name='roles'>
            <MultiSelect entity='RoleCatalog' propEntity='code,name' />
          </Form.Item>
          <Form.Item className='contact-filter-half' label={t('Mode')} name='roleOr' valuePropName='checked'>
            <Switch checkedChildren="Or" unCheckedChildren="And" />
          </Form.Item>
        </div>
        <div style={{ display: 'flex', gap: 10, padding: 8 }}>
          <Button type='primary' htmlType='submit'>
            <IconWithTitle iconName='search' title='Search' />
          </Button>
        </div>
      </Form>
    </Drawer>
  );
}

function ResultsTable({ data, loading, pagination }) {
  return (
    <div className='contact-results-grid'>
    <Table dataSource={data || []} rowKey='id' loading={loading} pagination={pagination} size='small' scroll={{ x: 1280 }}>
      <Column title={t('COBIS')} dataIndex='cobisCode' key='cobisCode' width={95} align='center' />
      <Column title={t('SIS')} dataIndex='sisCode' key='sisCode' width={80} align='center' render={(value, record) => renderSisLink(value || record.id, record.id)} />
      <Column title={t('Estado')} dataIndex='status' key='status' width={100} align='center' render={state => renderStateTag(state)} />
      <Column title={t('Tipo Persona')} dataIndex='type' key='type' width={120} align='center' render={type => renderPersonTypeTag(type)} />
      <Column title={t('Cédula / R.U.C')} dataIndex='documentId' key='documentId' width={150} render={value => renderCopyable(value)} />
      <Column title={t('Nombre del Ente Registrado')} dataIndex='fullName' key='fullName' width={270} ellipsis render={value => renderCopyable(value)} />
      <Column title={t('PEP')} dataIndex='pep' key='pep'
        width={70} align='center' render={value => <span className={(value === 'Yes' || value === true) ? 'contact-text-red' : 'contact-text-default'}>{(value === 'Yes' || value === true) ? t('Sí') : t('No')}</span>} />
      <Column title={t('Dirección')} dataIndex='address' key='address' width={230} ellipsis render={(value, record) => renderAddress(value, record)} />
      <Column title={t('Teléfono')} dataIndex='phone' key='phone' width={125} align='center' render={value => renderCopyable(value)} />
      <Column title={t('Fecha de Registro')} dataIndex='registrationDate' key='registrationDate' width={150} align='center' render={date => renderDate(date)} />
    </Table>
    </div>
  );
}

function Main() {
  const [form] = Form.useForm();
  const [openFilter, setOpenFilter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: defaultPageSize, total: 0 });

  const onPageChange = (page, pageSize) => fetchData({ page, size: pageSize });

  useEffect(() => {
    if (document.getElementById('customIcons')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = Icons;
    link.id = 'customIcons';
    document.head.append(link);
  }, []);


  async function fetchData(params) {
    try {
      setLoading(true);
      const request = params || {};
      const page = Number(request.page) || 1;
      const size = Number(request.size) || defaultPageSize;
      const values = form.getFieldsValue();
      const context = {
        ...values,
        birth: values.birth ? values.birth.format('YYYY-MM-DD') : null,
        page,
        size
      };

      const response = await exe('ExeChain', { chain: 'cmdGetContacts', context: JSON.stringify(context) });
      if (!response.ok) throw new Error(response.msg || t('No fue posible consultar los contactos'));
      const result = response.outData || {};
      const rows = result.data || [];
      const total = Number(result.total) || 0;

      setPagination({ current: page, pageSize: size, total, onChange: onPageChange });
      setData(rows);
      setOpenFilter(false);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  return (
    <DefaultPage
      title={t('Consulta de Contactos')}
      subTitle={t('Búsqueda Centralizada')}
      icon='file-search'
      extra={[
        <Button type='primary' onClick={() => setOpenFilter(true)}>
          <IconWithTitle iconName='search' title='Filter' />
        </Button>
      ]}
    >
      <div className='contact-search-page'>
        <ContactSearchStyles />
        <ResultsTable data={data} loading={loading} pagination={pagination} />
        <FilterDrawer form={form} isOpen={openFilter} onClose={() => setOpenFilter(false)} onFilterClick={fetchData} />
      </div>
    </DefaultPage>
  );
}

render(<Main />);

function IconWithTitle({ iconName, title }) {
  return (
    <span style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
      <i className={`bi bi-${iconName}`} />
      {t(title)}
    </span>
  );
}

function showError(error) {
  const msg = error.message ? error.message : t('Ha ocurrido un error inesperado');
  notification.error({ message: t('Error'), description: msg });
}

function showWarning(msg) {
  notification.warn({ message: t('Advertencia'), description: msg });
}

function renderStateTag(state) {
  const colorMap = { ACTIVO: 'contact-text-green', INACTIVO: 'contact-text-red', PROSPECTO: 'contact-text-orange' };
  const normalizedState = String(state || '').trim().toUpperCase();
  return <span className={colorMap[normalizedState] || 'contact-text-default'}>{t(state)}</span>;
}

function renderPersonTypeTag(type) {
  const normalizedType = String(type || '').trim().toUpperCase();
  const color = normalizedType.indexOf('NATURAL') >= 0 ? 'contact-text-green'
    : normalizedType.indexOf('JUR') >= 0 ? 'contact-text-blue'
    : 'contact-text-default';
  return <span className={color}>{t(type)}</span>;
}

function renderDate(date) {
  if (!date) return '-';
  if (typeof moment === 'undefined') return String(date);
  const value = moment(date);
  if (!value.isValid()) return '-';
  return value.format(String(date).indexOf('T') >= 0 ? 'DD/MM/YYYY HH:mm' : 'DD/MM/YYYY');
}

function renderAddress(value, record) {
  return value || record.address1 || record.addressLine || record.addressLine1 || '-';
}

function renderCopyable(value) {
  const text = value === undefined || value === null || value === '' ? '-' : String(value);
  const canCopy = text !== '-';
  return <span className='contact-copyable-value'>
    <span className='contact-copyable-text'>{text}</span>
    <Tooltip title={t('Copiar')}>
      <Button
        type='text'
        size='small'
        className='contact-copy-button'
        icon={<CopyOutlinedIcon />}
        disabled={!canCopy}
        onClick={() => copyToClipboard(text)}
      />
    </Tooltip>
  </span>;
}

function copyToClipboard(text) {
  const showCopied = () => notification.success({ message: t('Copiado al portapapeles') });
  const showCopyError = () => notification.error({ message: t('No fue posible copiar al portapapeles') });
  const fallbackCopy = () => {
    const input = document.createElement('textarea');
    input.value = text;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(input);
    if (copied) showCopied(); else showCopyError();
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(showCopied).catch(fallbackCopy);
    return;
  }
  fallbackCopy();
}

function renderLink(text, url) {
  const host = window.location.host;
  return <a href={`https://${host}/#/${url}`} target='_blank' rel='noreferrer'>{text}</a>;
}

function renderSisLink(value, id) {
  const host = window.location.host;
  return <a className='contact-sis-link' href={`https://${host}/#/contact/${id}`} target='_blank' rel='noreferrer'>
    <span className='contact-sis-icon'><UserOutlinedIcon /></span>
    <span>{value}</span>
  </a>;
}

function UserOutlinedIcon() {
  return <span role='img' aria-label={t('Contact')} className='anticon anticon-user'>
    <svg viewBox='64 64 896 896' focusable='false' data-icon='user' width='1em' height='1em' fill='currentColor' aria-hidden='true'>
      <path d='M858.5 763.6a374 374 0 0 0-80.6-119.5 375.63 375.63 0 0 0-119.5-80.6c-.4-.2-.8-.3-1.2-.5C719.5 518 760 444.7 760 362c0-137-111-248-248-248S264 225 264 362c0 82.7 40.5 156 102.8 201.1-.4.2-.8.3-1.2.5-44.8 18.9-85 46-119.5 80.6a375.63 375.63 0 0 0-80.6 119.5A371.7 371.7 0 0 0 136 901.8a8 8 0 0 0 8 8.2h60c4.4 0 7.9-3.5 8-7.8 2-77.2 33-149.5 87.8-204.3 56.7-56.7 132-87.9 212.2-87.9s155.5 31.2 212.2 87.9C779 752.7 810 825 812 902.2c.1 4.4 3.6 7.8 8 7.8h60a8 8 0 0 0 8-8.2c-1-47.8-10.9-94.3-29.5-138.2zM512 534c-45.9 0-89.1-17.9-121.6-50.4S340 407.9 340 362c0-45.9 17.9-89.1 50.4-121.6S466.1 190 512 190s89.1 17.9 121.6 50.4S684 316.1 684 362c0 45.9-17.9 89.1-50.4 121.6S557.9 534 512 534z' />
    </svg>
  </span>;
}

function CopyOutlinedIcon() {
  return <span role='img' aria-label={t('Copy')} className='anticon anticon-copy'>
    <svg viewBox='64 64 896 896' focusable='false' data-icon='copy' width='1em' height='1em' fill='currentColor' aria-hidden='true'>
      <path d='M832 64H320c-17.7 0-32 14.3-32 32v160h64V128h448v448h-128v64h160c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zM672 352H192c-17.7 0-32 14.3-32 32v480c0 17.7 14.3 32 32 32h480c17.7 0 32-14.3 32-32V384c0-17.7-14.3-32-32-32zm-32 480H224V416h416v416z' />
    </svg>
  </span>;
}

function ContactSearchStyles() {
  return <style>{`
    .contact-results-grid {
      border: 1px solid #8da9c2;
      box-shadow: 0 1px 2px rgba(31, 71, 110, 0.12);
      overflow: hidden;
    }
    .contact-results-grid .ant-table {
      font-size: 12px;
      line-height: 18px;
    }
    .contact-results-grid .ant-table-thead > tr > th {
      background: #bfbfbf;
      border-bottom: 1px solid #cbd1d8;
      border-right: 1px solid #cbd1d8;
      color: #1f1f1f;
      font-size: 12px;
      font-weight: 600;
      line-height: 18px;
      padding: 5px 8px;
    }
    .contact-results-grid .ant-table-thead > tr > th:last-child {
      border-right: 0;
    }
    .contact-results-grid .ant-table-tbody > tr > td {
      border-bottom: 1px solid #cbd1d8;
      border-right: 0;
      line-height: 18px;
      padding: 5px 8px;
    }
    .contact-results-grid .ant-table-tbody > tr:hover > td {
      background: #b7d7ff !important;
    }
    .contact-results-grid .ant-table-pagination {
      margin: 8px;
    }
    .contact-sis-link {
      align-items: center;
      display: inline-flex;
      gap: 4px;
    }
    .contact-sis-icon {
      align-items: center;
      color: #1677ff;
      display: inline-flex;
      font-size: 14px;
      height: 16px;
      justify-content: center;
      width: 16px;
    }
    .contact-copyable-value {
      align-items: center;
      display: inline-flex;
      gap: 2px;
      max-width: 100%;
    }
    .contact-copyable-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .contact-copy-button.ant-btn {
      color: #1677ff;
      flex: 0 0 auto;
      height: 22px;
      min-width: 22px;
      padding: 0 3px;
    }
    .contact-text-green { color: #237804; }
    .contact-text-red { color: #cf1322; }
    .contact-text-blue { color: #1677ff; }
    .contact-text-orange { color: #d46b08; }
    .contact-text-default { color: #262626; }
    body:has(.contact-search-page) .ant-page-header,
    body:has(.contact-search-page) .page-header {
      background: #e6f4ff !important;
      border: 1px solid #91caff !important;
      border-radius: 6px !important;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 1px 3px rgba(31, 71, 110, 0.14);
    }
    body:has(.contact-search-page) .ant-page-header-heading {
      border-bottom: 1px solid #b6d5f2;
      padding-bottom: 8px;
    }
    .contact-filter-drawer .contact-filter-row {
      display: flex;
      gap: 12px;
    }
    .contact-filter-drawer .contact-filter-half {
      flex: 1 1 0;
      min-width: 0;
    }
    .contact-filter-drawer .contact-filter-person-type .ant-radio-group {
      display: flex;
    }
    .contact-filter-drawer .contact-filter-person-type .ant-radio-button-wrapper {
      border-color: #8da9c2;
      flex: 1 1 auto;
      text-align: center;
    }
    .contact-filter-drawer .contact-filter-person-type .ant-radio-button-wrapper:not(:first-child)::before {
      background-color: #8da9c2;
    }
    .contact-filter-drawer .contact-filter-person-type .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled) {
      border-color: #1677ff;
      box-shadow: -1px 0 0 0 #1677ff;
    }
    .contact-filter-drawer .contact-filter-gender .ant-radio-group {
      display: flex;
    }
    .contact-filter-drawer .contact-filter-gender .ant-radio-button-wrapper {
      border-color: #8da9c2;
      flex: 1 1 auto;
      text-align: center;
    }
    .contact-filter-drawer .contact-filter-gender .ant-radio-button-wrapper:not(:first-child)::before {
      background-color: #8da9c2;
    }
    .contact-filter-drawer .contact-filter-gender .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled) {
      border-color: #1677ff;
      box-shadow: -1px 0 0 0 #1677ff;
    }
    .contact-filter-drawer .ant-input,
    .contact-filter-drawer .ant-input-affix-wrapper,
    .contact-filter-drawer .ant-select-selector,
    .contact-filter-drawer .ant-picker {
      border-color: #b8c4d1 !important;
    }
    .contact-filter-drawer .ant-input:hover,
    .contact-filter-drawer .ant-input-affix-wrapper:hover,
    .contact-filter-drawer .ant-select:hover .ant-select-selector,
    .contact-filter-drawer .ant-picker:hover {
      border-color: #8da9c2 !important;
    }
    .contact-filter-drawer .ant-input-affix-wrapper-focused,
    .contact-filter-drawer .ant-select-focused .ant-select-selector,
    .contact-filter-drawer .ant-picker-focused {
      border-color: #1677ff !important;
      box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2) !important;
    }
    .contact-filter-drawer .ant-input-affix-wrapper .ant-input {
      border: 0 !important;
      box-shadow: none !important;
    }
  `}</style>;
}
