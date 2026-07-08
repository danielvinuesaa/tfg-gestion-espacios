package com.tfg.backend.modules.reservation.event;
import com.tfg.backend.modules.reservation.model.Reservation;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * Representa un evento del dominio utilizado para notificar cambios en el ciclo de vida de las reservas.
 * Permite la desacoplación arquitectónica entre la lógica de negocio subyacente y las acciones derivadas,
 * como la emisión de notificaciones o el envío de correos electrónicos.
 */
@Getter
public class ReservationEvent extends ApplicationEvent {
    
    /**
     * Enumeración que define las posibles acciones desencadenantes del evento.
     */
    public enum ReservationAction {
        CREATE,
        UPDATE,
        STATUS_CHANGE,
        CANCEL
    }

    /** Reserva asociada. */
    private final Reservation reservation;
    /** Acción realizada. */
    private final ReservationAction action;
    /** Indica si es un bloqueo. */
    private final boolean isBlock;

    /**
     * Constructor principal para la creación de un evento de reserva, indicando si se trata de un bloqueo explícito.
     *
     * @param source      La instancia u objeto de origen desde donde se origina el evento.
     * @param reservation La entidad de reserva involucrada en la operación.
     * @param action      La acción u operación realizada sobre la reserva.
     * @param isBlock     Indicador booleano que establece si el evento representa un bloqueo de espacio.
     */
    public ReservationEvent(Object source, Reservation reservation, ReservationAction action, boolean isBlock) {
        super(source);
        this.reservation = reservation;
        this.action = action;
        this.isBlock = isBlock;
    }

    /**
     * Constructor secundario que permite la instanciación de un evento asumiendo, por defecto,
     * que la operación no representa un bloqueo del espacio.
     *
     * @param source      La instancia u objeto de origen desde donde se origina el evento.
     * @param reservation La entidad de reserva involucrada en la operación.
     * @param action      La acción u operación realizada sobre la reserva.
     */
    public ReservationEvent(Object source, Reservation reservation, ReservationAction action) {
        this(source, reservation, action, false);
    }
}
