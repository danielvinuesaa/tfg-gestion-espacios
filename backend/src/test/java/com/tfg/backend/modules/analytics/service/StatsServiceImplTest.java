package com.tfg.backend.modules.analytics.service;

import com.tfg.backend.core.security.SecurityService;
import com.tfg.backend.modules.analytics.dto.StatsDTO;
import com.tfg.backend.modules.analytics.model.AuditLog;
import com.tfg.backend.modules.analytics.repository.AuditLogRepository;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.repository.UserRepository;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.space.model.SpaceType;
import com.tfg.backend.modules.space.repository.SpaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import com.tfg.backend.modules.reservation.dto.ReservationDTO;
import com.tfg.backend.modules.reservation.mapper.ReservationMapper;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Suite de pruebas unitarias para el servicio de estadísticas y analíticas {@link StatsServiceImpl}.
 * <p>
 * Verifica el cálculo correcto de métricas, agregaciones, históricos y 
 * la resolución de la actividad reciente, garantizando que se muestren
 * los datos adecuados según el rol y permisos del usuario.
 */
@ExtendWith(MockitoExtension.class)
class StatsServiceImplTest {

    @Mock
    private ReservationRepository reservationRepository;
    @Mock
    private SpaceRepository spaceRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private AuditLogRepository auditLogRepository;
    @Mock
    private SecurityService securityService;
    @Mock
    private ReservationMapper reservationMapper;

    @InjectMocks
    private StatsServiceImpl statsService;

    private User admin;
    private User professor;
    private Space s1;
    private Reservation r1;

    @BeforeEach
    void setUp() {
        admin = User.builder().id(1L).email("admin@uniovi.es").role(Role.builder().name("ADMIN").build()).build();
        professor = User.builder().id(2L).email("prof@uniovi.es").name("Prof").role(Role.builder().name("PROFESOR").build()).build();
        s1 = Space.builder().id(1L).name("A1").type(SpaceType.AULA).totalCapacity(50).build();
        r1 = Reservation.builder()
                .id(1L)
                .title("Test Res")
                .status(ReservationStatus.APROBADA)
                .user(professor)
                .spaces(Collections.singleton(s1))
                .startTime(LocalDateTime.now())
                .endTime(LocalDateTime.now().plusHours(2))
                .build();
    }

