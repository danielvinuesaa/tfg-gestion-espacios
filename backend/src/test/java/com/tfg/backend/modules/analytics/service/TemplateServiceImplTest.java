package com.tfg.backend.modules.analytics.service;

import com.tfg.backend.modules.notification.model.NotificationType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Suite de pruebas unitarias para la implementación del servicio de plantillas (TemplateServiceImpl).
 * Verifica la correcta generación de correos electrónicos y plantillas HTML basadas en los tipos de notificación.
 */
class TemplateServiceImplTest {

    private TemplateServiceImpl templateService;

    @BeforeEach
    void setUp() {
        templateService = new TemplateServiceImpl();
    }

    /**
     * Verifica que el servicio genere correctamente el HTML de una notificación incluyendo
     * el título correspondiente al tipo, el mensaje y el enlace de acción a la plataforma.
     */
    @Test
    void generateNotificationHtml_ShouldIncludeMessageAndTitle() {
        // Act
        String html = templateService.generateNotificationHtml(NotificationType.RESERVA_APROBADA, "Tu reserva ha sido aceptada", "http://app.com/1");

        // Assert
        assertNotNull(html);
        assertTrue(html.contains("Reserva Aprobada"));
        assertTrue(html.contains("Tu reserva ha sido aceptada"));
        assertTrue(html.contains("http://app.com/1"));
        assertTrue(html.contains("Universidad de Oviedo"));
    }

    /**
     * Verifica que si no se proporciona una URL de acción, la plantilla HTML generada
     * omita la renderización del botón o enlace a la plataforma.
     */
    @Test
    void generateNotificationHtml_WithoutUrl_ShouldNotIncludeButton() {
        // Act
        String html = templateService.generateNotificationHtml(NotificationType.SISTEMA, "Mantenimiento hoy", null);

        // Assert
        assertFalse(html.contains("Ver en la plataforma"));
        assertTrue(html.contains("Notificación del Sistema"));
    }
}
