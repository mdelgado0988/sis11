Imports Microsoft.VisualBasic
Imports Ext.Net

Public Class Notificacion

    Shared id As Integer

    Public Enum Tipo

        Notificacion
        Advertencia
        Peligro
        NotificacionPersistente
        AdvertenciaPersistente
        PeligroPersistente
        Persistente

    End Enum

    Public Shared Sub Notificar(ByVal Message As String, Optional ByVal Tipo As Tipo = Tipo.Notificacion)

        Dim NotificationConfig As New NotificationConfig

        Select Case Tipo

            Case Notificacion.Tipo.Notificacion

                NotificationConfig.Title = "Notificación"
                NotificationConfig.Icon = Icon.Information
                NotificationConfig.Html = Message
                NotificationConfig.AutoHide = True
                NotificationConfig.Draggable = True

            Case Notificacion.Tipo.Advertencia

                NotificationConfig.Title = "Peligro"
                NotificationConfig.Icon = Icon.Error
                NotificationConfig.Html = Message
                NotificationConfig.AutoHide = True
                NotificationConfig.Draggable = True

            Case Notificacion.Tipo.Peligro

                NotificationConfig.Title = "Error"
                NotificationConfig.Icon = Icon.Decline
                NotificationConfig.Html = Message
                NotificationConfig.AutoHide = True
                NotificationConfig.Draggable = True

            Case Notificacion.Tipo.NotificacionPersistente

                NotificationConfig.Title = "Notificación"
                NotificationConfig.Icon = Icon.Information
                NotificationConfig.Html = Message
                NotificationConfig.AutoHide = False
                NotificationConfig.Draggable = True

            Case Notificacion.Tipo.AdvertenciaPersistente

                NotificationConfig.Title = "Peligro"
                NotificationConfig.Icon = Icon.Error
                NotificationConfig.Html = Message
                NotificationConfig.AutoHide = False
                NotificationConfig.Draggable = True

            Case Notificacion.Tipo.PeligroPersistente

                NotificationConfig.Title = "Error"
                NotificationConfig.Icon = Icon.Decline
                NotificationConfig.Html = Message
                NotificationConfig.AutoHide = False
                NotificationConfig.Draggable = True

        End Select

        Notification.Show(NotificationConfig)

    End Sub

    Public Shared Sub Notificar(ByVal Message As String, ByVal Title As String, Optional ByVal Tipo As Tipo = Tipo.Notificacion)

        Dim NotificationConfig As New NotificationConfig

        Select Case Tipo

            Case Notificacion.Tipo.Notificacion

                NotificationConfig.Title = Title
                NotificationConfig.Icon = Icon.Information
                NotificationConfig.Html = Message
                NotificationConfig.AutoHide = True
                NotificationConfig.Draggable = True

            Case Notificacion.Tipo.Advertencia

                NotificationConfig.Title = Title
                NotificationConfig.Icon = Icon.Error
                NotificationConfig.Html = Message
                NotificationConfig.AutoHide = True
                NotificationConfig.Draggable = True

            Case Notificacion.Tipo.Peligro

                NotificationConfig.Title = Title
                NotificationConfig.Icon = Icon.Decline
                NotificationConfig.Html = Message
                NotificationConfig.AutoHide = True
                NotificationConfig.Draggable = True

            Case Notificacion.Tipo.NotificacionPersistente

                NotificationConfig.Title = Title
                NotificationConfig.Icon = Icon.Information
                NotificationConfig.Html = Message
                NotificationConfig.AutoHide = False
                NotificationConfig.Draggable = True

            Case Notificacion.Tipo.AdvertenciaPersistente

                NotificationConfig.Title = Title
                NotificationConfig.Icon = Icon.Error
                NotificationConfig.Html = Message
                NotificationConfig.AutoHide = False
                NotificationConfig.Draggable = True

            Case Notificacion.Tipo.PeligroPersistente

                NotificationConfig.Title = Title
                NotificationConfig.Icon = Icon.Decline
                NotificationConfig.Html = Message
                NotificationConfig.AutoHide = False
                NotificationConfig.Draggable = True

        End Select

        Notification.Show(NotificationConfig)

    End Sub

    Public Shared Sub Notificar(ByVal Message As String, ByVal Title As String, ByVal Icon As Ext.Net.Icon, Optional ByVal Tipo As Tipo = Tipo.Notificacion)

        Dim NotificationConfig As New NotificationConfig

        NotificationConfig.Title = Title
        NotificationConfig.Icon = Icon
        NotificationConfig.Html = Message

        Select Case Tipo

            Case Notificacion.Tipo.Persistente

                NotificationConfig.AutoHide = False
                NotificationConfig.Draggable = True

            Case Else

                NotificationConfig.AutoHide = True
                NotificationConfig.Draggable = True

        End Select

        Notification.Show(NotificationConfig)

    End Sub

    Public Shared Sub Mensage(ByVal Message As String)

        Dim MessageBoxConfig As New MessageBoxConfig

        MessageBoxConfig.Message = Message
        MessageBoxConfig.Title = "Mensaje"
        MessageBoxConfig.Icon = Ext.Net.MessageBox.Icon.INFO
        MessageBoxConfig.Buttons = Ext.Net.MessageBox.Button.OK

        X.Msg.Show(MessageBoxConfig)

    End Sub

    Public Shared Sub Mensage(ByVal Message As String, ByVal Title As String)

        Dim MessageBoxConfig As New MessageBoxConfig

        MessageBoxConfig.Message = Message
        MessageBoxConfig.Title = Title
        MessageBoxConfig.Icon = Ext.Net.MessageBox.Icon.INFO
        MessageBoxConfig.Buttons = Ext.Net.MessageBox.Button.OK

        X.Msg.Show(MessageBoxConfig)

    End Sub

    Public Shared Sub Mensage(ByVal Message As String, ByVal Title As String, ByVal Icon As Ext.Net.MessageBox.Icon)

        Dim MessageBoxConfig As New MessageBoxConfig

        MessageBoxConfig.Message = Message
        MessageBoxConfig.Title = Title
        MessageBoxConfig.Icon = Icon
        MessageBoxConfig.Buttons = Ext.Net.MessageBox.Button.OK

        X.Msg.Show(MessageBoxConfig)

    End Sub

    Public Shared Sub Mensage(ByVal Message As String, ByVal Title As String, ByVal Icon As Ext.Net.MessageBox.Icon, ByVal Button As Ext.Net.MessageBox.Button)

        Dim MessageBoxConfig As New MessageBoxConfig

        MessageBoxConfig.Message = Message
        MessageBoxConfig.Title = Title
        MessageBoxConfig.Icon = Icon
        MessageBoxConfig.Buttons = Button

        X.Msg.Show(MessageBoxConfig)

    End Sub

    Public Shared Sub muestra_reporte(ByVal ruta As String, ByVal titulo As String, ByVal ancho As Integer, _
                               ByVal alto As Integer, ByVal modal As Boolean, ByVal colapsible As Boolean)
        Try


            Dim configuracion As New Ext.Net.Window.Config

            With configuracion
                .Title = titulo
                .Width = ancho
                .Height = alto
                .Modal = modal
                .Collapsible = colapsible
                .Closable = True
                .CloseAction = CloseAction.Close
                .Maximizable = True
                .Resizable = True
            End With

            Dim win As New Window(configuracion)

            id = id + 1

            win.ID = id
            win.AutoLoad.ShowMask = True
            win.AutoLoad.MaskMsg = "Cargando"
            win.AutoLoad.Url = ruta
            win.AutoLoad.Mode = LoadMode.IFrame
            win.Render(True)
            win.Show()

        Catch ex As Exception

        End Try
    End Sub

End Class