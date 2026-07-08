package com.tfg.backend.modules.notification.model;
import com.tfg.backend.modules.identity.model.User;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entidad que representa una notificación enviada a un usuario del sistema.
 * Contiene información sobre el contenido, el tipo de notificación, su estado de lectura
 * y posibles enlaces o referencias a otras entidades como reservas.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "notifications")
public class Notification {

    /** Identificador único de la notificación. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Usuario al que va dirigida la notificación. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Contenido en texto de la notificación. */
    @Column(nullable = false)
    private String content;

    /** Tipo o categoría de la notificación. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    /** Indica si la notificación ya ha sido leída. */
    @Builder.Default
    @Column(nullable = false)
    private boolean read = false;

    /** Ruta de acción sugerida para la notificación. */
    private String actionPath;

    /** Identificador de la reserva asociada, si existe. */
    private Long reservationId;

    /** Fecha y hora de creación de la notificación. */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
