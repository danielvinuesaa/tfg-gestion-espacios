package com.tfg.backend.modules.space;

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
import com.tfg.backend.modules.reservation.dto.AvailabilitySearchRequest;
import com.tfg.backend.modules.space.dto.SpaceRequest;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Suite de pruebas de integración para la API de gestión de espacios.
 * <p>
 * Verifica los flujos completos de la API, incluyendo creación, edición,
 * borrado y listado, comprobando la correcta aplicación de reglas de negocio,
 * controles de acceso (RBAC) y la integridad de los datos almacenados.
 */
@DisplayName("Tests de Integración: Gestión de Espacios (API)")
class SpaceIntegrationTest extends BaseIntegrationTest {

    private MockMvc mockMvc;
    @Autowired private WebApplicationContext context;
    private ObjectMapper objectMapper;
    @Autowired private SpaceRepository spaceRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private PermissionRepository permissionRepository;
    @Autowired private ReservationRepository reservationRepository;
    @Autowired private JwtService jwtService;
    @Autowired private PasswordEncoder passwordEncoder;

    private String adminToken;
    private String profToken;
    private Space testSpace;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();

        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        spaceRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();
        permissionRepository.deleteAll();

        Permission pRead = permissionRepository.save(Permission.builder().name("LEER_ESPACIOS").build());
        Permission pCreate = permissionRepository.save(Permission.builder().name("CREAR_ESPACIOS").build());
        Permission pEdit = permissionRepository.save(Permission.builder().name("EDITAR_ESPACIOS").build());
        Permission pDelete = permissionRepository.save(Permission.builder().name("ELIMINAR_ESPACIOS").build());
        Permission pSolicitar = permissionRepository.save(Permission.builder().name("SOLICITAR_RESERVA").build());

        Role adminRole = roleRepository.save(Role.builder().name("ADMIN").permissions(Set.of(pRead, pCreate, pEdit, pDelete, pSolicitar)).build());
        Role profRole = roleRepository.save(Role.builder().name("PROFESOR").permissions(Set.of(pRead, pSolicitar)).build());

        String pass = passwordEncoder.encode("Pass1234!");
        User admin = userRepository.save(User.builder().email("admin@uniovi.es").password(pass).name("Admin").role(adminRole).status(com.tfg.backend.modules.identity.model.UserStatus.ACTIVO).build());
        User prof = userRepository.save(User.builder().email("prof@uniovi.es").password(pass).name("Profe").role(profRole).status(com.tfg.backend.modules.identity.model.UserStatus.ACTIVO).build());

        adminToken = "Bearer " + jwtService.generateToken(admin);
        profToken = "Bearer " + jwtService.generateToken(prof);

