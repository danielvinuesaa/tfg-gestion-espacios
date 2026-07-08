package com.tfg.backend.modules.notification.service;

import com.tfg.backend.core.security.SecurityService;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.repository.UserRepository;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.space.model.Space;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Suite de pruebas unitarias para el servicio de programación de recordatorios (ReminderScheduler).
 * Verifica la lógica de envío de notificaciones automáticas para reservas próximas y alertas
 * para solicitudes pendientes de aprobación que han excedido el tiempo de espera.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Unitarios de ReminderScheduler")
class ReminderSchedulerTest {

    @Mock private ReservationRepository reservationRepository;
    @Mock private NotificationService notificationService;
    @Mock private UserRepository userRepository;
    @Mock private SecurityService securityService;

    @InjectMocks
    private ReminderScheduler reminderScheduler;

    private User mockUser;
    private Reservation mockReservation;

    @BeforeEach
    void setUp() {
        mockUser = User.builder().id(1L).name("User Test").email("user@test.com").build();
        
        Space space = Space.builder().id(1L).name("Aula 101").build();
        Set<Space> spaces = new HashSet<>();
        spaces.add(space);

        mockReservation = Reservation.builder()
                .id(10L)
                .user(mockUser)
                .spaces(spaces)
                .startTime(LocalDateTime.now().plusMinutes(30))
                .status(ReservationStatus.APROBADA)
                .reminderSent(false)
                .build();
    }

    /**
     * Verifica que se envíen recordatorios a los usuarios correspondientes para las reservas que están a punto de comenzar.
     * Precondiciones: Existe una reserva aprobada cuyo tiempo de inicio está dentro del margen configurado y que aún no tiene recordatorio enviado.
     * Ejecución: Se ejecuta la tarea programada sendReservationReminders.
     * Aserciones: Se llama al servicio de notificaciones con el mensaje correcto y la reserva se actualiza para marcar el recordatorio como enviado.
     */
    @Test
    @DisplayName("⏰ sendReservationReminders: Debe enviar recordatorios para reservas próximas")
    void sendReservationReminders_Success() {
        when(reservationRepository.findByStatusAndStartTimeBetweenAndReminderSentFalse(
                eq(ReservationStatus.APROBADA), any(), any()))
                .thenReturn(List.of(mockReservation));

        reminderScheduler.sendReservationReminders();

        verify(notificationService).createNotification(
                eq(mockUser), 
                contains("Aula 101"), 
                eq("RECORDATORIO"), 
                anyString()
        );
        verify(reservationRepository).save(mockReservation);
        assert(mockReservation.isReminderSent());
    }

    /**
     * Verifica que se notifique a los gestores o administradores cuando una reserva lleva demasiado tiempo pendiente de aprobación.
     * Precondiciones: Hay una reserva en estado SOLICITADA que supera el tiempo máximo sin aprobarse. Existe un usuario con capacidad para aprobarla.
     * Ejecución: Se ejecuta la tarea programada sendPendingApprovalReminders.
     * Aserciones: El gestor recibe una notificación de tipo RECORDATORIO_APROBACION y la reserva se actualiza para evitar correos duplicados.
     */
    @Test
    @DisplayName("⏰ sendPendingApprovalReminders: Debe avisar a gestores sobre solicitudes estancadas")
    void sendPendingApprovalReminders_Success() {
        User approver = User.builder().id(2L).name("Approver").email("admin@test.com").build();
        
        mockReservation.setStatus(ReservationStatus.SOLICITADA);
        mockReservation.setApprovalReminderSent(false);

        when(reservationRepository.findPendingForApprovalReminder(eq(ReservationStatus.SOLICITADA), any()))
                .thenReturn(List.of(mockReservation));
        when(userRepository.findAll()).thenReturn(List.of(mockUser, approver));
        
        // Mock permissions using any(User.class) to avoid potential instance mismatch issues
        when(securityService.hasPermission(any(User.class), eq("APROBAR_RESERVA"))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            return u.getId().equals(2L);
        });
        when(securityService.canUserApproveReservation(any(User.class), any())).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            return u.getId().equals(2L);
        });

        reminderScheduler.sendPendingApprovalReminders();

        verify(notificationService).createNotification(
                eq(approver), 
                contains("lleva pendiente más de 48h"), 
                eq("RECORDATORIO_APROBACION"), 
                anyString(),
                eq(mockReservation.getId())
        );
        verify(reservationRepository).save(mockReservation);
        assert(mockReservation.isApprovalReminderSent());
    }

    /**
     * Verifica que no se envíen recordatorios de aprobación a usuarios que no tienen permiso real sobre la reserva específica,
     * incluso si tienen un rol de gestión genérico.
     * Precondiciones: Hay una reserva pendiente, pero el usuario evaluado no pasa la validación específica del servicio de seguridad.
     * Ejecución: Se ejecuta la tarea programada sendPendingApprovalReminders.
     * Aserciones: El servicio de notificaciones nunca es llamado.
     */
    @Test
    @DisplayName("⏰ sendPendingApprovalReminders: No debe notificar si no hay permisos reales")
    void sendPendingApprovalReminders_NoPermissions() {
        User potentialApprover = User.builder().id(2L).name("User No Perms").build();
        
        mockReservation.setStatus(ReservationStatus.SOLICITADA);

        when(reservationRepository.findPendingForApprovalReminder(any(), any())).thenReturn(List.of(mockReservation));
        when(userRepository.findAll()).thenReturn(List.of(potentialApprover));
        when(securityService.hasPermission(any(), anyString())).thenReturn(true);
        when(securityService.canUserApproveReservation(any(), any())).thenReturn(false); // No tiene permiso para ESTA reserva

        reminderScheduler.sendPendingApprovalReminders();

        verify(notificationService, never()).createNotification(any(), any(), any(), any(), any());
    }
}
