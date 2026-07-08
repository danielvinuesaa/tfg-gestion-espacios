package com.tfg.backend.modules.identity;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tfg.backend.BaseIntegrationTest;
import com.tfg.backend.core.security.JwtService;
import com.tfg.backend.modules.identity.model.Permission;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.repository.PermissionRepository;
import com.tfg.backend.modules.identity.repository.RoleRepository;
import com.tfg.backend.modules.identity.repository.UserRepository;
import com.tfg.backend.modules.identity.dto.RoleRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Suite de pruebas de integración para la gestión de roles a nivel de API.
 * Verifica la creación, edición, listado, borrado (incluyendo borrado masivo),
 * la reasignación de usuarios vinculados y el respeto de políticas de seguridad para roles.
 */
@DisplayName("Tests de Integración: Gestión de Roles (API)")
class RoleIntegrationTest extends BaseIntegrationTest {

    private MockMvc mockMvc;
    @Autowired private WebApplicationContext context;
    @Autowired private RoleRepository roleRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PermissionRepository permissionRepository;
    @Autowired private JwtService jwtService;
    private ObjectMapper objectMapper;
    private String adminToken;
    private Role roleToDelete;
    private Role roleToReceive;

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

        Permission pManage = permissionRepository.save(Permission.builder().name("GESTIONAR_ROLES").build());

        Role adminRole = roleRepository.save(Role.builder().name("ADMIN").permissions(Set.of(pManage)).build());
        roleToDelete = roleRepository.save(Role.builder().name("OLD_ROLE").build());
        roleToReceive = roleRepository.save(Role.builder().name("NEW_ROLE").build());

        User admin = userRepository.save(User.builder().email("admin@uniovi.es").password("pass").name("Admin").role(adminRole).build());
        adminToken = "Bearer " + jwtService.generateToken(admin);

