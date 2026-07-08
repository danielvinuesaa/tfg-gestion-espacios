package com.tfg.backend.modules.identity.dto;

import com.tfg.backend.modules.identity.model.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Objeto de Transferencia de Datos (DTO) empleado para exponer
 * la información de un Usuario hacia el cliente.
 * Suprime de forma intencionada campos sensibles como las credenciales.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    
    /**
     * Identificador único asignado al usuario.
     */
    private Long id;
    
    /**
     * Dirección de correo electrónico utilizada para notificaciones e inicio de sesión.
     */
    private String email;
    
    /**
     * Nombre completo y oficial del usuario.
     */
    private String name;
    
    /**
     * Objeto de transferencia que detalla el rol actual del usuario.
     */
    private RoleDTO role;
    
    /**
     * Estado operativo actual del usuario en la plataforma (ej. ACTIVO, ELIMINADO).
     */
    private UserStatus status;
}
