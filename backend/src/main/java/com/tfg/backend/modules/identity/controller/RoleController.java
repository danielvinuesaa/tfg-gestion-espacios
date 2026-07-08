package com.tfg.backend.modules.identity.controller;

import com.tfg.backend.core.common.BulkConflictSummaryDTO;
import com.tfg.backend.modules.identity.dto.PermissionDTO;
import com.tfg.backend.modules.identity.dto.RoleDTO;
import com.tfg.backend.modules.identity.dto.RoleRequest;
import com.tfg.backend.modules.identity.service.RoleService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST que expone las operaciones de la API para la gestión de Roles y Permisos.
 * Proporciona los puntos de acceso (endpoints) para llevar a cabo operaciones CRUD completas,
 * la activación de roles y la consulta del catálogo de permisos base.
 */
@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    /**
     * Obtiene todos los roles del sistema con opciones de filtrado y ordenación.
     */
    @GetMapping
    @PreAuthorize("@ss.hasPermission('GESTIONAR_ROLES') or @ss.hasPermission('GESTIONAR_USUARIOS')")
    public ResponseEntity<List<RoleDTO>> getAllRoles(
            @RequestParam(name = "sortBy", required = false, defaultValue = "name") String sortBy,
            @RequestParam(name = "direction", required = false, defaultValue = "asc") String direction,
            @RequestParam(name = "includeDeleted", required = false, defaultValue = "false") boolean includeDeleted) {
        return ResponseEntity.ok(roleService.findAll(includeDeleted, sortBy, direction));
    }


    /**
     * Recupera el catálogo completo de permisos disponibles en el sistema.
     */
    @GetMapping("/permissions")
    @PreAuthorize("@ss.hasPermission('GESTIONAR_ROLES')")
    public ResponseEntity<List<PermissionDTO>> getAllPermissions() {
        return ResponseEntity.ok(roleService.getAllPermissions());
    }

    /**
     * Crea un nuevo rol en el sistema.
     */
    @PostMapping
    @PreAuthorize("@ss.hasPermission('GESTIONAR_ROLES')")
    public ResponseEntity<RoleDTO> createRole(@Valid @RequestBody RoleRequest request) {
        return new ResponseEntity<>(roleService.createRole(request), org.springframework.http.HttpStatus.CREATED);
    }

    /**
     * Actualiza los datos de un rol existente.
     */
    @PutMapping("/{id}")
    @PreAuthorize("@ss.hasPermission('GESTIONAR_ROLES')")
    public ResponseEntity<RoleDTO> updateRole(@PathVariable Long id, @Valid @RequestBody RoleRequest request) {
        return ResponseEntity.ok(roleService.updateRole(id, request));
    }

    /**
     * Activa un rol que fue eliminado lógicamente.
     */
    @PostMapping("/{id}/activate")
    @PreAuthorize("@ss.hasPermission('GESTIONAR_ROLES')")
    public ResponseEntity<RoleDTO> activateRole(@PathVariable Long id) {
        return ResponseEntity.ok(roleService.activateRole(id));
    }

    /**
     * Consulta cuántos usuarios están vinculados actualmente a un rol.
     */
    @GetMapping("/{id}/usage")
    @PreAuthorize("@ss.hasPermission('GESTIONAR_ROLES')")
    public ResponseEntity<Long> getRoleUsage(@PathVariable Long id) {
        return ResponseEntity.ok(roleService.countUsersByRole(id));
    }

    /**
     * Elimina un rol de forma individual con reasignación opcional.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("@ss.hasPermission('GESTIONAR_ROLES')")
    public ResponseEntity<Void> deleteRole(
            @PathVariable Long id,
            @RequestParam(required = false) Long reassignToId) {
        roleService.deleteRole(id, reassignToId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Analiza conflictos de un lote de roles antes de su eliminación.
     */
    @GetMapping("/bulk/conflicts")
    @PreAuthorize("@ss.hasPermission('GESTIONAR_ROLES')")
    public ResponseEntity<BulkConflictSummaryDTO> getBulkConflicts(@RequestParam List<Long> ids) {
        return ResponseEntity.ok(roleService.getBulkRoleConflictSummary(ids));
    }

    /**
     * Eliminación masiva de roles.
     */
    @DeleteMapping("/bulk")
    @PreAuthorize("@ss.hasPermission('GESTIONAR_ROLES')")
    public ResponseEntity<Void> deleteMultipleRoles(
            @RequestParam List<Long> ids,
            @RequestParam(required = false) Long reassignToId) {
        roleService.deleteMultiple(ids, reassignToId);
        return ResponseEntity.noContent().build();
    }

}
