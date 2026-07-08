package com.tfg.backend.modules.reservation.repository;
import com.tfg.backend.core.common.specification.SearchOperation;
import com.tfg.backend.core.common.specification.SpecificationBuilder;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.reservation.model.ReservationType;
import com.tfg.backend.modules.space.model.Space;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Proporciona especificaciones dinámicas para la consulta y el filtrado de reservas en la base de datos.
 * Esta clase de utilidad emplea la interfaz estandarizada de Spring Data JPA (Criteria API) para construir
 * de manera programática predicados de consulta complejos adaptados a los requerimientos de búsqueda.
 */
public final class ReservationSpecifications {

    /** Constructor privado para ocultar el implícito público. */
    private ReservationSpecifications() {
        // Clase de utilidad
    }

    /**
     * Construye una especificación que amalgama múltiples criterios de filtrado sobre las reservas.
     *
     * @param status            El estado deseado de las reservas.
     * @param type              El tipo específico de las reservas.
     * @param spaceIds          La lista de identificadores correspondientes a los espacios involucrados.
     * @param targetUserIds     La lista de identificadores de los usuarios objetivo que interceden (solicitantes o responsables).
     * @param securityUserId    El identificador del usuario autenticado que aplica como base para las lógicas de seguridad.
     * @param managedSubjectIds La lista de identificadores de asignaturas que se encuentran bajo la gestión del usuario.
     * @param startDate         El límite inferior cronológico de búsqueda.
     * @param endDate           El límite superior cronológico de búsqueda.
     * @param search            La cadena de caracteres a comparar para búsquedas de texto libre (título o responsable).
     * @param subjectIds        La lista de identificadores de asignaturas de las reservas.
     * @param includeCancelled  Indicador que determina la inclusión de las reservas con estado inactivo o cancelado.
     * @return Una instancia de {@link Specification} de Spring Data JPA para su ejecución.
     */
    public static Specification<Reservation> withFilters(
            ReservationStatus status,
            ReservationType type,
            List<Long> spaceIds,
            List<Long> targetUserIds,
            Long securityUserId,
            List<Long> managedSubjectIds,
            LocalDateTime startDate,
            LocalDateTime endDate,
            String search,
            List<Long> subjectIds,
            boolean includeCancelled) {
        
        SpecificationBuilder<Reservation> builder = new SpecificationBuilder<>();

        builder.with("status", SearchOperation.EQUAL, status)
               .with("type", SearchOperation.EQUAL, type)
               .with("subject.id", SearchOperation.IN, subjectIds);

        // Rango de fechas: Se busca solapamiento con el intervalo proporcionado
        builder.with("endTime", SearchOperation.GREATER_THAN, startDate)
               .with("startTime", SearchOperation.LESS_THAN, endDate);

        Specification<Reservation> spec = builder.build();

        // 0. Filtrado por Usuario (Solicitante O Responsable)
        if (targetUserIds != null && !targetUserIds.isEmpty()) {
            spec = combine(spec, (root, query, cb) -> 
                cb.or(
                    root.get("user").get("id").in(targetUserIds),
                    cb.and(
                        cb.isNotNull(root.get("responsible")),
                        root.get("responsible").get("id").in(targetUserIds)
                    )
                )
            );
        }

        // Gestión de Inactivos (Cancelados/Rechazados)
        if (!includeCancelled) {
            spec = combine(spec, (root, query, cb) -> 
                cb.not(root.get("status").in(ReservationStatus.CANCELADA, ReservationStatus.RECHAZADA)));
        }

        // 1. Lógica de seguridad: Propietario o Gestor de asignatura
        spec = combine(spec, hasOwnershipOrManagement(securityUserId, managedSubjectIds));

        // 2. Filtrado por espacios vinculados (usando subconsulta para eficiencia)
        spec = combine(spec, hasSpaces(spaceIds));

        // 3. Búsqueda de texto libre
        spec = combine(spec, searchInTitleOrResponsible(search));

        // 4. Solucionar problema N+1 Queries (Carga ansiosa si no es query de count)
        spec = combine(spec, (root, query, cb) -> {
            if (Long.class != query.getResultType() && long.class != query.getResultType()) {
                root.fetch("spaces", JoinType.LEFT);
                root.fetch("user", JoinType.LEFT);
                root.fetch("responsible", JoinType.LEFT);
                root.fetch("subject", JoinType.LEFT);
            }
            return cb.conjunction();
        });

        return spec;
    }

