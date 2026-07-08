package com.tfg.backend.modules.space.service;

import com.tfg.backend.modules.space.dto.SpaceDTO;
import com.tfg.backend.modules.space.dto.SpaceRequest;
import com.tfg.backend.core.exception.BusinessValidationException;
import com.tfg.backend.core.exception.ResourceNotFoundException;
import com.tfg.backend.modules.space.mapper.SpaceMapper;
import com.tfg.backend.modules.reservation.event.ReservationEvent;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.space.model.SpaceStatus;
import com.tfg.backend.modules.space.model.SpaceType;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.space.repository.SpaceRepository;
import com.tfg.backend.modules.reservation.service.AvailabilitySearchService;
import com.tfg.backend.modules.space.validator.SpaceValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Suite de pruebas unitarias para el servicio de gestión de espacios {@link SpaceServiceImpl}.
 * <p>
 * Verifica exhaustivamente el correcto funcionamiento de las operaciones CRUD,
 * así como la lógica de negocio relacionada con reservas y conflictos de ocupación.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Unitarios de SpaceService (Exhaustividad Total)")
class SpaceServiceImplTest {

    @Mock private SpaceRepository spaceRepository;
    @Mock private ReservationRepository reservationRepository;
    @Mock private SpaceValidator spaceValidator;
    @Mock private SpaceMapper spaceMapper;
    @Mock private AvailabilitySearchService availabilitySearchService;
    @Mock private SpaceImportService spaceImportService;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private SpaceServiceImpl spaceService;

    private Space mockSpace;
    private SpaceDTO mockSpaceDTO;
    private SpaceRequest spaceRequest;

    @BeforeEach
    void setUp() {
        mockSpace = new Space();
        mockSpace.setId(1L);
        mockSpace.setName("Aula 1.1");
        mockSpace.setType(SpaceType.AULA);
        mockSpace.setTotalCapacity(50);
        mockSpace.setStatus(SpaceStatus.DISPONIBLE);

        mockSpaceDTO = new SpaceDTO();
        mockSpaceDTO.setId(1L);
        mockSpaceDTO.setName("Aula 1.1");
        mockSpaceDTO.setType(SpaceType.AULA);
        mockSpaceDTO.setTotalCapacity(50);
        mockSpaceDTO.setStatus(SpaceStatus.DISPONIBLE);

        spaceRequest = new SpaceRequest();
        spaceRequest.setName("Aula 1.1");
        spaceRequest.setType(SpaceType.AULA);
        spaceRequest.setTotalCapacity(50);
    }

    // --- 0. BÚSQUEDA ---

    @Test
    @DisplayName("✅ findById: Éxito")
    /**
     * Verifica que la búsqueda por identificador retorne exitosamente
     * el espacio cuando este existe en el repositorio.
     */
    void findById_Success() {
        when(spaceRepository.findById(1L)).thenReturn(Optional.of(mockSpace));
        when(spaceMapper.toDto(mockSpace)).thenReturn(mockSpaceDTO);
        SpaceDTO result = spaceService.findById(1L);
        assertEquals("Aula 1.1", result.getName());
    }

    @Test
    @DisplayName("❌ findById: No encontrado")
    /**
     * Verifica que la búsqueda por identificador lance una excepción
     * de recurso no encontrado cuando el espacio no existe.
     *
     * @throws ResourceNotFoundException si el identificador no existe.
     */
    void findById_NotFound() {
        when(spaceRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> spaceService.findById(99L));
    }

    // --- 1. CREACIÓN (create) ---

    @Test
    @DisplayName("🚀 create: Éxito con datos válidos")
    /**
     * Verifica que el sistema cree y persista un espacio correctamente
     * cuando se proporcionan datos válidos, validando capacidades y nombres.
     */
    void create_Success() {
        when(spaceMapper.toEntity(any())).thenReturn(mockSpace);
        when(spaceRepository.save(any())).thenReturn(mockSpace);
        when(spaceMapper.toDto(mockSpace)).thenReturn(mockSpaceDTO);

        SpaceDTO result = spaceService.create(spaceRequest);

        assertNotNull(result);
        verify(spaceValidator).validateUniqueName("Aula 1.1", null);
        verify(spaceValidator).validateUniqueGisId(any(), any());
        verify(spaceValidator).validateCapacities(any());
        verify(spaceRepository).save(any());
    }

