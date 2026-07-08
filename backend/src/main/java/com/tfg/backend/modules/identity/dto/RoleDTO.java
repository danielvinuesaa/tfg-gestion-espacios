package com.tfg.backend.modules.identity.dto;

import com.tfg.backend.modules.identity.model.RoleStatus;
import com.tfg.backend.modules.reservation.dto.SubjectDTO;
import com.tfg.backend.modules.identity.model.Permission;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

/**
 * Objeto de Transferencia de Datos (DTO) empleado para enviar información
 * estructurada sobre un Rol del sistema al cliente.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleDTO {
    
    /**
     * Identificador único del rol.
     */
    private Long id;
    
    /**
     * Nombre representativo del rol.
     */
    private String name;
    
    /**
     * Breve descripción sobre la utilidad del rol en el sistema.
     */
    private String description;
    
    /**
     * Estado actual del rol (ej. ACTIVO, ELIMINADO).
     */
    private RoleStatus status;
    
    /**
     * Cantidad de usuarios activos que actualmente poseen este rol.
     */
    private Long userCount;
    
    /**
     * Cantidad total de usuarios vinculados históricamente a este rol.
     */
    private Long totalUserCount;
    
    /**
     * Conjunto de permisos asociados al rol (entidades completas).
     */
    private Set<Permission> permissions;
    
    /**
     * Nombres de los permisos asignados a este rol.
     */
    private Set<String> permissionNames;
    
    /**
     * Lista de asignaturas directamente vinculadas al rol, representadas como DTOs.
     */
    private List<SubjectDTO> subjects;
    
    /**
     * Lista de los identificadores de las asignaturas vinculadas al rol.
     */
    private List<Long> subjectIds;
}
