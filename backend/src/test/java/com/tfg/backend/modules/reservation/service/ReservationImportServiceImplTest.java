package com.tfg.backend.modules.reservation.service;

import com.tfg.backend.core.exception.BusinessValidationException;
import com.tfg.backend.core.util.CsvProcessor;
import com.tfg.backend.modules.analytics.service.AuditService;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.repository.UserRepository;
import com.tfg.backend.modules.reservation.dto.ReservationImportResultDTO;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationType;
import com.tfg.backend.modules.reservation.model.Subject;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.reservation.repository.SubjectRepository;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.space.repository.SpaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Suite de pruebas unitarias para el servicio de importación de reservas {@link ReservationImportServiceImpl}.
 * Verifica la correcta lectura, procesamiento, validación y persistencia de reservas masivas a través de archivos CSV,
 * controlando conflictos, asignación de espacios, y manejo de errores.
 */
@ExtendWith(MockitoExtension.class)
class ReservationImportServiceImplTest {

    @Mock
    private ReservationRepository reservationRepository;
    @Mock
    private SpaceRepository spaceRepository;
    @Mock
    private SubjectRepository subjectRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private AuditService auditService;
    @Mock
    private CsvProcessor csvProcessor;
    @Mock
    private ApplicationEventPublisher eventPublisher;
    @Mock
    private MultipartFile mockFile;

    private ReservationImportServiceImpl reservationImportService;

    @BeforeEach
    void setUp() {
        reservationImportService = new ReservationImportServiceImpl(
                reservationRepository, spaceRepository, subjectRepository, userRepository,
                auditService, csvProcessor, eventPublisher);
    }

    /**
     * Verifica que el sistema importe y cree correctamente una reserva a partir de una fila CSV válida,
     * asignando los espacios, el sujeto y publicando el evento correspondiente sin solapamientos.
     * 
     * @throws Exception en caso de error durante el procesamiento.
     */
    @Test
    void importFromCsv_WhenValidRow_ShouldCreateReservation() throws Exception {
        // Arrange
        String tomorrow = LocalDateTime.now().plusDays(1).format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        String[] row = {"GSI.01 - Software Design", tomorrow, "10.00", tomorrow, "12.00", "Practical Class", "AULA 101", "CLASE"};
        
        User owner = User.builder().email("admin@uniovi.es").name("Admin").build();
        Subject subject = Subject.builder().id(1L).code("GSI").build();
        Space space = Space.builder().id(1L).name("AULA 101").build();

        doAnswer(invocation -> {
            CsvProcessor.RowConsumer consumer = invocation.getArgument(2);
            consumer.accept(row, 1);
            return null;
        }).when(csvProcessor).process(any(), anyBoolean(), any());

        when(userRepository.findByEmail("admin@uniovi.es")).thenReturn(Optional.of(owner));
        when(subjectRepository.findByCode("GSI")).thenReturn(Optional.of(subject));
        when(spaceRepository.findByNameIgnoreCase("AULA 101")).thenReturn(Optional.of(space));
        when(reservationRepository.findOverlappingReservations(eq(1L), any(), any())).thenReturn(Collections.emptyList());
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        ReservationImportResultDTO result = reservationImportService.importFromCsv(mockFile, "admin@uniovi.es", false);

        // Assert
        assertEquals(1, result.getSuccessCount());
        verify(reservationRepository).save(any(Reservation.class));
        verify(eventPublisher).publishEvent(any());
    }

