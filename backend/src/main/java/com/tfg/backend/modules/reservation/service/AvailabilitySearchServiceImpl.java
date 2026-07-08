package com.tfg.backend.modules.reservation.service;
import com.tfg.backend.core.exception.BusinessValidationException;
import com.tfg.backend.modules.reservation.dto.AvailabilitySearchRequest;
import com.tfg.backend.modules.reservation.dto.DailyResultsDTO;
import com.tfg.backend.modules.reservation.dto.ReservationProposalDTO;
import com.tfg.backend.modules.reservation.dto.TimeSlotResultsDTO;
import com.tfg.backend.modules.space.mapper.SpaceMapper;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.space.model.SpaceStatus;
import com.tfg.backend.modules.space.model.SpaceType;
import com.tfg.backend.modules.space.repository.SpaceRepository;
import com.tfg.backend.modules.space.repository.SpaceSpecifications;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementación del motor avanzado para la búsqueda algorítmica de disponibilidad de espacios.
 * Incorpora diversas heurísticas (búsqueda individual, análisis combinatorio y aproximación voraz o greedy)
 * con el objetivo de maximizar la eficiencia y optimizar el grado de ocupación del centro.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AvailabilitySearchServiceImpl implements AvailabilitySearchService {

    /** Repositorio de espacios. */
    private final SpaceRepository spaceRepository;
    /** Mapeador de espacios. */
    private final SpaceMapper spaceMapper;

    /**
     * Constituye el punto de acceso principal para solicitar propuestas de reserva óptimas.
     * Ofrece soporte dual: búsquedas restringidas por parámetros estrictos (fecha/hora fijos) 
     * y exploraciones heurísticas flexibles a través de marcos temporales amplios.
     */
    @Override
    @Transactional(readOnly = true)
    public Object getProposals(AvailabilitySearchRequest request) {
        if (request == null) {
            throw new BusinessValidationException("request", "La solicitud de búsqueda es obligatoria.");
        }

        double ratio = (request.getDistributionRatio() != null) ? request.getDistributionRatio() : 1.0;
        boolean isFlexible = request.getFlexible() != null && request.getFlexible();
        
        if (!isFlexible) {
            if (request.getStartTime() == null || request.getEndTime() == null) {
                throw new BusinessValidationException("range", "En modo estándar, las fechas de inicio y fin son obligatorias.");
            }
            if (!request.getEndTime().isAfter(request.getStartTime())) {
                throw new BusinessValidationException("range", "Error cronológico: La fecha de fin debe ser posterior a la de inicio.");
            }
            return generateProposalsForRange(
                    request.getStartTime(), 
                    request.getEndTime(), 
                    request.getMinCapacity(), 
                    request.getTypes(),
                    ratio
            );
        }

        // Validaciones preventivas para modo flexible para evitar 500
        if (request.getRangeStart() == null || request.getRangeEnd() == null) {
            throw new BusinessValidationException("range", "En modo flexible, el rango de fechas es obligatorio.");
        }
        if (!request.getRangeEnd().isAfter(request.getRangeStart()) && !request.getRangeEnd().equals(request.getRangeStart())) {
            throw new BusinessValidationException("range", "La fecha de fin de rango no puede ser anterior a la de inicio.");
        }
        if (request.getDailyStart() == null || request.getDailyEnd() == null) {
            throw new BusinessValidationException("hours", "En modo flexible, el horario operativo diario es obligatorio.");
        }
        if (request.getDurationHours() == null || request.getDurationHours() <= 0) {
            throw new BusinessValidationException("duration", "La duración de la actividad debe ser un número positivo.");
        }

        return handleFlexibleSearch(request, ratio);
    }

    /**
     * Ejecuta una inspección iterativa a lo largo de un rango de días en búsqueda de ventanas de oportunidad
     * para ubicar una reserva. Clasifica y segmenta los hallazgos en franjas temporales de alta cohesión.
     */
    private List<DailyResultsDTO> handleFlexibleSearch(AvailabilitySearchRequest request, double ratio) {
        List<DailyResultsDTO> groupedResults = new ArrayList<>();
        java.time.LocalDate current = request.getRangeStart();
        boolean includeWeekends = request.getIncludeWeekends() != null && request.getIncludeWeekends();
        
        while (!current.isAfter(request.getRangeEnd())) {
            // Control de fines de semana según configuración de búsqueda
            if (!includeWeekends) {
                java.time.DayOfWeek dow = current.getDayOfWeek();
                if (dow == java.time.DayOfWeek.SATURDAY || dow == java.time.DayOfWeek.SUNDAY) {
                    current = current.plusDays(1);
                    continue;
                }
            }

            List<TimeSlotResultsDTO> timeSlotGroups = new ArrayList<>();
            LocalDateTime dayStart = LocalDateTime.of(current, request.getDailyStart());
            LocalDateTime dayEnd = LocalDateTime.of(current, request.getDailyEnd());
            
            long durationMinutes = (long) (request.getDurationHours() * 60);
            LocalDateTime slotStart = dayStart;
            
            // Análisis por ventanas temporales (Desplazamiento de 30 minutos)
            while (!slotStart.plusMinutes(durationMinutes).isAfter(dayEnd)) {
                LocalDateTime slotEnd = slotStart.plusMinutes(durationMinutes);
                
                List<ReservationProposalDTO> slotProposals = generateProposalsForRange(
                        slotStart, slotEnd, request.getMinCapacity(), request.getTypes(), ratio);
                
                if (!slotProposals.isEmpty()) {
                    timeSlotGroups.add(TimeSlotResultsDTO.builder()
                            .startTime(slotStart.toLocalTime())
                            .endTime(slotEnd.toLocalTime())
                            .label(String.format("%s - %s", slotStart.toLocalTime(), slotEnd.toLocalTime()))
                            .proposals(slotProposals)
                            .count(slotProposals.size())
                            .build());
                }
                
                slotStart = slotStart.plusMinutes(30);
            }

            if (!timeSlotGroups.isEmpty()) {
                groupedResults.add(DailyResultsDTO.builder()
                        .date(current)
                        .timeSlots(timeSlotGroups)
                        .totalCount(timeSlotGroups.stream().mapToInt(TimeSlotResultsDTO::getCount).sum())
                        .build());
            }

            current = current.plusDays(1);
        }

        return groupedResults;
    }

    /**
     * Evalúa y devuelve un repertorio clasificado de propuestas aptas para un segmento temporal predeterminado.
     * Aplica sucesivas políticas de evaluación de recursos para satisfacer demandas exigentes de aforo de forma eficiente.
     */
    private List<ReservationProposalDTO> generateProposalsForRange(
            LocalDateTime start, LocalDateTime end, Integer minCapacity, Collection<SpaceType> types, double ratio) {
        
        // Recuperación de inventario disponible para el segmento temporal usando Specifications
        Specification<Space> spec = SpaceSpecifications.withFilters(null, types, SpaceStatus.DISPONIBLE, 0, null, false);
        Specification<Space> availableSpec = SpaceSpecifications.isAvailable(start, end);
        
        if (availableSpec != null) {
            spec = (spec == null) ? availableSpec : spec.and(availableSpec);
        }
        
        Page<Space> availablePage = spaceRepository.findAll(spec, Pageable.ofSize(200));
        if (availablePage == null || availablePage.isEmpty()) {
            return new ArrayList<>();
        }
        
        List<Space> availableSpaces = availablePage.getContent()
                .stream()
                .sorted(Comparator.comparingInt((Space s) -> s.getTotalCapacity() != null ? s.getTotalCapacity() : 0).reversed())
                .collect(Collectors.toList());
        
        List<ReservationProposalDTO> proposals = new ArrayList<>();
        // El requerido físico real según el ratio de distribución
        int physicalRequired = (minCapacity != null) ? (int) Math.ceil(minCapacity * ratio) : 0;

        // ESTRATEGIA 1: Unidad óptima (Eficiencia máxima sin fragmentación)
        for (Space s : availableSpaces) {
            if (s.getTotalCapacity() != null && s.getTotalCapacity() >= physicalRequired) {
                proposals.add(buildProposal(List.of(s), physicalRequired, "Espacio individual de aforo adecuado", start, end, ratio));
            }
        }

        // ESTRATEGIA 2: Combinatoria controlada (Máximo 2-3 espacios)
        if (proposals.size() < 10 && availableSpaces.size() >= 2) {
            applyCombinatorialStrategy(availableSpaces, physicalRequired, proposals, start, end, ratio);
        }

        // ESTRATEGIA 3: Selección Greedy (Supervivencia para grandes eventos)
        if (proposals.isEmpty() && !availableSpaces.isEmpty() && physicalRequired > 0) {
            applyGreedyStrategy(availableSpaces, physicalRequired, proposals, start, end, ratio);
        }

        // Clasificación final por score de eficiencia (menor es mejor)
        return proposals.stream()
                .sorted(Comparator.comparingDouble(ReservationProposalDTO::getEfficiencyScore))
                .limit(10)
                .collect(Collectors.toList());
    }

    /** Algoritmo de combinación para cubrir aforos mediante múltiples salas pequeñas. */
    private void applyCombinatorialStrategy(List<Space> spaces, int req, List<ReservationProposalDTO> props, LocalDateTime s, LocalDateTime e, double ratio) {
        int limit = Math.min(spaces.size(), 20); // Limitamos para evitar explosión combinatoria
        for (int i = 0; i < limit; i++) {
            for (int j = i + 1; j < limit; j++) {
                Space s1 = spaces.get(i);
                Space s2 = spaces.get(j);
                
                int cap1 = s1.getTotalCapacity() != null ? s1.getTotalCapacity() : 0;
                int cap2 = s2.getTotalCapacity() != null ? s2.getTotalCapacity() : 0;
                int sum2 = cap1 + cap2;
                
                if (sum2 >= req && cap1 < req && cap2 < req) {
                    props.add(buildProposal(List.of(s1, s2), req, "Combinación eficiente de 2 espacios vinculados", s, e, ratio));
                }
                
                // Búsqueda de tríos solo si el requerimiento es masivo
                if (req > 100 && props.size() < 15) {
                    for (int k = j + 1; k < limit; k++) {
                        Space s3 = spaces.get(k);
                        int cap3 = s3.getTotalCapacity() != null ? s3.getTotalCapacity() : 0;
                        if (sum2 + cap3 >= req && sum2 < req) {
                            props.add(buildProposal(List.of(s1, s2, s3), req, "Combinación múltiple para gran aforo", s, e, ratio));
                        }
                    }
                }
            }
        }
    }

    /** Estrategia de selección voraz cuando el aforo solicitado supera cualquier sala individual. */
    private void applyGreedyStrategy(List<Space> spaces, int req, List<ReservationProposalDTO> props, LocalDateTime s, LocalDateTime e, double ratio) {
        List<Space> selection = new ArrayList<>();
        int currentSum = 0;
        for (Space space : spaces) {
            selection.add(space);
            currentSum += (space.getTotalCapacity() != null ? space.getTotalCapacity() : 0);
            if (currentSum >= req) break;
        }
        if (currentSum >= req) {
            props.add(buildProposal(selection, req, "Agrupación masiva por necesidad de aforo", s, e, ratio));
        }
    }

    /** Construye el DTO de propuesta calculando su eficiencia técnica. */
    private ReservationProposalDTO buildProposal(List<Space> spaces, int physicalRequired, String reason, LocalDateTime start, LocalDateTime end, double ratio) {
        int total = spaces.stream().mapToInt(s -> s.getTotalCapacity() != null ? s.getTotalCapacity() : 0).sum();
        int over = Math.max(0, total - physicalRequired);
        
        // Capacidad efectiva según el ratio (ej: 100 sitios / 2.0 = 50 personas)
        int effective = (int) Math.floor(total / ratio);
        
        // Métrica de eficiencia: Penalizamos desperdicio de sillas y dispersión geográfica (salas extra)
        double score = over + (spaces.size() - 1) * 35.0;
        
        return ReservationProposalDTO.builder()
                .spaces(spaceMapper.toDtoList(spaces))
                .totalCapacity(total)
                .effectiveCapacity(effective)
                .overCapacity(over)
                .efficiencyScore(score)
                .recommendationReason(reason)
                .suggestedStartTime(start)
                .suggestedEndTime(end)
                .build();
    }
}
