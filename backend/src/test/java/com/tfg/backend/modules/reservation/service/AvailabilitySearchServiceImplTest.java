package com.tfg.backend.modules.reservation.service;

import com.tfg.backend.modules.reservation.dto.AvailabilitySearchRequest;
import com.tfg.backend.modules.reservation.dto.DailyResultsDTO;
import com.tfg.backend.modules.reservation.dto.ReservationProposalDTO;
import com.tfg.backend.core.exception.BusinessValidationException;
import com.tfg.backend.modules.space.dto.SpaceDTO;
import com.tfg.backend.modules.space.mapper.SpaceMapper;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.space.model.SpaceType;
import com.tfg.backend.modules.space.repository.SpaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * Suite de pruebas unitarias para el servicio de búsqueda de disponibilidad de espacios {@link AvailabilitySearchServiceImpl}.
 * Verifica la correcta evaluación de disponibilidades en modos estándar y flexible, el cálculo de propuestas individuales,
 * combinadas y agrupadas según la capacidad requerida, y el cumplimiento de los filtros de tiempo y exclusión de fines de semana.
 */
@ExtendWith(MockitoExtension.class)
class AvailabilitySearchServiceImplTest {

    @Mock
    private SpaceRepository spaceRepository;

    @Mock
    private SpaceMapper spaceMapper;

    @InjectMocks
    private AvailabilitySearchServiceImpl availabilitySearchService;

    private Space s1;
    private Space s2;
    private Space s3;

    @BeforeEach
    void setUp() {
        s1 = Space.builder().id(1L).name("Aula 101").totalCapacity(50).build();
        s2 = Space.builder().id(2L).name("Aula 102").totalCapacity(30).build();
        s3 = Space.builder().id(3L).name("Aula 103").totalCapacity(20).build();

        // Mock del mapper para que convierta entidades a DTOs básicos
        lenient().when(spaceMapper.toDtoList(anyList())).thenAnswer(inv -> {
            List<Space> list = inv.getArgument(0);
            return list.stream().map(s -> SpaceDTO.builder()
                    .id(s.getId())
                    .name(s.getName())
                    .totalCapacity(s.getTotalCapacity())
                    .build()).collect(Collectors.toList());
        });
    }

    /**
     * Verifica que en una búsqueda de disponibilidad estándar (no flexible) donde la capacidad mínima
     * puede ser cubierta por espacios individuales, el sistema retorne propuestas de un solo espacio.
     */
    @Test
    @SuppressWarnings("unchecked")
    void getProposals_NonFlexible_IndividualStrategy() {
        // Arrange
        AvailabilitySearchRequest request = AvailabilitySearchRequest.builder()
                .flexible(false)
                .startTime(LocalDateTime.now().plusDays(1))
                .endTime(LocalDateTime.now().plusDays(1).plusHours(2))
                .minCapacity(40)
                .types(Collections.singletonList(SpaceType.AULA))
                .distributionRatio(1.0)
                .build();

        when(spaceRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Arrays.asList(s1, s2, s3)));

        // Act
        List<ReservationProposalDTO> results = (List<ReservationProposalDTO>) availabilitySearchService.getProposals(request);