    /**
     * Verifica que el sistema intercepte y registre un error de importación cuando se detecta
     * que la reserva a crear solapa con una reserva ya existente en el repositorio.
     * 
     * @throws Exception en caso de error durante el procesamiento.
     */
    @Test
    void importFromCsv_WhenOverlap_ShouldReturnError() throws Exception {
        // Arrange
        String tomorrow = LocalDateTime.now().plusDays(1).format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        String[] row = {"GSI", tomorrow, "10.00", tomorrow, "12.00", "Desc", "AULA 101"};
        
        User owner = User.builder().email("admin@uniovi.es").build();
        Subject subject = Subject.builder().code("GSI").build();
        Space space = Space.builder().id(1L).name("AULA 101").build();
        Reservation overlapping = Reservation.builder().title("Already here").build();

        doAnswer(invocation -> {
            CsvProcessor.RowConsumer consumer = invocation.getArgument(2);
            consumer.accept(row, 1);
            return null;
        }).when(csvProcessor).process(any(), anyBoolean(), any());

        when(userRepository.findByEmail("admin@uniovi.es")).thenReturn(Optional.of(owner));
        when(subjectRepository.findByCode("GSI")).thenReturn(Optional.of(subject));
        when(spaceRepository.findByNameIgnoreCase("AULA 101")).thenReturn(Optional.of(space));
        when(reservationRepository.findOverlappingReservations(eq(1L), any(), any())).thenReturn(Collections.singletonList(overlapping));

        // Act
        ReservationImportResultDTO result = reservationImportService.importFromCsv(mockFile, "admin@uniovi.es", false);

        // Assert
        assertEquals(0, result.getSuccessCount());
        assertEquals(1, result.getErrors().size());
        assertTrue(result.getErrors().get(0).contains("ya está ocupado"));
    }

    /**
     * Verifica que el validador rechace y lance una excepción cuando la fila procesada del CSV
     * contenga menos columnas de las mínimas requeridas.
     */
    @Test
    void validateRowStructure_WhenFewerThan7Columns_ShouldThrowException() {
        String[] row = {"GSI", "Date", "Start", "Date", "End", "Desc"}; // 6 cols
        assertThrows(BusinessValidationException.class, () -> reservationImportService.validateRowStructure(row));
    }

    /**
     * Verifica que el proceso de validación previa (Dry Run) detecte y reporte conflictos internos
     * si hay dos filas en el mismo archivo CSV que se solapan en tiempo y espacio físico.
     * 
     * @throws Exception en caso de error durante el procesamiento.
     */
    @Test
    @DisplayName("🧪 checkInternalOverlap: Detecta conflicto entre filas del mismo CSV")
    void validateFromCsv_InternalOverlap() throws Exception {
        String tomorrow = LocalDateTime.now().plusDays(1).format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        String[] row1 = {"GSI.01", tomorrow, "10.00", tomorrow, "11.00", "Desc", "AULA 101"};
        String[] row2 = {"GSI.02", tomorrow, "10.30", tomorrow, "12.00", "Desc", "AULA 101"};

        doAnswer(invocation -> {
            CsvProcessor.RowConsumer consumer = invocation.getArgument(2);
            consumer.accept(row1, 1);
            consumer.accept(row2, 2);
            return null;
        }).when(csvProcessor).process(any(), anyBoolean(), any());

        Subject subject = Subject.builder().code("GSI").build();
        Space space = Space.builder().id(1L).name("AULA 101").build();
        
        when(subjectRepository.findByCode("GSI")).thenReturn(Optional.of(subject));
        when(spaceRepository.findByNameIgnoreCase("AULA 101")).thenReturn(Optional.of(space));
        when(reservationRepository.findOverlappingReservations(anyLong(), any(), any())).thenReturn(Collections.emptyList());

        // Act
        ReservationImportResultDTO result = reservationImportService.validateFromCsv(mockFile);

        // Assert
        assertEquals(1, result.getConflicts().size());
        assertTrue(result.getConflicts().get(0).getMessage().contains("Conflicto interno"));
    }

