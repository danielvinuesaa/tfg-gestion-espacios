package com.tfg.backend.modules.analytics;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tfg.backend.BaseIntegrationTest;
import com.tfg.backend.core.security.JwtService;
import com.tfg.backend.modules.identity.model.Permission;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.repository.PermissionRepository;
import com.tfg.backend.modules.identity.repository.RoleRepository;
import com.tfg.backend.modules.identity.repository.UserRepository;
import com.tfg.backend.modules.analytics.repository.AuditLogRepository;
import com.tfg.backend.modules.identity.dto.UserRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Suite de pruebas de integración para la auditoría de acciones del sistema.
 * Verifica que las operaciones que modifican el estado (como llamadas REST a recursos auditables) 
 * generen correctamente los registros de auditoría y que estos puedan ser consultados mediante la API.
 */
@DisplayName("Tests de Integración: Auditoría de Acciones (API)")
class AuditIntegrationTest extends BaseIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext context;

    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private JwtService jwtService;

    private String adminToken;
    private User testUser;
    private Role profRole;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        auditLogRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();
        permissionRepository.deleteAll();

        Permission pUsers = permissionRepository.save(Permission.builder().name("GESTIONAR_USUARIOS").build());
        Permission pAudit = permissionRepository.save(Permission.builder().name("GENERAR_INFORMES").build());
        
        Role adminRole = roleRepository.save(Role.builder().name("ADMIN").permissions(Set.of(pUsers, pAudit)).build());
        profRole = roleRepository.save(Role.builder().name("PROFESOR").build());

        User admin = userRepository.save(User.builder().email("admin@uniovi.es").password("pass").name("Admin").role(adminRole).build());
        testUser = userRepository.save(User.builder().email("user@uniovi.es").password("pass").name("User").role(profRole).build());
        
        adminToken = "Bearer " + jwtService.generateToken(admin);
    }

    /**
     * Verifica que la ejecución de una petición REST auditable (por ejemplo, la actualización de un usuario)
     * persista un registro de auditoría en la base de datos y que posteriormente se pueda recuperar
     * dicha información a través del endpoint de consulta de logs de auditoría.
     */
    @Test
    @DisplayName("🧪 Una acción REST (Update User) genera un log de auditoría")
    void restActionGeneratesAuditLog() throws Exception {
        UserRequest request = UserRequest.builder()
                .name("Updated Name")
                .email("user@uniovi.es") // Añadir email para evitar validación fallida
                .roleId(profRole.getId())
                .status(com.tfg.backend.modules.identity.model.UserStatus.ACTIVO)
                .build();

        // 1. Ejecutar acción auditada (@Auditable en UserService)
        mockMvc.perform(put("/api/users/" + testUser.getId())
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // 2. Verificar que se ha creado el log
        assertTrue(auditLogRepository.count() > 0, "Debería haber al menos un log de auditoría");
        
        // 3. Consultar logs vía API
        mockMvc.perform(get("/api/audit-logs")
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].performedBy").value("Admin (ADMIN)"))
                .andExpect(jsonPath("$.content[0].action").exists());
    }
}
