package com.tfg.backend.modules.reservation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tfg.backend.BaseIntegrationTest;
import com.tfg.backend.core.security.JwtService;
import com.tfg.backend.modules.identity.model.Permission;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.repository.PermissionRepository;
import com.tfg.backend.modules.identity.repository.RoleRepository;
import com.tfg.backend.modules.identity.repository.UserRepository;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.reservation.model.ReservationType;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.space.model.SpaceStatus;
import com.tfg.backend.modules.space.model.SpaceType;
import com.tfg.backend.modules.space.repository.SpaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Suite de pruebas de integración para el ciclo de vida completo de las reservas a través del API REST.
 * Verifica la interacción real entre componentes, incluyendo la capa de controladores, servicios, base de datos
 * y seguridad (Spring Security), comprobando la gestión de estados, permisos de acceso y resolución de conflictos.
 */
@DisplayName("Tests de Integración: Ciclo de Vida de Reservas (API)")
class ReservationLifecycleIntegrationTest extends BaseIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext context;

    private ObjectMapper objectMapper;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private SpaceRepository spaceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private JwtService jwtService;

    private String adminToken;
    private String userToken;
    private User profUser;
    private Space testSpace;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        reservationRepository.deleteAll();
        spaceRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();
        permissionRepository.deleteAll();

        // Setup Roles y Permisos
        Permission pApprove = permissionRepository.save(Permission.builder().name("APROBAR_RESERVA").build());
        Permission pRequest = permissionRepository.save(Permission.builder().name("SOLICITAR_RESERVA").build());
        
        Role adminRole = roleRepository.save(Role.builder().name("ADMIN").permissions(Set.of(pApprove, pRequest)).build());
        Role profRole = roleRepository.save(Role.builder().name("PROFESOR").permissions(Set.of(pRequest)).build());

        // Setup Users
        User admin = userRepository.save(User.builder().email("admin@uniovi.es").password("pass").name("Admin").role(adminRole).build());
        profUser = userRepository.save(User.builder().email("prof@uniovi.es").password("pass").name("Profe").role(profRole).build());
        
        adminToken = "Bearer " + jwtService.generateToken(admin);
        userToken = "Bearer " + jwtService.generateToken(profUser);

        // Setup Space
        testSpace = spaceRepository.save(Space.builder()
                .name("Aula 1")
                .type(SpaceType.AULA)
                .totalCapacity(50)
                .status(SpaceStatus.DISPONIBLE)
                .build());
    }

    /**
     * Verifica que un usuario con el rol de ADMIN pueda rechazar explícitamente una reserva que se encuentra
     * en estado SOLICITADA, registrando correctamente el motivo del rechazo en el sistema.
     *
     * @throws Exception en caso de error durante la ejecución de las peticiones HTTP.
     */
    @Test
    @DisplayName("🧪 Admin rechaza una reserva con motivo")
    void adminRejectsReservation() throws Exception {
        // 1. Crear reserva pendiente
        Reservation res = reservationRepository.save(Reservation.builder()
                .title("Reserva Test")
                .user(profUser)
                .spaces(Set.of(testSpace))
                .startTime(LocalDateTime.now().plusDays(1))
                .endTime(LocalDateTime.now().plusDays(1).plusHours(2))
                .status(ReservationStatus.SOLICITADA)
                .type(ReservationType.CLASE)
                .reminderSent(false)
                .build());

        // 2. Patch status a RECHAZADA
        Map<String, String> body = Map.of(
                "status", "RECHAZADA",
                "rejectionReason", "Espacio no adecuado"
        );

        mockMvc.perform(patch("/api/reservations/" + res.getId() + "/status")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RECHAZADA"))
                .andExpect(jsonPath("$.rejectionReason").value("Espacio no adecuado"));
    }

    /**
     * Verifica que el control de acceso impida a un usuario con perfil de profesor (sin permisos globales)
     * listar todas las reservas del sistema (scope 'all'), pero le permita listar aquellas que él mismo gestiona.
     *
     * @throws Exception en caso de error durante la ejecución de las peticiones HTTP.
     */
    @Test
    @DisplayName("🧪 Usuario sin VER_TODAS_RESERVAS no puede listar con scope all")
    void userWithoutViewAllCannotListWithScopeAll() throws Exception {
        // Por defecto el scope es 'all'. Con token de PROFESOR (sin el permiso) debe dar 403
        mockMvc.perform(get("/api/reservations")
                .header("Authorization", userToken))
                .andExpect(status().isForbidden());

        // Con scope 'managed' debe funcionar (le devuelve las suyas, o vacío si no tiene)
        mockMvc.perform(get("/api/reservations?scope=managed")
                .header("Authorization", userToken))
                .andExpect(status().isOk());
    }

    /**
     * Verifica que las restricciones de seguridad impidan a un usuario borrar o cancelar
     * una reserva que fue creada o pertenece a otro usuario.
     *
     * @throws Exception en caso de error durante la ejecución de las peticiones HTTP.
     */
    @Test
    @DisplayName("🧪 Un usuario NO puede borrar reservas de otros")
    void userCannotDeleteOthersReservation() throws Exception {
        // 1. Crear reserva de ADMIN
        User admin = userRepository.findByEmail("admin@uniovi.es").get();
        Reservation resAdmin = reservationRepository.save(Reservation.builder()
                .title("Admin Res")
                .user(admin)
                .spaces(Set.of(testSpace))
                .startTime(LocalDateTime.now().plusDays(2))
                .endTime(LocalDateTime.now().plusDays(2).plusHours(1))
                .status(ReservationStatus.APROBADA)
                .type(ReservationType.CLASE)
                .build());

        // 2. Intentar borrar con token de PROFESOR (403)
        mockMvc.perform(delete("/api/reservations/" + resAdmin.getId())
                .header("Authorization", userToken))
                .andExpect(status().isForbidden());
    }

    /**
     * Verifica que las restricciones de seguridad impidan a un usuario visualizar los detalles
     * completos de una reserva ajena si no cuenta con el permiso global de visualización.
     *
     * @throws Exception en caso de error durante la ejecución de las peticiones HTTP.
     */
    @Test
    @DisplayName("🧪 Usuario no puede ver detalle de reserva ajena sin permiso")
    void userCannotViewDetailsOfOthers() throws Exception {
        User admin = userRepository.findByEmail("admin@uniovi.es").get();
        Reservation resAdmin = reservationRepository.save(Reservation.builder()
                .title("Admin Private Res")
                .user(admin)
                .spaces(Set.of(testSpace))
                .startTime(LocalDateTime.now().plusDays(2))
                .endTime(LocalDateTime.now().plusDays(2).plusHours(1))
                .status(ReservationStatus.APROBADA)
                .type(ReservationType.CLASE)
                .build());

        // 1. Intentar ver con token de PROFESOR (403)
        mockMvc.perform(get("/api/reservations/" + resAdmin.getId())
                .header("Authorization", userToken))
                .andExpect(status().isForbidden());
    }

    /**
     * Verifica que el API rechace la petición (HTTP 4xx) si se intenta cambiar el estado de una
     * reserva a RECHAZADA sin proporcionar un motivo válido o enviando uno vacío, ya que es obligatorio.
     *
     * @throws Exception en caso de error durante la ejecución de las peticiones HTTP.
     */
    @Test
    @DisplayName("🧪 PI-RES-09: Rechazo de reserva con motivo vacío falla (motivo obligatorio)")
    void rejectReservation_EmptyReason_Fails() throws Exception {
        Reservation res = reservationRepository.save(Reservation.builder()
                .title("Sin Motivo")
                .user(profUser)
                .spaces(Set.of(testSpace))
                .startTime(LocalDateTime.now().plusDays(3).withHour(10).withMinute(0).withSecond(0).withNano(0))
                .endTime(LocalDateTime.now().plusDays(3).withHour(11).withMinute(0).withSecond(0).withNano(0))
                .status(ReservationStatus.SOLICITADA)
                .type(ReservationType.CLASE)
                .build());

        // La API exige motivo de rechazo ahora (valida nulo o vacío)
        mockMvc.perform(patch("/api/reservations/" + res.getId() + "/status")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"RECHAZADA\",\"rejectionReason\":\"\"}" ))
                .andExpect(status().is4xxClientError());
    }

    /**
     * Verifica que el sistema intercepte y bloquee la aprobación manual de una reserva si, en el
     * transcurso del tiempo, ha surgido un solapamiento con otra reserva que ya ocupa el mismo espacio.
     *
     * @throws Exception en caso de error durante la ejecución de las peticiones HTTP.
     */
    @Test
    @DisplayName("🧪 PI-RES-07: Solapamiento sobrevenido al intentar aprobar")
    void approveReservation_OverlapConflict_Fails() throws Exception {
        LocalDateTime start = LocalDateTime.now().plusDays(5).withHour(10).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime end = start.plusHours(2);

        // Primera reserva ya aprobada que ocupa el espacio
        User admin = userRepository.findByEmail("admin@uniovi.es").get();
        reservationRepository.save(Reservation.builder()
                .title("Reserva Aprobada Previa")
                .user(admin)
                .spaces(Set.of(testSpace))
                .startTime(start)
                .endTime(end)
                .status(ReservationStatus.APROBADA)
                .type(ReservationType.CLASE)
                .build());

        // Segunda reserva solicitada que solapa
        Reservation pending = reservationRepository.save(Reservation.builder()
                .title("Reserva Solapante")
                .user(profUser)
                .spaces(Set.of(testSpace))
                .startTime(start.plusMinutes(30))
                .endTime(end.minusMinutes(30))
                .status(ReservationStatus.SOLICITADA)
                .type(ReservationType.CLASE)
                .build());

        // La BusinessValidationException mapea a HTTP 400
        mockMvc.perform(patch("/api/reservations/" + pending.getId() + "/status")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"APROBADA\"}"))
                .andExpect(status().isBadRequest());
    }

    /**
     * Verifica que cuando un usuario estándar edita una reserva previamente APROBADA (e.g. modificando su horario),
     * el sistema la degrade automáticamente al estado SOLICITADA para que vuelva a ser revisada y autorizada.
     *
     * @throws Exception en caso de error durante la ejecución de las peticiones HTTP.
     */
    @Test
    @DisplayName("🧪 PI-RES-05: Modificar una reserva APROBADA la devuelve a SOLICITADA")
    void updateApprovedReservation_ReturnsToPending() throws Exception {
        // Usar profUser en vez de admin, ya que el admin tiene poder de auto-aprobar
        // y el sistema la dejaría en APROBADA si la edita él mismo.
        Reservation approved = reservationRepository.save(Reservation.builder()
                .title("Reserva Aprobada")
                .user(profUser)
                .spaces(Set.of(testSpace))
                .startTime(LocalDateTime.now().plusDays(7).withHour(9).withMinute(0).withSecond(0).withNano(0))
                .endTime(LocalDateTime.now().plusDays(7).withHour(10).withMinute(0).withSecond(0).withNano(0))
                .status(ReservationStatus.APROBADA)
                .type(ReservationType.CLASE)
                .build());

        LocalDateTime newStart = LocalDateTime.now().plusDays(7).withHour(11).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime newEnd = newStart.plusHours(1);

        java.time.format.DateTimeFormatter isoFmt = java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        java.util.Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("title", "Reserva Actualizada");
        body.put("spaceIds", java.util.List.of(testSpace.getId()));
        body.put("startTime", newStart.format(isoFmt));
        body.put("endTime", newEnd.format(isoFmt));
        body.put("type", "CLASE");
        body.put("isBlock", false);

        mockMvc.perform(put("/api/reservations/" + approved.getId())
                .header("Authorization", userToken) // profUser Token
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SOLICITADA"));
    }
}
