package com.tfg.backend.modules.identity.service;
import com.tfg.backend.core.common.BulkConflictSummaryDTO;
import com.tfg.backend.modules.identity.dto.PermissionDTO;
import com.tfg.backend.modules.identity.dto.RoleDTO;
import com.tfg.backend.modules.identity.dto.RoleRequest;
import com.tfg.backend.modules.identity.model.Role;

import java.util.List;

/**
 * Interfaz de servicio para la gestión de Roles y Permisos en el sistema.
 * Define las operaciones de negocio para listar, crear, actualizar, activar y eliminar roles,
 * así como consultas de permisos y resúmenes de conflictos antes de un borrado masivo.
 */
public interface RoleService {
    
    /**
     * Obtiene todos los roles con filtros y ordenación.
     */
    List<RoleDTO> findAll(boolean includeDeleted, String sortBy, String direction);

    /**
     * Recupera todos los permisos del sistema.
     */
    List<PermissionDTO> getAllPermissions();

    /**
     * Cuenta usuarios vinculados a un rol.
     */
    long countUsersByRole(Long roleId);

    /**
     * Busca un rol por su ID.
     */
    RoleDTO findById(Long id);

    /**
     * Busca la entidad real por su ID (uso interno).
     */
    Role findByIdEntity(Long id);
    
    /**
     * Crea un nuevo rol.
     */
    RoleDTO createRole(RoleRequest request);
    
    /**
     * Actualiza un rol existente.
     */
    RoleDTO updateRole(Long id, RoleRequest request);
    
    /**
     * Activa un rol (borrado lógico inverso).
     */
    RoleDTO activateRole(Long id);
    
    /**
     * Realiza el borrado lógico de un rol con reasignación opcional de usuarios.
     */
    void deleteRole(Long id, Long reassignToId);
    
    /**
     * Obtiene un resumen de conflictos para borrado masivo.
     */
    BulkConflictSummaryDTO getBulkRoleConflictSummary(List<Long> ids);
    
    /**
     * Realiza el borrado masivo de roles con reasignación opcional.
     */
    void deleteMultiple(List<Long> ids, Long reassignToId);
}
