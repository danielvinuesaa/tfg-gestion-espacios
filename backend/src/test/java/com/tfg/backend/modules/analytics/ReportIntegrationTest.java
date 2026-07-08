package com.tfg.backend.modules.analytics;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.tfg.backend.BaseIntegrationTest;
import com.tfg.backend.core.security.JwtService;
import com.tfg.backend.modules.identity.model.Permission;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.repository.PermissionRepository;
import com.tfg.backend.modules.identity.repository.RoleRepository;
import com.tfg.backend.modules.identity.repository.UserRepository;
import com.tfg.backend.modules.analytics.dto.SignatureLogRequest;
import com.tfg.backend.modules.reservation.dto.SubjectUsageRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Suite de pruebas de integración para la generación de informes (ReportIntegrationTest).
 * Verifica que los endpoints de reportes generen correctamente los archivos solicitados (PDF, CSV)
 * y que se apliquen correctamente los filtros de seguridad y validaciones de negocio correspondientes.
 */
@DisplayName("Tests de Integración: Generación de Informes (API)")
class ReportIntegrationTest extends BaseIntegrationTest {

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

        Permission pReports = permissionRepository.save(Permission.builder().name("GENERAR_INFORMES").build());
        Role adminRole = roleRepository.save(Role.builder().name("ADMIN").permissions(Set.of(pReports)).build());
        User admin = userRepository.save(User.builder().email("admin@test.com").password("pass").name("Admin").role(adminRole).build());
        
