package com.tfg.backend.modules.identity.validator;

import com.tfg.backend.core.exception.BusinessValidationException;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.model.UserStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Suite de pruebas unitarias para el validador de usuarios (UserValidator).
 * Verifica la exhaustividad y correctitud de las reglas de negocio aplicadas al crear o modificar
 * usuarios, como validación de formato de email, restricciones de dominio, fortaleza de contraseñas
 * y protecciones de administración.
 */
@DisplayName("Tests Unitarios de UserValidator (Exhaustividad de Reglas)")
class UserValidatorTest {

    private final UserValidator userValidator = new UserValidator();

    // --- 1. validateEmail ---

    /**
     * Verifica que un correo electrónico válido, que cumpla con el formato y pertenezca
     * al dominio institucional (@uniovi.es), pase la validación sin errores.
     * Precondiciones: El email es válido y no existe un usuario previo.
     * Ejecución: Se llama a validateEmail.
     * Aserciones: No se lanzan excepciones.
     */
    @Test
    @DisplayName("✅ validateEmail: Éxito con email válido de Uniovi")
    void validateEmail_Success() {
        assertDoesNotThrow(() -> userValidator.validateEmail("test@uniovi.es", Optional.empty()));
    }

    /**
     * Verifica que correos con formatos inválidos o pertenecientes a dominios externos
     * no permitidos, sean rechazados por el validador.
     * Precondiciones: Se provee un listado de correos malformados o no institucionales.
     * Ejecución: Se llama a validateEmail para cada uno.
     * Aserciones: Se lanza BusinessValidationException.
     *
     * @param email La cadena de correo electrónico a evaluar proporcionada por ValueSource.
     */
    @ParameterizedTest
    @ValueSource(strings = {"invalid-email", "test@", "@uniovi.es", "test@domain.com"})
    @DisplayName("❌ validateEmail: Fallo con formato inválido o dominio no permitido")
    void validateEmail_Invalid_Fail(String email) {
        assertThrows(BusinessValidationException.class, () -> userValidator.validateEmail(email, Optional.empty()));
    }

    /**
     * Verifica que el sistema rechace el registro o actualización a un correo si ya existe
     * un usuario activo con esa misma dirección.
     * Precondiciones: Se proporciona un Optional con un usuario existente en estado ACTIVO.
     * Ejecución: Se llama a validateEmail.
     * Aserciones: Se lanza BusinessValidationException por duplicidad.
     */
    @Test
    @DisplayName("❌ validateEmail: Fallo si ya existe un usuario activo")
    void validateEmail_AlreadyExists_Fail() {
        User existing = User.builder().email("test@uniovi.es").status(UserStatus.ACTIVO).build();
        assertThrows(BusinessValidationException.class, () -> userValidator.validateEmail("test@uniovi.es", Optional.of(existing)));
    }

    /**
     * Verifica que si se intenta usar un correo correspondiente a un usuario marcado como ELIMINADO
     * (soft-delete), el sistema en lugar de un error genérico, devuelva un código específico
     * sugiriendo la restauración de la cuenta.
     * Precondiciones: Se proporciona un Optional con un usuario en estado ELIMINADO.
     * Ejecución: Se llama a validateEmail.
     * Aserciones: Se lanza BusinessValidationException y el mapa de errores contiene el prompt de restauración.
     */
    @Test
    @DisplayName("❌ validateEmail: Retorna prompt de restauración si el usuario está eliminado")
    void validateEmail_Deleted_ReturnsPrompt() {
        User existing = User.builder().email("test@uniovi.es").status(UserStatus.ELIMINADO).build();
        BusinessValidationException ex = assertThrows(BusinessValidationException.class, 
            () -> userValidator.validateEmail("test@uniovi.es", Optional.of(existing)));
        assertEquals("DELETED_USER_RESTORE_PROMPT", ex.getErrors().get("email"));
    }

    // --- 2. validatePasswordStrength ---

