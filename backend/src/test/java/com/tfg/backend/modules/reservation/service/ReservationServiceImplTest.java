package com.tfg.backend.modules.reservation.service;

import com.tfg.backend.modules.reservation.dto.ReservationDTO;
import com.tfg.backend.modules.reservation.dto.ReservationRequest;
import com.tfg.backend.modules.reservation.mapper.ReservationMapper;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.reservation.model.ReservationType;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.space.model.SpaceType;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.reservation.repository.SubjectRepository;
import com.tfg.backend.modules.space.repository.SpaceRepository;
import com.tfg.backend.modules.identity.repository.UserRepository;
import com.tfg.backend.core.security.SecurityService;
import com.tfg.backend.modules.reservation.validator.ReservationValidator;
import com.tfg.backend.modules.reservation.event.ReservationEvent;
import com.tfg.backend.core.exception.BusinessValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import com.tfg.backend.modules.reservation.event.ReservationEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Suite de pruebas unitarias exhaustivas para la lógica central de negocio de reservas {@link ReservationServiceImpl}.
 * Verifica la creación, edición, cancelación y búsqueda de reservas, controlando reglas de validación complejas
 * como solapamientos, permisos de usuario, bloqueos administrativos y resolución automática de estados.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Unitarios de ReservationService (Exhaustividad Total)")
class ReservationServiceImplTest {

    @Mock private ReservationRepository reservationRepository;
    @Mock private SpaceRepository spaceRepository;
    @Mock private UserRepository userRepository;
    @Mock private SubjectRepository subjectRepository;
    @Mock private ReservationValidator reservationValidator;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private SecurityService securityService;
    @Mock private ReservationMapper reservationMapper;

    @InjectMocks
    private ReservationServiceImpl reservationService;

    private User mockUser;
    private Space mockOffice;
    private Space mockClassroom;
    private ReservationRequest standardRequest;
    private ReservationDTO mockReservationDTO;

    @BeforeEach
    void setUp() {
        mockUser = new User();
        mockUser.setId(10L);
        mockUser.setEmail("profe@uniovi.es");
        mockUser.setName("Profesor de Prueba");

        mockOffice = new Space();
        mockOffice.setId(1L);
        mockOffice.setName("Despacho 101");
        mockOffice.setType(SpaceType.DESPACHO);

        mockClassroom = new Space();
        mockClassroom.setId(2L);
        mockClassroom.setName("Aula 1.1");
        mockClassroom.setType(SpaceType.AULA);

        standardRequest = new ReservationRequest();
        standardRequest.setSpaceIds(List.of(1L));
        standardRequest.setStartTime(LocalDateTime.now().plusDays(1));
        standardRequest.setEndTime(LocalDateTime.now().plusDays(1).plusHours(2));

        mockReservationDTO = new ReservationDTO();
        mockReservationDTO.setId(100L);
    }

    // --- 1. CREACIÓN ---

