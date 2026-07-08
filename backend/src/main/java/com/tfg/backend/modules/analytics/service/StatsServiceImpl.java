package com.tfg.backend.modules.analytics.service;
import com.tfg.backend.core.security.SecurityService;
import com.tfg.backend.modules.analytics.dto.StatsDTO;
import com.tfg.backend.modules.analytics.dto.RecentActivityDTO;
import com.tfg.backend.modules.analytics.dto.SystemTotals;
import com.tfg.backend.modules.analytics.dto.PeriodActivity;
import com.tfg.backend.modules.analytics.model.AuditLog;
import com.tfg.backend.modules.analytics.repository.AuditLogRepository;
import com.tfg.backend.modules.analytics.repository.AuditLogSpecifications;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.reservation.repository.ReservationSpecifications;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.space.repository.SpaceRepository;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import com.tfg.backend.modules.reservation.mapper.ReservationMapper;

/**
 * Implementación del servicio de analítica y estadísticas del sistema.
 * Consolida la información operativa proveniente de múltiples dominios (reservas, espacios, auditoría)
 * para proporcionar métricas en tiempo real y análisis históricos de tendencias.
 * Está refactorizado para utilizar el motor de Specifications de JPA, lo que optimiza significativamente 
 * el rendimiento al delegar los conteos y filtrados complejos directamente a la base de datos.
 */
@Service
@RequiredArgsConstructor
public class StatsServiceImpl implements StatsService {

    /**
     * Repositorio para la gestión y consulta de reservas.
     */
    private final ReservationRepository reservationRepository;

    /**
     * Repositorio para la consulta de datos estadísticos de espacios.
     */
    private final SpaceRepository spaceRepository;

    /**
     * Repositorio para obtener información de los usuarios registrados.
     */
    private final UserRepository userRepository;

    /**
     * Repositorio para acceder al historial de auditoría del sistema.
     */
    private final AuditLogRepository auditLogRepository;

    /**
     * Servicio de seguridad utilizado para verificar el contexto del usuario actual.
     */
    private final SecurityService securityService;

    /**
     * Componente utilizado para la conversión de reservas entre modelo y DTO.
     */
    private final ReservationMapper reservationMapper;

    /**
     * Obtiene las estadísticas filtradas según el nivel de acceso del usuario proporcionado.
     * Si es administrador, devuelve estadísticas globales; en caso contrario, devuelve las suyas.
     *
     * @param user Usuario que solicita las estadísticas.
     * @param startDate Fecha inicial del periodo de análisis.
     * @param endDate Fecha final del periodo de análisis.
     * @return Objeto DTO que encapsula los datos estadísticos resultantes.
     */
    @Override
    @Transactional(readOnly = true)
    public StatsDTO getStatsForUser(User user, LocalDateTime startDate, LocalDateTime endDate) {
        // Centralización de la lógica de visibilidad: Admins e Informes ven todo
        if (securityService.isAdmin() || securityService.hasPermission("GENERAR_INFORMES")) {
            return getGlobalStats(startDate, endDate);
        }
        // Usuarios normales solo ven lo suyo
        return getUserStats(user, startDate, endDate);
    }

