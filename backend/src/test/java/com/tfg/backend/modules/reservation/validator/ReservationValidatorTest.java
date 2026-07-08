package com.tfg.backend.modules.reservation.validator;

import com.tfg.backend.core.config.AppProperties;
import com.tfg.backend.core.exception.BusinessValidationException;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.core.security.SecurityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.HashSet;
import com.tfg.backend.modules.identity.model.User;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

/**
 * Suite de pruebas unitarias exhaustivas para la validación de reservas {@link ReservationValidator}.
 * Verifica las reglas de negocio sobre horarios permitidos, prevención de solapamientos,
 * permisos de aprobación y estados en los que una reserva puede ser editada.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Unitarios de Validación de Reservas (Exhaustivos)")
class ReservationValidatorTest {

    @Mock private ReservationRepository reservationRepository;
    @Mock private SecurityService securityService;

    @Spy
    private AppProperties appProperties = new AppProperties();

    @InjectMocks
    private ReservationValidator reservationValidator;

    @BeforeEach
    void setUp() {
        appProperties.getTime().setStartHour(8);
        appProperties.getTime().setEndHour(21);
        appProperties.getTime().setMinuteStep(30);
    }

    // --- 1. validateTimeRange ---

    /**
     * Verifica que un rango de tiempo válido dentro del horario operativo y con duración
     * permitida sea aceptado sin lanzar excepciones.
     */
    @Test
    @DisplayName("✅ validateTimeRange: Éxito con rango válido")
    void validateTimeRange_Success() {
        LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0);
        LocalDateTime end = LocalDateTime.now().plusDays(1).withHour(12).withMinute(0);
        assertDoesNotThrow(() -> reservationValidator.validateTimeRange(start, end, false));
    }

    /**
     * Verifica que el sistema rechace una reserva cuyo rango de tiempo se encuentre en el pasado.
     * 
     * @throws BusinessValidationException si la fecha de inicio es anterior a la actual.
     */
    @Test
    @DisplayName("❌ validateTimeRange: Fallo si es en el pasado")
    void validateTimeRange_Past_Fail() {
        LocalDateTime start = LocalDateTime.now().minusHours(1);
        LocalDateTime end = LocalDateTime.now().plusHours(1);
        assertThrows(BusinessValidationException.class, () -> reservationValidator.validateTimeRange(start, end, false));
    }

    /**
     * Verifica que el sistema rechace una reserva normal (no bloqueo) si su duración excede
     * el límite máximo permitido de 24 horas.
     * 
     * @throws BusinessValidationException si la duración supera las 24 horas.
     */
    @Test
    @DisplayName("❌ validateTimeRange: Fallo si duración > 24h en reserva normal")
    void validateTimeRange_TooLong_Fail() {
        LocalDateTime start = LocalDateTime.now().plusDays(1);
        LocalDateTime end = LocalDateTime.now().plusDays(3);
        assertThrows(BusinessValidationException.class, () -> reservationValidator.validateTimeRange(start, end, false));
    }

    /**
     * Verifica que un bloqueo administrativo pueda exceder el límite de 24 horas y
     * sea aceptado correctamente por el sistema.
     */
    @Test
    @DisplayName("✅ validateTimeRange: Éxito si duración > 24h en bloqueo administrativo")
    void validateTimeRange_LongBlock_Success() {
        LocalDateTime start = LocalDateTime.now().plusDays(1).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime end = start.plusDays(4); // 4 días de bloqueo
        assertDoesNotThrow(() -> reservationValidator.validateTimeRange(start, end, true));
    }

    /**
     * Verifica que el sistema rechace una reserva normal si su horario se encuentra fuera
     * de las horas operativas establecidas.
     * 
     * @throws BusinessValidationException si el rango de tiempo no está dentro del horario operativo.
     */
    @Test
    @DisplayName("❌ validateTimeRange: Fallo fuera de horario operativo en reserva normal")
    void validateTimeRange_OutsideHours_Fail() {
        LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(22).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime end = start.plusHours(1);
        assertThrows(BusinessValidationException.class, () -> reservationValidator.validateTimeRange(start, end, false));
    }

    /**
     * Verifica que un bloqueo administrativo sea aceptado incluso si su horario se encuentra
     * fuera de las horas operativas normales del recinto.
     */
    @Test
    @DisplayName("✅ validateTimeRange: Éxito fuera de horario operativo en bloqueo administrativo")
    void validateTimeRange_OutsideHoursBlock_Success() {
        LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(2).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime end = start.plusHours(3);
        assertDoesNotThrow(() -> reservationValidator.validateTimeRange(start, end, true));
    }

    /**
     * Verifica que el sistema rechace reservas cuyos minutos de inicio o fin no sean
     * múltiplos del paso temporal configurado.
     * 
     * @throws BusinessValidationException si los minutos no son múltiplo de la configuración.
     */
    @Test
    @DisplayName("❌ validateTimeRange: Fallo si minutos no son múltiplos de 30")
    void validateTimeRange_InvalidMinutes_Fail() {
        LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(15);
        LocalDateTime end = LocalDateTime.now().plusDays(1).withHour(11).withMinute(0);
        assertThrows(BusinessValidationException.class, () -> reservationValidator.validateTimeRange(start, end, false));
    }

    // --- 2. validateOverlaps ---

    /**
     * Verifica que el sistema rechace una reserva si los espacios solicitados ya están
     * ocupados en el rango de tiempo especificado.
     * 
     * @throws BusinessValidationException si existe colisión con otra reserva.
     */
    @Test
    @DisplayName("❌ validateOverlaps: Detecta colisión")
    void validateOverlaps_Collision() {
        LocalDateTime start = LocalDateTime.now().plusDays(1);
        LocalDateTime end = start.plusHours(1);
        
        when(reservationRepository.findOverlappingReservations(anyLong(), any(), any()))
            .thenReturn(List.of(Reservation.builder().title("Ocupado").build()));

        assertThrows(BusinessValidationException.class, 
            () -> reservationValidator.validateOverlaps(List.of(1L), start, end, null, false));
    }

    /**
     * Verifica que un bloqueo administrativo pueda crearse solapando reservas normales
     * preexistentes, ya que los bloqueos tienen prioridad e invalidan las reservas subyacentes.
     */
    @Test
    @DisplayName("⚠️ validateOverlaps: Bloqueo administrativo permite solapar con reservas normales")
    void validateOverlaps_BlockAllowsOverlapWithNormal() {
        LocalDateTime start = LocalDateTime.now().plusDays(1);
        LocalDateTime end = start.plusHours(1);
        
        Reservation normal = Reservation.builder().title("Normal").status(ReservationStatus.APROBADA).build();
        when(reservationRepository.findOverlappingReservations(anyLong(), any(), any()))
            .thenReturn(List.of(normal));

        // Un bloqueo (true) puede solapar con reservas normales (isBlock=true)
        assertDoesNotThrow(() -> reservationValidator.validateOverlaps(List.of(1L), start, end, null, true));
    }

    /**
     * Verifica que el sistema rechace la creación de un bloqueo si ya existe otro bloqueo
     * administrativo en el mismo espacio y periodo.
     * 
     * @throws BusinessValidationException si solapa con otro bloqueo.
     */
    @Test
    @DisplayName("❌ validateOverlaps: Bloqueo NO permite solapar con otro Bloqueo")
    void validateOverlaps_BlockCollisionFail() {
        LocalDateTime start = LocalDateTime.now().plusDays(1);
        LocalDateTime end = start.plusHours(1);
        
        Reservation otherBlock = Reservation.builder().title("Otro Bloqueo").status(ReservationStatus.BLOQUEO).build();
        when(reservationRepository.findOverlappingReservations(anyLong(), any(), any()))
            .thenReturn(List.of(otherBlock));

        assertThrows(BusinessValidationException.class, 
            () -> reservationValidator.validateOverlaps(List.of(1L), start, end, null, true));
    }

    /**
     * Verifica que el sistema rechace la validación si las fechas de inicio o fin son nulas.
     * 
     * @throws BusinessValidationException si faltan datos obligatorios de fecha.
     */
    @Test
    @DisplayName("❌ validateTimeRange: Fallo con fechas nulas")
    void validateTimeRange_NullDates_Fail() {
        assertThrows(BusinessValidationException.class, () -> reservationValidator.validateTimeRange(null, null, false));
    }

    /**
     * Verifica que el sistema rechace una reserva cuya fecha de fin sea anterior o igual
     * a su fecha de inicio.
     * 
     * @throws BusinessValidationException si el rango temporal es ilógico.
     */
    @Test
    @DisplayName("❌ validateTimeRange: Fallo si fin no es posterior a inicio")
    void validateTimeRange_EndBeforeStart_Fail() {
        LocalDateTime start = LocalDateTime.now().plusDays(1);
        LocalDateTime end = start.minusHours(1);
        assertThrows(BusinessValidationException.class, () -> reservationValidator.validateTimeRange(start, end, false));
    }

    /**
     * Verifica que el sistema rechace una reserva cuyo fin exceda el minuto exacto
     * de cierre operativo.
     * 
     * @throws BusinessValidationException si supera el límite de cierre.
     */
    @Test
    @DisplayName("❌ validateTimeRange: Fallo fin en límite exacto de horario con minutos")
    void validateTimeRange_EndAtLimitWithMinutes_Fail() {
        LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0);
        LocalDateTime end = LocalDateTime.now().plusDays(1).withHour(21).withMinute(30);
        assertThrows(BusinessValidationException.class, () -> reservationValidator.validateTimeRange(start, end, false));
    }

    // --- 2. validateOverlaps ---

    /**
     * Verifica que durante una edición de reserva, el sistema evalúe colisiones ignorando
     * la propia reserva que se está modificando.
     * 
     * @throws BusinessValidationException si hay colisiones con otras reservas distintas.
     */
    @Test
    @DisplayName("❌ validateOverlaps: Detecta colisión excluyendo ID")
    void validateOverlaps_CollisionExcludingId() {
        LocalDateTime start = LocalDateTime.now().plusDays(1);
        LocalDateTime end = start.plusHours(1);
        
        when(reservationRepository.findOverlappingReservationsExcludingId(anyLong(), any(), any(), anyLong()))
            .thenReturn(List.of(Reservation.builder().title("Ocupado").build()));

        assertThrows(BusinessValidationException.class, 
            () -> reservationValidator.validateOverlaps(List.of(1L), start, end, 100L, false));
    }

    // --- 3. validateApprovalPermissions ---

    /**
     * Verifica que se permita aprobar una reserva cuando el usuario tiene los permisos
     * correspondientes para dicho espacio y operación.
     */
    @Test
    @DisplayName("✅ validateApprovalPermissions: Éxito")
    void validateApprovalPermissions_Success() {
        Reservation res = Reservation.builder().id(1L).startTime(LocalDateTime.now().plusDays(1)).build();
        when(securityService.canApproveReservation(1L)).thenReturn(true);
        assertDoesNotThrow(() -> reservationValidator.validateApprovalPermissions(null, res));
    }

    /**
     * Verifica que se deniegue la aprobación de una reserva cuando el usuario no cuenta
     * con permisos suficientes, lanzando una excepción.
     * 
     * @throws BusinessValidationException si falta permiso de aprobación.
     */
    @Test
    @DisplayName("❌ validateApprovalPermissions: Sin permiso")
    void validateApprovalPermissions_NoPermission() {
        Reservation res = Reservation.builder().id(1L).startTime(LocalDateTime.now().plusDays(1)).build();
        when(securityService.canApproveReservation(1L)).thenReturn(false);
        assertThrows(BusinessValidationException.class, () -> reservationValidator.validateApprovalPermissions(null, res));
    }

    /**
     * Verifica que no se pueda aprobar una reserva cuya fecha de inicio ya ha pasado,
     * incluso si el usuario posee permisos.
     * 
     * @throws BusinessValidationException si la reserva ya caducó.
     */
    @Test
    @DisplayName("❌ validateApprovalPermissions: Reserva caducada")
    void validateApprovalPermissions_Expired() {
        Reservation res = Reservation.builder().id(1L).startTime(LocalDateTime.now().minusDays(1)).build();
        when(securityService.canApproveReservation(1L)).thenReturn(true);
        assertThrows(BusinessValidationException.class, () -> reservationValidator.validateApprovalPermissions(null, res));
    }

    // --- 4. validateEditableState ---

    /**
     * Verifica que el sistema impida modificar cualquier reserva cuya fecha de inicio
     * ya esté en el pasado.
     * 
     * @throws BusinessValidationException si se intenta editar una reserva expirada.
     */
    @Test
    @DisplayName("❌ validateEditableState: Bloquea edición de reserva pasada")
    void validateEditableState_Past_Fail() {
        Reservation res = Reservation.builder()
                .status(ReservationStatus.APROBADA)
                .startTime(LocalDateTime.now().minusHours(1))
                .build();
        assertThrows(BusinessValidationException.class, () -> reservationValidator.validateEditableState(res));
    }
    // --- PU-RVAL2-11: validateOverlaps excluye la propia reserva (edición) ---
    /**
     * Verifica que, al comprobar solapamientos, el validador omita la reserva indicada
     * por su ID, permitiendo así su propia modificación sin generar falsos positivos.
     */
    @Test
    @DisplayName("✅ PU-RVAL2-11: validateOverlaps excluye correctamente la ID pasada como exclusión")
    void validateOverlaps_ExcludesOwnId() {
        Reservation self = Reservation.builder()
                .id(1L).status(ReservationStatus.APROBADA)
                .spaces(new HashSet<>()).build();
        when(reservationRepository.findOverlappingReservationsExcludingId(any(), any(), any(), any()))
                .thenReturn(java.util.Collections.emptyList());

        assertDoesNotThrow(() -> reservationValidator.validateOverlaps(
                List.of(10L), LocalDateTime.now().plusHours(1), LocalDateTime.now().plusHours(2), 1L, false));
    }

    // --- PU-RVAL2-12: Dos bloques no pueden solaparse entre sí ---
    /**
     * Verifica que el sistema no permita la coexistencia de dos bloqueos administrativos
     * solapados en los mismos espacios.
     * 
     * @throws BusinessValidationException si se detecta otro bloqueo activo en el mismo periodo.
     */
    @Test
    @DisplayName("❌ PU-RVAL2-12: Dos bloques que se solapan en los mismos espacios generan excepción")
    void validateOverlaps_TwoBlocksCollide() {
        Reservation existingBlock = Reservation.builder()
                .id(5L).status(ReservationStatus.BLOQUEO)
                .spaces(new HashSet<>()).build();
        when(reservationRepository.findOverlappingReservations(any(), any(), any()))
                .thenReturn(List.of(existingBlock));

        assertThrows(BusinessValidationException.class, () -> reservationValidator.validateOverlaps(
                List.of(10L), LocalDateTime.now().plusHours(1), LocalDateTime.now().plusHours(2), null, true));
    }

    // --- PU-RVAL2-16: validateApprovalPermissions con usuario concreto ---
    /**
     * Verifica que la validación de permisos de aprobación utilizando una instancia de usuario
     * concreta delegue correctamente la comprobación al servicio de seguridad.
     */
    @Test
    @DisplayName("✅ PU-RVAL2-16: validateApprovalPermissions con usuario concreto delega en securityService")
    void validateApprovalPermissions_WithConcreteUser() {
        Reservation res = Reservation.builder().id(1L).startTime(LocalDateTime.now().plusDays(1)).build();
        User approver = User.builder().id(99L).build();
        when(securityService.canApproveReservation(1L)).thenReturn(true);

        assertDoesNotThrow(() -> reservationValidator.validateApprovalPermissions(approver, res));
    }

    // --- PU-RVAL2-19: validateEditableState — CANCELADA bloquea edición ---
    /**
     * Verifica que una reserva en estado CANCELADA sea inmutable y no pueda volver
     * a ser editada bajo ninguna circunstancia.
     * 
     * @throws BusinessValidationException si el estado de la reserva es cancelado.
     */
    @Test
    @DisplayName("❌ PU-RVAL2-19: validateEditableState lanza excepción si la reserva está CANCELADA")
    void validateEditableState_Cancelled_Fail() {
        Reservation cancelled = Reservation.builder()
                .status(ReservationStatus.CANCELADA)
                .startTime(LocalDateTime.now().plusDays(1))
                .build();
        assertThrows(BusinessValidationException.class,
                () -> reservationValidator.validateEditableState(cancelled));
    }

    // --- PU-RVAL2-23: validateEditableState — APROBADA en el futuro es editable ---
    /**
     * Verifica que una reserva que está APROBADA y pertenece al futuro mantenga un estado
     * en el que se permite su modificación.
     */
    @Test
    @DisplayName("✅ PU-RVAL2-23: validateEditableState no lanza excepción si la reserva es APROBADA y futura")
    void validateEditableState_ApprovedFuture_Success() {
        Reservation approved = Reservation.builder()
                .status(ReservationStatus.APROBADA)
                .startTime(LocalDateTime.now().plusDays(1))
                .build();
        assertDoesNotThrow(() -> reservationValidator.validateEditableState(approved));
    }
}
