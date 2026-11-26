Imports System.Collections.Generic
Imports Ext.Net
Imports System.Data

Partial Class reaInformesEXT
    Inherits System.Web.UI.Page

    Private vg As VG
    Dim xerr As String = String.Empty
    Private Reaseg As New sis3.Emision.Reaseguro.Informes

    Private _dt As Data.DataTable
    Public Property dt() As Data.DataTable
        Get
            Return _dt
        End Get
        Set(ByVal value As Data.DataTable)
            _dt = value
        End Set
    End Property

    Protected Sub Page_PreInit(sender As Object, e As EventArgs) Handles Me.PreInit
        Try
            If Me.Session.Count = 0 Then
                Me.Session.RemoveAll()
                Response.Redirect("~/Noautorizado.htm")
            Else
                vg = Me.Session.Item("vg")
                If IsNothing(vg) Then
                    Response.Redirect("~/Noautorizado.htm")
                End If
            End If
        Catch exp As Exception
            Response.Redirect("~/Noautorizado.htm")
        End Try
    End Sub

    Private Sub reaInformesEXT_Load(sender As Object, e As System.EventArgs) Handles Me.Load
        If IsPostBack Then Exit Sub

        Carga_Ini_Bordero()
        Carga_Ini_PolVig()
        Carga_Ini_Cum()
        Carga_Ini_Perfil()
        Carga_Ini_Fecha()
    End Sub


