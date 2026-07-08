package com.tfg.backend.modules.reservation.service;
import com.tfg.backend.core.common.BaseCsvExportService;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.space.model.Space;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.OutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.function.Supplier;
import java.util.stream.Collectors;

/**
 * Componente que provee la implementación para la exportación de registros de reservas en formato tabular.
 * Asegura la correcta correspondencia con la estructura de visualización del frontend y segrega los 
 * componentes temporales (fecha y hora) para facilitar el procesamiento analítico.
 */
@Service
@RequiredArgsConstructor
public class ReservationExportServiceImpl extends BaseCsvExportService<Reservation> implements ReservationExportService {

    /** Formateador para las fechas de exportación. */
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    /** Formateador para las horas de exportación. */
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");

    @Override
    @Transactional(readOnly = true)
    public void export(OutputStream outputStream, Supplier<Iterable<Reservation>> reservationSupplier, List<String> columns) throws IOException {
        super.export(outputStream, reservationSupplier, columns);
    }

    @Override
    protected String getColumnHeader(String colId) {
        return switch (colId) {
            case "title" -> "Título de la Reserva";
            case "subjectCode" -> "Código de Asignatura";
            case "startDate" -> "Fecha de Inicio";
            case "startTime" -> "Hora de Inicio";
            case "endDate" -> "Fecha de Fin";
            case "endTime" -> "Hora de Fin";
            case "location" -> "Espacios / Aulas";
            case "status" -> "Estado Actual";
            case "type" -> "Tipo de Actividad";
            case "responsible" -> "Persona Responsable";
            case "description" -> "Descripción";
            case "duration" -> "Duración (Min)";
            default -> colId;
        };
    }

    @Override
    protected String getColumnValue(String colId, Reservation reservation) {
        if (reservation == null) return "";
        return switch (colId) {
            case "title" -> reservation.getTitle();
            case "subjectCode" -> reservation.getSubject() != null ? reservation.getSubject().getCode() : "N/A";
            case "startDate" -> reservation.getStartTime() != null ? reservation.getStartTime().format(DATE_FORMAT) : "";
            case "startTime" -> reservation.getStartTime() != null ? reservation.getStartTime().format(TIME_FORMAT) : "";
            case "endDate" -> reservation.getEndTime() != null ? reservation.getEndTime().format(DATE_FORMAT) : "";
            case "endTime" -> reservation.getEndTime() != null ? reservation.getEndTime().format(TIME_FORMAT) : "";
            case "location" -> reservation.getSpaces() != null ? 
                    reservation.getSpaces().stream().map(Space::getName).collect(Collectors.joining(" | ")) : "";
            case "status" -> formatEnum(reservation.getStatus().name());
            case "type" -> formatEnum(reservation.getType().name());
            case "responsible" -> reservation.getResponsibleName() != null ? reservation.getResponsibleName() : 
                                 (reservation.getUser() != null ? reservation.getUser().getName() : "N/A");
            case "description" -> reservation.getDescription() != null ? reservation.getDescription() : "";
            case "duration" -> calculateDuration(reservation);
            default -> "";
        };
    }

    /**
     * Calcula la duración en minutos de la reserva.
     *
     * @param r La reserva.
     * @return La duración como cadena.
     */
    private String calculateDuration(Reservation r) {
        if (r.getStartTime() == null || r.getEndTime() == null) return "0";
        long diff = java.time.Duration.between(r.getStartTime(), r.getEndTime()).toMinutes();
        return String.valueOf(diff);
    }

    @Override
    protected List<String> getDefaultColumns() {
        return Arrays.asList("title", "subjectCode", "startDate", "startTime", "endDate", "endTime", "location", "status");
    }
}
