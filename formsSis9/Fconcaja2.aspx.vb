Imports System.Collections.Generic
Imports System.IO
Imports System.Data
Imports System.Xml.Xsl
Imports System.Xml

Partial Class Fconcaja2
    Inherits System.Web.UI.Page

    Dim Vg As VG
    Private ReadOnly db As New sis3.db.db

    Private Shared OpVCaja As Integer
    Private Shared Opsel As String
    Private Shared SQLCI As String
    Private xsql As New StringBuilder
    Public objcaja As New sis3.cobros.caja
    Public clngestiones As New sis3.gui.Gestionescoolite

#Region "Eventos de Pagina"

    Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load
        If Page.IsPostBack Then Return

        If Vg.wcia = 10 Then
            tabPrimas.Title = "Préstamos Pagados"

            GdvPagoPrima.ColumnModel.Columns(3).Header = "Préstamo"
            GdvPagoPrima.ColumnModel.Columns(9).Header = "Mto. Principal"
            GdvPagoPrima.ColumnModel.Columns(10).Header = "Mto. Int. Moratorio"
            GdvPagoPrima.ColumnModel.Columns(13).Header = "Mto. Int. Corriente"
            GdvPagoPrima.ColumnModel.Columns(11).Hidden = True 'motrosgas
            GdvPagoPrima.ColumnModel.Columns(12).Hidden = True 'mimpuestos
            GdvPagoPrima.ColumnModel.Columns(14).Hidden = True 'mproductor
            GdvPagoPrima.ColumnModel.Columns(15).Hidden = True 'msupervisor
            GdvPagoPrima.ColumnModel.Columns(16).Hidden = True 'mgerente

            tabDepositos.Title = "Préstamos por Aplicar"
            GdvDeptoPrima.ColumnModel.Columns(6).Header = "Prestamo"
        End If
        
        clngestiones.CargarComboCoolite("select ccodigo, xdescripcion_l from Macodigos where xsinonimo='istatcaja' Order by norden", "xdescripcion_l", "ccodigo", Ddliestado, Store_Ddliestado)
        clngestiones.CargarComboCoolite("select csucur, xdescripcion_l from Masucur", "xdescripcion_l", "csucur", TxtCsucur, Store_Sucursal)
        clngestiones.CargarComboCoolite("SELECT ccodigo, xdescripcion_l FROM itipocaja", "xdescripcion_l", "ccodigo", ddTipoCaja, store_ddtipocaja)
        clngestiones.CargarComboCoolite("Select cci_rif, Rtrim(xcliente) + ' ' + cast(cci_rif as varchar) as xcliente from maentes WHERE bcajero=1", "xcliente", "cci_rif", TxtCcajero, Store_Cajero)       
    End Sub

    Protected Sub Page_PreInit(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.PreInit
        If Me.Session.Count = 0 Then
            Me.Session.RemoveAll()
            Response.Redirect("Noautorizado.htm")
        Else
            Vg = Me.Session.Item("VG")
            If IsNothing(Vg) Then
                Response.Redirect("Noautorizado.htm")
            Else
                If Vg.objClnUsuario.Acceso_BAdministrador = False Then
                    Response.Redirect("Noautorizado.htm")
                End If
            End If
        End If
    End Sub

#End Region

#Region "Busquedas de Cajas"

    Private Function VerCajas(ByVal ini As Integer, ByVal limi As Integer, ByRef total As Integer, Optional ByVal isExport As Boolean = False) As Data.DataTable
        Me.LimpiarDatos()
        Me.HdfScaja.Value = "SELECT cbcaja.csucur as Suc, rtrim(masucur.xdescripcion_l) as Sucursal, " & _
        "case when cbcaja.itipocaja = 'MO' then 'Caja Monetaria' when cbcaja.itipocaja = 'CH' then 'Caja chica' when cbcaja.itipocaja = 'NM' then 'Caja No Monetaria' end as itipocaja, " & _
        "ccajero AS Cajero, fcaja as Fecha, ccaja AS Caja, mae1.xcliente, mconta AS Contab, mcaja AS Saldo, " & _
        "mprimas AS Primas, mpdeposito, mvarios AS Varios, mbanco, " & _
        "case when istatcaja = 'C' then 'Cerrada' else 'Abierta' end AS Status, isnull(ncierre,0) as Cierre, " & _
        "case when cbcaja.cprog = 'COB' then 'NO' else 'SI' End AS Mayorizada FROM cbcaja inner join maentes mae1 on mae1.cci_rif = cbcaja.ccajero inner join masucur on cbcaja.csucur = masucur.csucur WHERE 1=1 "

        Me.HdfScaja.Value = HdfScaja.Value & Me.BusFiltro() & " ORDER BY fcaja desc"

        Dim x_count As String = String.Empty
        Dim sqlx As String = String.Empty

        If isExport = True Then
            sqlx = Me.HdfScaja.Value
        Else
            x_count = sis3.gui.Paginacion.convierteCount(Me.HdfScaja.Value)
            sqlx = sis3.gui.Paginacion.convierte(Me.HdfScaja.Value)
            sqlx = String.Format(sqlx.ToString(), ini, (ini + limi))
            total = db.EjecutarScalar(x_count)
        End If

        VerCajas = db.EjecutarSelect(sqlx)
    End Function

    Protected Sub Store_GdvCajas_Refresh(ByVal sender As Object, ByVal e As Coolite.Ext.Web.StoreRefreshDataEventArgs)
        Dim dt As Data.DataTable = Me.VerCajas(e.Start, e.Limit, e.TotalCount)
        If dt Is Nothing Then Exit Sub

        Me.Store_GdvCajas.DataSource = dt
        Me.Store_GdvCajas.DataBind()

        OpVCaja = 0
    End Sub

    Private Function BusFiltro() As String
        Dim filter As New StringBuilder

        If Not String.IsNullOrEmpty(TxtCsucur.SelectedItem.Value) And TxtCsucur.SelectedItem.Value <> "-1" Then
            filter.AppendLine(" AND cbcaja.csucur = " & TxtCsucur.SelectedItem.Value)
        End If

        If TxtCcajero.SelectedItem.Value.Trim <> "-1" And TxtCcajero.SelectedItem.Value.Trim <> "" Then
            filter.AppendLine(" AND ccajero = " & TxtCcajero.SelectedItem.Value)
        End If

        If Ddliestado.SelectedItem.Value.Trim <> "-1" And Ddliestado.SelectedItem.Value.Trim <> "" Then
            filter.AppendLine(" AND istatcaja = '" & Ddliestado.SelectedItem.Value.Trim & "'")
        End If

        If ddTipoCaja.SelectedItem.Value.Trim <> "-1" And ddTipoCaja.SelectedItem.Value.Trim <> "" Then
            filter.AppendLine(" AND itipocaja = '" & ddTipoCaja.SelectedItem.Value.Trim & "'")
        End If

        If Format(CDate(Wdcdesde.Value.ToString.Trim), "yyyyMMdd") <> "00010101" And Format(CDate(WdcHasta.Value.ToString.Trim), "yyyyMMdd") <> "00010101" Then
            filter.AppendLine(" AND fcaja >= '" & Format(CDate(WdcHasta.SelectedDate), "yyyyMMdd") & "' AND fcaja <= '" & Format(CDate(Wdcdesde.SelectedDate), "yyyyMMdd") & "'")
        ElseIf Format(CDate(Wdcdesde.Value.ToString.Trim), "yyyyMMdd") <> "00010101" Then
            filter.AppendLine(" AND fcaja <= '" & Format(CDate(Wdcdesde.SelectedDate), "yyyyMMdd") & "'")
        ElseIf Format(CDate(WdcHasta.Value.ToString.Trim), "yyyyMMdd") <> "00010101" Then
            filter.AppendLine(" AND fcaja >= '" & Format(CDate(WdcHasta.SelectedDate), "yyyyMMdd") & "'")
        End If

        If chNocuadra.Checked Then
            filter.AppendLine(" AND bok = 1")
        End If

        Return filter.ToString()
    End Function

    ''' <summary>
    ''' 
    ''' </summary>
    ''' <param name="sender"></param>
    ''' <param name="e"></param>
    ''' <remarks></remarks>
    Protected Sub btExcel_Click(sender As Object, e As EventArgs)
        Me.Export_ToExcell(Me.VerCajas(0, 0, 0, True))
    End Sub

    ''' <summary>
    ''' Exporta  el resultado de la grilla a excel
    ''' </summary>
    ''' <param name="dt">datatable</param>
    ''' <remarks>Rubén Tamayo</remarks>
    Private Sub Export_ToExcell(ByVal dt As Data.DataTable)
        Dim Sb As New StringBuilder
        Dim sw As New IO.StringWriter(Sb)
        Dim htw As New HtmlTextWriter(sw)
        Dim page As New Page
        Dim form As New HtmlForm
        Dim gv As New System.Web.UI.WebControls.GridView
        Dim enca As String = String.Empty

        If dt.Rows.Count = 0 Then
            sis3.gui.msg.notaRapida("No Hay Registro para Exportar. Acción Cancelada...")
            Exit Sub
        End If

        gv.AllowPaging = False
        gv.DataSourceID = Nothing
        gv.DataSource = dt

        gv.DataBind()
        gv.HeaderRow.BackColor = Drawing.Color.LightCoral
        gv.Caption = "Listado de Registros - Caja"
        gv.EnableViewState = False

        enca += "<Tr><Th>Compañia: " & vg.cws(1).Trim & "</Tr></Th>"
        enca += "<Tr><Th>Fecha de Exportación: " & Today & "</Tr></Th>"
        enca += "<Tr><Th>Exportado Por: " & vg.ApelNomb & "</Tr></Th>"
        enca += "</caption>"
        gv.HeaderRow.HorizontalAlign = HorizontalAlign.Left

        page.EnableEventValidation = False
        page.DesignerInitialize()
        page.Controls.Add(form)
        form.Controls.Add(gv)
        page.RenderControl(htw)

        Response.Clear()
        Response.Buffer = True
        Response.ContentType = "application/vnd.ms-excel"
        Response.AddHeader("Content-Disposition", "attachment;filename=ResultLstCajas.xls")
        Response.Charset = "UTF-8"
        Response.ContentEncoding = Encoding.Default
        Sb.Replace("</caption>", enca)
        Response.Write(Sb.ToString)
        Response.End()
    End Sub

    Public Sub btnclearFilt_click(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        Me.TxtCsucur.SelectedItem.Value = String.Empty
        Me.TxtCcajero.SelectedItem.Value = String.Empty
        Me.ddTipoCaja.SelectedItem.Value = String.Empty
        Me.Ddliestado.SelectedItem.Value = String.Empty
        Me.ddPeriodo.SelectedItem.Value = String.Empty
        Me.WdcHasta.Value = String.Empty
        Me.Wdcdesde.Value = String.Empty
        Me.GdvCajas.Reload()
    End Sub

    ''' <summary>
    ''' Metodo de Busqueda
    ''' </summary>
    ''' <param name="sender">sender</param>
    ''' <param name="e">e</param>
    ''' <remarks>Rubén Tamayo</remarks>
    Public Sub BtnBtnBuscar_click(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        DeshabilitaTabs()
        pnFiltros.Expand()
        pnlEast.Collapse()
        Me.BtnBuscar.AddScript("#{Store_GdvCajas}.reload({params:{clear:true}} );")
        Me.GdvCajas.Reload()
    End Sub

    ''' <summary>
    '''  Carga los datos
    ''' </summary>
    ''' <param name="sender">sender</param>
    ''' <param name="e">e</param>
    ''' <remarks>Rubén Tamayo</remarks>
    Protected Sub Store_GdvMovCajasBUs_Refresh(ByVal sender As Object, ByVal e As Coolite.Ext.Web.StoreRefreshDataEventArgs)
        Dim dt As Data.DataTable = BuscarTab6(e.Start, e.Limit, e.TotalCount)
        If dt Is Nothing Then Exit Sub

        Me.Store_GdvMovCajasBUs.DataSource = dt
        Me.Store_GdvMovCajasBUs.DataBind()

    End Sub


    ''' <summary>
    '''   Exporta los registo de tab de busqueda
    ''' </summary>
    ''' <param name="sender">sender</param>
    ''' <param name="e">e</param>
    ''' <remarks>Rubén Tamayo</remarks>
    Protected Sub btExcelBusq_Click(sender As Object, e As EventArgs)
        Me.Export_ToExcell(Me.BuscarTab6(0, 0, 0, True))
    End Sub

    Private Function BuscarTab6(ByVal ini As Integer, ByVal limi As Integer, ByRef total As Integer, Optional ByVal isExport As Boolean = False) As DataTable
        xsql.Length = 0
        xsql.AppendLine("SELECT cbmovcaj_e.* FROM cbmovcaj_e WHERE 1=1")
        xsql.AppendLine("")
        If TxtCpago.Text.Trim.Length <> 0 Then
            xsql.Append(" AND Cpago = " & TxtCpago.Text)
        End If

        If Txtntrans.Text.Trim.Length <> 0 Then
            xsql.Append(" AND ntrans =" & Txtntrans.Text)
        End If

        If Txtcestcta.Text.Trim.Length <> 0 Then
            xsql.Append(" AND cestcta =" & Txtcestcta.Text)
        End If

        If Txtcrelpago.Text.Trim.Length <> 0 Then
            xsql.Append(" AND crelpago = " & Txtcrelpago.Text)
        End If

        If Txtmcaja.Text.Trim.Length <> 0 Then
            xsql.Append(" AND mcaja = " & Txtmcaja.Text)
        End If

        If Txtnlote.Text.Trim.Length <> 0 Then
            xsql.Append(" AND nlote = " & Txtnlote.Text)
        End If

        If Txtcreferencia.Text.Trim.Length <> 0 Then
            xsql.Append(" AND creferencia = " & Txtcreferencia.Text)
        End If

        If Txtctransaccion.Text.Trim.Length <> 0 Then
            xsql.AppendLine(" AND ctransaccion = " & Txtctransaccion.Text)
        End If

        If ChkFechas.Checked Then
            If Format(CDate(Calfechasel.Value.ToString.Trim), "yyyyMMdd") <> "00010101" And Format(CDate(Calfechaselfin.Value.ToString.Trim), "yyyyMMdd") <> "00010101" Then
                xsql.AppendLine(" AND CONVERT(VARCHAR, fcaja, 112) >=" & Format(CDate(Me.Calfechasel.SelectedDate), "yyyyMMdd") & "  AND CONVERT(VARCHAR, fcaja, 112) <= " & Format(CDate(Me.Calfechaselfin.SelectedDate), "yyyyMMdd"))
            End If
        End If

        xsql.AppendLine(" ORDER BY fingreso DESC ")

        'HdfMovBusCaja.Value = SQL
        'CargaGrid(HdfMovBusCaja.Value, Store_GdvMovCajasBUs)
        Dim x_count As String = String.Empty
        Dim sqlx As String = String.Empty

        If isExport = True Then
            sqlx = xsql.ToString()
        Else
            x_count = sis3.gui.Paginacion.convierteCount(xsql.ToString())
            sqlx = sis3.gui.Paginacion.convierte(xsql.ToString())
            sqlx = String.Format(sqlx.ToString(), ini, (ini + limi))
            total = db.EjecutarScalar(x_count)
        End If

        BuscarTab6 = db.EjecutarSelect(sqlx)
    End Function

    Protected Sub LlenarGrid()
        'Llena el GridView del detalle de la caja
        Det_CajaSel(Nothing, Nothing)

        'Llena el GridView de Primas pagadas
        DPrimaRam_CajaSel(Nothing, Nothing)

        'Llena el GridView de Depositos de Primas
        HdfDeptoPrima.Value = "SELECT csucur_caja, ccajero, convert(nvarchar,fcaja,103) fcaja, ccaja, cpago, ntranpdp_linea, cestcta, cmoneda, ctransaccion, cnpoliza, mmonto, itipopago, iestado  From cbotrospagos WHERE cbotrospagos.csucur_caja=" & HdfCsucur.Value & " AND cbotrospagos.ccajero=" & Hdfcajero.Value & " AND cbotrospagos.fcaja='" & Format(CDate(Hdffcaja.Value), "yyyyMMdd") & "' AND cbotrospagos.ccaja= " & Hdfccaja.Value & " AND ctransaccion=439"
        CargaGrid(HdfDeptoPrima.Value, Store_GdvDeptoPrima)

        'Llena el grid de Depositos en bancos
        DBan_CajaSel(Nothing, Nothing)
    End Sub

#End Region

#Region "Eventos de GridPanel"
    Public Sub Click_GdvCajas(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        Dim JsonRecord As String = e.ExtraParams("GdvCajas_param")
        Dim gridData As Dictionary(Of String, String)() = Coolite.Ext.Web.JSON.Deserialize(Of Dictionary(Of String, String)())(JsonRecord)
        For Each JColumn As IDictionary(Of String, String) In gridData
            HdfCsucur.Value = JColumn("Suc")
            Hdfcajero.Value = JColumn("Cajero")
            Hdffcaja.Value = Format(CDate(JColumn("Fecha")), "dd/MM/yyyy")
            Hdfccaja.Value = JColumn("Caja")
            txtSucursal.Text = Vg.tec.DameSucursal(CInt(HdfCsucur.Value), Vg.licencia)
            txtCajero.Text = Vg.tec.DameNombre(CDbl(Hdfcajero.Value), Vg.licencia)
            txtfecha.Text = Hdffcaja.Value
            txtcaja.Text = Hdfccaja.Value
            txtestado.Text = JColumn("Status")
            txtmayorizada.Text = JColumn("Mayorizada")
            pnlEast.Expand()
            pnFiltros.Collapse()
            LlenarGrid()
            HabilitarTabs()
        Next
    End Sub

    Public Sub Click_GdvMovCajas(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        Dim JsonRecord As String = e.ExtraParams("GdvMovCajas_Param")
        Dim gridData As Dictionary(Of String, String)() = Coolite.Ext.Web.JSON.Deserialize(Of Dictionary(Of String, String)())(JsonRecord)
        If gridData.Length > 1 Then
            sis3.gui.msg.nuevo("Debe seleccionar solo un movimimiento para inicializar")
            Exit Sub
        End If
        For Each JColumn As IDictionary(Of String, String) In gridData
            wmes.Value = JColumn("fanomescont")
            wcompr.Value = JColumn("nlote")
            wresconta.Value = JColumn("cpago")
        Next
    End Sub


    Public Sub ContabilizaLinea(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)

        If Vg.tiene_permiso(Vg.Numero, "COBROS", "COBROS_REMAYORIZAR_MOVIMIENTOS") Then
            Dim JsonRecord As String = e.ExtraParams("GdvMovCajas_Param")
            Dim gridData As Dictionary(Of String, String)() = Coolite.Ext.Web.JSON.Deserialize(Of Dictionary(Of String, String)())(JsonRecord)
            Dim mens As New StringBuilder
            If gridData.Length = 0 Then
                sis3.gui.msg.nuevo("Debe seleccionar al menos un movimiento para mayorizar.")
                Exit Sub
            End If

            If objcaja.contabilizaLinea(gridData, mens) Then
                LlenarGrid()
                sis3.gui.msg.nuevo(mens.ToString)
            End If
        Else
            sis3.gui.msg.nuevo(String.Format("El Usuario {0} no tiene permiso para remayorizar movimientos.", Vg.usersis))
        End If


    End Sub

    Public Sub Click_GdvPagoPrima(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        Dim JsonRecord As String = e.ExtraParams("GdvPagoPrima_Param")
        Dim gridData As Dictionary(Of String, String)() = Coolite.Ext.Web.JSON.Deserialize(Of Dictionary(Of String, String)())(JsonRecord)
        For Each JColumn As IDictionary(Of String, String) In gridData
            HdfCpago.Value = JColumn("cpago")
            Hdfcrelpagolin.Value = JColumn("crelpagolin")
        Next
    End Sub
#End Region

#Region "Eventos del Primer TAB"
    Protected Sub inicializar(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        'Me.winInicializa.Show()
        'DetRec.InicializaWindows()
    End Sub

    Protected Sub ibtResumen_Click(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        If ValidaCampos() = False Then Return
        objcaja.monedaLocal = Vg.cws(15)
        objcaja.desglosarCaja(CDbl(HdfCsucur.Value), CDbl(Hdfcajero.Value), CDbl(Hdfccaja.Value), CDate(Hdffcaja.Value), 0, 0, 0)
        muestramodal("ImprimePDF.aspx?doc=repcaja&rep1=Rep_Cierre_Caja")
    End Sub

    Protected Sub ibDetalle_Click(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        If ValidaCampos() = False Then Return
        objcaja.monedaLocal = Vg.cws(15)
        objcaja.desglosarCaja(CDbl(HdfCsucur.Value), CDbl(Hdfcajero.Value), CDbl(Hdfccaja.Value), CDate(Hdffcaja.Value), 0, 0, 0)
        muestramodal("ImprimePDF.aspx?doc=repcaja&rep1=Rep_Desglose_CajaNICA")
    End Sub

    Protected Sub resmay1(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        If ValidaCampos() = False Then Return
        Dim filtro As String = "{cbmovcaj_e.fcaja}=Date(" & CDate(Hdffcaja.Value).Year & "," & CDate(Hdffcaja.Value).Month & "," & CDate(Hdffcaja.Value).Day & ") AND {cbmovcaj_e.csucur_caja}=" & HdfCsucur.Value & " AND {cbmovcaj_e.ccajero}=" & Hdfcajero.Value & " AND {cbmovcaj_e.ccaja}=" & Hdfccaja.Value
        LLenarParam()
        muestramodal("ImprimePDF.aspx?doc=repcaja&rep1=resmay&for1=" & filtro & "&for2=" & Vg.CRformulaSel)
    End Sub

    Protected Sub resmay2(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        If ValidaCampos() = False Then Return
        Dim filtro As String = "{cbmovcaj_e.fcaja}=Date(" & CDate(Hdffcaja.Value).Year & "," & CDate(Hdffcaja.Value).Month & "," & CDate(Hdffcaja.Value).Day & ") AND {cbmovcaj_e.csucur_caja}=" & HdfCsucur.Value & " AND {cbmovcaj_e.ccajero}=" & Hdfcajero.Value & " AND {cbmovcaj_e.ccaja}=" & Hdfccaja.Value
        LLenarParam(True)
        muestramodal("ImprimePDF.aspx?doc=repcaja&rep1=resmay1&for1=" & filtro & "&for2=" & Vg.CRformulaSel)
    End Sub

    Protected Sub resmay3(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        If ValidaCampos() = False Then Return
        Dim filtro As String = "{cbmovcaj_e.fcaja}=Date(" & CDate(Hdffcaja.Value).Year & "," & CDate(Hdffcaja.Value).Month & "," & CDate(Hdffcaja.Value).Day & ")"
        LLenarParamDia()
        muestramodal("ImprimePDF.aspx?doc=repcaja&rep1=resmay&for1=" & filtro & "&for2=" & Vg.CRformulaSel)
    End Sub

    Protected Sub resmay4(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        If ValidaCampos() = False Then Return
        Dim filtro As String = "{cbmovcaj_e.fcaja}=Date(" & CDate(Hdffcaja.Value).Year & "," & CDate(Hdffcaja.Value).Month & "," & CDate(Hdffcaja.Value).Day & ")"
        LLenarParamDia()
        muestramodal("ImprimePDF.aspx?doc=repcaja&rep1=resmay1&for1=" & filtro & "&for2=" & Vg.CRformulaSel)
    End Sub


    Protected Sub MinutaBan(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        If ValidaCampos() = False Then Return
        objcaja.CJ_CajaREPMTA(CDbl(HdfCsucur.Value), CDbl(Hdfcajero.Value), CDate(Hdffcaja.Value), CDbl(Hdfccaja.Value), "CJ_DIA")
        muestramodal("ImprimePDF.aspx?doc=repcaja&rep1=caja_minutadep&parametro=cia," & Vg.cws(1).Trim & "|")
    End Sub

    Protected Sub MinutaBanCaja(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        If ValidaCampos() = False Then Return
        objcaja.CJ_CajaREPMTA(CDbl(HdfCsucur.Value), CDbl(Hdfcajero.Value), CDate(Hdffcaja.Value), CDbl(Hdfccaja.Value), "CJ")
        muestramodal("ImprimePDF.aspx?doc=repcaja&rep1=caja_minutadepXCAJA&parametro=cia," & Vg.cws(1).Trim & "|")
    End Sub

    Protected Sub ROC1(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        If ValidaCampos() = False Then Return
        muestramodal("ImprimePDF.aspx?doc=repcaja&rep1=ROC_detallecaja&for1={cbmovcaj_e.fcaja}=Date(" & Format(CDate(Hdffcaja.Value), "yyyy,MM,dd") & ")&for2={cbmovcaj_e.creferencia}<>0&for3={cbmovcaj_e.csucur_caja}=" & HdfCsucur.Value & "&for4={cbmovcaj_e.ccajero}=" & Hdfcajero.Value & "&for5={cbmovcaj_e.ccaja}=" & Hdfccaja.Value & "&parametro=cia," & Vg.cws(1).Trim & "|")
    End Sub

    Protected Sub ROC2(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        If ValidaCampos() = False Then Return
        muestramodal("ImprimePDF.aspx?doc=repcaja&rep1=ROC_detallecaja&for1={cbmovcaj_e.fcaja}=Date(" & Format(CDate(Hdffcaja.Value), "yyyy,MM,dd") & ")&for2={cbmovcaj_e.creferencia}<>0&parametro=cia," & Vg.cws(1).Trim & "|")
    End Sub

    Protected Sub abrircaja(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        If Vg.wasi.TienePermiso2(Vg.Numero, "cobros", "ABRIRCAJACERRADA", Vg.licencia) = False Then
            sis3.gui.msg.nuevo("No tiene Permiso para Realizar esta Opercación", "Visor Caja")
            Exit Sub
        End If
        Dim msn As String = ""

        If ValidaCampos() = False Then Return
        If Vg.tec.CJ_ReAbrirCaja(CDbl(HdfCsucur.Value), CDbl(Hdfcajero.Value), CDate(Hdffcaja.Value), CDbl(Hdfccaja.Value), Vg.licencia, msn) Then
            Me.GdvCajas.Reload()
            sis3.gui.msg.nuevo(msn)
        Else
            sis3.gui.msg.nuevo(msn)
        End If
    End Sub

    Protected Sub remayoriza(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)

        If Vg.wasi.TienePermiso2(Vg.Numero, "cobros", "REMAYORIZARCAJA", Vg.licencia) = False Then
            sis3.gui.msg.nuevo("No tiene Permiso para Realizar esta Operación", "Visor Caja")
            Exit Sub
        End If


        Dim msn As String = ""
        If HdfCsucur.Value = "" Or Hdfcajero.Value = "" Or Hdfccaja.Value = "" Or Hdffcaja.Value = "" And txtestado.Text.Trim = "" Then Return

        If Asidllcon00.wasi.MCerrado(CDate(Hdffcaja.Value).Month * 100 + CDate(Hdffcaja.Value).Month, Vg.licencia) = True Then
            sis3.gui.msg.nuevo("La caja que intenta remayorizar pertenece a un mes con cierre definitivo, no puede ser remayorizada !!!", "Visor Caja")
            Exit Sub
        End If

        If txtestado.Text.ToUpper <> "CERRADA" Then
            sis3.gui.msg.nuevo("La caja que intenta remayorizar esta abierta, no puede ser remayorizada !!!", "Visor Caja")
            Exit Sub
        End If

        'Cambiado por el nuevo metodo de mayorizacion
        'If Vg.tec.CJ_RemayorizaCaja(CDbl(HdfCsucur.Value), CDbl(Hdfcajero.Value), CDate(Hdffcaja.Value), CDbl(Hdfccaja.Value), txtestado.Text.Trim.Substring(0, 1), Vg.licencia, msn) Then
        '    'SqlCaja.SelectCommand = HdfScaja.Value
        '    'SqlCaja.DataBind()
        '    'SqlMovCaja.SelectCommand = HdfMovCaja.Value
        '    'SqlMovCaja.DataBind()
        '    verCajas()
        '    CargaGrid(HdfMovCaja.Value, Store_GdvMovCajas)
        '    sis3.gui.msg.nuevo(msn)
        'Else
        '    sis3.gui.msg.nuevo(msn)
        'End If

        Dim xError As String
        ' Vg.cajas = objcaja.consulta(Vg.Numero, "C", , , Format(CDate(Hdffcaja.Value), "yyyyMMdd"), Hdfccaja.Value, HdfCsucur.Value)


        ' Dim indice As Integer = GvdCajasAbiertas.SelectedIndex
        Vg.cajaActiva = New sis3.cobros.caja(Vg.cajas, 0)
        Vg.cajaActiva.movimientosDet = Vg.cajaActiva.consultaMov(True)

        'Para otras compañias - Nicaragua
        If Vg.cwb(43) = True Then
            If Not Vg.cajaActiva.contabiliza2(Vg.cajaActiva) Then
                sis3.gui.msg.TopAdvertencia(xError)
                Exit Sub
            End If
        Else
            If Not Vg.cajaActiva.contabiliza(Vg.cajaActiva) Then
                sis3.gui.msg.TopAdvertencia(xError)
                Exit Sub
            End If
        End If

        If Vg.wcia = 10 Then

            Dim xSQL As String
            xSQL = "UPDATE Bank.ControlReembolso SET "
            xSQL += " Bank.ControlReembolso.numeames = Rec.fanomescont, Bank.ControlReembolso.numecomp = Rec.nlote"
            xSQL += " FROM Bank.ControlReembolso Reem INNER JOIN dbo.cbestadoctade Edo ON Reem.estado_cuenta = Edo.cestcta AND Reem.numero_cuota = Edo.nlinea"
            xSQL += " INNER JOIN cbrecpagos Rec ON Edo.cestcta = Rec.cestcta AND Edo.nlinea = Rec.ccuota"
            xSQL += " WHERE Rec.csucur_caja = " & Vg.cajaActiva.csucur & " AND Rec.ccajero = " & Vg.cajaActiva.ccajero & " AND Rec.fcaja = '" & Format(Vg.cajaActiva.fcaja, "yyyyMMdd") & "' AND Rec.ccaja =" & Vg.cajaActiva.ccaja
            Vg.EjecutaSQL(xSQL)

        End If

        sis3.gui.msg.nuevo("Remayorización de caja exitoso.<br>" & "Caja: " & Vg.cajaActiva.ccaja & "<br>Fecha: " & Vg.cajaActiva.fcaja)


    End Sub

    Protected Sub btExcelToolBar(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        'If HdfScaja.Value.ToString.Trim.Length = 0 Then Return
        Dim sql As String = "select csucur AS Suc, ccajero AS Cajero, fcaja AS Fecha, ccaja AS Caja, mconta AS Contab, mcaja AS Saldo, mprimas AS Primas, mpdeposito [Primas Dep], mvarios AS Varios, mbanco AS [Dep Banco], istatcaja AS Status, cprog AS Mayorizada from cbcaja "
        Export_ToExcell(sql, Vg.ConnectionStringMundisis)
    End Sub

    Public Function ValidaCampos() As Boolean
        ValidaCampos = True
        If HdfCsucur.Value = "" Or Hdfcajero.Value = "" Or Hdfccaja.Value = "" Or Hdffcaja.Value = "" Then
            sis3.gui.msg.nuevo("Debe seleccionar una caja.")
            Return False
        End If
    End Function

    Public Sub muestramodal(ByVal mensaje As String)
        Dim modal As New sis3.gui.modal(mensaje)
        modal.muestra()
    End Sub
#End Region

#Region "Eventos del Segundo TAB"

    Protected Sub ContCajaDetalle(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        Dim JsonRecord As String = e.ExtraParams("GdvMovCajas_Param")
        Dim gridData As Dictionary(Of String, String)() = Coolite.Ext.Web.JSON.Deserialize(Of Dictionary(Of String, String)())(JsonRecord)
        If gridData.Length > 1 Then
            sis3.gui.msg.nuevo("Debe seleccionar solo un movimimiento")
            Exit Sub
        End If
        For Each JColumn As IDictionary(Of String, String) In gridData
            wmes.Value = JColumn("fanomescont")
            wcompr.Value = JColumn("nlote")
            wresconta.Value = JColumn("cpago")
        Next

        If ValidaCampos() = False Then Return
        If ValidaDatosMovimientos() = False Then Return
       
        If objcaja.CreaResumenConta(CDbl(HdfCsucur.Value), CDbl(Hdfcajero.Value), CDate(Hdffcaja.Value), CDbl(Hdfccaja.Value), CDbl(wmes.Value), CDbl(wcompr.Value), 1, 0, CDbl(wresconta.Value), Vg.cws(3)) Then
            'muestramodal("FTotales_MovCaja.aspx?valor=conlin&csucur=" & HdfCsucur.Value & "&ccaja=" & Hdfccaja.Value & "&ccajero=" & Hdfcajero.Value & "&fcaja=" & Hdffcaja.Value)
            wucResasi1.Inicializa()
            winResasi.Show()
        End If
    End Sub

    Protected Sub Det_CajaSel(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        If ValidaCampos() = False Then Return

        xsql.Length = 0
        xsql.AppendLine("SELECT cajae.ccajero, cajae.csucur_caja, cajae.ccaja, convert(nvarchar,cajae.fcaja,103) as fcaja, cajae.cpago, cajae.creferencia, cajae.crelpago, cajae.cestcta, cajae.imovcaja, cajae.cmoneda, cajae.mcaja, ")
        xsql.AppendLine("cajae.mefe, cajae.mche, cajae.mtar, cajae.motros, cajae.mcajaloc, cajae.mcajaext, cajae.xrecibido, cajae.xobserva,  cajae.xporcuenta, cajae.xotros, cajae.iTipoSecuCj,")
        xsql.AppendLine("(case when cajae.ctransaccion = 0 then 32 else cajae.ctransaccion end) as ctransaccion, mau.Descripcion, cajae.fcontab, cajae.iestcont, cajae.nlote, cajae.fanomescont")
        xsql.AppendLine("FROM cbmovcaj_e cajae LEFT JOIN MAUTOCAJA_NET mau ON cajae.ctransaccion = mau.NASIPRE  ")
        xsql.AppendLine("WHERE cajae.csucur_caja={0} AND cajae.ccajero={1} AND cajae.fcaja='{2}' AND cajae.ccaja={3}")

        HdfMovCaja.Value = String.Format(xsql.ToString(), HdfCsucur.Value, Hdfcajero.Value, Format(CDate(Hdffcaja.Value), "yyyyMMdd"), Hdfccaja.Value)
        clngestiones.LlenarGridPanelDatos(HdfMovCaja.Value, Store_GdvMovCajas, True)
        'CargaGrid(HdfMovCaja.Value, Store_GdvMovCajas)
    End Sub

    Protected Sub Det_CajaDia(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        If ValidaCampos() = False Then Return
        HdfMovCaja.Value = "SELECT convert(nvarchar,cajae.fcaja,103) as fcaja, cajae.cpago, cajae.creferencia, cajae.crelpago, cajae.cestcta, cajae.imovcaja, cajae.cmoneda, cajae.mcaja, cajae.mefe, cajae.mche, cajae.mtar, cajae.motros, cajae.mcajaloc, cajae.mcajaext, cajae.xrecibido, cajae.xobserva, cajae.ctransaccion, mau.Descripcion, cajae.fcontab, cajae.iestcont, cajae.nlote, cajae.fanomescont FROM cbmovcaj_e cajae LEFT JOIN MAUTOCAJA_NET mau ON cajae.ctransaccion = mau.NASIPRE  WHERE cajae.fcaja='" & Format(CDate(Hdffcaja.Value), "yyyyMMdd") & "'"
        CargaGrid(HdfMovCaja.Value, Store_GdvMovCajas)
    End Sub

    Protected Sub Det_CajaMes(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        If ValidaCampos() = False Then Return
        HdfMovCaja.Value = "SELECT convert(nvarchar,cajae.fcaja,103) as fcaja, cajae.cpago, cajae.creferencia, cajae.crelpago, cajae.cestcta, cajae.imovcaja, cajae.cmoneda, cajae.mcaja, cajae.mefe, cajae.mche, cajae.mtar, cajae.motros, cajae.mcajaloc, cajae.mcajaext, cajae.xrecibido, cajae.xobserva, cajae.ctransaccion, mau.Descripcion, cajae.fcontab, cajae.iestcont, cajae.nlote, cajae.fanomescont FROM cbmovcaj_e cajae LEFT JOIN MAUTOCAJA_NET mau ON cajae.ctransaccion = mau.NASIPRE  WHERE YEAR(cajae.fcaja)*100+MONTH(cajae.fcaja)=" & CDate(Hdffcaja.Value).Year * 100 + CDate(Hdffcaja.Value).Month
        CargaGrid(HdfMovCaja.Value, Store_GdvMovCajas)
    End Sub

    Protected Sub Tot_CajaSel(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        If ValidaCampos() = False Then Return
        'muestramodal("FTotales_MovCaja.aspx?valor=total&csucur=" & HdfCsucur.Value & "&ccaja=" & Hdfccaja.Value & "&ccajero=" & Hdfcajero.Value & "&fcaja=" & Hdffcaja.Value)
        fconcaja_tot1.Inicializa(1, Hdffcaja.Value, HdfCsucur.Value, Hdfcajero.Value, Hdfccaja.Value)
        winFconcaja_tot.Show()
    End Sub


    Protected Sub Tot_CajaDia(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        If ValidaCampos() = False Then Return
        'muestramodal("FTotales_MovCaja.aspx?valor=dia&csucur=" & HdfCsucur.Value & "&ccaja=" & Hdfccaja.Value & "&ccajero=" & Hdfcajero.Value & "&fcaja=" & Hdffcaja.Value)
        fconcaja_tot1.Inicializa(2, Hdffcaja.Value)
        winFconcaja_tot.Show()
    End Sub

    Protected Sub Tot_CajaMes(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        If ValidaCampos() = False Then Return
        'muestramodal("FTotales_MovCaja.aspx?valor=mes&csucur=" & HdfCsucur.Value & "&ccaja=" & Hdfccaja.Value & "&ccajero=" & Hdfcajero.Value & "&fcaja=" & Hdffcaja.Value)
        fconcaja_tot1.Inicializa(3, Hdffcaja.Value)
        winFconcaja_tot.Show()
    End Sub

    Public Function ValidaDatosMovimientos() As Boolean
        ValidaDatosMovimientos = True
        If wmes.Value = "" Or wcompr.Value = "" Or wresconta.Value = "" Then
            sis3.gui.msg.nuevo("Debe seleccionar un movimiento.")
            Return False
        End If
    End Function


    ''' <summary>
    ''' Impresión de documentos de recibo de caja una vez generados
    ''' </summary>
    ''' <returns>boolena</returns>
    ''' <remarks>Rubén Tamayo</remarks>
    <Coolite.Ext.Web.AjaxMethod()> _
    Public Function ImprimeROC(ByVal record As String) As Boolean
        Try
            Dim jsr As String = record
            Dim Data As Dictionary(Of String, String)() = Coolite.Ext.Web.JSON.Deserialize(Of Dictionary(Of String, String)())(jsr)

            Vg.rep.Clear()
            Vg.fil.Clear()
            Vg.forCR.Clear()
            Dim i As Integer = 0

            If Not String.IsNullOrEmpty(jsr) And jsr <> "[]" Then
                For Each rw As IDictionary(Of String, String) In Data
                    Dim mcaja, mefe, mche, mtar, motros As Decimal
                    Dim dt As Data.DataTable
                    Dim itipomov As String, cestcta As Decimal, cpago As Decimal, letras As String, cmoneda As String
                    Dim tieneIV As Boolean = False
                    Array.Clear(Vg.Crformulas, 0, Vg.Crformulas.Length)

                    itipomov = rw!imovcaja.ToString().Trim()
                    cestcta = rw!cestcta
                    cpago = rw!cpago

                    If itipomov <> "IV" Then Vg.rep.Add(i & "|" & "ROC_V2") Else Vg.rep.Add(i & "|" & "ROC_IV")

                    xsql.Length = 0
                    xsql.AppendLine("SELECT MAX(cpago) cpago, MAX(cestcta) cestcta, MAX(fcaja) fcaja, MAX(creferencia) creferencia, MIN(xrecibido) xrecibido, MIN(xporcuenta) xporcuenta, MIN(xobserva) xobserva,")
                    xsql.AppendLine("SUM(mcaja) AS mcaja, SUM(mefe) AS mefe, SUM(mche) AS mche, SUM(mtar) AS mtar, SUM(motros) AS motros, MAX(xotros) AS xotros, MAX(cmoneda) AS cmoneda, MAX(iTipoSecuCj) iTipoSecuCj")
                    xsql.AppendLine("FROM cbmovcaj_e")
                    xsql.AppendLine("WHERE csucur_caja={0} AND ccajero={1} AND fcaja='{2}' AND ccaja={3}")

                    If cestcta <> 0 And itipomov = "CT" Then
                        xsql.AppendLine(String.Format("AND cestcta={0}", cestcta))

                        Dim dt2 As Data.DataTable
                        dt2 = db.EjecutarSelect(String.Format("select imovcaja from cbmovcaj_e where cestcta={0}", cestcta))
                        For Each r As Data.DataRow In dt2.Rows
                            If r!imovcaja = "IV" Then
                                tieneIV = True
                                Exit For
                            End If
                        Next

                        If tieneIV Then xsql.AppendLine(" AND imovcaja <> 'IV'")

                    Else
                        xsql.AppendLine(String.Format("AND cpago={0}", cpago))
                    End If

                    dt = db.EjecutarSelect(String.Format(xsql.ToString(), rw!csucur_caja, rw!ccajero, CDate(rw!fcaja).ToString("yyyyMMdd"), rw!ccaja))

                    If dt.Rows.Count = 0 Then
                        sis3.gui.msg.nuevo("No hay información en el estado de cuenta.")
                        Return False
                    Else
                        cpago = dt.Rows(0)!cpago
                        mcaja = dt.Rows(0)!mcaja
                        mefe = dt.Rows(0)!mefe
                        mche = dt.Rows(0)!mche
                        mtar = dt.Rows(0)!mtar
                        motros = dt.Rows(0)!motros
                        cmoneda = dt.Rows(0)!cmoneda
                    End If


                    Vg.Crformulas(0) = "roc='" & rw!creferencia & "'"
                    Vg.Crformulas(1) = "dd='" & Format(Day(rw!fcaja), "00") & "'"
                    Vg.Crformulas(2) = "mm='" & Format(Month(rw!fcaja), "00") & "'"
                    Vg.Crformulas(3) = "aaaa='" & Year(rw!fcaja) & "'"

                    Dim numero As New sis3.Numeros
                    numero.descripcionMoneda1 = VG.EjecutaSQL_escalar("SELECT RTRIM(xdescripcion_l) FROM mamonedas WHERE cmoneda='" & cmoneda & "'")

                    letras = LCase(numero.NumerosALetras(Math.Abs(mcaja)))
                    Dim xmcajaL As String = UCase(Mid(letras, 1, 1)) & Mid(letras, 2, Len(letras))

                    Vg.Crformulas(4) = "suma='" & xmcajaL & "'"
                    Vg.Crformulas(5) = "xrecibido='" & RTrim(Vg.asi.Apostrofe(IIf(IsDBNull(rw!xrecibido) = True, rw!xporcuenta, Mid(Trim(rw!xrecibido), 1, 80)))) & "'"
                    Vg.Crformulas(6) = "xporcuenta='" & RTrim(Vg.asi.Apostrofe(IIf(IsDBNull(rw!xporcuenta) = True, "", Mid(Trim(rw!xporcuenta), 1, 60)))) & "'"
                    Vg.Crformulas(7) = "xobserva='" & RTrim(Vg.asi.Apostrofe(IIf(IsDBNull(rw!xobserva) = True, "", rw!xobserva))) & "'"


                    If UCase(RTrim(rw!xotros)) <> "CAJA" Then
                        Vg.Crformulas(8) = "xotros='" & RTrim(rw!iTipoSecuCj) & " - " & RTrim(rw!xotros) & "'"
                    Else
                        Vg.Crformulas(8) = "xotros='" & RTrim(rw!iTipoSecuCj) & "'"
                    End If

                    xsql.Length = 0
                    xsql.AppendLine("SELECT ISNULL(SUM(r.mmonto),0) opagos FROM cbotrospagos r WHERE r.csucur_caja ={0} AND r.ccajero ={1} AND r.fcaja = '{2}' AND r.ccaja ={3}")
                    If cestcta <> 0 Then
                        xsql.AppendLine(String.Format("AND r.cestcta={0}", cestcta))
                    Else
                        xsql.AppendLine(String.Format("AND r.cpago={0}", cpago))
                    End If

                    dt = db.EjecutarSelect(String.Format(xsql.ToString(), rw!csucur_caja, rw!ccajero, CDate(rw!fcaja).ToString("yyyyMMdd"), rw!ccaja))

                    If dt.Rows.Count = 0 Then
                        Vg.Crformulas(9) = "opagos='0.00'"
                    Else
                        Vg.Crformulas(9) = "opagos='" & Convert.ToDecimal(dt.Rows(0)!opagos).ToString("#,##0.00") & "'"
                    End If

                    ' Detalle de los pagos Registrados
                    dt = Nothing
                    xsql.Length = 0
                    xsql.AppendLine("SELECT r.cnpoliza, ISNULL(SUM(r.mprima),0) prima, ISNULL(SUM(r.mgastos),0) gastos, ISNULL(SUM(r.motrosgas),0) ogastos, (ISNULL(SUM(r.motrosgas),0) + ISNULL(SUM(r.mgastos),0)) sgastos, ISNULL(SUM(r.minteres),0) AS interes, ISNULL(SUM(r.mimpuestos),0) impuesto")
                    xsql.AppendLine("FROM cbrecpagos r WHERE r.csucur_caja ={0} AND r.ccajero ={1} AND r.fcaja = '{2}' AND r.ccaja ={3}")

                    If cestcta <> 0 Then
                        xsql.AppendLine(String.Format("AND r.cestcta={0}", cestcta))
                    Else
                        xsql.AppendLine(String.Format("AND r.cpago={0}", cpago))
                    End If

                    xsql.AppendLine("Group BY r.cnpoliza")
                    dt = db.EjecutarSelect(String.Format(xsql.ToString(), rw!csucur_caja, rw!ccajero, CDate(rw!fcaja).ToString("yyyyMMdd"), rw!ccaja))


                    If dt.Rows.Count = 0 Then
                        Vg.Crformulas(10) = "prima='0.00'"
                        Vg.Crformulas(11) = "gastos='0.00'"
                        Vg.Crformulas(12) = "impuesto='0.00'"
                        Vg.Crformulas(13) = "interes='0.00'"
                        Vg.Crformulas(14) = IIf(mcaja <> 0, "total='" & Convert.ToDecimal(mcaja).ToString("#,##0.00") & "'", "total='0.00'")
                        Vg.Crformulas(23) = "ogastos='0.00'"
                        Vg.Crformulas(24) = "sgastos='0.00'"
                        Vg.Crformulas(25) = "cnpolizas=''"
                    Else
                        Vg.Crformulas(10) = "prima='" & Convert.ToDecimal(dt.Rows(0)!prima).ToString("#,##0.00") & "'"
                        Vg.Crformulas(11) = "gastos='" & Convert.ToDecimal(dt.Rows(0)!GASTOS).ToString("#,##0.00") & "'"
                        Vg.Crformulas(12) = "impuesto='" & Convert.ToDecimal(dt.Rows(0)!IMPUESTO).ToString("#,##0.00") & "'"
                        Vg.Crformulas(13) = "interes='" & Convert.ToDecimal(dt.Rows(0)!INTERES).ToString("#,##0.00") & "'"
                        Vg.Crformulas(14) = "total='" & Convert.ToDecimal(mcaja).ToString("#,##0.00") & "'"
                        Vg.Crformulas(23) = "ogastos='" & Convert.ToDecimal(dt.Rows(0)!OGASTOS).ToString("#,##0.00") & "'"
                        Vg.Crformulas(24) = "sgastos='" & Convert.ToDecimal(dt.Rows(0)!SGASTOS).ToString("#,##0.00") & "'"
                        Vg.Crformulas(25) = "cnpolizas='" & dt.Rows(0)!cnpoliza.ToString().Trim & "'"
                    End If

                    Vg.Crformulas(15) = "efectivo='" & Convert.ToDecimal(mefe).ToString("#,##0.00") & "'"

                    If mche <> 0 Then
                        xsql.Length = 0
                        xsql.AppendLine("SELECT cbcheques.crecibo, cbcheques.cbanco, cbcheques.mcheque, isnull(Bancos.xcliente, 'No disponible') as xcliente, cbcheques.ccheque")
                        xsql.AppendLine("From cbcheques LEFT Join Bancos On cbcheques.cbanco = Bancos.cci_rif Where (((cbcheques.crecibo) = " & cpago & "))")

                        dt = Nothing
                        dt = db.EjecutarSelect(xsql.ToString())

                        If dt.Rows.Count = 0 Then GoTo xch
                        Vg.Crformulas(16) = "cheque='" & Convert.ToDecimal(dt.Rows(0)!mcheque).ToString("#,##0.00") & "'"
                        Vg.Crformulas(17) = "ccheque='" & Trim(dt.Rows(0)!ccheque) & "'"
                        Vg.Crformulas(18) = "banco='" & Trim(dt.Rows(0)!xcliente) & "'"

                    Else
xch:
                        Vg.Crformulas(16) = "cheque='" & mche & "'"
                        Vg.Crformulas(17) = "ccheque='No disponible'"
                        Vg.Crformulas(18) = "banco='No disponible'"
                    End If

                    If mtar <> 0 Then
                        xsql.Length = 0
                        xsql.AppendLine("SELECT cbtarjeta.crecibo, cbtarjeta.ctarjeta, ISNULL(Sum(cbtarjeta.mmonto),0) AS mtarjeta ")
                        xsql.AppendLine("From cbtarjeta GROUP BY cbtarjeta.crecibo, cbtarjeta.ctarjeta, cbtarjeta.imovcaja HAVING (((cbtarjeta.crecibo)=" & cpago & "))")

                        dt = Nothing
                        dt = db.EjecutarSelect(xsql.ToString())

                        If dt.Rows.Count = 0 Then GoTo xmtar

                        If dt.Rows(0)!mtarjeta <> mtar Then
                            Vg.Crformulas(19) = "tarjeta='" & mtar & "'"
                        Else
                            Vg.Crformulas(19) = "tarjeta='" & Convert.ToDecimal(dt.Rows(0)!mtarjeta).ToString("#,##0.00") & "'"
                        End If
                        Vg.Crformulas(20) = "ctarjeta='" & Trim(dt.Rows(0)!ctarjeta) & "'"

                    Else
xmtar:
                        Vg.Crformulas(19) = "tarjeta='" & mtar & "'"
                        Vg.Crformulas(20) = "ctarjeta='No disponible'"
                    End If

                    Vg.Crformulas(21) = "motros='" & Convert.ToDecimal(motros).ToString("#,##0.00") & "'"
                    Vg.Crformulas(22) = "cpago='" & cpago & "'"

                    If cestcta <> 0 And itipomov = "CT" Then
                        If Not tieneIV Then
                            Vg.fil.Add("{cbmovcaj_e.cestcta}=" & cestcta)
                        Else
                            Vg.fil.Add("{cbmovcaj_e.cestcta}=" & cestcta & " AND {cbmovcaj_e.imovcaja}<>'IV'")
                        End If
                    Else
                        Vg.fil.Add("{cbmovcaj_e.cpago}=" & cpago)
                    End If


                    Vg.forCR.Add(New forCRClass(Vg.rep(i), Vg.Crformulas.Clone()))
                    Array.Clear(Vg.Crformulas, 0, Vg.Crformulas.Length)
                    i = i + 1
                Next

                Return True

            Else
                sis3.gui.msg.nuevo("Debe Seleccionar por lo menos un registro. Acción cancelada...", True)
                Return False
            End If
        Catch ex As Exception
            sis3.gui.msg.nuevo("Hubo un problema al generar la impresion del reporte. Acción cancelada...", True)
            Return False
        End Try



    End Function

#End Region

#Region "Tab Primas Pagadas"

    Protected Sub TPrimaRam_CajaSel(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        fconcaja_totpri1.Inicializa(1, Hdffcaja.Value, HdfCsucur.Value, Hdfcajero.Value, Hdfccaja.Value)
        winFconcaja_totpri.Show()
    End Sub

    Protected Sub TPrimaRam_CajaDia(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        fconcaja_totpri1.Inicializa(2, Hdffcaja.Value)
        winFconcaja_totpri.Show()
    End Sub

    Protected Sub TPrimaRam_CajaMes(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        fconcaja_totpri1.Inicializa(3, Hdffcaja.Value)
        winFconcaja_totpri.Show()
    End Sub

    Protected Sub DPrimaRam_CajaSel(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        HdfPagaPrima.Value = " SELECT convert(nvarchar,cbrecpagos.fcaja,103) as fcaja, cbrecpagos.cpago, cbrecpagos.crelpagolin, cbrecpagos.cnpoliza, cbrecpagos.cestcta, cbrecpagos.crecibo, cbrecpagos.ccuota, cbrecpagos.cmoneda," & _
                           " cbrecpagos.mpagado, cbrecpagos.mprima, cbrecpagos.mgastos, cbrecpagos.motrosgas, cbrecpagos.mimpuestos, cbrecpagos.minteres, " & _
                           " cbrecpagos.mproductor, cbrecpagos.msupervisor, cbrecpagos.mgerente " & _
                           " FROM cbrecpagos WHERE cbrecpagos.csucur_caja= " & HdfCsucur.Value & " AND cbrecpagos.ccajero= " & Hdfcajero.Value & " AND cbrecpagos.fcaja='" & Format(CDate(Hdffcaja.Value), "yyyyMMdd") & "' AND cbrecpagos.ccaja= " & Hdfccaja.Value
        CargaGrid(HdfPagaPrima.Value, Store_GdvPagoPrima)
    End Sub

    Protected Sub DPrimaRam_CajaDia(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        HdfPagaPrima.Value = " SELECT convert(nvarchar,cbrecpagos.fcaja,103) as fcaja, cbrecpagos.cpago, cbrecpagos.crelpagolin, cbrecpagos.cnpoliza, cbrecpagos.cestcta, cbrecpagos.crecibo, cbrecpagos.ccuota, cbrecpagos.cmoneda," & _
                           " cbrecpagos.mpagado, cbrecpagos.mprima, cbrecpagos.mgastos, cbrecpagos.motrosgas, cbrecpagos.mimpuestos, cbrecpagos.minteres, " & _
                           " cbrecpagos.mproductor, cbrecpagos.msupervisor, cbrecpagos.mgerente " & _
                           " FROM cbrecpagos WHERE cbrecpagos.fcaja='" & Format(CDate(Hdffcaja.Value), "yyyyMMdd") & "'"
        CargaGrid(HdfPagaPrima.Value, Store_GdvPagoPrima)
    End Sub

    Protected Sub DPrimaRam_CajaMes(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        HdfPagaPrima.Value = " SELECT convert(nvarchar,cbrecpagos.fcaja,103) as fcaja, cbrecpagos.cpago, cbrecpagos.crelpagolin, cbrecpagos.cnpoliza, cbrecpagos.cestcta, cbrecpagos.crecibo, cbrecpagos.ccuota, cbrecpagos.cmoneda," & _
                           " cbrecpagos.mpagado, cbrecpagos.mprima, cbrecpagos.mgastos, cbrecpagos.motrosgas, cbrecpagos.mimpuestos, cbrecpagos.minteres, " & _
                           " cbrecpagos.mproductor, cbrecpagos.msupervisor, cbrecpagos.mgerente " & _
                           " FROM cbrecpagos WHERE YEAR(cbrecpagos.fcaja)*100+MONTH(cbrecpagos.fcaja)=" & CDate(Hdffcaja.Value).Year * 100 + CDate(Hdffcaja.Value).Month
        CargaGrid(HdfPagaPrima.Value, Store_GdvPagoPrima)
    End Sub

    Protected Sub ExcelTab3(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        If HdfPagaPrima.Value.ToString.Trim.Length = 0 Then Return
        Export_ToExcell(HdfPagaPrima.Value, Vg.ConnectionStringMundisis)
    End Sub

    Protected Sub ComiGen(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        If ValidaCampos() = False Then Return
        If ValidaDatosPrimas() = False Then Return
        muestramodal("FTotales_MovCaja.aspx?valor=ComiGen&csucur=" & HdfCsucur.Value & "&ccaja=" & Hdfccaja.Value & "&ccajero=" & Hdfcajero.Value & "&fcaja=" & Hdffcaja.Value & "&cpago=" & HdfCpago.value & "&csubpago=" & Hdfcrelpagolin.value)
    End Sub

    Public Function ValidaDatosPrimas() As Boolean
        ValidaDatosPrimas = True
        If HdfCpago.Value = "" Or Hdfcrelpagolin.Value = "" Then
            sis3.gui.msg.nuevo("Debe seleccionar un movimiento.")
            Return False
        End If
    End Function
#End Region

#Region "Depositos en Bancos"

    Protected Sub TBan_CajaSel(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        fconcaja_totban1.Inicializa(1, Hdffcaja.Value, HdfCsucur.Value, Hdfcajero.Value, Hdfccaja.Value)
        winFconcaja_totban.Show()
    End Sub

    Protected Sub TBan_CajaDia(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        fconcaja_totban1.Inicializa(2, Hdffcaja.Value)
        winFconcaja_totban.Show()
    End Sub

    Protected Sub TBan_CajaMes(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        fconcaja_totban1.Inicializa(3, Hdffcaja.Value)
        winFconcaja_totban.Show()
    End Sub

    Protected Sub DBan_CajaSel(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        HdfDeptoBanco.Value = "SELECT convert(nvarchar,fcaja,103) fcaja, cpago, cmoneda, ctransaccion, TRABAN.Descripcion, mmonto FROM cbotrospagos INNER JOIN TRABAN ON cbotrospagos.ctransaccion = TRABAN.NASIPRE WHERE cbotrospagos.csucur_caja= " & HdfCsucur.Value & " AND cbotrospagos.ccajero= " & Hdfcajero.Value & " AND cbotrospagos.fcaja='" & Format(CDate(Hdffcaja.Value), "yyyyMMdd") & "' AND cbotrospagos.ccaja=" & Hdfccaja.Value
        CargaGrid(HdfDeptoBanco.Value, Store_GdvDeptoBanco)
    End Sub

    Protected Sub DBan_CajaDia(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        HdfDeptoBanco.Value = "SELECT convert(nvarchar,fcaja,103) fcaja, cpago, cmoneda, ctransaccion, TRABAN.Descripcion, mmonto FROM cbotrospagos INNER JOIN TRABAN ON cbotrospagos.ctransaccion = TRABAN.NASIPRE WHERE cbotrospagos.fcaja='" & Format(CDate(Hdffcaja.Value), "yyyyMMdd") & "'"
        CargaGrid(HdfDeptoBanco.Value, Store_GdvDeptoBanco)
    End Sub

    Protected Sub DBan_CajaMes(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        HdfDeptoBanco.Value = "SELECT convert(nvarchar,fcaja,103) fcaja, cpago, cmoneda, ctransaccion, TRABAN.Descripcion, mmonto FROM cbotrospagos INNER JOIN TRABAN ON cbotrospagos.ctransaccion = TRABAN.NASIPRE WHERE YEAR(cbotrospagos.fcaja)*100+MONTH(cbotrospagos.fcaja)=" & CDate(Hdffcaja.Value).Year * 100 + CDate(Hdffcaja.Value).Month
        CargaGrid(HdfDeptoBanco.Value, Store_GdvDeptoBanco)
    End Sub

    Protected Sub VerMes(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        If Hdffcaja.Value = "" Then Return
        HdfDeptoBanco.Value = "SELECT csucur_caja, ccajero , convert(nvarchar,fcaja,103) fcaja, ccaja, " & _
        "cpago, ntranpdp_linea , cestcta , cmoneda , ctransaccion Transaccion, TRABAN.Descripcion, mmonto , " & _
        "itipopago , iestado , iestcont,convert(nvarchar,fcaja,103) as 'Fechacont', fanomescont " & _
        "FROM cbotrospagos INNER JOIN TRABAN ON cbotrospagos.ctransaccion = TRABAN.NASIPRE  WHERE month(cbotrospagos.fcaja)= " & CDate(Hdffcaja.Value).Month
        CargaGrid(HdfDeptoBanco.Value, Store_GdvDeptoBanco)
    End Sub

    Protected Sub VerDia(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        If Hdffcaja.Value = "" Then Return
        HdfDeptoBanco.Value = "SELECT csucur_caja, ccajero, convert(nvarchar,fcaja,103) fcaja, ccaja, cpago, ntranpdp_linea, cestcta, cmoneda, ctransaccion, TRABAN.Descripcion, mmonto, itipopago, iestado, iestcont,convert(nvarchar,fcaja,103) as Fechacont, fanomescont FROM cbotrospagos INNER JOIN TRABAN ON cbotrospagos.ctransaccion = TRABAN.NASIPRE WHERE cbotrospagos.fcaja='" & Format(CDate(Hdffcaja.Value), "yyyyMMdd") & "'"
        CargaGrid(HdfDeptoBanco.Value, Store_GdvDeptoBanco)
        'SqlDeptoBanco.SelectCommand = HdfDeptoBanco.Value
        'SqlDeptoBanco.DataBind()
    End Sub

    Protected Sub Exceltab5(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        If HdfDeptoBanco.Value.ToString.Trim.Length = 0 Then Return
        Export_ToExcell(HdfDeptoBanco.Value, Vg.ConnectionStringMundisis)
    End Sub

#End Region

#Region "Tab Depositos de Primas"

    Protected Sub VDetalles(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        If ValidaCampos() = False Then Return
        HdfDeptoPrima.Value = "SELECT csucur_caja, ccajero, convert(nvarchar,fcaja,103) fcaja, ccaja, cpago, ntranpdp_linea, cestcta, cmoneda, ctransaccion, cnpoliza, mmonto, itipopago, iestado From cbotrospagos WHERE cbotrospagos.csucur_caja=" & HdfCsucur.Value & " AND cbotrospagos.ccajero=" & Hdfcajero.Value & " AND cbotrospagos.fcaja='" & Format(CDate(Hdffcaja.Value), "dd/MM/yyyy") & "' AND cbotrospagos.ccaja= " & Hdfccaja.Value & " AND ctransaccion=439"
        CargaGrid(HdfDeptoPrima.Value, Store_GdvDeptoPrima)
    End Sub

    Protected Sub VDia(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        If ValidaCampos() = False Then Return
        HdfDeptoPrima.Value = "SELECT csucur_caja, ccajero, convert(nvarchar,fcaja,103) fcaja, ccaja, cpago, ntranpdp_linea, cestcta, cmoneda, ctransaccion, cnpoliza, mmonto, itipopago, iestado From cbotrospagos WHERE cbotrospagos.fcaja='" & Format(CDate(Hdffcaja.Value), "dd/MM/yyyy") & "' AND ctransaccion=439"
        CargaGrid(HdfDeptoPrima.Value, Store_GdvDeptoPrima)
    End Sub

    Protected Sub excelTab4(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        If HdfDeptoPrima.Value.ToString.Trim.Length = 0 Then Return
        Export_ToExcell(HdfDeptoPrima.Value, Vg.ConnectionStringMundisis)

    End Sub

    Protected Sub Totalestab4(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)
        If ValidaCampos() = False Then Return
        HdfDeptoPrima.Value = "SELECT csucur_caja, ccajero, convert(nvarchar,fcaja,103) fcaja, ccaja, cpago, ntranpdp_linea, cestcta, cmoneda, ctransaccion, cnpoliza, mmonto, itipopago, iestado From cbotrospagos WHERE YEAR(cbotrospagos.fcaja)*100+MONTH(cbotrospagos.fcaja)=" & CDate(Hdffcaja.Value).Year * 100 + CDate(Hdffcaja.Value).Month & " AND ctransaccion=439"
        CargaGrid(HdfDeptoPrima.Value, Store_GdvDeptoPrima)
    End Sub

    Public Function ObtenerTotalesDP(ByVal Fcaja As Date, ByVal Cmoneda As String) As String
        Dim Val As Double = 0.0
        Dim adpt As New SqlClient.SqlDataAdapter("SELECT sum(mmonto) as deposito,cmoneda   From cbotrospagos WHERE cbotrospagos.fcaja='" & Format(Fcaja, "dd/MM/yyyy") & "' and ctransaccion=439 AND rtrim(cbotrospagos.cmoneda) ='" & Cmoneda & "' group by cmoneda", Vg.ConnectionStringMundisis)
        Dim Tabla As New DataTable
        adpt.Fill(Tabla)
        If Tabla.Rows.Count > 0 Then
            Val = Tabla.Rows(0)("deposito")
        End If
        Return Format(Val, "#,###,##0.00")
    End Function

#End Region

#Region "Tab Buesqueda Directa --> Busqueda d Movimientos de Caja"


    Protected Sub IraMov(ByVal sender As Object, ByVal e As Coolite.Ext.Web.AjaxEventArgs)

        Dim JsonRecord As String = e.ExtraParams("GdvMovCajasBUs_Pram")
        Dim gridData As Dictionary(Of String, String)() = Coolite.Ext.Web.JSON.Deserialize(Of Dictionary(Of String, String)())(JsonRecord)
        For Each JColumn As IDictionary(Of String, String) In gridData

            tabContainer.ActiveTabIndex = 1

            HdfCsucur.Value = JColumn("csucur_caja")
            Hdfcajero.Value = JColumn("ccajero")
            Hdffcaja.Value = JColumn("fcaja")
            Hdfccaja.Value = JColumn("ccaja")

            txtSucursal.Text = Vg.tec.DameSucursal(CInt(HdfCsucur.Value), Vg.licencia)
            txtCajero.Text = Vg.tec.DameNombre(CDbl(Hdfcajero.Value), Vg.licencia)
            txtfecha.Text = Hdffcaja.Value
            txtcaja.Text = Hdfccaja.Value

            HdfScaja.Value = "select csucur AS Suc, ccajero AS Cajero, fcaja AS Fecha, ccaja AS Caja, mconta AS Contab, mcontaext AS [Contab Ext], mcaja AS Saldo, mcajaext AS [Saldo Ext], mprimas AS Primas, mprimasext AS [Primas Ext], mpdeposito [Primas Dep], mpdepositoext AS [Primas Dep Ext], mvarios AS Varios, mvariosext AS [Varios Ext], mbanco AS [Dep Banco], mbancoext AS [Dep Banco Ext], istatcaja AS Status, cprog AS Mayorizada from cbcaja " & "Where csucur =" & HdfCsucur.Value & " AND ccajero =" & Hdfcajero.Value & " AND fcaja='" & Hdffcaja.Value & "' AND ccaja =" & Hdfccaja.Value & " order by fcaja desc"
            CargaGrid(HdfScaja.Value, Store_GdvCajas)
            LlenarGrid()
            pnlEast.Expand()
            Panel1.Collapse()
            HabilitarTabs()
        Next
    End Sub
#End Region

#Region "Eventos de Excell Coolite"

    Public Sub CargaGrid(ByVal Query As String, ByVal store As Coolite.Ext.Web.Store)
        clngestiones.LlenarGridPanelDatos(Query, store)
    End Sub

    Public Sub Store_GdvCajas_Submit(ByVal sender As Object, ByVal e As Coolite.Ext.Web.StoreSubmitDataEventArgs)
        Dim format As String = FormatType.Value.ToString
        Dim Xml As XmlNode = e.Xml
        Me.Response.Clear()

        Select Case format
            Case "xls"
                Me.Response.ContentType = "application/vnd.ms-excel"
                Me.Response.AddHeader("Content-Disposition", "attachment; filename=ListadoCaja.xls")
                Dim xtExcel As New XslCompiledTransform
                xtExcel.Load(Server.MapPath("Excel.xsl"))
                xtExcel.Transform(Xml, Nothing, Response.OutputStream)
        End Select
        Me.Response.End()
    End Sub

    Public Sub Store_GdvMovCajas_Submit(ByVal sender As Object, ByVal e As Coolite.Ext.Web.StoreSubmitDataEventArgs)
        Dim format As String = FormatType.Value.ToString
        Dim Xml As XmlNode = e.Xml
        Me.Response.Clear()

        Select Case format
            Case "xls"
                Me.Response.ContentType = "application/vnd.ms-excel"
                Me.Response.AddHeader("Content-Disposition", "attachment; filename=MovimientosCaja.xls")
                Dim xtExcel As New XslCompiledTransform
                xtExcel.Load(Server.MapPath("Excel.xsl"))
                xtExcel.Transform(Xml, Nothing, Response.OutputStream)
        End Select
        Me.Response.End()
    End Sub

    Public Sub Store_GdvPagoPrima_Submit(ByVal sender As Object, ByVal e As Coolite.Ext.Web.StoreSubmitDataEventArgs)
        Dim format As String = FormatType.Value.ToString
        Dim Xml As XmlNode = e.Xml
        Me.Response.Clear()

        Select Case format
            Case "xls"
                Me.Response.ContentType = "application/vnd.ms-excel"
                Me.Response.AddHeader("Content-Disposition", "attachment; filename=PagoPrimasCaja.xls")
                Dim xtExcel As New XslCompiledTransform
                xtExcel.Load(Server.MapPath("Excel.xsl"))
                xtExcel.Transform(Xml, Nothing, Response.OutputStream)
        End Select
        Me.Response.End()
    End Sub

    Public Sub Store_GdvDeptoPrima_Submit(ByVal sender As Object, ByVal e As Coolite.Ext.Web.StoreSubmitDataEventArgs)
        Dim format As String = FormatType.Value.ToString
        Dim Xml As XmlNode = e.Xml
        Me.Response.Clear()

        Select Case format
            Case "xls"
                Me.Response.ContentType = "application/vnd.ms-excel"
                Me.Response.AddHeader("Content-Disposition", "attachment; filename=DepositosPrima.xls")
                Dim xtExcel As New XslCompiledTransform
                xtExcel.Load(Server.MapPath("Excel.xsl"))
                xtExcel.Transform(Xml, Nothing, Response.OutputStream)
        End Select
        Me.Response.End()
    End Sub

    Public Sub Store_GdvDeptoBanco_Submit(ByVal sender As Object, ByVal e As Coolite.Ext.Web.StoreSubmitDataEventArgs)
        Dim format As String = FormatType.Value.ToString
        Dim Xml As XmlNode = e.Xml
        Me.Response.Clear()

        Select Case format
            Case "xls"
                Me.Response.ContentType = "application/vnd.ms-excel"
                Me.Response.AddHeader("Content-Disposition", "attachment; filename=DepositosBancos.xls")
                Dim xtExcel As New XslCompiledTransform
                xtExcel.Load(Server.MapPath("Excel.xsl"))
                xtExcel.Transform(Xml, Nothing, Response.OutputStream)
        End Select
        Me.Response.End()
    End Sub

    Public Sub Store_GdvMovCajasBUs_Submit(ByVal sender As Object, ByVal e As Coolite.Ext.Web.StoreSubmitDataEventArgs)
        Dim format As String = FormatType.Value.ToString
        Dim Xml As XmlNode = e.Xml
        Me.Response.Clear()

        Select Case format
            Case "xls"
                Me.Response.ContentType = "application/vnd.ms-excel"
                Me.Response.AddHeader("Content-Disposition", "attachment; filename=ListadoMovimientos.xls")
                Dim xtExcel As New XslCompiledTransform
                xtExcel.Load(Server.MapPath("Excel.xsl"))
                xtExcel.Transform(Xml, Nothing, Response.OutputStream)
        End Select
        Me.Response.End()
    End Sub
#End Region

#Region "Exportaciones a Excell"
    Public Sub Export_ToExcell(ByVal SQL As String, ByVal Conex As String)

        If SQL Is Nothing Or Conex Is Nothing Then Return

        Dim Sb As New StringBuilder
        Dim sw As New StringWriter(Sb)
        Dim htw As New HtmlTextWriter(sw)
        Dim page As New Page
        Dim form As New HtmlForm
        Dim Adpt As New SqlClient.SqlDataAdapter(SQL, Conex)
        Dim tabla As New DataTable
        Dim GridvieAux As New GridView

        'Dim Response As System.Web.HttpResponse

        Adpt.Fill(tabla)

        GridvieAux.AllowPaging = False
        GridvieAux.DataSourceID = Nothing
        GridvieAux.DataSource = tabla
        GridvieAux.DataBind()
        GridvieAux.EnableViewState = False

        page.EnableEventValidation = False
        page.DesignerInitialize()
        page.Controls.Add(form)
        form.Controls.Add(GridvieAux)
        page.RenderControl(htw)

        Response.Clear()
        Response.Buffer = True
        Response.ContentType = "application/vnd.ms-excel"
        Response.AddHeader("Content-Disposition", "attachment;filename=Asiento_sis.xls")
        Response.Charset = "UTF-8"
        Response.ContentEncoding = Encoding.Default
        Response.Write(Sb.ToString)
        Response.End()
    End Sub
#End Region

    Public Sub LimpiarDatos()
        HdfCsucur.Value = ""
        Hdfcajero.Value = ""
        Hdffcaja.Value = ""
        Hdfccaja.Value = ""
        txtSucursal.Text = ""
        txtCajero.Text = ""
        txtfecha.Text = ""
        txtcaja.Text = ""
        txtestado.Text = ""
        txtmayorizada.Text = ""
    End Sub

    Public Sub HabilitarTabs()
        tabDetalle.Enabled = True
        tabPrimas.Enabled = True
        tabDepositos.Enabled = True
        tabDepoBanco.Enabled = True
    End Sub

    Public Sub DeshabilitaTabs()
        tabDetalle.Enabled = False
        tabPrimas.Enabled = False
        tabDepositos.Enabled = False
        tabDepoBanco.Enabled = False
    End Sub

    Public Sub LLenarParam(Optional ByVal cta As Boolean = False)
        Dim titulo As String = "CAJA NO. " & Hdfccaja.Value & " DEL DIA " & Format(CDate(Hdffcaja.Value), "dd/MM/yyyy") & " CAJERO " & txtCajero.Text & " SUCURSAL " & txtSucursal.Text
        Array.Clear(Vg.Crformulas, 0, 30)
        Vg.rep.Clear()
        Vg.fil.Clear()
        Vg.Crformulas(0) = "Cia='" & Vg.cws(1) & "'"
        Vg.Crformulas(1) = "Titulo='" & titulo.Trim & "'"
        If cta = False Then
            Vg.Crformulas(2) = "Subtitulo='Caja por Cuenta'"
        Else
            Vg.Crformulas(2) = "Subtitulo='Caja por Cuenta Detallada'"
        End If
    End Sub

    Public Sub LLenarParamDia()
        Dim titulo As String = "CAJAS DEL DIA " & Format(CDate(Hdffcaja.Value), "dd/MM/yyyy")
        Array.Clear(Vg.Crformulas, 0, 30)
        Vg.rep.Clear()
        Vg.fil.Clear()
        Vg.Crformulas(0) = "Cia='" & Vg.cws(1) & "'"
        Vg.Crformulas(1) = "Titulo='" & titulo.Trim & "'"
        Vg.Crformulas(2) = "Subtitulo='Todas las Cajas'"
    End Sub
End Class
