package com.tfg.backend.core.common.specification;

import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.lang.NonNull;

import java.util.Collection;

/**
 * Especificación genérica basada en la API de Criteria de JPA para la creación
 * dinámica de consultas a la base de datos.
 * <p>
 * Convierte un objeto {@link SearchCriteria} en un predicado evaluable, soportando
 * operaciones de comparación matemática, búsqueda de cadenas de texto (sensibles y
 * no sensibles a mayúsculas), operaciones relacionales como "IN", y verificaciones de nulos.
 * </p>
 * 
 * @param <T> Tipo de la entidad sobre la cual se aplicará el filtro.
 */
public class GenericSpecification<T> implements Specification<T> {

    /**
     * El criterio de búsqueda que define la regla de filtrado a aplicar.
     */
    private final SearchCriteria criteria;

    /**
     * Constructor de la especificación genérica.
     *
     * @param criteria El criterio de búsqueda encapsulado.
     */
    public GenericSpecification(SearchCriteria criteria) {
        this.criteria = criteria;
    }

    /**
     * Convierte el criterio en un predicado evaluable.
     *
     * @param root  El nodo raíz de la entidad.
     * @param query La consulta a construir.
     * @param cb    El constructor de criterios.
     * @return El predicado de la consulta.
     */
    @Override
    @SuppressWarnings({"unchecked", "rawtypes"})
    public Predicate toPredicate(@NonNull Root<T> root, @NonNull CriteriaQuery<?> query, @NonNull CriteriaBuilder cb) {
        Path<?> path = getPath(root);
        Object value = criteria.getValue();

        return switch (criteria.getOperation()) {
            case EQUAL -> cb.equal(path, value);
            case NOT_EQUAL -> cb.notEqual(path, value);
            case GREATER_THAN -> cb.greaterThan((Expression) path, (Comparable) value);
            case LESS_THAN -> cb.lessThan((Expression) path, (Comparable) value);
            case GREATER_THAN_EQUAL -> cb.greaterThanOrEqualTo((Expression) path, (Comparable) value);
            case LESS_THAN_EQUAL -> cb.lessThanOrEqualTo((Expression) path, (Comparable) value);
            case MATCH -> cb.like(cb.lower(path.as(String.class)), "%" + value.toString().toLowerCase() + "%");
            case MATCH_START -> cb.like(cb.lower(path.as(String.class)), value.toString().toLowerCase() + "%");
            case MATCH_END -> cb.like(cb.lower(path.as(String.class)), "%" + value.toString().toLowerCase());
            case LIKE -> cb.like(path.as(String.class), value.toString());
            case IN -> {
                if (value instanceof Collection<?> collection) {
                    yield path.in(collection);
                }
                yield cb.equal(path, value);
            }
            case NOT_IN -> {
                if (value instanceof Collection<?> collection) {
                    yield cb.not(path.in(collection));
                }
                yield cb.notEqual(path, value);
            }
            case IS_NULL -> cb.isNull(path);
            case IS_NOT_NULL -> cb.isNotNull(path);
            case JOIN_EQUAL -> {
                String[] parts = criteria.getKey().split("\\.");
                Join<?, ?> join = root.join(parts[0]);
                yield cb.equal(join.get(parts[1]), value);
            }
        };
    }

    /**
     * Resuelve y obtiene la ruta de la propiedad (Path) en la entidad, soportando
     * navegación anidada mediante el uso de puntos (por ejemplo, "usuario.nombre").
     *
     * @param root El nodo raíz desde donde iniciar la resolución del atributo.
     * @return El objeto {@link Path} correspondiente al atributo de la entidad.
     */
    private Path<?> getPath(Root<T> root) {
        String[] parts = criteria.getKey().split("\\.");
        Path<?> path = root;
        for (String part : parts) {
            path = path.get(part);
        }
        return path;
    }
}