#Region "Tab 1"

    ''' <summary>
    ''' Carga los combos del bordero
    ''' </summary>
    Private Sub Carga_Ini_Bordero()
        Store_cramo_bor.DataSource = Reaseg.Bordero_Dame_Ramos()
        Store_cramo_bor.DataBind()
        Store_ctipo_bor.DataSource = Reaseg.Bordero_Dame_TipoReporte()
        Store_ctipo_bor.DataBind()

        Dim rtn As New Date
        rtn = Date.Now

        DateField_fdesde_bor.Text = rtn.AddDays(-rtn.Day + 1).ToString("dd/MM/yyyy")
        DateField_fhasta_bor.Text = Now.ToString("dd/MM/yyyy")
    End Sub

    ''' <summary>
    '''   Carga los registro de los bordero
    ''' </summary>
    ''' <param name="sender">sender</param>
    ''' <param name="e">e</param>
    ''' <remarks>Rubén Tamayo</remarks>
    Public Sub Refrescar_Bordero_Primas(ByVal sender As Object, ByVal e As StoreRefreshDataEventArgs)
        Dim ts As Diagnostics.Stopwatch = Diagnostics.Stopwatch.StartNew()

        Try
            ts.Start()

            xerr = String.Empty

            If DateField_fdesde_bor.SelectedDate = CDate(Nothing) Then
                xerr += "X"
                DateField_fdesde_bor.MarkInvalid("Debe indicar la fecha inicial.")
            End If

            If DateField_fhasta_bor.SelectedDate = CDate(Nothing) Then
                xerr += "X"
                DateField_fhasta_bor.MarkInvalid("Debe indicar la fecha final.")
            End If

            If ComboBox_cramo_bor.SelectedItems.Count <= 0 Then
                xerr += "X"
                ComboBox_cramo_bor.MarkInvalid("Debe indicar el ramo.")
            End If

            If String.IsNullOrEmpty(ComboBox_ctipo_bor.SelectedItem.Value) Then
                xerr += "X"
                ComboBox_ctipo_bor.MarkInvalid("Debe indicar el tipo.")
            End If

            If xerr.Trim().Length > 0 Then
                ts.Stop()
                Exit Sub
            End If


            Dim Ramos As String = Dame_Ramos_Seleccionados(ComboBox_cramo_bor)
            dt = Nothing
            dt = Reaseg.Bordero_Listar(DateField_fdesde_bor.SelectedDate, DateField_fhasta_bor.SelectedDate, Ramos, ComboBox_ctipo_bor.SelectedItem.Value, False, e.Start, e.Limit, e.Total, xerr)

            If xerr.Trim().Length > 0 Then
                sis3.gui.msg.Mensaje(xerr, "Info", Ext.Net.MessageBox.Icon.ERROR, Ext.Net.MessageBox.Button.OK)
                ts.Stop()
                Exit Sub
            End If

            If Not dt Is Nothing Then
                If dt.Rows.Count > 0 Then
                    sis3.gui.Utilidad.DameCol(dt, GridPanel_Bordero, Store_Bordero, xerr)
                    Store_Bordero.DataSource = dt

                    btnExportT1.Disabled = False
                Else
                    Ext.Net.X.AddScript("NotiToast('No hay registro que mostrar');")
                End If
            End If

            ts.Stop()
            lbltimeRep.Text = "Total de Registros Encontrados:" & e.Total & " en un tiempo: " & String.Format("{0:00}:{1:00}:{2:00}.{3:00}", ts.Elapsed.TotalHours, ts.Elapsed.TotalMinutes, ts.Elapsed.TotalSeconds, ts.Elapsed.TotalMilliseconds / 10)

        Catch ex As Exception
            ts.Stop()
            sis3.gui.msg.Mensaje(ex.Message, "Info", Ext.Net.MessageBox.Icon.ERROR, Ext.Net.MessageBox.Button.OK)
        End Try
    End Sub

#End Region

#Region "Tab 2"
    Private Sub Carga_Ini_PolVig()
        Store_ctiporamo_polvig.DataSource = Reaseg.Bordero_Dame_TipoRamos()
        Store_ctiporamo_polvig.DataBind()
    End Sub

    ''' <summary>
    ''' Carga las pólizas vigentes
    ''' </summary>
    ''' <param name="sender">sender</param>
    ''' <param name="e">e</param>
    ''' <remarks>Rubén Tamayo</remarks>
    Public Sub PolVigen_Refrescar(ByVal sender As Object, ByVal e As StoreRefreshDataEventArgs)

        Dim ts As Diagnostics.Stopwatch = Diagnostics.Stopwatch.StartNew()

        Try
            ts.Start()

            xerr = String.Empty

            If DateField_fhasta_polvig.SelectedDate = CDate(Nothing) Then
                xerr += "X"
                DateField_fhasta_polvig.MarkInvalid("Debe indicar la fecha de cálculo.")
            End If

            If ComboBox_cramo_polvig.SelectedItems.Count <= 0 Then
                xerr += "X"
                ComboBox_cramo_polvig.MarkInvalid("Debe indicar el ramo.")
            End If

            If xerr.Trim().Length > 0 Then
                ts.Stop()
                Exit Sub
            End If

            Dim Ramos As String = Dame_Ramos_Seleccionados(ComboBox_cramo_polvig)

            dt = Nothing
            dt = Reaseg.Polizas_Vigentes_Listar(ComboBox_ctiporamo_polvig.SelectedItem.Value, Ramos, 1, False, e.Start, e.Limit, e.Total, xerr)

            If xerr.Trim().Length > 0 Then
                sis3.gui.msg.Mensaje(xerr, "Info", Ext.Net.MessageBox.Icon.ERROR, Ext.Net.MessageBox.Button.OK)
                ts.Stop()
                Exit Sub
            End If

            If Not dt Is Nothing Then
                If dt.Rows.Count > 0 Then
                    sis3.gui.Utilidad.DameCol(dt, gv_PolVig_DTIn, stpolvig, xerr)
                    stpolvig.DataSource = dt
                Else
                    Ext.Net.X.AddScript("Notifica('No hay registro que mostrar');")
                End If
            End If

            ts.Stop()
            lbltimeRepVig.Text = "Total de Registros Encontrados:" & e.Total & " en un tiempo: " & String.Format("{0:00}:{1:00}:{2:00}.{3:00}", ts.Elapsed.TotalHours, ts.Elapsed.TotalMinutes, ts.Elapsed.TotalSeconds, ts.Elapsed.TotalMilliseconds / 10)

        Catch ex As Exception
            ts.Stop()
            sis3.gui.msg.Mensaje(ex.Message, "Info", Ext.Net.MessageBox.Icon.ERROR, Ext.Net.MessageBox.Button.OK)
        End Try
    End Sub

    Protected Sub Stcramo_polvig_Refresh(ByVal sender As Object, ByVal e As Ext.Net.StoreRefreshDataEventArgs)
        Store_cramo_polvig.DataSource = Reaseg.Bordero_Dame_Ramos(ComboBox_ctiporamo_polvig.SelectedItem.Value)
        Store_cramo_polvig.DataBind()
    End Sub

#End Region

#Region "Tab 3"

    Private Sub Carga_Ini_Cum()
        Store_ctiporamo_cum.DataSource = Reaseg.Bordero_Dame_TipoRamos()
        Store_ctiporamo_cum.DataBind()
    End Sub

    Protected Sub Stcramo_cum_Refresh(ByVal sender As Object, ByVal e As Ext.Net.StoreRefreshDataEventArgs)
        Store_cramo_cum.DataSource = Reaseg.Bordero_Dame_Ramos(ComboBox_ctiporamo_cum.SelectedItem.Value)
        Store_cramo_cum.DataBind()
    End Sub

    ''' <summary>
    '''  Carga los registros de los cumulos
    ''' </summary>
    ''' <param name="sender">sender</param>
    ''' <param name="e">e</param>
    ''' <remarks>Rubén Tamayo</remarks>
    Public Sub Stcumulos_Refrescar(ByVal sender As Object, ByVal e As StoreRefreshDataEventArgs)

        Dim ts As Diagnostics.Stopwatch = Diagnostics.Stopwatch.StartNew()

        Try

            ts.Start()

            xerr = String.Empty

            If DateField_fhasta_cum.SelectedDate = CDate(Nothing) Then
                DateField_fhasta_cum.MarkInvalid("Debe indicar la fecha de cálculo")
                xerr += "X"
            End If

            If ComboBox_cramo_cum.SelectedItems.Count <= 0 Then
                ComboBox_cramo_cum.MarkInvalid("Debe indicar el ramo")
                xerr += "X"
            End If

            If xerr.Trim().Length > 0 Then
                ts.Stop()
                Exit Sub
            End If

            If Radio_Cum_TipoPoliza.Checked Then
                Gvcumulos.ColumnModel.SetHidden(2, False)
                Gvcumulos.ColumnModel.SetHidden(3, False)
                'Gvcumulos.ColumnModel.SetHidden(4, False)
                Gvcumulos.ColumnModel.SetHidden(5, False)
                Gvcumulos.ColumnModel.SetHidden(6, False)
                Gvcumulos.ColumnModel.SetHidden(7, False)
                Gvcumulos.ColumnModel.SetHidden(8, False)
                'Gvcumulos.ColumnModel.SetHidden(17, False)
                If (ComboBox_ctiporamo_cum.SelectedItem.Value = 7) Then
                    Gvcumulos.ColumnModel.SetHidden(18, True)
                    Gvcumulos.ColumnModel.SetHidden(19, False)
                    Gvcumulos.ColumnModel.SetHidden(20, False)
                    Gvcumulos.ColumnModel.SetHidden(21, False)
                    Gvcumulos.ColumnModel.SetHidden(22, False)
                    Gvcumulos.ColumnModel.SetHidden(4, False)
                    'Gvcumulos.ColumnModel.SetHidden(22, False)
                    Gvcumulos.ColumnModel.SetHidden(23, False)
                    Gvcumulos.ColumnModel.SetHidden(24, False)
                End If
            Else
                Gvcumulos.ColumnModel.SetHidden(2, True)
                Gvcumulos.ColumnModel.SetHidden(3, True)
                Gvcumulos.ColumnModel.SetHidden(4, True)
                Gvcumulos.ColumnModel.SetHidden(5, True)
                Gvcumulos.ColumnModel.SetHidden(6, True)
                Gvcumulos.ColumnModel.SetHidden(7, True)
                Gvcumulos.ColumnModel.SetHidden(8, True)
                'Gvcumulos.ColumnModel.SetHidden(17, True)
                Gvcumulos.ColumnModel.SetHidden(18, False)
                'Gvcumulos.ColumnModel.SetHidden(19, True)
                Gvcumulos.ColumnModel.SetHidden(20, True)
                Gvcumulos.ColumnModel.SetHidden(21, True)
                Gvcumulos.ColumnModel.SetHidden(22, True)
                Gvcumulos.ColumnModel.SetHidden(23, True)
                Gvcumulos.ColumnModel.SetHidden(24, True)
            End If

            Dim AgrupaRamo As Boolean = Checkbox_AgrupaRamo_cum.Checked
            Dim Ramos As String = Dame_Ramos_Seleccionados(ComboBox_cramo_cum)
            Dim ctipo As Integer = RadioGroup_Cum.CheckedItems(0).InputValue

            dt = Nothing
            dt = Reaseg.Cumulos_Listar(Ramos, ctipo, AgrupaRamo, False, e.Start, e.Limit, e.Total, xerr)

            If xerr.Trim().Length > 0 Then
                sis3.gui.msg.Mensaje(xerr, "Info", Ext.Net.MessageBox.Icon.ERROR, Ext.Net.MessageBox.Button.OK)
                ts.Stop()
                Exit Sub
            End If

            If Not dt Is Nothing Then
                If dt.Rows.Count > 0 Then
                    Stcumulos.DataSource = dt
                    Stcumulos.DataBind()
                Else
                    Ext.Net.X.AddScript("Notifica('No hay registro que mostrar');")
                End If
            End If

            ts.Stop()
            lblcumulo.Text = "Total de Registros Encontrados:" & e.Total & " en un tiempo: " & String.Format("{0:00}:{1:00}:{2:00}.{3:00}", ts.Elapsed.TotalHours, ts.Elapsed.TotalMinutes, ts.Elapsed.TotalSeconds, ts.Elapsed.TotalMilliseconds / 10)

        Catch ex As Exception
            ts.Stop()
            sis3.gui.msg.Mensaje(ex.Message, "Info", Ext.Net.MessageBox.Icon.ERROR, Ext.Net.MessageBox.Button.OK)
        End Try
    End Sub
#End Region

#Region "Tab 4"

    Private Sub Carga_Ini_Perfil()
        Store_ctiporamo_perfil.DataSource = Reaseg.Bordero_Dame_TipoRamos()
        Store_ctiporamo_perfil.DataBind()
        Store_ctiporamo_perfilmant.DataSource = Reaseg.Bordero_Dame_TipoRamos()
        Store_ctiporamo_perfilmant.DataBind()
        ComboBox_tiporango_perfil.SelectedItem.Value = 1
    End Sub

    Protected Sub Stcramo_perfil_Refresh(ByVal sender As Object, ByVal e As Ext.Net.StoreRefreshDataEventArgs)
        If ComboBox_ctiporamo_perfil.SelectedItem.Value = 7 Then
            Stcramo_perfil.DataSource = Reaseg.Bordero_Dame_Ramos_Fianzas_Perfil()
            Stcramo_perfil.DataBind()
        Else
            Stcramo_perfil.DataSource = Reaseg.Bordero_Dame_Ramos(ComboBox_ctiporamo_perfil.SelectedItem.Value)
            Stcramo_perfil.DataBind()
        End If

    End Sub

    ''' <summary>
    ''' Carga los datos de los perfiles
    ''' </summary>
    ''' <param name="sender">sender</param>
    ''' <param name="e">e</param>
    ''' <remarks>Rubén Tamayo</remarks>
    Public Sub StPerfil_Refrescar(ByVal sender As Object, ByVal e As StoreRefreshDataEventArgs)

        Dim ts As Diagnostics.Stopwatch = Diagnostics.Stopwatch.StartNew()

        Try
            ts.Start()
            xerr = String.Empty

            If DateField_fhasta_perfil.SelectedDate = CDate(Nothing) Then
                DateField_fhasta_perfil.MarkInvalid("Debe indicar la fecha de cálculo")
                xerr += "X"
            End If

            If ComboBox_cramo_perfil.SelectedItems.Count <= 0 Then
                ComboBox_cramo_perfil.MarkInvalid("Debe indicar el ramo")
                xerr += "X"
            End If

            If xerr.Trim().Length > 0 Then
                ts.Stop()
                Exit Sub
            End If

            Dim TipoRamo As Integer = ComboBox_ctiporamo_perfil.SelectedItem.Value
            Dim TipoRango As Integer = ComboBox_tiporango_perfil.SelectedItem.Value
            Dim AgrupaRamo As Boolean = Checkbox_AgrupaRamo_perfil.Checked
            Dim Ramos As String = Dame_Ramos_Seleccionados(ComboBox_cramo_perfil)

            dt = Nothing
            dt = Reaseg.Perfil_Listar(TipoRamo, Ramos, TipoRango, AgrupaRamo, False, e.Start, e.Limit, e.Total, xerr)

            If xerr.Trim().Length > 0 Then
                ts.Stop()
                sis3.gui.msg.Mensaje(xerr, "Info", Ext.Net.MessageBox.Icon.ERROR, Ext.Net.MessageBox.Button.OK)
                Exit Sub
            End If

            If Not dt Is Nothing Then
                If dt.Rows.Count > 0 Then
                    StPerfil.DataSource = dt
                    StPerfil.DataBind()
                Else
                    Ext.Net.X.AddScript("Notifica('No hay registro que mostrar');")
                End If
            End If

            ts.Stop()
            lblperfiles.Text = "Total de Registros Encontrados:" & dt.Rows.Count & " en un tiempo: " & String.Format("{0:00}:{1:00}:{2:00}.{3:00}", ts.Elapsed.TotalHours, ts.Elapsed.TotalMinutes, ts.Elapsed.TotalSeconds, ts.Elapsed.TotalMilliseconds / 10)

        Catch ex As Exception
            ts.Stop()
            sis3.gui.msg.Mensaje(ex.Message, "Info", Ext.Net.MessageBox.Icon.ERROR, Ext.Net.MessageBox.Button.OK)
        End Try
    End Sub


    ' Sección de mantenimiento de perfiles

    Protected Sub Stcramo_perfilmant_Refresh(ByVal sender As Object, ByVal e As Ext.Net.StoreRefreshDataEventArgs)
        If ComboBox_ctiporamo_perfilmant.SelectedItem.Value = 7 Then
            Stcramo_perfilmant.DataSource = Reaseg.Bordero_Dame_Ramos_Fianzas_Perfil()
            Stcramo_perfilmant.DataBind()
        Else
            Stcramo_perfilmant.DataSource = Reaseg.Bordero_Dame_Ramos(ComboBox_ctiporamo_perfilmant.SelectedItem.Value)
            Stcramo_perfilmant.DataBind()
        End If

    End Sub

    ''' <summary>
    ''' Carga la configuracion de los perfiles de cartera
    ''' </summary>
    ''' <param name="sender">sender</param>
    ''' <param name="e">e</param>
    ''' <remarks>Rubén Tamayo</remarks>
    Public Sub Store_Perfil_Rangos_Refresh(ByVal sender As Object, ByVal e As StoreRefreshDataEventArgs)

        Dim ts As Diagnostics.Stopwatch = Diagnostics.Stopwatch.StartNew()

        Try

            ts.Start()
            dt = Nothing

            If Hidden_tiporango_perfil.Text = 1 Then
                If String.IsNullOrEmpty(ComboBox_cramo_perfilmant.SelectedItem.Value) Then ts.Stop() : Exit Sub

                If ComboBox_ctiporamo_perfilmant.SelectedItem.Value = 7 Then
                    dt = Reaseg.Perfil_Listar_Rango_Fianzas(1, ComboBox_cramo_perfilmant.SelectedItem.Value)
                Else
                    dt = Reaseg.Perfil_Listar_Rango(1, ComboBox_cramo_perfilmant.SelectedItem.Value)
                End If
            Else
                dt = Reaseg.Perfil_Listar_Rango_Din(1)
            End If

            If Not dt Is Nothing Then
                If dt.Rows.Count > 0 Then
                    Store_Perfil_Rangos.DataSource = dt
                    Store_Perfil_Rangos.DataBind()
                Else
                    Ext.Net.X.AddScript("Notifica('No hay registro que mostrar');")
                End If
            End If

            ts.Stop()
            lblpermant.Text = "Total de Registros Encontrados:" & dt.Rows.Count & " en un tiempo: " & String.Format("{0:00}:{1:00}:{2:00}.{3:00}", ts.Elapsed.TotalHours, ts.Elapsed.TotalMinutes, ts.Elapsed.TotalSeconds, ts.Elapsed.TotalMilliseconds / 10)

        Catch ex As Exception
            ts.Stop()
            sis3.gui.msg.Mensaje(ex.Message, "Info", Ext.Net.MessageBox.Icon.ERROR, Ext.Net.MessageBox.Button.OK)
        End Try
    End Sub

    ''' <summary>
    ''' Agrega o Actualiza un Rango
    ''' </summary>
    ''' <param name="opt">Tipo de Rango (1=Automático, 2=manual)</param>
    ''' <param name="rec">Registros</param>
    ''' <param name="tipo">Indica si agrega(A) o actualiza(G)</param>
    ''' <returns>boolean</returns>
    ''' <remarks>Rubén Tamayo</remarks>
    <Ext.Net.DirectMethod()> _
    Public Function AddUpRango(ByVal opt As Integer, ByVal rec As String, ByVal tipo As String) As Boolean
        Try
            If opt = 1 Then
                If String.IsNullOrEmpty(ComboBox_cramo_perfilmant.SelectedItem.Value) Then
                    ComboBox_cramo_perfilmant.MarkInvalid("Debe seleccionar el ramo")
                    Ext.Net.X.AddScript("Notifica('Debe seleccionar el ramo');")
                    Return False
                End If
            End If

            Dim gvdata As Dictionary(Of String, String)() = Ext.Net.JSON.Deserialize(Of Dictionary(Of String, String)())(rec)
            If tipo = "G" And gvdata.Length = 0 Then
                sis3.gui.msg.Mensaje("No hay registros modificados para actualizar", "Info", Ext.Net.MessageBox.Icon.WARNING, Ext.Net.MessageBox.Button.OK)
                Return False
            End If

            xerr = String.Empty

            If tipo = "G" Then
                For Each rw As Generic.IDictionary(Of String, String) In gvdata
                    If opt = 2 Then
                        Reaseg.Perfil_Guardar_Rango(opt, 1, ComboBox_ctiporamo_perfilmant.SelectedItem.Value, 0, rw!id, rw!mlim_min, rw!mlim_max, rw!mlim_min_imp, rw!mlim_max_imp, xerr)
                    Else
                        Reaseg.Perfil_Guardar_Rango(opt, 1, ComboBox_ctiporamo_perfilmant.SelectedItem.Value, ComboBox_cramo_perfilmant.SelectedItem.Value, rw!id, rw!mlim_min, rw!mlim_max, rw!mlim_min_imp, rw!mlim_max_imp, xerr)
                    End If
                Next
            Else
                If opt = 2 Then
                    Reaseg.Perfil_Agregar_Rango(opt, 1, ComboBox_ctiporamo_perfilmant.SelectedItem.Value, 0, xerr)
                Else
                    Reaseg.Perfil_Agregar_Rango(opt, 1, ComboBox_ctiporamo_perfilmant.SelectedItem.Value, ComboBox_cramo_perfilmant.SelectedItem.Value, xerr)
                End If
            End If

            If xerr.Trim().Length > 0 Then
                sis3.gui.msg.Mensaje(xerr, "Info", Ext.Net.MessageBox.Icon.ERROR, Ext.Net.MessageBox.Button.OK)
                Return False
            End If

            Return True
            'buscar_Perfil(Nothing, Nothing)

        Catch ex As Exception
            sis3.gui.msg.Mensaje(ex.Message, "Info", Ext.Net.MessageBox.Icon.ERROR, Ext.Net.MessageBox.Button.OK)
            Return False
        End Try

    End Function

    ''' <summary>
    ''' Elimina un rango en el perfil
    ''' </summary>
    ''' <param name="opt">Tipo de Rango (1=Automático, 2=manual)</param>
    ''' <param name="id">Id del record a eliminar</param>
    ''' <returns>boolean</returns>
    ''' <remarks>Rubén Tamayo</remarks>
    <Ext.Net.DirectMethod()> _
    Function DelRango(ByVal opt As Integer, ByVal id As Integer) As Boolean

        If opt = 1 Then
            If String.IsNullOrEmpty(ComboBox_cramo_perfilmant.SelectedItem.Value) Then
                ComboBox_cramo_perfilmant.MarkInvalid("Debe seleccionar el ramo")
                Ext.Net.X.AddScript("Notifica('Debe seleccionar el ramo');")
                Return False
            End If
        End If

        xerr = String.Empty

        If opt = 2 Then
            Reaseg.Perfil_Eliminar_Rango(opt, 1, ComboBox_ctiporamo_perfilmant.SelectedItem.Value, 0, id, xerr)
        Else
            Reaseg.Perfil_Eliminar_Rango(opt, 1, ComboBox_ctiporamo_perfilmant.SelectedItem.Value, ComboBox_cramo_perfilmant.SelectedItem.Value, id, xerr)
        End If

        If xerr.Trim().Length > 0 Then
            sis3.gui.msg.Mensaje(xerr, "Info", Ext.Net.MessageBox.Icon.ERROR, Ext.Net.MessageBox.Button.OK)
            Return False
        End If

        Return True

    End Function


