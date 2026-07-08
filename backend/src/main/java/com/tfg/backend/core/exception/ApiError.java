package com.tfg.backend.core.exception;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Estructura estándar para la representación de errores en la API REST.
 * <p>
 * Proporciona un formato unificado para todas las respuestas de error que
 * devuelve el servidor, facilitando el procesamiento y visualización de
 * los fallos en la interfaz de usuario.
 * </p>
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiError {
    /**
     * Marca de tiempo exacta en la que se produjo el error.
     */
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd-MM-yyyy hh:mm:ss")
    private LocalDateTime timestamp;

    /**
     * Código de estado HTTP correspondiente al error (por ejemplo, 404, 400, 500).
     */
    private int status;

    /**
     * Identificador corto o clave del tipo de error (por ejemplo, "NOT_FOUND").
     */
    private String error;

    /**
     * Mensaje detallado y descriptivo del error dirigido al usuario o desarrollador.
     */
    private String message;

    /**
     * Ruta o endpoint (URI) de la API donde se originó el error.
     */
    private String path;

    /**
     * Mapa detallado de errores de validación de campos, donde la clave es
     * el nombre del campo afectado y el valor es el mensaje de error específico.
     */
    private Map<String, String> validationErrors;
}
