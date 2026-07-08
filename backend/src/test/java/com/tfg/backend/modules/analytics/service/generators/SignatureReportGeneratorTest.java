package com.tfg.backend.modules.analytics.service.generators;

import com.tfg.backend.core.config.AppProperties;
import com.tfg.backend.modules.analytics.dto.SignatureLogRequest;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.reservation.model.Subject;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.space.model.SpaceType;
import com.tfg.backend.modules.space.repository.SpaceRepository;
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
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Suite de pruebas unitarias para el generador de partes de firmas {@link SignatureReportGenerator}.
 * <p>
 * Verifica la correcta creación de cuadrantes semanales en PDF y CSV, los cuales
 * son utilizados para el control de asistencia o firmas de los responsables de espacios.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Unitarios de SignatureReportGenerator")
class SignatureReportGeneratorTest {

    @Mock
    private SpaceRepository spaceRepository;
    @Mock
    private ReservationRepository reservationRepository;

    private SignatureReportGenerator generator;
    private AppProperties appProperties;

    @BeforeEach
    void setUp() {
        appProperties = new AppProperties();
        appProperties.getTime().setStartHour(8);
        appProperties.getTime().setEndHour(21);
        
        generator = new SignatureReportGenerator(spaceRepository, reservationRepository, appProperties);
    }

    /**
     * Verifica que el reporte en PDF se genere correctamente, estructurando
     * las reservas en formato de cuadrante semanal a partir de la fecha solicitada.
     */
    @Test
    @DisplayName("🧪 generatePDF: Genera cuadrantes semanales")
    void generatePDF_Success() {
        Space s1 = Space.builder().id(1L).name("AULA 101").type(SpaceType.AULA).build();
        Subject sub = Subject.builder().code("GSI").name("Design").build();
        User user = User.builder().name("Profe").build();
        
        // Lunes 01/06/2026 (Semana que empieza en Lunes)
        LocalDate monday = LocalDate.of(2026, 6, 1);
        
        Reservation r1 = Reservation.builder()
                .id(100L)
                .title("Clase Lunes")
                .startTime(monday.atTime(10, 0))
                .endTime(monday.atTime(12, 0))
                .status(ReservationStatus.APROBADA)
                .spaces(Set.of(s1))
                .subject(sub)
                .user(user)
                .responsibleName("Docente X")
                .build();

        SignatureLogRequest request = new SignatureLogRequest();
        request.setSpaceIds(List.of(1L));
        request.setStartDate(monday);
        request.setEndDate(monday.plusDays(4)); // Una semana (Lun-Vie)

        when(spaceRepository.findAllById(any())).thenReturn(List.of(s1));
        when(reservationRepository.findAll(any(Specification.class))).thenReturn(List.of(r1));

        ByteArrayInputStream result = generator.generatePDF(request);

        assertNotNull(result);
        assertTrue(result.available() > 0);
    }

    /**
     * Verifica que el reporte en CSV de firmas incluya correctamente
     * los datos fundamentales de las reservas, como el espacio y el responsable.
     */
    @Test
    @DisplayName("🧪 generateCSV: Listado de firmas")
    void generateCSV_Success() {
        Space s1 = Space.builder().id(1L).name("AULA 101").build();
        Reservation r1 = Reservation.builder()
                .startTime(LocalDateTime.now().plusDays(1))
                .endTime(LocalDateTime.now().plusDays(1).plusHours(1))
                .spaces(Set.of(s1))
                .responsibleName("Profe")
                .build();

        SignatureLogRequest request = new SignatureLogRequest();
        request.setSpaceIds(List.of(1L));
        request.setStartDate(LocalDate.now());
        request.setEndDate(LocalDate.now().plusDays(7));

        when(reservationRepository.findAll(any(Specification.class))).thenReturn(List.of(r1));

        String csv = generator.generateCSV(request);

        assertNotNull(csv);
        assertTrue(csv.contains("AULA 101"));
        assertTrue(csv.contains("Profe"));
    }
}
