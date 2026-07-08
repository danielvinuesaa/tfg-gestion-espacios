/**
 * Define las interfaces estandarizadas utilizadas para representar los conflictos detectados
 * durante las operaciones de eliminación. Estas estructuras reflejan directamente
 * los modelos de respuesta generados por el backend (para Usuarios, Espacios, Roles, etc.).
 */

/**
 * Representa los detalles específicos de un conflicto detectado.
 */
export interface ConflictDetail {
    /** Identificador de la reserva que causa el conflicto. */
    reservationId: number;
    /** Nombre del espacio involucrado (opcional). */
    spaceName?: string;
    /** Nombre del usuario asociado a la reserva (opcional). */
    userName?: string;
    /** Fecha y hora de inicio de la reserva conflictiva (formato ISO). */
    startTime: string;
    /** Fecha y hora de finalización de la reserva conflictiva (formato ISO). */
    endTime: string;
    /** Estado actual de la reserva conflictiva. */
    status: string;
}

/**
 * Representa la respuesta global de conflictos al intentar eliminar una entidad.
 */

export interface EntityConflictResponse {
    hasConflicts: boolean;
    conflictCount: number;
    spaceNames?: string[];
    userNames?: string[];
    details: ConflictDetail[];
}
