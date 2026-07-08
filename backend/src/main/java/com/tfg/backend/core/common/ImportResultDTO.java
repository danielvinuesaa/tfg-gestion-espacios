package com.tfg.backend.core.common;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * Objeto de Transferencia de Datos (DTO) que representa el resultado específico
 * para la importación de espacios, heredando la estructura genérica de resultados.
 */
@Data
@SuperBuilder
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ImportResultDTO extends GenericImportResultDTO<ImportConflictDTO> {
}
