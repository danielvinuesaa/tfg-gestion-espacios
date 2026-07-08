package com.tfg.backend.core.common.specification;

import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Patrón Builder o constructor fluido para la creación dinámica de especificaciones (Specifications) JPA.
 * <p>
 * Facilita la creación de filtros complejos concatenando múltiples criterios de búsqueda,
 * eliminando el código repetitivo de comprobación de valores nulos o vacíos antes de agregarlos a la consulta.
 * </p>
 * 
 * @param <T> El tipo de la entidad sobre la cual se construirán los filtros.
 */
public class SpecificationBuilder<T> {

    /**
     * Lista de parámetros de búsqueda acumulados.
     */
    private final List<SearchCriteria> params;

    /**
     * Constructor que inicializa la lista de criterios de búsqueda.
     */
    public SpecificationBuilder() {
        params = new ArrayList<>();
    }

    /**
     * Añade un nuevo criterio de búsqueda a la especificación, omitiendo automáticamente
     * aquellos casos en los que el valor proporcionado sea nulo, una cadena vacía o una colección vacía.
     *
     * @param key La clave o ruta de la propiedad de la entidad (por ejemplo, "status").
     * @param operation La operación relacional a aplicar.
     * @param value El valor contra el cual se comparará la propiedad.
     * @return La instancia actual de {@link SpecificationBuilder} para permitir el encadenamiento de llamadas.
     */
    public SpecificationBuilder<T> with(String key, SearchOperation operation, Object value) {
        if (value != null) {
            if (value instanceof String str && str.trim().isEmpty()) {
                return this;
            }
            if (value instanceof java.util.Collection<?> col && col.isEmpty()) {
                return this;
            }
            params.add(new SearchCriteria(key, operation, value));
        }
        return this;
    }

    /**
     * Construye la especificación final combinando todos los criterios acumulados
     * utilizando el operador lógico AND.
     *
     * @return La especificación combinada ({@link Specification}) lista para ser ejecutada por el repositorio JPA.
     */
    public Specification<T> build() {
        if (params.isEmpty()) {
            return (root, query, cb) -> cb.conjunction();
        }

        Specification<T> result = new GenericSpecification<>(params.get(0));



        for (int i = 1; i < params.size(); i++) {
            result = Specification.where(result).and(new GenericSpecification<>(params.get(i)));
        }

        return result;
    }
}