    /**
     * Verifica que el sistema sea capaz de procesar múltiples espacios separados por comas
     * en una única fila CSV, asignándolos todos correctamente a la reserva resultante.
     * 
     * @throws Exception en caso de error durante el procesamiento.
     */
    @Test
    @DisplayName("🧪 resolveSpaces: Maneja múltiples espacios por coma")
    void importFromCsv_MultipleSpaces() throws Exception {
        String tomorrow = LocalDateTime.now().plusDays(1).format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        String[] row = {"GSI", tomorrow, "10.00", tomorrow, "12.00", "Desc", "AULA 1, AULA 2"};
        
        User owner = User.builder().email("admin@uniovi.es").name("Admin").build();
        Subject subject = Subject.builder().code("GSI").build();
        Space s1 = Space.builder().id(1L).name("AULA 1").build();
        Space s2 = Space.builder().id(2L).name("AULA 2").build();

        doAnswer(invocation -> {
            CsvProcessor.RowConsumer consumer = invocation.getArgument(2);
            consumer.accept(row, 1);
            return null;
        }).when(csvProcessor).process(any(), anyBoolean(), any());

        when(userRepository.findByEmail("admin@uniovi.es")).thenReturn(Optional.of(owner));
        when(subjectRepository.findByCode("GSI")).thenReturn(Optional.of(subject));
        when(spaceRepository.findByNameIgnoreCase("AULA 1")).thenReturn(Optional.of(s1));
        when(spaceRepository.findByNameIgnoreCase("AULA 2")).thenReturn(Optional.of(s2));

        ReservationImportResultDTO result = reservationImportService.importFromCsv(mockFile, "admin@uniovi.es", false);

        assertEquals(1, result.getSuccessCount());
        verify(reservationRepository).save(argThat(res -> res.getSpaces().size() == 2));
    }

    /**
     * Verifica que el sistema permita procesar reservas de tipo "Online" (o sin espacio físico explícito)
     * importándolas exitosamente sin requerir la existencia de una entidad espacio.
     * 
     * @throws Exception en caso de error durante el procesamiento.
     */
    @Test
    @DisplayName("🌐 Online: Permite importar sin espacios")
    void importFromCsv_OnlineReservation() throws Exception {
        String tomorrow = LocalDateTime.now().plusDays(1).format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        String[] row = {"GSI", tomorrow, "10.00", tomorrow, "12.00", "Desc", "Online"};
        
        User owner = User.builder().email("admin@uniovi.es").name("Admin").build();
        Subject subject = Subject.builder().code("GSI").build();

        doAnswer(invocation -> {
            CsvProcessor.RowConsumer consumer = invocation.getArgument(2);
            consumer.accept(row, 1);
            return null;
        }).when(csvProcessor).process(any(), anyBoolean(), any());

        when(userRepository.findByEmail("admin@uniovi.es")).thenReturn(Optional.of(owner));
        when(subjectRepository.findByCode("GSI")).thenReturn(Optional.of(subject));

        ReservationImportResultDTO result = reservationImportService.importFromCsv(mockFile, "admin@uniovi.es", false);

        assertEquals(1, result.getSuccessCount());
        verify(reservationRepository).save(argThat(res -> res.getSpaces().isEmpty()));
    }

    /**
     * Verifica que la conversión de fila CSV a entidad falle si la asignatura referenciada
     * en el código no existe en la base de datos.
     */
    @Test
    @DisplayName("❌ mapRowToEntity: Fallo si la asignatura no existe")
    void mapRowToEntity_SubjectNotFound() {
        String tomorrow = LocalDateTime.now().plusDays(1).format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        String[] row = {"UNKNOWN.01", tomorrow, "10.00", tomorrow, "12.00", "Desc", "Online"};
        
        when(subjectRepository.findByCode("UNKNOWN")).thenReturn(Optional.empty());

        assertThrows(BusinessValidationException.class, () -> reservationImportService.mapRowToEntity(row));
    }

    /**
     * Verifica que el sistema rechace la importación de una fila cuya fecha programada
     * pertenezca al pasado, manteniendo la coherencia de negocio.
     */
    @Test
    @DisplayName("❌ mapRowToEntity: Fallo si la fecha está en el pasado")
    void mapRowToEntity_PastDate() {
        String yesterday = LocalDateTime.now().minusDays(1).format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        String[] row = {"GSI", yesterday, "10.00", yesterday, "12.00", "Desc", "Online"};
        
        assertThrows(BusinessValidationException.class, () -> reservationImportService.mapRowToEntity(row));
    }

