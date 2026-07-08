package com.tfg.backend.core.config;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controlador de tipo REST encargado de exponer puntos de enlace para la verificación
 * del estado y la disponibilidad del sistema.
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    /**
     * Endpoint de estado de salud (health check).
     *
     * @return Una cadena de texto confirmando la operatividad del backend.
     */
    @GetMapping("/health")
    public String health() {
        return "Backend is up and running!";
    }
}
