/**
 * Representa el impacto individual de un elemento en conflicto.
 */
export interface BulkConflictDetail {
    /** Identificador del elemento en conflicto. */
    id: number;
    /** Nombre o descripción del elemento. */
    name: string;
    /** Número de elementos dependientes o impactados. */
    impactCount: number;
}

/**
 * Resumen genérico de conflictos para operaciones masivas.
 * Estructura unificada para Roles, Espacios y Usuarios.
 */
export interface BulkConflictSummary {
    /** Total de elementos seleccionados */
    totalTarget: number;
    /** Elementos sin conflictos */
    cleanCount: number;
    /** Elementos con conflictos detectados */
    conflictCount: number;
    /** Suma total de ítems afectados indirectamente (ej: reservas) */
    totalImpactedItems: number;
    /** Lista detallada de conflictos */
    itemsWithConflicts: BulkConflictDetail[];
}
