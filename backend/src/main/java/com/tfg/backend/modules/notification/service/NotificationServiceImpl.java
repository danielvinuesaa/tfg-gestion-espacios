package com.tfg.backend.modules.notification.service;

import com.tfg.backend.core.config.AppProperties;
import com.tfg.backend.modules.analytics.service.TemplateService;
import com.tfg.backend.modules.notification.dto.NotificationDTO;
import com.tfg.backend.modules.notification.dto.NotificationPreferenceDTO;
import com.tfg.backend.modules.notification.mapper.NotificationMapper;
import com.tfg.backend.modules.notification.model.Notification;
import com.tfg.backend.modules.notification.model.NotificationPreference;
import com.tfg.backend.modules.notification.model.NotificationType;
import com.tfg.backend.modules.notification.repository.NotificationRepository;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Implementación del servicio de notificaciones.
 * Gestiona la creación, persistencia, envío (incluyendo notificaciones por correo electrónico)
 * y administración de las notificaciones y preferencias de los usuarios.
 * Utiliza DTOs para la transferencia de datos y un servicio externo de plantillas para conformar los mensajes.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    /** Repositorio de notificaciones. */
    private final NotificationRepository notificationRepository;
    /** Repositorio de usuarios. */
    private final UserRepository userRepository;
    /** Servicio de correo electrónico. */
    private final EmailService emailService;
    /** Servicio de plantillas. */
    private final TemplateService templateService;
    /** Mapeador de notificaciones. */
    private final NotificationMapper notificationMapper;
    /** Propiedades de la aplicación. */
    private final AppProperties appProperties;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Notification createNotification(User user, String message, String type, String actionPath, Long reservationId) {
        NotificationType nType = parseNotificationType(type);
        NotificationPreference prefs = user.getNotificationPreference();

        boolean shouldSendInternal = isInternalEnabled(prefs, nType);
        boolean shouldSendEmail = isEmailEnabled(prefs, nType);

        Notification saved = null;
        if (shouldSendInternal) {
            saved = persistNotification(user, message, nType, actionPath, reservationId);
        }

        if (shouldSendEmail) {
            sendNotificationEmail(user.getEmail(), nType, message, actionPath);
        }

        return saved;
    }

    /**
     * Parsea el tipo de notificación.
     *
     * @param type Tipo en formato cadena
     * @return Tipo de notificación
     */
    private NotificationType parseNotificationType(String type) {
        try {
            return NotificationType.valueOf(type.toUpperCase());
        } catch (Exception e) {
            log.warn("Tipo de notificación desconocido: {}. Usando SISTEMA.", type);
            return NotificationType.SISTEMA;
        }
    }

    /**
     * Comprueba si la notificación interna está activada.
     *
     * @param prefs Preferencias
     * @param type Tipo de notificación
     * @return true si está activada
     */
    private boolean isInternalEnabled(NotificationPreference prefs, NotificationType type) {
        if (prefs == null) return true;
        return switch (type) {
            case RESERVA_CREADA -> prefs.isInternalOnCreated();
            case RESERVA_APROBADA, RESERVA_RECHAZADA, RESERVA_CANCELADA, RESERVA_ACTUALIZADA -> prefs.isInternalOnStatusChange();
            case RECORDATORIO -> prefs.isInternalOnReminder();
            case RECORDATORIO_APROBACION -> prefs.isInternalOnApprovalReminder();
            default -> prefs.isInternalOnSystem();
        };
    }

    /**
     * Comprueba si la notificación por correo está activada.
     *
     * @param prefs Preferencias
     * @param type Tipo de notificación
     * @return true si está activada
     */
    private boolean isEmailEnabled(NotificationPreference prefs, NotificationType type) {
        if (prefs == null) return false;
        return switch (type) {
            case RESERVA_CREADA -> prefs.isEmailOnCreated();
            case RESERVA_APROBADA, RESERVA_RECHAZADA, RESERVA_CANCELADA, RESERVA_ACTUALIZADA -> prefs.isEmailOnStatusChange();
            case RECORDATORIO -> prefs.isEmailOnReminder();
            case RECORDATORIO_APROBACION -> prefs.isEmailOnApprovalReminder();
            default -> prefs.isEmailOnSystem();
        };
    }

    /**
     * Persiste una notificación en base de datos.
     *
     * @param user Usuario
     * @param message Mensaje
     * @param type Tipo
     * @param path Ruta
     * @param resId ID de reserva
     * @return Notificación guardada
     */
    private Notification persistNotification(User user, String message, NotificationType type, String path, Long resId) {
        return notificationRepository.save(Notification.builder()
                .user(user)
                .content(message)
                .type(type)
                .read(false)
                .actionPath(path)
                .reservationId(resId)
                .build());
    }

    /**
     * Envía un correo electrónico de notificación.
     *
     * @param email Correo
     * @param type Tipo
     * @param message Mensaje
     * @param path Ruta
     */
    private void sendNotificationEmail(String email, NotificationType type, String message, String path) {
        String typeLabel = type.name().replace("_", " ").toLowerCase();
        String subject = "Uniovi Espacios: Nueva notificación de " + typeLabel;
        
        // Delegación de la generación visual en el servicio de plantillas
        String fullPath = (path != null && !path.isEmpty()) ? appProperties.getFrontendUrl() + path : null;
        String htmlContent = templateService.generateNotificationHtml(type, message, fullPath);
        
        try {
            emailService.sendHtmlEmail(email, subject, htmlContent);
        } catch (Exception e) {
            log.error("Error enviando email de notificación a {}: {}", email, e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationDTO> getNotificationsByUser(User user) {
        return notificationMapper.toDtoList(notificationRepository.findByUserOrderByCreatedAtDesc(user));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationDTO> getMyNotifications(User user, Pageable pageable) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user, pageable)
                .map(notificationMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(User user) {
        return notificationRepository.countByUserAndReadFalse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationPreferenceDTO getPreferences(User user) {
        NotificationPreference prefs = user.getNotificationPreference();
        if (prefs == null) {
            prefs = new NotificationPreference();
        }
        return notificationMapper.toDto(prefs);
    }

    @Override
    @Transactional
    public NotificationPreferenceDTO updatePreferences(User user, NotificationPreferenceDTO newPrefs) {
        NotificationPreference existing = user.getNotificationPreference();
        if (existing == null) {
            existing = new NotificationPreference();
            user.setNotificationPreference(existing);
        }

        notificationMapper.updateEntityFromDto(newPrefs, existing);
        userRepository.save(user);
        return notificationMapper.toDto(existing);
    }

    @Override
    @Transactional
    public void resetPreferences(User user) {
        NotificationPreference existing = user.getNotificationPreference();
        if (existing == null) {
            existing = new NotificationPreference();
            user.setNotificationPreference(existing);
        }
        existing.resetToDefaults();
        userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public Notification findByIdEntity(Long id) {
        return notificationRepository.findById(id)
                .orElseThrow(() -> new com.tfg.backend.core.exception.ResourceNotFoundException("Notificación", "id", id));
    }

    @Override
    @Transactional
    public void markAsRead(Long id) {
        Notification n = findByIdEntity(id);
        n.setRead(true);
        notificationRepository.save(n);
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId, User user) {
        Notification notification = findByIdEntity(notificationId);
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("No tienes permiso para marcar como leída esta notificación.");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(User user) {
        List<Notification> unread = notificationRepository.findByUserAndReadFalse(user);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    @Override
    @Transactional
    public void deleteNotification(Long id) {
        notificationRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void deleteNotification(Long id, User user) {
        Notification notification = findByIdEntity(id);
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("No tienes permiso para eliminar esta notificación.");
        }
        notificationRepository.delete(notification);
    }

    @Override
    @Transactional
    public void clearAllNotifications(User user) {
        notificationRepository.deleteAll(notificationRepository.findByUserOrderByCreatedAtDesc(user));
    }
}
