package com.tfg.backend.modules.reservation.dto;

import com.tfg.backend.modules.reservation.model.ReservationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Objeto de transferencia de datos utilizado para solicitar la modificación
 * del estado de una reserva (por ejemplo, para su aprobación o rechazo).
 * Contiene el nuevo estado deseado y el motivo de rechazo en caso de aplicar.
 */
@Data
public class ReservationStatusRequest {
    /** Estado de reserva. */
    @NotNull(message = "El estado es obligatorio")
    private ReservationStatus status;
    /** Motivo de rechazo. */
    private String rejectionReason;
}
