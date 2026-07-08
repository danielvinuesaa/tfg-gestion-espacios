package com.tfg.backend.modules.reservation.model;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.identity.model.User;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.HashSet;

/**
 * Entidad principal del dominio que representa una reserva formalizada sobre los espacios de la institución.
 * Establece la vinculación entre una franja cronológica específica, un conjunto de recursos espaciales y,
 * de manera opcional, el marco curricular de una asignatura. Soporta un ciclo de vida de estados y 
 * contempla la figura de bloqueos técnicos para tareas de mantenimiento.
 */
@Entity
@Table(name = "reservations")
@Getter
@Setter
@ToString(exclude = {"spaces", "user", "subject"})
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reservation {

    /** Identificador único de la reserva. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * El conjunto de espacios físicos reservados simultáneamente en la misma solicitud.
     * Su carga temprana (EAGER) resulta indispensable para facilitar su rápida proyección gráfica
     * en el módulo de calendario o cuadrícula horaria.
     */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "reservation_spaces",
        joinColumns = @JoinColumn(name = "reservation_id"),
        inverseJoinColumns = @JoinColumn(name = "space_id")
    )
    @Builder.Default
    private Set<Space> spaces = new HashSet<>();

    /** 
     * Usuario propietario y emisor originario de la solicitud de reserva. 
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** 
     * Usuario registrado que asume la responsabilidad funcional de la actividad, en caso de delegación. 
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "responsible_user_id")
    private User responsible;

    /** 
     * El momento cronológico en el que da comienzo el uso de los espacios. 
     */
    @Column(nullable = false)
    private LocalDateTime startTime;

    /** 
     * El momento cronológico que dictamina el término de la reserva estipulada. 
     */
    @Column(nullable = false)
    private LocalDateTime endTime;

    /** 
     * Situación administrativa actual en la que se encuentra el ciclo de vida de la reserva. 
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReservationStatus status;

    /** 
     * Tipología académica o administrativa adjudicada a la ocupación propuesta. 
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ReservationType type = ReservationType.OTRO;

    /** 
     * Enunciado o título representativo que designa la naturaleza o propósito del evento. 
     */
    private String title;

    /** 
     * Referencia a la entidad de la asignatura en caso de reservas curriculares (requisito para docencia o evaluación). 
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    /** 
     * Aclaraciones funcionales complementarias o exigencias logísticas especiales. 
     */
    @Column(length = 1000)
    private String description;

    /** 
     * Designación nominativa del docente o personal a cargo de la gestión in situ. 
     */
    private String responsibleName;

    /** 
     * Argumentación formal provista por los órganos gestores al denegar la solicitud. 
     */
    private String rejectionReason;

    /** 
     * Indicador lógico de control que dictamina si se ha procedido al envío automatizado de notificaciones previas. 
     */
    @Builder.Default
    private boolean reminderSent = false;

    /** 
     * Indicador de supervisión para el sistema subyacente responsable de enviar avisos de solicitudes demoradas. 
     */
    @Builder.Default
    private Boolean approvalReminderSent = false;

    /**
     * Comprueba si se ha enviado el recordatorio de aprobación.
     *
     * @return true si se envió, false en caso contrario
     */
    public boolean isApprovalReminderSent() {
        return approvalReminderSent != null && approvalReminderSent;
    }

    /** 
     * Marca temporal que documenta fehacientemente el instante de registro inicial del objeto en el sistema. 
     */
    private LocalDateTime createdAt;

    /**
     * Establece la fecha de creación antes de persistir.
     */
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
