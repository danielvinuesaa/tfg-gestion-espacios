package com.tfg.backend.modules.space.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Objeto de Transferencia de Datos (DTO) que representa un conflicto de reserva en un espacio.
 * Encapsula la información detallada necesaria para notificar sobre solapamientos o problemas de disponibilidad,
 * permitiendo identificar la reserva conflictiva y el usuario involucrado.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpaceConflictDTO {
    /**
     * Identificador único del espacio donde ocurre el conflicto.
     */
    private Long spaceId;

    /**
     * Nombre descriptivo del espacio.
     */
    private String spaceName;

    /**
     * Identificador único de la reserva que genera el conflicto.
     */
    private Long reservationId;

    /**
     * Título o motivo de la reserva conflictiva.
     */
    private String title;

    /**
     * Tipo de la reserva que ocasiona el solapamiento.
     */
    private String type;

    /**
     * Nombre del usuario responsable de la reserva conflictiva.
     */
    private String userName;

    /**
     * Fecha y hora de inicio de la reserva conflictiva.
     */
    private LocalDateTime startTime;

    /**
     * Fecha y hora de fin de la reserva conflictiva.
     */
    private LocalDateTime endTime;

    /**
     * Estado actual de la reserva.
     */
    private String status;

    /**
     * Indica si el conflicto aplica únicamente al espacio y no a la totalidad de la reserva.
     */
    private boolean onlySpace;
}
