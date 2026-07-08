package com.tfg.backend.modules.analytics.service;

import com.tfg.backend.core.common.BaseCsvExportService;
import com.tfg.backend.modules.analytics.model.AuditLog;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.OutputStream;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.function.Supplier;

/**
 * Implementación del servicio de exportación de registros de auditoría a formato CSV.
 * Proporciona la lógica para mapear los campos de auditoría a columnas exportables,
 * incluyendo la resolución de nombres de usuarios y entidades.
 */
@Service
@RequiredArgsConstructor
public class AuditExportServiceImpl extends BaseCsvExportService<AuditLog> implements AuditExportService {

    /**
     * Repositorio para consultar la información complementaria de los usuarios responsables.
     */
    private final UserRepository userRepository;

    /**
     * Formateador estándar de fechas utilizado para la presentación en el archivo CSV.
     */
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    /**
     * Exporta los registros de auditoría proporcionados al flujo de salida en formato CSV.
     *
     * @param outputStream Flujo de salida donde se escribirá el archivo CSV.
     * @param logSupplier Proveedor de los registros de auditoría a exportar.
     * @param columns Lista de identificadores de las columnas a incluir en la exportación.
     * @throws IOException Si ocurre un error de entrada/salida durante la escritura.
     */
    @Override
    @Transactional(readOnly = true)
    public void export(OutputStream outputStream, Supplier<Iterable<AuditLog>> logSupplier, List<String> columns) throws IOException {
        super.export(outputStream, logSupplier, columns);
    }

    /**
     * Obtiene el encabezado descriptivo para una columna específica.
     *
     * @param colId Identificador interno de la columna.
     * @return El nombre legible de la columna para el archivo CSV.
     */
    @Override
    protected String getColumnHeader(String colId) {
        return switch (colId) {
            case "timestamp" -> "Fecha y Hora";
            case "action" -> "Acción";
            case "performedBy" -> "Realizado por";
            case "entity" -> "Entidad Afectada";
            case "details" -> "Detalles de la Operación";
            default -> colId;
        };
    }

    /**
     * Obtiene el valor formateado correspondiente a una columna para un registro de auditoría.
     *
     * @param colId Identificador interno de la columna.
     * @param log Registro de auditoría del cual extraer el valor.
     * @return El valor convertido a cadena de texto para su exportación.
     */
    @Override
    protected String getColumnValue(String colId, AuditLog log) {
        return switch (colId) {
            case "timestamp" -> log.getTimestamp() != null ? log.getTimestamp().format(DATE_FORMATTER) : "";
            case "action" -> formatEnum(log.getAction());
            case "performedBy" -> getAuthorDisplayName(log.getPerformedBy());
            case "entity" -> log.getEntityName() + (log.getEntityId() != null ? " (ID: " + log.getEntityId() + ")" : "");
            case "details" -> log.getDetails() != null ? log.getDetails() : "";
            default -> "";
        };
    }

    /**
     * Obtiene el nombre completo y rol del autor de la acción a partir de su correo electrónico.
     *
     * @param performedBy Correo electrónico o identificador del sistema del autor.
     * @return El nombre formateado del autor, o "Sistema" si fue una acción automatizada.
     */
    private String getAuthorDisplayName(String performedBy) {
        if (performedBy == null) return "N/A";
        if (performedBy.startsWith("SYSTEM")) return performedBy.replace("SYSTEM", "Sistema");
        
        return userRepository.findByEmail(performedBy)
                .map(u -> u.getName() + " (" + u.getRole().getName() + ")")
                .orElse(performedBy);
    }

    /**
     * Obtiene la lista predeterminada de columnas a exportar si no se especifica ninguna.
     *
     * @return Una lista con los identificadores de las columnas por defecto.
     */
    @Override
    protected List<String> getDefaultColumns() {
        return Arrays.asList("timestamp", "action", "performedBy", "entity", "details");
    }
}
