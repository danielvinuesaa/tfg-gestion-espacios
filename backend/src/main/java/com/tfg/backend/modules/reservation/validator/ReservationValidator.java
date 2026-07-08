package com.tfg.backend.modules.reservation.validator;
import com.tfg.backend.core.config.AppProperties;
import com.tfg.backend.core.exception.BusinessValidationException;
import com.tfg.backend.core.security.SecurityService;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.identity.model.User;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Componente validador responsable de aplicar y garantizar las reglas de negocio vinculadas a la gestión de reservas.
 * Actúa como un punto centralizado para la verificación de horarios, la detección de solapamientos espaciotemporales
 * y la comprobación de privilegios para la aprobación de solicitudes.
 */
@Component
@RequiredArgsConstructor
public class ReservationValidator {

    /** Repositorio de reservas. */
    private final ReservationRepository reservationRepository;
    /** Servicio de seguridad. */
    private final SecurityService securityService;
    /** Propiedades de la aplicación. */
    private final AppProperties appProperties;

    /**
     * Valida que el rango de fechas proporcionado mantenga coherencia cronológica y se ajuste
     * a las restricciones operativas definidas por el sistema.
     *
     * @param start Fecha y hora de inicio de la reserva.
     * @param end Fecha y hora de finalización de la reserva.
     * @param isBlock Indica si la operación corresponde a un bloqueo administrativo, en cuyo caso
     *                se relajan ciertas restricciones de duración y horario comercial.
     */
    public void validateTimeRange(LocalDateTime start, LocalDateTime end, boolean isBlock) {
        if (start == null || end == null) {
            throw new BusinessValidationException("startTime", "Las fechas de inicio y fin son obligatorias.");
        }

        if (start.isBefore(LocalDateTime.now())) {
            throw new BusinessValidationException("startTime", "No se pueden realizar reservas en el pasado.");
        }

        if (!end.isAfter(start)) {
            throw new BusinessValidationException("startTime", "Error cronológico: La fecha de fin debe ser posterior a la de inicio.");
        }

        // Máximo 24 horas por reserva (excepto bloqueos administrativos)
        if (!isBlock && java.time.Duration.between(start, end).toHours() > 24) {
            throw new BusinessValidationException("endTime", "La duración máxima permitida para una única reserva es de 24 horas.");
        }

        // Validación de márgenes operativos del centro (Solo para reservas normales)
        // Los bloqueos pueden ser de varios días y por tanto incluyen horas nocturnas
        if (!isBlock) {
            if (isOutsideBusinessHours(start)) {
                throw new BusinessValidationException("startTime", String.format("La hora de inicio (%02d:%02d) está fuera del horario operativo (%02d:00 - %02d:00).", 
                    start.getHour(), start.getMinute(), appProperties.getTime().getStartHour(), appProperties.getTime().getEndHour()));
            }

            if (isOutsideBusinessHours(end)) {
                throw new BusinessValidationException("endTime", String.format("La hora de fin (%02d:%02d) está fuera del horario operativo (%02d:00 - %02d:00).", 
                    end.getHour(), end.getMinute(), appProperties.getTime().getStartHour(), appProperties.getTime().getEndHour()));
            }
        }

        if (start.getMinute() % appProperties.getTime().getMinuteStep() != 0 || end.getMinute() % appProperties.getTime().getMinuteStep() != 0) {
            throw new BusinessValidationException("startTime", "Los minutos deben ser múltiplos de " + appProperties.getTime().getMinuteStep() + " conforme a la política de planificación.");
        }
    }

    /**
     * Verifica la disponibilidad de los espacios solicitados, detectando posibles colisiones
     * con reservas o bloqueos previamente registrados.
     * En el escenario de un bloqueo administrativo, se tolera el solapamiento de manera temporal 
     * para delegar la resolución y cancelación en cascada al servicio correspondiente.
     *
     * @param spaceIds Lista de identificadores de los espacios a reservar.
     * @param start Fecha y hora de inicio de la solicitud.
     * @param end Fecha y hora de finalización de la solicitud.
     * @param excludeId Identificador de una reserva existente a excluir de la validación (útil en actualizaciones).
     * @param isBlock Indica si la operación en curso es un bloqueo administrativo.
     */
    public void validateOverlaps(List<Long> spaceIds, LocalDateTime start, LocalDateTime end, Long excludeId, boolean isBlock) {
        for (Long spaceId : spaceIds) {
            List<Reservation> overlaps = (excludeId == null) 
                ? reservationRepository.findOverlappingReservations(spaceId, start, end)
                : reservationRepository.findOverlappingReservationsExcludingId(spaceId, start, end, excludeId);
            
            if (!overlaps.isEmpty()) {
                // Si es un bloqueo, no lanzamos excepción aquí, dejamos que el servicio resuelva el conflicto cancelando las otras.
                // Sin embargo, si lo que solapa es OTRO BLOQUEO, sí impedimos la creación (dos bloqueos no pueden coexistir).
                boolean hasOtherBlock = overlaps.stream().anyMatch(r -> r.getStatus() == com.tfg.backend.modules.reservation.model.ReservationStatus.BLOQUEO);
                
                if (!isBlock || hasOtherBlock) {
                    throw new BusinessValidationException("spaceIds", String.format("Conflicto detectado: El espacio solicitado ya está ocupado por '%s' en ese horario.", 
                        overlaps.get(0).getTitle()));
                }
            }
        }
    }

    /**
     * Determina si el usuario autenticado posee los privilegios necesarios para emitir
     * una resolución (aprobación o rechazo) sobre una solicitud de reserva determinada,
     * garantizando simultáneamente que la reserva no haya superado su periodo de vigencia.
     *
     * @param user El usuario que intenta llevar a cabo la acción de aprobación.
     * @param reservation La entidad de reserva sobre la que se pretende actuar.
     */
    public void validateApprovalPermissions(User user, Reservation reservation) {
        if (!securityService.canApproveReservation(reservation.getId())) {
            throw new BusinessValidationException("status", "Acceso denegado: Su rol no posee autoridad de aprobación sobre este recurso.");
        }

        if (reservation.getStartTime().isBefore(LocalDateTime.now())) {
            throw new BusinessValidationException("status", "No se puede gestionar esta solicitud: El horario de inicio ya ha pasado y la reserva ha expirado.");
        }
    }

    /**
     * Comprueba si el estado actual y el contexto temporal de una reserva permiten su modificación.
     * Se restringen alteraciones sobre reservas en estados terminales o aquellas cuya fecha de inicio ya ha expirado.
     *
     * @param reservation La reserva cuya capacidad de edición se evalúa.
     */
    public void validateEditableState(Reservation reservation) {
        ReservationStatus status = reservation.getStatus();
        if (status == ReservationStatus.CANCELADA || status == ReservationStatus.RECHAZADA) {
            throw new BusinessValidationException("status", 
                String.format("No se puede editar una reserva en estado %s.", status));
        }

        if (reservation.getStartTime().isBefore(LocalDateTime.now())) {
            throw new BusinessValidationException("startTime", "No se puede editar una reserva que ya ha comenzado o es pasada.");
        }
    }

    /**
     * Comprueba si una hora está fuera del horario comercial definido.
     *
     * @param time La fecha y hora a evaluar.
     * @return true si está fuera del horario, false en caso contrario.
     */
    private boolean isOutsideBusinessHours(LocalDateTime time) {
        int hour = time.getHour();
        return hour < appProperties.getTime().getStartHour() || hour > appProperties.getTime().getEndHour() || (hour == appProperties.getTime().getEndHour() && time.getMinute() > 0);
    }
}

