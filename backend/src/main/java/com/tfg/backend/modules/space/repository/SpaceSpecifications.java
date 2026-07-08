package com.tfg.backend.modules.space.repository;
import com.tfg.backend.core.common.specification.SearchOperation;
import com.tfg.backend.core.common.specification.SpecificationBuilder;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.space.model.SpaceStatus;
import com.tfg.backend.modules.space.model.SpaceType;

import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;

import java.time.LocalDateTime;
import java.util.Collection;

/**
 * Clase utilitaria que provee especificaciones dinámicas para la búsqueda y el filtrado avanzado de entidades {@link Space}.
 * Permite combinar dinámicamente criterios técnicos (como capacidad o tipo) con restricciones de disponibilidad temporal,
 * facilitando consultas complejas mediante la API de Criteria de JPA.
 */
public final class SpaceSpecifications {

    private SpaceSpecifications() {
        // Clase de utilidad
    }

    /**
     * Construye una especificación basada en múltiples criterios técnicos.
     */
    public static Specification<Space> withFilters(
            String name,
            Collection<SpaceType> types,
            SpaceStatus status,
            Integer minCapacity,
            Integer minComputers,
            boolean includeDeleted) {
        
        SpecificationBuilder<Space> builder = new SpecificationBuilder<>();

        builder.with("name", SearchOperation.MATCH, name)
               .with("type", SearchOperation.IN, types)
               .with("status", SearchOperation.EQUAL, status)
               .with("totalCapacity", SearchOperation.GREATER_THAN_EQUAL, minCapacity)
               .with("computerCount", SearchOperation.GREATER_THAN_EQUAL, minComputers);

        Specification<Space> spec = builder.build();

        // Gestión de Borrado Lógico
        if (!includeDeleted) {
            spec = combine(spec, (root, query, cb) -> 
                cb.notEqual(root.get("status"), SpaceStatus.ELIMINADO));
        }

        return spec;
    }

    /**
     * Filtra espacios que NO tengan reservas aprobadas o bloqueos en el rango dado.
     */
    public static Specification<Space> isAvailable(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) {
            return (root, query, cb) -> cb.conjunction();
        }

        return (root, query, cb) -> {
            // Subconsulta para encontrar IDs de espacios ocupados
            Subquery<Long> subquery = query.subquery(Long.class);
            Root<Reservation> resRoot = subquery.from(Reservation.class);
            Join<Reservation, Space> spaceJoin = resRoot.join("spaces");

            subquery.select(spaceJoin.get("id"))
                .where(cb.and(
                    resRoot.get("status").in(ReservationStatus.APROBADA, ReservationStatus.BLOQUEO),
                    cb.lessThan(resRoot.get("startTime"), end),
                    cb.greaterThan(resRoot.get("endTime"), start)
                ));

            // El espacio NO debe estar en el conjunto de espacios ocupados
            return cb.not(root.get("id").in(subquery));
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