    /**
     * Retorna una especificación de base de datos para restringir los resultados a aquellas reservas
     * que posean asociatividad con al menos uno de los espacios especificados.
     *
     * @param spaceIds Colección de identificadores de espacios requeridos.
     * @return La especificación conformada con el predicado del espacio.
     */
    private static Specification<Reservation> hasSpaces(List<Long> spaceIds) {
        if (spaceIds == null || spaceIds.isEmpty()) return null;
        
        return (root, query, cb) -> {
            Subquery<Long> subquery = query.subquery(Long.class);
            Root<Reservation> subRoot = subquery.from(Reservation.class);
            Join<Reservation, Space> subSpaces = subRoot.join("spaces");
            subquery.select(subRoot.get("id")).where(subSpaces.get("id").in(spaceIds));
            return root.get("id").in(subquery);
        };
    }

    /**
     * Genera una especificación enfocada en aplicar los controles de autorización correspondientes.
     * Garantiza que los registros devueltos pertenezcan explícitamente al usuario, o de forma alternativa,
     * recaigan sobre una asignatura en la cual el usuario ejerce labores de gestión.
     *
     * @param userId            El identificador numérico de usuario en el sistema de seguridad.
     * @param managedSubjectIds Una colección de asignaturas encomendadas a la responsabilidad del usuario.
     * @return La especificación generada para restringir visibilidad de datos.
     */
    private static Specification<Reservation> hasOwnershipOrManagement(Long userId, List<Long> managedSubjectIds) {
        if (userId == null) return null;
        
        return (root, query, cb) -> {
            Predicate isOwner = cb.equal(root.get("user").get("id"), userId);
            
            if (managedSubjectIds != null && !managedSubjectIds.isEmpty()) {
                Predicate isSubjectManaged = root.get("subject").get("id").in(managedSubjectIds);
                return cb.or(isOwner, isSubjectManaged);
            }
            
            return isOwner;
        };
    }

    /**
     * Genera una especificación que implementa búsquedas sobre campos textuales descriptivos
     * (tales como el título de la reserva o el nombre explícito del responsable designado).
     *
     * @param search El patrón alfabético base utilizado para la concordancia dentro de los atributos.
     * @return La especificación que comprende el predicado de correspondencia libre.
     */
    private static Specification<Reservation> searchInTitleOrResponsible(String search) {
        if (search == null || search.trim().isEmpty()) return null;
        
        return (root, query, cb) -> {
            String pattern = "%" + search.toLowerCase() + "%";
            Predicate titleMatch = cb.like(cb.lower(root.get("title")), pattern);
            Predicate respMatch = cb.like(cb.lower(root.get("responsibleName")), pattern);
            return cb.or(titleMatch, respMatch);
        };
    }

    /**
     * Proporciona un mecanismo unificado para la anexión progresiva y condicional de especificaciones parciales.
     * Ignora proactivamente aquellos valores nulos para evitar colapsos semánticos durante el mapeo.
     *
     * @param base  La especificación originaria, base de la disyunción o conjunción lógica.
     * @param other El bloque de especificación complementario a encadenar.
     * @param <T>   El parámetro de tipo genérico representando la entidad dominada.
     * @return La confluencia resultante entre ambas aserciones estructurales.
     */
    private static <T> Specification<T> combine(Specification<T> base, Specification<T> other) {
        if (base == null && other == null) return (root, query, cb) -> cb.conjunction();
        if (base == null) return other;
        if (other == null) return base;
        return base.and(other);
    }
}


