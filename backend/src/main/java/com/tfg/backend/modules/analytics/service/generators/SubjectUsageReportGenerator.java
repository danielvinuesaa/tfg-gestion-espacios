package com.tfg.backend.modules.analytics.service.generators;
import com.tfg.backend.modules.reservation.dto.SubjectUsageRequest;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.Subject;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.reservation.repository.ReservationSpecifications;
import com.tfg.backend.modules.reservation.repository.SubjectRepository;
import com.tfg.backend.modules.space.model.Space;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Componente especializado en la elaboración de Informes de Uso de Recursos estructurados por Asignatura.
 * Analiza pormenorizadamente el consumo de horas lectivas y la utilización de espacios,
 * sirviendo como herramienta de soporte para la auditoría docente y la planificación académica.
 */
@Component
@RequiredArgsConstructor
public class SubjectUsageReportGenerator extends AbstractPdfGenerator implements ReportGenerator<SubjectUsageRequest> {

    /**
     * Repositorio para acceder a la base de datos de las asignaturas.
     */
    private final SubjectRepository subjectRepository;

    /**
     * Repositorio para las consultas sobre el historial de reservas.
     */
    private final ReservationRepository reservationRepository;

    /**
     * Genera un documento PDF con los detalles sobre cómo las asignaturas utilizan los recursos.
     *
     * @param request Filtros que determinan las asignaturas y fechas a considerar.
     * @return Flujo de datos correspondiente al documento PDF construido.
     */
    @Override
    public ByteArrayInputStream generatePDF(SubjectUsageRequest request) {
        List<Subject> subjects = subjectRepository.findAllById(request.getSubjectIds());
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        // Uso de Specifications para obtener los datos de forma profesional y centralizada
        Specification<Reservation> spec = ReservationSpecifications.withFilters(
                com.tfg.backend.modules.reservation.model.ReservationStatus.APROBADA, null, null, null, null, null, 
                request.getStartDate().atStartOfDay(), 
                request.getEndDate().atTime(LocalTime.MAX), 
                null, request.getSubjectIds(), true
        );
        
        List<Reservation> allReservations = reservationRepository.findAll(spec);

        try (Document document = createDocument(out, "Informe de Uso por Asignaturas")) {
            boolean firstPage = true;
            for (Subject subject : subjects) {
                if (!firstPage) document.add(new AreaBreak());
                firstPage = false;
                
                List<Reservation> subjectReservations = filterForSubjectAndType(allReservations, subject.getId(), request);
                addSubjectPage(document, subject, request, subjectReservations);
            }
        }
        return new ByteArrayInputStream(out.toByteArray());
    }

