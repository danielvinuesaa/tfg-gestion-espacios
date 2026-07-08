package com.tfg.backend.modules.space.service;

import com.tfg.backend.core.common.ImportResultDTO;
import com.tfg.backend.core.exception.BusinessValidationException;
import com.tfg.backend.core.util.CsvProcessor;
import com.tfg.backend.modules.analytics.service.AuditService;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.space.model.SpaceStatus;
import com.tfg.backend.modules.space.model.SpaceType;
import com.tfg.backend.modules.space.repository.SpaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Suite de pruebas unitarias para el servicio de importación de espacios {@link SpaceImportServiceImpl}.
 * <p>
 * Verifica la correcta lectura, validación e inserción de espacios desde archivos CSV,
 * cubriendo escenarios de inserción exitosa, sobrescritura, resolución de conflictos
 * y errores de formato o validación.
 */
@ExtendWith(MockitoExtension.class)
class SpaceImportServiceImplTest {

    @Mock
    private SpaceRepository spaceRepository;
    @Mock
    private ReservationRepository reservationRepository;
    @Mock
    private AuditService auditService;
    @Mock
    private CsvProcessor csvProcessor;
    @Mock
    private MultipartFile mockFile;

    private SpaceImportServiceImpl spaceImportService;

    @BeforeEach
    void setUp() {
        spaceImportService = new SpaceImportServiceImpl(
                spaceRepository, reservationRepository, auditService, csvProcessor);
    }

    /**
     * Verifica que la validación de un archivo CSV retorne éxito cuando los registros
     * son correctos y no generan conflictos con los espacios existentes.
     */
    @Test
    void validateCsv_WhenNoConflicts_ShouldReturnSuccess() throws Exception {
        // Arrange
        String[] row = {"Aula 101", "AULA", "30", "DISPONIBLE", "GIS-123"};
        
        doAnswer(invocation -> {
            CsvProcessor.RowConsumer consumer = invocation.getArgument(2);
            consumer.accept(row, 1);
            return null;
        }).when(csvProcessor).process(any(), anyBoolean(), any());

        when(spaceRepository.findByNameIgnoreCase("Aula 101")).thenReturn(Optional.empty());

        // Act
        ImportResultDTO result = spaceImportService.validateCsv(mockFile);

        // Assert
        assertEquals(1, result.getSuccessCount());
        assertEquals(1, result.getNewCount());
        assertTrue(result.getConflicts().isEmpty());
    }

    /**
     * Verifica que la validación de un archivo CSV detecte y retorne un conflicto
     * cuando se intenta importar un espacio que ya existe en el sistema.
     */
    @Test
    void validateCsv_WhenConflictExists_ShouldReturnConflict() throws Exception {
        // Arrange
        String[] row = {"Aula 101", "AULA", "30", "DISPONIBLE", "GIS-123"};
        Space existingSpace = Space.builder()
                .id(1L)
                .name("Aula 101")
                .type(SpaceType.LABORATORIO)
                .totalCapacity(20)
                .status(SpaceStatus.DISPONIBLE)
                .build();

        doAnswer(invocation -> {
            CsvProcessor.RowConsumer consumer = invocation.getArgument(2);
            consumer.accept(row, 1);
            return null;
        }).when(csvProcessor).process(any(), anyBoolean(), any());

        when(spaceRepository.findByNameIgnoreCase("Aula 101")).thenReturn(Optional.of(existingSpace));
        when(reservationRepository.findBySpaceId(1L)).thenReturn(Collections.emptyList());

        // Act
        ImportResultDTO result = spaceImportService.validateCsv(mockFile);

        // Assert
        assertEquals(0, result.getSuccessCount());
        assertEquals(1, result.getConflicts().size());
        assertEquals("Aula 101", result.getConflicts().get(0).getName());
        assertTrue(result.getConflicts().get(0).isCanOverwrite());
    }

