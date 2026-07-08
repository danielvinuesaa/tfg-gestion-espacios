package com.tfg.backend.modules.identity.repository;
import com.tfg.backend.modules.identity.model.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

/**
 * Repositorio JPA para la entidad de Usuario.
 * Proporciona métodos estándar para operaciones CRUD y paginación, además
 * de consultas personalizadas a la base de datos para los usuarios.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    
    /**
     * Busca un usuario basándose en su dirección de correo electrónico.
     * 
     * @param email Dirección de correo electrónico del usuario.
     * @return Un objeto {@link Optional} que contiene el usuario si se encuentra.
     */
    Optional<User> findByEmail(String email);
    
    /**
     * Cuenta el número de usuarios que están asociados a un identificador de rol específico.
     * 
     * @param roleId Identificador del rol.
     * @return El número de usuarios vinculados a dicho rol.
     */
    long countByRoleId(Long roleId);

    /**
     * Reasigna de forma masiva todos los usuarios de un rol antiguo a uno nuevo.
     * 
     * @param oldRoleId Identificador del rol actual que poseen los usuarios.
     * @param newRoleId Identificador del nuevo rol a asignar.
     */
    @Modifying
    @Query("UPDATE User u SET u.role.id = :newRoleId WHERE u.role.id = :oldRoleId")
    void reassignUsersRole(@Param("oldRoleId") Long oldRoleId, @Param("newRoleId") Long newRoleId);
}
