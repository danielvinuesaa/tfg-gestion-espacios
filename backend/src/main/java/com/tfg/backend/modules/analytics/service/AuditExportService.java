package com.tfg.backend.modules.analytics.service;

import com.tfg.backend.modules.analytics.model.AuditLog;

import java.io.OutputStream;
import java.io.IOException;
import java.util.List;
import java.util.function.Supplier;

/**
 * Interfaz que define el contrato de servicios de exportación para los registros de auditoría.
 * Proporciona un mecanismo eficiente, basado en flujos de datos (streams) y evaluación perezosa,
 * para extraer grandes volúmenes de logs sin saturar la memoria del servidor.
 */
public interface AuditExportService {
    
    /**
     * Exporta los registros de auditoría al flujo de salida especificado.
     *
     * @param outputStream El flujo de datos de salida (ej. la respuesta HTTP).
     * @param logSupplier  Proveedor diferido que suministra la colección de logs a exportar.
     * @param columns      Lista de nombres de las columnas que se deben incluir en el archivo final.
     * @throws IOException Si ocurre un error de E/S durante la escritura de los datos.
     */
    void export(OutputStream outputStream, Supplier<Iterable<AuditLog>> logSupplier, List<String> columns) throws IOException;
}
