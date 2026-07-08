package com.tfg.backend.core.config;

import com.tfg.backend.BaseIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Suite de pruebas de integración para el controlador de estado (HealthController).
 * <p>
 * Verifica que el endpoint de verificación de estado (health check) funcione correctamente,
 * respondiendo a las peticiones HTTP y permitiendo monitorizar el estado de la aplicación.
 */
@DisplayName("Tests de Integración: Health Check")
class HealthControllerIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    /**
     * Verifica que el endpoint de health check responde con estado HTTP 200 y el mensaje esperado.
     * <p>
     * <b>Precondiciones:</b> El contexto de Spring y el controlador están levantados.
     * <b>Ejecución:</b> Se realiza una petición GET a la ruta "/api/health".
     * <b>Asertos:</b> Se comprueba que el estado es "OK" y que el contenido indica que el sistema está corriendo.
     */
    @Test
    @DisplayName("🧪 Health check endpoint responde correctamente")
    void healthCheck() throws Exception {
        MockMvc mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(content().string("Backend is up and running!"));
    }
}