    /**
     * Verifica que la importación de un archivo CSV guarde correctamente en base
     * de datos un espacio completamente nuevo.
     */
    @Test
    void importFromCsv_WhenNewSpace_ShouldSave() throws Exception {
        // Arrange
        String[] row = {"Aula 101", "AULA", "30"};
        
        doAnswer(invocation -> {
            CsvProcessor.RowConsumer consumer = invocation.getArgument(2);
            consumer.accept(row, 1);
            return null;
        }).when(csvProcessor).process(any(), anyBoolean(), any());

        when(spaceRepository.findByNameIgnoreCase("Aula 101")).thenReturn(Optional.empty());

        // Act
        ImportResultDTO result = spaceImportService.importFromCsv(mockFile, false);

        // Assert
        assertEquals(1, result.getSuccessCount());
        verify(spaceRepository, times(1)).save(any(Space.class));
        verify(auditService).logAction(eq("Space"), eq("IMPORT_SPACES"), any(), anyString());
    }

    /**
     * Verifica que la importación de un archivo CSV actualice la información de un
     * espacio existente si la sobrescritura está permitida y no hay restricciones.
     */
    @Test
    void importFromCsv_WhenOverwriteAllowed_ShouldUpdate() throws Exception {
        // Arrange
        String[] row = {"Aula 101", "AULA", "50"};
        Space existing = Space.builder().id(1L).name("Aula 101").totalCapacity(20).build();

        doAnswer(invocation -> {
            CsvProcessor.RowConsumer consumer = invocation.getArgument(2);
            consumer.accept(row, 1);
            return null;
        }).when(csvProcessor).process(any(), anyBoolean(), any());

        when(spaceRepository.findByNameIgnoreCase("Aula 101")).thenReturn(Optional.of(existing));
        when(reservationRepository.findBySpaceId(1L)).thenReturn(Collections.emptyList());

        // Act
        ImportResultDTO result = spaceImportService.importFromCsv(mockFile, true);

        // Assert
        assertEquals(1, result.getSuccessCount());
        assertEquals(50, existing.getTotalCapacity());
        verify(spaceRepository).save(existing);
    }

    /**
     * Verifica que la importación con sobrescritura falle y retorne un error si
     * se intenta modificar un espacio existente que tiene reservas asociadas activas.
     */
    @Test
    void importFromCsv_WhenOverwriteWithReservations_ShouldReturnError() throws Exception {
        // Arrange
        String[] row = {"Aula 101", "AULA", "50"};
        Space existing = Space.builder().id(1L).name("Aula 101").build();

        doAnswer(invocation -> {
            CsvProcessor.RowConsumer consumer = invocation.getArgument(2);
            consumer.accept(row, 1);
            return null;
        }).when(csvProcessor).process(any(), anyBoolean(), any());

        when(spaceRepository.findByNameIgnoreCase("Aula 101")).thenReturn(Optional.of(existing));
        when(reservationRepository.findBySpaceId(1L)).thenReturn(Collections.singletonList(null));

        // Act
        ImportResultDTO result = spaceImportService.importFromCsv(mockFile, true);

        // Assert
        assertEquals(0, result.getSuccessCount());
        assertEquals(1, result.getErrors().size());
        assertTrue(result.getErrors().get(0).contains("reservas activas"));
    }

    /**
     * Verifica que el servicio de importación lance una excepción de validación
     * si la estructura de una fila del CSV está incompleta o no tiene el formato esperado.
     */
    @Test
    void validateRowStructure_WhenShortRow_ShouldThrowException() {
        String[] shortRow = {"SoloNombre", "AULA"};
        assertThrows(BusinessValidationException.class, () -> {
            spaceImportService.validateRowStructure(shortRow);
        });
    }

    /**
     * Verifica que el mapeo de una fila del CSV a la entidad de dominio lance
     * una excepción si se provee un tipo de espacio inválido o no reconocido.
     */
    @Test
    void mapRowToEntity_WhenInvalidType_ShouldThrowException() {
        String[] invalidRow = {"Aula", "TIPO_INVENTADO", "30"};
        assertThrows(BusinessValidationException.class, () -> {
            spaceImportService.mapRowToEntity(invalidRow);
        });
    }
}
