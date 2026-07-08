package com.tfg.backend.modules.space.controller;

import com.tfg.backend.modules.space.dto.SpaceDTO;
import com.tfg.backend.core.audit.Auditable;
import com.tfg.backend.core.common.BulkConflictSummaryDTO;
import com.tfg.backend.core.common.ImportResultDTO;
import com.tfg.backend.core.util.BulkOperationUtils;
import com.tfg.backend.modules.reservation.dto.AvailabilitySearchRequest;
import com.tfg.backend.modules.space.dto.SpaceConflictDTO;
import com.tfg.backend.modules.space.dto.SpaceRequest;
import com.tfg.backend.modules.space.model.SpaceStatus;
import com.tfg.backend.modules.space.model.SpaceType;
import com.tfg.backend.modules.space.service.SpaceExportService;
import com.tfg.backend.modules.space.service.SpaceService;
import com.tfg.backend.modules.identity.model.User;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Controlador REST que expone los puntos de acceso (endpoints) para la gestión integral de espacios físicos.
 * Maneja las peticiones HTTP relacionadas con operaciones CRUD, importación, exportación y búsqueda avanzada de espacios.
 */
@RestController
@RequestMapping("/api/spaces")
@RequiredArgsConstructor
public class SpaceController {

    /**
     * Servicio que gestiona la lógica de negocio de los espacios.
     */
    private final SpaceService spaceService;

    /**
     * Servicio especializado en la exportación de la información de los espacios.
     */
    private final SpaceExportService spaceExportService;

