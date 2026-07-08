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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.http.HttpHeaders;

import java.util.Set;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.tfg.backend.modules.analytics.dto.OccupancyRequest;
import com.tfg.backend.modules.analytics.dto.SignatureLogRequest;
import java.time.LocalDate;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

/**
 * Suite de pruebas de integración para el módulo completo de Analíticas e Informes.
 * Verifica que los procesos integrados de consulta de estadísticas, generación de reportes,
 * validaciones y flujos de seguridad funcionen correctamente de extremo a extremo.
 */
@DisplayName("Tests de Integración: Analíticas e Informes (API)")
class AnalyticsIntegrationTest extends BaseIntegrationTest {

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
    private JwtService jwtService;

    private String adminToken;
    private String profToken;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        userRepository.deleteAll();
        roleRepository.deleteAll();
        permissionRepository.deleteAll();

        // Admin con permisos de informes
        Permission pReports = permissionRepository.save(Permission.builder().name("GENERAR_INFORMES").build());
        Role adminRole = roleRepository.save(Role.builder().name("ADMIN").permissions(Set.of(pReports)).build());
        User admin = userRepository.save(User.builder().email("admin@uniovi.es").password("pass").name("Admin").role(adminRole).build());
        adminToken = "Bearer " + jwtService.generateToken(admin);

        // Profesor sin permisos de informes
        Role profRole = roleRepository.save(Role.builder().name("PROFESOR").permissions(Set.of()).build());
        User prof = userRepository.save(User.builder().email("prof@uniovi.es").password("pass").name("Profe").role(profRole).build());
        profToken = "Bearer " + jwtService.generateToken(prof);
    }

    /**
     * Verifica que cualquier usuario autenticado en el sistema, independientemente de sus roles
     * específicos o permisos avanzados, pueda acceder a su vista de estadísticas generales del panel de control.
     */
    @Test
    @DisplayName("🧪 Cualquiera autenticado accede a sus estadísticas")
    void getStatsFlow() throws Exception {
        mockMvc.perform(get("/api/stats")
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.systemTotals").exists());

        mockMvc.perform(get("/api/stats")
                .header("Authorization", profToken))
                .andExpect(status().isOk());
    }

    /**
     * Verifica el flujo completo de exportación de distintos tipos de informes (ocupación,
     * uso de asignaturas y registros de firmas) en los formatos soportados (CSV y PDF),
     * garantizando que los encabezados de respuesta sean los correctos.
     */
    @Test
    @DisplayName("🧪 Exportación de informes (CSV y PDF)")
    void reportExportFlow() throws Exception {
        // 1. Occupancy
        OccupancyRequest occReq = new OccupancyRequest();
        occReq.setSpaceIds(java.util.List.of(1L));
        occReq.setStartDate(LocalDate.now());
        occReq.setEndDate(LocalDate.now());

        mockMvc.perform(post("/api/reports/occupancy/csv")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(occReq)))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, "text/csv"));

        mockMvc.perform(post("/api/reports/occupancy/pdf")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(occReq)))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE));

        // 2. Subject Usage
        com.tfg.backend.modules.reservation.dto.SubjectUsageRequest subReq = new com.tfg.backend.modules.reservation.dto.SubjectUsageRequest();
        subReq.setSubjectIds(java.util.List.of(1L));
        subReq.setStartDate(LocalDate.now());
        subReq.setEndDate(LocalDate.now());

        mockMvc.perform(post("/api/reports/subject-usage/pdf")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(subReq)))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE));

        // 3. Signature Logs
        SignatureLogRequest sigReq = new SignatureLogRequest();
        sigReq.setSpaceIds(java.util.List.of(1L));
        sigReq.setStartDate(LocalDate.now());
        sigReq.setEndDate(LocalDate.now());

        mockMvc.perform(post("/api/reports/signature-logs/csv")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(sigReq)))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, "text/csv"));
    }

    /**
     * Verifica que el sistema aplique correctamente las validaciones sobre los datos de entrada
     * al solicitar un informe, por ejemplo, retornando un error HTTP 400 Bad Request si faltan fechas obligatorias.
     */
    @Test
    @DisplayName("❌ Validaciones: Reportes con fechas nulas")
    void reportValidationFailures() throws Exception {
        SignatureLogRequest sigReq = new SignatureLogRequest();
        sigReq.setStartDate(null); // Obligatorio

        mockMvc.perform(post("/api/reports/signature-logs")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(sigReq)))
                .andExpect(status().isBadRequest());
    }

    /**
     * Verifica que el flujo previo a la generación de informes funcione correctamente,
     * permitiendo validar si hay datos de disponibilidad para los espacios y fechas solicitadas.
     */
    @Test
    @DisplayName("🧪 Validación de disponibilidad para informes")
    void reportValidationFlow() throws Exception {
        SignatureLogRequest sigReq = new SignatureLogRequest();
        sigReq.setSpaceIds(java.util.List.of(1L));
        sigReq.setStartDate(LocalDate.now());
        sigReq.setEndDate(LocalDate.now());

        mockMvc.perform(post("/api/reports/validate-availability")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(sigReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}
