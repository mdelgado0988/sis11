<%@ Page Title="" Language="VB" MasterPageFile="~/contabilidad01.master" AutoEventWireup="false"
    CodeFile="Fconcaja2.aspx.vb" Inherits="Fconcaja2" %>

<%@ Register Src="~/Controles/caja/fconcaja_ini.ascx" TagName="wucInic" TagPrefix="uc1" %>
<%@ Register Src="~/Controles/caja/wucRESASI.ascx" TagName="wucResasi" TagPrefix="uc2" %>
<%@ Register Src="~/Controles/caja/fconcaja_tot.ascx" TagName="wucFconcaja_tot" TagPrefix="uc3" %>
<%@ Register Src="~/Controles/caja/fconcaja_totpri.ascx" TagName="wucFconcaja_totpri"
    TagPrefix="uc4" %>
<%@ Register Src="~/Controles/caja/fconcaja_totban.ascx" TagName="wucFconcaja_totban"
    TagPrefix="uc5" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<%@ Register Assembly="Coolite.Ext.Web" Namespace="Coolite.Ext.Web" TagPrefix="ext" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ErrorOnPage" runat="Server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="Server">
    <script type="text/javascript" language="javascript">
        var submitValue = function (grid, hiddenformat, format) {
            hiddenformat.setValue(format);
            grid.submitData(false);
        }

        // Genera la impresion del comprobante de recibo
        function GetPrinter(gvrec) {

            if (gvrec.length > 0) {
                rec = Ext.encode(gvrec);
                ctl00_ContentPlaceHolder1_tabDetalle.body.mask("Cargando Documento a Impresión", "x-mask-loading");
                var xresult = Coolite.AjaxMethods.ImprimeROC(rec,
                    {
                        success:
                            function (result) {
                                if (result == true) {
                                    var url1 = "ImprimePDF.aspx?doc=generico"; ctl00_ContentPlaceHolder1_tabDetalle.body.unmask();
                                    CreaWindow(url1, 'Detalle de Arqueo de Caja', 610, 750, 'icon-printer', true, true, true, false, true);
                                } else {
                                    ctl00_ContentPlaceHolder1_tabDetalle.body.unmask();
                                    Ext.Msg.show({ title: 'Info', msg: 'No se puede procesar la impresion del documento.', buttons: Ext.Msg.CANCEL, icon: Ext.MessageBox.WARNING });
                                }
                            }
                    });

            } else {
                Ext.Msg.show({ title: 'Sis.Net', msg: 'Debe de Seleccionar un registro para su impresion', buttons: Ext.Msg.CANCEL, icon: Ext.MessageBox.WARNING });
                return false;
            }
        };

    </script>
    <ext:ViewPort runat="server" ID="wpcaj2">
        <Body>
            <ext:BorderLayout ID="BorderLayout1" runat="server">
                <Center>
                    <ext:Panel runat="server" Title="Supervisor" Icon="Money" Border="false">
                        <Body>
                            <ext:FitLayout ID="FitLayout1" runat="server">
                                <ext:Panel runat="server" Border="false" Header="false" Height="800px">
                                    <Body>
                                        <ext:FitLayout runat="server">
                                            <ext:Panel runat="server" Border="false" Header="false" Height="800px">
                                                <Body>
                                                    <ext:BorderLayout runat="server">
                                                        <Center>
                                                            <ext:TabPanel ID="tabContainer" runat="server" ActiveTabIndex="0" Height="800px"
                                                                DeferredRender="false" Border="false">
                                                                <Tabs>
                                                                    <ext:Tab runat="server" ID="tabCajas" Title="Cajas" Icon="Box" Border="false">
                                                                        <TopBar>
                                                                            <ext:Toolbar ID="menuCajas" runat="server">
                                                                                <Items>
                                                                                    <ext:ToolbarSeparator ID="ToolbarSeparator2" runat="server" />
                                                                                    <ext:Button runat="server" ID="btInicializa" Icon="Add" Text="Inicializa">
                                                                                        <AjaxEvents>
                                                                                            <Click OnEvent="inicializar" />
                                                                                        </AjaxEvents>
                                                                                    </ext:Button>
                                                                                    <ext:ToolbarSeparator ID="ToolbarSeparator3" runat="server" />
                                                                                    <ext:Button ID="btReportes" runat="server" Icon="Page" Text="Reportes">
                                                                                        <Menu>
                                                                                            <ext:Menu ID="menu" runat="server" MinWidth="460">
                                                                                                <Items>
                                                                                                    <ext:MenuItem runat="server" ID="ibtResumen" Icon="PageWhiteAcrobat" Text="Arqueo resumido">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="ibtResumen_Click" />
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                    <ext:MenuItem runat="server" ID="ibDetalle" Icon="PageWhiteAcrobat" Text="Arqueo detallado">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="ibDetalle_Click" />
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                    <ext:MenuItem ID="btResMay" runat="server" Icon="PageWhiteAcrobat" Text="Resumen de mayorización Caja por Cuenta (Caja Seleccionada)">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="resmay1" />
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                    <ext:MenuItem ID="btResMay2" runat="server" Icon="PageWhiteAcrobat" Text="Resumen de mayorización Caja por Cuenta detallada (Caja Seleccionada)">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="resmay2" />
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                    <ext:MenuItem ID="btResMay3" runat="server" Icon="PageWhiteAcrobat" Text="Resumen de mayorización Caja por Cuenta (Cajas del Día)">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="resmay3" />
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                    <ext:MenuItem ID="btResMay4" runat="server" Icon="PageWhiteAcrobat" Text="Resumen de mayorización Caja por Cuenta detallada (Cajas del Día)">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="resmay4" />
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                    <ext:MenuItem ID="btMinBan" runat="server" Icon="PageWhiteAcrobat" Text="Resumén para deposito en Banco (Caja Seleccionada)">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="MinutaBan" />
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                    <ext:MenuItem ID="btMinBanCaja" runat="server" Icon="PageWhiteAcrobat" Text="Resumén deposito en Banco (Cajas del Día)">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="MinutaBanCaja" />
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                    <ext:MenuItem ID="btROC1" runat="server" Icon="PageWhiteAcrobat" Text="Detalle de Recibos (Caja Seleccionada)">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="ROC1" />
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                    <ext:MenuItem ID="btROC2" runat="server" Icon="PageWhiteAcrobat" Text="Detalle de recibos Consolidado">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="ROC2" />
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                    <%--      <ext:MenuItem ID="btLoteRocs" runat="server" Icon="PageWhiteAcrobat" Text="Lote automÃ¡tico de ROCS">
                                                                                            <AjaxEvents>
                                                                                                <Click OnEvent="ImpriROCS" />
                                                                                            </AjaxEvents>
                                                                                        </ext:MenuItem>
                                                                                        <ext:MenuItem ID="btLoteRocsAnul" runat="server" Icon="PageWhiteAcrobat" Text="Lote automÃ¡tico de ROCS anulados">
                                                                                            <AjaxEvents>
                                                                                                <Click OnEvent="ImpriROCSanulado" />
                                                                                            </AjaxEvents>
                                                                                        </ext:MenuItem>--%>
                                                                                                </Items>
                                                                                            </ext:Menu>
                                                                                        </Menu>
                                                                                    </ext:Button>
                                                                                    <ext:ToolbarSeparator ID="ToolbarSeparator4" runat="server" />
                                                                                    <ext:Button ID="MenuItem1" runat="server" Icon="CalendarViewMonth" Text="ReAbrir"
                                                                                        OnClientClick="return confirm('¿Esta seguro de que desea ReAbrir esta Caja?');"
                                                                                        Enabled="false">
                                                                                        <AjaxEvents>
                                                                                            <Click OnEvent="abrircaja">
                                                                                                <EventMask ShowMask="true" Msg="Procesando Datos" />
                                                                                            </Click>
                                                                                        </AjaxEvents>
                                                                                    </ext:Button>
                                                                                    <ext:ToolbarSeparator ID="ToolbarSeparator5" runat="server" />
                                                                                    <ext:Button ID="MenuItem3" runat="server" Icon="CalendarViewMonth" Text="ReMayorizar Caja"
                                                                                        OnClientClick="return confirm('¿Esta seguro de que desea Mayorizar esta Caja?');"
                                                                                        Enabled="false">
                                                                                        <AjaxEvents>
                                                                                            <Click OnEvent="remayoriza">
                                                                                                <EventMask ShowMask="true" Msg="Procesando Datos" />
                                                                                            </Click>
                                                                                        </AjaxEvents>
                                                                                    </ext:Button>
                                                                                    <ext:ToolbarSeparator ID="ToolbarSeparatoriuy2" runat="server" />
                                                                                    <ext:Button ID="btExcel" runat="server" Icon="PageWhiteExcel" Text="Exportar a Excel"
                                                                                        OnClick="btExcel_Click" AutoPostBack="true">
                                                                                    </ext:Button>
                                                                                    <ext:ToolbarSeparator ID="ToolbarSeparator6" runat="server" />
                                                                                    <%--     <ext:ToolbarButton ID="btContaCaja" runat="server" Icon="Bell" Text="Contabilización Caja">
                                                                            <AjaxEvents>
                                                                                <Click OnEvent="contaCaja" />
                                                                            </AjaxEvents>
                                                                        </ext:ToolbarButton>
                                                                        <ext:ToolbarButton ID="btContadia" runat="server" Icon="BellSilver" Text="Contabilización Día">
                                                                            <AjaxEvents>
                                                                                <Click OnEvent="contaDia" />
                                                                            </AjaxEvents>
                                                                        </ext:ToolbarButton>--%>
                                                                                    <%-- <ext:ToolbarButton ID="MenuItem2" runat="server" Icon="CalendarViewDay" Text="Contabilizar Caja">
                                                                        <AjaxEvents>
                                                                            <Click OnEvent="contacaja">
                                                                                <EventMask ShowMask="true" />
                                                                            </Click>
                                                                        </AjaxEvents>
                                                                    </ext:ToolbarButton>--%>
                                                                                </Items>
                                                                            </ext:Toolbar>
                                                                        </TopBar>
                                                                        <Body>
                                                                            <ext:BorderLayout runat="server">
                                                                                <Center>
                                                                                    <ext:Panel runat="server" Border="false" Header="false">
                                                                                        <Body>
                                                                                            <ext:FormLayout runat="server">
                                                                                                <ext:Anchor Horizontal="100%" Vertical="100%">
                                                                                                    <ext:Panel runat="server" Border="false" Header="false">
                                                                                                        <Body>
                                                                                                            <ext:Hidden ID="FormatType" runat="server" />
                                                                                                            <ext:Store ID="Store_GdvCajas" runat="server" GroupField="Fecha" AutoLoad="true"
                                                                                                                OnRefreshData="Store_GdvCajas_Refresh">
                                                                                                                <Reader>
                                                                                                                    <ext:JsonReader>
                                                                                                                        <Fields>
                                                                                                                            <ext:RecordField Name="Suc" />
                                                                                                                            <ext:RecordField Name="Sucursal" />
                                                                                                                            <ext:RecordField Name="Cajero" />
                                                                                                                            <ext:RecordField Name="xcliente" />
                                                                                                                            <ext:RecordField Name="Fecha" />
                                                                                                                            <ext:RecordField Name="Caja" />
                                                                                                                            <ext:RecordField Name="itipocaja" />
                                                                                                                            <ext:RecordField Name="Contab" />
                                                                                                                            <ext:RecordField Name="Saldo" />
                                                                                                                            <ext:RecordField Name="Primas" />
                                                                                                                            <ext:RecordField Name="mpdeposito" />
                                                                                                                            <ext:RecordField Name="Varios" />
                                                                                                                            <ext:RecordField Name="mbanco" />
                                                                                                                            <ext:RecordField Name="Status" />
                                                                                                                            <ext:RecordField Name="Cierre" />
                                                                                                                            <ext:RecordField Name="Mayorizada" />
                                                                                                                        </Fields>
                                                                                                                    </ext:JsonReader>
                                                                                                                </Reader>
                                                                                                                <BaseParams>
                                                                                                                    <ext:Parameter Name="start" Mode="Raw" Value="0" />
                                                                                                                    <ext:Parameter Name="limit" Mode="Raw" Value="30" />
                                                                                                                </BaseParams>
                                                                                                                <Proxy>
                                                                                                                    <ext:DataSourceProxy />
                                                                                                                </Proxy>
                                                                                                            </ext:Store>
                                                                                                            <sortinfo direction="DESC" field="Fecha" />
                                                                                                            <ext:FitLayout runat="server">
                                                                                                                <ext:GridPanel ID="GdvCajas" runat="server" StoreID="Store_GdvCajas" AutoShow="True"
                                                                                                                    Border="false" AutoWidth="true" Height="650" Title="Listado de Cajas" Shadow="Frame"
                                                                                                                    TrackMouseOver="true" FireSelectOnLoad="false" AutoScroll="true">
                                                                                                                    <LoadMask Msg="Cargando..." ShowMask="true" />
                                                                                                                    <ColumnModel runat="server">
                                                                                                                        <Columns>
                                                                                                                            <ext:RowNumbererColumn />
                                                                                                                            <ext:Column ColumnID="Suc" Header="Sucursal" DataIndex="Suc" Hidden="true" />
                                                                                                                            <ext:Column ColumnID="Cajero" Header="Cajero" Sortable="true" DataIndex="Cajero"
                                                                                                                                Hidden="true" />
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="Sucursal" Header="Sucursal" Sortable="true"
                                                                                                                                DataIndex="Sucursal" Width="150">
                                                                                                                                <SummaryRenderer Handler="return ((value === 0 || value > 1) ? '(' + value +' Total)' : 'TOTAL GRUPO');" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                            <ext:Column ColumnID="xcliente" Header="Cajero" Sortable="true" DataIndex="xcliente"
                                                                                                                                Width="300" />
                                                                                                                            <ext:Column ColumnID="itipocaja" Header="Tipo Caja" Sortable="true" DataIndex="itipocaja"
                                                                                                                                Width="150" />
                                                                                                                            <ext:Column ColumnID="Fecha" Header="Fecha de Caja" Sortable="false" DataIndex="Fecha">
                                                                                                                                <Renderer Fn="Ext.util.Format.dateRenderer('d/m/Y')" />
                                                                                                                            </ext:Column>
                                                                                                                            <ext:Column ColumnID="Caja" Header="Caja" Sortable="true" DataIndex="Caja" Align="Center" />
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="Contab" Header="Contab" Sortable="true" DataIndex="Contab"
                                                                                                                                Align="Right" SummaryType="Sum">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="Saldo" Header="Saldo" Sortable="true" DataIndex="Saldo"
                                                                                                                                Align="Right" SummaryType="Sum">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="Primas" Header="Primas" Sortable="true" DataIndex="Primas"
                                                                                                                                Align="Right" SummaryType="Sum">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="mpdeposito" Header="Primas en Deposito" Sortable="true"
                                                                                                                                DataIndex="mpdeposito" Align="Right" SummaryType="Sum">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="Varios" Header="Varios" Sortable="true" DataIndex="Varios"
                                                                                                                                Align="Right" SummaryType="Sum">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="mbanco" Header="Depósitos en Banco" Sortable="true"
                                                                                                                                DataIndex="mbanco" Align="Right" SummaryType="Sum">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                            <ext:Column ColumnID="Status" Header="Estado" Sortable="true" DataIndex="Status" />
                                                                                                                            <ext:Column ColumnID="Cierre" Header="Cierre" Sortable="true" DataIndex="Cierre" />
                                                                                                                            <ext:Column ColumnID="Mayorizada" Header="Mayorizada" Sortable="true" DataIndex="Mayorizada" />
                                                                                                                        </Columns>
                                                                                                                    </ColumnModel>
                                                                                                                    <SelectionModel>
                                                                                                                        <ext:RowSelectionModel ID="RowSelectionModel1" runat="server" SingleSelect="true">
                                                                                                                            <AjaxEvents>
                                                                                                                                <RowSelect OnEvent="Click_GdvCajas" Buffer="250">
                                                                                                                                    <ExtraParams>
                                                                                                                                        <ext:Parameter Name="GdvCajas_param" Mode="Raw" Value="Ext.encode(#{GdvCajas}.getRowsValues())" />
                                                                                                                                    </ExtraParams>
                                                                                                                                    <EventMask Msg="Procesando Información" ShowMask="true" />
                                                                                                                                </RowSelect>
                                                                                                                            </AjaxEvents>
                                                                                                                        </ext:RowSelectionModel>
                                                                                                                    </SelectionModel>
                                                                                                                    <BottomBar>
                                                                                                                        <ext:PagingToolBar ID="PagingToolBar1" runat="server" PageSize="30" StoreID="Store_GdvCajas"
                                                                                                                            BeforePageText="Atras" AfterPageText="Siguiente" DisplayMsg="Mostrando {0} - {1} de {2}"
                                                                                                                            EmptyMsg="No hay Registros">
                                                                                                                        </ext:PagingToolBar>
                                                                                                                    </BottomBar>
                                                                                                                    <Plugins>
                                                                                                                        <ext:GroupingSummary runat="server">
                                                                                                                        </ext:GroupingSummary>
                                                                                                                        <ext:GridFilters runat="server" FiltersText="Filtros">
                                                                                                                            <Filters>
                                                                                                                                <ext:NumericFilter DataIndex="Suc" />
                                                                                                                                <ext:NumericFilter DataIndex="Cajero" />
                                                                                                                                <ext:NumericFilter DataIndex="Caja" />
                                                                                                                                <ext:StringFilter DataIndex="xcliente" />
                                                                                                                            </Filters>
                                                                                                                        </ext:GridFilters>
                                                                                                                    </Plugins>
                                                                                                                    <View>
                                                                                                                        <ext:GroupingView runat="server" ForceFit="true" HideGroupedColumn="true" GroupByText="Agrupar por Este Campo"
                                                                                                                            SortAscText="fcaja">
                                                                                                                        </ext:GroupingView>
                                                                                                                    </View>
                                                                                                                </ext:GridPanel>
                                                                                                            </ext:FitLayout>
                                                                                                        </Body>
                                                                                                    </ext:Panel>
                                                                                                </ext:Anchor>
                                                                                            </ext:FormLayout>
                                                                                        </Body>
                                                                                    </ext:Panel>
                                                                                </Center>
                                                                                <West MinWidth="280" MaxWidth="305" Collapsible="true" Split="true">
                                                                                    <ext:Panel ID="pnFiltros" runat="server" Title="Búsqueda De Cajas" Width="305" Border="false">
                                                                                        <Body>
                                                                                            <ext:FormLayout runat="server">
                                                                                                <ext:Anchor Horizontal="100%">
                                                                                                    <ext:Panel runat="server" Border="false" Header="false">
                                                                                                        <Body>
                                                                                                            <ext:Toolbar runat="server">
                                                                                                                <Items>
                                                                                                                    <ext:Button ID="BtnBuscar" runat="server" Text="Buscar Cajas" Icon="Magnifier">
                                                                                                                        <AjaxEvents>
                                                                                                                            <Click OnEvent="BtnBtnBuscar_click">
                                                                                                                            </Click>
                                                                                                                        </AjaxEvents>
                                                                                                                    </ext:Button>
                                                                                                                    <ext:ToolbarSeparator ID="ToolbarSeparator1" runat="server" />
                                                                                                                    <ext:Button ID="btnclearFilt" runat="server" Text="Limpiar Filtros" Icon="ClockDelete">
                                                                                                                        <AjaxEvents>
                                                                                                                            <Click OnEvent="btnclearFilt_click">
                                                                                                                            </Click>
                                                                                                                        </AjaxEvents>
                                                                                                                    </ext:Button>
                                                                                                                </Items>
                                                                                                            </ext:Toolbar>
                                                                                                        </Body>
                                                                                                    </ext:Panel>
                                                                                                </ext:Anchor>
                                                                                                <ext:Anchor Horizontal="100%">
                                                                                                    <ext:Panel runat="server" Border="false" Header="false" BodyStyle="padding: 10px 10px 0">
                                                                                                        <Body>
                                                                                                            <ext:FormLayout ID="FormLayout1" runat="server">
                                                                                                                <ext:Anchor Horizontal="100%">
                                                                                                                    <ext:ComboBox ID="TxtCsucur" runat="server" StoreID="Store_Sucursal" ValueField="csucur"
                                                                                                                        DisplayField="xdescripcion_l" TypeAhead="true" Mode="Local" TriggerAction="All"
                                                                                                                        EmptyText="Seleccione una Sucursal" ValueNotFoundText="Seleccione una Sucursal"
                                                                                                                        ForceSelection="true" SelectOnFocus="true" FieldLabel="Sucursal">
                                                                                                                    </ext:ComboBox>
                                                                                                                </ext:Anchor>
                                                                                                                <ext:Anchor Horizontal="100%">
                                                                                                                    <ext:ComboBox ID="TxtCcajero" runat="server" StoreID="Store_Cajero" ValueField="cci_rif"
                                                                                                                        DisplayField="xcliente" TypeAhead="true" Mode="Local" TriggerAction="All" EmptyText="Escriba el Nombre"
                                                                                                                        ValueNotFoundText="Escriba el Nombre" ForceSelection="true" SelectOnFocus="true"
                                                                                                                        FieldLabel="Cajero" HideTrigger="true">
                                                                                                                    </ext:ComboBox>
                                                                                                                </ext:Anchor>
                                                                                                                <ext:Anchor Horizontal="100%">
                                                                                                                    <ext:ComboBox ID="ddTipoCaja" runat="server" TypeAhead="true" Mode="Local" TriggerAction="All"
                                                                                                                        EmptyText="Seleccione un Tipo de Caja" ValueNotFoundText="Seleccione un Tipo de Caja"
                                                                                                                        ForceSelection="true" SelectOnFocus="true" FieldLabel="Tipo de Caja" DisplayField="xdescripcion_l"
                                                                                                                        ValueField="ccodigo">
                                                                                                                    </ext:ComboBox>
                                                                                                                </ext:Anchor>
                                                                                                                <ext:Anchor Horizontal="100%">
                                                                                                                    <ext:ComboBox ID="Ddliestado" runat="server" StoreID="Store_Ddliestado" ValueField="ccodigo"
                                                                                                                        DisplayField="xdescripcion_l" TypeAhead="true" Mode="Local" TriggerAction="All"
                                                                                                                        EmptyText="Seleccione un Estado" ValueNotFoundText="Seleccione un Estado" ForceSelection="true"
                                                                                                                        SelectOnFocus="true" FieldLabel="Estado">
                                                                                                                    </ext:ComboBox>
                                                                                                                </ext:Anchor>
                                                                                                                <ext:Anchor Horizontal="100%">
                                                                                                                    <ext:ComboBox ID="ddPeriodo" runat="server" TypeAhead="true" Mode="Local" TriggerAction="All"
                                                                                                                        EmptyText="Seleccione un Estado" ValueNotFoundText="Seleccione un Estado" ForceSelection="true"
                                                                                                                        SelectOnFocus="true" FieldLabel="Periodo">
                                                                                                                        <Items>
                                                                                                                            <ext:ListItem Value="0" Text="No-Especificado" />
                                                                                                                            <ext:ListItem Value="1" Text="Por Día" />
                                                                                                                            <ext:ListItem Value="2" Text="Por Mes" />
                                                                                                                        </Items>
                                                                                                                    </ext:ComboBox>
                                                                                                                </ext:Anchor>
                                                                                                                <ext:Anchor Horizontal="100%">
                                                                                                                    <ext:DateField ID="WdcHasta" runat="server" Vtype="daterange" FieldLabel="Fecha Inicial"
                                                                                                                        Width="100">
                                                                                                                        <Listeners>
                                                                                                                            <Render Handler="this.endDateField = '#{Wdcdesde}'" />
                                                                                                                        </Listeners>
                                                                                                                    </ext:DateField>
                                                                                                                </ext:Anchor>
                                                                                                                <ext:Anchor Horizontal="100%">
                                                                                                                    <ext:DateField ID="Wdcdesde" runat="server" Vtype="daterange" FieldLabel="Fecha Final"
                                                                                                                        Width="100">
                                                                                                                        <Listeners>
                                                                                                                            <Render Handler="this.startDateField = '#{WdcHasta}'" />
                                                                                                                        </Listeners>
                                                                                                                    </ext:DateField>
                                                                                                                </ext:Anchor>
                                                                                                                <ext:Anchor Horizontal="100%">
                                                                                                                    <ext:Checkbox ID="chNocuadra" runat="server" FieldLabel="No Cuadra">
                                                                                                                    </ext:Checkbox>
                                                                                                                </ext:Anchor>
                                                                                                            </ext:FormLayout>
                                                                                                            <ext:Store ID="Store_Ddliestado" runat="server" />
                                                                                                            <ext:Store ID="Store_Sucursal" runat="server" />
                                                                                                            <ext:Store ID="store_ddtipocaja" runat="server" />
                                                                                                            <ext:Store ID="Store_Cajero" runat="server" />
                                                                                                        </Body>
                                                                                                    </ext:Panel>
                                                                                                </ext:Anchor>
                                                                                            </ext:FormLayout>
                                                                                        </Body>
                                                                                    </ext:Panel>
                                                                                </West>
                                                                            </ext:BorderLayout>
                                                                        </Body>
                                                                    </ext:Tab>
                                                                    <ext:Tab ID="tabDetalle" runat="server" Enabled="false" Icon="Database" Border="false"
                                                                        Title="Detalles de la Caja">
                                                                        <TopBar>
                                                                            <ext:Toolbar ID="menuDetalles" runat="server">
                                                                                <Items>
                                                                                    <ext:Button runat="server" Icon="Sum" Text="Ver Totales">
                                                                                        <Menu>
                                                                                            <ext:Menu ID="Menu1" runat="server" Width="400px">
                                                                                                <Items>
                                                                                                    <ext:MenuItem ID="opTot_CajaSel" runat="server" Icon="CalendarViewMonth" Text="De la Caja">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="Tot_CajaSel">
                                                                                                                <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                                            </Click>
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                    <ext:MenuItem ID="opTot_CajaDia" runat="server" Icon="CalendarViewDay" Text="Del Día">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="Tot_CajaDia">
                                                                                                                <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                                            </Click>
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                    <ext:MenuItem ID="opTot_CajaMes" runat="server" Icon="CalendarViewMonth" Text="Del Mes">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="Tot_CajaMes">
                                                                                                                <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                                            </Click>
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                </Items>
                                                                                            </ext:Menu>
                                                                                        </Menu>
                                                                                    </ext:Button>
                                                                                    <ext:ToolbarSeparator runat="server" ID="ToolbarSeparator10" />
                                                                                    <ext:Button ID="ToolbarButton3" runat="server" Icon="Add" Text="Ver Detalles">
                                                                                        <Menu>
                                                                                            <ext:Menu ID="Menu4" runat="server" Width="400px">
                                                                                                <Items>
                                                                                                    <ext:MenuItem ID="opDet_CajaSel" runat="server" Icon="CalendarViewMonth" Text="De la Caja">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="Det_CajaSel">
                                                                                                                <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                                            </Click>
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                    <ext:MenuItem ID="opDet_CajaDia" runat="server" Icon="CalendarViewDay" Text="Del Día">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="Det_CajaDia">
                                                                                                                <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                                            </Click>
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                    <ext:MenuItem ID="opDet_CajaMes" runat="server" Icon="CalendarViewMonth" Text="Del Mes">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="Det_CajaMes">
                                                                                                                <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                                            </Click>
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                </Items>
                                                                                            </ext:Menu>
                                                                                        </Menu>
                                                                                    </ext:Button>
                                                                                    <ext:ToolbarSeparator runat="server" ID="ToolbarSeparator9" />
                                                                                    <ext:Button runat="server" ID="opContaLinea" Icon="Sitemap" Text=" Contabilización Línea">
                                                                                        <AjaxEvents>
                                                                                            <Click OnEvent="ContCajaDetalle">
                                                                                                <ExtraParams>
                                                                                                    <ext:Parameter Name="GdvMovCajas_Param" Mode="Raw" Value="Ext.encode(#{GdvMovCajas}.getRowsValues({selectedOnly : true}))" />
                                                                                                </ExtraParams>
                                                                                                <EventMask ShowMask="true" Msg="Procesando..." />
                                                                                            </Click>
                                                                                        </AjaxEvents>
                                                                                    </ext:Button>
                                                                                    <ext:Button runat="server" ID="opExcel" Icon="Sitemap" Text=" A Excel" AutoPostBack="true"
                                                                                        Visible="false">
                                                                                    </ext:Button>
                                                                                    <ext:ToolbarSeparator runat="server" />
                                                                                    <ext:ToolbarSpacer runat="server" />
                                                                                    <ext:Button runat="server" Icon="PageWhiteExcel" Text="Exportar a Excel">
                                                                                        <Listeners>
                                                                                            <Click Handler="submitValue(#{GdvMovCajas}, #{FormatType}, 'xls');" />
                                                                                        </Listeners>
                                                                                    </ext:Button>
                                                                                    <ext:ToolbarSeparator runat="server" ID="ToolbarSeparator8" />
                                                                                    <ext:Button ID="ToolbarButton6" runat="server" Icon="TableEdit" Text="Remayoriza Movimiento"
                                                                                        Enabled="true">
                                                                                        <AjaxEvents>
                                                                                            <Click OnEvent="ContabilizaLinea">
                                                                                                <EventMask ShowMask="true" Msg="Procesando..." />
                                                                                                <ExtraParams>
                                                                                                    <ext:Parameter Name="GdvMovCajas_Param" Mode="Raw" Value="Ext.encode(#{GdvMovCajas}.getRowsValues({selectedOnly : true}))" />
                                                                                                </ExtraParams>
                                                                                            </Click>
                                                                                        </AjaxEvents>
                                                                                    </ext:Button>
                                                                                    <ext:ToolbarSeparator runat="server" ID="sp1" />
                                                                                    <ext:Button ID="ToolbarButton7" runat="server" Icon="Accept" Text="Inicializar">
                                                                                        <AjaxEvents>
                                                                                            <Click OnEvent="Click_GdvMovCajas">
                                                                                                <EventMask ShowMask="true" Msg="Procesando..." />
                                                                                                <ExtraParams>
                                                                                                    <ext:Parameter Name="GdvMovCajas_Param" Mode="Raw" Value="Ext.encode(#{GdvMovCajas}.getRowsValues({selectedOnly : true}))" />
                                                                                                </ExtraParams>
                                                                                            </Click>
                                                                                        </AjaxEvents>
                                                                                    </ext:Button>
                                                                                    <ext:ToolbarSeparator runat="server" ID="ToolbarSeparator7" />
                                                                                    <ext:Button ID="Button1" runat="server" Icon="Printer" Text="Imprimir">
                                                                                        <Listeners>
                                                                                            <Click Handler="GetPrinter(#{GdvMovCajas}.getRowsValues({selectedOnly : true}));" />
                                                                                        </Listeners>
                                                                                    </ext:Button>
                                                                                </Items>
                                                                            </ext:Toolbar>
                                                                        </TopBar>
                                                                        <Body>
                                                                            <ext:BorderLayout runat="server">
                                                                                <Center>
                                                                                    <ext:Panel runat="server" Border="false" Header="false">
                                                                                        <Body>
                                                                                            <ext:Hidden ID="Hdf_GdvMovCajas" runat="server" />
                                                                                            <ext:FormLayout runat="server">
                                                                                                <ext:Anchor Horizontal="100%" Vertical="100%">
                                                                                                    <ext:Panel runat="server" Border="false" Header="false">
                                                                                                        <Body>
                                                                                                            <ext:Store ID="Store_GdvMovCajas" runat="server" GroupField="fcaja" OnSubmitData="Store_GdvMovCajas_Submit"
                                                                                                                AutoLoad="true">
                                                                                                                <AjaxEventConfig IsUpload="true" />
                                                                                                                <Reader>
                                                                                                                    <ext:JsonReader>
                                                                                                                        <Fields>
                                                                                                                            <ext:RecordField Name="fcaja" />
                                                                                                                            <ext:RecordField Name="cpago" />
                                                                                                                            <ext:RecordField Name="creferencia" />
                                                                                                                            <ext:RecordField Name="crelpago" />
                                                                                                                            <ext:RecordField Name="cestcta" />
                                                                                                                            <ext:RecordField Name="imovcaja" />
                                                                                                                            <ext:RecordField Name="cmoneda" />
                                                                                                                            <ext:RecordField Name="mcaja" />
                                                                                                                            <ext:RecordField Name="mefe" />
                                                                                                                            <ext:RecordField Name="mche" />
                                                                                                                            <ext:RecordField Name="mtar" />
                                                                                                                            <ext:RecordField Name="motros" />
                                                                                                                            <ext:RecordField Name="mcajaloc" />
                                                                                                                            <ext:RecordField Name="mcajaext" />
                                                                                                                            <ext:RecordField Name="xrecibido" />
                                                                                                                            <ext:RecordField Name="xobserva" />
                                                                                                                            <ext:RecordField Name="ctransaccion" />
                                                                                                                            <ext:RecordField Name="Descripcion" />
                                                                                                                            <ext:RecordField Name="fcontab" />
                                                                                                                            <ext:RecordField Name="iestcont" />
                                                                                                                            <ext:RecordField Name="nlote" />
                                                                                                                            <ext:RecordField Name="fanomescont" />
                                                                                                                            <ext:RecordField Name="xporcuenta" />
                                                                                                                            <ext:RecordField Name="xotros" />
                                                                                                                            <ext:RecordField Name="csucur_caja" />
                                                                                                                            <ext:RecordField Name="ccajero" />
                                                                                                                            <ext:RecordField Name="ccaja" />
                                                                                                                            <ext:RecordField Name="iTipoSecuCj" />
                                                                                                                        </Fields>
                                                                                                                    </ext:JsonReader>
                                                                                                                </Reader>
                                                                                                            </ext:Store>
                                                                                                            <ext:FitLayout runat="server">
                                                                                                                <ext:GridPanel ID="GdvMovCajas" runat="server" StoreID="Store_GdvMovCajas" AutoShow="True"
                                                                                                                    Title="Listado de Detalles de la Caja" Shadow="Frame"
                                                                                                                    Border="false" TrackMouseOver="true" AutoScroll="true" FireSelectOnLoad="false">
                                                                                                                    <ColumnModel runat="server">
                                                                                                                        <Columns>
                                                                                                                            <ext:Column ColumnID="fcaja" Header="Fecha de Caja" DataIndex="fcaja" />
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="cpago" Header="Pago" DataIndex="cpago">
                                                                                                                                <SummaryRenderer Handler="return ((value === 0 || value > 1) ? '(' + value +' Total)' : ' SUMATORIA');" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                            <ext:Column ColumnID="creferencia" Header="ROC" DataIndex="creferencia" />
                                                                                                                            <ext:Column ColumnID="crelpago" Header="Remesa" DataIndex="crelpago" />
                                                                                                                            <ext:Column ColumnID="cestcta" Header="Edo. Cta" DataIndex="cestcta" />
                                                                                                                            <ext:Column ColumnID="imovcaja" Header="Tipo" DataIndex="imovcaja" />
                                                                                                                            <ext:Column ColumnID="cmoneda" Header="Moneda" DataIndex="cmoneda" />
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="mcaja" Header="Monto" DataIndex="mcaja" Align="Right"
                                                                                                                                SummaryType="Sum">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="mefe" Header="Efectivo" DataIndex="mefe" Align="Right"
                                                                                                                                SummaryType="Sum">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="mche" Header="Cheque" DataIndex="mche" Align="Right"
                                                                                                                                SummaryType="Sum">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="mtar" Header="Tarjeta" DataIndex="mtar" Align="Right"
                                                                                                                                SummaryType="Sum">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="motros" Header="Otros" DataIndex="motros" Align="Right"
                                                                                                                                SummaryType="Sum">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="mcajaloc" Header="Monto(ML)" DataIndex="mcajaloc"
                                                                                                                                Align="Right" SummaryType="Sum">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="mcajaext" Header="Monto(ME)" DataIndex="mcajaext"
                                                                                                                                Align="Right" SummaryType="Sum">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                            <ext:Column ColumnID="xrecibido" Header="Recibido" DataIndex="xrecibido" />
                                                                                                                            <ext:Column ColumnID="xobserva" Header="Concepto" DataIndex="xobserva" />
                                                                                                                            <ext:Column ColumnID="ctransaccion" Header="Cod. Transacción" DataIndex="ctransaccion" />
                                                                                                                            <ext:Column ColumnID="Descripcion" Header="Transacción" DataIndex="Descripcion" />
                                                                                                                            <ext:Column ColumnID="fcontab" Header="F. Cont" DataIndex="fcontab">
                                                                                                                                <Renderer Fn="Ext.util.Format.dateRenderer('d/m/Y')" />
                                                                                                                            </ext:Column>
                                                                                                                            <ext:Column ColumnID="iestcont" Header="Est. Cont." DataIndex="iestcont" />
                                                                                                                            <ext:Column ColumnID="nlote" Header="Comprobante" DataIndex="nlote" />
                                                                                                                            <ext:Column ColumnID="fanomescont" Header="Año/Mes" DataIndex="fanomescont" />
                                                                                                                        </Columns>
                                                                                                                    </ColumnModel>
                                                                                                                    <SelectionModel>
                                                                                                                        <ext:CheckboxSelectionModel runat="server">
                                                                                                                            <%--  <AjaxEvents>
                                                                                                                                    <RowSelect Buffer="250">
                                                                                                                                        <ExtraParams>
                                                                                                                                            <ext:Parameter Name="GdvMovCajas_Param" Mode="Raw" Value="Ext.encode(#{GdvMovCajas}.getRowsValues())" />
                                                                                                                                        </ExtraParams>
                                                                                                                                    </RowSelect>
                                                                                                                                </AjaxEvents>--%>
                                                                                                                        </ext:CheckboxSelectionModel>
                                                                                                                        <%--    <ext:RowSelectionModel runat="server" SingleSelect="true">
                                                                                                                                <AjaxEvents>
                                                                                                                                    <RowSelect OnEvent="Click_GdvMovCajas" Buffer="250">
                                                                                                                                        <ExtraParams>
                                                                                                                                            <ext:Parameter Name="GdvMovCajas_Param" Mode="Raw" Value="Ext.encode(#{GdvMovCajas}.getRowsValues())" />
                                                                                                                                        </ExtraParams>
                                                                                                                                    </RowSelect>
                                                                                                                                </AjaxEvents>
                                                                                                                            </ext:RowSelectionModel>--%>
                                                                                                                    </SelectionModel>
                                                                                                                    <Plugins>
                                                                                                                        <ext:GroupingSummary runat="server">
                                                                                                                        </ext:GroupingSummary>
                                                                                                                    </Plugins>
                                                                                                                    <BottomBar>
                                                                                                                        <ext:PagingToolBar runat="server" PageSize="20" StoreID="Store_GdvMovCajas" BeforePageText="Atras"
                                                                                                                            AfterPageText="Siguiente" DisplayMsg="Mostrando {0} - {1} de {2}" EmptyMsg="No hay Registros">
                                                                                                                        </ext:PagingToolBar>
                                                                                                                    </BottomBar>
                                                                                                                    <View>
                                                                                                                        <ext:GroupingView runat="server" SortAscText="" ForceFit="false" ShowGroupName="true"
                                                                                                                            EnableNoGroups="true" HideGroupedColumn="true">
                                                                                                                        </ext:GroupingView>
                                                                                                                    </View>
                                                                                                                </ext:GridPanel>
                                                                                                            </ext:FitLayout>
                                                                                                        </Body>
                                                                                                    </ext:Panel>
                                                                                                </ext:Anchor>
                                                                                            </ext:FormLayout>
                                                                                        </Body>
                                                                                    </ext:Panel>
                                                                                </Center>
                                                                            </ext:BorderLayout>
                                                                        </Body>
                                                                    </ext:Tab>
                                                                    <ext:Tab ID="tabPrimas" runat="server" Enabled="false" Icon="DatabaseKey" Border="false"
                                                                        Title="Primas Pagadas">
                                                                        <TopBar>
                                                                            <ext:Toolbar ID="menuPrimas" runat="server">
                                                                                <Items>
                                                                                    <ext:ToolbarButton runat="server" Icon="Sum" Text="Ver Totales">
                                                                                        <Menu>
                                                                                            <ext:Menu ID="Menu2" runat="server" Width="400px">
                                                                                                <Items>
                                                                                                    <ext:MenuItem ID="opTPrima_Ram_CajaSel" runat="server" Icon="CalendarViewMonth" Text="De la Caja">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="TPrimaRam_CajaSel">
                                                                                                                <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                                            </Click>
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                    <ext:MenuItem ID="opTPrima_Ram_CajaDia" runat="server" Icon="CalendarViewDay" Text="Del Día">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="TPrimaRam_CajaDia">
                                                                                                                <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                                            </Click>
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                    <ext:MenuItem ID="opTPrima_Ram_CajaMes" runat="server" Icon="CalendarViewMonth" Text="Del Mes">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="TPrimaRam_CajaMes">
                                                                                                                <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                                            </Click>
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                </Items>
                                                                                            </ext:Menu>
                                                                                        </Menu>
                                                                                        <%--<AjaxEvents>
                                                                                                <Click OnEvent="TotalRamo">
                                                                                                    <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                                </Click>
                                                                                            </AjaxEvents>--%>
                                                                                    </ext:ToolbarButton>
                                                                                    <ext:ToolbarButton ID="ToolbarButton2" runat="server" Icon="Add" Text="Ver Detalles">
                                                                                        <Menu>
                                                                                            <ext:Menu ID="Menu3" runat="server" Width="400px">
                                                                                                <Items>
                                                                                                    <ext:MenuItem ID="opDPrima_Ram_CajaSel" runat="server" Icon="CalendarViewMonth" Text="De la Caja">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="DPrimaRam_CajaSel">
                                                                                                                <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                                            </Click>
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                    <ext:MenuItem ID="opDPrima_Ram_CajaDia" runat="server" Icon="CalendarViewDay" Text="Del Día">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="DPrimaRam_CajaDia">
                                                                                                                <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                                            </Click>
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                    <ext:MenuItem ID="opDPrima_Ram_CajaMes" runat="server" Icon="CalendarViewMonth" Text="Del Mes">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="DPrimaRam_CajaMes">
                                                                                                                <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                                            </Click>
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                </Items>
                                                                                            </ext:Menu>
                                                                                        </Menu>
                                                                                        <%--<AjaxEvents>
                                                                                                <Click OnEvent="TotalRamo">
                                                                                                    <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                                </Click>
                                                                                            </AjaxEvents>--%>
                                                                                    </ext:ToolbarButton>
                                                                                    <%--<ext:ToolbarButton runat="server" Icon="Disk" Text="Total General" AutoPostBack="true">
                                                                                            <AjaxEvents>
                                                                                                <Click OnEvent="TotalGen">
                                                                                                    <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                                </Click>
                                                                                            </AjaxEvents>
                                                                                        </ext:ToolbarButton>--%>
                                                                                    <%--<ext:ToolbarButton runat="server" Icon="Sitemap" Text=" Comisión General">
                                                                                            <AjaxEvents>
                                                                                                <Click OnEvent="ComiGen">
                                                                                                    <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                                </Click>
                                                                                            </AjaxEvents>
                                                                                        </ext:ToolbarButton>--%>
                                                                                    <ext:ToolbarSeparator runat="server" />
                                                                                    <ext:ToolbarSpacer runat="server" />
                                                                                    <ext:ToolbarButton runat="server" Icon="PageWhiteExcel" Text="Exportar a Excel">
                                                                                        <Listeners>
                                                                                            <Click Handler="submitValue(#{GdvPagoPrima}, #{FormatType}, 'xls');" />
                                                                                        </Listeners>
                                                                                    </ext:ToolbarButton>
                                                                                </Items>
                                                                            </ext:Toolbar>
                                                                        </TopBar>
                                                                        <Body>
                                                                            <ext:BorderLayout runat="server">
                                                                                <Center>
                                                                                    <ext:Panel runat="server" Border="false" Header="false">
                                                                                        <Body>
                                                                                            <ext:FormLayout runat="server">
                                                                                                <ext:Anchor Horizontal="100%" Vertical="100%">
                                                                                                    <ext:Panel runat="server" Border="false" Header="false">
                                                                                                        <Body>
                                                                                                            <ext:Store ID="Store_GdvPagoPrima" runat="server" GroupField="fcaja" OnSubmitData="Store_GdvPagoPrima_Submit"
                                                                                                                AutoLoad="true">
                                                                                                                <AjaxEventConfig IsUpload="true" />
                                                                                                                <Reader>
                                                                                                                    <ext:JsonReader>
                                                                                                                        <Fields>
                                                                                                                            <ext:RecordField Name="fcaja" />
                                                                                                                            <ext:RecordField Name="cpago" />
                                                                                                                            <ext:RecordField Name="crelpagolin" />
                                                                                                                            <ext:RecordField Name="cnpoliza" />
                                                                                                                            <ext:RecordField Name="cestcta" />
                                                                                                                            <ext:RecordField Name="crecibo" />
                                                                                                                            <ext:RecordField Name="ccuota" />
                                                                                                                            <ext:RecordField Name="cmoneda" />
                                                                                                                            <ext:RecordField Name="mpagado" />
                                                                                                                            <ext:RecordField Name="mproductor" />
                                                                                                                            <ext:RecordField Name="msupervisor" />
                                                                                                                            <ext:RecordField Name="mgerente" />
                                                                                                                            <ext:RecordField Name="mimpuestos" />
                                                                                                                            <ext:RecordField Name="mcoaseguro" />
                                                                                                                            <ext:RecordField Name="mprima" />
                                                                                                                            <ext:RecordField Name="minteres" />
                                                                                                                            <ext:RecordField Name="mgastos" />
                                                                                                                        </Fields>
                                                                                                                    </ext:JsonReader>
                                                                                                                </Reader>
                                                                                                            </ext:Store>
                                                                                                            <ext:FitLayout runat="server">
                                                                                                                <ext:GridPanel ID="GdvPagoPrima" runat="server" StoreID="Store_GdvPagoPrima" AutoShow="True"
                                                                                                                    Height="550" AutoWidth="true" Title="Listado de Primas Pagadas" Shadow="Frame"
                                                                                                                    TrackMouseOver="true" FireSelectOnLoad="false" Border="false">
                                                                                                                    <ColumnModel runat="server">
                                                                                                                        <Columns>
                                                                                                                            <ext:Column ColumnID="fcaja" Header="Fecha de Caja" DataIndex="fcaja" />
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="cpago" Header="Pago" DataIndex="cpago">
                                                                                                                                <SummaryRenderer Handler="return ((value === 0 || value > 1) ? '(' + value +' Total)' : ' SUMATORIA');" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                            <ext:Column ColumnID="crelpagolin" Header="Linea" DataIndex="crelpagolin" />
                                                                                                                            <ext:Column ColumnID="cnpoliza" Header="Póliza" DataIndex="cnpoliza" />
                                                                                                                            <ext:Column ColumnID="cestcta" Header="Edo. Cta" DataIndex="cestcta" />
                                                                                                                            <ext:Column ColumnID="crecibo" Header="Recibo" DataIndex="crecibo" />
                                                                                                                            <ext:Column ColumnID="ccuota" Header="Cuota" DataIndex="ccuota" />
                                                                                                                            <ext:Column ColumnID="cmoneda" Header="Moneda" DataIndex="cmoneda" />
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="mprima" Header="Mto. Prima" DataIndex="mprima"
                                                                                                                                Align="Right" SummaryType="Sum">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="mimpuestos" Header="Mto. Impuestos" DataIndex="mimpuestos"
                                                                                                                                Align="Right" SummaryType="Sum">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="mgastos" Header="Mto. Gastos" DataIndex="mgastos"
                                                                                                                                Align="Right" SummaryType="Sum">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="motrosgas" Header="Mto. Otros Gastos" DataIndex="motrosgas"
                                                                                                                                Align="Right" SummaryType="Sum">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="mpagado" Header="Mto. Pagado" DataIndex="mpagado"
                                                                                                                                Align="Right" SummaryType="Sum">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="minteres" Header="Mto. Interes" DataIndex="minteres"
                                                                                                                                Align="Right" SummaryType="Sum">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="mproductor" Header="Mto. Productor" DataIndex="mproductor"
                                                                                                                                Align="Right" SummaryType="Sum">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="msupervisor" Header="Mto. Supervisor" DataIndex="msupervisor"
                                                                                                                                Align="Right" SummaryType="Sum">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="mgerente" Header="Mto. Gerente" DataIndex="mgerente"
                                                                                                                                Align="Right" SummaryType="Sum">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                        </Columns>
                                                                                                                    </ColumnModel>
                                                                                                                    <SelectionModel>
                                                                                                                        <ext:RowSelectionModel runat="server" SingleSelect="true">
                                                                                                                            <AjaxEvents>
                                                                                                                                <RowSelect OnEvent="Click_GdvPagoPrima" Buffer="250">
                                                                                                                                    <ExtraParams>
                                                                                                                                        <ext:Parameter Name="GdvPagoPrima_Param" Mode="Raw" Value="Ext.encode(#{GdvPagoPrima}.getRowsValues())" />
                                                                                                                                    </ExtraParams>
                                                                                                                                </RowSelect>
                                                                                                                            </AjaxEvents>
                                                                                                                        </ext:RowSelectionModel>
                                                                                                                    </SelectionModel>
                                                                                                                    <BottomBar>
                                                                                                                        <ext:PagingToolBar ID="PagingToolBar2" runat="server" PageSize="20" StoreID="Store_GdvPagoPrima"
                                                                                                                            BeforePageText="Atras" AfterPageText="Siguiente" DisplayMsg="Mostrando {0} - {1} de {2}"
                                                                                                                            EmptyMsg="No hay Registros">
                                                                                                                        </ext:PagingToolBar>
                                                                                                                    </BottomBar>
                                                                                                                    <Plugins>
                                                                                                                        <ext:GroupingSummary runat="server">
                                                                                                                        </ext:GroupingSummary>
                                                                                                                    </Plugins>
                                                                                                                    <View>
                                                                                                                        <ext:GroupingView runat="server" ForceFit="false" ShowGroupName="true" EnableNoGroups="true"
                                                                                                                            HideGroupedColumn="true">
                                                                                                                        </ext:GroupingView>
                                                                                                                    </View>
                                                                                                                </ext:GridPanel>
                                                                                                            </ext:FitLayout>
                                                                                                        </Body>
                                                                                                    </ext:Panel>
                                                                                                </ext:Anchor>
                                                                                            </ext:FormLayout>
                                                                                        </Body>
                                                                                    </ext:Panel>
                                                                                </Center>
                                                                            </ext:BorderLayout>
                                                                        </Body>
                                                                    </ext:Tab>
                                                                    <ext:Tab ID="tabDepositos" Enabled="false" runat="server" Icon="DatabaseLightning"
                                                                        Border="false" Title="Primas en Depósitos">
                                                                        <TopBar>
                                                                            <ext:Toolbar ID="menuDepositos" runat="server">
                                                                                <Items>
                                                                                    <%-- <ext:ToolbarButton runat="server" Icon="Add" Text="Ver Detalle">
                                                                                            <AjaxEvents>
                                                                                                <Click OnEvent="VDetalles">
                                                                                                    <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                                </Click>
                                                                                            </AjaxEvents>
                                                                                        </ext:ToolbarButton>
                                                                                        <ext:ToolbarButton runat="server" Icon="Disk" Text="Ver Día">
                                                                                            <AjaxEvents>
                                                                                                <Click OnEvent="VDia">
                                                                                                    <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                                </Click>
                                                                                            </AjaxEvents>
                                                                                        </ext:ToolbarButton>
                                                                                        <ext:ToolbarButton runat="server" Icon="Sitemap" Text=" Totales">
                                                                                            <AjaxEvents>
                                                                                                <Click OnEvent="Totalestab4">
                                                                                                    <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                                </Click>
                                                                                            </AjaxEvents>
                                                                                        </ext:ToolbarButton>--%>
                                                                                    <ext:ToolbarButton runat="server" Icon="Add" Text="Ver Detalles">
                                                                                        <Menu>
                                                                                            <ext:Menu runat="server" Width="400px">
                                                                                                <Items>
                                                                                                    <ext:MenuItem runat="server" Icon="CalendarViewMonth" Text="De la Caja">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="VDetalles">
                                                                                                                <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                                            </Click>
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                    <ext:MenuItem runat="server" Icon="CalendarViewDay" Text="Del Día">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="VDia">
                                                                                                                <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                                            </Click>
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                    <ext:MenuItem runat="server" Icon="CalendarViewMonth" Text="Del Mes">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="Totalestab4">
                                                                                                                <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                                            </Click>
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                </Items>
                                                                                            </ext:Menu>
                                                                                        </Menu>
                                                                                    </ext:ToolbarButton>
                                                                                    <ext:ToolbarSeparator runat="server" />
                                                                                    <ext:ToolbarSpacer runat="server" />
                                                                                    <ext:ToolbarButton runat="server" Icon="PageWhiteExcel" Text="Exportar a Excel">
                                                                                        <Listeners>
                                                                                            <Click Handler="submitValue(#{GdvDeptoPrima}, #{FormatType}, 'xls');" />
                                                                                        </Listeners>
                                                                                    </ext:ToolbarButton>
                                                                                </Items>
                                                                            </ext:Toolbar>
                                                                        </TopBar>
                                                                        <Body>
                                                                            <ext:BorderLayout ID="BorderLayout2" runat="server">
                                                                                <Center>
                                                                                    <ext:Panel ID="Panel5" runat="server" Border="false" Header="false">
                                                                                        <Body>
                                                                                            <ext:FormLayout ID="FormLayout5" runat="server">
                                                                                                <ext:Anchor Horizontal="100%" Vertical="100%">
                                                                                                    <ext:Panel ID="Panel6" runat="server" Border="false" Header="false">
                                                                                                        <Body>
                                                                                                            <ext:Store ID="Store_GdvDeptoPrima" GroupField="fcaja" runat="server" OnSubmitData="Store_GdvDeptoPrima_Submit"
                                                                                                                AutoLoad="true">
                                                                                                                <AjaxEventConfig IsUpload="true" />
                                                                                                                <Reader>
                                                                                                                    <ext:JsonReader>
                                                                                                                        <Fields>
                                                                                                                            <ext:RecordField Name="fcaja" />
                                                                                                                            <ext:RecordField Name="cpago" />
                                                                                                                            <ext:RecordField Name="ntranpdp_linea" />
                                                                                                                            <ext:RecordField Name="cestcta" />
                                                                                                                            <ext:RecordField Name="cmoneda" />
                                                                                                                            <ext:RecordField Name="ctransaccion" />
                                                                                                                            <ext:RecordField Name="cnpoliza" />
                                                                                                                            <ext:RecordField Name="mmonto" />
                                                                                                                            <ext:RecordField Name="itipopago" />
                                                                                                                            <ext:RecordField Name="iestado" />
                                                                                                                        </Fields>
                                                                                                                    </ext:JsonReader>
                                                                                                                </Reader>
                                                                                                            </ext:Store>
                                                                                                            <ext:FitLayout runat="server">
                                                                                                                <ext:GridPanel ID="GdvDeptoPrima" runat="server" StoreID="Store_GdvDeptoPrima" AutoShow="True"
                                                                                                                    Height="550" Title="Listado de Depósitos Primas" Shadow="Frame" TrackMouseOver="true"
                                                                                                                    FireSelectOnLoad="false">
                                                                                                                    <ColumnModel ID="ColumnModel4" runat="server">
                                                                                                                        <Columns>
                                                                                                                            <ext:Column ColumnID="fcaja" Header="Fecha de Caja" DataIndex="fcaja" />
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="cpago" Header="Pago" DataIndex="cpago">
                                                                                                                                <SummaryRenderer Handler="return ((value === 0 || value > 1) ? '(' + value +' Total)' : ' SUMATORIA');" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                            <ext:Column ColumnID="ntranpdp_linea" Header="Linea" DataIndex="ntranpdp_linea" />
                                                                                                                            <ext:Column ColumnID="cestcta" Header="Edo. Cta" DataIndex="cestcta" />
                                                                                                                            <ext:Column ColumnID="cmoneda" Header="Moneda" DataIndex="cmoneda" />
                                                                                                                            <ext:Column ColumnID="ctransaccion" Header="Transaccion" DataIndex="ctransaccion" />
                                                                                                                            <ext:Column ColumnID="cnpoliza" Header="Póliza" DataIndex="cnpoliza" />
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="mmonto" Header="Monto" DataIndex="mmonto" Align="Right"
                                                                                                                                SummaryType="Sum">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                            <ext:Column ColumnID="itipopago" Header="Tipo" DataIndex="itipopago" />
                                                                                                                            <ext:Column ColumnID="iestado" Header="Estado" DataIndex="iestado" />
                                                                                                                        </Columns>
                                                                                                                    </ColumnModel>
                                                                                                                    <SelectionModel>
                                                                                                                        <ext:RowSelectionModel ID="RowSelectionModel4" runat="server" SingleSelect="true">
                                                                                                                            <AjaxEvents>
                                                                                                                                <%--<RowSelect OnEvent="Click_FormacionAcademica" Buffer="250">
                                                                                                                    <ExtraParams>
                                                                                                                        <ext:Parameter Name="GVFormacionAcad" Mode="Raw" Value="Ext.encode(#{gvFormacionAcademica}.getRowsValues())" />
                                                                                                                    </ExtraParams>
                                                                                                                </RowSelect>--%>
                                                                                                                            </AjaxEvents>
                                                                                                                        </ext:RowSelectionModel>
                                                                                                                    </SelectionModel>
                                                                                                                    <BottomBar>
                                                                                                                        <ext:PagingToolBar ID="PagingToolBar4" runat="server" PageSize="20" StoreID="Store_GdvDeptoPrima"
                                                                                                                            BeforePageText="Atras" AfterPageText="Siguiente" DisplayMsg="Mostrando {0} - {1} de {2}"
                                                                                                                            EmptyMsg="No hay Registros">
                                                                                                                        </ext:PagingToolBar>
                                                                                                                    </BottomBar>
                                                                                                                    <Plugins>
                                                                                                                        <ext:GroupingSummary runat="server">
                                                                                                                        </ext:GroupingSummary>
                                                                                                                    </Plugins>
                                                                                                                    <View>
                                                                                                                        <ext:GroupingView runat="server" ForceFit="true" ShowGroupName="true" EnableNoGroups="true"
                                                                                                                            HideGroupedColumn="true">
                                                                                                                        </ext:GroupingView>
                                                                                                                    </View>
                                                                                                                </ext:GridPanel>
                                                                                                            </ext:FitLayout>
                                                                                                        </Body>
                                                                                                    </ext:Panel>
                                                                                                </ext:Anchor>
                                                                                            </ext:FormLayout>
                                                                                        </Body>
                                                                                    </ext:Panel>
                                                                                </Center>
                                                                            </ext:BorderLayout>
                                                                        </Body>
                                                                    </ext:Tab>
                                                                    <ext:Tab ID="tabDepoBanco" Enabled="false" runat="server" Icon="DatabaseWrench" Border="false"
                                                                        Title="Depósitos en Bancos">
                                                                        <TopBar>
                                                                            <ext:Toolbar ID="menuDepoBanco" runat="server">
                                                                                <Items>
                                                                                    <ext:ToolbarButton ID="ToolbarButton4" runat="server" Icon="Sum" Text="Ver Totales">
                                                                                        <Menu>
                                                                                            <ext:Menu ID="Menu5" runat="server" Width="400px">
                                                                                                <Items>
                                                                                                    <ext:MenuItem ID="opTBan_CajaSel" runat="server" Icon="CalendarViewMonth" Text="De la Caja">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="TBan_CajaSel">
                                                                                                                <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                                            </Click>
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                    <ext:MenuItem ID="opTBan_CajaDia" runat="server" Icon="CalendarViewDay" Text="Del Día">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="TBan_CajaDia">
                                                                                                                <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                                            </Click>
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                    <ext:MenuItem ID="opTBan_CajaMes" runat="server" Icon="CalendarViewMonth" Text="Del Mes">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="TBan_CajaMes">
                                                                                                                <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                                            </Click>
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                </Items>
                                                                                            </ext:Menu>
                                                                                        </Menu>
                                                                                    </ext:ToolbarButton>
                                                                                    <ext:ToolbarButton ID="ToolbarButton5" runat="server" Icon="Add" Text="Ver Detalles">
                                                                                        <Menu>
                                                                                            <ext:Menu ID="Menu6" runat="server" Width="400px">
                                                                                                <Items>
                                                                                                    <ext:MenuItem ID="opDBan_CajaSel" runat="server" Icon="CalendarViewMonth" Text="De la Caja">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="DBan_CajaSel">
                                                                                                                <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                                            </Click>
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                    <ext:MenuItem ID="opDBan_CajaDia" runat="server" Icon="CalendarViewDay" Text="Del Día">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="DBan_CajaDia">
                                                                                                                <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                                            </Click>
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                    <ext:MenuItem ID="opDBan_CajaMes" runat="server" Icon="CalendarViewMonth" Text="Del Mes">
                                                                                                        <AjaxEvents>
                                                                                                            <Click OnEvent="DBan_CajaMes">
                                                                                                                <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                                            </Click>
                                                                                                        </AjaxEvents>
                                                                                                    </ext:MenuItem>
                                                                                                </Items>
                                                                                            </ext:Menu>
                                                                                        </Menu>
                                                                                        <%--<AjaxEvents>
                                                                                <Click OnEvent="TotalRamo">
                                                                                    <EventMask ShowMask="true" Msg="Cargando Datos..." />
                                                                                </Click>
                                                                            </AjaxEvents>--%>
                                                                                    </ext:ToolbarButton>
                                                                                    <ext:ToolbarSeparator runat="server" />
                                                                                    <ext:ToolbarSpacer runat="server" />
                                                                                    <ext:ToolbarButton runat="server" Icon="PageWhiteExcel" Text="Exportar a Excel">
                                                                                        <Listeners>
                                                                                            <Click Handler="submitValue(#{GdvDeptoBanco}, #{FormatType}, 'xls');" />
                                                                                        </Listeners>
                                                                                    </ext:ToolbarButton>
                                                                                </Items>
                                                                            </ext:Toolbar>
                                                                        </TopBar>
                                                                        <Body>
                                                                            <ext:BorderLayout runat="server">
                                                                                <Center>
                                                                                    <ext:Panel runat="server" Border="false" Header="false">
                                                                                        <Body>
                                                                                            <ext:FormLayout runat="server">
                                                                                                <ext:Anchor Horizontal="100%" Vertical="100%">
                                                                                                    <ext:Panel runat="server" Border="false" Header="false">
                                                                                                        <Body>
                                                                                                            <ext:Store ID="Store_GdvDeptoBanco" runat="server" GroupField="fcaja" AutoLoad="true"
                                                                                                                OnSubmitData="Store_GdvDeptoBanco_Submit">
                                                                                                                <AjaxEventConfig IsUpload="true" />
                                                                                                                <Reader>
                                                                                                                    <ext:JsonReader>
                                                                                                                        <Fields>
                                                                                                                            <ext:RecordField Name="fcaja" />
                                                                                                                            <ext:RecordField Name="cpago" />
                                                                                                                            <ext:RecordField Name="cmoneda" />
                                                                                                                            <ext:RecordField Name="ctransaccion" />
                                                                                                                            <ext:RecordField Name="Descripcion" />
                                                                                                                            <ext:RecordField Name="mmonto" />
                                                                                                                        </Fields>
                                                                                                                    </ext:JsonReader>
                                                                                                                </Reader>
                                                                                                            </ext:Store>
                                                                                                            <ext:FitLayout runat="server">
                                                                                                                <ext:GridPanel ID="GdvDeptoBanco" runat="server" StoreID="Store_GdvDeptoBanco" AutoShow="True"
                                                                                                                    Height="550" AutoWidth="true" Title="Listado de Depósitos en Bancos" Shadow="Frame"
                                                                                                                    TrackMouseOver="true" FireSelectOnLoad="false" Border="false">
                                                                                                                    <ColumnModel ID="ColumnModel3" runat="server">
                                                                                                                        <Columns>
                                                                                                                            <ext:Column ColumnID="fcaja" Header="Fecha de Caja" DataIndex="fcaja" />
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="cpago" Header="Pago" DataIndex="cpago">
                                                                                                                                <SummaryRenderer Handler="return ((value === 0 || value > 1) ? '(' + value +' Total)' : ' SUMATORIA');" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                            <ext:Column ColumnID="cmoneda" Header="Moneda" DataIndex="cmoneda" />
                                                                                                                            <ext:Column ColumnID="ctransaccion" Header="Transaccion" DataIndex="ctransaccion" />
                                                                                                                            <ext:Column ColumnID="Descripcion" Header="Descripción" DataIndex="Descripcion" />
                                                                                                                            <ext:GroupingSummaryColumn ColumnID="mmonto" Header="Monto" DataIndex="mmonto" SummaryType="Sum"
                                                                                                                                Align="Right">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:GroupingSummaryColumn>
                                                                                                                        </Columns>
                                                                                                                    </ColumnModel>
                                                                                                                    <SelectionModel>
                                                                                                                        <ext:RowSelectionModel ID="RowSelectionModel3" runat="server" SingleSelect="true">
                                                                                                                            <AjaxEvents>
                                                                                                                                <%--<RowSelect OnEvent="Click_FormacionAcademica" Buffer="250">
                                                                                                                    <ExtraParams>
                                                                                                                        <ext:Parameter Name="GVFormacionAcad" Mode="Raw" Value="Ext.encode(#{gvFormacionAcademica}.getRowsValues())" />
                                                                                                                    </ExtraParams>
                                                                                                                </RowSelect>--%>
                                                                                                                            </AjaxEvents>
                                                                                                                        </ext:RowSelectionModel>
                                                                                                                    </SelectionModel>
                                                                                                                    <BottomBar>
                                                                                                                        <ext:PagingToolBar ID="PagingToolBar3" runat="server" PageSize="20" StoreID="Store_GdvDeptoBanco"
                                                                                                                            BeforePageText="Atras" AfterPageText="Siguiente" DisplayMsg="Mostrando {0} - {1} de {2}"
                                                                                                                            EmptyMsg="No hay Registros">
                                                                                                                        </ext:PagingToolBar>
                                                                                                                    </BottomBar>
                                                                                                                    <Plugins>
                                                                                                                        <ext:GroupingSummary runat="server">
                                                                                                                        </ext:GroupingSummary>
                                                                                                                    </Plugins>
                                                                                                                    <View>
                                                                                                                        <ext:GroupingView runat="server" ForceFit="true" ShowGroupName="true" EnableNoGroups="true"
                                                                                                                            HideGroupedColumn="true">
                                                                                                                        </ext:GroupingView>
                                                                                                                    </View>
                                                                                                                </ext:GridPanel>
                                                                                                            </ext:FitLayout>
                                                                                                        </Body>
                                                                                                    </ext:Panel>
                                                                                                </ext:Anchor>
                                                                                            </ext:FormLayout>
                                                                                        </Body>
                                                                                    </ext:Panel>
                                                                                </Center>
                                                                            </ext:BorderLayout>
                                                                        </Body>
                                                                    </ext:Tab>
                                                                    <ext:Tab runat="server" ID="tab7" Icon="Find" Title="Búsqueda" Border="false">
                                                                        <Body>
                                                                            <ext:BorderLayout runat="server">
                                                                                <Center>
                                                                                    <ext:Panel ID="PnlMovCajaBs" AutoScroll="true" runat="server" Title="Movimientos encontrados"
                                                                                        Border="false">
                                                                                        <Body>
                                                                                            <ext:Store ID="Store_GdvMovCajasBUs" runat="server" AutoLoad="false" OnRefreshData="Store_GdvMovCajasBUs_Refresh">
                                                                                                <AjaxEventConfig IsUpload="true" />
                                                                                                <Reader>
                                                                                                    <ext:JsonReader>
                                                                                                        <Fields>
                                                                                                            <ext:RecordField Name="csucur_caja" />
                                                                                                            <ext:RecordField Name="ccajero" />
                                                                                                            <ext:RecordField Name="fcaja" />
                                                                                                            <ext:RecordField Name="ccaja" />
                                                                                                            <ext:RecordField Name="cpago" />
                                                                                                            <ext:RecordField Name="crelpago" />
                                                                                                            <ext:RecordField Name="cestcta" />
                                                                                                            <ext:RecordField Name="ncierre" />
                                                                                                            <ext:RecordField Name="fcierre" />
                                                                                                            <ext:RecordField Name="imovcaja" />
                                                                                                            <ext:RecordField Name="cmoneda" />
                                                                                                            <ext:RecordField Name="fcobro" />
                                                                                                            <ext:RecordField Name="mcaja" />
                                                                                                            <ext:RecordField Name="mefe" />
                                                                                                            <ext:RecordField Name="mche" />
                                                                                                            <ext:RecordField Name="mtar" />
                                                                                                            <ext:RecordField Name="motros" />
                                                                                                            <ext:RecordField Name="xrecibido" />
                                                                                                            <ext:RecordField Name="fcontab" />
                                                                                                            <ext:RecordField Name="iestcont" />
                                                                                                            <ext:RecordField Name="nlote" />
                                                                                                            <ext:RecordField Name="fanomescont" />
                                                                                                            <ext:RecordField Name="nsemana" />
                                                                                                            <ext:RecordField Name="nano" />
                                                                                                        </Fields>
                                                                                                    </ext:JsonReader>
                                                                                                </Reader>
                                                                                                <BaseParams>
                                                                                                    <ext:Parameter Name="start" Mode="Raw" Value="0" />
                                                                                                    <ext:Parameter Name="limit" Mode="Raw" Value="30" />
                                                                                                </BaseParams>
                                                                                                <Proxy>
                                                                                                    <ext:DataSourceProxy />
                                                                                                </Proxy>
                                                                                            </ext:Store>
                                                                                            <ext:FormLayout runat="server">
                                                                                                <ext:Anchor Horizontal="100%">
                                                                                                    <ext:Panel runat="server" Border="false" Header="false">
                                                                                                        <Body>
                                                                                                            <ext:Toolbar ID="ToolBusqueda" runat="server">
                                                                                                                <Items>
                                                                                                                    <ext:Button runat="server" ID="btIrMov" Icon="Add" Text="Ir a movimiento">
                                                                                                                        <AjaxEvents>
                                                                                                                            <Click OnEvent="IraMov">
                                                                                                                                <ExtraParams>
                                                                                                                                    <ext:Parameter Name="GdvMovCajasBUs_Pram" Mode="Raw" Value="Ext.encode(#{GdvMovCajasBUs}.getRowsValues())" />
                                                                                                                                </ExtraParams>
                                                                                                                            </Click>
                                                                                                                        </AjaxEvents>
                                                                                                                    </ext:Button>
                                                                                                                    <ext:ToolbarSeparator runat="server" />
                                                                                                                    <ext:ToolbarSpacer runat="server" />
                                                                                                                    <ext:Button ID="exporTabBusqueda" runat="server" Icon="PageWhiteExcel" Text="Exportar a Excel"
                                                                                                                        OnClick="btExcelBusq_Click" AutoPostBack="true">
                                                                                                                    </ext:Button>
                                                                                                                </Items>
                                                                                                            </ext:Toolbar>
                                                                                                        </Body>
                                                                                                    </ext:Panel>
                                                                                                </ext:Anchor>
                                                                                                <ext:Anchor Horizontal="100%" Vertical="100%">
                                                                                                    <ext:Panel runat="server" AutoScroll="true" Border="false" Header="false">
                                                                                                        <Body>
                                                                                                            <ext:FitLayout runat="server" ID="fitbusq1">
                                                                                                                <ext:GridPanel ID="GdvMovCajasBUs" runat="server" StoreID="Store_GdvMovCajasBUs"
                                                                                                                    Border="false" AutoShow="True" Title="Listado de Movimientos"
                                                                                                                    Shadow="Frame" TrackMouseOver="true" AutoScroll="true" FireSelectOnLoad="false">
                                                                                                                    <ColumnModel runat="server">
                                                                                                                        <Columns>
                                                                                                                            <ext:Column ColumnID="csucur_caja" Header="Sucursal" DataIndex="csucur_caja" />
                                                                                                                            <ext:Column ColumnID="ccajero" Header="Cajero" DataIndex="ccajero" />
                                                                                                                            <ext:Column ColumnID="fcaja" Header="Fecha de Caja" DataIndex="fcaja">
                                                                                                                                <Renderer Fn="Ext.util.Format.dateRenderer('d/m/Y')" />
                                                                                                                            </ext:Column>
                                                                                                                            <ext:Column ColumnID="ccaja" Header="Caja" DataIndex="ccaja" />
                                                                                                                            <ext:Column ColumnID="cpago" Header="Pago" DataIndex="cpago" />
                                                                                                                            <ext:Column ColumnID="crelpago" Header="Remesa" DataIndex="crelpago" />
                                                                                                                            <ext:Column ColumnID="cestcta" Header="Edo. Cta" DataIndex="cestcta" />
                                                                                                                            <ext:Column ColumnID="ncierre" Header="Cierre" DataIndex="ncierre" />
                                                                                                                            <ext:Column ColumnID="fcierre" Header="Fecha Cierre" DataIndex="fcierre">
                                                                                                                                <Renderer Fn="Ext.util.Format.dateRenderer('d/m/Y')" />
                                                                                                                            </ext:Column>
                                                                                                                            <ext:Column ColumnID="imovcaja" Header="Tipo" DataIndex="imovcaja" />
                                                                                                                            <ext:Column ColumnID="cmoneda" Header="Moneda" DataIndex="cmoneda" />
                                                                                                                            <ext:Column ColumnID="fcobro" Header="Fecha Cobro" DataIndex="fcobro">
                                                                                                                                <Renderer Fn="Ext.util.Format.dateRenderer('d/m/Y')" />
                                                                                                                            </ext:Column>
                                                                                                                            <ext:Column ColumnID="mcaja" Header="Monto" DataIndex="mcaja" Align="Right">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:Column>
                                                                                                                            <ext:Column ColumnID="mefe" Header="Efe(ML)" DataIndex="mefe" Align="Right">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:Column>
                                                                                                                            <ext:Column ColumnID="mche" Header="Cheque(ML)" DataIndex="mche" Align="Right">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:Column>
                                                                                                                            <ext:Column ColumnID="mtar" Header="Tarjeta(ML)" DataIndex="mtar" Align="Right">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:Column>
                                                                                                                            <ext:Column ColumnID="motros" Header="Otros(ML)" DataIndex="motros" Align="Right">
                                                                                                                                <Renderer Fn="formatCurrency" />
                                                                                                                            </ext:Column>
                                                                                                                            <ext:Column ColumnID="xrecibido" Header="Recibido" DataIndex="xrecibido" />
                                                                                                                            <ext:Column ColumnID="fcontab" Header="F. Cont" DataIndex="fcontab">
                                                                                                                                <Renderer Fn="Ext.util.Format.dateRenderer('d/m/Y')" />
                                                                                                                            </ext:Column>
                                                                                                                            <ext:Column ColumnID="iestcont" Header="Est. Cont." DataIndex="iestcont" />
                                                                                                                            <ext:Column ColumnID="nlote" Header="Comprobante" DataIndex="nlote" />
                                                                                                                            <ext:Column ColumnID="fanomescont" Header="Año/Mes" DataIndex="fanomescont" />
                                                                                                                        </Columns>
                                                                                                                    </ColumnModel>
                                                                                                                    <SelectionModel>
                                                                                                                        <ext:RowSelectionModel runat="server" SingleSelect="true">
                                                                                                                        </ext:RowSelectionModel>
                                                                                                                    </SelectionModel>
                                                                                                                    <BottomBar>
                                                                                                                        <ext:PagingToolBar runat="server" PageSize="30" StoreID="Store_GdvMovCajasBUs" BeforePageText="Atras"
                                                                                                                            AfterPageText="Siguiente" DisplayMsg="Mostrando {0} - {1} de {2}" EmptyMsg="No hay Registros">
                                                                                                                        </ext:PagingToolBar>
                                                                                                                    </BottomBar>
                                                                                                                    <Plugins>
                                                                                                                        <ext:GridFilters runat="server" FiltersText="Filtros de Busqueda" Local="true">
                                                                                                                            <Filters>
                                                                                                                                <ext:NumericFilter DataIndex="csucur_caja" />
                                                                                                                                <ext:NumericFilter DataIndex="ccajero" />
                                                                                                                                <ext:DateFilter DataIndex="fcaja" AfterText="Despues de" BeforeText="Antes de" OnText="Hoy">
                                                                                                                                </ext:DateFilter>
                                                                                                                                <ext:NumericFilter DataIndex="ccaja" />
                                                                                                                                <ext:NumericFilter DataIndex="cpago" />
                                                                                                                                <ext:NumericFilter DataIndex="crelpago" />
                                                                                                                                <ext:NumericFilter DataIndex="cestcta" />
                                                                                                                                <ext:NumericFilter DataIndex="mcaja" />
                                                                                                                                <ext:NumericFilter DataIndex="mefe" />
                                                                                                                                <ext:NumericFilter DataIndex="mefeext" />
                                                                                                                                <ext:NumericFilter DataIndex="mche" />
                                                                                                                                <ext:NumericFilter DataIndex="mcheext" />
                                                                                                                                <ext:NumericFilter DataIndex="mtar" />
                                                                                                                                <ext:NumericFilter DataIndex="mtarext" />
                                                                                                                                <ext:NumericFilter DataIndex="motros" />
                                                                                                                                <ext:NumericFilter DataIndex="motrosext" />
                                                                                                                            </Filters>
                                                                                                                        </ext:GridFilters>
                                                                                                                    </Plugins>
                                                                                                                </ext:GridPanel>
                                                                                                            </ext:FitLayout>
                                                                                                        </Body>
                                                                                                    </ext:Panel>
                                                                                                </ext:Anchor>
                                                                                            </ext:FormLayout>
                                                                                        </Body>
                                                                                    </ext:Panel>
                                                                                </Center>
                                                                                <West MinWidth="280" MaxWidth="350" Collapsible="true" Split="true">
                                                                                    <ext:Panel ID="Panel1" runat="server" Title="Búsqueda De Movimientos" Width="280"
                                                                                        Border="false">
                                                                                        <Body>
                                                                                            <ext:FormLayout ID="FormLayout2" runat="server">
                                                                                                <ext:Anchor Horizontal="100%">
                                                                                                    <ext:Toolbar runat="server" ID="toolb" Icon="Find">
                                                                                                        <Items>
                                                                                                            <ext:ToolbarButton ID="ToolbarButton1" runat="server" Text="Buscar" Icon="Magnifier">
                                                                                                                <Listeners>
                                                                                                                    <Click Handler="#{Store_GdvMovCajasBUs}.reload({params:{clear:true}} );" />
                                                                                                                </Listeners>
                                                                                                            </ext:ToolbarButton>
                                                                                                        </Items>
                                                                                                    </ext:Toolbar>
                                                                                                </ext:Anchor>
                                                                                                <ext:Anchor Horizontal="100%">
                                                                                                    <ext:Panel ID="Panel2" runat="server" Border="false" Header="false" BodyStyle="padding: 10px 10px 0">
                                                                                                        <Body>
                                                                                                            <ext:FormLayout ID="FormLayout3" runat="server">
                                                                                                                <ext:Anchor Horizontal="100%">
                                                                                                                    <ext:TextField ID="TxtCpago" runat="server" FieldLabel="Pago">
                                                                                                                    </ext:TextField>
                                                                                                                </ext:Anchor>
                                                                                                                <ext:Anchor Horizontal="100%">
                                                                                                                    <ext:TextField ID="Txtntrans" runat="server" FieldLabel="No.Transacción">
                                                                                                                    </ext:TextField>
                                                                                                                </ext:Anchor>
                                                                                                                <ext:Anchor Horizontal="100%">
                                                                                                                    <ext:TextField ID="Txtcestcta" runat="server" FieldLabel="Edo. Cuenta">
                                                                                                                    </ext:TextField>
                                                                                                                </ext:Anchor>
                                                                                                                <ext:Anchor Horizontal="100%">
                                                                                                                    <ext:TextField ID="Txtmcaja" runat="server" FieldLabel="Cantidad">
                                                                                                                    </ext:TextField>
                                                                                                                </ext:Anchor>
                                                                                                                <ext:Anchor Horizontal="100%">
                                                                                                                    <ext:TextField ID="Txtcrelpago" runat="server" FieldLabel="Remesa">
                                                                                                                    </ext:TextField>
                                                                                                                </ext:Anchor>
                                                                                                                <ext:Anchor Horizontal="100%">
                                                                                                                    <ext:TextField ID="Txtnlote" runat="server" FieldLabel="Comprobante">
                                                                                                                    </ext:TextField>
                                                                                                                </ext:Anchor>
                                                                                                                <ext:Anchor Horizontal="100%">
                                                                                                                    <ext:TextField ID="Txtcreferencia" runat="server" FieldLabel="Identificación/RTN">
                                                                                                                    </ext:TextField>
                                                                                                                </ext:Anchor>
                                                                                                                <ext:Anchor Horizontal="100%">
                                                                                                                    <ext:TextField ID="Txtctransaccion" runat="server" FieldLabel="Transacción Contable">
                                                                                                                    </ext:TextField>
                                                                                                                </ext:Anchor>
                                                                                                                <ext:Anchor Horizontal="100%">
                                                                                                                    <ext:DateField ID="Calfechasel" runat="server" Vtype="daterange" FieldLabel="Fecha Inicio">
                                                                                                                        <Listeners>
                                                                                                                            <Render Handler="this.endDateField = '#{Calfechaselfin}'" />
                                                                                                                        </Listeners>
                                                                                                                    </ext:DateField>
                                                                                                                </ext:Anchor>
                                                                                                                <ext:Anchor Horizontal="100%">
                                                                                                                    <ext:DateField ID="Calfechaselfin" runat="server" Vtype="daterange" FieldLabel="Fecha Final">
                                                                                                                        <Listeners>
                                                                                                                            <Render Handler="this.startDateField = '#{Calfechasel}'" />
                                                                                                                        </Listeners>
                                                                                                                    </ext:DateField>
                                                                                                                </ext:Anchor>
                                                                                                                <ext:Anchor Horizontal="100%">
                                                                                                                    <ext:Checkbox ID="ChkFechas" runat="server" FieldLabel="Habilitar el Filtro por Fechas">
                                                                                                                    </ext:Checkbox>
                                                                                                                </ext:Anchor>
                                                                                                            </ext:FormLayout>
                                                                                                        </Body>
                                                                                                    </ext:Panel>
                                                                                                </ext:Anchor>
                                                                                            </ext:FormLayout>
                                                                                        </Body>
                                                                                    </ext:Panel>
                                                                                </West>
                                                                            </ext:BorderLayout>
                                                                            <ext:Hidden ID="HdfScaja" runat="server" />
                                                                            <ext:Hidden ID="HdfMovCaja" runat="server" />
                                                                            <ext:Hidden ID="Hdfccaja" runat="server" />
                                                                            <asp:SqlDataSource ID="SqlMovCajaBus" runat="server"></asp:SqlDataSource>
                                                                            <ext:Hidden ID="HdfMovBusCaja" runat="server" />
                                                                            <ext:Hidden ID="Hdfcajero" runat="server" />
                                                                            <asp:SqlDataSource ID="SqlConsultaIngre" runat="server"></asp:SqlDataSource>
                                                                            <ext:Hidden ID="Hdffcaja" runat="server" />
                                                                            <asp:SqlDataSource ID="SqlPagaPrima" runat="server"></asp:SqlDataSource>
                                                                            <ext:Hidden ID="HdfPagaPrima" runat="server" />
                                                                            <ext:Hidden ID="HdfSubtitu" runat="server" />
                                                                            <asp:SqlDataSource ID="SqlDeptoPrima" runat="server"></asp:SqlDataSource>
                                                                            <ext:Hidden ID="HdfDeptoPrima" runat="server" />
                                                                            <ext:Hidden ID="HdfTitu" runat="server" />
                                                                            <asp:SqlDataSource ID="SqlDeptoBanco" runat="server"></asp:SqlDataSource>
                                                                            <ext:Hidden ID="HdfDeptoBanco" runat="server" />
                                                                            <ext:Hidden ID="HdfCsucur" runat="server" />
                                                                            <ext:Hidden ID="wmes" runat="server" />
                                                                            <ext:Hidden ID="wcompr" runat="server" />
                                                                            <ext:Hidden ID="wresconta" runat="server" />
                                                                            <ext:Hidden ID="HdfCpago" runat="server" />
                                                                            <ext:Hidden ID="Hdfcrelpagolin" runat="server" />
                                                                        </Body>
                                                                    </ext:Tab>
                                                                </Tabs>
                                                            </ext:TabPanel>
                                                        </Center>
                                                        <East MinWidth="280" MaxWidth="350" Collapsible="true" Split="true">
                                                            <ext:Panel runat="server" ID="pnlEast" Title="Datos de la Caja" Width="300" Collapsed="true">
                                                                <Body>
                                                                    <ext:Panel runat="server" Border="false" Header="false" BodyStyle="padding: 10px 10px 0">
                                                                        <Body>
                                                                            <ext:FormLayout runat="server">
                                                                                <ext:Anchor Horizontal="100%">
                                                                                    <ext:TextField ID="txtSucursal" runat="server" ReadOnly="true" FieldLabel="Sucursal" />
                                                                                </ext:Anchor>
                                                                                <ext:Anchor Horizontal="100%">
                                                                                    <ext:TextField ID="txtCajero" runat="server" ReadOnly="true" FieldLabel="Cajero" />
                                                                                </ext:Anchor>
                                                                                <ext:Anchor Horizontal="100%">
                                                                                    <ext:TextField ID="txtfecha" runat="server" ReadOnly="true" FieldLabel="Fecha" />
                                                                                </ext:Anchor>
                                                                                <ext:Anchor Horizontal="100%">
                                                                                    <ext:TextField ID="txtcaja" runat="server" ReadOnly="true" FieldLabel="Caja" />
                                                                                </ext:Anchor>
                                                                                <ext:Anchor Horizontal="100%">
                                                                                    <ext:TextField ID="txtestado" runat="server" ReadOnly="true" FieldLabel="Estado" />
                                                                                </ext:Anchor>
                                                                                <ext:Anchor Horizontal="100%">
                                                                                    <ext:TextField ID="txtmayorizada" runat="server" ReadOnly="true" FieldLabel="Mayorizada" />
                                                                                </ext:Anchor>
                                                                            </ext:FormLayout>
                                                                        </Body>
                                                                    </ext:Panel>
                                                                </Body>
                                                            </ext:Panel>
                                                        </East>
                                                    </ext:BorderLayout>
                                                </Body>
                                            </ext:Panel>
                                        </ext:FitLayout>
                                    </Body>
                                </ext:Panel>
                            </ext:FitLayout>
                        </Body>
                    </ext:Panel>
                </Center>
            </ext:BorderLayout>
        </Body>
    </ext:ViewPort>
    <ext:Window runat="server" ID="winResasi" Title="Resumen de Asientos" Width="1200px"
        Height="360px" ShowOnLoad="false" Modal="true">
        <Body>
            <uc2:wucResasi ID="wucResasi1" runat="server" />
        </Body>
    </ext:Window>
    <ext:Window runat="server" ID="winFconcaja_tot" Title="Resumen de Cajas" Width="1200px"
        Height="360px" ShowOnLoad="false" Modal="true">
        <Body>
            <uc3:wucFconcaja_tot ID="fconcaja_tot1" runat="server" />
        </Body>
    </ext:Window>
    <ext:Window runat="server" ID="winFconcaja_totpri" Title="Resumen de Cajas" Width="1200px"
        Height="360px" ShowOnLoad="false" Modal="true">
        <Body>
            <uc4:wucFconcaja_totpri ID="fconcaja_totpri1" runat="server" />
        </Body>
    </ext:Window>
    <ext:Window runat="server" ID="winFconcaja_totban" Title="Resumen de Cajas" Width="1200px"
        Height="360px" ShowOnLoad="false" Modal="true">
        <Body>
            <uc5:wucFconcaja_totban ID="fconcaja_totban1" runat="server" />
        </Body>
    </ext:Window>
</asp:Content>
