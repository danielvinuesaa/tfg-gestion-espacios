package com.tfg.backend.modules.analytics.repository;
import com.tfg.backend.core.common.specification.SearchOperation;
import com.tfg.backend.core.common.specification.SpecificationBuilder;
import com.tfg.backend.modules.analytics.model.AuditLog;
import com.tfg.backend.modules.identity.model.User;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

/**
 * Proporciona especificaciones dinámicas para la consulta y filtrado de registros de auditoría.
 * Utiliza la API de Criteria de JPA para construir consultas complejas de forma programática.
 */
public final class AuditLogSpecifications {

    /**
     * Constructor privado para evitar la instanciación de esta clase utilitaria.
     */
    private AuditLogSpecifications() {
        // Clase de utilidad
    }

    /**
     * Construye una especificación de búsqueda basada en la acción, el usuario ejecutor y el rango de fechas.
     *
     * @param action El tipo de acción a filtrar.
     * @param performedBy El correo electrónico o nombre del usuario que realizó la acción.
     * @param startDate La fecha y hora de inicio para el filtro temporal.
     * @param endDate La fecha y hora de fin para el filtro temporal.
     * @return Una especificación de JPA configurada con los criterios dados.
     */
    public static Specification<AuditLog> withFilters(String action, String performedBy, LocalDateTime startDate, LocalDateTime endDate) {
        SpecificationBuilder<AuditLog> builder = new SpecificationBuilder<>();

        builder.with("action", SearchOperation.EQUAL, action)
               .with("timestamp", SearchOperation.GREATER_THAN_EQUAL, startDate)
               .with("timestamp", SearchOperation.LESS_THAN_EQUAL, endDate);

        Specification<AuditLog> spec = builder.build();

        // Búsqueda del ejecutor (por email directo o nombre vía subconsulta)
        spec = combine(spec, performedBy(performedBy));

        return spec;
    }

    /**
     * Crea una especificación para filtrar los registros según el usuario que realizó la acción.
     * Realiza la búsqueda tanto por el campo de correo electrónico directo como por el nombre
     * completo del usuario registrado en el sistema.
     *
     * @param performedBy El término de búsqueda que representa al autor de la acción.
     * @return Una especificación de JPA con los criterios de filtrado por usuario.
     */
    private static Specification<AuditLog> performedBy(String performedBy) {
        if (performedBy == null || performedBy.trim().isEmpty()) {
            return (root, query, cb) -> cb.conjunction();
        }

        return (root, query, cb) -> {
            String pattern = "%" + performedBy.trim().toLowerCase() + "%";
            
            // Coincidencia directa con el email guardado en performedBy
            Predicate emailPredicate = cb.like(cb.lower(root.get("performedBy")), pattern);
            
            // Subquery para buscar por nombre en la tabla de usuarios
            Subquery<String> userSubquery = query.subquery(String.class);
            Root<User> userRoot = userSubquery.from(User.class);
            userSubquery.select(userRoot.get("email"));
            userSubquery.where(cb.like(cb.lower(userRoot.get("name")), pattern));
            
            Predicate namePredicate = root.get("performedBy").in(userSubquery);
            
            return cb.or(emailPredicate, namePredicate);
        };
    }

    /**
     * Método de utilidad para combinar dos especificaciones de forma segura, manejando valores nulos.
     *
     * @param base La especificación base.
     * @param other La especificación a combinar con la base mediante la cláusula AND.
     * @param <T> El tipo de la entidad sobre la cual aplica la especificación.
     * @return La especificación resultante de la combinación.
     */
    private static <T> Specification<T> combine(Specification<T> base, Specification<T> other) {
        if (base == null && other == null) return (root, query, cb) -> cb.conjunction();
        if (base == null) return other;
        if (other == null) return base;
        return base.and(other);
    }
}