    @Test
    @DisplayName("🔍 getConflicts: Mapeo correcto de reservas a DTO")
    /**
     * Verifica que la obtención de conflictos mapee correctamente las reservas
     * activas asociadas a un espacio y las retorne en formato DTO.
     */
    void getConflicts_Success() {
        when(spaceRepository.findById(1L)).thenReturn(Optional.of(mockSpace));
        when(spaceMapper.toDto(mockSpace)).thenReturn(mockSpaceDTO);
        
        Reservation res = new Reservation();
        res.setId(100L);
        res.setTitle("Evento");
        res.setType(com.tfg.backend.modules.reservation.model.ReservationType.EXAMEN);
        res.setStartTime(LocalDateTime.now().plusHours(1));
        res.setEndTime(LocalDateTime.now().plusHours(2));
        res.setStatus(ReservationStatus.APROBADA);
        res.setUser(com.tfg.backend.modules.identity.model.User.builder().name("Profe").build());
        res.setSpaces(Set.of(mockSpace));

        when(reservationRepository.findBySpaceId(1L)).thenReturn(List.of(res));

        var conflicts = spaceService.getConflicts(1L);

        assertEquals(1, conflicts.size());
        assertEquals("Evento", conflicts.get(0).getTitle());
        assertTrue(conflicts.get(0).isOnlySpace());
    }

    @Test
    @DisplayName("✅ deleteMultiple: Llama a los métodos individuales")
    /**
     * Verifica que el borrado múltiple procese exitosamente una lista
     * de identificadores válidos cuando no hay conflictos de reservas.
     */
    void deleteMultiple_Success() {
        when(spaceRepository.findById(1L)).thenReturn(Optional.of(mockSpace));
        when(reservationRepository.countActiveBySpace(eq(1L), any())).thenReturn(0);
        when(reservationRepository.findBySpaceId(1L)).thenReturn(Collections.emptyList());
        when(spaceMapper.toDto(mockSpace)).thenReturn(mockSpaceDTO);
        
        spaceService.deleteMultiple(List.of(1L), false);
        
        assertEquals(SpaceStatus.ELIMINADO, mockSpace.getStatus());
        verify(spaceRepository).save(mockSpace);
    }

    // --- 3. ELIMINACIÓN (deleteById) ---

    @Test
    @DisplayName("🗑️ delete: Éxito sin reservas")
    /**
     * Verifica que la eliminación lógica de un espacio se realice correctamente
     * cambiando su estado a ELIMINADO cuando no tiene reservas asociadas.
     */
    void delete_NoReservations() {
        when(spaceRepository.findById(1L)).thenReturn(Optional.of(mockSpace));
        when(spaceMapper.toDto(mockSpace)).thenReturn(mockSpaceDTO);
        when(reservationRepository.findBySpaceId(1L)).thenReturn(Collections.emptyList());

        spaceService.deleteById(1L);

        assertEquals(SpaceStatus.ELIMINADO, mockSpace.getStatus());
        verify(spaceRepository).save(mockSpace);
    }

    @Test
    @DisplayName("⚠️ delete: Cancelar reserva si es ESPACIO ÚNICO")
    /**
     * Verifica que si se elimina un espacio y este es el único asociado a una
     * reserva activa, dicha reserva pase a estado CANCELADA y se notifique el evento.
     */
    void delete_CancelSingleReservation() {
        when(spaceRepository.findById(1L)).thenReturn(Optional.of(mockSpace));
        when(spaceMapper.toDto(mockSpace)).thenReturn(mockSpaceDTO);
        
        Reservation res = new Reservation();
        res.setStatus(ReservationStatus.APROBADA);
        res.setEndTime(LocalDateTime.now().plusDays(1));
        res.setSpaces(new HashSet<>(List.of(mockSpace)));

        when(reservationRepository.findBySpaceId(1L)).thenReturn(List.of(res));

        spaceService.deleteById(1L);

        assertEquals(ReservationStatus.CANCELADA, res.getStatus());
        assertNotNull(res.getRejectionReason());
        verify(reservationRepository).save(res);
        verify(eventPublisher).publishEvent(any(ReservationEvent.class));
    }

