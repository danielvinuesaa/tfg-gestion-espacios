package com.tfg.backend.modules.notification.mapper;

import com.tfg.backend.modules.notification.dto.NotificationDTO;
import com.tfg.backend.modules.notification.dto.NotificationPreferenceDTO;
import com.tfg.backend.modules.notification.model.Notification;
import com.tfg.backend.modules.notification.model.NotificationPreference;
import com.tfg.backend.modules.notification.model.NotificationType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Suite de pruebas unitarias para el mapeador de notificaciones (NotificationMapper).
 * Verifica la correcta conversión entre entidades de dominio (Notification, NotificationPreference)
 * y sus respectivos objetos de transferencia (DTO), así como la actualización de entidades.
 */
@DisplayName("Tests Unitarios de NotificationMapper")
class NotificationMapperTest {

    private NotificationMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = Mappers.getMapper(NotificationMapper.class);
    }

    /**
     * Verifica el mapeo de una entidad Notification a NotificationDTO.
     * Precondiciones: Se inicializa una entidad de notificación con datos básicos.
     * Ejecución: Se llama al método toDto(Notification).
     * Aserciones: El DTO resultante contiene los mismos valores que la entidad original.
     */
    @Test
    @DisplayName("✅ toDto: Mapeo de notificación")
    void toDto_Notification_Success() {
        Notification n = Notification.builder()
                .id(1L)
                .content("Test message")
                .type(NotificationType.SISTEMA)
                .read(false)
                .build();

        NotificationDTO dto = mapper.toDto(n);

        assertNotNull(dto);
        assertEquals(n.getId(), dto.getId());
        assertEquals(n.getContent(), dto.getContent());
        assertFalse(dto.isRead());
    }

    /**
     * Verifica el mapeo de una entidad NotificationPreference a NotificationPreferenceDTO.
     * Precondiciones: Se inicializa un objeto de preferencias con configuraciones específicas.
     * Ejecución: Se llama al método toDto(NotificationPreference).
     * Aserciones: El DTO resultante refleja fielmente la configuración booleana de la entidad.
     */
    @Test
    @DisplayName("✅ toDto: Mapeo de preferencias")
    void toDto_Preference_Success() {
        NotificationPreference prefs = new NotificationPreference();
        prefs.setEmailOnCreated(true);
        prefs.setInternalOnReminder(false);

        NotificationPreferenceDTO dto = mapper.toDto(prefs);

        assertNotNull(dto);
        assertTrue(dto.isEmailOnCreated());
        assertFalse(dto.isInternalOnReminder());
    }

    /**
     * Verifica que una entidad de preferencias existente pueda ser actualizada a partir de los datos de un DTO.
     * Precondiciones: Existe una entidad NotificationPreference vacía/por defecto y un DTO con nuevos valores.
     * Ejecución: Se llama a updateEntityFromDto.
     * Aserciones: Los valores del DTO sobrescriben los de la entidad.
     */
    @Test
    @DisplayName("✅ updateEntityFromDto: Actualización de preferencias")
    void updateEntityFromDto_Success() {
        NotificationPreference prefs = new NotificationPreference();
        NotificationPreferenceDTO dto = new NotificationPreferenceDTO();
        dto.setEmailOnCreated(true);
        dto.setInternalOnReminder(true);

        mapper.updateEntityFromDto(dto, prefs);

        assertTrue(prefs.isEmailOnCreated());
        assertTrue(prefs.isInternalOnReminder());
    }

    /**
     * Verifica que el mapper maneje correctamente las entradas nulas para evitar NullPointerException.
     * Precondiciones: Ninguna.
     * Ejecución: Se llama a las variantes de toDto pasando null.
     * Aserciones: Ambos métodos deben devolver null de forma segura.
     */
    @Test
    @DisplayName("🧪 toDto: Maneja nulos")
    void toDto_Null() {
        assertNull(mapper.toDto((Notification) null));
        assertNull(mapper.toDto((NotificationPreference) null));
    }
}
