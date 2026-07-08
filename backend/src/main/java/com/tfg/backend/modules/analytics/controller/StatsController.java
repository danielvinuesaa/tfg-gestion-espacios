package com.tfg.backend.modules.analytics.controller;
import com.tfg.backend.modules.analytics.dto.StatsDTO;
import com.tfg.backend.modules.analytics.service.StatsService;
import com.tfg.backend.modules.identity.model.User;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.RequestParam;
import java.time.LocalDateTime;

/**
 * Controlador REST encargado de exponer las estadísticas del sistema.
 * Delega la lógica de negocio y las reglas de visibilidad al servicio correspondiente,
 * manteniendo una interfaz clara y centrada en la recepción de peticiones.
 */
@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    /**
     * Servicio encargado del cálculo y agregación de todas las métricas del sistema.
     */
    private final StatsService statsService;

    /**
     * Obtiene las estadísticas acumuladas o del periodo especificado para el usuario autenticado.
     *
     * @param user El usuario autenticado que realiza la solicitud, utilizado para determinar sus permisos y vista.
     * @param startDate La fecha y hora inicial para calcular las estadísticas (opcional).
     * @param endDate La fecha y hora final para calcular las estadísticas (opcional).
     * @return Una respuesta HTTP conteniendo el objeto de transferencia de datos con las estadísticas solicitadas.
     */
    @GetMapping
    public ResponseEntity<StatsDTO> getStats(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        return ResponseEntity.ok(statsService.getStatsForUser(user, startDate, endDate));
    }
}