#End Region

#Region "Metodos Compartidos"

    ''' <summary>
    ''' Carga la fecha del ultimo calculo realizado
    ''' </summary>
    Private Function Carga_Ini_Fecha() As Boolean
        Dim fcalculo As String = ""
        Reaseg.Dame_fcalculo_PolVig(fcalculo)
        If fcalculo.Trim = "" Then
            DateField_fhasta_polvig.SelectedDate = CDate(Nothing)
            DateField_fhasta_cum.SelectedDate = CDate(Nothing)
            DateField_fhasta_perfil.SelectedDate = CDate(Nothing)
            Ext.Net.X.AddScript("Notifica('Debe calcular pólizas vigentes')")
        Else
            DateField_fhasta_polvig.SelectedDate = CDate(fcalculo)
            DateField_fhasta_cum.SelectedDate = CDate(fcalculo)
            DateField_fhasta_perfil.SelectedDate = CDate(fcalculo)
        End If
        Return True
    End Function

    ''' <summary>
    '''  Recupera los códigos de los ramos selecionados
    ''' </summary>
    ''' <param name="combo">Multicombo</param>
    ''' <returns>string</returns>
    Private Function Dame_Ramos_Seleccionados(combo As MultiCombo) As String
        Dim Ramos As String = ""
        For i As Integer = 0 To combo.SelectedItems.Count - 1
            Ramos = Ramos & combo.SelectedItems.Item(i).Value
            If i < combo.SelectedItems.Count - 1 Then
                Ramos = Ramos & ","
            End If
        Next
        Return Ramos
    End Function

    ''' <summary>
    ''' Metodo que calcula la fecha  maxima de generaci[on de los registros de reaseguro
    ''' </summary>
    ''' <param name="sender">sender</param>
    ''' <param name="e">e</param>
    ''' <remarks>Rubén Tamayo</remarks>
    Protected Sub Calcular_PolVig(sender As Object, e As DirectEventArgs)
        Try
            If DateField_PolVig_fcalculo.SelectedDate = CDate(Nothing) Then
                sis3.gui.msg.Mensaje("Debe indicar la fecha de cálculo", "Info", Ext.Net.MessageBox.Icon.WARNING, Ext.Net.MessageBox.Button.OK)
                Exit Sub
            End If

            If Reaseg.Calcular_PolVig(DateField_PolVig_fcalculo.SelectedDate) = False Then
                sis3.gui.msg.Mensaje("Ha ocurrido un error en el cálculo ", "Err", Ext.Net.MessageBox.Icon.ERROR, Ext.Net.MessageBox.Button.OK)
                Exit Sub
            End If

            Carga_Ini_Fecha()

            Ext.Net.X.AddScript("#{Window_Calcular_PolVig}.hide(); Notifica('Cálculo realizado correctamente.')")
        Catch ex As Exception
            Notificacion.Mensage(ex.Message)
        End Try
    End Sub


    ''' <summary>
    ''' Funcion para ejecutar el onSummit del reprote
    ''' </summary>
    ''' <returns>boolean</returns>
    ''' <remarks>Rubén Tamayo</remarks>
    <Ext.Net.DirectMethod()> _
    Public Function ExportRegistro() As Boolean
        System.Threading.Thread.Sleep(2000)
        Me.Session.Add("cumuRT", 0)
        Ext.Net.X.AddScript("onSubmitSuccesIng();")
        Server.ScriptTimeout = 3600000
        Return True
    End Function

    ''' <summary>
    ''' Descarga el archivo
    ''' </summary>
    ''' <returns>boolean</returns>
    ''' <remarks>Rubén Tamayo</remarks>
    <Ext.Net.DirectMethod()> _
    Public Function IntegExport(ByVal ctipo As Integer) As Boolean
        HttpContext.Current = Me.Context
        Try
            dt = Nothing

            Select Case ctipo
                Case 1
                    dt = Reaseg.Bordero_Listar(DateField_fdesde_bor.SelectedDate, DateField_fhasta_bor.SelectedDate, Dame_Ramos_Seleccionados(ComboBox_cramo_bor), ComboBox_ctipo_bor.SelectedItem.Value, True, 0, 0, -1, xerr)

                Case 2
                    dt = Reaseg.Polizas_Vigentes_Listar(ComboBox_ctiporamo_polvig.SelectedItem.Value, Dame_Ramos_Seleccionados(ComboBox_cramo_polvig), 1, True, 0, 0, -1, xerr)

                Case 3
                    dt = Reaseg.Polizas_Vigentes_Listar(ComboBox_ctiporamo_polvig.SelectedItem.Value, Dame_Ramos_Seleccionados(ComboBox_cramo_polvig), 2, True, 0, 0, -1, xerr)

                Case 4
                    dt = Reaseg.Cumulos_Listar(Dame_Ramos_Seleccionados(ComboBox_cramo_cum), RadioGroup_Cum.CheckedItems(0).InputValue, Checkbox_AgrupaRamo_cum.Checked, True, 0, 0, -1, xerr)

                Case 5
                    dt = Reaseg.Perfil_Listar(ComboBox_ctiporamo_perfil.SelectedItem.Value, Dame_Ramos_Seleccionados(ComboBox_cramo_perfil), ComboBox_tiporango_perfil.SelectedItem.Value, Checkbox_AgrupaRamo_perfil.Checked, True, 0, 0, -1, xerr)

                Case Else
                    Me.Session.Remove("cumuRT")
                    Ext.Net.X.AddScript("Notifica('No Hay Registro para Exportar con este código de reporte. Acción Cancelada...');")
                    Return False
            End Select

            If dt Is Nothing Then Ext.Net.X.AddScript("Notifica('No Hay Registro para Exportar. Acción Cancelada...');") : Return False

            If xerr.Trim().Length > 0 Then
                Me.Session.Remove("cumuRT")
                sis3.gui.msg.Mensaje(xerr, True)
                Return False
            End If

            If dt.Rows.Count = 0 Then
                Me.Session.Remove("cumuRT")
                Ext.Net.X.AddScript("Notifica('No Hay Registro para Exportar. Acción Cancelada...');")
                Return False
            Else
                If dt.Columns.Contains("p_total") = True Then dt.Columns.Remove("p_total") : dt.AcceptChanges()

                If sis3.gui.Utilidad.DownloadFileXLS(dt, "cumuRT", "Gestor de Reportes", "Gestor de Reportes", vg.ApelNomb) = False Then Return False
            End If

            Return True

        Catch ex As Exception
            Session.Remove("cumuRT")
            Return False
        End Try
        Return True
    End Function

    ''' <summary>
    ''' Verifica el evento de exportación si esta o no ejecutandose
    ''' </summary>
    ''' <returns>boolean</returns>
    ''' <remarks>Rubén Tamayo</remarks>
    <Ext.Net.DirectMethod()> _
    Public Function RefreshTimeIng() As Boolean
        Dim prog As Object = Session("cumuRT")

        If Not prog Is Nothing Then
            Return True
        Else
            Return False
        End If
    End Function

#End Region

End Class