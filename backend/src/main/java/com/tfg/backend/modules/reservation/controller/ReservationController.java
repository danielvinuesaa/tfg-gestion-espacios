package com.tfg.backend.modules.reservation.controller;

import com.tfg.backend.core.audit.Auditable;
import com.tfg.backend.core.common.BulkConflictSummaryDTO;
import com.tfg.backend.core.exception.BusinessValidationException;
import com.tfg.backend.core.util.BulkOperationUtils;
import com.tfg.backend.modules.reservation.dto.ReservationDTO;
import com.tfg.backend.modules.reservation.dto.ReservationImportResultDTO;
import com.tfg.backend.modules.reservation.dto.ReservationRequest;
import com.tfg.backend.modules.reservation.dto.ReservationStatusRequest;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.reservation.model.ReservationType;
import com.tfg.backend.modules.reservation.service.ReservationExportService;
import com.tfg.backend.modules.reservation.service.ReservationImportService;
import com.tfg.backend.modules.reservation.service.ReservationService;
import com.tfg.backend.modules.space.dto.SpaceConflictDTO;
import com.tfg.backend.modules.identity.model.User;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controlador REST diseñado para orquestar la gestión completa del ciclo de vida de las Reservas y Bloqueos.
 * Actúa como fachada de presentación integrando capacidades de validación, exportación,
 * importación y aplicación estricta de políticas de seguridad.
 */
