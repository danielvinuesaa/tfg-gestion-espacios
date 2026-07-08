package com.tfg.backend.modules.analytics.service.generators;

import com.tfg.backend.core.config.AppProperties;
import com.tfg.backend.modules.analytics.dto.OccupancyRequest;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.space.model.SpaceType;
import com.tfg.backend.modules.space.repository.SpaceRepository;
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
 * Suite de pruebas unitarias para el generador de reportes de ocupación {@link OccupancyReportGenerator}.
 * <p>
 * Verifica la correcta generación de informes (PDF y CSV) que muestran el cálculo
 * de los ratios de ocupación de espacios en función de las horas disponibles.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Unitarios de OccupancyReportGenerator")
class OccupancyReportGeneratorTest {

    @Mock
    private SpaceRepository spaceRepository;
    @Mock
    private ReservationRepository reservationRepository;

    private OccupancyReportGenerator generator;
    private AppProperties appProperties;

    @BeforeEach
    void setUp() {
        appProperties = new AppProperties();
        appProperties.getTime().setStartHour(8);
        appProperties.getTime().setEndHour(21);
        
        generator = new OccupancyReportGenerator(spaceRepository, reservationRepository, appProperties);
    }

    /**
     * Verifica que la generación del informe en PDF procese adecuadamente
     * las reservas de los espacios y devuelva un flujo de datos válido
     * para el documento.
     */
    @Test
    @DisplayName("🧪 generatePDF: Cálculo de ratios de ocupación")
    void generatePDF_Success() {
        Space s1 = Space.builder().id(1L).name("S1").type(SpaceType.AULA).build();
        Reservation r1 = Reservation.builder()
                .startTime(LocalDateTime.now().withHour(10).withMinute(0))
                .endTime(LocalDateTime.now().withHour(12).withMinute(0))
                .spaces(Set.of(s1))
                .build();

        OccupancyRequest request = new OccupancyRequest();
        request.setSpaceIds(List.of(1L));
        request.setStartDate(LocalDate.now().minusDays(1));
        request.setEndDate(LocalDate.now().plusDays(1));

        when(spaceRepository.findAllById(any())).thenReturn(List.of(s1));
        when(reservationRepository.findAll(any(Specification.class))).thenReturn(List.of(r1));

        ByteArrayInputStream result = generator.generatePDF(request);

        assertNotNull(result);
        assertTrue(result.available() > 0);
    }

    /**
     * Verifica que la generación del informe en formato CSV produzca un
     * listado estructurado correctamente con los nombres y tipos de espacios solicitados.
     */
    @Test
    @DisplayName("🧪 generateCSV: Listado de ocupación")
    void generateCSV_Success() {
        Space s1 = Space.builder().id(1L).name("S1").type(SpaceType.AULA).build();
        OccupancyRequest request = new OccupancyRequest();
        request.setStartDate(LocalDate.now());
        request.setEndDate(LocalDate.now());

        when(spaceRepository.findAll()).thenReturn(List.of(s1));
        when(reservationRepository.findAll(any(Specification.class))).thenReturn(List.of());

        String csv = generator.generateCSV(request);

        assertNotNull(csv);
        assertTrue(csv.contains("S1"));
        assertTrue(csv.contains("AULA"));
    }
}
