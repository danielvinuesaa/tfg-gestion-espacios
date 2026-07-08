package com.tfg.backend.modules.analytics.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

/**
 * Objeto de transferencia de datos utilizado para solicitar la generación
 * de informes de registros de firmas o partes de asistencia.
 */
@Data
public class SignatureLogRequest {
    
    /**
     * Lista de identificadores de los espacios requeridos en el informe.
     */
    private List<Long> spaceIds;

    /**
     * Fecha de inicio para el cálculo del informe.
     */
    @NotNull(message = "La fecha de inicio es obligatoria")
    private LocalDate startDate;

    /**
     * Fecha de finalización para el cálculo del informe.
     */
    @NotNull(message = "La fecha de fin es obligatoria")
    private LocalDate endDate;
}
