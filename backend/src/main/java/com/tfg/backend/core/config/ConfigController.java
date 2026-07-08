package com.tfg.backend.core.config;
import com.tfg.backend.core.common.TimeConfigResponse;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controlador de tipo REST encargado de exponer la configuración global de la aplicación.
 */
@RestController
@RequestMapping("/api/config")
@RequiredArgsConstructor
public class ConfigController {

    /**
     * Propiedades de la aplicación.
     */
    private final AppProperties appProperties;

    /**
     * Obtiene la configuración relacionada con los parámetros de tiempo (horarios, intervalos) de la aplicación.
     *
     * @return Un objeto {@link TimeConfigResponse} que contiene la configuración de tiempo.
     */
    @GetMapping("/time")
    public TimeConfigResponse getTimeConfig() {
        return TimeConfigResponse.builder()
                .startHour(appProperties.getTime().getStartHour())
                .endHour(appProperties.getTime().getEndHour())
                .minuteStep(appProperties.getTime().getMinuteStep())
                .build();
    }
}
