package com.tfg.backend.core.exception;

import org.springframework.http.HttpStatus;
import lombok.Getter;

/**
 * Clase base fundamental para la jerarquía de excepciones de negocio en la aplicación.
 * <p>
 * Permite definir e integrar códigos de estado HTTP de forma programática y flexible
 * en el manejo de errores propios del dominio.
 * </p>
 */
@Getter
public class ApplicationException extends RuntimeException {
    /**
     * El estado HTTP (código y texto) asociado de forma inherente a esta excepción.
     */
    private final HttpStatus status;

    /**
     * Construye una excepción de negocio generalizada con estado HTTP 500 (Internal Server Error)
     * por defecto.
     *
     * @param message El mensaje descriptivo del fallo.
     */
    public ApplicationException(String message) {
        super(message);
        this.status = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    /**
     * Construye una excepción de negocio definiendo explícitamente el código
     * de estado HTTP a reportar.
     *
     * @param message El mensaje descriptivo del error.
     * @param status El código de estado HTTP adecuado para la incidencia.
     */
    public ApplicationException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }
}
