package com.tfg.backend.modules.analytics.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tfg.backend.BaseIntegrationTest;
import com.tfg.backend.core.security.JwtService;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.repository.RoleRepository;
import com.tfg.backend.modules.identity.repository.UserRepository;
import com.tfg.backend.modules.analytics.model.AuditLog;
import com.tfg.backend.modules.analytics.repository.AuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;
import java.util.Set;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Suite de pruebas de integración para el controlador de registros de auditoría (AuditLogController).
 * Verifica que los endpoints REST expuestos para la consulta y exportación de logs
 * funcionen correctamente y respeten los controles de seguridad (acceso exclusivo para administradores).
 */
@DisplayName("Tests de Integración: AuditLogController (API)")
class AuditLogControllerIntegrationTest extends BaseIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private JwtService jwtService;

    private String adminToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        auditLogRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();

        Role adminRole = roleRepository.save(Role.builder().name("ADMIN").permissions(Set.of()).build());
        User admin = userRepository.save(User.builder().email("admin@test.com").password("pass").name("Admin").role(adminRole).build());
        
        adminToken = "Bearer " + jwtService.generateToken(admin);

        auditLogRepository.save(AuditLog.builder()
                .action("TEST_ACTION")
                .entityName("TEST_ENTITY")
                .performedBy("admin@test.com")
                .timestamp(LocalDateTime.now())
                .details("Test details")
                .build());
    }

    /**
     * Verifica que un usuario con rol de administrador pueda obtener la lista paginada
     * de los registros de auditoría y que estos incluyan la información detallada del usuario.
     */
    @Test
    @DisplayName("🔍 GET /api/audit-logs: Éxito para ADMIN")
    void getAuditLogs_Success() throws Exception {
        mockMvc.perform(get("/api/audit-logs")
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].action").value("TEST_ACTION"))
                .andExpect(jsonPath("$.content[0].performedBy").value("Admin (ADMIN)"));
    }

    /**
     * Verifica que la API permita filtrar correctamente los registros de auditoría
     * utilizando el parámetro de búsqueda por acción (ej. "TEST_ACTION").
     */
    @Test
    @DisplayName("🔍 GET /api/audit-logs: Filtrado por acción")
    void getAuditLogs_FilterByAction() throws Exception {
        mockMvc.perform(get("/api/audit-logs")
                .param("action", "TEST_ACTION")
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));

        mockMvc.perform(get("/api/audit-logs")
                .param("action", "OTHER")
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    /**
     * Verifica que el sistema deniegue el acceso y retorne un estado HTTP 403 Forbidden
     * cuando un usuario sin privilegios de administrador intenta consultar los registros de auditoría.
     */
    @Test
    @DisplayName("🚫 GET /api/audit-logs: Denegado para usuarios no ADMIN")
    void getAuditLogs_Forbidden() throws Exception {
        Role userRole = roleRepository.save(Role.builder().name("USER").build());
        User user = userRepository.save(User.builder().email("user@test.com").password("pass").name("User").role(userRole).build());
        String userToken = "Bearer " + jwtService.generateToken(user);

        mockMvc.perform(get("/api/audit-logs")
                .header("Authorization", userToken))
                .andExpect(status().isForbidden());
    }

    /**
     * Verifica que un administrador pueda exportar los registros de auditoría a un archivo CSV,
     * comprobando que los encabezados de respuesta indiquen correctamente el tipo de contenido y el nombre del archivo.
     */
    @Test
    @DisplayName("📄 GET /api/audit-logs/export: Exportación exitosa a CSV")
    void exportAuditLogs_Success() throws Exception {
        mockMvc.perform(get("/api/audit-logs/export")
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/csv; charset=UTF-8"))
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"auditoria.csv\""));
    }
}
