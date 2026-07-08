package com.tfg.backend.modules.identity.model;

/**
 * Enumeración que define los posibles estados operativos de un Rol dentro del sistema.
 * <ul>
 *   <li>{@code ACTIVO}: El rol es completamente operativo y puede ser asignado a nuevos usuarios.</li>
 *   <li>{@code ELIMINADO}: Representa un borrado lógico del rol, impidiendo nuevas asignaciones 
 *       mientras se preserva la integridad referencial e histórica de los datos.</li>
 * </ul>
 */
public enum RoleStatus {
    ACTIVO,
    ELIMINADO
}