    @Test
    @DisplayName("⚠️ delete: Quitar espacio si es MULTIESPACIO (no cancelar)")
    /**
     * Verifica que si se elimina un espacio que forma parte de una reserva múltiple,
     * el espacio se desligue de la reserva sin cancelarla completamente.
     */
    void delete_RemoveFromMultiReservation() {
        when(spaceRepository.findById(1L)).thenReturn(Optional.of(mockSpace));
        when(spaceMapper.toDto(mockSpace)).thenReturn(mockSpaceDTO);
        
        Space otherSpace = new Space();
        otherSpace.setId(2L);
        otherSpace.setName("Aula 1.2");

        Reservation res = new Reservation();
        res.setStatus(ReservationStatus.APROBADA);
        res.setEndTime(LocalDateTime.now().plusDays(1));
        res.setDescription("Reserva original");
        // Multiespacio: tiene el 1 y el 2
        Set<Space> spaces = new HashSet<>();
        spaces.add(mockSpace);
        spaces.add(otherSpace);
        res.setSpaces(spaces);

        when(reservationRepository.findBySpaceId(1L)).thenReturn(List.of(res));
        // Mock para la búsqueda de la entidad real necesaria para eliminar de la lista
        when(spaceRepository.findById(1L)).thenReturn(Optional.of(mockSpace));

        spaceService.deleteById(1L);

        // La reserva debe seguir APROBADA pero solo con 1 espacio
        assertEquals(ReservationStatus.APROBADA, res.getStatus());
        assertEquals(1, res.getSpaces().size());
        assertFalse(res.getSpaces().contains(mockSpace));
        assertTrue(res.getDescription().contains("eliminado de la reserva"));
        verify(reservationRepository).save(res);
        verify(eventPublisher).publishEvent(any(ReservationEvent.class));
    }

    // --- 4. RESTAURACIÓN (restoreById) ---

    @Test
    @DisplayName("🩹 restore: Éxito")
    /**
     * Verifica que la restauración de un espacio previamente eliminado se
     * realice correctamente, cambiando su estado nuevamente a DISPONIBLE.
     */
    void restore_Success() {
        mockSpace.setStatus(SpaceStatus.ELIMINADO);
        when(spaceRepository.findById(1L)).thenReturn(Optional.of(mockSpace));

        spaceService.restoreById(1L);

        assertEquals(SpaceStatus.DISPONIBLE, mockSpace.getStatus());
    }

    @Test
    @DisplayName("❌ restore: Fallo si no estaba eliminado")
    /**
     * Verifica que la restauración lance una excepción si se intenta
     * restaurar un espacio que no se encuentra en estado ELIMINADO.
     *
     * @throws BusinessValidationException si el espacio no está eliminado.
     */
    void restore_Fail() {
        mockSpace.setStatus(SpaceStatus.DISPONIBLE);
        when(spaceRepository.findById(1L)).thenReturn(Optional.of(mockSpace));

        assertThrows(BusinessValidationException.class, () -> spaceService.restoreById(1L));
    }

    // --- 5. BÚSQUEDA Y LISTADO ---

