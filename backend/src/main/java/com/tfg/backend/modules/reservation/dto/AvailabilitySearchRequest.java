package com.tfg.backend.modules.reservation.dto;
import com.tfg.backend.modules.space.model.SpaceType;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Objeto de transferencia de datos destinado a capturar los parámetros de entrada requeridos
 * para ejecutar una consulta de disponibilidad de espacios.
 * Admite configuraciones tanto para búsquedas delimitadas cronológicamente (modo estándar)
 * como para escenarios de prospección paramétrica (modo flexible).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilitySearchRequest {
    /** Fecha de inicio modo estándar. */
    private LocalDateTime startTime;
    /** Fecha de fin modo estándar. */
    private LocalDateTime endTime;
    
    /** Modo flexible. */
    private Boolean flexible;
    /** Inicio de rango. */
    private LocalDate rangeStart;
    /** Fin de rango. */
    private LocalDate rangeEnd;
    /** Inicio diario. */
    private LocalTime dailyStart;
    /** Fin diario. */
    private LocalTime dailyEnd;

    /** Duración en horas. */
    @Positive(message = "La duración debe ser positiva")
    private Double durationHours;
    /** Incluir fines de semana. */
    private Boolean includeWeekends;

    /** Capacidad mínima. */
    private Integer minCapacity;
    /** Ratio de distribución. */
    private Double distributionRatio; // Factor de ocupación (1.0 = 100%, 2.0 = 50%, etc.)
    /** Tipos de espacio. */
    private List<SpaceType> types;
}
