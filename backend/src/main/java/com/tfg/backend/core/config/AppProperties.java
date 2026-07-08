package com.tfg.backend.core.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Clase de configuración destinada a mapear las propiedades globales de la aplicación
 * definidas en el archivo de propiedades bajo el prefijo "app".
 */
@Configuration
@ConfigurationProperties(prefix = "app")
@Data
public class AppProperties {
    
    /**
     * Configuración de tiempos y horarios.
     */
    private final Time time = new Time();

    /**
     * URL base del frontend.
     */
    private String frontendUrl = "http://localhost:5173";

    /**
     * Clase estática que contiene la configuración relativa a los parámetros de tiempo de la aplicación.
     */
    @Data
    public static class Time {
        /** Hora de inicio operativa. */
        private int startHour = 9;
        /** Hora de fin operativa. */
        private int endHour = 21;
        /** Intervalo de minutos. */
        private int minuteStep = 30;
    }
}