    /**
     * Exportación profesional de espacios a CSV.
     */
    @GetMapping("/export")
    @PreAuthorize("@ss.hasPermission('LEER_ESPACIOS')")
    @Auditable(entity = "Space", action = "EXPORTAR_ESPACIOS", includeId = false)
    public void exportSpaces(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) SpaceType type,
            @RequestParam(required = false) SpaceStatus status,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) Integer minComputers,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(defaultValue = "false") boolean includeDeleted,
            @RequestParam(name = "columns", required = false) List<String> columns,
            HttpServletResponse response) throws IOException {

        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"espacios.csv\"");

        spaceExportService.export(
                response.getOutputStream(),
                () -> spaceService.searchSpacesEntities(name, type, status, minCapacity, minComputers, start, end, includeDeleted, Pageable.unpaged()).getContent(),
                columns
        );
    }

    /**
     * Recupera una lista paginada de espacios filtrada por múltiples criterios.
     * 
     * @param name Nombre parcial del espacio.
     * @param type Tipo de espacio a buscar.
     * @param status Estado operativo del espacio.
     * @param minCapacity Capacidad mínima requerida.
     * @param minComputers Cantidad mínima de ordenadores requerida.
     * @param start Fecha de inicio para comprobar disponibilidad.
     * @param end Fecha de fin para comprobar disponibilidad.
     * @param includeDeleted Si se deben incluir los espacios marcados como eliminados.
     * @param pageable Configuración de paginación de la consulta.
     * @return Una página que contiene los espacios encontrados.
     */
    @GetMapping
    public ResponseEntity<Page<SpaceDTO>> getAllSpaces(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) SpaceType type,
            @RequestParam(required = false) SpaceStatus status,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) Integer minComputers,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(defaultValue = "false") boolean includeDeleted,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(spaceService.searchSpaces(name, type, status, minCapacity, minComputers, start, end, includeDeleted, pageable));
    }

    /**
     * Obtiene la información detallada de un espacio mediante su identificador.
     * 
     * @param id Identificador único del espacio.
     * @return El espacio solicitado encapsulado en un DTO.
     */
    @GetMapping("/{id}")
    public ResponseEntity<SpaceDTO> getSpaceById(@PathVariable Long id) {
        return ResponseEntity.ok(spaceService.findById(id));
    }

    /**
     * Crea un nuevo espacio en el sistema a partir de los datos proporcionados.
     * 
     * @param request Datos de creación del espacio.
     * @return El espacio creado exitosamente.
     */
    @PostMapping
    @PreAuthorize("@ss.hasPermission('CREAR_ESPACIOS')")
    public ResponseEntity<SpaceDTO> createSpace(@Valid @RequestBody SpaceRequest request) {
        return new ResponseEntity<>(spaceService.create(request), org.springframework.http.HttpStatus.CREATED);
    }

    /**
     * Actualiza la información de un espacio existente.
     * 
     * @param id Identificador del espacio a modificar.
     * @param request Datos actualizados del espacio.
     * @return El espacio con sus datos modificados.
     */
    @PutMapping("/{id}")
    @PreAuthorize("@ss.hasPermission('EDITAR_ESPACIOS')")
    public ResponseEntity<SpaceDTO> updateSpace(@PathVariable Long id, @Valid @RequestBody SpaceRequest request) {
        return ResponseEntity.ok(spaceService.update(id, request));
    }

    /**
     * Elimina lógicamente un espacio del sistema.
     * 
     * @param id Identificador del espacio a eliminar.
     * @return Respuesta vacía que indica el éxito de la operación.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("@ss.hasPermission('ELIMINAR_ESPACIOS')")
    public ResponseEntity<Void> deleteSpace(@PathVariable Long id) {
        spaceService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Restaura un espacio que había sido eliminado previamente de forma lógica.
     * 
     * @param id Identificador del espacio a restaurar.
     * @return Respuesta vacía que confirma la restauración.
     */
    @PostMapping("/{id}/restore")
    @PreAuthorize("@ss.hasPermission('ELIMINAR_ESPACIOS')")
    public ResponseEntity<Void> restoreSpace(@PathVariable Long id) {
        spaceService.restoreById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Obtiene una lista de conflictos asociados a un espacio, por ejemplo, reservas solapadas.
     * 
     * @param id Identificador del espacio a consultar.
     * @return Lista de conflictos detectados en el espacio.
     */
    @GetMapping("/{id}/conflicts")
    public ResponseEntity<List<SpaceConflictDTO>> getConflicts(@PathVariable Long id) {
        return ResponseEntity.ok(spaceService.getConflicts(id));
    }

    /**
     * Valida el formato y contenido de un archivo previo a la importación masiva de espacios.
     * 
     * @param file Archivo a analizar para la validación.
     * @return Resultado del proceso de validación.
     */
    @PostMapping("/import/validate")
    @PreAuthorize("@ss.hasPermission('CREAR_ESPACIOS')")
    public ResponseEntity<ImportResultDTO> validateImport(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(spaceService.validateImport(file));
    }

    /**
     * Importa masivamente espacios al sistema a partir de un archivo proporcionado.
     * 
     * @param file Archivo que contiene los espacios a importar.
     * @param overwrite Indica si se deben sobrescribir los espacios existentes.
     * @return Resumen del resultado de la importación.
     */
    @PostMapping("/import")
    @PreAuthorize("@ss.hasPermission('CREAR_ESPACIOS')")
    public ResponseEntity<ImportResultDTO> importSpaces(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "overwrite", defaultValue = "false") boolean overwrite) {
        return ResponseEntity.ok(spaceService.importSpaces(file, overwrite));
    }

    /**
     * Obtiene un resumen de los conflictos que ocurrirían en caso de eliminar de forma masiva
     * los espacios que cumplen los criterios dados.
     * 
     * @param ids Lista opcional de identificadores directos.
     * @param name Filtro por nombre.
     * @param type Filtro por tipo.
     * @param status Filtro por estado.
     * @param minCapacity Filtro por capacidad mínima.
     * @param minComputers Filtro por cantidad mínima de ordenadores.
     * @param start Filtro de disponibilidad inicial.
     * @param end Filtro de disponibilidad final.
     * @param includeDeleted Filtro sobre si están borrados.
     * @return Resumen estructurado de los conflictos por borrado masivo.
     */
    @GetMapping("/bulk/conflicts")
    @PreAuthorize("@ss.hasPermission('ELIMINAR_ESPACIOS')")
    public ResponseEntity<BulkConflictSummaryDTO> getBulkConflicts(
            @RequestParam(required = false) List<Long> ids,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) SpaceType type,
            @RequestParam(required = false) SpaceStatus status,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) Integer minComputers,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(defaultValue = "false") boolean includeDeleted) {
        
        List<Long> targetIds = BulkOperationUtils.resolveIds(ids, 
                () -> spaceService.searchSpaces(name, type, status, minCapacity, minComputers, start, end, includeDeleted, Pageable.unpaged()),
                SpaceDTO::getId);
        
        return ResponseEntity.ok(spaceService.getBulkSpaceConflictSummary(targetIds));
    }

    /**
     * Elimina de forma masiva los espacios que cumplan con los filtros especificados o
     * aquellos indicados explícitamente en una lista de IDs.
     * 
     * @param ids Lista explícita de espacios a eliminar.
     * @param name Filtro de nombre.
     * @param type Filtro de tipo.
     * @param status Filtro de estado.
     * @param minCapacity Filtro de capacidad mínima.
     * @param minComputers Filtro mínimo de ordenadores.
     * @param start Rango temporal de inicio.
     * @param end Rango temporal final.
     * @param includeDeleted Filtro de espacios ya eliminados.
     * @param force Indica si la eliminación fuerza el borrado saltándose conflictos permitidos.
     * @param user Usuario autenticado que realiza la operación.
     * @return Respuesta indicando la finalización del borrado.
     */
    @DeleteMapping("/bulk")
    @PreAuthorize("@ss.hasPermission('ELIMINAR_ESPACIOS')")
    public ResponseEntity<Void> deleteBulk(
            @RequestParam(required = false) List<Long> ids,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) SpaceType type,
            @RequestParam(required = false) SpaceStatus status,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) Integer minComputers,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(defaultValue = "false") boolean includeDeleted,
            @RequestParam(defaultValue = "false") boolean force,
            @AuthenticationPrincipal User user) {
        
        List<Long> targetIds = BulkOperationUtils.resolveIds(ids, 
                () -> spaceService.searchSpaces(name, type, status, minCapacity, minComputers, start, end, includeDeleted, Pageable.unpaged()),
                SpaceDTO::getId);


        if (!targetIds.isEmpty()) {
            spaceService.deleteMultiple(targetIds, force);
        }

        return ResponseEntity.noContent().build();
    }

    /**
     * Obtiene los diferentes tipos de espacios definidos en el sistema.
     * 
     * @return Lista de los valores posibles de SpaceType.
     */
    @GetMapping("/types")
    public ResponseEntity<List<SpaceType>> getSpaceTypes() {
        return ResponseEntity.ok(List.of(SpaceType.values()));
    }

    /**
     * Busca y propone espacios que estén disponibles para una determinada petición de reserva,
     * evaluando su capacidad y requerimientos.
     * 
     * @param request Petición con las condiciones de búsqueda de disponibilidad.
     * @return Propuestas de espacios que cumplen las condiciones dadas.
     */
    @PostMapping("/search-available")
    @PreAuthorize("@ss.hasPermission('SOLICITAR_RESERVA')")
    public ResponseEntity<Object> searchAvailable(@Valid @RequestBody AvailabilitySearchRequest request) {
        return ResponseEntity.ok(spaceService.getProposals(request));
    }
}
