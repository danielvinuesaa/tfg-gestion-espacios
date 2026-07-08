package com.tfg.backend.modules.notification.dto;

import com.tfg.backend.modules.notification.model.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Data Transfer Object (DTO) que encapsula la información de salida de una notificación.
 * Se utiliza para transferir los datos desde la capa de servicio a la capa de presentación
 * de manera segura y controlada.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDTO {
    /** Identificador. */
    private Long id;
    /** Contenido de la notificación. */
    private String content;
    /** Tipo de notificación. */
    private NotificationType type;
    /** Indica si ha sido leída. */
    private boolean read;
    /** Ruta de acción asociada. */
    private String actionPath;
    /** Identificador de la reserva. */
    private Long reservationId;
    /** Fecha de creación. */
    private LocalDateTime createdAt;
}
