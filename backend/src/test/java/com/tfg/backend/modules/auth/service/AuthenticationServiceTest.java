package com.tfg.backend.modules.auth.service;

import com.tfg.backend.core.exception.BusinessValidationException;
import com.tfg.backend.core.exception.ResourceNotFoundException;
import com.tfg.backend.core.security.JwtService;
import com.tfg.backend.modules.analytics.service.AuditService;
import com.tfg.backend.modules.auth.dto.AuthenticationRequest;
import com.tfg.backend.modules.auth.dto.AuthenticationResponse;
import com.tfg.backend.modules.auth.dto.RegisterRequest;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.repository.RoleRepository;
import com.tfg.backend.modules.identity.repository.UserRepository;
import com.tfg.backend.modules.identity.validator.UserValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Suite de pruebas unitarias para el servicio de autenticación {@link AuthenticationService}.
 * Verifica el comportamiento de los procesos de registro, validación de credenciales y generación
 * de tokens JWT, garantizando que se apliquen las reglas de negocio y seguridad correspondientes.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Unitarios de AuthenticationService")
class AuthenticationServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private AuditService auditService;
    @Mock private UserValidator userValidator;

    private AuthenticationService authenticationService;

    @BeforeEach
    void setUp() {
        authenticationService = new AuthenticationService(
                userRepository, roleRepository, passwordEncoder, jwtService, authenticationManager, auditService, userValidator);
    }

    // --- PU-AUT-01: Registro exitoso ---
    /**
     * Verifica que el sistema registre exitosamente a un usuario nuevo cuando se proporcionan
     * datos válidos. Comprueba que se asigne el rol por defecto (PROFESOR), se cifre la contraseña,
     * se genere un token JWT y se registre la acción de auditoría correspondiente.
     */
    @Test
    @DisplayName("✅ PU-AUT-01: Registro exitoso de nuevo usuario con rol PROFESOR")
    void register_WhenValidRequest_ShouldCreateUserAndReturnToken() {
        RegisterRequest request = new RegisterRequest("Test User", "test@uniovi.es", "Pass1234!");
        Role professorRole = Role.builder().id(1L).name("PROFESOR").build();

        when(roleRepository.findByName("PROFESOR")).thenReturn(Optional.of(professorRole));
        when(passwordEncoder.encode("Pass1234!")).thenReturn("encoded_password");
        when(jwtService.generateToken(any(User.class))).thenReturn("jwt_token");

        AuthenticationResponse response = authenticationService.register(request);

        assertNotNull(response);
        assertEquals("jwt_token", response.getToken());
        verify(userValidator).validateEmail(eq("test@uniovi.es"), any());
        verify(userValidator).validatePasswordStrength("Pass1234!");
        verify(userRepository).save(any(User.class));
        verify(auditService).logAction(eq("User"), eq("REGISTRO_PUBLICO"), any(), anyString(), eq("test@uniovi.es"));
    }

    // --- PU-AUT-02: Registro con rol inexistente ---
    /**
     * Verifica que el sistema rechace el registro y lance una excepción si el rol por defecto
     * (PROFESOR) no se encuentra configurado en la base de datos.
     * 
     * @throws ResourceNotFoundException si el rol no existe.
     */
    @Test
    @DisplayName("❌ PU-AUT-02: Registro fallido si el rol PROFESOR no existe en el sistema")
    void register_WhenRoleNotFound_ShouldThrowException() {
        RegisterRequest request = new RegisterRequest("Test User", "test@uniovi.es", "password123");
        when(roleRepository.findByName("PROFESOR")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> authenticationService.register(request));
        verify(userRepository, never()).save(any());
    }

    // --- PU-AUT-03: Registro con email inválido ---
    /**
     * Verifica que el sistema propague la excepción correspondiente cuando el validador de usuario
     * detecta que el formato del correo electrónico proporcionado es inválido.
     * 
     * @throws BusinessValidationException si el formato del correo electrónico es inválido.
     */
    @Test
    @DisplayName("❌ PU-AUT-03: Registro fallido si el validador de email lanza excepción")
    void register_WhenEmailInvalid_ShouldPropagateException() {
        RegisterRequest request = new RegisterRequest("Test User", "invalid-email", "Pass1234!");
        doThrow(new BusinessValidationException("email", "formato inválido"))
                .when(userValidator).validateEmail(eq("invalid-email"), any());

        assertThrows(BusinessValidationException.class, () -> authenticationService.register(request));
        verify(userRepository, never()).save(any());
    }

    // --- PU-AUT-04: Registro con contraseña débil ---
    /**
     * Verifica que el sistema propague la excepción correspondiente cuando el validador de usuario
     * determina que la contraseña proporcionada no cumple con las políticas de seguridad (es débil).
     * 
     * @throws BusinessValidationException si la contraseña no cumple con la política de seguridad.
     */
    @Test
    @DisplayName("❌ PU-AUT-04: Registro fallido si el validador de contraseña lanza excepción")
    void register_WhenPasswordWeak_ShouldPropagateException() {
        RegisterRequest request = new RegisterRequest("Test User", "test@uniovi.es", "weak");
        doThrow(new BusinessValidationException("password", "contraseña débil"))
                .when(userValidator).validatePasswordStrength("weak");

        assertThrows(BusinessValidationException.class, () -> authenticationService.register(request));
        verify(userRepository, never()).save(any());
    }

    // --- PU-AUT-05: Autenticación exitosa ---
    /**
     * Verifica que el sistema autentique exitosamente al usuario y retorne un token JWT cuando
     * las credenciales proporcionadas son correctas y el usuario existe en la base de datos.
     */
    @Test
    @DisplayName("✅ PU-AUT-05: Autenticación exitosa con credenciales correctas retorna token JWT")
    void authenticate_WhenValidCredentials_ShouldReturnToken() {
        AuthenticationRequest request = new AuthenticationRequest("test@uniovi.es", "password123");
        User user = User.builder().id(1L).email("test@uniovi.es").build();

        when(userRepository.findByEmail("test@uniovi.es")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(user)).thenReturn("jwt_token");

        AuthenticationResponse response = authenticationService.authenticate(request);

        assertNotNull(response);
        assertEquals("jwt_token", response.getToken());
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    // --- PU-AUT-06: Autenticación con credenciales incorrectas ---
    /**
     * Verifica que el sistema propague la excepción de credenciales incorrectas lanzada por el
     * administrador de autenticación, evitando que se genere el token o se consulte al usuario.
     * 
     * @throws BadCredentialsException si las credenciales de autenticación son inválidas.
     */
    @Test
    @DisplayName("❌ PU-AUT-06: Autenticación rechazada con credenciales incorrectas propaga excepción")
    void authenticate_WhenInvalidCredentials_ShouldThrowException() {
        AuthenticationRequest request = new AuthenticationRequest("test@uniovi.es", "wrong_password");
        doThrow(new BadCredentialsException("Bad credentials"))
                .when(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));

        assertThrows(BadCredentialsException.class, () -> authenticationService.authenticate(request));
        verify(userRepository, never()).findByEmail(any());
    }

    // --- PU-AUT-10: Usuario no encontrado tras autenticación ---
    /**
     * Verifica que el sistema lance una excepción en el caso anómalo de que las credenciales
     * sean aceptadas por el gestor de autenticación, pero el usuario no exista en la base de datos local.
     * 
     * @throws Exception en caso de inconsistencia al no encontrar el usuario en la base de datos.
     */
    @Test
    @DisplayName("❌ PU-AUT-10: Usuario no encontrado en BD tras autenticación exitosa lanza excepción")
    void authenticate_WhenUserNotFoundAfterAuth_ShouldThrowException() {
        AuthenticationRequest request = new AuthenticationRequest("ghost@uniovi.es", "Pass1234!");
        // authManager no lanza excepción (credenciales aceptadas), pero el usuario no está en BD
        when(userRepository.findByEmail("ghost@uniovi.es")).thenReturn(Optional.empty());

        assertThrows(Exception.class, () -> authenticationService.authenticate(request));
    }
}
