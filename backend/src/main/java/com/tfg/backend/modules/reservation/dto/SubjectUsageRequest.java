package com.tfg.backend.modules.reservation.dto;
import com.tfg.backend.modules.reservation.model.ReservationType;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

/**
 * Objeto de transferencia de datos diseñado para estructurar las solicitudes
 * de análisis de uso o carga docente asociada a una o varias asignaturas
 * durante un rango temporal específico.
 */
@Data
public class SubjectUsageRequest {
    /** IDs de asignaturas. */
    private List<Long> subjectIds;
    /** Tipos de reserva. */
    private List<ReservationType> reservationTypes; // Nuevo filtro

    /** Fecha de inicio. */
    @NotNull(message = "La fecha de inicio es obligatoria")
    private LocalDate startDate;

    /** Fecha de fin. */
    @NotNull(message = "La fecha de fin es obligatoria")
    private LocalDate endDate;
}
