package com.tfg.backend.modules.analytics.controller;
import com.tfg.backend.core.audit.Auditable;
import com.tfg.backend.modules.analytics.dto.AuditLogDTO;
import com.tfg.backend.modules.analytics.service.AuditExportService;
import com.tfg.backend.modules.analytics.service.AuditService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Controlador REST encargado de gestionar las peticiones relacionadas con los registros de auditoría.
 * Proporciona endpoints para la consulta paginada y la exportación de logs.
 * El acceso está restringido a usuarios con permisos de administración.
 */
@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("@ss.isAdmin()")
public class AuditLogController {

    /**
     * Servicio que contiene la lógica de negocio para gestionar el historial de auditoría.
     */
    private final AuditService auditService;

    /**
     * Servicio especializado en la exportación a archivos del registro de auditoría.
     */
    private final AuditExportService auditExportService;

    /**
     * Recupera una lista paginada de registros de auditoría que cumplen con los criterios de búsqueda especificados.
     *
     * @param action Acción específica a filtrar (opcional).
     * @param performedBy Correo electrónico o nombre del usuario que realizó la acción (opcional).
     * @param startDate Fecha y hora de inicio del periodo de búsqueda (opcional).
     * @param endDate Fecha y hora de finalización del periodo de búsqueda (opcional).
     * @param pageable Configuración de paginación y ordenamiento por defecto.
     * @return Una respuesta HTTP que contiene la página de registros de auditoría (DTOs).
     */
    @GetMapping
    public ResponseEntity<Page<AuditLogDTO>> getAuditLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String performedBy,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @PageableDefault(size = 20, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable) {
        
        return ResponseEntity.ok(auditService.searchLogs(action, performedBy, startDate, endDate, pageable));
    }

    /**
     * Exporta el historial de registros de auditoría a un archivo CSV basado en los filtros proporcionados.
     *
     * @param action Acción específica a filtrar en la exportación (opcional).
     * @param performedBy Correo electrónico o nombre del usuario ejecutor (opcional).
     * @param startDate Fecha y hora de inicio del periodo a exportar (opcional).
     * @param endDate Fecha y hora de finalización del periodo a exportar (opcional).
     * @param columns Lista de identificadores de las columnas a incluir en el CSV (opcional).
     * @param response Objeto HttpServletResponse donde se escribirá el archivo exportado.
     * @throws IOException Si ocurre un error al escribir en el flujo de salida.
     */
    @GetMapping("/export")
    @Auditable(entity = "AuditLog", action = "EXPORTAR_AUDITORIA", includeId = false)
    public void exportAuditLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String performedBy,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(name = "columns", required = false) List<String> columns,
            HttpServletResponse response) throws IOException {

        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"auditoria.csv\"");

        auditExportService.export(
                response.getOutputStream(),
                () -> auditService.findAllLogsForExport(action, performedBy, startDate, endDate),
                columns
        );
    }
}

