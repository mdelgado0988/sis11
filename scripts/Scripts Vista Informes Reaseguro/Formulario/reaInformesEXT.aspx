<%@ Page Title="" Language="VB" MasterPageFile="~/MasterConExt.master" UICulture="auto"
    AutoEventWireup="false" CodeFile="reaInformesEXT.aspx.vb" Inherits="reaInformesEXT" %>

<%@ Register Assembly="Ext.Net" Namespace="Ext.Net" TagPrefix="ext" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="Server">

    <script type="text/javascript" language="javascript" charset="utf-8">

        function getCalfecha() {
            var df = new Date()

            ctl00_MainContent_DateField_PolVig_fcalculo.setValue(df);
            ctl00_MainContent_Window_Calcular_PolVig.show();
        };

        //Rubén: Validación si hay registros cargados
        function ValidadSel(ctipo) {

            var msg = false;

            switch (ctipo) {
                case 1: // Tab 1
                    if (ctl00_MainContent_DateField_fdesde_bor.getRawValue().toString().length != 10) {
                        msg = true; ctl00_MainContent_DateField_fdesde_bor.markInvalid("Debe indicar la fecha inicial.");
                    }

                    if (ctl00_MainContent_DateField_fhasta_bor.getRawValue().toString().length != 10) {
                        msg = true; ctl00_MainContent_DateField_fhasta_bor.markInvalid("Debe indicar la fecha final.");
                    }

                    if (ctl00_MainContent_ComboBox_cramo_bor.getValue() == undefined | ctl00_MainContent_ComboBox_cramo_bor.getValue().length == 0 | ctl00_MainContent_ComboBox_cramo_bor.getValue() == "") {
                        msg = true; ctl00_MainContent_ComboBox_cramo_bor.markInvalid("Debe seleccionar un ramo.");
                    }

                    if (ctl00_MainContent_ComboBox_ctipo_bor.getValue() == undefined | ctl00_MainContent_ComboBox_ctipo_bor.getValue().length == 0 | ctl00_MainContent_ComboBox_ctipo_bor.getValue() == "") {
                        msg = true; ctl00_MainContent_ComboBox_ctipo_bor.markInvalid("Debe indicar el tipo.");
                    }

                    break;

                case 2: //Tab 2
                case 3:
                    if (ctl00_MainContent_DateField_fhasta_polvig.getRawValue() == undefined | ctl00_MainContent_DateField_fhasta_polvig.getRawValue() == "" | ctl00_MainContent_DateField_fhasta_polvig.getRawValue().toString().length != 10) {
                        msg = true; ctl00_MainContent_DateField_fhasta_polvig.markInvalid("Debe indicar la fecha de cálculo.");
                    }

                    if (ctl00_MainContent_ComboBox_cramo_polvig.getValue() == undefined | ctl00_MainContent_ComboBox_cramo_polvig.getValue().length == 0 | ctl00_MainContent_ComboBox_cramo_polvig.getValue() == "") {
                        msg = true; ctl00_MainContent_ComboBox_cramo_polvig.markInvalid("Debe seleccionar un ramo.");
                    }

                    break;

                case 4: // Tab 3
                    if (ctl00_MainContent_DateField_fhasta_cum.getRawValue() == undefined | ctl00_MainContent_DateField_fhasta_cum.getRawValue() == "" | ctl00_MainContent_DateField_fhasta_cum.getRawValue().toString().length != 10) {
                        msg = true; ctl00_MainContent_DateField_fhasta_cum.markInvalid("Debe indicar la fecha de cálculo.");
                    }

                    if (ctl00_MainContent_ComboBox_cramo_cum.getValue() == undefined | ctl00_MainContent_ComboBox_cramo_cum.getValue().length == 0 | ctl00_MainContent_ComboBox_cramo_cum.getValue() == "") {
                        msg = true; ctl00_MainContent_ComboBox_cramo_cum.markInvalid("Debe seleccionar un ramo.");
                    }
                    break;

                case 5: // Tab 4
                    if (ctl00_MainContent_DateField_fhasta_perfil.getRawValue() == undefined | ctl00_MainContent_DateField_fhasta_perfil.getRawValue() == "" | ctl00_MainContent_DateField_fhasta_perfil.getRawValue().toString().length != 10) {
                        msg = true; ctl00_MainContent_DateField_fhasta_perfil.markInvalid("Debe indicar la fecha de cálculo.");
                    }

                    if (ctl00_MainContent_ComboBox_cramo_perfil.getValue() == undefined | ctl00_MainContent_ComboBox_cramo_perfil.getValue().length == 0 | ctl00_MainContent_ComboBox_cramo_perfil.getValue() == "") {
                        msg = true; ctl00_MainContent_ComboBox_cramo_perfil.markInvalid("Debe seleccionar un ramo.");
                    }

                    break;
            }

            if (msg == true) {
                return false;
            }

            return true;
        };

        //Rubén: Validdación antes de exportar los datos
        function ExportReport(ctipo) {
            try {
                Ext.net.DirectEvent.timeout = 4000000;
                if (ValidadSel(ctipo) == true) {
                    ctl00_MainContent_prinlcumulos.body.mask('Exportando...', 'x-mask-loading');

                    var oxf = Ext.net.DirectMethods.ExportRegistro(
                        {
                            success: function (result) {
                                if (result == true) {
                                    Ext.net.DirectMethods.IntegExport(ctipo, { isUpload: true }, { timeout: 4000000 });
                                }
                            }
                        }
                    );

                } else {
                    ctl00_MainContent_prinlcumulos.body.unmask();
                    return false;
                };
            } catch (e) {
                ctl00_MainContent_prinlcumulos.body.unmask();
            }
        };

        var intValue = 0;
        //Rubén: Verificación del status para export
        function onSubmitSuccesIng(btn) {
            try {
                intValue = window.setTimeout('onSubmitSuccesIng()', 5000);
                var oxf = Ext.net.DirectMethods.RefreshTimeIng(
                    {
                        success: function (result) {
                            if (result == false) {
                                endDispara();
                                ctl00_MainContent_prinlcumulos.body.unmask();
                            }
                        }
                    }
                );
            } catch (e) {
                ctl00_MainContent_prinlcumulos.body.unmask();
            }
        };

        function endDispara() {
            intValue = window.clearTimeout(intValue);
        };

        //Ruben: Limpia la grilla para cargar nuevos valores
        function cleargv(gv) {
            var cm = gv.getColumnModel();
            gv.getStore().removeAll();

            if (cm.columns != undefined) {
                for (var i = 0; i < cm.columns.length; i++) {
                    cm.setHidden(i, true);
                }
            }

            ctl00_MainContent_lbltimeRepVig.setText('00:00:00');
            ctl00_MainContent_Panel_PolVig_DTIn.setTitle('Detalle - ' + ctl00_MainContent_ComboBox_ctiporamo_polvig.getText());
        };

        //Ruben: Habilita las opciones de los cumulos dependiento de su ramo
        function HabilitaOptCum(opt) {
            if (opt == 7) {
                ctl00_MainContent_Radio_Cum_Provincias.setDisabled(true);
                ctl00_MainContent_Radio_Cum_ZonaCresta.setDisabled(true);
                ctl00_MainContent_Radio_Cum_Planes.setDisabled(false);
                ctl00_MainContent_Radio_Cum_Barriadas.setDisabled(true);
                ctl00_MainContent_Radio_Cum_Edificio.setDisabled(true);
                ctl00_MainContent_Radio_Cum_Tarifas.setDisabled(true);
                ctl00_MainContent_Radio_Cum_Clientes.setDisabled(false);
                ctl00_MainContent_Radio_Cum_GrupoEco.setDisabled(false);
                ctl00_MainContent_Radio_Cum_TipoFianza.setDisabled(false);
                ctl00_MainContent_Radio_Cum_TipoPoliza.setDisabled(false);
                ctl00_MainContent_Radio_Cum_TipoPoliza.setValue(true);
            } else {
                ctl00_MainContent_Radio_Cum_Provincias.setDisabled(false);
                ctl00_MainContent_Radio_Cum_ZonaCresta.setDisabled(false);
                ctl00_MainContent_Radio_Cum_Planes.setDisabled(false);
                ctl00_MainContent_Radio_Cum_Barriadas.setDisabled(false);
                ctl00_MainContent_Radio_Cum_Edificio.setDisabled(false);
                ctl00_MainContent_Radio_Cum_Tarifas.setDisabled(false);
                ctl00_MainContent_Radio_Cum_Clientes.setDisabled(false);
                ctl00_MainContent_Radio_Cum_GrupoEco.setDisabled(false);
                ctl00_MainContent_Radio_Cum_TipoFianza.setDisabled(true);
                ctl00_MainContent_Radio_Cum_TipoPoliza.setDisabled(true);
                ctl00_MainContent_Radio_Cum_Provincias.setValue(true);
            }

        };

        //Rubén:
        function GetPerfilesMant(opt) {

            ctl00_MainContent_Hidden_tiporango_perfil.setValue(opt);
            ctl00_MainContent_lblpermant.setText('00:00:00');

            ctl00_MainContent_ComboBox_ctiporamo_perfilmant.clearValue();
            ctl00_MainContent_ComboBox_cramo_perfilmant.clearValue();
            ctl00_MainContent_GvPerfil_Rangos.getStore().removeAll();

            switch (opt) {
                case 1:
                    ctl00_MainContent_pnlpmant1N.show();
                    ctl00_MainContent_pnlpmant1N.expand();
                    break;

                case 2:
                    ctl00_MainContent_pnlpmant1N.hide();
                    ctl00_MainContent_pnlpmant1N.collapse();
                    ctl00_MainContent_GvPerfil_Rangos.load();
                    break;
            }

            ctl00_MainContent_Window_Rangos_Perfil.show();

        };

        //Ruben: Agrega o Actualiza un perfil
        function AddUpRangoP(tp) {
            var opt = ctl00_MainContent_Hidden_tiporango_perfil.getValue();

            if (opt == 1 & (ctl00_MainContent_ComboBox_cramo_perfilmant.getValue() == undefined | ctl00_MainContent_ComboBox_cramo_perfilmant.getValue().length == 0 | ctl00_MainContent_ComboBox_cramo_perfilmant.getValue() == "")) {
                ctl00_MainContent_ComboBox_cramo_perfilmant.markInvalid("Debe seleccionar el ramo");
                return false
            }

            var rec = Ext.encode(ctl00_MainContent_GvPerfil_Rangos.getRowsValues({ dirtyRowsOnly: true }));
            var xms = tp == "A" ? "¿Esta seguro de agregar un nuevo rango?" : "¿Esta seguro de actualizar el rango seleccionado?";

            Ext.Msg.confirm('Confirmación', xms, function (btn) {
                if (btn == 'yes') {
                    Ext.net.DirectEvent.timeout = 6000000;
                    ctl00_MainContent_Window_Rangos_Perfil.body.mask("Procesando...", "x-mask-loading");

                    try {
                        var result = Ext.net.DirectMethods.AddUpRango(opt, rec, tp,
                            {
                                success:
                                    function (result) {
                                        if (result == true) {
                                            Notifica('Rango procesado correctamente.');
                                            ctl00_MainContent_GvPerfil_Rangos.store.commitChanges();
                                            ctl00_MainContent_GvPerfil_Rangos.load();
                                        }

                                        ctl00_MainContent_Window_Rangos_Perfil.body.unmask();
                                    }, failure: function (result) { ctl00_MainContent_Window_Rangos_Perfil.body.unmask(); }
                            });
                    } catch (e) {
                        ctl00_MainContent_Window_Rangos_Perfil.body.unmask();
                        Ext.Msg.show({ title: 'Err', msg: e.message, buttons: Ext.Msg.OK, icon: Ext.MessageBox.ERROR });
                    }

                }
            });
        };

        //Rubén: Elimina un rango en la configuracion del perfil
        function EventCmd(cmd, record, rowIndex) {

            if (cmd != "del") { return false; }

            Ext.Msg.confirm('Confirmación', '¿Esta seguro de eliminar la configuración del rango seleccionado?', function (btn) {
                if (btn == 'yes') {
                    Ext.net.DirectEvent.timeout = 6000000;
                    ctl00_MainContent_Window_Rangos_Perfil.body.mask("Procesando...", "x-mask-loading");
                    var opt = ctl00_MainContent_Hidden_tiporango_perfil.getValue();
                    var rec = record.data.id;
                    try {
                        var result = Ext.net.DirectMethods.DelRango(opt, rec,
                            {
                                success:
                                    function (result) {
                                        if (result == true) {
                                            Notifica('Rango eliminado correctamente.');
                                            ctl00_MainContent_GvPerfil_Rangos.load();
                                        }

                                        ctl00_MainContent_Window_Rangos_Perfil.body.unmask();
                                    }, failure: function (result) { ctl00_MainContent_Window_Rangos_Perfil.body.unmask(); }
                            });
                    } catch (e) {
                        ctl00_MainContent_Window_Rangos_Perfil.body.unmask();
                        Ext.Msg.show({ title: 'Err', msg: e.message, buttons: Ext.Msg.OK, icon: Ext.MessageBox.ERROR });
                    }

                }
            });
        };

    </script>

