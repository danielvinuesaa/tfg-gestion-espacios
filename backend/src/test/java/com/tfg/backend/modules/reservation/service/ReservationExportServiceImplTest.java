package com.tfg.backend.modules.reservation.service;

import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.reservation.model.ReservationType;
import com.tfg.backend.modules.reservation.model.Subject;
import com.tfg.backend.modules.space.model.Space;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Suite de pruebas unitarias para el servicio de exportación de reservas {@link ReservationExportServiceImpl}.
 * Verifica la correcta generación de archivos CSV, la conversión de formatos de fecha, hora y duración,
 * y la correcta asignación de etiquetas profesionales para las columnas.
 */
class ReservationExportServiceImplTest {

    private ReservationExportServiceImpl reservationExportService;
    private Reservation r1;

    @BeforeEach
    void setUp() {
        reservationExportService = new ReservationExportServiceImpl();
        
        Space s1 = Space.builder().name("Aula 101").build();
        Subject subj = Subject.builder().name("Matemáticas").code("MAT101").build();
        r1 = Reservation.builder()
                .title("Clase de TFG")
                .startTime(LocalDateTime.of(2026, 5, 23, 10, 0))
                .endTime(LocalDateTime.of(2026, 5, 23, 12, 0))
                .status(ReservationStatus.APROBADA)
                .type(ReservationType.CLASE)
                .spaces(Set.of(s1))
                .responsibleName("Dani")
                .subject(subj)
                .build();
    }

    /**
     * Verifica que el servicio genere correctamente el contenido de un archivo CSV a partir
     * de una lista de reservas, incluyendo las cabeceras solicitadas y los valores formateados.
     * 
     * @throws IOException si ocurre un error durante la escritura en el flujo de salida.
     */
    @Test
    void export_ShouldGenerateCsvContent() throws IOException {
        // Arrange
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        List<String> columns = List.of("title", "startDate", "location", "status");

        // Act
        reservationExportService.export(out, () -> List.of(r1), columns);

        // Assert
        String csv = out.toString();
        assertNotNull(csv);
        assertTrue(csv.contains("Título de la Reserva"));
        assertTrue(csv.contains("Clase de TFG"));
        assertTrue(csv.contains("23/05/2026"));
        assertTrue(csv.contains("Aula 101"));
        assertTrue(csv.contains("Aprobada")); 
    }

    /**
     * Verifica que la función de extracción de valores recupere y formatee correctamente
     * los datos de la reserva según la columna solicitada (fechas, horas, duraciones, estado, etc.).
     */
    @Test
    void getColumnValue_ShouldFormatCorrectly() {
        assertEquals("Clase de TFG", reservationExportService.getColumnValue("title", r1));
        assertEquals("23/05/2026", reservationExportService.getColumnValue("startDate", r1));
        assertEquals("10:00", reservationExportService.getColumnValue("startTime", r1));
        assertEquals("120", reservationExportService.getColumnValue("duration", r1));
        assertEquals("Aprobada", reservationExportService.getColumnValue("status", r1));
        assertEquals("Aula 101", reservationExportService.getColumnValue("location", r1));
        assertEquals("MAT101", reservationExportService.getColumnValue("subjectCode", r1));
        assertEquals("Dani", reservationExportService.getColumnValue("responsible", r1));
    }

    /**
     * Verifica que el cálculo de la duración de una reserva retorne cero cuando la fecha y hora
     * de inicio coinciden exactamente con la fecha y hora de fin.
     */
    @Test
    void getColumnValue_DurationZero_ShouldReturnZero() {
        r1.setEndTime(r1.getStartTime());
        assertEquals("0", reservationExportService.getColumnValue("duration", r1));
    }

    /**
     * Verifica que el método para obtener las columnas por defecto retorne una lista
     * completa y obligatoria con los campos estándar para la exportación de reservas.
     */
    @Test
    void getDefaultColumns_ShouldReturnCompleteList() {
        List<String> cols = reservationExportService.getDefaultColumns();
        assertTrue(cols.contains("title"));
        assertTrue(cols.contains("startDate"));
        assertTrue(cols.contains("location"));
        assertTrue(cols.contains("status"));
    }

    /**
     * Verifica que el servicio asigne correctamente etiquetas profesionales en español
     * (e.g. "Título de la Reserva", "Fecha de Inicio") a los nombres técnicos de las columnas.
     */
    @Test
    void getColumnHeader_ShouldReturnProfessionalLabels() {
        assertEquals("Título de la Reserva", reservationExportService.getColumnHeader("title"));
        assertEquals("Fecha de Inicio", reservationExportService.getColumnHeader("startDate"));
        assertEquals("Estado Actual", reservationExportService.getColumnHeader("status"));
    }
}