    /**
     * Verifica que el cálculo de las estadísticas globales cuente y agrupe
     * correctamente los totales del sistema, la actividad del periodo y
     * genere el desglose semanal.
     */
    @Test
    @SuppressWarnings("unchecked")
    void getGlobalStats_ShouldCalculateCorrectAggregations() {
        // Arrange
        when(spaceRepository.count()).thenReturn(10L);
        when(userRepository.count()).thenReturn(5L);
        when(reservationRepository.count()).thenReturn(100L);
        
        // Mock current and previous reservations
        when(reservationRepository.findAll(any(Specification.class))).thenReturn(List.of(r1));
        when(reservationRepository.count(any(Specification.class))).thenReturn(1L); 
        when(auditLogRepository.findAll(any(PageRequest.class))).thenReturn(new PageImpl<>(Collections.emptyList()));
        when(reservationRepository.findAll(any(Specification.class), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        // Act
        StatsDTO stats = statsService.getGlobalStats(null, null);

        // Assert
        assertNotNull(stats);
        assertEquals(10, stats.getSystemTotals().getTotalSpaces());
        assertEquals(1, stats.getPeriodActivity().getReservationsCount());
        assertEquals(0.0, stats.getPeriodActivity().getReservationsGrowth());
        assertTrue(stats.getPeriodActivity().getReservationsByStatus().containsKey("APROBADA"));
        assertTrue(stats.getPeriodActivity().getReservationsBySpace().containsKey("A1"));
        
        // Verify weekly activity day name (Spanish)
        String day = r1.getStartTime().getDayOfWeek().getDisplayName(java.time.format.TextStyle.FULL, new java.util.Locale("es", "ES"));
        assertTrue(stats.getPeriodActivity().getWeeklyActivity().containsKey(day));
    }

    /**
     * Verifica que el cálculo de crecimiento de un periodo a otro maneje
     * de manera segura los casos límite, como divisiones por cero (cuando
     * los valores previos son nulos).
     */
    @Test
    @DisplayName("📈 calculateGrowth: Casos de borde")
    @SuppressWarnings("unchecked")
    void calculateGrowth_EdgeCases() {
        // Mock minimal for global call
        when(spaceRepository.count()).thenReturn(0L);
        when(userRepository.count()).thenReturn(0L);
        when(reservationRepository.count()).thenReturn(0L);
        when(auditLogRepository.findAll(any(PageRequest.class))).thenReturn(new PageImpl<>(Collections.emptyList()));
        when(reservationRepository.findAll(any(Specification.class), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        // 1. De 0 a 10 -> 100%
        Reservation resWithData = Reservation.builder()
            .user(professor)
            .status(ReservationStatus.APROBADA)
            .startTime(LocalDateTime.now())
            .spaces(Set.of(s1))
            .build();
        when(reservationRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList(resWithData, resWithData));
        when(reservationRepository.count(any(Specification.class))).thenReturn(0L);
        StatsDTO s1Result = statsService.getGlobalStats(null, null);
        assertEquals(100.0, s1Result.getPeriodActivity().getReservationsGrowth());

        // 2. De 10 a 0 -> -100%
        when(reservationRepository.findAll(any(Specification.class))).thenReturn(Collections.emptyList());
        when(reservationRepository.count(any(Specification.class))).thenReturn(10L);
        StatsDTO s2 = statsService.getGlobalStats(null, null);
        assertEquals(-100.0, s2.getPeriodActivity().getReservationsGrowth());
    }

    /**
     * Verifica que la consulta de la actividad reciente resuelva correctamente
     * a los autores a partir del correo registrado en auditoría, o asigne el
     * identificador del sistema si no corresponde a un usuario.
     */
    @Test
    @DisplayName("📝 RecentActivity: Mapeo de autor (Usuario vs Sistema)")
    @SuppressWarnings("unchecked")
    void mapRecentActivity_AuthorResolution() {
        // Arrange
        AuditLog userLog = AuditLog.builder().id(1L).performedBy("prof@uniovi.es").timestamp(LocalDateTime.now()).action("TEST").build();
        AuditLog sysLog = AuditLog.builder().id(2L).performedBy("SYSTEM_BOOT").timestamp(LocalDateTime.now()).action("BOOT").build();
        
        when(auditLogRepository.findAll(any(PageRequest.class))).thenReturn(new PageImpl<>(List.of(userLog, sysLog)));
        when(userRepository.findByEmail("prof@uniovi.es")).thenReturn(Optional.of(professor));
        when(reservationRepository.findAll(any(Specification.class))).thenReturn(Collections.emptyList());
        when(reservationRepository.findAll(any(Specification.class), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        // Act
        StatsDTO stats = statsService.getGlobalStats(null, null);

        // Assert
        assertEquals("Prof (PROFESOR)", stats.getRecentActivity().get(0).getPerformedBy());
        assertEquals("Sistema_BOOT", stats.getRecentActivity().get(1).getPerformedBy());
    }

    /**
     * Verifica que las estadísticas solicitadas por un usuario estándar
     * (profesor) devuelvan estrictamente métricas relacionadas con su
     * propia actividad y no revelen totales globales restringidos.
     */
    @Test
    @SuppressWarnings("unchecked")
    void getUserStats_ShouldCalculateOnlyUserSpecificData() {
        // Arrange
        when(reservationRepository.count(any(Specification.class))).thenReturn(50L); // Historical
        when(reservationRepository.findAll(any(Specification.class))).thenReturn(List.of(r1));
        when(auditLogRepository.findAll(any(Specification.class), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));
        when(reservationRepository.findAll(any(Specification.class), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        // Act
        StatsDTO stats = statsService.getUserStats(professor, null, null);

        // Assert
        assertNotNull(stats);
        assertEquals(50, stats.getSystemTotals().getTotalReservationsHistorical());
        assertEquals(1, stats.getPeriodActivity().getReservationsCount());
        // OccupancyRatio for user is actually approval rate
        assertEquals(100.0, stats.getPeriodActivity().getOccupancyRatio());
    }

    /**
     * Verifica que si un usuario solicita las estadísticas delegadas pero
     * posee rol de administrador, el sistema le retorne los datos globales.
     */
    @Test
    @SuppressWarnings("unchecked")
    void getStatsForUser_WhenAdmin_ShouldReturnGlobal() {
        // Arrange
        when(securityService.isAdmin()).thenReturn(true);
        // Minimal global mocks
        when(spaceRepository.count()).thenReturn(10L);
        when(reservationRepository.findAll(any(Specification.class))).thenReturn(Collections.emptyList());
        when(auditLogRepository.findAll(any(PageRequest.class))).thenReturn(new PageImpl<>(Collections.emptyList()));
        when(reservationRepository.findAll(any(Specification.class), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        // Act
        StatsDTO stats = statsService.getStatsForUser(professor, null, null);

        // Assert
        assertEquals(10, stats.getSystemTotals().getTotalSpaces());
    }
}
