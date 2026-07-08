package com.tfg.backend.modules.identity;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tfg.backend.BaseIntegrationTest;
import com.tfg.backend.core.security.JwtService;
import com.tfg.backend.modules.identity.model.Permission;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.model.UserStatus;
import com.tfg.backend.modules.identity.repository.PermissionRepository;
import com.tfg.backend.modules.identity.repository.RoleRepository;
import com.tfg.backend.modules.identity.repository.UserRepository;
import com.tfg.backend.modules.identity.service.UserService;
import com.tfg.backend.modules.identity.dto.UserRequest;
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

import java.util.Set;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Suite de pruebas de integración para la gestión de usuarios a nivel de API.
 * Verifica la correcta ejecución de las operaciones CRUD, importación, exportación,
 * y validaciones de seguridad con sesiones activas.
 */
@DisplayName("Tests de Integración: Gestión de Usuarios (API)")
class UserIntegrationTest extends BaseIntegrationTest {

    private MockMvc mockMvc;
    @Autowired private WebApplicationContext context;
    @Autowired private JwtService jwtService;
    private ObjectMapper objectMapper;
    @Autowired private UserService userService;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private PermissionRepository permissionRepository;
    @Autowired private ReservationRepository reservationRepository;
    @Autowired private SpaceRepository spaceRepository;

    private Long roleId;
    private String adminToken;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();

        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        userRepository.deleteAll();
        roleRepository.deleteAll();
        permissionRepository.deleteAll();
        spaceRepository.deleteAll();
        
        Permission pManage = permissionRepository.save(Permission.builder().name("GESTIONAR_USUARIOS").build());
        Role adminRole = roleRepository.save(Role.builder().name("ADMIN").permissions(Set.of(pManage)).build());
        User admin = userRepository.save(User.builder().email("admin@uniovi.es").password("Pass1234!").name("Admin").role(adminRole).status(UserStatus.ACTIVO).build());
        adminToken = "Bearer " + jwtService.generateToken(admin);

