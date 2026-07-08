package com.tfg.backend.modules.analytics.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

/**
 * Objeto de transferencia de datos que encapsula los parámetros de solicitud
 * para la generación de informes de ocupación.
 */
@Data
public class OccupancyRequest {
    
    /**
     * Lista de identificadores de los espacios a analizar.
     * Es opcional; si se envía vacía o nula, se analizarán todos los espacios disponibles.
     */
    private List<Long> spaceIds;

    /**
     * Fecha de inicio del periodo a evaluar.
     */
    @NotNull(message = "La fecha de inicio es obligatoria")
    private LocalDate startDate;

    /**
     * Fecha de fin del periodo a evaluar.
     */
    @NotNull(message = "La fecha de fin es obligatoria")
    private LocalDate endDate;
}