        testSpace = spaceRepository.save(Space.builder()
                .name("Aula 1.1").type(SpaceType.AULA).totalCapacity(50).status(SpaceStatus.DISPONIBLE).build());
    }

    /**
     * Verifica el flujo completo de gestión de espacios para un usuario administrador,
     * incluyendo la creación de un nuevo espacio, su recuperación y posterior actualización.
     */
    @Test
    @DisplayName("✅ admin: Flujo completo de gestión")
    void fullAdminFlow() throws Exception {
        // Crear
        SpaceRequest request = SpaceRequest.builder()
                .name("Aula 2.0").type(SpaceType.AULA).totalCapacity(30).status(SpaceStatus.DISPONIBLE).build();
        
        mockMvc.perform(post("/api/spaces")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Aula 2.0"));

        // Listar
        mockMvc.perform(get("/api/spaces")
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());

        // Update
        request.setName("Aula 2.1");
        mockMvc.perform(put("/api/spaces/" + testSpace.getId())
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Aula 2.1"));
    }

    /**
     * Verifica que un administrador pueda consultar exitosamente los conflictos de
     * reservas asociados a un espacio determinado.
     */
    @Test
    @DisplayName("🧪 conflicts: Consulta conflictos de espacio")
    void getConflicts_Success() throws Exception {
        mockMvc.perform(get("/api/spaces/" + testSpace.getId() + "/conflicts")
                .header("Authorization", adminToken))
                .andExpect(status().isOk());
    }

    /**
     * Verifica que un profesor pueda buscar espacios disponibles proporcionando un
     * rango de tiempo, tipo de espacio y capacidad mínima.
     */
    @Test
    @DisplayName("🧪 search-available: Sugiere espacios")
    void searchAvailable_Success() throws Exception {
        AvailabilitySearchRequest request = AvailabilitySearchRequest.builder()
                .startTime(LocalDateTime.now().plusDays(1).withHour(10).withMinute(0))
                .endTime(LocalDateTime.now().plusDays(1).withHour(12).withMinute(0))
                .types(List.of(SpaceType.AULA))
                .minCapacity(10)
                .build();

        mockMvc.perform(post("/api/spaces/search-available")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .header("Authorization", profToken))
                .andExpect(status().isOk());
    }

    /**
     * Verifica que el proceso de borrado múltiple elimine lógicamente los espacios
     * indicados, y que la restauración individual vuelva a hacerlos disponibles.
     */
    @Test
    @DisplayName("🗑️ bulkDelete: Borrado múltiple y restauración")
    void bulkDeleteAndRestore_Success() throws Exception {
        Space s2 = spaceRepository.save(Space.builder()
                .name("Aula 2").type(SpaceType.AULA).status(SpaceStatus.DISPONIBLE).totalCapacity(30).build());

        // Borrar
        mockMvc.perform(delete("/api/spaces/bulk")
                .param("ids", testSpace.getId().toString(), s2.getId().toString())
                .header("Authorization", adminToken))
                .andExpect(status().isNoContent());

        assertEquals(SpaceStatus.ELIMINADO, spaceRepository.findById(testSpace.getId()).get().getStatus());

        // Restaurar individual
        mockMvc.perform(post("/api/spaces/" + testSpace.getId() + "/restore")
                .header("Authorization", adminToken))
                .andExpect(status().isNoContent());
        
        assertEquals(SpaceStatus.DISPONIBLE, spaceRepository.findById(testSpace.getId()).get().getStatus());
    }

    /**
     * Verifica que el endpoint de exportación devuelva exitosamente un archivo CSV
     * con la información de los espacios registrados.
     */
    @Test
    @DisplayName("🧪 metadata: Exportar espacios")
    void exportSpaces_Success() throws Exception {
        mockMvc.perform(get("/api/spaces/export")
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/csv; charset=UTF-8"));
    }

    /**
     * Verifica que la API devuelva correctamente el listado de tipos de espacio
     * disponibles en el sistema.
     */
    @Test
    @DisplayName("✅ types: Recupera tipos de espacio")
    void getSpaceTypes_Success() throws Exception {
        mockMvc.perform(get("/api/spaces/types")
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(SpaceType.values().length));
    }

    /**
     * Verifica que el sistema rechace la creación de un nuevo espacio si
     * se provee un identificador GIS que ya se encuentra en uso.
     */
    @Test
    @DisplayName("🧪 PI-ESP-03: Creación con GIS ID duplicado")
    void createSpace_DuplicateGisId_Fails() throws Exception {
        // El testSpace ya tiene un gisId implícito nulo, creamos uno con gisId explícito
        SpaceRequest withGis = SpaceRequest.builder()
                .name("Aula GIS 1").type(SpaceType.AULA).totalCapacity(30)
                .status(SpaceStatus.DISPONIBLE).gisId("GIS-001").build();
        spaceRepository.save(com.tfg.backend.modules.space.model.Space.builder()
                .name("Aula GIS 1").type(SpaceType.AULA).totalCapacity(30)
                .status(SpaceStatus.DISPONIBLE).gisId("GIS-001").build());

        // Intentar crear otro con el mismo gisId debe fallar
        mockMvc.perform(post("/api/spaces")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(withGis)))
                .andExpect(status().isBadRequest());
    }

    /**
     * Verifica que el sistema rechace la creación de un nuevo espacio si
     * la capacidad total especificada es cero o negativa.
     */
    @Test
    @DisplayName("🧪 PI-ESP-04: Creación con capacidad cero")
    void createSpace_ZeroCapacity_Fails() throws Exception {
        SpaceRequest zeroCap = SpaceRequest.builder()
                .name("Aula Sin Cap").type(SpaceType.AULA)
                .totalCapacity(0).status(SpaceStatus.DISPONIBLE).build();

        mockMvc.perform(post("/api/spaces")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(zeroCap)))
                .andExpect(status().isBadRequest());
    }

    /**
     * Verifica que el sistema prohíba la creación de espacios a usuarios
     * que no poseen los permisos necesarios (por ejemplo, perfil de profesor).
     */
    @Test
    @DisplayName("🧪 PI-ESP-16: Restricción RBAC — profesor sin CREAR_ESPACIOS no puede crear")
    void createSpace_WithoutPermission_Fails() throws Exception {
        SpaceRequest request = SpaceRequest.builder()
                .name("Aula Bloqueada").type(SpaceType.AULA)
                .totalCapacity(20).status(SpaceStatus.DISPONIBLE).build();

        mockMvc.perform(post("/api/spaces")
                .header("Authorization", profToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    /**
     * Verifica que el sistema rechace la creación de un espacio si se provee
     * un nombre que ya está en uso por otro espacio activo.
     */
    @Test
    @DisplayName("🧪 PI-ESP-02: Creación con nombre duplicado")
    void createSpace_DuplicateName_Fails() throws Exception {
        // 'Aula 1.1' ya existe (creado en setUp)
        SpaceRequest dup = SpaceRequest.builder()
                .name("Aula 1.1").type(SpaceType.AULA)
                .totalCapacity(20).status(SpaceStatus.DISPONIBLE).build();

        mockMvc.perform(post("/api/spaces")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dup)))
                .andExpect(status().isBadRequest());
    }

    /**
     * Verifica que un espacio sin conflictos de reservas activas pueda ser
     * eliminado lógicamente de forma exitosa.
     */
    @Test
    @DisplayName("🗑️ PI-ESP-05: Eliminación individual sin conflictos")
    void deleteSpace_NoConflicts_Success() throws Exception {
        mockMvc.perform(delete("/api/spaces/" + testSpace.getId())
                .header("Authorization", adminToken))
                .andExpect(status().isNoContent());

        assertEquals(SpaceStatus.ELIMINADO, spaceRepository.findById(testSpace.getId()).get().getStatus());
    }

    /**
     * Verifica que si se fuerza (confirma) la eliminación de un espacio con
     * reservas activas, dichas reservas sean canceladas y el espacio eliminado.
     */
    @Test
    @DisplayName("🗑️ PI-ESP-06: Eliminación confirmada con reservas activas cancela reservas de espacio único")
    void deleteSpace_WithActiveReservations_CancelsReservations() throws Exception {
        // Crear una reserva activa vinculada al testSpace
        User admin = userRepository.findByEmail("admin@uniovi.es").get();
        Reservation res = reservationRepository.save(Reservation.builder()
                .title("Reserva Activa")
                .user(admin)
                .spaces(java.util.Set.of(testSpace))
                .startTime(java.time.LocalDateTime.now().plusDays(5))
                .endTime(java.time.LocalDateTime.now().plusDays(5).plusHours(2))
                .status(ReservationStatus.APROBADA)
                .type(ReservationType.CLASE)
                .build());
        Long resId = res.getId();

        // Borrar espacio con confirm=true — debe cancelar la reserva de espacio único
        mockMvc.perform(delete("/api/spaces/" + testSpace.getId())
                .param("confirm", "true")
                .header("Authorization", adminToken))
                .andExpect(status().isNoContent());

        assertEquals(SpaceStatus.ELIMINADO, spaceRepository.findById(testSpace.getId()).get().getStatus());
        assertEquals(ReservationStatus.CANCELADA, reservationRepository.findById(resId).get().getStatus());
    }
}
