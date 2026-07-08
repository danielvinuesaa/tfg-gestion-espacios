package com.tfg.backend.core.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Clase de utilidad para la gestión de la paginación y ordenación de resultados.
 * <p>
 * Proporciona métodos para estandarizar el comportamiento de las consultas paginadas,
 * asegurando un rendimiento óptimo y evitando errores comunes al aplicar ordenaciones dinámicas.
 * </p>
 */
public class PaginationUtils {

    /**
     * Transforma un objeto {@link Pageable} para asegurar que sus directivas de ordenación
     * ignoren diferencias entre mayúsculas y minúsculas (case-insensitive) de manera segura,
     * evitando su aplicación en propiedades anidadas que podrían generar errores de resolución SQL.
     * 
     * @param pageable El objeto de paginación y ordenación original proporcionado por el cliente.
     * @return Un nuevo objeto {@link Pageable} con las reglas de ordenación optimizadas y seguras.
     */
    public static Pageable ensureCaseInsensitive(Pageable pageable) {
        if (pageable == null || pageable.getSort().isUnsorted()) {
            return pageable;
        }

        List<Sort.Order> orders = pageable.getSort().stream()
                .map(order -> {
                    // Aplicamos ignoreCase() solo a propiedades simples para máxima estabilidad SQL
                    if (order.getProperty().contains(".")) {
                        return order;
                    }
                    return order.ignoreCase();
                })
                .collect(Collectors.toList());

        return PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(orders)
        );
    }
}
