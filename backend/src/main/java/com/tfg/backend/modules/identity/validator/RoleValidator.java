package com.tfg.backend.modules.identity.validator;
import com.tfg.backend.core.exception.BusinessValidationException;
import com.tfg.backend.modules.identity.model.Permission;
import com.tfg.backend.modules.identity.repository.RoleRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.stream.Collectors;

/**
 * Validador especializado en la verificación de reglas de negocio y coherencia de seguridad
 * para los Roles y sus Permisos asociados.
 * Asegura la unicidad de los nombres de los roles y la correcta configuración de los permisos de acceso.
 */
@Component
@RequiredArgsConstructor
public class RoleValidator {

    /** Repositorio para el acceso a datos de roles. */
    private final RoleRepository roleRepository;

    /**
     * Valida que el nombre del rol sea único.
     */
    public void validateUniqueName(String name, Long currentId) {
        if (name == null || name.trim().isEmpty()) return;
        
        String normalizedName = name.trim().toUpperCase();
        roleRepository.findByName(normalizedName).ifPresent(existing -> {
            if (currentId == null || !existing.getId().equals(currentId)) {
                throw new BusinessValidationException("name", "El nombre del rol '" + name + "' ya está en uso.");
            }
        });
    }

    /**
     * Valida la coherencia lógica entre los permisos asignados.
     */
    public void validatePermissionsCoherence(Set<Permission> permissions) {
        if (permissions == null || permissions.isEmpty()) {
            throw new BusinessValidationException("permissions", "Un rol debe tener al menos un permiso asignado.");
        }

        Set<String> names = permissions.stream().map(Permission::getName).collect(Collectors.toSet());

        // Regla: Gestión global de reservas requiere visión global
        if ((names.contains("APROBAR_RESERVA") || names.contains("CANCELAR_RESERVA") || names.contains("APROBAR_ASIGNATURAS_GESTIONADAS") || names.contains("IMPORTAR_RESERVAS") || names.contains("EXPORTAR_RESERVAS")) 
            && !names.contains("VER_TODAS_RESERVAS")) {
            throw new BusinessValidationException("permissions", "Incoherencia detectada: No se puede otorgar permiso de gestión/aprobación/importación global de reservas sin el permiso de visualización total (VER_TODAS_RESERVAS).");
        }

        // Regla: Gestión de usuarios no requiere visualización ya que no existe VER_USUARIOS como permiso independiente en el enum

        // Regla: Gestión de espacios requiere visualización
        if (names.contains("GESTIONAR_ESPACIOS") && !names.contains("LEER_ESPACIOS")) {
            throw new BusinessValidationException("permissions", "Incoherencia detectada: No se puede otorgar permiso de gestión de espacios sin el permiso de visualización (LEER_ESPACIOS).");
        }
    }
}
