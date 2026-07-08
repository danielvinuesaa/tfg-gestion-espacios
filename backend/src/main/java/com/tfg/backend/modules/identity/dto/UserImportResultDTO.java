package com.tfg.backend.modules.identity.dto;
import com.tfg.backend.core.common.GenericImportResultDTO;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * Objeto de Transferencia de Datos (DTO) que encapsula el resultado integral
 * de una operación de importación masiva de usuarios desde un archivo externo (ej. CSV).
 * Extiende la funcionalidad genérica de importación adaptándola a conflictos de usuario.
 */
@Data
@SuperBuilder
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class UserImportResultDTO extends GenericImportResultDTO<UserImportConflictDTO> {
}
