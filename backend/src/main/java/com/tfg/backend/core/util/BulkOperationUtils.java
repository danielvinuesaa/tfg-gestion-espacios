package com.tfg.backend.core.util;
import com.tfg.backend.modules.identity.model.User;

import org.springframework.data.domain.Page;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.stream.Collectors;

/**
 * Clase de utilidad que proporciona métodos genéricos para la gestión y
 * estandarización de operaciones masivas.
 * <p>
 * Centraliza la lógica de resolución y extracción de identificadores a partir
 * de selecciones manuales explícitas o de la ejecución de filtros de búsqueda avanzados.
 * </p>
 */
public class BulkOperationUtils {

    /**
     * Resuelve y unifica una lista de identificadores (IDs) para ejecutar una operación masiva.
     * <p>
     * Si se proporciona una lista de identificadores explícitos, se prioriza su uso.
     * En caso contrario, se ejecuta la función de búsqueda proporcionada y se extraen los
     * identificadores del conjunto de resultados paginados.
     * </p>
     *
     * @param ids Lista de identificadores seleccionados manualmente (opcional).
     * @param searchSupplier Proveedor que ejecuta la búsqueda filtrada en caso de que la lista de IDs sea nula o vacía.
     * @param idExtractor Función utilizada para extraer el identificador de una entidad (por ejemplo, {@code User::getId}).
     * @param <T> El tipo de la entidad manipulada.
     * @return Una lista unificada de identificadores (IDs) listos para ser procesados.
     */
    public static <T> List<Long> resolveIds(
            List<Long> ids, 
            Supplier<Page<T>> searchSupplier, 
            Function<T, Long> idExtractor) {
        
        if (ids != null && !ids.isEmpty()) {
            return new ArrayList<>(ids);
        }

        return searchSupplier.get()
                .getContent()
                .stream()
                .map(idExtractor)
                .collect(Collectors.toList());
    }
}
