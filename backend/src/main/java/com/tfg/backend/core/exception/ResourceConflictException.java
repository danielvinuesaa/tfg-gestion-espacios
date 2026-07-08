package com.tfg.backend.core.exception;

import org.springframework.http.HttpStatus;

/**
 * Excepción lanzada cuando una operación no puede completarse porque entra
 * en conflicto con el estado actual de los recursos en el servidor.
 * <p>
 * Es comúnmente utilizada en escenarios como solapamientos de fechas y horarios
 * en reservas, o intentos de creación de registros duplicados que violan
 * restricciones de unicidad (como correos electrónicos o nombres identificativos).
 * Se mapea a un código HTTP 409 (Conflict).
 * </p>
 */
public class ResourceConflictException extends ApplicationException {
    
    /**
     * Construye una excepción de conflicto con un mensaje explicativo básico.
     *
     * @param message La descripción del conflicto ocurrido.
     */
    public ResourceConflictException(String message) {
        super(message, HttpStatus.CONFLICT);
    }

    /**
     * Construye una excepción de conflicto indicando un mensaje y un tipo específico de error.
     *
     * @param message La descripción del conflicto ocurrido.
     * @param errorType Un código o identificador del tipo de conflicto.
     */
    public ResourceConflictException(String message, String errorType) {
        super(message, HttpStatus.CONFLICT);
    }
}
