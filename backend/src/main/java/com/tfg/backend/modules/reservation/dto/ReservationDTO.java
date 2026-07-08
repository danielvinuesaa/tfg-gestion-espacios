package com.tfg.backend.modules.reservation.dto;

import com.tfg.backend.modules.identity.dto.UserDTO;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.reservation.model.ReservationType;
import com.tfg.backend.modules.space.dto.SpaceDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * Objeto de transferencia de datos empleado para exponer la información detallada
 * de una reserva hacia las capas de presentación o consumidores de la API.
 * Encapsula la temporalidad, estado, responsables y los espacios involucrados.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservationDTO {
    /** Identificador de la reserva. */
    private Long id;
    /** Espacios reservados. */
    private Set<SpaceDTO> spaces;
    /** Usuario solicitante. */
    private UserDTO user;
    /** Usuario responsable. */
    private UserDTO responsible;
    /** Fecha de inicio. */
    private LocalDateTime startTime;
    /** Fecha de fin. */
    private LocalDateTime endTime;
    /** Estado de la reserva. */
    private ReservationStatus status;
    /** Tipo de la reserva. */
    private ReservationType type;
    /** Título. */
    private String title;
    /** Asignatura asociada. */
    private SubjectDTO subject;
    /** Descripción adicional. */
    private String description;
    /** Nombre del responsable. */
    private String responsibleName;
    /** Motivo de rechazo. */
    private String rejectionReason;
    /** Fecha de creación. */
    private LocalDateTime createdAt;
}
