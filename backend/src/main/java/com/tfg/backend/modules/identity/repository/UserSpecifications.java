package com.tfg.backend.modules.identity.repository;
import com.tfg.backend.core.common.specification.SearchOperation;
import com.tfg.backend.core.common.specification.SpecificationBuilder;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.model.UserStatus;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

/**
 * Clase de utilidad que define especificaciones dinámicas (Criteria API)
 * para la búsqueda, filtrado y paginación de entidades de Usuario.
 * Facilita la construcción de consultas complejas de manera programática.
 */
public final class UserSpecifications {

    private UserSpecifications() {
        // Clase de utilidad
    }

    /**
     * Construye una especificación basada en términos de búsqueda, rol, estado e inclusión de eliminados.
     */
    public static Specification<User> withFilters(String searchTerm, Long roleId, UserStatus status, boolean includeDeleted) {
        SpecificationBuilder<User> builder = new SpecificationBuilder<>();

        builder.with("status", SearchOperation.EQUAL, status)
               .with("role.id", SearchOperation.EQUAL, roleId);

        Specification<User> spec = builder.build();

        // 1. Gestión de Estados y Borrado Lógico
        spec = combine(spec, handleDeletedLogic(status, includeDeleted));

        // 2. Filtro por término de búsqueda (Nombre OR Email)
        spec = combine(spec, searchByNameOrEmail(searchTerm));

        return spec;
    }

    /**
     * Lógica para ocultar o mostrar usuarios eliminados según el estado solicitado.
     */
    private static Specification<User> handleDeletedLogic(UserStatus status, boolean includeDeleted) {
        if (status == null && includeDeleted) {
            return (root, query, cb) -> cb.conjunction();
        }
        
        return (root, query, cb) -> {
            if (status != null) {
                return cb.equal(root.get("status"), status);
            } else {
                return cb.notEqual(root.get("status"), UserStatus.ELIMINADO);
            }
        };
    }

    /**
     * Búsqueda por nombre o email (insensible a mayúsculas).
     */
    private static Specification<User> searchByNameOrEmail(String searchTerm) {
        if (searchTerm == null || searchTerm.isBlank()) {
            return (root, query, cb) -> cb.conjunction();
        }

        return (root, query, cb) -> {
            String pattern = "%" + searchTerm.trim().toLowerCase() + "%";
            return cb.or(
                cb.like(cb.lower(root.get("name")), pattern),
                cb.like(cb.lower(root.get("email")), pattern)
            );
        };
    }


    /**
     * Utilidad para combinar especificaciones de forma segura.
     */
    private static <T> Specification<T> combine(Specification<T> base, Specification<T> other) {
        if (base == null && other == null) return (root, query, cb) -> cb.conjunction();
        if (base == null) return other;
        if (other == null) return base;
        return base.and(other);
    }
}


