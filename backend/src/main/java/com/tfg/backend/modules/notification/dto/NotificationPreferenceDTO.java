package com.tfg.backend.modules.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object (DTO) utilizado para la gestión y transferencia de las
 * preferencias de notificación de los usuarios, separando la configuración de alertas
 * internas de las de correo electrónico.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreferenceDTO {
    /** Notificación interna al crearse. */
    private boolean internalOnCreated;
    /** Notificación por correo al crearse. */
    private boolean emailOnCreated;
    /** Notificación interna por cambio de estado. */
    private boolean internalOnStatusChange;
    /** Notificación por correo por cambio de estado. */
    private boolean emailOnStatusChange;
    /** Notificación interna para recordatorio. */
    private boolean internalOnReminder;
    /** Notificación por correo para recordatorio. */
    private boolean emailOnReminder;
    /** Notificación interna para recordatorio de aprobación. */
    private boolean internalOnApprovalReminder;
    /** Notificación por correo para recordatorio de aprobación. */
    private boolean emailOnApprovalReminder;
    /** Notificación interna del sistema. */
    private boolean internalOnSystem;
    /** Notificación por correo del sistema. */
    private boolean emailOnSystem;
}