@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    /** Servicio de reservas. */
    private final ReservationService reservationService;
    /** Servicio de exportación. */
    private final ReservationExportService reservationExportService;
    /** Servicio de importación. */
    private final ReservationImportService reservationImportService;

    /**
     * Exporta reservas.
     */
    @GetMapping("/export")
    @PreAuthorize("@ss.hasPermission('EXPORTAR_RESERVAS')")
    @Auditable(entity = "Reservation", action = "EXPORTAR_RESERVAS", includeId = false)
    public void exportReservations(
            @RequestParam(name = "userId", required = false) List<Long> userIds,
            @RequestParam(name = "subjectId", required = false) List<Long> subjectIds,
            @RequestParam(name = "spaceId", required = false) List<Long> spaceIds,
            @RequestParam(required = false) ReservationStatus status,
            @RequestParam(required = false) ReservationType type,
            @RequestParam(required = false, defaultValue = "all") String scope,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "true") boolean includeCancelled,
            @RequestParam(name = "columns", required = false) List<String> columns,
            HttpServletResponse response) throws IOException {
        
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"reservas.csv\"");

        reservationExportService.export(
                response.getOutputStream(),
                () -> reservationService.findAllEntities(status, type, spaceIds, scope, userIds, startDate, endDate, search, subjectIds, includeCancelled, Pageable.unpaged())
                        .getContent(),
                columns
        );
    }

    /**
     * Obtiene una lista de reservas.
     */
    @GetMapping
    @PreAuthorize("#scope == 'managed' or @ss.hasPermission('VER_TODAS_RESERVAS')")
    public ResponseEntity<Page<ReservationDTO>> getReservations(
            @RequestParam(name = "spaceId", required = false) List<Long> spaceIds,
            @RequestParam(name = "userId", required = false) List<Long> userIds,
            @RequestParam(name = "subjectId", required = false) List<Long> subjectIds,
            @RequestParam(required = false) ReservationStatus status,
            @RequestParam(required = false) ReservationType type,
            @RequestParam(required = false, defaultValue = "all") String scope,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "false") boolean includeCancelled,
            @PageableDefault(size = 10) Pageable pageable) {

        return ResponseEntity.ok(reservationService.findAll(
                status, type, spaceIds, scope, userIds, startDate, endDate, search, subjectIds, includeCancelled, pageable));
    }


    /**
     * Valida archivo CSV de reservas.
     */
    @PostMapping("/import/validate")
    @PreAuthorize("@ss.hasPermission('IMPORTAR_RESERVAS')")
    public ResponseEntity<ReservationImportResultDTO> validateImport(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(reservationImportService.validateFromCsv(file));
    }

    /**
     * Importa reservas de archivo CSV.
     */
    @PostMapping("/import")
    @PreAuthorize("@ss.hasPermission('IMPORTAR_RESERVAS')")
    public ResponseEntity<ReservationImportResultDTO> importReservations(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "overwrite", defaultValue = "false") boolean overwrite,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(reservationImportService.importFromCsv(file, user.getEmail(), overwrite));
    }

    /**
     * Obtiene conflictos.
     */
    @GetMapping("/conflicts")
    public ResponseEntity<List<com.tfg.backend.modules.space.dto.SpaceConflictDTO>> getConflicts(
            @RequestParam List<Long> spaceIds,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @RequestParam(required = false) Long excludeId) {
        
        return ResponseEntity.ok(reservationService.checkConflicts(spaceIds, startTime, endTime, excludeId));
    }

    /**
     * Obtiene una reserva por ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("@ss.canViewReservation(#id)")
    public ResponseEntity<ReservationDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(reservationService.findById(id));
    }

    /**
     * Crea una reserva.
     */
    @PostMapping
    @PreAuthorize("@ss.hasPermission('SOLICITAR_RESERVA') and (!#request.block or @ss.isAdmin())")
    public ResponseEntity<ReservationDTO> create(@Valid @RequestBody ReservationRequest request, @AuthenticationPrincipal User user) {
        return new ResponseEntity<>(reservationService.createReservation(request, user.getEmail()), HttpStatus.CREATED);
    }

    /**
     * Actualiza una reserva.
     */
    @PutMapping("/{id}")
    @PreAuthorize("@ss.canEditReservation(#id) and (!#request.block or @ss.isAdmin())")
    public ResponseEntity<ReservationDTO> update(@PathVariable Long id, @Valid @RequestBody ReservationRequest request) {
        return ResponseEntity.ok(reservationService.updateReservation(id, request));
    }

    /**
     * Actualiza estado de reserva.
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("@ss.canApproveReservation(#id)")
    public ResponseEntity<ReservationDTO> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ReservationStatusRequest request) {

        return ResponseEntity.ok(reservationService.updateStatus(id, request.getStatus(), request.getRejectionReason()));
    }

    /**
     * Elimina reserva.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("@ss.canCancelReservation(#id)")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        reservationService.deleteReservation(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Obtiene conflictos masivos.
     */
    @GetMapping("/bulk/conflicts")
    public ResponseEntity<com.tfg.backend.core.common.BulkConflictSummaryDTO> getBulkConflicts(
            @RequestParam(required = false) List<Long> ids,
            @RequestParam(name = "userId", required = false) List<Long> userIds,
            @RequestParam(name = "subjectId", required = false) List<Long> subjectIds,
            @RequestParam(name = "spaceId", required = false) List<Long> spaceIds,
            @RequestParam(required = false) ReservationStatus status,
            @RequestParam(required = false) ReservationType type,
            @RequestParam(required = false, defaultValue = "all") String scope,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "true") boolean includeCancelled) {
        
        List<Long> targetIds = BulkOperationUtils.resolveIds(ids, 
                () -> reservationService.findAll(status, type, spaceIds, scope, userIds, startDate, endDate, search, subjectIds, includeCancelled, Pageable.unpaged()),
                ReservationDTO::getId);
        
        return ResponseEntity.ok(reservationService.getBulkReservationConflictSummary(targetIds));
    }

    /**
     * Elimina masivamente reservas.
     */
    @DeleteMapping("/bulk")
    @PreAuthorize("@ss.hasPermission('CANCELAR_RESERVA') or @ss.hasPermission('SOLICITAR_RESERVA')")
    public ResponseEntity<Void> deleteBulk(
            @RequestParam(required = false) List<Long> ids,
            @RequestParam(name = "userId", required = false) List<Long> userIds,
            @RequestParam(name = "subjectId", required = false) List<Long> subjectIds,
            @RequestParam(name = "spaceId", required = false) List<Long> spaceIds,
            @RequestParam(required = false) ReservationStatus status,
            @RequestParam(required = false) ReservationType type,
            @RequestParam(required = false, defaultValue = "all") String scope,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "true") boolean includeCancelled) {
        
        List<Long> targetIds = BulkOperationUtils.resolveIds(ids, 
                () -> reservationService.findAll(status, type, spaceIds, scope, userIds, startDate, endDate, search, subjectIds, includeCancelled, Pageable.unpaged()),
                ReservationDTO::getId);
        
        if (!targetIds.isEmpty()) {
            reservationService.deleteMultiple(targetIds);
        }
        
        return ResponseEntity.noContent().build();
    }

    /**
     * Obtiene tipos de reserva.
     */
    @GetMapping("/types")
    public ResponseEntity<List<ReservationType>> getReservationTypes() {
        return ResponseEntity.ok(List.of(ReservationType.values()));
    }
}