</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="MainContent" runat="Server">
    <ext:Viewport ID="Viewport1" Layout="BorderLayout" runat="server">
        <Items>
            <ext:TabPanel ID="prinlcumulos" runat="server" Region="Center" Border="False" ActiveTabIndex="0" DeferredRender="true">
                <Items>
                    <ext:Panel runat="server" Title="Borderó de Reaseguro" Border="false" Layout="BorderLayout" Icon="Report">
                        <TopBar>
                            <ext:Toolbar runat="server">
                                <Items>
                                    <ext:ToolbarSeparator runat="server" ID="ToolbarSeparator1" />
                                    <ext:Button ID="btnregresarborde" runat="server" Icon="ControlRewind" Text="Regresar a el Menú Principal">
                                        <Listeners>
                                            <Click Handler="Mascara(#{prinlcumulos},true);RecMenuAdmon();" />
                                        </Listeners>
                                    </ext:Button>
                                </Items>
                            </ext:Toolbar>
                        </TopBar>
                        <Items>
                            <ext:Panel runat="server" Region="North" Height="220px" Border="false" Layout="FitLayout" Padding="8" CollapseMode="Mini" Split="true" AnimCollapse="true">
                                <Items>
                                    <ext:FieldSet ID="FieldSet2" runat="server" Title="Filtros - Borderó" Icon="PageFind" Padding="5" ButtonAlign="Left" LabelAlign="Right"
                                        Layout="ColumnLayout">
                                        <Items>
                                            <ext:FormPanel runat="server" ID="FormPanel1" Padding="5" Border="false" LabelAlign="Right"
                                                LabelWidth="90" DefaultAnchor="0" Layout="FormLayout" ColumnWidth=".4">
                                                <Items>
                                                    <ext:DateField ID="DateField_fdesde_bor" Vtype="daterange" runat="server" FieldLabel="Fecha Inicial"
                                                        Format="dd/MM/yyyy" MaskRe="[0123456789/]" LabelStyle="font-size:11px;" Cls="cmbextBack">
                                                        <Listeners>
                                                            <Render Handler="this.endDateField = '#{DateField_fhasta_bor}'" />
                                                            <Invalid Handler="#{btnbuscarbordero}.disable();" />
                                                            <Valid Handler="#{btnbuscarbordero}.enable();" />
                                                        </Listeners>
                                                    </ext:DateField>
                                                    <ext:DateField ID="DateField_fhasta_bor" Vtype="daterange" runat="server" FieldLabel="Fecha Final"
                                                        Format="dd/MM/yyyy" MaskRe="[0123456789/]" LabelStyle="font-size:11px;" Cls="cmbextBack">
                                                        <Listeners>
                                                            <Render Handler="this.startDateField = '#{DateField_fdesde_bor}'" />
                                                            <Invalid Handler="#{btnbuscarbordero}.disable();" />
                                                            <Valid Handler="#{btnbuscarbordero}.enable();" />
                                                        </Listeners>
                                                    </ext:DateField>
                                                    <ext:MultiCombo ID="ComboBox_cramo_bor" runat="server" ValueField="ccodigo" DisplayField="xdescripcion_l"
                                                        TypeAhead="true" Mode="Local" TriggerAction="All" EmptyText="" ValueNotFoundText="" Cls="cmbextBack"
                                                        ForceSelection="true" SelectOnFocus="true" FieldLabel="Ramo" AnchorHorizontal="100%"
                                                        LabelStyle="font-size:11px;" Editable="false">
                                                        <Store>
                                                            <ext:Store ID="Store_cramo_bor" runat="server">
                                                                <Reader>
                                                                    <ext:JsonReader>
                                                                        <Fields>
                                                                            <ext:RecordField Name="ccodigo" />
                                                                            <ext:RecordField Name="xdescripcion_l" />
                                                                        </Fields>
                                                                    </ext:JsonReader>
                                                                </Reader>
                                                            </ext:Store>
                                                        </Store>
                                                        <Triggers>
                                                            <ext:FieldTrigger Tag="Seleccionar_Todos" Icon="SimplePlus" Qtip="Seleccionar todos" />
                                                            <ext:FieldTrigger Tag="DeSeleccionar_Todos" Icon="SimpleMinus" Qtip="Deseleccionar todos" />
                                                        </Triggers>
                                                        <Listeners>
                                                            <TriggerClick Handler="
                                                    if (tag === 'Seleccionar_Todos') {
                                                        this.selectAll();
                                                        this.setRawValue('Todos');
                                                    }
                                                    if (tag === 'DeSeleccionar_Todos') {
                                                        this.clearValue();
                                                        this.setRawValue('');
                                                    }
                                                    " />
                                                        </Listeners>
                                                    </ext:MultiCombo>
                                                    <ext:ComboBox ID="ComboBox_ctipo_bor" runat="server" ValueField="ccodigo" DisplayField="xdescripcion_l"
                                                        TypeAhead="true" Mode="Local" TriggerAction="All" EmptyText="" ValueNotFoundText="" Cls="cmbextBack"
                                                        ForceSelection="true" SelectOnFocus="true" FieldLabel="Reporte" AnchorHorizontal="100%"
                                                        LabelStyle="font-size:11px;" Editable="false">
                                                        <Store>
                                                            <ext:Store ID="Store_ctipo_bor" runat="server" AutoLoad="true">
                                                                <Reader>
                                                                    <ext:JsonReader>
                                                                        <Fields>
                                                                            <ext:RecordField Name="ccodigo" />
                                                                            <ext:RecordField Name="xdescripcion_l" />
                                                                        </Fields>
                                                                    </ext:JsonReader>
                                                                </Reader>
                                                            </ext:Store>
                                                        </Store>
                                                    </ext:ComboBox>
                                                </Items>
                                            </ext:FormPanel>
                                            <ext:FormPanel runat="server" ID="FormPanel2" Padding="5" Border="false" LabelAlign="Right"
                                                LabelWidth="90" DefaultAnchor="0" Layout="FormLayout" ColumnWidth=".6">
                                                <Items>
                                                </Items>
                                            </ext:FormPanel>
                                        </Items>
                                        <Buttons>
                                            <ext:Button runat="server" Icon="Zoom" Text="Buscar" ID="btnbuscarbordero">
                                                <Listeners>
                                                    <Click Handler="Ext.net.DirectEvent.timeout = 4000000; #{GridPanel_Bordero}.load();" />
                                                </Listeners>
                                            </ext:Button>
                                        </Buttons>
                                    </ext:FieldSet>
                                </Items>
                            </ext:Panel>
                            <ext:GridPanel ID="GridPanel_Bordero" runat="server" Region="Center" SelectionMemory="Disabled" TrackMouseOver="true"
                                StripeRows="true" Border="false">
                                <TopBar>
                                    <ext:Toolbar runat="server">
                                        <Items>
                                            <ext:Button runat="server" Text="Exportar" Icon="PageExcel" ID="btnExportT1" Disabled="true">
                                                <Listeners>
                                                    <Click Handler="ExportReport(1);" />
                                                </Listeners>
                                            </ext:Button>

                                            <ext:ToolbarFill ID="ToolbarFill1" runat="server" />
                                            <ext:Label runat="server" Icon="TimeGreen" Text="0:00:00" ID="lbltimeRep" />
                                        </Items>
                                    </ext:Toolbar>
                                </TopBar>
                                <ColumnModel ID="ColumnModel23" runat="server">
                                    <Columns>
                                    </Columns>
                                </ColumnModel>
                                <View>
                                    <ext:GridView ID="View1" runat="server" EmptyText="No existen movimientos disponibles" />
                                </View>
                                <SelectionModel>
                                    <ext:RowSelectionModel ID="RowSelectionModel2" runat="server" SingleSelect="true" />
                                </SelectionModel>
                                <Store>
                                    <ext:Store runat="server" ID="Store_Bordero" OnRefreshData="Refrescar_Bordero_Primas" RemoteSort="true" AutoLoad="false" WarningOnDirty="false">
                                        <Reader>
                                            <ext:JsonReader>
                                            </ext:JsonReader>
                                        </Reader>
                                        <Proxy>
                                            <ext:PageProxy />
                                        </Proxy>
                                        <BaseParams>
                                            <ext:Parameter Name="start" Value="0" Mode="Raw" />
                                            <ext:Parameter Name="limit" Value="50" Mode="Raw" />
                                        </BaseParams>
                                        <Listeners>
                                            <BeforeLoad Handler="Ext.apply(options.params, this.baseParams, options.params);" />
                                        </Listeners>
                                    </ext:Store>
                                </Store>


                                <LoadMask ShowMask="true" Msg="Procesando..." />

                                <BottomBar>
                                    <ext:PagingToolbar runat="server" PageSize="50" HideRefresh="true" EmptyMsg="No hay Registros">
                                    </ext:PagingToolbar>
                                </BottomBar>
                            </ext:GridPanel>
                        </Items>
                    </ext:Panel>

                    <ext:Panel runat="server" Title="Pólizas Vigentes" Border="false" Icon="Shield" Layout="BorderLayout">
                        <Items>
                            <ext:Panel runat="server" Region="North" Height="225px" Border="false" Layout="FitLayout" Padding="8" CollapseMode="Mini" Split="true" AnimCollapse="true">
                                <TopBar>
                                    <ext:Toolbar runat="server" ID="tollbar1">
                                        <Items>
                                            <ext:ToolbarSeparator runat="server" ID="tolsepar1" />
                                            <ext:Button runat="server" Icon="Calculator" Text="Calcular" ID="btncalcularT2">
                                                <Listeners>
                                                    <Click Handler="getCalfecha();" />
                                                </Listeners>
                                            </ext:Button>
                                            <ext:ToolbarSeparator runat="server" ID="ToolbarSeparator3" />
                                            <ext:ToolbarFill runat="server" ID="ToolbarFill3" />
                                            <ext:ToolbarSeparator runat="server" ID="ToolbarSeparator8" />
                                            <ext:Button ID="Button1" runat="server" Icon="ControlRewind" Text="Regresar a el Menú Principal">
                                                <Listeners>
                                                    <Click Handler="Mascara(#{prinlcumulos},true); RecMenuAdmon();" />
                                                </Listeners>
                                            </ext:Button>
                                        </Items>
                                    </ext:Toolbar>
                                </TopBar>
                                <Items>
                                    <ext:FieldSet ID="FieldSet1" runat="server" Title="Filtros - Póliza Vigentes" Icon="PageFind" Padding="5" ButtonAlign="Left" LabelAlign="Right"
                                        Layout="ColumnLayout">
                                        <Items>
                                            <ext:FormPanel runat="server" ID="FormPanel4" Padding="5" Border="false" LabelAlign="Right"
                                                LabelWidth="90" DefaultAnchor="0" Layout="FormLayout" ColumnWidth=".4">
                                                <Items>
                                                    <ext:DateField ID="DateField_fhasta_polvig" runat="server" FieldLabel="Fecha de Cálculo" Cls="cmbextBack"
                                                        Format="dd/MM/yyyy" LabelStyle="font-size:11px;" ReadOnly="true">
                                                    </ext:DateField>
                                                    <ext:ComboBox ID="ComboBox_ctiporamo_polvig" runat="server" ValueField="ccodigo" Cls="cmbextBack"
                                                        DisplayField="xdescripcion_l" TypeAhead="true" Mode="Local" TriggerAction="All"
                                                        EmptyText="" ValueNotFoundText="" ForceSelection="true" SelectOnFocus="true"
                                                        FieldLabel="Tipo Ramo" LabelStyle="font-size:11px;" Editable="false">
                                                        <Store>
                                                            <ext:Store ID="Store_ctiporamo_polvig" runat="server">
                                                                <Reader>
                                                                    <ext:JsonReader>
                                                                        <Fields>
                                                                            <ext:RecordField Name="ccodigo" />
                                                                            <ext:RecordField Name="xdescripcion_l" />
                                                                        </Fields>
                                                                    </ext:JsonReader>
                                                                </Reader>
                                                            </ext:Store>
                                                        </Store>
                                                        <Listeners>
                                                            <Select Handler="#{ComboBox_cramo_polvig}.clearValue(); #{Store_cramo_polvig}.reload(); cleargv(#{gv_PolVig_DTIn});  " />
                                                        </Listeners>
                                                    </ext:ComboBox>
                                                    <ext:MultiCombo ID="ComboBox_cramo_polvig" runat="server" ValueField="ccodigo" DisplayField="xdescripcion_l"
                                                        TypeAhead="true" Mode="Local" TriggerAction="All" EmptyText="" ValueNotFoundText="" Cls="cmbextBack"
                                                        ForceSelection="true" SelectOnFocus="true" FieldLabel="Ramo" AnchorHorizontal="100%"
                                                        LabelStyle="font-size:11px;" Editable="false">
                                                        <Store>
                                                            <ext:Store ID="Store_cramo_polvig" runat="server" AutoLoad="false" OnRefreshData="Stcramo_polvig_Refresh">
                                                                <DirectEventConfig>
                                                                    <EventMask ShowMask="false" />
                                                                </DirectEventConfig>
                                                                <Reader>
                                                                    <ext:JsonReader>
                                                                        <Fields>
                                                                            <ext:RecordField Name="ccodigo" />
                                                                            <ext:RecordField Name="xdescripcion_l" />
                                                                        </Fields>
                                                                    </ext:JsonReader>
                                                                </Reader>
                                                            </ext:Store>
                                                        </Store>
                                                        <Triggers>
                                                            <ext:FieldTrigger Tag="Seleccionar_Todos" Icon="SimplePlus" Qtip="Seleccionar todos" />
                                                            <ext:FieldTrigger Tag="DeSeleccionar_Todos" Icon="SimpleMinus" Qtip="Deseleccionar todos" />
                                                        </Triggers>
                                                        <Listeners>
                                                            <TriggerClick Handler="
                                                                if (tag === 'Seleccionar_Todos') {
                                                                    this.selectAll();
                                                                    this.setRawValue('Todos');
                                                                }
                                                                if (tag === 'DeSeleccionar_Todos') {
                                                                    this.clearValue();
                                                                    this.setRawValue('');
                                                                }
                                                                " />
                                                        </Listeners>
                                                    </ext:MultiCombo>
                                                </Items>
                                            </ext:FormPanel>

                                            <ext:FormPanel runat="server" ID="FormPanel3" Padding="5" Border="false" LabelAlign="Right"
                                                LabelWidth="90" DefaultAnchor="0" Layout="FormLayout" ColumnWidth=".6">
                                                <Items>
                                                </Items>
                                            </ext:FormPanel>
                                        </Items>
                                        <Buttons>
                                            <ext:Button runat="server" Icon="Zoom" Text="Buscar" ID="btnpolvig">
                                                <Listeners>
                                                    <Click Handler="Ext.net.DirectEvent.timeout = 4000000; #{gv_PolVig_DTIn}.load();" />
                                                </Listeners>
                                            </ext:Button>
                                        </Buttons>
                                    </ext:FieldSet>
                                </Items>
                            </ext:Panel>
                            <ext:TabPanel ID="TabPanel_PolVig" runat="server" Border="false" Region="Center">
                                <Items>
                                    <ext:Panel ID="Panel_PolVig_DTIn" Title="Detalle" runat="server" Layout="BorderLayout" Border="false">
                                        <Items>
                                            <ext:GridPanel ID="gv_PolVig_DTIn" runat="server" SelectionMemory="Disabled" Region="Center"
                                                TrackMouseOver="true" StripeRows="true" Border="false">
                                                <TopBar>
                                                    <ext:Toolbar runat="server">
                                                        <Items>
                                                            <ext:Button runat="server" Text="Exportar detalle" Icon="PageExcel" ID="btnexporttPolvig">
                                                                <Listeners>
                                                                    <Click Handler="ExportReport(2);" />
                                                                </Listeners>
                                                            </ext:Button>
                                                            <ext:Button runat="server" Text="Exportar detalle con coberturas" Icon="PageExcel" ID="btnexportt2">
                                                                <Listeners>
                                                                    <Click Handler="ExportReport(3);" />
                                                                </Listeners>
                                                            </ext:Button>
                                                            <ext:ToolbarFill ID="ToolbarFill2" runat="server" />
                                                            <ext:Label runat="server" Icon="TimeGreen" Text="0:00:00" ID="lbltimeRepVig" />
                                                        </Items>
                                                    </ext:Toolbar>
                                                </TopBar>
                                                <ColumnModel ID="ColumnModel1" runat="server">
                                                    <Columns>
                                                    </Columns>
                                                </ColumnModel>
                                                <View>
                                                    <ext:GridView ID="GridView2" runat="server" EmptyText="No existen movimientos disponibles" />
                                                </View>
                                                <SelectionModel>
                                                    <ext:RowSelectionModel ID="RowSelectionModel1" runat="server" SingleSelect="true" />
                                                </SelectionModel>
                                                <Store>
                                                    <ext:Store runat="server" ID="stpolvig" OnRefreshData="PolVigen_Refrescar" RemoteSort="true" AutoLoad="false">
                                                        <Reader>
                                                            <ext:JsonReader>
                                                            </ext:JsonReader>
                                                        </Reader>
                                                        <Proxy>
                                                            <ext:PageProxy />
                                                        </Proxy>
                                                        <BaseParams>
                                                            <ext:Parameter Name="start" Value="0" Mode="Raw" />
                                                            <ext:Parameter Name="limit" Value="50" Mode="Raw" />
                                                        </BaseParams>
                                                        <Listeners>
                                                            <BeforeLoad Handler="Ext.apply(options.params, this.baseParams, options.params);" />
                                                        </Listeners>
                                                    </ext:Store>
                                                </Store>

                                                <LoadMask ShowMask="true" Msg="Procesando..." />

                                                <BottomBar>
                                                    <ext:PagingToolbar runat="server" PageSize="50" HideRefresh="true" EmptyMsg="No hay Registros">
                                                    </ext:PagingToolbar>
                                                </BottomBar>
                                            </ext:GridPanel>
                                        </Items>
                                    </ext:Panel>
                                </Items>
                            </ext:TabPanel>
                        </Items>
                    </ext:Panel>

                    <ext:Panel runat="server" Title="Cúmulos" Border="false" Layout="BorderLayout" Icon="TableColumn">
                        <Items>
                            <ext:Panel runat="server" Region="North" Height="225px" Border="false" Layout="FitLayout" Padding="8" CollapseMode="Mini" Split="true" AnimCollapse="true">
                                <TopBar>
                                    <ext:Toolbar runat="server" ID="Toolbar1">
                                        <Items>
                                            <ext:ToolbarSeparator runat="server" ID="ToolbarSeparator2" />
                                            <ext:Button runat="server" Icon="Calculator" Text="Calcular" ID="Button2">
                                                <Listeners>
                                                    <Click Handler="getCalfecha();" />
                                                </Listeners>
                                            </ext:Button>
                                            <ext:ToolbarSeparator runat="server" ID="ToolbarSeparator4" />
                                            <ext:ToolbarFill runat="server" ID="ToolbarFill4" />
                                            <ext:ToolbarSeparator runat="server" ID="ToolbarSeparator5" />
                                            <ext:Button ID="Button3" runat="server" Icon="ControlRewind" Text="Regresar a el Menú Principal">
                                                <Listeners>
                                                    <Click Handler="Mascara(#{prinlcumulos},true); RecMenuAdmon();" />
                                                </Listeners>
                                            </ext:Button>
                                        </Items>
                                    </ext:Toolbar>
                                </TopBar>
                                <Items>
                                    <ext:FieldSet ID="FieldSet4" runat="server" Title="Filtros - Cúmulos" Icon="PageFind" Padding="5" ButtonAlign="Left" LabelAlign="Right"
                                        Layout="ColumnLayout">
                                        <Items>
                                            <ext:FormPanel runat="server" ID="FormPanel5" Padding="5" Border="false" LabelAlign="Right"
                                                LabelWidth="90" DefaultAnchor="0" Layout="FormLayout" ColumnWidth=".4">
                                                <Items>
                                                    <ext:CompositeField runat="server" FieldLabel="Fecha de Cálculo" LabelStyle="font-size:11px;">
                                                        <Items>
                                                            <ext:DateField ID="DateField_fhasta_cum" runat="server" AnchorHorizontal="15%" Format="dd/MM/yyyy"
                                                                LabelStyle="font-size:11px;" ReadOnly="true" Cls="cmbextBack" />
                                                            <ext:DisplayField runat="server" Text="Mantener agrupación por ramo" />
                                                            <ext:Checkbox ID="Checkbox_AgrupaRamo_cum" runat="server" Checked="true">
                                                                <Listeners>
                                                                    <Check Handler="#{btncumulo}.fireEvent('click');" />
                                                                </Listeners>
                                                            </ext:Checkbox>
                                                        </Items>
                                                    </ext:CompositeField>
                                                    <ext:ComboBox ID="ComboBox_ctiporamo_cum" runat="server" ValueField="ccodigo" DisplayField="xdescripcion_l"
                                                        TypeAhead="true" Mode="Local" TriggerAction="All" EmptyText="" ValueNotFoundText="" Cls="cmbextBack"
                                                        ForceSelection="true" SelectOnFocus="true" FieldLabel="Tipo Ramo"
                                                        LabelStyle="font-size:11px;" Editable="false">
                                                        <Store>
                                                            <ext:Store ID="Store_ctiporamo_cum" runat="server">
                                                                <Reader>
                                                                    <ext:JsonReader>
                                                                        <Fields>
                                                                            <ext:RecordField Name="ccodigo" />
                                                                            <ext:RecordField Name="xdescripcion_l" />
                                                                        </Fields>
                                                                    </ext:JsonReader>
                                                                </Reader>
                                                            </ext:Store>
                                                        </Store>
                                                        <Listeners>
                                                            <Select Handler="#{ComboBox_cramo_cum}.clearValue(); #{Store_cramo_cum}.reload(); HabilitaOptCum(this.getValue()); " />
                                                        </Listeners>
                                                    </ext:ComboBox>
                                                    <ext:MultiCombo ID="ComboBox_cramo_cum" runat="server" ValueField="ccodigo" DisplayField="xdescripcion_l"
                                                        TypeAhead="true" Mode="Local" TriggerAction="All" EmptyText="" ValueNotFoundText=""
                                                        ForceSelection="true" SelectOnFocus="true" FieldLabel="Ramo" Cls="cmbextBack"
                                                        LabelStyle="font-size:11px;" Editable="false">
                                                        <Store>
                                                            <ext:Store ID="Store_cramo_cum" runat="server" OnRefreshData="Stcramo_cum_Refresh">
                                                                <Reader>
                                                                    <ext:JsonReader>
                                                                        <Fields>
                                                                            <ext:RecordField Name="ccodigo" />
                                                                            <ext:RecordField Name="xdescripcion_l" />
                                                                        </Fields>
                                                                    </ext:JsonReader>
                                                                </Reader>
                                                            </ext:Store>
                                                        </Store>
                                                        <Triggers>
                                                            <ext:FieldTrigger Tag="Seleccionar_Todos" Icon="SimplePlus" Qtip="Seleccionar todos" />
                                                            <ext:FieldTrigger Tag="DeSeleccionar_Todos" Icon="SimpleMinus" Qtip="Deseleccionar todos" />
                                                        </Triggers>
                                                        <Listeners>
                                                            <TriggerClick Handler="
                                                                if (tag === 'Seleccionar_Todos') {
                                                                    this.selectAll();
                                                                    this.setRawValue('Todos');
                                                                }
                                                                if (tag === 'DeSeleccionar_Todos') {
                                                                    this.clearValue();
                                                                    this.setRawValue('');
                                                                }
                                                                " />
                                                        </Listeners>
                                                    </ext:MultiCombo>

                                                </Items>
                                            </ext:FormPanel>
                                            <ext:FormPanel runat="server" ID="FormPanel6" Padding="5" Border="false" LabelAlign="Right"
                                                LabelWidth="90" DefaultAnchor="0" Layout="FormLayout" ColumnWidth=".4">
                                                <Items>
                                                    <ext:RadioGroup ID="RadioGroup_Cum" runat="server" ColumnsNumber="3" FieldLabel="Cúmulo por" LabelStyle="font-size:11px;"
                                                        StyleSpec="font-size:11px;" Disabled="true">
                                                        <Items>
                                                            <ext:Radio ID="Radio_Cum_Provincias" runat="server" InputValue="1" BoxLabel="Provincia" Checked="true" BoxLabelStyle="font-size:11px;" />
                                                            <ext:Radio ID="Radio_Cum_ZonaCresta" runat="server" InputValue="2" BoxLabel="Zona Cresta" BoxLabelStyle="font-size:11px;" />
                                                            <ext:Radio ID="Radio_Cum_Planes" runat="server" InputValue="3" BoxLabel="Plan" BoxLabelStyle="font-size:11px;" />
                                                            <ext:Radio ID="Radio_Cum_Barriadas" runat="server" InputValue="4" BoxLabel="Barriada" BoxLabelStyle="font-size:11px;" />
                                                            <ext:Radio ID="Radio_Cum_Edificio" runat="server" InputValue="5" BoxLabel="Edificio" BoxLabelStyle="font-size:11px;" />
                                                            <ext:Radio ID="Radio_Cum_Tarifas" runat="server" InputValue="6" BoxLabel="Tarifa (Incendio)" BoxLabelStyle="font-size:11px;" />
                                                            <ext:Radio ID="Radio_Cum_Clientes" runat="server" InputValue="7" BoxLabel="Cliente" BoxLabelStyle="font-size:11px;" />
                                                            <ext:Radio ID="Radio_Cum_GrupoEco" runat="server" InputValue="8" BoxLabel="Grupo Económico" BoxLabelStyle="font-size:11px;" />
                                                            <ext:Radio ID="Radio_Cum_TipoFianza" runat="server" InputValue="9" BoxLabel="Tipo Fianza" BoxLabelStyle="font-size:11px;" />
                                                            <ext:Radio ID="Radio_Cum_TipoPoliza" runat="server" InputValue="10" BoxLabel="Póliza" BoxLabelStyle="font-size:11px;" />
                                                        </Items>
                                                        <Listeners>
                                                            <Change Handler="#{btncumulo}.fireEvent('click');" />
                                                        </Listeners>
                                                    </ext:RadioGroup>
                                                </Items>
                                            </ext:FormPanel>
                                            <ext:FormPanel runat="server" ID="FormPanel7" Padding="5" Border="false" LabelAlign="Right"
                                                LabelWidth="90" DefaultAnchor="0" Layout="FormLayout" ColumnWidth=".2">
                                                <Items></Items>
                                            </ext:FormPanel>
                                        </Items>
                                        <Buttons>
                                            <ext:Button runat="server" Icon="Zoom" Text="Buscar" ID="btncumulo">
                                                <Listeners>
                                                    <Click Handler="Ext.net.DirectEvent.timeout = 4000000; #{Gvcumulos}.load();" />
                                                </Listeners>
                                            </ext:Button>
                                        </Buttons>
                                    </ext:FieldSet>
                                </Items>
                            </ext:Panel>
                            <ext:GridPanel ID="Gvcumulos" runat="server" SelectionMemory="Disabled" Region="Center"
                                TrackMouseOver="true" StripeRows="true" Border="false">
                                <TopBar>
                                    <ext:Toolbar runat="server">
                                        <Items>
                                            <ext:Button runat="server" Text="Exportar" Icon="PageExcel" ID="Button5">
                                                <Listeners>
                                                    <Click Handler="ExportReport(4);" />
                                                </Listeners>
                                            </ext:Button>
                                            <ext:ToolbarFill ID="ToolbarFill5" runat="server" />
                                            <ext:Label runat="server" Icon="TimeGreen" Text="0:00:00" ID="lblcumulo" />
                                        </Items>
                                    </ext:Toolbar>
                                </TopBar>
                                <ColumnModel ID="ColumnModel2" runat="server">
                                    <Columns>
                                        <ext:Column ColumnID="Ramo" Align="Left" Header="Ramo" DataIndex="Ramo" Hidden="true" />
                                        <ext:Column ColumnID="Descripción" Width="240" Align="Left" Header="Descripción" DataIndex="Descripción" MenuDisabled="true" />
                                        <ext:Column ColumnID="cnpoliza" Hidden="true" Align="Left" Header="Póliza" DataIndex="cnpoliza" MenuDisabled="true" />
                                        <ext:Column ColumnID="Asegurado" Hidden="true" Width="200" Align="Left" Header="Asegurado" MenuDisabled="true" DataIndex="Asegurado" />
                                        <ext:Column ColumnID="GrupoEconomico" Hidden="true" Width="400" Header="Grupo Economico" MenuDisabled="true" DataIndex="GrupoEconomico" />
                                        <ext:Column ColumnID="Beneficiario" Hidden="true" Width="200" Align="Left" Header="Beneficiario" MenuDisabled="true" DataIndex="Beneficiario" />
                                        <ext:Column ColumnID="cserie" Hidden="true" Width="55" Align="Center" Header="Serie" MenuDisabled="true" DataIndex="cserie" />
                                        <ext:Column ColumnID="Fdesde" Hidden="true" Width="75" Align="Center" Header="Fdesde" MenuDisabled="true" DataIndex="Fdesde" />
                                        <ext:Column ColumnID="Fhasta" Hidden="true" Width="75" Align="Center" Header="Fhasta" MenuDisabled="true" DataIndex="Fhasta" />
                                        <ext:Column ColumnID="Estado_FI" Hidden="true" Width="50" Align="Center" Header="Est.FI" MenuDisabled="true" DataIndex="Estado_FI" />
                                        <ext:GroupingSummaryColumn ColumnID="Cantidad" Align="Right" Width="65" Header="Cantidad" DataIndex="Cantidad"
                                            SummaryType="Sum">
                                            <Renderer Fn="Ext.util.Format.numberRenderer('0,000')" />
                                        </ext:GroupingSummaryColumn>
                                        <ext:GroupingSummaryColumn ColumnID="Suma Asegurada 100%" Align="Right" Header="Suma Asegurada 100%"
                                            DataIndex="Suma Asegurada 100%" Width="145" SummaryType="Sum">
                                            <Renderer Fn="Ext.util.Format.numberRenderer('0,000.00')" />
                                        </ext:GroupingSummaryColumn>
                                        <ext:GroupingSummaryColumn ColumnID="Suma Retenida" Align="Right" Header="Suma Retenida"
                                            DataIndex="Suma Retenida" Width="120" SummaryType="Sum">
                                            <Renderer Fn="Ext.util.Format.numberRenderer('0,000.00')" />
                                        </ext:GroupingSummaryColumn>
                                        <ext:GroupingSummaryColumn ColumnID="Suma Cedida" Align="Right" Header="Suma Cedida"
                                            DataIndex="Suma Cedida" Width="120" SummaryType="Sum">
                                            <Renderer Fn="Ext.util.Format.numberRenderer('0,000.00')" />
                                        </ext:GroupingSummaryColumn>
                                        <ext:GroupingSummaryColumn ColumnID="Suma Facultativa" Align="Right" Header="Suma Facultativa"
                                            DataIndex="Suma Facultativa" Width="120" SummaryType="Sum">
                                            <Renderer Fn="Ext.util.Format.numberRenderer('0,000.00')" />
                                        </ext:GroupingSummaryColumn>
                                        <ext:GroupingSummaryColumn ColumnID="Prima Suscrita 100%" Align="Right" Header="Prima Suscrita 100%"
                                            DataIndex="Prima Suscrita 100%" Width="145" SummaryType="Sum">
                                            <Renderer Fn="Ext.util.Format.numberRenderer('0,000.00')" />
                                        </ext:GroupingSummaryColumn>
                                        <ext:GroupingSummaryColumn ColumnID="Prima Retenida" Align="Right" Header="Prima Retenida"
                                            DataIndex="Prima Retenida" Width="120" SummaryType="Sum">
                                            <Renderer Fn="Ext.util.Format.numberRenderer('0,000.00')" />
                                        </ext:GroupingSummaryColumn>
                                        <ext:GroupingSummaryColumn ColumnID="Prima Cedida" Align="Right" Header="Prima Cedida"
                                            DataIndex="Prima Cedida" Width="120" SummaryType="Sum">
                                            <Renderer Fn="Ext.util.Format.numberRenderer('0,000.00')" />
                                        </ext:GroupingSummaryColumn>
                                        <ext:GroupingSummaryColumn ColumnID="PrimaCat" Align="Right" Header="Prima Cat"
                                            DataIndex="PrimaCat" Width="120" SummaryType="Sum">
                                            <Renderer Fn="Ext.util.Format.numberRenderer('0,000.00')" />
                                        </ext:GroupingSummaryColumn>
                                        <ext:GroupingSummaryColumn ColumnID="Prima Facultativa" Align="Right" Header="Prima Facultativa"
                                            DataIndex="Prima Facultativa" Width="120" SummaryType="Sum">
                                            <Renderer Fn="Ext.util.Format.numberRenderer('0,000.00')" />
                                        </ext:GroupingSummaryColumn>
                                        <ext:Column ColumnID="NombProy" Hidden="true" Width="900" Header="Proyecto" MenuDisabled="true" DataIndex="NombProy" />
                                        <ext:Column ColumnID="NContrato" Hidden="true" Width="400" Header="Contrato" MenuDisabled="true" DataIndex="NContrato" />
                                        <ext:DateColumn ColumnID="finicoberturaprin" Hidden="true" Width="250" Align="Center" Format="dd/m/yyyy" Header="F.Cober Principal Desde" MenuDisabled="true" DataIndex="fcoberprin">
                                        </ext:DateColumn>
                                        <ext:DateColumn ColumnID="ffincobertura" Hidden="true" Width="250" Align="Center" Header="F.Cober Principal Hasta" Format="dd/m/yyyy" MenuDisabled="true" DataIndex="ffincober">
                                        </ext:DateColumn>
                                        <ext:Column ColumnID="Referido" Hidden="true" Width="500" Header="Referido por" MenuDisabled="true" DataIndex="Referido" />
                                    </Columns>
                                </ColumnModel>
                                <View>
                                    <ext:GroupingView runat="server" ForceFit="false" EmptyText="No existen movimientos disponibles"
                                        ShowGroupName="false" ShowGroupsText="false" HideGroupedColumn="true" />
                                </View>
                                <Plugins>
                                    <ext:GroupingSummary runat="server" />
                                </Plugins>
                                <SelectionModel>
                                    <ext:RowSelectionModel ID="RowSelectionModel3" runat="server" SingleSelect="true" />
                                </SelectionModel>
                                <Store>
                                    <ext:Store runat="server" ID="Stcumulos" OnRefreshData="Stcumulos_Refrescar" GroupField="Ramo" RemoteSort="true" AutoLoad="false">
                                        <Reader>
                                            <ext:JsonReader>
                                                <Fields>
                                                    <ext:RecordField Name="Ramo" />
                                                    <ext:RecordField Name="Descripción" />
                                                    <ext:RecordField Name="Cantidad" />
                                                    <ext:RecordField Name="Suma Asegurada 100%" />
                                                    <ext:RecordField Name="Suma Retenida" />
                                                    <ext:RecordField Name="Suma Cedida" />
                                                    <ext:RecordField Name="Suma Facultativa" />
                                                    <ext:RecordField Name="Prima Suscrita 100%" />
                                                    <ext:RecordField Name="Prima Retenida" />
                                                    <ext:RecordField Name="Prima Cedida" />
                                                    <ext:RecordField Name="PrimaCat" />
                                                    <ext:RecordField Name="Prima Facultativa" />
                                                    <ext:RecordField Name="cnpoliza" />
                                                    <ext:RecordField Name="cserie" />
                                                    <ext:RecordField Name="Asegurado" />
                                                    <ext:RecordField Name="Estado_FI" />
                                                    <ext:RecordField Name="Fdesde" />
                                                    <ext:RecordField Name="Fhasta" />
                                                    <ext:RecordField Name="Beneficiario" />
                                                    <ext:RecordField Name="NombProy" />
                                                    <ext:RecordField Name="NContrato" />
                                                    <ext:RecordField Name="fcoberprin" />
                                                    <ext:RecordField Name="ffincober" />
                                                    <ext:RecordField Name="GrupoEconomico" />
                                                    <ext:RecordField Name="Referido" />
                                                </Fields>
                                            </ext:JsonReader>
                                        </Reader>
                                        <Proxy>
                                            <ext:PageProxy />
                                        </Proxy>
                                        <BaseParams>
                                            <ext:Parameter Name="start" Value="0" Mode="Raw" />
                                            <ext:Parameter Name="limit" Value="100" Mode="Raw" />
                                        </BaseParams>
                                        <Listeners>
                                            <BeforeLoad Handler="Ext.apply(options.params, this.baseParams, options.params);" />
                                        </Listeners>
                                    </ext:Store>
                                </Store>
                                <LoadMask ShowMask="true" Msg="Procesando..." />
                                <BottomBar>
                                    <ext:PagingToolbar runat="server" PageSize="100" HideRefresh="true" EmptyMsg="No hay Registros">
                                    </ext:PagingToolbar>
                                </BottomBar>
                            </ext:GridPanel>
                        </Items>
                    </ext:Panel>

                    <ext:Panel runat="server" Title="Perfil de Cartera" Border="false" Layout="BorderLayout" Icon="StyleEdit">
                        <Items>
                            <ext:Panel runat="server" Region="North" Height="225px" Border="false" Layout="FitLayout" Padding="8" CollapseMode="Mini" Split="true" AnimCollapse="true">
                                <TopBar>
                                    <ext:Toolbar runat="server">
                                        <Items>
                                            <ext:ToolbarSeparator runat="server" />
                                            <ext:Button runat="server" Icon="Table" Text="Rangos Automáticos">
                                                <Listeners>
                                                    <Click Handler="GetPerfilesMant(1);" />
                                                </Listeners>
                                            </ext:Button>
                                            <ext:ToolbarSeparator runat="server" ID="ToolbarSeparator6" />
                                            <ext:Button runat="server" Icon="Table" Text="Rangos Dinámicos">
                                                <Listeners>
                                                    <Click Handler="GetPerfilesMant(2);" />
                                                </Listeners>
                                            </ext:Button>
                                            <ext:ToolbarSeparator runat="server" ID="ToolbarSeparator7" />
                                            <ext:Button runat="server" Icon="Calculator" Text="Calcular">
                                                <Listeners>
                                                    <Click Handler="getCalfecha();" />
                                                </Listeners>
                                            </ext:Button>
                                            <ext:ToolbarSeparator runat="server" ID="ToolbarSeparator9" />
                                            <ext:ToolbarFill runat="server" ID="tolafill1" />
                                            <ext:ToolbarSeparator runat="server" ID="ToolbarSeparator10" />
                                            <ext:Button ID="Button4" runat="server" Icon="ControlRewind" Text="Regresar a el Menú Principal">
                                                <Listeners>
                                                    <Click Handler="Mascara(#{prinlcumulos},true); RecMenuAdmon();" />
                                                </Listeners>
                                            </ext:Button>
                                        </Items>
                                    </ext:Toolbar>
                                </TopBar>
                                <Items>
                                    <ext:FieldSet ID="FieldSet5" runat="server" Title="Filtros - Cúmulos" Icon="PageFind" Padding="5" ButtonAlign="Left" LabelAlign="Right"
                                        Layout="ColumnLayout">
                                        <Items>
                                            <ext:FormPanel runat="server" ID="FormPanel8" Padding="5" Border="false" LabelAlign="Right"
                                                LabelWidth="90" DefaultAnchor="0" Layout="FormLayout" ColumnWidth=".4">
                                                <Items>
                                                    <ext:CompositeField runat="server" FieldLabel="Fecha de Cálculo" LabelStyle="font-size:11px;">
                                                        <Items>
                                                            <ext:DateField ID="DateField_fhasta_perfil" runat="server" AnchorHorizontal="15%"
                                                                Format="dd/MM/yyyy" LabelStyle="font-size:11px;" ReadOnly="true" Cls="cmbextBack" />
                                                            <ext:DisplayField runat="server" Text="Mantener agrupación por ramo" />
                                                            <ext:Checkbox ID="Checkbox_AgrupaRamo_perfil" runat="server" Checked="true">
                                                                <Listeners>
                                                                    <Check Handler="#{btnbperfils}.fireEvent('click');" />
                                                                </Listeners>
                                                            </ext:Checkbox>
                                                        </Items>
                                                    </ext:CompositeField>
                                                    <ext:ComboBox ID="ComboBox_ctiporamo_perfil" runat="server" ValueField="ccodigo" Cls="cmbextBack"
                                                        DisplayField="xdescripcion_l" TypeAhead="true" Mode="Local" TriggerAction="All"
                                                        EmptyText="" ValueNotFoundText="" ForceSelection="true" SelectOnFocus="true"
                                                        FieldLabel="Tipo Ramo" AnchorHorizontal="100%" LabelStyle="font-size:11px;" Editable="false">
                                                        <Store>
                                                            <ext:Store ID="Store_ctiporamo_perfil" runat="server">
                                                                <Reader>
                                                                    <ext:JsonReader>
                                                                        <Fields>
                                                                            <ext:RecordField Name="ccodigo" />
                                                                            <ext:RecordField Name="xdescripcion_l" />
                                                                        </Fields>
                                                                    </ext:JsonReader>
                                                                </Reader>
                                                            </ext:Store>
                                                        </Store>
                                                        <Listeners>
                                                            <Select Handler="#{ComboBox_cramo_perfil}.clearValue(); #{Stcramo_perfil}.reload(); " />
                                                        </Listeners>
                                                    </ext:ComboBox>
                                                    <ext:MultiCombo ID="ComboBox_cramo_perfil" runat="server" ValueField="ccodigo" DisplayField="xdescripcion_l"
                                                        TypeAhead="true" Mode="Local" TriggerAction="All" EmptyText="" ValueNotFoundText="" Cls="cmbextBack"
                                                        ForceSelection="true" SelectOnFocus="true" FieldLabel="Ramo" AnchorHorizontal="100%"
                                                        LabelStyle="font-size:11px;" Editable="false">
                                                        <Store>
                                                            <ext:Store ID="Stcramo_perfil" runat="server" OnRefreshData="Stcramo_perfil_Refresh">
                                                                <Reader>
                                                                    <ext:JsonReader>
                                                                        <Fields>
                                                                            <ext:RecordField Name="ccodigo" />
                                                                            <ext:RecordField Name="xdescripcion_l" />
                                                                        </Fields>
                                                                    </ext:JsonReader>
                                                                </Reader>
                                                            </ext:Store>
                                                        </Store>
                                                        <Triggers>
                                                            <ext:FieldTrigger Tag="Seleccionar_Todos" Icon="SimplePlus" Qtip="Seleccionar todos" />
                                                            <ext:FieldTrigger Tag="DeSeleccionar_Todos" Icon="SimpleMinus" Qtip="Deseleccionar todos" />
                                                        </Triggers>
                                                        <Listeners>
                                                            <TriggerClick Handler="
                                                                if (tag === 'Seleccionar_Todos') {
                                                                    this.selectAll();
                                                                    this.setRawValue('Todos');
                                                                }
                                                                if (tag === 'DeSeleccionar_Todos') {
                                                                    this.clearValue();
                                                                    this.setRawValue('');
                                                                }
                                                                " />
                                                        </Listeners>
                                                    </ext:MultiCombo>
                                                    <ext:ComboBox ID="ComboBox_tiporango_perfil" runat="server" TypeAhead="true" Mode="Local"
                                                        TriggerAction="All" EmptyText="" ValueNotFoundText="" ForceSelection="true" SelectOnFocus="true"
                                                        FieldLabel="Usar Rango" AnchorHorizontal="100%" LabelStyle="font-size:11px;" Cls="cmbextBack"
                                                        Editable="false">
                                                        <SelectedItem Value="1" />
                                                        <Items>
                                                            <ext:ListItem Text="Automático" Value="1" />
                                                            <ext:ListItem Text="Dinámico" Value="2" />
                                                        </Items>
                                                        <Listeners>
                                                            <Select Handler="#{btnbperfils}.fireEvent('click');" />
                                                        </Listeners>
                                                    </ext:ComboBox>
                                                </Items>
                                            </ext:FormPanel>
                                            <ext:FormPanel runat="server" ID="FormPanel9" Padding="5" Border="false" LabelAlign="Right"
                                                LabelWidth="90" DefaultAnchor="0" Layout="FormLayout" ColumnWidth=".6">
                                                <Items>
                                                </Items>
                                            </ext:FormPanel>
                                        </Items>
                                        <Buttons>
                                            <ext:Button runat="server" Icon="Zoom" Text="Buscar" ID="btnbperfils">
                                                <Listeners>
                                                    <Click Handler="Ext.net.DirectEvent.timeout = 4000000; #{GvPerfil}.load();" />
                                                </Listeners>
                                            </ext:Button>
                                        </Buttons>
                                    </ext:FieldSet>
                                </Items>
                            </ext:Panel>

                            <ext:GridPanel ID="GvPerfil" runat="server" SelectionMemory="Disabled" TrackMouseOver="true"
                                StripeRows="true" Border="false" Region="Center">
                                <TopBar>
                                    <ext:Toolbar ID="Toolbarpef" runat="server">
                                        <Items>
                                            <ext:Button runat="server" Text="Exportar" Icon="PageExcel" ID="btnexporttcart1">
                                                <Listeners>
                                                    <Click Handler="ExportReport(5);" />
                                                </Listeners>
                                            </ext:Button>
                                            <ext:ToolbarFill ID="ToolbarFill6" runat="server" />
                                            <ext:Label runat="server" Icon="TimeGreen" Text="0:00:00" ID="lblperfiles" />
                                        </Items>
                                    </ext:Toolbar>
                                </TopBar>
                                <Store>
                                    <ext:Store runat="server" ID="StPerfil" GroupField="Ramo" OnRefreshData="StPerfil_Refrescar" RemoteSort="true" AutoLoad="false">
                                        <Reader>
                                            <ext:JsonReader>
                                                <Fields>
                                                    <ext:RecordField Name="Ramo" />
                                                    <ext:RecordField Name="Límite Inferior" />
                                                    <ext:RecordField Name="Límite Superior" />
                                                    <ext:RecordField Name="Cantidad" />
                                                    <ext:RecordField Name="Suma Asegurada 100%" />
                                                    <ext:RecordField Name="Suma Retenida" />
                                                    <ext:RecordField Name="Suma Cedida" />
                                                    <ext:RecordField Name="Suma Facultativa" />
                                                    <ext:RecordField Name="Prima Suscrita 100%" />
                                                    <ext:RecordField Name="Prima Retenida" />
                                                    <ext:RecordField Name="Prima Cedida" />
                                                    <ext:RecordField Name="Prima Facultativa" />
                                                    <ext:RecordField Name="Suma Asegurada Promedio" />
                                                    <ext:RecordField Name="Prima Promedio" />
                                                    <ext:RecordField Name="Tasa Promedio" />
                                                    <ext:RecordField Name="PrimaCat" />
                                                </Fields>
                                            </ext:JsonReader>
                                        </Reader>
                                        <Proxy>
                                            <ext:PageProxy />
                                        </Proxy>
                                        <BaseParams>
                                            <ext:Parameter Name="start" Value="0" Mode="Raw" />
                                            <ext:Parameter Name="limit" Value="200" Mode="Raw" />
                                        </BaseParams>
                                        <Listeners>
                                            <BeforeLoad Handler="Ext.apply(options.params, this.baseParams, options.params);" />
                                        </Listeners>
                                    </ext:Store>
                                </Store>
                                <ColumnModel runat="server">
                                    <Columns>
                                        <ext:Column ColumnID="Ramo" Align="Left" Header="Ramo" DataIndex="Ramo" Hidden="true" />
                                        <ext:Column ColumnID="Límite Inferior" Align="Right" Header="Límite Inferior" DataIndex="Límite Inferior"
                                            Width="150" />
                                        <ext:Column ColumnID="Límite Superior" Align="Right" Header="Límite Superior" DataIndex="Límite Superior"
                                            Width="150" />
                                        <ext:GroupingSummaryColumn ColumnID="Cantidad" Align="Right" Header="Cantidad" DataIndex="Cantidad"
                                            SummaryType="Sum">
                                            <Renderer Fn="Ext.util.Format.numberRenderer('0,000')" />
                                        </ext:GroupingSummaryColumn>
                                        <ext:GroupingSummaryColumn ColumnID="Suma Asegurada 100%" Align="Right" Header="Suma Asegurada 100%"
                                            DataIndex="Suma Asegurada 100%" Width="120" SummaryType="Sum">
                                            <Renderer Fn="Ext.util.Format.numberRenderer('0,000.00')" />
                                        </ext:GroupingSummaryColumn>
                                        <ext:GroupingSummaryColumn ColumnID="Suma Retenida" Align="Right" Header="Suma Retenida"
                                            DataIndex="Suma Retenida" Width="120" SummaryType="Sum">
                                            <Renderer Fn="Ext.util.Format.numberRenderer('0,000.00')" />
                                        </ext:GroupingSummaryColumn>
                                        <ext:GroupingSummaryColumn ColumnID="Suma Cedida" Align="Right" Header="Suma Cedida"
                                            DataIndex="Suma Cedida" Width="120" SummaryType="Sum">
                                            <Renderer Fn="Ext.util.Format.numberRenderer('0,000.00')" />
                                        </ext:GroupingSummaryColumn>
                                        <ext:GroupingSummaryColumn ColumnID="Suma Facultativa" Align="Right" Header="Suma Facultativa"
                                            DataIndex="Suma Facultativa" Width="120" SummaryType="Sum">
                                            <Renderer Fn="Ext.util.Format.numberRenderer('0,000.00')" />
                                        </ext:GroupingSummaryColumn>
                                        <ext:GroupingSummaryColumn ColumnID="Prima Suscrita 100%" Align="Right" Header="Prima Suscrita 100%"
                                            DataIndex="Prima Suscrita 100%" Width="120" SummaryType="Sum">
                                            <Renderer Fn="Ext.util.Format.numberRenderer('0,000.00')" />
                                        </ext:GroupingSummaryColumn>
                                        <ext:GroupingSummaryColumn ColumnID="Prima Retenida" Align="Right" Header="Prima Retenida"
                                            DataIndex="Prima Retenida" Width="120" SummaryType="Sum">
                                            <Renderer Fn="Ext.util.Format.numberRenderer('0,000.00')" />
                                        </ext:GroupingSummaryColumn>
                                        <ext:GroupingSummaryColumn ColumnID="Prima Cedida" Align="Right" Header="Prima Cedida"
                                            DataIndex="Prima Cedida" Width="120" SummaryType="Sum">
                                            <Renderer Fn="Ext.util.Format.numberRenderer('0,000.00')" />
                                        </ext:GroupingSummaryColumn>
                                        <ext:GroupingSummaryColumn ColumnID="Prima Cat" Align="Right" Header="Prima Cat"
                                            DataIndex="Prima at" Width="120" SummaryType="Sum">
                                            <Renderer Fn="Ext.util.Format.numberRenderer('0,000.00')" />
                                        </ext:GroupingSummaryColumn>
                                        <ext:GroupingSummaryColumn ColumnID="Prima Facultativa" Align="Right" Header="Prima Facultativa"
                                            DataIndex="Prima Facultativa" Width="120" SummaryType="Sum">
                                            <Renderer Fn="Ext.util.Format.numberRenderer('0,000.00')" />
                                        </ext:GroupingSummaryColumn>
                                        <ext:GroupingSummaryColumn ColumnID="Suma Asegurada Promedio" Align="Right" Header="Suma Asegurada Promedio"
                                            DataIndex="Suma Asegurada Promedio" Width="120" SummaryType="Sum">
                                            <Renderer Fn="Ext.util.Format.numberRenderer('0,000.00')" />
                                        </ext:GroupingSummaryColumn>
                                        <ext:GroupingSummaryColumn ColumnID="Prima Promedio" Align="Right" Header="Prima Promedio"
                                            DataIndex="Prima Promedio" Width="120" SummaryType="Sum">
                                            <Renderer Fn="Ext.util.Format.numberRenderer('0,000.00')" />
                                        </ext:GroupingSummaryColumn>
                                        <ext:GroupingSummaryColumn ColumnID="Tasa Promedio" Align="Right" Header="Tasa Promedio"
                                            DataIndex="Tasa Promedio" Width="120" SummaryType="Sum">
                                            <Renderer Fn="Ext.util.Format.numberRenderer('0,000.00')" />
                                        </ext:GroupingSummaryColumn>
                                    </Columns>
                                </ColumnModel>
                                <View>
                                    <ext:GroupingView runat="server" ForceFit="false" EmptyText="No existen movimientos disponibles"
                                        ShowGroupName="false" ShowGroupsText="false" HideGroupedColumn="true" />
                                </View>
                                <Plugins>
                                    <ext:GroupingSummary runat="server" />
                                </Plugins>
                                <LoadMask ShowMask="true" Msg="Procesando..." />
                                <SelectionModel>
                                    <ext:RowSelectionModel runat="server" />
                                </SelectionModel>
                                <BottomBar>
                                    <ext:PagingToolbar runat="server" PageSize="200" HideRefresh="true">
                                    </ext:PagingToolbar>
                                </BottomBar>
                            </ext:GridPanel>
                        </Items>
                    </ext:Panel>
                </Items>
            </ext:TabPanel>
        </Items>
    </ext:Viewport>

    <ext:Window runat="server" ID="Window_Calcular_PolVig" Title="Cálculo de Pólizas Vigentes" Maximizable="false"
        Width="350" Height="150" ShowOnLoad="false" Modal="true" Hidden="true" Layout="FormLayout" Resizable="false" Draggable="false"
        Padding="5" LabelWidth="100" BodyStyle="padding: 6px; background-color: #fff;">
        <Items>
            <ext:FieldSet ID="FieldSet3" runat="server" Layout="FitLayout" DefaultAnchor="95%"
                Title="Fecha de Cálculo" Icon="PageWhiteOffice" Padding="8">
                <Items>
                    <ext:DateField ID="DateField_PolVig_fcalculo" runat="server" FieldLabel="Fecha de Cálculo" Cls="cmbextBack"
                        AnchorHorizontal="100%" Format="dd/MM/yyyy" MaskRe="[0123456789/]" ShowToday="true">
                    </ext:DateField>
                </Items>
                <Buttons>
                    <ext:Button runat="server" Icon="Calculator" Text="Calcular">
                        <DirectEvents>
                            <Click OnEvent="Calcular_PolVig" Timeout="360000">
                                <EventMask ShowMask="true" Msg="Espere un momento por favor..." />
                            </Click>
                        </DirectEvents>
                    </ext:Button>
                    <ext:Button runat="server" Icon="DoorOut" Text="Salir">
                        <Listeners>
                            <Click Handler="#{Window_Calcular_PolVig}.hide();" />
                        </Listeners>
                    </ext:Button>
                </Buttons>
            </ext:FieldSet>

        </Items>
    </ext:Window>

    <ext:Window runat="server" ID="Window_Rangos_Perfil" Title="Rangos para perfil de cartera" Resizable="false" Maximizable="false"
        Width="695" Height="500" ShowOnLoad="false" Modal="false" Hidden="true" Layout="BorderLayout"
        Padding="3" LabelWidth="150">
        <Items>
            <ext:Panel ID="pnlpmant1N" runat="server" Region="North" Height="110px" Border="false" Layout="FitLayout" Padding="8" CollapseMode="Mini" Split="true" AnimCollapse="true">
                <Items>
                    <ext:FieldSet ID="FieldSet6" runat="server" Title="Configuraciones Actuales - Rangos" Icon="PageFind" Padding="5" ButtonAlign="Left" LabelAlign="Right"
                        Layout="FitLayout">
                        <Items>
                            <ext:FormPanel runat="server" ID="FormPanel10" Padding="5" Border="false" LabelAlign="Right"
                                LabelWidth="90" DefaultAnchor="0" Layout="FormLayout">
                                <Items>
                                    <ext:Hidden ID="Hidden_tiporango_perfil" runat="server" Text="1" />
                                    <ext:ComboBox ID="ComboBox_ctiporamo_perfilmant" runat="server" ValueField="ccodigo" Cls="cmbextBack"
                                        DisplayField="xdescripcion_l" TypeAhead="true" Mode="Local" TriggerAction="All"
                                        EmptyText="" ValueNotFoundText="" ForceSelection="true" SelectOnFocus="true"
                                        FieldLabel="Tipo Ramo" AnchorHorizontal="100%" LabelStyle="font-size:11px;" Editable="false">
                                        <Store>
                                            <ext:Store ID="Store_ctiporamo_perfilmant" runat="server">
                                                <Reader>
                                                    <ext:JsonReader>
                                                        <Fields>
                                                            <ext:RecordField Name="ccodigo" />
                                                            <ext:RecordField Name="xdescripcion_l" />
                                                        </Fields>
                                                    </ext:JsonReader>
                                                </Reader>
                                            </ext:Store>
                                        </Store>
                                        <Listeners>
                                            <Select Handler="#{ComboBox_cramo_perfilmant}.clearValue(); #{Stcramo_perfilmant}.reload(); " />
                                        </Listeners>
                                    </ext:ComboBox>
                                    <ext:ComboBox ID="ComboBox_cramo_perfilmant" runat="server" ValueField="ccodigo" Cls="cmbextBack"
                                        DisplayField="xdescripcion_l" TypeAhead="true" Mode="Local" TriggerAction="All"
                                        EmptyText="" ValueNotFoundText="" ForceSelection="true" SelectOnFocus="true"
                                        FieldLabel="Ramo" AnchorHorizontal="100%" LabelStyle="font-size:11px;" Editable="false">
                                        <Store>
                                            <ext:Store ID="Stcramo_perfilmant" runat="server" OnRefreshData="Stcramo_perfilmant_Refresh">
                                                <DirectEventConfig>
                                                    <EventMask ShowMask="false" />
                                                </DirectEventConfig>
                                                <Reader>
                                                    <ext:JsonReader>
                                                        <Fields>
                                                            <ext:RecordField Name="ccodigo" />
                                                            <ext:RecordField Name="xdescripcion_l" />
                                                        </Fields>
                                                    </ext:JsonReader>
                                                </Reader>
                                            </ext:Store>
                                        </Store>
                                        <Listeners>
                                            <Select Handler="#{GvPerfil_Rangos}.load();" />
                                        </Listeners>
                                    </ext:ComboBox>
                                </Items>
                            </ext:FormPanel>
                        </Items>
                    </ext:FieldSet>
                </Items>
            </ext:Panel>
            <ext:GridPanel ID="GvPerfil_Rangos" runat="server" SelectionMemory="Disabled" Region="Center"
                TrackMouseOver="true" StripeRows="true" Border="false" AutoScroll="false">
                <TopBar>
                    <ext:Toolbar runat="server">
                        <Items>
                            <ext:ToolbarSeparator runat="server" ID="ToolbarSeparator12" />
                            <ext:Button runat="server" Text="Agregar" Icon="Add">
                                <Listeners>
                                    <Click Handler="AddUpRangoP('A');" />
                                </Listeners>
                            </ext:Button>
                            <ext:ToolbarSeparator runat="server" ID="ToolbarSeparator11" />
                            <ext:Button runat="server" Text="Guardar" Icon="Disk">
                                <Listeners>
                                    <Click Handler="AddUpRangoP('G');" />
                                </Listeners>
                            </ext:Button>
                            <ext:ToolbarSeparator runat="server" ID="ToolbarSeparator13" />
                            <ext:Button runat="server" Icon="DoorOut" Text="Salir">
                                <Listeners>
                                    <Click Handler="#{Window_Rangos_Perfil}.hide();" />
                                </Listeners>
                            </ext:Button>
                            <ext:ToolbarFill ID="ToolbarFill7" runat="server" />
                            <ext:Label runat="server" Icon="TimeGreen" Text="0:00:00" ID="lblpermant" />
                        </Items>
                    </ext:Toolbar>
                </TopBar>
                <Store>
                    <ext:Store runat="server" ID="Store_Perfil_Rangos" OnRefreshData="Store_Perfil_Rangos_Refresh" AutoLoad="false">
                        <Reader>
                            <ext:JsonReader>
                                <Fields>
                                    <ext:RecordField Name="ctipo" />
                                    <ext:RecordField Name="cramo" />
                                    <ext:RecordField Name="id" />
                                    <ext:RecordField Name="mlim_min" />
                                    <ext:RecordField Name="mlim_max" />
                                    <ext:RecordField Name="mlim_min_imp" />
                                    <ext:RecordField Name="mlim_max_imp" />
                                </Fields>
                            </ext:JsonReader>
                        </Reader>
                        <Proxy>
                            <ext:PageProxy />
                        </Proxy>
                    </ext:Store>
                </Store>
                <ColumnModel runat="server">
                    <Columns>
                        <ext:RowNumbererColumn />
                        <ext:CommandColumn Header="" Width="30" Hideable="true" Align="Center" ButtonAlign="Center">
                            <Commands>
                                <ext:GridCommand Icon="Delete" CommandName="del">
                                    <ToolTip Text="Eliminar rango" />
                                </ext:GridCommand>
                            </Commands>
                        </ext:CommandColumn>
                        <ext:Column ColumnID="mlim_min" Align="Right" Header="Límite Inferior" DataIndex="mlim_min"
                            Width="150">
                            <Editor>
                                <ext:TextField runat="server" StyleSpec="text-align:right;">
                                </ext:TextField>
                            </Editor>
                        </ext:Column>
                        <ext:Column ColumnID="mlim_min" Align="Right" Header="Límite Superior" DataIndex="mlim_max"
                            Width="150">
                            <Editor>
                                <ext:TextField runat="server" StyleSpec="text-align:right;">
                                </ext:TextField>
                            </Editor>
                        </ext:Column>
                        <ext:Column ColumnID="mlim_min_imp" Align="Right" Header="Etiqueta Límite Inferior"
                            DataIndex="mlim_min_imp" Width="150">
                            <Editor>
                                <ext:TextField runat="server" StyleSpec="text-align:right;">
                                </ext:TextField>
                            </Editor>
                        </ext:Column>
                        <ext:Column ColumnID="mlim_max_imp" Align="Right" Header="Etiqueta Límite Superior"
                            DataIndex="mlim_max_imp" Width="150">
                            <Editor>
                                <ext:TextField runat="server" StyleSpec="text-align:right;">
                                </ext:TextField>
                            </Editor>
                        </ext:Column>
                    </Columns>
                </ColumnModel>
                <Listeners>
                    <Command Handler="EventCmd(command,record,rowIndex);" />
                </Listeners>
                <Plugins>
                    <ext:EditableGrid runat="server" ID="EditableGrid1" />
                </Plugins>
                <LoadMask ShowMask="true" Msg="Procesando..." />
                <SelectionModel>
                    <ext:RowSelectionModel runat="server" />
                </SelectionModel>
                <BottomBar>
                    <ext:PagingToolbar runat="server" HideRefresh="true">
                    </ext:PagingToolbar>
                </BottomBar>
            </ext:GridPanel>
        </Items>
    </ext:Window>

</asp:Content>
