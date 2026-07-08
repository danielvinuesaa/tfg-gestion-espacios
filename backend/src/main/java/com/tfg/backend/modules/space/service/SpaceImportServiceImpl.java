package com.tfg.backend.modules.space.service;
import com.tfg.backend.core.common.BaseCsvImportService;
import com.tfg.backend.core.common.ImportConflictDTO;
import com.tfg.backend.core.common.ImportResultDTO;
import com.tfg.backend.core.exception.BusinessValidationException;
import com.tfg.backend.core.util.CsvProcessor;
import com.tfg.backend.modules.analytics.service.AuditService;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.space.model.SpaceStatus;
import com.tfg.backend.modules.space.model.SpaceType;
import com.tfg.backend.modules.space.repository.SpaceRepository;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Implementación profesional del servicio de importación de espacios.
 * Refactorizada para usar BaseCsvImportService.
 */
@Service
@Slf4j
public class SpaceImportServiceImpl extends BaseCsvImportService<Space, ImportConflictDTO, ImportResultDTO> implements SpaceImportService {

    /** Repositorio de espacios. */
    private final SpaceRepository spaceRepository;
    /** Repositorio de reservas. */
    private final ReservationRepository reservationRepository;
    /** Servicio de auditoría. */
    private final AuditService auditService;

    public SpaceImportServiceImpl(SpaceRepository spaceRepository, ReservationRepository reservationRepository, 
                                  AuditService auditService, CsvProcessor csvProcessor) {
        super(csvProcessor);
        this.spaceRepository = spaceRepository;
        this.reservationRepository = reservationRepository;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public ImportResultDTO validateCsv(MultipartFile file) {
        return processFile(file, ImportResultDTO::new, (space, result, processedNames, row) -> {
            checkConflict(space, result, processedNames);
        });
    }

    @Override
    @Transactional
    public ImportResultDTO importFromCsv(MultipartFile file, boolean overwrite) {
        ImportResultDTO result = processFile(file, ImportResultDTO::new, (space, res, processedNames, row) -> {
            processRowImport(space, overwrite, res, processedNames);
        });

        auditService.logAction("Space", "IMPORT_SPACES", null, 
                "Importación masiva finalizada. Éxitos: " + result.getSuccessCount());
        
        return result;
    }

    private void processRowImport(Space csvData, boolean overwrite, ImportResultDTO result, Set<String> processedNames) {
        String normalized = csvData.getName().trim().toLowerCase();
        if (processedNames.contains(normalized)) {
            throw new BusinessValidationException("Registro duplicado en el archivo.");
        }

        Optional<Space> existingOpt = spaceRepository.findByNameIgnoreCase(csvData.getName());
        if (existingOpt.isPresent()) {
            if (overwrite) {
                Space existing = existingOpt.get();
                if (!reservationRepository.findBySpaceId(existing.getId()).isEmpty()) {
                    throw new BusinessValidationException("El espacio tiene reservas activas y no puede ser sobreescrito.");
                }
                updateSpaceData(existing, csvData);
                spaceRepository.save(existing);
                result.incrementSuccess();
            } else {
                result.addError("Conflicto: El espacio '" + csvData.getName() + "' ya existe.");
            }
        } else {
            spaceRepository.save(csvData);
            result.incrementSuccess();
            result.incrementNew();
        }
        processedNames.add(normalized);
    }

    private void checkConflict(Space space, ImportResultDTO result, Set<String> processedNames) {
        String normalized = space.getName().trim().toLowerCase();
        if (processedNames.contains(normalized)) {
            throw new BusinessValidationException("Nombre duplicado en el propio archivo CSV.");
        }

        Optional<Space> existing = spaceRepository.findByNameIgnoreCase(space.getName());
        if (existing.isPresent()) {
            boolean hasRes = !reservationRepository.findBySpaceId(existing.get().getId()).isEmpty();
            result.addConflict(ImportConflictDTO.builder()
                .name(space.getName())
                .type(space.getType().name())
                .capacity(space.getTotalCapacity())
                .status(space.getStatus().name())
                .gisId(space.getGisId())
                .currentType(existing.get().getType().name())
                .currentCapacity(existing.get().getTotalCapacity())
                .currentStatus(existing.get().getStatus().name())
                .currentGisId(existing.get().getGisId())
                .hasReservations(hasRes)
                .canOverwrite(!hasRes)
                .build());
        } else {
            result.incrementSuccess();
            result.incrementNew();
        }
        processedNames.add(normalized);
    }

    @Override
    protected void validateRowStructure(String[] row) {
        if (row.length < 3) throw new BusinessValidationException("Formato incorrecto: faltan columnas básicas (Nombre, Tipo, Capacidad).");
        
        List<String> errors = new java.util.ArrayList<>();
        if (row[0].trim().isEmpty()) errors.add("El nombre es obligatorio");
        if (row[1].trim().isEmpty()) errors.add("El tipo es obligatorio");
        if (row[2].trim().isEmpty()) errors.add("La capacidad es obligatoria");

        if (!errors.isEmpty()) {
            throw new BusinessValidationException(String.join(", ", errors) + ".");
        }
    }

    @Override
    protected Space mapRowToEntity(String[] row) {
        String typeRaw = row[1].trim().toUpperCase();
        SpaceType type;
        try {
            type = SpaceType.valueOf(typeRaw);
        } catch (IllegalArgumentException e) {
            String validTypes = java.util.Arrays.stream(SpaceType.values()).map(Enum::name).collect(java.util.stream.Collectors.joining(", "));
            throw new BusinessValidationException("Tipo de espacio inválido '" + typeRaw + "'. Opciones: " + validTypes);
        }

        int capacity;
        try {
            capacity = Integer.parseInt(row[2].trim());
            if (capacity < 1) {
                throw new BusinessValidationException("Capacidad mínima requerida: 1 (se encontró " + capacity + ")");
            }
        } catch (NumberFormatException e) {
            throw new BusinessValidationException("La capacidad debe ser un número entero.");
        }

        return Space.builder()
                .name(row[0].trim())
                .type(type)
                .totalCapacity(capacity)
                .status(parseStatus(row.length > 3 ? row[3].trim() : null))
                .gisId(row.length > 4 && !row[4].trim().isEmpty() ? row[4].trim() : null)
                .build();
    }

    private SpaceStatus parseStatus(String s) {
        if (s == null || s.isEmpty()) return SpaceStatus.DISPONIBLE;
        String lower = s.toLowerCase();
        if (lower.contains("dispo") || lower.contains("libre")) return SpaceStatus.DISPONIBLE;
        try { return SpaceStatus.valueOf(s.toUpperCase()); } catch (Exception e) { return SpaceStatus.DISPONIBLE; }
    }

    private void updateSpaceData(Space target, Space source) {
        target.setType(source.getType());
        target.setTotalCapacity(source.getTotalCapacity());
        target.setStatus(source.getStatus());
        target.setGisId(source.getGisId());
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportToCsv() { return new byte[0]; }
}
