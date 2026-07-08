package com.tfg.backend.core.common;
import com.tfg.backend.core.util.CsvProcessor;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashSet;
import java.util.Set;
import java.util.function.Supplier;

/**
 * Clase base genérica para la importación masiva de datos desde archivos CSV.
 * <p>
 * Centraliza la gestión del flujo de lectura, la captura de errores a nivel de fila
 * y el recuento de resultados procesados.
 * </p>
 * 
 * @param <T> Entidad del dominio.
 * @param <C> Tipo de DTO de conflicto.
 * @param <R> Tipo de DTO de resultado (debe heredar de GenericImportResultDTO).
 */
@Slf4j
public abstract class BaseCsvImportService<T, C, R extends GenericImportResultDTO<C>> {

    /**
     * Procesador encargado de la lectura y extracción de datos del archivo CSV.
     */
    protected final CsvProcessor csvProcessor;

    /**
     * Constructor del servicio base para la importación de archivos CSV.
     *
     * @param csvProcessor El componente procesador de archivos CSV.
     */
    protected BaseCsvImportService(CsvProcessor csvProcessor) {
        this.csvProcessor = csvProcessor;
    }

    /**
     * Orquestador principal del proceso de importación y validación del archivo.
     *
     * @param file El archivo a procesar.
     * @param resultSupplier Un proveedor de instancias para el objeto de resultado.
     * @param processor La interfaz de procesamiento específico que se aplica a cada fila.
     * @return El objeto de resultado poblado con los éxitos, fallos y conflictos.
     */
    protected R processFile(MultipartFile file, Supplier<R> resultSupplier, RowProcessor<T, C, R> processor) {
        R result = resultSupplier.get();
        Set<String> processedKeys = new HashSet<>();

        csvProcessor.process(file, true, (row, rowNum) -> {
            try {
                validateRowStructure(row);
                T entity = mapRowToEntity(row);
                processor.process(entity, result, processedKeys, row);
            } catch (Exception e) {
                log.debug("Error procesando fila {}: {}", rowNum, e.getMessage());
                result.addError("Línea " + rowNum + ": " + e.getMessage());
            }
        });

        return result;
    }

    /**
     * Valida si la fila posee el número de columnas y el formato estructural básico requerido.
     *
     * @param row Arreglo de cadenas que representa una fila del CSV.
     */
    protected abstract void validateRowStructure(String[] row);

    /**
     * Convierte los datos de una fila del CSV en una instancia de la entidad de dominio.
     *
     * @param row Arreglo de cadenas que representa una fila del CSV.
     * @return Una instancia de la entidad con los datos mapeados.
     */
    protected abstract T mapRowToEntity(String[] row);

    /**
     * Interfaz funcional interna que define la lógica de negocio a aplicar en cada fila procesada.
     *
     * @param <T> El tipo de la entidad procesada.
     * @param <C> El tipo de conflicto reportado.
     * @param <R> El tipo de resultado consolidado.
     */
    @FunctionalInterface
    protected interface RowProcessor<T, C, R> {
        /**
         * Procesa una fila del CSV, validada y mapeada, y acumula su resultado.
         *
         * @param entity La entidad extraída de la fila.
         * @param result El contenedor de resultados globales.
         * @param processedKeys Conjunto de claves ya procesadas para evitar duplicados en la sesión.
         * @param rawRow Los datos brutos originales de la fila leída.
         */
        void process(T entity, R result, Set<String> processedKeys, String[] rawRow);
    }
}
