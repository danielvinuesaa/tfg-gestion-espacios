package com.tfg.backend.modules.reservation.dto;
import com.tfg.backend.core.common.GenericImportResultDTO;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * Objeto de transferencia de datos que encapsula el resultado consolidado
 * obtenido tras ejecutar el proceso de importación masiva de reservas académicas.
 * Hereda propiedades genéricas para estructurar el reporte de éxito y errores.
 */
@Data
@SuperBuilder
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ReservationImportResultDTO extends GenericImportResultDTO<ReservationImportConflictDTO> {
}
