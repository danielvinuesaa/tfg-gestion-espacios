/**
 * Mapeo de colores asociados a los distintos tipos de espacio.
 */
export const SPACE_TYPE_COLORS: Record<string, { bg: string, text: string }> = {
    'AULA': { bg: '#e8f0fe', text: '#1967d2' },
    'LABORATORIO': { bg: '#fef7e0', text: '#b06000' },
    'SALA': { bg: '#e6f4ea', text: '#137333' },
    'SALA_ESTUDIO': { bg: '#e6f4ea', text: '#137333' },
    'DESPACHO': { bg: '#f3e5f5', text: '#7b1fa2' },
    'SALON_ACTOS': { bg: '#fce8e6', text: '#c5221f' },
    'MULTIESPACIO': { bg: '#ede7f6', text: '#512da8' },
    'OTROS': { bg: '#f1f3f4', text: '#3c4043' }
};

/**
 * Mapeo de colores básicos asociados a los estados de una reserva.
 */
export const STATUS_COLORS: Record<string, string> = {
    'APROBADA': '#2e7d32',
    'SOLICITADA': '#1565c0',
    'BLOQUEO': '#455a64',
    'RECHAZADA': '#c62828',
    'CANCELADA': '#9e9e9e',
    'DEFAULT': '#757575'
};

/**
 * Mapeo de colores asociados a los tipos de reserva.
 */
export const RES_TYPE_COLORS: Record<string, string> = {
    'CLASE': '#7b1fa2',
    'EXAMEN': '#ffa000',
    'OTRO': '#00796b',
    'DEFAULT': '#616161'
};

/**
 * Mapeo de colores asociados a los estados físicos de un espacio.
 */
export const PHYSICAL_STATUS_COLORS: Record<string, { bg: string, text: string }> = {
    'DISPONIBLE': { bg: '#e6f4ea', text: '#137333' },
    'BLOQUEADO': { bg: '#fce8e6', text: '#c5221f' },
    'ELIMINADO': { bg: '#f1f3f4', text: '#70757a' }
};

/**
 * Mapeo de colores asociados a los estados dinámicos de disponibilidad de un espacio.
 */
export const DYNAMIC_STATUS_COLORS: Record<string, { bg: string, text: string }> = {
    'LIBRE': { bg: '#e6f4ea', text: '#137333' },
    'OCUPADO': { bg: '#fef7e0', text: '#b06000' },
    'BLOQUEO': { bg: '#fce8e6', text: '#c5221f' }, // Alias para consistencia en la UI
    'BLOQUEADO': { bg: '#fce8e6', text: '#c5221f' },
    'ELIMINADO': { bg: '#f1f3f4', text: '#70757a' }
};

/**
 * Obtiene los colores correspondientes al estado dinámico de un espacio.
 * 
 * @param status - El estado dinámico del espacio a evaluar.
 * @returns Un objeto que contiene los colores de fondo y texto.
 */
export const getDynamicStatusColors = (status: string) => {
    return DYNAMIC_STATUS_COLORS[status.toUpperCase()] || { bg: '#f1f3f4', text: '#3c4043' };
};

/**
 * Obtiene los colores correspondientes al estado físico de un espacio.
 * 
 * @param status - El estado físico del espacio a evaluar.
 * @returns Un objeto que contiene los colores de fondo y texto.
 */
export const getPhysicalStatusColors = (status: string) => {
    return PHYSICAL_STATUS_COLORS[status.toUpperCase()] || { bg: '#f1f3f4', text: '#3c4043' };
};

/**
 * Obtiene el color correspondiente al estado general de una reserva.
 * 
 * @param status - El estado de la reserva.
 * @returns El código hexadecimal del color.
 */
export const getStatusColor = (status: string) => STATUS_COLORS[status.toUpperCase()] || STATUS_COLORS['DEFAULT'];

/**
 * Obtiene el color correspondiente al tipo de reserva.
 * 
 * @param type - El tipo de reserva.
 * @returns El código hexadecimal del color.
 */
export const getTypeColor = (type: string) => RES_TYPE_COLORS[type.toUpperCase()] || RES_TYPE_COLORS['DEFAULT'];

/**
 * Obtiene los colores correspondientes al tipo de espacio.
 * 
 * @param type - El tipo del espacio a evaluar.
 * @param isMultiSpace - Indica si el espacio tiene funcionalidad de multiespacio.
 * @returns Un objeto que contiene los colores de fondo y texto.
 */
export const getSpaceColors = (type: string, isMultiSpace: boolean = false) => {
    if (isMultiSpace) return SPACE_TYPE_COLORS['MULTIESPACIO'];
    return SPACE_TYPE_COLORS[type.toUpperCase()] || SPACE_TYPE_COLORS['OTROS'];
};
