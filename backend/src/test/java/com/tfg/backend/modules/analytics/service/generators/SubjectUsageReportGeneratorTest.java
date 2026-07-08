package com.tfg.backend.modules.analytics.service.generators;

import com.tfg.backend.modules.reservation.dto.SubjectUsageRequest;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.reservation.model.ReservationType;
import com.tfg.backend.modules.reservation.model.Subject;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.reservation.repository.SubjectRepository;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.identity.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import java.io.ByteArrayInputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Suite de pruebas unitarias para el generador de reportes de uso por asignatura {@link SubjectUsageReportGenerator}.
 * <p>
 * Verifica la correcta generación de documentos PDF y CSV que detallan la
 * utilización de espacios vinculada a diferentes asignaturas.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Unitarios de SubjectUsageReportGenerator")
class SubjectUsageReportGeneratorTest {

    @Mock
    private SubjectRepository subjectRepository;
    @Mock
    private ReservationRepository reservationRepository;

    private SubjectUsageReportGenerator generator;

    @BeforeEach
    void setUp() {
        generator = new SubjectUsageReportGenerator(subjectRepository, reservationRepository);
    }

    /**
     * Verifica que la generación del reporte en formato PDF se ejecute
     * exitosamente, construyendo un documento válido con datos cuando
     * hay asignaturas y reservas presentes.
     */
    @Test
    @DisplayName("🧪 generatePDF: Genera un documento con datos")
    void generatePDF_Success() {
        Subject s1 = Subject.builder().id(1L).code("GSI").name("Software Design").course("2025/26").build();
        User user = User.builder().name("Profe").build();
        Space space = Space.builder().name("AULA 101").build();
        
        Reservation r1 = Reservation.builder()
                .id(100L)
                .title("Clase 1")
                .startTime(LocalDateTime.now().plusDays(1).withHour(10).withMinute(0))
                .endTime(LocalDateTime.now().plusDays(1).withHour(12).withMinute(0))
                .type(ReservationType.CLASE)
                .status(ReservationStatus.APROBADA)
                .subject(s1)
                .user(user)
                .responsibleName("Profe")
                .spaces(Set.of(space))
                .build();

        SubjectUsageRequest request = new SubjectUsageRequest();
        request.setSubjectIds(List.of(1L));
        request.setStartDate(LocalDate.now());
        request.setEndDate(LocalDate.now().plusDays(7));
        request.setReservationTypes(List.of(ReservationType.CLASE));

        when(subjectRepository.findAllById(any())).thenReturn(List.of(s1));
        when(reservationRepository.findAll(any(Specification.class))).thenReturn(List.of(r1));

        ByteArrayInputStream result = generator.generatePDF(request);

        assertNotNull(result);
        assertTrue(result.available() > 0);
    }

    /**
     * Verifica que la generación del reporte en formato CSV incluya correctamente
     * las columnas requeridas (asignatura, espacio, tipo, responsable) con sus
     * valores correspondientes.
     */
    @Test
    @DisplayName("🧪 generateCSV: Formato correcto de columnas")
    void generateCSV_Success() {
        Subject s1 = Subject.builder().id(1L).code("GSI").name("Software Design").course("2025/26").build();
        Space space = Space.builder().name("AULA 101").build();
        Reservation r1 = Reservation.builder()
                .subject(s1)
                .type(ReservationType.CLASE)
                .startTime(LocalDateTime.now().plusDays(1))
                .endTime(LocalDateTime.now().plusDays(1).plusHours(2))
                .spaces(Set.of(space))
                .responsibleName("Profe")
                .build();

        SubjectUsageRequest request = new SubjectUsageRequest();
        request.setSubjectIds(List.of(1L));
        request.setStartDate(LocalDate.now());
        request.setEndDate(LocalDate.now().plusDays(7));

        when(reservationRepository.findAll(any(Specification.class))).thenReturn(List.of(r1));

        String csv = generator.generateCSV(request);

        assertNotNull(csv);
        assertTrue(csv.contains("Software Design"));
        assertTrue(csv.contains("AULA 101"));
        assertTrue(csv.contains("CLASE"));
        assertTrue(csv.contains("Profe"));
    }
}
