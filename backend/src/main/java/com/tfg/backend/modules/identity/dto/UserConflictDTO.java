package com.tfg.backend.modules.identity.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

/**
 * Objeto de Transferencia de Datos (DTO) que representa el resumen de conflictos
 * detectados al intentar realizar operaciones sobre un usuario (como su eliminación).
 */
@Data
@Builder
public class UserConflictDTO {
    
    /**
     * Indica si se han detectado conflictos que impiden la operación.
     */
    private boolean hasConflicts;
    
    /**
     * Número total de conflictos encontrados.
     */
    private int conflictCount;
    
    /**
     * Nombres de los espacios (ej. aulas, laboratorios) relacionados con los conflictos.
     */
    private List<String> spaceNames;
    
    /**
     * Lista detallada de los conflictos individuales detectados.
     */
    private List<UserConflictDetailDTO> details;
}
