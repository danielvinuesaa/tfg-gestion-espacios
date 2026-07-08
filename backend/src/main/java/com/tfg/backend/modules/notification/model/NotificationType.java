package com.tfg.backend.modules.notification.model;

/**
 * Enumeración que define los diferentes tipos de notificaciones soportados por el sistema.
 * Clasifica los eventos generados, tales como la creación o actualización de reservas,
 * la emisión de recordatorios o las alertas generales del sistema.
 */
public enum NotificationType {
    RESERVA_CREADA,
    RESERVA_APROBADA,
    RESERVA_RECHAZADA,
    RESERVA_CANCELADA,
    RESERVA_ACTUALIZADA,
    RECORDATORIO,
    RECORDATORIO_APROBACION,
    SISTEMA
}
