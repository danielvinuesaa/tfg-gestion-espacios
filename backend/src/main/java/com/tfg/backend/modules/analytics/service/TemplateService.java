package com.tfg.backend.modules.analytics.service;
import com.tfg.backend.modules.notification.model.NotificationType;


/**
 * Interfaz para el servicio especializado en la generación de contenido dinámico a partir de plantillas.
 * Define los métodos para estructurar la presentación de correos electrónicos y otras notificaciones.
 */
public interface TemplateService {

    /**
     * Genera el contenido HTML para un correo de notificación.
     * 
     * @param type Tipo de notificación para determinar la estructura.
     * @param message Cuerpo principal del mensaje.
     * @param actionUrl URL opcional para el botón de acción principal.
     * @return String con el HTML completo listo para enviar.
     */
    String generateNotificationHtml(NotificationType type, String message, String actionUrl);
}
