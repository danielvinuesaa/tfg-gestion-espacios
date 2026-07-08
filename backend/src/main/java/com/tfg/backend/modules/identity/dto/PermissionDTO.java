package com.tfg.backend.modules.identity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Objeto de Transferencia de Datos (DTO) que transporta la información de un Permiso.
 * Se utiliza para exponer los permisos disponibles en la API sin revelar la entidad de dominio.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PermissionDTO {
    
    /**
     * Identificador único del permiso en el sistema.
     */
    private Long id;
    
    /**
     * Nombre técnico o código del permiso (ej. GESTIONAR_USUARIOS).
     */
    private String name;
    
    /**
     * Etiqueta legible para interfaces de usuario (ej. Gestionar Usuarios).
     */
    private String label;
    
    /**
     * Descripción detallada acerca de qué acciones autoriza este permiso.
     */
    private String description;
}
