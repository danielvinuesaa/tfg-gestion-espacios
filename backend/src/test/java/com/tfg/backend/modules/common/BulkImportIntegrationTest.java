package com.tfg.backend.modules.common;

import com.tfg.backend.BaseIntegrationTest;
import com.tfg.backend.core.security.JwtService;
import com.tfg.backend.modules.identity.model.Permission;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.repository.PermissionRepository;
import com.tfg.backend.modules.identity.repository.RoleRepository;
import com.tfg.backend.modules.identity.repository.UserRepository;
import com.tfg.backend.modules.reservation.model.Subject;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.reservation.repository.SubjectRepository;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.space.model.SpaceStatus;
import com.tfg.backend.modules.space.model.SpaceType;
import com.tfg.backend.modules.space.repository.SpaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Suite de pruebas de integración para el módulo de importación masiva.
 * Verifica la correcta lectura, validación e inserción de datos provenientes de archivos CSV
 * tanto para espacios como para reservas, así como la seguridad de los endpoints.
 */
@DisplayName("Tests de Integración: Importaciones Masivas (API)")
class BulkImportIntegrationTest extends BaseIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private SpaceRepository spaceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private JwtService jwtService;

    private String adminToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        reservationRepository.deleteAll();
        spaceRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();
        permissionRepository.deleteAll();
        subjectRepository.deleteAll();

        // Admin con permisos
        Permission pImport = permissionRepository.save(Permission.builder().name("CREAR_ESPACIOS").build());
        Permission pApprove = permissionRepository.save(Permission.builder().name("APROBAR_RESERVA").build());
        Permission pImportRes = permissionRepository.save(Permission.builder().name("IMPORTAR_RESERVAS").build());
        
        Role adminRole = roleRepository.save(Role.builder().name("ADMIN").permissions(Set.of(pImport, pApprove, pImportRes)).build());
        User admin = userRepository.save(User.builder().email("admin@uniovi.es").password("pass").name("Admin").role(adminRole).build());
        adminToken = "Bearer " + jwtService.generateToken(admin);
    }

    /**
     * Verifica que un administrador pueda importar espacios correctamente mediante un archivo CSV.
     * Precondiciones: El usuario debe tener permisos de administración ("CREAR_ESPACIOS").
     * Ejecución: Se envía un archivo CSV válido en una petición multipart a /api/spaces/import.
     * Aserciones: Se espera una respuesta 200 OK y que el conteo de éxitos coincida con las filas válidas.
     *
     * @throws Exception Si ocurre un error en la ejecución de la petición.
     */
    @Test
    @DisplayName("🧪 Importar espacios vía CSV")
    void importSpacesFlow() throws Exception {
        String csvContent = "Nombre;Tipo;Capacidad;Estado;GisId\n" +
                           "Aula Test 1;AULA;30;DISPONIBLE;GIS-T1\n" +
                           "Aula Test 2;LABORATORIO;20;DISPONIBLE;GIS-T2";
        
        MockMultipartFile file = new MockMultipartFile(
                "file", "spaces.csv", "text/csv", csvContent.getBytes());

        mockMvc.perform(multipart("/api/spaces/import")
                .file(file)
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.successCount").value(2));
    }

    /**
     * Verifica que un administrador pueda importar reservas a través de un archivo CSV.
     * Precondiciones: Los espacios y asignaturas referenciados en el CSV deben existir previamente en BD. El usuario debe tener "IMPORTAR_RESERVAS".
     * Ejecución: Se envía un archivo CSV válido en una petición multipart a /api/reservations/import.
     * Aserciones: Se espera una respuesta 200 OK, la confirmación de la importación y que el registro se guarde en la BD.
     *
     * @throws Exception Si ocurre un error en la ejecución de la petición.
     */
    @Test
    @DisplayName("🧪 Importar reservas vía CSV")
    void importReservationsFlow() throws Exception {
        // Requisito: Espacio y Asignatura deben existir
        spaceRepository.save(Space.builder().name("Aula Import").type(SpaceType.AULA).totalCapacity(10).status(SpaceStatus.DISPONIBLE).build());
        subjectRepository.save(Subject.builder().code("TEST").name("Test Subject").course("23/24").build());

        // CSV Structure: 0:Título (con código asignatura), 1:F.Inicio, 2:H.Inicio, 3:F.Fin, 4:H.Fin, 5:Desc, 6:Espacios, 7:Tipo
        String csvContent = "Título;Fecha Inicio;Hora Inicio;Fecha Fin;Hora Fin;Descripción;Espacios;Tipo\n" +
                           "TEST. Reserva;10/10/2026;10.00;10/10/2026;12.00;Descripción Test;Aula Import;CLASE";
        
        MockMultipartFile file = new MockMultipartFile(
                "file", "reservations.csv", "text/csv", csvContent.getBytes());

        mockMvc.perform(multipart("/api/reservations/import")
                .file(file)
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.successCount").value(1))
                .andExpect(jsonPath("$.failureCount").value(0));

        assertEquals(1, reservationRepository.count());
    }

    /**
     * Verifica que el sistema bloquee intentos de importación masiva por parte de usuarios sin autenticación o sin permisos suficientes.
     * Precondiciones: Se intenta realizar la petición sin un token válido en los headers.
     * Ejecución: Se envía una petición multipart a /api/spaces/import.
     * Aserciones: Se espera una respuesta 403 Forbidden.
     *
     * @throws Exception Si ocurre un error en la ejecución de la petición.
     */
    @Test
    @DisplayName("🧪 Bloqueo de importación sin permisos")
    void importUnauthorized() throws Exception {
        mockMvc.perform(multipart("/api/spaces/import")
                .file(new MockMultipartFile("file", "x.csv", "text/csv", "data".getBytes())))
                .andExpect(status().isForbidden());
    }
}
