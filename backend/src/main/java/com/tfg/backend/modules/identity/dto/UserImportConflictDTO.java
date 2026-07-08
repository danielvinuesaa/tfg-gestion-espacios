package com.tfg.backend.modules.identity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Objeto de Transferencia de Datos (DTO) diseñado para describir los conflictos
 * detectados durante el proceso de importación masiva de usuarios.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserImportConflictDTO {
    
    /**
     * Nombre del usuario provisto en el archivo de importación.
     */
    private String name;
    
    /**
     * Dirección de correo electrónico del usuario, utilizada como identificador único para detectar duplicados.
     */
    private String email;
    
    /**
     * Rol especificado para el usuario en el archivo de importación.
     */
    private String role;
    
    /**
     * Rol actualmente asignado al usuario en el sistema, en caso de que ya exista.
     */
    private String currentRole;
    
    /**
     * Nombre actual del usuario en el sistema, empleado para verificar si requiere actualización.
     */
    private String currentName;
}