    /**
     * Agrega una página al documento PDF para presentar el resumen y detalle de uso de una asignatura.
     *
     * @param document El documento PDF en construcción.
     * @param subject La asignatura a detallar.
     * @param request Petición original con los filtros aplicados.
     * @param reservations Lista de reservas vinculadas a la asignatura.
     */
    private void addSubjectPage(Document document, Subject subject, SubjectUsageRequest request, List<Reservation> reservations) {
        // Cabecera Estilizada
        Table header = new Table(UnitValue.createPercentArray(new float[]{70, 30})).useAllAvailableWidth().setMarginBottom(15);
        header.addCell(new Cell().add(new Paragraph("INFORME DE USO DE RECURSOS").setBold().setFontSize(18).setFontColor(ColorConstants.DARK_GRAY)).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
        header.addCell(new Cell().add(new Paragraph(subject.getCode()).setBold().setFontSize(22).setTextAlignment(TextAlignment.RIGHT).setFontColor(ColorConstants.GRAY)).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
        document.add(header);

        document.add(new Paragraph("Asignatura: " + subject.getName()).setBold().setFontSize(12));
        
        String typesStr = (request.getReservationTypes() != null && !request.getReservationTypes().isEmpty()) 
            ? request.getReservationTypes().stream().map(Enum::name).collect(Collectors.joining(", ")) 
            : "TODOS";

        document.add(new Paragraph("Curso: " + subject.getCourse() + " | Tipos: " + typesStr + " | Periodo: " + request.getStartDate() + " al " + request.getEndDate()).setFontSize(10).setMarginBottom(15));

        // Resumen
        double hours = reservations.stream().mapToDouble(r -> java.time.Duration.between(r.getStartTime(), r.getEndTime()).toMinutes() / 60.0).sum();
        Table summary = new Table(UnitValue.createPercentArray(new float[]{33, 33, 34})).useAllAvailableWidth().setMarginBottom(20);
        summary.addCell(createSummaryCard("Sesiones", String.valueOf(reservations.size())));
        summary.addCell(createSummaryCard("Horas Totales", String.format("%.1f h", hours)));
        summary.addCell(createSummaryCard("Espacios", String.valueOf(reservations.stream().flatMap(r -> r.getSpaces().stream()).distinct().count())));
        document.add(summary);

        // Tabla detallada
        Table details = new Table(UnitValue.createPercentArray(new float[]{12, 9, 9, 12, 23, 35})).useAllAvailableWidth();
        details.addHeaderCell(createHeaderCell("FECHA"));
        details.addHeaderCell(createHeaderCell("INICIO"));
        details.addHeaderCell(createHeaderCell("FIN"));
        details.addHeaderCell(createHeaderCell("TIPO"));
        details.addHeaderCell(createHeaderCell("ESPACIOS"));
        details.addHeaderCell(createHeaderCell("MOTIVO / DOCENTE"));

        DateTimeFormatter dF = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        DateTimeFormatter tF = DateTimeFormatter.ofPattern("HH:mm");

        for (Reservation r : reservations) {
            details.addCell(new Cell().add(new Paragraph(r.getStartTime().format(dF))).setFontSize(8).setTextAlignment(TextAlignment.CENTER));
            details.addCell(new Cell().add(new Paragraph(r.getStartTime().format(tF))).setFontSize(8).setTextAlignment(TextAlignment.CENTER));
            details.addCell(new Cell().add(new Paragraph(r.getEndTime().format(tF))).setFontSize(8).setTextAlignment(TextAlignment.CENTER));
            details.addCell(new Cell().add(new Paragraph(r.getType() != null ? r.getType().name() : "N/A")).setFontSize(8).setTextAlignment(TextAlignment.CENTER));
            details.addCell(new Cell().add(new Paragraph(r.getSpaces().stream().map(Space::getName).collect(Collectors.joining(", ")))).setFontSize(8));
            details.addCell(new Cell().add(new Paragraph((r.getTitle() != null ? r.getTitle() : "") + (r.getResponsibleName() != null ? "\nDocente: " + r.getResponsibleName() : ""))).setFontSize(7));
        }
        document.add(details);
        addFooter(document);
    }

    /**
     * Genera la exportación en formato CSV del consumo de espacios por asignaturas.
     *
     * @param request Parámetros de la solicitud de reporte.
     * @return Contenido del informe en formato de texto CSV.
     */
    @Override
    public String generateCSV(SubjectUsageRequest request) {
        Specification<Reservation> spec = ReservationSpecifications.withFilters(
                com.tfg.backend.modules.reservation.model.ReservationStatus.APROBADA, null, null, null, null, null, 
                request.getStartDate().atStartOfDay(), 
                request.getEndDate().atTime(LocalTime.MAX), 
                null, request.getSubjectIds(), true
        );
        
        List<Reservation> reservations = reservationRepository.findAll(spec).stream()
            .filter(r -> request.getReservationTypes() == null || request.getReservationTypes().isEmpty() || request.getReservationTypes().contains(r.getType()))
            .collect(Collectors.toList());

        StringBuilder csv = new StringBuilder("Asignatura;Curso;Tipo;Fecha;Inicio;Fin;Horas;Espacios;Docente\n");
        for (Reservation r : reservations) {
            double h = java.time.Duration.between(r.getStartTime(), r.getEndTime()).toMinutes() / 60.0;
            csv.append(String.format("%s;%s;%s;%s;%s;%s;%.2f;%s;%s\n",
                r.getSubject().getName(), r.getSubject().getCourse(), r.getType(), r.getStartTime().toLocalDate(),
                r.getStartTime().toLocalTime(), r.getEndTime().toLocalTime(), h,
                r.getSpaces().stream().map(Space::getName).collect(Collectors.joining(", ")),
                r.getResponsibleName() != null ? r.getResponsibleName() : (r.getUser() != null ? r.getUser().getName() : "N/A")
            ));
        }
        return csv.toString();
    }

    /**
     * Filtra una lista de reservas para quedarse exclusivamente con las de una asignatura
     * y tipos de reserva específicos.
     *
     * @param list Colección original de reservas.
     * @param subjectId Identificador de la asignatura deseada.
     * @param req Filtros de la petición que pueden incluir tipos de reserva permitidos.
     * @return Lista reducida de reservas que cumplen los criterios.
     */
    private List<Reservation> filterForSubjectAndType(List<Reservation> list, Long subjectId, SubjectUsageRequest req) {
        return list.stream()
                .filter(r -> r.getSubject() != null && r.getSubject().getId().equals(subjectId))
                .filter(r -> req.getReservationTypes() == null || req.getReservationTypes().isEmpty() || req.getReservationTypes().contains(r.getType()))
                .collect(Collectors.toList());
    }
}
