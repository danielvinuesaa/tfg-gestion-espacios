package com.tfg.backend.modules.identity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

/**
 * Objeto de Transferencia de Datos (DTO) diseñado para proporcionar la información
 * esencial del perfil del usuario actualmente autenticado en el sistema.
 * Incluye sus permisos y asignaturas gestionadas.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserMeDTO {
    
    /**
     * Identificador único del usuario.
     */
    private Long id;
    
    /**
     * Dirección de correo electrónico asociada a la cuenta del usuario.
     */
    private String email;
    
    /**
     * Nombre completo del usuario.
     */
    private String name;
    
    /**
     * Nombre del rol asignado al usuario en el sistema.
     */
    private String role;
    
    /**
     * Conjunto de nombres de los permisos que posee el usuario a través de su rol.
     */
    private Set<String> permissions;
    
    /**
     * Lista de identificadores de las asignaturas que este usuario gestiona o imparte.
     */
    private List<Long> managedSubjectIds;
}
