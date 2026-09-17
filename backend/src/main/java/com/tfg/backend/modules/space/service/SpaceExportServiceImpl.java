package com.tfg.backend.modules.space.service;
import com.tfg.backend.core.common.BaseCsvExportService;
import com.tfg.backend.modules.space.model.Space;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.OutputStream;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.function.Supplier;

/**
 * Implementación del servicio de exportación, especializado en generar archivos CSV
 * a partir de listados de la entidad {@link Space}.
 * Define el formato y el mapeo de columnas para la exportación de espacios.
 */
@Service
@RequiredArgsConstructor
public class SpaceExportServiceImpl extends BaseCsvExportService<Space> implements SpaceExportService {

    @Override
    @Transactional(readOnly = true)
    public void export(OutputStream outputStream, Supplier<Iterable<Space>> spaceSupplier, List<String> columns) throws IOException {
        super.export(outputStream, spaceSupplier, columns);
    }

    @Override
    protected String getColumnHeader(String colId) {
        return switch (colId) {
            case "name" -> "Nombre del Espacio";
            case "type" -> "Tipo";
            case "capacity", "totalCapacity" -> "Capacidad Total";
            case "computers", "computerCount" -> "Ordenadores";
            case "status" -> "Estado";
            case "gisId" -> "ID GIS / Referencia";
            default -> colId;
        };
    }

    @Override
    protected String getColumnValue(String colId, Space space) {
        if (space == null) return "";
        return switch (colId) {
            case "name" -> space.getName();
            case "type" -> space.getType() != null ? formatEnum(space.getType().name()) : "";
            case "capacity", "totalCapacity" -> String.valueOf(space.getTotalCapacity() != null ? space.getTotalCapacity() : 0);
            case "computers", "computerCount" -> String.valueOf(space.getComputerCount() != null ? space.getComputerCount() : 0);
            case "status" -> space.getStatus() != null ? formatEnum(space.getStatus().name()) : "";
            case "gisId" -> space.getGisId() != null ? space.getGisId() : "";
            default -> "";
        };
    }

    @Override
    protected List<String> getDefaultColumns() {
        return Arrays.asList("name", "type", "totalCapacity", "status", "gisId");
    }
}
