package com.tfg.backend.modules.analytics.model;
import com.tfg.backend.modules.space.model.Space;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entidad que representa un registro de auditoría en la base de datos.
 * Almacena el historial de acciones y modificaciones importantes realizadas
 * sobre las diversas entidades del sistema.
 */
@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    /**
     * Identificador único autogenerado del registro.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Nombre de la acción efectuada (por ejemplo, "UPDATE_SPACE", "DELETE_USER").
     */
    @Column(nullable = false)
    private String action;

    /**
     * Nombre de la entidad de dominio afectada (por ejemplo, "Space").
     */
    @Column(nullable = false)
    private String entityName;

    /**
     * Identificador de la entidad de dominio afectada.
     */
    private Long entityId;

    /**
     * Correo electrónico o identificador del usuario que realizó la acción.
     */
    @Column(nullable = false)
    private String performedBy;

    /**
     * Descripción textual o volcado JSON con los detalles de los cambios.
     */
    @Column(columnDefinition = "TEXT")
    private String details;

    /**
     * Fecha y hora en la que se generó este registro.
     */
    private LocalDateTime timestamp;

    /**
     * Método de ciclo de vida (callback) ejecutado antes de persistir la entidad,
     * encargado de asignar la fecha y hora actuales.
     */
    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
