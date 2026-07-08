package com.tfg.backend.modules.analytics.dto;

import com.tfg.backend.modules.reservation.dto.ReservationDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Objeto de transferencia de datos utilizado como agregado principal para
 * la vista de estadísticas o panel de control, agrupando diversas métricas
 * y listados de información relevante.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class StatsDTO {
    
    /**
     * Agrupación de métricas globales e históricas del sistema.
     */
    private SystemTotals systemTotals;
    
    /**
     * Agrupación de métricas calculadas sobre un periodo de tiempo determinado.
     */
    private PeriodActivity periodActivity;
    
    /**
     * Lista de los eventos de actividad más recientes y relevantes en el sistema.
     */
    private List<RecentActivityDTO> recentActivity;
    
    /**
     * Lista de reservas aprobadas próximas a llevarse a cabo.
     */
    private List<ReservationDTO> upcomingEvents;
}
