package com.tfg.backend.modules.identity.repository;
import com.tfg.backend.core.common.specification.SearchOperation;
import com.tfg.backend.core.common.specification.SpecificationBuilder;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.RoleStatus;

import org.springframework.data.jpa.domain.Specification;

/**
 * Especificaciones dinámicas para la búsqueda y filtrado de roles de usuario.
 * Esta clase de utilidad emplea el estándar de Spring Data JPA (Criteria API)
 * para construir predicados de filtrado complejos y dinámicos.
 */
public final class RoleSpecifications {

    /**
     * Constructor privado para prevenir la instanciación de esta clase de utilidad.
     */
    private RoleSpecifications() {
        // Clase de utilidad
    }

    /**
     * Construye una especificación basada en el estado de borrado lógico del rol.
     * 
     * @param includeDeleted Si es {@code true}, se incluirán los roles cuyo estado sea ELIMINADO.
     * @return Un objeto {@link Specification} de tipo {@link Role} aplicable a consultas JPA.
     */
    public static Specification<Role> withFilters(boolean includeDeleted) {
        if (includeDeleted) {
            return (root, query, cb) -> cb.conjunction();
        }
        
        return new SpecificationBuilder<Role>()
                .with("status", SearchOperation.NOT_EQUAL, RoleStatus.ELIMINADO)
                .build();
    }

}

