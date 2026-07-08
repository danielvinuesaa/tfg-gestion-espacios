package com.tfg.backend.core.util;
import com.tfg.backend.core.exception.BusinessValidationException;

import com.opencsv.CSVParser;
import com.opencsv.CSVParserBuilder;
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.ByteArrayInputStream;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.nio.charset.CharsetDecoder;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Procesador genérico y centralizado para la lectura y gestión de archivos en formato CSV.
 * <p>
 * Encapsula la lógica de lectura a través de la librería OpenCSV y estandariza la
 * detección inteligente de codificación de caracteres (para soportar formatos como UTF-8
 * y Windows-1252 procedentes de Microsoft Excel). Además, unifica el tratamiento de errores de formato.
 * </p>
 */
@Component
@Slf4j
public class CsvProcessor {

    /**
     * Procesa secuencialmente un archivo CSV y ejecuta una acción específica por cada fila válida encontrada.
     *
     * @param file El archivo CSV multipart a procesar.
     * @param skipHeader Indica si se debe omitir la lectura de la primera fila (cabecera).
     * @param rowProcessor La función consumidora que encapsula la lógica de negocio a ejecutar para cada fila.
     * @throws BusinessValidationException Si el archivo está vacío, no tiene un formato válido o si ocurre un error semántico durante el procesamiento de una fila.
     */
    public void process(MultipartFile file, boolean skipHeader, RowConsumer rowProcessor) {
        if (file == null || file.isEmpty()) {
            throw new BusinessValidationException("El archivo CSV está vacío o no se ha proporcionado.");
        }

        // Validación de extensión profesional
        String fileName = file.getOriginalFilename();
        if (fileName != null && !fileName.toLowerCase().endsWith(".csv")) {
            throw new BusinessValidationException("Formato de archivo inválido. Solo se admiten archivos .csv");
        }

        try {
            byte[] fileBytes = file.getBytes();
            Charset charset = detectCharset(fileBytes);
            log.info("Procesando CSV '{}' con codificación detectada: {}", file.getOriginalFilename(), charset);

            final CSVParser parser = new CSVParserBuilder()
                    .withSeparator(';')
                    .build();

            try (CSVReader reader = new CSVReaderBuilder(
                    new InputStreamReader(new ByteArrayInputStream(fileBytes), charset))
                    .withCSVParser(parser)
                    .build()) {

                String[] row;
                int rowNum = 0;
                boolean headerSkipped = !skipHeader;

                while ((row = reader.readNext()) != null) {
                    rowNum++;
                    if (isRowEmpty(row)) continue;
                    
                    if (!headerSkipped) {
                        headerSkipped = true;
                        continue;
                    }

                    try {
                        rowProcessor.accept(row, rowNum);
                    } catch (Exception e) {
                        if (e instanceof RuntimeException) throw (RuntimeException) e;
                        throw new BusinessValidationException("Error en fila " + rowNum + ": " + e.getMessage());
                    }
                }
            }
        } catch (BusinessValidationException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error crítico procesando archivo CSV", e);
            throw new BusinessValidationException("Fallo al procesar el archivo CSV: " + e.getMessage());
        }
    }

    /**
     * Intenta detectar la codificación de caracteres (Charset) del archivo a partir de sus bytes.
     * <p>
     * Se prueba primeramente con UTF-8 de forma estricta. Si falla la decodificación (por ejemplo, debido
     * a tildes o caracteres especiales propios de exportaciones de Excel en español), se asume
     * automáticamente la codificación Windows-1252 (ISO-8859-1).
     * </p>
     *
     * @param bytes Arreglo de bytes que componen el contenido del archivo.
     * @return La codificación {@link Charset} detectada que debe utilizarse para la lectura.
     */
    private Charset detectCharset(byte[] bytes) {
        // 1. Intentar UTF-8 de forma estricta
        try {
            CharsetDecoder decoder = StandardCharsets.UTF_8.newDecoder();
            decoder.onMalformedInput(CodingErrorAction.REPORT);
            decoder.onUnmappableCharacter(CodingErrorAction.REPORT);
            decoder.decode(ByteBuffer.wrap(bytes));
            return StandardCharsets.UTF_8;
        } catch (Exception e) {
            // 2. Si falla el UTF-8 estricto (por tildes mal codificadas), asumimos Windows-1252 (estándar Excel ES)
            return Charset.forName("Windows-1252");
        }
    }

    /**
     * Lee y extrae todas las filas de un archivo CSV en memoria de forma completa.
     *
     * @param file El archivo CSV multipart a procesar.
     * @return Una lista en la que cada elemento representa una fila del CSV como un arreglo de cadenas.
     */
    public List<String[]> readAll(MultipartFile file) {
        List<String[]> rows = new ArrayList<>();
        process(file, false, (row, num) -> rows.add(row));
        return rows;
    }

    /**
     * Evalúa si una fila del archivo CSV se encuentra completamente en blanco (sin datos).
     *
     * @param row El arreglo de cadenas correspondiente a la fila actual.
     * @return {@code true} si la fila es nula, vacía o solo contiene espacios en blanco; de lo contrario, {@code false}.
     */
    private boolean isRowEmpty(String[] row) {
        if (row == null || row.length == 0) return true;
        for (String cell : row) {
            if (cell != null && !cell.trim().isEmpty()) return false;
        }
        return true;
    }

    /**
     * Interfaz funcional que define el contrato para el procesamiento individual de las filas de un archivo CSV.
     */
    @FunctionalInterface
    public interface RowConsumer {
        /**
         * Ejecuta una operación definida sobre una fila leída del CSV.
         *
         * @param row La fila en formato de arreglo de cadenas.
         * @param rowNum El número secuencial de la fila (1-indexed).
         * @throws Exception Si ocurre cualquier error durante el procesamiento que impida continuar de manera segura.
         */
        void accept(String[] row, int rowNum) throws Exception;
    }
}
