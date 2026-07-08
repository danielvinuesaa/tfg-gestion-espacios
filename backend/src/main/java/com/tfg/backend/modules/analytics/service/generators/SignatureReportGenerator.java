package com.tfg.backend.modules.analytics.service.generators;
import com.tfg.backend.core.config.AppProperties;
import com.tfg.backend.modules.analytics.dto.SignatureLogRequest;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.reservation.repository.ReservationSpecifications;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.space.repository.SpaceRepository;

import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.WeekFields;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

/**
 * Componente especializado en la generación de Partes Semanales de Firmas (cuadrantes de asistencia).
 * Transforma los datos de reservas en plantillas visuales estructuradas por espacios, días y franjas horarias,
 * facilitando el control riguroso de asistencia presencial y el registro oficial de docentes.
 */
@Component
@RequiredArgsConstructor
public class SignatureReportGenerator extends AbstractPdfGenerator implements ReportGenerator<SignatureLogRequest> {

    /**
     * Repositorio para la consulta y gestión de los espacios físicos disponibles.
     */
    private final SpaceRepository spaceRepository;

    /**
     * Repositorio para la obtención de las reservas que ocupan dichos espacios.
     */
    private final ReservationRepository reservationRepository;

    /**
     * Propiedades globales de la aplicación, utilizadas para determinar horarios.
     */
    private final AppProperties appProperties;

    /**
     * Altura constante definida para cada celda que representa una franja horaria en la tabla.
     */
    private static final float SLOT_HEIGHT = 26.5f;

    /**
     * Genera un informe en PDF con los cuadrantes semanales de firmas para un conjunto de espacios.
     *
     * @param request Filtros temporales y lista de espacios a incluir.
     * @return El flujo de bytes del documento PDF generado.
     */
    @Override
    public ByteArrayInputStream generatePDF(SignatureLogRequest request) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        List<Space> spaces = spaceRepository.findAllById(request.getSpaceIds());
        
        // Uso de Specifications para obtener los datos de forma profesional y centralizada
        Specification<Reservation> spec = ReservationSpecifications.withFilters(
                com.tfg.backend.modules.reservation.model.ReservationStatus.APROBADA, null, request.getSpaceIds(), null, null, null, 
                request.getStartDate().atStartOfDay(), 
                request.getEndDate().atTime(LocalTime.MAX), 
                null, null, true
        );
        
        List<Reservation> allReservations = reservationRepository.findAll(spec);

