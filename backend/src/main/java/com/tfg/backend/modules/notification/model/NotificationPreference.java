package com.tfg.backend.modules.notification.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entidad integrable (Embeddable) que modela las preferencias de notificación de un usuario.
 * Define la configuración detallada sobre qué eventos deben generar notificaciones,
 * tanto a nivel de aplicación interna como a través de correos electrónicos.
 */
@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreference {

    // Valores por defecto centralizados
    /** Valor por defecto para notificación interna al crearse. */
    public static final boolean DEFAULT_INTERNAL_CREATED = true;
    /** Valor por defecto para notificación por correo al crearse. */
    public static final boolean DEFAULT_EMAIL_CREATED = false;
    /** Valor por defecto para notificación interna por cambio de estado. */
    public static final boolean DEFAULT_INTERNAL_STATUS = true;
    /** Valor por defecto para notificación por correo por cambio de estado. */
    public static final boolean DEFAULT_EMAIL_STATUS = true;
    /** Valor por defecto para notificación interna de recordatorio. */
    public static final boolean DEFAULT_INTERNAL_REMINDER = true;
    /** Valor por defecto para notificación por correo de recordatorio. */
    public static final boolean DEFAULT_EMAIL_REMINDER = false;
    /** Valor por defecto para notificación interna de aprobación. */
    public static final boolean DEFAULT_INTERNAL_APPROVAL = true;
    /** Valor por defecto para notificación por correo de aprobación. */
    public static final boolean DEFAULT_EMAIL_APPROVAL = false;
    /** Valor por defecto para notificación interna del sistema. */
    public static final boolean DEFAULT_INTERNAL_SYSTEM = true;
    /** Valor por defecto para notificación por correo del sistema. */
    public static final boolean DEFAULT_EMAIL_SYSTEM = false;

    // Reservas Propias
    // Reservas Propias
    /** Flag para notificación interna al crearse. */
    @Builder.Default
    private boolean internalOnCreated = DEFAULT_INTERNAL_CREATED;
    /** Flag para notificación por correo al crearse. */
    @Builder.Default
    private boolean emailOnCreated = DEFAULT_EMAIL_CREATED;

    /** Flag para notificación interna por cambio de estado. */
    @Builder.Default
    private boolean internalOnStatusChange = DEFAULT_INTERNAL_STATUS;
    /** Flag para notificación por correo por cambio de estado. */
    @Builder.Default
    private boolean emailOnStatusChange = DEFAULT_EMAIL_STATUS;

    // Recordatorios
    // Recordatorios
    /** Flag para notificación interna de recordatorio. */
    @Builder.Default
    private boolean internalOnReminder = DEFAULT_INTERNAL_REMINDER;
    /** Flag para notificación por correo de recordatorio. */
    @Builder.Default
    private boolean emailOnReminder = DEFAULT_EMAIL_REMINDER;

    // Pendientes de aprobación (para gestores/admin)
    /** Flag para notificación interna de aprobación pendiente. */
    @Builder.Default
    private Boolean internalOnApprovalReminder = DEFAULT_INTERNAL_APPROVAL;
    /** Flag para notificación por correo de aprobación pendiente. */
    @Builder.Default
    private Boolean emailOnApprovalReminder = DEFAULT_EMAIL_APPROVAL;

    /**
     * Verifica la preferencia para notificación interna de aprobación.
     * @return true si la notificación interna está activa.
     */
    public boolean isInternalOnApprovalReminder() {
        return internalOnApprovalReminder != null ? internalOnApprovalReminder : DEFAULT_INTERNAL_APPROVAL;
    }

    /**
     * Verifica la preferencia para notificación por correo de aprobación.
     * @return true si la notificación por correo está activa.
     */
    public boolean isEmailOnApprovalReminder() {
        return emailOnApprovalReminder != null ? emailOnApprovalReminder : DEFAULT_EMAIL_APPROVAL;
    }

    // Notificaciones de Sistema / Admin
    /** Flag para notificación interna del sistema. */
    @Builder.Default
    private boolean internalOnSystem = DEFAULT_INTERNAL_SYSTEM;
    /** Flag para notificación por correo del sistema. */
    @Builder.Default
    private boolean emailOnSystem = DEFAULT_EMAIL_SYSTEM;

    /**
     * Restablece todas las preferencias de notificación a sus valores predeterminados.
     */
    public void resetToDefaults() {
        this.internalOnCreated = DEFAULT_INTERNAL_CREATED;
        this.emailOnCreated = DEFAULT_EMAIL_CREATED;
        this.internalOnStatusChange = DEFAULT_INTERNAL_STATUS;
        this.emailOnStatusChange = DEFAULT_EMAIL_STATUS;
        this.internalOnReminder = DEFAULT_INTERNAL_REMINDER;
        this.emailOnReminder = DEFAULT_EMAIL_REMINDER;
        this.internalOnApprovalReminder = DEFAULT_INTERNAL_APPROVAL;
        this.emailOnApprovalReminder = DEFAULT_EMAIL_APPROVAL;
        this.internalOnSystem = DEFAULT_INTERNAL_SYSTEM;
        this.emailOnSystem = DEFAULT_EMAIL_SYSTEM;
    }
}
