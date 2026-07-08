package com.tfg.backend.modules.analytics.controller;
import com.tfg.backend.core.audit.Auditable;
import com.tfg.backend.modules.analytics.dto.OccupancyRequest;
import com.tfg.backend.modules.analytics.dto.SignatureLogRequest;
import com.tfg.backend.modules.analytics.service.ReportService;
import com.tfg.backend.modules.reservation.dto.SubjectUsageRequest;
import com.tfg.backend.modules.reservation.model.Reservation;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayInputStream;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Controlador REST encargado de gestionar la generación y descarga de informes del sistema.
 * Proporciona endpoints para exportar datos en formatos PDF y CSV, requiriendo permisos específicos
 * para su ejecución.
 */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@org.springframework.security.access.prepost.PreAuthorize("@ss.hasPermission('GENERAR_INFORMES')")
public class ReportController {

    /**
     * Servicio orquestador responsable de coordinar la generación de todos los reportes.
     */
    private final ReportService reportService;

    /**
     * Genera y descarga un informe en formato PDF con los registros de firmas u hojas de asistencia.
     *
     * @param request Datos de la petición que incluyen los filtros temporales y de espacio.
     * @return Una respuesta HTTP que contiene el archivo PDF generado como un recurso de entrada.
     */
    @PostMapping("/signature-logs")
    @Auditable(entity = "REPORT", action = "GENERAR_PARTE_FIRMAS_PDF", includeId = false)
    public ResponseEntity<InputStreamResource> getSignatureLogs(@Valid @RequestBody SignatureLogRequest request) {
        ByteArrayInputStream bis = reportService.generateSignatureLogs(request);
        String filename = String.format("partes_firmas_%s_al_%s.pdf", request.getStartDate(), request.getEndDate());

        return createPdfResponse(bis, filename);
    }

    /**
     * Genera y descarga un informe en formato CSV con los registros de firmas u hojas de asistencia.
     *
     * @param request Datos de la petición con los filtros aplicables.
     * @return Una respuesta HTTP que contiene la cadena de texto estructurada en CSV.
     */
    @PostMapping("/signature-logs/csv")
    @Auditable(entity = "REPORT", action = "GENERAR_PARTE_FIRMAS_CSV", includeId = false)
    public ResponseEntity<String> exportSignatureLogsCSV(@Valid @RequestBody SignatureLogRequest request) {
        String csv = reportService.generateSignatureLogsCSV(request);
        
        return createCsvResponse(csv, "reporte_reservas.csv");
    }

    /**
     * Genera y descarga un informe en formato PDF sobre el uso de los espacios por parte de las asignaturas.
     *
     * @param request Datos de la petición con los filtros correspondientes a las asignaturas y rangos temporales.
     * @return Una respuesta HTTP que incluye el archivo PDF resultante.
     */
    @PostMapping("/subject-usage/pdf")
    @Auditable(entity = "REPORT", action = "GENERAR_INFORME_USO_ASIGNATURAS_PDF", includeId = false)
    public ResponseEntity<InputStreamResource> getSubjectUsagePDF(@Valid @RequestBody SubjectUsageRequest request) {
        ByteArrayInputStream bis = reportService.generateSubjectUsagePDF(request);
        String filename = "informe_uso_asignaturas.pdf";

        return createPdfResponse(bis, filename);
    }

    /**
     * Genera y descarga un informe en formato CSV referente al uso de asignaturas en los espacios.
     *
     * @param request Datos de la petición con los parámetros de filtrado.
     * @return Una respuesta HTTP que proporciona los datos de uso en formato CSV.
     */
    @PostMapping("/subject-usage/csv")
    @Auditable(entity = "REPORT", action = "GENERAR_INFORME_USO_ASIGNATURAS_CSV", includeId = false)
    public ResponseEntity<String> exportSubjectUsageCSV(@Valid @RequestBody SubjectUsageRequest request) {
        String csv = reportService.generateSubjectUsageCSV(request);
        String filename = "uso_asignaturas.csv";
        
        return createCsvResponse(csv, filename);
    }

    /**
     * Genera y descarga un informe en formato PDF que detalla la ocupación de los distintos espacios.
     *
     * @param request Parámetros de la petición que incluyen los espacios y el periodo a evaluar.
     * @return Una respuesta HTTP conteniendo el documento PDF con la ocupación calculada.
     */
    @PostMapping("/occupancy/pdf")
    @Auditable(entity = "REPORT", action = "GENERAR_INFORME_OCUPACION_PDF", includeId = false)
    public ResponseEntity<InputStreamResource> getOccupancyPDF(@Valid @RequestBody OccupancyRequest request) {
        ByteArrayInputStream bis = reportService.generateOccupancyPDF(request);
        
        return createPdfResponse(bis, "reporte_ocupacion.pdf");
    }