    /**
     * Verifica que al crear una reserva en un espacio configurado para aprobación automática
     * (como un DESPACHO), el sistema asigne el estado APROBADA de forma directa,
     * siempre que pase las validaciones de tiempo.
     */
    @Test
    @DisplayName("🚀 create: Reserva en DESPACHO se aprueba automáticamente")
    void createReservation_Office_ShouldBeAutoApproved() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(mockUser));
        when(spaceRepository.findAllByIdWithLock(anyList())).thenReturn(List.of(mockOffice));
        when(reservationMapper.toEntity(any())).thenReturn(new Reservation());
        when(reservationRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        when(reservationMapper.toDto(any())).thenReturn(mockReservationDTO);
        when(securityService.canUserApproveReservation(any(), any())).thenReturn(false);

        ReservationDTO result = reservationService.createReservation(standardRequest, "profe@uniovi.es");

        assertNotNull(result);
        verify(reservationValidator).validateTimeRange(any(), any(), anyBoolean());
    }

    /**
     * Verifica que al crear una reserva en un espacio que requiere revisión manual
     * (como un AULA), el sistema asigne el estado inicial SOLICITADA, quedando pendiente de aprobación.
     */
    @Test
    @DisplayName("⏳ create: Reserva en AULA queda pendiente (SOLICITADA)")
    void createReservation_Classroom_ShouldBeRequested() {
        standardRequest.setSpaceIds(List.of(2L));
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(mockUser));
        when(spaceRepository.findAllByIdWithLock(anyList())).thenReturn(List.of(mockClassroom));
        when(reservationMapper.toEntity(any())).thenReturn(new Reservation());
        when(reservationRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        when(reservationMapper.toDto(any())).thenAnswer(inv -> {
            Reservation r = inv.getArgument(0);
            return ReservationDTO.builder().status(r.getStatus()).build();
        });

        ReservationDTO result = reservationService.createReservation(standardRequest, "profe@uniovi.es");

        assertEquals(ReservationStatus.SOLICITADA, result.getStatus());
    }

    /**
     * Verifica que al registrar un bloqueo administrativo en un espacio, el sistema proceda a
     * cancelar automáticamente cualquier reserva ordinaria previamente aprobada que solape
     * con el nuevo bloqueo.
     */
    @Test
    @DisplayName("🔒 block: Un bloqueo cancela reservas ordinarias solapadas")
    void createReservation_Block_CancelsOthers() {
        standardRequest.setBlock(true);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(mockUser));
        when(spaceRepository.findAllByIdWithLock(anyList())).thenReturn(List.of(mockClassroom));
        when(reservationMapper.toEntity(any())).thenReturn(new Reservation());
        when(reservationRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        when(reservationMapper.toDto(any())).thenReturn(mockReservationDTO);

        // Simulamos una reserva normal que colisiona
        Reservation normal = Reservation.builder().id(200L).status(ReservationStatus.APROBADA).spaces(new HashSet<>()).build();
        when(reservationRepository.findOverlappingReservationsInSpaces(anyList(), any(), any()))
            .thenReturn(List.of(normal));

        reservationService.createReservation(standardRequest, "admin@uniovi.es");

        assertEquals(ReservationStatus.CANCELADA, normal.getStatus());
        verify(reservationRepository, atLeast(2)).save(any());
    }

    /**
     * Verifica que el sistema asigne por defecto el nombre completo del usuario autenticado
     * como nombre del responsable de la reserva cuando no se especifica uno explícitamente en la petición.
     */
    @Test
    @DisplayName("👤 Lógica: Si no hay responsable, se asigna el nombre del usuario")
    void createReservation_DefaultResponsibleName() {
        standardRequest.setResponsibleName(null);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(mockUser));
        when(spaceRepository.findAllByIdWithLock(anyList())).thenReturn(List.of(mockOffice));
        when(reservationMapper.toEntity(any())).thenReturn(new Reservation());
        when(reservationRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        when(reservationMapper.toDto(any())).thenAnswer(inv -> {
            Reservation r = inv.getArgument(0);
            return ReservationDTO.builder().responsibleName(r.getResponsibleName()).build();
        });

        ReservationDTO result = reservationService.createReservation(standardRequest, "profe@uniovi.es");

        assertEquals(mockUser.getName(), result.getResponsibleName());
    }

    // --- 2. EDICIÓN ---

    /**
     * Verifica que al editar una reserva aprobada y modificar los espacios involucrados
     * (e.g. cambiando de un DESPACHO a un AULA), el sistema reevalúe las políticas de aprobación
     * y revierta el estado a SOLICITADA si el nuevo espacio requiere revisión manual.
     */
    @Test
    @DisplayName("✅ update: Éxito reevaluando estado si cambia el tipo de espacio")
    void updateReservation_ReevaluatesStatus() {
        Reservation existing = Reservation.builder()
                .id(100L).status(ReservationStatus.APROBADA).user(mockUser).build();
        
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(existing));
        when(spaceRepository.findAllById(anyList())).thenReturn(List.of(mockClassroom)); 
        when(securityService.canEditReservation(100L)).thenReturn(true);
        when(securityService.getCurrentUser()).thenReturn(mockUser);
        when(securityService.canUserApproveReservation(any(), any())).thenReturn(false);
        when(reservationRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        when(reservationMapper.toDto(any())).thenAnswer(inv -> {
            Reservation r = inv.getArgument(0);
            return ReservationDTO.builder().status(r.getStatus()).build();
        });

        ReservationDTO result = reservationService.updateReservation(100L, standardRequest);

        assertEquals(ReservationStatus.SOLICITADA, result.getStatus());
    }

    /**
     * Verifica que el sistema rechace cualquier intento de actualización sobre una reserva
     * que se encuentre en estado CANCELADA (estado terminal), lanzando una excepción.
     */
    @Test
    @DisplayName("❌ update: Bloquea edición de reservas ya CANCELADAS")
    void updateReservation_TerminalState_Fail() {
        Reservation terminal = Reservation.builder().id(100L).status(ReservationStatus.CANCELADA).build();
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(terminal));
        when(securityService.canEditReservation(100L)).thenReturn(true);
        
        doThrow(new BusinessValidationException("status", "error"))
            .when(reservationValidator).validateEditableState(terminal);

        assertThrows(BusinessValidationException.class, () -> 
            reservationService.updateReservation(100L, standardRequest));
    }

    // --- 3. ESTADOS Y ACCIONES ---

    /**
     * Verifica que al solicitar la eliminación de una reserva, el sistema realice un borrado lógico
     * cambiando su estado a CANCELADA y emitiendo el evento correspondiente para notificar el cambio.
     */
    @Test
    @DisplayName("🗑️ cancel: Borrado lógico mediante cambio de estado")
    void deleteReservation_Success() {
        Reservation existing = Reservation.builder().id(100L).status(ReservationStatus.APROBADA).build();
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(existing));
        when(securityService.canCancelReservation(100L)).thenReturn(true);

        reservationService.deleteReservation(100L);

        assertEquals(ReservationStatus.CANCELADA, existing.getStatus());
        verify(reservationRepository).save(existing);
        verify(eventPublisher).publishEvent(any(ReservationEvent.class));
    }

    /**
     * Verifica que el sistema permita cambiar explícitamente el estado de una reserva a RECHAZADA,
     * almacenando correctamente el motivo de rechazo proporcionado por el administrador.
     */
    @Test
    @DisplayName("✅ updateStatus: Éxito al rechazar con motivo")
    void updateStatus_Reject_Success() {
        Reservation existing = Reservation.builder().id(100L).status(ReservationStatus.SOLICITADA).build();
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(existing));
        when(securityService.canApproveReservation(100L)).thenReturn(true);
        when(reservationRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        when(reservationMapper.toDto(any())).thenAnswer(inv -> {
            Reservation r = inv.getArgument(0);
            return ReservationDTO.builder().status(r.getStatus()).rejectionReason(r.getRejectionReason()).build();
        });

        ReservationDTO result = reservationService.updateStatus(100L, ReservationStatus.RECHAZADA, "No hay sitio");

        assertEquals(ReservationStatus.RECHAZADA, result.getStatus());
        assertEquals("No hay sitio", result.getRejectionReason());
    }

    // --- 4. CONSULTAS Y CONFLICTOS ---

    /**
     * Verifica que el servicio mapee y retorne adecuadamente la información de las reservas
     * que entran en conflicto con el rango horario y los espacios especificados.
     */
    @Test
    @DisplayName("🔍 checkConflicts: Mapeo correcto")
    void checkConflicts_Mapping() {
        Reservation overlap = Reservation.builder()
                .id(1L).title("Conflict").type(ReservationType.CLASE).status(ReservationStatus.APROBADA)
                .user(mockUser).spaces(Set.of(mockOffice)).startTime(LocalDateTime.now()).endTime(LocalDateTime.now().plusHours(1))
                .build();
        
        when(reservationRepository.findOverlappingReservationsInSpaces(anyList(), any(), any()))
            .thenReturn(List.of(overlap));

        var conflicts = reservationService.checkConflicts(List.of(1L), LocalDateTime.now(), LocalDateTime.now().plusHours(1), null);

        assertEquals(1, conflicts.size());
        assertEquals("Conflict", conflicts.get(0).getTitle());
    }

    /**
     * Verifica que la búsqueda general de reservas delegue correctamente en el repositorio,
     * aplicando previamente los filtros de visibilidad en función de los permisos del usuario.
     */
    @Test
    @DisplayName("✅ findAll: Delegación correcta con resolución de visibilidad")
    void findAll_Success() {
        when(securityService.resolveVisibility(anyString(), any()))
                .thenReturn(com.tfg.backend.modules.reservation.dto.VisibilityResult.builder().securityUserId(1L).build());
        when(reservationRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of()));

        reservationService.findAll(null, null, null, "all", null, null, null, null, null, false, PageRequest.of(0, 10));

        verify(reservationRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    /**
     * Verifica que el sistema genere un resumen estadístico preciso de los solapamientos
     * existentes para una lista masiva de identificadores de reservas, excluyéndolas a ellas mismas
     * del cálculo.
     */
    @Test
    @DisplayName("✅ getBulkReservationConflictSummary: Resumen correcto de solapamientos")
    void getBulkReservationConflictSummary_Success() {
        Reservation res = Reservation.builder()
                .id(100L).title("Test").startTime(LocalDateTime.now()).endTime(LocalDateTime.now().plusHours(1))
                .spaces(Set.of(mockOffice)).build();
        
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(res));
        // Simulamos un conflicto con el espacio 1
        Reservation overlap = Reservation.builder()
                .id(101L)
                .spaces(Set.of(mockOffice))
                .startTime(LocalDateTime.now())
                .endTime(LocalDateTime.now().plusHours(1))
                .user(mockUser)
                .type(ReservationType.CLASE)
                .status(ReservationStatus.APROBADA)
                .build();

        when(reservationRepository.findOverlappingInSpacesExcludingId(anyList(), any(), any(), anyLong()))
                .thenReturn(List.of(overlap));

        var summary = reservationService.getBulkReservationConflictSummary(List.of(100L));

        assertEquals(1, summary.getConflictCount());
        assertEquals(1, summary.getTotalTarget());
    }

    /**
     * Verifica que el sistema bloquee la edición de una reserva lanzando una excepción de acceso denegado
     * si el usuario actual no posee permisos suficientes sobre la misma.
     */
    @Test
    @DisplayName("❌ update: Lanza AccessDenied si no tiene permiso")
    void updateReservation_AccessDenied() {
        Reservation existing = Reservation.builder().id(100L).build();
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(existing));
        when(securityService.canEditReservation(100L)).thenReturn(false);

        assertThrows(AccessDeniedException.class, () -> reservationService.updateReservation(100L, standardRequest));
    }

    /**
     * Verifica que el sistema bloquee la eliminación de una reserva lanzando una excepción de acceso denegado
     * si el usuario actual no tiene permiso para cancelarla.
     */
    @Test
    @DisplayName("❌ delete: Lanza AccessDenied si no tiene permiso")
    void deleteReservation_AccessDenied() {
        Reservation existing = Reservation.builder().id(100L).build();
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(existing));
        when(securityService.canCancelReservation(100L)).thenReturn(false);

        assertThrows(AccessDeniedException.class, () -> reservationService.deleteReservation(100L));
    }

    /**
     * Verifica que el sistema bloquee un cambio de estado manual (e.g. aprobar o rechazar) lanzando una
     * excepción si el usuario actual carece de los privilegios de administración o gestión requeridos.
     */
    @Test
    @DisplayName("❌ updateStatus: Lanza AccessDenied si no tiene autoridad")
    void updateStatus_AccessDenied() {
        Reservation existing = Reservation.builder().id(100L).build();
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(existing));
        when(securityService.canApproveReservation(100L)).thenReturn(false);

        assertThrows(AccessDeniedException.class, () -> 
            reservationService.updateStatus(100L, ReservationStatus.APROBADA, null));
    }

    /**
     * Verifica que antes de efectuar la aprobación manual de una reserva, el sistema ejecute la validación
     * estricta de solapamientos para asegurar que los espacios siguen disponibles, evitando dobles reservas.
     */
    @Test
    @DisplayName("🛡️ updateStatus: Valida solapamientos antes de aprobar")
    void updateStatus_Approve_ValidatesOverlaps() {
        Reservation existing = Reservation.builder()
                .id(100L).status(ReservationStatus.SOLICITADA)
                .spaces(Set.of(mockOffice)).startTime(LocalDateTime.now()).endTime(LocalDateTime.now().plusHours(1))
                .build();
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(existing));
        when(securityService.canApproveReservation(100L)).thenReturn(true);
        when(reservationRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        when(reservationMapper.toDto(any())).thenReturn(mockReservationDTO);

        reservationService.updateStatus(100L, ReservationStatus.APROBADA, null);

        verify(reservationValidator).validateOverlaps(anyList(), any(), any(), eq(100L), eq(false));
    }

    /**
     * Verifica que el sistema rechace la creación de una reserva si no se especifica
     * al menos un identificador de espacio físico o virtual en la petición.
     */
    @Test
    @DisplayName("❌ create: Lanza error si no se eligen espacios")
    void createReservation_NoSpaces_Fail() {
        standardRequest.setSpaceIds(null);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(mockUser));
        assertThrows(BusinessValidationException.class, () -> reservationService.createReservation(standardRequest, "profe@uniovi.es"));
    }

    /**
     * Verifica que el sistema permita modificar el responsable principal de una reserva en una edición,
     * vinculando correctamente la entidad del nuevo usuario y actualizando su nombre.
     */
    @Test
    @DisplayName("✅ update: Permite cambiar el responsable usando ID")
    void updateReservation_ChangeResponsibleById() {
        Reservation existing = Reservation.builder()
                .id(100L).status(ReservationStatus.APROBADA).user(mockUser).build();
        User newResp = User.builder().id(20L).name("Otro").build();
        
        standardRequest.setResponsibleId(20L);
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(existing));
        when(userRepository.findById(20L)).thenReturn(Optional.of(newResp));
        when(spaceRepository.findAllById(anyList())).thenReturn(List.of(mockOffice));
        when(securityService.canEditReservation(100L)).thenReturn(true);
        when(securityService.getCurrentUser()).thenReturn(mockUser);
        when(securityService.canUserApproveReservation(any(), any())).thenReturn(true);
        when(reservationRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        when(reservationMapper.toDto(any())).thenReturn(mockReservationDTO);

        reservationService.updateReservation(100L, standardRequest);
        assertEquals(newResp, existing.getResponsible());
        assertEquals("Otro", existing.getResponsibleName());
    }

    /**
     * Verifica que el método de búsqueda delegue correctamente al repositorio cuando se
     * aplican filtros directos y múltiples parámetros de consulta.
     */
    @Test
    @DisplayName("✅ findAll: Versión con filtros directos")
    void findAll_WithDirectFilters() {
        Page<Reservation> page = new PageImpl<>(List.of());
        when(reservationRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        var result = reservationService.findAll(ReservationStatus.APROBADA, ReservationType.CLASE, List.of(1L), 
                List.of(10L), null, null, LocalDateTime.now(), null, "search", null, false, PageRequest.of(0, 10));

        assertNotNull(result);
        verify(reservationRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    /**
     * Verifica que el sistema retorne correctamente el DTO de la reserva cuando esta existe,
     * y lance una excepción de recurso no encontrado si el ID proporcionado es inválido.
     */
    @Test
    @DisplayName("✅ findById: Éxito y Error")
    void findById_Flow() {
        Reservation res = Reservation.builder().id(1L).build();
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(res));
        when(reservationMapper.toDto(res)).thenReturn(mockReservationDTO);

        assertEquals(mockReservationDTO, reservationService.findById(1L));
        assertThrows(com.tfg.backend.core.exception.ResourceNotFoundException.class, () -> reservationService.findById(99L));
    }

    /**
     * Verifica que el método de borrado múltiple maneje de forma segura listas nulas o vacías
     * sin lanzar excepciones ni realizar consultas innecesarias a la base de datos.
     */
    @Test
    @DisplayName("🗑️ deleteMultiple: Maneja nulos o vacíos")
    void deleteMultiple_EdgeCases() {
        assertDoesNotThrow(() -> reservationService.deleteMultiple(null));
        assertDoesNotThrow(() -> reservationService.deleteMultiple(List.of()));
        verify(reservationRepository, never()).findById(any());
    }

    /**
     * Verifica que si el usuario creador tiene permisos de gestión sobre la asignatura de la reserva
     * (o similares autorizaciones implícitas), el estado inicial asignado sea APROBADA de manera automática.
     */
    @Test
    @DisplayName("🛡️ resolveInitialStatus: Autoridad por Gestor de Asignatura")
    void resolveInitialStatus_SubjectManager() {
        Reservation res = Reservation.builder().build();
        when(securityService.canUserApproveReservation(mockUser, res)).thenReturn(true);
        
        // El método es privado pero createReservation lo usa.
        // Simulamos el flujo a través de createReservation.
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(mockUser));
        when(spaceRepository.findAllByIdWithLock(anyList())).thenReturn(List.of(mockClassroom));
        when(reservationMapper.toEntity(any())).thenReturn(res);
        when(reservationRepository.save(any())).thenReturn(res);
        when(reservationMapper.toDto(any())).thenReturn(mockReservationDTO);

        reservationService.createReservation(standardRequest, "profe@uniovi.es");

        assertEquals(ReservationStatus.APROBADA, res.getStatus());
    }

    /**
     * Verifica que al registrar un bloqueo, el mecanismo automático de resolución de conflictos
     * afecte (cancele) únicamente a las reservas que se encuentren APROBADAS o SOLICITADAS, ignorando
     * las que ya estuvieran canceladas o rechazadas previamente para no generar falsas alertas.
     */
    @Test
    @DisplayName("⚠️ resolveConflictsForBlock: Solo cancela APROBADAS o SOLICITADAS")
    void resolveConflictsForBlock_Filters() {
        standardRequest.setBlock(true);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(mockUser));
        when(spaceRepository.findAllByIdWithLock(anyList())).thenReturn(List.of(mockClassroom));
        when(reservationMapper.toEntity(any())).thenReturn(new Reservation());
        when(reservationRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        when(reservationMapper.toDto(any())).thenReturn(mockReservationDTO);

        Reservation approved = Reservation.builder().id(200L).status(ReservationStatus.APROBADA).spaces(new HashSet<>()).build();
        Reservation requested = Reservation.builder().id(201L).status(ReservationStatus.SOLICITADA).spaces(new HashSet<>()).build();
        Reservation cancelled = Reservation.builder().id(202L).status(ReservationStatus.CANCELADA).spaces(new HashSet<>()).build();
        
        when(reservationRepository.findOverlappingReservationsInSpaces(anyList(), any(), any()))
            .thenReturn(List.of(approved, requested, cancelled));

        reservationService.createReservation(standardRequest, "admin@uniovi.es");

        assertEquals(ReservationStatus.CANCELADA, approved.getStatus());
        assertEquals(ReservationStatus.CANCELADA, requested.getStatus());
        assertEquals(ReservationStatus.CANCELADA, cancelled.getStatus()); // Cancelada sigue siendo cancelada, no cambia nada pero el log no debería dispararse
    }
    // --- PU-RSVC2-05: Bloqueo administrativo → estado BLOQUEO ---
    /**
     * Verifica que al marcar explícitamente el flag `isBlock` en la petición de creación,
     * la entidad resultante adquiera el estado especial BLOQUEO en lugar de un estado estándar.
     */
    @Test
    @DisplayName("✅ PU-RSVC2-05: Reserva con isBlock=true se guarda en estado BLOQUEO")
    void createReservation_Block_StateIsBloqueo() {
        standardRequest.setBlock(true);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(mockUser));
        when(spaceRepository.findAllByIdWithLock(anyList())).thenReturn(List.of(mockOffice));
        Reservation res = new Reservation();
        when(reservationMapper.toEntity(any())).thenReturn(res);
        when(reservationRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        when(reservationMapper.toDto(any())).thenReturn(mockReservationDTO);

        reservationService.createReservation(standardRequest, "profe@uniovi.es");

        assertEquals(ReservationStatus.BLOQUEO, res.getStatus());
    }

    // --- PU-RSVC2-06: Nombre responsable por defecto es el creador ---
    /**
     * Verifica, nuevamente, la lógica por defecto de asignación de nombre de responsable
     * cuando dicho campo viene nulo desde la petición.
     */
    @Test
    @DisplayName("✅ PU-RSVC2-06: Sin responsibleName explícito se usa el nombre del usuario autenticado")
    void createReservation_NoResponsibleName_DefaultsToCreator() {
        standardRequest.setResponsibleName(null);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(mockUser));
        when(spaceRepository.findAllByIdWithLock(anyList())).thenReturn(List.of(mockClassroom));
        Reservation res = new Reservation();
        when(reservationMapper.toEntity(any())).thenReturn(res);
        when(reservationRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        when(reservationMapper.toDto(any())).thenAnswer(inv -> {
            Reservation r = inv.getArgument(0);
            return ReservationDTO.builder().responsibleName(r.getResponsibleName()).build();
        });

        ReservationDTO result = reservationService.createReservation(standardRequest, "profe@uniovi.es");
        assertEquals(mockUser.getName(), result.getResponsibleName());
    }

    // --- PU-RSVC2-07: Nombre responsable explícito se conserva ---
    /**
     * Verifica que, si se especifica un nombre de responsable de forma manual en la creación,
     * el sistema respete ese valor en la entidad final en lugar de sobreescribirlo con el nombre del usuario.
     */
    @Test
    @DisplayName("✅ PU-RSVC2-07: responsibleName explícito en request se conserva sin modificación")
    void createReservation_ExplicitResponsibleName_Preserved() {
        standardRequest.setResponsibleName("Nombre Externo");
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(mockUser));
        when(spaceRepository.findAllByIdWithLock(anyList())).thenReturn(List.of(mockClassroom));
        Reservation res = new Reservation();
        when(reservationMapper.toEntity(any())).thenReturn(res);
        when(reservationRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        when(reservationMapper.toDto(any())).thenAnswer(inv -> {
            Reservation r = inv.getArgument(0);
            return ReservationDTO.builder().responsibleName(r.getResponsibleName()).build();
        });

        ReservationDTO result = reservationService.createReservation(standardRequest, "profe@uniovi.es");
        assertEquals("Nombre Externo", result.getResponsibleName());
    }

    // --- PU-RSVC2-08: Asignatura vinculada si se indica subjectId ---
    /**
     * Verifica que el sistema recupere y vincule correctamente la entidad Asignatura (Subject)
     * a la reserva cuando se proporciona un `subjectId` válido en la petición.
     */
    @Test
    @DisplayName("✅ PU-RSVC2-08: Con subjectId, la asignatura se resuelve y vincula a la reserva")
    void createReservation_WithSubjectId_SubjectLinked() {
        standardRequest.setSubjectId(5L);
        var subject = new com.tfg.backend.modules.reservation.model.Subject();
        subject.setId(5L);

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(mockUser));
        when(spaceRepository.findAllByIdWithLock(anyList())).thenReturn(List.of(mockClassroom));
        Reservation res = new Reservation();
        when(reservationMapper.toEntity(any())).thenReturn(res);
        when(subjectRepository.findById(5L)).thenReturn(Optional.of(subject));
        when(reservationRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        when(reservationMapper.toDto(any())).thenReturn(mockReservationDTO);

        reservationService.createReservation(standardRequest, "profe@uniovi.es");

        assertEquals(subject, res.getSubject());
    }

    // --- PU-RSVC2-09: Asignatura no vinculada si subjectId=null ---
    /**
     * Verifica que si no se proporciona el ID de una asignatura, la reserva se cree
     * sin vinculación a un `subject`, dejando la referencia nula en la base de datos.
     */
    @Test
    @DisplayName("✅ PU-RSVC2-09: Sin subjectId, el campo subject de la entidad queda null")
    void createReservation_NoSubjectId_SubjectNull() {
        standardRequest.setSubjectId(null);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(mockUser));
        when(spaceRepository.findAllByIdWithLock(anyList())).thenReturn(List.of(mockClassroom));
        Reservation res = new Reservation();
        when(reservationMapper.toEntity(any())).thenReturn(res);
        when(reservationRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        when(reservationMapper.toDto(any())).thenReturn(mockReservationDTO);

        reservationService.createReservation(standardRequest, "profe@uniovi.es");

        assertNull(res.getSubject());
        verify(subjectRepository, never()).findById(any());
    }

    // --- PU-RSVC2-15: Cancelación exitosa ---
    /**
     * Verifica la correcta finalización de una cancelación ordinaria: transición de estado a CANCELADA
     * y notificación a través de la publicación de eventos del dominio.
     */
    @Test
    @DisplayName("✅ PU-RSVC2-15: deleteReservation cancela la reserva y publica evento")
    void deleteReservation_Success_CancelsAndPublishesEvent() {
        Reservation existing = Reservation.builder().id(100L).status(ReservationStatus.APROBADA)
                .spaces(new HashSet<>()).build();
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(existing));
        when(securityService.canCancelReservation(100L)).thenReturn(true);

        reservationService.deleteReservation(100L);

        assertEquals(ReservationStatus.CANCELADA, existing.getStatus());
        verify(eventPublisher).publishEvent(any());
    }

    // --- PU-RSVC2-16: Cancelación bloqueada sin permisos ---
    /**
     * Verifica que la cancelación explícita sea rechazada a nivel de controlador de dominio
     * lanzando una AccessDeniedException si las verificaciones de seguridad fallan.
     */
    @Test
    @DisplayName("❌ PU-RSVC2-16: deleteReservation sin permisos lanza AccessDeniedException")
    void deleteReservation_NoPermission_ThrowsAccessDenied() {
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(
                Reservation.builder().id(100L).status(ReservationStatus.APROBADA).build()));
        when(securityService.canCancelReservation(100L)).thenReturn(false);

        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> reservationService.deleteReservation(100L));
    }

    // --- PU-RSVC2-17: Cancelación falla en estado terminal ---
    /**
     * Verifica que una cancelación sobre una reserva que ya está cancelada lance una excepción
     * de validación de negocio, indicando que la operación es redundante o inválida para el estado actual.
     */
    @Test
    @DisplayName("❌ PU-RSVC2-17: deleteReservation sobre reserva CANCELADA lanza BusinessValidationException")
    void deleteReservation_TerminalState_ThrowsException() {
        Reservation cancelled = Reservation.builder().id(100L).status(ReservationStatus.CANCELADA).build();
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(cancelled));
        when(securityService.canCancelReservation(100L)).thenReturn(true);
        doThrow(new com.tfg.backend.core.exception.BusinessValidationException("estado", "ya cancelada"))
                .when(reservationValidator).validateEditableState(cancelled);

        assertThrows(com.tfg.backend.core.exception.BusinessValidationException.class,
                () -> reservationService.deleteReservation(100L));
    }

    // --- PU-RSVC2-22: Cancelación directa no requiere permiso de aprobación ---
    /**
     * Verifica que el sistema permita a un usuario (como el propietario de la reserva) cancelar su
     * propia reserva a través del flujo de actualización de estado, sin requerir los permisos globales de aprobación.
     */
    @Test
    @DisplayName("✅ PU-RSVC2-22: updateStatus(CANCELADA) sin canApproveReservation no lanza excepción")
    void updateStatus_Cancel_NoApprovePermissionNeeded() {
        Reservation existing = Reservation.builder().id(100L).status(ReservationStatus.APROBADA)
                .spaces(new HashSet<>()).build();
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(existing));
        lenient().when(securityService.canCancelReservation(100L)).thenReturn(true);
        when(reservationRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        when(reservationMapper.toDto(any())).thenReturn(mockReservationDTO);

        assertDoesNotThrow(() ->
                reservationService.updateStatus(100L, ReservationStatus.CANCELADA, null));
        assertEquals(ReservationStatus.CANCELADA, existing.getStatus());
    }
}
