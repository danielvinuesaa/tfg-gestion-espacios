package com.tfg.backend.modules.identity.repository;
import com.tfg.backend.modules.identity.model.Permission;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

/**
 * Repositorio JPA para la entidad de Permisos.
 * Proporciona métodos para operaciones de base de datos sobre los permisos del sistema.
 */
public interface PermissionRepository extends JpaRepository<Permission, Long> {
    
    /**
     * Recupera un permiso basándose en su nombre identificativo.
     * 
     * @param name Nombre exacto del permiso a buscar.
     * @return Un objeto {@link Optional} que contiene el permiso si se encuentra en la base de datos.
     */
    Optional<Permission> findByName(String name);
}
