package com.tfg.backend.modules.reservation;

import com.tfg.backend.BaseIntegrationTest;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.reservation.model.Subject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Suite de pruebas de integración para el controlador y gestión de asignaturas.
 * Cubre los endpoints de la API de asignaturas, verificando el comportamiento del sistema
 * desde la petición HTTP hasta la base de datos, incluyendo la seguridad.
 */
@DisplayName("Tests de Integración: Asignaturas (API)")
class SubjectIntegrationTest extends BaseIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private com.tfg.backend.modules.reservation.repository.SubjectRepository subjectRepository;
    @Autowired private com.tfg.backend.modules.identity.repository.UserRepository userRepository;
    @Autowired private com.tfg.backend.modules.identity.repository.RoleRepository roleRepository;
    @Autowired private com.tfg.backend.core.security.JwtService jwtService;

    private MockMvc mockMvc;
    private String userToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        subjectRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();

        Role profRole = roleRepository.save(Role.builder().name("PROFESOR").build());
        User prof = userRepository.save(User.builder()
                .email("prof@es")
                .name("Prof")
                .password("Pass1234!")
                .status(com.tfg.backend.modules.identity.model.UserStatus.ACTIVO)
                .role(profRole)
                .build());
        userToken = "Bearer " + jwtService.generateToken(prof);

        subjectRepository.save(Subject.builder().code("S1").name("Subject 1").course("1").build());
    }

    /**
     * Verifica que se recupere la lista de todas las asignaturas registradas en el sistema.
     * Precondiciones: El usuario debe estar autenticado y debe haber al menos una asignatura en la base de datos.
     * Ejecución: Se realiza una petición GET a /api/subjects.
     * Aserciones: Se espera una respuesta 200 OK y que el cuerpo contenga la lista de asignaturas.
     *
     * @throws Exception Si ocurre un error durante la ejecución de la petición.
     */
    @Test
    @DisplayName("✅ getAll: Recupera lista de asignaturas")
    void getAllSubjects_Success() throws Exception {
        mockMvc.perform(get("/api/subjects")
                .header("Authorization", userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].code").value("S1"));
    }

    /**
     * Verifica que se recupere correctamente una asignatura específica mediante su identificador.
     * Precondiciones: El usuario debe estar autenticado y la asignatura buscada debe existir.
     * Ejecución: Se realiza una petición GET a /api/subjects/{id}.
     * Aserciones: Se espera una respuesta 200 OK y que el cuerpo contenga los datos de la asignatura solicitada.
     *
     * @throws Exception Si ocurre un error durante la ejecución de la petición.
     */
    @Test
    @DisplayName("✅ getById: Recupera asignatura por ID")
    void getSubjectById_Success() throws Exception {
        Subject subject = subjectRepository.findAll().get(0);
        
        mockMvc.perform(get("/api/subjects/" + subject.getId())
                .header("Authorization", userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(subject.getId()))
                .andExpect(jsonPath("$.code").value("S1"));
    }

    /**
     * Verifica que el sistema responda adecuadamente cuando se solicita una asignatura que no existe.
     * Precondiciones: El usuario debe estar autenticado y se consulta un ID inexistente.
     * Ejecución: Se realiza una petición GET a /api/subjects/{id} con un ID no válido.
     * Aserciones: Se espera una respuesta 404 Not Found y el código de error RESOURCE_NOT_FOUND.
     *
     * @throws Exception Si ocurre un error durante la ejecución de la petición.
     */
    @Test
    @DisplayName("❌ getById: Retorna 404 si no existe")
    void getSubjectById_NotFound() throws Exception {
        mockMvc.perform(get("/api/subjects/999")
                .header("Authorization", userToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"));
    }
}
