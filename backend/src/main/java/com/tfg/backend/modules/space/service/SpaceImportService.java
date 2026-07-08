package com.tfg.backend.modules.space.service;
import com.tfg.backend.core.common.ImportResultDTO;

import org.springframework.web.multipart.MultipartFile;

/**
 * Interfaz de servicio especializado en la importación y exportación masiva de espacios.
 * Su propósito es desacoplar el procesamiento de archivos estructurados del servicio principal de gestión de negocio.
 */
public interface SpaceImportService {

    /**
     * Valida la estructura y el contenido de un archivo CSV en busca de posibles conflictos
     * previos a la importación, sin aplicar cambios en la base de datos.
     *
     * @param file El archivo multipart que contiene los datos a validar.
     * @return Un objeto {@link ImportResultDTO} con el resultado detallado de la validación.
     */
    ImportResultDTO validateCsv(MultipartFile file);

    /**
     * Ejecuta la importación definitiva de los espacios contenidos en un archivo CSV.
     * Permite la sobrescritura de registros existentes en caso de conflicto si así se especifica.
     *
     * @param file      El archivo multipart con los datos a importar.
     * @param overwrite Indica si se deben sobrescribir los espacios que ya existen en el sistema.
     * @return Un objeto {@link ImportResultDTO} con el resumen de la operación de importación.
     */
    ImportResultDTO importFromCsv(MultipartFile file, boolean overwrite);

    /**
     * Exporta el conjunto de todos los espacios registrados en el sistema a un formato tabular (CSV).
     *
     * @return Un arreglo de bytes que representa el archivo generado, apto para su descarga.
     */
    byte[] exportToCsv();
}
