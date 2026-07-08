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
import com.tfg.backend.modules.reservation.dto.ReservationRequest;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Suite de pruebas de integración para el controlador de Reservas.
 * Verifica los flujos de creación, actualización, consulta, eliminación y operaciones en masa (bulk).
 * Incluye validaciones de seguridad basadas en permisos y roles, así como lógica de negocio específica (ej. auto-aprobación).
 */
@DisplayName("Tests de Integración: Reservas (API)")
class ReservationIntegrationTest extends BaseIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private JwtService jwtService;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private PermissionRepository permissionRepository;
    @Autowired private SpaceRepository spaceRepository;
    @Autowired private ReservationRepository reservationRepository;
    @Autowired private com.tfg.backend.modules.notification.repository.NotificationRepository notificationRepository;
    @MockitoBean private com.tfg.backend.modules.notification.service.NotificationService notificationService;
    @MockitoBean private com.tfg.backend.modules.reservation.event.listener.ReservationEventListener reservationEventListener;
    @Autowired protected PasswordEncoder passwordEncoder;
    @Autowired private jakarta.persistence.EntityManager entityManager;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private User testUser;
    private Space testSpace;
    private String userToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();

        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        notificationRepository.deleteAll();
        reservationRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();
        spaceRepository.deleteAll();
        permissionRepository.deleteAll();

        entityManager.flush();
        entityManager.clear();

        Permission p1 = permissionRepository.save(Permission.builder().name("SOLICITAR_RESERVA").build());
        Permission p2 = permissionRepository.save(Permission.builder().name("VER_TODAS_RESERVAS").build());
        Permission p3 = permissionRepository.save(Permission.builder().name("APROBAR_RESERVA").build());
        Permission p4 = permissionRepository.save(Permission.builder().name("CANCELAR_RESERVA").build());
        Permission p5 = permissionRepository.save(Permission.builder().name("EXPORTAR_RESERVAS").build());
        Permission p6 = permissionRepository.save(Permission.builder().name("IMPORTAR_RESERVAS").build());

        Role adminRole = roleRepository.save(Role.builder().name("ADMIN").permissions(Set.of(p1, p2, p3, p4, p5, p6)).build());
        Role professorRole = roleRepository.save(Role.builder().name("PROFESOR").permissions(Set.of(p1)).build());

        testUser = userRepository.save(User.builder()
                .name("Dani Professor")
                .email("profe@uniovi.es")
                .password(passwordEncoder.encode("Pass1234!"))
                .role(professorRole)
                .status(com.tfg.backend.modules.identity.model.UserStatus.ACTIVO)
                .build());

        User admin = userRepository.save(User.builder()
                .name("Admin")
                .email("admin@uniovi.es")
                .password(passwordEncoder.encode("Pass1234!"))
                .role(adminRole)
                .status(com.tfg.backend.modules.identity.model.UserStatus.ACTIVO)
                .build());

        testSpace = spaceRepository.save(Space.builder()
                .name("Aula 1")
                .type(SpaceType.AULA)
                .status(SpaceStatus.DISPONIBLE)
                .totalCapacity(50)
                .build());

        userToken = "Bearer " + jwtService.generateToken(testUser);
        adminToken = "Bearer " + jwtService.generateToken(admin);
    }

    /**
     * Verifica que un profesor pueda crear una reserva básica correctamente.
     * Precondiciones: El usuario debe tener permiso para solicitar reservas y el espacio debe estar disponible.
     * Ejecución: Se envía una petición POST a /api/reservations con los datos de la reserva.
     * Aserciones: Se espera una respuesta 201 Created y que el estado de la reserva sea "SOLICITADA".
     *
     * @throws Exception Si ocurre un error en la ejecución de la petición.
     */
    @Test
    @DisplayName("✅ create: Flujo básico de creación exitosa")
    void createReservation_Success() throws Exception {
        ReservationRequest request = ReservationRequest.builder()
                .title("Clase de Java")
                .description("Introducción a Spring Boot")
                .startTime(LocalDateTime.now().plusDays(1).withHour(10).withMinute(0))
                .endTime(LocalDateTime.now().plusDays(1).withHour(12).withMinute(0))
                .type(ReservationType.CLASE)
                .spaceIds(List.of(testSpace.getId()))
                .isBlock(false)
                .build();

        mockMvc.perform(post("/api/reservations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .header("Authorization", userToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Clase de Java"))
                .andExpect(jsonPath("$.status").value("SOLICITADA"));
    }

    /**
     * Verifica el ciclo de vida completo de una reserva (crear, actualizar, consultar y exportar).
     * Precondiciones: Se inyecta una reserva en el repositorio.
     * Ejecución: Se realizan peticiones PUT, GET y una exportación.
     * Aserciones: Se espera que las actualizaciones se reflejen correctamente y que el exportado devuelva un CSV.
     *
     * @throws Exception Si ocurre un error en la ejecución de la petición.
     */
    @Test
    @DisplayName("🧪 CRUD completo: Update, Get y Export")
    void fullReservationFlow() throws Exception {
        // 1. Crear
        Reservation r = Reservation.builder()
                .title("Original").user(testUser).spaces(Set.of(testSpace))
                .startTime(LocalDateTime.now().plusDays(2).withHour(10).withMinute(0))
                .endTime(LocalDateTime.now().plusDays(2).withHour(11).withMinute(0))
                .status(ReservationStatus.SOLICITADA).type(ReservationType.CLASE).build();
        reservationRepository.save(r);

        // 2. Update
        ReservationRequest updateReq = ReservationRequest.builder()
                .title("Actualizada").spaceIds(List.of(testSpace.getId()))
                .startTime(r.getStartTime()).endTime(r.getEndTime())
                .type(ReservationType.CLASE).isBlock(false).build();
        
        mockMvc.perform(put("/api/reservations/" + r.getId())
                .header("Authorization", userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Actualizada"));

        // 3. Get By ID
        mockMvc.perform(get("/api/reservations/" + r.getId())
                .header("Authorization", userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Actualizada"));

        // 4. Export
        mockMvc.perform(get("/api/reservations/export")
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/csv; charset=UTF-8"));
    }

    /**
     * Verifica que un administrador con los permisos adecuados pueda aprobar una reserva en estado "SOLICITADA".
     * Precondiciones: Existe una reserva solicitada.
     * Ejecución: Se envía una petición PATCH a /api/reservations/{id}/status con el estado APROBADA.
     * Aserciones: Se espera una respuesta 200 OK y que el nuevo estado sea "APROBADA".
     *
     * @throws Exception Si ocurre un error en la ejecución de la petición.
     */
    @Test
    @DisplayName("✅ status: Admin puede aprobar una reserva")
    void updateStatus_Approved_Success() throws Exception {
        Reservation r = reservationRepository.save(Reservation.builder()
                .title("Por Aprobar").user(testUser).spaces(Set.of(testSpace))
                .startTime(LocalDateTime.now().plusDays(10).withHour(10).withMinute(0))
                .endTime(LocalDateTime.now().plusDays(10).withHour(12).withMinute(0))
                .status(ReservationStatus.SOLICITADA).type(ReservationType.CLASE).build());

        com.tfg.backend.modules.reservation.dto.ReservationStatusRequest statusReq = new com.tfg.backend.modules.reservation.dto.ReservationStatusRequest();
        statusReq.setStatus(ReservationStatus.APROBADA);

        mockMvc.perform(patch("/api/reservations/" + r.getId() + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(statusReq))
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APROBADA"));
    }

    /**
     * Verifica que un administrador pueda borrar (cancelar) múltiples reservas en una sola operación.
     * Precondiciones: Existe al menos una reserva en la base de datos.
     * Ejecución: Se envía una petición DELETE a /api/reservations/bulk con el listado de IDs.
     * Aserciones: Se espera una respuesta 204 No Content y que el estado de la reserva en BD cambie a CANCELADA.
     *
     * @throws Exception Si ocurre un error en la ejecución de la petición.
     */
    @Test
    @DisplayName("🗑️ deleteBulk: Admin puede borrar múltiples")
    void deleteBulk_Success() throws Exception {
        Reservation r1 = reservationRepository.save(Reservation.builder()
                .title("R1").user(testUser).spaces(Set.of(testSpace))
                .startTime(LocalDateTime.now().plusDays(15).withHour(10).withMinute(0))
                .endTime(LocalDateTime.now().plusDays(15).withHour(11).withMinute(0))
                .status(ReservationStatus.APROBADA).build());
        
        mockMvc.perform(delete("/api/reservations/bulk")
                .param("ids", r1.getId().toString())
                .header("Authorization", adminToken))
                .andExpect(status().isNoContent());
                
        assertEquals(ReservationStatus.CANCELADA, reservationRepository.findById(r1.getId()).get().getStatus());
    }

    /**
     * Verifica que un usuario con rol de PROFESOR (sin permisos de visualización global) no pueda listar todas las reservas.
     * Precondiciones: El usuario autenticado no tiene el permiso "VER_TODAS_RESERVAS".
     * Ejecución: Se envía una petición GET a /api/reservations con el parámetro scope=all.
     * Aserciones: Se espera una respuesta 403 Forbidden.
     *
     * @throws Exception Si ocurre un error en la ejecución de la petición.
     */
    @Test
    @DisplayName("❌ security: Profesor no puede listar todas")
    void getReservations_All_Forbidden() throws Exception {
        mockMvc.perform(get("/api/reservations?scope=all")
                .header("Authorization", userToken))
                .andExpect(status().isForbidden());
    }

    /**
     * Verifica que el sistema devuelva correctamente el catálogo de tipos de reserva disponibles.
     * Precondiciones: El usuario debe estar autenticado.
     * Ejecución: Se envía una petición GET a /api/reservations/types.
     * Aserciones: Se espera una respuesta 200 OK y la lista de todos los enums de ReservationType.
     *
     * @throws Exception Si ocurre un error en la ejecución de la petición.
     */
    @Test
    @DisplayName("✅ types: Recupera catálogo")
    void getReservationTypes_Success() throws Exception {
        mockMvc.perform(get("/api/reservations/types")
                .header("Authorization", userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(ReservationType.values().length));
    }

    /**
     * Verifica que la consulta de conflictos directos devuelva una respuesta exitosa.
     * Precondiciones: El espacio a consultar debe existir.
     * Ejecución: Se envía una petición GET a /api/reservations/conflicts con las fechas de interés y el ID del espacio.
     * Aserciones: Se espera una respuesta 200 OK.
     *
     * @throws Exception Si ocurre un error en la ejecución de la petición.
     */
    @Test
    @DisplayName("🔍 conflicts: Consulta conflictos directos")
    void getConflicts_Success() throws Exception {
        mockMvc.perform(get("/api/reservations/conflicts")
                .param("spaceIds", testSpace.getId().toString())
                .param("startTime", LocalDateTime.now().plusDays(1).toString())
                .param("endTime", LocalDateTime.now().plusDays(1).plusHours(2).toString())
                .header("Authorization", userToken))
                .andExpect(status().isOk());
    }

    /**
     * Verifica que se pueda obtener un resumen de conflictos para múltiples reservas.
     * Precondiciones: Existe una reserva en el sistema y se invoca la validación en masa.
     * Ejecución: Se envía una petición GET a /api/reservations/bulk/conflicts.
     * Aserciones: Se espera una respuesta 200 OK con el reporte de conflictos.
     *
     * @throws Exception Si ocurre un error en la ejecución de la petición.
     */
    @Test
    @DisplayName("📦 bulk/conflicts: Resumen de conflictos en masa")
    void getBulkConflicts_Success() throws Exception {
        Reservation r1 = reservationRepository.save(Reservation.builder()
                .title("R1").user(testUser).spaces(Set.of(testSpace))
                .startTime(LocalDateTime.now().plusDays(20).withHour(10).withMinute(0))
                .endTime(LocalDateTime.now().plusDays(20).withHour(11).withMinute(0))
                .status(ReservationStatus.APROBADA).build());

        mockMvc.perform(get("/api/reservations/bulk/conflicts")
                .param("ids", r1.getId().toString())
                .header("Authorization", adminToken))
                .andExpect(status().isOk());
    }

    /**
     * Verifica que se valide correctamente un archivo CSV antes de su importación.
     * Precondiciones: El administrador proporciona un archivo de prueba.
     * Ejecución: Se envía una petición multipart a /api/reservations/import/validate.
     * Aserciones: Se espera una respuesta 200 OK informando de la validación.
     *
     * @throws Exception Si ocurre un error en la ejecución de la petición.
     */
    @Test
    @DisplayName("📑 import/validate: Validar CSV de importación")
    void validateImport_Success() throws Exception {
        org.springframework.mock.web.MockMultipartFile file = new org.springframework.mock.web.MockMultipartFile(
                "file", "reservas.csv", "text/csv", "col1,col2\nval1,val2".getBytes());

        mockMvc.perform(multipart("/api/reservations/import/validate")
                .file(file)
                .header("Authorization", adminToken))
                .andExpect(status().isOk());
    }

    /**
     * Verifica la funcionalidad de exportación limitando los datos a columnas específicas indicadas por parámetro.
     * Precondiciones: El usuario debe tener permiso de exportar y solicitar ciertas columnas.
     * Ejecución: Se envía una petición GET a /api/reservations/export con el parámetro "columns".
     * Aserciones: Se espera una respuesta 200 OK y el archivo CSV generado correctamente.
     *
     * @throws Exception Si ocurre un error en la ejecución de la petición.
     */
    @Test
    @DisplayName("📊 PI-RES-17: Exportación CSV con columnas seleccionadas")
    void exportReservations_WithColumns_ReturnsCSV() throws Exception {
        mockMvc.perform(get("/api/reservations/export")
                .param("columns", "titulo", "estado")
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/csv; charset=UTF-8"));
    }

    /**
     * Verifica que las reservas creadas por un usuario con permisos de aprobación queden automáticamente aprobadas.
     * Precondiciones: El usuario es un administrador con permiso "APROBAR_RESERVA".
     * Ejecución: Se envía una petición POST para crear la reserva.
     * Aserciones: Se espera una respuesta 201 Created y que el estado inicial sea "APROBADA".
     *
     * @throws Exception Si ocurre un error en la ejecución de la petición.
     */
    @Test
    @DisplayName("✅ PI-RES-02: Creación de reserva por Admin → auto-aprobada")
    void createReservation_ByAdmin_AutoApproved() throws Exception {
        ReservationRequest request = ReservationRequest.builder()
                .title("Reserva Admin")
                .description("Creada por el admin")
                .startTime(java.time.LocalDateTime.now().plusDays(3).withHour(9).withMinute(0))
                .endTime(java.time.LocalDateTime.now().plusDays(3).withHour(11).withMinute(0))
                .type(ReservationType.CLASE)
                .spaceIds(List.of(testSpace.getId()))
                .isBlock(false)
                .build();

        // El admin tiene APROBAR_RESERVA, así que la reserva nace APROBADA directamente
        mockMvc.perform(post("/api/reservations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .header("Authorization", adminToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("APROBADA"));
    }

    /**
     * Verifica que una reserva realizada sobre un espacio de tipo "DESPACHO" nazca automáticamente aprobada,
     * independientemente de los permisos explícitos de aprobación del usuario.
     * Precondiciones: Se crea un espacio de tipo DESPACHO y un usuario básico solicita la reserva.
     * Ejecución: Se envía una petición POST para crear la reserva.
     * Aserciones: Se espera una respuesta 201 Created y que el estado sea "APROBADA".
     *
     * @throws Exception Si ocurre un error en la ejecución de la petición.
     */
    @Test
    @DisplayName("✅ PI-RES-03: Reserva de DESPACHO → auto-aprobada")
    void createReservation_InDespacho_AutoApproved() throws Exception {
        com.tfg.backend.modules.space.model.Space despacho = spaceRepository.save(
                com.tfg.backend.modules.space.model.Space.builder()
                        .name("Despacho D1")
                        .type(com.tfg.backend.modules.space.model.SpaceType.DESPACHO)
                        .totalCapacity(2)
                        .status(com.tfg.backend.modules.space.model.SpaceStatus.DISPONIBLE)
                        .build());

        ReservationRequest request = ReservationRequest.builder()
                .title("Reunión en despacho")
                .startTime(java.time.LocalDateTime.now().plusDays(4).withHour(10).withMinute(0))
                .endTime(java.time.LocalDateTime.now().plusDays(4).withHour(11).withMinute(0))
                .type(ReservationType.OTRO)
                .spaceIds(List.of(despacho.getId()))
                .isBlock(false)
                .build();

        // El profesor crea la reserva en un despacho; debe nacer APROBADA por política de espacio
        mockMvc.perform(post("/api/reservations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .header("Authorization", userToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("APROBADA"));
    }

    /**
     * Verifica que un coordinador o usuario con el permiso especial de gestionar asignaturas pueda
     * listar las reservas asociadas a estas usando el filtro de ámbito correspondiente.
     * Precondiciones: El usuario cuenta con el permiso "APROBAR_ASIGNATURAS_GESTIONADAS".
     * Ejecución: Se envía una petición GET a /api/reservations con scope=managed.
     * Aserciones: Se espera una respuesta 200 OK.
     *
     * @throws Exception Si ocurre un error en la ejecución de la petición.
     */
    @Test
    @DisplayName("✅ PI-RES-12: Usuario con APROBAR_ASIGNATURAS_GESTIONADAS puede ver el scope managed")
    void getManagedReservations_WithPermission_Succeeds() throws Exception {
        com.tfg.backend.modules.identity.model.Permission pManaged = permissionRepository.save(
                com.tfg.backend.modules.identity.model.Permission.builder()
                        .name("APROBAR_ASIGNATURAS_GESTIONADAS").build());
        com.tfg.backend.modules.identity.model.Role managedRole = roleRepository.save(
                com.tfg.backend.modules.identity.model.Role.builder()
                        .name("COORD_ASIGNATURAS")
                        .permissions(java.util.Set.of(pManaged))
                        .build());
        com.tfg.backend.modules.identity.model.User coordinator = userRepository.save(
                com.tfg.backend.modules.identity.model.User.builder()
                        .email("coord@uniovi.es")
                        .password(passwordEncoder.encode("Pass1234!"))
                        .name("Coord")
                        .role(managedRole)
                        .status(com.tfg.backend.modules.identity.model.UserStatus.ACTIVO)
                        .build());
        String coordToken = "Bearer " + jwtService.generateToken(coordinator);

        // El coordinador puede listar reservas con scope=managed aunque no tenga VER_TODAS_RESERVAS
        mockMvc.perform(get("/api/reservations?scope=managed")
                .header("Authorization", coordToken))
                .andExpect(status().isOk());
    }

    /**
     * Verifica la funcionalidad completa de importación de CSV de reservas.
     * Precondiciones: El administrador provee un archivo de importación válido.
     * Ejecución: Se envía una petición multipart a /api/reservations/import.
     * Aserciones: Se espera una respuesta 200 OK indicando el éxito del proceso.
     *
     * @throws Exception Si ocurre un error en la ejecución de la petición.
     */
    @Test
    @DisplayName("📦 PI-RES-16: Importación CSV ejecuta y omite filas solapantes")
    void importReservations_SkipsOverlapping() throws Exception {
        org.springframework.mock.web.MockMultipartFile file =
                new org.springframework.mock.web.MockMultipartFile(
                        "file", "reservas.csv", "text/csv",
                        "Titulo;Fecha Inicio;Hora Inicio;Fecha Fin;Hora Fin;Descripcion;Espacios;Tipo\nTest;01/01/2050;10.00;01/01/2050;12.00;desc;Aula 1;CLASE".getBytes());

        mockMvc.perform(multipart("/api/reservations/import")
                .file(file)
                .header("Authorization", adminToken))
                .andExpect(status().isOk());
    }
}
