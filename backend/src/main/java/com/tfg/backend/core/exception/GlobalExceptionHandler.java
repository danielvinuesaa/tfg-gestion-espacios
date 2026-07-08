package com.tfg.backend.core.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Controlador global de excepciones diseñado para interceptar y estandarizar
 * todas las respuestas de error emitidas por la interfaz de programación de aplicaciones (API).
 * <p>
 * Captura las excepciones lanzadas desde cualquier capa del sistema y las convierte
 * en una estructura predecible de tipo {@link ApiError}, asegurando consistencia
 * para los clientes consumidores.
 * </p>
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Captura y maneja las excepciones del tipo recurso no encontrado (HTTP 404).
     *
     * @param e La excepción lanzada.
     * @param request El objeto de petición HTTP que originó la excepción.
     * @return Una respuesta formateada que contiene la información detallada del error.
     */
    @ExceptionHandler({ResourceNotFoundException.class, jakarta.persistence.EntityNotFoundException.class})
    public ResponseEntity<ApiError> handleResourceNotFound(Exception e, HttpServletRequest request) {
        log.warn("Recurso no encontrado: {} - {}", request.getRequestURI(), e.getMessage());
        return buildErrorResponse(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", e.getMessage(), request);
    }

    /**
     * Captura y maneja las excepciones del tipo conflicto de recursos (HTTP 409).
     *
     * @param e La excepción de conflicto.
     * @param request El objeto de petición HTTP.
     * @return La respuesta HTTP con código 409.
     */
    @ExceptionHandler(ResourceConflictException.class)
    public ResponseEntity<ApiError> handleResourceConflict(ResourceConflictException e, HttpServletRequest request) {
        log.warn("Conflicto de recursos detectado en {}: {}", request.getRequestURI(), e.getMessage());
        return buildErrorResponse(HttpStatus.CONFLICT, "RESOURCE_CONFLICT", e.getMessage(), request);
    }

    /**
     * Captura excepciones de seguridad/permisos denegados (403 Forbidden).
     */
    @ExceptionHandler({AccessDeniedException.class, UnauthorizedActionException.class})
    public ResponseEntity<ApiError> handleAccessDenied(Exception e, HttpServletRequest request) {
        log.warn("Acceso denegado en {}: {}", request.getRequestURI(), e.getMessage());
        String message = e instanceof UnauthorizedActionException ? e.getMessage() : "No tienes permisos suficientes para realizar esta acción.";
        return buildErrorResponse(HttpStatus.FORBIDDEN, "ACCESS_DENIED", message, request);
    }

    /**
     * Captura y maneja las excepciones del tipo desajuste de tipo de argumento.
     *
     * @param ex La excepción lanzada.
     * @param request El objeto de petición HTTP.
     * @return Una respuesta formateada que contiene la información del error.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> handleTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        String message = String.format("El parámetro '%s' tiene un valor inválido: '%s'", ex.getName(), ex.getValue());
        log.warn("Error de tipo en parámetro URL: {}", message);
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "INVALID_PARAMETER_TYPE", message, request);
    }

    /**
     * Captura excepciones de validación de argumentos de métodos (ej. @Valid en controladores).
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidationExceptions(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage())
        );

        ApiError error = ApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("VALIDATION_ERROR")
                .message("Error de validación en los campos enviados")
                .validationErrors(errors)
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Captura excepciones personalizadas de validación de negocio.
     */
    @ExceptionHandler(BusinessValidationException.class)
    public ResponseEntity<ApiError> handleBusinessValidationException(BusinessValidationException e, HttpServletRequest request) {
        ApiError error = ApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("BUSINESS_RULE_VIOLATION")
                .message(e.getMessage())
                .validationErrors(e.getErrors())
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Captura y maneja las excepciones de credenciales incorrectas.
     *
     * @param e La excepción lanzada.
     * @param request El objeto de petición HTTP.
     * @return Una respuesta formateada que contiene la información del error.
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> handleBadCredentials(BadCredentialsException e, HttpServletRequest request) {
        log.warn("Intento de login fallido: {}", e.getMessage());
        return buildErrorResponse(HttpStatus.UNAUTHORIZED, "BAD_CREDENTIALS", "Email o contraseña incorrectos.", request);
    }

    /**
     * Captura excepciones de estado de cuenta (bloqueado, desactivado).
     */
    @ExceptionHandler({DisabledException.class, LockedException.class})
    public ResponseEntity<ApiError> handleAccountStatusException(Exception e, HttpServletRequest request) {
        log.warn("Intento de login con cuenta bloqueada/desactivada en {}: {}", request.getRequestURI(), e.getMessage());
        String message = e instanceof DisabledException ? 
                "Tu cuenta ha sido desactivada o eliminada. Contacta con el administrador." : 
                "Tu cuenta está bloqueada. Contacta con el administrador.";
        return buildErrorResponse(HttpStatus.UNAUTHORIZED, "ACCOUNT_STATUS_ERROR", message, request);
    }

    /**
     * Captura excepciones genéricas heredadas de ApplicationException.
     */
    @ExceptionHandler(ApplicationException.class)
    public ResponseEntity<ApiError> handleApplicationException(ApplicationException e, HttpServletRequest request) {
        log.error("Excepción de aplicación controlada en {}: {}", request.getRequestURI(), e.getMessage());
        return buildErrorResponse(e.getStatus(), "APPLICATION_ERROR", e.getMessage(), request);
    }

    /**
     * Captura cualquier otra excepción no controlada (500 Internal Server Error).
     */
    @ExceptionHandler({Exception.class, RuntimeException.class})
    public ResponseEntity<ApiError> handleException(Exception e, HttpServletRequest request) {
        log.error("Capturada Excepción crítica no controlada en {}: {}", request.getRequestURI(), e.getMessage(), e);
        return buildErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR, 
                "INTERNAL_SERVER_ERROR", 
                "Se ha producido un error inesperado en el servidor. Por favor, contacte con soporte técnico.", 
                request
        );
    }

    // --- Helpers Internos ---

    /**
     * Construye una respuesta de error genérica.
     *
     * @param status El estado HTTP de la respuesta.
     * @param errorLabel La etiqueta o código del error.
     * @param message El mensaje descriptivo del error.
     * @param request El objeto de petición HTTP original.
     * @return La entidad de respuesta HTTP formateada.
     */
    private ResponseEntity<ApiError> buildErrorResponse(HttpStatus status, String errorLabel, String message, HttpServletRequest request) {
        ApiError errorBody = ApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .error(errorLabel)
                .message(message)
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(errorBody, status);
    }
}
