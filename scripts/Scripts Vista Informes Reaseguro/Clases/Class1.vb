Imports System.Runtime.InteropServices
Imports CrystalDecisions.CrystalReports.Engine
Imports CrystalDecisions.Shared
Imports System.Data
Imports System.Data.SqlClient
Imports System.IO
Imports System.Collections.Generic

Public Class areas
    Public Shared administrador As String = "administrador"
    Public Shared entes As String = "clientes"
    Public Shared polizas As String = "polizas"
    Public Shared recibos As String = "recibos"
    Public Shared cobros As String = "cobros"
    Public Shared comisiones As String = "comisiones"
    Public Shared contabilidad As String = "contabilidad"
    Public Shared reaseguro As String = "reaseguro"
    Public Shared sig As String = "sig"
    Public Shared siniestros As String = "siniestros"
    Public Shared produccion As String = "produccion"
    Public Shared control As String = "control"
End Class

Public Class forCRClass
    Public KeyRep As String
    Public ForCR() As String


    Public Sub New()
    End Sub

    Public Sub New(ByVal keyRep As String, ByVal forCR() As String)
        Me.KeyRep = keyRep
        Me.ForCR = forCR
    End Sub

End Class

Public Class Messagebox

    Private Shared m_executingPages As Hashtable = New Hashtable

    Public Shared Sub Show(ByVal sMessage As String)
        REM con esto aparece el mensaje en primer plano dentro de la hoja web, tengo que ver como hago para que tenga las funciones de msgbox
        REM sirve solo para un mensaje con un solo boton de aceptacion
        If Not m_executingPages.Contains(HttpContext.Current.Handler) Then
            Dim executingPage As Page = DirectCast(HttpContext.Current.Handler, Page)
            If Not (executingPage Is Nothing) Then
                Dim messageQueue As Queue = New Queue
                messageQueue.Enqueue(sMessage)
                m_executingPages.Add(HttpContext.Current.Handler, messageQueue)
                AddHandler executingPage.Unload, AddressOf ExecutingPage_Unload
            End If
        Else
            Dim queue As Queue = CType(m_executingPages(HttpContext.Current.Handler), Queue)
            queue.Enqueue(sMessage)
        End If
    End Sub

    Private Shared Sub ExecutingPage_Unload(ByVal sender As Object, ByVal e As EventArgs)
        Dim queue As Queue = CType(m_executingPages(HttpContext.Current.Handler), Queue)
        If Not (queue Is Nothing) Then
            Dim sb As StringBuilder = New StringBuilder
            Dim iMsgCount As Integer = queue.Count
            sb.Append("<script language='javascript'>")
            Dim sMsg As String
            While System.Math.Max(System.Threading.Interlocked.Decrement(iMsgCount), iMsgCount + 1) > 0
                sMsg = CType(queue.Dequeue, String)
                sMsg = sMsg.Replace("" & Microsoft.VisualBasic.Chr(10) & "", "\n")
                sMsg = sMsg.Replace("""", "'")
                sb.Append("alert( """ + sMsg + """ );")
            End While
            sb.Append("</script>")
            m_executingPages.Remove(HttpContext.Current.Handler)
            HttpContext.Current.Response.Write(sb.ToString)
        End If
    End Sub
End Class

Public Class Win32
    <DllImport("user32.dll", CharSet:=CharSet.Auto)> _
    Public Shared Function MessageBox(ByVal hWnd As Integer, _
         ByVal txt As String, ByVal caption As String, _
         ByVal Typ As Integer) As IntPtr
    End Function
    Public Shared Function GetAllControls(ByVal container As Control) As Control()
        Dim al As New ArrayList
        Dim ctl As Control
        For Each ctl In container.Controls
            GetAllControlsHelper(ctl, al)
        Next
        Return al.ToArray(GetType(Control))
    End Function

    Public Shared Sub GetAllControlsHelper(ByVal container As Control, ByVal al As ArrayList)
        ' add this control to the ArrayList
        al.Add(container)
        ' add all its child controls, by calling this routine recursively
        Dim ctl As Control
        For Each ctl In container.Controls
            GetAllControlsHelper(ctl, al)
        Next
    End Sub
    Public Shared Function FindControl(ByVal ctlName As String, ByVal container As Control) As _
        Control
        ' retrieve an array with all the controls of the input container controls,
        '  and its sub-controls
        Dim ctls() As Control = GetAllControls(container)
        Dim ctl As Control

        For Each ctl In ctls
            ' loop through the returned controls, and return the one with the 
            ' wanted name, if present
            ctl = ctl.FindControl(ctlName)
            If (Not ctl Is Nothing) Then
                Return ctl
            End If
        Next
        FindControl = Nothing
    End Function
End Class

Public Class ACTUALIZADO
    Public Shared FECHA As String
    Public Shared Function DAME_DOC_ENDOSO(ByVal OFERTA As Integer) As CheckBoxList
        Dim rd As Data.SqlClient.SqlDataReader = VG.EjecutaSQL_reader("SELECT DISTINCT MACOBERTURAS.CCOBERTURA,MACOBERTURAS.xdescripcion_l FROM MACOBERTURAS,MACATACOB,OFPOLCOB WHERE macatacob.archivo = 'MATARIFA' AND MACATACOB.CCOBERTURA = MACOBERTURAS.CCOBERTURA  AND OFPOLCOB.CCOBER = MACOBERTURAS.CCOBERTURA AND OFPOLCOB.CPROCES =" & OFERTA, False)
        On Error GoTo NO
        While rd.Read
            Dim ITEM As New System.Web.UI.WebControls.ListItem
            DAME_DOC_ENDOSO.Items.Add(ITEM)
            ITEM.Value = rd.Item("MACOBERTURAS.CCOBERTURA")
            ITEM.Text = rd.Item("MACOBERTURAS.xdescripcion_l")
        End While
NO:
    End Function

    '---------------------------------------------------------------------------------------
    ' Procedimiento : elimina_oferta
    ' Uso           :         eliminar ofertas
    ' Fecha         :         11/12/2007
    ' Autor         :         JOSE RODRIGUEZ
    ' Proposito     :         ELIMINAR LAS oFERTAS QUE NO SE HAN CONFIRMADO
    ' 
    ' Variables del Entorno y funciones dependientes
    '               Entrada: CPROCES-REPRESENTA EL NUMERO DE OFERTA
    '               Funciones: DEPENDE DE LAS FUCIONES EjecutaSQL_escalar, EJECURASQL DE LA CLASE VG.
    'Base de Datos
    '               Tablas Modificadas:ofpolizarea,ofpolrea,oftarcer,OFPOLIZAS, OFRECIBOS,OFPOLCOB , VHOFCERTI, OFPROYECTOS,NBOFCERT.
    '---------------------------------------------------------------------------------------

    Public Function anula_oferta(ByVal cproces As Integer, ByVal USER As Integer) As Boolean
        ''On Error GoTo no
        Dim certificado, ESTADO As String
        anula_oferta = True

        Dim RD As Data.SqlClient.SqlDataReader = VG.EjecutaSQL_reader("select cramo from ofpolizas where cproces= " & cproces, False)

        If RD.Read() Then

            Select Case RD.Item("cramo")
                Case 1
                    certificado = "nbofcert"
                    ESTADO = "istatcer"
                Case 6
                    certificado = "vhofcert"
                    ESTADO = "istatcer"
                Case 81, 82, 83, 84
                    certificado = "ofproyectos"
                    ESTADO = "status"
            End Select

            VG.EjecutaSQL("UPDATE ofpolizas SET istatpol='C', xobserva = 'CANCELADA POR USUARIO " & USER & " FECHA: " & Now & "' where cproces =" & cproces)
            VG.EjecutaSQL("UPDATE ofrecibos SET iestadorec='C', xobserva = 'CANCELADA POR USUARIO " & USER & " FECHA: " & Now & "' where cproces =" & cproces)
            VG.EjecutaSQL("UPDATE ofpolcob SET istattar='C' where cproces =" & cproces)
            VG.EjecutaSQL("UPDATE ofpolrea SET iestado='N' where cproces =" & cproces)
            VG.EjecutaSQL("UPDATE ofpolizarea SET iestado='N' where cproces =" & cproces)
            VG.EjecutaSQL("UPDATE oftarcer SET istattar='N' where cproces =" & cproces)

            VG.EjecutaSQL("UPDATE " & certificado & " SET " & ESTADO & "='N', xobserva = 'CANCELADA POR USUARIO " & USER & " FECHA: " & Now & "' where cproces =" & cproces)

        End If

no:
        If Err.Number <> 0 Then
            anula_oferta = False
        End If

    End Function

    '---------------------------------------------------------------------------------------
    ' Procedimiento : anula_poliza
    ' Uso           :         anula polizas no contabilizadas.(no consideradas en cierres de caja)
    ' Fecha         :         11/12/2007
    ' Autor         :         JOSE RODRIGUEZ
    ' Proposito     :         anula LAS POLIZAS QUE NO SE HAN CONSIDERADO EN CIERRES DE CAJA
    ' 
    ' Variables del Entorno y funciones dependientes
    '               Entrada: CPOLIZA, FANOPOL, FMESPOL
    '               Funciones: DEPENDE DE LAS FUCIONES EjecutaSQL_escalar, EJECURASQL DE LA CLASE VG.
    'Base de Datos
    '               Tablas Modificadas:nbcerti,vhcerti,proyectos,adpoliza,adrecibos,adpolcob,adpolrea,adpolizarea,adpoltar
    '---------------------------------------------------------------------------------------
    Public Function anula_poliza(ByVal cpoliza As Integer, ByVal fanopol As Integer, ByVal fmespol As Integer, ByVal USER As Integer, ByVal Canula As Char, Optional ByVal descripcion As String = "Ninguna") As Boolean
        'Dim tec As New Asidllcon00.TEC

        Dim certificado, estado As String
        anula_poliza = True

        Dim RD As Data.DataTable = VG.retornaDataset("select crecibo,IESTCONT,cramo from adrecibos where CPOLIZA= " & cpoliza & " AND fanopol= " & fanopol & " AND fmespol= " & fmespol, False).Tables(0)

        If RD.Rows.Count > 0 Then
            Select Case RD.Rows(0).Item("cramo")
                Case 1
                    certificado = "nbcerti"
                    estado = "istatcer"
                Case 6
                    certificado = "vhcerti"
                    estado = "istatcer"
                Case 81, 82, 83, 84
                    certificado = "proyectos"
                    estado = "status"
            End Select

            If VG.wpais = 505 Then
                certificado = tec.DameARCH_DT(CShort(RD.Rows(0).Item("cramo")), "ADMON")
                estado = "istatcer"
                If certificado = "proyectos" Then estado = "status"
            End If

            If Trim(RD.Rows(0).Item("IESTCONT")) = "P" Then
                Try
                    Dim CAUSA As String

                    CAUSA = vbCrLf & "ANULADA POR USUARIO " & USER & " FECHA: " & Format(Now, "dd/MM/yyyy") & " **Dia/Mes/Año** , DEBIDO A LA SIGUIENTE CAUSA: " & Trim(VG.EjecutaSQL_escalar("SELECT XDESCRIPCION_L FROM MACODIGOS WHERE RTRIM(XSINONIMO) ='CANULA' AND RTRIM(CCODIGO) = '" & Canula & "'", False)) & vbCrLf & "Descripción Extra de la Anulación:" & vbCrLf & descripcion

                    VG.EjecutaSQL("UPDATE adpoliza SET fanulacion = '" & Format(Today, "dd/MM/yyyy") & "', canula= '" & Canula & "', istatpol='A', xobserva = rtrim(xobserva) + '" & CAUSA & "' where CPOLIZA= " & cpoliza & " AND fanopol= " & fanopol & " AND fmespol= " & fmespol)

                    VG.EjecutaSQL("UPDATE " & certificado & " SET " & estado & "='N', xobserva = 'CANCELADA POR USUARIO " & USER & " FECHA: " & Format(Now, "dd/MM/yyyy") & " **Dia/Mes/Año** ' where CPOLIZA= " & cpoliza & " AND fanopol= " & fanopol & " AND fmespol= " & fmespol)

                    tec.AnulaREC(RD.Rows(0).Item("crecibo"), "0", VG.licencia)
                Catch

                    anula_poliza = False
                    GoTo no

                End Try
            End If

        Else
            anula_poliza = False
            GoTo no
        End If
no:
        If Err.Number = 0 Then
            anula_poliza = True
        End If

    End Function


    Public Shared Function EJECUTA_ACCION(ByVal USUARIO As Integer, ByVal SECCION As String, ByVal ACCION As String) As Boolean
        Dim RD As SqlClient.SqlDataReader = VG.EjecutaSQL_reader("SELECT * FROM MAPERMISOS WHERE CCI_RIF = " & USUARIO.ToString & " AND RTRIM(APLICACION) = '" & Trim(SECCION) & "' AND RTRIM(OPERACION) = '" & Trim(ACCION) & "'", False)
        EJECUTA_ACCION = RD.Read
    End Function
End Class

Public Class VG

    Public mant As New sis3.Mantenimiento.Lugares 'Instancia de objeto para la clase Lugares esto en fución del catalofo de edificios
    Public mifiltro As New Sis.Datos.Filtro
    Public evento As New Sis.Herramientas.GestionEventos
    Public mioferta As Sis.Cln.Emsion.Oferta 'se instancia al crear la oferta
    Public miControl As New Sis.Herramientas.CargaControl 'instanciado para toda la sesion
    Public usuario As Sis.Cln.Entes.Usuario
    Public objClnUsuario As New sis3.Seguridad.Usuarios 'ClnUsuario
    Public miOfertaRen As Sis.Cln.persistencia.OfertaRenovacion
    Public miOfertaNuevas As Sis.Cln.misOfertas.OfertasNuevas
    'Jose Rodriguez: esta vaiable indica si se ha realizado en el dia alguna exportacion a GEA
    'Public Shared exporta_gea As Boolean

    Public opoliza As sis3.Emision.Poliza

    'Rubén: Entidad Siniestro
    Public Siniestro As sis3.Siniestros.Siniestro
    Public HPermiso As String = String.Empty
    Public HAplicacion As String = String.Empty
    Public HSolicitaPermi As Boolean = False
    Public grupo_coberturas As New ArrayList

    Public er As New Sis.Herramientas.ManejoErrores
    Public tec As New Asidllcon00.TEC
    Public wasi As New Asidllcon00.wasi
    Public cob As New Asidllcon00.sis.cln.tar.Cobertura
    Private m_ifrecuencia As String
    Private m_cforcob As Integer
    Private m_Endoso As Integer
    Private m_qNumEndoso As Integer

    Public Property qNumEndoso() As Integer
        Get
            Return m_qNumEndoso
        End Get
        Set(ByVal value As Integer)
            m_qNumEndoso = value
        End Set
    End Property
    Public Property Endoso() As Integer
        Get
            Return m_Endoso
        End Get
        Set(ByVal value As Integer)
            m_Endoso = value
        End Set
    End Property
    Public Property Cforcob() As Integer
        Get
            Return m_cforcob
        End Get
        Set(ByVal value As Integer)
            m_cforcob = value
        End Set
    End Property
    Public Property Ifrecuencia() As String
        Get
            Return m_ifrecuencia
        End Get
        Set(ByVal value As String)
            m_ifrecuencia = value
        End Set
    End Property

    REM variables de la instalación
    Public oferta As Boolean
    Public Shared Boferta = False
    Public Shared consDefault = True
    Public Shared licencia As String
    Public Shared cwb(50) As Boolean
    Public Shared cws(100) As String
    REM variables de instalacion
    Public Shared ConnectionStringSIS As String
    Public Shared ConnectionStringMundisis As String
    Public Shared oleconMUN = ConnectionStringMundisis
    Public Shared Oleconsis = ConnectionStringSIS
    Public asi As New Asidllcon00.wasi
    Public Numero As Double
    Public Trato As String
    Public nombre As String
    Public apellido As String
    Public ApelNomb As String
    Public CartasNombre As String
    Public telefono As String
    Public Fax As String
    Public email As String
    Public BSoloLectura As Boolean
    Public BSoloProductor As Boolean
    Public Soloproductor As Double
    Public BAdministrador As Boolean
    Public BClientes As Boolean
    Public Bpolizas As Boolean
    Public BRecibos As Boolean
    Public Bcobros As Boolean
    Public Bcomisiones As Boolean
    Public Bcontabilidad As Boolean
    Public Breaseguro As Boolean
    Public BCajero As Boolean
    Public Bbancarios As Boolean
    Public Bempresas As Boolean
    Public Bcontrol As Boolean
    Public Bsiniestros As Boolean
    Public Bproduccion As Boolean
    Public categoria As Integer
    Public usersis As String
    Public wctipoprod As Double
    Public wproductor As Double
    'temp pruebas de concurrencia 28/11/2008
    'Public tec As New Asidllcon00.TEC
    Public wpage As Integer
    Public wsql As String
    Public wcliente As Double
    Public wcid As String
    Public xwtenedor As Double
    Public wsaldoten As Double
    Public xdamenombre As String
    Public wproces As String
    Public wpoliza As String
    Public wcnpoliza_mae As String 'MaxTeen. 18/12/2008: No. de Póliza Madre
    Public wcpoliza_mae As Double 'MaxTeen. 18/12/2008: Código de Póliza Madre
    Public wccerti_mae As Double 'MaxTeen. 18/12/2008: Código del certifcado Madre
    Public wpol As Double
    Public wanopol As Double
    Public wmespol As Integer
    Public wcodme As Boolean 'Moneda extranjera
    Public wcodaux As Boolean 'Auxiliar obligatorio
    Public wtipoaux As String
    Public wctamoneda As Integer
    Public wctades As String

    'Public saldosRamo As SqlDataReader
    Public numRemesa As Integer

    REM publicas para asientos

    Public wcompro As Double
    Public wanomes As Integer
    Public cargadeinicio As Boolean

    REM campos de compania
    Public wgrupos As Integer
    'Public wgrupo(10) As Integer   'requerido x contabilidad
    Public wgrupo As String 'req x administracion
    Public wnivel(10) As String
    Public wsepa As String
    Public wcodilon As Integer

    Public cproces_cumulo As Integer

    Public wpandes As String
    Public wpanori As String

    Public wrecibo As Double
    Public wedocta As Double
    Public wzona As String


    Public wcontrea As Integer
    Public wramorea As Integer
    Public wpprorrata As Double
    Public necesito_mas_info As Boolean
    Public wmmontorec As Double

    Public wguion As Integer
    Public wpaso As Integer
    Public cload As Boolean
    Public llamada As Integer
    Public llamadaasignada As Integer
    Public memo As String
    'con proposito de consultas
    Public fdesde As String
    Public fhasta As String
    Public femision As String
    Public wpresta As String
    Public wcober As String
    Public tipopol As String
    Public certi As String
    Public cpoliza As String
    Public fanopol As String
    Public fmespol As String
    Public ofertas As Boolean
    Public consulta As Boolean
    Public cbenef As String
    Public pbeneficio As String
    Public wramo As String
    Public wramoint As Integer
    Public NumEndoso As Integer
    Public EndosoName As String
    Public Shared Oferta_Endoso As Boolean 'Varaiable para identificar si es una oferta de endoso
    Public SignoEndoso

    Public cpolmae As String
    Public wpagina As String
    Public wcia As Integer
    Public Shared wpais As Integer
    Public wsucur As Integer
    Public vigencia As String
    Public forigen As String

    ' Variables para impresion de documentos
    Public rep As New ArrayList
    Public fil As New ArrayList
    Public forCR As New List(Of forCRClass)

    Public rNBOFCERT As regNBOFCERT

    '  Variables de reportes JAMO
    Public misreportes As String
    Public misplantillas As String
    Public CReporte As String
    Public Ctitulo As String
    Public CRformulaSel As String
    Public Crformulas(30) As String
    Public CrParametros As New ArrayList
    Public Craimpresora As Boolean
    Public Crtopdf As Boolean
    Public CrNombre As String ' Nombre del archivo PDF con path completo

    'cadena q hace de bandera para la carga de los PDF en ImprimePDF mientras espera a q el proceso termine.
    Public CadenaPDF As String


    'agregadas para adpatar la dll asi.tec 27/07/2007 -TONY
    Public wplan As String
    Public wcproces As Double
    Public wmoneda As String
    Public wtipopol As String
    Public wccerti As Double
    Public wccober As String
    Public wmodelo As String

    'Para soportar ado JAMO  
    Public Const adOpenForwardOnly As Integer = 0
    Public Const adOpenKeyset As Integer = 1
    Public Const adOpenDynamic As Integer = 2
    Public Const adOpenStatic As Integer = 3

    '---- LockTypeEnum Values ----
    Public Const adLockReadOnly As Integer = 1
    Public Const adLockPessimistic As Integer = 2
    Public Const adLockOptimistic As Integer = 3
    Public Const adLockBatchOptimistic As Integer = 4
    Public Const adUseClient As Integer = 3

    'caja
    Public cajas As Generic.List(Of sis3.cobros.caja)
    Public cajaActiva As sis3.cobros.caja
    Public detEC As sis3.cobros.EstadoCta.detalleEC
    Public ECMae As sis3.cobros.EstadoCta

    Public DEtalleSASuma As Double
    Public DEtalleSAIncendio As String

    '---- Estrcturas ----
    Public Structure regNBOFCERT
        Dim cproces As Double
        Dim ccerti As Double
        Dim u_version As String
        Dim descripcion As String
        Dim cramo As Integer
        Dim cpoliza As Double
        Dim fanopol As Integer
        Dim fmespol As Integer
        Dim cplan As String
        Dim cagrupa As Double
        Dim itipoprod As String
        Dim casegurado As Double
        Dim ctenedor As Double
        Dim cbeneficiario As Double
        Dim cacreedor As Double
        Dim cmercado As Integer
        Dim cactividad As Double
        Dim pactividad As Double
        Dim criesgo As Integer
        Dim priesgo As Double
        Dim cclaries As Integer
        Dim cclarie As Integer
        Dim imodcon As String
        Dim cultrec As Double
        Dim xdirecob As String
        Dim ctipotec As Integer
        Dim ctipoest As Integer
        Dim ctipopar As Integer

        Dim ctecest As Integer '28/11/2003 77
        Dim ctipopiso As Integer '28/11/2003 77
        Dim ctipocieloraso As Integer '28/11/2003 77
        Dim ctipoentrepiso As Integer '30/12/2003 77

        Dim ptasa As Double
        Dim ctipofac As Integer
        Dim cfachada As String
        Dim xpisos As Integer
        Dim cpais As Integer
        Dim cestado As String
        Dim cciudad As String
        Dim ccorregi As String
        Dim cbarriada As String
        Dim czonapos As String
        Dim czonsism As String
        Dim czoninun As String
        Dim czonmoti As String
        Dim cemppetr As Boolean
        Dim xfacaltu As String
        Dim ctipo As Integer
        Dim xobserva As String
        Dim xobsimp As String
        Dim bobsimp As String
        Dim ptotdes As Double
        Dim ptotrec As Double
        Dim brenova As String
        Dim istatcer As String
        Dim mvalor As Double
        Dim ptasbasi As Double
        Dim fdesde As Date
        Dim fhasta As Date
        Dim femision As Date
        Dim fbaja As String
        Dim fanulacion As String
        Dim crelpago As String
        Dim xnprestamo As String
        Dim preportable As Integer
        Dim bcumulo As Boolean
        Dim cprog As String
        Dim ifuente As String
        Dim bok As String
        Dim cerror As String
        Dim fingreso As Date
        Dim cusuario As Double
        Dim ccategoria As Integer
        Dim cusuarioauto As Double
        Dim ccategoriaauto As Integer
        Dim fultmod As Date
        Dim cusuariomod As Double
        Dim ccategoriamod As Integer
        Dim finca As String
        Dim rollo As String
        Dim documento As String
        Dim ccumulo As Integer
        Dim mapax As Double
        Dim mapay As Double
        Dim edificio As String
        Dim edificio_no As String
    End Structure

    Public Structure reg_Proyectos

        'valores de garantia
        Dim valor_garantia As Double
        Dim xgarantia As String

        'valores generales
        Dim cproces As Double
        Dim ccerti As Double
        Dim u_version As String
        Dim cpoliza As Double
        Dim fanopol As Integer
        Dim fmespol As Integer
        Dim cramo As Integer
        Dim cplan As String
        Dim cagrupa As Double
        Dim cci_afavor As Double
        Dim casegurado As Double
        Dim ctenedor As Double
        Dim cbeneficiario As Double
        Dim cacreedor As Double
        Dim NumProy As String
        Dim NombProy As String
        Dim Status As String
        Dim fdesde As Date
        Dim fhasta As Date
        Dim Suma As Double
        Dim NContrato As String
        Dim NLicitacion As String
        Dim NProyecto As String
        Dim cmercado As Integer
        Dim cactividad As Double
        Dim pactividad As Double
        Dim criesgo As Integer
        Dim priesgo As Double
        Dim cclaries As Integer
        Dim cclarie As Integer
        Dim cultrec As Double
        Dim femision As Date
        Dim fbaja As String
        Dim xobserva As String
        Dim xobsimp As String
        Dim bobsimp As String
        Dim fanulacion As Date
        Dim xnprestamo As String
        Dim brenova As String
        Dim canula As Integer
        Dim bcumulo As Boolean
        Dim cprog As String
        Dim ifuente As String
        Dim bok As String
        Dim cerror As String
        Dim fingreso As Date
        Dim cusuario As Double
        Dim ccategoria As Integer
        Dim cusuarioauto As Double
        Dim ccategoriaauto As Integer
        Dim fultmod As Date
        Dim cusuariomod As Double
        Dim ccategoriamod As Integer
        Dim num_oc As String

    End Structure
    Public Structure regMaentes
        'TONY
        Dim cci_rif As Integer
        Dim ipersona As Char
        Dim cid As String
        Dim itipopers As Char
        Dim cprofesion As Integer
        Dim categocli As Integer
        Dim czonapos As Integer
        Dim cpais As Integer
        Dim cciudad As Integer
        Dim cestado As Integer
        Dim ccorregi As Integer
        Dim cbarriada As Integer
        Dim cempresa As Integer
        Dim cgrupoecono As Integer
        Dim cactividad As Integer
        Dim cbanco As Integer

        Public Sub New(ByVal inicializa As Boolean)

        End Sub

        Public Sub inserta()

        End Sub

    End Structure

    Public Function tiene_permiso(ByVal numero As Integer, ByVal area As String, ByVal accion As String) As Boolean

        Dim Xcant As Integer = New sis3.db.db().EjecutarScalar("select count(cci_rif) from mapermisos where rtrim(aplicacion) = '" & area & "' and rtrim(operacion) = '" & Trim(accion) & "' and cci_rif = " & numero)

        If Xcant = 1 Then
            Return True
        End If
        Return False

    End Function


    Public Shared Function Validar_vigencia(ByVal sql As String, ByVal xuser As String) As Integer

        Dim resultado As Integer = New sis3.db.db().EjecutarScalar(sql)

        Return resultado

    End Function

    Public Sub New()

    End Sub
    Public Sub recientes_ofertas(ByVal usuario As String, ByVal master As MasterPage)
        'TONY
        'Esta funcion carga las 10 últimas ofertas creadas por el usuario.
        Try


            Dim rd As Data.SqlClient.SqlDataReader = VG.EjecutaSQL_reader("SELECT TOP 10 cproces,xasegurado FROM ofpolizas WHERE cusuario=" & usuario & " ORDER BY cproces DESC")
            Dim menu As UltraWebMenu
            menu = master.FindControl("UltraWebMenu1")

            Dim i As Integer = 0
            While rd.Read
                menu.Items(3).Items(2).Items(0).Items.Add(rd.Item("cproces") & " - " & rd.Item("xasegurado"))
                menu.Items(3).Items(2).Items(0).Items(i).TargetUrl = "tarificador.aspx?oferta=" & rd.Item("cproces")
                i += 1
            End While

            rd.Close()
        Catch ex As Exception

        End Try
    End Sub
    'Miguel
    'Este metodo carga en las variables VG los permisos del usuario verificados en la clase ClnUsuario.
    Public Sub CargarPermisos()

        Numero = objClnUsuario.Numero
        nombre = objClnUsuario.Nombre
        apellido = objClnUsuario.Apellido
        ApelNomb = objClnUsuario.ApelNomb
        Trato = objClnUsuario.Trato
        BAdministrador = objClnUsuario.Acceso_BAdministrador
        BClientes = objClnUsuario.Acceso_Bclientes
        Bpolizas = objClnUsuario.Acceso_Bpolizas
        BRecibos = objClnUsuario.Acceso_Brecibos
        Bcobros = objClnUsuario.Acceso_Bcobros
        Bcomisiones = objClnUsuario.Acceso_Bcomisiones
        Bcontabilidad = objClnUsuario.Acceso_Bcontabilidad
        Breaseguro = objClnUsuario.Acceso_Breaseguro
        Bcontrol = objClnUsuario.Acceso_Control
        Bsiniestros = objClnUsuario.Acceso_Siniestros
        Bproduccion = objClnUsuario.Acceso_Produccion
        email = objClnUsuario.Email
        wsucur = objClnUsuario.Id_Sucursal
        usersis = objClnUsuario.Usuario
    End Sub
    'Miguel
    'Esta funcion verifica si el usuario tiene permiso para realizar una operacion x, de acuerdo a su lista de permisos.
    Public Function Permido(ByVal Aplicacion As String, ByVal Operacion As String, ByVal List As System.Collections.Generic.List(Of sis3.Seguridad.Permisos)) As Boolean

        If objClnUsuario.BuscaPermisos(List, Aplicacion, Operacion) = True Then
            Return True
        Else
            Return False
        End If

    End Function
    Public Sub recientes_polizas(ByVal usuario As String, ByVal master As MasterPage)
        'TONY
        'Esta funcion carga las 10 últimas ofertas creadas por el usuario.
        Try


            Dim rd As Data.SqlClient.SqlDataReader = VG.EjecutaSQL_reader("SELECT TOP 10 cnpoliza, cpoliza, " & _
                                                                          "fanopol, fmespol, xasegurado, cproces " & _
                                                                          "FROM adpoliza WHERE cusuario=" & usuario & _
                                                                          " AND cpolnum=0 ORDER BY cproces DESC")

            Dim menu As UltraWebMenu
            menu = master.FindControl("UltraWebMenu1")

            Dim i As Integer = 0
            While rd.Read
                'menu.Items(3).Items(2).Items(1).Items.Add(rd.Item("cnpoliza") & " - " & rd.Item("xasegurado") & _
                '                                                " - " & rd.Item("fmespol") & "/" & rd.Item("fanopol"))
                'menu.Items(3).Items(2).Items(1).Items(i).TargetUrl = "Fpoliza.aspx?cproces=" & rd.Item("cproces")
                'MaxTeen...Revierto cambios de lectura por la llave de la pòliza
                'menu.Items(3).Items(2).Items(1).Items(i).TargetUrl = "Fpoliza.aspx?cproces=" & rd.Item("cproces") & "&cpoliza=" & rd.Item("cpoliza") & "&fanopol=" & rd.Item("fanopol") & "&fmespol=" & rd.Item("fmespol")
                i += 1
            End While

            rd.Close()

        Catch ex As Exception

        End Try

    End Sub

    Public Sub recientes_entes(ByVal usuario As String, ByVal master As MasterPage)
        'Luis Carlos
        'Esta funcion carga los 10 últimas entes creados por el usuario.

        Dim rd As Data.SqlClient.SqlDataReader = VG.EjecutaSQL_reader("SELECT TOP 10 cci_rif, xcliente FROM maentes WHERE cusuario='" & usuario & "' ORDER BY cci_rif DESC ")
        Dim menu As UltraWebMenu
        menu = master.FindControl("UltraWebMenu1")

        Dim i As Integer = 0
        While rd.Read
            'menu.Items(2).Items(2).Items.Add(rd.Item("cci_rif") & " - " & rd.Item("xcliente"))
            'menu.Items(2).Items(2).Items(i).TargetUrl = "maentes.aspx?cci_rif=" & rd.Item("cci_rif")
            'i += 1
        End While

        rd.Close()
    End Sub

    Public Sub recientes_siniestros(ByVal usuario As String, ByVal master As MasterPage)
        ''Luis Carlos
        ''Esta funcion carga los 10 últimas siniestros creados por el usuario.

        'Dim rd As Data.SqlClient.SqlDataReader = VG.EjecutaSQL_reader("SELECT TOP 10 NSiniestro, SUBSTRING(numepoli,1,2) AS abreviatura," & _
        '                                        " (SELECT xcliente FROM " & cws(7) & ".dbo.Maentes WHERE RTRIM(cci_rif) = numecedu) AS asegurado " & _
        '                                        "FROM msiniestros WHERE cusuario = " & usuario & " ORDER BY fingreso DESC", True)
        'Dim menu As UltraWebMenu
        'menu = master.FindControl("UltraWebMenu1")

        'Dim i As Integer = 0
        'While rd.Read

        '    menu.Items(4).Items(2).Items.Add("R - " & rd.Item("abreviatura").ToString & "- " & rd.Item("NSiniestro") & " - " & rd.Item("asegurado"))
        '    menu.Items(4).Items(2).Items(i).TargetUrl = "Siniestro.aspx?siniestro=" & rd.Item("NSiniestro")

        '    i += 1
        'End While

        'rd.Close()
    End Sub

    Public Sub RecientesAgrega()
        '--------------------------------------------------------------------
        'TONY
        '04/07/2007
        'AGREGA A LA TABLA MAENTES_USUARIOS UN ENTE VISITADO POR EL USUARIO
        'EN EL CAMPO MAENTES_RECIENTES, CONTROLADO POR CARACTERES DE TEXTO.
        'USADA JUNTO A Recientes_Carga.
        '
        'requisitos:
        'Se utilizan variables globales VG.usersis, VG.ConectionStringMundisis
        '--------------------------------------------------------------------

        Dim sql, id As String
        Dim resultado As Object


        Dim cn As New Data.SqlClient.SqlConnection(VG.ConnectionStringMundisis)
        cn.Open()

        sql = String.Format("SELECT cci_rif from SEGURIDAD where xuserid='{0}'", Me.usersis)
        Dim com As New Data.SqlClient.SqlCommand
        com.Connection = cn
        com.CommandText = sql
        id = com.ExecuteScalar

        sql = String.Format("SELECT maentes_recientes from maentes_usuarios where cci_rif='{0}'", id)
        com.CommandText = sql


        resultado = com.ExecuteScalar
        If IsDBNull(resultado) Then resultado = ""

        Dim cadena As String
        Dim pos, cuantos As Integer
        cadena = resultado

        'comprobar si ya existe la entrada
        Try
            If cadena.Contains(Me.wcliente) Then
                cn.Close()
                Exit Sub
            End If



            'ver cuantos registros recientes existen
            If cadena.Contains("*") Then
                cadena = cadena.Insert(0, Me.wcliente & "-")
            Else
                cadena = ""
                cadena = cadena.Insert(0, Me.wcliente & "-*0")
            End If
            cuantos = cadena.Substring(cadena.IndexOf("*") + 1, 1)

            'si hay 9 registros borro el ultimo registro de recientes
            If cuantos = 9 Then
                pos = cadena.LastIndexOf("-")
                cadena = cadena.Remove(pos, 1)
                pos = cadena.LastIndexOf("-")
                cadena = cadena.Substring(0, pos + 1)
                cadena = cadena.Insert(cadena.Length, "*9")
                'cadena = cadena.LastIndexOf("*")
            Else
                cadena = cadena.Replace("*" & cuantos, "*" & cuantos + 1)
            End If

            sql = String.Format("UPDATE maentes_usuarios set maentes_recientes='{0}' where cci_rif='{1}'", cadena, id)
            com.CommandText = sql
            com.ExecuteNonQuery()



            cn.Close()


        Catch ex As Exception

        End Try


    End Sub

    'Public Sub RecientesCarga(ByVal usersis As String, ByVal master As MasterPage)

    '    Try
    '        Dim sql As String
    '        Dim resultado As Object
    '        'Dim asi As New Asidllcon00.wasi

    '        Dim cn As New Data.SqlClient.SqlConnection(VG.ConnectionStringMundisis)
    '        cn.Open()

    '        ''sql = String.Format("SELECT cci_rif from SEGURIDAD where xuserid='{0}'", VG.usersis)
    '        Dim com As New Data.SqlClient.SqlCommand
    '        com.Connection = cn

    '        sql = String.Format("SELECT maentes_recientes from maentes_usuarios where cci_rif={0}", Me.Numero)
    '        com.CommandText = sql
    '        resultado = com.ExecuteScalar

    '        If IsDBNull(resultado) Then
    '            Me.RecientesAgrega()
    '            Exit Sub
    '        End If

    '        Dim menu As UltraWebMenu
    '        menu = master.FindControl("UltraWebMenu1")

    '        Dim cadena, subcadena, nombre As String
    '        Dim pos, i As Integer
    '        cadena = resultado


    '        Do
    '            pos = cadena.IndexOf("-")
    '            subcadena = cadena.Substring(0, pos)
    '            nombre = asi.DameNombre(subcadena, 0, 0, 0, 0, Me.licencia)
    '            'nombre = VG.xdamenombre
    '            menu.Items(2).Items(0).Items.Add(nombre)
    '            menu.Items(2).Items(0).Items(i).TargetUrl = "maentes.aspx?ente=" & subcadena


    '            cadena = cadena.Substring(pos + 1)
    '            i += 1
    '        Loop While cadena.Substring(0, 1) <> "*"

    '        cn.Close()

    '    Catch ex As Exception

    '    End Try

    'End Sub

    Public Function cpolizamax(ByVal codigo) As Integer


    End Function

    Public Function DameDesSuper(ByVal wcodigo As String) As String
        Dim connectionString As String
        On Error Resume Next
        Dim queryString As String = _
                "select * from catanic where cdgosupe ='" + wcodigo + "';"
        connectionString = VG.ConnectionStringSIS

        Using connection As New Data.SqlClient.SqlConnection(connectionString)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            DameDesSuper = reader.Item("xdes")
        End Using
    End Function
    Public Function DameDesnic(ByVal wcodigo As String) As String
        Dim connectionString As String
        On Error Resume Next
        Dim queryString As String = _
                "select desccont from catalogonic where cdgocont ='" + wcodigo + "';"
        connectionString = VG.ConnectionStringSIS

        Using connection As New Data.SqlClient.SqlConnection(connectionString)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            DameDesnic = reader.Item("desccont")
        End Using
    End Function
    Public Shared Function DameDescon(ByVal wcodigo As String) As String
        Dim connectionString As String
        On Error Resume Next
        Dim queryString As String = _
                "select desccont from catalogo where cdgocont ='" + wcodigo + "';"
        connectionString = VG.ConnectionStringSIS

        Using connection As New Data.SqlClient.SqlConnection(connectionString)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            DameDescon = reader.Item("desccont")
        End Using
    End Function
    ''

    Public Shared Function EXISTEregistro(ByVal tabla As String, ByVal criterio As String, ByVal campo As String, Optional ByVal sis As Boolean = False) As String
        EXISTEregistro = ""
        Dim connectionString As String
        On Error Resume Next
        Dim queryString As String = "SELECT " & campo & " FROM " & tabla & " " & criterio

        If sis = False Then
            connectionString = VG.ConnectionStringMundisis
        Else
            connectionString = VG.ConnectionStringSIS
        End If

        Using connection As New Data.SqlClient.SqlConnection(connectionString)

            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            Dim wcodigo As Date

            campo = reader.Item(campo)

            If Err.Number <> 0 Then
                EXISTEregistro = campo
            Else
                EXISTEregistro = campo
            End If


        End Using

    End Function


    Public Shared Function EXISTECLIENTE(ByVal wcodigo As String) As Boolean
        EXISTECLIENTE = False
        Dim connectionString As String
        On Error Resume Next
        Dim queryString As String = _
                "SELECT * FROM MAENTES WHERE rtrim(cid) ='" & Trim(wcodigo) & "'"
        connectionString = VG.ConnectionStringMundisis

        Using connection As New Data.SqlClient.SqlConnection(connectionString)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            wcodigo = reader.Item("cid")
            If Err.Number <> 0 Then
                EXISTECLIENTE = False
            Else
                EXISTECLIENTE = True
            End If
        End Using
    End Function

    Public Shared Function ponformatonu(ByVal wnumero As Double, ByVal largo As Integer) As String
        Dim wcampo As String
        wcampo = wnumero.ToString("#,##0.00")
        wcampo = Trim(wcampo)
        Dim l As Integer
        l = Len(wcampo)
        Do While largo > l
            wcampo = " " + wcampo
            l = Len(wcampo)
        Loop
        ponformatonu = wcampo
    End Function

    'verificar error de esta funcion al no retornar valores para un rango de cci_rif alto
    Public Shared Function Dameplan(ByVal ramo As String, ByVal plan As String) As String
        Dim connectionString As String
        On Error Resume Next
        Dim queryString As String = "SELECT * from maplanes where cramo = '" & ramo & "' And cplan = '" & plan & "'"
        connectionString = VG.ConnectionStringMundisis

        Using connection As New Data.SqlClient.SqlConnection(connectionString)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            Dameplan = reader.Item("xplan")
        End Using
    End Function

    Public Shared Function Damenombre(ByVal www As Integer) As String
        Try
            Damenombre = VG.EjecutaSQL_escalar("SELECT xcliente FROM MAENTES where cci_rif= '" & www & "'", False)
        Catch
            Damenombre = "ID. No Encontrado"
        End Try
    End Function

    Public Shared Function Dame_impuesto(ByVal ramo As Integer) As Decimal

        Try
            Dame_impuesto = VG.EjecutaSQL_escalar("select sum(pimpuesto) from maimpuestos where itipoimp = 'S' and cramo = " & ramo.ToString, False) / 100
        Catch
            Dame_impuesto = 0.0
        End Try

    End Function


    '    Public Shared Function DameNombre(ByRef WWW As Double) As String

    '        If WWW = 0 Then
    '            DameNombre = "Sin Asignar"
    '            wcid = "Sin Asignar"
    '            Exit Function
    '        End If
    '        If WWW = xwtenedor Then
    '            '   Si el Ente esta en memoria lo asigno
    '            DameNombre = xdamenombre
    '            Exit Function
    '        End If
    '        'DameNombre = IIf(asi.DameNombre(WWW, VG.wcid, VG.xwtenedor, VG.wsaldoten, VG.xdamenombre, VG.licencia).IsNullOrEmpty, " ", asi.DameNombre(WWW, VG.wcid, VG.xwtenedor, VG.wsaldoten, VG.xdamenombre, VG.licencia))
    '        On Error GoTo ERROR_DameNombre
    '        DameNombre = asi.DameNombre(WWW, VG.wcid, VG.xwtenedor, VG.wsaldoten, VG.xdamenombre, VG.licencia)
    'ERROR_DameNombre:
    '        If Err.Number <> 0 Then
    '            'MsgBox(Err.Description)
    '        End If

    '    End Function


    Public Function Damecampocli(ByVal wcampo As String) As String
        Damecampocli = asi.campocli(wcampo, wcliente, VG.licencia)
    End Function

    Public Function corre(ByVal wsql As String) As Boolean
        corre = asi.corre(wsql, VG.licencia)
    End Function

    Public Function corresis(ByVal wsql As String) As Boolean
        corresis = asi.corresis(wsql, VG.licencia)
    End Function

    Public Function DameXCall(ByVal wguion As Integer, ByVal wcate As Integer) As Integer
        DameXCall = asi.DameXCall(wguion, wcate, VG.licencia)
    End Function

    Public Function RunQuery(ByVal QueryString As String, Optional ByVal bSis As Boolean = False) As DataSet
        RunQuery = retornaDataset(QueryString, bSis)
    End Function
    Public Shared Function DameT1(ByVal wcod As String) As String
        Dim connectionString As String
        On Error Resume Next
        Dim queryString As String = _
                "SELECT codinicn1.n1, codinicn1.xdes FROM codinicn1 WHERE codinicn1.n1= '" + wcod + "';"
        connectionString = VG.ConnectionStringSIS

        Using connection As New Data.SqlClient.SqlConnection(connectionString)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            DameT1 = reader.Item("xdes")
        End Using
    End Function

    Public Shared Function DameT2(ByVal wcod As String) As String
        Dim connectionString As String
        On Error Resume Next
        Dim queryString As String = _
                "SELECT codinicn2.n2, codinicn2.xdes FROM codinicn2 WHERE codinicn2.n2= '" + wcod + "';"
        connectionString = VG.ConnectionStringSIS

        Using connection As New Data.SqlClient.SqlConnection(connectionString)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            DameT2 = reader.Item("xdes")
        End Using
    End Function

    Public Function DameT3(ByVal wcod As String) As String
        Dim connectionString As String
        On Error Resume Next
        memo = ""
        Dim queryString As String = _
                "SELECT codinicn3.n3, codinicn3.xdes, rollo FROM codinicn3 WHERE codinicn3.n3= '" + wcod + "';"
        connectionString = VG.ConnectionStringSIS

        Using connection As New Data.SqlClient.SqlConnection(connectionString)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            DameT3 = reader.Item("xdes")
            memo = reader.Item("rollo")


        End Using
    End Function

    Public Shared Function DameT4(ByVal wcod As String) As String
        Dim connectionString As String
        On Error Resume Next
        Dim queryString As String = _
                "SELECT codinicn4.n4, codinicn4.xdes FROM codinicn4 WHERE codinicn4.n4 = '" + wcod + "';"
        connectionString = VG.ConnectionStringSIS

        Using connection As New Data.SqlClient.SqlConnection(connectionString)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            DameT4 = reader.Item("xdes")
        End Using
    End Function

    Public Shared Function DameT5(ByVal wcod As String) As String
        Dim connectionString As String
        On Error Resume Next
        Dim queryString As String = _
                "SELECT codinicn5.n5, codinicn5.xdes FROM codinicn5 WHERE codinicn5.n5 = '" + wcod + "';"
        connectionString = VG.ConnectionStringSIS

        Using connection As New Data.SqlClient.SqlConnection(connectionString)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()

            reader.Read()
            DameT5 = reader.Item("xdes")
        End Using
    End Function

    Public Shared Function dameproxbancia() As Integer


        Dim connectionString As String
        On Error Resume Next
        Dim queryString As String = _
                "SELECT Max(dbancia.cbancia) AS MaxDecbancia FROM dbancia;"
        connectionString = VG.ConnectionStringSIS

        Using connection As New Data.SqlClient.SqlConnection(connectionString)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            dameproxbancia = reader.Item("MaxDecbancia") + 1
        End Using
    End Function

    Public Function DameCSUCUR_USR(ByVal cci_rif As Double) As Double
        Dim connectionString As String
        On Error Resume Next
        Dim queryString As String = _
                "SELECT ISNULL(csucur,0) AS csucur FROM seusuarios WHERE cusuario=" & cci_rif
        connectionString = VG.ConnectionStringMundisis
        Using connection As New Data.SqlClient.SqlConnection(connectionString)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            If reader.HasRows Then
                DameCSUCUR_USR = reader.Item("csucur")

            Else
                DameCSUCUR_USR = 0
            End If
        End Using
    End Function

    Public Shared Function DameMaxId(ByVal FLD As String, ByVal TBL As String, Optional ByVal sisglobal As Boolean = False) As Integer
        Dim connectionString As String
        On Error Resume Next
        Dim queryString As String = "SELECT MAX(" & FLD & ") AS MaxId FROM " & TBL & " "

        If sisglobal = False Then
            connectionString = VG.ConnectionStringMundisis
        Else
            connectionString = VG.ConnectionStringSIS
        End If

        Using connection As New Data.SqlClient.SqlConnection(connectionString)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            DameMaxId = reader.Item("MaxId") + 1
        End Using
    End Function

    Public Shared Function DameMaxcob(ByVal rec As String) As Integer
        Dim connectionString As String
        On Error Resume Next
        Dim queryString As String = "select max(convert(int,ccober)) as max from adpolcob where crecibo = '" & Trim(rec) & "'"
        connectionString = VG.ConnectionStringMundisis

        Using connection As New Data.SqlClient.SqlConnection(connectionString)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            DameMaxcob = reader.Item("max") + 1
        End Using
    End Function

    Public Function anula_poliza(ByVal cpoliza As Integer, ByVal fanopol As Integer, ByVal fmespol As Integer, ByVal USER As Integer, ByVal Canula As Char, Optional ByVal descripcion As String = "Ninguna") As Boolean
        'Dim tec As New Asidllcon00.TEC

        Dim certificado, estado As String
        anula_poliza = True

        Dim RD As SqlDataReader = VG.EjecutaSQL_reader("select crecibo,IESTCONT,cramo from adrecibos where CPOLIZA= " & cpoliza & " AND fanopol= " & fanopol & " AND fmespol= " & fmespol, False)

        If RD.Read = True Then
            Select Case RD.Item("cramo")
                Case 1
                    certificado = "nbcerti"
                    estado = "istatcer"
                Case 6
                    certificado = "vhcerti"
                    estado = "istatcer"
                Case 81, 82, 83, 84
                    certificado = "proyectos"
                    estado = "status"
            End Select

            If VG.wpais = 505 Then
                certificado = tec.DameARCH_DT(CShort(RD.Item("cramo")), "ADMON")
                estado = "istatcer"
                If certificado = "proyectos" Then estado = "status"
            End If

            If Trim(RD.Item("IESTCONT")) = "P" Then
                Try
                    Dim CAUSA As String

                    CAUSA = vbCrLf & "ANULADA POR USUARIO " & USER & " FECHA: " & Format(Now, "dd/MM/yyyy") & " **Dia/Mes/Año** , DEBIDO A LA SIGUIENTE CAUSA: " & Trim(VG.EjecutaSQL_escalar("SELECT XDESCRIPCION_L FROM MACODIGOS WHERE RTRIM(XSINONIMO) ='CANULA' AND RTRIM(CCODIGO) = '" & Canula & "'", False)) & vbCrLf & "Descripción Extra de la Anulación:" & vbCrLf & descripcion

                    VG.EjecutaSQL("UPDATE adpoliza SET fanulacion = '" & Format(Today, "dd/MM/yyyy") & "', canula= '" & Canula & "', istatpol='A', xobserva = rtrim(xobserva) + '" & CAUSA & "' where CPOLIZA= " & cpoliza & " AND fanopol= " & fanopol & " AND fmespol= " & fmespol)

                    VG.EjecutaSQL("UPDATE " & certificado & " SET " & estado & "='N', xobserva = 'CANCELADA POR USUARIO " & USER & " FECHA: " & Format(Now, "dd/MM/yyyy") & " **Dia/Mes/Año** ' where CPOLIZA= " & cpoliza & " AND fanopol= " & fanopol & " AND fmespol= " & fmespol)

                    tec.AnulaREC(RD.Item("crecibo"), "0", VG.licencia)
                Catch

                    anula_poliza = False
                    GoTo no

                End Try
            End If

        Else
            anula_poliza = False
            GoTo no
        End If
no:
        If Err.Number = 0 Then
            anula_poliza = True
        End If

    End Function

    Public Sub inicializa(ByVal licencia As String)
        VG.cwb = Asidllcon00.cwb
        VG.cws = Asidllcon00.cws

        If cwb(14) = False Then
            ConnectionStringSIS = Asidllcon00.ConnectionStringSIS
            ConnectionStringMundisis = Asidllcon00.ConnectionStringMundisis
        Else
            ConnectionStringSIS = Asidllcon00.ConnectionStringSIS
            ConnectionStringMundisis = Asidllcon00.ConnectionStringMundisis
        End If

        oleconMUN = Asidllcon00.oleconmun
        Oleconsis = Asidllcon00.oleconsis
        wcia = Val(Mid(licencia, 5, 2))
        wpais = Val(Mid(licencia, 1, 3))
        misreportes = cws(11)
    End Sub

    Public Shared Function DameCtaAnt(ByVal wcodigo As String) As String
        Dim connectionString As String
        On Error Resume Next
        Dim queryString As String = _
                "select cdgocontAnt from catalogonic where cdgocont ='" + wcodigo + "';"
        connectionString = VG.ConnectionStringSIS

        Using connection As New Data.SqlClient.SqlConnection(connectionString)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            DameCtaAnt = reader.Item("cdgocontAnt")
        End Using
    End Function

    Public Function DameCtaRamo(ByVal variable As Date, ByVal cramo As Integer, ByVal ccober As Integer)
        Try
            Dim sql As String
            'Me.cerror = 0
            'ValidaCierre(fecha)
            'If Me.cerror <> 0 Then Exit Sub

            'Moi obtiene ctaxramo
            sql = "SELECT cta_cble FROM cta_ramo where variable = " & variable & "and cramo = " & cramo & "and ccober = " & ccober
            DameCtaRamo = VG.EjecutaSQL_escalar(sql)

        Catch ex As Exception
            'mensaje
        End Try
    End Function

    Public Sub Carga_Cabecera(ByRef master As MasterPage)
        Dim usercabeza As Label = master.FindControl("luser")
        usercabeza.Text = ApelNomb 'global en esta clase. No se comparte
        Dim titulo As Label = master.FindControl("ltitulo")
        titulo.Text = Format(Today, "dd/MM/yyyy")
        Dim empresa As Label = master.FindControl("Lempresa")
        empresa.Text = VG.cws(1).Trim
        empresa.Visible = True
        Dim lOGO As Image = master.FindControl("Logo")
        lOGO.ImageUrl = VG.cws(12)
        lOGO.Visible = True
    End Sub

    '---------------------------------------------------------------------------------------
    ' Procedimiento : GeneraGEA
    ' Uso           :         Importacion de COBIS
    ' Fecha         :         05/09/2007
    ' Autor         :         José Rodriguez
    ' Proposito     :       Ingresar SIS los nuevo clientes registrados en el sistema COBIS
    '                       y modificar registros ya existentes
    ' 
    ' Variables del Entorno y funciones dependientes
    '               Endrada:
    '               Salida:
    'Base de Datos
    '               Tablas Modificadas: SOLO LECTURA (BD:  COBIS. TBL: Maentes_ente
    '---------------------------------------------------------------------------------------
    ' Bitacora de Modificaciones:
    ' 
    '
    '---------------------------------------------------------------------------------------

    '    Public Sub actcliente(ByRef ins As Integer, ByRef modi As Integer)

    '        On Error GoTo XX
    '        ins = 0
    '        modi = 0
    '        Dim cont As Integer = 0
    '        On Error Resume Next
    '        Dim connectionString1 As String
    '        Dim sql As String

    '        'connectionString1 = "DSN=SERVERASEG;Uid=desaaseg;Pwd=avance05;" ''pruebas en programacion
    '        connectionString1 = "DSN=SYBPRUEBA03;Uid=asegprep;Pwd=asegprep;"  ''usar para predesarrollo
    '        'connectionString1 = "DSN=GBCPROD1;Uid=asegprod;Pwd=asegprod1;"  ''usar para produccion
    '        Using connection As New Data.Odbc.OdbcConnection(connectionString1)
    '            Dim command As New Data.Odbc.OdbcCommand("select * from maentes_ente")

    '            If connection.State = ConnectionState.Closed Then connection.Open()

    '            command.Connection = connection
    '            Dim reader As Data.Odbc.OdbcDataReader = command.ExecuteReader

    '            If reader.HasRows = True Then 'DETERMINA SI HAY CAMPOS EN LA TABLA DE TRANSICION

    '                Dim con As New Conexion
    '                Dim dscliente As New Data.DataSet

    '                While reader.Read = True
    '                    sql = ""

    '                    If VG.EXISTECLIENTE(reader.Item("ma_cid").ToString) = False Then

    '                        If reader.Item("ma_tipo_ente").ToString = "I" Then
    '                            sql = "insert into maentes (cci_rif,cid,ipersona,ccirif_fox,xnombre,xapellido,xcliente, xdirecobro,xavecalle,xurbsector,xaparpost,fnacimien,xtelef1,xtelef2,xtelefhab,xtelefcel,xfax,xfaxhab,xemail,xemailhab,isexo,iedocivil,xreplegal,cidreplegal,itipopers,cprofesion,csucur,cpais,cestado,cciudad,ccorregi,cgrupoecono,cactividad,iexon_imp,u_version,istatcli) values ("
    '                            sql = sql & VG.DameMaxId("cci_rif", "maentes") & ", "
    '                            sql = sql & "'" & reader.Item("ma_cid").ToString & "',"
    '                            sql = sql & "'" & reader.Item("ma_ipersona").ToString & "',"
    '                            sql = sql & "" & reader.Item("ma_cci_rif").ToString & ","
    '                            sql = sql & "'" & reader.Item("ma_xnombre").ToString & "',"
    '                            sql = sql & "'" & reader.Item("ma_xapellido").ToString & "',"
    '                            sql = sql & "'" & reader.Item("ma_xapellido").ToString & " " & reader.Item("ma_xnombre").ToString & "',"
    '                            sql = sql & "'" & reader.Item("ma_xdirecobro").ToString & "',"
    '                            sql = sql & "'" & reader.Item("ma_xavecalle").ToString & "',"
    '                            sql = sql & "'" & reader.Item("ma_xurbsector").ToString & "',"
    '                            sql = sql & "'" & reader.Item("ma_xaparpost").ToString & "',"
    '                            sql = sql & "'" & reader.Item("ma_fnacimien").ToString & "',"
    '                            sql = sql & "'" & reader.Item("ma_xtelef1").ToString & "',"
    '                            sql = sql & "'" & reader.Item("ma_xtelef2").ToString & "',"
    '                            sql = sql & "'" & reader.Item("ma_xtelefhab").ToString & "',"
    '                            sql = sql & "'" & reader.Item("ma_xtelefcel").ToString & "',"
    '                            sql = sql & "'" & reader.Item("ma_xfax").ToString & "',"
    '                            sql = sql & "'" & reader.Item("ma_xfaxhab").ToString & "',"
    '                            sql = sql & "'" & reader.Item("ma_xemail").ToString & "',"
    '                            sql = sql & "'" & reader.Item("ma_xemailhab").ToString & "',"
    '                            sql = sql & "'" & reader.Item("ma_isexo").ToString & "',"
    '                            sql = sql & "'" & Left(reader.Item("ma_iedocivil").ToString, 1) & "',"
    '                            sql = sql & "'" & reader.Item("ma_xreplegal").ToString & "',"
    '                            sql = sql & "'" & reader.Item("ma_cidreplegal").ToString & "',"
    '                            sql = sql & "'" & Left(reader.Item("ma_itipopers").ToString, 1) & "',"
    '                            If String.IsNullOrEmpty(reader.Item("ma_cprofesion").ToString) = False Then sql = sql & "" & reader.Item("ma_cprofesion").ToString & "," Else sql = sql & "0,"
    '                            If String.IsNullOrEmpty(reader.Item("ma_csucur").ToString) = False Then sql = sql & "" & reader.Item("ma_csucur").ToString & "," Else sql = sql & "0,"
    '                            If String.IsNullOrEmpty(reader.Item("ma_cpais").ToString) = False Then sql = sql & "" & reader.Item("ma_cpais").ToString & "," Else sql = sql & "0,"
    '                            sql = sql & "'" & reader.Item("ma_cestado").ToString & "',"
    '                            sql = sql & "'" & reader.Item("ma_ciudad").ToString & "',"
    '                            sql = sql & "'" & reader.Item("ma_ccorregi").ToString & "',"
    '                            If String.IsNullOrEmpty(reader.Item("ma_cgrupoecono").ToString) = False Then sql = sql & "" & reader.Item("ma_cgrupoecono").ToString & "," Else sql = sql & "0,"
    '                            If String.IsNullOrEmpty(reader.Item("ma_cactividad").ToString) = False Then sql = sql & "" & reader.Item("ma_cactividad").ToString & "," Else sql = sql & "0,"
    '                            sql = sql & "'" & reader.Item("ma_iexon_imp").ToString & "','!','V')"

    '                            sql = Replace(sql, "¥", "Ñ")
    '                            con.EjecutarSentencia(sql)
    '                            ins = ins + 1
    '                            ACTUALIZADO.FECHA = Today
    '                        End If
    '                    Else
    '                        If reader.Item("ma_tipo_ente").ToString = "M" Then
    '                            sql = "update maentes set "
    '                            sql = sql & "cid= '" & reader.Item("ma_cid").ToString & "',"
    '                            sql = sql & "ccirif_fox= " & reader.Item("ma_cci_rif").ToString & ","
    '                            sql = sql & "ipersona= '" & reader.Item("ma_ipersona").ToString & "',"
    '                            sql = sql & "xnombre= '" & reader.Item("ma_xnombre").ToString & "',"
    '                            sql = sql & "xapellido= '" & reader.Item("ma_xapellido").ToString & "',"
    '                            sql = sql & "xcliente= '" & reader.Item("ma_xapellido").ToString & " " & reader.Item("ma_xnombre").ToString & "',"
    '                            sql = sql & "xdirecobro= '" & reader.Item("ma_xdirecobro").ToString & "',"
    '                            sql = sql & "xavecalle= '" & reader.Item("ma_xavecalle").ToString & "',"
    '                            sql = sql & "xurbsector= '" & reader.Item("ma_xurbsector").ToString & "',"
    '                            sql = sql & "xaparpost= '" & reader.Item("ma_xaparpost").ToString & "',"
    '                            sql = sql & "fnacimien= '" & reader.Item("ma_fnacimien").ToString & "',"
    '                            sql = sql & "xtelef1= '" & reader.Item("ma_xtelef1").ToString & "',"
    '                            sql = sql & "xtelef2= '" & reader.Item("ma_xtelef2").ToString & "',"
    '                            sql = sql & "xtelefhab= '" & reader.Item("ma_xtelefhab").ToString & "',"
    '                            sql = sql & "xtelefcel= '" & reader.Item("ma_xtelefcel").ToString & "',"
    '                            sql = sql & "xfax= '" & reader.Item("ma_xfax").ToString & "',"
    '                            sql = sql & "xfaxhab= '" & reader.Item("ma_xfaxhab").ToString & "',"
    '                            sql = sql & "xemail= '" & reader.Item("ma_xemail").ToString & "',"
    '                            sql = sql & "xemailhab= '" & reader.Item("ma_xemailhab").ToString & "',"
    '                            sql = sql & "isexo= '" & reader.Item("ma_isexo").ToString & "',"
    '                            sql = sql & "iedocivil= '" & Left(reader.Item("ma_iedocivil").ToString, 1) & "',"
    '                            sql = sql & "xreplegal= '" & reader.Item("ma_xreplegal").ToString & "',"
    '                            sql = sql & "cidreplegal= '" & reader.Item("ma_cidreplegal").ToString & "',"
    '                            sql = sql & "itipopers= '" & reader.Item("ma_itipopers").ToString & "',"
    '                            If String.IsNullOrEmpty(reader.Item("ma_cprofesion").ToString) = False Then sql = sql & "cprofesion= " & reader.Item("ma_cprofesion").ToString & "," Else sql = sql & "cprofesion= 0,"
    '                            If String.IsNullOrEmpty(reader.Item("ma_csucur").ToString) = False Then sql = sql & "csucur= " & reader.Item("ma_csucur").ToString & "," Else sql = sql & "csucur= 0,"
    '                            If String.IsNullOrEmpty(reader.Item("ma_cpais").ToString) = False Then sql = sql & "cpais= " & reader.Item("ma_cpais").ToString & "," Else sql = sql & "cpais= 0,"
    '                            sql = sql & "cestado= '" & reader.Item("ma_cestado").ToString & "',"
    '                            sql = sql & "cciudad= '" & reader.Item("ma_ciudad").ToString & "',"
    '                            sql = sql & "ccorregi= '" & reader.Item("ma_ccorregi").ToString & "',"
    '                            If String.IsNullOrEmpty(reader.Item("ma_cgrupoecono").ToString) = False Then sql = sql & "cgrupoecono= " & reader.Item("ma_cgrupoecono").ToString & "," Else sql = sql & "cgrupoecono= 0,"
    '                            If String.IsNullOrEmpty(reader.Item("ma_cactividad").ToString) = False Then sql = sql & "cactividad= " & reader.Item("ma_cactividad").ToString & "," Else sql = sql & "cactividad= 0,"
    '                            sql = sql & "iexon_imp= '" & reader.Item("ma_iexon_imp").ToString & "' where "

    '                            sql = sql & " rtrim(cid)= '" & Trim(reader.Item("ma_cid").ToString) & "'"
    '                            sql = Replace(sql, "¥", "Ñ")
    '                            con.EjecutarSentencia(sql)
    '                            modi = modi + 1
    '                            ACTUALIZADO.FECHA = Today
    '                        End If
    '                    End If
    'x:
    '                End While

    '            End If

    '        End Using
    'XX:
    '        ' If Err.Number <> 0 Then MsgBox(Err.Description)  TEMP. Q no moleste al usuario. Quedan los errores en el visor de eventos.

    '    End Sub


    ''' <summary>
    ''' Carga los combos ASP.Net
    ''' </summary>
    ''' <param name="consulta">Consulta de la cual se deriva al carga del control</param>
    ''' <param name="texto">Texto a mostra en el combo</param>
    ''' <param name="valor">Valor Asignado al texto seleccionado</param>
    ''' <param name="control">Control que se desea cargar</param>
    Public Shared Sub CargarCombo(ByVal consulta As String, ByVal texto As String, ByVal valor As String, ByVal control As Object, Optional ByVal seleccione As Boolean = True, Optional ByVal sis As Boolean = False)

        Try

            Dim ds As Data.DataSet
            ds = New sis3.db.db().retornaDataset(consulta, sis)

            If seleccione Then
                Dim dr As Data.DataRow
                dr = ds.Tables(0).NewRow()
                dr(valor) = "-1"
                dr(texto) = "No-Especificado"
                ds.Tables(0).Rows.InsertAt(dr, 0)
            End If

            control.DataSource = ds
            control.DataValueField = valor
            control.DataTextField = texto
            control.DataBind()
        Catch ex As Exception
            Console.Write(ex.ToString())
        End Try
    End Sub

    Public Sub CargarDropDrownList(ByVal consulta As String, ByVal texto As String, ByVal valor As String, ByVal MiControl As DropDownList)
        MiControl.DataSource = New sis3.db.db().CargarCombo(consulta, texto, valor, MiControl)
        MiControl.DataValueField = valor
        MiControl.DataTextField = texto
        MiControl.DataBind()
    End Sub

    Public Sub CargarGrdidViews(ByVal consulta As String, ByVal dtgrGrid As GridView)
        Dim ds As Data.DataSet
        Try
            ds = New sis3.db.db().retornaDataset(consulta)
            If (ds.Tables.Count > 0) Then
                dtgrGrid.DataSource = ds
                dtgrGrid.DataBind()
            Else
                'ScriptManager.RegisterStartupScript(Me, Me.GetType(), "msg", "alert('No se Encontraron registros');", True)
            End If
        Catch ex As Exception
            Console.Write(ex.ToString())
        End Try

    End Sub

    Public Sub CargarListBox(ByVal consulta As String, ByVal texto As String, ByVal valor As String, ByVal MiControl As ListBox)
        MiControl.DataSource = New sis3.db.db().retornaDataset(consulta)
        MiControl.DataValueField = valor
        MiControl.DataTextField = texto
        MiControl.DataBind()
    End Sub

    Public Sub SetDBLogonForReportMundisis(ByRef ss As ReportDocument)
        Dim pass As String
        If VG.cws(25) = " " Then
            pass = ""
        Else
            pass = VG.cws(25)
        End If

        Dim myTables As CrystalDecisions.CrystalReports.Engine.Tables = ss.Database.Tables
        For Each myTable As CrystalDecisions.CrystalReports.Engine.Table In myTables
            myTable.LogOnInfo.ConnectionInfo.DatabaseName = VG.cws(7)
            myTable.LogOnInfo.ConnectionInfo.UserID = VG.cws(24)
            myTable.LogOnInfo.ConnectionInfo.Password = pass
            myTable.LogOnInfo.ConnectionInfo.ServerName = VG.cws(6)
            Dim myTableLogonInfo As CrystalDecisions.Shared.TableLogOnInfo = myTable.LogOnInfo
            myTable.ApplyLogOnInfo(myTableLogonInfo)
        Next

        ss.SetDatabaseLogon(VG.cws(24), pass)
    End Sub

    Public Shared Function EjecutaSQL_escalar(ByVal sql As String, Optional ByVal sis_Global As Boolean = False, Optional ByVal no_null As Boolean = False) As Object
        Dim resultado As Object = New sis3.db.db().EjecutaSQL_escalar(sql, sis_Global, no_null)

        If no_null AndAlso (IsDBNull(resultado) Or IsNothing(resultado)) Then
            EjecutaSQL_escalar = -1
        Else
            EjecutaSQL_escalar = resultado
        End If
    End Function

    Public Shared Function EjecutaSQL(ByVal sql As String, Optional ByVal Global_SIS As Boolean = False) As Integer
        EjecutaSQL = New sis3.db.db().EjecutaSQL(sql, Global_SIS)
    End Function

    Public Shared Function EjecutaSQL_reader(ByVal sql As String, Optional ByVal sisGlobal As Boolean = False) As Data.SqlClient.SqlDataReader
        EjecutaSQL_reader = New sis3.db.db().EjecutaSQL_reader(sql, sisGlobal)
    End Function

    Public Shared Function EjecutaSQL_reader_SIS(ByVal sql As String) As Data.SqlClient.SqlDataReader
        EjecutaSQL_reader_SIS = New sis3.db.db().EjecutaSQL_reader(sql, True)
    End Function

    Public Shared Function retornaDataset(ByVal query As String, Optional ByVal sis As Boolean = False, Optional ByVal nameTable As String = "dsTable") As DataSet
        retornaDataset = New sis3.db.db().retornaDataset(query, sis, nameTable)
    End Function

    Public Shared Function noVacio(ByVal valor As Object, Optional ByVal valorSiEsNulo As Integer = -1) As Object
        If IsDBNull(valor) OrElse String.IsNullOrEmpty(valor) Then noVacio = valorSiEsNulo Else noVacio = valor
    End Function

    Public Shared Function Dame_cci_rif(ByVal nombre As String) As Integer
        'TONY
        Dim cci As Object = VG.EjecutaSQL_escalar("select cci_rif from maentes where xnombre='" & nombre & "'")
        If cci = Nothing Then
            Dame_cci_rif = 0
        Else
            Dame_cci_rif = cci
        End If
    End Function

    Public Shared Function Fecha2Español(ByVal FechaInglesa As String) As String
        'tony cambia posicion de dia por mes en un string

        Dim dia, mes, anio As Integer
        mes = FechaInglesa.Substring(0, FechaInglesa.IndexOf("/"))
        dia = FechaInglesa.Substring(FechaInglesa.IndexOf("/") + 1, FechaInglesa.IndexOf("/"))
        anio = FechaInglesa.Substring(FechaInglesa.LastIndexOf("/") + 1)

        Fecha2Español = dia & "/" & mes & "/" & anio

    End Function

    Public Shared Function Fecha2ANSI(ByVal fecha_string As String) As String
        'tony 
        'devuelve fecha en formato ansi para las SQL 
        Dim fe As Date = CDate(fecha_string)
        Dim mes As String = Month(fe)
        Dim dia As String = Day(fe)
        If mes.Length < 2 Then mes = "0" & mes
        If dia.Length < 2 Then dia = "0" & dia

        Dim temp As String = Year(fe) & mes & dia

        Fecha2ANSI = temp

    End Function

    Public Shared Sub Haz_update(ByVal tabla As String, ByVal campos As ArrayList, ByVal valores As ArrayList, ByVal where As String)
        '---------------------------------------------------------------------------------------
        ' Procedimiento :           Haz_update
        ' Uso           :           General
        ' Fecha         :         12/03/2008
        ' Autor         :           TONY MAYORAL
        ' Proposito     :      Simplifica update de SQL
        ' 
        ' Variables del Entorno y funciones dependientes
        '               Entrada: 
        '               Salida: 
        'Base de Datos
        '               Tablas Modificadas: Ninguna
        '---------------------------------------------------------------------------------------

        Dim csql As String = "UPDATE " & tabla & " SET "
        Dim i As Integer
        For i = 0 To campos.Count - 1
            csql += campos(i) & "=" & valores(i) & ", "
        Next
        csql = csql.Remove(csql.LastIndexOf(","), 1)
        VG.EjecutaSQL(csql.Trim & " " & where.Trim)

    End Sub

    Public Shared Sub Haz_insert(ByVal tabla As String, ByVal campos As ArrayList, ByVal valores As ArrayList)
        '---------------------------------------------------------------------------------------
        ' Procedimiento :           Haz_insert
        ' Uso           :           General
        ' Fecha         :         12/03/2008
        ' Autor         :           TONY MAYORAL
        ' Proposito     :      Simplifica insert de SQL
        ' 
        ' Variables del Entorno y funciones dependientes
        '               Entrada: 
        '               Salida: 
        'Base de Datos
        '               Tablas Modificadas: Ninguna
        '---------------------------------------------------------------------------------------

        Dim csql As String = "INSERT INTO " & tabla & " ("
        Dim i As Integer
        For i = 0 To campos.Count - 1
            csql += campos(i) & ", "
        Next
        csql = csql.Remove(csql.LastIndexOf(","), 1)
        csql += ") VALUES ("

        For i = 0 To campos.Count - 1
            csql += valores(i) & ", "
        Next

        csql = csql.Remove(csql.LastIndexOf(","), 1)
        csql += ")"
        VG.EjecutaSQL(csql.Trim)

    End Sub

    Public Shared Sub Haz_update(ByVal tabla As String, ByVal campos As ArrayList, ByVal valores As ArrayList, ByVal where As String, ByVal bSis As Boolean)
        '---------------------------------------------------------------------------------------
        ' Procedimiento :           Haz_update
        ' Uso           :           General
        ' Fecha         :         12/03/2008
        ' Autor         :           TONY MAYORAL
        ' Proposito     :      Simplifica update de SQL
        ' 
        ' Variables del Entorno y funciones dependientes
        '               Entrada: 
        '               Salida: 
        'Base de Datos
        '               Tablas Modificadas: Ninguna
        '---------------------------------------------------------------------------------------

        Dim csql As String = "UPDATE " & tabla & " SET "
        Dim i As Integer
        For i = 0 To campos.Count - 1
            csql += campos(i) & "=" & valores(i) & ", "
        Next
        csql = csql.Remove(csql.LastIndexOf(","), 1)
        VG.EjecutaSQL(csql.Trim & " " & where.Trim, bSis)

    End Sub

    Public Shared Sub Haz_insert(ByVal tabla As String, ByVal campos As ArrayList, ByVal valores As ArrayList, ByVal bSis As Boolean)
        '---------------------------------------------------------------------------------------
        ' Procedimiento :           Haz_insert
        ' Uso           :           General
        ' Fecha         :         12/03/2008
        ' Autor         :           TONY MAYORAL
        ' Proposito     :      Simplifica insert de SQL
        ' 
        ' Variables del Entorno y funciones dependientes
        '               Entrada: 
        '               Salida: 
        'Base de Datos
        '               Tablas Modificadas: Ninguna
        '---------------------------------------------------------------------------------------

        Dim csql As String = "INSERT INTO " & tabla & " ("
        Dim i As Integer
        For i = 0 To campos.Count - 1
            csql += campos(i) & ", "
        Next
        csql = csql.Remove(csql.LastIndexOf(","), 1)
        csql += ") VALUES ("

        For i = 0 To campos.Count - 1
            csql += valores(i) & ", "
        Next

        csql = csql.Remove(csql.LastIndexOf(","), 1)
        csql += ")"
        VG.EjecutaSQL(csql.Trim, bSis)

    End Sub

    Public Shared Function Comillas(ByVal cadena As String) As String
        Comillas = "'" & cadena & "'"
    End Function

    Public Shared Function EmiteEndoso_Crea(ByVal cendoso As Integer, ByVal cproces As Integer, ByVal cproces_poliza As Integer, ByVal codigo_usuario As Integer, Optional ByVal Descripcion As String = "", Optional ByVal fedesde As String = "", Optional ByVal fehasta As String = "", Optional ByVal pprorrata As Double = 1, Optional ByVal fechaInicioVigenciaEndoso As String = "", Optional ByVal extencion_v As Integer = 0, Optional ByVal itiporec As String = "", Optional ByVal Tipo_endoso As String = "") As Integer

        Dim campos As New ArrayList
        Dim valores As New ArrayList
        Dim tb_insert As String

        Dim tb_select As String
        Dim tb_select_en As String

        If Oferta_Endoso Then
            tb_insert = "ofendoso"
            tb_select = "ofpolizas"

        Else
            tb_insert = "adendoso"
            tb_select = "adpoliza"

        End If

        Dim oferta As SqlClient.SqlDataReader = VG.EjecutaSQL_reader("select * from ofrecibos where cproces=" & cproces)
        Dim poliza As SqlClient.SqlDataReader = VG.EjecutaSQL_reader("select * from " & tb_select & " where cproces=" & cproces_poliza)
        poliza.Read()
        Dim qNumEndoso As Object = VG.EjecutaSQL_escalar("select max(qNumEndoso)+1 from " & tb_insert & " where cproces_poliza=" & cproces_poliza)
        If IsDBNull(qNumEndoso) Then qNumEndoso = 1

        Dim cramo As Integer
        oferta.Read()
        cramo = poliza.Item("cramo")
        '1. copio los datos del endoso. Estan en la oferta de poliza xq se ha tarificado por el procedimiento habitual

        campos.Add("cproces")
        valores.Add(cproces)

        campos.Add("pprorrata")
        valores.Add(pprorrata)

        campos.Add("cproces_poliza")
        valores.Add(cproces_poliza)

        campos.Add("casegurado")
        valores.Add(poliza.Item("casegurado"))

        campos.Add("cacreedor")
        valores.Add(poliza.Item("cacreedor"))

        campos.Add("qNumEndoso")
        valores.Add(qNumEndoso)

        campos.Add("cpoliza")
        valores.Add(poliza.Item("cpoliza"))

        campos.Add("fanopol")
        valores.Add(poliza.Item("fanopol"))

        campos.Add("fmespol")
        valores.Add(poliza.Item("fmespol"))

        campos.Add("cnpoliza")
        valores.Add(VG.Comillas(poliza.Item("cnpoliza").ToString.Trim))

        campos.Add("cramo")
        valores.Add(oferta.Item("cramo"))

        campos.Add("cplan")
        valores.Add(VG.Comillas(poliza.Item("cplan")))

        campos.Add("itipoprod")
        valores.Add(VG.Comillas(oferta.Item("itipoprod")))

        campos.Add("iestado")
        valores.Add(VG.Comillas(poliza.Item("iestado")))

        campos.Add("itiporen")
        valores.Add(VG.Comillas(poliza.Item("itiporen")))

        campos.Add("forigen")
        If fechaInicioVigenciaEndoso = String.Empty Then
            valores.Add("Getdate()")
        Else
            valores.Add(VG.Comillas(Format(CType(fechaInicioVigenciaEndoso, Date), "yyyyMMdd")))
        End If

        'If cendoso = 55 Or cendoso = 24 Or cendoso = 23 Then 'desplazamiento
        campos.Add("fdesde")
        valores.Add(VG.Comillas(fedesde))

        campos.Add("fhasta")
        valores.Add(VG.Comillas(fehasta))
        'Else
        '    campos.Add("fdesde")
        '    valores.Add(VG.Comillas(Format(CType(Today, Date), "yyyyMMdd")))

        '    campos.Add("fhasta")
        '    valores.Add(VG.Comillas(VG.Fecha2ANSI(oferta.Item("fhasta"))))
        'End If

        campos.Add("xobserva")
        valores.Add(VG.Comillas(Descripcion).Trim)

        campos.Add("xasegurado")
        valores.Add(VG.Comillas(poliza.Item("xasegurado").ToString.Trim))

        campos.Add("msumabruta")
        valores.Add(oferta.Item("msumabruta"))

        campos.Add("msuma")
        valores.Add(oferta.Item("msuma"))

        campos.Add("mprima")
        valores.Add(oferta.Item("mprima") * pprorrata)

        campos.Add("mprimabruta")
        valores.Add(oferta.Item("mprimabruta"))

        campos.Add("mgastos")
        valores.Add(oferta.Item("mgastos"))

        campos.Add("pgastos")
        valores.Add(oferta.Item("pgastos"))

        'campos.Add("mrecargo")
        'valores.Add(rd.Item("mrecargo"))

        'campos.Add("precargo")
        'valores.Add(rd.Item("precargo"))

        campos.Add("pimpuesto")
        valores.Add(oferta.Item("pimpuesto"))

        campos.Add("mimpuesto")
        valores.Add(oferta.Item("mimpuesto") * pprorrata)

        campos.Add("mtotal")
        valores.Add((oferta.Item("mprima") * pprorrata) + oferta.Item("mimpuesto"))

        campos.Add("fingreso")
        valores.Add(VG.Comillas(Format(Now, "dd/MM/yyyy")))

        campos.Add("cusuario")
        valores.Add(codigo_usuario)

        campos.Add("cendoso") 'codigo del endoso aplicado
        valores.Add(cendoso)

        Dim rd2 As SqlClient.SqlDataReader = VG.EjecutaSQL_reader("SELECT [cramo],[cendoso],[xdescripcion],[signo] " & _
                                                                  ",[iestado],[ifase],[itiporec],[xformsalida],[norden]" & _
                                                                  ",[bcalcProrrata],[bgastos],[itiposel],[xtipo_inex]" & _
                                                                  ",[itipocalculo],[itipocalculoccategotr],[tipoOp]" & _
                                                                  " FROM maendosos WHERE cendoso=" & cendoso & " AND cramo=" & oferta.Item("cramo"))
        rd2.Read()

        campos.Add("signo")
        valores.Add(rd2.Item("signo"))

        If extencion_v = 0 Then
            campos.Add("itiporec")
            valores.Add(VG.Comillas(rd2.Item("itiporec")))
        Else
            campos.Add("itiporec")
            valores.Add(VG.Comillas(itiporec))
        End If


        If Tipo_endoso.Trim <> String.Empty Then
            campos.Add("xdescripcion_endoso")
            valores.Add(VG.Comillas(Tipo_endoso))
        Else
            campos.Add("xdescripcion_endoso")
            valores.Add(VG.Comillas(rd2.Item("xdescripcion").ToString.Trim))
        End If

        rd2.Close()
        oferta.Close()
        poliza.Close()

        VG.Haz_insert(tb_insert, campos, valores)

        Return qNumEndoso

    End Function

    Public Shared Sub ConfirmaCoberturas(ByVal cproces_oferta As Integer, ByVal cproces_poliza As Integer, ByVal cendoso As Integer, ByVal qNumEndoso As Integer, Optional ByVal factor As Double = 1)
        'TONY
        'confirma la cobertura pasandola a la zona de administracion
        'estas coberturas se agregan a las de la poliza en la tabla adpolcob con itipoprod='EN' para indicar que estan endosadas (codigo de MACODIGOS)
        'y en cprog=qnumendoso para saber a q numero de endoso corresponden
        Try
            Dim oferta As Data.SqlClient.SqlDataReader = VG.EjecutaSQL_reader("select * from ofpolcob where cproces=" & cproces_oferta)
            Dim poliza As Data.SqlClient.SqlDataReader = VG.EjecutaSQL_reader("select cnpoliza,cpoliza,fanopol,fmespol,cbeneficiario from adpoliza where cproces=" & cproces_poliza)
            poliza.Read()
            Dim campos, valores As New ArrayList

            While oferta.Read
                campos.Clear()
                valores.Clear()

                campos.Add("cproces")
                'valores.Add(cproces_poliza)
                valores.Add(cproces_oferta) 'lo cambio ya que no coincide con la oferta generada en el endoso

                campos.Add("ccerti")
                valores.Add(oferta("ccerti"))

                campos.Add("cbeneficia")
                valores.Add(poliza("cbeneficiario"))

                campos.Add("ccober")
                valores.Add(VG.Comillas(oferta("ccober")))

                campos.Add("u_version")
                valores.Add(VG.Comillas(oferta("u_version")))

                campos.Add("cramo")
                valores.Add(oferta("cramo"))

                campos.Add("cpoliza")
                valores.Add(poliza("cpoliza"))

                campos.Add("fanopol")
                valores.Add(poliza("fanopol"))

                campos.Add("fmespol")
                valores.Add(poliza("fmespol"))

                campos.Add("crecibo")
                valores.Add(0) 'todavia no tengo recibo.  Luego hay que actualizar este campo cuando exista.

                campos.Add("cnpoliza")
                valores.Add(VG.Comillas(poliza("cnpoliza")))

                campos.Add("csucur")
                valores.Add(oferta("csucur"))

                campos.Add("cmoneda")
                valores.Add(VG.Comillas(oferta("cmoneda")))

                campos.Add("ptasamon")
                valores.Add(VG.Comillas(oferta("ptasamon")))

                campos.Add("bfraded")
                valores.Add(VG.Comillas(oferta("bfraded")))

                campos.Add("mfranquicia")
                valores.Add(oferta("mfranquicia"))

                campos.Add("mfranquiciaext")
                valores.Add(oferta("mfranquiciaext"))

                campos.Add("fdesde")
                valores.Add(VG.Comillas(oferta("fdesde")))

                campos.Add("fhasta")
                valores.Add(VG.Comillas(oferta("fhasta")))

                campos.Add("msumaaseg")
                valores.Add(oferta("msumaaseg"))

                campos.Add("msumaasegext")
                valores.Add(oferta("msumaasegext"))

                campos.Add("mprima")
                valores.Add(Math.Round(oferta("mprima") * factor, 2))

                campos.Add("pprima")
                valores.Add(oferta("pprima"))

                campos.Add("itipoprod")
                valores.Add(VG.Comillas("EN"))

                campos.Add("istattar")
                If cendoso = 22 Then ''caso de exclusion
                    valores.Add(VG.Comillas("C"))
                Else
                    valores.Add(VG.Comillas(oferta("istattar")))
                End If

                campos.Add("bdevuelta")
                valores.Add(0)

                campos.Add("mdeduci")
                valores.Add(oferta("mdeduci"))

                campos.Add("mdeduciext")
                valores.Add(oferta("mdeduciext"))

                campos.Add("pdeduci")
                valores.Add(oferta("pdeduci"))

                campos.Add("cdeduci")
                valores.Add(oferta("cdeduci"))

                campos.Add("mdescuentoreas")
                valores.Add(oferta("mdescuentoreas"))

                campos.Add("mdescuentoreasext")
                valores.Add(oferta("mdescuentoreasext"))

                campos.Add("mdescuento")
                valores.Add(oferta("mdescuento"))

                campos.Add("mdescuentoext")
                valores.Add(oferta("mdescuentoext"))

                campos.Add("pdescuento")
                valores.Add(oferta("pdescuento"))

                campos.Add("mrecargoreas")
                valores.Add(oferta("mrecargoreas"))

                campos.Add("mrecargoreasext")
                valores.Add(oferta("mrecargoreasext"))

                campos.Add("mrecargo")
                valores.Add(oferta("mrecargo"))

                campos.Add("mrecargoext")
                valores.Add(oferta("mrecargoext"))

                campos.Add("precargo")
                valores.Add(oferta("precargo"))

                campos.Add("pcomision")
                valores.Add(oferta("pcomision"))

                campos.Add("mcomision")
                valores.Add(oferta("mcomision"))

                campos.Add("mcomisionext")
                valores.Add(oferta("mcomisionext"))

                campos.Add("mcomsuperv")
                valores.Add(oferta("mcomsuperv"))

                campos.Add("pcomsuperv")
                valores.Add(oferta("pcomsuperv"))

                campos.Add("mcomgeren")
                valores.Add(oferta("mcomgeren"))

                campos.Add("mcomgerenext")
                valores.Add(oferta("mcomgerenext"))

                campos.Add("pcomgeren")
                valores.Add(oferta("pcomgeren"))

                campos.Add("qordenimp")
                valores.Add(oferta("qordenimp"))

                campos.Add("bimprime")
                valores.Add(VG.Comillas(oferta("bimprime")))

                campos.Add("mpridet")
                valores.Add(Math.Round(factor * oferta("mpridet"), 2))

                campos.Add("mpridetext")
                valores.Add(oferta("mpridetext"))

                campos.Add("mprimabruta")
                valores.Add(Math.Round(factor * oferta("mprimabruta"), 2))

                campos.Add("mprimabrutaext")
                valores.Add(oferta("mprimabrutaext"))

                campos.Add("ptasareas")
                valores.Add(oferta("ptasareas"))

                campos.Add("mpridetreas")
                valores.Add(Math.Round(factor * oferta("mpridetreas"), 2))

                campos.Add("mpridetreasext")
                valores.Add(oferta("mpridetreasext"))

                campos.Add("mprimareas")
                valores.Add(Math.Round(factor * oferta("mprimareas"), 2))

                campos.Add("mprimareasext")
                valores.Add(oferta("mprimareasext"))

                campos.Add("mprimagrabada")
                valores.Add(Math.Round(factor * oferta("mprimagrabada"), 2))

                campos.Add("mprimagrabadaext")
                valores.Add(oferta("mprimagrabadaext"))

                campos.Add("mcomdet")
                valores.Add(oferta("mcomdet"))

                campos.Add("mcomdetext")
                valores.Add(oferta("mcomdetext"))

                campos.Add("pimpuesto")
                valores.Add(oferta("pimpuesto"))

                campos.Add("mimpuesto")
                valores.Add(oferta("mimpuesto"))

                campos.Add("mimpuestoext")
                valores.Add(oferta("mimpuestoext"))

                campos.Add("iinfraseguro")
                valores.Add(VG.Comillas(oferta("iinfraseguro")))

                campos.Add("ccontrea")
                valores.Add(oferta("ccontrea"))

                campos.Add("cramorea")
                valores.Add(oferta("cramorea"))

                campos.Add("cramopcnd")
                valores.Add(VG.noVacio(oferta("cramopcnd")))

                campos.Add("ccoberpcnd")
                valores.Add(VG.noVacio(oferta("ccoberpcnd")))

                campos.Add("cramoint")
                valores.Add(oferta("cramoint"))

                campos.Add("ccoberturaint")
                valores.Add(oferta("ccoberturaint"))

                campos.Add("isuma")
                valores.Add(VG.Comillas(oferta("isuma")))

                campos.Add("bimpuesto")
                valores.Add(VG.Comillas(oferta("bimpuesto")))

                campos.Add("xobserva")
                valores.Add(VG.Comillas(oferta("xobserva")))

                campos.Add("xexclusiones")
                If IsDBNull(oferta("xexclusiones")) Then
                    valores.Add(VG.Comillas(""))
                Else
                    valores.Add(VG.Comillas(oferta("xexclusiones")))
                End If

                campos.Add("cprog")
                valores.Add(qNumEndoso)

                campos.Add("ifuente")
                valores.Add(VG.Comillas(("ifuente")))

                campos.Add("bok")
                valores.Add(0)

                campos.Add("cerror")
                valores.Add(0)

                campos.Add("fingreso")
                valores.Add(VG.Comillas(Format(Now, "dd/MM/yyyy hh:mm:ss")))

                campos.Add("cramoconta")
                valores.Add(VG.noVacio(oferta("cramoconta")))

                campos.Add("cusuario")
                valores.Add(oferta("cusuario"))

                campos.Add("ccategoria")
                valores.Add(0)

                campos.Add("cusuarioauto")
                valores.Add(0)

                campos.Add("ccategoriaauto")
                valores.Add(0)

                campos.Add("fultmod")
                valores.Add(VG.Comillas(Format(Now, "dd/MM/yyyy hh:mm:ss")))

                campos.Add("cusuariomod")
                valores.Add(oferta("cusuariomod"))

                campos.Add("ccategoriamod")
                valores.Add(oferta("ccategoriamod"))

                VG.Haz_insert("adpolcob", campos, valores)

                If cendoso = 22 Then
                    campos.Clear()
                    valores.Clear()
                    campos.Add("istattar")
                    valores.Add(VG.Comillas("C"))
                    VG.Haz_update("adpolcob", campos, valores, "where cnpoliza = '" & Trim(poliza("cnpoliza")) & "' and ccober = " & oferta("ccober"))
                End If

            End While

        Catch ex As Exception
            Dim evento As New GestionEventos
            evento.RegistraEvento(GestionEventos.evento.AplicionEndoso, GestionEventos.operaciones.ErrorGenerico, 999921, "Error al aplicar endoso " & cendoso & " con cproces= " & cproces_oferta & " sobre poliza " & cproces_poliza & " procedimiento vg.ConfirmaCoberturas() error: " & ex.Message)

            'quito basura
            VG.EjecutaSQL("delete from adpolcob where crecibo=0")
            VG.EjecutaSQL("delete from adendoso where cproces=" & cproces_oferta)

        End Try
    End Sub

    Public Shared Sub EmiteEndoso_CreaRecibo(ByVal cendoso As Integer, ByVal cproces As Integer, ByVal qNumEndoso As Integer, ByVal codigo_usuario As Integer, ByVal Descripcion As String, Optional ByVal pprorrata As Double = 1, Optional ByRef crecibo As Integer = 0)
        Dim tec As New Asidllcon00.TEC
        Dim adendoso As SqlClient.SqlDataReader = VG.EjecutaSQL_reader("select * from adendoso where cproces=" & cproces & " and qnumendoso=" & qNumEndoso)
        adendoso.Read()

        tec.wcpoliza1 = adendoso.Item("cpoliza")
        tec.wfanopol1 = adendoso.Item("fanopol")
        tec.wfmespol1 = adendoso.Item("fmespol")
        tec.wcproces1 = adendoso.Item("cproces")
        tec.Wendoso = adendoso.Item("cendoso")

        tec.Nuevo_EndRecibo(cproces, qNumEndoso, adendoso.Item("signo"), cendoso, pprorrata, , crecibo)

    End Sub

    Public Shared Sub EmiteEndoso_SumaCob(ByVal cendoso As Integer, ByVal cproces As Integer, ByVal qNumEndoso As Integer)
        Dim sql_cadena As String
        sql_cadena = "SELECT SUM(msuma) AS msuma, SUM(msumabruta) AS msumabruta, SUM(mprima) AS mprima, SUM(mprimabruta) AS mprimabruta, SUM(mgastos) AS mgastos, "
        sql_cadena += " SUM(mrecargo) AS mrecargo, SUM(mimpuesto) AS mimpuesto, SUM(mdeduci) AS mdeduci, SUM(mdescuento) AS mdescuento"
        sql_cadena += " FROM(adendcob)"
        sql_cadena += " WHERE (cproces = " & cproces & ") AND (qNumEndoso = " & qNumEndoso & ")"

        Dim rd As SqlClient.SqlDataReader = VG.EjecutaSQL_reader(sql_cadena)
        rd.Read()

        Dim campos As ArrayList
        Dim valores As ArrayList

        campos.Add("msuma")
        valores.Add(rd.Item("msuma"))

        campos.Add("msumabruta")
        valores.Add(rd.Item("msumabruta"))

        campos.Add("mprima")
        valores.Add(rd.Item("mprima"))

        campos.Add("mprimabruta")
        valores.Add(rd.Item("mprimabruta"))

        campos.Add("mgastos")
        valores.Add(rd.Item("mgastos"))

        campos.Add("mrecargo")
        valores.Add(rd.Item("mrecargo"))

        campos.Add("mimpuesto")
        valores.Add(rd.Item("mimpuesto"))

        campos.Add("mdeduci")
        valores.Add(rd.Item("mdeduci"))

        campos.Add("mdescuetno")
        valores.Add(rd.Item("mdescuento"))

    End Sub

    Public Shared Sub EmiteEndoso_MarcaCancelaciones(ByVal cendoso As Integer, ByVal cproces As Integer, ByVal qNumEndoso As Integer, ByVal cproces_poliza As Integer)
        Select Case cendoso
            Case 22 'exclusion
                'las q tengo q marcar
                Dim cob As SqlClient.SqlDataReader = VG.EjecutaSQL_reader("SELECT * from adendcob where cendoso=22 and cproces=" & cproces & " AND qNumEndoso=" & qNumEndoso)
                While cob.Read
                    'marco las coberturas q se quitaron
                    VG.EjecutaSQL("UPDATE adpolcob SET istattar='C' where cproces=" & cproces_poliza & " AND ccober=" & cob.Item("ccober"))
                    'marco las q se quitaron pero fueron agregadas mediante endoso
                    VG.EjecutaSQL("UPDATE adendcob SET istattar='C' where cproces_poliza=" & cproces_poliza & " AND ccober=" & cob.Item("ccober") & " AND cendoso=3")
                End While
            Case 3 'inlusion
                ''las q tengo q marcar para poner en vigente otra vez
                'Dim cob As SqlClient.SqlDataReader = VG.EjecutaSQL_reader("SELECT * from adendcob where cendoso=3 and cproces=" & cproces & " AND qNumEndoso=" & qNumEndoso)
                'While cob.Read
                '    'marco las coberturas q se quitaron
                '    VG.EjecutaSQL("UPDATE adpolcob SET istattar='V' where cproces=" & cproces_poliza & " AND ccober=" & cob.Item("ccober") & " AND istattar='C'")
                '    VG.EjecutaSQL("UPDATE adendcob SET istattar='C' where cproces_poliza=" & cproces_poliza & " AND ccober=" & cob.Item("ccober") & " AND cendoso=3")
                'End While
        End Select

    End Sub

    Public Shared Sub EmiteEndoso_AgregaTodasCob(ByVal cendoso As Integer, ByVal cproces As Integer, ByVal cproces_poliza As Integer, ByVal qNumEndoso As Integer, ByVal codigo_usuario As Integer, ByVal pprorrata As Double, ByVal fdesde As String, ByVal fhasta As String)
        Dim rd As SqlClient.SqlDataReader = VG.EjecutaSQL_reader("SELECT * from adpolcob where cproces=" & cproces_poliza & " AND istattar='V' ")
        Dim campos As New ArrayList
        Dim valores As New ArrayList

        While rd.Read
            campos.Clear()
            valores.Clear()

            campos.Add("ccober")
            valores.Add(rd.Item("ccober"))

            campos.Add("cproces")
            valores.Add(cproces)

            campos.Add("cendoso")
            valores.Add(cendoso)

            campos.Add("cproces_poliza")
            valores.Add(cproces_poliza)

            campos.Add("istattar")
            valores.Add("'V'")


            campos.Add("qNumEndoso")
            valores.Add(qNumEndoso)


            campos.Add("signo")
            valores.Add(VG.EjecutaSQL_escalar("select signo from adendoso where cproces=" & cproces & " and qNumEndoso=" & qNumEndoso))


            campos.Add("xcobertura")
            valores.Add(VG.Comillas(VG.EjecutaSQL_escalar("select xdescripcion_l from macoberturas where cramo=" & rd.Item("cramo") & " and ccobertura=" & rd.Item("ccober"))))


            campos.Add("crecibo") 'cuidado, puede haber varios?¿ pensar mas tarde
            valores.Add(VG.Comillas(rd.Item("crecibo")))

            campos.Add("cpoliza")
            valores.Add(rd.Item("cpoliza"))

            campos.Add("fanopol")
            valores.Add(rd.Item("fanopol"))

            campos.Add("fmespol")
            valores.Add(rd.Item("fmespol"))

            campos.Add("fdesde")
            valores.Add(VG.Comillas(VG.Fecha2ANSI(fdesde)))

            campos.Add("fhasta")
            valores.Add(VG.Comillas(VG.Fecha2ANSI(fhasta)))

            'campos.Add("msumabruta")
            'valores.Add(rd.Item("msumabruta"))

            campos.Add("msuma")
            valores.Add(rd.Item("msumaaseg"))

            campos.Add("mprima")
            valores.Add(Math.Round(rd.Item("mprima") * pprorrata - rd.Item("mprima"), 2).ToString.Replace(",", "."))

            campos.Add("mprimabruta")
            valores.Add(Math.Round(rd.Item("mprimabruta") * pprorrata - rd.Item("mprimabruta"), 2).ToString.Replace(",", "."))
            campos.Add("mimpuesto")
            valores.Add(rd.Item("mimpuesto"))

            'MaxTeen...07/01/2009. Pongo en comentario por que este campo no existe en la tabla adpolcob
            'campos.Add("mtotal")
            'valores.Add(Math.Round(rd.Item("mtotal")) * pprorrata)

            campos.Add("mrecargo")
            valores.Add(rd.Item("mrecargo"))

            campos.Add("precargo")
            valores.Add(rd.Item("precargo"))

            campos.Add("pimpuesto")
            valores.Add(rd.Item("pimpuesto"))



            campos.Add("mdeduci")
            valores.Add(rd.Item("mdeduci"))
            campos.Add("pdeduci")
            valores.Add(rd.Item("pdeduci"))

            campos.Add("mdescuento")
            valores.Add(rd.Item("mdescuento"))
            campos.Add("pdescuento")
            valores.Add(rd.Item("pdescuento"))

            campos.Add("xobservaciones")
            valores.Add(VG.Comillas(IIf(IsDBNull(rd.Item("xobserva")), "", rd.Item("xobserva"))))

            campos.Add("fingreso")
            valores.Add("GetDate()")

            campos.Add("cusuario")
            valores.Add(codigo_usuario)

            campos.Add("isuma")
            valores.Add(VG.Comillas(rd.Item("isuma")))

            VG.Haz_insert("adendcob", campos, valores)



        End While

        'ahora inserto las coberturas q se han agregado mediante endoso
        Dim sql As String

        sql = "INSERT INTO adendcob (ccober, cproces, qNumEndoso, xcobertura, crecibo, cpoliza, fmespol, fanopol, fdesde, fhasta, msuma, msumabruta, mprima, mprimabruta, mgastos, pgastos, mrecargo, precargo, pimpuesto, mimpuesto, mdeduci, pdeduci, mdescuento, pdescuento, xobservaciones, cusuario, fingreso, isuma, signo, cproces_poliza, cendoso, istattar) SELECT ccober, cproces, " & qNumEndoso & " as qNumEndoso, xcobertura, crecibo, cpoliza, fmespol, fanopol, '" & VG.Fecha2ANSI(fdesde) & "' as fdesde , '" & VG.Fecha2ANSI(fdesde) & "' as fhasta, msuma, msumabruta, mprima*" & pprorrata & "-mprima, mprimabruta*" & pprorrata & " - mprimabruta, mgastos, pgastos, mrecargo, precargo, pimpuesto, mimpuesto, mdeduci, pdeduci, mdescuento, pdescuento, xobservaciones, cusuario,getDate() as fingreso, isuma, signo, cproces_poliza," & cendoso & " AS cendoso, istattar FROM adendcob where cendoso=3 and cproces_poliza=" & cproces_poliza & " AND istattar='V'"
        VG.EjecutaSQL(sql)
    End Sub

    Private Sub CancelaCoberturas(ByVal cproces As Integer, ByVal cproces_poliza As Integer)
        Dim ofertas As Data.SqlClient.SqlDataReader = VG.EjecutaSQL_reader("select ccober from ofpolcob where cproces=" & cproces)
        While ofertas.Read

            VG.EjecutaSQL("UPDATE adpolcob set istattar='C'" _
                        & " where cproces=" & cproces & " and ccober=" & ofertas("ccober"))

        End While

    End Sub

    Public Sub EmiteEndoso(ByVal cendoso As Integer, ByVal cproces As Integer, ByVal cproces_poliza As Integer, ByVal codigo_usuario As Integer, Optional ByVal Descripcion As String = "", Optional ByVal param1 As String = "", Optional ByVal param2 As String = "", Optional ByRef wqNumEndoso As Integer = 0, Optional ByVal pprorrata As Double = 1, Optional ByRef crecibo As Integer = 0, Optional ByVal monto As Double = 0, Optional ByVal Recibo_devuelto As Integer = 0, Optional ByVal Tipo_endoso As String = "")
        Try
            'Dim tec As New Asidllcon00.TEC

            Select Case cendoso
                Case 3 'inclusion  de coberturas

                    '1. copio los datos del endoso.
                    '------------------------------
                    'creo entrada en adendoso desde los datos de la oferta de poliza (endoso) tarificado por el procedimiento habitual
                    qNumEndoso = EmiteEndoso_Crea(cendoso, cproces, cproces_poliza, codigo_usuario, Descripcion, param1, param2, pprorrata, param1)
                    wqNumEndoso = qNumEndoso

                    '2.Agrego las coberturas del endoso
                    '-----------------------------------
                    ConfirmaCoberturas(cproces, cproces_poliza, cendoso, qNumEndoso, pprorrata)

                    '3.Creo el Recibo
                    '----------------
                    Dim xerr As String = String.Empty
                    Endoso = cendoso
                    GeneraRecibo(cproces_poliza, "I", monto, 0, xerr, 0, crecibo, 6)
                    If xerr <> String.Empty Then Throw New Exception("Error en GeneraRecibo")

                    '3b actualizo campo de recibo en las coberturas recien agregadas
                    VG.EjecutaSQL("UPDATE adpolcob SET crecibo = " & crecibo _
                                        & ", cnpoliza = '" & wpoliza.Trim _
                                        & "', fhasta = '" & param2 _
                                        & "' WHERE cproces=" & cproces & " AND crecibo = 0")
                    VG.EjecutaSQL("UPDATE adrecibos SET fdesde='" & param1 & "' WHERE crecibo=" & crecibo)
                    VG.EjecutaSQL("UPDATE adendoso SET crecibo = " & crecibo & " WHERE cproces = " & cproces)

                    VG.EjecutaSQL("exec pasaofpolrea " & cproces & "," & crecibo & ",0")

                    'jose. Agrego el Reaseguro
                    '------------------------------
                    'tec.wx_recibos = "OFRECIBOS"
                    tec.DisreaNuevo(cproces, VG.licencia, 0)
                    'tec.AnulaAdpolrea(crecibo, crecibo, 0, pprorrata, 1, VG.licencia) 'reaseguro
                    'tec.AnulaAdpolrea_fp(crecibo, crecibo, 0, pprorrata, 1, VG.licencia) 'facultativo puro
                    'tec.AnulaAdpoltar(crecibo, crecibo, 0, pprorrata, 1, VG.licencia) 'tarifas
                    '------------------------------

                Case 22   'exclusion de coberturas

                    '1. copio los datos del endoso.
                    '------------------------------
                    'creo entrada en adendoso desde los datos de la oferta de poliza (endoso) tarificado por el procedimiento habitual
                    qNumEndoso = EmiteEndoso_Crea(cendoso, cproces, cproces_poliza, codigo_usuario, Descripcion, param1, param2, pprorrata, param1)
                    wqNumEndoso = qNumEndoso

                    '2.1.Cancelo las coberturas del endoso
                    '-----------------------------------
                    'CancelaCoberturas(cproces, cproces_poliza)
                    '2.2.Agrego las coberturas del endoso
                    '-----------------------------------
                    ConfirmaCoberturas(cproces, cproces_poliza, cendoso, qNumEndoso, pprorrata)
                    '3.Creo el Recibo
                    '----------------
                    Dim xerr As String = String.Empty
                    'pongo monto del paramtero xq hay calculos de corto plazo en fpoliza
                    GeneraRecibo(cproces_poliza, "B", monto, 0, xerr, 0, crecibo, 6, Recibo_devuelto)
                    If xerr <> String.Empty Then Stop

                    '3b actualizo campo de recibo en las coberturas recien agregadas
                    VG.EjecutaSQL("UPDATE adendoso SET crecibo=" & crecibo & " WHERE cproces=" & cproces)
                    VG.EjecutaSQL("UPDATE adpolcob SET crecibo=" & crecibo & " WHERE cproces=" & cproces)
                    VG.EjecutaSQL("UPDATE adrecibos SET fdesde='" & param1 & "' WHERE crecibo=" & crecibo)

                    VG.EjecutaSQL("exec pasaofpolrea " & cproces & "," & crecibo & ",0")

                Case 23, 24, 55 'extension,reduccion,desplazamiento de vigencia


                    '1. copio los datos del endoso.
                    '------------------------------
                    'creo entrada en adendoso desde los datos de la oferta de poliza (endoso) tarificado por el procedimiento habitual
                    qNumEndoso = EmiteEndoso_Crea(cendoso, cproces, cproces_poliza, codigo_usuario, Descripcion, param1, param2)
                    wqNumEndoso = qNumEndoso

                    '2.Creo el Recibo
                    '----------------
                    EmiteEndoso_CreaRecibo(cendoso, cproces, qNumEndoso, codigo_usuario, Descripcion, pprorrata, crecibo)

                Case 56, 31 'cambio de datos del objeto asegurado

                    qNumEndoso = EmiteEndoso_Crea(cendoso, cproces, cproces_poliza, codigo_usuario, Descripcion, param1, param2, , param1)
                    wqNumEndoso = qNumEndoso
                    VG.EjecutaSQL("UPDATE adendoso SET crecibo=0, mprima=0,mimpuesto=0,mtotal=0 WHERE cproces=" & cproces & " and qNumEndoso = " & qNumEndoso.ToString)

                Case 57
                    qNumEndoso = EmiteEndoso_Crea(cendoso, cproces, cproces_poliza, codigo_usuario, Descripcion, param1, param2, , , , , Tipo_endoso)
                    wqNumEndoso = qNumEndoso
                    VG.EjecutaSQL("UPDATE adendoso SET crecibo=0, mprima=0,mimpuesto=0,mtotal=0 WHERE cproces=" & cproces & " and qNumEndoso = " & qNumEndoso.ToString)

                Case 99 'orden de proceder

                    qNumEndoso = EmiteEndoso_Crea(cendoso, cproces, cproces_poliza, codigo_usuario, Descripcion, param1, param2, pprorrata, param1)
                    wqNumEndoso = qNumEndoso
                    VG.EjecutaSQL("UPDATE adendoso SET crecibo=" & VG.EjecutaSQL_escalar("SELECT crecibo FROM adrecibos WHERE cproces = " & cproces) & " WHERE cproces=" & cproces & " AND qNumEndoso = " & qNumEndoso.ToString)

                Case 100 'modificacion suma asegurada

                    '1.Creo el Recibo
                    '----------------
                    Dim xerr As String = String.Empty

                    GeneraRecibo(cproces_poliza, "I", monto, CDbl(param2), xerr, 0, crecibo, 6)
                    If xerr <> String.Empty Then Throw New Exception("Error en GeneraRecibo")

                    '3b actualizo campo de recibo en las coberturas recien agregadas
                    VG.EjecutaSQL("UPDATE adpolcob SET crecibo = '" & crecibo _
                                        & "' WHERE cproces=" & cproces_poliza & " AND crecibo = 0")
                    VG.EjecutaSQL("UPDATE adrecibos SET fdesde='" & param1 & "' WHERE crecibo=" & crecibo)
                    VG.EjecutaSQL("UPDATE adendoso SET crecibo = " & crecibo & " WHERE cproces = " & cproces)

            End Select

        Catch ex As Exception
            'este catch es general para las excepciones no controladas. Algunos metodos tienen el suyo propio
            Dim evento As New GestionEventos
            MsgBox(Err.Description)
            evento.RegistraEvento(GestionEventos.evento.AplicionEndoso, GestionEventos.operaciones.ErrorGenerico, Numero, "Error al aplicar endoso" & cendoso & " con cproces" & cproces & " sobre cproces_poliza " & cproces_poliza & " err: " & ex.Message)
            'quito basura
            VG.EjecutaSQL("delete from adendoso where cproces=" & cproces)
            VG.EjecutaSQL("delete from adpolcob where cproces=" & cproces)
            VG.EjecutaSQL("delete from adrecibos where cproces=" & cproces)

        End Try

    End Sub

    Shared Function dame_configurcion(ByVal id As Integer) As String
        Dim respuesta As Object = VG.EjecutaSQL_escalar("select cws" & id & " from mainsta_dat where cclave=" & VG.Comillas(VG.licencia))
        If IsDBNull(respuesta) Then
            MsgBox("Parámetro no definido en tabla de configuración Mainsta_dat. Por favor defina cws" & id)
            Return "No-Disponible"
        Else
            Return respuesta.ToString
        End If

    End Function


    Shared Sub Multiplica_Poliza(ByVal multiplicador As Double, ByVal cproces As Integer)
        'multiplica por el multiplicador todos los montos,primas y sumas de la poliza



        Dim campos, valores As New ArrayList



        campos.Add("msumabruta")
        valores.Add("msumabruta*" & multiplicador)

        campos.Add("mpridet")
        valores.Add("mpridet*" & multiplicador)

        campos.Add("mprimabruta")
        valores.Add("mprimabruta*" & multiplicador)

        campos.Add("msuma")
        valores.Add("msuma*" & multiplicador)

        campos.Add("mprima")
        valores.Add("mprima*" & multiplicador)

        campos.Add("mimpuesto")
        valores.Add("mimpuesto*" & multiplicador)

        campos.Add("mmontopol")
        valores.Add("mmontopol*" & multiplicador)


        VG.Haz_update("adpoliza", campos, valores, "WHERE cproces=" & cproces)
        campos.Clear()
        valores.Clear()

        campos.Add("msumaaseg")
        valores.Add("msumaaseg*" & multiplicador)

        campos.Add("mpridet")
        valores.Add("mpridet*" & multiplicador)

        campos.Add("mprimabruta")
        valores.Add("mprimabruta*" & multiplicador)


        campos.Add("mprima")
        valores.Add("mprima*" & multiplicador)

        campos.Add("mimpuesto")
        valores.Add("mimpuesto*" & multiplicador)

        VG.Haz_update("adpolcob", campos, valores, "WHERE cproces=" & cproces)


        'reaseguro. Lo hago luego
        'campos.Add("mpret")
        'valores.Add("mpret*" & multiplicador)


        'campos.Add("motrosdes")
        'valores.Add("motrosdes*" & multiplicador)

        'campos.Add("motrosrec")
        'valores.Add("motrosrec*" & multiplicador)

        'campos.Add("mgastos")
        'valores.Add("mgastos*" & multiplicador)

        'campos.Add("motrosgas")
        'valores.Add("motrosgas*" & multiplicador)

        'aqui hay q poner todos los campos de montos




    End Sub

    Public Function DameNuevoCONTA(ByRef contador As String, ByRef licencia As String) As Double
        '---------------------------------------------------------------------------------------
        ' Procedimiento : DameNuevoCONTA
        ' Uso           : General
        ' Fecha         : 29/08/07
        ' Autor         : ASI (Asesores Informáticos) JAMO
        ' Proposito     : Obtener un número nuevo y dejar el contador actualizado
        ' 
        ' Variables del Entorno:
        '               Entrada:
        '               Salida:
        '---------------------------------------------------------------------------------------
        ' Bitacora de Modificaciones:
        ' 
        '
        '---------------------------------------------------------------------------------------
        If Len(Trim(contador)) = 0 Then
            DameNuevoCONTA = 0
            Exit Function
        End If
        Dim cmd As New SqlClient.SqlCommand()
        Dim myConnection As New Data.SqlClient.SqlConnection(ConnectionStringMundisis)
        cmd.Connection = myConnection
        cmd.CommandType = CommandType.StoredProcedure
        cmd.CommandText = "sp_DameNuevoCONTA"
        Dim ccontador As New Data.SqlClient.SqlParameter("@ccontador", SqlDbType.Char, 15)
        ccontador.Value = contador
        ccontador.Direction = ParameterDirection.Input
        cmd.Parameters.Add(ccontador)
        Dim stat As New Data.SqlClient.SqlParameter("@stat", SqlDbType.VarChar, 1)
        stat.Value = ""
        stat.Direction = ParameterDirection.Output
        cmd.Parameters.Add(stat)
        Dim qcontador As New Data.SqlClient.SqlParameter("@qcontador", SqlDbType.Int)
        qcontador.Direction = ParameterDirection.Output
        cmd.Parameters.Add(qcontador)
        Try
            myConnection.Open()
            cmd.ExecuteNonQuery()
            DameNuevoCONTA = qcontador.Value
        Catch ex As Exception
            DameNuevoCONTA = 0
        Finally
            myConnection.Dispose()
            cmd.Dispose()
        End Try


    End Function

    Sub GeneraRecibo(ByVal cproces As Integer, ByVal itiporec As String, ByVal mprima As Double, ByVal msuma As Double, ByRef salidaError As String, Optional ByVal certificado As Integer = 0, Optional ByRef outNumeroRecibo As Integer = 0, Optional ByVal pimpuesto As Double = 0, Optional ByRef Recibo_devuelto As Integer = 0)
        'TONY
        'esto va a DLL, capa de negocio
        'Debe de ser suficiente para generar cualquier tipo de recibo. Que vaya creciendo con parámetros opcionales.
        '--------------------------------------------------------------
        'If wini = False Then conexiones(licencia)

        Dim ds As New DataSet1
        Dim recibo As DataSet1.adrecibosRow
        recibo = ds.adrecibos.NewadrecibosRow

        Dim poliza As Data.SqlClient.SqlDataReader = VG.EjecutaSQL_reader("SELECT * FROM adpoliza WHERE cproces=" & cproces)
        poliza.Read()

        With recibo

            ''esto lo agrego jose 
            '.BINFEJE = False
            '.BPAGAR = False
            '.ICAUSACANBAN = "0"
            '.BCANBAN = False
            '.IESTABAN = "0"
            '.SALDOPRESTAMO = 0.0
            '.csucurpromo = 0.0
            '.creferido = 0.0
            '.nauditoria = 0.0
            '.nano = Format(Now, "yyyy")
            '.nsemana = DatePart("ww", Today)
            '.nremesa = 0
            '.ctalonario = 0
            '.nadendo = 0
            '.pcomision_cob = 0
            '.nimprs = 0
            '.pprorrata = 1
            '.xhdesde = "12:00 AM"
            '.mpridetext = 0
            '.mprimagrabadaext = 0
            ''hasta aqui agrego jose

            .cproces = cproces
            .ccerti = certificado
            .u_version = "*"
            'Dim asi As New Asidllcon00.wasi
            Dim numeroRecibo As Integer = asi.DameNuevoCONTA(asi.DameCCONTADOR(poliza("cramo"), "xcontrec", licencia), licencia)
            'DameNuevoCONTA("RECIBO", VG.licencia)
            'Asidllcon00.wasi.DameNuevoCONTA(Asidllcon00.wasi.DameCCONTADOR(poliza("cramo"), "xcontrec", licencia), licencia)
            .crecibo = numeroRecibo
            outNumeroRecibo = .crecibo

            .cpoliza = poliza("cpoliza")
            .fanopol = poliza("fanopol")
            .fmespol = poliza("fmespol")
            .cejecta = poliza("cejecta")
            .cnpoliza = poliza("cnpoliza")
            .cnpoliza_mae = poliza("cnpoliza_mae")
            .cramo = poliza("cramo")
            .itipoprod = poliza("itipoprod")
            .itiponegocio = poliza("itiponegocio")
            .itipopol = poliza("itipopol")
            .iestadoren = poliza("iestadoren")
            .cpoliza_mae = poliza("cpoliza_mae")
            .ccerti_mae = poliza("ccerti_mae")

            .itiporec = itiporec
            .imodcobro = ""
            .cdoccob = 0
            .csucur = poliza("csucur")
            .criesgo = 0 'esto depende del ramo
            .cserie_rea = 0 'esta se actualiza despues de la distribucion de reaseguro

            .casegurado = poliza("casegurado")
            .ctenedor = poliza("ctenedor")
            .cbeneficiario = poliza("cbeneficiario")
            .cacreedor = poliza("cacreedor")
            .cfinanciera = poliza("cfinanciera")
            .cplan = poliza("cplan")
            .cdisprod = poliza("cdisprod")
            .csubprod = poliza("csubprod")
            .mcompart = poliza("mcomision")
            .mcompartext = poliza("mcomisionext")
            .ctipoproductor = 0
            .czonaprod = poliza("czonaprod")
            .cregion = poliza("cregion")
            .ccentserv = poliza("ccentserv")
            .cmercado = poliza("cmercado")
            .cprofesion = poliza("cprofesion")
            .cgrupoecono = poliza("cgrupoecono")
            .cempresa = poliza("cempresa")
            .cpais = poliza("cpais")
            .cestado = poliza("cestado")
            .cciudad = poliza("cciudad")

            Try
                .czonpos = poliza("czonpos")
            Catch ex As Exception
                .czonpos = 0
            End Try

            .cmoneda = poliza("cmoneda")
            .iexon_imp = 0 'DameExonImp(poliza("ctenedor, licencia) '20/11/2003 77
            .ptasamon = poliza("ptasamon")


            .fdesde_pol = poliza("fdesde")
            .fhasta_pol = poliza("fhasta")

            .femision = Today

            Dim esrenovprima As Boolean = VG.EjecutaSQL_escalar("select bprimareno from maplanes where cramo=" & poliza("cramo") & " and cplan='" & poliza("cplan") & "'")
            If esrenovprima Then
                .fdesde = poliza("ffact_desde")
                .fhasta = poliza("ffact_hasta")
            Else
                .fdesde = poliza("fdesde")
                .fhasta = poliza("fhasta")
            End If

            If Not IsDBNull(poliza("fanulacion")) Then
                .fanulacion = poliza("fanulacion")
            End If

            .xnprestamo = poliza("xnprestamo")
            .itipoanul = poliza("itipoanul")
            .ccausaanul = 0

            .SetfcontabNull()
            .fanomescont = 0
            .nlote = 0
            .iestcont = "P"
            .SetfcobroNull()

            .iestadorec = "P"

            If Not IsDBNull(poliza("cfinanciera")) Then
                .ifinanciado = True
            Else
                .ifinanciado = False
            End If

            .crelpago = 0
            If Not IsDBNull(poliza("fdevolucion")) Then
                .fdevolucion = poliza("fdevolucion")
            End If
            .idevolucion = poliza("idevolucion")
            .iformadevo = poliza("iformadevo")
            .qnumdev = poliza("qnumdev")
            .mmontodev = poliza("mmontodev")
            .mmontodevext = poliza("mmontodevext")
            .crecdevuelto = Recibo_devuelto
            .creciboant = 0
            .crecibopos = 0

            'cantidades
            .mpridet = mprima

            .msumabruta = msuma
            .msumabrutaext = 0
            .mprimabruta = mprima
            .mprimabrutaext = 0
            .pcoa = 0
            .msumacoa = 0
            .msumacoaext = 0
            .mprimacoa = 0
            .mprimacoaext = 0
            .pretcoa = 0
            .msuma = msuma
            .msumaext = 0

            .mprimaext = 0
            .mpridetreas = 0
            .mpridetreasext = 0
            .mprimareas = 0
            .mprimareasext = 0
            .mprimareas_c = 0
            .mprimareasext_c = 0
            .mprimareas_n = 0
            .mprimareasext_n = 0
            .potrosrec = 0
            .motrosrecreas = 0
            .motrosrecreasext = 0
            .motrosrec = 0
            .motrosrecext = 0
            .potrosdes = 0
            .motrosdesreas = 0
            .motrosdesreasext = 0
            .motrosdes = 0
            .motrosdesext = 0
            .pgastos = 0
            .mgastos = 0
            .mgastosext = 0
            .potrosgas = 0
            .motrosgas = 0
            .motrosgasext = 0
            .mabono = 0
            .mabonoext = 0

            .pinteres = 0
            .minteres = 0
            .mprimagrabada = mprima

            .mprima = .mpridet - .motrosdes + .motrosrec
            .pimpuesto = pimpuesto
            .mimpuesto = Math.Round(pimpuesto * (.motrosgas + .mgastos + .mprimagrabada) / 100, 2)
            .mmontorec = .mprima + .minteres + .mimpuesto + .mgastos + .motrosgas
            .mpret = mprima
            .mpendiente = .mmontorec



            .mimpuestoext = 0
            .mmontorecext = 0

            .mpretext = 0
            .mpcedida = 0
            .mpcedidaext = 0
            .mpfp = 0
            .mpfpext = 0

            .fdesde_dev = poliza("fdesde")
            .fhasta_dev = poliza("fhasta")

            .mprimadev = 0
            .mprimadevext = 0
            .mprimadif = 0
            .mprimadifext = 0
            .iestadoimp = "N"
            .XOBJASE = "" 'descripcion objeto asegurado. pendiente
            .xobserva = ".."
            .bobsimp = 0
            .SetxobsimpNull()

            .SetfpagoNull()
            .mpagado = 0
            .mpagadoext = 0

            .mpendientext = 0
            .mpagcoa = 0
            .mpagcoaext = 0
            .pcomision = 0
            .mcomision = 0
            .mcomisionext = 0
            .ccobrador = poliza("ccobrador")
            .pcobrador = poliza("pcobrador")
            .mcobrador = poliza("mcobrador")
            .mcobradorext = poliza("mcobradorext")
            .csupervisor = poliza("csupervisor")
            .psupervisor = poliza("psupervisor")
            .msupervisor = poliza("msupervisor")
            .msupervisorext = poliza("msupervisorext")
            .cgerente = poliza("cgerente")
            .pgerente = poliza("pgerente")
            .mgerente = poliza("mgerente")
            .mgerenteext = poliza("mgerenteext")

            .minteresext = poliza("minteresext")
            .cendoso = poliza("cendoso")
            If Endoso = 3 Then
                .cforcob = Cforcob
                .ifrecuencia = Ifrecuencia
            Else
                .cforcob = poliza("cforcob")
                .ifrecuencia = poliza("ifrecuencia")
            End If
            .czona_cobro = poliza("czona_cobro")
            .cbanco = poliza("cbanco")
            .cagenban = poliza("cagenban")
            If Not IsDBNull(poliza("xcuentabanc")) Then
                .xcuentabanc = ("xcuentabanc")
            End If

            .itipocta = poliza("itipocta")
            If Not IsDBNull(poliza("xtarjeta")) Then
                .xtarjeta = poliza("xtarjeta")
            End If

            .itarjeta = poliza("itarjeta")
            .qcuotas = poliza("qcuotas")
            .qcuotas = 12 'esto va como paramtero
            If Not IsDBNull(poliza("fanomes")) Then
                .fanomes = poliza("fanomes")
            End If
            .bchk_geren = False
            .istatpcnd = "N"

            .SetfpcndNull()
            .SetxplacaNull()
            .cprog = poliza("cprog")
            .ifuente = "NET"
            '.bok = "1"
            .bok = "0" ' jose


            .cerror = ""
            .fingreso = Now
            .cusuario = Numero
            .ccategoria = 0
            .ccategoriaauto = 0
            .fultmod = Now
            .cusuariomod = Numero
            .ccategoriamod = 0

        End With

        ds.adrecibos.Rows.Add(recibo)

        Dim ta As New DataSet1TableAdapters.adrecibosTableAdapter
        ta.Update(ds)

    End Sub


    Sub GeneraReciboBeneficiario(ByVal cproces As Integer, ByVal itiporec As String, ByVal mprima As Double, ByVal msuma As Double, ByRef salidaError As String, Optional ByVal certificado As Integer = 0, Optional ByRef outNumeroRecibo As Integer = 0, Optional ByVal pimpuesto As Double = 0, Optional ByRef Recibo_devuelto As Integer = 0, Optional ByRef cendoso As Integer = 1021)
        'TONY
        'esto va a DLL, capa de negocio
        'Debe de ser suficiente para generar cualquier tipo de recibo. Que vaya creciendo con parámetros opcionales.
        '--------------------------------------------------------------
        'If wini = False Then conexiones(licencia)

        Dim ds As New DataSet1
        Dim recibo As DataSet1.adrecibosRow
        recibo = ds.adrecibos.NewadrecibosRow

        Dim poliza As Data.SqlClient.SqlDataReader = VG.EjecutaSQL_reader("SELECT * FROM adpoliza WHERE cproces=" & cproces)
        poliza.Read()

        With recibo

            ''esto lo agrego jose 
            '.BINFEJE = False
            '.BPAGAR = False
            '.ICAUSACANBAN = "0"
            '.BCANBAN = False
            '.IESTABAN = "0"
            '.SALDOPRESTAMO = 0.0
            '.csucurpromo = 0.0
            '.creferido = 0.0
            '.nauditoria = 0.0
            '.nano = Format(Now, "yyyy")
            '.nsemana = DatePart("ww", Today)
            '.nremesa = 0
            '.ctalonario = 0
            '.nadendo = 0
            '.pcomision_cob = 0
            '.nimprs = 0
            '.pprorrata = 1
            '.xhdesde = "12:00 AM"
            '.mpridetext = 0
            '.mprimagrabadaext = 0
            ''hasta aqui agrego jose

            .cproces = cproces
            .ccerti = certificado
            .u_version = "*"
            'Dim asi As New Asidllcon00.wasi
            Dim numeroRecibo As Integer = asi.DameNuevoCONTA(asi.DameCCONTADOR(poliza("cramo"), "xcontrec", licencia), licencia)
            'DameNuevoCONTA("RECIBO", VG.licencia)
            'Asidllcon00.wasi.DameNuevoCONTA(Asidllcon00.wasi.DameCCONTADOR(poliza("cramo"), "xcontrec", licencia), licencia)
            .crecibo = numeroRecibo
            outNumeroRecibo = .crecibo

            .cpoliza = poliza("cpoliza")
            .fanopol = poliza("fanopol")
            .fmespol = poliza("fmespol")
            .cejecta = poliza("cejecta")
            .cnpoliza = poliza("cnpoliza")
            .cnpoliza_mae = poliza("cnpoliza_mae")
            .cramo = poliza("cramo")
            .itipoprod = poliza("itipoprod")
            .itiponegocio = poliza("itiponegocio")
            .itipopol = poliza("itipopol")
            .iestadoren = poliza("iestadoren")
            .cpoliza_mae = poliza("cpoliza_mae")
            .ccerti_mae = poliza("ccerti_mae")

            .itiporec = itiporec
            .imodcobro = ""
            .cdoccob = 0
            .csucur = poliza("csucur")
            .criesgo = 0 'esto depende del ramo
            .cserie_rea = 0 'esta se actualiza despues de la distribucion de reaseguro

            .casegurado = poliza("casegurado")
            .ctenedor = poliza("ctenedor")
            .cbeneficiario = poliza("cbeneficiario")
            .cacreedor = poliza("cacreedor")
            .cfinanciera = poliza("cfinanciera")
            .cplan = poliza("cplan")
            .cdisprod = poliza("cdisprod")
            .csubprod = poliza("csubprod")
            .mcompart = poliza("mcomision")
            .mcompartext = poliza("mcomisionext")
            .ctipoproductor = 0
            .czonaprod = poliza("czonaprod")
            .cregion = poliza("cregion")
            .ccentserv = poliza("ccentserv")
            .cmercado = poliza("cmercado")
            .cprofesion = poliza("cprofesion")
            .cgrupoecono = poliza("cgrupoecono")
            .cempresa = poliza("cempresa")
            .cpais = poliza("cpais")
            .cestado = poliza("cestado")
            .cciudad = poliza("cciudad")

            Try
                .czonpos = poliza("czonpos")
            Catch ex As Exception
                .czonpos = 0
            End Try

            .cmoneda = poliza("cmoneda")
            .iexon_imp = 0 'DameExonImp(poliza("ctenedor, licencia) '20/11/2003 77
            .ptasamon = poliza("ptasamon")


            .fdesde_pol = poliza("fdesde")
            .fhasta_pol = poliza("fhasta")

            .femision = Today

            Dim esrenovprima As Boolean = VG.EjecutaSQL_escalar("select bprimareno from maplanes where cramo=" & poliza("cramo") & " and cplan='" & poliza("cplan") & "'")
            If esrenovprima Then
                .fdesde = poliza("fdesde")
                .fhasta = poliza("fdesde")
            Else
                .fdesde = poliza("fdesde")
                .fhasta = poliza("fhasta")
            End If

            If Not IsDBNull(poliza("fanulacion")) Then
                .fanulacion = poliza("fanulacion")
            End If

            .xnprestamo = poliza("xnprestamo")
            .itipoanul = poliza("itipoanul")
            .ccausaanul = 0

            .SetfcontabNull()
            .fanomescont = 0
            .nlote = 0
            .iestcont = "P"
            .SetfcobroNull()

            .iestadorec = "P"

            If Not IsDBNull(poliza("cfinanciera")) Then
                .ifinanciado = True
            Else
                .ifinanciado = False
            End If

            .crelpago = 0
            If Not IsDBNull(poliza("fdevolucion")) Then
                .fdevolucion = poliza("fdevolucion")
            End If
            .idevolucion = poliza("idevolucion")
            .iformadevo = poliza("iformadevo")
            .qnumdev = poliza("qnumdev")
            .mmontodev = poliza("mmontodev")
            .mmontodevext = poliza("mmontodevext")
            .crecdevuelto = 0
            .creciboant = 0
            .crecibopos = 0

            'cantidades
            .mpridet = mprima

            .msumabruta = msuma
            .msumabrutaext = 0
            .mprimabruta = mprima
            .mprimabrutaext = 0
            .pcoa = 0
            .msumacoa = 0
            .msumacoaext = 0
            .mprimacoa = 0
            .mprimacoaext = 0
            .pretcoa = 0
            .msuma = msuma
            .msumaext = 0

            .mprimaext = 0
            .mpridetreas = 0
            .mpridetreasext = 0
            .mprimareas = 0
            .mprimareasext = 0
            .mprimareas_c = 0
            .mprimareasext_c = 0
            .mprimareas_n = 0
            .mprimareasext_n = 0
            .potrosrec = 0
            .motrosrecreas = 0
            .motrosrecreasext = 0
            .motrosrec = 0
            .motrosrecext = 0
            .potrosdes = 0
            .motrosdesreas = 0
            .motrosdesreasext = 0
            .motrosdes = 0
            .motrosdesext = 0
            .pgastos = 0
            .mgastos = 0
            .mgastosext = 0
            .potrosgas = 0
            .motrosgas = 0
            .motrosgasext = 0
            .mabono = 0
            .mabonoext = 0

            .pinteres = 0
            .minteres = 0
            .mprimagrabada = mprima

            .mprima = .mpridet - .motrosdes + .motrosrec
            .pimpuesto = pimpuesto
            .mimpuesto = Math.Round(pimpuesto * (.motrosgas + .mgastos + .mprimagrabada) / 100, 2)
            .mmontorec = .mprima + .minteres + .mimpuesto + .mgastos + .motrosgas
            .mpret = mprima
            .mpendiente = .mmontorec



            .mimpuestoext = 0
            .mmontorecext = 0

            .mpretext = 0
            .mpcedida = 0
            .mpcedidaext = 0
            .mpfp = 0
            .mpfpext = 0

            .fdesde_dev = poliza("fdesde")
            .fhasta_dev = poliza("fhasta")

            .mprimadev = 0
            .mprimadevext = 0
            .mprimadif = 0
            .mprimadifext = 0
            .iestadoimp = "N"
            .XOBJASE = "" 'descripcion objeto asegurado. pendiente
            .bobsimp = 0
            .SetxobsimpNull()

            .SetfpagoNull()
            .mpagado = 0
            .mpagadoext = 0

            .mpendientext = 0
            .mpagcoa = 0
            .mpagcoaext = 0
            .pcomision = 0
            .mcomision = 0
            .mcomisionext = 0
            .ccobrador = poliza("ccobrador")
            .pcobrador = poliza("pcobrador")
            .mcobrador = poliza("mcobrador")
            .mcobradorext = poliza("mcobradorext")
            .csupervisor = poliza("csupervisor")
            .psupervisor = poliza("psupervisor")
            .msupervisor = poliza("msupervisor")
            .msupervisorext = poliza("msupervisorext")
            .cgerente = poliza("cgerente")
            .pgerente = poliza("pgerente")
            .mgerente = poliza("mgerente")
            .mgerenteext = poliza("mgerenteext")

            .minteresext = poliza("minteresext")
            .cendoso = cendoso
            If Endoso = 3 Then
                .cforcob = Cforcob
                .ifrecuencia = Ifrecuencia
            Else
                .cforcob = poliza("cforcob")
                .ifrecuencia = poliza("ifrecuencia")
            End If
            .czona_cobro = poliza("czona_cobro")
            .cbanco = poliza("cbanco")
            .cagenban = poliza("cagenban")
            If Not IsDBNull(poliza("xcuentabanc")) Then
                .xcuentabanc = ("xcuentabanc")
            End If

            .itipocta = poliza("itipocta")
            If Not IsDBNull(poliza("xtarjeta")) Then
                .xtarjeta = poliza("xtarjeta")
            End If

            .itarjeta = poliza("itarjeta")
            .qcuotas = poliza("qcuotas")
            .qcuotas = 12 'esto va como paramtero
            If Not IsDBNull(poliza("fanomes")) Then
                .fanomes = poliza("fanomes")
            End If
            .bchk_geren = False
            .istatpcnd = "N"

            .SetfpcndNull()
            .SetxplacaNull()
            .cprog = poliza("cprog")
            .ifuente = "NET"
            '.bok = "1"
            .bok = "0" ' jose


            .cerror = ""
            .fingreso = Now
            .cusuario = Numero
            .ccategoria = 0
            .ccategoriaauto = 0
            .fultmod = Now
            .cusuariomod = Numero
            .ccategoriamod = 0

        End With

        ds.adrecibos.Rows.Add(recibo)

        Dim ta As New DataSet1TableAdapters.adrecibosTableAdapter
        ta.Update(ds)

    End Sub



#Region "Rutinas de Caja"

    Public Function CJ_ActuCAJA(ByVal csucur_caja As Integer, ByVal ccajero As Decimal, ByVal fcaja As Date, ByVal ccaja As Integer, ByVal cpago As Double, ByVal cestcta As Double, ByVal witipomov As String, _
        ByVal ctransaccion As Double, ByVal cmoneda As String, ByVal cramo As Double, ByVal cdisprod As Double, _
        ByVal mcaja As Double, ByVal mcajaloc As Double, ByVal mcajaext As Double, ByVal mefe As Double, ByVal mche As Double, ByVal mtar As Double, ByVal motros As Double, _
        ByVal xrecibido As String, ByVal xporcuenta As String, ByVal xobserva As String, Optional ByRef xError As String = Nothing) As Boolean
        '---------------------------------------------------------------------------------------
        ' Procedimiento : CJ_ActuCAJA
        ' Uso           :       Caja
        ' Fecha         :       01/10/2007
        ' Autor         :       Gustavo Baltodano
        ' Proposito     :       Actualiza una operacion de ingreso vario en los archivos de caja
        ' 
        ' Variables del Entorno y funciones dependientes
        '               Entrada: Variables principales de la Caja (Sucursal, Cajero, Fecha, NoCaja, Cpago)
        '                        ctransaccion
        '                        montos de la caja
        '               Salida:  True/False
        'Base de Datos
        '               Tablas Modificadas: cbmovcaj_e, cbotrospagos, pdprimas (segun tipo de operacion)
        '---------------------------------------------------------------------------------------
        ' Bitacora de Modificaciones:
        '               01/10/2007    NOTA: Aun no terminada, no usar
        '
        '---------------------------------------------------------------------------------------

        'Dim tec As New Asidllcon00.TEC
        Dim rsa As New ADODB.Recordset
        Dim mau As New ADODB.Recordset
        Dim SQL As String
        Dim itipopago As String

        CJ_ActuCAJA = True

        If cestcta <> 0 Then

            If mefe + mche + mtar + motros <> mcaja Then
                xError = "No cuadra la forma de pago con el total de la caja"
                GoTo salida
            End If

            SQL = "UPDATE dbo.cbmovcaj_e SET xrecibido='" & xrecibido.Trim & "' WHERE cestcta=" & cestcta
            corre(SQL)

            'Distribuyo efe, che, tar, otros entre el edocta
            SQL = "UPDATE cbmovcaj_e SET "
            SQL = SQL & " mefe = round(" & mefe & "/(SELECT sum(mcaja) FROM cbmovcaj_e WHERE csucur_caja=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja & " AND cestcta=" & cestcta & ") * mcaja ,2),"
            SQL = SQL & " mche = round(" & mche & "/(SELECT sum(mcaja) FROM cbmovcaj_e WHERE csucur_caja=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja & " AND cestcta=" & cestcta & ") * mcaja ,2),"
            SQL = SQL & " mtar = round(" & mtar & "/(SELECT sum(mcaja) FROM cbmovcaj_e WHERE csucur_caja=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja & " AND cestcta=" & cestcta & ") * mcaja ,2),"
            SQL = SQL & " motros = round(" & motros & "/(SELECT sum(mcaja) FROM cbmovcaj_e WHERE csucur_caja=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja & " AND cestcta=" & cestcta & ") * mcaja ,2)"
            SQL = SQL & " WHERE csucur_caja=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja & " AND cestcta = " & cestcta
            corre(SQL)

            'Ajusto centavos de redondeo
            Dim xAjusteEN As String
            If CDbl(mefe) <> 0 Then
                xAjusteEN = "mefe"
            ElseIf CDbl(mche) <> 0 Then
                xAjusteEN = "mche"
            ElseIf CDbl(mtar) <> 0 Then
                xAjusteEN = "mtar"
            Else
                xAjusteEN = "motros"
            End If
            SQL = "UPDATE cbmovcaj_e SET " & xAjusteEN
            SQL = SQL & " = " & xAjusteEN & " + "
            SQL = SQL & " mcaja - mefe - mche - mtar - motros"
            SQL = SQL & " WHERE csucur_caja=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja
            SQL = SQL & " AND cestcta = " & cestcta & " AND mcaja - mefe - mche - mtar - motros <>0"
            corre(SQL)

            SQL = "UPDATE TOP (1) cbmovcaj_e SET mefe = mefe + (" & mefe & " - (SELECT SUM(mefe) FROM cbmovcaj_e WHERE csucur_caja=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja & " AND cestcta=" & cestcta & "))"
            SQL = SQL & " WHERE csucur_caja=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja & " AND cestcta =" & cestcta
            corre(SQL)
            SQL = "UPDATE TOP (1) cbmovcaj_e SET mche = mche + (" & mche & " - (SELECT SUM(mche) FROM cbmovcaj_e WHERE csucur_caja=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja & " AND cestcta=" & cestcta & "))"
            SQL = SQL & " WHERE csucur_caja=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja & " AND cestcta =" & cestcta
            corre(SQL)
            SQL = "UPDATE TOP (1) cbmovcaj_e SET mtar = mtar + (" & mtar & " - (SELECT SUM(mtar) FROM cbmovcaj_e WHERE csucur_caja=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja & " AND cestcta=" & cestcta & "))"
            SQL = SQL & " WHERE csucur_caja=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja & " AND cestcta =" & cestcta
            corre(SQL)
            SQL = "UPDATE TOP (1) cbmovcaj_e SET motros = motros + (" & motros & " - (SELECT SUM(motros) FROM cbmovcaj_e WHERE csucur_caja=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja & " AND cestcta=" & cestcta & "))"
            SQL = SQL & " WHERE csucur_caja=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja & " AND cestcta =" & cestcta
            corre(SQL)

            Exit Function
        End If

        mau.Open("SELECT * FROM dbo.MAUTOCAJA WHERE NASIPRE=" & ctransaccion, VG.Oleconsis, ADODB.CursorTypeEnum.adOpenForwardOnly, ADODB.LockTypeEnum.adLockReadOnly)
        If mau.EOF Then GoTo salida
        If tec.EsDepoBAN(ctransaccion, VG.licencia) = True Then
            If ctransaccion <> 4444 Then
                If IsDBNull(mau.Fields("cbancia").Value) And IsDBNull(mau.Fields("cbanciaext").Value) Then
                    xError = "La transacción de depósito en banco requiere que tenga asignada una cuenta de banco"
                    GoTo salida
                End If
                If Not IsDBNull(mau.Fields("cbancia").Value) Then
                    cmoneda = VG.cws(15)
                End If
                If Not IsDBNull(mau.Fields("cbanciaext").Value) Then
                    cmoneda = VG.cws(16)
                End If
            End If
        End If

        mcaja = mefe + mche + mtar + motros
        SQL = "SELECT xrecibido, xporcuenta, xobserva, ctransaccion, mcaja, mcajaloc, mcajaext, iefe, mefe, iche, mche, itar, mtar, iotros, motros, cmoneda, cusuariomod, fultmod "
        SQL = SQL & " FROM dbo.cbmovcaj_e WHERE csucur_caja=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja & " AND cpago=" & cpago
        If rsa.State = 1 Then rsa.Close()
        rsa.Open(SQL, VG.oleconMUN, ADODB.CursorTypeEnum.adOpenDynamic, ADODB.LockTypeEnum.adLockOptimistic)
        With rsa
            If .EOF Then GoTo salida

            .Fields("xrecibido").Value = xrecibido
            .Fields("xporcuenta").Value = xporcuenta
            .Fields("xobserva").Value = xobserva

            .Fields("mcaja").Value = mcaja
            If .Fields("ctransaccion").Value <> 7 And .Fields("ctransaccion").Value <> 9 Then
                If UCase(cmoneda) = UCase(Trim(cws(15))) Then
                    '.Fields("mcajaloc").Value = mcaja
                    .Fields("mcajaloc").Value = 0
                    .Fields("mcajaext").Value = 0
                Else
                    .Fields("mcajaloc").Value = 0
                    .Fields("mcajaext").Value = mcaja
                End If
            Else
                .Fields("mcajaloc").Value = mcajaloc
                .Fields("mcajaext").Value = mcajaext
            End If
            .Fields("mefe").Value = mefe
            .Fields("iefe").Value = IIf(CDbl(mefe) = 0, False, True)
            .Fields("mche").Value = mche
            .Fields("iche").Value = IIf(CDbl(mche) = 0, False, True)
            .Fields("mtar").Value = mtar
            .Fields("itar").Value = IIf(CDbl(mtar) = 0, False, True)
            .Fields("motros").Value = motros
            .Fields("iotros").Value = IIf(CDbl(motros) = 0, False, True)
            .Fields("cmoneda").Value = cmoneda
            If .Fields("mefe").Value <> 0 And .Fields("mche").Value = 0 And .Fields("mtar").Value = 0 Then
                itipopago = "E"
            ElseIf .Fields("mefe").Value = 0 And .Fields("mche").Value <> 0 And .Fields("mtar").Value = 0 Then
                itipopago = "C"
            ElseIf .Fields("mefe").Value = 0 And .Fields("mche").Value = 0 And .Fields("mtar").Value <> 0 Then
                itipopago = "T"
            Else
                itipopago = "O"
            End If

            .Fields("cusuariomod").Value = Numero
            .Fields("fultmod").Value = Date.Now
            .Update()
        End With

        Dim wNTRANPDP As Double

        SQL = "SELECT ntranpdp, ctenedor, mmonto, cmoneda, itransaccion, itipopago, cdisprod, cramo, cusuariomod, fultmod"
        SQL = SQL & " FROM dbo.cbotrospagos WHERE csucur_caja=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja & " AND cpago=" & cpago
        If rsa.State = 1 Then rsa.Close()
        rsa.Open(SQL, VG.oleconMUN, ADODB.CursorTypeEnum.adOpenDynamic, ADODB.LockTypeEnum.adLockOptimistic)

        If tec.DameTRAN("CMVTO_DEDU", VG.licencia) = ctransaccion Then
            If tec.ExisteEnte_CONFIGURA(rsa.Fields("ctenedor").Value, "bproductor", VG.licencia) = False Then
                xError = "Esta transacción requiere que el ente sea un productor"
                GoTo salida
            End If
        End If
        If tec.DameTRAN("CMVTO_DEDU_EMPL", VG.licencia) = ctransaccion Then
            If tec.ExisteEnte_CONFIGURA(rsa.Fields("ctenedor").Value, "bempleado", VG.licencia) = False Then
                xError = "Esta transacción requiere que el ente sea un empleado"
                GoTo salida
            End If
        End If

        With rsa
            If .EOF Then GoTo salida
            wcliente = .Fields("ctenedor").Value
            wNTRANPDP = .Fields("ntranpdp").Value
            .Fields("mmonto").Value = mcaja
            .Fields("cmoneda").Value = cmoneda
            .Fields("itransaccion").Value = IIf(CDbl(mcaja) < 0, "E", "I")
            .Fields("itipopago").Value = itipopago
            .Fields("cdisprod").Value = cdisprod
            .Fields("cramo").Value = cramo
            .Fields("cusuariomod").Value = Numero
            .Fields("fultmod").Value = Date.Now
            .Update()
        End With

        If ctransaccion = 454 Then 'Transaccion ingreso de remesa
            SQL = "UPDATE mremesas SET mpago=" & mcaja & ", cmoneda='" & cmoneda
            SQL = SQL & "' WHERE csucur_caja=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja & " and cpago=" & cpago
            corre(SQL)
        End If

        'Transaccion automatica deduccion a cargo de agentes (sistema de comisiones)
        Dim sqlINS As String
        If tec.DameTRAN("CMVTO_DEDU", VG.licencia) = ctransaccion Then
            'CreaCMVTODEDU(caja.Recordset!cpago)
            SQL = "SELECT * FROM cmvtodeduccion WHERE cpago=" & cpago
            If rsa.State = 1 Then rsa.Close()
            rsa.Open(SQL, VG.Oleconsis, ADODB.CursorTypeEnum.adOpenDynamic, ADODB.LockTypeEnum.adLockOptimistic)
            If rsa.EOF Then
                sqlINS = "INSERT INTO cmvtodeduccion VALUES ("
                sqlINS = sqlINS & wcliente & ",'D'," & asi.DameNuevoCONTA("CMNUMETRAN", VG.licencia) & ",1,1,'"
                sqlINS = sqlINS & xobserva.Trim & "'," & asi.DameMonedai(cmoneda, VG.licencia) & ","
                sqlINS = sqlINS & mcaja * -1 & ",'" & Format(fcaja, "dd/MM/yyyy") & "','P','V',"
                If wcia = 4 Then sqlINS = sqlINS & "174," 'nasipre
                If wcia = 5 Then sqlINS = sqlINS & "174," 'nasipre
                sqlINS = sqlINS & "0,0,0,Null,'SIS',Null,Null,Null,'"
                sqlINS = sqlINS & Date.Now & "'," & Numero & ","
                sqlINS = sqlINS & "Null,Null,Null,'"
                sqlINS = sqlINS & Date.Now & "'," & Numero & ",Null," & cpago & ")"
                If corresis(CStr(sqlINS)) = False Then
                    xError = "No se pudo adicionar la deducción en el sistema de comisiones"
                    GoTo salida
                    'MsgBox("No se pudo adicionar la deducción en el sistema de comisiones, notifique a comisiones" & Chr(13) & "para adicionar manualmente esta deducción en el sistema de comisiones", vbCritical)
                End If
            Else
                sqlINS = "UPDATE cmvtodeduccion set "
                sqlINS = sqlINS & "xdescripcion='" & xobserva.Trim & "',"
                sqlINS = sqlINS & "mdedu=" & mcaja * -1 & ","
                sqlINS = sqlINS & "cdgomone=" & asi.DameMonedai(cmoneda, VG.licencia) & ","
                sqlINS = sqlINS & "cdgoprod=" & wcliente & ","
                sqlINS = sqlINS & "cusuariomod=" & Numero & ","
                sqlINS = sqlINS & "fultmod='" & Date.Now & "'"
                sqlINS = sqlINS & " WHERE cpago=" & cpago
                If corresis(CStr(sqlINS)) = False Then
                    xError = "No se pudo actualizar la deducción en el sistema de comisiones"
                    GoTo salida
                    'MsgBox("No se pudo actualizar la deducción en el sistema de comisiones, notifique a comisiones" & Chr(13) & "para adicionar manualmente esta deducción en el sistema de comisiones", vbCritical)
                End If
            End If
        End If

        If ctransaccion <> 439 Then GoTo saltaTRANDEPO
        SQL = "SELECT ftransaccion, cramo, cnpoliza, cmoneda, mprimadep, maplicado, msaldodep, iaplica, iestado, xobserva, iestcont, cusuario, fultmod"
        SQL = SQL & " FROM dbo.pdprimas WHERE ntranpdp=" & wNTRANPDP
        If rsa.State = 1 Then rsa.Close()
        rsa.Open(SQL, VG.oleconMUN, ADODB.CursorTypeEnum.adOpenDynamic, ADODB.LockTypeEnum.adLockOptimistic)
        With rsa
            If .EOF Then GoTo salida
            .Fields("ftransaccion").Value = fcaja
            .Fields("cramo").Value = 0
            .Fields("cnpoliza").Value = ""
            .Fields("cmoneda").Value = cmoneda
            .Fields("mprimadep").Value = mcaja
            .Fields("maplicado").Value = 0
            .Fields("msaldodep").Value = mcaja
            .Fields("iaplica").Value = "P"
            .Fields("iestado").Value = "V"
            .Fields("xobserva").Value = xobserva
            .Fields("iestcont").Value = "P"

            .Fields("cusuario").Value = Numero
            .Fields("fultmod").Value = Date.Now
            .Update()

        End With
saltaTRANDEPO:
        If rsa.State = 1 Then rsa.Close()
        If mau.State = 1 Then mau.Close()
        rsa = Nothing
        mau = Nothing
        Exit Function
salida:
        If rsa.State = 1 Then rsa.Close()
        If mau.State = 1 Then mau.Close()
        'rsa = Nothing
        mau = Nothing
        CJ_ActuCAJA = False
        Exit Function
    End Function


    Public Function CJ_AnulaCAJA(ByVal csucur_caja As Integer, ByVal ccajero As Decimal, ByVal fcaja As Date, ByVal ccaja As Integer, ByVal cpago As Double, ByVal witipomov As String, ByVal cestcta As Double, Optional ByRef xError As String = Nothing) As Boolean
        On Error GoTo salida
        Dim SQL As String

        'Dim tec As New Asidllcon00.TEC
        CJ_AnulaCAJA = True

        'Revierto Operacion de Caja
        SQL = "UPDATE cbmovcaj_e SET pretencion=0, mretencion=0, mretencionext=0,"
        SQL = SQL & " mcaja=0, mcajaloc=0, mcajaext=0, iefe=0, mefe=0, iche=0, mche=0, itar=0, mtar=0, iotros=0, motros=0,"
        SQL = SQL & " xobserva='ANULADO'," '"CION DE ' + rtrim(xobserva),"
        SQL = SQL & " cusuariomod=" & Numero & ", fultmod=getdate()"
        SQL = SQL & " WHERE csucur_caja=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja
        If cestcta <> 0 Then SQL = SQL & " AND cestcta=" & cestcta Else SQL = SQL & " AND cpago=" & cpago
        If corre(SQL) = False Then GoTo salida

        'Revierto Otros Pagos
        SQL = "UPDATE cbotrospagos SET mmonto=0"
        SQL = SQL & " WHERE csucur_caja=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja
        If cestcta <> 0 Then SQL = SQL & " AND cestcta=" & cestcta Else SQL = SQL & " AND cpago=" & cpago
        If corre(SQL) = False Then GoTo salida

        Dim xArchTMP_A As String = "dbo.WWWrecA_" & cpago
        Dim xArchTMP_B As String = "dbo.WWWrecB_" & cpago
        If cestcta <> 0 Then
            'Revierto Primas
            SQL = "UPDATE cbrecpagos SET mpagado=0, mcobrador=0, mproductor=0, msupervisor=0, mgerente=0,"
            SQL = SQL & " mimpuestos=0, mcoaseguro=0, mprima=0, minteres=0, mgastos=0, motrosgas=0,"
            SQL = SQL & " cusuariomod=" & Numero & ", fultmod=getdate()"
            SQL = SQL & " WHERE csucur_caja=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja
            If cestcta <> 0 Then SQL = SQL & " AND cestcta=" & cestcta Else SQL = SQL & " AND cpago=" & cpago
            If corre(SQL) = False Then GoTo salida

            'Revierto Cuotas
            SQL = "UPDATE adrecfpago SET mpagado=0"
            SQL = SQL & " FROM adrecfpago INNER JOIN cbrecpagos ON adrecfpago.crecibo = cbrecpagos.crecibo AND adrecfpago.ccuota = cbrecpagos.ccuota AND adrecfpago.csubcuota = cbrecpagos.csubcuota"
            SQL = SQL & " WHERE csucur_caja=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja
            If cestcta <> 0 Then SQL = SQL & " AND cestcta=" & cestcta Else SQL = SQL & " AND cpago=" & cpago
            If corre(SQL) = False Then GoTo salida

            'Actualizo saldo del recibo
            tec.EliTABLA_mundisis(xArchTMP_A)
            tec.EliTABLA_mundisis(xArchTMP_B)
            corre(SQL)
            SQL = "SELECT crecibo INTO " & xArchTMP_A & " FROM cbrecpagos"
            SQL = SQL & " WHERE csucur_caja=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja
            If cestcta <> 0 Then SQL = SQL & " AND cestcta=" & cestcta Else SQL = SQL & " AND cpago=" & cpago
            SQL = SQL & " GROUP BY crecibo"
            If corre(SQL) = False Then GoTo salida
            SQL = "SELECT cbrecpagos.crecibo, SUM(cbrecpagos.mpagado) AS mpagado INTO " & xArchTMP_B & " FROM cbrecpagos INNER JOIN " & xArchTMP_A
            SQL = SQL & " ON cbrecpagos.crecibo = " & xArchTMP_A & ".crecibo GROUP BY cbrecpagos.crecibo"
            If corre(SQL) = False Then GoTo salida
            SQL = "UPDATE adrecibos SET mpagado=" & xArchTMP_B & ".mpagado"
            SQL = SQL & " FROM adrecibos INNER JOIN " & xArchTMP_B & " ON adrecibos.crecibo=" & xArchTMP_B & ".crecibo"
            If corre(SQL) = False Then GoTo salida
            SQL = "UPDATE adrecibos SET adrecibos.mpendiente = adrecibos.mmontorec - adrecibos.mpagado, adrecibos.iestadorec=(case when adrecibos.mmontorec = adrecibos.mpagado then 'C' else 'P' end)"
            SQL = SQL & " FROM adrecibos INNER JOIN " & xArchTMP_B & " ON adrecibos.crecibo=" & xArchTMP_B & ".crecibo"
            If corre(SQL) = False Then GoTo salida
        End If

        'Actualizo saldo de primas en depositos
        tec.EliTABLA_mundisis(xArchTMP_A)
        tec.EliTABLA_mundisis(xArchTMP_B)
        SQL = "SELECT ntranpdp INTO " & xArchTMP_A & " FROM cbotrospagos"
        SQL = SQL & " WHERE csucur_caja=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja
        If cestcta <> 0 Then SQL = SQL & " AND cestcta=" & cestcta Else SQL = SQL & " AND cpago=" & cpago
        SQL = SQL & " GROUP BY ntranpdp"
        If corre(SQL) = False Then GoTo salida
        SQL = "SELECT cbotrospagos.ntranpdp, SUM(mmonto) AS mmonto INTO " & xArchTMP_B
        SQL = SQL & " FROM cbotrospagos INNER JOIN " & xArchTMP_A & " ON cbotrospagos.ntranpdp=" & xArchTMP_A & ".ntranpdp GROUP BY cbotrospagos.ntranpdp"
        If corre(SQL) = False Then GoTo salida
        SQL = "UPDATE pdprimas SET msaldodep=" & xArchTMP_B & ".mmonto"
        SQL = SQL & " FROM pdprimas INNER JOIN " & xArchTMP_B & " ON pdprimas.ntranpdp=" & xArchTMP_B & ".ntranpdp"
        If corre(SQL) = False Then GoTo salida
        SQL = "UPDATE pdprimas SET maplicado=msaldodep-maplicado"
        SQL = SQL & " FROM pdprimas INNER JOIN " & xArchTMP_B & " ON pdprimas.ntranpdp=" & xArchTMP_B & ".ntranpdp"
        If corre(SQL) = False Then GoTo salida
        Exit Function
salida:
        xError = Err.Description
        CJ_AnulaCAJA = False
    End Function

    Public Function CJ_AdicionaIV(ByVal csucur_caja As Integer, ByVal ccajero As Decimal, ByVal fcaja As Date, ByVal ccaja As Integer, ByVal witipocaja As String, ByVal ctransaccion As Double, ByVal monto As Double, ByVal wcliente As Double, Optional ByRef xError As String = Nothing, Optional ByVal mefec As Double = 0, Optional ByVal mche As Double = 0, Optional ByVal mtar As Double = 0, Optional ByVal motros As Double = 0, Optional ByVal Solicitud As Integer = 0) As Double
        '---------------------------------------------------------------------------------------
        ' Procedimiento : CJ_AdicionaIV
        ' Uso           :       Caja
        ' Fecha         :       27/09/2007
        ' Autor         :       Gustavo Baltodano
        ' Proposito     :       Adiciona una operacion de ingreso vario en los archivos de caja
        ' 
        ' Variables del Entorno y funciones dependientes
        '               Entrada: Variables principales de la Caja (Sucursal, Cajero, Fecha, NoCaja
        '                        ctransaccion
        '                        wcliente
        '               Salida:  wcpago_cj (cero si hubo error)
        'Base de Datos
        '               Tablas Modificadas: cbmovcaj_e, cbotrospagos, pdprimas (segun tipo de operacion
        '---------------------------------------------------------------------------------------
        ' Bitacora de Modificaciones:
        '               27/09/2007    NOTA: Aun no terminada, no usar
        '
        '---------------------------------------------------------------------------------------

        'Dim tec As New Asidllcon00.TEC


        Dim rsa As New ADODB.Recordset
        Dim mau As New ADODB.Recordset
        Dim mae As New ADODB.Recordset

        Dim sql As String
        Dim xCPAGO As Double = 0
        Dim nTRAN As Double
        Dim wTRAN As Double
        Dim wcmoneda As String
        Dim wcambio As Double
        Dim wremesa As Double = 0
        Dim wcreferencia As String = "0"
        Dim xConceptoCJ As String = ""

        Dim itipopago As String

        If tec.DameTRAN("CMVTO_DEDU", VG.licencia) = ctransaccion Then
            If tec.ExisteEnte_CONFIGURA(wcliente, "bproductor", VG.licencia) = False Then
                xError = "Esta transacción requiere que el ente sea un productor"
                GoTo salida
            End If
        End If
        If tec.DameTRAN("CMVTO_DEDU_EMPL", VG.licencia) = ctransaccion Then
            If tec.ExisteEnte_CONFIGURA(wcliente, "bempleado", VG.licencia) = False Then
                xError = "Esta transacción requiere que el ente sea un empleado"
                GoTo salida
            End If
        End If

        xCPAGO = asi.DameNuevoCONTA("CPAGO", licencia)
        nTRAN = 1
        wTRAN = (xCPAGO * 10000) + nTRAN
        wcmoneda = VG.cws(15)
        wcambio = tec.DameCambio("SIS", 2, fcaja, VG.licencia)

        sql = "SELECT cci_rif, cid, ipersona, xcliente FROM dbo.maentes WHERE cci_rif=" & wcliente
        mae.Open(sql, VG.oleconMUN, ADODB.CursorTypeEnum.adOpenForwardOnly, ADODB.LockTypeEnum.adLockReadOnly)
        If mae.EOF Then
            xError = "El ente seleccionado no se encuentra registrado en 'maentes'"
            GoTo salida
        End If

        sql = "SELECT NASIPRE, Descripcion FROM dbo.MAUTOCAJA WHERE NASIPRE=" & ctransaccion
        mau.Open(sql, VG.Oleconsis, ADODB.CursorTypeEnum.adOpenDynamic, ADODB.LockTypeEnum.adLockOptimistic)
        If mau.EOF Then GoTo salida

        wcreferencia = tec.DameNuevoCONTACAJA("CREFERENCIA", witipocaja, ctransaccion, VG.licencia)
        xConceptoCJ = mau.Fields("Descripcion").Value
        If ctransaccion = 454 Then
            wremesa = asi.DameNuevoCONTA("REMESA", VG.licencia)
            xConceptoCJ = "Pago de Remesa N° " & wremesa
        ElseIf ctransaccion = 439 Then
            xConceptoCJ = "Depósito No. " & wTRAN & " A/N " & mae.Fields("xcliente").Value
        End If

        sql = "SELECT * FROM dbo.cbmovcaj_e WHERE csucur_caja=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja & " AND cpago=" & xCPAGO
        If rsa.State = 1 Then rsa.Close()
        rsa.Open(sql, VG.oleconMUN, ADODB.CursorTypeEnum.adOpenDynamic, ADODB.LockTypeEnum.adLockOptimistic)
        With rsa
            If .EOF Then
                .AddNew()
            End If
            .Fields("csucur_caja").Value = csucur_caja
            .Fields("ccajero").Value = ccajero
            .Fields("fcaja").Value = fcaja
            .Fields("ccaja").Value = ccaja
            .Fields("cpago").Value = xCPAGO
            .Fields("u_version").Value = "!"
            .Fields("crelpago").Value = 0
            .Fields("crelpagolin").Value = 0
            .Fields("cestcta").Value = 0
            .Fields("ncierre").Value = 0
            .Fields("fcierre").Value = DBNull.Value
            .Fields("creferencia").Value = wcreferencia
            .Fields("ntrans").Value = wTRAN
            .Fields("imovcaja").Value = "IV"
            .Fields("cmoneda").Value = wcmoneda
            .Fields("ptasamon").Value = wcambio
            .Fields("fcobro").Value = fcaja
            .Fields("cdisprod").Value = 0
            .Fields("ccobrador").Value = 0
            .Fields("ctransaccion").Value = ctransaccion
            .Fields("pretencion").Value = 0
            .Fields("mretencion").Value = 0
            .Fields("mretencionext").Value = 0
            .Fields("mcaja").Value = monto
            .Fields("mcajaloc").Value = monto
            .Fields("mcajaext").Value = 0
            .Fields("iefe").Value = 0
            '.Fields("mefe").Value = monto
            .Fields("mefe").Value = mefec
            .Fields("mefeext").Value = 0
            .Fields("iche").Value = 0
            .Fields("mche").Value = mche
            .Fields("mcheext").Value = 0
            .Fields("itar").Value = 0
            .Fields("mtar").Value = mtar
            .Fields("mtarext").Value = 0
            .Fields("iotros").Value = 0
            .Fields("motros").Value = motros
            .Fields("motrosext").Value = 0
            .Fields("xotros").Value = 0
            .Fields("xrecibido").Value = Mid(mae.Fields("xcliente").Value, 1, 80)
            .Fields("xporcuenta").Value = Mid(mae.Fields("xcliente").Value, 1, 60)
            .Fields("xobserva").Value = Mid(xConceptoCJ, 1, 255)
            .Fields("fcontab").Value = 0
            .Fields("istatmov").Value = "P"
            .Fields("iestcont").Value = "P"
            .Fields("nlote").Value = 0
            .Fields("fanomescont").Value = 0
            .Fields("istatpcnd").Value = "N"
            '.Fields("fpcnd").Value = DBNull.Value
            .Fields("nsemana").Value = 0
            .Fields("nano").Value = Today.Year
            .Fields("cprog").Value = DBNull.Value
            .Fields("ifuente").Value = "SIS_NET"
            .Fields("bok").Value = 0
            .Fields("cerror").Value = DBNull.Value
            .Fields("fingreso").Value = Now
            .Fields("cusuario").Value = 0
            .Fields("ccategoria").Value = 0
            .Fields("cusuarioauto").Value = 0
            If Solicitud <> 0 Then
                .Fields("ccategoriaauto").Value = Solicitud
            Else
                .Fields("ccategoriaauto").Value = 0
            End If
            .Fields("fultmod").Value = Now
            .Fields("cusuariomod").Value = 0
            .Fields("ccategoriamod").Value = 0

            If .Fields("mefe").Value <> 0 And .Fields("mche").Value = 0 And .Fields("mtar").Value = 0 Then
                itipopago = "E"
            ElseIf .Fields("mefe").Value = 0 And .Fields("mche").Value <> 0 And .Fields("mtar").Value = 0 Then
                itipopago = "C"
            ElseIf .Fields("mefe").Value = 0 And .Fields("mche").Value = 0 And .Fields("mtar").Value <> 0 Then
                itipopago = "T"
            Else
                itipopago = "O"
            End If

            .Update()
        End With

        sql = "SELECT * FROM cbotrospagos WHERE csucur_caja=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja & " AND cpago=" & xCPAGO
        If rsa.State = 1 Then rsa.Close()
        rsa.Open(sql, VG.oleconMUN, ADODB.CursorTypeEnum.adOpenDynamic, ADODB.LockTypeEnum.adLockOptimistic)
        With rsa
            If rsa.EOF Then
                .AddNew()
            End If
            .Fields("csucur_caja").Value = csucur_caja
            .Fields("ccajero").Value = ccajero
            .Fields("fcaja").Value = fcaja
            .Fields("ccaja").Value = ccaja
            .Fields("cpago").Value = xCPAGO
            .Fields("u_version").Value = "!"
            .Fields("ntranpdp").Value = wTRAN
            .Fields("ntranpdp_linea").Value = 0
            .Fields("cestcta").Value = 0
            .Fields("cmoneda").Value = wcmoneda
            .Fields("cid").Value = mae.Fields("cid").Value
            .Fields("ctenedor").Value = wcliente
            .Fields("xnombre").Value = Mid(mae.Fields("cid").Value, 1, 60)
            .Fields("itransaccion").Value = "I"
            .Fields("ctransaccion").Value = ctransaccion
            .Fields("ftransaccion").Value = fcaja
            .Fields("cnpoliza").Value = DBNull.Value
            .Fields("fanopol").Value = 0
            .Fields("fmespol").Value = 0
            .Fields("cforcob").Value = 0
            .Fields("crecibo").Value = 0
            .Fields("cramo").Value = 0
            .Fields("cdisprod").Value = 0
            .Fields("csolicid").Value = 0
            .Fields("cnsinies").Value = 0
            .Fields("itipopago").Value = itipopago
            .Fields("crelpago").Value = 0
            .Fields("crelpagolin").Value = 0
            .Fields("ccheque").Value = DBNull.Value
            .Fields("cbanco").Value = 0
            .Fields("cagenban").Value = 0
            .Fields("cclave_conf").Value = DBNull.Value
            .Fields("cvoucher").Value = DBNull.Value
            .Fields("ctarjeta").Value = DBNull.Value
            .Fields("fvcto").Value = DBNull.Value
            .Fields("itarjeta").Value = DBNull.Value
            .Fields("xotros").Value = DBNull.Value
            .Fields("mmonto").Value = monto
            .Fields("mmontoext").Value = 0
            .Fields("iestado").Value = "V"
            .Fields("igenerado").Value = DBNull.Value
            .Fields("iestcont").Value = "P"
            .Fields("fcontab").Value = DBNull.Value
            .Fields("fanomescont").Value = 0
            .Fields("nlote").Value = 0
            .Fields("nsemana").Value = 0
            .Fields("nano").Value = Today.Year
            .Fields("cprog").Value = DBNull.Value
            .Fields("ifuente").Value = "SIS_NET"
            .Fields("bok").Value = 0
            .Fields("cerror").Value = DBNull.Value
            .Fields("fingreso").Value = Now
            .Fields("cusuario").Value = 0
            .Fields("ccategoria").Value = 0
            .Fields("cusuarioauto").Value = 0
            .Fields("ccategoriaauto").Value = 0
            .Fields("fultmod").Value = Now
            .Fields("cusuariomod").Value = 0
            .Fields("ccategoriamod").Value = 0
            .Update()
        End With

        If ctransaccion = 454 Then 'Ingreso de remesa 
            sql = "select * from mremesas where nremesa=0"
            If rsa.State = 1 Then rsa.Close()
            rsa.Open(sql, VG.oleconMUN, ADODB.CursorTypeEnum.adOpenDynamic, ADODB.LockTypeEnum.adLockPessimistic)
            With rsa
                .AddNew()
                .Fields("nremesa").Value = wremesa
                .Fields("u_version").Value = "!"
                .Fields("csucur_caja").Value = csucur_caja
                .Fields("ccajero").Value = ccajero
                .Fields("fcaja").Value = fcaja
                .Fields("ccaja").Value = ccaja
                .Fields("cpago").Value = xCPAGO
                .Fields("cempresa").Value = wcliente
                .Fields("mpago").Value = monto
                .Fields("xdescripcion").Value = Mid(xConceptoCJ, 1, 254)
                .Fields("xdondeesta").Value = "En proceso"
                .Fields("Ipendiente").Value = 0
                '!fcajasal
                '!creferencia = wcpago_cj
                .Fields("creferencia").Value = wcreferencia
                .Fields("ifuente").Value = "SIS_NET"
                '!bok =
                .Fields("fingreso").Value = Now
                .Fields("cusuario").Value = Numero
                .Fields("ccategoria").Value = 0
                .Fields("ccategoriaauto").Value = 0
                .Fields("fultmod").Value = Now
                .Fields("cusuariomod").Value = 0
                .Fields("ccategoriamod").Value = 0
                .Fields("ctipo").Value = ""
                .Fields("comidesc").Value = False
                .Fields("mcomidesc").Value = 0
                .Fields("cdisprod").Value = 0
                .Update()
            End With
        End If

        If ctransaccion = 439 Then 'Primas en Depositos
            sql = "SELECT * FROM pdprimas WHERE ntranpdp=" & wTRAN
            If rsa.State = 1 Then rsa.Close()
            rsa.Open(sql, VG.oleconMUN, ADODB.CursorTypeEnum.adOpenDynamic, ADODB.LockTypeEnum.adLockOptimistic)
            With rsa
                If rsa.EOF Then
                    .AddNew()
                End If
                .Fields("ntranpdp").Value = wTRAN
                .Fields("u_version").Value = "!"
                .Fields("ftransaccion").Value = fcaja
                .Fields("cestcta").Value = 0
                .Fields("ipersona").Value = mae.Fields("ipersona").Value
                .Fields("ctenedor").Value = wcliente
                .Fields("cid").Value = mae.Fields("cid").Value
                .Fields("cramo").Value = 0
                .Fields("cnpoliza").Value = DBNull.Value
                .Fields("fanopol").Value = 0
                .Fields("fmespol").Value = 0
                .Fields("cpoliza").Value = 0
                .Fields("cmoneda").Value = wcmoneda
                .Fields("cforcob").Value = 0
                .Fields("mprimadep").Value = 0
                .Fields("mprimadepext").Value = 0
                .Fields("maplicado").Value = 0
                .Fields("maplicadoext").Value = 0
                .Fields("msaldodep").Value = 0
                .Fields("msaldodepext").Value = 0
                .Fields("iaplica").Value = "P"
                .Fields("igenerado").Value = DBNull.Value
                .Fields("faplicado").Value = DBNull.Value
                .Fields("iestado").Value = "V"
                .Fields("xobserva").Value = Mid(xConceptoCJ, 1, 255)
                .Fields("iestcont").Value = "P"
                .Fields("fcontab").Value = DBNull.Value
                .Fields("fanomescont").Value = 0
                .Fields("nlote").Value = 0
                .Fields("nsemana").Value = 0
                .Fields("nano").Value = Today.Year
                .Fields("culntranpdp").Value = 0
                .Fields("csolicid").Value = 0
                .Fields("cprog").Value = DBNull.Value
                .Fields("ifuente").Value = "SIS_NET"
                .Fields("bok").Value = 0
                .Fields("cerror").Value = DBNull.Value
                .Fields("fingreso").Value = Now
                .Fields("cusuario").Value = 0
                .Fields("cusuariomod").Value = 0
                .Fields("cusuarioauto").Value = 0
                .Fields("ccategoriamod").Value = 0
                .Fields("ccategoria").Value = 0
                .Fields("ccategoriaauto").Value = 0
                .Fields("fultmod").Value = Now

                .Update()
            End With
        End If

        xError = ""
        CJ_AdicionaIV = xCPAGO
        rsa = Nothing
        mae = Nothing
        Exit Function
salida:
        xError = xError & " " & Err.Description
        CJ_AdicionaIV = xCPAGO
        rsa = Nothing
        mae = Nothing
    End Function

    Public Sub CJ_LeeCAJA(ByVal csucur_caja As Integer, ByVal ccajero As Decimal, ByVal fcaja As Date, ByVal ccaja As Integer, ByVal cpago As Double, ByVal cestcta As Double, ByVal itipomov As String, _
        Optional ByRef mcaja As Decimal = Nothing, Optional ByRef mcajaloc As Decimal = Nothing, Optional ByRef mcajaext As Decimal = Nothing, _
        Optional ByRef mefe As Decimal = Nothing, Optional ByRef mche As Decimal = Nothing, Optional ByRef mtar As Decimal = Nothing, Optional ByRef motros As Decimal = Nothing, Optional ByRef xotros As String = Nothing, _
        Optional ByRef creferencia As String = Nothing, Optional ByRef xrecibido As String = Nothing, Optional ByRef xporcuenta As String = Nothing, _
        Optional ByRef xobserva As String = Nothing, Optional ByRef cmoneda As String = Nothing, Optional ByRef ctransaccion As String = Nothing, Optional ByRef xtransaccion As String = Nothing, _
        Optional ByRef cramo As Integer = Nothing, Optional ByRef cdisprod As Double = Nothing)

        Dim SQL As String
        Dim rsa As New ADODB.Recordset
        'Dim tec As New Asidllcon00.TEC

        rsa.CursorLocation = ADODB.CursorLocationEnum.adUseClient

        If cestcta = 0 Then
            SQL = "SELECT mcaja, mcajaloc, mcajaext, mefe, mche, mtar, motros,"
            SQL = SQL & " xotros, creferencia, xrecibido, xporcuenta, xobserva, cmoneda, ctransaccion"
            SQL = SQL & " FROM cbmovcaj_e WHERE csucur_caja=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja & " AND cpago=" & cpago
        Else
            SQL = "SELECT SUM(mcaja) AS mcaja, SUM(mcajaloc) AS mcajaloc, SUM(mcajaext) AS mcajaext, SUM(mefe) AS mefe, SUM(mche) AS mche, SUM(mtar) AS mtar, SUM(motros) AS motros,"
            SQL = SQL & " MAX(xotros) AS xotros, MIN(creferencia) AS creferencia, MIN(xrecibido) AS xrecibido, MIN(xporcuenta) AS xporcuenta, MIN(xobserva) AS xobserva, MAX(cmoneda) AS cmoneda, 0 AS ctransaccion"
            SQL = SQL & " FROM cbmovcaj_e WHERE csucur_caja=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja & " AND cestcta=" & cestcta
        End If
        rsa.Open(SQL, VG.oleconMUN, ADODB.CursorTypeEnum.adOpenForwardOnly, ADODB.LockTypeEnum.adLockReadOnly)
        If Not rsa.EOF And rsa.RecordCount > 0 Then
            If Not IsNothing(mcaja) Then mcaja = IIf(IsDBNull(rsa.Fields("mcaja").Value), 0, rsa.Fields("mcaja").Value)
            If Not IsNothing(mcajaloc) Then mcajaloc = IIf(IsDBNull(rsa.Fields("mcajaloc").Value), 0, rsa.Fields("mcajaloc").Value)
            If Not IsNothing(mcajaext) Then mcajaext = IIf(IsDBNull(rsa.Fields("mcajaext").Value), 0, rsa.Fields("mcajaext").Value)
            If Not IsNothing(mefe) Then mefe = IIf(IsDBNull(rsa.Fields("mefe").Value), 0, rsa.Fields("mefe").Value)
            If Not IsNothing(mche) Then mche = IIf(IsDBNull(rsa.Fields("mche").Value), 0, rsa.Fields("mche").Value)
            If Not IsNothing(mtar) Then mtar = IIf(IsDBNull(rsa.Fields("mtar").Value), 0, rsa.Fields("mtar").Value)
            If Not IsNothing(motros) Then motros = IIf(IsDBNull(rsa.Fields("motros").Value), 0, rsa.Fields("motros").Value)

            If Not IsNothing(xotros) Then xotros = IIf(IsDBNull(rsa.Fields("xotros").Value), "", rsa.Fields("xotros").Value)
            If Not IsNothing(creferencia) Then creferencia = rsa.Fields("creferencia").Value
            If Not IsNothing(xrecibido) Then xrecibido = rsa.Fields("xrecibido").Value
            If Not IsNothing(xporcuenta) Then xporcuenta = rsa.Fields("xporcuenta").Value
            If Not IsNothing(xobserva) Then xobserva = rsa.Fields("xobserva").Value
            If Not IsNothing(cmoneda) Then cmoneda = rsa.Fields("cmoneda").Value
            If Not IsNothing(ctransaccion) Then ctransaccion = rsa.Fields("ctransaccion").Value
            If Not IsNothing(xtransaccion) Then xtransaccion = tec.DameTRAN_Nombre(CDbl(rsa.Fields("ctransaccion").Value), VG.licencia)
        End If
        rsa.Close()

        If cestcta = 0 Then
            SQL = "SELECT cramo, cdisprod FROM cbotrospagos WHERE csucur_caja=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja & " AND cpago=" & cpago
            rsa.Open(SQL, VG.oleconMUN, ADODB.CursorTypeEnum.adOpenForwardOnly, ADODB.LockTypeEnum.adLockReadOnly)
            If Not rsa.EOF Then
                If Not IsNothing(cramo) Then xotros = IIf(IsDBNull(rsa.Fields("cramo").Value), "", rsa.Fields("cramo").Value)
                If Not IsNothing(cdisprod) Then xotros = IIf(IsDBNull(rsa.Fields("cdisprod").Value), "", rsa.Fields("cdisprod").Value)
            Else
                cramo = 0
                cdisprod = 0
            End If
            rsa.Close()
        End If
        rsa = Nothing
    End Sub

    Public Sub CJ_LeeCAJA_CHE(ByVal csucur_caja As Integer, ByVal ccajero As Decimal, ByVal fcaja As Date, ByVal ccaja As Integer, ByVal cpago As Double, ByVal cestcta As Double, ByVal itipomov As String, _
        Optional ByRef cbanco As Double = Nothing, Optional ByRef ccheque As String = Nothing, Optional ByRef fcheque As Date = Nothing, _
        Optional ByRef mcheque As Decimal = Nothing, Optional ByRef xconforma As String = Nothing)

        Dim SQL As String
        Dim rsa As New ADODB.Recordset

        SQL = "SELECT * FROM cbcheques WHERE csucur=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja
        If cestcta <> 0 Then
            SQL = SQL & " AND crecibo=" & cestcta
        ElseIf cpago <> 0 Then
            SQL = SQL & " AND crecibo=" & cpago
        Else
            Exit Sub
        End If
        rsa.Open(SQL, VG.oleconMUN, ADODB.CursorTypeEnum.adOpenForwardOnly, ADODB.LockTypeEnum.adLockReadOnly)
        If Not rsa.EOF Then
            If Not IsNothing(cbanco) Then cbanco = IIf(IsDBNull(rsa.Fields("cbanco").Value), 0, rsa.Fields("cbanco").Value)
            If Not IsNothing(ccheque) Then ccheque = IIf(IsDBNull(rsa.Fields("ccheque").Value), "", rsa.Fields("ccheque").Value)
            If Not IsNothing(fcheque) Then fcheque = IIf(IsDBNull(rsa.Fields("fcheque").Value), DBNull.Value, rsa.Fields("fcheque").Value)
            If Not IsNothing(mcheque) Then mcheque = IIf(IsDBNull(rsa.Fields("mcheque").Value), 0, rsa.Fields("mcheque").Value)
            If Not IsNothing(xconforma) Then xconforma = IIf(IsDBNull(rsa.Fields("xconforma").Value), "", rsa.Fields("xconforma").Value)
        End If
        rsa.Close()
        rsa = Nothing
    End Sub

    Public Sub CJ_LeeCAJA_TAR(ByVal csucur_caja As Integer, ByVal ccajero As Decimal, ByVal fcaja As Date, ByVal ccaja As Integer, ByVal cpago As Double, ByVal cestcta As Double, ByVal itipomov As String, _
        Optional ByRef cbanco As Double = Nothing, Optional ByRef ctarjeta As String = Nothing, Optional ByRef itarjeta As String = Nothing, _
        Optional ByRef cvoucher As String = Nothing, Optional ByRef fvcto As Date = Nothing, Optional ByRef mmonto As Decimal = Nothing)

        Dim SQL As String
        Dim rsa As New ADODB.Recordset

        SQL = "SELECT * FROM cbtarjeta WHERE csucur=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja
        If cestcta <> 0 Then
            SQL = SQL & " AND crecibo=" & cestcta
        ElseIf cpago <> 0 Then
            SQL = SQL & " AND crecibo=" & cpago
        Else
            Exit Sub
        End If
        rsa.Open(SQL, VG.oleconMUN, ADODB.CursorTypeEnum.adOpenForwardOnly, ADODB.LockTypeEnum.adLockReadOnly)
        If Not rsa.EOF Then
            If Not IsNothing(cbanco) Then cbanco = IIf(IsDBNull(rsa.Fields("cbanco").Value), 0, rsa.Fields("cbanco").Value)
            If Not IsNothing(ctarjeta) Then ctarjeta = IIf(IsDBNull(rsa.Fields("ctarjeta").Value), "", rsa.Fields("ctarjeta").Value)
            If Not IsNothing(itarjeta) Then itarjeta = IIf(IsDBNull(rsa.Fields("itarjeta").Value), "0", rsa.Fields("itarjeta").Value)
            If Not IsNothing(cvoucher) Then cvoucher = IIf(IsDBNull(rsa.Fields("cvoucher").Value), "", rsa.Fields("cvoucher").Value)
            If Not IsNothing(fvcto) Then fvcto = rsa.Fields("fvcto").Value
            If Not IsNothing(mmonto) Then mmonto = IIf(IsDBNull(rsa.Fields("mmonto").Value), 0, rsa.Fields("mmonto").Value)
        End If
        rsa.Close()
        rsa = Nothing
    End Sub

    Public Sub CJ_ActuCAJA_CHE(ByVal csucur_caja As Integer, ByVal ccajero As Decimal, ByVal fcaja As Date, ByVal ccaja As Integer, ByVal cpago As Double, ByVal cestcta As Double, ByVal itipomov As String, ByVal mche As Decimal, ByVal cmoneda As String, _
            Optional ByVal cbanco As Double = Nothing, Optional ByVal ccheque As String = Nothing, Optional ByVal fcheque As Date = Nothing, _
            Optional ByVal mcheque As Decimal = Nothing, Optional ByVal xconforma As String = Nothing)

        Dim SQL As String
        Dim rsa As New ADODB.Recordset

        If CDbl(mche) = 0 Then
            SQL = "DELETE cbcheques WHERE csucur=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja
            If cestcta <> 0 Then
                SQL = SQL & " AND crecibo=" & cestcta
            ElseIf cpago <> 0 Then
                SQL = SQL & " AND crecibo=" & cpago
            Else
                Exit Sub
            End If
            corre(SQL)
            Exit Sub
        End If

        SQL = "SELECT * FROM cbcheques WHERE csucur=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja
        If cestcta <> 0 Then
            SQL = SQL & " AND crecibo=" & cestcta
        ElseIf cpago <> 0 Then
            SQL = SQL & " AND crecibo=" & cpago
        Else
            Exit Sub
        End If
        rsa.Open(SQL, VG.oleconMUN, ADODB.CursorTypeEnum.adOpenDynamic, ADODB.LockTypeEnum.adLockOptimistic)
        With rsa
            If rsa.EOF Then
                .AddNew()
                .Fields("fingreso").Value = Date.Now
                .Fields("cusuario").Value = Numero
            End If

            .Fields("csucur").Value = csucur_caja
            .Fields("ccajero").Value = ccajero
            .Fields("fcaja").Value = fcaja
            .Fields("ccaja").Value = ccaja
            .Fields("crecibo").Value = IIf(CDbl(cestcta) = 0, cpago, cestcta)
            .Fields("canexo").Value = 1
            .Fields("imovcaja").Value = itipomov

            .Fields("cbanco").Value = IIf(IsNothing(cbanco) = True, 0, Val(cbanco))
            .Fields("ccheque").Value = IIf(IsNothing(ccheque) = True, "0", Val(ccheque))

            .Fields("cmoneda").Value = cmoneda
            .Fields("u_version").Value = "!"
            .Fields("ccuenta").Value = 0
            .Fields("cdeposito").Value = 0
            .Fields("cbandep").Value = 0
            .Fields("cramo").Value = 0
            .Fields("crelpago").Value = 0
            .Fields("cagenban").Value = 0

            .Fields("fcheque").Value = IIf(IsNothing(fcheque) = True, DBNull.Value, fcheque)

            .Fields("mcheque").Value = mche
            .Fields("mchequeext").Value = 0

            .Fields("xconforma").Value = IIf(IsNothing(xconforma) = True, "", xconforma)

            .Fields("cconciliado").Value = 0
            .Fields("cprog").Value = 0
            .Fields("ifuente").Value = "SIS_NET"
            .Fields("bok").Value = 0
            .Fields("cerror").Value = 0
            .Fields("ccategoria").Value = 0
            .Fields("cusuarioauto").Value = 0
            .Fields("ccategoriaauto").Value = 0
            .Fields("fultmod").Value = Date.Now
            .Fields("cusuariomod").Value = Numero
            .Fields("ccategoriamod").Value = 0
            .Fields("xobserva").Value = ""

            .Update()
        End With
        rsa.Close()
        rsa = Nothing
    End Sub


    Public Sub CJ_ActuCAJA_TAR(ByVal csucur_caja As Integer, ByVal ccajero As Decimal, ByVal fcaja As Date, ByVal ccaja As Integer, ByVal cpago As Double, ByVal cestcta As Double, ByVal itipomov As String, ByVal mtar As Decimal, ByVal cmoneda As String, _
        Optional ByRef cbanco As Double = Nothing, Optional ByRef ctarjeta As String = Nothing, Optional ByRef itarjeta As String = Nothing, _
        Optional ByRef cvoucher As String = Nothing, Optional ByRef fvcto As Date = Nothing, Optional ByRef mmonto As Decimal = Nothing)

        Dim SQL As String
        Dim rsa As New ADODB.Recordset

        If CDbl(mtar) = 0 Then
            SQL = "DELETE cbtarjeta WHERE csucur=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja
            If cestcta <> 0 Then
                SQL = SQL & " AND crecibo=" & cestcta
            ElseIf cpago <> 0 Then
                SQL = SQL & " AND crecibo=" & cpago
            Else
                Exit Sub
            End If
            corre(SQL)
            Exit Sub
        End If

        SQL = "SELECT * FROM cbtarjeta WHERE csucur=" & csucur_caja & " AND ccajero=" & ccajero & " AND fcaja='" & Format(fcaja, "yyyyMMdd") & "' AND ccaja=" & ccaja
        If cestcta <> 0 Then
            SQL = SQL & " AND crecibo=" & cestcta
        ElseIf cpago <> 0 Then
            SQL = SQL & " AND crecibo=" & cpago
        Else
            Exit Sub
        End If
        rsa.Open(SQL, VG.oleconMUN, ADODB.CursorTypeEnum.adOpenDynamic, ADODB.LockTypeEnum.adLockOptimistic)
        With rsa
            If rsa.EOF Then
                .AddNew()
                .Fields("fingreso").Value = Date.Now
                .Fields("cusuario").Value = Numero
            End If

            .Fields("csucur").Value = csucur_caja
            .Fields("ccajero").Value = ccajero
            .Fields("fcaja").Value = fcaja
            .Fields("ccaja").Value = ccaja
            .Fields("crecibo").Value = IIf(CDbl(cestcta) = 0, cpago, cestcta)
            .Fields("canexo").Value = 1
            .Fields("imovcaja").Value = itipomov

            .Fields("ctarjeta").Value = IIf(IsNothing(ctarjeta) = True, "", ctarjeta)

            .Fields("cmoneda").Value = cmoneda
            .Fields("u_version").Value = "!"

            .Fields("itarjeta").Value = IIf(IsNothing(itarjeta) = True, "0", itarjeta)
            .Fields("cbanco").Value = IIf(IsNothing(cbanco) = True, 0, cbanco)
            .Fields("cvoucher").Value = IIf(IsNothing(cvoucher) = True, "", cvoucher)
            .Fields("fvcto").Value = IIf(IsNothing(fvcto) = True, DBNull.Value, fvcto)

            .Fields("cdeposito").Value = 0
            .Fields("cbandep").Value = 0
            .Fields("crelpago").Value = 0
            .Fields("mmonto").Value = mtar
            .Fields("mmontoext").Value = 0
            .Fields("xconforma").Value = ""
            .Fields("cprog").Value = 0
            .Fields("ifuente").Value = "SIS_NET"
            .Fields("bok").Value = 0
            .Fields("cerror").Value = 0
            .Fields("ccategoria").Value = 0
            .Fields("cusuarioauto").Value = 0
            .Fields("ccategoriaauto").Value = 0
            .Fields("fultmod").Value = Date.Now
            .Fields("cusuariomod").Value = Numero
            .Fields("ccategoriamod").Value = 0
            .Fields("xobserva").Value = ""
            .Update()
        End With
        rsa.Close()
        rsa = Nothing
    End Sub

    Public Function CJ_Abrir_Caja(ByVal itipocaja As String, ByVal csucur As Integer, ByVal fechaCaja As Date, ByVal cci_rif As Double, ByVal usuCategoria As Integer, ByVal licencia As String, Optional ByRef msgerror As String = "") As Boolean
        Try
            If Len(Trim(itipocaja)) = 0 Or Trim(itipocaja) = "0" Then
                msgerror = "No se indico el Tipo de Caja a Abrir"
                CJ_Abrir_Caja = False
                Exit Function
            End If

            If Trim(itipocaja) = "CH" Then
                If asi.TienePermiso(cci_rif, "COBROS", "AbrirCajaChica", licencia) = False Then
                    msgerror = "Usuario No Autorizado para Abrir Caja Chica"
                    CJ_Abrir_Caja = False
                    Exit Function
                End If
            End If

            'If IsDate(fechaCaja) = False Then
            '    msgerror = "La fecha que introdujo no es válida"
            '    CJ_Abrir_Caja = False
            '    Exit Function
            'End If

            'If csucur <= 0 Then
            '    CJ_Abrir_Caja = False
            '    msgerror = "Este usuario no tiene asignada una sucursal válida"
            '    Exit Function
            'End If


            Dim mes As Integer
            mes = (Year(DateValue(fechaCaja)) * 100) + Month(DateValue(fechaCaja))
            If asi.MCerrado(mes, licencia) = True Then
                msgerror = "El mes " & Month(fechaCaja) & " ya esta cerrado contablemente." & Chr(13) & "No puede abrir una caja de un mes cerrado."
                CJ_Abrir_Caja = False
                Exit Function
            End If

            If fechaCaja <= DameULT_FCCOMI() Then
                msgerror = "No puede abrir caja con esta fecha, este período ya fue liquidado por comisiones"
                CJ_Abrir_Caja = False
                Exit Function
            End If

            Dim SqlCnx As New System.Data.SqlClient.SqlConnection()
            Dim SqlCmd As New System.Data.SqlClient.SqlCommand()
            Dim SqlLector As System.Data.SqlClient.SqlDataReader

            SqlCnx.ConnectionString = VG.ConnectionStringMundisis
            SqlCnx.Open()
            SqlCmd.CommandText = "SELECT (isnull(max(ccaja),0) + 1) as Caja_A_Abrir FROM cbcaja WHERE csucur=" & csucur & " and ccajero = '" & Str(cci_rif) & "' and convert(varchar(10),fcaja,111) = '" & Format(fechaCaja, "yyyy/MM/dd") & "'"
            SqlCmd.Connection = SqlCnx
            SqlLector = SqlCmd.ExecuteReader

            If SqlLector.Read = True Then
                Dim cad As String
                Dim ccaja As Integer

                ccaja = SqlLector("Caja_A_Abrir")

                cad = "Insert into cbcaja (csucur,ccajero,fcaja,ccaja,u_version," & _
                "mconta,mcontaext,mcaja,mcajaext,mprimas,mprimasext,mpdeposito,mpdepositoext," & _
                "mvarios,mvariosext,mbanco,mbancoext,istatcaja,itipocaja,cprog,ifuente,bok," & _
                "fingreso,cusuario,ccategoria,cusuarioauto,ccategoriaauto,fultmod,cusuariomod,ccategoriamod ) " & _
                "values (" & csucur & "," & "'" & cci_rif & "'" & ",'" & fechaCaja & "'," & ccaja & _
                ",'*',0,0,0,0,0,0,0,0,0,0,0,0,'A','" & Trim(itipocaja) & "','COB','COB',1,getdate()," & _
                "'" & cci_rif & "'" & "," & usuCategoria & "," & _
                "'" & cci_rif & "'" & "," & usuCategoria & "," & _
                "getdate()," & "'" & cci_rif & "'," & usuCategoria & ")"

                If asi.corre(cad, licencia) = True Then
                    msgerror = "OK"
                    CJ_Abrir_Caja = True
                Else
                    msgerror = "Error al guardar en la tabla"
                    CJ_Abrir_Caja = False
                End If
            End If

        Catch err As Exception
            msgerror = "Error al tratar de abrir la caja: " & Chr(13) & UCase(err.Message) & Chr(13) & Chr(13) & "Objeto q genero el error: " & Chr(13) & UCase(err.Source)
            CJ_Abrir_Caja = False
        End Try
    End Function

    Public Function DameULT_FCCOMI() As Date
        Dim retorno As Object = VG.EjecutaSQL_escalar("select Max(ffinalc) as ffinalc from mcierrecomis where istatcomis='C'", True, True)
        If retorno.ToString <> "-1" Then Return CDate(retorno) Else Return "1 / 1 / 2000"

    End Function

    Public Function CJ_Cerrar_Caja(ByVal ccaja As Integer, ByVal csucur As Double, ByVal fCaja As Date, ByVal cci_rif As Double, ByVal usuCategoria As Integer, Optional ByRef msgError As String = "") As Boolean
        Try
            Dim SqlCnx As New System.Data.SqlClient.SqlConnection()
            Dim SqlCmd As New System.Data.SqlClient.SqlCommand()
            Dim SqlLector As System.Data.SqlClient.SqlDataReader

            SqlCnx.ConnectionString = VG.ConnectionStringMundisis
            SqlCnx.Open()
            SqlCmd.CommandText = "SELECT ccaja,fcaja,itipocaja FROM cbcaja WHERE istatcaja='A' and ccajero=" & cci_rif & " and csucur=" & csucur & " order by fcaja"
            SqlCmd.Connection = SqlCnx
            SqlLector = SqlCmd.ExecuteReader

            If SqlLector.Read = False Then
                msgError = "No Existen Cajas Abiertas"
                CJ_Cerrar_Caja = False
                SqlLector.Close()
                SqlCnx.Close()
                Exit Function
            End If

            SqlLector.Close()
            SqlCnx.Close()

            ''''''''''''''''''

            SqlCnx.ConnectionString = VG.ConnectionStringMundisis
            SqlCnx.Open()
            SqlCmd.CommandText = "exec Sp_Cierre_Caja " & csucur & ",'" & Format(fCaja, "dd/MM/yyyy") & "'," & cci_rif & "," & ccaja & ",0,0 "
            SqlCmd.Connection = SqlCnx
            SqlLector = SqlCmd.ExecuteReader

            If SqlLector.Read = True Then
                Select Case SqlLector.Item(0)
                    Case 0
                        msgError = SqlLector.Item(1)
                        msgError = "OK"
                        CJ_Cerrar_Caja = True
                    Case 1
                        msgError = "No se puede Hacer el Cierre de Caja, porque existe una diferencia de " & SqlLector.Item(1)
                        CJ_Cerrar_Caja = False
                    Case 2
                        msgError = "Ocurrió un Error en el Procedimiento de Cierre de Caja"
                        CJ_Cerrar_Caja = False
                    Case 3
                        msgError = "Ocurrió un Error al Hacer el Cálculo de las Comisiones y de los Impuestos"
                        CJ_Cerrar_Caja = False
                    Case 4
                        msgError = "No se puede Hacer el Cierre de Caja, porque existen estados de cuenta que no se han cobrado en su totalidad." & Chr(13) & "Verifique por favor."
                        CJ_Cerrar_Caja = False
                End Select
            End If

            SqlLector.Close()
            SqlCnx.Close()

        Catch err As Exception
            msgError = err.Message
            CJ_Cerrar_Caja = False
        End Try
    End Function


    Public Function CJ_ArqueoCAJA(ByVal ccaja As Integer, ByVal csucur As Integer, ByVal fcaja As Date, ByVal cci_rif As Decimal, _
    ByRef montoML As Decimal, ByRef efeML As Decimal, ByRef cheML As Decimal, ByRef tarML As Decimal, ByRef otrosML As Decimal, ByRef depoML As Decimal, ByRef netoML As Decimal, ByRef saldoML As Decimal, _
    ByRef montoME As Decimal, ByRef efeME As Decimal, ByRef cheME As Decimal, ByRef tarME As Decimal, ByRef otrosME As Decimal, ByRef depoME As Decimal, ByRef netoME As Decimal, ByRef saldoME As Decimal) As Boolean

        Try

            If ccaja = 0 Then
                CJ_ArqueoCAJA = False
                Exit Function
            End If

            If ccaja < 1 Or ccaja > 100 Then
                'msgerror = " Número de Caja incorrecto"
                CJ_ArqueoCAJA = False
                Exit Function
            End If

            Dim SqlCnx As New System.Data.SqlClient.SqlConnection()
            Dim SqlCmd As New System.Data.SqlClient.SqlCommand()
            Dim SqlLector As System.Data.SqlClient.SqlDataReader

            SqlCnx.ConnectionString = VG.ConnectionStringMundisis
            SqlCnx.Open()
            SqlCmd.CommandText = "exec sp_rep_cierre_caja " & csucur & "," & cci_rif & "," & ccaja & ",'" & Format(fcaja, "yyyy/MM/dd") & "','" & VG.cws(15) & "'"
            SqlCmd.Connection = SqlCnx
            SqlLector = SqlCmd.ExecuteReader

            If SqlLector.Read = True Then

                'Moneda Nacional

                montoML = Convert.ToDecimal(SqlLector("Monto")).ToString("#,##0.00")
                efeML = Convert.ToDecimal(SqlLector("Efectivo")).ToString("#,##0.00")
                cheML = Convert.ToDecimal(SqlLector("Cheques")).ToString("#,##0.00")
                tarML = Convert.ToDecimal(SqlLector("Tarjeta")).ToString("#,##0.00")
                otrosML = Convert.ToDecimal(SqlLector("Otros")).ToString("#,##0.00")

                depoML = Convert.ToDecimal(SqlLector("Deposito")).ToString("#,##0.00")
                netoML = Convert.ToDecimal(efeML + cheML).ToString("#,##0.00")
                saldoML = Convert.ToDecimal(montoML + depoML).ToString("#,##0.00")



                'Moneda Exranjera
                montoME = SqlLector("MontoE")
                efeME = SqlLector("EfectivoE")
                cheME = SqlLector("ChequesE")
                tarME = SqlLector("TarjetaE")
                otrosME = SqlLector("OtrosE")

                depoME = SqlLector("DepositoE")
                netoME = efeME + cheME
                saldoME = montoME + depoME
            Else
                CJ_ArqueoCAJA = False
            End If
            CJ_ArqueoCAJA = True
        Catch err As Exception
            CJ_ArqueoCAJA = False
        End Try

    End Function

    Public Function CJ_TotalCaja(ByVal csucur As Integer, ByVal ccajero As Integer, ByVal fcaja As Date, ByVal ccaja As Integer, Optional ByRef Nom_Tabla_Creada As String = "") As Boolean
        'Dim tec As New Asidllcon00.TEC
        Try
            Dim OK As Boolean
            Dim sql As String

            Nom_Tabla_Creada = "tempocaja_" & Trim(Str(ccajero))
            tec.EliTABLA_mundisis(Nom_Tabla_Creada)

            sql = "SELECT cbmovcaj_e.ctransaccion as Transaccion, cbmovcaj_e.cmoneda as Moneda, Sum(cbmovcaj_e.mcaja) AS SumaCaja, cast('Transaccion' as nvarchar(100)) AS Descripcion INTO " & Nom_Tabla_Creada & " From cbmovcaj_e Where (((cbmovcaj_e.csucur_caja) = " & csucur & ") And ((cbmovcaj_e.ccajero) = " & ccajero & ") And ((cbmovcaj_e.fcaja) = '" & Format(fcaja, "dd/MM/yyyy") & "') And ((cbmovcaj_e.ccaja) = " & ccaja & " )) GROUP BY cbmovcaj_e.ctransaccion, cbmovcaj_e.cmoneda"
            OK = asi.corre(sql, VG.licencia)

            sql = "Update " & Nom_Tabla_Creada & " set " & Nom_Tabla_Creada & ".descripcion = MAUTOCAJA.descripcion From " & Nom_Tabla_Creada & " INNER JOIN MAUTOCAJA ON MAUTOCAJA.NASIPRE = " & Nom_Tabla_Creada & " .transaccion"
            OK = OK And asi.corre(sql, VG.licencia)

            If OK = True Then
                CJ_TotalCaja = True
            Else
                CJ_TotalCaja = False
            End If
            '"select * from tempocaja order by ctransaccion, cmoneda"

        Catch err As Exception
            CJ_TotalCaja = False
        End Try
    End Function

    Public Function CJ_TotalDia(ByVal ccajero As Double, ByVal fcaja As Date, Optional ByRef Nom_Tabla_Creada As String = "") As Boolean
        'Dim tec As New Asidllcon00.TEC
        Try
            Dim OK As Boolean
            Dim sql As String

            Nom_Tabla_Creada = "tempocaja_" & Trim(Str(ccajero))
            tec.EliTABLA_mundisis(Nom_Tabla_Creada)

            sql = "SELECT cbmovcaj_e.ctransaccion as Transaccion, cbmovcaj_e.cmoneda as Moneda, Sum(cbmovcaj_e.mcaja) AS SumaCaja, cast('Transaccion' as nvarchar(100)) AS Descripcion INTO " & Nom_Tabla_Creada & " From cbmovcaj_e Where cbmovcaj_e.fcaja = '" & Format(fcaja, "dd/MM/yyyy") & "' GROUP BY cbmovcaj_e.ctransaccion, cbmovcaj_e.cmoneda ORDER BY cbmovcaj_e.ctransaccion, cbmovcaj_e.cmoneda"
            OK = asi.corre(sql, VG.licencia)

            sql = "Update " & Nom_Tabla_Creada & " set " & Nom_Tabla_Creada & ".descripcion = MAUTOCAJA.descripcion From " & Nom_Tabla_Creada & " INNER JOIN MAUTOCAJA ON MAUTOCAJA.NASIPRE = " & Nom_Tabla_Creada & " .transaccion"
            OK = OK And asi.corre(sql, VG.licencia)

            If OK = True Then
                CJ_TotalDia = True
            Else
                CJ_TotalDia = False
            End If
            '"select * from tempocaja order by ctransaccion, cmoneda"

        Catch err As Exception
            CJ_TotalDia = False
        End Try
    End Function

    Public Function CJ_TotalMes(ByVal ccajero As Double, ByVal fcaja As Date, Optional ByRef Nom_Tabla_Creada As String = "") As Boolean
        'Dim tec As New Asidllcon00.TEC
        Try
            Dim OK As Boolean
            Dim sql As String

            Nom_Tabla_Creada = "tempocaja_" & Trim(Str(ccajero))
            tec.EliTABLA_mundisis(Nom_Tabla_Creada)

            sql = "SELECT cbmovcaj_e.ctransaccion as Transaccion, cbmovcaj_e.cmoneda as Moneda, Sum(cbmovcaj_e.mcaja) AS SumaCaja, cast('Transaccion' as nvarchar(100)) AS Descripcion INTO " & Nom_Tabla_Creada & " From cbmovcaj_e Where Month(cbmovcaj_e.fcaja) = " & Str(Month(fcaja)) & " GROUP BY cbmovcaj_e.ctransaccion, cbmovcaj_e.cmoneda ORDER BY cbmovcaj_e.ctransaccion, cbmovcaj_e.cmoneda"
            OK = asi.corre(sql, VG.licencia)

            sql = "Update " & Nom_Tabla_Creada & " set " & Nom_Tabla_Creada & ".descripcion = MAUTOCAJA.descripcion From " & Nom_Tabla_Creada & " INNER JOIN MAUTOCAJA ON MAUTOCAJA.NASIPRE = " & Nom_Tabla_Creada & " .transaccion"
            OK = OK And asi.corre(sql, VG.licencia)

            sql = "DELETE FROM " & Nom_Tabla_Creada & " WHERE SumaCaja=0"
            OK = OK And asi.corre(sql, VG.licencia)

            If OK = True Then
                CJ_TotalMes = True
            Else
                CJ_TotalMes = False
            End If
            '"select * from tempocaja order by ctransaccion, cmoneda"

        Catch err As Exception
            CJ_TotalMes = False
        End Try
    End Function
#End Region

#Region "Rutinas de Mant Contratos de Reaseguro"
    Public Sub MantREA_Raparm0_Actu(ByVal inumcapas As Short, ByVal inumexced As Short, ByVal sobrecoloc As Boolean, ByVal qgarpago As Short, ByVal corr_ra_p As Boolean, ByVal corr_ra_np As Boolean, ByVal corr_ra_fp As Boolean, _
    ByVal cam_corr_p As Boolean, ByVal cam_corr_np As Boolean, ByVal cam_corr_fp As Boolean, _
    ByVal corr_vd_p As String, ByVal corr_vd_np As String, ByVal corr_vd_fp As String, _
    ByVal msup As Double, ByVal mimp As Double, ByVal misr As Double, ByVal mog As Double, _
    ByVal mintpr As Double, ByVal mintsn As Double, ByVal icondpart As Boolean, ByVal iconmonser As Boolean _
)
        Dim sql As String
        Dim rsa As New ADODB.Recordset

        sql = "SELECT * FROM raparm_0 WHERE cclaveparm='RAPARGEN'"
        rsa.Open(sql, VG.oleconMUN, ADODB.CursorTypeEnum.adOpenDynamic, ADODB.LockTypeEnum.adLockOptimistic)
        With rsa
            If .EOF Then
                .AddNew()
                .Fields("fingreso").Value = Date.Now
                .Fields("cusuario").Value = Numero
            End If
            .Fields("cclaveparm").Value = "RAPARGEN"
            .Fields("u_version").Value = "!"
            .Fields("iconmonser").Value = iconmonser
            If inumcapas = 0 Then inumcapas = 1
            .Fields("inumcapas").Value = inumcapas
            If inumexced = 0 Then inumexced = 1
            .Fields("inumexced").Value = inumexced
            .Fields("sobrecoloc").Value = sobrecoloc
            .Fields("qgarpago").Value = qgarpago
            .Fields("corr_ra_np").Value = corr_ra_np
            .Fields("corr_ra_p").Value = corr_ra_p
            .Fields("corr_ra_fp").Value = corr_ra_fp
            .Fields("corr_vd_np").Value = corr_vd_np
            .Fields("corr_vd_p").Value = corr_vd_p
            .Fields("corr_vd_fp").Value = corr_vd_fp
            .Fields("cam_corr_np").Value = cam_corr_np
            .Fields("cam_corr_p").Value = cam_corr_p
            .Fields("cam_corr_fp").Value = cam_corr_fp
            .Fields("mintpr").Value = mintpr
            .Fields("mintsn").Value = mintsn
            .Fields("msup").Value = msup
            .Fields("mimp").Value = mimp
            .Fields("misr").Value = misr
            .Fields("mog").Value = mog
            .Fields("icondpart").Value = icondpart
            .Fields("ccategoria").Value = 0
            .Fields("cusuarioauto").Value = 0
            .Fields("ccategoriaauto").Value = 0
            .Fields("fultmod").Value = Date.Now
            .Fields("cusuariomod").Value = Numero
            .Fields("ccategoriamod").Value = 0
            .Update()
        End With
        If rsa.State = 1 Then rsa.Close()
        rsa = Nothing
    End Sub
    Public Sub MantREA_Raparm0_Adic()
        Dim sql As New System.Text.StringBuilder
        sql.Length = 0
        sql.Append("IF NOT EXISTS (SELECT cclaveparm FROM raparm_0) INSERT INTO raparm_0 SELECT ")
        sql.Append("'RAPARGEN' AS cclaveparm, '!' AS u_version, 0 AS iconmonser, 1 AS inumcapas, 1 AS inumexced, 0 AS sobrecoloc,")
        sql.Append("0 AS qgarpago, 0 AS corr_ra_np, 0 AS corr_ra_p, 0 AS corr_ra_fp, 'AS-0' AS corr_vd_np,'AS-0' AS corr_vd_p,'AS-0' AS corr_vd_fp,")
        sql.Append("0 AS cam_corr_np, 0 AS cam_corr_p, 0 AS cam_corr_fp, 0 AS mintpr, 0 AS mintsn, 0 AS msup,0 AS mimp, 0 AS misr, 0 AS mog, 0 AS icondpart, getdate() AS fingreso,")
        sql.Append(Numero & " AS cusuario, 0 AS ccategoria, 0 AS cusuarioauto, 0 AS ccategoriaauto, getdate() AS fultmod,")
        sql.Append(Numero & " AS cusuariomod, 0 AS ccategoriamod")
        corre(sql.ToString)
    End Sub
    Public Function MantRea_SerieAdic(ByVal fdesde As Date, ByVal fhasta As Date, ByVal cserie As Integer, ByRef xError As String) As Boolean
        On Error GoTo salida
        Dim sql As New System.Text.StringBuilder
        sql.Length = 0
        MantRea_SerieAdic = True
        sql.Append("INSERT INTO ravig SELECT '")
        sql.Append(fdesde & "' AS fdesde,'")
        sql.Append(fhasta & "' AS fhasta,")
        sql.Append("'!' AS u_version,'A' AS estado," & cserie & " AS cserie, getdate() AS fingreso," & Numero & " AS cusuario,")
        sql.Append("0 AS ccategoria, 0 AS cusuarioauto, 0 AS ccategoriaauto, getdate() AS fultmod," & Numero & " AS cusuariomod,0 AS ccategoriamod")
        If corre(sql.ToString) = False Then GoTo salida
        Exit Function
salida:
        MantRea_SerieAdic = False
        xError = Err.Description
    End Function
    Public Function MantRea_SerieEli(ByVal fdesde As Date, ByVal fhasta As Date, ByVal cserie As Integer, ByRef xError As String) As Boolean
        On Error GoTo salida
        Dim sql As String
        xError = ""
        MantRea_SerieEli = True
        sql = "SELECT TOP 1 cserie FROM racontratos WHERE fdesde='" & Format(fdesde, "yyyyMMdd") & "' AND fhasta='" & Format(fhasta, "yyyyMMdd") & "' AND cserie=" & cserie
        Using connection As New Data.SqlClient.SqlConnection(VG.ConnectionStringMundisis)
            Dim command As New Data.SqlClient.SqlCommand(sql, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            If reader.HasRows Then
                xError = "Existen contratos de reaseguro asignados a esta serie"
                GoTo salida
                Exit Function
            End If
        End Using
        sql = "DELETE ravig WHERE fdesde='" & Format(fdesde, "yyyyMMdd") & "' AND fhasta='" & Format(fhasta, "yyyyMMdd") & "' AND cserie=" & cserie
        If corre(sql) = False Then GoTo salida
        Exit Function
salida:
        MantRea_SerieEli = False
        xError = xError & " " & Err.Description
    End Function
#End Region

    Public Sub sp_nbofcert(ByVal modo As String, ByRef rNBOFCERT As regNBOFCERT)
        '---------------------------------------------------------------------------------------
        ' Procedimiento : sp_nbofcert 
        ' Uso           : Ofertas
        ' Fecha         : 3/10/07
        ' Autor         : ASI (Asesores Informáticos) JAMO
        ' Proposito     : Adiciona, Modifica y lee el archivo nbofcert desde la estructura rNBOFCERT
        ' 
        ' Variables del Entorno:
        '               Entrada:
        '               Salida:
        '---------------------------------------------------------------------------------------
        ' Bitacora de Modificaciones:
        ' 
        '
        '---------------------------------------------------------------------------------------
        Dim sql As String

        Select Case modo
            Case "I" 'Insertar
                sql = "insert into nbofcert values("
                sql = sql & rNBOFCERT.cproces & ","
                sql = sql & rNBOFCERT.ccerti & ",'"
                sql = sql & rNBOFCERT.u_version & "','"
                sql = sql & rNBOFCERT.descripcion & "'," 'campo que lleva la descripcion del riesgo
                sql = sql & rNBOFCERT.cramo & ","
                sql = sql & rNBOFCERT.cpoliza & ","
                sql = sql & rNBOFCERT.fanopol & ","
                sql = sql & rNBOFCERT.fmespol & ",'"
                sql = sql & rNBOFCERT.cplan & "',"
                sql = sql & rNBOFCERT.cagrupa & ",'"
                sql = sql & rNBOFCERT.itipoprod & "',"
                sql = sql & rNBOFCERT.casegurado & ","
                sql = sql & rNBOFCERT.ctenedor & ","
                sql = sql & rNBOFCERT.cbeneficiario & ","
                sql = sql & rNBOFCERT.cacreedor & ","
                sql = sql & rNBOFCERT.cmercado & ","
                sql = sql & rNBOFCERT.cactividad & ","
                sql = sql & rNBOFCERT.pactividad & ","
                sql = sql & rNBOFCERT.criesgo & ","
                sql = sql & rNBOFCERT.priesgo & ","
                sql = sql & rNBOFCERT.cclaries & ","
                sql = sql & rNBOFCERT.cclarie & ",'"
                sql = sql & rNBOFCERT.imodcon & "',"
                sql = sql & rNBOFCERT.cultrec & ",'"
                sql = sql & Replace(Trim(rNBOFCERT.xdirecob), "'", "") & "',"
                sql = sql & rNBOFCERT.ctipotec & ","
                sql = sql & rNBOFCERT.ctipoest & ","
                sql = sql & rNBOFCERT.ctipopar & ","

                sql = sql & rNBOFCERT.ctecest & ","
                sql = sql & rNBOFCERT.ctipopiso & ","
                sql = sql & rNBOFCERT.ctipocieloraso & ","
                sql = sql & rNBOFCERT.ctipoentrepiso & ","


                sql = sql & rNBOFCERT.ptasa & ","
                sql = sql & rNBOFCERT.ctipofac & ","
                sql = sql & rNBOFCERT.cfachada & ","
                sql = sql & rNBOFCERT.xpisos & ",'"
                sql = sql & rNBOFCERT.cpais & "','"
                sql = sql & rNBOFCERT.cestado & "','"
                sql = sql & rNBOFCERT.cciudad & "','"
                sql = sql & rNBOFCERT.ccorregi & "','"
                sql = sql & rNBOFCERT.cbarriada & "','"
                sql = sql & rNBOFCERT.czonapos & "',"
                sql = sql & rNBOFCERT.czonsism & ","
                sql = sql & IIf(Len(rNBOFCERT.czoninun) > 0, rNBOFCERT.czoninun, 0) & ","
                sql = sql & rNBOFCERT.czonmoti & ","
                sql = sql & IIf(rNBOFCERT.cemppetr = False, 0, 1) & ",'"
                sql = sql & rNBOFCERT.xfacaltu & "',"
                sql = sql & rNBOFCERT.ctipo & ",'"
                sql = sql & rNBOFCERT.xobserva & "','"
                sql = sql & rNBOFCERT.xobsimp & "',"
                sql = sql & rNBOFCERT.bobsimp & ","
                sql = sql & rNBOFCERT.ptotdes & ","
                sql = sql & rNBOFCERT.ptotrec & ","
                sql = sql & rNBOFCERT.brenova & ",'"
                sql = sql & rNBOFCERT.istatcer & "',"
                sql = sql & rNBOFCERT.mvalor & ","
                sql = sql & rNBOFCERT.ptasbasi & ",'"
                sql = sql & rNBOFCERT.fdesde & "','"
                sql = sql & rNBOFCERT.fhasta & "','"
                sql = sql & Format(rNBOFCERT.femision, "dd/MM/yy h:m:s") & "',"
                sql = sql & "Null,"
                sql = sql & "Null,'"
                sql = sql & rNBOFCERT.crelpago & "',"
                sql = sql & tec.NZ(rNBOFCERT.xnprestamo, "0") & ","
                sql = sql & rNBOFCERT.preportable & ","
                sql = sql & IIf(rNBOFCERT.bcumulo = False, 0, -1) & ",'"
                sql = sql & rNBOFCERT.cprog & "','"
                sql = sql & rNBOFCERT.ifuente & "','"
                sql = sql & rNBOFCERT.bok & "','"
                sql = sql & rNBOFCERT.cerror & "','"
                sql = sql & Format(rNBOFCERT.fingreso, "dd/MM/yy h:m:s") & "',"
                sql = sql & rNBOFCERT.cusuario & ","
                sql = sql & rNBOFCERT.ccategoria & ","
                sql = sql & rNBOFCERT.cusuarioauto & ","
                sql = sql & rNBOFCERT.ccategoriaauto & ",'"
                sql = sql & Format(rNBOFCERT.fultmod, "dd/MM/yy h:m:s") & "',"
                sql = sql & rNBOFCERT.cusuariomod & ","
                sql = sql & rNBOFCERT.ccategoriamod & ",'"
                sql = sql & rNBOFCERT.finca & "','"
                sql = sql & rNBOFCERT.rollo & "','"
                sql = sql & rNBOFCERT.documento & "',"
                sql = sql & rNBOFCERT.ccumulo & ","
                sql = sql & rNBOFCERT.mapax & ","
                sql = sql & rNBOFCERT.mapay & ",'"
                sql = sql & rNBOFCERT.edificio & "','"
                sql = sql & rNBOFCERT.edificio_no
                sql = sql & "')"

                If corre(sql) = False Then
                    Messagebox.Show("Error al actualizar NBOFCERT")
                End If

            Case "M" 'Modificar

                sql = "update nbofcert set cproces="
                sql = sql & rNBOFCERT.cproces & ",ccerti="
                sql = sql & rNBOFCERT.ccerti & ",u_version='"
                sql = sql & rNBOFCERT.u_version & "',descripcion='" 'este campo tiene la descripcion del riesgo
                sql = sql & Trim(rNBOFCERT.descripcion) & "',cramo="
                sql = sql & rNBOFCERT.cramo & ",cpoliza="
                sql = sql & rNBOFCERT.cpoliza & ",fanopol="
                sql = sql & rNBOFCERT.fanopol & ",fmespol="
                sql = sql & rNBOFCERT.fmespol & ",cplan='"
                sql = sql & rNBOFCERT.cplan & "',cagrupa="
                sql = sql & rNBOFCERT.cagrupa & ",itipoprod='"
                sql = sql & rNBOFCERT.itipoprod & "',casegurado="
                sql = sql & rNBOFCERT.casegurado & ",ctenedor="
                sql = sql & rNBOFCERT.ctenedor & ",cbeneficiario="
                sql = sql & rNBOFCERT.cbeneficiario & ",cacreedor="
                sql = sql & rNBOFCERT.cacreedor & ",cmercado="
                sql = sql & rNBOFCERT.cmercado & ",cactividad="
                sql = sql & rNBOFCERT.cactividad & ",pactividad="
                sql = sql & rNBOFCERT.pactividad & ",criesgo="
                sql = sql & rNBOFCERT.criesgo & ",priesgo="
                sql = sql & rNBOFCERT.priesgo & ",cclaries="
                sql = sql & rNBOFCERT.cclaries & ",cclarie="
                sql = sql & rNBOFCERT.cclarie & ",imodcon='"
                sql = sql & rNBOFCERT.imodcon & "',cultrec="
                sql = sql & rNBOFCERT.cultrec & ",xdirecob='"
                sql = sql & Trim(rNBOFCERT.xdirecob) & "',ctipotec="
                sql = sql & rNBOFCERT.ctipotec & ",ctipoest="
                sql = sql & rNBOFCERT.ctipoest & ",ctipopar="
                sql = sql & rNBOFCERT.ctipopar & ", CTECEST="
                '28/11/2003 77
                sql = sql & rNBOFCERT.ctecest & ",ctipopiso="
                sql = sql & rNBOFCERT.ctipopiso & ",ctipoentrepiso="
                sql = sql & rNBOFCERT.ctipoentrepiso & ",ctipocieloraso="
                sql = sql & rNBOFCERT.ctipocieloraso & ",ptasa="


                sql = sql & rNBOFCERT.ptasa & ",ctipofac="
                sql = sql & rNBOFCERT.ctipofac & ",cfachada='"
                sql = sql & rNBOFCERT.cfachada & "',xpisos="
                sql = sql & rNBOFCERT.xpisos & ",cpais="
                sql = sql & rNBOFCERT.cpais & ",cestado='"
                sql = sql & rNBOFCERT.cestado & "',cciudad='"
                sql = sql & rNBOFCERT.cciudad & "',ccorregi='"
                sql = sql & rNBOFCERT.ccorregi & "',cbarriada='"
                sql = sql & rNBOFCERT.cbarriada & "',czonapos="
                sql = sql & rNBOFCERT.czonapos & ",czonsism="
                sql = sql & rNBOFCERT.czonsism & ",czoninun="
                sql = sql & rNBOFCERT.czoninun & ",czonmoti="
                sql = sql & rNBOFCERT.czonmoti & ",cemppetr="
                sql = sql & IIf(rNBOFCERT.cemppetr = False, 0, 1) & ",xfacaltu='"
                sql = sql & rNBOFCERT.xfacaltu & "',ctipo="
                sql = sql & rNBOFCERT.ctipo & ",xobserva='"
                sql = sql & Trim(rNBOFCERT.xobserva) & "',xobsimp='"
                sql = sql & Trim(rNBOFCERT.xobsimp) & "',bobsimp="
                sql = sql & rNBOFCERT.bobsimp & ",ptotdes="
                sql = sql & rNBOFCERT.ptotdes & ",ptotrec="
                sql = sql & rNBOFCERT.ptotrec & ",brenova="
                sql = sql & rNBOFCERT.brenova & ",istatcer='"
                sql = sql & rNBOFCERT.istatcer & "',mvalor="
                sql = sql & rNBOFCERT.mvalor & ",ptasbasi="
                sql = sql & rNBOFCERT.ptasbasi & ",fdesde='"
                sql = sql & rNBOFCERT.fdesde & "',fhasta='"
                sql = sql & rNBOFCERT.fhasta & "',femision='"
                sql = sql & Format(rNBOFCERT.femision, "dd/MM/yy h:m:s") & "',fbaja="
                sql = sql & rNBOFCERT.fbaja & ",fanulacion="
                sql = sql & rNBOFCERT.fanulacion & ",xnprestamo='"
                sql = sql & rNBOFCERT.xnprestamo & "',preportable="
                sql = sql & rNBOFCERT.preportable & ",bcumulo="
                sql = sql & IIf(rNBOFCERT.bcumulo = False, 0, -1) & ",cprog='"
                sql = sql & rNBOFCERT.cprog & "',ifuente='"
                sql = sql & rNBOFCERT.ifuente & "',bok='"
                sql = sql & rNBOFCERT.bok & "',cerror='"
                sql = sql & rNBOFCERT.cerror & "',fingreso='"
                sql = sql & Format(rNBOFCERT.fingreso, "dd/MM/yy h:m:s") & "',cusuario="
                sql = sql & rNBOFCERT.cusuario & ",ccategoria="
                sql = sql & rNBOFCERT.ccategoria & ",cusuarioauto="
                sql = sql & rNBOFCERT.cusuarioauto & ",ccategoriaauto="
                sql = sql & rNBOFCERT.ccategoriaauto & ",fultmod='"
                sql = sql & Format(rNBOFCERT.fultmod, "dd/MM/yy h:m:s") & "',cusuariomod="
                sql = sql & rNBOFCERT.cusuariomod & ",ccategoriamod="
                sql = sql & rNBOFCERT.ccategoriamod
                sql = sql & " where cproces=" & wcproces & " and ccerti=" & wccerti

                If corre(sql) = False Then
                    Messagebox.Show("Error al actualizar NBOFCERT")
                End If

            Case "L" 'Leer
                Dim queryString As String = _
                                         "SELECT * From nbofcert WHERE cproces=" & rNBOFCERT.cproces & ", ccerti = " & rNBOFCERT.ccerti

                Using connection As New Data.SqlClient.SqlConnection(ConnectionStringMundisis)
                    Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
                    connection.Open()
                    Dim rsa As Data.SqlClient.SqlDataReader = command.ExecuteReader()
                    rsa.Read()
                    If rsa.HasRows = False Then
                        Messagebox.Show("No encuentro el registro de Nbofcert")
                        Exit Sub
                    End If
                    With rNBOFCERT
                        .cproces = rsa.Item("cproces")
                        .ccerti = rsa.Item("ccerti")
                        .u_version = rsa.Item("u_version")
                        .descripcion = rsa.Item("descripcion)")
                        .cramo = rsa.Item("cramo")
                        .cpoliza = rsa.Item("cpoliza")
                        .fanopol = rsa.Item("fanopol")
                        .fmespol = rsa.Item("fmespol")
                        .cplan = rsa.Item("cplan")
                        .cagrupa = rsa.Item("cagrupa")
                        .itipoprod = rsa.Item("itipoprod")
                        .casegurado = rsa.Item("casegurado")
                        .ctenedor = rsa.Item("ctenedor")
                        .cbeneficiario = rsa.Item("cbeneficiario")
                        .cacreedor = rsa.Item("cacreedor")
                        .cmercado = rsa.Item("cmercado")
                        .cactividad = rsa.Item("cactividad")
                        .pactividad = rsa.Item("pactividad")
                        .criesgo = rsa.Item("criesgo")
                        .priesgo = rsa.Item("priesgo")
                        .cclaries = rsa.Item("cclaries")
                        .cclarie = rsa.Item("cclarie")
                        .imodcon = rsa.Item("imodcon")
                        .cultrec = rsa.Item("cultrec")
                        .xdirecob = Trim(rsa.Item("xdirecob"))
                        .ctipotec = rsa.Item("ctipotec")
                        .ctipoest = rsa.Item("ctipoest")
                        .ctipopar = rsa.Item("ctipopar")
                        .ctecest = rsa.Item("ctecest")
                        .ctipopiso = rsa.Item("ctipopiso")
                        .ctipoentrepiso = rsa.Item("ctipoentrepiso")
                        .ctipocieloraso = rsa.Item("ctipocieloraso")
                        .ptasa = rsa.Item("ptasa")
                        .ctipofac = rsa.Item("ctipofac")
                        .cfachada = rsa.Item("cfachada")
                        .xpisos = rsa.Item("xpisos")
                        .cpais = rsa.Item("cpais")
                        .cestado = rsa.Item("cestado")
                        .cciudad = rsa.Item("cciudad")
                        .ccorregi = rsa.Item("ccorregi")
                        .cbarriada = rsa.Item("cbarriada")
                        .czonapos = rsa.Item("czonapos")
                        .czonsism = rsa.Item("czonsism")
                        .czoninun = rsa.Item("czoninun")
                        .czonmoti = rsa.Item("czonmoti")
                        .cemppetr = rsa.Item("cemppetr")
                        .xfacaltu = rsa.Item("xfacaltu")
                        .ctipo = rsa.Item("ctipo")
                        .xobserva = Trim(rsa.Item("xobserva"))
                        .xobsimp = Trim(rsa.Item("xobsimp"))
                        .bobsimp = rsa.Item("bobsimp")
                        .ptotdes = rsa.Item("ptotdes")
                        .ptotrec = rsa.Item("ptotrec")
                        .brenova = rsa.Item("brenova")
                        .istatcer = rsa.Item("istatcer")
                        .mvalor = rsa.Item("mvalor")
                        .ptasbasi = rsa.Item("ptasbasi")
                        .fdesde = rsa.Item("fdesde")
                        .fhasta = rsa.Item("fhasta")
                        .femision = rsa.Item("femision")
                        .fbaja = rsa.Item("fbaja")
                        .fanulacion = rsa.Item("fanulacion")
                        .xnprestamo = rsa.Item("xnprestamo")
                        .preportable = rsa.Item("preportable")
                        .bcumulo = rsa.Item("bcumulo")
                        .cprog = rsa.Item("cprog")
                        .ifuente = rsa.Item("ifuente")
                        .bok = rsa.Item("bok")
                        .cerror = rsa.Item("cerror")
                        .fingreso = rsa.Item("fingreso")
                        .cusuario = rsa.Item("cusuario")
                        .ccategoria = rsa.Item("ccategoria")
                        .cusuarioauto = rsa.Item("cusuarioauto")
                        .ccategoriaauto = rsa.Item("ccategoriaauto")
                        .fultmod = rsa.Item("fultmod")
                        .cusuariomod = rsa.Item("cusuariomod")
                        .ccategoriamod = rsa.Item("ccategoriamod")
                    End With
                End Using

        End Select
    End Sub
    Public Sub sp_proyectos(ByVal modo As String, ByRef OFPRO As reg_Proyectos)
        '---------------------------------------------------------------------------------------
        ' Procedimiento : sp_proyectos
        ' Uso           : Ofertas Fianzas
        ' Fecha         : 3/10/07
        ' Autor         : ASI (Asesores Informáticos) JAMO
        ' Proposito     : Adiciona, Modifica y lee el archivo ofproyectos desde la estructura OFPRO
        ' 
        ' Variables del Entorno:
        '               Entrada:
        '               Salida:
        '---------------------------------------------------------------------------------------
        ' Bitacora de Modificaciones:
        ' 
        '
        '---------------------------------------------------------------------------------------
        Dim sql As String

        Select Case modo
            Case "I" 'Insertar
                sql = "insert into ofproyectos values("
                sql = sql & OFPRO.cproces & ","
                sql = sql & OFPRO.ccerti & ",'"
                sql = sql & OFPRO.u_version & "',"
                sql = sql & OFPRO.cpoliza & ","
                sql = sql & OFPRO.fanopol & ","
                sql = sql & OFPRO.fmespol & ","
                sql = sql & OFPRO.cramo & ",'"
                sql = sql & OFPRO.cplan & "',"
                sql = sql & OFPRO.cagrupa & ","
                sql = sql & OFPRO.cci_afavor & ","
                sql = sql & OFPRO.casegurado & ","
                sql = sql & OFPRO.ctenedor & ","
                sql = sql & OFPRO.cbeneficiario & ","
                sql = sql & OFPRO.cacreedor & ",'"
                sql = sql & OFPRO.NumProy & "','"
                sql = sql & OFPRO.NombProy & "','"
                sql = sql & OFPRO.Status & "','"
                sql = sql & OFPRO.fdesde & "','"
                sql = sql & OFPRO.fhasta & "',"
                sql = sql & OFPRO.Suma & ",'"
                sql = sql & OFPRO.NContrato & "','"
                sql = sql & OFPRO.NLicitacion & "','"
                sql = sql & OFPRO.NProyecto & "',"
                sql = sql & OFPRO.cmercado & ","
                sql = sql & OFPRO.cactividad & ","
                sql = sql & OFPRO.pactividad & ","
                sql = sql & OFPRO.criesgo & ","
                sql = sql & OFPRO.priesgo & ","
                sql = sql & OFPRO.cclaries & ","
                sql = sql & OFPRO.cclarie & ","
                sql = sql & OFPRO.cultrec & ",'"
                sql = sql & Format(OFPRO.femision, "dd/MM/yy h:m:s") & "',"
                sql = sql & "Null,'"
                sql = sql & OFPRO.xobserva & "','"
                sql = sql & OFPRO.xobsimp & "',"
                sql = sql & OFPRO.bobsimp & ","
                sql = sql & "Null,'"
                sql = sql & OFPRO.xnprestamo & "',"
                sql = sql & OFPRO.brenova & ","
                sql = sql & OFPRO.canula & ","

                sql = sql & IIf(OFPRO.bcumulo = False, 0, -1) & ",'"
                sql = sql & OFPRO.cprog & "','"
                sql = sql & OFPRO.ifuente & "','"
                sql = sql & OFPRO.bok & "','"
                sql = sql & OFPRO.cerror & "','"
                sql = sql & Format(OFPRO.fingreso, "dd/MM/yy h:m:s") & "',"
                sql = sql & OFPRO.cusuario & ","
                sql = sql & OFPRO.ccategoria & ","
                sql = sql & OFPRO.cusuarioauto & ","
                sql = sql & OFPRO.ccategoriaauto & ",'"
                sql = sql & Format(OFPRO.fultmod, "dd/MM/yy h:m:s") & "',"
                sql = sql & OFPRO.cusuariomod & ","
                sql = sql & OFPRO.ccategoriamod & ",'"
                sql = sql & OFPRO.xgarantia & "',"
                sql = sql & OFPRO.valor_garantia
                sql = sql & ",'','','','','01/01/1900','')" 'José Rodríguez: esto es temporal ya que este codigo será migrado a otro Archivo

                If corre(sql) = False Then
                    Messagebox.Show("Error al actualizar proyectos")
                End If

            Case "M" 'Modificar

                sql = "update ofproyectos set cproces="
                sql = sql & OFPRO.cproces & ",ccerti="
                sql = sql & OFPRO.ccerti & ",u_version='"
                sql = sql & OFPRO.u_version & "',cpoliza=" 'este campo tiene la descripcion del riesgo
                sql = sql & OFPRO.cpoliza & ",fanopol="
                sql = sql & OFPRO.fanopol & ",fmespol="
                sql = sql & OFPRO.fmespol & ",cramo="
                sql = sql & OFPRO.cramo & ",cplan='"
                sql = sql & OFPRO.cplan & "',cagrupa="
                sql = sql & OFPRO.cagrupa & ",cci_afavor="
                sql = sql & OFPRO.cci_afavor & ",casegurado="
                sql = sql & OFPRO.casegurado & ",ctenedor="
                sql = sql & OFPRO.ctenedor & ",cbeneficiario="
                sql = sql & OFPRO.cbeneficiario & ",cacreedor="
                sql = sql & OFPRO.cacreedor & ",NumProy="
                sql = sql & OFPRO.NumProy & ",NombProy='"
                sql = sql & OFPRO.NombProy & "',Status='"
                sql = sql & OFPRO.Status & "',fdesde='"
                sql = sql & OFPRO.fdesde & "',fhasta='"
                sql = sql & OFPRO.fhasta & "',Suma="
                sql = sql & OFPRO.Suma & ",NContrato='"
                sql = sql & OFPRO.NContrato & "',NLicitacion='"
                sql = sql & OFPRO.NLicitacion & ",NProyecto='"
                sql = sql & OFPRO.NProyecto & ",cmercado="
                sql = sql & OFPRO.cmercado & ",cactividad="
                sql = sql & OFPRO.cactividad & ",pactividad="
                sql = sql & OFPRO.pactividad & ",criesgo="
                sql = sql & OFPRO.criesgo & ",priesgo="
                sql = sql & OFPRO.priesgo & ",cclaries="
                sql = sql & OFPRO.cclaries & ",cclarie="
                sql = sql & OFPRO.cclarie & ",cultrec="
                sql = sql & OFPRO.cultrec & "',femision='"
                sql = sql & Format(OFPRO.femision, "dd/MM/yy h:m:s") & "',fbaja="
                sql = sql & OFPRO.fbaja & ",xobserva='"
                sql = sql & Trim(OFPRO.xobserva) & "',xobsimp='"
                sql = sql & Trim(OFPRO.xobsimp) & "',bobsimp="
                sql = sql & OFPRO.bobsimp & ",fanulacion="
                sql = sql & OFPRO.fanulacion & ",xnprestamo='"
                sql = sql & OFPRO.xnprestamo & "',brenova='"
                sql = sql & OFPRO.brenova & "',canula="
                sql = sql & OFPRO.canula & "',bcumulo="
                sql = sql & IIf(OFPRO.bcumulo = False, 0, -1) & ",cprog='"
                sql = sql & OFPRO.cprog & "',ifuente='"
                sql = sql & OFPRO.ifuente & "',bok='"
                sql = sql & OFPRO.bok & "',cerror='"
                sql = sql & OFPRO.cerror & "',fingreso='"
                sql = sql & Format(OFPRO.fingreso, "dd/MM/yy h:m:s") & "',cusuario="
                sql = sql & OFPRO.cusuario & ",ccategoria="
                sql = sql & OFPRO.ccategoria & ",cusuarioauto="
                sql = sql & OFPRO.cusuarioauto & ",ccategoriaauto="
                sql = sql & OFPRO.ccategoriaauto & ",fultmod='"
                sql = sql & Format(OFPRO.fultmod, "dd/MM/yy h:m:s") & "',cusuariomod="
                sql = sql & OFPRO.cusuariomod & ",ccategoriamod="
                sql = sql & OFPRO.ccategoriamod
                sql = sql & " where cproces=" & wcproces & " and ccerti=" & wccerti
                If corre(sql) = False Then
                    Messagebox.Show("Error al actualizar NBOFCERT")
                End If

            Case "L" 'Leer
                Dim queryString As String = _
                                         "SELECT * From ofproyectos WHERE cproces=" & OFPRO.cproces & ", ccerti = " & OFPRO.ccerti

                Using connection As New Data.SqlClient.SqlConnection(ConnectionStringMundisis)
                    Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
                    connection.Open()
                    Dim rsa As Data.SqlClient.SqlDataReader = command.ExecuteReader()
                    rsa.Read()
                    If rsa.HasRows = False Then
                        Messagebox.Show("No encuentro el registro de Nbofcert")
                        Exit Sub
                    End If
                    With OFPRO
                        .cproces = rsa.Item("cproces")
                        .ccerti = rsa.Item("ccerti")
                        .u_version = rsa.Item("u_version")
                        .cpoliza = rsa.Item("cpoliza")
                        .fanopol = rsa.Item("fanopol")
                        .fmespol = rsa.Item("fmespol")
                        .cramo = rsa.Item("cramo")
                        .cplan = rsa.Item("cplan")
                        .cagrupa = rsa.Item("cagrupa")
                        .cci_afavor = rsa.Item("cci_afavor")
                        .casegurado = rsa.Item("casegurado")
                        .ctenedor = rsa.Item("ctenedor")
                        .cbeneficiario = rsa.Item("cbeneficiario")
                        .cacreedor = rsa.Item("cacreedor")
                        .NumProy = rsa.Item("NumProy")
                        .NombProy = rsa.Item("NombProy")
                        .Status = rsa.Item("Status")
                        .fdesde = rsa.Item("fdesde")
                        .fhasta = rsa.Item("fhasta")
                        .Suma = rsa.Item("Suma")
                        .NContrato = rsa.Item("NContrato")
                        .NLicitacion = rsa.Item("NLicitacion")
                        .NProyecto = rsa.Item("NProyecto")
                        .cmercado = rsa.Item("cmercado")
                        .cactividad = rsa.Item("cactividad")
                        .pactividad = rsa.Item("pactividad")
                        .criesgo = rsa.Item("criesgo")
                        .priesgo = rsa.Item("priesgo")
                        .cclaries = rsa.Item("cclaries")
                        .cclarie = rsa.Item("cclarie")
                        .cultrec = rsa.Item("cultrec")
                        .femision = rsa.Item("femision")
                        .fbaja = rsa.Item("fbaja")
                        .xobserva = Trim(rsa.Item("xobserva"))
                        .xobsimp = Trim(rsa.Item("xobsimp"))
                        .bobsimp = rsa.Item("bobsimp")
                        .fanulacion = rsa.Item("fanulacion")
                        .xnprestamo = rsa.Item("xnprestamo")
                        .brenova = rsa.Item("brenova")
                        .canula = rsa.Item("canula")
                        .bcumulo = rsa.Item("bcumulo")
                        .cprog = rsa.Item("cprog")
                        .ifuente = rsa.Item("ifuente")
                        .bok = rsa.Item("bok")
                        .cerror = rsa.Item("cerror")
                        .fingreso = rsa.Item("fingreso")
                        .cusuario = rsa.Item("cusuario")
                        .ccategoria = rsa.Item("ccategoria")
                        .cusuarioauto = rsa.Item("cusuarioauto")
                        .ccategoriaauto = rsa.Item("ccategoriaauto")
                        .fultmod = rsa.Item("fultmod")
                        .cusuariomod = rsa.Item("cusuariomod")
                        .ccategoriamod = rsa.Item("ccategoriamod")
                    End With
                End Using

        End Select
    End Sub
    Public Sub MuestraPopup(ByVal titulo As String, ByVal mensaje As String, ByVal direccion As String, ByVal duracion As Integer, ByRef master As MasterPage)
        '---------------------------------------------------------------------------------------
        ' Procedimiento : MuestraPopup
        ' Uso           :           General
        ' Fecha         :         20/10/2007
        ' Autor         :           TONY MAYORAL
        ' Proposito     :       mostrar notificaciones tipo MSN al usuario . Al hacer clic en el mensaje se abre otra ventana con la dirección especificada. 
        ' 
        ' Variables del Entorno y funciones dependientes
        '               Entrada: el div id="ventana" de master de contabilidad01 - En futuro será un control
        '               Salida: 
        'Base de Datos
        '               Tablas Modificadas: Ninguna
        '---------------------------------------------------------------------------------------
        'Dim panel As Panel = master.FindControl("Panel1")
        ''Dim div As Control = master.FindControl("ventana")
        ''div.Visible = True
        'Dim lbtitulo As Label = panel.FindControl("lbtitulo")
        'Dim lbmensaje As Label = panel.FindControl("lbmensaje")
        'Dim timer As Gaia.WebWidgets.Timer = panel.FindControl("Timer1")
        'Dim dir As Label = panel.FindControl("lbdireccion")

        '' panel.Width = 200
        'lbtitulo.Text = titulo
        'lbmensaje.Text = mensaje
        'dir.Text = direccion
        'If duracion = "-1" Then timer.Enabled = False Else timer.Enabled = True : timer.Milliseconds = duracion


        'Dim efecto As New Gaia.WebWidgets.Effect("ventana", Gaia.WebWidgets.Effect.TypeOfEffect.BlindDown)
        'panel.Visible = True
        'Dim m As New sis.Gui.Notificacion(mensaje, titulo)

        Sis.Gui.msg.nuevo(mensaje, titulo)

    End Sub
    Public Sub MsgBoxx(ByVal Mensaje As String, ByRef master As MasterPage, Optional ByVal SiRedir As String = "", Optional ByVal NoRedir As String = "")
        '---------------------------------------------------------------------------------------
        ' Procedimiento :           MsgBox
        ' Uso           :           General
        ' Fecha         :         10/03/2008
        ' Autor         :           TONY MAYORAL
        ' Proposito     :       mostrar notificaciones MsgBox AJAX. 
        ' 
        ' Variables del Entorno y funciones dependientes
        '               Entrada: 
        '               Salida: 
        ' Base de Datos
        '               Tablas Modificadas: Ninguna
        '---------------------------------------------------------------------------------------

        Dim ventana As Gaia.WebWidgets.Window = master.FindControl("Vmensaje")
        Dim msg As Label = ventana.FindControl("Vlbmensaje")
        Dim btAceptar As Gaia.WebWidgets.Button = ventana.FindControl("VbtAceptar")
        Dim btCancelar As Gaia.WebWidgets.Button = ventana.FindControl("VbtCancelar")

        msg.Text = Mensaje
        ventana.Visible = True

        If Not String.IsNullOrEmpty(SiRedir) Or Not String.IsNullOrEmpty(NoRedir) Then

            Dim direccionSI As Gaia.WebWidgets.Label = ventana.FindControl("VlbDireccionSI")
            Dim direccionNO As Gaia.WebWidgets.Label = ventana.FindControl("VlbDireccionNO")

            btAceptar.Text = "Si"
            btCancelar.Text = "No"
            btCancelar.Visible = True
            direccionSI.Text = SiRedir.ToString
            direccionNO.Text = NoRedir.ToString
        Else
            btAceptar.Text = "Aceptar"
            btCancelar.Visible = False
        End If
        ventana.ForceAnUpdate()

    End Sub

    Public Function Cambia_Password(ByVal numero As Integer, ByVal actual As String, ByVal nuevo As String, Optional ByVal necesita_antigua As Boolean = True) As Boolean
        '---------------------------------------------------------------------------------------
        ' Procedimiento : Cambia_Password
        ' Uso           :           General
        ' Fecha         :         20/10/2007
        ' Autor         :           Jose Rodriguez
        ' Proposito     :      Cambia Contraseña de Usuarios SIS. 
        ' 
        ' Variables del Entorno y funciones dependientes
        '               Entrada: el div id="ventana" de master de contabilidad01 - En futuro será un control
        '               Salida: 
        'Base de Datos
        '               Tablas Modificadas: Maentes.
        '---------------------------------------------------------------------------------------
        Dim cci_rif As String = String.Empty

        If necesita_antigua = True Then
            cci_rif = VG.EXISTEregistro("maentes", "where cci_rif=" & numero & " and rtrim(cpassword)='" & Trim(actual) & "'", "cci_rif", False)
        Else
            cci_rif = VG.EXISTEregistro("maentes", "where cci_rif=" & numero, "cci_rif", False)
        End If

        If cci_rif <> "" Then
            VG.EjecutaSQL("update maentes set cpassword= '" & Trim(nuevo) & "' where cci_rif=" & numero, False)
            VG.EjecutaSQL("update acceso set clave= '" & Trim(nuevo) & "' where idusuario=" & numero, False)



        End If

        If Err.Number = 0 Then
            Cambia_Password = True
        Else
            Cambia_Password = False
        End If

    End Function
    Public Function Cambia_Password2(ByVal numero As Integer, ByVal actual As String, ByVal nuevo As String, Optional ByVal necesita_antigua As Boolean = True) As String
        Dim hashSeguridad As New Hashtable()
        Dim db As New sis3.db.db
        Dim objclsStrProcedure As New clsStrProcedure()
        Dim user As String



        Dim emcryp As Sis.Seguridad.Encriptar_Desencriptar
        Dim dt As New Data.DataTable
        emcryp = New Sis.Seguridad.Encriptar_Desencriptar
        emcryp.KeyString = nuevo
        emcryp.Encryptado()
        user = VG.EjecutaSQL_escalar("SELECT xuserid FROM dbo.SEGURIDAD WHERE cci_rif =" & numero)
        dt = db.EjecutaSQL_datatable("SELECT * FROM dbo.MantPasswordUser WHERE xuser = '" & user & "'", dt)

        Dim cci_rif As String = String.Empty

        If necesita_antigua = True Then
            cci_rif = VG.EXISTEregistro("seentesusu", "where cci_rif=" & numero & " and rtrim(cpassword)='" & emcryp.KeyEncripted & "'", "cci_rif", False)
        Else
            cci_rif = VG.EXISTEregistro("seentesusu", "where cci_rif=" & numero, "cci_rif", False)
        End If



        If cci_rif <> "" Then
            VG.EjecutaSQL("update seentesusu set cpassword= '" & Trim(nuevo) & "' where cci_rif=" & numero, False)
            VG.EjecutaSQL("update acceso set clave= '" & Trim(nuevo) & "' where idusuario=" & numero, False)

            hashSeguridad = New Hashtable()
            hashSeguridad.Add("user", user)
            hashSeguridad.Add("pass", emcryp.KeyEncripted)
            hashSeguridad.Add("cci_rif", numero)
            objclsStrProcedure.EjecutarProcedimientosAlmacenados("sp_newpass", hashSeguridad)
        End If

        If Err.Number = 0 Then
            Cambia_Password2 = True
        Else
            Cambia_Password2 = False
        End If

    End Function

    Public Function DAME_ACCESO(ByVal CCI_RIF As Integer, ByVal CAMPO As String) As Boolean
        '---------------------------------------------------------------------------------------
        ' Procedimiento : DAME_ACCESO
        ' Uso           : General
        ' Fecha         : 09/11/2007
        ' Autor         : Jose Rodriguez (PANAMA)
        ' Proposito     : DEFINE LOS ACCESOS A LAS PANTALLAS. 
        ' 
        ' Variables del Entorno y funciones dependientes
        '               FUNCIONES DEPENDIENTES: VG.EjecutaSQL_escalar
        '               Salida: DAME_ACCESO = TRUE ó FALSE
        '               Entrada: CCI_rif --> es el enlace de acceso con maentes, seentesusu, 
        '               Entrada: campo --> es el campo booleano de la tabla acceso que define el acceso a determinada seccion del sistema 
        'Base de Datos
        '               Tablas Modificadas: sis_Global.ACCESO
        '---------------------------------------------------------------------------------------
        DAME_ACCESO = False

        'VERIFICA QUE VG.NUMERO ESTE CONTEMPLADA EN LA VISTA SEGURIDAD
        Dim EXISTE As Integer
        EXISTE = 0
        EXISTE = VG.EjecutaSQL_escalar("select cci_rif from seguridad where cci_rif =" & CCI_RIF, False)

        If EXISTE = 0 Then
            DAME_ACCESO = False
            Exit Function
        End If

        'VERIFICA PERMISOS EN TABLA ACCESO EN LA BD SIS_GLOBAL
        Dim PERMISO As Boolean
        PERMISO = False
        PERMISO = CBool(VG.EjecutaSQL_escalar("select " & CAMPO & " from ACCESO where sig = 'true' and IDUSUARIO =" & CCI_RIF, True))

        If PERMISO = False Then
            PERMISO = CBool(VG.EjecutaSQL_escalar("select administrador from ACCESO where sig = 'true' and  IDUSUARIO =" & CCI_RIF, True))
        End If

        If PERMISO = False Then
            DAME_ACCESO = False
            Exit Function
        Else
            DAME_ACCESO = True
        End If

    End Function

    Public Function Existe_Remesa(ByVal nremesa As Integer, Optional ByRef ipendiente As Boolean = False) As Boolean
        Dim SqlCnx As New System.Data.SqlClient.SqlConnection()
        Dim SqlCmd As New System.Data.SqlClient.SqlCommand()
        Dim SqlLector As System.Data.SqlClient.SqlDataReader
        SqlLector = Nothing

        Try
            SqlCnx.ConnectionString = VG.ConnectionStringMundisis
            SqlCnx.Open()
            SqlCmd.Connection = SqlCnx
            SqlCmd.CommandText = "SELECT nremesa,ipendiente from Mremesas WHERE nremesa=" & nremesa
            SqlLector = SqlCmd.ExecuteReader

            If SqlLector.Read() = True Then
                REM true=(-1) y false=(0)
                ipendiente = Not CType(SqlLector("ipendiente").ToString.Trim, Boolean)
                Existe_Remesa = True
            Else
                ipendiente = False
                Existe_Remesa = False
            End If

        Catch err As Exception
            ipendiente = False
            Existe_Remesa = False
        Finally
            SqlLector.Close()
            SqlCnx.Close()
            SqlCmd.Dispose()
        End Try

    End Function



    '''--------------------->Merge de Vg al fusionar con contabilidad<-------------------------------
    ''' 4/10/2008 Tony
    ''' 

    Public Function DameUltimoCierre() As String

        On Error Resume Next
        Dim queryString As String = _
                "SELECT catalogonic.tipocuen, catalogonic.xultimaActu FROM catalogonic WHERE (((catalogonic.tipocuen)='2'));"
        Using connection As New Data.SqlClient.SqlConnection(ConnectionStringSIS)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            DameUltimoCierre = reader.Item("xultimaActu")
        End Using
    End Function
    Public Function AuxiliarObligatorio(ByVal wcodigo As String, ByRef tipoaux As String) As Boolean
        Dim connectionString As String
        On Error Resume Next
        Dim queryString As String = _
                "select obliaux,tipoaux from catalogonic where cdgocont ='" + wcodigo + "';"
        connectionString = ConnectionStringSIS

        Using connection As New Data.SqlClient.SqlConnection(connectionString)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            AuxiliarObligatorio = reader.Item("obliaux")
            tipoaux = reader.Item("tipoaux")

        End Using
    End Function
    Public Function ctamonedaex(ByVal wcodigo As String, ByRef wmoneda As Integer) As Boolean
        Dim connectionString As String
        On Error Resume Next
        Dim queryString As String = _
                "select cdgomone from catalogonic where cdgocont ='" + wcodigo + "';"
        connectionString = ConnectionStringSIS

        Using connection As New Data.SqlClient.SqlConnection(connectionString)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            If reader.Item("cdgomone") > 1 Then
                ctamonedaex = True
                wmoneda = reader.Item("cdgomone")
            Else
                ctamonedaex = False
                wmoneda = 1
            End If
        End Using
    End Function

    Public Function ExisteCodigo(ByVal wcodigo As String) As Boolean
        Dim connectionString As String
        On Error Resume Next
        Dim queryString As String = _
                "select cdgocont from catalogonic where cdgocont ='" + wcodigo + "';"
        connectionString = ConnectionStringSIS

        Using connection As New Data.SqlClient.SqlConnection(connectionString)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            wcodigo = reader.Item("cdgocont")
            If Err.Number > 0 And Len(wcodigo) > 0 Then
                ExisteCodigo = True
            Else
                ExisteCodigo = True
            End If
        End Using
    End Function
    Function ExisteCodNic(ByVal wcodigo As String) As Boolean
        REM deja en las varibles globales wcodme cuenta moneda extranjera y wcodaux auxiliar obligarorio
        If Len(wcodigo) = 0 Then
            ExisteCodNic = False
            Exit Function
        End If
        On Error Resume Next
        Dim queryString As String = _
                "select desccont,cdgomone,obliaux,tipoaux from catalogonic where cdgocont ='" + wcodigo + "';"
        Using connection As New Data.SqlClient.SqlConnection(ConnectionStringSIS)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            If reader.HasRows = True Then
                ExisteCodNic = True
                If reader.Item("cdgomone") > 1 Then
                    wcodme = True
                Else
                    wcodme = False
                End If
                wctamoneda = reader.Item("cdgomone")
                wctades = Trim(reader.Item("desccont"))
                wcodaux = reader.Item("obliaux")
                wtipoaux = IIf(IsDBNull(reader.Item("tipoaux")), "N", reader.Item("tipoaux"))
            Else
                ExisteCodNic = False
            End If
        End Using
    End Function
    'Public Function DameNombre(ByVal WWW As Double) As String

    '    If WWW = 0 Then
    '        DameNombre = "Sin Asignar"
    '        wcid = "Sin Asignar"
    '        Exit Function
    '    End If
    '    If WWW = xwtenedor Then
    '        '   Si el Ente esta en memoria lo asigno
    '        DameNombre = xdamenombre
    '        Exit Function
    '    End If
    '    DameNombre = asi.DameNombre(WWW, wcid, xwtenedor, wsaldoten, xdamenombre, licencia)


    'End Function



    Public Function DameProxDautocaja(ByVal wtran As Integer) As Integer
        Dim connectionString As String
        On Error Resume Next
        Dim queryString As String = _
                "SELECT Max(DAUTOCAJA_NET.linea) AS MaxDelinea FROM DAUTOCAJA_NET WHERE (((DAUTOCAJA_NET.NASIPRE)=" & Str(wtran) & "));"
        connectionString = ConnectionStringSIS

        Using connection As New Data.SqlClient.SqlConnection(connectionString)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            DameProxDautocaja = asi.NZ(reader.Item("MaxDelinea"), 0) + 1
        End Using
    End Function


    Public Function DameCdgomoneCTA(ByVal wcodigo As String) As Short
        Dim connectionString As String
        On Error Resume Next
        Dim queryString As String = _
                "select cdgomone from catalogonic where cdgocont ='" + wcodigo + "';"
        connectionString = ConnectionStringSIS

        Using connection As New Data.SqlClient.SqlConnection(connectionString)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            DameCdgomoneCTA = reader.Item("cdgomone")
        End Using
    End Function


    Public Function DameSQLBuscaAUX(ByVal wtipoaux As String) As String
        Dim queryString As String

        queryString = "SELECT * FROM mauxiliares WHERE tipoaux='" & wtipoaux & "'"
        Using connection As New Data.SqlClient.SqlConnection(ConnectionStringSIS)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            If reader.HasRows Then
                DameSQLBuscaAUX = "SELECT " & reader.Item("codauxi").ToString.Trim & " AS cci_rif, " & reader.Item("desauxi").ToString.Trim & " AS xcliente FROM " & reader.Item("archivoaux").ToString.Trim
                If Not String.IsNullOrEmpty(reader.Item("bcampo").ToString.Trim) Then
                    DameSQLBuscaAUX += " WHERE ABS(" & reader.Item("bcampo").ToString.Trim & ")=1"
                End If
            Else
                DameSQLBuscaAUX = ""
            End If
        End Using
    End Function


    Public Function DameCAMPOCONTABLE_XCOB(ByVal campo As String, ByVal cramo As Integer, Optional ByVal ccober As String = "") As String
        Dim connectionString As String
        On Error Resume Next
        Dim queryString As String

        queryString = "select " & campo & " as campo from macoberturasconta_net where cramo=" & cramo
        If Len(Trim(ccober)) <> 0 Then queryString = queryString & " and ccobertura='" & ccober & "'"
        connectionString = ConnectionStringMundisis
        Using connection As New Data.SqlClient.SqlConnection(connectionString)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            DameCAMPOCONTABLE_XCOB = Trim(reader.Item("campo"))
            If Err.Number <> 0 Then
                DameCAMPOCONTABLE_XCOB = "0"
                Messagebox.Show("ERROR GRAVE ... NO ESTA CODIFICADA LA CUENTA CONTABLE EN LA COBERTURA")
            End If
        End Using
    End Function

    Public Function CerrarMES(ByVal wames As Integer, Optional ByRef xError As String = "") As Boolean
        On Error GoTo salida
        Dim xSQL As String

        xError = ""
        CerrarMES = True

        xSQL = "UPDATE compcont SET cerrado = 1 WHERE numeames = " & wames
        If corresis(xSQL) = False Then
            GoTo salida
        End If

        Exit Function

salida:
        CerrarMES = False
        xError = Err.Description

    End Function

    'Public Function AplicarMascara() As String
    '    'ByRef ControlWebMaskEdit As Infragistics.WebUI.WebDataInput.WebMaskEdit, 
    '    Dim wxSeparador As String = ""
    '    Dim wGrupo01 As Integer = 0
    '    Dim wGrupo02 As Integer = 0
    '    Dim wGrupo03 As Integer = 0
    '    Dim wGrupo04 As Integer = 0
    '    Dim wGrupo05 As Integer = 0
    '    Dim wGrupo06 As Integer = 0
    '    Dim wGrupo07 As Integer = 0
    '    'Dim wMascara As String = ""
    '    wxSeparador = wsepa
    '    wGrupo01 = wgrupo(1)
    '    wGrupo02 = wgrupo(2)
    '    wGrupo03 = wgrupo(3)
    '    wGrupo04 = wgrupo(4)
    '    wGrupo05 = wgrupo(5)
    '    wGrupo06 = wgrupo(6)
    '    wGrupo07 = wgrupo(7)


    '    Dim wxvar As String = ""

    '    'wxvar = ""

    '    If Val(wGrupo01) > 0 Then
    '        wxvar = AgregaDigitos(wGrupo01)
    '    End If
    '    If Val(wGrupo02) > 0 Then
    '        wxvar = wxvar & wxSeparador
    '        wxvar = wxvar & AgregaDigitos(wGrupo02)
    '    End If

    '    If Val(wGrupo03) > 0 Then
    '        wxvar = wxvar & wxSeparador
    '        wxvar = wxvar & AgregaDigitos(wGrupo03)
    '    End If

    '    If Val(wGrupo04) > 0 Then
    '        wxvar = wxvar & wxSeparador
    '        wxvar = wxvar & AgregaDigitos(wGrupo04)
    '    End If

    '    If Val(wGrupo05) > 0 Then
    '        wxvar = wxvar & wxSeparador
    '        wxvar = wxvar & AgregaDigitos(wGrupo05)
    '    End If

    '    If Val(wGrupo06) > 0 Then
    '        wxvar = wxvar & wxSeparador
    '        wxvar = wxvar & AgregaDigitos(wGrupo06)
    '    End If

    '    If Val(wGrupo07) > 0 Then
    '        wxvar = wxvar & wxSeparador
    '        wxvar = wxvar & AgregaDigitos(wGrupo07)
    '    End If

    '    AplicarMascara = wxvar
    '    'AplicarMascara = wxvar
    '    'ControlWebMaskEdit.InputMask = wxvar
    'End Function

    Private Function AgregaDigitos(ByVal wNumeroDigitos As Integer) As String
        AgregaDigitos = ""
        Dim i As Integer
        For i = 1 To wNumeroDigitos
            AgregaDigitos = AgregaDigitos & "0"
        Next
    End Function

    Public Function DameNumeAmesFecha(ByVal wFecha As Date) As Decimal
        Dim wxAño As String
        Dim wxMes As String
        wxAño = CStr(Year(wFecha))
        wxMes = CStr(String.Format("{0:00}", Month(wFecha)))
        DameNumeAmesFecha = wxAño & wxMes
    End Function
    Public Function AbrirMES(ByVal wames As Integer, Optional ByRef xError As String = "") As Boolean
        On Error GoTo salida
        Dim xSQL As String

        xError = ""
        AbrirMES = True

        xSQL = "INSERT INTO masiconcerrado SELECT * FROM masicon WHERE numeames  = " & wames
        corresis(xSQL)
        xSQL = "INSERT INTO dasiconcerrado SELECT * FROM dasicon WHERE numeames  = " & wames
        corresis(xSQL)
        xSQL = "UPDATE compcont SET cerrado = 0 where numeames = " & wames
        If corresis(xSQL) = False Then
            GoTo salida
        End If

        Exit Function

salida:
        AbrirMES = False
        xError = Err.Description

    End Function

    Public Function BALAN_DameMtoCTA(ByVal wSumatorio As String, ByVal bEnMiles As Boolean, ByVal CambiaSigno As Boolean, ByVal wtipoSaldo As String) As Double
        Dim wResultado As Double = 0
        Dim i As Integer, x1 As Integer
        Dim SQL As String, wSumat As String, wCta As String, wCampo As String
        Dim rsa As New ADODB.Recordset
        wCampo = "saldofin"
        Select Case wtipoSaldo
            Case "SF"
                wCampo = "saldofin"
            Case "SI"
                wCampo = "saldoini"
            Case "DB"
                wCampo = "mntodebe"
            Case "HB"
                wCampo = "mntohabe"
            Case "MV"
                wCampo = "mntodebe-mntohabe"
        End Select

        wSumat = wSumatorio.Trim
        wSumat = wSumat.Replace(" ", "")
        wResultado = 0
        For i = 1 To wSumatorio.Trim.Length
otro:
            If Mid(wSumat, i, 1) = "(" Then
                x1 = InStr(wSumat, ")")
                wCta = Mid(wSumat, i + 1, x1 - 2)
                SQL = "SELECT SUBSTRING(cdgocont,1," & Len(wCta) & ") AS Expr1, SUM(" & wCampo & ") AS Result FROM dbo.catalogonic WITH (NOLOCK) WHERE dbo.catalogonic.tipocuen='2' GROUP BY SUBSTRING(cdgocont,1," & Len(wCta) & ") HAVING SUBSTRING(cdgocont,1," & Len(wCta) & ")='" & wCta & "';"
                If rsa.State = 1 Then rsa.Close()
                rsa.Open(SQL, Oleconsis, ADODB.CursorTypeEnum.adOpenForwardOnly, ADODB.LockTypeEnum.adLockReadOnly)
                If Not rsa.EOF Then
                    wResultado = wResultado + rsa.Fields("Result").Value
                End If
                wSumat = Mid(wSumat, x1 + 1, Len(wSumat))
                If wSumat = "" Then GoTo salida Else GoTo otro
            End If
        Next
salida:
        If bEnMiles = True Then BALAN_DameMtoCTA = wResultado / 1000 Else BALAN_DameMtoCTA = wResultado
        If CambiaSigno = True Then BALAN_DameMtoCTA = BALAN_DameMtoCTA * -1
    End Function
    Public Function BALAN_DameMtoCTAdol(ByVal wSumatorio As String, ByVal bEnMiles As Boolean, ByVal CambiaSigno As Boolean, ByVal wtipoSaldo As String) As Double
        Dim wResultado As Double = 0
        Dim i As Integer, x1 As Integer
        Dim SQL As String, wSumat As String, wCta As String, wCampo As String
        Dim rsa As New ADODB.Recordset
        wCampo = "saldofindol"
        Select Case wtipoSaldo
            Case "SF"
                wCampo = "saldofindol"
            Case "SI"
                wCampo = "saldoinidol"
            Case "DB"
                wCampo = "mntodebedol"
            Case "HB"
                wCampo = "mntohabedol"
            Case "MV"
                wCampo = "mntodebedol-mntohabedol"
        End Select

        wSumat = wSumatorio.Trim
        wSumat = wSumat.Replace(" ", "")
        wResultado = 0
        For i = 1 To wSumatorio.Trim.Length
otro:
            If Mid(wSumat, i, 1) = "(" Then
                x1 = InStr(wSumat, ")")
                wCta = Mid(wSumat, i + 1, x1 - 2)
                SQL = "SELECT SUBSTRING(cdgocont,1," & Len(wCta) & ") AS Expr1, SUM(" & wCampo & ") AS Result FROM dbo.catalogonic WITH (NOLOCK) WHERE dbo.catalogonic.tipocuen='2' GROUP BY SUBSTRING(cdgocont,1," & Len(wCta) & ") HAVING SUBSTRING(cdgocont,1," & Len(wCta) & ")='" & wCta & "';"
                If rsa.State = 1 Then rsa.Close()
                rsa.Open(SQL, Oleconsis, ADODB.CursorTypeEnum.adOpenForwardOnly, ADODB.LockTypeEnum.adLockReadOnly)
                If Not rsa.EOF Then
                    wResultado = wResultado + rsa.Fields("Result").Value
                End If
                wSumat = Mid(wSumat, x1 + 1, Len(wSumat))
                If wSumat = "" Then GoTo salida Else GoTo otro
            End If
        Next
salida:
        If bEnMiles = True Then BALAN_DameMtoCTAdol = wResultado / 1000 Else BALAN_DameMtoCTAdol = wResultado
        If CambiaSigno = True Then BALAN_DameMtoCTAdol = BALAN_DameMtoCTAdol * -1
    End Function



    Public Sub DameFCierre(ByRef FechaCierre As Date, ByRef FechaSI As Date, ByRef FechaSF As Date)
        Dim connectionString As String
        On Error Resume Next
        Dim queryString As String = _
                "select * from fcierre"
        connectionString = ConnectionStringSIS

        Using connection As New Data.SqlClient.SqlConnection(connectionString)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            FechaCierre = reader.Item("FechaCierre")
            FechaSI = reader.Item("FechaSI")
            FechaSF = reader.Item("FechaSF")
        End Using
    End Sub




    Public Function MUC_SaldosCreaTMP(Optional ByVal wcdgomone As Object = Nothing) As Boolean
        On Error GoTo salida
        Dim SQL As String
        Dim FechaCierre As Date, FechaSI As Date, FechaSF As Date
        Dim ptasacambio As Double

        MUC_SaldosCreaTMP = True
        EliTABLA_sis("dbo.WWWMUC_Saldos")

        DameFCierre(FechaCierre, FechaSI, FechaSF)
        ptasacambio = asi.Damecambio(2, FechaSF, licencia)

        'Calculando cuentas q deben reportar moneda nacional obligatoriamente
        SQL = "SELECT catalogonic.cdgosupe AS id_cuenta_muc, 1 AS id_moneda, "
        SQL += " SUM(catalogonic.saldofin) AS saldo, SUM(catalogonic.saldofin) AS saldoloc, "
        SQL += " convert(nvarchar(30),'') AS cincidencia, convert(nvarchar(255),'') AS xincidencia "
        SQL += " INTO dbo.WWWMUC_Saldos FROM catalogonic WITH (NOLOCK) "
        SQL += " WHERE catalogonic.tipocuen='2' AND catalogonic.saldofin<>0 AND catalogonic.cdgosupe IS NOT NULL "
        SQL += " AND catalogonic.cdgosupe IN (SELECT cdgosupe FROM catanic WHERE Nivel=99)"
        SQL += " GROUP BY catalogonic.cdgosupe "
        SQL += " ORDER BY catalogonic.cdgosupe;"
        If corresis(SQL) = False Then GoTo salida

        'Calculando cuentas q pueden reportar en cualquier moneda
        'Calculando Moneda 1,2
        SQL = "INSERT INTO dbo.WWWMUC_Saldos "
        SQL += " SELECT catalogonic.cdgosupe AS id_cuenta_muc, SUBSTRING(catalogonic.cdgocont,13,1) AS id_moneda, "
        SQL += " SUM(catalogonic.saldofin) AS saldo, SUM(catalogonic.saldofin) AS saldoloc, "
        SQL += " convert(nvarchar(30),'') AS cincidencia, convert(nvarchar(255),'') AS xincidencia "
        SQL += " FROM catalogonic WITH (NOLOCK) "
        SQL += " WHERE catalogonic.tipocuen='2' AND catalogonic.saldofin<>0 AND catalogonic.cdgosupe IS NOT NULL "
        SQL += " AND (SUBSTRING(catalogonic.cdgocont,13,1)='1' OR SUBSTRING(catalogonic.cdgocont,13,1)='2') "
        SQL += " AND catalogonic.cdgosupe NOT IN (SELECT cdgosupe FROM catanic WHERE Nivel=99)"
        SQL += " GROUP BY catalogonic.cdgosupe, SUBSTRING(catalogonic.cdgocont,13,1) "
        SQL += " ORDER BY cdgosupe, SUBSTRING(cdgocont,13,1);"
        If corresis(SQL) = False Then GoTo salida
        'Calculando Moneda 3
        SQL = "INSERT INTO dbo.WWWMUC_Saldos "
        SQL += " SELECT catalogonic.cdgosupe AS id_cuenta_muc, SUBSTRING( catalogonic.cdgocont,13,1) AS id_moneda, "
        SQL += " SUM(saldofindol) AS saldo, SUM(round(saldofindol*" & ptasacambio & " ,2)) AS saldoloc, "
        SQL += " '' AS cincidencia, '' AS xincidencia "
        SQL += " FROM catalogonic WITH (NOLOCK) "
        SQL += " WHERE catalogonic.tipocuen='2' AND catalogonic.saldofindol<>0 AND catalogonic.cdgosupe IS NOT NULL "
        SQL += " AND SUBSTRING(cdgocont,13,1)='3' "
        SQL += " AND catalogonic.cdgosupe NOT IN (SELECT cdgosupe FROM catanic WHERE Nivel=99)"
        SQL += " GROUP BY cdgosupe, SUBSTRING(cdgocont,13,1) "
        SQL += " ORDER BY cdgosupe, SUBSTRING(cdgocont,13,1);"
        If corresis(SQL) = False Then GoTo salida

        ''Calculando Moneda 1,2
        'SQL = "SELECT cdgosupe AS id_cuenta_muc, SUBSTRING(cdgocont,13,1) AS id_moneda, SUM(saldofin) AS saldo, SUM(saldofin) AS saldoloc, convert(nvarchar(30),'') AS cincidencia, convert(nvarchar(255),'') AS xincidencia "
        'SQL = SQL & " INTO dbo.WWWMUC_Saldos FROM catalogonic WITH (NOLOCK) "
        'SQL = SQL & " WHERE tipocuen='2' AND saldofin<>0 AND cdgosupe IS NOT NULL AND "
        'SQL = SQL & " (SUBSTRING(cdgocont,13,1)='1' OR SUBSTRING(cdgocont,13,1)='2') "
        'SQL = SQL & " AND (SUBSTRING(cdgocont,1,1)<>'5' AND SUBSTRING(cdgocont,1,1)<>'6') "
        'SQL = SQL & " GROUP BY cdgosupe, SUBSTRING(cdgocont,13,1) ORDER BY cdgosupe, SUBSTRING(cdgocont,13,1);"
        'If corresis(SQL) = False Then GoTo salida
        ''Calculando Moneda 1 para ctas 5,6
        'SQL = "INSERT INTO dbo.WWWMUC_Saldos "
        'SQL = SQL & " SELECT cdgosupe AS id_cuenta_muc, 1 AS id_moneda, SUM(saldofin) AS saldo, SUM(saldofin) AS saldoloc, '' AS cincidencia, '' AS xincidencia "
        'SQL = SQL & " FROM catalogonic WITH (NOLOCK) "
        'SQL = SQL & " WHERE tipocuen='2' AND saldofin<>0 AND cdgosupe IS NOT NULL AND "
        'SQL = SQL & " (SUBSTRING(cdgocont,1,1)='5' OR SUBSTRING(cdgocont,1,1)='6') "
        'SQL = SQL & " GROUP BY cdgosupe ORDER BY cdgosupe;"
        'If corresis(SQL) = False Then GoTo salida
        ''Calculando Moneda 3
        'SQL = "INSERT INTO dbo.WWWMUC_Saldos "
        'SQL = SQL & " SELECT cdgosupe AS id_cuenta_muc, SUBSTRING(cdgocont,13,1) AS id_moneda, SUM(saldofindol) AS saldo, SUM(round(saldofindol*" & ptasacambio & " ,2)) AS saldoloc, '' AS cincidencia, '' AS xincidencia "
        'SQL = SQL & " FROM catalogonic WITH (NOLOCK) WHERE tipocuen='2' AND saldofindol<>0 AND cdgosupe IS NOT NULL AND"
        'SQL = SQL & " SUBSTRING(cdgocont,13,1)='3' "
        'SQL = SQL & " AND (SUBSTRING(cdgocont,1,1)<>'5' AND SUBSTRING(cdgocont,1,1)<>'6') "
        'SQL = SQL & " GROUP BY cdgosupe, SUBSTRING(cdgocont,13,1) ORDER BY cdgosupe, SUBSTRING(cdgocont,13,1);"
        'If corresis(SQL) = False Then GoTo salida

        'Calculando la Cuenta PyG
        If Month(FechaSF) = 12 Then
            Dim sql2 As String = ""
            Dim msaldo As Decimal = 0
            SQL = "SELECT ("
            SQL = SQL & " ABS((SELECT abs(SUM(saldofin)) AS saldofin FROM catalogonic WITH (NOLOCK) WHERE tipocuen='2' AND saldofin<>0 AND cdgosupe IS NOT NULL AND SUBSTRING(cdgocont,1,1)='5')) - "
            SQL = SQL & " ABS((SELECT abs(SUM(saldofin)) AS saldofin FROM catalogonic WITH (NOLOCK) WHERE tipocuen='2' AND saldofin<>0 AND cdgosupe IS NOT NULL AND SUBSTRING(cdgocont,1,1)='6'))"
            SQL = SQL & " ) AS saldo "
            Using connection As New Data.SqlClient.SqlConnection(ConnectionStringSIS)
                Dim command As New Data.SqlClient.SqlCommand(SQL, connection)
                connection.Open()
                Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
                reader.Read()
                If reader.HasRows Then
                    msaldo = reader.Item("saldo")
                    If msaldo >= 0 Then
                        SQL = "INSERT INTO dbo.WWWMUC_Saldos "
                        'SQL = SQL & " SELECT '480100000' AS id_cuenta_muc, 1 AS id_moneda, convert(numeric(11,2), " & msaldo & ") * -1 AS saldo, convert(numeric(11,2)," & msaldo & ") * -1 AS saldoloc, '' AS cincidencia, '' AS xincidencia "
                        SQL = SQL & " SELECT '480100000' AS id_cuenta_muc, 1 AS id_moneda, convert(numeric(11,2), " & msaldo & ") * - 1 AS saldo, convert(numeric(11,2)," & msaldo & ") * -1 AS saldoloc, '' AS cincidencia, '' AS xincidencia "
                        sql2 = SQL
                        If corresis(SQL) = False Then GoTo salida
                        SQL = "INSERT INTO dbo.WWWMUC_Saldos "
                        'SQL = SQL & " SELECT '690000000' AS id_cuenta_muc, 1 AS id_moneda, convert(numeric(11,2)," & msaldo & ") AS saldo, convert(numeric(11,2)," & msaldo & ") AS saldoloc, '' AS cincidencia, '' AS xincidencia "
                        SQL = SQL & " SELECT '690000000' AS id_cuenta_muc, 1 AS id_moneda, convert(numeric(11,2)," & msaldo & ") AS saldo, convert(numeric(11,2)," & msaldo & ") AS saldoloc, '' AS cincidencia, '' AS xincidencia "
                        sql2 = SQL
                        If corresis(SQL) = False Then GoTo salida
                    Else
                        SQL = "INSERT INTO dbo.WWWMUC_Saldos "
                        SQL = SQL & " SELECT '480100000' AS id_cuenta_muc, 1 AS id_moneda, convert(numeric(11,2), " & msaldo & ") AS saldo, convert(numeric(11,2)," & msaldo & ") AS saldoloc, '' AS cincidencia, '' AS xincidencia "
                        sql2 = SQL
                        If corresis(SQL) = False Then GoTo salida
                        SQL = "INSERT INTO dbo.WWWMUC_Saldos "
                        SQL = SQL & " SELECT '690000000' AS id_cuenta_muc, 1 AS id_moneda, convert(numeric(11,2)," & msaldo & ") * - 1 AS saldo, convert(numeric(11,2)," & msaldo & ") * - 1 AS saldoloc, '' AS cincidencia, '' AS xincidencia "
                        sql2 = SQL
                        If corresis(SQL) = False Then GoTo salida
                    End If
                End If
            End Using
        End If

        'PQC para cuentas de Orden por Contra - SA
        If wcia = 5 Then
            SQL = "update dbo.WWWMUC_Saldos SET saldo= (SELECT SUM(saldo) FROM dbo.WWWMUC_Saldos WHERE SUBSTRING(id_cuenta_muc,1,1)='7' AND id_moneda=3) * -1 WHERE id_cuenta_muc = '810100000' AND id_moneda=3;"
            If corresis(SQL) = False Then GoTo salida
            SQL = "update dbo.WWWMUC_Saldos SET saldoloc= (SELECT SUM(saldoloc) FROM dbo.WWWMUC_Saldos WHERE SUBSTRING(id_cuenta_muc,1,1)='7' AND id_moneda=3) * -1 WHERE id_cuenta_muc = '810100000' AND id_moneda=3;"
            If corresis(SQL) = False Then GoTo salida
        End If

        'Calculando Moneda 4
        'SQL = "INSERT INTO dbo.WWWMUC_Saldos "
        'SQL = SQL & " SELECT id_cuenta_muc, 4 AS id_moneda, SUM(saldoloc) AS saldo, SUM(saldoloc) AS saldoloc, '' AS cincidencia, '' AS xincidencia "
        'SQL = SQL & " FROM dbo.WWWMUC_Saldos"
        'SQL = SQL & " GROUP BY id_cuenta_muc ORDER BY id_cuenta_muc;"
        'If corresis(SQL) = False Then GoTo salida
        SQL = "INSERT INTO dbo.WWWMUC_Saldos "
        SQL = SQL & " SELECT catalogonic.cdgosupe AS id_cuenta_muc, 4 AS id_moneda, SUM(saldofin) AS saldo, SUM(saldofin) AS saldoloc, '' AS cincidencia, '' AS xincidencia "
        SQL = SQL & " FROM dbo.catalogonic WHERE catalogonic.tipocuen='2' AND catalogonic.saldofin<>0 AND catalogonic.cdgosupe IS NOT NULL "
        SQL = SQL & " GROUP BY catalogonic.cdgosupe ORDER BY catalogonic.cdgosupe;"
        If corresis(SQL) = False Then GoTo salida

        'Calculando las cuentas padres
        '----------------------------------------------------------------------------------------
        EliTABLA_sis("dbo.WWWMUC_SaldosTMP1")
        SQL = "SELECT substring(id_cuenta_muc,1,1) + '00000000' AS id_cuenta_muc, id_moneda, Sum(saldo) AS saldo, Sum(saldoloc) AS saldoloc, '' AS cincidencia, '' AS xincidencia "
        SQL += " INTO dbo.WWWMUC_SaldosTMP1"
        SQL += " FROM dbo.WWWMUC_Saldos"
        SQL += " WHERE substring(id_cuenta_muc,1,1)='7' OR substring(id_cuenta_muc,1,1)='8'"
        SQL += " GROUP BY substring(id_cuenta_muc,1,1) + '00000000', id_moneda"
        SQL += " HAVING id_moneda='4';"
        If corresis(SQL) = False Then GoTo salida

        EliTABLA_sis("dbo.WWWMUC_SaldosTMP2")
        SQL = "SELECT substring(id_cuenta_muc,1,2) + '0000000' AS id_cuenta_muc, id_moneda, Sum(saldo) AS saldo, Sum(saldoloc) AS saldoloc, '' AS cincidencia, '' AS xincidencia "
        SQL += " INTO dbo.WWWMUC_SaldosTMP2"
        SQL += " FROM dbo.WWWMUC_Saldos"
        SQL += " GROUP BY substring(id_cuenta_muc,1,2) + '0000000', id_moneda"
        SQL += " HAVING id_moneda='4';"
        If corresis(SQL) = False Then GoTo salida

        EliTABLA_sis("dbo.WWWMUC_SaldosTMP4")
        SQL = "SELECT substring(id_cuenta_muc,1,4) + '00000' AS id_cuenta_muc, id_moneda, Sum(saldo) AS saldo, Sum(saldoloc) AS saldoloc, '' AS cincidencia, '' AS xincidencia "
        SQL += " INTO dbo.WWWMUC_SaldosTMP4"
        SQL += " FROM dbo.WWWMUC_Saldos"
        SQL += " GROUP BY substring(id_cuenta_muc,1,4) + '00000', id_moneda"
        SQL += " HAVING id_moneda='4';"
        If corresis(SQL) = False Then GoTo salida

        EliTABLA_sis("dbo.WWWMUC_SaldosTMP6")
        SQL = "SELECT substring(id_cuenta_muc,1,6) + '000' AS id_cuenta_muc, id_moneda, Sum(saldo) AS saldo, Sum(saldoloc) AS saldoloc, '' AS cincidencia, '' AS xincidencia "
        SQL += " INTO dbo.WWWMUC_SaldosTMP6"
        SQL += " FROM dbo.WWWMUC_Saldos"
        SQL += " GROUP BY substring(id_cuenta_muc,1,6) + '000', id_moneda"
        SQL += " HAVING id_moneda='4';"
        If corresis(SQL) = False Then GoTo salida

        SQL = "INSERT INTO dbo.WWWMUC_Saldos "
        SQL += " SELECT dbo.WWWMUC_SaldosTMP1.id_cuenta_muc, dbo.WWWMUC_SaldosTMP1.id_moneda, dbo.WWWMUC_SaldosTMP1.saldo, dbo.WWWMUC_SaldosTMP1.saldoloc, dbo.WWWMUC_SaldosTMP1.cincidencia, dbo.WWWMUC_SaldosTMP1.xincidencia "
        SQL += " FROM dbo.WWWMUC_SaldosTMP1 LEFT JOIN dbo.WWWMUC_Saldos ON dbo.WWWMUC_SaldosTMP1.id_cuenta_muc = dbo.WWWMUC_Saldos.id_cuenta_muc AND dbo.WWWMUC_SaldosTMP1.id_moneda = dbo.WWWMUC_Saldos.id_moneda "
        SQL += " WHERE dbo.WWWMUC_Saldos.id_cuenta_muc IS NULL AND dbo.WWWMUC_Saldos.id_moneda IS NULL"
        If corresis(SQL) = False Then GoTo salida

        SQL = "INSERT INTO dbo.WWWMUC_Saldos "
        SQL += " SELECT dbo.WWWMUC_SaldosTMP2.id_cuenta_muc, dbo.WWWMUC_SaldosTMP2.id_moneda, dbo.WWWMUC_SaldosTMP2.saldo, dbo.WWWMUC_SaldosTMP2.saldoloc, dbo.WWWMUC_SaldosTMP2.cincidencia, dbo.WWWMUC_SaldosTMP2.xincidencia "
        SQL += " FROM dbo.WWWMUC_SaldosTMP2 LEFT JOIN dbo.WWWMUC_Saldos ON dbo.WWWMUC_SaldosTMP2.id_cuenta_muc = dbo.WWWMUC_Saldos.id_cuenta_muc AND dbo.WWWMUC_SaldosTMP2.id_moneda = dbo.WWWMUC_Saldos.id_moneda "
        SQL += " WHERE dbo.WWWMUC_Saldos.id_cuenta_muc IS NULL AND dbo.WWWMUC_Saldos.id_moneda IS NULL"
        If corresis(SQL) = False Then GoTo salida

        SQL = "INSERT INTO dbo.WWWMUC_Saldos "
        SQL += " SELECT dbo.WWWMUC_SaldosTMP4.id_cuenta_muc, dbo.WWWMUC_SaldosTMP4.id_moneda, dbo.WWWMUC_SaldosTMP4.saldo, dbo.WWWMUC_SaldosTMP4.saldoloc, dbo.WWWMUC_SaldosTMP4.cincidencia, dbo.WWWMUC_SaldosTMP4.xincidencia "
        SQL += " FROM dbo.WWWMUC_SaldosTMP4 LEFT JOIN dbo.WWWMUC_Saldos ON dbo.WWWMUC_SaldosTMP4.id_cuenta_muc = dbo.WWWMUC_Saldos.id_cuenta_muc AND dbo.WWWMUC_SaldosTMP4.id_moneda = dbo.WWWMUC_Saldos.id_moneda "
        SQL += " WHERE dbo.WWWMUC_Saldos.id_cuenta_muc IS NULL AND dbo.WWWMUC_Saldos.id_moneda IS NULL"
        If corresis(SQL) = False Then GoTo salida

        SQL = "INSERT INTO dbo.WWWMUC_Saldos "
        SQL += " SELECT dbo.WWWMUC_SaldosTMP6.id_cuenta_muc, dbo.WWWMUC_SaldosTMP6.id_moneda, dbo.WWWMUC_SaldosTMP6.saldo, dbo.WWWMUC_SaldosTMP6.saldoloc, dbo.WWWMUC_SaldosTMP6.cincidencia, dbo.WWWMUC_SaldosTMP6.xincidencia "
        SQL += " FROM dbo.WWWMUC_SaldosTMP6 LEFT JOIN dbo.WWWMUC_Saldos ON dbo.WWWMUC_SaldosTMP6.id_cuenta_muc = dbo.WWWMUC_Saldos.id_cuenta_muc AND dbo.WWWMUC_SaldosTMP6.id_moneda = dbo.WWWMUC_Saldos.id_moneda "
        SQL += " WHERE dbo.WWWMUC_Saldos.id_cuenta_muc IS NULL AND dbo.WWWMUC_Saldos.id_moneda IS NULL"
        If corresis(SQL) = False Then GoTo salida

        EliTABLA_sis("dbo.WWWMUC_SaldosTMP1")
        EliTABLA_sis("dbo.WWWMUC_SaldosTMP2")
        EliTABLA_sis("dbo.WWWMUC_SaldosTMP4")
        EliTABLA_sis("dbo.WWWMUC_SaldosTMP6")
        '--------------------------------------------------------------------

        SQL = "UPDATE dbo.WWWMUC_Saldos SET saldo=saldo*-1 WHERE SUBSTRING(id_cuenta_muc,1,1)='2';"
        If corresis(SQL) = False Then GoTo salida
        SQL = "UPDATE dbo.WWWMUC_Saldos SET saldo=saldo*-1 WHERE SUBSTRING(id_cuenta_muc,1,1)='3';"
        If corresis(SQL) = False Then GoTo salida
        SQL = "UPDATE dbo.WWWMUC_Saldos SET saldo=saldo*-1 WHERE SUBSTRING(id_cuenta_muc,1,1)='4';"
        If corresis(SQL) = False Then GoTo salida
        SQL = "UPDATE dbo.WWWMUC_Saldos SET saldo=saldo*-1 WHERE SUBSTRING(id_cuenta_muc,1,1)='5';"
        If corresis(SQL) = False Then GoTo salida
        SQL = "UPDATE dbo.WWWMUC_Saldos SET saldo=saldo*-1 WHERE SUBSTRING(id_cuenta_muc,1,1)='8';"
        If corresis(SQL) = False Then GoTo salida

        Exit Function
salida:
        Messagebox.Show(Err.Description) ' & sql2)
        MUC_SaldosCreaTMP = False
    End Function



    Public Function MUC_SaldosCreaTXT(ByVal ruta As String) As Boolean
        On Error GoTo salida

        MUC_SaldosCreaTXT = True
        File.Delete(ruta)
        If Not File.Exists(ruta) Then
            File.AppendAllText(ruta, "", Encoding.Default)
        End If

        Dim Arch As New FileStream(ruta, FileMode.Create)
        Dim Esc As New StreamWriter(Arch, Encoding.Default)
        Dim linea As String

        Dim queryString As String = "SELECT * FROM dbo.WWWMUC_Saldos;"
        Using connection As New Data.SqlClient.SqlConnection(ConnectionStringSIS)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            While reader.Read
                linea = Chr(34) & reader.Item("id_cuenta_muc") & Chr(34) & "|" & reader.Item("id_moneda") & "|" & CDbl(reader.Item("saldo"))
                Esc.WriteLine(linea)
                Esc.Flush()
            End While
            Arch.Close()
        End Using
        EliTABLA_sis("dbo.WWWMUC_Saldos")
        Exit Function
salida:
        Arch.Close()
        MUC_SaldosCreaTXT = False
    End Function

    Public Function MUC_ValidaSaldos() As Boolean
        On Error GoTo salida
        Dim rsa As New ADODB.Recordset
        Dim SQL As String
        Dim xArchIncid As String = "WWWMUC_SaldosIncid"

        EliTABLA_sis("dbo." & xArchIncid)
        SQL = "CREATE TABLE [dbo].[" & xArchIncid & "]([id_cuenta_muc] [varchar](28) NOT NULL, [id_moneda] [smallint] NOT NULL, [cincidencia] [varchar](30) NOT NULL, CONSTRAINT [PK_" & xArchIncid & "] PRIMARY KEY CLUSTERED ([id_cuenta_muc] ASC, [id_moneda] ASC, [cincidencia] ASC) WITH (IGNORE_DUP_KEY = OFF) ON [PRIMARY]) ON [PRIMARY]"
        If corresis(SQL) = False Then GoTo salida

        '08.001.0001'
        SQL = "INSERT INTO dbo." & xArchIncid & " SELECT id_cuenta_muc, id_moneda, '08.001.0001' FROM dbo.WWWMUC_Saldos WHERE id_cuenta_muc IS NULL"
        If corresis(SQL) = False Then GoTo salida

        '08.001.0002'
        SQL = "INSERT INTO dbo." & xArchIncid & " SELECT id_cuenta_muc, id_moneda, '08.001.0002' FROM dbo.WWWMUC_Saldos WHERE id_moneda IS NULL"
        If corresis(SQL) = False Then GoTo salida

        '08.001.0003'
        SQL = "INSERT INTO dbo." & xArchIncid & " SELECT id_cuenta_muc, id_moneda, '08.001.0003' FROM dbo.WWWMUC_Saldos WHERE saldo IS NULL"
        If corresis(SQL) = False Then GoTo salida

        '08.001.0004' Mone Dupli
        EliTABLA_sis("dbo.WWWsaldos1")
        SQL = "SELECT id_cuenta_muc, id_moneda INTO dbo.WWWsaldos1 FROM dbo.WWWMUC_Saldos GROUP BY id_cuenta_muc, id_moneda HAVING (COUNT(id_moneda) > 1);"
        If corresis(SQL) = False Then GoTo salida
        SQL = "INSERT INTO " & xArchIncid & " SELECT id_cuenta_muc, id_moneda, '08.001.0004' AS cincidencia FROM dbo.WWWsaldos1"
        If corresis(SQL) = False Then GoTo salida
        EliTABLA_sis("dbo.WWWsaldos1")

        '08.001.0005'
        SQL = "INSERT INTO dbo." & xArchIncid & " SELECT id_cuenta_muc, id_moneda, '08.001.0005' FROM dbo.WWWMUC_Saldos LEFT JOIN dbo.catanic ON dbo.WWWMUC_Saldos.id_cuenta_muc = dbo.catanic.cdgosupe WHERE dbo.catanic.cdgosupe IS NULL"
        If corresis(SQL) = False Then GoTo salida

        '08.001.0006'
        SQL = "INSERT INTO dbo." & xArchIncid & " SELECT id_cuenta_muc, id_moneda, '08.001.0006' FROM dbo.WWWMUC_Saldos WHERE NOT (id_moneda BETWEEN 1 AND 4)"
        If corresis(SQL) = False Then GoTo salida

        'falta validacion 7

        'Validacion 1 = 2 + 3 + 4 '08.001.0008'
        SQL = "SELECT "
        SQL = SQL & " (SELECT SUM(saldofin) AS saldofin FROM dbo.catalogonic WHERE tipocuen='2' AND SUBSTRING(cdgocont,1,1)='1')"
        SQL = SQL & " -"
        SQL = SQL & " (SELECT SUM(saldofin) AS saldofin FROM dbo.catalogonic WHERE tipocuen='2' AND SUBSTRING(cdgocont,1,1)='2')"
        SQL = SQL & " -"
        SQL = SQL & " (SELECT SUM(saldofin) AS saldofin FROM dbo.catalogonic WHERE tipocuen='2' AND SUBSTRING(cdgocont,1,1)='3')"
        SQL = SQL & " -"
        SQL = SQL & " (SELECT SUM(saldofin) AS saldofin FROM dbo.catalogonic WHERE tipocuen='2' AND SUBSTRING(cdgocont,1,1)='4')"
        SQL = SQL & " AS SumaSALDO"
        rsa.Open(SQL, Oleconsis, ADODB.CursorTypeEnum.adOpenForwardOnly, ADODB.LockTypeEnum.adLockReadOnly)
        If Not rsa.EOF Then
            If CDbl(rsa.Fields("SumaSALDO").Value) <> 0 Then
                SQL = "INSERT INTO dbo." & xArchIncid & " SELECT TOP 1 id_cuenta_muc, 0, '08.001.0008' AS cincidencia FROM dbo.WWWMUC_Saldos"
                If corresis(SQL) = False Then GoTo salida
            End If
        Else
            SQL = "INSERT INTO dbo." & xArchIncid & " SELECT TOP 1 id_cuenta_muc, 0, '08.001.0008' AS cincidencia FROM dbo.WWWMUC_Saldos"
            If corresis(SQL) = False Then GoTo salida
        End If
        rsa.Close()

        'Dim mUTL As Decimal = 0
        'SQL = "SELECT "
        'SQL = SQL & " (SELECT SUM(saldofin) AS saldofin FROM dbo.catalogonic WHERE tipocuen='2' AND SUBSTRING(cdgocont,1,1)='5')"
        'SQL = SQL & " -"
        'SQL = SQL & " (SELECT SUM(saldofin) AS saldofin FROM dbo.catalogonic WHERE tipocuen='2' AND SUBSTRING(cdgocont,1,1)='6')"
        'SQL = SQL & " AS SumaSALDO"
        'rsa.Open(SQL, Oleconsis, ADODB.CursorTypeEnum.adOpenForwardOnly, ADODB.LockTypeEnum.adLockReadOnly)
        'If Not rsa.EOF Then
        '    mUTL = rsa.Fields("SumaSALDO").Value
        'End If
        'rsa.Close()
        'If mUTL > 0 Then '08.001.0009'
        '    SQL = "SELECT ISNULL(SUM(saldofin),0) AS saldofin FROM dbo.catalogonic WHERE tipocuen='2' AND cdgocont like '4701%'"
        '    rsa.Open(SQL, Oleconsis, ADODB.CursorTypeEnum.adOpenForwardOnly, ADODB.LockTypeEnum.adLockReadOnly)
        '    If Math.Abs(mUTL) <> Math.Abs(rsa.Fields("saldofin").Value) Then
        '        SQL = "INSERT INTO dbo." & xArchIncid & " SELECT TOP 1 id_cuenta_muc, 0, '08.001.0009' AS cincidencia FROM dbo.WWWMUC_Saldos"
        '        If corresis(SQL) = False Then GoTo salida
        '    End If
        'Else '08.001.00013'
        '    SQL = "SELECT ISNULL(SUM(saldofin),0) AS saldofin FROM dbo.catalogonic WHERE tipocuen='2' AND cdgocont like '4702%'"
        '    rsa.Open(SQL, Oleconsis, ADODB.CursorTypeEnum.adOpenForwardOnly, ADODB.LockTypeEnum.adLockReadOnly)
        '    If Math.Abs(mUTL) <> Math.Abs(rsa.Fields("saldofin").Value) Then
        '        SQL = "INSERT INTO dbo." & xArchIncid & " SELECT TOP 1 id_cuenta_muc, 0, '08.001.00013' AS cincidencia FROM dbo.WWWMUC_Saldos"
        '        If corresis(SQL) = False Then GoTo salida
        '    End If
        'End If
        'rsa.Close()

        '08.001.00010'
        Dim ptasacambio As Double
        Dim FechaCierre As Date, FechaSI As Date, FechaSF As Date
        DameFCierre(FechaCierre, FechaSI, FechaSF)
        ptasacambio = asi.Damecambio(2, FechaSF, licencia)
        SQL = "SELECT "
        SQL = SQL & " (SELECT sum(saldo) FROM dbo.WWWMUC_Saldos WHERE id_moneda='1')"
        SQL = SQL & " +"
        SQL = SQL & " (SELECT sum(saldo) FROM dbo.WWWMUC_Saldos WHERE id_moneda='2')"
        SQL = SQL & " +"
        SQL = SQL & " (SELECT round(sum(saldo)*" & ptasacambio & ",2) FROM dbo.WWWMUC_Saldos WHERE id_moneda='3')"
        SQL = SQL & " -"
        SQL = SQL & " (SELECT sum(saldo) FROM dbo.WWWMUC_Saldos WHERE id_moneda='4')"
        SQL = SQL & " AS SumaSALDO"
        rsa.Open(SQL, Oleconsis, ADODB.CursorTypeEnum.adOpenForwardOnly, ADODB.LockTypeEnum.adLockReadOnly)
        If Not rsa.EOF Then
            If CDbl(rsa.Fields("SumaSALDO").Value) <> 0 Then
                SQL = "INSERT INTO dbo." & xArchIncid & " SELECT TOP 1 id_cuenta_muc, 0, '08.001.00010' AS cincidencia FROM dbo.WWWMUC_Saldos"
                If corresis(SQL) = False Then GoTo salida
            End If
        Else
            SQL = "INSERT INTO dbo." & xArchIncid & " SELECT TOP 1 id_cuenta_muc, 0, '08.001.00010' AS cincidencia FROM dbo.WWWMUC_Saldos"
            If corresis(SQL) = False Then GoTo salida
        End If
        rsa.Close()

        '08.001.00011'
        SQL = "SELECT "
        SQL = SQL & " (SELECT sum(saldoloc) FROM dbo.WWWMUC_Saldos WHERE id_moneda='1')"
        SQL = SQL & " +"
        SQL = SQL & " (SELECT sum(saldoloc) FROM dbo.WWWMUC_Saldos WHERE id_moneda='2')"
        SQL = SQL & " +"
        SQL = SQL & " (SELECT sum(saldoloc) FROM dbo.WWWMUC_Saldos WHERE id_moneda='3')"
        SQL = SQL & " -"
        SQL = SQL & " (SELECT sum(saldoloc) FROM dbo.WWWMUC_Saldos WHERE id_moneda='4')"
        SQL = SQL & " AS SumaSALDO"
        rsa.Open(SQL, Oleconsis, ADODB.CursorTypeEnum.adOpenForwardOnly, ADODB.LockTypeEnum.adLockReadOnly)
        If Not rsa.EOF Then
            If CDbl(rsa.Fields("SumaSALDO").Value) <> 0 Then
                SQL = "INSERT INTO dbo." & xArchIncid & " SELECT TOP 1 id_cuenta_muc, 0, '08.001.00011' AS cincidencia FROM dbo.WWWMUC_Saldos"
                If corresis(SQL) = False Then GoTo salida
            End If
        Else
            SQL = "INSERT INTO dbo." & xArchIncid & " SELECT TOP 1 id_cuenta_muc, 0, '08.001.00011' AS cincidencia FROM dbo.WWWMUC_Saldos"
            If corresis(SQL) = False Then GoTo salida
        End If
        rsa.Close()

        '08.001.00012'
        'Cuenta q no debe aceptar movimientos

        MUC_ValidaSaldos = True
        rsa = Nothing
        Exit Function
salida:
        rsa = Nothing
        MUC_ValidaSaldos = False
    End Function

    ''' <summary>
    ''' Carga la pagina "FReportesPDF" y le envia como parametros el nombre y la formula de seleccion del
    ''' reporte de Crystal a cargar en formato PDF. Tambien se puede definir otro formato de exportacion
    ''' como WORD o EXCEL a travez del parametro "Formato".
    ''' NOTA: si el formato no es PDF, se hara un download del archivo.
    ''' </summary>
    ''' <param name="NombRep">Nombre del reporte de crystal a exportar. (Sin la extension ".rpt")</param>
    ''' <param name="Filtro">Formula de seleccion del reporte.</param>
    ''' <param name="Formato">Formato de destino de la exportacion.</param>
    ''' <remarks></remarks>
    Public Sub CargarFReportesPDF(ByVal NombRep As String, ByVal Filtro As String, Optional ByVal Formato As Short = 0)
        '0 PDF por defecto, 1 = WORD, 2 = EXCEL
        Try
            If String.IsNullOrEmpty(NombRep) = True Then
                Throw New System.ArgumentNullException("El valor del parametro 'NombRep' no puede ser nulo.")
            End If

            If Formato = 0 Or Formato = 1 Or Formato = 2 Then
                My.Response.Redirect("FReportesPDF.aspx?NombRep=" & NombRep & "&Filtro=" & Filtro & "&Formato=" & Formato, False)
            Else
                Throw New System.ArgumentException("El valor '" & Formato & "' del parametro 'Formato' no es correcto.")
            End If

        Catch ex As Exception
            System.Windows.Forms.MessageBox.Show(ex.Message, ex.GetType.Name, Windows.Forms.MessageBoxButtons.OK, Windows.Forms.MessageBoxIcon.Error, Windows.Forms.MessageBoxDefaultButton.Button1, Windows.Forms.MessageBoxOptions.DefaultDesktopOnly)
        End Try
    End Sub


    Public Function ImprimirReportePDF(ByVal NombRep As String, ByVal Filtro As String) As Boolean
        Try
            Dim Dir As String
            Dir = My.Request.MapPath(cws(11) & NombRep & ".rpt")

            Dim Report As New CrystalDecisions.CrystalReports.Engine.ReportDocument
            Report.Load(Dir)
            SetDBLogonForReportSIS(Report)
            Report.DataDefinition.RecordSelectionFormula = Filtro

            Dim RptStream As New System.IO.MemoryStream
            RptStream = Report.ExportToStream(CrystalDecisions.Shared.ExportFormatType.PortableDocFormat)

            'Limpia el buffer
            My.Response.Clear()
            My.Response.Buffer = True
            'Establece el tipo de documento
            My.Response.ContentType = "application/pdf"

            'Escribe el contenido del stream
            My.Response.BinaryWrite(RptStream.ToArray)
            My.Response.End()

        Catch ex As Threading.ThreadAbortException
            Err.Clear()
            Return True
        Catch ex As Exception
            Messagebox.Show(ex.Message)
            Return False
        End Try
    End Function

    Public Sub soli_Manuales_Adsolimasicon(ByVal numesoli As Double)
        '---------------------------------------------------------------------------------------
        ' Procedimiento : soli_Manuales_Adsolimasicon
        ' Uso           : Contabilidad - Cheques
        ' Fecha         : 12/01/2008
        ' Autor         : Gustavo
        ' Proposito     : Adiciona el registro principal de asiento contable (dsoli_masicon)
        '                 en las solicitudes manuales
        ' Variables del Entorno:
        '               Entrada: No. Solicitud
        '               Salida:  True/False
        '---------------------------------------------------------------------------------------
        ' Bitacora de Modificaciones:
        ' 
        '---------------------------------------------------------------------------------------
        Dim SQL As String
        Dim soli As New ADODB.Recordset

        SQL = "SELECT * FROM dsoli_masicon WHERE numesoli=" & numesoli
        soli.Open(SQL, Oleconsis, ADODB.CursorTypeEnum.adOpenForwardOnly, ADODB.LockTypeEnum.adLockReadOnly)
        If Not soli.EOF Then GoTo salida

        SQL = "SELECT * FROM dsolicit WHERE numesoli=" & numesoli
        If soli.State = 1 Then soli.Close()
        soli.Open(SQL, Oleconsis, ADODB.CursorTypeEnum.adOpenForwardOnly, ADODB.LockTypeEnum.adLockReadOnly)
        If soli.EOF Then GoTo salida

        SQL = "insert into dsoli_masicon (numeames,numecomp,fechcomp,desccomp,"
        SQL = SQL & " mntodebe, mntohabe, "
        SQL = SQL & " numereci,statcomp,ultiline,cdgotran,centcost,tipooper,"
        SQL = SQL & " mntodebedol,mntohabedol,cdgomone,fcontab,stataudit,numcontab,"
        SQL = SQL & " tipocompro,fingreso,cusuario,ccategoria,cusuarioauto,ccategoriaauto,"
        SQL = SQL & " fultmod,cusuariomod,ccategoriamod,numecaja,numecert,numesoli,numeamessol) "
        SQL = SQL & " select " & Year(Today.Date) * 100 + Month(Today.Date) & ",0,'" & Format(Today.Date, "dd/MM/yyyy") & "','',"
        SQL = SQL & "0,0,"
        SQL = SQL & "0,'I'," ' statcomp
        SQL = SQL & "0," 'ultiline
        SQL = SQL & soli.Fields("cdgotran").Value & "," 'cdgotran
        SQL = SQL & soli.Fields("centcost").Value & "," 'centcost
        SQL = SQL & "'A'," ' tipooper
        SQL = SQL & "0,0," 'dbdol, hbdol

        SQL = SQL & asi.DameMonedai(soli.Fields("cmoneda").Value, licencia) & "," 'cdgomone

        SQL = SQL & "Null,'N',1,Null,'" 'fcontab, stataudi, nuncontab, tipocompro
        SQL = SQL & Format(Now, "dd/MM/yyyy hh:mm:ss") + "'," ' fingreso
        SQL = SQL & Numero & ",10,Null,Null,'" 'cusuario, ccategoria, cusuarioauto, ccategoriauto
        SQL = SQL & Format(Now, "dd/MM/yyyy hh:mm:ss") + "'," 'fultmod
        SQL = SQL & Numero & ",0," 'cusuariomod, ccategoriamod, upsize no esta
        SQL = SQL & "Null," 'numecaja
        SQL = SQL & "Null," 'numecert
        SQL = SQL & numesoli & "," 'numesoli
        SQL = SQL & soli.Fields("numeamessol").Value 'numeamesoli
        If corresis(SQL) = False Then
            Messagebox.Show("Fallo la adicion del comprobante")
        End If
        soli.Close()
        soli = Nothing
        Exit Sub
salida:
        soli.Close()
        soli = Nothing
    End Sub
    Public Function soli_AdicionaSOLI(ByVal Numero As Double, ByVal xcasegurado As Double) As Double
        On Error GoTo salida
        Dim sql As String
        Dim xNumeamesSol As Double
        Dim xNumesoliNVA As Double
        Dim xCdgotran As Double '= 999999
        Dim xCsucur As Double = 0
        Dim wConcepto As String = ""

        If wcia = 5 Then
            xCdgotran = 483
        Else
            xCdgotran = 999999
        End If

        xNumeamesSol = Now.Year.ToString & Format(Now, "MM").ToString
        xNumesoliNVA = asi.DameNuevoCONTA("TESORERIA", licencia)

        sql = "insert into dsolicit values("
        sql += xNumeamesSol & "  ,"
        sql += xNumesoliNVA & "  ,"
        sql += "'!'  ,"
        sql += Numero & "  ,"
        sql += "'" & tec.DameCid("select cid from maentes where cci_rif=" & xcasegurado, "cid", True, licencia) & "'  ,"
        sql += xcasegurado & "  ,"
        sql += "'" & tec.DameNombreCli(CDbl(xcasegurado), licencia) & "'  ,"
        sql += "'" & tec.DameNombreCli(CDbl(xcasegurado), licencia) & "'  ,"

        'cdgotran,tipo_mov,csucur,concepto,fechsoli,fechlimi
        sql += xCdgotran & "  ,"
        sql += "'CK'  ,"
        sql += xCsucur & "  ,"
        sql += "'" & wConcepto & "'  ,"
        sql += "'" & Format(Today.Date, "dd/MM/yyyy") & "'  ,"
        sql += "'" & Format(Today.Date, "dd/MM/yyyy") & "'  ,"

        'fechapro,fechimpr,fechanul,canula,stattran,fechvigen,statsoli,statimpr,mnto_pago
        sql += "null  , null  , null  ,"
        sql += "0 , '1'  ,"
        sql += "'" & Format(Today.Date, "dd/MM/yyyy") & "'  ,"
        sql += "'P'  , 'P'  ,"
        sql += "0  ,"

        'mnto_ret,mnto_ret1,mnto_imp,mnto_ded,mnto_cheque,cmoneda,ptasamon
        sql += "0  ,"
        sql += "0  ,"
        sql += "0  ,"
        sql += "0  ,"
        sql += "0  ,"
        sql += "'" & cws(19) & "'  ,"
        sql += asi.Damecambio(2, Today.Date, licencia) & "  ,"


        'centcost
        sql += "0  ,"
        'sql += tec.DameCid("SELECT ISNULL((SELECT cdgocent FROM seentesusu WHERE cci_rif=" & Numero & "),0) AS cdgocent", "cdgocent", True, licencia, Oleconsis) & "  ,"


        'cramo,crecibo,cnpoliza,numesini,csinies,cdisprod,caprueba1,cbancia
        'cestaapro1,fechaapro1,caprueba2,cestaapro2,fechaapro2,capruebate,cestaaprote,fechaaprote
        'ccuentaban,numecheq,numetrans,numedoc,numeimprs,cforimpr,xobserva,fingreso
        sql += "0  ,"
        sql += "0  ,"
        sql += "''  ,"
        sql += "0  ,"
        sql += "1  ,"
        sql += "0  ,"
        sql += "0  ,"

        If wcia = 5 Then 'cbancia
            sql += "5  ,"
        ElseIf wcia = 2 Then 'cbancia
            sql += "1  ,"
        Else
            sql += "0  ,"
        End If

        sql += "'P'  , null  ,"
        sql += "0  , 'P'  , null  ,"
        sql += "0  , 'P'  , null  ,"
        sql += "0  ,"
        sql += "null  , 0  , null  , null  ,"
        sql += "null  , null  ,"
        sql += "'" & Format(Now, "dd/MM/yyyy hh:mm:ss") & "'  ,"

        'cpais_des,cciudad_des,cbanco_des,cagenban_des,xcuentabanc_des,itipocta_des
        'iestatconta,numeames,numecomp,mfueradepre,capruebafp,cestaaprofp,fechaaprofp
        'im_cheque,im_solicitud,statanul
        If wcia = 5 Then
            sql += "null  , null  , " & 39380 & " , " & 39380 & " ,"
        ElseIf wcia = 2 Then
            sql += "null  , null  , " & 37 & " , " & 37 & " ,"
        Else
            sql += "null  , null  , Null , null  ,"
        End If

        sql += "null  , null  , null  ,"
        sql += "null  , null  , null  ,"
        sql += "null  , null  , null  ,"
        sql += "null  , null  , null  ,"

        'ifuente,tipo_emisoli,tipo_reg
        'centregado,ientregado,fentregado
        'icobrado,fcobrado,
        'cdgotranDedu, cdgotranRete, cdgotranRete1, 
        'cusuario, ccategoria
        'cusuarioauto,ccategoriaauto,fultmod,cusuariomod,ccategoriamod
        sql += "'SIS_NET'  , '0'  , 'D'  ,"
        sql += "null  , null  , null  ,"
        sql += "null  , null  ,"
        sql += "999999  ,"
        sql += "999999  ,"
        sql += "999999  ,"
        sql += Numero & "  ,"
        sql += "0  ,"
        sql += "0  ,"
        sql += "0  ,"
        sql += "'" & Format(Now, "dd/MM/yyyy hh:mm:ss") & "'  ,"
        sql += Numero & "  ,"
        sql += "0 "

        If wcia = 2 Then
            sql += ",0, 0 " 'cnit,numerdoc
        End If

        sql += ")"
        If corresis(sql) = False Then
            soli_AdicionaSOLI = 0
        Else
            soli_AdicionaSOLI = xNumesoliNVA
        End If
        Exit Function
salida:
        soli_AdicionaSOLI = 0
    End Function
    Public Function soli_AnulaCheque(ByVal usu As Double, ByVal numesoli As Double, ByVal xError As String) As Boolean
        '---------------------------------------------------------------------------------------
        ' Procedimiento : soli_AnulaCheque
        ' Uso           : Contabilidad - Cheques
        ' Fecha         : 12/01/2008
        ' Autor         : Gustavo
        ' Proposito     : Anula un cheque impreso
        '                 Coloca en cero el asiento contable y actualiza el estado de la solicitud
        ' Variables del Entorno:
        '               Entrada: Ente del usuario, No. Solicitud, Descripcion de Error (parametro x referencia)
        '               Salida:  True/False
        '---------------------------------------------------------------------------------------
        ' Bitacora de Modificaciones:
        ' 
        '---------------------------------------------------------------------------------------
        On Error GoTo salida
        xError = ""
        soli_AnulaCheque = True

        'Anula cheque impreso
        Dim SQL As String = ""
        'Dim TEC As New Asidllcon00.TEC
        Dim numeames As Integer
        Dim numecomp As Double

        SQL = "SELECT ISNULL((SELECT numeames FROM masicon WHERE numesoli=" & numesoli & "), 0) AS numeames"
        numeames = tec.DameCid(SQL, "numeames", True, licencia, Oleconsis)
        If numeames = 0 Then
            xError = "No se pudo encontrar el asiento contable correspondiente a este cheque"
            GoTo salida
        End If
        If asi.MCerrado(numeames, licencia) = True Then
            xError = "El mes del cheque que desea anular ya se encuentra cerrado definitivamente"
            GoTo salida
        End If

        SQL = "SELECT ISNULL((SELECT numeames FROM dsolicit WHERE numesoli=" & numesoli & "), 0) AS numeames"
        numeames = tec.DameCid(SQL, "numeames", True, licencia, Oleconsis)
        SQL = "SELECT ISNULL((SELECT numecomp FROM dsolicit WHERE numesoli=" & numesoli & "), 0) AS numecomp"
        numecomp = tec.DameCid(SQL, "numecomp", True, licencia, Oleconsis)

        SQL = "SELECT ABS(bsiniestros) AS bsiniestros FROM MAUTOCAJA_NET WHERE NASIPRE IN (SELECT cdgotran FROM dsolicit WHERE numesoli=" & numesoli & ")"
        If tec.DameCid(SQL, "bsiniestros", True, licencia, Oleconsis) = 1 Then
            xError = "Esta solicitud proviene de reclamos, no se puede anular el cheque"
            GoTo salida
        End If
        SQL = "SELECT ABS(bsiniestrosgas) AS bsiniestrosgas FROM MAUTOCAJA_NET WHERE NASIPRE IN (SELECT cdgotran FROM dsolicit WHERE numesoli=" & numesoli & ")"
        If tec.DameCid(SQL, "bsiniestrosgas", True, licencia, Oleconsis) = 1 Then
            xError = "Esta solicitud proviene de reclamos, no se puede anular el cheque"
            GoTo salida
        End If
        SQL = "UPDATE masicon SET desccomp = 'Anulado * ' + substring(masicon.desccomp, 1, 110), mntodebe = 0, mntohabe = 0, mntodebedol = 0, mntohabedol = 0"
        SQL += " WHERE numesoli = " & numesoli & " And numeames = " & numeames & " And numecomp = " & numecomp
        If corresis(SQL) = False Then
            xError = "No se pudo actualizar asiento contable"
            GoTo salida
        End If
        SQL = "UPDATE dasicon SET concepto= 'Anulado * ' + substring([dasicon].[concepto],1,80), mntodebe = 0, mntohabe = 0, mntodebedol = 0, mntohabedol = 0 WHERE numeames = " & numeames & " and numecomp= " & numecomp
        If corresis(SQL) = False Then
            xError = "No se pudo actualizar asiento contable"
            GoTo salida
        End If

        SQL = "UPDATE dbancia SET cheqanul = cheqanul + 1 WHERE cbancia IN (SELECT cbancia FROM dsolicit WHERE numesoli=" & numesoli & ")"
        If corresis(SQL) = False Then
            xError = "El chque fue anulado, pero no se puedo actualizar el contador de cheques anulados"
            GoTo salida
        End If

        SQL = "UPDATE dsolicit SET fechanul=getdate(), canula=" & usu & ", statanul='S' WHERE numesoli=" & numesoli
        If corresis(SQL) = False Then
            xError = "No se pudo actualizar la solicitud"
            GoTo salida
        End If
        Exit Function
salida:
        soli_AnulaCheque = False
        Messagebox.Show(xError)
    End Function

    Public Function soli_EsFusion(ByVal nsoli) As Boolean
        Dim sql As String
        Dim rsa As New ADODB.Recordset
        sql = "select * from usolicit where nuevonro=" & nsoli
        rsa.Open(sql, Oleconsis, ADODB.CursorTypeEnum.adOpenForwardOnly, ADODB.LockTypeEnum.adLockReadOnly)
        If rsa.EOF Then
            soli_EsFusion = False
        Else
            soli_EsFusion = True
        End If
        rsa.Close()
        rsa = Nothing
    End Function


    Public Function soli_AnulaSoli(ByVal usu As Double, ByVal numesoli As Double, ByVal xError As String) As Boolean
        '---------------------------------------------------------------------------------------
        ' Procedimiento : soli_AnulaSoli
        ' Uso           : Contabilidad - Cheques
        ' Fecha         : 12/01/2008
        ' Autor         : Gustavo
        ' Proposito     : Anula una solicitud de pago no impresa (sin cheque)
        ' Variables del Entorno:
        '               Entrada: Ente del usuario, No. Solicitud, Descripcion de Error (parametro x referencia)
        '               Salida:  True/False
        '---------------------------------------------------------------------------------------
        ' Bitacora de Modificaciones:
        ' 
        '---------------------------------------------------------------------------------------
        On Error GoTo salida
        xError = ""
        soli_AnulaSoli = True

        'Anula solicitudes de siniestros con pagos no mayorizados
        'Dim TEC As New Asidllcon00.TEC
        Dim soli As New ADODB.Recordset
        Dim SQL As String

        SQL = "SELECT numesoli,cdgotran FROM dsolicit WHERE numesoli=" & numesoli
        soli.Open(SQL, Oleconsis, ADODB.CursorTypeEnum.adOpenForwardOnly, ADODB.LockTypeEnum.adLockReadOnly)
        If soli.EOF Then
            xError = "No se encontró la solicitud correspondiente"
            GoTo salida
        End If

        If tec.DameCid("SELECT ABS(bsiniestros) AS bsiniestros FROM MAUTOCAJA_NET WHERE NASIPRE=" & tec.NZ(soli.Fields("cdgotran").Value, 0), "bsiniestros", "true", licencia, Oleconsis) = 1 And CDbl(soli.Fields("cdgotran").Value) <> 999999 Then
            xError = "Las solicitudes que provienen de reclamo no pueden ser anuladas por esta vía"
            GoTo salida
        ElseIf tec.DameCid("SELECT ABS(bsiniestrosgas) AS bsiniestrosgas FROM MAUTOCAJA_NET WHERE NASIPRE=" & tec.NZ(soli.Fields("cdgotran").Value, 0), "bsiniestrosgas", "true", licencia, Oleconsis) = 1 And CDbl(soli.Fields("cdgotran").Value) <> 999999 Then
            xError = "Las solicitudes que provienen de reclamo no pueden ser anuladas por esta vía"
            GoTo salida

        Else 'Si no es de reclamo
            SQL = "UPDATE dsolicit SET statsoli='B', fechanul=getdate(), cusuariomod=" & usu & ", fultmod=getdate() WHERE numesoli=" & numesoli
            If corresis(SQL) = False Then
                xError = "No se puedo realizar la operación de actualización"
                GoTo salida
            End If
        End If
        If soli.State = 1 Then soli.Close()
        soli = Nothing
        Exit Function
salida:
        soli_AnulaSoli = False
        If soli.State = 1 Then soli.Close()
        soli = Nothing
        xError = xError & " " & Err.Description
    End Function

    Public Function RevisaCuadreCompSOLI(ByVal wnumesoli As Integer, ByVal licencia As String, Optional ByRef wxMensaje As String = "") As Boolean
        '---------------------------------------------------------------------------------------
        ' Procedimiento : RevisaCuadreCompSOLI
        ' Uso           : Revisión de cuadre de comprobantes antes de imprimir cheques
        ' Fecha         : 05/01/08
        ' Autor         : MaxTeen
        ' Proposito     : Avisar cuando un comprobante va descuadrado antes de imprimir el cheque. Esto es por los comprobantes manuales
        ' 
        ' Variables del Entorno:
        '               Entrada:
        '               Salida:
        '---------------------------------------------------------------------------------------
        ' Bitacora de Modificaciones:
        '           Mier 09.01.2008 - Pongo comilla simpre entre la cuenta de filtro ya q me falla
        ' 
        '---------------------------------------------------------------------------------------
        'If wini = False Then conexiones(licencia)
        RevisaCuadreCompSOLI = True
        Dim wMontoSoliCheque As Double
        Dim wMontoBAN_CORD As Double
        Dim wMontoBAN_DOL As Double
        Dim wcbancia As Integer
        Dim wCodigocont As String
        Dim wmoneda As String
        Dim queryString As String

        queryString = "select numesoli, cmoneda, isnull(cbancia,0) as cbancia, isnull(mnto_cheque,0) as mnto_cheque from dbo.dsolicit WHERE numesoli=" & wnumesoli
        wMontoSoliCheque = tec.DameCid(queryString, "mnto_cheque", True, licencia, Oleconsis)
        wmoneda = tec.DameCid(queryString, "cmoneda", True, licencia, Oleconsis)
        wcbancia = tec.DameCid(queryString, "cbancia", True, licencia, Oleconsis)
        queryString = "select cdgocont from dbo.dbancia where cbancia=" & wcbancia
        wCodigocont = tec.DameCid(queryString, "cdgocont", True, licencia, Oleconsis)

        queryString = "select ISNULL(sum(mntohabe-mntodebe),0) as Monto_Cord, ISNULL(sum(mntohabedol-mntodebedol),0) as Monto_Dol from dbo.dsoli_dasicon where numesoli=" & wnumesoli & " and cdgocontnic='" & wCodigocont & "'"
        wMontoBAN_CORD = Val(tec.DameCid(queryString, "Monto_Cord", True, licencia, Oleconsis))
        wMontoBAN_DOL = Val(tec.DameCid(queryString, "Monto_Dol", True, licencia, Oleconsis))

        queryString = " SELECT TOP 1 isnull(numesoli,0) as numesoli FROM dbo.dsoli_dasicon "
        queryString = queryString & " LEFT OUTER JOIN dbo.catalogonic "
        queryString = queryString & " ON dbo.dsoli_dasicon.cdgocontnic=dbo.catalogonic.cdgocont "
        queryString = queryString & " WHERE dbo.dsoli_dasicon.numesoli = " & wnumesoli & " And dbo.catalogonic.cdgocont Is null"

        If Val(tec.DameCid(queryString, "numesoli", True, licencia, Oleconsis)) <> 0 Then
            RevisaCuadreCompSOLI = False
            wxMensaje = "El comprobante de la solicitud: " & wnumesoli & " tiene cuentas que no existen en el catálogo"
            Exit Function
        End If

        If wmoneda = cws(15) Then ' Moneda Local
            If wMontoSoliCheque <> wMontoBAN_CORD Then
                RevisaCuadreCompSOLI = False
            End If
        Else
            If wMontoSoliCheque <> wMontoBAN_DOL Then
                RevisaCuadreCompSOLI = False
            End If
        End If
        If RevisaCuadreCompSOLI = False Then
            wxMensaje = "El Monto del cheque en la solicitud: " & wnumesoli & " no cuadra con la línea del banco en el comprobante"
            Exit Function
        End If

        RevisaCuadreCompSOLI = False
        queryString = "select sum(mntodebe) as mntodebe, sum(mntohabe) as mntohabe, sum(mntodebedol) as mntodebedol, sum(mntohabedol) as mntohabedol  from dsoli_dasicon where numesoli =" & wnumesoli
        Using connection As New Data.SqlClient.SqlConnection(ConnectionStringSIS)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            If reader.HasRows = True Then
                If IsDBNull(reader.Item("mntodebe")) = True Or IsDBNull(reader.Item("mntohabe")) Or IsDBNull(reader.Item("mntodebedol")) Or IsDBNull(reader.Item("mntohabedol")) Then
                    wxMensaje = "El comprobante de la solicitud: " & wnumesoli & " no tiene líneas o en alguna de ellas falta introducir datos"
                    RevisaCuadreCompSOLI = False
                ElseIf (reader.Item("mntodebe") <> reader.Item("mntohabe")) Or (reader.Item("mntodebedol") <> reader.Item("mntohabedol")) Then
                    wxMensaje = "El comprobante de la solicitud: " & wnumesoli & " está descuadrado"
                    RevisaCuadreCompSOLI = False
                Else
                    RevisaCuadreCompSOLI = True
                End If
            Else
                wxMensaje = "Faltan las partidas contables de la solicitud: " & wnumesoli
                RevisaCuadreCompSOLI = False
            End If
        End Using
    End Function

    Public Function EsTranPLANTILLA(ByVal wauto As Double) As Boolean
        '---------------------------------------------------------------------------------------
        ' Procedimiento : EsTranPLANTILLA
        ' Uso           : Contabilidad - Cheques
        ' Fecha         : 12/01/2008
        ' Autor         : Gustavo
        ' Proposito     : Determina si una transaccion es de peticion de datos para generar una plantilla
        ' Variables del Entorno:
        '               Entrada: Transaccion
        '               Salida:  True/False
        '---------------------------------------------------------------------------------------
        ' Bitacora de Modificaciones:
        ' 
        '---------------------------------------------------------------------------------------
        EsTranPLANTILLA = False
        Dim i As Integer, xcampoVAR As String
        Dim SQL As String
        SQL = "SELECT * FROM MAUTOCAJA_NET WHERE NASIPRE=" & wauto
        Using connection As New Data.SqlClient.SqlConnection(ConnectionStringSIS)
            Dim command As New Data.SqlClient.SqlCommand(SQL, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            If reader.HasRows Then
                For i = 1 To 30
                    xcampoVAR = "can" & i
                    If InStr(reader.Item(xcampoVAR).ToString.TrimEnd, "¿") > 0 Then
                        EsTranPLANTILLA = True
                    End If
                Next
            End If
        End Using
    End Function



    Public Function DameCadenaSinCaracter(ByVal Cdna As String, ByVal Caracter As String) As String
        '---------------------------------------------------------------------------------------
        ' Procedimiento : EliminaCaracter
        ' Uso           : General
        ' Fecha         : 05/01/08
        ' Autor         : MaxTeen
        ' Proposito     : Permite elimnar un caracter de cualquier cadena. Ej: Apóstrofes, Amperson, Comillas, etc
        ' 
        ' Variables del Entorno:
        '               Entrada:
        '               Salida:
        '---------------------------------------------------------------------------------------
        ' Bitacora de Modificaciones:
        ' 
        ' 
        '---------------------------------------------------------------------------------------
        Dim l%, n%, final$
        n = 0
        l = Len(Cdna)
        final = ""
        For n = 1 To l
            If Mid(Cdna, n, 1) <> Caracter Then final = final & Mid(Cdna, n, 1)
        Next n
        DameCadenaSinCaracter = final
    End Function


    Public Function EsChequera99999(ByVal wNumeSoli As Double, Optional ByRef wxMensaje As String = "") As Boolean
        '---------------------------------------------------------------------------------------
        ' Procedimiento : EsChequera99999
        ' Uso           : Impresión de cheques
        ' Fecha         : 05/01/08
        ' Autor         : MaxTeen
        ' Proposito     : No permite dar número de cheques a solicitudes cuyo objetivo es una transacción nominal o de transferencia.
        '                 Ej: Transferencias, Solicitudes Negativas por Anulación, etc.  
        ' 
        ' Variables del Entorno:
        '               Entrada:
        '               Salida:
        '---------------------------------------------------------------------------------------
        ' Bitacora de Modificaciones:
        ' 
        ' 
        '---------------------------------------------------------------------------------------
        'If wini = False Then conexiones(licencia)
        EsChequera99999 = True
        Dim queryString As String = _
                "select isnull(mnto_pago,0) as mnto_pago, isnull(mnto_ret,0) as mnto_ret, isnull(mnto_imp,0) as mnto_imp, isnull(mnto_ded,0) as mnto_ded, isnull(mnto_cheque,0) as mnto_cheque from dsolicit where numesoli=" & wNumeSoli
        Using connection As New Data.SqlClient.SqlConnection(ConnectionStringSIS)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            If reader.HasRows = True Then
                If reader.Item("mnto_pago") <= 0 Or reader.Item("mnto_ret") < 0 Or reader.Item("mnto_imp") < 0 Or reader.Item("mnto_ded") < 0 Or reader.Item("mnto_cheque") <= 0 Then
                    EsChequera99999 = True
                    wxMensaje = "El cheque lleva montos Negativos y/o en cero. Debe imprimirse con Chequera 99999"
                Else
                    EsChequera99999 = False
                End If
            End If
        End Using
    End Function

    Public Shared Function Crea_wdsolicit(ByVal wNumeSoli As Double, ByVal wusuario As Integer, ByVal licencia As String, Optional ByRef wxMensaje As String = "") As Boolean
        '---------------------------------------------------------------------------------------
        ' Procedimiento : Crea_wdsolicit
        ' Uso           : Impresión de cheques
        ' Fecha         : 08/01/08
        ' Autor         : MaxTeen
        ' Proposito     : Realiza un archivo copia de dsolicit. Por el momento se lleva el valor del cheque en letras de la solicitud
        ' 
        ' Variables del Entorno:
        '               Entrada:
        '               Salida:
        '---------------------------------------------------------------------------------------
        ' Bitacora de Modificaciones:
        ' 
        ' 
        '---------------------------------------------------------------------------------------
        'If wini = False Then conexiones(licencia)

        'Messagebox.Show("estamos en wdosolicit")

        'Dim tecx As New Asidllcon00.TEC

        Dim sql As String
        Dim wmonto As Double
        Dim wxmonto As String
        Dim wmoneda As String

        sql = "SELECT numesoli, cmoneda, ISNULL(mnto_cheque,0) AS mnto_cheque FROM dbo.dsolicit WHERE numesoli=" & wNumeSoli
        Dim rd As SqlDataReader = VG.EjecutaSQL_reader(sql, True)
        If rd.HasRows = False Then
            Crea_wdsolicit = False
            Exit Function
        End If
        While rd.Read
            wmonto = rd!mnto_cheque
            wmoneda = rd!cmoneda
            wmoneda = VG.EjecutaSQL_escalar("SELECT * FROM mamonedas where cmoneda='" & wmoneda & "'", True)
        End While

        Dim tec As New Asidllcon00.TEC 'ojo esto es temporal
        wxmonto = tec.ValorLetras_New(wmonto, wmoneda, "/100")

        sql = "delete wdsolicit where numesoli=" & wNumeSoli & " ; "

        sql += " INSERT INTO dbo.wdsolicit ( numesoli, mnto_cheque, xmnto_cheque, cusuario )"
        sql = sql & " SELECT dbo.dsolicit.numesoli, dbo.dsolicit.mnto_cheque, '" & wxmonto & "' AS xmontocheq, " & wusuario & " AS cusuario"
        sql = sql & " FROM dbo.dsolicit WHERE numesoli=" & wNumeSoli & " ; "
        EjecutaSQL(sql, True)
    End Function

    Public Function soli_ExisteDsoliDasicon(ByVal numesoli As Double) As Boolean
        'Procedimiento que verifica el estado de la solicitud, si esta lista para ejecutar o no.
        Dim SQL As String
        Dim rsa As New ADODB.Recordset
        SQL = "SELECT numesoli FROM dsoli_dasicon WHERE numesoli=" & numesoli
        rsa.Open(SQL, Oleconsis, ADODB.CursorTypeEnum.adOpenForwardOnly, ADODB.LockTypeEnum.adLockReadOnly)
        If rsa.EOF Then
            soli_ExisteDsoliDasicon = False
        Else
            soli_ExisteDsoliDasicon = True
        End If
        If rsa.State = 1 Then rsa.Close()
        rsa = Nothing
    End Function


    Public Function soli_RevisaDsoliDasicon(ByVal numesoli As Double) As Boolean
        Dim SQL As String
        Dim rsa As New ADODB.Recordset

        SQL = " SELECT Dsoli_dasicon.trabajo as trabajo"
        SQL = SQL & " FROM Dsoli_dasicon"
        SQL = SQL & " WHERE Dsoli_dasicon.numesoli=" & numesoli
        SQL = SQL & " GROUP BY Dsoli_dasicon.trabajo;"
        rsa.Open(SQL, Oleconsis, ADODB.CursorTypeEnum.adOpenForwardOnly, ADODB.LockTypeEnum.adLockReadOnly)
        If rsa.EOF Then
            soli_RevisaDsoliDasicon = False
            GoTo Fin
        End If
        rsa.MoveFirst()
        Do While Not rsa.EOF
            If rsa.Fields("trabajo").Value = "0" Then
                soli_RevisaDsoliDasicon = False
                GoTo Fin
            Else
                soli_RevisaDsoliDasicon = True
            End If
            rsa.MoveNext()
        Loop
Fin:
        If rsa.State = 1 Then rsa.Close()
        rsa = Nothing
    End Function

    Public Function soli_Fusiona(ByVal usu As Double, ByRef numesoli_fusio As Double, ByRef xError As String) As Boolean
        '---------------------------------------------------------------------------------------
        ' Procedimiento : soli_Fusiona
        ' Uso           : Contabilidad - Cheques
        ' Fecha         : 12/01/2008
        ' Autor         : Gustavo
        ' Proposito     : Ejecuta la fusion de solicitudes
        '                 Lee el archivo usolicit y genera una nueva solicitud en dsolicit
        '                 actualiza los estados de la solicitud fusionada
        ' Variables del Entorno:
        '               Entrada: Usuario, No. Solicitud Fusionada (regresa por referencia), Desc. Error
        '               Salida:  True/False
        '---------------------------------------------------------------------------------------
        ' Bitacora de Modificaciones:
        ' 
        '---------------------------------------------------------------------------------------
        'Dim tec As New Asidllcon00.TEC
        On Error GoTo salida
        soli_Fusiona = True

        Dim SQL As String
        Dim rsa As New ADODB.Recordset
        Dim sol As New ADODB.Recordset

        'Validaciones
        SQL = "SELECT * FROM dbo.unificasolitempo_" & usu
        If rsa.State = 1 Then rsa.Close()
        rsa.Open(SQL, Oleconsis, ADODB.CursorTypeEnum.adOpenForwardOnly, ADODB.LockTypeEnum.adLockReadOnly)
        If rsa.EOF Then
            xError = "No se podrá realizar la fusión"
            GoTo salida
        End If

        SQL = "SELECT COUNT(*) AS CTA FROM dbo.unificasolitempo_" & usu
        If rsa.State = 1 Then rsa.Close()
        rsa.Open(SQL, Oleconsis, ADODB.CursorTypeEnum.adOpenForwardOnly, ADODB.LockTypeEnum.adLockReadOnly)
        If rsa.Fields("CTA").Value < 2 Then
            xError = "Debe seleccionar al menos dos solicitudes para poder fusionar"
            GoTo salida
        End If

        SQL = "SELECT cmoneda, cdgotran FROM dbo.unificasolitempo_" & usu & " GROUP BY cmoneda,cdgotran"
        If rsa.State = 1 Then rsa.Close()
        rsa.Open(SQL, Oleconsis, ADODB.CursorTypeEnum.adOpenForwardOnly, ADODB.LockTypeEnum.adLockReadOnly)
        rsa.MoveNext()
        If Not rsa.EOF Then
            xError = "No se pueden unir solicitudes de diferentes monedas o transacción"
            GoTo salida
        End If

        SQL = "SELECT dbo.unificasolitempo_" & usu & ".* from dbo.unificasolitempo_" & usu & " WITH (NOLOCK) INNER JOIN dbo.usolicit ON dbo.unificasolitempo_" & usu & ".numesoli = dbo.usolicit.nuevonro"
        If rsa.State = 1 Then rsa.Close()
        rsa.Open(SQL, Oleconsis, ADODB.CursorTypeEnum.adOpenForwardOnly, ADODB.LockTypeEnum.adLockReadOnly)
        If Not rsa.EOF Then
            xError = "No se admite fusión de solicitudes que ya están fusionadas. Debe deshacer las fusiones anteriores e intentar nuevamente"
            GoTo salida
        End If

        'Inicia proceso de la fusión

        Dim xNumesoliNVA As Double = 0
        Dim xNumesoli As Double = 0

        'Variables acumulativas para la nueva solicitud
        Dim xSoliUni As String = ""
        Dim xXbenadic As String = ""
        Dim xXbeneficiario As String = ""
        Dim xOrdenante As Double
        Dim xNumesini As Double
        Dim xmnto_pago As Double
        Dim xmnto_ret As Double
        Dim xmnto_ret1 As Double
        Dim xmnto_ded As Double
        Dim xmnto_imp As Double
        Dim xmnto_cheque As Double
        Dim xCentcost As Double
        Dim xCdgotran As Double
        Dim xMonedaSoli As String = ""
        Dim xCsucur As Double
        Dim xCasegurado As Double
        Dim xMonePoli As Integer
        Dim xConcepto As String = ""
        Dim wConcepto As String = ""
        Dim xChequera As String = ""
        Dim xcbanco_des As Double
        Dim xTranRete As Double
        Dim xTranRete1 As Double
        Dim xTranDedu As Double
        Dim xCramo As Double
        Dim xCNPoliza As String = ""
        Dim xCdisprod As Double

        xNumesoliNVA = asi.DameNuevoCONTA("TESORERIA", licencia)
        xConcepto = "Fusión de Solicitudes: "

        SQL = "SELECT * FROM dbo.unificasolitempo_" & usu
        If rsa.State = 1 Then rsa.Close()
        rsa.Open(SQL, Oleconsis, ADODB.CursorTypeEnum.adOpenForwardOnly, ADODB.LockTypeEnum.adLockReadOnly)
        While Not rsa.EOF
            xNumesoli = rsa.Fields("numesoli").Value
            If sol.State = 1 Then sol.Close()
            sol.Open("SELECT * FROM dsolicit WHERE numesoli=" & xNumesoli, Oleconsis, ADODB.CursorTypeEnum.adOpenForwardOnly, ADODB.LockTypeEnum.adLockReadOnly)
            With sol
                SQL = "insert into usolicit values (" & xNumesoliNVA & "," & xNumesoli & ",'" & Format(Today.Date, "dd/MM/yyyy") & "','P')"
                If corresis(SQL) = False Then
                    xError = "Hay problemas en proceso de Union de Solicitudes"
                    GoTo salida
                End If
                SQL = "UPDATE dsolicit SET statsoli='U' WHERE numesoli=" & xNumesoli
                corresis(SQL)

                xConcepto = xConcepto & .Fields("numesoli").Value & ","
                If IsDBNull(sol.Fields("xbenadic").Value) = True Then
                    xXbenadic = ""
                Else : xXbenadic = .Fields("xbenadic").Value
                End If
                xXbeneficiario = .Fields("xbeneficiario").Value
                xOrdenante = .Fields("cordenador").Value
                xNumesini = .Fields("numesini").Value
                xmnto_pago = xmnto_pago + .Fields("mnto_pago").Value
                xmnto_ret = xmnto_ret + .Fields("mnto_ret").Value
                xmnto_ret1 = xmnto_ret1 + .Fields("mnto_ret1").Value
                xmnto_ded = xmnto_ded + .Fields("mnto_ded").Value
                xmnto_imp = xmnto_imp + .Fields("mnto_imp").Value
                xmnto_cheque = xmnto_cheque + .Fields("mnto_cheque").Value
                xCentcost = .Fields("centcost").Value
                xCdgotran = .Fields("cdgotran").Value
                xMonedaSoli = .Fields("cmoneda").Value
                xCsucur = .Fields("csucur").Value
                xCasegurado = .Fields("casegurado").Value
                xMonePoli = .Fields("csinies").Value
                wConcepto = .Fields("concepto").Value
                xChequera = .Fields("cbancia").Value
                xcbanco_des = .Fields("cbanco_des").Value
                If Not IsDBNull(sol.Fields("cdgotranRete").Value) Then
                    If (sol.Fields("cdgotranRete").Value) <> 0 And (sol.Fields("cdgotranRete").Value) <> 999999 Then
                        xTranRete = .Fields("cdgotranRete").Value
                    Else
                        xTranRete = xTranRete
                    End If
                Else : xTranRete = 0
                End If
                If Not IsDBNull(sol.Fields("cdgotranDedu").Value) Then
                    If .Fields("cdgotranDedu").Value <> 0 And .Fields("cdgotranDedu").Value <> 999999 Then
                        xTranDedu = .Fields("cdgotranDedu").Value
                    Else
                        xTranDedu = xTranDedu
                    End If
                Else : xTranDedu = 0
                End If

                xCramo = .Fields("cramo").Value
                xCNPoliza = .Fields("cnpoliza").Value
                xNumesini = .Fields("numesini").Value
                xCdisprod = .Fields("cdisprod").Value
            End With
            rsa.MoveNext()
        End While
        xConcepto = Mid(xConcepto, 1, Len(xConcepto) - 1)

        If wcia = 4 Then
            wConcepto = xConcepto & ". " & wConcepto
        Else
            wConcepto = xConcepto & ". "
        End If

        wConcepto = Mid(wConcepto, 1, 300)
        If wcia <> 4 Then
            If tec.NZ(tec.DameCid("SELECT ABS(bsiniestros) AS bsiniestros FROM MAUTOCAJA_NET WHERE NASIPRE=" & xCdgotran, "bsiniestros", "true", licencia, Oleconsis), 0) = 1 Or tec.NZ(tec.DameCid("SELECT ABS(bsiniestrosgas) AS bsiniestrosgas FROM MAUTOCAJA_NET WHERE NASIPRE=" & xCdgotran, "bsiniestrosgas", "true", licencia, Oleconsis), 0) = 1 Then
                wConcepto = wConcepto & " Pago de varios reclamos."
            End If
        End If
        Dim xNumeamesSol As Integer
        xNumeamesSol = Year(Today.Date) * 100 + Month(Today.Date)
        'numeamessol,numesoli,u_version,cordenador,cid,casegurado,xbeneficiario,xbenadic
        SQL = "insert into dsolicit values("
        SQL += xNumeamesSol & "  ,"
        SQL += xNumesoliNVA & "  ,"
        SQL += "'!'  ,"
        SQL += Numero & "  ,"
        SQL += "'" & tec.DameCid("select cid from maentes where cci_rif=" & xCasegurado, "cid", True, licencia) & "'  ,"
        SQL += xCasegurado & "  ,"
        SQL += "'" & xXbeneficiario.Trim & "'  ,"
        SQL += "'" & xXbenadic.Trim & "'  ,"

        'cdgotran,tipo_mov,csucur,concepto,fechsoli,fechlimi
        SQL += xCdgotran & "  ,"
        SQL += "'CK'  ,"
        SQL += xCsucur & "  ,"
        SQL += "'" & wConcepto & "'  ,"
        SQL += "'" & Format(Today.Date, "dd/MM/yyyy") & "'  ,"
        SQL += "'" & Format(Today.Date, "dd/MM/yyyy") & "'  ,"

        'fechapro,fechimpr,fechanul,canula,stattran,fechvigen,statsoli,statimpr,mnto_pago
        SQL += "null  , null  , null  ,"
        SQL += "0 , '1'  ,"
        SQL += "'" & Format(Today.Date, "dd/MM/yyyy") & "'  ,"
        SQL += "'P'  , 'P'  ,"
        SQL += xmnto_pago & "  ,"

        'mnto_ret,mnto_ret1,mnto_imp,mnto_ded,mnto_cheque,cmoneda,ptasamon,centcost
        SQL += xmnto_ret & "  ,"
        SQL += xmnto_ret1 & "  ,"
        SQL += xmnto_imp & "  ,"
        SQL += xmnto_ded & "  ,"
        SQL += xmnto_cheque & "  ,"
        SQL += "'" & xMonedaSoli & "'  ,"
        SQL += asi.Damecambio(2, Today.Date, licencia) & "  ,"
        SQL += xCentcost & "  ,"

        'cramo,crecibo,cnpoliza,numesini,csinies,cdisprod,caprueba1,cbancia
        'cestaapro1,fechaapro1,caprueba2,cestaapro2,fechaapro2,capruebate,cestaaprote,fechaaprote
        'ccuentaban,numecheq,numetrans,numedoc,numeimprs,cforimpr,xobserva,fingreso
        SQL += xCramo & "  ,"
        SQL += "0  ,"
        SQL += "'" & xCNPoliza & "'  ,"
        SQL += xNumesini & "  ,"
        SQL += xMonePoli & "  ,"
        SQL += xCdisprod & "  ,"
        SQL += "0  ,"
        SQL += xChequera & "  ,"
        SQL += "'P'  , null  ,"
        SQL += "0  , 'P'  , null  ,"
        SQL += "0  , 'P'  , null  ,"
        SQL += "0  ,"
        SQL += "null  , 0  , null  , null  ,"
        SQL += "null  , null  ,"
        SQL += "'" & Format(Now, "dd/MM/yyyy hh:mm:ss") & "'  ,"

        'cpais_des,cciudad_des,cbanco_des,cagenban_des,xcuentabanc_des,itipocta_des
        'iestatconta,numeames,numecomp,mfueradepre,capruebafp,cestaaprofp,fechaaprofp
        'im_cheque,im_solicitud,statanul
        SQL += "null  , null  , " & xcbanco_des & " , null  ,"
        SQL += "null  , null  , null  ,"
        SQL += "null  , null  , null  ,"
        SQL += "null  , null  , null  ,"
        SQL += "null  , null  , null  ,"

        'ifuente,tipo_emisoli,tipo_reg
        'centregado,ientregado,fentregado
        'icobrado,fcobrado,
        'cdgotranDedu, cdgotranRete, cdgotranRete1, 
        'cusuario, ccategoria
        'cusuarioauto,ccategoriaauto,fultmod,cusuariomod,ccategoriamod
        SQL += "'SIS_NET'  , '0'  , 'U'  ,"
        SQL += "null  , null  , null  ,"
        SQL += "null  , null  ,"
        SQL += xTranDedu & "  ,"
        SQL += xTranRete & "  ,"
        SQL += xTranRete1 & "  ,"
        SQL += Numero & "  ,"
        SQL += "0  ,"
        SQL += "0  ,"
        SQL += "0  ,"
        SQL += "'" & Format(Now, "dd/MM/yyyy hh:mm:ss") & "'  ,"
        SQL += Numero & "  ,"
        SQL += "0 "

        If wcia = 2 Then
            SQL += ", 0 , 0 " 'cnit, numersoli
        End If

        SQL += ")"
        If corresis(SQL) = False Then
            xError = "Ocurrió error para generar la solicitud nueva de unión, informe a Sistemas"
            GoTo salida
        Else
            numesoli_fusio = xNumesoliNVA
        End If

        If rsa.State = 1 Then rsa.Close()
        rsa = Nothing
        Exit Function
salida:
        If rsa.State = 1 Then rsa.Close()
        rsa = Nothing
        soli_Fusiona = False
        xError = xError & " " & Err.Description
    End Function

    Public Sub soli_GeneraDISCO_TRANSFBAN(ByVal usuNumero As Double, ByVal xnenvio As Double, ByVal fenvio As Date, ByVal ruta As String, ByRef ArchivoOU As String)
        'Imports System.IO
        'Dim tec As New Asidllcon00.TEC

        'Variables del registro bancario
        Dim regBAN_itiporeg As String '* 1
        Dim regBAN_nplan As String '* 4         '0052 dolares, 0053 cordobas (constante)
        Dim regBAN_nenvio As String = xnenvio '* 5        'No. consecutivo por moneda
        Dim regBAN_Nruc As String '* 20
        Dim regBAN_cproveedor As String '* 5
        'ccuentaban As String * 20
        'nlinea As String * 5        'Sec. de lote
        Dim regBAN_nano As String '* 4
        Dim regBAN_nmes As String '* 2
        Dim regBAN_ndia As String '* 2
        Dim regBAN_mmonto As String '* 13    'Monto acreditable a la cta (sin decimales)
        Dim regBAN_ntrans As String '* 5        'Total de transacciones o lineas
        Dim regBAN_concepto As String '* 30
        Dim regBAN_cerror As String '* 1
        Dim regBAN_xnombre As String '* 60
        Dim regBAN_nfact As String '* 20

        Dim nlinea As Integer
        Dim monecomi As String

        Dim wSmonelo As String = cws(15)
        Dim xSQL As String
        Dim MONE As String
        Dim sol As New ADODB.Recordset

        sol.CursorLocation = ADODB.CursorLocationEnum.adUseClient
        xSQL = "select * from dsolicit inner join dbo.WWWsoli" & usuNumero & " on dsolicit.numesoli=dbo.WWWsoli" & usuNumero & ".numesoli"
        sol.Open(xSQL, Oleconsis, ADODB.CursorTypeEnum.adOpenDynamic, ADODB.LockTypeEnum.adLockOptimistic)
        If sol.RecordCount <= 0 Then Exit Sub
        sol.MoveFirst()
        MONE = sol.Fields("cmoneda").Value  ' dcomis.Recordset!cmoneda
        If Trim(MONE) = Trim(wSmonelo) Then
            regBAN_nplan = "0930"
            '    nenvio = DameNuevoCONTA("CENVIOCOMI_LOC")
        Else
            regBAN_nplan = "0929"
            '    nenvio = DameNuevoCONTA("CENVIOCOMI_EXT")
        End If
        'nenvio = sol.Recordset!numetrans

        'nenvio = InputBox("No. de Envío ?", "Disco para envío al banco", 0)
        If regBAN_nenvio = "" Or regBAN_nenvio = 0 Or Not IsNumeric(regBAN_nenvio) Then
            Messagebox.Show("Debe introducir un No. de Envío válido")
            Exit Sub
        End If

        'fenvio = InputBox("Fecha de Envío (dd/mm/aaaa) ?", "Disco para envío al banco", Format(Date, "dd/mm/yyyy"))
        If fenvio = Nothing Or Not IsDate(fenvio) Then
            Messagebox.Show("Debe introducir una Fecha de Envío válida")
            Exit Sub
        End If

        Err.Number = 0
        Dim Archivo As String
        Archivo = ruta & "\pagtran" & regBAN_nplan & ".prn"
        ArchivoOU = "\pagtran" & regBAN_nplan & ".prn"

        File.Delete(Archivo)
        If Not File.Exists(Archivo) Then
            File.AppendAllText(Archivo, "", Encoding.Default)
        End If

        Dim Arch As New FileStream(Archivo, FileMode.Create)
        Dim Esc As New StreamWriter(Arch, Encoding.Default)

        Dim XNL As Double
        Dim xmSUM As String = "0"
        Dim xlinea As String
        Dim xnruc As String
        Dim xconcepto As String

        With sol
            If .RecordCount > 0 Then .MoveFirst()
            XNL = 0
            xmSUM = 0
            While Not .EOF
                XNL = XNL + 1
                xmSUM = CDbl(xmSUM) + CDbl(.Fields("mnto_cheque").Value)
                If asi.NZ(.Fields("numetrans").Value, 0) = 0 Then
                    Messagebox.Show("No ha generado número de transferencia para este lote de solicitudes")
                    Exit Sub
                End If
                .MoveNext()
            End While
            If .RecordCount > 0 Then .MoveFirst()

            nlinea = 0
            regBAN_itiporeg = "B"
            regBAN_nplan = tec.numerico(CStr(regBAN_nplan), 4)
            regBAN_nenvio = Replace(tec.alfa2_Der(CStr(regBAN_nenvio), 5), " ", "0")
            regBAN_Nruc = tec.alfa2("", 20)
            regBAN_cproveedor = tec.alfa2_Der("", 5)
            regBAN_nano = tec.numerico(CStr(Year(fenvio)), 4)
            regBAN_nmes = tec.numerico(CStr(Month(fenvio)), 2)
            regBAN_ndia = tec.numerico(CStr(Day(fenvio)), 2)
            regBAN_mmonto = tec.alfa2_Der(CStr(CDbl(xmSUM) * 100), 13)
            regBAN_ntrans = tec.alfa2_Der(CStr(XNL), 5)
            regBAN_concepto = tec.alfa2("", 30)
            regBAN_cerror = tec.alfa2("", 1)
            regBAN_xnombre = tec.alfa2("", 60)
            regBAN_nfact = tec.alfa2("", 20)

            xlinea = regBAN_itiporeg + regBAN_nplan + regBAN_nenvio + regBAN_Nruc + regBAN_cproveedor + regBAN_nano + regBAN_nmes + regBAN_ndia + regBAN_mmonto + regBAN_ntrans + regBAN_concepto + regBAN_cerror + regBAN_xnombre + regBAN_nfact
            Esc.WriteLine(xlinea)
            Esc.Flush()

            While Not .EOF
                'If Trim(!cmoneda) <> Trim(monecomi) Then GoTo otro1
                nlinea = nlinea + 1
                regBAN_itiporeg = "T"
                regBAN_nplan = tec.numerico(CStr(regBAN_nplan), 4)
                regBAN_nenvio = Replace(tec.alfa2(CStr(regBAN_nenvio), 5), " ", "0")
                xnruc = tec.DameCid("select nruc from maentes WITH (NOLOCK) where cci_rif=" & .Fields("casegurado").Value, "nruc", True, licencia, Oleconsis)
                regBAN_Nruc = tec.alfa2(CStr(xnruc), 20)
                'regBAN.cproveedor = alfa2_Der(CStr(!casegurado), Len(regBAN.cproveedor))
                regBAN_cproveedor = tec.alfa2_Der(CStr(nlinea), 5)
                regBAN_nano = tec.numerico(CStr(Year(fenvio)), 4)
                regBAN_nmes = tec.numerico(CStr(Month(fenvio)), 2)
                regBAN_ndia = tec.numerico(CStr(Day(fenvio)), 2)
                xmSUM = .Fields("mnto_cheque").Value
                regBAN_mmonto = tec.alfa2_Der(CStr(xmSUM * 100), 13)
                regBAN_ntrans = tec.alfa2_Der(CStr(nlinea), 5)
                'xconcepto = "Pgo.Com. Quincena #" & mcomis.Recordset!nliquid & " " & Mid(Damemes(mcomis.Recordset!fmes), 1, 4) & "/" & Format(mcomis.Recordset!fano, "00")
                'xconcepto = !concepto
                xconcepto = cws(1) ' wnomcia
                regBAN_concepto = tec.alfa2(CStr(xconcepto), 30)
                regBAN_cerror = tec.alfa2(0, 1)
                regBAN_xnombre = tec.alfa2(.Fields("xbeneficiario").Value, 60)
                'regBAN.nfact = alfa2("0", Len(regBAN.nfact))
                regBAN_nfact = tec.alfa2(RTrim(.Fields("xobserva").Value), 20)

                xlinea = regBAN_itiporeg + regBAN_nplan + regBAN_nenvio + regBAN_Nruc + regBAN_cproveedor + regBAN_nano + regBAN_nmes + regBAN_ndia + regBAN_mmonto + regBAN_ntrans + regBAN_concepto + regBAN_cerror + regBAN_xnombre + regBAN_nfact
                Esc.WriteLine(xlinea)
                Esc.Flush()
otro1:
                .MoveNext()
            End While
        End With
        Arch.Close()

        Messagebox.Show("Se ha generado el archivo en disco exitosamente.")

    End Sub

    Public Sub soli_GeneraNTRANSF(ByVal usuNumero As Double)
        'Dim asi As New Asidllcon00.wasi
        Dim xSQL As String
        Dim sol As New ADODB.Recordset
        Dim wnumetrans As Double

        sol.CursorLocation = ADODB.CursorLocationEnum.adUseClient
        xSQL = "select * from dsolicit inner join dbo.WWWsoli" & usuNumero & " on dsolicit.numesoli=dbo.WWWsoli" & usuNumero & ".numesoli"
        sol.Open(xSQL, Oleconsis, ADODB.CursorTypeEnum.adOpenDynamic, ADODB.LockTypeEnum.adLockOptimistic)
        With sol

            'Validaciones de datos
            If .RecordCount <= 0 Then
                Messagebox.Show("Imposible generar #Transferencia. No hay solicitudes seleccionadas")
                GoTo salida
            End If
            .MoveFirst()
            While Not .EOF
                If CDbl(tec.NZ(.Fields("numetrans").Value, 0)) <> 0 Then
                    Messagebox.Show("Imposible generar #Transferencia. El lote de solicitudes que ha seleccionado ya tiene asignado un número de transferencia")

                    xSQL = "update dsolicit set numetrans=" & .Fields("numetrans").Value & " where numesoli in (select numesoli from dbo.WWWsoli" & usuNumero & ")"
                    corresis(xSQL)

                    GoTo salida
                End If
                .MoveNext()
            End While

            Dim mone1ra As String
            .MoveFirst()
            mone1ra = .Fields("cmoneda").Value
            While Not .EOF
                If mone1ra <> .Fields("cmoneda").Value Then
                    Messagebox.Show("Imposible generar #Transferencia. No todas las solicitudes seleccionadas poseen las misma moneda")
                    GoTo salida
                End If
                .MoveNext()
            End While
            .MoveFirst()
            While Not .EOF
                If CDbl(tec.NZ(.Fields("numetrans").Value, 0)) <> 0 Then
                    Messagebox.Show("Imposible generar #Transferencia. Ha seleccionado solicitudes que ya poseen número de transferencia")
                    GoTo salida
                End If
                .MoveNext()
            End While


            wnumetrans = asi.DameNuevoCONTA("CENVIO", licencia)
            .MoveFirst()
            While Not .EOF
                .Fields("numetrans").Value = wnumetrans
                .Update()
                .MoveNext()
            End While
        End With

        Messagebox.Show("Se ha generado un no. de transferencia para envíos por el lote de solicitudes seleccionadas, Envío #" & wnumetrans)
salida:
        If sol.State = 1 Then sol.Close()
        sol = Nothing
    End Sub

    Public Sub EliTABLA_sis(ByVal xNombreTabla As String)
        Dim sql As String
        sql = "IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = object_id(N'" & xNombreTabla & "') and OBJECTPROPERTY(id, N'IsUserTable') = 1) DROP TABLE " & xNombreTabla
        VG.EjecutaSQL(sql, True)
    End Sub

    Public Function Pasa_Excell(ByVal sql As String, ByVal connect As String) As Boolean

        Dim ObjExcel As Microsoft.Office.Interop.Excel.Application
        'Dim objLibroExcel As Infragistics.Excel.Workbook
        'Dim objHojaExcel As Infragistics.Excel.Worksheet
        Dim objSQLConnect As New System.Data.OleDb.OleDbConnection(connect)
        Dim objSQLAdapter As New OleDb.OleDbDataAdapter(sql, objSQLConnect)
        Dim objDataSet As New DataSet("ExcelTest")
        objSQLAdapter.Fill(objDataSet, "saldos")

        ObjExcel = New Microsoft.Office.Interop.Excel.Application
        ObjExcel.Visible = True


        '        Dim queryString As String = sql
        '        Using connection As New Data.SqlClient.SqlConnection(ConnectionStringSIS)
        ' Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
        ' connection.Open()
        ' Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
        ' While reader.Read
        ' linea = Chr(34) & reader.Item("id_cuenta_muc") & Chr(34) & "|" & reader.Item("id_moneda") & "|" & CDbl(reader.Item("saldo"))
        'Esc.WriteLine(linea)
        'Esc.Flush()
        'End While
        'Arch.Close()
        'End Using



    End Function

    Public Function cuentaregistro(ByVal where As String) As Integer
        Dim sql As String
        sql = "SELECT count(cdgosupe) as nreg FROM catalogonic  WHERE " + where
        Dim connectionString As String
        On Error Resume Next
        Dim queryString As String = sql

        connectionString = ConnectionStringSIS

        Using connection As New Data.SqlClient.SqlConnection(connectionString)
            Dim command As New Data.SqlClient.SqlCommand(queryString, connection)
            connection.Open()
            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
            reader.Read()
            If reader.HasRows Then

                cuentaregistro = reader.Item("nreg")
            Else
                cuentaregistro = 0
            End If
        End Using

    End Function

    Public Sub CargarDropDrownList_SE(ByVal consulta As String, ByVal texto As String, ByVal valor As String, ByVal MiControl As DropDownList, ByVal ConnectionStr As String)
        '---------------------------------------------------------------------------------------
        ' Procedimiento : CargarDropDrownList
        ' Uso           : Contbilidad
        ' Fecha         : 24/12/2007
        ' Autor         : ASI (Asesores Informáticos) GUS
        ' Proposito     : Rellenar un control DropDownList pasado como parmetro
        '                 y ademas pone SE (sin especificar)
        ' Variables del Entorno: 
        '               Entrada: consulta sql, campo de texto q se muestra, campo de valor q enlaza
        '               Salida:
        '---------------------------------------------------------------------------------------
        ' Bitacora de Modificaciones:
        ' 
        '
        '---------------------------------------------------------------------------------------

        Dim ds As New Data.DataSet
        Dim da As New SqlClient.SqlDataAdapter(consulta, ConnectionStr)
        ds = New DataSet
        da.Fill(ds)

        Dim dr As Data.DataRow
        dr = ds.Tables(0).NewRow()
        dr(valor) = "-1"
        dr(texto) = "No-Especificado"
        ds.Tables(0).Rows.InsertAt(dr, 0)

        MiControl.DataSource = ds
        MiControl.DataValueField = valor
        MiControl.DataTextField = texto
        MiControl.DataBind()

    End Sub

    Public Sub CargarDropDrownList(ByVal consulta As String, ByVal texto As String, ByVal valor As String, ByVal MiControl As DropDownList, ByVal ConnectionStr As String)
        '---------------------------------------------------------------------------------------
        ' Procedimiento : CargarDropDrownList
        ' Uso           : Contbilidad
        ' Fecha         : 24/12/2007
        ' Autor         : ASI (Asesores Informáticos) GUS
        ' Proposito     : Rellenar un control DropDownList pasado como parmetro
        ' 
        ' Variables del Entorno: 
        '               Entrada: consulta sql, campo de texto q se muestra, campo de valor q enlaza
        '               Salida:
        '---------------------------------------------------------------------------------------
        ' Bitacora de Modificaciones:
        ' 
        '
        '---------------------------------------------------------------------------------------
        Try


            Dim ds As New Data.DataSet
            Dim da As New SqlClient.SqlDataAdapter(consulta, ConnectionStr)
            ds = New DataSet
            da.Fill(ds)
            MiControl.DataSource = ds
            MiControl.DataValueField = valor
            MiControl.DataTextField = texto
            MiControl.DataBind()
        Catch ex As Exception

        End Try
    End Sub

    Public Sub CargarListBox(ByVal consulta As String, ByVal texto As String, ByVal valor As String, ByVal MiControl As ListBox, ByVal ConnectionStr As String)
        '---------------------------------------------------------------------------------------
        ' Procedimiento : CargarListBox
        ' Uso           : Contbilidad
        ' Fecha         : 24/12/2007
        ' Autor         : ASI (Asesores Informáticos) GUS
        ' Proposito     : Rellenar un control ListBox pasado como parmetro
        ' 
        ' Variables del Entorno: 
        '               Entrada: consulta sql, campo de texto q se muestra, campo de valor q enlaza
        '               Salida:
        '---------------------------------------------------------------------------------------
        ' Bitacora de Modificaciones:
        ' 
        '
        '---------------------------------------------------------------------------------------

        Dim ds As New Data.DataSet
        Dim da As New SqlClient.SqlDataAdapter(consulta, ConnectionStr)
        ds = New DataSet
        da.Fill(ds)

        MiControl.DataSource = ds
        MiControl.DataValueField = valor
        MiControl.DataTextField = texto
        MiControl.DataBind()
    End Sub

    Public Function LTN(ByVal letra As String) As Integer
        Select Case letra
            Case "A"
                LTN = 1
            Case "B"
                LTN = 2
            Case "C"
                LTN = 3
            Case "D"
                LTN = 4
            Case "E"
                LTN = 5
            Case "F"
                LTN = 6
            Case "G"
                LTN = 7
            Case "H"
                LTN = 8
            Case "I"
                LTN = 9
            Case "J"
                LTN = 10
            Case "K"
                LTN = 11
            Case "L"
                LTN = 12
            Case "M"
                LTN = 13
            Case "N"
                LTN = 14
            Case "O"
                LTN = 15
            Case "P"
                LTN = 16
            Case "Q"
                LTN = 17
            Case "R"
                LTN = 18
            Case "S"
                LTN = 19
            Case "T"
                LTN = 20
            Case "U"
                LTN = 21
            Case "V"
                LTN = 22
            Case "W"
                LTN = 23
            Case "X"
                LTN = 24
            Case "Y"
                LTN = 25
            Case "Z"
                LTN = 26

        End Select



    End Function
    Public Sub SetDBLogonForReportSIS(ByRef ss As ReportDocument, Optional ByVal bConta As Boolean = True)
        On Error Resume Next
        Dim pass As String
        If cws(25) = " " Then
            pass = ""
        Else
            pass = cws(25)
        End If

        Dim myTables As Tables = ss.Database.Tables
        For Each myTable As CrystalDecisions.CrystalReports.Engine.Table In myTables


            If bConta = False Then
                myTable.LogOnInfo.ConnectionInfo.DatabaseName = cws(7) ''aqui es 7
            Else
                myTable.LogOnInfo.ConnectionInfo.DatabaseName = cws(3)
            End If

            'myTable.LogOnInfo.ConnectionInfo.DatabaseName = cws(3)
            myTable.LogOnInfo.ConnectionInfo.UserID = cws(24)
            myTable.LogOnInfo.ConnectionInfo.Password = pass
            myTable.LogOnInfo.ConnectionInfo.ServerName = cws(2)
            Dim myTableLogonInfo As TableLogOnInfo = myTable.LogOnInfo
            myTable.ApplyLogOnInfo(myTableLogonInfo)
        Next

        'Loading the report

        ss.SetDatabaseLogon(cws(24), pass)

    End Sub
    Public Function PonValorCombo(ByVal valor As Object, ByRef combo As WebControls.DropDownList) As Boolean
        Try
            combo.SelectedValue = valor
            PonValorCombo = True
        Catch ex As Exception
            combo.SelectedIndex = 0
            PonValorCombo = False
        End Try
    End Function
    '    Public Sub RellenaArbol(ByRef uwt As Infragistics.WebUI.UltraWebNavigator.UltraWebTree)
    '        '---------------------------------------------------------------------------------------
    '        ' Procedimiento : RellenaArbol
    '        ' Uso           : Contbilidad
    '        ' Fecha         : 16/09/2007
    '        ' Autor         : ASI (Asesores Informáticos) JAMO
    '        ' Proposito     : Rellenar el arbol con el codigo contable a demanda. Se carga con cada selección
    '        ' 
    '        ' Variables del Entorno: cws(84 al 88)
    '        '               Entrada:
    '        '               Salida:
    '        '---------------------------------------------------------------------------------------
    '        ' Bitacora de Modificaciones:
    '        ' 
    '        '
    '        '---------------------------------------------------------------------------------------

    '        Dim detalle As New Infragistics.WebUI.UltraWebNavigator.Node
    '        Dim nodomas As New Infragistics.WebUI.UltraWebNavigator.Node
    '        detalle = uwt.SelectedNode
    '        Dim campo As String = "", campo1 As String = "", archivo As String, longi As String, corte As Integer
    '        Dim ucampo As String = ""
    '        Dim QueryString As String = ""
    '        Select Case detalle.Level

    '            Case 0
    '                detalle.Nodes.Clear()
    '                campo = "N2"
    '                campo1 = "xdes"
    '                archivo = "codinicn2"
    '                longi = cws(84)
    '                ucampo = Mid(detalle.Text, 1, Val(longi))
    '                QueryString = "SELECT " + campo + ", UPPER([xdes]) AS [xdes] FROM " + archivo + " WHERE (((SUBSTRING([" + campo + "],1," + longi + "))='" & ucampo & "')) Order By " & campo & ";"


    '            Case 1
    '                detalle.Nodes.Clear()
    '                campo = "N3"
    '                campo1 = "xdes"
    '                archivo = "codinicn3"
    '                longi = cws(85)
    '                ucampo = Mid(detalle.Text, 1, Val(longi))
    '                QueryString = "SELECT " + campo + ", UPPER([xdes]) AS [xdes] FROM " + archivo + " WHERE (((SUBSTRING([" + campo + "],1," + longi + "))='" & ucampo & "')) Order By " & campo & ";"

    '            Case 2
    '                detalle.Nodes.Clear()
    '                campo = "N4"
    '                campo1 = "xdes"
    '                archivo = "codinicn4"
    '                longi = cws(86)
    '                ucampo = Mid(detalle.Text, 1, Val(longi))
    '                QueryString = "SELECT " + campo + ", UPPER([xdes]) AS [xdes] FROM " + archivo + " WHERE (((SUBSTRING([" + campo + "],1," + longi + "))='" & ucampo & "')) Order By " & campo & ";"
    '                If Val(cws(87)) = 0 Then
    '                    corte = Val(cws(86))
    '                    campo = "cdgocont"
    '                    campo1 = "desccont"
    '                    archivo = "catalogonic"
    '                    GoTo cargacodigo
    '                End If
    '            Case 3
    '                detalle.Nodes.Clear()
    '                campo = "N5"
    '                campo1 = "xdes"
    '                archivo = "codinicn5"
    '                longi = cws(87)
    '                ucampo = Mid(detalle.Text, 1, Val(longi))
    '                QueryString = "SELECT " + campo + ", UPPER([xdes]) AS [xdes] FROM " + archivo + " WHERE (((SUBSTRING([" + campo + "],1," + longi + "))='" & ucampo & "')) Order By " & campo & ";"

    '            Case 4
    '                If corte <> 0 Then GoTo SAK
    '                detalle.Nodes.Clear()
    '                campo = "cdgocont"
    '                campo1 = "desccont"
    '                archivo = "catalogonic"
    '                longi = cws(88)
    '                ucampo = Mid(detalle.Text, 1, Val(longi))
    '                QueryString = "select cdgocont, UPPER([desccont]) AS [desccont] from catalogonic where (((SUBSTRING([cdgocont],1," & cws(88) & "))='" & ucampo & "') And tipocuen=2) Order by cdgocont;"
    '                GoTo saltaentradagoto
    'cargacodigo:
    '                ucampo = Mid(detalle.Text, 1, corte)
    '                QueryString = "select cdgocont,UPPER([desccont]) AS [desccont] from catalogonic where (((SUBSTRING([cdgocont],1," & corte & "))='" & ucampo & "') And tipocuen=2) Order by cdgocont;"
    'saltaentradagoto:
    '        End Select
    '        If Len(QueryString) = 0 Or QueryString = Nothing Then GoTo sak

    '        Using connection As New Data.SqlClient.SqlConnection(ConnectionStringSIS)
    '            Dim command As New Data.SqlClient.SqlCommand(QueryString, connection)
    '            connection.Open()
    '            Dim reader As Data.SqlClient.SqlDataReader = command.ExecuteReader()
    '            detalle.ShowExpand = True
    '            While reader.Read()
    '                nodomas = detalle.Nodes.Add(reader.Item(campo) + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + reader.Item(campo1))
    '                If campo = "cdgocont" Then nodomas.Style.Font.Bold = True
    '            End While
    '            Try
    '                nodomas.Selected = True
    '                nodomas.ShowExpand = True
    '            Catch ex As Exception
    '                REM esto significa que no existe ninguna cuenta en ese nivel
    '                REM **
    '                REM Primero busco la longitud del codigo del nivel perdido y lo agrego
    '                'Dim x As Short = wgrupo(detalle.Level + 2)
    '                'Dim ceros As String
    '                'ceros = wsepa
    '                'Dim j As Short
    '                'For j = 0 To x
    '                '    ceros = ceros + "0"
    '                'Next
    '                'ucampo = ucampo + ceros
    '                'nodomas = detalle.Nodes.Add(ucampo + " ?")
    '                'nodomas.Selected = True
    '                'nodomas.ShowExpand = True
    '            End Try

    '        End Using
    'sak:
    '    End Sub

    Public Function ArmaSql_RangosBusqueda(ByRef Bandera As Integer, ByVal Campo As String, ByVal Operador1 As String, ByVal Valor1 As String, Optional ByVal Operador2 As String = "", Optional ByVal Valor2 As String = "") As String
        Dim Cadena As String = ""
        Try
            If ((Campo = "") Or Campo = "0") Or ((Operador1 = "") Or (Operador1 = "0")) Or ((Valor1 = "") Or (Valor1 = "0")) Then
                Return ""
            Else
                If ((Valor2 = "") Or (Valor2 = "0")) Or ((Operador2 = "") Or (Operador2 = "0")) Then
                    If Bandera = 0 Then
                        Cadena = " (" & Campo.Trim & " " & Operador1.Trim & " " & Valor1.Trim & ")"
                    Else
                        Cadena = " AND (" & Campo.Trim & " " & Operador1.Trim & " " & Valor1.Trim & ")"
                    End If
                    Bandera = 1
                    Return Cadena
                Else
                    If Bandera = 0 Then
                        Cadena = " ((" & Campo.Trim & " " & Operador1.Trim & " " & Valor1.Trim & ") AND (" & Campo.Trim & " " & Operador2.Trim & " " & Valor2.Trim & "))"
                    Else
                        Cadena = " AND ((" & Campo.Trim & " " & Operador1.Trim & " " & Valor1.Trim & ") AND (" & Campo.Trim & " " & Operador2.Trim & " " & Valor2.Trim & "))"
                    End If
                    Bandera = 1
                    Return Cadena
                End If
            End If
        Catch Ex As Exception
            'Messagebox.Show(ex.Message)
            Return ""
        End Try
    End Function
    Public Function revertir_fusion(ByRef numesoli As String) As Boolean
        '---------------------------------------------------------------------------------------
        ' Procedimiento : revertir_fusion
        ' Uso           : Contbilidad
        ' Fecha         : 24/03/2008
        ' Autor         : ASI (Asesores Informáticos) Jackson
        ' Proposito     : Revierte la fusión de solicitudes
        ' Variables del Entorno: 
        '               Entrada: Variable numesoli(número de solicitud de la solicitud fusionada que se desea revertir )
        '               Salida:
        '---------------------------------------------------------------------------------------
        ' Bitacora de Modificaciones:
        ' 
        '
        '---------------------------
        Dim sqlstatsoli As String = "update dsolicit set statsoli='A' from dsolicit inner join usolicit on dsolicit.numesoli=usolicit.numesoli where usolicit.nuevonro="
        sqlstatsoli += numesoli & " and dsolicit.statsoli='U' "
        If asi.corresis(sqlstatsoli, licencia) = False Then
            Messagebox.Show("No se Pudo Revertir la Fusión")
            Exit Function
        End If
        Dim actualiza_statsoli_fusion As String = "update dsolicit set statsoli='R' from dsolicit where numesoli=" & numesoli
        If asi.corresis(actualiza_statsoli_fusion, licencia) = False Then
            Exit Function
        End If

    End Function



    '''' <summary> 
    '''' Guarda un archivo tipo texto que contiene la informacion que genero
    '''' el error. El archivo se crea con el formato:
    '''' "[NombrePagina](Fecha)(Hora).txt" y se guarda en la carpeta
    '''' "_Errores" que esta en el direcctorio del sitio web.
    '''' Si la carpeta no existe, esta se crea automaticamente.
    '''' </summary>
    '''' <param name="Err">Objeto de tipo "Exception" que contiene el error.</param>
    '''' <returns >Retorna false si no pudo guardar el archivo</returns>
    ''''----------------------------------------------------------------
    '''' Procedimiento : Guardar_Error
    '''' Uso           : General
    '''' Fecha         : 01/11/2007
    '''' Autor         : Julio S. Lovo
    '''' Proposito     : Crear y guardar un registro de errores de tipo
    ''''                 texto.
    ' '''
    '''' Variables de Entorno :
    '''' -> Recibe como parametro un objeto de tipo "system.exception"
    '''' 
    '''' Funciones Dependientes :
    '''' -> Ninguna
    '''' 
    '''' Base de Datos (Tablas Modificadas):
    '''' -> Ninguna
    ''''----------------------------------------------------------------
    ''Public Function Guardar_Error(ByVal Err As System.Exception) As Boolean
    '    Dim Nom, Dir, Msg As String
    '    Dim ENTER As String = Chr(13) & Chr(10)
    '    Try
    '        'Crea el nombre del archivo "[NombrePagina](Fecha)(Hora).txt"
    '        Nom = Me.Page.ToString.Replace("ASP.", "").Replace("_aspx", "").ToUpper
    '        Nom = Nom & "(" & Format(Today, "yyyy/MM/dd").ToString.Replace("/", "-") & ")"
    '        Nom = Nom & "(" & Now.ToShortTimeString.Replace(":", ".") & ").txt"

    '        'Crea la direccion del carpeta "_Errores" en el direcctorio del sito web
    '        Dir = System.AppDomain.CurrentDomain.BaseDirectory()
    '        Dir = Dir & "_Errores"
    '        If My.Computer.FileSystem.DirectoryExists(Dir) = False Then
    '            My.Computer.FileSystem.CreateDirectory(Dir)
    '        End If
    '        Dir = Dir & "\"

    '        'Crea la informacion del error q se guardara en el archivo *.txt
    '        Msg = ""
    '        Msg = Msg & "----------------------INICIO-ERROR---------------------------------"
    '        Msg = Msg & ENTER
    '        Msg = Msg & "ERROR EN LA PAGINA: '" & Me.Page.ToString & "'"
    '        Msg = Msg & ENTER & ENTER
    '        Msg = Msg & "EN LA MAQUINA: '" & My.User.Name & "'"
    '        Msg = Msg & ENTER & ENTER
    '        Msg = Msg & "APLICACION U OBJETO QUE GENERO EL ERROR:" & ENTER
    '        Msg = Msg & Err.Source & ENTER & ENTER
    '        Msg = Msg & "DESCRIPCION DEL ERROR:" & ENTER
    '        Msg = Msg & Err.Message & ENTER & ENTER
    '        Msg = Msg & "DONDE SE GENERO:" & ENTER
    '        Msg = Msg & Err.StackTrace & ENTER
    '        Msg = Msg & "----------------------FIN-ERROR-------------------------------------"
    '        Msg = Msg & ENTER & ENTER

    '        My.Computer.FileSystem.WriteAllText(Dir & Nom, Msg, True)

    '        Guardar_Error = True
    '    Catch Colmo As Exception
    '        Guardar_Error = False
    '        MsgBox("No se pudo actualizar el registro de errores.", MsgBoxStyle.Critical, "Guardar_Error")
    '    End Try
    'End Function
    'Public Sub SqlErrores(ByVal exception As SqlException, ByVal sql As String)
    '    Dim i As Integer
    '    er.errormsg = "Ejecutando :" & sql & ControlChars.NewLine
    '    For i = 0 To exception.Errors.Count - 1
    '        er.errormsg = er.errormsg & (("Index #" & i & ControlChars.NewLine & _
    '            "Error: " & exception.ToString & ControlChars.NewLine))

    '        '"Source: " & exception.Errors(i).Source & ControlChars.NewLine & _
    '        '"Number: " & exception.Errors(i).Number.ToString() & ControlChars.NewLine & _
    '        '"State: " & exception.Errors(i).State.ToString() & ControlChars.NewLine & _
    '        '"Class: " & exception.Errors(i).Class.ToString() & ControlChars.NewLine & _
    '        '"Server: " & exception.Errors(i).Server & ControlChars.NewLine & _
    '        '"Message: " & exception.Errors(i).Message & ControlChars.NewLine & _
    '        '"Procedure: " & exception.Errors(i).Procedure & ControlChars.NewLine & _
    '        '"LineNumber: " & exception.Errors(i).LineNumber.ToString()))
    '    Next i

    'End Sub


End Class



Public Class oPoliza
    'TONY (en construccion) 21/06/2008
    'Clase para generar el objeto poliza
    'vg tiene que estar inicializada para usarse por la cadena de conexion

    Public coberturas As nCobertura()
    Public excepciones As Exception


    Private cpoliza
    Private fanopol
    Private fmespol
    Private xasegurado



    Public ReadOnly Property renovacion() As String
        Get
            Return cpoliza & "|" & fanopol & "|" & fmespol
        End Get
    End Property
    Public ReadOnly Property Asegurado() As String
        Get
            Return xasegurado.ToString.Trim
        End Get
    End Property

    Public Sub New(ByVal cpoliza As Integer, ByVal fanopol As Integer, ByVal fmespol As Integer)
        Try
            Dim pol As Data.SqlClient.SqlDataReader = VG.EjecutaSQL_reader("select cpoliza,fanopol,fmespol,cnpoliza,xasegurado from adpoliza where cpoliza=" & cpoliza & " and fanopol=" & fanopol & " and fmespol=" & fmespol)
            Dim masDeUnRegistro As Boolean

            While pol.Read()
                If masDeUnRegistro Then Throw New Exception("La consulta ha devuelto mas de un registro")
                Me.cpoliza = pol("cpoliza")
                Me.fanopol = pol("fanopol")
                Me.fmespol = pol("fmespol")
                masDeUnRegistro = True
            End While
            pol.Close()

        Catch ex As Exception
            excepciones = ex
        End Try
    End Sub
    Public Sub New(ByVal cproces As Integer)
        Try
            Dim pol As Data.SqlClient.SqlDataReader = VG.EjecutaSQL_reader("select cpoliza,fanopol,fmespol,cnpoliza,xasegurado from adpoliza where cproces=" & cproces)
            Dim masDeUnRegistro As Boolean

            While pol.Read()
                If masDeUnRegistro Then Throw New Exception("La consulta ha devuelto mas de un registro")
                cpoliza = pol("cpoliza")
                fanopol = pol("fanopol")
                fmespol = pol("fmespol")
                pol.Close()
                masDeUnRegistro = True
            End While

            Dim cobs As Data.SqlClient.SqlDataReader = VG.EjecutaSQL_reader("select * from macoberturas where cpoliza=" & cpoliza & ",fanopol=" & fanopol & ",fmespol=" & fmespol)
            Dim i As Integer
            While cobs.Read
                coberturas(i).ccobertura = cobs("ccobertura")
                coberturas(i).xdescripcion_l = cobs("x_descripcion")
                i += 1
            End While
            cobs.Close()

        Catch ex As Exception
            excepciones = ex
        Finally

        End Try

    End Sub
    Public Sub asignaRecibodeEmision()
        'Tony
        'Asigna suma de recibos de emision a poliza y actualiza los campos de primas de forma acorde
        Try

            Dim polizaADAPTADOR As New DataSet1TableAdapters.adpolizaTableAdapter
            Dim pol As DataSet1.adpolizaDataTable = polizaADAPTADOR.GetData(cpoliza, fanopol, fmespol)

            Dim reciboTA As New CapaDatosTableAdapters.adrecibosTableAdapter
            Dim rec As CapaDatos.adrecibosDataTable = reciboTA.GetDataBycpoliza(cpoliza, fanopol, fmespol)

            Dim i As Integer = 0
            For Each fila As CapaDatos.adrecibosRow In rec


                'pol(0).cultrecibo = crecibo
                pol(0).mabono += fila.mabono
                pol(0).mabonoext += fila.mabonoext
                pol(0).mcobrador += fila.mcobrador
                pol(0).mcobradorext += fila.mcobradorext
                pol(0).mcomision += fila.mcomision
                pol(0).mcomisionext += fila.mcomisionext

                pol(0).mgastos += fila.mgastos
                pol(0).mgastosext += fila.mgastosext
                pol(0).mimpuesto += fila.mimpuesto
                pol(0).mimpuestoext += fila.mimpuestoext
                pol(0).minteres += fila.minteres
                pol(0).minteresext += fila.minteresext
                pol(0).mmontodev += fila.mmontodev
                pol(0).mmontodevext += fila.mmontodevext

                pol(0).mmontopol += fila.mmontorec
                pol(0).mmontopolext += fila.mmontorecext
                pol(0).motrosdes += fila.motrosdes
                pol(0).motrosdesext += fila.motrosdesext
                pol(0).motrosgas += fila.motrosgas
                pol(0).motrosgasext += fila.motrosgasext

                pol(0).motrosrec += fila.motrosrec
                pol(0).motrosrecext += fila.motrosrecext

                pol(0).mpcedida += fila.mpcedida
                pol(0).mpcedidaext += fila.mpcedidaext
                pol(0).mpfp += fila.mpfp
                pol(0).mpfpext += fila.mpfpext
                pol(0).mpret += fila.mpret
                pol(0).mpretext += fila.mpretext
                pol(0).mpridet += fila.mpridet
                'pol(0).mpridetext += fila.mpridetext

                pol(0).mprima += fila.mprima
                pol(0).mprimaext += fila.mprimaext

                pol(0).mprimabruta += fila.mprimabruta
                pol(0).mprimabrutaext += fila.mprimabrutaext

                pol(0).mprimacoa += fila.mprimacoa
                pol(0).mprimacoaext += fila.mprimacoaext
                pol(0).mprimadev += fila.mprimadev
                pol(0).mprimadevext += fila.mprimadevext

                pol(0).msuma = fila.msuma
                pol(0).msumaext = fila.msumaext
                pol(0).msumabruta = fila.msumabruta
                pol(0).msumabrutaext = fila.msumabrutaext
                pol(0).msumacoa = fila.msumacoa
                pol(0).msumacoaext = fila.msumacoaext
                pol(0).msupervisor = fila.msupervisor
                pol(0).msupervisorext = fila.msupervisorext

            Next
            polizaADAPTADOR.Update(pol)


        Catch ex As Exception
            excepciones = ex
        End Try

    End Sub





End Class

Module definicion
    Public asi As New Asidllcon00.wasi
    Public tec As New Asidllcon00.TEC
    Dim wcliente As Double
End Module


Public Class nCobertura
    'TONY (en construccion)
    Public ccobertura As Integer
    Public xdescripcion_l As String


End Class

Public Class GestionEventos
    Inherits sis3.Utilidades.GestionEventos 'Se migro esta clase a SIS3. René 30/10/2009
    'Enum evento
    '    'estos son los codigos de evento
    '    ImportacionClientesCobis = 1
    '    ExportacionArchivoGEA = 2
    '    EmsionDePoliza = 3
    '    ImportacionColectivoVida = 4
    '    AplicionEndoso = 5
    '    Administracion = 6
    'End Enum
    'Enum operaciones
    '    Iniciado = 0
    '    EjecutadoConExito = 1
    '    EmitidoConExito = 2
    '    'Los errores empiezan por 100
    '    ErrorGenerico = 100
    '    ErrorFechas = 101
    '    ErrorCampoNulo = 102

    'End Enum
    'Public Sub RegistraEvento(ByVal codigo_evento As evento, ByVal codigo_operacion As operaciones, ByVal usuario As Integer, Optional ByVal descripcion As String = "")
    '    '---------------------------------------------------------------------------------------
    '    ' Procedimiento : RegistraEvento
    '    ' Uso           :           Siniestros
    '    ' Fecha         :         11/09/2007
    '    ' Autor         :           TONY MAYORAL
    '    ' Proposito     :       Registra evento con codigo en tabla ReqEventos. Puede servir con otra funcion para programarlos. TipoEvento='PU' Puntual 'PR' Programado
    '    ' 
    '    ' Variables del Entorno y funciones dependientes
    '    '               Entrada:
    '    '               Salida:
    '    'Base de Datos
    '    '               Tablas Modificadas: ReqEventos
    '    '---------------------------------------------------------------------------------------
    '    Try
    '        Dim sql As String
    '        sql = "Insert into ReqEventos (CodReqEvento,CodOpRequisito,TipoEvento,DescripcionEv,Resultado,CodUsuarioExeEv,FechaExeEv,fingreso,cusuario) "
    '        sql += "VALUES (" & codigo_evento & "," & codigo_operacion & ",'PU','" & descripcion & "','" & codigo_operacion & "'," & usuario & ",GETDATE(),GETDATE()," & usuario & ")"
    '        EjecutaSQL(sql)
    '    Catch ex As Exception
    '    End Try
    'End Sub
    'Private Function EjecutaSQL(ByVal sql As String) As Integer
    '    'TONY
    '    'devuelve los registros afectados
    '    Dim cn As New Data.SqlClient.SqlConnection(VG.ConnectionStringMundisis)
    '    cn.Open()
    '    Dim cmd As New Data.SqlClient.SqlCommand(sql, cn)
    '    EjecutaSQL = cmd.ExecuteNonQuery
    '    cn.Close()
    'End Function

End Class

Public Class ManejoErrores
    REM Inherits GestionEventos
    Inherits System.Web.UI.UserControl
    Public Shared errornocontrolado As String ' Error del Sistema Se rellena solo
    Public Shared errorpagina As String ' Página del error. Se rellena sola
    Public errormsg As String ' Error del segundo nivel del sistema. Se rellena sola por el manejo del error de sql y otros.
    Public errornumeroasi As String ' Etiqueta Axxis 100 Contabilidad 001 Primera entrada, tag 000 
    Public errorprogramador As String ' Email del programador
    Public errorrutina As String ' Para manejo de la Dll
    Public errorcontrolado As String ' Mensaje de error para el usuario
    Public errorimportancia As String ' Importancia
    Public errormuestra As Boolean ' Manejo en el Load del control
    Public errormaster As MasterPage ' contenedor de la pagina master
    Public Sub MostrarError(ByRef master As MasterPage)
        errormaster = master
        Dim contenido As ContentPlaceHolder
        contenido = errormaster.FindControl("ErrorOnPage")

        Dim myControl1 As Control = CType(LoadControl("WUCerrores.ascx"), Control)

        '  control.ID = "WUCerrores"
        contenido.Controls.Add(myControl1)
        contenido.Visible = True

    End Sub
    Public Sub CerrarError()

        Dim contenido As ContentPlaceHolder
        contenido = errormaster.FindControl("ErrorOnPage")
        contenido.Visible = False
        errormuestra = False

    End Sub
    '    Public Sub CreateEmailItem(ByVal subjectEmail As String, _
    'ByVal toEmail As String, ByVal bodyEmail As String)
    '        Try
    '            Dim myOlApp As New Microsoft.Office.Interop.Outlook.Application
    '            Dim eMail As Microsoft.Office.Interop.Outlook.MailItem = myOlApp.CreateItem _
    '                (Microsoft.Office.Interop.Outlook.OlItemType.olMailItem)
    '            With eMail
    '                .Subject = subjectEmail
    '                .To = toEmail
    '                .Body = bodyEmail
    '                .Importance = Microsoft.Office.Interop.Outlook.OlImportance.olImportanceLow
    '                .Send()
    '            End With
    '        Catch
    '            REM no puedo abrrir el outlook
    '            Messagebox.Show("Me es imposible mandar el correo. copie la pagina y enviela a errores@asiasesores.com gracias por su colaboracion.")
    '            Return
    '        End Try
    '    End Sub


    'Public Sub GrabaBD(ByVal usuario As Integer)
    '    Dim gv As New GestionEventos
    '    gv.RegistraEvento(evento.Administracion, operaciones.ErrorGenerico, usuario, Me.errornumeroasi & "|" & Me.errorprogramador & "|" & Me.errorrutina & "|" & Me.errorcontrolado & "|" & Me.errorimportancia)
    'End Sub

End Class

Public Class ExportExcel
    Public Function exportarExcel(ByVal DT As DataTable, Optional ByVal nombre As String = "Excel", _
                                    Optional ByVal columnas_tipo_txt() As Integer = Nothing, Optional ByVal Ruta As String = "C:\Excel\", _
                                    Optional ByVal Limpiar_Temporales As Boolean = False, Optional ByVal titulo As String = "") As String
        'Aqui creo la ruta completa del archivo + nombre
        Dim Archivo As String = Ruta & nombre & Format(Today.Date, "yyyyMMdd") & Now.Hour & Now.Minute & Now.Second & ".xls"

        If Not columnas_tipo_txt Is Nothing Then
            For j As Integer = 0 To columnas_tipo_txt.Length - 1
                For Each i As DataRow In DT.Rows
                    i.Item(columnas_tipo_txt(j)) = "@" & i.Item(columnas_tipo_txt(j)).ToString.Trim
                Next
            Next
        End If

        Dim GridvieAux As New System.Web.UI.WebControls.GridView

        GridvieAux.AllowPaging = False
        GridvieAux.DataSourceID = Nothing
        GridvieAux.DataSource = DT
        GridvieAux.DataBind()
        GridvieAux.RowHeaderColumn = False
        GridvieAux.EnableViewState = False
        GridvieAux.Caption = titulo
        If DT.Rows.Count = 0 Then
            sis3.gui.msg.nuevo("Ningún registro encontrado", "Notificación")
            Return String.Empty
        End If

        Dim sws As New StringWriter()
        Dim htws As New HtmlTextWriter(sws)
        GridvieAux.RenderControl(htws)


        'Aqui le quito la primera linea que sale en el encabezado
        Dim archivo_temporal As String = sws.ToString() '.Replace("<caption>", "")
        archivo_temporal = archivo_temporal '.Replace("False", "")
        archivo_temporal = archivo_temporal '.Replace("</caption>", "")
        'Aqui le quito los bordes
        archivo_temporal = archivo_temporal '.Replace("border=""1""", "")
        'Aqui pongo formato Numerico
        archivo_temporal = archivo_temporal.Replace("<td>@", "<td STYLE='vnd.ms-excel.numberformat:@'>")
        'Aqui le quito negrita del encabezado
        archivo_temporal = archivo_temporal '.Replace("<th", "<th style=""font-bold:true;""")
        archivo_temporal = archivo_temporal '.Replace("</th>", "</th>")

        Using Flujo As System.IO.StreamWriter = System.IO.File.CreateText(Archivo)
            Flujo.Write(archivo_temporal)
            Flujo.Close()
        End Using

        'Aqui limpio temporales creados hace 30 minutos
        If Limpiar_Temporales Then
            LimpiarTemporales(Ruta)
        End If

        Return Archivo
    End Function

    Public Sub enviarExcel(ByVal DT As DataTable, Optional ByVal nombre As String = "Excel", _
                                    Optional ByVal columnas_tipo_txt() As Integer = Nothing, Optional ByVal titulo As String = "")
        'Aqui creo la ruta completa del archivo + nombre

        If Not columnas_tipo_txt Is Nothing Then
            For j As Integer = 0 To columnas_tipo_txt.Length - 1
                For Each i As DataRow In DT.Rows
                    i.Item(columnas_tipo_txt(j)) = "@" & i.Item(columnas_tipo_txt(j)).ToString.Trim
                Next
            Next
        End If

        Dim GridvieAux As New System.Web.UI.WebControls.GridView

        GridvieAux.AllowPaging = False
        GridvieAux.DataSourceID = Nothing
        GridvieAux.DataSource = DT
        GridvieAux.DataBind()
        GridvieAux.RowHeaderColumn = False
        GridvieAux.EnableViewState = False
        GridvieAux.Caption = titulo

        If DT.Rows.Count = 0 Then
            Notificacion.Mensage("Ningún registro encontrado", "Advertencia", Ext.Net.MessageBox.Icon.WARNING)
            Exit Sub
        End If

        Dim sws As New StringWriter()
        Dim htws As New HtmlTextWriter(sws)
        GridvieAux.RenderControl(htws)

        'Aqui le quito la primera linea que sale en el encabezado
        Dim archivo_temporal As String = sws.ToString() '.Replace("<caption>", "")
        archivo_temporal = archivo_temporal '.Replace("False", "")
        archivo_temporal = archivo_temporal '.Replace("</caption>", "")
        'Aqui le quito los bordes
        archivo_temporal = archivo_temporal '.Replace("border=""1""", "")
        'Aqui pongo formato Numerico
        archivo_temporal = archivo_temporal.Replace("<td>@", "<td STYLE='vnd.ms-excel.numberformat:@'>")
        'Aqui le quito negrita del encabezado
        archivo_temporal = archivo_temporal '.Replace("<th", "<th style=""font-bold:true;""")
        archivo_temporal = archivo_temporal '.Replace("</th>", "</th>")

        HttpContext.Current.Response.Clear()
        HttpContext.Current.Response.AddHeader("content-disposition", "attachment;filename=" & nombre & ".xls")
        HttpContext.Current.Response.Charset = ""
        HttpContext.Current.Response.ContentType = "application/vnd.xls"
        HttpContext.Current.Response.Write(archivo_temporal)
        HttpContext.Current.Response.End()

    End Sub

    Public Function EnviarCliente(ByVal strExcelFile As String, Optional ByVal nombre_archivo As String = "Nuevo1") As Boolean
        Try
            HttpContext.Current.Response.Clear()
            HttpContext.Current.Response.AddHeader("content-disposition", "attachment;filename=" & nombre_archivo & ".xls")
            HttpContext.Current.Response.Charset = ""
            HttpContext.Current.Response.ContentType = "application/vnd.xls"
            HttpContext.Current.Response.WriteFile(strExcelFile)
            HttpContext.Current.Response.End()
            Return True
        Catch exptn As Exception
            Return False
        End Try
    End Function

    ''' <summary>
    ''' Limpia Archivos xls en el disco duro creados 10 min antes
    ''' </summary>
    ''' <returns></returns>
    ''' <remarks></remarks>
    Public Function LimpiarTemporales(Optional ByVal ruta As String = "C:\Excel\") As Boolean
        Dim strFile As String
        Dim directorio As String = ruta
        Try
            For Each strFile In Directory.GetFiles(directorio)
                If File.GetLastAccessTime(strFile) < DateTime.Now.AddMinutes(-30) Then
                    If Not strFile.IndexOf(".xls") < 0 Then
                        File.Delete(strFile)
                    End If
                End If
            Next
            Return True
        Catch exptn As Exception
            Return False
        End Try
    End Function

End Class