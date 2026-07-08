package com.tfg.backend.core.exception;

import org.springframework.http.HttpStatus;

/**
 * Excepción personalizada que se lanza cuando un usuario autenticado intenta
 * realizar una operación para la cual carece de los privilegios o permisos necesarios.
 * <p>
 * Su captura en los controladores de excepciones globales resulta en una respuesta
 * con código de estado HTTP 403 (Forbidden).
 * </p>
 */
public class UnauthorizedActionException extends ApplicationException {
    
    /**
     * Construye una excepción de acceso no autorizado con un mensaje descriptivo.
     *
     * @param message El motivo o detalle de la negación de acceso.
     */
    public UnauthorizedActionException(String message) {
        super(message, HttpStatus.FORBIDDEN);
    }
}
