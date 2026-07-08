package com.tfg.backend.modules.reservation.service;
import com.tfg.backend.modules.reservation.dto.ReservationImportResultDTO;

import org.springframework.web.multipart.MultipartFile;

/**
 * Interfaz que define el contrato de servicios destinados a la carga e importación masiva
 * de registros de reservas desde fuentes externas de datos.
 */
public interface ReservationImportService {
    
    /**
     * Somete a validación estructural y semántica el archivo provisto sin realizar alteraciones
     * persistentes sobre la base de datos, con el propósito de prever posibles conflictos.
     *
     * @param file El archivo que contiene el conjunto de datos de las reservas.
     * @return Un objeto de transferencia (DTO) que describe los resultados del proceso de validación.
     */
    ReservationImportResultDTO validateFromCsv(MultipartFile file);

    /**
     * Lleva a cabo la importación y persistencia definitiva de las reservas contenidas en el archivo
     * dentro de la base de datos del sistema, evaluando posibles políticas de sobreescritura o tolerancias.
     *
     * @param file El archivo fuente que contiene los datos.
     * @param userEmail La dirección de correo electrónico del usuario que ejecuta la operación.
     * @param ignoreConflicts Bandera booleana para instruir al sistema a forzar la importación, 
     *                        ignorando las advertencias de solapamiento temporal.
     * @return Un objeto (DTO) con las métricas finales y detalles de la ejecución de la importación.
     */
    ReservationImportResultDTO importFromCsv(MultipartFile file, String userEmail, boolean ignoreConflicts);
}
