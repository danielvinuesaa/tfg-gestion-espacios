package com.tfg.backend.modules.analytics.service.generators;
import com.tfg.backend.core.config.AppProperties;
import com.tfg.backend.modules.analytics.dto.OccupancyRequest;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.reservation.repository.ReservationSpecifications;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.space.repository.SpaceRepository;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Componente especializado en la generación de informes y estadísticas de ocupación de espacios.
 * Calcula métricas avanzadas como el ratio de uso real frente a la capacidad teórica del centro,
 * permitiendo analizar la saturación de los recursos físicos durante un periodo determinado.
 */
@Component
@RequiredArgsConstructor
public class OccupancyReportGenerator extends AbstractPdfGenerator implements ReportGenerator<OccupancyRequest> {

    /**
     * Repositorio para el acceso a la información de los espacios físicos.
     */
    private final SpaceRepository spaceRepository;

    /**
     * Repositorio para la consulta y obtención de los datos de reservas.
     */
    private final ReservationRepository reservationRepository;

    /**
     * Propiedades globales de configuración de la aplicación, como horarios lectivos.
     */
    private final AppProperties appProperties;

    /**
     * Genera un informe detallado en formato PDF sobre el uso y saturación de los espacios.
     *
     * @param request Parámetros y filtros para determinar el alcance del informe.
     * @return El documento PDF resultante contenido en un flujo de bytes.
     */
    @Override
    public ByteArrayInputStream generatePDF(OccupancyRequest request) {
        List<Space> spaces = getTargetSpaces(request);
        List<Long> spaceIds = spaces.stream().map(Space::getId).toList();
        
        // Uso de Specifications para consistencia total con el resto del sistema
        Specification<Reservation> spec = ReservationSpecifications.withFilters(
                com.tfg.backend.modules.reservation.model.ReservationStatus.APROBADA, null, request.getSpaceIds(), null, null, null, 
                request.getStartDate().atStartOfDay(), 
                request.getEndDate().atTime(LocalTime.MAX), 
                null, null, true
        );

        
        List<Reservation> reservations = reservationRepository.findAll(spec);

        long businessDays = countBusinessDays(request.getStartDate(), request.getEndDate());
        double dailyCapacity = appProperties.getTime().getEndHour() - appProperties.getTime().getStartHour();
        double totalCapacityPerSpace = dailyCapacity * businessDays;

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (Document document = createDocument(out, "Análisis de Ocupación y Saturación")) {
            
            // 1. Cabecera Ejecutiva
            document.add(new Paragraph("ANÁLISIS DE OCUPACIÓN Y SATURACIÓN")
                    .setBold().setFontSize(20).setFontColor(ColorConstants.DARK_GRAY));
            document.add(new Paragraph("Periodo: " + request.getStartDate() + " al " + request.getEndDate() + 
                    " (" + businessDays + " días lectivos)").setFontSize(10).setMarginBottom(20));

            // 2. Resumen Global
            double totalHoursUsed = reservations.stream()
                    .mapToDouble(r -> java.time.Duration.between(r.getStartTime(), r.getEndTime()).toMinutes() / 60.0)
                    .sum();
            double globalCapacity = totalCapacityPerSpace * spaces.size();
            double globalRatio = globalCapacity > 0 ? (totalHoursUsed / globalCapacity) * 100 : 0;

            Table globalSummary = new Table(UnitValue.createPercentArray(new float[]{33, 33, 34})).useAllAvailableWidth().setMarginBottom(25);
            globalSummary.addCell(createSummaryCard("Horas Totales Uso", String.format("%.1f h", totalHoursUsed)));
            globalSummary.addCell(createSummaryCard("Capacidad Total", String.format("%.1f h", globalCapacity)));
            globalSummary.addCell(createSummaryCard("Ratio de Ocupación", String.format("%.2f %%", globalRatio)));
            document.add(globalSummary);

            // 3. Tabla de Rankings por Espacio
            document.add(new Paragraph("Detalle de Uso por Espacio").setBold().setFontSize(12).setMarginBottom(10));
            
            Table table = new Table(UnitValue.createPercentArray(new float[]{30, 15, 15, 15, 25})).useAllAvailableWidth();
            table.addHeaderCell(createHeaderCell("ESPACIO / AULA"));
            table.addHeaderCell(createHeaderCell("TIPO"));
            table.addHeaderCell(createHeaderCell("H. USO"));
            table.addHeaderCell(createHeaderCell("% OCUP."));
            table.addHeaderCell(createHeaderCell("ESTADO"));

            Map<Long, Double> hoursBySpace = reservations.stream()
                .flatMap(r -> r.getSpaces().stream().map(s -> Map.entry(s.getId(), r)))
                .collect(Collectors.groupingBy(
                    Map.Entry::getKey,
                    Collectors.summingDouble(e -> java.time.Duration.between(e.getValue().getStartTime(), e.getValue().getEndTime()).toMinutes() / 60.0)
                ));

            List<Space> sortedSpaces = spaces.stream()
                .sorted((s1, s2) -> Double.compare(hoursBySpace.getOrDefault(s2.getId(), 0.0), hoursBySpace.getOrDefault(s1.getId(), 0.0)))
                .toList();

            for (Space s : sortedSpaces) {
                double hours = hoursBySpace.getOrDefault(s.getId(), 0.0);
                double ratio = totalCapacityPerSpace > 0 ? (hours / totalCapacityPerSpace) * 100 : 0;

                table.addCell(new Cell().add(new Paragraph(s.getName())).setFontSize(9).setBold());
                table.addCell(new Cell().add(new Paragraph(s.getType() != null ? s.getType().name() : "-")).setFontSize(8).setTextAlignment(TextAlignment.CENTER));
                table.addCell(new Cell().add(new Paragraph(String.format("%.1f", hours))).setFontSize(9).setTextAlignment(TextAlignment.CENTER));
                table.addCell(new Cell().add(new Paragraph(String.format("%.1f%%", ratio))).setFontSize(9).setTextAlignment(TextAlignment.CENTER));
                
                // Indicador visual de estado profesional (colores muted)
                String status;
                com.itextpdf.kernel.colors.Color color;
                if (ratio > 80) { status = "CRÍTICO"; color = new DeviceRgb(183, 28, 28); }
                else if (ratio > 50) { status = "ALTO"; color = new DeviceRgb(230, 81, 0); }
                else if (ratio > 20) { status = "NORMAL"; color = new DeviceRgb(27, 94, 32); }
                else { status = "BAJO"; color = new DeviceRgb(13, 71, 161); }

                table.addCell(new Cell().add(new Paragraph(status)).setFontSize(8).setBold().setFontColor(color).setTextAlignment(TextAlignment.CENTER));
            }
            document.add(table);
            addFooter(document);
        }
        return new ByteArrayInputStream(out.toByteArray());
    }