    /**
     * Genera y descarga un informe en formato CSV que refleja el nivel de ocupación de los espacios solicitados.
     *
     * @param request Datos de la solicitud con los filtros de espacios y fechas.
     * @return Una respuesta HTTP estructurada con el archivo CSV generado.
     */
    @PostMapping("/occupancy/csv")
    @Auditable(entity = "REPORT", action = "GENERAR_INFORME_OCUPACION_CSV", includeId = false)
    public ResponseEntity<String> exportOccupancyCSV(@Valid @RequestBody OccupancyRequest request) {
        String csv = reportService.generateOccupancyCSV(request);
        
        return createCsvResponse(csv, "reporte_ocupacion.csv");
    }

    /**
     * Obtiene el listado de reservas asociadas al uso de una asignatura particular en un intervalo de tiempo.
     *
     * @param subjectId Identificador de la asignatura.
     * @param startDate Fecha y hora de inicio del intervalo de análisis.
     * @param endDate Fecha y hora de fin del intervalo de análisis.
     * @return Una respuesta HTTP con una lista de objetos de transferencia de datos de reservas.
     */
    @GetMapping("/subject-usage")
    public ResponseEntity<List<com.tfg.backend.modules.reservation.dto.ReservationDTO>> getSubjectUsage(
            @RequestParam Long subjectId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        return ResponseEntity.ok(reportService.getApprovedReservationsBySubject(subjectId, startDate, endDate));
    }

    /**
     * Valida la disponibilidad de una lista de espacios en el rango de fechas proporcionado en la solicitud.
     * Retorna únicamente los identificadores de aquellos espacios que se encuentran libres.
     *
     * @param request Petición que encapsula los identificadores de espacios y las fechas límite.
     * @return Una respuesta HTTP con la lista de identificadores de los espacios disponibles.
     */
    @PostMapping("/validate-availability")
    public ResponseEntity<List<Long>> validateAvailability(@Valid @RequestBody SignatureLogRequest request) {
        return ResponseEntity.ok(reportService.getEmptySpaceIds(
                request.getSpaceIds(), 
                request.getStartDate().atStartOfDay(), 
                request.getEndDate().atTime(23, 59, 59)));
    }

    /**
     * Valida la disponibilidad de asignaturas específicas en un marco temporal y bajo ciertos tipos de reserva.
     * Devuelve una lista con los identificadores de aquellas asignaturas que cumplen con las condiciones de vacancia.
     *
     * @param request Solicitud que contiene los identificadores de las asignaturas, los tipos de reserva y el periodo.
     * @return Una respuesta HTTP con la lista de identificadores de las asignaturas que no presentan reservas solapadas.
     */
    @PostMapping("/validate-subjects-availability")
    public ResponseEntity<List<Long>> validateSubjectsAvailability(@Valid @RequestBody SubjectUsageRequest request) {
        return ResponseEntity.ok(reportService.getEmptySubjectIds(
                request.getSubjectIds(), 
                request.getReservationTypes(),
                request.getStartDate().atStartOfDay(), 
                request.getEndDate().atTime(23, 59, 59)));
    }

    // -- Métodos de Utilidad para Respuestas --

    /**
     * Construye una respuesta HTTP estandarizada para archivos PDF.
     *
     * @param bis Flujo de entrada de bytes del documento PDF.
     * @param filename Nombre con el cual se enviará el archivo adjunto.
     * @return La respuesta HTTP debidamente configurada para una descarga de PDF.
     */
    private ResponseEntity<InputStreamResource> createPdfResponse(ByteArrayInputStream bis, String filename) {
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "inline; filename=\"" + filename + "\"");
        headers.add("Access-Control-Expose-Headers", "Content-Disposition");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_PDF)
                .body(new InputStreamResource(bis));
    }

    /**
     * Construye una respuesta HTTP estandarizada para archivos de valores separados por comas (CSV).
     *
     * @param csv Cadena de texto que contiene los datos del archivo CSV.
     * @param filename Nombre del archivo que se utilizará en la descarga.
     * @return La respuesta HTTP configurada para la entrega de texto en formato CSV.
     */
    private ResponseEntity<String> createCsvResponse(String csv, String filename) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header("Access-Control-Expose-Headers", "Content-Disposition")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }
}
