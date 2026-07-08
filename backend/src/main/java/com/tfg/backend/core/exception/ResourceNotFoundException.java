package com.tfg.backend.core.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Excepción personalizada que se lanza para indicar que un recurso solicitado no ha
 * sido encontrado en el sistema.
 * <p>
 * Se emplea de forma habitual en las capas de acceso a datos y servicios cuando una
 * consulta a través de un identificador único (ID) u otro parámetro específico
 * no produce ningún resultado. Se mapea automáticamente al código de estado HTTP 404.
 * </p>
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {

    /**
     * Construye una nueva excepción con un mensaje descriptivo.
     *
     * @param message El detalle o motivo por el cual no se encontró el recurso.
     */
    public ResourceNotFoundException(String message) {
        super(message);
    }

    /**
     * Construye una nueva excepción formateada indicando el tipo de recurso,
     * el campo por el cual se realizó la búsqueda y el valor específico empleado.
     *
     * @param resourceName El nombre de la entidad o recurso buscado.
     * @param fieldName El nombre del campo usado como criterio de búsqueda.
     * @param fieldValue El valor específico aportado para la búsqueda.
     */
    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s no encontrado con %s: '%s'", resourceName, fieldName, fieldValue));
    }
}