    /**
     * Verifica que la conversión falle cuando el rango horario especificado en la fila
     * sea ilógico (ej. la hora de fin es anterior a la hora de inicio).
     */
    @Test
    @DisplayName("❌ mapRowToEntity: Fallo si la hora de fin es anterior a inicio")
    void mapRowToEntity_InvalidTimeRange() {
        String tomorrow = LocalDateTime.now().plusDays(1).format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        String[] row = {"GSI", tomorrow, "12.00", tomorrow, "10.00", "Desc", "Online"};
        
        assertThrows(BusinessValidationException.class, () -> reservationImportService.mapRowToEntity(row));
    }

    /**
     * Verifica que el sistema rechace filas que contengan formatos de hora inválidos
     * (ej. uso de separadores incorrectos), forzando el formato establecido.
     */
    @Test
    @DisplayName("❌ mapRowToEntity: Fallo si el formato de hora es inválido")
    void mapRowToEntity_InvalidTimeFormat() {
        String tomorrow = LocalDateTime.now().plusDays(1).format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        String[] row = {"GSI", tomorrow, "10:00", tomorrow, "12:00", "Desc", "Online"}; // Usa ':' en lugar de '.'
        
        assertThrows(BusinessValidationException.class, () -> reservationImportService.mapRowToEntity(row));
    }

    /**
     * Verifica que se lance una excepción durante el mapeo si el tipo de reserva indicado
     * en el CSV no corresponde con un valor válido del enumerado.
     */
    @Test
    @DisplayName("❌ mapRowToEntity: Fallo si el tipo de reserva no existe")
    void mapRowToEntity_InvalidType() {
        String tomorrow = LocalDateTime.now().plusDays(1).format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        String[] row = {"GSI", tomorrow, "10.00", tomorrow, "12.00", "Desc", "Online", "INVALID_TYPE"};
        
        assertThrows(BusinessValidationException.class, () -> reservationImportService.mapRowToEntity(row));
    }

    /**
     * Verifica que la conversión falle cuando se indica un espacio físico en el CSV
     * que no se encuentra registrado en el sistema.
     */
    @Test
    @DisplayName("❌ mapRowToEntity: Fallo si el espacio físico no existe")
    void mapRowToEntity_SpaceNotFound() {
        String tomorrow = LocalDateTime.now().plusDays(1).format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        String[] row = {"GSI", tomorrow, "10.00", tomorrow, "12.00", "Desc", "NON_EXISTENT_SPACE"};
        
        Subject subject = Subject.builder().code("GSI").build();
        when(subjectRepository.findByCode("GSI")).thenReturn(Optional.of(subject));
        when(spaceRepository.findByNameIgnoreCase("NON_EXISTENT_SPACE")).thenReturn(Optional.empty());

        assertThrows(BusinessValidationException.class, () -> reservationImportService.mapRowToEntity(row));
    }

    /**
     * Verifica que, al comprobar conflictos internos dentro del mismo CSV,
     * las reservas de tipo "Online" sean ignoradas para solapamientos de espacio físico,
     * permitiendo que múltiples reservas online coexistan en el mismo periodo.
     */
    @Test
    @DisplayName("🧪 checkInternalOverlap: Ignora solapamiento si es Online")
    void checkInternalOverlap_IgnoresOnline() {
        String tomorrow = LocalDateTime.now().plusDays(1).format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        String[] row1 = {"GSI.01", tomorrow, "10.00", tomorrow, "11.00", "Desc", "Online"};
        String[] row2 = {"GSI.02", tomorrow, "10.30", tomorrow, "12.00", "Desc", "Online"};

        doAnswer(invocation -> {
            CsvProcessor.RowConsumer consumer = invocation.getArgument(2);
            consumer.accept(row1, 1);
            consumer.accept(row2, 2);
            return null;
        }).when(csvProcessor).process(any(), anyBoolean(), any());

        Subject subject = Subject.builder().code("GSI").build();
        when(subjectRepository.findByCode("GSI")).thenReturn(Optional.of(subject));

        ReservationImportResultDTO result = reservationImportService.validateFromCsv(mockFile);

        assertEquals(0, result.getConflicts().size());
        assertEquals(2, result.getSuccessCount());
    }
}