    /**
     * Calcula y retorna el conjunto completo de estadísticas globales de todo el sistema.
     *
     * @param startDate Rango inicial del reporte temporal.
     * @param endDate Rango final del reporte temporal.
     * @return DTO con todas las métricas globales calculadas.
     */
    @Override
    @Transactional(readOnly = true)
    public StatsDTO getGlobalStats(LocalDateTime startDate, LocalDateTime endDate) {
        // Totales globales rápidos
        long totalSpaces = spaceRepository.count();
        long totalUsersCount = userRepository.count();
        long totalReservationsHistorical = reservationRepository.count();

        // Definición de periodos (Actual vs Anterior)
        LocalDateTime currentStart = (startDate != null) ? startDate : LocalDateTime.now().minusDays(30);
        LocalDateTime currentEnd = (endDate != null) ? endDate : LocalDateTime.now();
        Duration duration = Duration.between(currentStart, currentEnd);
        LocalDateTime previousStart = currentStart.minus(duration);
        LocalDateTime previousEnd = currentStart;

        // Recuperación de reservas del periodo actual usando Specifications (Eficiente)
        Specification<Reservation> currentSpec = ReservationSpecifications.withFilters(
                null, null, null, null, null, null, currentStart, currentEnd, null, null, true);
        List<Reservation> currentReservations = reservationRepository.findAll(currentSpec);

        // Conteo del periodo anterior para cálculo de crecimiento
        Specification<Reservation> previousSpec = ReservationSpecifications.withFilters(
                null, null, null, null, null, null, previousStart, previousEnd, null, null, true);
        long previousCount = reservationRepository.count(previousSpec);

        // KPIs de periodo
        long currentCount = currentReservations.size();
        double resGrowth = calculateGrowth(currentCount, previousCount);

        long currentUsers = currentReservations.stream().map(r -> r.getUser().getId()).distinct().count();
        // Para el growth de usuarios, simplificamos o mantenemos lógica similar si es necesario
        long previousUsers = reservationRepository.findAll(previousSpec).stream().map(r -> r.getUser().getId()).distinct().count();
        double usersGrowth = calculateGrowth(currentUsers, previousUsers);

        long spacesUsed = currentReservations.stream()
                .filter(r -> r.getStatus() == ReservationStatus.APROBADA || r.getStatus() == ReservationStatus.BLOQUEO)
                .flatMap(r -> r.getSpaces().stream())
                .map(Space::getId).distinct().count();
        
        double occupancyRatio = totalSpaces > 0 ? (double) spacesUsed / totalSpaces * 100 : 0;

        // Agregaciones para gráficas
        Map<String, Long> byStatus = currentReservations.stream()
                .collect(Collectors.groupingBy(r -> r.getStatus().name(), Collectors.counting()));

        Map<String, Long> bySpace = currentReservations.stream()
                .flatMap(r -> r.getSpaces().stream())
                .collect(Collectors.groupingBy(Space::getName, Collectors.counting()));

        Map<String, Map<String, Long>> byTypeAndStatus = currentReservations.stream()
                .flatMap(r -> r.getSpaces().stream().map(s -> new Object[]{s.getType().name(), r.getStatus().name()}))
                .collect(Collectors.groupingBy(
                    obj -> (String)obj[0],
                    Collectors.groupingBy(obj -> (String)obj[1], Collectors.counting())
                ));

        Map<String, Long> weekly = currentReservations.stream()
                .collect(Collectors.groupingBy(
                    r -> r.getStartTime().getDayOfWeek().getDisplayName(TextStyle.FULL, new Locale("es", "ES")),
                    LinkedHashMap::new,
                    Collectors.counting()
                ));

        // Actividad reciente (Paginada y Ordenada en BD - Mucho más eficiente)
        List<RecentActivityDTO> recent = auditLogRepository.findAll(
                PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "timestamp"))
        ).getContent().stream()
                .map(this::mapToRecentActivity)
                .collect(Collectors.toList());

        // Próximos eventos (Admins ven todos los próximos eventos aprobados o bloqueos)
        Specification<Reservation> upcomingSpec = ReservationSpecifications.withFilters(
                null, null, null, null, null, null, LocalDateTime.now(), null, null, null, true);
        
        // Añadir filtro manual de estados (Aprobada o Bloqueo)
        upcomingSpec = upcomingSpec.and((root, query, cb) -> 
            root.get("status").in(Arrays.asList(ReservationStatus.APROBADA, ReservationStatus.BLOQUEO))
        );

        List<com.tfg.backend.modules.reservation.dto.ReservationDTO> upcoming = reservationRepository.findAll(
                upcomingSpec, 
                PageRequest.of(0, 5, Sort.by(Sort.Direction.ASC, "startTime"))
        ).getContent().stream()
                .map(reservationMapper::toDto)
                .collect(Collectors.toList());

        return StatsDTO.builder()
                .systemTotals(SystemTotals.builder()
                        .totalSpaces(totalSpaces)
                        .totalUsers(totalUsersCount)
                        .totalReservationsHistorical(totalReservationsHistorical)
                        .build())
                .periodActivity(PeriodActivity.builder()
                        .reservationsCount(currentCount)
                        .activeUsersCount(currentUsers)
                        .occupancyRatio(Math.round(occupancyRatio * 10.0) / 10.0)
                        .reservationsGrowth(resGrowth)
                        .usersGrowth(usersGrowth)
                        .reservationsBySpace(bySpace)
                        .reservationsByStatus(byStatus)
                        .occupancyByType(byTypeAndStatus)
                        .weeklyActivity(weekly)
                        .build())
                .recentActivity(recent)
                .upcomingEvents(upcoming)
                .build();
    }

    /**
     * Computa las estadísticas particulares asociadas exclusivamente a un usuario específico.
     *
     * @param user Usuario objetivo del análisis.
     * @param startDate Rango de inicio para métricas periódicas.
     * @param endDate Rango de fin para métricas periódicas.
     * @return DTO con el resumen analítico personal del usuario.
     */
    @Override
    @Transactional(readOnly = true)
    public StatsDTO getUserStats(User user, LocalDateTime startDate, LocalDateTime endDate) {
        LocalDateTime currentStart = (startDate != null) ? startDate : LocalDateTime.now().minusDays(30);
        LocalDateTime currentEnd = (endDate != null) ? endDate : LocalDateTime.now();
        Duration duration = Duration.between(currentStart, currentEnd);
        LocalDateTime previousStart = currentStart.minus(duration);
        LocalDateTime previousEnd = currentStart;

        // Reservas del usuario usando Specifications
        Specification<Reservation> userSpec = ReservationSpecifications.withFilters(
                null, null, null, List.of(user.getId()), null, null, null, null, null, null, true);
        long totalReservationsHistorical = reservationRepository.count(userSpec);

        // Reservas del periodo actual
        Specification<Reservation> currentSpec = ReservationSpecifications.withFilters(
                null, null, null, List.of(user.getId()), null, null, currentStart, currentEnd, null, null, true);
        List<Reservation> currentReservations = reservationRepository.findAll(currentSpec);

        // Periodo anterior para growth
        Specification<Reservation> previousSpec = ReservationSpecifications.withFilters(
                null, null, null, List.of(user.getId()), null, null, previousStart, previousEnd, null, null, true);
        long previousCount = reservationRepository.count(previousSpec);

        long currentCount = currentReservations.size();
        double resGrowth = calculateGrowth(currentCount, previousCount);

        // Cálculo de horas y aprobación
        List<Reservation> currentApproved = currentReservations.stream()
                .filter(r -> r.getStatus() == ReservationStatus.APROBADA)
                .collect(Collectors.toList());
        
        double currentHours = currentApproved.stream()
                .mapToDouble(r -> Duration.between(r.getStartTime(), r.getEndTime()).toMinutes() / 60.0)
                .sum();

        double previousHours = reservationRepository.findAll(previousSpec).stream()
                .filter(r -> r.getStatus() == ReservationStatus.APROBADA)
                .mapToDouble(r -> Duration.between(r.getStartTime(), r.getEndTime()).toMinutes() / 60.0)
                .sum();

        double hoursGrowth = calculateGrowth((long)Math.round(currentHours), (long)Math.round(previousHours));
        double approvalRate = currentCount > 0 ? (double) currentApproved.size() / currentCount * 100 : 0;

        Map<String, Long> byStatus = currentReservations.stream()
                .collect(Collectors.groupingBy(r -> r.getStatus().name(), Collectors.counting()));

        Map<String, Long> weekly = currentReservations.stream()
                .collect(Collectors.groupingBy(
                    r -> r.getStartTime().getDayOfWeek().getDisplayName(TextStyle.FULL, new Locale("es", "ES")),
                    LinkedHashMap::new,
                    Collectors.counting()
                ));

        // Actividad reciente del usuario (Paginada)
        Specification<AuditLog> auditSpec = (root, query, cb) -> cb.equal(root.get("performedBy"), user.getEmail());
        List<RecentActivityDTO> recent = auditLogRepository.findAll(
                auditSpec,
                PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "timestamp"))
        ).getContent().stream()
                .map(log -> {
                    RecentActivityDTO dto = mapToRecentActivity(log);
                    dto.setPerformedBy("Mí");
                    return dto;
                })
                .collect(Collectors.toList());

        // Próximos eventos del usuario
        Specification<Reservation> upcomingSpec = ReservationSpecifications.withFilters(
                null, null, null, List.of(user.getId()), null, null, LocalDateTime.now(), null, null, null, true);
        
        upcomingSpec = upcomingSpec.and((root, query, cb) -> 
            root.get("status").in(Arrays.asList(ReservationStatus.APROBADA, ReservationStatus.BLOQUEO))
        );

        List<com.tfg.backend.modules.reservation.dto.ReservationDTO> upcoming = reservationRepository.findAll(
                upcomingSpec, 
                PageRequest.of(0, 5, Sort.by(Sort.Direction.ASC, "startTime"))
        ).getContent().stream()
                .map(reservationMapper::toDto)
                .collect(Collectors.toList());

        return StatsDTO.builder()
                .systemTotals(SystemTotals.builder()
                        .totalSpaces(0)
                        .totalUsers(0)
                        .totalReservationsHistorical(totalReservationsHistorical)
                        .build())
                .periodActivity(PeriodActivity.builder()
                        .reservationsCount(currentCount)
                        .activeUsersCount((long) Math.round(currentHours))
                        .occupancyRatio(Math.round(approvalRate * 10.0) / 10.0)
                        .reservationsGrowth(resGrowth)
                        .usersGrowth(hoursGrowth)
                        .reservationsBySpace(new LinkedHashMap<>())
                        .reservationsByStatus(byStatus)
                        .occupancyByType(new LinkedHashMap<>())
                        .weeklyActivity(weekly)
                        .build())
                .recentActivity(recent)
                .upcomingEvents(upcoming)
                .build();
    }

    /**
     * Convierte una entidad de auditoría interna a su representación de transferencia de datos.
     *
     * @param log Registro de auditoría a transformar.
     * @return El DTO de actividad reciente.
     */
    private RecentActivityDTO mapToRecentActivity(AuditLog log) {
        String author = log.getPerformedBy();
        User u = userRepository.findByEmail(log.getPerformedBy()).orElse(null);
        if (u != null) {
            author = u.getName() + " (" + u.getRole().getName() + ")";
        } else if (log.getPerformedBy() != null && log.getPerformedBy().startsWith("SYSTEM")) {
            author = log.getPerformedBy().replace("SYSTEM", "Sistema");
        }

        String isoTimestamp = log.getTimestamp()
                .atZone(java.time.ZoneId.of("Europe/Madrid"))
                .toInstant()
                .toString();

        return RecentActivityDTO.builder()
            .id(log.getId().toString())
            .action(log.getAction())
            .performedBy(author)
            .timestamp(isoTimestamp)
            .details(log.getDetails())
            .build();
    }

    /**
     * Calcula el porcentaje de crecimiento (o decremento) de un valor comparado con un periodo anterior.
     *
     * @param current Valor correspondiente al periodo actual.
     * @param previous Valor correspondiente al periodo previo de referencia.
     * @return Porcentaje de crecimiento redondeado a un decimal.
     */
    private double calculateGrowth(long current, long previous) {
        if (previous == 0) return current > 0 ? 100.0 : 0.0;
        double growth = ((double) (current - previous) / previous) * 100;
        return Math.round(growth * 10.0) / 10.0;
    }
}
