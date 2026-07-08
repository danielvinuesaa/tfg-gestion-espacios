package com.tfg.backend.modules.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tfg.backend.BaseIntegrationTest;
import com.tfg.backend.modules.auth.dto.AuthenticationRequest;
import com.tfg.backend.modules.auth.dto.RegisterRequest;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.repository.RoleRepository;
import com.tfg.backend.modules.identity.repository.UserRepository;
import com.tfg.backend.modules.identity.model.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Suite de pruebas de integración para el módulo de Autenticación y Seguridad.
 * Verifica el flujo completo de registro, inicio de sesión, manejo de tokens JWT, control de acceso
 * basado en el estado del usuario (bloqueado o eliminado) y la gestión del cambio de contraseña.
 */
@DisplayName("Tests de Integración: Autenticación y Seguridad")
class AuthenticationIntegrationTest extends BaseIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext context;

    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        userRepository.deleteAll();
        roleRepository.deleteAll();
        roleRepository.save(Role.builder().name("PROFESOR").build());
    }

    /**
     * Verifica el flujo completo de registro de un nuevo usuario, el inicio de sesión posterior
     * exitoso obteniendo un token JWT y un intento de inicio de sesión fallido por credenciales inválidas.
     *
     * @throws Exception en caso de error durante la ejecución de las peticiones HTTP.
     */
    @Test
    @DisplayName("🧪 Registro -> Login -> Obtención de Token")
    void registrationAndLoginFlow() throws Exception {
        // 1. Registro
        RegisterRequest regRequest = new RegisterRequest("Juan IT", "juan@uniovi.es", "Pass1234!");
        
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(regRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").exists());

        // 2. Login con éxito
        AuthenticationRequest authRequest = new AuthenticationRequest("juan@uniovi.es", "Pass1234!");
        
        mockMvc.perform(post("/api/auth/authenticate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(authRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());

        // 3. Login fallido (contraseña incorrecta)
        AuthenticationRequest badRequest = new AuthenticationRequest("juan@uniovi.es", "wrong");
        
        mockMvc.perform(post("/api/auth/authenticate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(badRequest)))
                .andExpect(status().isUnauthorized()); // 401
    }

    /**
     * Verifica que el sistema impida el inicio de sesión para aquellos usuarios cuyo estado
     * es BLOQUEADO o ELIMINADO, retornando el código de estado 401 Unauthorized y un mensaje explicativo.
     *
     * @throws Exception en caso de error durante la ejecución de las peticiones HTTP.
     */
    @Test
    @DisplayName("🧪 Login con Usuario Bloqueado o Eliminado -> Error Profesional")
    void loginWithBlockedAndDeletedUsers() throws Exception {
        Role role = roleRepository.findByName("PROFESOR").orElseThrow();
        
        // 1. Usuario Bloqueado
        User blockedUser = User.builder()
                .name("Bloqueado")
                .email("blocked@uniovi.es")
                .password(passwordEncoder.encode("Pass123!"))
                .role(role)
                .status(UserStatus.BLOQUEADO)
                .build();
        userRepository.save(blockedUser);

        AuthenticationRequest blockedRequest = new AuthenticationRequest("blocked@uniovi.es", "Pass123!");
        
        mockMvc.perform(post("/api/auth/authenticate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(blockedRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", containsString("bloqueada")));

        // 2. Usuario Eliminado
        User deletedUser = User.builder()
                .name("Eliminado")
                .email("deleted@uniovi.es")
                .password(passwordEncoder.encode("Pass123!"))
                .role(role)
                .status(UserStatus.ELIMINADO)
                .build();
        userRepository.save(deletedUser);

        AuthenticationRequest deletedRequest = new AuthenticationRequest("deleted@uniovi.es", "Pass123!");
        
        mockMvc.perform(post("/api/auth/authenticate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(deletedRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", containsString("desactivada")));
    }

    /**
     * Verifica que el sistema de validación de entradas intercepte las peticiones con datos inválidos
     * durante el registro y la autenticación (como correos mal formados, contraseñas cortas o campos vacíos)
     * retornando en estos casos un código 400 Bad Request.
     *
     * @throws Exception en caso de error durante la ejecución de las peticiones HTTP.
     */
    @Test
    @DisplayName("❌ Validaciones: Datos inválidos en Auth")
    void authValidationFailures() throws Exception {
        // 1. Email inválido
        RegisterRequest badEmail = new RegisterRequest("Juan", "juan-invalid", "Pass1234!");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(badEmail)))
                .andExpect(status().isBadRequest());

        // 2. Contraseña corta
        RegisterRequest shortPass = new RegisterRequest("Juan", "juan@es", "123");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(shortPass)))
                .andExpect(status().isBadRequest());

        // 3. Campos vacíos
        AuthenticationRequest empty = new AuthenticationRequest("", "");
        mockMvc.perform(post("/api/auth/authenticate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(empty)))
                .andExpect(status().isBadRequest());
    }

    /**
     * Verifica que los endpoints protegidos (e.g. /api/notifications) rechacen el acceso si
     * no se proveen credenciales de autenticación válidas o un token JWT en las cabeceras.
     *
     * @throws Exception en caso de error durante la ejecución de las peticiones HTTP.
     */
    @Test
    @DisplayName("🔒 PI-AUT-07 y PI-AUT-08: Acceso a endpoint protegido sin credenciales válidas")
    void accessProtectedEndpointWithoutValidCredentials() throws Exception {
        // Sin token: Spring Security deniega el acceso (401 o 403 según configuración)
        mockMvc.perform(get("/api/notifications"))
                .andExpect(status().is4xxClientError());
    }

    /**
     * Verifica que un usuario autenticado pueda cambiar su contraseña exitosamente si proporciona
     * su contraseña actual correcta. Comprueba que se pueda iniciar sesión con la nueva contraseña
     * y que el acceso con la antigua contraseña sea denegado.
     *
     * @throws Exception en caso de error durante la ejecución de las peticiones HTTP.
     */
    @Test
    @DisplayName("🔐 PI-AUT-09: Cambio de contraseña exitoso y verificación posterior")
    void changePassword_CorrectCurrentPassword_Succeeds() throws Exception {
        // 1. Registrar usuario
        RegisterRequest reg = new RegisterRequest("Pass OK", "passok@uniovi.es", "Pass1234!");
        String responseBody = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String token = "Bearer " + objectMapper.readTree(responseBody).get("token").asText();

        // 2. Cambiar contraseña con la clave actual correcta
        mockMvc.perform(put("/api/users/me/password")
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currentPassword\":\"Pass1234!\",\"newPassword\":\"NewPass456!\"}" ))
                .andExpect(status().isNoContent());

        // 3. El login posterior con la nueva contraseña debe funcionar
        AuthenticationRequest loginWithNew = new AuthenticationRequest("passok@uniovi.es", "NewPass456!");
        mockMvc.perform(post("/api/auth/authenticate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginWithNew)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());

        // 4. Y el login con la contraseña antigua ya no debe funcionar
        AuthenticationRequest loginWithOld = new AuthenticationRequest("passok@uniovi.es", "Pass1234!");
        mockMvc.perform(post("/api/auth/authenticate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginWithOld)))
                .andExpect(status().isUnauthorized());
    }

    /**
     * Verifica que el sistema rechace un intento de cambio de contraseña cuando la clave actual
     * proporcionada por el usuario autenticado es incorrecta, devolviendo un error 400 Bad Request.
     *
     * @throws Exception en caso de error durante la ejecución de las peticiones HTTP.
     */
    @Test
    @DisplayName("🔐 PI-AUT-10: Cambio de contraseña con clave actual incorrecta")
    void changePassword_WrongCurrentPassword_Fails() throws Exception {
        // Registrar usuario
        RegisterRequest reg = new RegisterRequest("Pass Test", "passtest@uniovi.es", "Pass1234!");
        String responseBody = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String token = "Bearer " + objectMapper.readTree(responseBody).get("token").asText();

        // Intentar cambiar contraseña con la clave actual incorrecta
        mockMvc.perform(put("/api/users/me/password")
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currentPassword\":\"WrongPass999!\",\"newPassword\":\"NewPass456!\"}"))
                .andExpect(status().isBadRequest());
    }
}
