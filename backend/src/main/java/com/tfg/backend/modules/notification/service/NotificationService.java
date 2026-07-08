package com.tfg.backend.modules.notification.service;
import com.tfg.backend.modules.notification.dto.NotificationDTO;
import com.tfg.backend.modules.notification.dto.NotificationPreferenceDTO;
import com.tfg.backend.modules.notification.model.Notification;
import com.tfg.backend.modules.identity.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Interfaz que define los contratos para el servicio de notificaciones.
 * Proporciona métodos para la creación, consulta y gestión de notificaciones,
 * así como para la administración de las preferencias de notificación de los usuarios.
 */
public interface NotificationService {

    /**
     * Crea y envía una notificación (interna y/o por correo electrónico) a un usuario,
     * basándose en sus preferencias de notificación.
     *
     * @param user          El usuario destinatario de la notificación.
     * @param message       El mensaje o contenido de la notificación.
     * @param type          El tipo de notificación.
     * @param actionPath    La ruta de acción o enlace asociado a la notificación.
     * @param reservationId El identificador de la reserva asociada (puede ser nulo).
     * @return La notificación creada, o nulo si las preferencias no permiten notificaciones internas.
     */
    Notification createNotification(User user, String message, String type, String actionPath, Long reservationId);

    /**
     * Versión simplificada para crear y enviar notificaciones que no están asociadas
     * directamente a una reserva específica.
     *
     * @param user       El usuario destinatario de la notificación.
     * @param message    El mensaje o contenido de la notificación.
     * @param type       El tipo de notificación.
     * @param actionPath La ruta de acción o enlace asociado a la notificación.
     * @return La notificación creada.
     */
    default Notification createNotification(User user, String message, String type, String actionPath) {
        return createNotification(user, message, type, actionPath, null);
    }

    List<NotificationDTO> getNotificationsByUser(User user);

    Page<NotificationDTO> getMyNotifications(User user, Pageable pageable);

    long getUnreadCount(User user);

    NotificationPreferenceDTO getPreferences(User user);

    NotificationPreferenceDTO updatePreferences(User user, NotificationPreferenceDTO newPrefs);

    void resetPreferences(User user);
    
    Notification findByIdEntity(Long id);

    void markAsRead(Long notificationId);
    void markAsRead(Long notificationId, User user);
    void markAllAsRead(User user);
    void deleteNotification(Long id);
    void deleteNotification(Long id, User user);
    void clearAllNotifications(User user);
}
