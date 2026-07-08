package com.tfg.backend.modules.notification.service;

import com.tfg.backend.core.config.AppProperties;
import com.tfg.backend.modules.analytics.service.TemplateService;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.notification.model.Notification;
import com.tfg.backend.modules.notification.model.NotificationPreference;
import com.tfg.backend.modules.notification.model.NotificationType;
import com.tfg.backend.modules.notification.repository.NotificationRepository;
import com.tfg.backend.modules.notification.mapper.NotificationMapper;
import com.tfg.backend.modules.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Suite de pruebas unitarias para la implementación del servicio de notificaciones (NotificationServiceImpl).
 * Verifica la lógica de creación, lectura, borrado y gestión de preferencias de notificaciones,
 * así como el correcto funcionamiento del envío de correos electrónicos en base a dichas preferencias.
 */
@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private NotificationMapper notificationMapper;
    @Mock
    private EmailService emailService;
    @Mock
    private TemplateService templateService;

    @Spy
    private AppProperties appProperties = new AppProperties();

    @InjectMocks
    private NotificationServiceImpl notificationService;

    @BeforeEach
    void setUp() {
        appProperties.setFrontendUrl("http://test-url");
    }

    /**
     * Verifica que se genere tanto la notificación interna (persistencia en BD) como el correo electrónico
     * cuando ambas opciones están habilitadas en las preferencias del usuario para un evento específico.
     * Precondiciones: El usuario tiene activas ambas preferencias para la creación de reservas.
     * Ejecución: Se llama a createNotification.
     * Aserciones: La notificación se guarda en el repositorio y se invoca el servicio de envío de correos.
     */
    @Test
    void createNotification_WhenBothInternalAndEmailEnabled_ShouldPersistAndSendEmail() {
        // Arrange
        NotificationPreference prefs = new NotificationPreference();
        prefs.setInternalOnCreated(true);
        prefs.setEmailOnCreated(true);
        
        User user = User.builder().email("test@uniovi.es").notificationPreference(prefs).build();
        
        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> i.getArgument(0));
        when(templateService.generateNotificationHtml(any(), anyString(), anyString())).thenReturn("<html></html>");

        // Act
        Notification result = notificationService.createNotification(user, "Test Message", "RESERVA_CREADA", "/path", 1L);

        // Assert
        assertNotNull(result);
        verify(notificationRepository).save(any(Notification.class));
        verify(emailService).sendHtmlEmail(eq("test@uniovi.es"), anyString(), eq("<html></html>"));
    }

    /**
     * Verifica que solo se guarde la notificación en el sistema (sin enviar correo) cuando el usuario
     * tiene habilitada únicamente la notificación interna para un evento.
     * Precondiciones: El usuario tiene activa la preferencia interna, pero desactivada la de email.
     * Ejecución: Se llama a createNotification.
     * Aserciones: La notificación se guarda, pero el servicio de email no se invoca.
     */
    @Test
    void createNotification_WhenOnlyInternalEnabled_ShouldPersistOnly() {
        // Arrange
        NotificationPreference prefs = new NotificationPreference();
        prefs.setInternalOnCreated(true);
        prefs.setEmailOnCreated(false);
        
        User user = User.builder().email("test@uniovi.es").notificationPreference(prefs).build();
        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        Notification result = notificationService.createNotification(user, "Test Message", "RESERVA_CREADA", "/path", 1L);

        // Assert
        assertNotNull(result);
        verify(notificationRepository).save(any(Notification.class));
        verify(emailService, never()).sendHtmlEmail(anyString(), anyString(), anyString());
    }

    /**
     * Verifica que solo se envíe el correo electrónico sin persistir una notificación interna,
     * en caso de que el usuario haya configurado sus preferencias de esta manera.
     * Precondiciones: El usuario tiene desactivada la preferencia interna, pero activada la de email.
     * Ejecución: Se llama a createNotification.
     * Aserciones: La notificación no se guarda en BD, pero sí se invoca el servicio de email. Retorna null.
     */
    @Test
    void createNotification_WhenOnlyEmailEnabled_ShouldSendEmailOnly() {
        // Arrange
        NotificationPreference prefs = new NotificationPreference();
        prefs.setInternalOnCreated(false);
        prefs.setEmailOnCreated(true);
        
        User user = User.builder().email("test@uniovi.es").notificationPreference(prefs).build();
        when(templateService.generateNotificationHtml(any(), anyString(), anyString())).thenReturn("<html></html>");

        // Act
        Notification result = notificationService.createNotification(user, "Test Message", "RESERVA_CREADA", "/path", 1L);

        // Assert
        assertNull(result);
        verify(notificationRepository, never()).save(any(Notification.class));
        verify(emailService).sendHtmlEmail(eq("test@uniovi.es"), anyString(), eq("<html></html>"));
    }

    /**
     * Verifica que una notificación se marque correctamente como leída dado su ID.
     * Precondiciones: La notificación existe en el sistema y está como no leída.
     * Ejecución: Se llama a markAsRead(id).
     * Aserciones: El estado 'read' de la notificación cambia a true y se guarda.
     */
    @Test
    void markAsRead_WhenNotificationExists_ShouldUpdateStatus() {
        // Arrange
        Notification n = Notification.builder().id(1L).read(false).build();
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(n));

        // Act
        notificationService.markAsRead(1L);

        // Assert
        assertTrue(n.isRead());
        verify(notificationRepository).save(n);
    }

    /**
     * Verifica que un usuario pueda marcar como leída una notificación que le pertenece.
     * Precondiciones: La notificación existe y está asignada al usuario proporcionado.
     * Ejecución: Se llama a markAsRead(id, user).
     * Aserciones: El estado cambia a true y se actualiza en BD.
     */
    @Test
    void markAsRead_WithUser_WhenOwner_ShouldUpdateStatus() {
        // Arrange
        User user = User.builder().id(1L).build();
        Notification n = Notification.builder().id(10L).user(user).read(false).build();
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(n));

        // Act
        notificationService.markAsRead(10L, user);

        // Assert
        assertTrue(n.isRead());
        verify(notificationRepository).save(n);
    }

    /**
     * Verifica que se lance una excepción de acceso denegado si un usuario intenta marcar como leída
     * una notificación que pertenece a otro usuario.
     * Precondiciones: La notificación pertenece a un usuario diferente al que realiza la petición.
     * Ejecución: Se llama a markAsRead(id, otherUser).
     * Aserciones: Se lanza AccessDeniedException y no se realizan cambios en BD.
     */
    @Test
    void markAsRead_WithUser_WhenNotOwner_ShouldThrowException() {
        // Arrange
        User owner = User.builder().id(1L).build();
        User other = User.builder().id(2L).build();
        Notification n = Notification.builder().id(10L).user(owner).build();
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(n));

        // Act & Assert
        assertThrows(org.springframework.security.access.AccessDeniedException.class, 
                () -> notificationService.markAsRead(10L, other));
        verify(notificationRepository, never()).save(any());
    }

    /**
     * Verifica que un usuario pueda eliminar una notificación propia de forma exitosa.
     * Precondiciones: La notificación pertenece al usuario solicitante.
     * Ejecución: Se llama a deleteNotification(id, user).
     * Aserciones: Se invoca el método delete del repositorio.
     */
    @Test
    void deleteNotification_WithUser_WhenOwner_ShouldDelete() {
        // Arrange
        User user = User.builder().id(1L).build();
        Notification n = Notification.builder().id(10L).user(user).build();
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(n));

        // Act
        notificationService.deleteNotification(10L, user);

        // Assert
        verify(notificationRepository).delete(n);
    }

    /**
     * Verifica que el sistema impida la eliminación de una notificación por parte de un usuario que no es el propietario.
     * Precondiciones: La notificación pertenece a otro usuario.
     * Ejecución: Se llama a deleteNotification(id, otherUser).
     * Aserciones: Se lanza AccessDeniedException y la eliminación no se lleva a cabo.
     */
    @Test
    void deleteNotification_WithUser_WhenNotOwner_ShouldThrowException() {
        // Arrange
        User owner = User.builder().id(1L).build();
        User other = User.builder().id(2L).build();
        Notification n = Notification.builder().id(10L).user(owner).build();
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(n));

        // Act & Assert
        assertThrows(org.springframework.security.access.AccessDeniedException.class, 
                () -> notificationService.deleteNotification(10L, other));
        verify(notificationRepository, never()).delete(any());
    }

    /**
     * Verifica que si se proporciona un tipo de notificación desconocido, el sistema lo asigne por defecto
     * al tipo genérico de 'SISTEMA'.
     * Precondiciones: Se invoca createNotification con un string de tipo inválido.
     * Ejecución: Se crea la notificación internamente.
     * Aserciones: El tipo de la notificación resultante es NotificationType.SISTEMA.
     */
    @Test
    void parseNotificationType_WhenInvalidType_ShouldDefaultToSystem() {
        // NotificationServiceImpl has internal methods that are called by public ones.
        // We test this via createNotification with invalid type string.
        
        NotificationPreference prefs = new NotificationPreference();
        prefs.setInternalOnSystem(true); // Default behavior for unknown types is SYSTEM
        User user = User.builder().notificationPreference(prefs).build();
        
        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        Notification result = notificationService.createNotification(user, "Msg", "INVALID_TYPE", null, null);

        // Assert
        assertEquals(NotificationType.SISTEMA, result.getType());
    }

    /**
     * Verifica la funcionalidad de marcar todas las notificaciones pendientes de un usuario como leídas.
     * Precondiciones: El usuario tiene múltiples notificaciones no leídas.
     * Ejecución: Se llama a markAllAsRead.
     * Aserciones: Todas las notificaciones devueltas cambian su estado a leídas y se guardan en masa.
     */
    @Test
    void markAllAsRead_ShouldUpdateUnreadList() {
        User user = new User();
        Notification n1 = Notification.builder().read(false).build();
        Notification n2 = Notification.builder().read(false).build();
        
        when(notificationRepository.findByUserAndReadFalse(user)).thenReturn(List.of(n1, n2));

        notificationService.markAllAsRead(user);

        assertTrue(n1.isRead());
        assertTrue(n2.isRead());
        verify(notificationRepository).saveAll(anyList());
    }

    /**
     * Verifica que la funcionalidad de limpiar todas las notificaciones elimine la lista completa
     * asociada a un usuario.
     * Precondiciones: El usuario tiene un historial de notificaciones.
     * Ejecución: Se llama a clearAllNotifications.
     * Aserciones: Se invoca deleteAll sobre las notificaciones del usuario.
     */
    @Test
    void clearAllNotifications_ShouldDeleteEverything() {
        User user = new User();
        Notification n1 = new Notification();
        when(notificationRepository.findByUserOrderByCreatedAtDesc(user)).thenReturn(List.of(n1));

        notificationService.clearAllNotifications(user);

        verify(notificationRepository).deleteAll(anyList());
    }

    /**
     * Verifica el comportamiento por defecto cuando un usuario no tiene preferencias de notificación explícitas.
     * Precondiciones: El usuario tiene notificationPreference en null.
     * Ejecución: Se llama a createNotification.
     * Aserciones: Se crea una notificación interna (default) pero no se envían correos electrónicos.
     */
    @Test
    void createNotification_WhenPrefsNull_ShouldDefaultToInternalOnly() {
        User user = User.builder().email("test@uniovi.es").notificationPreference(null).build();
        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> i.getArgument(0));

        Notification result = notificationService.createNotification(user, "Msg", "SISTEMA", null, null);

        assertNotNull(result);
        verify(notificationRepository).save(any());
        verify(emailService, never()).sendHtmlEmail(any(), any(), any());
    }

    /**
     * Verifica la cobertura de la lógica de evaluación de preferencias sobre diferentes tipos de eventos
     * (aprobaciones, rechazos, actualizaciones, recordatorios, etc.).
     * Precondiciones: El usuario tiene preferencias mixtas configuradas para múltiples tipos.
     * Ejecución: Se itera llamando a createNotification para varios tipos.
     * Aserciones: El número de guardados y envíos de correo coincide con la lógica de las preferencias.
     */
    @Test
    void createNotification_AllTypesCoverage() {
        NotificationPreference prefs = new NotificationPreference();
        prefs.setInternalOnStatusChange(true);
        prefs.setEmailOnStatusChange(true);
        prefs.setInternalOnReminder(true);
        prefs.setInternalOnApprovalReminder(true);
        
        User user = User.builder().notificationPreference(prefs).build();
        
        when(notificationRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(templateService.generateNotificationHtml(any(), any(), any())).thenReturn("html");

        // Test status change types
        String[] statusTypes = {"RESERVA_APROBADA", "RESERVA_RECHAZADA", "RESERVA_CANCELADA", "RESERVA_ACTUALIZADA"};
        for (String type : statusTypes) {
            notificationService.createNotification(user, "Msg", type, null, null);
        }
        
        // Test reminder types
        notificationService.createNotification(user, "Msg", "RECORDATORIO", null, null);
        notificationService.createNotification(user, "Msg", "RECORDATORIO_APROBACION", null, null);

        verify(notificationRepository, times(6)).save(any());
        verify(emailService, times(4)).sendHtmlEmail(any(), any(), any());
    }

    /**
     * Verifica que las preferencias de un usuario puedan ser actualizadas correctamente a partir de un DTO.
     * Precondiciones: El usuario tiene preferencias existentes y se provee un nuevo DTO con cambios.
     * Ejecución: Se llama a updatePreferences.
     * Aserciones: El mapper actualiza la entidad y se guarda el usuario.
     */
    @Test
    void updatePreferences_ShouldWork() {
        User user = new User();
        NotificationPreference existing = new NotificationPreference();
        user.setNotificationPreference(existing);
        
        com.tfg.backend.modules.notification.dto.NotificationPreferenceDTO dto = new com.tfg.backend.modules.notification.dto.NotificationPreferenceDTO();
        dto.setEmailOnCreated(true);
        
        // Since notificationMapper is a mock, we just verify it's called
        notificationService.updatePreferences(user, dto);
        
        verify(notificationMapper).updateEntityFromDto(dto, existing);
        verify(userRepository).save(user);
    }

    /**
     * Verifica el reinicio de las preferencias a sus valores predeterminados (típicamente false para correos
     * y true para internos, dependiendo de la inicialización).
     * Precondiciones: El usuario tiene preferencias modificadas.
     * Ejecución: Se llama a resetPreferences.
     * Aserciones: Los valores se restablecen a la configuración por defecto de NotificationPreference.
     */
    @Test
    void resetPreferences_ShouldWork() {
        User user = new User();
        NotificationPreference existing = new NotificationPreference();
        existing.setEmailOnCreated(true);
        user.setNotificationPreference(existing);
        
        notificationService.resetPreferences(user);
        
        assertFalse(existing.isEmailOnCreated());
    }
    // --- PU-NOT-04: Ambos canales desactivados ---
    /**
     * Verifica que no se realice ninguna acción si el usuario tiene desactivados ambos canales (interno y correo)
     * para el tipo de notificación dado.
     * Precondiciones: Las preferencias tienen false en ambas propiedades para el evento.
     * Ejecución: Se llama a createNotification.
     * Aserciones: Retorna null y no se interactúa ni con el repositorio ni con el servicio de email.
     */
    @Test
    @DisplayName("✅ PU-NOT-04: Ambos canales desactivados retorna null sin ninguna operación")
    void createNotification_WhenBothDisabled_ShouldReturnNull() {
        NotificationPreference prefs = new NotificationPreference();
        prefs.setInternalOnCreated(false);
        prefs.setEmailOnCreated(false);
        User user = User.builder().notificationPreference(prefs).build();

        Notification result = notificationService.createNotification(user, "Msg", "RESERVA_CREADA", null, null);

        assertNull(result);
        verify(notificationRepository, never()).save(any());
        verify(emailService, never()).sendHtmlEmail(any(), any(), any());
    }

    // --- PU-NOT-07: Fallo SMTP no se propaga ---
    /**
     * Verifica que un fallo al enviar el correo electrónico (ej. servidor SMTP caído) sea manejado
     * internamente y no interrumpa el flujo principal de ejecución ni impida guardar la notificación interna.
     * Precondiciones: El servicio de email está programado para lanzar una excepción.
     * Ejecución: Se llama a createNotification con email habilitado.
     * Aserciones: La excepción no se propaga, pero la notificación interna sí se guarda.
     */
    @Test
    @DisplayName("✅ PU-NOT-07: Excepción del servidor SMTP es capturada y no se propaga")
    void createNotification_WhenEmailFails_ShouldNotPropagate() {
        NotificationPreference prefs = new NotificationPreference();
        prefs.setInternalOnCreated(true);
        prefs.setEmailOnCreated(true);
        User user = User.builder().email("test@uniovi.es").notificationPreference(prefs).build();

        when(notificationRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(templateService.generateNotificationHtml(any(), anyString(), anyString())).thenReturn("<html></html>");
        doThrow(new RuntimeException("SMTP error")).when(emailService).sendHtmlEmail(anyString(), anyString(), anyString());

        // No debe lanzar excepción al llamador
        assertDoesNotThrow(() ->
                notificationService.createNotification(user, "Msg", "RESERVA_CREADA", "/path", 1L));
        verify(notificationRepository).save(any()); // La notificación interna sí se guarda
    }

    // --- PU-NOT-08: Ruta de acción null no genera URL ---
    /**
     * Verifica que si no se provee una ruta de acción (actionPath), la notificación resultante no
     * tenga configurada la URL de acción en el sistema.
     * Precondiciones: Se crea una notificación donde actionPath es null.
     * Ejecución: Se llama a createNotification.
     * Aserciones: El actionPath de la notificación es null.
     */
    @Test
    @DisplayName("✅ PU-NOT-08: actionPath null crea notificación sin URL de acción")
    void createNotification_WhenActionPathNull_ShouldHaveNullUrl() {
        NotificationPreference prefs = new NotificationPreference();
        prefs.setInternalOnCreated(true);
        prefs.setEmailOnCreated(false);
        User user = User.builder().notificationPreference(prefs).build();

        when(notificationRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        Notification result = notificationService.createNotification(user, "Msg", "RESERVA_CREADA", null, null);

        assertNotNull(result);
        assertNull(result.getActionPath());
    }

    // --- PU-NOT-12: Eliminación simple por ID (sin usuario) ---
    /**
     * Verifica la funcionalidad de borrado directo por identificador sin comprobación de propiedad,
     * generalmente usada por administradores o procesos internos.
     * Precondiciones: Ninguna.
     * Ejecución: Se llama a deleteNotification solo con ID.
     * Aserciones: Se invoca deleteById en el repositorio.
     */
    @Test
    @DisplayName("✅ PU-NOT-12: Eliminación por ID sin usuario llama a deleteById directamente")
    void deleteNotification_ById_ShouldCallDeleteById() {
        notificationService.deleteNotification(42L);
        verify(notificationRepository).deleteById(42L);
    }

    // --- PU-NOT-18: Preferencias null crean objeto al consultar ---
    /**
     * Verifica que al solicitar las preferencias de un usuario que no tiene ninguna configurada,
     * el servicio devuelva un objeto DTO con los valores por defecto en lugar de null.
     * Precondiciones: El usuario tiene notificationPreference a null.
     * Ejecución: Se llama a getPreferences.
     * Aserciones: Retorna un DTO de preferencias válido y no nulo.
     */
    @Test
    @DisplayName("✅ PU-NOT-18: getPreferences con prefs null crea y retorna objeto por defecto")
    void getPreferences_WhenPrefsNull_ShouldCreateDefault() {
        User user = User.builder().notificationPreference(null).build();
        when(notificationMapper.toDto(any(NotificationPreference.class))).thenReturn(new com.tfg.backend.modules.notification.dto.NotificationPreferenceDTO());
        com.tfg.backend.modules.notification.dto.NotificationPreferenceDTO result = notificationService.getPreferences(user);
        assertNotNull(result);
    }

    // --- PU-NOT-19: Preferencias null crean objeto al actualizar ---
    /**
     * Verifica que al actualizar las preferencias de un usuario que aún no las tiene, se inicialice
     * correctamente el objeto entidad antes de aplicar los datos provenientes del DTO.
     * Precondiciones: El usuario no tiene preferencias establecidas.
     * Ejecución: Se llama a updatePreferences con un DTO válido.
     * Aserciones: El objeto de preferencias se inicializa en el usuario y se guarda.
     */
    @Test
    @DisplayName("✅ PU-NOT-19: updatePreferences con prefs null crea objeto antes de aplicar DTO")
    void updatePreferences_WhenPrefsNull_ShouldCreateNewPrefs() {
        User user = User.builder().notificationPreference(null).build();
        com.tfg.backend.modules.notification.dto.NotificationPreferenceDTO dto =
                new com.tfg.backend.modules.notification.dto.NotificationPreferenceDTO();

        notificationService.updatePreferences(user, dto);

        assertNotNull(user.getNotificationPreference());
        verify(userRepository).save(user);
    }
}