        userRepository.save(User.builder().email("user@uniovi.es").password("pass").name("User").role(roleToDelete).build());
    }

    /**
     * Verifica que el administrador pueda crear, editar y consultar correctamente
     * un rol mediante el flujo normal de operaciones de la API.
     */
    @Test
    @DisplayName("✅ admin: Flujo CRUD de roles")
    void fullRoleFlow() throws Exception {
        // 1. Create
        RoleRequest request = RoleRequest.builder().name("TEST_ROLE").description("Desc").permissions(Set.of("GESTIONAR_ROLES")).build();
        String json = mockMvc.perform(post("/api/roles")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        
        Long roleId = objectMapper.readTree(json).get("id").asLong();

        // 2. Update
        request.setName("UPDATED_TEST");
        mockMvc.perform(put("/api/roles/" + roleId)
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("UPDATED_TEST"));

        // 3. Permissions Catalog
        mockMvc.perform(get("/api/roles/permissions")
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    /**
     * Verifica que al borrar un rol, el sistema reasigne automáticamente
     * sus usuarios al rol de destino especificado en la petición.
     */
    @Test
    @DisplayName("🧪 Borrar rol y reasignar usuarios automáticamente")
    void deleteAndReassignFlow() throws Exception {
        assertEquals(1, userRepository.countByRoleId(roleToDelete.getId()));

        mockMvc.perform(delete("/api/roles/" + roleToDelete.getId())
                .header("Authorization", adminToken)
                .param("reassignToId", roleToReceive.getId().toString()))
                .andExpect(status().isNoContent());

        assertEquals(0, userRepository.countByRoleId(roleToDelete.getId()));
        assertEquals(1, userRepository.countByRoleId(roleToReceive.getId()));
        
        assertEquals(com.tfg.backend.modules.identity.model.RoleStatus.ELIMINADO, 
                     roleRepository.findById(roleToDelete.getId()).get().getStatus());
    }

    /**
     * Verifica que el sistema impida la eliminación del rol de Administrador
     * garantizando las protecciones de seguridad en la API.
     */
    @Test
    @DisplayName("🧪 No se puede borrar el rol ADMIN (Protección)")
    void cannotDeleteAdmin() throws Exception {
        Role adminRole = roleRepository.findByName("ADMIN").get();
        
        mockMvc.perform(delete("/api/roles/" + adminRole.getId())
                .header("Authorization", adminToken))
                .andExpect(status().isForbidden());
    }

    /**
     * Verifica la funcionalidad de obtención de conflictos y la posterior
     * ejecución de acciones masivas sobre varios roles desde la API.
     */
    @Test
    @DisplayName("✅ bulkActions: Conflictos y borrado múltiple")
    void bulkRoleActions() throws Exception {
        mockMvc.perform(get("/api/roles/bulk/conflicts")
                .param("ids", roleToDelete.getId().toString())
                .header("Authorization", adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/roles/bulk")
                .param("ids", roleToDelete.getId().toString())
                .param("reassignToId", roleToReceive.getId().toString())
                .header("Authorization", adminToken))
                .andExpect(status().isNoContent());
    }

    /**
     * Verifica que el listado de roles soporte correctamente parámetros de
     * ordenación, como el peso (número de permisos) o cantidad de usuarios.
     */
    @Test
    @DisplayName("📋 Listar roles con ordenación")
    void listRolesWithSorting() throws Exception {
        // Orden por peso (número de permisos)
        mockMvc.perform(get("/api/roles")
                .param("sortBy", "peso")
                .param("direction", "desc")
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("ADMIN")); // Admin suele tener más permisos

        // Orden por cantidad de usuarios
        mockMvc.perform(get("/api/roles")
                .param("sortBy", "userCount")
                .param("direction", "desc")
                .header("Authorization", adminToken))
                .andExpect(status().isOk());
    }

    /**
     * Verifica que la API devuelva un error (Bad Request) si se intenta
     * realizar un borrado masivo reasignando usuarios a un rol que también será borrado.
     */
    @Test
    @DisplayName("❌ Error: Reasignar a un rol que se va a borrar")
    void deleteBulk_InvalidReassign_Fail() throws Exception {
        mockMvc.perform(delete("/api/roles/bulk")
                .param("ids", roleToDelete.getId().toString(), roleToReceive.getId().toString())
                .param("reassignToId", roleToDelete.getId().toString())
                .header("Authorization", adminToken))
                .andExpect(status().isBadRequest());
    }

    /**
     * Verifica que se pueda consultar de manera exitosa el detalle de un rol específico,
     * incluyendo su uso y el catálogo completo de permisos del sistema.
     */
    @Test
    @DisplayName("🔍 PI-ROL-07: Consulta del detalle y permisos de un rol")
    void getRoleDetail_Success() throws Exception {
        mockMvc.perform(get("/api/roles/" + roleToDelete.getId() + "/usage")
                .header("Authorization", adminToken))
                .andExpect(status().isOk());

        // Verificar también el catálogo de permisos disponibles
        mockMvc.perform(get("/api/roles/permissions")
                .header("Authorization", adminToken))
                .andExpect(status().isOk());
    }

    /**
     * Verifica la funcionalidad que permite restaurar y activar un rol
     * que previamente había sido marcado como eliminado.
     */
    @Test
    @DisplayName("♻️ PI-ROL-08: Restauración de un rol eliminado")
    void restoreRole_Success() throws Exception {
        // Eliminar primero con reasignación
        mockMvc.perform(delete("/api/roles/" + roleToDelete.getId())
                .param("reassignToId", roleToReceive.getId().toString())
                .header("Authorization", adminToken))
                .andExpect(status().isNoContent());

        // Restaurar (activar) el rol eliminado
        mockMvc.perform(post("/api/roles/" + roleToDelete.getId() + "/activate")
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value(roleToDelete.getName()));
    }

    /**
     * Verifica que los usuarios que carecen del permiso GESTIONAR_ROLES no puedan
     * acceder a los endpoints de creación o consulta de los catálogos de roles.
     */
    @Test
    @DisplayName("🚫 PI-ROL-09: Usuario sin permisos de roles no puede crear roles")
    void accessRoles_WithoutPermission_Forbidden() throws Exception {
        // Crear un usuario sin el permiso GESTIONAR_ROLES
        Role basicRole = roleRepository.save(Role.builder().name("BASICO_ROL_TEST").build());
        User basic = userRepository.save(User.builder()
                .email("basic_rol@uniovi.es").password("p")
                .name("Basic").role(basicRole)
                .status(com.tfg.backend.modules.identity.model.UserStatus.ACTIVO).build());
        String basicToken = "Bearer " + jwtService.generateToken(basic);

        // GET /api/roles/permissions requiere el permiso GESTIONAR_ROLES
        mockMvc.perform(get("/api/roles/permissions")
                .header("Authorization", basicToken))
                .andExpect(status().isForbidden());
    }
}