        // Assert
        assertNotNull(results);
        assertFalse(results.isEmpty());
        assertEquals("Aula 101", results.get(0).getSpaces().get(0).getName());
        assertEquals(1, results.get(0).getSpaces().size());
        assertTrue(results.get(0).getRecommendationReason().contains("individual"));
    }

    /**
     * Verifica que en una búsqueda estándar donde un solo espacio no cubre la capacidad requerida,
     * el sistema logre combinar espacios para formar propuestas que sí cumplan con el mínimo exigido.
     */
    @Test
    @SuppressWarnings("unchecked")
    void getProposals_NonFlexible_CombinatorialStrategy() {
        // Arrange
        AvailabilitySearchRequest request = AvailabilitySearchRequest.builder()
                .flexible(false)
                .startTime(LocalDateTime.now().plusDays(1))
                .endTime(LocalDateTime.now().plusDays(1).plusHours(2))
                .minCapacity(80) // s1(50) + s2(30) = 80
                .types(Collections.singletonList(SpaceType.AULA))
                .distributionRatio(1.0)
                .build();

        when(spaceRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Arrays.asList(s1, s2, s3)));

        // Act
        List<ReservationProposalDTO> results = (List<ReservationProposalDTO>) availabilitySearchService.getProposals(request);

        // Assert
        // i=0(s1), j=1(s2) -> sum=80 >= 80 and s1<80 and s2<80 -> OK
        assertTrue(results.stream().anyMatch(p -> p.getSpaces().size() == 2));
        assertTrue(results.stream().anyMatch(p -> p.getRecommendationReason().contains("Combinación")));
    }

    /**
     * Verifica que en una búsqueda estándar que requiere gran capacidad, el sistema utilice una
     * estrategia de agrupación masiva (greedy) si la combinación básica de pares no es suficiente.
     */
    @Test
    @SuppressWarnings("unchecked")
    void getProposals_NonFlexible_GreedyStrategy() {
        // Arrange
        AvailabilitySearchRequest request = AvailabilitySearchRequest.builder()
                .flexible(false)
                .startTime(LocalDateTime.now().plusDays(1))
                .endTime(LocalDateTime.now().plusDays(1).plusHours(2))
                .minCapacity(100) // s1(50) + s2(30) + s3(20) = 100
                .types(Collections.singletonList(SpaceType.AULA))
                .distributionRatio(1.0)
                .build();

        when(spaceRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Arrays.asList(s1, s2, s3)));

        // Act
        List<ReservationProposalDTO> results = (List<ReservationProposalDTO>) availabilitySearchService.getProposals(request);

        // Assert
        assertFalse(results.isEmpty());
        assertEquals(3, results.get(0).getSpaces().size());
        assertTrue(results.get(0).getRecommendationReason().contains("Agrupación masiva"));
    }

    /**
     * Verifica que en modo de búsqueda flexible, el sistema retorne resultados agrupados por día y tramo horario,
     * evaluando correctamente la disponibilidad en el rango de fechas e intervalos de tiempo especificados.
     */
    @Test
    @SuppressWarnings("unchecked")
    void getProposals_Flexible_ShouldReturnGroupedResults() {
        // Arrange
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        AvailabilitySearchRequest request = AvailabilitySearchRequest.builder()
                .flexible(true)
                .rangeStart(tomorrow)
                .rangeEnd(tomorrow.plusDays(1))
                .dailyStart(LocalTime.of(9, 0))
                .dailyEnd(LocalTime.of(11, 0))
                .durationHours(1.0)
                .includeWeekends(true)
                .minCapacity(20)
                .types(Collections.singletonList(SpaceType.AULA))
                .build();

        when(spaceRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Arrays.asList(s1, s2, s3)));

        // Act
        List<DailyResultsDTO> results = (List<DailyResultsDTO>) availabilitySearchService.getProposals(request);

        // Assert
        assertNotNull(results);
        assertEquals(2, results.size()); // 2 days
        assertFalse(results.get(0).getTimeSlots().isEmpty());
        // Slot 1: 09:00 - 10:00, Slot 2: 09:30 - 10:30, Slot 3: 10:00 - 11:00
        assertEquals(3, results.get(0).getTimeSlots().size());
    }
    /**
     * Verifica que el sistema procese adecuadamente una búsqueda estándar sin filtros opcionales
     * (sin capacidad mínima, sin tipos de espacio y sin ratio), asegurando que no se produzcan excepciones,
     * especialmente para prevenir regresiones en casos reportados por usuarios.
     */
