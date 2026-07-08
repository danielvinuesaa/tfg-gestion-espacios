package com.tfg.backend.core.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

/**
 * Suite de pruebas unitarias para el manejador global de excepciones (GlobalExceptionHandler).
 * <p>
 * Verifica que el sistema intercepte correctamente las distintas excepciones (de negocio, seguridad,
 * validación, etc.) y las traduzca en las respuestas HTTP correspondientes con la estructura de error esperada.
 */
@DisplayName("Tests Unitarios de GlobalExceptionHandler (Mapeo de Errores)")
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Mock
    private HttpServletRequest request;

    /**
     * Configuración inicial para las pruebas del manejador de excepciones.
     * <p>
     * <b>Precondiciones:</b> N/A.
     * <b>Ejecución:</b> Se inicializan los mocks de Mockito y se simula la URI de la petición HTTP.
     * <b>Asertos:</b> N/A.
     */
    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        when(request.getRequestURI()).thenReturn("/api/test");
    }

    /**
     * Verifica que una excepción de validación de negocio se traduce en un error 400 (Bad Request).
     * <p>
     * <b>Precondiciones:</b> Se lanza una excepción {@code BusinessValidationException} indicando un error en un campo.
     * <b>Ejecución:</b> El manejador captura la excepción.
     * <b>Asertos:</b> Se comprueba que el código de estado es 400 y que la respuesta incluye los detalles de validación del campo.
     */
    @Test
    @DisplayName("🧪 BusinessValidation: Retorna 400 con mapa de errores")
    void handleBusinessValidation() {
        BusinessValidationException ex = new BusinessValidationException("campo", "mensaje");
        ResponseEntity<ApiError> response = handler.handleBusinessValidationException(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("mensaje", response.getBody().getValidationErrors().get("campo"));
    }

    /**
     * Verifica que una excepción de recurso no encontrado se traduce en un error 404 (Not Found).
     * <p>
     * <b>Precondiciones:</b> Se lanza una excepción {@code ResourceNotFoundException} con los datos de la entidad y su ID.
     * <b>Ejecución:</b> El manejador captura la excepción.
     * <b>Asertos:</b> Se comprueba que el código de estado es 404 y que el mensaje incluye el nombre de la entidad.
     */
    @Test
    @DisplayName("🧪 ResourceNotFound: Retorna 404")
    void handleNotFound() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Entidad", "id", 1L);
        ResponseEntity<ApiError> response = handler.handleResourceNotFound(ex, request);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertTrue(response.getBody().getMessage().contains("Entidad"));
    }

    /**
     * Verifica que una excepción de credenciales inválidas se traduce en un error 401 (Unauthorized).
     * <p>
     * <b>Precondiciones:</b> Se lanza una excepción {@code BadCredentialsException}.
     * <b>Ejecución:</b> El manejador procesa el error.
     * <b>Asertos:</b> Se verifica que el código de estado es 401 y el código de error es "BAD_CREDENTIALS".
     */
    @Test
    @DisplayName("🧪 BadCredentials: Retorna 401")
    void handleBadCredentials() {
        BadCredentialsException ex = new BadCredentialsException("Bad");
        ResponseEntity<ApiError> response = handler.handleBadCredentials(ex, request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("BAD_CREDENTIALS", response.getBody().getError());
    }

    /**
     * Verifica que una excepción de cuenta desactivada se traduce en un error 401 (Unauthorized) con un mensaje específico.
     * <p>
     * <b>Precondiciones:</b> Se lanza una excepción {@code DisabledException}.
     * <b>Ejecución:</b> El manejador captura la excepción de estado de cuenta.
     * <b>Asertos:</b> Se verifica que el código de estado es 401 y que el mensaje notifica que la cuenta está desactivada.
     */
    @Test
    @DisplayName("🧪 AccountStatus: Retorna 401 para DisabledException")
    void handleAccountStatus_Disabled() {
        DisabledException ex = new DisabledException("Disabled");
        ResponseEntity<ApiError> response = handler.handleAccountStatusException(ex, request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertTrue(response.getBody().getMessage().contains("desactivada"));
    }

    /**
     * Verifica que una excepción de acceso denegado se traduce en un error 403 (Forbidden).
     * <p>
     * <b>Precondiciones:</b> Se lanza una excepción {@code AccessDeniedException}.
     * <b>Ejecución:</b> El manejador captura la excepción.
     * <b>Asertos:</b> Se comprueba que el código de estado de la respuesta HTTP es 403.
     */
    @Test
    @DisplayName("🧪 AccessDenied: Retorna 403")
    void handleAccessDenied() {
        AccessDeniedException ex = new AccessDeniedException("Denied");
        ResponseEntity<ApiError> response = handler.handleAccessDenied(ex, request);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    }

    /**
     * Verifica que una excepción de conflicto de recursos se traduce en un error 409 (Conflict).
     * <p>
     * <b>Precondiciones:</b> Se lanza una excepción {@code ResourceConflictException}.
     * <b>Ejecución:</b> El manejador captura la excepción.
     * <b>Asertos:</b> Se verifica que el código de estado es 409 y que el código de error interno es "RESOURCE_CONFLICT".
     */
    @Test
    @DisplayName("🧪 ResourceConflict: Retorna 409")
    void handleResourceConflict() {
        ResourceConflictException ex = new ResourceConflictException("Conflicto");
        ResponseEntity<ApiError> response = handler.handleResourceConflict(ex, request);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("RESOURCE_CONFLICT", response.getBody().getError());
    }

    /**
     * Verifica que un error de discrepancia de tipos en los argumentos se traduce en un error 400 (Bad Request).
     * <p>
     * <b>Precondiciones:</b> Se simula una excepción {@code MethodArgumentTypeMismatchException} cuando un tipo no coincide (ej. string en lugar de ID numérico).
     * <b>Ejecución:</b> El manejador procesa la excepción.
     * <b>Asertos:</b> Se verifica que el estado es 400 y el mensaje refleja el valor erróneo enviado en la petición.
     */
    @Test
    @DisplayName("🧪 TypeMismatch: Retorna 400")
    void handleTypeMismatch() {
        MethodArgumentTypeMismatchException ex = org.mockito.Mockito.mock(MethodArgumentTypeMismatchException.class);
        when(ex.getName()).thenReturn("id");
        when(ex.getValue()).thenReturn("abc");
        
        ResponseEntity<ApiError> response = handler.handleTypeMismatch(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().getMessage().contains("abc"));
    }

    /**
     * Verifica que una excepción de cuenta bloqueada se traduce en un error 401 (Unauthorized).
     * <p>
     * <b>Precondiciones:</b> Se lanza una excepción {@code LockedException}.
     * <b>Ejecución:</b> El manejador procesa el estado de la cuenta.
     * <b>Asertos:</b> Se verifica que el código es 401 y que el mensaje notifica que la cuenta está bloqueada.
     */
    @Test
    @DisplayName("🧪 AccountStatus: LockedException")
    void handleAccountStatus_Locked() {
        LockedException ex = new LockedException("Locked");
        ResponseEntity<ApiError> response = handler.handleAccountStatusException(ex, request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertTrue(response.getBody().getMessage().contains("bloqueada"));
    }

    /**
     * Verifica que cualquier excepción no controlada se maneja como un error interno 500 (Internal Server Error).
     * <p>
     * <b>Precondiciones:</b> Se lanza una {@code RuntimeException} genérica en el sistema.
     * <b>Ejecución:</b> El manejador global intercepta el error.
     * <b>Asertos:</b> Se comprueba que el estado es 500 y el código de error devuelto es "INTERNAL_SERVER_ERROR".
     */
    @Test
    @DisplayName("🧪 handleException: Error 500 genérico")
    void handleGeneralException() {
        RuntimeException ex = new RuntimeException("Crash");
        ResponseEntity<ApiError> response = handler.handleException(ex, request);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals("INTERNAL_SERVER_ERROR", response.getBody().getError());
    }
}