        adminToken = "Bearer " + jwtService.generateToken(admin);
    }

    /**
     * Verifica que el endpoint devuelva correctamente un informe en formato PDF
     * con los registros de firmas, dado un rango de fechas y una lista de espacios.
     */
    @Test
    @DisplayName("📄 POST /api/reports/signature-logs: Generar PDF de firmas")
    void generateSignatureLogsPDF() throws Exception {
        SignatureLogRequest request = new SignatureLogRequest();
        request.setStartDate(LocalDate.now());
        request.setEndDate(LocalDate.now().plusDays(1));
        request.setSpaceIds(List.of(1L));

        mockMvc.perform(post("/api/reports/signature-logs")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andExpect(header().exists("Content-Disposition"));
    }

    /**
     * Verifica que el endpoint genere correctamente un informe en formato PDF
     * detallando el uso de las asignaturas, filtrando por tipos de reserva.
     */
    @Test
    @DisplayName("📊 POST /api/reports/subject-usage/pdf: Generar PDF de uso de asignaturas")
    void generateSubjectUsagePDF() throws Exception {
        SubjectUsageRequest request = new SubjectUsageRequest();
        request.setStartDate(LocalDate.now());
        request.setEndDate(LocalDate.now().plusDays(7));
        request.setSubjectIds(List.of(1L));
        request.setReservationTypes(List.of(com.tfg.backend.modules.reservation.model.ReservationType.CLASE));

        mockMvc.perform(post("/api/reports/subject-usage/pdf")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"));
    }

    /**
     * Verifica que el endpoint devuelva correctamente un informe en formato CSV
     * con los registros de firmas para facilitar su exportación e importación en otras herramientas.
     */
    @Test
    @DisplayName("📑 POST /api/reports/signature-logs/csv: Generar CSV de firmas")
    void generateSignatureLogsCSV() throws Exception {
        SignatureLogRequest request = new SignatureLogRequest();
        request.setStartDate(LocalDate.now());
        request.setEndDate(LocalDate.now());
        request.setSpaceIds(List.of(1L));

        mockMvc.perform(post("/api/reports/signature-logs/csv")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/csv"));
    }

    /**
     * Verifica que el sistema bloquee el acceso y retorne un estado HTTP 403 Forbidden
     * cuando un usuario sin el permiso necesario intenta generar un informe de auditoría.
     */
    @Test
    @DisplayName("🚫 Generar informe sin permisos -> 403 Forbidden")
    void generateReportUnauthorized() throws Exception {
        // Creamos usuario sin permisos
        Role userRole = roleRepository.save(Role.builder().name("USER").permissions(Set.of()).build());
        User user = userRepository.save(User.builder().email("user@test.com").password("pass").name("User").role(userRole).build());
        String userToken = "Bearer " + jwtService.generateToken(user);

        SignatureLogRequest request = new SignatureLogRequest();
        request.setStartDate(LocalDate.now());
        request.setEndDate(LocalDate.now());

        mockMvc.perform(post("/api/reports/signature-logs")
                .header("Authorization", userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    /**
     * Verifica que el endpoint devuelva correctamente un informe de ocupación en formato PDF,
     * calculando y presentando la disponibilidad y uso de los espacios solicitados en el rango de fechas.
     */
    @Test
    @DisplayName("🏠 POST /api/reports/occupancy/pdf: Generar PDF de ocupación")
    void generateOccupancyPDF() throws Exception {
        com.tfg.backend.modules.analytics.dto.OccupancyRequest request = new com.tfg.backend.modules.analytics.dto.OccupancyRequest();
        request.setStartDate(LocalDate.now());
        request.setEndDate(LocalDate.now().plusDays(1));
        request.setSpaceIds(List.of(1L));

        mockMvc.perform(post("/api/reports/occupancy/pdf")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"));
    }

    /**
     * Verifica que el endpoint genere correctamente un informe de ocupación en formato CSV.
     */
    @Test
    @DisplayName("🏠 POST /api/reports/occupancy/csv: Generar CSV de ocupación")
    void generateOccupancyCSV() throws Exception {
        com.tfg.backend.modules.analytics.dto.OccupancyRequest request = new com.tfg.backend.modules.analytics.dto.OccupancyRequest();
        request.setStartDate(LocalDate.now());
        request.setEndDate(LocalDate.now().plusDays(1));
        request.setSpaceIds(List.of(1L));

        mockMvc.perform(post("/api/reports/occupancy/csv")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/csv"));
    }

    /**
     * Verifica el endpoint que consulta y valida la disponibilidad de espacios en un rango de fechas.
     */
    @Test
    @DisplayName("✅ POST /api/reports/validate-availability: Validar disponibilidad de espacios")
    void validateAvailability() throws Exception {
        SignatureLogRequest request = new SignatureLogRequest();
        request.setStartDate(LocalDate.now());
        request.setEndDate(LocalDate.now());
        request.setSpaceIds(List.of(1L));

        mockMvc.perform(post("/api/reports/validate-availability")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    /**
     * Verifica que el endpoint devuelva correctamente un archivo CSV con el informe del uso
     * de los espacios para las asignaturas solicitadas.
     */
    @Test
    @DisplayName("📊 POST /api/reports/subject-usage/csv: Generar CSV de uso de asignaturas")
    void exportSubjectUsageCSV() throws Exception {
        SubjectUsageRequest request = new SubjectUsageRequest();
        request.setStartDate(LocalDate.now());
        request.setEndDate(LocalDate.now().plusDays(7));
        request.setSubjectIds(List.of(1L));

        mockMvc.perform(post("/api/reports/subject-usage/csv")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/csv"));
    }

    /**
     * Verifica el endpoint que recupera una lista de reservas (en formato JSON)
     * asociadas a una asignatura particular dentro del periodo indicado.
     */
    @Test
    @DisplayName("📈 GET /api/reports/subject-usage: Obtener reservas por asignatura")
    void getSubjectUsage() throws Exception {
        mockMvc.perform(get("/api/reports/subject-usage")
                .param("subjectId", "1")
                .param("startDate", LocalDateTime.now().minusDays(1).toString())
                .param("endDate", LocalDateTime.now().plusDays(1).toString())
                .header("Authorization", adminToken))
                .andExpect(status().isOk());
    }

    /**
     * Verifica que el endpoint valide si existen registros o actividad para las asignaturas solicitadas
     * antes de proceder con la generación completa de un informe.
     */
    @Test
    @DisplayName("✅ POST /api/reports/validate-subjects-availability: Validar disponibilidad de asignaturas")
    void validateSubjectsAvailability() throws Exception {
        SubjectUsageRequest request = new SubjectUsageRequest();
        request.setStartDate(LocalDate.now());
        request.setEndDate(LocalDate.now());
        request.setSubjectIds(List.of(1L));

        mockMvc.perform(post("/api/reports/validate-subjects-availability")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }
}