@Test
@SuppressWarnings("unchecked")
void getProposals_UserReportedCase_StandardMode_NoFilters() {
    // Escenario: 03/06/2026 09:00 - 12:00, sin aforo, sin tipos, sin ratio.
    LocalDateTime start = LocalDateTime.of(2026, 6, 3, 9, 0);
    LocalDateTime end = LocalDateTime.of(2026, 6, 3, 12, 0);

    AvailabilitySearchRequest request = AvailabilitySearchRequest.builder()
            .flexible(false)
            .startTime(start)
            .endTime(end)
            .minCapacity(null)
            .types(null)
            .distributionRatio(null)
            .build();

    // Simulamos que hay espacios en la BD
    when(spaceRepository.findAll(any(Specification.class), any(Pageable.class)))
            .thenReturn(new PageImpl<>(Arrays.asList(s1, s2, s3)));

    // Si esto lanza excepción, habremos capturado el bug
    assertDoesNotThrow(() -> availabilitySearchService.getProposals(request));

    List<ReservationProposalDTO> results = (List<ReservationProposalDTO>) availabilitySearchService.getProposals(request);
    assertNotNull(results);
    // Debería devolver los espacios como propuestas individuales
    assertFalse(results.isEmpty());
}

    /**
     * Verifica que el sistema rechace una petición de búsqueda estándar si el rango horario es inconsistente,
     * es decir, cuando la fecha/hora de fin es anterior a la fecha/hora de inicio.
     */
    @Test
    void getProposals_StandardMode_ChronologicalError_ThrowsException() {
        LocalDateTime now = LocalDateTime.now();
        AvailabilitySearchRequest request = AvailabilitySearchRequest.builder()
                .flexible(false)
                .startTime(now.plusHours(2))
                .endTime(now.plusHours(1))
                .build();

        assertThrows(BusinessValidationException.class, () -> availabilitySearchService.getProposals(request));
    }

    /**
     * Verifica que el sistema lance una excepción de validación en búsquedas flexibles si no se
     * proporcionan las fechas de inicio o fin del rango de búsqueda.
     */
    @Test
    void getProposals_FlexibleMode_NullRange_ThrowsException() {
        AvailabilitySearchRequest request = AvailabilitySearchRequest.builder()
                .flexible(true)
                .rangeStart(null)
                .build();

        assertThrows(BusinessValidationException.class, () -> availabilitySearchService.getProposals(request));
    }

    /**
     * Verifica que el sistema lance una excepción de validación en búsquedas flexibles si no se
     * define correctamente el horario diario (hora de inicio o fin).
     */
    @Test
    void getProposals_FlexibleMode_NullHours_ThrowsException() {
        AvailabilitySearchRequest request = AvailabilitySearchRequest.builder()
                .flexible(true)
                .rangeStart(LocalDate.now())
                .rangeEnd(LocalDate.now().plusDays(1))
                .dailyStart(null)
                .build();

        assertThrows(BusinessValidationException.class, () -> availabilitySearchService.getProposals(request));
    }

    /**
     * Verifica que el sistema retorne una lista vacía de propuestas cuando no existen espacios
     * en la base de datos o ninguno cumple con los filtros especificados.
     */
    @Test
    @SuppressWarnings("unchecked")
    void getProposals_NoSpacesAvailable_ReturnsEmptyList() {
        AvailabilitySearchRequest request = AvailabilitySearchRequest.builder()
                .flexible(false)
                .startTime(LocalDateTime.now().plusDays(1))
                .endTime(LocalDateTime.now().plusDays(1).plusHours(1))
                .minCapacity(10)
                .build();

        when(spaceRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        List<ReservationProposalDTO> results = (List<ReservationProposalDTO>) availabilitySearchService.getProposals(request);
        assertTrue(results.isEmpty());
    }

    /**
     * Verifica que en búsquedas flexibles donde se ha configurado la exclusión de fines de semana,
     * el sistema omita los días sábado y domingo en los resultados generados.
     */
    @Test
    @SuppressWarnings("unchecked")
    void getProposals_Flexible_ExcludeWeekends() {
        // Un rango que incluya un sábado o domingo
        LocalDate friday = LocalDate.of(2026, 6, 5);
        LocalDate sunday = LocalDate.of(2026, 6, 7);
        
        AvailabilitySearchRequest request = AvailabilitySearchRequest.builder()
                .flexible(true)
                .rangeStart(friday)
                .rangeEnd(sunday)
                .dailyStart(LocalTime.of(9, 0))
                .dailyEnd(LocalTime.of(10, 0))
                .durationHours(1.0)
                .includeWeekends(false) // Deshabilitado
                .minCapacity(10)
                .build();

        when(spaceRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(s1)));

        List<DailyResultsDTO> results = (List<DailyResultsDTO>) availabilitySearchService.getProposals(request);

        // Debería tener solo 1 día (el viernes), ignorando sábado y domingo
        assertEquals(1, results.size());
        assertEquals(friday, results.get(0).getDate());
    }

    /**
     * Verifica que el sistema rechace una petición de búsqueda flexible si la fecha final
     * del rango es estrictamente anterior a la fecha inicial.
     */
    @Test
    void getProposals_FlexibleMode_InvalidRange_ThrowsException() {
        AvailabilitySearchRequest request = AvailabilitySearchRequest.builder()
                .flexible(true)
                .rangeStart(LocalDate.now().plusDays(2))
                .rangeEnd(LocalDate.now().plusDays(1))
                .build();

        assertThrows(BusinessValidationException.class, () -> availabilitySearchService.getProposals(request));
    }
}
