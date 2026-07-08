package com.tfg.backend.modules.identity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

/**
 * DTO para la creación y actualización de roles.
 * Encapsula los datos necesarios para persistir o modificar un rol y sus asociaciones.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RoleRequest {
    /** Nombre identificativo del rol (se normalizará a mayúsculas). */
    @NotBlank(message = "El nombre del rol es obligatorio")
    private String name;
    
    /** Descripción funcional de las responsabilidades del rol. */
    private String description;
    
    /** Nombres de los permisos asignados. */
    @NotEmpty(message = "Debe seleccionar al menos un permiso")
    private Set<String> permissions;
    
    /** IDs de las asignaturas vinculadas al ámbito del rol. */
    private List<Long> subjectIds;
}
