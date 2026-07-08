package com.tfg.backend.modules.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tfg.backend.BaseIntegrationTest;
import com.tfg.backend.core.security.JwtService;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.repository.RoleRepository;
import com.tfg.backend.modules.identity.repository.UserRepository;
import com.tfg.backend.modules.notification.dto.NotificationPreferenceDTO;
import com.tfg.backend.modules.notification.model.Notification;
import com.tfg.backend.modules.notification.model.NotificationType;
import com.tfg.backend.modules.notification.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Suite de pruebas de integración para la API de Notificaciones.
 * Verifica los endpoints del controlador de notificaciones, cubriendo el ciclo de vida completo
 * (listado, conteo, marcado, eliminación), la gestión de preferencias y el control de acceso
 * para asegurar que los usuarios solo interactúen con sus propias notificaciones.
 */
@DisplayName("Tests de Integración: Notificaciones (API)")
class NotificationIntegrationTest extends BaseIntegrationTest {

    private MockMvc mockMvc;
    @Autowired private WebApplicationContext context;
    @Autowired private JwtService jwtService;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private NotificationRepository notificationRepository;
    private ObjectMapper objectMapper;
    @Autowired private PasswordEncoder passwordEncoder;

    private String userToken;
    private String otherToken;
    private User testUser;
    private User otherUser;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();

        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        notificationRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();

