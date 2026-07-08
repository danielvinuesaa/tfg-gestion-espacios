package com.tfg.backend.modules.notification.service;
import com.tfg.backend.core.security.SecurityService;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Servicio encargado de la planificación y ejecución de tareas automáticas (recordatorios)
 * relacionadas con las reservas. Emplea el programador de tareas de Spring para evaluar
 * los estados de las reservas y notificar a los usuarios y gestores correspondientes.
 */
@Service
@RequiredArgsConstructor
public class ReminderScheduler {

    /** Repositorio de reservas. */
    private final ReservationRepository reservationRepository;
    /** Servicio de notificaciones. */
    private final NotificationService notificationService;
    /** Repositorio de usuarios. */
    private final com.tfg.backend.modules.identity.repository.UserRepository userRepository;
    /** Servicio de seguridad. */
    private final com.tfg.backend.core.security.SecurityService securityService;

    /**
     * Tarea programada que se ejecuta periódicamente cada 15 minutos.
     * Busca las reservas en estado aprobado que tienen programado su inicio dentro de la próxima hora
     * y para las cuales aún no se ha enviado un recordatorio. Posteriormente, genera y envía
     * una notificación al usuario correspondiente.
     */
    @Scheduled(fixedRate = 900000) // 15 min en ms
    @Transactional
    public void sendReservationReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneHourFromNow = now.plusHours(1);

        // Buscar reservas aprobadas en la próxima hora sin recordatorio enviado
        List<Reservation> upcoming = reservationRepository.findByStatusAndStartTimeBetweenAndReminderSentFalse(
                ReservationStatus.APROBADA, 
                now, 
                oneHourFromNow
        );

        for (Reservation res : upcoming) {
            try {
                String spaceName = res.getSpaces().iterator().next().getName();
                String msg = "Recordatorio: Tu reserva en " + spaceName + " comienza pronto (a las " + 
                        res.getStartTime().toLocalTime() + ").";
                
                notificationService.createNotification(
                    res.getUser(), 
                    msg, 
                    "RECORDATORIO", 
                    "/calendar?reservationId=" + res.getId()
                );

                res.setReminderSent(true);
                reservationRepository.save(res);
            } catch (Exception e) {
                System.err.println("Error enviando recordatorio para reserva " + res.getId() + ": " + e.getMessage());
            }
        }
    }

    /**
     * Tarea programada que se ejecuta una vez al día a las 8:00 AM, de lunes a viernes.
     * Identifica aquellas reservas cuyo estado es SOLICITADA desde hace más de dos días laborables
     * y genera notificaciones dirigidas a los gestores competentes para recordarles que deben revisar dichas solicitudes.
     */
    @Scheduled(cron = "0 0 8 * * MON-FRI") // 8:00 AM de lunes a viernes
    @Transactional
    public void sendPendingApprovalReminders() {
        // Calculamos la fecha límite (hace 2 días laborables)
        LocalDateTime limitDate = calculateBusinessDaysAgo(2);

        List<Reservation> pending = reservationRepository.findPendingForApprovalReminder(
                ReservationStatus.SOLICITADA, 
                limitDate
        );

        if (pending.isEmpty()) return;

        // Obtener todos los usuarios que tienen algún tipo de permiso de aprobación
        List<com.tfg.backend.modules.identity.model.User> potentialApprovers = userRepository.findAll().stream()
                .filter(u -> securityService.hasPermission(u, "APROBAR_RESERVA") || 
                             securityService.hasPermission(u, "APROBAR_ASIGNATURAS_GESTIONADAS"))
                .toList();

        for (Reservation res : pending) {
            String spacesText = res.getSpaces().stream()
                    .map(com.tfg.backend.modules.space.model.Space::getName)
                    .collect(java.util.stream.Collectors.joining(", "));
            
            String msg = "Recordatorio: La solicitud de " + res.getUser().getName() + " en " + 
                    spacesText + " lleva pendiente más de 48h.";

            for (com.tfg.backend.modules.identity.model.User approver : potentialApprovers) {
                // No notificamos al propio solicitante ni a alguien que no tenga permiso real para ESTA reserva
                if (approver.getId().equals(res.getUser().getId()) || 
                    !securityService.canUserApproveReservation(approver, res)) {
                    continue;
                }

                notificationService.createNotification(
                    approver, 
                    msg, 
                    "RECORDATORIO_APROBACION", 
                    "/calendar?reservationId=" + res.getId(),
                    res.getId()
                );
            }

            res.setApprovalReminderSent(true);
            reservationRepository.save(res);
        }
    }

    /**
     * Calcula la fecha correspondiente a un número específico de días laborables en el pasado.
     * Excluye los fines de semana (sábados y domingos) del cálculo.
     *
     * @param businessDays Número de días laborables a restar desde la fecha actual.
     * @return La fecha calculada tras restar los días laborables indicados.
     */
    private LocalDateTime calculateBusinessDaysAgo(int businessDays) {
        LocalDateTime date = LocalDateTime.now();
        int addedDays = 0;
        while (addedDays < businessDays) {
            date = date.minusDays(1);
            if (!(date.getDayOfWeek() == java.time.DayOfWeek.SATURDAY || 
                  date.getDayOfWeek() == java.time.DayOfWeek.SUNDAY)) {
                addedDays++;
            }
        }
        return date;
    }
}