        try (Document document = createDocument(out, "Parte Semanal de Firmas")) {
            boolean firstPage = true;
            for (Space space : spaces) {
                LocalDate current = request.getStartDate();
                while (!current.isAfter(request.getEndDate())) {
                    LocalDate weekEnd = current.plusDays(4); // Lunes a Viernes
                    if (weekEnd.isAfter(request.getEndDate())) weekEnd = request.getEndDate();

                    if (!firstPage) document.add(new AreaBreak());
                    firstPage = false;

                    addWeeklyPage(document, space, current, weekEnd, allReservations);
                    current = current.plusWeeks(1).with(java.time.DayOfWeek.MONDAY);
                }
            }
        }
        return new ByteArrayInputStream(out.toByteArray());
    }

    /**
     * Exporta los datos de los partes de firmas a un formato tabular CSV.
     *
     * @param request Parámetros de la consulta.
     * @return Una cadena de texto con el formato CSV.
     */
    @Override
    public String generateCSV(SignatureLogRequest request) {
        Specification<Reservation> spec = ReservationSpecifications.withFilters(
                com.tfg.backend.modules.reservation.model.ReservationStatus.APROBADA, null, request.getSpaceIds(), null, null, null, 
                request.getStartDate().atStartOfDay(), 
                request.getEndDate().atTime(LocalTime.MAX), 
                null, null, true
        );
        
        List<Reservation> reservations = reservationRepository.findAll(spec);
        
        StringBuilder csv = new StringBuilder("Espacio;Fecha;Inicio;Fin;Responsable;Asignatura;Descripcion\n");
        for (Reservation r : reservations) {
            String spaceNames = r.getSpaces().stream().map(Space::getName).collect(Collectors.joining(", "));
            csv.append(String.format("%s;%s;%s;%s;%s;%s;%s\n",
                spaceNames, r.getStartTime().toLocalDate(), r.getStartTime().toLocalTime(), r.getEndTime().toLocalTime(),
                r.getResponsibleName() != null ? r.getResponsibleName() : r.getUser().getName(),
                r.getSubject() != null ? r.getSubject().getName() : "N/A",
                r.getDescription() != null ? r.getDescription().replace(";", ",") : ""
            ));
        }
        return csv.toString();
    }

    /**
     * Agrega una página al documento correspondiente a una semana específica para un espacio dado.
     *
     * @param document El documento PDF actual.
     * @param space El espacio sobre el que se genera el cuadrante.
     * @param start Fecha de inicio de la semana (Lunes).
     * @param end Fecha de fin de la semana (Viernes).
     * @param allReservations Lista de todas las reservas para filtrar las del espacio y periodo.
     */
    private void addWeeklyPage(Document document, Space space, LocalDate start, LocalDate end, List<Reservation> allReservations) {
        String typeLabel = space.getType() != null ? space.getType().name().toLowerCase() : "espacio";
        document.add(new Paragraph("Horarios de reserva del " + typeLabel + " " + space.getName())
                .setBold().setFontSize(16).setTextAlignment(TextAlignment.CENTER).setMarginBottom(0).setMarginTop(0));
        
        int weekNum = start.get(WeekFields.of(Locale.getDefault()).weekOfWeekBasedYear());
        document.add(new Paragraph("Semana nº " + weekNum + " (del " + start + " al " + end + ")")
                .setFontSize(11).setTextAlignment(TextAlignment.CENTER).setMarginBottom(6).setMarginTop(0));

        Table table = new Table(UnitValue.createPercentArray(new float[]{10, 18, 18, 18, 18, 18})).useAllAvailableWidth();
        table.setBorder(new com.itextpdf.layout.borders.SolidBorder(0.8f));

        table.addHeaderCell(createHeaderCell("HORA/DÍA"));
        String[] days = {"LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES"};
        for (int i = 0; i < 5; i++) {
            table.addHeaderCell(createHeaderCell(days[i] + " [" + start.plusDays(i) + "]"));
        }

        List<Reservation> spaceReservations = allReservations.stream()
                .filter(r -> r.getSpaces().stream().anyMatch(s -> s.getId().equals(space.getId())))
                .toList();

        int totalSlots = (appProperties.getTime().getEndHour() - appProperties.getTime().getStartHour()) * 2;
        boolean[][] covered = new boolean[totalSlots][5];

        for (int s = 0; s < totalSlots; s++) {
            int h = appProperties.getTime().getStartHour() + (s / 2);
            int m = (s % 2) * 30;
            LocalTime slotTime = LocalTime.of(h, m);
            
            table.addCell(new Cell().add(new Paragraph(String.format("%02d:%02d", h, m)).setFontSize(8).setBold())
                    .setPadding(2).setHeight(SLOT_HEIGHT).setTextAlignment(TextAlignment.CENTER)
                    .setVerticalAlignment(VerticalAlignment.MIDDLE)
                    .setBorder(new com.itextpdf.layout.borders.SolidBorder(0.5f)));

            for (int d = 0; d < 5; d++) {
                if (covered[s][d]) continue;
                LocalDate date = start.plusDays(d);
                Reservation res = findReservationAt(spaceReservations, date, slotTime);

                if (res != null) {
                    int rowspan = calculateRowspan(res, slotTime, totalSlots - s);
                    Cell cell = new Cell(rowspan, 1).setPadding(3).setHeight(SLOT_HEIGHT * rowspan)
                            .setVerticalAlignment(VerticalAlignment.MIDDLE)
                            .setBorder(new com.itextpdf.layout.borders.SolidBorder(0.8f));
                    addDetailsToCell(cell, res);
                    table.addCell(cell);
                    for (int r = 0; r < rowspan; r++) covered[s + r][d] = true;
                } else {
                    table.addCell(new Cell().setHeight(SLOT_HEIGHT).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
                }
            }
        }
        document.add(table);
    }

    /**
     * Rellena una celda de la tabla con los detalles específicos de una reserva (título, docente, firmas, etc.).
     *
     * @param cell Celda objetivo del documento.
     * @param res Reserva de la cual se extraen los datos.
     */
    private void addDetailsToCell(Cell cell, Reservation res) {
        String title = res.getTitle() != null ? res.getTitle() : (res.getSubject() != null ? res.getSubject().getCode() : "Reserva");
        cell.add(new Paragraph(title).setBold().setUnderline().setFontSize(8).setMarginBottom(4));
        Paragraph p = new Paragraph().setFontSize(7).setFixedLeading(9);
        p.add(new Text("Tema: \nNº Asistentes: \nDocente: \nFirma:"));
        cell.add(p);
    }

    /**
     * Calcula la cantidad de celdas contiguas (rowspan) que debe ocupar una reserva según su duración.
     *
     * @param res La reserva en cuestión.
     * @param slotTime Hora de inicio de la franja.
     * @param remaining Cantidad de franjas restantes en el día.
     * @return El número de filas que abarcará la celda.
     */
    private int calculateRowspan(Reservation res, LocalTime slotTime, int remaining) {
        long minutes = java.time.Duration.between(slotTime, res.getEndTime().toLocalTime()).toMinutes();
        return Math.max(1, Math.min((int) (minutes / 30), remaining));
    }

    /**
     * Busca y devuelve la reserva que coincide con una fecha y hora específicas.
     *
     * @param reservations Lista de reservas del espacio.
     * @param date Fecha a comprobar.
     * @param time Hora a comprobar dentro de la fecha.
     * @return La reserva si existe solapamiento, o null en caso contrario.
     */
    private Reservation findReservationAt(List<Reservation> reservations, LocalDate date, LocalTime time) {
        return reservations.stream()
                .filter(r -> r.getStartTime().toLocalDate().equals(date))
                .filter(r -> !r.getStartTime().toLocalTime().isAfter(time) && r.getEndTime().toLocalTime().isAfter(time))
                .findFirst().orElse(null);
    }
}