        Role role = roleRepository.save(Role.builder().name("USER").build());
        testUser = userRepository.save(User.builder()
                .email("user@test.com").password(passwordEncoder.encode("Pass123!"))
                .name("User").role(role).build());
        otherUser = userRepository.save(User.builder()
                .email("other@test.com").password(passwordEncoder.encode("Pass123!"))
                .name("Other").role(role).build());
        userToken = "Bearer " + jwtService.generateToken(testUser);
        otherToken = "Bearer " + jwtService.generateToken(otherUser);
    }

    /**
     * Verifica el ciclo de vida de una notificación desde que existe en BD hasta que se elimina.
     * Precondiciones: Se inserta manualmente una notificación no leída para el usuario de prueba.
     * Ejecución: Se realizan peticiones GET, PATCH y DELETE sobre los endpoints correspondientes.
     * Aserciones: El contador de no leídas se actualiza correctamente y los endpoints devuelven
     * los códigos de estado esperados (200 OK, 204 No Content).
     *
     * @throws Exception Si ocurre un error en la ejecución de la petición.
     */
    @Test
    @DisplayName("🧪 PI-NOT-01: Ciclo de vida completo de notificación")
    void notificationLifecycle() throws Exception {
        Notification n = notificationRepository.save(Notification.builder()
                .user(testUser).content("Prueba").type(NotificationType.SISTEMA).read(false).build());

        // Obtener listado
        mockMvc.perform(get("/api/notifications").header("Authorization", userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].content").value("Prueba"));

        // Contador no leídas = 1
        mockMvc.perform(get("/api/notifications/unread-count").header("Authorization", userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(1));

        // Marcar como leída
        mockMvc.perform(patch("/api/notifications/" + n.getId() + "/read")
                .header("Authorization", userToken))
                .andExpect(status().isNoContent());

        // Borrar notificación
        mockMvc.perform(delete("/api/notifications/" + n.getId())
                .header("Authorization", userToken))
                .andExpect(status().isNoContent());

        // Contador vuelve a 0
        mockMvc.perform(get("/api/notifications/unread-count").header("Authorization", userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(0));
    }

    /**
     * Verifica que un usuario pueda marcar múltiples notificaciones pendientes como leídas en una sola petición.
     * Precondiciones: El usuario de prueba tiene varias notificaciones no leídas.
     * Ejecución: Se envía una petición PUT a /api/notifications/mark-all-read.
     * Aserciones: La respuesta es exitosa y el contador de notificaciones no leídas se reduce a 0.
     *
     * @throws Exception Si ocurre un error en la ejecución de la petición.
     */
    @Test
    @DisplayName("🧪 PI-NOT-02: Marcado masivo como leídas")
    void markAllRead() throws Exception {
        for (int i = 0; i < 5; i++) {
            notificationRepository.save(Notification.builder()
                    .user(testUser).content("Notif " + i).type(NotificationType.SISTEMA).read(false).build());
        }

        mockMvc.perform(put("/api/notifications/mark-all-read")
                .header("Authorization", userToken))
                .andExpect(status().is2xxSuccessful());

        // El contador debe ser 0 tras el marcado masivo
        mockMvc.perform(get("/api/notifications/unread-count").header("Authorization", userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(0));
    }

    /**
     * Verifica que el usuario pueda vaciar por completo su historial de notificaciones.
     * Precondiciones: Existen notificaciones asociadas al usuario.
     * Ejecución: Se envía una petición DELETE a /api/notifications/clear-all.
     * Aserciones: La respuesta es 204 No Content y un listado posterior devuelve un historial vacío.
     *
     * @throws Exception Si ocurre un error en la ejecución de la petición.
     */
    @Test
    @DisplayName("🧪 PI-NOT-03: Limpieza completa del historial")
    void clearAllNotifications() throws Exception {
        notificationRepository.save(Notification.builder()
                .user(testUser).content("A borrar").type(NotificationType.SISTEMA).read(true).build());

        mockMvc.perform(delete("/api/notifications/clear-all")
                .header("Authorization", userToken))
                .andExpect(status().isNoContent());

        // Tras limpiar, el listado debe estar vacío
        mockMvc.perform(get("/api/notifications").header("Authorization", userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isEmpty());
    }

    /**
     * Verifica el flujo de consulta y actualización de las preferencias de notificación de un usuario.
     * Precondiciones: El usuario está autenticado y tiene acceso a sus preferencias.
     * Ejecución: Se envía una petición GET para consultar y un PUT para actualizar los canales (ej. desactivar emails).
     * Aserciones: Las peticiones retornan 200 OK y los cambios se reflejan en la respuesta actualizada.
     *
     * @throws Exception Si ocurre un error en la ejecución de la petición.
     */
    @Test
    @DisplayName("🧪 PI-NOT-04 y PI-NOT-05: Consulta y actualización de preferencias")
    void preferencesFlow() throws Exception {
        // Consulta las preferencias actuales
        mockMvc.perform(get("/api/notifications/preferences").header("Authorization", userToken))
                .andExpect(status().isOk());

        // Desactiva el canal de email
        NotificationPreferenceDTO prefs = NotificationPreferenceDTO.builder()
                .emailOnCreated(false)
                .emailOnStatusChange(false)
                .emailOnReminder(false)
                .emailOnApprovalReminder(false)
                .emailOnSystem(false)
                .build();

        mockMvc.perform(put("/api/notifications/preferences")
                .header("Authorization", userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(prefs)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailOnCreated").value(false));
    }

    /**
     * Verifica que las preferencias de un usuario puedan restablecerse a su estado por defecto.
     * Precondiciones: El usuario está autenticado.
     * Ejecución: Se envía una petición POST a /api/notifications/preferences/reset.
     * Aserciones: Se espera una respuesta 204 No Content.
     *
     * @throws Exception Si ocurre un error en la ejecución de la petición.
     */
    @Test
    @DisplayName("🧪 PI-NOT-06: Restablecimiento de preferencias a valores por defecto")
    void resetPreferences() throws Exception {
        mockMvc.perform(post("/api/notifications/preferences/reset")
                .header("Authorization", userToken))
                .andExpect(status().isNoContent());
    }

    /**
     * Verifica que el endpoint de listado soporte correctamente la paginación de resultados.
     * Precondiciones: Se generan 10 notificaciones asociadas al usuario de prueba.
     * Ejecución: Se realiza una petición GET con parámetros de paginación (page=0, size=5).
     * Aserciones: La respuesta contiene un total de 10 elementos, pero la página actual devuelve solo 5.
     *
     * @throws Exception Si ocurre un error en la ejecución de la petición.
     */
    @Test
    @DisplayName("🧪 PI-NOT-07: Paginación del historial de notificaciones")
    void paginationWorks() throws Exception {
        for (int i = 0; i < 10; i++) {
            notificationRepository.save(Notification.builder()
                    .user(testUser).content("Notif " + i).type(NotificationType.SISTEMA).read(false).build());
        }

        mockMvc.perform(get("/api/notifications")
                .param("page", "0").param("size", "5")
                .header("Authorization", userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(10))
                .andExpect(jsonPath("$.content.length()").value(5));
    }

    /**
     * Verifica las reglas de seguridad: un usuario no debe poder alterar el estado de una notificación ajena.
     * Precondiciones: Se crea una notificación asociada a un segundo usuario.
     * Ejecución: El usuario principal intenta marcarla como leída.
     * Aserciones: Se espera una respuesta 403 Forbidden.
     *
     * @throws Exception Si ocurre un error en la ejecución de la petición.
     */
    @Test
    @DisplayName("🧪 PI-NOT-08: Un usuario no puede marcar como leída la notificación de otro")
    void cannotReadOthersNotification() throws Exception {
        Notification ajena = notificationRepository.save(Notification.builder()
                .user(otherUser).content("Ajena").type(NotificationType.SISTEMA).read(false).build());

        mockMvc.perform(patch("/api/notifications/" + ajena.getId() + "/read")
                .header("Authorization", userToken))
                .andExpect(status().isForbidden());
    }
}
