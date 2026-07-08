package com.tfg.backend.modules.reservation.event.listener;
import com.tfg.backend.core.security.SecurityService;
import com.tfg.backend.modules.reservation.event.ReservationEvent;
import com.tfg.backend.modules.notification.service.NotificationService;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.identity.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

/**
 * Componente oyente encargado de procesar las consecuencias derivadas de los eventos del ciclo de vida de las reservas.
 * Su principal responsabilidad actual es la gestión y creación asíncrona de notificaciones dentro del sistema.
 * El procesamiento se realiza de manera no bloqueante gracias a la anotación de asincronía.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ReservationEventListener {

    /** Servicio de notificaciones. */
    private final NotificationService notificationService;
    /** Repositorio de usuarios. */
    private final UserRepository userRepository;
    /** Servicio de seguridad. */
    private final com.tfg.backend.core.security.SecurityService securityService;


    /**
     * Intercepta y procesa los eventos emitidos relativos a las reservas.
     * Genera las notificaciones pertinentes dependiendo de la acción desencadenante, tales como creación,
     * actualización, cambio de estado o cancelación.
     *
     * @param event El evento de reserva que contiene la información de la entidad y la acción realizada.
     */
    @EventListener
    @Async
    public void handleReservationEvent(ReservationEvent event) {
        Reservation res = event.getReservation();
        String spacesText = res.getSpaces().stream().map(Space::getName).collect(Collectors.joining(", "));
        String path = "/calendar?reservationId=" + res.getId();

        log.debug("Procesando evento de reserva: Action={}, ID={}", event.getAction(), res.getId());

        switch (event.getAction()) {
            case CREATE:
                notificationService.createNotification(
                    res.getUser(), 
                    "Solicitud recibida: " + spacesText, 
                    "RESERVA_CREADA", 
                    path, 
                    res.getId()
                );
                if (!event.isBlock()) {
                    notifyAdmins("Nueva solicitud de " + res.getUser().getName(), res);
                }
                break;

            case UPDATE:
                notificationService.createNotification(
                    res.getUser(), 
                    "Reserva actualizada en " + spacesText, 
                    "RESERVA_ACTUALIZADA", 
                    path, 
                    res.getId()
                );
                break;

            case STATUS_CHANGE:
                boolean approved = res.getStatus() == ReservationStatus.APROBADA;
                String statusType = approved ? "RESERVA_APROBADA" : "RESERVA_RECHAZADA";
                String title = approved ? "Reserva aprobada" : "Reserva rechazada";
                String reason = (!approved && res.getRejectionReason() != null) 
                    ? ". Motivo: " + res.getRejectionReason() 
                    : "";
                
                notificationService.createNotification(
                    res.getUser(), 
                    title + ": " + spacesText + " (" + res.getTitle() + ")" + reason, 
                    statusType, 
                    path, 
                    res.getId()
                );
                break;
                
            case CANCEL:
                notificationService.createNotification(
                    res.getUser(), 
                    "Reserva cancelada: " + spacesText + " (" + res.getTitle() + ")", 
                    "RESERVA_CANCELADA", 
                    path, 
                    res.getId()
                );
                log.info("Notificación de cancelación enviada al usuario: {}", res.getUser().getEmail());
                break;
        }
    }

    /**
     * Envía notificaciones dirigidas al personal administrativo del sistema informando sobre nuevas solicitudes
     * u otras eventualidades que requieran de su atención.
     *
     * @param msg El mensaje informativo a notificar.
     * @param res La reserva asociada que origina la notificación.
     */
    private void notifyAdmins(String msg, Reservation res) {
        userRepository.findAll().stream()
            .filter(u -> securityService.hasPermission(u, "APROBAR_RESERVA"))
            .filter(u -> !u.getId().equals(res.getUser().getId()))
            .forEach(admin -> 
                notificationService.createNotification(admin, msg, "SISTEMA", "/calendar?reservationId=" + res.getId(), res.getId())
            );
    }
}

