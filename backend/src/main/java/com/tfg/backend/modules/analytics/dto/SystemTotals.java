package com.tfg.backend.modules.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Objeto de transferencia de datos que consolida las métricas totales y
 * acumuladas a nivel global del sistema, sin filtros temporales aplicados.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SystemTotals {
    
    /**
     * Número total de espacios registrados actualmente en el sistema.
     */
    private long totalSpaces;
    
    /**
     * Número total de usuarios registrados actualmente en el sistema.
     */
    private long totalUsers;
    
    /**
     * Número total histórico de reservas creadas desde el inicio del sistema.
     */
    private long totalReservationsHistorical;
}
