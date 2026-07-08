package com.tfg.backend.modules.identity.validator;
import com.tfg.backend.core.exception.BusinessValidationException;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.model.UserStatus;

import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Validador encargado de aplicar las reglas de negocio y restricciones de seguridad
 * correspondientes a la entidad {@link User}.
 * Incluye comprobaciones sobre el formato de correos, la robustez de las contraseñas,
 * la unicidad de los datos y las protecciones frente a modificaciones críticas.
 */
@Component
public class UserValidator {

    /** Correo del administrador principal del sistema. */
    private static final String ADMIN_EMAIL = "admin@uniovi.es";
    /** Dominio de correo permitido. */
    private static final String ALLOWED_DOMAIN = "@uniovi.es";
    /** Patrón de expresión regular para validar correos. */
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}$");
    
    /**
     * Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special char.
     */
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=._\\-!/()*])(?=\\S+$).{8,}$");

    /**
     * Valida el formato del email, su dominio corporativo y su unicidad en el sistema.
     */
    public void validateEmail(String email, Optional<User> existingUser) {
        if (email == null || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new BusinessValidationException("email", "El formato del email no es válido.");
        }

        if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
            throw new BusinessValidationException("email", "Solo se admiten correos corporativos de la Universidad de Oviedo (" + ALLOWED_DOMAIN + ").");
        }
        
        if (existingUser.isPresent()) {
            if (existingUser.get().getStatus() != UserStatus.ELIMINADO) {
                throw new BusinessValidationException("email", "Ya existe un usuario activo con este email.");
            } else {
                throw new BusinessValidationException("email", "DELETED_USER_RESTORE_PROMPT");
            }
        }
    }

    /**
     * Valida que la contraseña cumpla con los estándares mínimos de seguridad.
     */
    public void validatePasswordStrength(String password) {
        if (password == null || !PASSWORD_PATTERN.matcher(password).matches()) {
            throw new BusinessValidationException("password", "La contraseña es demasiado débil. Debe tener al menos 8 caracteres e incluir mayúsculas, minúsculas, números y un carácter especial.");
        }
    }

    /**
     * Impide acciones críticas sobre el administrador del sistema.
     */
    public void validateNotAdmin(User user) {
        if (ADMIN_EMAIL.equalsIgnoreCase(user.getEmail())) {
            throw new BusinessValidationException("user", "Acción no permitida sobre el administrador principal del sistema.");
        }
    }

    /**
     * Impide que un usuario realice acciones destructivas sobre sí mismo.
     */
    public void validateNotSelf(String currentUserEmail, String targetUserEmail) {
        if (currentUserEmail.equalsIgnoreCase(targetUserEmail)) {
            throw new BusinessValidationException("user", "No puedes realizar esta acción sobre tu propio usuario mientras estás conectado.");
        }
    }

    /**
     * Valida que en una auto-edición no se intenten cambiar campos críticos como el rol o el estado.
     */
    public void validateSelfUpdate(User existingUser, Long newRoleId, UserStatus newStatus) {
        // No se permite cambiar el rol a uno mismo
        if (newRoleId != null && !existingUser.getRole().getId().equals(newRoleId)) {
            throw new BusinessValidationException("roleId", "No puedes cambiar tu propio rol. Esta acción debe ser realizada por otro administrador.");
        }

        // No se permite cambiar el estado a uno mismo (ej: auto-desactivarse)
        if (newStatus != null && existingUser.getStatus() != newStatus) {
            throw new BusinessValidationException("status", "No puedes cambiar tu propio estado de conexión.");
        }
    }
}
