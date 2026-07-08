package com.tfg.backend.modules.analytics.service;
import com.tfg.backend.modules.notification.model.NotificationType;

import org.springframework.stereotype.Service;

/**
 * Implementación del servicio de generación de plantillas.
 * Se encarga de construir dinámicamente el contenido HTML para las distintas
 * comunicaciones del sistema, aplicando un diseño visual coherente.
 */
@Service
public class TemplateServiceImpl implements TemplateService {

    /**
     * Color primario del tema visual, utilizado en botones y títulos.
     */
    private static final String PRIMARY_COLOR = "#1a73e8";

    /**
     * Familia tipográfica por defecto para garantizar legibilidad en los correos.
     */
    private static final String FONT_FAMILY = "sans-serif";

    /**
     * Genera el código HTML completo para una notificación basada en su tipo y mensaje.
     *
     * @param type Tipo de la notificación, utilizado para resolver el título y el contexto.
     * @param message Cuerpo principal de texto a incluir en el correo.
     * @param actionUrl URL opcional que se insertará en un botón de acción principal. Si es nula, no se genera botón.
     * @return Cadena con la estructura HTML lista para el envío del correo electrónico.
     */
    @Override
    public String generateNotificationHtml(NotificationType type, String message, String actionUrl) {
        String title = resolveTitle(type);
        
        StringBuilder html = new StringBuilder();
        
        // Header
        html.append("<div style='font-family: ").append(FONT_FAMILY).append("; padding: 25px; border: 1px solid #e0e0e0; border-radius: 12px; max-width: 600px; margin: auto;'>");
        html.append("<h2 style='color: ").append(PRIMARY_COLOR).append("; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;'>").append(title).append("</h2>");
        
        // Body
        html.append("<p style='font-size: 1.1em; line-height: 1.5; color: #3c4043; margin-top: 20px;'>").append(message).append("</p>");
        
        // Call to Action
        if (actionUrl != null && !actionUrl.isEmpty()) {
            html.append("<div style='margin-top: 35px; text-align: center;'>")
                .append("<a href='").append(actionUrl).append("' ")
                .append("style='background: ").append(PRIMARY_COLOR).append("; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 1em; display: inline-block;'>")
                .append("Ver en la plataforma</a>")
                .append("</div>");
        }
        
        // Footer
        html.append("<div style='margin-top: 40px; border-top: 1px solid #f0f0f0; padding-top: 15px; font-size: 0.85em; color: #70757a; text-align: center;'>")
            .append("<p>&copy; ").append(java.time.Year.now().getValue()).append(" Universidad de Oviedo - Gestión de Espacios</p>")
            .append("<p style='margin-top: 5px;'>Este es un mensaje automático, por favor no responda.</p>")
            .append("</div>");
            
        html.append("</div>");
        
        return html.toString();
    }

    /**
     * Resuelve el título de la notificación según su tipo.
     *
     * @param type El tipo de notificación.
     * @return El título correspondiente en español.
     */
    private String resolveTitle(NotificationType type) {
        return switch (type) {
            case RESERVA_CREADA -> "Confirmación de Solicitud";
            case RESERVA_APROBADA -> "Reserva Aprobada";
            case RESERVA_RECHAZADA -> "Reserva Denegada";
            case RESERVA_CANCELADA -> "Reserva Cancelada";
            case RECORDATORIO -> "Recordatorio de Actividad";
            case RECORDATORIO_APROBACION -> "Pendiente de Aprobación";
            default -> "Notificación del Sistema";
        };
    }
}