    /**
     * Verifica que una contraseña que cumple con los criterios de seguridad (longitud, mayúsculas,
     * minúsculas, números y caracteres especiales) pase la validación.
     * Precondiciones: La contraseña de prueba cumple todos los requisitos.
     * Ejecución: Se llama a validatePasswordStrength.
     * Aserciones: No se lanzan excepciones.
     */
    @Test
    @DisplayName("✅ validatePassword: Éxito con contraseña fuerte")
    void validatePassword_Success() {
        assertDoesNotThrow(() -> userValidator.validatePasswordStrength("Pass1234!"));
    }

    /**
     * Verifica que el validador rechace contraseñas que incumplen alguna de las políticas
     * de seguridad establecidas (ej. sin mayúsculas, sin números, muy corta, etc.).
     * Precondiciones: Se provee un listado de contraseñas débiles.
     * Ejecución: Se llama a validatePasswordStrength para cada una.
     * Aserciones: Se lanza BusinessValidationException.
     *
     * @param pass La contraseña a evaluar proporcionada por ValueSource.
     */
    @ParameterizedTest
    @ValueSource(strings = {"short", "lowercase123!", "UPPERCASE123!", "NoSpecialChar123", "NoNumber!!!!"})
    @DisplayName("❌ validatePassword: Fallo con contraseñas débiles")
    void validatePassword_Weak_Fail(String pass) {
        assertThrows(BusinessValidationException.class, () -> userValidator.validatePasswordStrength(pass));
    }

    // --- 3. validateNotAdmin ---

    /**
     * Verifica la restricción de seguridad que impide modificar o eliminar la cuenta
     * del administrador principal del sistema.
     * Precondiciones: Se inicializa la entidad de usuario con el correo del administrador principal.
     * Ejecución: Se llama a validateNotAdmin.
     * Aserciones: Se lanza BusinessValidationException impidiendo la operación.
     */
    @Test
    @DisplayName("❌ validateNotAdmin: Fallo si se intenta operar sobre el admin principal")
    void validateNotAdmin_Fail() {
        User admin = User.builder().email("admin@uniovi.es").build();
        assertThrows(BusinessValidationException.class, () -> userValidator.validateNotAdmin(admin));
    }

    /**
     * Verifica que cualquier usuario distinto al administrador principal pueda pasar
     * la validación de no-admin para ser modificado.
     * Precondiciones: Se proporciona un usuario con un correo normal.
     * Ejecución: Se llama a validateNotAdmin.
     * Aserciones: No se lanzan excepciones.
     */
    @Test
    @DisplayName("✅ validateNotAdmin: Éxito con cualquier otro usuario")
    void validateNotAdmin_Success() {
        User normal = User.builder().email("normal@uniovi.es").build();
        assertDoesNotThrow(() -> userValidator.validateNotAdmin(normal));
    }

    // --- 4. validateNotSelf ---

    /**
     * Verifica que un administrador no pueda realizar ciertas acciones destructivas o
     * de alteración de estado sobre su propia cuenta (por ejemplo, suspenderse a sí mismo).
     * Precondiciones: El correo del actor y de la víctima son el mismo.
     * Ejecución: Se llama a validateNotSelf.
     * Aserciones: Se lanza BusinessValidationException.
     */
    @Test
    @DisplayName("❌ validateNotSelf: Fallo si el usuario opera sobre sí mismo")
    void validateNotSelf_Fail() {
        assertThrows(BusinessValidationException.class, () -> userValidator.validateNotSelf("me@uniovi.es", "me@uniovi.es"));
    }

    /**
     * Verifica que un usuario pueda realizar acciones de administración sobre otras cuentas,
     * siempre y cuando no sea sobre su propia cuenta.
     * Precondiciones: El correo del actor y de la víctima son distintos.
     * Ejecución: Se llama a validateNotSelf.
     * Aserciones: No se lanzan excepciones.
     */
    @Test
    @DisplayName("✅ validateNotSelf: Éxito si operan sobre otro usuario")
    void validateNotSelf_Success() {
        assertDoesNotThrow(() -> userValidator.validateNotSelf("admin@uniovi.es", "other@uniovi.es"));
    }
}
