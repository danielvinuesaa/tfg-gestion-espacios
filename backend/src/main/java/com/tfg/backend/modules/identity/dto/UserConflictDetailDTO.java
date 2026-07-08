package com.tfg.backend.modules.identity.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * Objeto de Transferencia de Datos (DTO) que encapsula el detalle específico
 * de un conflicto de reserva asociado a un usuario individual.
 * Se utiliza principalmente en el panel de detalles durante el proceso de eliminación.
 */
@Data
@Builder
public class UserConflictDetailDTO {
    
    /**
     * Identificador único de la reserva que entra en conflicto.
     */
    private Long reservationId;
    
    /**
     * Nombre del espacio físico o virtual afectado por el conflicto.
     */
    private String spaceName;
    
    /**
     * Fecha y hora de inicio de la reserva conflictiva.
     */
    private LocalDateTime startTime;
    
    /**
     * Fecha y hora de finalización de la reserva conflictiva.
     */
    private LocalDateTime endTime;
    
    /**
     * Estado actual de la reserva conflictiva.
     */
    private String status;
}
