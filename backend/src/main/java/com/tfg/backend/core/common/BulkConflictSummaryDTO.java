package com.tfg.backend.core.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * Objeto de Transferencia de Datos (DTO) genérico para representar el resumen
 * de conflictos en operaciones masivas.
 * <p>
 * Proporciona una estructura uniforme para que la interfaz de usuario pueda procesar
 * impactos de borrado (tales como usuarios, reservas, entre otros) de forma consistente
 * y tomar decisiones informadas antes de confirmar la operación.
 * </p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkConflictSummaryDTO {
    /**
     * Número total de elementos seleccionados para la operación.
     */
    private int totalTarget;
    
    /**
     * Número de elementos que pueden ser procesados sin conflictos.
     */
    private int cleanCount;
    
    /**
     * Número de elementos que presentan conflictos (por ejemplo, aquellos que tienen reservas activas).
     */
    private int conflictCount;
    
    /**
     * Suma total de elementos afectados indirectamente (por ejemplo, el total de reservas a cancelar).
     */
    private long totalImpactedItems;
    
    /**
     * Lista detallada de los elementos que presentan conflictos junto con su impacto individual.
     */
    private List<ConflictDetailDTO> itemsWithConflicts;
}
