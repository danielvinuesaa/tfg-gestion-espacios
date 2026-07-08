package com.tfg.backend.core.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import java.util.Map;

/**
 * Excepción personalizada utilizada para reportar incumplimientos o errores 
 * relacionados con las reglas y validaciones de la lógica de negocio.
 * <p>
 * Hereda de {@link ApplicationException} para integrarse en la jerarquía
 * global de errores, mapeando siempre a un código de estado HTTP 400 (Bad Request).
 * Permite detallar los errores por campo o reportar un error general.
 * </p>
 */
@Getter
public class BusinessValidationException extends ApplicationException {
    /**
     * Mapa que asocia nombres de campos (o claves de error general) con sus respectivos mensajes de error descriptivos.
     */
    private final Map<String, String> errors;

    /**
     * Construye una excepción a partir de un único mensaje de error global.
     *
     * @param message El mensaje descriptivo del fallo de validación empresarial.
     */
    public BusinessValidationException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
        this.errors = Map.of("error", message);
    }

    /**
     * Construye una excepción asociada específicamente a la validación de un campo.
     *
     * @param field El nombre del campo que ha fallado la validación.
     * @param message El mensaje descriptivo del error para dicho campo.
     */
    public BusinessValidationException(String field, String message) {
        super(message, HttpStatus.BAD_REQUEST);
        this.errors = Map.of(field, message);
    }

    /**
     * Construye una excepción consolidando múltiples errores de validación.
     *
     * @param errors Mapa de campos y mensajes que describen las diversas validaciones fallidas.
     */
    public BusinessValidationException(Map<String, String> errors) {
        super("Múltiples errores de validación de negocio", HttpStatus.BAD_REQUEST);
        this.errors = errors;
    }
}
