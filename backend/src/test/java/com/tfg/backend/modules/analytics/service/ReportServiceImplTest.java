package com.tfg.backend.modules.analytics.service;

import com.tfg.backend.modules.analytics.service.generators.OccupancyReportGenerator;
import com.tfg.backend.modules.analytics.service.generators.SignatureReportGenerator;
import com.tfg.backend.modules.analytics.service.generators.SubjectUsageReportGenerator;
import com.tfg.backend.modules.reservation.dto.ReservationDTO;
import com.tfg.backend.modules.reservation.mapper.ReservationMapper;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.reservation.model.Subject;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.space.model.Space;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Suite de pruebas unitarias para el servicio de reportes (ReportServiceImpl).
 * Verifica la lógica de filtrado de reservas aprobadas, identificación de espacios libres
 * y obtención de reservas por asignatura para la generación de informes.
 */
@ExtendWith(MockitoExtension.class)
class ReportServiceImplTest {

    @Mock
    private ReservationRepository reservationRepository;
    @Mock
    private SignatureReportGenerator signatureReportGenerator;
    @Mock
    private SubjectUsageReportGenerator subjectUsageReportGenerator;
    @Mock
    private OccupancyReportGenerator occupancyReportGenerator;
    @Mock
    private ReservationMapper reservationMapper;

    @InjectMocks
    private ReportServiceImpl reportService;

    private Reservation r1;
    private Reservation r2;
    private Space s1;
    private Subject sub1;

    @BeforeEach
    void setUp() {
        s1 = Space.builder().id(1L).name("S1").build();
        sub1 = Subject.builder().id(1L).code("SUB1").build();
        
        r1 = Reservation.builder()
                .id(1L)
                .status(ReservationStatus.APROBADA)
                .startTime(LocalDateTime.now().plusHours(1))
                .endTime(LocalDateTime.now().plusHours(2))
                .spaces(Collections.singleton(s1))
                .subject(sub1)
                .build();

        r2 = Reservation.builder()
                .id(2L)
                .status(ReservationStatus.SOLICITADA)
                .startTime(LocalDateTime.now().plusHours(3))
                .endTime(LocalDateTime.now().plusHours(4))
                .spaces(Collections.singleton(s1))
                .build();
    }

    /**
     * Verifica que el servicio filtre y devuelva únicamente las reservas que estén en estado "APROBADA",
     * pertenezcan a los espacios solicitados y se encuentren dentro del rango de fechas.
     */
    @Test
    void getApprovedReservationsForSpaces_ShouldFilterCorrectly() {
        // Arrange
        when(reservationRepository.findAll()).thenReturn(Arrays.asList(r1, r2));
        LocalDateTime start = LocalDateTime.now();
        LocalDateTime end = LocalDateTime.now().plusDays(1);

        // Act
        List<Reservation> results = reportService.getApprovedReservationsForSpaces(List.of(1L), start, end);

        // Assert
        assertEquals(1, results.size());
        assertEquals(1L, results.get(0).getId());
    }

    /**
     * Verifica que el servicio identifique correctamente los IDs de los espacios que no tienen
     * ninguna reserva aprobada en el rango de fechas especificado.
     */
    @Test
    void getEmptySpaceIds_ShouldIdentifyFreeSpaces() {
        // Arrange
        Space s2 = Space.builder().id(2L).name("S2").build();
        when(reservationRepository.findAll()).thenReturn(List.of(r1));
        LocalDateTime start = LocalDateTime.now();
        LocalDateTime end = LocalDateTime.now().plusDays(1);

        // Act
        List<Long> emptyIds = reportService.getEmptySpaceIds(List.of(1L, 2L), start, end);

        // Assert
        assertEquals(1, emptyIds.size());
        assertEquals(2L, emptyIds.get(0));
    }

    /**
     * Verifica que el servicio filtre las reservas aprobadas correspondientes a una asignatura específica
     * dentro de un rango de fechas y las mapee correctamente a DTOs.
     */
    @Test
    void getApprovedReservationsBySubject_ShouldFilterCorrectly() {
        // Arrange
        when(reservationRepository.findAll()).thenReturn(List.of(r1));
        when(reservationMapper.toDto(any(Reservation.class))).thenAnswer(inv -> {
            Reservation r = inv.getArgument(0);
            return ReservationDTO.builder().id(r.getId()).title(r.getTitle()).build();
        });
        
        LocalDateTime start = LocalDateTime.now();
        LocalDateTime end = LocalDateTime.now().plusDays(1);

        // Act
        List<ReservationDTO> results = reportService.getApprovedReservationsBySubject(1L, start, end);

        // Assert
        assertEquals(1, results.size());
        assertEquals(1L, results.get(0).getId());
    }
}
