package com.tfg.backend.modules.space.service;
import com.tfg.backend.core.audit.Auditable;
import com.tfg.backend.core.common.BulkConflictSummaryDTO;
import com.tfg.backend.core.common.ImportResultDTO;
import com.tfg.backend.core.exception.BusinessValidationException;
import com.tfg.backend.core.exception.ResourceNotFoundException;
import com.tfg.backend.core.security.SecurityService;
import com.tfg.backend.core.util.BulkConflictHelper;
import com.tfg.backend.core.util.PaginationUtils;
import com.tfg.backend.modules.space.validator.SpaceValidator;
import com.tfg.backend.modules.reservation.dto.AvailabilitySearchRequest;
import com.tfg.backend.modules.reservation.event.ReservationEvent;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.reservation.service.AvailabilitySearchService;
import com.tfg.backend.modules.space.dto.SpaceDTO;
import com.tfg.backend.modules.space.dto.SpaceConflictDTO;
import com.tfg.backend.modules.space.dto.SpaceRequest;
import com.tfg.backend.modules.space.mapper.SpaceMapper;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.space.model.SpaceStatus;
import com.tfg.backend.modules.space.model.SpaceType;
import com.tfg.backend.modules.space.repository.SpaceRepository;
import com.tfg.backend.modules.space.repository.SpaceSpecifications;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio integral para la gestión del ciclo de vida de los espacios.
 * Refactorizado para usar MapStruct y estandarizar la lógica de mapeo.
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class SpaceServiceImpl implements SpaceService {

    /** Repositorio de espacios. */
    private final SpaceRepository spaceRepository;
    /** Repositorio de reservas. */
    private final ReservationRepository reservationRepository;
    /** Servicio de búsqueda de disponibilidad. */
    private final AvailabilitySearchService availabilitySearchService;
    /** Servicio de importación de espacios. */
    private final SpaceImportService spaceImportService;
    /** Validador de espacios. */
    private final SpaceValidator spaceValidator;
    /** Servicio de seguridad. */
    private final SecurityService securityService;
    /** Mapeador de espacios. */
    private final SpaceMapper spaceMapper;
    /** Publicador de eventos. */
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional(readOnly = true)
    public Page<SpaceDTO> findAll(boolean includeDeleted, Pageable pageable) {
        Pageable insensitivePageable = PaginationUtils.ensureCaseInsensitive(pageable);
        Specification<Space> spec = SpaceSpecifications.withFilters(null, null, null, null, null, includeDeleted);
        Page<Space> page = spaceRepository.findAll(spec, insensitivePageable);
        
        populateOccupancy(page.getContent());
        return page.map(spaceMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public SpaceDTO findById(Long id) {
        Space space = spaceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Espacio", "id", id));
        populateOccupancy(List.of(space));
        return spaceMapper.toDto(space);
    }

    @Override
    @Auditable(entity = "Space", action = "CREATE_SPACE")
    public SpaceDTO create(SpaceRequest request) {
        spaceValidator.validateUniqueName(request.getName(), null);
        spaceValidator.validateUniqueGisId(request.getGisId(), null);
        
        // Mapeo automático mediante MapStruct
        Space space = spaceMapper.toEntity(request);
        
        if (space.getStatus() == null) {
            space.setStatus(SpaceStatus.DISPONIBLE);
        }
        
        spaceValidator.validateCapacities(space);
        return spaceMapper.toDto(spaceRepository.save(space));
    }

    @Override
    @Auditable(entity = "Space", action = "UPDATE_SPACE")
    public SpaceDTO update(Long id, SpaceRequest request) {
        Space existing = spaceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Espacio", "id", id));
        
        if (request.getName() != null && !request.getName().equalsIgnoreCase(existing.getName())) {
            spaceValidator.validateUniqueName(request.getName(), id);
        }

        if (request.getGisId() != null && !request.getGisId().equalsIgnoreCase(existing.getGisId())) {
            spaceValidator.validateUniqueGisId(request.getGisId(), id);
        }

        if (request.getTotalCapacity() != null) {
            spaceValidator.validateCapacityReduction(
                existing.getId(), request.getTotalCapacity(), existing.getTotalCapacity()
            );
        }

        // Actualización automática mediante MapStruct
        spaceMapper.updateEntityFromRequest(request, existing);
        
        spaceValidator.validateCapacities(existing);
        return spaceMapper.toDto(spaceRepository.save(existing));
    }

    @Override
    @Auditable(entity = "Space", action = "DELETE_SPACE")
    public void deleteById(Long id) {
        Space space = spaceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Espacio", "id", id));
        processReservationsBeforeDelete(spaceMapper.toDto(space));
        space.setStatus(SpaceStatus.ELIMINADO);
        spaceRepository.save(space);
    }

    @Override
    @Transactional(readOnly = true)
    public Space findByIdEntity(Long id) {
        Space space = spaceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Espacio", "id", id));
        populateOccupancy(List.of(space));
        return space;
    }

    @Override
    @Transactional(readOnly = true)
    public BulkConflictSummaryDTO getBulkSpaceConflictSummary(List<Long> ids) {
        return BulkConflictHelper.buildSummary(
                ids,
                id -> spaceRepository.findById(id).orElse(null),
                Space::getName,
                space -> (long) reservationRepository.countActiveBySpace(space.getId(), LocalDateTime.now())
        );
    }

    @Override
    @Transactional
    @Auditable(entity = "Space", action = "DELETE_SPACE_BULK", includeId = false)
    public void deleteMultiple(List<Long> ids, boolean force) {
        if (ids == null || ids.isEmpty()) return;
        
        for (Long id : ids) {
            try {
                if (force) {
                    deleteById(id);
                } else {
                    int active = reservationRepository.countActiveBySpace(id, LocalDateTime.now());
                    if (active == 0) {
                        deleteById(id);
                    }
                }
            } catch (Exception e) {
                log.error("Fallo al borrar espacio {} en lote: {}", id, e.getMessage());
            }
        }
    }

    @Override
    @Auditable(entity = "Space", action = "RESTORE_SPACE")
    public void restoreById(Long id) {
        Space space = spaceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Espacio", "id", id));
        if (space.getStatus() != SpaceStatus.ELIMINADO) {
            throw new BusinessValidationException("status", "El espacio no está eliminado.");
        }
        space.setStatus(SpaceStatus.DISPONIBLE);
        spaceRepository.save(space);
    }

    @Override
    public ImportResultDTO importSpaces(MultipartFile file, boolean overwrite) {
        return spaceImportService.importFromCsv(file, overwrite);
    }

    @Override
    public ImportResultDTO validateImport(MultipartFile file) {
        return spaceImportService.validateCsv(file);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportSpacesToCsv() {
        return spaceImportService.exportToCsv();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SpaceDTO> searchSpaces(String name, SpaceType type, SpaceStatus status, 
                                  Integer minCapacity, Integer minComputers, 
                                  LocalDateTime start, LocalDateTime end, 
                                  boolean includeDeleted, Pageable pageable) {
        
        Page<Space> page = searchSpacesEntities(name, type, status, minCapacity, minComputers, start, end, includeDeleted, pageable);
        populateOccupancy(page.getContent());
        return page.map(spaceMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Space> searchSpacesEntities(String name, SpaceType type, SpaceStatus status, 
                                  Integer minCapacity, Integer minComputers, 
                                  LocalDateTime start, LocalDateTime end, 
                                  boolean includeDeleted, Pageable pageable) {
        Pageable insensitivePageable = PaginationUtils.ensureCaseInsensitive(pageable);
        List<SpaceType> types = type != null ? Collections.singletonList(type) : null;
        Specification<Space> spec = SpaceSpecifications.withFilters(name, types, status, minCapacity, minComputers, includeDeleted);
        
        if (start != null && end != null) {
            spec = combine(spec, SpaceSpecifications.isAvailable(start, end));
        }
        
        return spaceRepository.findAll(spec, insensitivePageable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SpaceConflictDTO> getConflicts(Long id) {
        SpaceDTO space = findById(id);
        LocalDateTime now = LocalDateTime.now();
        return reservationRepository.findBySpaceId(id).stream()
                .filter(r -> r.getStatus() == ReservationStatus.SOLICITADA || 
                            r.getStatus() == ReservationStatus.APROBADA || 
                            r.getStatus() == ReservationStatus.BLOQUEO)
                .filter(r -> r.getEndTime().isAfter(now))
                .sorted(Comparator.comparing(Reservation::getStartTime))
                .map(r -> SpaceConflictDTO.builder()
                        .spaceId(space.getId())
                        .spaceName(space.getName())
                        .reservationId(r.getId())
                        .title(r.getTitle())
                        .type(r.getType().name())
                        .userName(r.getUser().getName())
                        .startTime(r.getStartTime())
                        .endTime(r.getEndTime())
                        .status(r.getStatus().name())
                        .onlySpace(r.getSpaces().size() == 1)
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public Object getProposals(AvailabilitySearchRequest request) {
        return availabilitySearchService.getProposals(request);
    }

    private <T> Specification<T> combine(Specification<T> base, Specification<T> other) {
        if (base == null) return other;
        if (other == null) return base;
        return base.and(other);
    }

    private void populateOccupancy(List<Space> spaces) {
        if (spaces.isEmpty()) return;
        List<Long> occupiedIds = reservationRepository.findCurrentlyOccupiedSpaceIds(LocalDateTime.now());
        List<Long> blockedIds = reservationRepository.findCurrentlyBlockedSpaceIds(LocalDateTime.now());
        spaces.forEach(s -> {
            s.setOccupiedNow(occupiedIds.contains(s.getId()));
            s.setBlockedNow(blockedIds.contains(s.getId()));
        });
    }

    private int processReservationsBeforeDelete(SpaceDTO space) {
        LocalDateTime now = LocalDateTime.now();
        List<Reservation> activeFutureReservations = reservationRepository.findBySpaceId(space.getId()).stream()
                .filter(r -> r.getStatus() == ReservationStatus.SOLICITADA || 
                            r.getStatus() == ReservationStatus.APROBADA || 
                            r.getStatus() == ReservationStatus.BLOQUEO)
                .filter(r -> r.getEndTime().isAfter(now))
                .collect(Collectors.toList());

        for (Reservation res : activeFutureReservations) {
            if (res.getSpaces().size() == 1) {
                res.setStatus(ReservationStatus.CANCELADA);
                res.setRejectionReason("Cancelada por eliminación del espacio reservado.");
                reservationRepository.save(res);
                eventPublisher.publishEvent(new ReservationEvent(this, res, ReservationEvent.ReservationAction.CANCEL));
            } else {
                // Para eliminar de la lista, necesitamos la entidad real
                Space entity = spaceRepository.findById(space.getId()).orElse(null);
                if (entity != null) {
                    res.getSpaces().remove(entity);
                    res.setDescription(res.getDescription() + " (Espacio '" + space.getName() + "' eliminado de la reserva)");
                    reservationRepository.save(res);
                    eventPublisher.publishEvent(new ReservationEvent(this, res, ReservationEvent.ReservationAction.UPDATE));
                }
            }
        }
        return activeFutureReservations.size();
    }
}
