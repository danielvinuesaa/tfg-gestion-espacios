package com.tfg.backend.modules.reservation.service;
import com.tfg.backend.core.audit.Auditable;
import com.tfg.backend.core.common.BulkConflictSummaryDTO;
import com.tfg.backend.core.exception.BusinessValidationException;
import com.tfg.backend.core.exception.ResourceNotFoundException;
import com.tfg.backend.core.security.SecurityService;
import com.tfg.backend.core.util.PaginationUtils;
import com.tfg.backend.modules.reservation.validator.ReservationValidator;
import com.tfg.backend.modules.reservation.event.ReservationEvent;
import com.tfg.backend.modules.reservation.dto.ReservationDTO;
import com.tfg.backend.modules.reservation.dto.ReservationRequest;
import com.tfg.backend.modules.reservation.dto.VisibilityResult;
import com.tfg.backend.modules.reservation.mapper.ReservationMapper;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.reservation.model.ReservationType;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.reservation.repository.ReservationSpecifications;
import com.tfg.backend.modules.reservation.repository.SubjectRepository;
import com.tfg.backend.modules.space.dto.SpaceConflictDTO;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.space.model.SpaceType;
import com.tfg.backend.modules.space.repository.SpaceRepository;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;

/**
 * Implementación del servicio responsable de la gestión de reservas.
 * Coordina la lógica de negocio relativa a la creación, actualización, cancelación,
 * validación de conflictos y recuperación de reservas. Hace uso de eventos del dominio
 * para desacoplar notificaciones y auditoría.
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ReservationServiceImpl implements ReservationService {

    /** Repositorio de reservas. */
    private final ReservationRepository reservationRepository;
    /** Repositorio de espacios. */
    private final SpaceRepository spaceRepository;
    /** Repositorio de usuarios. */
    private final UserRepository userRepository;
    /** Repositorio de asignaturas. */
    private final SubjectRepository subjectRepository;
    /** Validador de reservas. */
    private final ReservationValidator reservationValidator;
    /** Publicador de eventos. */
    private final ApplicationEventPublisher eventPublisher;
    /** Servicio de seguridad. */
    private final SecurityService securityService;
    /** Mapeador de reservas. */
    private final ReservationMapper reservationMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<ReservationDTO> findAll(ReservationStatus status, ReservationType type, List<Long> spaceIds,
                                   String scope, List<Long> userIds, LocalDateTime startDate, LocalDateTime endDate,
                                   String search, List<Long> subjectIds, boolean includeCancelled, Pageable pageable) {

        return findAllEntities(status, type, spaceIds, scope, userIds, startDate, endDate, search, subjectIds, includeCancelled, pageable)
                .map(reservationMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Reservation> findAllEntities(ReservationStatus status, ReservationType type, List<Long> spaceIds,
                                   String scope, List<Long> userIds, LocalDateTime startDate, LocalDateTime endDate,
                                   String search, List<Long> subjectIds, boolean includeCancelled, Pageable pageable) {

        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new BusinessValidationException("startTime", "La fecha de inicio no puede ser posterior a la de fin.");
        }

        // La lógica de "qué ve quién" se centraliza aquí, limpiando el controlador
        com.tfg.backend.modules.reservation.dto.VisibilityResult visibility = securityService.resolveVisibility(scope, (userIds != null && !userIds.isEmpty()) ? userIds.get(0) : null);

        List<Long> targets = (userIds != null && !userIds.isEmpty()) ? userIds :
                           (visibility.getTargetUserId() != null ? List.of(visibility.getTargetUserId()) : null);

        return findAllEntitiesInternal(status, type, spaceIds, targets, visibility.getSecurityUserId(),
                visibility.getManagedSubjectIds(), startDate, endDate, search, subjectIds, includeCancelled, pageable);
    }

    /**
     * Método interno para recuperar la lista paginada de entidades Reservation aplicando todos los filtros.
     */
    private Page<Reservation> findAllEntitiesInternal(ReservationStatus status, ReservationType type, List<Long> spaceIds,
                                   List<Long> targetUserIds, Long securityUserId, List<Long> managedSubjectIds,
                                   LocalDateTime startDate, LocalDateTime endDate, String search,
                                   List<Long> subjectIds, boolean includeCancelled, Pageable pageable) {

        Pageable insensitivePageable = PaginationUtils.ensureCaseInsensitive(pageable);

        // Estándar Profesional: Si no se especifica fecha de inicio, mostramos desde "ahora" (Upcoming)
        LocalDateTime effectiveStart = (startDate != null) ? startDate : LocalDateTime.now();

        Specification<Reservation> spec = ReservationSpecifications.withFilters(
                status, type, spaceIds, targetUserIds, securityUserId, managedSubjectIds, effectiveStart, endDate, search, subjectIds, includeCancelled);

        return reservationRepository.findAll(spec, insensitivePageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReservationDTO> findAll(ReservationStatus status, ReservationType type, List<Long> spaceIds,
                                   List<Long> targetUserIds, Long securityUserId, List<Long> managedSubjectIds,
                                   LocalDateTime startDate, LocalDateTime endDate, String search,
                                   List<Long> subjectIds, boolean includeCancelled, Pageable pageable) {

        return findAllEntitiesInternal(status, type, spaceIds, targetUserIds, securityUserId, managedSubjectIds,
                startDate, endDate, search, subjectIds, includeCancelled, pageable)
                .map(reservationMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public ReservationDTO findById(Long id) {
        return reservationMapper.toDto(findByIdEntity(id));
    }

    @Override
    @Transactional(readOnly = true)
    public Reservation findByIdEntity(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva", "id", id));
    }

    @Override
    @Auditable(entity = "Reservation", action = "CREATE_RESERVATION")
    public ReservationDTO createReservation(ReservationRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", userEmail));
        
        validateBasicRequest(request);
        reservationValidator.validateTimeRange(request.getStartTime(), request.getEndTime(), request.isBlock());
        
        // Bloqueo pesimista: Evitamos que otro hilo reserve estos espacios al mismo tiempo (Race condition)
        List<Space> spaces = spaceRepository.findAllByIdWithLock(request.getSpaceIds());
        
        reservationValidator.validateOverlaps(request.getSpaceIds(), request.getStartTime(), request.getEndTime(), null, request.isBlock());

        if (request.isBlock()) {
            resolveConflictsForBlock(request.getSpaceIds(), request.getStartTime(), request.getEndTime(), null);
        }

        // Mapeo automático de campos simples
        Reservation reservation = reservationMapper.toEntity(request);
        
        // Resolución manual de relaciones y campos de negocio
        reservation.setSpaces(new HashSet<>(spaces));
        reservation.setUser(user);
        
        if (request.getSubjectId() != null) {
            reservation.setSubject(subjectRepository.findById(request.getSubjectId()).orElse(null));
        }

        reservation.setStatus(resolveInitialStatus(request, spaces, user, reservation));
        reservation.setResponsible(resolveResponsible(request));
        reservation.setResponsibleName(getResponsibleName(request, user));

        Reservation saved = reservationRepository.save(reservation);
        
        eventPublisher.publishEvent(new ReservationEvent(this, saved, ReservationEvent.ReservationAction.CREATE, request.isBlock()));

        return reservationMapper.toDto(saved);
    }

    @Override
    @Auditable(entity = "Reservation", action = "UPDATE_RESERVATION")
    public ReservationDTO updateReservation(Long id, ReservationRequest request) {
        Reservation existing = findByIdEntity(id);
        
        if (!securityService.canEditReservation(id)) {
            throw new AccessDeniedException("No posee permisos para modificar esta reserva.");
        }

        // Regla: No se pueden editar reservas en estado terminal (CANCELADA/RECHAZADA)
        reservationValidator.validateEditableState(existing);
        
        validateBasicRequest(request);
        reservationValidator.validateTimeRange(request.getStartTime(), request.getEndTime(), request.isBlock());
        reservationValidator.validateOverlaps(request.getSpaceIds(), request.getStartTime(), request.getEndTime(), id, request.isBlock());

        if (request.isBlock()) {
            resolveConflictsForBlock(request.getSpaceIds(), request.getStartTime(), request.getEndTime(), id);
        }

        // Actualización automática de campos simples
        reservationMapper.updateEntityFromRequest(request, existing);
        
        // Actualización manual de relaciones
        List<Space> spaces = spaceRepository.findAllById(request.getSpaceIds());
        existing.setSpaces(new HashSet<>(spaces));
        
        if (request.getSubjectId() != null) {
            existing.setSubject(subjectRepository.findById(request.getSubjectId()).orElse(null));
        } else {
            existing.setSubject(null);
        }

        existing.setResponsible(resolveResponsible(request));
        existing.setResponsibleName(getResponsibleName(request, existing.getUser()));
        
        // Lógica de estado tras edición (Auto-aprobación por Autoridad):
        // Si el usuario actual tiene permisos de aprobación para esta reserva específica, 
        // la dejamos/ponemos en APROBADA. Si no, re-evaluamos (suele volver a SOLICITADA).
        User currentUser = securityService.getCurrentUser();
        existing.setStatus(resolveInitialStatus(request, spaces, currentUser, existing));
        
        Reservation saved = reservationRepository.save(existing);
        
        eventPublisher.publishEvent(new ReservationEvent(this, saved, ReservationEvent.ReservationAction.UPDATE));

        return reservationMapper.toDto(saved);
    }

    @Override
    @Auditable(entity = "Reservation", action = "CANCEL_RESERVATION")
    public void deleteReservation(Long id) {
        Reservation res = findByIdEntity(id);
        
        if (!securityService.canCancelReservation(id)) {
            throw new AccessDeniedException("No posee permisos para cancelar esta reserva.");
        }

        // Regla: No se puede cancelar algo que ya está cancelado o rechazado (terminal)
        reservationValidator.validateEditableState(res);

        // Realizamos borrado lógico cambiando el estado
        res.setStatus(ReservationStatus.CANCELADA);
        reservationRepository.save(res);
        
        eventPublisher.publishEvent(new ReservationEvent(this, res, ReservationEvent.ReservationAction.CANCEL));
    }

    @Override
    @Transactional
    public void deleteMultiple(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return;
        ids.forEach(this::deleteReservation);
    }

    @Override
    @Auditable(entity = "Reservation", action = "UPDATE_STATUS")
    public ReservationDTO updateStatus(Long id, ReservationStatus status, String rejectionReason) {
        Reservation reservation = findByIdEntity(id);
        
        if (status == ReservationStatus.APROBADA || status == ReservationStatus.RECHAZADA) {
            if (!securityService.canApproveReservation(id)) {
                throw new AccessDeniedException("No posee autoridad para cambiar el estado de esta reserva.");
            }
        }

        // Si se va a aprobar, validar que no haya surgido un conflicto mientras estaba en espera
        if (status == ReservationStatus.APROBADA) {
            List<Long> spaceIds = reservation.getSpaces().stream()
                    .map(Space::getId)
                    .toList();
            reservationValidator.validateOverlaps(
                    spaceIds, 
                    reservation.getStartTime(), 
                    reservation.getEndTime(), 
                    reservation.getId(), 
                    false
            );
        }
        
        reservation.setStatus(status);
        if (status == ReservationStatus.RECHAZADA) {
            if (rejectionReason == null || rejectionReason.trim().isEmpty()) {
                throw new com.tfg.backend.core.exception.BusinessValidationException("El motivo de rechazo es obligatorio para denegar una reserva.");
            }
            reservation.setRejectionReason(rejectionReason);
        }
        
        Reservation saved = reservationRepository.save(reservation);
        
        eventPublisher.publishEvent(new ReservationEvent(this, saved, ReservationEvent.ReservationAction.STATUS_CHANGE));

        return reservationMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.tfg.backend.modules.space.dto.SpaceConflictDTO> checkConflicts(List<Long> spaceIds, LocalDateTime start, LocalDateTime end, Long excludeId) {
        List<Reservation> overlaps = (excludeId != null) 
            ? reservationRepository.findOverlappingInSpacesExcludingId(spaceIds, start, end, excludeId)
            : reservationRepository.findOverlappingReservationsInSpaces(spaceIds, start, end);

        java.util.Set<Long> requestedSpaceIds = new java.util.HashSet<>(spaceIds);
        List<com.tfg.backend.modules.space.dto.SpaceConflictDTO> conflicts = new java.util.ArrayList<>();

        for (Reservation r : overlaps) {
            for (Space s : r.getSpaces()) {
                if (requestedSpaceIds.contains(s.getId())) {
                    conflicts.add(com.tfg.backend.modules.space.dto.SpaceConflictDTO.builder()
                            .spaceId(s.getId())
                            .spaceName(s.getName())
                            .reservationId(r.getId())
                            .title(r.getTitle())
                            .type(r.getType().name())
                            .userName(r.getUser().getName())
                            .startTime(r.getStartTime())
                            .endTime(r.getEndTime())
                            .status(r.getStatus().name())
                            .onlySpace(r.getSpaces().size() == 1)
                            .build());
                }
            }
        }

        return conflicts;
    }

    /**
     * Valida que la solicitud contenga los campos básicos requeridos.
     */
    private void validateBasicRequest(ReservationRequest r) {
        if (r.getSpaceIds() == null || r.getSpaceIds().isEmpty()) {
            throw new BusinessValidationException("spaceIds", "Se debe seleccionar al menos un espacio para la reserva.");
        }
    }

    /**
     * Resuelve el estado inicial de una reserva basada en la solicitud y los permisos.
     */
    private ReservationStatus resolveInitialStatus(ReservationRequest request, List<Space> spaces, User user, Reservation reservation) {
        if (request.isBlock()) return ReservationStatus.BLOQUEO;

        // 1. Autoridad: Si el usuario actual puede aprobar esta reserva, nace/se mantiene aprobada.
        if (securityService.canUserApproveReservation(user, reservation)) {
            return ReservationStatus.APROBADA;
        }

        // 2. Política de Espacio: Algunos espacios se auto-aprueban por defecto (ej: Despachos)
        boolean isAutoApprovableSpace = !spaces.isEmpty() && spaces.stream().allMatch(s -> s.getType() == SpaceType.DESPACHO);
        if (isAutoApprovableSpace) {
            return ReservationStatus.APROBADA;
        }

        // 3. Por defecto, queda pendiente de revisión
        return ReservationStatus.SOLICITADA;
    }

    /**
     * Resuelve el usuario responsable si se especifica un ID.
     */
    private User resolveResponsible(ReservationRequest request) {
        if (request.getResponsibleId() == null) return null;
        return userRepository.findById(request.getResponsibleId()).orElse(null);
    }

    /**
     * Obtiene el nombre del responsable de la reserva.
     */
    private String getResponsibleName(ReservationRequest r, User u) {
        if (r.getResponsibleId() != null) {
            return userRepository.findById(r.getResponsibleId())
                    .map(User::getName)
                    .orElse(r.getResponsibleName());
        }
        return (r.getResponsibleName() == null || r.getResponsibleName().trim().isEmpty()) 
                ? u.getName() : r.getResponsibleName();
    }

    /**
     * Resuelve conflictos cuando se crea un BLOQUEO administrativo.
     * Cancela todas las reservas ordinarias (APROBADAS) que solapen con el nuevo bloqueo.
     */
    private void resolveConflictsForBlock(List<Long> spaceIds, LocalDateTime start, LocalDateTime end, Long excludeId) {
        List<Reservation> conflicts = (excludeId == null)
            ? reservationRepository.findOverlappingReservationsInSpaces(spaceIds, start, end)
            : reservationRepository.findOverlappingInSpacesExcludingId(spaceIds, start, end, excludeId);

        for (Reservation res : conflicts) {
            // Solo cancelamos si es una reserva estándar (APROBADA o SOLICITADA)
            // No deberíamos llegar aquí si hay otro BLOQUEO porque lo valida el Validator
            if (res.getStatus() == ReservationStatus.APROBADA || res.getStatus() == ReservationStatus.SOLICITADA) {
                log.info("Cancelando reserva {} por conflicto con nuevo bloqueo administrativo", res.getId());
                
                res.setStatus(ReservationStatus.CANCELADA);
                res.setRejectionReason("Cancelación automática: El espacio ha sido bloqueado por administración para este horario.");
                
                reservationRepository.save(res);
                
                // Disparamos el evento para que se envíe la notificación al usuario afectado
                eventPublisher.publishEvent(new ReservationEvent(this, res, ReservationEvent.ReservationAction.CANCEL));
            }
        }
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public com.tfg.backend.core.common.BulkConflictSummaryDTO getBulkReservationConflictSummary(List<Long> ids) {
        return com.tfg.backend.core.util.BulkConflictHelper.buildSummary(
                ids,
                id -> reservationRepository.findById(id).orElse(null),
                res -> res.getTitle() + " (" + res.getStartTime() + ")",
                res -> (long) checkConflicts(
                        res.getSpaces().stream().map(Space::getId).toList(),
                        res.getStartTime(),
                        res.getEndTime(),
                        res.getId()
                ).size()
        );
    }
}