        Role role = roleRepository.save(Role.builder().name("PROFESOR").build());
        roleId = role.getId();
    }

    /**
     * Verifica que el flujo CRUD completo (crear, obtener, actualizar, listar conflictos,
     * eliminar y restaurar) de un usuario funcione adecuadamente desde la API.
     */
    @Test
    @DisplayName("🧪 CRUD completo vía API")
    void apiUserCrud() throws Exception {
        // 1. Create
        UserRequest request = new UserRequest();
        request.setName("New User");
        request.setEmail("new@uniovi.es");
        request.setPassword("Pass1234!");
        request.setRoleId(roleId);
        request.setStatus(UserStatus.ACTIVO);

        String json = mockMvc.perform(post("/api/users")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("new@uniovi.es"))
                .andReturn().getResponse().getContentAsString();
        
        Long userId = objectMapper.readTree(json).get("id").asLong();

        // 2. Get Me
        mockMvc.perform(get("/api/users/me")
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("admin@uniovi.es"));

        // 3. Update
        request.setName("Updated Name");
        mockMvc.perform(put("/api/users/" + userId)
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Name"));

        // 4. Conflicts
        mockMvc.perform(get("/api/users/" + userId + "/conflicts")
                .header("Authorization", adminToken))
                .andExpect(status().isOk());

        // 5. Delete
        mockMvc.perform(delete("/api/users/" + userId)
                .header("Authorization", adminToken))
                .andExpect(status().isNoContent());

        assertEquals(UserStatus.ELIMINADO, userRepository.findById(userId).get().getStatus());

        // 6. Restore
        mockMvc.perform(post("/api/users/" + userId + "/restore")
                .header("Authorization", adminToken))
                .andExpect(status().isNoContent());

        assertEquals(UserStatus.ACTIVO, userRepository.findById(userId).get().getStatus());
    }

    /**
     * Verifica que los usuarios que posean permisos de gestión de reservas puedan listar
     * de manera exitosa los usuarios registrados en el sistema.
     */
    @Test
    @DisplayName("👥 Listar usuarios con permisos de gestión de reservas")
    void listUsersWithReservationPermissions() throws Exception {
        Permission pApprove = permissionRepository.save(Permission.builder().name("APROBAR_RESERVA").build());
        Role managerRole = roleRepository.save(Role.builder().name("RESERVATION_MANAGER").permissions(Set.of(pApprove)).build());
        User manager = userRepository.save(User.builder().email("manager_res@uniovi.es").password("Pass1234!").name("Manager").role(managerRole).status(UserStatus.ACTIVO).build());
        String managerToken = "Bearer " + jwtService.generateToken(manager);

        mockMvc.perform(get("/api/users")
                .header("Authorization", managerToken))
                .andExpect(status().isOk());
    }

    /**
     * Verifica que la API devuelva un error (Bad Request) si se intenta crear un usuario
     * con una dirección de correo electrónico que ya existe.
     */
    @Test
    @DisplayName("❌ create: Email duplicado")
    void createUser_DuplicateEmail_Fail() throws Exception {
        UserRequest request = new UserRequest();
        request.setName("Dup");
        request.setEmail("admin@uniovi.es"); // Ya existe
        request.setPassword("Pass1234!");
        request.setRoleId(roleId);

        mockMvc.perform(post("/api/users")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    /**
     * Verifica el correcto funcionamiento de las operaciones masivas de usuarios,
     * incluyendo la consulta de conflictos y el borrado en lote desde la API.
     */
    @Test
    @DisplayName("🧪 Operaciones masivas de usuarios")
    void bulkUserOperations() throws Exception {
        User u1 = userRepository.save(User.builder().email("u1@uniovi.es").password("p").name("U1").role(roleRepository.findById(roleId).get()).build());
        User u2 = userRepository.save(User.builder().email("u2@uniovi.es").password("p").name("U2").role(roleRepository.findById(roleId).get()).build());

        // 1. Get Bulk Conflicts
        mockMvc.perform(get("/api/users/bulk/conflicts")
                .param("ids", u1.getId().toString(), u2.getId().toString())
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalTarget").value(2));

        // 2. Delete Bulk
        mockMvc.perform(delete("/api/users/bulk")
                .param("ids", u1.getId().toString(), u2.getId().toString())
                .header("Authorization", adminToken))
                .andExpect(status().isNoContent());

        assertEquals(UserStatus.ELIMINADO, userRepository.findById(u1.getId()).get().getStatus());
        assertEquals(UserStatus.ELIMINADO, userRepository.findById(u2.getId()).get().getStatus());
    }

    /**
     * Verifica la correcta exportación de datos de usuarios,
     * comprobando que el archivo resultante tenga formato CSV y contenga los datos esperados.
     */
    @Test
    @DisplayName("📥 export: Genera CSV correctamente")
    void exportUsers_Success() throws Exception {
        mockMvc.perform(get("/api/users/export")
                .header("Authorization", adminToken)
                .param("columns", "name", "email"))
                .andExpect(status().isOk())
                .andExpect(header().string(org.springframework.http.HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8"))
                .andExpect(content().string(containsString("Admin")));
    }

    /**
     * Verifica la funcionalidad de importación de usuarios mediante un archivo CSV
     * bajo el modo de actualización, sobreescribiendo datos de usuarios ya existentes.
     */
    @Test
    @DisplayName("📥 PI-USR-09: Importación CSV en modo actualizar")
    void importUsers_UpdateMode_Success() throws Exception {
        // Preparar CSV con el mismo email que el admin (modo actualizar nombre)
        String csvContent = "nombre;email;rol\nAdmin Actualizado;admin@uniovi.es;ADMIN";
        byte[] csvBytes = csvContent.getBytes();

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                .multipart("/api/users/import")
                .file(new org.springframework.mock.web.MockMultipartFile(
                        "file", "users.csv", "text/csv", csvBytes))
                .param("overwrite", "true")
                .header("Authorization", adminToken))
                .andExpect(status().isOk());
    }
    /**
     * Verifica que la importación de un archivo CSV con el modo sobreescribir desactivado
     * sea capaz de registrar exitosamente a los nuevos usuarios en el sistema.
     */
    @Test
    @DisplayName("📊 PI-USR-08: Importación CSV de nuevos usuarios")
    void importUsers_NewUsers_Success() throws Exception {
        String csvContent = "nombre;email;rol\nNuevo Usuario;nuevo@uniovi.es;ADMIN";
        byte[] csvBytes = csvContent.getBytes();

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                .multipart("/api/users/import")
                .file(new org.springframework.mock.web.MockMultipartFile(
                        "file", "users.csv", "text/csv", csvBytes))
                .param("overwrite", "false")
                .header("Authorization", adminToken))
                .andExpect(status().isOk());

        // Verificar que el usuario fue creado
        assertTrue(userRepository.findByEmail("nuevo@uniovi.es").isPresent());
    }

    /**
     * Verifica que si un administrador bloquea a un usuario que tiene una sesión activa,
     * cualquier petición posterior con su token sea denegada (Error 403 o 401).
     */
    @Test
    @DisplayName("🛑 PI-USR-04: Bloqueo de usuario con sesión activa → siguiente petición retorna 403")
    void blockUser_ActiveSession_Returns403() throws Exception {
        // 1. Crear un usuario normal y obtener su token
        UserRequest req = new UserRequest();
        req.setName("Usuario Bloqueable");
        req.setEmail("block@uniovi.es");
        req.setPassword("Pass1234!");
        req.setRoleId(roleId);
        req.setStatus(UserStatus.ACTIVO);

        String json = mockMvc.perform(post("/api/users")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long userId = objectMapper.readTree(json).get("id").asLong();
        User blockableUser = userRepository.findById(userId).get();
        String blockableToken = "Bearer " + jwtService.generateToken(blockableUser);

        // Confirmar que con su token puede acceder a sus datos
        mockMvc.perform(get("/api/users/me")
                .header("Authorization", blockableToken))
                .andExpect(status().isOk());

        // 2. El admin bloquea al usuario
        req.setStatus(UserStatus.BLOQUEADO);
        mockMvc.perform(put("/api/users/" + userId)
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        // 3. El token anterior del usuario bloqueado ya no permite acceso
        mockMvc.perform(get("/api/users/me")
                .header("Authorization", blockableToken))
                .andExpect(status().is4xxClientError());
    }

    /**
     * Verifica que la eliminación forzada de un usuario que posee reservas activas
     * logre eliminar al usuario y, al mismo tiempo, cancele sus reservas pendientes.
     */
    @Test
    @DisplayName("🗑️ PI-USR-05: Eliminación forzosa de usuario con reservas activas cancela sus reservas")
    void forceDeleteUser_WithActiveReservations_CancelsReservations() throws Exception {
        // 1. Crear espacio y usuario objetivo
        Space space = spaceRepository.save(Space.builder()
                .name("Aula Test").type(SpaceType.AULA)
                .totalCapacity(30).status(SpaceStatus.DISPONIBLE).build());

        UserRequest req = new UserRequest();
        req.setName("Usuario Con Reservas");
        req.setEmail("userres@uniovi.es");
        req.setPassword("Pass1234!");
        req.setRoleId(roleId);
        req.setStatus(UserStatus.ACTIVO);

        String json = mockMvc.perform(post("/api/users")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long userId = objectMapper.readTree(json).get("id").asLong();
        User targetUser = userRepository.findById(userId).get();

        // 2. Crear una reserva activa para ese usuario
        Reservation res = reservationRepository.save(Reservation.builder()
                .title("Reserva del usuario")
                .user(targetUser)
                .spaces(java.util.Set.of(space))
                .startTime(java.time.LocalDateTime.now().plusDays(3))
                .endTime(java.time.LocalDateTime.now().plusDays(3).plusHours(2))
                .status(ReservationStatus.APROBADA)
                .type(ReservationType.CLASE)
                .build());
        Long resId = res.getId();

        // 3. Eliminar forzosamente al usuario (force=true)
        mockMvc.perform(delete("/api/users/" + userId)
                .param("force", "true")
                .header("Authorization", adminToken))
                .andExpect(status().isNoContent());

        // 4. Verificar que el usuario está ELIMINADO y su reserva CANCELADA
        assertEquals(UserStatus.ELIMINADO, userRepository.findById(userId).get().getStatus());
        assertEquals(ReservationStatus.CANCELADA, reservationRepository.findById(resId).get().getStatus());
    }
}
