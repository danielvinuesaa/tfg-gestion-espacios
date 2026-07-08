package com.tfg.backend.modules.reservation.event.listener;

import com.tfg.backend.core.security.SecurityService;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.repository.UserRepository;
import com.tfg.backend.modules.notification.service.NotificationService;
import com.tfg.backend.modules.reservation.event.ReservationEvent;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.space.model.Space;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
/**
 * Suite de pruebas unitarias para el gestor de eventos de reservas {@link ReservationEventListener}.
 * Verifica que el sistema notifique correctamente a los usuarios y administradores apropiados
 * en respuesta a las acciones del ciclo de vida de una reserva (creación, edición, cambios de estado y cancelación).
 */
@DisplayName("Tests Unitarios de ReservationEventListener")
class ReservationEventListenerTest {

    @Mock private NotificationService notificationService;
    @Mock private UserRepository userRepository;
    @Mock private SecurityService securityService;

    @InjectMocks
    private ReservationEventListener reservationEventListener;

    private User mockUser;
    private Reservation mockReservation;
    private Space mockSpace;

    @BeforeEach
    void setUp() {
        mockUser = User.builder().id(1L).name("User Test").email("user@test.com").build();
        mockSpace = Space.builder().id(1L).name("Aula 101").build();
        
        Set<Space> spaces = new HashSet<>();
        spaces.add(mockSpace);

        mockReservation = Reservation.builder()
                .id(10L)
                .user(mockUser)
                .spaces(spaces)
                .title("Clase de Test")
                .build();
    }

    /**
     * Verifica que al crearse una nueva reserva (acción CREATE), el listener envíe una notificación
     * de confirmación al usuario solicitante y otra notificación al administrador (o gestor autorizado)
     * informándole de la nueva solicitud pendiente.
     */
    @Test
    @DisplayName("📧 handleReservationEvent (CREATE): Notifica al usuario y administradores")
    void handleReservationEvent_Create() {
        User admin = User.builder().id(2L).name("Admin").build();
        ReservationEvent event = new ReservationEvent(this, mockReservation, ReservationEvent.ReservationAction.CREATE);

        when(userRepository.findAll()).thenReturn(List.of(mockUser, admin));
        when(securityService.hasPermission(any(User.class), eq("APROBAR_RESERVA"))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            return u.getId().equals(2L);
        });

        reservationEventListener.handleReservationEvent(event);

        // Notificación al usuario
        verify(notificationService).createNotification(
                eq(mockUser), 
                contains("Solicitud recibida"), 
                eq("RESERVA_CREADA"), 
                anyString(), 
                eq(10L)
        );

        // Notificación al admin
        verify(notificationService).createNotification(
                eq(admin), 
                contains("Nueva solicitud"), 
                eq("SISTEMA"), 
                anyString(), 
                eq(10L)
        );
    }

    /**
     * Verifica que al modificarse los datos de una reserva (acción UPDATE), el listener notifique
     * exclusivamente al usuario propietario sobre los cambios realizados.
     */
    @Test
    @DisplayName("📧 handleReservationEvent (UPDATE): Notifica al usuario")
    void handleReservationEvent_Update() {
        ReservationEvent event = new ReservationEvent(this, mockReservation, ReservationEvent.ReservationAction.UPDATE);

        reservationEventListener.handleReservationEvent(event);

        verify(notificationService).createNotification(
                eq(mockUser), 
                contains("Reserva actualizada"), 
                eq("RESERVA_ACTUALIZADA"), 
                anyString(), 
                eq(10L)
        );
    }

    /**
     * Verifica que ante un cambio de estado a APROBADA (acción STATUS_CHANGE), el sistema envíe
     * de forma automática una notificación de confirmación al propietario de la reserva.
     */
    @Test
    @DisplayName("📧 handleReservationEvent (STATUS_CHANGE - APPROVED): Notifica aprobación")
    void handleReservationEvent_StatusChange_Approved() {
        mockReservation.setStatus(ReservationStatus.APROBADA);
        ReservationEvent event = new ReservationEvent(this, mockReservation, ReservationEvent.ReservationAction.STATUS_CHANGE);

        reservationEventListener.handleReservationEvent(event);

        verify(notificationService).createNotification(
                eq(mockUser), 
                contains("Reserva aprobada"), 
                eq("RESERVA_APROBADA"), 
                anyString(), 
                eq(10L)
        );
    }

    /**
     * Verifica que ante un cambio de estado a RECHAZADA (acción STATUS_CHANGE), el sistema notifique
     * al propietario de la reserva, incluyendo explícitamente el motivo del rechazo en el cuerpo del mensaje.
     */
    @Test
    @DisplayName("📧 handleReservationEvent (STATUS_CHANGE - REJECTED): Notifica rechazo con motivo")
    void handleReservationEvent_StatusChange_Rejected() {
        mockReservation.setStatus(ReservationStatus.RECHAZADA);
        mockReservation.setRejectionReason("Espacio ocupado");
        ReservationEvent event = new ReservationEvent(this, mockReservation, ReservationEvent.ReservationAction.STATUS_CHANGE);

        reservationEventListener.handleReservationEvent(event);

        verify(notificationService).createNotification(
                eq(mockUser), 
                contains("Reserva rechazada"), 
                eq("RESERVA_RECHAZADA"), 
                anyString(), 
                eq(10L)
        );
        verify(notificationService).createNotification(
                any(), 
                contains("Motivo: Espacio ocupado"), 
                anyString(), 
                anyString(), 
                anyLong()
        );
    }

    /**
     * Verifica que al cancelarse una reserva (acción CANCEL), el sistema notifique al propietario
     * informando sobre la anulación de la misma.
     */
    @Test
    @DisplayName("📧 handleReservationEvent (CANCEL): Notifica cancelación")
    void handleReservationEvent_Cancel() {
        ReservationEvent event = new ReservationEvent(this, mockReservation, ReservationEvent.ReservationAction.CANCEL);

        reservationEventListener.handleReservationEvent(event);

        verify(notificationService).createNotification(
                eq(mockUser), 
                contains("Reserva cancelada"), 
                eq("RESERVA_CANCELADA"), 
                anyString(), 
                eq(10L)
        );
    }
}
