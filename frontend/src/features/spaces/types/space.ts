/**
 * Define los tipos de espacios soportados por el sistema.
 */
export type SpaceType = 'AULA' | 'LABORATORIO' | 'DESPACHO' | 'SALA_ESTUDIO' | 'SALON_ACTOS' | 'OTROS';

/**
 * Define los estados posibles en los que puede encontrarse un espacio.
 */
export type SpaceStatus = 'DISPONIBLE' | 'ELIMINADO';

/**
 * Representa la entidad de un Espacio dentro del sistema.
 */
export interface Space {
    /** Identificador único del espacio. */
    id: number;
    /** Nombre o nomenclatura asignada al espacio. */
    name: string;
    /** Clasificación funcional del espacio. */
    type: SpaceType;
    /** Capacidad máxima de aforo permitida. */
    totalCapacity: number;
    /** Número de equipos informáticos disponibles (opcional). */
    computerCount?: number;
    /** Identificador alfanumérico en el Sistema de Información Geográfica (opcional). */
    gisId?: string;
    /** Estado de operatividad actual del espacio. */
    status: SpaceStatus;
    /** Información complementaria o consideraciones especiales (opcional). */
    additionalInfo?: string;
    /** Indicador dinámico que señala si el espacio se encuentra ocupado en este momento. */
    occupiedNow?: boolean;
    /** Indicador dinámico que señala si el espacio se encuentra bloqueado actualmente. */
    blockedNow?: boolean;
}

/**
 * Interfaz genérica utilizada para estructurar las respuestas paginadas
 * proporcionadas por el marco de trabajo de Spring Boot en el backend.
 *
 * @typeParam T - El tipo de la entidad contenida en la respuesta.
 */
export interface PageResponse<T> {
    /** Arreglo que contiene los elementos de la página actual. */
    content: T[];
    /** Cantidad total de elementos disponibles en todos los registros. */
    totalElements: number;
    /** Cantidad total de páginas calculadas. */
    totalPages: number;
    /** Número de elementos solicitados por página. */
    size: number;
    /** Índice de la página actual (basado en cero). */
    number: number;
    /** Indica si la página actual es la primera del conjunto de resultados. */
    first: boolean;
    /** Indica si la página actual es la última del conjunto de resultados. */
    last: boolean;
    /** Indica si la página actual no contiene ningún elemento. */
    empty: boolean;
}
