package com.tfg.backend.core.common;

import com.opencsv.CSVWriter;
import lombok.extern.slf4j.Slf4j;

import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Supplier;

/**
 * Servicio base genérico para la exportación de datos a formato CSV.
 * <p>
 * Proporciona la lógica común para escribir datos en un flujo de salida,
 * gestionando el Byte Order Mark (BOM) para compatibilidad con Microsoft Excel,
 * el mapeo de columnas y la serialización de los elementos.
 * </p>
 *
 * @param <T> El tipo de entidad que se va a exportar.
 */
@Slf4j
public abstract class BaseCsvExportService<T> {

    /**
     * Procesa la exportación completa de los datos a formato CSV, respetando
     * las columnas y el orden solicitados.
     *
     * @param outputStream El flujo de salida donde se escribirán los datos.
     * @param dataSupplier Un proveedor que suministra los elementos a exportar.
     * @param columns Lista de identificadores de las columnas a exportar. Si es nula o vacía, se utilizarán las columnas por defecto.
     * @throws IOException Si ocurre un error de entrada/salida durante la escritura del archivo.
     */
    public void export(OutputStream outputStream, Supplier<Iterable<T>> dataSupplier, List<String> columns) throws IOException {
        // Aseguramos que usamos las columnas pedidas o las por defecto si vienen vacías
        final List<String> selectedColumns = (columns == null || columns.isEmpty()) ? getDefaultColumns() : columns;

        // 1. BOM para Excel
        outputStream.write(0xEF);
        outputStream.write(0xBB);
        outputStream.write(0xBF);

        try (CSVWriter csvWriter = new CSVWriter(new OutputStreamWriter(outputStream, StandardCharsets.UTF_8), 
                ';', 
                CSVWriter.DEFAULT_QUOTE_CHARACTER, 
                CSVWriter.DEFAULT_ESCAPE_CHARACTER, 
                CSVWriter.DEFAULT_LINE_END)) {

            // 2. Escribir Cabeceras (en el orden solicitado)
            String[] header = selectedColumns.stream()
                    .map(this::getColumnHeader)
                    .toArray(String[]::new);
            csvWriter.writeNext(header);

            // 3. Obtener y procesar Datos
            Iterable<T> data = dataSupplier.get();
            int count = 0;
            for (T item : data) {
                List<String> row = new ArrayList<>();
                for (String colId : selectedColumns) {
                    row.add(getColumnValue(colId, item));
                }
                csvWriter.writeNext(row.toArray(new String[0]));
                count++;
                if (count % 100 == 0) csvWriter.flush();
            }
            csvWriter.flush();
            log.info("Exportación finalizada: {} registros con {} columnas.", count, selectedColumns.size());
        }
        outputStream.flush();
    }

    /**
     * Obtiene el texto de cabecera que se mostrará para una columna específica.
     *
     * @param colId El identificador interno de la columna.
     * @return El nombre legible de la cabecera para la columna.
     */
    protected abstract String getColumnHeader(String colId);

    /**
     * Obtiene el valor correspondiente a una columna específica para un elemento dado.
     *
     * @param colId El identificador interno de la columna.
     * @param item El elemento del cual extraer el valor.
     * @return El valor en formato de cadena de texto para la celda correspondiente.
     */
    protected abstract String getColumnValue(String colId, T item);

    /**
     * Obtiene la lista de columnas por defecto que se utilizarán en caso de no especificarse ninguna.
     *
     * @return Una lista con los identificadores de las columnas por defecto.
     */
    protected abstract List<String> getDefaultColumns();

    /**
     * Formatea el nombre de una constante de enumeración para mejorar su legibilidad.
     * Reemplaza los guiones bajos por espacios y aplica formato de primera letra mayúscula.
     *
     * @param name El nombre de la constante de enumeración o cadena a formatear.
     * @return La cadena formateada y legible para el usuario.
     */
    protected String formatEnum(String name) {
        if (name == null || name.isEmpty()) return "";
        return name.substring(0, 1).toUpperCase() + name.substring(1).toLowerCase().replace("_", " ");
    }
}
