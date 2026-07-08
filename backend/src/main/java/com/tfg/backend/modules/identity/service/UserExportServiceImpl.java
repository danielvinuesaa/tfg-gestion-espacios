package com.tfg.backend.modules.identity.service;
import com.tfg.backend.core.common.BaseCsvExportService;
import com.tfg.backend.modules.identity.model.User;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.OutputStream;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.function.Supplier;

/**
 * Implementación del servicio de exportación de usuarios.
 * Genera un archivo CSV con la información de los usuarios seleccionados,
 * gestionando el mapeo de columnas y el formato de los datos de salida.
 */
@Service
@RequiredArgsConstructor
public class UserExportServiceImpl extends BaseCsvExportService<User> implements UserExportService {

    /**
     * Exporta los usuarios a un flujo de salida.
     */
    @Override
    @Transactional(readOnly = true)
    public void export(OutputStream outputStream, Supplier<Iterable<User>> userSupplier, List<String> columns) throws IOException {
        super.export(outputStream, userSupplier, columns);
    }

    /**
     * Obtiene el encabezado de la columna.
     */
    @Override
    protected String getColumnHeader(String colId) {
        return switch (colId) {
            case "name" -> "Nombre Completo";
            case "email" -> "Correo Electrónico";
            case "role" -> "Rol Asignado";
            case "status" -> "Estado de Cuenta";
            default -> colId;
        };
    }

    /**
     * Obtiene el valor de la columna para un usuario.
     */
    @Override
    protected String getColumnValue(String colId, User user) {
        return switch (colId) {
            case "name" -> user.getName();
            case "email" -> user.getEmail();
            case "role" -> user.getRole() != null ? user.getRole().getName() : "N/A";
            case "status" -> user.getStatus() != null ? formatEnum(user.getStatus().name()) : "";
            default -> "";
        };
    }

    /**
     * Obtiene las columnas por defecto.
     */
    @Override
    protected List<String> getDefaultColumns() {
        return Arrays.asList("name", "email", "role", "status");
    }
}