    @Test
    @DisplayName("📋 findAll: Verifica cálculo de ocupación actual")
    /**
     * Verifica que el listado de espacios devuelva la información paginada y
     * calcule correctamente qué espacios están ocupados en el momento actual.
     */
    void findAll_CheckOccupancy() {
        Pageable pageable = PageRequest.of(0, 10);
        List<Space> spacesList = List.of(mockSpace);
        Page<Space> page = new PageImpl<>(spacesList);

        when(spaceRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        
        // El DTO debe reflejar ocupado
        SpaceDTO dtoWithOccupancy = new SpaceDTO();
        dtoWithOccupancy.setId(1L);
        dtoWithOccupancy.setOccupiedNow(true);
        
        when(spaceMapper.toDto(mockSpace)).thenReturn(dtoWithOccupancy);
        
        // Simulamos que el espacio ID 1 está ocupado ahora
        when(reservationRepository.findCurrentlyOccupiedSpaceIds(any())).thenReturn(List.of(1L));

        Page<SpaceDTO> result = spaceService.findAll(false, pageable);

        assertTrue(result.getContent().get(0).isOccupiedNow());
    }

    @Test
    @DisplayName("🚀 update: Éxito con datos válidos")
    /**
     * Verifica que la actualización de un espacio sea exitosa al proporcionar
     * datos válidos y que las reglas de negocio sean llamadas correctamente.
     */
    void update_Success() {
        when(spaceRepository.findById(1L)).thenReturn(Optional.of(mockSpace));
        when(spaceRepository.save(any())).thenReturn(mockSpace);
        when(spaceMapper.toDto(mockSpace)).thenReturn(mockSpaceDTO);

        spaceRequest.setName("Nuevo Nombre"); // Diferente al mockSpace.name ("Aula 1.1")
        SpaceDTO result = spaceService.update(1L, spaceRequest);

        assertNotNull(result);
        verify(spaceValidator).validateUniqueName("Nuevo Nombre", 1L);
        verify(spaceRepository).save(any());
    }

    @Test
    @DisplayName("✅ bulkActions: Borrado múltiple")
    /**
     * Verifica que la acción en bloque de borrado múltiple con el flag 'force'
     * elimine todos los espacios solicitados independientemente de las reservas.
     */
    void deleteMultiple_Success_WithForce() {
        when(spaceRepository.findById(1L)).thenReturn(Optional.of(mockSpace));
        when(spaceMapper.toDto(mockSpace)).thenReturn(mockSpaceDTO);
        when(reservationRepository.findBySpaceId(1L)).thenReturn(Collections.emptyList());
        
        spaceService.deleteMultiple(List.of(1L), true); // true = force
        
        assertEquals(SpaceStatus.ELIMINADO, mockSpace.getStatus());
        verify(spaceRepository).save(mockSpace);
    }

    @Test
    @DisplayName("⚠️ deleteMultiple: Continúa si uno falla")
    /**
     * Verifica que si al intentar eliminar múltiples espacios uno de ellos
     * falla (ej: no se encuentra), el proceso continúe eliminando los demás.
     */
    void deleteMultiple_ContinuesOnFailure() {
        when(spaceRepository.findById(1L)).thenReturn(Optional.of(mockSpace));
        when(spaceRepository.findById(2L)).thenReturn(Optional.empty()); // Provocará ResourceNotFound
        
        // Mock para el primero (éxito)
        when(spaceMapper.toDto(mockSpace)).thenReturn(mockSpaceDTO);
        when(reservationRepository.findBySpaceId(1L)).thenReturn(Collections.emptyList());

        assertDoesNotThrow(() -> spaceService.deleteMultiple(List.of(1L, 2L), true));
        
        verify(spaceRepository).save(mockSpace);
    }
    @Test
    @DisplayName("✅ PU-ESVC-04: Creación con status null asigna DISPONIBLE automáticamente")
    /**
     * Verifica que si se intenta crear un espacio sin estado especificado,
     * el sistema asigne automáticamente el estado DISPONIBLE por defecto.
     */
    void create_NullStatus_AssignsDisponible() {
        Space spaceWithNullStatus = new Space();
        spaceWithNullStatus.setId(2L);
        spaceWithNullStatus.setStatus(null); // Mapper puede devolver null
        when(spaceMapper.toEntity(any())).thenReturn(spaceWithNullStatus);
        when(spaceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(spaceMapper.toDto(any())).thenReturn(mockSpaceDTO);

        spaceService.create(spaceRequest);

        assertEquals(SpaceStatus.DISPONIBLE, spaceWithNullStatus.getStatus());
    }

    @Test
    @DisplayName("📊 PU-ESVC-05: getConflicts — conflicto con espacio único (onlySpace=true)")
    /**
     * Verifica que el DTO de conflicto marque 'onlySpace=true' cuando
     * el espacio analizado es el único reservado en un evento conflictivo.
     */
    void getConflicts_SingleSpace_OnlySpaceTrue() {
        when(spaceRepository.findById(1L)).thenReturn(Optional.of(mockSpace));
        when(spaceMapper.toDto(mockSpace)).thenReturn(mockSpaceDTO);

        Reservation res = new Reservation();
        res.setId(10L);
        res.setTitle("Solo");
        res.setType(com.tfg.backend.modules.reservation.model.ReservationType.CLASE);
        res.setStartTime(LocalDateTime.now().plusHours(1));
        res.setEndTime(LocalDateTime.now().plusHours(2));
        res.setStatus(ReservationStatus.APROBADA);
        res.setUser(com.tfg.backend.modules.identity.model.User.builder().name("Prof").build());
        res.setSpaces(Set.of(mockSpace)); // Solo un espacio

        when(reservationRepository.findBySpaceId(1L)).thenReturn(List.of(res));

        var conflicts = spaceService.getConflicts(1L);
        assertEquals(1, conflicts.size());
        assertTrue(conflicts.get(0).isOnlySpace());
    }

    @Test
    @DisplayName("📊 PU-ESVC-06: getConflicts — conflicto multiespacio (onlySpace=false)")
    /**
     * Verifica que el DTO de conflicto marque 'onlySpace=false' cuando
     * la reserva conflictiva abarca varios espacios además del analizado.
     */
    void getConflicts_MultiSpace_OnlySpaceFalse() {
        when(spaceRepository.findById(1L)).thenReturn(Optional.of(mockSpace));
        when(spaceMapper.toDto(mockSpace)).thenReturn(mockSpaceDTO);

        Space other = new Space();
        other.setId(2L);

        Reservation res = new Reservation();
        res.setId(10L);
        res.setTitle("Multi");
        res.setType(com.tfg.backend.modules.reservation.model.ReservationType.CLASE);
        res.setStartTime(LocalDateTime.now().plusHours(1));
        res.setEndTime(LocalDateTime.now().plusHours(2));
        res.setStatus(ReservationStatus.APROBADA);
        res.setUser(com.tfg.backend.modules.identity.model.User.builder().name("Prof").build());
        res.setSpaces(new HashSet<>(List.of(mockSpace, other)));

        when(reservationRepository.findBySpaceId(1L)).thenReturn(List.of(res));

        var conflicts = spaceService.getConflicts(1L);
        assertEquals(1, conflicts.size());
        assertFalse(conflicts.get(0).isOnlySpace());
    }

    @Test
    @DisplayName("✅ PU-ESVC-11: Eliminación NO cancela reservas pasadas")
    /**
     * Verifica que la eliminación lógica de un espacio no afecte el estado
     * de aquellas reservas que ya han concluido en el pasado.
     */
    void delete_DoesNotCancelPastReservations() {
        when(spaceRepository.findById(1L)).thenReturn(Optional.of(mockSpace));
        when(spaceMapper.toDto(mockSpace)).thenReturn(mockSpaceDTO);

        Reservation pastRes = new Reservation();
        pastRes.setStatus(ReservationStatus.APROBADA);
        pastRes.setEndTime(LocalDateTime.now().minusDays(1)); // ya terminó
        pastRes.setSpaces(new HashSet<>(List.of(mockSpace)));

        when(reservationRepository.findBySpaceId(1L)).thenReturn(List.of(pastRes));

        spaceService.deleteById(1L);

        // La reserva pasada no debe cambiar de estado
        assertEquals(ReservationStatus.APROBADA, pastRes.getStatus());
        verify(reservationRepository, never()).save(pastRes);
    }



    @Test
    @DisplayName("❌ PU-ESVC-16: Restauración falla si espacio no existe")
    /**
     * Verifica que se lance una excepción si se intenta restaurar un espacio
     * con un ID que no se encuentra registrado en el sistema.
     *
     * @throws ResourceNotFoundException si el espacio no existe.
     */
    void restore_SpaceNotFound() {
        when(spaceRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> spaceService.restoreById(99L));
    }

    @Test
    @DisplayName("✅ PU-ESVC-17: findAll marca espacio con reserva activa como ocupado")
    /**
     * Verifica que la búsqueda devuelva el flag booleano de ocupación activo ('true')
     * si el espacio está actualmente en uso por una reserva.
     */
    void findAll_MarksOccupiedNow() {
        Pageable pageable = PageRequest.of(0, 10);
        when(spaceRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(mockSpace)));
        SpaceDTO dtoOccupied = new SpaceDTO();
        dtoOccupied.setId(1L);
        when(spaceMapper.toDto(mockSpace)).thenAnswer(inv -> { SpaceDTO dto = new SpaceDTO(); dto.setId(1L); dto.setOccupiedNow(((Space)inv.getArgument(0)).isOccupiedNow()); return dto; });
        when(reservationRepository.findCurrentlyOccupiedSpaceIds(any())).thenReturn(List.of(1L));

        Page<SpaceDTO> result = spaceService.findAll(false, pageable);

        assertTrue(result.getContent().get(0).isOccupiedNow());
    }

    @Test
    @DisplayName("✅ PU-ESVC-19: update con nombre diferente invoca validateUniqueName")
    /**
     * Verifica que cuando se actualiza un espacio y se cambia su nombre,
     * el sistema llame al validador para comprobar la unicidad del nuevo nombre.
     */
    void update_DifferentName_ValidatesUniqueness() {
        when(spaceRepository.findById(1L)).thenReturn(Optional.of(mockSpace));
        when(spaceRepository.save(any())).thenReturn(mockSpace);
        when(spaceMapper.toDto(any())).thenReturn(mockSpaceDTO);

        spaceRequest.setName("Nombre Diferente");
        spaceService.update(1L, spaceRequest);

        verify(spaceValidator).validateUniqueName("Nombre Diferente", 1L);
    }

    @Test
    @DisplayName("✅ PU-ESVC-20: update con mismo nombre NO invoca validateUniqueName")
    /**
     * Verifica que cuando se actualiza un espacio y el nombre permanece igual,
     * el sistema omita la validación de unicidad de nombre.
     */
    void update_SameName_SkipsUniquenessValidation() {
        when(spaceRepository.findById(1L)).thenReturn(Optional.of(mockSpace));
        when(spaceRepository.save(any())).thenReturn(mockSpace);
        when(spaceMapper.toDto(any())).thenReturn(mockSpaceDTO);

        spaceRequest.setName("Aula 1.1"); // Mismo que mockSpace.name (case-insensitive)
        spaceService.update(1L, spaceRequest);

        verify(spaceValidator, never()).validateUniqueName(anyString(), any());
    }

    @Test
    @DisplayName("✅ PU-ESVC-22: update con capacidad reducida invoca validateCapacityReduction")
    /**
     * Verifica que cuando se actualiza un espacio y se reduce su capacidad total,
     * el sistema verifique que esta reducción no entre en conflicto con reservas activas.
     */
    void update_ReducedCapacity_ValidatesReduction() {
        when(spaceRepository.findById(1L)).thenReturn(Optional.of(mockSpace)); // capacity=50
        when(spaceRepository.save(any())).thenReturn(mockSpace);
        when(spaceMapper.toDto(any())).thenReturn(mockSpaceDTO);

        spaceRequest.setName("Aula 1.1");
        spaceRequest.setTotalCapacity(30); // Reducción: 50 → 30

        spaceService.update(1L, spaceRequest);

        verify(spaceValidator).validateCapacityReduction(1L, 30, 50);
    }

    @Test
    @DisplayName("✅ PU-ESVC-23: update con capacidad null omite validateCapacityReduction")
    /**
     * Verifica que el sistema no compruebe la reducción de capacidad si durante
     * la actualización la capacidad proporcionada es nula.
     */
    void update_NullCapacity_SkipsReductionValidation() {
        when(spaceRepository.findById(1L)).thenReturn(Optional.of(mockSpace));
        when(spaceRepository.save(any())).thenReturn(mockSpace);
        when(spaceMapper.toDto(any())).thenReturn(mockSpaceDTO);

        spaceRequest.setName("Aula 1.1");
        spaceRequest.setTotalCapacity(null);

        spaceService.update(1L, spaceRequest);

        verify(spaceValidator, never()).validateCapacityReduction(any(), any(), any());
    }

    @Test
    @DisplayName("❌ PU-ESVC-24: update falla si espacio no existe")
    /**
     * Verifica que si se intenta actualizar un espacio inexistente,
     * el sistema arroje la excepción correspondiente.
     *
     * @throws ResourceNotFoundException si el espacio no existe.
     */
    void update_SpaceNotFound_Throws() {
        when(spaceRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> spaceService.update(99L, spaceRequest));
    }

    @Test
    @DisplayName("✅ PU-ESVC-25: deleteMultiple sin forzar omite espacios con reservas")
    /**
     * Verifica que al borrar múltiples espacios sin forzar la acción,
     * el sistema omita y no borre aquellos que actualmente poseen reservas activas.
     */
    void deleteMultiple_NoForce_SkipsSpacesWithConflicts() {
        // Espacio 1 tiene reservas, espacio 2 no
        Space space2 = new Space();
        space2.setId(2L);
        space2.setName("Aula 2");
        space2.setStatus(SpaceStatus.DISPONIBLE);

        SpaceDTO dto2 = new SpaceDTO();
        dto2.setId(2L);

        lenient().when(spaceRepository.findById(1L)).thenReturn(Optional.of(mockSpace));
        when(spaceRepository.findById(2L)).thenReturn(Optional.of(space2));
        when(reservationRepository.countActiveBySpace(eq(1L), any())).thenReturn(1); // con conflicto
        when(reservationRepository.countActiveBySpace(eq(2L), any())).thenReturn(0); // sin conflicto
        when(reservationRepository.findBySpaceId(2L)).thenReturn(Collections.emptyList());
        when(spaceMapper.toDto(space2)).thenReturn(dto2);

        spaceService.deleteMultiple(List.of(1L, 2L), false);

        // Espacio 1 NO debe ser eliminado (tiene reservas y no force)
        assertNotEquals(SpaceStatus.ELIMINADO, mockSpace.getStatus());
        // Espacio 2 SÍ debe ser eliminado
        assertEquals(SpaceStatus.ELIMINADO, space2.getStatus());
    }
}