    /**
     * Genera los datos de ocupación y uso de espacios en formato CSV.
     *
     * @param request Filtros y parámetros requeridos para la generación.
     * @return Cadena de texto formateada como valores separados por comas.
     */
    @Override
    public String generateCSV(OccupancyRequest request) {
        List<Space> spaces = getTargetSpaces(request);
        List<Long> spaceIds = spaces.stream().map(Space::getId).toList();

        Specification<Reservation> spec = ReservationSpecifications.withFilters(
                com.tfg.backend.modules.reservation.model.ReservationStatus.APROBADA, null, request.getSpaceIds(), null, null, null, 
                request.getStartDate().atStartOfDay(), 
                request.getEndDate().atTime(LocalTime.MAX), 
                null, null, true
        );

        
        List<Reservation> reservations = reservationRepository.findAll(spec);

        long businessDays = countBusinessDays(request.getStartDate(), request.getEndDate());
        double totalCapacityPerSpace = (appProperties.getTime().getEndHour() - appProperties.getTime().getStartHour()) * businessDays;

        Map<Long, Double> hoursBySpace = reservations.stream()
            .flatMap(r -> r.getSpaces().stream().map(s -> Map.entry(s.getId(), r)))
            .collect(Collectors.groupingBy(Map.Entry::getKey, Collectors.summingDouble(e -> java.time.Duration.between(e.getValue().getStartTime(), e.getValue().getEndTime()).toMinutes() / 60.0)));

        StringBuilder csv = new StringBuilder("Espacio;Tipo;Horas_Uso;Capacidad_Total;Ratio_Ocupacion_Porcentaje\n");
        for (Space s : spaces) {
            double hours = hoursBySpace.getOrDefault(s.getId(), 0.0);
            double ratio = totalCapacityPerSpace > 0 ? (hours / totalCapacityPerSpace) * 100 : 0;
            csv.append(String.format("%s;%s;%.2f;%.2f;%.2f\n",
                s.getName(), s.getType(), hours, totalCapacityPerSpace, ratio));
        }
        return csv.toString();
    }

    /**
     * Obtiene la lista de espacios sobre los que se calculará el reporte,
     * ya sea por identificadores explícitos o tomando todos los registrados.
     *
     * @param req La petición de reporte con los posibles filtros de espacio.
     * @return Lista de entidades de espacio seleccionadas.
     */
    private List<Space> getTargetSpaces(OccupancyRequest req) {
        if (req.getSpaceIds() != null && !req.getSpaceIds().isEmpty()) {
            return spaceRepository.findAllById(req.getSpaceIds());
        }
        return spaceRepository.findAll();
    }

    /**
     * Calcula el número de días hábiles entre dos fechas, excluyendo fines de semana.
     *
     * @param start Fecha de inicio del periodo.
     * @param end Fecha de fin del periodo.
     * @return La cantidad de días laborables contabilizados.
     */
    private long countBusinessDays(LocalDate start, LocalDate end) {
        return start.datesUntil(end.plusDays(1))
                .filter(d -> d.getDayOfWeek() != DayOfWeek.SATURDAY && d.getDayOfWeek() != DayOfWeek.SUNDAY)
                .count();
    }
}
