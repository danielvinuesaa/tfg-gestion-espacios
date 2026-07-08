package com.tfg.backend.modules.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Objeto de transferencia de datos que encapsula la actividad del sistema
 * durante un periodo de tiempo determinado. Incluye métricas sobre reservas,
 * ocupación y crecimiento de usuarios.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PeriodActivity {
    
    /**
     * Número total de reservas realizadas o activas en el periodo.
     */
    private long reservationsCount;
    
    /**
     * Número de usuarios distintos que han interactuado con el sistema en el periodo.
     */
    private long activeUsersCount;
    
    /**
     * Ratio de ocupación general, calculado como la proporción de espacios usados frente al total disponible.
     */
    private double occupancyRatio;

    /**
     * Porcentaje de crecimiento en el número de reservas respecto al periodo anterior equivalente.
     */
    private double reservationsGrowth;
    
    /**
     * Porcentaje de crecimiento en la cantidad de usuarios activos respecto al periodo anterior equivalente.
     */
    private double usersGrowth;

    /**
     * Desglose del número total de reservas agrupado por nombre de espacio.
     */
    private Map<String, Long> reservationsBySpace;
    
    /**
     * Desglose del número total de reservas agrupado por el estado actual de las mismas.
     */
    private Map<String, Long> reservationsByStatus;
    
    /**
     * Ocupación detallada categorizada por tipo y luego desglosada por otras variables.
     */
    private Map<String, Map<String, Long>> occupancyByType;
    
    /**
     * Desglose de la actividad del sistema agregada de forma semanal a lo largo del periodo.
     */
    private Map<String, Long> weeklyActivity;
}
