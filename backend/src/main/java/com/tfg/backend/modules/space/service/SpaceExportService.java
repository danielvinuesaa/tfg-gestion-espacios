package com.tfg.backend.modules.space.service;
import com.tfg.backend.modules.space.model.Space;

import java.io.OutputStream;
import java.io.IOException;
import java.util.List;
import java.util.function.Supplier;

/**
 * Interfaz que define el contrato para los servicios de exportación de espacios.
 * Proporciona el mecanismo principal para extraer y escribir datos de espacios a diferentes flujos de salida.
 */
public interface SpaceExportService {

    /**
     * Exporta datos de espacios a un flujo de salida especificado.
     *
     * @param outputStream   El flujo de salida donde se escribirán los datos exportados (ej. un archivo CSV).
     * @param spaceSupplier  Un proveedor que suministra una colección iterable de entidades {@link Space}.
     *                       Permite la obtención diferida y eficiente de los datos.
     * @param columns        Una lista de nombres de columnas a incluir en la exportación.
     * @throws IOException   Si ocurre un error de entrada/salida durante el proceso de exportación.
     */
    void export(OutputStream outputStream, Supplier<Iterable<Space>> spaceSupplier, List<String> columns) throws IOException;
}
