package com.tfg.backend.modules.identity.repository;
import com.tfg.backend.modules.identity.model.Role;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repositorio de acceso a datos para la entidad {@link Role}.
 * Proporciona operaciones básicas CRUD y consultas dinámicas (a través de Specifications)
 * para la persistencia y recuperación de roles en la base de datos.
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Long>, JpaSpecificationExecutor<Role> {

    /**
     * Busca un rol por su nombre exacto.
     * @param name Nombre del rol.
     * @return Optional con el rol si existe.
     */
    Optional<Role> findByName(String name);
}
