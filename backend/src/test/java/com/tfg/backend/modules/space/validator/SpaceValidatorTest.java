package com.tfg.backend.modules.space.validator;

import com.tfg.backend.core.exception.BusinessValidationException;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.space.model.SpaceStatus;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.space.repository.SpaceRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

/**
 * Suite de pruebas unitarias para el validador de espacios {@link SpaceValidator}.
 * <p>
 * Verifica exhaustivamente las reglas de negocio, incluyendo la unicidad del nombre
 * del espacio, unicidad del identificador GIS, límites de capacidad y la reducción
 * de capacidad cuando hay reservas asociadas.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Unitarios de SpaceValidator (Exhaustividad de Reglas)")
class SpaceValidatorTest {

    @Mock private ReservationRepository reservationRepository;
    @Mock private SpaceRepository spaceRepository;
    @InjectMocks private SpaceValidator spaceValidator;

    // --- PU-EVAL-01: Nombre único nuevo ---
    /**
     * Verifica que el sistema permita la creación o actualización de un espacio
     * con un nombre que no existe previamente en el repositorio.
     */
    @Test
    @DisplayName("✅ PU-EVAL-01: Nombre de espacio nuevo no causa excepción")
    void validateUniqueName_NewName() {
        when(spaceRepository.findByName(anyString())).thenReturn(Optional.empty());
        assertDoesNotThrow(() -> spaceValidator.validateUniqueName("Aula VIP", null));
    }

    // --- PU-EVAL-02: Nombre ya en uso por espacio activo ---
    /**
     * Verifica que el sistema rechace un nombre de espacio si este ya se encuentra
     * en uso por otro espacio en estado activo, lanzando una excepción.
     *
     * @throws BusinessValidationException si el nombre ya está en uso.
     */
    @Test
    @DisplayName("❌ PU-EVAL-02: Nombre de espacio activo ya existente lanza excepción")
    void validateUniqueName_AlreadyActive() {
        Space existing = Space.builder().id(10L).status(SpaceStatus.DISPONIBLE).build();
        when(spaceRepository.findByName("Aula 1")).thenReturn(Optional.of(existing));

        BusinessValidationException ex = assertThrows(BusinessValidationException.class,
                () -> spaceValidator.validateUniqueName("Aula 1", null));
        assertTrue(ex.getMessage().contains("Ya existe un espacio activo"));
    }

    // --- PU-EVAL-03: Nombre perteneciente a espacio eliminado ---
    /**
     * Verifica que el sistema rechace un nombre de espacio si pertenece a un espacio
     * que ha sido marcado como eliminado, sugiriendo la restauración del mismo.
     *
     * @throws BusinessValidationException si el nombre pertenece a un espacio eliminado.
     */
    @Test
    @DisplayName("❌ PU-EVAL-03: Nombre de espacio eliminado sugiere restauración")
    void validateUniqueName_Deleted() {
        Space existing = Space.builder().id(10L).status(SpaceStatus.ELIMINADO).build();
        when(spaceRepository.findByName("Aula 1")).thenReturn(Optional.of(existing));

        BusinessValidationException ex = assertThrows(BusinessValidationException.class,
                () -> spaceValidator.validateUniqueName("Aula 1", null));
        assertTrue(ex.getMessage().contains("pertenece a un espacio que fue eliminado"));
    }

    // --- PU-EVAL-04: Nombre del mismo espacio en edición (auto-actualización) ---
    /**
     * Verifica que no se lance una excepción cuando el nombre pertenece
     * al mismo espacio que se está editando (mismo identificador).
     */
    @Test
    @DisplayName("✅ PU-EVAL-04: Mismo nombre con mismo ID no causa excepción")
    void validateUniqueName_SameSpaceSelf() {
        Space existing = Space.builder().id(5L).status(SpaceStatus.DISPONIBLE).build();
        when(spaceRepository.findByName("Aula 5")).thenReturn(Optional.of(existing));
        // Pasamos el mismo ID → no debe lanzar excepción
        assertDoesNotThrow(() -> spaceValidator.validateUniqueName("Aula 5", 5L));
    }

    // --- PU-EVAL-05: GIS ID único y nuevo ---
    /**
     * Verifica que un identificador GIS nuevo y no registrado se valide correctamente
     * sin lanzar ninguna excepción.
     */
    @Test
    @DisplayName("✅ PU-EVAL-05: GIS ID nuevo no causa excepción")
    void validateUniqueGisId_New() {
        when(spaceRepository.findByGisId(anyString())).thenReturn(Optional.empty());
        assertDoesNotThrow(() -> spaceValidator.validateUniqueGisId("GIS-123", null));
    }

    // --- PU-EVAL-06: GIS ID null o en blanco ---
    /**
     * Verifica que el sistema omita la comprobación del identificador GIS
     * si este es nulo o está en blanco.
     */
    @Test
    @DisplayName("✅ PU-EVAL-06: GIS ID null o en blanco retorna sin comprobar")
    void validateUniqueGisId_NullOrBlank_NoException() {
        assertDoesNotThrow(() -> spaceValidator.validateUniqueGisId(null, null));
        assertDoesNotThrow(() -> spaceValidator.validateUniqueGisId("  ", null));
    }

    // --- PU-EVAL-07: GIS ID ya asignado a espacio activo diferente ---
    /**
     * Verifica que el sistema rechace un identificador GIS si ya está asignado
     * a otro espacio activo distinto, lanzando una excepción.
     *
     * @throws BusinessValidationException si el identificador GIS ya está asignado.
     */
    @Test
    @DisplayName("❌ PU-EVAL-07: GIS ID en uso por otro espacio activo lanza excepción")
    void validateUniqueGisId_Duplicate() {
        Space existing = Space.builder().id(10L).name("Original").status(SpaceStatus.DISPONIBLE).build();
        when(spaceRepository.findByGisId("GIS-123")).thenReturn(Optional.of(existing));
        assertThrows(BusinessValidationException.class, () -> spaceValidator.validateUniqueGisId("GIS-123", null));
    }

    // --- PU-EVAL-08: GIS ID de espacio ELIMINADO no bloquea ---
    /**
     * Verifica que el sistema permita reasignar un identificador GIS si
     * este pertenece actualmente a un espacio que ha sido eliminado.
     */
    @Test
    @DisplayName("✅ PU-EVAL-08: GIS ID de espacio eliminado no bloquea la asignación")
    void validateUniqueGisId_DeletedSpace_NoException() {
        Space existing = Space.builder().id(10L).name("Eliminado").status(SpaceStatus.ELIMINADO).build();
        when(spaceRepository.findByGisId("GIS-123")).thenReturn(Optional.of(existing));
        assertDoesNotThrow(() -> spaceValidator.validateUniqueGisId("GIS-123", null));
    }

    // --- PU-EVAL-09: GIS ID del mismo espacio en edición ---
    /**
     * Verifica que el sistema permita utilizar un identificador GIS si pertenece
     * al propio espacio que está siendo actualizado.
     */
    @Test
    @DisplayName("✅ PU-EVAL-09: GIS ID propio en edición no causa excepción")
    void validateUniqueGisId_SameSpaceSelf() {
        Space existing = Space.builder().id(5L).name("Propio").status(SpaceStatus.DISPONIBLE).build();
        when(spaceRepository.findByGisId("GIS-5")).thenReturn(Optional.of(existing));
        assertDoesNotThrow(() -> spaceValidator.validateUniqueGisId("GIS-5", 5L));
    }

    // --- PU-EVAL-10: Ordenadores superan la capacidad total ---
    /**
     * Verifica que el sistema rechace la validación de un espacio si la cantidad
     * de ordenadores supera la capacidad total del mismo.
     *
     * @throws BusinessValidationException si el número de ordenadores es mayor a la capacidad total.
     */
    @Test
    @DisplayName("❌ PU-EVAL-10: computerCount > totalCapacity lanza excepción")
    void validateCapacities_ComputersTooMany() {
        Space s = new Space();
        s.setTotalCapacity(10);
        s.setComputerCount(15);
        assertThrows(BusinessValidationException.class, () -> spaceValidator.validateCapacities(s));
    }

    // --- PU-EVAL-11: Ordenadores null — sin validación ---
    /**
     * Verifica que la validación de capacidad sea exitosa cuando el número
     * de ordenadores es nulo, considerándose un caso válido sin restricciones.
     */
    @Test
    @DisplayName("✅ PU-EVAL-11: computerCount null no lanza excepción")
    void validateCapacities_ComputersNull_NoException() {
        Space s = new Space();
        s.setTotalCapacity(10);
        s.setComputerCount(null);
        assertDoesNotThrow(() -> spaceValidator.validateCapacities(s));
    }

    // --- PU-EVAL-12: Ordenadores igual a la capacidad (límite exacto, válido) ---
    /**
     * Verifica que el límite exacto donde el número de ordenadores es igual
     * a la capacidad total del espacio se considere válido.
     */
    @Test
    @DisplayName("✅ PU-EVAL-12: computerCount == totalCapacity es un caso límite válido")
    void validateCapacities_ComputersEqualCapacity_NoException() {
        Space s = new Space();
        s.setTotalCapacity(10);
        s.setComputerCount(10);
        assertDoesNotThrow(() -> spaceValidator.validateCapacities(s));
    }

    // --- PU-EVAL-13: Reducción con reservas activas ---
    /**
     * Verifica que el sistema impida reducir la capacidad total de un espacio
     * si este tiene reservas activas, para no afectar a eventos ya programados.
     *
     * @throws BusinessValidationException si hay reservas activas y se reduce la capacidad.
     */
    @Test
    @DisplayName("❌ PU-EVAL-13: Reducción de capacidad con reservas activas lanza excepción")
    void validateCapacityReduction_WithReservations() {
        when(reservationRepository.countActiveBySpace(anyLong(), any())).thenReturn(1);
        BusinessValidationException ex = assertThrows(BusinessValidationException.class,
                () -> spaceValidator.validateCapacityReduction(1L, 40, 50));
        assertTrue(ex.getMessage().contains("existen reservas activas"));
    }

    // --- PU-EVAL-14: Reducción sin reservas activas ---
    /**
     * Verifica que el sistema permita reducir la capacidad total de un espacio
     * si no existen reservas activas asociadas a él.
     */
    @Test
    @DisplayName("✅ PU-EVAL-14: Reducción de capacidad sin reservas activas no causa excepción")
    void validateCapacityReduction_NoReservations() {
        when(reservationRepository.countActiveBySpace(anyLong(), any())).thenReturn(0);
        assertDoesNotThrow(() -> spaceValidator.validateCapacityReduction(1L, 40, 50));
    }

    // --- PU-EVAL-15: Capacidad igual a la actual (no hay reducción) ---
    /**
     * Verifica que el sistema no dispare la regla de reducción de capacidad
     * si la nueva capacidad es idéntica a la actual.
     */
    @Test
    @DisplayName("✅ PU-EVAL-15: Capacidad igual a la actual no dispara validación de reducción")
    void validateCapacityReduction_SameCapacity_NoException() {
        // Si no cambia, no se llama al repositorio ni se lanza excepción
        assertDoesNotThrow(() -> spaceValidator.validateCapacityReduction(1L, 50, 50));
    }

    // --- PU-EVAL-16: Aumento de capacidad siempre permitido ---
    /**
     * Verifica que el sistema siempre permita aumentar la capacidad de un espacio,
     * ignorando la validación estricta de reducción.
     */
    @Test
    @DisplayName("✅ PU-EVAL-16: Aumento de capacidad nunca lanza excepción")
    void validateCapacityReduction_Increase_NoException() {
        assertDoesNotThrow(() -> spaceValidator.validateCapacityReduction(1L, 60, 50));
    }
}
