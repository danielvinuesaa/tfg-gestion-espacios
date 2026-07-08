package com.tfg.backend.modules.identity.dto;
import com.tfg.backend.modules.identity.model.UserStatus;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Objeto de Transferencia de Datos (DTO) que recoge la información
 * solicitada por el cliente para la creación o actualización de un Usuario.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserRequest {
    
    /**
     * Nombre completo del usuario. Es un campo de carácter obligatorio.
     */
    @NotBlank(message = "El nombre es obligatorio")
    private String name;

    /**
     * Dirección de correo electrónico. Debe cumplir con un formato válido.
     */
    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El formato del email no es válido")
    private String email;

    /**
     * Contraseña de acceso al sistema (opcional en actualizaciones).
     */
    private String password;

    /**
     * Identificador único del rol que se le desea asignar al usuario.
     */
    @NotNull(message = "El rol es obligatorio")
    private Long roleId;

    /**
     * Estado operativo al que se desea establecer el usuario.
     */
    private com.tfg.backend.modules.identity.model.UserStatus status;
    
    /**
     * Bandera para indicar si se deben ignorar advertencias durante la operación (ej. borrado forzado).
     */
    private Boolean force;
}
